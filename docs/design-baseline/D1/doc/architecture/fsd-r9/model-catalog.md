# Folio Rec 数据模型与导入约定

本交付把FSD的逻辑对象映射为Folio Rec设计。所有ups开头标签均为项目自定义标签；site/equip/point/id/dis/siteRef/equipRef/kind/unit/tz采用Haystack常用建模。目标FIN版本未知，兼容性unverified。

## 设备文件

设备文件含1个示例站点、1个UPS、1个电池串、1个模块、1个独立环境设备，以及30个候选点。它们是带upsTemplate标记的工程Rec，不是现场资产清单。点没有curVal、his、writable、连接器地址或真实告警绑定。单位是规范候选；原始单位/精度/相别/测量位置必须在点表确认后填写。airQuality的Str仅为枚举方案，若型号提供数值须按已核验量纲换模；healthScore的%为0～100存储候选，不能据此表示SOC。moduleAvailableCapacity/moduleState为P1候选。

- 电池与模块用upsParentEquipRef关联UPS。环境传感器保持自己的equipRef，经EnvironmentAssociation绑定到UPS。
- Q与阻抗基准按已发布规则投影；额定容量与电池属性分别按UPS/电池对象投影，公开编辑差异见CP-AR03；lastTransferAt来自事件时点，不强行变成FSD Mapping不支持的DateTime遥测点。
- 设备真实版本只引用已存在的FIN资产和点，不能把模板导入动作作为生产登记。

## 业务文件

前半部分为设备注册、能力、30条映射、资产与规则的禁用工程模板。后半部分为运行记录原型Rec：upsRequiredFields给出实例化时必须补齐的业务字段，upsContractType指向contracts.ts。运行原型没有queued/active/success状态，不应被worker领取。它们是完整的Folio模板Rec，但不是满足生产业务schema的运行实例。

