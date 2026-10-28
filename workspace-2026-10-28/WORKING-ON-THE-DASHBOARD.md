# Working on the Tejas dashboard

Read this before changing anything. It says where each part of the dashboard comes from, how to rebuild and check it, and the design rules agreed with the founders.

## What it is

`outputs/Tejas_Revenue_Dashboard_1041_Updated.html` is the dashboard: one self-contained file (fonts embedded, no server) with seven pages:

| Page | What it shows |
|---|---|
| 00 | How to read |
| 01 | Model basis |
| 02 | 4Y Revenue Scale-up |
| 03 | Funding & returns |
| 04 | Cities & Dealers |
| 05 | Products |
| 06 | Financials |

Open it in a browser. It is designed for **16:9 laptop screens only**:

- 1536×864 is the main target;
- 1366×768 and 1920×1080 must also work;
- phones are not supported.

The figures are projections from model assumptions, not actuals.

**The HTML is generated. Never edit it by hand.** It is rebuilt from `src/`, and a rebuild overwrites hand edits.

## Folder map

| Path | What it is |
|---|---|
| `src/base/dashboard-base.html` | Every page, the styles, the default inputs (`<script type="application/json" id="inputs-default">`) and the fonts. Holds an empty slot for the capex layer. |
| `src/capex/step-capex-layer.js` | Capex bought in whole phases within the fixed ₹170 Cr spend to Q16. Inserted into the base's slot. |
| `src/page03/` | Page 03, Funding & returns: the six-step chart, its tables, the right-hand panels and the takeaways. Loaded after the base, so it overrides it. |
| `src/build.py` | Puts the three together and writes the dashboard into `outputs/`. |
| `check-all.sh` | Every check, in one command. |
| `work/` | Check scripts and the reports they write. |
| `work/legacy/` | Retired scripts from the earlier way of building. They refuse to run; see its README. |
| `outputs/` | The dashboard plus exports: financing scenarios, cash audit CSV, review HTML. |

### Inside `src/page03/`

Files load in this order, and a later file overrides an earlier one.

| File | What it holds |
|---|---|
| `p03a.js` | Raise policy: round 1 is the ask; round 2 is a fixed amount placed by the cash rule; rounds every 6 months after that are shown but not sized. It also holds the input validation messages. |
| `p03b.js` | The chart toolkit and the **colour system** (`PC`). It draws the four-step money chart, the investor-return and return-on-capital charts, labels and callouts, and the round-timing helper (`roundWhen`). |
| `p03c.js` | Page layout: the key-figures strip, stepper, chart/table cards, data tables, takeaways, headings (`cxHeads`), chart keys (`cxLegends`), the "Assumptions & loan terms" drawer, and `renderFinance`/`setStep`. |
| `panels-b.js`, `panels-b.css` | Right-hand panels for step 1 (Revenue), step 2 (Margins) and step 5 (Investor return). |
| `panels-c.js`, `panels-c.css` | Right-hand panels for step 3 (Growth spending & funding need), step 4 (Raises and cash) and step 6 (Return on capital). |
| `p03.css` | Page 03 layout and chart styles. |

## The one thing that will trip you up: the last definition wins

The base dashboard was built in successive versions, and each version **redefined** functions rather than editing them. So many functions appear several times in `src/base/dashboard-base.html` (`renderFinance` 8 times, `pageHead` 6 times; 63 names in all), and **only the last definition runs**. Page 03's own files come later still, so they override the base.

Before editing a function, find the definition that actually runs:

```bash
grep -n "^function renderGuide\|^renderGuide=function" outputs/Tejas_Revenue_Dashboard_1041_Updated.html
```

The last line number listed is the live definition. If it falls inside the page 03 block (near the end of the file), edit it in `src/page03/`; otherwise edit the base. Editing an earlier copy changes nothing on screen.

Clearing out the dead copies is the planned next clean-up (see "Known gaps").

## Making a change

1. **Edit the right source:**

   | To change | Edit |
   |---|---|
   | Text or logic on any page except 03 | `src/base/dashboard-base.html`, at the live definition |
   | Anything on page 03 | `src/page03/` (table above) |
   | Capex phasing | `src/capex/step-capex-layer.js` |
   | Default inputs | the `inputs-default` JSON in `src/base/dashboard-base.html` |

   Users can also change inputs in the browser under **Edit inputs**. Those edits are kept in that browser only.
2. **Rebuild:** `python3 src/build.py`. To preview without touching `outputs/`, run `python3 src/build.py /tmp/preview.html`.
3. **Check:** `./check-all.sh`. It must end with `All checks passed.` Then look at the pages you changed at 1536×864.
4. **Commit** the source change and the rebuilt `outputs/` file together.

**Skip lines 30–42** of the base and the output when reading them. They hold the base64 fonts, around 30 KB per line. Use `grep -n` and `sed -n 'A,Bp'` to look at code.

## Checks (`./check-all.sh`)

