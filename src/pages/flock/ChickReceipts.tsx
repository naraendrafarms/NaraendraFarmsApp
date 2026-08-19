import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, fetchAllPages } from '@/lib/utils'
import { Card, Badge, Table, Th, Td, SectionHeader, Spinner, Button } from '@/components/ui'
import { Download, AlertTriangle } from 'lucide-react'

// What was actually received, taken from the GRNs themselves.
//
// The chick deliveries are real purchase records: category "Chicks", one line
// per sex, billed quantity in qty and free birds in free_qty, against a party,
// an invoice and a rate. The flock record ALSO carries paid/free figures typed
// by hand — so there are two accounts of the same delivery, and until now
// neither was readable in one place. This page reads the GRNs, and shows the
// flock's own figure beside them so a disagreement is visible instead of
// being averaged away or quietly preferred.

type GrnRow = {
  id: string
  grn_no: string | null
  grn_date: string
  invoice_no: string | null
  invoice_date: string | null
  qty: number | null
  free_qty: number | null
  unit: string | null
  price_per_unit: number | null
  total_amount: number | null
  flock_id: string | null
  item_id: string | null
  item_name: string | null
  items: { name: string; category: string } | null
  parties: { name: string } | null
}

type Flock = {
  id: string
  flock_no: string
  breed: string | null
  status: string
  placement_date: string | null
  paid_female: number | null
  paid_male: number | null
  free_female: number | null
  free_male: number | null
  total_placed_f: number | null
  total_placed_m: number | null
}

type Advance = { flock_id: string | null; amount: number | null; adjusted: boolean | null }

const num = (v: number | null | undefined) => (v == null ? 0 : Number(v))
const show = (v: number) => (v === 0 ? '—' : v.toLocaleString('en-IN'))

// "Breeder Females" contains the word "male", so female must be tested first.
const sexOf = (name: string): 'F' | 'M' | '?' => {
  const n = name.toLowerCase()
  if (n.includes('female')) return 'F'
  if (n.includes('male')) return 'M'
  return '?'
}

