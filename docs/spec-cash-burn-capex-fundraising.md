# Tejas — Cash Burn, CAPEX & Fundraising Dashboard
**Master Data, Quarterly Financial Model & Animated Dashboard Specification**

## 1. Overall dashboard architecture

The dashboard should follow the same progressive storytelling approach as the revenue dashboard.

It must use a **two-column layout throughout the entire experience**.

### LEFT COLUMN — Financial visualization (~65–70% width)

This is where the chart evolves through successive animation beats.

- One continuous Q1–Q16 timeline.
- Revenue, expenditure, cash burn, CAPEX, working capital, and fundraising progressively enter the visualization.
- Earlier information remains visible, fades, transforms, or gets consolidated depending on the beat.
- Consistent colours for every expense and investment category.
- Each successive beat should build on the previous one, rather than introduce an unrelated chart.

### RIGHT COLUMN — Formula, assumptions & business logic (~30–35% width)

This column explains **where the numbers displayed on the left come from and why those assumptions are justified**.

The contents change in synchronization with the animation.

For every financial item being introduced, show:

1. **Formula:** How the value is mathematically calculated.
2. **Inputs:** The underlying assumptions, volumes, unit costs, and growth drivers.
3. **Business logic:** Why that expense or investment is needed and what triggers its increase.
4. **Quarterly derivation:** How the milestone assumption translates into actual Q1–Q16 values.

For example, when employee salary expenditure appears on the left, the right column should show the headcount and compensation logic generating that cost.

When factory CAPEX appears, the right column should explain the capacity requirement, factory investment assumption, and why the investment is scheduled in that particular quarter.

**This must be a formula-backed financial explanation, not a sidebar containing generic descriptions.**

---

## 2. Financial modelling requirement — critically important

**The dashboard must show financials quarter by quarter from Q1 to Q16, NOT the five annual milestone columns supplied below.**

The supplied figures are control points for constructing the model.

The model must calculate the complete underlying quarterly financial schedule, including:

- Revenue for each quarter.
- Each of the six operating expense categories for each quarter.
- Total operating expenditure and net operating result for each quarter.
- Cumulative expenditure through each quarter.
- CAPEX investment in each quarter, split by category.
- Working capital requirement and changes in working capital in each quarter.
- Quarterly net cash flow and cumulative funding requirement.
- Fundraising events and closing cash balance.

The model must calculate the progression between milestones, using operating drivers wherever possible.

**Do not divide the annual figures by four and repeat them across the year.** These are annualized run-rate assumptions at different milestones, not necessarily actual expenditure during an entire financial year.

Use monthly calculations where necessary, then aggregate the relevant three months into each quarter.

The existing revenue dashboard/model should be the common source for the revenue progression. There must not be a second, conflicting revenue forecast.

All visualizations, milestone calculations, cumulative values, and fundraising requirements must originate from this same Q1–Q16 financial model.

---

## 3. Source financial assumptions

MRR is in ₹ crore per month. ARR and operating expenditure are in ₹ crore per year.

| Metric | 1Y-A | 1Y-B | 1.75Y | 2.5Y | 4Y |
|---|---:|---:|---:|---:|---:|
| **MRR** | **4.5** | **6** | **10** | **25** | **100** |
| **ARR** | **55** | **72** | **120** | **300** | **1,200** |
| Office & admin | 13 | 16 | 25 | 50 | 150 |
| Employee salaries | 45 | 55 | 80 | 150 | 475 |
| Marketing / branding / CAC | 8 | 8 | 25 | 50 | 100 |
| Software | 6 | 7 | 15 | 35 | 80 |
| Tours & travel | 4 | 4 | 8 | 20 | 80 |
| Legal / CA / CS | 2 | 2 | 3 | 5 | 15 |
| **Total operating expenditure** | **78** | **92** | **156** | **310** | **900** |
| **Net (ARR − listed expenses)** | **−23** | **−20** | **−36** | **−10** | **+300** |

The Net figures reconcile to the six listed expense categories. They must not automatically be treated as actual cash flow unless production costs and other necessary adjustments have also been accounted for.

The first MRR of ₹4.5 Cr annualizes to ₹54 Cr, versus the stated ₹55 Cr ARR. The two milestones labelled 1Y also require distinct placement or scenario treatment before building the quarterly schedule.

### How operating expenditure should be derived

The right-side explanation should connect the expenditure assumptions to actual operating drivers wherever these are available.

