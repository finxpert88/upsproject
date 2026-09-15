# 可编程接口实现清单

基线：FSD v0.1 修订9；接口schema 2.0。以下方法、路径是本次架构设计，不是 FIN 官方 API。完整请求/响应字段直接从通过评审的FSD提取至 [contracts.ts](contracts.ts)，可编程处理器签名见 [handlers.ts](handlers.ts)。尚未实现业务处理器或验证FIN SDK绑定。

## 1. 逐功能追踪

|规格|需求描述|FSD节|入口|内部实现入口|读写模型|必须实现的判定|
|---|---|---|---|---|---|---|
|SF-01|遥测采集与新鲜度|4.1|OP-03|TelemetryService.pollBatch|PointMapping → Metric/Snapshot|缓存重读不推进freshness；≤500ms共享检查|
|SF-02|质量决策顺序|4.2|OP-03|QualityEvaluator.evaluate|CapabilityProfile/PointMapping → Metric|0/false有效；bad值null；超量程保留observedValue|
|SF-03|通讯和供电模式|4.3|OP-02/03|CommunicationResolver.resolve|FIN诊断/PointMapping → communication/powerMode|连接、供电、告警三轴独立|
|SF-04|设备总览|5.1/5.7|OP-01/02|InventoryService.list|UpsEnrollment → FleetPage|权限范围；5分钟游标；最新统计与冻结成员分离|
|SF-05|Dashboard与详情|5.2/5.8/17|OP-03/04/22|DashboardPresenter.render|Snapshot/MetricDefinition → 32项组件|六卡、健康环、趋势齐全；无评分显示未知|
|SF-06|历史趋势|5.3/5.6|OP-04|HistoryService.querySegments|MappingInterval/FIN history → HistorySegment|4条/7天/1000桶；半开区间；禁止跨映射补值|
|SF-07|告警事件页|5.4|OP-05/06/07|AlarmService.query|FIN alarm/AlarmAssociation → Alarm/Timeline|发生/恢复/确认独立；纯事件无确认|
|SF-08|工程配置页|5.5|OP-08/09/10/14|EngineeringWizard|ConfigDraft/ValidationReport → 发布或错误|六步工程流程；无设备凭据字段|
|SF-09|三类执行模型|6.1/6.3/6.4|内部|RuleEngine.advance|RuleDefinition/RuleState → RuleAlarmOutbox|sample/quality/calendar独立驱动；主水位去重|
|SF-10|规则参数与转换|6.2/6.5|OP-08/09/10|RuleEvaluator.evaluate|规则/输入 → 风险与覆盖|AND门槛；R-02边界；无来源不造分数|
|SF-11|告警归一|7.1/7.4|OP-05|AlarmSynchronizer.reconcile|FIN event → AlarmAssociation|稳定发生ID；CREATE/SEVERITY/CLEAR顺序|
|SF-12|单条确认|7.2|OP-06/07|AcknowledgementCoordinator.execute|OperationJournal → FIN ack → AuditEvent|意图先落盘；未知不重放；查询权威结果|
|SF-13|审计|7.3|OP-13|AuditRepository.append|AuditEvent|追加写；拒绝普通用户编辑；失败关闭副作用|
|SF-14|范围安全草稿|8.1|OP-08/09/11|ConfigurationService.mergeValidate|ConfigDraft/ValidationReport|局部patch；旧新范围双授权；10分钟报告|
|SF-15|统一激活|8.2/8.3|OP-10/07|PublicationCoordinator.activate|ConfigVersion/Publication/Pointer|COMMITTED后只恢复候选；全模块同epoch|
|SF-16|活动规则与退役|8.4|OP-08/09/10|ConfigurationGuard.checkActive|RuleState/RuleAlarmOutbox/AlarmAssociation|未决发生阻止破坏恢复链；确认不解除阻断|
|SF-17|生命周期|11.1|OP-12|Lifecycle.startStop|Pointer/Journal/Publication|不自动造设备；重启先对账；停止释放任务|
|SF-18|容量与压力保护|11.2|OP-02/03/04/12|WorkScheduler.admit|缓存/有界队列|100设备/5000点为测试假设；共享读取不随会话倍增|
|SF-19|打包升级回滚|11.3|内部|MigrationRunner.run|SchemaMigration/备份|冻结SDK；迁移幂等；审计保全；72h浸泡|
|SF-20|报表导出|18.2|OP-15/16/17/18|ReportWorker.execute|ReportJob/File/MappingInterval|时间加权；carry-in；历史期末状态；撤权拒下载|
|SF-21|Telegram通知|18.3|OP-19/20/21/31|NotificationWorker.deliver|NotifyJob/Cursor/Gate/Attempt|独立outbox；许可与暂停原子；unknown不自动重发|
|SF-22|双主题|18.4|前端本地|ThemeStore.set|按用户隔离偏好|默认Light；不改变查询状态；PDF固定浅色|
|SF-23|模拟服务|19|OP-23～30|SimulationService.advanceEvents|SimulationSession/Sample/Alarm/Cleanup|seed可重放；独立代次；reset/delete屏障；零真实外发|
|SF-24|多屏与触控|22|复用业务OP|ResponsiveShell.resize|前端状态|320～1920+；44px触控；旋转不重发变更|

