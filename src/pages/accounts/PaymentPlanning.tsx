import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today, currentFY, fyRange, fetchAllPages } from '@/lib/utils'
import { Card, CardHeader, Button, DateInput, Input, Modal, Spinner, Table, Th, Td, Badge, StatCard, Select } from '@/components/ui'
import { Download, IndianRupee, TrendingUp, TrendingDown, Clock, CheckCircle, Printer, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { printPaymentPlanning } from '@/lib/invoicePrint'

const COMPANY_NAME = 'Naraendra Farms'
const COMPANY_ADDR1 = '5-9-22/21 , JVR Amrit Enclave, Roshanlal Residency ,'
const COMPANY_ADDR2 = 'Adarsh Nagar , Hyderabad - 500063'

export const PaymentPlanningPage: React.FC = () => {
  const qc = useQueryClient()
  const [planDate, setPlanDate] = useState(today())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [markPaidForm, setMarkPaidForm] = useState({ paid_date: today(), utr_no: '', discount_amount: '0', discount_reason: '', account_type: 'Online', bank_account_id: '' })

  const { data: bankAccountsList } = useQuery({
    queryKey: ['bank_accounts_list'],
    queryFn: async () => {
      const { data } = await supabase.from('bank_accounts').select('id,account_name,bank_name').eq('is_active', true).order('bank_name')
      return data ?? []
    }
  })

  // Kotak bank account balance — must match Bank Ledger's own calculation:
  // per-financial-year opening balance (bank_fy_opening, falling back to the
  // account's single opening_balance) plus only THIS FY's transactions.
  // The previous version summed every bank_transactions row ever recorded
  // against a flat all-time opening_balance, which diverges from what Bank
  // Ledger itself shows as the closing balance. Also sums across every
  // account with "Kotak" in the name instead of arbitrarily picking the
  // first match, in case more than one exists.
  const { data: kotakBalance } = useQuery({
    queryKey: ['kotak_balance'],
    queryFn: async () => {
      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('id,bank_name,account_name,opening_balance')
        .ilike('bank_name', '%kotak%')
        .eq('is_active', true)
      if (!accounts?.length) return { balance: 0 }
      const fy = currentFY()
      const { start } = fyRange(fy)
      let balance = 0
      for (const acc of accounts) {
        const { data: fyOpen } = await supabase
          .from('bank_fy_opening')
          .select('opening_balance')
          .eq('bank_account_id', acc.id).eq('fy', fy)
          .maybeSingle()
        const opening = fyOpen?.opening_balance != null ? Number(fyOpen.opening_balance) : (acc.opening_balance ?? 0)
        const { data: txns } = await supabase
          .from('bank_transactions')
          .select('txn_type,amount')
          .eq('bank_account_id', acc.id)
          .gte('txn_date', start)
        const credits = (txns ?? []).filter(t => t.txn_type === 'Credit').reduce((s, t) => s + (t.amount ?? 0), 0)
        const debits  = (txns ?? []).filter(t => t.txn_type === 'Debit').reduce((s, t) => s + (t.amount ?? 0), 0)
        balance += opening + credits - debits
      }
      return { balance }
    }
  })

  // Cash (Mandal Imprest) balance from cash_book — unfiltered, all-time, so
  // page through the full set rather than trusting a single request
  // (PostgREST silently caps at 1000 rows otherwise, understating cash).
  const { data: cashBalance } = useQuery({
    queryKey: ['cash_balance'],
    queryFn: async () => {
      const data = await fetchAllPages<any>(
        (from, to) => supabase.from('cash_book').select('txn_type,amount_in,amount_out').range(from, to),
        'Cash balance'
      )
      const inAmt  = data.reduce((s, r) => s + (r.amount_in  ?? 0), 0)
      const outAmt = data.reduce((s, r) => s + (r.amount_out ?? 0), 0)
      return inAmt - outAmt
    }
  })

  // Pending receivables (NHE + HE dispatch not yet received)
  const { data: receivables } = useQuery({
    queryKey: ['pending_receivables'],
    queryFn: async () => {
      const [nhe, he] = await Promise.all([
        // SQL NULL never matches IN or NOT EQUAL, so the previous
        // .in('payment_status', ['Pending', null]) silently excluded every
        // NULL-status row instead of catching it — use OR with IS NULL.
        supabase.from('nhe_sales')
          .select('id,sale_date,sale_type,amount,tds_amount,amount_received,parties(name),flocks(flock_no)')
          .or('payment_status.eq.Pending,payment_status.eq.Partial,payment_status.is.null')
          .or('is_employee_sale.is.null,is_employee_sale.eq.false')
          .order('sale_date', { ascending: false })
          .limit(100),
        supabase.from('he_dispatch')
          .select('id,dispatch_date,amount,tds_amount,amount_received,parties(name),flocks(flock_no)')
          .or('payment_status.eq.Pending,payment_status.eq.Partial,payment_status.is.null')
          .order('dispatch_date', { ascending: false })
          .limit(100),
      ])
      // Receivable = invoice amount, less TDS deducted at source (HE
      // Dispatch/NHE Sale show this as "Net receivable" on the receipt
      // form) and less whatever's already been received on a Partial row —
      // previously this used the gross `amount` only, overstating what's
      // actually still owed.
      const netDue = (r: any) => Math.max(0, (r.amount ?? 0) - (r.tds_amount ?? 0) - (r.amount_received ?? 0))
      const nheRows = (nhe.data ?? []).map((r: any) => ({
        id: r.id, type: 'NHE', date: r.sale_date,
        party: r.parties?.name ?? '—', flock: r.flocks?.flock_no,
        amount: netDue(r),
      }))
      const heRows = (he.data ?? []).map((r: any) => ({
        id: r.id, type: 'HE', date: r.dispatch_date,
        party: r.parties?.name ?? '—', flock: r.flocks?.flock_no,
        amount: netDue(r),
      }))
      return [...nheRows, ...heRows].sort((a, b) => a.date < b.date ? 1 : -1)
    }
  })

  // Pending payments to vendors
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['pending_payments_plan'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pending_payments')
        .select('*')
        .or('payment_status.in.(Pending,HOLD),payment_status.is.null')
        .order('pay_before_date', { ascending: true })
      return data ?? []
    }
  })

  // Bank account details for vendors (from parties table)
  const { data: partiesMap } = useQuery({
    queryKey: ['parties_bank_details'],
    queryFn: async () => {
      const { data } = await supabase
        .from('parties')
        .select('id,name,bank_name,account_no,ifsc,branch,state_code')
        .order('name')
      const map: Record<string, any> = {}
      for (const p of (data ?? [])) map[p.name] = p
      return map
    }
  })

  // Ad-hoc "manual items" — real upcoming cash in/out with no bill row
  // anywhere yet (a pending salary for one employee, an advance due next
  // month, etc.). Deliberately NOT wired into Salary/Advances' own tested
  // paid/unpaid flows — just a visibility placeholder here until the real
  // entry is made properly, at which point you delete the manual row.
  const [manualForm, setManualForm] = useState({ label: '', amount: '', direction: 'payable', due_date: today() })
  const { data: manualItems } = useQuery({
    queryKey: ['payment_plan_manual_items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('payment_plan_manual_items').select('*').order('due_date', { ascending: true })
      if (error) throw error
      return data ?? []
    }
  })
  const manualPayable = (manualItems ?? []).filter((m: any) => m.direction === 'payable').reduce((s: number, m: any) => s + (m.amount ?? 0), 0)
  const manualReceivable = (manualItems ?? []).filter((m: any) => m.direction === 'receivable').reduce((s: number, m: any) => s + (m.amount ?? 0), 0)

  // Selecting a Manual Item folds its amount into Balance After / the
  // selected total on this page, for planning visibility only — it can't go
  // through Mark Paid or Export CMS since there's no vendor/bank/GRN behind
  // it yet (that's what turns it into a real bill via Add Bill).
  const [selectedManual, setSelectedManual] = useState<Set<string>>(new Set())
  const toggleManual = (id: string) => {
    setSelectedManual(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const selectedManualItems = (manualItems ?? []).filter((m: any) => selectedManual.has(m.id))
  const selectedManualPayable = selectedManualItems.filter((m: any) => m.direction === 'payable').reduce((s: number, m: any) => s + (m.amount ?? 0), 0)
  const selectedManualReceivable = selectedManualItems.filter((m: any) => m.direction === 'receivable').reduce((s: number, m: any) => s + (m.amount ?? 0), 0)

  const addManualMut = useMutation({
    mutationFn: async () => {
      if (!manualForm.label.trim()) throw new Error('Label is required')
      const amt = parseFloat(manualForm.amount)
      if (!(amt > 0)) throw new Error('Enter an amount greater than 0')
      const { error } = await supabase.from('payment_plan_manual_items').insert({
        label: manualForm.label.trim(), amount: amt, direction: manualForm.direction, due_date: manualForm.due_date || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Added')
      setManualForm({ label: '', amount: '', direction: 'payable', due_date: today() })
      qc.invalidateQueries({ queryKey: ['payment_plan_manual_items'] })
    },
    onError: (e: any) => toast.error(e.message),
  })
  const deleteManualMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_plan_manual_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment_plan_manual_items'] }),
    onError: (e: any) => toast.error(e.message),
  })

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === (payments?.length ?? 0)) {
      setSelected(new Set())
    } else {
      setSelected(new Set((payments ?? []).map((p: any) => p.id)))
    }
  }

  const selectedPayments = useMemo(() =>
    (payments ?? []).filter((p: any) => selected.has(p.id)),
    [payments, selected]
  )

  // Deducts paid_amount / advance_adjusted / discount_amount already settled
  // against a bill, so a part-paid or advance-adjusted bill never shows/exports
  // its full amount as still owed (real overpayment risk otherwise).
  const netPayable = (p: any) =>
    Math.max(0, (p.net_payable ?? (p.invoice_amount ?? 0)) - (p.discount_amount ?? 0) - (p.paid_amount ?? 0) - (p.advance_adjusted ?? 0))

  const totalSelected = selectedPayments.reduce((s: number, p: any) =>
    s + netPayable(p), 0)

  const totalReceivable = (receivables ?? []).reduce((s, r) => s + r.amount, 0)

  const markPaidMut = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected)
      const isCash = markPaidForm.account_type.toLowerCase() === 'cash'
      if (!isCash && !markPaidForm.bank_account_id) {
        throw new Error('Select which bank account this is paid from, or it won\'t be recorded in any ledger')
      }
      const totalDisc = parseFloat(markPaidForm.discount_amount) || 0
      // Previously the FULL discount was written to every selected row
      // ("applied equally" was only a UI hint, not the actual behavior) —
      // split it evenly across the rows instead.
      const discPerRow = ids.length > 0 ? totalDisc / ids.length : 0
      const cbMode = isCash ? 'cash' : markPaidForm.account_type.toLowerCase() === 'upi' ? 'upi'
        : ['neft','rtgs','imps'].includes(markPaidForm.account_type.toLowerCase()) ? markPaidForm.account_type.toLowerCase() : 'cheque'

      for (const id of ids) {
        const row = (selectedPayments as any[]).find(p => p.id === id)
        // Consistent with Export CMS's payable figure — start from the same
        // already-settled-aware balance, then apply this modal's own discount.
        const netAmt = Math.max(0, (row ? netPayable(row) : 0) - discPerRow)
        const { error } = await supabase.from('pending_payments').update({
          payment_status: 'Paid',
          // Record the settled amount too — flipping only the status flag
          // left the Paid column blank and a stale Balance on the list
          paid_amount: netAmt,
          paid_date: markPaidForm.paid_date,
          utr_no: markPaidForm.utr_no || null,
          account_type: markPaidForm.account_type,
          bank_account_id: isCash ? null : markPaidForm.bank_account_id,
          discount_amount: discPerRow > 0 ? discPerRow : null,
          discount_reason: markPaidForm.discount_reason || null,
        }).eq('id', id)
        if (error) throw error

        // Mark Paid here previously wrote no Cash Book/Bank Ledger entry at
        // all — post one now, same as every other "mark paid" flow.
        await supabase.from('cash_book').delete().eq('pending_payment_id', id)
        await supabase.from('bank_transactions').delete().eq('linked_payment_id', id)
        if (netAmt > 0) {
          await supabase.from('cash_book').insert({
            txn_date: markPaidForm.paid_date, txn_type: 'payment', category: 'purchase_payment',
            description: `Payment to ${row?.vendor_name ?? ''}${row?.invoice_no ? ' — Inv ' + row.invoice_no : ''}`,
            party_name: row?.vendor_name ?? null, amount_in: 0, amount_out: netAmt,
            payment_mode: cbMode, reference_no: markPaidForm.utr_no || null,
            pending_payment_id: id,
          })
          if (!isCash && markPaidForm.bank_account_id) {
            await supabase.from('bank_transactions').insert({
              bank_account_id: markPaidForm.bank_account_id, txn_date: markPaidForm.paid_date, txn_type: 'Debit',
              category: 'Vendor Payment', reference_no: markPaidForm.utr_no || null,
              description: `Payment to ${row?.vendor_name ?? ''}${row?.invoice_no ? ' — Inv ' + row.invoice_no : ''}`,
              amount: netAmt, linked_payment_id: id,
            })
          }
        }
      }
    },
    onSuccess: () => {
      toast.success(`${selected.size} payment(s) marked as Paid`)
      setSelected(new Set())
      setMarkPaidOpen(false)
      qc.invalidateQueries({ queryKey: ['pending_payments_plan'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      qc.invalidateQueries({ queryKey: ['bank_transactions'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const kotakBal = kotakBalance?.balance ?? 0
  const cashBal  = cashBalance ?? 0
  const balanceAfter = kotakBal - totalSelected - selectedManualPayable + selectedManualReceivable

  const exportCMS = () => {
    if (!selectedPayments.length) { toast.error('Select payments to export'); return }

    const wb = XLSX.utils.book_new()
    const rows: any[][] = [
      [COMPANY_NAME],
      [COMPANY_ADDR1],
      [COMPANY_ADDR2],
      ['Requset for RTGS & NEFT Transfer'],
      ['Remitter Account :', '', '', '            '],
      ['DATE','PYMT TYPE','','NAME OF THE BENEFICIARY','BENEFICIARY BANK NAME','BRANCH NAME','BRANCH IFSC','CA/SB BANK ACC NO','AMOUNT RS.','DISCOUNT/OTHER DEDUCATION','PAYABLE AMOUNT','UNIT/ BRANCH','PAYMENT REFERANCES','GRN NO','GRN DATE'],
    ]

    for (const p of selectedPayments) {
      const party = partiesMap?.[p.vendor_name] ?? {}
      const tdsAmt = p.tds_amount ?? 0
      const discAmt = p.discount_amount ?? 0
      const grossAmt = p.invoice_amount ?? 0
      // Same corrected formula as CMSUpload.tsx — subtract discount AND
      // whatever's already been settled (paid_amount / advance_adjusted),
      // so a part-paid or advance-adjusted bill never exports its full amount.
      const payable = netPayable(p)
      rows.push([
        new Date(planDate),
        p.payment_type ?? 'NEFT',
        '',
        p.vendor_name,
        party.bank_name ?? '',
        party.branch ?? '',
        party.ifsc ?? '',
        party.account_no ?? '',
        grossAmt,
        tdsAmt + discAmt,
        payable,
        p.po_raised_by ?? 'Hyderabad',
        p.payment_reference ?? p.po_no ?? '',
        p.grn_no ?? '-',
        p.grn_date ? new Date(p.grn_date) : '-',
      ])
    }

    // Totals row
    const dataRowCount = selectedPayments.length
    const firstDataRow = 7
    const lastDataRow = firstDataRow + dataRowCount - 1
    rows.push([
      '', '', '',
      'TOTAL AMOUNT', '', '', '', '',
      { f: `SUM(I${firstDataRow}:I${lastDataRow})` },
      { f: `SUM(J${firstDataRow}:J${lastDataRow})` },
      { f: `SUM(K${firstDataRow}:K${lastDataRow})` },
      '', '', '', '',
    ])

    const ws = XLSX.utils.aoa_to_sheet(rows)

    // Column widths
    ws['!cols'] = [
      {wch:12},{wch:10},{wch:2},{wch:30},{wch:22},{wch:18},{wch:14},{wch:20},
      {wch:14},{wch:20},{wch:14},{wch:14},{wch:22},{wch:10},{wch:12}
    ]

    // Format date cells in column A (rows 7+)
    for (let i = 0; i < dataRowCount; i++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 6 + i, c: 0 })
      if (ws[cellAddr]) ws[cellAddr].t = 'd'
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    const dateStr = planDate.replace(/-/g, '')
    XLSX.writeFile(wb, `Payments${dateStr}.xlsx`)
    toast.success(`CMS file exported — ${selectedPayments.length} payments`)
  }

  // Days between two YYYY-MM-DD dates
  const daysBetween = (from: string, to: string) => {
    const a = new Date(from + 'T00:00:00'), b = new Date(to + 'T00:00:00')
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))
  }

  const handlePrint = () => {
    if (!selectedPayments.length && !selectedManualItems.length) { toast.error('Select payments to print'); return }
    const totals = selectedPayments.reduce((acc: any, p: any) => {
      const invoice = p.invoice_amount ?? 0
      const payable = netPayable(p)
      acc.invoice += invoice
      acc.discTds += invoice - payable
      acc.payable += payable
      return acc
    }, { invoice: 0, discTds: 0, payable: 0 })
    // Selected Manual Items (payable ones) are folded into the printed
    // totals/balance too — receivable manual items instead fold into Need to
    // Receive below, not this payable total.
    totals.invoice += selectedManualPayable
    totals.payable += selectedManualPayable

    const rows = selectedPayments.map((p: any, i: number) => {
      const party = partiesMap?.[p.vendor_name] ?? {}
      const code = party.account_no ? String(party.account_no).slice(-4) : ''
      const invoice = p.invoice_amount ?? 0
      const payable = netPayable(p)
      return {
        sno: i + 1,
        vendor_name: `${p.vendor_name}${code ? ' - ' + code : ''}`,
        credit_limit_days: p.credit_limit ?? 0,
        invoice_amount: invoice,
        payable_amount: payable,
        disc_tds: invoice - payable,
        grn_date: p.grn_date ?? null,
        invoice_date: p.invoice_date ?? null,
        days: p.grn_date ? daysBetween(p.grn_date, planDate) : '',
      }
    })
    const manualPayableRows = selectedManualItems.filter((m: any) => m.direction === 'payable').map((m: any, i: number) => ({
      sno: rows.length + i + 1,
      vendor_name: `${m.label} (manual)`,
      credit_limit_days: 0,
      invoice_amount: m.amount ?? 0,
      payable_amount: m.amount ?? 0,
      disc_tds: 0,
      grn_date: null,
      invoice_date: null,
      days: '',
    }))

    printPaymentPlanning({
      planDate,
      rows: [...rows, ...manualPayableRows],
      totals,
      bankBalance: kotakBal,
      bankBalanceAfter: kotakBal - totals.payable + selectedManualReceivable,
      needToReceive: totalReceivable + selectedManualReceivable,
    })
  }

  const overdue = (payments ?? []).filter((p: any) => p.pay_before_date && p.pay_before_date < today())
  const dueToday = (payments ?? []).filter((p: any) => p.pay_before_date === today())

  return (
    <div className="space-y-4">
      <CardHeader
        title="Daily Payment Planning"
        subtitle="Select pending payments, review bank balance, export CMS file"
        action={
          <div className="flex items-center gap-3">
            <DateInput value={planDate} onChange={e => setPlanDate(e.target.value)} />
            {selected.size > 0 && (
              <Button variant="secondary" icon={<CheckCircle size={16} />} onClick={() => { setMarkPaidForm({ paid_date: planDate, utr_no: '', discount_amount: '0', discount_reason: '', account_type: 'Online', bank_account_id: '' }); setMarkPaidOpen(true) }}>
                Mark Paid ({selected.size})
              </Button>
            )}
            <Button variant="outline" icon={<Printer size={16} />} onClick={handlePrint} disabled={selected.size === 0 && selectedManual.size === 0}>
              Print
            </Button>
            <Button icon={<Download size={16} />} onClick={exportCMS} disabled={selected.size === 0}>
              Export CMS ({selected.size})
            </Button>
          </div>
        }
      />

      {/* Balance Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard
          title="Kotak Balance"
          value={inr(kotakBal)}
          icon={<IndianRupee size={18} />}
          color="blue"
        />
        <StatCard
          title="Cash / Imprest"
          value={inr(cashBal)}
          icon={<IndianRupee size={18} />}
          color="green"
        />
        <StatCard
          title="Pending Receivable"
          value={inr(totalReceivable)}
          icon={<TrendingUp size={18} />}
          color="purple"
        />
        <StatCard
          title={`Balance After (${selected.size + selectedManual.size} selected)`}
          value={inr(balanceAfter)}
          icon={<TrendingDown size={18} />}
          color={balanceAfter < 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Manual Items (Net)"
          value={inr(manualReceivable - manualPayable)}
          icon={<IndianRupee size={18} />}
          color={manualReceivable - manualPayable < 0 ? 'red' : 'gray'}
        />
      </div>

      {/* Manual Items — ad-hoc payables/receivables with no bill yet */}
      <Card padding={false}>
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Manual Items — not yet a bill/salary/advance entry</h3>
          <p className="text-xs text-gray-400 mt-0.5">e.g. a pending salary for one employee, or an advance you know you'll pay soon. Delete this once the real entry is made in Salary / Advances / Pending Payments.</p>
        </div>
        <div className="p-3 flex flex-wrap items-end gap-2 border-b border-gray-100">
          <div className="flex-1 min-w-[160px]">
            <Input label="Label" value={manualForm.label} onChange={e => setManualForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. June salary — Ramesh" />
          </div>
          <div className="w-32">
            <Input label="Amount" type="number" value={manualForm.amount} onChange={e => setManualForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
          </div>
          <div className="w-36">
            <Select label="Type" value={manualForm.direction} onChange={e => setManualForm(f => ({ ...f, direction: (e.target as HTMLSelectElement).value }))}
              options={[{ value: 'payable', label: 'Payable (owed by us)' }, { value: 'receivable', label: 'Receivable (owed to us)' }]} />
          </div>
          <div className="w-36">
            <DateInput label="Due Date" value={manualForm.due_date} onChange={e => setManualForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <Button icon={<Plus size={14} />} loading={addManualMut.isPending} onClick={() => addManualMut.mutate()}>Add</Button>
        </div>
        {(manualItems?.length ?? 0) > 0 && (
          <>
            {selectedManual.size > 0 && (
              <div className="px-4 py-1.5 bg-brand-50 text-xs text-brand-700">
                {selectedManual.size} manual item(s) selected — included in Balance After above (not in Mark Paid / Export CMS)
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <thead><tr>
                  <Th></Th><Th>Label</Th><Th>Type</Th><Th>Due Date</Th><Th right>Amount</Th><Th></Th>
                </tr></thead>
                <tbody>
                  {(manualItems ?? []).map((m: any) => (
                    <tr key={m.id}
                      onClick={() => toggleManual(m.id)}
                      className={`cursor-pointer transition-colors ${selectedManual.has(m.id) ? 'bg-brand-50 border-l-2 border-brand-500' : 'hover:bg-gray-50'}`}
                    >
                      <Td>
                        <input type="checkbox" checked={selectedManual.has(m.id)} onChange={() => toggleManual(m.id)}
                          onClick={e => e.stopPropagation()}
                          className="rounded border-gray-300 text-brand-600" />
                      </Td>
                      <Td>{m.label}</Td>
                      <Td><Badge color={m.direction === 'payable' ? 'red' : 'green'}>{m.direction === 'payable' ? 'Payable' : 'Receivable'}</Badge></Td>
                      <Td className="text-xs">{m.due_date ? fmtDate(m.due_date) : '—'}</Td>
                      <Td right className={m.direction === 'payable' ? 'text-red-600 font-medium' : 'text-green-700 font-medium'}>{inr(m.amount)}</Td>
                      <Td>
                        <button onClick={e => { e.stopPropagation(); deleteManualMut.mutate(m.id) }} className="text-gray-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </Card>

      {/* Alert banners */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 flex items-center gap-2">
          <Clock size={14} /> <strong>{overdue.length} overdue payment(s)</strong> — past due date
        </div>
      )}
      {dueToday.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700 flex items-center gap-2">
          <Clock size={14} /> <strong>{dueToday.length} payment(s) due today</strong>
        </div>
      )}

      {/* Pending Receivables */}
      {(receivables?.length ?? 0) > 0 && (
        <Card padding={false}>
          <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
            <h3 className="font-semibold text-purple-800 text-sm">Pending Receivables — {inr(totalReceivable)}</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th>Type</Th><Th>Date</Th><Th>Party</Th><Th>Flock</Th><Th right>Amount</Th>
              </tr></thead>
              <tbody>
                {(receivables ?? []).slice(0, 10).map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <Td><Badge color="blue">{r.type}</Badge></Td>
                    <Td className="text-xs">{fmtDate(r.date)}</Td>
                    <Td>{r.party}</Td>
                    <Td className="text-xs">{r.flock ? `F-${r.flock}` : '—'}</Td>
                    <Td right className="font-medium text-purple-700">{inr(r.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pending Payments */}
      <Card padding={false}>
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Pending Payments</h3>
            {selected.size > 0 && (
              <p className="text-xs text-brand-600 mt-0.5">
                {selected.size} selected — Total: <strong>{inr(totalSelected)}</strong> — Balance after: <strong className={balanceAfter < 0 ? 'text-red-600' : 'text-green-600'}>{inr(balanceAfter)}</strong>
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={selectAll}>
            {selected.size === (payments?.length ?? 0) ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
        {paymentsLoading ? (
          <div className="p-8 text-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th></Th>
                <Th>Vendor</Th>
                <Th>Type</Th>
                <Th>Reference</Th>
                <Th>GRN</Th>
                <Th right>Invoice Amt</Th>
                <Th right>TDS</Th>
                <Th right>Net Payable</Th>
                <Th>Due Date</Th>
                <Th>Status</Th>
              </tr></thead>
              <tbody>
                {(payments ?? []).map((p: any) => {
                  const isSelected = selected.has(p.id)
                  const isOD = p.pay_before_date && p.pay_before_date < today()
                  const isDue = p.pay_before_date === today()
                  return (
                    <tr key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-brand-50 border-l-2 border-brand-500' : 'hover:bg-gray-50'}`}
                    >
                      <Td>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)}
                          onClick={e => e.stopPropagation()}
                          className="rounded border-gray-300 text-brand-600" />
                      </Td>
                      <Td>
                        <span className="font-medium text-sm">{p.vendor_name}</span>
                        {partiesMap?.[p.vendor_name]?.bank_name && <span className="block text-xs text-gray-400">{partiesMap[p.vendor_name].bank_name}</span>}
                      </Td>
                      <Td><Badge color="blue">{p.payment_type ?? 'NEFT'}</Badge></Td>
                      <Td className="text-xs">{p.po_no ?? p.invoice_no ?? '—'}</Td>
                      <Td className="text-xs">{p.grn_no ?? '—'}</Td>
                      <Td right>{p.invoice_amount ? inr(p.invoice_amount) : '—'}</Td>
                      <Td right className="text-xs text-orange-600">{(p.tds_amount ?? 0) > 0 ? inr(p.tds_amount) : '—'}</Td>
                      <Td right className="font-semibold">{inr(netPayable(p))}</Td>
                      <Td>
                        <span className={`text-xs font-medium ${isOD ? 'text-red-600' : isDue ? 'text-amber-600' : 'text-gray-500'}`}>
                          {p.pay_before_date ? fmtDate(p.pay_before_date) : '—'}
                          {isOD && ' ⚠️'}
                        </span>
                      </Td>
                      <Td><Badge color={p.payment_status === 'HOLD' ? 'orange' : 'gray'}>{p.payment_status}</Badge></Td>
                    </tr>
                  )
                })}
                {!(payments?.length) && (
                  <tr><td colSpan={10} className="text-center py-8 text-gray-400 text-sm">No pending payments</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
      <Modal open={markPaidOpen} onClose={() => setMarkPaidOpen(false)} title={`Mark ${selected.size} Payment(s) as Paid`} size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setMarkPaidOpen(false)}>Cancel</Button>
          <Button icon={<CheckCircle size={14}/>} loading={markPaidMut.isPending} onClick={() => markPaidMut.mutate()}>Confirm Payment</Button>
        </>}>
        <div className="space-y-3 text-sm">
          <p className="text-gray-600">Total being marked paid: <strong className="text-green-700">{inr(totalSelected)}</strong></p>
          <div className="grid grid-cols-2 gap-3">
            <DateInput label="Paid Date" value={markPaidForm.paid_date} onChange={(e: any) => setMarkPaidForm(f => ({ ...f, paid_date: e.target.value }))} />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Account Type</label>
              <select value={markPaidForm.account_type} onChange={e => setMarkPaidForm(f => ({ ...f, account_type: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                {['Online','NEFT','RTGS','IMPS','Cash','Cheque'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <Input label="UTR / Reference No" value={markPaidForm.utr_no} onChange={e => setMarkPaidForm(f => ({ ...f, utr_no: e.target.value }))} placeholder="NEFT/RTGS UTR or bank reference" />
          {markPaidForm.account_type.toLowerCase() !== 'cash' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Paid From Bank Account</label>
              <select value={markPaidForm.bank_account_id} onChange={e => setMarkPaidForm(f => ({ ...f, bank_account_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="">— Select account —</option>
                {(bankAccountsList ?? []).map((b: any) => (
                  <option key={b.id} value={b.id}>{b.account_name ? `${b.account_name} — ` : ''}{b.bank_name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Discount / Deduction (₹)" type="number" value={markPaidForm.discount_amount} onChange={e => setMarkPaidForm(f => ({ ...f, discount_amount: e.target.value }))} hint={`Split evenly across the ${selected.size} selected`} />
            <Input label="Discount Reason" value={markPaidForm.discount_reason} onChange={e => setMarkPaidForm(f => ({ ...f, discount_reason: e.target.value }))} placeholder="Rate diff, short wt, etc." />
          </div>
        </div>
      </Modal>
    </div>
  )
}
