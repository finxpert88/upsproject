// Extracted verbatim from approved FSD revision 9. Project types, not FIN SDK.
type Id = string; type Ts = string; type DateOnly = string;
type Scalar = number | boolean | string;
type Severity = "critical" | "warning" | "info"; // 排序权重3/2/1
type Quality = "good" | "stale" | "fault" | "down" | "unknown" |
  "disabled" | "unmapped" | "unsupported";
type Comm = "online" | "offline" | "degraded" | "disabled" | "unknown";
type PowerMode = "utility" | "battery" | "staticBypass" |
  "maintenanceBypass" | "off" | "other" | "unknown";
type Commissioning = "draft" | "ready" | "accepted" | "disabled" | "retired";
type ErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "OBJECT_UNAVAILABLE" |
  "VALIDATION_FAILED" | "REVISION_CONFLICT" | "IDEMPOTENCY_CONFLICT" |
  "CURSOR_EXPIRED" | "SOURCE_UNAVAILABLE" | "HISTORY_UNAVAILABLE" |
  "RATE_LIMITED" | "PERSISTENCE_UNAVAILABLE" | "OUTCOME_UNKNOWN" |
  "CAPABILITY_UNSUPPORTED" | "SCOPE_CONFLICT" |
  "ACTIVE_OCCURRENCE_BLOCKS_CHANGE" | "PUBLICATION_BUSY" |
  "CONFIG_ACTIVATING" | "RECOVERY_REQUIRED" | "SOURCE_MODE_MISMATCH" |
  "GENERATION_MISMATCH" | "SESSION_BUSY" | "SESSION_DELETED" | "INVALID_STATE" |
  "LIMIT_EXCEEDED" | "REPORT_EXPIRED" | "REPORT_NOT_READY" |
  "SCHEMA_VERSION_UNSUPPORTED" | "CHANNEL_PAUSED";
type Issue = { path: string; code: string; message: string };
type PartialError = { targetRef: Id | null; component: "telemetry" |
  "history" | "alarm" | "rule" | "configuration" | "report" | "notification" | "simulation";
  code: ErrorCode; message: string; retryable: boolean; lastGoodAt: Ts | null };
type Meta = { requestId: Id; serverTime: Ts; schemaVersion: "2.0"; context: SourceContext };
type Response<T> = Meta & (
  { kind: "ok"; data: T; warnings: Issue[] } |
  { kind: "partial"; data: T; warnings: Issue[]; partialErrors: PartialError[] } |
  { kind: "notModified"; snapshotRevision: Id; configRevision: Id } |
  { kind: "error"; error: { code: ErrorCode; message: string;
    retryable: boolean; retryAfterMs: number | null;
    operationId: Id | null; issues: Issue[] } }
);
type Metric = {
  field: string; objectRef: Id; value: Scalar | null;
  lastGoodValue: Scalar | null; lastGoodAt: Ts | null;
  observedValue: Scalar | null; observedAt: Ts | null;
  unit: string | null; precision: number | null; quality: Quality; reason: string | null;
  sourceRef: Id | null; origin: "measured" | "configured" | "derived";
  sourceTs: Ts | null; receivedAt: Ts | null; freshnessTs: Ts | null;
  freshnessBasis: "sample" | "connectorRead" | "heartbeat" | "config";
  mappingRevision: Id; rawValue?: Scalar | null; rawStatus?: string | null;
  derivation: { ruleVersion: Id; inputRefs: Id[]; inputTimes: (Ts | null)[];
    calculatedAt: Ts } | null;
};
type Identity = { equipRef: Id; siteRef: Id; name: string; location: string | null;
  model: string | null; commissioningStatus: Commissioning; enabled: boolean;
  acceptanceRevision: Id | null };
type Assessment = { risk: "normal" | "attention" | "critical" | null;
  coverage: "complete" | "partial" | "insufficient"; expectedItems: Id[];
  validItems: Id[]; unavailableItems: { id: Id; reason: string }[];
  disabledRules: Id[]; riskReasons: { sourceId: Id; severity: Severity;
    message: string; syncState: "synced" | "pending" | "unknown" }[];
  lastSuccessfulEvaluationAt: Ts | null; riskLastVerifiedAt: Ts | null;
  sourceQuality: Quality };
