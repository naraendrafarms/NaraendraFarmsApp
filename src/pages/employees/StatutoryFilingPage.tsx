import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fetchAllPages } from '@/lib/utils'
import { Card, SectionHeader, Button, Input, Spinner, Table, Th, Td, Badge } from '@/components/ui'
import { Download, CheckCircle2, Pencil, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { printReport } from '@/lib/invoicePrint'
import * as XLSX from 'xlsx'

const PF_CEIL = 15000

function downloadFile(name: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
}
function csv(rows: (string | number)[][]) {
  return rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
}
const monthRange = (month: string) => {
  const [y, m] = month.split('-').map(Number)
  const start = `${month}-01`
  // Previously used toISOString() (UTC) on a locally-computed date — before
  // 5:30am IST this dropped the actual last day of the month, silently
  // excluding any bill/sale/RCM entry dated on the 30th/31st from every
  // statutory "Amount Due" figure. Build the string from local getters only.
  const lastDay = new Date(y, m, 0).getDate()
  const end = `${month}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

// ── Remittance Tracker — every statutory due (TDS on purchases, TDS on your
// sales that customers deducted, GST, PF, ESI, PT) in one place, each with its
// own "amount actually payable to govt vs vendor/salary paid" status. This is
// the piece that was missing everywhere: no report tracked whether a liability
// was actually DEPOSITED (challan/ack no + date), only whether the underlying
// bill/salary was settled.
type LiabilityType = 'tds_payable' | 'tds_receivable' | 'gst_payable' | 'pf_payable' | 'esi_payable' | 'pt_payable' | 'advance_tax' | 'late_fee'
const LIABILITY_LABELS: Record<LiabilityType, { label: string; hint: string; dueDay: string }> = {
  tds_payable:    { label: 'TDS Payable',     hint: 'TDS deducted from vendor bills — must be deposited to the govt',              dueDay: '7th of next month' },
  tds_receivable: { label: 'TDS Receivable',  hint: 'TDS customers deducted from your sales — claim as credit / collect Form 16A',  dueDay: 'Track for return filing' },
  gst_payable:    { label: 'GST Payable',     hint: 'Output GST on sales + RCM GST on purchases (no ITC claimed, per policy)',      dueDay: '20th of next month (GSTR-3B)' },
  pf_payable:     { label: 'PF Payable',      hint: 'Employee + Employer PF (EPS/EPF/Admin/EDLI) for the month',                    dueDay: '15th of next month (ECR)' },
  esi_payable:    { label: 'ESI Payable',     hint: 'Employee + Employer ESI for the month',                                        dueDay: '15th of next month' },
  pt_payable:     { label: 'PT Payable',      hint: 'Professional Tax deducted from salaries',                                      dueDay: 'Per state schedule' },
  advance_tax:    { label: 'Advance Tax',     hint: 'Advance income tax instalment for the company',                                dueDay: '15 Jun / Sep / Dec / Mar' },
  late_fee:       { label: 'Late Fee / Interest', hint: 'Late filing fee or interest on any statutory payment',                     dueDay: 'With the related challan' },
}

// These two have no source data to compute from — they are entered by hand,
// unlike TDS/GST/PF/ESI/PT which are totalled from bills, sales and salaries.
const MANUAL_LIABILITIES: LiabilityType[] = ['advance_tax', 'late_fee']

const RemittanceTracker: React.FC<{ month: string; amounts: Record<LiabilityType, number> }> = ({ month, amounts }) => {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<LiabilityType | null>(null)
  const [challanNo, setChallanNo] = useState('')
  const [paidDate, setPaidDate] = useState('')
  // Blank = remitted from our own bank account (how it always worked).
  const [paidViaPartner, setPaidViaPartner] = useState('')
  // Manual-entry liabilities (advance tax, late fee) have no computed source.
  const [manualAmount, setManualAmount] = useState('')
  const period = month + '-01'

  // The payer can be a PARTY (Hitech Hatch Fresh Private Limited is one) or an
  // individual partner, so both lists are offered. The value encodes which
  // table it came from, since the two id spaces are separate.
  const { data: payers = [] } = useQuery({
    queryKey: ['statutory_payers'],
    queryFn: async () => {
      const [{ data: pt }, { data: pa }] = await Promise.all([
        supabase.from('partners').select('id,name').order('name'),
        supabase.from('parties').select('id,name').order('name'),
      ])
      return [
        ...(pa ?? []).map((p: any) => ({ key: `party:${p.id}`, name: p.name })),
        ...(pt ?? []).map((p: any) => ({ key: `partner:${p.id}`, name: `${p.name} (partner)` })),
      ]
    },
    staleTime: 5 * 60_000,
  })
  const payerName = (rec: any) => {
    const k = rec?.paid_via_party_id ? `party:${rec.paid_via_party_id}`
      : rec?.paid_via_partner_id ? `partner:${rec.paid_via_partner_id}` : ''
    return (payers as any[]).find(p => p.key === k)?.name ?? null
  }

  const { data: liabilities = [] } = useQuery({
    queryKey: ['statutory_liabilities', month],
    queryFn: async () => {
      const { data, error } = await supabase.from('statutory_liabilities')
        .select('*').eq('period', period)
      if (error) throw error
      return data ?? []
    }
  })
  const byType = (t: LiabilityType) => (liabilities as any[]).find(l => l.liability_type === t)

  const openMark = (t: LiabilityType) => {
    const existing = byType(t)
    setEditing(t)
    setChallanNo(existing?.challan_no ?? '')
    setPaidDate(existing?.paid_date ?? new Date().toISOString().slice(0, 10))
    setPaidViaPartner(existing?.paid_via_party_id ? `party:${existing.paid_via_party_id}`
      : existing?.paid_via_partner_id ? `partner:${existing.paid_via_partner_id}` : '')
    setManualAmount(existing?.amount_due != null ? String(existing.amount_due) : '')
  }

  const saveRemittance = async (t: LiabilityType, status: 'Paid' | 'Pending') => {
    const { error } = await supabase.from('statutory_liabilities').upsert({
      liability_type: t, period,
      // Advance tax and late fee are typed in; everything else is computed
      // from the source data, so a hand-typed figure must not override it.
      amount_due: MANUAL_LIABILITIES.includes(t)
        ? (parseFloat(manualAmount) || 0)
        : (amounts[t] ?? 0),
      status,
      challan_no: status === 'Paid' ? (challanNo || null) : null,
      paid_date: status === 'Paid' ? (paidDate || null) : null,
      // Who actually remitted it. A partner-paid challan means our bank was
      // NOT touched on the payment date — the money left when it was
      // transferred to that partner — so nothing is posted to the ledger here.
      paid_via_party_id: status === 'Paid' && paidViaPartner.startsWith('party:')
        ? paidViaPartner.slice(6) : null,
      paid_via_partner_id: status === 'Paid' && paidViaPartner.startsWith('partner:')
        ? paidViaPartner.slice(8) : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'liability_type,period' })
    if (error) { toast.error(error.message); return }
    toast.success(status === 'Paid' ? 'Marked as remitted' : 'Reverted to pending')
    qc.invalidateQueries({ queryKey: ['statutory_liabilities', month] })
    setEditing(null)
  }

  return (
    <Card padding={false} className="lg:col-span-3">
      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-800">Remittance Tracker — {month}</p>
          <p className="text-xs text-gray-400">Amount due is computed live from the source data below. Mark each as remitted once you've actually deposited it with the government — this is separate from whether the underlying vendor bill / customer sale / salary itself has been paid.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => downloadFile(
            `statutory_liabilities_${month}.csv`,
            csv([
              ['Liability', 'Amount Due', 'Due', 'Status', 'Challan/Ref No.', 'Remitted On'],
              ...(Object.keys(LIABILITY_LABELS) as LiabilityType[]).map(t => {
                const meta = LIABILITY_LABELS[t]; const rec = byType(t); const amt = amounts[t] ?? 0
                return [meta.label, amt, meta.dueDay, amt <= 0 ? 'Nil' : (rec?.status === 'Paid' ? 'Remitted' : 'Pending'), rec?.challan_no ?? '', rec?.paid_date ?? '']
              }),
            ]), 'text/csv'
          )}>Export CSV</Button>
          <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={() => printReport({
            title: 'Statutory Remittance Tracker', subtitle: month,
            headers: ['Liability', 'Amount Due', 'Due', 'Status', 'Challan/Ref No.', 'Remitted On'],
            rows: (Object.keys(LIABILITY_LABELS) as LiabilityType[]).map(t => {
              const meta = LIABILITY_LABELS[t]; const rec = byType(t); const amt = amounts[t] ?? 0
              return [meta.label, amt, meta.dueDay, amt <= 0 ? 'Nil' : (rec?.status === 'Paid' ? 'Remitted' : 'Pending'), rec?.challan_no ?? '', rec?.paid_date ?? '']
            }),
            rightAlignFrom: 1,
          })}>Print</Button>
        </div>
      </div>
      <Table>
        <thead><tr><Th>Liability</Th><Th right>Amount Due</Th><Th>Due</Th><Th>Status</Th><Th>Challan / Ref No.</Th><Th>Remitted On</Th><Th></Th></tr></thead>
        <tbody>
          {(Object.keys(LIABILITY_LABELS) as LiabilityType[]).map(t => {
            const meta = LIABILITY_LABELS[t]
            const rec = byType(t)
            const isManual = MANUAL_LIABILITIES.includes(t)
            // Manual liabilities have no computed source, so the saved figure
            // is the only one there is.
            const amt = isManual ? (rec?.amount_due ?? 0) : (amounts[t] ?? 0)
            const isEditing = editing === t
            return (
              <tr key={t} className="hover:bg-gray-50 align-top">
                <Td>
                  <span className="font-medium text-sm">{meta.label}</span>
                  <div className="text-[10px] text-gray-400 max-w-xs">{meta.hint}</div>
                </Td>
                <Td right className="font-semibold text-sm">{inr(amt)}</Td>
                <Td className="text-xs text-gray-500">{meta.dueDay}</Td>
                <Td>
                  {amt <= 0 ? <Badge color="gray">Nil</Badge>
                    : rec?.status === 'Paid' ? <Badge color="green">Remitted</Badge>
                    : <Badge color="orange">Pending</Badge>}
                </Td>
                {isEditing ? (
                  <>
                    <Td>
                      {isManual && (
                        <Input label="" type="number" value={manualAmount}
                          onChange={e => setManualAmount(e.target.value)}
                          className="w-28 text-xs mb-1" placeholder="Amount" />
                      )}
                      <Input label="" value={challanNo} onChange={e => setChallanNo(e.target.value)} className="w-32 text-xs" placeholder="Challan/Ack No." />
                    </Td>
                    <Td>
                      <Input label="" type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} className="w-36 text-xs" />
                      <select value={paidViaPartner} onChange={e => setPaidViaPartner(e.target.value)}
                        className="w-36 mt-1 border border-gray-300 rounded px-1 py-1 text-xs"
                        title="Who actually remitted this challan">
                        <option value="">Paid from our bank</option>
                        {(payers as any[]).map(p => (
                          <option key={p.key} value={p.key}>Paid via {p.name}</option>
                        ))}
                      </select>
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => saveRemittance(t, 'Paid')}>Save</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                      </div>
                    </Td>
                  </>
                ) : (
                  <>
                    <Td className="text-xs font-mono">{rec?.challan_no ?? '—'}</Td>
                    <Td className="text-xs">
                      {rec?.paid_date ?? '—'}
                      {(rec?.paid_via_party_id || rec?.paid_via_partner_id) && (
                        <div className="text-[10px] text-purple-600 mt-0.5">
                          via {payerName(rec) ?? 'another account'}
                        </div>
                      )}
                    </Td>
                    <Td>
                      {/* Manual liabilities have no computed amount, so the
                          Mark Remitted button must not be hidden by amt = 0. */}
                      {(amt > 0 || isManual) && (
                        rec?.status === 'Paid'
                          ? <button onClick={() => openMark(t)} className="p-1 text-gray-400 hover:text-blue-600" title="Edit"><Pencil size={13} /></button>
                          : <Button size="sm" icon={<CheckCircle2 size={13} />} onClick={() => openMark(t)}>Mark Remitted</Button>
                      )}
                    </Td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </Table>
    </Card>
  )
}

// ── FORM 16 — PART B ──────────────────────────────────────────────────────────
// Read only. Sums salary_monthly over a financial year and lays the figures out
// as the Part B annexure. Nothing here writes, and none of the ESI / PF / PT /
// EPS / EDLI arithmetic above or in computeSalaryForEmp is touched — this only
// reads what those calculations already saved.
//
// TWO LIMITS, stated on the form itself rather than left to be discovered:
//  * PART A CANNOT COME FROM ANY APP. It is downloaded from TRACES once the
//    quarterly 24Q return is filed, and carries the government's own
//    certificate number. This is Part B, the annexure the employer prepares.
//  * The app holds no investment declarations - no 80C beyond the employee's
//    own PF, no HRA proof, no housing loan interest, and no tax regime. So the
//    figures here are what the EMPLOYER knows, and the tax computation itself
//    is left to whoever files rather than invented from a guessed regime.

const FY_LABEL = (startYear: number) => `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`
const AY_LABEL = (startYear: number) => `${startYear + 1}-${String((startYear + 2) % 100).padStart(2, '0')}`

const Form16PartB: React.FC = () => {
  const now = new Date()
  // Indian financial year runs 1 April to 31 March, so before April the current
  // FY still started in the previous calendar year.
  const [fyStart, setFyStart] = useState(now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1)
  const [search, setSearch] = useState('')

  const fyFrom = `${fyStart}-04-01`
  const fyTo   = `${fyStart + 1}-03-31`

  const { data: company } = useQuery({
    queryKey: ['company_settings_form16'],
    queryFn: async () => {
      const { data } = await supabase.from('company_settings')
        .select('company_name,address_line1,address_line2,tan_no,pan_no').limit(1).maybeSingle()
      return data ?? null
    }
  })

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['form16', fyFrom, fyTo],
    queryFn: async () => {
      const all = await fetchAllPages<any>((from, to) => supabase.from('salary_monthly')
        .select('id,month,total_earning,gross_salary,earned_salary,pf_employee,pt,tds,tds_deposited,provisional,employees!employee_id!inner(id,name,emp_id,designation,pan_no,uan_no)')
        .gte('month', fyFrom).lte('month', fyTo)
        .order('month').order('id').range(from, to),
        'Form 16', m => toast.error(m))

      const byEmp: Record<string, any> = {}
      for (const r of all) {
        const e = r.employees ?? {}
        // A month calculated before it ended is provisional and is not a real
        // figure yet - counting it would overstate the year on a statutory
        // document. It is counted separately so the form can say so.
        const prov = !!r.provisional
        const g = byEmp[e.id] ||= {
          id: e.id, name: e.name ?? '', emp_id: e.emp_id ?? '', designation: e.designation ?? '',
          pan: e.pan_no ?? '', uan: e.uan_no ?? '',
          gross: 0, pf: 0, pt: 0, tds: 0, tdsDeposited: 0, months: 0, provisionalMonths: 0,
        }
        if (prov) { g.provisionalMonths++; continue }
        g.months++
        g.gross += Number(r.total_earning ?? r.gross_salary ?? r.earned_salary ?? 0)
        g.pf    += Number(r.pf_employee ?? 0)
        g.pt    += Number(r.pt ?? 0)
        g.tds   += Number(r.tds ?? 0)
        g.tdsDeposited += Number(r.tds_deposited ?? 0)
      }
      return Object.values(byEmp).sort((a: any, b: any) =>
        String(a.emp_id).localeCompare(String(b.emp_id)) || String(a.name).localeCompare(String(b.name)))
    }
  })

  const q = search.trim().toLowerCase()
  const shown = (rows as any[]).filter(r => !q ||
    [r.name, r.emp_id, r.pan].some(v => String(v ?? '').toLowerCase().includes(q)))

  const missingPan = shown.filter(r => !String(r.pan ?? '').trim())
  const withProvisional = shown.filter(r => r.provisionalMonths > 0)

  const printOne = (r: any) => {
    const chargeable = r.gross - r.pt
    const co = company ?? ({} as any)
    printReport({
      title: 'FORM 16 — PART B (Annexure)',
      subtitle:
        `${r.name}${r.emp_id ? ` (${r.emp_id})` : ''}` +
        `${r.designation ? ` · ${r.designation}` : ''}` +
        ` · PAN ${r.pan || 'NOT ON RECORD'}` +
        ` — Financial Year ${FY_LABEL(fyStart)}, Assessment Year ${AY_LABEL(fyStart)}` +
        ` · Employer TAN ${co.tan_no || 'not set'} · Employer PAN ${co.pan_no || 'not set'}` +
        ` · Period 01/04/${fyStart} to 31/03/${fyStart + 1} · ${r.months} month(s) of salary`,
      headers: ['Particulars', 'Amount'],
      rightAlignFrom: 1,
      rows: [
        ['1. Gross salary — section 17(1)', inr(r.gross)],
        ['2. Less: allowances exempt under section 10', 'Not held by the employer — see note'],
        ['3. Less: deduction under section 16(iii) — professional tax', inr(r.pt)],
        ['4. Income chargeable under the head Salaries (1 − 3)', inr(chargeable)],
        ['5. Deduction under Chapter VI-A — 80C, employee provident fund', inr(r.pf)],
        ['6. Tax deducted at source on salary', inr(r.tds)],
        ['7. Of which shown as deposited', inr(r.tdsDeposited)],
        ['', ''],
        ['NOTE — Part A is not produced here. It is downloaded from TRACES after the quarterly 24Q return is filed and carries the certificate number.', ''],
        ['NOTE — The app holds no investment declarations: no 80C beyond the provident fund above, no HRA proof, no housing loan interest and no tax regime. Standard deduction and the tax on total income are therefore NOT computed here and must be completed by whoever files.', ''],
        ...(r.provisionalMonths ? [[`NOTE — ${r.provisionalMonths} month(s) in this year are PROVISIONAL (calculated before the month ended) and are EXCLUDED from every figure above. Recalculate those months to include them.`, '']] : []),
      ],
      footerRow: ['Income chargeable under Salaries', inr(chargeable)],
    })
  }

  const exportAll = () => {
    if (!shown.length) { toast.error('Nothing to export'); return }
    const co = company ?? ({} as any)
    const headers = ['Emp Code','Name','Designation','Employee PAN','UAN','Months counted',
      'Gross salary 17(1)','Professional tax 16(iii)','Income chargeable','80C — employee PF',
      'TDS deducted','TDS shown deposited','Provisional months excluded']
    const body = shown.map(r => [
      r.emp_id, r.name, r.designation, r.pan || 'NOT ON RECORD', r.uan, r.months,
      r.gross, r.pt, r.gross - r.pt, r.pf, r.tds, r.tdsDeposited, r.provisionalMonths,
    ])
    const ws = XLSX.utils.aoa_to_sheet([
      [`FORM 16 PART B — ${co.company_name ?? 'Employer'} — FY ${FY_LABEL(fyStart)} (AY ${AY_LABEL(fyStart)})`],
      [`Employer TAN ${co.tan_no ?? 'not set'} · Employer PAN ${co.pan_no ?? 'not set'}`],
      ['Part A comes from TRACES, not from this app. No investment declarations are held, so standard deduction and tax on total income are not computed here.'],
      [],
      headers, ...body,
    ])
    ws['!cols'] = [{wch:14},{wch:26},{wch:18},{wch:14},{wch:16},{wch:14},
      {wch:18},{wch:20},{wch:18},{wch:18},{wch:14},{wch:18},{wch:22}]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Form 16 Part B')
    XLSX.writeFile(wb, `Form16_PartB_FY${FY_LABEL(fyStart)}.xlsx`)
    toast.success(`Exported ${shown.length} employee(s)`)
  }

  const fyOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <Card>
      <SectionHeader title="Form 16 — Part B (Annexure)"
        subtitle="Salary, professional tax, provident fund and TDS for a financial year, per employee" />

      <div className="flex flex-wrap gap-3 items-end mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Financial Year</label>
          <select value={fyStart} onChange={e => setFyStart(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {fyOptions.map(y => <option key={y} value={y}>{FY_LABEL(y)} (AY {AY_LABEL(y)})</option>)}
          </select>
        </div>
        <Input label="Search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Name, emp code or PAN…" className="w-56" />
        <Button variant="outline" icon={<Download size={14} />} onClick={exportAll}>Export All (Excel)</Button>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 mb-3">
        <strong>This is Part B only.</strong> Part A is downloaded from TRACES after the quarterly 24Q return is
        filed — no app can produce it. And because no investment declarations are held here (nothing beyond the
        employee's own PF, no HRA proof, no housing loan interest, no tax regime), the standard deduction and the
        tax on total income are deliberately NOT computed — those are for whoever files, not for a guess.
      </div>

      {missingPan.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 mb-3">
          <strong>{missingPan.length} employee(s) have no PAN on record</strong> — a Form 16 without a PAN is not
          valid, and TDS without PAN attracts a higher rate. Add it in Employees:{' '}
          {missingPan.slice(0, 12).map(r => r.name).join(', ')}{missingPan.length > 12 ? ', …' : ''}
        </div>
      )}

      {withProvisional.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 mb-3">
          <strong>{withProvisional.length} employee(s) have provisional month(s) in this year</strong> — months
          calculated before they ended. They are EXCLUDED from every figure here, because a part-finished month is
          not a real one and must never reach a statutory certificate. Recalculate those months to include them.
        </div>
      )}

      {isLoading ? <div className="flex justify-center p-6"><Spinner size={24} /></div> : (
        <Table>
          <thead><tr>
            <Th>Code</Th><Th>Name</Th><Th>PAN</Th><Th right>Months</Th>
            <Th right>Gross 17(1)</Th><Th right>PT 16(iii)</Th><Th right>Chargeable</Th>
            <Th right>80C — PF</Th><Th right>TDS</Th><Th></Th>
          </tr></thead>
          <tbody>
            {shown.map((r: any) => (
              <tr key={r.id} className={!String(r.pan ?? '').trim() ? 'bg-amber-50' : ''}>
                <Td><span className="font-mono text-xs font-bold text-brand-700">{r.emp_id || '—'}</span></Td>
                <Td className="font-medium">{r.name}</Td>
                <Td className="text-xs font-mono">{r.pan || <span className="text-amber-700">no PAN</span>}</Td>
                <Td right className="text-xs">{r.months}</Td>
                <Td right>{inr(r.gross)}</Td>
                <Td right>{inr(r.pt)}</Td>
                <Td right className="font-semibold">{inr(r.gross - r.pt)}</Td>
                <Td right>{inr(r.pf)}</Td>
                <Td right>{inr(r.tds)}</Td>
                <Td>
                  <Button size="sm" variant="ghost" icon={<Printer size={13} />} onClick={() => printOne(r)}>
                    Form 16
                  </Button>
                </Td>
              </tr>
            ))}
            {!shown.length && (
              <tr><Td colSpan={10} className="text-center text-gray-400 py-6">
                No salary records for FY {FY_LABEL(fyStart)}{q ? ' matching this search' : ''}
              </Td></tr>
            )}
          </tbody>
        </Table>
      )}
    </Card>
  )
}

export const StatutoryFilingPage: React.FC = () => {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const { start, end } = monthRange(month)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['statutory_filing', month],
    enabled: !!month,
    queryFn: async () => {
      const { data, error } = await supabase.from('salary_monthly')
        .select('basic_salary,gross_salary,pf_employee,employer_eps,employer_epf_diff,admin_charges,edli_charge,esi_employee,esi_employer,pt,days_worked,month_days,absent_days,employees!employee_id!inner(name,emp_id,uan_no,pf_no,esi_no,restrict_pf,pf_applicable,esi_applicable,pt_applicable)')
        .eq('month', month + '-01')
      if (error) throw error
      return (data ?? []).map((r: any) => {
        const e = r.employees ?? {}
        const basic = Number(r.basic_salary ?? 0)
        const pfWage = e.restrict_pf ? Math.min(basic, PF_CEIL) : basic        // EPF wages
        const epsWage = Math.min(basic, PF_CEIL)                               // EPS/EDLI wages
        const ncp = Math.max(0, Number(r.month_days ?? 0) - Number(r.days_worked ?? 0))
        return {
          name: e.name ?? '', emp_id: e.emp_id ?? '', uan: e.uan_no || e.pf_no || '', esi_no: e.esi_no ?? '',
          pf_applicable: !!e.pf_applicable, esi_applicable: !!e.esi_applicable, pt_applicable: !!e.pt_applicable,
          gross: Number(r.gross_salary ?? 0), basic, days: Number(r.days_worked ?? 0), ncp,
          pfWage, epsWage,
          ee: Number(r.pf_employee ?? 0), eps: Number(r.employer_eps ?? 0), erDiff: Number(r.employer_epf_diff ?? 0),
          admin: Number(r.admin_charges ?? 0), edli: Number(r.edli_charge ?? 0),
          esiEE: Number(r.esi_employee ?? 0), esiER: Number(r.esi_employer ?? 0),
          pt: Number(r.pt ?? 0),
        }
      })
    }
  })

  const pfRows = (rows as any[]).filter(r => r.pf_applicable)
  const esiRows = (rows as any[]).filter(r => r.esi_applicable && r.basic <= 21000)  // ESI on Basic
  const ptRows = (rows as any[]).filter(r => r.pt > 0)

  // TDS Payable — deducted from vendor bills this month (matches TDS Payable report's date basis: grn_date)
  const { data: tdsPayableAmt = 0 } = useQuery({
    queryKey: ['sl_tds_payable', month],
    queryFn: async () => {
      const { data } = await supabase.from('pending_payments').select('tds_amount')
        .gt('tds_amount', 0).gte('grn_date', start).lte('grn_date', end)
      return (data ?? []).reduce((s, r: any) => s + Number(r.tds_amount ?? 0), 0)
    }
  })
  // TDS Receivable — deducted BY customers from HE dispatch sales this month
  const { data: tdsReceivableAmt = 0 } = useQuery({
    queryKey: ['sl_tds_receivable', month],
    queryFn: async () => {
      const { data } = await supabase.from('he_dispatch').select('tds_amount')
        .gt('tds_amount', 0).gte('dispatch_date', start).lte('dispatch_date', end)
      return (data ?? []).reduce((s, r: any) => s + Number(r.tds_amount ?? 0), 0)
    }
  })
  // GST Payable — output GST on sales (NHE + HE) + RCM GST on purchases (no ITC claimed, per policy)
  const { data: gstPayableAmt = 0 } = useQuery({
    queryKey: ['sl_gst_payable', month],
    queryFn: async () => {
      const [nhe, he, rcm] = await Promise.all([
        supabase.from('nhe_sales').select('cgst_amount,sgst_amount,igst_amount').gte('sale_date', start).lte('sale_date', end),
        supabase.from('he_dispatch').select('cgst_amount,sgst_amount,igst_amount').gte('dispatch_date', start).lte('dispatch_date', end),
        supabase.from('grn').select('cgst_amount,sgst_amount,igst_amount').eq('is_rcm', true).gte('grn_date', start).lte('grn_date', end),
      ])
      const sum = (rows: any[] | null) => (rows ?? []).reduce((s, r) => s + Number(r.cgst_amount ?? 0) + Number(r.sgst_amount ?? 0) + Number(r.igst_amount ?? 0), 0)
      return sum(nhe.data) + sum(he.data) + sum(rcm.data)
    }
  })

  const t = (arr: any[], k: string) => arr.reduce((s, r) => s + (r[k] || 0), 0)
  const pfPayableAmt  = t(pfRows, 'ee') + t(pfRows, 'eps') + t(pfRows, 'erDiff') + t(pfRows, 'admin') + t(pfRows, 'edli')
  // ESIC computes the EMPLOYER share once on the month's total wage, not per
  // employee. The August 2026 contribution history shows Rs 9,556 on wages of
  // Rs 2,94,009 (3.25% = 9,555.29, rounded up once); adding up the 23
  // per-employee round-ups the app stores on salary_monthly gives Rs 9,568.
  // The challan is the aggregate, so the aggregate is what is payable here.
  // The EMPLOYEE share is per-IP and already matches the filing to the rupee,
  // so it stays a straight sum of the stored values.
  //
  // Nothing is written back: the per-employee esi_employer on each salary row
  // is the internal cost allocation and still feeds CTC, the Salary Register
  // and the payslip. Only this page's payable figure uses the ESIC basis.
  const esiWageTotal   = t(esiRows, 'basic')
  const esiErChallan   = esiWageTotal > 0 ? Math.ceil(esiWageTotal * 0.0325) : 0
  const esiErAllocated = t(esiRows, 'esiER')
  const esiPayableAmt  = t(esiRows, 'esiEE') + esiErChallan
  const ptPayableAmt  = t(ptRows, 'pt')

  const liabilityAmounts: Record<LiabilityType, number> = {
    tds_payable: tdsPayableAmt, tds_receivable: tdsReceivableAmt, gst_payable: gstPayableAmt,
    pf_payable: pfPayableAmt, esi_payable: esiPayableAmt, pt_payable: ptPayableAmt,
    // Nothing to compute these from — they are typed in when marking them
    // remitted, so 0 here just means "not entered yet".
    advance_tax: 0, late_fee: 0,
  }

  // EPFO ECR text file: UAN#~#Name#~#Gross#~#EPFWage#~#EPSWage#~#EDLIWage#~#EE#~#EPS#~#ERdiff#~#NCP#~#Refund
  const exportECR = () => {
    if (!pfRows.length) { toast.error('No PF-applicable employees this month'); return }
    const lines = pfRows.map(r => [
      r.uan, r.name, Math.round(r.gross), Math.round(r.pfWage), Math.round(r.epsWage), Math.round(r.epsWage),
      Math.round(r.ee), Math.round(r.eps), Math.round(r.erDiff), r.ncp, 0,
    ].join('#~#'))
    downloadFile(`ECR_${month}.txt`, lines.join('\n'))
    toast.success(`ECR: ${pfRows.length} members`)
  }
  // Matches the ESIC portal's own "Monthly Contribution" upload template
  // exactly — column headers, column order, and file format (.xls, all
  // columns as TEXT so IP Number/dates aren't reformatted by Excel).
  // Contribution amounts are deliberately NOT included: the ESIC system
  // computes Employee/Employer % itself from wages, it doesn't accept them.
  // Reason Code defaults to '0' (Without Reason) and Last Working Day is
  // left blank — this app doesn't yet track employee exits for ESIC, so
  // every row is filed as a normal working month. Wage basis and ESI
  // eligibility are unchanged — this only reshapes the exported file.
  const exportESIC = () => {
    if (!esiRows.length) { toast.error('No ESI-applicable employees this month'); return }
    const header = [
      'IP Number \n(10 Digits)',
      'IP Name\n( Only alphabets and space )',
      'No of Days for which wages paid/payable during the month',
      'Total Monthly Wages',
      ' Reason Code for Zero workings days(numeric only; provide 0 for all other reasons- Click on the link for reference)',
      ' Last Working Day\n( Format DD/MM/YYYY  or DD-MM-YYYY)',
    ]
    const data = esiRows.map(r => [
      String(r.esi_no ?? ''), String(r.name ?? ''),
      String(Math.ceil(r.days)), String(Math.round(r.basic)),
      '0', '',
    ])
    const ws = XLSX.utils.aoa_to_sheet([header, ...data])
    // Force every cell (including the header) to TEXT type, per the
    // template's own instructions — an ESIC-portal-format requirement.
    Object.keys(ws).forEach(addr => {
      if (addr[0] === '!') return
      if (ws[addr]) ws[addr].t = 's'
    })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `ESIC_${month}.xls`, { bookType: 'biff8' })
    toast.success(`ESIC: ${esiRows.length} IPs`)
  }
  const exportPT = () => {
    if (!ptRows.length) { toast.error('No PT this month'); return }
    downloadFile(`PT_${month}.csv`, csv([
      ['Emp Code', 'Name', 'PT Amount'],
      ...ptRows.map(r => [r.emp_id, r.name, Math.round(r.pt)]),
    ]), 'text/csv')
    toast.success(`PT: ${ptRows.length} employees`)
  }

  return (
    <div className="space-y-4 p-4">
      <SectionHeader title="Statutory Compliance Center" subtitle="TDS, GST, PF, ESI and PT — amount due, filing exports, and remittance tracking, all in one place." />
      <Card className="p-3 flex flex-wrap gap-3 items-end">
        <Input label="Month" type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-48" />
        <Button variant="outline" icon={<Download size={14} />} onClick={exportECR}>PF ECR (.txt)</Button>
        <Button variant="outline" icon={<Download size={14} />} onClick={exportESIC}>ESIC (.csv)</Button>
        <Button variant="outline" icon={<Download size={14} />} onClick={exportPT}>PT (.csv)</Button>
      </Card>

      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RemittanceTracker month={month} amounts={liabilityAmounts} />

          <Card padding={false}>
            <div className="px-3 py-2 border-b font-semibold text-sm text-purple-700">PF (ECR) — {pfRows.length} members</div>
            <Table>
              <thead><tr><Th>UAN / Name</Th><Th right>EE 12%</Th><Th right>EPS</Th><Th right>ER 3.67%</Th></tr></thead>
              <tbody>
                {pfRows.map((r, i) => (
                  <tr key={i}><Td className="text-xs">{r.uan || '⚠ no UAN'}<div className="text-[10px] text-gray-400">{r.name} · NCP {r.ncp}</div></Td>
                    <Td right className="text-xs">{inr(r.ee)}</Td><Td right className="text-xs">{inr(r.eps)}</Td><Td right className="text-xs">{inr(r.erDiff)}</Td></tr>
                ))}
                <tr className="bg-gray-50 font-semibold"><Td>Total</Td><Td right>{inr(t(pfRows,'ee'))}</Td><Td right>{inr(t(pfRows,'eps'))}</Td><Td right>{inr(t(pfRows,'erDiff'))}</Td></tr>
              </tbody>
            </Table>
          </Card>
          <Card padding={false}>
            <div className="px-3 py-2 border-b font-semibold text-sm text-blue-700">ESIC — {esiRows.length} IPs</div>
            <Table>
              <thead><tr><Th>IP / Name</Th><Th right>Wages (Basic)</Th><Th right>EE</Th><Th right>ER</Th></tr></thead>
              <tbody>
                {esiRows.map((r, i) => (
                  <tr key={i}><Td className="text-xs">{r.esi_no || '⚠ no IP'}<div className="text-[10px] text-gray-400">{r.name} · {Math.ceil(r.days)}d</div></Td>
                    <Td right className="text-xs">{inr(r.basic)}</Td><Td right className="text-xs">{inr(r.esiEE)}</Td><Td right className="text-xs">{inr(r.esiER)}</Td></tr>
                ))}
                <tr className="bg-gray-50 font-semibold"><Td>Total</Td><Td right>{inr(esiWageTotal)}</Td><Td right>{inr(t(esiRows,'esiEE'))}</Td><Td right>{inr(esiErChallan)}</Td></tr>
              </tbody>
            </Table>
            {esiErChallan !== esiErAllocated && (
              <p className="px-3 py-2 text-[11px] text-gray-500 border-t">
                Employer total is 3.25% of the month's total wages, rounded up once — the way ESIC
                computes the challan. The per-employee ER figures above are each rounded up
                separately and add to {inr(esiErAllocated)}; that allocation is what CTC and the
                Salary Register use.
              </p>
            )}
          </Card>
          <Card padding={false}>
            <div className="px-3 py-2 border-b">
              <p className="font-semibold text-sm text-orange-700">PT — {ptRows.length} employees</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                ₹150 slab (₹15,001–₹20,000): {ptRows.filter(r => r.pt === 150).length} employees
                {' · '}₹200 slab (above ₹20,000): {ptRows.filter(r => r.pt === 200).length} employees
              </p>
            </div>
            <Table>
              <thead><tr><Th>Name</Th><Th right>PT</Th></tr></thead>
              <tbody>
                {ptRows.map((r, i) => (<tr key={i}><Td className="text-xs">{r.emp_id ? r.emp_id + ' — ' : ''}{r.name}</Td><Td right className="text-xs">{inr(r.pt)}</Td></tr>))}
                <tr className="bg-gray-50 font-semibold"><Td>Total</Td><Td right>{inr(t(ptRows,'pt'))}</Td></tr>
              </tbody>
            </Table>
          </Card>
        </div>
      )}
      <Form16PartB />

      <p className="text-xs text-gray-400">Rows with ⚠ are missing UAN / IP number — add them in Employees so the upload file is valid. ECR uses the ₹15,000 EPS/EDLI ceiling; PF wage respects each employee's Restrict PF. GST Payable assumes no ITC is claimed on purchases (per company policy) — it is Output GST on sales plus RCM GST on purchases marked Reverse Charge.</p>
    </div>
  )
}
