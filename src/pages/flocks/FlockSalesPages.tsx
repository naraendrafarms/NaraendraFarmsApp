import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today, fetchAllPages } from '@/lib/utils'
import { useFarmScope } from '@/lib/useFarmScope'
import {
  Card, CardHeader, Button, Input, Select, FormRow, Modal, Divider,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState, StatCard
, DateInput, SearchableSelect, usePagination, PageSizeControl } from '@/components/ui'
import { useMedicineOptionsWithAliases } from '@/lib/itemAliases'
import { useMedicineRates } from '@/lib/medicineRates'
import { useFormDraft } from '@/hooks/useFormDraft'
import { Plus, Package, Edit2, Egg, Trash2, Upload, Download, AlertCircle, Printer } from 'lucide-react'
import { QuickAddParty } from '@/components/ui/QuickAdd'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { parseFile } from '@/lib/parseFile'
import { supplyType, splitTax, GST_RATE_OPTIONS } from '@/lib/gst'
import { printHEDispatch, printNHESale } from '@/lib/invoicePrint'
import * as pdfjsLib from 'pdfjs-dist'
if (typeof window !== 'undefined') pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`

// Extract temperature readings from a logger report so Min/Max/Avg are
// computed by the app, not typed by hand. PDF: these trackers print each
// reading's temperature as a decimal with exactly one digit after the point
// (e.g. "31.2"), while every other number in the report (dates, speed) never
// matches that shape — a reliable heuristic without needing to parse the
// table structure itself. CSV/Excel: look for a column literally named
// "temperature" (or containing that word) and read its numeric values.
async function extractTempReadings(file: File): Promise<number[]> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) {
    const buf = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise
    let fullText = ''
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const tc = await page.getTextContent()
      fullText += tc.items.map((it: any) => it.str).join(' ') + '\n'
    }
    const matches = fullText.match(/\b\d{1,2}\.\d\b/g) ?? []
    return matches.map(Number).filter(n => n > -20 && n < 60)
  }
  const { headers, rows } = await parseFile(file)
  const tempCol = headers.findIndex(h => h.includes('temperature') || h.includes('temp'))
  if (tempCol < 0) return []
  return rows.map(r => parseFloat(r[tempCol])).filter(n => !isNaN(n))
}

// ── Receive Payment Modal ─────────────────────────────────────────
// Exported so Party Outstanding (Debtors tab) can reuse the exact same
// receipt logic instead of duplicating Cash Book / Bank Ledger posting.
export const ReceivePaymentModal: React.FC<{
  open: boolean; sale: any; bankAccounts: any[]; farms: any[]; table: string;
  onClose: () => void; onSaved: () => void
}> = ({ open, sale, bankAccounts, farms, table, onClose, onSaved }) => {
  const [mode, setMode] = useState('Cash')
  const [bankId, setBankId] = useState('')
  const [cashFarmId, setCashFarmId] = useState('ho') // 'ho' = Head Office, or a farm UUID
  const [date, setDate] = useState(today())
  const [amtReceived, setAmtReceived] = useState('')
  // Split receipt — part cash, part online. nhe_sales has carried
  // payment_cash/payment_online since migration 061 but only the bird-sale
  // entry form ever used them; this modal could record one mode only, and
  // saving a second payment overwrote the first AND deleted its ledger row.
  const [splitOn, setSplitOn] = useState(false)
  const [cashAmt, setCashAmt] = useState('')
  const [onlineAmt, setOnlineAmt] = useState('')
  const [utr, setUtr] = useState('')
  const [status, setStatus] = useState('Received')
  const [saving, setSaving] = useState(false)
  const [selectedAdvanceId, setSelectedAdvanceId] = useState('')

  // Load available advance balance for this party
  const { data: partyAdvances = [] } = useQuery({
    queryKey: ['party_advances_avail', sale?.party_id],
    queryFn: async () => {
      if (!sale?.party_id) return []
      const { data } = await supabase
        .from('party_advances')
        .select('id,advance_date,amount,amount_used,payment_mode,reference_no')
        .eq('party_id', sale.party_id)
        .order('advance_date', { ascending: true })
      return (data ?? []).filter((a: any) => (a.amount - a.amount_used) > 0)
    },
    enabled: !!sale?.party_id && open,
  })
  const totalAdvanceBalance = partyAdvances.reduce((s: number, a: any) => s + (a.amount - a.amount_used), 0)

  React.useEffect(() => {
    if (sale) {
      setMode(sale.payment_mode ?? 'Cash')
      setBankId(sale.bank_account_id ?? '')
      // nhe_sales stores where cash was received; he_dispatch has no such
      // column so this falls back to Head Office.
      setCashFarmId(sale.cash_farm_id ?? 'ho')
      setDate(sale.received_date ?? today())
      // Default to what's actually still owed — the invoice amount less any
      // TDS already deducted at source (shown as "Net receivable" when the
      // sale/dispatch was entered) — not the full gross invoice amount.
      const netDue = Math.max(0, (sale.amount ?? 0) - (sale.tds_amount ?? 0))
      setAmtReceived(sale.amount_received?.toString() ?? netDue.toString())
      setUtr(sale.utr_ref ?? '')
      setStatus(sale.payment_status === 'Pending' || !sale.payment_status ? 'Received' : sale.payment_status)
      setSelectedAdvanceId('')
      const pc = Number(sale.payment_cash ?? 0), po = Number(sale.payment_online ?? 0)
      setSplitOn(pc > 0 && po > 0)
      setCashAmt(pc ? String(pc) : '')
      setOnlineAmt(po ? String(po) : '')
    }
  }, [sale])

  const handleSave = async () => {
    if (!sale) return
    setSaving(true)
    try {
      const splitCash   = splitOn ? (parseFloat(cashAmt) || 0) : 0
      const splitOnline = splitOn ? (parseFloat(onlineAmt) || 0) : 0
      // In split mode the total received IS the two parts — typing a separate
      // total that disagreed with them is how a receipt ends up in the ledgers
      // for one figure and on the sale for another.
      const amt = splitOn ? splitCash + splitOnline : (parseFloat(amtReceived) || 0)
      const isAdvance = mode === 'Advance'
      if (splitOn) {
        if (amt <= 0) throw new Error('Enter the cash and/or online amount')
        if (splitOnline > 0 && !bankId) {
          throw new Error('Select a Bank Account for the online part, or it won\'t be recorded in any ledger')
        }
      }
      // Never let a non-cash receipt flip to "Received" without a bank account —
      // that used to silently post to no ledger at all (money marked received
      // but invisible in both Cash Book and Bank Ledger).
      if (!isAdvance && !splitOn && mode !== 'Cash' && amt > 0 && status !== 'Pending' && !bankId) {
        throw new Error('Select a Bank Account for this payment mode, or it won\'t be recorded in any ledger')
      }

      // Reverse any previous advance adjustment on THIS sale first — whether
      // we're re-saving the same advance with a different amount, switching
      // to a different advance, or switching away from Advance entirely.
      // Without this, re-saving compounds amount_used every time, and
      // switching modes leaves the old advance permanently "used" for
      // nothing.
      const prevAdvanceId = sale.party_advance_id
      const prevAdjusted = sale.advance_adjusted || 0
      if (prevAdvanceId && prevAdjusted > 0) {
        const { data: prevAdv } = await supabase.from('party_advances').select('amount_used').eq('id', prevAdvanceId).single()
        if (prevAdv) {
          await supabase.from('party_advances')
            .update({ amount_used: Math.max(0, prevAdv.amount_used - prevAdjusted) })
            .eq('id', prevAdvanceId)
        }
      }

      // Always clean up any prior ledger entries for this sale/dispatch FIRST,
      // regardless of the new status/mode — otherwise reversing to Pending, or
      // switching Cash<->Bank, leaves the old cash_book/bank_transactions row
      // behind (it was previously nested inside status/mode-gated branches).
      const linkCol = table === 'he_dispatch' ? 'he_dispatch_id' : 'nhe_sale_id'
      await supabase.from('cash_book').delete().eq(linkCol, sale.id)
      await supabase.from('bank_transactions').delete().eq(linkCol, sale.id)

      if (isAdvance) {
        if (!selectedAdvanceId) throw new Error('Select which advance to use')
        const adv = (partyAdvances as any[]).find(a => a.id === selectedAdvanceId)
        if (!adv) throw new Error('Advance not found')
        // adv.amount_used already reflects the reversal above if this is the
        // same advance as before; if it's a different advance, it's unaffected.
        const currentUsed = selectedAdvanceId === prevAdvanceId
          ? Math.max(0, adv.amount_used - prevAdjusted)
          : adv.amount_used
        const available = adv.amount - currentUsed
        if (amt > available) throw new Error(`Only ${inr(available)} available in this advance`)
        // update sale with advance adjustment
        const advUpdate: any = {
          payment_status: status,
          payment_mode: 'Advance',
          received_date: date || null,
          amount_received: amt || null,
          bank_account_id: null,
          utr_ref: null,
          advance_adjusted: amt,
          party_advance_id: selectedAdvanceId,
        }
        const { error: sErr } = await supabase.from(table).update(advUpdate).eq('id', sale.id)
        if (sErr) throw sErr
        // deduct from party_advances.amount_used
        const { error: aErr } = await supabase
          .from('party_advances')
          .update({ amount_used: currentUsed + amt })
          .eq('id', selectedAdvanceId)
        if (aErr) throw aErr
        toast.success('Advance adjusted successfully')
        onSaved()
        setSaving(false)
        return
      }

      const update: any = {
        payment_status: status,
        payment_mode: splitOn
          ? (splitCash > 0 && splitOnline > 0 ? 'Cash+NEFT' : splitOnline > 0 ? 'NEFT' : 'Cash')
          : mode,
        payment_cash: splitOn ? splitCash : (mode === 'Cash' ? (amt || 0) : 0),
        payment_online: splitOn ? splitOnline : (mode !== 'Cash' && mode !== 'Advance' ? (amt || 0) : 0),
        received_date: date || null,
        amount_received: amt || null,
        bank_account_id: splitOn ? (splitOnline > 0 ? bankId : null) : ((mode !== 'Cash' && bankId) ? bankId : null),
        utr_ref: utr || null,
        // "Cash Received At (Location)" was written to the Cash Book entry but
        // never back to the sale, so reopening this modal always fell back to
        // Head Office and the sale itself never recorded where cash came in.
        // he_dispatch has no such column, so only set it for nhe_sales.
        ...(table === 'nhe_sales' ? { cash_farm_id: mode === 'Cash' ? (cashFarmId === 'ho' ? null : cashFarmId) : null } : {}),
        // Clear any prior advance link now that this receipt is cash/bank,
        // not an advance adjustment (the reversal above already restored
        // the advance's balance).
        advance_adjusted: 0,
        party_advance_id: null,
      }
      const { error } = await supabase.from(table).update(update).eq('id', sale.id)
      if (error) throw error

      const saleType = sale.sale_type ?? (table === 'he_dispatch' ? 'he_sale' : 'je')
      const { category: cbCategory, label: typeLabel } = nheCashCategory(saleType)
      const flockLabel = sale.flocks?.flock_no ? `F-${sale.flocks.flock_no}` : ''
      const description = [typeLabel, flockLabel, sale.dc_no ?? sale.invoice_no ?? ''].filter(Boolean).join(' — ')

      // A split posts BOTH ledger rows — one cash receipt and one bank credit,
      // each for its own amount. The single-mode branches below are unchanged.
      if (splitOn && status !== 'Pending') {
        const sourceCol = table === 'he_dispatch' ? { he_dispatch_id: sale.id } : { nhe_sale_id: sale.id }
        if (splitCash > 0) {
          const { error: cbErr } = await supabase.from('cash_book').insert({
            txn_date: date, txn_type: 'receipt', category: cbCategory,
            description: description + ' (cash part)',
            party_name: sale.parties?.name ?? null,
            farm_id: cashFarmId === 'ho' ? null : cashFarmId,
            flock_id: sale.flock_id ?? null,
            reference_no: sale.dc_no ?? sale.invoice_no ?? null,
            amount_in: splitCash, amount_out: 0, payment_mode: 'cash',
            ...sourceCol,
          })
          if (cbErr) throw new Error('Payment saved but Cash Book entry failed: ' + cbErr.message)
        }
        if (splitOnline > 0) {
          const { error: btErr } = await supabase.from('bank_transactions').insert({
            bank_account_id: bankId, txn_date: date, txn_type: 'Credit',
            category: 'Sale Receipt',
            reference_no: utr || sale.dc_no || sale.invoice_no || null,
            description: description + ' (online part)',
            amount: splitOnline, party_id: sale.party_id ?? null,
            [linkCol]: sale.id,
          })
          if (btErr) throw new Error('Payment saved but Bank entry failed: ' + btErr.message)
        }
      } else if (mode === 'Cash' && amt > 0 && status !== 'Pending') {
        const sourceCol = table === 'he_dispatch' ? { he_dispatch_id: sale.id } : { nhe_sale_id: sale.id }
        // Create cash_book receipt entry
        const { error: cbErr } = await supabase.from('cash_book').insert({
          txn_date: date,
          txn_type: 'receipt',
          category: cbCategory,
          description,
          party_name: sale.parties?.name ?? null,
          farm_id: cashFarmId === 'ho' ? null : cashFarmId,
          flock_id: sale.flock_id ?? null,
          reference_no: sale.dc_no ?? sale.invoice_no ?? null,
          amount_in: amt,
          amount_out: 0,
          payment_mode: 'cash',
          ...sourceCol,
        })
        if (cbErr) throw new Error('Payment saved but Cash Book entry failed: ' + cbErr.message)
      } else if (mode !== 'Cash' && bankId && amt > 0 && status !== 'Pending') {
        // Create bank_transactions credit entry
        await supabase.from('bank_transactions').insert({
          bank_account_id: bankId,
          txn_date: date,
          txn_type: 'Credit',
          category: 'Sale Receipt',
          reference_no: utr || sale.dc_no || sale.invoice_no || null,
          description,
          amount: amt,
          party_id: sale.party_id ?? null,
          [linkCol]: sale.id,
        })
      }
      toast.success('Payment recorded')
      onSaved()
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  if (!open || !sale) return null
  const bankOptions = bankAccounts.map((b: any) => ({ value: b.id, label: `${b.bank_name}${b.account_name ? ' — '+b.account_name : ''}` }))
  const cashLocationOptions = [
    { value: 'ho', label: 'Head Office' },
    ...farms.map((f: any) => ({ value: f.id, label: `${f.name} (Site)` })),
  ]
  const paymentModeOptions = [
    'Cash', 'NEFT', 'RTGS', 'Bank Transfer', 'UPI', 'Cheque',
    ...(totalAdvanceBalance > 0 ? ['Advance'] : []),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Receive Payment</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Sale: {sale.sale_type ?? 'HE Dispatch'} · Invoice: {inr(sale.amount)}
              {sale.parties?.name ? ` · ${sale.parties.name}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {totalAdvanceBalance > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
            This party has <span className="font-bold">{inr(totalAdvanceBalance)}</span> advance balance available. Select <strong>Advance</strong> as payment mode to adjust.
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" value={status} onChange={e => setStatus(e.target.value)}
              options={[{value:'Received',label:'Fully Received'},{value:'Partial',label:'Partial'},{value:'Pending',label:'Pending'}]} />
            <Input label="Amount (₹)" type="number" step="0.01" value={splitOn ? String(((parseFloat(cashAmt)||0) + (parseFloat(onlineAmt)||0)) || '') : amtReceived}
              disabled={splitOn} onChange={e => setAmtReceived(e.target.value)} />
          </div>

          {mode !== 'Advance' && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" checked={splitOn} onChange={e => setSplitOn(e.target.checked)} />
              Split this receipt — part cash, part online
            </label>
          )}

          {splitOn ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Cash (₹)" type="number" step="0.01" value={cashAmt} onChange={e => setCashAmt(e.target.value)} />
                <Input label="Online / Bank (₹)" type="number" step="0.01" value={onlineAmt} onChange={e => setOnlineAmt(e.target.value)} />
              </div>
              <DateInput label="Date" value={date} onChange={e => setDate(e.target.value)} />
              <p className="text-[11px] text-blue-800">
                Each part is posted separately — the cash part to the <strong>Cash Book</strong> and the online part to
                the <strong>Bank Ledger</strong> — so both are traceable on their own. The Amount above is the two added
                together and cannot be typed over, otherwise the sale and the ledgers could disagree.
                {(parseFloat(onlineAmt) || 0) > 0 && !bankId && (
                  <span className="block mt-1 text-red-600 font-medium">Pick a Bank Account below for the online part.</span>
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Select label="Payment Mode" value={mode} onChange={e => { setMode(e.target.value); setSelectedAdvanceId('') }}
                options={paymentModeOptions} />
              <DateInput label="Date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          )}
          {mode === 'Advance' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Select Advance Entry</label>
              <select
                value={selectedAdvanceId}
                onChange={e => {
                  setSelectedAdvanceId(e.target.value)
                  const adv = (partyAdvances as any[]).find(a => a.id === e.target.value)
                  if (adv) setAmtReceived(Math.min(adv.amount - adv.amount_used, parseFloat(amtReceived) || (sale.amount ?? 0)).toString())
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Select advance —</option>
                {(partyAdvances as any[]).map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {fmtDate(a.advance_date)} · {a.payment_mode} · Balance: {inr(a.amount - a.amount_used)}
                    {a.reference_no ? ` (${a.reference_no})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {(splitOn ? (parseFloat(cashAmt) || 0) > 0 : mode === 'Cash') && (
            <Select label="Cash Location" value={cashFarmId} onChange={e => setCashFarmId(e.target.value)}
              options={cashLocationOptions} />
          )}
          {(splitOn ? (parseFloat(onlineAmt) || 0) > 0 : (mode !== 'Cash' && mode !== 'Advance')) && (
            <Select label="Bank Account" placeholder="— Select bank —" value={bankId} onChange={e => setBankId(e.target.value)}
              options={bankOptions} />
          )}
          {(splitOn ? (parseFloat(onlineAmt) || 0) > 0 : (mode === 'Bank Transfer' || mode === 'UPI' || mode === 'Cheque')) && (
            <Input label={mode === 'Cheque' ? 'Cheque No' : 'UTR / Reference No'} value={utr} onChange={e => setUtr(e.target.value)} placeholder="Transaction reference" />
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} loading={saving} className="flex-1">Save Receipt</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ── Refund Excess Payment Modal ────────────────────────────────────
// When a buyer overpays a Cull Bird (or other NHE) sale, this posts the
// refund as a Bank Ledger Debit linked back to the sale (nhe_sale_id), so
// the full receive → refund cycle stays traceable instead of a silent,
// unlinked manual withdrawal.
const RefundExcessModal: React.FC<{
  open: boolean; sale: any; bankAccounts: any[]; onClose: () => void; onSaved: () => void
}> = ({ open, sale, bankAccounts, onClose, onSaved }) => {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [bankAccountId, setBankAccountId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && sale) {
      const excess = Math.max(0, (Number(sale.amount_received) || 0) - (Number(sale.amount) || 0))
      setAmount(excess ? String(excess) : '')
      setDate(today())
      setBankAccountId(sale.refund_bank_account_id ?? '')
    }
  }, [open, sale])

  if (!open || !sale) return null

  const handleSave = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.error('Enter a valid refund amount'); return }
    if (!bankAccountId) { toast.error('Select the bank account the refund is paid from'); return }
    setSaving(true)
    try {
      const { data: txn, error: txnErr } = await supabase.from('bank_transactions').insert({
        bank_account_id: bankAccountId, txn_date: date, txn_type: 'Debit',
        category: 'Refund — Excess Payment', amount: amt,
        description: `Refund to ${sale.parties?.name ?? 'party'} — excess on Cull Bird sale ${sale.dc_no ? 'DC#'+sale.dc_no : ''}`.trim(),
        party_id: sale.party_id ?? null,
        nhe_sale_id: sale.id,
      }).select('id').single()
      if (txnErr) throw txnErr
      const { error } = await supabase.from('nhe_sales').update({
        refund_amount: amt, refund_date: date, refund_bank_account_id: bankAccountId, refund_bank_txn_id: txn.id,
      }).eq('id', sale.id)
      if (error) throw error
      toast.success('Refund recorded and posted to Bank Ledger')
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const excess = Math.max(0, (Number(sale.amount_received) || 0) - (Number(sale.amount) || 0))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Refund Excess Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <p className="text-xs text-gray-500">
          Invoice: {inr(sale.amount)} · Received: {inr(sale.amount_received)}
          {excess > 0 && <span className="text-orange-600 font-medium"> · Excess: {inr(excess)}</span>}
        </p>
        <Input label="Refund Amount (₹)" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
        <div>
          <label className="text-sm font-medium text-gray-700">Date</label>
          <DateInput value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <Select label="Refund From Bank Account" placeholder="— Select —" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)}
          options={bankAccounts.map((b: any) => ({ value: b.id, label: `${b.bank_name}${b.account_name ? ' — '+b.account_name : ''}` }))} />
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} loading={saving} className="flex-1">Save Refund</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// Reverse party_advances.amount_used for sales paid via Advance before they
// are deleted — otherwise the advance stays permanently consumed by a sale
// that no longer exists.
async function reverseAdvanceAdjustments(rows: any[]) {
  for (const r of rows ?? []) {
    if (r.party_advance_id && (r.advance_adjusted ?? 0) > 0) {
      const { data: adv } = await supabase.from('party_advances')
        .select('amount_used').eq('id', r.party_advance_id).single()
      if (adv) {
        await supabase.from('party_advances')
          .update({ amount_used: Math.max(0, adv.amount_used - r.advance_adjusted) })
          .eq('id', r.party_advance_id)
      }
    }
  }
}

// ── CSV helper ────────────────────────────────────────────────────
function exportFlatCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

// ── Bulk selection helpers ────────────────────────────────────────
const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

const BulkBar: React.FC<{ count: number; onDelete: () => void; onClear: () => void; loading?: boolean; extraAction?: React.ReactNode }> = ({ count, onDelete, onClear, loading, extraAction }) => count === 0 ? null : (
  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
    <span className="text-sm font-medium text-red-700">{count} selected</span>
    <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
    <div className="ml-auto flex items-center gap-2">
      {extraAction}
      <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} loading={loading} onClick={onDelete}>Delete {count} rows</Button>
    </div>
  </div>
)

// ── Consolidate to Invoice ──────────────────────────────────────────
// Stamps ONE shared invoice number across many selected rows — e.g. a
// month's worth of daily dispatches to the same buyer, or C-grade eggs
// from several different flocks that go out on a single invoice.
const ConsolidateInvoiceModal: React.FC<{
  open: boolean; ids: string[]; table: 'nhe_sales' | 'he_dispatch'; onClose: () => void; onSaved: () => void
}> = ({ open, ids, table, onClose, onSaved }) => {
  const [invoiceNo, setInvoiceNo] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (open) setInvoiceNo('') }, [open])
  if (!open) return null

  const handleSave = async () => {
    if (!invoiceNo.trim()) { toast.error('Enter an invoice number'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from(table).update({ invoice_no: invoiceNo.trim() }).in('id', ids)
      if (error) throw error
      toast.success(`Invoice ${invoiceNo.trim()} applied to ${ids.length} rows`)
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Consolidate to One Invoice</h3>
        <p className="text-xs text-gray-500">Stamps the same invoice number on all {ids.length} selected rows — e.g. a month's daily dispatches, or several flocks' eggs going out on one invoice.</p>
        <Input label="Invoice No" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. INV/2026-27/0142" />
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} loading={saving} className="flex-1">Apply to {ids.length} rows</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

const ConfirmBulkDelete: React.FC<{ label: string; onConfirm: () => void; onCancel: () => void }> = ({ label, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl shadow-xl p-6 w-80">
      <p className="font-semibold text-gray-900 mb-1">Delete records?</p>
      <p className="text-sm text-gray-500 mb-5">{label}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" size="sm" onClick={onConfirm}>Delete</Button>
      </div>
    </div>
  </div>
)

// ── TEMPERATURE LOG (attachment + summary + compliance, not every raw
// per-minute logger reading — see the vehicle's own PDF export for that) ──
const TempLogModal: React.FC<{ dispatch: any; onClose: () => void; onSaved: () => void }> = ({ dispatch, onClose, onSaved }) => {
  const [vehicleNo, setVehicleNo] = useState('')
  const [tempMin, setTempMin] = useState('')
  const [tempMax, setTempMax] = useState('')
  const [tempAvg, setTempAvg] = useState('')
  const [safeMax, setSafeMax] = useState('25')
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [readingCount, setReadingCount] = useState<number | null>(null)

  const onFileChange = async (f: File | null) => {
    setFile(f)
    setReadingCount(null)
    if (!f) return
    setParsing(true)
    try {
      const readings = await extractTempReadings(f)
      if (readings.length > 0) {
        const min = Math.min(...readings), max = Math.max(...readings)
        const avg = readings.reduce((s, n) => s + n, 0) / readings.length
        setTempMin(min.toFixed(1)); setTempMax(max.toFixed(1)); setTempAvg(avg.toFixed(1))
        setReadingCount(readings.length)
        toast.success(`Auto-calculated from ${readings.length} readings — adjust below if needed`)
      } else {
        toast.error("Couldn't auto-read temperatures from this file — enter Min/Max/Avg manually")
      }
    } catch (e: any) {
      toast.error('Could not parse file: ' + e.message)
    } finally { setParsing(false) }
  }

  useEffect(() => {
    if (dispatch) {
      setVehicleNo(dispatch.lorry_no ?? dispatch.vehicle_no ?? '')
      setTempMin(dispatch.temp_min?.toString() ?? '')
      setTempMax(dispatch.temp_max?.toString() ?? '')
      setTempAvg(dispatch.temp_avg?.toString() ?? '')
      setSafeMax(dispatch.temp_safe_max?.toString() ?? '25')
      setRemarks(dispatch.temp_remarks ?? '')
      setFile(null)
    }
  }, [dispatch])

  if (!dispatch) return null

  const save = async () => {
    setSaving(true)
    try {
      let temp_log_url = dispatch.temp_log_url ?? null
      let temp_log_name = dispatch.temp_log_name ?? null
      if (file) {
        const path = `${dispatch.id}/${Date.now()}_${file.name}`
        const { error: upErr } = await supabase.storage.from('dispatch-attachments').upload(path, file)
        if (upErr) throw upErr
        temp_log_url = supabase.storage.from('dispatch-attachments').getPublicUrl(path).data.publicUrl
        temp_log_name = file.name
      }
      const max = parseFloat(tempMax)
      const safe = parseFloat(safeMax)
      const temp_compliant = !isNaN(max) && !isNaN(safe) ? max <= safe : null
      const { error } = await supabase.from('he_dispatch').update({
        vehicle_no: vehicleNo || null,
        temp_log_url, temp_log_name,
        temp_min: tempMin ? parseFloat(tempMin) : null,
        temp_max: tempMax ? parseFloat(tempMax) : null,
        temp_avg: tempAvg ? parseFloat(tempAvg) : null,
        temp_safe_max: safe || 25,
        temp_compliant,
        temp_remarks: remarks || null,
      }).eq('id', dispatch.id)
      if (error) throw error
      toast.success('Temperature log saved')
      onSaved()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal open={!!dispatch} onClose={onClose} title={`Temperature Log — ${dispatch.invoice_no ?? dispatch.dc_no ?? ''}`}
      footer={<Button loading={saving} onClick={save}>Save</Button>}>
      <div className="space-y-3">
        <p className="text-xs text-gray-500">Upload the logger's report (PDF/CSV/Excel) — Min/Max/Avg are read from it automatically, not typed by hand.</p>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Logger Report (PDF/CSV/Excel)</label>
          <input type="file" accept=".pdf,.csv,.xlsx" onChange={e => onFileChange(e.target.files?.[0] ?? null)} className="text-sm" disabled={parsing} />
          {parsing && <p className="text-xs text-blue-600 mt-1">Reading temperatures from file…</p>}
          {readingCount != null && !parsing && <p className="text-xs text-green-600 mt-1">✓ Auto-calculated from {readingCount} readings</p>}
          {dispatch.temp_log_url && !file && (
            <a href={dispatch.temp_log_url} target="_blank" rel="noreferrer" className="block mt-1 text-xs text-blue-600 underline">
              📎 {dispatch.temp_log_name ?? 'View current file'}
            </a>
          )}
        </div>
        <FormRow>
          <Input label="Vehicle No" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} />
          <Input label="Safe Max Temp (°C)" type="number" step="0.1" value={safeMax} onChange={e => setSafeMax(e.target.value)} />
        </FormRow>
        <FormRow cols={3}>
          <Input label="Min Temp (°C)" type="number" step="0.1" value={tempMin} onChange={e => setTempMin(e.target.value)} hint="Auto-filled from file, editable" />
          <Input label="Max Temp (°C)" type="number" step="0.1" value={tempMax} onChange={e => setTempMax(e.target.value)} hint="Auto-filled from file, editable" />
          <Input label="Avg Temp (°C)" type="number" step="0.1" value={tempAvg} onChange={e => setTempAvg(e.target.value)} hint="Auto-filled from file, editable" />
        </FormRow>
        <Input label="Remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
      </div>
    </Modal>
  )
}

// ── HE DISPATCH ──────────────────────────────────────────────────
export const HEDispatch: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [flockFilter, setFlockFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [consolidateOpen, setConsolidateOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [noInvoiceOnly, setNoInvoiceOnly] = useState(false)
  const [hePartyFilter, setHePartyFilter] = useState('')
  const [tab, setTab] = useState<'dispatch'|'stock'>('dispatch')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [receiptSale, setReceiptSale] = useState<any>(null)
  const [expandedDispatch, setExpandedDispatch] = useState<string|null>(null)
  const [expandedLines, setExpandedLines] = useState<any[]>([])
  const [printTarget, setPrintTarget] = useState<any>(null)
  const [tempLogTarget, setTempLogTarget] = useState<any>(null)
  const [printOpts, setPrintOpts] = useState({
    companyAddr: true, buyerDetails: true, bankDetails: true, supplyDetails: true,
    lorry: true, driver: false, outTime: true, boxes: true
  })

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => { const { data } = await supabase.from('bank_accounts').select('id,bank_name,account_name').eq('is_active', true).order('bank_name'); return data ?? [] }
  })

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').order('name'); return data ?? [] }
  })

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,status,laying_farm_id,rearing_farm_id,placement_date').eq('is_vhl_contract', false).order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q
      return data ?? []
    }
  })

  const { data: parties } = useQuery({
    queryKey: ['parties_buyers'],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id,name,state_code,gstin')
        .in('type', ['buyer','both']).eq('is_active', true).order('name')
      return data ?? []
    }
  })

  const { data: hatcheries } = useQuery({
    queryKey: ['hatcheries'],
    queryFn: async () => {
      const { data } = await supabase.from('hatcheries').select('id,name').order('name')
      return data ?? []
    }
  })

  const hasFilter = !!(flockFilter || fromDate || toDate)

  const { data: dispatches, isLoading } = useQuery({
    queryKey: ['he_dispatch', flockFilter, fromDate, toDate],
    queryFn: async () => {
      const build = () => {
        let q = supabase.from('he_dispatch')
          .select('*, flocks(flock_no,placement_date), parties(name,address,contact), hatcheries(name), he_dispatch_lines(prod_date,grade_a,grade_b,grade_c,rate)')
          .order('dispatch_date', { ascending: false })
        if (flockFilter) q = q.eq('flock_id', flockFilter)
        if (fromDate) q = q.gte('dispatch_date', fromDate)
        if (toDate) q = q.lte('dispatch_date', toDate)
        return q
      }
      // Same rule as NHE Sales: latest 200 unfiltered (fast default), but a
      // filtered view must return every match, paging past the 1000 cap.
      // Load every dispatch. The old 200 cap made an unfiltered list -- and the
      // totals with it -- silently partial. Length is handled by paging the
      // table instead, so nothing is hidden from the figures.
      return fetchAllPages<any>((from, to) => build().range(from, to), 'HE Dispatch', toast.error)
    }
  })

  // Weekly Association rate register — auto-suggests the line rate from the
  // production date's Sun-Sat week, plus this buyer's rate differential
  // (e.g. Hitech = Association - 1.5), if the line's rate hasn't been typed yet.
  const { data: rateRegister = [] } = useQuery({
    queryKey: ['he_rate_register_lookup'],
    queryFn: async () => { const { data } = await supabase.from('he_rate_register').select('week_start,week_end,rate'); return data ?? [] }
  })
  const { data: vendorDiffs = [] } = useQuery({
    queryKey: ['he_vendor_rate_diff_lookup'],
    queryFn: async () => { const { data } = await supabase.from('he_vendor_rate_diff').select('party_id,diff'); return data ?? [] }
  })
  // Age-banded vendor rules (see migration 667). Hitech pays (Association -
  // 1.50) less 35% while a flock is young, and (Association - 1.50) from
  // 30/1 onward, so the rate depends on the FLOCK's age on the production
  // date -- not on the buyer alone.
  const { data: vendorTiers = [] } = useQuery({
    queryKey: ['he_vendor_rate_tier_lookup'],
    queryFn: async () => { const { data } = await supabase.from('he_vendor_rate_tier')
      .select('party_id,flock_id,age_from_days,age_to_days,diff,pct_less'); return data ?? [] }
  })
  const suggestedRate = (date: string, partyId?: string, flockId?: string) => {
    const base = rateRegister.find((r: any) => date >= r.week_start && date <= r.week_end)?.rate
    if (base == null) return null
    if (partyId) {
      // Age on the PRODUCTION date, the same date the Association week is taken
      // from, so both halves of the price describe the same eggs.
      const placement = flocks?.find((f: any) => f.id === flockId)?.placement_date
      const ageDays = placement && date
        ? Math.round((new Date(date + 'T00:00:00').getTime() - new Date(placement + 'T00:00:00').getTime()) / 86400000)
        : null
      const tier = (vendorTiers as any[]).find((t: any) =>
        t.party_id === partyId &&
        (!t.flock_id || t.flock_id === flockId) &&
        ageDays != null &&
        ageDays >= t.age_from_days &&
        (t.age_to_days == null || ageDays <= t.age_to_days))
      // The two parts chain in this order: subtract the differential, THEN take
      // the percentage off. Association 25.75 - 1.5 = 24.25, less 35% = 15.76.
      // Reversing them gives 15.24 on the same numbers.
      if (tier) return Math.round((Number(base) + Number(tier.diff)) * (1 - Number(tier.pct_less) / 100) * 100) / 100
      // No tier matched -- either this vendor has no age rules, or the flock has
      // no placement date to age it by. Fall back to the flat differential
      // rather than silently pricing at the bare Association rate.
      const diff = vendorDiffs.find((d: any) => d.party_id === partyId)?.diff ?? 0
      return Number(base) + Number(diff)
    }
    return Number(base)
  }

  // Dispatch lines: one row per production date with grade split
  type DispLine = { prod_date: string; grade_a: string; grade_b: string; grade_c: string; rate: string }
  const emptyLine = (): DispLine => ({ prod_date: today(), grade_a: '', grade_b: '', grade_c: '', rate: '' })
  const [lines, setLines] = useState<DispLine[]>([emptyLine()])
  const addLine = () => setLines(ls => [...ls, emptyLine()])
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i))

  const [form, setForm] = useState({
    flock_id: '', dispatch_date: today(),
    dc_no: '', invoice_no: '', party_id: '',
    free_eggs: '0', rate: '', amount: '', tds_pct: '0', tds_amount: '0',
    boxes_20lb: '', boxes_23lb: '', extra_trays_20lb: '', extra_trays_23lb: '', vehicle_type: '', lorry_no: '', driver_phone: '', out_time: '', remarks: ''
  })
  const [invSeries, setInvSeries] = useState('HHF')
  const [genningInv, setGenningInv] = useState(false)
  const [peekInv, setPeekInv] = useState<string | null>(null)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setLine = (i: number, k: keyof DispLine, v: string) =>
    setLines(ls => ls.map((l, idx) => {
      if (idx !== i) return l
      const next = { ...l, [k]: v }
      if (k === 'prod_date' && !l.rate) {
        const sugg = suggestedRate(v, form.party_id, form.flock_id)
        if (sugg != null) next.rate = String(sugg)
      }
      return next
    }))
  // Buyer picked (or changed) after lines already exist with their default
  // today()'s date — backfill any line whose rate is still blank, since the
  // per-line date onChange only fires when the date itself is edited.
  useEffect(() => {
    if (!form.party_id) return
    setLines(ls => ls.map(l => {
      if (l.rate) return l
      const sugg = suggestedRate(l.prod_date, form.party_id, form.flock_id)
      return sugg != null ? { ...l, rate: String(sugg) } : l
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.party_id, form.flock_id, rateRegister, vendorDiffs, vendorTiers])
  // Draft autosave -- database-backed (not the browser), keyed to the
  // dispatch being edited or 'new'. Restoring only fills the form; Save still
  // goes through the normal insert/update path, so a restore can never slip
  // in as a duplicate row. Cleared automatically the moment a save succeeds.
  const heDraftKey = editing?.id ?? 'new'
  const { draft: heDraft, draftChecked: heDraftChecked, saveDraft: saveHeDraft, clearDraft } = useFormDraft('he_dispatch', heDraftKey, showForm)
  const [heDraftDismissed, setHeDraftDismissed] = useState(false)
  useEffect(() => {
    if (!showForm) return
    saveHeDraft({ form, lines })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, lines, showForm])
  // Preview next invoice number without consuming it (counter not changed)
  const genInvoice = async () => {
    setGenningInv(true)
    try {
      const { data, error } = await supabase.rpc('fn_peek_invoice', { p_code: invSeries })
      if (error) throw error
      s('invoice_no', data as string)
      setPeekInv(data as string)
      toast.success(`Preview: ${data} — will be confirmed on Save`)
    } catch (e: any) { toast.error(e.message) }
    finally { setGenningInv(false) }
  }

  // Totals from lines
  const lineTotal = (f: keyof DispLine) => lines.reduce((sum, l) => sum + (parseInt((l as any)[f]) || 0), 0)
  const totalFromLines = lineTotal('grade_a') + lineTotal('grade_b') + lineTotal('grade_c')
  const freeEggsCount = parseInt(form.free_eggs) || 0
  const invoiceEggs = totalFromLines - freeEggsCount
  const headerRate = parseFloat(form.rate) || 0
  // Gross = sum of ALL eggs × their effective rate (including free eggs)
  const grossTotal = lines.reduce((sum, l) => {
    const qty = (parseInt(l.grade_a)||0) + (parseInt(l.grade_b)||0) + (parseInt(l.grade_c)||0)
    const r = parseFloat(l.rate) || headerRate
    return sum + qty * r
  }, 0)
  // autoAmount: when header rate set → exact (invoiceEggs × rate); else proportional
  // autoAmount: exact calc then standard round (< 0.5 → down, ≥ 0.5 → up)
  const rawAmount = headerRate > 0
    ? invoiceEggs * headerRate
    : (totalFromLines > 0 ? grossTotal * invoiceEggs / totalFromLines : 0)
  const autoAmount = Math.round(rawAmount)
  const effectiveAmount = parseFloat(form.amount) || autoAmount || 0
  const autoTds = parseFloat(form.tds_pct) > 0 ? Math.round(effectiveAmount * parseFloat(form.tds_pct) / 100 * 100) / 100 : 0

  const openForm = (row?: any) => {
    setHeDraftDismissed(false)
    if (row) {
      setEditing(row)
      setForm({
        flock_id: row.flock_id, dispatch_date: row.dispatch_date,
        dc_no: row.dc_no?.toString() ?? '', invoice_no: row.invoice_no ?? '',
        party_id: row.party_id ?? '',
        free_eggs: row.free_eggs?.toString() ?? '0', rate: row.rate?.toString() ?? '',
        amount: row.amount?.toString() ?? '',
        tds_pct: row.tds_pct?.toString() ?? '0', tds_amount: row.tds_amount?.toString() ?? '0',
        boxes_20lb: row.boxes_20lb?.toString() ?? '', boxes_23lb: row.boxes_23lb?.toString() ?? '',
        extra_trays_20lb: row.extra_trays_20lb?.toString() ?? '', extra_trays_23lb: row.extra_trays_23lb?.toString() ?? '',
        vehicle_type: row.vehicle_type ?? '', lorry_no: row.lorry_no ?? '',
        driver_phone: row.driver_phone ?? '', out_time: row.out_time ?? '', remarks: row.remarks ?? ''
      })
      // Load existing lines for this dispatch
      supabase.from('he_dispatch_lines').select('*').eq('dispatch_id', row.id).order('prod_date')
        .then(({ data }) => {
          if (data && data.length > 0)
            setLines(data.map((l: any) => ({
              prod_date: l.prod_date, grade_a: l.grade_a?.toString() ?? '',
              grade_b: l.grade_b?.toString() ?? '', grade_c: l.grade_c?.toString() ?? '',
              rate: l.rate?.toString() ?? ''
            })))
          else
            setLines([{ prod_date: row.prod_date ?? today(), grade_a: row.grade_a?.toString() ?? '', grade_b: row.grade_b?.toString() ?? '', grade_c: row.grade_c?.toString() ?? '0', rate: row.rate?.toString() ?? '' }])
        })
    } else {
      setEditing(null)
      setPeekInv(null)
      setForm({ flock_id: flockFilter, dispatch_date: today(), dc_no: '', invoice_no: '',
        party_id: '', free_eggs: '0', rate: '', amount: '', tds_pct: '0', tds_amount: '0',
        boxes_20lb: '', boxes_23lb: '', extra_trays_20lb: '', extra_trays_23lb: '', vehicle_type: '', lorry_no: '', driver_phone: '', out_time: '', remarks: '' })
      setLines([emptyLine()])
    }
    setShowForm(true)
  }

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: dispatches } = await supabase
        .from('he_dispatch')
        .select('id, flock_id, dispatch_date, invoice_no, amount, party_advance_id, advance_adjusted')
        .in('id', ids)
      await reverseAdvanceAdjustments(dispatches ?? [])
      // By FK CASCADE; also explicit for safety
      await supabase.from('cash_book').delete().in('he_dispatch_id', ids)
      await supabase.from('bank_transactions').delete().in('he_dispatch_id', ids)
      // Fallback for old unlinked entries
      if (dispatches && dispatches.length > 0) {
        for (const d of dispatches) {
          await supabase.from('cash_book').delete()
            .is('he_dispatch_id', null)
            .eq('flock_id', d.flock_id)
            .eq('txn_date', d.dispatch_date)
            .eq('amount_in', d.amount)
            .eq('txn_type', 'receipt')
            .eq('payment_mode', 'cash')
        }
      }
      const { error } = await supabase.from('he_dispatch').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['he_dispatch'] }); setSel(new Set()); setBulkConfirm(false) },
    onError: (e: any) => toast.error(e.message),
  })

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.flock_id || !form.dispatch_date) throw new Error('Flock and dispatch date required')
      if (lines.length === 0 || totalFromLines === 0) throw new Error('Add at least one production line with qty')
      const gradeA = lineTotal('grade_a'), gradeB = lineTotal('grade_b'), gradeC = lineTotal('grade_c')
      // first/last prod dates from lines
      const sortedDates = lines.map(l => l.prod_date).filter(Boolean).sort()
      const prodDateFrom = sortedDates[0] || null
      const prodDateTo = sortedDates.length > 1 ? sortedDates[sortedDates.length - 1] : null
      const inv = totalFromLines - (parseInt(form.free_eggs)||0)
      const heAmount = parseFloat(form.amount) || autoAmount || 0
      // Effective rate: use header rate if typed; else weighted avg from lines (heAmount / invoiceEggs)
      const effectiveRate = parseFloat(form.rate) || (inv > 0 && heAmount > 0 ? Math.round(heAmount / inv * 10000) / 10000 : null)
      const buyer = (parties ?? []).find((p: any) => p.id === form.party_id)
      const heSupply = supplyType(buyer?.state_code)   // HE eggs are 0% exempt → no tax
      // If user clicked Generate (preview), consume the real invoice number now at save time
      let finalInvoiceNo = form.invoice_no || null
      if (form.invoice_no && form.invoice_no === peekInv) {
        const { data: realInv, error: invErr } = await supabase.rpc('fn_next_invoice', { p_code: invSeries })
        if (invErr) throw invErr
        finalInvoiceNo = realInv as string
      }
      const payload = {
        flock_id: form.flock_id, dispatch_date: form.dispatch_date,
        prod_date: prodDateFrom, prod_date_to: prodDateTo,
        dc_no: parseInt(form.dc_no) || null, invoice_no: finalInvoiceNo,
        party_id: form.party_id || null,
        grade_a: gradeA, grade_b: gradeB, grade_c: gradeC,
        total_dispatched: totalFromLines,
        free_eggs: parseInt(form.free_eggs) || 0,
        invoice_eggs: inv, rate: effectiveRate,
        amount: heAmount || null,
        supply_type: heSupply, gst_pct: 0, taxable_value: heAmount || null,
        cgst_amount: 0, sgst_amount: 0, igst_amount: 0,
        buyer_gstin: buyer?.gstin || null, hsn_code: '0407',
        tds_pct: parseFloat(form.tds_pct) || 0,
        tds_amount: parseFloat(form.tds_amount) || 0,
        boxes_20lb: parseInt(form.boxes_20lb) || 0,
        boxes_23lb: parseInt(form.boxes_23lb) || 0,
        extra_trays_20lb: parseInt(form.extra_trays_20lb) || 0,
        extra_trays_23lb: parseInt(form.extra_trays_23lb) || 0,
        vehicle_type: form.vehicle_type || null,
        lorry_no: form.lorry_no || null,
        driver_phone: form.driver_phone || null,
        out_time: form.out_time || null,
        remarks: form.remarks || null
      }
      let dispatchId: string
      if (editing) {
        const { error } = await supabase.from('he_dispatch').update(payload).eq('id', editing.id)
        if (error) throw error
        dispatchId = editing.id
        // Delete old lines and re-insert
        await supabase.from('he_dispatch_lines').delete().eq('dispatch_id', dispatchId)
      } else {
        const { data, error } = await supabase.from('he_dispatch').insert(payload).select('id').single()
        if (error) throw error
        dispatchId = data.id
      }
      // Insert lines
      const linePayload = lines
        .filter(l => l.prod_date && (parseInt(l.grade_a)||0) + (parseInt(l.grade_b)||0) + (parseInt(l.grade_c)||0) > 0)
        .map(l => ({
          dispatch_id: dispatchId,
          flock_id: form.flock_id,
          prod_date: l.prod_date,
          grade_a: parseInt(l.grade_a) || 0,
          grade_b: parseInt(l.grade_b) || 0,
          grade_c: parseInt(l.grade_c) || 0,
          rate: parseFloat(l.rate) || parseFloat(form.rate) || null
        }))
      if (linePayload.length > 0) {
        const { error } = await supabase.from('he_dispatch_lines').insert(linePayload)
        if (error) throw error
      }
    },
    onSuccess: () => { toast.success('Saved!'); clearDraft(heDraftKey); qc.invalidateQueries({ queryKey: ['he_dispatch'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.message)
  })

  const filtered = (dispatches ?? []).filter((d: any) => {
    if (noInvoiceOnly && d.invoice_no) return false
    if (hePartyFilter.trim()) {
      const q = hePartyFilter.trim().toLowerCase()
      if (!String(d.parties?.name ?? '').toLowerCase().includes(q) &&
          !String(d.dc_no ?? '').toLowerCase().includes(q) &&
          !String(d.invoice_no ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })
  const totalDisp = filtered.reduce((s: number, d: any) => s + d.total_dispatched, 0)
  const totalAmt  = filtered.reduce((s: number, d: any) => s + (d.amount ?? 0), 0)
  const totalFree = filtered.reduce((s: number, d: any) => s + (d.free_eggs ?? 0), 0)
  const totalTds  = filtered.reduce((s: number, d: any) => s + (d.tds_amount ?? 0), 0)
  const totalInvQty = filtered.reduce((s: number, d: any) => s + (d.invoice_eggs ?? 0), 0)
  const pgHE = usePagination(filtered.length, `${noInvoiceOnly}|${hePartyFilter}`)
  const pageDispatches = filtered.slice(pgHE.from, pgHE.to)

  const noInvoiceCount = (dispatches ?? []).filter((d: any) => !d.invoice_no).length

  // Stock register — same logic as Reports → Egg Stock Balance day-wise view
  const { data: stockData } = useQuery({
    queryKey: ['he_stock_register', flockFilter],
    queryFn: async () => {
      // Every one of these four reads was a bare select, which the server caps
      // at 1,000 rows without saying so. Flock 19 alone holds 1,681 daily rows
      // (4 sheds x 350 days): the 1,000th falls on 18/01/2026, which is the
      // exact day its egg figures stopped appearing here while All Flock Data
      // carried on to 03/07/2026. 682 rows over 141 days were simply not read.
      // Each query is rebuilt per page — a Supabase query object cannot be
      // reused once it has been sent.
      const build = () => {
        let dq = supabase.from('daily_records')
          .select('record_date,flock_id,he_grade_a,he_grade_b,he_grade_c,wastage_he,flocks(flock_no)')
          .order('record_date', { ascending: true })
        // Inner join so only lines with a valid dispatch are included (matches EggStock logic)
        let lq = supabase.from('he_dispatch_lines')
          .select('flock_id,grade_a,grade_b,grade_c,he_dispatch!inner(dispatch_date,flock_id)')
          .order('he_dispatch(dispatch_date)', { ascending: true })
        let oq = supabase.from('egg_opening_stock')
          .select('flock_id,he_grade_a,he_grade_b,he_grade_c,flocks(flock_no)')
        // Egg Conversions (e.g. HE Grade C -> TE) previously weren't read here
        // at all, so converted eggs stayed in HE stock AND became sellable
        // again as the converted-to type — double-counted.
        let cq = supabase.from('egg_conversions')
          .select('flock_id,conversion_date,from_type,from_qty')
        if (flockFilter) {
          dq = dq.eq('flock_id', flockFilter)
          lq = lq.eq('flock_id', flockFilter)
          oq = oq.eq('flock_id', flockFilter)
          cq = cq.eq('flock_id', flockFilter)
        }
        return { dq, lq, oq, cq }
      }
      const [prod, rawLines, opening, conversions] = await Promise.all([
        fetchAllPages<any>((f, t) => build().dq.range(f, t), 'Stock register — production'),
        fetchAllPages<any>((f, t) => build().lq.range(f, t), 'Stock register — dispatch lines'),
        fetchAllPages<any>((f, t) => build().oq.range(f, t), 'Stock register — opening stock'),
        fetchAllPages<any>((f, t) => build().cq.range(f, t), 'Stock register — egg conversions'),
      ])

      // Flatten dispatch lines to use dispatch_date (same as EggStock heDisp)
      const dispLines = (rawLines ?? []).map((l: any) => ({
        flock_id: l.flock_id,
        dispatch_date: l.he_dispatch?.dispatch_date as string,
        grade_a: l.grade_a ?? 0,
        grade_b: l.grade_b ?? 0,
        grade_c: l.grade_c ?? 0,
      })).filter((l: any) => !!l.dispatch_date)

      // Build per-flock opening stock
      const openMap: Record<string, { a: number; b: number; c: number }> = {}
      for (const o of (opening ?? [])) {
        openMap[o.flock_id] = { a: o.he_grade_a ?? 0, b: o.he_grade_b ?? 0, c: o.he_grade_c ?? 0 }
      }

      // Get unique flock IDs
      const flockIds = [...new Set([
        ...(prod ?? []).map((r: any) => r.flock_id),
        ...dispLines.map((l: any) => l.flock_id),
        ...(conversions ?? []).map((c: any) => c.flock_id),
      ])]

      // Per-flock running balance — same formula as EggStock day-wise
      const allRows: any[] = []
      for (const fid of flockIds) {
        const flockLabel = ((prod ?? []).find((r: any) => r.flock_id === fid) as any)?.flocks?.flock_no
        const op = openMap[fid] ?? { a: 0, b: 0, c: 0 }
        let balA = op.a, balB = op.b, balC = op.c

        const flockConversions = (conversions ?? []).filter((c: any) => c.flock_id === fid)

        const dateSet = new Set<string>()
        ;(prod ?? []).filter((r: any) => r.flock_id === fid).forEach((r: any) => dateSet.add(r.record_date))
        dispLines.filter((l: any) => l.flock_id === fid).forEach((l: any) => dateSet.add(l.dispatch_date))
        flockConversions.forEach((c: any) => dateSet.add(c.conversion_date))
        const dates = [...dateSet].sort()

        for (const date of dates) {
          const dayProd = (prod ?? []).filter((r: any) => r.flock_id === fid && r.record_date === date)
          const pA = dayProd.reduce((s: number, r: any) => s + (r.he_grade_a ?? 0), 0)
          const pB = dayProd.reduce((s: number, r: any) => s + (r.he_grade_b ?? 0), 0)
          const pC = dayProd.reduce((s: number, r: any) => s + (r.he_grade_c ?? 0), 0)
          const wHE = dayProd.reduce((s: number, r: any) => s + (r.wastage_he ?? 0), 0)

          const dayDisp = dispLines.filter((l: any) => l.flock_id === fid && l.dispatch_date === date)
          const dA = dayDisp.reduce((s: number, l: any) => s + l.grade_a, 0)
          const dB = dayDisp.reduce((s: number, l: any) => s + l.grade_b, 0)
          const dC = dayDisp.reduce((s: number, l: any) => s + l.grade_c, 0)

          const dayConv = flockConversions.filter((c: any) => c.conversion_date === date && c.from_type === 'he_grade_c')
          const cC = dayConv.reduce((s: number, c: any) => s + (c.from_qty ?? 0), 0)

          const open_a = balA, open_b = balB, open_c = balC
          // Exactly matches EggStock: balA += pA - sA - wHE
          balA += pA - dA - wHE
          balB += pB - dB
          balC += pC - dC - cC

          allRows.push({
            date, flock_id: fid, flock: `F-${flockLabel ?? fid.slice(0,4)}`,
            prod_a: pA, prod_b: pB, prod_c: pC, wastage: wHE,
            disp_a: dA, disp_b: dB, disp_c: dC,
            open_a, open_b, open_c,
            bal_a: balA, bal_b: balB, bal_c: balC,
            bal_total: balA + balB + balC,
          })
        }
      }

      return allRows.sort((a, b) => b.date.localeCompare(a.date) || a.flock.localeCompare(b.flock))
    }
  })

  // The register's running balance is only correct when every earlier day has
  // been walked, so the date range is applied to the DISPLAY, never to the
  // calculation — stockData is always computed from the beginning of the flock.
  // A row shown for 05/08 therefore still carries the opening it really had,
  // not one restarted at the filter's From date.
  const stockRows = React.useMemo(() => (stockData ?? []).filter((r: any) =>
    (!fromDate || r.date >= fromDate) && (!toDate || r.date <= toDate)
  ), [stockData, fromDate, toDate])

  // Subtotals cover PRODUCTION and DISPATCH only. Opening and Balance are
  // point-in-time figures for one flock on one day — adding them down a column
  // that spans several days and several flocks would produce a number that
  // means nothing. The closing position is the latest row's balance, not a sum.
  const stockTotals = React.useMemo(() => stockRows.reduce((a: any, r: any) => ({
    prod_a: a.prod_a + (r.prod_a || 0), prod_b: a.prod_b + (r.prod_b || 0), prod_c: a.prod_c + (r.prod_c || 0),
    disp_a: a.disp_a + (r.disp_a || 0), disp_b: a.disp_b + (r.disp_b || 0), disp_c: a.disp_c + (r.disp_c || 0),
  }), { prod_a: 0, prod_b: 0, prod_c: 0, disp_a: 0, disp_b: 0, disp_c: 0 }), [stockRows])

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const partyOptions = parties?.map((p: any) => ({ value: p.id, label: p.name })) ?? []

  const dispIds = (dispatches ?? []).map((d: any) => d.id)
  const allSel = dispIds.length > 0 && dispIds.every((id: string) => sel.has(id))
  const someSel = dispIds.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? dispIds.forEach((id: string) => n.delete(id)) : dispIds.forEach((id: string) => n.add(id)); return n })

  // CSV template download
  const handleDownloadTemplate = () => {
    // ONE ROW PER PRODUCTION DATE. A dispatch normally carries eggs laid over
    // several days, each day with its own grades and often its own rate, and
    // that is exactly how the app stores it (he_dispatch_lines). The old
    // template allowed a single prod_date and a single rate, so a real
    // dispatch could not be imported at all without flattening it.
    //
    // Rows sharing flock_no + dispatch_date + dc_no become ONE dispatch with
    // a line per production date.
    const headers = 'flock_no,dispatch_date,dc_no,invoice_no,party_name,prod_date,grade_a,grade_b,grade_c,free_eggs,rate,'
      + 'boxes_20lb,boxes_23lb,extra_trays_20lb,extra_trays_23lb,vehicle_type,lorry_no,vehicle_no,driver_phone,out_time,'
      + 'tds_pct,temp_min,temp_max,temp_avg,temp_remarks,remarks'
    // The loading and vehicle details belong to the DISPATCH, not to a
    // production date, so they are read from the first row of each group and
    // may be left blank on the rest.
    const example = [
      '19,2025-06-10,101,HE/25-26/001,Party Name,2025-06-08,12000,800,200,0,5.20,140,60,12,8,Container,AP01AB1234,AP01AB1234,9876543210,18:30,0,18.5,24.2,21.0,within range,',
      '19,2025-06-10,101,HE/25-26/001,Party Name,2025-06-09,11500,900,150,100,5.20,,,,,,,,,,,,,,,100 free on this day',
      '19,2025-06-10,101,HE/25-26/001,Party Name,2025-06-10,12200,700,100,0,5.40,,,,,,,,,,,,,,,rate revised',
    ].join('\n')
    const notes = [
      '# One row per PRODUCTION DATE. Repeat flock_no, dispatch_date and dc_no on every row of the same dispatch.',
      '# Each row keeps its own grades and its own rate, so a rate change mid-dispatch is preserved.',
      '# free_eggs are given away, never billed. Amount = sum of (graded eggs less free) x that row rate.',
      '# Boxes, trays, vehicle, driver, out time and temperatures belong to the DISPATCH - fill them on the first row only.',
      '# out_time is free text as written on the DC, for example 18:30.',
    ].join('\n')
    const blob = new Blob([notes + '\n' + headers + '\n' + example], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'he_dispatch_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import handler (CSV or Excel)
  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const { headers: hdrs, rows: rawRows } = await parseFile(file)
      if (rawRows.length === 0) { toast.error('Empty file'); return }
      const records = rawRows.map(vals => { const obj: any = {}; hdrs.forEach((h,i) => { obj[h] = vals[i]??'' }); return obj })

      // Group by dispatch: rows sharing flock + dispatch_date + dc_no are one
      // dispatch made up of several production-date lines.
      type Line = { prod_date: string; grade_a: number; grade_b: number; grade_c: number; free: number; rate: number | null }
      const groups: Record<string, { flock_id: string | null; dispatch_date: string; dc_no: number | null;
                                     invoice_no: string | null; party_id: string | null; remarks: string | null;
                                     lines: Line[]; extra: Record<string, any> }> = {}

      for (const r of records as any[]) {
        const flockMatch = flocks?.find((f: any) => String(f.flock_no) === String(r.flock_no))
        const partyMatch = parties?.find((p: any) => p.name === r.party_name)
        const dispatchDate = r.dispatch_date || null
        if (!flockMatch?.id || !dispatchDate) continue
        const dcNo = parseInt(r.dc_no) || null
        const key = `${flockMatch.id}|${dispatchDate}|${dcNo ?? ''}`
        const g = (groups[key] ??= {
          flock_id: flockMatch.id, dispatch_date: dispatchDate, dc_no: dcNo,
          invoice_no: r.invoice_no || null, party_id: partyMatch?.id ?? null,
          remarks: r.remarks || null, lines: [], extra: {},
        })
        // Loading, vehicle and temperature belong to the dispatch. Take them
        // from whichever row of the group actually carries them, so they can
        // be written once on the first line and left blank on the rest.
        const numOrNull = (v: any) => (v !== '' && v != null && !isNaN(Number(v))) ? Number(v) : null
        const put = (k: string, v: any) => { if (v != null && v !== '' && g.extra[k] == null) g.extra[k] = v }
        put('boxes_20lb', numOrNull(r.boxes_20lb))
        put('boxes_23lb', numOrNull(r.boxes_23lb))
        put('extra_trays_20lb', numOrNull(r.extra_trays_20lb))
        put('extra_trays_23lb', numOrNull(r.extra_trays_23lb))
        put('vehicle_type', r.vehicle_type || null)
        put('lorry_no', r.lorry_no || null)
        put('vehicle_no', r.vehicle_no || null)
        put('driver_phone', r.driver_phone || null)
        put('out_time', r.out_time || null)
        put('tds_pct', numOrNull(r.tds_pct))
        put('temp_min', numOrNull(r.temp_min))
        put('temp_max', numOrNull(r.temp_max))
        put('temp_avg', numOrNull(r.temp_avg))
        put('temp_remarks', r.temp_remarks || null)
        if (!g.remarks && r.remarks) g.remarks = r.remarks
        g.lines.push({
          prod_date: r.prod_date || dispatchDate,
          grade_a: parseInt(r.grade_a) || 0,
          grade_b: parseInt(r.grade_b) || 0,
          grade_c: parseInt(r.grade_c) || 0,
          free: parseInt(r.free_eggs) || 0,
          rate: r.rate !== '' && r.rate != null ? parseFloat(r.rate) : null,
        })
      }

      const grouped = Object.values(groups)
      if (grouped.length === 0) {
        toast.error('No valid rows found. Check flock_no values match existing flocks.')
        return
      }

      const headerOf = (g: typeof grouped[number]) => {
        const gradeA = g.lines.reduce((s2, l) => s2 + l.grade_a, 0)
        const gradeB = g.lines.reduce((s2, l) => s2 + l.grade_b, 0)
        const gradeC = g.lines.reduce((s2, l) => s2 + l.grade_c, 0)
        const total = gradeA + gradeB + gradeC
        const free = g.lines.reduce((s2, l) => s2 + l.free, 0)
        // Each line is billed at ITS OWN rate, so a rate change part way
        // through a dispatch survives. The header rate is then whatever those
        // lines actually average out to, rather than the first one seen.
        const amount = g.lines.reduce((s2, l) => {
          const billable = (l.grade_a + l.grade_b + l.grade_c) - l.free
          return s2 + (l.rate != null ? billable * l.rate : 0)
        }, 0)
        const invoiceEggs = total - free
        const anyRate = g.lines.some(l => l.rate != null)
        return {
          flock_id: g.flock_id,
          dispatch_date: g.dispatch_date,
          prod_date: g.lines[0]?.prod_date ?? g.dispatch_date,
          dc_no: g.dc_no,
          invoice_no: g.invoice_no,
          grade_a: gradeA, grade_b: gradeB, grade_c: gradeC,
          total_dispatched: total,
          free_eggs: free,
          invoice_eggs: invoiceEggs,
          rate: anyRate && invoiceEggs > 0 ? Number((amount / invoiceEggs).toFixed(4)) : null,
          amount: anyRate ? amount : null,
          party_id: g.party_id,
          remarks: g.remarks,
          // extra_trays is the app's own total of the two tray sizes.
          extra_trays: (g.extra.extra_trays_20lb ?? 0) + (g.extra.extra_trays_23lb ?? 0) || null,
          ...g.extra,
          // Compliance is derived, never typed: it is the recorded maximum
          // against the safe limit the dispatch is judged by.
          temp_compliant: g.extra.temp_max != null ? Number(g.extra.temp_max) <= 25 : null,
          tds_amount: g.extra.tds_pct != null && amount ? Number((amount * Number(g.extra.tds_pct) / 100).toFixed(2)) : null,
        }
      }

      // Dedupe against existing dispatches so re-importing the same file
      // doesn't double the records
      const { data: existing } = await supabase.from('he_dispatch')
        .select('flock_id,dispatch_date,dc_no,amount')
        .in('flock_id', [...new Set(grouped.map(g => g.flock_id))] as string[])
        .in('dispatch_date', [...new Set(grouped.map(g => g.dispatch_date))])
      const isDupe = (h: any) => (existing ?? []).some((e: any) =>
        e.flock_id === h.flock_id && e.dispatch_date === h.dispatch_date &&
        (h.dc_no != null ? e.dc_no === h.dc_no : e.amount === h.amount))

      // Keep each group beside its header, so the lines can never be matched
      // to the wrong dispatch — the previous version indexed the inserted rows
      // against the UNFILTERED list, so one skipped duplicate shifted every
      // line onto the following dispatch.
      const fresh = grouped.map(g => ({ group: g, header: headerOf(g) })).filter(x => !isDupe(x.header))
      const skippedCount = grouped.length - fresh.length
      if (fresh.length === 0) {
        toast.error(`All ${skippedCount} dispatches already exist — nothing imported`)
        return
      }

      const { data: inserted, error } = await supabase.from('he_dispatch')
        .insert(fresh.map(x => x.header)).select('id')
      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          toast.error('Some records already exist (duplicate dispatch dates). Please check your data.')
        } else {
          throw error
        }
        return
      }

      // One line per production date — this is what the Daily Stock Register
      // reads, so without them an imported dispatch never reduces egg stock.
      const linePayload = (inserted ?? []).flatMap((ins: any, i: number) =>
        (fresh[i]?.group.lines ?? []).map(l => ({
          dispatch_id: ins.id,
          flock_id: fresh[i].group.flock_id,
          prod_date: l.prod_date,
          grade_a: l.grade_a,
          grade_b: l.grade_b,
          grade_c: l.grade_c,
          rate: l.rate,
        })))
      if (linePayload.length) {
        const { error: lineErr } = await supabase.from('he_dispatch_lines').insert(linePayload)
        if (lineErr) toast.error('Dispatches imported, but stock-register lines failed: ' + lineErr.message)
      }
      toast.success(`Imported ${fresh.length} dispatch${fresh.length === 1 ? '' : 'es'} with ${linePayload.length} production-date lines` +
        (skippedCount ? ` (${skippedCount} already existed)` : ''))
      qc.invalidateQueries({ queryKey: ['he_dispatch'] })
    } catch (e: any) {
      toast.error('Import failed: ' + e.message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExportHE = () => {
    const rows = filtered ?? []
    // One row per PRODUCTION DATE, matching the import template, so a dispatch
    // can be exported, corrected and put back with its day-wise split and its
    // per-day rates intact. A dispatch with no lines still exports one row.
    const headers = 'flock_no,dispatch_date,dc_no,invoice_no,party_name,prod_date,grade_a,grade_b,grade_c,free_eggs,rate,'
      + 'boxes_20lb,boxes_23lb,extra_trays_20lb,extra_trays_23lb,vehicle_type,lorry_no,vehicle_no,driver_phone,out_time,'
      + 'tds_pct,temp_min,temp_max,temp_avg,temp_remarks,remarks'
    const esc = (v: any) => {
      const t = String(v ?? '')
      return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t
    }
    const lines = rows.flatMap((r: any) => {
      const dls = (r.he_dispatch_lines ?? []) as any[]
      const base = [r.flocks?.flock_no ?? '', r.dispatch_date, r.dc_no ?? '', r.invoice_no ?? '',
                    r.parties?.name ?? '']
      // Loading and vehicle details belong to the dispatch, so they go on the
      // first row only — repeating them would read as several loadings.
      const load = [r.boxes_20lb ?? '', r.boxes_23lb ?? '', r.extra_trays_20lb ?? '', r.extra_trays_23lb ?? '',
                    r.vehicle_type ?? '', r.lorry_no ?? '', r.vehicle_no ?? '', r.driver_phone ?? '',
                    r.out_time ?? '', r.tds_pct ?? '', r.temp_min ?? '', r.temp_max ?? '',
                    r.temp_avg ?? '', r.temp_remarks ?? '']
      const blankLoad = load.map(() => '')
      if (dls.length === 0) {
        return [[...base, prodDateLabel(r), r.grade_a ?? 0, r.grade_b ?? 0, r.grade_c ?? 0,
                 r.free_eggs ?? 0, r.rate ?? '', ...load, r.remarks ?? ''].map(esc).join(',')]
      }
      // Free eggs sit on the dispatch, not the line, so they are shown against
      // the first line only — putting them on every line would multiply them.
      return [...dls]
        .sort((a, b) => String(a.prod_date).localeCompare(String(b.prod_date)))
        .map((l, i) => [...base, l.prod_date, l.grade_a ?? 0, l.grade_b ?? 0, l.grade_c ?? 0,
                        i === 0 ? (r.free_eggs ?? 0) : 0, l.rate ?? r.rate ?? '',
                        ...(i === 0 ? load : blankLoad),
                        i === 0 ? (r.remarks ?? '') : ''].map(esc).join(','))
    })
    const blob = new Blob([headers + '\n' + lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `he_dispatch_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  // prod date display helper
  const prodDateLabel = (d: any) => {
    if (!d.prod_date) return '—'
    if (d.prod_date_to && d.prod_date_to !== d.prod_date)
      return `${fmtDate(d.prod_date)} – ${fmtDate(d.prod_date_to)}`
    return fmtDate(d.prod_date)
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="HE Dispatch & Sales"
        subtitle="Hatching egg dispatches to hatcheries"
        action={<Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Dispatch</Button>}
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['dispatch','stock'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===t?'border-brand-600 text-brand-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'dispatch' ? 'Dispatches' : 'Daily Stock Register'}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex gap-3 flex-wrap items-end">
        <SearchableSelect placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={v => setFlockFilter(v)} className="w-44" />
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          From
          <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm" />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          To
          <DateInput value={toDate} onChange={e => setToDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm" />
        </label>
        {tab === 'dispatch' && (
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={noInvoiceOnly} onChange={e => setNoInvoiceOnly(e.target.checked)}
            className="rounded border-gray-300 text-orange-500"/>
          <span className="text-orange-600 font-medium">
            No Invoice only {noInvoiceCount > 0 && <span className="bg-orange-100 text-orange-700 text-xs px-1.5 rounded-full">{noInvoiceCount}</span>}
          </span>
        </label>
        )}
        {tab === 'dispatch' && (
          <input
            type="text"
            placeholder="Search party / DC / Invoice…"
            value={hePartyFilter}
            onChange={e => setHePartyFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-52"
          />
        )}
        {(hasFilter || hePartyFilter) && <Button variant="ghost" size="sm" onClick={() => { setFlockFilter(''); setFromDate(''); setToDate(''); setNoInvoiceOnly(false); setHePartyFilter('') }}>Clear</Button>}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleDownloadTemplate}>Template</Button>
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExportHE}>Export CSV</Button>
          <Button variant="outline" size="sm" icon={<Upload size={14}/>}
            loading={importing}
            onClick={() => fileInputRef.current?.click()}>
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
            }}
          />
        </div>
      </div>

      {/* Summary */}
      {dispatches && dispatches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Dispatched" value={totalDisp.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-brand-600" />
          <StatCard title="Free Eggs" value={totalFree.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-yellow-600" />
          <StatCard title="Total Revenue" value={inr(totalAmt)} icon={<Package size={18}/>} color="text-green-600" />
        </div>
      )}

      <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)}
        extraAction={sel.size > 1 ? <Button variant="outline" size="sm" onClick={() => setConsolidateOpen(true)}>Consolidate to Invoice</Button> : undefined} />



      {tab === 'dispatch' && (isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
              <Th>Flock</Th><Th>Dispatch Date</Th><Th>Prod Date</Th>
              <Th right>DC No</Th><Th>Invoice No</Th><Th>Party</Th>
              <Th right>Dispatched</Th><Th right>Free</Th><Th right>Invoice Qty</Th>
              <Th right>Rate</Th><Th right>Amount</Th><Th right>TDS</Th><Th>Vehicle</Th><Th>Lorry</Th><Th>Out Time</Th><Th>Payment</Th><Th>Temp</Th><Th></Th>
            </tr></thead>
            <tbody>
              {pageDispatches.map((d: any) => (<>
                <tr key={d.id} className={`hover:bg-gray-50 ${sel.has(d.id) ? 'bg-red-50' : !d.invoice_no ? 'bg-orange-50' : ''}`}>
                  <Td><CB checked={sel.has(d.id)} onChange={() => toggle(d.id)}/></Td>
                  <Td><Badge color="green">F-{d.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(d.dispatch_date)}</Td>
                  <Td className="text-xs text-gray-500">{prodDateLabel(d)}</Td>
                  <Td right className="text-xs">{d.dc_no ?? '—'}</Td>
                  <Td className="text-xs">
                    {d.invoice_no
                      ? <button className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900 text-left" onClick={async () => {
                          if (expandedDispatch === d.id) { setExpandedDispatch(null); setExpandedLines([]); return }
                          const { data: ls } = await supabase.from('he_dispatch_lines').select('prod_date,grade_a,grade_b,grade_c,rate').eq('dispatch_id', d.id).order('prod_date')
                          setExpandedLines(ls ?? [])
                          setExpandedDispatch(d.id)
                        }}>{d.invoice_no} {expandedDispatch === d.id ? '▲' : '▼'}</button>
                      : <span className="flex items-center gap-1 text-orange-500"><AlertCircle size={11}/>Pending</span>}
                  </Td>
                  <Td className="text-xs max-w-[120px] truncate">{d.parties?.name ?? '—'}</Td>
                  <Td right className="font-medium">{d.total_dispatched?.toLocaleString('en-IN')}</Td>
                  <Td right className="text-xs text-orange-500">{d.free_eggs > 0 ? d.free_eggs : '—'}</Td>
                  <Td right className="text-xs">{d.invoice_eggs?.toLocaleString('en-IN') ?? '—'}</Td>
                  <Td right className="text-xs">{d.rate ? `Rs ${d.rate}` : '—'}</Td>
                  <Td right className="font-semibold text-green-700 text-xs">{d.amount ? inr(d.amount) : '—'}</Td>
                  <Td right className="text-xs text-red-500">{d.tds_amount > 0 ? inr(d.tds_amount) : '—'}</Td>
                  <Td className="text-xs"><span className={`font-medium ${d.vehicle_type === 'AC' ? 'text-blue-600' : d.vehicle_type === 'NON-AC' ? 'text-orange-500' : 'text-gray-400'}`}>{d.vehicle_type ?? '—'}</span></Td>
                  <Td className="text-xs text-gray-500">{d.lorry_no ?? '—'}</Td>
                  <Td className="text-xs text-gray-500">{d.out_time ?? '—'}</Td>
                  <Td className="text-xs">
                    {d.payment_status === 'Received'
                      ? <button onClick={() => setReceiptSale({...d, _table:'he_dispatch'})} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium hover:bg-green-200">✓ {d.payment_mode ?? 'Paid'}</button>
                      : d.payment_status === 'Partial'
                        ? <button onClick={() => setReceiptSale({...d, _table:'he_dispatch'})} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium hover:bg-yellow-200">◑ Partial</button>
                        : d.amount ? <button onClick={() => setReceiptSale({...d, _table:'he_dispatch'})} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200 text-xs hover:bg-orange-100">⊕ Receive</button> : null}
                  </Td>
                  <Td className="text-xs">
                    <button onClick={() => setTempLogTarget(d)} title={d.temp_log_url ? 'View/update temperature log' : 'Upload temperature log'}>
                      {d.temp_log_url
                        ? <Badge color={d.temp_compliant === false ? 'red' : 'green'}>{d.temp_compliant === false ? '⚠ Breach' : '✓ OK'}</Badge>
                        : <span className="text-gray-400 underline underline-offset-2 hover:text-gray-600">Upload</span>}
                    </button>
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openForm(d)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600" title="Edit dispatch"><Edit2 size={13}/></button>
                      <button onClick={() => setPrintTarget(d)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Print invoice"><Printer size={13}/></button>
                    </div>
                  </Td>
                </tr>
                {expandedDispatch === d.id && (
                  <tr key={`lines-${d.id}`} className="bg-blue-50">
                    <Td colSpan={17}>
                      <div className="py-2 px-2">
                        <p className="text-xs font-semibold text-blue-700 mb-2">Production Date Breakdown — {d.invoice_no}</p>
                        {expandedLines.length === 0
                          ? <p className="text-xs text-gray-400">No line details recorded</p>
                          : <table className="text-xs w-auto border-collapse">
                              <thead><tr className="text-gray-500">
                                <th className="pr-6 pb-1 text-left font-medium">Prod Date</th>
                                <th className="pr-6 pb-1 text-center font-medium">Flock Age</th>
                                <th className="pr-6 pb-1 text-right font-medium">Grade A</th>
                                <th className="pr-6 pb-1 text-right font-medium">Grade B</th>
                                <th className="pr-6 pb-1 text-right font-medium">Grade C</th>
                                <th className="pr-6 pb-1 text-right font-medium">Total</th>
                                <th className="pr-6 pb-1 text-right font-medium">Rate</th>
                                <th className="pb-1 text-right font-medium">Amount</th>
                              </tr></thead>
                              <tbody>
                                {expandedLines.map((l: any, i: number) => {
                                  const tot = (l.grade_a||0)+(l.grade_b||0)+(l.grade_c||0)
                                  const lineAmt = l.rate ? tot * l.rate : null
                                  const placement = d.flocks?.placement_date ?? null
                                  const ageDaysVal = placement && l.prod_date
                                    ? Math.round((new Date(l.prod_date).getTime() - new Date(placement).getTime()) / 86400000)
                                    : null
                                  const ageStr = ageDaysVal && ageDaysVal > 0
                                    ? `${Math.floor(ageDaysVal/7)}w ${ageDaysVal%7}d`
                                    : '—'
                                  return (
                                    <tr key={i} className="border-t border-blue-100">
                                      <td className="pr-6 py-0.5">{fmtDate(l.prod_date)}</td>
                                      <td className="pr-6 py-0.5 text-center text-blue-600 font-medium">{ageStr}</td>
                                      <td className="pr-6 py-0.5 text-right">{(l.grade_a||0).toLocaleString('en-IN')}</td>
                                      <td className="pr-6 py-0.5 text-right">{(l.grade_b||0).toLocaleString('en-IN')}</td>
                                      <td className="pr-6 py-0.5 text-right">{(l.grade_c||0).toLocaleString('en-IN')}</td>
                                      <td className="pr-6 py-0.5 text-right font-medium">{tot.toLocaleString('en-IN')}</td>
                                      <td className="pr-6 py-0.5 text-right">{l.rate ? `₹${l.rate}` : '—'}</td>
                                      <td className="py-0.5 text-right">{lineAmt ? inr(lineAmt) : '—'}</td>
                                    </tr>
                                  )
                                })}
                                <tr className="border-t-2 border-blue-300 font-semibold">
                                  <td className="pr-6 py-1">TOTAL</td>
                                  <td></td>
                                  <td className="pr-6 py-1 text-right">{expandedLines.reduce((s,l)=>s+(l.grade_a||0),0).toLocaleString('en-IN')}</td>
                                  <td className="pr-6 py-1 text-right">{expandedLines.reduce((s,l)=>s+(l.grade_b||0),0).toLocaleString('en-IN')}</td>
                                  <td className="pr-6 py-1 text-right">{expandedLines.reduce((s,l)=>s+(l.grade_c||0),0).toLocaleString('en-IN')}</td>
                                  <td className="pr-6 py-1 text-right">{expandedLines.reduce((s,l)=>s+(l.grade_a||0)+(l.grade_b||0)+(l.grade_c||0),0).toLocaleString('en-IN')}</td>
                                  <td></td><td></td>
                                </tr>
                              </tbody>
                            </table>
                        }
                      </div>
                    </Td>
                  </tr>
                )}
              </>))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot><tr className="bg-gray-50">
                <Td colSpan={7}><strong>TOTAL ({filtered.length} records)</strong></Td>
                <Td right><strong>{totalDisp.toLocaleString('en-IN')}</strong></Td>
                <Td right><strong>{totalFree.toLocaleString('en-IN')}</strong></Td>
                <Td right><strong>{totalInvQty.toLocaleString('en-IN')}</strong></Td>
                <Td right>—</Td>
                <Td right><strong className="text-green-700">{inr(totalAmt)}</strong></Td>
                <Td right><strong className="text-red-500">{totalTds > 0 ? inr(totalTds) : '—'}</strong></Td>
                <Td> </Td><Td> </Td><Td> </Td><Td> </Td><Td> </Td><Td> </Td>
              </tr></tfoot>
            )}
          </Table>
          <PageSizeControl page={pgHE.page} setPage={pgHE.setPage}
            pageSize={pgHE.pageSize} setPageSize={pgHE.setPageSize}
            totalPages={pgHE.totalPages} totalItems={filtered.length} />
          {filtered.length === 0 && (
            <EmptyState icon={<Egg size={32}/>} title={noInvoiceOnly ? 'All dispatches have invoice numbers' : 'No dispatches yet'}
              action={!noInvoiceOnly ? <Button onClick={() => openForm()} icon={<Plus size={16}/>}>Add Dispatch</Button> : undefined}
            />
          )}
        </Card>
      ))}

      {/* Daily Stock Register tab */}
      {tab === 'stock' && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b border-gray-100 bg-blue-50 text-sm text-blue-700">
            Running balance per flock = Opening stock + Production (Grade A/B/C) − Dispatched (Grade A/B/C).
            The From/To dates narrow which days are LISTED — the balance on each row is still built from the
            flock's whole history, so it never restarts at the From date.
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th><Th>Flock</Th>
                <Th right className="text-sky-700">Open A</Th>
                <Th right className="text-sky-700">Open B</Th>
                <Th right className="text-sky-700">Open C</Th>
                <Th right className="text-green-700">Prod A</Th>
                <Th right className="text-green-700">Prod B</Th>
                <Th right className="text-green-700">Prod C</Th>
                <Th right className="text-red-500">Disp A</Th>
                <Th right className="text-red-500">Disp B</Th>
                <Th right className="text-red-500">Disp C</Th>
                <Th right className="text-purple-700">Bal A</Th>
                <Th right className="text-purple-700">Bal B</Th>
                <Th right className="text-purple-700">Bal C</Th>
                <Th right className="text-gray-800">Total Stock</Th>
              </tr>
            </thead>
            <tbody>
              {stockRows.map((r: any, i: number) => (
                <tr key={i} className={`hover:bg-gray-50 text-xs ${r.bal_total < 0 ? 'bg-red-50' : ''}`}>
                  <Td className="text-xs">{fmtDate(r.date)}</Td>
                  <Td><Badge color="green">{r.flock}</Badge></Td>
                  <Td right className="text-sky-700 bg-sky-50/30">{r.open_a.toLocaleString('en-IN')}</Td>
                  <Td right className="text-sky-700 bg-sky-50/30">{r.open_b.toLocaleString('en-IN')}</Td>
                  <Td right className="text-sky-700 bg-sky-50/30">{r.open_c.toLocaleString('en-IN')}</Td>
                  <Td right className="text-green-700">{r.prod_a > 0 ? r.prod_a.toLocaleString('en-IN') : '—'}</Td>
                  <Td right className="text-green-700">{r.prod_b > 0 ? r.prod_b.toLocaleString('en-IN') : '—'}</Td>
                  <Td right className="text-green-700">{r.prod_c > 0 ? r.prod_c.toLocaleString('en-IN') : '—'}</Td>
                  <Td right className="text-red-500">{r.disp_a > 0 ? `-${r.disp_a.toLocaleString('en-IN')}` : '—'}</Td>
                  <Td right className="text-red-500">{r.disp_b > 0 ? `-${r.disp_b.toLocaleString('en-IN')}` : '—'}</Td>
                  <Td right className="text-red-500">{r.disp_c > 0 ? `-${r.disp_c.toLocaleString('en-IN')}` : '—'}</Td>
                  <Td right className={`font-medium bg-purple-50/30 ${r.bal_a < 0 ? 'text-red-600' : 'text-purple-700'}`}>{r.bal_a.toLocaleString('en-IN')}</Td>
                  <Td right className={`font-medium bg-purple-50/30 ${r.bal_b < 0 ? 'text-red-600' : 'text-purple-700'}`}>{r.bal_b.toLocaleString('en-IN')}</Td>
                  <Td right className={`font-medium bg-purple-50/30 ${r.bal_c < 0 ? 'text-red-600' : 'text-purple-700'}`}>{r.bal_c.toLocaleString('en-IN')}</Td>
                  <Td right className={`font-semibold text-sm bg-purple-50/50 ${r.bal_total < 0 ? 'text-red-700' : 'text-gray-900'}`}>{r.bal_total.toLocaleString('en-IN')}</Td>
                </tr>
              ))}
              {stockRows.length === 0 && (
                <tr><Td colSpan={15} className="text-center text-gray-400 py-8">
                  {(stockData ?? []).length > 0
                    ? 'No days in this date range — widen the From/To dates.'
                    : 'No data — add daily records with grade breakdown and dispatches first'}
                </Td></tr>
              )}
            </tbody>
            {stockRows.length > 0 && (
              <tfoot>
                <tr className="bg-brand-50 border-t-2 border-brand-200 text-xs font-semibold text-brand-800">
                  <Td colSpan={2}>TOTAL ({stockRows.length} day-rows)</Td>
                  {/* Opening and Balance are point-in-time, so they are not summed. */}
                  <Td right className="text-gray-400">—</Td>
                  <Td right className="text-gray-400">—</Td>
                  <Td right className="text-gray-400">—</Td>
                  <Td right className="text-green-700">{stockTotals.prod_a.toLocaleString('en-IN')}</Td>
                  <Td right className="text-green-700">{stockTotals.prod_b.toLocaleString('en-IN')}</Td>
                  <Td right className="text-green-700">{stockTotals.prod_c.toLocaleString('en-IN')}</Td>
                  <Td right className="text-red-500">{stockTotals.disp_a ? `-${stockTotals.disp_a.toLocaleString('en-IN')}` : '—'}</Td>
                  <Td right className="text-red-500">{stockTotals.disp_b ? `-${stockTotals.disp_b.toLocaleString('en-IN')}` : '—'}</Td>
                  <Td right className="text-red-500">{stockTotals.disp_c ? `-${stockTotals.disp_c.toLocaleString('en-IN')}` : '—'}</Td>
                  <Td right className="text-gray-400">—</Td>
                  <Td right className="text-gray-400">—</Td>
                  <Td right className="text-gray-400">—</Td>
                  <Td right className="text-gray-800">
                    {(stockTotals.prod_a + stockTotals.prod_b + stockTotals.prod_c
                      - stockTotals.disp_a - stockTotals.disp_b - stockTotals.disp_c).toLocaleString('en-IN')}
                  </Td>
                </tr>
              </tfoot>
            )}
          </Table>
          <div className="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-500">
            TOTAL adds up <strong>Production</strong> and <strong>Dispatched</strong> for the rows shown, and the last
            column is the net movement (produced − dispatched) over the range. Opening and Balance are left blank on
            purpose: they are the position of one flock on one day, so adding them down the column would give a
            meaningless figure. For the closing stock, read the Balance on the most recent row.
          </div>
        </Card>
      )}

      {bulkConfirm && (
        <ConfirmBulkDelete label={`Delete ${sel.size} HE dispatch records? This cannot be undone.`}
          onConfirm={() => bulkDelMut.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}

      <ConsolidateInvoiceModal open={consolidateOpen} ids={[...sel]} table="he_dispatch"
        onClose={() => setConsolidateOpen(false)}
        onSaved={() => { setConsolidateOpen(false); setSel(new Set()); qc.invalidateQueries({ queryKey: ['he_dispatch'] }) }} />

      <ReceivePaymentModal
        open={!!receiptSale}
        sale={receiptSale}
        bankAccounts={bankAccounts ?? []}
        farms={farms ?? []}
        table={receiptSale?._table ?? 'he_dispatch'}
        onClose={() => setReceiptSale(null)}
        onSaved={() => {
          setReceiptSale(null)
          qc.invalidateQueries({ queryKey: ['he_dispatch'] })
          qc.invalidateQueries({ queryKey: ['cash_book'] })
          qc.invalidateQueries({ queryKey: ['bank_transactions'] })
        }}
      />

      {/* Print Options Modal */}
      <Modal open={!!printTarget} onClose={() => setPrintTarget(null)} title="Print Invoice — Options" size="sm"
        footer={
          <><Button variant="secondary" onClick={() => setPrintTarget(null)}>Cancel</Button>
          <Button onClick={async () => {
            const d = printTarget
            const { data: ls } = await supabase.from('he_dispatch_lines').select('prod_date,grade_a,grade_b,grade_c,rate').eq('dispatch_id', d.id).order('prod_date')
            printHEDispatch({
              id: d.id, dispatch_date: d.dispatch_date, invoice_no: d.invoice_no,
              dc_no: d.dc_no, flock_no: d.flocks?.flock_no, flock_placement_date: d.flocks?.placement_date, total_dispatched: d.total_dispatched,
              free_eggs: d.free_eggs ?? 0, invoice_eggs: d.invoice_eggs ?? 0,
              rate: d.rate, amount: d.amount, tds_pct: d.tds_pct, tds_amount: d.tds_amount,
              buyer_gstin: d.buyer_gstin, party_name: d.parties?.name ?? '—',
              party_address: [d.parties?.address, d.parties?.contact].filter(Boolean).join(' | '),
              hsn_code: d.hsn_code ?? '0407',
              vehicle_type: d.vehicle_type ?? null,
              lorry_no: printOpts.lorry ? d.lorry_no : null,
              driver_phone: printOpts.driver ? d.driver_phone : null,
              out_time: printOpts.outTime ? d.out_time : null,
              boxes_20lb: printOpts.boxes ? (d.boxes_20lb ?? null) : null,
              boxes_23lb: printOpts.boxes ? (d.boxes_23lb ?? null) : null,
              extra_trays_20lb: printOpts.boxes ? (d.extra_trays_20lb ?? null) : null,
              extra_trays_23lb: printOpts.boxes ? (d.extra_trays_23lb ?? null) : null,
            }, ls ?? [], {
              companyAddr: printOpts.companyAddr,
              buyerDetails: printOpts.buyerDetails,
              bankDetails: printOpts.bankDetails,
              supplyDetails: printOpts.supplyDetails,
              lorry: printOpts.lorry, driver: printOpts.driver,
              outTime: printOpts.outTime, boxes: printOpts.boxes,
            })
            setPrintTarget(null)
          }}>Print</Button></>
        }>
        <div className="space-y-3 py-2">
          <p className="text-sm text-gray-600">Select what to include on the invoice:</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Seller / Header</p>
          {[
            { key: 'companyAddr', label: 'Company Address & Phone' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded"
                checked={printOpts[key as keyof typeof printOpts]}
                onChange={e => setPrintOpts(p => ({ ...p, [key]: e.target.checked }))} />
              {label}
            </label>
          ))}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">Buyer Section</p>
          {[
            { key: 'buyerDetails', label: 'Buyer Address & GSTIN' },
            { key: 'supplyDetails', label: 'Supply Details (HSN, Dispatched Qty)' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded"
                checked={printOpts[key as keyof typeof printOpts]}
                onChange={e => setPrintOpts(p => ({ ...p, [key]: e.target.checked }))} />
              {label}
            </label>
          ))}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">Payment / Logistics</p>
          {[
            { key: 'bankDetails', label: 'Bank Details' },
            { key: 'lorry', label: 'Lorry Number' },
            { key: 'outTime', label: 'Out Time' },
            { key: 'boxes', label: 'Box Details (20LB / 23LB / Extra Trays)' },
            { key: 'driver', label: 'Driver Phone' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded"
                checked={printOpts[key as keyof typeof printOpts]}
                onChange={e => setPrintOpts(p => ({ ...p, [key]: e.target.checked }))} />
              {label}
            </label>
          ))}
        </div>
      </Modal>

      <TempLogModal dispatch={tempLogTarget} onClose={() => setTempLogTarget(null)}
        onSaved={() => { setTempLogTarget(null); qc.invalidateQueries({ queryKey: ['he_dispatch'] }) }} />

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editing ? 'Edit HE Dispatch' : 'New HE Dispatch'} size="xl"
        footer={
          <>
          {heDraftChecked && heDraft && !heDraftDismissed && (
            <Button variant="secondary" onClick={() => {
              const d = heDraft.data || {}
              if (d.form) setForm((f: any) => ({ ...f, ...d.form }))
              if (d.lines?.length) setLines(d.lines)
              setHeDraftDismissed(true)
            }}>Restore Draft</Button>
          )}
          {!editing && <Button variant="secondary" onClick={() => {
            clearDraft(heDraftKey)
            setForm({ flock_id: flockFilter, dispatch_date: today(), dc_no: '', invoice_no: '',
              party_id: '', free_eggs: '0', rate: '', amount: '', tds_pct: '0', tds_amount: '0',
              boxes_20lb: '', boxes_23lb: '', extra_trays_20lb: '', extra_trays_23lb: '', vehicle_type: '', lorry_no: '', driver_phone: '', out_time: '', remarks: '' })
            setLines([emptyLine()]); setPeekInv(null); setHeDraftDismissed(true)
            toast('Started fresh — draft cleared')
          }}>Start Fresh</Button>}
          <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>{editing ? 'Update' : 'Save'}</Button></>
        }>
        <div className="space-y-4">
          {/* Header */}
          <FormRow>
            <SearchableSelect label="Flock *" required placeholder="— Select —" options={flockOptions}
              value={form.flock_id} onChange={v => s('flock_id', v)} />
            <DateInput label="Dispatch Date *" required value={form.dispatch_date}
              onChange={e => s('dispatch_date', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="DC No" type="number" value={form.dc_no} onChange={e => s('dc_no', e.target.value)} />
            <div className="flex items-end gap-1">
              <div className="w-28">
                <Select label="Series" value={invSeries} onChange={e => setInvSeries(e.target.value)}
                  options={[{value:'HHF',label:'HHF'},{value:'HE',label:'HE'},{value:'VHPL',label:'VHPL'}]} />
              </div>
              <div className="flex-1">
                <Input label="Invoice No" placeholder="auto-generate →" value={form.invoice_no}
                  onChange={e => s('invoice_no', e.target.value)} />
              </div>
              <Button type="button" variant="outline" size="sm" loading={genningInv} onClick={genInvoice}>Generate</Button>
            </div>
          </FormRow>
          <FormRow>
            <div className="relative">
              <div className="flex items-end gap-1">
                <div className="flex-1">
                  <SearchableSelect label="Party" placeholder="— Select —" options={partyOptions}
                    value={form.party_id} onChange={v => s('party_id', v)} />
                </div>
                <QuickAddParty defaultType="buyer" onCreated={p => s('party_id', p.id)} />
              </div>
            </div>
          </FormRow>

          {/* Production Lines */}
          <Divider label="Production Date Lines (one row per production date)" />
          <div className="rounded-lg border border-gray-200 overflow-x-auto overflow-y-auto max-h-72">
            <table className="text-sm" style={{minWidth:'700px'}}>
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Prod Date</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-green-700">Grade A</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-blue-700">Grade B</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-orange-700">Grade C</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Rate/egg</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-purple-700">Amount</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const rowTotal = (parseInt(l.grade_a)||0)+(parseInt(l.grade_b)||0)+(parseInt(l.grade_c)||0)
                  const lineRate = parseFloat(l.rate) || parseFloat(form.rate) || 0
                  const lineAmt = rowTotal * lineRate
                  return (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1.5">
                        <DateInput value={l.prod_date} onChange={e => setLine(i,'prod_date',e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-36"/>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={l.grade_a} placeholder="0" onChange={e => setLine(i,'grade_a',e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-20 text-right"/>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={l.grade_b} placeholder="0" onChange={e => setLine(i,'grade_b',e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-20 text-right"/>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={l.grade_c} placeholder="0" onChange={e => setLine(i,'grade_c',e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-20 text-right"/>
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium text-xs text-gray-700">{rowTotal > 0 ? rowTotal.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={l.rate} placeholder={form.rate||'0'} onChange={e => setLine(i,'rate',e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-24 text-right"/>
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium text-xs text-purple-700">
                        {lineAmt > 0 ? inr(lineAmt) : '—'}
                      </td>
                      <td className="px-2 py-1.5">
                        {lines.length > 1 && (
                          <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {/* Totals row */}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-xs">
                  <td className="px-3 py-2 text-gray-600">TOTAL ({lines.length} date{lines.length>1?'s':''})</td>
                  <td className="px-3 py-2 text-right text-green-700">{lineTotal('grade_a').toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right text-blue-700">{lineTotal('grade_b').toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right text-orange-700">{lineTotal('grade_c').toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{totalFromLines.toLocaleString('en-IN')}</td>
                  <td></td>
                  <td className="px-3 py-2 text-right text-purple-700">{grossTotal > 0 ? inr(grossTotal) : '—'}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div className="px-3 py-2 border-t border-gray-100">
              <button onClick={addLine} className="text-xs text-brand-600 hover:text-brand-700 font-medium">+ Add production date</button>
            </div>
          </div>

          {/* Invoice summary */}
          <FormRow cols={3}>
            <Input label="Free Eggs (2%)" type="number" value={form.free_eggs}
              onChange={e => s('free_eggs', e.target.value)} />
            <Input label="Default Rate (Rs/egg)" type="number" step="0.0001" value={form.rate}
              onChange={e => s('rate', e.target.value)} hint="Used for lines without individual rate" />
            <Input label="Invoice Amount (Rs)" type="number" step="0.01" value={form.amount}
              onChange={e => {
                const v = e.target.value
                s('amount', v)
                // Keep TDS in sync when the amount changes after the rate was picked
                const pct = parseFloat(form.tds_pct) || 0
                if (pct > 0) {
                  const base = parseFloat(v) || autoAmount || 0
                  s('tds_amount', (Math.round(base * pct / 100 * 100) / 100).toString())
                }
              }}
              hint={rawAmount > 0 ? `Auto (rounded): ${inr(autoAmount)}${rawAmount !== autoAmount ? ` (raw: ${inr(Math.round(rawAmount*100)/100)})` : ''}` : undefined} />
          </FormRow>
          <FormRow cols={3}>
            <Select label="TDS Rate" value={form.tds_pct} onChange={e => {
              const pct = e.target.value
              s('tds_pct', pct)
              if (parseFloat(pct) > 0) {
                const amt = Math.round((parseFloat(form.amount)||autoAmount||0) * parseFloat(pct) / 100 * 100) / 100
                s('tds_amount', amt.toString())
              } else {
                s('tds_amount', '0')
              }
            }} options={[
              { value: '0', label: 'No TDS' },
              { value: '0.1', label: '0.1%' },
              { value: '1', label: '1%' },
              { value: '2', label: '2%' },
              { value: '5', label: '5%' },
              { value: '10', label: '10%' },
            ]} />
            <Input label="TDS Amount (Rs)" type="number" step="0.01" value={form.tds_amount}
              onChange={e => s('tds_amount', e.target.value)}
              hint={autoTds > 0 && form.tds_amount !== autoTds.toString() ? `Auto: ${inr(autoTds)}` : 'Editable — override if needed'} />
            <div className="flex items-end pb-1">
              {(parseFloat(form.tds_amount)||0) > 0 && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded px-3 py-2 w-full">
                  Net receivable: <strong>{inr(effectiveAmount - (parseFloat(form.tds_amount)||0))}</strong>
                </p>
              )}
            </div>
          </FormRow>
          <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700 flex gap-6 flex-wrap">
            <span>Total Dispatched: <strong>{totalFromLines.toLocaleString('en-IN')}</strong></span>
            <span>Free: <strong>{parseInt(form.free_eggs)||0}</strong></span>
            <span>Invoice Eggs: <strong>{invoiceEggs.toLocaleString('en-IN')}</strong></span>
            {autoAmount > 0 && <span>Auto Amount: <strong>{inr(autoAmount)}</strong></span>}
            <span className="text-blue-500">Auto hint: <strong>{Math.floor(totalFromLines/210)}</strong> boxes + <strong>{Math.floor((totalFromLines%210)/30)}</strong> extra trays</span>
            {(form.boxes_20lb || form.boxes_23lb) && <span className="text-green-700">Entered: <strong>{(parseInt(form.boxes_20lb)||0)+(parseInt(form.boxes_23lb)||0)}</strong> boxes &nbsp;|&nbsp; Extra trays: 20LB <strong>{parseInt(form.extra_trays_20lb)||0}</strong> · 23LB <strong>{parseInt(form.extra_trays_23lb)||0}</strong></span>}
          </div>

          <Divider label="Loading Details" />
          <FormRow cols={4}>
            <Input label="20LB Boxes" type="number" value={form.boxes_20lb}
              onChange={e => s('boxes_20lb', e.target.value)}
              hint={`Auto total: ${Math.floor(totalFromLines/210)} boxes`} />
            <Input label="23LB Boxes" type="number" value={form.boxes_23lb}
              onChange={e => s('boxes_23lb', e.target.value)} />
            <Input label="Extra Trays (20LB)" type="number" value={form.extra_trays_20lb}
              onChange={e => s('extra_trays_20lb', e.target.value)}
              hint={`Auto: ${Math.floor((totalFromLines%210)/30)} trays`} />
            <Input label="Extra Trays (23LB)" type="number" value={form.extra_trays_23lb}
              onChange={e => s('extra_trays_23lb', e.target.value)} />
          </FormRow>
          <FormRow cols={4}>
            <Select label="Vehicle Type" value={form.vehicle_type} onChange={e => s('vehicle_type', e.target.value)}
              options={[{ value: 'AC', label: 'AC' }, { value: 'NON-AC', label: 'NON-AC' }]}
              placeholder="— AC / NON-AC —" />
            <Input label="Lorry Number" value={form.lorry_no} onChange={e => s('lorry_no', e.target.value)} placeholder="e.g. TS09EA1234" />
            <Input label="Driver Phone" type="tel" value={form.driver_phone} onChange={e => s('driver_phone', e.target.value)} placeholder="+91 99999 99999" />
            <Input label="Out Time (HH:MM)" value={form.out_time} onChange={e => s('out_time', e.target.value)} placeholder="e.g. 14:30" />
          </FormRow>

          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

// ── NHE SALES ────────────────────────────────────────────────────
// Rows loaded in the unfiltered view — surfaced in the UI so the count is
// never mistaken for the full history.

const NHE_TYPES = [
  { value: 'je',         label: 'Jumbo Eggs (JE)' },
  { value: 'te',         label: 'Table Eggs (TE)' },
  { value: 'be',         label: 'Broken/Crack Eggs (BE)' },
  { value: 'bird_sale',  label: 'Bird Sales' },
  { value: 'gas',        label: 'Gas Cylinders' },
  { value: 'manure',     label: 'Manure / Litter' },
  { value: 'other',      label: 'Other Income' },
]
// Legacy types kept for display backward-compat
const LEGACY_BIRD_TYPES = ['bird_cull','bird_lame','bird_weak','bird_sex_error']
const isBirdSale = (t: string) => t === 'bird_sale' || LEGACY_BIRD_TYPES.includes(t)
const isEggSale  = (t: string) => ['je','te','be'].includes(t)

function nheCashCategory(saleType: string): { category: string; label: string } {
  if (isBirdSale(saleType)) return { category: 'bird_sale',   label: 'Bird Sale' }
  if (saleType === 'manure') return { category: 'litter_sale', label: 'Litter / Manure Sale' }
  if (saleType === 'he_sale') return { category: 'he_sale',   label: 'HE Egg Sale' }
  if (saleType === 'je') return { category: 'je_sale', label: 'Jumbo Egg Sale (JE)' }
  if (saleType === 'te') return { category: 'te_sale', label: 'Table Egg Sale (TE)' }
  if (saleType === 'be') return { category: 'be_sale', label: 'Broken/Crack Egg Sale (BE)' }
  return { category: 'sales_collection', label: NHE_TYPES.find(t=>t.value===saleType)?.label ?? saleType }
}

const BIRD_SEX_OPTS = [
  { value: 'female',    label: 'Female' },
  { value: 'male',      label: 'Male' },
  { value: 'sex_error', label: 'Sex Error' },
  { value: 'mixed',     label: 'Mixed' },
]
const BIRD_CAT_OPTS = [
  { value: 'cull',      label: 'Cull' },
  { value: 'lame',      label: 'Lame' },
  { value: 'weak',      label: 'Weak' },
  { value: 'other',     label: 'Other' },
]

const EMPTY_NHE_FORM = {
  flock_id: '', shed_id: '', sale_date: today(), sale_type: 'je',
  party_id: '', dc_no: '', vehicle_no: '', invoice_no: '', gst_pct: '0',
  quantity: '', unit: 'nos', rate: '', amount: '',
  bird_sex: 'female', bird_category: 'cull',
  avg_weight_kg: '', total_weight_kg: '', rate_per_kg: '',
  gross_weight_kg: '', tare_weight_kg: '', net_weight_kg: '',
  female_qty: '', female_weight_kg: '', male_qty: '', male_weight_kg: '',
  payment_cash: '', payment_online: '', cash_farm_id: 'ho', bank_account_id: '',
  remarks: '',
  is_employee_sale: false, employee_id: '', deduct_salary: false,
}

// free_qty = eggs given away free on this line (complimentary / to outsiders).
// They count as stock leaving (same as HE Dispatch's free_eggs) but are never
// billed — only `quantity` × `rate` is charged.
type NheLine = { sale_type: string; quantity: string; unit: string; rate: string; amount: string; free_qty: string }
const emptyNheLine = (): NheLine => ({ sale_type: 'je', quantity: '', unit: 'nos', rate: '', amount: '', free_qty: '' })

// One voucher (one DC No) can cover birds sold out of several sheds, and both
// sexes, in a single visit. The form's main Bird Details box stays exactly as
// it always has — it IS the first shed/sex line, unchanged — and these are
// EXTRA lines for the rest: same DC No, date, party and payment, one more
// nhe_sales row per line. Simple qty × rate only; the weighbridge fields
// (gross/tare/net) describe one truckload's weighing and stay on the primary
// line, since splitting one weighing across sheds would invent numbers that
// were never actually weighed separately.
type ExtraBirdLine = { shed_id: string; bird_sex: string; bird_category: string; quantity: string; rate: string; amount: string }
const emptyExtraBirdLine = (): ExtraBirdLine => ({ shed_id: '', bird_sex: 'female', bird_category: 'cull', quantity: '', rate: '', amount: '' })

export const NHESales: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<any>(null)
  const [flockFilter, setFlockFilter] = useState('')
  const [typeFilter, setTypeFilter]   = useState('')
  const [partyFilter, setPartyFilter] = useState('')
  const [searchParams] = useSearchParams()
  const [empFilter, setEmpFilter] = useState(searchParams.get('emp') ?? '')
  const [payFilter, setPayFilter] = useState('')
  const [fromDate, setFromDate]   = useState('')
  const [toDate, setToDate]       = useState('')
  const [sel, setSel]             = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [consolidateOpen, setConsolidateOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [receiptSale, setReceiptSale] = useState<any>(null)
  const [refundSale, setRefundSale] = useState<any>(null)
  const [nheLines, setNheLines] = useState<NheLine[]>([emptyNheLine()])
  const [extraBirdLines, setExtraBirdLines] = useState<ExtraBirdLine[]>([])
  const setExtraBirdLine = (idx: number, patch: Partial<ExtraBirdLine>) => setExtraBirdLines(prev => prev.map((l, i) => {
    if (i !== idx) return l
    const nl = { ...l, ...patch }
    // Amount auto-fills from qty × rate, same as every other line item in the
    // app — still editable by hand for a negotiated lump sum.
    if ('quantity' in patch || 'rate' in patch) {
      const q = parseFloat(nl.quantity) || 0, r = parseFloat(nl.rate) || 0
      if (q && r) nl.amount = (q * r).toFixed(2)
    }
    return nl
  }))
  const addExtraBirdLine = () => setExtraBirdLines(prev => [...prev, emptyExtraBirdLine()])
  const removeExtraBirdLine = (idx: number) => setExtraBirdLines(prev => prev.filter((_, i) => i !== idx))
  // Draft autosave -- database-backed, keyed to the sale being edited or
  // 'new'. Restore only fills the form; Save still goes through the normal
  // insert/update path, so it can never create a duplicate row by itself.
  const nheDraftKey = editing?.id ?? 'new'
  const { draft: nheDraft, draftChecked: nheDraftChecked, saveDraft: saveNheDraft, clearDraft: clearNheDraft } = useFormDraft('nhe_sales', nheDraftKey, showForm)
  const [nheDraftDismissed, setNheDraftDismissed] = useState(false)

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => { const { data } = await supabase.from('bank_accounts').select('id,bank_name,account_name').eq('is_active', true).order('bank_name'); return data ?? [] }
  })

  const { data: farmsNhe } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').order('name'); return data ?? [] }
  })

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,laying_farm_id,rearing_farm_id').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q; return data ?? []
    }
  })
  const { data: parties } = useQuery({
    queryKey: ['parties_buyers'],
    queryFn: async () => { const { data } = await supabase.from('parties').select('id,name,state_code,gstin').in('type', ['buyer','both']).eq('is_active', true).order('name'); return data ?? [] }
  })

  const { data: employees } = useQuery({
    queryKey: ['employees_active'],
    queryFn: async () => { const { data } = await supabase.from('employees').select('id,name,emp_id').eq('is_active', true).order('name'); return data ?? [] }
  })

  const [invSeries, setInvSeries] = useState('NHE')
  const [genningInv, setGenningInv] = useState(false)
  // Off by default: an import adds new sales and skips ones already there.
  // Ticked, a row that matches an existing sale UPDATES it instead — which is
  // the only practical way to fill in a column added after the sales were
  // entered, such as the shed 225 bird sales were recorded without.
  const [updateExisting, setUpdateExisting] = useState(false)
  const [peekInv, setPeekInv] = useState<string | null>(null)
  const genInvoice = async () => {
    setGenningInv(true)
    try {
      const { data, error } = await supabase.rpc('fn_peek_invoice', { p_code: invSeries })
      if (error) throw error
      setForm((f: any) => ({ ...f, invoice_no: data as string }))
      setPeekInv(data as string)
      toast.success(`Preview: ${data} — will be confirmed on Save`)
    } catch (e: any) { toast.error(e.message) }
    finally { setGenningInv(false) }
  }

  const hasFilter = !!(flockFilter || empFilter || payFilter || fromDate || toDate)

  // Party (buyer) dues summary across ALL non-employee sales — unbounded
  // history, so page through the full set rather than trusting a single
  // request (PostgREST silently caps at 1000 rows otherwise, understating
  // pending dues).
  const { data: partyDues } = useQuery({
    queryKey: ['nhe_party_dues'],
    queryFn: async () => {
      const data = await fetchAllPages<any>(
        (from, to) => supabase.from('nhe_sales')
          .select('party_id,amount,amount_received,sale_type,parties(name)')
          .or('is_employee_sale.is.null,is_employee_sale.eq.false')
          .range(from, to),
        'Party dues'
      )
      const m: Record<string, any> = {}
      for (const r of data) {
        const id = r.party_id; if (!id) continue
        const e = (m[id] ??= { name: (r as any).parties?.name ?? '—', vouchers: 0, total: 0, received: 0, byType: {} as Record<string, number> })
        e.vouchers += 1
        e.total += Number(r.amount ?? 0)
        e.received += Number(r.amount_received ?? 0)
        const t = r.sale_type ?? 'other'
        e.byType[t] = (e.byType[t] ?? 0) + Number(r.amount ?? 0)
      }
      return Object.entries(m).map(([id, v]: any) => ({ id, ...v, pending: v.total - v.received }))
        .filter((r: any) => r.pending !== 0 || r.total !== 0)
        .sort((a: any, b: any) => b.pending - a.pending)
    }
  })
  const [showPartyDues, setShowPartyDues] = useState(false)

  // Employee dues summary across ALL employee sales (vouchers, received,
  // pending) — same unbounded-history risk as partyDues above.
  const { data: empDues } = useQuery({
    queryKey: ['nhe_emp_dues'],
    queryFn: async () => {
      const data = await fetchAllPages<any>(
        (from, to) => supabase.from('nhe_sales')
          .select('employee_id,amount,amount_received,sale_type,employees(name,emp_id)')
          .eq('is_employee_sale', true)
          .range(from, to),
        'Employee dues'
      )
      const m: Record<string, any> = {}
      for (const r of data) {
        const id = r.employee_id; if (!id) continue
        const e = (m[id] ??= { name: (r as any).employees?.name ?? '—', emp_id: (r as any).employees?.emp_id ?? '', vouchers: 0, total: 0, received: 0, byType: {} as Record<string, number> })
        e.vouchers += 1
        e.total += Number(r.amount ?? 0)
        e.received += Number(r.amount_received ?? 0)
        const t = r.sale_type ?? 'other'
        e.byType[t] = (e.byType[t] ?? 0) + Number(r.amount ?? 0)
      }
      return Object.entries(m).map(([id, v]: any) => ({ id, ...v, pending: v.total - v.received }))
        .sort((a: any, b: any) => b.pending - a.pending)
    }
  })
  const [showDues, setShowDues] = useState(false)

  const { data: sales, isLoading } = useQuery({
    queryKey: ['nhe_sales', flockFilter, empFilter, payFilter, fromDate, toDate],
    queryFn: async () => {
      // Unfiltered view deliberately loads only the latest 200 for speed (the
      // UI says so). Once a filter is applied every match must load — but a
      // single request is capped at 1000 rows by Supabase, so page through it
      // rather than silently stopping at 1000.
      const build = () => {
        let q = supabase.from('nhe_sales').select('*, flocks(flock_no), sheds(shed_no), parties(name,address,contact), employees(name,emp_id), bank_accounts!nhe_sales_bank_account_id_fkey(bank_name,account_name), nhe_sale_lines(sale_type,quantity,rate,amount,free_qty)')
          .order('sale_date', { ascending: false })
        if (flockFilter) q = q.eq('flock_id', flockFilter)
        if (empFilter) q = q.eq('employee_id', empFilter)
        if (payFilter) q = q.eq('payment_status', payFilter)
        if (fromDate) q = q.gte('sale_date', fromDate)
        if (toDate) q = q.lte('sale_date', toDate)
        return q
      }
      // Every sale is loaded, filtered or not. The old 200-row cap made an
      // unfiltered list silently partial -- and the TOTALS with it -- which is
      // a worse problem than a long page. Page length is handled by paging the
      // table below instead, so nothing is hidden from the figures.
      return fetchAllPages<any>((from, to) => build().range(from, to), 'NHE Sales', toast.error)
    }
  })

  const [form, setForm] = useState<any>(EMPTY_NHE_FORM)
  const sv = (k: string, v: string) => setForm((f: any) => {
    const nf = { ...f, [k]: v }
    // Bird sale auto-calcs — Female Qty + Male Qty (whichever are filled) always
    // sum to the bird count; Gross − Tare gives Net Weight; Avg Weight/bird is
    // always derived (Net ÷ birds), never typed by hand; Amount = Net × Rate/kg.
    if (['female_qty','male_qty'].includes(k)) {
      const fq = parseFloat(k==='female_qty' ? v : nf.female_qty) || 0
      const mq = parseFloat(k==='male_qty' ? v : nf.male_qty) || 0
      nf.quantity = (fq + mq) ? String(fq + mq) : ''
    }
    if (['gross_weight_kg','tare_weight_kg'].includes(k)) {
      const g = parseFloat(k==='gross_weight_kg' ? v : nf.gross_weight_kg) || 0
      const t = parseFloat(k==='tare_weight_kg' ? v : nf.tare_weight_kg) || 0
      const net = g && t && g > t ? g - t : 0
      nf.net_weight_kg = net ? net.toFixed(3) : ''
      nf.total_weight_kg = net ? net.toFixed(3) : ''
    }
    if (['female_qty','male_qty','gross_weight_kg','tare_weight_kg'].includes(k)) {
      const qty = parseFloat(nf.quantity) || 0
      const net = parseFloat(nf.net_weight_kg) || 0
      nf.avg_weight_kg = qty && net ? (net / qty).toFixed(3) : ''
    }
    if (['total_weight_kg','rate_per_kg','quantity','net_weight_kg',
         'female_qty','male_qty','gross_weight_kg','tare_weight_kg'].includes(k)) {
      const tw = parseFloat(nf.total_weight_kg) || 0
      const rk = parseFloat(nf.rate_per_kg) || 0
      if (tw && rk) nf.amount = (tw * rk).toFixed(2)
    }
    // Payment split auto-total — only suggests the invoice Amount while it's
    // still blank/zero (a fresh entry). Previously this ran unconditionally,
    // so recording a partial payment (e.g. ₹4,000 cash against a ₹10,000
    // sale) silently overwrote the invoice amount itself down to ₹4,000.
    if (['payment_cash','payment_online'].includes(k)) {
      const cash = parseFloat(k==='payment_cash' ? v : nf.payment_cash) || 0
      const onl  = parseFloat(k==='payment_online' ? v : nf.payment_online) || 0
      if ((cash || onl) && !(parseFloat(f.amount) || 0)) nf.amount = (cash + onl).toFixed(2)
    }
    return nf
  })
  useEffect(() => {
    if (!showForm) return
    saveNheDraft({ form, nheLines })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, nheLines, showForm])
  const autoAmt = isBirdSale(form.sale_type)
    ? ((parseFloat(form.total_weight_kg)||0) * (parseFloat(form.rate_per_kg)||0))
    : ((parseFloat(form.quantity)||0) * (parseFloat(form.rate)||0))

  const linesTotal = nheLines.reduce((sum, l) => {
    const lineAmt = parseFloat(l.amount) || ((parseFloat(l.quantity)||0) * (parseFloat(l.rate)||0))
    return sum + lineAmt
  }, 0)

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => {
      // Fetch sale details BEFORE deleting so we can clean up cash_book and daily_records
      const { data: sales } = await supabase
        .from('nhe_sales')
        .select('id, flock_id, sale_date, dc_no, amount, payment_cash, sale_type, quantity, bird_sex, party_advance_id, advance_adjusted')
        .in('id', ids)
      await reverseAdvanceAdjustments(sales ?? [])

      // 1. Delete cash_book rows linked by nhe_sale_id (FK CASCADE handles this automatically,
      //    but also do it explicitly to cover rows where nhe_sale_id may be NULL from old data)
      await supabase.from('cash_book').delete().in('nhe_sale_id', ids)
      // Also clean up bank_transactions (bank-paid sales) and employee_deductions
      // (employee sales with a salary deduction) — previously only cash_book was
      // cleaned here, orphaning bank ledger rows and leaving deductions active
      // for sales that no longer exist.
      await supabase.from('bank_transactions').delete().in('nhe_sale_id', ids)
      await supabase.from('employee_deductions').delete().in('nhe_sale_id', ids)

      // 2. Fallback: delete unlinked cash_book entries that match by flock+date+reference or amount
      if (sales && sales.length > 0) {
        for (const s of sales) {
          if (s.dc_no) {
            await supabase.from('cash_book').delete()
              .is('nhe_sale_id', null)
              .eq('flock_id', s.flock_id)
              .eq('txn_date', s.sale_date)
              .eq('reference_no', s.dc_no)
              .eq('txn_type', 'receipt')
              .eq('payment_mode', 'cash')
          } else {
            const cashAmt = s.payment_cash ?? s.amount
            await supabase.from('cash_book').delete()
              .is('nhe_sale_id', null)
              .eq('flock_id', s.flock_id)
              .eq('txn_date', s.sale_date)
              .eq('amount_in', cashAmt)
              .eq('txn_type', 'receipt')
              .eq('payment_mode', 'cash')
          }
        }
      }

      // Collect affected flock+date pairs for bird sales before deleting
      const affectedPairs: { flock_id: string; sale_date: string }[] = []
      if (sales) {
        const birdSales = sales.filter(s => isBirdSale(s.sale_type) && (s.quantity ?? 0) > 0)
        for (const s of birdSales) {
          if (!affectedPairs.some(p => p.flock_id === s.flock_id && p.sale_date === s.sale_date))
            affectedPairs.push({ flock_id: s.flock_id, sale_date: s.sale_date })
        }
      }

      const { error } = await supabase.from('nhe_sales').delete().in('id', ids)
      if (error) throw error

      // After deletion, recompute cull from remaining nhe_sales for each affected flock+date
      for (const { flock_id, sale_date } of affectedPairs) {
        const { data: remaining } = await supabase.from('nhe_sales')
          .select('quantity,bird_sex,female_qty,male_qty')
          .eq('flock_id', flock_id).eq('sale_date', sale_date)
          .in('sale_type', ['bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error'])
          .gt('quantity', 0)
        const totalF = (remaining ?? []).reduce((s, x) =>
          s + (x.bird_sex === 'mixed' ? (parseFloat(x.female_qty) || 0)
             : (x.bird_sex === 'female' || x.bird_sex === 'sex_error' || !x.bird_sex) ? (parseFloat(x.quantity) || 0) : 0), 0)
        const totalM = (remaining ?? []).reduce((s, x) =>
          s + (x.bird_sex === 'mixed' ? (parseFloat(x.male_qty) || 0)
             : x.bird_sex === 'male' ? (parseFloat(x.quantity) || 0) : 0), 0)
        const { data: drRows } = await supabase.from('daily_records')
          .select('id,cull_female,cull_male,transfer_female,transfer_male,opening_female,opening_male,mortality_female,mortality_male')
          .eq('flock_id', flock_id).eq('record_date', sale_date).order('id')
        if (!drRows || drRows.length === 0) continue
        const dr = drRows[0]
        const trcullF = (dr.transfer_female ?? 0) + totalF
        const trcullM = (dr.transfer_male ?? 0) + totalM
        await supabase.from('daily_records').update({
          cull_female: totalF, cull_male: totalM,
          trcull_female: trcullF, trcull_male: trcullM,
          ...(dr.opening_female ? {
            closing_female: Math.max(0, (dr.opening_female ?? 0) - trcullF - (dr.mortality_female ?? 0)),
            closing_male:   Math.max(0, (dr.opening_male   ?? 0) - trcullM - (dr.mortality_male   ?? 0)),
          } : {})
        }).eq('id', dr.id)
        for (const other of drRows.slice(1)) {
          if ((other.cull_female ?? 0) !== 0 || (other.cull_male ?? 0) !== 0) {
            const trF = other.transfer_female ?? 0
            const trM = other.transfer_male ?? 0
            await supabase.from('daily_records').update({
              cull_female: 0, cull_male: 0,
              trcull_female: trF, trcull_male: trM,
              ...(other.opening_female ? {
                closing_female: Math.max(0, (other.opening_female ?? 0) - trF - (other.mortality_female ?? 0)),
                closing_male:   Math.max(0, (other.opening_male   ?? 0) - trM - (other.mortality_male   ?? 0)),
              } : {})
            }).eq('id', other.id)
          }
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nhe_sales'] }); qc.invalidateQueries({ queryKey: ['daily_record'] }); qc.invalidateQueries({ queryKey: ['flock_daily'] }); setSel(new Set()); setBulkConfirm(false) },
    onError: (e: any) => toast.error(e.message),
  })

  // Sheds this flock is in — its links, its allocations, and anywhere it has
  // been transferred into, the same three sources Bulk Daily Entry combines.
  const { data: saleSheds = [] } = useQuery({
    queryKey: ['sale_form_sheds', form.flock_id],
    enabled: !!form.flock_id,
    queryFn: async () => {
      const seen = new Set<string>(); const out: any[] = []
      const add = (sh: any) => { if (sh && !seen.has(sh.id)) { seen.add(sh.id); out.push(sh) } }
      const COLS = 'sheds(id,shed_no,shed_name)'
      const [fs, sa, tr] = await Promise.all([
        supabase.from('flock_sheds').select(`shed_id,${COLS}`).eq('flock_id', form.flock_id),
        supabase.from('shed_allocations').select(`shed_id,${COLS}`).eq('flock_id', form.flock_id),
        supabase.from('flock_transfers').select('to_shed_id,sheds:to_shed_id(id,shed_no,shed_name)')
          .eq('flock_id', form.flock_id).not('to_shed_id', 'is', null),
      ])
      for (const r of (fs.data ?? [])) add((r as any).sheds)
      for (const r of (sa.data ?? [])) add((r as any).sheds)
      for (const r of (tr.data ?? [])) add((r as any).sheds)
      return out
    },
  })
  const saleShedOptions = React.useMemo(() => [...(saleSheds as any[])]
    .sort((a, b) => (parseInt(a.shed_no) || 0) - (parseInt(b.shed_no) || 0))
    .map((sh: any) => ({ value: sh.id, label: `Shed ${sh.shed_no}${sh.shed_name ? ' — ' + sh.shed_name : ''}` })),
    [saleSheds])

  const saveMut = useMutation({
    mutationFn: async () => {
      const egg = isEggSale(form.sale_type)
      // Compute linesTotal fresh inside mutationFn to avoid stale closure issues
      const freshLinesTotal = nheLines.reduce((sum, l) => {
        const amt = parseFloat(l.amount) || ((parseFloat(l.quantity)||0) * (parseFloat(l.rate)||0))
        return sum + amt
      }, 0)
      const finalAmt = egg ? freshLinesTotal : (parseFloat(form.amount) || autoAmt)
      // A pure give-away (only Free eggs, nothing billed) is a legitimate ₹0
      // entry — requiring an amount would make free eggs impossible to record,
      // which is exactly what the Free column exists for. Still require SOME
      // quantity so a totally blank form can't be saved.
      const freshFreeQty = egg ? nheLines.reduce((s, l) => s + (parseFloat(l.free_qty)||0), 0) : 0
      if (!form.flock_id || !form.sale_date) throw new Error('Flock and date are required')
      if (!finalAmt && !freshFreeQty) throw new Error('Enter an amount, or a Free quantity for eggs given away free')
      const bird = isBirdSale(form.sale_type)
      const buyer = parties?.find((p: any) => p.id === form.party_id)
      const nheSupply = supplyType(buyer?.state_code)
      const gstPct = parseFloat(form.gst_pct) || 0
      const tax = splitTax(finalAmt, gstPct, nheSupply)
      // Consume the real invoice number only at save time
      let finalInvoiceNo = form.invoice_no || null
      if (form.invoice_no && form.invoice_no === peekInv) {
        const { data: realInv, error: invErr } = await supabase.rpc('fn_next_invoice', { p_code: invSeries })
        if (invErr) throw invErr
        finalInvoiceNo = realInv as string
      }
      // For egg sales: aggregate qty from lines, rate stored per-line.
      // Free eggs are added in here too — they physically leave stock exactly
      // like sold eggs, so Egg Stock/production must count them; they're just
      // never billed (see linePayloads/amount, which use `quantity` only).
      const eggFreeQty = egg ? nheLines.reduce((s, l) => s + (parseFloat(l.free_qty)||0), 0) : 0
      const eggTotalQty = egg ? nheLines.reduce((s, l) => s + (parseFloat(l.quantity)||0) + (parseFloat(l.free_qty)||0), 0) : null
      // Header sale_type for multi-line egg sales = the line carrying the
      // largest amount (was hardcoded 'je', mislabelling TE/BE-dominant sales)
      const lineAmtOf = (l: NheLine) => parseFloat(l.amount) || ((parseFloat(l.quantity)||0) * (parseFloat(l.rate)||0))
      const dominantEggType = egg
        ? (nheLines.filter(l => lineAmtOf(l) > 0 || (parseFloat(l.quantity)||0) > 0)
            .sort((a, b) => lineAmtOf(b) - lineAmtOf(a))[0]?.sale_type ?? nheLines[0]?.sale_type ?? 'je')
        : 'je'
      const payload: any = {
        flock_id: form.flock_id, sale_date: form.sale_date,
        // Which shed the birds left. Without it the culls land on whichever
        // daily record happens to be first for that date — or on a record with
        // no shed at all — and no shed's closing count reflects the sale.
        shed_id: bird ? (form.shed_id || null) : null,
        sale_type: bird ? 'bird_sale' : (egg ? dominantEggType : form.sale_type),
        party_id: form.party_id || null, dc_no: form.dc_no || null,
        invoice_no: finalInvoiceNo,
        quantity: egg ? (eggTotalQty || null) : (parseFloat(form.quantity) || null),
        free_qty: egg ? eggFreeQty : 0,
        unit: bird ? 'nos' : (form.unit || 'nos'),
        rate: (bird || egg) ? null : (parseFloat(form.rate) || null),
        amount: finalAmt,
        supply_type: nheSupply, gst_pct: gstPct, taxable_value: finalAmt,
        cgst_amount: tax.cgst, sgst_amount: tax.sgst, igst_amount: tax.igst,
        buyer_gstin: buyer?.gstin || null,
        remarks: form.remarks || null,
        vehicle_no: form.vehicle_no || null,
        is_employee_sale: form.is_employee_sale || false,
        employee_id: form.is_employee_sale && form.employee_id ? form.employee_id : null,
      }
      const cashAmt   = parseFloat(form.payment_cash)   || 0
      const onlineAmt = parseFloat(form.payment_online) || 0
      // Same guard as the Receive Payment modal — an online amount with no bank
      // account picked used to mark the sale Received while posting to no ledger.
      if (onlineAmt > 0 && !form.bank_account_id) {
        throw new Error('Select a Bank Account for the online payment, or it won\'t be recorded in any ledger')
      }
      if (bird) {
        payload.bird_sex       = form.bird_sex || null
        payload.bird_category  = form.bird_category || null
        payload.avg_weight_kg  = parseFloat(form.avg_weight_kg)  || null
        payload.total_weight_kg= parseFloat(form.total_weight_kg)|| null
        payload.rate_per_kg    = parseFloat(form.rate_per_kg)    || null
        payload.gross_weight_kg = parseFloat(form.gross_weight_kg) || null
        payload.tare_weight_kg  = parseFloat(form.tare_weight_kg)  || null
        payload.net_weight_kg   = parseFloat(form.net_weight_kg)   || null
        payload.female_qty        = parseInt(form.female_qty) || null
        payload.male_qty          = parseInt(form.male_qty) || null
        payload.payment_cash   = cashAmt
        payload.payment_online = onlineAmt
      }
      // Auto-set payment receipt fields when cash/online is filled
      if (cashAmt > 0 || onlineAmt > 0) {
        payload.payment_status  = 'Received'
        payload.amount_received = cashAmt + onlineAmt
        payload.received_date   = form.sale_date
        payload.bank_account_id = onlineAmt > 0 && form.bank_account_id ? form.bank_account_id : null
        payload.payment_mode    = cashAmt > 0 && onlineAmt === 0 ? 'Cash'
          : cashAmt === 0 ? 'NEFT' : 'Cash+NEFT'
      } else if (editing && editing.payment_mode !== 'Advance') {
        // Payment fields cleared on edit: the old cash_book/bank rows are
        // deleted below, so leaving payment_status='Received' with a stale
        // amount_received would point at no ledger entry. Advance-paid sales
        // are left alone — their receipt lives in party_advances, managed by
        // the Receive Payment modal.
        payload.payment_status  = 'Pending'
        payload.amount_received = null
        payload.received_date   = null
        payload.bank_account_id = null
        payload.payment_mode    = null
      }
      // Editing a refunded sale wipes the refund's bank_transactions Debit row
      // (deleted unconditionally below by nhe_sale_id) — so the refund tracking
      // columns must be cleared too, or they'd point at a ledger entry that no
      // longer exists. User can re-record the refund afterward if still owed.
      if (editing && editing.refund_bank_txn_id) {
        payload.refund_amount = null
        payload.refund_date = null
        payload.refund_bank_account_id = null
        payload.refund_bank_txn_id = null
      }
      let savedId: string | null = null
      if (editing) {
        const { error } = await supabase.from('nhe_sales').update(payload).eq('id', editing.id)
        if (error) throw error
        savedId = editing.id
      } else {
        const { data: ins, error } = await supabase.from('nhe_sales').insert(payload).select('id').single()
        if (error) throw error
        savedId = ins?.id ?? null
      }

      // Save lines for egg-type sales
      if (egg && savedId) {
        await supabase.from('nhe_sale_lines').delete().eq('sale_id', savedId)
        const linePayloads = nheLines
          // A free-only line (qty 0, free 10) is a legitimate give-away with
          // no billable amount — keep it, or the record would vanish on save.
          .filter(l => (parseFloat(l.quantity)||0) > 0 || (parseFloat(l.amount)||0) > 0 || (parseFloat(l.free_qty)||0) > 0)
          .map(l => ({
            sale_id: savedId,
            sale_type: l.sale_type,
            quantity: parseFloat(l.quantity) || null,
            free_qty: parseFloat(l.free_qty) || 0,
            unit: l.unit || 'nos',
            rate: parseFloat(l.rate) || null,
            // Billed on `quantity` only — free_qty is deliberately excluded.
            amount: parseFloat(l.amount) || ((parseFloat(l.quantity)||0)*(parseFloat(l.rate)||0)) || null,
            gst_pct: gstPct,
          }))
        if (linePayloads.length > 0) {
          const { error: lErr } = await supabase.from('nhe_sale_lines').insert(linePayloads)
          if (lErr) throw lErr
        }
      }

      // Auto-create/replace cash_book entry when cash received
      // On edit: always delete the old cash_book entry first (by nhe_sale_id), then re-insert.
      // This prevents duplicate vouchers when amount/location/date is changed.
      if (editing) {
        await supabase.from('cash_book').delete().eq('nhe_sale_id', editing.id)
      }
      if (cashAmt > 0 && savedId) {
        const party = parties?.find((p: any) => p.id === form.party_id)
        const flockNo = flocks?.find((f: any) => f.id === form.flock_id)?.flock_no
        const { category: cbCategory, label: typeLabel } = nheCashCategory(form.sale_type)
        const cbDesc = [typeLabel, flockNo ? `F-${flockNo}` : '', form.dc_no || ''].filter(Boolean).join(' — ')
        const { error: cbErr } = await supabase.from('cash_book').insert({
          txn_date:     form.sale_date,
          txn_type:     'receipt',
          category:     cbCategory,
          description:  cbDesc,
          party_name:   party?.name ?? null,
          farm_id:      form.cash_farm_id === 'ho' ? null : (form.cash_farm_id || null),
          flock_id:     form.flock_id || null,
          reference_no: form.dc_no || null,
          amount_in:    cashAmt,
          amount_out:   0,
          payment_mode: 'cash',
          nhe_sale_id:  savedId,
        })
        if (cbErr) throw new Error('Sale saved, but Cash Book entry failed: ' + cbErr.message)
      }
      // Record bank/NEFT payment to bank_transactions
      // On edit: always delete the old entry first (by nhe_sale_id), same as cash_book above.
      if (editing) {
        await supabase.from('bank_transactions').delete().eq('nhe_sale_id', editing.id)
      }
      if (onlineAmt > 0 && form.bank_account_id && savedId) {
        const party = parties?.find((p: any) => p.id === form.party_id)
        const flockNo = flocks?.find((f: any) => f.id === form.flock_id)?.flock_no
        await supabase.from('bank_transactions').insert({
          bank_account_id: form.bank_account_id,
          txn_date: form.sale_date,
          txn_type: 'Credit',
          category: 'Sale Receipt',
          reference_no: form.dc_no || form.invoice_no || null,
          description: [`NHE Sale`, flockNo ? `F-${flockNo}` : '', party?.name ?? ''].filter(Boolean).join(' — '),
          amount: onlineAmt,
          party_id: form.party_id || null,
          nhe_sale_id: savedId,
        })
      }

      // Employee sale: only the UNPAID portion is deducted from salary. If the employee
      // paid cash/online, that part is NOT a salary deduction (was wrongly deducting the
      // full amount even when cash was received).
      if (form.is_employee_sale && form.employee_id && savedId) {
        // Always clear any prior deduction for this sale first (covers edits + paid-off)
        if (editing) {
          await supabase.from('employee_deductions').delete().eq('nhe_sale_id', editing.id)
        }
        const deductAmt = Math.max(0, finalAmt - cashAmt - onlineAmt)
        if (form.deduct_salary && deductAmt > 0) {
          const { category: cbCategory } = nheCashCategory(form.sale_type)
          const flockNo = flocks?.find((f: any) => f.id === form.flock_id)?.flock_no
          const empName = employees?.find((e: any) => e.id === form.employee_id)?.name ?? ''
          const saleMonthFull = form.sale_date.slice(0, 7) + '-01'
          await supabase.from('employee_deductions').insert({
            employee_id: form.employee_id,
            nhe_sale_id: savedId,
            description: `Sale F-${flockNo ?? ''} ${cbCategory} to ${empName}`,
            amount: deductAmt,
            deduction_month: saleMonthFull,
            status: 'pending',
          })
        }
      }

      // Sync daily_records cull counts from total of ALL nhe_sales for this
      // flock+date+shed. Pulled into a helper because editing a cull sale's
      // date or shed moves it OUT of its old daily_records row — that old row
      // must be recomputed too, or it keeps showing the cull that isn't there
      // any more. Only the sales for the SAME shed are totalled together —
      // with a shed recorded, each shed's culls belong on its own daily
      // record. Sales entered before the shed existed on this form carry no
      // shed, and are kept together as before so their totals do not change.
      const syncShedCull = async (flockId: string, saleDate: string, shedId: string | null) => {
        let salesQ = supabase.from('nhe_sales')
          .select('quantity,bird_sex,female_qty,male_qty')
          .eq('flock_id', flockId).eq('sale_date', saleDate)
          .in('sale_type', ['bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error'])
          .gt('quantity', 0)
        salesQ = shedId ? salesQ.eq('shed_id', shedId) : salesQ.is('shed_id', null)
        const { data: allSales } = await salesQ

        const totalF = (allSales ?? []).reduce((s, x) =>
          s + (x.bird_sex === 'mixed' ? (parseFloat(x.female_qty) || 0)
             : (x.bird_sex === 'female' || x.bird_sex === 'sex_error' || !x.bird_sex) ? (parseFloat(x.quantity) || 0) : 0), 0)
        const totalM = (allSales ?? []).reduce((s, x) =>
          s + (x.bird_sex === 'mixed' ? (parseFloat(x.male_qty) || 0)
             : x.bird_sex === 'male' ? (parseFloat(x.quantity) || 0) : 0), 0)

        // With a shed on the sale, go straight to that shed's record. Without
        // one, fall back to the old behaviour: the first record for the date.
        let drQ = supabase.from('daily_records')
          .select('id,cull_female,cull_male,transfer_female,transfer_male,opening_female,opening_male,mortality_female,mortality_male')
          .eq('flock_id', flockId).eq('record_date', saleDate).order('id')
        if (shedId) drQ = drQ.eq('shed_id', shedId)
        const { data: drRows } = await drQ

        if (drRows && drRows.length > 0) {
          // Write cull to the shed's record (or, with no shed, the first one)
          // and zero it on the others so nothing is counted twice.
          const dr = drRows[0]
          const trcullF = (dr.transfer_female ?? 0) + totalF
          const trcullM = (dr.transfer_male ?? 0) + totalM
          const closingF = Math.max(0, (dr.opening_female ?? 0) - trcullF - (dr.mortality_female ?? 0))
          const closingM = Math.max(0, (dr.opening_male ?? 0) - trcullM - (dr.mortality_male ?? 0))
          await supabase.from('daily_records').update({
            cull_female: totalF, cull_male: totalM,
            trcull_female: trcullF, trcull_male: trcullM,
            ...(dr.opening_female ? { closing_female: closingF, closing_male: closingM } : {})
          }).eq('id', dr.id)
          // Zero cull on remaining shed records for this date
          for (const other of drRows.slice(1)) {
            if ((other.cull_female ?? 0) !== 0 || (other.cull_male ?? 0) !== 0) {
              const trF = (other.transfer_female ?? 0)
              const trM = (other.transfer_male ?? 0)
              await supabase.from('daily_records').update({
                cull_female: 0, cull_male: 0,
                trcull_female: trF, trcull_male: trM,
                ...(other.opening_female ? {
                  closing_female: Math.max(0, (other.opening_female ?? 0) - trF - (other.mortality_female ?? 0)),
                  closing_male:   Math.max(0, (other.opening_male   ?? 0) - trM - (other.mortality_male   ?? 0)),
                } : {})
              }).eq('id', other.id)
            }
          }
        } else if (totalF > 0 || totalM > 0) {
          // No record for that day yet — create one ON THE SHED where possible.
          // A shed-less row is invisible in Bulk Daily Entry, which is exactly
          // how Flock 19's 36,080 culls came to be unreachable there.
          await supabase.from('daily_records').insert({
            flock_id: flockId, record_date: saleDate, shed_id: shedId,
            cull_female: totalF, cull_male: totalM,
            trcull_female: totalF, trcull_male: totalM,
            transfer_female: 0, transfer_male: 0,
            mortality_female: 0, mortality_male: 0,
          })
        }
      }

      if (bird) {
        const shedId = form.shed_id || null
        await syncShedCull(form.flock_id, form.sale_date, shedId)
        // The date and/or shed just moved off whatever it used to be — that
        // old daily_records row still carries this sale's culls until it is
        // recomputed too, or it keeps showing a cull that has moved elsewhere.
        if (editing && isBirdSale(editing.sale_type)) {
          const oldDate = editing.sale_date
          const oldShedId = editing.shed_id || null
          if (oldDate !== form.sale_date || oldShedId !== shedId) {
            await syncShedCull(editing.flock_id, oldDate, oldShedId)
          }
        }

        // Extra shed/sex lines — one voucher, several sheds and/or both sexes.
        // Each becomes its own nhe_sales row sharing this sale's date, party,
        // DC No, invoice and vehicle; only new entries offer this (editing
        // keeps to the one row it always has). Payment stays on the primary
        // row only — one voucher has one payment, so these are left Pending
        // rather than each claiming a slice of a receipt already recorded once.
        if (!editing && extraBirdLines.length > 0) {
          const validLines = extraBirdLines.filter(l => (parseFloat(l.quantity) || 0) > 0)
          for (const line of validLines) {
            const lineQty = parseFloat(line.quantity) || 0
            const lineRate = parseFloat(line.rate) || 0
            const lineAmt = parseFloat(line.amount) || (lineQty * lineRate)
            const lineTax = splitTax(lineAmt, gstPct, nheSupply)
            const linePayload: any = {
              flock_id: form.flock_id, sale_date: form.sale_date,
              shed_id: line.shed_id || null,
              sale_type: 'bird_sale',
              party_id: form.party_id || null, dc_no: form.dc_no || null,
              invoice_no: finalInvoiceNo,
              quantity: lineQty, unit: 'nos', rate: lineRate || null,
              amount: lineAmt,
              supply_type: nheSupply, gst_pct: gstPct, taxable_value: lineAmt,
              cgst_amount: lineTax.cgst, sgst_amount: lineTax.sgst, igst_amount: lineTax.igst,
              buyer_gstin: buyer?.gstin || null,
              vehicle_no: form.vehicle_no || null,
              bird_sex: line.bird_sex || null, bird_category: line.bird_category || null,
              is_employee_sale: form.is_employee_sale || false,
              employee_id: form.is_employee_sale && form.employee_id ? form.employee_id : null,
            }
            const { error: lineErr } = await supabase.from('nhe_sales').insert(linePayload)
            if (lineErr) throw new Error(`Extra line (shed/sex) failed: ${lineErr.message}`)
            await syncShedCull(form.flock_id, form.sale_date, line.shed_id || null)
          }
        }
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated!' : 'Sale recorded!')
      qc.invalidateQueries({ queryKey: ['nhe_sales'] })
      qc.invalidateQueries({ queryKey: ['daily_record'] })
      qc.invalidateQueries({ queryKey: ['flock_daily'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      qc.invalidateQueries({ queryKey: ['bank_transactions'] })
      clearNheDraft(nheDraftKey)
      setPeekInv(null); setShowForm(false); setEditing(null); setNheLines([emptyNheLine()]); setExtraBirdLines([])
    },
    onError: (e: any) => toast.error(e.message)
  })

  const openNew = () => {
    setNheDraftDismissed(false)
    setEditing(null)
    setPeekInv(null)
    setForm({ ...EMPTY_NHE_FORM, flock_id: flockFilter })
    setNheLines([emptyNheLine()])
    setExtraBirdLines([])
    setShowForm(true)
  }
  const openEdit = (row: any) => {
    setNheDraftDismissed(false)
    setEditing(row)
    // Extra shed/sex lines are only offered on a fresh entry — editing an
    // existing sale edits that one row, same as it always has.
    setExtraBirdLines([])
    setForm({
      flock_id: row.flock_id, shed_id: row.shed_id ?? '', sale_date: row.sale_date,
      sale_type: isBirdSale(row.sale_type) ? 'bird_sale' : row.sale_type,
      party_id: row.party_id ?? '', dc_no: row.dc_no ?? '',
      vehicle_no: row.vehicle_no ?? '',
      quantity: row.quantity ?? '', unit: row.unit ?? 'nos',
      rate: row.rate ?? '', amount: row.amount ?? '',
      bird_sex:        row.bird_sex ?? (row.sale_type==='bird_sex_error' ? 'sex_error' : 'female'),
      bird_category:   row.bird_category ?? (row.sale_type==='bird_cull'?'cull':row.sale_type==='bird_lame'?'lame':row.sale_type==='bird_weak'?'weak':'other'),
      avg_weight_kg:   row.avg_weight_kg ?? '',
      total_weight_kg: row.total_weight_kg ?? '',
      rate_per_kg:     row.rate_per_kg ?? '',
      gross_weight_kg: row.gross_weight_kg ?? '',
      tare_weight_kg:  row.tare_weight_kg ?? '',
      net_weight_kg:   row.net_weight_kg ?? '',
      female_qty:       row.female_qty != null ? String(row.female_qty) : '',
      female_weight_kg: row.female_weight_kg ?? '',
      male_qty:         row.male_qty != null ? String(row.male_qty) : '',
      male_weight_kg:   row.male_weight_kg ?? '',
      payment_cash:    row.payment_cash ?? '',
      payment_online:  row.payment_online ?? '',
      cash_farm_id:    row.cash_farm_id ?? 'ho',
      bank_account_id: row.bank_account_id ?? '',
      remarks: row.remarks ?? '',
      invoice_no: row.invoice_no ?? '',
      gst_pct: row.gst_pct != null ? String(row.gst_pct) : '0',
      is_employee_sale: row.is_employee_sale ?? false,
      employee_id: row.employee_id ?? '',
      deduct_salary: false,
    })
    // Check if a salary deduction exists for this sale and pre-tick the checkbox
    if (row.is_employee_sale && row.id) {
      supabase.from('employee_deductions')
        .select('id').eq('nhe_sale_id', row.id).eq('status', 'pending').limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setForm((f: any) => ({ ...f, deduct_salary: true }))
          }
        })
    }
    // Load lines from DB for egg-type sales
    if (isEggSale(row.sale_type)) {
      supabase.from('nhe_sale_lines').select('*').eq('sale_id', row.id).order('created_at')
        .then(({ data }) => {
          if (data && data.length > 0) {
            setNheLines(data.map((l: any) => ({
              sale_type: l.sale_type,
              quantity: l.quantity?.toString() ?? '',
              unit: l.unit ?? 'nos',
              rate: l.rate?.toString() ?? '',
              amount: l.amount?.toString() ?? '',
              free_qty: l.free_qty ? l.free_qty.toString() : '',
            })))
          } else {
            // No lines in DB — prefill a single line from header values
            // Always use row.amount so the total is preserved even when rate is null
            setNheLines([{
              sale_type: row.sale_type ?? 'je',
              quantity: row.quantity?.toString() ?? '',
              unit: row.unit ?? 'nos',
              rate: row.rate?.toString() ?? '',
              amount: row.amount != null ? row.amount.toString() : '',
              free_qty: row.free_qty ? row.free_qty.toString() : '',
            }])
          }
        })
    } else {
      setNheLines([emptyNheLine()])
    }
    setShowForm(true)
  }

  // Download template
  const handleDownloadTemplate = () => {
    // Everything the sale can actually hold. The old template stopped at rate
    // and remarks, so an imported bird sale could never say which shed the
    // birds left, whether they were given free, or that an employee bought
    // them — all of which the form has been recording for months.
    const headers = 'flock_no,sale_date,sale_type,shed_no,party_name,employee_emp_id,dc_no,invoice_no,quantity,free_qty,unit,rate,remarks'
    const example = [
      '19,2025-06-01,bird_cull,4,Party Name,,DC001,,100,0,nos,150,Cull birds sale',
      '19,2025-06-01,je,,Party Name,,DC002,NHE/25-26/001,500,20,nos,8.5,Jumbo eggs with 20 free',
      '19,2025-06-02,te,,,BPS4001,,,30,0,nos,6,Sold to employee - deducted from salary',
    ].join('\n')
    const notes = [
      '# sale_type values: je | te | be | bird_cull | bird_lame | bird_weak | bird_sex_error | gas | manure | other',
      '# unit: nos (birds/eggs) | kg | ltrs | bags',
      '# amount = quantity x rate (auto-calculated on import). free_qty is given away, never charged.',
      '# shed_no: for BIRD sales, which shed the birds left. Leave blank only if genuinely unknown.',
      '# employee_emp_id: fill instead of party_name when an employee bought it. Both blank = outside sale with no party.',
    ].join('\n')
    const blob = new Blob([notes + '\n' + headers + '\n' + example], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'nhe_bird_sales_template.csv'; a.click()
  }

  const handleExport = () => {
    const rows = filtered ?? []
    // The export carries the same columns the import accepts, so a sale can be
    // exported, corrected in Excel and put back without losing the shed, the
    // employee or the free quantity.
    const headers = 'Flock,Date,Type,Shed,Party,Employee,DC No,Invoice No,Qty,Free,Unit,Rate,Amount,Remarks'
    const esc = (v: any) => {
      const t = String(v ?? '')
      return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t
    }
    const lines = rows.map((r: any) => [
      r.flocks?.flock_no ?? '', r.sale_date,
      r.sale_type,
      r.sheds?.shed_no ?? '',
      r.parties?.name ?? '', r.employees?.emp_id ?? '', r.dc_no ?? '', r.invoice_no ?? '',
      r.quantity ?? '', r.free_qty ?? 0, r.unit ?? '', r.rate ?? '', r.amount ?? '', r.remarks ?? ''
    ].map(esc).join(','))
    const blob = new Blob([headers + '\n' + lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `nhe_sales_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  // Import CSV
  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const { headers: header, rows: rawRows } = await parseFile(file)
      const rows = rawRows.map(vals => { const obj: any = {}; header.forEach((h,i) => { obj[h] = vals[i]??'' }); return obj }).filter(r => r.sale_date && r.flock_no)

      // Resolve flock_no → flock_id, party_name → party_id
      const flockMap: Record<string, string> = {}
      flocks?.forEach((f: any) => { flockMap[String(f.flock_no)] = f.id })
      const partyMap: Record<string, string> = {}
      parties?.forEach((p: any) => { partyMap[p.name.toLowerCase()] = p.id })
      const empMap: Record<string, string> = {}
      employees?.forEach((e: any) => {
        if (e.emp_id) empMap[String(e.emp_id).toLowerCase()] = e.id
        if (e.name) empMap[String(e.name).toLowerCase()] = e.id
      })

      // shed_no is only meaningful inside a flock — the same number exists at
      // several sites — so the sheds a flock is actually in are looked up per
      // flock, from the same three sources the form uses.
      const shedMap: Record<string, string> = {}
      const wantedFlockIds = [...new Set(rows.map(r => flockMap[r.flock_no]).filter(Boolean))]
      if (wantedFlockIds.length > 0 && rows.some(r => String(r.shed_no ?? '').trim())) {
        const [fs, sa, tr] = await Promise.all([
          supabase.from('flock_sheds').select('flock_id,sheds(id,shed_no)').in('flock_id', wantedFlockIds),
          supabase.from('shed_allocations').select('flock_id,sheds(id,shed_no)').in('flock_id', wantedFlockIds),
          supabase.from('flock_transfers').select('flock_id,sheds:to_shed_id(id,shed_no)')
            .in('flock_id', wantedFlockIds).not('to_shed_id', 'is', null),
        ])
        for (const r of [...(fs.data ?? []), ...(sa.data ?? []), ...(tr.data ?? [])] as any[]) {
          const sh = r.sheds
          if (sh?.id) shedMap[`${r.flock_id}|${String(sh.shed_no).trim()}`] = sh.id
        }
      }

      let shedMisses = 0
      const records = rows.map(r => {
        const flock_id = flockMap[r.flock_no] ?? null
        const shedNo = String(r.shed_no ?? '').trim()
        // A shed that cannot be matched is left empty rather than guessed —
        // a wrong shed moves birds off the wrong closing count.
        const shed_id = shedNo && flock_id ? (shedMap[`${flock_id}|${shedNo}`] ?? null) : null
        if (shedNo && !shed_id) shedMisses += 1
        const empKey = String(r.employee_emp_id ?? '').trim().toLowerCase()
        const employee_id = empKey ? (empMap[empKey] ?? null) : null
        return {
          flock_id,
          sale_date: r.sale_date,
          sale_type: r.sale_type || 'other',
          shed_id,
          party_id: r.party_name ? (partyMap[r.party_name.toLowerCase()] ?? null) : null,
          employee_id,
          is_employee_sale: !!employee_id,
          dc_no: r.dc_no || null,
          invoice_no: r.invoice_no || null,
          quantity: r.quantity !== '' ? Number(r.quantity) : null,
          free_qty: r.free_qty !== '' && r.free_qty != null ? Number(r.free_qty) : 0,
          unit: r.unit || 'nos',
          rate: r.rate !== '' ? Number(r.rate) : null,
          amount: (Number(r.quantity||0) * Number(r.rate||0)) || null,
          remarks: r.remarks || null,
        }
      }).filter(r => r.flock_id && r.amount)
      if (shedMisses > 0) {
        toast(`${shedMisses} row${shedMisses === 1 ? '' : 's'} named a shed the flock is not in — imported without a shed`,
          { icon: '\u26a0\ufe0f' })
      }

      if (records.length === 0) throw new Error('No valid rows found. Check flock_no and amount columns.')
      // Skip rows that already exist — re-importing the same file used to
      // duplicate every sale.
      const { data: existingSales } = await supabase.from('nhe_sales')
        .select('id,flock_id,sale_date,sale_type,dc_no,amount')
        .in('flock_id', [...new Set(records.map((r: any) => r.flock_id))])
        .in('sale_date', [...new Set(records.map((r: any) => r.sale_date))])
      const isDupe = (r: any) => (existingSales ?? []).some((e: any) =>
        e.flock_id === r.flock_id && e.sale_date === r.sale_date && e.sale_type === r.sale_type &&
        (r.dc_no != null ? e.dc_no === r.dc_no : e.amount === r.amount))
      const freshRecords = records.filter((r: any) => !isDupe(r))
      const dupCount = records.length - freshRecords.length

      // Update mode: a row that matches a sale already entered is written over
      // it rather than skipped. Only the columns the sheet actually carries are
      // touched, so a blank cell never wipes something already recorded.
      let updated = 0
      if (updateExisting && dupCount > 0) {
        const matchOf = (r: any) => (existingSales ?? []).find((e: any) =>
          e.flock_id === r.flock_id && e.sale_date === r.sale_date && e.sale_type === r.sale_type &&
          (r.dc_no != null ? e.dc_no === r.dc_no : e.amount === r.amount))
        for (const r of records.filter(isDupe)) {
          const match: any = matchOf(r)
          if (!match?.id) continue
          const patch: any = {}
          if (r.shed_id) patch.shed_id = r.shed_id
          if (r.employee_id) { patch.employee_id = r.employee_id; patch.is_employee_sale = true }
          if (r.invoice_no) patch.invoice_no = r.invoice_no
          if (r.free_qty) patch.free_qty = r.free_qty
          if (r.party_id) patch.party_id = r.party_id
          if (r.remarks) patch.remarks = r.remarks
          if (Object.keys(patch).length === 0) continue
          const { error: upErr } = await supabase.from('nhe_sales').update(patch).eq('id', match.id)
          if (!upErr) updated += 1
        }
      }

      if (freshRecords.length === 0 && updated === 0) {
        throw new Error(`All ${dupCount} rows already exist — nothing imported`)
      }
      if (freshRecords.length > 0) {
        const { error } = await supabase.from('nhe_sales').insert(freshRecords)
        if (error) throw error
      }
      qc.invalidateQueries({ queryKey: ['nhe_sales'] })
      const skipped = dupCount - updated
      toast.success(`Imported ${freshRecords.length} sale${freshRecords.length === 1 ? '' : 's'}` +
        (updated ? `, updated ${updated}` : '') +
        (skipped > 0 ? ` (${skipped} already existed)` : ''))
    } catch (e: any) {
      toast.error('Import failed: ' + e.message)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const partyOptions = parties?.map((p: any) => ({ value: p.id, label: p.name })) ?? []

  const filtered = (sales ?? []).filter((s: any) => {
    if (typeFilter === 'bird_sale' && !isBirdSale(s.sale_type)) return false
    if (typeFilter && typeFilter !== 'bird_sale' && s.sale_type !== typeFilter) return false
    if (partyFilter.trim()) {
      const q = partyFilter.trim().toLowerCase()
      if (!String(s.parties?.name ?? '').toLowerCase().includes(q) &&
          !String(s.employees?.name ?? '').toLowerCase().includes(q) &&
          !String(s.employees?.emp_id ?? '').toLowerCase().includes(q) &&
          !String(s.dc_no ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  // Every filtered row is loaded and counted; only the RENDERED slice is
  // paged, so the totals and the type summary always cover the whole set.
  const pg = usePagination(filtered.length, `${typeFilter}|${partyFilter}|${flockFilter}|${empFilter}|${payFilter}|${fromDate}|${toDate}`)
  const pageRows = filtered.slice(pg.from, pg.to)

  const saleIds = filtered.map((s: any) => s.id)
  const allSel  = saleIds.length > 0 && saleIds.every((id: string) => sel.has(id))
  const someSel = saleIds.some((id: string) => sel.has(id))
  const toggle    = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? saleIds.forEach((id: string) => n.delete(id)) : saleIds.forEach((id: string) => n.add(id)); return n })

  // Summary by type — follows all active filters (flock, date, type, party)
  const byType = filtered.reduce((acc: any, s: any) => {
    if (!acc[s.sale_type]) acc[s.sale_type] = { amount: 0, qty: 0, count: 0 }
    acc[s.sale_type].amount += Number(s.amount ?? 0)
    acc[s.sale_type].qty   += Number(s.quantity ?? 0)
    acc[s.sale_type].count += 1
    return acc
  }, {})

  // Bird sales summary: total birds + weight + value (follows all active filters)
  const payTotSale = filtered.reduce((s: number, r: any) => s + (r.amount ?? 0), 0)
  // Eggs given away free across the currently-filtered sales — surfaced as
  // its own stat card so give-aways are visible instead of hiding inside a
  // zero-rate line.
  const totalFreeQty = filtered.reduce((s: number, r: any) => s + Number(r.free_qty ?? 0), 0)
  const payTotRecd = filtered.reduce((s: number, r: any) => s + (r.amount_received ?? 0), 0)
  const payTotDue  = Math.max(0, payTotSale - payTotRecd)

  const birdSales = filtered.filter((s: any) => isBirdSale(s.sale_type))
  const birdTotalBirds  = birdSales.reduce((s: number, r: any) => s + (r.quantity ?? 0), 0)
  const birdTotalWeight = birdSales.reduce((s: number, r: any) => s + (r.total_weight_kg ?? 0), 0)
  const birdTotalAmt    = birdSales.reduce((s: number, r: any) => s + (r.amount ?? 0), 0)
  const birdAvgRateKg   = birdTotalWeight > 0 ? birdTotalAmt / birdTotalWeight : 0
  const birdByCategory  = birdSales.reduce((acc: any, r: any) => {
    const cat = r.bird_category || (r.sale_type === 'bird_cull' ? 'cull' : r.sale_type === 'bird_lame' ? 'lame' : r.sale_type === 'bird_weak' ? 'weak' : r.sale_type === 'bird_sex_error' ? 'sex_error' : 'other')
    if (!acc[cat]) acc[cat] = { qty: 0, weight: 0, amount: 0 }
    acc[cat].qty    += r.quantity ?? 0
    acc[cat].weight += r.total_weight_kg ?? 0
    acc[cat].amount += r.amount ?? 0
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <SectionHeader title="NHE & Bird Sales"
        subtitle="Non-hatching eggs, bird sales, gas, manure income"
        action={<Button icon={<Plus size={16}/>} onClick={openNew}>Add Sale</Button>}
      />

      {(empDues?.length ?? 0) > 0 && (
        <Card className="p-3">
          <button className="flex items-center justify-between w-full text-sm font-semibold text-gray-700"
            onClick={() => setShowDues(v => !v)}>
            <span>Employee Dues — {empDues!.length} employees · Pending {inr(empDues!.reduce((s: number, r: any) => s + r.pending, 0))}</span>
            <span className="text-xs text-brand-600">{showDues ? 'Hide ▲' : 'Show ▼'}</span>
          </button>
          {showDues && (
            <div className="overflow-x-auto mt-2">
              <Table>
                <thead><tr><Th>Employee</Th><Th right>Vouchers</Th><Th right>Total</Th><Th right>Received</Th><Th right>Pending</Th><Th></Th></tr></thead>
                <tbody>
                  {empDues!.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50 align-top">
                      <Td className="text-xs">
                        {r.emp_id ? `${r.emp_id} — ` : ''}{r.name}
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {Object.entries(r.byType).map(([t, amt]: any) => `${t}: ${inr(amt)}`).join('  ·  ')}
                        </div>
                      </Td>
                      <Td right className="text-xs">{r.vouchers}</Td>
                      <Td right className="text-xs">{inr(r.total)}</Td>
                      <Td right className="text-xs text-green-700">{inr(r.received)}</Td>
                      <Td right className={`text-xs font-semibold ${r.pending > 0 ? 'text-red-600' : 'text-gray-400'}`}>{inr(r.pending)}</Td>
                      <Td><button className="text-xs text-brand-600 hover:underline" onClick={() => setEmpFilter(r.id)}>View</button></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      )}

      {(partyDues?.length ?? 0) > 0 && (
        <Card className="p-3">
          <button className="flex items-center justify-between w-full text-sm font-semibold text-gray-700"
            onClick={() => setShowPartyDues(v => !v)}>
            <span>Party (Buyer) Dues — {partyDues!.length} parties · Pending {inr(partyDues!.reduce((s: number, r: any) => s + r.pending, 0))}</span>
            <span className="text-xs text-brand-600">{showPartyDues ? 'Hide ▲' : 'Show ▼'}</span>
          </button>
          {showPartyDues && (
            <div className="overflow-x-auto mt-2">
              <Table>
                <thead><tr><Th>Party</Th><Th right>Vouchers</Th><Th right>Total</Th><Th right>Received</Th><Th right>Pending</Th></tr></thead>
                <tbody>
                  {partyDues!.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50 align-top">
                      <Td className="text-xs">
                        {r.name}
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {Object.entries(r.byType).map(([t, amt]: any) => `${t}: ${inr(amt)}`).join('  ·  ')}
                        </div>
                      </Td>
                      <Td right className="text-xs">{r.vouchers}</Td>
                      <Td right className="text-xs">{inr(r.total)}</Td>
                      <Td right className="text-xs text-green-700">{inr(r.received)}</Td>
                      <Td right className={`text-xs font-semibold ${r.pending > 0 ? 'text-red-600' : 'text-gray-400'}`}>{inr(r.pending)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap items-end">
        <SearchableSelect placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={v => setFlockFilter(v)} className="w-44" />
        <SearchableSelect placeholder="All Employees"
          options={[{ value: '', label: 'All Employees' }, ...(employees ?? []).map((e: any) => ({ value: e.id, label: `${e.emp_id ? e.emp_id + ' — ' : ''}${e.name}` }))]}
          value={empFilter} onChange={v => setEmpFilter(v)} className="w-48" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Types</option>
          {NHE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={payFilter} onChange={e => setPayFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Payments</option>
          <option value="Received">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Pending">Due</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          From <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm" />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          To <DateInput value={toDate} onChange={e => setToDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm" />
        </label>
        <input
          type="text"
          placeholder="Search party / employee / DC No…"
          value={partyFilter}
          onChange={e => setPartyFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-48"
        />
        {(hasFilter || typeFilter || partyFilter || payFilter) && <Button variant="ghost" size="sm" onClick={() => { setFlockFilter(''); setEmpFilter(''); setPayFilter(''); setFromDate(''); setToDate(''); setTypeFilter(''); setPartyFilter('') }}>Clear</Button>}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleDownloadTemplate}>Template</Button>
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>
          <Button variant="outline" size="sm" icon={<Upload size={14}/>} loading={importing} onClick={() => fileRef.current?.click()}>Import</Button>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 select-none" title="A row matching a sale already entered updates it instead of being skipped — use this to fill in the shed on sales entered before the shed column existed.">
            <input type="checkbox" checked={updateExisting} onChange={e => setUpdateExisting(e.target.checked)} />
            Update existing
          </label>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }} />
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-3 ${totalFreeQty > 0 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
        <StatCard title="Total Sales" value={inr(payTotSale)} icon={<Package size={18}/>} color="text-blue-600" />
        <StatCard title="Received (Paid)" value={inr(payTotRecd)} icon={<Package size={18}/>} color="text-green-600" />
        <StatCard title="Due" value={inr(payTotDue)} icon={<AlertCircle size={18}/>} color="text-red-600" />
        {totalFreeQty > 0 && (
          <StatCard title="Free Eggs Given" value={totalFreeQty.toLocaleString('en-IN')} subtitle="Not billed" icon={<Egg size={18}/>} color="text-orange-600" />
        )}
      </div>

      {/* Bird Sales Summary */}
      {birdSales.length > 0 && (
        <Card>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bird Sales Summary</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
              <p className="text-xs text-orange-700 font-medium">Total Revenue</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{inr(birdTotalAmt)}</p>
              <p className="text-xs text-gray-500">{birdSales.length} transactions</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
              <p className="text-xs text-orange-700 font-medium">Total Birds Sold</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{birdTotalBirds.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500">birds</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
              <p className="text-xs text-orange-700 font-medium">Total Weight</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{birdTotalWeight.toFixed(1)} kg</p>
              <p className="text-xs text-gray-500">live weight</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
              <p className="text-xs text-orange-700 font-medium">Avg Rate / kg</p>
              <p className="text-lg font-bold text-gray-900 mt-1">₹{birdAvgRateKg.toFixed(2)}</p>
              <p className="text-xs text-gray-500">overall</p>
            </div>
          </div>
          {Object.keys(birdByCategory).length > 1 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(birdByCategory).map(([cat, d]: any) => (
                <div key={cat} className="px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-xs">
                  <span className="font-semibold capitalize text-orange-700">{cat}</span>
                  <span className="text-gray-500 ml-2">{d.qty} birds · {d.weight.toFixed(1)} kg · {inr(d.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Other income summary */}
      {Object.keys(byType).filter(t => !isBirdSale(t)).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(byType).filter(([t]) => !isBirdSale(t)).map(([type, d]: any) => (
            <Card key={type} className="!p-3">
              <p className="text-xs text-gray-500">{NHE_TYPES.find(t => t.value === type)?.label ?? type}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{inr(d.amount)}</p>
              <p className="text-xs text-gray-400">{d.count} entries · {d.qty > 0 ? `${d.qty.toLocaleString('en-IN')} nos` : ''}</p>
            </Card>
          ))}
        </div>
      )}

      <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)}
        extraAction={sel.size > 1 ? <Button variant="outline" size="sm" onClick={() => setConsolidateOpen(true)}>Consolidate to Invoice</Button> : undefined} />

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
              <Th>Flock</Th><Th>Date</Th><Th>Type</Th><Th>Party</Th>
              <Th right>Qty</Th><Th right>Wt (kg)</Th><Th right>₹/kg</Th><Th right>Amount</Th>
              <Th>Payment</Th><Th>Vehicle No</Th><Th>DC No</Th><Th></Th>
            </tr></thead>
            <tbody>
              {pageRows.map((s: any) => (
                <tr key={s.id} className={`hover:bg-gray-50 ${sel.has(s.id) ? 'bg-red-50' : ''} ${isBirdSale(s.sale_type) ? 'bg-orange-50/40' : ''}`}>
                  <Td><CB checked={sel.has(s.id)} onChange={() => toggle(s.id)}/></Td>
                  <Td><Badge color="green">F-{s.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(s.sale_date)}</Td>
                  <Td className="text-xs">
                    {isBirdSale(s.sale_type) ? (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                        Birds — {s.bird_category ?? (s.sale_type==='bird_sex_error'?'sex_error':s.sale_type.replace('bird_',''))} ({s.bird_sex ?? '?'})
                      </span>
                    ) : s.nhe_sale_lines?.length > 1 ? (
                      <div className="space-y-0.5">
                        {s.nhe_sale_lines.map((l: any, i: number) => (
                          <div key={i} className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {l.sale_type.toUpperCase()} — {l.quantity?.toLocaleString('en-IN') ?? '?'} nos @ ₹{l.rate ?? '?'} = {inr(l.amount ?? 0)}
                            {Number(l.free_qty ?? 0) > 0 && <span className="ml-1 text-orange-600">+{Number(l.free_qty).toLocaleString('en-IN')} free</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {NHE_TYPES.find(t => t.value === s.sale_type)?.label ?? s.sale_type}
                      </span>
                    )}
                  </Td>
                  <Td className="text-xs text-gray-500">
                    {s.is_employee_sale
                      ? <span className="text-purple-700 font-medium">{s.employees?.name ?? '—'} <span className="text-gray-400 font-normal">(Emp)</span></span>
                      : (s.parties?.name ?? '—')}
                  </Td>
                  <Td right className="text-xs">
                    {s.quantity != null ? s.quantity.toLocaleString('en-IN') : '—'}
                    {Number(s.free_qty ?? 0) > 0 && (
                      <div className="text-[10px] text-orange-600 font-medium">incl. {Number(s.free_qty).toLocaleString('en-IN')} free</div>
                    )}
                  </Td>
                  <Td right className="text-xs text-gray-500">{s.total_weight_kg ? s.total_weight_kg.toFixed(1) : '—'}</Td>
                  <Td right className="text-xs">{s.rate_per_kg ? `₹${s.rate_per_kg}` : s.rate ? `₹${s.rate}` : '—'}</Td>
                  <Td right className="font-semibold text-green-700 text-xs">
                    {inr(s.amount)}
                    {(s.payment_cash > 0 || s.payment_online > 0) && (
                      <div className="text-[10px] text-gray-400 font-normal">
                        {s.payment_cash > 0 && `💵${inr(s.payment_cash)}`}
                        {s.payment_online > 0 && ` 📲${inr(s.payment_online)}`}
                      </div>
                    )}
                  </Td>
                  <Td className="text-xs">
                    {s.payment_status === 'Received'
                      ? <button onClick={() => setReceiptSale(s)} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium hover:bg-green-200">✓ {s.payment_mode ?? 'Paid'}{s.bank_accounts ? ` · ${s.bank_accounts.bank_name}` : ''}</button>
                      : s.payment_status === 'Partial'
                        ? <button onClick={() => setReceiptSale(s)} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium hover:bg-yellow-200">◑ Partial {s.amount_received ? `· ${inr(s.amount_received)}` : ''}</button>
                        : <button onClick={() => setReceiptSale(s)} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200 text-xs hover:bg-orange-100">⊕ Receive</button>}
                  </Td>
                  <Td className="text-xs text-gray-400">{s.vehicle_no ?? '—'}</Td>
                  <Td className="text-xs text-gray-400">{s.dc_no ?? '—'}</Td>
                  <Td>
                    <div className="flex gap-1">
                      {isBirdSale(s.sale_type) && (Number(s.amount_received) || 0) > (Number(s.amount) || 0) && (
                        <button onClick={() => setRefundSale(s)} className="p-1 text-orange-500 hover:text-orange-700" title="Refund excess payment to bank">↩</button>
                      )}
                      <button onClick={() => openEdit(s)} className="p-1 text-blue-400 hover:text-blue-600" title="Edit sale"><Edit2 size={13}/></button>
                      <button onClick={() => printNHESale({
                        id: s.id, sale_date: s.sale_date, sale_type: s.sale_type,
                        invoice_no: s.invoice_no, dc_no: s.dc_no, flock_no: s.flocks?.flock_no,
                        quantity: s.quantity, unit: s.unit, rate: s.rate, amount: s.amount,
                        taxable_value: s.taxable_value, gst_pct: s.gst_pct ?? 0,
                        cgst_amount: s.cgst_amount, sgst_amount: s.sgst_amount, igst_amount: s.igst_amount,
                        buyer_gstin: s.buyer_gstin, party_name: s.parties?.name ?? '—',
                        party_address: [s.parties?.address, s.parties?.contact].filter(Boolean).join(' | '),
                        vehicle_no: s.vehicle_no, bird_sex: s.bird_sex, bird_category: s.bird_category,
                        avg_weight_kg: s.avg_weight_kg, total_weight_kg: s.total_weight_kg, rate_per_kg: s.rate_per_kg
                      })} className="p-1 text-gray-400 hover:text-blue-600" title="Print invoice"><Printer size={13}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold">
                <Td colSpan={7}>TOTAL ({filtered.length} records)</Td>
                <Td right className="text-green-700">{inr(filtered.reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0))}</Td>
                <Td colSpan={4}></Td>
              </tr></tfoot>
            )}
          </Table>
          <PageSizeControl page={pg.page} setPage={pg.setPage}
            pageSize={pg.pageSize} setPageSize={pg.setPageSize}
            totalPages={pg.totalPages} totalItems={filtered.length} />
          {filtered.length === 0 && <EmptyState icon={<Egg size={32}/>} title="No sales yet" action={<Button onClick={openNew} icon={<Plus size={16}/>}>Add</Button>} />}
        </Card>
      )}

      {bulkConfirm && (
        <ConfirmBulkDelete label={`Delete ${sel.size} NHE/bird sale records? This cannot be undone.`}
          onConfirm={() => bulkDelMut.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}

      <ConsolidateInvoiceModal open={consolidateOpen} ids={[...sel]} table="nhe_sales"
        onClose={() => setConsolidateOpen(false)}
        onSaved={() => { setConsolidateOpen(false); setSel(new Set()); qc.invalidateQueries({ queryKey: ['nhe_sales'] }) }} />

      <ReceivePaymentModal
        open={!!receiptSale}
        sale={receiptSale}
        bankAccounts={bankAccounts ?? []}
        farms={farmsNhe ?? []}
        table="nhe_sales"
        onClose={() => setReceiptSale(null)}
        onSaved={() => {
          setReceiptSale(null)
          qc.invalidateQueries({ queryKey: ['nhe_sales'] })
          qc.invalidateQueries({ queryKey: ['cash_book'] })
          qc.invalidateQueries({ queryKey: ['bank_transactions'] })
        }}
      />

      <RefundExcessModal
        open={!!refundSale}
        sale={refundSale}
        bankAccounts={bankAccounts ?? []}
        onClose={() => setRefundSale(null)}
        onSaved={() => {
          setRefundSale(null)
          qc.invalidateQueries({ queryKey: ['nhe_sales'] })
          qc.invalidateQueries({ queryKey: ['bank_transactions'] })
        }}
      />

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); setNheLines([emptyNheLine()]) }}
        title={editing ? 'Edit NHE / Bird Sale' : 'Record NHE / Bird Sale'} size="lg"
        footer={<>
          {nheDraftChecked && nheDraft && !nheDraftDismissed && (
            <Button variant="secondary" onClick={() => {
              const d = nheDraft.data || {}
              if (d.form) setForm((f: any) => ({ ...f, ...d.form }))
              if (d.nheLines?.length) setNheLines(d.nheLines)
              setNheDraftDismissed(true)
            }}>Restore Draft</Button>
          )}
          <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null); setNheLines([emptyNheLine()]) }}>Cancel</Button>
          <Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <SearchableSelect label="Flock" required placeholder="— Select —" options={flockOptions}
              value={form.flock_id} onChange={v => sv('flock_id', v)} />
            <DateInput label="Sale Date" required value={form.sale_date} onChange={e => sv('sale_date', e.target.value)} />
            <Select label="Sale Type" required options={NHE_TYPES} value={form.sale_type} onChange={e => {
              sv('sale_type', e.target.value)
              if (isEggSale(e.target.value)) setNheLines([{ ...emptyNheLine(), sale_type: e.target.value }])
            }} />
          </FormRow>

          {/* ── Invoice & GST (common) ── */}
          <FormRow cols={3}>
            <div className="flex items-end gap-1">
              <div className="w-24">
                <Select label="Series" value={invSeries} onChange={e => setInvSeries(e.target.value)}
                  options={[{value:'NHE',label:'NHE'},{value:'CB',label:'Cull Birds'}]} />
              </div>
              <div className="flex-1">
                <Input label="Invoice No" placeholder="auto →" value={form.invoice_no} onChange={e => sv('invoice_no', e.target.value)} />
              </div>
              <Button type="button" variant="outline" size="sm" loading={genningInv} onClick={genInvoice}>Gen</Button>
            </div>
            <Select label="GST %" value={form.gst_pct} onChange={e => sv('gst_pct', e.target.value)}
              options={GST_RATE_OPTIONS} />
            <Input label="Supply Type" disabled
              value={(() => { const b = parties?.find((p:any)=>p.id===form.party_id); return supplyType(b?.state_code)==='inter'?'Inter (IGST)':'Intra (CGST+SGST)' })()} />
          </FormRow>

          {/* ── Bird Sale fields ── */}
          {isBirdSale(form.sale_type) && (
            <>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-orange-700 uppercase">Bird Details</p>
                <FormRow cols={3}>
                  <Select label="Bird Sex (for reporting)" options={BIRD_SEX_OPTS}
                    value={form.bird_sex} onChange={e => sv('bird_sex', e.target.value)} />
                  <Select label="Category" options={BIRD_CAT_OPTS}
                    value={form.bird_category} onChange={e => sv('bird_category', e.target.value)} />
                  {/* The shed the birds left. The culls are written onto THAT
                      shed's daily record, so Bulk Daily Entry shows them and the
                      shed's closing count is right. Left blank they behave as
                      before — flock level, and not attributable to any shed. */}
                  <SearchableSelect label="Shed (birds sold from)" placeholder="— Flock level —"
                    options={saleShedOptions} value={form.shed_id} onChange={v => sv('shed_id', v)} />
                </FormRow>
                <FormRow cols={3}>
                  <Input label="Female Qty" type="number"
                    value={form.female_qty} onChange={e => sv('female_qty', e.target.value)} />
                  <Input label="Male Qty" type="number"
                    value={form.male_qty} onChange={e => sv('male_qty', e.target.value)} />
                  <Input label="Total Birds" type="number" disabled
                    value={form.quantity} hint="Auto: Female + Male" />
                </FormRow>
                <p className="text-[10px] text-orange-600 font-medium uppercase">Vehicle Weighbridge</p>
                <FormRow cols={3}>
                  <Input label="Gross Weight (kg)" type="number" step="0.001"
                    value={form.gross_weight_kg} onChange={e => sv('gross_weight_kg', e.target.value)} />
                  <Input label="Tare Weight (kg)" type="number" step="0.001"
                    value={form.tare_weight_kg} onChange={e => sv('tare_weight_kg', e.target.value)} />
                  <Input label="Net Weight (kg)" type="number" step="0.001" disabled
                    value={form.net_weight_kg} hint="Auto: Gross − Tare" />
                </FormRow>
                <FormRow cols={3}>
                  <Input label="Avg Weight/bird (kg)" type="number" step="0.001" disabled
                    value={form.avg_weight_kg} hint="Auto: Net ÷ Total Birds" />
                  <Input label="Rate per kg (₹)" type="number" step="0.01"
                    value={form.rate_per_kg} onChange={e => sv('rate_per_kg', e.target.value)} />
                  <Input label="Total Amount (₹)" required type="number" step="0.01"
                    value={form.amount} onChange={e => sv('amount', e.target.value)}
                    hint={autoAmt > 0 ? `Auto: ${inr(autoAmt)}` : 'Net wt × rate/kg'} />
                </FormRow>
              </div>

              {/* ── Extra shed/sex lines — same voucher (DC No), more sheds ──
                  Only offered on a fresh entry; the box above is the first
                  line, these are additional ones sharing its date/party/DC. */}
              {!editing && (
                <div className="space-y-2">
                  {extraBirdLines.map((line, idx) => (
                    <div key={idx} className="p-3 bg-orange-50/60 border border-orange-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-orange-700 uppercase">Extra Line {idx + 2} — another shed/sex</p>
                        <button type="button" onClick={() => removeExtraBirdLine(idx)}
                          className="text-xs text-red-500 hover:text-red-700">Remove</button>
                      </div>
                      <FormRow cols={4}>
                        <SearchableSelect label="Shed" placeholder="— Flock level —"
                          options={saleShedOptions} value={line.shed_id} onChange={v => setExtraBirdLine(idx, { shed_id: v })} />
                        <Select label="Sex" options={BIRD_SEX_OPTS}
                          value={line.bird_sex} onChange={e => setExtraBirdLine(idx, { bird_sex: e.target.value })} />
                        <Select label="Category" options={BIRD_CAT_OPTS}
                          value={line.bird_category} onChange={e => setExtraBirdLine(idx, { bird_category: e.target.value })} />
                        <Input label="Qty" type="number"
                          value={line.quantity} onChange={e => setExtraBirdLine(idx, { quantity: e.target.value })} />
                      </FormRow>
                      <FormRow cols={2}>
                        <Input label="Rate (₹/bird)" type="number" step="0.01"
                          value={line.rate} onChange={e => setExtraBirdLine(idx, { rate: e.target.value })} />
                        <Input label="Amount (₹)" type="number" step="0.01"
                          value={line.amount} onChange={e => setExtraBirdLine(idx, { amount: e.target.value })}
                          hint="Auto: Qty × Rate" />
                      </FormRow>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addExtraBirdLine}>
                    + Add Another Shed/Sex
                  </Button>
                  {extraBirdLines.length > 0 && (
                    <p className="text-xs text-gray-500">
                      One DC No / date / party covers all lines above — {extraBirdLines.length + 1} sale
                      {extraBirdLines.length + 1 > 1 ? 's' : ''} will be saved for this voucher.
                    </p>
                  )}
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase">Payment & Logistics</p>
                <FormRow cols={3}>
                  <Input label="Cash Received (₹)" type="number" step="0.01"
                    value={form.payment_cash} onChange={e => sv('payment_cash', e.target.value)} />
                  <Input label="Online / NEFT (₹)" type="number" step="0.01"
                    value={form.payment_online} onChange={e => sv('payment_online', e.target.value)} />
                  <div className="flex items-end pb-1">
                    {(parseFloat(form.payment_cash)||0)+(parseFloat(form.payment_online)||0) > 0 && (
                      <p className="text-sm font-semibold text-gray-700">
                        Total: {inr((parseFloat(form.payment_cash)||0)+(parseFloat(form.payment_online)||0))}
                      </p>
                    )}
                  </div>
                </FormRow>
                {(parseFloat(form.payment_cash)||0) > 0 && (
                  <div>
                    <Select label="Cash Received At (Location)" value={form.cash_farm_id}
                      onChange={e => sv('cash_farm_id', e.target.value)}
                      options={[
                        { value: 'ho', label: 'Head Office' },
                        ...(farmsNhe ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (Site)` }))
                      ]} />
                    <p className="text-[10px] text-blue-600 mt-0.5">Cash Book entry will be created automatically</p>
                  </div>
                )}
                {(parseFloat(form.payment_online)||0) > 0 && (
                  <div>
                    <Select label="Bank Account (NEFT/Online)" placeholder="— Select bank —"
                      value={form.bank_account_id} onChange={e => sv('bank_account_id', e.target.value)}
                      options={(bankAccounts ?? []).map((b: any) => ({ value: b.id, label: `${b.bank_name}${b.account_name ? ' — '+b.account_name : ''}` }))} />
                    <p className="text-[10px] text-blue-600 mt-0.5">Bank transaction entry will be created automatically</p>
                  </div>
                )}
                <FormRow cols={3}>
                  <Input label="Vehicle No" value={form.vehicle_no} onChange={e => sv('vehicle_no', e.target.value)} />
                  <div className="relative">
                    <div className="flex items-end gap-1">
                      <div className="flex-1">
                        <SearchableSelect label="Party / Buyer" placeholder="— Select —" options={partyOptions}
                          value={form.party_id} onChange={v => sv('party_id', v)} />
                      </div>
                      <QuickAddParty defaultType="buyer" onCreated={p => sv('party_id', p.id)} />
                    </div>
                  </div>
                  <Input label="DC No" value={form.dc_no} onChange={e => sv('dc_no', e.target.value)} />
                </FormRow>
              </div>
            </>
          )}

          {/* ── Non-bird sale fields ── */}
          {!isBirdSale(form.sale_type) && (
            <>
              <FormRow>
                <div className="relative">
                  <div className="flex items-end gap-1">
                    <div className="flex-1">
                      <SearchableSelect label="Party" placeholder="— Select —" options={partyOptions}
                        value={form.party_id} onChange={v => sv('party_id', v)} />
                    </div>
                    <QuickAddParty defaultType="buyer" onCreated={p => sv('party_id', p.id)} />
                  </div>
                </div>
                <Input label="DC No" value={form.dc_no} onChange={e => sv('dc_no', e.target.value)} />
              </FormRow>

              {/* ── Egg sale: multi-line table (JE / TE / BE) ── */}
              {isEggSale(form.sale_type) ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Egg Lines</label>
                    <Button size="sm" variant="ghost" onClick={() => setNheLines(l => [...l, emptyNheLine()])}>+ Add Line</Button>
                  </div>
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Type</th>
                        <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Qty (nos)</th>
                        <th className="px-2 py-1 text-right text-xs font-medium text-orange-600" title="Eggs given away free — leave stock but are never billed">Free</th>
                        <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Rate (₹)</th>
                        <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Amount (₹)</th>
                        <th className="px-2 py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {nheLines.map((line, i) => {
                        const lineAmt = (parseFloat(line.quantity)||0) * (parseFloat(line.rate)||0)
                        return (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-1 py-1">
                              <select
                                className="w-full text-xs border border-gray-200 rounded px-1 py-0.5"
                                value={line.sale_type}
                                onChange={e => setNheLines(ls => ls.map((l,j) => j===i ? {...l, sale_type: e.target.value} : l))}
                              >
                                <option value="je">JE – Jumbo</option>
                                <option value="te">TE – Table</option>
                                <option value="be">BE – Broken</option>
                              </select>
                            </td>
                            <td className="px-1 py-1">
                              <input type="number" className="w-full text-xs border border-gray-200 rounded px-1 py-0.5 text-right"
                                value={line.quantity} placeholder="0"
                                onChange={e => setNheLines(ls => ls.map((l,j) => j===i ? {...l, quantity: e.target.value, amount: ''} : l))} />
                            </td>
                            <td className="px-1 py-1">
                              <input type="number" min="0" className="w-full text-xs border border-orange-200 rounded px-1 py-0.5 text-right bg-orange-50/40"
                                value={line.free_qty} placeholder="0"
                                onChange={e => setNheLines(ls => ls.map((l,j) => j===i ? {...l, free_qty: e.target.value} : l))} />
                            </td>
                            <td className="px-1 py-1">
                              <input type="number" className="w-full text-xs border border-gray-200 rounded px-1 py-0.5 text-right"
                                value={line.rate} placeholder="0.00"
                                onChange={e => setNheLines(ls => ls.map((l,j) => j===i ? {...l, rate: e.target.value, amount: ''} : l))} />
                            </td>
                            <td className="px-1 py-1">
                              <input type="number" className="w-full text-xs border border-gray-200 rounded px-1 py-0.5 text-right"
                                value={line.amount || (lineAmt > 0 ? lineAmt.toFixed(2) : '')}
                                placeholder={lineAmt > 0 ? lineAmt.toFixed(2) : '0.00'}
                                onChange={e => setNheLines(ls => ls.map((l,j) => j===i ? {...l, amount: e.target.value} : l))} />
                            </td>
                            <td className="px-1 py-1 text-center">
                              {nheLines.length > 1 && (
                                <button onClick={() => setNheLines(ls => ls.filter((_,j) => j!==i))}
                                  className="text-red-400 hover:text-red-600 text-xs px-1">&#x2715;</button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td className="px-2 py-1 text-xs font-semibold text-gray-700" colSpan={2}>Total</td>
                        <td className="px-2 py-1 text-right text-xs font-semibold text-orange-600">
                          {(() => { const f = nheLines.reduce((s, l) => s + (parseFloat(l.free_qty)||0), 0); return f > 0 ? f.toLocaleString('en-IN') : '—' })()}
                        </td>
                        <td></td>
                        <td className="px-2 py-1 text-right text-xs font-semibold text-gray-900">{inr(linesTotal)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                /* ── Non-egg, non-bird (manure, gas, other): single qty/rate/amount ── */
                <FormRow cols={4}>
                  <Input label="Qty" type="number" value={form.quantity} onChange={e => sv('quantity', e.target.value)} />
                  <Input label="Unit" value={form.unit} onChange={e => sv('unit', e.target.value)} />
                  <Input label="Rate (₹)" type="number" step="0.01" value={form.rate} onChange={e => sv('rate', e.target.value)} />
                  <Input label="Amount (₹)" required type="number" step="0.01" value={form.amount}
                    onChange={e => sv('amount', e.target.value)}
                    hint={autoAmt > 0 ? `Auto: ${inr(autoAmt)}` : undefined} />
                </FormRow>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-blue-700 uppercase">Payment</p>
                <FormRow cols={2}>
                  <Input label="Cash Received (₹)" type="number" step="0.01"
                    value={form.payment_cash} onChange={e => sv('payment_cash', e.target.value)} />
                  <Input label="Online / NEFT (₹)" type="number" step="0.01"
                    value={form.payment_online} onChange={e => sv('payment_online', e.target.value)} />
                </FormRow>
                {(parseFloat(form.payment_cash)||0) > 0 && (
                  <div>
                    <Select label="Cash Received At (Location)" value={form.cash_farm_id}
                      onChange={e => sv('cash_farm_id', e.target.value)}
                      options={[
                        { value: 'ho', label: 'Head Office' },
                        ...(farmsNhe ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (Site)` }))
                      ]} />
                    <p className="text-[10px] text-blue-600 mt-0.5">Cash Book entry will be created automatically</p>
                  </div>
                )}
                {(parseFloat(form.payment_online)||0) > 0 && (
                  <div>
                    <Select label="Bank Account (NEFT/Online)" placeholder="— Select bank —"
                      value={form.bank_account_id} onChange={e => sv('bank_account_id', e.target.value)}
                      options={(bankAccounts ?? []).map((b: any) => ({ value: b.id, label: `${b.bank_name}${b.account_name ? ' — '+b.account_name : ''}` }))} />
                    <p className="text-[10px] text-blue-600 mt-0.5">Bank transaction entry will be created automatically</p>
                  </div>
                )}
              </div>
            </>
          )}

          <Input label="Remarks" value={form.remarks} onChange={e => sv('remarks', e.target.value)} />

          {/* Employee Sale Section */}
          <div className="border border-purple-200 bg-purple-50 rounded-lg p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.is_employee_sale}
                onChange={e => setForm((f: any) => ({ ...f, is_employee_sale: e.target.checked, employee_id: '', deduct_salary: false }))}
                className="rounded border-gray-300 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">Sold to Employee</span>
            </label>
            {form.is_employee_sale && (
              <div className="space-y-2">
                <SearchableSelect label="Employee" required placeholder="— Select employee —"
                  value={form.employee_id} onChange={v => sv('employee_id', v)}
                  options={(employees ?? []).map((e: any) => ({ value: e.id, label: `${e.name}${e.emp_id ? ' ('+e.emp_id+')' : ''}` }))} />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.deduct_salary}
                    onChange={e => setForm((f: any) => ({ ...f, deduct_salary: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600" />
                  <span className="text-sm text-purple-700">Deduct from salary (unpaid — add to salary deduction)</span>
                </label>
                {form.deduct_salary && (
                  <p className="text-xs text-purple-600 bg-purple-100 rounded px-2 py-1">
                    Amount will be added to employee's pending deductions for {form.sale_date?.slice(0,7)} salary
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── MEDICINE ENTRY ───────────────────────────────────────────────
export const MedicineEntry: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [showForm, setShowForm] = useState(false)
  const [flockFilter, setFlockFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [medSearch, setMedSearch] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  // Allocation — medicine issued from the central store to a flock, tracked
  // separately from usage (medicine_usage) so a real received-vs-used
  // balance can be shown per flock (see "Balance" tab below).
  const [showAllocForm, setShowAllocForm] = useState(false)
  const [editingAlloc, setEditingAlloc] = useState<any>(null)
  const [allocForm, setAllocForm] = useState({ flock_id: '', allocation_date: today(), medicine_id: '', quantity: '', unit: '', remarks: '' })
  const [selAlloc, setSelAlloc] = useState<Set<string>>(new Set())
  const [bulkConfirmAlloc, setBulkConfirmAlloc] = useState(false)

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,laying_farm_id,rearing_farm_id').eq('is_vhl_contract', false).order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q; return data ?? []
    }
  })
  const { data: medicines } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => { const { data } = await supabase.from('medicines_master').select('id,name,unit,rate').eq('is_active',true).order('name'); return data ?? [] }
  })

  const hasFilter = !!(flockFilter || fromDate || toDate)

  const { data: usage, isLoading } = useQuery({
    queryKey: ['medicine_usage', flockFilter, fromDate, toDate],
    queryFn: async () => {
      const build = () => {
        let q = supabase.from('medicine_usage')
          .select('*, flocks(flock_no), medicines_master(name,unit,item_id)')
          .order('usage_date', { ascending: false })
        if (flockFilter) q = q.eq('flock_id', flockFilter)
        if (fromDate) q = q.gte('usage_date', fromDate)
        if (toDate) q = q.lte('usage_date', toDate)
        return q
      }
      return fetchAllPages<any>((from, to) => build().range(from, to), 'Medicine usage', toast.error)
    }
  })

  const { data: monthly } = useQuery({
    queryKey: ['medicine_monthly', flockFilter],
    queryFn: async () => {
      let q = supabase.from('medicine_monthly').select('*, flocks(flock_no)').order('month', { ascending: false }).limit(60)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q; return data ?? []
    }
  })

  const { data: allocations, isLoading: loadingAlloc } = useQuery({
    queryKey: ['medicine_allocations', flockFilter, fromDate, toDate],
    queryFn: async () => {
      const build = () => {
        let q = supabase.from('medicine_allocations')
          .select('*, flocks(flock_no), medicines_master(name,unit)')
          .order('allocation_date', { ascending: false })
        if (flockFilter) q = q.eq('flock_id', flockFilter)
        if (fromDate) q = q.gte('allocation_date', fromDate)
        if (toDate) q = q.lte('allocation_date', toDate)
        return q
      }
      return fetchAllPages<any>((from, to) => build().range(from, to), 'Medicine allocations', toast.error)
    }
  })

  // Balance — all-time allocated vs used per flock+medicine, regardless of
  // the date filter above (a running balance should reflect everything).
  const { data: allAllocations } = useQuery({
    queryKey: ['medicine_allocations_all'],
    queryFn: async () => { const { data } = await supabase.from('medicine_allocations').select('flock_id,medicine_id,quantity,flocks(flock_no),medicines_master(name,unit)'); return data ?? [] }
  })
  const { data: allUsage } = useQuery({
    queryKey: ['medicine_usage_all'],
    // Paged: this is the whole table, and it feeds the medicine BALANCE — a
    // short read overstates what is left in stock.
    queryFn: () => fetchAllPages<any>((from, to) => supabase.from('medicine_usage')
      .select('flock_id,medicine_id,quantity').range(from, to), 'Medicine usage totals')
  })
  const balanceRows = React.useMemo(() => {
    const m: Record<string, { flockNo: any; medName: string; unit: string; allocated: number; used: number }> = {}
    for (const a of allAllocations ?? []) {
      if (flockFilter && a.flock_id !== flockFilter) continue
      const key = `${a.flock_id}|${a.medicine_id}`
      const med = a.medicines_master as any
      if (!m[key]) m[key] = { flockNo: (a.flocks as any)?.flock_no, medName: med?.name ?? '—', unit: med?.unit ?? '', allocated: 0, used: 0 }
      m[key].allocated += Number(a.quantity ?? 0)
    }
    for (const u of allUsage ?? []) {
      if (flockFilter && u.flock_id !== flockFilter) continue
      const key = `${u.flock_id}|${u.medicine_id}`
      if (!m[key]) continue // only show medicines that were actually allocated to this flock
      m[key].used += Number(u.quantity ?? 0)
    }
    return Object.values(m).sort((a, b) => a.medName.localeCompare(b.medName))
  }, [allAllocations, allUsage, flockFilter])

  const [tab, setTab] = useState<'daily' | 'monthly' | 'allocation' | 'balance'>('monthly')
  const [form, setForm] = useState({
    flock_id: '', usage_date: today(), medicine_id: '',
    quantity: '', unit: '', rate: '', amount: '', remarks: ''
  })
  const [monthlyForm, setMonthlyForm] = useState({ flock_id: '', month: '', total_amount: '', remarks: '' })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const sm = (k: string, v: string) => setMonthlyForm(f => ({ ...f, [k]: v }))

  const autoAmt = (parseFloat(form.quantity)||0) * (parseFloat(form.rate)||0)

  const mut = useMutation({
    mutationFn: async () => {
      if (tab === 'monthly') {
        if (!monthlyForm.flock_id || !monthlyForm.month || !monthlyForm.total_amount) throw new Error('All fields required')
        const { error } = await supabase.from('medicine_monthly').upsert({
          flock_id: monthlyForm.flock_id, month: monthlyForm.month + '-01',
          total_amount: parseFloat(monthlyForm.total_amount),
          remarks: monthlyForm.remarks || null
        }, { onConflict: 'flock_id,month' })
        if (error) throw error
      } else {
        if (!form.flock_id || !form.usage_date) throw new Error('Flock and date required')
        const { error } = await supabase.from('medicine_usage').insert({
          flock_id: form.flock_id, usage_date: form.usage_date,
          medicine_id: form.medicine_id || null,
          quantity: parseFloat(form.quantity) || null, unit: form.unit || null,
          rate: parseFloat(form.rate) || null,
          amount: parseFloat(form.amount) || autoAmt || null,
          remarks: form.remarks || null
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Saved!')
      qc.invalidateQueries({ queryKey: ['medicine_usage'] })
      qc.invalidateQueries({ queryKey: ['medicine_monthly'] })
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const bulkDelMutMed = useMutation({
    mutationFn: async (ids: string[]) => { const{error}=await supabase.from('medicine_usage').delete().in('id', ids); if(error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medicine_usage'] }); setSel(new Set()); setBulkConfirm(false) },
    onError: (e: any) => toast.error(e.message),
  })

  const delMonthlyMut = useMutation({
    mutationFn: async (id: string) => { const{error}=await supabase.from('medicine_monthly').delete().eq('id', id); if(error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medicine_monthly'] }); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  const saveAllocMut = useMutation({
    mutationFn: async () => {
      if (!allocForm.flock_id || !allocForm.allocation_date || !allocForm.medicine_id || !allocForm.quantity) throw new Error('Flock, date, medicine and quantity are required')
      const payload = {
        flock_id: allocForm.flock_id, allocation_date: allocForm.allocation_date,
        medicine_id: allocForm.medicine_id, quantity: parseFloat(allocForm.quantity),
        unit: allocForm.unit || null, remarks: allocForm.remarks || null,
      }
      if (editingAlloc) {
        const { error } = await supabase.from('medicine_allocations').update(payload).eq('id', editingAlloc.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('medicine_allocations').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Saved!')
      qc.invalidateQueries({ queryKey: ['medicine_allocations'] })
      qc.invalidateQueries({ queryKey: ['medicine_allocations_all'] })
      setShowAllocForm(false); setEditingAlloc(null)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delAllocMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('medicine_allocations').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medicine_allocations'] }); qc.invalidateQueries({ queryKey: ['medicine_allocations_all'] }); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  const bulkDelMutAlloc = useMutation({
    mutationFn: async (ids: string[]) => { const { error } = await supabase.from('medicine_allocations').delete().in('id', ids); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medicine_allocations'] }); qc.invalidateQueries({ queryKey: ['medicine_allocations_all'] }); setSelAlloc(new Set()); setBulkConfirmAlloc(false) },
    onError: (e: any) => toast.error(e.message),
  })

  const openAllocForm = (row?: any) => {
    if (row) {
      setEditingAlloc(row)
      setAllocForm({
        flock_id: row.flock_id ?? '', allocation_date: row.allocation_date ?? today(),
        medicine_id: row.medicine_id ?? '', quantity: row.quantity?.toString() ?? '',
        unit: row.unit ?? '', remarks: row.remarks ?? '',
      })
    } else {
      setEditingAlloc(null)
      setAllocForm({ flock_id: flockFilter, allocation_date: today(), medicine_id: '', quantity: '', unit: '', remarks: '' })
    }
    setShowAllocForm(true)
  }

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const { options: medOptions } = useMedicineOptionsWithAliases()
  const getStockRate = useMedicineRates()
  // Effective rate/amount — same source (stock_ledger's latest inward
  // price, covering GRN + Inventory opening/adjustment entries alike) as
  // the Flock Detail Medicine tab, instead of only ever showing whatever
  // was manually typed into this row's rate/amount fields at entry time.
  const effectiveRate = (u: any) => getStockRate(u.medicines_master?.item_id, u.medicines_master?.name) ?? u.rate ?? null
  const effectiveAmount = (u: any) => {
    const rate = effectiveRate(u)
    return u.amount ?? (rate != null && u.quantity != null ? rate * u.quantity : null)
  }

  const filteredUsage = (usage ?? []).filter((u: any) =>
    !medSearch || String(u.medicines_master?.name ?? '').toLowerCase().includes(medSearch.toLowerCase()))

  const pgUsage = usePagination(filteredUsage.length, medSearch)
  const pageUsage = filteredUsage.slice(pgUsage.from, pgUsage.to)

  const usageIds = filteredUsage.map((u: any) => u.id)
  const allUsageSel = usageIds.length > 0 && usageIds.every((id: string) => sel.has(id))
  const someUsageSel = usageIds.some((id: string) => sel.has(id))
  const toggleUsage = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAllUsage = () => setSel(s => { const n = new Set(s); allUsageSel ? usageIds.forEach((id: string) => n.delete(id)) : usageIds.forEach((id: string) => n.add(id)); return n })

  const filteredAllocations = (allocations ?? []).filter((a: any) =>
    !medSearch || String(a.medicines_master?.name ?? '').toLowerCase().includes(medSearch.toLowerCase()))
  const pgAlloc = usePagination(filteredAllocations.length, medSearch)
  const pageAllocations = filteredAllocations.slice(pgAlloc.from, pgAlloc.to)

  const allocIds = filteredAllocations.map((a: any) => a.id)
  const allAllocSel = allocIds.length > 0 && allocIds.every((id: string) => selAlloc.has(id))
  const someAllocSel = allocIds.some((id: string) => selAlloc.has(id))
  const toggleAlloc = (id: string) => setSelAlloc(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAllAlloc = () => setSelAlloc(s => { const n = new Set(s); allAllocSel ? allocIds.forEach((id: string) => n.delete(id)) : allocIds.forEach((id: string) => n.add(id)); return n })

  const handleExportMed = () => {
    if (tab === 'daily') {
      if (!filteredUsage.length) { toast.error('No data to export'); return }
      exportFlatCSV(`medicine_usage.csv`,
        ['flock_no','usage_date','medicine','qty','unit','rate','amount','remarks'],
        filteredUsage.map((u:any)=>[u.flocks?.flock_no, u.usage_date, u.medicines_master?.name, u.quantity, u.unit, effectiveRate(u), effectiveAmount(u), u.remarks])
      )
    } else if (tab === 'allocation') {
      if (!filteredAllocations.length) { toast.error('No data to export'); return }
      exportFlatCSV(`medicine_allocations.csv`,
        ['flock_no','allocation_date','medicine','qty','unit','remarks'],
        filteredAllocations.map((a:any)=>[a.flocks?.flock_no, a.allocation_date, a.medicines_master?.name, a.quantity, a.unit, a.remarks])
      )
    } else if (tab === 'balance') {
      if (!balanceRows.length) { toast.error('No data to export'); return }
      exportFlatCSV(`medicine_balance.csv`,
        ['flock_no','medicine','unit','allocated','used','balance'],
        balanceRows.map((r:any)=>[r.flockNo, r.medName, r.unit, r.allocated, r.used, r.allocated - r.used])
      )
    } else {
      if (!monthly?.length) { toast.error('No data to export'); return }
      exportFlatCSV(`medicine_monthly.csv`,
        ['flock_no','month','total_amount','remarks'],
        (monthly??[]).map((m:any)=>[m.flocks?.flock_no, m.month?.slice(0,7), m.total_amount, m.remarks])
      )
    }
  }

  const handleTemplateMed = () => {
    exportFlatCSV('medicine_usage_template.csv',
      ['flock_no','usage_date','medicine_name','quantity','unit','rate','remarks'],
      [['101','2025-06-01','Newcastle Vaccine','50','dose','12','Regular vaccination']]
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Medicine & Vaccine"
        subtitle="Record medicine usage and monthly totals"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleTemplateMed}>Template</Button>
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExportMed}>Export CSV</Button>
            {tab !== 'balance' && (
              <Button icon={<Plus size={16}/>} onClick={() => { if (tab === 'allocation') openAllocForm(); else setShowForm(true) }}>Add Entry</Button>
            )}
          </div>
        }
      />
      <div className="flex gap-3 flex-wrap items-end">
        <SearchableSelect placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={v => setFlockFilter(v)} className="w-44" />
        {(tab === 'daily' || tab === 'allocation') && (
          <Input placeholder="Search medicine…" value={medSearch} onChange={e => setMedSearch(e.target.value)} className="w-44" />
        )}
        {tab !== 'balance' && (
          <>
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              From
              <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm" />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              To
              <DateInput value={toDate} onChange={e => setToDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm" />
            </label>
          </>
        )}
        {(hasFilter || medSearch) && <Button variant="ghost" size="sm" onClick={() => { setFlockFilter(''); setFromDate(''); setToDate(''); setMedSearch('') }}>Clear</Button>}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden ml-auto">
          {(['monthly','daily','allocation','balance'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-medium capitalize transition-colors
                ${tab===t ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>



      {isLoading ? <Spinner /> : tab === 'monthly' ? (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Flock</Th><Th>Month</Th><Th right>Total Amount</Th><Th>Remarks</Th><Th></Th></tr></thead>
            <tbody>
              {monthly?.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <Td><Badge color="green">F-{m.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(m.month)}</Td>
                  <Td right className="font-semibold">{inr(m.total_amount)}</Td>
                  <Td className="text-xs text-gray-400">{m.remarks ?? ''}</Td>
                  <Td><button onClick={() => delMonthlyMut.mutate(m.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button></Td>
                </tr>
              ))}
            </tbody>
            {monthly && monthly.length > 0 && (
              <tfoot><tr className="bg-gray-50">
                <Td colSpan={2}><strong>TOTAL</strong></Td>
                <Td right><strong>{inr(monthly.reduce((s: number, m: any) => s + m.total_amount, 0))}</strong></Td>
                <Td> </Td>
              </tr></tfoot>
            )}
          </Table>
          {monthly?.length === 0 && <EmptyState icon={<Package size={32}/>} title="No medicine data" action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16}/>}>Add Monthly Total</Button>} />}
        </Card>
      ) : tab === 'daily' ? (
        <>
          <BulkBar count={sel.size} loading={bulkDelMutMed.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allUsageSel} indeterminate={someUsageSel && !allUsageSel} onChange={toggleAllUsage}/></Th>
                <Th>Flock</Th><Th>Date</Th><Th>Medicine</Th>
                <Th right>Qty</Th><Th right>Rate</Th><Th right>Amount</Th>
              </tr></thead>
              <tbody>
                {pageUsage.map((u: any) => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${sel.has(u.id) ? 'bg-red-50' : ''}`}>
                    <Td><CB checked={sel.has(u.id)} onChange={() => toggleUsage(u.id)}/></Td>
                    <Td><Badge color="green">F-{u.flocks?.flock_no}</Badge></Td>
                    <Td className="text-xs">{fmtDate(u.usage_date)}</Td>
                    <Td className="text-sm">{u.medicines_master?.name ?? '—'}</Td>
                    <Td right className="text-xs">{u.quantity ?? '—'} {u.unit}</Td>
                    <Td right className="text-xs">{effectiveRate(u) != null ? `Rs ${effectiveRate(u)}` : '—'}</Td>
                    <Td right className="font-semibold text-xs">{effectiveAmount(u) != null ? inr(effectiveAmount(u)!) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
              {filteredUsage.length > 0 && (
                <tfoot><tr className="bg-gray-50">
                  <Td colSpan={5}><strong>TOTAL</strong></Td>
                  <Td right><strong>{inr(filteredUsage.reduce((s: number, u: any) => s + (effectiveAmount(u) ?? 0), 0))}</strong></Td>
                </tr></tfoot>
              )}
            </Table>
            <PageSizeControl page={pgUsage.page} setPage={pgUsage.setPage}
              pageSize={pgUsage.pageSize} setPageSize={pgUsage.setPageSize}
              totalPages={pgUsage.totalPages} totalItems={filteredUsage.length} />
            {filteredUsage.length === 0 && <EmptyState icon={<Package size={32}/>} title={medSearch ? `No medicine matching "${medSearch}"` : 'No usage records'} />}
          </Card>
          {bulkConfirm && (
            <ConfirmBulkDelete label={`Delete ${sel.size} medicine usage records? This cannot be undone.`}
              onConfirm={() => bulkDelMutMed.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
          )}
        </>
      ) : tab === 'allocation' ? (
        <>
          <BulkBar count={selAlloc.size} loading={bulkDelMutAlloc.isPending} onClear={() => setSelAlloc(new Set())} onDelete={() => setBulkConfirmAlloc(true)} />
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allAllocSel} indeterminate={someAllocSel && !allAllocSel} onChange={toggleAllAlloc}/></Th>
                <Th>Flock</Th><Th>Date</Th><Th>Medicine</Th>
                <Th right>Qty</Th><Th>Remarks</Th><Th></Th>
              </tr></thead>
              <tbody>
                {loadingAlloc ? null : pageAllocations.map((a: any) => (
                  <tr key={a.id} className={`hover:bg-gray-50 ${selAlloc.has(a.id) ? 'bg-red-50' : ''}`}>
                    <Td><CB checked={selAlloc.has(a.id)} onChange={() => toggleAlloc(a.id)}/></Td>
                    <Td><Badge color="blue">F-{a.flocks?.flock_no}</Badge></Td>
                    <Td className="text-xs">{fmtDate(a.allocation_date)}</Td>
                    <Td className="text-sm">{a.medicines_master?.name ?? '—'}</Td>
                    <Td right className="text-xs">{a.quantity ?? '—'} {a.unit}</Td>
                    <Td className="text-xs text-gray-400">{a.remarks ?? ''}</Td>
                    <Td>
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openAllocForm(a)} className="p-1 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
                        <button onClick={() => delAllocMut.mutate(a.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <PageSizeControl page={pgAlloc.page} setPage={pgAlloc.setPage}
              pageSize={pgAlloc.pageSize} setPageSize={pgAlloc.setPageSize}
              totalPages={pgAlloc.totalPages} totalItems={filteredAllocations.length} />
            {!loadingAlloc && filteredAllocations.length === 0 && (
              <EmptyState icon={<Package size={32}/>} title={medSearch ? `No medicine matching "${medSearch}"` : 'No allocations yet'}
                action={<Button onClick={() => openAllocForm()} icon={<Plus size={16}/>}>Add Allocation</Button>} />
            )}
          </Card>
          {bulkConfirmAlloc && (
            <ConfirmBulkDelete label={`Delete ${selAlloc.size} allocation record(s)? This cannot be undone.`}
              onConfirm={() => bulkDelMutAlloc.mutate([...selAlloc])} onCancel={() => setBulkConfirmAlloc(false)} />
          )}
        </>
      ) : (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Flock</Th><Th>Medicine</Th><Th right>Allocated</Th><Th right>Used</Th><Th right>Balance</Th></tr></thead>
            <tbody>
              {balanceRows.map((r: any, i: number) => {
                const balance = r.allocated - r.used
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <Td><Badge color="blue">F-{r.flockNo}</Badge></Td>
                    <Td className="text-sm">{r.medName}</Td>
                    <Td right className="text-xs">{r.allocated.toLocaleString('en-IN')} {r.unit}</Td>
                    <Td right className="text-xs text-orange-600">{r.used.toLocaleString('en-IN')} {r.unit}</Td>
                    <Td right className="text-xs font-semibold">
                      <Badge color={balance < 0 ? 'red' : balance === 0 ? 'gray' : 'green'}>{balance.toLocaleString('en-IN')} {r.unit}</Badge>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
          {balanceRows.length === 0 && <EmptyState icon={<Package size={32}/>} title="No allocations recorded yet — add one in the Allocation tab" />}
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Medicine Entry" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button></>}>
        {/* Tab inside modal */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4">
          {(['monthly','daily'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium capitalize ${tab===t?'bg-brand-600 text-white':'text-gray-600 hover:bg-gray-50'}`}>
              {t === 'monthly' ? 'Monthly Total' : 'Daily Usage'}
            </button>
          ))}
        </div>
        {tab === 'monthly' ? (
          <div className="space-y-4">
            <FormRow>
              <SearchableSelect label="Flock" required placeholder="— Select —" options={flockOptions}
                value={monthlyForm.flock_id} onChange={v => sm('flock_id', v)} />
              <Input label="Month" required type="month" value={monthlyForm.month} onChange={e => sm('month', e.target.value)} />
            </FormRow>
            <Input label="Total Medicine Amount (Rs)" required type="number" step="0.01"
              value={monthlyForm.total_amount} onChange={e => sm('total_amount', e.target.value)} />
            <Input label="Remarks" value={monthlyForm.remarks} onChange={e => sm('remarks', e.target.value)} />
          </div>
        ) : (
          <div className="space-y-4">
            <FormRow>
              <SearchableSelect label="Flock" required placeholder="— Select —" options={flockOptions}
                value={form.flock_id} onChange={v => s('flock_id', v)} />
              <DateInput label="Date" required value={form.usage_date} onChange={e => s('usage_date', e.target.value)} />
            </FormRow>
            <SearchableSelect label="Medicine / Vaccine" placeholder="Search medicine…" options={medOptions}
              value={form.medicine_id} onChange={v => {
                s('medicine_id', v)
                const med = medicines?.find((m: any) => m.id === v)
                if (med) { s('unit', med.unit); s('rate', med.rate?.toString() ?? '') }
              }} />
            <FormRow cols={4}>
              <Input label="Qty" type="number" step="0.001" value={form.quantity} onChange={e => s('quantity', e.target.value)} />
              <Input label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)} />
              <Input label="Rate" type="number" step="0.01" value={form.rate} onChange={e => s('rate', e.target.value)} />
              <Input label="Amount" type="number" step="0.01" value={form.amount}
                onChange={e => s('amount', e.target.value)}
                hint={autoAmt > 0 ? `Auto: ${inr(autoAmt)}` : undefined} />
            </FormRow>
            <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
          </div>
        )}
      </Modal>

      <Modal open={showAllocForm} onClose={() => { setShowAllocForm(false); setEditingAlloc(null) }}
        title={editingAlloc ? 'Edit Allocation' : 'Add Allocation'} size="md"
        footer={<><Button variant="secondary" onClick={() => { setShowAllocForm(false); setEditingAlloc(null) }}>Cancel</Button>
          <Button loading={saveAllocMut.isPending} onClick={() => saveAllocMut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <SearchableSelect label="Flock" required placeholder="— Select —" options={flockOptions}
              value={allocForm.flock_id} onChange={v => setAllocForm(f => ({ ...f, flock_id: v }))} />
            <DateInput label="Date" required value={allocForm.allocation_date} onChange={e => setAllocForm(f => ({ ...f, allocation_date: e.target.value }))} />
          </FormRow>
          <SearchableSelect label="Medicine / Vaccine" placeholder="Search medicine…" options={medOptions}
            value={allocForm.medicine_id} onChange={v => {
              setAllocForm(f => ({ ...f, medicine_id: v }))
              const med = medicines?.find((m: any) => m.id === v)
              if (med) setAllocForm(f => ({ ...f, medicine_id: v, unit: med.unit ?? '' }))
            }} />
          <FormRow>
            <Input label="Quantity" required type="number" step="0.001" value={allocForm.quantity} onChange={e => setAllocForm(f => ({ ...f, quantity: e.target.value }))} />
            <Input label="Unit" value={allocForm.unit} onChange={e => setAllocForm(f => ({ ...f, unit: e.target.value }))} />
          </FormRow>
          <Input label="Remarks" value={allocForm.remarks} onChange={e => setAllocForm(f => ({ ...f, remarks: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}

// ─── Medicine Purchases (GRN / Stock tracking) ───────────────────────────────
export const MedicinePurchases: React.FC = () => {
  const qc = useQueryClient()
  const { farmId } = useFarmScope()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [filterMed, setFilterMed] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [activeTab, setActiveTab] = useState<'purchases'|'stock'>('stock')

  const emptyForm = () => ({ purchase_date: today(), medicine_id: '', farm_id: farmId ?? '', supplier_id: '',
    invoice_no: '', invoice_date: '', qty: '', unit: '', rate: '', gst_pct: '0',
    batch_no: '', expiry_date: '', remarks: '' })
  const [form, setForm] = useState(emptyForm())
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: medicines } = useQuery({
    queryKey: ['medicines_all'],
    queryFn: async () => { const{data}=await supabase.from('medicines_master').select('id,name,unit,rate,type').order('name'); return data??[] }
  })
  const { data: farms } = useQuery({
    queryKey: ['farms_all'],
    queryFn: async () => { const{data}=await supabase.from('farms').select('id,name').order('name'); return data??[] }
  })
  const { data: suppliers } = useQuery({
    queryKey: ['parties_supplier'],
    queryFn: async () => { const{data}=await supabase.from('parties').select('id,name').order('name'); return data??[] }
  })

  const { data: stock } = useQuery({
    queryKey: ['v_medicine_stock'],
    queryFn: async () => { const{data}=await supabase.from('v_medicine_stock').select('*').order('name'); return data??[] }
  })

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['med_grn_purchases', filterMed, fromDate, toDate],
    queryFn: async () => {
      let q = supabase.from('grn')
        .select('*, medicines_master(name,unit), farms(name), parties(name)')
        .in('category', ['Medicine', 'Vaccine'])
        .order('grn_date', { ascending: false })
      if (filterMed) q = q.eq('medicine_id', filterMed)
      if (fromDate) q = q.gte('grn_date', fromDate)
      if (toDate) q = q.lte('grn_date', toDate)
      const{data}=await q; return data??[]
    }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.medicine_id || !form.qty || !form.purchase_date) throw new Error('Medicine, Qty and Date required')
      const qty      = parseFloat(form.qty)
      const rate     = parseFloat(form.rate) || 0
      const gst      = parseFloat(form.gst_pct) || 0
      const basicAmt = Math.round(qty * rate * 100) / 100
      const gstAmt   = Math.round(qty * rate * gst / 100 * 100) / 100
      const totalAmt = Math.round(qty * rate * (1 + gst / 100) * 100) / 100
      const med      = (medicines ?? []).find((m: any) => m.id === form.medicine_id)
      const category = med?.type === 'vaccine' ? 'Vaccine' : 'Medicine'

      const payload: any = {
        grn_date:      form.purchase_date,
        category,
        medicine_id:   form.medicine_id,
        item_name:     med?.name ?? null,
        farm_id:       form.farm_id || null,
        party_id:      form.supplier_id || null,
        invoice_no:    form.invoice_no || null,
        invoice_date:  form.invoice_date || null,
        qty,
        unit:          form.unit || null,
        price_per_unit: rate,
        basic_amount:  basicAmt,
        gst_amount:    gstAmt,
        gst_pct:       gst,
        total_amount:  totalAmt,
        batch_no:      form.batch_no || null,
        expiry_date:   form.expiry_date || null,
        remarks:       form.remarks || null,
      }

      let grnRowId = editId
      if (editId) {
        const { error } = await supabase.from('grn').update(payload).eq('id', editId)
        if (error) throw error
      } else {
        payload.grn_no = `MED-${form.purchase_date.replace(/-/g,'')}-${Date.now()%100000}`
        const { data, error } = await supabase.from('grn').insert(payload).select('id').single()
        if (error) throw error
        grnRowId = data.id
      }

      // Sync to supplier_invoices if invoice_no provided
      if (form.invoice_no && grnRowId) {
        const { error: invErr } = await supabase.from('supplier_invoices')
          .upsert({
            invoice_no:  form.invoice_no,
            invoice_date: form.invoice_date || form.purchase_date,
            party_id:    form.supplier_id || null,
            source_type: 'medicine',
            farm_id:     form.farm_id || null,
            basic_amount: basicAmt,
            gst_pct:     gst,
            gst_amount:  gstAmt,
            total_amount: totalAmt,
            grn_id:      grnRowId,
            remarks:     form.remarks || null,
          }, { onConflict: 'grn_id', ignoreDuplicates: false })
        if (invErr) throw invErr
      }
    },
    onSuccess: () => {
      toast.success('Saved!'); setShowForm(false); setEditId(null); setForm(emptyForm())
      qc.invalidateQueries({ queryKey: ['med_grn_purchases'] })
      qc.invalidateQueries({ queryKey: ['v_medicine_stock'] })
      qc.invalidateQueries({ queryKey: ['grns'] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => { const{error}=await supabase.from('grn').delete().in('id', ids); if(error) throw error },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['med_grn_purchases'] })
      qc.invalidateQueries({ queryKey: ['v_medicine_stock'] })
      qc.invalidateQueries({ queryKey: ['grns'] })
      setSel(new Set()); setBulkConfirm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const openEdit = (p: any) => {
    setEditId(p.id); setForm({
      purchase_date: p.grn_date ?? '', medicine_id: p.medicine_id ?? '',
      farm_id: p.farm_id ?? '', supplier_id: p.party_id ?? '',
      invoice_no: p.invoice_no ?? '', invoice_date: p.invoice_date ?? '',
      qty: p.qty?.toString() ?? '', unit: p.unit ?? '',
      rate: p.price_per_unit?.toString() ?? '', gst_pct: p.gst_pct?.toString() ?? '0',
      batch_no: p.batch_no ?? '', expiry_date: p.expiry_date ?? '', remarks: p.remarks ?? ''
    }); setShowForm(true)
  }

  const { options: medOptions } = useMedicineOptionsWithAliases()
  const farmOptions = (farms??[]).map((f: any) => ({ value: f.id, label: f.name }))
  const supplierOptions = (suppliers??[]).map((p: any) => ({ value: p.id, label: p.name }))
  const ids = (purchases??[]).map((p: any) => p.id)
  const allSel = ids.length > 0 && ids.every((id: string) => sel.has(id))
  const someSel = ids.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n })
  const toggleAll = () => setSel(s => { const n=new Set(s); allSel?ids.forEach((id: string)=>n.delete(id)):ids.forEach((id: string)=>n.add(id)); return n })

  const autoBasic = (parseFloat(form.qty)||0) * (parseFloat(form.rate)||0)
  const autoGst   = autoBasic * (parseFloat(form.gst_pct)||0) / 100
  const autoTotal = autoBasic + autoGst

  const stockFiltered = (stock??[]).filter((r: any) => !filterMed || r.medicine_id === filterMed)

  return (
    <div className="space-y-5">
      <SectionHeader title="Medicine Purchases"
        subtitle="Track medicine & vaccine purchases, GRN and stock balance"
        action={
          <Button icon={<Plus size={16}/>} onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }}>Add Purchase</Button>
        }
      />

      <div className="flex gap-3 flex-wrap items-end">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['stock','purchases'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 text-sm font-medium capitalize transition-colors ${activeTab===t?'bg-brand-600 text-white':'text-gray-600 hover:bg-gray-50'}`}>
              {t === 'stock' ? 'Stock Balance' : 'Purchase History'}
            </button>
          ))}
        </div>
        <SearchableSelect placeholder="All Medicines" options={medOptions}
          value={filterMed} onChange={v => setFilterMed(v)} className="w-52" />
        {activeTab === 'purchases' && <>
          <label className="flex items-center gap-1.5 text-sm text-gray-600">From
            <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm" />
          </label>
          <label className="flex items-center gap-1.5 text-sm text-gray-600">To
            <DateInput value={toDate} onChange={e => setToDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm" />
          </label>
        </>}
        {(filterMed||fromDate||toDate) && <button onClick={() => { setFilterMed(''); setFromDate(''); setToDate('') }} className="text-xs text-brand-600 hover:underline">Clear</button>}
      </div>

      {activeTab === 'stock' ? (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Medicine / Vaccine</Th><Th>Type</Th><Th right>Purchased</Th>
              <Th right>Used</Th><Th right>Balance</Th><Th>Last Purchase</Th><Th>Batch / Expiry</Th>
            </tr></thead>
            <tbody>
              {stockFiltered.map((r: any) => {
                const low = r.balance_qty < 0
                const warn = r.balance_qty >= 0 && r.purchased_qty > 0 && r.balance_qty < (r.purchased_qty * 0.1)
                return (
                  <tr key={r.medicine_id} className="hover:bg-gray-50">
                    <Td className="font-medium">{r.name}</Td>
                    <Td><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r.type}</span></Td>
                    <Td right className="text-xs">{r.purchased_qty} {r.unit}</Td>
                    <Td right className="text-xs">{r.used_qty} {r.unit}</Td>
                    <Td right className={`font-semibold text-sm ${low ? 'text-red-600' : warn ? 'text-amber-600' : 'text-green-700'}`}>
                      {r.balance_qty} {r.unit}
                      {low && ' ⚠'}
                    </Td>
                    <Td className="text-xs text-gray-500">{r.last_purchase_date ? fmtDate(r.last_purchase_date) : '—'}</Td>
                    <Td className="text-xs text-gray-500">
                      {r.last_batch_no ?? '—'}
                      {r.last_expiry_date && <span className="ml-1 text-amber-600">exp {r.last_expiry_date}</span>}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
          {stockFiltered.length === 0 && <EmptyState icon={<Package size={32}/>} title="No medicines found" action={<Button onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }} icon={<Plus size={16}/>}>Add Purchase</Button>} />}
        </Card>
      ) : (
        <>
          <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />
          {isLoading ? <Spinner /> : (
            <Card padding={false}>
              <Table>
                <thead><tr>
                  <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
                  <Th>Date</Th><Th>Medicine</Th><Th>Supplier</Th><Th>Invoice</Th>
                  <Th right>Qty</Th><Th right>Rate</Th><Th right>GST%</Th><Th right>Total</Th>
                  <Th>Batch</Th><Th>Expiry</Th><Th></Th>
                </tr></thead>
                <tbody>
                  {(purchases??[]).map((p: any) => (
                    <tr key={p.id} className={`hover:bg-gray-50 ${sel.has(p.id)?'bg-red-50':''}`}>
                      <Td><CB checked={sel.has(p.id)} onChange={() => toggle(p.id)}/></Td>
                      <Td className="text-xs font-medium">{fmtDate(p.grn_date)}</Td>
                      <Td className="text-sm">{p.medicines_master?.name ?? p.item_name ?? '—'}</Td>
                      <Td className="text-xs text-gray-500">{p.parties?.name ?? '—'}</Td>
                      <Td className="text-xs text-gray-500">{p.invoice_no ?? '—'}</Td>
                      <Td right className="text-xs">{p.qty} {p.medicines_master?.unit ?? p.unit}</Td>
                      <Td right className="text-xs">{p.price_per_unit ? `₹${p.price_per_unit}` : '—'}</Td>
                      <Td right className="text-xs">{p.gst_pct ?? 0}%</Td>
                      <Td right className="font-semibold text-sm">{inr(p.total_amount)}</Td>
                      <Td className="text-xs text-gray-500">{p.batch_no ?? '—'}</Td>
                      <Td className="text-xs text-gray-500">{p.expiry_date ?? '—'}</Td>
                      <Td>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(p)} className="p-1 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
                          <button onClick={() => { setSel(new Set([p.id])); setBulkConfirm(true) }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
                {(purchases??[]).length > 0 && (
                  <tfoot><tr className="bg-gray-50">
                    <td colSpan={8} className="px-3 py-2 text-xs font-semibold text-gray-600">TOTAL</td>
                    <Td right><strong>{inr((purchases??[]).reduce((s: number, p: any) => s + (p.total_amount ?? 0), 0))}</strong></Td>
                    <td colSpan={3}/>
                  </tr></tfoot>
                )}
              </Table>
              {(purchases??[]).length === 0 && <EmptyState icon={<Package size={32}/>} title="No purchases found" />}
            </Card>
          )}
          {bulkConfirm && (
            <ConfirmBulkDelete label={`Delete ${sel.size} purchase record(s)? This cannot be undone.`}
              onConfirm={() => bulkDelMut.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
          )}
        </>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditId(null) }}
        title={editId ? 'Edit Purchase' : 'Add Medicine Purchase'} size="lg"
        footer={<><Button variant="secondary" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</Button>
          <Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <DateInput label="Purchase Date" required value={form.purchase_date} onChange={e => s('purchase_date', e.target.value)} />
            <SearchableSelect label="Medicine / Vaccine" required placeholder="Search medicine…" options={medOptions}
              value={form.medicine_id} onChange={v => {
                const med = (medicines??[]).find((m: any) => m.id === v)
                setForm(f => ({ ...f, medicine_id: v, unit: med?.unit ?? f.unit, rate: med?.rate?.toString() ?? f.rate }))
              }} />
          </FormRow>
          <FormRow>
            <SearchableSelect label="Farm / Site" placeholder="— Select —" options={farmOptions} value={form.farm_id} onChange={v => s('farm_id', v)} />
            <div className="relative">
              <div className="flex items-end gap-1">
                <div className="flex-1">
                  <SearchableSelect label="Supplier" placeholder="— Select —" options={supplierOptions} value={form.supplier_id} onChange={v => s('supplier_id', v)} />
                </div>
                <QuickAddParty defaultType="supplier" onCreated={p => s('supplier_id', p.id)} />
              </div>
            </div>
          </FormRow>
          <FormRow>
            <Input label="Invoice No" value={form.invoice_no} onChange={e => s('invoice_no', e.target.value)} />
            <DateInput label="Invoice Date" value={form.invoice_date} onChange={e => s('invoice_date', e.target.value)} />
          </FormRow>
          <FormRow cols={4}>
            <Input label="Qty" required type="number" step="0.001" value={form.qty} onChange={e => s('qty', e.target.value)} />
            <Input label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)} />
            <Input label="Rate (₹)" type="number" step="0.01" value={form.rate} onChange={e => s('rate', e.target.value)} />
            <Input label="GST %" type="number" step="0.01" value={form.gst_pct} onChange={e => s('gst_pct', e.target.value)} />
          </FormRow>
          {(autoBasic > 0) && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2 flex gap-6">
              <span>Basic: <strong>{inr(autoBasic)}</strong></span>
              <span>GST: <strong>{inr(autoGst)}</strong></span>
              <span className="text-gray-800 font-semibold">Total: <strong>{inr(autoTotal)}</strong></span>
            </div>
          )}
          <FormRow>
            <Input label="Batch No" value={form.batch_no} onChange={e => s('batch_no', e.target.value)} />
            <DateInput label="Expiry Date" value={form.expiry_date} onChange={e => s('expiry_date', e.target.value)} />
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
