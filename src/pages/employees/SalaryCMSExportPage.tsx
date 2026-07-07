import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, today } from '@/lib/utils'
import { Card, CardHeader, Button, Input, DateInput, Spinner, EmptyState } from '@/components/ui'
import { Download, AlertTriangle } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function monthLabel(m: string) {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return `${MONTH_NAMES[parseInt(mo) - 1]} ${y}`
}

// Same deposit-resolution rule as Salary History: an explicit per-row
// override wins, else a shared-account holder, else the employee's own account.
function depositHolder(row: any, employeesById: Record<string, any>) {
  const emp = employeesById[row.employee_id]
  if (!emp) return null
  if (row.override_account_emp_id) return employeesById[row.override_account_emp_id] ?? null
  if ((emp.payment_mode ?? 'own_account') === 'shared_account') {
    return employeesById[emp.shared_with_emp_id] ?? null
  }
  return emp
}

export const SalaryCMSExportPage: React.FC = () => {
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })
  const [includePaid, setIncludePaid] = useState(false)
  const [pymtDate, setPymtDate] = useState(today())
  const [unitBranch, setUnitBranch] = useState('Hyderabad')
  const [reference, setReference] = useState('')

  const { data: employees } = useQuery({
    queryKey: ['employees_for_cms'],
    queryFn: async () => {
      const { data } = await supabase.from('employees')
        .select('id,name,emp_id,bank_name,bank_branch,account_no,ifsc,payment_mode,shared_with_emp_id')
      return data ?? []
    }
  })
  const employeesById = React.useMemo(() => {
    const m: Record<string, any> = {}
    for (const e of (employees as any[] ?? [])) m[e.id] = e
    return m
  }, [employees])

  const monthStr = month + '-01'
  const { data: salaries, isLoading } = useQuery({
    queryKey: ['salary_monthly_for_cms', monthStr, includePaid],
    enabled: !!employees,
    queryFn: async () => {
      let q = supabase.from('salary_monthly').select('id,employee_id,net_salary,is_paid,override_account_emp_id').eq('month', monthStr)
      if (!includePaid) q = q.eq('is_paid', false)
      const { data, error } = await q
      if (error) { toast.error(error.message); return [] }
      return data ?? []
    }
  })

  const rows = React.useMemo(() => {
    return (salaries as any[] ?? [])
      .map(s => ({ salary: s, holder: depositHolder(s, employeesById), emp: employeesById[s.employee_id] }))
      .filter(r => r.emp)
      .sort((a, b) => (a.emp?.name ?? '').localeCompare(b.emp?.name ?? ''))
  }, [salaries, employeesById])

  const missingBankRows = rows.filter(r => !r.holder?.account_no || !r.holder?.ifsc || !r.holder?.bank_name)
  const total = rows.reduce((s, r) => s + (r.salary.net_salary ?? 0), 0)

  const exportCMS = () => {
    if (!rows.length) { toast.error('No salary rows for this month'); return }
    const ref = reference || `${monthLabel(month)} Salaries`
    const headers = ['DATE', 'PYMT TYPE', 'NAME OF THE BENEFICIARY', 'BENEFICIARY BANK NAME', 'BRANCH NAME', 'BRANCH IFSC', 'BANK ACC NO', 'AMOUNT RS.', 'UNIT / BRANCH', 'PAYMENT REFERANCES', 'Remarks']
    const dataRows = rows.map(r => [
      new Date(pymtDate), 'NEFT', r.holder?.name ?? r.emp?.name ?? '', r.holder?.bank_name ?? '', r.holder?.bank_branch ?? '',
      r.holder?.ifsc ?? '', r.holder?.account_no ?? '', r.salary.net_salary ?? 0, unitBranch, ref, ''
    ])
    const firstData = 3 // 1-indexed row after title(1) + header(2)
    const lastData = firstData + rows.length - 1
    const totalRow = ['', '', '', '', '', '', '', { f: `SUM(H${firstData}:H${lastData})` }, '', '', '']
    const aoa = [
      ['NARAENDRA FARMS CMS REPORT'],
      headers,
      ...dataRows,
      totalRow,
    ]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }]
    ws['!cols'] = [{wch:12},{wch:10},{wch:26},{wch:22},{wch:18},{wch:14},{wch:20},{wch:14},{wch:14},{wch:18},{wch:14}]
    for (let i = 0; i < rows.length; i++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 2 + i, c: 0 })]
      if (cell) cell.t = 'd'
    }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'NF CMS Sheet')
    XLSX.writeFile(wb, `NF_CMS_Salary_${month}.xlsx`)
    toast.success(`Exported ${rows.length} beneficiaries`)
  }

  return (
    <div className="space-y-4 p-4">
      <CardHeader title="Salary CMS Export" subtitle="Bulk NEFT payment sheet for bank upload" />

      <Card>
        <div className="flex flex-wrap gap-3 items-end p-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"/>
          </div>
          <DateInput label="Payment Date" value={pymtDate} onChange={e => setPymtDate(e.target.value)} />
          <Input label="Unit / Branch" value={unitBranch} onChange={e => setUnitBranch(e.target.value)} />
          <Input label="Payment Reference" placeholder={`${monthLabel(month)} Salaries`}
            value={reference} onChange={e => setReference(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
            <input type="checkbox" checked={includePaid} onChange={e => setIncludePaid(e.target.checked)} />
            Include already-Paid rows
          </label>
          <Button onClick={exportCMS} icon={<Download size={14}/>}>Export CMS Sheet</Button>
        </div>
      </Card>

      {missingBankRows.length > 0 && (
        <Card>
          <div className="p-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0"/>
            <div>
              <strong>{missingBankRows.length} employee(s) missing bank details</strong> (bank name / IFSC / account no) —
              they'll export with blank fields and the bank will reject those rows: {missingBankRows.map(r => r.emp?.name).join(', ')}
            </div>
          </div>
        </Card>
      )}

      <Card>
        {isLoading ? <div className="flex justify-center p-8"><Spinner size={28}/></div> :
         !rows.length ? <EmptyState title="No salary rows" subtitle="No unpaid salary_monthly rows found for this month"/> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Bank</th>
                <th className="text-left px-3 py-2">Branch</th>
                <th className="text-left px-3 py-2">IFSC</th>
                <th className="text-left px-3 py-2">Account No</th>
                <th className="text-right px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.salary.id} className={!r.holder?.account_no ? 'bg-amber-50' : ''}>
                  <td className="px-3 py-2">{r.holder?.name ?? r.emp?.name}</td>
                  <td className="px-3 py-2">{r.holder?.bank_name ?? '—'}</td>
                  <td className="px-3 py-2">{r.holder?.bank_branch ?? '—'}</td>
                  <td className="px-3 py-2">{r.holder?.ifsc ?? '—'}</td>
                  <td className="px-3 py-2">{r.holder?.account_no ?? '—'}</td>
                  <td className="px-3 py-2 text-right">{inr(r.salary.net_salary ?? 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t">
                <td className="px-3 py-2" colSpan={5}>Total ({rows.length})</td>
                <td className="px-3 py-2 text-right">{inr(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>}
      </Card>
    </div>
  )
}
