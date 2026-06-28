import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today, fyRange, FY_OPTIONS } from '@/lib/utils'
import { Card, Button, Select, SectionHeader, Spinner, Table, Th, Td, Badge, DateInput } from '@/components/ui'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

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

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['pending_payments_tds', dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase.from('pending_payments')
        .select('*')
        .gt('tds_pct', 0)
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

  const filtered = useMemo(() => {
    return rows.filter((r: any) => {
      if (rateFilter) {
        if (Math.abs((r.tds_pct ?? 0) - parseFloat(rateFilter)) > 0.05) return false
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
      const pct = r.tds_pct ?? 0
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

  const exportXlsx = () => {
    const data = filtered.map((r: any) => ({
      Date: fmtDate(r.grn_date),
      Vendor: r.vendor_name ?? '',
      'GRN #': r.grn_no ?? '',
      'Invoice #': r.invoice_no ?? '',
      'Invoice Amount': r.invoice_amount ?? 0,
      'TDS %': r.tds_pct ?? 0,
      'TDS Amount': r.tds_amount ?? 0,
      'Net Payable': r.net_payable ?? (r.invoice_amount ?? 0) - (r.tds_amount ?? 0),
      Status: r.payment_status ?? 'Pending',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'TDS Payable')
    XLSX.writeFile(wb, 'TDS_Payable.xlsx')
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="TDS Payable" subtitle="Tax deducted at source on vendor payments" />

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
                <Th right>Net Payable</Th><Th>Status</Th>
              </tr></thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={9} className="text-center py-8 text-gray-400 text-sm">No TDS entries found</td></tr>
                  : filtered.map((r: any) => {
                      const netPay = r.net_payable ?? (r.invoice_amount ?? 0) - (r.tds_amount ?? 0)
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <Td className="text-xs">{r.grn_date ? fmtDate(r.grn_date) : '—'}</Td>
                          <Td className="text-xs font-medium">{r.vendor_name ?? '—'}</Td>
                          <Td className="text-xs font-mono">{r.grn_no ?? '—'}</Td>
                          <Td className="text-xs font-medium text-blue-700">{r.invoice_no ?? '—'}</Td>
                          <Td right className="text-xs">{r.invoice_amount ? inr(r.invoice_amount) : '—'}</Td>
                          <Td right className="text-xs">{r.tds_pct != null ? `${r.tds_pct}%` : '—'}</Td>
                          <Td right className="font-semibold text-red-600 text-xs">{inr(r.tds_amount)}</Td>
                          <Td right className="font-semibold text-green-700 text-xs">{inr(netPay)}</Td>
                          <Td>
                            {r.payment_status === 'Paid'
                              ? <Badge color="green">Paid</Badge>
                              : <Badge color="orange">Pending</Badge>}
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
                  <Td></Td>
                </tr></tfoot>
              )}
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}

export default TDSPayable
