# 联合评审处置与修订安排

## 最终处置：A2.2-review-2（此前计划与补充保留为历史）

用户已明确授权架构师直接处置本包。已完成实际设计/生成器/类型/参考模型与夹具修改，当前111 Rec、31 OP、19组参考夹具及严格TypeScript检查通过。已批准PRD/FSD与schema2.0抽取保持原样。

|项|A2-review-1独立结论|A2.2已落实的结果|当前状态|
|---|---|---|---|
|AR01|部分修复|RuntimeEnvelope组合到发生/命令，scope/fence原子入口；RuleState保留ordinal；发生链与未知结果恢复夹具|联合复核设计级关闭|
|AR02|部分修复|保留Session初始场景/版本/算法/参数；Checkpoint隔离及reset恢复检查|联合复核设计级关闭|
|AR03|待决策|Q/阻抗单一权威、UPS/电池层级拆分；2.1候选补全规划六项条件|公开契约待批准，不关闭|
|AR04|部分修复|禁止覆盖不同内容的configRevision/entityRevision；同内容重试无副作用，旧版保持不变|联合复核设计级关闭|
|AR05|部分修复|按Ts/DateOnly类型路径验证真实日期；trustedEnvelope提供项目/会话/代次索引，解码重新核对|联合复核设计级关闭|
|AR06|可设计级关闭|唯一键projectId+operationId；绑定及cleanup例外保持|设计级关闭；FIN实现仍待G1|
|AR07|部分修复|OP07传递原动作业务owner拒绝结果，保留journal owner和原mode检查|联合复核设计级关闭|
|AR08|可设计级关闭|独立bootstrap路由/类型，无业务信息；完整能力接口严格校验|设计级关闭|

主要交付：persistence-design.md / persistence-contracts.ts、revision-a2.cjs及生成的Trio/manifest/operations/handlers、record-codecs.json / record-codec.cjs、contract-model.cjs / test-revision-a2.cjs、fsd-change-proposal.md。19组结果见revision-a2-tests.json，工具范围见VALIDATION.md。整体尚不冻结，AR03的公开决策与G1不以自检替代。

### 最终联合结论与证据归属

2026-09-15，评审任务01a09ef7-1d60-74b2-a9a2-71560b936c52代表评审与开发正式确认：AR01/02/04/05/07设计级关闭，AR06/08维持前轮关闭；合计7项关闭、AR03待决。两方分别拦截输出写入后独立重跑111 Rec/31 OP及19组参考夹具通过。开发另外重放旧版覆盖、非法start/公历日期、OP07原OP18 owner拒绝、可信envelope及跨项目拒绝反例通过。TypeScript检查、11文件重复生成、FIN Expert两Trio是架构师自检，不写成联合实测。

冻结实现证据SHA256：contract-model.cjs 7b6f8205df72dfcdd9b54a6c6e5955445a2bd0828e45489b6b64e0ae05b5ed16；record-codec.cjs 4c0671a1e58e7852e4292453473664669149e18c641b9aa92cc58f4dc30f31f3；persistence-contracts.ts 2b520ff658cd1b500f64b57fc7d4e3158eef5071db627f8a415e0a7667c67969。本次结论登记只更新报告，不改这些实现证据。

**非阻断实现交接项**：RuleStateRecord为最小恢复类型，不是完整运行存储schema；开发须合并目录/Trio的候选、计数、epoch等字段到runtime validator/codec。内部currentOccurrenceId与模板occurrenceId表示同一当前检测发生指针，codec统一映射，禁止保存为两个独立权威字段。该项不重开设计审批，但后端验收必须检查。

AR03已另成[2.1候选包](../schema2.1-candidate/README.md)及候选类型，不被当前生成器或处理器加载。批准前现有FSD修订9/schema2.0不变；不得把7项设计关闭解释为AR03批准、整个后端已实现或FIN生产验收通过。

