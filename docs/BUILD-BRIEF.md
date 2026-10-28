# Tejas funding page: build brief

This is the brief for rebuilding page 03 of the Tejas investor dashboard (`dashboard/tejas-revenue-dashboard.html`) as a funding story. It is written so that someone who has not seen the project can build the page.

It was delivered in chat on 28 October 2026 as seven messages (Parts 1, 2, 3a, 3b, 4a, 4b and 5). They are reproduced here word for word; only the part headings were turned into Markdown headings. The cover note that came with them is at the end, minus its first and last lines, which only made sense in the chat.

The reference values in Part 3 come from the dashboard's own model. The capital-need path, the stress cases and the raise engine can be re-run with `tools/verify-funding-numbers.js` (see the README). Open decisions D1 to D11 are in Part 5 and need founder answers before the build is final.

**Contents**

- Part 1 of 5 · What we're building and why
- Part 2 of 5 · The dashboard you're extending
- Part 3a of 5 · The model: capital, the gap, the raise engine
- Part 3b of 5 · The model: debt, price, return, ROCE, stress
- Part 4a of 5 · The page and its nine beats: layout, beats 1–4
- Part 4b of 5 · The nine beats: 5–9
- Part 5 of 5 · Open decisions, build order, acceptance checks
- Cover note

---

## Part 1 of 5 · What we're building and why

*(Written so someone who has seen none of our chat can build it. Parts 2–5 follow.)*

**What it is.** The funding page of the Tejas investor dashboard. Today that is page 03, "Cost of revenue, margins & valuation". It becomes a guided story for potential investors (Indian VCs): the left side is one Q1–Q16 chart that builds up in steps, and the right side shows the formula and business logic behind whatever just appeared. It extends the existing single-file HTML dashboard. The other pages stay.

**What a VC must believe after about a minute**
1. Tejas knows where it is (₹1.6 Cr revenue a month, Jul 2026) and where it is going (₹127.6 Cr a month by Q16, Sep 2030).
2. It knows what that takes: how much capital, when, and for what.
3. The raise plan is efficient. There is no clearly better plan for the same dilution, risk and return. We prove this, we don't just claim it.
4. The numbers are drilled down and the assumptions are backed.
5. Their money has a job and a payoff, and they can choose the exit.
6. The capital is used well.

Test: a stranger can say back the ask, the plan, the return and the biggest risk.

**The story in one line.** Growth consumes capital in four buckets → the business earns part of it back → the gap is what we raise → the model works out when → each round is priced by stage → here is what the first investor gets → here is why this plan and not another.

**Where the four deck chapters live**

| Deck chapter | On this page |
|---|---|
| 1. 4-year revenue scale-up, by channel and product | Already built (pages 02, 04, 05). This page quotes it and uses it to derive capital. |
| 2. Capital utilisation: Capex, Intangibles, Working capital, Burn | Beats 2–4 |
| 3. Fundraising roadmap: how much, when | Beats 5–6 |
| 4. Next 14 months | Beat 7 |
| New: what the investor gets, and why this plan | Beats 8–9 |

**Decisions already made, so don't reopen them**
- Net the business's own cash against capital, so the page shows the gap, not gross capital.
- The model decides when to raise. Round 1 (₹40 Cr) is the only given.
- The valuation method changes with stage: a revenue multiple while scaling, a profit multiple once profit is solid.
- Growth is an input only. It is quoted, not redrawn.
- The VC picks the exit quarter (default Q16).
- "Least capital, highest return" is tested as efficiency, not claimed.
- The page must look like the rest of the dashboard.
- Working-capital default: the file's own cash cycle (41 days today, falling to 33.6) is the plan, and flat 60 and 90 days are stress cases. The pre-launch plant build (30%) is a slider, with its reason shown.

**What to hand the builder**
1. `tejas-revenue-dashboard.html`: the live file (~3,170 lines, ~640 KB, fonts embedded). Open it and click through all 7 pages first.
2. The spec "Tejas — Cash Burn, CAPEX & Fundraising Dashboard": the two-column, step-by-step idea. It is still the source for the left/right principles.
3. The earlier Codex question-and-answer transcript: background only.
4. This brief.

**Do not**
- Reuse concept previews A–D. Their figures (₹280 Cr deployed, ₹180 Cr equity, 20% for ₹40 Cr, 6.3×) are invented and contradict the model (₹426 Cr, 13.0%). Their chart types (Sankey, dark band, pricing-style cards, smooth step chart) appear nowhere else in the dashboard, which is why they looked foreign.
- Hard-code any number. Every figure, headline included, comes from the model functions. Assumptions are labelled as assumptions.
- Create a second revenue forecast.
- Invent new chart types. Use the dashboard's own.
- Call PAT "profit after tax". In this dashboard it means CM2 minus fixed cost, before tax, interest and depreciation.

