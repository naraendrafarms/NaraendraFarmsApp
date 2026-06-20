import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate } from '@/lib/utils'
import { Card, Input, Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState } from '@/components/ui'

// Compares the rate we ordered at (latest PO) against the rate actually billed
// on each GRN, so over- or under-charging is easy to spot.
export const RateCompare: React.FC = () => {
  const [q, setQ] = useState('')
  const [onlyDiff, setOnlyDiff] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['v_po_grn_rate'],
    queryFn: async () => {
      const { data } = await supabase.from('v_po_grn_rate').select('*').order('grn_date', { ascending: false }).limit(500)
      return data ?? []
    },
  })

  const rows = (data ?? []).filter((r: any) => {
    if (q && !(`${r.item_name} ${r.vendor_name}`.toLowerCase().includes(q.toLowerCase()))) return false
    if (onlyDiff && (r.po_rate == null || Math.abs(Number(r.rate_diff || 0)) < 0.005)) return false
    return true
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="PO vs GRN Rate Check" subtitle="Did the supplier bill us at the rate we ordered?" />
      <Card>
        <div className="flex items-end gap-4 mb-3 flex-wrap">
          <Input label="" placeholder="Search item / vendor…" value={q} onChange={e => setQ(e.target.value)} className="max-w-xs" />
          <label className="flex items-center gap-2 text-sm text-gray-600 pb-2">
            <input type="checkbox" checked={onlyDiff} onChange={e => setOnlyDiff(e.target.checked)} />
            Only show mismatches
          </label>
        </div>
        {isLoading ? <Spinner /> : rows.length === 0 ? <EmptyState title="No rate differences found" /> : (
          <Table>
            <thead><tr>{['GRN', 'Date', 'Item', 'Vendor', 'PO Rate', 'GRN Rate', 'Diff'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {rows.map((r: any, i: number) => {
                const diff = Number(r.rate_diff || 0)
                return (
                  <tr key={i} className="border-t border-gray-100">
                    <Td>{r.grn_no}</Td>
                    <Td>{fmtDate(r.grn_date)}</Td>
                    <Td className="font-medium">{r.item_name}</Td>
                    <Td>{r.vendor_name ?? '—'}</Td>
                    <Td>{r.po_rate != null ? inr(r.po_rate, 2) : '— no PO'}</Td>
                    <Td>{r.grn_rate != null ? inr(r.grn_rate, 2) : '—'}</Td>
                    <Td>
                      {r.po_rate == null ? '—' : (
                        <Badge color={Math.abs(diff) < 0.005 ? 'green' : diff > 0 ? 'red' : 'blue'}>
                          {diff > 0 ? '+' : ''}{inr(diff, 2)}
                        </Badge>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}
