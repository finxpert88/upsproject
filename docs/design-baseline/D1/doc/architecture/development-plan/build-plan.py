"""开发规划文档工具；不生成应用代码，不改冻结设计。"""
from pathlib import Path
import json,re,hashlib,subprocess
P=Path(__file__).resolve().parent;ROOT=P.parents[2];B=ROOT/'doc/architecture/fsd-r9';A=ROOT/'doc/architecture/application-blueprint'
assert subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()=='feature/fsd-r4-static-demo'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def put(f,v):(P/f).write_text(v if isinstance(v,str) else json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def table(h,rows):return '| '+' | '.join(h)+' |\n|'+'|'.join(['---']*len(h))+'|\n'+''.join('| '+' | '.join(str(x).replace('\n','<br>') for x in row)+' |\n' for row in rows)
tasks=[]
def task(id,title,deps,ops,sf,files,tests,done,gate):tasks.append(dict(id=id,title=title,dependencies=deps,operations=ops,functionalSpecifications=sf,plannedFiles=files,acceptanceReferences=tests,definitionOfDone=done,gate=gate,implementer='开发',reviewer='评审代码和文档',verificationOwner='测试',status='待Leader下发'))
O=lambda *n:[f'OP-{x:02}' for x in n];S=lambda *n:[f'SF-{x:02}' for x in n]
task('DEV-01','最小单POD构建＋一项真实Fantom新鲜度行为',[],[],[],['upsFleet/build.fan','upsFleet/fan/domain/telemetry/QualityEvaluator.fan','upsFleet/test/domain/QualityEvaluatorTest.fan','scripts/build.ps1','scripts/test.ps1'],['FT-01'],'在隔离输出目录产出一个可读元数据的upsFleet.pod；真实Fantom测试通过，缓存重读不推进源时间；提交命令、退出码、版本和产物哈希。','候选本地SDK可离线使用；先验证输出隔离，禁止安装和启用插件')
task('DEV-02','公开契约、入口守卫与操作意图基础',['DEV-01'],O(1,7),[],['upsFleet/fan/web/RequestFacade.fan','upsFleet/fan/web/RequestGuard.fan','upsFleet/fan/web/DtoCodec.fan','upsFleet/fan/persistence/OperationRepository.fan','upsFleet/ui/src/api/operationClient.js'],['FT-07','FT-12','FT-35'],'62个契约索引按OP键、31方法映射正确；bootstrap与完整会话接口分开；原操作绑定/权限/unknown核对通过正反例。','纯契约先做；真实身份和持久化入口等待G1能力证据')
task('DEV-03','Folio编码、模板隔离和事务能力适配',['DEV-02'],[],[],['upsFleet/fan/persistence/RecordCodec.fan','upsFleet/fan/fin/FinGateway.fan','upsFleet/res/models/equipment-objects.trio','upsFleet/res/models/business-objects.trio'],['FT-24','FT-29'],'111模板逐条引用与嵌套引用正确；worker排除模板；完整RuleState编码；确认CAS/原子性后才启用写入。','纯编码可先做；事务/唯一性/授权G1未证实时写入关闭')
task('DEV-04','设备目录、遥测与仪表盘只读垂直切片',['DEV-02','DEV-03'],O(2,3,22),S(1,2,3,4,5),['upsFleet/fan/services/inventory/InventoryService.fan','upsFleet/fan/services/telemetry/TelemetryService.fan','upsFleet/fan/fin/LiveDataSource.fan','upsFleet/ui/src/pages/DashboardPage.js','upsFleet/ui/src/pages/EquipmentPage.js'],['FT-01','FT-03','FT-13','FT-32','FT-34','UI-01','UI-12'],'一台授权设备经归一化来源到真实API再到六卡仪表盘；时间质量和空数据正确；无权限泄漏；共享采集不随会话倍增。','FIN点值/身份只读绑定需G1；可先以显式测试夹具跑契约但不能称真实集成')
task('DEV-05','历史分段与趋势',['DEV-04'],O(4),S(6),['upsFleet/fan/services/history/HistoryService.fan','upsFleet/ui/src/pages/HistoryPage.js'],['FT-11','FT-31'],'映射半开边界、单位转换、4曲线/7天/1000桶和缺口保留；旧源缺失不借新源补值。','平台历史读取能力已核验')
task('DEV-06','共享规则及原子发生链',['DEV-03','DEV-04'],[],S(9,10),['upsFleet/fan/domain/rules/RuleEngine.fan','upsFleet/fan/domain/rules/RuleEvaluator.fan','upsFleet/fan/persistence/RuleStateStore.fan'],['FT-02','FT-04','FT-16','FT-17','FT-18','FT-19','FT-20','FT-24','FT-33'],'可控时间验证采样/质量/日历三驱动；去抖回差；水位状态发生及命令原子提交；同一发生顺序和跨发生前驱正确。','纯域可独立；原子存储未验证不发送真实告警')
task('DEV-07','告警列表、可靠确认、同步与审计',['DEV-02','DEV-03','DEV-06'],O(5,6,13),S(7,11,12,13),['upsFleet/fan/services/alarm/AlarmService.fan','upsFleet/fan/services/alarm/AlarmSynchronizer.fan','upsFleet/fan/services/alarm/AcknowledgementCoordinator.fan','upsFleet/fan/persistence/AuditRepository.fan','upsFleet/ui/src/pages/AlarmPage.js','upsFleet/ui/src/pages/AuditPage.js'],['FT-05','FT-06','FT-07','FT-25','FT-26','FT-35'],'权威确认并发与结果丢失不重复写；CREATE成功落库前退出后按关联核对；审计回补；只读可进入而动作独立拒绝。','权威告警、关联核对和审计持久化G1通过后才能真实副作用')
task('DEV-08','配置草稿、版本发布与投运验收',['DEV-03','DEV-06','DEV-07'],O(8,9,10,11,14),S(8,14,15,16),['upsFleet/fan/services/configuration/ConfigurationService.fan','upsFleet/fan/services/configuration/PublicationCoordinator.fan','upsFleet/fan/domain/configuration/ConfigurationGuard.fan','upsFleet/ui/src/pages/EngineeringPage.js','upsFleet/ui/src/pages/CommissioningPage.js'],['FT-08','FT-09','FT-21','FT-22','FT-23','FT-27','FT-28','FT-29','FT-30'],'六步草稿→校验→完整不可变版本→提交决定→全模块同epoch；回退只生成新草稿；未决发生阻止破坏性变更。','真实事务/恢复/对象范围证据；不开放2.1资产编辑')
task('DEV-09','报表四模板及受保护文件',['DEV-05','DEV-07'],O(15,16,17,18),S(20),['upsFleet/fan/services/report/ReportService.fan','upsFleet/fan/services/report/ReportWorker.fan','upsFleet/ui/src/pages/ReportPage.js','upsFleet/ui/src/pages/ReportDetailPage.js'],['NEW-03','NEW-04','NEW-05','NEW-06','R7-08'],'历史加权与期初结转正确；作业有界、可取消；二进制下载/JSON失败分流；下载前全设备范围和代次重新授权。','保护文件与平台历史已验证；文件保存解析及真实浏览器下载需测试')
task('DEV-10','通知队列与真实/模拟投递',['DEV-07','DEV-08'],O(19,20,21,31),S(21),['upsFleet/fan/services/notification/NotificationService.fan','upsFleet/fan/services/notification/NotificationWorker.fan','upsFleet/fan/fin/TelegramTransport.fan','upsFleet/ui/src/pages/NotificationPage.js'],['NEW-07','NEW-08','NEW-09','NEW-10','R7-09'],'独立队列游标、许可与暂停原子；未知默认核对；仅显式授权OP21风险接受可重发；密钥不出服务端。','真实Telegram发送须另获操作授权；当前开发可用传输测试替身，不能真实外发')
task('DEV-11','后台模拟会话与确定性重放',['DEV-02','DEV-03','DEV-06'],O(23,24,25,26,27,28,29,30),S(23),['upsFleet/fan/services/simulation/SimulationService.fan','upsFleet/fan/domain/simulation/SimulationEngine.fan','upsFleet/fan/services/simulation/SimulationDataSource.fan','upsFleet/ui/src/pages/SimulationPage.js'],['SIM-01','SIM-02','SIM-03','SIM-04','SIM-05','SIM-06','SIM-07','SIM-08','R7-02','R7-04','R7-06','R7-07'],'初始元数据、场景事件和检查点可重放；1/5/10/60秒推进等价；旧代次/旧worker不能写样本/告警/文件；共用规则，零真实外发。','纯模拟可先做；Folio存储与清理能力须独立验证')
task('DEV-12','生命周期、诊断、限流和停机恢复',['DEV-03','DEV-04'],O(12),S(17,18),['upsFleet/fan/lifecycle/Lifecycle.fan','upsFleet/fan/lifecycle/LifecycleDiagnostics.fan','upsFleet/fan/lifecycle/WorkScheduler.fan','upsFleet/ui/src/pages/DiagnosticsPage.js'],['FT-09','FT-22','FT-24','FT-36'],'31操作直接装配及5类任务登记；启动先恢复再准入，停机拒新任务、取消排空、保留检查点；有界资源。','生命周期注册及线程/任务原语由实际SDK核验')
task('DEV-13','全页面路由、英文、双主题与响应式',['DEV-04','DEV-05','DEV-07','DEV-08','DEV-09','DEV-10','DEV-11'],[],S(22,24),['upsFleet/ui/src/app/router.js','upsFleet/ui/src/state/RequestScope.js','upsFleet/ui/src/state/ThemeStore.js','upsFleet/ui/src/locales/en-US.js','upsFleet/ui/src/styles/layout.css'],['AC-14','RESP-01','RESP-02','RESP-03','RESP-04','RESP-05','RESP-06','LANG-01','LANG-02','LANG-03','LANG-04','NEW-11','NEW-12'],'22路由分开进入/动作/核对权限；晚响应不串源；保留六卡；移动端/键盘/44px/缩放通过，生成和错误文案也是英文。','框架沿用原生JS；真实浏览器/真机证据不以静态DOM检查替代')
task('DEV-14','单POD封装、升级回退和完整验收',['DEV-08','DEV-09','DEV-10','DEV-11','DEV-12','DEV-13'],[],S(19),['upsFleet/build.fan','upsFleet/fan/lifecycle/MigrationRunner.fan','upsFleet/lib/','upsFleet/res/web/upsFleet/','upsFleet/docs/'],['FT-14','FT-15','NFR-08'],'发布物只有一个upsFleet.pod，含后台/本地UI/locale/批准模型与注册资源；依赖清单、许可证、哈希、备份迁移和恢复证据齐备；全RTM执行。','目标build最终确认；72小时稳定性与现场验收单独授权和取证')
put('tasks.json',tasks)
opTask={op:t['id'] for t in tasks for op in t['operations']};sfTask={sf:t['id'] for t in tasks for sf in t['functionalSpecifications']}
ops=read(B/'operations.json');handlers=(B/'handlers.ts').read_text(encoding='utf-8');contract=(B/'contracts.ts').read_text(encoding='utf-8')
execution=[]
for o in ops:
 assert f'{o["name"]}: Handler<"{o["id"]}">' in handlers
 execution.append(dict(operation=o['id'],method=o['name'],task=opTask[o['id']],owner=o['owner'],requestType=f"Contracts['{o['id']}']['request']",responseType=f"Contracts['{o['id']}']['response']",transportResult='BinaryDownload | Response<never>；成功二进制，失败JSON' if o['id']=='OP-17' else f"WireResponse<'{o['id']}'>",permissionByMode=o['permissionByMode'],scopeByMode=o['scopeByMode']))
put('operation-execution.json',execution)
put('development-plan.md','''# UPS Fleet 单POD开发实施计划 D1

用户已授权规划后交由开发编写实际代码。目标为一个 FIN Framework 业务插件文件 `upsFleet.pod`，不是前后端分开部署的两个应用，也不新增独立后台服务。本文是架构实施计划，具体首包由 Leader 下发到已准备的开发工作区。

## 基线和复核结论

- PRD为r9；已有接口、Trio及B1.1获批。当前工作区FSD为r10，其整体未自动批准；schema2.1仍是候选。
- 111个Trio模板（35设备、76业务）离线FIN Expert复核通过；不是实际运行实例或导入授权。19项A2参考模型重新执行通过，不是Fantom测试。
- 旧整包验证器先因CRLF/LF精确字节差异失败，未运行到整文哈希断言。统一CRLF为LF后公共契约文本一致；当前r10整文哈希独立核对与r9不同。旧验证器和manifest不修改。
- DP-F01：B1描述性索引误用方法名，实际Contracts键是OP编号。开发执行清单更正全部62个请求/响应引用，并逐项对齐31方法；OP-17保留二进制成功／JSON错误例外。不改变公共契约。
- 本机存在FIN5.3.0.2761及Fantom1.0.78.3105候选离线库，具体证据由开发只读核验；最终项目目标版本尚未确认。版本命令退出码1不是构建成功。
- 测试侧结合完整RTM确认没有新增开发阻塞；验收链接是选摘，不能据此宣称完整覆盖。新鲜度、确认并发、审计回补、迁移、真机、报表、通知和故障注入随实现分配完整用例。

## 工作包与依赖

首包只实现一个最小单POD构建及一项真实Fantom新鲜度测试，不一次实现权限、哈希、日期和规则全套，也不预造39类/79文件。后续各包按需求加入真实依赖；任务编号不是一次性交付全部空架构的要求。

'''+table(['工作包','前置','范围','完成条件','门槛'],[[t['id']+' '+t['title'],', '.join(t['dependencies']) or '无',', '.join(t['operations']+t['functionalSpecifications']) or '构建基础',t['definitionOfDone'],t['gate']] for t in tasks])+'''
## 开发与报告规则

开发负责实际Fantom及前端代码；架构师处理接口/数据/依赖差异；评审独立检查；测试负责完整用例分配及证据；Leader分配分支、集成与交付节奏。每包提交前自测并回报：源文件、需求/接口/验收ID、命令退出码、日志、产物哈希、缺口与下一步。没有具体范围授权不向后扩包。

纯领域和严格契约不因现场SDK门槛停滞；实际Fantom编译优先于继续扩写Node参考模型。真实SDK服务不可用时返回明确不可用，不能用伪数据冒充真实接入。第三方示例只供核验，不复制其React/Vite技术栈或未经许可代码。

依赖DAG可并行准备纯规则/前端和接口夹具，但共享worktree只由开发一个任务写业务代码；评审/测试读取或使用Leader安排的独立环境。
''')
put('first-work-package.md','''# DEV-01 首个可执行开发包

## 授权位置和输入

Leader已准备 `C:/work/upsproject-implementation`，分支 `feature/ups-pod-implementation`，起点 `3cdc8f5675a0cd32856597d97932f5d5d38ae71a`。开发开始前核验分支、HEAD及状态。当前该分支不包含原工作区未提交的批准文档；必须先按 transfer-manifest.json 校验、复制到只读设计输入目录，不能以旧README代替批准基线。具体开始指令由Leader下发。

## 只完成这一条切片

1. 只读核验候选SDK的构建类、依赖及输出目录机制，记录实际符号、版本和依据。
2. 编写最小 `upsFleet/build.fan`。首包仅依赖实际需要的基础库；不复制示例全部依赖。
3. 在既有QualityEvaluator责任内实现一项新鲜度判定：使用传入的源采样时间、当前时间和失效阈值；缓存重读不得刷新源采样时间。只增加支持该行为必需的类型，不预造其余类。该首包不宣称完整实现SF-02。
4. 编写真正Fantom测试：固定t0，阈值30秒；t0+29秒仍有效，反复读缓存后t0+31秒陈旧；同一源时间始终不变。数值和单位不由测试伪造为生产资产。此为FT-01最小向量，其余质量优先级在DEV-04完成。
5. 用本机真实Fantom编译器生成一个 `upsFleet.pod` 并执行上述测试；解析产物元数据，记录测试摘要、完整命令、退出码和SHA-256。

## 文件与输出约定

业务文件：`upsFleet/build.fan`、`upsFleet/fan/domain/telemetry/QualityEvaluator.fan`、`upsFleet/test/domain/QualityEvaluatorTest.fan`。测试需要的小值类型可放同一领域文件，不新建泛化框架。工具：`scripts/build.ps1`、`scripts/test.ps1`。证据：`docs/development/DEV-01/`。

构建输出统一限制在 `C:/work/upsproject-implementation/.artifacts/DEV-01/`，隔离运行环境使用 `.runtime/DEV-01/`。严禁写入 FIN 安装目录；不安装、启用或启动插件，不连接现场，不写设备，不发送Telegram。

开发需提供可重复的项目封装命令，例如：

```powershell
./scripts/build.ps1 -FinHome 'C:/Program Files (x86)/FIN Framework/FIN Framework 5.3.0.2761' -OutputRoot '.artifacts/DEV-01'
./scripts/test.ps1 -FinHome 'C:/Program Files (x86)/FIN Framework/FIN Framework 5.3.0.2761' -OutputRoot '.artifacts/DEV-01'
```

以上是要求开发实现的脚本调用界面，不是声称FIN官方存在这些参数。脚本内部必须先核验BuildFinPod或其他实际支持构建机制，并在编译前确认所有输出路径落在worktree；测试加载的必须是隔离目录中新构建的POD，不能碰巧加载安装目录同名旧产物。若构建机制默认写fan.home/lib/fan，先建立已验证的隔离环境或显式输出配置，不允许直接尝试污染安装目录。

## 完成与停止条件

完成：干净输入基线验证；一个upsFleet.pod及正确pod.name；真实Fantom测试通过；命令退出码和产物哈希可复现；安装目录未被写入；没有39类空壳、假API或额外服务。首包可编译POD不等于FIN菜单/生命周期注册、可安装插件或功能完成。

停止并报告：实际分支/路径与授权不符；基线hash不符；输出无法隔离；需要未经核验SDK符号；编译/测试失败；必须修改公共schema；需要安装启用/现场操作。不得将这些失败隐藏成成功或自行转做Node替身后宣称Fantom完成。纯代码可保留为未通过状态，但不推进真实集成。
''')
put('single-pod-packaging.md','''# 单一 FIN Framework 插件POD交付约束

最终运行插件仅一个 `upsFleet.pod`。Fantom POD是命名空间及部署单元，官方语言依据为 [Pods](https://fantom.org/doc/docLang/Pods)，FIN Expert证据 fin_web_language_reference_6ec8c158300f9d55；它不能证明目标FIN注册方式。工作区混合POD示例646baac4d5a91eb1f33729ec展示后台、lib/Trio、locale、前端资源同包组织，但仅为工作区示例，不授权照抄SDK符号或框架。

| 包内内容 | 实施责任 |
|---|---|
| Fantom字节码及meta.props | pod.name=upsFleet，记录版本与真实依赖；不把39类拆成独立业务POD |
| 本地前端资源 | 构建到res/web/upsFleet并打包；无CDN，无独立生产Node服务 |
| 插件注册／菜单／生命周期 | 使用实际SDK核验的入口和元数据；首包不凭空声明继承或注册 |
| locale | 运行界面、错误、报表及无障碍文案en-US；中文仅技术交付说明 |
| 批准模型模板及编码资源 | 111模板可作受控模型资源，保留upsTemplate隔离；不自动实例化或导入生产 |
| 迁移与兼容元数据 | 版本检查、备份、迁移检查点、审计保留及恢复说明 |

外部平台已安装的Fantom/FIN依赖POD不是第二个自研业务插件，但必须记录精确版本及许可。不得把整个FIN运行库、开发node_modules、密钥、现场数据、源码测试夹具打入发布包。测试可在隔离测试构建执行，发布包不依赖另一个业务测试POD或外部前端部署。

资源目录是否递归、BuildFinPod参数、压缩资源与菜单加载均须实际核验；禁止把示例注释当SDK保证。打包验收检查ZIP目录、pod.name、依赖、资源白名单、秘密扫描、离线页面加载和版本兼容。最终只发布一个POD及配套说明/哈希，发布安装另按授权执行。

G1能力矩阵应逐项给出：候选版本观察、编译是否验证、离线集成是否验证、现场是否验证、失败处置。必须覆盖身份与对象权限、当前值、历史、原生告警/关联/确认、Folio原子事务/CAS/唯一约束、秘密引用、受保护文件、生命周期、资源注册和并发限流。任何一项缺口不能通过伪造成功或静默降级跨过。
''')
put('findings-and-evidence.md','''# 再核对发现与证据层级

## DP-F01：类型索引勘误

冻结B1的operation-ownership.json以方法名索引Contracts，但批准contracts.ts以OP编号为键，handlers.ts亦使用Handler<"OP-01">。影响31项、共62个requestType/responseType。新operation-execution.json逐项改为OP键，方法名和公共字段不变；OP-17保留BinaryDownload成功、Response<never>错误语义，不能把普通响应泛型当文件下载实现。

首轮探针只覆盖31请求索引；后续探针扩展为请求＋响应62索引并实际执行，当前check-contract-keys.cjs/result对应扩展范围。TypeScript5.9.3旧索引62错误，正确OP键零诊断。探针初次Windows路径分隔产生文件未找到、默认DOM库与Response重名；随后规范虚拟路径并显式使用ES2020库，未修改批准契约。前端集成须模块隔离避免全局Response污染。独立评审亦报告两组各31索引的相同结论。

## DP-F02：旧整包校验未通过

原validate-delivery.cjs首先在Approved public contract drift断言失败：生成字符串头及连接使用LF，而契约文件CRLF，不能声称字节一致。仅将CRLF转LF后的全文文本相等。原脚本未执行到下一条r9整文hash断言；新报告独立计算当前r10哈希，确实不同。原脚本/manifest不修改。baseline-recheck.json保留原错误；参考测试报告写入新目录，不覆盖冻结证据。

## 模板及参考逻辑

FIN Expert对两份Trio分别离线复核通过，目标版本适用性仍未验证。19项A2参考模型实跑通过，仅说明参考逻辑，不是Fantom实现或FIN事务证明。所有111个模板列在record-work-packages.json，设备品牌/协议/单位/周期等模板值仍待工程核验，不能直接生成生产设备。

## 候选SDK观察

开发只读观察本机FIN5.3.0.2761；Fantom1.0.78.3105、Java11.0.32.1；finBuild1.1.0含BuildFinArgs/BuildFinPod；haystack/axon3.1.5.1，folio/hx/skyarc/skyarcd3.1.5。Node24.19.0、pnpm11.19.0。版本输出命令退出码1，不视为构建通过。这些是开发任务报告的本机观察，不是最终目标确认；本任务未重复安装或连接现场。

## 全部资料的处理边界

PRD/FSD/RTM、接口/handlers/Trio/codec/持久化、B1.1路由类与装配、评审和中文阅读版均进入输入清单。历史r7/r8、原型、schema2.1候选作为背景和对照；实际可执行权威是批准的schema2.0契约及处置。自动生成的重复图像和机器报告不冒充新的批准证据。source-manifest.json记录逐文件哈希、类别和用途。
''')
put('operation-reference-correction.md','# DP-F01逐项勘误\n\n仅改变新执行计划的类型引用，不改冻结B1或公共schema。\n\n'+table(['接口／方法','旧请求引用','正确请求／响应引用','实现包／传输'],[[o['operation']+' '+o['method'],f"Contracts['{o['method']}']['request']",o['requestType']+'<br>'+o['responseType'],o['task']+' / '+o['transportResult']] for o in execution]))
manifest=read(B/'record-manifest.json')
recordRows=[]
for group in ['devices','business']:
 for r in manifest[group]:
  typ=r.get('upsRecordType','Point' if 'point' in r else 'unknown')
  if group=='devices':owner='DEV-04'
  elif typ.startswith(('Simulation','Scenario')):owner='DEV-11'
  elif typ.startswith(('Report',)):owner='DEV-09'
  elif typ.startswith(('Notification','Notify','Channel')):owner='DEV-10'
  elif typ in ['OperationJournal']:owner='DEV-02'
  elif typ in ['AuditEvent','AlarmAssociation']:owner='DEV-07'
  elif typ.startswith(('RuleState','RuleOccurrence','RuleCommand','RuleAlarm')):owner='DEV-06'
  elif typ=='SchemaMigration':owner='DEV-14'
  elif typ in ['MetricDefinition','OutlookRecord']:owner='DEV-04'
  else:owner='DEV-08'
  recordRows.append(dict(id=r['id']['ref'],recordType=typ,sourceFile='equipment-objects.trio' if group=='devices' else 'business-objects.trio',codecTask='DEV-03',domainTask=owner,productionUse='模板资源；不自动实例化；按工程与契约验证转换'))
put('record-work-packages.json',recordRows)
put('sf-work-packages.json',[dict(**s,developmentTask=sfTask[s['id']]) for s in read(A/'spec-coverage.json')])
# 固定全部权威输入；bootstrap补充到独立清单，不动旧B1快照。
sourceFiles=[]
for directory in [ROOT/'doc/planning',ROOT/'doc/reviews',B,A]:
 for f in directory.iterdir():
  if f.is_file() and f.suffix in ['.md','.json','.ts','.trio','.cjs','.py','.mmd']:
   sourceFiles.append(dict(path=f.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),use='当前批准引用／候选边界／历史证据，具体批准见计划正文'))
