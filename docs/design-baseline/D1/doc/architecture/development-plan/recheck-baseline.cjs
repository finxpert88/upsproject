// Offline reference checks; redirect legacy report writes into this plan directory.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const base=path.resolve(__dirname,'../fsd-r9'), blueprint=path.resolve(__dirname,'../application-blueprint');
const report={scope:'离线设计参考模型核验，不是Fantom编译或FIN运行',checks:[]};
const originalWrite=fs.writeFileSync;
fs.writeFileSync=(file,...args)=>{
 const p=path.resolve(String(file));
 if(path.dirname(p)===base)return originalWrite(path.join(__dirname,'rerun-'+path.basename(p)),...args);
 if(path.dirname(p)!==__dirname)throw Error('Unexpected output: '+p);
 return originalWrite(file,...args);
};
for(const name of ['validate-delivery.cjs','test-revision-a2.cjs']){
 try{require(path.join(base,name));report.checks.push({name,passed:true});}
 catch(e){report.checks.push({name,passed:false,error:e.message});}
}
const contracts=fs.readFileSync(path.join(base,'contracts.ts'),'utf8');
const fsd=fs.readFileSync(path.resolve(base,'../../planning/UPS-Fleet-FIN-POD-FSD-v0.1.md'),'utf8');
const extracted='// Extracted verbatim from approved FSD revision 9. Project types, not FIN SDK.\n'+[...fsd.matchAll(/```typescript\r?\n([\s\S]*?)```/g)].map(x=>x[1]).join('\n')+'\n';
report.publicContractBytesUnchanged=contracts===extracted;
report.publicContractEqualAfterCrLfNormalization=contracts.replace(/\r\n/g,'\n')===extracted.replace(/\r\n/g,'\n');
report.lineEndingNote='原脚本构造LF头和拼接符，实际契约文件为CRLF；精确字节比较失败，统一CRLF为LF后文本一致。不得声称字节一致。';
report.currentFsdHash=crypto.createHash('sha256').update(fsd).digest('hex');
report.originalFsdHash=JSON.parse(fs.readFileSync(path.join(base,'record-manifest.json'))).baseline;
report.referenceKeyMismatch=JSON.parse(fs.readFileSync(path.join(blueprint,'operation-ownership.json'))).filter(o=>!contracts.includes('"'+o.name+'":')).map(o=>({operation:o.operation,incorrect:o.requestType,correct:`Contracts['${o.operation}']['request']`}));
fs.writeFileSync(path.join(__dirname,'baseline-recheck.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:report.checks.map(x=>({name:x.name,passed:x.passed})),publicContractBytesUnchanged:report.publicContractBytesUnchanged,typeReferenceMismatches:report.referenceKeyMismatch.length}));
