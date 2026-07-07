// Invoice print utility — opens a styled print window
// Company details are embedded here; update if address changes.

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
  const linesHtml = lines.length > 0
    ? lines.map(l => {
        const tot = (l.grade_a || 0) + (l.grade_b || 0) + (l.grade_c || 0)
        const amt = l.rate ? tot * l.rate : null
        return `<tr>
          <td>${fmt(l.prod_date)}</td>
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
        <th>Prod. Date</th><th>Description</th><th>Supply</th>
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
