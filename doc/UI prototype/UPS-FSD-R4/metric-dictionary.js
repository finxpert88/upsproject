'use strict';
const metricDefinitions=[
[L.m065,L.m330,L.m071,L.m331,L.m332,L.m333,L.m334],
[L.m335,L.m336,'—',L.m337,L.m338,L.m333,L.m339],
[L.m340,L.m341,'min',L.m331,L.m342,L.m343,L.m344],
[L.m345,L.m346,'min',L.m347,L.m348,L.m349,L.m350],
[L.m351,L.m352,L.m353,L.m331,L.m354,L.m355,L.m356],
[L.m357,L.m358,L.m359,L.m360,L.m361,L.m333,L.m362],
[L.m363,L.m364,'V',L.m365,L.m366,L.m367,L.m368],
[L.m369,L.m370,'mΩ / %',L.m360,L.m371,L.m372,L.m373],
[L.m209,L.m374,'°C / °F',L.m360,L.m375,'°F=°C×1.8+32',L.m376],
[L.m377,L.m378,'A',L.m379,L.m380,L.m381,L.m382],
[L.m383,L.m384,'%',L.m360,L.m385,L.m386,L.m387],
[L.m388,L.m389,'%',L.m360,L.m390,L.m391,L.m392],
[L.m393,L.m394,L.m395,L.m396,L.m397,L.m398,L.m399],
[L.m400,L.m401,'kW / kVA',L.m402,L.m403,L.m404,L.m405],
[L.m231,L.m406,'%',L.m407,L.m408,L.m409,L.m410],
[L.m411,L.m412,'%',L.m331,L.m413,L.m414,L.m415],
[L.m416,L.m417,'V / Hz',L.m418,L.m419,L.m420,L.m421],
[L.m422,L.m423,'%',L.m424,L.m425,'THD-F=√Σ(Xn²,n≥2)/X1×100%',L.m426],
[L.m427,L.m428,L.m071,L.m429,L.m430,L.m333,L.m431],
[L.m238,L.m432,L.m071,L.m433,L.m434,L.m333,L.m435],
[L.m239,L.m436,'%',L.m437,L.m438,L.m439,L.m440],
[L.m242,L.m441,'°C / °F',L.m442,L.m443,'°F=°C×1.8+32',L.m444],
[L.m243,L.m445,'%RH',L.m446,L.m447,L.m333,L.m448],
[L.m449,L.m450,L.m451,L.m452,L.m453,L.m454,L.m455],
[L.m276,L.m456,L.m457,L.m458,L.m459,L.m460,L.m461],
[L.m249,L.m462,L.m071,L.m463,L.m464,L.m333,L.m465],
[L.m466,L.m467,L.m457,L.m468,L.m469,L.m470,L.m471],
[L.m250,L.m472,'ms',L.m473,L.m474,L.m475,L.m476],
[L.m477,L.m478,L.m479,L.m480,L.m481,L.m333,L.m482],
[L.m256,L.m483,L.m395,L.m484,L.m485,L.m486,L.m487],
[L.m075,L.m488,L.m489,L.m490,L.m491,L.m492,L.m493],
[L.m494,L.m495,L.m496,L.m497,L.m498,L.m499,L.m500]
].map((x,i)=>({id:'KPI-'+String(i+1).padStart(2,'0'),name:x[0],meaning:x[1],unit:x[2],asset:x[3],basis:x[4],formula:x[5],threshold:x[6],dictionaryVersion:'R4-1.0'}));

function metricExplain(ids){const i=identity();const items=metricDefinitions.filter(x=>ids.split(' ').includes(x.id));modal(L.m501,items.map(x=>'<section class="dictionary-entry"><h3>'+x.id+' · '+x.name+'</h3>'+kv([[L.m502,x.meaning],[L.m503,x.unit+' / '+x.asset],[L.m504,esc(i?.name||L.m189)],[L.m505,simActive()?esc(i?.equipRef||L.m506)+' / '+esc(simActive().id)+L.m507:L.m508],[L.m509,x.basis],[L.m510,simActive()?productTime(simActive().virtualTime,simActive().timezone)+L.m511:L.m512],[L.m513,x.formula],[L.m514,x.threshold],[L.m515,simActive()?L.m516+esc(simActive().scenarioId)+' v1.0 / seed '+simActive().seed+L.m517:L.m518],[L.m519,simActive()?esc(state.snapshot?.communication||L.m004)+L.m520:L.m521]])+'</section>').join(''))}
function decorateDictionary(){document.querySelectorAll('[data-kpi]').forEach(el=>{if(!el.dataset.kpi||el.querySelector('.metric-help'))return;const b=document.createElement('button');b.type='button';b.className='metric-help';b.textContent='ⓘ';b.dataset.action='dictionary:'+el.dataset.kpi;b.setAttribute('aria-label',L.m522+el.dataset.kpi);el.appendChild(b)})}
