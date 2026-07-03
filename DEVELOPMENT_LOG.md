# Development Log — Issues Found & Fixed

Living reference of real bugs found in this app, their root cause, and the
fix — so the same mistake isn't repeated in future development. Add a new
entry every time a real bug is found and fixed (not every small change —
just things that were genuinely broken and worth remembering why).

---

## 2026-07-03 — GRN → Pending Payments silently stopped syncing

**Symptom:** New GRN entries (and GRN date edits) stopped creating/updating
rows in Pending Payments, with no visible error.

**Root cause:** `fn_grn_to_payment()` (the trigger that syncs GRN → Pending
Payments) referenced `grn.po_id`, then later `grn.po_no` — **neither column
has ever existed** on the `grn` table (confirmed via `information_schema`).
Every GRN insert/update hit a real Postgres error, silently swallowed by
the trigger's own `EXCEPTION WHEN OTHERS THEN RETURN`.

**Fix:** Removed the PO-credit-days lookup entirely, reverted to the
simpler party-credit-days logic that worked before. Migrations 281, 290.

**Lesson:** When a trigger references a column, verify it exists via
`information_schema.columns` BEFORE assuming — don't infer column names
from a similar table's schema or from memory. Also: a trigger's
`EXCEPTION WHEN OTHERS THEN RETURN NEW` with no logging turns every future
bug in that function into a silent, invisible failure — always
`RAISE WARNING` at minimum (migration 271 added this, but by then the
underlying bug had already been shipped once).

---

## 2026-07-03 — Party merge left orphaned duplicate bills

**Symptom:** After merging two duplicate supplier records in Parties
Master, Pending Payments still showed the vendor twice, and manually
editing the stale row threw "duplicate key value violates unique
constraint pending_payments_unique".

**Root cause:** `pending_payments.vendor_name` is a **denormalized text
column**, not FK-driven. The merge tool updated `grn.party_id` (which
re-triggers `fn_grn_to_payment`, which re-upserts under the NEW vendor
name) but never touched existing `pending_payments` rows still holding the
OLD vendor name — leaving them as orphaned duplicates.

**Fix:** `MastersPages.tsx` merge mutation now explicitly reconciles
`pending_payments.vendor_name`/`party_id` for the merged-away party's rows
(rename in place, or merge-and-carry-Paid-status if a colliding row
already exists under the new name). Also found and fixed 3 pre-existing
merge leftovers this way (Sunways Bio Science LLP, Sachin International
Proteins — the second one was ALSO a merge leftover, not a "live duplicate"
as first assumed — always verify whether the "other" party record still
exists before classifying an issue).

**Lesson:** Any table with a denormalized copy of a name/identity (instead
of a pure FK) needs an explicit reconciliation step in every place that
can change that identity (merge, rename, delete). Don't assume a party
merge is "just a party table operation" — grep for every other table that
stores that party's name as plain text.

---

## 2026-07-03 — New stock_ledger consumption type not recognized by Inventory

**Symptom:** Added HE Dispatch box/tray consumption (`dispatch_out` as a
new `stock_ledger.txn_type`) — the Inventory page showed "Used = 0" and
the quantities were wrongly added to "Received" instead.

**Root cause:** `InventoryPages.tsx` has an `OUT_TYPES` Set (and a second,
separate `TXN_IS_OUT` Set for the Stock Ledger tab) hardcoding which
`txn_type` values count as consumption. A brand-new txn_type falls through
to the `else` branch and gets treated as a receipt.

**Lesson:** **Whenever a new `stock_ledger.txn_type` is introduced,
grep the whole frontend for existing `OUT_TYPES`/similar hardcoded sets**
(`InventoryPages.tsx`, `StockPage.tsx` if it ever expands beyond
Feed/Medicine) and add it everywhere, not just where it was first used.

---

## 2026-07-03 — Also created duplicate item-master entries by not checking first

