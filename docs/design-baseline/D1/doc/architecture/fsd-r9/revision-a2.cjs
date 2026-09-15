// Single generator hook for A2. Do not patch generated artifacts by hand.
const fs=require('fs'),path=require('path');
const ref=ref=>({ref}), marker={marker:true};
function augment(business){
 const find=t=>business.find(r=>r.upsRecordType===t);
 find('OperationJournal').upsNaturalKey='projectId + operationId';
 find('OperationJournal').upsRequiredFields.push('actorId','requestContext','canonicalRequestHash','originalPermission','ownerSessionId','cleanupTombstone','retainedUntil');
 find('RuleAlarmOutbox').upsRequiredFields.push('commandId','occurrenceId','commandSeq','predecessorCommandId','previousOccurrenceId','payload','payloadHash','reconcileCount');
 find('RuleState').upsRequiredFields.push('lastOccurrenceOrdinal','context','workerFence');
 find('RuleState').upsContractType='RuleStateRecord';
 find('SimulationSession').upsRequiredFields.push('initialScenarioId','initialScenarioVersion','generatorVersion','initialGenerationParameters','workerFence');
 find('SimulationSession').upsContractType='SimulationSessionRecord';
 find('ConfigVersion').upsRequiredFields=['projectId','configRevision','parentRevision','members','contentHash','state'];
 find('ConfigVersion').upsContractType='ConfigVersionRecord';
 // Remove ambiguous uneditable asset blob. Proposed 2.1 entities remain separate and disabled.
 const asset=find('AssetConfiguration');asset.upsRecordType='AssetProjection';asset.dis='AssetProjection';
 asset.upsTargetObjectRef=ref('ups-tpl-ups');delete asset.upsAssetFieldsJson;
 asset.upsConfigRef=ref('ups-tpl-config');asset.upsAuthority='publishedRuleAndPlatformSnapshot';
 asset.upsRequiredFields=['equipRef','targetObjectRef','configRevision','sourceRevision','ratedCapacityKw','ratedCapacityKva','evidenceRefs'];
 find('EnvironmentAssociation').upsConfigRef=ref('ups-tpl-config');
 find('EnvironmentAssociation').upsAuthority='publishedMappingAndValidatedLocationEvidence';
 const add=(suffix,type,contract,key,fields)=>business.push({id:ref('ups-tpl-'+suffix),dis:type,upsFleet:marker,upsTemplate:marker,upsSchemaVersion:'2.0',upsRecordType:type,upsProjectId:'project-template',upsSourceMode:'template',upsContractType:contract,upsNaturalKey:key,upsRequiredFields:fields.split(','),upsPrototypeState:'notInstantiated'});
 add('occurrence','RuleOccurrence','RuleOccurrenceRecord','projectId + occurrenceId','equipRef,ruleId,ruleVersion,activationEpoch,occurrenceId,occurrenceOrdinal,previousOccurrenceId,detectedStartedAt,detectedEndedAt,detectedSeverity,sourceAlarmId,nextCommandSeq,revision');
 add('scenario-event','SimulationScenarioEvent','ScenarioEventRecord','projectId + sessionId + generationId + eventSeq','sessionId,generationId,scenarioId,scenarioVersion,generatorVersion,targetSimEquipIds,virtualEffectiveAt,eventSeq,parameters,controlRevision');
 add('checkpoint','SimulationCheckpoint','SimulationCheckpointRecord','projectId + sessionId + generationId','sessionId,generationId,workerFence,initialScenarioId,initialScenarioVersion,generatorVersion,seed,startAt,generationParameters,assignments,lastCompleteEventAt,lastCommittedEventSeq,nextEventSeq,sampleWatermarks,ruleStateRefs,batchId');
 add('entity-version','EntityVersion','EntityVersionRecord','projectId + entityId + entityRevision','entityId,entityRevision,entityType,ownerEquipRefs,payload,contentHash');
 add('battery-asset','BatteryAssetProjection','internal','projectId + configRevision + targetObjectRef','equipRef,targetObjectRef,configRevision,chemistry,cellCount,evidenceRef,sourceRevision');
 for(const r of business.filter(r=>['RuleState','RuleOccurrence','RuleAlarmOutbox'].includes(r.upsRecordType))){
  r.upsRequiredFields=[...new Set([...r.upsRequiredFields,'context','workerFence'])];
  r.upsNaturalKey='projectId + mode + sessionId/generationId (simulation only) + '+r.upsNaturalKey.replace(/^projectId \+ /,'');
 }
}
function operations(ops){
 const sim={1:'session',2:'simulation.read',3:'simulation.read',4:'simulation.read',5:'simulation.read',6:'simulation.ack',7:'originalActionByMode',15:'simulation.export',16:'simulation.read',17:'simulation.export',18:'simulation.export',20:'simulation.read',21:'simulation.manage',22:'simulation.read',23:'simulation.manage',24:'simulation.manage',25:'simulation.manage',26:'simulation.manage',27:'simulation.manage',28:'simulation.manage',29:'simulation.manage',30:'simulation.read'};
 return ops.map((o,i)=>{const n=i+1;const live=n>=23&&n<=30?null:o.permission==='originalAction'?'originalActionByMode':o.permission;const p=sim[n]||null;delete o.permission;
 return {...o,allowedContexts:[...(live?['live']:[]),...(p?['simulation']:[])],permissionByMode:{live,simulation:p},simulationAcl:p?.startsWith('simulation.')?p.split('.')[1]:n===7?'originalAction':n===1?'visibleSession':null,scopeByMode:{live:'current project + all referenced authorized objects',simulation:n===23?'create owned session':n===30?'filter authorized session ACL':'current session ACL + generation + referenced session objects'},ownerRequired:[7,18].includes(n),rootSimulationAllowed:[1,23,30].includes(n),rootActionRestriction:n===30?'list':null,permissionImplications:{'simulation.manage':['simulation.read','simulation.ack','simulation.export']},externalSideEffectsByMode:{live:[6,10,14,19,21,31].includes(n),simulation:false},idempotency:[6,10,14,15,18,19,21,23,24,25,26,27,28,29,31].includes(n)?{uniqueKey:['projectId','operationId'],bindingFields:['actorId','action','requestContext','canonicalRequestHash'],lookupBeforeRevisionCheck:true,cleanupOldContextException:[28,29].includes(n)?'same registered request only; OP-07 returns redacted cleanup status':null}:null};});
}
function docs(root,ops,business){
 const read=n=>fs.readFileSync(path.join(root,n),'utf8'),write=(n,t)=>fs.writeFileSync(path.join(root,n),t);
 write('bootstrap-route.json',JSON.stringify({route:'/upsFleet/api/bootstrap',method:'GET',authentication:'public metadata only',request:{body:false,context:false,schemaVersion:false},responseType:'BootstrapResponse',businessData:false,capabilityRoute:ops[0].transport,capabilityAuthentication:'required'},null,2));
 write('handlers.ts',read('handlers.ts')+'\n/// <reference path="./persistence-contracts.ts" />\ninterface UpsFleetBootstrapHandlers { bootstrap: BootstrapHandler; }\n');
 let model=read('model-catalog.md');
 model=model.replaceAll('projectId + actorId + operationId','projectId + operationId').replaceAll('AssetConfiguration','AssetProjection');
 model=model.replace('requiredRuntimeMinutes、ratedCapacity、chemistry等资产参数属于AssetProjection，缺失保留null；','Q与阻抗基准按已发布规则投影；额定容量与电池属性分别按UPS/电池对象投影，公开编辑差异见CP-AR03；');
 model=model.replace('以projectId+mode+session/generation作为隔离前缀；活动指针单项目唯一。','数据隔离使用projectId+mode+session/generation；OperationJournal例外：唯一键固定projectId+operationId，模式/代次属于绑定字段，不能扩展主键。活动指针单项目唯一。');
 model=model.replace('业务实例中领域field统一映射为ups+首字母大写field（如operationId→upsOperationId）；','A2运行编解码以record-codecs.json为准；模板编辑布局不作为运行codec。');
 model+='\n\n## A2整改补充（优先于A1原型说明）\n\n完整持久化协议见[persistence-design.md](persistence-design.md)，内部类型见[persistence-contracts.ts](persistence-contracts.ts)。运行Rec使用record-codecs.json定义的规范编码，旧模板结构只用于工程模板编辑，不与运行Rec混读。新增原型：RuleOccurrence、SimulationScenarioEvent、SimulationCheckpoint、EntityVersion、BatteryAssetProjection。Q与阻抗基准不再保存在资产blob；具体权威与待批准公开差异见fsd-change-proposal.md。\n\n';
 model+='|原型|契约|自然键|必需字段|\n|---|---|---|---|\n'+business.filter(r=>r.upsRequiredFields).map(r=>`|${r.upsRecordType}|${r.upsContractType||'internal'}|${r.upsNaturalKey||'see persistence design'}|${r.upsRequiredFields.join(', ')}|`).join('\n')+'\n';write('model-catalog.md',model);
 let api=read('interface-implementation-list.md');api=api.replace(/- OP-06\/10\/14\/15\/18\/19\/21\/23～29\/31：[\s\S]*?(?=\n- OP-06采用)/,'- 幂等唯一键固定projectId+operationId；actor/action/context/规范化请求hash为绑定字段。身份与当前授权先验，已登记原请求查找先于revision检查。重置/删除旧上下文例外严格按persistence-design.md；不能执行新代次副作用。OP-08采用draft/entity CAS，OP-11只建回退草稿。');
 api=api.replace('OP-19/21/31按模式拒绝跨接真实传输。','OP-19/31禁止simulation；OP-21模拟分支仅本地重试。');
 api+='\n\n## A2机器契约\n\noperations.json的permissionByMode和ACL元数据取代单permission字段；OP-07解析原journal动作后按原模式鉴权。bootstrap-route.json定义无版本GET /upsFleet/api/bootstrap，无认证业务信息；完整能力POST保持schema2.0与会话认证。内部持久化与重试顺序见persistence-design.md。\n';write('interface-implementation-list.md',api);
 write('README.md',read('README.md').replace(/71个模板/g,business.length+'个模板')+'\nA2整改：[处置结果](review-disposition.md) · [持久化协议](persistence-design.md) · [公开契约差异提案](fsd-change-proposal.md) · [验证](VALIDATION.md)。\n');
 const extra='  STATE --> OCC["RuleOccurrence · Ordinal chain · Immutable command payload"]\n  SIMSTORE --> CP["ScenarioEvent · Checkpoint · Generation / Worker fence"]\n  CONFIG --> EV["Sealed manifest · EntityVersion · Content hashes"]\n  API --> BOOT["Separate bootstrap GET · Metadata only"]\n';
 write('architecture.mmd',read('architecture.mmd')+extra);
 write('architecture.md',read('architecture.md').replace('```\n\n共享',extra+'```\n\n共享')+'\nA2新增：跨发生链、场景日志/检查点、全量配置清单、独立bootstrap。AR-03公开编辑差异仍待确认；详见处置结果。\n');
 let svg=read('architecture.svg').replace('Folio · Config / Epoch / State / Audit','Folio · Manifest / Occurrences / Audit').replace('Isolated simulated records','Scenario log / Checkpoint / Worker fence').replace('Approved FSD r9 baseline · Architecture design','FSD r9 · Architecture A2 · AR03 decision pending');
 write('architecture.svg',svg);
}
module.exports={augment,operations,docs};
