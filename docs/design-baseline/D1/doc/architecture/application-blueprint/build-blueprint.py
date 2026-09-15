"""Documentation generator only. Does not generate application source or empty stubs."""
from pathlib import Path
import json, hashlib, re, subprocess
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
BASE = ROOT / 'doc/architecture/fsd-r9'
assert subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip() == 'feature/fsd-r4-static-demo'
def put(name, value):
    (OUT/name).write_text(value if isinstance(value,str) else json.dumps(value,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
ops = json.loads((BASE/'operations.json').read_text(encoding='utf-8-sig'))
classes=[]
def cls(name, folder, responsibility, methods, dependencies='', life='project service', kind='class'):
    classes.append(dict(name=name,qualifiedName='upsFleet::'+name,file=f'upsFleet/fan/{folder}/{name}.fan',kind=kind,responsibility=responsibility,designMethods=methods.split(';'),dependencies=dependencies.split(',') if dependencies else [],lifetime=life))

cls('Lifecycle','lifecycle','Own startup, recovery readiness and stop; never create production demo records.','start: recover before admit;stop: drain and release','LifecycleDiagnostics,MigrationRunner,WorkScheduler,PublicationCoordinator')
cls('LifecycleDiagnostics','lifecycle','Read module epochs, queue health and recovery state.','diagnostics: Contracts[diagnostics]','FinGateway,WorkScheduler')
cls('MigrationRunner','lifecycle','Version checks, backup manifest and restart-safe migration; no automatic schema 2.1 activation.','inspectCompatibility;planMigration;resumeMigration','FinGateway,RecordCodec,AuditRepository')
cls('WorkScheduler','lifecycle','Bound shared polling, history requests, report jobs and per-session simulation work.','admit;cancel;drain','', 'project scheduler')
cls('RequestFacade','web','Bootstrap and 31-operation dispatch; normalize response envelope and correlation ID.','bootstrap: BootstrapRequest -> BootstrapResponse;dispatch: WireRequest<K> -> WireResponse<K>;sessionCapabilities: Contracts[sessionCapabilities]','RequestGuard,DtoCodec,OperationRepository')
cls('RequestGuard','web','Authenticate, authorize action and all referenced objects, validate source context and limits before side effects.','authorize: request + FIN session -> authorized context;checkOriginalOperationBinding','FinGateway')
cls('DtoCodec','web','Strict schema 2.0 JSON discriminants, nulls, enums, unknown-field rejection and response projection.','decodeRequest<K>;encodeResponse<K>;encodeDownloadError','', 'stateless')
cls('InventoryService','services/inventory','Authorized equipment/child inventory and frozen-member cursors; FIN identity remains authoritative.','equipmentList: Contracts[equipmentList]','UpsDataSource,ConfigurationService')
cls('TelemetryService','services/telemetry','Shared batch acquisition and coherent, epoch-tagged snapshots; UI polling never increases device sampling.','equipmentSnapshot: Contracts[equipmentSnapshot];pollBatch: source observations -> snapshots','UpsDataSource,QualityEvaluator,CommunicationResolver,AssessmentEvaluator,WorkScheduler')
cls('QualityEvaluator','domain/telemetry','Preserve zero/false and native timestamps; missing or invalid values do not become fabricated healthy values.','evaluate: observation + mapping + time -> Metric','', 'stateless')
cls('CommunicationResolver','domain/telemetry','Resolve communication separately from power mode and alarm state.','resolve: source diagnostics -> Comm','', 'stateless')
cls('AssessmentEvaluator','domain/telemetry','Risk and coverage use rule evidence; external health score and outlook remain separately sourced.','evaluate: evidence + bindings -> Assessment','', 'stateless')
cls('HistoryService','services/history','Query half-open mapping segments, enforce bucket/curve limits and preserve gaps.','metricHistory: Contracts[metricHistory];querySegments: mapping intervals + window -> HistorySegment[]','UpsDataSource,ConfigurationService,WorkScheduler')
cls('RuleEngine','domain/rules','Process sample, quality and calendar drivers; persist state/watermark/occurrence/commands atomically.','advance: event + runtime state -> transition;recover: checkpoint -> ready state','RuleEvaluator,RuleStateStore')
cls('RuleEvaluator','domain/rules','R-01 through R-05, hysteresis/count gates and maintenance transitions; no external writes.','evaluate: rule + prior state + event -> transition','', 'stateless')
cls('RuleStateStore','persistence','Atomic rule transition and occurrence chain storage, including debounce candidates/counts/epoch and runtime fence.','load;commitTransition: expected revision + state + occurrence + commands','FinGateway,RecordCodec')
cls('AlarmService','services/alarm','Normalize authority-backed alarms and timeline; delegate reliable single acknowledgement.','alarmListDetail: Contracts[alarmListDetail];alarmAcknowledge: Contracts[alarmAcknowledge]','UpsDataSource,AlarmSynchronizer,AcknowledgementCoordinator')
cls('AlarmSynchronizer','services/alarm','Dispatch ordered immutable CREATE/SEVERITY/CLEAR commands and reconcile uncertain outcomes by occurrence correlation.','dispatchNext;reconcileUnknown','UpsDataSource,RuleStateStore,AuditRepository')
cls('AcknowledgementCoordinator','services/alarm','Persist intent before acknowledgement; unknown result enters read-only reconciliation.','execute: authorized ack -> Operation;reconcile: operation binding -> authority observation','UpsDataSource,OperationRepository,AuditRepository')
cls('ConfigurationService','services/configuration','Own draft CAS, full immutable configuration snapshots, validation and commissioning.','configGetSaveDraft: Contracts[configGetSaveDraft];configValidate: Contracts[configValidate];configPublish: Contracts[configPublish];configRollbackDraft: Contracts[configRollbackDraft];commissioningAccept: Contracts[commissioningAccept]','ConfigurationGuard,PublicationCoordinator,FinGateway,RecordCodec')
cls('ConfigurationGuard','domain/configuration','Validate old/new object scopes and block changes that break unresolved occurrence recovery.','validateDraft;checkActiveOccurrences;checkAcceptanceEvidence','RuleStateStore', 'stateless')
cls('PublicationCoordinator','services/configuration','Serialize project publication; seal entity members then atomic commit decision and uniform activation epoch.','prepare;commitDecision;activate;recoverCommitted','FinGateway,RecordCodec,OperationRepository,AuditRepository')
cls('OperationRepository','persistence','Unique (projectId, operationId) intent, actor/action/context/hash binding, cleanup tombstones and status projection.','operationStatus: Contracts[operationStatus];prepare;recordOutcome;findOriginal','FinGateway,RecordCodec')
cls('AuditRepository','persistence','Append-only intent/result audit, filtered reads, preserve records across migration.','auditList: Contracts[auditList];append','FinGateway,RecordCodec')
cls('RecordCodec','persistence','Explicit tagged payload and native Ref conversion from approved codecs; never serialize DTOs directly as arbitrary Rec.','encode: typed internal value -> Folio record;decode: Folio record -> typed internal value','', 'stateless')
cls('ReportService','services/report','Authorize full report scope, persist jobs, cancel and reauthorize protected download.','reportCreate: Contracts[reportCreate];reportGetList: Contracts[reportGetList];reportDownload: binary success / JSON error;reportCancel: Contracts[reportCancel]','ReportWorker,FinGateway,OperationRepository,AuditRepository')
cls('ReportWorker','services/report','Historical interval aggregation, four templates, bounded file production, checksum and expiry.','execute: ReportJob -> ReportFile;expire;cancelAtBoundary','HistoryService,AlarmService,FinGateway,WorkScheduler')
cls('NotificationService','services/notification','Channels/subscriptions use configuration publication; notification operations control delivery and emergency pause.','notificationTest: Contracts[notificationTest];notificationDeliveryList: Contracts[notificationDeliveryList];notificationRetry: Contracts[notificationRetry];notificationPause: Contracts[notificationPause]','NotificationWorker,FinGateway,OperationRepository,AuditRepository')
cls('NotificationWorker','services/notification','Independent notification cursor/outbox; acquire permit atomically with gate, reconcile unknown delivery without blind resend.','enqueueAuthorityEvent;claimPermit;deliver;reconcileUnknown','NotificationTransport,FinGateway,WorkScheduler')
cls('NotificationTransport','services/notification','Narrow delivery result port implemented by actual Telegram and local simulated transport.','send: immutable payload + permit -> definite/unknown result','', 'stateless contract','mixin')
cls('TelegramTransport','fin','Server-only HTTPS and secret reference resolution; no browser tokens.','send: transport contract','FinGateway', 'project adapter')
cls('SimulatedNotificationTransport','services/simulation','Record local simulated delivery; never open Telegram connection.','send: transport contract','FinGateway')
cls('MetricDictionaryService','services/inventory','Versioned English definitions, units, provenance and limits without duplicated editable thresholds.','metricDictionary: Contracts[metricDictionary]','ConfigurationService')
cls('SimulationService','services/simulation','Own session ACL, generation/control/data revisions, reset/delete fencing and management operations.','simulationCreate;simulationGenerate;simulationControl;simulationStep;simulationScenario;simulationReset;simulationDelete;simulationGetList','SimulationEngine,FinGateway,OperationRepository,AuditRepository,WorkScheduler')
cls('SimulationEngine','domain/simulation','Seeded virtual event progression, durable scenario log/checkpoint and same rule engine as live.','advanceEvents: session + target time -> committed event chunks;replay: initial state + scenario log -> checkpoint','RuleEngine,FinGateway')
cls('UpsDataSource','domain/source','Context-selected read/authority port with live and simulation implementations; never fall back from failed live to simulated.','listEquipment;readPoints;readHistory;readAlarms;acknowledge;applyRuleCommand;reconcileCommand','', 'stateless contract','mixin')
cls('LiveDataSource','fin','Map normalized operations to verified FIN platform semantics.','listEquipment;readPoints;readHistory;readAlarms;acknowledge;applyRuleCommand;reconcileCommand','FinGateway', 'project adapter')
cls('SimulationDataSource','services/simulation','Read and update only generation-fenced simulation records, including simulated alarm authority.','listEquipment;readPoints;readHistory;readAlarms;acknowledge;applyRuleCommand;reconcileCommand','FinGateway,RecordCodec')
cls('FinGateway','fin','Only FIN SDK boundary: project context, identity, points/history/alarms, Folio transaction/CAS, secrets, protected files and lifecycle binding.','readPlatform;commitBusinessRecords;compareAndCommit;readSecretRef;openProtectedFile','', 'project adapter')

names={c['name'] for c in classes}
assert all(d in names for c in classes for d in c['dependencies'])
for c in classes:
    c['operations']=[o['id'] for o in ops if o['owner']==c['name']]
assert all(o['owner'] in names for o in ops)
put('backend-classes.json',classes)

# Planned files only. Plain JavaScript modules preserve the inspected prototype technology.
ui=[]
def uiFile(path, purpose, operations=()): ui.append(dict(file='upsFleet/ui/src/'+path,purpose=purpose,operations=list(operations)))
for p,s in [('app/bootstrap.js','GET bootstrap before versioned API; session capability load'),('app/router.js','Hash route parsing, encoded IDs, navigation and guards'),('app/AppShell.js','Persistent navigation and source banner; default Dashboard'),('app/SourceContext.js','Validated mode/session/generation; clear scoped state on context switch'),('api/operationClient.js','Same-origin envelope, errors, idempotency IDs and bounded polling'),('api/responseDecoder.js','Strict response schema 2.0 validation'),('state/SessionStore.js','Current account capabilities; do not persist credentials'),('state/ViewState.js','Equipment selection, filters, cursor and ranges by source context'),('state/RequestScope.js','Cancel requests and reject late responses by context generation'),('state/ThemeStore.js','Per-user Light/Dark preference; Light default'),('locales/en-US.js','All UI, accessible names and source error translations'),('styles/tokens.css','Theme/spacing/status tokens'),('styles/layout.css','Three-column six-card Dashboard with responsive collapse'),('styles/components.css','44px touch targets, keyboard focus and component states')]: uiFile(p,s)
pageDefs=[('DashboardPage','Snapshot, device tabs, six cards, health ring and inline trends',['OP-02','OP-03','OP-04','OP-22']),('EquipmentPage','Filtered authorized fleet and stable cursor',['OP-02']),('HistoryPage','Segmented historical chart, source provenance and gaps',['OP-04','OP-22']),('AlarmPage','Active/cleared/event tabs and timeline',['OP-05','OP-06','OP-07']),('ReportPage','Create/list/cancel report jobs',['OP-15','OP-16','OP-18']),('ReportDetailPage','Progress and protected binary download',['OP-16','OP-17','OP-18']),('EngineeringPage','Six-step draft editor, validate, publish and rollback draft',['OP-08','OP-09','OP-10','OP-11','OP-07']),('CommissioningPage','Read current evidence and accept configured equipment',['OP-08','OP-12','OP-14']),('NotificationPage','Channels via configuration; delivery list/test/retry/emergency pause',['OP-08','OP-09','OP-10','OP-19','OP-20','OP-21','OP-31']),('DiagnosticsPage','Read-only lifecycle and recovery diagnostics',['OP-12']),('AuditPage','Scoped append-only audit viewer',['OP-13']),('SimulationPage','Session list/create, control, generation, scenario, reset and delete',['OP-23','OP-24','OP-25','OP-26','OP-27','OP-28','OP-29','OP-30'])]
for n,p,o in pageDefs: uiFile('pages/'+n+'.js',p,o)
components={
 'layout':['SourceBanner','EquipmentTabs','ResponsiveShell','ThemeToggle'],
 'dashboard':['KpiCard','HealthRing','LoadBar','BatteryPanel','EnvironmentPanel','OutlookPanel','InlineTrend','MaintenancePanel'],
 'common':['QualityValue','AsyncState','PermissionGate','ConfirmDialog','CursorPager','MetricHelp','ErrorNotice'],
 'history':['HistoryChart','RangeSelector','MappingGapLegend'],
 'alarm':['AlarmTable','AlarmTimeline','AcknowledgeDialog','OperationProgress'],
 'engineering':['EngineeringWizard','EnrollmentStep','CapabilityStep','MappingStep','HistoryRuleStep','PlanEditor','ValidationStep','PublishStep'],
 'report':['ReportForm','ReportJobTable'],
 'notification':['ChannelEditor','SubscriptionEditor','DeliveryTable','PauseDialog'],
 'simulation':['SessionTable','ScenarioControl','GenerationBanner']}
for folder,items in components.items():
    for n in items: uiFile(f'components/{folder}/{n}.js',f'{n}: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority')
for domain, ids in [('session',[1]),('inventory',[2,3,22]),('history',[4]),('alarm',[5,6,7]),('configuration',[8,9,10,11,14]),('diagnostics',[12]),('audit',[13]),('report',[15,16,17,18]),('notification',[19,20,21,31]),('simulation',list(range(23,31)))]:
    uiFile(f'api/{domain}Api.js',f'Typed-by-contract request facade for {domain}; delegates envelope and transport to operationClient',[f'OP-{i:02}' for i in ids])
put('frontend-files.json',ui)
clientOwners={op:f['file'] for f in ui if '/api/' in f['file'] for op in f['operations']}
put('operation-ownership.json',[dict(operation=o['id'],name=o['name'],backendClass=o['owner'],frontendFile=clientOwners[o['id']],requestType=f"Contracts['{o['name']}']['request']",responseType=f"Contracts['{o['name']}']['response']",transport=o['transport'],allowedContexts=o['allowedContexts'],permissionByMode=o['permissionByMode'],scopeByMode=o['scopeByMode'],exception='Binary success; JSON error' if o['id']=='OP-17' else None) for o in ops])

routes=[]
def route(id,path,page,context,ops,notes): routes.append(dict(id=id,path=path,page=page,context=context,operations=ops,guard='Require session; resolve source context; check operation mode/action permissions and referenced scope on server',notes=notes))
for suffix,page,op in [('dashboard','DashboardPage',['OP-02','OP-03','OP-04','OP-22']),('equipment','EquipmentPage',['OP-02']),('equipment/:equipId','DashboardPage',['OP-03']),('equipment/:equipId/history','HistoryPage',['OP-04']),('alarms','AlarmPage',['OP-05']),('reports','ReportPage',['OP-16']),('reports/:jobId','ReportDetailPage',['OP-16','OP-17'])]:
    route('R-L-'+str(len(routes)+1),'#/live/'+suffix,page,'live',op,'No selection: choose first authorized equipment; empty fleet renders explicit no-data state. Detail identifiers never bypass authorization.')
    route('R-S-'+str(len(routes)+1),'#/simulation/:sessionId/:generationId/'+suffix,page,'simulation',op,'Reuse page; require current generation and session ACL. Reset/delete invalidates old views; acknowledgement/export use simulation permissions.')
for suffix,page,op in [('engineering','EngineeringPage',['OP-08','OP-09','OP-10','OP-11']),('engineering/drafts/:draftId','EngineeringPage',['OP-08','OP-09','OP-10','OP-11']),('engineering/commissioning','CommissioningPage',['OP-14']),('engineering/notifications','NotificationPage',['OP-19','OP-20','OP-21','OP-31']),('engineering/diagnostics','DiagnosticsPage',['OP-12']),('engineering/audit','AuditPage',['OP-13'])]: route('R-E-'+str(len(routes)+1),'#/live/'+suffix,page,'live',op,'Engineering actions are live-only; route guards hide controls but server remains authoritative.')
route('R-S-ROOT','#/simulation','SimulationPage','simulation-root',[f'OP-{i:02}' for i in range(23,31)],'Only list/create without a session; other operations require selected session and generation. Read-only account cannot manage.')
route('R-S-NOTIFY','#/simulation/:sessionId/:generationId/notifications','NotificationPage','simulation',['OP-20','OP-21'],'Delivery list/local retry only; no channel editor, external test, publish or emergency pause.')
put('routes.json',routes)

# Preserve every approved public and internal type name as a source reference, not a second contract definition.
publicTypes=re.findall(r'\btype\s+(\w+)',(BASE/'contracts.ts').read_text(encoding='utf-8-sig'))
internalTypes=re.findall(r'\btype\s+(\w+)',(BASE/'persistence-contracts.ts').read_text(encoding='utf-8-sig'))
put('type-inventory.json',{'public':list(dict.fromkeys(publicTypes)),'internal':list(dict.fromkeys(internalTypes)),'authority':'../fsd-r9/contracts.ts and persistence-contracts.ts; references only, no schema change'})
typeDoc='''# Data type and Folio mapping plan

The approved TypeScript contracts specify wire data, not Fantom SDK classes. Their exact names are indexed in `type-inventory.json`; the files are not redefined here. Methods in the class inventory use `Contracts[name]` as an input/output design reference, not compilable Fantom syntax.

| Planned Fantom source | Planned value types and ownership |
|---|---|
| fan/domain/model/ContextTypes.fan | RequestContext, SourceContext, RuntimeEnvelope, StoredMode, RecordIdentity; immutable context values |
| fan/domain/model/TelemetryTypes.fan | Metric, Identity, Capability, BatteryAsset, Snapshot, EquipmentRow, Assessment, HealthIndicator, OutlookItem, AlarmSummary; normalized domain snapshots |
| fan/domain/model/HistoryTypes.fan | HistorySegment; mapping boundary-aware values |
| fan/domain/model/AlarmTypes.fan | Alarm, TimelineItem; authority-backed projections |
| fan/domain/model/RuleTypes.fan | Rule, CountGate, RuleStateRecord, RuleOccurrenceRecord, RuleCommandRecord, ImmutableRulePayload; internal transition values |
| fan/domain/model/ConfigurationTypes.fan | Enrollment, Mapping, Plan, AssessmentBinding, Entity, EntityRecord, Patch, Draft, ValidationReport, AcceptanceReport, Publication, ConfigVersionRecord, EntityVersionRecord |
| fan/domain/model/OperationTypes.fan | Operation, OperationBinding, Audit; immutable intents and result projections |
| fan/domain/model/ReportTypes.fan | ReportParams, ReportJob, ReportFile |
| fan/domain/model/NotificationTypes.fan | NotificationChannel, NotificationSubscription, ChannelGate, NotifyJob |
| fan/domain/model/SimulationTypes.fan | SimSession, SimMutation, ScenarioChange, SimulationSessionRecord, ScenarioEventRecord, SimulationCheckpointRecord |
| fan/domain/model/DictionaryTypes.fan | MetricDefinition |
| fan/web/TransportTypes.fan | Meta, Issue, PartialError, Filter, Page, FleetPage, Diagnostics, response/error envelopes and operation request/response carriers; wire-only shapes |
| fan/domain/model/StatusTypes.fan | Severity, Quality, Comm, PowerMode, Commissioning, ErrorCode, SimState; exact approved enum strings |

Type aliases such as Id, Ts and Scalar need validated value conversion, not a class per alias. Generic TypeScript unions/intersections are not pasted into Fantom. Implement tagged variants/immutable containers after SDK/toolchain verification; preserve discriminants and nullability exactly. BootstrapRequest/Response are transport-only. CoreContracts/ExtendedContracts/Contracts/WireRequest/WireResponse/BootstrapHandler are schema composition references, not domain entities.

| Boundary | Conversion rule |
|---|---|
| JSON Id / record Ref | String identifier at the API; RecordCodec produces native Haystack Ref only in declared Ref slots. Do not create dangling references or treat every string as Ref. |
| Ts / time | Validate timezone-bearing wire timestamps; use verified Fantom DateTime/Haystack time conversion. Retain observation time, ingestion time and virtual time separately. |
| Metric / numbers | Keep null distinct from zero/false; explicit unit and quality; do not store NaN/Infinity as wire values. |
| Tagged Entity / Rule | Strict discriminator and allowed-field validation before codec encoding. No arbitrary Dict pass-through. |
| List / map | Bounded immutable snapshots across scheduled work; mutable state confined to its owning serialized transaction. |
| DTO / Folio Rec | DTO projections are not automatically records. Use approved record-codecs.json, record-manifest.json and Trio tags. Keep revisions, native refs and ownership envelopes. |
| FIN assets / templates | 35 equipment templates describe record shapes, not authorization to import example devices; 76 business templates are model templates, not 76 runtime singleton classes. |

RuleStateRecord is a minimal persistence type in the prior delivery. The implementation must include the reviewed debounce candidate/count/epoch fields from the model/Trio in its complete runtime codec. `currentOccurrenceId` is the rule-state pointer; `occurrenceId` is the occurrence identity. Define the explicit mapping; never create two competing pointers. This is an internal completeness item, not a schema 2.1 public change.

RecordCodec remains one concrete codec boundary with tagged dispatch; domain files group values by lifetime and responsibility. Do not introduce a repository/class for each point or tag. Folio transaction/CAS, protected files, alarm correlation and SDK types remain binding gates, not asserted supported APIs.
'''
put('data-types.md',typeDoc)

backend='''# Fantom backend directory and class blueprint

Design revision B1; no .fan implementation is generated. One business POD: `upsFleet`. Source subdirectories organize files; Fantom types remain in the single `upsFleet::ClassName` namespace. They are not Java-style subpackages; `internal` is POD-wide visibility. See [Fantom classes](https://fantom.org/doc/docLang/Classes), [pods](https://fantom.org/doc/docLang/Pods) and [build conventions](https://fantom.org/doc/docTools/Build). Evidence is language-level, not target FIN compatibility.

```text
upsFleet/
  build.fan                 # planned; exact dependencies and srcDirs await G1
  fan/
    web/                    # facade, authorization, wire codecs
    domain/                 # model values, telemetry, rules, configuration, simulation, source port
    services/               # inventory, telemetry, history, alarm, configuration, report, notification, simulation
    persistence/            # record codecs, rule state, operation journal, audit
    fin/                    # live source, FIN gateway, Telegram transport
    lifecycle/              # bootstrap, bounded scheduler, diagnostics, migration
  ui/src/                   # frontend source listed separately
  res/web/upsFleet/          # built local static assets; generated in future implementation
  locale/                   # packaged en-US backend/report messages
  lib/                      # registration/model descriptors, exact target format pending
  test/                     # future domain, contract, integration and recovery tests
  docs/                     # future compatibility/install/upgrade evidence
```

Directory inclusion must be explicit in the future build configuration. No Java/native peer folders are planned without a demonstrated need. Types and signatures below are project design names, not FIN official APIs. Public request/response fields remain exactly in the approved contracts; no additional backend endpoint is introduced.

## Classes and narrow ports

| Class / planned path | Responsibility | Design methods | Direct dependencies | Lifetime / OP |
|---|---|---|---|---|
'''
for c in classes:
    backend+=f"| `{c['name']}` ({c['kind']})<br>`{c['file']}` | {c['responsibility']} | {'; '.join(c['designMethods'])} | {', '.join(c['dependencies']) or 'None'} | {c['lifetime']}; {', '.join(c['operations']) or 'Internal'} |\n"
backend+='''
## Transaction and lifecycle ownership

- PublicationCoordinator is serialized per project. Prepare immutable EntityVersion members and a sealed ConfigVersion, then atomically commit pointer/publication/mapping/audit decision. After COMMITTED, recover only that candidate. No module emits new side effects until all required modules report the same epoch. Failed activation stays RECOVERY_REQUIRED.
- WorkScheduler feeds live observation/quality/calendar events into RuleEngine after normalized telemetry is available; SimulationEngine feeds virtual events in the approved deterministic order. No browser request drives rule time.
- RuleEngine is the common live/simulation engine. RuleStateStore commits watermark, full rule state, occurrence and command outbox together. Occurrence ordinals and predecessor links order old CLEAR before a new CREATE. AlarmSynchronizer resolves platform IDs only for the target occurrence.
- OperationRepository binds `(projectId, operationId)` to actor/action/context/canonical request hash. Current authorization and original intent lookup precede revision conflict checks where the approved protocol requires it. Cleanup tombstones allow only original operation reconciliation, not fresh old-generation writes.
- SimulationService serializes each session control stream. SimulationEngine commits deterministic event chunks with scenario events/checkpoints and worker fences; reset/delete close the generation before cleanup. Preserve initial seed/scenario/generator/version independently of the latest checkpoint.
- NotificationWorker has a separate outbox and cursor. Claiming permission and emergency pause share an atomic gate. OUTCOME_UNKNOWN enters reconciliation; neither retry buttons nor restarts bypass that state. Simulation selects SimulatedNotificationTransport explicitly.
- ReportWorker has bounded concurrency (two workers under the FSD limits), cancellation checkpoints, protected immutable output and expiry. Reauthorize every referenced device and source generation immediately before download.
- WorkScheduler owns queues/tasks, not individual pages or points. Enforce FSD history/session/project limits. Shared backend checks <=500ms and visible-page polling <=1s are design budgets; 100 UPS/5000 points are test assumptions, not measured capacity.
- Lifecycle startup checks compatibility, recovers committed publication and pending intents, then admits work. Stop rejects new work, fences running workers, persists recoverable checkpoints and releases resources. No implicit business record seeding.

## Dependency rules

Browser -> RequestFacade -> domain services -> normalized source port / persistence -> FinGateway -> FIN. Pure evaluators do not call FIN or HTTP. Only LiveDataSource uses FIN live point/history/alarm authority; SimulationDataSource uses isolated simulation records. Both use the same domain rules. NotificationTransport is a mixin because two concrete implementations are required. Do not add general service locators, event buses, generic repository factories or a class per field.

RequestFacade composes the explicitly mapped service owners in operation-ownership.json. DtoCodec checks runtime data; TypeScript declarations alone do not validate incoming JSON. Final HTTP route registration, FIN extension base class, SDK dependency versions, transaction primitives and scheduler threading must be verified before implementation.
'''
put('backend-design.md',backend)

front='''# Frontend routes, pages and components

Design only. The inspected UPS-FSD-R4 app.js is plain JavaScript with hash navigation. Keep local JavaScript modules and CSS, splitting that monolithic prototype by page/domain without introducing an unapproved framework migration. `.js` names are planned files, not generated implementations. Local dependency packaging and the FIN resource entry path await target SDK binding.

```text
upsFleet/ui/
  index.html
  package.json / lockfile        # future reproducible local tooling, versions not selected here
  src/
    app/                        # bootstrap, router, shell, source context
    pages/                      # route-level composition and page actions
    components/                 # reusable views grouped by business domain
    api/                        # operation families and shared same-origin client
    state/                      # session, view state, request cancellation, theme
    locales/en-US.js
    styles/                     # tokens, layout, components
  test/                         # planned route, contract and interaction acceptance
```

The default route redirects to `#/live/dashboard` after bootstrap and capabilities. Dashboard preserves authorized equipment selection or picks the first authorized UPS; empty/forbidden/unconnected are explicit states. Unknown routes show Not Found with safe navigation. Invalid object IDs show the same unavailable state as unauthorized IDs. URI-encode opaque IDs; never infer permission or mode from an ID string.

Hash routes avoid assuming unverified server rewrite support. Legacy prototype `#dashboard`, `#devices`, `#config`, etc. receive explicit aliases in the future router; do not silently break saved navigation. Site/filter/cursor/history range are query/view state, not additional pages. Alarm timeline/ack and metric help are dialogs/drawers with focus return; no extra endpoint or page is needed.

## Route inventory

| Route | Page | Context | Read/action constraints |
|---|---|---|---|
'''
for r in routes: front+=f"| `{r['path']}` | {r['page']} | {r['context']} | {r['notes']} |\n"
front+='''
## Page and component ownership

Pages orchestrate domain API calls and hold page state; components receive explicit values/actions and do not independently poll FIN. API family files own the 31 request builders; operationClient owns transport only. NotificationPage shares its delivery view in simulation, with a restricted action set. EngineeringWizard follows the FSD six steps: Enrollment -> Capabilities -> Mapping -> History/Rules -> Validation -> Publish. PlanEditor is an embedded editor in the engineering draft, not a seventh wizard step. Capability declaration is limited to the approved 2.0 contract and verified platform inputs; it does not enable candidate assetProfile writes.

| Planned file | Responsibility | Operations |
|---|---|---|
'''
for f in ui: front+=f"| `{f['file']}` | {f['purpose']} | {', '.join(f['operations']) or 'None directly'} |\n"
front+='''
## State, security and presentation rules

- Context key includes project, actor, mode, session and generation. Switching context aborts requests and discards late results; cached live data never appears under a simulation banner or vice versa. Rotation/theme changes preserve filters and do not reissue mutations.
- Bootstrap GET precedes schema 2.0 requests; version mismatch gets a clear upgrade page. All 31 operations use the approved envelope and permissionByMode matrix. Simulation read/ack/export/manage are separate from live capabilities; root simulation list/create do not authorize arbitrary session actions.
- Read actions can be refreshed within rate limits. A mutation creates one operationId; timeout/unknown transitions to OperationProgress and OP-07 reconciliation. Do not synthesize success or retry a new mutation ID after ambiguous submission. OP-17 handles binary success and JSON failure separately.
- RequestScope controls visibility-based polling and bounded concurrency. A page leaving the screen cancels its subscribers, not the project's shared backend acquisition. Session expiry clears data and prompts sign-in; permissions are always rechecked on the server.
- ThemeStore persists only theme under project/account key. No secrets, snapshots, notification credentials or permission grants in localStorage. Raw HTML is never populated from unescaped source labels/errors.
- Preserve the approved Dashboard: device tabs, three-column six-card layout, health ring, load bars and inline trends. QualityValue handles good/stale/fault/missing consistently; unknown scores show neutral unavailable state, not inferred scores. Q reads current R-01.requiredMinutes; impedance reference reads R-03 baseline, never a second UI threshold.
- All product text, errors, exports, aria/title and generated descriptions are en-US. Default Light; Dark changes colors, not semantics. Reports/PDF use fixed light output. Layout classes cover <640px, 640–980px, >980px with 44px targets, keyboard support and dialog focus return. Detailed visual acceptance remains the existing FSD/UI matrix.
- Plans live in the engineering PlanEditor and Dashboard MaintenancePanel; there is no invented maintenance write API. FR-18/19 later enhancements and FR-20 prediction/cross-project scope remain their existing phases.
'''
put('frontend-design.md',front)

# Pull SF rows exactly from the approved implementation list; retain RTM as canonical FR mapping.
sf=[]
for line in (BASE/'interface-implementation-list.md').read_text(encoding='utf-8-sig').splitlines():
    if re.match(r'^\|SF-\d+',line):
        cols=line.strip('|').split('|'); sf.append(dict(id=cols[0],requirementDescription=cols[1],fsdSection=cols[2],operations=cols[3],approvedEntry=cols[4],models=cols[5],acceptanceIntent=cols[6]))
sfOwners=[('TelemetryService','DashboardPage'),('QualityEvaluator','QualityValue'),('CommunicationResolver','EquipmentPage'),('InventoryService','EquipmentPage'),('TelemetryService','DashboardPage'),('HistoryService','HistoryPage'),('AlarmService','AlarmPage'),('ConfigurationService','EngineeringPage'),('RuleEngine','None'),('RuleEvaluator','HistoryRuleStep'),('AlarmSynchronizer','AlarmTimeline'),('AcknowledgementCoordinator','AcknowledgeDialog'),('AuditRepository','AuditPage'),('ConfigurationService','EngineeringWizard'),('PublicationCoordinator','PublishStep'),('ConfigurationGuard','ValidationStep'),('Lifecycle','DiagnosticsPage'),('WorkScheduler','RequestScope'),('MigrationRunner','None'),('ReportWorker','ReportPage'),('NotificationWorker','NotificationPage'),('None','ThemeStore'),('SimulationService','SimulationPage'),('None','ResponsiveShell')]
for row,(b,f) in zip(sf,sfOwners): row.update(backend=b,frontend=f)
put('spec-coverage.json',sf)
trace='''# Requirement and acceptance handoff

Source descriptions and SF IDs below are copied from the approved interface list; PRD/FSD/RTM remain authoritative. The current RTM is a revision-10 working document, not evidence of r10 approval. This blueprint assigns implementation responsibility without redefining acceptance or marking tests passed.

| SF | FSD section | Backend owner | Frontend owner | Approved entry / OP |
|---|---|---|---|---|
'''
for s in sf: trace+=f"| {s['id']} | {s['fsdSection']} | {s['backend']} | {s['frontend']} | {s['approvedEntry']} / {s['operations']} |\n"
trace+='''
| Implementation increment | PRD/RTM relationship | Existing acceptance IDs to carry into implementation |
|---|---|---|
| Bootstrap, authorized fleet and snapshots | FR-01–08, FR-14–17; FSD 3–5/9/10/11 | FT-32, FT-34, FT-36; UI-01–12 |
| History and mapping boundaries | FR-09; FSD 5.3/5.6 | FT-31; original history vectors in RTM |
| Rule lifecycle, acknowledgement and audit | FR-10/11/12/16/17; FSD 6/7 | FT-24–28, FT-33–35 |
| Configuration, commissioning and recovery | FR-13/16/17; FSD 8 | FT-22/23, FT-27–30 |
| Definitions, reports and notifications | FR-21/22/23; FSD 18 | NEW-01–10, R7-08/09 |
| Theme, language, responsive and touch | FR-24/26; FSD 18.4/21/22 | NEW-11/12, UI-01–12; exact language/responsive IDs in current RTM |
| Simulation and fences | FR-25; FSD 19 | SIM-01–08, R7-02/04/06/07 |

These are selected handoff links, not a replacement or an exhaustive reallocation of the RTM. Development must retain all applicable cases including original FT-01–21. The 24 SFs and 31 OPs are structurally covered by the JSON inventories. FR-18–20 stay in the existing later phases. No product acceptance test was executed by this design task.

Implementation gates: (1) bind actual FIN/Fantom versions, resource registration, identity APIs, CAS/transactions, alarm correlation and protected file handling; (2) implement strict contract and record codecs; (3) prove authorization/idempotency and fault recovery before enabling writes; (4) integrate domain services and UI against controlled FIN; (5) run complete RTM and field acceptance with measured evidence. Each future change belongs on a Leader-assigned branch and includes its SF/FR/OP/acceptance references.
'''
put('traceability.md',trace)

files=['doc/planning/UPS-Fleet-FIN-POD-PRD-v0.1.md','doc/planning/UPS-Fleet-FIN-POD-FSD-v0.1.md','doc/planning/UPS-Fleet-Requirements-Traceability-Matrix-v0.1.md','doc/planning/UPS-Fleet-FSD-r10-review-disposition.md','doc/UI prototype/UPS-FSD-R4/app.js']
files+=['doc/architecture/fsd-r9/'+f for f in ['operations.json','contracts.ts','persistence-contracts.ts','equipment-objects.trio','business-objects.trio','record-manifest.json','record-codecs.json','persistence-design.md','interface-implementation-list.md','architecture-review-results.md','review-disposition.md']]
baseline=dict(capturedAt=datetime.now(timezone.utc).isoformat(),branch='feature/fsd-r4-static-demo',schema='2.0',designRevision='B1',authorization={'user':'Current task: interface list and related Trio passed review; requests design skeleton only. Exact bytes pinned below; this is a new capture, not a historical approval signature.','leader':'2026-09-15 message: assigned doc/architecture/application-blueprint on existing branch; no branch switch, commit or changes outside directory.'},originalFsdR9Hash=json.loads((BASE/'record-manifest.json').read_text())['baseline'],files=[])
for p in files:
    assert (ROOT/p).exists(),p
    baseline['files'].append(dict(path=p,sha256=hashlib.sha256((ROOT/p).read_bytes()).hexdigest()))
put('baseline.json',baseline)
put('decisions-and-boundaries.md','''# Decisions, approval scope and unresolved bindings

The user stated that the interface list and related Trio passed review. This design uses the existing fsd-r9 A2.2 schema 2.0 delivery, with exact current input hashes in baseline.json. The statement did not supply a historical hash; the capture proves the current source bytes, not a new retrospective approval certificate. The previous review/disposition remains the record of design closure.

Leader explicitly assigned only this directory on feature/fsd-r4-static-demo. No branch switch, commit or push is part of the task. Prior FSD/RTM/architecture files are preserved.

| Item | Treatment in this blueprint | Next evidence needed |
|---|---|---|
| FSD r10 sections 23.1–23.6 | Map to already reviewed AR-01/02/04/05/06/07/08 internal protocols; no assertion of whole-r10 approval | Planning/review final r10 decision |
| AR-03 / schema 2.1 candidate | Not enabled. assetProfile/environmentBinding editing and associated payload variants are excluded from active 2.0 routes/contracts | Explicit public-contract approval and migration evidence |
| Future schema 2.1 impact | ConfigurationTypes, DtoCodec, RecordCodec, ConfigurationGuard and engineering editor gain approved variants; inventory remains read-only over current 2.0 response | Freeze discriminants, evidence/range checks, migration/rollback and mixed-client policy before adding files |
| RuleState minimal type | Full internal runtime codec must incorporate existing candidate/count/epoch fields and map currentOccurrenceId to occurrence identity | Contract/codec integration and recovery vectors |
| FIN/Fantom runtime | Unknown/unverified; project class names and gateway methods are proposals | Versioned SDK symbols, extension registration, build dependencies and real compile/integration evidence |
| Transaction capability | Required invariants are explicit; not claimed available in target SDK | Atomic rule transition/publication/gate CAS and restart tests; if unsupported, re-review before implementation |
| Frontend framework | Plain JS module plan follows current prototype; no framework migration | Local bundler/package versions and browser/FIN resource compatibility |

Official language evidence: FIN Expert record fin_web_language_reference_29b1ab20b34f11b5, retrieved 2026-08-28, Fantom documentation 1.0.83. It supports source/build conventions only and has no FIN-version applicability claim. Direct official references: https://fantom.org/doc/docTools/Build, https://fantom.org/doc/docLang/Classes, https://fantom.org/doc/docLang/Pods.
''')

# UML overview and detailed class diagrams: every behavior class is represented in one detailed diagram.
groups={'backend-core-uml':[c for c in classes if c['name'] in {'Lifecycle','LifecycleDiagnostics','MigrationRunner','WorkScheduler','RequestFacade','RequestGuard','DtoCodec','InventoryService','TelemetryService','QualityEvaluator','CommunicationResolver','AssessmentEvaluator','HistoryService','MetricDictionaryService','UpsDataSource','LiveDataSource','SimulationDataSource','FinGateway'}], 'backend-state-uml':[c for c in classes if c['name'] not in {'Lifecycle','LifecycleDiagnostics','MigrationRunner','WorkScheduler','RequestFacade','RequestGuard','DtoCodec','InventoryService','TelemetryService','QualityEvaluator','CommunicationResolver','AssessmentEvaluator','HistoryService','MetricDictionaryService','UpsDataSource','LiveDataSource','SimulationDataSource','FinGateway'}]}
diagrams={}
for key,group in groups.items():
    lines=['classDiagram','direction TB']
    edges=[]; nodeNames={c['name'] for c in group}
    for c in group:
        lines+=['class '+c['name']+' {']
        if c['kind']=='mixin': lines+=['  <<interface>>']
        for m in c['designMethods'][:3]: lines+=['  +'+re.split(r'[:; ]',m)[0]+'()']
        lines+=['}']
    for c in group:
        for d in c['dependencies']:
            if d in nodeNames: edges.append((c['name'],d,'depends'))
    for impl,port in [('LiveDataSource','UpsDataSource'),('SimulationDataSource','UpsDataSource'),('TelegramTransport','NotificationTransport'),('SimulatedNotificationTransport','NotificationTransport')]:
        if impl in nodeNames and port in nodeNames: edges.append((impl,port,'realizes'))
    lines += [f'{a} '+('..|>' if k=='realizes' else '..>')+f' {b}' for a,b,k in edges]
    put(key+'.mmd','\n'.join(lines)+'\n')
    diagrams[key]=dict(kind='uml',nodes=[dict(id=c['name'],label=c['name'],methods=[re.split(r'[:; ]',m)[0]+'()' for m in c['designMethods'][:3]],interface=c['kind']=='mixin') for c in group],edges=edges)

nodes=[('Browser','Browser / en-US UI'),('Api','Bootstrap + 31 operations\nRequestFacade / guard / codec'),('Domain','Inventory / telemetry / history\nRules / alarms / configuration'),('Jobs','Reports / notification workers\nBounded scheduler'),('Live','LiveDataSource'),('Sim','SimulationDataSource\nSimulationEngine + shared RuleEngine'),('Gateway','FinGateway\nVerified SDK binding pending'),('Fin','FIN identity / points / history / alarms'),('Folio','Folio business records\nConfig / intents / outboxes / audit'),('Files','Protected report files'),('Devices','UPS / sensors / FIN connectors'),('Telegram','Telegram API\nServer transport only'),('Local','Simulated delivery\nNo external send')]
edges=[('Browser','Api',''),('Api','Domain',''),('Api','Jobs',''),('Domain','Live','live context'),('Domain','Sim','simulation context'),('Live','Gateway',''),('Sim','Gateway','isolated records only'),('Jobs','Gateway',''),('Gateway','Fin',''),('Gateway','Folio',''),('Gateway','Files',''),('Devices','Fin',''),('Jobs','Telegram','live + gate permit'),('Jobs','Local','simulation')]
diagrams['system-architecture']=dict(kind='flow',nodes=[dict(id=i,label=l) for i,l in nodes],edges=edges)
nodes=[('Start','Bootstrap + session capabilities'),('Root','AppShell / validated SourceContext'),('Live','Live context'),('Sessions','SimulationPage\nList / create'),('Selected','Selected simulation\nSession + generation ACL'),('Dash','DashboardPage / EquipmentPage'),('Hist','HistoryPage'),('Alarm','AlarmPage / timeline / ack'),('Reports','ReportPage / ReportDetailPage'),('Eng','EngineeringPage\nSix-step draft wizard'),('Commission','CommissioningPage'),('Notify','NotificationPage\nLive: configure / test / pause'),('Diag','DiagnosticsPage / AuditPage'),('LocalNotify','NotificationPage\nSimulation: local delivery / retry')]
edges=[('Start','Root',''),('Root','Live','default dashboard'),('Root','Sessions',''),('Sessions','Selected',''),('Live','Dash',''),('Selected','Dash','same pages / isolated data'),('Dash','Hist','equipment history'),('Live','Alarm',''),('Selected','Alarm','sim permissions'),('Live','Reports',''),('Selected','Reports','sim permissions'),('Live','Eng',''),('Eng','Commission',''),('Eng','Notify',''),('Eng','Diag',''),('Selected','LocalNotify','')]
diagrams['frontend-routes']=dict(kind='flow',nodes=[dict(id=i,label=l) for i,l in nodes],edges=edges)
for key,d in diagrams.items():
    if d['kind']=='flow':
        lines=['flowchart TB']+[f'  {n["id"]}["{n["label"].replace(chr(10),"<br/>")}"]' for n in d['nodes']]
        lines += [f'  {a} -->'+(f'|"{k}"|' if k else '')+f' {b}' for a,b,k in d['edges']]
        put(key+'.mmd','\n'.join(lines)+'\n')
put('diagram-models.json',diagrams)
put('README.md',f'''# UPS Fleet application blueprint B1

2026-09-15 • Architect design handoff • schema 2.0 • No application implementation

This package plans the backend and frontend from the approved interface/Trio delivery. It contains {len(classes)} behavior classes/ports, grouped value-type source plans, {len(ui)} frontend source-file entries, {len(pageDefs)} pages, {len(routes)} route patterns, all {len(ops)} operations and all {len(sf)} functional specifications. Counts describe design inventory, not implemented or compiled code.

1. [Backend directories and classes](backend-design.md)
2. [Data types and Folio mapping](data-types.md)
3. [Frontend routes, pages and components](frontend-design.md)
4. [Operation ownership and exact contract references](operation-ownership.json)
5. [SF/RTM acceptance handoff](traceability.md)
6. [Approval, candidate and SDK boundaries](decisions-and-boundaries.md), [input hashes](baseline.json)
7. [Structural validation](validation.json)
8. [Component inputs and events](component-contracts.md)
9. [Planned verification files](planned-verification-files.md)
10. [FIN Expert validation scope and results](fin-expert-validation.json)

## Backend UML: entry, telemetry and platform boundary
![Backend core UML](backend-core-uml.svg)

## Backend UML: stateful domains and workers
![Backend state UML](backend-state-uml.svg)

Dashed arrows mean dependency; dashed hollow triangles mean realization of the two mixins. Diagrams show important methods for readability; backend-classes.json is the complete responsibility/dependency inventory. Cross-sheet dependencies remain in that inventory, not duplicated into an unreadable global class diagram. Immutable value groups are specified in data-types.md.

## Frontend route block diagram
![Frontend routes](frontend-routes.svg)

## System architecture
![System architecture](system-architecture.svg)

Each diagram has editable Mermaid source and matching SVG/PNG rendering from diagram-models.json. API URLs are project proposals inherited from the approved interface list, not FIN official endpoints. Target SDK registration, compile/runtime, transaction guarantees and field acceptance are unverified. FSD r10 as a whole and schema 2.1 are not approved by this blueprint. No source stubs, production records, live calls, commit or push were created.
''')
assert all(s['frontend']=='None' or any(f['file'].endswith('/'+s['frontend']+'.js') for f in ui) for s in sf)
assert all(s['backend']=='None' or s['backend'] in names for s in sf)
assert len(sf)==24 and len(ops)==31
assert len(clientOwners)==31
assert len({c['name'] for c in classes})==len(classes)
assert len({f['file'] for f in ui})==len(ui)
assert len({r['path'] for r in routes})==len(routes)
assert all(r['page'] in {p[0] for p in pageDefs} for r in routes)
assert all(o in clientOwners for r in routes for o in r['operations'])
assert all(hashlib.sha256((ROOT/f['path']).read_bytes()).hexdigest()==f['sha256'] for f in baseline['files'])
put('validation.json',dict(status='passed',scope='Documentation structural checks only',counts=dict(backendBehaviorTypes=len(classes),frontendFiles=len(ui),pages=len(pageDefs),routes=len(routes),operations=len(ops),functionalSpecifications=len(sf)),checks=['All 31 approved operations have exactly one backend owner and one API client owner','Backend dependencies reference declared classes','Unique class, file and route identifiers','All routes reference declared pages and operations','All 24 SF rows mapped to design owners','Referenced baseline files exist and SHA-256 is recorded','No approved source overwritten by generator'],runtimeVerified=False,sdkCompiled=False,productAcceptanceExecuted=False))
print(json.dumps({'output':str(OUT),'classes':len(classes),'frontendFiles':len(ui),'routes':len(routes),'operations':len(ops)}))
import runpy
runpy.run_path(str(OUT/'revise-b1.py'), run_name='__main__')
