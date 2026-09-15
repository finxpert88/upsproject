const fs=require('fs'),path=require('path');
const ts=require('C:/Users/Copperfield/AppData/Local/pnpm/store/v11/links/@/typescript/5.9.3/b9492fe1ffae7c6aea44eb8f66485fd64ddd67d3272a4a99c8ef4378b72f2f14/node_modules/typescript/lib/typescript.js');
const base=path.resolve(__dirname,'../fsd-r9');
const ops=JSON.parse(fs.readFileSync(path.join(base,'operations.json')));
const source=fs.readFileSync(path.join(base,'contracts.ts'),'utf8');
function check(useId){
 const file=path.join(__dirname,'virtual-contract-probe.ts').replace(/\\/g,'/');
 const code=source+'\n'+ops.flatMap((o,i)=>['request','response'].map(k=>`type Probe${i}${k} = Contracts['${useId?o.id:o.name}']['${k}'];`)).join('\n');
 const options={noEmit:true,strict:true,target:ts.ScriptTarget.ES2020,lib:['lib.es2020.d.ts']};
 const host=ts.createCompilerHost(options),old=host.getSourceFile;
 host.getSourceFile=(f,...args)=>f===file?ts.createSourceFile(f,code,ts.ScriptTarget.ES2020,true):old(f,...args);
 const program=ts.createProgram([file],options,host);
 return ts.getPreEmitDiagnostics(program).map(d=>({code:d.code,message:ts.flattenDiagnosticMessageText(d.messageText,' ')}));
}
const incorrect=check(false),correct=check(true);
if(incorrect.length!==62||correct.length!==0)throw Error(JSON.stringify({incorrect,correct}));
fs.writeFileSync(path.join(__dirname,'contract-key-verification.json'),JSON.stringify({compiler:ts.version,passed:true,incorrectMethodKeys:{errors:incorrect},correctOpKeys:{errors:correct},scope:'实际TypeScript编译器检查31项索引；非Fantom或FIN验证'},null,2));
console.log('TypeScript: 62 old request/response key errors reproduced; 62 corrected OP indices compile with zero diagnostics.');
