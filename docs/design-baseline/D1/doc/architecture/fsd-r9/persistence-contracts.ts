/// <reference path="./contracts.ts" />
// Architecture revision A2. Internal contracts; no target FIN SDK assertion.
type StoredMode = {mode:"live"} | {mode:"simulation";sessionId:Id;generationId:Id};
type RecordIdentity = {projectId:Id; revision:Id};
type RuntimeEnvelope = RecordIdentity & {context:StoredMode; workerFence:number|null};
// All simulation runtime keys prepend projectId/sessionId/generationId; live uses projectId/live.
type RuleStateRecord = RuntimeEnvelope & {equipRef:Id;ruleId:Id;ruleVersion:Id;
  lastOccurrenceOrdinal:number;primaryWatermark:Id|null;currentOccurrenceId:Id|null};
type SimulationSessionRecord = RecordIdentity & SimSession & {
  initialScenarioId:Id; initialScenarioVersion:Id; generatorVersion:Id;
  initialGenerationParameters:{historyHours:number;sampleIntervalSeconds:number;deviceCount:number};
  workerFence:number;
};
type RuleOccurrenceRecord = RuntimeEnvelope & {
  equipRef:Id; ruleId:Id; ruleVersion:Id; activationEpoch:Id;
  occurrenceId:Id; occurrenceOrdinal:number; previousOccurrenceId:Id|null;
  detectedStartedAt:Ts; detectedEndedAt:Ts|null; detectedSeverity:Severity;
  sourceAlarmId:Id|null; nextCommandSeq:number;
};
type ImmutableRulePayload = {
  occurrenceId:Id; occurrenceOrdinal:number; equipRef:Id; ruleId:Id;
  ruleVersion:Id; kind:"CREATE"|"SEVERITY"|"CLEAR";
  detectedStartedAt:Ts; eventAt:Ts; severity:Severity;
  // CREATE may not yet have a platform ID. Later commands resolve ONLY this occurrence.
  targetOccurrenceId:Id; correlationKey:Id;
};
type RuleCommandRecord = RuntimeEnvelope & {
  commandId:Id; occurrenceId:Id; commandSeq:number;
  predecessorCommandId:Id|null; previousOccurrenceId:Id|null;
  payload:ImmutableRulePayload; payloadHash:string;
  state:"PENDING"|"DISPATCHING"|"APPLIED"|"DEFINITELY_NOT_APPLIED"|"OUTCOME_UNKNOWN";
  sourceAlarmId:Id|null; attempt:number; reconcileCount:number;
};
type ScenarioEventRecord = RecordIdentity & {
  sessionId:Id; generationId:Id; scenarioId:Id; scenarioVersion:Id;
  generatorVersion:Id; targetSimEquipIds:Id[]; virtualEffectiveAt:Ts;
  eventSeq:number; parameters:Record<string,Scalar|null>; controlRevision:Id;
};
type SimulationCheckpointRecord = RecordIdentity & {
  sessionId:Id; generationId:Id; workerFence:number;
  initialScenarioId:Id; initialScenarioVersion:Id; generatorVersion:Id;
  seed:number; startAt:Ts; generationParameters:{historyHours:number;sampleIntervalSeconds:number;deviceCount:number};
  assignments:Record<Id,{scenarioId:Id;scenarioVersion:Id}>;
  lastCompleteEventAt:Ts; lastCommittedEventSeq:number; nextEventSeq:number;
  sampleWatermarks:Record<Id,number>; ruleStateRefs:Id[]; batchId:Id;
};
type EntityVersionRecord = RecordIdentity & {
  entityId:Id; entityRevision:Id; entityType:Entity["entityType"];
  ownerEquipRefs:Id[]; payload:Entity["payload"]; contentHash:string;
};
type ConfigVersionRecord = RecordIdentity & {
  configRevision:Id; parentRevision:Id|null;
  members:{entityId:Id;entityRevision:Id;entityVersionRef:Id;contentHash:string}[];
  contentHash:string; state:"STAGING"|"SEALED";
};
type OperationBinding = {
  projectId:Id; operationId:Id; actorId:Id; action:keyof Contracts;
  requestContext:RequestContext; canonicalRequestHash:string; targetRefs:Id[];
  originalPermission:string; ownerSessionId:Id|null;
  state:Operation["state"]; cleanupTombstone:boolean; retainedUntil:Ts|null;
};
// Unique key is [projectId, operationId]. All other fields are binding checks.
type BootstrapRequest = {method:"GET"};
type BootstrapResponse = {supportedSchemaVersions:["2.0"]; upgradeRequired:boolean; message:string};
type BootstrapHandler = (request:BootstrapRequest) => Promise<BootstrapResponse>;
