# Decisions, approval scope and unresolved bindings

The user stated that the interface list and related Trio passed review. This design uses the existing fsd-r9 A2.2 schema 2.0 delivery, with exact current input hashes in baseline.json. The statement did not supply a historical hash; the capture proves the current source bytes, not a new retrospective approval certificate. The previous review/disposition remains the record of design closure.

Leader explicitly assigned only this directory on feature/fsd-r4-static-demo. No branch switch, commit or push is part of the task. Prior FSD/RTM/architecture files are preserved.

| Item | Treatment in this blueprint | Next evidence needed |
|---|---|---|
| FSD r10 sections 23.1–23.6 | Map to already reviewed AR-01/02/04/05/06/07/08 internal protocols; no assertion of whole-r10 approval | Planning/review final r10 decision |
| AR-03 / schema 2.1 candidate | Not enabled. assetProfile/environmentBinding editing and associated payload variants are excluded from active 2.0 routes/contracts | Explicit public-contract approval and migration evidence |
| Future schema 2.1 impact | ConfigurationTypes, DtoCodec, RecordCodec, ConfigurationGuard and engineering editor gain approved variants; inventory remains read-only over current 2.0 response | Freeze discriminants, evidence/range checks, migration/rollback and mixed-client policy before adding files |
| RuleState minimal type | Full internal runtime codec must incorporate existing candidate/count/epoch fields and map currentOccurrenceId to occurrence identity | Contract/codec integration and recovery vectors |
| FIN/Fantom runtime | Unknown/unverified; project class names and gateway methods are proposals | Versioned SDK symbols, extension registration, build dependencies and real compile/integration evidence |
| Transaction capability | Required invariants are explicit; not claimed available in target SDK | Atomic rule transition/publication/gate CAS and restart tests; if unsupported, re-review before implementation |
| Frontend framework | Plain JS module plan follows current prototype; no framework migration | Local bundler/package versions and browser/FIN resource compatibility |

Official language evidence: FIN Expert record fin_web_language_reference_29b1ab20b34f11b5, retrieved 2026-08-28, Fantom documentation 1.0.83. It supports source/build conventions only and has no FIN-version applicability claim. Direct official references: https://fantom.org/doc/docTools/Build, https://fantom.org/doc/docLang/Classes, https://fantom.org/doc/docLang/Pods.