**Symptom:** Built packaging stock tracking (4 new items: boxes/trays) —
turned out 3 of them already existed under different names ("20 LB
Corrugated Boxes" etc.), creating duplicate stock items for the same
physical thing.

**Lesson:** **Before creating a new item/master record of any kind, always
query the existing master table for near-matches first** (by category, by
partial name) — don't assume a feature is new just because the *tracking
logic* for it is new. The underlying data may already exist.

---

## 2026-07-03 — Flock-level business exceptions should key off farm/site, not flock number

**Symptom:** User said "Flock 20 is VHL, exclude it from packaging
consumption" — turned out to be Flock 21, and even then the exclusion
needed to be based on the flock's **laying farm** (`laying_farm_id` =
"Bodjanampet - 2 (VHL)"), not a hardcoded flock number.

**Fix:** `fn_dispatch_to_stock_ledger()` checks
`flocks.laying_farm_id = '<VHL farm id>'` — this automatically covers any
current or future flock placed at that site, not just one flock number
that can be misremembered or change over time.

**Lesson:** When a user describes a business rule "for flock X", ask
what actually identifies the exception (site? vendor? hatchery type?) —
flock numbers get misremembered/reused; the real identifying attribute is
usually a farm/site/party reference that already exists in the schema.

---

## 2026-07-03 — medicine_usage rows with NULL item_id (data quality, not a code bug)

**Symptom:** Famitone showed "Used = 0" in Inventory despite a real 5 Ltr
usage entry for Flock 22.

**Root cause:** That specific batch of `medicine_usage` rows (all dated
06/05/2026) has `item_id = NULL` — never linked to the items master, so
the stock_ledger consumption entry landed under a blank item name instead
of "Famitone". Confirmed via a reconciliation query
(`medicine_usage` totals vs `stock_ledger` `medicine_out` totals per
item) that this is NOT a systemic trigger bug — 0 mismatches found
app-wide for every OTHER medicine item.

**Lesson:** When one product looks broken, **run a reconciliation across
the whole category first** (source table total vs stock_ledger total per
item) before assuming it's a systemic bug — it might be one bad data
entry, and fixing "the code" wouldn't have found or fixed it.
*(Fix for these specific orphaned rows not yet applied — pending.)*

---

## 2026-07-03 — Outgoing payment flows never recorded which bank account paid

**Symptom:** Bank Ledger (per bank account) never reflected vendor
payments, salary payments, or purchase payments — only Cash Book showed
them.

**Root cause:** Pending Payments' Pay/Edit-to-Paid flows only asked for
Payment Mode (NEFT/Cash/UPI/etc.) as a label — never asked WHICH bank
account, and only ever posted to `cash_book`, never to
`bank_transactions`. Same gap found in Purchase Entry and Salary Payment
(systemic, not isolated) — meanwhile the money-RECEIVED side (Flock Sales
receipts, Buyer Advances) already did this correctly, proving the correct
pattern already existed in the app.

**Fix (Pending Payments only so far):** Added a "Paid From Bank Account"
selector, shown whenever mode ≠ Cash; posts an additional `bank_transactions`
Debit row (linked via `linked_payment_id`) alongside the existing Cash Book
entry — Cash Book behavior is unchanged (still gets everything, as
before), so no existing report double-counts or regresses.
`pending_payments.bank_account_id` already existed as a column — this was
a pure frontend fix, no migration needed.

**Still open:** Purchase Entry and Salary Payment need the identical fix.
There is also no proper receivables reconciliation ledger — Party
Outstanding is a read-only aging report with no "Receive Payment" action
tying a receipt to a bank account.

