'use strict';
function setField(key,value){
  if(key in state)state[key]=value;
  else if(key.startsWith('sim')){const map={simScenario:'scenario',simSeed:'seed',simCount:'count',simStartAt:'startAt',simHistoryHours:'historyHours',simInterval:'interval',simSpeed:'speed',simSeconds:'seconds',simTarget:'target',simSession:'session'};if(map[key])simForm[map[key]]=value}
  else if(key.startsWith('report')){const map={reportFrom:'from',reportTo:'to',reportTimezone:'timezone',reportFormat:'format',reportAggregation:'aggregation',reportAll:'all',reportAllowEmpty:'allowEmpty'};if(map[key])reportState[map[key]]=value;if(key==='reportEquip')state.eq=value;reportState.preview=null}
  else if(key.startsWith('notification')){const map={notificationName:'name',notificationSecretRef:'secretRef',notificationChatId:'chatId',notificationThreadId:'threadId',notificationTimezone:'timezone',notificationQuietStart:'quietStart',notificationQuietEnd:'quietEnd',notificationFilter:'stateFilter',notificationOutcome:'outcome'};if(map[key])notificationState[map[key]]=value}
}
document.addEventListener('change',async e=>{try{if(e.target.dataset.reportMetric){const field=e.target.dataset.reportMetric;reportState.fields=reportState.fields.filter(f=>f!==field);if(e.target.checked)reportState.fields.push(field);reportState.preview=null;render();return}const key=e.target.dataset.field;if(!key)return;setField(key,e.target.type==='checkbox'?e.target.checked:e.target.value);if(key==='site'){state.snapshot=null;state.history=null;state.alarms=[];state.eq=readableDevices()[0]?.identity.equipRef||'';if(state.eq){await loadSnapshot(state.eq);return}}if(['batteryObject','historyMetric','historyRange','historyEnd'].includes(key)){if(available('getHistory'))await loadHistory()}render()}catch(error){toast(error.message)}});
document.addEventListener('click',async e=>{const el=e.target.closest('[data-action]');if(!el||el.disabled)return;const [action,...rest]=el.dataset.action.split(':'),value=rest.join(':');try{
  if(action.startsWith('simNotify')){await notificationSimulationAction(action,value);return}
  if(action.startsWith('sim')||action==='liveMode'){await simulationAction(action,value);return}
  if(['reportPreview','reportGenerate','reportAvailable','reportDownload','reportCancel'].includes(action)){await reportAction(action,value);return}
  switch(action){case 'close':$('#modal').close();break;case 'refresh':if(simActive())await syncSimulation();else await connect();break;case 'unit':state.unit=state.unit==='C'?'F':'C';render();break;case 'dictionary':metricExplain(value);break;
  case 'device':if(!state.devices.some(d=>d.identity.equipRef===value))return;DataProvider.validateRef(value);location.hash='dashboard';await loadSnapshot(value);break;
  case 'step':state.configStep=Math.max(0,Math.min(5,Number(value)));render();break;
  case 'reportDevice':reportState.preview=null;location.hash='reports';render();break;
  case 'reportTemplate':{const t=reportTemplates.find(t=>t.id===value);if(!t)return;reportState.template=t.id;reportState.format=t.formats[0];reportState.preview=null;render();break}
  case 'notificationTab':notificationState.tab=value;render();break;
  case 'notificationPreview':modal('测试消息范围预览',kv([['Bot显示名',esc(notificationState.name)],['目标chatId',esc(notificationState.chatId)]])+notice('真实服务未接入，没有发送消息。'));break;
  case 'history':if(available('getHistory'))await loadHistory();break;
  case 'alarm':{const a=state.alarms.find(a=>a.occurrenceId===value);if(!a)return;modal(simActive()?'模拟告警详情':'告警详情',kv([['描述',esc(a.message||a.title||'')],['发生时间',esc(a.occurredAt||'未知')],['活动状态',badge(a.activity)],['确认状态',badge(a.acknowledgement)],['恢复时间',esc(a.physicalClearedAt||'尚未恢复')],['确认时间',esc(a.acknowledgedAt||'尚未确认')]])+(simActive()?notice('仅修改当前模拟会话的确认状态；确认不恢复故障。')+btn('确认模拟告警','ackSimulation:'+a.occurrenceId,'primary',a.kind!=='alarm'||a.acknowledgement==='acknowledged'||simActive().state==='stopped'):notice('真实确认服务尚未接入。')));break}
  case 'ackSimulation':simulation.acknowledge(simRequest({occurrenceId:value}));$('#modal').close();await syncSimulation();break;
  default:toast('该平台操作当前不可用。')}
}catch(error){toast(error.message)}});
window.addEventListener('hashchange',render);
initializeSimulation();
initializeReportRange();
render();
connect();
