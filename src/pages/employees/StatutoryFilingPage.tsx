import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import { Card, SectionHeader, Button, Input, Spinner, Table, Th, Td, Badge } from '@/components/ui'
import { Download, CheckCircle2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

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
type LiabilityType = 'tds_payable' | 'tds_receivable' | 'gst_payable' | 'pf_payable' | 'esi_payable' | 'pt_payable'
const LIABILITY_LABELS: Record<LiabilityType, { label: string; hint: string; dueDay: string }> = {
  tds_payable:    { label: 'TDS Payable',     hint: 'TDS deducted from vendor bills — must be deposited to the govt',              dueDay: '7th of next month' },
  tds_receivable: { label: 'TDS Receivable',  hint: 'TDS customers deducted from your sales — claim as credit / collect Form 16A',  dueDay: 'Track for return filing' },
  gst_payable:    { label: 'GST Payable',     hint: 'Output GST on sales + RCM GST on purchases (no ITC claimed, per policy)',      dueDay: '20th of next month (GSTR-3B)' },
  pf_payable:     { label: 'PF Payable',      hint: 'Employee + Employer PF (EPS/EPF/Admin/EDLI) for the month',                    dueDay: '15th of next month (ECR)' },
  esi_payable:    { label: 'ESI Payable',     hint: 'Employee + Employer ESI for the month',                                        dueDay: '15th of next month' },
  pt_payable:     { label: 'PT Payable',      hint: 'Professional Tax deducted from salaries',                                      dueDay: 'Per state schedule' },
}

const RemittanceTracker: React.FC<{ month: string; amounts: Record<LiabilityType, number> }> = ({ month, amounts }) => {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<LiabilityType | null>(null)
  const [challanNo, setChallanNo] = useState('')
  const [paidDate, setPaidDate] = useState('')
  const period = month + '-01'

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
  }

  const saveRemittance = async (t: LiabilityType, status: 'Paid' | 'Pending') => {
    const { error } = await supabase.from('statutory_liabilities').upsert({
      liability_type: t, period,
      amount_due: amounts[t] ?? 0,
      status,
      challan_no: status === 'Paid' ? (challanNo || null) : null,
      paid_date: status === 'Paid' ? (paidDate || null) : null,
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
      </div>
      <Table>
        <thead><tr><Th>Liability</Th><Th right>Amount Due</Th><Th>Due</Th><Th>Status</Th><Th>Challan / Ref No.</Th><Th>Remitted On</Th><Th></Th></tr></thead>
        <tbody>
          {(Object.keys(LIABILITY_LABELS) as LiabilityType[]).map(t => {
            const meta = LIABILITY_LABELS[t]
            const rec = byType(t)
            const amt = amounts[t] ?? 0
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
                    <Td><Input label="" value={challanNo} onChange={e => setChallanNo(e.target.value)} className="w-32 text-xs" placeholder="Challan/Ack No." /></Td>
                    <Td><Input label="" type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} className="w-36 text-xs" /></Td>
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
                    <Td className="text-xs">{rec?.paid_date ?? '—'}</Td>
                    <Td>
                      {amt > 0 && (
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
  const esiPayableAmt = t(esiRows, 'esiEE') + t(esiRows, 'esiER')
  const ptPayableAmt  = t(ptRows, 'pt')

  const liabilityAmounts: Record<LiabilityType, number> = {
    tds_payable: tdsPayableAmt, tds_receivable: tdsReceivableAmt, gst_payable: gstPayableAmt,
    pf_payable: pfPayableAmt, esi_payable: esiPayableAmt, pt_payable: ptPayableAmt,
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
  const exportESIC = () => {
    if (!esiRows.length) { toast.error('No ESI-applicable employees this month'); return }
    downloadFile(`ESIC_${month}.csv`, csv([
      ['IP Number', 'IP Name', 'No. of Days', 'Wages (Basic)', 'Employee 0.75%', 'Employer 3.25%'],
      ...esiRows.map(r => [r.esi_no, r.name, r.days, Math.round(r.basic), Math.round(r.esiEE), Math.round(r.esiER)]),
    ]), 'text/csv')
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
                  <tr key={i}><Td className="text-xs">{r.esi_no || '⚠ no IP'}<div className="text-[10px] text-gray-400">{r.name} · {r.days}d</div></Td>
                    <Td right className="text-xs">{inr(r.basic)}</Td><Td right className="text-xs">{inr(r.esiEE)}</Td><Td right className="text-xs">{inr(r.esiER)}</Td></tr>
                ))}
                <tr className="bg-gray-50 font-semibold"><Td>Total</Td><Td right>{inr(t(esiRows,'basic'))}</Td><Td right>{inr(t(esiRows,'esiEE'))}</Td><Td right>{inr(t(esiRows,'esiER'))}</Td></tr>
              </tbody>
            </Table>
          </Card>
          <Card padding={false}>
            <div className="px-3 py-2 border-b font-semibold text-sm text-orange-700">PT — {ptRows.length} employees</div>
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
      <p className="text-xs text-gray-400">Rows with ⚠ are missing UAN / IP number — add them in Employees so the upload file is valid. ECR uses the ₹15,000 EPS/EDLI ceiling; PF wage respects each employee's Restrict PF. GST Payable assumes no ITC is claimed on purchases (per company policy) — it is Output GST on sales plus RCM GST on purchases marked Reverse Charge.</p>
    </div>
  )
}
