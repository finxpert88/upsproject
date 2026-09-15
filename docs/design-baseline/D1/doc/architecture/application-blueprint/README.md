# UPS Fleet application blueprint B1

2026-09-15 • Architect design handoff • schema 2.0 • No application implementation

This package plans the backend and frontend from the approved interface/Trio delivery. It contains 39 behavior classes/ports, grouped value-type source plans, 79 frontend source-file entries, 12 pages, 22 route patterns, all 31 operations and all 24 functional specifications. Counts describe design inventory, not implemented or compiled code.

1. [Backend directories and classes](backend-design.md)
2. [Data types and Folio mapping](data-types.md)
3. [Frontend routes, pages and components](frontend-design.md)
4. [Operation ownership and exact contract references](operation-ownership.json)
5. [SF/RTM acceptance handoff](traceability.md)
6. [Approval, candidate and SDK boundaries](decisions-and-boundaries.md), [input hashes](baseline.json)
7. [Structural validation](validation.json)
8. [Component inputs and events](component-contracts.md)
9. [Planned verification files](planned-verification-files.md)
10. [FIN Expert validation scope and results](fin-expert-validation.json)

## Backend UML: entry, telemetry and platform boundary
![Backend core UML](backend-core-uml.svg)

## Backend UML: stateful domains and workers
![Backend state UML](backend-state-uml.svg)

Dashed arrows mean dependency; dashed hollow triangles mean realization of the two mixins. Diagrams show important methods for readability; backend-classes.json lists static responsibilities/dependencies; composition.json supplies direct dispatch and runtime callback bindings. Cross-sheet dependencies remain in that inventory, not duplicated into an unreadable global class diagram. Immutable value groups are specified in data-types.md.

## Frontend route block diagram
![Frontend routes](frontend-routes.svg)

## System architecture
![System architecture](system-architecture.svg)

Each diagram has editable Mermaid source and matching SVG/PNG rendering from diagram-models.json. API URLs are project proposals inherited from the approved interface list, not FIN official endpoints. Target SDK registration, compile/runtime, transaction guarantees and field acceptance are unverified. FSD r10 as a whole and schema 2.1 are not approved by this blueprint. No source stubs, production records, live calls, commit or push were created.

## B1.1 review disposition

B1-01/02/03 have local design corrections pending independent re-review. See [disposition](review-disposition-b1.1.md), [composition](composition.json) and [verification](validation-b1.1.json). The inventory is for incremental implementation; do not create all empty classes at once. Original B1 baseline/validation evidence is retained. No business implementation, branch change or public schema change.
