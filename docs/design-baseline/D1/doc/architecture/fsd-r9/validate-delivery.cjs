const fs=require('fs'),path=require('path'),assert=require('assert');
const root=__dirname; const all=[];
for(const file of ['equipment-objects.trio','business-objects.trio']){
 const records=fs.readFileSync(path.join(root,file),'utf8').split(/^---\s*$/m).map(block=>{
  const rec={};for(const line of block.split(/\r?\n/).filter(x=>x.trim()&&!x.startsWith('//'))){
   const m=line.match(/^([a-z][a-zA-Z0-9]*)(?:: (.*))?$/);assert(m,'Invalid tag line: '+line);assert(!(m[1] in rec),'Duplicate tag '+m[1]);
   const v=m[2];rec[m[1]]=v===undefined?{marker:true}:v.startsWith('@')?{ref:v.slice(1)}:JSON.parse(v);
  }return rec;
 });all.push(...records);
}
const ids=new Set(all.map(r=>r.id.ref));assert.equal(ids.size,all.length);
for(const r of all){assert(r.upsTemplate);for(const [k,v] of Object.entries(r)){if(v?.ref)assert(ids.has(v.ref),`Dangling Ref ${k}: ${v.ref}`);if(k.endsWith('Json'))JSON.parse(v);}assert(!('curVal' in r));assert(!('writable' in r));}
const byId=new Map(all.map(r=>[r.id.ref,r]));
require('./record-codec.cjs').validateTemplateRefs(all);
// Reproduce the reviewer's counterexample: top-level refs remapped but payload refs stale.
const counterexample=structuredClone(all);
for(const rec of counterexample)for(const value of Object.values(rec))if(value?.ref)value.ref='remapped-'+value.ref;
assert.throws(()=>require('./record-codec.cjs').validateTemplateRefs(counterexample),/DANGLING_REF/);
for(const r of all.filter(r=>r.point)){assert(byId.get(r.siteRef.ref).site);assert(byId.get(r.equipRef.ref).equip);if(r.kind==='Number')assert(r.unit);}
for(const r of all.filter(r=>r.upsRecordType==='PointMapping')){assert.equal(byId.get(r.upsPointRef.ref).upsLogicalField,r.upsLogicalField);assert.equal(byId.get(r.upsPointRef.ref).equipRef.ref,r.upsTargetObjectRef.ref);}
const types=fs.readFileSync(path.join(root,'contracts.ts'),'utf8');const ops=JSON.parse(fs.readFileSync(path.join(root,'operations.json'),'utf8'));
assert.equal(ops.length,31);for(const o of ops)assert(types.includes('"'+o.id+'":'),o.id);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'record-manifest.json'),'utf8'));assert.deepStrictEqual(all,[...manifest.devices,...manifest.business]);
const approved=fs.readFileSync(path.resolve(root,'../../planning/UPS-Fleet-FIN-POD-FSD-v0.1.md'),'utf8');
const extracted='// Extracted verbatim from approved FSD revision 9. Project types, not FIN SDK.\n'+[...approved.matchAll(/```typescript\r?\n([\s\S]*?)```/g)].map(x=>x[1]).join('\n')+'\n';
assert.equal(types,extracted,'Approved public contract drift');
assert.equal(require('crypto').createHash('sha256').update(approved).digest('hex'),manifest.baseline);
const result={passed:true,records:all.length,uniqueIds:ids.size,operations:ops.length,checks:['tag syntax subset','unique IDs and tags','top-level and declared nested Ref closure','reviewer missed-nested-remap negative rejected','point site/equipment parents','mapping target consistency','JSON payload parse','31 operations in approved FSD contract','approved contract extraction unchanged','no writable or fabricated curVal','manifest roundtrip'],scope:'Local static subset validation; not full Zinc parser or FIN runtime validation'};
fs.writeFileSync(path.join(root,'local-validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