type AlarmSummary = { activeCritical: number | null; activeWarning: number | null;
  activeInfo: number | null; asOf: Ts | null; sourceQuality: Quality;
  lastKnownCounts: { critical: number; warning: number; info: number } | null;
  pendingDetectedRisks: number };
type Capability = { field: string; objectRef: Id;
  status: "supported" | "unsupported" | "unverified"; evidenceRef: Id | null };
//整体评分只引用外部定义，不从assessment/SOC/SOH生成。
type BatteryAsset = { objectRef: Id; parentEquipRef: Id;
  chemistry: string | null; cellCount: number | null; evidenceRef: Id | null };
type HealthIndicator = { metric: Metric | null;
  availability: "available" | "unsupported" | "unmapped" | "stale" | "unknown";
  basis: "device" | "vendor" | "approvedExternalModel" | null;
  methodologyRef: Id | null; algorithmVersion: Id | null; reason: string | null };
type OutlookItem = { itemId: Id; equipRef: Id; targetObjectRef: Id;
  component: "battery" | "capacitor" | "charger" | "fan";
  kind: "planned" | "vendorRecommendation" | "externalPrediction" | "unavailable";
  title: string; severity: Severity | null; dueDate: DateOnly | null;
  windowStart: DateOnly | null; windowEnd: DateOnly | null;
  assessedAt: Ts | null; quality: Quality; evidenceRefs: Id[];
  methodologyRef: Id | null; algorithmVersion: Id | null; reason: string | null };
type Snapshot = { identity: Identity; communication: Comm; powerMode: Metric;
  metrics: Metric[]; assessment: Assessment; alarmSummary: AlarmSummary;
  capabilities: Capability[]; batteryAssets: BatteryAsset[];
  healthIndicator: HealthIndicator; outlook: OutlookItem[];
  configRevision: Id; activationEpoch: Id;
  snapshotRevision: Id; generatedAt: Ts; partialErrors: PartialError[] };
type EquipmentRow = { identity: Identity; communication: Comm; powerMode: PowerMode;
  load: Metric | null; runtime: Metric | null; requiredRuntimeMinutes: number | null;
  alarmSummary: AlarmSummary; assessment: Assessment; lastGoodAt: Ts | null;
  matchesCurrentFilter: boolean; snapshotRevision: Id };
type Filter = { siteRefs?: Id[]; equipRefs?: Id[]; query?: string;
  communication?: Comm[]; powerModes?: PowerMode[]; severity?: Severity[] };
type Page<T> = { items: T[]; listRevision: Id; expiresAt: Ts; nextCursor: Id | null;
  frozenTotal: number; partialErrors: PartialError[] };
type FleetPage = Page<EquipmentRow> & {
  stats: { statsRevision: Id; asOf: Ts; configured: number; accepted: number;
    communicationAbnormal: number; activeCritical: number | null;
    lowRuntime: number; unknownRuntime: number; sourceQuality: Quality };
  hasMembershipUpdates: boolean; urgentCriticalRefs: Id[] };
type Alarm = { occurrenceId: Id; sourceSystem: string; sourceAlarmId: Id | null;
  equipRef: Id; kind: "alarm" | "event"; ackRequired: boolean;
  activity: "active" | "cleared" | "administrativelyClosed" | "unknown" | "notApplicable";
  acknowledgement: "unacknowledged" | "acknowledged" | "unknown" | "notRequired";
  sourceQuality: Quality; severity: Severity; severityRaw: string | null;
  message: string; occurredAt: Ts; receivedAt: Ts; physicalClearedAt: Ts | null;
  administrativeClosedAt: Ts | null;
  resolutionKind: "physical" | "administrative" | null;
  ackAt: Ts | null; ackBy: Id | null; ackComment: string | null;
  revision: Id; ruleVersion: Id | null; correlationKey: Id | null;
  eventDetails?: { planId: Id; planRevision: Id; stage: "upcoming" | "due" |
    "completed" | "cancelled" | "superseded"; endedAt: Ts | null;
    endReason: "due" | "completed" | "cancelled" | "superseded" | null } };