| Category | Formula / underlying business logic |
|---|---|
| Office & admin | Number/type of offices and facilities × recurring office, rental, utility and administration costs |
| Employee salaries | Headcount by function × fully loaded compensation |
| Marketing / CAC | Customer acquisition activity, marketing programmes, events and branding expenditure |
| Software | Number of users, systems, licences, infrastructure and development/maintenance costs |
| Tours & travel | Team size × travel frequency × average trip cost |
| Legal / CA / CS | Compliance, statutory, audit, legal and professional-service requirements |

The figures in the source table act as **milestone targets against which these calculations must reconcile**. Where detailed drivers are unavailable, expose the assumptions instead of fabricating them.

---

## 4. CAPEX & working capital assumptions

All values below are cumulative targets by Q16.

| Investment category | Q16 end-state |
|---|---:|
| Tile adhesive factory + P5 | ₹40 Cr |
| Wood adhesive factory | ₹30 Cr |
| UPVC / facades factory | ₹50 Cr |
| Experience centres (20) | ₹10 Cr |
| Laboratories | ₹10 Cr |
| Technology systems | ₹20 Cr |
| Miscellaneous CAPEX | ₹10 Cr |
| **Total CAPEX** | **₹170 Cr** |

Working capital is additional, based on a **60-day requirement**. The model must specify the underlying working-capital base before calculating the amount.

### CAPEX modelling logic

The ₹170 Cr must NOT appear as expenditure incurred entirely during Q16.

The model needs to determine when each investment occurs across the 16 quarters.

The right-side explanation should use the following logic:

- **Factories:** Required production capacity → existing capacity gap → investment timing → factory CAPEX.
- **Experience centres:** Planned centre rollout × cost per centre. The specified end-state is 20 centres for ₹10 Cr total.
- **Laboratories:** Required testing / R&D infrastructure → number and size of facilities → investment.
- **Technology systems:** Required technology capabilities → implementation phases → investment cost.
- **Miscellaneous:** Explicit provision, with planned deployment rather than arbitrary allocation.
- **Working capital:** Applicable operating base × 60-day requirement, with the cash flow reflecting the change in working capital between quarters.

The end-state totals are fixed assumptions from the source. Quarter-wise deployment is the modelling task.

---

# 5. Animation sequence — left visual + right logic

## Beat 1 — Revenue

**LEFT:**

Start with the existing revenue bars across Q1–Q16, showing the quarterly progression.

The model must connect to the existing revenue dashboard, whose milestone MRR values are:

₹4.5 Cr → ₹6 Cr → ₹10 Cr → ₹25 Cr → ₹100 Cr.

**RIGHT:**

Explain how quarterly revenue is derived:

- Number of active cities / markets.
- Revenue per city.
- City growth and maturity curves.
- Category expansion.
- Total revenue calculation.

Show the relevant formula and assumptions from the revenue model, rather than repeating a generic revenue description.

## Beat 2 — Operating expenditure enters

**LEFT:**

Grey out the revenue bars while keeping them visible in the background.

Introduce operating expenditure using stacked bars, with six distinct colours for the categories.

All six categories enter together to establish the full cost structure.

The underlying quarterly expense amounts must be calculated from the milestones, not directly taken from the annual table.

**RIGHT:**

Show the operating expenditure equation:

**Total OPEX = Office & admin + Salaries + Marketing/CAC + Software + Travel + Legal**

Display the exact drivers for the categories appearing in the chart.

The source annual operating-expenditure milestones are ₹78 Cr, ₹92 Cr, ₹156 Cr, ₹310 Cr, and ₹900 Cr. Explain how the quarterly schedule is derived from them.

## Beat 3 — Revenue minus expenditure

**LEFT:**

Animate the expenditure being deducted from revenue.

The chart should visually demonstrate how much revenue is generated, how much is spent, and what remains.

Show the resulting operating surplus or deficit for each quarter.

The source milestone Net values are:

**−₹23 Cr → −₹20 Cr → −₹36 Cr → −₹10 Cr → +₹300 Cr**

These annualized milestone values must be reconciled against the quarterly calculations, rather than plotted as quarterly results.

**RIGHT:**

Show the subtraction formula and the relevant quarter's figures.

Where production/direct costs are outside the six expenditure categories, include the appropriate contribution-margin bridge from the existing model before calling the result actual operating profit or cash burn.

## Beat 4 — Cumulative operating expenditure

**LEFT:**

Transform quarterly operating expenditure into cumulative operating expenditure, maintaining the original category colours.

The investor should now see:

- Total expenditure during each quarter.
- Cumulative expenditure up to that quarter.
- Contribution of each category to total cumulative spending.

**RIGHT:**