补充覆盖：FR-21指标释义由OP-22/MetricDefinition实现（18.1）；产品英文由集中en-US资源及全部生成器实现（21）；FR-18～20仍按FSD第20节保留原分期，不重新解释编号。精确FR关系见原需求追踪矩阵。

## 2. 31项外部操作

所有入口先校验schemaVersion/context，再验证服务端会话、对象范围和动作权限；项目身份从会话取得。统一Response联合，额外字段拒绝。下表POST路径是建议同源绑定，待G1冻结；只读POST没有写副作用。OP-01无版本首次GET只返回版本能力。

|操作|处理器|所属模块|权限（另加对象范围）|读取/持久化模型|
|---|---|---|---|---|
|OP-01|sessionCapabilities|RequestFacade|session|FIN session|
|OP-02|equipmentList|InventoryService|fleet.view|UpsEnrollment,CapabilityProfile|
|OP-03|equipmentSnapshot|TelemetryService|fleet.view|PointMapping,AssessmentBinding,OutlookRecord|
|OP-04|metricHistory|HistoryService|history.view|MappingInterval,FIN history|
|OP-05|alarmListDetail|AlarmService|alarm.view|AlarmAssociation,FIN alarm|
|OP-06|alarmAcknowledge|AlarmService|alarm.ack|OperationJournal,AuditEvent,AlarmAssociation|
|OP-07|operationStatus|OperationRepository|originalActionByMode|OperationJournal,Publication|
|OP-08|configGetSaveDraft|ConfigurationService|config.edit|ConfigDraft,ConfigVersion|
|OP-09|configValidate|ConfigurationService|config.edit|ValidationReport,PointMapping,CapabilityProfile|
|OP-10|configPublish|ConfigurationService|config.publish|Publication,ActiveConfigPointer,LastSuccessfulActivation,MappingInterval,AuditEvent|
|OP-11|configRollbackDraft|ConfigurationService|config.publish|ConfigDraft,ConfigVersion|
|OP-12|diagnostics|LifecycleDiagnostics|diagnostics.view|Publication,RuleAlarmOutbox,OperationJournal|
|OP-13|auditList|AuditRepository|audit.view|AuditEvent|
|OP-14|commissioningAccept|ConfigurationService|commissioning.accept|AcceptanceReport,UpsEnrollment,Publication|
|OP-15|reportCreate|ReportService|report.export|ReportJob,MappingInterval|
|OP-16|reportGetList|ReportService|report.read|ReportJob|
|OP-17|reportDownload|ReportService|report.export|ReportJob,ReportFileMetadata|
|OP-18|reportCancel|ReportService|report.export|ReportJob,AuditEvent|
|OP-19|notificationTest|NotificationService|notification.manage|NotificationChannel,NotifyJob,OperationJournal|
|OP-20|notificationDeliveryList|NotificationService|notification.read|NotifyJob,NotificationAttempt|
|OP-21|notificationRetry|NotificationService|notification.manage|NotifyJob,NotificationAttempt,AuditEvent|
|OP-22|metricDictionary|MetricDictionaryService|fleet.view|MetricDefinition|
|OP-23|simulationCreate|SimulationService|null|SimulationSession|
|OP-24|simulationGenerate|SimulationService|null|SimulationSession,SimulationSample,SimulationAlarm|
|OP-25|simulationControl|SimulationService|null|SimulationSession,OperationJournal|
|OP-26|simulationStep|SimulationService|null|SimulationSession,SimulationSample,SimulationAlarm|
|OP-27|simulationScenario|SimulationService|null|SimulationSession,SimulationSample,SimulationAlarm|
|OP-28|simulationReset|SimulationService|null|SimulationCleanup,SimulationSession|
|OP-29|simulationDelete|SimulationService|null|SimulationCleanup,SimulationSession|
|OP-30|simulationGetList|SimulationService|null|SimulationSession|
|OP-31|notificationPause|NotificationService|notification.manage|ChannelGate,AuditEvent,OperationJournal|