type TimelineItem = { id: Id; at: Ts; type: "occurred" | "acknowledged" |
  "physicalCleared" | "administrativeClosed" | "sourceUnknown" | "resynced" |
  "planUpcoming" | "planDue" | "planCompleted" | "planCancelled" | "planSuperseded";
  actor: Id | null; message: string; evidenceRefs: Id[] };
type Operation = { operationId: Id; state: "PREPARED" | "EXECUTING" |
  "SUCCEEDED" | "ALREADY_APPLIED" | "REJECTED" | "FAILED_NOT_APPLIED" |
  "OUTCOME_UNKNOWN" | "RECONCILIATION_REQUIRED";
  resultAvailability: "ready" | "pending" | "none";
  resultRef: Id | null; updatedAt: Ts; errorCode: ErrorCode | null };
type Publication = { operationId: Id; candidateRevision: Id; previousRevision: Id;
  previousEpoch: Id; targetEpoch: Id; state: "PREPARING" | "PREPARED" | "QUIESCING" | "COMMITTED" |
  "ACTIVATING" | "ACTIVE" | "ABORTED" | "RECOVERY_REQUIRED";
  committedRevision: Id; lastSuccessfulRevision: Id; moduleReadySet: string[];
  decisionAt: Ts | null; lastError: string | null };
type Plan = { planId: Id; planRevision: Id; equipRef: Id; targetObjectRef: Id;
  source: "manufacturer" | "manual"; title: string; dueDate: DateOnly;
  remindDays: number; status: "scheduled" | "completed" | "cancelled";
  completedDate: DateOnly | null; updatedAt: Ts; updatedBy: Id;
  evidenceRefs: Id[]; supersedesPlanRevision: Id | null };
type Mapping = { mappingId: Id; equipRef: Id; targetObjectRef: Id; logicalField: string;
  pointRef: Id; rawKind: "Number" | "Bool" | "Str"; normalizedKind: "Number" | "Bool" | "Str";
  origin: "measured"; rawUnit: string | null; unit: string | null;
  precision: number | null; phase: string | null; measurementLocation: string | null;
  signConvention: string | null; evidenceRef: Id;
  transform: { scale: number; offset: number; enumMap: { raw: Scalar; mapped: Scalar }[];
    invertBoolean: boolean };
  qualityPolicy: { expectedIntervalMs: number; staleAfterMs: number;
    min: number | null; max: number | null; freshnessBasis: Metric["freshnessBasis"] };
  historyPolicy: { required: boolean; periodMs: number | null; retentionDays: number | null } };
type RuleBase = { ruleId: Id; ruleVersion: Id; equipRef: Id; enabled: boolean };
type CountGate = { count: number; durationMs: number };
type NumericBase = RuleBase & { driver: "sample"; primaryMappingId: Id;
  auxiliaryMappingIds: Id[]; maxInputSkewMs: number; maxSampleGapMs: number };
type Rule = (NumericBase & { type: "R-01"; requiredMinutes: number; hysteresisMinutes: number;
  trigger: CountGate; clear: CountGate }) |
  (NumericBase & { type: "R-02"; warningPct: number; criticalPct: number;
    warningHysteresis: number; criticalHysteresis: number;
    triggerWarning: CountGate; triggerCritical: CountGate;
    upgrade: CountGate; downgrade: CountGate; clear: CountGate }) |
  (NumericBase & { type: "R-03"; baseline: number; warningChangePct: number;
    hysteresisPct: number; comparableEvidenceRef: Id; trigger: CountGate; clear: CountGate }) |
  (RuleBase & { type: "R-04"; driver: "calendar"; planId: Id }) |
  (RuleBase & { type: "R-05"; driver: "quality"; requiredMappingIds: Id[];
    triggerDelayMs: number; clearDelayMs: number });
type Enrollment = { equipRef: Id; siteRef: Id; displayName: string;
  commissioningStatus: Commissioning; capabilityProfile: Capability[];
  sourceDocumentVersion: Id; baseRequiredMappingIds: Id[]; alarmSourceRef: Id;
  acceptanceRevision: Id | null }; // accepted只能由OP-14赋值
