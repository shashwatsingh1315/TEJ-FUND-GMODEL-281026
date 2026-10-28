# Retired scripts

These built or checked earlier versions of the dashboard. Do not run them:

- `apply-review.cjs`, `update-1041.cjs`, `build-operating.cjs` and `apply-step-capex.cjs` wrote straight into the dashboard file, so they would overwrite or double-apply later work.
- Several also read files that only existed on the original Mac (`/Users/...`).

Each `.cjs` file now stops at its first line. The `.js` and `.css` files here were inputs to those scripts only. Their effect is already part of `src/base/dashboard-base.html`. The capex layer moved to `src/capex/step-capex-layer.js`.

Kept for history; the dashboard is now built with `python3 src/build.py` (see `WORKING-ON-THE-DASHBOARD.md`).
