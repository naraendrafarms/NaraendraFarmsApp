import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import {
  Card, SectionHeader, Spinner, Badge, Select, DateInput
} from '@/components/ui'
import { AlertCircle, Search, Link2, X, CheckCircle2, Trash2, Pencil, Plus } from 'lucide-react'
import { AssignTaskButton } from '@/components/tasks/AssignTaskButton'
import { TaskBadge } from '@/components/tasks/TaskBadge'
import { postLedgerEntry, clearLedgerEntries } from '@/lib/ledgerSync'
import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d: string) => d ? d.split('-').reverse().join('/') : '—'
// TDS amount rounds to the nearest whole rupee, >=.5 rounds up (not 2
// decimals — .toFixed(2) also has float precision quirks, e.g. 2.005 can
// come out as 2.00, so round explicitly rather than relying on it).
const roundTds = (n: number) => Math.round(n + Number.EPSILON)

type PayRecord = {
  id: string
  vendor_name: string
  party_id: string | null
  invoice_no: string | null
  po_no: string | null
  invoice_date: string | null
  grn_no: string | null
  grn_date: string | null
  invoice_amount: number
  tds_pct: number | null
  tds_amount: number | null
  net_payable: number | null
  paid_amount: number | null
  discount_amount: number | null
  pay_before_date: string | null
  paid_date: string | null
  credit_limit: number | null
  payment_status: string
  category: string | null
  account_type: string | null
  utr_no: string | null
  cheque_no: string | null
  remarks: string | null
  bank_account_id: string | null
  is_opening: boolean | null
}

type PayModal = {
  record: PayRecord
  paidAmt: string
  paidDate: string
  mode: string
  ref: string
  remarks: string
  bankAccountId: string
  advanceId: string
}

import toast from 'react-hot-toast'

// ── Main Page ─────────────────────────────────────────────────────────────────