**Lesson:** When building a "record payment" flow, always check whether
the equivalent RECEIVE-money flow already solved the same problem
correctly — copy that pattern instead of re-inventing it, and check it
consistently across every place money can be marked as paid (there are
usually 3-4: vendor bills, purchases, salaries, and any ad-hoc "mark
paid" button).

---

## 2026-07-03 — Extended the bank-account fix to Purchase Entry, Salary, and Receivables

Following on from the Pending Payments bank-account fix above, applied the
same pattern in two more places (with explicit user sign-off first, since
these touch live money-movement code):

- **Purchase Entry**: same "Paid From Bank Account" selector added. Also
  fixed a second, worse bug found while doing this — a NEW purchase marked
  "Paid" with Account Type "Online" at creation time posted to **no ledger
  at all** (the old code only mirrored to Cash Book when Account Type was
  literally "Cash"). Now Cash Book always gets the entry, and Bank Ledger
  gets it too when non-cash.
- **Salary Payment**: salary previously posted to **no ledger whatsoever**
  — confirmed by grepping the whole EmployeePages.tsx file for
  `cash_book`/`bank_transactions` (zero matches). Salary relied purely on
  an `is_paid` flag, with bulk bank transfers going out via a separate CMS
  batch-file export. User confirmed they DO want salary posting to Cash
  Book/Bank Ledger like the others. Found TWO independent places that can
  flip `is_paid` (the main Salary Entry form, AND the ESI/PF Report's
  inline edit modal) — both needed the fix, or one would silently bypass
  the other's ledger logic.
- **Party Outstanding (receivables)**: turned out the "gap" wasn't missing
  infrastructure at all — `he_dispatch`/`nhe_sales` already had
  `amount_received`/`payment_status`/`bank_account_id` columns (migration
  076) and a fully-working `ReceivePaymentModal` already existed in
  `FlockSalesPages.tsx`. The Debtors report just never used any of it —
  it summed the full `amount` forever, ignoring receipts already recorded
  elsewhere. Fixed by (a) subtracting `amount_received` from the balance
  shown, and (b) exporting and reusing the *exact same* modal component
  instead of writing new receipt-posting logic from scratch.

**Lesson (reinforced):** before building a new feature to close a
"gap", grep hard for existing infrastructure first — twice in one session
(packaging items, and now receivables) the real fix was "wire up what
already exists" rather than "build something new." Assuming a gap is
empty because a REPORT doesn't show something is not the same as
confirming the underlying data/logic doesn't exist.

---

## 2026-07-03 — DateInput onChange misuse crashed the whole page

**Symptom:** User hit a full-page crash: `"a.split is not a function or
its return value is not iterable"`, right after using the new Feed Mill
Consumption date-range pickers.

**Root cause:** Wrote `<DateInput value={fromDate} onChange={setFromDate} />`
instead of `onChange={e => setFromDate(e.target.value)}`. `DateInput`'s
`onChange` fires with a synthetic `{ target: { value } }` object (matching
native `<input>` event shape), NOT the raw string — so `setFromDate`
received the whole event object. On the next render, `DateInput` tried to
call `isoToDisplay(fromDate)`, which does `iso.split('-')` — and `iso` was
now an object, not a string, producing exactly that V8 error message
(that specific "...or its return value is not iterable" phrasing is V8's
generic wording for a failed destructuring assignment on a method-call
result, e.g. `const [y,m,d] = iso.split('-')`).

**Fix:** corrected both call sites (`InventoryPages.tsx` Consumption
Report, `FeedMillPages.tsx` Feed Consumption tab). Also hardened
`isoToDisplay()` itself in `components/ui/index.tsx` to check
`typeof iso !== 'string'` and fail quietly, so the same mistake anywhere
else in the app degrades to a blank date field instead of crashing the
whole page.

**Lesson:** `DateInput`'s `onChange` is NOT a plain `(value: string) => void`
setter — it always needs `e => setX(e.target.value)`, same as any native
input. Grepped the whole codebase afterward for
`DateInput value={x} onChange={setX}` (the exact broken pattern) to
confirm no other instances existed. When adding any new date-range filter,
copy an existing working `DateInput` call site instead of assuming the
prop shape.

---

## Recurring operational notes (apply to every migration going forward)

- `run_sql.py` prints results **only for the first 5 statements in the
  file that begin with `SELECT`** — a `WITH ... SELECT` doesn't reliably
  print; a `SELECT` past position 5 never prints regardless of row count.
  For diagnostics needing more than ~4 result sets, paginate across
  multiple small migration files instead of one big one.
- `run_sql.py` treats any error containing "does not exist", "already
  exists", "already defined", or "duplicate" as **silent success** — a
  genuine typo'd column name in a throwaway diagnostic query can look
  like "0 rows" instead of an error. If a result looks suspiciously
  empty, re-run the same query with an intentionally-correct simpler
  form to rule out a swallowed error.
- Never assume a column exists because a similar/related table has it —
  check `information_schema.columns` directly.