## 3. 共用实现规则

- 模拟模式权限按FSD 10.1单独检查，live权限不能替代simulation.read/ack/export/manage；OP-19/31禁止simulation；OP-21模拟分支仅本地重试。context/session/generation必须在对象查询之前校验。
- 幂等唯一键固定projectId+operationId；actor/action/context/规范化请求hash为绑定字段。身份与当前授权先验，已登记原请求查找先于revision检查。重置/删除旧上下文例外严格按persistence-design.md；不能执行新代次副作用。OP-08采用draft/entity CAS，OP-11只建回退草稿。
- OP-06采用expectedRevision；发布采用baseConfigRevision和validation hash；模拟管理采用controlRevision，tick只改变dataRevision。
- OP-07返回SUCCEEDED+pending时只查询，不再次执行。未知外部结果保留OUTCOME_UNKNOWN并对账。
- OP-17成功为二进制流，元信息映射响应头；失败为JSON。文件开始传输前重新检查全部设备权限及generation。
- OP-31在RECOVERY_REQUIRED也可暂停；暂停与worker领取许可共用原子边界，恢复必须发布匹配pauseRevision的新配置。
- 常规并发每会话4、历史2，项目历史8；历史≤4曲线/7天/1000桶。列表默认50、最大100。报表≤100设备/31天/100000行/50MB/PDF200页，2个worker，24小时过期。具体规则以FSD 9.4/18.2为准。
- 所有字段类型、必填/null、枚举及对象响应，以contracts.ts为唯一编码起点；TypeScript类型检查不能替代运行时JSON验证器。需生成或实现严格运行时校验并用FSD边界用例检查。

## 4. FinGateway内部端口（本项目定义，SDK符号待核验）

|端口|输入→输出|失败/一致性要求|
|---|---|---|
|readSessionScope|服务端会话→身份、权限、scopeVersion|默认拒绝，禁止客户端指定actor/project|
|readPointBatch|已授权Ref集合→类型/原生质量/采样时点/序号/采集证据|缓存读取不能伪造新采样|
|readConnectionHealth|已绑定诊断源→成功读取/连接状态|环境与UPS主连接分离|
|readHistory|Ref、半开时窗、carry-in选项→真实源样本|返回缺口；权限逐段检查|
|readAlarmEvents|源游标、重叠窗口→稳定实例/生命周期事件|可追补短暂发生；缺能力阻断验收|
|ackAlarm|已登记意图、原生实例/版本→确定或未知结果|不直接改告警字段；无批量|
|applyRuleAlarmCommand|发生ID、序号、CREATE/SEVERITY/CLEAR→权威结果|未知阻断该发生后续命令；不能重放|
|transactRecords|预期版本、读集合、写集合→提交凭证|CAS、唯一键、跨Rec原子性须G1证明|
|readRecordPage|固定模型过滤、权限范围→Rec集合/游标|不得接受任意Axon表达式|
|writeProtectedFile/readProtectedFile|作业/代次、流→文件句柄/流|无公共URL；清理屏障；配额|
|resolveSecret|secretRef→仅服务端秘密句柄|不落Trio/响应/日志|
|registerTasks/stopTasks|有界任务定义→生命周期句柄|停止幂等；不遗留计时器|

## 5. 开发顺序与验收

1. 实现schema2.0严格校验、SourceContext、权限矩阵、领域类型与Rec编解码；校验模板与业务必填字段不同层次。
2. 在目标FIN构建完成G1：Ref保留/重映射、原子CAS及唯一约束、SDK读点/历史/告警能力、秘密与文件存储。缺原子保证时暂停变更功能并评审存储替代。
3. 完成真实读取及历史、质量、规则纯逻辑；使用FSD FT/UI/NEW/R7中的固定输入和边界条件。
4. 完成意图与审计、发布恢复、告警确认与规则outbox，然后报表、通知及模拟服务。
5. 对照SF-01～24与LANG/RESP测试，实际FIN、Telegram、真机、72h浸泡单独验收；静态DEMO通过不作为这些完成证据。


## A2机器契约

operations.json的permissionByMode和ACL元数据取代单permission字段；OP-07解析原journal动作后按原模式鉴权。bootstrap-route.json定义无版本GET /upsFleet/api/bootstrap，无认证业务信息；完整能力POST保持schema2.0与会话认证。内部持久化与重试顺序见persistence-design.md。
