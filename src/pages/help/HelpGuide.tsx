import React, { useState, useMemo } from 'react'
import {
  BookOpen, Bird, Calendar, ArrowRightLeft, ShoppingCart, Users, Zap,
  Package, FileSpreadsheet, BarChart2, Settings, ChevronRight, ChevronDown,
  AlertCircle, CheckCircle, Info, ArrowRight, Hash, MapPin, CreditCard,
  Sparkles, Clock, Receipt, FileText, Egg, Search, X, ListTodo, MessageCircle, Shield
} from 'lucide-react'

const LAST_UPDATED = '2026-09-03'

interface ChangeEntry { date: string; tag: 'New' | 'Fix' | 'Improved'; text: string }
const CHANGELOG: ChangeEntry[] = [
  { date: '2026-09-03', tag: 'Fix', text: 'DEVELOPMENT TASKS: THE NIGHTLY HEALTH CHECK NO LONGER RAISES A NEW TASK EVERY NIGHT. Ten of the 44 open tasks were the same entry repeated — "Health check found 1 critical problem(s)" dated 25/08 through 03/09 — because the job only checked whether it had already raised one TODAY. They are collapsed into a single standing task, closed as duplicates rather than as fixed: the underlying rule is still failing (7 days where the bird count does not add up, the small Flock 20 import drifts confirmed earlier against the Excel). A new one can no longer be raised while an open one is sitting there. Four tasks that shipped today were also ticked off — line-wise daily entry, shed supervisors limited to their own sheds, the A/B/C/D box counts, and the imprest accounts — and "225 old bird sales carry no shed" was recounted to 233, which is what the check reports now. The Health Check page currently shows 22 rules run, 14 passing and 8 failing; that is the live figure to work from, not the task list.' },
  { date: '2026-09-03', tag: 'Improved', text: 'IMPREST LEDGER NOW LISTS CASH ONLY. The cash book also holds cheque, NEFT, RTGS and UPI entries, and the ledger was listing every one of them — HO Imprest showed 722 rows of which only 30 were actually cash, so 30 real cash entries were buried under about Rs 10 crore of bank payments (434 salary and 258 purchase payments, nearly all by bank). Those rows never counted toward the balance, so showing them served no purpose and only made the account unreadable. The ledger now lists cash entries only, matching what the balance has always counted; bank payments remain where they belong, in the Bank Ledger. NOTE ON SITE IMPRESTS: they hold EXPENSES as well as sales — 219 of the 340 site entries are expenses — which is correct, an imprest being all the cash a site takes in and pays out. That is why a rearing site such as Kethireddypally reads negative before its opening balance is set: Rs 1,918 of sales in against Rs 2,42,099 of expenses out.' },
  { date: '2026-09-03', tag: 'Fix', text: 'IMPREST LEDGER SHOWED NO VOUCHERS AT ALL — FIXED. Every imprest account came up empty whatever dates were chosen, while the balance cards above showed correct figures, which made it look as though the vouchers had gone. They had not: the list was asking the database for two things that cannot work against a view — a linked farm name, which needs a foreign key a view does not have, and sorting by a column the view never carried. Either one on its own fails the entire request and returns nothing. The view now carries the site name and the created time itself, so the list loads as a plain result with nothing to link. THE DATE BOXES ARE ALSO BLANK BY DEFAULT NOW: choosing an imprest shows EVERY voucher it holds, and you fill a From or To date only when you want to narrow it. A date default was hiding older entries and making a populated account look empty. Balances were never affected — they read a different view and were always right.' },
  { date: '2026-09-03', tag: 'Fix', text: 'IMPREST LEDGER: DATES NOW OPEN ON THE FINANCIAL YEAR, AND THE EMPTY MESSAGE WAS WRONG. The From and To boxes were defaulting to the last three months, so an account whose entries were older looked completely empty — Kethireddypally has 37 entries but showed none. They now open on 1 April of the current financial year, and both boxes remain editable for any range. The message shown when a period is empty was also out of date: it still said entries must be TAGGED to an imprest and that old ones were left untagged on purpose, which stopped being true when balances began deriving from where the cash was received. It now says plainly that nothing fell in those dates and to widen the From date, and explains that the Imprest Account box on the Cash Book form is only needed when cash is NOT at a site — Head Office cash actually held by Mandal or by a person.' },
  { date: '2026-09-03', tag: 'Fix', text: 'A SALE RECOVERED THROUGH SALARY NOW SHOWS AS RECEIVED, NOT PENDING. Marking a salary Paid correctly recorded the deduction against the employee, but NOTHING ever updated the sale itself — so a sale whose money had already come out of wages carried on reading Pending for ever, and the DUE figure on the NHE Sales page was counting money that was already recovered. 368 sales carried a salary deduction while 380 still read Pending, which is how close the two sets were. From now on, marking a salary Paid settles the linked sales, and un-marking it or deleting the salary puts them straight back to owed — a sale must never read as received on money that was not recovered. A sale part-settled in cash and part by deduction is marked Partial, not flattened into fully paid. The existing history has been corrected the same way, and only for deductions ACTUALLY taken: where the deduction is still pending the salary has not been paid, so that sale is genuinely still owed and was left alone.' },
  { date: '2026-09-03', tag: 'New', text: 'NHE SALES LIST NOW SHOWS THE SITE. A Site column sits beside Flock, showing the sale\'s own site rather than making you infer it from the flock. Existing sales were filled in from the flock\'s laying farm, which is right for most of them but NOT for sales such as sex-error birds sold from somewhere else — so it is shown on the list precisely so it can be checked and corrected rather than trusted blindly. Anything without a site shows "not set" in amber.' },
  { date: '2026-09-03', tag: 'Fix', text: 'HE DISPATCH, MEDICINE ENTRY AND MEDICINE ALLOCATIONS NOW LOAD EVERYTHING, WITH PAGING. Same fix as NHE Sales: all three were capped at the latest 200 records whenever no filter was applied, and — the part that mattered — their TOTALS covered only those 200, so an unfiltered view understated the real position. The cap is gone on all three; every record loads and every total covers all of them. Each list now has its own "Show 25 / 50 / 75 / 100 per page" control with Prev/Next underneath, so the screens stay short without hiding anything from the figures. The amber "showing only the latest 200" banners are gone because they are no longer true.' },
  { date: '2026-09-03', tag: 'Fix', text: 'NHE SALES NOW LOADS EVERY SALE, WITH PAGING. The list was capped at the latest 200 sales whenever no filter was applied — and, more seriously, the TOTALS at the top described only those 200 as though they were everything. There are 540 sales, so the unfiltered figures were understating the position. The cap is gone: every sale is loaded and every total covers all of them. Page length is handled by paging the TABLE instead, with a "Show 25 / 50 / 75 / 100 per page" control and Prev/Next under the list, so the screen stays short without anything being hidden from the figures. The page resets to 1 whenever a filter changes, so you are never stranded on a page number that no longer has rows. NOTE: HE Dispatch, Medicine Entry and Medicine Allocations still use the same 200 cap and still show their warning banner — those were left alone rather than changed without being asked.' },
  { date: '2026-09-03', tag: 'Improved', text: 'BIRD / CULL SALES REPORT NOW SHOWS AND SETS THE IMPREST. A new IMPREST column sits beside "Cash At": it shows which cash box holds that money, or a greyed suggestion of where it would go, or "no imprest" if that site has none. A "Tag N to site imprest" button then assigns every untagged cash receipt in the current view to its own site\'s imprest — taken from where the cash was actually RECEIVED, not from the flock\'s site, because those can differ and the receipt is the truthful one. The Imprest is also in the CSV export. Only the cash part of a sale is tagged; an online payment goes to the bank and never touches a cash tin. A SEPARATE SCREEN FOR THIS WAS BUILT AND HAS BEEN REMOVED — it duplicated this report, which already showed the date, party, DC number, cash, cash location, online amount and bank account. One report, with a button, rather than two places showing the same sales.' },
  { date: '2026-09-03', tag: 'New', text: 'ACCOUNTS → SALE RECEIPTS → IMPREST. Every cash receipt that came from an NHE sale, listed with date, site, flock, sale type, DC number, party, sale amount, cash received and — importantly — the ONLINE part paid straight to the bank, so a split payment is visible instead of looking like a shortfall. A sale can settle more than one way at the same time: part cash to the cash book, part online to the bank ledger, or deducted from an employee\'s salary. ONLY THE CASH PART can belong to an imprest, because an imprest is the physical cash a person is carrying and an online receipt never touches it. Export to Excel gives the whole list for checking outside the app. The "Tag to site imprest" button assigns each untagged receipt to its OWN SITE\'S imprest, taken from the sale\'s site — a derivation, not a guess — and rows whose site has no imprest are listed and say so rather than being tagged to something convenient. Use the date range to decide how far back to go: 138 receipts totalling Rs 47,20,559 are currently untagged, running from July 2025 to August 2026, and 61 of them fall in June 2026 alone.' },
  { date: '2026-09-03', tag: 'Fix', text: 'EMPLOYEES → ADVANCES: "ALL MONTHS" ADDED TO THE MONTH FILTER. The Month box only ever offered one specific month, so the list always demanded an exact match on the deduct-from month. That did more than make browsing awkward: any advance whose salary month was never set was invisible in EVERY view, not merely filed under the wrong one — there was no way to see it at all. Choosing "All months" now shows every advance regardless, including those, and the export follows the same filter and names the file All-Months. The "Deduct from Month" box on the advance form itself is unchanged and still requires one specific month, because an advance has to be deducted from a particular month.' },
  { date: '2026-09-03', tag: 'Fix', text: 'EMPLOYEE CASH ADVANCES NOW COME OUT OF A NAMED IMPREST. Employees → Advances already posted a cash advance into the Cash Book and kept the link, so deleting the advance removed the cash entry too — that half was never broken. What it never recorded was WHICH IMPREST the cash came out of, so handing an employee Rs 5,000 from Mandal Imprest reduced the Cash Book but left Mandal reading Rs 5,000 too high, with nothing on screen to say why. The advance form now has a "Paid from (Imprest)" box, REQUIRED on a cash advance so none can slip through untagged, and the advance then shows on that holder\'s Imprest Ledger as a payment with their balance falling correctly. Bank advances are unaffected — they go to the Bank Ledger and never touch an imprest. To be clear on the model: an employee taking a salary advance is a PAYEE, not a holder — the cash leaves the imprest and comes back through the salary deduction — which is different from Naraendra and Srinath, who hold imprest accounts of their own. Existing advances are NOT backfilled: they never recorded which tin the cash came from, and guessing would move real balances on accounts carrying people\'s names.' },
  { date: '2026-09-03', tag: 'New', text: 'IMPREST LEDGER → TRANSFER. A transfer can now be started from the holder\'s own page instead of going to the Cash Book. The FROM side is always the account you are looking at — a transfer opened from Srinath\'s page is money leaving Srinath — and you choose only the destination: another imprest, a BANK ACCOUNT (a cash deposit), or a site. The Cash Book\'s Transfer button is unchanged and still lets you pick both sides. Both screens now run the SAME transfer code rather than each having its own copy, because this is a paired write across two tables and two copies would eventually disagree about how a leg is shaped — which is the kind of drift that leaves a book unbalanced. Remember the difference: ADD VOUCHER is a one-sided entry (a receipt or a payment on this account), TRANSFER touches two accounts and writes both halves together.' },
  { date: '2026-09-03', tag: 'New', text: 'CASH BOOK → TRANSFER NOW WORKS BETWEEN IMPRESTS AND THE BANK. The Transfer button only ever moved cash between a site and Head Office. From and To can each now be an IMPREST ACCOUNT, a BANK ACCOUNT, or a site — so HO Imprest to Mandal, Mandal to a person, and above all IMPREST TO BANK (a cash deposit) and BANK TO IMPREST (cash drawn) are one action each. Those last two were previously impossible: cash and bank are separate books with nothing crossing between them, so a deposit could not be recorded at all. Both legs are written together and share one transfer id — the imprest and site legs in the cash book, the bank leg in the bank ledger — so a transfer can no longer be half-deleted and silently unbalance a book, which the old two-loose-rows approach allowed. The old site-to-site options are still there, so nothing that worked before stopped working.' },
  { date: '2026-09-03', tag: 'Improved', text: 'IMPREST BALANCES COUNT CASH ONLY. An imprest is the physical cash a person is carrying; a cheque or UPI payment moves through the bank and never touches the tin. Balances previously counted every entry tagged to an account regardless of how it was paid, so a UPI payment would have reduced the cash someone was holding when it never did. Only cash entries now move an imprest balance. Cheque and UPI entries tagged to an account are still LISTED on the Imprest Ledger — greyed, marked "not cash", with a note at the top saying how many are excluded — rather than being dropped silently, so nobody is left wondering where an entry went.' },
  { date: '2026-09-03', tag: 'New', text: 'IMPREST LEDGER — ADD VOUCHER. A voucher can now be entered straight from the Imprest Ledger instead of going to the Cash Book and remembering to pick the imprest, which is exactly how an entry ends up untagged and a holder\'s balance ends up wrong. The Add Voucher button opens a form already set to the account you are looking at, and the entry goes into the CASH BOOK like any other — there is no second book and nothing entered here is hidden from the Cash Book, which stays the single place every transaction is visible. The form has ONE amount box, with the Type (Receipt / Payment / Contra) deciding which side it lands on: two separate boxes is how the 05/05 office tea row ended up marked as a Receipt while carrying a payment amount. Site is asked separately from the imprest, because they answer different questions — Site is which site bears the cost, the Imprest is whose cash it moved through. Categories and payment modes come from the same list the Cash Book uses, so the two screens can never disagree. The balance cards and the running balance update the moment a voucher is saved.' },
  { date: '2026-09-03', tag: 'New', text: 'ACCOUNTS → IMPREST LEDGER, AND AN IMPREST BOX ON THE CASH BOOK FORM. Each imprest account can now be read as its own cash book: pick the account (or click its balance card at the top) and a date range, and every entry it holds is listed in date order with RECEIVED, PAID and a RUNNING BALANCE, opening at the correct figure for the period and closing at what the holder is carrying today. It answers the question the cash book could never answer — what has this person been given, what have they spent, what are they holding — with an Export to Excel. To make an entry belong to an account, the Cash Book form now has an IMPREST ACCOUNT (CASH BOX) box beside Farm. These are two different facts and both are now recorded: the Farm is which SITE bears the cost, the Imprest is WHOSE CASH it moved through. Cash received at Agraharam into Mandal Imprest is finally one ordinary entry. Existing cash book entries stay untagged on purpose — they record the site but never the cash box, so tagging them would have invented balances on accounts carrying real people\'s names; tag new entries as you enter them, and set each account\'s opening balance under Masters → Cash Imprest Accounts. Nothing about the Cash Book itself changed: it is still the single place every transaction is visible.' },
  { date: '2026-09-03', tag: 'New', text: 'MASTERS → CASH IMPREST ACCOUNTS. Who is physically holding company cash now has a place of its own: HO Imprest, Mandal Imprest, Dendi Naraendra Reddy Imprest and Dendi Srinath Reddy Imprest, each with a balance card and a table showing opening balance, received, paid, balance and entry count, plus a total cash-held figure. WHY THIS WAS NEEDED: the cash book had no idea what a cash holder was. Its Location column is really the SITE that bears the cost, and it was being asked to mean the cash box as well — so money received AT Agraharam INTO Mandal Imprest could not be recorded, no holder could show a balance, and transfers only worked site-to-site. Each cash book entry can now say which imprest the money moved through AND which site bears the cost, as two separate facts. IMPORTANT: every balance currently shows only its opening figure, because none of the 1,260 existing cash book rows has been assigned to an imprest. Those rows never recorded which cash box the money was in, so assigning them would have put invented balances on accounts carrying real people\'s names. Set an opening balance and opening date on each account — that date is the cutover, and entries from it build the balance on top of the opening figure. Still to come: the imprest picker on the cash book entry form, and transfers changed from site-to-site to account-to-account.' },
  { date: '2026-09-03', tag: 'Fix', text: 'CASH BOOK — A MANUAL VOUCHER COULD NOT BE SAVED AT ALL. The Type dropdown was offering only "Credit (In)" and "Debit (Out)", while the cash book accepts only Receipt, Payment and Contra — so BOTH choices were rejected on save with a constraint error, whichever you picked. That dropdown is not a fixed list in the code; it is read from a configurable options table, and at some point credit and debit were added there and replaced the real three. The Type box now offers RECEIPT (money in), PAYMENT (money out) and CONTRA (transfer) again, and those three are now stored properly rather than relying on the options list being empty — so an added option can only ever ADD to a working list instead of silently replacing it. Credit and debit are switched off rather than deleted, in case either was meant for something. The screen also now ignores any Type option the cash book cannot store, so a stray settings row can never again leave you unable to enter a voucher. One knock-on row was corrected: the 05/05/2026 office tea expense of Rs 1,500 was saved as a Receipt while carrying a payment amount — the form still held "receipt" underneath after it vanished from the dropdown — and is now a Payment. It was the only such row in 1,254. The Bank Ledger keeps its own Credit/Debit; that is a separate register and is unchanged.' },
  { date: '2026-09-03', tag: 'Fix', text: 'LINE DAILY ENTRY — FEED NOW HAS A MALE FEED TYPE AS WELL AS A FEMALE ONE. The Feed tab offered a single feed type for the day covering both the Female kg and Male kg columns, which cannot be right: males are on male feed while females are on a layer ration. There are now TWO dropdowns — FEMALE feed type and MALE feed type — one each for the whole day, matching how Bulk Daily Entry has always held a separate feed type for each sex at shed level. Female kg is booked against the female feed, male kg against the male feed, so the two are never recorded under one ration; if both happen to be the same feed they collapse into a single record as before. Only the sex you actually enter kg for needs a type chosen, so a shed with no males needs no male feed type. The list of feeds is now taken in the same order Bulk Daily Entry uses, so the two screens can never offer a different set of feeds for the same day.' },
  { date: '2026-09-03', tag: 'Fix', text: 'LINE DAILY ENTRY AND LINE REPORTS CRASHED WHEN YOU CHANGED THE DATE. Picking a date threw "s.split is not a function" and the page died. The date box hands back a small event object rather than the date text itself, and both new screens were reading it as though it were the text, so the date became an object and every later use of it failed. All three date boxes on the two pages are fixed. Two guards were added so this cannot take a page down again: the date formatter now returns a dash instead of crashing when handed something that is not text, and the date box\'s own type was tightened so wiring it up this way is caught while building rather than by you on the live site. Nothing was lost — the crash happened while displaying, never while saving.' },
  { date: '2026-09-03', tag: 'Fix', text: 'DAILY RECORDS NOW REFUSE A WRITE FROM ANYONE WHO SHOULD NOT BE ENTERING ONE. Since the app was first built, the daily records table carried a blanket rule allowing ANY signed-in user to insert, change or delete a day. What kept a viewer or a shed supervisor out was the menu and the page permission — never the database itself. Writing a day now requires an ACTIVE profile with the role admin, accounts, site manager or site incharge. Shed supervisors are deliberately excluded: their side is the line tables. READING is untouched and stays open to everyone, because dashboards, flock summaries, P&L, egg stock and most reports all read this table and management and viewer are meant to see all of it. Nobody who enters days today loses anything — Daily Entry and Bulk Daily Entry work exactly as before.' },
  { date: '2026-09-03', tag: 'New', text: 'LINE ENTRY — BIRDS, LINE-TO-LINE TRANSFER, SIDE FILTER, AND A REPORT. Four things the line screens were missing. (1) BIRDS PER BOX and the capacity it implies: 2 at Agraharam Potlapally, Bodjanampet-1 and Bodjanampet-2 — NOT at Kethireddypally, whose figure nobody has given us, so its capacity shows a dash rather than a wrong number. Capacity is worked out as boxes x birds per box, never typed, so it cannot drift. (2) A BIRDS tab on Line Daily Entry: put birds onto each line for the flock and see what it holds now — placed, moved in, moved out, died, and the balance. Without this, mortality could be typed against a line that had no birds in it, which is why the Mortality tab looked empty; it now carries a Birds Now column that says "no birds" in amber on any line that has none. (3) A LINE TRANSFER tab: move birds from one line to another on a chosen date, with recent moves listed. Any two lines can be picked, including lines in different sheds. (4) WHICH LINES ARE MALE: a Holds column on both Line Master and Line Daily Entry, showing F, M or F+M, taken from the box split on your sheet — on Agraharam sheds 1 and 2, lines 6, 7, 10 and 11 of sides B and C are male-only, and nobody entering a day could previously see that.' },
  { date: '2026-09-03', tag: 'New', text: 'REPORTS → LINE REPORTS (SHED / LINE WISE). A read-only line-wise report over any date range, shed by shed: boxes, capacity, birds now, eggs, eggs per bird, morning and day mortality, and feed kg for every line, with an Export to Excel. Above the table each line total is shown against the shed\'s OWN total from the existing daily records for the same range — matching in green, differing in amber with the gap — so line entry can be checked against what the site manager closed on the existing screens. It writes nothing at all. A shed supervisor sees only their assigned sheds here, the same rule as the entry screen.' },
  { date: '2026-09-03', tag: 'Improved', text: 'LINE DAILY ENTRY: SIDE FILTER. A shed with 64 lines was one long list. There is now a Side / Lines box next to the date offering "All lines" plus each side the shed actually has — A to D on Agraharam sheds 1 and 2, A and B on sheds 3 and 4, taken from the shed\'s own lines rather than a fixed list. Importantly the filter changes only what you SEE: Save always writes the whole shed and the totals across the top stay whole-shed, so filtering can never quietly cut a save short. FEED TYPE was already shed-wise, not line-wise — one feed type is chosen for the whole day at the top of the Feed tab and applies to every line.' },
  { date: '2026-09-03', tag: 'Fix', text: 'ADMIN → USER MANAGEMENT: SHED SUPERVISOR CAN NOW ACTUALLY BE PICKED. The role has been valid in the database since the day it was created and had its own colour on the user list, but it was never added to the role dropdown on the user form — so there was no way to give it to anybody, which is why no shed supervisor account exists. It now sits between Site Incharge and Viewer, described as "Line Daily Entry and Line Master only — nothing else". To create one: Admin → User Management → Add User, choose Shed Supervisor. Roles themselves are a fixed list and are not created; what each role can reach is set in Admin → Access Control, module by module.' },
  { date: '2026-09-03', tag: 'New', text: 'FLOCK MANAGEMENT → LINE DAILY ENTRY. Line-wise daily figures can now be entered, running ALONGSIDE Bulk Daily Entry rather than replacing it — every existing screen works exactly as before, and nothing on this page writes to the shed\'s daily record. Three tabs: EGGS, entered per line for each of the four rounds; MORTALITY, entered twice a day per line as MORNING and DAY, which add up to that line\'s day total; and FEED, entered as kg female and kg male per line with ONE feed type chosen for the whole day rather than picked line by line. Above each tab the line total is shown against the shed\'s own figure for the same date — matching in green, differing in amber with the gap — so the two can be reconciled by eye. The gap is only ever SHOWN: no button copies line totals into the shed record, and that is deliberate until the line figures have been trusted for a while. A blank box is left alone when you save; it is not stored as a zero, so a round nobody has counted yet stays uncounted. Only sheds switched to line-managed appear — today that is Agraharam Potlapally sheds 1 to 4 and nothing else. ACCESS: admin, shed supervisor, site manager and site incharge can all view AND enter; management, accounts and viewer cannot see the page. Enforced by the database as well as the screen — the three line tables previously accepted a write from any signed-in user and now accept one only from those four roles.' },
  { date: '2026-09-02', tag: 'Fix', text: 'LINE MASTER — AGRAHARAM POTLAPALLY\'S FIGURES WERE BOXES, NOT BIRD CAPACITY. The Agraharam line sheet\'s female and male columns were read as capacity in birds and loaded into the bird-capacity fields, so the screen described 97–101 BOXES per line as though each line held 98 birds. The giveaway was the whole-shed totals — 6,178 / 6,144 / 6,216 / 6,216 — far too small to be birds in a layer shed, and the same order as Kethireddypally\'s 40–70 boxes per line. Because that sheet splits its boxes by sex and the table held only one box column, the line record now carries BOXES FEMALE and BOXES MALE alongside the total, and the Agraharam figures have been moved into them; their bird capacity is now blank, because no sheet has told us what it is. The total Boxes column is added up from the female and male split whenever a split is entered, so the shed total that is checked against the Sheds master can never drift away from the lines under it. Kethireddypally is untouched — its 292 lines and 24,044 boxes were always loaded correctly and its sheet prints no female/male split. Bird capacity stays on the screen for any sheet that genuinely gives it, now labelled "Bird Cap" so the two can never be confused again.' },
  { date: '2026-09-02', tag: 'New', text: 'MASTERS → LINE MASTER. The cage lines inside each shed now have a screen of their own: side (A–D), line number, boxes (with a female/male split where the sheet gives one), and bird capacity, grouped by shed with a running total. Each shed total is shown against the figure already held in the Sheds master and flagged if the two disagree, so a mistyped box count shows up immediately rather than months later. Loaded so far: Kethireddypally (12 sheds, 292 lines, 24,044 boxes — agreeing with the shed master on every one of the 12) and Agraharam Potlapally (4 sheds, 192 lines, 24,754 boxes split female/male). Bodjanampet-1 and Bodjanampet-2 are deliberately NOT loaded: one sheet did not add up to its own printed totals and the other was reported as containing a mistake. Every row is marked Provisional until confirmed. Deleting a line warns that its production, mortality and feed history goes with it.' },
  { date: '2026-09-02', tag: 'New', text: 'LINE MASTER ACCESS: admin can edit; SHED SUPERVISOR, SITE MANAGER and SITE INCHARGE can view. This is a permission of its own rather than part of Masters — site manager and site incharge hold FULL rights on Masters, so folding the line data in there would have handed them edit access, and shed supervisor had no permissions at all since the role was created. Read-only users see the same page with Add and Edit replaced by a View-only marker. The rule is enforced by the database as well as the screen: row policies on the line table allow reads to those four roles and writes to admin alone, so a hidden button is not the only thing between a user and the data. Nothing else in Masters changed — Farms, Sheds, Feed Types and the rest stay with admin and accounts exactly as before.' },
  { date: '2026-09-01', tag: 'New', text: 'PAYMENT PLANNING → PRINT NOW SHOWS AN "EXPECTED RECEIPTS" BREAKDOWN. The printed sheet used to reduce everything owed to you to a single "Need to Receive Amount" with no lines behind it, so nobody reading it could see WHICH parties that money was coming from. Pending Receivables rows are now tickable (the list also shows all of them — it was capped at 10 on screen, so you could not have picked the 11th), and every ticked row prints as its own line with party, source, flock and date. Manual receivable items print in the same table marked "(manual)", which they never did before — only manual payables printed. The printed "Need to Receive Amount" is now the total of exactly the ticked rows, so the figure and the lines under it can never disagree.' },
  { date: '2026-09-01', tag: 'Improved', text: 'PAYMENT PLANNING: "Need to Receive" and "Balance After" now count only the receivables you TICK, not every unpaid invoice in the system. Previously the sheet added up every outstanding NHE sale and HE dispatch whether or not it was expected that day, which made the figure far larger than the money actually coming in. The purple Pending Receivables header still shows the full outstanding total for reference, so nothing is hidden — it is just no longer treated as today\'s expected receipts. If you tick nothing, Need to Receive is zero.' },
  { date: '2026-09-01', tag: 'Fix', text: 'BANK LEDGER — "SETTLE AGAINST INVOICE(S)" NOW SHOWS BALANCES NET OF TDS. The tick-list used to show the full invoice value, but a buyer who deducts TDS (Hitech Hatch Fresh deducts 0.1%) pays you the invoice LESS that TDS — so the receipt could never cover the balance shown, and the invoice stayed "Partial" forever with a leftover exactly equal to the TDS. Balances are now the net figure the buyer actually pays, with "(net of ₹X TDS)" shown beside any invoice that has TDS, and an invoice is marked Received once that net amount is in. This matches how the HE Dispatch receipt screen and the purchase-side Invoice Register have always worked. NHE sales are unaffected — they carry no TDS.' },
  { date: '2026-09-01', tag: 'Fix', text: 'PARTY LEDGER — TDS DEDUCTED BY A BUYER IS NOW CREDITED. An HE dispatch was debited at its full invoice value but only the money actually banked was credited, so the TDS the buyer withheld was never accounted for and each such invoice left a small permanent balance sitting open in the party ledger even after it was fully settled. A "TDS Deducted" credit line now closes those out; 26 invoices carrying ₹47,052 between them were affected. The credit is capped at the invoice\'s own shortfall, so nothing can be over-credited, and invoices where the full gross was banked are untouched.' },
  { date: '2026-08-28', tag: 'Fix', text: 'FLOCK 20 SEPTEMBER 2025 MOVE TO BODJANAMPET-1 IS NOW RECORDED CORRECTLY. When the flock moved out of Kethireddypally between 24/09/2025 and 28/09/2025, the movement was entered at the SOURCE shed as birds RECEIVED instead of birds TRANSFERRED OUT, so those grower sheds showed roughly double their birds and never fell to zero. Eleven day-rows across Kethireddypally sheds 1, 2, 3, 4, 7, 8 and 9 now carry the transfer-out and the closing counts from your Flock 20 sheet. The receiving side at Bodjanampet-1 was already right and was not touched: 35,102 females and 4,127 males out matches exactly what was booked in.' },
  { date: '2026-08-28', tag: 'New', text: 'FLOCK 20 SHED TRANSFERS ENTERED IN THE APP. Flock 20 had no transfer records at all — nine real moves (30/07, 06/09, 24-28/09, 11/11, 12/11 and the final 26/12/2025 exit from Kethireddypally) existed only in the Excel sheet. They are now in the app, 35,878 females and 4,277 males in total, so the flock\'s movement history is traceable and a vacated shed no longer looks like it still holds birds. Destination sheds inside Kethireddypally are deliberately left blank on three of them, because naming a vacated shed there would put it straight back into the Bulk Daily Entry grid — the grid\'s shed list ignores dates, and fixing that properly is still open.' },
  { date: '2026-08-26', tag: 'Fix', text: 'FLOCK 20 CLOSING BIRDS WERE OVERSTATED BY 1,029 FEMALES / 34 MALES — it read 32,560/3,169 when the real live count at Bodjanampet-1 is 31,531/3,135. Cause: Flock 20 left Kethireddypally in Dec 2025, but a shed link added later put those vacated sheds back into the Bulk Daily Entry grid, and saving that grid on 25/08/2026 wrote a daily record into 5 sheds the flock no longer occupies. One of them (Kethireddypally Shed 2) carried forward its stale 26/12/2025 closing of 1,029/34, and the flock summary adds up every shed row on the flock\'s latest date — so those birds were counted as still alive. The 5 stray rows are removed and the vacated sheds no longer appear in Bulk Daily Entry for Flock 20. Nothing at Bodjanampet-1 was touched, and Flock 22 — which now occupies that same Kethireddypally shed — is unchanged; the row-chaining triggers were switched off during the fix precisely because they chain by shed across flocks. Underlying gap still open: the shed-to-shed transfers were never recorded, which is why a vacated shed keeps its last bird count at all.' },
  { date: '2026-08-25', tag: 'New', text: 'FLOCK → FINANCIAL TAB: an Investment Recovery card, always covering the flock\'s whole life regardless of the From/To filter above it. Shows total invested so far, total cash actually received (HE Dispatch + NHE Sales on the date the money came in, not the day the egg was valued), cost per bird placed, net P&L, and — the headline — the month the flock\'s cumulative cash received first caught up with cumulative cost, i.e. when the investment in this flock was recovered. Built from the same cost components as the Cost & Income tab\'s monthly total (chick, feed, medicine, expenses, site salary/electricity), rolled up month by month from placement.' },
  { date: '2026-08-25', tag: 'Fix', text: 'FLOCK DASHBOARD: what was labelled "FCR" was actually feed (kg) ÷ egg COUNT, not real FCR (feed vs body-weight gain in rearing, feed vs egg mass in lay) — body weight is only ever imported for 4 flocks and egg weight is never recorded at all, so a true FCR isn\'t computable dashboard-wide. It\'s now split into two honestly-labelled figures: Rearing Feed (kg consumed before the flock\'s first egg — a one-time cost, not a ratio) and Lay Feed/Egg (feed ÷ eggs counted only from the first-egg date onward, excluding the rearing feed that was previously dragging the whole-life number up). Also fixed two real bugs in the underlying total: le_eggs was missing from the egg count (only 4 of 5 grades were summed), and the egg-type double-count documented in migrations 927/928/951 (same counts on both a per-shed row and the flock-level row for the same date) had no structural guard — it now sums only shed-level rows for a date when they exist.' },
  { date: '2026-08-25', tag: 'New', text: 'MASTERS → VEHICLES: shared vehicles (Creta, Innova, Activa, Dosth-AshokLeyland) that show up as a Vendor on a Farm Expense, with no site of their own, now have a real record — name, vehicle number, and a BASE FARM. That base farm was hardcoded to Head Office in code until now; it is edited here instead, and Farm Expenses reads it live: a vehicle\'s spending posts to Cash Book against whatever farm is set here, falling back to Head Office only if the vendor name has no matching vehicle record. Add a new vehicle here the same way, whenever one shows up in an import.' },
  { date: '2026-08-25', tag: 'New', text: 'IMPORTED 413 SITE & HEAD OFFICE IMPREST EXPENSES from the farm\'s own expenditure register, each posted to Cash Book too so the imprest float actually reflects what was spent — Emp Advance/Salary rows were left out since those are already tracked in the Employees module.' },
  { date: '2026-08-25', tag: 'New', text: 'FARM EXPENSES NOW POST TO CASH BOOK — a Site or HO expense recorded here is real cash out of that site\'s imprest float, but the two ledgers never touched: recording an expense never moved the Cash / Imprest balance shown on Payment Planning, so a site could show plenty of imprest cash while every rupee had already been spent. Adding, editing, deleting or bulk-importing a farm expense now also creates (or removes) a matching Cash Book payment entry, linked back to the expense so an edit replaces it cleanly rather than leaving a stale one behind. An expense with a Vendor but no Site (a shared vehicle — Creta, Innova, Activa, Dosth-AshokLeyland) posts against Head Office\'s float, since that cash didn\'t come out of any one site\'s imprest. A VENDOR FILTER is also added to the list, so a shared vehicle\'s spending can be pulled up on its own.' },
  { date: '2026-08-25', tag: 'New', text: 'REPORTS → SHED & DAY REPORT: one place for shed-wise, day-wise and grade-wise figures, downloadable as Excel. Shed-wise production lived on Flock → Shed Performance with no export; egg grades (A/B/C) were exportable but only at flock level, never by shed; day-by-day detail existed only inside Egg Stock, again flock-level. This new report puts all three together — one row per shed per day: opening/closing birds, mortality, feed, total eggs, HE eggs, HD%/HE%, grade A/B/C, JE/TE/BE/LE and wastage — filterable by farm, flock and date range, with a single Export button. Nothing is entered twice; it reads the same daily_records the sheds already fill in.' },
  { date: '2026-08-25', tag: 'New', text: 'NHE SALES — BIRD SALE CAN NOW COVER SEVERAL SHEDS AND BOTH SEXES ON ONE VOUCHER. One DC No sometimes covers birds from more than one shed, or both females and males, in a single visit — the form only ever held one shed and one sex per row, so this had to be typed up as several unrelated entries with no way to see they belonged together. "+ Add Another Shed/Sex" (same idea as GRN\'s "+ Add Another Item") appends further lines, each with its own shed, sex, category, quantity and rate, all sharing the first line\'s date, party, DC No, invoice and vehicle. Every line saves as its own sale, so each shed\'s closing count is still correct — only the payment stays on the first line, since one voucher has one payment. Editing an existing sale is unchanged — one row, as before; extra lines are offered only when adding a fresh sale.' },
  { date: '2026-08-25', tag: 'New', text: 'FLOCK LIFETIME (VS STANDARD) CAN NOW BE PRINTED. A Print button sits beside Export: it prints the four on-screen charts — body weight, cumulative depletion, feed, hen-day production, each actual against standard — exactly as drawn on screen, followed by the weekly detail table. Nothing is re-drawn from the underlying figures for the printout, so the printed chart can never disagree with the one on screen.' },
  { date: '2026-08-19', tag: 'Fix', text: 'FEED FORMULA: A RECIPE WRITTEN IN KILOS CAN NOW BE SAVED. The formula form has always had two columns per ingredient \u2014 percentage, and kilos in a 1,000 kg batch \u2014 but the check that ran on Save added up ONLY the percentage column. Fill in the kilos and leave the percentages blank, as a mill hand naturally would, and it refused the formula with \u201cIngredient percentages must total 100%. Current total: 0.0000%\u201d, counting a column that had been deliberately left empty. The two are the same number in different clothes: 600 kg of a 1,000 kg batch IS 60%, and the app already converted one into the other when importing formulas and when producing feed \u2014 only the save check had never been taught it. Either column now works, whichever is filled the other is worked out and BOTH are stored, so production and costing never have to guess which way the formula was written. The running total shows both figures live \u2014 percent and kilos against 1,000 \u2014 and where a row carries a percentage and a kilo figure that CONTRADICT each other, the ingredient is named and the farm decides which is right, rather than the app quietly preferring one.' },
  { date: '2026-08-19', tag: 'New', text: 'VS STANDARD NOW FOLLOWS THE EGGS: HE PRODUCED, HE DISPATCHED AND EGGS SET, week by week. A week\u2019s laying and a week\u2019s hatch result are not the same quantity \u2014 the flock may lay 30,000 hatching eggs while 25,000 go to the hatchery and the hatch report covers only those 25,000. Hatch % is now a fact about the eggs SET, HE% and HE/HH stay facts about what the birds laid, and Chicks per hen housed is never scaled up to pretend the rest had been set. Hatch results are attributed back to the week the eggs were LAID, not the week they were dispatched or set: a batch set on 14/09 from eggs laid 03/09 to 09/09 is split across those seven days in proportion to each day\u2019s eggs. Before this, a batch was credited to its dispatch week, putting a hatchery result on the wrong flock-age row entirely. One honest limit is marked with a star: day-wise dispatch entry began on 10/09/2025, and before that a whole load was recorded against a single production date \u2014 40,320 eggs on a day the flock laid 12,000 \u2014 so those weeks show the eggs but flag that the laying week they are credited to cannot be trusted. That is also why dispatched appeared to exceed produced in Flock 19\u2019s weeks 29 to 31.' },
  { date: '2026-08-19', tag: 'Fix', text: 'VS STANDARD WAS ONE WEEK OUT ON EVERY ROW, and the export was missing twelve columns that are on the screen. The week fault: the app\u2019s age helper counts COMPLETED weeks, so a flock\u2019s first seven days are its week 0 \u2014 correct for stating an age like \u201c58w 4d\u201d \u2014 while the breed standard numbers the first week of life as week 1. The two conventions met on this tab without anyone noticing, so standard week 24 was being compared against the flock\u2019s TWENTY-FIFTH week, and every figure sat against the wrong benchmark. Flock 19 showed it plainly: the row labelled 24 carried 13,487 eggs, which is its week 25. The ordinal is now made where the standard is matched, and the shared age helper is untouched because age display rightly counts completed weeks. The export fault: it stopped after Hatch %, silently dropping Weekly and Cumulative TE/HH and HE/HH \u2014 twelve columns \u2014 so a printed copy could not be reconciled against the page it came from. It now carries every column in the same order as the table, plus the raw figures behind each percentage.' },
  { date: '2026-08-19', tag: 'Fix', text: 'FLOCK \u2192 VS STANDARD: HATCH % AND CHICKS PER HEN HOUSED NOW READ THE HATCH BATCHES. Fourteen batches were linked to Flock 19\u2019s dispatches, all fourteen carrying a hatchability figure, and the tab showed nothing \u2014 because it read he_dispatch.hatch_pct, a field left over from the app\u2019s first schema which is empty on every dispatch the farm has ever made. The linking was correct all along. Hatch % is now worked out from the batches behind each week\u2019s dispatches, WEIGHTED BY EGGS SET rather than averaged, since a 30,000-egg batch and a 5,000-egg batch must not count equally. Weekly and Cumulative Chicks/HH gained an Actual and a Var column for the first time \u2014 chicks hatched divided by females placed \u2014 where before only the standard was shown, with a note saying the app did not hold chick counts. It does: they are on the batch. These columns stay blank for any week whose batches are not linked to a dispatch, which is still 380 of the 394 batches in the app.' },
  { date: '2026-08-19', tag: 'Improved', text: 'THE VS STANDARD TABLE NOW SHOWS THE REAL NUMBERS BEHIND EVERY PERCENTAGE, in small grey type under BOTH the standard and the actual. Cumulative depletion reads \u201c1,486 of 45,700\u201d with the week\u2019s own deaths beside it, hen-day production reads \u201c162,655 eggs / 250,900 bird-days\u201d, HE% names the hatching eggs, and hatch % reads \u201c30,000 set \u2192 25,260 chicks\u201d. A page of percentages alone cannot be checked against the shed register or argued with \u2014 and the figures were always there, one division away. The STANDARD is shown as a number too: a standard per hen housed is multiplied by the females placed, and a standard RATE \u2014 hen-day, HE%, hatch% \u2014 is applied to what this flock actually did, the same bird-days and the same eggs set, so both sides answer one question and the gap between them reads as a real number of birds, eggs or chicks. The CSV export carries them as their own columns: deaths and culls for the week and cumulative, eggs, hatching eggs, bird-days, eggs set and chicks hatched.' },
  { date: '2026-08-19', tag: 'Improved', text: 'TASKS NOW SHOW WHEN A TASK WAS RAISED AND WHEN IT WAS FINISHED. The list carried only a due date, so there was no way to see how long anything had been sitting or when it was actually closed \u2014 which is the first question anybody asks of a list of 26 open items. There are now CREATED and COMPLETED columns, with the days taken shown beside the completion date. The dates were always being recorded: ticking a task off has always written the time and the person, but the page never displayed it. A task closed before that was recorded, or closed by a migration rather than by a person, reads \u201cnot recorded\u201d rather than being given an invented date.' },
  { date: '2026-08-19', tag: 'Fix', text: 'A FLOCK NOW HAS A REARING SEASON AS WELL AS A LAYING SEASON, and the two are usually different \u2014 Flock 19 was brooded in February and laid on into the following winter. The breed standard is published PER SEASON for the growing weeks as well as the laying ones, but the flock record only ever held laying_season, so every screen reading a growing standard either used the laying season (the wrong curve for half the flock\u2019s life) or worked the season out from the placement month. Rearing Season is now a field on the flock, beside Laying Season, on both the add and the edit form. Flock Lifetime reads the GROWING weeks against the rearing season and the LAYING weeks against the laying season, and says which it used at the top of the page. Weekly Performance does the same, with a recorded season beating the month rule. Left blank, the month rule still applies as the fallback (February to July counts as Summer) and the page says so rather than presenting a guess as the standard. Only females are affected \u2014 the male standards are published once, under season Both.' },
  { date: '2026-08-19', tag: 'New', text: 'FLOCK MANAGEMENT \u2192 FLOCK LIFETIME (VS STANDARD): one flock, week 1 to the last bird, actual against the Vencobb430 standard \u2014 the weekly report a manager assembles by hand in Excel, drawn from figures the sheds already enter. Each week shows opening birds, deaths, cumulative depletion against standard, body weight and weekly gain against standard, feed kg, feed per bird per day against standard, cumulative feed per bird against cumulative standard, the feed type due at that age, eggs, hen-day production and HE%, each with its deviation. Four charts \u2014 body weight, depletion, feed and hen-day production \u2014 and a CSV export. SEX: female, male, or BOTH SIDE BY SIDE, which is how the farm\u2019s own report is laid out. In the Both view each sex gets its own line and its own standard on every chart, because one combined line would zig-zag between two animals that are not comparable. NOTHING IS ENTERED TWICE: mortality and feed come from daily entry, body weight from the weekly weighing, standards from the breed tables. Weeks are counted the farm\u2019s way \u2014 day 1 is the day AFTER placement, so week 1 ends on placement plus 7, checked against Flock 22 whose report dates week 1 as 12-May for a 05-May placement \u2014 and a week with fewer than seven days entered is shaded, because its totals are real but not comparable with a full week.' },
  { date: '2026-08-19', tag: 'Improved', text: 'FLOCK WEEKLY PERFORMANCE now shows MALE AND FEMALE TOGETHER. The page always stored them separately \u2014 one row per flock, week and sex \u2014 but displayed one sex at a time through a dropdown that quietly defaulted to Female, with nothing on screen to say so, which read as though the males were missing. There is now a Both option, a SEX COLUMN on every row (pink for female, blue for male), and weeks sorted so the two sexes of a week sit together. The chart in Both mode draws four lines: each sex and its own standard. Flock 22\u2019s 14 weeks of weights and Flock 23\u2019s first week were imported from the weekly report workbooks at the same time \u2014 body weight only, since depletion and feed were checked against the daily records first and agree week for week, and a second copy would give two answers to one question.' },
  { date: '2026-08-19', tag: 'New', text: 'A FLOCK CAN NOW BE IMPORTED FROM DAY ONE TO ITS LAST DAY, and the same path works for every flock \u2014 16, 17, 19, 20 and the rest. Two things were stopping it. The multi-day importer only accepted sheds the flock was ALREADY KNOWN to be in (its links, allocations and transfer destinations), and a flock at the start of its life is recorded as being nowhere at all \u2014 Flock 19 and Flock 20 have no allocations whatsoever \u2014 so every rearing row would have been thrown out as an unmatched shed. The importer now also accepts any active shed at the flock\u2019s REARING or LAYING farm, which is what a life spanning two sites needs, while the daily entry grid still shows only the sheds the flock is actually in, so nothing gets cluttered. And a flock with no sheds recorded at all can now be imported instead of being refused at the first step. HE DISPATCH also gained the rest of what a dispatch really carries: boxes 20lb and 23lb, extra trays of each size, vehicle type, lorry number, vehicle number, driver phone, out time, TDS percent and the temperature readings \u2014 all on the template and the export. These belong to the dispatch rather than to a production date, so they are written on the FIRST row of each dispatch and left blank on the rest, and temperature compliance and the TDS amount are worked out rather than typed.' },
  { date: '2026-08-19', tag: 'New', text: 'NHE SALES IMPORT HAS AN \u201cUPDATE EXISTING\u201d OPTION, for filling in a column on sales already entered. 225 bird sales were recorded before the app had anywhere to put the shed, and adding the column to the template only helped NEW rows \u2014 an import matching an existing sale was skipped as a duplicate, so there was no way to correct them short of opening all 225 by hand. Tick the box and a matching row updates the sale instead of being skipped: export the sales, fill in the Shed column in Excel, import it back. Only the columns the sheet actually carries are written, so a blank cell never wipes something already recorded, and the box is OFF by default so an ordinary import still cannot overwrite anything. The same route works for any other field added after the fact \u2014 free quantity, employee, invoice number.' },
  { date: '2026-08-19', tag: 'Improved', text: 'THE IMPORT TEMPLATES NOW CARRY EVERYTHING THE APP RECORDS. They were written when the app was younger and never grew with it, so columns added since could not be imported at all \u2014 which is why entering history meant typing it in by hand. NHE SALES: the template and the export now take SHED NO (which shed the birds were sold from \u2014 the very field whose absence put 36,080 of Flock 19\u2019s culls on shed-less rows), FREE QTY, EMPLOYEE (by employee ID, for sales deducted from salary) and INVOICE NO. A shed named in the sheet that the flock is not actually in is left blank and counted in a warning, never guessed, because a wrong shed moves birds off the wrong closing count. HE DISPATCH: the template is now ONE ROW PER PRODUCTION DATE \u2014 rows sharing flock, dispatch date and DC number become one dispatch with a line per production day, each keeping its OWN grades and its OWN rate, so a rate revised mid-dispatch survives the import. The old template allowed a single production date and a single rate, so a real dispatch could not be entered without flattening it. The export matches, so a dispatch can be exported, corrected and put back with its day-wise split intact. GRN EXPORT: gains free quantity, flock, invoice number and date, and other charges \u2014 all of which the import already accepted, so export and import finally agree. DAILY ENTRY (multi-day): gains FARM and RECEIVED F/M, needed for importing a flock\u2019s whole life \u2014 arrival day is birds RECEIVED, which no other column could say, and a flock reared at one site and laying at another has the same shed numbers twice over.' },
  { date: '2026-08-19', tag: 'Fix', text: 'Two faults found while widening the importers. HE dispatch import attached its day-wise production lines to dispatches BY POSITION, matching the inserted rows against the unfiltered list \u2014 so a single duplicate row skipped during import shifted every line onto the following dispatch, silently crediting one buyer\u2019s eggs to another. Lines are now carried with their own dispatch. And the multi-day daily import matched sheds by NUMBER ALONE: a flock reared at Kethireddypally (sheds 1-12) and laying at Bodjanampet-1 (sheds 1-7) has two sheds numbered 1, and the importer quietly kept whichever it saw last, so a day\u2019s production could land at the wrong site. It now matches on farm and number together, and refuses an ambiguous number rather than guessing.' },
  { date: '2026-08-19', tag: 'New', text: 'FLOCK MANAGEMENT \u2192 CHICK RECEIPTS: breeder females and males received per flock, read from the CHICK GRNs themselves \u2014 billed quantity, free quantity, total, the supplier, the invoice number and date, the rate and the amount, with a line for every GRN behind each flock and totals across all of them. The purchases were always recorded properly (category Chicks, one line per sex, free birds in their own column, against a party and an invoice), but nothing displayed them together: to answer \u201chow many breeder females did we get and on which invoice\u201d you had to open the GRN register and filter by hand. The page also does three checks nobody was doing. It names any flock with NO chick GRN at all \u2014 birds on the flock record but the purchase never entered. It names any chick GRN NOT LINKED TO A FLOCK, where the birds belong to nobody. And where the GRNs and the flock\u2019s own placed figure disagree it says so on the row, giving the difference in females and males, rather than preferring one number over the other \u2014 the flock record and the purchase record are two accounts of the same delivery and they should match. Hatchery advances paid against a flock are shown beside it. Exports to CSV.' },
  { date: '2026-08-19', tag: 'New', text: 'ADMIN CENTRE \u2192 HEALTH CHECK now opens with SUPABASE USAGE \u2014 how much of the free plan is actually gone, without anyone having to ask. Two bars: the database against its 500 MB limit, and file storage against 1 GB, plus the twelve largest tables with their sizes and row counts, the audit trail\u2019s size and growth, and an estimate of how many days of headroom remain at the present rate. It exists because of what the first measurement found: the database stood at 207 MB, and 166 MB of that was the AUDIT LOG alone \u2014 535,086 entries in two months, four fifths of everything stored, growing about 6 MB a day. Nobody could have seen that from inside the app. Admin only, enforced by the database rather than hidden on screen. GitHub and Cloudflare figures are not shown, because reading them needs an API token the app does not hold, and a number that cannot be measured is better left off than guessed.' },
  { date: '2026-08-19', tag: 'Improved', text: 'A SAVE THAT CHANGES NOTHING IS NO LONGER RECORDED. The audit log had 535,086 entries after two months, and 444,617 of them \u2014 83% \u2014 belonged to attendance_daily, a table holding just 12,028 real rows: 12,028 creations and 432,589 updates, meaning every attendance row had been rewritten about thirty-six times. Nothing was wrong with the attendance; saving the month grid simply writes back every cell whether it was touched or not, and each write was recorded as history. From now on, if the row after a save is identical to the row before it, nothing is written to the log. Real edits are recorded exactly as before, values and all, so Undo is unaffected. Only the timestamp column is ignored when comparing, since it changes on every save by definition. Nothing already recorded was deleted.' },
  { date: '2026-08-19', tag: 'New', text: 'EMPLOYEES \u2192 ATTENDANCE & SALARY \u2014 DATE RANGE: any From\u2013To period, every employee, on one screen. Until now attendance could only be read one calendar month at a time (or one day, on Daily Attendance), so a question like \u201cwhat did the Site 2 men work between 15 April and 10 July\u201d meant opening three months and adding them up by hand. The new page gives, per employee and as a grand total: present, absent, half days, week offs, OT days and OT hours, paid days (a half day counting a half, the same rule as the month grid), and the earned, advance and net salary for the months inside the range. Filter by site, search by name or ID, export to CSV. It is READ ONLY on purpose \u2014 marking attendance and paying salary stay exactly where they are. ELECTRICITY got the same treatment: Bills Entry and Allocation now take a From month and a To month instead of a single month, and printing a range says so on the report. Choosing From alone still means that one month, exactly as before.' },
  { date: '2026-08-19', tag: 'Fix', text: 'The nightly backup\u2019s weekly snapshot could fail on a race and, worse, could publish data. The first run exported 572,302 rows from 138 tables correctly, but the step that commits a compressed weekly copy pushed straight to main after a quarter-hour export \u2014 by which time main had moved on \u2014 and the push was rejected. It now rebases before pushing. The more serious point: while the code repository is PUBLIC, that committed snapshot would put salaries, bank entries and party ledgers into public history permanently, so the step now refuses to commit anything unless the repository is private, and says so in its log. The 90-day backup copy is unaffected and still runs every night.' },
  { date: '2026-08-18', tag: 'New', text: 'THE APP CAN NOW UNDO A MISTAKE. Until today the audit log recorded who changed what and when, but never the VALUES — which is why, when linking an invoice overwrote Eggs Set on two hatch batches, it could say the rows were changed at 14:48 and 14:49 by admin and nothing more: the original figures were gone and the repair depended on remembering them. Every change now stores the row as it WAS and as it BECAME, across all 30 audited tables. On Admin Centre → Audit Log each entry opens into a field-by-field list — Field, Was, Became — and carries an UNDO button that puts the record back exactly as it stood. Undoing a deletion recreates the row; undoing a creation removes it. Undo is admin only and that is enforced by the database, not just hidden on screen; it is itself recorded in the log, so an undo can be undone; and an entry already undone says so instead of offering the button twice. Entries from before today show a dash rather than a button that would fail, because their values were never kept. And a NIGHTLY BACKUP now writes every table out to CSV at 02:30 and keeps it away from the database it came from — a 90-day copy of everything including the audit trail, plus a compressed weekly snapshot stored permanently outside Supabase. That matters more on the free plan than it would otherwise: there is no point-in-time recovery to roll the database back to this afternoon, so the export is the real safety net, and the honest limit is that it restores yesterday rather than an hour ago.' },
  { date: '2026-08-18', tag: 'Improved', text: 'Hatch Batches → Link Dispatch Invoice: a fully set invoice now DROPS OUT of the dropdown, and a partly used one shows what is left of it — "★ INV-2026-014 · 05/08/2026 (1,00,800 eggs) F-23 · 30,000 set, 70,800 left". Until now the list held every dispatch ever made with nothing to say which had already been used: with a hundred invoices sent that is a list nobody can read, and every spent invoice still sitting in it is one more chance to link the wrong one twice. An invoice stays listed while any eggs remain, because a dispatch legitimately feeds several settings — a lakh eggs are split across hatcheries and dates — and only disappears once all of it is set. Saving now REFUSES to set more eggs against an invoice than it carried, naming exactly how many remain, and a new nightly rule catches any that got in earlier: linking one invoice to two full batches records twice the eggs that ever left the farm, and every hatch percentage measured against them is then measured against eggs that did not exist. Checked on today\'s data — no invoice is over-allocated. A wrong link is corrected on the same form the batch is edited from: the field now says what the batch is linked to, how much of that invoice is spent, and that another invoice can be chosen or the blank option picked to unlink it. The batch being edited never counts against its own invoice, so reopening it does not show its eggs as already spent.' },
  { date: '2026-08-18', tag: 'Improved', text: 'Following the missing Qty total on Cull Sales, EVERY table in the app was swept for the same gap: 44 carry a quantity column and 30 gave no total at all. Totals are now on the ones where a total is meaningful — Feed purchase by ingredient and the GRN register, the site invoice screen (which totalled money but not quantity, leaving the buyer\'s own check half done), diesel purchases and the monthly diesel summary, feed production and feed transfers, the feed mill production log and its stock adjustments, inventory adjustments, hatchability batches and the hold-days table, and the flock monthly summary. Two rules run through all of them. Quantities are totalled PER UNIT wherever units differ — kg, doses and loads are different things, and one combined figure would say nothing, which is why several of these totals were missing in the first place. And a percentage on a total line is RECOMPUTED from the totals rather than averaged down the column: averaging the hatch percentages of batches of different sizes produces a figure that belongs to no batch. Where a total would be dishonest it is still left out and now says so — the medicine usage lists mix millilitres, doses and grams across different medicines, so no single figure means anything. The remaining twelve tables are listed on the pending list rather than quietly forgotten.' },
  { date: '2026-08-18', tag: 'Fix', text: 'Flock → Cull Sales and Egg Sales (NHE): the TOTAL line gave a figure for Amount but left QTY blank, on every flock — the total row simply spanned across that column, so the one question those pages exist to answer, how many birds or eggs went out, had to be added up by hand. Quantity is now totalled PER UNIT rather than as one number: birds are counted in nos, litter by the load, bags by the bag, and adding those together would produce a figure that means nothing — which is presumably why the total was left off in the first place. Where every row shares a unit it reads as a single figure with the unit beside it; where they differ, one line each. The Bird / Cull Sales Report was checked at the same time and already totals its quantities correctly.' },
  { date: '2026-08-18', tag: 'New', text: 'ADMIN CENTRE → HEALTH CHECK: the app now checks itself, every night at 4am, and shows the result on its own page. Twelve rules compare figures that must agree — feed produced against ingredients coming off stock, GRNs against the stock ledger, birds opening plus arrivals less deaths, culls and transfers against closing, bills against payments, cash book entries against the sales they belong to, medicine used against medicine taken off stock. Each is written so that ZERO is the only correct answer, and each says in plain words what a failure MEANS: not "grn_without_stock: 3" but "goods were received and paid for but the stock was never increased, so the item reads lower than it is". A critical failure raises a task on the Development list by itself, so a wrong figure reaches the pending list overnight instead of waiting for somebody to notice it on a screen. There is a Run now button for checking immediately after a big entry session. It earned itself within minutes of being switched on: it found 85,113 kg of feed ingredients on the 31/05/2026 batch that had been used but never came off stock — a fault created that same morning by an ordinary edit, which nobody had noticed. ADMIN ONLY: this page lists bills, items and flocks that are WRONG, so it is restricted to admin by the database itself, not merely hidden — another user cannot read the results even by asking the server directly. The rules only catch what they have been taught, so every fault found from here on is added as a new rule in the same session it is fixed.' },
  { date: '2026-08-18', tag: 'Fix', text: 'Alkakarb\'s 5,000 kg received on 11/06/2026 was missing from Feed Mill → Feed Stock Status: the row read Total In 2,175 (the opening stock alone), balance −879, last GRN 01/04/2026 — and the same page had shown it correctly before. Everything in the data was right: the GRN is there with the correct category, the stock ledger has the 5,000 kg receipt linked to the item, the balance is 4,120.61 kg, and all 294 GRN lines in the system reached stock with none missing. The fault was in how the page READS. Big tables are fetched in slices of 1,000 rows, and these slices were sorted by date alone — but rows sharing a date have no fixed order, so the server can arrange the second slice differently from the first and a row falls in the gap between them. It is never returned, nothing reports an error, and a different row can be lost each time the query runs. That is exactly why the figure was right one day and wrong the next with nothing changed. Every paged read in the app was swept: 79 sorted by a non-unique column — dates, item names, GRN numbers — and 71 of them now sort by their unique id as well, which pins the order so nothing can hide between slices. The remaining 3 read database views with no id column; they are small and are on the pending list. This affected far more than one page: flock daily records, GRNs, sales, dispatches, payments, attendance and the stock ledger were all read this way.' },
  { date: '2026-08-18', tag: 'New', text: 'NHE bird sales now record WHICH SHED the birds were sold from, and Bulk Daily Entry shows the day\'s sales above the grid. Flock 19 was reopened to enter missing data and its bird sales appeared nowhere in Bulk Daily Entry — 69 sales over 10 days, 36,080 female and 3,471 male birds. Nothing was lost: the birds were deducted and the flock total was right. But a sale had no shed to go on, so its culls were written to whichever daily record happened to be first for that date — or, on the 5 days with no record yet, to a NEW record with no shed at all. Bulk Daily Entry draws one row per shed, so a shed-less row is invisible there, and no shed\'s closing count reflected the sale either. Two changes. The bird sale form now has a "Shed (birds sold from)" box, listing the sheds that flock is actually in — its allocations plus anywhere it has been transferred into — and the culls are written onto THAT shed\'s record; where the day has no record yet, the one created is created on the shed. Leave it blank and the old flock-level behaviour is kept exactly, which is why the 225 bird sales already entered are untouched rather than being given a shed by guesswork. And Bulk Daily Entry now shows the day\'s bird sales above the grid — how many, female and male counts, and which sheds — with a warning naming how many carry no shed, so what has already been deducted is visible whichever way it was recorded. The Cull columns still mean "culls NOT sold through NHE": entering a sold bird there as well still double-counts it.' },
  { date: '2026-08-18', tag: 'Fix', text: 'Following the Flock 19 stock register fault, EVERY query in the app was audited against real row counts rather than guesses. Only Flock 19 crosses the 1,000-row reply limit on its own (1,681 daily rows), but with NO flock selected the register read all four flocks at once — 3,097 rows — so it went blind after 15/12/2025 for everybody, not just Flock 19. Seven more places were reading short and are now paged: Feed Mill\'s feed reconciliation, which compared feed SENT against feed RECORDED while reading the whole daily records table with no filter, so the farms appeared to use less than they did; Daily Entry\'s "export all records", which handed over the first 1,000 of a flock\'s history under that name; Flock Comparison, which judges whole flock LIFETIMES — and the oldest flock, the one with the most history, is exactly the one that gets cut; the flock feed-cost breakdown; the VHL egg register; the flock medicine list; the medicine balance totals, where a short read OVERSTATES what is left in stock; and the stock ledger movements. Tables big enough to matter, measured: attendance_daily 12,028 rows, stock_ledger 3,975, daily_records 3,097, feed ingredients 2,878, sales register 2,291, VHL daily 1,583, daily feed 984, cash book 819. The rest are correct today only because their tables are still small, and are on the pending list to be paged before they cross rather than after a wrong figure is noticed.' },
  { date: '2026-08-18', tag: 'Fix', text: 'HE Dispatch → Daily Stock Register stopped showing egg figures part way through a flock. Flock 19 has daily records from 23/06/2025 to 03/07/2026 in All Flock Data, but the register carried figures only to 17/01/2026 and then showed days with no eggs at all. Nothing was missing from the data: the register read the daily records with a plain request, and the server returns at most 1,000 rows to one of those and says nothing about the rest. Flock 19 holds 1,681 rows — 4 sheds across 350 days — and the 1,000th falls on exactly 18/01/2026, the first blank day. 682 rows over 141 days were never read, so production looked like it had stopped while dispatches kept coming off the balance. All four reads behind that tab (production, dispatch lines, opening stock and egg conversions) now page through everything. The same cap was found on the feed cost behind Flock P&L, which reads one flock\'s daily records — a MONEY figure understated with nothing on screen to show for it — and that now pages too.' },
  { date: '2026-08-18', tag: 'Fix', text: 'EDITING a saved flock transfer changed the transfer row and nothing else. Adding one deducts the birds from the source shed\'s daily record and moves them between the two sheds\' allocations, and deleting one reverses both — but an edit left every one of those figures at its ORIGINAL value, so correcting a bird count, a date or a shed on a transfer already saved left the sheds wrong with nothing on screen to say so. The most dangerous case was the quiet one: fix a typo from 7,000 to 700 and the shed still reads as if 7,000 birds had left it. An edit now takes the OLD figures back out and puts the new ones in, by the same path add and delete already use — and because the reversal reads the transfer as it stood before the save, changing the DATE or the SHEDS is handled too, not just the counts. One more thing that had been silently doing nothing: ticking "Final Transfer" while editing now sets the flock to laying and records the laying farm and start date, which only ever worked when the box was ticked on the original entry.' },
  { date: '2026-08-18', tag: 'Fix', text: 'A shed-to-shed transfer moved the birds on paper but never told the app where they had gone. Flock 23 moved out of shed 10 into sheds 12, 6 and 5 on 17/08/2026 — and Bulk Daily Entry still offered only sheds 10 and 11, so yesterday\'s production could not be entered against the sheds the birds are actually in. Recording a transfer wrote the transfer row and correctly deducted the birds from the SOURCE shed\'s daily record, but a shed only became part of a flock through a manual Shed Allocation entry, which a transfer never made. Two changes: a transfer now moves the birds between the two sheds\' ALLOCATIONS as well — added to the destination, taken off the source — and Bulk Daily Entry now counts every shed a flock has ever been transferred into, so past transfers are covered without re-entering anything. Deleting a transfer puts the birds back on both sides. Flock 23 is corrected: sheds 12, 6 and 5 now hold 7,704, 7,686 and 6,432 females, shed 10 is down to 6,419 and shed 11 to 8,644 — the flock total is unchanged at 36,885 females and 4,426 males, because the birds moved rather than appeared. One trap found while doing it: shed 10 had been allocated in two goes (22,538 birds, then 1,208), and taking 17,327 off only the newest of those floors it at zero while the older row keeps claiming a full shed — the reduction now works back through every allocation row for that shed. Flocks 20 and 22 have transfer destinations with no allocation too, but they already hold 700 and 484 daily records on those sheds, so their history is intact and they were deliberately left alone; the widened shed list reaches them anyway.' },
  { date: '2026-08-18', tag: 'New', text: 'Tasks now carries a DEVELOPMENT type, and everything still outstanding on the app is loaded into it — 13 items, each saying plainly whether it waits on you or on me: the shed line-wise boxes (A/B/C/D), the L1-L5 to BRE 1 / BRE 2 feed mapping, the 5 flagged rows in the breed standards sheet, the empty Manpower Requirement master, body weights for the remaining flocks, Flock 23\'s laying season, the 394 hatch batches with no dispatch linked, the missing chick rate, the deferred vaccine negative balances, the 40 Degree -22 kg gap, the plan-versus-actual screen that does not exist yet, the first real use of Physical Stock Audit, and 4 backup tables with no policy. Until now that list lived only in a chat transcript, which meant scrolling to answer "what is left?" — and a transcript ages while the work moves on, so the honest answer got harder to give every day. In Tasks it has status, priority, due dates, the dashboard widget and the header badge like any other task, and it stays true because items are ticked off as they ship. Development tasks are ADMIN ONLY, and that is enforced by the database itself, not just hidden on the page: another user cannot read, create, edit or delete one even by asking the server directly, and the type does not appear in their dropdowns at all.' },
  { date: '2026-08-18', tag: 'Fix', text: 'CEVAC IBIRD stock read 75,000 doses when 2,500 were left. Items Master turned out to be clean — ONE CEVAC IBIRD (code IBIRD, Vaccine, Dose), four purchase spellings all registered as aliases pointing to it, one medicine master entry: no duplicate and nothing left behind by a merge. The fault was a single usage entry, 72,500 doses on 30/06/2026 for Flock 20, which had never been linked to the Items Master item — 5 of the 6 CEVAC IBIRD usages carry that link, that one did not. A usage takes BOTH the item and its NAME from that link when it writes to the stock ledger, so with the link missing the movement was written with no name at all and came off nothing: the doses were used in the shed and still sat in stock on the screen. That is also the blank line that appeared at the top of the Stock Ledger item list. The link is now set and the ledger row repaired itself — CEVAC IBIRD reads 2,500 doses, 177,000 in against 174,500 out, and no blank-named movement remains anywhere in the ledger. Nothing was invented: the usage always named the vaccine, only the link behind it was absent.' },
  { date: '2026-08-17', tag: 'Fix', text: 'Inventory → Stock Ledger: typing a name in "Search & Select Item" and then tapping it showed NOTHING — no movements, not even the "no movements found" message — while picking the same item straight from the list worked. The search box and the list were two separate controls, and on a phone the tap that follows typing only moves focus into the list: it paints the highlight over the name without registering a choice, so the app still believed no item was selected. It is now the same picker used everywhere else in the app — one box, type and tap. Two faults in the list itself went with it. An item recorded both with and without its master link appeared TWICE under identical wording, each entry showing only half its movements (Selvo BH and Toxfin 360 Dry are both like this); and where one item had been written two ways — 4 items are — only the first spelling appeared and the second could not be found at all, though 160 spellings map to 155 real items. Rows now fold onto the master item by link, or by name or alias ignoring spacing and punctuation, the same way Stock Balance already does, so one item is one line in the list and shows every movement it has. Searching by any of an item\'s other names finds it too.' },
  { date: '2026-08-17', tag: 'New', text: 'Inventory → PHYSICAL AUDIT: a home for the stock count itself, for every category — feed ingredients, medicines, vaccines, packaging, spares, the lot. Until now the only way to correct a balance was Inventory → Adjustments, which asks for the DIFFERENCE against TODAY. That is the wrong question to put to somebody who has just walked the store with a weighing scale: they know what they COUNTED, on the day they counted it, and the book figure to compare against is the one that stood on that date, not the one standing now after another fortnight of production. So the audit asks for the counted quantity, works out the difference itself against book stock AS ON the audit date, and values it at the WEIGHTED AVERAGE rate of everything received up to that date rather than whatever the last lorry happened to cost — a shortage built up over months should not be priced by one odd purchase. Posting writes one stock adjustment per differing item, dated to the audit date, and raises the shortage as a farm expense SPLIT ACROSS THE FLOCKS in proportion to the feed each received during the audit period, so the missing stock lands in flock cost instead of disappearing. Excess corrects the ledger only — it is not written back as a credit to any flock, which would flatter the flock for a counting error. An item left blank is ignored rather than read as zero; a count can be saved as often as you like before posting; and Unpost takes the corrections and the expense entries back out again if the count was wrong. A posted audit keeps the book figure it was posted against, so the record does not drift away from the correction it produced. Where no feed moved in the period there is no share to work from, so the shortage stays at farm level rather than being guessed onto a flock.' },
  { date: '2026-08-17', tag: 'Fix', text: 'Feed Mill: 8,62,210 kg of ingredients were consumed by real production but never came off stock — 921 ingredient lines across 34 batches (April 4, May 2, June 7, July 19, August 2), about 61% of everything the mill has used since April. The trigger that posts consumption to the stock ledger caught its own errors and carried on with a warning nobody reads, so a production that failed to post still saved and nothing looked wrong; the same trigger had already been repaired once before for never firing at all. Every missing line is now written, each dated to its OWN production date so month-end figures stay comparable and marked "Backfilled 17/08/2026" so it can be told apart in the ledger. Consumption and stock movement now agree exactly — 14,16,849 kg both sides, 0 lines missing, 0 batches disagreeing. Only one ingredient went negative afterwards (40 Degree, −22 kg), which is a purchase-side gap rather than a production one; had the backfill been wrong, dozens would have. From now on a production that cannot post its consumption REFUSES to save and shows why, instead of saving silently wrong — an editing path that used to lose consumption when a batch was changed also writes the missing row rather than doing nothing.' },
  { date: '2026-08-17', tag: 'Fix', text: 'Inventory → Stock Ledger: "Search & Select Item" was missing items. The list is built by reading every ledger row and collecting the distinct items, but the request stopped at the server\'s 1,000-row cap while the ledger holds 2,645 — so any item appearing only in later rows was absent from the dropdown and could not be opened at all. It now pages through the whole ledger. Feed Mill\'s production log, produced-feed totals and transfer totals were paged at the same time: 104 batches is under the cap today, but a season\'s entries will pass it, and the failure is silent when it comes.' },
  { date: '2026-08-17', tag: 'Fix', text: 'Three bills that were already paid kept showing as Pending — Healers Associates ₹1,75,000 (HAP/26-27/48, GRN 2446), More Than Solutions ₹1,17,000 (589/26-27, GRN 2743) and We Care Animal Health ₹72,000 (WAH0712627, GRN 2810), ₹3,64,000 of payables that did not exist. Cause: a supplier merge or rename left the bill\'s own vendor name in a different LETTER CASE from the party record — "HEALERS ASSOCIATES" against "Healers Associates". Bills are matched to GRNs on the vendor name as plain text, so the two spellings behaved as two different suppliers: one bill was paid, its twin sat open for ever. The phantom rows are removed — only rows with NO money against them whose twin carried the full payment, so nothing settled was touched — and every surviving bill\'s vendor name is now set to match its party record, so Party Ledger and statements stop splitting one supplier in two. The Duplicate Bills panel and the matching behind it now ignore letter case, which is what hid these in the first place: two earlier scans reported "no duplicates" because they compared names exactly. Venco Research was checked too and is clean — all its bills are Paid with advances adjusted in full.' },
  { date: '2026-08-17', tag: 'Fix', text: 'Editing a GRN\'s number after it was saved created a SECOND bill in Pending Payments instead of updating the first — the original, often already paid, stayed behind as Pending and inflated what the farm appeared to owe. More Than Solutions had exactly this: two rows for GRN 2743, one Paid with the ₹1,17,000 bank debit attached and one Pending for the same ₹1,17,000. The cause was that a bill is matched to its GRN by (vendor + GRN NUMBER), and changing either half makes the app find nothing to update, so it inserts a new row. Now a change to a GRN\'s number or vendor MOVES the existing bill to the new number first, and the normal update then lands on it. Guards: the bill only moves when no other GRN line still uses the old number, and if a bill already exists under the new number the old one is removed only when it holds no money at all — a row carrying a payment or an adjusted advance is never destroyed by an edit.' },
  { date: '2026-08-17', tag: 'New', text: 'Pending Payments now shows a DUPLICATE BILLS panel at the top whenever one vendor has more than one bill for the same GRN, or for the same invoice and amount under different GRN numbers. Each group lists its rows with what has been settled against them, and offers "Remove this one" only on a row holding NO money while a sibling holds some — so the row with the payment, the bank link and the history can never be deleted by mistake. If neither row is paid it says so and leaves the decision to you rather than guessing. The panel disappears when there is nothing to fix, and it reads rows already on screen, so it costs no extra loading.' },
  { date: '2026-08-17', tag: 'Improved', text: 'Payment Planning: a saved plan can now be OPENED and PRINTED. Saving a plan previously recorded it and showed only a date, title and total, with no way to see which bills were in it — half a feature. Click any row under Saved plans to see every bill in that plan (vendor, invoice, balance due, planned, still owed) and Print it on the company letterhead. The printed sheet uses the figures AS SAVED on that date, not today\'s balances: a bill paid since then still shows what was planned, which is the whole point of keeping the plan. The one exception is the bank balance line, which is today\'s — the plan never stored a balance, and inventing a historical one would be worse than showing the current figure.' },
  { date: '2026-08-17', tag: 'New', text: 'Employees → Manpower Requirement: a new master for how many people each SITE should have, by designation and gender. Nothing in the app held this before — it knew how many helpers there are, never how many are needed, so "short by two" could not be asked. Required is typed once per site and role; ACTUAL is counted live from the employee records rather than typed a second time, so there is one number to keep up to date instead of two that can disagree. Gender is optional: a requirement with no gender counts everyone in that designation, for roles the farm does not split male/female. Monthly Attendance now reads this master and shows Male Helper and Female Helper as actual / required with the shortfall in red; sites with no requirement set still show plain counts rather than implying a target of zero.' },
  { date: '2026-08-17', tag: 'Fix', text: 'Employees → Monthly Attendance showed "Male Helper: 0, Female Helper: 0, Helper gender not set: 206" — every helper looked ungendered when the records were perfectly fine. The page simply never fetched the gender column, so the split had nothing to read. It does now: the real figures are 112 male and 94 female helpers. Daily Attendance also gained an ALL SITES view — the site was previously required before anything appeared, so present and absent across every site together could not be seen at all; leaving Site blank now shows every employee, and the summary counts cover the lot.' },
  { date: '2026-08-17', tag: 'Fix', text: 'Payment Planning → Print: the printed Daily Payment Details sheet still showed each bill\'s FULL balance after part payments were introduced, so a sheet handed over for approval would have said ₹10,07,800 next to a transfer of ₹10,00,000 — the surest way to pay a bill twice. The sheet now prints Invoice Amount, Balance Due, PAYING NOW and, whenever any row is part-paid, a Still Owed column and a "Still Owed After These Payments" line under the totals. Discount / TDS on the sheet is now everything NOT being paid against that invoice today — the bill\'s own TDS and discount plus anything held back by planning less than the balance — so the row still adds up. Manual items print their gross and deduction the same way instead of one unexplained figure.' },
  { date: '2026-08-17', tag: 'New', text: 'Employees → Monthly Attendance now carries the same summary Daily Attendance shows, for the whole month: Present, Absent, Half Day, Week Off, Full OT Day and Not marked, plus how many employees × days are counted so far. Future days are deliberately left out of "Not marked" — a day that has not happened yet is not an omission, and counting it would put a permanent red figure on every month in progress. Beside it, Male Helper and Female Helper counts for the selected site, taken from the designation and gender already on each employee record rather than a second list to maintain; helpers with no gender recorded are shown separately instead of being quietly dropped into one side or the other.' },
  { date: '2026-08-17', tag: 'New', text: 'Payment Planning: PART PAYMENTS. Ticking a bill used to plan its whole balance with no way to pay less — planning ₹10,00,000 against a ₹10,07,800 balance was impossible except by writing the ₹7,800 off as a discount, which said you no longer owed it. Each selected bill now has a Plan ₹ box (defaults to the full balance, and cannot exceed it), a per-bill Disc box, and a Still Owed column. Paying part leaves the bill PARTIAL with the remainder genuinely owed — ₹7,800 stays on the books and appears in the next plan. Two supporting fixes came with it: the page now also loads Partial bills, which it did not before, so a part-paid bill cannot vanish from planning; and paid_amount and discount now ACCUMULATE, so a bill paid in two instalments shows the total settled rather than only the latest one. Discount is entered per bill instead of one figure split evenly across everything selected — that old behaviour put a share of the discount on rows it never belonged to, and the single box now only applies to bills where no per-bill discount was typed.' },
  { date: '2026-08-17', tag: 'New', text: 'Payment Planning: manual items now record GROSS − DEDUCTION = NET with the reason, and the arithmetic is shown as you type rather than done in your head before entering a single figure. Existing manual items keep working unchanged — their gross was filled in as their amount, since they were entered with no deduction. Also added: per-vendor subtotals for the current selection (bills, balance due, planned, still owed), so several bills for one vendor no longer have to be added up by eye before making a transfer; and SAVED PLANS — "Save Plan" keeps what was intended to be paid on a date, which previously lived only on screen and was lost the moment the page closed. Saving a plan pays nothing; Mark Paid still does that.' },
  { date: '2026-08-17', tag: 'Fix', text: 'Flock Weekly Performance: the page showed "No weekly weights recorded yet" while the rows were sitting in the table, and then showed a dash under Standard once they appeared. Two separate faults, both mine. First, the page asked the database to return each weekly row WITH its flock attached, and that kind of join needs a foreign key — the table was created without one, so the request failed outright and the empty result was displayed as "no data" rather than as an error. The page now joins the flock in the browser from a list it already holds, and the foreign key has been added as well, so deleting a flock takes its weight history with it instead of leaving rows no screen can reach. Second, the standard was being looked up by the flock\'s LAYING season even for a one-week-old chick. For weeks 1-24 the book\'s tables are chosen by the season the chicks were BROODED in — Summer Feb-Jul, Winter Aug-Jan — which the app now works out from the placement date, so nobody has to type it; from week 24 the laying season applies as before. A flock with no laying season set still shows a dash from week 24 onward, because guessing between two different books would put a wrong target beside real weights.' },
  { date: '2026-08-17', tag: 'Improved', text: 'Flock Weekly Performance now carries MIN and MAX body weight beside the average, matching the farm\'s own weekly body weight register, which records the spread rather than a uniformity percentage — a flock averaging 151 g with birds from 99 g to 212 g is a different flock from one averaging 151 g with everything between 140 and 160. Weekly GAIN is shown too, worked out as the difference from the previous week RECORDED for that flock and sex, and set beside the book\'s standard gain. Gain is deliberately NOT stored as its own figure: it is already implied by two weeks of weights, and keeping a third number would let it disagree with them. Flock 23 week 1 (13/08/2026) is loaded from the register as the first entry — Female 151 g against a 140 g standard, min 99 max 212; Male 176 g against 140 g, min 115 max 239. Its gain shows a dash because there is no week 0 in the app yet; the 46 g day-old chick weight can be added as week 0 if you want gain from the first week onward. The register\'s own STD column (140 g body weight, 100 g gain, 23 g feed) matches the Venco figures already loaded exactly — checked before importing.' },
  { date: '2026-08-17', tag: 'New', text: 'Flock Weekly Performance — a new page under Flock Management for the figures the app has never held: weekly BODY WEIGHT, birds weighed, uniformity % and CV per flock, shown against the Vencobb430 standard for that age (Summer or Winter by the flock\'s laying season, and the single male curve for males). This is what the Monthly Production Review has been listing as deliberately absent — body weight, gain, uniformity and CV had nothing to report from, because no screen in the app recorded a bird weight. Fill the Excel Template (Flock No · Sex · Age in weeks · Week Ending · Avg Body Weight · Birds Weighed · Uniformity % · CV % · Remarks) and Import; only Flock No and Age are required and blanks stay blank rather than becoming zero. Re-importing the same flock-week OVERWRITES that week instead of adding a second row, so a corrected sheet can simply be sent again, and flock numbers match with or without the "F-" prefix. Each row shows actual against standard with the difference in grams and as a % of standard, plus a chart of the two lines. Birds Weighed is recorded on purpose: an average from 20 birds is not the same as one from 200, and a screen that hides the sample size invites treating them alike. Feed is NOT entered here — it is already recorded daily under Daily Entry, and a second copy would give two answers to one question.' },
  { date: '2026-08-17', tag: 'Improved', text: 'Hatch Batches: on a NEW batch, STD Hatch % now fills itself from the Vencobb430 standard as soon as the flock and setting date are known, and Std Chicks follows from it. Existing batches are never touched — the auto-fill runs only when adding, and only into an empty box, so all 394 batches already entered keep exactly the figure they were saved with, and editing one leaves its percentage alone. The standard for that flock\'s age and season is shown beneath the field either way, in green when your figure matches and orange with the exact gap when it does not.' },
  { date: '2026-08-17', tag: 'New', text: 'Vencobb430 breeder standards are now IN the app — 201 rows under HE Rate Register → Breed Standards: body weight, weekly gain, feed per bird per day, feed type and nutrients for brooding/growing and laying, plus egg weight, egg mass, chick weight, fertility %, hatchability % and hatch-of-fertile % for laying females, each split Summer and Winter. Male standards are stored once under season "Both", because the book states the same male body weight standards apply to both seasons — two copies would only drift apart. Venco Tables 5 and 9 describe the same weeks of the same birds, so they are merged into one row per week rather than stored twice (287 printed rows became 201 stored); Tables 7 and 8 are NOT duplicated here since production performance already lives in the STD Production Curve tab. Blanks in the source book stay blank rather than becoming zero — week 24 of the laying tables has no chick or hatch figures because laying has barely begun, and a zero there would be read as a real standard of nothing.' },
  { date: '2026-08-17', tag: 'Improved', text: 'Hatch Batches: the form now shows the Venco hatchability standard for that flock\'s AGE and laying season beside STD Hatch %, with a "use this" link when the box is empty. It suggests, never overwrites: the hatchery report stays the authority and a figure you type is kept, with the difference from standard shown in orange so a real disagreement is visible. Why it is safe to offer: measured across all 394 existing batches, the STD Hatch % being typed by hand ALREADY matched the Venco standard to within 0.23 of a percentage point on average — F-19 typed 87.91% against a standard of 88.06%, F-20 typed 88.00% against 88.35%. So this saves typing and removes the risk of reading the wrong week, rather than changing any figure. Worth seeing next to it: actual hatch is running 81.45% on F-19 and 79.77% on F-20 against those ~88% standards, a shortfall of 6.6 to 8.6 points that dwarfs the 0.5-1.5 point spread between hatcheries.' },
  { date: '2026-08-16', tag: 'New', text: 'Cull Bird Rate Register — a new page under Flock Management, right below HE Rate Register: the daily cull bird rate in ₹ per kg, with date, rate, remarks, a rate-over-time chart, and latest / average / highest / lowest tiles for whatever range is on screen. Deliberately DAILY, not weekly like the HE register: the Association declares one HE rate a week (Sun-Sat) but cull rates move day to day, so the day is the unit here. One rate per day is enforced — adding a second rate for a date that already has one is blocked with a message pointing at Edit, so there can never be two answers to "what was the rate that day". The Change column compares each day against the previous day RECORDED, not against yesterday, because a day with no entry is simply absent rather than carried forward as if the rate had held.' },
  { date: '2026-08-16', tag: 'New', text: 'HE Rate Register → Vendor Rates: rate rules that vary by FLOCK AGE, added for the Hitech agreement — (Association − 1.50) less 35% while a flock is young, and (Association − 1.50) from 30/1 onward. The dispatch form now prices a line from the flock\'s age on the PRODUCTION date, the same date the Association week is read from, so both halves of the price describe the same eggs. The order of the two parts matters and is fixed: the differential first, the percentage second — on ₹25.75 that is 25.75 − 1.50 = 24.25, less 35% = ₹15.76, where doing it the other way round would give ₹15.24 on the very same numbers. Ages are entered in the farm\'s own week/day notation (29/7, 30/1) and stored as days from placement, since week/day notation is ambiguous about which end it counts from. Overlapping age ranges for one vendor are blocked at save, because two rules covering the same age would make the price depend on which row was read first. Nothing already invoiced changed: every existing dispatch is from a flock well past 30/1, so the regular tier applies and it equals the −1.50 that was already in use. A vendor with no age tiers still uses the flat differential exactly as before.' },
  { date: '2026-08-16', tag: 'New', text: 'HE Rate Register: the Association rate is now filled in for every week from 24/08/2025, imported from the farm\'s daily rate sheet — 52 weeks in place, running unbroken to 16/08/2026 with no gaps and no overlaps. The sheet held 302 DAILY rates, but it was weekly all along: all 20 rate changes in it start on a Sunday and every run is a whole number of weeks, matching the Sun-Sat week the register is built around, so it collapsed to 44 weekly rows with nothing averaged — no week in the sheet carried two different rates. The 9 weeks already entered by hand (21/06/2026 onwards) were NOT overwritten; the one week that overlapped carried the same ₹22.25 already saved, and it was skipped rather than rewritten. Five HE dispatches in early June 2026 previously fell in weeks with no rate at all and so had no suggested rate on the dispatch form; every one of the 26 dispatches now has a register rate behind it. The imported weeks carry the remark "Imported from daily HE rate sheet" so they can be told apart from hand entries, and their Declared date is deliberately left BLANK — the sheet does not record when each rate was declared, and inventing a Friday for 43 weeks would have put made-up dates beside the real ones.' },
  { date: '2026-08-16', tag: 'New', text: 'Hatch Batches and Hatch Analysis: filter by FLOCK AGE BAND at setting (under 30 / 30-39 / 40-49 / 50-59 / 60+ weeks) and by SEASON the eggs were set in (Summer Mar-Jun, Monsoon Jul-Oct, Winter Nov-Feb). Both matter because they separate a hatchery problem from a fact of nature: fertility falls as a flock ages, and hatchability falls in the heat, so a hatchery judged across a whole year can be blamed for either. The season is taken from the SETTING MONTH, not from the flock. The app already stores a laying season on each flock (F-19 Summer, F-20 Winter) but that is a property of the bird flock, used to pick the Venco standard curve — with two flocks, filtering on it would only repeat the flock filter, while what actually moves hatchability is the weather the eggs were set in. Every season label names its months so there is no guessing where the lines fall. Flock age is measured from the placement date; a batch whose flock has no placement date drops out while an age band is selected rather than being quietly parked in the first band. Both filters combine with flock, hatchery, date range, search and below-standard, and the line under the page heading names every filter in force.' },
  { date: '2026-08-16', tag: 'New', text: 'Hatch Batches: filter by HATCHERY, search by setting / invoice / DC number, and a "Below standard only" tick — alongside the flock and setting-date filters. All of them narrow the same set at once: the table, the TOTAL row, the five tiles, the Hatchery Comparison and the Excel export, so a filtered figure can never sit beside an unfiltered one and an exported sheet always matches the screen. The hatchery list is built from the BATCHES rather than from Masters → Hatcheries, so a batch carrying only a typed hatchery name — entered before the dropdown existed, or imported with a name that matched nothing — can still be filtered to and shows as "(typed)"; a hatchery you cannot select is a hatchery you cannot check. The search box covers setting no, invoice and DC together, because those are the three numbers a hatchery quotes when it rings about a batch. "Below standard only" leaves just the batches that hatched fewer chicks than the STD Hatch % expected — batches with no hatch report yet drop out, since a batch that has not hatched cannot be judged. The line under the heading spells out every filter in force and how many batches are left out of the total. Hatch Analysis gained the same hatchery filter, so the two pages can be set to the same view.' },
  { date: '2026-08-16', tag: 'New', text: 'Hatch Analysis — a new page under Flock Management answering why a hatch was good or bad, and whose result it is. Every egg set ends in exactly one of five places (broken in transit, infertile, blaster, unhatched, hatched) and which one decides who can fix it: infertile is the breeder flock, unhatched is incubation and the hatchery\'s own result, broken is transport, blasters are handling and storage. Five tabs, all sharing one flock filter and setting-date range: Flock-wise (Std against actual chicks, plus where every egg went); Hatchery-wise (the same split per hatchery, with a plain-language verdict naming who is worst on UNHATCHED and what the gap costs in chicks); Week-wise (hatch % by setting week against the standard with infertile and unhatched alongside, so a dip with flat infertility reads as an incubation week and a dip with rising infertility reads as an egg week); Egg Age; and Money. The important one is Like-for-like on the Hatchery tab: hatcheries do not all get the same eggs, so it compares them on ONE flock\'s eggs and prints both spreads — on the current data the headline puts 1.5pp between best and worst hatchery, but on the same flock\'s eggs that shrinks to 0.5pp, meaning most of the apparent difference is which eggs each hatchery received, not how they ran them. Ranking on hatch % alone would have blamed the wrong hatchery. Egg Age is built but cannot draw yet: the laying date lives on the HE dispatch and NONE of the 394 batches is linked to one, so instead of a chart from nothing the tab says exactly that and how to switch it on. Money asks for your chick rate rather than inventing one — none of the batches carries a Chick Rate — then values each loss by who owns it.' },
  { date: '2026-08-16', tag: 'Fix', text: 'App-wide: figures that were quietly built from part of the data are now built from all of it. The Hatch Batches page was reading 200 of 395 batches; that turned out to be one instance of a pattern, so every page was audited against measured row counts. The trap is that the server returns at most 1,000 rows per request whatever the app asks for, so .limit(50000) is not "everything" — it is 1,000, with no error. Fixed and verified: Feed consumption in the Company P&L and Production Usage in Inventory were each built from 1,000 of 2,359 ingredient-usage rows (a MONEY figure, understated); the Feed Dashboard\'s purchase total read 100 of 293 feed GRNs; the Feed report dropped 93 GRNs whenever no month was chosen; "Export to Excel → Daily Records", described as all flock daily production records, handed over 1,000 of 3,026 rows; VHL live bird counts read 1,000 of 1,583 daily entries, falling back to placement figures for whichever flocks sorted last; and the low-stock alert under-counted usage, which OVERSTATES stock on hand and keeps the alert quiet on an ingredient that has run out. The Dashboard production chart was bounded by row count rather than by date — 100 rows is only a few days once several sheds report daily, so its oldest bar showed a partial day as a full one; it now asks for the 30 days it actually draws. Pending receivables, farm expenses, electricity bills, tasks, egg conversions, generator logs, the PO link dropdown and the rate-history lists were all capped too and are now paged — most were not truncating yet at today\'s row counts, but every one of them grows every month.' },
  { date: '2026-08-16', tag: 'New', text: 'Hatch Batches: a setting-date range filter beside the flock dropdown, and a new Avg Std tile. From and To are both optional — a From on its own runs to the newest batch — and the range narrows EVERYTHING at once: the table, the TOTAL row, all five tiles, the Hatchery Comparison and the Excel export, so a filtered figure can never end up sitting beside an unfiltered one, and an exported sheet always matches the screen it was taken from. Avg Std is the standard those eggs were expected to deliver (Std ÷ total eggs set), placed next to Avg Hatchability, which is what they actually delivered, on the SAME base so the two can be read straight against each other — the gap between them is the shortfall against standard, and Hatchability turns orange when it falls below Std. The heading above the page now states how many batches the figures cover, and the total it was narrowed from.' },
  { date: '2026-08-16', tag: 'Improved', text: 'Hatch Batches: Avg Hatchability is now chicks hatched ÷ TOTAL eggs set — the farm\'s own definition, breakage included — reading 80.9% (80,17,227 chicks from 99,14,510 eggs). It was hatched ÷ hatchable eggs (setting − infertile − blasters), which measures the incubator alone by excluding eggs that were never going to hatch, and reads about nine points higher at 89.97%. The Avg Fertility tile is removed from the top of the page; Inf% remains on every row and in the totals line for anyone who wants it.' },
  { date: '2026-08-16', tag: 'Fix', text: 'Hatch Batches: Avg Fertility and Avg Hatchability both read 0.0% on a page holding 99,14,510 eggs. Neither card was calculating anything — they averaged the stored fertility % and hatchability % columns, which only the entry form ever fills in, so all 394 imported batches carried blanks and the average of nothing came out as zero. Both are now worked out from the summed counts, the same way the TOTAL row and Hatchery Comparison already do it, so a figure can never again depend on whether a row was typed by hand or imported: Fertility = (setting − infertile) ÷ setting = 94.99%, Hatchability = hatched ÷ (setting − infertile − blasters) = 89.97%. The Sale Chk column was blank on all 394 imported rows for the same family of reason — the import was built without that column even though the sheet carried a value on every row — which is also why Hatch % showed a dash throughout, since Hatch % is Sale Chk ÷ setting. Sale Chk is filled in on all 394 (Hatch % 81.96% against a standard of 87.93%).' },
  { date: '2026-08-16', tag: 'Improved', text: 'Hatch Batches: the "Std Chicks Hatched" tile was one label over two different figures — it showed the STANDARD (86,01,235) while its name said chicks hatched. It is now two tiles: Std Chicks (Standard) 86,01,235, and Chicks Hatched 80,17,227, the count the hatchery actually reported. The impossible-Std warning is also narrower. It used to fire whenever Std was above the chicks that hatched, which since STD Hatch % became the standard simply means the batch came in UNDER its standard — ordinary performance, true of 372 of the 394 imported batches, and a red alarm on nearly every row hides the rare real fault. A Std above the HATCHABLE eggs is still impossible and still warns in red before saving; falling short of standard now shows as a plain grey note saying by how many chicks.' },
  { date: '2026-08-16', tag: 'Fix', text: 'Hatch Batches Import could not read Excel DATE cells at all — the cause of hatch dates going missing and setting dates coming out wrong. The importer only understood dates typed as DD/MM/YYYY TEXT; a normal Excel date cell arrives as a serial number, which failed to parse, so every hatch date was dropped and every setting date fell back to today(). Measured on the 394-row import: 394 batches all landed on 16/08/2026 as their setting date, and exactly ONE row in the whole table had a hatch date. It now accepts all four shapes a spreadsheet produces — a real date cell, an Excel serial number, DD/MM/YYYY text and ISO text. Two related traps closed at the same time: a row whose setting date cannot be read is now SKIPPED and counted in the message instead of silently landing on today, so unreadable rows can never pile up on one made-up date again; and a hatch date EARLIER than its setting date is dropped and reported rather than stored, because that is the classic day/month flip — a sheet typed 05/10/2025 that Excel read as 10 May. The flip is reported, never guessed at: correcting it in the app would mean inventing a date the farm never wrote.' },
  { date: '2026-08-16', tag: 'Fix', text: 'Hatch Batches: Age@Prod was showing the same figure as Age@Setting (both 59w 3d on the Paridhi batch) because when a batch is not linked to a dispatch the code quietly fell back to the SETTING date — so a column meant to say when the eggs were LAID was silently repeating when they were SET, while Egg Age, from the very same missing data, correctly showed a dash. Age@Prod now shows a dash too. The production dates do exist in the app: Flock 20 had NINE dispatches in the three weeks before that setting date, every one carrying production dates on its header and its lines. What the app cannot know is WHICH of them 10,080 eggs came from — none of the nine matches that quantity, the batch carries no invoice number, and a 1,00,800-egg dispatch is routinely split across hatcheries and settings; those nine span 25/06 to 21/07 in production, so a wrong guess would move Egg Age by up to 27 days. So instead of guessing: the Link Dispatch Invoice dropdown now lists that flock\'s dispatches from the three weeks before the setting date FIRST, marked with a star, each showing its date, invoice, egg count and production-date range, so picking the right one takes a second; and a batch links itself only when there is nothing to guess — exactly one dispatch of that flock, on or before the setting date, whose quantity equals Received. Two candidates or none and it stays blank and tells you what is missing.' },
  { date: '2026-08-16', tag: 'New', text: 'Hatch Batches: the Stg×STD% column is replaced by Actual Std, and an impossible Std is now caught at entry. Stg×STD% had become a duplicate — it was Setting × STD Hatch %, which is exactly what Std is now, so the same figure appeared twice (8,525 and 8,525.2 on the Paridhi batch). In its place is Actual Std = Hatched − Culled − Rejects, the chicks the hatchery\'s own report accounts for, shown in red when it falls short of the Std your STD Hatch % implies — on that batch, 7,413 actual against 8,525 expected. The warning: Std cannot be more chicks than eggs that hatched, and the form now says so before you save, in red, with the arithmetic spelled out — setting − infertile − blasters − unhatched — and the percentage that WOULD be right on the setting-eggs base. It warns, it does not block: hatchery sheets sometimes disagree with themselves and refusing the save would only push the figure into somebody\'s notebook, so it asks you to confirm and then saves what you entered. The Excel import runs the same check; it cannot stop and ask, so it imports the rows and then tells you how many carry an impossible Std instead of leaving it to be found in the table weeks later.' },
  { date: '2026-08-16', tag: 'Fix', text: 'Hatch Batches: the STD-Sale column was the subtraction the wrong way round and is now Sale Chk − Std, renamed Sale−STD so the heading matches the formula. It was Std − Sale Chk, which showed a shortfall as a POSITIVE number — chicks you did not receive read like chicks in hand. Now a negative means short received against what the STD Hatch % expected and is shown in red; a positive means more chicks than expected. On the Paridhi batch it reads −905 instead of 905. The Excel export column is renamed to match, so a sheet cannot carry the old sign under the old name.' },
  { date: '2026-08-16', tag: 'New', text: 'Hatch Batches: STD Hatch % now DRIVES Std Chicks — Std = Setting Eggs × STD Hatch % ÷ 100, on the setting-eggs base (Received − Broken). Until now the two boxes were unrelated: you typed the percentage off the hatchery report and the chick count did not move, because Std was still Hatched − Culled − Rejects. Std also re-derives if you correct Received or Broken afterwards, so a stale count cannot be left behind. Leave STD Hatch % blank and the old subtraction fills it in as before. Nothing is overwritten silently — if the report\'s own Hatched − Culled − Rejects disagrees with its percentage, both figures are shown under the field so you can see the difference and decide; type your own Std over it and yours is kept. The Setting×STD% column now uses your entered percentage too, falling back to the calculated Std ÷ Setting on older batches that have no entry. The Excel Template and Import carry a STD Hatch % column and apply exactly the same rule — percentage first, subtraction only when it is blank — so a sheet and the form can no longer produce two different Std figures from the same numbers, and Hatchery Name in an imported sheet is matched to Masters → Hatcheries (case and spacing ignored); an unmatched name is NOT invented as a new hatchery, it stays as text on the row so you can see it and correct it.' },
  { date: '2026-08-16', tag: 'Fix', text: 'Hatch Batches → Pipeline was empty even though eggs had gone out, and it was not a display fault: the tab listed HATCH BATCHES with no hatch report, so eggs only appeared once somebody had created a batch by hand, and nobody had. Measured before changing anything — 26 dispatches, 16,40,109 eggs between 01/06/2026 and 15/08/2026, not one of them with a hatch batch, and only ONE hatch batch in the whole database. The Pipeline now starts from the HE DISPATCH, so eggs appear the moment they leave the farm. It has two groups: "Awaiting hatch report", which lists dispatches to a hatchery ticked as sending reports, with days since dispatch going red past 25 days; and "Hatchery not assigned", because at loading time nobody yet knows which hatchery the lorry is going to — you set it from the row when you know, and until then the eggs are visible rather than lost. "Enter Report" opens the batch form already linked to that dispatch, with flock, invoice, eggs and date carried across.' },
  { date: '2026-08-16', tag: 'New', text: 'Hatch Batches: Hatchery is now a DROPDOWN reading Masters → Hatcheries, not a free-text box, on both the batch form and the pipeline. Typed text made two spellings into two hatcheries and made any comparison meaningless — the one existing batch reads "Paridhi Hatchery Dankuni", typed by hand. The old text is kept on existing rows and shown under the dropdown so nothing is lost. Masters → Hatcheries gains a "Sends hatchability report" tick box: only hatcheries ticked there are chased in the Pipeline, since reports come from one company only. No hatchery is named anywhere in the code — if that ever changes you tick a different row, and adding a new hatchery never starts chasing a report by accident.' },
  { date: '2026-08-16', tag: 'New', text: 'Hatch Batches → Hatchery Comparison, a new tab: one line per hatchery with batches, received, setting, broken%, inf%, blst%, chicks sold, Hatch%, STD Hatch%, Std, reject% and unhatch%. Percentages are recomputed from the summed counts rather than averaged across batches, so a 5,000-egg batch cannot weigh as much as a 50,000-egg one, and STD Hatch% is the egg-weighted average of the figures you entered. Batches entered before the dropdown existed are still listed, marked "typed, not linked" — edit the batch and pick the hatchery to fold them in.' },
  { date: '2026-08-16', tag: 'Fix', text: 'Hatch Batches: Std Chicks stopped overwriting what you type, and Hatch % now uses the right formula. The Std field was recalculated as Hatched − Culled − Rejects on EVERY keystroke in those three boxes, so a figure taken off the hatchery report was silently replaced the moment you corrected anything above it; and on saving, a Std of 0 — a total failure, a real figure — was treated as blank and replaced by the calculation. Now the calculation only fills the box until you type in it yourself; after that your figure is kept, with "Calculated would be N" shown underneath so a typo is still visible. Hatch % is now Chicks Sold ÷ Setting Eggs, the farm\'s own definition; it used to be Std ÷ (Setting − Infertile − Blasters), a different figure that never matched the hatchery\'s sheet. STD Hatch % is a NEW separate column that you type in from the report — the app never calculates it — and it appears in the table, the totals line and the Excel export.' },
  { date: '2026-08-13', tag: 'New', text: 'Inventory — date ranges added where they were missing. Stock Balance had only a single \u0022Stock as on\u0022 date, so Received and Used were running totals since the beginning with no way to ask what moved in a period; it now has a \u0022Movements from\u0022 date beside it, and with both set the row reads as a stock statement — Opening (everything before the From date, netted) · Received · Used · Adjust · Closing — instead of a lifetime total with a date applied to part of it. Leave \u0022Movements from\u0022 blank and the tab behaves exactly as before. Adjustments had NO date filter at all — every adjustment ever made, with no way to check what was adjusted last month when a stock figure looks wrong — and now has From and To. The other three tabs already had what they need and are unchanged: Stock Ledger and Consumption Report already had From/To, and Closing Stock Report is an as-on-a-date report by nature, where a range does not apply. The Stock Balance export filename now carries the period too.' },
  { date: '2026-08-13', tag: 'New', text: 'Feed Mill → Raw Materials Stock: added a From/To date range, so you can finally ask how much of an ingredient was RECEIVED and CONSUMED in a period instead of only seeing lifetime totals. Set the dates and the row becomes a proper stock statement — Opening (the stock before the period) · Received · Used · Closing (opening + received − used) — rather than a lifetime figure with dates applied to part of it, which would not have added up. Leave the dates blank and the page reads exactly as before. Two details worth knowing: the rate used for stock value is still taken from the most recent purchase even if that purchase was BEFORE your From date, otherwise an ingredient last bought in June would value at zero in a July view; and there is now a TOTAL line under the table with opening, received, used, closing and total value for the ingredients on screen. The Excel export carries the same columns and its filename carries the date range, so a period sheet cannot be mistaken for the full one.' },
  { date: '2026-08-13', tag: 'New', text: 'Employees → Salary Register: added an ESI / PF / PT filter, individually and in combination. The options are ESI, PF, PT on their own; ESI + PF, PF + PT, ESI + PT; all three together; any one or more; and — the useful one when reconciling a challan — NONE, showing everyone with no statutory deduction at all. It works on what was ACTUALLY DEDUCTED that month, not on who is registered: an enrolled employee with no paid days has nothing deducted and correctly does not appear, which is exactly the difference you want to see when a challan total does not tie out. Like the search and account filters it is applied in one place above everything, so the table, the TOTAL line, the Excel export and the printout always describe the same set of people, and the printout carries the filter name in its heading so a filtered sheet is never mistaken for the full register.' },
  { date: '2026-08-13', tag: 'Fix', text: 'Operations Board — Feed per bird was calculated wrongly and is now split by sex. It was dividing the COMBINED female and male feed by the COMBINED bird count, which matches neither: males and females are fed different quantities, so a blended figure describes no bird on the farm. It now shows Feed / ♀ / day and Feed / ♂ / day separately, each being the grams fed to that sex divided by that sex\'s bird-DAYS — the sum of its opening count across the days in the period — so a day with fewer birds counts for less instead of every day weighing the same. Also added Day-wise and Month-wise views to the board (the picker beside the heading, with a flock filter), showing eggs, HE, HD%, HE%, feed kg, feed per ♀ and per ♂, and mortality for each date or month, going back twelve months. They use exactly the same bird-days rule as the flock cards, so the views cannot quietly disagree with each other.' },
  { date: '2026-08-13', tag: 'Fix', text: 'Operations Board: Live Birds was wrong and disagreed with the Flock Dashboard and All Flocks Data. It read the latest daily record\'s opening female count on its own, which did two things wrong — it ignored the CLOSING count for the day (so it showed the birds at the start of the last recorded day, not the end) and it dropped every male bird entirely. It now reads v_flock_summary, the one place that owns the rule (closing, else opening, else total placed) and carries both sexes, so all three screens agree. The card also shows the female and male split rather than a single number, and mortality now reads as a share of the birds actually placed.' },
  { date: '2026-08-13', tag: 'New', text: 'Flock Management → Operations Board — a new page beside the Flock Dashboard, which is unchanged. One screen for every active flock: a strip of headline figures (active flocks, live birds, eggs over 7 days, HD%, HE%, cost per egg, cost per HE), a Needs Attention list, a card per flock, and a by-site table. TWO RULES run through it. First, EVERY deviation from the Venco standard is listed — nothing is hidden behind a threshold — ordered by how far off standard each one is, so the worst is always at the top and a small drift never buries a real problem; alongside those it flags dispatches with no invoice number, feed that cannot be priced, and flocks with no laying season. Second, where a figure cannot be computed honestly it shows a dash, never a zero: a brooding flock has no HD%, a flock with no laying season gets no bar and no target rather than an invented one, and cost per egg only starts with lay. Each percentage carries a bar with a marker at the standard for that flock\'s age, so a number is read against what it should be rather than on its own. Cost per egg is total direct cost ÷ total eggs; cost per HE is the SAME cost ÷ hatching eggs only, which is what a saleable egg actually costs since the JE, TE and BE eat the same feed. Salary and electricity are deliberately NOT in the per-flock cost — they are recorded per site and nothing says which flock they belong to, so they appear in the site table instead of being split into an invented number; for the complete cost including them, open a flock and use its Cost & Income tab.' },
  { date: '2026-08-12', tag: 'Fix', text: 'Free eggs given away on NHE Sales were never coming out of egg stock, so stock read higher than what was actually on the farm. The eggs leave the farm exactly like billed ones — they are simply not invoiced — and the app\'s own note in the code said so, but Reports → Egg Stock deducted only the billed quantity. Measured before fixing: 630 free eggs, all Flock 20, between 03/07/2026 and 03/08/2026 across 5 sales — 570 Table Eggs and 60 Jumbo Eggs, which is 0.50% of the 127,008 eggs billed on lines. Egg Stock now deducts billed + free. One trap was checked first and avoided: free eggs are stored in TWO places, on the sale header and on its lines, and on all 5 sales the header is an exact mirror of the lines — so adding both would have removed 1,260 eggs where only 630 left the farm, turning an understatement into a bigger overstatement. The rule (lines when a sale has them, header only when it does not) now lives in one shared function that every stock figure calls, so this holds for existing flocks and any added later instead of each report deciding for itself. HE Dispatch was checked too and was already correct — there, free eggs sit inside the Grade A/B/C quantities and have always been leaving stock.' },
  { date: '2026-08-11', tag: 'New', text: 'Receive Payment now supports a SPLIT receipt — part cash, part online — on HE Dispatch as well as NHE Sales. Tick \u0022Split this receipt\u0022 and enter the cash amount and the online amount; each part is posted separately, the cash part to the Cash Book and the online part to the Bank Ledger, so both are traceable on their own and the party\'s outstanding comes down by the full amount. The Amount field becomes the two added together and cannot be typed over, so the sale and the ledgers can never disagree. Until now HE Dispatch could hold ONE payment only, and recording a second one silently replaced the first — the modal clears the previous Cash Book and Bank entries before writing the new one, which is right when you are editing a payment but meant an earlier receipt vanished from both ledgers. That is why the second payment looked like it was not updating. Nothing already recorded needs re-keying: all 24 existing paid dispatches were carried into the new cash/online columns and reconcile exactly (23 by amount, 1 advance-adjusted which correctly stays at zero because its money sits in party advances, not in cash or bank). NHE Sales keeps working as before — it already had split cash/online on the bird-sale form; now its Receive Payment modal has it too.' },
  { date: '2026-08-11', tag: 'Fix', text: 'Searching in HE Dispatch crashed the page with \u0022(ne.dc_no ?? \u0022\u0022).toLowerCase is not a function\u0022. The search assumed DC No was always text, but a DC number that is purely numeric — as most are, especially from the Excel import — is stored as a NUMBER, and numbers have no toLowerCase. The same assumption existed in 43 places across 21 pages: NHE Sales, Employee List, Salary Register, CMS Export, Inventory, Bags, GRN, Masters, Feed Mill, Purchase Orders, TDS Payable, Invoice Register, Bank Ledger, Cash Book, Vendor Advances and more — every one would crash the same way the moment someone searched a field holding a number rather than text. All of them now convert the value to text before comparing, so a numeric DC no, invoice no, employee code or account number is searched exactly like a text one instead of breaking the page.' },
  { date: '2026-08-11', tag: 'Fix', text: 'Flock → Financial and Cost \u0026 Income: Print and Export now match what is on screen. Financial printed the LIFETIME totals no matter what date range you had set, and it still printed the old \u0022Partial Cost\u0022 line — so the printout left out feed, salary and electricity entirely and disagreed with the page you were looking at. It now prints the ranged figures with the period in the heading, the full cost breakdown down to Cost per Egg, and the HE Dispatch list with its total. Cost \u0026 Income had no print at all — the button did nothing on that tab. It now prints both tables, month-wise and day-wise, with the date range in the heading and the note about site salary and electricity carried onto the sheet so a printed copy cannot be read as this flock\'s own share. This applies to every flock: all flock pages are one screen, so the fix lands on all of them at once.' },
  { date: '2026-08-11', tag: 'Fix', text: 'Medicine cost was understated about 180 times over. Flock → Financial, the new Cost \u0026 Income tab, and Reports → Flock P\u0026L Summary all added up medicine_usage.amount — the amount stored on the row, which is only as good as the rate typed when it was saved. On Flock 20 that summed to Rs 1,816 against a real Rs 3,27,856. All three now price medicine the way the Flock Dashboard\'s \u0022Cost (Stock Rates)\u0022 figure does: quantity × the rate the item is actually valued at in stock (its most recent purchase, opening or adjustment price), falling back to the row\'s own rate only when the item has never been priced. They use the one shared helper, so the Dashboard and the cost reports agree by construction instead of being three near-copies that drift. If a medicine has no stock rate AND no rate of its own it still counts as zero — but the Financial tab now says how many entries that applies to, so it is visible rather than silent. Fix those by recording a purchase (GRN) or an Inventory opening/adjustment for the item.' },
  { date: '2026-08-11', tag: 'Improved', text: 'Flock → Financial: the unpriced-feed warning now explains itself. It used to say only \u0022no feed type recorded\u0022, which was not the whole truth. Feed can go unpriced for two different reasons: the day\'s row has no Feed Type filled in (common on older entries and imports), OR the feed type used has no costed formula behind it — a formula\'s cost per kg is built from its ingredients\' latest purchase prices, so a feed type with no formula mapped, or with ingredients that have never been purchased, prices at zero. The warning now says both, and names the feed types actually involved so you can see which one applies.' },
  { date: '2026-08-11', tag: 'New', text: 'Flock → Financial tab: added a date range and a TOTAL line on HE Dispatch. The From/To at the top now applies to EVERYTHING on the tab — Revenue, Cost and the dispatch table — so the cards and the table can never describe different periods (previously the dates filtered only the dispatch list while the cards stayed lifetime, which made them look inconsistent). Leave the dates blank for the whole life of the flock, or set them to see one month or one week. One rule worth knowing: chick cost is counted only when the placement date falls inside the range, otherwise a one-month view would read as though the birds had been bought again that month — when it is excluded the row says \u0022outside range\u0022 rather than showing zero. The HE Dispatch table now has a TOTAL line with dispatched, free and invoiced eggs, total amount, and an average rate (total amount ÷ total invoiced eggs, since each dispatch has its own rate and averaging the rates themselves would be wrong). If a range matches no dispatches the table says so.' },
  { date: '2026-08-11', tag: 'New', text: 'Flock Management → open a flock → new \u0022Cost \u0026 Income\u0022 tab, next to Financial, with a date range. Month-wise table: total eggs, HE eggs, egg value, actual sales, feed, medicine, expenses, chick, salary, electricity, total cost and COST PER EGG (on total eggs, as you asked, not per HE egg). Day-wise table below it with the costs that genuinely exist per day. Eggs are valued the day they are produced — HE at that week\'s rate from the HE Rate Register, other eggs at the latest rate actually achieved in NHE sales — so a day with production but no dispatch still shows what it earned; Actual Sales is shown beside it as money that really came in. Costs follow the batch: the day a flock moves to another site, that day\'s cost is the new site\'s. Two deliberate limits, both stated on screen. Salary and electricity are the WHOLE SITE\'s figures for the month, not the flock\'s share — attendance and power are recorded per site and nothing says which flock they belong to, so where two flocks share a site both show the same number rather than an invented split (electricity adds every meter/transformer on the site). And the day-wise table excludes salary and electricity entirely, because they are monthly figures and dividing them by days would put a made-up number next to measured ones — chick cost likewise appears on the placement day only, so it never distorts cost per egg.' },
  { date: '2026-08-11', tag: 'Fix', text: 'Flock → Financial tab was understating cost on EVERY flock. Medicine \u0026 Vaccine read 0.00 because it was reading medicine_monthly, a summary table that is not being filled, while your daily entries go to medicine_usage — which is why Flock Management → Dashboard → Medicine showed the right amounts all along. Feed Cost said \u0022See Feed Report\u0022 and Salary / Electricity said \u0022Allocated separately\u0022, and neither was in the total, so the bottom line read \u0022Partial Cost\u0022 and left out the single largest expense. All of it is now calculated: medicine from the real entries, feed as kg fed × the recipe cost per kg of the feed type used, salary and electricity as the site totals for the months the flock ran, and diesel, transport, bags and repairs broken out by category from Expenses. The card now shows Direct Cost, TOTAL COST and Cost per Egg. If any feed was recorded without a feed type it cannot be priced, so the kg involved is called out in amber instead of quietly vanishing from the total.' },
  { date: '2026-08-11', tag: 'New', text: 'Flock Management → HE Dispatch \u0026 Sales → Daily Stock Register: added a date range and a TOTAL line. The From and To date boxes now apply to this tab as well (they were only on the Dispatches tab), so you can look at a week or a month instead of the whole history. Important: the dates only narrow which days are LISTED — the running balance on each row is still built from the flock\'s entire history, so it never restarts at the From date and the opening on the first row shown is the real one. The TOTAL line adds up Production and Dispatched for the rows on screen, and the last column shows the net movement (produced minus dispatched) over the range. Opening and Balance are deliberately left blank on that line: they are the position of one flock on one day, so adding them down a column spanning several days and flocks would give a figure that means nothing — for closing stock, read the Balance on the most recent row. If a date range matches no days, the table now says so instead of showing the "add daily records first" message.' },
  { date: '2026-08-11', tag: 'Improved', text: 'Receiving a PO no longer creates a supplier either. It used to add the vendor to Suppliers automatically from whatever the PO carried, with the category defaulting to "Feed Raw Material" and no PAN and no TDS section — the two things TDS Payable and Pending Payments actually need. It now saves the receipt as normal and warns you that the supplier is missing, so it can be added properly under Purchase → Suppliers. Together with the PO Import change, no master is created as a side effect of a purchase any more: items, feed ingredients and suppliers are all added deliberately, in their own master, where their real details get set. Separately, PREVEXXION MAREK\'s Vac has been removed from Feed Ingredients after checking that no feed formula uses it, by name or by code, and that no feed production run consumed it.' },
  { date: '2026-08-11', tag: 'Improved', text: 'PO Import no longer creates items. Item Master is now the single source of truth: every item name in the imported file must be picked from Item Master before the PO can be imported, and the picker lists exactly what is there. The old "Keep as new item" checkbox is gone — it created the row on the spot with a guessed category of Feed Ingredient and unit Kg, which is how a vaccine (PREVEXXION MAREK\'s) ended up sitting in the feed raw material list where a feed formula could have picked it up. If an item in your file is missing, the import tells you which ones and stops; add them under Purchase → Item Master with their real category, unit, HSN and manufacturer, then reopen the import and they will match automatically. Names you link are remembered permanently, so a different spelling on a future import resolves to the same item instead of creating a duplicate. Related: receiving a PO no longer auto-creates a Feed Ingredient either. Previously it did so whenever the PO\'s Material Type read "Feed Raw Material", trusting that one dropdown; now it warns you that the ingredient is missing and leaves the decision to you — either add it in Masters → Feed Ingredients, or fix the Material Type on the PO.' },
  { date: '2026-08-11', tag: 'Fix', text: 'Medicine dropdowns were showing entries you had already merged or removed — "Sterile Diluent 30 ML" appeared twice, and medicines whose item no longer exists in Item Master stayed in the list. Two causes, both now fixed for good. First, the dropdown listed every Medicine Master row and never checked the linked item; it now hides medicines whose item has been deleted or deactivated, and shows only ONE entry per name, preferring the one linked to Item Master. It deliberately de-duplicates by name rather than by item, because two medicines can legitimately share one item — Anichol 60 is the Jubilant brand of Choline Chloride 60% and both are still listed separately. This applies everywhere a medicine is picked: Bulk Daily Entry, Daily Entry, Flock Sales, Vaccination Records and Feed GRN. Second, and this is the permanent part: duplicates kept coming back because nothing stopped them being created. The only guard was a check inside the Add Medicine form, which the CSV import, the quick-add button on the entry screens, and two people adding at once all bypassed. The database now REFUSES a duplicate name outright, in Medicine Master and in Item Master, with names compared the way the app compares them (case and extra spaces ignored, so "Vitalosin 62.5 %" and "Vitalosin 62.5%" count as the same). If you try to add a name that already exists you will get an error instead of a silent second copy — edit or merge the existing entry instead.' },
  { date: '2026-08-11', tag: 'Fix', text: 'Units are now consistent end to end — receipts, consumption and both masters. Soya Transport Charges is charged per kg, so Item Master was the wrong side and is now kg; the GRN rows booked as "Nos" were relabelled kg (quantities untouched, and they all read about 35,000, which is a kg figure, not a count). Every GRN row now agrees with Item Master: 0 differing, from 13 earlier. Medicine consumption: 0 rows differing, no duplicate medicines, no master conflicts. Item Master has no duplicate names and no item without a unit. The remaining casing drift is gone — one spelling per unit everywhere. Also worth knowing: the inventory Stock Ledger, which held 479 "ml" rows when this started, corrected itself — it follows medicine usage, so repairing usage repaired inventory without touching it directly. Three medicines are still not linked to an Item Master item (Anichol 60, Flyvin 1 Kg, VH VVND(VENGEM-9) Killed vaccine); they work off their own Medicine Master unit, but since Item Master is the source of truth they are worth linking under Masters → Medicines.' },
  { date: '2026-08-11', tag: 'Fix', text: 'Medicine and GRN units, final pass. All duplicate medicine entries are merged — 15 in total, not the one that was first spotted (Aqua Secure 888, Dabur Gut Health Juice, Enrocine, Hivit Inj, K-Oxishield 888, Kohrsolin TH, ND Killed, Tamik Vet Inj, Tilmovet, Ventriplex-M, VH Encepox, CEVAC IBIRD, ILT Vaccine Tissue Culture, Inactivated Pullet ND HPAI Vaccine, Volvac AC Plus). Usage history was remapped to the surviving entry before each deletion, so nothing was orphaned: the medicine list is down from 105 to 90 with all 615 usage rows intact. Receipts were checked too, because a GRN records a quantity against a unit and feeds stock and purchase value — if goods come in as one measure and go out as another, the stock balance is meaningless. Of 288 GRN rows, 13 disagreed with Item Master: 9 were spelling only (Doses vs Dose) and are now aligned, and Fertimax — received as "4000 Nos" against an Item Master that says ML — is now 4000 ML. The quantity was NOT changed, only the unit label. Three rows still disagree and are waiting on a decision, because they are real changes of measure rather than spelling: Diluents CDHB (GRN says ML, Item Master says Nos) and Soya Transport Charges (GRN says Kg, Item Master says Nos, 2 rows). Tell me which is right for those and they can be aligned the same way.' },
  { date: '2026-08-11', tag: 'Fix', text: 'Medicine units — the two conflicts you ruled on are now settled: Biospark Gold is kg and Dabur Gut Health Juice is Ltr. Item Master was already right in both cases, so only the Medicine Master entry changed and the two now agree. The 31 Biospark Gold usage rows that were deliberately left alone last time have been corrected to kg. Every one of the 615 stored medicine usage rows now agrees with the master — nothing is left disagreeing. Still open, and needing a decision from you rather than a guess: Formalin says Ltr in Medicine Master and kg in Item Master (it has no usage rows, so nothing is printing wrongly today); there are TWO separate "Dabur Gut Health Juice" entries in Medicine Master, one used and one never used, which should be merged via Masters → Medicines → Merge; 13 of 105 medicines are not linked to an Item Master item, so they fall back to their Medicine Master unit; and the units are spelled inconsistently across masters (Gm and Gms, ML and Ltr and LTR, kg and Kg), which is harmless to the arithmetic but shows up as mixed spellings on the Daily Summary.' },
  { date: '2026-08-11', tag: 'Fix', text: 'Medicine quantities were being recorded in the wrong unit. Reports → Daily Summary showed every medicine as "ml" — BVCLO2 as 22ml when it is 22 Nos, BB-Eveect 8 as 11ml when it is 11 Ltr — and the Daily Summary was not at fault: it prints whatever unit is stored. Bulk Daily Entry was saving a fixed "ml" on every medicine row regardless of the medicine, in all three of its save paths. Measured before fixing: 585 of 615 stored usage rows, going back to 09/11/2025, carried the wrong unit. Only rows entered through the older single-flock Daily Entry page were right, because that page copies the unit from the master. The unit now comes from ITEM MASTER (falling back to Medicine Master for the 13 medicines of 105 that are not linked to an item), and it is shown next to the quantity box while you type so you can see what you are entering — it is never typed by hand. The stored history was repaired too: 554 rows corrected, 584 of 615 now agree with the master. 31 rows were deliberately LEFT ALONE — all of them Biospark Gold, where Item Master says kg and Medicine Master says Ltr. Litres and kilos are not the same measurement, so choosing one would have silently restated a real quantity. Fix that medicine in either master so the two agree, and tell me — a one-line update then corrects those 31 rows. Two other medicines have the same clash but no usage yet: Dabur Gut Health Juice (ML vs Ltr) and Formalin (Ltr vs kg). Note the inventory Stock Ledger still holds the old "ml" on its side; that is a separate decision and has not been touched.' },
  { date: '2026-08-10', tag: 'New', text: 'Employees → Salary CMS Export: added the same Search box. It matches employee name, employee code, site, the account holder\'s name, bank, branch, IFSC and account number, and works together with the Sites and Account filters. Because this page produces the actual bank upload file, searching is treated as a part payment: while a search is on, a blue banner says so and reports how many of the month\'s payable rows are showing, the printout carries the search term, and the exported file is named ..._SEARCH-FILTERED.xlsx with a matching warning on the download toast — so a partial sheet can never quietly be uploaded as the full month. Clear the search before making the real bank upload.' },
  { date: '2026-08-10', tag: 'New', text: 'Employees → Salary Register: added a Search box. Type any part of an employee code, name, designation, farm, category, zone, or the name / account number the salary was deposited into, and the register narrows to matching rows. It works together with the Month, Farm, Gender, Designation and Account filters rather than replacing them. The search is applied in the same single step as the other filters, so the table, the TOTAL line (which shows the matching employee count), the Excel export and the printout always show the same set of people — and the printout carries the search term in its heading so a filtered page is never mistaken for the full register. If a search matches nothing, the page now says so and offers a Clear button, instead of the old "No salary data for this month — run Bulk Salary" message that made it look as though the month had not been calculated.' },
  { date: '2026-08-10', tag: 'New', text: 'Employees → Workforce Review: a new page answering "who is not there this month compared to last month", and what the workforce actually looked like day by day. It has: a headcount strip (worked last month → joined → not there now → worked this month → net change); a named list of everyone who worked last month and has no attendance at all this month, with their last present date — this catches people who left without the leaving date ever being filled in; a Daily Presence grid, one row per date and one column per site, with P and OT counting a full day and H counting half; Day-wise Absentees showing full-day absent, half day, weekly off and Not Marked per date, clickable to see the names in each group; Workers by Designation and Site with a male / female split; a Site Summary with attendance %, absence and OT days and hours (Available Days excludes weekly offs, so a rostered day off never reads as a shortfall); and Absence by Employee, worst first. "Not Marked" is a new figure nothing else reported — an employee with no attendance entry on a day when entries were made for others, which until now silently reduced their paid days with nothing to show for it. Month and Site filters apply to every panel, and Print and Export Excel carry all of it (Excel puts each panel on its own sheet). One deliberate limit: attendance is recorded against a site and there is no flock on an attendance record, so the page is site-wise only — a flock-wise split would be invented wherever two flocks share a site.' },
  { date: '2026-08-09', tag: 'Fix', text: 'Flock Management → Bulk Daily Entry: the TOTAL line at the bottom of the shed grid was showing the wrong figures under the wrong headings. When the new "Recd ♀ / Recd ♂" columns (chicks received mid-flock) were added, the TOTAL row did not get its two matching cells, so every total from Open ♂ onwards was displaced two columns to the left — the feed total appeared under Recd ♀, and there was no Recd total at all. Display only: the saved data was always correct. The TOTAL row now carries Recd ♀ and Recd ♂ totals and every column lines up again.' },
  { date: '2026-08-08', tag: 'New', text: 'Employees → Statutory Filing: added Advance Tax and Late Fee / Interest to the remittance tracker — neither had anywhere to be recorded before. Both are typed in when you mark them remitted, because unlike TDS, GST, PF, ESI and PT there is no source data to total them from. Also, when marking any liability remitted you can now say WHO paid it: leave it as "Paid from our bank", or pick the company or partner who deposited the challan after you transferred them the funds. The list is built from your Suppliers and Partners — no name is fixed in the app, so if the payer is not there yet, add them under Purchase → Suppliers and they appear straight away. A challan paid by someone else deliberately posts NO bank or cash entry on that date: the money left your account when you transferred it, and posting it again would double-count the expense. The saved row shows "via <name>" under the payment date. Step-by-step instructions are in the HR & Payroll section of this guide.' },
  { date: '2026-08-08', tag: 'Fix', text: 'Reports → TDS Payable was missing TDS deducted on vendor advances. It read only supplier bills and salaries, so any TDS you deducted while paying an advance never appeared in the report or in the printed statement used for filing — the statement was understated by exactly that amount. Vendor advances now appear as their own table (with the same section picker and Link to Challan action), are included in the section-wise summary and the totals, and the combined print becomes "Vendor + Salary + Advance". Checked before changing anything: you currently have 17 advances and none carry TDS, so no figure moved — this closes the gap before it opens.' },
  { date: '2026-08-07', tag: 'Fix', text: 'Flock age now counts from 0 weeks. The placement date reads W0 D1 instead of W1 D1 — a day-old chick is 0 weeks 1 day, and the flock turns 1 week old on day 8. This is how the Venco standard curve is measured and what the Age (weeks) box in daily entry already filled in, so the three now agree instead of the Week/Day column being one week ahead of everything else. IMPORTANT: on the Weekly tab every week number therefore shifts down by one — what read "Week 58" now reads "Week 57". The weeks themselves, their dates and all totals are unchanged; only the number against them is corrected. Days recorded BEFORE the placement date — normal when chicks arrive over two or three days and day 1 is counted from the last consignment — now read "Pre -2d" and group as "Pre-placement" on the Weekly tab, instead of showing a meaningless week number.' },
  { date: '2026-08-07', tag: 'Fix', text: 'Flock Management → Bulk Daily Entry: a figure typed into the opening bird count could be silently replaced a moment later by the pre-filled value, so Save stored the old number and it looked like nothing saved. This only showed on a brand-new flock: the page fills the opening box from yesterday\'s closing, which arrives from the database a fraction after the rest of the row, and anything typed in that gap was overwritten. On an established flock the same refresh puts back the value already on screen, so it was invisible. The page now waits for all of a day\'s data before filling the grid, and never re-fills it while you are working — only when you change flock, date or shed, or after a save.' },
  { date: '2026-08-07', tag: 'Fix', text: 'Flock Management → Bulk Daily Entry: entering ONLY the opening or closing bird count for a shed saved nothing, and gave no error — it simply reported success and the figures were gone on reload. This hit new flocks hardest: on placement day there are no eggs, no feed and no mortality to enter, so the bird count was the only figure on the row, and the row was skipped entirely. The save was checking for eggs, wastage, mortality, feed, transfer, cull, lighting and remarks, but had never included the bird-count columns. Bird counts now save on their own. Note they only count when you actually change them — a figure the page carried forward from yesterday\'s closing is left alone, so empty daily records are still not created for sheds with no activity.' },
  { date: '2026-08-07', tag: 'Fix', text: 'Flock Management → Bulk Daily Entry could hit "This page hit an error" (React error #31) — but only if you had visited a Feed Mill or Feed page first, which is why it seemed random. Several pages were storing feed-type data under the same internal name while holding it in different formats, so whichever page loaded last left the other one with data it could not read. Each page now keeps its own, and editing a feed type in Masters still refreshes them all. The whole app was scanned to confirm no other page can fail this way.' },
  { date: '2026-08-07', tag: 'Fix', text: 'Feed Mill: an ingredient could show a blank rate and ₹0.00 cost while the same ingredient priced correctly in other formulas — Toxfin 360 Dry in formula BCM-PS-NB was costing zero even though it was purchased at ₹135. The cause: formulas store the ingredient NAME as text, and one formula spelled it "Toxfin 360 Dry" while every purchase was recorded as "Toxfin360 Dry", so the rate lookup found no match. Merging the two items in Items Master did NOT fix this and never could — a merge joins the item records, but the name already written into a formula is plain text and is not rewritten. Rates are now looked up through the item alias list, so any spelling you have already linked in Items Master prices correctly, including on production records already saved. The same fix was applied to the formula cost-per-kg calculation, which had the identical problem and was therefore understating feed cost in daily entries and Flock P&L. Checked across all formulas: this was the only ingredient affected.' },
  { date: '2026-08-07', tag: 'Fix', text: 'Salary cost was reading as ZERO in Company P&L and Flock P&L, and Reports → Salary Report was completely blank for every financial year. All three read a table called salary_abstract, which only the Excel importer ever fills — it held 0 rows — while the Bulk Salary run writes to a different table holding 723 records (Jun-26 ₹26.68L, Jul-26 ₹30.36L). They now read the real salary data, so Company P&L for FY 2026-27 was understating cost by roughly ₹57 lakh for June and July alone. Please re-check any P&L figure you took from those pages before today.' },
  { date: '2026-08-07', tag: 'Fix', text: 'Reports → Cost Analysis (Electricity) and Salary Analysis could not select FY 2026-27 — each had its own fixed list of years ending at 2025-26, even though the data was there. Both now use the app-wide financial year list, so a new year appears everywhere at once, and Salary Analysis opens on the current year instead of a fixed 2024-25 which always looked empty.' },
  { date: '2026-08-07', tag: 'New', text: 'Reports → Monthly Production Review: added Hatching Egg panels and a staff breakdown. Hatching Egg Dispatch shows Grade A/B/C and free eggs; Hatching Egg Sales lists every invoice with party, eggs, rate and amount plus an average rate — note that rate and amount are recorded per dispatch and never per grade, so income cannot be split by grade and is shown per invoice instead. A new Hatching Egg Production Cost panel splits the month\'s feed and medicine cost by EGG COUNT: every egg carries the same share, so cost per HE egg equals cost per egg, and it shows the HE share of cost against the invoiced HE income with a margin. Chick cost is excluded (a one-off placement cost, not this month\'s eggs) and electricity and salary are not allocated per flock per month. Staff Working Days is now Site × Designation with Female/Male headcount and Female/Male days — attendance records a site and never a flock, so where two flocks share a site the note says so rather than inventing a split.' },
  { date: '2026-08-07', tag: 'New', text: 'Reports → Monthly Production Review: a new management-meeting report modelled on the Hitech production pack. Pick a month and choose One Flock, All Active Flocks, or Company. It shows Birds Status by Shed with utilisation %, a three-month Actual vs Standard comparison (HD%, HE%, cumulative mortality, cumulative feed per bird, cumulative HH and HHH eggs, each with its deviation), week-wise Rejection Details, Rejection Egg Sale for the month and month-wise rejection-egg money, week-wise Hatchability against the standard, plus company panels for Monthly Diesel Purchase and Average Staff Working Day. Three charts — HD%/HE% vs standard, cumulative mortality, and hatchability — appear on screen and PRINT AS PICTURES of those same charts, so the printout can never disagree with what was reviewed. Print Review puts the whole pack on the company letterhead. IMPORTANT: four panels from the reference pack are deliberately absent because the app does not hold those figures — body weight / gain / uniformity / CV, feed gm-per-bird against a feed standard, vaccination due-date vs done-date, and the Selection and Loss/Profit line. They are listed at the bottom of the report and in the printout so a blank is never mistaken for a zero.' },
  { date: '2026-08-07', tag: 'New', text: 'Employees: Aadhaar number can now be recorded. There was no Aadhaar field anywhere in the app — PAN, ESI and UAN were captured but Aadhaar was never added. It now appears on the employee form next to PAN No., as a column on the Employee List, in the CSV export, on the printed Employee List, and in the bulk import template (column "aadhaar_no", alongside "pan_no" which the import also accepts now). It is displayed in the usual 1234 5678 9012 grouping, and search finds a person whether you type the number with spaces or without. If you enter something that is not 12 digits, or that starts with 0 or 1, the form tells you before saving — but the number itself is never rejected for any other reason, so an unusual card can still be recorded.' },
  { date: '2026-08-07', tag: 'Improved', text: 'The crash that produced "Minified React error #310" can no longer reach the live app. The specific check that catches it now runs automatically every time the app is built, and a build that contains such a mistake fails before it can be published. This was tested by deliberately reintroducing the exact Flock 23 fault — the build stopped and named the file and line — and then removing it again.' },
  { date: '2026-08-07', tag: 'Fix', text: 'Fixed the "This page hit an error — Minified React error #310" crash when opening a flock from Flock Management → All Flock Data. The cause: one calculation on the flock page was placed after the page\'s "still loading" check, so it ran on the second render but not the first. React requires the same set of calculations on every render and aborts the page when they differ. It only showed up on flocks the app had not loaded before — Flock 23, a brand new flock, hit it every time, while flocks already held in memory skipped the loading step and appeared fine. That is why it seemed random. The same mistake was found and fixed in Sales Invoice Register, which would have crashed the same way on a slow load, and a third latent case in the payslip options was corrected. The whole app was then scanned to confirm no other page has this problem.' },
  { date: '2026-08-07', tag: 'New', text: 'Flock Management → Bulk Daily Entry: added a Change Date button. A day entered against the wrong date could previously neither be moved nor deleted — the date box only ever chose which day to display, so the only workaround was to re-enter the day correctly and zero out the wrong one. Select the flock and the wrong date, click Change Date, pick the correct date and click Move Entry: every shed\'s daily record, the flock-level grade row, the feed rows and the medicine usage all move together in one step, and the page then shows the moved day. If the new date already has an entry for that flock the move is refused, so a correctly entered day can never be silently overwritten. The button appears once a flock is selected. After moving, check the day AFTER the old date — its opening bird count reads from the previous day.' },
  { date: '2026-08-07', tag: 'New', text: 'Reports → TDS Payable: the TDS Statement is now shown ON the page, not only in the print — a "TDS Statement" card with the deductee-wise Deducted Details table and the Summary by deductee type and section, so the team can verify every figure on screen before anything is filed. It is built from the same code the Print button uses, so the page and the printout can never differ, and it follows your FY / date filters and any ticked rows. There is a Print this button on the card, and a Hide link if you want it out of the way. Note on the figures: Total Amount and TDS Deducted are the amounts entered on the bill or salary row, only added together — nothing is recalculated, and no rounding is applied. The only derived figure is the TDS Rate on a merged line, which is shown as total TDS ÷ total amount, because a supplier with many bills in a month has no single rate to display.' },
  { date: '2026-08-07', tag: 'Fix', text: 'Reports → TDS Payable: the TDS Statement print listed one line per bill, but the statement is filed deductee-wise — a supplier billed twenty times in a month is ONE line carrying the month\'s total purchase value and total TDS. It is now grouped by deductee, section and month, with the TDS rate recomputed from those totals. A supplier deducted under two different sections still gets a line for each, as it must. Bill-by-bill detail is still available from the "Vendor only" print option. Separately, the deductor PAN and TAN on the statement are now read from Admin Centre → Company Profile instead of being fixed in the app; a PAN No. field has been added there next to TAN No. (filled in automatically from your GSTIN) so both can be corrected without a code change.' },
  { date: '2026-08-07', tag: 'New', text: 'Reports → TDS Payable: added a "TDS Statement (Deducted + Summary)" print — the monthly TDS working layout, and now the default Print option. It prints the deductor PAN and TAN in the letterhead, then one TDS Deducted Details table listing every deductee (vendor bills and salary together, since one challan covers both) with Nature of Payment, Month, Total Amount, TDS Deducted, TDS Rate, Interest, Section, Deductee Type and PAN, followed by a Summary grouped by Deductee Type and Section — which is exactly how the challan is filed. Nature of Payment is derived from the TDS Section you already set (1002 = Salary, 1027 = Service, 1031 = Purchase, 1067 = Partner Remuneration), so there is nothing extra to enter. For it to be complete, every bill and salary row must have its TDS Section set — anything left blank shows as a dash and lands in an "—" summary line.' },
  { date: '2026-08-07', tag: 'Fix', text: 'Renaming a supplier or a partner only changed the master record — every bill, cash entry and ledger line kept showing the OLD name, because the name was copied onto each row as plain text when the row was created and nothing ever rewrote it. Renaming "G Parmita Das" to "Gottipati Parmita Das" left the old name on 6 pending payments, 6 Cash Book entries and 12 ledger narrations. Those have been corrected, and renaming is now permanent: a rename on the Suppliers or Partners page automatically rewrites the name everywhere it was stored (Pending Payments, Purchase Orders, Purchase Invoice Register, Cash Book, Sales Register, Bag Sales, Feed Mill expenses, vendor bank details, plus Bank Ledger and Cash Book narrations). You only ever have to change it in one place.' },
  { date: '2026-08-07', tag: 'Improved', text: 'Cash Book: the Party Name box was free text with no connection to your Suppliers or Partners lists, so a name typed here could never follow a rename and could not be reported on reliably. It is now a searchable picker covering suppliers, customers and partners, and the Party column shows the master\'s current name through that link — rename once and this page updates itself. You can still type a name that is not in the lists; existing entries are unaffected and were automatically linked wherever the name matched a master exactly.' },
  { date: '2026-08-07', tag: 'Improved', text: 'Reports → TDS Payable: the two separate Print Vendor / Print Salary buttons are replaced by a single Print dropdown with three options — Vendor + Salary (default), Vendor only, and Salary only. The combined option puts both statements on one letterhead document, each with its own heading and TOTAL row, followed by a GRAND TOTAL TDS PAYABLE (Vendor + Salary) — which is what actually gets deposited for the period. If you tick rows in the table, the vendor sheet prints only those rows and the heading notes how many were selected; leave them unticked to print everything the filters show.' },
  { date: '2026-08-07', tag: 'Fix', text: 'Reports → TDS Payable: three problems fixed. (1) The report filtered and sorted on the GRN date only, so bills recorded through Purchase Invoice Register — which have an invoice date but no GRN date — vanished from every filtered view; 6 bills holding ₹32,600 of TDS were invisible. Date, due date, filters, exports and print now fall back to the invoice date. (2) A partner\'s PAN could never appear because the report looked only at the supplier PAN field, while partners store theirs in a differently-named column. Partner PAN now shows. (3) Flock Sales → NHE Sales: the "Cash Received At (Location)" you pick when receiving payment was written to the Cash Book entry but never saved on the sale, so reopening it always showed Head Office again.' },
  { date: '2026-08-07', tag: 'New', text: 'Reports → TDS Payable: added a search box (vendor, invoice, PAN, section, amount), a TDS Deposit filter (deposited / not deposited), and click-to-sort on Date, Vendor, Invoice, Amount, TDS %, TDS Amount, PAN, Section and Deposit Status. Rows can now be ticked to Link to Challan in bulk — one challan usually covers many deductees, so tagging them one at a time was the slow part of filing — and each row has a Clear TDS action that removes the TDS details from a bill (the bill itself is kept in Pending Payments). Purchase Invoice Register also gained a search box across invoice no, supplier, amounts and remarks.' },
  { date: '2026-08-05', tag: 'New', text: 'Reports → TDS Payable and TDS Receivable: added Print buttons producing statements on the company letterhead (logo, address, GSTIN), matching the other reports. They print exactly what the current filters show — pick a Financial Year for a yearly statement, or a From/To range for a month, and the period appears in the heading with a TOTAL row at the bottom. TDS Payable prints two separate statements, Print Vendor and Print Salary, since vendor TDS and salary TDS are different sources filed under different sections; the vendor sheet includes PAN, TDS section and deposit status for filing.' },
  { date: '2026-08-05', tag: 'Improved', text: 'Accounts → Daily Payment Planning: the single "Reference" column showed the PO number when a bill had one and only fell back to the invoice number otherwise — so any bill created through the PO/Excel import hid its invoice number completely, which is usually the number a vendor wants quoted when you pay them. It is now split into two columns, Invoice No and PO No, so both are always visible.' },
  { date: '2026-08-05', tag: 'Fix', text: 'Employees → Bulk Salary: the employee list ignored the selected month entirely — it simply listed everyone currently active — so staff who had not joined yet appeared in earlier months (confirmed: 8 employees who joined 01/08/2026 were listed in July 2026 and had July salary rows saved for them), while anyone who has since left vanished from months they genuinely worked. The list now only includes people actually employed during the month you pick, using their joining and leaving dates. The 8 wrongly-created July rows have been removed (any already marked paid were left untouched for manual review). Also added a Joined column to the Employee List, showing the joining date and, for anyone who has left, their leaving date beneath it.' },
  { date: '2026-08-05', tag: 'Fix', text: 'Flocks → NHE Sales / HE Dispatch / Medicine Entry: with no filter applied these pages load only the latest 200 records for speed, but nothing said so — the table AND the summary totals (Total Sales, Received, Due, etc.) silently described a partial set as if it were the full history. Each page now shows a clear amber notice when the 200-row view is in effect. Separately, applying a filter dropped that limit but still ran a single request, which Supabase caps at 1,000 rows — so a wide filter (e.g. a full year for one flock) could silently stop at 1,000. Filtered views now page through every matching record.' },
  { date: '2026-08-05', tag: 'Fix', text: 'Employees → Bulk Salary: the "From Daily Att." column showed far fewer absent days than were actually recorded — e.g. an employee with 15 absences in Jul 2026 showed 2, and many employees showed a dash as though they had no attendance at all. The column reads daily attendance for the whole month across every employee (247 employees x 31 days = ~7,600 rows for July), but fetched it in a single request, which Supabase caps at 1,000 rows — so roughly 6,600 rows never arrived and each absent count was computed from a fraction of the month. The same trap was fixed on the Month Attendance page. Both now page through the full month. IMPORTANT: if you clicked "Auto-fill from Daily Attendance" before this fix, it copied those understated figures over your Absent Days — re-check that month and click Auto-fill again now that the counts are correct.' },
  { date: '2026-08-04', tag: 'Improved', text: 'Discussions (chat): group chat always existed but was effectively hidden — the New Chat screen decided between a 1:1 and a group purely by whether you happened to type a group name, so ticking several people without typing a name left a disabled "Start Chat" button and no visible way to create a group. There are now two clear buttons at the top — Direct Message and Group Chat. Pick Group Chat, name it, tick everyone who should be in it, and Create Group shows the member count. Direct Message mode uses radio buttons so only one person can be picked, matching what a 1:1 chat actually is.' },
  { date: '2026-08-04', tag: 'New', text: 'Accounts → Bank Ledger: added a Print button that produces a proper bank statement on the company letterhead — one account at a time, so Kotak and every other account print their own separate ledger. It honours whatever period is selected (the From/To dates, or the whole financial year when no range is set), and shows the account name/number/IFSC, an Opening Balance row, every entry with Credit/Debit/running Balance columns, and a closing total with Prepared/Checked/Approved/Accounts signature lines. Entries print oldest-first so the running balance reads down the page, even though the screen shows newest first.' },
  { date: '2026-08-04', tag: 'New', text: 'Accounts → Vendor Advances: added a search box alongside the vendor filter — searches vendor name, reference/UTR, remarks, payment mode, TDS section, amount and date, with a "showing X of Y" count. The totals and the select-all checkbox follow the search, so the figures always add up to the rows on screen and "select all" can never tick rows hidden by the search (which would otherwise let a bulk delete remove records you never saw).' },
  { date: '2026-08-04', tag: 'New', text: 'Purchase → GRN: print now works at bill level instead of item level. (1) Tick any rows and a new "Print (N)" button appears next to Delete — it prints all selected lines in one document, grouped by GRN No and supplier, with a per-GRN total and a grand total when several GRNs are selected. (2) The printer icon on a row now prints the WHOLE GRN — every item line sharing that GRN No — instead of just the clicked line. Previously a 3-item GRN needed 3 separate printouts, each showing only that one item\'s amount as though it were the entire bill. Items with and without GST are handled per line, so a mixed GRN totals correctly, and the printed total matches the single payable bill in Pending Payments.' },
  { date: '2026-08-04', tag: 'New', text: 'Accounts → Purchase Invoice Register: added a per-invoice Print button (printer icon on each row) alongside the register-wide Print added earlier — the toolbar button prints the whole filtered list, this one prints a single invoice as a voucher on the company letterhead, with the full money breakdown (Basic, GST, Invoice Total, less TDS, less Amount Paid, Balance Payable), the supplier and flock/farm allocation, status, and Prepared/Checked/Approved/Accounts signature lines for filing against the vendor bill.' },
  { date: '2026-08-04', tag: 'New', text: 'Accounts → Purchase Invoice Register: added a Print button on the company letterhead (logo, name, address, GSTIN), matching the other account reports. It prints exactly the invoices the current filters are showing — with the period, type and status in the subtitle — including Total/Paid/TDS/Balance columns and a TOTAL row. Checked the rest of the page while adding it: Template, Import, Export, Add Invoice, plus per-row Pay, Duplicate, Edit and Delete were already there, so Print was the only standard option missing.' },
  { date: '2026-08-04', tag: 'Fix', text: 'Accounts → Purchase Invoice Register: an invoice with TDS kept showing the TDS as an outstanding balance forever — a ₹79,000 invoice with ₹7,900 TDS still showed ₹7,900 due after the ₹71,100 actually payable had been paid in full. The register had no concept of TDS, so Balance was simply Total − Paid, treating tax deducted at source as unpaid money. TDS is now a proper field: enter it directly on the invoice (new "TDS Deducted" box) or on the mirrored bill in Pending Payments — either way both sides agree, Balance becomes Total − Paid − TDS, and the invoice closes as Paid once the net amount is settled. A TDS column has been added to the list, totals and Excel export. Existing invoices picked up their TDS automatically from the matching bill.' },
  { date: '2026-08-04', tag: 'Fix', text: 'Accounts → Purchase Invoice Register now stays in step with payments made elsewhere. Recording an invoice here already mirrored it into Pending Payments, but nothing ever came back — so paying that bill from Pending Payments (Pay, Bulk Pay, or Edit Bill) or reconciling it from Bank Ledger left the invoice showing Unpaid forever. All four of those now update the invoice\'s paid amount and status automatically. Separately, marking a PARTIAL payment from the Invoice Register\'s tick button updated statuses but posted nothing to Cash Book/Bank Ledger — so money left the bank with no ledger entry; partial payments now post exactly like full ones, and the payment date/mode/bank are saved on the bill too.' },
  { date: '2026-08-04', tag: 'Fix', text: 'Accounts → Pending Payments → Edit Bill: a manually-entered TDS Amount still could not be saved whenever a TDS % was also selected — on save it was silently recomputed from the rate (e.g. ₹664 entered on a ₹7,14,168 bill kept saving as ₹714). This is the same complaint reported earlier for another supplier: that first fix only stopped the % dropdown overwriting the box while typing, and missed a second recalculation that ran at save time, so the problem kept reappearing on other suppliers. Now the two fields are only ever used to fill in whichever one was left blank — a typed TDS Amount is saved exactly as typed, since the % is the section rate while the amount is what is actually deducted (rounding, or TDS on the base value excluding GST). One known-affected bill (Vinayaka Enterprises, Inv 370) has been corrected.' },
  { date: '2026-08-04', tag: 'Fix', text: 'Flocks → HE Dispatch → Daily Stock Register: some days showed exactly DOUBLE the egg production that Bulk Daily Entry recorded (e.g. Flock 20 on 14/07/2026 showed 41,646 HE eggs against actual production of 20,823). Cause: the Grade A/B/C breakdown is stored on a single flock-level row per day, but a save that landed without a farm reference didn\'t collide with one that had it, so the same day could be saved twice and the register added both. The duplicate rows have been removed (Flock 20 and 22, 5 days in total — no figures were lost, the duplicates were identical) and the database rule has been tightened so a second entry for the same flock and day is now rejected outright.' },
  { date: '2026-08-04', tag: 'New', text: 'Flocks → NHE Sales: egg lines now have a "Free" column for eggs given away free (complimentary / to outsiders) — previously the only way to record this was faking a zero-rate sale, which made give-aways indistinguishable from real ₹0 sales in reports. Free eggs still count as stock leaving (so Egg Stock and production figures stay correct) but are never billed, and now roll up into their own "Free Eggs Given" total on the page and a Free column in the CSV export. Works the same way HE Dispatch\'s existing Free Eggs field already does.' },
  { date: '2026-08-03', tag: 'New', text: 'Admin Centre → Masters → Tasks: Task Recurrence rules (the dropdown when assigning/editing a recurring task — "Monthly 7th for TDS", "Quarterly 31st", etc.) are no longer hardcoded — add, edit, or deactivate as many compliance recurrences as needed (GST, TDS, ESI, PF, PT, and anything else with its own due date) the same way every other dropdown list in the app is managed.' },
  { date: '2026-08-03', tag: 'New', text: 'App-wide: added a "Turn on notifications" banner (dismissible, shows once) that enables real OS/desktop notifications for new Discussions messages, new task assignments, and task due-date reminders — firing even when the app tab isn\'t focused (minimized, another tab/app in front). Note: this needs the browser/app to still be open in the background; it does not yet survive the browser being fully closed — that would need a separate server-push setup.' },
  { date: '2026-08-03', tag: 'New', text: 'Purchase → GRN → Edit GRN: "+ Add Another Item" now works while editing an existing GRN, not just when adding a new one — so if you forgot an item on a bill, you no longer have to redo the whole GRN (No/Date/Farm/Supplier/Invoice/Vehicle) from scratch just to add one more line. Item 1 stays the existing item being edited; anything added below it saves as a new item under that same GRN.' },
  { date: '2026-08-02', tag: 'Fix', text: 'Accounts → Pending Payments → Edit Bill: picking a TDS % preset (or typing a custom %) always overwrote the TDS Amount field with the %-calculated figure, even if a manual custom amount had already been typed in — so entering a real ₹494 TDS by hand, then touching the % dropdown for any reason, silently replaced it with a computed 0.1% figure (₹2,296) instead. TDS Amount now only auto-fills from % when it\'s still blank, matching its own "Auto from % if left blank" placeholder text. One known-affected bill (Sachin International Proteins, Inv SIPPL/26-27/739) has been corrected.' },
  { date: '2026-08-01', tag: 'Fix', text: 'Mobile — Flock Management: HE Dispatch, NHE Sales, the Flock Management dashboard\'s Overview/HE Dispatch tabs, Egg Conversions, and Egg Opening Stock all had 3–5 stat cards or number fields forced into one fixed row (grid-cols-3/4/5) with no allowance for a narrow phone screen, clipping large numbers off the right edge (e.g. HE Dispatch\'s Total Revenue showing "Rs 2,90,43,3…" cut off) and squeezing form fields unusably small. All now stack into a single column on phones and expand to the full row on wider screens. First of an ongoing page-by-page mobile pass — reported from real screenshots.' },
  { date: '2026-08-01', tag: 'Fix', text: 'Mobile: two "Record Payment" popups (Partner Remuneration, Purchase Invoice Register) were a fixed 384px wide, wider than a typical phone screen (375px on an iPhone SE/mini), clipping their right edge off-screen. Both now shrink to fit the screen with a margin instead of a fixed width. Swept the rest of the app for the same fixed-width-modal and unwrapped-wide-table patterns — everything else already scrolls/resizes correctly.' },
  { date: '2026-08-01', tag: 'New', text: 'Accounts → Pending Payments → Edit Bill: saving a bill as "Paid" now warns if Paid Amount + Discount don\'t actually add up to Net Payable (e.g. entering the wrong discount %, or a paid amount that leaves an unexplained gap) — showing the exact shortfall and letting you fix it or confirm before saving. Added after finding two real bills (Ventri Biologicals, Sunways Bio Science) marked Paid with numbers that quietly didn\'t reconcile, leaving a phantom balance and a wrong figure carried into Cash Book/Bank Ledger.' },
  { date: '2026-08-01', tag: 'Fix', text: 'Accounts → Pending Payments → Edit Bill: re-editing a bill that\'s already Paid (e.g. lowering Paid Amount after recording a discount) always re-posted the FULL gross Net Payable to Cash Book/Bank Ledger, ignoring both the discount and whatever was actually typed into Paid Amount — so a bill paid ₹4,80,454 after a ₹14,859 discount kept showing the original ₹4,95,313 in Bank Ledger no matter how many times Paid Amount was corrected in Pending Payments, since the two never synced in that direction. Re-editing an already-Paid bill now re-posts the real Paid Amount. One known-affected bill (Ventri Biologicals, Inv 27SLHYD21/203) has been corrected.' },
  { date: '2026-08-01', tag: 'New', text: 'Flocks → Flock Detail (All Flock Data): added Export and Print buttons that work on whichever tab you\'re viewing — Overview, Placements, Daily, Weekly, Monthly, Financial, Transfers, and vs Standard. Previously only the Daily tab had its own Export, and nothing had Print; the new pair of buttons always exports/prints exactly what\'s shown in the currently selected tab (Daily keeps its own existing date-range-aware Export, so only Print is new there).' },
  { date: '2026-08-01', tag: 'Fix', text: 'Flocks → Bulk Daily Entry → "+" Add Medicine popup: the Unit dropdown was a fixed list (ml/Ltr/Gm/Kg/Nos/Tab) that didn\'t include "Dose" or any other unit configured in Settings — even though Items Master\'s own Add Item form reads the full unit list from the same config table. A medicine that\'s actually measured in Doses (most vaccines) had no matching unit to pick. Both Category and Unit here now read from the same configured list Items Master uses, so they always stay in sync.' },
  { date: '2026-07-31', tag: 'Fix', text: 'Flocks → Flock Detail dashboard (both the Flock Management page\'s Overview tab and the older per-flock Flock Detail page): a flock whose total daily records passed 1,000 rows (e.g. after a long-history backfill import) silently understated every lifetime total on the dashboard — Total Eggs, Total HE Eggs, Total Mortality, Grade A/B/C, Avg Lay%/HE%, current bird count — because the underlying query had no pagination and Supabase/PostgREST caps a single request at 1,000 rows. Found by comparing a flock\'s dashboard totals against its source Excel file after a bulk historical import made its row count cross 1,000 for the first time (a long-dormant bug the import inadvertently exposed). Both pages now page through the full result set, matching the same fix already applied to Cash Book/Bank Ledger/other reports — works correctly regardless of how many years of history a flock has.' },
  { date: '2026-07-31', tag: 'New', text: 'Flocks → Bulk Daily Entry (Shed mode): added "Multi-Day Template"/"Multi-Day Import" for a historical backfill spanning many dates at once — the existing Import only ever handled one date at a time (its template has no Date column, and everything imported applies to whichever single date is selected). The new template adds a Date column; on import, rows are grouped by date and saved straight to the database day by day using the exact same logic as a normal Save All for that day (egg/feed/mortality/cull, flock-level Grade A/B/C, flock-level medicine, aggregated feed per type) — so history stays consistent with Flock P&L/Egg Stock/etc., not a separate write path. A progress indicator shows which day is currently saving.' },
  { date: '2026-07-31', tag: 'New', text: 'Accounts → Generate CMS File: added a Print button (company letterhead — logo, address, GSTIN) alongside the existing Excel download, showing the same selected beneficiaries/amounts as a printable Request for RTGS/NEFT Transfer, for physical submission to the bank alongside the CMS file.' },
  { date: '2026-07-31', tag: 'New', text: 'Flocks → Bulk Daily Entry: added a "Show closed flocks" checkbox — the flock picker only ever showed active flocks, so a historical backfill/correction for a flock that\'s since been closed had nowhere to go. Closed flocks are tagged "(closed)" in the dropdown once shown.' },
  { date: '2026-07-31', tag: 'Fix', text: 'Purchase → Items Master: editing a medicine-type item (rename, change category/unit/manufacturer) never updated the matching entry the medicine dropdowns (Bulk Daily Entry, Daily Entry, Flock Sales, VHL) actually read from — that entry stayed frozen with whatever it was when first created. Renaming an item could even silently create a DUPLICATE dropdown entry under the new name instead of updating the original. Fixed at the database level so editing an item now correctly updates its linked medicine entry in place, everywhere.' },
  { date: '2026-07-31', tag: 'New', text: 'Flocks → Bulk Daily Entry: a "+" button next to the Medicine field now lets you add a medicine on the spot if it\'s not in the list, instead of having to go to Items Master first. It creates the medicine in both Items Master and the medicine dropdown\'s own list in one step, so it\'s immediately usable everywhere (GRN, Medicine Entry, VHL, etc.), not just in this form.' },
  { date: '2026-07-31', tag: 'New', text: 'Accounts → Purchase Invoice Register: added a Duplicate button (copy icon) per invoice — for a bill that recurs every month for the same vendor (rent, AMC, retainer, etc.), it pre-fills vendor, amount, GST, and remarks into a fresh Record Invoice form, leaving Invoice No/Date and payment status blank for this month\'s actual details. Faster than retyping the whole bill each month.' },
  { date: '2026-07-31', tag: 'New', text: 'Employees → Employee Advances: added Print Voucher (per row — a signed payment-voucher layout with Employee/Prepared By/Approved By/Accounts signature lines), plus Template, Import, and Export buttons matching the pattern used on other list pages. (Edit and Delete already existed.) Note: unlike the manual Add Advance form, a bulk-imported cash advance does not post a matching Cash Book/Bank Ledger entry — reconcile those manually if needed.' },
  { date: '2026-07-30', tag: 'New', text: 'Purchase → Items Master: an item\'s known aliases now show directly under its name in the list (e.g. "aka: VVND Killed (HP) New Strain Hester, VVND HPAI White +2 more") instead of being invisible until you opened "Manage alias names" — so anyone browsing the list can see at a glance what other names an item is known by. Click it to open the alias manager directly.' },
  { date: '2026-07-30', tag: 'Fix', text: 'Purchase → Items Master: the page\'s own search box never actually checked an item\'s aliases — only name/code/short name/manufacturer — even though every other item picker in the app (GRN, Bulk Daily Entry, Feed Mill, etc.) already searches aliases correctly. Confirmed on a real item ("Inactivated Pullet ND HPAI Vaccine (W)") that already had "VVND Killed (HP) New Strain Hester" registered as an alias, yet searching "VVND" here found nothing. Items Master\'s search now checks aliases too, matching every other picker.' },
  { date: '2026-07-29', tag: 'Fix', text: 'Accounts → Opening Balances: fixed an orphaned-record bug from the duplicate-reference issue fixed yesterday — if the linked bill/advance failed to create for any reason, the opening balance itself had already been saved, leaving it sitting invisible with nothing to pay against anywhere (confirmed on a real ₹13,50,000 entry that never got a matching bill in Pending Payments). Saving now rolls back the opening balance if its linked record fails to create, so a failed save never leaves a half-created entry behind. The one real case already found has been repaired.' },
  { date: '2026-07-28', tag: 'Fix', text: 'Accounts → Opening Balances: a vendor/partner could only ever have ONE opening balance per financial year — a second one for the same vendor in the same FY (e.g. several separate old unpaid invoices instead of one combined figure) hit a raw "duplicate key value violates unique constraint" database error, since the auto-created bill behind it always used the same fixed reference. Each opening balance entry now gets its own unique reference, so a vendor can have as many opening balances in one FY as needed. Also replaced this and a similar raw database error in Pending Payments\' Add/Edit Bill with a plain-language message.' },
  { date: '2026-07-28', tag: 'New', text: 'Accounts → Opening Balances: added an Edit option (pencil icon) — previously the only way to fix a mistake was to delete and re-add. Edit lets you correct the Amount and Remarks (who it\'s against and Dr/Cr stay locked, since changing those would mean switching which linked record — a payable bill, vendor advance, or manual receivable — it auto-created; delete and re-add still covers that rarer case). Blocked with a clear message if the linked bill/advance has already been paid or adjusted, same protection Delete already had.' },
  { date: '2026-07-28', tag: 'Fix', text: 'Accounts → Pending Payments → Edit Bill: reversing a bill\'s Status from Paid back to Pending/HOLD left the old Paid Amount/Discount sitting in place — a side effect of making Paid Amount a directly-editable field earlier today, which removed the automatic reset that used to happen on this exact transition. Balance kept showing 0/settled and the Pay button never came back, even though the bill was meant to be outstanding again. Switching Status away from Paid now clears Paid Amount and Discount back to blank automatically.' },
  { date: '2026-07-28', tag: 'Fix', text: 'Accounts → Pending Payments → Edit Bill: Paid Amount is now a direct field you type, always saved exactly as entered — it used to be silently recalculated as (Net Payable − Discount) every time the form was saved with Status "Paid", which could overwrite a real recorded payment with a fabricated number if the discount value was ever briefly wrong before being corrected (confirmed on a real bill — the discount had been fixed from 4,520 to 2,260, but Paid Amount stayed stuck at the older 70,818 instead of the actual 73,078). A live "Balance after this" preview now shows directly under the field.' },
  { date: '2026-07-28', tag: 'New', text: 'Accounts → Pending Payments → Pay: added a "Discount / Write-off" field right alongside Amount Paying, so a partial payment plus a discount (e.g. paid 50%, other 50% written off) can be entered together in one step — with a live "Remaining after this" preview. Previously discount could only be entered via the separate Edit form, which meant recording the payment and the discount in two different places; combining them here avoids the Edit form\'s auto-recalculation silently overwriting a payment that was already recorded via Pay.' },
  { date: '2026-07-22', tag: 'New', text: 'Accounts → Bank Ledger → Add Transaction: added a "Save & Add Another" button that keeps the form open (same date/account/type, ready for the next entry) instead of closing it, plus a running "Added this session" list inside the modal so each save is visibly confirmed without leaving the form. Also fixed the real reason a newly-added transaction sometimes seemed to vanish: adding one dated into a different fiscal year (e.g. 1 April, the start of a new FY) saved correctly but stayed invisible until the FY filter was manually switched — the filter now auto-switches to match whatever date you just entered.' },
  { date: '2026-07-22', tag: 'Improved', text: 'App-wide: if a browser tab is left open long enough for the login session to expire (the automatic background refresh can lose the race in an inactive tab), any save or page load used to fail with a raw "JWT expired" error and no way to recover except realizing you had to refresh yourself. Now shows a clear "Your session has expired — please log in again" message and takes you straight to the login page instead of leaving a broken screen.' },
  { date: '2026-07-21', tag: 'Fix', text: 'Accounts → Party Outstanding → Creditors tab: a bill settled partly by payment and partly by discount (e.g. paid 50%, 50% written off as discount) still showed its full original amount here even though Pending Payments itself already showed it as settled — the aging buckets, "By Vendor" totals, and grand total all only ever subtracted the amount paid, never the discount. Added a "Balance Due" column that nets out both paid and discount amounts (matching Pending Payments\' own calculation), and fixed aging/vendor totals to use it instead of the raw bill amount.' },
  { date: '2026-07-21', tag: 'Improved', text: 'Flocks → HE Dispatch → Print Invoice: the per-day egg production table now shows an "Age" column (e.g. "58w 4d") next to each production date, computed from the flock\'s placement date — a dispatch spanning several days now shows the correct age for each individual day, not just one age for the whole invoice.' },
  { date: '2026-07-21', tag: 'New', text: 'Flocks → HE Dispatch → Print Invoice: the printed invoice now shows "Flock Age" (in weeks, as of the dispatch date) next to the Flock number, computed from the flock\'s placement date — same age calculation already used elsewhere in the app (Flock List/Detail/P&L Summary).' },
  { date: '2026-07-21', tag: 'Fix', text: 'Ran a full sweep across the app for the same silent-1000-row-truncation issue found in Monthly Attendance Grid, and fixed every unbounded/lifetime query that was still at risk: Flock Management (FCR stats, first-egg-date), Stock Statement (lifetime HE produced/dispatched), Sales Invoice Register (HE Dispatch + NHE invoice lists), Egg Stock (daily records, HE dispatch, NHE sales), Payment Planning (cash balance), Planning → Quarterly Budget (current cash balance), NHE Sales (party dues + employee dues summaries), and Purchase Order Rate Analysis (PO history + GRN rate trend, including GRN\'s own list page which had a flat 2,000-row cutoff instead of the 1,000-row default). All now page through their full result set the same way Cash Book/Bank Ledger were fixed earlier — no more silently understated totals or missing rows once historical data grows past a few thousand records.' },
  { date: '2026-07-21', tag: 'Fix', text: 'Employees → Monthly Attendance Grid: viewing "All Sites" for a month with a large employee count could silently drop a large fraction of employees\' attendance from the grid — the underlying attendance query only ever returned Supabase/PostgREST\'s default single-request cap of 1,000 rows, and a month across every site easily needs several times that. Whichever employees happened to sort past the cutoff showed all-blank cells despite their attendance being saved correctly (confirmed via the database directly). The query now pages through the full result set, same fix already applied earlier to Cash Book/Bank Ledger/other reports for the same underlying issue.' },
  { date: '2026-07-20', tag: 'Fix', text: 'Employees → Monthly Attendance Grid: any employee who has since resigned/been deactivated was completely missing from the grid for EVERY month, including past months where they were actually active and have real attendance saved — because the employee list only ever checked "is this person active right now", with no awareness of which month was being viewed. Their attendance still existed in the database (which is why Attendance Register/other pages showed it correctly) but the Grid had no row to show it against. Now includes anyone who was active during the selected month (joined on/before month-end, and not left before month-start), not just currently-active employees.' },
  { date: '2026-07-20', tag: 'Fix', text: 'Employees → Monthly Attendance Grid: attendance you just entered and saved would sometimes keep showing the old values on screen right after Save, even though it was actually saved correctly (Attendance Register always showed it right, because that page reads fresh from the database with no local edit-tracking). The Grid protects cells you\'re still typing into from being overwritten by a background refresh — but it was clearing that protection AFTER refreshing instead of before, so the refresh treated your just-saved cells as still "in progress" and skipped updating them on screen. Save now clears that tracking first, so the Grid reflects what you just saved immediately.' },
  { date: '2026-07-20', tag: 'New', text: 'Purchase → GRN → Add GRN: one bill can now hold multiple items in a single form. GRN No/Date/Farm/Supplier/Invoice/Vehicle are entered once at the top; each item (category, item, qty, rate, GST, batch/expiry, etc.) gets its own "Item N" block below, with "+ Add Another Item" to add more and a Remove button per block — Save writes one GRN record per item, all sharing the same bill details. Previously each item needed a separate Add GRN with the same GRN No typed by hand, or the bulk Import. Editing an existing GRN still edits one item at a time, same as before.' },
  { date: '2026-07-18', tag: 'New', text: 'Flocks → Bulk Daily Entry (Shed mode): the flock-level Medicine box now supports more than one medicine per flock/day — an "+ Add another" button adds another Medicine + Qty row (e.g. a vaccine and a supplement on the same day), each saved as its own entry; a ✕ button removes a row. (Flock mode still allows only one medicine per flock/day for now.)' },
  { date: '2026-07-18', tag: 'Fix', text: 'Flocks → Bulk Daily Entry (Shed mode): Medicine entered against an individual shed was silently failing to save every time — the medicine_usage table has no shed_id column at all, so the per-shed save was sending a field that doesn\'t exist and erroring on every attempt, while the app still showed "Saved successfully" because that error only went to the browser console. Medicine in Shed mode is now one flock-level entry (applies to the whole flock for the day), shown in its own box below the shed table next to HE Grade Breakdown — matching how Flock mode already worked and matching the real table design. Per-shed medicine tracking may come later as a separate change.' },
  { date: '2026-07-18', tag: 'New', text: 'Purchase → Purchase Orders → Import PO: added a "Link Items to Master" step to the import preview — every unique item name in the file is checked against Items Master, auto-matched where possible, and any that don\'t match must be explicitly linked to an existing item or marked "Keep as new item" before Import is enabled. Previously any spelling/spacing difference from a past import silently created a duplicate item.' },
  { date: '2026-07-18', tag: 'Fix', text: 'Accounts → Pending Payments: editing a bill that came from a GRN linked to a Purchase Order never showed the PO Number, even after linking — the database trigger that creates the Pending Payments row from a GRN never wrote it, in any version, going back to before the PO link even existed. Now correctly pulled from the linked PO and backfilled onto existing bills.' },
  { date: '2026-07-18', tag: 'New', text: 'Accounts → Pending Payments: Credit Days now falls back to the linked Purchase Order\'s own Credit Limit (days) whenever the vendor has no Credit Days set in Parties Master — previously it only ever came from the vendor\'s own Parties Master value. Also fixed the Purchase Order import (PDF path), which was silently dropping the PO\'s own credit-days figure instead of saving it, even though the field already existed and the manual Add PO form saved it correctly.' },
  { date: '2026-07-18', tag: 'Fix', text: 'Purchase → GRN → Add/Edit GRN: typing a different Basic Amount or Total Amount than the auto-calculated qty×rate figure was silently discarded on save — the calculated value always won. Now respects whichever amount you actually typed into those two fields this session (shown alongside the auto-calc reference value, not replacing it); changing qty/rate/GST%/other charges again resets back to following the live calculation.' },
  { date: '2026-07-18', tag: 'Improved', text: 'Added a proper page-size selector (25/50/75/100 rows, with Prev/Next) to GRN log, Purchase Intent, Bags (empty bag sales), Vaccination Records, HE Rate Register, Invoice Register, and Sales Invoice Register — instead of everything rendering onto one long page. More list pages will get the same treatment in a follow-up pass.' },
  { date: '2026-07-18', tag: 'Fix', text: 'Accounts → Pending Payments / Bank Ledger / Cash Book / Vendor & Buyer Advances: fixed 4 places where editing or deleting a record didn\'t keep its linked entries in sync — bulk-deleting a Paid bill in Pending Payments now clears its Cash Book/Bank Ledger entries instead of orphaning them; editing an already-linked Bank Ledger transaction now re-syncs the paired Cash Book entry and the source bill/sale\'s own paid/received date & amount; Cash Book\'s Edit/Delete are now locked (🔒) on any row auto-generated by another page, since changing those directly bypassed whatever created them; and an Advance already adjusted against a bill/invoice can no longer be deleted out from under it.' },
  { date: '2026-07-18', tag: 'Improved', text: 'Several reports and money-total pages (Cash Book, Bank Ledger, Party Ledger, Pending Payments, Vendor/Buyer Advances, Opening Balances, Party Outstanding, TDS Payable/Receivable, Flock P&L Summary) now fetch results in full instead of silently truncating past 1,000 rows on a wide date range or all-time view — the underlying database only ever returns 1,000 rows per request unless the frontend explicitly asks for more pages, which most of these previously didn\'t.' },

  { date: '2026-07-17', tag: 'Fix', text: 'Employees → Attendance Register (year-wise working days) was only ever reflecting Bulk Salary/Salary Entry — never Monthly Attendance Grid saves — because it reads salary_monthly.days_worked, a column the Grid\'s save never wrote to (only absent/present/month/OT day counts). Real attendance entered in the Grid now updates days_worked too, so the Register no longer needs Bulk Salary re-run to catch up. This also closes the same days-defaulted-to-full-month issue previously hand-fixed once already (June/July 2026, migration 240) for whenever Bulk Salary\'s own attendance auto-fill step gets skipped.' },
  { date: '2026-07-17', tag: 'New', text: 'Employees → Daily Attendance / Monthly Attendance Grid: an employee whose salary for that month is already marked paid now shows a 🔒 lock badge and can no longer have that month\'s attendance edited (status buttons, OT hours, and selection are all disabled, and they\'re excluded from Save) — prevents attendance quietly drifting from what was actually paid out.' },
  { date: '2026-07-17', tag: 'Fix', text: 'Employees → Monthly Attendance Grid: after the grid loaded once for a month, it stopped picking up any further changes to that month\'s attendance for the rest of the session — including a day marked separately via Daily Attendance. It now merges in new data on every refresh, only protecting cells you\'ve clicked but not yet saved.' },
  { date: '2026-07-17', tag: 'New', text: 'Planning → CA Analysis of Financial Result (admin only, third tab): reproduces your CA\'s exact statement layout (Turnover → Cost of Production → Gross Profit → Indirect Expenses → Net Profit → Quantitative Info → Working Capital → Ratios) for any date range. Product Sales/Other Income (Cash Book), Electricity (Electricity Bills), Direct Wages/Employee Benefits (Salary, split by designation), Sundry Debtors/Creditors (Party Ledger, split by party type), Cash & Bank (Cash Book + Bank Ledger), and Production Qty (Daily Records) are computed from real data. RM Consumed, Other Direct/Indirect Expenses, Payment to Promoters, Depreciation, Net Worth, Inventories, Loans & Advances, Other Current Assets, and Current Liabilities (Expenses) have no data source in the app yet — those are plain manual entry fields, clearly marked, not guessed. Save a period as a named snapshot to keep for comparison.' },
  { date: '2026-07-17', tag: 'New', text: 'Planning (admin only, new sidebar item): two forward-looking tools not visible to any other role. (1) Upcoming Flock Cost Projection — pick a planned placement + reference flocks and get a week-by-week feed/mortality/medicine/revenue projection built from those flocks\' real historical data (a "Generated" view), or type in your own assumptions instead (a "Manual" view) — both save side by side so you can compare plan vs system vs actual later. (2) Quarterly Budget & Cash Flow — a "Generated" forecast projects each month of the chosen quarter from your trailing 6-month cash book average, starting from today\'s actual cash+bank balance; a "Manual" view lets you enter your own budget per month per cash book category for a real Plan vs Actual comparison once the quarter runs.' },
  { date: '2026-07-17', tag: 'New',      text: 'Reports → Daily Summary: rebuilt to match the real daily WhatsApp report format — per-flock Birds/Feed/shed-wise Production (HD% with day-over-day variance + mortality)/Egg grades vs standard curve/Medicine & Vaccine/Water Sanitation/Spray, plus site-level Manpower (grouped by each employee\'s actual Designation from Employees + Attendance), including sites with no active flock. One button copies every active flock in one paste. Feed Standard and Egg Weight show "—" — no data source exists for either yet.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Reports → Daily Summary: Manpower and Medicine/Vaccine sections were first built with guessed categories (Incharge/Supervisor/Worker/Security designation buckets; a plain "sanitizer or not" medicine split) instead of checking the real configured values. Manpower now lists each site\'s employees grouped by their actual Designation value (ordered per Masters → Config → Designation), whatever those turn out to be — not a fixed set of 4 roles. Medicine/Vaccine now groups by each item\'s real Medicines Master Type (medicine, vaccine, sanitizer, supplement, disinfectant, ...), with its own labeled section per type actually used that day, instead of assuming everything that isn\'t "sanitizer" belongs under one label.' },
  { date: '2026-07-17', tag: 'Improved', text: 'Reports → Daily Summary: Manpower now splits the "Helper" designation into "Helper (Male)" / "Helper (Female)" using each employee\'s Gender field — every other designation is unaffected, shown as one combined line same as before.' },
  { date: '2026-07-17', tag: 'Improved', text: 'Reports → Daily Summary: added a Site filter (checkbox multi-select, defaults to "All Sites" when nothing\'s ticked — tick 1, several, or all) and replaced the separate per-flock Copy buttons + "Copy All Flocks" button with a single Copy button that copies whatever the page currently shows for the selected sites.' },
  { date: '2026-07-17', tag: 'Improved', text: 'Reports → Daily Summary: trimmed the per-flock text — Birds (Op/Mort/Recv/C-s/Close) and egg grades (HE/JE/TE/BE/LE/Total) now print as one line each instead of 5-6 separate lines; the unused Feed Std / Egg Wt Act / Egg Wt Std placeholder lines ("—", no data source exists for them) were dropped entirely; and Medicine/Vaccine/Sanitation/Spray sections only list entries that actually happened that day (a single "None" line when empty) instead of padding out to fixed blank-numbered lines.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Vaccination Schedule / Vaccination Records: picking an entry from the "Link to Medicines Master" field on the normal Add/Edit form was overwriting your typed vaccine name with the master\'s own name — inconsistent with the dedicated Link Unlinked Vaccines tool, which correctly keeps your name and registers it as an alias instead. Both now behave the same way: your typed name is kept and registered as a permanent alias of the linked medicine, only falling back to the master\'s name when nothing was typed yet.' },
  { date: '2026-07-17', tag: 'Improved', text: 'Masters → Vaccination Schedule → Link Unlinked Vaccines: replaced the auto-guessed "+" combo split with a manual "Split…" button on every row — since "+" doesn\'t always mean two vaccines (sometimes it\'s part of one product\'s own name) and "AND"/other wording needed splitting too. Now edit the line into one vaccine per row yourself in a text box, then split — accurate every time instead of a guess.' },
  { date: '2026-07-17', tag: 'New',      text: 'Masters → Vaccination Schedule: added "Link Unlinked Vaccines" — for each schedule entry not yet linked to Medicines Master, it suggests a likely existing match (ignoring spacing/punctuation/case differences, e.g. "AviPro Thymovac (Live)" vs "Avipro Thymovac") so it can be linked and registered as a permanent alias in one click instead of creating a duplicate. Falls back to a quick "Create New" (Manufacturer required) when there\'s genuinely no match, which creates the Items Master + Medicines Master entries together and links the schedule row automatically.' },
  { date: '2026-07-17', tag: 'New',      text: 'Vaccination: recording a vaccine-type entry in Medicine & Vaccine now automatically creates/updates a matching row in Vaccination Records — no more entering the same vaccination twice. Auto-added rows are marked "Auto" and are edited/deleted from Medicine & Vaccine (their source), not directly. Also linked Vaccination Schedule and Vaccination Records to Medicines Master (which is itself linked to Items Master) with an optional searchable "Link to Medicines Master" picker on both — previously vaccine names were disconnected free text with no relation to Items Master at all.' },
  { date: '2026-07-17', tag: 'Improved', text: 'App-wide: converted every dropdown bound to a large, dynamic list (Flock, Site/Farm, Shed, Party/Supplier, Medicine/Vaccine, Employee) to a searchable dropdown — type to filter instead of scrolling a long native list. Covers ~95 spots across Flock Management, Feed Mill, Accounts, Employees, Reports, Masters, Admin Centre, Import, and Hatchability. Short, fixed-option dropdowns (e.g. Medicine Type, Breed, Category) were intentionally left as-is, since search adds no value there.' },
  { date: '2026-07-17', tag: 'Improved', text: 'Feed Mill → Finished Feed Stock: the Opening Stock / Adjustment entry now has an optional "Recipe / Formula" field, so you can note which recipe/version an opening quantity was made from — reference only, doesn\'t affect Balance or cost calculations.' },
  { date: '2026-07-17', tag: 'New',      text: 'Feed Mill → Finished Feed Stock: added an "Add Opening Stock / Adjustment" entry, for feed types that already had stock before being tracked in this app (e.g. L3 as of a past date) — previously Balance was purely Produced minus Dispatched with no way to seed an opening quantity. Kept as a separate ledger from Production, so it doesn\'t skew per-formula cost/consumption reports the way a fake Production entry would.' },
  { date: '2026-07-17', tag: 'New',      text: 'Masters → Vaccination Schedule: added a Notes field after Product (for withdrawal periods, storage instructions, etc.) — the column already existed on the underlying table but had no UI. Now editable on Add/Edit, included in Export/Template/Import, and shown in Print.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Feed Mill → Feed Stock Status: rate showed "—" for several ingredients (40 Degree, Choline Chloride 60%, DCAD, etc.) that had real stock/balance — the rate lookup only ever looked at GRN purchase transactions, missing anything priced only via an Inventory opening-stock or adjustment entry. Now matches the same any-inward-transaction rate logic already used elsewhere (Inventory, Medicine).' },
  { date: '2026-07-17', tag: 'New',      text: 'Flock Management → Medicine Entry: added "Allocation" and "Balance" tabs — Allocation records medicine/vaccine issued from the central store to a specific flock (separate from usage, which tracks what a flock actually consumed); Balance shows Allocated vs Used vs remaining Balance per flock+medicine, computed from both. Runs alongside the existing usage tracking, not a replacement — nothing about recording consumption changed. The flock\'s own Medicine tab also now shows this Allocated/Used/Balance breakdown for that one flock.' },
  { date: '2026-07-17', tag: 'New',      text: 'Feed Mill → Production log: added Rate/kg and Total Cost columns directly on the main list (same GRN/opening/adjustment rate source as the existing per-ingredient drill-down modal), plus a Total Cost summary card — previously this cost breakdown was only visible one batch at a time inside the 🔍 items modal.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Two spots showed a computed rate with raw floating-point precision instead of 2 decimals (e.g. ₹32.21555194700855/kg, ₹8.617521367521368): Flock Detail → Feed tab\'s "Recipe Rate/kg" column, and Feed Mill → Production\'s per-ingredient cost breakdown modal (the same modal\'s own TOTAL row already rounded correctly — the fix just applies that everywhere). Underlying calculations are unchanged, only how the number displays.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Medicine rates were computed two different, disconnected ways across the app: the flock\'s own "Medicine" tab looked up rate only from GRN receipts (showing "not in GRN" — cost ₹0 — for anything priced only via an Inventory opening/adjustment entry, e.g. Aquamax/Solucal), while the Medicine & Vaccine list page (all flocks) never looked anything up at all — it just displayed whatever was manually typed into the entry\'s rate box, blank for almost every row. Both now resolve rate the same way, from stock_ledger\'s latest inward price (covers GRN receipts AND Inventory opening/adjustment entries), with the old manually-typed rate kept only as a last-resort fallback. The Medicine & Vaccine list also gained a running Total row.' },
  { date: '2026-07-17', tag: 'New',      text: 'Flock Management → Vaccination Records: added a "Vaccination Plan" section — pick a flock and see every schedule entry\'s computed due date (from the flock\'s placement date), with a status badge (Given/Overdue/Due Soon/Upcoming) and a one-click "Mark Given" that pre-fills a real vaccination record instead of the full Add form. Also fixed the page\'s "Vaccination Schedule Reference" table, which was silently showing nothing at all — it queried columns (week_no/dose_no/notes) that don\'t exist on the real table (age_label/dose/product), so the query failed every time.' },
  { date: '2026-07-17', tag: 'New',      text: 'Masters → Vaccination Schedule: added a Print button (next to Export) that prints the schedule — or just the selected rows — as a formatted report with the company letterhead, same as other printable reports in the app.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Masters → Vaccination Schedule import (and every other bulk import in the app, since the fix is in the shared file parser): a real vaccination schedule file with a title row above the actual column headers (e.g. "RECOMMENDED VACCINATION SCHEDULE" in row 1, with S.No/Age/... in row 2) always failed with "No valid rows" — the importer only ever read row 1 as headers. It now scans the first few rows and uses the first one that actually looks like a header row. Also widened the Vaccine Name column match to recognize "Name of Vaccine" (not just "Vaccine Name"), since that\'s the header text used in real-world schedule exports.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Inventory: "Toxfin 360 Dry" (and any item with the same pattern) was showing as 2 entries despite one in Items Master — 76 stock_ledger/feed production rows for it were never linked (item_id blank) and were split across two spellings ("Toxfin 360 Dry" vs "Toxfin360 Dry"), so Inventory\'s fallback grouped them into a separate phantom row from the real one. A prior Items Master "Merge" only fixes rows that already share a duplicate item — it has no step for rows that were never linked at all, so it couldn\'t reach this. Backfilled all the orphaned rows to the correct item and registered the spaced spelling as a known alias. Also hardened Inventory so any future orphaned row folds into the right item by name match (ignoring spacing/punctuation differences) instead of forking a new entry.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Purchase Intent (New/Edit): Manufacturer genuinely wasn\'t visible here, unlike other item pickers — this screen\'s Item field is a free-text box (by design, so you can request items not yet in Items Master), not the searchable dropdown the earlier fix touched, so it never picked up that change. Now shows "Mfr: <name>" under the Item field once it matches (or is linked to) an Items Master entry, and the type-ahead suggestions show manufacturer alongside the name too — without changing what actually gets saved as the item name.' },
  { date: '2026-07-17', tag: 'New',      text: 'Feed Mill → Formulas: added a Duplicate button on each formula (copy icon, next to Edit) — opens the Add Formula screen pre-filled with the source formula\'s details and all its ingredients (code suffixed "-COPY", version reset to 1) so you can create a new age/weight variant without re-typing every ingredient from scratch.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Feed Mill → Feed Stock Status: added a search box (by code/ingredient name on the Feed tab, by name/type on the Medicine & Vaccine tab) — previously there was no way to filter the list at all, unlike every other stock/master list in the app.' },
  { date: '2026-07-17', tag: 'Fix',      text: 'Purchase Intent (and every other screen using the alias-aware item picker) now shows each item\'s Manufacturer next to its name and lets you search by it — previously the picker query never fetched the manufacturer column at all, so it silently never appeared even after Items Master made it a required field for Medicine/Equipment.' },
  { date: '2026-07-17', tag: 'New',      text: 'Masters → Vaccination Schedule: added Template download and bulk Import (CSV/Excel), matching the pattern already used on other Masters pages — previously entries could only be added one at a time. Import skips rows that already match an existing Age + Vaccine Name entry instead of creating duplicates.' },
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
      'A saved transfer can be edited or deleted safely — the birds, the daily record and both sheds\' allocations follow the change. Ticking "Final Transfer" works on an edit too, not only on the first entry.',
      'From Shed / To Shed matter: the birds are taken off the source shed and put on the destination shed, in both the daily record and the shed allocation, so the destination shed becomes available in Bulk Daily Entry straight away. Deleting the transfer puts them back on both sides.',
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

  // ── HATCH ANALYSIS ────────────────────────────────────────────────────────────
  {
    id: 'hatch-analysis',
    icon: <Egg size={20}/>,
    label: 'Hatch Analysis',
    color: 'bg-violet-600',
    intro: 'Why a hatch was good or bad, and whose result it is. Every egg set ends up in exactly one of five places — broken in transit, infertile, blaster, unhatched, or hatched — and WHICH one decides who can fix it. Infertile is the breeder flock (males, mating, flock age); unhatched is incubation, the hatchery\'s own result; broken is transport; blasters are egg handling and storage. The page keeps them apart on purpose, because a single hatch % blames whoever happens to be nearest.',
    workflows: [
      {
        title: 'Compare hatcheries fairly',
        path: 'Flock Management → Hatch Analysis → Hatchery-wise',
        steps: [
          { text: 'The stacked bar shows where every egg went at each hatchery, as a share of eggs set. Read the purple band (unhatched) first — that is the part the hatchery controls.' },
          { text: 'A hatchery is judged on UNHATCHED, not on hatch %. Hatch % also moves with how fertile the eggs arrived, which is the breeder\'s doing, so ranking on hatch % alone can blame a hatchery for a flock\'s problem.', note: 'The verdict line at the top says which hatchery is worst on unhatched, by how much, and roughly how many chicks that gap costs on the eggs it actually received.' },
          { text: 'Use Like-for-like — pick one flock and the table compares hatcheries on that flock\'s eggs alone. Hatcheries do not all get the same eggs.', note: 'A gap that survives like-for-like belongs to the hatchery. A gap that vanishes was never theirs — it was which eggs they were sent. The page prints both spreads so you can see which case you are in.' },
        ]
      },
      {
        title: 'Flock-wise — standard against actual',
        path: 'Flock Management → Hatch Analysis → Flock-wise',
        steps: [
          { text: 'Grey bar is Std (what the STD Hatch % expected), green is what actually hatched. The gap is your shortfall in chicks, per flock.' },
          { text: 'The second chart splits every egg by where it went, so a flock hatching badly because of infertility looks different from one hatching badly for any other reason.' },
          { text: 'The verdict line names the flock losing the most eggs to infertility and how many eggs that is — a breeder matter no hatchery can fix, since no incubator can hatch an infertile egg.' },
        ]
      },
      {
        title: 'Week-wise — was it a bad week or a bad hatchery?',
        path: 'Flock Management → Hatch Analysis → Week-wise',
        steps: [
          { text: 'Hatch % by setting week against the standard, with infertile and unhatched drawn alongside.' },
          { text: 'A week where the hatch line dips while infertile stays flat is an INCUBATION week. A week where infertile climbs with it is an EGG week — the flock, the weather, or storage.', note: 'This is the quickest way to tell a one-off hatchery problem from a season.' },
        ]
      },
      {
        title: 'Egg Age — the loss you control',
        path: 'Flock Management → Hatch Analysis → Egg Age',
        steps: [
          { text: 'Egg age is the days between an egg being LAID and being SET. Eggs held too long lose hatchability whatever the hatchery does, which makes this one of the few losses entirely in your hands.' },
          { text: 'It needs a dispatch link, because the laying date lives on the HE dispatch, not on the batch. Until a batch is linked it cannot appear here — the tab says how many are linked rather than drawing a chart from thin air.', note: 'Link them in Hatch Batches → open a batch → Link Dispatch Invoice. Every batch you link shows up here automatically.' },
          { text: 'Once linked: a dot per batch (bigger dot = more eggs) plus a 0-3 / 4-5 / 6-7 / 8+ day band table, so a holding-time policy can be argued from your own figures.' },
        ]
      },
      {
        title: 'Money — what each loss is worth',
        path: 'Flock Management → Hatch Analysis → Money',
        steps: [
          { text: 'Type your chick rate (₹ per chick). If the batches carry their own Chick Rate the page uses that instead and says so — it never assumes a rate.' },
          { text: 'Each loss is valued as one egg lost = one chick not sold, split by who owns it, plus what closing each gap would be worth.' },
          { text: 'Read those as the size of the prize, not a forecast — no flock or hatchery ever closes a gap completely.' },
        ]
      },
    ],
    tips: [
      'Every figure is computed from summed counts, so a 200-egg batch cannot swing a percentage as hard as a 30,000-egg one.',
      'The flock, hatchery, setting-date, flock-age and season filters at the top apply to all five tabs at once.',
      'Season is the season the eggs were SET in (Summer Mar-Jun, Monsoon Jul-Oct, Winter Nov-Feb), not the flock\'s laying season. Use it with the hatchery filter before blaming a hatchery: hatch % on this farm ran 85.1% in Nov 25 and 74.7% in May 26, and no hatchery caused that swing on its own.',
      'CAUTION on infertility before December 2025: the imported hatchery sheets left Infertile BLANK on the September-November batches, so those months read 0.0% infertile. That is missing data, not perfect fertility — do not read a rise in infertility across that boundary as a real trend.',
      'Infertile and blaster percentages are taken on SETTING eggs (received less broken); hatch % and Std % are on ALL eggs set, which is the farm\'s own definition.',
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
          { text: 'Hatchery — pick from the list. Hatcheries are added under Masters → Hatcheries; the batch is linked to that record, not to typed text, which is what makes the Hatchery Comparison tab possible.', note: 'If the list is empty, add your hatcheries under Masters → Hatcheries first.' },
          { text: 'Setting No — hatchery\'s own batch/setting number (e.g. S-2026-01).', note: 'Useful for matching with hatchery reports later.' },
          { text: 'Link Dispatch Invoice — select the HE dispatch this batch came from. Auto-fills Flock, Invoice No, and Received qty.', note: 'Dispatches of this flock from the 3 weeks before the setting date are listed first, marked ★, with their production-date range. Link it — without a link Age@Prod and Egg Age stay blank, because nothing else in the app can say when those eggs were laid. If exactly one dispatch of the flock matches your Received quantity, it links itself.' },
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
          { text: 'STD Hatch % — typed in from the hatchery report. The app never calculates this one; instead it DRIVES Std Chicks: Std = Setting Eggs × STD Hatch % ÷ 100.', note: 'Different from Hatch %, which the app works out itself as Chicks Sold ÷ Setting Eggs.' },
          { text: 'Std Chicks — comes from your STD Hatch % against setting eggs, and re-derives if Received or Broken changes. Leave STD Hatch % blank and it falls back to Hatched − Culled − Rejects instead.', note: 'Std = Standard/saleable chicks. Type over it and your figure is kept, with both cross-checks shown underneath. A Std of 0 that you typed is kept as 0.' },
          { text: 'Unhatched — eggs that did not hatch.' },
          { text: 'Rejects — rejected chicks (wrong sex, deformed).' },
          { text: 'Chicks Sold — how many chicks were sold from this batch. Chick Rate (₹/chick). Revenue auto-calculates.' },
          { text: 'Save. All % columns (Broken%, Inf%, Blst%, Hatch%, Unhatch%, Reject%) are computed automatically in the table.' },
          { text: 'A Std BELOW the chicks that hatched is normal — it just means the batch came in under its standard, and the form says by how many in a plain grey note. Only a Std above the hatchable eggs (setting − infertile − blasters) is impossible; that one warns in red before saving.' },
          { text: 'The five tiles at the top are worked out from the summed counts of the batches currently on the page, never from a stored percentage: Total Eggs Set, Std Chicks (the standard), Chicks Hatched (what the hatchery reported), Avg Std = Std ÷ total eggs set, and Avg Hatchability = chicks hatched ÷ TOTAL eggs set.', note: 'This is why imported batches count towards them exactly like typed ones. Hatchability is on the all-eggs-set base, breakage included — not hatched ÷ fertile eggs, which measures the incubator alone and reads about 9 points higher. Avg Std sits on the same base so the two read against each other; Hatchability turns orange when it falls below Std.' },
          { text: 'Filter by flock and by setting-date range (From / To, either one optional). The filter applies to the table, the TOTAL row, all five tiles, the Hatchery Comparison AND the Excel export together — export what you can see, and the sheet always matches the screen.', note: 'The line under the page heading says how many batches the figures cover, and out of how many in total.' },
        ]
      },
      {
        title: 'Pipeline — eggs sent but no hatch report yet',
        path: 'Flock Management → Hatch Batches → Pipeline (Awaiting Hatch)',
        steps: [
          { text: 'The Pipeline starts from the HE DISPATCH, so eggs appear the moment they leave the farm — you no longer have to create a batch by hand for them to be visible.' },
          { text: 'Awaiting hatch report — dispatches to a hatchery ticked "Sends hatchability report" in the master, with no report entered yet. Days Since turns red past 25 days.' },
          { text: 'Hatchery not assigned — where the load went has not been recorded yet. Set the hatchery from the dropdown on the row as soon as you know; nothing is lost while it is unassigned.' },
          { text: 'Enter Report — opens the batch form already linked to that dispatch, with flock, invoice, eggs and date filled in.' },
          { text: 'Hatcheries that do not send reports are deliberately NOT chased here — they appear only under "Hatchery not assigned" until you set their hatchery, then they drop out.' },
        ]
      },
      {
        title: 'Hatchery Comparison',
        path: 'Flock Management → Hatch Batches → Hatchery Comparison',
        steps: [
          { text: 'One line per hatchery: batches, received, setting, broken%, inf%, blst%, chicks sold, Hatch%, STD Hatch%, Std, reject%, unhatch%.' },
          { text: 'Percentages are recomputed from the summed counts, not averaged across batches, so a small batch cannot outweigh a large one.' },
          { text: 'STD Hatch% is the egg-weighted average of the figures you entered from the hatchery reports.' },
          { text: 'Batches entered before the hatchery dropdown existed still appear, marked "typed, not linked" — edit the batch and pick the hatchery to fold them in.' },
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
        title: 'Review the workforce for a month',
        path: 'HR & Payroll → Workforce Review',
        steps: [
          { text: 'Pick the Month, and a Site if you want just one. Everything on the page follows both.' },
          { text: 'Headcount strip — worked last month, joined, not there now, worked this month, net change. "Worked" means at least one day marked P, OT or H.' },
          { text: 'Not there this month — anyone who worked last month and has no attendance at all this month, with their last present date. This is the list to check first: it catches people who left without the leaving date being filled in.' },
          { text: 'Daily Presence, Site-wise — one row per date, one column per site, showing how many were present. P and OT count as 1 day, H counts as ½.' },
          { text: 'Day-wise Absentees — full-day absent, half day, weekly off and Not Marked per date. Click any row to see the names in each group.' },
          { text: 'Not Marked is NOT absence — it means no entry was made for that person on a day when entries were made for others. Go back to Attendance and fill those in, otherwise their paid days come out short.' },
          { text: 'Workers by Designation and Site — headcount per designation per site, split male / female, counted from who actually worked this month.' },
          { text: 'Site Summary — attendance %, absent, half, weekly off, OT days and OT hours per site. Available Days excludes weekly offs, so a rostered day off never reads as a shortfall.' },
          { text: 'Absence by Employee — worst first, so the repeat absentees are at the top.' },
          { text: 'Print or Export Excel gives you every panel — the Excel puts each panel on its own sheet.' },
          { text: 'Attendance is recorded against a site, not a flock, so this page is site-wise only. A flock-wise split would be invented wherever two flocks share a site.' },
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
        title: 'Challan paid from another company / partner account',
        path: 'HR & Payroll → Statutory Filing → Remittance Tracker',
        steps: [
          { text: 'Use this when you transfer money to another company or a partner and THEY deposit the challan — TDS, ESI, PF, PT, Advance Tax, GST (including reverse charge on rent) or a late fee.' },
          { text: 'FIRST, make sure the payer exists in the app. If it is a company, add it under Purchase → Suppliers (any supplier or customer can be chosen as a payer). If it is one of your partners, they are already listed. Nothing is fixed in the app — whoever you add appears in the dropdown automatically.' },
          { text: 'STEP 1 — record the transfer. Accounts → Bank Ledger → add a payment from your account to that payer. This is NOT an expense; it is money moved to someone holding it for you. Put "Funds for statutory challans" in the description.' },
          { text: 'STEP 2 — record the challan. Employees → Statutory Filing, pick the month, find the liability row and click Mark Remitted. Enter the challan / acknowledgement number and the deposit date.' },
          { text: 'STEP 3 — set the payer. In the same form, change "Paid from our bank" to "Paid via <name>". Save. The row then shows "via <name>" under the payment date.' },
          { text: 'IMPORTANT: do NOT add a second bank or cash entry for the challan itself. No money left your account on that date — it left in Step 1. The app deliberately posts nothing to the ledger for a challan paid by someone else, so entering it again would double-count the expense.' },
          { text: 'Advance Tax and Late Fee / Interest are typed in by hand, because unlike TDS, GST, PF, ESI and PT there is no source data in the app to total them from. Enter the amount in the same form when marking them remitted.' },
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
      'If another company pays your challans, add them once under Purchase → Suppliers — then they appear in the "Paid via" list on Statutory Filing forever after.',
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
      {
        title: 'Enter a physical stock count (audit)',
        path: 'Inventory → Physical Audit → + New Audit',
        steps: [
          { text: 'Date counted — the day you walked the store, not today.', note: 'Book stock is worked out as it stood on THAT date, so a count entered a week late still compares against the right figure.' },
          { text: 'Period From — the start of the period the shortage belongs to. It decides which flocks share the cost: feed sent between that date and the audit date. Leave blank to share across every flock ever fed.' },
          { text: 'Category — leave as All categories, or pick one (Feed Ingredient, Medicine, Vaccine, Packaging …) to count one store at a time.' },
          { text: 'Start Audit, then type the COUNTED quantity against each item. Leave an item blank if you did not count it — blanks are ignored, never treated as zero.' },
          { text: 'Difference, rate and value fill in themselves. Rate is the weighted average of everything received up to the audit date, not the last purchase price.' },
          { text: 'Save Count as often as you like — saving posts nothing.' },
          { text: 'Post when the count is complete. Stock is corrected on the audit date and the shortage value is charged to the flocks.', note: 'Excess stock corrects the ledger only — it is not written back as a credit to any flock.' },
          { text: 'Unpost undoes it: the stock corrections and the expense entries are removed and the audit goes back to draft.' },
        ]
      },
    ],
    tips: [
      'Stock Page (Feed Mill → Stock) shows current raw material and finished feed stock in real time.',
      'Inventory → Physical Audit is the right place for a stock count — Inventory → Adjustments asks for the DIFFERENCE against today, which is the wrong question for someone who has just counted with a weighing scale.',
      'A posted audit keeps the book figure it was posted against. Later movements do not move it, so the record always agrees with the correction it produced.',
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
      'To read attendance across a period rather than one month — say 15 April to 10 July — use HR & Payroll → Attendance & Salary — Date Range. It totals P/A/H/WO/OT, OT hours, paid days and the salary paid in that period, per employee and overall, and exports to CSV. It is read only: marking still happens here.',
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
          { text: 'Enter a Title and optional Description, pick a Type — Daily/Team, Compliance, or Admin. Admin also sees Development, for outstanding work on the app itself.' },
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
      'What is still outstanding on the APP itself lives here too — filter Type = "Development (admin only)". Each item says whether it waits on you (a sheet, a rate, a decision) or on me, so "what is pending?" is one screen instead of a scroll through old messages.',
      'Development tasks are visible to admin ONLY, and that is enforced by the database, not just hidden on the page — another user cannot see one even by asking the server directly.',
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
        const matchingSteps = wf.steps.filter(st => st.text.toLowerCase().includes(q) || String(st.note ?? '').toLowerCase().includes(q))
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