type AssessmentBinding = { bindingId: Id; equipRef: Id;
  healthScorePointRef: Id | null; healthBasis: HealthIndicator["basis"];
  methodologyRef: Id | null; algorithmVersion: Id | null;
  outlookRecordRefs: Id[]; evidenceRefs: Id[] }; //仅允许已登记的FIN项目对象，无任意URL/脚本
type Entity = { entityType: "enrollment"; payload: Enrollment } |
  { entityType: "mapping"; payload: Mapping } |
  { entityType: "rule"; payload: Rule } |
  { entityType: "plan"; payload: Plan } |
  { entityType: "assessmentBinding"; payload: AssessmentBinding } |
  { entityType: "notificationChannel"; payload: NotificationChannel } |
  { entityType: "notificationSubscription"; payload: NotificationSubscription };
type EntityRecord = Entity & { entityId: Id; entityRevision: Id };
type Patch = ({ op: "add"; entityId: Id; expectedEntityRevision: null } & Entity) |
  ({ op: "update"; entityId: Id; expectedEntityRevision: Id } & Entity) |
  { op: "remove"; entityId: Id; entityType: Entity["entityType"]; expectedEntityRevision: Id };
type Draft = { draftId: Id; baseConfigRevision: Id; draftRevision: Id;
  scopeDigest: Id; contentHash: Id; patches: Patch[]; author: Id; updatedAt: Ts };
type ValidationReport = { validationId: Id; draftRevision: Id; contentHash: Id;
  platformBindingFingerprint: Id; blockingIssues: Issue[]; warnings: Issue[];
  affectedEquip: Id[]; affectedActiveAlarms: Id[]; expiresAt: Ts };
type Audit = { auditId: Id; projectId: Id; serverTs: Ts; actorId: Id;
  action: string; targetRefs: Id[]; operationId: Id; outcome: string;
  beforeRevision: Id | null; afterRevision: Id | null; redactedDiff: Issue[];
  reasonCode: string | null; sourceResultRef: Id | null };
type AcceptanceReport = { reportId: Id; equipRef: Id; configRevision: Id;
  mappingFingerprint: Id; modelFirmware: string; pointListVersion: Id;
  baseChecks: { mappingId: Id; passed: boolean; evidenceRefs: Id[] }[];
  alarmEvidenceRefs: Id[]; disconnectEvidenceRefs: Id[]; historyEvidenceRefs: Id[];
  waivers: Issue[]; acceptedBy: Id; acceptedAt: Ts }; //身份/时间由服务器最终填写
type HistorySegment = { mappingRevision: Id; sourceRef: Id; assetGeneration: Id;
  from: Ts; to: Ts; unit: string; knownMappingError: boolean; changeReason: string;
  buckets: { from: Ts; to: Ts; min: number | null; max: number | null; avg: number | null;
    validCount: number; expectedCount: number | null; gap: boolean; reason: string | null }[] };
type Diagnostics = { committedRevision: Id; lastSuccessfulRevision: Id;
  publication: Publication | null; lifecycle: "STOPPED" | "STARTING" | "RUNNING" |
    "DEGRADED" | "FAILED" | "STOPPING"; lastSourceSync: Ts | null;
  qualityCounts: { quality: Quality; count: number }[];
  pendingOperations: number; ruleOutboxDepth: number; alarmSyncQuality: Quality;
  errors: PartialError[] };