**What you need:** Python 3, Node 18+, and Playwright with Chromium (`npm i -g playwright && npx playwright install chromium`, then `export NODE_PATH=$(npm root -g)` if Node can't find it).

The script runs five checks in order:

1. **Sources match the output.** The rebuilt dashboard must equal `outputs/…html` byte for byte, so nobody has hand-edited the output or forgotten to rebuild.
2. **The scripts parse.** Both inline script blocks pass `node --check`.
3. **`work/verify-step-capex.cjs`** re-derives every capex phase and the funding numbers from the raw inputs (about 1,300 checks).
4. **Financing and cash audit, checked independently:**
   - `work/verify-financing.cjs` re-derives working capital, debt and interest, the cash identity and investor value (3,670 comparisons);
   - `work/audit-review.cjs` re-derives earnings and capital, writes `outputs/Tejas_Capital_Cash_Audit.csv`, and checks page 03's structure.
5. **`work/smoke-test.cjs`** opens all pages (page 03 step by step) at the three laptop sizes. It fails on any console error or a "NaN"/"undefined" on screen.

`node work/export-financing-review.cjs` regenerates `outputs/Tejas_Financing_Scenarios.csv` and `outputs/Tejas_Working_Capital_and_Financing_Review.html`. Run it after any change to the funding model.

## Design rules (agreed with the founders; keep them)

- **Numbers are always computed** from the model, never typed into text.
- **Text style:**
  - a short label naming the thing (e.g. "Projected cash balance");
  - one supporting line;
  - at most a small note;
  - plain finance language, no "how to read / why it matters" paragraphs.
- **Number labels on charts:**
  - one style per chart: ≥ 10 → no decimals, < 10 → one decimal, never a trailing ".0", percentages whole;
  - every bar in a chart carries the same labels;
  - 2–3 callouts per chart at most.
- **Colour has one meaning each** (defined once as `PC` in `p03b.js`):

  | Meaning | Colour |
  |---|---|
  | Revenue | blue `#3976B9` (light `#D3E2F2` as background) |
  | Costs | warm greys, darker = deeper in the P&L: cost of goods `#D6D3C8`, selling `#9C998F`, overhead `#3D3C38` |
  | Profit / earnings / return | green `#24735A` |
  | Loss only | red `#B34641` |
  | Capital | browns, darker = longer-lived: capex `#8C5A34`, labs/systems `#C08A5B`, working capital `#E6CFAE` |
  | Funding: rounds, cash required | orange `#D97757` |
  | Cash | navy `#193B63` |
  | Investor value (step 5 only) | purple `#6C5798` |

- **Page 03 layout:**
  - steps 1–4 are one chart that changes between steps, on one shared ₹ axis; steps 5–6 keep their own scale in the same frame;
  - each data table sits in its own card below the chart;
  - the chart card and the right-hand panel are the same fixed height: 580 px on screens under 960 px tall, 640 px otherwise;
  - each right panel has 2–3 cards and exactly one fold, with text 13.5 px or larger, and must fit without scrolling. `check-all.sh` and the scripts above enforce parts of this.

## Model facts worth knowing

- Revenue grows from ₹1.6 Cr a month today to ₹127.6 Cr in Q16 (Q1 = Oct–Dec 2026).
- **Funding:**
  - round 1 is the ₹40 Cr ask in Q1;
  - round 2 is a fixed ₹200 Cr (input `funding.round2`), placed a quarter before cash would fall under the ₹10 Cr floor, which is Q3;
  - rounds every 6 months after that are shown on the timeline but not sized;
  - in total, ₹240 Cr covers the ₹219 Cr peak cash required (Q14).
- **Capex:** ₹170 Cr to Q16 is fixed (plants 40 + 30 + 50, centres 10, labs 10, systems 20, misc 10), bought in whole phases a quarter ahead of demand. Phase sizes are placeholders until the founders send real ones.
- **Working capital** is 60 days of annualised revenue on the revenue added since today. **GST** is ignored by instruction.

## Known gaps

- **Dead code:** the 63 superseded function copies are still in the base. Removing them, and splitting the base into separate source files per page, is the next clean-up. Prove nothing changes by comparing model outputs and screenshots before and after.
- **Stale export:** `outputs/Tejas_Quarter_End_Financials.csv` comes from an older build and cannot be regenerated by the current scripts. Treat it as stale.
- **Missing reasons:** some cost lines have no stated reason in the model: discounts, NPAs/returns, customer acquisition, marketing, and finance and legal fees. Ask the founders.
- **Downloads in the viewer:** the Download buttons don't work when the dashboard is viewed inside the claude.ai artifact viewer. They work when the HTML file is opened directly.
- **Earlier funding plan:** `docs/REVIEW-working-capital-and-capex.md` (repo root) describes an earlier funding plan (₹230 Cr in three rounds).

## Where it is published

The founders view a private copy at `https://claude.ai/artifact/ULWUGd9X7vbvQJge9XXrpP`. Republishing it needs edit access from its owner. Git commits never update it on their own.
