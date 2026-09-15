# Requirement and acceptance handoff

Source descriptions and SF IDs below are copied from the approved interface list; PRD/FSD/RTM remain authoritative. The current RTM is a revision-10 working document, not evidence of r10 approval. This blueprint assigns implementation responsibility without redefining acceptance or marking tests passed.

| SF | FSD section | Backend owner | Frontend owner | Approved entry / OP |
|---|---|---|---|---|
| SF-01 | 4.1 | TelemetryService | DashboardPage | TelemetryService.pollBatch / OP-03 |
| SF-02 | 4.2 | QualityEvaluator | QualityValue | QualityEvaluator.evaluate / OP-03 |
| SF-03 | 4.3 | CommunicationResolver | EquipmentPage | CommunicationResolver.resolve / OP-02/03 |
| SF-04 | 5.1/5.7 | InventoryService | EquipmentPage | InventoryService.list / OP-01/02 |
| SF-05 | 5.2/5.8/17 | TelemetryService | DashboardPage | DashboardPresenter.render / OP-03/04/22 |
| SF-06 | 5.3/5.6 | HistoryService | HistoryPage | HistoryService.querySegments / OP-04 |
| SF-07 | 5.4 | AlarmService | AlarmPage | AlarmService.query / OP-05/06/07 |
| SF-08 | 5.5 | ConfigurationService | EngineeringPage | EngineeringWizard / OP-08/09/10/14 |
| SF-09 | 6.1/6.3/6.4 | RuleEngine | None | RuleEngine.advance / 内部 |
| SF-10 | 6.2/6.5 | RuleEvaluator | HistoryRuleStep | RuleEvaluator.evaluate / OP-08/09/10 |
| SF-11 | 7.1/7.4 | AlarmSynchronizer | AlarmTimeline | AlarmSynchronizer.reconcile / OP-05 |
| SF-12 | 7.2 | AcknowledgementCoordinator | AcknowledgeDialog | AcknowledgementCoordinator.execute / OP-06/07 |
| SF-13 | 7.3 | AuditRepository | AuditPage | AuditRepository.append / OP-13 |
| SF-14 | 8.1 | ConfigurationService | EngineeringWizard | ConfigurationService.mergeValidate / OP-08/09/11 |
| SF-15 | 8.2/8.3 | PublicationCoordinator | PublishStep | PublicationCoordinator.activate / OP-10/07 |
| SF-16 | 8.4 | ConfigurationGuard | ValidationStep | ConfigurationGuard.checkActive / OP-08/09/10 |
| SF-17 | 11.1 | Lifecycle | DiagnosticsPage | Lifecycle.startStop / OP-12 |
| SF-18 | 11.2 | WorkScheduler | RequestScope | WorkScheduler.admit / OP-02/03/04/12 |
| SF-19 | 11.3 | MigrationRunner | None | MigrationRunner.run / 内部 |
| SF-20 | 18.2 | ReportWorker | ReportPage | ReportWorker.execute / OP-15/16/17/18 |
| SF-21 | 18.3 | NotificationWorker | NotificationPage | NotificationWorker.deliver / OP-19/20/21/31 |
| SF-22 | 18.4 | None | ThemeStore | ThemeStore.set / 前端本地 |
| SF-23 | 19 | SimulationService | SimulationPage | SimulationService.advanceEvents / OP-23～30 |
| SF-24 | 22 | None | ResponsiveShell | ResponsiveShell.resize / 复用业务OP |

| Implementation increment | PRD/RTM relationship | Existing acceptance IDs to carry into implementation |
|---|---|---|
| Bootstrap, authorized fleet and snapshots | FR-01–08, FR-14–17; FSD 3–5/9/10/11 | FT-32, FT-34, FT-36; UI-01–12 |
| History and mapping boundaries | FR-09; FSD 5.3/5.6 | FT-31; original history vectors in RTM |
| Rule lifecycle, acknowledgement and audit | FR-10/11/12/16/17; FSD 6/7 | FT-24–28, FT-33–35 |
| Configuration, commissioning and recovery | FR-13/16/17; FSD 8 | FT-22/23, FT-27–30 |
| Definitions, reports and notifications | FR-21/22/23; FSD 18 | NEW-01–10, R7-08/09 |
| Theme, language, responsive and touch | FR-24/26; FSD 18.4/21/22 | NEW-11/12, UI-01–12; exact language/responsive IDs in current RTM |
| Simulation and fences | FR-25; FSD 19 | SIM-01–08, R7-02/04/06/07 |

