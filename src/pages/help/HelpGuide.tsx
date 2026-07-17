import React, { useState, useMemo } from 'react'
import {
  BookOpen, Bird, Calendar, ArrowRightLeft, ShoppingCart, Users, Zap,
  Package, FileSpreadsheet, BarChart2, Settings, ChevronRight, ChevronDown,
  AlertCircle, CheckCircle, Info, ArrowRight, Hash, MapPin, CreditCard,
  Sparkles, Clock, Receipt, FileText, Egg, Search, X, ListTodo, MessageCircle, Shield
} from 'lucide-react'

const LAST_UPDATED = '2026-07-17'

interface ChangeEntry { date: string; tag: 'New' | 'Fix' | 'Improved'; text: string }
const CHANGELOG: ChangeEntry[] = [
  { date: '2026-07-17', tag: 'Improved', text: 'Items Master: Manufacturer (Medicine items) and Make/Model (Equipment items) are now required fields, instead of optional — ensures every item referenced downstream in Purchase Intent, PO, and GRN has a known manufacturer.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Real-money-risk audit fixes across payments and bank import. CMS Upload / Daily Payment Planning export (and Payment Planning\'s Mark Paid) previously computed the payable amount as the full net_payable/invoice amount, ignoring any paid_amount or advance_adjusted already settled against the bill (Payment Planning also ignored discount_amount entirely) — a part-paid or advance-adjusted bill could export its FULL amount into the bank payment file, risking a real double/over-payment; both screens and both exports now consistently subtract paid_amount, advance_adjusted, and discount_amount. CMS Upload also now excludes Opening-Balance bills (settled only via "Opening Adjustment", never a real bank transfer) from the exportable list, and fixed a dead-code bank-detail lookup by actually joining the parties table (previously relied solely on a name-keyed fallback map, so a renamed party silently exported blank bank fields). Bank Ledger\'s Kotak CSV import had no duplicate protection — re-importing the same statement duplicated every transaction and re-ran auto-match; it now checks existing (date, amount, reference) before inserting and reports skipped rows. Its auto-match also matched too loosely (amount-within-₹1 alone, across any vendor) risking the wrong bill being auto-settled — amount match is no longer sufficient alone; it now also requires the bank narration to mention the vendor\'s name (reference-number match remains sufficient on its own, since it\'s transaction-specific). Also: Import → Electricity Bills and the Electricity page\'s own import used two different (and silently overwriting) templates for the same file — the paid_date column is now removed everywhere (payments are recorded only via the Electricity page\'s Record Payment flow, never as a bulk-imported bill field, since that write bypassed electricity_bill_payments and left bills Pending forever), and the bulk import now skips-and-reports existing bills instead of silently overwriting them, matching the Electricity page\'s own import behavior.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Purchase module audit fixes: Items Master export wrote Title-case column headers ("Name", "Code"...) that the importer never recognized (it reads lowercase "name"/"code"...) — an exported file could never be re-imported; export now matches the import template exactly. GRN bulk import skipped the Feed Ingredient unit safety checks the manual form enforces (MT/Quintal → kg conversion, "Bag" unit blocked) — an imported MT/Quintal row could understate stock by 100-1000x; import now applies the same conversion and skips (with a toast count) any Feed Ingredient row using Bag. GRN template/import also gained free_qty and flock_no columns for Chicks GRNs (previously silently dropped on import; rows with an unresolvable flock are now skipped with a toast count instead of inserted with a missing flock link). Purchase Orders: reversing a PO\'s Material Status away from "Received" (or deleting/bulk-deleting the PO) now cleans up the stock receipt row and the GRN it auto-created (added a marker column so only auto-created GRNs are ever touched, never a manually entered one) — previously the stale GRN kept counting the material as received in Stock Ledger forever. Deleting a PO line linked to a Purchase Intent line now decrements that intent line\'s ordered_qty back down (mirroring how it\'s incremented when linked) so it reappears in the open-intent picker instead of staying stuck as ordered/partial. Purchase Intent edit now updates existing line items in place instead of deleting and reinserting all of them — previously every edit reset each line\'s ordered_qty/status tracking to default and broke any Purchase Order\'s link to that line (new random ids every save).' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Flock/Feed import-export round-trips: Daily Records (FlockDetail) import was silently discarding JE/TE/BE/LE egg counts uploaded in bulk — now written to their own columns. Daily Entry template/import/export was missing the 4 per-grade wastage fields (wastage_he/je/te/be), matching the pattern already used in Bulk Daily Entry. Egg Conversions and Vaccination Records exports wrote human-readable labels for from_type/to_type and route, which broke re-importing the same exported file — now export the raw codes; Vaccination Records export also dropped the unmapped Shed/Site column for consistency with its import. Feed Formulas template/import/export now include a feed_type_code column, resolved to the actual feed type on import (unmatched codes are skipped with a count shown in the success toast) — previously the required Feed Type was never set on import. GRN bulk import/template/export now include the Category field, previously silently dropped on round-trip.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Employees → Salary Entry: deleting a Paid salary record left its Cash Book/Bank Ledger entry behind and permanently stuck any deduction it had recovered — now cleaned up and restored to Pending, same as un-marking Paid. Also fixed the bulk Salary page\'s "Revert to Pending" and the ESI/PF report\'s edit un-mark, which both deleted the ledger entries but never restored recovered deductions to Pending. And Bulk "Mark Paid" now auto-deducts pending deductions for the paid month, matching the main Salary Entry form (previously only the main form did this).' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Diesel Purchases and Bag Sales: deleting a purchase or sale (single or bulk) now also deletes its linked Cash Book / Bank Ledger entry — previously only the source row was removed, leaving a phantom debit/credit behind. Matches the cleanup pattern already used for Electricity Bills.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'NHE Sales / HE Dispatch (Receive Payment, edit, delete): reversing a receipt to Pending, or switching payment mode (Cash↔Bank), now always clears the old Cash Book/Bank Ledger row first — previously the cleanup was skipped in both cases, leaving a stale ledger entry. Deleting a bank-paid sale/dispatch now also removes its Bank Ledger row (previously only Cash Book was cleaned up), and deleting an employee\'s sale now also removes their pending salary deduction, matching what editing already did. Editing a refunded NHE sale now clears the refund tracking fields along with the refund\'s ledger entry it wipes. Also fixed NHE Sales export writing the sale type as a display label instead of the raw code (broke re-importing an exported file), and added Grade C to the HE Dispatch import template/parser (previously silently dropped).' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Pending Payments: the earlier paid_amount-reset fix missed bills paid via "Advance" mode — reverting one of those left advance_adjusted/vendor_advance_id still pointing at the full amount, and the advance itself permanently short that much available balance. Now resets both fields and gives the amount back to the advance on reversal. Fixed a real stuck bill (Venco VNINV/168) and its advance directly.' },
  { date: '2026-07-16', tag: 'Fix',      text: 'Pending Payments: found the actual root cause of the Venco balance issue — reverting a bill\'s Status away from Paid via its Edit screen (e.g. after undoing a bank-import auto-match) correctly reversed the Cash Book/Bank Ledger entry but never reset paid_amount, silently zeroing the bill\'s balance and hiding the Pay button. Fixed so paid_amount resets to 0 on a genuine Paid → non-Paid transition, without disturbing a bill that legitimately has a real partial payment.' },
  { date: '2026-07-16', tag: 'Fix',      text: 'Pending Payments: fixed two v_party_ledger double-counting bugs (a Dr-opening-balance-derived Vendor Advance was counted twice; settling a bill via "Advance" mode counted the advance amount twice) and a Venco-specific data issue where paid_amount was already equal to the bill amount with nothing actually paid — this silently zeroed the balance, hiding the Pay button and the Advance option entirely. Confirmed no other vendor has the same data issue.' },
  { date: '2026-07-16', tag: 'Fix',      text: 'Party Ledger: every Vendor Advance ("Advance Paid" row) was wired in on the wrong side — shown as a Credit, which increases what\'s owed to that vendor, when paying an advance should reduce it (same as a normal payment). This silently zeroed out any Dr-opening-balance-derived advance (e.g. Venco\'s carried-forward advance showed as balance ₹0 instead of the real amount) and understated the payable-reducing effect of every real advance too. Fixed to a Debit, matching how a normal bill payment is already shown.' },
  { date: '2026-07-16', tag: 'Fix',      text: 'Opening Balances: a Dr entry on a buyer (e.g. a pending eggs amount) now auto-adds to Daily Payment Planning\'s Manual Items list so it actually shows up in "Pending Receivables" — previously it only ever sat in Party Ledger, since Payment Planning only reads real NHE Sale/HE Dispatch records. Removed automatically if the opening balance is deleted.' },
  { date: '2026-07-16', tag: 'Fix',      text: 'Opening Balances: a Dr entry on a supplier (money already paid to them last FY, not yet adjusted against GRN bills) now also creates a matching Vendor Advance, so it shows up in the "Advance (adjust against existing balance)" option when paying that vendor\'s new bills in Pending Payments — previously it only ever showed in Party Ledger with no way to actually use it. Deleting an Opening Balance now also cleans up its auto-created Pending Payments bill / Vendor Advance instead of leaving it orphaned (refused if either has already been paid/adjusted, to protect real payment history).' },
  { date: '2026-07-16', tag: 'New',      text: 'Pending Payments: added an "Opening Adjustment" payment mode for opening-balance bills (e.g. a vendor\'s balance carried forward from before this app was used) — marks the bill Paid without posting anything to Cash Book/Bank Ledger, unlike a real payment. Previously, selecting an opening-balance bill together with regular GRN bills in bulk-pay forced the WHOLE combined total through one bank movement. Available on the single-bill pay screen for any opening bill, and on bulk-pay only when every selected bill is an opening balance (to avoid accidentally skipping the ledger entry for a real bill mixed into the same batch).' },
  { date: '2026-07-16', tag: 'Improved', text: 'Bank Ledger: extended the Party auto-fill fix to Buyer Advances, Invoice Register, Purchase Entry, and every Pending Payments pay/bulk-pay flow (same root cause as the earlier fix). Also, opening an already-linked transaction to edit it now shows exactly which bill/invoice it\'s tied to (vendor, invoice/GRN number, amount, status) instead of a generic "already linked" message.' },
  { date: '2026-07-16', tag: 'Fix',      text: 'Bank Ledger: entries auto-created from NHE Sale receipts, Cull Bird refunds, Vendor Advances, and Pending Payments never showed a Party — the name was only ever embedded in the text Description, the actual Party field was left blank even though the app always knew which party it was. Fixed at the source in all four places, so new entries now show the correct party automatically.' },
  { date: '2026-07-16', tag: 'Fix',      text: 'Bank Ledger: editing an existing, unlinked transaction never showed the "Settle against bill/invoice" option — it only ever appeared while creating a brand-new entry, so there was no way to go back and tie an old bank transaction to a party\'s bill after the fact. Now available when editing too (as long as the transaction isn\'t already linked).' },
  { date: '2026-07-16', tag: 'New',      text: 'Electricity → Bills Entry: replaced the one-shot "Paid Date" with proper partial/multi-payment support. A bill\'s Add/Edit form now only covers billing details — payments are recorded separately via a new payment icon per bill, showing a Pending/Partial/Paid status badge (click it to see the full payment history, each tied to its own Cash Book/Bank Ledger entry). Also added "Batch Payment (CMS)" — select multiple bills across different meters/sites paid in a single bank transaction, enter one date/mode/bank account, and each bill gets its own payment record while the ledger gets one combined entry matching the actual bank debit. History tab and CSV exports now show computed payment status/balance instead of the old raw paid_date.' },
  { date: '2026-07-16', tag: 'New',      text: 'Electricity → Bills Entry: marking a bill "Paid" previously only set a date on the bill itself — it never recorded anything in Cash Book or Bank Ledger. Now, setting a Paid Date lets you pick Cash or Bank (with account) and posts the actual payment (bill amount less any Deposit Interest Credit) to the matching ledger, kept in sync if you edit or delete the bill afterwards.' },
  { date: '2026-07-14', tag: 'Fix',      text: 'Employees → Statutory Compliance Center: the ESIC export was a generic CSV that didn\'t match what the ESIC portal actually accepts — wrong file type, wrong/extra columns (it included computed contribution amounts the portal doesn\'t want, and was missing the required Reason Code / Last Working Day columns), and days rounded to nearest instead of always rounding up as the portal requires. Rebuilt to match the ESIC Monthly Contribution upload template exactly (real .xls file, correct columns, correct rounding). Wage basis and ESI eligibility rules were not changed — only the exported file. Also added ₹150/₹200 slab-wise employee counts to the PT card (PT-applicable employees only, same list as the PT export).' },
  { date: '2026-07-14', tag: 'Improved', text: 'Flock Management → NHE Sales list: the "Vehicle/DC" column only showed one of Vehicle No or DC No (whichever was set), hiding the other even though both are saved on every sale. Now shown as two separate columns.' },
  { date: '2026-07-14', tag: 'Fix',      text: 'Employees → Statutory Filing (ESIC export): "No. of Days" could be exported as a fraction (e.g. 0.5 for a half day) — ESIC filing requires a whole number. Now rounds, both on screen and in the exported CSV.' },
  { date: '2026-07-14', tag: 'New',      text: 'Accounts → Vendor Advances: added TDS on advance payments (TDS %, auto-computed TDS Amount, TDS Section) — the actual Cash Book / Bank Ledger entry now records the net amount (advance minus TDS) since that\'s the real money leaving the business, while the advance itself is still recorded at its full gross value. Mark the TDS as deposited using the same Challan picker already used on Reports → TDS Payable (tag it to an existing challan or create a new one). Also fixed Party Ledger: Vendor Advances were never showing up on it at all — now every advance appears as an "Advance Paid" credit at its full gross amount (TDS withheld still counts as value paid to the party, just remitted to the government on their behalf), correctly reducing what they\'re shown to owe.' },
  { date: '2026-07-14', tag: 'New',      text: 'Reports → TDS Payable: added a proper TDS Challan master for filing the quarterly TDS return (24Q salary / 26Q non-salary) via RPU. Marking a bill/salary row "Deposited" now opens a picker to tag it to an existing challan (BSR Code, Challan Serial No., Deposit Date) or create a new one on the spot — deposit status/date is now always derived from the challan, not entered separately. A new "TDS Challans" section lists challans for the selected FY/Quarter with a tagged-vs-deposited reconciliation check (flags a Mismatch if the sum of deductees tagged to a challan doesn\'t match its own TDS amount). Added an "Export Quarterly Filing (RPU format)" button producing an Excel workbook (Challan Details, Deductee Details, Salary Deductee Details, Deductor Info) as a structured working file to key into RPU or hand to your CA — not the official FVU import file itself, since that format is versioned by NSDL/Protean. Admin Centre → Company Profile: added a "TAN No." field, required for challan/return filing.' },
  { date: '2026-07-14', tag: 'New',      text: 'Reports → TDS Payable: added a "TDS Due Date" (7th of the month after deduction) and a separate "TDS Deposit Status" (Pending/Overdue/Deposited, click to toggle, auto-saves) on both the vendor and salary tables. Previously the only status shown was whether the vendor bill or salary itself was paid — easy to mistake for the TDS having been deposited with the government, which is a completely separate deadline. Included in the Excel export too.' },
  { date: '2026-07-14', tag: 'Fix',      text: 'Reports → TDS Payable: the vendor/Parties table could show no rows at all — pending_payments.party_id had no real foreign key (added years ago as "just a hint"), so the report\'s join to Parties (for PAN/Deductee Type) had nothing to resolve against and the whole query failed silently. Added the missing foreign key.' },
  { date: '2026-07-14', tag: 'New',      text: 'Reports → new "Stock Statement" report — bank-submission format showing live birds (by farm), feed ingredient stock, and hatching eggs on hand, each valued at a rate you enter once per month and can edit any time after (remembered per month, not re-typed). Reports → TDS Payable now also shows PAN, Deductee Type (Company/Non-Company), an editable TDS Section per bill/salary line, an editable TDS Interest amount, and a Section-wise Summary card with grand totals — matches the bank/statutory TDS working-file format. Admin Centre → Masters → Accounts/Cash Book: added a "TDS Sections" manager to add/edit/deactivate/delete the section codes used on that report. Parties Master and Employees now have PAN No. fields (Employees also got Deductee Type via Parties, feeding the new report).' },
  { date: '2026-07-14', tag: 'Fix',      text: 'NHE Sale (Bird): recording a sale paid partly cash + partly online failed to save with a database error ("violates check constraint nhe_sales_payment_mode_check") — the app set payment_mode to "Cash+NEFT" but the database never allowed that value. Cash Book and Bank Ledger already recorded each part correctly; only the summary label on the sale itself was blocked. Now saves correctly.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'Items Master → Merge Items: predates the alias system, so merging duplicates would have silently deleted every alias name the duplicate items were known by (item_aliases cascades on delete), reset any linked medicine\'s item link back to unlinked, and could fail outright with a raw database error if a Purchase Intent line pointed at the duplicate. Also found grn/feed_production_ingredients still carry a legacy ingredient_id column (pre-dating the unified Items Master) that Feed Mill\'s stock summary reads directly — merge never touched it, so Feed Mill numbers could stay split across the old/new item after a merge. Merge now carries all of this over to the kept item correctly, and renames the item_name/ingredient_name text shown directly on PO, Purchase Intent, and Feed Mill lists (previously only GRN/Stock Ledger got renamed, so those three kept showing the old name even with the link fixed).' },
  { date: '2026-07-13', tag: 'Improved', text: 'Inventory: the search box on every tab (Stock Balance, Closing Stock Report, Stock Ledger movements, Consumption Report) is now alias-aware too — searching by an Intent/PO/GRN/Medicine name finds the item\'s stock the same way Purchase Intent/GRN/medicine dropdowns already do.' },
  { date: '2026-07-13', tag: 'New',      text: 'Items Master: added a "Manage alias names" button (tag icon) on every item — add or remove the other names this item is known by (Purchase Intent wording, PO wording, invoice/GRN name, medicine name) directly, without waiting for a "Link to Item" prompt to come up. Once added, search anywhere in the app finds the item by any of those names.' },
  { date: '2026-07-13', tag: 'New',      text: 'Systematic fix for "same item, different name in Intent/PO/GRN/Medicine": added an item_aliases table — every name an item is known by now points at one canonical Items Master item, instead of relying on exact text matching between tables (the root cause of the earlier Vitalosin duplicate and unlinked-stock bugs). Search in Purchase Intent, GRN, and every medicine dropdown (Daily Entry, Bulk Daily Entry, Medicine Purchases, Feed GRN) now finds an item by ANY of its known names — confirmed 61 of 62 medicines auto-linked to their Items Master item on rollout (the 1 remaining genuinely has no Items Master entry yet). Purchase Intent line items also get a "Link to Item" action the first time a new name is used, and auto-recognize it silently afterward.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'Inventory (Stock Balance + Closing Stock Report, on screen and in Excel export): every quantity was rounded to a whole number regardless of unit — so 8.115 kg showed as "8" and a 90-gram (0.09 kg) usage showed as "0", silently hiding real consumption for low-dose medicines. Now only true count units (Nos/Dose/Box/Bag) round to whole numbers; kg/Ltr/Gms/ml etc. show up to 3 decimal places.' },
  { date: '2026-07-13', tag: 'New',      text: 'Flock Management → Medicine & Vaccine (Daily tab): added a "Search medicine…" box to filter the usage list by medicine name — previously only Flock and date range could be filtered.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'Fixed why using a medicine in Daily Entry / Bulk Daily Entry never reduced its Items Master stock: those screens only ever recorded which medicine was used (medicine_id), never which Items Master item it maps to (item_id) — the column Inventory\'s stock ledger actually keys off. That link was only ever fixed after the fact by one-off cleanup runs, so anything recorded since the last one (including Flock 22\'s recent Vitalosin usage) never touched real stock. Added a trigger that links every usage entry automatically going forward, and backfilled everything that was missing it — confirmed Flock 22\'s Vitalosin entries are now linked.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'Found and fixed the actual cause of the "Vitalosin" duplicate: two real rows existed in the Medicines master with the same name but one extra space ("Vitalosin 62.5 %" vs "Vitalosin 62.5%") — the duplicate-prevention check only trimmed leading/trailing spaces, not this kind of internal spacing difference, so it let the second one through. Confirmed via migration the duplicate is now gone (only "Vitalosin 62.5%" remains) and fixed the check to strip whitespace entirely so this can\'t recur. Also swapped three more plain, unsearchable Medicine/Vaccine dropdowns (Flock Sales\' Medicine Entry + Medicine Purchase forms, Feed GRN\'s medicine/vaccine field) to the searchable version.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'Masters → Medicines: merging duplicate medicines (or adding/editing/deleting/importing one) only refreshed the Medicines master list itself — Daily Entry, Bulk Daily Entry, and Flock Sales\' own medicine dropdowns kept showing stale cached data (including already-merged duplicates) until a hard refresh. Now every medicine dropdown across the app refreshes immediately.' },
  { date: '2026-07-13', tag: 'Improved', text: 'VHL → Medicine Usage Log: the Medicine field was a plain dropdown with no search, unlike the equivalent field everywhere else (Daily Entry, Bulk Daily Entry, Flock Sales). Now searchable, same as those.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'Purchase Intent → Add/Edit dialog: the Line Items table is wider than a phone screen, so the delete (trash) button in the last column required scrolling all the way right to reach — easy to miss, looking like the option didn\'t exist. It now stays pinned to the right edge while you scroll the row horizontally.' },
  { date: '2026-07-13', tag: 'Improved', text: 'Flock List, Flock Detail, and Dashboard now show Total Eggs / HE Eggs as exact numbers (e.g. 7,06,432) instead of the abbreviated "7.06L" lakh format.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'HE Dispatch list: the TOTAL row at the bottom was misaligned — it spanned 11 columns instead of 7, so every total number landed under the wrong header (e.g. the Dispatched total showed up under Amount), and it was missing a TDS total entirely. Fixed the column span and added the missing TDS total.' },
  { date: '2026-07-13', tag: 'New',      text: 'Added TOTAL rows to tables that were missing them across the app: Flock List (Placed/Alive/Eggs/HE/Revenue), Hatch Batches (Received/Setting/Broken/Inf/Blst/Std/Unhatch/Reject, with % totals recomputed from the summed counts, not averaged), Daily Entry recent records, Shed/Site Performance (By Shed / By Flock), GRN list, Vendor Statement (both the vendor summary and a selected vendor\'s bills), Bank Ledger (waiting-to-link and linked transactions), and Buyer/Vendor Advances. Every totals row recomputes for whatever date range or filter is currently applied — it\'s a subtotal for the visible rows, not always the grand total.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'Flock Detail → Daily tab → Export Excel: the exported file was missing Feed/Total Eggs/HD%/HE Eggs/HE% entirely (only had opening/closing/mortality/cull/transfer), and always exported every record for the flock\'s whole life regardless of the From/To date filter, using raw per-shed rows instead of the per-day totals shown on screen. Now matches the table exactly — same columns, respects the date filter, one row per day (sheds summed), plus a TOTAL row for the exported range.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'Flock Detail → Daily tab: the TOTAL row under the table always summed the flock\'s entire history, even when a From/To date filter was applied to the rows above it — now recalculates for just the filtered range.' },
  { date: '2026-07-13', tag: 'Improved', text: 'Daily Payment Planning → Print: a selected Manual Item now prints as an extra row (labelled "(manual)") and its amount is folded into the Total Payments / Bank Balance After Payments / Need to Receive figures. Export CMS is unaffected — it stays a bank-transfer file, and a manual item has no vendor bank details to put in it.' },
  { date: '2026-07-13', tag: 'New',      text: 'Daily Payment Planning → Manual Items: added a checkbox to each manual item row — selecting one now folds its amount into "Balance After" on this page, same as ticking a real pending payment. It still won\'t appear in Mark Paid or Export CMS, since there\'s no vendor/bank/GRN behind a manual item.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'HE Dispatch / NHE Sale → Receive Payment: the Amount field defaulted to the full gross invoice amount, ignoring any TDS already deducted on that invoice (shown as "Net receivable" when the sale was entered) — same root cause as the Payment Planning receivable fix. Now defaults to invoice amount minus TDS.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'Daily Payment Planning: Pending Receivables (and the Need to Receive Amount on Print) showed the gross HE Dispatch / NHE Sale invoice amount, ignoring any TDS deducted at source — HE Dispatch already computes a "Net receivable" (amount − TDS) on the receipt screen, but Payment Planning never used it. Now shows the net amount still due, and also includes Partially-received invoices (previously only fully-Pending ones showed at all).' },
  { date: '2026-07-13', tag: 'Fix',      text: 'Bank Ledger → Add Transaction: "Settle against invoice" (buyer side) failed with a payment_mode check-constraint error — it was writing the Bank Ledger category (Vendor Payment / Bank Charges / etc.) straight into nhe_sales/he_dispatch.payment_mode, which only accepts Cash/NEFT/RTGS/Bank Transfer/UPI/Cheque/Advance. Now always saves as NEFT.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'Bank Ledger → Add Transaction: the "Settle against bill" dropdown could come back empty even when a bill genuinely existed for that party — it filtered strictly on party_id (many older bills only have vendor_name, no party_id) and used a plain "not equal to Paid" check that silently drops any bill whose status was never set (SQL NULL never matches <>). Both fixed; the picker now also matches by vendor name and treats a blank status as open.' },
  { date: '2026-07-13', tag: 'New',      text: 'Bank Ledger → Add Transaction: the "Settle against bill" picker now also works for buyers — pick Credit + a party and a "Settle against invoice" dropdown lists that buyer\'s open NHE sale / HE dispatch invoices; picking one marks it Received (or Partial) and posts to Party Ledger.' },
  { date: '2026-07-13', tag: 'Fix',      text: 'Bank Ledger → Add Transaction: picking a Vendor/Party here never posted anything to that party\'s Party Ledger — it only tagged the bank row, with no link to any bill. Added a "Settle against bill" picker (shown for Debit + a party selected) that marks the chosen open bill Paid and posts the Cash Book entry, same as Link to Bills.' },
  { date: '2026-07-12', tag: 'Improved', text: 'Daily Payment Planning → Print: now uses the full Naraendra Farms letterhead (logo, address, GSTIN, phone) matching GRN/HE Dispatch prints, and adds a 4-column signature row — Prepared By / Checked By / Verified By / Authorized Signatory. Also fixed the Kotak Balance shown on this page and in print, which was summing every bank transaction ever recorded instead of the correct per-financial-year balance used everywhere else (Bank Ledger).' },
  { date: '2026-07-12', tag: 'New',      text: 'Tasks module added (new "Tasks" tab in the sidebar) — admin tasks, monthly compliance deadlines (GST/TDS/PF/ESI) with auto-recurrence, and daily team task assignment. Assign a task directly from Pending Payments or Employee List with an "Assign Task" button; a "My Tasks" toggle and a Dashboard widget show what is assigned to you. Assigning/reassigning a task now pops up a live notification for the person it is assigned to.' },
  { date: '2026-07-12', tag: 'Improved', text: 'Discussions (Chat): new messages now show a real popup card with the sender and message text and an inline reply box — reply without opening the chat panel, or tap the message to jump into that conversation. Previously only a small red dot appeared on the chat icon.' },
  { date: '2026-07-12', tag: 'Fix',      text: 'Discussions (Chat): a conversation could show "User" instead of the real person\'s name the first time you opened it (only correcting itself on refresh). Fixed a data-loading race condition — names now resolve correctly every time.' },
  { date: '2026-07-12', tag: 'Improved', text: 'Header search is now much more powerful — in addition to finding pages, it searches live records: employees, flocks, parties/suppliers, bills/GRN, tasks, and sites. Results are grouped "Pages" vs "Records" and jump straight to the right place.' },
  { date: '2026-07-12', tag: 'Fix',      text: 'Audit Log: 12 tables that were missing the audit trigger entirely now have it attached — chat messages, salary abstract/allocation, feed stock adjustments, stock ledger, bank accounts, invoice series, opening balances, CMS uploads, HE dispatch line items, NHE sale line items, and HE rate register.' },
  { date: '2026-07-12', tag: 'New',      text: 'Pending Payments: Bulk Pay added — tick multiple bills and settle them as one payment, matching your real bank statement instead of one line per bill.' },
  { date: '2026-07-12', tag: 'New',      text: 'Vendor Advances added (Accounts → Vendor Advances) — record an advance paid to a supplier; "Advance" then appears as a payment mode when paying that vendor\'s bill in Pending Payments, adjusting the bill against the advance.' },
  { date: '2026-07-12', tag: 'Fix',      text: 'Company P&L: Bank Charges recorded in Bank Ledger were never included as an indirect expense anywhere in P&L. Added as a cost line (monthly table, annual totals, and Excel export).' },
  { date: '2026-07-12', tag: 'New',      text: 'Bank Ledger: search box added (description, reference, category, party) — previously only a date-range filter existed. Search narrows the visible rows only; balance totals stay based on the full date range.' },
  { date: '2026-07-12', tag: 'New',      text: 'Pending Payments → Waiting to Link: checkboxes and bulk Ignore/Delete added — previously each imported bank transaction could only be linked or ignored one at a time.' },
  { date: '2026-07-12', tag: 'Improved', text: 'Bank-statement reconciliation moved from Pending Payments into Bank Ledger itself, as a new "Link to Bills" tab — the whole workflow (import statement → see what\'s unmatched → link to bill) now happens on one page instead of switching between two. Pending Payments now only tracks what you owe.' },
  { date: '2026-07-06', tag: 'New',      text: 'Help Guide: Full "VHL Module" section added — setup, Daily Entry vs Bulk (Shed-wise) Entry, Medicine, Egg Production billing, and Dashboard.' },
  { date: '2026-07-06', tag: 'Fix',      text: 'VHL Bulk (Shed-wise) Daily Entry was silently skipping any shed row where only Opening was entered (e.g. a first-day placement with no eggs/feed yet) — it never saved. Fixed.' },
  { date: '2026-07-06', tag: 'New',      text: 'VHL Flocks and VHL Dashboard had no Edit option and no links anywhere. Added an Edit button on VHL Flocks (breed/status/placement/placed counts), and flock rows/cards now link straight through to Daily Entry. VHL Flocks also now shows live Current F/M birds from the latest Daily Entry.' },
  { date: '2026-07-06', tag: 'Fix',      text: 'Audit Log: VHL module tables and Employee Advances were missing the audit trigger entirely, so no activity was being recorded for them. Trigger now attached — all VHL and advance activity is logged.' },
  { date: '2026-07-06', tag: 'New',      text: 'HR & Payroll → Bulk Salary → Attendance tab: Export Excel button added — downloads the current month\'s attendance grid (absent days, TDS, advances, flock deductions) before you save & calculate.' },
  { date: '2026-07-06', tag: 'Improved', text: 'Employees: Account No. and IFSC Code fields now validate as you type — IFSC must match the RBI 11-character format, Account No. must be 9–18 digits. Same validation added to Bank Ledger → Manage Bank Accounts and Purchase → Suppliers (Parties) bank details.' },
  { date: '2026-07-06', tag: 'New',      text: 'Purchase → GRN: Print button added to each GRN row — prints with company letterhead/logo, matching the format used elsewhere in the app.' },
  { date: '2026-07-06', tag: 'New',      text: 'Employees → Salary History and Salary Register: "Deposited Into" column added, showing which account each month\'s salary was actually paid to (Own / Shared / Override) with account number and IFSC.' },
  { date: '2026-07-06', tag: 'Improved', text: 'Employees: All employee-picker dropdowns (Salary Entry, Bulk Salary, Payslip Generator, Employee Advances, Salary History, "Deposited Into" override) are now searchable — type to filter by name.' },
  { date: '2026-07-06', tag: 'New',      text: 'Flock Detail → Weekly tab added (between Daily and Monthly) — rolls up daily records into a week-of-age report for that flock: eggs, HD%, HE%, mortality, feed per week since placement.' },
  { date: '2026-07-06', tag: 'New',      text: 'New VHL module added for the Bodjanampet-2 job-work contract: VHL Flocks, Daily Entry, Bulk (Shed-wise) Daily Entry, Medicine Master & Usage Log, Egg Production with monthly consolidated billing, Dashboard, and Shed-wise Performance — all under a new "VHL" sidebar section, kept fully separate from regular flock tracking.' },
  { date: '2026-06-26', tag: 'New',      text: 'Global Search added to the top header bar — type any page name to instantly find and jump to it from anywhere in the app.' },
  { date: '2026-06-26', tag: 'New',      text: 'Accounts → Buyer Advances: Record advance payments received from buyers (party-wise). Supports Cash and Bank payment modes. Automatically posts to Cash Book or Bank Ledger on save.' },
  { date: '2026-06-26', tag: 'New',      text: 'Accounts → Party Ledger: View a running debit/credit ledger per buyer — shows all HE Dispatch sales, NHE Sales, advance receipts, and payments in one timeline with running balance. Export to Excel.' },
  { date: '2026-06-26', tag: 'New',      text: 'HE Dispatch & NHE Sales payment modal: "Advance" payment mode added. When a buyer has an advance balance, a blue banner shows the available amount. Selecting Advance deducts from that buyer\'s advance balance automatically.' },
  { date: '2026-06-26', tag: 'New',      text: 'HR & Payroll → Monthly Attendance Grid: Enter attendance for all employees of a farm in a calendar-style grid (rows = employees, columns = days). Click each cell to cycle P / A / H / WO / OT. OT days show hours input. Saves to attendance and updates salary monthly summary in one click.' },
  { date: '2026-06-26', tag: 'Fix',      text: 'Bulk Salary: Flock egg/bird sales to employees (Flock Ded.) were being double-counted — once in Flock Ded. column and again in the Advances column. Fixed: Advances column now correctly excludes flock deductions.' },
  { date: '2026-06-26', tag: 'Improved', text: 'HE Dispatch → Daily Stock Register: Dispatches now grouped by Dispatch Date (when eggs left the farm) instead of Production Date. This matches the Egg Stock Balance report logic and shows correct running balances.' },
  { date: '2026-06-26', tag: 'Improved', text: 'Reports → Egg Stock Balance: Export now generates XLSX. When a flock is selected (day-wise view), exports all daily rows. When no flock selected, exports the flock summary. Plain data rows, no formula bloat.' },
  { date: '2026-06-26', tag: 'Fix',      text: 'HE Dispatch → Daily Stock Register: Broken Eggs and Leached Eggs columns removed — these do not belong in the HE grade stock register (they are tracked separately in Daily Entry).' },
  { date: '2026-06-21', tag: 'New',      text: 'HE Dispatch: Flock Age now shows per production date in the expandable lines breakdown. Click the invoice number to expand — each date shows age as e.g. "24w 3d".' },
  { date: '2026-06-21', tag: 'New',      text: 'HE Dispatch: Vehicle Type field added (AC / NON-AC). Shows in dispatch table and on invoice print in the Logistics section.' },
  { date: '2026-06-21', tag: 'Improved', text: 'HE Dispatch: Extra Trays split into Extra Trays (20LB) and Extra Trays (23LB) — tracked separately for each box type. Loading Details section now has 4 fields: Vehicle Type, Lorry No, Driver Phone, Out Time, and 4 box fields.' },
  { date: '2026-06-21', tag: 'New',      text: 'HE Dispatch: Print Invoice to PDF added. Click the printer icon on any dispatch row. A Print Options modal lets you choose which sections to include: Company Address, Buyer Details & GSTIN, Bank Details, Supply Details, Lorry No, Out Time, Box Details, Driver Phone.' },
  { date: '2026-06-21', tag: 'Improved', text: 'HE Dispatch: Round Off is now fully automatic — amounts use Math.round() (< 0.5 rounds down, ≥ 0.5 rounds up). Round Off on invoice is auto-derived as saved amount minus gross total. No manual entry needed.' },
  { date: '2026-06-21', tag: 'New',      text: 'HE Dispatch: TDS % selector added (No TDS / 0.1% / 1% / 2% / 5% / 10%). TDS Amount auto-calculates but can be overridden. Net receivable shown instantly.' },
  { date: '2026-06-21', tag: 'Improved', text: 'HE Dispatch: Hatchery field removed from dispatch form — it belongs in Hatch Batches (each batch links to a hatchery). Dispatch only needs Flock, Party, and dates.' },
  { date: '2026-06-21', tag: 'New',      text: 'Hatch Batches: Full page rewrite with all spreadsheet columns — Received, Setting, Broken, Broken%, Inf, Inf%, Blst, Blst%, Sale Chk, Hatch%, Std, Unhatch, Unhatch%, Reject, Reject%, Setting×STD%, STD-Sale. Table scrolls horizontally.' },
  { date: '2026-06-21', tag: 'New',      text: 'Hatch Batches: Three age columns added — Age@Setting (flock age when eggs were placed in incubator), Age@Prod (flock age when eggs were laid, from linked dispatch lines), Egg Age (days from average production date to setting date).' },
  { date: '2026-06-21', tag: 'New',      text: 'Hatch Batches: Checkboxes and bulk delete added. Select rows and click Delete to remove multiple batches at once.' },
  { date: '2026-06-21', tag: 'New',      text: 'Hatch Batches: Import from Excel (with Template download) and Export to Excel added. Template has all columns in correct format.' },
  { date: '2026-06-21', tag: 'New',      text: 'Hatch Batches: New fields — Setting No (hatchery batch/setting number), Eggs Weight, Infertile (eggs at candling), Std Chicks (auto = Hatched − Culled − Rejects).' },
  { date: '2026-06-21', tag: 'New',      text: 'Reports → TDS Receivable added. Shows all HE dispatches where TDS is applicable, rate-wise summary cards (Total TDS, TDS on Paid, TDS on Pending), filter by date range and TDS %, export to Excel.' },
  { date: '2026-06-21', tag: 'New',      text: 'Invoice Series / Counters page added under Accounts. Shows all invoice series (HHF, HE, VHPL, NHE, CB) with current counter and next invoice preview. You can edit the counter to fix it if it got ahead of real invoices.' },
  { date: '2026-06-21', tag: 'Improved', text: 'Medicine Purchases now save full GST split (supply type, nature, is_rcm, CGST, SGST, IGST, party GSTIN) — so medicine bills appear correctly in GST Reports → Purchase GST tab.' },
  { date: '2026-06-21', tag: 'New',      text: 'GST Reports → Purchase GST tab now includes medicine purchases alongside GRN (feed) entries. All purchase GST is now visible in one place.' },
  { date: '2026-06-21', tag: 'New',      text: 'Feed Ingredients master now has HSN Code and GST Rate % fields — set these once per ingredient; Purchase Entry will use them for GST calculations.' },
  { date: '2026-06-21', tag: 'New',      text: 'Rate Comparison and Vendor Statement pages are now accessible from the Purchase & Payments sidebar menu.' },
  { date: '2026-06-21', tag: 'Improved', text: 'Removed "Hatchability (Legacy)" from the sidebar. The page is still accessible but no longer clutters the navigation.' },
  { date: '2026-06-21', tag: 'Fix',      text: 'HHF invoice counter reset to 50 (last real filed invoice was 50). Next generate will correctly show HHF51.' },
  { date: '2026-06-21', tag: 'New',      text: 'GST implementation: Parties now store GSTIN, GST type (registered/unregistered/composition), State Code, and RCM flag. GSTIN auto-parses state code and validates format when you type it.' },
  { date: '2026-06-21', tag: 'New',      text: 'Purchase Entry (GRN) now captures GST details — Nature (purchase/expense/asset), Supply Type (intra-state CGST+SGST / inter-state IGST), RCM flag, and live CGST/SGST/IGST tax split shown before saving.' },
  { date: '2026-06-21', tag: 'New',      text: 'HE Dispatch: Invoice series selector (HHF / HE / VHPL) + Generate button. Generate shows a preview of the next number without consuming it. The actual number is assigned only when the record is saved.' },
  { date: '2026-06-21', tag: 'New',      text: 'NHE Sales: Invoice series selector (NHE / CB) + Generate button with the same preview-then-save behaviour. GST % field added (0 / 5 / 18%).' },
  { date: '2026-06-21', tag: 'New',      text: 'Sales Invoice Register added under Accounts → Sales Invoice Register. Shows all HE Dispatch and NHE Sales invoices in one list. Filter by series (HHF/HE/NHE/VHPL/CB) and date range. Export to Excel.' },
  { date: '2026-06-21', tag: 'New',      text: 'GST Reports page added (Reports → GST Reports): GSTR-1 tab (B2B, B2C, exempt sales, HSN summary), GSTR-3B tab (section 3.1 outward supplies + 6.1 tax payable), RCM Register, and Purchase GST register.' },
  { date: '2026-06-21', tag: 'Improved', text: 'Sidebar Accounts menu renamed: "Invoice Register" split into "Sales Invoice Register" (outward) and "Purchase Invoice Register" (supplier invoices).' },
  { date: '2026-06-21', tag: 'Improved', text: 'Party / supplier dropdowns now have a live search box. Click the dropdown and type any part of the name to filter — works in Purchase Entry, HE Dispatch, and NHE Sales.' },
  { date: '2026-06-21', tag: 'Fix',      text: 'Generate invoice button no longer wastes a number when the form is cancelled. It now shows a preview only; the counter increments only on Save.' },
  { date: '2026-06-21', tag: 'New',      text: 'Masters tab now shows editable dropdown lists: Categories, Units, Material Types, Payment Methods, Breeds, Feed Types, and Designations — all can be added, edited, or deleted.' },
  { date: '2026-06-18', tag: 'New',      text: 'Vendors Master tab added in Purchase & Payments — lists all unique vendors from POs, Payments, and Vendor Banks. Delete all data for a vendor (POs + payments + bank details) in one step. Supports bulk select and bulk delete.' },
  { date: '2026-06-18', tag: 'Improved', text: 'Vendor Banks tab now has checkboxes and bulk delete — select multiple bank records and delete them at once.' },
  { date: '2026-06-18', tag: 'Improved', text: 'Feed Formulas: Feed Type is now linked to the master feed types (BCM, BGM, L1, etc.) instead of a hardcoded Breeder/Broiler/Layer dropdown. Flock Type auto-derives from the selected feed type name. Filter bar also uses master feed types.' },
  { date: '2026-06-18', tag: 'Fix',      text: 'GRN bulk delete: fixed "invalid input syntax for uuid: undefined" error when selecting all 100+ records. Rows with missing IDs are now safely skipped.' },
  { date: '2026-06-17', tag: 'New',      text: 'Chick Placements tab added to each flock — record staggered chick intake per shed per day. Total Placed updates automatically.' },
  { date: '2026-06-17', tag: 'New',      text: 'Chick invoice fields added to flock creation form — auto-creates an invoice record in Purchase Invoice Register.' },
  { date: '2026-06-17', tag: 'New',      text: 'Medicine Purchases linked to Purchase Invoice Register — when a medicine purchase has an invoice number, a matching invoice record is auto-created/updated.' },
  { date: '2026-06-17', tag: 'New',      text: 'GRN page: checkboxes and bulk delete added.' },
  { date: '2026-06-17', tag: 'Improved', text: 'Daily Entry: Egg Collection fields are hidden during Rearing phase and appear only from Laying Start Date.' },
  { date: '2026-06-17', tag: 'Improved', text: 'Parties can now be deleted even if they have linked GRN, HE Dispatch, or NHE Sales records.' },
  { date: '2026-06-17', tag: 'Improved', text: 'Item Master renamed from "Feed Ingredients" in sidebar.' },
]

interface Step { text: string; note?: string; warning?: string }
interface Workflow { title: string; path: string; steps: Step[] }
interface Section {
  id: string
  icon: React.ReactNode
  label: string
  color: string
  intro: string
  workflows: Workflow[]
  tips?: string[]
}

const SECTIONS: Section[] = [
  // ── CHANGELOG ─────────────────────────────────────────────────────────────────
  {
    id: 'changelog',
    icon: <Sparkles size={20}/>,
    label: "What's New",
    color: 'bg-brand-600',
    intro: 'Recent improvements, new features, and bug fixes. The Audit Log (Admin → Audit Log) tracks every data entry and change made by each user.',
    workflows: [
      {
        title: 'Where to see all data changes (Audit Log)',
        path: 'Admin → Audit Log',
        steps: [
          { text: 'Every record created, edited, or deleted is logged automatically with timestamp and user name.' },
          { text: 'Filter by table (e.g. "daily_records", "flocks", "grn") to see changes to a specific area.' },
          { text: 'Filter by date range to find what was changed on a specific day.' },
          { text: 'Each entry shows: Table, Action (Created/Updated/Deleted), Summary, User, and Time.' },
          { text: 'This log cannot be deleted or tampered with by normal users — it is the permanent record of all activity in the app.', note: 'Only Admin role can access the Audit Log.' },
        ]
      },
    ],
    tips: [
      'If something was accidentally deleted, check the Audit Log to find when it was deleted and by whom.',
      'Use the Audit Log during year-end review to verify all entries are complete.',
    ]
  },

  // ── FLOCK SETUP ───────────────────────────────────────────────────────────────
  {
    id: 'flock-setup',
    icon: <Bird size={20}/>,
    label: 'Flock Setup',
    color: 'bg-green-600',
    intro: 'Every flock must be created before any data can be entered. A flock starts as "Rearing" and changes to "Laying" once birds are transferred to the laying farm.',
    workflows: [
      {
        title: 'Create a new flock',
        path: 'Flock Management → Flock List → + New Flock',
        steps: [
          { text: 'Enter Flock No (e.g. 19), Breed, Placement Date, no. of Female and Male chicks placed.' },
          { text: 'Set Rearing Farm — this is where the birds live right now (e.g. Kethereddypally).' },
          { text: 'Leave Laying Farm blank until the birds are transferred.' },
          { text: 'Status will be "Rearing" automatically.' },
          { text: 'Save. The flock now appears in Flock List and Daily Entry.', note: 'You must assign sheds to this farm in Masters → Sheds before Daily Entry can pick them up.' },
        ]
      },
      {
        title: 'Record chick intake per shed (staggered placement)',
        path: 'Flock Management → Flock List → click Flock No → Placements tab → + Add Placement',
        steps: [
          { text: 'Use this when chicks arrive in batches over multiple days or across multiple sheds.', note: 'Example: 6,000 chicks arrive in Shed 10 on Day 1. Another 10,000 arrive in Shed 11 on Day 2.' },
          { text: 'Date Received — the date this batch of chicks arrived.' },
          { text: 'Shed — which shed these chicks went into.' },
          { text: 'Female Count and Male Count for this batch.' },
          { text: 'Notes — optional (e.g. vehicle number, supplier batch ID).' },
          { text: 'Save. The flock\'s Total Placed count updates automatically to the sum of all placement records.', note: 'If no placements are recorded, Total Placed falls back to the Paid Female + Paid Male entered at flock creation.' },
          { text: 'When you next open Daily Entry for that shed on the placement date, Opening Female/Male will auto-fill from this batch.' },
        ]
      },
      {
        title: 'Record chick invoice at flock creation',
        path: 'Flock Management → Flock List → + New Flock → Chick Invoice section',
        steps: [
          { text: 'While creating a flock, scroll to the "Chick Invoice" section.' },
          { text: 'Enter Invoice No (from hatchery invoice) and Invoice Date.' },
          { text: 'Save the flock. An invoice record is automatically created in Accounts → Purchase Invoice Register, linked to this flock.', note: 'The invoice amount is auto-calculated from (Paid Female + Paid Male) × Chick Rate.' },
          { text: 'Go to Purchase Invoice Register to mark it paid when payment is made.' },
        ]
      },
      {
        title: 'Edit an existing flock',
        path: 'Flock Management → Flock List → ✏ pencil icon on the row',
        steps: [
          { text: 'Click the pencil (edit) icon on the flock row.' },
          { text: 'You can update breed, farms, dates, chick rate, supplier, remarks.' },
          { text: 'Do NOT change status manually here — use the Final Transfer checkbox instead (see Flock Transfer section).' },
        ]
      },
    ],
    tips: [
      'Flock No should match your physical records (ledger / Excel) exactly.',
      'If rearing and laying are on the same farm, enter the same farm in both fields.',
      'Use the Placements tab for staggered chick intake. The Total Placed on the overview always reflects the sum of all placement batches.',
    ]
  },

  // ── DAILY ENTRY ───────────────────────────────────────────────────────────────
  {
    id: 'daily-entry',
    icon: <Calendar size={20}/>,
    label: 'Daily Entry',
    color: 'bg-blue-600',
    intro: 'Enter every day\'s production data shed-wise. Opening bird counts, feed consumed, eggs collected, and any bird movements (transfers, culls, deaths). This is the most important daily task.',
    workflows: [
      {
        title: 'Enter a daily record',
        path: 'Daily Entry',
        steps: [
          { text: 'Select the Flock from the dropdown (e.g. Flock 19 — rearing).' },
          { text: 'Select the Shed (e.g. Shed A). Each shed is entered separately.', note: 'For rearing flocks the sheds shown are from the Rearing Farm. For laying flocks, from the Laying Farm.' },
          { text: 'Select the Date. The previous day\'s closing count auto-fills as today\'s opening.', note: 'If a Chick Placement batch exists for this shed on this date (first day of intake), Opening will auto-fill from the placement batch instead.' },
          { text: 'Bird Count section: Enter Opening Female and Opening Male.' },
          { text: 'Transfer Female/Male — birds physically moved to another farm on this day. Leave 0 if no transfer.' },
          { text: 'Cull Female/Male — birds removed and sold (culls, lame, weak). Leave 0 if none.', note: 'When you save a Cull entry here OR record a Bird Sale in NHE & Bird Sales, both update these numbers automatically.' },
          { text: 'Mortality Female/Male — birds that died today.' },
          { text: 'Click "Auto-compute Closing" — the app calculates: Closing = Opening − Transfer − Cull − Mortality.' },
          { text: 'Feed: enter Female Feed (kg) and Male Feed (kg) with their feed types.' },
          { text: 'Eggs: The Egg Collection section only appears once the flock reaches its Laying Start Date.', warning: 'If you do not see egg fields, check that the Laying Start Date is set correctly on the flock (edit flock → Laying Start Date).' },
          { text: 'Enter Total Eggs, HE Total. If no shed is selected, also enter HE Grade A/B/C.' },
          { text: 'Save Record.' },
        ]
      },
      {
        title: 'HE Grade Breakdown — important rule',
        path: 'Daily Entry → select "All / No shed" for the Shed field',
        steps: [
          { text: 'Grading (A/B/C) is done AFTER eggs are collected from all sheds — it is a flock-level entry, not per-shed.' },
          { text: 'First enter each shed\'s egg count with a shed selected.' },
          { text: 'Then select "All / No shed" and enter the Grade A, B, C breakdown for the full flock.', warning: 'If you enter grades while a shed is selected, you will see a warning. The grade fields are hidden per-shed to prevent errors.' },
        ]
      },
      {
        title: 'Import daily records from Excel',
        path: 'Daily Entry → Import Excel/CSV button (top right)',
        steps: [
          { text: 'Download the Template first to see the exact column format required.' },
          { text: 'Fill your Excel with dates and data matching the template columns.' },
          { text: 'Upload the file. Records are upserted — existing dates are updated, new dates are inserted.' },
        ]
      },
    ],
    tips: [
      'Always enter data shed-by-shed. If you skip a shed, that shed\'s eggs won\'t be counted.',
      'Quick Entry Mode (toggle at top) hides less-used fields — useful for fast daily entry.',
      'The Previous/Next arrows let you navigate dates without using the date picker.',
    ]
  },

  // ── FLOCK TRANSFER ────────────────────────────────────────────────────────────
  {
    id: 'flock-transfer',
    icon: <ArrowRightLeft size={20}/>,
    label: 'Flock Transfer',
    color: 'bg-purple-600',
    intro: 'When rearing birds are moved to the laying farm, record it as a Flock Transfer. If it is the final/complete shift, tick "Final Transfer" to automatically change the flock status to Laying.',
    workflows: [
      {
        title: 'Record a flock transfer',
        path: 'Flock Management → Flock List → click Flock No → Transfers tab → Add Transfer',
        steps: [
          { text: 'Transfer Date — the date the birds were physically moved.' },
          { text: 'From Farm — where the birds came from (usually the rearing farm).' },
          { text: 'To Farm — where the birds are going (the laying farm).' },
          { text: 'Female Count and Male Count — birds that were successfully transferred.' },
          { text: 'Sex Error Female/Male — birds found to be wrongly sexed during transfer (counted separately).' },
          { text: 'Sold Female/Male — birds sold off at the time of transfer (culls, rejects).' },
          { text: 'Tick "Final Transfer" if this is the last batch moving — the flock status will automatically change to Laying and the Laying Farm is set.', note: 'Once status is Laying, Daily Entry will show Laying Farm sheds instead of Rearing Farm sheds.' },
          { text: 'Save.' },
        ]
      },
    ],
    tips: [
      'Partial transfers (moving in batches over multiple days) are supported — just record one entry per day without ticking Final Transfer.',
      'After the Final Transfer, open the flock and verify the Laying Farm and Laying Start Date are correct.',
    ]
  },

  // ── NHE & BIRD SALES ──────────────────────────────────────────────────────────
  {
    id: 'bird-sales',
    icon: <ShoppingCart size={20}/>,
    label: 'NHE & Bird Sales',
    color: 'bg-orange-600',
    intro: 'All non-hatching egg sales and bird sales are recorded here. Egg sales (Jumbo, Table, Broken) and bird sales (cull / lame) are entered per flock. Each sale can be assigned an invoice number from the NHE or CB series.',
    workflows: [
      {
        title: 'Record a bird sale (cull / lame / weak)',
        path: 'Flock Management → NHE & Bird Sales → Add Sale',
        steps: [
          { text: 'Select Flock and Sale Date.' },
          { text: 'Sale Type: choose "Bird Sales".' },
          { text: 'Bird Sex: Female, Male, Sex Error, or Mixed.' },
          { text: 'Category: Cull (most common), Lame, Weak, Other.' },
          { text: 'No. of Birds and Avg Weight/bird (kg). Total Weight auto-calculates.' },
          { text: 'Rate per kg (₹). Total Amount auto-fills.' },
          { text: 'Party — select the buyer from the party master. Type to search if you have many parties.' },
          { text: 'Payment section: Cash and Online/NEFT amounts. Vehicle No.' },
          { text: 'Save. The cull count is automatically added to the daily record for that flock on that date.' },
        ]
      },
      {
        title: 'Record an egg sale (JE / TE / BE)',
        path: 'Flock Management → NHE & Bird Sales → Add Sale',
        steps: [
          { text: 'Sale Type: Jumbo Eggs, Table Eggs, or Broken/Crack Eggs.' },
          { text: 'Enter Qty, Rate (₹/egg), Amount auto-calculates.' },
          { text: 'GST %: select 0%, 5%, or 18% as applicable for the item.' },
          { text: 'Party, DC No, Remarks as needed.' },
          { text: 'Save.' },
        ]
      },
      {
        title: 'Generate a sale invoice number',
        path: 'Flock Management → NHE & Bird Sales → Add Sale → Invoice Series + Generate',
        steps: [
          { text: 'In the sale form, select the Invoice Series from the dropdown: NHE (for non-hatching eggs) or CB (for cull birds).' },
          { text: 'Click the "Gen" button. A preview of the next invoice number appears in the Invoice No field (e.g. NF/26-27/NHE/3).', note: 'Clicking Generate only SHOWS the next number — it does not reserve it. The counter is only incremented when you click Save.' },
          { text: 'You can also type an invoice number manually instead of using Generate.' },
          { text: 'Click Save. The invoice number is now permanently assigned to this sale.', warning: 'If you click Generate but then Cancel without saving, no number is wasted — the same number will be offered next time.' },
        ]
      },
    ],
    tips: [
      'Female and Sex Error birds both go into cull_female in daily records.',
      'The Bird Sales Summary at the top of the page shows totals, kg sold, and average ₹/kg.',
      'All saved invoices appear in Accounts → Sales Invoice Register.',
    ]
  },

  // ── HE DISPATCH ───────────────────────────────────────────────────────────────
  {
    id: 'he-dispatch',
    icon: <Package size={20}/>,
    label: 'HE Dispatch',
    color: 'bg-teal-600',
    intro: 'Hatching Eggs dispatched to hatcheries are recorded here with grade breakdown per production date. Each dispatch can carry a formal invoice number from the HHF, HE, or VHPL series. TDS, loading details, and invoice printing are all handled here.',
    workflows: [
      {
        title: 'Record an HE dispatch',
        path: 'Flock Management → HE Dispatch → Add Dispatch',
        steps: [
          { text: 'Select Flock, Dispatch Date.' },
          { text: 'Party — select the hatchery/buyer. Type to search.' },
          { text: 'DC No (Dispatch Challan number).' },
          { text: 'Add production date lines: each date gets Grade A, Grade B, Grade C counts and an optional per-date rate.' },
          { text: 'Free Eggs and Invoice Eggs auto-calculate. Amount auto-rounds using Math.round().', note: 'If eggs span multiple dates at different rates, each line uses its own rate. Amount = sum of line amounts, then rounded.' },
          { text: 'TDS: select TDS % (0.1% to 10%). TDS Amount auto-calculates but can be edited. Net receivable shows instantly.' },
          { text: 'Loading Details: Vehicle Type (AC / NON-AC), Lorry Number, Driver Phone, Out Time.' },
          { text: 'Box Details: 20LB Boxes, 23LB Boxes, Extra Trays (20LB), Extra Trays (23LB). Auto-hint shows total eggs ÷ 210.' },
          { text: 'Save.' },
        ]
      },
      {
        title: 'View flock age per production date (expanded lines)',
        path: 'Flock Management → HE Dispatch → click the Invoice No link on any row',
        steps: [
          { text: 'Click the blue invoice number (e.g. NF/HHF/26-27/51 ▼) to expand the production date breakdown.' },
          { text: 'A table appears showing: Prod Date, Flock Age (at that date), Grade A, Grade B, Grade C, Total, Rate, Amount.' },
          { text: 'Flock Age is computed from flock placement date to each production date — e.g. "24w 3d".', note: 'This helps you track egg quality by flock age for each date of collection.' },
          { text: 'Click the invoice number again (▲) to collapse.' },
        ]
      },
      {
        title: 'Print invoice to PDF',
        path: 'Flock Management → HE Dispatch → printer icon on any row',
        steps: [
          { text: 'Click the printer icon on the dispatch row.' },
          { text: 'A Print Options modal opens — tick which sections to include on the invoice:', note: 'Seller section: Company Address & Phone. Buyer section: Buyer Address & GSTIN, Supply Details. Payment/Logistics: Bank Details, Lorry Number, Out Time, Box Details, Driver Phone.' },
          { text: 'Click Print. A new browser tab opens with the formatted invoice.' },
          { text: 'In the browser print dialog, choose "Save as PDF" to get a PDF file.', warning: 'Allow pop-ups for this site if you get a pop-up blocked warning.' },
          { text: 'The invoice shows: Production Date breakdown with Grade A/B/C per date, Amount Summary (Gross → Round Off → Invoice Amount → TDS → Net Payable), and Logistics section.' },
        ]
      },
      {
        title: 'Generate an invoice number for HE Dispatch',
        path: 'Flock Management → HE Dispatch → Add Dispatch → Invoice Series + Generate',
        steps: [
          { text: 'Select the Invoice Series matching the buyer:', note: 'HHF = NF/HHF/26-27/{N} for Hitech Hatch Fresh Pvt Ltd. HE = NF/HE/26-27/{N} for other hatchery buyers. VHPL = NF/VHPL/26-27/{N} for VHPL.' },
          { text: 'Click "Generate". The next invoice number appears as a preview.', note: 'Generate only previews — does not consume the number yet.' },
          { text: 'Click Save. The number is confirmed and the series counter increments.', warning: 'Cancelling after Generate does not waste a number — same number appears next time.' },
        ]
      },
    ],
    tips: [
      'One dispatch can cover eggs from multiple production dates — enter one line per date.',
      'One invoice (dispatch) can be sent to multiple hatcheries on different days — link each Hatch Batch to the same invoice in the Hatch Batches page.',
      'Use HHF series only for Hitech Hatch Fresh Pvt Ltd. Use HE for all other hatchery buyers.',
      'All dispatches with an invoice number appear in Accounts → Sales Invoice Register.',
      'Vehicle Type AC/NON-AC appears on the invoice print and in the dispatch table for quick reference.',
    ]
  },

  // ── HATCH BATCHES ─────────────────────────────────────────────────────────────
  {
    id: 'hatch-batches',
    icon: <Egg size={20}/>,
    label: 'Hatch Batches',
    color: 'bg-amber-600',
    intro: 'Link HE dispatch invoices to hatchery settings and record full hatch reports. One invoice can go to multiple hatcheries or be split across dates — each setting is a separate batch. Full spreadsheet-style column view with Import/Export.',
    workflows: [
      {
        title: 'Record a hatch batch (setting)',
        path: 'Flock Management → Hatch Batches → Add Batch',
        steps: [
          { text: 'Flock — select the flock whose eggs were sent.' },
          { text: 'Hatchery Name — the hatchery where eggs were set (e.g. Hitech Hatch Fresh Pvt Ltd).' },
          { text: 'Setting No — hatchery\'s own batch/setting number (e.g. S-2026-01).', note: 'Useful for matching with hatchery reports later.' },
          { text: 'Link Dispatch Invoice — select the HE dispatch this batch came from. Auto-fills Flock, Invoice No, and Received qty.' },
          { text: 'Setting Date (when eggs were placed in incubator). Hatch Date (when chicks emerged).', note: 'Egg Age column is auto-calculated as Setting Date minus average production date from the linked dispatch.' },
          { text: 'Eggs Weight (kg) if you track egg weight.' },
          { text: 'Received = total eggs from farm. Broken in Transit = cracked/broken eggs. Setting = Received − Broken (auto-computed).' },
        ]
      },
      {
        title: 'Enter hatch report (fill after hatch)',
        path: 'Flock Management → Hatch Batches → Edit (pencil icon) on a pending batch',
        steps: [
          { text: 'Infertile — eggs found infertile at candling (7-day check).' },
          { text: 'Blasters — blood-ring / early-dead eggs at candling.' },
          { text: 'Hatched (Total) — total chicks that emerged.' },
          { text: 'Culled Chicks — weak/deformed chicks culled at hatchery.' },
          { text: 'Std Chicks — auto-fills as Hatched − Culled − Rejects. Can be overridden.', note: 'Std = Standard/saleable chicks.' },
          { text: 'Unhatched — eggs that did not hatch.' },
          { text: 'Rejects — rejected chicks (wrong sex, deformed).' },
          { text: 'Chicks Sold — how many chicks were sold from this batch. Chick Rate (₹/chick). Revenue auto-calculates.' },
          { text: 'Save. All % columns (Broken%, Inf%, Blst%, Hatch%, Unhatch%, Reject%) are computed automatically in the table.' },
        ]
      },
      {
        title: 'One invoice → multiple hatchery batches',
        path: 'Flock Management → Hatch Batches → Add Batch (repeat for each hatchery)',
        steps: [
          { text: 'If one dispatch invoice covers eggs sent to multiple hatcheries or on different days, create a separate batch for each.', note: 'Example: Invoice of 80,640 eggs → 20,000 to Hatchery A on Day 1, 40,000 to Hatchery B on Day 1, 10,000 to Hatchery C on Day 1, 10,640 to Hatchery A on Day 2.' },
          { text: 'Link all 4 batches to the same dispatch invoice in the "Link Dispatch Invoice" dropdown.' },
          { text: 'Each batch tracks its own received qty, broken, setting, hatch result separately.' },
          { text: 'The Received field on each batch is what you enter manually — no automatic validation against the invoice total.' },
        ]
      },
      {
        title: 'Understanding the 3 age columns',
        path: 'Flock Management → Hatch Batches → table view (scroll right)',
        steps: [
          { text: 'Age@Setting (blue) — how old the flock was on the setting date. Example: "25w 1d". Computed from flock placement date.' },
          { text: 'Age@Prod (purple) — how old the flock was when eggs were laid. Computed from the weighted average production date of the linked dispatch. Example: "24w 4d".', note: 'Requires a linked dispatch with production date lines entered.' },
          { text: 'Egg Age (orange) — how many days eggs were stored between collection and setting. Example: "4d". Computed as Setting Date − average production date.', note: 'Lower egg age = fresher eggs = better hatchability. Industry target is ≤ 5 days.' },
        ]
      },
      {
        title: 'Import hatch batches from Excel',
        path: 'Flock Management → Hatch Batches → Template → (fill) → Import',
        steps: [
          { text: 'Click "Template" to download a blank Excel file with the correct column headers.' },
          { text: 'Fill in your data. Date format: DD/MM/YYYY. Flock No: just the number (e.g. 19, not F-19).' },
          { text: 'Click "Import" and select your filled file.' },
          { text: 'Batches are inserted. Existing records are not updated — import creates new rows only.' },
        ]
      },
      {
        title: 'Export and delete batches',
        path: 'Flock Management → Hatch Batches',
        steps: [
          { text: 'Export: click the "Export" button to download visible batches as Excel with all computed columns.' },
          { text: 'Delete: tick checkboxes on rows to select them. A "Delete (N)" button appears at the top — click it and confirm to delete selected batches.' },
        ]
      },
    ],
    tips: [
      'Yellow rows = batches awaiting hatch report (setting date entered but no hatched chicks yet). Pipeline tab shows only these.',
      'Std Chicks auto-fills as Hatched − Culled − Rejects. Override if the hatchery gives you the Std count directly.',
      'Egg Age < 5 days is ideal. Eggs older than 7 days typically show lower hatchability.',
      'Setting×STD% column = Setting × (Std/Setting) — useful for cross-batch comparison of effective yield.',
      'STD−Sale Chicks = how many standard chicks were kept (not sold immediately).',
    ]
  },

  // ── GST ───────────────────────────────────────────────────────────────────────
  {
    id: 'gst',
    icon: <Receipt size={20}/>,
    label: 'GST',
    color: 'bg-red-700',
    intro: 'GST compliance for both purchases and sales. The app handles intra-state (CGST+SGST) and inter-state (IGST) automatically based on supplier/buyer state. Input GST on purchases goes to indirect expenses (no ITC claim). RCM applies to rent and flagged vendors.',
    workflows: [
      {
        title: 'Set up a party\'s GST details',
        path: 'Masters → Parties → Add / Edit party',
        steps: [
          { text: 'GSTIN field — type the 15-digit GST number. The app validates format and auto-fills the state code from the first two digits.', note: 'Example: 36ABJFM1393C1ZC → state code 36 = Telangana.' },
          { text: 'GST Registration — select Registered, Unregistered, or Composition.' },
          { text: 'State Code — auto-filled from GSTIN; can also be typed manually for unregistered parties.' },
          { text: 'RCM Applicable — tick this for parties where you pay tax under Reverse Charge (e.g. rent landlords). When you select this party in Purchase Entry, RCM is automatically ticked.' },
          { text: 'Save.' },
        ]
      },
      {
        title: 'Enter a purchase with GST (GRN)',
        path: 'Feed Mill → GRN Entry → + New GRN (or Purchase Entry)',
        steps: [
          { text: 'Select Supplier. Supply Type (Intra-state / Inter-state) is auto-detected from the supplier\'s state code vs our state (Telangana).' },
          { text: 'GST %: select 0%, 5%, or 18%.' },
          { text: 'Nature of Purchase: Purchase (stock item), Expense (service/indirect), or Asset.' },
          { text: 'RCM: auto-ticked if the supplier is flagged for RCM. Can be manually overridden.' },
          { text: 'The GST Classification section shows live CGST + SGST (intra) or IGST (inter) amounts as you enter the basic amount.', note: 'No ITC is claimed — input GST goes to indirect expenses as per our accounting policy.' },
          { text: 'Save. CGST, SGST, IGST amounts are stored on the GRN record for GST reports.' },
        ]
      },
      {
        title: 'View GSTR-1 (outward supplies) data',
        path: 'Reports → GST Reports → GSTR-1 tab',
        steps: [
          { text: 'Select month and year at the top.' },
          { text: 'B2B table: sales to registered buyers (buyer GSTIN on the invoice). Used for Table 4 of GSTR-1.' },
          { text: 'B2C table: sales to unregistered buyers. Used for Table 7 of GSTR-1.' },
          { text: 'Exempt/Nil Sales card: HE (hatching eggs) sales which are zero-rated/exempt.' },
          { text: 'HSN Summary: item-wise tax breakdown required in GSTR-1 Table 12.' },
          { text: 'Export to Excel for filing or sharing with your CA.' },
        ]
      },
      {
        title: 'View GSTR-3B summary',
        path: 'Reports → GST Reports → GSTR-3B tab',
        steps: [
          { text: 'Select month and year.' },
          { text: 'Section 3.1(a): Total taxable outward supplies and tax payable (CGST + SGST + IGST).' },
          { text: 'Section 3.1(c): Nil-rated and exempt outward supplies (HE eggs).' },
          { text: 'Section 3.1(d): Inward supplies under RCM — tax you must pay as the buyer.' },
          { text: 'Section 6.1: Total tax payable = outward tax + RCM tax.' },
          { text: 'Export to Excel.' },
        ]
      },
      {
        title: 'View RCM Register',
        path: 'Reports → GST Reports → RCM Register tab',
        steps: [
          { text: 'Shows all purchase GRN entries where is_rcm = Yes.' },
          { text: 'Use this to verify the RCM tax you need to pay in cash for the month (no set-off available without ITC).' },
          { text: 'Common RCM sources: rent payments, flagged vendors identified from GSTR-2B.' },
        ]
      },
    ],
    tips: [
      'Our company GSTIN: 36ABJFM1393C1ZC, State: Telangana (36). The app uses this to auto-detect intra vs inter-state.',
      'GST on purchases (input tax) is not claimed as ITC — it is treated as part of the cost (indirect expense).',
      'RCM means you pay GST directly to the government, not to the supplier. The supplier invoices you without tax.',
      'Hatching eggs (HE) are exempt from GST — always use 0% for HE dispatches.',
      'After getting your GSTR-2B from the portal, you can identify additional RCM vendors and flag them in party master.',
    ]
  },

  // ── INVOICE SERIES ────────────────────────────────────────────────────────────
  {
    id: 'invoice-series',
    icon: <FileText size={20}/>,
    label: 'Invoice Series',
    color: 'bg-blue-800',
    intro: 'The app maintains separate invoice number sequences for each type of sale to avoid duplicate invoice numbers across different buyers and sale types.',
    workflows: [
      {
        title: 'Invoice series in use',
        path: 'Used in HE Dispatch and NHE Sales forms',
        steps: [
          { text: 'HHF series — NF/HHF/26-27/{N} — for Hitech Hatch Fresh Pvt Ltd (main hatching egg buyer). Started from 50 (April–June 2026 filed).', note: 'Use this series ONLY for Hitech Hatch Fresh invoices.' },
          { text: 'HE series — NF/HE/26-27/{N} — for all other hatching egg buyers. Started from 7.' },
          { text: 'VHPL series — NF/VHPL/26-27/{N} — for VHPL. Started from 2.' },
          { text: 'NHE series — NF/26-27/NHE/{N} — for non-hatching egg sales (JE, TE, BE). Started from 2.', note: 'Note: in the NHE format the year comes before the series code — NF/26-27/NHE/3.' },
          { text: 'CB series — NF/CB/26-27/{N} — for Cull Bird sales. Started from 15. Uses 2-digit padding (NF/CB/26-27/16).' },
        ]
      },
      {
        title: 'How Generate works (important)',
        path: 'HE Dispatch or NHE Sales form → Generate button',
        steps: [
          { text: 'Click Generate → the app shows a PREVIEW of the next invoice number. Example: NF/HHF/26-27/51.' },
          { text: 'The counter is NOT incremented yet. If you cancel the form, the number is not wasted.' },
          { text: 'When you click Save, the counter increments at that moment and the number is permanently assigned.', warning: 'If two people click Generate at the same moment and both Save, the second Save automatically gets the next available number — no duplicates.' },
          { text: 'You can also type an invoice number manually and skip Generate.' },
        ]
      },
      {
        title: 'Invoice Series / Counters admin page',
        path: 'Accounts → Invoice Series / Counters',
        steps: [
          { text: 'Lists all series with their current counter, prefix, and what the next invoice number will be.' },
          { text: 'Click the edit (pencil) icon on any row to change the current_no counter.', note: 'current_no = last used number. Next invoice = current_no + 1.' },
          { text: 'Use this ONLY to fix a counter that got ahead of real invoices.', warning: 'Never set current_no below the last real filed invoice number — that would create duplicate invoice numbers.' },
        ]
      },
    ],
    tips: [
      'Invoice numbers for April–May 2026 are already filed and locked. Do not create invoices that would conflict with already-filed numbers.',
      'All issued invoices appear in Accounts → Sales Invoice Register.',
      'If a counter needs resetting, use Accounts → Invoice Series / Counters instead of direct DB edits.',
    ]
  },

  // ── ACCOUNTS ──────────────────────────────────────────────────────────────────
  {
    id: 'accounts',
    icon: <CreditCard size={20}/>,
    label: 'Accounts & Invoices',
    color: 'bg-violet-700',
    intro: 'The Accounts section has the Cash Book, Sales Invoice Register, Purchase Invoice Register, and Invoice Series / Counters. Cash entries flow in automatically from sales.',
    workflows: [
      {
        title: 'Sales Invoice Register',
        path: 'Accounts → Sales Invoice Register',
        steps: [
          { text: 'Shows all outward (sale) invoices — both HE Dispatch and NHE Sales — where an invoice number has been assigned.' },
          { text: 'Filter by invoice series (HHF / HE / NHE / VHPL / CB) and date range.' },
          { text: 'Columns: Invoice No, Date, Series, Type, Party, Flock, Amount.' },
          { text: 'Export to Excel for month-end reconciliation or CA submission.' },
          { text: 'Invoices only appear here after Save — clicking Generate alone does not create an entry.', note: 'This is your GSTR-1 outward supply list for sales invoices.' },
        ]
      },
      {
        title: 'Purchase Invoice Register',
        path: 'Accounts → Purchase Invoice Register',
        steps: [
          { text: 'Shows all supplier invoices received — chick supply, feed, medicines, electricity, labour, other.' },
          { text: 'Each invoice shows: Invoice No, Date, Type, Supplier, Linked Flock/Farm, Total, Paid, Balance, Status.' },
          { text: 'Click the "Pay" button on any row to record a payment (full or partial).' },
          { text: 'Overdue invoices (past due date, not fully paid) are highlighted in red.' },
          { text: 'Filter by invoice type or payment status.' },
          { text: 'Import from Excel using the Template → Import flow.' },
        ]
      },
      {
        title: 'Cash Book',
        path: 'Accounts → Cash Book',
        steps: [
          { text: 'Every NHE / Bird Sale that is paid in cash or online is automatically added to the Cash Book on save.' },
          { text: 'HE Dispatch payments are added to Cash Book when payment is received (separate step).' },
          { text: 'You can also add manual cash entries for any other income or expense.' },
          { text: 'Filter by date range and category.' },
        ]
      },
      {
        title: 'Bank Ledger — the one page for reconciling payments made outside the app',
        path: 'Accounts → Bank Ledger',
        steps: [
          { text: 'Shows every real bank movement — vendor bill payments, salary batches, and other transfers — per bank account.' },
          { text: 'If you pay vendors directly via your bank\'s netbanking site (not from inside this app), record it here: Import Statement tab → upload your real bank CSV.' },
          { text: 'Link to Bills tab: shows every imported transaction the app couldn\'t auto-match. Click Link, tick the bill(s) it paid (one payment can cover several bills), and they\'re marked Paid together. Checkboxes let you bulk Ignore or Delete stray/duplicate-imported rows.' },
          { text: 'Search box (description/reference/category/party) and date-range filter both narrow the Transactions tab.' },
          { text: 'Manage Bank Accounts lets you add/edit the accounts this ledger tracks.' },
        ]
      },
    ],
    tips: [
      'Sales Invoice Register = outward (what you issued). Purchase Invoice Register = inward (what you received from suppliers).',
      'Cash Book entries from sales are created automatically — do not enter them again manually.',
      'To fix an invoice counter (e.g. HHF got ahead), go to Accounts → Invoice Series / Counters.',
      'Bank Ledger should always show one row per real bank transaction — if a batch payment (like Bulk Salary) ever shows multiple rows for what was one real transfer, use Bulk Salary Payment (not one-by-one marking) to avoid that.',
      'If you always pay vendors from outside the app (netbanking) and reconcile via Import Statement, you can skip Pending Payments\' "Pay"/"Bulk Pay" buttons entirely — just do everything from Bank Ledger.',
    ]
  },

  // ── EMPLOYEES ─────────────────────────────────────────────────────────────────
  {
    id: 'employees',
    icon: <Users size={20}/>,
    label: 'Employees',
    color: 'bg-indigo-600',
    intro: 'Manage employee records, daily attendance, advances, and monthly salary. The flow is: Add Employee → Mark Attendance daily → Salary Entry monthly (auto-fill from attendance).',
    workflows: [
      {
        title: 'Add a new employee',
        path: 'HR & Payroll → Employee List → + Add Employee',
        steps: [
          { text: 'Enter Name, Emp ID (e.g. BPS4001), Designation, Phone.' },
          { text: 'Farm/Site assignment.' },
          { text: 'Basic Salary, HRA, PF % (employee & employer), ESI toggle, PT toggle.' },
          { text: 'Bank details for salary transfer if paying online.' },
          { text: 'Save.' },
        ]
      },
      {
        title: 'Mark daily attendance',
        path: 'HR & Payroll → Attendance → Daily Attendance',
        steps: [
          { text: 'Select Farm and Date.' },
          { text: 'For each employee: set status — P (Present), A (Absent), H (Half Day), WO (Week Off), OT (Full OT Day).' },
          { text: 'OT Hours column — enter hours of overtime worked on a normal Present day.' },
          { text: 'Save All button saves the entire day at once.' },
        ]
      },
      {
        title: 'Enter monthly salary',
        path: 'HR & Payroll → Salary Entry → + Add',
        steps: [
          { text: 'Select Employee and Month.' },
          { text: 'Click "📋 Auto-fill Attendance" — fills Days Worked and pending Advances automatically.' },
          { text: 'Review: Basic, HRA, Arrears, OT Bonus. Gross is auto-calculated.' },
          { text: 'Deductions: ESI (only if gross ≤ ₹21,000), PF, PT (auto-slabbed: ≤15k→0, ≤20k→150, >20k→200).' },
          { text: 'Net Salary = Gross − All Deductions.' },
          { text: 'Payment Mode: Cash or Online.' },
          { text: 'Save.' },
        ]
      },
      {
        title: 'Pay many employees at once (Bulk Salary Payment)',
        path: 'HR & Payroll → Bulk Salary → Payment tab',
        steps: [
          { text: 'Select the month. Bank Transfer and Cash Payment sections each list unpaid employees with a checkbox.' },
          { text: 'Tick the employees you are paying in this batch (or use "select all"), enter one shared UTR/reference and date, and for bank transfers pick the bank account.' },
          { text: 'The toolbar shows a live total of the selected employees\' net salary before you confirm.' },
          { text: 'Click "Mark N as Paid" — one shared bank_transactions entry is created for the whole batch (matching how your real bank statement shows one line), and every selected employee is linked to it.' },
          { text: 'Use the search box above the tables to find an employee quickly, and the small pencil icon on a Paid row to revert it back to Pending if you made a mistake.' },
        ]
      },
      {
        title: 'Statutory Compliance (TDS/GST/PF/ESI/PT)',
        path: 'HR & Payroll → Statutory Compliance',
        steps: [
          { text: 'One page rolling up all statutory deductions/liabilities across employees for a selected month — PF, ESI, PT, and TDS.' },
          { text: 'Use this before filing monthly PF/ESI returns or making the statutory payment.' },
        ]
      },
      {
        title: 'Salary CMS Export',
        path: 'HR & Payroll → Salary CMS Export',
        steps: [
          { text: 'Generates the bank\'s CMS (bulk-payment) file for a month\'s salary, grouped by site with subtotals.' },
          { text: 'Print option is also available with the same per-site subtotal + grand total layout.' },
          { text: 'Rows with zero net salary are automatically excluded.' },
        ]
      },
    ],
    tips: [
      'PT (Professional Tax) is auto-calculated based on gross salary slabs — do not enter it manually.',
      'ESI is not deducted if gross salary exceeds ₹21,000.',
      'Use "Quick Generate All" to create salary for all employees of a farm in one step.',
      'Prefer Bulk Salary Payment over marking employees Paid one at a time — it keeps Bank Ledger showing one real transaction per batch instead of one row per employee.',
    ]
  },

  // ── ELECTRICITY ───────────────────────────────────────────────────────────────
  {
    id: 'electricity',
    icon: <Zap size={20}/>,
    label: 'Electricity',
    color: 'bg-yellow-600',
    intro: 'Track electricity bills per meter. Each farm/site has one or more meters. Bills are entered monthly. Analysis tab shows site-wise yearly comparison.',
    workflows: [
      {
        title: 'Enter a monthly electricity bill',
        path: 'Electricity → Bills Entry tab',
        steps: [
          { text: 'Click + Add Bill.' },
          { text: 'Select Meter (set up in Masters → Meters).' },
          { text: 'Bill Month (YYYY-MM).' },
          { text: 'Units Consumed, Amount (₹), ACD/DC Due if any.' },
          { text: 'Paid Date — fill when payment is made.' },
          { text: 'Save.' },
        ]
      },
      {
        title: 'View site-wise yearly analysis',
        path: 'Electricity → Analysis tab',
        steps: [
          { text: 'Select Financial Year (e.g. 2025-26).' },
          { text: 'Optionally select a Compare Year to see side-by-side.' },
          { text: 'Summary cards show total units and amount for the year.' },
          { text: 'Month-wise table shows units and amount with % change vs previous year.' },
        ]
      },
    ],
    tips: [
      'Add meters in Masters → Meters before entering bills. Each meter needs a site/farm assigned.',
    ]
  },

  // ── FEED MILL ─────────────────────────────────────────────────────────────────
  {
    id: 'feed',
    icon: <Package size={20}/>,
    label: 'Feed Mill',
    color: 'bg-lime-700',
    intro: 'Track raw material purchases (GRN), feed production, and feed transfers to farms. Stock is calculated automatically from GRN receipts minus production usage.',
    workflows: [
      {
        title: 'Record a raw material purchase (GRN)',
        path: 'Feed Mill → GRN Entry → + New GRN',
        steps: [
          { text: 'GRN Date, GRN/Invoice No, Supplier/Party. Type to search supplier if you have many.' },
          { text: 'Ingredient (Maize, Soya, etc.) — must exist in Masters → Ingredients.' },
          { text: 'Quantity (kg), Rate per kg, Total Amount.' },
          { text: 'GST %: select 0%, 5%, or 18%. Supply Type and CGST/SGST/IGST split auto-calculate.', note: 'Common rates: Maize/Soya/DORB = 5%, Trays/Boxes/Twine = 5%, Tape/Chemicals = 18%.' },
          { text: 'Nature: Purchase (stock item), Expense (service), or Asset.' },
          { text: 'Vehicle No for the truck.' },
          { text: 'Save. Stock automatically increases.' },
        ]
      },
      {
        title: 'Set up feed formulas',
        path: 'Feed Mill → Formulas → + Add Formula',
        steps: [
          { text: 'Formula Code — your internal code (e.g. BRD-PRE-V2).' },
          { text: 'Feed Type — select from the master feed types (BCM, BGM, L1, L2, etc.). Flock Type (Breeder/Layer/Broiler) auto-fills.', note: 'Feed Types must be set up in Masters → Feed Types before formulas can be created.' },
          { text: 'Week From / Week To — the age range (weeks) this formula applies to.' },
          { text: 'Add ingredients with percentage and kg per 1000 kg batch. Total % should add up to 100.' },
          { text: 'Save.' },
        ]
      },
      {
        title: 'Record feed production',
        path: 'Feed Mill → Feed Production → + New Batch',
        steps: [
          { text: 'Select Feed Type (L1, L2, BCM, etc.).' },
          { text: 'Production Date, Quantity Produced (kg).' },
          { text: 'Formula (if set up) auto-fills ingredient consumption.' },
          { text: 'Save. Raw material stock decreases, finished feed stock increases.' },
        ]
      },
      {
        title: 'Transfer feed to a farm',
        path: 'Feed Mill → Feed Transfer → + New Transfer',
        steps: [
          { text: 'Transfer Date, Feed Type, Quantity (kg).' },
          { text: 'To Farm — which farm received this feed.' },
          { text: 'Save. Finished feed stock decreases.' },
        ]
      },
    ],
    tips: [
      'Stock Page (Feed Mill → Stock) shows current raw material and finished feed stock in real time.',
    ]
  },

  // ── MASTERS ───────────────────────────────────────────────────────────────────
  {
    id: 'masters',
    icon: <Settings size={20}/>,
    label: 'Masters (Setup)',
    color: 'bg-gray-600',
    intro: 'Masters are the reference data that the rest of the app depends on. Set these up first before entering any operational data.',
    workflows: [
      {
        title: 'Setup order — do this first',
        path: 'Masters (left nav)',
        steps: [
          { text: '1. Farms — add each farm/site with code and location.' },
          { text: '2. Sheds — add sheds for each farm. Each shed belongs to one farm.' },
          { text: '3. Parties — add buyers, suppliers, hatcheries. Include GSTIN and State Code for GST compliance.' },
          { text: '4. Ingredients — raw materials used in feed (Maize, Soya, DORB, etc.).' },
          { text: '5. Meters — electricity meters with their farm and USC number.' },
          { text: '6. Feed Types — L1, L2, L3, BCM, BGM, etc.' },
          { text: '7. Vaccination Schedule — standard schedule per age week for each vaccine.' },
        ]
      },
      {
        title: 'Edit dropdown option lists',
        path: 'Admin Centre → Masters tab',
        steps: [
          { text: 'The Masters tab in Admin Centre shows editable lists for all dropdown options used across the app.' },
          { text: 'Categories — expense/purchase categories used in Cash Book and GRN.' },
          { text: 'Units — measurement units (kg, nos, bags, ltrs, trays, etc.) used in sale and purchase forms.' },
          { text: 'Material Types — types of raw materials (feed ingredient categories).' },
          { text: 'Payment Methods — Cash, NEFT, UPI, Cheque, RTGS etc.' },
          { text: 'Breeds — chicken breeds (BV300, Dekalb, etc.) used in flock creation.' },
          { text: 'Feed Types — BCM, BGM, L1, L2, L3, etc. used in Feed Mill formulas and Daily Entry.' },
          { text: 'Designations — employee job titles used in HR & Payroll.' },
          { text: 'To add a new option: type in the input box and click Add. To delete: click the × on any existing item.' },
        ]
      },
      {
        title: 'Set HSN Code and GST Rate on Feed Ingredients',
        path: 'Masters → Ingredients → Edit (pencil icon)',
        steps: [
          { text: 'Open any ingredient and scroll to the bottom of the edit form.' },
          { text: 'HSN Code — enter the 8-digit HSN code for the raw material (e.g. 10059090 for Maize).', note: 'HSN codes appear in GSTR-1 HSN Summary table.' },
          { text: 'GST Rate % — select 0%, 5%, or 18% as applicable for this ingredient.' },
          { text: 'Save. These values will pre-fill when you raise a GRN for this ingredient.' },
        ]
      },
      {
        title: 'Add a party with GST details',
        path: 'Masters → Parties → + Add Party',
        steps: [
          { text: 'Name, Type (Buyer / Supplier / Both / Hatchery), Phone.' },
          { text: 'GSTIN — type the 15-digit number. State code auto-fills from the first two digits and the format is validated.', note: 'Leave blank for unregistered parties.' },
          { text: 'GST Registration — Registered, Unregistered, or Composition.' },
          { text: 'State Code — auto-filled from GSTIN; type manually for unregistered inter-state parties.' },
          { text: 'RCM Applicable — tick for landlords and any other parties under Reverse Charge.' },
          { text: 'Save.' },
        ]
      },
    ],
    tips: [
      'You cannot enter daily records without sheds. You cannot enter GRN without ingredients. Set up masters first.',
      'Parties with type "Buyer" appear in NHE/Bird Sale party dropdowns. Type "Supplier" appears in GRN and Purchase Entry.',
      'All dropdown lists in the app (Breeds, Feed Types, Units, etc.) can be customised in Admin Centre → Masters.',
    ]
  },

  // ── PURCHASE & PAYMENTS ───────────────────────────────────────────────────────
  {
    id: 'purchase-payments',
    icon: <ShoppingCart size={20}/>,
    label: 'Purchase & Payments',
    color: 'bg-emerald-700',
    intro: 'Track every purchase made for the farm — feed ingredients, medicines, equipment, services. Each purchase is raised as a Purchase Order (PO). Payments are recorded separately against each PO.',
    workflows: [
      {
        title: 'Raise a Purchase Order (PO)',
        path: 'Purchase & Payments → + New PO',
        steps: [
          { text: 'PO No — your internal PO number.' },
          { text: 'Vendor Name — type the supplier name. Existing vendors auto-suggest.' },
          { text: 'Financial Year — select the FY this PO belongs to (e.g. 2025-26).' },
          { text: 'Item/Ingredient, Quantity, Unit, Rate, Total Amount.' },
          { text: 'Save. The PO status starts as "Pending".' },
        ]
      },
      {
        title: 'Record stock receipt against a PO',
        path: 'Purchase & Payments → PO row → 📦 receipt icon',
        steps: [
          { text: 'When goods physically arrive, click the green box/package icon on the PO row.' },
          { text: 'Enter the quantity received, actual rate, invoice amount, Vehicle No and Bill/Invoice No.' },
          { text: 'Save. PO status updates to "Received". Stock in Feed Mill increases if it is a raw material.' },
        ]
      },
      {
        title: 'Record a payment against a PO',
        path: 'Purchase & Payments → Payments tab → + Add Payment',
        steps: [
          { text: 'Select the PO No — vendor name and outstanding amount fill automatically.' },
          { text: 'Payment Date, Amount Paid, Payment Mode: Cash, NEFT, RTGS, Cheque, UPI.' },
          { text: 'Bank Reference No / UTR / Cheque No — important for reconciliation.' },
          { text: 'TDS deducted (if applicable) — enter TDS amount separately.' },
          { text: 'Save. Outstanding balance on that PO reduces automatically.' },
        ]
      },
      {
        title: 'Rate Comparison',
        path: 'Purchase & Payments → Rate Comparison',
        steps: [
          { text: 'Compare the rates charged by different vendors for the same ingredient across GRN entries.' },
          { text: 'Useful for identifying which vendor gives the best rate for Maize, Soya, etc.' },
        ]
      },
      {
        title: 'Vendor Statement',
        path: 'Purchase & Payments → Vendor Statement',
        steps: [
          { text: 'Full account statement for a selected vendor — all POs, receipts, and payments in chronological order.' },
          { text: 'Running balance column shows how much was owed after each transaction.' },
          { text: 'Use this when a vendor queries their account or before making a payment.' },
        ]
      },
      {
        title: 'Delete a vendor and all their data',
        path: 'Purchase & Payments → Vendors Master tab',
        steps: [
          { text: 'The Vendors Master tab lists every unique vendor name from Purchase Orders, Payments, and Vendor Bank Details.' },
          { text: 'Click the trash icon on a row to delete ALL data for that vendor — POs, payments, and bank details are permanently removed.', warning: 'This cannot be undone. Use only when you want to completely remove a vendor and all their history.' },
          { text: 'To delete multiple vendors at once, tick checkboxes and click "Delete All Data for Selected".' },
        ]
      },
      {
        title: 'Items Master, GRN and Pending Payments (Purchase sidebar)',
        path: 'Purchase → Items Master / GRN / Payments',
        steps: [
          { text: 'Items Master is the master list of purchasable items (feed ingredients, medicines, etc.) with reorder levels.' },
          { text: 'GRN records goods actually received — from here a GRN can auto-create a linked entry in Pending Payments (Purchase → Payments), which is where you record and track vendor bill payments and see overdue bills.' },
          { text: 'Each GRN row has a Print option (with letterhead/logo) matching invoice formatting used elsewhere.' },
        ]
      },
      {
        title: 'Pay multiple bills at once (Bulk Pay)',
        path: 'Pending Payments → tick bill checkboxes',
        steps: [
          { text: 'Tick the checkboxes on several unpaid bills — a blue toolbar appears with Mode, Bank Account, Reference, and Date.' },
          { text: 'It shows the live total for the selected bills. Click "Mark N as Paid" to settle them all as ONE real payment.' },
          { text: 'This creates a single Bank Ledger entry for the whole batch (matching your real bank statement), not one row per bill.' },
        ]
      },
      {
        title: 'Vendor Advances — pay a supplier ahead of a bill',
        path: 'Accounts → Vendor Advances / Pending Payments → Pay',
        steps: [
          { text: 'Accounts → Vendor Advances → Add Advance: record money paid to a supplier before any specific bill exists (cash or bank transfer). This posts once to Cash Book / Bank Ledger.' },
          { text: 'When you later Pay a bill for that same vendor in Pending Payments, "Advance" appears as a payment mode (only when that vendor has an available advance balance).' },
          { text: 'Selecting Advance and picking which advance to use adjusts the bill against it — no new cash/bank entry is created, since the money already moved when the advance was recorded.' },
        ]
      },
      {
        title: 'Recording miscellaneous bank transactions (bank charges, one-off advances)',
        path: 'Accounts → Bank Ledger → Add Transaction',
        steps: [
          { text: 'Not everything has a voucher — bank charges, interest, or a one-off advance can be entered directly in Bank Ledger.' },
          { text: 'Select the account, click Add Transaction, choose Debit/Credit, pick a Category (e.g. "Bank Charges"), optionally link a Party, enter amount and reference.' },
          { text: 'For an advance TO an employee, use Employees → Advances instead (it tracks recovery against future salary). For a vendor advance, use Vendor Advances instead (it tracks recovery against future bills) — Bank Ledger direct entry is the fallback for things that don\'t fit any tracked category.' },
        ]
      },
    ],
    tips: [
      'Always record stock receipt before recording payment — the receipt confirms goods arrived.',
      'TDS: enter TDS amount in the payment form. The vendor\'s outstanding reduces by the full invoice amount, not just cash paid.',
      'Party Outstanding report is the fastest way to answer "how much do we owe to [vendor]?"',
    ]
  },

  // ── IMPORT ────────────────────────────────────────────────────────────────────
  {
    id: 'import',
    icon: <FileSpreadsheet size={20}/>,
    label: 'Import & Excel Converter',
    color: 'bg-cyan-700',
    intro: 'Import bulk data from your existing Excel files using the Excel Converter. It maps your columns to the app fields, shows a preview with errors, then imports in one click.',
    workflows: [
      {
        title: 'Import data from your Excel file',
        path: 'Import Data → ✦ Excel Converter',
        steps: [
          { text: 'Step 1 — Select Type: choose what you are importing (Daily Records, Salary, Electricity Bills, Attendance, GRN, Flock Transfers).' },
          { text: 'Step 2 — Upload File: drag and drop your .xlsx or .csv file, or click Browse.' },
          { text: 'Step 3 — Map Columns: the app tries to auto-match your column names to app fields. Green = matched. For unmatched fields use the dropdown to pick your column manually.', note: 'Your file does not need to have the exact column names — the mapping step handles the difference.' },
          { text: 'Click "Preview Mapped Data" to see all rows with OK / Warn / Error status.' },
          { text: 'Click "Import N Valid Rows". Done.' },
        ]
      },
    ],
    tips: [
      'The converter handles Indian date formats (DD.MM.YY, DD/MM/YYYY, DD-MM-YYYY) and Excel serial dates automatically.',
      'If the same record already exists (same flock + date, or same employee + month), it is updated — not duplicated.',
    ]
  },

  // ── BUYER ADVANCES & PARTY LEDGER ────────────────────────────────────────────
  {
    id: 'buyer-advances',
    icon: <CreditCard size={20}/>,
    label: 'Buyer Advances',
    color: 'bg-teal-700',
    intro: 'Record advance payments received from buyers before the actual sale. These advances can be deducted automatically when receiving payment for HE Dispatch or NHE Sales.',
    workflows: [
      {
        title: 'Record an advance payment from a buyer',
        path: 'Accounts → Buyer Advances → + Add Advance',
        steps: [
          { text: 'Select the Party (buyer) from the dropdown. Type to search.' },
          { text: 'Advance Date — the date the money was received.' },
          { text: 'Amount — the advance amount received.' },
          { text: 'Payment Mode — Cash or Bank. If Bank, select the bank account.' },
          { text: 'Reference / Remarks — optional (UTR, cheque no, etc.).' },
          { text: 'Save. The advance is posted to Cash Book (if Cash) or Bank Ledger (if Bank) automatically.', note: 'The advance balance for this buyer is now available for deduction on future sales.' },
        ]
      },
      {
        title: 'Use advance when receiving payment for a sale',
        path: 'Flock Management → HE Dispatch (or NHE Sales) → Receive Payment button',
        steps: [
          { text: 'Click "Receive Payment" on any unpaid HE dispatch or NHE sale.' },
          { text: 'If the buyer has an advance balance, a blue banner shows the available advance amount.' },
          { text: 'Select "Advance" as the payment mode.' },
          { text: 'The advance amount is deducted from the buyer\'s advance balance and the sale is marked paid.', note: 'Partial advance use: if advance is less than the sale amount, use advance for part and another mode for the rest.' },
        ]
      },
      {
        title: 'View all advances for a buyer',
        path: 'Accounts → Buyer Advances → filter by Party',
        steps: [
          { text: 'Use the Party filter dropdown to see all advance records for a specific buyer.' },
          { text: 'Each row shows: Date, Amount, Amount Used, Balance Remaining, Payment Mode.' },
          { text: 'Delete an advance only if it was entered by mistake and has not been used in any sale payment.' },
        ]
      },
    ],
    tips: [
      'Advance balance = Amount − Amount Used. The blue banner in the payment modal shows this balance.',
      'Advances are buyer-specific — they cannot be transferred between buyers.',
      'To see the full picture of a buyer\'s transactions (advances + sales + payments), use Accounts → Party Ledger.',
    ]
  },

  // ── PARTY LEDGER ─────────────────────────────────────────────────────────────
  {
    id: 'party-ledger',
    icon: <FileText size={20}/>,
    label: 'Party Ledger',
    color: 'bg-violet-800',
    intro: 'A running debit/credit account statement for any buyer. Shows all HE Dispatch sales, NHE Sales, advance receipts, and payments in one timeline with a running balance.',
    workflows: [
      {
        title: 'View a buyer\'s ledger',
        path: 'Accounts → Party Ledger → select Party',
        steps: [
          { text: 'Select the party (buyer) from the dropdown. Type to search.' },
          { text: 'Set From Date and To Date to narrow the period.', note: 'Leave From Date blank to see all transactions from the beginning.' },
          { text: 'The table shows: Date, Type (HE Dispatch / NHE Sale / Advance / Payment), Reference, Debit (amount billed), Credit (amount received/advanced), Balance.' },
          { text: 'Debit = sales billed to the buyer. Credit = payments received or advances given.', note: 'Balance = cumulative Debit − cumulative Credit. Positive balance = buyer owes you money.' },
          { text: 'Click "Export Excel" to download the full ledger for sharing with the buyer or your CA.' },
        ]
      },
    ],
    tips: [
      'Use Party Ledger to answer "how much does [buyer] owe us?" instantly.',
      'The running balance column matches what Party Outstanding report shows for that buyer.',
      'If balance looks wrong, check that all advances and payments are correctly recorded.',
    ]
  },

  // ── MONTHLY ATTENDANCE GRID ───────────────────────────────────────────────────
  {
    id: 'monthly-attendance',
    icon: <Calendar size={20}/>,
    label: 'Monthly Attendance Grid',
    color: 'bg-indigo-700',
    intro: 'Enter attendance for all employees of a farm in a fast calendar-style grid — one row per employee, one column per day. Much faster than entering day by day.',
    workflows: [
      {
        title: 'Enter monthly attendance in grid view',
        path: 'HR & Payroll → Monthly Attendance',
        steps: [
          { text: 'Select Farm and Month at the top.' },
          { text: 'The grid loads with all active employees as rows and days 1-31 as columns. Sundays are highlighted in red.' },
          { text: 'Click any cell to cycle through statuses: P (Present) → A (Absent) → H (Half Day) → WO (Week Off) → OT (Full OT Day) → back to P.' },
          { text: 'For OT days: a small hours input appears below the OT badge. Enter the number of OT hours (e.g. 4.5).' },
          { text: 'The Summary columns on the right update live — showing total P, A, H, WO, OT days + OT hours for each employee.' },
          { text: 'Click "Save All" when done. All attendance records are saved and salary monthly summary is updated automatically.', note: 'Days beyond the month (e.g. day 31 in June) are disabled and greyed out.' },
        ]
      },
    ],
    tips: [
      'Existing attendance records for the month pre-fill automatically when you open the grid — you can make changes and re-save without losing previous entries.',
      'The grid calculates Absent Days for salary: A = 1 day, H = 0.5 day, P/WO/OT = 0 absent days.',
      'After saving, you can still use Daily Attendance page for single-day corrections if needed.',
    ]
  },

  // ── VHL MODULE ────────────────────────────────────────────────────────────────
  {
    id: 'vhl',
    icon: <Egg size={20}/>,
    label: 'VHL Module',
    color: 'bg-amber-600',
    intro: 'The VHL sidebar section is for the Bodjanampet-2 job-work contract — VHL pays a fixed rate per egg, we handle manpower/medicine/feed under their regulations. VHL flocks, birds, feed, medicine, and egg production are tracked entirely separately from regular flock data — they never mix.',
    workflows: [
      {
        title: 'Set up a VHL contract flock',
        path: 'Flock Management → Flock List → click Flock No → Edit (or VHL → VHL Flocks → ✏ Edit)',
        steps: [
          { text: 'A VHL flock is just a normal flock with "VHL Contract" ticked — create/edit it the same way as any other flock.' },
          { text: 'Set Rearing Farm / Laying Farm to Bodjanampet-2 (or wherever the contract site is).' },
          { text: 'Tick the "VHL Contract" checkbox and save. It now disappears from regular Flock List/Dashboard/Compare/Medicine Entry/HE Dispatch pickers and appears under VHL → VHL Flocks instead.', note: 'It still appears in NHE Sales and Farm Expenses/Electricity/Salary screens, since broken eggs/feed bags/litter income and site running costs are genuinely ours.' },
          { text: 'Allocate sheds to the site in Masters → Sheds (same as any farm), then link flock-to-shed in Admin Centre → Flock–Shed Assignment if needed.' },
        ]
      },
      {
        title: 'Enter daily data — single shed',
        path: 'VHL → Daily Entry',
        steps: [
          { text: 'Select Flock and Date.' },
          { text: 'On the very first entry for a flock (no prior record, no prior day), type Received Female/Male — Opening auto-fills from it.' },
          { text: 'On later days, Opening auto-fills from the previous day\'s Closing.' },
          { text: 'Enter Mortality, Transfer/Cull, Feed, and Egg Collection (once in laying phase). Closing is auto-computed.' },
        ]
      },
      {
        title: 'Enter daily data — multiple sheds (Bulk / Shed-wise)',
        path: 'VHL → Bulk (Shed-wise) Daily Entry',
        steps: [
          { text: 'Select Flock and Date — every active shed for that flock\'s site shows as its own row.' },
          { text: 'This screen only has an Opening field per shed (no separate Received field) — Opening is simply "total birds present in that shed at the start of the day."', note: 'If more birds arrive into the same shed later the same day, don\'t enter two rows — just set Opening to the combined total (e.g. 1,490 + 3,000 = 4,490).' },
          { text: 'On the next day, that shed\'s Opening auto-fills from today\'s Closing, so you only need to adjust it again if another batch physically arrives.' },
          { text: 'Fill Feed, Mortality, Transfer/Cull, and Eggs per shed. Closing is auto-computed per shed as you type.' },
          { text: 'Click Save — only sheds with data (including a shed where you only entered Opening) are saved.' },
        ]
      },
      {
        title: 'Medicine Master & Usage Log',
        path: 'VHL → Medicine Master / Medicine Usage Log',
        steps: [
          { text: 'Medicine Master: add medicine names once — used as the dropdown source for Usage Log.' },
          { text: 'Medicine Usage Log: record which medicine, quantity, and cost was used per flock/date.', note: 'VHL medicine cost is tracked here only — it does not touch the regular Medicine Entry / Inventory stock.' },
        ]
      },
      {
        title: 'Egg Production & monthly billing',
        path: 'VHL → Egg Production',
        steps: [
          { text: 'Record HE/TE quantity supplied to VHL per date. The rate applied is looked up from the effective-dated VHL Egg Rate History (currently ₹4.30/egg from 10-Apr-2025).' },
          { text: 'At month end, select all rows for the month and use the consolidated billing action to apply one invoice number across them.' },
        ]
      },
      {
        title: 'VHL Dashboard & Shed-wise Performance',
        path: 'VHL → Dashboard / Shed-wise Performance',
        steps: [
          { text: 'Dashboard shows total birds (from the latest Daily Entry across all sheds), eggs and revenue this month, and a 14-day production chart. Click any flock card to jump straight to Daily Entry for that flock.' },
          { text: 'VHL Flocks list shows the flock\'s live Current F/M bird count (from the latest Daily Entry) next to its original Placement numbers, and an ✏ Edit button to change breed/status/placement date.' },
          { text: 'Shed-wise Performance breaks down eggs, feed, and mortality per shed over a chosen date range.' },
        ]
      },
    ],
    tips: [
      'VHL flocks are excluded from regular Flock Dashboard, Flock List, Compare Flocks, Medicine Entry, and HE Dispatch — look under the VHL sidebar section instead.',
      'Bulk (Shed-wise) Daily Entry has no "Received" field — Opening is the total birds in that shed right now. Combine multiple same-day receipts into one Opening number.',
      'If VHL Dashboard or VHL Flocks still shows old/placement-day numbers after entering Daily Entry data, check that you actually clicked Save on the shed row — Opening-only rows with no eggs/feed yet are now saved correctly (fixed in the July 2026 update).',
    ]
  },

  // ── REPORTS ───────────────────────────────────────────────────────────────────
  {
    id: 'reports',
    icon: <BarChart2 size={20}/>,
    label: 'Reports',
    color: 'bg-rose-600',
    intro: 'Reports pull data from all modules. No data entry here — only viewing and export.',
    workflows: [
      {
        title: 'Key reports and where to find them',
        path: 'Reports (left nav)',
        steps: [
          { text: 'Daily Summary — one-page view of all flocks for a selected date: production, HD%, feed, mortality.' },
          { text: 'Production Report — month-wise egg production per flock with trends.' },
          { text: 'P&L Report — revenue vs cost per flock.' },
          { text: 'Salary Report — monthly salary abstract by farm.' },
          { text: 'Feed Report — monthly feed consumption and cost per farm.' },
          { text: 'Egg Stock — current HE/NHE stock balance.' },
          { text: 'Flock Compare — side-by-side performance of two flocks (HD%, HE%, feed/bird).' },
          { text: 'Shed Performance — compare sheds within a flock.' },
          { text: 'Party Outstanding — amount owed to/by each party.' },
          { text: 'GST Reports — GSTR-1, GSTR-3B, RCM Register, and Purchase GST tab for monthly filing.' },
          { text: 'TDS Receivable — all HE dispatches where TDS is applicable, rate-wise summary (Total TDS, TDS on Paid, TDS on Pending). Filter by date range and TDS %. Export to Excel.' },
        ]
      },
      {
        title: 'GST Reports — monthly filing data',
        path: 'Reports → GST Reports',
        steps: [
          { text: 'Select Month and Year at the top. All tabs update for the selected period.' },
          { text: 'GSTR-1 tab: B2B invoices (registered buyers), B2C (unregistered buyers), exempt sales, HSN summary.' },
          { text: 'GSTR-3B tab: outward tax summary (3.1a), exempt sales (3.1c), RCM inward (3.1d), total payable (6.1).' },
          { text: 'RCM Register tab: all purchases where RCM applies — use this to know how much tax to pay directly.' },
          { text: 'Purchase GST tab: all GRN (feed) entries AND medicine purchases with tax breakdown — all purchase GST in one place. Note: no ITC — all input GST goes to indirect expenses.' },
          { text: 'Each tab has an Export to Excel button for sharing with your CA.' },
        ]
      },
    ],
    tips: [
      'Most reports have date range filters. Start with a broad range and narrow down.',
      'GST Reports → GSTR-1 and GSTR-3B tabs give you the exact figures needed for filing. Export and share with your CA.',
    ]
  },

  // ── TASKS ─────────────────────────────────────────────────────────────────────
  {
    id: 'tasks',
    icon: <ListTodo size={20}/>,
    label: 'Tasks',
    color: 'bg-orange-600',
    intro: 'One module covers three needs: admin to-dos, monthly compliance deadlines (GST/TDS/PF/ESI) that repeat automatically, and daily team task assignment. Tasks can be created from the Tasks tab itself, or directly from other pages (Pending Payments, Employee List) so follow-ups stay linked to the record they are about.',
    workflows: [
      {
        title: 'Create and assign a task',
        path: 'Tasks → New Task (or "Assign Task" on Pending Payments / Employee List)',
        steps: [
          { text: 'Enter a Title and optional Description, pick a Type — Daily/Team, Compliance, or Admin.' },
          { text: 'Assign to a specific app user (not the full employee list — only people who actually log into the app appear here), and/or a Team label and Site/Farm.' },
          { text: 'Set a Due Date and Priority.' },
          { text: 'For Compliance tasks, pick a Recurrence (e.g. "Monthly — 20th" for GSTR-3B, "Monthly — 7th" for TDS payment) — the next occurrence is created automatically the moment this one is marked Done.' },
          { text: 'When assigned from Pending Payments or Employee List, the task is automatically linked back to that bill/employee — an open-task count badge appears next to that record.' },
          { text: 'The person it is assigned to gets a live popup notification the instant it is assigned.' },
        ]
      },
      {
        title: 'Track your own daily work',
        path: 'Tasks (defaults to "My Tasks") / Dashboard "My Tasks" widget',
        steps: [
          { text: 'The Tasks tab opens on "My Tasks" by default — your own open items, sorted by due date. Switch to "All Tasks" to see everyone\'s (e.g. for a manager reviewing the team).' },
          { text: 'The Dashboard also shows a "My Tasks" widget the moment you log in, so you don\'t need to open the Tasks tab to see what\'s pending.' },
          { text: 'Mark a task In Progress, Done, or Cancelled with one click. Overdue items are flagged in red.' },
        ]
      },
    ],
    tips: [
      'Compliance tasks with a recurrence rule keep recreating themselves — you never need to manually re-add "GSTR-3B every month".',
      'Filter by Type / Status / Site / Assigned-to on the Tasks tab to find anything quickly.',
      'The same "Assign Task" + open-task badge pattern can be added to any other page on request (Flocks, GRN, etc.) — it is not limited to Pending Payments and Employee List.',
    ]
  },

  // ── DISCUSSIONS (CHAT) ──────────────────────────────────────────────────────────
  {
    id: 'discussions',
    icon: <MessageCircle size={20}/>,
    label: 'Discussions (Chat)',
    color: 'bg-green-700',
    intro: 'Simple in-app chat for direct messages and group discussions between app users — no need for a separate messaging app.',
    workflows: [
      {
        title: 'Start a conversation',
        path: 'Header chat icon, or Discussions (full page)',
        steps: [
          { text: 'Click the chat icon in the top header (or Discussions in the sidebar), then the + button.' },
          { text: 'Pick one person for a direct message, or a name + several people for a group.' },
          { text: 'Type a message and Send. Attachments (files/images) are supported via the paperclip icon.' },
        ]
      },
      {
        title: 'Getting notified of new messages',
        path: 'Anywhere in the app',
        steps: [
          { text: 'A new message shows a popup card with the sender\'s name and the message text, wherever you currently are in the app.' },
          { text: 'Reply directly from that popup without opening the chat panel, or tap the message to jump straight into that conversation.' },
          { text: 'The chat icon also shows a red dot when there are unread conversations.' },
        ]
      },
    ],
    tips: [
      'Chat is per-account, not per-device — messages are the same wherever you log in.',
      'Use a group chat (not repeated DMs) when more than one person needs to see the same conversation.',
    ]
  },

  // ── ADMIN CENTRE ──────────────────────────────────────────────────────────────
  {
    id: 'admin-centre',
    icon: <Shield size={20}/>,
    label: 'Admin Centre',
    color: 'bg-slate-700',
    intro: 'Admin-only setup and configuration hub — company profile, master data shortcuts, allocations, user management, and the Audit Log. Visible only to the admin role.',
    workflows: [
      {
        title: 'Setup Overview & configuration tabs',
        path: 'Admin Centre → Setup Overview',
        steps: [
          { text: 'Company Profile — company name, address, GSTIN, bank details used on invoice prints.' },
          { text: 'Masters — quick links to Farms/Sites, Feed Types, and other master data.' },
          { text: 'Flock–Shed Assignment, Electricity Allocation, Salary Allocation — set up which sheds/meters/costs belong to which flock or farm.' },
        ]
      },
      {
        title: 'User Management',
        path: 'Admin Centre → User Management',
        steps: [
          { text: 'Create app logins for staff, assign a role (admin / management / accounts / site_manager / site_incharge / viewer), and a home Farm/Site for site-level roles.' },
          { text: 'Deactivate a user instead of deleting them if they leave, so historical records (who created what) stay meaningful.' },
        ]
      },
      {
        title: 'Audit Log — every data change, by whom',
        path: 'Admin Centre → 🔍 Audit Log',
        steps: [
          { text: 'Every create/update/delete across the app\'s real data tables (sales, payroll, purchases, tasks, chat, bank ledger, etc.) is recorded here automatically — table, record, action, user, and timestamp.' },
          { text: 'Filter by table, action, user, or date range to investigate a specific change.' },
        ]
      },
    ],
    tips: [
      'Only the admin role can see Admin Centre — other roles will not see it in the sidebar.',
      'If someone reports "data changed unexpectedly", the Audit Log is the first place to check.',
    ]
  },
]

// ── sub-components ─────────────────────────────────────────────────────────────

const StepItem: React.FC<{ step: Step; num: number }> = ({ step, num }) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center font-bold mt-0.5">
      {num}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-800 leading-relaxed">{step.text}</p>
      {step.note && (
        <div className="mt-1.5 flex gap-1.5 items-start">
          <Info size={13} className="text-blue-500 mt-0.5 flex-shrink-0"/>
          <p className="text-xs text-blue-700">{step.note}</p>
        </div>
      )}
      {step.warning && (
        <div className="mt-1.5 flex gap-1.5 items-start">
          <AlertCircle size={13} className="text-amber-500 mt-0.5 flex-shrink-0"/>
          <p className="text-xs text-amber-700">{step.warning}</p>
        </div>
      )}
    </div>
  </div>
)

const WorkflowCard: React.FC<{ wf: Workflow; accent: string }> = ({ wf, accent }) => {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <CheckCircle size={15} className="text-green-500 flex-shrink-0"/>
          <span className="font-semibold text-sm text-gray-800">{wf.title}</span>
        </div>
        {open ? <ChevronDown size={15} className="text-gray-400"/> : <ChevronRight size={15} className="text-gray-400"/>}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-4">
          <div className="flex items-start gap-1.5 flex-wrap">
            <MapPin size={13} className="text-gray-400 mt-0.5 flex-shrink-0"/>
            <div className="flex items-center gap-1 flex-wrap">
              {wf.path.split(' → ').map((seg, i, arr) => (
                <React.Fragment key={i}>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${i === 0 ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    {seg}
                  </span>
                  {i < arr.length - 1 && <ArrowRight size={11} className="text-gray-400 flex-shrink-0"/>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {wf.steps.map((s, i) => <StepItem key={i} step={s} num={i + 1}/>)}
          </div>
        </div>
      )}
    </div>
  )
}

export const HelpGuidePage: React.FC = () => {
  const [active, setActive] = useState('flock-setup')
  const [searchQ, setSearchQ] = useState('')
  const section = SECTIONS.find(s => s.id === active)!

  // Search across sections, workflows and steps
  const searchResults = useMemo(() => {
    const q = searchQ.trim().toLowerCase()
    if (!q) return []
    const hits: { sectionId: string; sectionLabel: string; workflowTitle: string; stepText: string }[] = []
    for (const sec of SECTIONS) {
      const secMatch = sec.label.toLowerCase().includes(q) || sec.intro.toLowerCase().includes(q)
      for (const wf of sec.workflows) {
        const wfMatch = wf.title.toLowerCase().includes(q) || wf.path.toLowerCase().includes(q)
        const matchingSteps = wf.steps.filter(st => st.text.toLowerCase().includes(q) || (st.note ?? '').toLowerCase().includes(q))
        if (secMatch || wfMatch || matchingSteps.length > 0) {
          hits.push({ sectionId: sec.id, sectionLabel: sec.label, workflowTitle: wf.title, stepText: matchingSteps[0]?.text ?? wf.path })
        }
      }
    }
    return hits.slice(0, 10)
  }, [searchQ])

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-gray-700"/>
            <span className="font-bold text-gray-800">App Guide</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Updated: {LAST_UPDATED}</p>
          {/* Search box */}
          <div className="mt-3 flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1.5">
            <Search size={13} className="text-gray-400 shrink-0"/>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search guide..."
              className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none w-full"
            />
            {searchQ && <button onClick={() => setSearchQ('')}><X size={11} className="text-gray-400 hover:text-gray-600"/></button>}
          </div>
        </div>

        {/* Search results */}
        {searchQ && (
          <div className="border-b border-gray-100 bg-blue-50">
            {searchResults.length === 0
              ? <p className="px-4 py-3 text-xs text-gray-400">No results for "{searchQ}"</p>
              : searchResults.map((r, i) => (
                <button key={i} onClick={() => { setActive(r.sectionId); setSearchQ('') }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-100 border-b border-blue-100 last:border-0">
                  <p className="text-xs font-semibold text-blue-800">{r.sectionLabel}</p>
                  <p className="text-xs text-blue-600 truncate">{r.workflowTitle}</p>
                </button>
              ))
            }
          </div>
        )}

        <nav className="py-2">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors
                ${active === s.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <span className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0
                ${active === s.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                <span className={active === s.id ? 'text-white' : 'text-gray-500'}>{s.icon}</span>
              </span>
              <span className="text-sm font-medium truncate">{s.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 mt-2">
          <p className="text-[10px] uppercase font-semibold text-gray-400 mb-2">Quick index</p>
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-1"><Hash size={10}/>Chick intake → Flock Setup</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Daily entry → Daily Entry</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Egg fields missing → Daily Entry</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Bird sold → NHE & Bird Sales</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Transfer flock → Flock Transfer</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Hatch batch / setting → Hatch Batches</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Egg age / flock age → Hatch Batches</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Print invoice PDF → HE Dispatch</div>
            <div className="flex items-center gap-1"><Hash size={10}/>TDS on HE sales → HE Dispatch / TDS Receivable</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Generate invoice no → Invoice Series</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Sales invoices → Accounts & Invoices</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Supplier invoice → Accounts & Invoices</div>
            <div className="flex items-center gap-1"><Hash size={10}/>GSTR-1 / GSTR-3B → GST</div>
            <div className="flex items-center gap-1"><Hash size={10}/>RCM → GST</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Add breed/unit/category → Masters</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Pay salary → Employees</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Monthly attendance grid → Monthly Attendance Grid</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Buyer advance → Buyer Advances</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Party balance/statement → Party Ledger</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Electricity bill → Electricity</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Raise PO → Purchase & Payments</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Import Excel → Import Data</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className={`${section.color} w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
              {section.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{section.label}</h1>
              <p className="text-gray-500 mt-1 leading-relaxed">{section.intro}</p>
            </div>
          </div>

          {section.tips && section.tips.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-2">Key Points to Remember</p>
              <ul className="space-y-1.5">
                {section.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Step-by-Step Workflows</h2>
            {section.workflows.map((wf, i) => (
              <WorkflowCard key={i} wf={wf} accent={section.color}/>
            ))}
          </div>

          {active === 'changelog' && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Changes</h2>
              <div className="space-y-2">
                {CHANGELOG.map((c, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 bg-white border border-gray-100 rounded-xl">
                    <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-bold flex-shrink-0
                      ${c.tag === 'New' ? 'bg-green-100 text-green-700' : c.tag === 'Fix' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {c.tag}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{c.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={10}/>{c.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 flex items-start gap-2">
            <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0"/>
            <p className="text-xs text-gray-400">
              This guide is part of the app and is updated whenever workflows change.
              If something doesn't match what you see, refresh this page.
              Last updated: <strong>{LAST_UPDATED}</strong>.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