|对象|契约|自然唯一键|写入者|运行必需字段|
|---|---|---|---|---|
|ConfigDraft|Draft|draftId + draftRevision|config.edit|baseConfigRevision,scopeDigest,contentHash,patches,author,updatedAt|
|ValidationReport|ValidationReport|validationId|config.edit|draftRevision,contentHash,platformBindingFingerprint,blockingIssues,warnings,affectedEquip,affectedActiveAlarms,expiresAt|
|Publication|Publication|projectId + operationId|system|candidateRevision,previousRevision,previousEpoch,targetEpoch,state,moduleReadySet,decisionAt,lastError|
|ActiveConfigPointer|internal|projectId|system|configRevision,activationEpoch,decisionAt|
|LastSuccessfulActivation|internal|projectId|system|configRevision,activationEpoch,activatedAt|
|RuleState|internal|projectId + equipRef + ruleId + ruleVersion|system|activationEpoch,primaryWatermark,candidate,count,candidateSince,badSince,goodSince,detectedRisk,occurrenceId,syncState|
|RuleAlarmOutbox|internal|projectId + occurrenceId + commandSeq|system|ruleStateRef,commandType,correlationKey,epoch,requestHash,state,sourceResultRef,attempt,nextAttemptAt|
|AlarmAssociation|internal|projectId + sourceSystem + sourceAlarmId + occurrenceId|system|equipRef,sourceRevision,ruleVersion,correlationKey,sourceQuality,resolutionKind|
|OperationJournal|Operation|projectId + operationId|system|action,requestHash,targetRefs,expectedRevision,state,resultAvailability,resultRef,updatedAt,errorCode|
|AuditEvent|Audit|auditId|systemAppendOnly|projectId,serverTs,actorId,action,targetRefs,operationId,outcome,beforeRevision,afterRevision,redactedDiff,reasonCode,sourceResultRef|
|AcceptanceReport|AcceptanceReport|reportId|commissioning.accept|equipRef,configRevision,mappingFingerprint,modelFirmware,pointListVersion,baseChecks,alarmEvidenceRefs,disconnectEvidenceRefs,historyEvidenceRefs,waivers,acceptedBy,acceptedAt|
|MappingInterval|internal|mappingId + configRevision + validFrom|system|mappingRef,validFrom,validTo,sourceRef,transform,normalizedUnit,assetGeneration,changeReason,knownMappingError|
|MaintenancePlanEvent|Alarm.eventDetails|planId + planRevision + stage|system|equipRef,targetObjectRef,stage,endedAt,endReason,ackRequired|
|OutlookRecord|OutlookItem|itemId|config.edit|equipRef,targetObjectRef,component,kind,title,severity,dueDate,windowStart,windowEnd,assessedAt,quality,evidenceRefs,methodologyRef,algorithmVersion,reason|
|ReportJob|ReportJob|projectId + ownerId + operationId|report.export|jobId,ownerId,context,params,state,progressPct,createdAt,expiresAt,dataCutoffAt,collectedFrom,collectedTo,rows,bytes,qualitySummary,checksum,errorCode,reason|
|ReportFileMetadata|ReportFile|jobId|system|fileName,mime,bytes,checksum,protectedStorageKey,generationId,expiresAt|
|NotificationChannel|NotificationChannel|channelId + configRevision|notification.manage|channelId,name,enabled,secretRef,chatId,messageThreadId,timezone,resumePauseRevision|
|NotificationSubscription|NotificationSubscription|subscriptionId + configRevision|notification.manage|subscriptionId,channelId,enabled,equipRefs,severities,eventTypes,quietHours|
|ChannelGate|ChannelGate|projectId + channelId|notification.manage|channelId,paused,pauseRevision,pausedAt,pausedBy,reason|
|NotifyJob|NotifyJob|projectId + eventKey + channelId|system|notificationId,context,channelId,alarmRef,eventKey,eventAt,createdAt,state,attempt,nextAttemptAt,channelRevision,transport,messageId,simulatedOutcome,lastError|
|NotificationAttempt|internal|notificationId + attempt|systemAppendOnly|operationId,acceptDuplicateRisk,permitRevision,requestHash,startedAt,finishedAt,outcome,messageId,error|
|NotificationCursor|internal|projectId + sourceStream + subscriptionId|system|sourceWatermark,overlapStart,lastEnqueuedEventKey,updatedAt,gapIntervals|
|MetricDefinition|MetricDefinition|metricId + dictionaryVersion|system|metricId,name,meaning,unit,formula,measurementLocation,sourceRef,qualityMeaning,basis|
|SimulationSession|SimSession|projectId + sessionId|simulation.manage|sessionId,ownerId,generationId,controlRevision,dataRevision,state,initialized,scenarioId,scenarioVersion,seed,deviceCount,startAt,timezone,virtualTime,speed,historyHours,sampleIntervalSeconds,historyRows,lastActivityAt,cleanupOperationId,reason|
|SimulationCleanup|internal|sessionId + operationId|system|oldGenerationId,newGenerationId,action,fenceRevision,state,pendingWorkers,pendingFiles,completedAt|
|SimulationSample|internal|sessionId + generationId + objectId + field + sampleTime + sequence|system|value,unit,quality,sourceTs,scenarioVersion,seed|
|SimulationAlarm|Alarm|sessionId + generationId + occurrenceId|system|alarmPayload,sourceMode,simulationSessionId,generationId|
|SchemaMigration|internal|migrationId + fromVersion + toVersion|system|checksum,state,checkpoint,backupRef,startedAt,completedAt|

## 字段编码

A2运行编解码以record-codecs.json为准；模板编辑布局不作为运行codec。对象关系用Haystack Ref，非平台ID、版本、幂等key用Str。业务引用跨Rec时使用对应的ups…Ref，编码器从逻辑ID解析实际Ref；不把名字当ID。嵌套对象保存为明确的ups…Json字符串，严格按对应schema解码；Rec缺少可空标签映射为JSON null，列表存Zinc List，日期使用Date/DateTime。模板中upsRequiredFields/upsPrototypeState属于模板元信息，不投影给业务API。upsSchemaVersion是接口/模型版本，不是产品版本。JSON payload不用于高频查询条件：project/equip/sourceMode/session/generation/state/nextAttemptAt等必须提取为可索引标签，并验证与payload一致。

