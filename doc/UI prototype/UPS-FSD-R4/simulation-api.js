'use strict';
// Typed schema2.0 boundary for the local simulation operations. FIN bindings are not present.
const SimulationWireFields={
 'OP-01':[],
 'OP-06':['occurrenceId','expectedRevision','operationId','comment'],
 'OP-07':['operationId'],
 'OP-20':['channelId','states','from','to','cursor','pageSize'],
 'OP-21':['notificationId','operationId','acceptDuplicateRisk'],
 'OP-23':['operationId','scenarioId','scenarioVersion','seed','deviceCount','startAt','timezone'],
 'OP-24':['sessionId','generationId','expectedControlRevision','operationId','historyHours','sampleIntervalSeconds'],
 'OP-25':['sessionId','generationId','expectedControlRevision','operationId','action','speed'],
 'OP-26':['sessionId','generationId','expectedControlRevision','operationId','seconds'],
 'OP-27':['sessionId','generationId','expectedControlRevision','operationId','scenarioId','scenarioVersion','targetSimEquipIds','simulatedOutcome'],
 'OP-28':['sessionId','generationId','expectedControlRevision','operationId'],
 'OP-29':['sessionId','generationId','expectedControlRevision','operationId'],
 'OP-30':['action','sessionId','cursor','pageSize'],
 'OP-31':['channelId','operationId','reason']
};
function wireSession(s){return {sessionId:s.id,ownerId:s.ownerId,generationId:s.generationId,controlRevision:String(s.controlRevision),dataRevision:String(s.dataRevision),state:s.state,initialized:s.initialized,scenarioId:s.scenarioId,scenarioVersion:s.scenarioVersion,seed:s.seed,deviceCount:s.deviceCount,startAt:simIso(s.startAt),timezone:s.timezone,virtualTime:simIso(s.virtualTime),speed:s.speed,historyHours:s.historyHours,sampleIntervalSeconds:s.sampleIntervalSeconds,historyRows:s.recordCount,lastActivityAt:simIso(s.virtualTime),cleanupOperationId:s.cleanupOperationId,reason:s.error||null}}
class SimulationApi{
 constructor(service){this.service=service;this.requestId=0}
 validate(op,p){if(p.schemaVersion!=='2.0')throw Error(L.m717);if(!SimulationWireFields[op])throw Error('CAPABILITY_UNSUPPORTED');const allowed=['schemaVersion','context',...SimulationWireFields[op]];if(Object.keys(p).some(k=>!allowed.includes(k)))throw Error(L.m718);const c=p.context;if(!c||c.mode!=='simulation')throw Error('SOURCE_MODE_MISMATCH');if(Object.keys(c).some(k=>!['mode','sessionId','generationId'].includes(k)))throw Error(L.m719);if(op==='OP-31')throw Error(L.m720);const root=op==='OP-23'||op==='OP-30'&&p.action==='list'||op==='OP-01'&&c.sessionId===null;if(root){if(c.sessionId!==null||c.generationId!==null)throw Error(L.m721)}else{if(!c.sessionId||!c.generationId)throw Error(L.m722);const s=this.service.get(c.sessionId);if(!['OP-30','OP-07'].includes(op))this.service.assertData(s,c.generationId);if(p.sessionId!==undefined&&p.sessionId!==c.sessionId||p.generationId!==undefined&&p.generationId!==c.generationId)throw Error(L.m723)}
 if(op==='OP-06'&&(!p.occurrenceId||!p.operationId||p.expectedRevision===undefined||typeof p.comment!=='string'))throw Error('VALIDATION_FAILED');if(['OP-23','OP-27'].includes(op)&&(!SimulationScenarios[p.scenarioId]||p.scenarioVersion!=='1.0'))throw Error(L.m724);if(op==='OP-23'&&(!Number.isInteger(p.seed)||p.seed<0||p.seed>2147483647||!p.timezone))throw Error('VALIDATION_FAILED');if(/^OP-(24|25|26|27|28|29)$/.test(op)&&(!p.operationId||!p.sessionId||!p.generationId||p.expectedControlRevision===undefined))throw Error(L.m725);if(op==='OP-27'&&(!Array.isArray(p.targetSimEquipIds)||!p.targetSimEquipIds.length))throw Error(L.m726);if(op==='OP-25'&&p.speed!==undefined&&!['start','resume'].includes(p.action))throw Error(L.m727);return c}
 invoke(op,p){let context={sourceMode:'simulation',simulationSessionId:null,generationId:null,scenarioId:null,scenarioVersion:null,seed:null,virtualTime:null};const meta=()=>({requestId:'local-'+(++this.requestId),serverTime:simIso(Date.now()),schemaVersion:'2.0',context});try{const c=this.validate(op,p),s=c.sessionId?this.service.get(c.sessionId):null;if(s)context=this.service.sourceContext(s);let data;
 if(op==='OP-01')data={language:PRODUCT_LOCALE,supportedVersions:['2.0'],permissions:s?['read','ack','export','manage'].filter(a=>this.service.can('simulation.'+a,s)).map(a=>'simulation.'+a):this.service.permissions};
 else if(op==='OP-30'){if(p.action==='get'){data={session:wireSession(this.service.get(p.sessionId))}}else if(p.action==='list'){const size=p.pageSize??50;if(!Number.isInteger(size)||size<1||size>100||p.cursor)throw Error('VALIDATION_FAILED');data={items:this.service.list().slice(0,size).map(wireSession),nextCursor:null}}else throw Error('VALIDATION_FAILED')}
 else if(op==='OP-07'){const found=Object.values(this.service.receipts).find(r=>r.sessionId===s.id&&r.hash.includes(JSON.stringify(p.operationId)));if(!found)throw Error('OBJECT_UNAVAILABLE');data={operation:{...found.result,operationId:p.operationId,state:s.cleanup?.operationId===p.operationId?(s.cleanup.completed?'succeeded':'pending'):'succeeded'},alarm:null,publication:null}}
 else if(op==='OP-20'){this.service.require('simulation.read',s);data={items:s.notifications.filter(n=>!p.states?.length||p.states.includes(n.state)).map(n=>({notificationId:n.id,context:this.service.sourceContext(s),channelId:null,alarmRef:n.alarmId,eventKey:n.event,eventAt:n.createdAt,createdAt:n.createdAt,state:n.state,attempt:n.attempt,nextAttemptAt:n.retryAt,channelRevision:null,transport:'simulated',messageId:null,simulatedOutcome:n.simulatedOutcome,lastError:null})),nextCursor:null}}
 else{const body={...p};delete body.schemaVersion;delete body.context;if(body.expectedControlRevision!==undefined)body.expectedControlRevision=Number(body.expectedControlRevision);const map={'OP-23':'create','OP-24':'generate','OP-25':'control','OP-26':'step','OP-27':'scenario','OP-28':'reset','OP-29':'delete'};if(map[op]){const result=this.service[map[op]](body),session=this.service.get(result.id||body.sessionId);context=this.service.sourceContext(session);data={session:wireSession(session)};if(result.operation)data.operation=result.operation}
 else if(op==='OP-06'){const result=this.service.acknowledge({sessionId:s.id,generationId:s.generationId,...body,expectedControlRevision:s.controlRevision,expectedAlarmRevision:Number(body.expectedRevision)});data={operation:result,alarm:s.alarms.find(a=>a.occurrenceId===body.occurrenceId)||null}}
 else if(op==='OP-21'){data={job:this.service.retry({sessionId:s.id,generationId:s.generationId,expectedControlRevision:s.controlRevision,outcome:s.channel?.outcome||'accepted',...body})}}
 else throw Error('CAPABILITY_UNSUPPORTED')}
 return {...meta(),kind:'ok',data,warnings:[]};
 }catch(e){const message=englishError(e),code=message.split(':')[0];return {...meta(),kind:'error',error:{code,message,retryable:false,retryAfterMs:null,operationId:p.operationId||null,issues:[]}}}}
}
