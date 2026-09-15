# Data type and Folio mapping plan

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
