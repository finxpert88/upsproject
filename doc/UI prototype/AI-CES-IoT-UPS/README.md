# UPS Fleet Monitor — Ractive dashboard

A single self-contained `index.html` built with **Ractive.js**: template,
styles, and logic all live in one file (template in a `<script type="text/ractive">`
block, styles in `<style>`, logic in the final `<script>`). Just open
`index.html` in a browser — no server or build step needed.

## What it does

- Three sample UPS units (online double-conversion, line-interactive,
  modular N+1) with independent telemetry — click a tab to switch.
- The active unit is bound with `ractive.link()`, so nested edits (e.g.
  acknowledging an alarm) write straight back into the underlying fleet
  array with no extra wiring.
- "Simulate utility loss" flips the active unit into on-battery mode,
  drops a critical alarm, and starts draining its runtime estimate live.
- A background interval jitters battery capacity/temperature and load
  every few seconds using Ractive's `push`/`shift` array shortcuts, so
  the sparklines and gauges feel like live telemetry.
- Toggle °C/°F with the checkbox in the hero panel.
