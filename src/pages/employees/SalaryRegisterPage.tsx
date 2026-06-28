import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import { Card, CardHeader, Button, Select, Table, Th, Td, Spinner, EmptyState, Modal, Badge } from '@/components/ui'
import { IndianRupee, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function monthLabel(m: string) {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return `${MONTH_NAMES[parseInt(mo)-1]} ${y}`
}

// Generate last 24 months
function monthOptions() {
  const opts = []
  const d = new Date()
  for (let i = 0; i < 24; i++) {
    const y = d.getFullYear()
    const mo = String(d.getMonth()+1).padStart(2,'0')
    opts.push(`${y}-${mo}`)
    d.setMonth(d.getMonth()-1)
  }
  return opts
}

export const SalaryRegisterPage: React.FC = () => {
  const today = new Date()
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`)
  const [filterFarm, setFilterFarm] = useState('')
  const [voucherEmp, setVoucherEmp] = useState<{ id: string; name: string } | null>(null)
  const [dedEmp, setDedEmp] = useState<{ id: string; name: string } | null>(null)

  // Advance voucher: the actual employee_advances entries behind a register's advance amount
  const { data: voucherRows } = useQuery({
    queryKey: ['adv_voucher', voucherEmp?.id, month],
    enabled: !!voucherEmp,
    queryFn: async () => {
      const { data } = await supabase.from('employee_advances')
        .select('advance_date,advance_type,amount,narration,salary_month')
        .eq('employee_id', voucherEmp!.id).eq('salary_month', month)
        .order('advance_date')
      return data ?? []
    }
  })

  // Deduction voucher: the employee_deductions (egg/bird purchases) behind Other Deduction
  const { data: dedRows } = useQuery({
    queryKey: ['ded_voucher', dedEmp?.id, month],
    enabled: !!dedEmp,
    queryFn: async () => {
      const { data } = await supabase.from('employee_deductions')
        .select('deduction_month,description,amount,status')
        .eq('employee_id', dedEmp!.id).eq('deduction_month', month + '-01')
        .order('description')
      return data ?? []
    }
  })

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name'); return data ?? [] }
  })

  const { data: rows, isLoading } = useQuery({
    queryKey: ['salary_register', month, filterFarm],
    enabled: !!month,
    queryFn: async () => {
      let q = supabase
        .from('salary_monthly')
        .select(`*, employees(emp_id,name,designation,emp_category,zone_area,farms(name))`)
        .eq('month', month + '-01')
        .order('emp_id', { referencedTable: 'employees', ascending: true, nullsFirst: false })
      const { data, error } = await q
      if (error) throw error
      let result = data ?? []
      if (filterFarm) result = result.filter((r: any) => r.employees?.farms?.name === filterFarm)
      // Sort by Employee ID (1 → last, site-wise) — PostgREST referencedTable order
      // only sorts the embedded object, not the rows, so sort here.
      const empNo = (r: any) => {
        const id = String(r.employees?.emp_id ?? '')
        const n = parseInt(id.replace(/\D/g, ''))
        return isNaN(n) ? Number.MAX_SAFE_INTEGER : n
      }
      result = [...result].sort((a: any, b: any) =>
        empNo(a) - empNo(b) || String(a.employees?.emp_id ?? '').localeCompare(String(b.employees?.emp_id ?? '')))
      return result
    }
  })

  const exportXLSX = () => {
    if (!rows?.length) { toast.error('No data to export'); return }
    const headers = [
      'Emp Code','Name','Category','Designation','Farm',
      'Month Days','Absent Days','Paid Days','Extra Days',
      'Gross Rate','Basic Rate','HRA Rate','Other Defray',
      'Basic Earned','HRA Earned','Other Earned','Gross Earned','Extra Pay','Total Earning',
      'PF Emp','ESI Emp','PT','Other Deduction','Advance',
      'Net Salary'
    ]
    const R = (v: any) => Math.round(Number(v) || 0)  // whole rupees, matches voucher
    const data = (rows as any[]).map(r => {
      const emp = r.employees ?? {}
      return [
        emp.emp_id??'', emp.name??'', emp.emp_category??'', emp.designation??'', emp.farms?.name??'',
        r.month_days??'', r.absent_days??0, r.days_worked??0, r.extra_days??0,
        R(r.gross_rate), R(r.basic_rate), R(r.hra_rate), R(r.other_defray),
        R(r.basic_salary), R(r.hra), R((r.gross_salary??0)-(r.basic_salary??0)-(r.hra??0)), R(r.gross_salary), R(r.extra_pay), R(r.total_earning),
        R(r.pf_employee), R(r.esi_employee), R(r.pt), R(r.other_deduction), R(r.advance),
        R(r.net_salary)
      ]
    })
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Register')
    XLSX.writeFile(wb, `SalaryRegister_${month}.xlsx`)
    toast.success('Downloaded')
  }

  const farmNames = Array.from(new Set((farms as any[])?.map((f: any) => f.name) ?? []))
  const totals = (rows as any[] ?? []).reduce((acc: any, r: any) => {
    acc.gross_rate     = (acc.gross_rate??0) + (r.gross_rate??0)
    acc.basic_salary   = (acc.basic_salary??0) + (r.basic_salary??0)
    acc.hra            = (acc.hra??0) + (r.hra??0)
    acc.allowance      = (acc.allowance??0) + ((r.gross_salary??0)-(r.basic_salary??0)-(r.hra??0))
    acc.total_earning  = (acc.total_earning??0) + (r.total_earning??0)
    acc.extra_pay      = (acc.extra_pay??0) + (r.extra_pay??0)
    acc.pf_employee    = (acc.pf_employee??0) + (r.pf_employee??0)
    acc.esi_employee   = (acc.esi_employee??0) + (r.esi_employee??0)
    acc.pt             = (acc.pt??0) + (r.pt??0)
    acc.other_deduction = (acc.other_deduction??0) + (r.other_deduction??0)
    acc.advance        = (acc.advance??0) + (r.advance??0)
    acc.net_salary     = (acc.net_salary??0) + (r.net_salary??0)
    return acc
  }, {})

  return (
    <div className="p-4 space-y-4">
      <CardHeader title={`Salary Register — ${monthLabel(month)}`} subtitle="All employees, one row per person"
        action={<Button size="sm" variant="outline" onClick={exportXLSX}><Download size={14} className="mr-1"/>Export Excel</Button>} />

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        ⚠️ This page shows the <strong>last saved calculation</strong>. It does not recalculate by itself.
        If you change advances, deductions, or <strong>Extra Days per Designation</strong>, go to
        <strong> Bulk Salary → select the month → "Save &amp; Calculate Salaries"</strong> to refresh these numbers.
      </div>

      <Card className="p-3 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Month</label>
          <Select value={month} onChange={e => setMonth(e.target.value)}
            options={monthOptions().map(m => ({ value: m, label: monthLabel(m) }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Farm</label>
          <Select value={filterFarm} onChange={e => setFilterFarm(e.target.value)}
            options={[{ value: '', label: 'All Farms' }, ...(farmNames as string[]).map(n => ({ value: n, label: n }))]} />
        </div>
      </Card>

      {isLoading && <Spinner />}
      {!isLoading && !rows?.length && (
        <EmptyState icon={<IndianRupee size={32}/>} title="No salary data for this month" subtitle="Run Bulk Salary to generate records" />
      )}
      {!isLoading && !!rows?.length && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Emp</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Name</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Designation</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Farm</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600">Days</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600">Absent</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600">Paid</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600">Extra</th>
                <th className="px-2 py-2 text-right font-semibold text-green-700">Gross Rate</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600">Basic</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600">HRA</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600">Allowance</th>
                <th className="px-2 py-2 text-right font-semibold text-blue-700">Total Earning</th>
                <th className="px-2 py-2 text-right font-semibold text-orange-600">Extra Pay</th>
                <th className="px-2 py-2 text-right font-semibold text-red-600">PF</th>
                <th className="px-2 py-2 text-right font-semibold text-red-600">ESI</th>
                <th className="px-2 py-2 text-right font-semibold text-red-600">PT</th>
                <th className="px-2 py-2 text-right font-semibold text-red-600">Adv</th>
                <th className="px-2 py-2 text-right font-semibold text-red-600">Other Ded</th>
                <th className="px-2 py-2 text-right font-semibold text-green-800 bg-green-50">Net Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(rows as any[]).map((r: any) => {
                const emp = r.employees ?? {}
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 font-mono text-brand-700 font-bold whitespace-nowrap">{emp.emp_id??'—'}</td>
                    <td className="px-2 py-1.5 font-medium whitespace-nowrap">{emp.name}</td>
                    <td className="px-2 py-1.5 text-gray-500 whitespace-nowrap">{emp.designation??'—'}</td>
                    <td className="px-2 py-1.5 text-gray-500 whitespace-nowrap">{emp.farms?.name??'—'}</td>
                    <td className="px-2 py-1.5 text-right">{r.month_days??'—'}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{r.absent_days??0}</td>
                    <td className="px-2 py-1.5 text-right">{r.days_worked??0}</td>
                    <td className="px-2 py-1.5 text-right text-orange-600">{r.extra_days??0}</td>
                    <td className="px-2 py-1.5 text-right text-green-700">{inr(r.gross_rate??0)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600">{inr(r.basic_salary??0)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600">{inr(r.hra??0)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600">{inr((r.gross_salary??0)-(r.basic_salary??0)-(r.hra??0))}</td>
                    <td className="px-2 py-1.5 text-right text-blue-700">{inr(r.total_earning??0)}</td>
                    <td className="px-2 py-1.5 text-right text-orange-600">{inr(r.extra_pay??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.pf_employee??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.esi_employee??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.pt??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">
                      {(r.advance??0) > 0
                        ? <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-medium border border-red-200 active:bg-red-100" title="Tap to view advance voucher"
                            onClick={() => setVoucherEmp({ id: r.employee_id, name: emp.name })}>{inr(r.advance)} 🔍</button>
                        : inr(r.advance??0)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-red-500">
                      {(r.other_deduction??0) > 0
                        ? <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-medium border border-red-200 active:bg-red-100" title="Tap to view deduction voucher"
                            onClick={() => setDedEmp({ id: r.employee_id, name: emp.name })}>{inr(r.other_deduction)} 🔍</button>
                        : inr(r.other_deduction??0)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-bold text-green-800 bg-green-50">{inr(r.net_salary??0)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold text-xs border-t-2 border-gray-300">
              <tr>
                <td colSpan={8} className="px-2 py-2 text-right text-gray-700">TOTAL ({rows.length} employees)</td>
                <td className="px-2 py-2 text-right text-green-700">{inr(totals.gross_rate??0)}</td>
                <td className="px-2 py-2 text-right text-gray-600">{inr(totals.basic_salary??0)}</td>
                <td className="px-2 py-2 text-right text-gray-600">{inr(totals.hra??0)}</td>
                <td className="px-2 py-2 text-right text-gray-600">{inr(totals.allowance??0)}</td>
                <td className="px-2 py-2 text-right text-blue-700">{inr(totals.total_earning??0)}</td>
                <td className="px-2 py-2 text-right text-orange-600">{inr(totals.extra_pay??0)}</td>
                <td className="px-2 py-2 text-right text-red-500">{inr(totals.pf_employee??0)}</td>
                <td className="px-2 py-2 text-right text-red-500">{inr(totals.esi_employee??0)}</td>
                <td className="px-2 py-2 text-right text-red-500">{inr(totals.pt??0)}</td>
                <td className="px-2 py-2 text-right text-red-500">{inr(totals.advance??0)}</td>
                <td className="px-2 py-2 text-right text-red-500">{inr(totals.other_deduction??0)}</td>
                <td className="px-2 py-2 text-right font-bold text-green-800 bg-green-100">{inr(totals.net_salary??0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {voucherEmp && (
        <Modal open={!!voucherEmp} onClose={() => setVoucherEmp(null)} title={`Advance Voucher — ${voucherEmp.name} · ${monthLabel(month)}`} size="md">
          {!voucherRows ? <Spinner /> : (voucherRows as any[]).length === 0 ? (
            <EmptyState icon={<IndianRupee size={28}/>} title="No advance entries for this month" subtitle="The advance shown may be a carried/opening balance — check Employees → Advances" />
          ) : (
            <div className="space-y-2">
              <Table>
                <thead><tr><Th>Date</Th><Th>Type</Th><Th>Narration</Th><Th right>Amount</Th></tr></thead>
                <tbody>
                  {(voucherRows as any[]).map((v: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 text-xs">{v.advance_date ?? '—'}</td>
                      <td className="px-2 py-1.5 text-xs"><Badge color="blue">{v.advance_type ?? '—'}</Badge></td>
                      <td className="px-2 py-1.5 text-xs text-gray-500">{v.narration ?? '—'}</td>
                      <td className="px-2 py-1.5 text-right font-medium">{inr(v.amount ?? 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={3} className="px-2 py-2 text-right">Total Advance</td>
                    <td className="px-2 py-2 text-right">{inr((voucherRows as any[]).reduce((s: number, v: any) => s + (v.amount ?? 0), 0))}</td>
                  </tr>
                </tbody>
              </Table>
              <p className="text-xs text-gray-400">These are the actual entries from Employees → Advances for this salary month. Delete a wrong one there, then re-run Bulk Salary → Save &amp; Calculate.</p>
            </div>
          )}
        </Modal>
      )}

      {dedEmp && (
        <Modal open={!!dedEmp} onClose={() => setDedEmp(null)} title={`Deduction Voucher — ${dedEmp.name} · ${monthLabel(month)}`} size="md">
          {!dedRows ? <Spinner /> : (dedRows as any[]).length === 0 ? (
            <EmptyState icon={<IndianRupee size={28}/>} title="No deduction entries for this month" subtitle="These come from employee egg/bird purchases (deduct from salary)." />
          ) : (
            <div className="space-y-2">
              <Table>
                <thead><tr><Th>Description</Th><Th>Status</Th><Th right>Amount</Th></tr></thead>
                <tbody>
                  {(dedRows as any[]).map((v: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 text-xs">{v.description ?? '—'}</td>
                      <td className="px-2 py-1.5 text-xs"><Badge color="blue">{v.status ?? '—'}</Badge></td>
                      <td className="px-2 py-1.5 text-right font-medium">{inr(v.amount ?? 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={2} className="px-2 py-2 text-right">Total Deduction</td>
                    <td className="px-2 py-2 text-right">{inr((dedRows as any[]).reduce((s: number, v: any) => s + (v.amount ?? 0), 0))}</td>
                  </tr>
                </tbody>
              </Table>
              <p className="text-xs text-gray-400">These are egg/bird purchases set to deduct from salary (Employees → from the flock sale). Fix a wrong one at source, then re-run Bulk Salary → Save &amp; Calculate.</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