规划最新只读确认该独立候选包可以提交用户进行方案/范围决策；旧版OP16/OP07报表兼容及BatteryAsset证据到期投影已补入候选验收条款，正式validator/迁移验证仍需获批后实施。规划未执行编译测试；候选TypeScript检查由架构师执行。

---

## 原轮次处置计划（历史记录，状态以上表为准）

日期：2026-09-15。责任角色：软件架构师。

依据：../../reviews/architecture-fsd-r9-joint-review.md。接受全部8项；当前均未关闭，当前架构交付保持设计草案，不冻结为后端完整实现设计。已批准PRD/FSD与DEMO保持原基线。本文件是处置决定和工作分配，不是完成证据。

|编号|结论与理由|计划修改文件|责任模块|关闭证据与复核责任|
|---|---|---|---|---|
|AR-01 高|接受。单个RuleState发生指针与hash不能还原多次未同步发生；需要独立、不可变发生和命令载荷语义。|build-delivery.cjs、business-objects.trio、record-manifest.json、model-catalog.md；新增persistence-contracts.ts及故障夹具|架构定义RuleOccurrence/CommandPayload、RuleEngine、AlarmCoordinator、Repository；开发实现|A创建未知后发生B/C、A清除未知后发生C的持久化快照→重启重建；检查ordinal、previousOccurrenceId、原始起止、前置命令及目标sourceAlarmId。开发复现，评审核对FSD7.4。|
|AR-02 高|接受。公开SimSession不等于模拟引擎恢复状态，seed加当前场景不足以重放局部设备场景变化。|同上；新增SimulationScenarioEvent/Checkpoint契约与推进夹具，参考DEMO simulation-service.js但不改DEMO|架构定义SimulationService、VirtualClock、Repository协议；开发迁移|固定initialScenario/生成参数、逐设备分配、virtualEffectiveAt/eventSeq/参数日志和已提交水位；60秒一步与60次1秒及三种速度结果一致；分片中断恢复无漏重，reset回原始初态。|
|AR-03 高|接受。新增内部Rec没有确定公开配置入口，且整机/电池作用域混合。不能以直接写Rec补洞。|新增fsd-change-proposal.md；修订model-catalog.md、生成器及接口清单；公开contracts.ts在变更批准前不改|架构提出字段归属与兼容方案；规划与设计确认需求；开发实现ConfigurationService/InventoryService投影|先确认公开差异，再验证额定值、Q、电池属性及环境关联的编辑→校验→发布→回退，Dashboard/规则同源；跨对象范围拒绝。未获需求决策前此项保持待决策。|
|AR-04 高|接受。已有upsConfigRef不能代替确定性集合重建算法。|生成器、业务Trio、manifest、模型目录、persistence-contracts.ts|ConfigurationService、ConfigRepository、PublicationCoordinator|采用不可变全量版本清单引用不可变EntityVersion；定义实体键/版本、删除、省略保留和规范化hash。A/B并发、实体删除、COMMITTED后重启与范围回退夹具证明唯一重建及无权对象保留。|
|AR-05 中|接受。顶层Ref闭合检查范围不足，通用字段转换与实际例外未形成机器契约。|新增record-codecs.json、codec实现/夹具；修订validate-delivery.cjs、生成器、模型目录|RecCodec、ImportRemapper、SchemaValidator|Enrollment/Rule/Capability/ReportJob roundtrip；仅声明语义Ref路径递归重映射；漏改嵌套objectRef负例必须失败；覆盖0/false/null/Date/DateTime/Ref/List、额外字段与枚举拒绝。|
|AR-06 高|接受。三个幂等定义冲突，应回归FSD项目+operationId，actor/action/context绑定而非扩展主键。|模型目录、接口清单、生成器、operations.json、persistence-contracts.ts、幂等夹具|RequestFacade、OperationRepository、SimulationService|唯一键固定projectId+operationId；已绑定actor不同拒绝且不泄露记录；同actor改变action/目标/body/context冲突；create重复复用，reset/delete旧代次只定位同一已登记操作、不执行新副作用。按FSD19.7明确查找顺序。|
|AR-07 中|接受。机器清单只有live权限，不足以派生模式授权；不认定已发生运行漏洞。|operations.json、生成器、接口清单；新增权限矩阵夹具|RequestFacade、AuthorizationPolicy、SourceRouter|allowedContexts、permissionByMode、范围/owner、管理权限蕴含及外发限制按FSD10.1逐项编码；simulation.read/ack/export/manage与live权限正反例；模拟不得取得真实确认/传输能力。|
|AR-08 中|接受。bootstrap需要独立于WireRequest的类型及路由，不能要求先有schema/context。|handlers.ts、operations.json、生成器、接口清单；新增bootstrap契约夹具|RequestFacade、BootstrapEndpoint|无版本GET只输出支持版本/升级提示；不含actor/permissions/site/session业务信息。版本化能力POST继续认证与严格schema2.0；无版本/旧版/有效版/未登录矩阵可判定。|

