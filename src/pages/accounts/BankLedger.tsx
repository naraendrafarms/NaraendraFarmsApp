import React, { useMemo, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, today, FY_OPTIONS, currentFY, fyRange } from '@/lib/utils'
import { Card, CardHeader, Button, Select, Input, Modal, DateInput, Spinner, EmptyState, SearchableSelect } from '@/components/ui'
import { Plus, Trash2, Download, Upload, CheckCircle2, AlertCircle, Link2, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { ifscError, accountNoError } from '@/lib/validators'
import { postLedgerEntry, clearLedgerEntries, toCbMode } from '@/lib/ledgerSync'

const EMPTY_FORM = {
  txn_date: today(),
  txn_type: 'Credit',
  category: '',
  reference_no: '',
  description: '',
  amount: '',
  bank_account_id: '',
  party_id: '',
  settle_payment_id: '',
  settle_receivable_id: '',
}

const EMPTY_ACCOUNT_FORM = {
  bank_name: '',
  account_name: '',
  account_no: '',
  ifsc: '',
  branch: '',
  opening_balance: '',
  is_active: true,
}

// ── Kotak CSV parser ─────────────────────────────────────────────────────────

type ParsedRow = {
  value_date: string      // YYYY-MM-DD
  description: string
  reference: string
  amount: number
  txn_type: 'Debit' | 'Credit'
  statement_balance: number
  category: string
}

function parseIndianNumber(s: string): number {
  return parseFloat((s ?? '').replace(/,/g, '').trim()) || 0
}

function parseDDMMYYYY(s: string): string {
  // "15-06-2026" → "2026-06-15"
  const parts = (s ?? '').trim().split('-')
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return ''
}

function autoCategory(desc: string, ref: string, txnType: 'Debit' | 'Credit'): string {
  const text = `${desc} ${ref}`.toUpperCase()
  if (text.includes('SALARY') || text.includes('PAYROLL')) return 'Salary'
  if (text.includes('ELECTRICITY') || text.includes('MSEDCL') || text.includes('TNEB') || text.includes('BESCOM')) return 'Electricity'
  if (text.includes('ATM') && txnType === 'Debit') return 'Cash Withdrawal'
  if ((text.includes('BANK CHARGES') || text.includes('ANNUAL FEE') || text.includes('SERVICE CHARGE') || text.includes('GST ON')) && txnType === 'Debit') return 'Bank Charges'
  if (txnType === 'Debit' && (text.includes('FCM') || text.includes('CMS') || text.includes('NEFT') || text.includes('RTGS') || text.includes('IMPS'))) return 'Vendor Payment'
  if (txnType === 'Credit') return 'Customer Receipt'
  return ''
}

function parseKotakCSV(text: string): ParsedRow[] {
  const lines = text.split('\n').map(l => l.replace(/\r/g, ''))

  // Find the header row (contains "Transaction Date" or "Value Date")
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('value date') || lines[i].toLowerCase().includes('transaction date')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) throw new Error('Could not find header row in CSV. Expected a row with "Value Date" or "Transaction Date".')

  const rows: ParsedRow[] = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Stop at closing balance row
    if (line.toLowerCase().includes('closing balance') || line.toLowerCase().startsWith('opening balance')) continue

    // Split CSV respecting quoted fields
    const cols = splitCSV(line)
    if (cols.length < 6) continue

    // Col layout (Kotak CC statement): 0=Sl, 1=TxnDate, 2=ValueDate, 3=Description, 4=Reference, 5=Amount, 6=Dr/Cr, 7=Balance
    // But some Kotak formats: 0=TxnDate, 1=ValueDate, 2=Description, 3=Reference, 4=Amount, 5=Dr/Cr, 6=Balance
    // Detect by checking if col[0] is a number (Sl No) or a date
    let offset = 0
    if (/^\d+$/.test(cols[0].trim())) offset = 1 // skip Sl No column

    const valueDate = parseDDMMYYYY(cols[offset + 1]?.trim() || cols[offset]?.trim())
    const description = cols[offset + 2]?.trim() ?? ''
    const reference = cols[offset + 3]?.trim() ?? ''
    const amountStr = cols[offset + 4]?.trim() ?? ''
    const drCr = cols[offset + 5]?.trim().toUpperCase() ?? ''
    const balanceStr = cols[offset + 6]?.trim() ?? ''

    if (!valueDate || !amountStr) continue

    const amount = parseIndianNumber(amountStr)
    if (amount <= 0) continue

    const txnType: 'Debit' | 'Credit' = drCr === 'DR' || drCr === 'DEBIT' ? 'Debit' : 'Credit'
    const statement_balance = parseIndianNumber(balanceStr)
    const category = autoCategory(description, reference, txnType)

    rows.push({ value_date: valueDate, description, reference, amount, txn_type: txnType, statement_balance, category })
  }
  return rows
}

