/// <reference path="./contracts.ts" />
// Proposed project handler boundary. OP-17 streams a protected file on success.
interface AuthenticatedContext { actorId: Id; scopeVersion: Id; projectId: Id; }
interface BinaryDownload { stream: unknown; metadata: ReportFile; requestId: Id; contextFingerprint: Id; }
type Handler<K extends keyof Contracts> = (ctx: AuthenticatedContext, req: WireRequest<K>) => Promise<K extends "OP-17" ? BinaryDownload | Response<never> : WireResponse<K>>;
interface UpsFleetHandlers {
  sessionCapabilities: Handler<"OP-01">;
  equipmentList: Handler<"OP-02">;
  equipmentSnapshot: Handler<"OP-03">;
  metricHistory: Handler<"OP-04">;
  alarmListDetail: Handler<"OP-05">;
  alarmAcknowledge: Handler<"OP-06">;
  operationStatus: Handler<"OP-07">;
  configGetSaveDraft: Handler<"OP-08">;
  configValidate: Handler<"OP-09">;
  configPublish: Handler<"OP-10">;
  configRollbackDraft: Handler<"OP-11">;
  diagnostics: Handler<"OP-12">;
  auditList: Handler<"OP-13">;
  commissioningAccept: Handler<"OP-14">;
  reportCreate: Handler<"OP-15">;
  reportGetList: Handler<"OP-16">;
  reportDownload: Handler<"OP-17">;
  reportCancel: Handler<"OP-18">;
  notificationTest: Handler<"OP-19">;
  notificationDeliveryList: Handler<"OP-20">;
  notificationRetry: Handler<"OP-21">;
  metricDictionary: Handler<"OP-22">;
  simulationCreate: Handler<"OP-23">;
  simulationGenerate: Handler<"OP-24">;
  simulationControl: Handler<"OP-25">;
  simulationStep: Handler<"OP-26">;
  simulationScenario: Handler<"OP-27">;
  simulationReset: Handler<"OP-28">;
  simulationDelete: Handler<"OP-29">;
  simulationGetList: Handler<"OP-30">;
  notificationPause: Handler<"OP-31">;
}

/// <reference path="./persistence-contracts.ts" />
interface UpsFleetBootstrapHandlers { bootstrap: BootstrapHandler; }
