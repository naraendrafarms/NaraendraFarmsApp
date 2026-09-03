import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today, fmtDate, friendlyDbError } from '@/lib/utils'
import {
  Card, CardHeader, Select, Spinner, EmptyState, DateInput,
  Table, Th, Td, Badge, Button,
} from '@/components/ui'
import { Download, Tag } from 'lucide-react'
import { moduleLevel } from '@/lib/auth'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

// Sale receipts that have not been assigned to an imprest.
//
// A sale can settle in more than one way at once: payment_cash goes to the cash
// book, payment_online goes to the bank ledger, and an employee sale can be
// deducted from salary instead. Only the CASH part can belong to an imprest --
// an imprest is the physical cash a person is carrying, and an online receipt
// never touches it. The bank leg is shown beside each row so a split payment is
// visible rather than looking like a missing amount.
//
// Tagging derives the imprest from the SALE'S OWN SITE, so it is a derivation
// and not a guess. Rows whose sale has no site, or whose site has no imprest,
// are listed but cannot be tagged, and say so.

const rupee = (n: number) =>
  Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const ImprestTagging: React.FC = () => {
  const qc = useQueryClient()
  const canEdit = moduleLevel('accounts') === 'full'

  const [from, setFrom] = useState('2025-01-01')
  const [to, setTo] = useState(today())
  const [siteFilter, setSiteFilter] = useState('')
  const [onlyUntagged, setOnlyUntagged] = useState('yes')

  const { data: accounts } = useQuery({
    queryKey: ['cash_accounts_active'],
    queryFn: async () => {
      const { data } = await supabase.from('cash_accounts')
        .select('id,name,acct_type,farm_id').eq('is_active', true).order('sort_order')
      return data ?? []
    },
  })

  const { data: rows, isLoading } = useQuery({
    queryKey: ['imprest_tagging', from, to, siteFilter, onlyUntagged],
    queryFn: async () => {
      let q = supabase.from('cash_book')
        .select('id,txn_date,description,party_name,reference_no,amount_in,payment_mode,cash_account_id,nhe_sale_id,' +
                'nhe_sales(id,sale_type,dc_no,quantity,rate,amount,payment_cash,payment_online,is_employee_sale,farm_id,farms(name),flocks(flock_no))')
        .not('nhe_sale_id', 'is', null)
        .gte('txn_date', from).lte('txn_date', to)
        .order('txn_date')
      if (onlyUntagged === 'yes') q = q.is('cash_account_id', null)
      const { data, error } = await q
      if (error) throw error
      let out = data ?? []
      if (siteFilter) out = out.filter((r: any) => r.nhe_sales?.farm_id === siteFilter)
      return out
    },
  })

  // Which imprest each row WOULD be tagged to, from the sale's own site.
  const imprestForFarm = useMemo(() => {
    const m: Record<string, any> = {}
    for (const a of (accounts ?? []) as any[]) if (a.farm_id) m[a.farm_id] = a
    return m
  }, [accounts])

  const enriched = useMemo(() => (rows ?? []).map((r: any) => {
    const farmId = r.nhe_sales?.farm_id
    const target = farmId ? imprestForFarm[farmId] : null
    return { ...r, targetImprest: target ?? null }
  }), [rows, imprestForFarm])

  const taggable = enriched.filter((r: any) => !r.cash_account_id && r.targetImprest)
  const blocked = enriched.filter((r: any) => !r.cash_account_id && !r.targetImprest)
  const totalCash = enriched.reduce((a: number, r: any) => a + Number(r.amount_in ?? 0), 0)
  const totalOnline = enriched.reduce((a: number, r: any) => a + Number(r.nhe_sales?.payment_online ?? 0), 0)

  const sites = useMemo(() => {
    const m: Record<string, string> = {}
    for (const r of (rows ?? []) as any[]) {
      if (r.nhe_sales?.farm_id) m[r.nhe_sales.farm_id] = r.nhe_sales?.farms?.name ?? '?'
    }
    return Object.entries(m).map(([id, name]) => ({ value: id, label: name }))
  }, [rows])

  const exportXlsx = () => {
    const out = enriched.map((r: any) => ({
      'Receipt Date': fmtDate(r.txn_date),
      Site: r.nhe_sales?.farms?.name ?? '(no site)',
      Flock: r.nhe_sales?.flocks?.flock_no ?? '',
      'Sale Type': r.nhe_sales?.sale_type ?? '',
      'DC No': r.nhe_sales?.dc_no ?? r.reference_no ?? '',
      Party: r.party_name ?? '',
      'Employee Sale': r.nhe_sales?.is_employee_sale ? 'Yes' : 'No',
      Quantity: r.nhe_sales?.quantity ?? '',
      Rate: r.nhe_sales?.rate ?? '',
      'Sale Amount': Number(r.nhe_sales?.amount ?? 0),
      'Cash Received': Number(r.amount_in ?? 0),
      'Online to Bank': Number(r.nhe_sales?.payment_online ?? 0),
      Mode: r.payment_mode ?? '',
      Description: r.description ?? '',
      'Current Imprest': r.cash_account_id
        ? (accounts ?? []).find((a: any) => a.id === r.cash_account_id)?.name ?? 'tagged'
        : '(untagged)',
      'Would Tag To': r.targetImprest?.name ?? 'NO IMPREST FOR THIS SITE',
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(out), 'Sale Receipts')
    XLSX.writeFile(wb, `sale-receipts-imprest-${from}-to-${to}.xlsx`)
  }

  const tagMut = useMutation({
    mutationFn: async () => {
      if (!taggable.length) throw new Error('Nothing to tag in this range')
      // Grouped by target imprest so this is a handful of updates rather than
      // one per row, and each update names the exact ids it touches.
      const byAccount: Record<string, string[]> = {}
      for (const r of taggable) {
        (byAccount[r.targetImprest.id] ||= []).push(r.id)
      }
      for (const [acctId, ids] of Object.entries(byAccount)) {
        const { error } = await supabase.from('cash_book')
          .update({ cash_account_id: acctId }).in('id', ids)
        if (error) throw new Error(friendlyDbError(error))
      }
      return taggable.length
    },
    onSuccess: (n) => {
      toast.success(`Tagged ${n} receipt${n === 1 ? '' : 's'} to their site imprest`)
      qc.invalidateQueries({ queryKey: ['imprest_tagging'] })
      qc.invalidateQueries({ queryKey: ['cash_account_balances'] })
      qc.invalidateQueries({ queryKey: ['imprest_ledger'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <CardHeader
        title="Sale Receipts → Imprest Tagging"
        subtitle="Cash received from NHE sales, and which imprest it belongs to. Only the cash part of a sale can sit in an imprest — the online part is bank."
        action={enriched.length
          ? <Button variant="outline" icon={<Download size={16} />} onClick={exportXlsx}>Export to Excel</Button>
          : undefined} />

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <DateInput label="From" value={from} onChange={e => setFrom(e.target.value)} />
          <DateInput label="To" value={to} onChange={e => setTo(e.target.value)} />
          <Select label="Site" value={siteFilter}
            onChange={e => setSiteFilter((e.target as HTMLSelectElement).value)}
            options={[{ value: '', label: 'All sites' }, ...sites]} />
          <Select label="Show" value={onlyUntagged}
            onChange={e => setOnlyUntagged((e.target as HTMLSelectElement).value)}
            options={[{ value: 'yes', label: 'Untagged only' }, { value: 'no', label: 'All sale receipts' }]} />
        </div>
      </Card>

      {isLoading ? <Spinner /> : enriched.length === 0 ? (
        <EmptyState title="No sale receipts in this range"
          subtitle="Widen the dates, or switch Show to all sale receipts." />
      ) : (
        <Card padding={false}>
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <span className="text-gray-500">Rows <strong className="text-gray-800">{enriched.length}</strong></span>
            <span className="text-gray-500">Cash <strong className="text-green-700">₹{rupee(totalCash)}</strong></span>
            {totalOnline > 0 && (
              <span className="text-gray-500">Online to bank <strong className="text-blue-700">₹{rupee(totalOnline)}</strong>
                <span className="text-gray-400"> — not imprest</span></span>
            )}
            <span className="text-gray-500">Taggable <strong className="text-gray-800">{taggable.length}</strong></span>
            {blocked.length > 0 && (
              <span className="text-amber-600">{blocked.length} cannot be tagged — no imprest for their site</span>
            )}
            {canEdit && taggable.length > 0 && (
              <Button size="sm" icon={<Tag size={14} />} loading={tagMut.isPending}
                onClick={() => tagMut.mutate()}>
                Tag {taggable.length} to site imprest
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th>Date</Th><Th>Site</Th><Th>Flock</Th><Th>Type</Th><Th>DC No</Th>
                <Th>Party</Th><Th right>Sale Amt</Th><Th right>Cash</Th><Th right>Online</Th>
                <Th>Imprest</Th>
              </tr></thead>
              <tbody>
                {enriched.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <Td>{fmtDate(r.txn_date)}</Td>
                    <Td>{r.nhe_sales?.farms?.name ?? <span className="text-amber-600">no site</span>}</Td>
                    <Td className="text-xs text-gray-500">{r.nhe_sales?.flocks?.flock_no ?? ''}</Td>
                    <Td><Badge color="gray">{r.nhe_sales?.sale_type ?? ''}</Badge></Td>
                    <Td className="text-xs text-gray-500">{r.nhe_sales?.dc_no ?? r.reference_no ?? ''}</Td>
                    <Td className="text-xs">{r.party_name ?? ''}
                      {r.nhe_sales?.is_employee_sale && <Badge color="blue">staff</Badge>}</Td>
                    <Td right className="text-gray-500">₹{rupee(r.nhe_sales?.amount ?? 0)}</Td>
                    <Td right className="text-green-700"><strong>₹{rupee(r.amount_in)}</strong></Td>
                    <Td right className="text-blue-700">
                      {Number(r.nhe_sales?.payment_online ?? 0) > 0 ? '₹' + rupee(r.nhe_sales.payment_online) : ''}
                    </Td>
                    <Td className="text-xs">
                      {r.cash_account_id
                        ? <Badge color="green">{(accounts ?? []).find((a: any) => a.id === r.cash_account_id)?.name ?? 'tagged'}</Badge>
                        : r.targetImprest
                          ? <span className="text-gray-500">→ {r.targetImprest.name}</span>
                          : <span className="text-amber-600">no imprest for site</span>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
            A sale can settle more than one way at once — cash to the cash book, online to the bank
            ledger, or deducted from salary. Only the CASH column can belong to an imprest; the
            Online column is shown so a split payment is visible rather than looking like a shortfall.
            Tagging uses the sale's own site, so it is derived and not guessed.
          </div>
        </Card>
      )}
    </div>
  )
}