//每个OP返回Response<下面指定的响应类型>；只有OP-03允许notModified。
type CoreContracts = {
  "OP-01": { request: {}; response: { actorId: Id; permissions: string[];
    authorizedSiteRefs: Id[]; language: "en-US"; timezone: string; scopeVersion: Id } };
  "OP-02": { request: { filter?: Filter; pageSize?: number; cursor?: Id;
    anchorEquipRef?: Id; listRevision?: Id }; response: FleetPage };
  "OP-03": { request: { equipRef: Id; knownSnapshotRevision?: Id };
    response: Snapshot };
  "OP-04": { request: { equipRef: Id; objectRef: Id; fields: string[];
    from?: Ts; to?: Ts }; response: { timezone: string; series: {
      field: string; objectRef: Id; segments: HistorySegment[] }[]; partialErrors: PartialError[] } };
  "OP-05": { request:
    { action: "list"; view?: "active" | "all"; filter?: Filter;
      activity?: Alarm["activity"][]; acknowledgement?: Alarm["acknowledgement"][];
      from?: Ts; to?: Ts; pageSize?: number; cursor?: Id } |
    { action: "detail"; occurrenceId: Id };
    response: Page<Alarm> | { alarm: Alarm; timeline: TimelineItem[] } };
  "OP-06": { request: { occurrenceId: Id; expectedRevision: Id;
    operationId: Id; comment: string }; response: { operation: Operation; alarm: Alarm | null } };
  "OP-07": { request: { operationId: Id }; response: { operation: Operation;
    alarm: Alarm | null; publication: Publication | null } };
  "OP-08": { request: { action: "get"; draftId?: Id } |
    { action: "save"; draftId: Id | null; baseConfigRevision: Id;
      expectedDraftRevision: Id | null; patches: Patch[] };
    response: { visibleEntities: EntityRecord[]; configRevision: Id; draft: Draft | null } };
  "OP-09": { request: { draftId: Id; draftRevision: Id }; response: ValidationReport };
  "OP-10": { request: { validationId: Id; contentHash: Id; baseConfigRevision: Id;
    operationId: Id }; response: { operation: Operation; publication: Publication } };
  "OP-11": { request: { targetConfigRevision: Id; baseConfigRevision: Id; reason: string };
    response: Draft }; //只生成授权范围回退草稿，随后OP-09/10
  "OP-12": { request: { equipRef?: Id }; response: Diagnostics };
  "OP-13": { request: { equipRef?: Id; from?: Ts; to?: Ts; action?: string;
    pageSize?: number; cursor?: Id }; response: Page<Audit> };
  "OP-14": { request: { equipRef: Id; configRevision: Id;
    report: AcceptanceReport; operationId: Id }; response: { operation: Operation;
      identity: Identity; acceptanceRevision: Id | null } };
};

type RequestContext = { mode: "live" } |
  { mode: "simulation"; sessionId: Id | null; generationId: Id | null };
type SourceContext = { sourceMode: "live" } |
  { sourceMode: "simulation"; simulationSessionId: Id | null; generationId: Id | null;
    scenarioId: Id | null; scenarioVersion: Id | null; seed: number | null;
    virtualTime: Ts | null };
type NotificationChannel = { channelId: Id; name: string; enabled: boolean;
  secretRef: Id; chatId: string; messageThreadId: number | null;
  timezone: string; resumePauseRevision: Id | null };
type NotificationSubscription = { subscriptionId: Id; channelId: Id;
  enabled: boolean; equipRefs: Id[]; severities: Severity[];
  eventTypes: ("occurred" | "physicalCleared" | "acknowledged")[];
  quietHours: { start: string; end: string } | null }; // HH:mm，按channel.timezone
type ChannelGate = { channelId: Id; paused: boolean; pauseRevision: Id;
  pausedAt: Ts | null; pausedBy: Id | null; reason: string | null };

type ReportParams = { templateId: "REP-01" | "REP-02" | "REP-03" | "REP-04";
  templateVersion: Id; equipRefs: Id[]; start: Ts; end: Ts; timezone: string;
  metricIds: string[]; aggregation: "raw" | "bucketed" | "summary";
  bucketSeconds: number | null; format: "pdf" | "xlsx" | "csv"; allowEmpty: boolean };
type ReportJob = { jobId: Id; ownerId: Id; context: SourceContext; params: ReportParams;
  state: "queued" | "running" | "succeeded" | "failed" | "cancelled" | "expired";
  progressPct: number; createdAt: Ts; expiresAt: Ts | null;
  dataCutoffAt: Ts; collectedFrom: Ts | null; collectedTo: Ts | null;
  rows: number; bytes: number; qualitySummary: Issue[];
  checksum: string | null; errorCode: ErrorCode | null; reason: string | null };
type ReportFile = { fileName: string; mime: string; bytes: number; checksum: string };
type NotifyJob = { notificationId: Id; context: SourceContext; channelId: Id | null;
  alarmRef: Id | null; eventKey: Id; eventAt: Ts; createdAt: Ts;
  state: "queued" | "sending" | "accepted" | "retry_wait" | "unknown" | "failed" | "cancelled";
  attempt: number; nextAttemptAt: Ts | null; channelRevision: Id | null;
  transport: "telegram" | "simulated"; messageId: string | null;
  simulatedOutcome: "accepted" | "rateLimited" | "rejected" | "unknown" | null;
  lastError: string | null };