Trio中upsSourceMode=template专用于模板隔离，不是WireRequest或SourceContext的合法模式；生产worker固定过滤not upsTemplate且sourceMode严格live或simulation。模板实例化器负责删除模板元数据、设置合法模式并严格验证所有必填字段。不能直接把原型当作Draft/ReportJob等API响应。

业务模板R-01～03均disabled；R-04随有效计划生成，R-05在accepted后依审核策略必须监视。模板不具备accepted资格，所有禁用值只适用于模板。MaintenancePlan的draft也是模板编辑状态，实例化时必须给真实dueDate及合法scheduled/completed/cancelled。映射scale=1和10秒周期仅为显式待验参数，不允许未经工程核验发布。

## 索引与原子边界

- 唯一键定义是应用约束，不因Trio存在就自动建立数据库唯一索引；G1核验Folio/SDK能力。数据隔离使用projectId+mode+session/generation；OperationJournal例外：唯一键固定projectId+operationId，模式/代次属于绑定字段，不能扩展主键。活动指针单项目唯一。
- Tx-Publish：Pointer、Publication COMMITTED、MappingInterval、规则迁移决定及AuditEvent同事务。全部模块切epoch后再写LastSuccessfulActivation。
- Tx-Rule：主输入水位、候选、发生状态、RuleAlarmOutbox同事务；对同一发生按commandSeq发送。
- Tx-Notify：稳定事件去重、NotifyJob入队及Cursor推进同事务；ChannelGate暂停与发送许可领取互斥。
- Tx-Operation：请求hash/意图先持久化，副作用结果与审计可靠保存；未知结果重启对账。
- Tx-Sim：generation屏障、控制版本、清理操作同事务；异步写入/文件发布检查generation，旧结果拒绝。
- 报表文件存受保护文件区，Rec保存元数据。EquipmentSnapshot/Metric为内存投影，FIN历史和原生告警为平台权威；不用普通Rec复制实时值、历史和告警成为第二权威。SimulationSample只用于隔离模拟域，禁止混入FIN真实his。

## 导入/实例化步骤

1. 在隔离开发项目用目标版本Trio读取器解析，检查模板标记、Ref唯一性与单位支持。当前未执行FIN导入。
2. 模板ID是确定的ups-tpl-* Ref。导入器若不能保留ID，必须两遍创建并维护oldRef→newRef，再重写两文件全部引用；不能只重写id。重复导入按清单拒绝重复，不按dis覆盖。
3. 按工程资产对应表替换真实site/equip/point引用；不要在生产新造相同UPS。设置点表证据、原始类型单位、精度、相别、符号、枚举、周期和历史策略。
4. 用独立实例化器补齐运行字段和合法状态，校验自然键、权限、跨设备关联、范围/有限数及来源。时间/操作者由服务端赋值。
5. 通过OP-08～10发布配置；OP-14经过真实接入检查才能accepted。Trio文件本身不执行发布、告警确认或设备写入。
6. 不把这两个文件放进会自动加载的POD lib目录；按显式工程导入流程使用。模板清理只针对本次manifest列出的Ref，且先检查是否被引用，不运行全库删除。

## 证据与待定项

