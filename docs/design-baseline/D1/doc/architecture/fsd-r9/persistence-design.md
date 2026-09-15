# A2 持久化、恢复与接口执行协议

本文件为架构设计，依据FSD修订9的7.4、8、9.4、10.1、19.7/19.8。内部类型在persistence-contracts.ts；contract-model.cjs为可执行参考模型，模拟原子事务和故障注入，不是FIN后端实现。目标SDK必须在G1证明相同保证，未证明前不开真实副作用。

### A2.2 服务端运行记录隔离入口

所有RuleState/RuleOccurrence/RuleCommand组合RuntimeEnvelope：projectId/revision/context/workerFence。context是live或带sessionId/generationId的simulation；自然键前缀为(projectId,live)或(projectId,simulation,sessionId,generationId)。actor/project/context取服务端授权后的DataRouter，不采信客户端标签。模拟事务进入Repository.transactRuntime（参考模型scopedTx）时原子比较完整scope及workerFence，再执行领域变更；失败无记录写入。生产代码不得直接调用无scope的Store.tx；参考模型detect等纯领域函数假设已经过此入口，不能单独作为Web处理器。

模拟Session管理记录保存initialScenarioId/version、generatorVersion及initialGenerationParameters，跨reset保留；Checkpoint只保存执行水位，删除旧Checkpoint不删除Session初始参数。RuleState持久化lastOccurrenceOrdinal，与发生分配同事务且重启恢复。模板目录和Trio必需字段已同步。

## AR-01：发生链与命令

RuleState按project/equip/rule/version持有主输入水位、候选、lastOccurrenceOrdinal及当前检测发生；RuleOccurrence独立保存每次发生，唯一project/occurrenceId。身份、ordinal、previousOccurrenceId和起始时点不可改；结束时点、当前严重度、sourceAlarmId通过预期revision的CAS更新。结束时点只能由null变为事实时间，不能因重试重写。命令payload不可变，包含原始eventAt、startedAt、严重度、目标发生、规则版本和correlationKey；hash用于完整性，不能代替payload。

Tx-Rule原子写集合：已处理水位、候选/级别、发生ordinal分配、发生新建/结束、命令及序号分配。outbox满（10000待处理项）或任一持久化失败全部回滚；同一输入可重新处理，不先推进RuleState。A创建未知仍允许本地B/C发生与结束落盘，容量失败则显式降级而不伪造成功。

领取规则：PENDING或已明确未执行且退避到期的命令可竞争CAS为DISPATCHING；同发生前置commandSeq必须APPLIED；后一CREATE必须等待前一发生的CLEAR APPLIED。每发生至多一个在途；已APPLIED不可再次领取。CLEAR/SEVERITY只解析自身Occurrence的sourceAlarmId，绝不使用当前RuleState的源ID。CREATE未回读源ID不得外发后续命令。DISPATCHING在重启恢复为OUTCOME_UNKNOWN，先按稳定correlationKey只读核对；不能按相似标题认定成功。APPLIED、源ID和AlarmAssociation同事务提交；回读不能确定则保留未知。每30秒核对，20次无结论转人工对账，不自动重发未知命令。明确未执行按2/5/10/30秒退避。

## AR-02：模拟日志与检查点

Session保存不变的初始seed/startAt/初始场景版本/生成算法版本/生成参数。ScenarioEvent逐条保存目标设备、场景版本、参数、virtualEffectiveAt、eventSeq及controlRevision；普通场景修改只追加日志，不改初始场景。Checkpoint保存逐设备assignment、采样水位、完整事件时点、已提交eventSeq、nextEventSeq、规则状态引用和batchId。

时间推进遍历(current,lastTarget]所有到期事件，按时间→场景/源采样/质量/日历/规则/历史顺序→设备/规则ID→eventSeq排序。单个时点的所有事件和结果是最小原子单元；不得在同一时点半途发布virtualTime。分片Tx-Sim同时提交样本、规则/告警/outbox、assignment、Checkpoint及dataRevision。所有记录含session/generation；worker必须提交领取时的workerFence。检查点前故障回滚整个分片；提交后重试通过持久化时点和事件ID去重。不得先把virtualTime写到目标终点。

