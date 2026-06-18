import React, { useState } from 'react'
import {
  BookOpen, Bird, Calendar, ArrowRightLeft, ShoppingCart, Users, Zap,
  Package, FileSpreadsheet, BarChart2, Settings, ChevronRight, ChevronDown,
  AlertCircle, CheckCircle, Info, ArrowRight, Hash, MapPin, CreditCard,
  Sparkles, Clock
} from 'lucide-react'

// ── last updated ───────────────────────────────────────────────────────────────
const LAST_UPDATED = '2026-06-18'

// ── changelog ─────────────────────────────────────────────────────────────────
interface ChangeEntry { date: string; tag: 'New' | 'Fix' | 'Improved'; text: string }
const CHANGELOG: ChangeEntry[] = [
  { date: '2026-06-18', tag: 'New',      text: 'Vendors Master tab added in Purchase & Payments — lists all unique vendors from POs, Payments, and Vendor Banks. Delete all data for a vendor (POs + payments + bank details) in one step. Supports bulk select and bulk delete.' },
  { date: '2026-06-18', tag: 'Improved', text: 'Vendor Banks tab now has checkboxes and bulk delete — select multiple bank records and delete them at once.' },
  { date: '2026-06-18', tag: 'Improved', text: 'Feed Formulas: Feed Type is now linked to the master feed types (BCM, BGM, L1, etc.) instead of a hardcoded Breeder/Broiler/Layer dropdown. Flock Type auto-derives from the selected feed type name. Filter bar also uses master feed types.' },
  { date: '2026-06-18', tag: 'Fix',      text: 'GRN bulk delete: fixed "invalid input syntax for uuid: undefined" error when selecting all 100+ records. Rows with missing IDs are now safely skipped.' },
  { date: '2026-06-18', tag: 'Fix',      text: 'GRN data not being restored — previous bulk deletions were failing silently (no error shown) due to the uuid error. Data appeared to reappear but was never actually deleted. Now fixed.' },
  { date: '2026-06-17', tag: 'New',      text: 'Chick Placements tab added to each flock — record staggered chick intake per shed per day. Total Placed updates automatically.' },
  { date: '2026-06-17', tag: 'New',      text: 'Invoice Register added under Accounts — track all supplier invoices (chick, feed, medicine, electricity). Link to flock or farm. Mark payment. Import/Export Excel.' },
  { date: '2026-06-17', tag: 'New',      text: 'Chick invoice fields added to flock creation form — auto-creates an invoice record in Invoice Register.' },
  { date: '2026-06-17', tag: 'New',      text: 'Medicine Purchases linked to Invoice Register — when a medicine purchase has an invoice number, a matching invoice record is auto-created/updated in Invoice Register.' },
  { date: '2026-06-17', tag: 'New',      text: 'GRN page: checkboxes and bulk delete added — select multiple GRN records and delete them at once.' },
  { date: '2026-06-17', tag: 'New',      text: 'Shed capacity shown in Flock placements — Shed Capacity, Box Usage, and Utilization % columns added per placement row. Utilization is colour-coded green/orange/red.' },
  { date: '2026-06-17', tag: 'Improved', text: 'Vaccination Schedule: Clear All button added to start fresh. Single delete now shows proper error if it fails.' },
  { date: '2026-06-17', tag: 'Improved', text: 'Parties master: bulk delete now works correctly for large selections (chunked in batches of 50 to avoid URL length limit).' },
  { date: '2026-06-17', tag: 'Improved', text: 'Purchase Orders: bulk delete fixed — was silently swallowing errors, causing data to appear after deletion. Now correctly errors and is chunked in batches of 50.' },
  { date: '2026-06-17', tag: 'Improved', text: 'Parties can now be deleted even if they have linked GRN, HE Dispatch, or NHE Sales records — those links are set to null on delete (no more bad request).' },
  { date: '2026-06-17', tag: 'Improved', text: 'Daily Entry: Egg Collection fields (Total Eggs, HE, grades, JE/TE/BE) are now hidden during Rearing phase and only appear from Laying Start Date.' },
  { date: '2026-06-17', tag: 'Improved', text: 'Daily Entry: When a shed has a Placement batch for the selected date, opening bird count auto-fills from the batch.' },
  { date: '2026-06-17', tag: 'Improved', text: 'Payments & Bank Ledger: Checkboxes, bulk delete, edit, import, and export added.' },
  { date: '2026-06-17', tag: 'Improved', text: 'Item Master renamed from "Feed Ingredients" in sidebar.' },
  { date: '2026-06-17', tag: 'Fix',      text: 'Flock creation Save button was disconnected — fixed.' },
  { date: '2026-06-17', tag: 'Fix',      text: 'Edit flock form now loads correct data (rearing farm, laying farm, chick rate, paid counts).' },
  { date: '2026-06-17', tag: 'Fix',      text: 'Laying Site now shows correctly in Flock List (database view updated).' },
  { date: '2026-06-17', tag: 'Fix',      text: 'GRN table name fixed across all pages — was incorrectly using "grn_entries" internally.' },
  { date: '2026-06-17', tag: 'Fix',      text: 'Dashboard low-stock alert now reads correct tables and columns.' },
  { date: '2026-06-17', tag: 'Fix',      text: 'All mutations now show error toasts when something fails (previously silent).' },
]