export const PendingPaymentsPage: React.FC = () => {
  const qc = useQueryClient()
  const [vendorFilter, setVendorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('unpaid')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<PayModal | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [editModal, setEditModal] = useState<PayRecord | 'new' | null>(null)
  const blankEditForm = () => ({
    vendor_name: '', party_id: '', invoice_no: '', po_no: '', grn_no: '', invoice_date: today(), grn_date: '',
    invoice_amount: '', tds_pct: '', tds_amount: '', discount_amount: '', pay_before_date: '', paid_date: '', credit_limit: '',
    payment_status: 'Pending', account_type: 'NEFT', utr_no: '', cheque_no: '', category: '', remarks: '', bank_account_id: '',
  })
  const [editForm, setEditForm] = useState(blankEditForm())
  const [editSaving, setEditSaving] = useState(false)
  const [editErr, setEditErr] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkPayForm, setBulkPayForm] = useState({ mode: 'NEFT', ref: '', date: today(), bankAccountId: '' })
  const [bulkPaying, setBulkPaying] = useState(false)

  const { data: records, isLoading } = useQuery({
    queryKey: ['pending_payments_page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_payments')
        .select('id,vendor_name,party_id,invoice_no,po_no,invoice_date,grn_no,grn_date,invoice_amount,tds_pct,tds_amount,net_payable,paid_amount,discount_amount,pay_before_date,paid_date,credit_limit,payment_status,category,account_type,utr_no,cheque_no,remarks,bank_account_id,is_opening')
        .order('grn_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as PayRecord[]
    }
  })

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank_accounts_list'],
    queryFn: async () => {
      const { data } = await supabase.from('bank_accounts').select('id,account_name,bank_name').order('account_name')
      return data ?? []
    }
  })

  const { data: parties } = useQuery({
    queryKey: ['parties_supp'],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id,name,tds_pct_default').in('type', ['supplier', 'both']).order('name')
      return data ?? []
    }
  })
  const partyOptions = (parties ?? []).map((p: any) => ({ value: p.id, label: p.name }))
  const TDS_PCT_OPTIONS = [
    { value: '0', label: '0% (None)' },
    { value: '0.1', label: '0.1% (Goods)' },
    { value: '1', label: '1% (Contractor)' },
    { value: '2', label: '2% (Contractor)' },
    { value: '5', label: '5% (Rent/Commission)' },
    { value: '10', label: '10% (Professional)' },
  ]

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
  const weekAhead = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
  const dueThisWeek = unpaid.filter(r => r.pay_before_date && r.pay_before_date >= todayStr && r.pay_before_date <= weekAhead)

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
    setModal({ record: r, paidAmt: fmt(getBalance(r)).replace(/,/g,''), paidDate: todayStr, mode: 'NEFT', ref: '', remarks: '', bankAccountId: '', advanceId: '' })
    setErr('')
  }

  // Available vendor advances for the bill currently open in the Pay modal
  // — only fetched once the modal is open and its vendor is known.
  const { data: vendorAdvancesForModal } = useQuery({
    queryKey: ['vendor_advances_for_pay', modal?.record.party_id],
    enabled: !!modal?.record.party_id,
    queryFn: async () => {
      const { data } = await supabase.from('vendor_advances')
        .select('id,advance_date,amount,amount_used,reference_no')
        .eq('party_id', modal!.record.party_id!)
        .order('advance_date')
      return (data ?? []).filter((a: any) => (a.amount - a.amount_used) > 0.01)
    }
  })

  const handlePay = async () => {
    if (!modal) return
    const amt = parseFloat(modal.paidAmt)
    if (!amt || amt <= 0) { setErr('Enter valid amount'); return }
    const isAdvance = modal.mode === 'Advance'
    const isOpeningAdj = modal.mode === 'Opening Adjustment'
    if (!isAdvance && !isOpeningAdj && modal.mode.toLowerCase() !== 'cash' && !modal.bankAccountId) { setErr('Select which bank account this is paid from'); return }
    if (isAdvance && !modal.advanceId) { setErr('Select which advance to adjust against this bill'); return }
    setSaving(true); setErr('')
    try {
      const newPaid = (modal.record.paid_amount ?? 0) + amt
      const bal = getBalance(modal.record) - amt
      const newStatus = bal <= 0.01 ? 'Paid' : modal.record.payment_status

      if (isOpeningAdj) {
        const { error } = await supabase.from('pending_payments').update({
          paid_amount: newPaid,
          paid_date: modal.paidDate,
          account_type: 'Opening Adjustment',
          remarks: modal.remarks || modal.record.remarks || null,
          payment_status: newStatus,
          bank_account_id: null,
        }).eq('id', modal.record.id)
        if (error) throw error
        // Deliberately no postLedgerEntry — an opening balance being cleared
        // isn't a new cash movement, so Cash Book/Bank Ledger stay untouched.
      } else if (isAdvance) {
        const advance = (vendorAdvancesForModal ?? []).find((a: any) => a.id === modal.advanceId)
        if (!advance) throw new Error('Advance not found')
        const available = advance.amount - advance.amount_used
        if (amt > available + 0.01) throw new Error(`Only ₹${fmt(available)} available on this advance`)
        const { error } = await supabase.from('pending_payments').update({
          paid_amount: newPaid,
          paid_date: modal.paidDate,
          account_type: 'Advance',
          transaction_ref: advance.reference_no || null,
          remarks: modal.remarks || modal.record.remarks || null,
          payment_status: newStatus,
          bank_account_id: null,
          advance_adjusted: amt,
          vendor_advance_id: advance.id,
        }).eq('id', modal.record.id)
        if (error) throw error
        // Adjusting an advance against a bill is NOT a new cash movement — the
        // money already left when the advance itself was paid (VendorAdvancesPage
        // posted that Cash Book/Bank entry already) — so no postLedgerEntry here.
        const { error: advErr } = await supabase.from('vendor_advances')
          .update({ amount_used: advance.amount_used + amt }).eq('id', advance.id)
        if (advErr) throw advErr
      } else {
        const { error } = await supabase.from('pending_payments').update({
          paid_amount: newPaid,
          paid_date: modal.paidDate,
          account_type: modal.mode,
          transaction_ref: modal.ref || null,
          remarks: modal.remarks || modal.record.remarks || null,
          payment_status: newStatus,
          bank_account_id: modal.mode.toLowerCase() !== 'cash' ? modal.bankAccountId : null,
        }).eq('id', modal.record.id)
        if (error) throw error
        // Every rupee paid here — partial or final — lands in Cash Book immediately.
        await postLedgerEntry({
          paymentId: modal.record.id, vendorName: modal.record.vendor_name,
          invoiceNo: modal.record.invoice_no, grnNo: modal.record.grn_no,
          amount: amt, mode: modal.mode, date: modal.paidDate, ref: modal.ref, remarks: modal.remarks,
          bankAccountId: modal.bankAccountId, partyId: modal.record.party_id,
        })
      }
      qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
      qc.invalidateQueries({ queryKey: ['pending_payments'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_tds'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_open'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      qc.invalidateQueries({ queryKey: ['bank_transactions'] })
      qc.invalidateQueries({ queryKey: ['vendor_advances'] })
      qc.invalidateQueries({ queryKey: ['vendor_advances_for_pay'] })
      setModal(null)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Pay N selected bills together as ONE real payment — mirrors the Bulk
  // Salary Payment pattern. Creates a SINGLE bank_transactions row for the
  // whole batch (not one per bill, which used to make Bank Ledger show N
  // lines for what was really one bank transfer) and tags every bill with
  // BANKTXN:<id> the same way the "Link N Bill(s)" bank-reconciliation flow
  // already does, so Unlink-style undo logic keeps working consistently.
  const handleBulkPay = async () => {
    const bills = (records ?? []).filter(r => selectedIds.has(r.id) && r.payment_status !== 'Paid')
    if (bills.length === 0) { toast.error('No unpaid bills selected'); return }
    const isOpeningAdj = bulkPayForm.mode === 'Opening Adjustment'
    if (!isOpeningAdj && bulkPayForm.mode.toLowerCase() !== 'cash' && !bulkPayForm.bankAccountId) { toast.error('Select which bank account this is paid from'); return }
    setBulkPaying(true)
    try {
      if (isOpeningAdj) {
        // No cash movement at all — every selected bill is an opening
        // balance being cleared, not a new real payment.
        for (const bill of bills) {
          const newPaid = (bill.paid_amount ?? 0) + getBalance(bill)
          const { error } = await supabase.from('pending_payments').update({
            paid_amount: newPaid, paid_date: bulkPayForm.date,
            account_type: 'Opening Adjustment', payment_status: 'Paid', bank_account_id: null,
          }).eq('id', bill.id)
          if (error) throw error
        }
        qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
        qc.invalidateQueries({ queryKey: ['pending_payments'] })
        qc.invalidateQueries({ queryKey: ['pending_payments_tds'] })
        qc.invalidateQueries({ queryKey: ['pending_payments_open'] })
        toast.success(`Marked ${bills.length} bill(s) Paid — no Cash Book/Bank Ledger entry posted`)
        setSelectedIds(new Set())
        setBulkPayForm({ mode: 'NEFT', ref: '', date: today(), bankAccountId: '' })
        return
      }
      const totalAmt = bills.reduce((s, r) => s + getBalance(r), 0)
      let tag: string | null = bulkPayForm.ref || null
      if (bulkPayForm.mode.toLowerCase() !== 'cash') {
        // party_id follows the same single-representative convention as
        // linked_payment_id above — bills[0]'s party, since a batch spanning
        // multiple vendors has no single "the" party to assign.
        const { data: txn, error: txnErr } = await supabase.from('bank_transactions').insert({
          bank_account_id: bulkPayForm.bankAccountId,
          txn_date: bulkPayForm.date,
          txn_type: 'Debit',
          category: 'Vendor Payment',
          reference_no: bulkPayForm.ref || null,
          description: `Vendor payment batch — ${bills.length} bill(s)`,
          amount: totalAmt,
          party_id: bills[0].party_id || null,
          linked_payment_id: bills[0].id,
        }).select('id').single()
        if (txnErr) throw txnErr
        tag = `BANKTXN:${txn.id}`
      }
      for (const bill of bills) {
        const balance = getBalance(bill)
        const newPaid = (bill.paid_amount ?? 0) + balance
        const { error } = await supabase.from('pending_payments').update({
          paid_amount: newPaid,
          paid_date: bulkPayForm.date,
          account_type: bulkPayForm.mode,
          transaction_ref: tag,
          payment_status: 'Paid',
          bank_account_id: bulkPayForm.mode.toLowerCase() !== 'cash' ? bulkPayForm.bankAccountId : null,
        }).eq('id', bill.id)
        if (error) throw error
        // bankAccountId intentionally NOT passed here — the one shared
        // bank_transactions row above already covers the whole batch, so
        // postLedgerEntry only needs to add each bill's Cash Book line.
        await postLedgerEntry({
          paymentId: bill.id, vendorName: bill.vendor_name, invoiceNo: bill.invoice_no, grnNo: bill.grn_no,
          amount: balance, mode: bulkPayForm.mode, date: bulkPayForm.date, ref: bulkPayForm.ref,
          remarks: `Bulk payment batch (${bills.length} bills)`, partyId: bill.party_id,
        })
      }
      qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
      qc.invalidateQueries({ queryKey: ['pending_payments'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_tds'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_open'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      qc.invalidateQueries({ queryKey: ['bank_transactions'] })
      toast.success(`Marked ${bills.length} bill(s) Paid`)
      setSelectedIds(new Set())
      setBulkPayForm({ mode: 'NEFT', ref: '', date: today(), bankAccountId: '' })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBulkPaying(false)
    }
  }

  const openAddNew = () => {
    setEditModal('new')
    setEditForm(blankEditForm())
    setEditErr('')
  }

  const openEdit = (r: PayRecord) => {
    setEditModal(r)
    setEditForm({
      vendor_name: r.vendor_name ?? '',
      party_id: r.party_id ?? '',
      invoice_no: r.invoice_no ?? '',
      po_no: r.po_no ?? '',
      grn_no: r.grn_no ?? '',
      invoice_date: r.invoice_date ?? today(),
      grn_date: r.grn_date ?? '',
      invoice_amount: r.invoice_amount != null ? String(r.invoice_amount) : '',
      tds_pct: r.tds_pct != null ? String(r.tds_pct) : '',
      tds_amount: r.tds_amount != null ? String(r.tds_amount) : '',
      discount_amount: r.discount_amount != null ? String(r.discount_amount) : '',
      pay_before_date: r.pay_before_date ?? '',
      paid_date: r.paid_date ?? (r.payment_status === 'Paid' ? today() : ''),
      credit_limit: r.credit_limit != null ? String(r.credit_limit) : '',
      payment_status: r.payment_status ?? 'Pending',
      account_type: r.account_type ?? 'NEFT',
      utr_no: r.utr_no ?? '',
      cheque_no: r.cheque_no ?? '',
      category: r.category ?? '',
      remarks: r.remarks ?? '',
      bank_account_id: r.bank_account_id ?? '',
    })
    setEditErr('')
  }

  const handleEditSave = async () => {
    if (!editModal) return
    if (!editForm.vendor_name.trim()) { setEditErr('Vendor name is required'); return }
    if (editForm.payment_status === 'Paid' && editForm.account_type.toLowerCase() !== 'cash' && !editForm.bank_account_id) {
      setEditErr('Select which bank account this is paid from'); return
    }
    setEditSaving(true); setEditErr('')
    try {
      const isNew = editModal === 'new'
      const invAmt = parseFloat(editForm.invoice_amount) || 0
      // TDS % and TDS amount stay in sync so every report (TDS Payable, Purchase
      // Payments) that filters/groups by rate still finds bills entered here.
      const pctEntered = editForm.tds_pct !== ''
      const amtEntered = editForm.tds_amount !== ''
      let tdsPct: number | null = pctEntered ? parseFloat(editForm.tds_pct) || 0 : null
      let tds: number | null = amtEntered ? parseFloat(editForm.tds_amount) || 0 : null
      if (pctEntered && !amtEntered) tds = roundTds(invAmt * (tdsPct ?? 0) / 100)
      else if (amtEntered && !pctEntered && invAmt > 0) tdsPct = Math.round((tds ?? 0) / invAmt * 10000) / 100
      else if (pctEntered && amtEntered) tds = roundTds(invAmt * (tdsPct ?? 0) / 100) // % wins if both given
      const netPayable = invAmt - (tds ?? 0)
      const payload = {
        vendor_name: editForm.vendor_name.trim(),
        party_id: editForm.party_id || null,
        invoice_no: editForm.invoice_no || null,
        po_no: editForm.po_no || null,
        grn_no: editForm.grn_no || null,
        invoice_date: editForm.invoice_date || null,
        grn_date: editForm.grn_date || null,
        invoice_amount: invAmt,
        tds_pct: tdsPct,
        tds_amount: tds,
        net_payable: netPayable,
        discount_amount: editForm.discount_amount === '' ? null : parseFloat(editForm.discount_amount) || 0,
        pay_before_date: editForm.pay_before_date || null,
        paid_date: editForm.payment_status === 'Paid' ? (editForm.paid_date || todayStr) : null,
        credit_limit: editForm.credit_limit === '' ? null : parseInt(editForm.credit_limit) || null,
        payment_status: editForm.payment_status,
        account_type: editForm.account_type || null,
        utr_no: editForm.utr_no || null,
        cheque_no: editForm.cheque_no || null,
        category: editForm.category || null,
        remarks: editForm.remarks || null,
        bank_account_id: (editForm.account_type || '').toLowerCase() !== 'cash' ? (editForm.bank_account_id || null) : null,
        // Status "Paid" is a flag; the Paid column/Balance read paid_amount.
        // The edit path used to flip only the flag, leaving Paid blank and a
        // stale Balance on the list. Record the settled amount too.
        //
        // The reverse direction had the matching bug: switching status AWAY
        // from Paid (e.g. reverting a bank-import auto-match) correctly
        // cleared the Cash Book/Bank Ledger entry below, but never reset
        // paid_amount here — a plain object spread with {} contributes no
        // key at all, so Supabase's partial .update() left the old (full)
        // paid_amount sitting in the row untouched, silently zeroing the
        // bill's balance and hiding the Pay button forever.
        //
        // Only reset it on an actual Paid -> non-Paid transition, never
        // blanket-zero whenever the dropdown just happens to read
        // Pending/HOLD — a bill can legitimately sit at Pending with a real
        // partial paid_amount from the Pay screen, and re-saving this Edit
        // form without touching Status must not wipe that out.
        ...(editForm.payment_status === 'Paid'
          ? { paid_amount: Math.max(0, netPayable - (parseFloat(editForm.discount_amount) || 0)) }
          : (!isNew && editModal.payment_status === 'Paid' ? { paid_amount: 0 } : {})),
      }
      let savedId: string
      if (isNew) {
        const { data, error } = await supabase.from('pending_payments').insert(payload).select('id').single()
        if (error) throw error
        savedId = data.id
      } else {
        const { error } = await supabase.from('pending_payments').update(payload).eq('id', editModal.id)
        if (error) throw error
        savedId = editModal.id
      }
      // Keep Cash Book / Bank Ledger in sync with this save — this is the
      // ONLY other place (besides the Pay button) that can flip a bill to Paid,
      // so it must post/reverse the same ledger entry. Re-sync (clear + repost)
      // whenever the bill IS Paid after this save, not just on a fresh
      // Pending→Paid transition — otherwise editing payment mode/bank
      // account/UTR on an already-Paid bill silently leaves the ledger stale
      // (e.g. bank details filled in after the bill was first marked Paid).
      const oldStatus = isNew ? null : editModal.payment_status
      const newStatus = editForm.payment_status
      if (newStatus === 'Paid') {
        if (oldStatus === 'Paid') await clearLedgerEntries(savedId)
        const amount = isNew || oldStatus === 'Paid' ? netPayable : Math.max(0, getBalance(editModal))
        await postLedgerEntry({
          paymentId: savedId, vendorName: payload.vendor_name, invoiceNo: payload.invoice_no, grnNo: payload.grn_no,
          amount, mode: payload.account_type ?? 'NEFT', date: payload.paid_date || todayStr,
          ref: payload.utr_no || payload.cheque_no, remarks: payload.remarks, bankAccountId: payload.bank_account_id,
          partyId: payload.party_id,
        })
      } else if (oldStatus === 'Paid' && newStatus !== 'Paid') {
        await clearLedgerEntries(savedId)
      }
      qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
      qc.invalidateQueries({ queryKey: ['pending_payments'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_tds'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_open'] })
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
      qc.invalidateQueries({ queryKey: ['pending_payments'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_tds'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_open'] })
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
      ['Vendor', 'Category', 'Invoice No', 'GRN No', 'GRN Date', 'Invoice Amt', 'TDS', 'Net Payable', 'Paid', 'Discount', 'Balance', 'Due Date', 'Paid Date', 'Status'],
      ...filtered.map(r => [
        r.vendor_name, r.category ?? '', r.invoice_no ?? '', r.grn_no ?? '',
        r.grn_date ? fmtDate(r.grn_date) : '',
        r.invoice_amount, r.tds_amount ?? 0, r.net_payable ?? r.invoice_amount,
        r.paid_amount ?? 0, r.discount_amount ?? 0, getBalance(r),
        r.pay_before_date ? fmtDate(r.pay_before_date) : '',
        r.paid_date ? fmtDate(r.paid_date) : '', r.payment_status,
      ])
    ])
    ws['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Pending Payments')
    XLSX.writeFile(wb, `pending_payments_${todayStr}.xlsx`)
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Pending Payments"
        subtitle="Vendor bills received (GRN done) — outstanding amounts to pay. Reconciling against your real bank statement now happens in Bank Ledger → Link to Bills."
        action={
          <div className="flex gap-2">
            <button onClick={openAddNew} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={14} /> Add Bill
            </button>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              <Download size={14} /> Export Excel
            </button>
          </div>
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

      {/* Bulk pay bar — pay N selected bills together as one real payment */}
      {selectedIds.size > 0 && (() => {
        const selectedUnpaid = (records ?? []).filter(r => selectedIds.has(r.id) && r.payment_status !== 'Paid')
        const selectedTotal = selectedUnpaid.reduce((s, r) => s + getBalance(r), 0)
        if (selectedUnpaid.length === 0) return null
        const allSelectedAreOpening = selectedUnpaid.every(r => r.is_opening)
        return (
          <div className="flex flex-wrap items-end gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Mode</span>
              <select value={bulkPayForm.mode} onChange={e => setBulkPayForm(f => ({ ...f, mode: e.target.value }))}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                <option>NEFT</option><option>RTGS</option><option>IMPS</option><option>Cheque</option><option>UPI</option><option>Cash</option>
                {allSelectedAreOpening && <option value="Opening Adjustment">Opening Adjustment (no bank movement)</option>}
              </select>
              {bulkPayForm.mode === 'Opening Adjustment' && (
                <p className="text-xs text-amber-600 max-w-xs">Marks these Paid without touching Cash Book/Bank Ledger — use only when already settled before this app was in use.</p>
              )}
              {!allSelectedAreOpening && selectedUnpaid.some(r => r.is_opening) && (
                <p className="text-xs text-gray-400 max-w-xs">An opening-balance bill is mixed in with regular bills — select opening bills alone to use Opening Adjustment mode.</p>
              )}
            </div>
            {bulkPayForm.mode.toLowerCase() !== 'cash' && bulkPayForm.mode !== 'Opening Adjustment' && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Bank Account</span>
                <select value={bulkPayForm.bankAccountId} onChange={e => setBulkPayForm(f => ({ ...f, bankAccountId: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm min-w-[160px]">
                  <option value="">Select account…</option>
                  {(bankAccounts ?? []).map((a: any) => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Reference / UTR</span>
              <input value={bulkPayForm.ref} onChange={e => setBulkPayForm(f => ({ ...f, ref: e.target.value }))}
                placeholder="Shared reference" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Date</span>
              <input type="date" value={bulkPayForm.date} onChange={e => setBulkPayForm(f => ({ ...f, date: e.target.value }))}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
            </div>
            <div className="flex-1" />
            <span className="text-blue-700 font-medium whitespace-nowrap">{selectedUnpaid.length} bill(s) · ₹{fmt(selectedTotal)}</span>
            <button
              onClick={handleBulkPay}
              disabled={bulkPaying}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> {bulkPaying ? 'Paying…' : `Mark ${selectedUnpaid.length} as Paid`}
            </button>
          </div>
        )
      })()}

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
                <th className="px-2 py-2">Invoice No</th>
                <th className="px-2 py-2">Invoice Date</th>
                <th className="px-2 py-2">GRN No</th>
                <th className="px-2 py-2">GRN Date</th>
                <th className="px-2 py-2 text-right">Invoice Amt</th>
                <th className="px-2 py-2 text-right">TDS</th>
                <th className="px-2 py-2 text-right">Net Payable</th>
                <th className="px-2 py-2 text-right">Paid</th>
                <th className="px-2 py-2 text-right font-semibold">Balance</th>
                <th className="px-2 py-2">Due Date</th>
                <th className="px-2 py-2">Paid Date</th>
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
                    <td className="px-3 py-2 font-medium text-gray-800 max-w-[160px] truncate">
                      <div className="flex items-center gap-1.5">
                        {r.vendor_name}
                        <TaskBadge linkedTable="pending_payments" linkedId={r.id} />
                      </div>
                    </td>
                    <td className="px-2 py-2 text-gray-500">{r.category ?? '—'}</td>
                    <td className="px-2 py-2 text-gray-700">{r.invoice_no ?? '—'}</td>
                    <td className="px-2 py-2 text-gray-600">{r.invoice_date ? fmtDate(r.invoice_date) : '—'}</td>
                    <td className="px-2 py-2 text-gray-700">{r.grn_no ?? '—'}</td>
                    <td className="px-2 py-2 text-gray-600">{r.grn_date ? fmtDate(r.grn_date) : '—'}</td>
                    <td className="px-2 py-2 text-right">{fmt(r.invoice_amount ?? 0)}</td>
                    <td className="px-2 py-2 text-right text-orange-600">{r.tds_amount ? fmt(r.tds_amount) : '—'}</td>
                    <td className="px-2 py-2 text-right">{fmt(r.net_payable ?? r.invoice_amount ?? 0)}</td>
                    <td className="px-2 py-2 text-right text-green-700">{r.paid_amount ? fmt(r.paid_amount) : '—'}</td>
                    <td className={`px-2 py-2 text-right font-semibold ${bal > 0 ? (isOverdue ? 'text-red-700' : 'text-gray-800') : 'text-green-600'}`}>
                      {bal > 0 ? fmt(bal) : '✓'}
                    </td>
                    <td className="px-2 py-2 text-gray-600">{r.pay_before_date ? fmtDate(r.pay_before_date) : '—'}</td>
                    <td className="px-2 py-2 text-gray-600">{r.paid_date ? fmtDate(r.paid_date) : '—'}</td>
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
                        <AssignTaskButton small label="Task"
                          linkedTable="pending_payments" linkedId={r.id}
                          linkedLabel={`Bill: ${r.vendor_name} — ${r.invoice_no ?? r.grn_no ?? ''}`}
                          defaultTitle={`Follow up: ${r.vendor_name} — ${r.invoice_no ?? r.grn_no ?? ''}`}
                        />
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
                <select value={modal.mode} onChange={e => setModal(m => m ? { ...m, mode: e.target.value, advanceId: '' } : m)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  {['NEFT', 'RTGS', 'IMPS', 'Cheque', 'Cash', 'UPI'].map(v => <option key={v}>{v}</option>)}
                  {(vendorAdvancesForModal ?? []).length > 0 && <option value="Advance">Advance (adjust against existing balance)</option>}
                  {modal.record.is_opening && <option value="Opening Adjustment">Opening Adjustment (no bank movement)</option>}
                </select>
                {modal.mode === 'Opening Adjustment' && (
                  <p className="text-xs text-amber-600 mt-1">Marks this opening-balance bill Paid without touching Cash Book or Bank Ledger — use this only when the balance was already settled before this app was in use.</p>
                )}
              </div>
              {modal.mode === 'Advance' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Which advance to adjust</label>
                  <select value={modal.advanceId} onChange={e => setModal(m => m ? { ...m, advanceId: e.target.value } : m)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Select advance —</option>
                    {(vendorAdvancesForModal ?? []).map((a: any) => (
                      <option key={a.id} value={a.id}>{fmtDate(a.advance_date)} — Available ₹{fmt(a.amount - a.amount_used)}{a.reference_no ? ` (${a.reference_no})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}
              {modal.mode !== 'Advance' && modal.mode.toLowerCase() !== 'cash' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Paid From Bank Account</label>
                  <select value={modal.bankAccountId} onChange={e => setModal(m => m ? { ...m, bankAccountId: e.target.value } : m)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Select account —</option>
                    {(bankAccounts ?? []).map((b: any) => (
                      <option key={b.id} value={b.id}>{b.account_name ? `${b.account_name} — ` : ''}{b.bank_name}</option>
                    ))}
                  </select>
                </div>
              )}
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
            <h3 className="font-bold text-gray-900 text-lg">{editModal === 'new' ? 'Add Bill' : 'Edit Bill'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Vendor (Supplier)</label>
                <Select label="" placeholder="Select Supplier — add new ones in Purchase > Suppliers" options={partyOptions}
                  value={editForm.party_id} onChange={e => {
                    const p = (parties ?? []).find((x: any) => x.id === e.target.value)
                    setEditForm(f => ({
                      ...f, party_id: e.target.value, vendor_name: p?.name ?? f.vendor_name,
                      // Auto-fill the vendor's default TDS rate on a new bill only — never
                      // overwrite a rate already set on an existing bill.
                      tds_pct: (editModal === 'new' && p?.tds_pct_default != null) ? String(p.tds_pct_default) : f.tds_pct,
                    }))
                  }} />
                {!editForm.party_id && (
                  <input value={editForm.vendor_name} onChange={e => setEditForm(f => ({ ...f, vendor_name: e.target.value }))}
                    placeholder="Or type vendor name if not in Suppliers list"
                    className="w-full mt-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Invoice No</label>
                  <input value={editForm.invoice_no} onChange={e => setEditForm(f => ({ ...f, invoice_no: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Invoice Date</label>
                  <input type="date" value={editForm.invoice_date} onChange={e => setEditForm(f => ({ ...f, invoice_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">PO No</label>
                  <input value={editForm.po_no} onChange={e => setEditForm(f => ({ ...f, po_no: e.target.value }))}
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
                  <label className="text-xs font-medium text-gray-600 block mb-1">GRN Date</label>
                  <input type="date" value={editForm.grn_date} onChange={e => setEditForm(f => ({ ...f, grn_date: e.target.value }))}
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
                  <label className="text-xs font-medium text-gray-600 block mb-1">TDS %</label>
                  <select value={TDS_PCT_OPTIONS.some(o => o.value === editForm.tds_pct) ? editForm.tds_pct : 'custom'}
                    onChange={e => {
                      const pct = e.target.value === 'custom' ? '' : e.target.value
                      const invAmt = parseFloat(editForm.invoice_amount) || 0
                      const autoAmt = pct !== '' ? String(roundTds(invAmt * (parseFloat(pct) || 0) / 100)) : ''
                      setEditForm(f => ({ ...f, tds_pct: pct, tds_amount: autoAmt }))
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    {TDS_PCT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    <option value="custom">Custom %…</option>
                  </select>
                  {!TDS_PCT_OPTIONS.some(o => o.value === editForm.tds_pct) && (
                    <input type="number" value={editForm.tds_pct}
                      onChange={e => {
                        const pct = e.target.value
                        const invAmt = parseFloat(editForm.invoice_amount) || 0
                        const autoAmt = pct !== '' ? String(roundTds(invAmt * (parseFloat(pct) || 0) / 100)) : ''
                        setEditForm(f => ({ ...f, tds_pct: pct, tds_amount: autoAmt }))
                      }}
                      placeholder="e.g. 3.75" className="w-full mt-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">TDS Amount</label>
                  <input type="number" value={editForm.tds_amount} onChange={e => setEditForm(f => ({ ...f, tds_amount: e.target.value }))}
                    placeholder="Auto from % if left blank" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Discount</label>
                  <input type="number" value={editForm.discount_amount} onChange={e => setEditForm(f => ({ ...f, discount_amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Credit Days</label>
                  <input type="number" value={editForm.credit_limit}
                    placeholder="From PO if linked, else set manually"
                    onChange={e => {
                      const days = e.target.value
                      const baseDate = editForm.grn_date || editForm.invoice_date
                      let pay = editForm.pay_before_date
                      if (days !== '' && baseDate) {
                        // Local getters, not toISOString() (UTC) — the latter lands a day early in IST
                        const d = new Date(baseDate + 'T00:00:00'); d.setDate(d.getDate() + (parseInt(days) || 0))
                        pay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                      }
                      setEditForm(f => ({ ...f, credit_limit: days, pay_before_date: pay }))
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Pay Before Date</label>
                  <input type="date" value={editForm.pay_before_date} onChange={e => setEditForm(f => ({ ...f, pay_before_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                  <select value={editForm.payment_status} onChange={e => setEditForm(f => ({ ...f, payment_status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    {['Pending', 'Paid', 'HOLD'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              {editForm.payment_status === 'Paid' && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 space-y-3">
                  <p className="text-xs text-blue-700 font-medium">Marking Paid here posts straight to Cash Book — fill in how it was paid.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Payment Date (when it actually left the account)</label>
                      <DateInput value={editForm.paid_date} onChange={e => setEditForm(f => ({ ...f, paid_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Payment Mode</label>
                      <select value={editForm.account_type} onChange={e => setEditForm(f => ({ ...f, account_type: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                        {['NEFT', 'RTGS', 'IMPS', 'Cheque', 'Cash', 'UPI'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">UTR / Cheque No</label>
                      <input value={editForm.utr_no || editForm.cheque_no} onChange={e => setEditForm(f => ({ ...f, utr_no: e.target.value, cheque_no: '' }))}
                        placeholder="Optional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    {editForm.account_type.toLowerCase() !== 'cash' && (
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-600 block mb-1">Paid From Bank Account</label>
                        <select value={editForm.bank_account_id} onChange={e => setEditForm(f => ({ ...f, bank_account_id: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">— Select account —</option>
                          {(bankAccounts ?? []).map((b: any) => (
                            <option key={b.id} value={b.id}>{b.account_name ? `${b.account_name} — ` : ''}{b.bank_name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
    </div>
  )
}
