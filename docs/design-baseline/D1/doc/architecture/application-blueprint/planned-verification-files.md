# Planned verification source inventory

No test implementation is generated or executed here. These are concrete future file targets, assigned to the same business boundaries as the implementation. Exact test harness imports and FIN integration setup depend on G1 SDK binding.

| Planned file | Verification purpose | Trace |
|---|---|---|
| upsFleet/test/contract/RequestContractTest.fan | All 31 exact request/response shapes; bootstrap, enums/nulls, unknown-field rejection and binary download error branch | OP-01–31; FSD 9/10 |
| upsFleet/test/contract/RecordCodecTest.fan | Approved Ref/native value conversion, full RuleState, dangling refs and DTO/Rec separation | AR-05; approved record-codecs.json |
| upsFleet/test/domain/TelemetryQualityTest.fan | No timestamp refresh on cached reads, zero/false, stale/invalid/range and separate comm/power | SF-01–03; FSD 4 |
| upsFleet/test/domain/RuleTransitionTest.fan | Count/duration/hysteresis, sample/quality/calendar drivers and risk/coverage | SF-09/10; FT-33/34 |
| upsFleet/test/integration/AlarmRecoveryTest.fan | Atomic rule transition, crash after external CREATE, old CLEAR/new CREATE and uncertain acknowledgement | FT-24–28/35; AR-01/06 |
| upsFleet/test/integration/PublicationRecoveryTest.fan | Commit-point crash matrix, sealed full entity membership, unique committed candidate and uniform epoch | FT-22/23/27/29/30; AR-04 |
| upsFleet/test/integration/ScopeAuthorizationTest.fan | Read/ack/export/manage by mode, old/new patch scope, cleanup tombstones, cross-actor idempotency | FSD 10.1; FT-29; AR-06/07 |
| upsFleet/test/integration/HistoryReportTest.fan | Half-open mapping boundaries, carry-in/weighted aggregates, file limits and download reauthorization | FT-31; NEW-03–06; R7-08 |
| upsFleet/test/integration/NotificationRecoveryTest.fan | Independent cursor/outbox, pause/claim race, unknown outcome and no simulation external transport | NEW-07–10; R7-09 |
| upsFleet/test/integration/SimulationReplayTest.fan | Seed/scenario event replay, initial metadata vs checkpoint, reset/delete fences and worker crash | SIM-01–08; AR-02 |
| upsFleet/test/integration/LifecycleLoadTest.fan | Startup recovery, shutdown drain, queue bounds and shared acquisition under 20 sessions | SF-17–19; FT-36 |
| upsFleet/ui/test/routes.spec.js | 22 route patterns, legacy aliases, expired session, no-data/forbidden and generation invalidation | SF-04–08/23 |
| upsFleet/ui/test/operation-client.spec.js | Schema mismatch, cancelled/late responses, mutation operation ID retention and protected download | OP-01/06/07/17; FSD 9 |
| upsFleet/ui/test/dashboard.spec.js | Original Dashboard six cards/ring/bars/inline trends and quality/provenance | UI-01–12; SF-05 |
| upsFleet/ui/test/engineering.spec.js | Exact six steps, draft preservation and validation/publish gates | SF-08/14–16 |
| upsFleet/ui/test/accessibility-responsive.spec.js | en-US including generated errors, theme, keyboard/focus/touch and resize state retention | SF-22/24; FR-24/26 |

Contract fixtures must derive from the pinned approved schema, and independent negative/crash fixtures must test the FSD invariant rather than merely mirror the implementation. Existing acceptance remains authoritative; this inventory does not certify any case as passed or replace field testing.

## B1.1 additional cases within existing planned files

- routes.spec.js: read-only alarm/report account enters via OP-05/16 without ack/export/manage; those actions are unavailable and direct API attempts are denied. Optional history/definition/config panels do not block authorized base-page entry.
- routes.spec.js: all page actions and entry/optional reads are covered by every applicable route after mode pruning; simulation notification exposes only delivery/local retry/reconciliation. Root simulation navigation invokes list only, not session mutations.
- operation-client.spec.js: lost acknowledgement/publication/report/simulation response can reach the shared OP-07 original-operation path; no replacement operationId or unrelated permission is required. Current authorization, ownership and cleanup exceptions still apply.
- NotificationRecoveryTest.fan: blind resend rejected; explicitly authorized OP-21 acceptDuplicateRisk=true follows the approved state/mode/audit policy, including local-only simulation.
- Structural documentation checks: all SF implementation entries and 31 dispatch targets resolve; task callbacks/registrars resolve; approvedEntry remains unchanged. These checks do not execute the future product tests.

