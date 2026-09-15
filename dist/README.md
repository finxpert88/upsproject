# UPS Fleet POD Delivery

This directory contains the versioned DEV-01-r1 delivery artifact copied from the
independently tested non-test build.

| File | SHA-256 | Source build evidence |
| --- | --- | --- |
| `DEV-01/upsFleet.pod` | `E7C512AB8790DE831EBD6FCA954930D4BBD78BEAE906AB05A4F5C28C14F6D759` | `docs/development/DEV-01-r1/artifacts.json` |

Scope: DEV-01-r1 pure domain minimum package only. The pod contains
`QualityEvaluator` and metadata for the FT-01 / AC-02 / SF-02 freshness slice.
It does not contain test classes, FIN extension registration, lifecycle hooks,
menu integration, connector runtime, UI resources, or installation activation.

SDK candidate: local FIN Framework 5.3.0.2761 with Fantom compiler metadata
`build.compiler=1.0.78.3105`, Java 11.0.32.1, recorded in
`docs/development/DEV-01-r1/` and independently rechecked in
`docs/development/DEV-01-independent/`. This artifact is not a FIN G1 or field
acceptance result.
