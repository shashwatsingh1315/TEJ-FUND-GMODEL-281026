# Working capital and capex: model review

29 October 2026. Reviewed: `workspace-2026-10-28/outputs/Tejas_Revenue_Dashboard_1041_Updated.html`, the live (last-defined) `capModel`, `gapFin`, `debtFin` and `raisePlan`, including the whole-phase capex layer added on 29 October. Every figure below comes from that file's own code. Re-run them with:

```bash
node tools/audit-wc-capex.cjs
```

Tax and depreciation are out of scope for this review.

## Short answer

The arithmetic is sound. Capex is now bought in whole phases, paid ahead of the demand each phase serves, within the fixed ₹170 Cr spend to Q16. Working capital is still one flat assumption rather than something built from how Tejas actually ties up cash. It is ₹249 Cr of the ₹419 Cr of capex, intangibles and working capital consumed by Q16, and it largely sets the ₹230 Cr equity figure.

| # | Finding | Before | Now or changed | Effect |
|---|---|---|---|---|
| C5 | Capex was spread smoothly with sales. It is now bought in whole phases (done, 29 Oct). | ₹200 Cr, round 2 in Q4 | ₹230 Cr, round 2 in Q3 | ₹30 Cr more equity; this is the new base |
| W1 | Working capital uses a flat 60 days. The dashboard's own evidence gives about 41. | ₹230 Cr equity | ₹165 Cr | ₹65 Cr less equity, a smaller round 2 |
| C2 | Wood and uPVC plant sizes and phases have no capacity or quote behind them. | – | – | Decides when the big phases land |

## What is already right

- Working capital is treated as a balance: only the increase is funded, the opening balance is excluded, and the 365-day convention is correct.
- Capex reaches exactly the spec's ₹170 Cr at Q16 (fixed, as the founders set it). Each item is bought in whole phases, each paid one quarter before demand would pass the capacity already built.
- Burn is not counted twice against operating profit.
- Stress cases run through the same engine with the P&L held fixed.
- Plant debt excludes centres, labs, systems and misc.
- The tile and waterproofing plant budget passes a capacity check against the file's own line costs (C2).
- `work/verify-step-capex.cjs` (1,312 checks) and `work/audit-review.cjs` (937 checks) re-derive capex, cash and the gap independently and reconcile every quarter.

## Working capital

**W1. A flat 60 days, when the file already holds a driver.** The live rule is WC = annualised exit-month revenue × 60 ÷ 365. The 60 days comes from the spec ("a 60-day requirement"). An older layer of the same dashboard, still in the file but no longer read by the live capital model, gives the evidence:

- Direct orders are paid before dispatch (note 14, deck slide 13). They are 59% of orders.
- Stock turns in about 21 days.
- The 41% of orders from dealers carry about 52 days of credit.

The revenue model already splits every quarter into cities (RT) and dealer zones (DD). Combining the two gives WC = 21 days × all sales + 52 days × dealer sales. That rebuilds **42.7 days at Q1**, which matches the 41 days the file quotes for today. As dealers fall from 42% to 29% of revenue, it drifts down to **36 days by Q16**. On this basis the peak gap is ₹154 Cr and equity is **₹165 Cr**, against ₹219 Cr and ₹230 Cr today.

So 60 days sits 46–66% above the business's own figures (41 days today, 36 at Q16) and adds about ₹65 Cr of equity, which means dilution. Either 60 days rests on something the file doesn't show (uPVC project terms, a planned dealer push, stock for new lines), and it should be built from those parts, or it is a cushion and belongs in the stress cases. Two caveats: the 21 and 52 days appear in the file without a cited source, and the mapping of cities to direct orders and dealer zones to dealer credit needs confirming. The Q1 split of 58% cities lines up with 59% direct.

**W2. No split into stock, customer credit and supplier credit.** Stock and supplier credit move with cost of goods, about 50% of revenue, while customer credit moves with the invoice. Measuring everything in days of revenue overstates stock and leaves supplier credit at zero. With 30 days of supplier credit, equity falls to ₹125 Cr. Actual creditor days are needed.

**W3. uPVC doors, windows and façades is treated like adhesive.** It is the largest line at Q16: ₹42.5 Cr a month, a third of revenue. Window and façade work is usually ordered and billed by project, with advances, stage billing and retention, so its cash profile can differ a lot from bagged adhesive in either direction. It needs its own terms.

