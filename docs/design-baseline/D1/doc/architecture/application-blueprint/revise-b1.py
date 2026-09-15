"""B1.1 documentation-only review disposition and structural verification."""
from pathlib import Path
import json, re, hashlib, subprocess

P=Path(__file__).resolve().parent
ROOT=P.parents[2]
assert subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()=='feature/fsd-r4-static-demo'
def read(f): return json.loads((P/f).read_text(encoding='utf-8'))
def write(f,v): (P/f).write_text(v if isinstance(v,str) else json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def section(file,heading,body):
    text=(P/file).read_text(encoding='utf-8')
    text=text.split('\n'+heading)[0].rstrip()
    write(file,text+'\n\n'+heading+'\n\n'+body+'\n')

baseline=read('baseline.json')
for f in baseline['files']:
    assert hashlib.sha256((ROOT/f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
classes=read('backend-classes.json'); ui=read('frontend-files.json'); routes=read('routes.json')
ops=json.loads((ROOT/'doc/architecture/fsd-r9/operations.json').read_text(encoding='utf-8-sig'))
opmap={o['id']:o for o in ops}; cmap={c['name']:c for c in classes}
pages={Path(f['file']).stem:f for f in ui if '/pages/' in f['file']}
def ids(values): return [f'OP-{n:02}' for n in values]
# Reads permitted on entry are distinct from optional reads and explicit user actions.
readSets={
 'DashboardPage':([2,3],[4,22],[]), 'EquipmentPage':([2],[],[]),
 'HistoryPage':([4],[22],[]), 'AlarmPage':([5],[],[6]),
 'ReportPage':([16],[],[15,18]), 'ReportDetailPage':([16],[],[17,18]),
 'EngineeringPage':([8],[],[8,9,10,11]), 'CommissioningPage':([8,12],[],[14]),
 'NotificationPage':([20],[8],[8,9,10,19,21,31]), 'DiagnosticsPage':([12],[],[]),
 'AuditPage':([13],[],[]), 'SimulationPage':([30],[],[23,24,25,26,27,28,29])}
for page,(entry,optional,actions) in readSets.items():
    pages[page]['operations']=sorted(set(ids(entry+optional+actions)+(['OP-07'] if actions else [])))
for r in routes:
    entry,optional,actions=readSets[r['page']]
    mode='simulation' if r['context'].startswith('simulation') else 'live'
    legal=lambda values:[x for x in ids(values) if mode in opmap[x]['allowedContexts']]
    r['entryReads']=legal(entry);r['optionalReads']=legal(optional);r['actions']=legal(actions)
    r['reconciliationReads']=['OP-07'] if r['actions'] else []
    r['operations']=sorted(set(r['entryReads']+r['optionalReads']+r['actions']+r['reconciliationReads']))
    r['entryPolicy']={'require':'authenticated valid source context plus at least one authorized entry read','reads':'Only invoke individually authorized reads; partial sections may remain unavailable','actions':'Do not require action permissions to enter; authorize every action independently on server','mixedOperation':'OP-08 entry is get only; save is an explicit action with draft/entity CAS','rootScope':'Only OP-23 create and OP-30 list at simulation root; all other actions and OP-07 require the selected/original operation context'}
    r['guard']='Entry read authorization is independent of optional reads, actions and original-operation reconciliation. Preserve approved per-mode permissions and object scope for each call.'
    r['operationGuards']={x:{'permissionByMode':opmap[x]['permissionByMode'],'scopeByMode':opmap[x]['scopeByMode'],'rootSimulationAllowed':opmap[x].get('rootSimulationAllowed',False)} for x in r['operations']}
write('routes.json',routes)

# Existing view behavior is given explicit event identifiers for referential validation.
events={'DashboardPage':['render'],'EngineeringWizard':['patch','save','validate','publish'],'ThemeStore':['set'],'ResponsiveShell':['resize']}
for name,eventNames in events.items():
    target=next(f for f in ui if Path(f['file']).stem==name)
    target['designEvents']=eventNames
write('frontend-files.json',ui)
front=(P/'frontend-design.md').read_text(encoding='utf-8')
for f in ui:
    pattern=r'^\| `'+re.escape(f['file'])+r'` \|.*$'
    replacement=f"| `{f['file']}` | {f['purpose']} | {', '.join(f['operations']) or 'None directly'} |"
    front=re.sub(pattern,lambda _:replacement,front,flags=re.M)
write('frontend-design.md',front)
entries=[
 ['TelemetryService.pollBatch'],['QualityEvaluator.evaluate'],['CommunicationResolver.resolve'],
 ['InventoryService.equipmentList'],['DashboardPage.render'],['HistoryService.querySegments'],
 ['AlarmService.alarmListDetail'],['EngineeringWizard.save','EngineeringWizard.validate','EngineeringWizard.publish'],
 ['RuleEngine.advance'],['RuleEvaluator.evaluate'],['AlarmSynchronizer.dispatchNext','AlarmSynchronizer.reconcileUnknown'],
 ['AcknowledgementCoordinator.execute','AcknowledgementCoordinator.reconcile'],['AuditRepository.append'],
 ['ConfigurationService.configGetSaveDraft','ConfigurationService.configValidate'],['PublicationCoordinator.activate'],
 ['ConfigurationGuard.checkActiveOccurrences'],['Lifecycle.start','Lifecycle.stop'],['WorkScheduler.admit'],
 ['MigrationRunner.inspectCompatibility','MigrationRunner.planMigration','MigrationRunner.resumeMigration'],
 ['ReportWorker.execute'],['NotificationWorker.deliver'],['ThemeStore.set'],['SimulationEngine.advanceEvents'],['ResponsiveShell.resize']]
acceptance=[['FT-36'],['FT-34'],['FT-34'],['FT-32'],['UI-01','UI-12'],['FT-31'],['FT-35'],['FT-29','FT-30'],['FT-24','FT-33'],['FT-27','FT-34'],['FT-25','FT-26'],['FT-35'],['FT-29'],['FT-29'],['FT-22','FT-23'],['FT-27','FT-28'],['FT-22','FT-24'],['FT-36'],['FT-22','FT-23'],['NEW-03','NEW-06','R7-08'],['NEW-07','NEW-10','R7-09'],['NEW-11','NEW-12'],['SIM-01','SIM-08'],['UI-01','UI-12']]
spec=read('spec-coverage.json')
for row,entry,tests in zip(spec,entries,acceptance):
    row['implementationEntry']=entry;row['acceptanceReferences']=tests
    row['acceptanceScope']='Selected existing related regression anchors, not exhaustive coverage or new acceptance definitions; retain complete referenced FSD section and RTM.'
write('spec-coverage.json',spec)

# Static dependencies remain unchanged; these direct instance registrations explain runtime composition.
assembly={'revision':'B1.1','owner':'Lifecycle.start','mechanism':'Explicit instance composition and bounded task callbacks; no service locator, bus or generic factory',
 'operationDispatch':[{'operation':o['id'],'dispatcher':'RequestFacade.dispatch','target':o['owner']+'.'+o['name'],'binding':'Direct owner instance supplied at project startup'} for o in ops],
 'taskRegistrations':[
 {'id':'live-observations','registrar':'Lifecycle.start','scheduler':'WorkScheduler.admit','callbacks':['TelemetryService.pollBatch','RuleEngine.advance'],'scope':'project live','order':'Normalize observation batch, then feed sample/quality/calendar event with current epoch to shared RuleEngine'},
 {'id':'rule-command-outbox','registrar':'Lifecycle.start','scheduler':'WorkScheduler.admit','callbacks':['AlarmSynchronizer.dispatchNext','AlarmSynchronizer.reconcileUnknown'],'scope':'project + occurrence chain','order':'Unknown reconciles before any dependent dispatch'},
 {'id':'reports','registrar':'ReportService.reportCreate','scheduler':'WorkScheduler.admit','callbacks':['ReportWorker.execute'],'scope':'job + source context','order':'Persist authorized job first; two-worker bound'},
 {'id':'notifications','registrar':'Lifecycle.start','scheduler':'WorkScheduler.admit','callbacks':['NotificationWorker.deliver','NotificationWorker.reconcileUnknown'],'scope':'channel/source context','order':'Persist outbox then claim atomic gate permit; explicit OP-21 exception documented separately'},
 {'id':'simulation','registrar':'SimulationService.simulationControl','scheduler':'WorkScheduler.admit','callbacks':['SimulationEngine.advanceEvents'],'scope':'session/generation/worker fence','order':'Management operation selects bounded work; direct step/generate use same serialization and engine'}],
 'shutdown':{'owner':'Lifecycle.stop','callbacks':['WorkScheduler.cancel','WorkScheduler.drain'],'rule':'Reject new work, fence active generations, drain/cancel and preserve recoverable checkpoints'},
 'diagramScope':'UML depicts selected static dependencies and realization. Runtime dispatch/task-registration edges are in this table, not drawn into the class sheets.'}
write('composition.json',assembly)

section('frontend-design.md','## B1.1 route authorization correction',
'''`routes.json` is authoritative for entryReads, optionalReads, actions and reconciliationReads. The operations union is coverage metadata, never an AND permission gate. Each call keeps the approved operation's mode permission and referenced-object scope. OP-08 get and save are distinct UI intents even though the approved API combines them.

Read-only alarm/report users may enter with the corresponding read permission while ack/export/cancel controls remain unavailable. Dashboard history and metric help are optional, separately authorized reads. Engineering entry still needs the approved OP-08 config.edit permission: schema 2.0 does not provide a new config-view permission. Commissioning renders only OP-08/12 sections the account may read; OP-14 acceptance has its own gate. Notification delivery viewing does not require configuration, test or pause permission. Simulation notification mode removes OP-08/09/10/19/31.

Every mutation-capable page uses the existing shared OperationProgress -> alarmApi.js OP-07 -> OperationRepository.operationStatus path for an original operation. The API-family filename is organizational, not an alarm-only access restriction. OP-07 checks original action/mode/current scope and never requires an unrelated live permission. Do not block read-only page entry on OP-07. Old generation cleanup exceptions retain the approved original-intent checks.

Simulation root permits list/create only. Selecting a session enables appropriately scoped management controls; an original-operation reconciliation uses that operation's bound context. No mutation is implicitly issued on navigation.

| Page | Entry reads | Optional reads | Explicit actions | Reconciliation |
|---|---|---|---|---|
'''+ '\n'.join(f"| {name} | {', '.join(ids(e))} | {', '.join(ids(o)) or 'None'} | {', '.join(ids(a)) or 'None'} | {'OP-07 original operation' if a else 'None'} |" for name,(e,o,a) in readSets.items())+'\n\nThis page-level table is the live/combined capability inventory; route entries apply mode-specific pruning.')
section('traceability.md','## B1.1 actual implementation-entry mapping',
'''approvedEntry preserves the original approved interface list verbatim. implementationEntry identifies the existing B1 class method or documented view event that implements that responsibility; it does not rename the approved source or introduce a new class. View render/set/resize and wizard events are explicit design identifiers in frontend-files.json, not implemented code. Acceptance IDs below are selected links; all existing RTM cases remain applicable.

| SF | Approved conceptual entry | Actual B1 implementation entry | Related acceptance |
|---|---|---|---|
'''+ '\n'.join(f"| {s['id']} | {s['approvedEntry']} | {', '.join(s['implementationEntry'])} | {', '.join(s['acceptanceReferences'])} |" for s in spec))
section('backend-design.md','## B1.1 composition and incremental implementation',
'''backend-classes.json lists static class dependencies. composition.json additionally specifies all 31 direct RequestFacade owner bindings and bounded runtime task/callback registrations. Lifecycle.start owns assembly; WorkScheduler receives callbacks rather than statically depending on domain services. Every registration names existing design methods. UML intentionally omits these runtime registration edges.

| Registration | Registrar | Callbacks | Scope |
|---|---|---|---|
'''+ '\n'.join(f"| {t['id']} | {t['registrar']} | {', '.join(t['callbacks'])} | {t['scope']} |" for t in assembly['taskRegistrations'])+'''

The 39 behavior types and 79 frontend source entries are an incremental responsibility inventory, not a requirement to create all empty classes/files at once. Implement only the approved increment and its concrete dependencies. Keep the existing RuleState completeness/currentOccurrenceId mapping handoff unchanged.

Notification uncertainty: automatic/blind retry remains prohibited. The approved OP-21 permits an authorized administrator to explicitly request a resend with acceptDuplicateRisk=true under the approved state, mode, object scope and audit checks. This is not automatic reconciliation and must disclose possible duplicate delivery. Simulation retry remains local-only. Neither page admission nor a worker restart grants this override.
''')
section('component-contracts.md','## B1.1 explicit event identifiers and notification override',
'''DashboardPage.render denotes existing snapshot-to-view rendering; EngineeringWizard.patch/save/validate/publish denote its documented events; ThemeStore.set and ResponsiveShell.resize denote existing theme/viewport state handling. These identifiers allow structural SF linkage without adding classes or behavior.

DeliveryTable retry delegates to NotificationPage. If the approved OP-21 policy allows an authorized administrator to resend an uncertain delivery, show a concrete duplicate-risk confirmation and send acceptDuplicateRisk=true only after that explicit decision. An ordinary retry or restart must not silently set this field. Mode and server authorization remain unchanged.''')
section('planned-verification-files.md','## B1.1 additional cases within existing planned files',
'''- routes.spec.js: read-only alarm/report account enters via OP-05/16 without ack/export/manage; those actions are unavailable and direct API attempts are denied. Optional history/definition/config panels do not block authorized base-page entry.
- routes.spec.js: all page actions and entry/optional reads are covered by every applicable route after mode pruning; simulation notification exposes only delivery/local retry/reconciliation. Root simulation navigation invokes list only, not session mutations.
- operation-client.spec.js: lost acknowledgement/publication/report/simulation response can reach the shared OP-07 original-operation path; no replacement operationId or unrelated permission is required. Current authorization, ownership and cleanup exceptions still apply.
- NotificationRecoveryTest.fan: blind resend rejected; explicitly authorized OP-21 acceptDuplicateRisk=true follows the approved state/mode/audit policy, including local-only simulation.
- Structural documentation checks: all SF implementation entries and 31 dispatch targets resolve; task callbacks/registrars resolve; approvedEntry remains unchanged. These checks do not execute the future product tests.
''')
readme=(P/'README.md').read_text(encoding='utf-8').replace('backend-classes.json is the complete responsibility/dependency inventory','backend-classes.json lists static responsibilities/dependencies; composition.json supplies direct dispatch and runtime callback bindings')
write('README.md',readme)
section('README.md','## B1.1 review disposition',
'''B1-01/02/03 have local design corrections pending independent re-review. See [disposition](review-disposition-b1.1.md), [composition](composition.json) and [verification](validation-b1.1.json). The inventory is for incremental implementation; do not create all empty classes at once. Original B1 baseline/validation evidence is retained. No business implementation, branch change or public schema change.''')

def methodExists(entry):
    owner,method=entry.rsplit('.',1)
    if owner in cmap:
        return method in [re.split(r'[:; <]',m)[0] for m in cmap[owner]['designMethods']]
    return any(Path(f['file']).stem==owner and method in f.get('designEvents',[]) for f in ui)
assert all(methodExists(e) for s in spec for e in s['implementationEntry'])
assert all(methodExists(d['dispatcher']) and methodExists(d['target']) for d in assembly['operationDispatch'])
assert all(methodExists(t['registrar']) and methodExists(t['scheduler']) and all(methodExists(c) for c in t['callbacks']) for t in assembly['taskRegistrations'])
assert all(methodExists(c) for c in assembly['shutdown']['callbacks'])
for r in routes:
    mode='simulation' if r['context'].startswith('simulation') else 'live'
    expected={x for x in pages[r['page']]['operations'] if mode in opmap[x]['allowedContexts']}
    assert expected==set(r['operations']),(r['id'],expected,set(r['operations']))
    assert set(r['operations'])==set(r['entryReads']+r['optionalReads']+r['actions']+r['reconciliationReads'])
    assert all(mode in opmap[o]['allowedContexts'] for o in r['operations'])
approved={}
for line in (ROOT/'doc/architecture/fsd-r9/interface-implementation-list.md').read_text(encoding='utf-8-sig').splitlines():
    if re.match(r'^\|SF-\d+',line):
        cols=line.strip('|').split('|'); approved[cols[0]]=cols[4]
assert all(s['approvedEntry']==approved[s['id']] for s in spec)
assert len(classes)==39 and len(ui)==79 and len(routes)==22 and len(spec)==24 and len(assembly['operationDispatch'])==31
assert not methodExists('DashboardPresenter.render')
assert not methodExists('SimulationService.advanceEvents')
alarmRoute=next(r for r in routes if r['path']=='#/live/alarms')
assert set(alarmRoute['operations'])-{'OP-06'} != set(pages['AlarmPage']['operations'])
simNotify=next(r for r in routes if r['context']=='simulation' and r['page']=='NotificationPage')
assert not set(ids([8,9,10,19,31])) & set(simNotify['operations'])
write('validation-b1.1.json',{'status':'passed','scope':'Local documentation structural verification only; independent review pending','checks':['22 route patterns cover page reads/actions after mode pruning','Entry, optional read, action and original-operation gates explicit','All 24 actual SF entry mappings resolve to declared methods/events','Approved conceptual entries unchanged','All 31 direct dispatch bindings resolve','All 5 task registrations and shutdown callbacks resolve','No new class/file inventory entries or schema changes','Pinned source hashes unchanged'],'counts':{'classes':39,'frontendFiles':79,'routes':22,'functionalSpecifications':24,'dispatchBindings':31,'taskRegistrations':5},'runtimeVerified':False,'productTestsExecuted':False})
write('review-disposition-b1.1.md','''# B1.1 local review disposition

2026-09-15. Leader authorized three P2 corrections within application-blueprint only. Status: locally addressed, awaiting independent re-review; no business development started.

| Finding | Correction | Verification |
|---|---|---|
| B1-01 | routes.json separates entryReads/optionalReads/actions/reconciliationReads, exact mode pruning and per-operation guards. Page inventory includes shared OP-07 for mutations. Read-only page admission does not require action permission. | All 22 route/page operation sets match after context filtering. Future read-only, denied action and unknown reconciliation cases documented. |
| B1-02 | Retained approvedEntry, added implementationEntry and selected acceptance links for all 24 SFs. Actual methods/events used, no fictitious classes introduced. | Every implementation entry resolves; approvedEntry matches original approved interface source. |
| B1-03 | composition.json records 31 direct operation-owner bindings, five bounded task registrations and shutdown callbacks; static dependencies remain separate. | Every dispatcher/target/registrar/callback resolves. README/UML scope explicitly excludes runtime edges. |

Handoff reminders: 39/79 are incremental responsibility inventories, not mandatory empty stub counts. Authorized explicit OP-21 acceptDuplicateRisk=true resend remains available under approved policy; blind retry remains forbidden. Existing RuleState completeness handoff is preserved.

Changed/generated documents: routes.json, frontend-files.json, spec-coverage.json, composition.json, frontend-design.md, backend-design.md, traceability.md, component-contracts.md, planned-verification-files.md, README.md, validation-b1.1.json and this disposition. revise-b1.py is documentation tooling; build-blueprint.py calls it after generation. Original B1 baseline.json/validation.json remain historical evidence; no approved source outside this directory was modified.

Target FIN SDK, build/runtime/field acceptance and whole-r10/schema2.1 approval remain unresolved as before. Future product test cases were specified, not executed. Freeze after this correction and await reviewer/test feedback through Leader.
''')
print('B1.1: 22 routes, 24 SF mappings, 31 dispatch bindings and 5 task registrations verified')
