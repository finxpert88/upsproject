const fs=require('fs'),path=require('path');const root=__dirname;let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,name)=>'<style>'+fs.readFileSync(path.join(root,name),'utf8')+'</style>');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,name)=>'<script>'+fs.readFileSync(path.join(root,name),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
fs.writeFileSync(path.join(root,'UPS-Fleet-Static.html'),html);
console.log('Built UPS-Fleet-Static.html');