**W4. Smaller points.**
- No stock or dealer pipeline is built before a launch (wood Q4, uPVC Q6, waterproofing Q10). It arrives with the sales.
- GST is ignored by instruction, but dealers owe the GST-inclusive invoice. On the channel basis that is about ₹11 Cr more at Q16 (18% of ₹64 Cr of dealer credit).
- Balances are quarter-end only. The dashboard already says this.

## Capex

**C5. Capex in whole phases (built into the dashboard on 29 Oct).** The spend to Q16 is fixed. What is modelled is when each phase is bought:

- **Capacity per phase** = Q16 demand × phase cost ÷ item budget. The full budget therefore serves exactly Q16 demand.
- **Phases in place** in a quarter = the fewest phases whose capacity covers demand one quarter later (`capital.leadQ`, default 1).
- **Spend to date** = the cost of the phases in place. Labs follow the plant phases in the same quarter.

Demand is measured in what each item serves, using the same drivers as before.

| Item | ₹ Cr to Q16 | Plan phases (assumptions, editable) | Bought in |
|---|---|---|---|
| Tile adhesive + waterproofing plant | 40 | 8 × ₹5 Cr (modular dry-mix lines, about ₹1.65 Cr each on the ledger) | Q1 · Q7 · Q9 · Q10 · Q12 · Q13 · Q14 ×2 |
| Wood adhesive plant | 30 | ₹9 Cr (30%) before launch, then 2 × ₹10.5 Cr | Q3 · Q8 · Q12 |
| uPVC plant | 50 | ₹15 Cr (30%) before launch, then 2 × ₹17.5 Cr | Q5 · Q9 · Q13 |
| Experience centres | 10 | 20 × ₹50 L (spec) | 1–2 a quarter, Q1–Q15 |
| Labs | 10 | 4 × ₹2.5 Cr, one with each ₹30 Cr of plant | Q1 · Q7 · Q9 · Q13 |
| Systems | 20 | 4 × ₹5 Cr on revenue | Q1 · Q8 · Q11 · Q13 |
| Misc capex | 10 | 10 × ₹1 Cr on revenue | Q1 · Q6 · Q8–Q15 |

Capex plus intangibles by quarter (₹ Cr): Q1 14.0 · Q2 0.5 · Q3 9.5 · Q4 0.5 · Q5 15.0 · Q6 2.0 · Q7 8.0 · Q8 17.0 · Q9 26.5 · Q10 7.0 · Q11 6.5 · Q12 17.5 · Q13 32.0 · Q14 12.0 · Q15 2.0 · Q16 0.

Against the old smooth spread, the base case moves from ₹200 Cr of equity (Q1 40 + Q4 125 + Q11 35) to **₹230 Cr (Q1 40 + Q3 130 + Q10 60)**. The peak gap moves from ₹187 Cr in Q15 to ₹219 Cr in Q14. Phase counts, the first-phase share and the lead are all in Edit inputs.

**C1. Timing.** Spend now comes before the sales it serves. Paying phases in the quarter they are needed instead gives ₹220 Cr; paying 2 quarters ahead gives ₹240 Cr. Waterproofing shares the tile plant, so its capacity comes from that plant's phases rather than a pre-launch build of its own.

**C2. Plant size is a budget, not a capacity calculation.** The spec asks for "required capacity → existing capacity gap → investment timing". The model uses the spec's fixed budgets (₹40 / 30 / 50 Cr) and placeholder phases.
- **Tile, waterproofing and niche pass.** The file's own line costs are ₹1.65 Cr for 2,100 T a month at ₹16.5 a kg, one shift. Q16 sales on these products need about 16.5 lines on one shift (₹27 Cr) or about 8 on two. The ₹40 Cr covers that.
- **Wood (₹30 Cr for ₹335 Cr of ARR, 11×) and uPVC (₹50 Cr for ₹509 Cr of ARR, 10×) have nothing behind them**: no tonnage, no capacity and no quote in the file. They are ₹80 Cr of the ₹120 Cr plant spend and 55% of Q16 revenue. Their phase sizes decide when the largest single payments land (open decision D11).
- Niche adhesive reaches ₹93 Cr of ARR with no plant line of its own. That is fine if it runs on the tile lines (it fits above) or is outsourced, but the model should say which.

