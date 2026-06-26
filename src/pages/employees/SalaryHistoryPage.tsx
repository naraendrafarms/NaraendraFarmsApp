import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import { Card, CardHeader, Button, Select, Spinner, EmptyState } from '@/components/ui'
import { IndianRupee, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function monthLabel(m: string) {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return `${MONTH_NAMES[parseInt(mo)-1]} ${y}`
}

export const SalaryHistoryPage: React.FC = () => {
  const [empId, setEmpId] = useState('')

  const { data: employees } = useQuery({
    queryKey: ['employees_list'],
    queryFn: async () => {
      const { data } = await supabase.from('employees').select('id,emp_id,name,designation,farms(name)').eq('is_active',true).order('name')
      return data ?? []
    }
  })

  const { data: rows, isLoading } = useQuery({
    queryKey: ['salary_history', empId],
    enabled: !!empId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salary_monthly')
        .select('*')
        .eq('employee_id', empId)
        .order('month', { ascending: false })
      if (error) throw error
      return data ?? []
    }
  })

  const selectedEmp = (employees as any[])?.find((e: any) => e.id === empId)

  const exportXLSX = () => {
    if (!rows?.length) { toast.error('No data'); return }
    const headers = [
      'Month','Month Days','Absent Days','Paid Days','Extra Days',
      'Gross Rate','Basic Earned','HRA Earned','Gross Earned','Extra Pay','Total Earning',
      'PF','ESI','PT','Advance','Other Deduction','Net Salary'
    ]
    const data = (rows as any[]).map(r => [
      monthLabel(r.month?.slice(0,7)), r.month_days??'', r.absent_days??0, r.days_worked??0, r.extra_days??0,
      r.gross_rate??0, r.basic_salary??0, r.hra??0, r.gross_salary??0, r.extra_pay??0, r.total_earning??0,
      r.pf_employee??0, r.esi_employee??0, r.pt??0, r.advance??0, r.other_deduction??0, r.net_salary??0
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Salary History')
    XLSX.writeFile(wb, `SalaryHistory_${selectedEmp?.name?.replace(/\s+/g,'_')}.xlsx`)
    toast.success('Downloaded')
  }

  return (
    <div className="p-4 space-y-4">
      <CardHeader title="Employee Salary History" subtitle="View all months for one employee"
        action={empId ? <Button size="sm" variant="outline" onClick={exportXLSX}><Download size={14} className="mr-1"/>Export Excel</Button> : undefined} />

      <Card className="p-3 flex flex-wrap gap-3 items-end">
        <div className="min-w-[220px]">
          <label className="block text-xs text-gray-500 mb-1">Employee</label>
          <Select value={empId} onChange={e => setEmpId(e.target.value)}
            options={[
              { value: '', label: '— Select Employee —' },
              ...(employees as any[] ?? []).map((e: any) => ({ value: e.id, label: `${e.name} (${e.emp_id})` }))
            ]} />
        </div>
      </Card>

      {!empId && <EmptyState icon={<IndianRupee size={32}/>} title="Select an employee" subtitle="Choose an employee above to see their salary history" />}
      {empId && isLoading && <Spinner />}
      {empId && !isLoading && !rows?.length && <EmptyState icon={<IndianRupee size={32}/>} title="No salary records found" subtitle="No salary records saved for this employee yet" />}
      {empId && !isLoading && !!rows?.length && (
        <div className="space-y-2">
          {selectedEmp && (
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{selectedEmp.name}</span>
              {selectedEmp.designation && <span className="ml-2 text-gray-400">· {selectedEmp.designation}</span>}
              {selectedEmp.farms?.name && <span className="ml-2 text-gray-400">· {selectedEmp.farms.name}</span>}
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Month</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">Days</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">Absent</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">Paid</th>
                  <th className="px-2 py-2 text-right font-semibold text-orange-600">Extra</th>
                  <th className="px-2 py-2 text-right font-semibold text-green-700">Gross Rate</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">Basic</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">HRA</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">Gross Earned</th>
                  <th className="px-2 py-2 text-right font-semibold text-orange-600">Extra Pay</th>
                  <th className="px-2 py-2 text-right font-semibold text-blue-700">Total Earning</th>
                  <th className="px-2 py-2 text-right font-semibold text-red-500">PF</th>
                  <th className="px-2 py-2 text-right font-semibold text-red-500">ESI</th>
                  <th className="px-2 py-2 text-right font-semibold text-red-500">PT</th>
                  <th className="px-2 py-2 text-right font-semibold text-red-500">Advance</th>
                  <th className="px-2 py-2 text-right font-semibold text-red-500">Other Ded</th>
                  <th className="px-2 py-2 text-right font-semibold text-green-800 bg-green-50">Net Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(rows as any[]).map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 font-medium whitespace-nowrap">{monthLabel(r.month?.slice(0,7))}</td>
                    <td className="px-2 py-1.5 text-right">{r.month_days??'—'}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{r.absent_days??0}</td>
                    <td className="px-2 py-1.5 text-right">{r.days_worked??0}</td>
                    <td className="px-2 py-1.5 text-right text-orange-600">{r.extra_days??0}</td>
                    <td className="px-2 py-1.5 text-right text-green-700">{inr(r.gross_rate??0)}</td>
                    <td className="px-2 py-1.5 text-right">{inr(r.basic_salary??0)}</td>
                    <td className="px-2 py-1.5 text-right">{inr(r.hra??0)}</td>
                    <td className="px-2 py-1.5 text-right">{inr(r.gross_salary??0)}</td>
                    <td className="px-2 py-1.5 text-right text-orange-600">{inr(r.extra_pay??0)}</td>
                    <td className="px-2 py-1.5 text-right text-blue-700">{inr(r.total_earning??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.pf_employee??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.esi_employee??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.pt??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.advance??0)}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{inr(r.other_deduction??0)}</td>
                    <td className="px-2 py-1.5 text-right font-bold text-green-800 bg-green-50">{inr(r.net_salary??0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
