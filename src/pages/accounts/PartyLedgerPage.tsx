import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate, inr } from '@/lib/utils'
import {
  Card, Select, Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState, DateInput
} from '@/components/ui'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

type LedgerRow = {
  txn_date: string
  txn_type: string
  ref_no: string | null
  narration: string
  debit: number
  credit: number
  source_table: string
}

export const PartyLedgerPage: React.FC = () => {
  const [partyId, setPartyId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: parties = [] } = useQuery({
    queryKey: ['parties_all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('parties')
        .select('id,name,type')
        .eq('is_active', true)
        .order('name')
      return data ?? []
    }
  })

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['party_ledger', partyId, fromDate, toDate],
    queryFn: async () => {
      if (!partyId) return []
      let q = supabase
        .from('v_party_ledger')
        .select('txn_date,txn_type,ref_no,narration,debit,credit,source_table')
        .eq('party_id', partyId)
        .order('txn_date', { ascending: true })
      if (fromDate) q = q.gte('txn_date', fromDate)
      if (toDate) q = q.lte('txn_date', toDate)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as LedgerRow[]
    },
    enabled: !!partyId,
  })

  const ledger = useMemo(() => {
    let bal = 0
    return rows.map(r => {
      // debit = party owes us more (we billed them)
      // credit = reduces what party owes us (payment received / advance given)
      bal += (r.debit ?? 0) - (r.credit ?? 0)
      return { ...r, balance: bal }
    })
  }, [rows])

  const totalDebit = rows.reduce((s, r) => s + (r.debit ?? 0), 0)
  const totalCredit = rows.reduce((s, r) => s + (r.credit ?? 0), 0)
  const netBalance = totalDebit - totalCredit
  const selectedParty = (parties as any[]).find(p => p.id === partyId)

  const exportXlsx = () => {
    if (!ledger.length) return toast.error('No data to export')
    const ws = XLSX.utils.json_to_sheet(ledger.map(r => ({
      Date: fmtDate(r.txn_date),
      Type: r.txn_type,
      'Ref No': r.ref_no ?? '',
      Narration: r.narration,
      Debit: r.debit || '',
      Credit: r.credit || '',
      Balance: r.balance,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger')
    XLSX.writeFile(wb, `party_ledger_${selectedParty?.name ?? partyId}.xlsx`)
  }

  const typeColor = (t: string): 'green' | 'red' | 'blue' | 'gray' => {
    if (t.includes('Payment') || t.includes('Advance')) return 'green'
    if (t.includes('Sale') || t.includes('Dispatch')) return 'red'
    return 'blue'
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <SectionHeader
        title="Party Ledger"
        subtitle="Complete account statement for any buyer — sales billed, advances received, payments"
        action={
          ledger.length > 0 ? (
            <button
              onClick={exportXlsx}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Download size={14} /> Export Excel
            </button>
          ) : undefined
        }
      />

      {/* Filters */}
      <Card className="p-3 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Party *</label>
          <Select
            value={partyId}
            onChange={e => setPartyId(e.target.value)}
            options={[
              { value: '', label: '— Select Party —' },
              ...(parties as any[]).map(p => ({ value: p.id, label: `${p.name}${p.type ? ` (${p.type})` : ''}` }))
            ]}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From Date</label>
          <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To Date</label>
          <DateInput value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
      </Card>

      {/* Summary cards */}
      {partyId && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Total Billed (Dr)</div>
            <div className="text-lg font-bold text-red-600">{inr(totalDebit)}</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Total Paid / Advance (Cr)</div>
            <div className="text-lg font-bold text-green-700">{inr(totalCredit)}</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Net Balance (Receivable)</div>
            <div className={`text-lg font-bold ${netBalance > 0 ? 'text-orange-600' : 'text-green-700'}`}>
              {inr(Math.abs(netBalance))} {netBalance > 0 ? 'Dr' : netBalance < 0 ? 'Cr' : ''}
            </div>
          </Card>
        </div>
      )}

      {/* Ledger table */}
      <Card>
        {!partyId ? (
          <EmptyState title="Select a party to view their ledger" />
        ) : isLoading ? (
          <Spinner />
        ) : ledger.length === 0 ? (
          <EmptyState title="No transactions found for this party" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Ref No</Th>
                  <Th>Narration</Th>
                  <Th className="text-right">Debit (Dr)</Th>
                  <Th className="text-right">Credit (Cr)</Th>
                  <Th className="text-right">Balance</Th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <Td className="whitespace-nowrap">{fmtDate(r.txn_date)}</Td>
                    <Td>
                      <Badge color={typeColor(r.txn_type)}>
                        {r.txn_type}
                      </Badge>
                    </Td>
                    <Td className="text-xs text-gray-500">{r.ref_no ?? '—'}</Td>
                    <Td className="text-xs text-gray-600">{r.narration || '—'}</Td>
                    <Td className="text-right font-medium text-red-600">
                      {r.debit > 0 ? inr(r.debit) : '—'}
                    </Td>
                    <Td className="text-right font-medium text-green-700">
                      {r.credit > 0 ? inr(r.credit) : '—'}
                    </Td>
                    <Td className={`text-right font-bold ${r.balance > 0 ? 'text-orange-600' : r.balance < 0 ? 'text-green-700' : 'text-gray-500'}`}>
                      {inr(Math.abs(r.balance))} {r.balance > 0 ? 'Dr' : r.balance < 0 ? 'Cr' : ''}
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <Td colSpan={4} className="text-right text-sm">Totals</Td>
                  <Td className="text-right text-red-600">{inr(totalDebit)}</Td>
                  <Td className="text-right text-green-700">{inr(totalCredit)}</Td>
                  <Td className={`text-right ${netBalance > 0 ? 'text-orange-600' : 'text-green-700'}`}>
                    {inr(Math.abs(netBalance))} {netBalance > 0 ? 'Dr' : 'Cr'}
                  </Td>
                </tr>
              </tfoot>
            </Table>
          </div>
        )}
      </Card>

      {/* Legend */}
      <div className="text-xs text-gray-400 space-y-1 px-1">
        <p><span className="font-semibold text-red-500">Dr (Debit)</span> = Amount party owes you (sales billed to them)</p>
        <p><span className="font-semibold text-green-600">Cr (Credit)</span> = Amount reducing what they owe (payments received, advances given by them)</p>
        <p><span className="font-semibold text-orange-500">Balance Dr</span> = Party still owes you this amount</p>
        <p><span className="font-semibold text-green-600">Balance Cr</span> = You owe party this amount (over-payment / advance not yet adjusted)</p>
      </div>
    </div>
  )
}
