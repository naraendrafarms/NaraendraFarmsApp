import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import {
  Card, Select, SectionHeader, Spinner, Table, Th, Td, Badge
} from '@/components/ui'
import { Download } from 'lucide-react'

function exportCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = filename
  a.click()
}

export const EggStockPage: React.FC = () => {
  const [asOfDate, setAsOfDate] = useState(today())
  const [flockFilter, setFlockFilter] = useState('')

  // Flocks
  const { data: flocks, isLoading: flocksLoading } = useQuery({
    queryKey: ['egg_stock_flocks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('flocks')
        .select('id, flock_no, status, farms!laying_farm_id(name)')
        .neq('status', 'closed')
        .order('flock_no')
      return data ?? []
    }
  })

  // HE produced
  const { data: heProd } = useQuery({
    queryKey: ['egg_stock_he_prod', asOfDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_records')
        .select('flock_id, he_grade_a, he_grade_b, he_grade_c')
        .lte('record_date', asOfDate)
      return data ?? []
    },
    enabled: !!asOfDate
  })

  // HE dispatched
  const { data: heDisp } = useQuery({
    queryKey: ['egg_stock_he_disp', asOfDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('he_dispatch')
        .select('flock_id, grade_a, grade_b, grade_c')
        .lte('dispatch_date', asOfDate)
      return data ?? []
    },
    enabled: !!asOfDate
  })

  // HE opening stock
  const { data: heOpening } = useQuery({
    queryKey: ['egg_stock_he_opening'],
    queryFn: async () => {
      const { data } = await supabase
        .from('egg_opening_stock')
        .select('flock_id, he_grade_a, he_grade_b, he_grade_c')
      return data ?? []
    }
  })

  // NHE produced
  const { data: nheProd } = useQuery({
    queryKey: ['egg_stock_nhe_prod', asOfDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_records')
        .select('flock_id, je_eggs, te_eggs, be_eggs')
        .lte('record_date', asOfDate)
      return data ?? []
    },
    enabled: !!asOfDate
  })

  // NHE sold
  const { data: nheSales } = useQuery({
    queryKey: ['egg_stock_nhe_sales', asOfDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('nhe_sales')
        .select('flock_id, sale_type, quantity')
        .lte('sale_date', asOfDate)
      return data ?? []
    },
    enabled: !!asOfDate
  })

  // NHE opening stock
  const { data: nheOpening } = useQuery({
    queryKey: ['egg_stock_nhe_opening'],
    queryFn: async () => {
      const { data } = await supabase
        .from('egg_opening_stock')
        .select('flock_id, nhe_je, nhe_te, nhe_be')
      return data ?? []
    }
  })

  const isLoading = flocksLoading

  // Compute per-flock stock
  const stockRows = useMemo(() => {
    if (!flocks) return []

    // HE production per flock by grade
    const heGradeA: Record<string, number> = {}
    const heGradeB: Record<string, number> = {}
    const heGradeC: Record<string, number> = {}
    for (const r of (heProd ?? [])) {
      heGradeA[r.flock_id] = (heGradeA[r.flock_id] ?? 0) + (r.he_grade_a ?? 0)
      heGradeB[r.flock_id] = (heGradeB[r.flock_id] ?? 0) + (r.he_grade_b ?? 0)
      heGradeC[r.flock_id] = (heGradeC[r.flock_id] ?? 0) + (r.he_grade_c ?? 0)
    }

    // HE dispatch per flock by grade
    const dispA: Record<string, number> = {}
    const dispB: Record<string, number> = {}
    const dispC: Record<string, number> = {}
    for (const d of (heDisp ?? [])) {
      dispA[d.flock_id] = (dispA[d.flock_id] ?? 0) + (d.grade_a ?? 0)
      dispB[d.flock_id] = (dispB[d.flock_id] ?? 0) + (d.grade_b ?? 0)
      dispC[d.flock_id] = (dispC[d.flock_id] ?? 0) + (d.grade_c ?? 0)
    }

    // HE opening stock per flock
    const heOpenA: Record<string, number> = {}
    const heOpenB: Record<string, number> = {}
    const heOpenC: Record<string, number> = {}
    for (const o of (heOpening ?? [])) {
      heOpenA[o.flock_id] = (heOpenA[o.flock_id] ?? 0) + (o.he_grade_a ?? 0)
      heOpenB[o.flock_id] = (heOpenB[o.flock_id] ?? 0) + (o.he_grade_b ?? 0)
      heOpenC[o.flock_id] = (heOpenC[o.flock_id] ?? 0) + (o.he_grade_c ?? 0)
    }

    // NHE production per flock
    const jeSum: Record<string, number> = {}
    const teSum: Record<string, number> = {}
    const beSum: Record<string, number> = {}
    for (const r of (nheProd ?? [])) {
      jeSum[r.flock_id] = (jeSum[r.flock_id] ?? 0) + (r.je_eggs ?? 0)
      teSum[r.flock_id] = (teSum[r.flock_id] ?? 0) + (r.te_eggs ?? 0)
      beSum[r.flock_id] = (beSum[r.flock_id] ?? 0) + (r.be_eggs ?? 0)
    }

    // NHE sales per flock by type (je, te, be)
    const jeSold: Record<string, number> = {}
    const teSold: Record<string, number> = {}
    const beSold: Record<string, number> = {}
    for (const s of (nheSales ?? [])) {
      if (s.sale_type === 'je') jeSold[s.flock_id] = (jeSold[s.flock_id] ?? 0) + (s.quantity ?? 0)
      else if (s.sale_type === 'te') teSold[s.flock_id] = (teSold[s.flock_id] ?? 0) + (s.quantity ?? 0)
      else if (s.sale_type === 'be') beSold[s.flock_id] = (beSold[s.flock_id] ?? 0) + (s.quantity ?? 0)
    }

    // NHE opening stock per flock
    const nheOpenJE: Record<string, number> = {}
    const nheOpenTE: Record<string, number> = {}
    const nheOpenBE: Record<string, number> = {}
    for (const o of (nheOpening ?? [])) {
      nheOpenJE[o.flock_id] = (nheOpenJE[o.flock_id] ?? 0) + (o.nhe_je ?? 0)
      nheOpenTE[o.flock_id] = (nheOpenTE[o.flock_id] ?? 0) + (o.nhe_te ?? 0)
      nheOpenBE[o.flock_id] = (nheOpenBE[o.flock_id] ?? 0) + (o.nhe_be ?? 0)
    }

    return flocks
      .filter((f: any) => !flockFilter || f.id === flockFilter)
      .map((f: any) => {
        const id = f.id
        const balA = (heGradeA[id] ?? 0) + (heOpenA[id] ?? 0) - (dispA[id] ?? 0)
        const balB = (heGradeB[id] ?? 0) + (heOpenB[id] ?? 0) - (dispB[id] ?? 0)
        const balC = (heGradeC[id] ?? 0) + (heOpenC[id] ?? 0) - (dispC[id] ?? 0)
        const totalHE = balA + balB + balC

        const je = (jeSum[id] ?? 0) + (nheOpenJE[id] ?? 0) - (jeSold[id] ?? 0)
        const te = (teSum[id] ?? 0) + (nheOpenTE[id] ?? 0) - (teSold[id] ?? 0)
        const be = (beSum[id] ?? 0) + (nheOpenBE[id] ?? 0) - (beSold[id] ?? 0)
        const totalNHE = je + te + be

        const hasNegative = balA < 0 || balB < 0 || balC < 0 || je < 0 || te < 0 || be < 0

        return {
          id,
          flockNo: f.flock_no,
          farm: (f.farms as any)?.name ?? '—',
          balA, balB, balC, totalHE,
          je, te, be, totalNHE,
          hasNegative,
        }
      })
  }, [flocks, flockFilter, heProd, heDisp, heOpening, nheProd, nheSales, nheOpening])

  const totalHE = stockRows.reduce((s, r) => s + r.totalHE, 0)
  const totalNHE = stockRows.reduce((s, r) => s + r.totalNHE, 0)

  const flockOptions = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))

  const handleExport = () => {
    exportCSV(
      `egg_stock_${asOfDate}.csv`,
      ['Flock', 'Farm', 'HE Grade A', 'HE Grade B', 'HE Grade C', 'Total HE', 'JE', 'TE', 'BE', 'Total NHE'],
      stockRows.map(r => [r.flockNo, r.farm, r.balA, r.balB, r.balC, r.totalHE, r.je, r.te, r.be, r.totalNHE])
    )
  }

  const fmt = (n: number) => n.toLocaleString('en-IN')

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Egg Stock Balance"
        subtitle="Current egg inventory across all active flocks"
        action={
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <Download size={14} /> Export CSV
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <Select
          label=""
          placeholder="All Flocks"
          options={flockOptions}
          value={flockFilter}
          onChange={e => setFlockFilter(e.target.value)}
          className="w-44"
        />
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          As of date
          <input
            type="date"
            value={asOfDate}
            onChange={e => setAsOfDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </label>
        {flockFilter && (
          <button
            onClick={() => setFlockFilter('')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center py-4">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total HE on Hand</div>
          <div className={`text-2xl font-bold mt-1 ${totalHE < 0 ? 'text-red-600' : 'text-blue-700'}`}>
            {fmt(totalHE)}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Hatching Eggs</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total NHE on Hand</div>
          <div className={`text-2xl font-bold mt-1 ${totalNHE < 0 ? 'text-red-600' : 'text-green-700'}`}>
            {fmt(totalNHE)}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Non-Hatching Eggs</div>
        </Card>
      </div>

      {/* Stock Table */}
      <Card padding={false}>
        <Table>
          <thead>
            <tr>
              <Th>Flock</Th>
              <Th>Farm</Th>
              <Th right className="text-green-700">HE (Grade A)</Th>
              <Th right className="text-blue-700">HE (Grade B)</Th>
              <Th right className="text-orange-700">HE (Grade C)</Th>
              <Th right className="text-gray-800">Total HE</Th>
              <Th right className="text-purple-700">JE</Th>
              <Th right className="text-indigo-700">TE</Th>
              <Th right className="text-pink-700">BE</Th>
              <Th right className="text-gray-800">Total NHE</Th>
            </tr>
          </thead>
          <tbody>
            {stockRows.map(r => (
              <tr
                key={r.id}
                className={`hover:bg-gray-50 ${r.hasNegative ? 'bg-red-50' : ''}`}
              >
                <Td>
                  <Badge color="green">F-{r.flockNo}</Badge>
                </Td>
                <Td className="text-xs text-gray-600">{r.farm}</Td>
                <Td right className={`text-sm font-medium ${r.balA < 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {fmt(r.balA)}
                </Td>
                <Td right className={`text-sm font-medium ${r.balB < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                  {fmt(r.balB)}
                </Td>
                <Td right className={`text-sm font-medium ${r.balC < 0 ? 'text-red-600' : 'text-orange-700'}`}>
                  {fmt(r.balC)}
                </Td>
                <Td right className={`font-semibold ${r.totalHE < 0 ? 'text-red-700' : 'text-gray-900'}`}>
                  {fmt(r.totalHE)}
                </Td>
                <Td right className={`text-sm font-medium ${r.je < 0 ? 'text-red-600' : 'text-purple-700'}`}>
                  {fmt(r.je)}
                </Td>
                <Td right className={`text-sm font-medium ${r.te < 0 ? 'text-red-600' : 'text-indigo-700'}`}>
                  {fmt(r.te)}
                </Td>
                <Td right className={`text-sm font-medium ${r.be < 0 ? 'text-red-600' : 'text-pink-700'}`}>
                  {fmt(r.be)}
                </Td>
                <Td right className={`font-semibold ${r.totalNHE < 0 ? 'text-red-700' : 'text-gray-900'}`}>
                  {fmt(r.totalNHE)}
                </Td>
              </tr>
            ))}
            {stockRows.length === 0 && (
              <tr>
                <Td colSpan={10} className="text-center text-gray-400 py-8">
                  No active flocks found
                </Td>
              </tr>
            )}
          </tbody>
          {stockRows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <Td colSpan={5}><strong>TOTAL ({stockRows.length} flocks)</strong></Td>
                <Td right className={totalHE < 0 ? 'text-red-700' : 'text-blue-700'}>
                  <strong>{fmt(totalHE)}</strong>
                </Td>
                <Td colSpan={3}></Td>
                <Td right className={totalNHE < 0 ? 'text-red-700' : 'text-green-700'}>
                  <strong>{fmt(totalNHE)}</strong>
                </Td>
              </tr>
            </tfoot>
          )}
        </Table>
      </Card>

      {stockRows.some(r => r.hasNegative) && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <span className="font-medium">Note:</span> Rows highlighted in red have negative stock — this may indicate missing opening stock entries or data entry errors.
        </div>
      )}
    </div>
  )
}
