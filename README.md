# Tejas funding model (page 03)

Working material for turning page 03 of the Tejas investor dashboard into a funding story for Indian VCs: revenue growth, the capital it consumes, the business's own cash, the gap, the raises, the price of each round, and what the first investor gets.

**Status:** built. The current dashboard is `workspace-2026-10-28/outputs/Tejas_Revenue_Dashboard_1041_Updated.html`. Page 03 is now "Funding & returns". `dashboard/` keeps the original dashboard, unmodified, for reference.

## Start here

1. Read `workspace-2026-10-28/WORKING-ON-THE-DASHBOARD.md`. It explains where each part comes from, how to rebuild (`python3 src/build.py`) and check (`./check-all.sh`), and the design rules.
2. Open the current dashboard in a browser on a laptop and click through all seven pages.
3. For background on why page 03 is built the way it is, read `docs/BUILD-BRIEF.md`. Its open decisions (D1 to D11) and reference numbers describe the plan before it was built, so the live numbers now differ.

## What is in this repo

| Path | What it is |
|---|---|
| `workspace-2026-10-28/` | The current dashboard, its sources (`src/`), checks (`check-all.sh`, `work/`) and exports. See its `WORKING-ON-THE-DASHBOARD.md`. |
| `dashboard/tejas-revenue-dashboard.html` | The original dashboard before this work: one file, seven pages, fonts embedded. Unmodified. |
| `docs/BUILD-BRIEF.md` | The five-part build brief for the new page 03, with reference numbers. |
| `docs/REVIEW-working-capital-and-capex.md` | Review of how the latest dashboard (`workspace-2026-10-28/`) models working capital and capex: what holds, what doesn't, and what each fix does to the equity needed. |
| `docs/spec-cash-burn-capex-fundraising.md` | The original spec: two-column layout, step-by-step beats, cost-plan table. Still the source for the left/right principles. |
| `docs/context/codex-grill-me-transcript.txt` | An earlier question-and-answer session. Background only. It contains an account email and local file paths, so keep this repo private. |
| `design-reference/rejected-concepts-A-D/` | Four concept previews that were rejected because they did not match the dashboard's design and used invented figures. Kept for reference. Do not reuse them. |
| `tools/` | Helper scripts behind the brief's reference numbers (below). |

## Running the checks

For the current dashboard, run `./check-all.sh` from `workspace-2026-10-28/` (see its `WORKING-ON-THE-DASHBOARD.md`). The scripts below check the original dashboard in `dashboard/` and the build brief's reference numbers.

The `.js` files need Node.js with Playwright and Chromium. The `.py` files need Python 3. Pass the dashboard's absolute path to the `.js` files.

```bash
# Capital need, stress cases and raise engine (compare with Part 3 of the brief)
NODE_PATH=$(npm root -g) node tools/verify-funding-numbers.js "$PWD/dashboard/tejas-revenue-dashboard.html"

# The cost-plan table as the dashboard reads it: burn at a given MRR, break-even MRR,
# fixed-cost scale (used to spot the unit question in decision D2)
NODE_PATH=$(npm root -g) node tools/check-burn-table-units.js "$PWD/dashboard/tejas-revenue-dashboard.html"

# Working-capital and capex review of the latest dashboard (no browser needed; compare with docs/REVIEW-working-capital-and-capex.md)
node tools/audit-wc-capex.cjs


# Design tokens, functions and classes in the dashboard
python3 -I tools/inspect-dashboard.py dashboard/tejas-revenue-dashboard.html

# Summarise a block of the dashboard's code by line range
python3 -I tools/summarise-code-block.py dashboard/tejas-revenue-dashboard.html 2892 2900
```

For the base case, `verify-funding-numbers.js` should show a peak funding gap of ₹72.3 Cr in Q11, round 1 of ₹40 Cr in Q1, round 2 of ₹45 Cr in Q4, and ₹85 Cr of equity in total. In its output, `peakX` and `needBaseX` count the burn bucket once. Line numbers in the summariser example refer to this version of the dashboard.

An earlier copy of the verify script read the wrong key (`burn` instead of `loss`), so its burn-excluded numbers were really the burn-included ones. The corrected script above replaced it, and the old copy is not included.
