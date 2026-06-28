import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, fyRange, FY_OPTIONS } from '@/lib/utils'
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

export const TDSReceivable: React.FC = () => {
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
    queryKey: ['he_dispatch_tds', dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase.from('he_dispatch')
        .select('id,dispatch_date,invoice_no,dc_no,amount,tds_amount,tds_pct,payment_status,parties(name),flocks(flock_no)')
        .gt('tds_amount', 0)
        .order('dispatch_date', { ascending: false })
      if (dateFrom) q = q.gte('dispatch_date', dateFrom)
      if (dateTo) q = q.lte('dispatch_date', dateTo)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })

  const filtered = useMemo(() => {
    return rows.filter((r: any) => {
      if (rateFilter) {
        const derived = r.tds_pct ?? (r.amount ? Math.round(r.tds_amount / r.amount * 1000) / 10 : 0)
        if (Math.abs(derived - parseFloat(rateFilter)) > 0.05) return false
      }
      if (statusFilter) {
        if (statusFilter === 'received' && r.payment_status !== 'Received') return false
        if (statusFilter === 'pending' && r.payment_status === 'Received') return false
      }
      return true
    })
  }, [rows, rateFilter, statusFilter])

  // Summary by TDS rate
  const summary = useMemo(() => {
    const map: Record<string, { count: number; invoiceTotal: number; tdsTotal: number; received: number }> = {}
    filtered.forEach((r: any) => {
      const pct = r.tds_pct != null && r.tds_pct > 0
        ? r.tds_pct
        : r.amount ? Math.round(r.tds_amount / r.amount * 1000) / 10 : 0
      const key = `${pct}%`
      if (!map[key]) map[key] = { count: 0, invoiceTotal: 0, tdsTotal: 0, received: 0 }
      map[key].count++
      map[key].invoiceTotal += r.amount ?? 0
      map[key].tdsTotal += r.tds_amount ?? 0
      if (r.payment_status === 'Received') map[key].received += r.tds_amount ?? 0
    })
    return Object.entries(map).sort(([a], [b]) => parseFloat(a) - parseFloat(b))
  }, [filtered])

  const totalTDS = filtered.reduce((s: number, r: any) => s + (r.tds_amount ?? 0), 0)
  const receivedTDS = filtered.filter((r: any) => r.payment_status === 'Received').reduce((s: number, r: any) => s + (r.tds_amount ?? 0), 0)

  const exportXlsx = () => {
    const data = filtered.map((r: any) => ({
      Date: fmtDate(r.dispatch_date),
      Party: (r.parties as any)?.name ?? '',
      Flock: `F-${(r.flocks as any)?.flock_no ?? ''}`,
      'Invoice No': r.invoice_no ?? '',
      'Invoice Amount': r.amount ?? 0,
      'TDS %': r.tds_pct ?? '',
      'TDS Amount': r.tds_amount ?? 0,
      'Payment Status': r.payment_status ?? 'Pending',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'TDS Receivable')
    XLSX.writeFile(wb, 'TDS_Receivable.xlsx')
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="TDS Receivable" subtitle="Tax deducted at source on hatching egg payments" />

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
              { value: 'received', label: 'Payment Received' },
              { value: 'pending', label: 'Payment Pending' },
            ]} />
          <Button size="sm" variant="outline" onClick={exportXlsx}><Download size={14} className="mr-1" />Export</Button>
        </div>
      </Card>

      {isLoading ? <Spinner /> : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total TDS</p>
              <p className="text-lg font-bold text-red-600">{inr(totalTDS)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-gray-500 mb-1">TDS on Paid Invoices</p>
              <p className="text-lg font-bold text-green-700">{inr(receivedTDS)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-gray-500 mb-1">TDS on Pending</p>
              <p className="text-lg font-bold text-orange-600">{inr(totalTDS - receivedTDS)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-gray-500 mb-1">Invoices</p>
              <p className="text-lg font-bold">{filtered.length}</p>
            </Card>
          </div>

          {/* Rate-wise summary */}
          {summary.length > 0 && (
            <Card>
              <p className="text-xs font-semibold text-gray-600 mb-2">Rate-wise Summary</p>
              <div className="flex flex-wrap gap-4">
                {summary.map(([rate, s]) => (
                  <div key={rate} className="bg-gray-50 rounded-lg px-4 py-2 text-center min-w-[130px]">
                    <Badge color="blue">{rate}</Badge>
                    <p className="text-sm font-bold text-red-600 mt-1">{inr(s.tdsTotal)}</p>
                    <p className="text-xs text-gray-400">{s.count} invoice{s.count !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-green-600">Rcvd: {inr(s.received)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Detail table */}
          <Card>
            <Table>
              <thead><tr>
                <Th>Date</Th><Th>Party</Th><Th>Flock</Th><Th>Invoice No</Th>
                <Th right>Invoice Amt</Th><Th right>TDS %</Th><Th right>TDS Amt</Th><Th>Status</Th>
              </tr></thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">No TDS entries found</td></tr>
                  : filtered.map((r: any) => {
                      const pct = r.tds_pct != null && r.tds_pct > 0
                        ? r.tds_pct
                        : r.amount ? Math.round(r.tds_amount / r.amount * 1000) / 10 : null
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <Td className="text-xs">{fmtDate(r.dispatch_date)}</Td>
                          <Td className="text-xs font-medium">{(r.parties as any)?.name ?? '—'}</Td>
                          <Td><Badge color="green">F-{(r.flocks as any)?.flock_no}</Badge></Td>
                          <Td className="text-xs font-medium text-blue-700">{r.invoice_no ?? '—'}</Td>
                          <Td right className="text-xs">{r.amount ? inr(r.amount) : '—'}</Td>
                          <Td right className="text-xs">{pct != null ? `${pct}%` : '—'}</Td>
                          <Td right className="font-semibold text-red-600 text-xs">{inr(r.tds_amount)}</Td>
                          <Td>
                            {r.payment_status === 'Received'
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
                  <Td right>{inr(filtered.reduce((s: number, r: any) => s + (r.amount ?? 0), 0))}</Td>
                  <Td></Td>
                  <Td right className="text-red-600">{inr(totalTDS)}</Td>
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

export default TDSReceivable
