import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate } from '@/lib/utils'
import { Card, Badge, Table, Th, Td, SectionHeader, Spinner, Button } from '@/components/ui'
import { Download, AlertTriangle } from 'lucide-react'

// What was actually received, flock by flock.
//
// The figures were always in the database — billed and free birds, the invoice
// they came on, the rate and the cost — but nowhere to READ them: paid and free
// sat in a hover tooltip on the flock cards, a grey caption on the flock page,
// and the invoice number only on the edit form. Anyone asking "how many
// breeder females did we actually get, and on which invoice" had to open a
// flock at a time and hover.
//
// One row per flock, totals at the bottom, and a warning where the placed
// figure does not equal billed plus free — because that difference is either a
// typo or a delivery nobody recorded, and both matter.

type Row = {
  id: string
  flock_no: string
  breed: string | null
  status: string
  placement_date: string | null
  supplier: string | null
  chick_invoice_no: string | null
  chick_invoice_date: string | null
  paid_female: number | null
  paid_male: number | null
  free_female: number | null
  free_male: number | null
  total_placed_f: number | null
  total_placed_m: number | null
  chick_rate: number | null
  chick_cost: number | null
}

const num = (v: number | null | undefined) =>
  v == null ? 0 : Number(v)

const show = (v: number | null | undefined) =>
  v == null || v === 0 ? '—' : Number(v).toLocaleString('en-IN')

