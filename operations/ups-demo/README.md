# mytest UPS demo rebuild

Status: MODEL IMPORT COMPLETE. Readback confirms 2 new sites, 6 UPS, 138 points, 136 initialized current values and 2 intentionally unsupported points without values. Four functions are installed and two jobs remain disabled. All 40 old records are retained. 88 numeric points have history configuration; historical backfill has NOT been executed. See model-completed.json for execution audit and verification. Original/recovery batch files must not be rerun. Current values are transient snapshots and do not continue updating while jobs are disabled. Any further live mutations require their own FIN Expert staged confirmation.

## Prepared data

- 2 sites, 6 UPS, 138 points, including 88 numeric history points.
- All values are synthetic. FSD v0.1 revision 2 is the semantic baseline; this does not install the UPS product POD or certify commissioning.
- Scenarios: normal, battery, static bypass, offline, limited optional capabilities, high load.
- Standard siteRef/equipRef associations; ups-prefixed metadata is custom, not a standard UPS ontology.
- Numeric history: 30 days ending at the execution cutoff rounded down to 5 minutes; offline UPS ends 30 minutes earlier to show a real gap. Non-numeric status points have current values, not numeric trend histories.
- Jobs: current values every 10 seconds; numeric history every 5 minutes. Installed disabled, enabled only after validation. Runtime outages are not retroactively filled by the scheduled history job.

## Sequence

1. Export old business records/history (complete: backup contains 40 records and 20,160 history rows, individually read without truncation). This is a business-data export, not a full FIN system snapshot.
2. Confirm and execute 01-create-model.axon: create new model, four synthetic-data functions, two disabled jobs. No old records are deleted in this operation. Stop and reconcile if partially executed; never rerun the full script blindly.
3. Verify record counts, references, function compilation and one-point history/current-value smoke checks through separately staged FIN operations. Fix target-version issues before proceeding.
4. Backfill each supported numeric point with upsDemoBackfill20260914 using one shared cutoff and bounded chunks. Read back counts, units, min/max timestamp, 1h/24h/7d windows and offline gaps. Initialize offline last-good values with their actual history timestamps and down status; unsupported points remain disabled with no invented value.
5. Enable the two jobs via staged updates; observe multiple successful current-value cycles and a new 5-minute history sample. Reconcile restart/dedup behavior before deleting old data.
6. Stage removal of exactly deletion-manifest.json records and their verified history ranges. Require unchanged record IDs/revisions, no remaining references and complete exports. Do not clear global trash or remove platform configuration/programs/jobs.
7. Verify old records/history removed, only two UPS sites/six UPS remain, jobs healthy and histories current. Report actual counts and any unfinished capability tests.

## Evidence and limits

Live about reported productVersion 3.1.5; this is outside FIN Expert's certified evidence profiles. Four function packages pass offline Axon structure checks, not runtime compilation. Seed record writes use unique upsDemoKey lookup, never display names. The generic checker flags navName text even in record creation; its function-packaging checks do not validate an arbitrary seed script.

Evidence: fin_web_fin_33084211202 (record operations); 5d7c91f5d4028b23ec250c20 (history writes); fin_doc_App_Selection_Menu_Advancd_Apps_Jobs_305bc09d (existing Jobs scheduler); c63a0d6baaed959f73a757b6 (Axon packaging).

No physical device connections, real alarm acknowledgements or user/permission changes are included.
