// Invoice print utility — opens a styled print window
// Company details are embedded here; update if address changes.
import { flockAgeWeeks, flockAgeWeeksDays } from './utils'

const LOGO_SVG = `<svg width="30" height="30" viewBox="0 0 64 64" style="flex-shrink:0"><rect width="64" height="64" rx="10" fill="#14532d"/><text x="32" y="43" font-family="Georgia, 'Iowan Old Style', serif" font-weight="700" font-size="30" letter-spacing="-1" text-anchor="middle"><tspan fill="#f7f1e4">N</tspan><tspan fill="#d6ab5f">F</tspan></text></svg>`
const LOGO_ROW_CSS = `<style>.co-name-row{display:flex;align-items:center;gap:8px;}</style>`

const CO = {
  name: 'Naraendra Farms',
  addr1: '5-9-22/21, 1st Floor, JVR Amrit Enclave',
  addr2: 'Adarsh Nagar, Hyderabad',
  state: 'Telangana',
  stateCode: '36',
  gstin: '36ABJFM1393C1ZC',
  phone: '+91 73370 83931',
  bank: 'Kotak Mahindra Bank Ltd',
  acNo: '0045360473 (CC A/c)',
  ifsc: 'KKBK0007463',
  branch: 'Himayat Nagar',
}