export const ChickReceipts: React.FC = () => {
  const { data: grns = [], isLoading } = useQuery({
    queryKey: ['chick_grns'],
    queryFn: async () => fetchAllPages<any>(
      (from, to) => supabase.from('grn')
        .select('id,grn_no,grn_date,invoice_no,invoice_date,qty,free_qty,unit,price_per_unit,' +
                'total_amount,flock_id,item_id,item_name,items(name,category),parties(name)')
        .order('grn_date', { ascending: false }).order('id').range(from, to),
      'Chick GRNs'
    ) as Promise<GrnRow[]>
  })

  const { data: flocks = [] } = useQuery({
    queryKey: ['flocks_for_receipts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('flocks')
        .select('id,flock_no,breed,status,placement_date,paid_female,paid_male,free_female,free_male,total_placed_f,total_placed_m')
        .order('placement_date', { ascending: false }).order('id')
      if (error) throw error
      return (data ?? []) as unknown as Flock[]
    }
  })

  const { data: advances = [] } = useQuery({
    queryKey: ['hatchery_advances_all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hatchery_advances').select('flock_id,amount,adjusted')
      if (error) throw error
      return (data ?? []) as unknown as Advance[]
    }
  })

  // Only the chick lines. A GRN counts if its item is in the Chicks category,
  // or — for older rows entered before the items master — if the loose name
  // says so.
  const chickRows = (grns as GrnRow[]).filter(g => {
    const cat = g.items?.category ?? ''
    const name = g.items?.name ?? g.item_name ?? ''
    return cat.toLowerCase() === 'chicks' ||
           /breeder|chick/i.test(name)
  })

  const byFlock = React.useMemo(() => {
    const m: Record<string, {
      rows: GrnRow[]
      billedF: number; billedM: number; freeF: number; freeM: number
      amount: number
    }> = {}
    for (const g of chickRows) {
      const key = g.flock_id ?? '(unlinked)'
      const e = (m[key] ??= { rows: [], billedF: 0, billedM: 0, freeF: 0, freeM: 0, amount: 0 })
      e.rows.push(g)
      const sex = sexOf(g.items?.name ?? g.item_name ?? '')
      if (sex === 'F') { e.billedF += num(g.qty); e.freeF += num(g.free_qty) }
      else if (sex === 'M') { e.billedM += num(g.qty); e.freeM += num(g.free_qty) }
      e.amount += num(g.total_amount)
    }
    return m
  }, [chickRows])

  const advByFlock = React.useMemo(() => {
    const m: Record<string, number> = {}
    for (const a of advances as Advance[]) {
      if (!a.flock_id) continue
      m[a.flock_id] = (m[a.flock_id] ?? 0) + num(a.amount)
    }
    return m
  }, [advances])

  // A flock is listed if it has chick GRNs, or if it has none at all — the
  // second case is the one worth seeing, since it means a delivery that was
  // never entered as a purchase.
  const rows = (flocks as Flock[]).map(f => {
    const g = byFlock[f.id]
    const grnF = (g?.billedF ?? 0) + (g?.freeF ?? 0)
    const grnM = (g?.billedM ?? 0) + (g?.freeM ?? 0)
    const placedF = num(f.total_placed_f), placedM = num(f.total_placed_m)
    const hasGrn = !!g
    const mismatch = hasGrn && (grnF !== placedF || grnM !== placedM)
    return { f, g, grnF, grnM, placedF, placedM, hasGrn, mismatch, advance: advByFlock[f.id] ?? 0 }
  })

  const unlinked = byFlock['(unlinked)']
  const noGrn = rows.filter(r => !r.hasGrn)
  const mismatched = rows.filter(r => r.mismatch)

  const tot = rows.reduce((s, r) => ({
    billedF: s.billedF + (r.g?.billedF ?? 0), billedM: s.billedM + (r.g?.billedM ?? 0),
    freeF: s.freeF + (r.g?.freeF ?? 0), freeM: s.freeM + (r.g?.freeM ?? 0),
    totF: s.totF + r.grnF, totM: s.totM + r.grnM,
    amount: s.amount + (r.g?.amount ?? 0), advance: s.advance + r.advance,
  }), { billedF: 0, billedM: 0, freeF: 0, freeM: 0, totF: 0, totM: 0, amount: 0, advance: 0 })

  const exportCSV = () => {
    const headers = ['Flock','Placed on','Party','GRN','GRN date','Invoice','Invoice date','Item',
      'Billed qty','Free qty','Total','Rate','Amount']
    const lines: any[][] = []
    for (const r of rows) {
      for (const g of (r.g?.rows ?? [])) {
        lines.push([`F${r.f.flock_no}`, r.f.placement_date ?? '', g.parties?.name ?? '',
          g.grn_no ?? '', g.grn_date, g.invoice_no ?? '', g.invoice_date ?? '',
          g.items?.name ?? g.item_name ?? '', num(g.qty), num(g.free_qty),
          num(g.qty) + num(g.free_qty), g.price_per_unit ?? '', g.total_amount ?? ''])
      }
    }
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
        subtitle="Breeder females and males received per flock, from the chick GRNs — billed and free, with the party, invoice and cost behind each one."
        action={<Button variant="ghost" size="sm" icon={<Download size={15} />} onClick={exportCSV}>Export</Button>}
      />

      {(noGrn.length > 0 || mismatched.length > 0 || unlinked) && (
        <Card>
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-gray-700 space-y-1">
              {noGrn.length > 0 && (
                <p>
                  <strong>{noGrn.length}</strong> {noGrn.length === 1 ? 'flock has' : 'flocks have'} no chick
                  GRN at all — the birds are on the flock record but the purchase was never entered:{' '}
                  <span className="text-gray-500">{noGrn.map(r => `F${r.f.flock_no}`).join(', ')}</span>
                </p>
              )}
              {mismatched.length > 0 && (
                <p>
                  <strong>{mismatched.length}</strong> {mismatched.length === 1 ? 'flock does' : 'flocks do'} not
                  agree — birds received on the GRNs differ from the placed figure on the flock:{' '}
                  <span className="text-gray-500">{mismatched.map(r => `F${r.f.flock_no}`).join(', ')}</span>
                </p>
              )}
              {unlinked && (
                <p>
                  <strong>{unlinked.rows.length}</strong> chick GRN {unlinked.rows.length === 1 ? 'line is' : 'lines are'}{' '}
                  not linked to any flock, so those birds belong to nobody:{' '}
                  <span className="text-gray-500">
                    {unlinked.rows.map(g => g.grn_no ?? g.invoice_no ?? g.grn_date).join(', ')}
                  </span>
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
                <Th>Flock / GRN line</Th><Th>Party</Th><Th>Invoice</Th>
                <Th right>Billed ♀</Th><Th right>Billed ♂</Th>
                <Th right>Free ♀</Th><Th right>Free ♂</Th>
                <Th right>Total ♀</Th><Th right>Total ♂</Th>
                <Th right>Rate</Th><Th right>Amount</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <React.Fragment key={r.f.id}>
                  <tr className={r.mismatch ? 'bg-amber-50/50' : 'bg-gray-50/60'}>
                    <Td>
                      <span className="font-semibold">F{r.f.flock_no}</span>
                      <span className="text-xs text-gray-400 ml-1">{r.f.breed}</span>
                      <Badge color={r.f.status === 'laying' ? 'green' : r.f.status === 'rearing' ? 'yellow' : 'gray'}>
                        {r.f.status}
                      </Badge>
                      {r.f.placement_date && (
                        <span className="text-xs text-gray-400 ml-1">placed {fmtDate(r.f.placement_date)}</span>
                      )}
                    </Td>
                    <Td className="text-xs text-gray-500" colSpan={2}>
                      {r.hasGrn
                        ? `${r.g!.rows.length} GRN ${r.g!.rows.length === 1 ? 'line' : 'lines'}`
                        : <span className="text-amber-700">no chick GRN</span>}
                      {r.advance > 0 && (
                        <span className="ml-2 text-gray-400">advance paid {inr(r.advance)}</span>
                      )}
                    </Td>
                    <Td right className="font-semibold">{show(r.g?.billedF ?? 0)}</Td>
                    <Td right className="font-semibold">{show(r.g?.billedM ?? 0)}</Td>
                    <Td right className="font-semibold text-green-700">{show(r.g?.freeF ?? 0)}</Td>
                    <Td right className="font-semibold text-green-700">{show(r.g?.freeM ?? 0)}</Td>
                    <Td right className="font-bold">{show(r.grnF)}</Td>
                    <Td right className="font-bold">{show(r.grnM)}</Td>
                    <Td right>—</Td>
                    <Td right className="font-semibold">{r.g?.amount ? inr(r.g.amount) : '—'}</Td>
                  </tr>

                  {(r.g?.rows ?? []).map(g => (
                    <tr key={g.id}>
                      <Td className="text-xs pl-6 text-gray-600">
                        {g.items?.name ?? g.item_name ?? '(no item)'}
                        <span className="text-gray-400 ml-1">GRN {g.grn_no ?? '—'} · {fmtDate(g.grn_date)}</span>
                      </Td>
                      <Td className="text-xs text-gray-500">{g.parties?.name ?? '—'}</Td>
                      <Td className="text-xs text-gray-500">
                        {g.invoice_no ?? '—'}
                        {g.invoice_date && <span className="text-gray-400 ml-1">{fmtDate(g.invoice_date)}</span>}
                      </Td>
                      {sexOf(g.items?.name ?? g.item_name ?? '') === 'F' ? (
                        <><Td right>{show(num(g.qty))}</Td><Td right>—</Td>
                          <Td right className="text-green-700">{show(num(g.free_qty))}</Td><Td right>—</Td>
                          <Td right>{show(num(g.qty) + num(g.free_qty))}</Td><Td right>—</Td></>
                      ) : sexOf(g.items?.name ?? g.item_name ?? '') === 'M' ? (
                        <><Td right>—</Td><Td right>{show(num(g.qty))}</Td>
                          <Td right>—</Td><Td right className="text-green-700">{show(num(g.free_qty))}</Td>
                          <Td right>—</Td><Td right>{show(num(g.qty) + num(g.free_qty))}</Td></>
                      ) : (
                        <><Td right colSpan={6} className="text-xs text-amber-700">
                          {show(num(g.qty))} {g.unit} — sex not identified from the item name
                        </Td></>
                      )}
                      <Td right className="text-xs">{g.price_per_unit != null ? inr(g.price_per_unit) : '—'}</Td>
                      <Td right className="text-xs">{g.total_amount != null ? inr(g.total_amount) : '—'}</Td>
                    </tr>
                  ))}

                  {r.mismatch && (
                    <tr>
                      <Td colSpan={11} className="text-xs bg-amber-50/40 text-amber-800 pl-6">
                        GRNs total {show(r.grnF)}♀ / {show(r.grnM)}♂, but the flock is placed with{' '}
                        {show(r.placedF)}♀ / {show(r.placedM)}♂ — a difference of{' '}
                        {show(Math.abs(r.grnF - r.placedF))}♀ and {show(Math.abs(r.grnM - r.placedM))}♂.
                      </Td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {rows.length === 0 && (
                <tr><Td colSpan={11} className="text-center text-gray-400 py-6">No flocks yet.</Td></tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <Td colSpan={3}>{rows.length} flocks{tot.advance > 0 && <span className="font-normal text-xs text-gray-500 ml-2">advances {inr(tot.advance)}</span>}</Td>
                  <Td right>{show(tot.billedF)}</Td><Td right>{show(tot.billedM)}</Td>
                  <Td right>{show(tot.freeF)}</Td><Td right>{show(tot.freeM)}</Td>
                  <Td right>{show(tot.totF)}</Td><Td right>{show(tot.totM)}</Td>
                  <Td right>—</Td><Td right>{inr(tot.amount)}</Td>
                </tr>
              </tfoot>
            )}
          </Table>
        </div>
        <p className="text-xs text-gray-500 px-3 py-2">
          Billed is the GRN quantity, free is the free quantity on the same line, and the sex comes from the
          item — "Breeder Females" or "Breeder Males" under the Chicks category. Free birds are green because
          they change the cost per bird without changing the birds received. Where the GRNs and the flock's
          placed figure disagree, the row says so rather than picking one.
        </p>
      </Card>
    </div>
  )
}
