import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today, fyRange, FY_OPTIONS } from '@/lib/utils'
import { Card, Button, Select, SectionHeader, Spinner, Table, Th, Td, Badge, DateInput } from '@/components/ui'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useConfigOptions } from '@/hooks/useConfigOptions'
import toast from 'react-hot-toast'

const TDS_RATE_OPTIONS = [
  { value: '', label: 'All Rates' },
  { value: '0.1', label: '0.1%' },
  { value: '1', label: '1%' },
  { value: '2', label: '2%' },
  { value: '5', label: '5%' },
  { value: '10', label: '10%' },
]

export const TDSPayable: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [fy, setFy] = useState('')
  const [rateFilter, setRateFilter] = useState('')

  const applyFy = (v: string) => {
    setFy(v)
    if (v) { const r = fyRange(v); setDateFrom(r.start); setDateTo(r.end) }
  }
  const [statusFilter, setStatusFilter] = useState('')
  const qc = useQueryClient()
  const tdsSectionOptions = useConfigOptions('tds_section', [])
  const sectionLabel = (code: string) => tdsSectionOptions.find(o => o.value === code)?.label ?? code

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['pending_payments_tds', dateFrom, dateTo],
    queryFn: async () => {
      // Only require tds_amount > 0 — some bills have TDS entered as a flat
      // amount (Pending Payments edit) without a tds_pct, so don't filter on rate.
      let q = supabase.from('pending_payments')
        .select('*, parties!party_id(pan_no,deductee_type), partners!partner_id(deductee_type)')
        .gt('tds_amount', 0)
        .order('grn_date', { ascending: false })
      if (dateFrom) q = q.gte('grn_date', dateFrom)
      if (dateTo) q = q.lte('grn_date', dateTo)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })

  // Salary TDS is a completely separate source (employees.tds via salary_monthly)
  // — this report used to only cover vendor bills, so employee TDS never showed.
  const { data: salaryRows = [], isLoading: loadingSalaryTDS } = useQuery({
    queryKey: ['salary_tds', dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase.from('salary_monthly')
        .select('id,month,tds,is_paid,tds_section,tds_interest,tds_deposited,tds_deposit_date,employees!employee_id(name,emp_id,pan_no,farms(name))')
        .gt('tds', 0)
        .order('month', { ascending: false })
      if (dateFrom) q = q.gte('month', dateFrom)
      if (dateTo) q = q.lte('month', dateTo)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })

  const pan = (r: any) => r.parties?.pan_no ?? r.employees?.pan_no ?? ''
  const deducteeType = (r: any) => r.parties?.deductee_type ?? r.partners?.deductee_type ?? 'Non-Company'

  // TDS deducted in month M is due to the government by the 7th of month
  // M+1 — completely independent of whether the vendor/employee themselves
  // have since been paid (that's payment_status / is_paid, a different thing).
  const tdsDueDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null
    const [y, m] = dateStr.split('T')[0].split('-').map(Number)
    const dueMonth = m === 12 ? 1 : m + 1
    const dueYear = m === 12 ? y + 1 : y
    return `${dueYear}-${String(dueMonth).padStart(2, '0')}-07`
  }
  const isOverdue = (r: any, dateField: string) => {
    if (r.tds_deposited) return false
    const due = tdsDueDate(r[dateField])
    return due ? due < today() : false
  }

  const updateVendorTds = async (id: string, patch: { tds_section?: string; tds_interest?: number; tds_deposited?: boolean; tds_deposit_date?: string | null }) => {
    const { error } = await supabase.from('pending_payments').update(patch).eq('id', id)
    if (error) { toast.error(error.message); return }
    qc.invalidateQueries({ queryKey: ['pending_payments_tds'] })
  }
  const updateSalaryTds = async (id: string, patch: { tds_section?: string; tds_interest?: number; tds_deposited?: boolean; tds_deposit_date?: string | null }) => {
    const { error } = await supabase.from('salary_monthly').update(patch).eq('id', id)
    if (error) { toast.error(error.message); return }
    qc.invalidateQueries({ queryKey: ['salary_tds'] })
  }
  const toggleDeposited = (updater: (id: string, patch: any) => void, r: any) => {
    updater(r.id, { tds_deposited: !r.tds_deposited, tds_deposit_date: !r.tds_deposited ? today() : null })
  }

  const filteredSalary = useMemo(() => {
    return (salaryRows as any[]).filter(r => {
      if (statusFilter === 'Pending' && r.is_paid) return false
      if (statusFilter === 'Paid' && !r.is_paid) return false
      return true
    })
  }, [salaryRows, statusFilter])

  const totalSalaryTDS = filteredSalary.reduce((s: number, r: any) => s + (r.tds ?? 0), 0)
  const pendingSalaryTDS = filteredSalary.filter((r: any) => !r.is_paid).reduce((s: number, r: any) => s + (r.tds ?? 0), 0)

  // Effective TDS % — use the stored rate; else derive from the TAXABLE base
  // (basic_amount, or invoice minus GST), not the GST-inclusive gross — a 2%
  // TDS bill with 18% GST used to derive as ~1.69% and fall outside the rate
  // filter's ±0.05 tolerance. A stored 0 also falls through to derivation.
  const effPct = (r: any) => {
    if (r.tds_pct > 0) return r.tds_pct
    const base = (r.basic_amount ?? 0) > 0 ? r.basic_amount
      : (r.invoice_amount ?? 0) - (r.gst_amount ?? 0) > 0 ? (r.invoice_amount ?? 0) - (r.gst_amount ?? 0)
      : r.invoice_amount ?? 0
    return base ? +((r.tds_amount ?? 0) / base * 100).toFixed(2) : 0
  }

  const filtered = useMemo(() => {
    return rows.filter((r: any) => {
      if (rateFilter) {
        if (Math.abs(effPct(r) - parseFloat(rateFilter)) > 0.05) return false
      }
      if (statusFilter) {
        if (statusFilter === 'Pending' && r.payment_status !== 'Pending') return false
        if (statusFilter === 'Paid' && r.payment_status !== 'Paid') return false
      }
      return true
    })
  }, [rows, rateFilter, statusFilter])

  // Summary by TDS rate
  const summary = useMemo(() => {
    const map: Record<string, { count: number; invoiceTotal: number; tdsTotal: number; netPayable: number }> = {}
    filtered.forEach((r: any) => {
      const pct = effPct(r)
      const key = `${pct}%`
      if (!map[key]) map[key] = { count: 0, invoiceTotal: 0, tdsTotal: 0, netPayable: 0 }
      map[key].count++
      map[key].invoiceTotal += r.invoice_amount ?? 0
      map[key].tdsTotal += r.tds_amount ?? 0
      map[key].netPayable += r.net_payable ?? (r.invoice_amount ?? 0) - (r.tds_amount ?? 0)
    })
    return Object.entries(map).sort(([a], [b]) => parseFloat(a) - parseFloat(b))
  }, [filtered])

  const totalInvoice = filtered.reduce((s: number, r: any) => s + (r.invoice_amount ?? 0), 0)
  const totalTDS = filtered.reduce((s: number, r: any) => s + (r.tds_amount ?? 0), 0)
  const totalNetPayable = filtered.reduce((s: number, r: any) => s + (r.net_payable ?? (r.invoice_amount ?? 0) - (r.tds_amount ?? 0)), 0)
  const pendingTDS = filtered.filter((r: any) => r.payment_status !== 'Paid').reduce((s: number, r: any) => s + (r.tds_amount ?? 0), 0)

  // Section-wise summary — groups both vendor bills and salary rows by tds_section
  const sectionSummary = useMemo(() => {
    const map: Record<string, { tax: number; interest: number }> = {}
    filtered.forEach((r: any) => {
      const key = r.tds_section || 'Unspecified'
      if (!map[key]) map[key] = { tax: 0, interest: 0 }
      map[key].tax += r.tds_amount ?? 0
      map[key].interest += r.tds_interest ?? 0
    })
    filteredSalary.forEach((r: any) => {
      const key = r.tds_section || 'Unspecified'
      if (!map[key]) map[key] = { tax: 0, interest: 0 }
      map[key].tax += r.tds ?? 0
      map[key].interest += r.tds_interest ?? 0
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered, filteredSalary])

  const exportXlsx = () => {
    const data = filtered.map((r: any) => ({
      Date: fmtDate(r.grn_date),
      Vendor: r.vendor_name ?? '',
      'GRN #': r.grn_no ?? '',
      'Invoice #': r.invoice_no ?? '',
      'Invoice Amount': r.invoice_amount ?? 0,
      'TDS %': effPct(r),
      'TDS Amount': r.tds_amount ?? 0,
      'Net Payable': r.net_payable ?? (r.invoice_amount ?? 0) - (r.tds_amount ?? 0),
      Status: r.payment_status ?? 'Pending',
      PAN: pan(r),
      'Deductee Type': deducteeType(r),
      'TDS Section': r.tds_section ?? '',
      'TDS Interest': r.tds_interest ?? 0,
      'TDS Due Date': tdsDueDate(r.grn_date) ? fmtDate(tdsDueDate(r.grn_date)) : '',
      'TDS Deposit Status': r.tds_deposited ? 'Deposited' : (isOverdue(r, 'grn_date') ? 'Overdue' : 'Pending'),
      'TDS Deposit Date': r.tds_deposit_date ? fmtDate(r.tds_deposit_date) : '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Vendor TDS')
    if (filteredSalary.length) {
      const salData = filteredSalary.map((r: any) => ({
        Month: r.month ? fmtDate(r.month) : '',
        Employee: r.employees?.name ?? '',
        'Emp ID': r.employees?.emp_id ?? '',
        Site: r.employees?.farms?.name ?? '',
        'TDS Amount': r.tds ?? 0,
        Status: r.is_paid ? 'Paid' : 'Pending',
        PAN: r.employees?.pan_no ?? '',
        'TDS Section': r.tds_section ?? '',
        'TDS Interest': r.tds_interest ?? 0,
        'TDS Due Date': tdsDueDate(r.month) ? fmtDate(tdsDueDate(r.month)) : '',
        'TDS Deposit Status': r.tds_deposited ? 'Deposited' : (isOverdue(r, 'month') ? 'Overdue' : 'Pending'),
        'TDS Deposit Date': r.tds_deposit_date ? fmtDate(r.tds_deposit_date) : '',
      }))
      const wsSal = XLSX.utils.json_to_sheet(salData)
      XLSX.utils.book_append_sheet(wb, wsSal, 'Salary TDS')
    }
    if (sectionSummary.length) {
      const secData = sectionSummary.map(([sec, s]) => ({
        Section: sec, Label: sec === 'Unspecified' ? '' : sectionLabel(sec),
        'Total Tax': s.tax, 'Total Interest': s.interest, 'Total TDS Payable': s.tax + s.interest,
      }))
      const wsSec = XLSX.utils.json_to_sheet(secData)
      XLSX.utils.book_append_sheet(wb, wsSec, 'Section Summary')
    }
    XLSX.writeFile(wb, 'TDS_Payable.xlsx')
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="TDS Payable" subtitle="Tax deducted at source — vendor payments and employee salaries" />

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <Select label="Financial Year" value={fy} onChange={e => applyFy(e.target.value)}
            options={[{ value: '', label: '— FY —' }, ...FY_OPTIONS.map(f => ({ value: f, label: `FY ${f}` }))]} />
          <DateInput label="From Date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setFy('') }} />
          <DateInput label="To Date" value={dateTo} onChange={e => { setDateTo(e.target.value); setFy('') }} />
          <Select label="TDS Rate" value={rateFilter} onChange={e => setRateFilter(e.target.value)}
            options={TDS_RATE_OPTIONS} />
          <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Paid', label: 'Paid' },
            ]} />
          <Button size="sm" variant="outline" onClick={exportXlsx}><Download size={14} className="mr-1" />Export</Button>
        </div>
      </Card>

      {isLoading ? <Spinner /> : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total Invoice Amount</p>
              <p className="text-lg font-bold text-gray-800">{inr(totalInvoice)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total TDS Deducted</p>
              <p className="text-lg font-bold text-red-600">{inr(totalTDS)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total Net Payable</p>
              <p className="text-lg font-bold text-green-700">{inr(totalNetPayable)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-gray-500 mb-1">TDS on Pending</p>
              <p className="text-lg font-bold text-orange-600">{inr(pendingTDS)}</p>
            </Card>
          </div>

          {/* Combined total across both sources */}
          <Card className="bg-gray-50">
            <div className="flex flex-wrap gap-6 justify-around text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Vendor TDS</p>
                <p className="text-lg font-bold text-red-600">{inr(totalTDS)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Salary TDS</p>
                <p className="text-lg font-bold text-red-600">{inr(totalSalaryTDS)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total TDS (Vendor + Salary)</p>
                <p className="text-xl font-bold text-gray-900">{inr(totalTDS + totalSalaryTDS)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Pending</p>
                <p className="text-lg font-bold text-orange-600">{inr(pendingTDS + pendingSalaryTDS)}</p>
              </div>
            </div>
          </Card>

          {/* Rate-wise summary */}
          {summary.length > 0 && (
            <Card>
              <p className="text-xs font-semibold text-gray-600 mb-2">Rate-wise Summary</p>
              <Table>
                <thead><tr>
                  <Th>TDS Rate</Th><Th right>Bills</Th><Th right>Invoice Amount</Th>
                  <Th right>TDS Amount</Th><Th right>Net Payable</Th>
                </tr></thead>
                <tbody>
                  {summary.map(([rate, s]) => (
                    <tr key={rate} className="hover:bg-gray-50">
                      <Td><Badge color="blue">{rate}</Badge></Td>
                      <Td right className="text-sm">{s.count}</Td>
                      <Td right className="text-sm">{inr(s.invoiceTotal)}</Td>
                      <Td right className="font-semibold text-red-600 text-sm">{inr(s.tdsTotal)}</Td>
                      <Td right className="font-semibold text-green-700 text-sm">{inr(s.netPayable)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          {/* Detail table */}
          <Card>
            <Table>
              <thead><tr>
                <Th>Date</Th><Th>Vendor</Th><Th>GRN #</Th><Th>Invoice #</Th>
                <Th right>Invoice Amt</Th><Th right>TDS %</Th><Th right>TDS Amt</Th>
                <Th right>Net Payable</Th><Th>Bill Status</Th>
                <Th>PAN</Th><Th>Deductee Type</Th><Th>TDS Section</Th><Th right>TDS Interest</Th>
                <Th>TDS Due Date</Th><Th>TDS Deposit Status</Th>
              </tr></thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={15} className="text-center py-8 text-gray-400 text-sm">No TDS entries found</td></tr>
                  : filtered.map((r: any) => {
                      const netPay = r.net_payable ?? (r.invoice_amount ?? 0) - (r.tds_amount ?? 0)
                      const due = tdsDueDate(r.grn_date)
                      const overdue = isOverdue(r, 'grn_date')
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <Td className="text-xs">{r.grn_date ? fmtDate(r.grn_date) : '—'}</Td>
                          <Td className="text-xs font-medium">{r.vendor_name ?? '—'}</Td>
                          <Td className="text-xs font-mono">{r.grn_no ?? '—'}</Td>
                          <Td className="text-xs font-medium text-blue-700">{r.invoice_no ?? '—'}</Td>
                          <Td right className="text-xs">{r.invoice_amount ? inr(r.invoice_amount) : '—'}</Td>
                          <Td right className="text-xs">{effPct(r) ? `${effPct(r)}%` : '—'}</Td>
                          <Td right className="font-semibold text-red-600 text-xs">{inr(r.tds_amount)}</Td>
                          <Td right className="font-semibold text-green-700 text-xs">{inr(netPay)}</Td>
                          <Td>
                            {r.payment_status === 'Paid'
                              ? <Badge color="green">Paid</Badge>
                              : <Badge color="orange">Pending</Badge>}
                          </Td>
                          <Td className="text-xs font-mono">{pan(r) || '—'}</Td>
                          <Td className="text-xs">{deducteeType(r)}</Td>
                          <Td>
                            <select
                              defaultValue={r.tds_section ?? ''}
                              title={r.tds_section ? sectionLabel(r.tds_section) : ''}
                              onChange={e => updateVendorTds(r.id, { tds_section: e.target.value || undefined })}
                              className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white"
                            >
                              <option value="">—</option>
                              {tdsSectionOptions.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
                            </select>
                          </Td>
                          <Td right>
                            <input
                              type="number" step="0.01" defaultValue={r.tds_interest ?? 0}
                              onBlur={e => updateVendorTds(r.id, { tds_interest: parseFloat(e.target.value) || 0 })}
                              className="text-xs border border-gray-200 rounded px-1 py-0.5 w-20 text-right"
                            />
                          </Td>
                          <Td className={`text-xs ${overdue ? 'text-red-600 font-semibold' : ''}`}>{due ? fmtDate(due) : '—'}</Td>
                          <Td>
                            <button
                              onClick={() => toggleDeposited(updateVendorTds, r)}
                              title={r.tds_deposit_date ? `Deposited ${fmtDate(r.tds_deposit_date)}` : 'Not yet deposited to the government'}
                            >
                              {r.tds_deposited
                                ? <Badge color="green">Deposited</Badge>
                                : overdue ? <Badge color="red">Overdue</Badge> : <Badge color="orange">Pending</Badge>}
                            </button>
                          </Td>
                        </tr>
                      )
                    })}
              </tbody>
              {filtered.length > 0 && (
                <tfoot><tr className="bg-gray-50 font-semibold">
                  <Td colSpan={4}>TOTAL ({filtered.length})</Td>
                  <Td right>{inr(totalInvoice)}</Td>
                  <Td></Td>
                  <Td right className="text-red-600">{inr(totalTDS)}</Td>
                  <Td right className="text-green-700">{inr(totalNetPayable)}</Td>
                  <Td colSpan={7}></Td>
                </tr></tfoot>
              )}
            </Table>
          </Card>

          {/* Salary TDS detail table */}
          <Card>
            <SectionHeader title="Salary TDS" subtitle="TDS deducted from employee salaries" />
            {loadingSalaryTDS ? <Spinner /> : (
              <Table>
                <thead><tr>
                  <Th>Month</Th><Th>Employee</Th><Th>Emp ID</Th><Th>Site</Th>
                  <Th right>TDS Amt</Th><Th>Salary Status</Th>
                  <Th>PAN</Th><Th>TDS Section</Th><Th right>TDS Interest</Th>
                  <Th>TDS Due Date</Th><Th>TDS Deposit Status</Th>
                </tr></thead>
                <tbody>
                  {filteredSalary.length === 0
                    ? <tr><td colSpan={11} className="text-center py-8 text-gray-400 text-sm">No salary TDS entries found</td></tr>
                    : filteredSalary.map((r: any) => {
                        const due = tdsDueDate(r.month)
                        const overdue = isOverdue(r, 'month')
                        return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <Td className="text-xs">{r.month ? fmtDate(r.month) : '—'}</Td>
                          <Td className="text-xs font-medium">{r.employees?.name ?? '—'}</Td>
                          <Td className="text-xs font-mono">{r.employees?.emp_id ?? '—'}</Td>
                          <Td className="text-xs">{r.employees?.farms?.name ?? '—'}</Td>
                          <Td right className="font-semibold text-red-600 text-xs">{inr(r.tds)}</Td>
                          <Td>
                            {r.is_paid
                              ? <Badge color="green">Paid</Badge>
                              : <Badge color="orange">Pending</Badge>}
                          </Td>
                          <Td className="text-xs font-mono">{r.employees?.pan_no ?? '—'}</Td>
                          <Td>
                            <select
                              defaultValue={r.tds_section ?? ''}
                              title={r.tds_section ? sectionLabel(r.tds_section) : ''}
                              onChange={e => updateSalaryTds(r.id, { tds_section: e.target.value || undefined })}
                              className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white"
                            >
                              <option value="">—</option>
                              {tdsSectionOptions.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
                            </select>
                          </Td>
                          <Td right>
                            <input
                              type="number" step="0.01" defaultValue={r.tds_interest ?? 0}
                              onBlur={e => updateSalaryTds(r.id, { tds_interest: parseFloat(e.target.value) || 0 })}
                              className="text-xs border border-gray-200 rounded px-1 py-0.5 w-20 text-right"
                            />
                          </Td>
                          <Td className={`text-xs ${overdue ? 'text-red-600 font-semibold' : ''}`}>{due ? fmtDate(due) : '—'}</Td>
                          <Td>
                            <button
                              onClick={() => toggleDeposited(updateSalaryTds, r)}
                              title={r.tds_deposit_date ? `Deposited ${fmtDate(r.tds_deposit_date)}` : 'Not yet deposited to the government'}
                            >
                              {r.tds_deposited
                                ? <Badge color="green">Deposited</Badge>
                                : overdue ? <Badge color="red">Overdue</Badge> : <Badge color="orange">Pending</Badge>}
                            </button>
                          </Td>
                        </tr>
                      )})}
                </tbody>
                {filteredSalary.length > 0 && (
                  <tfoot><tr className="bg-gray-50 font-semibold">
                    <Td colSpan={4}>TOTAL ({filteredSalary.length})</Td>
                    <Td right className="text-red-600">{inr(totalSalaryTDS)}</Td>
                    <Td colSpan={6}></Td>
                  </tr></tfoot>
                )}
              </Table>
            )}
          </Card>

          {/* Section-wise summary */}
          {sectionSummary.length > 0 && (
            <Card>
              <p className="text-xs font-semibold text-gray-600 mb-2">Section-wise Summary</p>
              <Table>
                <thead><tr>
                  <Th>TDS Section</Th><Th right>Total Tax</Th><Th right>Total Interest</Th><Th right>Total TDS Payable</Th>
                </tr></thead>
                <tbody>
                  {sectionSummary.map(([sec, s]) => (
                    <tr key={sec} className="hover:bg-gray-50">
                      <Td className="text-xs"><span title={sec === 'Unspecified' ? '' : sectionLabel(sec)}>{sec}</span></Td>
                      <Td right className="text-xs">{inr(s.tax)}</Td>
                      <Td right className="text-xs">{inr(s.interest)}</Td>
                      <Td right className="font-semibold text-red-600 text-xs">{inr(s.tax + s.interest)}</Td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-gray-50 font-semibold">
                  <Td>GRAND TOTAL</Td>
                  <Td right>{inr(sectionSummary.reduce((s, [, v]) => s + v.tax, 0))}</Td>
                  <Td right>{inr(sectionSummary.reduce((s, [, v]) => s + v.interest, 0))}</Td>
                  <Td right className="text-red-600">{inr(sectionSummary.reduce((s, [, v]) => s + v.tax + v.interest, 0))}</Td>
                </tr></tfoot>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default TDSPayable