---

## Part 2 of 5 · The dashboard you're extending

**Shape of the file**
- It is one self-contained HTML file. Pages are hash routes: `#guide` (00 How to read), `#basis` (01 Model basis), `#revenue` (02), `#finance` (03, the page we change), `#cities` (04), `#products` (05), `#audit` (06 Financials). Steps inside a page look like `#finance/s2`.
- The file is built in layers, and later definitions override earlier ones. `renderFinance` is defined six times, and the live one is the last (around line 2892). Leave the earlier copies alone and add new code as a final layer.
- Page 03 today has three steps, `STEPS.finance = ['Cost of revenue','Margins','Valuation']`, assembled with `stepped('finance',[s1,s2,s3])`. That gives the chevron stepper (`stepBar`), the Prev/Next buttons (`stepNav`), ←/→ keys and `setStep`.
  - Step 1 is `costSection`: capital by quarter plus the capex, working-capital and burn cards.
  - Step 2 is `marginTable`, `bridgeChart` (the PAT waterfall) and `driversList`.
  - Step 3 is a valuation `ledger`, `stakeChart` and `multChart`/`whyMultiple` (the comps number line).

**The model: read it, don't copy numbers out of it**
- `MODEL` holds the revenue-model inputs. `INP` holds the editable inputs, saved in the browser under `tejas-dashboard-inputs-v1` and merged over `INPUT_DEFAULT`. Any new input goes into `INPUT_DEFAULT` and the Edit-inputs panel.
- `view(SCOPE.core)` gives monthly revenue: `.T` is total MRR per quarter and `.M` is per product.
- `capModel()` / `capFin()` give capital by quarter. The cumulative buckets are `factory`, `pp` (product and platform), `wc`, `loss` (burn) and `misc`. `cumTot` is the running total.
- `incomeFin()` gives, per quarter, `mrr, arr, gross, net, cogs, cm1, variable, cm2, fixed, pat` plus `%` versions.
- Key inputs:
  - `INP.valuation` = {todayMRR 1.6, multiple 16, ask 40, milestoneMRR 12}
  - `INP.capital` = {capex: tileP5 40, wood 30, upvc 50, centres 10, labs 10, systems 20, misc 10; firstPhase 30; wcDays 60; burn: the cost-plan table}
  - `MODEL.products[p].launch` = tile Q1, niche Q3, wood Q4, uPVC Q6, waterproofing (key `p5`) Q10

**Helpers to reuse**
- `ledger(rows,[label,value])`, where each row is [operator, label, note, value]. This is the formula panel.
- `howRead(what, why)`, the "How to read / Why it matters" box.
- `pageHead`, `notesBlock` (Sources and notes), `chartSVG`, `yAxis`, `stripAxis`, `smoothPath`, `hbars`, `fitCharts`, `showTip/hideTip`.
- Formatters `fd`, `f0`, `rc`, `pct1`.

**Look and feel.** Use the CSS variables, not copied hex values.
- Page `--paper #FAF9F5`. Panels `--surface #fff`. Sunk areas `#F0EEE6`. Rules `#E8E6DC`.
- Text `--ink #141413`, `--ink-2 #3D3C38`, `--ink-3 #6B6963`.
- Accent (terracotta) `--accent #B4532F`, `--accent-fill #D97757`, tint `--accent-soft #FBECE5`.
- Capital buckets: `--capex #8C5A34`, `--intang #C08A5B`, `--wc #E6CFAE`, `--burn #9C998F`, `--misc #E8E6DC`.
- Products: tile `#2F5F94`, wood `#6A9BCC`, niche `#B4CFEA`, uPVC `#5F7F3A`, waterproofing `#A3567F`. Channels: city `#B08A47`, dealer `#5E8577`. Radius 8px.
- Fonts: Poppins for headings, IBM Plex Sans for body, Lora for explainer text. They are embedded in the file as base64, so add no external font links.

**Components, in words**
- Ivory page, with white panels that have a 2px terracotta top border (`.s-panel` inside `.b-grid`; `c4` is one-third width).
- The page title has a terracotta bar at its left.
- The KPI strip has four cells. The first is tinted `--accent-soft` with a terracotta number.
- The chevron stepper has the active step in terracotta.
- The explainer box is in Lora.
- Ledger rows carry operators (· × = −) and end in a tinted result row.
- A black "Next section" button.
- Footer: "MRR = monthly revenue run-rate · ₹ Cr unless noted · Forecast, not actuals · Q1 = Oct–Dec 2026".

**Kept, adapted, new, removed**
- **Kept as is:** page header, KPI-strip style, the stepper (3 → 5 steps), explainer boxes, Sources and notes, margin table, PAT waterfall, ledger, comps number line, segmented controls and toggles.
- **Adapted:**
  - capital-by-quarter chart (five buckets → four)
  - capital cards
  - valuation ledger (one per round)
  - "What the ₹40 Cr becomes" (value over time, after dilution)
  - KPI strip contents
