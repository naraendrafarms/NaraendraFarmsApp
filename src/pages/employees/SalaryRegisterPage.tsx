import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import { Card, CardHeader, Button, Select, Table, Th, Td, Spinner, EmptyState } from '@/components/ui'
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
        .order('employees(name)')
      const { data, error } = await q
      if (error) throw error
      let result = data ?? []
      if (filterFarm) result = result.filter((r: any) => r.employees?.farms?.name === filterFarm)
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
    const data = (rows as any[]).map(r => {
      const emp = r.employees ?? {}
      return [
        emp.emp_id??'', emp.name??'', emp.emp_category??'', emp.designation??'', emp.farms?.name??'',
        r.month_days??'', r.absent_days??0, r.days_worked??0, r.extra_days??0,
        r.gross_rate??0, r.basic_rate??0, r.hra_rate??0, r.other_defray??0,
        r.basic_salary??0, r.hra??0, (r.gross_salary??0)-(r.basic_salary??0)-(r.hra??0), r.gross_salary??0, r.extra_pay??0, r.total_earning??0,
        r.pf_employee??0, r.esi_employee??0, r.pt??0, r.other_deduction??0, r.advance??0,
        r.net_salary??0
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
                    <td className="px-2 py-1.5 text-right text-blue-700">{inr(r.total_earning??0)}</td>
                    <td className="px-2 py-1.5 text-right text-orange-600">{inr(r.extra_pay??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.pf_employee??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.esi_employee??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.pt??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.advance??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.other_deduction??0)}</td>
                    <td className="px-2 py-1.5 text-right font-bold text-green-800 bg-green-50">{inr(r.net_salary??0)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold text-xs border-t-2 border-gray-300">
              <tr>
                <td colSpan={8} className="px-2 py-2 text-right text-gray-700">TOTAL ({rows.length} employees)</td>
                <td className="px-2 py-2 text-right text-green-700">{inr(totals.gross_rate??0)}</td>
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
    </div>
  )
}
