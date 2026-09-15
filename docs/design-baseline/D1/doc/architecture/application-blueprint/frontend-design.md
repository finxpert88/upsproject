# Frontend routes, pages and components

Design only. The inspected UPS-FSD-R4 app.js is plain JavaScript with hash navigation. Keep local JavaScript modules and CSS, splitting that monolithic prototype by page/domain without introducing an unapproved framework migration. `.js` names are planned files, not generated implementations. Local dependency packaging and the FIN resource entry path await target SDK binding.

```text
upsFleet/ui/
  index.html
  package.json / lockfile        # future reproducible local tooling, versions not selected here
  src/
    app/                        # bootstrap, router, shell, source context
    pages/                      # route-level composition and page actions
    components/                 # reusable views grouped by business domain
    api/                        # operation families and shared same-origin client
    state/                      # session, view state, request cancellation, theme
    locales/en-US.js
    styles/                     # tokens, layout, components
  test/                         # planned route, contract and interaction acceptance
```

The default route redirects to `#/live/dashboard` after bootstrap and capabilities. Dashboard preserves authorized equipment selection or picks the first authorized UPS; empty/forbidden/unconnected are explicit states. Unknown routes show Not Found with safe navigation. Invalid object IDs show the same unavailable state as unauthorized IDs. URI-encode opaque IDs; never infer permission or mode from an ID string.

Hash routes avoid assuming unverified server rewrite support. Legacy prototype `#dashboard`, `#devices`, `#config`, etc. receive explicit aliases in the future router; do not silently break saved navigation. Site/filter/cursor/history range are query/view state, not additional pages. Alarm timeline/ack and metric help are dialogs/drawers with focus return; no extra endpoint or page is needed.

## Route inventory

| Route | Page | Context | Read/action constraints |
|---|---|---|---|
| `#/live/dashboard` | DashboardPage | live | No selection: choose first authorized equipment; empty fleet renders explicit no-data state. Detail identifiers never bypass authorization. |
| `#/simulation/:sessionId/:generationId/dashboard` | DashboardPage | simulation | Reuse page; require current generation and session ACL. Reset/delete invalidates old views; acknowledgement/export use simulation permissions. |
| `#/live/equipment` | EquipmentPage | live | No selection: choose first authorized equipment; empty fleet renders explicit no-data state. Detail identifiers never bypass authorization. |
| `#/simulation/:sessionId/:generationId/equipment` | EquipmentPage | simulation | Reuse page; require current generation and session ACL. Reset/delete invalidates old views; acknowledgement/export use simulation permissions. |
| `#/live/equipment/:equipId` | DashboardPage | live | No selection: choose first authorized equipment; empty fleet renders explicit no-data state. Detail identifiers never bypass authorization. |
| `#/simulation/:sessionId/:generationId/equipment/:equipId` | DashboardPage | simulation | Reuse page; require current generation and session ACL. Reset/delete invalidates old views; acknowledgement/export use simulation permissions. |
| `#/live/equipment/:equipId/history` | HistoryPage | live | No selection: choose first authorized equipment; empty fleet renders explicit no-data state. Detail identifiers never bypass authorization. |
| `#/simulation/:sessionId/:generationId/equipment/:equipId/history` | HistoryPage | simulation | Reuse page; require current generation and session ACL. Reset/delete invalidates old views; acknowledgement/export use simulation permissions. |
| `#/live/alarms` | AlarmPage | live | No selection: choose first authorized equipment; empty fleet renders explicit no-data state. Detail identifiers never bypass authorization. |
| `#/simulation/:sessionId/:generationId/alarms` | AlarmPage | simulation | Reuse page; require current generation and session ACL. Reset/delete invalidates old views; acknowledgement/export use simulation permissions. |
| `#/live/reports` | ReportPage | live | No selection: choose first authorized equipment; empty fleet renders explicit no-data state. Detail identifiers never bypass authorization. |
| `#/simulation/:sessionId/:generationId/reports` | ReportPage | simulation | Reuse page; require current generation and session ACL. Reset/delete invalidates old views; acknowledgement/export use simulation permissions. |
| `#/live/reports/:jobId` | ReportDetailPage | live | No selection: choose first authorized equipment; empty fleet renders explicit no-data state. Detail identifiers never bypass authorization. |
| `#/simulation/:sessionId/:generationId/reports/:jobId` | ReportDetailPage | simulation | Reuse page; require current generation and session ACL. Reset/delete invalidates old views; acknowledgement/export use simulation permissions. |
| `#/live/engineering` | EngineeringPage | live | Engineering actions are live-only; route guards hide controls but server remains authoritative. |
| `#/live/engineering/drafts/:draftId` | EngineeringPage | live | Engineering actions are live-only; route guards hide controls but server remains authoritative. |
| `#/live/engineering/commissioning` | CommissioningPage | live | Engineering actions are live-only; route guards hide controls but server remains authoritative. |
| `#/live/engineering/notifications` | NotificationPage | live | Engineering actions are live-only; route guards hide controls but server remains authoritative. |
| `#/live/engineering/diagnostics` | DiagnosticsPage | live | Engineering actions are live-only; route guards hide controls but server remains authoritative. |
| `#/live/engineering/audit` | AuditPage | live | Engineering actions are live-only; route guards hide controls but server remains authoritative. |
| `#/simulation` | SimulationPage | simulation-root | Only list/create without a session; other operations require selected session and generation. Read-only account cannot manage. |
| `#/simulation/:sessionId/:generationId/notifications` | NotificationPage | simulation | Delivery list/local retry only; no channel editor, external test, publish or emergency pause. |

