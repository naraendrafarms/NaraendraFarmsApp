import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import {
  Card, SectionHeader, Spinner, Badge, Select
} from '@/components/ui'
import { AlertCircle, Search, Link2, X, CheckCircle2, Trash2, Pencil } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d: string) => d ? d.split('-').reverse().join('/') : '—'

type PayRecord = {
  id: string
  vendor_name: string
  party_id: string | null
  invoice_no: string | null
  grn_no: string | null
  grn_date: string | null
  invoice_amount: number
  tds_amount: number | null
  net_payable: number | null
  paid_amount: number | null
  discount_amount: number | null
  pay_before_date: string | null
  payment_status: string
  category: string | null
  account_type: string | null
  remarks: string | null
}

type PayModal = {
  record: PayRecord
  paidAmt: string
  paidDate: string
  mode: string
  ref: string
  remarks: string
}

// ── Waiting to Link ──────────────────────────────────────────────────────────

type WaitingTxn = {
  id: string
  txn_date: string
  description: string | null
  reference_no: string | null
  amount: number
  category: string | null
  statement_balance: number | null
}

const WaitingToLink: React.FC = () => {
  const qc = useQueryClient()
  const [linkModal, setLinkModal] = useState<WaitingTxn | null>(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState('')
  const [linking, setLinking] = useState(false)

  const { data: waitingTxns, isLoading } = useQuery({
    queryKey: ['bank_txn_waiting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('id,txn_date,description,reference_no,amount,category,statement_balance')
        .eq('imported', true)
        .eq('match_status', 'waiting')
        .eq('txn_type', 'Debit')
        .order('txn_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as WaitingTxn[]
    }
  })

  const { data: openPayments } = useQuery({
    queryKey: ['pending_payments_open'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pending_payments')
        .select('id,vendor_name,invoice_no,grn_no,net_payable,invoice_amount,paid_amount,discount_amount')
        .neq('payment_status', 'Paid')
        .order('vendor_name')
      return (data ?? []) as any[]
    }
  })

  const getBalance = (p: any) => Math.max(0, (p.net_payable ?? p.invoice_amount ?? 0) - (p.paid_amount ?? 0) - (p.discount_amount ?? 0))
  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const paymentOptions = (openPayments ?? []).map((p: any) => ({
    value: p.id,
    label: `${p.vendor_name} — ${p.invoice_no ?? p.grn_no ?? ''} — ₹${fmt(getBalance(p))}`,
  }))

  const handleIgnore = async (id: string) => {
    await supabase.from('bank_transactions').update({ match_status: 'ignored' }).eq('id', id)
    qc.invalidateQueries({ queryKey: ['bank_txn_waiting'] })
    toast.success('Marked as ignored')
  }

  const handleLink = async () => {
    if (!linkModal || !selectedPaymentId) return
    setLinking(true)
    try {
      const payment = (openPayments ?? []).find((p: any) => p.id === selectedPaymentId)
      const balance = payment ? getBalance(payment) : 0

      await supabase.from('bank_transactions').update({
        match_status: 'manually_matched',
        linked_payment_id: selectedPaymentId,
      }).eq('id', linkModal.id)

      if (payment) {
        await supabase.from('pending_payments').update({
          paid_amount: (payment.paid_amount ?? 0) + balance,
          paid_date: linkModal.txn_date,
          payment_status: 'Paid',
          transaction_ref: linkModal.reference_no || null,
        }).eq('id', selectedPaymentId)
      }

      qc.invalidateQueries({ queryKey: ['bank_txn_waiting'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_open'] })
      qc.invalidateQueries({ queryKey: ['bank_txn_matched'] })
      setLinkModal(null)
      setSelectedPaymentId('')
      toast.success('Linked and marked as paid')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLinking(false)
    }
  }

  // Already-linked (auto or manual) bank transactions — so wrong matches can be undone
  const { data: matchedTxns } = useQuery({
    queryKey: ['bank_txn_matched'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bank_transactions')
        .select('id,txn_date,description,reference_no,amount,category,match_status,linked_payment_id')
        .eq('imported', true)
        .in('match_status', ['auto_matched', 'manually_matched'])
        .order('txn_date', { ascending: false })
      return (data ?? []) as any[]
    }
  })

  const handleUnlink = async (t: any) => {
    try {
      // Revert the linked vendor bill back to unpaid
      if (t.linked_payment_id) {
        await supabase.from('pending_payments').update({
          payment_status: 'Pending', paid_amount: 0, paid_date: null, transaction_ref: null,
        }).eq('id', t.linked_payment_id)
      }
      // Send the bank transaction back to "waiting" so it can be re-linked or ignored
      await supabase.from('bank_transactions').update({
        match_status: 'waiting', linked_payment_id: null,
      }).eq('id', t.id)
      qc.invalidateQueries({ queryKey: ['bank_txn_matched'] })
      qc.invalidateQueries({ queryKey: ['bank_txn_waiting'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_open'] })
      toast.success('Unlinked — bill set back to Pending')
    } catch (e: any) { toast.error(e.message) }
  }

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <span>These are bank debit transactions imported from your statement that could not be automatically matched to a vendor payment. Link each one manually or ignore it if not relevant.</span>
      </div>

      {(waitingTxns ?? []).length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <CheckCircle2 size={32} className="mx-auto mb-2 text-green-400" />
          <div>No transactions waiting to be linked</div>
        </div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-left">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Stmt Balance</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(waitingTxns ?? []).map((t, i) => (
                  <tr key={t.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    <td className="px-3 py-2 text-gray-600">{t.txn_date}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{t.description || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{t.reference_no || '—'}</td>
                    <td className="px-3 py-2 text-right font-semibold text-red-600">₹{fmt(t.amount)}</td>
                    <td className="px-3 py-2 text-gray-500">{t.category || '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{t.statement_balance != null ? `₹${fmt(t.statement_balance)}` : '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setLinkModal(t); setSelectedPaymentId('') }}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          <Link2 size={11} /> Link
                        </button>
                        <button
                          onClick={() => { if (confirm('Mark as ignored?')) handleIgnore(t.id) }}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300"
                        >
                          <X size={11} /> Ignore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Already-linked transactions — undo wrong matches here */}
      {(matchedTxns ?? []).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mt-4">Linked Transactions ({(matchedTxns ?? []).length})</h3>
          <p className="text-xs text-gray-400">Auto-matched or manually-linked bank debits. If a link is wrong, click <strong>Unlink</strong> — it sets the vendor bill back to Pending and returns the transaction to "Waiting to Link".</p>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-left">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Reference</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2">Match</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(matchedTxns ?? []).map((t: any, i: number) => (
                    <tr key={t.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="px-3 py-2 text-gray-600">{t.txn_date}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{t.description || '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{t.reference_no || '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold text-red-600">₹{fmt(t.amount)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${t.match_status === 'auto_matched' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {t.match_status === 'auto_matched' ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => { if (confirm('Unlink this transaction and set the bill back to Pending?')) handleUnlink(t) }}
                          className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 mx-auto"
                        >
                          <X size={11} /> Unlink
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Link modal */}
      {linkModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Link to Vendor Payment</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="text-gray-500">{linkModal.txn_date} · {linkModal.reference_no || linkModal.description}</div>
              <div className="font-semibold text-red-600">₹{fmt(linkModal.amount)}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Select Vendor Bill</label>
              <select
                value={selectedPaymentId}
                onChange={e => setSelectedPaymentId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select —</option>
                {paymentOptions.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setLinkModal(null)} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleLink} disabled={!selectedPaymentId || linking} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {linking ? 'Linking…' : 'Confirm Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import toast from 'react-hot-toast'

// ── Main Page ─────────────────────────────────────────────────────────────────

export const PendingPaymentsPage: React.FC = () => {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'outstanding' | 'waiting'>('outstanding')
  const [vendorFilter, setVendorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('unpaid')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<PayModal | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [editModal, setEditModal] = useState<PayRecord | null>(null)
  const [editForm, setEditForm] = useState({ vendor_name: '', invoice_no: '', grn_no: '', invoice_amount: '', tds_amount: '', discount_amount: '', pay_before_date: '', category: '', remarks: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editErr, setEditErr] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const { data: records, isLoading } = useQuery({
    queryKey: ['pending_payments_page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_payments')
        .select('id,vendor_name,party_id,invoice_no,grn_no,grn_date,invoice_amount,tds_amount,net_payable,paid_amount,discount_amount,pay_before_date,payment_status,category,account_type,remarks')
        .order('grn_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as PayRecord[]
    }
  })

  const todayStr = today()

  const filtered = useMemo(() => {
    let rows = records ?? []
    if (statusFilter === 'unpaid') rows = rows.filter(r => r.payment_status !== 'Paid')
    else if (statusFilter === 'paid') rows = rows.filter(r => r.payment_status === 'Paid')
    else if (statusFilter === 'overdue') rows = rows.filter(r => r.payment_status !== 'Paid' && r.pay_before_date && r.pay_before_date < todayStr)
    if (vendorFilter) rows = rows.filter(r => r.vendor_name === vendorFilter)
    if (categoryFilter) rows = rows.filter(r => r.category === categoryFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        r.vendor_name?.toLowerCase().includes(q) ||
        r.invoice_no?.toLowerCase().includes(q) ||
        r.grn_no?.toLowerCase().includes(q)
      )
    }
    return rows
  }, [records, statusFilter, vendorFilter, categoryFilter, search, todayStr])

  const vendors = useMemo(() => [...new Set((records ?? []).map(r => r.vendor_name).filter(Boolean))].sort(), [records])
  const categories = useMemo(() => [...new Set((records ?? []).map(r => r.category).filter(Boolean))].sort(), [records])

  // Summary
  const unpaid = (records ?? []).filter(r => r.payment_status !== 'Paid')
  const totalOutstanding = unpaid.reduce((s, r) => {
    const base = r.net_payable ?? r.invoice_amount ?? 0
    const paid = r.paid_amount ?? 0
    const disc = r.discount_amount ?? 0
    return s + Math.max(0, base - paid - disc)
  }, 0)
  const overdue = unpaid.filter(r => r.pay_before_date && r.pay_before_date < todayStr)
  const overdueAmt = overdue.reduce((s, r) => {
    const base = r.net_payable ?? r.invoice_amount ?? 0
    const paid = r.paid_amount ?? 0
    const disc = r.discount_amount ?? 0
    return s + Math.max(0, base - paid - disc)
  }, 0)
  const dueThisWeek = unpaid.filter(r => r.pay_before_date && r.pay_before_date >= todayStr && r.pay_before_date <= new Date(Date.now() + 7*86400000).toISOString().slice(0,10))

  const getBalance = (r: PayRecord) => {
    const base = r.net_payable ?? r.invoice_amount ?? 0
    const paid = r.paid_amount ?? 0
    const disc = r.discount_amount ?? 0
    return Math.max(0, base - paid - disc)
  }

  const getDueBadge = (r: PayRecord) => {
    if (r.payment_status === 'Paid') return <Badge color="green">Paid</Badge>
    if (r.payment_status === 'HOLD') return <Badge color="yellow">Hold</Badge>
    if (!r.pay_before_date) return <Badge color="gray">Pending</Badge>
    if (r.pay_before_date < todayStr) return <Badge color="red">Overdue</Badge>
    const daysLeft = Math.round((new Date(r.pay_before_date).getTime() - Date.now()) / 86400000)
    if (daysLeft <= 7) return <Badge color="yellow">Due {daysLeft}d</Badge>
    return <Badge color="blue">Due {fmtDate(r.pay_before_date)}</Badge>
  }

  const openPayModal = (r: PayRecord) => {
    setModal({ record: r, paidAmt: fmt(getBalance(r)).replace(/,/g,''), paidDate: todayStr, mode: 'NEFT', ref: '', remarks: '' })
    setErr('')
  }

  const handlePay = async () => {
    if (!modal) return
    const amt = parseFloat(modal.paidAmt)
    if (!amt || amt <= 0) { setErr('Enter valid amount'); return }
    setSaving(true); setErr('')
    try {
      const newPaid = (modal.record.paid_amount ?? 0) + amt
      const bal = getBalance(modal.record) - amt
      const newStatus = bal <= 0.01 ? 'Paid' : modal.record.payment_status
      const { error } = await supabase.from('pending_payments').update({
        paid_amount: newPaid,
        paid_date: modal.paidDate,
        account_type: modal.mode,
        transaction_ref: modal.ref || null,
        remarks: modal.remarks || modal.record.remarks || null,
        payment_status: newStatus,
      }).eq('id', modal.record.id)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
      setModal(null)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (r: PayRecord) => {
    setEditModal(r)
    setEditForm({
      vendor_name: r.vendor_name ?? '',
      invoice_no: r.invoice_no ?? '',
      grn_no: r.grn_no ?? '',
      invoice_amount: r.invoice_amount != null ? String(r.invoice_amount) : '',
      tds_amount: r.tds_amount != null ? String(r.tds_amount) : '',
      discount_amount: r.discount_amount != null ? String(r.discount_amount) : '',
      pay_before_date: r.pay_before_date ?? '',
      category: r.category ?? '',
      remarks: r.remarks ?? '',
    })
    setEditErr('')
  }

  const handleEditSave = async () => {
    if (!editModal) return
    if (!editForm.vendor_name.trim()) { setEditErr('Vendor name is required'); return }
    setEditSaving(true); setEditErr('')
    try {
      const invAmt = parseFloat(editForm.invoice_amount) || 0
      const tds = editForm.tds_amount === '' ? null : parseFloat(editForm.tds_amount) || 0
      const { error } = await supabase.from('pending_payments').update({
        vendor_name: editForm.vendor_name.trim(),
        invoice_no: editForm.invoice_no || null,
        grn_no: editForm.grn_no || null,
        invoice_amount: invAmt,
        tds_amount: tds,
        net_payable: invAmt - (tds ?? 0),
        discount_amount: editForm.discount_amount === '' ? null : parseFloat(editForm.discount_amount) || 0,
        pay_before_date: editForm.pay_before_date || null,
        category: editForm.category || null,
        remarks: editForm.remarks || null,
      }).eq('id', editModal.id)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
      setEditModal(null)
    } catch (e: any) {
      setEditErr(e.message)
    } finally {
      setEditSaving(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(r => r.id)))
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected bill(s)?`)) return
    setBulkDeleting(true)
    try {
      const { error } = await supabase.from('pending_payments').delete().in('id', [...selectedIds])
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
      setSelectedIds(new Set())
      toast.success('Selected bills deleted')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleExport = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ['Vendor', 'Category', 'Invoice No', 'GRN No', 'GRN Date', 'Invoice Amt', 'TDS', 'Net Payable', 'Paid', 'Discount', 'Balance', 'Due Date', 'Status'],
      ...filtered.map(r => [
        r.vendor_name, r.category ?? '', r.invoice_no ?? '', r.grn_no ?? '',
        r.grn_date ? fmtDate(r.grn_date) : '',
        r.invoice_amount, r.tds_amount ?? 0, r.net_payable ?? r.invoice_amount,
        r.paid_amount ?? 0, r.discount_amount ?? 0, getBalance(r),
        r.pay_before_date ? fmtDate(r.pay_before_date) : '', r.payment_status,
      ])
    ])
    ws['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Pending Payments')
    XLSX.writeFile(wb, `pending_payments_${todayStr}.xlsx`)
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Pending Payments"
        subtitle="Vendor bills received (GRN done) — outstanding amounts to pay"
        action={
          tab === 'outstanding' ? (
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              <Download size={14} /> Export Excel
            </button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([
          { key: 'outstanding', label: 'Outstanding Bills' },
          { key: 'waiting', label: 'Waiting to Link' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'waiting' && <WaitingToLink />}
      {tab === 'outstanding' && (<>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="py-3 text-center">
          <div className="text-xs text-gray-500 uppercase font-medium">Total Outstanding</div>
          <div className="text-xl font-bold text-red-600 mt-1">₹{fmt(totalOutstanding)}</div>
          <div className="text-xs text-gray-400">{unpaid.length} bills unpaid</div>
        </Card>
        <Card className="py-3 text-center">
          <div className="text-xs text-gray-500 uppercase font-medium">Overdue</div>
          <div className="text-xl font-bold text-red-700 mt-1">₹{fmt(overdueAmt)}</div>
          <div className="text-xs text-gray-400">{overdue.length} bills past due date</div>
        </Card>
        <Card className="py-3 text-center">
          <div className="text-xs text-gray-500 uppercase font-medium">Due This Week</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{dueThisWeek.length} bills</div>
          <div className="text-xs text-gray-400">next 7 days</div>
        </Card>
        <Card className="py-3 text-center">
          <div className="text-xs text-gray-500 uppercase font-medium">Vendors</div>
          <div className="text-xl font-bold text-gray-800 mt-1">{[...new Set(unpaid.map(r => r.vendor_name))].length}</div>
          <div className="text-xs text-gray-400">with pending dues</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select label="" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36"
          options={[{ value: 'unpaid', label: 'Unpaid Only' }, { value: 'overdue', label: 'Overdue' }, { value: 'paid', label: 'Paid' }, { value: 'all', label: 'All' }]} />
        <Select label="" value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} className="w-48"
          options={[{ value: '', label: 'All Vendors' }, ...vendors.map(v => ({ value: v, label: v }))]} />
        <Select label="" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-36"
          options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c as string, label: c as string }))]} />
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 bg-white w-56">
          <Search size={14} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor / invoice..." className="text-sm outline-none w-full" />
        </div>
        {(vendorFilter || categoryFilter || search || statusFilter !== 'unpaid') && (
          <button onClick={() => { setVendorFilter(''); setCategoryFilter(''); setSearch(''); setStatusFilter('unpaid') }}
            className="text-sm text-gray-500 underline hover:text-gray-700">Clear</button>
        )}
      </div>

      {/* Bulk delete bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm">
          <span className="text-red-700 font-medium">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 size={14} /> {bulkDeleting ? 'Deleting…' : 'Delete Selected'}
          </button>
        </div>
      )}

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-left">
                <th className="px-3 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-3 py-2">Vendor</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Invoice / GRN</th>
                <th className="px-2 py-2">GRN Date</th>
                <th className="px-2 py-2 text-right">Invoice Amt</th>
                <th className="px-2 py-2 text-right">TDS</th>
                <th className="px-2 py-2 text-right">Net Payable</th>
                <th className="px-2 py-2 text-right">Paid</th>
                <th className="px-2 py-2 text-right font-semibold">Balance</th>
                <th className="px-2 py-2">Due Date</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const bal = getBalance(r)
                const isOverdue = r.payment_status !== 'Paid' && r.pay_before_date && r.pay_before_date < todayStr
                return (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-800 max-w-[160px] truncate">{r.vendor_name}</td>
                    <td className="px-2 py-2 text-gray-500">{r.category ?? '—'}</td>
                    <td className="px-2 py-2">
                      <div className="text-gray-700">{r.invoice_no ?? '—'}</div>
                      <div className="text-gray-400">{r.grn_no ?? ''}</div>
                    </td>
                    <td className="px-2 py-2 text-gray-600">{r.grn_date ? fmtDate(r.grn_date) : '—'}</td>
                    <td className="px-2 py-2 text-right">{fmt(r.invoice_amount ?? 0)}</td>
                    <td className="px-2 py-2 text-right text-orange-600">{r.tds_amount ? fmt(r.tds_amount) : '—'}</td>
                    <td className="px-2 py-2 text-right">{fmt(r.net_payable ?? r.invoice_amount ?? 0)}</td>
                    <td className="px-2 py-2 text-right text-green-700">{r.paid_amount ? fmt(r.paid_amount) : '—'}</td>
                    <td className={`px-2 py-2 text-right font-semibold ${bal > 0 ? (isOverdue ? 'text-red-700' : 'text-gray-800') : 'text-green-600'}`}>
                      {bal > 0 ? fmt(bal) : '✓'}
                    </td>
                    <td className="px-2 py-2 text-gray-600">{r.pay_before_date ? fmtDate(r.pay_before_date) : '—'}</td>
                    <td className="px-2 py-2">{getDueBadge(r)}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1.5">
                        {r.payment_status !== 'Paid' && bal > 0 && (
                          <button onClick={() => openPayModal(r)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap">
                            Pay
                          </button>
                        )}
                        <button onClick={() => openEdit(r)} title="Edit"
                          className="p-1 text-gray-400 hover:text-blue-600">
                          <Pencil size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={13} className="text-center py-10 text-gray-400">No records found</td></tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold text-xs">
                  <td colSpan={5} className="px-3 py-2">{filtered.length} bills</td>
                  <td className="px-2 py-2 text-right">{fmt(filtered.reduce((s, r) => s + (r.invoice_amount ?? 0), 0))}</td>
                  <td className="px-2 py-2 text-right text-orange-600">{fmt(filtered.reduce((s, r) => s + (r.tds_amount ?? 0), 0))}</td>
                  <td className="px-2 py-2 text-right">{fmt(filtered.reduce((s, r) => s + (r.net_payable ?? r.invoice_amount ?? 0), 0))}</td>
                  <td className="px-2 py-2 text-right text-green-700">{fmt(filtered.reduce((s, r) => s + (r.paid_amount ?? 0), 0))}</td>
                  <td className="px-2 py-2 text-right text-red-700">{fmt(filtered.reduce((s, r) => s + getBalance(r), 0))}</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* Pay modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Record Payment</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="font-medium text-gray-800">{modal.record.vendor_name}</div>
              <div className="text-gray-500">{modal.record.invoice_no ?? modal.record.grn_no} · {modal.record.grn_date ? fmtDate(modal.record.grn_date) : ''}</div>
              <div className="text-gray-700">Balance Due: <span className="font-semibold text-red-600">₹{fmt(getBalance(modal.record))}</span></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Amount Paying (₹)</label>
                <input type="number" value={modal.paidAmt} onChange={e => setModal(m => m ? { ...m, paidAmt: e.target.value } : m)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Payment Date</label>
                <input type="date" value={modal.paidDate} onChange={e => setModal(m => m ? { ...m, paidDate: e.target.value } : m)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Payment Mode</label>
                <select value={modal.mode} onChange={e => setModal(m => m ? { ...m, mode: e.target.value } : m)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  {['NEFT', 'RTGS', 'IMPS', 'Cheque', 'Cash', 'UPI'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Reference / UTR / Cheque No</label>
                <input value={modal.ref} onChange={e => setModal(m => m ? { ...m, ref: e.target.value } : m)}
                  placeholder="Optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Remarks</label>
                <input value={modal.remarks} onChange={e => setModal(m => m ? { ...m, remarks: e.target.value } : m)}
                  placeholder="Optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {err && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{err}</div>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handlePay} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-lg">Edit Bill</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Vendor</label>
                <input value={editForm.vendor_name} onChange={e => setEditForm(f => ({ ...f, vendor_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Invoice No</label>
                  <input value={editForm.invoice_no} onChange={e => setEditForm(f => ({ ...f, invoice_no: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">GRN No</label>
                  <input value={editForm.grn_no} onChange={e => setEditForm(f => ({ ...f, grn_no: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Invoice Amount</label>
                  <input type="number" value={editForm.invoice_amount} onChange={e => setEditForm(f => ({ ...f, invoice_amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">TDS</label>
                  <input type="number" value={editForm.tds_amount} onChange={e => setEditForm(f => ({ ...f, tds_amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Discount</label>
                  <input type="number" value={editForm.discount_amount} onChange={e => setEditForm(f => ({ ...f, discount_amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Pay Before Date</label>
                  <input type="date" value={editForm.pay_before_date} onChange={e => setEditForm(f => ({ ...f, pay_before_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
                <input value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Remarks</label>
                <input value={editForm.remarks} onChange={e => setEditForm(f => ({ ...f, remarks: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {editErr && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{editErr}</div>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditModal(null)} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleEditSave} disabled={editSaving} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>)}
    </div>
  )
}