put('source-manifest.json',{'schema':'2.0','fsdWholeDocument':'r10待整体批准；r9公共契约另固定','files':sourceFiles})
transfer=[f for f in sourceFiles if f['path'].startswith(('doc/architecture/fsd-r9/','doc/architecture/application-blueprint/')) or Path(f['path']).name in ['UPS-Fleet-FIN-POD-PRD-v0.1.md','UPS-Fleet-FIN-POD-FSD-v0.1.md','UPS-Fleet-Requirements-Traceability-Matrix-v0.1.md','UPS-Fleet-FSD-r10-review-disposition.md']]
put('transfer-manifest.json',{'sourceRoot':str(ROOT),'destinationRoot':'C:/work/upsproject-implementation','destinationDesignRoot':'docs/design-baseline/D1','branch':'feature/ups-pod-implementation','startingCommit':'3cdc8f5675a0cd32856597d97932f5d5d38ae71a','copyRule':'Leader下发后按源相对路径保存到destinationDesignRoot下；复制前后逐文件SHA-256验证；包含候选或历史文件不等于批准其实施。禁止覆盖已有业务代码。','files':transfer})
# 以完整RTM编号分配执行负责人；保留原行便于测试判断适用范围，不凭选摘链接认为漏验。
rtm=ROOT/'doc/planning/UPS-Fleet-Requirements-Traceability-Matrix-v0.1.md';accept=[]
for ln,line in enumerate(rtm.read_text(encoding='utf-8').splitlines(),1):
 if re.match(r'^\|(?:FT|AC|RESP|NFR|NEW|SIM|R7|LANG|UI)-\d+',line):
  ident=line.split('|')[1].strip();owners=[t['id'] for t in tasks if ident in t['acceptanceReferences']]
  accept.append(dict(id=ident,line=ln,source=rtm.relative_to(ROOT).as_posix(),originalRow=line,tasks=owners or ['DEV-14'],owner='测试',status='未执行；按完整RTM适用性分配，未列入早期包的由DEV-14整体验收承接'))
