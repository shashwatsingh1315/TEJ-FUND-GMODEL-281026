# Working capital and capex: model review

28 October 2026. Reviewed: `workspace-2026-10-28/outputs/Tejas_Revenue_Dashboard_1041_Updated.html`, the live (last-defined) `capModel`, `gapFin`, `debtFin` and `raisePlan`. Every figure below comes from that file's own code. Re-run them with:

```bash
node tools/audit-wc-capex.cjs
```

## Short answer

The arithmetic is sound. The drivers are not there yet. Working capital and capex are both fixed assumptions spread over time. Neither is derived from how Tejas actually ties up cash or adds capacity. That matters because working capital is ₹249 Cr of the ₹419 Cr of capex, intangibles and working capital consumed by Q16, and it largely sets the ₹200 Cr equity figure.

Three findings each move the equity needed by ₹20 Cr or more:

| # | Finding | Live plan | Changed | Effect |
|---|---|---|---|---|
| W1 | Working capital uses a flat 60 days. The dashboard's own evidence gives about 41. | ₹200 Cr equity | ₹130 Cr | ₹70 Cr less equity, a smaller round 2 |
| C1 | Plants are paid for as sales arrive, not before. | ₹200 Cr, round 2 in Q4 | ₹220 Cr, round 2 in Q2 (plants built 2 quarters ahead) | ₹20 Cr more equity; round 2 two quarters sooner |
| T1 | No income tax anywhere in the cash line. | Cash ₹22.8 Cr at Q16 | −₹29.6 Cr | The plan runs out of cash in Q14 |

## What is already right

- Working capital is treated as a balance: only the increase is funded, the opening balance is excluded, and the 365-day convention is correct (fixed on 28 Oct).
- Capex reconciles to the spec's ₹170 Cr end state and is not dumped into Q16. Every quarterly flow is positive. Wood and uPVC get a pre-launch build.
- Burn is not counted twice against operating profit.
- Stress cases run through the same engine with the P&L held fixed.
- Plant debt excludes centres, labs, systems and misc.
- The tile and waterproofing plant budget passes a capacity check against the file's own line costs (C2).

## Working capital

**W1. A flat 60 days, when the file already holds a driver.** The live rule is WC = annualised exit-month revenue × 60 ÷ 365. The 60 days comes from the spec ("a 60-day requirement"). An older layer of the same dashboard, still in the file but no longer read by the live capital model, gives the evidence:

- Direct orders are paid before dispatch (note 14, deck slide 13). They are 59% of orders.
- Stock turns in about 21 days.
- The 41% of orders from dealers carry about 52 days of credit.

The revenue model already splits every quarter into cities (RT) and dealer zones (DD). Combining the two gives WC = 21 days × all sales + 52 days × dealer sales. That rebuilds **42.7 days at Q1**, which matches the 41 days the file quotes for today. As dealers fall from 42% to 29% of revenue, it drifts down to **36 days by Q16**. On this basis the peak gap is ₹115 Cr and equity is **₹130 Cr**, against ₹187 Cr and ₹200 Cr today.

So 60 days sits 46–66% above the business's own figures (41 days today, 36 at Q16) and adds about ₹70 Cr of equity, which means dilution. Either 60 days rests on something the file doesn't show (uPVC project terms, a planned dealer push, stock for new lines), and it should be built from those parts, or it is a cushion and belongs in the stress cases. Two caveats: the 21 and 52 days appear in the file without a cited source, and the mapping of cities to direct orders and dealer zones to dealer credit needs confirming. The Q1 split of 58% cities lines up with 59% direct.

**W2. No split into stock, customer credit and supplier credit.** Stock and supplier credit move with cost of goods, about 50% of revenue, while customer credit moves with the invoice. Measuring everything in days of revenue overstates stock and leaves supplier credit at zero. With 30 days of supplier credit, equity falls to ₹95 Cr. Actual creditor days are needed.

**W3. uPVC doors, windows and façades is treated like adhesive.** It is the largest line at Q16: ₹42.5 Cr a month, a third of revenue. Window and façade work is usually ordered and billed by project, with advances, stage billing and retention, so its cash profile can differ a lot from bagged adhesive in either direction. It needs its own terms.

**W4. Smaller points.**
- No stock or dealer pipeline is built before a launch (wood Q4, uPVC Q6, waterproofing Q10). It arrives with the sales.
- GST is ignored by instruction, but dealers owe the GST-inclusive invoice. On the channel basis that is about ₹11 Cr more at Q16 (18% of ₹64 Cr of dealer credit).
- Balances are quarter-end only. The dashboard already says this.

## Capex

**C1. Plants are paid for as sales arrive.** Each plant's spend is its Q16 budget × (sales this quarter ÷ sales at Q16). Apart from 30% of wood and uPVC in the quarter before launch, capacity appears in the same quarter as the sales it serves. In practice capacity and vendor payments come first.
- 1 quarter ahead: ₹210 Cr of equity, with round 2 in Q3.
- 2 quarters ahead: ₹220 Cr, with round 2 in Q2. Round 1 then carries the business alone for one quarter instead of three.

These are lower bounds, because the end state stays at ₹140 Cr. Waterproofing gets no pre-launch build at all: it shares the tile plant, which tracks combined sales, so that plant grows ₹3.4 Cr in Q10, the launch quarter itself.