function splitCSV(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

// ── Link to Bills (bank-statement reconciliation) ───────────────────────────
// Moved here from Pending Payments so the whole external-payment workflow —
// import statement, see what's unmatched, link it to the bill(s) it paid —
// lives on ONE page instead of being split across Bank Ledger (import) and
// Pending Payments (linking). Pending Payments now only tracks what's owed.

type WaitingTxn = {
  id: string
  txn_date: string
  description: string | null
  reference_no: string | null
  amount: number
  category: string | null
  statement_balance: number | null
}

const LinkToBills: React.FC = () => {
  const qc = useQueryClient()
  const [linkModal, setLinkModal] = useState<WaitingTxn | null>(null)
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set())
  const [billSearch, setBillSearch] = useState('')
  const [linking, setLinking] = useState(false)
  const [selectedTxnIds, setSelectedTxnIds] = useState<Set<string>>(new Set())
  const [bulkActing, setBulkActing] = useState(false)

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

  const toggleTxn = (id: string) => setSelectedTxnIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleAllTxns = () => {
    if (selectedTxnIds.size === (waitingTxns ?? []).length) setSelectedTxnIds(new Set())
    else setSelectedTxnIds(new Set((waitingTxns ?? []).map((t: any) => t.id)))
  }

  const handleBulkIgnore = async () => {
    if (selectedTxnIds.size === 0) return
    setBulkActing(true)
    try {
      const { error } = await supabase.from('bank_transactions')
        .update({ match_status: 'ignored' }).in('id', Array.from(selectedTxnIds))
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['bank_txn_waiting'] })
      toast.success(`Ignored ${selectedTxnIds.size} transaction(s)`)
      setSelectedTxnIds(new Set())
    } catch (e: any) { toast.error(e.message) }
    finally { setBulkActing(false) }
  }

  const handleBulkDeleteTxns = async () => {
    if (selectedTxnIds.size === 0) return
    if (!confirm(`Permanently delete ${selectedTxnIds.size} imported transaction(s)? This cannot be undone.`)) return
    setBulkActing(true)
    try {
      // Still-waiting transactions were never linked to a bill, so there's no
      // pending_payments/cash_book cleanup needed — this is a straight delete.
      const { error } = await supabase.from('bank_transactions')
        .delete().in('id', Array.from(selectedTxnIds))
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['bank_txn_waiting'] })
      toast.success(`Deleted ${selectedTxnIds.size} transaction(s)`)
      setSelectedTxnIds(new Set())
    } catch (e: any) { toast.error(e.message) }
    finally { setBulkActing(false) }
  }

  const toggleBill = (id: string) => setSelectedPaymentIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const selectedBills = (openPayments ?? []).filter((p: any) => selectedPaymentIds.has(p.id))
  const selectedTotal = selectedBills.reduce((s: number, p: any) => s + getBalance(p), 0)

  const handleLink = async () => {
    if (!linkModal || selectedPaymentIds.size === 0) return
    setLinking(true)
    try {
      const ids = Array.from(selectedPaymentIds)
      // Tag every paid-off bill with this bank transaction so a multi-bill link can be undone together
      const tag = `BANKTXN:${linkModal.id}`
      for (const id of ids) {
        const payment = (openPayments ?? []).find((p: any) => p.id === id)
        if (!payment) continue
        const balance = getBalance(payment)
        await supabase.from('pending_payments').update({
          paid_amount: (payment.paid_amount ?? 0) + balance,
          paid_date: linkModal.txn_date,
          payment_status: 'Paid',
          transaction_ref: tag,
        }).eq('id', id)
        // Reconciled bank debit = a real payment — post it to Cash Book too, so
        // this ledger stays the single source of truth regardless of which
        // action (Pay / Edit / Bank Link) settled the bill.
        await postLedgerEntry({
          paymentId: id, vendorName: payment.vendor_name, invoiceNo: payment.invoice_no, grnNo: payment.grn_no,
          amount: balance, mode: 'NEFT', date: linkModal.txn_date, ref: linkModal.reference_no,
          remarks: `Bank-reconciled: ${linkModal.description ?? ''}`,
        })
      }
      // Link the bank transaction (linked_payment_id = first bill; tag holds the full set)
      await supabase.from('bank_transactions').update({
        match_status: 'manually_matched',
        linked_payment_id: ids[0],
      }).eq('id', linkModal.id)

      qc.invalidateQueries({ queryKey: ['bank_txn_waiting'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
      qc.invalidateQueries({ queryKey: ['pending_payments'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_tds'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_open'] })
      qc.invalidateQueries({ queryKey: ['bank_txn_matched'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      setLinkModal(null)
      setSelectedPaymentIds(new Set())
      setBillSearch('')
      toast.success(`Linked ${ids.length} bill(s) — marked paid`)
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
      // Find every bill this bank transaction settled — tagged set (multi-bill
      // link) plus the single linked_payment_id (auto-matched / legacy) — so
      // their Cash Book entries can be removed together with the payment revert.
      const { data: tagged } = await supabase.from('pending_payments')
        .select('id').eq('transaction_ref', `BANKTXN:${t.id}`)
      const idsToRevert = new Set((tagged ?? []).map((r: any) => r.id))
      if (t.linked_payment_id) idsToRevert.add(t.linked_payment_id)

      await supabase.from('pending_payments').update({
        payment_status: 'Pending', paid_amount: 0, paid_date: null, transaction_ref: null,
      }).eq('transaction_ref', `BANKTXN:${t.id}`)
      if (t.linked_payment_id) {
        await supabase.from('pending_payments').update({
          payment_status: 'Pending', paid_amount: 0, paid_date: null, transaction_ref: null,
        }).eq('id', t.linked_payment_id)
      }
      for (const id of idsToRevert) await clearLedgerEntries(id)
      // Send the bank transaction back to "waiting" so it can be re-linked or ignored
      await supabase.from('bank_transactions').update({
        match_status: 'waiting', linked_payment_id: null,
      }).eq('id', t.id)
      qc.invalidateQueries({ queryKey: ['bank_txn_matched'] })
      qc.invalidateQueries({ queryKey: ['bank_txn_waiting'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
      qc.invalidateQueries({ queryKey: ['pending_payments'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_tds'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_open'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
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
        <>
          {selectedTxnIds.size > 0 && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm">
              <span className="text-amber-700 font-medium">{selectedTxnIds.size} selected</span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkIgnore}
                  disabled={bulkActing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  <X size={14} /> Ignore Selected
                </button>
                <button
                  onClick={handleBulkDeleteTxns}
                  disabled={bulkActing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Delete Selected
                </button>
              </div>
            </div>
          )}
          <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-left">
                  <th className="px-3 py-2 w-8">
                    <input type="checkbox" checked={(waitingTxns ?? []).length > 0 && selectedTxnIds.size === (waitingTxns ?? []).length} onChange={toggleAllTxns} />
                  </th>
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
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={selectedTxnIds.has(t.id)} onChange={() => toggleTxn(t.id)} />
                    </td>
                    <td className="px-3 py-2 text-gray-600">{t.txn_date}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{t.description || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{t.reference_no || '—'}</td>
                    <td className="px-3 py-2 text-right font-semibold text-red-600">₹{fmt(t.amount)}</td>
                    <td className="px-3 py-2 text-gray-500">{t.category || '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{t.statement_balance != null ? `₹${fmt(t.statement_balance)}` : '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setLinkModal(t); setSelectedPaymentIds(new Set()); setBillSearch('') }}
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
              {(waitingTxns ?? []).length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                    <td className="px-3 py-2" colSpan={4}>TOTAL ({(waitingTxns ?? []).length})</td>
                    <td className="px-3 py-2 text-right text-red-600">₹{fmt((waitingTxns ?? []).reduce((s: number, t: any) => s + (t.amount ?? 0), 0))}</td>
                    <td className="px-3 py-2" colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          </Card>
        </>
      )}

      {/* Already-linked transactions — undo wrong matches here */}
      {(matchedTxns ?? []).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mt-4">Linked Transactions ({(matchedTxns ?? []).length})</h3>
          <p className="text-xs text-gray-400">Auto-matched or manually-linked bank debits. If a link is wrong, click <strong>Unlink</strong> — it sets the vendor bill back to Pending and returns the transaction to the list above.</p>
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
                {(matchedTxns ?? []).length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                      <td className="px-3 py-2" colSpan={3}>TOTAL ({(matchedTxns ?? []).length})</td>
                      <td className="px-3 py-2 text-right text-red-600">₹{fmt((matchedTxns ?? []).reduce((s: number, t: any) => s + (t.amount ?? 0), 0))}</td>
                      <td className="px-3 py-2" colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Link modal — multi-select: one bank payment can cover many bills */}
      {linkModal && (() => {
        const search = billSearch.trim().toLowerCase()
        const visibleBills = (openPayments ?? []).filter((p: any) =>
          !search || `${p.vendor_name} ${p.invoice_no ?? ''} ${p.grn_no ?? ''}`.toLowerCase().includes(search))
        const diff = Math.round((selectedTotal - linkModal.amount) * 100) / 100
        return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3 max-h-[90vh] flex flex-col">
            <h3 className="font-bold text-gray-900 text-lg">Link to Vendor Bills</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm flex items-center justify-between">
              <div className="text-gray-500">{linkModal.txn_date} · {linkModal.reference_no || linkModal.description}</div>
              <div className="font-semibold text-red-600">Bank ₹{fmt(linkModal.amount)}</div>
            </div>
            <p className="text-xs text-gray-500">Tick every bill this one payment covers (e.g. 10 bills paid together). All ticked bills are marked Paid.</p>
            <input value={billSearch} onChange={e => setBillSearch(e.target.value)} placeholder="Search vendor / invoice / GRN…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="border border-gray-200 rounded-lg overflow-y-auto flex-1 min-h-[120px]">
              {visibleBills.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-6">No open bills</div>
              ) : visibleBills.map((p: any) => (
                <label key={p.id} className={`flex items-center gap-2 px-3 py-2 text-sm border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedPaymentIds.has(p.id) ? 'bg-blue-50' : ''}`}>
                  <input type="checkbox" checked={selectedPaymentIds.has(p.id)} onChange={() => toggleBill(p.id)} className="rounded border-gray-300 text-blue-600" />
                  <span className="flex-1">{p.vendor_name} <span className="text-gray-400 text-xs">{p.invoice_no ?? p.grn_no ?? ''}</span></span>
                  <span className="font-medium">₹{fmt(getBalance(p))}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-gray-600">{selectedPaymentIds.size} bill(s) selected</span>
              <span className="font-semibold">Selected ₹{fmt(selectedTotal)}</span>
            </div>
            {selectedPaymentIds.size > 0 && diff !== 0 && (
              <div className={`text-xs px-3 py-1.5 rounded-lg ${Math.abs(diff) < 1 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {diff > 0 ? `Selected is ₹${fmt(Math.abs(diff))} more than the bank payment` : `Selected is ₹${fmt(Math.abs(diff))} less than the bank payment`} — you can still link (partial / over).
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setLinkModal(null)} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleLink} disabled={selectedPaymentIds.size === 0 || linking} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {linking ? 'Linking…' : `Link ${selectedPaymentIds.size || ''} Bill(s)`}
              </button>
            </div>
          </div>
        </div>
        )
      })()}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export const BankLedgerPage: React.FC = () => {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'ledger' | 'import' | 'reconcile'>('ledger')
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [fy, setFy] = useState(currentFY())
  const [fromDate, setFromDate] = useState(fyRange(currentFY()).start)
  const [toDate, setToDate] = useState(fyRange(currentFY()).end)
  const [obInput, setObInput] = useState('')
  const [search, setSearch] = useState('')

  // When the FY changes, reset the displayed date range to that FY's range
  React.useEffect(() => {
    const r = fyRange(fy)
    setFromDate(r.start)
    setToDate(r.end)
  }, [fy])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Manage Accounts modal state
  const [showManageAccounts, setShowManageAccounts] = useState(false)
  const [acctEditId, setAcctEditId] = useState<string | null>(null)
  const [acctForm, setAcctForm] = useState({ ...EMPTY_ACCOUNT_FORM })

  // Import state
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState<{ inserted: number; autoMatched: number } | null>(null)
  const [editCats, setEditCats] = useState<Record<number, string>>({})

  // Load bank accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bank_accounts')
        .select('id,bank_name,account_name,account_no,opening_balance')
        .eq('is_active', true)
        .order('bank_name')
      return data ?? []
    }
  })

  // Auto-select first account
  React.useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccount) {
      setSelectedAccount((accounts[0] as any).id)
    }
  }, [accounts])

  // Parties master, for tagging manually-entered transactions to a specific
  // vendor/buyer so they're traceable like auto-linked ones are.
  const { data: parties } = useQuery({
    queryKey: ['parties_list_for_bank_ledger'],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id,name,type').eq('is_active', true).order('name')
      return data ?? []
    }
  })

  // Open (unpaid) bills for the party picked in Add Transaction, so a Debit
  // entered here can settle a specific bill instead of just sitting in the
  // bank ledger with a party tag that Party Ledger never sees.
  //
  // Two gotchas that previously made this list silently come back empty:
  // 1. SQL NULL never matches <> ('neq'), so any bill whose payment_status
  //    was never set (NULL, not the string 'Pending') was invisible — same
  //    class of bug documented for the receivables query elsewhere in this
  //    app. Must OR in payment_status IS NULL explicitly.
  // 2. Many older pending_payments rows only have vendor_name, not party_id
  //    (v_party_ledger itself falls back to a vendor_name match for this
  //    same reason) — filtering strictly on party_id hid all of them.
  const { data: openPaymentsForParty } = useQuery({
    queryKey: ['pending_payments_open_for_party', form.party_id],
    queryFn: async () => {
      const party = (parties ?? []).find((p: any) => p.id === form.party_id)
      const cols = 'id,vendor_name,invoice_no,grn_no,net_payable,invoice_amount,paid_amount,discount_amount,payment_status'
      const [byId, byName] = await Promise.all([
        supabase.from('pending_payments').select(cols)
          .eq('party_id', form.party_id)
          .or('payment_status.neq.Paid,payment_status.is.null'),
        party?.name
          ? supabase.from('pending_payments').select(cols)
              .is('party_id', null).eq('vendor_name', party.name)
              .or('payment_status.neq.Paid,payment_status.is.null')
          : Promise.resolve({ data: [], error: null }),
      ])
      if (byId.error) throw byId.error
      if (byName.error) throw byName.error
      const seen = new Set<string>()
      const merged = [...(byId.data ?? []), ...(byName.data ?? [])].filter((r: any) => {
        if (seen.has(r.id)) return false
        seen.add(r.id); return true
      })
      return merged as any[]
    },
    enabled: !!form.party_id && form.txn_type === 'Debit' && !editId,
  })
  const billBalance = (p: any) => Math.max(0, (p.net_payable ?? p.invoice_amount ?? 0) - (p.paid_amount ?? 0) - (p.discount_amount ?? 0))
  const settleOptions = (openPaymentsForParty ?? []).map((p: any) => ({
    value: p.id,
    label: `${p.invoice_no ?? p.grn_no ?? p.id.slice(0, 8)} — Balance ₹${billBalance(p).toLocaleString('en-IN')}`,
  }))

  // Open (not-fully-received) NHE sale / HE dispatch invoices for the party
  // picked in Add Transaction, mirroring the vendor-bill picker above but
  // for the buyer side — a Credit entered here can settle a specific
  // invoice instead of just sitting untied.
  const { data: openReceivablesForParty } = useQuery({
    queryKey: ['receivables_open_for_party', form.party_id],
    queryFn: async () => {
      const [nhe, he] = await Promise.all([
        supabase.from('nhe_sales')
          .select('id,amount,amount_received,invoice_no,dc_no,sale_type,payment_status')
          .eq('party_id', form.party_id)
          .or('payment_status.neq.Received,payment_status.is.null')
          .or('is_employee_sale.is.null,is_employee_sale.eq.false'),
        supabase.from('he_dispatch')
          .select('id,amount,amount_received,invoice_no,dc_no,payment_status')
          .eq('party_id', form.party_id)
          .or('payment_status.neq.Received,payment_status.is.null'),
      ])
      const nheRows = (nhe.data ?? []).map((r: any) => ({ ...r, source: 'nhe_sales' }))
      const heRows = (he.data ?? []).map((r: any) => ({ ...r, source: 'he_dispatch' }))
      return [...nheRows, ...heRows]
    },
    enabled: !!form.party_id && form.txn_type === 'Credit' && !editId,
  })
  const receivableBalance = (r: any) => Math.max(0, (r.amount ?? 0) - (r.amount_received ?? 0))
  const settleReceivableOptions = (openReceivablesForParty ?? []).map((r: any) => ({
    value: `${r.source}:${r.id}`,
    label: `${r.invoice_no ?? r.dc_no ?? r.id.slice(0, 8)} (${r.source === 'he_dispatch' ? 'HE' : (r.sale_type ?? 'NHE')}) — Balance ₹${receivableBalance(r).toLocaleString('en-IN')}`,
  }))

  // Every account (active + inactive) for the Manage Accounts modal — the
  // dropdown above only ever shows active ones.
  const { data: allAccounts, isLoading: allAccountsLoading } = useQuery({
    queryKey: ['bank_accounts_all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bank_accounts')
        .select('id,bank_name,account_name,account_no,ifsc,branch,opening_balance,is_active')
        .order('bank_name')
      return data ?? []
    },
    enabled: showManageAccounts,
  })

  const openAddAccount = () => { setAcctEditId(null); setAcctForm({ ...EMPTY_ACCOUNT_FORM }) }

  const openEditAccount = (a: any) => {
    setAcctEditId(a.id)
    setAcctForm({
      bank_name: a.bank_name ?? '',
      account_name: a.account_name ?? '',
      account_no: a.account_no ?? '',
      ifsc: a.ifsc ?? '',
      branch: a.branch ?? '',
      opening_balance: a.opening_balance != null ? String(a.opening_balance) : '',
      is_active: a.is_active ?? true,
    })
  }

  const saveAccountMut = useMutation({
    mutationFn: async () => {
      if (!acctForm.bank_name.trim()) throw new Error('Bank name is required')
      const ifscErr = ifscError(acctForm.ifsc); if (ifscErr) throw new Error(ifscErr)
      const acctErr = accountNoError(acctForm.account_no); if (acctErr) throw new Error(acctErr)
      const payload = {
        bank_name: acctForm.bank_name.trim(),
        account_name: acctForm.account_name.trim() || null,
        account_no: acctForm.account_no.trim() || null,
        ifsc: acctForm.ifsc.trim() || null,
        branch: acctForm.branch.trim() || null,
        opening_balance: parseFloat(acctForm.opening_balance) || 0,
        is_active: acctForm.is_active,
      }
      if (acctEditId) {
        const { error } = await supabase.from('bank_accounts').update(payload).eq('id', acctEditId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('bank_accounts').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(acctEditId ? 'Account updated' : 'Account added')
      qc.invalidateQueries({ queryKey: ['bank_accounts_all'] })
      qc.invalidateQueries({ queryKey: ['bank_accounts'] })
      setAcctEditId(null)
      setAcctForm({ ...EMPTY_ACCOUNT_FORM })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const toggleAccountActiveMut = useMutation({
    mutationFn: async (a: any) => {
      const { error } = await supabase.from('bank_accounts').update({ is_active: !a.is_active }).eq('id', a.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_accounts_all'] })
      qc.invalidateQueries({ queryKey: ['bank_accounts'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const deleteAccountMut = useMutation({
    mutationFn: async (a: any) => {
      const [{ count: txnCount }, { count: ppCount }, { count: salCount }] = await Promise.all([
        supabase.from('bank_transactions').select('id', { count: 'exact', head: true }).eq('bank_account_id', a.id),
        supabase.from('pending_payments').select('id', { count: 'exact', head: true }).eq('bank_account_id', a.id),
        supabase.from('salary_monthly').select('id', { count: 'exact', head: true }).eq('bank_account_id', a.id),
      ])
      const total = (txnCount ?? 0) + (ppCount ?? 0) + (salCount ?? 0)
      if (total > 0) {
        throw new Error(
          `Can't delete — ${txnCount ?? 0} bank transaction(s), ${ppCount ?? 0} pending payment(s) and ${salCount ?? 0} salary record(s) reference this account. ` +
          `Deactivate it instead, or move those records to another account first.`
        )
      }
      const { error } = await supabase.from('bank_accounts').delete().eq('id', a.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Account deleted')
      qc.invalidateQueries({ queryKey: ['bank_accounts_all'] })
      qc.invalidateQueries({ queryKey: ['bank_accounts'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  // Load transactions for selected account — scoped to the selected FY's
  // start. Previously this fetched ALL-time transactions while the running
  // balance started at the FY's opening figure, so every prior FY's
  // movement was counted twice (once inside the opening balance, once
  // again walking through those old rows).
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['bank_transactions', selectedAccount, fy],
    queryFn: async () => {
      if (!selectedAccount) return []
      const { data } = await supabase
        .from('bank_transactions')
        .select('id,txn_date,txn_type,category,reference_no,description,amount,created_at,party_id,parties(name,type)')
        .eq('bank_account_id', selectedAccount)
        .gte('txn_date', fyRange(fy).start)
        .order('txn_date', { ascending: true })
        .order('created_at', { ascending: true })
      return data ?? []
    },
    enabled: !!selectedAccount,
  })

  // Per-FY opening balance for the selected account
  const { data: fyOpeningRow } = useQuery({
    queryKey: ['bank_fy_opening', selectedAccount, fy],
    queryFn: async () => {
      if (!selectedAccount) return null
      const { data } = await supabase
        .from('bank_fy_opening')
        .select('opening_balance')
        .eq('bank_account_id', selectedAccount)
        .eq('fy', fy)
        .maybeSingle()
      return data ?? null
    },
    enabled: !!selectedAccount,
  })

  const selectedAccountData = (accounts as any[])?.find((a: any) => a.id === selectedAccount)
  // Prefer the per-FY opening; fall back to the account's single opening_balance
  const openingBalance = (fyOpeningRow as any)?.opening_balance != null
    ? Number((fyOpeningRow as any).opening_balance)
    : (selectedAccountData?.opening_balance ?? 0)

  // Keep the editable opening field in sync with the current FY/account opening
  React.useEffect(() => {
    setObInput(String(openingBalance))
  }, [openingBalance, selectedAccount, fy])

  const { filteredRows, summary } = useMemo(() => {
    if (!transactions) return { filteredRows: [], summary: { credits: 0, debits: 0, closing: 0 } }

    let running = openingBalance

    const allWithBalance = (transactions as any[]).map(t => {
      if (t.txn_type === 'Credit') running += t.amount ?? 0
      else running -= t.amount ?? 0
      return { ...t, balance: running }
    })

    const filtered = allWithBalance.filter(t => {
      if (fromDate && t.txn_date < fromDate) return false
      if (toDate && t.txn_date > toDate) return false
      return true
    })

    const closing = filtered.length > 0 ? filtered[filtered.length - 1].balance : openingBalance
    // Credits/Debits stat cards previously summed over ALL FY transactions
    // regardless of the From/To date filter, so they never matched the
    // rows actually visible in the table below. Compute over `filtered`
    // (date range only) — search narrows the visible rows below but must
    // NOT affect balance/summary, or the closing balance would silently
    // stop being the real running balance for the account.
    const credits = filtered.reduce((s, t) => s + (t.txn_type === 'Credit' ? (t.amount ?? 0) : 0), 0)
    const debits = filtered.reduce((s, t) => s + (t.txn_type === 'Debit' ? (t.amount ?? 0) : 0), 0)

    const q = search.trim().toLowerCase()
    const searched = q
      ? filtered.filter((t: any) =>
          t.description?.toLowerCase().includes(q) ||
          t.reference_no?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.parties?.name?.toLowerCase().includes(q))
      : filtered

    return {
      // Balance computed oldest→newest; display newest first (latest date on top)
      filteredRows: searched.slice().reverse(),
      summary: { credits, debits, closing },
    }
  }, [transactions, fromDate, toDate, openingBalance, search])

  const saveOpeningMutation = useMutation({
    mutationFn: async (v: number) => {
      if (!selectedAccount) throw new Error('Select an account first')
      const { error } = await supabase.from('bank_fy_opening')
        .upsert({ bank_account_id: selectedAccount, fy, opening_balance: v },
                { onConflict: 'bank_account_id,fy' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_fy_opening', selectedAccount, fy] })
      toast.success('Opening balance saved')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bank_transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_transactions', selectedAccount] })
      toast.success('Transaction deleted')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('bank_transactions').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_transactions', selectedAccount] })
      setSelectedIds(new Set())
      toast.success('Selected transactions deleted')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRows.map((t: any) => t.id)))
    }
  }

  const openAdd = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM, bank_account_id: selectedAccount })
    setShowModal(true)
  }

  const openEdit = (t: any) => {
    setEditId(t.id)
    setForm({
      txn_date: t.txn_date ?? today(),
      txn_type: t.txn_type ?? 'Credit',
      category: t.category ?? '',
      reference_no: t.reference_no ?? '',
      description: t.description ?? '',
      amount: t.amount != null ? String(t.amount) : '',
      bank_account_id: t.bank_account_id ?? selectedAccount,
      party_id: t.party_id ?? '',
      settle_payment_id: '',
      settle_receivable_id: '',
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!selectedAccount) return
    if (!form.txn_date || !form.amount) {
      toast.error('Date and amount are required')
      return
    }
    if (!form.bank_account_id) {
      toast.error('Select which bank account this belongs to')
      return
    }
    setSaving(true)
    const amount = parseFloat(form.amount) || 0
    const payload = {
      bank_account_id: form.bank_account_id,
      txn_date: form.txn_date,
      txn_type: form.txn_type,
      category: form.category || null,
      reference_no: form.reference_no || null,
      description: form.description || null,
      amount,
      party_id: form.party_id || null,
    }
    try {
      let newTxnId: string | null = null
      if (editId) {
        const { error } = await supabase.from('bank_transactions').update(payload).eq('id', editId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('bank_transactions').insert(payload).select('id').single()
        if (error) throw error
        newTxnId = data.id
      }

      // Settling a specific bill from here: mark it Paid (so Party Ledger's
      // "Payment Made" row picks it up) and post the Cash Book entry — same
      // as the Link to Bills flow, minus the duplicate bank_transactions
      // insert since this form's own insert above already IS that entry.
      if (!editId && newTxnId && form.settle_payment_id) {
        const bill = (openPaymentsForParty ?? []).find((p: any) => p.id === form.settle_payment_id)
        if (!bill) throw new Error('Selected bill could not be found — reopen Add Transaction and try again')
        const balance = billBalance(bill)
        const settled = Math.min(balance, amount)
        const tag = `BANKTXN:${newTxnId}`
        const { error: ppErr } = await supabase.from('pending_payments').update({
          paid_amount: (bill.paid_amount ?? 0) + settled,
          paid_date: form.txn_date,
          payment_status: settled >= balance ? 'Paid' : 'Pending',
          transaction_ref: tag,
        }).eq('id', form.settle_payment_id)
        if (ppErr) throw new Error('Bill settle failed: ' + ppErr.message)
        const { error: btErr } = await supabase.from('bank_transactions').update({
          match_status: 'manually_matched', linked_payment_id: form.settle_payment_id,
        }).eq('id', newTxnId)
        if (btErr) throw new Error('Bank transaction link failed: ' + btErr.message)
        if (settled > 0) {
          const { error: cbErr } = await supabase.from('cash_book').insert({
            txn_date: form.txn_date, txn_type: 'payment', category: 'purchase_payment',
            description: `Payment to ${bill.vendor_name}${bill.invoice_no ? ' — Inv ' + bill.invoice_no : ''}`,
            party_name: bill.vendor_name, amount_in: 0, amount_out: settled,
            payment_mode: toCbMode(form.category || 'NEFT'), reference_no: form.reference_no || null,
            pending_payment_id: form.settle_payment_id,
          })
          if (cbErr) throw new Error('Cash Book entry failed: ' + cbErr.message)
        }
        qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
        qc.invalidateQueries({ queryKey: ['pending_payments'] })
        qc.invalidateQueries({ queryKey: ['pending_payments_open_for_party'] })
        qc.invalidateQueries({ queryKey: ['cash_book'] })
      }

      // Buyer side: settling a specific NHE sale / HE dispatch invoice —
      // same idea, mirrored for Credit (money received).
      if (!editId && newTxnId && form.settle_receivable_id) {
        const [source, recvId] = form.settle_receivable_id.split(':')
        const inv = (openReceivablesForParty ?? []).find((r: any) => r.source === source && r.id === recvId)
        if (!inv) throw new Error('Selected invoice could not be found — reopen Add Transaction and try again')
        const balance = receivableBalance(inv)
        const settled = Math.min(balance, amount)
        const newReceived = (inv.amount_received ?? 0) + settled
        // nhe_sales/he_dispatch.payment_mode has its own CHECK constraint
        // (Cash/NEFT/RTGS/Bank Transfer/UPI/Cheque/Advance — see migration
        // 338) which has nothing to do with Bank Ledger's own category list
        // (Vendor Payment/Bank Charges/etc.) — writing form.category here
        // violated the constraint. This is money received into a bank
        // account, so NEFT is always a valid, safe default.
        const { error: invErr } = await supabase.from(source).update({
          amount_received: newReceived,
          received_date: form.txn_date,
          payment_mode: 'NEFT',
          payment_status: newReceived >= (inv.amount ?? 0) ? 'Received' : 'Partial',
          bank_account_id: form.bank_account_id,
          utr_ref: form.reference_no || null,
        }).eq('id', recvId)
        if (invErr) throw new Error('Invoice settle failed: ' + invErr.message)
        const { error: btErr } = await supabase.from('bank_transactions').update({
          [source === 'he_dispatch' ? 'he_dispatch_id' : 'nhe_sale_id']: recvId,
        }).eq('id', newTxnId)
        if (btErr) throw new Error('Bank transaction link failed: ' + btErr.message)
        qc.invalidateQueries({ queryKey: ['receivables_open_for_party'] })
        qc.invalidateQueries({ queryKey: ['pending_receivables'] })
        qc.invalidateQueries({ queryKey: ['nhe_sales'] })
        qc.invalidateQueries({ queryKey: ['he_dispatch'] })
      }

      toast.success(editId ? 'Transaction updated' : ((form.settle_payment_id || form.settle_receivable_id) ? 'Transaction saved — invoice settled' : 'Transaction saved'))
      setShowModal(false)
      setForm({ ...EMPTY_FORM })
      setEditId(null)
      qc.invalidateQueries({ queryKey: ['bank_transactions', selectedAccount] })
      // Moving a transaction to a different account (via the Bank Account
      // field above) means that account's own cache is stale too.
      if (payload.bank_account_id !== selectedAccount) {
        qc.invalidateQueries({ queryKey: ['bank_transactions', payload.bank_account_id] })
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleExportCSV = () => {
    if (!filteredRows.length) return
    const headers = ['Date', 'Type', 'Category', 'Description', 'Reference', 'Debit', 'Credit', 'Balance']
    const csvRows = filteredRows.map((t: any) => [
      t.txn_date, t.txn_type, t.category ?? '', t.description ?? '', t.reference_no ?? '',
      t.txn_type === 'Debit' ? t.amount : '',
      t.txn_type === 'Credit' ? t.amount : '',
      t.balance,
    ])
    // Quote every field — bank narrations routinely contain commas
    // (e.g. "NEFT, HDFC0001..."), which previously shifted every column
    // after Description in the exported file.
    const q = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...csvRows].map(row => row.map(q).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bank-ledger-${selectedAccountData?.account_no ?? 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── CSV file handling ────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError('')
    setParsedRows([])
    setImportDone(null)
    setEditCats({})

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const rows = parseKotakCSV(text)
        if (rows.length === 0) {
          setParseError('No data rows found. Check that the CSV is a Kotak bank statement.')
        } else {
          setParsedRows(rows)
        }
      } catch (err: any) {
        setParseError(err.message ?? 'Failed to parse CSV')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleImport = async () => {
    if (!selectedAccount || parsedRows.length === 0) return
    setImporting(true)

    // Fetch pending payments for auto-match (Debit rows only)
    const { data: payments } = await supabase
      .from('pending_payments')
      .select('id,vendor_name,net_payable,invoice_amount,paid_amount,discount_amount,transaction_ref')
      .neq('payment_status', 'Paid')

    const pendingList = (payments ?? []) as any[]

    let insertedCount = 0
    let autoMatchedCount = 0

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i]
      const category = editCats[i] !== undefined ? editCats[i] : row.category

      // Try auto-match for debit rows
      let linkedPaymentId: string | null = null
      let matchStatus = 'waiting'

      if (row.txn_type === 'Debit') {
        const matched = pendingList.find(p => {
          const balance = Math.max(0, (p.net_payable ?? p.invoice_amount ?? 0) - (p.paid_amount ?? 0) - (p.discount_amount ?? 0))
          const amtMatch = Math.abs(balance - row.amount) < 1
          const refMatch = row.reference && p.transaction_ref &&
            (row.reference.toLowerCase().includes(p.transaction_ref.toLowerCase()) ||
             p.transaction_ref.toLowerCase().includes(row.reference.toLowerCase()))
          return amtMatch || refMatch
        })
        if (matched) {
          linkedPaymentId = matched.id
          matchStatus = 'auto_matched'
        }
      } else {
        matchStatus = 'waiting'
      }

      const { error } = await supabase.from('bank_transactions').insert({
        bank_account_id: selectedAccount,
        txn_date: row.value_date,
        txn_type: row.txn_type,
        category: category || null,
        reference_no: row.reference || null,
        description: row.description || null,
        amount: row.amount,
        statement_balance: row.statement_balance || null,
        imported: true,
        match_status: matchStatus,
        linked_payment_id: linkedPaymentId,
      })
      if (!error) {
        insertedCount++
        if (matchStatus === 'auto_matched' && linkedPaymentId) {
          autoMatchedCount++
          // Mark payment as Paid
          const p = pendingList.find(x => x.id === linkedPaymentId)
          if (p) {
            const balance = Math.max(0, (p.net_payable ?? p.invoice_amount ?? 0) - (p.paid_amount ?? 0) - (p.discount_amount ?? 0))
            await supabase.from('pending_payments').update({
              paid_amount: (p.paid_amount ?? 0) + balance,
              paid_date: row.value_date,
              payment_status: 'Paid',
              transaction_ref: row.reference || null,
            }).eq('id', linkedPaymentId)
          }
        }
      }
    }

    setImporting(false)
    setImportDone({ inserted: insertedCount, autoMatched: autoMatchedCount })
    setParsedRows([])
    qc.invalidateQueries({ queryKey: ['bank_transactions', selectedAccount] })
    qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
    qc.invalidateQueries({ queryKey: ['bank_txn_waiting'] })
  }

  const accountOptions = (accounts ?? []).map((a: any) => ({
    value: a.id,
    label: `${a.bank_name} — ${a.account_no}`,
  }))

  const CATEGORIES = ['', 'Vendor Payment', 'Partner Remuneration', 'Salary', 'Electricity', 'Bank Charges', 'Cash Withdrawal', 'Customer Receipt', 'Other']

  return (
    <div className="space-y-4">
      <CardHeader
        title="Bank Ledger"
        subtitle="View and manage bank account transactions"
        action={
          <div className="flex items-center gap-3">
            {tab === 'ledger' && (
              <>
                <Button icon={<Plus size={16} />} onClick={openAdd} disabled={!selectedAccount}>
                  Add Transaction
                </Button>
                <Button icon={<Download size={16} />} variant="outline" onClick={handleExportCSV} disabled={!filteredRows.length}>
                  Export CSV
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Account selector */}
      <div className="flex items-end gap-3">
        <div className="w-72">
          <Select
            label="Bank Account"
            value={selectedAccount}
            onChange={e => setSelectedAccount((e.target as HTMLSelectElement).value)}
            options={[{ value: '', label: '— Select Account —' }, ...accountOptions]}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => { openAddAccount(); setShowManageAccounts(true) }}>
          Manage Accounts
        </Button>
      </div>

      {showManageAccounts && (
        <Modal open={showManageAccounts} title="Manage Bank Accounts" onClose={() => setShowManageAccounts(false)}>
          <div className="space-y-4">
            {allAccountsLoading ? (
              <div className="flex justify-center py-8"><Spinner size={24} /></div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(allAccounts ?? []).map((a: any) => (
                  <div key={a.id} className={`border rounded-lg p-3 ${a.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">{a.bank_name}{a.account_name ? ` — ${a.account_name}` : ''}</div>
                        <div className="text-xs text-gray-500">
                          A/C {a.account_no ?? '—'} {a.ifsc ? `· IFSC ${a.ifsc}` : ''} {a.branch ? `· ${a.branch}` : ''}
                          {!a.is_active && ' · Inactive'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" className="p-1.5 text-gray-500 hover:text-blue-600" title="Edit" onClick={() => openEditAccount(a)}>
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-gray-500 hover:text-amber-600 text-xs"
                          title={a.is_active ? 'Deactivate' : 'Activate'}
                          onClick={() => toggleAccountActiveMut.mutate(a)}
                        >
                          {a.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-gray-500 hover:text-red-600"
                          title="Delete"
                          onClick={() => { if (confirm(`Delete "${a.bank_name}"? This only works if nothing references it.`)) deleteAccountMut.mutate(a) }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {(allAccounts ?? []).length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">No bank accounts yet</div>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="font-medium text-sm mb-2">{acctEditId ? 'Edit Account' : '+ Add Account'}</div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Bank Name" value={acctForm.bank_name} onChange={e => setAcctForm(f => ({ ...f, bank_name: e.target.value }))} />
                <Input label="Account Name (label)" value={acctForm.account_name} onChange={e => setAcctForm(f => ({ ...f, account_name: e.target.value }))} />
                <Input label="Account No" value={acctForm.account_no} onChange={e => setAcctForm(f => ({ ...f, account_no: e.target.value }))} error={accountNoError(acctForm.account_no) ?? undefined} />
                <Input label="IFSC" value={acctForm.ifsc} onChange={e => setAcctForm(f => ({ ...f, ifsc: e.target.value.toUpperCase() }))} error={ifscError(acctForm.ifsc) ?? undefined} />
                <Input label="Branch" value={acctForm.branch} onChange={e => setAcctForm(f => ({ ...f, branch: e.target.value }))} />
                <Input label="Opening Balance" type="number" value={acctForm.opening_balance} onChange={e => setAcctForm(f => ({ ...f, opening_balance: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between mt-3">
                {acctEditId && (
                  <Button variant="outline" size="sm" onClick={openAddAccount}>Cancel Edit</Button>
                )}
                <Button size="sm" loading={saveAccountMut.isPending} onClick={() => saveAccountMut.mutate()}>
                  {acctEditId ? 'Save Changes' : 'Add Account'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([
          { key: 'ledger', label: 'Transactions' },
          { key: 'import', label: 'Import Statement' },
          { key: 'reconcile', label: 'Link to Bills' },
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

      {/* ── Ledger tab ── */}
      {tab === 'ledger' && (
        <>
          {/* FY selector + per-FY opening balance */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <Select
                label="Financial Year"
                value={fy}
                onChange={e => setFy((e.target as HTMLSelectElement).value)}
                options={FY_OPTIONS.map(o => ({ value: o, label: `FY ${o}` }))}
              />
            </div>
            <div className="w-44">
              <Input
                label={`Opening Balance (FY ${fy})`}
                type="number"
                value={obInput}
                onChange={e => setObInput(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={saveOpeningMutation.isPending}
              disabled={!selectedAccount}
              onClick={() => {
                const v = parseFloat(obInput)
                if (isNaN(v)) { toast.error('Enter a valid number'); return }
                saveOpeningMutation.mutate(v)
              }}
            >
              Save Opening
            </Button>
          </div>

          {/* Date filter */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
              <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
              <DateInput value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            {(fromDate || toDate) && (
              <Button variant="outline" size="sm" onClick={() => { setFromDate(''); setToDate('') }}>Clear</Button>
            )}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Description, reference, category, party…" />
            </div>
            {search && (
              <Button variant="outline" size="sm" onClick={() => setSearch('')}>Clear Search</Button>
            )}
          </div>

          {/* Summary cards */}
          {selectedAccount && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Opening Balance', value: inr(openingBalance), color: 'text-gray-700' },
                { label: 'Total Credits', value: inr(summary.credits), color: 'text-green-700' },
                { label: 'Total Debits', value: inr(summary.debits), color: 'text-red-600' },
                { label: 'Closing Balance', value: inr(summary.closing), color: summary.closing >= 0 ? 'text-blue-700' : 'text-red-600' },
              ].map(s => (
                <Card key={s.label}>
                  <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                </Card>
              ))}
            </div>
          )}

          {/* Transaction table */}
          {accountsLoading || (selectedAccount && txLoading) ? (
            <div className="flex justify-center py-12"><Spinner size={32} /></div>
          ) : !selectedAccount ? (
            <EmptyState title="Select a bank account to view transactions" />
          ) : filteredRows.length === 0 ? (
            <EmptyState title="No transactions found" subtitle="Add a transaction to get started" />
          ) : (
            <Card padding={false}>
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-200 text-sm">
                  <span className="text-red-700 font-medium">{selectedIds.size} selected</span>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    loading={bulkDeleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete ${selectedIds.size} selected transaction(s)?`)) {
                        bulkDeleteMutation.mutate([...selectedIds])
                      }
                    }}
                  >
                    Delete Selected
                  </Button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                      <th className="px-3 py-2 w-8">
                        <input
                          type="checkbox"
                          checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Party</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-left">Reference</th>
                      <th className="px-3 py-2 text-right">Debit</th>
                      <th className="px-3 py-2 text-right">Credit</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                      <th className="px-3 py-2 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((t: any, idx: number) => (
                      <tr key={t.id} className={`group ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-brand-50/30`}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(t.id)}
                            onChange={() => toggleSelect(t.id)}
                          />
                        </td>
                        <td className="px-3 py-2 text-gray-600">{t.txn_date}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.txn_type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {t.txn_type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{t.category ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-700">{(t.parties as any)?.name ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-700">{t.description ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{t.reference_no ?? '—'}</td>
                        <td className="px-3 py-2 text-right text-red-600">
                          {t.txn_type === 'Debit' ? inr(t.amount) : ''}
                        </td>
                        <td className="px-3 py-2 text-right text-green-700">
                          {t.txn_type === 'Credit' ? inr(t.amount) : ''}
                        </td>
                        <td className={`px-3 py-2 text-right font-semibold ${t.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                          {inr(t.balance)}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEdit(t)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-opacity"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this transaction?')) {
                                deleteMutation.mutate(t.id)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Import Statement tab ── */}
      {tab === 'import' && (
        <div className="space-y-5">
          {!selectedAccount ? (
            <EmptyState title="Select a bank account first" />
          ) : (
            <>
              {/* Upload area */}
              <Card>
                <div className="space-y-3">
                  <div className="font-semibold text-gray-800">Upload Kotak Bank Statement (CSV)</div>
                  <div className="text-sm text-gray-500">
                    Download your statement from Kotak Net Banking → Account → Transaction History → Export CSV.
                    The file should start with account details followed by transaction rows.
                  </div>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Upload size={16} /> Choose CSV file
                  </button>
                  {parseError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
                      <AlertCircle size={16} /> {parseError}
                    </div>
                  )}
                </div>
              </Card>

              {/* Import success message */}
              {importDone && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                  <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                  <div>
                    <div className="font-semibold">Import complete</div>
                    <div>{importDone.inserted} transactions imported · {importDone.autoMatched} auto-matched to vendor payments</div>
                    {importDone.inserted - importDone.autoMatched > 0 && (
                      <div className="text-green-700 mt-0.5">
                        {importDone.inserted - importDone.autoMatched} transactions moved to the <strong>Link to Bills</strong> tab
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview table */}
              {parsedRows.length > 0 && (
                <Card padding={false}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="font-semibold text-gray-800">{parsedRows.length} transactions found — review before importing</div>
                    <Button onClick={handleImport} loading={importing} icon={<Link2 size={15} />}>
                      Import &amp; Auto-match
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 uppercase border-b border-gray-100">
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-left">Description</th>
                          <th className="px-3 py-2 text-left">Reference</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2 text-right">Balance</th>
                          <th className="px-3 py-2 text-left">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((r, i) => (
                          <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                            <td className="px-3 py-1.5 text-gray-600">{r.value_date}</td>
                            <td className="px-3 py-1.5">
                              <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${r.txn_type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {r.txn_type}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-gray-700 max-w-[200px] truncate">{r.description || '—'}</td>
                            <td className="px-3 py-1.5 text-gray-500 max-w-[140px] truncate">{r.reference || '—'}</td>
                            <td className={`px-3 py-1.5 text-right font-semibold ${r.txn_type === 'Debit' ? 'text-red-600' : 'text-green-700'}`}>
                              {inr(r.amount)}
                            </td>
                            <td className="px-3 py-1.5 text-right text-gray-600">{inr(r.statement_balance)}</td>
                            <td className="px-3 py-1.5">
                              <select
                                value={editCats[i] !== undefined ? editCats[i] : r.category}
                                onChange={e => setEditCats(ec => ({ ...ec, [i]: e.target.value }))}
                                className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white"
                              >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c || '(auto)'}</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Link to Bills tab (bank-statement reconciliation) ── */}
      {tab === 'reconcile' && <LinkToBills />}

      {/* Add Transaction Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Bank Transaction' : 'Add Bank Transaction'}>
        <div className="space-y-4">
          {editId && (
            <Select
              label="Bank Account (ledger this belongs to)"
              value={form.bank_account_id}
              onChange={e => setForm(f => ({ ...f, bank_account_id: (e.target as HTMLSelectElement).value }))}
              options={accountOptions}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <DateInput value={form.txn_date} onChange={e => setForm(f => ({ ...f, txn_date: e.target.value }))} />
            </div>
            <Select
              label="Type"
              value={form.txn_type}
              onChange={e => setForm(f => ({ ...f, txn_type: (e.target as HTMLSelectElement).value }))}
              options={[
                { value: 'Credit', label: 'Credit' },
                { value: 'Debit', label: 'Debit' },
              ]}
            />
          </div>
          <Select
            label="Ledger / Category (which head this posts to)"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: (e.target as HTMLSelectElement).value }))}
            options={CATEGORIES.map(c => ({ value: c, label: c || '— Select —' }))}
          />
          <Select
            label="Vendor / Party (optional — links this to your Parties master)"
            value={form.party_id}
            onChange={e => {
              const id = (e.target as HTMLSelectElement).value
              const p = (parties ?? []).find((x: any) => x.id === id)
              setForm(f => ({ ...f, party_id: id, settle_payment_id: '', settle_receivable_id: '', description: !f.description && p ? p.name : f.description }))
            }}
            options={[{ value: '', label: '— None —' }, ...(parties ?? []).map((p: any) => ({ value: p.id, label: `${p.name} (${p.type})` }))]}
          />
          {!editId && form.txn_type === 'Debit' && form.party_id && (
            <div>
              <SearchableSelect
                label="Settle against bill (optional — marks it Paid and posts to Party Ledger)"
                placeholder={settleOptions.length ? 'Not linked to a bill' : 'No open bills for this party'}
                options={settleOptions}
                value={form.settle_payment_id}
                onChange={v => setForm(f => ({ ...f, settle_payment_id: v }))}
              />
              {!form.settle_payment_id && (
                <p className="text-xs text-amber-600 mt-1">Without picking a bill here, this stays a plain bank entry and won't show in that party's ledger.</p>
              )}
            </div>
          )}
          {!editId && form.txn_type === 'Credit' && form.party_id && (
            <div>
              <SearchableSelect
                label="Settle against invoice (optional — marks it Received and posts to Party Ledger)"
                placeholder={settleReceivableOptions.length ? 'Not linked to an invoice' : 'No open invoices for this party'}
                options={settleReceivableOptions}
                value={form.settle_receivable_id}
                onChange={v => setForm(f => ({ ...f, settle_receivable_id: v }))}
              />
              {!form.settle_receivable_id && (
                <p className="text-xs text-amber-600 mt-1">Without picking an invoice here, this stays a plain bank entry and won't show in that party's ledger.</p>
              )}
            </div>
          )}
          <Input
            label="Reference No"
            value={form.reference_no}
            onChange={e => setForm(f => ({ ...f, reference_no: e.target.value }))}
            placeholder="Cheque / NEFT ref"
          />
          <Input
            label="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Transaction details..."
          />
          <Input
            label="Amount"
            type="number"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            placeholder="0.00"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
