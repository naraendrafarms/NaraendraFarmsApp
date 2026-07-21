import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today, fyRange, FY_OPTIONS, fetchAllPages } from '@/lib/utils'
import {
  Card, Button, Select, SectionHeader, Spinner,
  Table, Th, Td, Badge, StatCard, DateInput, usePagination, PageSizeControl,
} from '@/components/ui'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const SERIES_LABELS: Record<string, string> = {
  HHF:  'HHF (Hitech Hatch Fresh)',
  HE:   'HE (Hatching Eggs)',
  NHE:  'NHE (Non-Hatching Eggs)',
  VHPL: 'VHPL',
  CB:   'CB (Cull Birds)',
}

function guessSeries(invoiceNo: string): string {
  if (!invoiceNo) return ''
  if (invoiceNo.includes('/HHF/'))  return 'HHF'
  if (invoiceNo.includes('/VHPL/')) return 'VHPL'
  if (invoiceNo.includes('/HE/'))   return 'HE'
  if (invoiceNo.includes('/NHE/'))  return 'NHE'
  if (invoiceNo.includes('/CB/'))   return 'CB'
  return 'Other'
}

function saleTypeLabel(t: string) {
  const map: Record<string, string> = {
    je: 'Jumbo Egg', te: 'Table Egg', be: 'Broken Egg',
    bird_sale: 'Bird Sale', manure: 'Manure', other: 'Other',
  }
  return map[t] ?? t
}