**C2. Plant size is a budget, not a capacity calculation.** The spec asks for "required capacity → existing capacity gap → investment timing". The live model uses the spec's fixed budgets (₹40 / 30 / 50 Cr) with no capacity input.
- **Tile, waterproofing and niche pass.** The file's own line costs are ₹1.65 Cr for 2,100 T a month at ₹16.5 a kg, one shift. Q16 sales on these products need about 16.5 lines on one shift (₹27 Cr) or about 8 on two. The ₹40 Cr covers that.
- **Wood (₹30 Cr for ₹335 Cr of ARR, 11×) and uPVC (₹50 Cr for ₹509 Cr of ARR, 10×) have nothing behind them**: no tonnage, no capacity and no quote in the file. They are ₹80 Cr of the ₹120 Cr plant spend and 55% of Q16 revenue. This is open decision D11.
- Niche adhesive reaches ₹93 Cr of ARR with no plant line of its own. That is fine if it runs on the tile lines (it fits above) or is outsourced, but the model should say which.

**C3. No headroom at Q16, and nothing after it.** Every plant reaches 100% of its budget exactly at Q16 sales, while revenue is still growing 13.8% a quarter. The exit valuation assumes that growth continues, but the capacity to deliver Q17 onward isn't paid for in the Q16 cash. There is no maintenance capex either.

**C4. Budgets don't respond to the revenue plan.** Capex stays ₹170 Cr whether revenue comes in 30% lower or higher. Revenue stresses therefore move working capital but not capex. That is conservative on the downside and optimistic on the upside.

## Outside the question, in the same cash line: income tax

Operating profit is before tax, and no tax is paid anywhere in the plan. At 25.17% on operating profit less depreciation, with losses carried forward, tax starts in Q8 and reaches **₹52 Cr by Q16**. The live ₹200 Cr plan then goes below zero in Q14 and ends Q16 at −₹29.6 Cr. The gap peaks in Q15, when profit and tax are largest, so the tax lands right on the peak.

## Sensitivities

Same P&L and same raise policy (₹10 Cr buffer, 1-quarter lead, 8-quarter window, ₹5 Cr rounding), with one input changed. ₹ Cr.

| Case | WC at Q16 | Days at Q16 | Capex + intangibles at Q5 | Peak gap | Equity | Rounds |
|---|---|---|---|---|---|---|
| **Live: flat 60 days** | 251.8 | 60.0 | 33.2 | 187.3 (Q15) | **200** | Q1 40 + Q4 125 + Q11 35 |
| Flat 90 days | 377.7 | 90.0 | 33.2 | 301.5 (Q16) | 315 | Q1 40 + Q4 175 + Q11 100 |
| Flat 45 days | 188.8 | 45.0 | 33.2 | 138.9 (Q14) | 150 | Q1 40 + Q4 95 + Q11 15 |
| Flat 41 days (file: cycle today) | 172.1 | 41.0 | 33.2 | 128.3 (Q13) | 140 | Q1 40 + Q4 90 + Q11 10 |
| Flat 33.6 days (file: target) | 141.0 | 33.6 | 33.2 | 108.8 (Q13) | 120 | Q1 40 + Q4 75 + Q11 5 |
| **Channel: 21d stock + 52d dealer credit** | 151.9 | 36.2 | 33.2 | 115.2 (Q13) | **130** | Q1 40 + Q4 80 + Q11 10 |
| Channel + 30d supplier credit | 89.7 | 21.4 | 33.2 | 80.2 (Q11) | 95 | Q1 40 + Q4 55 |
| Channel: 30d stock + 75d dealer credit | 217.9 | 51.9 | 33.2 | 159.4 (Q14) | 170 | Q1 40 + Q4 110 + Q11 20 |
| Plants built 1Q ahead of sales | 251.8 | 60.0 | 36.9 | 199.3 (Q15) | 210 | Q1 40 + Q3 110 + Q10 60 |
| **Plants built 2Q ahead of sales** | 251.8 | 60.0 | 41.6 | 209.8 (Q14) | **220** | Q1 40 + Q2 100 + Q9 80 |
| Plants, centres, labs 2Q ahead | 251.8 | 60.0 | 43.3 | 213.9 (Q14) | 225 | Q1 40 + Q2 100 + Q9 85 |
| Plants +20% | 251.8 | 60.0 | 38.8 | 209.0 (Q15) | 220 | Q1 40 + Q4 135 + Q11 45 |

## What to change, in order

Each change moves the ask, so each needs founder inputs before it replaces the plan. Until then the file's own figures can stand in, labelled as placeholders.

1. **Build working capital from its parts.** Stock days on cost of goods, customer credit by channel, supplier days, and uPVC's own terms. Keep flat 60 and 90 days as stress cases.
   *Inputs needed:* debtor days by channel, stock days, creditor days, and uPVC advance, stage-billing and retention terms.
2. **Make capex capacity-led.** For each plant: capacity, cost per unit of capacity, build lead time, and the utilisation that triggers the next phase. Spend comes before the sales it serves. Show the capacity in place at Q16 against Q17–Q18 demand.
   *Inputs needed:* wood and uPVC capacity and quotes, build lead times, and whether niche runs on the tile lines or is outsourced.
3. **Add income tax to the cash line,** after depreciation and losses carried forward.
