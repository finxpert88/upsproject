// Documentation renderer only; uses bundled Graphviz and Sharp, not application code.
const fs = require('fs');
const path = require('path');
const modules = process.env.BLUEPRINT_NODE_MODULES || 'C:/Users/Copperfield/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {instance} = require(path.join(modules, '@viz-js/viz/dist/viz.cjs'));
const sharp = require(path.join(modules, 'sharp'));
const models = JSON.parse(fs.readFileSync(path.join(__dirname, 'diagram-models.json')));
const q = JSON.stringify;
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
(async () => {
  const viz = await instance();
  for (const [name, model] of Object.entries(models)) {
    const lines = ['digraph G {', 'graph [rankdir=TB, bgcolor="#f6f8fc", pad="0.35", nodesep="0.35", ranksep="0.65", fontname="Arial", label='+q(name.replaceAll('-',' ').toUpperCase())+', labelloc=t, fontsize=22];', 'node [shape=box, style="rounded,filled", fillcolor="#ffffff", color="#50647c", fontname="Arial", fontsize=12, margin="0.16,0.12"];', 'edge [color="#61748c", fontname="Arial", fontsize=10, arrowsize=0.7];'];
    for (const n of model.nodes) {
      if (model.kind === 'uml') {
        const title = (n.interface ? '&lt;&lt;mixin&gt;&gt;<BR/>' : '') + esc(n.label);
        const methods = n.methods.map(m => '+ '+esc(m)).join('<BR ALIGN="LEFT"/>');
        lines.push(q(n.id)+' [shape=plain, label=<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="9" COLOR="#50647c" BGCOLOR="white"><TR><TD BGCOLOR="#dce9f8"><B>'+title+'</B></TD></TR><HR/><TR><TD ALIGN="LEFT">'+methods+'</TD></TR></TABLE>>];');
      } else lines.push(q(n.id)+' [label='+q(n.label)+'];');
    }
    for (const [a,b,kind] of model.edges) lines.push(q(a)+' -> '+q(b)+' ['+(model.kind==='uml' ? 'style=dashed, arrowhead='+ (kind==='realizes' ? 'empty':'vee') : 'label='+q(kind))+'];');
    lines.push('}');
    const dot=lines.join('\n');
    fs.writeFileSync(path.join(__dirname,name+'.dot'),dot);
    const svg=viz.renderString(dot,{format:'svg',engine:'dot'});
    fs.writeFileSync(path.join(__dirname,name+'.svg'),svg);
    await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,name+'.png'));
    console.log(name+': rendered');
  }
})().catch(e=>{console.error(e);process.exit(1)});
