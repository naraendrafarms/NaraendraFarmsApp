# Audit — Financial-Year (FY) Awareness (for next session)

FY = Apr 1 – Mar 31 (India). `currentFY()` in src/lib/utils.ts returns e.g. '2026-27' (display string only — no date-range helper exists).
Read-only audit. NO code changes made. Pick fixes from the options at the bottom.

---

## ✅ Already FY-correct
Company P&L · Flock P&L · GST Report · Salary Entry / Payroll / Attendance · Opening Balances (new) · Purchase Orders (fiscal_year string)

## Audit table
| Page | FY-aware? | Notes |
|---|---|---|
| reports/CompanyPL | ✅ FY selector | local fyDates(); FY-bounded; FY-aware opening. Best example |
| reports/FlockPLSummary | ✅ FY selector | local fyDates() on placement_date |
| reports/GSTReport | ✅ FY selector (+month) | local fyRange() |
| reports/TDSPayable | ⚠️ date-range only | manual from/to on grn_date; no FY preset |
| reports/TDSReceivable | ⚠️ date-range only | manual from/to on dispatch_date |
| reports/PartyOutstanding | ⚠️ date-range / all-time | debtors=range, creditors=all-time; fyRange() DEAD CODE (defined, never used) |
| reports/CostAnalysis | ◐ mixed | salary sub=FY; electricity=post-fetch FY; overview=all-time |
| reports/DailySummary | N/A | single-day snapshot |
| reports/ProductionReport | ❌ all-time | lifetime per flock |
| reports/PLReport | ❌ all-time | lifetime per flock |
| reports/SalaryReport | ❌ CALENDAR YEAR (Jan–Dec) | WRONG boundary — should be Apr–Mar |
| reports/FeedReport | ⚠️ month-only | |
| reports/ExportPage | ❌ all-time | whole-table export |
| reports/POPages | ◐ FY string | .eq('fiscal_year', fy) on stored string, not date math |
| reports/EggStock | ⚠️ date-range only | |
| accounts/CashBook | ⚠️ date-range (month default) | OPENING NOT FY-AWARE — cash_book_opening keyed by location only |
| accounts/BankLedger | ⚠️ date-range (all-time default) | OPENING NOT FY-AWARE — single bank_accounts.opening_balance |
| accounts/PartyLedgerPage | ⚠️ date-range, no FY | opening rows from view, not FY-scoped → can bleed across FYs |
| accounts/OpeningBalancesPage | ✅ FY-keyed | only truly per-FY page (opening_balances.fy) |
| accounts/PendingPaymentsPage | ❌ all-time | no date/FY filter |
| accounts/InvoiceRegister | ⚠️ date-range, all-time default | |
| accounts/SalesInvoiceRegister | ⚠️ date-range, all-time default | |
| accounts/InvoiceSeries | ◐ partial | {FY} placeholder + fy field, but counter NOT reset per FY |
| employees/SalaryEntryPage | ✅ FY selector | fyMonths() |
| employees/PayrollSummaryPage | ✅ FY selector | fyMonths() |
| employees/AttendancePage | ✅ FY selector | fyMonths() |
| employees/SalaryAbstractPage | ⚠️ month-only | |
| employees/SalaryRegisterPage | ⚠️ month-only | |
| employees/SalaryHistoryPage | ❌ all-time per employee | |
| flocks/FlockSalesPages (HE/NHE/Med) | ⚠️ date-range | |
| purchases/PurchaseEntry | ❌ all-time | recent 15 |
| purchases/VendorStatement | ❌ all-time | full ledger, no filter |
| purchases/RateCompare | ❌ all-time | last 500 |
| purchase/GRNPage | ⚠️ date-range | client-side over last 2000 |

## Core finding
- No shared FY helper — FY→date math copy-pasted in 7 files (fyDates/fyRange/fyMonths). One copy (PartyOutstanding fyRange) is dead code.
- No global/app-wide FY selector — per-page only.

---

## Prioritized gaps — STATUS
1. ✅ DONE — **Cash Book & Bank Ledger per-FY opening** (migration 190: cash_book_opening.fy + bank_fy_opening table; FY selector + per-FY opening save on both pages).
2. ✅ DONE — **SalaryReport** now FY (Apr–Mar) with FY selector.
3. ✅ DONE — **Party Ledger** FY selector (sets from/to to FY range).
4. ✅ DONE — **VendorStatement** date+FY filter added; Pending Payments covered via FY presets elsewhere.
5. ✅ DONE — **Shared FY helper** in utils.ts (fyRange, fyMonths, FY_OPTIONS).
6. ✅ DONE — **FY preset selector** on TDS Payable/Receivable, Egg Stock, Invoice Register, Sales Invoice Register, Vendor Statement.
7. ⬜ PENDING (low priority) — **Invoice series** numbering reset per FY.
8. ⬜ PENDING (optional) — **App-wide global FY picker** (currently per-page).

All correctness + helper + preset items shipped 2026-06-28 (migrations 190; commits through efb1608).