FIN Expert完整证据：fin_doc_FIN_Framework_File_Types_643fc6ae（FIN Framework File Types.md）支持Trio/Zinc类型与记录格式；fin_doc_Developers_-_OEM_Axon_Queries_and_How_to_Axon_Queries_and_How_to_ab669c29支持site/equip/point引用查询示例。它们不证明目标版本事务能力。格式优先按[Project Haystack Trio](https://project-haystack.org/doc/docHaystack/Trio)。FSD为项目需求权威。

待现场：FIN精确build/SDK、点表/型号/协议、站点时区、真实Ref、告警源和事件追补、持久化原子性/唯一约束、秘密/文件容量。当前模型设计可信度较高，目标运行兼容性未验证。


## A2整改补充（优先于A1原型说明）

完整持久化协议见[persistence-design.md](persistence-design.md)，内部类型见[persistence-contracts.ts](persistence-contracts.ts)。运行Rec使用record-codecs.json定义的规范编码，旧模板结构只用于工程模板编辑，不与运行Rec混读。新增原型：RuleOccurrence、SimulationScenarioEvent、SimulationCheckpoint、EntityVersion、BatteryAssetProjection。Q与阻抗基准不再保存在资产blob；具体权威与待批准公开差异见fsd-change-proposal.md。

|原型|契约|自然键|必需字段|
|---|---|---|---|
|ConfigVersion|ConfigVersionRecord|see persistence design|projectId, configRevision, parentRevision, members, contentHash, state|
|AssetProjection|internal|see persistence design|equipRef, targetObjectRef, configRevision, sourceRevision, ratedCapacityKw, ratedCapacityKva, evidenceRefs|
|ConfigDraft|Draft|draftId + draftRevision|baseConfigRevision, scopeDigest, contentHash, patches, author, updatedAt|
|ValidationReport|ValidationReport|validationId|draftRevision, contentHash, platformBindingFingerprint, blockingIssues, warnings, affectedEquip, affectedActiveAlarms, expiresAt|
|Publication|Publication|projectId + operationId|candidateRevision, previousRevision, previousEpoch, targetEpoch, state, moduleReadySet, decisionAt, lastError|
|ActiveConfigPointer|internal|projectId|configRevision, activationEpoch, decisionAt|
|LastSuccessfulActivation|internal|projectId|configRevision, activationEpoch, activatedAt|
|RuleState|RuleStateRecord|projectId + mode + sessionId/generationId (simulation only) + equipRef + ruleId + ruleVersion|activationEpoch, primaryWatermark, candidate, count, candidateSince, badSince, goodSince, detectedRisk, occurrenceId, syncState, lastOccurrenceOrdinal, context, workerFence|
|RuleAlarmOutbox|internal|projectId + mode + sessionId/generationId (simulation only) + occurrenceId + commandSeq|ruleStateRef, commandType, correlationKey, epoch, requestHash, state, sourceResultRef, attempt, nextAttemptAt, commandId, occurrenceId, commandSeq, predecessorCommandId, previousOccurrenceId, payload, payloadHash, reconcileCount, context, workerFence|
|AlarmAssociation|internal|projectId + sourceSystem + sourceAlarmId + occurrenceId|equipRef, sourceRevision, ruleVersion, correlationKey, sourceQuality, resolutionKind|
|OperationJournal|Operation|projectId + operationId|action, requestHash, targetRefs, expectedRevision, state, resultAvailability, resultRef, updatedAt, errorCode, actorId, requestContext, canonicalRequestHash, originalPermission, ownerSessionId, cleanupTombstone, retainedUntil|
|AuditEvent|Audit|auditId|projectId, serverTs, actorId, action, targetRefs, operationId, outcome, beforeRevision, afterRevision, redactedDiff, reasonCode, sourceResultRef|
|AcceptanceReport|AcceptanceReport|reportId|equipRef, configRevision, mappingFingerprint, modelFirmware, pointListVersion, baseChecks, alarmEvidenceRefs, disconnectEvidenceRefs, historyEvidenceRefs, waivers, acceptedBy, acceptedAt|
|MappingInterval|internal|mappingId + configRevision + validFrom|mappingRef, validFrom, validTo, sourceRef, transform, normalizedUnit, assetGeneration, changeReason, knownMappingError|
|MaintenancePlanEvent|Alarm.eventDetails|planId + planRevision + stage|equipRef, targetObjectRef, stage, endedAt, endReason, ackRequired|
|OutlookRecord|OutlookItem|itemId|equipRef, targetObjectRef, component, kind, title, severity, dueDate, windowStart, windowEnd, assessedAt, quality, evidenceRefs, methodologyRef, algorithmVersion, reason|
|ReportJob|ReportJob|projectId + ownerId + operationId|jobId, ownerId, context, params, state, progressPct, createdAt, expiresAt, dataCutoffAt, collectedFrom, collectedTo, rows, bytes, qualitySummary, checksum, errorCode, reason|
|ReportFileMetadata|ReportFile|jobId|fileName, mime, bytes, checksum, protectedStorageKey, generationId, expiresAt|
|NotificationChannel|NotificationChannel|channelId + configRevision|channelId, name, enabled, secretRef, chatId, messageThreadId, timezone, resumePauseRevision|
|NotificationSubscription|NotificationSubscription|subscriptionId + configRevision|subscriptionId, channelId, enabled, equipRefs, severities, eventTypes, quietHours|
|ChannelGate|ChannelGate|projectId + channelId|channelId, paused, pauseRevision, pausedAt, pausedBy, reason|
|NotifyJob|NotifyJob|projectId + eventKey + channelId|notificationId, context, channelId, alarmRef, eventKey, eventAt, createdAt, state, attempt, nextAttemptAt, channelRevision, transport, messageId, simulatedOutcome, lastError|
|NotificationAttempt|internal|notificationId + attempt|operationId, acceptDuplicateRisk, permitRevision, requestHash, startedAt, finishedAt, outcome, messageId, error|
|NotificationCursor|internal|projectId + sourceStream + subscriptionId|sourceWatermark, overlapStart, lastEnqueuedEventKey, updatedAt, gapIntervals|
|MetricDefinition|MetricDefinition|metricId + dictionaryVersion|metricId, name, meaning, unit, formula, measurementLocation, sourceRef, qualityMeaning, basis|
|SimulationSession|SimulationSessionRecord|projectId + sessionId|sessionId, ownerId, generationId, controlRevision, dataRevision, state, initialized, scenarioId, scenarioVersion, seed, deviceCount, startAt, timezone, virtualTime, speed, historyHours, sampleIntervalSeconds, historyRows, lastActivityAt, cleanupOperationId, reason, initialScenarioId, initialScenarioVersion, generatorVersion, initialGenerationParameters, workerFence|
|SimulationCleanup|internal|sessionId + operationId|oldGenerationId, newGenerationId, action, fenceRevision, state, pendingWorkers, pendingFiles, completedAt|
|SimulationSample|internal|sessionId + generationId + objectId + field + sampleTime + sequence|value, unit, quality, sourceTs, scenarioVersion, seed|
|SimulationAlarm|Alarm|sessionId + generationId + occurrenceId|alarmPayload, sourceMode, simulationSessionId, generationId|
|SchemaMigration|internal|migrationId + fromVersion + toVersion|checksum, state, checkpoint, backupRef, startedAt, completedAt|
|RuleOccurrence|RuleOccurrenceRecord|projectId + mode + sessionId/generationId (simulation only) + occurrenceId|equipRef, ruleId, ruleVersion, activationEpoch, occurrenceId, occurrenceOrdinal, previousOccurrenceId, detectedStartedAt, detectedEndedAt, detectedSeverity, sourceAlarmId, nextCommandSeq, revision, context, workerFence|
|SimulationScenarioEvent|ScenarioEventRecord|projectId + sessionId + generationId + eventSeq|sessionId, generationId, scenarioId, scenarioVersion, generatorVersion, targetSimEquipIds, virtualEffectiveAt, eventSeq, parameters, controlRevision|
|SimulationCheckpoint|SimulationCheckpointRecord|projectId + sessionId + generationId|sessionId, generationId, workerFence, initialScenarioId, initialScenarioVersion, generatorVersion, seed, startAt, generationParameters, assignments, lastCompleteEventAt, lastCommittedEventSeq, nextEventSeq, sampleWatermarks, ruleStateRefs, batchId|
|EntityVersion|EntityVersionRecord|projectId + entityId + entityRevision|entityId, entityRevision, entityType, ownerEquipRefs, payload, contentHash|
|BatteryAssetProjection|internal|projectId + configRevision + targetObjectRef|equipRef, targetObjectRef, configRevision, chemistry, cellCount, evidenceRef, sourceRevision|
