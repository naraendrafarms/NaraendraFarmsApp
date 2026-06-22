import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { Card, CardHeader, Button, DateInput, Spinner, Table, Th, Td, Badge, StatCard } from '@/components/ui'
import { Download, IndianRupee, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const COMPANY_NAME = 'Naraendra Farms'
const COMPANY_ADDR1 = '5-9-22/21 , JVR Amrit Enclave, Roshanlal Residency ,'
const COMPANY_ADDR2 = 'Adarsh Nagar , Hyderabad - 500063'

export const PaymentPlanningPage: React.FC = () => {
  const [planDate, setPlanDate] = useState(today())
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Kotak bank account balance (opening_balance + sum of credits - sum of debits)
  const { data: kotakBalance } = useQuery({
    queryKey: ['kotak_balance'],
    queryFn: async () => {
      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('id,bank_name,account_name,opening_balance')
        .ilike('bank_name', '%kotak%')
        .eq('is_active', true)
      if (!accounts?.length) return { balance: 0, accountId: null, accountNo: '' }
      const acc = accounts[0]
      const { data: txns } = await supabase
        .from('bank_transactions')
        .select('txn_type,amount')
        .eq('bank_account_id', acc.id)
      const credits = (txns ?? []).filter(t => t.txn_type === 'Credit').reduce((s, t) => s + (t.amount ?? 0), 0)
      const debits  = (txns ?? []).filter(t => t.txn_type === 'Debit').reduce((s, t) => s + (t.amount ?? 0), 0)
      const balance = (acc.opening_balance ?? 0) + credits - debits
      return { balance, accountId: acc.id, accountNo: (acc as any).account_no ?? '' }
    }
  })

  // Cash (Mandal Imprest) balance from cash_book
  const { data: cashBalance } = useQuery({
    queryKey: ['cash_balance'],
    queryFn: async () => {
      const { data } = await supabase.from('cash_book').select('txn_type,amount_in,amount_out')
      const inAmt  = (data ?? []).reduce((s, r) => s + (r.amount_in  ?? 0), 0)
      const outAmt = (data ?? []).reduce((s, r) => s + (r.amount_out ?? 0), 0)
      return inAmt - outAmt
    }
  })

  // Pending receivables (NHE + HE dispatch not yet received)
  const { data: receivables } = useQuery({
    queryKey: ['pending_receivables'],
    queryFn: async () => {
      const [nhe, he] = await Promise.all([
        supabase.from('nhe_sales')
          .select('id,sale_date,sale_type,amount,parties(name),flocks(flock_no)')
          .in('payment_status', ['Pending', null as any])
          .not('payment_status', 'eq', 'Received')
          .order('sale_date', { ascending: false })
          .limit(100),
        supabase.from('he_dispatch')
          .select('id,dispatch_date,amount,parties(name),flocks(flock_no)')
          .in('payment_status', ['Pending', null as any])
          .not('payment_status', 'eq', 'Received')
          .order('dispatch_date', { ascending: false })
          .limit(100),
      ])
      const nheRows = (nhe.data ?? []).map((r: any) => ({
        id: r.id, type: 'NHE', date: r.sale_date,
        party: r.parties?.name ?? '—', flock: r.flocks?.flock_no,
        amount: r.amount ?? 0,
      }))
      const heRows = (he.data ?? []).map((r: any) => ({
        id: r.id, type: 'HE', date: r.dispatch_date,
        party: r.parties?.name ?? '—', flock: r.flocks?.flock_no,
        amount: r.amount ?? 0,
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
        .select('*, parties(name,bank_name,account_no,ifsc,branch)')
        .in('payment_status', ['Pending', 'HOLD'])
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

  const totalSelected = selectedPayments.reduce((s: number, p: any) =>
    s + (p.net_payable ?? p.invoice_amount ?? 0), 0)

  const totalReceivable = (receivables ?? []).reduce((s, r) => s + r.amount, 0)

  const kotakBal = kotakBalance?.balance ?? 0
  const cashBal  = cashBalance ?? 0
  const balanceAfter = kotakBal - totalSelected

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
      const grossAmt = p.invoice_amount ?? 0
      const payable = p.net_payable ?? (grossAmt - tdsAmt)
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
        tdsAmt,
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

  const overdue = (payments ?? []).filter((p: any) => p.pay_before_date && p.pay_before_date < today())
  const dueToday = (payments ?? []).filter((p: any) => p.pay_before_date === today())

  return (
    <div className="space-y-4">
      <CardHeader
        title="Daily Payment Planning"
        subtitle="Select pending payments, review bank balance, export CMS file"
        action={
          <div className="flex items-center gap-3">
            <DateInput value={planDate} onChange={setPlanDate} />
            <Button icon={<Download size={16} />} onClick={exportCMS} disabled={selected.size === 0}>
              Export CMS ({selected.size})
            </Button>
          </div>
        }
      />

      {/* Balance Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          title={`Balance After (${selected.size} selected)`}
          value={inr(balanceAfter)}
          icon={<TrendingDown size={18} />}
          color={balanceAfter < 0 ? 'red' : 'green'}
        />
      </div>

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
                        {p.parties?.bank_name && <span className="block text-xs text-gray-400">{p.parties.bank_name}</span>}
                      </Td>
                      <Td><Badge color="blue">{p.payment_type ?? 'NEFT'}</Badge></Td>
                      <Td className="text-xs">{p.po_no ?? p.invoice_no ?? '—'}</Td>
                      <Td className="text-xs">{p.grn_no ?? '—'}</Td>
                      <Td right>{p.invoice_amount ? inr(p.invoice_amount) : '—'}</Td>
                      <Td right className="text-xs text-orange-600">{(p.tds_amount ?? 0) > 0 ? inr(p.tds_amount) : '—'}</Td>
                      <Td right className="font-semibold">{inr(p.net_payable ?? p.invoice_amount ?? 0)}</Td>
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
    </div>
  )
}