- **New:** gap chart, cash line with raises, price lane, round-1 zoom, investor-return panel, ROCE number, "Why this plan".
- **Removed:** the flat dashed "₹40 Cr raise" line, the stand-alone "Valuation today" KPI cell, and the "before dilution" note.

---

## Part 3a of 5 · The model: capital, the gap, the raise engine

Conventions: Q1 = Oct–Dec 2026 … Q16 = Jul–Sep 2030. ₹ Cr. MRR is the exit-month run-rate, and a quarter's revenue is 3 × its exit-month MRR. PAT = CM2 − fixed cost, before tax, interest and depreciation. All reference values below come from the live model run in a browser. Your build must reproduce them.

**3.1 Capital consumed (already exists: `capModel` / `capFin`)**
The deck's four buckets map to the file's keys:
- **Capex** = `factory` + `misc`: ₹140 Cr (plants 120, experience centres 10, misc 10)
- **Intangibles** = `pp`: ₹30 Cr (labs 10, systems 20)
- **Working capital** = `wc`: ₹252.1 Cr
- **Burn** = `loss`: ₹4.41 Cr
- **Total at Q16:** ₹426.5 Cr

There are three kinds of block, and each behaves differently:
- **Rule (working capital).** WC_t = (MRR_t − 1.6) × wcDays ÷ 30. It is a level, not a flow. At Q16 it is 126.0 × 2.0 = 252.1. It moves one-for-one with revenue and recycles.
- **Budget (capex, intangibles).** Each item has a fixed Q16 end-state, spread by what it is built with:
  - Tile and waterproofing plant (₹40 Cr): with their combined sales growth.
  - Wood (₹30 Cr) and uPVC (₹50 Cr) plants: 30% (`firstPhase`) in the quarter before launch (wood ₹9 Cr in Q3, uPVC ₹15 Cr in Q5), the rest with the line's own sales.
  - Experience centres (₹10 Cr): with units opened.
  - Labs (₹10 Cr): with cumulative plant spend.
  - Systems (₹20 Cr) and misc (₹10 Cr): with MRR growth.
- **Gap (burn).** Cost plan minus CM2, in ₹ lakh a month by revenue stage, joined by straight lines. It stops when CM2 covers costs, at about ₹27 Cr MRR (Q9). Total ₹4.41 Cr, all spent by Q8.

Reference, cumulative (factory / product & platform / working capital / burn / misc → total):
- Q4: 12.30 / 1.45 / 6.50 / 1.81 / 0.26 → 22.3
- Q5: 29.50 / 3.24 / 11.48 / 2.57 / 0.46 → 47.3
- Q8: 44.55 / 7.23 / 47.60 / 4.41 / 1.89 → 105.7
- Q11: 70.12 / 14.04 / 108.74 / 4.41 / 4.31 → 201.6
- Q16: 130.00 / 30.00 / 252.08 / 4.41 / 10.00 → 426.5

An average, not a driver: each ₹1 of monthly revenue added by Q16 ties up ₹3.38 of capital (₹2.00 receivables, ₹1.11 capex, ₹0.24 intangibles, ₹0.03 burn).

**3.2 What the business earns (already exists: `incomeFin`)**
PAT by quarter, Q1→Q16: −0.18, 0.00, 0.34, 1.29, 2.72, 5.87, 10.33, 15.79, 21.52, 29.07, 38.14, 47.27, 57.44, 68.61, 80.90, 92.88. Cumulative PAT: ₹4.2 Cr at Q5, ₹124.9 Cr at Q11 and ₹472.0 Cr at Q16.

**3.3 The gap (new)**
Gap_t = Σ(capex + intangibles + working-capital build) − Σ PAT, summed from Q1 to Q_t. In file terms that is `cumTot − loss − cumulative PAT`.

The burn bucket is left out on purpose. PAT already carries the operating shortfall, and the burn bucket is a second estimate of the same thing from a different cost plan. Counting both double-counts about ₹4.4 Cr. The two models are not tied together yet. This is open decision D3 in Part 5.

Reference, Q1→Q16:
0.94, 2.35, 14.28, 19.06, 40.50, 50.27, 59.53, 65.11, 68.71, 72.06, 72.31, 63.14, 47.85, 25.09, −5.63, −49.92
- Peak ₹72.3 Cr at Q11. It would be ₹76.7 Cr if burn were kept.
- Self-funding from Q15. At Q16 the business is ₹49.9 Cr ahead.
- It is before tax, interest and depreciation.

