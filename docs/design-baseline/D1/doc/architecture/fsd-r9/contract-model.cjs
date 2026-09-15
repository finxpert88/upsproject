// Executable architecture reference model. Atomicity is simulated, NOT evidence about Folio.
const {canonical}=require('./record-codec.cjs'),crypto=require('crypto');
const hash=x=>crypto.createHash('sha256').update(canonical(x)).digest('hex');
class Store {
 constructor(data={}){this.data=structuredClone(data);}
 tx(fn,fail=false){const next=structuredClone(this.data),result=fn(next);if(fail)throw Error('PERSISTENCE_UNAVAILABLE');this.data=next;return result;}
 restart(){return new Store(this.data);}
}
function detect(store,{at,active,severity='warning'},fail=false,limit=10000){return store.tx(d=>{
 d.rule??={watermark:-1,ordinal:0,current:null};d.occ??=[];d.commands??=[];
 if(at<=d.rule.watermark)return;
 let o=d.occ.find(o=>o.id===d.rule.current),kind=null;
 if(active&&!o){const previous=d.occ.at(-1);o={id:'occ-'+(++d.rule.ordinal),ordinal:d.rule.ordinal,previous:previous?.id||null,start:at,end:null,severity,sourceId:null};d.occ.push(o);d.rule.current=o.id;kind='CREATE';}
 else if(!active&&o){o.end=at;kind='CLEAR';d.rule.current=null;}
 else if(active&&o&&o.severity!==severity){o.severity=severity;kind='SEVERITY';}
 if(kind){if(d.commands.filter(c=>c.state!=='APPLIED').length>=limit)throw Error('OUTBOX_FULL');const prev=d.commands.filter(c=>c.occurrenceId===o.id).at(-1),seq=(prev?.seq||0)+1;const payload={kind,occurrenceId:o.id,ordinal:o.ordinal,eventAt:at,start:o.start,severity,correlationKey:'project/equip/rule/'+o.id};d.commands.push({id:o.id+'/'+seq,occurrenceId:o.id,seq,predecessor:prev?.id||null,previousOccurrence:o.previous,payload,hash:hash(payload),state:'PENDING'});}
 d.rule.watermark=at;
 },fail);}
function claim(store,id){return store.tx(d=>{const c=d.commands.find(c=>c.id===id);if(!c||!['PENDING','DEFINITELY_NOT_APPLIED'].includes(c.state))throw Error('NOT_SENDABLE');if(hash(c.payload)!==c.hash)throw Error('PAYLOAD_CORRUPT');
 if(c.predecessor&&d.commands.find(x=>x.id===c.predecessor)?.state!=='APPLIED')throw Error('PREDECESSOR');
 if(c.payload.kind==='CREATE'&&c.previousOccurrence&&!d.commands.some(x=>x.occurrenceId===c.previousOccurrence&&x.payload.kind==='CLEAR'&&x.state==='APPLIED'))throw Error('PREVIOUS_OCCURRENCE');
 const o=d.occ.find(x=>x.id===c.occurrenceId);if(c.payload.kind!=='CREATE'&&!o.sourceId)throw Error('MISSING_SOURCE');c.state='DISPATCHING';return {...c.payload,targetSourceId:o.sourceId};});}
