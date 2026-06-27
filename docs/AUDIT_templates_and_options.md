# Audit — Import Templates & Page Options (for next session)

Date: 2026-06-27. Read-only audit. NO code changes made. Next session: fix per priority below.

---

## Priority 1 — "Bad templates" (auto-calculated fields that users should NOT type)

These import templates ship columns the app should compute. If typed wrong they save wrong (most don't re-check).
**Fix = remove the column from the template AND auto-compute it on import.**

| Page | Bad column(s) | Should auto-calc as |
|------|--------------|---------------------|
| Bulk Daily Entry (flock-wise) | Close F, Close M | Opening − Death − Transfer − Cull |
| Daily Entry (single) | closing_female, closing_male, total_eggs | closing formula; sum of eggs |
| Flock Detail → Daily | closing_female, closing_male, total_eggs | same |
| HE Dispatch | amount, total_dispatched | qty×rate; sum of grades |
| NHE / Bird Sales | amount | quantity×rate |
| Feed → GRN Entry | taxable_amount, tax_amount, total_amount | qty×price+GST |
| Feed Mill → Formulas | kg_per_1000 | from percentage |
| Hatch Batches | Std Chicks (mild) | hatched−culled−rejects |
| Invoice Register | gst_amount, total_amount | basic×gst%, basic+gst |
| Salary Entry (import) | esi_employee, pf_employee, pt | from basic + ESI/PF/PT flags |
| Electricity → Bills | units_consumed | present − previous reading |
| Procurement → PO | total_amount | qty×rate+GST |
| Procurement → Payments | net_payable | invoice − tds − discount |
| Import Hub → HE Dispatch | total, amount | from grades / (total−free)×rate |
| Excel Mapper → daily_records | total_eggs, he_eggs | sum of parts |
| Excel Mapper → salary | gross_salary, net_salary | earnings − deductions |
| Excel Mapper → GRN | total_amount | qty×rate |

**Clean templates (correct model to copy):** Cash Book, Items Master, Partners, Masters (Ingredients/Parties/Medicines/Hatcheries/Feed Types), Bulk Daily Entry **All-Flocks** mode.

---

## Priority 2 — Missing options on DATA-ENTRY pages

Standardize a shared toolbar: checkbox select-all + Edit + Delete + Bulk Delete + Import + Export + Template.

- **No Edit (correction needs delete + re-add):** Bank Ledger, Buyer Advances, Pending Payments, Purchase Entry, Flock Transfers, Shed Allocation, Feed Production, Feed Transfer, Egg Conversions
- **No multi-select checkbox / bulk delete:** Bank Ledger, Buyer Advances, Pending Payments, Purchase Payments, Daily/Monthly Attendance, Employee Advances, Egg Opening Stock, Feed Mill (Production/Expenses/Adjustments)
- **No single-row delete (only bulk/merge or none):** Farms, Sheds, Ingredients, Medicines, Hatcheries, Hatch Batches, Egg Conversions
- **No import/template where it'd help:** GRN (purchase), Purchase Payments, Vaccination Records, Egg Conversions, Egg Opening Stock

---

## Priority 3 — Safety
- Vaccination Schedule "Clear All" wipes whole table — add confirm + scope guard.
- Hatchability delete uses raw browser confirm — replace with modal.
- Some imports insert-only → duplicate on re-run (e.g. Farm Expenses, Partners import). Switch to upsert/dedup.

---

## Correctly export-only (NO fix needed — view/report pages)
All Reports (Company P&L, GST, TDS Payable/Receivable, Egg Stock, Party Outstanding, Cost Analysis, Flock P&L, Daily Summary), Salary Register, Salary History, Stock Balance, Stock Ledger, Closing Stock Report, Vendor Statement, Party Ledger, Sales Invoice Register, Flock Comparison, Shed Performance.

---

## Note already raised
- Bulk Daily Entry shed mode currently takes imported Close F/M as-is (no recompute). First Priority-1 fix.
