import React, { useState } from 'react'
import {
  BookOpen, Bird, Calendar, ArrowRightLeft, ShoppingCart, Users, Zap,
  Package, FileSpreadsheet, BarChart2, Settings, ChevronRight, ChevronDown,
  AlertCircle, CheckCircle, Info, ArrowRight, Hash, MapPin
} from 'lucide-react'

// ── last updated ───────────────────────────────────────────────────────────────
const LAST_UPDATED = '2026-06-17'

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
          { text: 'Select the Date. The previous day\'s closing count auto-fills as today\'s opening.' },
          { text: 'Bird Count section: Enter Opening Female and Opening Male.' },
          { text: 'Transfer Female/Male — birds physically moved to another farm on this day. Leave 0 if no transfer.' },
          { text: 'Cull Female/Male — birds removed and sold (culls, lame, weak). Leave 0 if none.', note: 'When you save a Cull entry here OR record a Bird Sale in NHE & Bird Sales, both update these numbers automatically.' },
          { text: 'Mortality Female/Male — birds that died today.' },
          { text: 'Click "Auto-compute Closing" — the app calculates: Closing = Opening − Transfer − Cull − Mortality.' },
          { text: 'Feed: enter Female Feed (kg) and Male Feed (kg) with their feed types.' },
          { text: 'Eggs: Total Eggs, HE Total. If no shed is selected, also enter HE Grade A/B/C.' },
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
            <div className="flex items-center gap-1"><Hash size={10}/>Daily entry → Daily Entry</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Bird sold → NHE & Bird Sales</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Transfer flock → Flock Transfer</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Pay salary → Employees</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Electricity bill → Electricity</div>
            <div className="flex items-center gap-1"><Hash size={10}/>Import Excel → Import Data</div>
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
