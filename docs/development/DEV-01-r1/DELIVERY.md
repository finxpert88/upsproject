# DEV-01-r1 Delivery Index

Status: integrated feature artifact after independent limited test pass. This is
not a FIN installation, menu enablement, G1 validation, or production acceptance.

## Versioned artifact

| Path | SHA-256 | Notes |
| --- | --- | --- |
| `dist/DEV-01/upsFleet.pod` | `E7C512AB8790DE831EBD6FCA954930D4BBD78BEAE906AB05A4F5C28C14F6D759` | Copied from `.artifacts/DEV-01-r1-validation/upsFleet.pod`; non-test pod. |

The pod entries are `meta.props`, `fcode/names.def`, `fcode/typeRefs.def`,
`fcode/methodRefs.def`, `fcode/types.def`, and
`fcode/QualityEvaluator.fcode`. The test class is present only in the test
variant recorded under independent evidence.

## Source and build inputs

- Source: `upsFleet/build.fan` and `upsFleet/fan/domain/telemetry/QualityEvaluator.fan`.
- Test source: `upsFleet/test/domain/QualityEvaluatorTest.fan`.
- Scripts: `scripts/build.ps1` and `scripts/test.ps1`.
- Frozen design input: `docs/design-baseline/D1/`, with its approved boundary
  documented in `docs/design-baseline/D1/README.md`.
- SDK candidate: FIN Framework 5.3.0.2761, Fantom build compiler 1.0.78.3105,
  Java 11.0.32.1, recorded in `docs/development/DEV-01-r1/` and independently
  rechecked in `docs/development/DEV-01-independent/`.

## Verification level

Independent test evidence is frozen in `docs/development/DEV-01-independent/`.
It reports successful formal build, test build, and real Fantom execution:
1 method and 36 verifies. The checked behavior is the FT-01 / AC-02 / SF-02
minimum slice: repeated reads of the same source timestamp do not refresh
freshness, 29/30 seconds remain fresh, and 31/32 seconds are stale.

Boundaries retained from the test report:

- This does not prove the full FR-03, SF-02, AC-02, FIN G1, plugin lifecycle,
  menu registration, connector validator, field runtime, UI, alarm, history,
  reporting, notification, capacity, or production acceptance.
- The connector validator remains `passed=false` for the wider connector
  requirements outside DEV-01-r1.
- Runtime and build caches under `.runtime/` and `.artifacts/` stay unversioned.