## Page and component ownership

Pages orchestrate domain API calls and hold page state; components receive explicit values/actions and do not independently poll FIN. API family files own the 31 request builders; operationClient owns transport only. NotificationPage shares its delivery view in simulation, with a restricted action set. EngineeringWizard follows the FSD six steps: Enrollment -> Capabilities -> Mapping -> History/Rules -> Validation -> Publish. PlanEditor is an embedded editor in the engineering draft, not a seventh wizard step. Capability declaration is limited to the approved 2.0 contract and verified platform inputs; it does not enable candidate assetProfile writes.

| Planned file | Responsibility | Operations |
|---|---|---|
| `upsFleet/ui/src/app/bootstrap.js` | GET bootstrap before versioned API; session capability load | None directly |
| `upsFleet/ui/src/app/router.js` | Hash route parsing, encoded IDs, navigation and guards | None directly |
| `upsFleet/ui/src/app/AppShell.js` | Persistent navigation and source banner; default Dashboard | None directly |
| `upsFleet/ui/src/app/SourceContext.js` | Validated mode/session/generation; clear scoped state on context switch | None directly |
| `upsFleet/ui/src/api/operationClient.js` | Same-origin envelope, errors, idempotency IDs and bounded polling | None directly |
| `upsFleet/ui/src/api/responseDecoder.js` | Strict response schema 2.0 validation | None directly |
| `upsFleet/ui/src/state/SessionStore.js` | Current account capabilities; do not persist credentials | None directly |
| `upsFleet/ui/src/state/ViewState.js` | Equipment selection, filters, cursor and ranges by source context | None directly |
| `upsFleet/ui/src/state/RequestScope.js` | Cancel requests and reject late responses by context generation | None directly |
| `upsFleet/ui/src/state/ThemeStore.js` | Per-user Light/Dark preference; Light default | None directly |
| `upsFleet/ui/src/locales/en-US.js` | All UI, accessible names and source error translations | None directly |
| `upsFleet/ui/src/styles/tokens.css` | Theme/spacing/status tokens | None directly |
| `upsFleet/ui/src/styles/layout.css` | Three-column six-card Dashboard with responsive collapse | None directly |
| `upsFleet/ui/src/styles/components.css` | 44px touch targets, keyboard focus and component states | None directly |
| `upsFleet/ui/src/pages/DashboardPage.js` | Snapshot, device tabs, six cards, health ring and inline trends | OP-02, OP-03, OP-04, OP-22 |
| `upsFleet/ui/src/pages/EquipmentPage.js` | Filtered authorized fleet and stable cursor | OP-02 |
| `upsFleet/ui/src/pages/HistoryPage.js` | Segmented historical chart, source provenance and gaps | OP-04, OP-22 |
| `upsFleet/ui/src/pages/AlarmPage.js` | Active/cleared/event tabs and timeline | OP-05, OP-06, OP-07 |
| `upsFleet/ui/src/pages/ReportPage.js` | Create/list/cancel report jobs | OP-07, OP-15, OP-16, OP-18 |
| `upsFleet/ui/src/pages/ReportDetailPage.js` | Progress and protected binary download | OP-07, OP-16, OP-17, OP-18 |
| `upsFleet/ui/src/pages/EngineeringPage.js` | Six-step draft editor, validate, publish and rollback draft | OP-07, OP-08, OP-09, OP-10, OP-11 |
| `upsFleet/ui/src/pages/CommissioningPage.js` | Read current evidence and accept configured equipment | OP-07, OP-08, OP-12, OP-14 |
| `upsFleet/ui/src/pages/NotificationPage.js` | Channels via configuration; delivery list/test/retry/emergency pause | OP-07, OP-08, OP-09, OP-10, OP-19, OP-20, OP-21, OP-31 |
| `upsFleet/ui/src/pages/DiagnosticsPage.js` | Read-only lifecycle and recovery diagnostics | OP-12 |
| `upsFleet/ui/src/pages/AuditPage.js` | Scoped append-only audit viewer | OP-13 |
| `upsFleet/ui/src/pages/SimulationPage.js` | Session list/create, control, generation, scenario, reset and delete | OP-07, OP-23, OP-24, OP-25, OP-26, OP-27, OP-28, OP-29, OP-30 |
| `upsFleet/ui/src/components/layout/SourceBanner.js` | SourceBanner: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/layout/EquipmentTabs.js` | EquipmentTabs: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/layout/ResponsiveShell.js` | ResponsiveShell: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/layout/ThemeToggle.js` | ThemeToggle: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/dashboard/KpiCard.js` | KpiCard: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/dashboard/HealthRing.js` | HealthRing: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/dashboard/LoadBar.js` | LoadBar: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/dashboard/BatteryPanel.js` | BatteryPanel: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/dashboard/EnvironmentPanel.js` | EnvironmentPanel: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/dashboard/OutlookPanel.js` | OutlookPanel: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/dashboard/InlineTrend.js` | InlineTrend: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/dashboard/MaintenancePanel.js` | MaintenancePanel: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/common/QualityValue.js` | QualityValue: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/common/AsyncState.js` | AsyncState: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/common/PermissionGate.js` | PermissionGate: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/common/ConfirmDialog.js` | ConfirmDialog: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/common/CursorPager.js` | CursorPager: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/common/MetricHelp.js` | MetricHelp: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/common/ErrorNotice.js` | ErrorNotice: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/history/HistoryChart.js` | HistoryChart: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/history/RangeSelector.js` | RangeSelector: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/history/MappingGapLegend.js` | MappingGapLegend: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/alarm/AlarmTable.js` | AlarmTable: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/alarm/AlarmTimeline.js` | AlarmTimeline: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/alarm/AcknowledgeDialog.js` | AcknowledgeDialog: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/alarm/OperationProgress.js` | OperationProgress: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/engineering/EngineeringWizard.js` | EngineeringWizard: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/engineering/EnrollmentStep.js` | EnrollmentStep: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/engineering/CapabilityStep.js` | CapabilityStep: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/engineering/MappingStep.js` | MappingStep: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/engineering/HistoryRuleStep.js` | HistoryRuleStep: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/engineering/PlanEditor.js` | PlanEditor: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/engineering/ValidationStep.js` | ValidationStep: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/engineering/PublishStep.js` | PublishStep: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/report/ReportForm.js` | ReportForm: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/report/ReportJobTable.js` | ReportJobTable: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/notification/ChannelEditor.js` | ChannelEditor: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/notification/SubscriptionEditor.js` | SubscriptionEditor: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/notification/DeliveryTable.js` | DeliveryTable: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/notification/PauseDialog.js` | PauseDialog: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/simulation/SessionTable.js` | SessionTable: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/simulation/ScenarioControl.js` | ScenarioControl: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/components/simulation/GenerationBanner.js` | GenerationBanner: reusable view controlled by its owning page; no direct FIN SDK or independent business threshold authority | None directly |
| `upsFleet/ui/src/api/sessionApi.js` | Typed-by-contract request facade for session; delegates envelope and transport to operationClient | OP-01 |
| `upsFleet/ui/src/api/inventoryApi.js` | Typed-by-contract request facade for inventory; delegates envelope and transport to operationClient | OP-02, OP-03, OP-22 |
| `upsFleet/ui/src/api/historyApi.js` | Typed-by-contract request facade for history; delegates envelope and transport to operationClient | OP-04 |
| `upsFleet/ui/src/api/alarmApi.js` | Typed-by-contract request facade for alarm; delegates envelope and transport to operationClient | OP-05, OP-06, OP-07 |
| `upsFleet/ui/src/api/configurationApi.js` | Typed-by-contract request facade for configuration; delegates envelope and transport to operationClient | OP-08, OP-09, OP-10, OP-11, OP-14 |
| `upsFleet/ui/src/api/diagnosticsApi.js` | Typed-by-contract request facade for diagnostics; delegates envelope and transport to operationClient | OP-12 |
| `upsFleet/ui/src/api/auditApi.js` | Typed-by-contract request facade for audit; delegates envelope and transport to operationClient | OP-13 |
| `upsFleet/ui/src/api/reportApi.js` | Typed-by-contract request facade for report; delegates envelope and transport to operationClient | OP-15, OP-16, OP-17, OP-18 |
| `upsFleet/ui/src/api/notificationApi.js` | Typed-by-contract request facade for notification; delegates envelope and transport to operationClient | OP-19, OP-20, OP-21, OP-31 |
| `upsFleet/ui/src/api/simulationApi.js` | Typed-by-contract request facade for simulation; delegates envelope and transport to operationClient | OP-23, OP-24, OP-25, OP-26, OP-27, OP-28, OP-29, OP-30 |