type MetricDefinition = { metricId: string; name: string; meaning: string;
  unit: string | null; formula: string | null; measurementLocation: string | null;
  sourceRef: Id | null; qualityMeaning: string;
  basis: { kind: "standard" | "vendor" | "project"; title: string;
    version: string | null; locator: string | null; status: "verified" | "pending" }[] };
type SimState = "ready" | "running" | "paused" | "stopped" | "failed" |
  "resetting" | "deleting" | "deleted";
type SimSession = { sessionId: Id; ownerId: Id; generationId: Id;
  controlRevision: Id; dataRevision: Id; state: SimState; initialized: boolean;
  scenarioId: Id; scenarioVersion: Id; seed: number; deviceCount: number;
  startAt: Ts; timezone: string; virtualTime: Ts; speed: 1 | 5 | 10;
  historyHours: number; sampleIntervalSeconds: number; historyRows: number;
  lastActivityAt: Ts; cleanupOperationId: Id | null; reason: string | null };
type SimMutation = { sessionId: Id; generationId: Id;
  expectedControlRevision: Id; operationId: Id };
type ScenarioChange = { scenarioId: Id; scenarioVersion: Id; targetSimEquipIds: Id[];
  simulatedOutcome: "accepted" | "rateLimited" | "rejected" | "unknown" | null };
type ExtendedContracts = {
  "OP-15": { request: ReportParams & { operationId: Id }; response: { job: ReportJob } };
  "OP-16": { request: { action: "get"; jobId: Id } |
    { action: "list"; cursor?: Id; pageSize?: number };
    response: { job: ReportJob } | Page<ReportJob> };
  "OP-17": { request: { jobId: Id }; response: ReportFile };
  "OP-18": { request: { jobId: Id; operationId: Id }; response: { job: ReportJob } };
  "OP-19": { request: { channelDraftId: Id; draftRevision: Id; operationId: Id };
    response: { job: NotifyJob } };
  "OP-20": { request: { channelId?: Id; states?: NotifyJob["state"][];
    from?: Ts; to?: Ts; cursor?: Id; pageSize?: number }; response: Page<NotifyJob> };
  "OP-21": { request: { notificationId: Id; operationId: Id; acceptDuplicateRisk: boolean };
    response: { job: NotifyJob } };
  "OP-22": { request: { metricIds: string[]; equipRef: Id };
    response: { items: MetricDefinition[] } };
  "OP-23": { request: { operationId: Id; scenarioId: Id; scenarioVersion: Id;
    seed: number; deviceCount?: number; startAt?: Ts; timezone: string };
    response: { session: SimSession } };
  "OP-24": { request: SimMutation & { historyHours?: number; sampleIntervalSeconds?: number };
    response: { session: SimSession } };
  "OP-25": { request: SimMutation & { action: "start" | "pause" | "resume" | "stop";
    speed?: 1 | 5 | 10 }; response: { session: SimSession } };
  "OP-26": { request: SimMutation & { seconds: number }; response: { session: SimSession } };
  "OP-27": { request: SimMutation & ScenarioChange; response: { session: SimSession } };
  "OP-28": { request: SimMutation; response: { operation: Operation; session: SimSession } };
  "OP-29": { request: SimMutation; response: { operation: Operation; session: SimSession } };
  "OP-30": { request: { action: "get"; sessionId: Id } |
    { action: "list"; cursor?: Id; pageSize?: number }; response: { session: SimSession } | Page<SimSession> };
  "OP-31": { request: { channelId: Id; operationId: Id; reason: string };
    response: { gate: ChannelGate; operation: Operation } };
};
type Contracts = CoreContracts & ExtendedContracts;
type WireRequest<K extends keyof Contracts> = Contracts[K]["request"] &
  { schemaVersion: "2.0"; context: RequestContext };
type WireResponse<K extends keyof Contracts> = Response<Contracts[K]["response"]>;

