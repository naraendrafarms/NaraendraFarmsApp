import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { useFarmScope } from '@/lib/useFarmScope'
import {
  Card, CardHeader, Button, Input, Select, FormRow, Modal, Divider,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState, StatCard
, DateInput, SearchableSelect } from '@/components/ui'
import { Plus, Package, Edit2, Egg, Trash2, Upload, Download, AlertCircle, Printer } from 'lucide-react'
import { QuickAddParty } from '@/components/ui/QuickAdd'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { parseFile } from '@/lib/parseFile'
import { supplyType, splitTax, GST_RATE_OPTIONS } from '@/lib/gst'
import { printHEDispatch, printNHESale } from '@/lib/invoicePrint'

// ── Receive Payment Modal ─────────────────────────────────────────
const ReceivePaymentModal: React.FC<{
  open: boolean; sale: any; bankAccounts: any[]; farms: any[]; table: string;
  onClose: () => void; onSaved: () => void
}> = ({ open, sale, bankAccounts, farms, table, onClose, onSaved }) => {
  const [mode, setMode] = useState('Cash')
  const [bankId, setBankId] = useState('')
  const [cashFarmId, setCashFarmId] = useState('ho') // 'ho' = Head Office, or a farm UUID
  const [date, setDate] = useState(today())
  const [amtReceived, setAmtReceived] = useState('')
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
      setDate(sale.received_date ?? today())
      setAmtReceived(sale.amount_received?.toString() ?? sale.amount?.toString() ?? '')
      setUtr(sale.utr_ref ?? '')
      setStatus(sale.payment_status === 'Pending' || !sale.payment_status ? 'Received' : sale.payment_status)
      setSelectedAdvanceId('')
    }
  }, [sale])

  const handleSave = async () => {
    if (!sale) return
    setSaving(true)
    try {
      const amt = parseFloat(amtReceived) || 0
      const isAdvance = mode === 'Advance'

      if (isAdvance) {
        if (!selectedAdvanceId) throw new Error('Select which advance to use')
        const adv = (partyAdvances as any[]).find(a => a.id === selectedAdvanceId)
        if (!adv) throw new Error('Advance not found')
        const available = adv.amount - adv.amount_used
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
          .update({ amount_used: adv.amount_used + amt })
          .eq('id', selectedAdvanceId)
        if (aErr) throw aErr
        toast.success('Advance adjusted successfully')
        onSaved()
        setSaving(false)
        return
      }

      const update: any = {
        payment_status: status,
        payment_mode: mode,
        received_date: date || null,
        amount_received: amt || null,
        bank_account_id: (mode !== 'Cash' && bankId) ? bankId : null,
        utr_ref: utr || null,
      }
      const { error } = await supabase.from(table).update(update).eq('id', sale.id)
      if (error) throw error

      const saleType = sale.sale_type ?? (table === 'he_dispatch' ? 'he_sale' : 'je')
      const { category: cbCategory, label: typeLabel } = nheCashCategory(saleType)
      const flockLabel = sale.flocks?.flock_no ? `F-${sale.flocks.flock_no}` : ''
      const description = [typeLabel, flockLabel, sale.dc_no ?? sale.invoice_no ?? ''].filter(Boolean).join(' — ')

      if (mode === 'Cash' && amt > 0 && status !== 'Pending') {
        // Delete any existing cash_book entry for this sale first (prevents duplicate on re-save)
        if (table === 'he_dispatch') {
          await supabase.from('cash_book').delete().eq('he_dispatch_id', sale.id)
        } else {
          await supabase.from('cash_book').delete().eq('nhe_sale_id', sale.id)
        }
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
      } else if (mode !== 'Cash' && bankId && amt > 0) {
        // Create bank_transactions credit entry
        await supabase.from('bank_transactions').insert({
          bank_account_id: bankId,
          txn_date: date,
          txn_type: 'Credit',
          category: 'Sale Receipt',
          reference_no: utr || sale.dc_no || sale.invoice_no || null,
          description,
          amount: amt,
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
            <Input label="Amount (₹)" type="number" step="0.01" value={amtReceived} onChange={e => setAmtReceived(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Payment Mode" value={mode} onChange={e => { setMode(e.target.value); setSelectedAdvanceId('') }}
              options={paymentModeOptions} />
            <DateInput label="Date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
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
          {mode === 'Cash' && (
            <Select label="Cash Location" value={cashFarmId} onChange={e => setCashFarmId(e.target.value)}
              options={cashLocationOptions} />
          )}
          {mode !== 'Cash' && mode !== 'Advance' && (
            <Select label="Bank Account" placeholder="— Select bank —" value={bankId} onChange={e => setBankId(e.target.value)}
              options={bankOptions} />
          )}
          {(mode === 'Bank Transfer' || mode === 'UPI' || mode === 'Cheque') && (
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

const BulkBar: React.FC<{ count: number; onDelete: () => void; onClear: () => void; loading?: boolean }> = ({ count, onDelete, onClear, loading }) => count === 0 ? null : (
  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
    <span className="text-sm font-medium text-red-700">{count} selected</span>
    <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
    <div className="ml-auto">
      <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} loading={loading} onClick={onDelete}>Delete {count} rows</Button>
    </div>
  </div>
)

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
  const [importing, setImporting] = useState(false)
  const [noInvoiceOnly, setNoInvoiceOnly] = useState(false)
  const [hePartyFilter, setHePartyFilter] = useState('')
  const [tab, setTab] = useState<'dispatch'|'stock'>('dispatch')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [receiptSale, setReceiptSale] = useState<any>(null)
  const [expandedDispatch, setExpandedDispatch] = useState<string|null>(null)
  const [expandedLines, setExpandedLines] = useState<any[]>([])
  const [printTarget, setPrintTarget] = useState<any>(null)
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
      let q = supabase.from('flocks').select('id,flock_no,status,laying_farm_id,rearing_farm_id').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q
      return data ?? []
    }
  })

  const { data: parties } = useQuery({
    queryKey: ['parties_buyers'],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id,name,state_code,gstin').order('name')
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
      let q = supabase.from('he_dispatch')
        .select('*, flocks(flock_no,placement_date), parties(name,address,contact), hatcheries(name)')
        .order('dispatch_date', { ascending: false })
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      if (fromDate) q = q.gte('dispatch_date', fromDate)
      if (toDate) q = q.lte('dispatch_date', toDate)
      if (!hasFilter) q = q.limit(200)
      const { data } = await q; return data ?? []
    }
  })

  // Dispatch lines: one row per production date with grade split
  type DispLine = { prod_date: string; grade_a: string; grade_b: string; grade_c: string; rate: string }
  const emptyLine = (): DispLine => ({ prod_date: today(), grade_a: '', grade_b: '', grade_c: '', rate: '' })
  const [lines, setLines] = useState<DispLine[]>([emptyLine()])
  const setLine = (i: number, k: keyof DispLine, v: string) =>
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l))
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
  const HE_DRAFT_KEY = 'he_dispatch_draft'
  // Auto-save a draft of NEW (unsaved) dispatches so nothing is lost if the form is closed
  useEffect(() => {
    if (!showForm || editing) return
    const t = setTimeout(() => {
      try { localStorage.setItem(HE_DRAFT_KEY, JSON.stringify({ form, lines })) } catch {}
    }, 400)
    return () => clearTimeout(t)
  }, [form, lines, showForm, editing])
  const clearDraft = () => { try { localStorage.removeItem(HE_DRAFT_KEY) } catch {} }
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
            setLines([{ prod_date: row.prod_date ?? today(), grade_a: row.grade_a?.toString() ?? '', grade_b: row.grade_b?.toString() ?? '', grade_c: '0', rate: row.rate?.toString() ?? '' }])
        })
    } else {
      setEditing(null)
      setPeekInv(null)
      // Restore an unsaved draft if one exists
      let draft: any = null
      try { const raw = localStorage.getItem(HE_DRAFT_KEY); if (raw) draft = JSON.parse(raw) } catch {}
      const hasDraft = draft?.form && (
        draft.form.party_id || draft.form.dc_no || draft.form.invoice_no ||
        (draft.lines ?? []).some((l: any) => l && (l.grade_a || l.grade_b || l.grade_c))
      )
      if (hasDraft) {
        setForm(draft.form)
        setLines(draft.lines?.length ? draft.lines : [emptyLine()])
        toast('Restored your unsaved draft', { icon: '📝' })
      } else {
        setForm({ flock_id: flockFilter, dispatch_date: today(), dc_no: '', invoice_no: '',
          party_id: '', free_eggs: '0', rate: '', amount: '', tds_pct: '0', tds_amount: '0',
          boxes_20lb: '', boxes_23lb: '', extra_trays_20lb: '', extra_trays_23lb: '', vehicle_type: '', lorry_no: '', driver_phone: '', out_time: '', remarks: '' })
        setLines([emptyLine()])
      }
    }
    setShowForm(true)
  }

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: dispatches } = await supabase
        .from('he_dispatch')
        .select('id, flock_id, dispatch_date, invoice_no, amount')
        .in('id', ids)
      // By FK CASCADE; also explicit for safety
      await supabase.from('cash_book').delete().in('he_dispatch_id', ids)
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
    onSuccess: () => { toast.success('Saved!'); clearDraft(); qc.invalidateQueries({ queryKey: ['he_dispatch'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.message)
  })

  const filtered = (dispatches ?? []).filter((d: any) => {
    if (noInvoiceOnly && d.invoice_no) return false
    if (hePartyFilter.trim()) {
      const q = hePartyFilter.trim().toLowerCase()
      if (!(d.parties?.name ?? '').toLowerCase().includes(q) &&
          !(d.dc_no ?? '').toLowerCase().includes(q) &&
          !(d.invoice_no ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })
  const totalDisp = filtered.reduce((s: number, d: any) => s + d.total_dispatched, 0)
  const totalAmt  = filtered.reduce((s: number, d: any) => s + (d.amount ?? 0), 0)
  const totalFree = filtered.reduce((s: number, d: any) => s + (d.free_eggs ?? 0), 0)
  const noInvoiceCount = (dispatches ?? []).filter((d: any) => !d.invoice_no).length

  // Stock register — same logic as Reports → Egg Stock Balance day-wise view
  const { data: stockData } = useQuery({
    queryKey: ['he_stock_register', flockFilter],
    queryFn: async () => {
      let dq = supabase.from('daily_records')
        .select('record_date,flock_id,he_grade_a,he_grade_b,he_grade_c,wastage_he,flocks(flock_no)')
        .order('record_date', { ascending: true })
      // Use inner join so only lines with a valid dispatch are included (matches EggStock logic)
      let lq = supabase.from('he_dispatch_lines')
        .select('flock_id,grade_a,grade_b,grade_c,he_dispatch!inner(dispatch_date,flock_id)')
        .order('he_dispatch(dispatch_date)', { ascending: true })
      let oq = supabase.from('egg_opening_stock')
        .select('flock_id,he_grade_a,he_grade_b,he_grade_c,flocks(flock_no)')
      if (flockFilter) {
        dq = dq.eq('flock_id', flockFilter)
        lq = lq.eq('flock_id', flockFilter)
        oq = oq.eq('flock_id', flockFilter)
      }
      const [{ data: prod }, { data: rawLines }, { data: opening }] = await Promise.all([dq, lq, oq])

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
      ])]

      // Per-flock running balance — same formula as EggStock day-wise
      const allRows: any[] = []
      for (const fid of flockIds) {
        const flockLabel = ((prod ?? []).find((r: any) => r.flock_id === fid) as any)?.flocks?.flock_no
        const op = openMap[fid] ?? { a: 0, b: 0, c: 0 }
        let balA = op.a, balB = op.b, balC = op.c

        const dateSet = new Set<string>()
        ;(prod ?? []).filter((r: any) => r.flock_id === fid).forEach((r: any) => dateSet.add(r.record_date))
        dispLines.filter((l: any) => l.flock_id === fid).forEach((l: any) => dateSet.add(l.dispatch_date))
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

          const open_a = balA, open_b = balB, open_c = balC
          // Exactly matches EggStock: balA += pA - sA - wHE
          balA += pA - dA - wHE
          balB += pB - dB
          balC += pC - dC

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

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const partyOptions = parties?.map((p: any) => ({ value: p.id, label: p.name })) ?? []

  const dispIds = (dispatches ?? []).map((d: any) => d.id)
  const allSel = dispIds.length > 0 && dispIds.every((id: string) => sel.has(id))
  const someSel = dispIds.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? dispIds.forEach((id: string) => n.delete(id)) : dispIds.forEach((id: string) => n.add(id)); return n })

  // CSV template download
  const handleDownloadTemplate = () => {
    const headers = 'flock_no,dispatch_date,prod_date,dc_no,grade_a,grade_b,free_eggs,rate,party_name,remarks'
    const blob = new Blob([headers + '\n'], { type: 'text/csv' })
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

      const rows = records.map((r: any) => {
        const flockMatch = flocks?.find((f: any) => String(f.flock_no) === String(r.flock_no))
        const partyMatch = parties?.find((p: any) => p.name === r.party_name)
        const gradeA = parseInt(r.grade_a) || 0
        const gradeB = parseInt(r.grade_b) || 0
        const totalDispatched = gradeA + gradeB
        const freeEggs = parseInt(r.free_eggs) || 0
        const rate = parseFloat(r.rate) || null
        return {
          flock_id: flockMatch?.id ?? null,
          dispatch_date: r.dispatch_date || null,
          prod_date: r.prod_date || null,
          dc_no: parseInt(r.dc_no) || null,
          grade_a: gradeA,
          grade_b: gradeB,
          total_dispatched: totalDispatched,
          free_eggs: freeEggs,
          invoice_eggs: totalDispatched - freeEggs,
          rate: rate,
          amount: rate != null ? totalDispatched * rate : null,
          party_id: partyMatch?.id ?? null,
          remarks: r.remarks || null,
        }
      }).filter((r: any) => r.flock_id && r.dispatch_date)

      if (rows.length === 0) {
        toast.error('No valid rows found. Check flock_no values match existing flocks.')
        return
      }

      const { error } = await supabase.from('he_dispatch').insert(rows)
      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          toast.error('Some records already exist (duplicate dispatch dates). Please check your data.')
        } else {
          throw error
        }
        return
      }
      toast.success(`Imported ${rows.length} dispatch records!`)
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
    const headers = 'Flock,Dispatch Date,Prod Date,DC No,Invoice No,Gr A,Gr B,Gr C,Total,Free,Invoice Eggs,Rate,Amount,Party,Remarks'
    const lines = rows.map((r: any) => [
      r.flocks?.flock_no ?? '', r.dispatch_date, prodDateLabel(r),
      r.dc_no ?? '', r.invoice_no ?? '',
      r.grade_a ?? 0, r.grade_b ?? 0, r.grade_c ?? 0,
      r.total_dispatched ?? 0, r.free_eggs ?? 0, r.invoice_eggs ?? 0,
      r.rate ?? '', r.amount ?? '', r.parties?.name ?? '', r.remarks ?? ''
    ].join(','))
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
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
        {tab === 'dispatch' && <>
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
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={noInvoiceOnly} onChange={e => setNoInvoiceOnly(e.target.checked)}
            className="rounded border-gray-300 text-orange-500"/>
          <span className="text-orange-600 font-medium">
            No Invoice only {noInvoiceCount > 0 && <span className="bg-orange-100 text-orange-700 text-xs px-1.5 rounded-full">{noInvoiceCount}</span>}
          </span>
        </label>
        </>}
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
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Dispatched" value={totalDisp.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-brand-600" />
          <StatCard title="Free Eggs" value={totalFree.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-yellow-600" />
          <StatCard title="Total Revenue" value={inr(totalAmt)} icon={<Package size={18}/>} color="text-green-600" />
        </div>
      )}

      <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />

      {tab === 'dispatch' && (isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
              <Th>Flock</Th><Th>Dispatch Date</Th><Th>Prod Date</Th>
              <Th right>DC No</Th><Th>Invoice No</Th><Th>Party</Th>
              <Th right>Dispatched</Th><Th right>Free</Th><Th right>Invoice Qty</Th>
              <Th right>Rate</Th><Th right>Amount</Th><Th right>TDS</Th><Th>Vehicle</Th><Th>Lorry</Th><Th>Out Time</Th><Th>Payment</Th><Th></Th>
            </tr></thead>
            <tbody>
              {filtered.map((d: any) => (<>
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
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openForm(d)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600" title="Edit dispatch"><Edit2 size={13}/></button>
                      <button onClick={() => setPrintTarget(d)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Print invoice"><Printer size={13}/></button>
                    </div>
                  </Td>
                </tr>
                {expandedDispatch === d.id && (
                  <tr key={`lines-${d.id}`} className="bg-blue-50">
                    <Td colSpan={16}>
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
                <Td colSpan={11}><strong>TOTAL ({filtered.length} records)</strong></Td>
                <Td right><strong>{totalDisp.toLocaleString('en-IN')}</strong></Td>
                <Td right><strong>{totalFree.toLocaleString('en-IN')}</strong></Td>
                <Td right><strong>{(totalDisp - totalFree).toLocaleString('en-IN')}</strong></Td>
                <Td right>—</Td>
                <Td right><strong className="text-green-700">{inr(totalAmt)}</strong></Td>
                <Td> </Td><Td> </Td><Td> </Td>
              </tr></tfoot>
            )}
          </Table>
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
              {(stockData ?? []).map((r: any, i: number) => (
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
              {(stockData ?? []).length === 0 && (
                <tr><Td colSpan={15} className="text-center text-gray-400 py-8">No data — add daily records with grade breakdown and dispatches first</Td></tr>
              )}
            </tbody>
          </Table>
        </Card>
      )}

      {bulkConfirm && (
        <ConfirmBulkDelete label={`Delete ${sel.size} HE dispatch records? This cannot be undone.`}
          onConfirm={() => bulkDelMut.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}

      <ReceivePaymentModal
        open={!!receiptSale}
        sale={receiptSale}
        bankAccounts={bankAccounts ?? []}
        farms={farms ?? []}
        table={receiptSale?._table ?? 'he_dispatch'}
        onClose={() => setReceiptSale(null)}
        onSaved={() => { setReceiptSale(null); qc.invalidateQueries({ queryKey: ['he_dispatch'] }) }}
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
              dc_no: d.dc_no, flock_no: d.flocks?.flock_no, total_dispatched: d.total_dispatched,
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

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editing ? 'Edit HE Dispatch' : 'New HE Dispatch'} size="xl"
        footer={
          <>
          {!editing && <Button variant="secondary" onClick={() => {
            clearDraft()
            setForm({ flock_id: flockFilter, dispatch_date: today(), dc_no: '', invoice_no: '',
              party_id: '', free_eggs: '0', rate: '', amount: '', tds_pct: '0', tds_amount: '0',
              boxes_20lb: '', boxes_23lb: '', extra_trays_20lb: '', extra_trays_23lb: '', vehicle_type: '', lorry_no: '', driver_phone: '', out_time: '', remarks: '' })
            setLines([emptyLine()]); setPeekInv(null)
            toast('Started fresh — draft cleared')
          }}>Start Fresh</Button>}
          <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>{editing ? 'Update' : 'Save'}</Button></>
        }>
        <div className="space-y-4">
          {/* Header */}
          <FormRow>
            <Select label="Flock *" required placeholder="— Select —" options={flockOptions}
              value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
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
              onChange={e => s('amount', e.target.value)}
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
const NHE_TYPES = [
  { value: 'je',         label: 'Jumbo Eggs (JE)' },
  { value: 'te',         label: 'Table Eggs (TE)' },
  { value: 'be',         label: 'Broken/Crack Eggs (BE)' },
  { value: 'bird_sale',  label: 'Bird Sales' },
  { value: 'gas',        label: 'Gas Cylinders' },
  { value: 'manure',     label: 'Manure / Litter' },
  { value: 'gunny_bags', label: 'Gunny Bags' },
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
  flock_id: '', sale_date: today(), sale_type: 'je',
  party_id: '', dc_no: '', vehicle_no: '', invoice_no: '', gst_pct: '0',
  quantity: '', unit: 'nos', rate: '', amount: '',
  bird_sex: 'female', bird_category: 'cull',
  avg_weight_kg: '', total_weight_kg: '', rate_per_kg: '',
  payment_cash: '', payment_online: '', cash_farm_id: 'ho', bank_account_id: '',
  remarks: '',
  is_employee_sale: false, employee_id: '', deduct_salary: false,
}

type NheLine = { sale_type: string; quantity: string; unit: string; rate: string; amount: string }
const emptyNheLine = (): NheLine => ({ sale_type: 'je', quantity: '', unit: 'nos', rate: '', amount: '' })

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
  const [fromDate, setFromDate]   = useState('')
  const [toDate, setToDate]       = useState('')
  const [sel, setSel]             = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [receiptSale, setReceiptSale] = useState<any>(null)
  const [nheLines, setNheLines] = useState<NheLine[]>([emptyNheLine()])

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
    queryFn: async () => { const { data } = await supabase.from('parties').select('id,name,state_code,gstin').order('name'); return data ?? [] }
  })

  const { data: employees } = useQuery({
    queryKey: ['employees_active'],
    queryFn: async () => { const { data } = await supabase.from('employees').select('id,name,emp_id').eq('is_active', true).order('name'); return data ?? [] }
  })

  const [invSeries, setInvSeries] = useState('NHE')
  const [genningInv, setGenningInv] = useState(false)
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

  const hasFilter = !!(flockFilter || empFilter || fromDate || toDate)

  const { data: sales, isLoading } = useQuery({
    queryKey: ['nhe_sales', flockFilter, empFilter, fromDate, toDate],
    queryFn: async () => {
      let q = supabase.from('nhe_sales').select('*, flocks(flock_no), parties(name,address,contact), employees(name,emp_id), bank_accounts(bank_name,account_name), nhe_sale_lines(sale_type,quantity,rate,amount)')
        .order('sale_date', { ascending: false })
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      if (empFilter) q = q.eq('employee_id', empFilter)
      if (fromDate) q = q.gte('sale_date', fromDate)
      if (toDate) q = q.lte('sale_date', toDate)
      if (!hasFilter) q = q.limit(200)
      const { data } = await q; return data ?? []
    }
  })

  const [form, setForm] = useState<any>(EMPTY_NHE_FORM)
  const sv = (k: string, v: string) => setForm((f: any) => {
    const nf = { ...f, [k]: v }
    // Bird sale auto-calcs
    if (['quantity','avg_weight_kg'].includes(k)) {
      const q = parseFloat(k==='quantity' ? v : nf.quantity) || 0
      const w = parseFloat(k==='avg_weight_kg' ? v : nf.avg_weight_kg) || 0
      nf.total_weight_kg = q && w ? (q*w).toFixed(3) : ''
    }
    if (['total_weight_kg','rate_per_kg','avg_weight_kg','quantity'].includes(k)) {
      const tw = parseFloat(nf.total_weight_kg) || 0
      const rk = parseFloat(nf.rate_per_kg) || 0
      if (tw && rk) nf.amount = (tw * rk).toFixed(2)
    }
    // Payment split auto-total
    if (['payment_cash','payment_online'].includes(k)) {
      const cash = parseFloat(k==='payment_cash' ? v : nf.payment_cash) || 0
      const onl  = parseFloat(k==='payment_online' ? v : nf.payment_online) || 0
      if (cash || onl) nf.amount = (cash + onl).toFixed(2)
    }
    return nf
  })
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
        .select('id, flock_id, sale_date, dc_no, amount, payment_cash, sale_type, quantity, bird_sex')
        .in('id', ids)

      // 1. Delete cash_book rows linked by nhe_sale_id (FK CASCADE handles this automatically,
      //    but also do it explicitly to cover rows where nhe_sale_id may be NULL from old data)
      await supabase.from('cash_book').delete().in('nhe_sale_id', ids)

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
          .select('quantity,bird_sex')
          .eq('flock_id', flock_id).eq('sale_date', sale_date)
          .in('sale_type', ['bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error'])
          .gt('quantity', 0)
        const totalF = (remaining ?? []).reduce((s, x) =>
          s + ((x.bird_sex === 'female' || x.bird_sex === 'sex_error' || !x.bird_sex) ? (parseFloat(x.quantity) || 0) : 0), 0)
        const totalM = (remaining ?? []).reduce((s, x) =>
          s + (x.bird_sex === 'male' ? (parseFloat(x.quantity) || 0) : 0), 0)
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

  const saveMut = useMutation({
    mutationFn: async () => {
      const egg = isEggSale(form.sale_type)
      // Compute linesTotal fresh inside mutationFn to avoid stale closure issues
      const freshLinesTotal = nheLines.reduce((sum, l) => {
        const amt = parseFloat(l.amount) || ((parseFloat(l.quantity)||0) * (parseFloat(l.rate)||0))
        return sum + amt
      }, 0)
      const finalAmt = egg ? freshLinesTotal : (parseFloat(form.amount) || autoAmt)
      if (!form.flock_id || !form.sale_date || !finalAmt) throw new Error('Flock, date and amount required')
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
      // For egg sales: aggregate qty from lines, rate stored per-line
      const eggTotalQty = egg ? nheLines.reduce((s, l) => s + (parseFloat(l.quantity)||0), 0) : null
      const payload: any = {
        flock_id: form.flock_id, sale_date: form.sale_date,
        sale_type: bird ? 'bird_sale' : (egg ? (nheLines.length > 1 ? 'je' : (nheLines[0]?.sale_type ?? 'je')) : form.sale_type),
        party_id: form.party_id || null, dc_no: form.dc_no || null,
        invoice_no: finalInvoiceNo,
        quantity: egg ? (eggTotalQty || null) : (parseFloat(form.quantity) || null),
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
      if (bird) {
        payload.bird_sex       = form.bird_sex || null
        payload.bird_category  = form.bird_category || null
        payload.avg_weight_kg  = parseFloat(form.avg_weight_kg)  || null
        payload.total_weight_kg= parseFloat(form.total_weight_kg)|| null
        payload.rate_per_kg    = parseFloat(form.rate_per_kg)    || null
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
          .filter(l => (parseFloat(l.quantity)||0) > 0 || (parseFloat(l.amount)||0) > 0)
          .map(l => ({
            sale_id: savedId,
            sale_type: l.sale_type,
            quantity: parseFloat(l.quantity) || null,
            unit: l.unit || 'nos',
            rate: parseFloat(l.rate) || null,
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

      // Sync daily_records cull counts from total of ALL nhe_sales for this flock+date
      if (bird) {
        const saleDate = form.sale_date
        const flockId = form.flock_id

        // Fetch all bird sales for this flock+date AFTER the current save
        // (the current sale is already saved at this point in the mutation flow)
        const { data: allSales } = await supabase.from('nhe_sales')
          .select('quantity,bird_sex')
          .eq('flock_id', flockId).eq('sale_date', saleDate)
          .in('sale_type', ['bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error'])
          .gt('quantity', 0)

        const totalF = (allSales ?? []).reduce((s, x) =>
          s + ((x.bird_sex === 'female' || x.bird_sex === 'sex_error' || !x.bird_sex) ? (parseFloat(x.quantity) || 0) : 0), 0)
        const totalM = (allSales ?? []).reduce((s, x) =>
          s + (x.bird_sex === 'male' ? (parseFloat(x.quantity) || 0) : 0), 0)

        const { data: drRows } = await supabase.from('daily_records')
          .select('id,cull_female,cull_male,transfer_female,transfer_male,opening_female,opening_male,mortality_female,mortality_male')
          .eq('flock_id', flockId).eq('record_date', saleDate).order('id')

        if (drRows && drRows.length > 0) {
          // Write cull to first shed record, zero cull on all others (avoid double-counting)
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
        } else {
          await supabase.from('daily_records').insert({
            flock_id: flockId, record_date: saleDate,
            cull_female: totalF, cull_male: totalM,
            trcull_female: totalF, trcull_male: totalM,
            transfer_female: 0, transfer_male: 0,
            mortality_female: 0, mortality_male: 0,
          })
        }
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated!' : 'Sale recorded!')
      qc.invalidateQueries({ queryKey: ['nhe_sales'] })
      qc.invalidateQueries({ queryKey: ['daily_record'] })
      qc.invalidateQueries({ queryKey: ['flock_daily'] })
      setPeekInv(null); setShowForm(false); setEditing(null); setNheLines([emptyNheLine()])
    },
    onError: (e: any) => toast.error(e.message)
  })

  const openNew = () => {
    setEditing(null)
    setPeekInv(null)
    setForm({ ...EMPTY_NHE_FORM, flock_id: flockFilter })
    setNheLines([emptyNheLine()])
    setShowForm(true)
  }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({
      flock_id: row.flock_id, sale_date: row.sale_date,
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
    const headers = 'flock_no,sale_date,sale_type,party_name,dc_no,quantity,unit,rate,remarks'
    const example = [
      '19,2025-06-01,bird_cull,Party Name,DC001,100,nos,150,Cull birds sale',
      '19,2025-06-01,je,Party Name,DC002,500,nos,8.5,Jumbo eggs',
    ].join('\n')
    const notes = [
      '# sale_type values: je | te | be | bird_cull | bird_lame | bird_weak | bird_sex_error | gas | manure | other',
      '# unit: nos (birds/eggs) | kg | ltrs | bags',
      '# amount = quantity × rate (auto-calculated on import)',
    ].join('\n')
    const blob = new Blob([notes + '\n' + headers + '\n' + example], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'nhe_bird_sales_template.csv'; a.click()
  }

  const handleExport = () => {
    const rows = filtered ?? []
    const headers = 'Flock,Date,Type,Party,DC No,Qty,Unit,Rate,Amount,Remarks'
    const lines = rows.map((r: any) => [
      r.flocks?.flock_no ?? '', r.sale_date,
      NHE_TYPES.find(t => t.value === r.sale_type)?.label ?? r.sale_type,
      r.parties?.name ?? '', r.dc_no ?? '',
      r.quantity ?? '', r.unit ?? '', r.rate ?? '', r.amount ?? '', r.remarks ?? ''
    ].join(','))
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

      const records = rows.map(r => ({
        flock_id: flockMap[r.flock_no] ?? null,
        sale_date: r.sale_date,
        sale_type: r.sale_type || 'other',
        party_id: r.party_name ? (partyMap[r.party_name.toLowerCase()] ?? null) : null,
        dc_no: r.dc_no || null,
        quantity: r.quantity !== '' ? Number(r.quantity) : null,
        unit: r.unit || 'nos',
        rate: r.rate !== '' ? Number(r.rate) : null,
        amount: (Number(r.quantity||0) * Number(r.rate||0)) || null,
        remarks: r.remarks || null,
      })).filter(r => r.flock_id && r.amount)

      if (records.length === 0) throw new Error('No valid rows found. Check flock_no and amount columns.')
      const { error } = await supabase.from('nhe_sales').insert(records)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['nhe_sales'] })
      toast.success(`Imported ${records.length} records!`)
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
      if (!(s.parties?.name ?? '').toLowerCase().includes(q) &&
          !(s.dc_no ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

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

      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap items-end">
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
        <Select label="" placeholder="All Employees"
          options={(employees ?? []).map((e: any) => ({ value: e.id, label: `${e.emp_id ? e.emp_id + ' — ' : ''}${e.name}` }))}
          value={empFilter} onChange={e => setEmpFilter(e.target.value)} className="w-48" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Types</option>
          {NHE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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
          placeholder="Search party / DC No…"
          value={partyFilter}
          onChange={e => setPartyFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-48"
        />
        {(hasFilter || typeFilter || partyFilter) && <Button variant="ghost" size="sm" onClick={() => { setFlockFilter(''); setFromDate(''); setToDate(''); setTypeFilter(''); setPartyFilter('') }}>Clear</Button>}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleDownloadTemplate}>Template</Button>
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>
          <Button variant="outline" size="sm" icon={<Upload size={14}/>} loading={importing} onClick={() => fileRef.current?.click()}>Import</Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }} />
        </div>
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

      <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
              <Th>Flock</Th><Th>Date</Th><Th>Type</Th><Th>Party</Th>
              <Th right>Qty</Th><Th right>Wt (kg)</Th><Th right>₹/kg</Th><Th right>Amount</Th>
              <Th>Payment</Th><Th>Vehicle/DC</Th><Th></Th>
            </tr></thead>
            <tbody>
              {filtered.map((s: any) => (
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
                  <Td right className="text-xs">{s.quantity != null ? s.quantity.toLocaleString('en-IN') : '—'}</Td>
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
                  <Td className="text-xs text-gray-400">{s.vehicle_no ?? s.dc_no ?? '—'}</Td>
                  <Td>
                    <div className="flex gap-1">
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
                <Td colSpan={3}></Td>
              </tr></tfoot>
            )}
          </Table>
          {filtered.length === 0 && <EmptyState icon={<Egg size={32}/>} title="No sales yet" action={<Button onClick={openNew} icon={<Plus size={16}/>}>Add</Button>} />}
        </Card>
      )}

      {bulkConfirm && (
        <ConfirmBulkDelete label={`Delete ${sel.size} NHE/bird sale records? This cannot be undone.`}
          onConfirm={() => bulkDelMut.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}

      <ReceivePaymentModal
        open={!!receiptSale}
        sale={receiptSale}
        bankAccounts={bankAccounts ?? []}
        farms={farmsNhe ?? []}
        table="nhe_sales"
        onClose={() => setReceiptSale(null)}
        onSaved={() => { setReceiptSale(null); qc.invalidateQueries({ queryKey: ['nhe_sales'] }) }}
      />

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); setNheLines([emptyNheLine()]) }}
        title={editing ? 'Edit NHE / Bird Sale' : 'Record NHE / Bird Sale'} size="lg"
        footer={<><Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null); setNheLines([emptyNheLine()]) }}>Cancel</Button>
          <Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Select label="Flock" required placeholder="— Select —" options={flockOptions}
              value={form.flock_id} onChange={e => sv('flock_id', e.target.value)} />
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
                <FormRow cols={4}>
                  <Select label="Bird Sex" options={BIRD_SEX_OPTS}
                    value={form.bird_sex} onChange={e => sv('bird_sex', e.target.value)} />
                  <Select label="Category" options={BIRD_CAT_OPTS}
                    value={form.bird_category} onChange={e => sv('bird_category', e.target.value)} />
                  <Input label="No. of Birds" type="number"
                    value={form.quantity} onChange={e => sv('quantity', e.target.value)} />
                  <Input label="Avg Weight/bird (kg)" type="number" step="0.001"
                    value={form.avg_weight_kg} onChange={e => sv('avg_weight_kg', e.target.value)}
                    hint="per bird live weight" />
                </FormRow>
                <FormRow cols={3}>
                  <Input label="Total Weight (kg)" type="number" step="0.001"
                    value={form.total_weight_kg} onChange={e => sv('total_weight_kg', e.target.value)}
                    hint={form.quantity && form.avg_weight_kg ? `Auto: ${(parseFloat(form.quantity)*(parseFloat(form.avg_weight_kg)||0)).toFixed(3)} kg` : 'qty × avg wt'} />
                  <Input label="Rate per kg (₹)" type="number" step="0.01"
                    value={form.rate_per_kg} onChange={e => sv('rate_per_kg', e.target.value)} />
                  <Input label="Total Amount (₹)" required type="number" step="0.01"
                    value={form.amount} onChange={e => sv('amount', e.target.value)}
                    hint={autoAmt > 0 ? `Auto: ${inr(autoAmt)}` : 'wt × rate/kg'} />
                </FormRow>
              </div>
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
                        <td className="px-2 py-1 text-xs font-semibold text-gray-700" colSpan={3}>Total</td>
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
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,laying_farm_id,rearing_farm_id').order('flock_no')
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
      let q = supabase.from('medicine_usage')
        .select('*, flocks(flock_no), medicines_master(name,unit)')
        .order('usage_date', { ascending: false })
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      if (fromDate) q = q.gte('usage_date', fromDate)
      if (toDate) q = q.lte('usage_date', toDate)
      if (!hasFilter) q = q.limit(200)
      const { data } = await q; return data ?? []
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

  const [tab, setTab] = useState<'daily' | 'monthly'>('monthly')
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

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const medOptions = medicines?.map((m: any) => ({ value: m.id, label: `${m.name} (${m.unit})` })) ?? []

  const usageIds = (usage ?? []).map((u: any) => u.id)
  const allUsageSel = usageIds.length > 0 && usageIds.every((id: string) => sel.has(id))
  const someUsageSel = usageIds.some((id: string) => sel.has(id))
  const toggleUsage = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAllUsage = () => setSel(s => { const n = new Set(s); allUsageSel ? usageIds.forEach((id: string) => n.delete(id)) : usageIds.forEach((id: string) => n.add(id)); return n })

  const handleExportMed = () => {
    const rows = tab === 'daily' ? usage : monthly
    if (!rows?.length) { toast.error('No data to export'); return }
    if (tab === 'daily') {
      exportFlatCSV(`medicine_usage.csv`,
        ['flock_no','usage_date','medicine','qty','unit','rate','amount','remarks'],
        (usage??[]).map((u:any)=>[u.flocks?.flock_no, u.usage_date, u.medicines_master?.name, u.quantity, u.unit, u.rate, u.amount, u.remarks])
      )
    } else {
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
            <Button icon={<Plus size={16}/>} onClick={() => setShowForm(true)}>Add Entry</Button>
          </div>
        }
      />
      <div className="flex gap-3 flex-wrap items-end">
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
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
        {hasFilter && <Button variant="ghost" size="sm" onClick={() => { setFlockFilter(''); setFromDate(''); setToDate('') }}>Clear</Button>}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden ml-auto">
          {(['monthly','daily'] as const).map(t => (
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
      ) : (
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
                {usage?.map((u: any) => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${sel.has(u.id) ? 'bg-red-50' : ''}`}>
                    <Td><CB checked={sel.has(u.id)} onChange={() => toggleUsage(u.id)}/></Td>
                    <Td><Badge color="green">F-{u.flocks?.flock_no}</Badge></Td>
                    <Td className="text-xs">{fmtDate(u.usage_date)}</Td>
                    <Td className="text-sm">{u.medicines_master?.name ?? '—'}</Td>
                    <Td right className="text-xs">{u.quantity ?? '—'} {u.unit}</Td>
                    <Td right className="text-xs">{u.rate ? `Rs ${u.rate}` : '—'}</Td>
                    <Td right className="font-semibold text-xs">{u.amount ? inr(u.amount) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {usage?.length === 0 && <EmptyState icon={<Package size={32}/>} title="No usage records" />}
          </Card>
          {bulkConfirm && (
            <ConfirmBulkDelete label={`Delete ${sel.size} medicine usage records? This cannot be undone.`}
              onConfirm={() => bulkDelMutMed.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
          )}
        </>
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
              <Select label="Flock" required placeholder="— Select —" options={flockOptions}
                value={monthlyForm.flock_id} onChange={e => sm('flock_id', e.target.value)} />
              <Input label="Month" required type="month" value={monthlyForm.month} onChange={e => sm('month', e.target.value)} />
            </FormRow>
            <Input label="Total Medicine Amount (Rs)" required type="number" step="0.01"
              value={monthlyForm.total_amount} onChange={e => sm('total_amount', e.target.value)} />
            <Input label="Remarks" value={monthlyForm.remarks} onChange={e => sm('remarks', e.target.value)} />
          </div>
        ) : (
          <div className="space-y-4">
            <FormRow>
              <Select label="Flock" required placeholder="— Select —" options={flockOptions}
                value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
              <DateInput label="Date" required value={form.usage_date} onChange={e => s('usage_date', e.target.value)} />
            </FormRow>
            <Select label="Medicine / Vaccine" placeholder="— Select —" options={medOptions}
              value={form.medicine_id} onChange={e => {
                s('medicine_id', e.target.value)
                const med = medicines?.find((m: any) => m.id === e.target.value)
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

  const medOptions = (medicines??[]).map((m: any) => ({ value: m.id, label: `${m.name} (${m.unit})` }))
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
        <Select label="" placeholder="All Medicines" options={medOptions}
          value={filterMed} onChange={e => setFilterMed(e.target.value)} className="w-52" />
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
            <Select label="Medicine / Vaccine" required placeholder="— Select —" options={medOptions}
              value={form.medicine_id} onChange={e => {
                const med = (medicines??[]).find((m: any) => m.id === e.target.value)
                setForm(f => ({ ...f, medicine_id: e.target.value, unit: med?.unit ?? f.unit, rate: med?.rate?.toString() ?? f.rate }))
              }} />
          </FormRow>
          <FormRow>
            <Select label="Farm / Site" placeholder="— Select —" options={farmOptions} value={form.farm_id} onChange={e => s('farm_id', e.target.value)} />
            <div className="relative">
              <div className="flex items-end gap-1">
                <div className="flex-1">
                  <Select label="Supplier" placeholder="— Select —" options={supplierOptions} value={form.supplier_id} onChange={e => s('supplier_id', e.target.value)} />
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