**3.4 Cash and the raise engine (new)**
- With no debt, Cash_t = total equity raised to date − Gap_t.
- **Round 1 is an input:** ₹40 Cr in Q1 (`INP.valuation.ask`).
- **Policy inputs (placeholders):**
  - minimum-cash buffer B = ₹10 Cr
  - lead time L = 1 quarter
  - sizing window W = 8 quarters
  - round sizes rounded up to ₹5 Cr
- **Algorithm.** Start after the last raise and find the first quarter b where cash would fall below B with no new raise. Close the next round at max(b − L, last raise + 1). Size it as roundup5( the highest Gap over the W quarters from the close quarter + B − equity already raised ). Repeat until cash stays ≥ B through Q16.
- **Reference output (base case, no debt):**
  - E1 ₹40 Cr lasts through Q4, with cash of ₹20.9 Cr at Q4.
  - At Q5 cash would be −₹0.5 Cr, so b = Q5.
  - E2 closes in Q4 at ₹45 Cr (72.3 + 10 − 40 = 42.3, rounded up).
  - Total equity ₹85 Cr. Lowest cash ₹12.7 Cr (Q11). Cash at Q16 ₹134.9 Cr.
- **What it means for round 1.** ₹40 Cr plus ₹4.2 Cr of profit earned covers ₹44.7 Cr of needs through Q5, short by about ₹0.5 Cr and with no buffer. With a ₹10 Cr buffer, round 2 must close by Q4.

---

## Part 3b of 5 · The model: debt, price, return, ROCE, stress

**3.5 Debt (optional lever, off in the base case)**
Two facilities:
- **Capex term debt.** Draw = s_c × (plant and experience-centre capex spent that quarter). Interest r_c is paid quarterly on the outstanding balance, after a moratorium, then straight-line repayment.
- **Working-capital limit.** Balance_t = s_w × working capital_t (it revolves with receivables). Interest is r_w.

Draws are positive in the cash line. Interest and repayments are negative. Debt lowers the equity needed but adds interest.

Defaults are off (s_c = s_w = 0), which is what the reference numbers above assume. The "more debt" alternative uses placeholders of 50% / 50%, 11% / 10.5%, a 4-quarter moratorium and 16-quarter repayment. Lender terms replace these (decision D4).

