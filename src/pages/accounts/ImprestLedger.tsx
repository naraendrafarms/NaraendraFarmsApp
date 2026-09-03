import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today, fmtDate } from '@/lib/utils'
import {
  Card, CardHeader, Select, Spinner, EmptyState, DateInput,
  Table, Th, Td, Badge, Button, Modal, Input,
} from '@/components/ui'
import { Download, Wallet, Plus, ArrowLeftRight } from 'lucide-react'
import { useConfigOptions } from '@/hooks/useConfigOptions'
import { moduleLevel } from '@/lib/auth'
import { friendlyDbError } from '@/lib/utils'
import { recordTransfer, TRANSFER_QUERY_KEYS } from '@/lib/cashTransfer'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

// The same option groups the Cash Book reads, so the two screens can never
// offer different categories or modes for the same book.
const CATEGORIES_FB = [
  { value: 'sales_collection', label: 'Sales Collection (General)' },
  { value: 'he_sale', label: 'HE Egg Sale' }, { value: 'je_sale', label: 'Jumbo Egg Sale (JE)' },
  { value: 'te_sale', label: 'Table Egg Sale (TE)' }, { value: 'be_sale', label: 'Broken/Crack Egg Sale (BE)' },
  { value: 'bird_sale', label: 'Bird Sale' }, { value: 'litter_sale', label: 'Litter / Manure Sale' },
  { value: 'bag_sale', label: 'Empty Bag Sale' }, { value: 'expense', label: 'Expense' },
  { value: 'salary', label: 'Salary' }, { value: 'advance', label: 'Advance' },
  { value: 'transfer', label: 'Transfer' }, { value: 'other', label: 'Other' },
]
const PAYMENT_MODES_FB = [
  { value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }, { value: 'cheque', label: 'Cheque' },
]
// cash_book.txn_type accepts only these three. Hardcoded rather than read from
// the options table: that table once held only credit/debit and made every save
// fail with a constraint error, and this screen will not repeat it.
const TXN_TYPES = [
  { value: 'receipt', label: 'Receipt (money in)' },
  { value: 'payment', label: 'Payment (money out)' },
  { value: 'contra',  label: 'Contra (transfer)' },
]

// Each imprest account as its own cash book: every entry it holds, in date
// order, with a running balance.
//
// A voucher can be entered straight from here, pre-set to the account being
// viewed, so nobody has to go to the Cash Book and remember to pick the imprest
// -- forgetting it is what leaves an entry untagged and a balance wrong. It
// writes to cash_book like any other entry: there is no second store, and
// nothing entered here is hidden from the Cash Book, which stays the single
// place every transaction is visible.
//
// It answers the question the cash book could never answer -- "what has Srinath
// been given, what has he spent, and what is he holding?" -- because until now
// nothing recorded WHICH cash box a transaction moved through.
//
// The opening balance comes from the account master. The running balance starts
// there and moves with each entry, so the last row is the account's balance
// today and matches the card on Masters -> Cash Imprest Accounts.

const rupee = (n: number) =>
  Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TYPE_COLOR: Record<string, any> = { receipt: 'green', payment: 'red', contra: 'blue' }