## 修订顺序与交接

1. 架构先提交AR-03公开差异提案给规划与设计、评审，明确它是需求澄清候选，不修改已批准正文。Q和阻抗基准优先复用现有Rule字段作为唯一权威，避免双写；额定值、电池属性与环境关联逐项决定平台主数据绑定或新增公开编辑字段。
2. 架构并行准备不依赖该决策的AR-01/02/04/06持久化协议；选用可替换存储接口，不虚构目标FIN事务保证。
3. 架构完成AR-05/07/08机器契约与静态/纯逻辑正反例；通过生成器统一更新衍生文件。保留contracts.ts从批准FSD逐字提取规则，内部契约另放文件。
4. 开发对模型可实现性、DEMO迁移和故障夹具做独立复核；评审按八项关闭标准逐项判定。架构汇总证据后向Teamleader申请设计冻结，未经复核不自行标关闭。

本轮无现场导入、设备写入、真实Telegram发送或提交推送安排。FIN版本/原子性/告警追补/模拟容量/secrets与文件服务另列G1试验，不以G1未知替代上述设计整改。

## 开发只读复核补充（已接受，待实施验证）

开发确认处置计划可实现、覆盖八项，无新增阻断项；以下纳入原关闭条件，不另增审批或改变严重度。全部问题仍未关闭。

- **AR-01**：不可变的是发生身份与已创建命令payload；发生结束时间等后续事实采用追加生命周期事件或CAS版本化记录，不能冻结整条发生记录后无法记录结束。ordinal分配、RuleState水位、Occurrence变化与命令入队同属Tx-Rule。增加outbox满/落库失败时水位不前移，以及发送后、结果落盘前崩溃的对账夹具。
- **AR-02**：checkpoint与对应样本、规则/告警结果及eventSeq具有同一提交边界，带generation和worker栅栏。保留初始场景版本与生成算法版本。增加checkpoint提交前/后崩溃及reset后旧worker迟到写入夹具；步长/速度等价比较事件ID、发生次序和样本内容，不仅比较最终快照。
- **AR-04**：完整清单及全部EntityVersion持久化且验证完成后才能PREPARED/COMMITTED；规范hash覆盖确定排序的实体身份、版本和内容。清单引用缺失/hash不符必须拒绝激活，COMMITTED后不能退回旧版伪装成功。先定义版本回收条件，保留被未决操作、历史映射和允许回退范围引用的版本。
- **AR-06/07**：稳定operationId查找例外仅用于已登记reset/delete的原操作者、原动作、原请求；仍检查当前会话身份和当前授权。此例外不放行旧generation的新变更，也不成为通用代次绕过入口。OP-07按原动作及原mode重新鉴权，不能使用独立静态权限字符串替代。
- **AR-08**：bootstrap保持独立于完整能力DTO，不输出业务身份、站点或权限数据。
- **AR-03**：Q/阻抗基准的单一权威方案必须明确Dashboard按equip及当前配置中的规则版本读取；缺失或禁用如何投影需在差异提案中说明，不另建UI可编辑参数源。

此补充记录开发复核意见被接受，不表示上述协议、模型或故障夹具已经实现。
