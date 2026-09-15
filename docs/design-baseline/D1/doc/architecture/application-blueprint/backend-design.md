# Fantom backend directory and class blueprint

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
| `Lifecycle` (class)<br>`upsFleet/fan/lifecycle/Lifecycle.fan` | Own startup, recovery readiness and stop; never create production demo records. | start: recover before admit; stop: drain and release | LifecycleDiagnostics, MigrationRunner, WorkScheduler, PublicationCoordinator | project service; Internal |
| `LifecycleDiagnostics` (class)<br>`upsFleet/fan/lifecycle/LifecycleDiagnostics.fan` | Read module epochs, queue health and recovery state. | diagnostics: Contracts[diagnostics] | FinGateway, WorkScheduler | project service; OP-12 |
| `MigrationRunner` (class)<br>`upsFleet/fan/lifecycle/MigrationRunner.fan` | Version checks, backup manifest and restart-safe migration; no automatic schema 2.1 activation. | inspectCompatibility; planMigration; resumeMigration | FinGateway, RecordCodec, AuditRepository | project service; Internal |
| `WorkScheduler` (class)<br>`upsFleet/fan/lifecycle/WorkScheduler.fan` | Bound shared polling, history requests, report jobs and per-session simulation work. | admit; cancel; drain | None | project scheduler; Internal |
| `RequestFacade` (class)<br>`upsFleet/fan/web/RequestFacade.fan` | Bootstrap and 31-operation dispatch; normalize response envelope and correlation ID. | bootstrap: BootstrapRequest -> BootstrapResponse; dispatch: WireRequest<K> -> WireResponse<K>; sessionCapabilities: Contracts[sessionCapabilities] | RequestGuard, DtoCodec, OperationRepository | project service; OP-01 |
| `RequestGuard` (class)<br>`upsFleet/fan/web/RequestGuard.fan` | Authenticate, authorize action and all referenced objects, validate source context and limits before side effects. | authorize: request + FIN session -> authorized context; checkOriginalOperationBinding | FinGateway | project service; Internal |
| `DtoCodec` (class)<br>`upsFleet/fan/web/DtoCodec.fan` | Strict schema 2.0 JSON discriminants, nulls, enums, unknown-field rejection and response projection. | decodeRequest<K>; encodeResponse<K>; encodeDownloadError | None | stateless; Internal |
| `InventoryService` (class)<br>`upsFleet/fan/services/inventory/InventoryService.fan` | Authorized equipment/child inventory and frozen-member cursors; FIN identity remains authoritative. | equipmentList: Contracts[equipmentList] | UpsDataSource, ConfigurationService | project service; OP-02 |
| `TelemetryService` (class)<br>`upsFleet/fan/services/telemetry/TelemetryService.fan` | Shared batch acquisition and coherent, epoch-tagged snapshots; UI polling never increases device sampling. | equipmentSnapshot: Contracts[equipmentSnapshot]; pollBatch: source observations -> snapshots | UpsDataSource, QualityEvaluator, CommunicationResolver, AssessmentEvaluator, WorkScheduler | project service; OP-03 |
| `QualityEvaluator` (class)<br>`upsFleet/fan/domain/telemetry/QualityEvaluator.fan` | Preserve zero/false and native timestamps; missing or invalid values do not become fabricated healthy values. | evaluate: observation + mapping + time -> Metric | None | stateless; Internal |
| `CommunicationResolver` (class)<br>`upsFleet/fan/domain/telemetry/CommunicationResolver.fan` | Resolve communication separately from power mode and alarm state. | resolve: source diagnostics -> Comm | None | stateless; Internal |
| `AssessmentEvaluator` (class)<br>`upsFleet/fan/domain/telemetry/AssessmentEvaluator.fan` | Risk and coverage use rule evidence; external health score and outlook remain separately sourced. | evaluate: evidence + bindings -> Assessment | None | stateless; Internal |
| `HistoryService` (class)<br>`upsFleet/fan/services/history/HistoryService.fan` | Query half-open mapping segments, enforce bucket/curve limits and preserve gaps. | metricHistory: Contracts[metricHistory]; querySegments: mapping intervals + window -> HistorySegment[] | UpsDataSource, ConfigurationService, WorkScheduler | project service; OP-04 |
| `RuleEngine` (class)<br>`upsFleet/fan/domain/rules/RuleEngine.fan` | Process sample, quality and calendar drivers; persist state/watermark/occurrence/commands atomically. | advance: event + runtime state -> transition; recover: checkpoint -> ready state | RuleEvaluator, RuleStateStore | project service; Internal |
| `RuleEvaluator` (class)<br>`upsFleet/fan/domain/rules/RuleEvaluator.fan` | R-01 through R-05, hysteresis/count gates and maintenance transitions; no external writes. | evaluate: rule + prior state + event -> transition | None | stateless; Internal |
| `RuleStateStore` (class)<br>`upsFleet/fan/persistence/RuleStateStore.fan` | Atomic rule transition and occurrence chain storage, including debounce candidates/counts/epoch and runtime fence. | load; commitTransition: expected revision + state + occurrence + commands | FinGateway, RecordCodec | project service; Internal |
| `AlarmService` (class)<br>`upsFleet/fan/services/alarm/AlarmService.fan` | Normalize authority-backed alarms and timeline; delegate reliable single acknowledgement. | alarmListDetail: Contracts[alarmListDetail]; alarmAcknowledge: Contracts[alarmAcknowledge] | UpsDataSource, AlarmSynchronizer, AcknowledgementCoordinator | project service; OP-05, OP-06 |
| `AlarmSynchronizer` (class)<br>`upsFleet/fan/services/alarm/AlarmSynchronizer.fan` | Dispatch ordered immutable CREATE/SEVERITY/CLEAR commands and reconcile uncertain outcomes by occurrence correlation. | dispatchNext; reconcileUnknown | UpsDataSource, RuleStateStore, AuditRepository | project service; Internal |
| `AcknowledgementCoordinator` (class)<br>`upsFleet/fan/services/alarm/AcknowledgementCoordinator.fan` | Persist intent before acknowledgement; unknown result enters read-only reconciliation. | execute: authorized ack -> Operation; reconcile: operation binding -> authority observation | UpsDataSource, OperationRepository, AuditRepository | project service; Internal |
| `ConfigurationService` (class)<br>`upsFleet/fan/services/configuration/ConfigurationService.fan` | Own draft CAS, full immutable configuration snapshots, validation and commissioning. | configGetSaveDraft: Contracts[configGetSaveDraft]; configValidate: Contracts[configValidate]; configPublish: Contracts[configPublish]; configRollbackDraft: Contracts[configRollbackDraft]; commissioningAccept: Contracts[commissioningAccept] | ConfigurationGuard, PublicationCoordinator, FinGateway, RecordCodec | project service; OP-08, OP-09, OP-10, OP-11, OP-14 |
| `ConfigurationGuard` (class)<br>`upsFleet/fan/domain/configuration/ConfigurationGuard.fan` | Validate old/new object scopes and block changes that break unresolved occurrence recovery. | validateDraft; checkActiveOccurrences; checkAcceptanceEvidence | RuleStateStore | stateless; Internal |
| `PublicationCoordinator` (class)<br>`upsFleet/fan/services/configuration/PublicationCoordinator.fan` | Serialize project publication; seal entity members then atomic commit decision and uniform activation epoch. | prepare; commitDecision; activate; recoverCommitted | FinGateway, RecordCodec, OperationRepository, AuditRepository | project service; Internal |
| `OperationRepository` (class)<br>`upsFleet/fan/persistence/OperationRepository.fan` | Unique (projectId, operationId) intent, actor/action/context/hash binding, cleanup tombstones and status projection. | operationStatus: Contracts[operationStatus]; prepare; recordOutcome; findOriginal | FinGateway, RecordCodec | project service; OP-07 |
| `AuditRepository` (class)<br>`upsFleet/fan/persistence/AuditRepository.fan` | Append-only intent/result audit, filtered reads, preserve records across migration. | auditList: Contracts[auditList]; append | FinGateway, RecordCodec | project service; OP-13 |
| `RecordCodec` (class)<br>`upsFleet/fan/persistence/RecordCodec.fan` | Explicit tagged payload and native Ref conversion from approved codecs; never serialize DTOs directly as arbitrary Rec. | encode: typed internal value -> Folio record; decode: Folio record -> typed internal value | None | stateless; Internal |
| `ReportService` (class)<br>`upsFleet/fan/services/report/ReportService.fan` | Authorize full report scope, persist jobs, cancel and reauthorize protected download. | reportCreate: Contracts[reportCreate]; reportGetList: Contracts[reportGetList]; reportDownload: binary success / JSON error; reportCancel: Contracts[reportCancel] | ReportWorker, FinGateway, OperationRepository, AuditRepository | project service; OP-15, OP-16, OP-17, OP-18 |
| `ReportWorker` (class)<br>`upsFleet/fan/services/report/ReportWorker.fan` | Historical interval aggregation, four templates, bounded file production, checksum and expiry. | execute: ReportJob -> ReportFile; expire; cancelAtBoundary | HistoryService, AlarmService, FinGateway, WorkScheduler | project service; Internal |
| `NotificationService` (class)<br>`upsFleet/fan/services/notification/NotificationService.fan` | Channels/subscriptions use configuration publication; notification operations control delivery and emergency pause. | notificationTest: Contracts[notificationTest]; notificationDeliveryList: Contracts[notificationDeliveryList]; notificationRetry: Contracts[notificationRetry]; notificationPause: Contracts[notificationPause] | NotificationWorker, FinGateway, OperationRepository, AuditRepository | project service; OP-19, OP-20, OP-21, OP-31 |
| `NotificationWorker` (class)<br>`upsFleet/fan/services/notification/NotificationWorker.fan` | Independent notification cursor/outbox; acquire permit atomically with gate, reconcile unknown delivery without blind resend. | enqueueAuthorityEvent; claimPermit; deliver; reconcileUnknown | NotificationTransport, FinGateway, WorkScheduler | project service; Internal |
| `NotificationTransport` (mixin)<br>`upsFleet/fan/services/notification/NotificationTransport.fan` | Narrow delivery result port implemented by actual Telegram and local simulated transport. | send: immutable payload + permit -> definite/unknown result | None | stateless contract; Internal |
| `TelegramTransport` (class)<br>`upsFleet/fan/fin/TelegramTransport.fan` | Server-only HTTPS and secret reference resolution; no browser tokens. | send: transport contract | FinGateway | project adapter; Internal |
| `SimulatedNotificationTransport` (class)<br>`upsFleet/fan/services/simulation/SimulatedNotificationTransport.fan` | Record local simulated delivery; never open Telegram connection. | send: transport contract | FinGateway | project service; Internal |
| `MetricDictionaryService` (class)<br>`upsFleet/fan/services/inventory/MetricDictionaryService.fan` | Versioned English definitions, units, provenance and limits without duplicated editable thresholds. | metricDictionary: Contracts[metricDictionary] | ConfigurationService | project service; OP-22 |
| `SimulationService` (class)<br>`upsFleet/fan/services/simulation/SimulationService.fan` | Own session ACL, generation/control/data revisions, reset/delete fencing and management operations. | simulationCreate; simulationGenerate; simulationControl; simulationStep; simulationScenario; simulationReset; simulationDelete; simulationGetList | SimulationEngine, FinGateway, OperationRepository, AuditRepository, WorkScheduler | project service; OP-23, OP-24, OP-25, OP-26, OP-27, OP-28, OP-29, OP-30 |
| `SimulationEngine` (class)<br>`upsFleet/fan/domain/simulation/SimulationEngine.fan` | Seeded virtual event progression, durable scenario log/checkpoint and same rule engine as live. | advanceEvents: session + target time -> committed event chunks; replay: initial state + scenario log -> checkpoint | RuleEngine, FinGateway | project service; Internal |
| `UpsDataSource` (mixin)<br>`upsFleet/fan/domain/source/UpsDataSource.fan` | Context-selected read/authority port with live and simulation implementations; never fall back from failed live to simulated. | listEquipment; readPoints; readHistory; readAlarms; acknowledge; applyRuleCommand; reconcileCommand | None | stateless contract; Internal |
| `LiveDataSource` (class)<br>`upsFleet/fan/fin/LiveDataSource.fan` | Map normalized operations to verified FIN platform semantics. | listEquipment; readPoints; readHistory; readAlarms; acknowledge; applyRuleCommand; reconcileCommand | FinGateway | project adapter; Internal |
| `SimulationDataSource` (class)<br>`upsFleet/fan/services/simulation/SimulationDataSource.fan` | Read and update only generation-fenced simulation records, including simulated alarm authority. | listEquipment; readPoints; readHistory; readAlarms; acknowledge; applyRuleCommand; reconcileCommand | FinGateway, RecordCodec | project service; Internal |
| `FinGateway` (class)<br>`upsFleet/fan/fin/FinGateway.fan` | Only FIN SDK boundary: project context, identity, points/history/alarms, Folio transaction/CAS, secrets, protected files and lifecycle binding. | readPlatform; commitBusinessRecords; compareAndCommit; readSecretRef; openProtectedFile | None | project adapter; Internal |

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