export const ImprestLedger: React.FC = () => {
  const [acctId, setAcctId] = useState('')
  // Both blank by default: picking an account shows EVERY voucher it holds. A
  // date default silently hid older entries and made a populated account look
  // empty. Either box can still be filled to narrow the view.
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data: accounts } = useQuery({
    queryKey: ['cash_account_balances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_cash_account_balance').select('*').order('sort_order')
      if (error) throw error
      return data ?? []
    },
  })

  React.useEffect(() => {
    if (!acctId && accounts?.length) setAcctId(accounts[0].cash_account_id)
  }, [accounts, acctId])

  const acct = (accounts ?? []).find((a: any) => a.cash_account_id === acctId) as any

  const qc = useQueryClient()
  const canEdit = moduleLevel('accounts') === 'full'
  const CATEGORIES = useConfigOptions('cashbook_category', CATEGORIES_FB)
  const PAYMENT_MODES = useConfigOptions('payment_method', PAYMENT_MODES_FB)

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name').order('name')
      return data ?? []
    },
  })

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank_accounts_active'],
    queryFn: async () => {
      const { data } = await supabase.from('bank_accounts')
        .select('id,bank_name,account_no').eq('is_active', true).order('bank_name')
      return data ?? []
    },
  })

  // A transfer endpoint is an imprest, a bank account, or a site -- the same
  // list the Cash Book offers, built from the same shapes.
  const endpointOptions = [
    ...(accounts ?? []).map((a: any) => ({ value: `imprest:${a.cash_account_id}`, label: `${a.name} (Imprest)` })),
    ...(bankAccounts ?? []).map((b: any) => ({
      value: `bank:${b.id}`,
      label: `${b.bank_name}${b.account_no ? ' ****' + String(b.account_no).slice(-4) : ''} (Bank)`,
    })),
    { value: 'site:ho', label: 'Head Office (Site)' },
    ...(farms ?? []).map((f: any) => ({ value: `site:${f.id}`, label: `${f.name} (Site)` })),
  ]

  const [showTransfer, setShowTransfer] = useState(false)
  const emptyTransfer = () => ({ date: today(), amount: '', description: '', to: '' })
  const [xfer, setXfer] = useState(emptyTransfer())
  const sx = (k: string, val: any) => setXfer(f => ({ ...f, [k]: val }))

  // FROM is always the account being viewed. A transfer opened from Srinath's
  // page is money leaving Srinath -- letting From be changed here would just be
  // the Cash Book's transfer box in a confusing place.
  const doTransfer = useMutation({
    mutationFn: async () => {
      await recordTransfer({
        date: xfer.date,
        amount: parseFloat(xfer.amount),
        description: xfer.description,
        from: `imprest:${acctId}`,
        to: xfer.to,
      })
    },
    onSuccess: () => {
      toast.success('Transfer recorded')
      for (const k of TRANSFER_QUERY_KEYS) qc.invalidateQueries({ queryKey: [k] })
      setXfer(emptyTransfer())
      setShowTransfer(false)
    },
    onError: (e: any) => toast.error(e.message),
  })

  const [showForm, setShowForm] = useState(false)
  const emptyVoucher = () => ({
    txn_date: today(), txn_type: 'payment', category: 'expense',
    description: '', party_name: '', farm_id: '', amount: '',
    payment_mode: 'cash', reference_no: '', remarks: '',
  })
  const [v, setV] = useState(emptyVoucher())
  const sv = (k: string, val: any) => setV(f => ({ ...f, [k]: val }))

  const saveVoucher = useMutation({
    mutationFn: async () => {
      if (!acctId) throw new Error('Pick an imprest account first')
      if (!v.description.trim()) throw new Error('Description is required')
      const amt = parseFloat(v.amount) || 0
      if (amt <= 0) throw new Error('Enter an amount greater than zero')
      // ONE amount box, with the Type deciding which side it lands on. Two
      // separate boxes is exactly how the 05/05 row ended up typed 'receipt'
      // while carrying a payment amount.
      const isIn = v.txn_type === 'receipt'
      const { error } = await supabase.from('cash_book').insert({
        txn_date: v.txn_date,
        txn_type: v.txn_type,
        category: v.category || null,
        description: v.description.trim(),
        party_name: v.party_name.trim() || null,
        farm_id: v.farm_id || null,
        cash_account_id: acctId,
        amount_in: isIn ? amt : 0,
        amount_out: isIn ? 0 : amt,
        payment_mode: v.payment_mode || 'cash',
        reference_no: v.reference_no.trim() || null,
        remarks: v.remarks.trim() || null,
      })
      if (error) throw new Error(friendlyDbError(error))
    },
    onSuccess: () => {
      toast.success('Voucher recorded')
      qc.invalidateQueries({ queryKey: ['imprest_ledger'] })
      qc.invalidateQueries({ queryKey: ['imprest_prior'] })
      qc.invalidateQueries({ queryKey: ['cash_account_balances'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      setV(emptyVoucher())
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message),
  })

  const { data: rows, isLoading } = useQuery({
    queryKey: ['imprest_ledger', acctId, from, to],
    enabled: !!acctId,
    queryFn: async () => {
      // Reads v_imprest_entries, not cash_book, so the ledger lists exactly the
      // rows the balance counts. A receipt at a site belongs to that site's
      // imprest whether or not anyone tagged it -- the location already says so.
      // No embed and no created_at ordering against the view: a view has no
      // foreign keys so farms(name) cannot resolve, and created_at was not on
      // the view -- either one failed the whole request and returned nothing.
      let q = supabase
        .from('v_imprest_entries')
        .select('cash_book_id,txn_date,created_at,txn_type,category,description,party_name,reference_no,amount_in,amount_out,payment_mode,farm_id,farm_name,derived')
        .eq('cash_account_id', acctId)
        .order('txn_date').order('created_at')
      if (from) q = q.gte('txn_date', from)
      if (to) q = q.lte('txn_date', to)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })

  // Everything BEFORE the from-date, so the statement opens at the right
  // figure rather than at the account's original opening balance.
  const { data: priorNet } = useQuery({
    queryKey: ['imprest_prior', acctId, from],
    enabled: !!acctId,
    queryFn: async () => {
      if (!from) return 0   // no From date means the list already starts at the beginning
      const { data } = await supabase
        .from('v_imprest_entries').select('amount_in,amount_out,payment_mode')
        .eq('cash_account_id', acctId).lt('txn_date', from)
      // Cash only, matching v_cash_account_balance. An imprest is physical cash
      // the holder carries; a cheque or UPI moves through the bank and never
      // touches the tin, so counting it would misstate what he is holding.
      return (data ?? [])
        .filter((r: any) => (r.payment_mode ?? 'cash') === 'cash')
        .reduce((a: number, r: any) => a + Number(r.amount_in ?? 0) - Number(r.amount_out ?? 0), 0)
    },
  })

  const openingForPeriod = Number(acct?.opening_balance ?? 0) + Number(priorNet ?? 0)

  const isCash = (r: any) => (r.payment_mode ?? 'cash') === 'cash'

  const withBalance = useMemo(() => {
    let bal = openingForPeriod
    return (rows ?? []).map((r: any) => {
      // Non-cash rows are LISTED but do not move the balance -- shown rather
      // than silently dropped, so nobody wonders where an entry went.
      if (isCash(r)) bal += Number(r.amount_in ?? 0) - Number(r.amount_out ?? 0)
      return { ...r, running: bal, counted: isCash(r) }
    })
  }, [rows, openingForPeriod])

  const nonCashCount = (rows ?? []).filter((r: any) => !isCash(r)).length
  const totIn = (rows ?? []).filter(isCash).reduce((a: number, r: any) => a + Number(r.amount_in ?? 0), 0)
  const totOut = (rows ?? []).filter(isCash).reduce((a: number, r: any) => a + Number(r.amount_out ?? 0), 0)
  const closing = openingForPeriod + totIn - totOut

  const exportXlsx = () => {
    const out = withBalance.map((r: any) => ({
      Date: fmtDate(r.txn_date), Type: r.txn_type, Category: r.category ?? '',
      Description: r.description, Party: r.party_name ?? '',
      Site: r.farm_name ?? '', Reference: r.reference_no ?? '',
      Received: Number(r.amount_in ?? 0), Paid: Number(r.amount_out ?? 0),
      Balance: r.running, Mode: r.payment_mode ?? '',
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(out), 'Imprest Ledger')
    XLSX.writeFile(wb, `imprest-${(acct?.name ?? 'account').replace(/\s+/g, '-')}-${from || 'all'}-to-${to || 'all'}.xlsx`)
  }

  return (
    <div className="space-y-4">
      <CardHeader
        title="Imprest Ledger"
        subtitle="Each imprest account as its own cash book — what came in, what went out, what is held"
        action={
          <div className="flex gap-2">
            {withBalance.length > 0 && (
              <Button variant="outline" icon={<Download size={16} />} onClick={exportXlsx}>Export</Button>
            )}
            {canEdit ? <>
              <Button variant="outline" icon={<ArrowLeftRight size={16} />} disabled={!acctId}
                onClick={() => { setXfer(emptyTransfer()); setShowTransfer(true) }}>Transfer</Button>
              <Button icon={<Plus size={16} />} disabled={!acctId}
                onClick={() => { setV(emptyVoucher()); setShowForm(true) }}>Add Voucher</Button>
            </> : <Badge color="gray">View only</Badge>}
          </div>
        } />

      {/* Every account's balance at a glance, and a one-click switch. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(accounts ?? []).map((a: any) => (
          <button key={a.cash_account_id} onClick={() => setAcctId(a.cash_account_id)}
            className={`text-left rounded-lg border p-3 transition-colors ${
              a.cash_account_id === acctId
                ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Wallet size={13} /><span className="text-xs">{a.txn_count} entries</span>
            </div>
            <p className="font-semibold text-gray-800 text-sm leading-snug">{a.name}</p>
            <p className={`text-base font-bold ${Number(a.balance) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              ₹{rupee(a.balance)}
            </p>
          </button>
        ))}
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Imprest Account" value={acctId}
            onChange={e => setAcctId((e.target as HTMLSelectElement).value)}
            options={(accounts ?? []).map((a: any) => ({ value: a.cash_account_id, label: a.name }))} />
          <DateInput label="From" value={from} onChange={e => setFrom(e.target.value)} />
          <DateInput label="To" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </Card>

      {!accounts?.length ? (
        <EmptyState title="No imprest accounts"
          subtitle="Add them under Masters → Cash Imprest Accounts." />
      ) : isLoading ? <Spinner /> : (
        <Card padding={false}>
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-x-6 gap-y-1 text-xs">
            <span className="text-gray-500">Opening <strong className="text-gray-800">₹{rupee(openingForPeriod)}</strong></span>
            <span className="text-gray-500">Received <strong className="text-green-700">₹{rupee(totIn)}</strong></span>
            <span className="text-gray-500">Paid <strong className="text-red-700">₹{rupee(totOut)}</strong></span>
            <span className="text-gray-500">Closing <strong className={closing < 0 ? 'text-red-600' : 'text-gray-900'}>₹{rupee(closing)}</strong></span>
            <span className="text-gray-400">
              {from || to ? `${from ? fmtDate(from) : 'start'} – ${to ? fmtDate(to) : 'today'}` : 'all dates'}
            </span>
            {nonCashCount > 0 && (
              <span className="text-amber-600">
                {nonCashCount} cheque/UPI {nonCashCount === 1 ? 'entry' : 'entries'} listed but not counted —
                an imprest is physical cash
              </span>
            )}
          </div>

          {withBalance.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No entries for this account"
                subtitle="This account holds no cash book entries. An entry belongs to a site's imprest automatically, from where the cash was received; the Imprest Account box on the Cash Book form is only needed when the cash is NOT at a site — Head Office cash actually held by Mandal or by a person. If you have set a From or To date above, clear them to see every voucher." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead><tr>
                  <Th>Date</Th><Th>Type</Th><Th>Category</Th><Th>Description</Th>
                  <Th>Party</Th><Th>Site</Th>
                  <Th right>Received</Th><Th right>Paid</Th><Th right>Balance</Th><Th>Mode</Th>
                </tr></thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <Td colSpan={8}><em className="text-gray-500">Opening balance</em></Td>
                    <Td right><strong>₹{rupee(openingForPeriod)}</strong></Td><Td></Td>
                  </tr>
                  {withBalance.map((r: any) => (
                    <tr key={r.cash_book_id} className={`hover:bg-gray-50 ${r.counted ? '' : 'opacity-60'}`}>
                      <Td>{fmtDate(r.txn_date)}</Td>
                      <Td><Badge color={TYPE_COLOR[r.txn_type] ?? 'gray'}>{r.txn_type}</Badge></Td>
                      <Td className="text-xs text-gray-500">{r.category ?? ''}</Td>
                      <Td>{r.description}</Td>
                      <Td className="text-xs text-gray-500">{r.party_name ?? ''}</Td>
                      <Td className="text-xs text-gray-500">{r.farm_name ?? ''}</Td>
                      <Td right className="text-green-700">{Number(r.amount_in) ? '₹' + rupee(r.amount_in) : ''}</Td>
                      <Td right className="text-red-700">{Number(r.amount_out) ? '₹' + rupee(r.amount_out) : ''}</Td>
                      <Td right>{r.counted
                        ? <strong className={r.running < 0 ? 'text-red-600' : ''}>₹{rupee(r.running)}</strong>
                        : <span className="text-xs text-amber-600">not cash</span>}</Td>
                      <Td className="text-xs text-gray-500">{r.payment_mode ?? ''}</Td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <Td colSpan={6}>CLOSING — {acct?.name}</Td>
                    <Td right className="text-green-700">₹{rupee(totIn)}</Td>
                    <Td right className="text-red-700">₹{rupee(totOut)}</Td>
                    <Td right className={closing < 0 ? 'text-red-600' : ''}>₹{rupee(closing)}</Td>
                    <Td></Td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      )}

      <Modal open={showTransfer} onClose={() => setShowTransfer(false)}
        title={`Transfer from ${acct?.name ?? ''}`}>
        <div className="space-y-4">
          <div className="rounded-lg bg-brand-50 border border-brand-200 px-3 py-2 text-sm">
            Money leaving <strong>{acct?.name}</strong>. Both sides are written together —
            imprest and site legs into the Cash Book, a bank leg into the Bank Ledger —
            so the two halves stay tied to each other.
          </div>

          <Select label="To" value={xfer.to}
            onChange={e => sx('to', (e.target as HTMLSelectElement).value)}
            options={[{ value: '', label: '— Select destination —' },
              ...endpointOptions.filter(o => o.value !== `imprest:${acctId}`)]}
            hint="Another imprest, a bank account (a cash deposit), or a site" />

          <div className="grid grid-cols-2 gap-4">
            <DateInput label="Date" value={xfer.date} onChange={e => sx('date', e.target.value)} />
            <Input label="Amount (₹)" required type="number" step="0.01"
              value={xfer.amount} onChange={e => sx('amount', e.target.value)} />
          </div>

          <Input label="Description" required value={xfer.description}
            onChange={e => sx('description', e.target.value)}
            placeholder="e.g. Cash handed to Mandal Imprest" />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancel</Button>
            <Button loading={doTransfer.isPending} onClick={() => doTransfer.mutate()}>
              Record Transfer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={`Add Voucher — ${acct?.name ?? ''}`}>
        <div className="space-y-4">
          <div className="rounded-lg bg-brand-50 border border-brand-200 px-3 py-2 text-sm">
            This voucher is recorded against <strong>{acct?.name}</strong>. It goes into the
            Cash Book like any other entry — there is no separate book.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateInput label="Date" value={v.txn_date} onChange={e => sv('txn_date', e.target.value)} />
            <Select label="Type" value={v.txn_type}
              onChange={e => sv('txn_type', (e.target as HTMLSelectElement).value)}
              options={TXN_TYPES} />
          </div>

          <Input label="Description" required value={v.description}
            onChange={e => sv('description', e.target.value)}
            placeholder="e.g. Being amount paid for office tea expenses" />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={v.category}
              onChange={e => sv('category', (e.target as HTMLSelectElement).value)}
              options={CATEGORIES} />
            <Select label="Payment Mode" value={v.payment_mode}
              onChange={e => sv('payment_mode', (e.target as HTMLSelectElement).value)}
              options={PAYMENT_MODES} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label={v.txn_type === 'receipt' ? 'Amount Received (₹)' : 'Amount Paid (₹)'}
              required type="number" step="0.01" value={v.amount}
              onChange={e => sv('amount', e.target.value)}
              hint="One box — the Type above decides which side it lands on" />
            <Select label="Site (which site bears the cost)" value={v.farm_id}
              onChange={e => sv('farm_id', (e.target as HTMLSelectElement).value)}
              options={[{ value: '', label: '— Head Office / none —' },
                ...(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))]} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Party (optional)" value={v.party_name}
              onChange={e => sv('party_name', e.target.value)}
              placeholder="who paid or was paid" />
            <Input label="Reference No (optional)" value={v.reference_no}
              onChange={e => sv('reference_no', e.target.value)} />
          </div>

          <Input label="Remarks (optional)" value={v.remarks}
            onChange={e => sv('remarks', e.target.value)} />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button loading={saveVoucher.isPending} onClick={() => saveVoucher.mutate()}>
              Save Voucher
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
