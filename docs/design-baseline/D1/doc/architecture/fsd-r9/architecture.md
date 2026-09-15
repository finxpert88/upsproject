# UPS Fleet POD 整体架构

基线FSD修订9；单业务POD upsFleet，所有模块名为项目逻辑边界。

```mermaid
flowchart TB
  UI["English UI · Dashboard / Equipment / Alarms / Reports / Engineering<br/>Light & Dark · Responsive"] --> API["RequestFacade · schema 2.0<br/>Authentication · Scope · Rate limits · SourceContext"]
  API --> ROUTER{"live / simulation"}
  ROUTER --> LIVE["LiveDataProvider"]
  ROUTER --> SIM["SimulationService<br/>seed / virtual clock / generation barrier"]
  LIVE --> DOMAIN["Inventory · Telemetry & Quality · History<br/>Rules · Alarms · Configuration · Reports"]
  SIM --> DOMAIN
  DOMAIN --> GW["FinGateway · version-specific adapter<br/>Live context only"]
  GW --> FIN["FIN Project<br/>Site / Equip / Point · History · Native Alarms"]
  UPS["UPS & room sensors"] --> CONN["Validated FIN connectors"] --> FIN
  DOMAIN --> REPO["FolioRepository<br/>CAS / unique keys / atomic transactions · G1 gate"]
  REPO --> CONFIG["Configuration · Mapping intervals<br/>Publication · Active epoch"]
  REPO --> STATE["Rule state & outbox<br/>Operation journal · Append-only audit"]
  SIM --> SIMSTORE["Isolated simulation records<br/>Session / Generation / Samples / Alarms"]
  DOMAIN --> REPORT["Report worker<br/>Protected files · Download reauthorization"]
  FIN --> EVENTS["Authoritative lifecycle event feed"]
  EVENTS --> NOTIFY["NotificationService<br/>Outbox / Cursor / ChannelGate / Attempts"]
  NOTIFY --> TELEGRAM["TelegramTransport · Server-only secrets<br/>External delivery only in live context"]
  SIM --> SIMNOTIFY["Simulated transport · zero external messages"]
  LIFE["Lifecycle & Diagnostics<br/>Recovery before opening epoch gates"] --> DOMAIN
  LIFE --> NOTIFY
  STATE --> OCC["RuleOccurrence · Ordinal chain · Immutable command payload"]
  SIMSTORE --> CP["ScenarioEvent · Checkpoint · Generation / Worker fence"]
  CONFIG --> EV["Sealed manifest · EntityVersion · Content hashes"]
  API --> BOOT["Separate bootstrap GET · Metadata only"]
```

共享领域逻辑通过数据提供器选择来源；模拟上下文无法获得Live FinGateway写端口。图中领域到FinGateway路径仅对live开放。模拟确认、通知和报表分别落模拟域，真实断线不自动切换模式。

配置发布使用持久化提交决定及统一epoch；事务能力是G1门槛。规则、确认、通知的未决状态分别持久化，Telegram失败不能阻塞FIN告警。文件从ReportService的受权接口取得，浏览器不执行任意Axon。

配套：[模型目录](model-catalog.md) · [接口清单](interface-implementation-list.md)。

A2新增：跨发生链、场景日志/检查点、全量配置清单、独立bootstrap。AR-03公开编辑差异仍待确认；详见处置结果。