export const ChickReceipts: React.FC = () => {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['chick_receipts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('flocks')
        .select('id,flock_no,breed,status,placement_date,supplier,chick_invoice_no,chick_invoice_date,' +
                'paid_female,paid_male,free_female,free_male,total_placed_f,total_placed_m,chick_rate,chick_cost')
        .order('placement_date', { ascending: false })
        .order('id')
      if (error) throw error
      return (data ?? []) as unknown as Row[]
    }
  })

  const calc = (r: Row) => {
    const billedF = num(r.paid_female), billedM = num(r.paid_male)
    const freeF = num(r.free_female), freeM = num(r.free_male)
    // The placed figure is what the flock is actually run on, so it is shown as
    // recorded rather than replaced by the sum.
    const totalF = r.total_placed_f ?? (billedF + freeF)
    const totalM = r.total_placed_m ?? (billedM + freeM)
    const sumF = billedF + freeF, sumM = billedM + freeM
    const mismatch = (sumF > 0 || sumM > 0) && (sumF !== num(totalF) || sumM !== num(totalM))
    return { billedF, billedM, freeF, freeM, totalF: num(totalF), totalM: num(totalM), mismatch }
  }

  const tot = (rows as Row[]).reduce((s, r) => {
    const c = calc(r)
    return {
      billedF: s.billedF + c.billedF, billedM: s.billedM + c.billedM,
      freeF: s.freeF + c.freeF, freeM: s.freeM + c.freeM,
      totalF: s.totalF + c.totalF, totalM: s.totalM + c.totalM,
      cost: s.cost + num(r.chick_cost),
    }
  }, { billedF: 0, billedM: 0, freeF: 0, freeM: 0, totalF: 0, totalM: 0, cost: 0 })

  const missing = (rows as Row[]).filter(r => num(r.paid_female) === 0 && num(r.free_female) === 0)
  const mismatched = (rows as Row[]).filter(r => calc(r).mismatch)

  const exportCSV = () => {
    const headers = ['Flock','Breed','Status','Placed on','Supplier','Invoice no','Invoice date',
      'Billed F','Billed M','Free F','Free M','Total F','Total M','Total birds','Rate','Cost']
    const lines = (rows as Row[]).map(r => {
      const c = calc(r)
      return [r.flock_no, r.breed ?? '', r.status, r.placement_date ?? '', r.supplier ?? '',
        r.chick_invoice_no ?? '', r.chick_invoice_date ?? '',
        c.billedF, c.billedM, c.freeF, c.freeM, c.totalF, c.totalM, c.totalF + c.totalM,
        r.chick_rate ?? '', r.chick_cost ?? '']
    })
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers.map(esc).join(','), ...lines.map(l => l.map(esc).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'chick_receipts.csv'
    a.click()
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-4">
      <SectionHeader title="Chick Receipts"
        subtitle="Breeder females and males received per flock — billed, free and total, against the invoice they came on."
        action={<Button variant="ghost" size="sm" icon={<Download size={15} />} onClick={exportCSV}>Export</Button>}
      />

      {(missing.length > 0 || mismatched.length > 0) && (
        <Card>
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-gray-700 space-y-1">
              {missing.length > 0 && (
                <p>
                  <strong>{missing.length}</strong> {missing.length === 1 ? 'flock has' : 'flocks have'} no
                  billed or free split recorded — only a placed total. Billed and free show as a dash there,
                  which means the figure was never entered, not that it was zero:{' '}
                  <span className="text-gray-500">{missing.map(f => `F${f.flock_no}`).join(', ')}</span>
                </p>
              )}
              {mismatched.length > 0 && (
                <p>
                  <strong>{mismatched.length}</strong> {mismatched.length === 1 ? 'flock does' : 'flocks do'} not
                  add up — billed plus free is not the placed figure:{' '}
                  <span className="text-gray-500">{mismatched.map(f => `F${f.flock_no}`).join(', ')}</span>
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card padding={false}>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Flock</Th><Th>Placed on</Th><Th>Supplier</Th><Th>Invoice</Th>
                <Th right>Billed ♀</Th><Th right>Billed ♂</Th>
                <Th right>Free ♀</Th><Th right>Free ♂</Th>
                <Th right>Total ♀</Th><Th right>Total ♂</Th><Th right>Total birds</Th>
                <Th right>Rate</Th><Th right>Cost</Th>
              </tr>
            </thead>
            <tbody>
              {(rows as Row[]).map(r => {
                const c = calc(r)
                return (
                  <tr key={r.id} className={c.mismatch ? 'bg-amber-50/40' : ''}>
                    <Td>
                      <span className="font-medium">F{r.flock_no}</span>
                      <span className="text-xs text-gray-400 ml-1">{r.breed}</span>
                      <Badge color={r.status === 'laying' ? 'green' : r.status === 'rearing' ? 'yellow' : 'gray'}>
                        {r.status}
                      </Badge>
                    </Td>
                    <Td className="text-xs">{r.placement_date ? fmtDate(r.placement_date) : '—'}</Td>
                    <Td className="text-xs text-gray-600">{r.supplier ?? '—'}</Td>
                    <Td className="text-xs text-gray-600">
                      {r.chick_invoice_no ?? '—'}
                      {r.chick_invoice_date && (
                        <span className="text-gray-400 ml-1">{fmtDate(r.chick_invoice_date)}</span>
                      )}
                    </Td>
                    <Td right>{show(c.billedF)}</Td>
                    <Td right>{show(c.billedM)}</Td>
                    <Td right className="text-green-700">{show(c.freeF)}</Td>
                    <Td right className="text-green-700">{show(c.freeM)}</Td>
                    <Td right className="font-semibold">{show(c.totalF)}</Td>
                    <Td right className="font-semibold">{show(c.totalM)}</Td>
                    <Td right className="font-semibold">{show(c.totalF + c.totalM)}</Td>
                    <Td right className="text-xs">{r.chick_rate != null ? inr(r.chick_rate) : '—'}</Td>
                    <Td right className="text-xs">{r.chick_cost != null ? inr(r.chick_cost) : '—'}</Td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr><Td colSpan={13} className="text-center text-gray-400 py-6">No flocks yet.</Td></tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <Td colSpan={4}>{rows.length} flocks</Td>
                  <Td right>{show(tot.billedF)}</Td><Td right>{show(tot.billedM)}</Td>
                  <Td right>{show(tot.freeF)}</Td><Td right>{show(tot.freeM)}</Td>
                  <Td right>{show(tot.totalF)}</Td><Td right>{show(tot.totalM)}</Td>
                  <Td right>{show(tot.totalF + tot.totalM)}</Td>
                  <Td right>—</Td>
                  <Td right>{tot.cost ? inr(tot.cost) : '—'}</Td>
                </tr>
              </tfoot>
            )}
          </Table>
        </div>
        <p className="text-xs text-gray-500 px-3 py-2">
          Total is the placed figure as recorded on the flock, not billed plus free added up — where the two
          disagree the row is highlighted rather than quietly corrected. Free birds are shown in green because
          they change the cost per bird without changing the birds received.
        </p>
      </Card>
    </div>
  )
}
