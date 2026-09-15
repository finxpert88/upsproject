# DEV-01 independent test: blocked before compilation

Scope: FT-01 / AC-02 / SF-02 minimum slice, RTM FR-03; not full requirement acceptance.

Branch feature/ups-pod-implementation; HEAD 3cdc8f5675a0cd32856597d97932f5d5d38ae71a.

Independent build with OutputRoot .artifacts/DEV-01-independent exited 1 at build.ps1 line 12, before directory creation, SDK copying or Fantom launch. The controlled external-root negative ../forbidden-dev01-independent also exited 1 at the same guard. Neither output directory exists after execution. Full exact commands and errors are in commands.json.

The build wrapper accepts only .artifacts/DEV-01. The test wrapper also hardcodes development output/runtime. This blocks this independent execution protocol; it does not prove the freshness implementation fails.

All 13 captured source, frozen work-package and specified SDK input hashes remained unchanged; see inputs-before.json and inputs-after.json. New writes were limited to this evidence directory. No default-output run, test.ps1 run, script copy/patch, FIN installation, enablement or live connection was performed.

Fantom compilation and FT-01 execution: NOT EXECUTED. Verifies and new artifact hashes: unavailable. New production/test POD contents and loading isolation: NOT VERIFIED. Source inspection shows 29/30 fresh and 31/32 stale assertions and a loaded-POD path assertion, but this is not independent runtime evidence.

Developer connector validation remains passed=false as disclosed in the existing DEV-01 README; it was not rerun or treated as passing. No FIN G1 or plugin runtime claim is made.

Leader pause instruction received after the two rejected build-wrapper invocations. Execution stopped. Await minimal wrapper correction and a new frozen handoff before retesting.
