import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate } from '@/lib/utils'
import {
  Card, Select, SectionHeader, Spinner, Table, Th, Td, Input, Modal,
  Button, FormRow, Textarea
} from '@/components/ui'
import { ShoppingCart, Clock, CheckCircle, AlertCircle, Plus, Pencil, Trash2 } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  Received: 'bg-green-100 text-green-700',
  Pending:  'bg-yellow-100 text-yellow-700',
  HOLD:     'bg-red-100 text-red-700',
  Paid:     'bg-blue-100 text-blue-700',
  'Not Paid': 'bg-orange-100 text-orange-700',
}

// ── helpers ───────────────────────────────────────────────────────
const FY_OPTIONS = [
  { value: '2024-25', label: 'FY 2024-25' },
  { value: '2025-26', label: 'FY 2025-26' },
  { value: '2026-27', label: 'FY 2026-27' },
]

const PAY_STATUS_OPTIONS = ['Paid', 'Pending', 'Not Paid', 'HOLD']
const MAT_STATUS_OPTIONS  = ['Received', 'Pending']
const MAT_TYPE_OPTIONS    = [
  'Feed Raw Material', 'Medicine', 'Oral Medicine', 'Feed Medicine',
  'Vaccine', 'Larvender', 'Feedmill Transport', 'Other',
]
const ACCOUNT_TYPE_OPTIONS = ['Online', 'Cash', 'NEFT', 'RTGS']

// ── PURCHASE ORDERS ───────────────────────────────────────────────
const EMPTY_PO = {
  po_no: '', po_date: '', fiscal_year: '2025-26', vendor_name: '',
  item_name: '', material_type: '', quantity: '', unit: '', rate: '',
  gst_pct: '', total_amount: '', grn_no: '', grn_date: '', material_status: 'Pending',
}

