'use strict';
// Display boundaries do not translate source evidence. The live adapter retains originals server-side.
const hasNonEnglishScript=value=>/[^\p{Script=Latin}\p{Number}\p{Punctuation}\p{Separator}\p{Symbol}\s]/u.test(String(value??''));
function sourceDisplay(value,stableId,mapping,language){
  if(mapping?.verified===true&&mapping.language===PRODUCT_LOCALE&&typeof mapping.text==='string'&&mapping.text.trim()&&!hasNonEnglishScript(mapping.text))return mapping.text;
  if(typeof value==='string'&&((language&&!/^en(?:-|$)/i.test(language))||hasNonEnglishScript(value)))return L.sourceFallback+' ['+(stableId||'source')+']';
  return value;
}
function englishSourceView(value,inheritedId='source',inheritedLanguage){
  if(Array.isArray(value))return value.map(v=>englishSourceView(v,inheritedId,inheritedLanguage));
  if(!value||typeof value!=='object')return sourceDisplay(value,inheritedId,null,inheritedLanguage);
  const id=value.occurrenceId||value.equipRef||value.objectRef||value.id||inheritedId,language=value.sourceLanguage||inheritedLanguage,out={};
  for(const [key,v]of Object.entries(value)){
    if(/^(raw.*|original.*|englishDisplay|sourceLanguage)$/i.test(key))continue;
    if(typeof v==='string'){
      const exact=/^(.*Ref|.*Id|id|unit|model|brand|protocol|schemaVersion|language|timezone|.*At|.*Ts)$/i.test(key);
      out[key]=exact?v:sourceDisplay(v,id,value.englishDisplay?.[key],['name','title','message','description','location'].includes(key)?language:undefined);
      if(out[key]!==v&&out[key].startsWith(L.sourceFallback))out.translationDiagnostic=L.sourceDiagnostic;
    }else out[key]=englishSourceView(v,id,language);
  }
  return out;
}
function englishError(error){const text=String(error?.message??error??L.requestError);if(!hasNonEnglishScript(text))return text;const code=text.match(/^([A-Z][A-Z0-9_]+)(?=:)/)?.[1];return (code?code+': ':'')+L.requestError}
function hasTranslationTodo(value){return !!value&&typeof value==='object'&&(!!value.translationDiagnostic||Object.values(value).some(hasTranslationTodo))}
function productTime(value,timezone='UTC'){const date=new Date(value);if(!Number.isFinite(date.getTime()))return L.m004;return new Intl.DateTimeFormat(PRODUCT_LOCALE,{timeZone:timezone,year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZoneName:'shortOffset'}).format(date)+' ['+timezone+']'}
function notificationMessage(input){
  const n=englishSourceView(input),sim=n.sourceMode==='simulation',event={create:L.notificationOccurrence,occurrence:L.notificationOccurrence,clear:L.notificationClear,ack:L.notificationAck,test:L.notificationTest,severity:L.notificationSeverityChange}[n.event]||n.event||L.notificationTest;
  const activity={active:L.m024,cleared:L.m025,notApplicable:L.m029}[n.activity]||n.activity||L.m029,acknowledgment={acknowledged:L.m027,unacknowledged:L.m026,notRequired:L.m028}[n.acknowledgement]||n.acknowledgement||L.m028;
  return [sim?L.simulatedNotification:L.liveNotification,L.notificationProject+': '+(n.project||'UPS Fleet'),L.notificationSite+': '+(n.site||L.m004),L.notificationEquipment+': '+(n.equipment||n.equipRef||L.m004),L.notificationEvent+': '+event,L.notificationSeverity+': '+({critical:L.m013,warning:L.m014,info:L.m015}[n.severity]||n.severity||L.m015),L.notificationTitle+': '+(n.message||n.title||L.notificationTest),L.notificationOccurred+': '+productTime(n.occurredAt||n.eventAt,n.timezone),L.notificationEventTime+': '+productTime(n.eventAt,n.timezone),L.notificationActivity+': '+activity,L.notificationAckState+': '+acknowledgment,L.notificationId+': '+(n.notificationId||'preview'),sim?L.simulationSafety:L.notificationLogin].join('\n');
}
function applyProductLanguage(){document.documentElement.lang=PRODUCT_LOCALE;for(const element of document.querySelectorAll('[data-l]'))element.textContent=L[element.dataset.l];for(const element of document.querySelectorAll('[data-l-aria]'))element.setAttribute('aria-label',L[element.dataset.lAria])}
