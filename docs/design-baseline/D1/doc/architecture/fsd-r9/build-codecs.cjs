// Usage: node build-codecs.cjs /path/to/typescript/lib/typescript.js
const ts=require(process.argv[2]),fs=require('fs'),path=require('path');
const file=path.join(__dirname,'contracts.ts');const program=ts.createProgram([file],{strict:true,noEmit:true});const checker=program.getTypeChecker(),source=program.getSourceFile(file);
const roots=['Enrollment','Rule','Capability','ReportJob','Plan'];
function schema(t,depth=0){
 if(depth>30)throw Error('recursive schema');
 if(t.flags&ts.TypeFlags.StringLiteral)return {const:t.value};
 if(t.flags&ts.TypeFlags.NumberLiteral)return {const:t.value};
 if(t.flags&ts.TypeFlags.BooleanLiteral)return {const:t.intrinsicName==='true'};
 if(t.flags&ts.TypeFlags.Null)return {type:'null'};
 if(t.isUnion())return {anyOf:t.types.map(x=>schema(x,depth+1))};
 if(t.flags&ts.TypeFlags.String)return {type:'string'};
 if(t.flags&ts.TypeFlags.Number)return {type:'number'};
 if(t.flags&ts.TypeFlags.Boolean)return {type:'boolean'};
 if(checker.isArrayType(t))return {type:'array',items:schema(checker.getTypeArguments(t)[0],depth+1)};
 const props={},required=[];for(const s of checker.getPropertiesOfType(t)){
  const optional=!!(s.flags&ts.SymbolFlags.Optional);let st=checker.getTypeOfSymbolAtLocation(s,source);
  if(optional&&st.isUnion())st=st.types.filter(x=>!(x.flags&ts.TypeFlags.Undefined));
  props[s.name]=Array.isArray(st)?{anyOf:st.map(x=>schema(x,depth+1))}:schema(st,depth+1);
  const declared=s.valueDeclaration?.type?.getText(source)||'';
  if(/\bTs\b/.test(declared))props[s.name].semanticFormat='date-time';
  if(/\bDateOnly\b/.test(declared))props[s.name].semanticFormat='date';
  if(!optional)required.push(s.name);
 }
 if(!Object.keys(props).length)throw Error('Unsupported type '+checker.typeToString(t));
 return {type:'object',properties:props,required,additionalProperties:false};
}
const schemas={};for(const node of source.statements)if(ts.isTypeAliasDeclaration(node)&&roots.includes(node.name.text))schemas[node.name.text]=schema(checker.getTypeAtLocation(node));
const indexes={Enrollment:{equipRef:'equipRef',siteRef:'siteRef',upsCommissioningStatus:'commissioningStatus'},Rule:{equipRef:'equipRef',upsRuleId:'ruleId',upsRuleVersion:'ruleVersion',upsEnabled:'enabled'},Capability:{upsTargetObjectRef:'objectRef',upsStatus:'status'},ReportJob:{upsJobId:'jobId',upsOwnerId:'ownerId',upsState:'state',upsSourceMode:'context.sourceMode'},Plan:{equipRef:'equipRef',upsTargetObjectRef:'targetObjectRef',upsPlanId:'planId',upsDueDate:'dueDate'}};
fs.writeFileSync(path.join(__dirname,'record-codecs.json'),JSON.stringify({version:'A2.2',wireSchema:'2.0',layout:{id:'Folio Ref',upsRecordType:'codec name',upsSchemaVersion:'2.0',upsPayloadJson:'strict canonical wire object; required null retained'},trustedEnvelope:{required:['projectId','mode'],simulationRequired:['sessionId','generationId'],tags:{projectId:'upsProjectId',mode:'upsSourceMode',sessionId:'upsSimulationSessionId',generationId:'upsGenerationId'},source:'server session and data router; never supplied by client DTO'},semanticRefFields:['equipRef','siteRef','objectRef','targetObjectRef','pointRef','healthScorePointRef','sensorEquipRef','evidenceRef','methodologyRef','sourceRef','alarmSourceRef','comparableEvidenceRef'],semanticRefArrays:['equipRefs','pointRefs','evidenceRefs','outlookRecordRefs','targetRefs','inputRefs','authorizedSiteRefs'],indexes,schemas},null,2));
console.log('Generated codec schemas: '+roots.join(', '));