put('acceptance-execution-index.json',accept)
put('README.md','''# 单POD开发规划 D1

本轮已重新核对交付资料，规划完成后由Leader按精确基线下发开发；目标一个upsFleet.pod。当前不是业务代码完成报告。

1. [中文开发计划与14个工作包](development-plan.md)
2. [首个实际Fantom工作包DEV-01](first-work-package.md)
3. [单POD打包与SDK门槛](single-pod-packaging.md)
4. [再核对发现及证据](findings-and-evidence.md)
5. [62个类型引用勘误及OP-17例外](operation-reference-correction.md)
6. [任务依赖与文件清单](tasks.json)、[31接口执行清单](operation-execution.json)
7. [111模板工作包映射](record-work-packages.json)、[24规格映射](sf-work-packages.json)
8. [完整RTM执行索引](acceptance-execution-index.json)
9. [源文件哈希](source-manifest.json)、[基线移交清单](transfer-manifest.json)
10. [原校验重跑结果](baseline-recheck.json)、[类型检查](contract-key-verification.json)

批准范围：PRD r9、schema2.0接口/Trio/B1.1；r10整体与schema2.1不自动批准。已找到候选本地SDK，但最终目标、G1集成、安装及现场操作仍未授权或未验证。开发只在Leader指定独立worktree写代码，首包只实现最小真实Fantom切片，不预造完整库存。
''')
ids={t['id'] for t in tasks}
visited=set()
def visit(id,stack):
 assert id not in stack,'cycle'
 if id in visited:return
 for d in next(t for t in tasks if t['id']==id)['dependencies']:assert d in ids;visit(d,stack|{id})
 visited.add(id)
for id in ids:visit(id,set())
assert len(opTask)==31 and len(sfTask)==24 and len(recordRows)==111
assert len(set(r['id'] for r in recordRows))==111
put('plan-validation.json',{'status':'passed','scope':'规划结构检查，不是产品功能验收','tasks':14,'operations':31,'functionalSpecifications':24,'templateRecords':111,'acceptanceRows':len(accept),'checks':['任务依赖无环','31接口唯一工作包','62索引按OP键','31方法与handlers一致','OP17二进制例外','24SF覆盖','111模板唯一映射','bootstrap纳入移交hash'],'runtimeVerified':False})
print('D1 generated: 14 tasks, 31 OP, 24 SF, 111 templates; DAG passed.')