## State, security and presentation rules

- Context key includes project, actor, mode, session and generation. Switching context aborts requests and discards late results; cached live data never appears under a simulation banner or vice versa. Rotation/theme changes preserve filters and do not reissue mutations.
- Bootstrap GET precedes schema 2.0 requests; version mismatch gets a clear upgrade page. All 31 operations use the approved envelope and permissionByMode matrix. Simulation read/ack/export/manage are separate from live capabilities; root simulation list/create do not authorize arbitrary session actions.
- Read actions can be refreshed within rate limits. A mutation creates one operationId; timeout/unknown transitions to OperationProgress and OP-07 reconciliation. Do not synthesize success or retry a new mutation ID after ambiguous submission. OP-17 handles binary success and JSON failure separately.
- RequestScope controls visibility-based polling and bounded concurrency. A page leaving the screen cancels its subscribers, not the project's shared backend acquisition. Session expiry clears data and prompts sign-in; permissions are always rechecked on the server.
- ThemeStore persists only theme under project/account key. No secrets, snapshots, notification credentials or permission grants in localStorage. Raw HTML is never populated from unescaped source labels/errors.
- Preserve the approved Dashboard: device tabs, three-column six-card layout, health ring, load bars and inline trends. QualityValue handles good/stale/fault/missing consistently; unknown scores show neutral unavailable state, not inferred scores. Q reads current R-01.requiredMinutes; impedance reference reads R-03 baseline, never a second UI threshold.
- All product text, errors, exports, aria/title and generated descriptions are en-US. Default Light; Dark changes colors, not semantics. Reports/PDF use fixed light output. Layout classes cover <640px, 640–980px, >980px with 44px targets, keyboard support and dialog focus return. Detailed visual acceptance remains the existing FSD/UI matrix.
- Plans live in the engineering PlanEditor and Dashboard MaintenancePanel; there is no invented maintenance write API. FR-18/19 later enhancements and FR-20 prediction/cross-project scope remain their existing phases.