These are selected handoff links, not a replacement or an exhaustive reallocation of the RTM. Development must retain all applicable cases including original FT-01–21. The 24 SFs and 31 OPs are structurally covered by the JSON inventories. FR-18–20 stay in the existing later phases. No product acceptance test was executed by this design task.

Implementation gates: (1) bind actual FIN/Fantom versions, resource registration, identity APIs, CAS/transactions, alarm correlation and protected file handling; (2) implement strict contract and record codecs; (3) prove authorization/idempotency and fault recovery before enabling writes; (4) integrate domain services and UI against controlled FIN; (5) run complete RTM and field acceptance with measured evidence. Each future change belongs on a Leader-assigned branch and includes its SF/FR/OP/acceptance references.

## B1.1 actual implementation-entry mapping

approvedEntry preserves the original approved interface list verbatim. implementationEntry identifies the existing B1 class method or documented view event that implements that responsibility; it does not rename the approved source or introduce a new class. View render/set/resize and wizard events are explicit design identifiers in frontend-files.json, not implemented code. Acceptance IDs below are selected links; all existing RTM cases remain applicable.

| SF | Approved conceptual entry | Actual B1 implementation entry | Related acceptance |
|---|---|---|---|
| SF-01 | TelemetryService.pollBatch | TelemetryService.pollBatch | FT-36 |
| SF-02 | QualityEvaluator.evaluate | QualityEvaluator.evaluate | FT-34 |
| SF-03 | CommunicationResolver.resolve | CommunicationResolver.resolve | FT-34 |
| SF-04 | InventoryService.list | InventoryService.equipmentList | FT-32 |
| SF-05 | DashboardPresenter.render | DashboardPage.render | UI-01, UI-12 |
| SF-06 | HistoryService.querySegments | HistoryService.querySegments | FT-31 |
| SF-07 | AlarmService.query | AlarmService.alarmListDetail | FT-35 |
| SF-08 | EngineeringWizard | EngineeringWizard.save, EngineeringWizard.validate, EngineeringWizard.publish | FT-29, FT-30 |
| SF-09 | RuleEngine.advance | RuleEngine.advance | FT-24, FT-33 |
| SF-10 | RuleEvaluator.evaluate | RuleEvaluator.evaluate | FT-27, FT-34 |
| SF-11 | AlarmSynchronizer.reconcile | AlarmSynchronizer.dispatchNext, AlarmSynchronizer.reconcileUnknown | FT-25, FT-26 |
| SF-12 | AcknowledgementCoordinator.execute | AcknowledgementCoordinator.execute, AcknowledgementCoordinator.reconcile | FT-35 |
| SF-13 | AuditRepository.append | AuditRepository.append | FT-29 |
| SF-14 | ConfigurationService.mergeValidate | ConfigurationService.configGetSaveDraft, ConfigurationService.configValidate | FT-29 |
| SF-15 | PublicationCoordinator.activate | PublicationCoordinator.activate | FT-22, FT-23 |
| SF-16 | ConfigurationGuard.checkActive | ConfigurationGuard.checkActiveOccurrences | FT-27, FT-28 |
| SF-17 | Lifecycle.startStop | Lifecycle.start, Lifecycle.stop | FT-22, FT-24 |
| SF-18 | WorkScheduler.admit | WorkScheduler.admit | FT-36 |
| SF-19 | MigrationRunner.run | MigrationRunner.inspectCompatibility, MigrationRunner.planMigration, MigrationRunner.resumeMigration | FT-22, FT-23 |
| SF-20 | ReportWorker.execute | ReportWorker.execute | NEW-03, NEW-06, R7-08 |
| SF-21 | NotificationWorker.deliver | NotificationWorker.deliver | NEW-07, NEW-10, R7-09 |
| SF-22 | ThemeStore.set | ThemeStore.set | NEW-11, NEW-12 |
| SF-23 | SimulationService.advanceEvents | SimulationEngine.advanceEvents | SIM-01, SIM-08 |
| SF-24 | ResponsiveShell.resize | ResponsiveShell.resize | UI-01, UI-12 |
