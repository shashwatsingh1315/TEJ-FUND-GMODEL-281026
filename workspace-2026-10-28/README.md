# Tejas workspace — 28 October 2026

This snapshot contains the updated dashboard, financial analyses, design concepts and working scripts from the local workspace.

- `outputs/Tejas_Revenue_Dashboard_1041_Updated.html` — current dashboard; download and open in a browser.
- `outputs/` — financing reviews, data exports and concept images.
- `work/` — analysis, build and verification material.

Capex is bought in whole phases within the fixed ₹170 Cr spend to Q16 (added 29 October 2026). The phases are set in Edit inputs → Cost of revenue · capex.

- `work/step-capex-layer.js` holds the phase logic. `work/apply-step-capex.cjs` writes it into the dashboard; re-running it replaces the layer.
- `work/verify-step-capex.cjs` and `work/audit-review.cjs` re-derive capex, cash and the funding gap independently. Run both from this folder.
- `outputs/Tejas_Quarter_End_Financials.csv` comes from an earlier build and does not reflect phased capex. The other CSV and HTML exports have been regenerated.

The financial results are projections based on model assumptions; the funding requirement remains subject to review. The earlier material in the repository is retained separately.
