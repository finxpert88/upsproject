const fs=require('fs'),path=require('path'),crypto=require('crypto');const root=__dirname;
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const name of ['styles.css','dashboard.css'])html=html.replace(`<link rel="stylesheet" href="${name}">`,()=>'<style>'+fs.readFileSync(path.join(root,name),'utf8')+'</style>');
for(const name of ['app.js','dashboard.js'])html=html.replace(`<script src="${name}"></script>`,()=>'<script>'+fs.readFileSync(path.join(root,name),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
fs.writeFileSync(path.join(root,'UPS-Fleet-DEMO.html'),html);
const fsdPath=path.resolve(root,'../../planning/UPS-Fleet-FIN-POD-FSD-v0.1.md'),fsd=fs.readFileSync(fsdPath,'utf8');
fs.writeFileSync(path.join(root,'baseline.json'),JSON.stringify({document:fsdPath,revision:fsd.split('\n')[2].trim(),sha256:crypto.createHash('sha256').update(fsd).digest('hex'),artifact:'UPS-Fleet-DEMO.html',sourceVisualBaseline:'../AI-CES-IoT-UPS/index.html',schemaVersion:'1.2',fixtures:['DMO-FULL','DMO-RISK','DMO-MISSING'],visualAcceptance:'UI-01..12 pending; browser local-file access previously blocked; no bypass attempted',runtime:'offline static demo, no FIN connection'},null,2));
console.log('Built UPS-Fleet-DEMO.html: '+Buffer.byteLength(html)+' bytes');