reset屏障同事务换generation、递增workerFence/controlRevision、记录cleanup和旧代次，再停止新读取/任务。清理包括ScenarioEvent、Checkpoint、Sample、模拟RuleState/Occurrence/Outbox、Alarm、ReportJob/文件、NotifyJob、缓存/游标；初始生成参数保存在会话管理记录中，reset完成重新从原初态generate。保留90天管理journal/墓碑。旧worker即使有成功计算结果也因代次或fence不匹配拒绝提交；删除后不恢复旧业务数据。真实receivedAt/管理调用计数不作为步长等价比较项。

## AR-04：确定性配置集合

选择全量版本清单，不用链式patch重放作为恢复权威。ConfigVersion.members每项为entityId/entityRevision/entityVersionRef/contentHash；对应不可变EntityVersion保存完整Entity。未修改实体复用旧EntityVersion，删除实体从新清单省略，历史清单不变；patch省略始终保留，不解释为删除。新清单每entityId仅一项。

规范化：对象键按UTF-16代码单元序排序（与参考实现JS sort一致）、数组保持语义顺序、成员按entityId排序、有限JSON数值、禁止undefined/NaN/Infinity；内容hash为规范UTF-8 JSON的SHA-256。实体hash覆盖entityId/entityRevision/entityType/payload；集合hash覆盖完整排序成员及每项实体内容（版本Ref仅为存储定位，不能替代实体内容校验）。身份/类型变化也改变hash。

configRevision不得覆盖已有不同内容；(entityId,entityRevision)同样不得重新绑定不同内容，跨所有保留版本检查。相同revision及相同完整内容重试仅返回ALREADY_APPLIED，不移动当前Pointer、不重开副作用、不重新审计为新发布；同内容幂等也须当前授权。不同内容返回版本冲突。新版本才执行base Pointer CAS及提交决定。

写完全部EntityVersion→验证每个hash和引用→写SEALED全量清单→模块PREPARED；未满足禁止COMMITTED。提交CAS比较ActivePointer.baseRevision；A站点先提交导致B旧base冲突。合并patch前验证旧/新对象双边范围，引用范围及删除依赖；无权实体逐字保留。Tx-Publish包含Pointer、COMMITTED决定、Mapping有效边界、迁移决定和审计。重启仅从Pointer读取SEALED清单并逐项校验；缺失/损坏进入RECOVERY_REQUIRED，不选LastSuccessful或旧版伪装运行。

回退仅比较当前授权scope内目标历史实体，产生add/update/remove新patch；对当前scope外对象不作操作，不直接倒写Pointer。GC先做可达性标记：活动/LastSuccessful、未决Publication/Operation、RuleOccurrence/命令、历史MappingInterval、有效回退保留窗口、验收/审计保留策略引用均为根；无引用且超过已批准保留期才候选清理。保留期未知时不清理；无自动删除脚本。

## AR-05：规范运行codec与模板导入

record-codecs.json由批准FSD类型生成严格结构schema，当前可执行codec覆盖Enrollment、Rule、Capability、ReportJob及Plan（Date测试）。运行Rec不复用A1零散模板标签：固定id、upsRecordType、upsSchemaVersion、upsPayloadJson、指定顶层索引标签。payload中Ref仍为不透明字符串，只有声明的semanticRefFields递归路径才重映射；证据文本、logical ID、operationId和版本不会全局替换。

codec先验证完整JSON类型、必填/可空/额外字段/有限数/日期，再按索引表投影Ref/枚举/时间/所有者；解码核对索引与payload相等，索引不一致拒绝。Folio Ref包装在JSON交换模型中表示为{ref:...}，实际平台Ref对象由目标适配器转换；Date/DateTime只在明示类型及格式验证后转换，不从字符串猜类型。模板的upsItemsJson有显式items[*].objectRef/evidenceRef语义路径；嵌套旧Ref必须与manifest内真实Ref集合闭合。