export const SalesInvoiceRegister: React.FC = () => {
  const [filterSeries, setFilterSeries] = useState('')
  const [filterFrom, setFilterFrom]     = useState('')
  const [filterTo, setFilterTo]         = useState('')
  const [filterFy, setFilterFy]         = useState('')

  const applyFy = (v: string) => {
    setFilterFy(v)
    if (v) { const r = fyRange(v); setFilterFrom(r.start); setFilterTo(r.end) }
  }

  // HE Dispatch invoices — every invoiced dispatch ever, unbounded, so page
  // through the full set instead of trusting a single request (PostgREST
  // silently caps at 1000 rows otherwise).
  const { data: heRows, isLoading: heLoading } = useQuery({
    queryKey: ['he_dispatch_invoices'],
    queryFn: async () => {
      const data = await fetchAllPages<any>(
        (from, to) => supabase.from('he_dispatch')
          .select('id,dispatch_date,invoice_no,amount,party_id,parties(name),flocks(flock_no)')
          .not('invoice_no', 'is', null)
          .order('dispatch_date', { ascending: false })
          .range(from, to),
        'HE dispatch invoices'
      )
      return data.map((r: any) => ({
        id:         'he_' + r.id,
        date:       r.dispatch_date,
        invoice_no: r.invoice_no,
        series:     guessSeries(r.invoice_no),
        sale_type:  'Hatching Eggs',
        party:      r.parties?.name ?? '—',
        flock:      r.flocks?.flock_no ? `Flock ${r.flocks.flock_no}` : '—',
        amount:     r.amount ?? 0,
        source:     'HE Dispatch',
      }))
    }
  })

  // NHE Sales invoices — same unbounded-history risk as HE Dispatch above.
  const { data: nheRows, isLoading: nheLoading } = useQuery({
    queryKey: ['nhe_sales_invoices'],
    queryFn: async () => {
      const data = await fetchAllPages<any>(
        (from, to) => supabase.from('nhe_sales')
          .select('id,sale_date,invoice_no,amount,sale_type,party_id,parties(name),flocks(flock_no)')
          .not('invoice_no', 'is', null)
          .order('sale_date', { ascending: false })
          .range(from, to),
        'NHE sales invoices'
      )
      return data.map((r: any) => ({
        id:         'nhe_' + r.id,
        date:       r.sale_date,
        invoice_no: r.invoice_no,
        series:     guessSeries(r.invoice_no),
        sale_type:  saleTypeLabel(r.sale_type),
        party:      r.parties?.name ?? '—',
        flock:      r.flocks?.flock_no ? `Flock ${r.flocks.flock_no}` : '—',
        amount:     r.amount ?? 0,
        source:     'NHE Sale',
      }))
    }
  })

  if (heLoading || nheLoading) return <Spinner />

  const all = [...(heRows ?? []), ...(nheRows ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  const filtered = all.filter(r => {
    if (filterSeries && r.series !== filterSeries) return false
    if (filterFrom   && r.date  < filterFrom)      return false
    if (filterTo     && r.date  > filterTo)         return false
    return true
  })

  const totalValue = filtered.reduce((s, r) => s + r.amount, 0)
  const { page, setPage, pageSize, setPageSize, totalPages, from, to } = usePagination(filtered.length, filtered.length)
  const visibleRows = filtered.slice(from, to)

  const exportExcel = () => {
    const rows = filtered.map(r => ({
      'Invoice No': r.invoice_no,
      'Date':       r.date,
      'Series':     r.series,
      'Type':       r.sale_type,
      'Party':      r.party,
      'Flock':      r.flock,
      'Amount':     r.amount,
      'Source':     r.source,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Invoices')
    XLSX.writeFile(wb, `sales_invoice_register_${today()}.xlsx`)
  }

  const seriesOptions = Object.entries(SERIES_LABELS).map(([v, l]) => ({ value: v, label: l }))

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Sales Invoice Register"
        subtitle="All outward invoices — HE Dispatch and NHE / Bird Sales"
        action={
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={exportExcel}>
            Export Excel
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Invoices"  value={filtered.length.toString()} />
        <StatCard title="Total Value"     value={inr(totalValue)} />
        <StatCard title="Invoice Series"  value={filterSeries ? SERIES_LABELS[filterSeries] ?? filterSeries : 'All'} />
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-52">
            <Select label="Series" placeholder="All Series"
              options={seriesOptions}
              value={filterSeries} onChange={e => setFilterSeries(e.target.value)} />
          </div>
          <div className="w-36">
            <Select label="Financial Year" placeholder="— FY —"
              options={FY_OPTIONS.map(f => ({ value: f, label: `FY ${f}` }))}
              value={filterFy} onChange={e => applyFy(e.target.value)} />
          </div>
          <DateInput label="From" value={filterFrom} onChange={e => { setFilterFrom(e.target.value); setFilterFy('') }} />
          <DateInput label="To"   value={filterTo}   onChange={e => { setFilterTo(e.target.value); setFilterFy('') }}   />
          {(filterSeries || filterFrom || filterTo || filterFy) && (
            <Button variant="outline" size="sm"
              onClick={() => { setFilterSeries(''); setFilterFrom(''); setFilterTo(''); setFilterFy('') }}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-center py-10 text-gray-400 text-sm">
            No invoices found. Generate invoice numbers when saving HE Dispatch or NHE Sales.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Invoice No</Th>
                  <Th>Date</Th>
                  <Th>Series</Th>
                  <Th>Type</Th>
                  <Th>Party</Th>
                  <Th>Flock</Th>
                  <Th right>Amount</Th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <Td>
                      <span className="font-medium text-blue-700">{r.invoice_no}</span>
                    </Td>
                    <Td className="text-sm">{fmtDate(r.date)}</Td>
                    <Td>
                      <Badge color="blue">{r.series}</Badge>
                    </Td>
                    <Td className="text-sm text-gray-600">{r.sale_type}</Td>
                    <Td className="text-sm">{r.party}</Td>
                    <Td className="text-sm text-gray-500">{r.flock}</Td>
                    <Td right className="font-medium">{inr(r.amount)}</Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {totalPages > 1 && (
                  <tr className="text-xs text-gray-400">
                    <td colSpan={6} className="px-3 py-1.5">This page ({visibleRows.length} of {filtered.length})</td>
                    <td className="px-3 py-1.5 text-right">{inr(visibleRows.reduce((s, r) => s + r.amount, 0))}</td>
                  </tr>
                )}
                <tr className="bg-gray-50 font-semibold text-sm">
                  <td colSpan={6} className="px-3 py-2 text-gray-600">
                    Total ({filtered.length} invoices)
                  </td>
                  <td className="px-3 py-2 text-right">{inr(totalValue)}</td>
                </tr>
              </tfoot>
            </Table>
          </div>
          <PageSizeControl page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize}
            totalPages={totalPages} totalItems={filtered.length} className="border-t border-gray-100" />
        </Card>
      )}
    </div>
  )
}