function applied(store,id,sourceId,fail=false){return store.tx(d=>{const c=d.commands.find(c=>c.id===id),o=d.occ.find(o=>o.id===c.occurrenceId);if(!['DISPATCHING','OUTCOME_UNKNOWN'].includes(c.state))throw Error('BAD_RESULT');if(o.sourceId&&o.sourceId!==sourceId)throw Error('SOURCE_MISMATCH');o.sourceId=sourceId;c.state='APPLIED';c.sourceId=sourceId;},fail);}
function recoverDispatch(store){store.tx(d=>d.commands.forEach(c=>{if(c.state==='DISPATCHING')c.state='OUTCOME_UNKNOWN';}));}
function newSim(){return new Store({projectId:'project',sessionId:'session',generation:1,fence:1,time:0,nextSeq:1,seed:7,initialScenario:'normal',initialScenarioVersion:'1',initialGenerationParameters:{historyHours:0,sampleIntervalSeconds:1,deviceCount:2},generatorVersion:'fixture-v1',assignments:{a:'normal',b:'normal'},scenarioEvents:[],samples:[],events:[],lastEventSeq:0});}
function schedule(store,at,targets,scenario){store.tx(d=>{if(at<d.time)throw Error('PAST_EVENT');const e={at,targets,scenario,seq:d.nextSeq++,generation:d.generation,generatorVersion:d.generatorVersion};d.scenarioEvents.push(e);if(at===d.time){for(const id of targets)d.assignments[id]=scenario;d.lastEventSeq=e.seq;}});}
function advance(store,target,{generation=store.data.generation,fence=store.data.fence,failAt=null,afterCommitAt=null}={}){
 for(let t=store.data.time+1;t<=target;t++){
 store.tx(d=>{if(d.generation!==generation||d.fence!==fence)throw Error('GENERATION_FENCE');
 for(const e of d.scenarioEvents.filter(e=>e.at===t).sort((a,b)=>a.seq-b.seq)){for(const id of e.targets)d.assignments[id]=e.scenario;d.lastEventSeq=e.seq;}
 for(const id of Object.keys(d.assignments).sort()){const scenario=d.assignments[id],value=(d.seed+t+id.charCodeAt(0))%100;d.samples.push({id:`${d.generation}/${id}/${t}`,at:t,device:id,value,scenario});if(scenario==='fault')d.events.push({id:`${d.generation}/${id}/fault/${t}`,at:t,device:id});}
 d.time=t; // Same transaction as all results and assignments for this complete event time.
 },t===failAt);if(t===afterCommitAt)throw Error('PROCESS_CRASH_AFTER_COMMIT');
 }
}
function resetSim(store){store.tx(d=>{d.generation++;d.fence++;d.time=0;d.scenarioEvents=[];d.samples=[];d.events=[];d.nextSeq=1;d.lastEventSeq=0;d.assignments={a:d.initialScenario,b:d.initialScenario};});}
function createConfig(entities,revision){const members=Object.keys(entities).sort().map(id=>{const e=entities[id];return {entityId:id,entityRevision:e.revision,contentHash:hash(e),entity:structuredClone(e)};});return {revision,members,hash:hash(members)};}
function verifyConfig(v){if(!v||hash(v.members)!==v.hash)throw Error('CONFIG_HASH');for(const m of v.members)if(!m.entity||m.entity.id!==m.entityId||m.entity.revision!==m.entityRevision||hash(m.entity)!==m.contentHash)throw Error('MISSING_OR_CORRUPT_ENTITY');return Object.fromEntries(v.members.map(m=>[m.entityId,m.entity]));}
function publish(store,base,patches,scope,revision,fail=false){return store.tx(d=>{const entities=verifyConfig(d.versions[base]);for(const p of patches){const old=entities[p.id];if(old&&!scope.includes(old.site)||p.entity&&!scope.includes(p.entity.site))throw Error('SCOPE_CONFLICT');if(p.remove)delete entities[p.id];else entities[p.id]=structuredClone(p.entity);}const v=createConfig(entities,revision);verifyConfig(v);
 for(const previous of Object.values(d.versions))for(const old of previous.members)for(const next of v.members)if(old.entityId===next.entityId&&old.entityRevision===next.entityRevision&&old.contentHash!==next.contentHash)throw Error('ENTITY_VERSION_CONFLICT');
 if(d.versions[revision]){if(d.versions[revision].hash!==v.hash)throw Error('CONFIG_VERSION_CONFLICT');return 'ALREADY_APPLIED';}
 if(d.pointer!==base)throw Error('REVISION_CONFLICT');d.versions[revision]=v;d.pointer=revision;d.committed=revision;return 'APPLIED';},fail);}
