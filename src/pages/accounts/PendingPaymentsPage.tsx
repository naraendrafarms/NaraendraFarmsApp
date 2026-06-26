import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import {
  Card, SectionHeader, Spinner, Badge, Select
} from '@/components/ui'
import { AlertCircle, Clock, CheckCircle, Search } from 'lucide-react'
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

export const PendingPaymentsPage: React.FC = () => {
  const qc = useQueryClient()
  const [vendorFilter, setVendorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('unpaid')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<PayModal | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

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
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
            <Download size={14} /> Export Excel
          </button>
        }
      />

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

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-left">
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
                      {r.payment_status !== 'Paid' && bal > 0 && (
                        <button onClick={() => openPayModal(r)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap">
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="text-center py-10 text-gray-400">No records found</td></tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold text-xs">
                  <td colSpan={4} className="px-3 py-2">{filtered.length} bills</td>
                  <td className="px-2 py-2 text-right">{fmt(filtered.reduce((s, r) => s + (r.invoice_amount ?? 0), 0))}</td>
                  <td className="px-2 py-2 text-right text-orange-600">{fmt(filtered.reduce((s, r) => s + (r.tds_amount ?? 0), 0))}</td>
                  <td className="px-2 py-2 text-right">{fmt(filtered.reduce((s, r) => s + (r.net_payable ?? r.invoice_amount ?? 0), 0))}</td>
                  <td className="px-2 py-2 text-right text-green-700">{fmt(filtered.reduce((s, r) => s + (r.paid_amount ?? 0), 0))}</td>
                  <td className="px-2 py-2 text-right text-red-700">{fmt(filtered.reduce((s, r) => s + getBalance(r), 0))}</td>
                  <td colSpan={3}></td>
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
    </div>
  )
}