## B1.1 route authorization correction

`routes.json` is authoritative for entryReads, optionalReads, actions and reconciliationReads. The operations union is coverage metadata, never an AND permission gate. Each call keeps the approved operation's mode permission and referenced-object scope. OP-08 get and save are distinct UI intents even though the approved API combines them.

Read-only alarm/report users may enter with the corresponding read permission while ack/export/cancel controls remain unavailable. Dashboard history and metric help are optional, separately authorized reads. Engineering entry still needs the approved OP-08 config.edit permission: schema 2.0 does not provide a new config-view permission. Commissioning renders only OP-08/12 sections the account may read; OP-14 acceptance has its own gate. Notification delivery viewing does not require configuration, test or pause permission. Simulation notification mode removes OP-08/09/10/19/31.

Every mutation-capable page uses the existing shared OperationProgress -> alarmApi.js OP-07 -> OperationRepository.operationStatus path for an original operation. The API-family filename is organizational, not an alarm-only access restriction. OP-07 checks original action/mode/current scope and never requires an unrelated live permission. Do not block read-only page entry on OP-07. Old generation cleanup exceptions retain the approved original-intent checks.

Simulation root permits list/create only. Selecting a session enables appropriately scoped management controls; an original-operation reconciliation uses that operation's bound context. No mutation is implicitly issued on navigation.

| Page | Entry reads | Optional reads | Explicit actions | Reconciliation |
|---|---|---|---|---|
| DashboardPage | OP-02, OP-03 | OP-04, OP-22 | None | None |
| EquipmentPage | OP-02 | None | None | None |
| HistoryPage | OP-04 | OP-22 | None | None |
| AlarmPage | OP-05 | None | OP-06 | OP-07 original operation |
| ReportPage | OP-16 | None | OP-15, OP-18 | OP-07 original operation |
| ReportDetailPage | OP-16 | None | OP-17, OP-18 | OP-07 original operation |
| EngineeringPage | OP-08 | None | OP-08, OP-09, OP-10, OP-11 | OP-07 original operation |
| CommissioningPage | OP-08, OP-12 | None | OP-14 | OP-07 original operation |
| NotificationPage | OP-20 | OP-08 | OP-08, OP-09, OP-10, OP-19, OP-21, OP-31 | OP-07 original operation |
| DiagnosticsPage | OP-12 | None | None | None |
| AuditPage | OP-13 | None | None | None |
| SimulationPage | OP-30 | None | OP-23, OP-24, OP-25, OP-26, OP-27, OP-28, OP-29 | OP-07 original operation |

This page-level table is the live/combined capability inventory; route entries apply mode-specific pruning.
