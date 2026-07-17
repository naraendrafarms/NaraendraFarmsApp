import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate } from '@/lib/utils'
import {
  Card, Button, Select, Input, SectionHeader, Spinner, Table, Th, Td, Badge
, DateInput, SearchableSelect } from '@/components/ui'
import { Download, ChevronDown, ChevronRight, IndianRupee } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { ReceivePaymentModal } from '@/pages/flocks/FlockSalesPages'

// ── FY helper ─────────────────────────────────────────────────────
function fyRange(fy: string): [string, string] {
  const [y] = fy.split('-')
  return [`${y}-04-01`, `${parseInt(y) + 1}-03-31`]
}

// ── AGING BUCKET ──────────────────────────────────────────────────
// Parse the due date at LOCAL midnight — new Date('YYYY-MM-DD') is UTC
// midnight, which shifted bucket boundaries by ~5.5h in IST.
function localMidnight(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}
function agingBucket(dueDate: string | null): string {
  if (!dueDate) return 'Not Due'
  const days = Math.floor((Date.now() - localMidnight(dueDate)) / 86400000)
  if (days < 0) return 'Not Due'
  if (days <= 30) return '0-30d'
  if (days <= 60) return '31-60d'
  if (days <= 90) return '61-90d'
  return '90d+'
}

function daysOverdue(dueDate: string | null): number | null {
  if (!dueDate) return null
  const d = Math.floor((Date.now() - localMidnight(dueDate)) / 86400000)
  return d > 0 ? d : null
}

