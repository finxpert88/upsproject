# Component input and event design

These are view contracts, not new public API types. All domain fields come from approved DTOs. Components emit user intent; owning pages authorize available controls and call the domain API. Server authorization remains mandatory.

| Component | Input / local state | Events / effect owner | Required behavior |
|---|---|---|---|
| SourceBanner / GenerationBanner | SourceContext, SimSession state | select source -> AppShell | Always distinguish live/simulation; invalidate obsolete generation links |
| EquipmentTabs | Authorized EquipmentRow list, selected equipment | select -> DashboardPage | Preserve selection by source context; never expose unauthorized equipment |
| KpiCard / QualityValue | Metric, MetricDefinition, formatting unit | help -> MetricHelp | Zero/false valid; unavailable values stay unavailable; show quality/time/source |
| HealthRing | HealthIndicator, Assessment | help -> DashboardPage | External score only; risk/coverage displayed separately, no fabricated aggregate |
| LoadBar | Approved load Metric | none | Unknown does not render as zero load; status is not inferred from bar color alone |
| BatteryPanel | BatteryAsset list, selected object, its metrics | select battery -> DashboardPage | Keep SOC/SOH/impedance distinct; objectRef controls history context |
| EnvironmentPanel | Approved environment metrics and capabilities | help -> DashboardPage | No schema 2.1 binding editor; missing evidence is explicit |
| OutlookPanel | OutlookItem list and source status | select -> DashboardPage | No local prediction model; show provenance and unavailable state |
| MaintenancePanel | Approved plan/outlook projections | open engineering -> router | Read-only monitoring; edit through existing draft entity flow |
| InlineTrend / HistoryChart | HistorySegment list, explicit window and quality | range/field selection -> page | No line across gaps or mapping boundaries; never make browser samples the history store |
| RangeSelector / MappingGapLegend | Allowed ranges, selected curves, segment metadata | query change -> HistoryPage | Enforce <=4 curves and approved range/bucket limits; metadata explains gaps |
| MetricHelp | MetricDefinition and approved rule-derived values | close -> caller focus | Meaning, unit, provenance and current criterion; never a second editable threshold |
| AlarmTable / AlarmTimeline | Alarm page, TimelineItem list | select/ack request -> AlarmPage | Occurrence, clear and acknowledgement are independent; pure events cannot be acknowledged |
| AcknowledgeDialog | Selected Alarm, expectedRevision, pending flag | confirm -> AlarmPage OP-06 | Single selected occurrence; preserve operationId on ambiguous response |
| OperationProgress | Operation and source context | poll intent -> page OP-07 | SUCCEEDED + pending remains pending projection; unknown cannot become a new write |
| EngineeringWizard | Draft, draftRevision, validation status, step index | patch/save/validate/publish -> EngineeringPage | One draft lifecycle; maintain field errors and focus across six steps |
| EnrollmentStep / CapabilityStep | Approved Enrollment fields, read-only FIN capabilities/evidence | approved field change -> EngineeringWizard | No protocol credentials, device address edits or candidate assetProfile writes |
| MappingStep | Mapping entities and point preview | mapping patch -> EngineeringWizard | Display Ref/unit/enum/quality/evidence; preview is read-only |
| HistoryRuleStep / PlanEditor | Rule and Plan entities, mapping history policy | entity patch -> EngineeringWizard | Preserve recovery chain and historical revisions; no local rule-authority copy |
| ValidationStep / PublishStep | ValidationReport, Publication, baseConfigRevision | validate/publish -> EngineeringPage | Invalid/expired report cannot publish; unknown commit outcome is reconciled |
| ReportForm / ReportJobTable | ReportParams, ReportJob list, allowed scope | create/select/cancel -> ReportPage | Complete authorized scope, bounded job sizes; no page screenshot masquerading as report |
| ChannelEditor / SubscriptionEditor | NotificationChannel/Subscription draft projections | draft patch -> NotificationPage | No secret value disclosure; publication uses OP-08/09/10 and config permissions |
| DeliveryTable / PauseDialog | NotifyJob list, ChannelGate, mode | retry/pause -> NotificationPage | Simulation permits local retry only; live pause revision and unknown-delivery rules remain intact |
| SessionTable / ScenarioControl | SimSession list, selected generation/control revision, ScenarioChange | create/generate/control/step/scenario/reset/delete -> SimulationPage | Root list/create separated from selected-session management; fence reset/delete and late responses |
| CursorPager | Page cursor, expiry, anchor and filter | next/back -> owning page | Preserve frozen list members within validity; expired cursor rebuilds with explicit message |
| AsyncState / ErrorNotice | loading/no-data/partial/forbidden/error response | retry read -> owning page | Do not collapse partial failure into no-data; no automatic mutation retry |
| PermissionGate | Current capabilities and source action | none | Presentation helper only; cannot grant authority or substitute for server checks |
| ConfirmDialog | Concrete authorized action summary and busy state | confirm/cancel -> owning page | Accessible focus/keyboard handling; no duplicate submit |
| ResponsiveShell / ThemeToggle | viewport class and ThemeStore | theme -> ThemeStore | Preserve page/filter/draft state; 44px targets; no mutation on resize |

The inspected static prototype is a behavior and visual reference, not a production authentication provider. Any retained demo data provider must be development-only and explicitly selected. The production source context uses the backend simulation APIs; it must not silently substitute the prototype's in-memory simulator.

## B1.1 explicit event identifiers and notification override

DashboardPage.render denotes existing snapshot-to-view rendering; EngineeringWizard.patch/save/validate/publish denote its documented events; ThemeStore.set and ResponsiveShell.resize denote existing theme/viewport state handling. These identifiers allow structural SF linkage without adding classes or behavior.

DeliveryTable retry delegates to NotificationPage. If the approved OP-21 policy allows an authorized administrator to resend an uncertain delivery, show a concrete duplicate-risk confirmation and send acceptDuplicateRisk=true only after that explicit decision. An ordinary retry or restart must not silently set this field. Mode and server authorization remain unchanged.