A2.2运行codec还要求服务端trustedEnvelope入参：projectId/mode，模拟另有sessionId/generationId。编码生成upsProjectId/upsSourceMode/upsSimulationSessionId/upsGenerationId索引，ReportJob.context必须与之相等；解码必须提供当前受权envelope并逐字段匹配，防止读取其他项目/会话/代次。公开DTO不新增projectId。格式schema从FSD属性的Ts/DateOnly声明生成semanticFormat，覆盖ReportParams.start/end等嵌套路径；逐项验证真实公历、时分秒和UTC偏移，不用Date.parse自动规范化非法日期。允许Z或±HH:mm且偏移绝对值≤14:00，秒0～59；不自动转换无时区字符串。

运行codec只覆盖已列类型，不宣称整个后端序列化完成。其他内部模型由persistence-contracts.ts明确字段，后端实现时须扩充同一registry，禁止回落到通用猜测。模板upsParametersJson内逻辑mappingId/planId必须走逻辑ID解析表，不能当作Folio Ref重映射。

## AR-06：稳定操作身份及请求顺序

唯一键只有(projectId,operationId)，不同actor或action不能建立同ID第二条。服务端验证登录项目、schema、请求结构、context/body一致性后定位journal；当前授权必须成立。存在记录：其他actor返回OBJECT_UNAVAILABLE；同actor但action/目标/规范请求hash/context不同返回IDEMPOTENCY_CONFLICT。相同已登记请求先返回原状态，再考虑expectedRevision冲突，避免重试执行副作用。记录整个规范请求（含schema/context/action/body）hash，排除传输requestId/服务端receivedAt；不排除业务字段。

simulationCreate的原context是root，不把创建后sessionId塞回原绑定；同请求复用同一结果。当前用户create权限仍需检查。reset/delete的原body/context保持旧generation，不随屏障改写journal；相同原操作重试只能返回该登记操作，不能执行新变更。OP-07旧context例外仅原cleanup operationId、原actor、原session、原context且当前manage/ACL仍有效，返回脱敏清理状态而非旧代次业务结果；其余旧generation拒绝GENERATION_MISMATCH/SESSION_DELETED。OP-07没有独立权限：按原action及原mode授权，并检查journal所有权。墓碑与管理操作保留90天；过期ID不能通过错误恢复假定旧操作成功。

## AR-07/08：授权清单与bootstrap

operations.json列出allowedContexts/permissionByMode/simulationAcl/owner/root条件及幂等绑定。账号simulation.manage蕴含read/ack/export，但会话ACL也必须分别满足或有manage；live权限不跨模式。root只允许OP-01、23、30 list。OP-19/31不允许simulation；OP-21模拟仅本地重试。授权器仍须接收服务端逐对象范围检查结果，不能把权限字符串等同整个授权。

OP-07同时检查journalOwner（原actor）与原动作要求的业务对象owner；递归到原动作时必须传递owner拒绝结果，不能硬置true。原mode也须等于当前查询模式；不满足时在返回原操作内容前拒绝。

GET /upsFleet/api/bootstrap只提供supportedSchemaVersions和英文升级提示，无业务数据，可未登录调用，不要求context/body。完整POST sessionCapabilities仍必须登录及schema2.0/context；旧版报SCHEMA_VERSION_UNSUPPORTED，无版本完整POST同样拒绝，未登录完整POST为UNAUTHENTICATED。成功bootstrap不授予任何业务权限。

## G1 可执行验收方案（尚未现场执行）

|门槛|试验与证据|失败处置|
|---|---|---|
|事务/CAS/唯一键|两worker抢同key；每个写点故障注入；重启核对无半事务；记录FIN build/SDK/日志|禁真实变更，评审替代存储|
|告警身份/对账|CREATE已执行后断连接，查询唯一关联并恢复；短暂发生/恢复追补|禁自动规则外发，不猜测同名告警|
|模拟容量|5会话各100万样本，与5000点、2报表worker共载；测峰值内存/磁盘、清理速度与p95|未达标先提出容量/存储调整，不承诺支持|
|秘密/文件/生命周期|撤权下载、越代次文件、secret日志扫描、启停与72小时浸泡|阻断发布并保留故障证据|
