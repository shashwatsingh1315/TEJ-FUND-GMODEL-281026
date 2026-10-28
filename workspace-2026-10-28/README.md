# Tejas workspace — 28 October 2026

This snapshot contains the updated dashboard, financial analyses, design concepts and working scripts from the local workspace.

- `outputs/Tejas_Revenue_Dashboard_1041_Updated.html` — current dashboard (generated from `src/`); open it in a browser on a laptop.
- `outputs/` — financing reviews, data exports and concept images.

**To change or rebuild the dashboard, read `WORKING-ON-THE-DASHBOARD.md` first.** In short: the dashboard is generated from `src/` by `python3 src/build.py`, and `./check-all.sh` runs every check. Never edit the HTML in `outputs/` by hand.

- `src/`: the sources (base dashboard, capex phasing layer, page 03 Funding & returns).
- `work/`: check scripts and their reports. `work/legacy/` holds retired scripts that must not be run.
- `outputs/Tejas_Quarter_End_Financials.csv` comes from an earlier build and is stale.

The financial results are projections based on model assumptions; the funding requirement remains subject to review. The earlier material in the repository is retained separately.