Show the cumulative formula:

**Cumulative expenditure at Qn = Sum of actual modelled expenditure from Q1 through Qn.**

Explain the expenditure drivers behind the growth in each category.

Make the relationship between business scaling and increased organisational spending clear.

## Beat 5 — CAPEX and working capital enter

**LEFT:**

Introduce additional investment requirements while retaining the operating cash-flow context.

Factories appear first, followed by experience centres, labs, technology systems, miscellaneous CAPEX and working capital.

Show each investment category's deployment quarter by quarter.

Then show cumulative CAPEX building toward the **₹170 Cr Q16 target**, plus working capital separately.

**RIGHT:**

Explain the investment logic for the item currently entering the chart.

For example:

**Factory investment = Required capacity expansion × Assumed cost of capacity / facilities**

Show the expected growth or capacity threshold triggering the investment, the deployment quarter, and cumulative progress toward its end-state target.

For working capital, show the 60-day calculation and the resulting quarterly change in cash tied up.

## Beat 6 — Net cash requirement

**LEFT:**

Combine operating cash generation, CAPEX and changes in working capital into one quarterly chart.

Use a positive and negative vertical axis.

- Positive values represent cash generated.
- Negative values represent cash consumed.

Show cumulative cash generated or consumed, enabling identification of the peak funding requirement.

**RIGHT:**

Show the cash-flow equation for the selected quarter:

**Net cash flow before funding = Operating cash generation − CAPEX − Increase in working capital**

Break the quarterly value into its components, displaying exactly why the business needs or generates cash.

Also show how the cumulative funding requirement is derived.

## Beat 7 — Fundraising enters

**LEFT:**

Overlay planned fundraising events on the same Q1–Q16 timeline.

Animate how each capital infusion changes the cumulative cash position.

Make the difference between required capital and raised capital visually explicit.

**RIGHT:**

Explain:

- Why funds are needed in that quarter.
- The calculated funding deficit before the raise.
- The amount planned to be raised.
- The resulting cash balance after the raise.

Use the planned fundraising schedule as an input, not as a number invented to make the chart look balanced.

## Beat 8 — Complete financial picture

**LEFT:**

Show the final consolidated Q1–Q16 financial system:

Revenue, expenditure, operating result, cumulative expenditure, CAPEX deployment, working capital, cash requirements, fundraising and closing cash balance.

Maintain the visual connections established throughout the earlier beats.

**RIGHT:**

Show the consolidated quarterly equation:

**Closing cash = Opening cash + Operating cash generation − CAPEX − Increase in working capital + Funds raised**

Summarize the four-year capital deployment, funding requirement and resulting cash position.

The right column should provide the assumptions and calculation backing for the final financial conclusion, rather than a generic investment pitch.

---

## 6. Important visual and interaction principles

**One timeline:** Both columns always refer to the same Q1–Q16 model.

**One synchronized narrative:** Whenever a new financial component appears on the left, its mathematical and business explanation appears on the right in the same beat.

**Quarterly, not annual:** The annual figures are input assumptions. Actual plotted values must be derived for each quarter.

**No unexplained numbers:** Every expense, investment and cash-flow figure should have a calculation and business justification accessible in the right column.

**Consistent colours:** An expenditure category must retain its colour through quarterly, cumulative and cash-flow views.

**Minimal redundant text:** The right panel should show concise formulas, numerical drivers and justifications. Avoid long paragraphs and generic explanations.

**Progressive visual construction:** Do not replace the main visualization with unrelated charts at every beat. Transform and extend it while preserving the investor's understanding.

**Source-of-truth consistency:** Every value in every animation beat must be connected to the same quarterly model and reconcile across revenue, expenditure, CAPEX and fundraising.

## 7. Model dependencies to resolve

The specification contains the supplied financial milestone targets and Q16 investment targets. To finish the numerical model without arbitrary assumptions, the implementation must resolve:

- The distinction and timing of the two 1Y milestones.
- Quarter-by-quarter operating-cost drivers or an explicitly documented interpolation method.
- CAPEX deployment triggers and quarterly investment schedule.
- The basis for the 60-day working-capital calculation.
- Production/direct-cost treatment in the operating cash-flow calculation.
- The planned fundraising quarters, amounts and opening cash balance.

These should be clearly identified as inputs requiring resolution, not silently assumed.

**Final objective:** An investor watches the financial story evolve on the left while simultaneously understanding, on the right, the formula and business logic behind every expense, investment and funding requirement. The final output is a fully reconciled 16-quarter financial model presented as a progressively animated, explainable dashboard.