export const PurchaseOrdersPage: React.FC = () => {
  const qc = useQueryClient()
  const [fyFilter, setFyFilter] = useState('2025-26')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>(EMPTY_PO)
  const [saving, setSaving] = useState(false)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['purchase_orders', fyFilter],
    queryFn: async () => {
      let all: any[] = [], from = 0
      while (true) {
        const { data } = await supabase
          .from('purchase_orders').select('*')
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
    for (const o of orders) if (o.material_type) s.add(o.material_type)
    return Array.from(s).sort()
  }, [orders])

  const filtered = useMemo(() => orders.filter(o => {
    if (statusFilter && o.material_status !== statusFilter) return false
    if (typeFilter && o.material_type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!o.vendor_name?.toLowerCase().includes(q) &&
          !o.item_name?.toLowerCase().includes(q) &&
          !o.po_no?.toLowerCase().includes(q)) return false
    }
    return true
  }), [orders, typeFilter, statusFilter, search])

  const summary = useMemo(() => {
    const byType: Record<string, { count: number; total: number; received: number }> = {}
    for (const o of orders) {
      const t = o.material_type ?? 'Other'
      if (!byType[t]) byType[t] = { count: 0, total: 0, received: 0 }
      byType[t].count++
      byType[t].total += Number(o.total_amount ?? 0)
      if (o.material_status === 'Received') byType[t].received++
    }
    return byType
  }, [orders])

  const grandTotal = Object.values(summary).reduce((s, v) => s + v.total, 0)

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_PO, fiscal_year: fyFilter }); setModalOpen(true) }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ ...row, po_date: row.po_date ?? '', grn_date: row.grn_date ?? '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        po_no: form.po_no, po_date: form.po_date || null, fiscal_year: form.fiscal_year,
        vendor_name: form.vendor_name, item_name: form.item_name, material_type: form.material_type,
        quantity: form.quantity ? Number(form.quantity) : null, unit: form.unit,
        rate: form.rate ? Number(form.rate) : null, gst_pct: form.gst_pct ? Number(form.gst_pct) : null,
        total_amount: form.total_amount ? Number(form.total_amount) : null,
        grn_no: form.grn_no || null, grn_date: form.grn_date || null, material_status: form.material_status,
      }
      if (editing) {
        await supabase.from('purchase_orders').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('purchase_orders').insert(payload)
      }
      await qc.invalidateQueries({ queryKey: ['purchase_orders'] })
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('purchase_orders').delete().eq('id', id)
    await qc.invalidateQueries({ queryKey: ['purchase_orders'] })
    setDelConfirm(null)
  }

  const f = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }))

  const typeFilterOptions = [{ value: '', label: 'All Types' }, ...types.map(t => ({ value: t, label: t }))]
  const statusFilterOptions = [{ value: '', label: 'All Status' }, ...MAT_STATUS_OPTIONS.map(s => ({ value: s, label: s }))]

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Purchase Orders"
        subtitle={`${filtered.length} POs · ${inr(grandTotal)} total`}
        action={<Button size="sm" onClick={openNew}><Plus size={14} className="mr-1" />Add PO</Button>}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(summary).map(([type, s]) => (
          <Card key={type} className="py-3 px-3">
            <div className="text-xs text-gray-500 font-medium truncate">{type}</div>
            <div className="text-base font-bold text-gray-800 mt-1">{inr(s.total)}</div>
            <div className="text-xs text-gray-400">{s.count} POs · {s.received}/{s.count} rcvd</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={fyFilter} onChange={e => setFyFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {FY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {typeFilterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {statusFilterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor / item / PO no..."
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>PO No</Th>
                <Th>Date</Th>
                <Th>Vendor</Th>
                <Th>Item / Type</Th>
                <Th right>Qty</Th>
                <Th right>Amount</Th>
                <Th>GRN No</Th>
                <Th>GRN Date</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50 text-sm">
                  <Td className="font-mono text-xs text-gray-600">{o.po_no}</Td>
                  <Td>{o.po_date ? fmtDate(o.po_date) : '—'}</Td>
                  <Td className="max-w-[200px] truncate">{o.vendor_name}</Td>
                  <Td>
                    <div className="text-xs font-medium">{o.item_name}</div>
                    <div className="text-xs text-gray-400">{o.material_type}</div>
                  </Td>
                  <Td right className="text-xs">{o.quantity} {o.unit}</Td>
                  <Td right>{o.total_amount ? inr(o.total_amount) : '—'}</Td>
                  <Td className="text-xs text-gray-500">{o.grn_no ?? '—'}</Td>
                  <Td className="text-xs">{o.grn_date ? fmtDate(o.grn_date) : '—'}</Td>
                  <Td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[o.material_status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.material_status ?? '?'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(o)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDelConfirm(o.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center text-gray-400 py-8 text-sm">No records found</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Purchase Order' : 'Add Purchase Order'} size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </div>
        }>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Input label="PO No" value={form.po_no} onChange={f('po_no')} required />
            <Input label="PO Date" type="date" value={form.po_date} onChange={f('po_date')} />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fiscal Year</label>
              <select value={form.fiscal_year} onChange={f('fiscal_year')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {FY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <Input label="Vendor Name" value={form.vendor_name} onChange={f('vendor_name')} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Item Name" value={form.item_name} onChange={f('item_name')} />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Material Type</label>
              <select value={form.material_type} onChange={f('material_type')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select type</option>
                {MAT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Input label="Quantity" type="number" value={form.quantity} onChange={f('quantity')} />
            <Input label="Unit" value={form.unit} onChange={f('unit')} />
            <Input label="Rate" type="number" value={form.rate} onChange={f('rate')} />
            <Input label="GST %" type="number" value={form.gst_pct} onChange={f('gst_pct')} />
          </div>
          <Input label="Total Amount" type="number" value={form.total_amount} onChange={f('total_amount')} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="GRN No" value={form.grn_no} onChange={f('grn_no')} />
            <Input label="GRN Date" type="date" value={form.grn_date} onChange={f('grn_date')} />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Material Status</label>
              <select value={form.material_status} onChange={f('material_status')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MAT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Delete Purchase Order"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDelConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => delConfirm && handleDelete(delConfirm)}>Delete</Button>
          </div>
        }>
        <p className="text-sm text-gray-600">Are you sure you want to delete this purchase order? This action cannot be undone.</p>
      </Modal>
    </div>
  )
}

// ── VENDOR PAYMENTS ───────────────────────────────────────────────
const EMPTY_PAYMENT = {
  vendor_name: '', po_no: '', grn_no: '', grn_date: '', invoice_date: '',
  invoice_amount: '', payment_type: '', payment_status: 'Pending', paid_date: '',
  credit_limit: '', pay_before_date: '', account_type: 'Online', po_raised_by: '',
  payment_approved_by: '', remarks: '',
}

export const PendingPaymentsPage: React.FC = () => {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>(EMPTY_PAYMENT)
  const [saving, setSaving] = useState(false)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['pending_payments'],
    queryFn: async () => {
      let all: any[] = [], from = 0
      while (true) {
        const { data } = await supabase
          .from('pending_payments').select('*')
          .order('invoice_date', { ascending: false })
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
    for (const p of payments) if (p.payment_type) s.add(p.payment_type)
    return Array.from(s).sort()
  }, [payments])

  // Unique months for filter
  const months = useMemo(() => {
    const s = new Set<string>()
    for (const p of payments) {
      if (p.invoice_date) s.add(p.invoice_date.substring(0, 7))
    }
    return Array.from(s).sort().reverse()
  }, [payments])

  const filtered = useMemo(() => payments.filter((p: any) => {
    if (statusFilter) {
      if (statusFilter === 'Not Paid') {
        if (p.payment_status === 'Paid') return false
      } else {
        if (p.payment_status !== statusFilter) return false
      }
    }
    if (typeFilter && p.payment_type !== typeFilter) return false
    if (monthFilter && !p.invoice_date?.startsWith(monthFilter)) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.vendor_name?.toLowerCase().includes(q) &&
          !p.po_no?.toLowerCase().includes(q) &&
          !p.grn_no?.toLowerCase().includes(q)) return false
    }
    return true
  }), [payments, statusFilter, typeFilter, monthFilter, search])

  const summary = useMemo(() => {
    const paid    = payments.filter((p: any) => p.payment_status === 'Paid')
    const pending = payments.filter((p: any) => p.payment_status === 'Pending')
    const notPaid = payments.filter((p: any) => p.payment_status === 'Not Paid')
    const hold    = payments.filter((p: any) => p.payment_status === 'HOLD')
    const tot = (arr: any[]) => arr.reduce((s, p) => s + Number(p.invoice_amount ?? 0), 0)
    return {
      paid:    { count: paid.length,    total: tot(paid) },
      pending: { count: pending.length, total: tot(pending) },
      notPaid: { count: notPaid.length, total: tot(notPaid) },
      hold:    { count: hold.length,    total: tot(hold) },
    }
  }, [payments])

  const filteredTotal = filtered.reduce((s, p: any) => s + Number(p.invoice_amount ?? 0), 0)

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_PAYMENT }); setModalOpen(true) }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({
      ...row,
      grn_date: row.grn_date ?? '', invoice_date: row.invoice_date ?? '',
      paid_date: row.paid_date ?? '', pay_before_date: row.pay_before_date ?? '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        vendor_name: form.vendor_name, po_no: form.po_no || null, grn_no: form.grn_no || null,
        grn_date: form.grn_date || null, invoice_date: form.invoice_date || null,
        invoice_amount: form.invoice_amount ? Number(form.invoice_amount) : null,
        payment_type: form.payment_type, payment_status: form.payment_status,
        paid_date: form.paid_date || null,
        credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
        pay_before_date: form.pay_before_date || null,
        account_type: form.account_type || null,
        po_raised_by: form.po_raised_by || null,
        payment_approved_by: form.payment_approved_by || null,
      }
      if (editing) {
        await supabase.from('pending_payments').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('pending_payments').insert(payload)
      }
      await qc.invalidateQueries({ queryKey: ['pending_payments'] })
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('pending_payments').delete().eq('id', id)
    await qc.invalidateQueries({ queryKey: ['pending_payments'] })
    setDelConfirm(null)
  }

  const f = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }))

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Vendor Payments"
        subtitle={`${filtered.length} records · ${inr(filteredTotal)}`}
        action={<Button size="sm" onClick={openNew}><Plus size={14} className="mr-1" />Add Payment</Button>}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div onClick={() => setStatusFilter(statusFilter === 'Paid' ? '' : 'Paid')} className="bg-white border border-gray-200 rounded-xl shadow-sm text-center py-3 px-3 cursor-pointer hover:ring-2 hover:ring-blue-300">
          <div className="flex items-center justify-center gap-1 text-blue-600 text-xs font-medium mb-1"><CheckCircle size={14} /> Paid</div>
          <div className="text-lg font-bold text-gray-800">{inr(summary.paid.total)}</div>
          <div className="text-xs text-gray-400">{summary.paid.count} invoices</div>
        </div>
        <div onClick={() => setStatusFilter(statusFilter === 'Pending' ? '' : 'Pending')} className="bg-white border border-gray-200 rounded-xl shadow-sm text-center py-3 px-3 cursor-pointer hover:ring-2 hover:ring-yellow-300">
          <div className="flex items-center justify-center gap-1 text-yellow-600 text-xs font-medium mb-1"><Clock size={14} /> Pending</div>
          <div className="text-lg font-bold text-gray-800">{inr(summary.pending.total)}</div>
          <div className="text-xs text-gray-400">{summary.pending.count} invoices</div>
        </div>
        <div onClick={() => setStatusFilter(statusFilter === 'Not Paid' ? '' : 'Not Paid')} className="bg-white border border-gray-200 rounded-xl shadow-sm text-center py-3 px-3 cursor-pointer hover:ring-2 hover:ring-orange-300">
          <div className="flex items-center justify-center gap-1 text-orange-600 text-xs font-medium mb-1"><AlertCircle size={14} /> Not Paid</div>
          <div className="text-lg font-bold text-gray-800">{inr(summary.notPaid.total)}</div>
          <div className="text-xs text-gray-400">{summary.notPaid.count} invoices</div>
        </div>
        <div onClick={() => setStatusFilter(statusFilter === 'HOLD' ? '' : 'HOLD')} className="bg-white border border-gray-200 rounded-xl shadow-sm text-center py-3 px-3 cursor-pointer hover:ring-2 hover:ring-red-300">
          <div className="flex items-center justify-center gap-1 text-red-600 text-xs font-medium mb-1"><AlertCircle size={14} /> HOLD</div>
          <div className="text-lg font-bold text-gray-800">{inr(summary.hold.total)}</div>
          <div className="text-xs text-gray-400">{summary.hold.count} invoices</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          {PAY_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Months</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor / PO / GRN..."
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Vendor</Th>
                <Th>Type</Th>
                <Th right>Amount</Th>
                <Th>GRN No</Th>
                <Th>GRN Date</Th>
                <Th>Invoice Date</Th>
                <Th>Pay Before</Th>
                <Th>Days</Th>
                <Th>PO No</Th>
                <Th>Account</Th>
                <Th>Raised By</Th>
                <Th>Approved By</Th>
                <Th>Status</Th>
                <Th>Paid Date</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 text-sm">
                  <Td className="max-w-[180px] truncate font-medium">{p.vendor_name}</Td>
                  <Td><span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{p.payment_type ?? '—'}</span></Td>
                  <Td right>{p.invoice_amount ? inr(p.invoice_amount) : '—'}</Td>
                  <Td className="text-xs text-gray-500">{p.grn_no ?? '—'}</Td>
                  <Td className="text-xs">{p.grn_date ? fmtDate(p.grn_date) : '—'}</Td>
                  <Td className="text-xs">{p.invoice_date ? fmtDate(p.invoice_date) : '—'}</Td>
                  <Td className="text-xs">{p.pay_before_date ? fmtDate(p.pay_before_date) : '—'}</Td>
                  <Td className="text-center text-xs">{p.credit_limit ?? '—'}</Td>
                  <Td className="font-mono text-xs text-gray-500">{p.po_no ?? '—'}</Td>
                  <Td className="text-xs">{p.account_type ?? '—'}</Td>
                  <Td className="text-xs text-gray-500">{p.po_raised_by ?? '—'}</Td>
                  <Td className="text-xs text-gray-500">{p.payment_approved_by ?? '—'}</Td>
                  <Td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[p.payment_status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {p.payment_status ?? 'Pending'}
                    </span>
                  </Td>
                  <Td className="text-xs">{p.paid_date ? fmtDate(p.paid_date) : '—'}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDelConfirm(p.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={15} className="text-center text-gray-400 py-8 text-sm">No records found</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Payment' : 'Add Payment'} size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </div>
        }>
        <div className="space-y-3">
          <Input label="Vendor Name" value={form.vendor_name} onChange={f('vendor_name')} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="PO No" value={form.po_no} onChange={f('po_no')} />
            <Input label="GRN No" value={form.grn_no} onChange={f('grn_no')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="GRN Date" type="date" value={form.grn_date} onChange={f('grn_date')} />
            <Input label="Invoice Date" type="date" value={form.invoice_date} onChange={f('invoice_date')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Invoice Amount" type="number" value={form.invoice_amount} onChange={f('invoice_amount')} />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Type</label>
              <select value={form.payment_type} onChange={f('payment_type')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select type</option>
                {MAT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Credit Limit (days)" type="number" value={form.credit_limit} onChange={f('credit_limit')} />
            <Input label="Pay Before Date" type="date" value={form.pay_before_date} onChange={f('pay_before_date')} />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Account Type</label>
              <select value={form.account_type} onChange={f('account_type')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                {ACCOUNT_TYPE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status</label>
              <select value={form.payment_status} onChange={f('payment_status')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PAY_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input label="Paid Date" type="date" value={form.paid_date} onChange={f('paid_date')} />
            <Input label="Raised By" value={form.po_raised_by} onChange={f('po_raised_by')} />
          </div>
          <Input label="Approved By" value={form.payment_approved_by} onChange={f('payment_approved_by')} />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Delete Payment Record"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDelConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => delConfirm && handleDelete(delConfirm)}>Delete</Button>
          </div>
        }>
        <p className="text-sm text-gray-600">Are you sure you want to delete this payment record? This action cannot be undone.</p>
      </Modal>
    </div>
  )
}
