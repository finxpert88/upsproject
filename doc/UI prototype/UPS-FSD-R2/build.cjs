const fs=require('fs'),path=require('path');
const root=__dirname;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8')
 .replace('<link rel="stylesheet" href="styles.css">',()=>'<style>'+fs.readFileSync(path.join(root,'styles.css'),'utf8')+'</style>')
 .replace('<script src="app.js"></script>',()=>'<script>'+fs.readFileSync(path.join(root,'app.js'),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
fs.writeFileSync(path.join(root,'UPS-Fleet-Prototype.html'),html);
console.log('Built UPS-Fleet-Prototype.html: '+Buffer.byteLength(html)+' bytes');