function openPrint(html: string) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Allow pop-ups to print invoice'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;padding:20px}
  h1{font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
  h2{font-size:13px;font-weight:700;text-transform:uppercase;text-align:center;margin:8px 0 4px}
  .sub{font-size:10px;color:#444}
  .header{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:8px}
  .header-right{text-align:right}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{background:#f0f0f0;border:1px solid #aaa;padding:4px 6px;font-size:10px;text-align:center}
  td{border:1px solid #aaa;padding:4px 6px;font-size:10px;vertical-align:top}
  .tr{text-align:right}
  .tc{text-align:center}
  .bold{font-weight:700}
  .total-row{background:#f8f8f8;font-weight:700}
  .section{margin-top:10px}
  .two-col{display:flex;gap:16px}
  .two-col > div{flex:1}
  .label{font-weight:700;font-size:10px;color:#555;text-transform:uppercase}
  .box{border:1px solid #bbb;padding:6px;border-radius:3px;margin-top:3px}
  .sign-row{display:flex;justify-content:space-between;margin-top:30px;padding-top:8px;border-top:1px solid #aaa}
  .sign-row-4{display:flex;justify-content:space-between;gap:12px;margin-top:40px;padding-top:8px;border-top:1px solid #aaa}
  .sign-row-4 > div{flex:1;text-align:center;padding-top:30px;border-top:1px solid #aaa;font-weight:700;font-size:10px}
  .note{font-size:9px;color:#666;margin-top:4px}
  @media print{body{padding:10px}button{display:none!important}}
`

function fmt(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function inr(n: number) {
  return 'Rs. ' + (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Generic tabular report print (Employees pages: abstracts, registers, etc.) ──
export function printReport(opts: {
  title: string
  subtitle?: string
  headers: string[]
  rows: (string | number | null | undefined)[][]
  rightAlignFrom?: number   // column index from which cells right-align (numbers); default: none
  footerRow?: (string | number | null | undefined)[]   // optional bold TOTAL row
}) {
  const { title, subtitle, headers, rows, rightAlignFrom, footerRow } = opts
  const thead = headers.map(h => `<th>${h}</th>`).join('')
  const tbody = rows.map(r => `<tr>${r.map((c, i) =>
    `<td${rightAlignFrom != null && i >= rightAlignFrom ? ' style="text-align:right"' : ''}>${c ?? ''}</td>`
  ).join('')}</tr>`).join('')
  const tfoot = footerRow ? `<tfoot><tr class="total-row">${footerRow.map((c, i) =>
    `<td${rightAlignFrom != null && i >= rightAlignFrom ? ' style="text-align:right"' : ''}>${c ?? ''}</td>`
  ).join('')}</tr></tfoot>` : ''
  const html = `<!doctype html><html><head><title>${title}</title>
  <style>${CSS}</style>${LOGO_ROW_CSS}</head><body>
    <div class="header">
      <div>
        <div class="co-name-row">${LOGO_SVG}<h1>${CO.name}</h1></div>
        <div class="sub">${CO.addr1}</div>
        <div class="sub">${CO.addr2}, ${CO.state} — ${CO.stateCode}</div>
        <div class="sub">GSTIN: ${CO.gstin} · Ph: ${CO.phone}</div>
      </div>
      <div class="header-right">
        <h2>${title}</h2>
        ${subtitle ? `<div class="sub">${subtitle}</div>` : ''}
        <div class="sub">Printed: ${new Date().toLocaleString('en-IN')}</div>
      </div>
    </div>
    <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody>${tfoot}</table>
  </body></html>`
  openPrint(html)
}

// ── Employee Advance voucher — a plain payment-voucher layout, not a
// tabular report, for printing a single advance record for signature.
export interface AdvanceVoucherRecord {
  employee_name: string
  emp_id?: string | null
  farm_name?: string | null
  advance_date: string
  advance_type: string   // 'cash' | 'egg' | 'other'
  amount: number
  egg_qty?: number | null
  egg_rate?: number | null
  narration?: string | null
  salary_month?: string | null
  payment_mode?: string | null
  bank_name?: string | null
}
export function printAdvanceVoucher(d: AdvanceVoucherRecord) {
  const typeLabel = d.advance_type === 'cash' ? 'Cash Advance' : d.advance_type === 'egg' ? 'Egg Advance' : 'Advance'
  const salaryMonthLabel = d.salary_month
    ? new Date(d.salary_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—'
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Advance Voucher — ${d.employee_name}</title>
  <style>${CSS}</style>${LOGO_ROW_CSS}</head><body>
  <div class="header">
    <div>
      <div class="co-name-row">${LOGO_SVG}<h1>${CO.name}</h1></div>
      <div class="sub">${CO.addr1}</div>
      <div class="sub">${CO.addr2}</div>
    </div>
    <div class="header-right">
      <h2>${typeLabel} Voucher</h2>
      <div class="sub">Date: ${fmt(d.advance_date)}</div>
    </div>
  </div>

  <div class="two-col section">
    <div>
      <div class="label">Employee</div>
      <div class="box">
        <div class="bold">${d.employee_name}${d.emp_id ? ` (${d.emp_id})` : ''}</div>
        ${d.farm_name ? `<div class="sub">${d.farm_name}</div>` : ''}
      </div>
    </div>
    <div>
      <div class="label">Deduct From Salary Month</div>
      <div class="box">${salaryMonthLabel}</div>
    </div>
  </div>

  <div class="section">
    <table>
      <thead><tr><th>Type</th><th>Details</th><th>Amount</th></tr></thead>
      <tbody>
        <tr>
          <td class="tc">${typeLabel}</td>
          <td>${d.advance_type === 'egg' && d.egg_qty ? `${d.egg_qty} eggs × Rs.${d.egg_rate}` : (d.narration || '—')}</td>
          <td class="tr bold">${inr(d.amount)}</td>
        </tr>
      </tbody>
      <tfoot><tr class="total-row"><td colspan="2" class="tr">Total</td><td class="tr">${inr(d.amount)}</td></tr></tfoot>
    </table>
    ${d.advance_type === 'cash' ? `<p class="note">Paid via ${d.payment_mode ?? 'Cash'}${d.bank_name ? ` — ${d.bank_name}` : ''}</p>` : ''}
    ${d.narration && d.advance_type !== 'egg' ? '' : ''}
  </div>

  <div class="sign-row-4">
    <div>Employee Signature</div>
    <div>Prepared By</div>
    <div>Approved By</div>
    <div>Accounts</div>
  </div>
  </body></html>`
  openPrint(html)
}

// ── Purchase Invoice voucher — one invoice on the company letterhead, for
// filing against the vendor's bill or attaching to a payment. Shows the full
// money breakdown (basic / GST / TDS / paid / balance) rather than a list.
export interface PurchaseInvoiceVoucher {
  invoice_no: string
  invoice_date: string
  supplier_name: string
  source_type?: string | null
  flock_label?: string | null
  farm_name?: string | null
  basic_amount?: number | null
  gst_pct?: number | null
  gst_amount?: number | null
  total_amount: number
  tds_amount?: number | null
  paid_amount?: number | null
  payment_status?: string | null
  due_date?: string | null
  remarks?: string | null
}
export function printPurchaseInvoiceVoucher(d: PurchaseInvoiceVoucher) {
  const tds = d.tds_amount ?? 0
  const paid = d.paid_amount ?? 0
  const balance = (d.total_amount ?? 0) - paid - tds
  const row = (label: string, value: string, bold = false) =>
    `<tr><td>${label}</td><td class="tr${bold ? ' bold' : ''}">${value}</td></tr>`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Purchase Invoice — ${d.invoice_no}</title>
  <style>${CSS}</style>${LOGO_ROW_CSS}</head><body>
  <div class="header">
    <div>
      <div class="co-name-row">${LOGO_SVG}<h1>${CO.name}</h1></div>
      <div class="sub">${CO.addr1}</div>
      <div class="sub">${CO.addr2}, ${CO.state} — ${CO.stateCode}</div>
      <div class="sub">GSTIN: ${CO.gstin} · Ph: ${CO.phone}</div>
    </div>
    <div class="header-right">
      <h2>Purchase Invoice</h2>
      <div class="sub">Invoice No: <strong>${d.invoice_no}</strong></div>
      <div class="sub">Date: ${fmt(d.invoice_date)}</div>
    </div>
  </div>

  <div class="two-col section">
    <div>
      <div class="label">Supplier</div>
      <div class="box">
        <div class="bold">${d.supplier_name || '—'}</div>
        ${d.source_type ? `<div class="sub">${d.source_type}</div>` : ''}
      </div>
    </div>
    <div>
      <div class="label">Allocation</div>
      <div class="box">
        <div>${d.flock_label || d.farm_name || '—'}</div>
        ${d.due_date ? `<div class="sub">Due: ${fmt(d.due_date)}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="section">
    <table>
      <thead><tr><th>Particulars</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        ${d.basic_amount != null ? row('Basic Amount', inr(d.basic_amount)) : ''}
        ${d.gst_amount != null && d.gst_amount > 0 ? row(`GST${d.gst_pct ? ` @ ${d.gst_pct}%` : ''}`, inr(d.gst_amount)) : ''}
        ${row('Invoice Total', inr(d.total_amount), true)}
        ${tds > 0 ? row('Less: TDS Deducted', `- ${inr(tds)}`) : ''}
        ${paid > 0 ? row('Less: Amount Paid', `- ${inr(paid)}`) : ''}
      </tbody>
      <tfoot><tr class="total-row"><td class="tr">Balance Payable</td><td class="tr">${inr(balance)}</td></tr></tfoot>
    </table>
    <p class="note">Status: <strong>${(d.payment_status ?? 'unpaid').toUpperCase()}</strong>${d.remarks ? ` · ${d.remarks}` : ''}</p>
  </div>

  <div class="sign-row-4">
    <div>Prepared By</div>
    <div>Checked By</div>
    <div>Approved By</div>
    <div>Accounts</div>
  </div>
  </body></html>`
  openPrint(html)
}

// ── Side-by-side column grid print (Site-wise Designation Count, etc.) ─────────
export function printColumnGrid(opts: {
  title: string
  subtitle?: string
  grandTotal?: number
  columns: { header: string; rows: [string, string | number][]; total: number }[]
}) {
  const { title, subtitle, grandTotal, columns } = opts
  const colHtml = columns.map(col => `
    <div class="col">
      <div class="col-head">${col.header}</div>
      <table class="col-table">
        <thead><tr><th>Designation</th><th style="text-align:right">NOS</th></tr></thead>
        <tbody>${col.rows.map(([label, n]) => `<tr><td>${label}</td><td style="text-align:right">${n}</td></tr>`).join('')}</tbody>
        <tfoot><tr class="col-total"><td>Total</td><td style="text-align:right">${col.total}</td></tr></tfoot>
      </table>
    </div>`).join('')
  const html = `<!doctype html><html><head><title>${title}</title>
  <style>
    ${CSS}
    .grid { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; }
    .col { flex: 1 1 200px; min-width: 180px; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; }
    .col-head { background: #14532d; color: #f7f1e4; font-weight: 700; font-size: 11px; text-align: center; padding: 6px; text-transform: uppercase; }
    .col-table { width: 100%; border-collapse: collapse; margin: 0; }
    .col-table th, .col-table td { border: 1px solid #ddd; padding: 4px 6px; font-size: 10px; }
    .col-table thead th { background: #f0f0f0; }
    .col-total { font-weight: 700; background: #f7f7f7; }
  </style>${LOGO_ROW_CSS}</head><body>
    <div class="header">
      <div>
        <div class="co-name-row">${LOGO_SVG}<h1>${CO.name}</h1></div>
        <div class="sub">${CO.addr1}</div>
        <div class="sub">${CO.addr2}, ${CO.state} — ${CO.stateCode}</div>
      </div>
      <div class="header-right">
        <h2>${title}</h2>
        ${subtitle ? `<div class="sub">${subtitle}</div>` : ''}
        ${grandTotal != null ? `<div style="font-size:20px;font-weight:700;color:#14532d">${grandTotal}</div>` : ''}
        <div class="sub">Printed: ${new Date().toLocaleString('en-IN')}</div>
      </div>
    </div>
    <div class="grid">${colHtml}</div>
  </body></html>`
  openPrint(html)
}

// ── HE Dispatch Invoice ───────────────────────────────────────────────────────
export interface HEPrintOpts {
  companyAddr?: boolean    // seller header (default true)
  buyerDetails?: boolean   // Bill To box (default true)
  bankDetails?: boolean    // Bank Details box (default true)
  supplyDetails?: boolean  // Supply Details box (default true)
  lorry?: boolean
  driver?: boolean
  outTime?: boolean
  boxes?: boolean
}

export interface HEDispatchRecord {
  id: string
  dispatch_date: string
  invoice_no: string | null
  dc_no: number | null
  flock_no?: number
  flock_placement_date?: string | null
  total_dispatched: number
  free_eggs: number
  invoice_eggs: number
  rate: number | null
  amount: number | null
  tds_pct: number | null
  tds_amount: number | null
  buyer_gstin: string | null
  party_name: string
  party_address?: string
  hsn_code?: string
  vehicle_type?: string | null
  lorry_no?: string | null
  driver_phone?: string | null
  out_time?: string | null
  boxes_20lb?: number | null
  boxes_23lb?: number | null
  extra_trays?: number | null
  extra_trays_20lb?: number | null
  extra_trays_23lb?: number | null
}

export interface HELine {
  prod_date: string
  grade_a: number
  grade_b: number
  grade_c: number
  rate: number | null
}

export function printHEDispatch(d: HEDispatchRecord, lines: HELine[], opts: HEPrintOpts = {}) {
  const showCompany    = opts.companyAddr    !== false
  const showBuyer      = opts.buyerDetails   !== false
  const showBank       = opts.bankDetails    !== false
  const showSupply     = opts.supplyDetails  !== false
  // Compute gross from lines (each line's own rate or fallback to d.rate)
  const grossFromLines = lines.reduce((sum, l) => {
    const qty = (l.grade_a || 0) + (l.grade_b || 0) + (l.grade_c || 0)
    const r = l.rate || d.rate || 0
    return sum + qty * r
  }, 0)
  const grossAmt = lines.length > 0 ? grossFromLines : (d.amount ?? 0)
  const savedAmt = d.amount ?? 0
  const roDiff = Math.round((savedAmt - grossAmt) * 100) / 100
  const netPayable = savedAmt - (d.tds_amount ?? 0)
  const tdsLabel = d.tds_pct ? `TDS @ ${d.tds_pct}%` : 'TDS Deducted'
  // Age is per production date, not a single flock-wide figure — a dispatch
  // spanning several days (e.g. a weekly collection) has a different egg
  // age on each line, matching how the production register itself reads.
  const ageFor = (dateStr: string) => d.flock_placement_date ? flockAgeWeeksDays(d.flock_placement_date, dateStr) : '—'
  const linesHtml = lines.length > 0
    ? lines.map(l => {
        const tot = (l.grade_a || 0) + (l.grade_b || 0) + (l.grade_c || 0)
        const amt = l.rate ? tot * l.rate : null
        return `<tr>
          <td>${fmt(l.prod_date)}</td>
          <td class="tc">${ageFor(l.prod_date)}</td>
          <td class="tc">Hatching Eggs</td>
          <td class="tc">${CO.stateCode === (d.buyer_gstin?.slice(0,2) ?? '') ? 'Intra' : 'Inter'}</td>
          <td class="tc">${(l.grade_a||0).toLocaleString('en-IN')}</td>
          <td class="tc">${(l.grade_b||0).toLocaleString('en-IN')}</td>
          <td class="tc">${(l.grade_c||0).toLocaleString('en-IN')}</td>
          <td class="tc bold">${tot.toLocaleString('en-IN')}</td>
          <td class="tr">${l.rate ? `Rs.${l.rate}` : '—'}</td>
          <td class="tr">${amt ? inr(amt) : '—'}</td>
        </tr>`
      }).join('')
    : `<tr>
        <td>${fmt(d.dispatch_date)}</td>
        <td class="tc">${ageFor(d.dispatch_date)}</td>
        <td class="tc">Hatching Eggs</td>
        <td class="tc">—</td>
        <td class="tc" colspan="3">—</td>
        <td class="tc bold">${(d.total_dispatched||0).toLocaleString('en-IN')}</td>
        <td class="tr">${d.rate ? `Rs.${d.rate}` : '—'}</td>
        <td class="tr">${d.amount ? inr(d.amount) : '—'}</td>
      </tr>`

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Invoice ${d.invoice_no ?? 'Draft'}</title>
  <style>${CSS}</style>${LOGO_ROW_CSS}</head><body>
  <div class="header">
    <div>
      <div class="co-name-row">${LOGO_SVG}<h1>${CO.name}</h1></div>
      ${showCompany ? `<div class="sub">${CO.addr1}</div>
      <div class="sub">${CO.addr2}</div>
      <div class="sub">GSTIN: ${CO.gstin} | State: ${CO.state} (${CO.stateCode})</div>
      <div class="sub">Ph: ${CO.phone}</div>` : `<div class="sub">GSTIN: ${CO.gstin}</div>`}
    </div>
    <div class="header-right">
      <h2>Tax Invoice<br><span style="font-size:10px;font-weight:400">(Exempt Supply — HSN ${d.hsn_code ?? '0407'})</span></h2>
      <table style="margin:0;font-size:10px;width:auto;float:right">
        <tr><td class="label" style="border:none;padding:2px 4px">Invoice No</td><td style="border:none;padding:2px 4px;font-weight:700">${d.invoice_no ?? 'DRAFT'}</td></tr>
        <tr><td class="label" style="border:none;padding:2px 4px">Date</td><td style="border:none;padding:2px 4px">${fmt(d.dispatch_date)}</td></tr>
        ${d.dc_no ? `<tr><td class="label" style="border:none;padding:2px 4px">DC No</td><td style="border:none;padding:2px 4px">${d.dc_no}</td></tr>` : ''}
        ${d.flock_no ? `<tr><td class="label" style="border:none;padding:2px 4px">Flock</td><td style="border:none;padding:2px 4px">F-${d.flock_no}</td></tr>` : ''}
        ${d.flock_placement_date ? `<tr><td class="label" style="border:none;padding:2px 4px">Flock Age</td><td style="border:none;padding:2px 4px">${flockAgeWeeks(d.flock_placement_date, d.dispatch_date)} wks (as on ${fmt(d.dispatch_date)})</td></tr>` : ''}
      </table>
    </div>
  </div>

  <div class="two-col section">
    ${showBuyer ? `<div>
      <div class="label">Bill To</div>
      <div class="box">
        <div class="bold">${d.party_name}</div>
        ${d.party_address ? `<div class="sub">${d.party_address}</div>` : ''}
        ${d.buyer_gstin ? `<div class="sub">GSTIN: ${d.buyer_gstin}</div>` : ''}
      </div>
    </div>` : `<div><div class="label">Bill To</div><div class="box"><div class="bold">${d.party_name}</div></div></div>`}
    ${showSupply ? `<div>
      <div class="label">Supply Details</div>
      <div class="box">
        <div>HSN Code: <strong>${d.hsn_code ?? '0407'}</strong></div>
        <div>GST Rate: <strong>0% (Exempt)</strong></div>
        <div>Total Dispatched: <strong>${(d.total_dispatched||0).toLocaleString('en-IN')} eggs</strong></div>
        ${d.free_eggs > 0 ? `<div>Free Eggs: <strong>${d.free_eggs.toLocaleString('en-IN')}</strong></div>` : ''}
        <div>Invoice Qty: <strong>${(d.invoice_eggs||0).toLocaleString('en-IN')} eggs</strong></div>
      </div>
    </div>` : '<div></div>'}
  </div>

  <div class="section">
    <table>
      <thead><tr>
        <th>Prod. Date</th><th>Age</th><th>Description</th><th>Supply</th>
        <th>Grade A</th><th>Grade B</th><th>Grade C</th>
        <th>Total Qty</th><th>Rate (Rs)</th><th>Amount</th>
      </tr></thead>
      <tbody>
        ${linesHtml}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="6" class="tr">TOTAL</td>
          <td class="tc">${(d.invoice_eggs||0).toLocaleString('en-IN')}</td>
          <td></td>
          <td class="tr">${d.amount ? inr(d.amount) : '—'}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="two-col section">
    <div>
      <div class="label">Amount Summary</div>
      <div class="box">
        <table style="margin:0;border:none;width:100%">
          ${lines.length > 0 && roDiff !== 0 ? `<tr><td style="border:none;padding:2px 0">Gross Amount</td><td style="border:none;padding:2px 0;text-align:right">${inr(grossAmt)}</td></tr>` : ''}
          ${roDiff !== 0 ? `<tr><td style="border:none;padding:2px 0;color:#555">Round Off</td><td style="border:none;padding:2px 0;text-align:right;color:#555">${roDiff > 0 ? '+' : ''}${inr(roDiff)}</td></tr>` : ''}
          <tr><td style="border:none;padding:2px 0;font-weight:700">Invoice Amount</td><td style="border:none;padding:2px 0;text-align:right;font-weight:700">${savedAmt ? inr(savedAmt) : '—'}</td></tr>
          ${d.tds_amount ? `<tr><td style="border:none;padding:2px 0;color:#c00">${tdsLabel}</td><td style="border:none;padding:2px 0;text-align:right;color:#c00">- ${inr(d.tds_amount)}</td></tr>` : ''}
          <tr style="border-top:2px solid #aaa"><td style="border:none;padding:4px 0;font-weight:700;font-size:12px">Net Payable</td><td style="border:none;padding:4px 0;text-align:right;font-weight:700;font-size:12px">${inr(netPayable)}</td></tr>
        </table>
        ${d.tds_amount ? `<div class="note">* Buyer to deduct TDS and deposit with IT Dept.<br>Seller to claim credit via Form 26AS.</div>` : ''}
      </div>
    </div>
    ${showBank ? `<div>
      <div class="label">Bank Details (for payment)</div>
      <div class="box">
        <div><strong>${CO.bank}</strong></div>
        <div>A/c No: ${CO.acNo}</div>
        <div>Branch: ${CO.branch}</div>
        <div>IFSC: ${CO.ifsc}</div>
      </div>
    </div>` : '<div></div>'}
  </div>

  ${(d.vehicle_type || d.lorry_no || d.out_time || d.driver_phone || d.boxes_20lb || d.boxes_23lb || d.extra_trays_20lb || d.extra_trays_23lb) ? `
  <div class="section two-col" style="margin-top:8px">
    ${(d.vehicle_type || d.lorry_no || d.out_time || d.driver_phone) ? `
    <div>
      <div class="label">Logistics</div>
      <div class="box">
        ${d.vehicle_type ? `<div>Vehicle Type: <strong>${d.vehicle_type}</strong></div>` : ''}
        ${d.lorry_no ? `<div>Lorry No: <strong>${d.lorry_no}</strong></div>` : ''}
        ${d.out_time ? `<div>Out Time: <strong>${d.out_time}</strong></div>` : ''}
        ${d.driver_phone ? `<div>Driver Ph: ${d.driver_phone}</div>` : ''}
      </div>
    </div>` : '<div></div>'}
    ${(d.boxes_20lb || d.boxes_23lb || d.extra_trays_20lb || d.extra_trays_23lb) ? `
    <div>
      <div class="label">Box Details</div>
      <div class="box">
        ${d.boxes_20lb ? `<div>20LB Boxes: <strong>${d.boxes_20lb}</strong></div>` : ''}
        ${d.boxes_23lb ? `<div>23LB Boxes: <strong>${d.boxes_23lb}</strong></div>` : ''}
        ${d.extra_trays_20lb ? `<div>Extra Trays (20LB): <strong>${d.extra_trays_20lb}</strong></div>` : ''}
        ${d.extra_trays_23lb ? `<div>Extra Trays (23LB): <strong>${d.extra_trays_23lb}</strong></div>` : ''}
        <div class="note">1 box = 7 trays = 210 eggs</div>
      </div>
    </div>` : '<div></div>'}
  </div>` : ''}

  <div class="sign-row">
    <div>
      <div class="note">This is a computer generated invoice.</div>
      <div class="note">Eggs are exempt from GST under Schedule I of CGST Act.</div>
    </div>
    <div style="text-align:right">
      <div>For <strong>${CO.name}</strong></div>
      <div style="margin-top:30px;border-top:1px solid #aaa;padding-top:4px">Authorised Signatory</div>
    </div>
  </div>
  </body></html>`

  openPrint(html)
}

// ── NHE Sales Bill ────────────────────────────────────────────────────────────
export interface NHESaleRecord {
  id: string
  sale_date: string
  sale_type: string
  invoice_no: string | null
  dc_no: number | null
  flock_no?: number
  quantity: number
  unit: string
  rate: number | null
  amount: number | null
  taxable_value: number | null
  gst_pct: number
  cgst_amount: number | null
  sgst_amount: number | null
  igst_amount: number | null
  buyer_gstin: string | null
  party_name: string
  party_address?: string
  vehicle_no?: string | null
  bird_sex?: string | null
  bird_category?: string | null
  avg_weight_kg?: number | null
  total_weight_kg?: number | null
  rate_per_kg?: number | null
}

const SALE_TYPE_LABEL: Record<string, string> = {
  je: 'Jumbo Eggs', te: 'Table Eggs', be: 'Broiler Eggs',
  bird: 'Birds (Live)', manure: 'Litter / Manure'
}
const UNIT_LABEL: Record<string, string> = {
  eggs: 'Nos', nos: 'Nos', kg: 'Kg', bags: 'Bags', ton: 'Tons'
}

export function printNHESale(d: NHESaleRecord) {
  const isBird = d.sale_type === 'bird'
  const isInter = d.buyer_gstin ? d.buyer_gstin.slice(0,2) !== CO.stateCode : false
  const cgst = d.cgst_amount ?? 0
  const sgst = d.sgst_amount ?? 0
  const igst = d.igst_amount ?? 0
  const taxable = d.taxable_value ?? d.amount ?? 0
  const description = SALE_TYPE_LABEL[d.sale_type] ?? d.sale_type
  const unit = UNIT_LABEL[d.unit] ?? d.unit

  const gstRows = d.gst_pct > 0 ? (isInter
    ? `<tr><td style="border:none;padding:2px 0">IGST @ ${d.gst_pct}%</td><td style="border:none;padding:2px 0;text-align:right">${inr(igst)}</td></tr>`
    : `<tr><td style="border:none;padding:2px 0">CGST @ ${d.gst_pct/2}%</td><td style="border:none;padding:2px 0;text-align:right">${inr(cgst)}</td></tr>
       <tr><td style="border:none;padding:2px 0">SGST @ ${d.gst_pct/2}%</td><td style="border:none;padding:2px 0;text-align:right">${inr(sgst)}</td></tr>`)
    : `<tr><td style="border:none;padding:2px 0;color:#555">GST</td><td style="border:none;padding:2px 0;text-align:right;color:#555">Nil (Exempt)</td></tr>`

  const birdExtra = isBird ? `
    <tr><td style="border:none;padding:2px 0">Category</td><td style="border:none;padding:2px 0">${d.bird_category ?? ''} ${d.bird_sex ?? ''}</td></tr>
    <tr><td style="border:none;padding:2px 0">Avg Weight</td><td style="border:none;padding:2px 0">${d.avg_weight_kg ?? '—'} kg/bird</td></tr>
    <tr><td style="border:none;padding:2px 0">Total Weight</td><td style="border:none;padding:2px 0">${d.total_weight_kg ?? '—'} kg</td></tr>
    <tr><td style="border:none;padding:2px 0">Rate/Kg</td><td style="border:none;padding:2px 0">Rs. ${d.rate_per_kg ?? '—'}</td></tr>
  ` : ''

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Sales Invoice ${d.invoice_no ?? 'Draft'}</title>
  <style>${CSS}</style>${LOGO_ROW_CSS}</head><body>
  <div class="header">
    <div>
      <div class="co-name-row">${LOGO_SVG}<h1>${CO.name}</h1></div>
      <div class="sub">${CO.addr1}</div>
      <div class="sub">${CO.addr2}</div>
      <div class="sub">GSTIN: ${CO.gstin} | State: ${CO.state} (${CO.stateCode})</div>
      <div class="sub">Ph: ${CO.phone}</div>
    </div>
    <div class="header-right">
      <h2>${d.gst_pct > 0 ? 'Tax Invoice' : 'Sale Bill'}</h2>
      <table style="margin:0;font-size:10px;width:auto;float:right">
        <tr><td class="label" style="border:none;padding:2px 4px">Invoice No</td><td style="border:none;padding:2px 4px;font-weight:700">${d.invoice_no ?? 'DRAFT'}</td></tr>
        <tr><td class="label" style="border:none;padding:2px 4px">Date</td><td style="border:none;padding:2px 4px">${fmt(d.sale_date)}</td></tr>
        ${d.dc_no ? `<tr><td class="label" style="border:none;padding:2px 4px">DC No</td><td style="border:none;padding:2px 4px">${d.dc_no}</td></tr>` : ''}
        ${d.flock_no ? `<tr><td class="label" style="border:none;padding:2px 4px">Flock</td><td style="border:none;padding:2px 4px">F-${d.flock_no}</td></tr>` : ''}
        ${d.vehicle_no ? `<tr><td class="label" style="border:none;padding:2px 4px">Vehicle</td><td style="border:none;padding:2px 4px">${d.vehicle_no}</td></tr>` : ''}
      </table>
    </div>
  </div>

  <div class="two-col section">
    <div>
      <div class="label">Bill To</div>
      <div class="box">
        <div class="bold">${d.party_name}</div>
        ${d.party_address ? `<div class="sub">${d.party_address}</div>` : ''}
        ${d.buyer_gstin ? `<div class="sub">GSTIN: ${d.buyer_gstin}</div>` : ''}
      </div>
    </div>
    <div>
      <div class="label">Supply Details</div>
      <div class="box">
        <div>Type: <strong>${isInter ? 'Inter-State' : 'Intra-State'}</strong></div>
        ${birdExtra}
      </div>
    </div>
  </div>

  <div class="section">
    <table>
      <thead><tr>
        <th>#</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Taxable Value</th>
        ${d.gst_pct > 0 ? (isInter ? '<th>IGST</th>' : '<th>CGST</th><th>SGST</th>') : '<th>GST</th>'}
        <th>Total</th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="tc">1</td>
          <td>${description}</td>
          <td class="tc">${(d.quantity||0).toLocaleString('en-IN')}</td>
          <td class="tc">${unit}</td>
          <td class="tr">${d.rate ?? '—'}</td>
          <td class="tr">${inr(taxable)}</td>
          ${d.gst_pct > 0 ? (isInter ? `<td class="tr">${inr(igst)}</td>` : `<td class="tr">${inr(cgst)}</td><td class="tr">${inr(sgst)}</td>`) : '<td class="tc">Nil</td>'}
          <td class="tr bold">${d.amount ? inr(d.amount) : '—'}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="${d.gst_pct > 0 && !isInter ? 7 : 6}" class="tr">TOTAL</td>
          ${d.gst_pct > 0 && !isInter ? '' : ''}
          <td class="tr">${d.amount ? inr(d.amount) : '—'}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="two-col section">
    <div>
      <div class="label">Amount Summary</div>
      <div class="box">
        <table style="margin:0;border:none;width:100%">
          <tr><td style="border:none;padding:2px 0">Taxable Value</td><td style="border:none;padding:2px 0;text-align:right">${inr(taxable)}</td></tr>
          ${gstRows}
          <tr style="border-top:2px solid #aaa"><td style="border:none;padding:4px 0;font-weight:700;font-size:12px">Total Amount</td><td style="border:none;padding:4px 0;text-align:right;font-weight:700;font-size:12px">${d.amount ? inr(d.amount) : '—'}</td></tr>
        </table>
      </div>
    </div>
    <div>
      <div class="label">Bank Details</div>
      <div class="box">
        <div><strong>${CO.bank}</strong></div>
        <div>A/c No: ${CO.acNo}</div>
        <div>Branch: ${CO.branch}</div>
        <div>IFSC: ${CO.ifsc}</div>
      </div>
    </div>
  </div>

  <div class="sign-row">
    <div><div class="note">This is a computer generated invoice.</div></div>
    <div style="text-align:right">
      <div>For <strong>${CO.name}</strong></div>
      <div style="margin-top:30px;border-top:1px solid #aaa;padding-top:4px">Authorised Signatory</div>
    </div>
  </div>
  </body></html>`

  openPrint(html)
}

// ── Purchase GRN ──────────────────────────────────────────────────────────────
// ── Multi-section report print ────────────────────────────────────────────
// One letterhead document holding several tables, each with its own heading
// and totals, plus an optional grand total across all of them. Used where two
// related sets belong on one sheet (e.g. TDS Payable: vendor TDS and salary
// TDS are different sources but are filed and paid together).
export interface PrintSection {
  heading: string
  headers: string[]
  rows: (string | number | null | undefined)[][]
  rightAlignFrom?: number
  footerRow?: (string | number | null | undefined)[]
  emptyNote?: string
}
export function printMultiReport(opts: {
  title: string
  subtitle?: string
  sections: PrintSection[]
  grandTotalLabel?: string
  grandTotalValue?: string
  // Extra identification line under the address — statutory statements need
  // the deductor's PAN and TAN on the face of the document.
  headerNote?: string
}) {
  const { title, subtitle, sections, grandTotalLabel, grandTotalValue, headerNote } = opts
  const body = sections.map(sec => {
    if (!sec.rows.length) {
      return `<div class="section"><div class="label">${sec.heading}</div>
        <div class="box"><span class="sub">${sec.emptyNote ?? 'No entries for this period.'}</span></div></div>`
    }
    const thead = sec.headers.map(h => `<th>${h}</th>`).join('')
    const tbody = sec.rows.map(r => `<tr>${r.map((c, i) =>
      `<td${sec.rightAlignFrom != null && i >= sec.rightAlignFrom ? ' style="text-align:right"' : ''}>${c ?? ''}</td>`
    ).join('')}</tr>`).join('')
    const tfoot = sec.footerRow ? `<tfoot><tr class="total-row">${sec.footerRow.map((c, i) =>
      `<td${sec.rightAlignFrom != null && i >= sec.rightAlignFrom ? ' style="text-align:right"' : ''}>${c ?? ''}</td>`
    ).join('')}</tr></tfoot>` : ''
    return `<div class="section">
      <div class="label">${sec.heading}</div>
      <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody>${tfoot}</table>
    </div>`
  }).join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>${CSS}</style>${LOGO_ROW_CSS}</head><body>
    <div class="header">
      <div>
        <div class="co-name-row">${LOGO_SVG}<h1>${CO.name}</h1></div>
        <div class="sub">${CO.addr1}</div>
        <div class="sub">${CO.addr2}, ${CO.state} — ${CO.stateCode}</div>
        <div class="sub">GSTIN: ${CO.gstin} · Ph: ${CO.phone}</div>
        ${headerNote ? `<div class="sub">${headerNote}</div>` : ''}
      </div>
      <div class="header-right">
        <h2>${title}</h2>
        ${subtitle ? `<div class="sub">${subtitle}</div>` : ''}
        <div class="sub">Printed: ${new Date().toLocaleString('en-IN')}</div>
      </div>
    </div>
    ${body}
    ${grandTotalValue ? `<div class="section"><table><tfoot><tr class="total-row">
        <td class="tr">${grandTotalLabel ?? 'GRAND TOTAL'}</td>
        <td class="tr" style="width:160px">${grandTotalValue}</td>
      </tr></tfoot></table></div>` : ''}
    <div class="sign-row-4">
      <div>Prepared By</div>
      <div>Checked By</div>
      <div>Approved By</div>
      <div>Accounts</div>
    </div>
  </body></html>`
  openPrint(html)
}

// ── Bank Ledger statement print ───────────────────────────────────────────
// One account per print (the page shows one at a time), so Kotak and every
// other account produce their own statement. Honours whatever period is
// selected — the From/To range, or the whole FY when no range is set.
// Rows print oldest→newest so the running balance reads down the page, even
// though the on-screen table shows newest first.
export interface BankLedgerPrintRow {
  txn_date: string
  txn_type: string
  category?: string | null
  description?: string | null
  reference_no?: string | null
  party_name?: string | null
  amount?: number | null
  balance?: number | null
}
export function printBankLedger(opts: {
  accountName: string
  bankName?: string | null
  accountNo?: string | null
  ifsc?: string | null
  periodLabel: string
  openingBalance: number
  rows: BankLedgerPrintRow[]
  credits: number
  debits: number
  closing: number
}) {
  const { accountName, bankName, accountNo, ifsc, periodLabel,
          openingBalance, rows, credits, debits, closing } = opts
  const body = rows.map(r => {
    const isCr = r.txn_type === 'Credit'
    return `<tr>
      <td class="tc">${fmt(r.txn_date)}</td>
      <td>${r.description ?? '—'}${r.party_name ? `<div class="sub">${r.party_name}</div>` : ''}</td>
      <td class="tc">${r.category ?? '—'}</td>
      <td class="tc">${r.reference_no ?? '—'}</td>
      <td class="tr">${isCr ? inr(r.amount ?? 0) : ''}</td>
      <td class="tr">${!isCr ? inr(r.amount ?? 0) : ''}</td>
      <td class="tr bold">${inr(r.balance ?? 0)}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Bank Ledger — ${accountName}</title>
  <style>${CSS}</style>${LOGO_ROW_CSS}</head><body>
  <div class="header">
    <div>
      <div class="co-name-row">${LOGO_SVG}<h1>${CO.name}</h1></div>
      <div class="sub">${CO.addr1}</div>
      <div class="sub">${CO.addr2}, ${CO.state} — ${CO.stateCode}</div>
      <div class="sub">GSTIN: ${CO.gstin} · Ph: ${CO.phone}</div>
    </div>
    <div class="header-right">
      <h2>Bank Ledger Statement</h2>
      <div class="sub">${periodLabel}</div>
      <div class="sub">Printed: ${new Date().toLocaleString('en-IN')}</div>
    </div>
  </div>

  <div class="two-col section">
    <div>
      <div class="label">Account</div>
      <div class="box">
        <div class="bold">${bankName ? `${bankName} — ` : ''}${accountName}</div>
        ${accountNo ? `<div class="sub">A/c No: ${accountNo}</div>` : ''}
        ${ifsc ? `<div class="sub">IFSC: ${ifsc}</div>` : ''}
      </div>
    </div>
    <div>
      <div class="label">Summary</div>
      <div class="box">
        <div>Opening: <strong>${inr(openingBalance)}</strong></div>
        <div class="sub">Credits: ${inr(credits)} · Debits: ${inr(debits)}</div>
        <div>Closing: <strong>${inr(closing)}</strong></div>
      </div>
    </div>
  </div>

  <div class="section">
    <table>
      <thead><tr>
        <th>Date</th><th>Particulars</th><th>Category</th><th>Reference</th>
        <th>Credit</th><th>Debit</th><th>Balance</th>
      </tr></thead>
      <tbody>
        <tr class="total-row">
          <td class="tc">—</td><td colspan="3">Opening Balance</td>
          <td></td><td></td><td class="tr">${inr(openingBalance)}</td>
        </tr>
        ${body}
      </tbody>
      <tfoot><tr class="total-row">
        <td colspan="4" class="tr">Total (${rows.length} entr${rows.length === 1 ? 'y' : 'ies'})</td>
        <td class="tr">${inr(credits)}</td>
        <td class="tr">${inr(debits)}</td>
        <td class="tr">${inr(closing)}</td>
      </tr></tfoot>
    </table>
  </div>

  <div class="sign-row-4">
    <div>Prepared By</div>
    <div>Checked By</div>
    <div>Approved By</div>
    <div>Accounts</div>
  </div>
  </body></html>`
  openPrint(html)
}

// ── Multi-line GRN print ──────────────────────────────────────────────────
// A GRN is one bill with many item lines (one `grn` row per item, sharing a
// grn_no), but printGRN below prints a SINGLE row — so a 3-item GRN needed 3
// printouts, each showing only that item's amount as if it were the whole
// bill. This prints every line of a GRN together with the real grand total,
// and handles several GRNs at once (each gets its own block) so ticking rows
// across different GRNs still produces one document.
export interface GRNPrintLine {
  grn_no: string | null
  grn_date: string
  party_name: string
  party_gstin?: string | null
  invoice_no?: string | null
  invoice_date?: string | null
  vehicle_no?: string | null
  farm_name?: string | null
  item_name: string
  category?: string | null
  qty: number | null
  unit?: string | null
  price_per_unit?: number | null
  basic_amount?: number | null
  gst_pct?: number | null
  gst_amount?: number | null
  total_amount?: number | null
  batch_no?: string | null
  expiry_date?: string | null
}
export function printGRNLines(lines: GRNPrintLine[], opts?: { title?: string }) {
  if (!lines.length) return
  // Group by GRN No + vendor — the same key the payable bill uses, so the
  // printed total always matches the bill in Pending Payments.
  const groups = new Map<string, GRNPrintLine[]>()
  for (const l of lines) {
    const key = `${l.grn_no ?? '—'}||${l.party_name ?? ''}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(l)
  }
  const sum = (arr: GRNPrintLine[], f: (l: GRNPrintLine) => number) => arr.reduce((s, l) => s + (f(l) || 0), 0)
  const grand = sum(lines, l => l.total_amount ?? l.basic_amount ?? 0)

  const blocks = [...groups.values()].map(g => {
    const h = g[0]
    const basic = sum(g, l => l.basic_amount ?? 0)
    const gst = sum(g, l => l.gst_amount ?? 0)
    const total = sum(g, l => l.total_amount ?? l.basic_amount ?? 0)
    const rows = g.map((l, i) => `<tr>
      <td class="tc">${i + 1}</td>
      <td>${l.item_name ?? '—'}${l.batch_no ? `<div class="sub">Batch: ${l.batch_no}${l.expiry_date ? ` · Exp ${fmt(l.expiry_date)}` : ''}</div>` : ''}</td>
      <td class="tc">${l.category ?? '—'}</td>
      <td class="tr">${(l.qty ?? 0).toLocaleString('en-IN')}${l.unit ? ` ${l.unit}` : ''}</td>
      <td class="tr">${l.price_per_unit != null ? inr(l.price_per_unit) : '—'}</td>
      <td class="tr">${inr(l.basic_amount ?? 0)}</td>
      <td class="tr">${(l.gst_pct ?? 0) > 0 ? `${l.gst_pct}%` : 'Nil'}</td>
      <td class="tr">${inr(l.gst_amount ?? 0)}</td>
      <td class="tr bold">${inr(l.total_amount ?? l.basic_amount ?? 0)}</td>
    </tr>`).join('')
    return `
    <div class="section">
      <div class="two-col">
        <div>
          <div class="label">Supplier</div>
          <div class="box">
            <div class="bold">${h.party_name ?? '—'}</div>
            ${h.party_gstin ? `<div class="sub">GSTIN: ${h.party_gstin}</div>` : ''}
          </div>
        </div>
        <div>
          <div class="label">GRN Details</div>
          <div class="box">
            <div>GRN No: <strong>${h.grn_no ?? '—'}</strong> · ${fmt(h.grn_date)}</div>
            ${h.invoice_no ? `<div class="sub">Invoice: ${h.invoice_no}${h.invoice_date ? ` dt. ${fmt(h.invoice_date)}` : ''}</div>` : ''}
            ${h.farm_name ? `<div class="sub">Site: ${h.farm_name}</div>` : ''}
            ${h.vehicle_no ? `<div class="sub">Vehicle: ${h.vehicle_no}</div>` : ''}
          </div>
        </div>
      </div>
      <table>
        <thead><tr>
          <th>#</th><th>Item</th><th>Category</th><th>Qty</th><th>Rate</th>
          <th>Basic</th><th>GST%</th><th>GST Amt</th><th>Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr class="total-row">
          <td colspan="5" class="tr">Total (${g.length} item${g.length > 1 ? 's' : ''})</td>
          <td class="tr">${inr(basic)}</td><td></td>
          <td class="tr">${inr(gst)}</td><td class="tr">${inr(total)}</td>
        </tr></tfoot>
      </table>
    </div>`
  }).join('')

  const many = groups.size > 1
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>${opts?.title ?? 'Goods Received Note'}</title>
  <style>${CSS}</style>${LOGO_ROW_CSS}</head><body>
  <div class="header">
    <div>
      <div class="co-name-row">${LOGO_SVG}<h1>${CO.name}</h1></div>
      <div class="sub">${CO.addr1}</div>
      <div class="sub">${CO.addr2}, ${CO.state} — ${CO.stateCode}</div>
      <div class="sub">GSTIN: ${CO.gstin} · Ph: ${CO.phone}</div>
    </div>
    <div class="header-right">
      <h2>${opts?.title ?? 'Goods Received Note'}</h2>
      ${many ? `<div class="sub">${groups.size} GRNs · ${lines.length} line(s)</div>` : ''}
      <div class="sub">Printed: ${new Date().toLocaleString('en-IN')}</div>
    </div>
  </div>
  ${blocks}
  ${many ? `<div class="section"><table><tfoot><tr class="total-row">
      <td class="tr">GRAND TOTAL (${groups.size} GRNs)</td><td class="tr">${inr(grand)}</td>
    </tr></tfoot></table></div>` : ''}
  <div class="sign-row-4">
    <div>Received By</div>
    <div>Store In-charge</div>
    <div>Verified By</div>
    <div>Accounts</div>
  </div>
  </body></html>`
  openPrint(html)
}

export interface GRNRecord {
  id: string
  grn_date: string
  grn_no: string | null
  invoice_no: string | null
  invoice_date: string | null
  party_name: string
  item_name: string
  qty: number
  unit: string
  price_per_unit: number | null
  basic_amount: number | null
  gst_pct: number | null
  gst_amount: number | null
  total_amount: number | null
  cgst_amount: number | null
  sgst_amount: number | null
  igst_amount: number | null
  party_gstin: string | null
  vehicle_no: string | null
  farm_name?: string
  is_rcm?: boolean
}

export function printGRN(d: GRNRecord) {
  const isInter = d.party_gstin ? d.party_gstin.slice(0,2) !== CO.stateCode : false
  const cgst = d.cgst_amount ?? 0
  const sgst = d.sgst_amount ?? 0
  const igst = d.igst_amount ?? 0
  const basic = d.basic_amount ?? 0
  const total = d.total_amount ?? 0

  const gstRows = (d.gst_pct ?? 0) > 0 ? (isInter
    ? `<tr><td style="border:none;padding:2px 0">IGST @ ${d.gst_pct}%</td><td style="border:none;padding:2px 0;text-align:right">${inr(igst)}</td></tr>`
    : `<tr><td style="border:none;padding:2px 0">CGST @ ${(d.gst_pct??0)/2}%</td><td style="border:none;padding:2px 0;text-align:right">${inr(cgst)}</td></tr>
       <tr><td style="border:none;padding:2px 0">SGST @ ${(d.gst_pct??0)/2}%</td><td style="border:none;padding:2px 0;text-align:right">${inr(sgst)}</td></tr>`)
    : `<tr><td style="border:none;padding:2px 0;color:#555">GST</td><td style="border:none;padding:2px 0;text-align:right;color:#555">Nil</td></tr>`

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>GRN ${d.grn_no ?? ''}</title>
  <style>${CSS}</style>${LOGO_ROW_CSS}</head><body>
  <div class="header">
    <div>
      <div class="co-name-row">${LOGO_SVG}<h1>${CO.name}</h1></div>
      <div class="sub">${CO.addr1}</div>
      <div class="sub">${CO.addr2}</div>
      <div class="sub">GSTIN: ${CO.gstin} | State: ${CO.state} (${CO.stateCode})</div>
      <div class="sub">Ph: ${CO.phone}</div>
    </div>
    <div class="header-right">
      <h2>Goods Received Note</h2>
      <table style="margin:0;font-size:10px;width:auto;float:right">
        <tr><td class="label" style="border:none;padding:2px 4px">GRN No</td><td style="border:none;padding:2px 4px;font-weight:700">${d.grn_no ?? '—'}</td></tr>
        <tr><td class="label" style="border:none;padding:2px 4px">GRN Date</td><td style="border:none;padding:2px 4px">${fmt(d.grn_date)}</td></tr>
        ${d.invoice_no ? `<tr><td class="label" style="border:none;padding:2px 4px">Vendor Invoice</td><td style="border:none;padding:2px 4px">${d.invoice_no}</td></tr>` : ''}
        ${d.invoice_date ? `<tr><td class="label" style="border:none;padding:2px 4px">Invoice Date</td><td style="border:none;padding:2px 4px">${fmt(d.invoice_date)}</td></tr>` : ''}
        ${d.vehicle_no ? `<tr><td class="label" style="border:none;padding:2px 4px">Vehicle</td><td style="border:none;padding:2px 4px">${d.vehicle_no}</td></tr>` : ''}
        ${d.farm_name ? `<tr><td class="label" style="border:none;padding:2px 4px">Farm</td><td style="border:none;padding:2px 4px">${d.farm_name}</td></tr>` : ''}
      </table>
    </div>
  </div>

  <div class="section">
    <div class="label">Vendor</div>
    <div class="box" style="margin-top:3px">
      <div class="bold">${d.party_name}</div>
      ${d.party_gstin ? `<div class="sub">GSTIN: ${d.party_gstin}</div>` : ''}
      ${d.is_rcm ? `<div class="sub" style="color:#c00">⚠ RCM applicable — tax to be paid by recipient</div>` : ''}
    </div>
  </div>

  <div class="section">
    <table>
      <thead><tr>
        <th>#</th><th>Item Description</th><th>Qty</th><th>Unit</th>
        <th>Rate</th><th>Basic Amount</th><th>GST%</th><th>GST Amt</th><th>Total</th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="tc">1</td>
          <td>${d.item_name}</td>
          <td class="tc">${(d.qty||0).toLocaleString('en-IN')}</td>
          <td class="tc">${d.unit}</td>
          <td class="tr">${d.price_per_unit ? `Rs.${d.price_per_unit}` : '—'}</td>
          <td class="tr">${inr(basic)}</td>
          <td class="tc">${d.gst_pct ?? 0}%</td>
          <td class="tr">${inr((d.gst_amount ?? cgst + sgst + igst))}</td>
          <td class="tr bold">${inr(total)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="5" class="tr">TOTAL</td>
          <td class="tr">${inr(basic)}</td>
          <td></td>
          <td class="tr">${inr(d.gst_amount ?? cgst + sgst + igst)}</td>
          <td class="tr">${inr(total)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="two-col section">
    <div>
      <div class="label">GST Breakup</div>
      <div class="box">
        <table style="margin:0;border:none;width:100%">
          <tr><td style="border:none;padding:2px 0">Basic Amount</td><td style="border:none;padding:2px 0;text-align:right">${inr(basic)}</td></tr>
          ${gstRows}
          <tr style="border-top:2px solid #aaa"><td style="border:none;padding:4px 0;font-weight:700;font-size:12px">Total Amount</td><td style="border:none;padding:4px 0;text-align:right;font-weight:700;font-size:12px">${inr(total)}</td></tr>
        </table>
      </div>
    </div>
    <div>
      <div class="label">Received By</div>
      <div class="box" style="height:70px"></div>
      <div class="note" style="margin-top:4px">Signature + Stamp of receiving person</div>
    </div>
  </div>

  <div class="sign-row">
    <div><div class="note">Goods received in good condition as per above details.</div></div>
    <div style="text-align:right">
      <div>For <strong>${CO.name}</strong></div>
      <div style="margin-top:30px;border-top:1px solid #aaa;padding-top:4px">Store In-charge</div>
    </div>
  </div>
  </body></html>`

  openPrint(html)
}

// ── Purchase Intent (indent) — matches the original Excel "INDENT FOR
// NARAENDRA BREEDING FARMS" layout, with the same company letterhead/GSTIN
// used everywhere else in the app. ─────────────────────────────────────────
export interface PurchaseIntentLine {
  sl_no: number
  require_for: string | null
  item_name: string
  require_qty: number | null
  pack_size: number | null
  uom: string | null
  total_qty: number | null
  best_delivery_by: string | null
  supplier_name: string | null
}
export interface PurchaseIntentRecord {
  intent_no: string
  intent_date: string
  farm_name: string | null
  prepared_by: string | null
  approved_by: string | null
  remarks: string | null
}

export function printPurchaseIntent(d: PurchaseIntentRecord, lines: PurchaseIntentLine[]) {
  const rows = lines.map(l => `
    <tr>
      <td class="tc">${l.sl_no}</td>
      <td>${l.require_for ?? '—'}</td>
      <td>${l.item_name}</td>
      <td class="tr">${l.require_qty != null ? l.require_qty.toLocaleString('en-IN') : '—'}</td>
      <td class="tr">${l.pack_size != null ? l.pack_size.toLocaleString('en-IN') : '—'}</td>
      <td class="tc">${l.uom ?? '—'}</td>
      <td class="tr">${l.total_qty != null ? l.total_qty.toLocaleString('en-IN') : '—'}</td>
      <td class="tc">${l.best_delivery_by ? fmt(l.best_delivery_by) : '—'}</td>
      <td>${l.supplier_name ?? '—'}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Indent ${d.intent_no}</title>
  <style>${CSS}</style>${LOGO_ROW_CSS}</head><body>
  <div class="header">
    <div>
      <div class="co-name-row">${LOGO_SVG}<h1>${CO.name}</h1></div>
      <div class="sub">${CO.addr1}</div>
      <div class="sub">${CO.addr2}</div>
      <div class="sub">GSTIN: ${CO.gstin} | State: ${CO.state} (${CO.stateCode})</div>
      <div class="sub">Ph: ${CO.phone}</div>
    </div>
    <div class="header-right">
      <h2>Purchase Intent (Indent)</h2>
      <table style="margin:0;font-size:10px;width:auto;float:right">
        <tr><td class="label" style="border:none;padding:2px 4px">Intent No</td><td style="border:none;padding:2px 4px;font-weight:700">${d.intent_no}</td></tr>
        <tr><td class="label" style="border:none;padding:2px 4px">Date</td><td style="border:none;padding:2px 4px">${fmt(d.intent_date)}</td></tr>
        ${d.farm_name ? `<tr><td class="label" style="border:none;padding:2px 4px">Site</td><td style="border:none;padding:2px 4px">${d.farm_name}</td></tr>` : ''}
      </table>
    </div>
  </div>

  <div class="section">
    <table>
      <thead><tr>
        <th>#</th><th>Require For</th><th>Item</th><th>Qty</th><th>Pack Size</th>
        <th>UOM</th><th>Total</th><th>Best Delivery By</th><th>Supplier</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="sign-row">
    <div><div class="label">Prepared By</div><div class="box" style="min-width:160px">${d.prepared_by ?? ''}</div></div>
    <div style="text-align:right"><div class="label">Approved By</div><div class="box" style="min-width:160px">${d.approved_by ?? ''}</div></div>
  </div>
  ${d.remarks ? `<div class="note section">Remarks: ${d.remarks}</div>` : ''}
  </body></html>`

  openPrint(html)
}

// ── Daily Payment Planning — company letterhead + payment table + summary
// boxes + 4-way signature row, matching the "Daily Payment Details" format. ─
export interface PaymentPlanningRow {
  sno: number
  vendor_name: string
  credit_limit_days: number | null
  invoice_amount: number
  payable_amount: number
  disc_tds: number
  grn_date: string | null
  invoice_date: string | null
  days: number | string
}

export function printPaymentPlanning(opts: {
  planDate: string
  rows: PaymentPlanningRow[]
  totals: { invoice: number; payable: number; discTds: number }
  bankBalance: number
  bankBalanceAfter: number
  needToReceive: number
}) {
  const { planDate, rows, totals, bankBalance, bankBalanceAfter, needToReceive } = opts

  const bodyRows = rows.map(r => `<tr>
    <td class="tc">${r.sno}</td>
    <td>${r.vendor_name}</td>
    <td class="tc">${r.credit_limit_days ?? 0}</td>
    <td class="tr">${inr(r.invoice_amount)}</td>
    <td class="tr">${inr(r.payable_amount)}</td>
    <td class="tr" style="color:#c00">${inr(r.disc_tds)}</td>
    <td class="tc">${r.grn_date ? fmt(r.grn_date) : '—'}</td>
    <td class="tc">${r.invoice_date ? fmt(r.invoice_date) : '—'}</td>
    <td class="tc">${r.days}</td>
  </tr>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Daily Payment Details ${fmt(planDate)}</title>
  <style>${CSS}</style>${LOGO_ROW_CSS}</head><body>
  <div class="header">
    <div>
      <div class="co-name-row">${LOGO_SVG}<h1>${CO.name}</h1></div>
      <div class="sub">${CO.addr1}</div>
      <div class="sub">${CO.addr2}</div>
      <div class="sub">GSTIN: ${CO.gstin} | State: ${CO.state} (${CO.stateCode})</div>
      <div class="sub">Ph: ${CO.phone}</div>
    </div>
    <div class="header-right">
      <h2>Daily Payment Details</h2>
      <table style="margin:0;font-size:10px;width:auto;float:right">
        <tr><td class="label" style="border:none;padding:2px 4px">Date</td><td style="border:none;padding:2px 4px;font-weight:700">${fmt(planDate)}</td></tr>
      </table>
    </div>
  </div>

  <div class="section">
    <table>
      <thead><tr>
        <th>S.No</th><th>Vendor Name</th><th>Credit Limit</th>
        <th>Invoice Amount</th><th>Payable Amount</th><th>Discount / TDS</th>
        <th>GRN Date</th><th>Invoice Date</th><th>No.Of days</th>
      </tr></thead>
      <tbody>
        ${bodyRows}
        <tr class="total-row">
          <td colspan="3" class="tr">Total Payments</td>
          <td class="tr">${inr(totals.invoice)}</td>
          <td class="tr">${inr(totals.payable)}</td>
          <td class="tr">${inr(totals.discTds)}</td>
          <td colspan="3"></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section" style="width:60%;margin:16px auto 0">
    <table style="margin:0">
      <tr><td class="bold">Bank Balance</td><td class="tr bold">${inr(bankBalance)}</td></tr>
      <tr><td class="bold">Bank Balance After Payments</td><td class="tr bold">${inr(bankBalanceAfter)}</td></tr>
      <tr><td class="bold">Need to Receive Amount</td><td class="tr bold">${inr(needToReceive)}</td></tr>
    </table>
  </div>

  <div class="sign-row-4">
    <div>Prepared By</div>
    <div>Checked By</div>
    <div>Verified By</div>
    <div>Authorized Signatory</div>
  </div>
  </body></html>`

  openPrint(html)
}