function recoverConfig(store){return verifyConfig(store.data.versions[store.data.pointer]);}
function rollbackPatches(store,target,scope){const current=recoverConfig(store),old=verifyConfig(store.data.versions[target]);return [...new Set([...Object.keys(current),...Object.keys(old)])].filter(id=>{const a=current[id],b=old[id];if(a&&!scope.includes(a.site)||b&&!scope.includes(b.site))return false;return true;}).map(id=>old[id]?{id,entity:old[id]}:{id,remove:true});}
function permission(ops,op,mode){const o=ops.find(o=>o.id===op);if(!o||!o.allowedContexts.includes(mode))throw Error('SOURCE_MODE_MISMATCH');return o.permissionByMode[mode];}
function authorize(ops,op,ctx,scopeOK=true,ownerOK=true,original=null){if(!ctx.actor)throw Error('UNAUTHENTICATED');const o=ops.find(o=>o.id===op),p=permission(ops,op,ctx.mode);if(!scopeOK)throw Error('OBJECT_UNAVAILABLE');
 if(op==='OP-07'){if(!original||original.actor!==ctx.actor)throw Error('OBJECT_UNAVAILABLE');if(original.mode!==ctx.mode)throw Error('SOURCE_MODE_MISMATCH');return authorize(ops,original.action,ctx,scopeOK,ownerOK);}
 if(ctx.mode==='simulation'&&ctx.root){if(!o.rootSimulationAllowed||o.rootActionRestriction&&ctx.action!==o.rootActionRestriction)throw Error('SOURCE_MODE_MISMATCH');}
 const has=(list,p)=>list.includes(p)||p.startsWith('simulation.')&&list.includes('simulation.manage');
 if(p!=='session'&&!has(ctx.permissions,p))throw Error('FORBIDDEN');
 if(ctx.mode==='simulation'&&!ctx.root&&p.startsWith('simulation.')){const acl=p.slice(11);if(!ctx.acl.includes(acl)&&!ctx.acl.includes('manage'))throw Error('FORBIDDEN');}
 if(o.ownerRequired&&!ownerOK)throw Error('OBJECT_UNAVAILABLE');return true;
}
function registerOperation(store,req,{actor,authorized,currentGeneration=null}={}){if(!actor)throw Error('UNAUTHENTICATED');if(!authorized)throw Error('FORBIDDEN');return store.tx(d=>{d.journal??={};const key=canonical([req.projectId,req.operationId]),bindingHash=hash(req);const old=d.journal[key];
 if(old){if(old.actor!==actor)throw Error('OBJECT_UNAVAILABLE');if(old.hash!==bindingHash)throw Error('IDEMPOTENCY_CONFLICT');if(req.context.mode==='simulation'&&req.context.generationId!==currentGeneration&&!['OP-28','OP-29','OP-23'].includes(req.action))throw Error('GENERATION_MISMATCH');return {reused:true,result:old.result};}
 if(req.context.mode==='simulation'&&req.action!=='OP-23'&&req.context.generationId!==currentGeneration)throw Error('GENERATION_MISMATCH');d.journal[key]={actor,hash:bindingHash,action:req.action,result:'operation-result-'+Object.keys(d.journal).length};return {reused:false,result:d.journal[key].result};});}
function bootstrap(){return {supportedSchemaVersions:['2.0'],upgradeRequired:true,message:'Use schema 2.0 for authenticated capabilities.'};}
function capabilities(version,actor){if(!actor)throw Error('UNAUTHENTICATED');if(version!=='2.0')throw Error('SCHEMA_VERSION_UNSUPPORTED');return {language:'en-US'};}
module.exports={Store,hash,detect,claim,applied,recoverDispatch,newSim,schedule,advance,resetSim,createConfig,verifyConfig,publish,recoverConfig,rollbackPatches,authorize,registerOperation,bootstrap,capabilities};
function scopedTx(store,expected,workerFence,fn,fail=false){return store.tx(d=>{if(canonical(d.scope)!==canonical(expected))throw Error('SCOPE_MISMATCH');if(expected.mode==='simulation'&&d.workerFence!==workerFence)throw Error('WORKER_FENCE');return fn(d);},fail);}
module.exports.scopedTx=scopedTx;