**3.6 Price per round (new)**
Pre-money_k = (1 − w_k) × ARR_k × m_arr(k) + w_k × (4 × PAT_k) × m_pat
- ARR_k = 12 × MRR at the round's quarter.
- w_k = clamp((PAT margin_k − 5%) ÷ (20% − 5%), 0, 1). PAT margin is PAT ÷ net revenue: Q4 10.7%, Q5 14.8%, Q6 19.0%, Q8 24.9%, Q16 29.1%.
- Placeholder multiples (D6):
  - m_arr is 16× at Q1 (the file's existing input), then 8× at Q4, 4× at Q8 and 3× at Q16, joined by straight lines.
  - m_pat is 15×.
- **Why a blend and not a hard switch.** At Q5, trailing profit at 20× is ₹218 Cr, below round 1's ₹307 Cr post-money. Round 2 would look like a down round.
- **Round 1:** post-money = 16 × ₹19.2 Cr ARR = ₹307.2 Cr. Pre-money is ₹267.2 Cr. ₹40 Cr buys 13.02%.
- Every multiple needs a cited comparable in Sources and notes. The file already carries Pidilite at about 11.5× sales as the example.

**3.7 First investor's return (new)**
- Stake after round k: s_k = s_{k−1} × pre_k ÷ (pre_k + E_k).
- Equity value at exit T = enterprise value + cash − debt. The enterprise value uses the 3.6 method at T, and the VC may override the multiple.
- Multiple = final stake × equity value ÷ ₹40 Cr.
- IRR = multiple^(1 ÷ years) − 1, where years runs from the investment date (default 1 Oct 2026) to the exit quarter's end. Q16 is 4.0 years.
- For an ARR-priced exit, the multiple splits into growth × multiple change × stake kept × net cash.

Worked example (a formula test, **not a forecast**):
- E2 is ₹45 Cr in Q4 at 8× ARR of ₹58.2 Cr. Pre-money ₹465.6 Cr, post-money ₹510.6 Cr, dilution 8.8%. The stake goes from 13.02% to 11.87%.
- Exit at Q16 at 3× ARR of ₹1,531.7 Cr gives enterprise value ₹4,595 Cr. Add cash of ₹134.9 Cr to get ₹4,730 Cr. × 11.87% = ₹561.6 Cr, which is **14.0×** (IRR 93.6%).
- Split: 79.8 (growth) × 0.1875 (multiple 16× → 3×) × 0.912 (stake kept) × 1.029 (net cash) = 14.0.

**3.8 ROCE (new)**
ROCE_t = 4 × (PAT_t − depreciation_t) ÷ capital employed_t. Capital employed is cumulative capex + intangibles + working capital, with burn excluded. Depreciation placeholders (D8): plants and centres over 10 years, labs, systems and misc over 5, straight line (about ₹21 Cr a year once built). Before depreciation, at Q16: 4 × 92.88 ÷ 422.1 = 88.0%. Label it "pre-tax, simple".

**3.9 Stress cases**
Re-run 3.1–3.4 with one input changed. The P&L stays fixed. All rows are burn-excluded, no debt, with E1 at ₹40 Cr in Q1 and a ₹10 Cr buffer.

| Case | Peak gap | Gap at Q5 | Capital to Q16 | Round 2 | Total equity | Lowest cash |
|---|---|---|---|---|---|---|
| Base, 60-day receivables | 72.3 (Q11) | 40.5 | 426.5 | ₹45 Cr, Q4 | 85 | 12.7 |
| Receivables 45 days | 53.2 (Q8) | 37.6 | 363.5 | ₹25 Cr, Q4 | 65 | 11.8 |
| Receivables 90 days | 129.7 (Q12) | 46.2 | 552.5 | ₹100 Cr, Q4 | 140 | 10.3 |
| Cash cycle 41 days, flat | 50.0 (Q8) | 36.9 | 346.7 | ₹25 Cr, Q4 | 65 | 15.0 |
| Cash cycle 33.6 days, flat | 44.6 (Q7) | 35.5 | 315.6 | ₹15 Cr, Q4 | 55 | 10.4 |
| Plants +20% | 85.3 (Q11) | 46.1 | 450.5 | ₹60 Cr, Q4 | 100 | 14.7 |
| Wood/uPVC plants 100% before launch | 113.6 (Q8) | 99.5 | 426.5 | ₹85 Cr, Q2 | 125 | 11.4 |
| 0% before launch (build with sales) | 58.1 (Q11) | 15.2 | 426.5 | ₹30 Cr, Q6 | 70 | 11.9 |

- **Proposed plan basis (D1).** A cash cycle that glides from 41 days (today, ₹1.65 Cr gross a month) to 33.6 days at ₹12 Cr gross a month (the file's own milestone), then holds. Its results must land between the two flat-cycle rows: peak ₹44.6–50.0 Cr and round 2 of ₹15–25 Cr. The inputs (`cycleToday`, `cycleTarget`) sit in an older part of the file that the live capital model does not read.
- **Earlier chat figures.** The earlier ₹77, 58, 134, 118 and 63 Cr included the burn bucket. Each is about ₹4.4 Cr lower here.
- **"Revenue two quarters late."** It is not in the table, because the model has no delay input. Implement it by shifting the MRR path right by two quarters while keeping the capex dates (conservative).

---

## Part 4a of 5 · The page and its nine beats: layout, beats 1–4

**The page, top to bottom**
1. **Header.** Title with the terracotta bar. Working title: "Capital, funding and returns" (D9). Keep the existing "Edit inputs" button.
2. **KPI strip,** four cells with the first one tinted:
   - Revenue a month: ₹1.6 → ₹127.6 Cr
   - Capital consumed to Q16: ₹426 Cr, with the peak gap (₹72 Cr, Q11)
   - Equity raised: ₹85 Cr (E1 ₹40 Cr in Q1 + E2 ₹45 Cr in Q4)
   - First investor: ₹40 Cr → ₹X at the chosen exit, N×

   Every value comes from the model. The numbers above are the base-case reference.
3. **Chevron stepper with five steps:** 1 Capital it consumes · 2 Earnings and the gap · 3 Funding plan · 4 Next 14 months · 5 Return and proof. Set `STEPS.finance` and `PAGE_NAME.finance`.
4. **Beat area, two columns.** The left panel is about two-thirds wide and holds the chart. The right panel is about one-third and holds the formulas. Both are `.s-panel`.
   - Above the chart: a segmented control that switches beats within the step, and a one-line headline.
   - Below: one `howRead` with a sentence each for "How to read" and "Why it matters".
   - On narrow screens the columns stack.
5. **Prev / Next section buttons** (existing `stepNav`).
6. **Sources and notes,** collapsed. Each assumption goes here with its evidence.
7. **Footer** (existing).

**The chart: one x-axis, stacked lanes**
Every lane uses one Q1–Q16 scale function, with labels like the existing "Q1 Dec 26".
- **Lane A, the hero (about 320 px):** changes with the beat.
- **Lane B, a thin rail:** raises (◆ equity in terracotta, ◇ debt outlined) and launches (small ticks in product colours: wood Q4, uPVC Q6, waterproofing Q10).
- **Lane C, thin:** revenue bars, muted, always present.
- **Lane D, beats 6 and 8 only:** price and investor value.

**Layering rule (from the spec).** Earlier layers stay as muted ghosts. A new layer fades or grows in over about 0.4 s. Honour reduced-motion, which the file already does. Controls sit next to the thing they change.

**Colours: no new hues.** The four capital buckets use their tokens. PAT and the cash line use `--ink`. The gap and the raises use `--accent` and `--accent-soft`. Product colours are for product lines only.

**STEP 1 · Capital it consumes**

*Beat 1 · Growth in (input only)*
- **Question:** what is driving all this?
- **Left:** revenue bars Q1–Q16 in one colour, labelled "₹1.6 → ₹127.6 Cr a month".
- **Right:** a `ledger` of units open × market size × product size × share (reuse the existing logic). It also shows the Q16 split: city ₹90 Cr and dealer ₹37 Cr; tile 31, niche 7.8, wood 28, uPVC 42, waterproofing 18. Links to pages 02, 04 and 05.
- No controls and no new numbers.

*Beat 2 · What the growth consumes*
- **Question:** how much capital, and for what?
- **Left:** cumulative stacked bars per quarter in four buckets (capex including misc, intangibles, working capital, burn), with totals on top (₹1.1 … ₹426). Revenue is ghosted behind. A strip under the chart reads: "Each ₹1 of monthly revenue added by Q16 ties up ₹3.38 = 2.00 + 1.11 + 0.24 + 0.03".
- **Right:** "Three kinds of capital": rule, budget and gap. Each gets a `ledger` of its formula (Part 3.1) plus the existing "How it is sized" lines.
- **Controls:** Cumulative | In the quarter. Click a legend item to isolate that bucket and show its ledger.

**STEP 2 · Earnings and the gap**

*Beat 3 · What the business earns*
- **Question:** how much does the business pay for itself?
- **Left:** PAT bars per quarter on a +/− axis in `--ink`. Capital outflows are negative in their bucket colours ("in the quarter" view). A cumulative PAT line runs across.
- **Right:** a `ledger` of net revenue → CM1 → CM2 → PAT for the selected quarter, plus "Net cash flow before funding = PAT − capex − working-capital build". A collapsed drawer holds the existing margin table and PAT waterfall.
- **Control:** click a quarter to set the equation.

*Beat 4 · The gap*
- **Question:** so what do we actually have to fund?
- **Left:** an area for the gap (cumulative capital − cumulative PAT), filled `--accent-soft` with an `--accent` line. A peak flag reads "₹72 Cr · Q11". There is a zero line and a label "self-funding from Q15". Cumulative capital and cumulative PAT show as faint lines.
- **Right:** a ledger at the selected quarter (default Q11): capital consumed ₹201.6 Cr − burn already inside PAT ₹4.4 Cr − PAT earned ₹124.9 Cr = gap ₹72.3 Cr. A one-line note: "before tax, interest and depreciation".
- **Control:** a quarter scrub.

---

## Part 4b of 5 · The nine beats: 5–9

**STEP 3 · Funding plan**

*Beat 5 · How the gap is funded*
- **Question:** when do we raise, how much, and how long does it last?
- **Left:** the cash-in-hand line, a sawtooth that falls as capital is consumed and jumps at each raise. The minimum-cash buffer is a dashed line. ◆ markers are labelled "E1 · ₹40 Cr · Q1" and "E2 · ₹45 Cr · Q4". The runway from each raise to the next breach is shaded, and the gap is ghosted behind. If any setting leaves cash below zero, show that quarter in an `--accent-soft` band labelled "Funding gap". Never silently assume another raise.
- **Right:** a card for the selected raise, using the same anatomy as the existing capex cards: When · How much · What it pays for (sources and uses until the next raise) · How long it lasts · What triggers the next one. Below it, the engine rule from Part 3.4 as a `ledger`.
- **Controls, in a closed "Explore the plan" drawer:**
  - minimum cash
  - lead time
  - sizing window
  - debt share of capex
  - debt share of receivables
  - pre-launch build % (0–100, default 30)

  Any change re-runs the engine and redraws everything, including the KPI strip.

*Beat 6 · What each round is priced at*
- **Question:** at what valuation, and why that multiple?
- **Left:** Lane D under the cash chart shows pre-money per round as steps. Each step has a chip for its method ("16× ARR", "8× ARR", … or the blend weight), and the multiple glide runs as a thin line.
- **Right:** a round selector E1 | E2 and a `ledger`: ARR × multiple (or ARR value, profit value and weight) = pre-money; + raise = post-money; stake sold; dilution to earlier holders. Below it, the existing comps number line with each round's multiple marked.
- **Controls:** the multiples live in the drawer.

**STEP 4 · Next 14 months**

*Beat 7 · Round 1 opened up*
- **Question:** what does the first ₹40 Cr actually do?
- **Left:** the same chart zoomed to Q1–Q5, with quarterly (not cumulative) bars by bucket. Two lumps are called out: the wood plant pre-build of ₹9 Cr in Q3 and the uPVC plant pre-build of ₹15 Cr in Q5. Launch ticks show wood in Q4 and uPVC in Q6 (just past the edge). The cash line is drawn across.
- **Right:** sources and uses to Q5, the 14-month mark (Dec 2027).
  - **Uses ₹44.7 Cr** (burn excluded): factory ₹29.5 Cr (66%), receivables ₹11.5 Cr (26%), labs and systems ₹3.2 Cr (7%), misc ₹0.5 Cr (1%).
  - **Sources ₹44.2 Cr:** E1 ₹40.0 Cr plus ₹4.2 Cr of profit earned.
  - **Short ₹0.5 Cr.** Add a ₹10 Cr buffer and round 2 must close in Q4.
  - **Before → after, at month 14:**
    - MRR ₹1.6 → ₹7.3 Cr
    - CM2 20.8% → 28.2%
    - units open 4 → 14
    - product lines live 2 → 3 (tile and niche today, wood from Q4)
    - plant pre-builds done: wood in Q3, and uPVC in Q5 ahead of its Q6 launch
    - regions: cities and dealer zones open at Q5, read from the model

**STEP 5 · Return and proof**

*Beat 8 · What the first investor gets*
- **Question:** what does my ₹40 Cr become, and what does that depend on?
- **Left:** Lane D shows the value of the first investor's stake by quarter (stake × implied equity value, using the pricing method). A draggable exit marker defaults to Q16. The headline reads "₹40 Cr in → ₹X Cr at Q16 · N×". The formula-test example gives 14.0×.
- **Right:** a return `ledger`: investment ₹40 Cr → × growth → × multiple change → × later dilution → × net cash = multiple, with IRR. One ROCE card reads "Company ROCE at Q16: 88%, pre-tax, before depreciation", with a thin ROCE strip.
- **Controls, the VC picks:**
  - exit quarter (Q8–Q16)
  - exit multiple (2× | 3× | 5× ARR, or the profit method)
  - plan achievement (100% | 70% | 50% of the revenue plan, which scales ARR and holds dilution fixed)

*Beat 9 · Why this plan*
- **Question:** is there a better plan, how fragile is this one, and what does it rest on?
- **Left:** a dot plot with one dot per plan. The x-axis is total equity raised (₹ Cr) and the y-axis is the first investor's multiple at the chosen exit. A filled dot survives every stress case without an extra raise, and a hollow dot does not. A frontier line joins the dots that no other plan beats on both axes, and our plan is labelled.
  - The plans come from the same engine, run over a policy grid: buffer 5, 10, 15 or 20; debt shares 0 or 50% each; pre-launch build 0, 30 or 100%.
  - Fallback for a first version: a ledger with inline bars, which is the file's own idiom.
- **Right, three compact blocks:**
  1. **Stress toggles:** receivables 90 days, plants +20%, revenue two quarters late, and build-all-before-launch. Each redraws the cash line and shows the new peak, the new round 2, and whether it is still covered.
  2. **Top assumptions,** ranked by how much they move the peak gap (receivable days, pre-launch build, plant cost). Each has its evidence line.
  3. **One sentence generated from the numbers,** such as "No plan we tested raises less equity and survives all stress cases", or the honest opposite.
- If another plan beats ours, the page says so and the plan changes. Don't hide it.

**Copy rules.** Use plain words: "capital consumed", "gap", "raise", "runway", "stake", "multiple". Define each at first use in a `howRead`. Label every assumption as an assumption. Every number must trace to a formula in the right panel.

---

## Part 5 of 5 · Open decisions, build order, acceptance checks

**Decisions the founders must make.** The builder should not guess these. Each has a proposed default, so work can start in parallel.

| # | Decision | Proposed default |
|---|---|---|
| D1 | **Working-capital basis.** The spec says 60 days. The file also holds a 41 → 33.6-day cash cycle (stock and credit) in an older section. | Cash-cycle glide is the plan. Flat 60 and 90 days are stress cases. It is the biggest lever: the peak gap is ₹44.6–50.0 Cr vs ₹72.3 Cr. |
| D2 | **Cost-plan units.** The spec says operating expenditure is ₹ crore a year (₹78 Cr at ₹4.5 Cr MRR). The dashboard reads the same table as ₹ lakh a month (₹78 L), about 8× smaller. The P&L's own fixed cost backs the dashboard's reading (₹0.65 Cr a month at Q4, ₹5.8 Cr in year 1). If the spec's unit were right, costs and the funding need would be several times larger. It is probably a labelling slip in the spec, but get it confirmed in writing. | Until confirmed, the P&L's PAT is the record, and the six-category opex chart is not shown. |
| D3 | **Burn double-count.** The burn bucket and the P&L's fixed cost estimate the same shortfall. | Exclude burn from the gap (peak ₹72.3 Cr). Keeping it is the conservative option (₹76.7 Cr). Longer term, tie the cost plan to the P&L. |
| D4 | **Debt terms:** amounts, rates, tenor, security. | Debt off in the base case. The "more debt" alternative uses the placeholders in 3.5. Lender indicative terms are needed. |
| D5 | **Raise policy.** | Buffer ₹10 Cr, lead 1 quarter, window 8 quarters, round up to ₹5 Cr. |
| D6 | **Valuation multiples and blend thresholds.** | Placeholders in 3.6. Each needs a cited comparable. |
| D7 | **Round 1 terms and date.** | ₹40 Cr at ₹307.2 Cr post-money (13.02%), investment date 1 Oct 2026 for IRR. |
| D8 | **Depreciation lives for ROCE.** | Plants and centres 10 years, labs, systems and misc 5 years. |
| D9 | **Page and nav name.** | "03 Capital, funding & returns". |
| D10 | **The spec's two "1Y" milestones** (MRR 4.5 and 6). They are only needed if the opex view is built. | Park until D2 is resolved. |
| D11 | **Plant capacity.** The spec says plant timing should follow capacity (tonnes). The model times plants by sales share. At Q16, uPVC revenue is ₹509 Cr a year on a ₹50 Cr plant, about 10× turnover. Expect a VC to ask. | Add per-plant capacity inputs, or state the assumption in Sources and notes. |

**Build order**
1. Work on a copy and keep the original untouched. Back it up first.
2. Read the file. Click all seven pages, then read the last `renderFinance`, `capModel`, `capFin` and `incomeFin`.
3. Add the new inputs to `INPUT_DEFAULT` and the Edit-inputs panel: policy, multiples, debt, depreciation, investment date.
4. Write the pure functions with no drawing, as a final code layer: `gapFin()`, `raisePlan(policy)`, `priceRound()`, `investorReturn()`, `roce()`, `stressRun()`, `planGrid()`. Test them in a headless browser against Part 3's reference values before drawing anything.
5. Replace `STEPS.finance` and `PAGE_NAME.finance`. Write a new final `renderFinance` using `stepped('finance', [five parts])`.
6. Build the shared lane chart with one x-scale. Then build beats 1 to 9 in order, screenshotting each one against this brief.
7. Add the controls and the "Explore the plan" drawer. Keep keyboard behaviour as it is: ←/→ for steps, segmented controls for beats.
8. Fill Sources and notes with one entry per assumption and its evidence: comps, cash-cycle data, plant quotes, lender terms.
9. Run the checks below.

**Acceptance checks**
1. Every reference value in Part 3 reproduces within ±0.1: the gap array, round 2 of ₹45 Cr in Q4, the worked example at 14.0×, and the stress table.
2. No hard-coded figures. Changing `INP.capital.wcDays` from 60 to 90 must move the chart, the KPI strip, round 2 (to ₹100 Cr) and the stress table together.
3. All lanes line up on the same x positions (test it in the DOM).
4. It looks like the rest of the dashboard: same fonts, tokens and panel style, no new hues, and no new chart idiom except the dot plot. Put a screenshot next to the old page 03.
5. No console errors. Usable at 1440 px and 1024 px wide. Reduced-motion respected.
6. Every number has its formula in the right panel. Every assumption carries an "assumption" label and an evidence line.
7. The 60-second test: a person outside the team can say back the ask, the plan, the return and the biggest risk.
8. The footer "Forecast, not actuals" is kept.

---

## Cover note

I re-ran your dashboard's own model to get the reference figures, and that changed three things from what I told you earlier:

- **₹40 Cr is enough for round 1, just.** Earlier I said round 1 would likely need to be larger than ₹40 Cr. That came from counting the ₹4.4 Cr burn bucket twice, once as burn and once inside the profit figure. With burn counted once, the peak gap is ₹72.3 Cr (not ₹76.7 Cr) and ₹40 Cr falls only about ₹0.5 Cr short through Q5. The model then puts a ₹45 Cr round 2 in Q4, which keeps a ₹10 Cr cash buffer.
- **Product lines live at month 14 is 2 → 3, not 1 → 3.** Tile and niche are already live today.
- **The cost-plan units may be off by about 8×.** Your spec says operating expenditure is ₹ crore a year, but the dashboard reads the same table as ₹ lakh a month. The dashboard's profit-and-loss supports the lakh reading, so it is probably a labelling slip in the spec. If the spec's unit is right, the funding need would be several times larger. Please confirm which is correct before anyone builds; it is decision D2 in Part 5.

Every assumption I added (the cash buffer, the valuation multiples, the debt terms, the depreciation lives) is a placeholder, labelled as one, and listed in Part 5 for the founders to replace.
