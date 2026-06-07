import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate } from '@/lib/utils'
import {
  Card, Select, SectionHeader, Spinner, Table, Th, Td, Badge, Input
} from '@/components/ui'
import { ShoppingCart, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  Received: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  HOLD: 'bg-red-100 text-red-700',
  Paid: 'bg-blue-100 text-blue-700',
}

// ── PURCHASE ORDERS ───────────────────────────────────────────────
export const PurchaseOrdersPage: React.FC = () => {
  const [fyFilter, setFyFilter] = useState('2025-26')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['purchase_orders', fyFilter],
    queryFn: async () => {
      let all: any[] = [], from = 0
      while (true) {
        const { data } = await supabase
          .from('purchase_orders')
          .select('*')
          .eq('fiscal_year', fyFilter)
          .order('po_date', { ascending: false })
          .range(from, from + 999)
        if (!data || data.length === 0) break
        all = all.concat(data)
        if (data.length < 1000) break
        from += 1000
      }
      return all
    }
  })

  const types = useMemo(() => {
    const s = new Set<string>()
    for (const o of (orders ?? [])) if (o.material_type) s.add(o.material_type)
    return Array.from(s).sort()
  }, [orders])

  const filtered = useMemo(() => {
    return (orders ?? []).filter((o: any) => {
      if (typeFilter && o.material_type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!o.vendor_name?.toLowerCase().includes(q) && !o.item_name?.toLowerCase().includes(q) && !o.po_no?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [orders, typeFilter, search])

  // Summary
  const summary = useMemo(() => {
    const byType: Record<string, { count: number; total: number; received: number }> = {}
    for (const o of (orders ?? [])) {
      const t = o.material_type ?? 'Other'
      if (!byType[t]) byType[t] = { count: 0, total: 0, received: 0 }
      byType[t].count++
      byType[t].total += o.total_amount ?? 0
      if (o.material_status === 'Received') byType[t].received++
    }
    return byType
  }, [orders])

  const grandTotal = Object.values(summary).reduce((s, v) => s + v.total, 0)

  const fyOptions = [
    { value: '2024-25', label: 'FY 2024-25' },
    { value: '2025-26', label: 'FY 2025-26' },
    { value: '2026-27', label: 'FY 2026-27' },
  ]
  const typeOptions = [{ value: '', label: 'All Types' }, ...types.map(t => ({ value: t, label: t }))]

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader title="Purchase Orders" subtitle={`${filtered.length} POs — ${inr(grandTotal)} total`} />

      {/* Summary cards by type */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(summary).map(([type, s]) => (
          <Card key={type} className="py-3 px-3">
            <div className="text-xs text-gray-500 font-medium truncate">{type}</div>
            <div className="text-base font-bold text-gray-800 mt-1">{inr(s.total)}</div>
            <div className="text-xs text-gray-400">{s.count} POs · {s.received}/{s.count} rcvd</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select label="" placeholder="" options={fyOptions} value={fyFilter} onChange={e => setFyFilter(e.target.value)} className="w-36" />
        <Select label="" placeholder="" options={typeOptions} value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-52" />
        <Input label="" placeholder="Search vendor / item / PO no..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>PO No</Th>
                <Th>Date</Th>
                <Th>Vendor</Th>
                <Th>Item</Th>
                <Th>Type</Th>
                <Th className="text-right">Qty</Th>
                <Th className="text-right">Amount</Th>
                <Th>GRN</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 text-sm">
                  <Td className="font-mono text-xs text-gray-600">{o.po_no}</Td>
                  <Td>{o.po_date ? fmtDate(o.po_date) : '—'}</Td>
                  <Td className="max-w-xs truncate">{o.vendor_name}</Td>
                  <Td className="max-w-xs truncate">{o.item_name}</Td>
                  <Td>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{o.material_type}</span>
                  </Td>
                  <Td className="text-right text-xs">{o.quantity} {o.unit}</Td>
                  <Td className="text-right">{o.total_amount ? inr(o.total_amount) : '—'}</Td>
                  <Td className="text-xs text-gray-500">{o.grn_no ?? '—'}</Td>
                  <Td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[o.material_status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.material_status ?? '?'}
                    </span>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center text-gray-400 py-8 text-sm">No records found</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  )
}

// ── PENDING PAYMENTS ──────────────────────────────────────────────
export const PendingPaymentsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data: payments, isLoading } = useQuery({
    queryKey: ['pending_payments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pending_payments')
        .select('*')
        .order('invoice_date', { ascending: false })
      return data ?? []
    }
  })

  const types = useMemo(() => {
    const s = new Set<string>()
    for (const p of (payments ?? [])) if (p.payment_type) s.add(p.payment_type)
    return Array.from(s).sort()
  }, [payments])

  const filtered = useMemo(() => {
    return (payments ?? []).filter((p: any) => {
      if (statusFilter && p.payment_status !== statusFilter) return false
      if (typeFilter && p.payment_type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!p.vendor_name?.toLowerCase().includes(q) && !p.po_no?.toLowerCase().includes(q) && !p.grn_no?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [payments, statusFilter, typeFilter, search])

  const summary = useMemo(() => {
    const paid = (payments ?? []).filter((p: any) => p.payment_status === 'Paid')
    const pending = (payments ?? []).filter((p: any) => p.payment_status !== 'Paid' && p.payment_status !== 'HOLD')
    const hold = (payments ?? []).filter((p: any) => p.payment_status === 'HOLD')
    return {
      paid: { count: paid.length, total: paid.reduce((s: number, p: any) => s + (p.invoice_amount ?? 0), 0) },
      pending: { count: pending.length, total: pending.reduce((s: number, p: any) => s + (p.invoice_amount ?? 0), 0) },
      hold: { count: hold.length, total: hold.reduce((s: number, p: any) => s + (p.invoice_amount ?? 0), 0) },
    }
  }, [payments])

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Paid', label: 'Paid' },
    { value: 'HOLD', label: 'HOLD' },
    { value: '', label: 'Pending' },
  ]
  const typeOptions = [{ value: '', label: 'All Types' }, ...types.map(t => ({ value: t, label: t }))]

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader title="Vendor Payments" subtitle="Invoice payment tracking" />

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center py-3">
          <div className="flex items-center justify-center gap-1 text-green-600 text-xs font-medium mb-1"><CheckCircle size={14} /> Paid</div>
          <div className="text-xl font-bold text-gray-800">{inr(summary.paid.total)}</div>
          <div className="text-xs text-gray-400">{summary.paid.count} invoices</div>
        </Card>
        <Card className="text-center py-3">
          <div className="flex items-center justify-center gap-1 text-yellow-600 text-xs font-medium mb-1"><Clock size={14} /> Pending</div>
          <div className="text-xl font-bold text-gray-800">{inr(summary.pending.total)}</div>
          <div className="text-xs text-gray-400">{summary.pending.count} invoices</div>
        </Card>
        <Card className="text-center py-3">
          <div className="flex items-center justify-center gap-1 text-red-600 text-xs font-medium mb-1"><AlertCircle size={14} /> HOLD</div>
          <div className="text-xl font-bold text-gray-800">{inr(summary.hold.total)}</div>
          <div className="text-xs text-gray-400">{summary.hold.count} invoices</div>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="Paid">Paid</option>
          <option value="HOLD">HOLD</option>
          <option value="Pending">Pending</option>
        </select>
        <Select label="" placeholder="" options={typeOptions} value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-52" />
        <Input label="" placeholder="Search vendor / PO / GRN..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Vendor</Th>
                <Th>Type</Th>
                <Th>Invoice Amt</Th>
                <Th>GRN Date</Th>
                <Th>Invoice Date</Th>
                <Th>Pay Before</Th>
                <Th>Credit Days</Th>
                <Th>PO No</Th>
                <Th>Status</Th>
                <Th>Paid Date</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 text-sm">
                  <Td className="max-w-xs truncate font-medium">{p.vendor_name}</Td>
                  <Td><span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{p.payment_type ?? '—'}</span></Td>
                  <Td className="text-right">{p.invoice_amount ? inr(p.invoice_amount) : '—'}</Td>
                  <Td className="text-xs">{p.grn_date ? fmtDate(p.grn_date) : '—'}</Td>
                  <Td className="text-xs">{p.invoice_date ? fmtDate(p.invoice_date) : '—'}</Td>
                  <Td className="text-xs">{p.pay_before_date ? fmtDate(p.pay_before_date) : '—'}</Td>
                  <Td className="text-center text-xs">{p.credit_limit ?? '—'}</Td>
                  <Td className="font-mono text-xs text-gray-500">{p.po_no ?? '—'}</Td>
                  <Td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[p.payment_status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {p.payment_status ?? 'Pending'}
                    </span>
                  </Td>
                  <Td className="text-xs">{p.paid_date ? fmtDate(p.paid_date) : '—'}</Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center text-gray-400 py-8 text-sm">No records found</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