**C3. No headroom at Q16, and nothing after it.** Every plant's capacity is sized to exactly Q16 demand, while revenue is still growing 13.8% a quarter. The exit valuation assumes that growth continues, but the capacity to deliver Q17 onward isn't paid for in the Q16 cash. There is no maintenance capex either.

**C4. Budgets don't respond to the revenue plan.** Capex stays ₹170 Cr whether revenue comes in 30% lower or higher. Phase timing follows planned dates even when revenue runs late. That is conservative on the downside and optimistic on the upside.

**C6. Distribution points have no capex of their own.** City dark stores are rented, and their rent is in operating cost ("Godown rent and expenses", ₹1 L a month at Q1 rising to ₹1.04 Cr a month at Q16). Dealer zones are revenue units with no depot cost. The file's own dark-store throughput (₹80 L a month per store) implies 2 stores in Q1, 22 in Q8 and 113 in Q16. With the ₹170 Cr fixed, any set-up cost for them has to come out of misc (₹10 Cr).

## Sensitivities

Same P&L and same raise policy (₹10 Cr buffer, 1-quarter lead, 8-quarter window, ₹5 Cr rounding), with one input changed. ₹ Cr.

| Case | WC at Q16 | Days at Q16 | Capex + intangibles at Q5 | Peak gap | Equity | Rounds |
|---|---|---|---|---|---|---|
| **Live: flat 60 days, phased capex** | 251.8 | 60.0 | 39.5 | 219.4 (Q14) | **230** | Q1 40 + Q3 130 + Q10 60 |
| Flat 90 days | 377.7 | 90.0 | 39.5 | 314.1 (Q15) | 325 | Q1 40 + Q3 170 + Q10 115 |
| Flat 45 days | 188.8 | 45.0 | 39.5 | 177.2 (Q13) | 190 | Q1 40 + Q3 105 + Q10 45 |
| Flat 41 days (file: cycle today) | 172.1 | 41.0 | 39.5 | 166.7 (Q13) | 180 | Q1 40 + Q3 100 + Q10 40 |
| Flat 33.6 days (file: target) | 141.0 | 33.6 | 39.5 | 147.3 (Q13) | 160 | Q1 40 + Q4 95 + Q11 25 |
| **Channel: 21d stock + 52d dealer credit** | 151.9 | 36.2 | 39.5 | 153.7 (Q13) | **165** | Q1 40 + Q3 95 + Q10 30 |
| Channel + 30d supplier credit | 89.7 | 21.4 | 39.5 | 113.2 (Q13) | 125 | Q1 40 + Q4 75 + Q12 10 |
| Channel: 30d stock + 75d dealer credit | 217.9 | 51.9 | 39.5 | 194.8 (Q13) | 205 | Q1 40 + Q3 115 + Q10 50 |
| Phases paid in the quarter needed | 251.8 | 60.0 | 24.5 | 207.4 (Q14) | 220 | Q1 40 + Q3 120 + Q10 60 |
| Phases paid 2 quarters ahead | 251.8 | 60.0 | 41.5 | 228.7 (Q13) | 240 | Q1 40 + Q3 135 + Q10 65 |
| Equal phases for wood and uPVC | 251.8 | 60.0 | 44.7 | 219.4 (Q14) | 230 | Q1 40 + Q3 130 + Q10 60 |
| Plants +20% | 251.8 | 60.0 | 45.3 | 243.4 (Q14) | 255 | Q1 40 + Q2 125 + Q9 90 |

## What to change, in order

Each change moves the ask, so each needs founder inputs before it replaces the plan. Until then the file's own figures stand in, labelled as placeholders.

1. **Build working capital from its parts.** Stock days on cost of goods, customer credit by channel, supplier days, and uPVC's own terms. Keep flat 60 and 90 days as stress cases.
   *Inputs needed:* debtor days by channel, stock days, creditor days, and uPVC advance, stage-billing and retention terms.
2. **Replace the placeholder phases with real ones.** The engine is in the dashboard (Edit inputs → Cost of revenue · capex).
   *Inputs needed:* for each plant, its phases (cost, capacity and build time of each), and whether niche runs on the tile lines or is outsourced; the number of labs and what each serves; the systems roll-out phases; what misc covers, including any dark-store set-up.
3. **Show capacity headroom at Q16** against Q17–Q18 demand.
