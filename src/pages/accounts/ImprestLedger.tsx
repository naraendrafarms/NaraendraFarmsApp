import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today, fmtDate } from '@/lib/utils'
import {
  Card, CardHeader, Select, Spinner, EmptyState, DateInput,
  Table, Th, Td, Badge, Button,
} from '@/components/ui'
import { Download, Wallet } from 'lucide-react'
import * as XLSX from 'xlsx'

// Each imprest account as its own cash book: every entry it holds, in date
// order, with a running balance.
//
// READ ONLY. Entries are made on the Cash Book screen as they always were;
// this only reads them back per holder. It answers the question the cash book
// could never answer -- "what has Srinath been given, what has he spent, and
// what is he holding?" -- because until now nothing recorded WHICH cash box a
// transaction moved through.
//
// The opening balance comes from the account master. The running balance starts
// there and moves with each entry, so the last row is the account's balance
// today and matches the card on Masters -> Cash Imprest Accounts.

const rupee = (n: number) =>
  Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TYPE_COLOR: Record<string, any> = { receipt: 'green', payment: 'red', contra: 'blue' }

export const ImprestLedger: React.FC = () => {
  const [acctId, setAcctId] = useState('')
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(today())

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

  const { data: rows, isLoading } = useQuery({
    queryKey: ['imprest_ledger', acctId, from, to],
    enabled: !!acctId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_book')
        .select('id,txn_date,txn_type,category,description,party_name,reference_no,amount_in,amount_out,payment_mode,farm_id,farms(name)')
        .eq('cash_account_id', acctId)
        .gte('txn_date', from).lte('txn_date', to)
        .order('txn_date').order('created_at')
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
      const { data } = await supabase
        .from('cash_book').select('amount_in,amount_out')
        .eq('cash_account_id', acctId).lt('txn_date', from)
      return (data ?? []).reduce(
        (a: number, r: any) => a + Number(r.amount_in ?? 0) - Number(r.amount_out ?? 0), 0)
    },
  })

  const openingForPeriod = Number(acct?.opening_balance ?? 0) + Number(priorNet ?? 0)

  const withBalance = useMemo(() => {
    let bal = openingForPeriod
    return (rows ?? []).map((r: any) => {
      bal += Number(r.amount_in ?? 0) - Number(r.amount_out ?? 0)
      return { ...r, running: bal }
    })
  }, [rows, openingForPeriod])

  const totIn = (rows ?? []).reduce((a: number, r: any) => a + Number(r.amount_in ?? 0), 0)
  const totOut = (rows ?? []).reduce((a: number, r: any) => a + Number(r.amount_out ?? 0), 0)
  const closing = openingForPeriod + totIn - totOut

  const exportXlsx = () => {
    const out = withBalance.map((r: any) => ({
      Date: fmtDate(r.txn_date), Type: r.txn_type, Category: r.category ?? '',
      Description: r.description, Party: r.party_name ?? '',
      Site: r.farms?.name ?? '', Reference: r.reference_no ?? '',
      Received: Number(r.amount_in ?? 0), Paid: Number(r.amount_out ?? 0),
      Balance: r.running, Mode: r.payment_mode ?? '',
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(out), 'Imprest Ledger')
    XLSX.writeFile(wb, `imprest-${(acct?.name ?? 'account').replace(/\s+/g, '-')}-${from}-to-${to}.xlsx`)
  }

  return (
    <div className="space-y-4">
      <CardHeader
        title="Imprest Ledger"
        subtitle="Each imprest account as its own cash book — what came in, what went out, what is held"
        action={withBalance.length
          ? <Button variant="outline" icon={<Download size={16} />} onClick={exportXlsx}>Export</Button>
          : undefined} />

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
            <span className="text-gray-400">{fmtDate(from)} – {fmtDate(to)}</span>
          </div>

          {withBalance.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No entries for this account in this period"
                subtitle="Cash book entries appear here once they are tagged to an imprest account. Existing entries were left untagged on purpose — they record which site bore the cost but never which cash box held the money, so tagging them would have invented balances. Tag new entries using the Imprest Account box on the Cash Book form." />
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
                    <tr key={r.id} className="hover:bg-gray-50">
                      <Td>{fmtDate(r.txn_date)}</Td>
                      <Td><Badge color={TYPE_COLOR[r.txn_type] ?? 'gray'}>{r.txn_type}</Badge></Td>
                      <Td className="text-xs text-gray-500">{r.category ?? ''}</Td>
                      <Td>{r.description}</Td>
                      <Td className="text-xs text-gray-500">{r.party_name ?? ''}</Td>
                      <Td className="text-xs text-gray-500">{r.farms?.name ?? ''}</Td>
                      <Td right className="text-green-700">{Number(r.amount_in) ? '₹' + rupee(r.amount_in) : ''}</Td>
                      <Td right className="text-red-700">{Number(r.amount_out) ? '₹' + rupee(r.amount_out) : ''}</Td>
                      <Td right><strong className={r.running < 0 ? 'text-red-600' : ''}>₹{rupee(r.running)}</strong></Td>
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
    </div>
  )
}