// ── types ──────────────────────────────────────────────────────────────────────
interface Step { text: string; note?: string; warning?: string }
interface Workflow { title: string; path: string; steps: Step[] }
interface Section {
  id: string
  icon: React.ReactNode
  label: string
  color: string           // tailwind bg class for accent
  intro: string
  workflows: Workflow[]
  tips?: string[]
}

// ── content ────────────────────────────────────────────────────────────────────
const SECTIONS: Section[] = [
  // ── CHANGELOG / AUDIT ─────────────────────────────────────────────────────────
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
          { text: 'Save the flock. An invoice record is automatically created in Accounts → Invoice Register, linked to this flock.', note: 'The invoice amount is auto-calculated from (Paid Female + Paid Male) × Chick Rate.' },
          { text: 'Go to Invoice Register to mark it paid when payment is made.' },
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
          { text: 'Column names: date, opening_female, opening_male, feed_female_kg, transfer_female, transfer_male, cull_female, cull_male, mortality_female, mortality_male, closing_female, closing_male, total_eggs, he_eggs, etc.' },
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
          { text: 'Save. The transfer count is automatically deducted from the daily record\'s Transfer Female/Male for that date.' },
        ]
      },
    ],
    tips: [
      'Partial transfers (moving in batches over multiple days) are supported — just record one entry per day without ticking Final Transfer.',
      'After the Final Transfer, open the flock and verify the Laying Farm and Laying Start Date are correct.',
    ]
  },

  // ── BIRD SALES (NHE & BIRD SALES) ─────────────────────────────────────────────
  {
    id: 'bird-sales',
    icon: <ShoppingCart size={20}/>,
    label: 'NHE & Bird Sales',
    color: 'bg-orange-600',
    intro: 'All non-hatching egg sales and bird sales are recorded here. Egg sales (Jumbo, Table, Broken) are straightforward. Bird sales use a weight-based calculation and automatically deduct from the flock\'s daily bird count.',
    workflows: [
      {
        title: 'Record a bird sale (cull / lame / weak / sex error)',
        path: 'Flock Management → NHE & Bird Sales → Add Sale',
        steps: [
          { text: 'Select Flock and Sale Date.' },
          { text: 'Sale Type: choose "Bird Sales".' },
          { text: 'Bird Sex: Female, Male, Sex Error, or Mixed.' },
          { text: 'Category: Cull (most common), Lame, Weak, Other.' },
          { text: 'No. of Birds — count of birds being sold.' },
          { text: 'Avg Weight/bird (kg) — weigh a sample and enter average. The app calculates Total Weight = qty × avg weight.' },
          { text: 'Rate per kg (₹) — agreed price per kg live weight. Total Amount = total weight × rate/kg auto-fills.', note: 'Amount auto-calculates as you type. You can override it manually if needed.' },
          { text: 'Payment section: enter Cash amount and Online/NEFT amount separately. Total is shown.' },
          { text: 'Vehicle No — truck/vehicle number for the load.' },
          { text: 'Party — select the buyer from the party master.' },
          { text: 'Save. The cull count is automatically added to the daily record for that flock on that date (cull_female or cull_male depending on Bird Sex).' },
        ]
      },
      {
        title: 'Record an egg sale (JE / TE / BE)',
        path: 'Flock Management → NHE & Bird Sales → Add Sale',
        steps: [
          { text: 'Sale Type: Jumbo Eggs, Table Eggs, or Broken/Crack Eggs.' },
          { text: 'Enter Qty (number of eggs), Unit (nos), Rate (₹/egg), Amount auto-calculates.' },
          { text: 'Party, DC No, Remarks as needed.' },
        ]
      },
    ],
    tips: [
      'Female and Sex Error birds both go into cull_female in daily records.',
      'Mixed type does NOT auto-deduct from stock — use Female or Male where possible.',
      'The Bird Sales Summary at the top of the page shows totals, kg sold, and average ₹/kg.',
    ]
  },

  // ── HE DISPATCH ───────────────────────────────────────────────────────────────
  {
    id: 'he-dispatch',
    icon: <Package size={20}/>,
    label: 'HE Dispatch',
    color: 'bg-teal-600',
    intro: 'Hatching Eggs dispatched to hatcheries are recorded here with grade breakdown per production date.',
    workflows: [
      {
        title: 'Record an HE dispatch',
        path: 'Flock Management → HE Dispatch → Add Dispatch',
        steps: [
          { text: 'Select Flock, Dispatch Date, Hatchery/Party.' },
          { text: 'DC No (Dispatch Challan number).' },
          { text: 'Add lines: each production date gets Grade A, Grade B, Grade C egg counts and rate.' },
          { text: 'Free Eggs (2%) and Invoice Eggs are auto-calculated.' },
          { text: 'Amount = Invoice Eggs × Rate.' },
          { text: 'Setting Date, Hatch Date, Chicks Sold — fill when the hatchery reports back.' },
        ]
      },
    ],
    tips: [
      'One dispatch can cover eggs from multiple production dates (enter one line per date in the dispatch lines).',
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
          { text: 'OT Hours column — enter hours of overtime worked on a normal Present day (e.g. 2.5 hrs).' },
          { text: 'Save All button saves the entire day at once.' },
        ]
      },
      {
        title: 'Enter monthly salary',
        path: 'HR & Payroll → Salary Entry → + Add',
        steps: [
          { text: 'Select Employee and Month.' },
          { text: 'Click "📋 Auto-fill Attendance" — this reads the attendance for that month and fills Days Worked and any pending Advances automatically.' },
          { text: 'Review: Basic, HRA, Arrears, OT Bonus. Gross is auto-calculated.' },
          { text: 'Deductions: ESI (only if gross ≤ ₹21,000), PF, PT (auto-slabbed: ≤15k→0, ≤20k→150, >20k→200).' },
          { text: 'Advance deduction auto-filled from employee_advances table.' },
          { text: 'Net Salary = Gross − All Deductions.' },
          { text: 'Payment Mode: Cash or Online.' },
          { text: 'Save.' },
        ]
      },
    ],
    tips: [
      'PT (Professional Tax) is auto-calculated based on gross salary slabs — do not enter it manually.',
      'ESI is not deducted if gross salary exceeds ₹21,000.',
      'Use "Quick Generate All" to create salary for all employees of a farm in one step.',
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
          { text: 'Bar chart shows site-wise breakdown.' },
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
          { text: 'GRN Date, GRN/Invoice No, Supplier/Party.' },
          { text: 'Ingredient (Maize, Soya, etc.) — must exist in Masters → Ingredients.' },
          { text: 'Quantity (kg), Rate per kg, Total Amount.' },
          { text: 'Vehicle No for the truck.' },
          { text: 'Save. Stock automatically increases.' },
        ]
      },
      {
        title: 'Set up feed formulas',
        path: 'Feed Mill → Formulas → + Add Formula',
        steps: [
          { text: 'Formula Code — your internal code (e.g. BRD-PRE-V2).' },
          { text: 'Feed Type — select from the master feed types (BCM, BGM, L1, L2, etc.). This is the required link to the feed type master. Flock Type (Breeder/Layer/Broiler) auto-fills from the feed type name.', note: 'Feed Types must be set up in Masters → Feed Types before formulas can be created.' },
          { text: 'Week From / Week To — the age range (weeks) this formula applies to.' },
          { text: 'Add ingredients with percentage and kg per 1000 kg batch. Total % should add up to 100.' },
          { text: 'Save. Formula can then be selected when recording feed production.' },
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

  // ── IMPORT / EXCEL CONVERTER ──────────────────────────────────────────────────
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
          { text: 'Step 2 — Upload File: drag and drop your .xlsx or .csv file onto the upload area, or click Browse.' },
          { text: 'Step 3 — Map Columns: the app tries to auto-match your column names to app fields. Green = matched. For unmatched fields use the dropdown to pick your column manually.', note: 'Your file does not need to have the exact column names — the mapping step handles the difference.' },
          { text: 'For Daily Records and Flock Transfers: also select the Flock from the dropdown at top right.' },
          { text: 'Click "Preview Mapped Data" to see all rows with OK / Warn / Error status.' },
          { text: 'Step 4 — Review: fix any red-error rows in your Excel if needed, re-upload. Green rows will import.' },
          { text: 'Click "Import N Valid Rows". Done.' },
        ]
      },
      {
        title: 'Download a blank template',
        path: 'Import Data → ✦ Excel Converter → Step 2 → Download Template button',
        steps: [
          { text: 'After selecting the import type, click Download Template on the upload screen.' },
          { text: 'A CSV with the exact expected columns and one example row is downloaded.' },
          { text: 'Fill your data in this format for the smoothest import.' },
        ]
      },
    ],
    tips: [
      'The converter handles Indian date formats (DD.MM.YY, DD/MM/YYYY, DD-MM-YYYY) and Excel serial dates automatically.',
      'If the same record already exists (same flock + date, or same employee + month), it is updated — not duplicated.',
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
          { text: '1. Farms — add each farm/site (Kethereddypally, Agraharam Potlapally, etc.) with code and location.' },
          { text: '2. Sheds — add sheds for each farm. Each shed belongs to one farm. Set shed_no and shed_type (layer/breeder).' },
          { text: '3. Parties — add buyers, suppliers, hatcheries with their type.' },
          { text: '4. Ingredients — raw materials used in feed (Maize, Soya, DORB, etc.).' },
          { text: '5. Meters — electricity meters with their farm and USC number.' },
          { text: '6. Feed Types — L1, L2, L3, BCM, BGM, etc.' },
          { text: '7. Vaccination Schedule — standard schedule per age week for each vaccine.' },
        ]
      },
    ],
    tips: [
      'You cannot enter daily records without sheds. You cannot enter GRN without ingredients. Set up masters first.',
      'Parties with type "Buyer" appear in NHE/Bird Sale party dropdowns. Type "Supplier" appears in GRN.',
    ]
  },

  // ── PURCHASE & PAYMENTS ───────────────────────────────────────────────────────
  {
    id: 'purchase-payments',
    icon: <CreditCard size={20}/>,
    label: 'Purchase & Payments',
    color: 'bg-emerald-700',
    intro: 'Track every purchase made for the farm — feed ingredients, medicines, equipment, services. Each purchase is raised as a Purchase Order (PO). Payments are recorded separately against each PO and tracked until fully paid. The Bank Ledger shows all money going out.',
    workflows: [
      {
        title: 'Raise a Purchase Order (PO)',
        path: 'Purchase & Payments → + New PO',
        steps: [
          { text: 'PO No — your internal PO number (e.g. PO-2025-001). One PO can have multiple line items (ingredients or products).' },
          { text: 'Vendor Name — type the supplier name. Existing vendors auto-suggest.' },
          { text: 'Financial Year — select the FY this PO belongs to (e.g. 2025-26).' },
          { text: 'Item/Ingredient — what is being purchased (Maize, Soya, Medicine, etc.).' },
          { text: 'Quantity and Unit (kg, bags, nos, ltrs).' },
          { text: 'Rate per unit and Total Amount.' },
          { text: 'Expected Delivery Date if known.' },
          { text: 'Save. The PO status starts as "Pending".' },
          { text: 'To add more items to the same PO, click the + icon on the PO row in the list.' },
        ]
      },
      {
        title: 'Record stock receipt against a PO',
        path: 'Purchase & Payments → PO row → 📦 receipt icon',
        steps: [
          { text: 'When goods physically arrive, click the green box/package icon on the PO row.' },
          { text: 'Enter the quantity actually received (may differ from ordered quantity).' },
          { text: 'Enter the actual rate and invoice amount.' },
          { text: 'Vehicle No and Bill/Invoice No.' },
          { text: 'Save. PO status updates to "Received". Stock in Feed Mill also increases if it is a raw material.' },
        ]
      },
      {
        title: 'Record a payment against a PO',
        path: 'Purchase & Payments → Payments tab → + Add Payment',
        steps: [
          { text: 'Select the PO No from the dropdown — the vendor name and outstanding amount fill automatically.' },
          { text: 'Payment Date.' },
          { text: 'Amount Paid.' },
          { text: 'Payment Mode: Cash, NEFT, RTGS, Cheque, UPI.' },
          { text: 'Bank Reference No / UTR / Cheque No — important for reconciliation.' },
          { text: 'TDS deducted (if applicable) — enter TDS amount separately.' },
          { text: 'Remarks (e.g. "Partial payment, balance in July").' },
          { text: 'Save. Outstanding balance on that PO reduces automatically.' },
          { text: 'A PO can have multiple payments spread over time. The system tracks Total Invoiced vs Total Paid vs Outstanding for each vendor.' },
        ]
      },
      {
        title: 'View pending / overdue payments',
        path: 'Purchase & Payments → Pending Payments tab',
        steps: [
          { text: 'This tab shows all POs where payment is not fully done.' },
          { text: 'Filter by vendor or financial year.' },
          { text: 'Outstanding column = Invoiced Amount − Total Paid so far.' },
          { text: 'Click on a vendor row to see all their POs and payment history.' },
        ]
      },
      {
        title: 'View vendor-wise outstanding (Party Outstanding)',
        path: 'Reports → Party Outstanding',
        steps: [
          { text: 'Shows total amount owed to each vendor across all POs.' },
          { text: 'Filter by vendor name or date range.' },
          { text: 'Use this when a vendor calls to ask how much is pending.' },
        ]
      },
      {
        title: 'Delete a vendor and all their data',
        path: 'Purchase & Payments → Vendors Master tab',
        steps: [
          { text: 'The Vendors Master tab lists every unique vendor name from Purchase Orders, Payments, and Vendor Bank Details.' },
          { text: 'Each row shows how many POs, payments, and whether bank details exist for that vendor.' },
          { text: 'Click the trash icon on a row to delete ALL data for that vendor — their POs, payments, and bank details are permanently removed.', warning: 'This cannot be undone. Use only when you want to completely remove a vendor and all their history.' },
          { text: 'To delete multiple vendors at once, tick checkboxes and click "Delete All Data for Selected".' },
          { text: 'After deletion, Vendor Statement and Rate Analysis will no longer show those vendor names.' },
        ]
      },
    ],
    tips: [
      'Always record stock receipt before recording payment — the receipt confirms goods arrived.',
      'TDS: if you deduct TDS before paying the vendor, enter TDS amount in the payment form. The vendor\'s outstanding is reduced by the full invoice amount, not just what was paid in cash.',
      'One PO can cover multiple deliveries — just record a new receipt each time a truck arrives.',
      'Bank Ledger (Accounts → Cash Book) shows all outgoing payments in date order — use this to match with your bank statement.',
      'Party Outstanding report is the fastest way to answer "how much do we owe to [vendor]?"',
    ]
  },

  // ── INVOICE REGISTER ──────────────────────────────────────────────────────────
  {
    id: 'invoices',
    icon: <CreditCard size={20}/>,
    label: 'Invoice Register',
    color: 'bg-violet-600',
    intro: 'Every invoice you receive from a supplier — for chicks, feed, medicines, electricity, or any other purchase — should be recorded here. This gives you a single place to track what is owed, what is partially paid, and what is fully settled.',
    workflows: [
      {
        title: 'Add a supplier invoice',
        path: 'Accounts → Invoice Register → Add Invoice',
        steps: [
          { text: 'Invoice No — the number printed on the supplier\'s invoice.' },
          { text: 'Invoice Date — date on the invoice.' },
          { text: 'Invoice Type — select one: Chick Supply, Feed/GRN, Medicine, Electricity, Labour/Contractor, Other.' },
          { text: 'Supplier — select from Party Master, or type the name in the free-text field.' },
          { text: 'For Chick Supply invoices — also select the Flock. This links the invoice directly to that flock.' },
          { text: 'Farm — the farm/site this invoice relates to.' },
          { text: 'Basic Amount, GST%, GST Amount — enter Basic and GST%, then click outside the field to auto-calculate Total.' },
          { text: 'Total Amount (required) — the final invoice value.' },
          { text: 'Due Date — when payment must be made. Overdue invoices are highlighted red.' },
          { text: 'Payment Status — Unpaid, Partial, or Paid.' },
          { text: 'Save.' },
        ]
      },
      {
        title: 'Mark an invoice as paid (or partially paid)',
        path: 'Accounts → Invoice Register → Pay button on the row',
        steps: [
          { text: 'Click the green "Pay" button on any unpaid or partial invoice row.' },
          { text: 'Enter the amount paid so far (can be less than total for partial).' },
          { text: 'Save. Status automatically updates: full amount = Paid, less than total = Partial.' },
          { text: 'For partial payments, click Pay again when additional payments are made.' },
        ]
      },
      {
        title: 'Import invoices from Excel',
        path: 'Accounts → Invoice Register → Template → Import',
        steps: [
          { text: 'Click Template to download the Excel format with all columns and one example row.' },
          { text: 'Fill your invoice data in the same format.' },
          { text: 'Key columns: invoice_no, invoice_date, supplier_name, source_type (chick/grn/medicine/electricity/labour/other), flock_no, farm_name, basic_amount, gst_pct, total_amount, payment_status, paid_amount, due_date.' },
          { text: 'Click Import and select your file. Flock numbers and farm names are matched automatically.' },
        ]
      },
      {
        title: 'Chick invoice auto-created from flock',
        path: 'Flock Management → + New Flock → Chick Invoice section',
        steps: [
          { text: 'When creating a new flock, fill in Invoice No and Invoice Date in the Chick Invoice section.' },
          { text: 'On save, the app automatically creates an invoice record in Invoice Register linked to that flock.', note: 'The invoice amount is set to Paid Count × Chick Rate. You can edit it later in Invoice Register if needed.' },
        ]
      },
    ],
    tips: [
      'Overdue invoices (past due date, not paid) are shown with a red highlight and "Overdue" label.',
      'Use the filter bar to view by type (e.g. only Chick Supply), or by status (e.g. only Unpaid).',
      'Invoice Register does not affect stock — it is a financial tracking tool only.',
      'For feed invoices: the GRN entry already has an Invoice No field. You can also add those invoices here for payment tracking.',
    ]
  },

  // ── REPORTS ───────────────────────────────────────────────────────────────────
  {
    id: 'reports',
    icon: <BarChart2 size={20}/>,
    label: 'Reports',
    color: 'bg-rose-600',
    intro: 'Reports pull data from all modules. No data entry here — only viewing.',
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
          { text: 'Cash Book — Accounts → Cash Book for daily cash transactions.' },
          { text: 'Party Outstanding — amount owed to/by each party.' },
        ]
      },
    ],
    tips: [
      'Most reports have date range filters. Start with a broad range and narrow down.',
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
          {/* Navigation path */}
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
          {/* Steps */}
          <div className="space-y-3">
            {wf.steps.map((s, i) => <StepItem key={i} step={s} num={i + 1}/>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────────
export const HelpGuidePage: React.FC = () => {
  const [active, setActive] = useState('flock-setup')
  const section = SECTIONS.find(s => s.id === active)!

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-gray-700"/>
            <span className="font-bold text-gray-800">App Guide</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Updated: {LAST_UPDATED}</p>
        </div>
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
        {/* Quick index */}
        <div className="p-4 border-t border-gray-100 mt-2">
          <p className="text-[10px] uppercase font-semibold text-gray-400 mb-2">Quick index</p>
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-1"><Hash size={10}/>Chick intake → Flock Setup</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Daily entry → Daily Entry</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Egg fields missing → Daily Entry</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Bird sold → NHE & Bird Sales</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Transfer flock → Flock Transfer</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Invoice received → Invoice Register</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Mark invoice paid → Invoice Register</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Pay salary → Employees</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Electricity bill → Electricity</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Raise PO → Purchase & Payments</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Record payment → Purchase & Payments</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Import Excel → Import Data</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Who changed what → What's New</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {/* Section header */}
          <div className="flex items-start gap-4">
            <div className={`${section.color} w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
              {section.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{section.label}</h1>
              <p className="text-gray-500 mt-1 leading-relaxed">{section.intro}</p>
            </div>
          </div>

          {/* Tips box */}
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

          {/* Workflows */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Step-by-Step Workflows</h2>
            {section.workflows.map((wf, i) => (
              <WorkflowCard key={i} wf={wf} accent={section.color}/>
            ))}
          </div>

          {/* Changelog panel — only shown on changelog section */}
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

          {/* Footer note */}
          <div className="border-t border-gray-200 pt-4 flex items-start gap-2">
            <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0"/>
            <p className="text-xs text-gray-400">
              This guide is part of the app and is updated whenever workflows change.
              If something doesn't match what you see, the app may have been updated — refresh this page.
              Last updated: <strong>{LAST_UPDATED}</strong>.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
