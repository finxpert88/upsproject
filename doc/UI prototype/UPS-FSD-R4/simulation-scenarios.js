'use strict';
const SimulationScenarios=Object.freeze({
  complete:{name:'完整正常',version:'1.0',description:'三台设备、完整指标与历史；含计划提醒和已恢复事件。'},
  outage:{name:'市电中断与恢复',version:'1.0',description:'电池供电，续航随虚拟时间下降；180秒后恢复市电。'},
  overload:{name:'低续航 / 高负载',version:'1.0',description:'负载超过100%，续航低于模拟要求；2次新样本触发规则。'},
  degradation:{name:'电池劣化 / 维护',version:'1.0',description:'容量型SOH与阻抗变化；独立展示计划与模拟预测。'},
  missing:{name:'通信与数据缺失',version:'1.0',description:'主源停止采样，30秒后过期、再持续5秒告警；120秒恢复。部分点不支持/未映射。'},
  environment:{name:'环境与旁路',version:'1.0',description:'机房高温、漏水和静态旁路；不向设备发控制指令。'},
  notification:{name:'通知异常',version:'1.0',description:'产生模拟告警，可选择本地接受、429、拒绝或超时unknown。'}
});
const SimulationFields={
  runtimeEstimateMinutes:['min',1],requiredRuntimeMinutes:['min',0],loadPct:['%',1],outputPowerKw:['kW',2],ratedCapacityKw:['kW',0],outputApparentPowerKva:['kVA',2],ratedCapacityKva:['kVA',0],
  stringVoltage:['V',1],batteryImpedance:['mΩ',2],batteryTemperature:['°C',1],batteryCurrent:['A',2],batterySoc:['%',1],batterySoh:['%',1],outputVoltage:['V',1],outputFrequency:['Hz',2],outputThd:['%',1],rectifierStatus:['',0],fanStatus:['',0],capacitorHealthPct:['%',1],ambientTemperature:['°C',1],relativeHumidity:['%RH',1],airQuality:['μg/m³',1],waterDetected:['',0],transferStatus:['',0],lastTransferDuration:['ms',1],staticBypassAvailable:['',0],staticBypassActive:['',0],maintenanceBypassAvailable:['',0],maintenanceBypassActive:['',0],lastTransferAt:['',0],powerMode:['',0]
};
const simIso=ms=>new Date(ms).toISOString();
const simRound=(n,d=1)=>Number(n.toFixed(d));
function simNoise(seed,index,second,salt=0){let x=(Number(seed)^Math.imul(index+1,374761393)^Math.imul(Math.floor(second),668265263)^salt)>>>0;x=Math.imul(x^(x>>>13),1274126177);return ((x^(x>>>16))>>>0)/4294967296}
function generateAssets(config){return Array.from({length:config.deviceCount},(_,index)=>{const ratedKw=[60,80,40][index%3],ref=`sim:${config.id}:${config.generationId}:ups-${index+1}`;return {index,identity:{equipRef:ref,siteRef:`sim:${config.id}:${config.generationId}:site-1`,name:`UPS-${String(index+1).padStart(2,'0')}`,model:`SIM Online ${ratedKw}kW`,location:['数据中心 A / 电力间','数据中心 B / 电力间','运营中心 / 设备间'][index%3],commissioningStatus:'accepted'},ratedKw,ratedKva:simRound(ratedKw/0.9,1),batteryRef:ref+':battery-1',cellCount:40,chemistry:'VRLA（模拟）',impedanceBaseline:8+index*0.4}})}
function generateCurrent(seed,scenario,simTime,asset,context){
  const elapsed=(simTime-context.startAt)/1000,phase=(simTime-context.scenarioAt)/1000,noise=simNoise(seed,asset.index,Math.floor(elapsed/5)),wave=Math.sin(elapsed/540+asset.index),outage=scenario==='outage'&&phase<180;
  const overload=scenario==='overload'||scenario==='notification',degraded=scenario==='degradation',env=scenario==='environment';
  const load=simRound(overload?108+noise*7:outage?64+wave*3:43+(asset.index%3)*7+wave*5+noise*2),soc=simRound(outage?Math.max(20,96-phase/7):degraded?91+wave:97+wave),soh=simRound(degraded?66+(asset.index%3):94-(asset.index%3)*2+wave*0.2);
  const power=simRound(asset.ratedKw*load/100,2),runtime=simRound(overload?6+noise:outage?Math.max(3,20-phase/10):32-(asset.index%3)*3+wave*2);
  const v={runtimeEstimateMinutes:runtime,requiredRuntimeMinutes:15,loadPct:load,outputPowerKw:power,ratedCapacityKw:asset.ratedKw,outputApparentPowerKva:simRound(power/0.95,2),ratedCapacityKva:asset.ratedKva,stringVoltage:simRound(outage?480-phase*.06:540+wave*2),batteryImpedance:simRound(asset.impedanceBaseline*(degraded?1.38:1.04)+noise*.03,2),batteryTemperature:simRound(degraded?33+wave:25+wave),batteryCurrent:simRound(outage?-(power*1000/480):2+noise,2),batterySoc:soc,batterySoh:soh,outputVoltage:simRound(230+wave),outputFrequency:simRound(50+wave*.02,2),outputThd:simRound(1.8+noise*.3),rectifierStatus:outage?'停机 / 电池放电':'整流正常 / 浮充',fanStatus:degraded?'转速偏低':'运行正常',capacitorHealthPct:degraded?72:93-(asset.index%3),ambientTemperature:simRound(env?39+noise:23+wave),relativeHumidity:simRound(45+noise*4),airQuality:simRound(12+noise*3),waterDetected:env,transferStatus:env?'静态旁路':outage?'电池逆变':'市电逆变',lastTransferDuration:4.2,staticBypassAvailable:true,staticBypassActive:env,maintenanceBypassAvailable:true,maintenanceBypassActive:false,lastTransferAt:simIso(scenario==='outage'?context.scenarioAt+(phase>=180?180000:0):context.startAt-7200000),powerMode:env?'staticBypass':outage?'battery':'utility'};
  const qualities={};let sourceTime=simTime,communication='online';
  if(scenario==='missing'){
    qualities.airQuality='unsupported';qualities.batteryImpedance='unmapped';
    if(phase>=0&&phase<120){sourceTime=context.scenarioAt;communication=phase>30?'offline':'degraded';if(phase>30)for(const f of Object.keys(v))if(!['ratedCapacityKw','ratedCapacityKva','requiredRuntimeMinutes','lastTransferAt'].includes(f))if(!qualities[f])qualities[f]='stale'}
  }
  return {at:simTime,sourceTime,freshnessUntil:sourceTime+30000,mappingRevision:'sim-mapping-1',assetGeneration:context.generationId||'stable',mappingValidTo:null,scenario,values:v,qualities,communication,health:degraded?68:overload?88:96-(asset.index%3)};
}
function generateHistory(config,asset){const rows=[],interval=config.sampleIntervalSeconds*1000;for(let t=config.startAt-config.historyHours*3600000;t<=config.startAt;t+=interval)rows.push(generateCurrent(config.seed,config.initialScenario,t,asset,{startAt:config.startAt,scenarioAt:config.startAt}));if(rows.at(-1)?.at!==config.startAt)rows.push(generateCurrent(config.seed,config.initialScenario,config.startAt,asset,{startAt:config.startAt,scenarioAt:config.startAt}));for(const r of rows)r.freshnessUntil=r.sourceTime+Math.max(30000,config.sampleIntervalSeconds*3000);return rows}
// Pure numeric rule gate, shared by the simulation evaluator and boundary tests.
function evaluateScenarioTransition(previous,input){
  const r={level:'normal',candidate:null,lastTs:null,...previous};if(!input.good){r.candidate=null;return r}if(input.ts<=r.lastTs)return r;
  let target=r.level;
  if(input.rule==='R-02'){const {value:v,W=75,C=90,Hw=5,Hc=3}=input;target=r.level==='normal'?(v>=C?'critical':v>=W?'warning':'normal'):v<W-Hw?'normal':r.level==='warning'?(v>=C?'critical':'warning'):v<C-Hc?'warning':'critical'}
  else if(input.rule==='R-01'){target=input.value<input.Q?(input.mode==='battery'?'critical':'warning'):input.value>=input.Q+2?'normal':r.level}
  else if(input.rule==='R-03'){target=input.value>=30?'warning':input.value<25?'normal':r.level}
  if(target===r.level)r.candidate=null;else{if(!r.candidate||r.candidate.target!==target||input.ts-r.lastTs>30000)r.candidate={target,count:0,since:input.ts};r.candidate.count++;if(r.candidate.count>=(input.N??2)&&input.ts-r.candidate.since>=(input.durationMs??0)){r.level=target;r.candidate=null}}
  r.lastTs=input.ts;return r;
}