## B1.1 composition and incremental implementation

backend-classes.json lists static class dependencies. composition.json additionally specifies all 31 direct RequestFacade owner bindings and bounded runtime task/callback registrations. Lifecycle.start owns assembly; WorkScheduler receives callbacks rather than statically depending on domain services. Every registration names existing design methods. UML intentionally omits these runtime registration edges.

| Registration | Registrar | Callbacks | Scope |
|---|---|---|---|
| live-observations | Lifecycle.start | TelemetryService.pollBatch, RuleEngine.advance | project live |
| rule-command-outbox | Lifecycle.start | AlarmSynchronizer.dispatchNext, AlarmSynchronizer.reconcileUnknown | project + occurrence chain |
| reports | ReportService.reportCreate | ReportWorker.execute | job + source context |
| notifications | Lifecycle.start | NotificationWorker.deliver, NotificationWorker.reconcileUnknown | channel/source context |
| simulation | SimulationService.simulationControl | SimulationEngine.advanceEvents | session/generation/worker fence |

The 39 behavior types and 79 frontend source entries are an incremental responsibility inventory, not a requirement to create all empty classes/files at once. Implement only the approved increment and its concrete dependencies. Keep the existing RuleState completeness/currentOccurrenceId mapping handoff unchanged.

Notification uncertainty: automatic/blind retry remains prohibited. The approved OP-21 permits an authorized administrator to explicitly request a resend with acceptDuplicateRisk=true under the approved state, mode, object scope and audit checks. This is not automatic reconciliation and must disclose possible duplicate delivery. Simulation retry remains local-only. Neither page admission nor a worker restart grants this override.