// ── DEBTORS TAB ───────────────────────────────────────────────────
const DebtorsTab: React.FC = () => {
  const qc = useQueryClient()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [partyFilter, setPartyFilter] = useState('')
  const [flockFilter, setFlockFilter] = useState('')
  const [expandedParty, setExpandedParty] = useState<string | null>(null)
  const [hideSettled, setHideSettled] = useState(true)
  const [receiptSale, setReceiptSale] = useState<any>(null)

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all_out'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no').order('flock_no'); return data ?? [] }
  })

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => { const { data } = await supabase.from('bank_accounts').select('id,bank_name,account_name').eq('is_active', true).order('bank_name'); return data ?? [] }
  })
  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').order('name'); return data ?? [] }
  })

  const { data: heData, isLoading: heLoading } = useQuery({
    queryKey: ['he_dispatch_all', dateFrom, dateTo, flockFilter],
    queryFn: async () => {
      let q = supabase.from('he_dispatch')
        .select('id,dispatch_date,invoice_no,dc_no,amount,total_dispatched,free_eggs,party_id,flock_id,parties(name),flocks(flock_no),amount_received,payment_status,payment_mode,bank_account_id,received_date,utr_ref')
        .gt('amount', 0)
        .order('dispatch_date', { ascending: false })
      if (dateFrom) q = q.gte('dispatch_date', dateFrom)
      if (dateTo)   q = q.lte('dispatch_date', dateTo)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      // Descending order + a low limit silently truncated the OLDEST unpaid
      // sales — exactly what a receivables report must show
      const { data } = await q.limit(10000)
      if ((data ?? []).length === 10000) toast.error('HE dispatch results truncated at 10,000 rows — totals may be understated')
      return data ?? []
    }
  })

  const { data: nheData, isLoading: nheLoading } = useQuery({
    queryKey: ['nhe_sales_all', dateFrom, dateTo, flockFilter],
    queryFn: async () => {
      let q = supabase.from('nhe_sales')
        .select('id,sale_date,sale_type,amount,qty,party_id,flock_id,parties(name),flocks(flock_no),amount_received,payment_status,payment_mode,bank_account_id,received_date,utr_ref')
        .gt('amount', 0)
        .in('sale_type', ['je','te','be'])
        .order('sale_date', { ascending: false })
      if (dateFrom) q = q.gte('sale_date', dateFrom)
      if (dateTo)   q = q.lte('sale_date', dateTo)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q.limit(10000)
      if ((data ?? []).length === 10000) toast.error('NHE sales results truncated at 10,000 rows — totals may be understated')
      return data ?? []
    }
  })

  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ['he_dispatch_all'] })
    qc.invalidateQueries({ queryKey: ['nhe_sales_all'] })
    qc.invalidateQueries({ queryKey: ['cash_book'] })
    qc.invalidateQueries({ queryKey: ['bank_transactions'] })
  }

  // Group by party — outstanding balance = amount - amount_received (the
  // same fields FlockSalesPages' Receive Payment modal already writes to;
  // this report previously ignored them entirely and always showed the
  // full original amount even for fully/partially collected sales).
  const balanceOf = (r: any) => Math.max(0, (r.amount ?? 0) - (r.amount_received ?? 0))

  const grouped = useMemo(() => {
    const map: Record<string, { partyId: string; partyName: string; totalAmt: number; invoices: number; latestDate: string; rows: any[] }> = {}

    for (const r of (heData ?? [])) {
      const bal = balanceOf(r)
      if (hideSettled && bal <= 0.01) continue
      const pid = r.party_id ?? 'unknown'
      const pname = (r.parties as any)?.name ?? 'Unknown'
      if (!map[pid]) map[pid] = { partyId: pid, partyName: pname, totalAmt: 0, invoices: 0, latestDate: '', rows: [] }
      map[pid].totalAmt += bal
      map[pid].invoices++
      if (!map[pid].latestDate || r.dispatch_date > map[pid].latestDate) map[pid].latestDate = r.dispatch_date
      map[pid].rows.push({ ...r, _type: 'HE', _date: r.dispatch_date, _ref: r.invoice_no ?? r.dc_no ?? '—', _flock: `Flock ${(r.flocks as any)?.flock_no ?? '?'}`, _balance: bal, _table: 'he_dispatch' })
    }

    for (const r of (nheData ?? [])) {
      const bal = balanceOf(r)
      if (hideSettled && bal <= 0.01) continue
      const pid = r.party_id ?? 'unknown'
      const pname = (r.parties as any)?.name ?? 'Unknown'
      if (!map[pid]) map[pid] = { partyId: pid, partyName: pname, totalAmt: 0, invoices: 0, latestDate: '', rows: [] }
      map[pid].totalAmt += bal
      map[pid].invoices++
      if (!map[pid].latestDate || r.sale_date > map[pid].latestDate) map[pid].latestDate = r.sale_date
      map[pid].rows.push({ ...r, _type: r.sale_type?.toUpperCase() ?? 'NHE', _date: r.sale_date, _ref: '—', _flock: `Flock ${(r.flocks as any)?.flock_no ?? '?'}`, _balance: bal, _table: 'nhe_sales' })
    }

    return Object.values(map)
      .filter(p => !partyFilter || p.partyName.toLowerCase().includes(partyFilter.toLowerCase()))
      .sort((a, b) => b.totalAmt - a.totalAmt)
  }, [heData, nheData, partyFilter, hideSettled])

  const grandTotal = grouped.reduce((s, p) => s + p.totalAmt, 0)

  const exportCSV = () => {
    const rows: any[] = []
    for (const p of grouped) {
      for (const r of p.rows) {
        rows.push({ Party: p.partyName, Type: r._type, Date: r._date, Ref: r._ref, Flock: r._flock, Amount: r.amount ?? 0, Received: r.amount_received ?? 0, Balance: r._balance })
      }
    }
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Debtors')
    XLSX.writeFile(wb, `Debtors_Outstanding_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const flockOptions = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))
  const isLoading = heLoading || nheLoading

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <DateInput label="From" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40"/>
        <DateInput label="To" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40"/>
        <SearchableSelect label="Flock" placeholder="All Flocks" options={flockOptions} value={flockFilter} onChange={v => setFlockFilter(v)} className="w-40"/>
        <Input label="Party search" placeholder="Search party..." value={partyFilter} onChange={e => setPartyFilter(e.target.value)} className="w-48"/>
        <label className="flex items-center gap-1.5 text-sm text-gray-600 pb-2">
          <input type="checkbox" checked={hideSettled} onChange={e => setHideSettled(e.target.checked)} />
          Hide fully received
        </label>
        {(dateFrom || dateTo || flockFilter || partyFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); setFlockFilter(''); setPartyFilter('') }}>Clear</Button>
        )}
        <div className="ml-auto">
          <Button variant="secondary" icon={<Download size={16}/>} onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-3">
          <p className="text-xs text-gray-400">Outstanding Balance</p>
          <p className="text-xl font-bold text-green-700">{inr(grandTotal)}</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-xs text-gray-400">Parties</p>
          <p className="text-xl font-bold text-gray-800">{grouped.length}</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-xs text-gray-400">Invoices</p>
          <p className="text-xl font-bold text-gray-800">{grouped.reduce((s, p) => s + p.invoices, 0)}</p>
        </Card>
      </div>

      {isLoading && <Spinner/>}

      {/* Party-grouped table */}
      <Card padding={false}>
        <Table>
          <thead>
            <tr>
              <Th></Th>
              <Th>Party</Th>
              <Th right>Invoices</Th>
              <Th right>Balance Due</Th>
              <Th>Latest Date</Th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(p => (
              <React.Fragment key={p.partyId}>
                <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedParty(expandedParty === p.partyId ? null : p.partyId)}>
                  <Td className="w-8">
                    {expandedParty === p.partyId ? <ChevronDown size={14} className="text-gray-400"/> : <ChevronRight size={14} className="text-gray-400"/>}
                  </Td>
                  <Td className="font-medium">{p.partyName}</Td>
                  <Td right>{p.invoices}</Td>
                  <Td right className="font-semibold text-green-700">{inr(p.totalAmt)}</Td>
                  <Td>{p.latestDate ? fmtDate(p.latestDate) : '—'}</Td>
                </tr>
                {expandedParty === p.partyId && (
                  <tr>
                    <td colSpan={5} className="p-0 bg-gray-50">
                      <div className="border-t border-gray-100">
                        <Table>
                          <thead>
                            <tr className="bg-gray-100">
                              <Th className="pl-8">Type</Th>
                              <Th>Date</Th>
                              <Th>Ref / Invoice</Th>
                              <Th>Flock</Th>
                              <Th right>Amount</Th>
                              <Th right>Received</Th>
                              <Th right>Balance</Th>
                              <Th>Status</Th>
                              <Th></Th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.rows.sort((a: any, b: any) => b._date?.localeCompare(a._date)).map((r: any) => (
                              <tr key={r.id} className="hover:bg-white">
                                <Td className="pl-8"><Badge color="blue">{r._type}</Badge></Td>
                                <Td className="text-sm">{r._date ? fmtDate(r._date) : '—'}</Td>
                                <Td className="font-mono text-xs">{r._ref}</Td>
                                <Td className="text-xs text-gray-500">{r._flock}</Td>
                                <Td right className="text-gray-700">{inr(r.amount ?? 0)}</Td>
                                <Td right className="text-blue-600">{r.amount_received ? inr(r.amount_received) : '—'}</Td>
                                <Td right className="font-semibold text-green-700">{inr(r._balance)}</Td>
                                <Td>
                                  <Badge color={r.payment_status === 'Received' ? 'green' : r.payment_status === 'Partial' ? 'yellow' : 'gray'}>
                                    {r.payment_status ?? 'Pending'}
                                  </Badge>
                                </Td>
                                <Td>
                                  {r._balance > 0.01 && (
                                    <button onClick={() => setReceiptSale(r)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200">
                                      <IndianRupee size={12}/> Receive
                                    </button>
                                  )}
                                </Td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          {grouped.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <Td></Td>
                <Td>TOTAL</Td>
                <Td right>{grouped.reduce((s, p) => s + p.invoices, 0)}</Td>
                <Td right className="text-green-700">{inr(grandTotal)}</Td>
                <Td></Td>
              </tr>
            </tfoot>
          )}
        </Table>
        {!isLoading && grouped.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No debtors found with the current filters</p>
        )}
      </Card>

      <ReceivePaymentModal
        open={!!receiptSale}
        sale={receiptSale}
        bankAccounts={bankAccounts ?? []}
        farms={farms ?? []}
        table={receiptSale?._table ?? 'he_dispatch'}
        onClose={() => setReceiptSale(null)}
        onSaved={() => { setReceiptSale(null); refetchAll() }}
      />
    </div>
  )
}

// ── CREDITORS TAB ─────────────────────────────────────────────────
const CreditorsTab: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('All')

  const { data: payments, isLoading } = useQuery({
    queryKey: ['pending_payments_all'],
    queryFn: async () => {
      const { data } = await supabase.from('pending_payments')
        .select('*')
        .order('invoice_date', { ascending: false })
        .limit(2000)
      return data ?? []
    }
  })

  const filtered = useMemo(() => {
    if (!payments) return []
    if (statusFilter === 'All') return payments
    return payments.filter((p: any) => p.payment_status === statusFilter)
  }, [payments, statusFilter])

  // Aging buckets — net each bill against partial payments already made
  // (the full invoice amount used to be bucketed even when mostly paid)
  const aging = useMemo(() => {
    const buckets: Record<string, number> = { 'Not Due': 0, '0-30d': 0, '31-60d': 0, '61-90d': 0, '90d+': 0 }
    for (const p of (payments ?? [])) {
      if (p.payment_status === 'Paid') continue
      const bal = Math.max(0, (p.net_payable ?? p.invoice_amount ?? 0) - (p.paid_amount ?? 0))
      if (bal <= 0) continue
      const b = agingBucket(p.pay_before_date)
      buckets[b] = (buckets[b] ?? 0) + bal
    }
    return buckets
  }, [payments])

  const totalPending = Object.entries(aging).reduce((s, [k, v]) => k === 'Not Due' ? s + v : s + v, 0)

  // Group by vendor
  const byVendor = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {}
    for (const p of filtered) {
      const k = p.vendor_name ?? 'Unknown'
      if (!map[k]) map[k] = { name: k, total: 0, count: 0 }
      map[k].total += p.net_payable ?? p.invoice_amount ?? 0
      map[k].count++
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [filtered])

  const exportCSV = () => {
    if (!filtered.length) return
    const ws = XLSX.utils.json_to_sheet(filtered.map((p: any) => ({
      'Vendor': p.vendor_name, 'Invoice No': p.invoice_no, 'Invoice Date': p.invoice_date,
      'Invoice Amount': p.invoice_amount, 'TDS': p.tds_amount, 'Net Payable': p.net_payable,
      'Due Date': p.pay_before_date, 'Status': p.payment_status,
      'Days Overdue': daysOverdue(p.pay_before_date) ?? 0
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Creditors')
    XLSX.writeFile(wb, `Creditors_Outstanding_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const statusColor = (s: string) => {
    if (s === 'Paid') return 'green'
    if (s === 'HOLD') return 'yellow'
    return 'red'
  }

  const statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'Pending', label: 'Pending' },
    { value: 'HOLD', label: 'HOLD' },
    { value: 'Paid', label: 'Paid' },
  ]

  return (
    <div className="space-y-4">
      {/* Aging buckets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(aging).map(([bucket, amt]) => (
          <Card key={bucket} className="text-center py-3">
            <p className="text-xs text-gray-400 font-medium">{bucket}</p>
            <p className={`text-lg font-bold mt-1 ${bucket === '90d+' ? 'text-red-600' : bucket === '61-90d' ? 'text-orange-600' : bucket === '31-60d' ? 'text-yellow-600' : 'text-gray-800'}`}>
              {inr(amt)}
            </p>
          </Card>
        ))}
      </div>
      <Card className="text-center py-2 bg-red-50">
        <span className="text-sm text-gray-600">Total Payable (excl. paid): </span>
        <span className="text-xl font-bold text-red-700">{inr(totalPending)}</span>
      </Card>

      {/* Vendor summary */}
      {byVendor.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">By Vendor</h3>
          <div className="flex flex-wrap gap-2">
            {byVendor.slice(0, 10).map(v => (
              <div key={v.name} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
                <span className="font-medium text-gray-700">{v.name}</span>
                <span className="text-red-600 font-semibold">{inr(v.total)}</span>
                <span className="text-gray-400 text-xs">({v.count})</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <Select label="Status" options={statusOptions} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36"/>
        <div className="ml-auto">
          <Button variant="secondary" icon={<Download size={16}/>} onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>

      {isLoading && <Spinner/>}

      <Card padding={false}>
        <Table>
          <thead>
            <tr>
              <Th>Vendor</Th>
              <Th>Invoice No</Th>
              <Th>Invoice Date</Th>
              <Th right>Invoice Amt</Th>
              <Th right>TDS</Th>
              <Th right>Net Payable</Th>
              <Th>Due Date</Th>
              <Th>Status</Th>
              <Th right>Days Overdue</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any) => {
              const overdue = daysOverdue(p.pay_before_date)
              const isOverdue = overdue !== null && p.payment_status !== 'Paid'
              return (
                <tr key={p.id} className={`hover:bg-gray-50 ${isOverdue && overdue > 30 ? 'bg-red-50' : ''}`}>
                  <Td className="font-medium text-sm">{p.vendor_name ?? '—'}</Td>
                  <Td className="font-mono text-xs">{p.invoice_no ?? '—'}</Td>
                  <Td className="text-sm">{p.invoice_date ? fmtDate(p.invoice_date) : '—'}</Td>
                  <Td right>{p.invoice_amount ? inr(p.invoice_amount) : '—'}</Td>
                  <Td right className="text-orange-600 text-sm">{p.tds_amount ? inr(p.tds_amount) : '—'}</Td>
                  <Td right className="font-semibold">{p.net_payable ? inr(p.net_payable) : (p.invoice_amount ? inr(p.invoice_amount) : '—')}</Td>
                  <Td className="text-sm">{p.pay_before_date ? fmtDate(p.pay_before_date) : '—'}</Td>
                  <Td><Badge color={statusColor(p.payment_status ?? 'Pending')}>{p.payment_status ?? 'Pending'}</Badge></Td>
                  <Td right className={isOverdue ? 'text-red-600 font-semibold text-sm' : 'text-gray-400 text-sm'}>
                    {isOverdue ? `${overdue}d` : '—'}
                  </Td>
                </tr>
              )
            })}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <Td colSpan={3}>TOTAL ({filtered.length} records)</Td>
                <Td right>{inr(filtered.reduce((s: number, p: any) => s + (p.invoice_amount ?? 0), 0))}</Td>
                <Td right>{inr(filtered.reduce((s: number, p: any) => s + (p.tds_amount ?? 0), 0))}</Td>
                <Td right className="text-red-700">{inr(filtered.reduce((s: number, p: any) => s + (p.net_payable ?? p.invoice_amount ?? 0), 0))}</Td>
                <Td colSpan={3}></Td>
              </tr>
            </tfoot>
          )}
        </Table>
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No records found</p>
        )}
      </Card>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────
export const PartyOutstanding: React.FC = () => {
  const [tab, setTab] = useState<'debtors' | 'creditors'>('debtors')

  return (
    <div className="space-y-5">
      <SectionHeader title="Party Outstanding" subtitle="Receivables (Debtors) and Payables (Creditors)"/>

      <div className="flex gap-0 border-b border-gray-200">
        {(['debtors', 'creditors'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'debtors' ? 'Debtors (Receivables)' : 'Creditors (Payables)'}
          </button>
        ))}
      </div>

      {tab === 'debtors' && <DebtorsTab/>}
      {tab === 'creditors' && <CreditorsTab/>}
    </div>
  )
}

export default PartyOutstanding
