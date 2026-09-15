'use strict';
const ResponsiveUI={installed:false,drafts:new Map(),menuOpen:false,returnFocus:null,lastTab:'',trendSelection:new Map(),downloads:new Map()};
function rememberDraft(element){if(element?.dataset?.draftKey)ResponsiveUI.drafts.set(element.dataset.draftKey,element.type==='checkbox'?element.checked:element.value)}
function enhanceResponsive(){
 for(const [id,handle]of ResponsiveUI.downloads)try{validateDownload(handle)}catch{URL.revokeObjectURL(handle.url);ResponsiveUI.downloads.delete(id)}
 const app=$('#app');
 for(const [index,element]of [...(app.querySelectorAll?.('input,select,textarea')||[])].entries()){
  const field=element.dataset.field,managed=field&&(field in state||/^(sim|report|notification)/.test(field))||element.dataset.reportMetric;
  if(!managed){const key=state.page+':'+(field||'control-'+index);element.dataset.draftKey=key;if(ResponsiveUI.drafts.has(key)){if(element.type==='checkbox')element.checked=ResponsiveUI.drafts.get(key);else element.value=ResponsiveUI.drafts.get(key)}}
 }
 for(const wrap of app.querySelectorAll?.('.tablewrap')||[]){
  const headers=[...wrap.querySelectorAll('thead th')].map(th=>th.textContent.trim());
  wrap.dataset.cards=String(['dashboard','devices','alarms'].includes(state.page));wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',L.scrollTable);
  for(const row of wrap.querySelectorAll('tbody tr'))for(const [i,cell]of [...row.children].entries()){cell.dataset.label=headers[i]||L.m637;if(i===(state.page==='devices'?0:1))cell.dataset.primary='true'}
  const hint=document.createElement('p');hint.className='scroll-hint';hint.textContent=L.scrollTable;wrap.before(hint);
 }
 for(const button of app.querySelectorAll?.('.metric-help')||[])button.setAttribute('title',button.getAttribute('aria-label'));
 const active=app.querySelector?.('.fleet-tabs button.active');if(active&&ResponsiveUI.lastTab!==state.eq){ResponsiveUI.lastTab=state.eq;active.scrollIntoView?.({block:'nearest',inline:'nearest'})}
}
function updateViewport(){const view=window.visualViewport;const style=document.documentElement.style;if(style?.setProperty){style.setProperty('--visual-height',(view?.height||window.innerHeight||800)+'px');style.setProperty('--visual-top',(view?.offsetTop||0)+'px')}const button=$('#menuToggle'),nav=$('#nav');if(window.getComputedStyle){const narrow=window.getComputedStyle(button).display!=='none';if(narrow&&!ResponsiveUI.menuOpen&&nav.contains(document.activeElement))button.focus();else if(!narrow&&document.activeElement===button)nav.querySelector('a.active')?.focus()}}
function setMenu(open,focus=true){ResponsiveUI.menuOpen=!!open;const button=$('#menuToggle'),header=$('.product-header');header.dataset.menuOpen=String(open);button.setAttribute('aria-expanded',String(open));button.textContent=open?L.closeMenu:L.menu;if(focus){if(open)$('#nav').querySelector?.('a')?.focus();else button.focus?.()}}
function prepareModalFocus(){const close=$('#modalContent').querySelector?.('[data-action="close"]');close?.setAttribute('aria-label',L.closeDialog);const actions=[...($('#modalContent').querySelectorAll?.('.modalbody > button')||[])];if(actions.length){const footer=document.createElement('div');footer.className='modalactions';for(const action of actions)footer.appendChild(action);$('#modalContent').appendChild(footer)}$('#modalTitle').focus?.()}
function restoreModalFocus(){const previous=ResponsiveUI.returnFocus;if(previous?.isConnected)previous.focus?.();else{const replacement=previous?.dataset?.action?[...document.querySelectorAll('[data-action]')].find(e=>e.dataset.action===previous.dataset.action):null;(replacement||$('#app')).focus?.()}ResponsiveUI.returnFocus=null}
function trendBuckets(field){return state.history?.series?.find(s=>s.field===field)?.segments?.flatMap(s=>s.buckets||[])||[]}
function trendReadout(field,index){const rows=trendBuckets(field),i=Math.max(0,Math.min(rows.length-1,index)),sample=rows[i];if(!sample)return L.m180;const unit=state.history.series.find(s=>s.field===field)?.unit||'';return productTime(sample.from,state.session?.timezone)+' · '+(sample.gap||!Number.isFinite(sample.avg)?L.m627:sample.avg+' '+unit)+' · '+(labels[sample.quality]||sample.quality||L.m016)}
function trendControls(field){const rows=trendBuckets(field);if(!rows.length)return '';const key=state.eq+':'+field,index=Math.min(rows.length-1,ResponsiveUI.trendSelection.get(key)??rows.length-1);return `<details class="trend-inspector" data-trend="${esc(field)}"><summary>${L.inspectTrend}</summary><label>${L.sample}<input type="range" min="0" max="${rows.length-1}" value="${index}" step="1" data-trend-range="${esc(field)}"></label><output aria-live="polite">${esc(trendReadout(field,index))}</output><div class="actions">${btn(L.previousSample,'trendPrevious:'+field)}${btn(L.nextSample,'trendNext:'+field)}</div></details>`}
function selectTrendSample(field,index){const rows=trendBuckets(field);if(!rows.length)return;const selected=Math.max(0,Math.min(rows.length-1,Math.round(index)));ResponsiveUI.trendSelection.set(state.eq+':'+field,selected);for(const panel of document.querySelectorAll('[data-trend]'))if(panel.dataset.trend===field){panel.open=true;panel.querySelector('input').value=selected;panel.querySelector('output').textContent=trendReadout(field,selected)}}
function moveTrendSample(field,direction){const rows=trendBuckets(field),key=state.eq+':'+field;selectTrendSample(field,(ResponsiveUI.trendSelection.get(key)??rows.length-1)+direction)}
function validateDownload(handle){if(!handle||DataProvider.mode!=='simulation'||simActive()?.id!==handle.sessionId)throw Error('SOURCE_MODE_MISMATCH');const s=simActive(),job=s.reports.find(j=>j.id===handle.jobId);simulation.assertData(s,handle.generationId);if(!permission('report.export')||job?.equipRefs.some(id=>!state.devices.some(d=>d.identity.equipRef===id)))throw Error(L.m714);if(!job||job.state!=='succeeded'||!job.bytes||Date.now()>job.expiresAt)throw Error(L.m715);return job}
function prepareReportDownload(job,s){
 const mime={PDF:'application/pdf',XLSX:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',CSV:'text/csv;charset=utf-8'}[job.format],name='UPS-'+job.title+'-'+s.id+'.'+job.format.toLowerCase(),blob=new Blob([job.bytes],{type:mime});
 const file=typeof File==='function'?new File([blob],name,{type:mime}):null,handle={id:'file-'+Date.now()+'-'+ResponsiveUI.downloads.size,jobId:job.id,sessionId:s.id,generationId:s.generationId,file,url:URL.createObjectURL(blob)};ResponsiveUI.downloads.set(handle.id,handle);
 let canShare=false;try{canShare=!!file&&!!window.navigator?.canShare?.({files:[file]})}catch{}
 modal(L.saveReport,`<p>${esc(name)}</p><p>${L.saveReportHelp}</p><a class="download-link" href="${handle.url}" download="${esc(name)}" target="_blank" rel="noopener" data-report-file="${handle.id}">${L.openSaveFile}</a>`+(canShare?btn(L.shareFile,'shareReport:'+handle.id):''));
 setTimeout(()=>{URL.revokeObjectURL(handle.url);ResponsiveUI.downloads.delete(handle.id)},120000);
}
async function shareReport(id){const handle=ResponsiveUI.downloads.get(id);validateDownload(handle);try{await window.navigator.share({files:[handle.file],title:L.saveReport})}catch(error){if(error.name!=='AbortError')throw error}}
function installResponsive(){if(ResponsiveUI.installed)return;ResponsiveUI.installed=true;updateViewport();
 window.addEventListener('resize',updateViewport);window.visualViewport?.addEventListener('resize',updateViewport);window.visualViewport?.addEventListener('scroll',updateViewport);
 $('#menuToggle').addEventListener('click',()=>setMenu(!ResponsiveUI.menuOpen));$('#nav').addEventListener('click',e=>{if(e.target.closest('a')&&ResponsiveUI.menuOpen)setMenu(false)});
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if($('#modal').open){e.preventDefault();$('#modal').close()}else if(ResponsiveUI.menuOpen){e.preventDefault();setMenu(false)}});
 $('#modal').addEventListener('close',restoreModalFocus);$('#modal').addEventListener('cancel',()=>{ResponsiveUI.menuOpen&&setMenu(false,false)});
 document.addEventListener('input',e=>{rememberDraft(e.target);if(e.target.dataset.field)setField(e.target.dataset.field,e.target.type==='checkbox'?e.target.checked:e.target.value);if(e.target.dataset.trendRange)selectTrendSample(e.target.dataset.trendRange,Number(e.target.value))});
 document.addEventListener('click',e=>{const link=e.target.closest?.('[data-report-file]');if(link)try{validateDownload(ResponsiveUI.downloads.get(link.dataset.reportFile))}catch(error){e.preventDefault();toast(englishError(error))}},true);
}
