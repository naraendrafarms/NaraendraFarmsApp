import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fetchAllPages, exportCSV } from '@/lib/utils'
import { useFeedRates } from '@/hooks/useFeedRates'
import { useMedicineRates } from '@/lib/medicineRates'
import { printReport } from '@/lib/invoicePrint'
import {
  Card, CardHeader, Button, Input, Select, Spinner, SectionHeader,
  Table, Th, Td,
} from '@/components/ui'
import { Download, Printer } from 'lucide-react'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS PAGE EXISTS, AND WHAT IT IS NOT
//
// The flock's own Cost & Income tab reports what has been ENTERED. On Flock 20
// that is 13,27,970 kg of priced feed out of 22,17,952 kg actually fed, salary
// for 4 months of a 17-month flock, electricity for 6, expenses for 5 and
// medicine for 5 — so it shows Rs 9.17 an egg when the real figure is closer
// to Rs 15. Every one of those lines is correct about what it was given; none
// of them is the cost of an egg.
//
// This page answers the other question: what did an egg COST, given the whole
// feed bill and a full run of months. It never writes anything. There is no
// migration behind it, no column, no saved assumption: the feed rate lives in
// this page's own state and dies with the tab. The AS ENTERED column is always
// shown beside the estimate, so the page can never quietly replace a real
// figure with a modelled one.
// ─────────────────────────────────────────────────────────────────────────────

const n0 = (v: any) => (v == null || v === '' ? null : Number(v))
const ym = (d: any) => String(d ?? '').slice(0, 7)

type Line = {
  key: string
  label: string
  entered: number
  months: number | null   // months of data behind `entered`; null = not month-based
  estimated: number
  note?: string
}

export const CostPerEggEstimate: React.FC = () => {
  // Rs 27-30/kg is the farm's own working figure for finished feed. It is a
  // SETTING, not a saved value: nothing here is written back to any flock.
  const [feedRate, setFeedRate] = useState('27')
  const [flockId, setFlockId] = useState('')

  const rate = n0(feedRate) ?? 0

  const { data: flocks } = useQuery({
    queryKey: ['cpe_flocks'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('id,flock_no,status,placement_date,chick_cost,total_placed_f,total_placed_m,laying_season')
        .order('flock_no')
      return data ?? []
    },
  })

  // record_date and farm_id are both needed: the first to count the months a
  // flock actually ran, the second to know WHICH site's bills belong to it.
  const { data: daily } = useQuery({
    queryKey: ['cpe_daily'],
    queryFn: () => fetchAllPages<any>((from, to) => supabase.from('daily_records')
      .select('flock_id,farm_id,record_date,feed_female_kg,feed_type_f,feed_male_kg,feed_type_m,total_eggs,he_eggs')
      .order('id').range(from, to), 'Daily records', toast.error),
  })

  const { data: medUsage } = useQuery({
    queryKey: ['cpe_med'],
    queryFn: () => fetchAllPages<any>((from, to) => supabase.from('medicine_usage')
      .select('flock_id,usage_date,quantity,rate,amount,medicines_master(name,item_id)')
      .order('id').range(from, to), 'Medicine usage', toast.error),
  })

  const { data: elecBills } = useQuery({
    queryKey: ['cpe_elec'],
    queryFn: async () => {
      const { data } = await supabase.from('electricity_bills')
        .select('bill_month,amount,electricity_meters(farm_id)')
      return data ?? []
    },
  })

  const { data: salary } = useQuery({
    queryKey: ['cpe_salary'],
    queryFn: async () => {
      const { data } = await supabase.from('salary_monthly')
        .select('month,earned_salary,net_salary,employees!employee_id(farm_id)')
      return data ?? []
    },
  })

  const { data: expenses } = useQuery({
    queryKey: ['cpe_exp'],
    queryFn: () => fetchAllPages<any>((from, to) => supabase.from('v_flock_expense_allocation')
      .select('flock_id,expense_date,allocated_amount').range(from, to), 'Flock expenses', toast.error),
  })

  const { data: heDispatch } = useQuery({
    queryKey: ['cpe_he'],
    queryFn: () => fetchAllPages<any>((from, to) => supabase.from('he_dispatch')
      .select('flock_id,amount').order('id').range(from, to), 'HE dispatch', toast.error),
  })
  const { data: nheSales } = useQuery({
    queryKey: ['cpe_nhe'],
    queryFn: () => fetchAllPages<any>((from, to) => supabase.from('nhe_sales')
      .select('flock_id,amount').order('id').range(from, to), 'NHE sales', toast.error),
  })

  const { data: curve } = useQuery({
    queryKey: ['cpe_curve'],
    queryFn: async () => {
      const { data } = await supabase.from('std_production_curve')
        .select('season,week_of_age,cum_te_hh,cum_he_hh').order('week_of_age')
      return data ?? []
    },
  })

  const feedRates = useFeedRates()
  const medRate = useMedicineRates()

  const loading = !flocks || !daily || !medUsage || !elecBills || !salary || !expenses
    || !heDispatch || !nheSales

  const rows = useMemo(() => {
    if (loading) return []
    const rateOf = (t: any) => (t ? (feedRates.byTypeId[t] ?? feedRates.rate(t)) : 0)

    return (flocks ?? []).map((f: any) => {
      const dr = (daily ?? []).filter((d: any) => d.flock_id === f.id)
      if (dr.length === 0) return null

      // The months the flock actually ran, and the site it was on in each -
      // taken from the daily record itself, which is the only thing that knows.
      const months = new Set<string>()
      const siteMonths = new Set<string>()
      for (const d of dr) {
        const m = ym(d.record_date)
        months.add(m)
        siteMonths.add(`${m}|${d.farm_id ?? ''}`)
      }
      const nMonths = months.size

      // ── feed ──────────────────────────────────────────────────────────────
      let feedKg = 0, feedEntered = 0, feedKgUnpriced = 0
      for (const d of dr) {
        const kf = Number(d.feed_female_kg ?? 0), km = Number(d.feed_male_kg ?? 0)
        feedKg += kf + km
        const rf = rateOf(d.feed_type_f), rm = rateOf(d.feed_type_m)
        feedEntered += kf * rf + km * rm
        if (!rf) feedKgUnpriced += kf
        if (!rm) feedKgUnpriced += km
      }
      // The estimate prices EVERY kg, including the kg the recipe engine could
      // not price. That is the whole point: a flock does not stop eating
      // because a feed type was left blank.
      const feedEst = feedKg * rate

      const eggs = dr.reduce((s: number, d: any) => s + Number(d.total_eggs ?? 0), 0)
      const he   = dr.reduce((s: number, d: any) => s + Number(d.he_eggs ?? 0), 0)

      // ── the month-based costs ─────────────────────────────────────────────
      // Each is scaled by (months the flock ran / months that carry data).
      // Scaling a line with NO data at all is impossible, and inventing one
      // would be worse than leaving it out - those show as "no data".
      const scaled = (total: number, monthsWith: number) =>
        monthsWith > 0 ? (total / monthsWith) * nMonths : 0

      const medRows = (medUsage ?? []).filter((m: any) => m.flock_id === f.id)
      const medMonths = new Set(medRows.map((m: any) => ym(m.usage_date))).size
      const medEntered = medRows.reduce((s: number, m: any) => {
        const stock = medRate(m.medicines_master?.item_id, m.medicines_master?.name ?? '')
        return s + Number(m.quantity ?? 0) * Number(stock ?? m.rate ?? 0)
      }, 0)

      const elecRows = (elecBills ?? []).filter((b: any) =>
        siteMonths.has(`${ym(b.bill_month)}|${b.electricity_meters?.farm_id ?? ''}`))
      const elecMonths = new Set(elecRows.map((b: any) => ym(b.bill_month))).size
      const elecEntered = elecRows.reduce((s: number, b: any) => s + Number(b.amount ?? 0), 0)

      const salRows = (salary ?? []).filter((r: any) =>
        siteMonths.has(`${ym(r.month)}|${(r.employees as any)?.farm_id ?? ''}`))
      const salMonths = new Set(salRows.map((r: any) => ym(r.month))).size
      const salEntered = salRows.reduce((s: number, r: any) =>
        s + Number(r.earned_salary ?? r.net_salary ?? 0), 0)

      const expRows = (expenses ?? []).filter((e: any) => e.flock_id === f.id)
      const expMonths = new Set(expRows.map((e: any) => ym(e.expense_date))).size
      const expEntered = expRows.reduce((s: number, e: any) => s + Number(e.allocated_amount ?? 0), 0)

      const chick = Number(f.chick_cost ?? 0)

      const lines: Line[] = [
        { key: 'chick', label: 'Chick cost', entered: chick, months: null, estimated: chick,
          note: 'one purchase, complete either way' },
        { key: 'feed', label: `Feed (${Math.round(feedKg).toLocaleString('en-IN')} kg)`,
          entered: feedEntered, months: null, estimated: feedEst,
          note: feedKgUnpriced > 0
            ? `${Math.round(feedKgUnpriced).toLocaleString('en-IN')} kg has no priced feed type — left out of As entered, included here`
            : 'every kg already priced' },
        { key: 'med', label: 'Medicine & vaccine', entered: medEntered, months: medMonths,
          estimated: scaled(medEntered, medMonths) },
        { key: 'exp', label: 'Other expenses', entered: expEntered, months: expMonths,
          estimated: scaled(expEntered, expMonths) },
        { key: 'sal', label: 'Salary (site)', entered: salEntered, months: salMonths,
          estimated: scaled(salEntered, salMonths) },
        { key: 'elec', label: 'Electricity (site)', entered: elecEntered, months: elecMonths,
          estimated: scaled(elecEntered, elecMonths) },
      ]

      const totEntered = lines.reduce((s, l) => s + l.entered, 0)
      const totEst     = lines.reduce((s, l) => s + l.estimated, 0)
      const revenue = (heDispatch ?? []).filter((r: any) => r.flock_id === f.id)
          .reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0)
        + (nheSales ?? []).filter((r: any) => r.flock_id === f.id)
          .reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0)

      const hens = Number(f.total_placed_f ?? 0)
      const last = (curve ?? []).filter((c: any) => c.season === f.laying_season)
        .filter((c: any) => c.cum_te_hh != null).slice(-1)[0]

      return {
        id: f.id, flock_no: f.flock_no, status: f.status, season: f.laying_season,
        nMonths, lines, totEntered, totEst, eggs, he, revenue, hens,
        feedKg, feedKgUnpriced,
        cpeEntered: eggs > 0 ? totEntered / eggs : null,
        cpeEst:     eggs > 0 ? totEst / eggs : null,
        revPerEgg:  eggs > 0 ? revenue / eggs : null,
        eggsPerHen: hens > 0 ? eggs / hens : null,
        stdTe: last?.cum_te_hh != null ? Number(last.cum_te_hh) : null,
      }
    }).filter(Boolean) as any[]
  }, [loading, flocks, daily, medUsage, elecBills, salary, expenses, heDispatch, nheSales,
      curve, feedRates, medRate, rate])

  const selected = rows.find(r => r.id === flockId) ?? rows.find(r => r.eggs > 0) ?? rows[0]

  const fmtMonths = (l: Line, nMonths: number) =>
    l.months == null ? '—'
      : l.months === 0 ? 'no data'
      : `${l.months} of ${nMonths}`

  const exportRows = () => {
    if (!selected) return
    exportCSV(`cost-per-egg-F${selected.flock_no}`,
      ['Line', 'As entered', 'Months of data', 'Estimated'],
      selected.lines.map((l: Line) => [l.label, Math.round(l.entered),
        fmtMonths(l, selected.nMonths), Math.round(l.estimated)])
        .concat([['TOTAL', Math.round(selected.totEntered), `${selected.nMonths} months active`,
                  Math.round(selected.totEst)],
                 ['Cost per egg', selected.cpeEntered?.toFixed(2) ?? '', '',
                  selected.cpeEst?.toFixed(2) ?? '']]))
  }

  const printIt = () => {
    if (!selected) return
    printReport({
      title: `Cost per Egg — F-${selected.flock_no}`,
      subtitle: `Feed taken at Rs ${rate}/kg · part-entered costs scaled to ${selected.nMonths} months · ESTIMATE, nothing saved`,
      headers: ['Line', 'As entered', 'Months of data', 'Estimated'],
      rightAlignFrom: 1,
      rows: selected.lines.map((l: Line) => [l.label, inr(l.entered),
        fmtMonths(l, selected.nMonths), inr(l.estimated)]),
      footerRow: ['TOTAL COST', inr(selected.totEntered), '', inr(selected.totEst)],
    })
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Cost per Egg — Estimate"
        subtitle="What an egg cost once the WHOLE feed bill is priced and the part-entered months are filled in. Read only: nothing on this page is ever saved."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Printer size={14}/>} onClick={printIt}>Print</Button>
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={exportRows}>Export</Button>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <Select label="Flock" value={flockId} onChange={e => setFlockId((e.target as HTMLSelectElement).value)}
            options={[{ value: '', label: 'First flock with eggs' },
              ...rows.map(r => ({ value: r.id, label: `F-${r.flock_no} (${r.status})` }))]} />
          <Input label="Feed rate Rs/kg" type="number" step="0.01" value={feedRate}
            onChange={e => setFeedRate(e.target.value)} className="w-40" />
          <div className="text-xs text-gray-500 pb-2 max-w-xl">
            The rate is applied to <strong>every kg</strong> the flock ate, including kg whose feed
            type carries no recipe price. It is a setting on this page only — it is never written
            to a flock, a feed type or a formula.
          </div>
        </div>
      </Card>

      {loading ? <Spinner /> : !selected ? (
        <Card><div className="p-6 text-sm text-gray-500 text-center">No flock has daily records yet.</div></Card>
      ) : (
        <>
          <Card padding={false}>
            <CardHeader title={`F-${selected.flock_no} — how the cost is built`}
              subtitle={`${selected.nMonths} months of daily records. "As entered" is what the app holds today; "Estimated" prices all feed at Rs ${rate}/kg and scales each part-entered line to the full ${selected.nMonths} months.`} />
            <div className="overflow-x-auto">
              <Table>
                <thead><tr>
                  <Th>Cost line</Th><Th right>As entered</Th><Th>Months of data</Th><Th right>Estimated</Th><Th>Why they differ</Th>
                </tr></thead>
                <tbody>
                  {selected.lines.map((l: Line) => (
                    <tr key={l.key} className="border-b border-gray-50">
                      <Td className="font-medium">{l.label}</Td>
                      <Td right>{inr(l.entered)}</Td>
                      <Td className={l.months != null && l.months > 0 && l.months < selected.nMonths
                        ? 'text-amber-700 font-medium' : 'text-gray-400'}>
                        {fmtMonths(l, selected.nMonths)}
                      </Td>
                      <Td right className={l.estimated > l.entered ? 'font-medium text-red-600' : ''}>
                        {inr(l.estimated)}
                      </Td>
                      <Td className="text-xs text-gray-500">{l.note ??
                        (l.months === 0 ? 'nothing entered — cannot be scaled, so it is missing from both'
                         : l.months != null && l.months < selected.nMonths
                           ? `entered for ${l.months} of ${selected.nMonths} months` : 'complete')}</Td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                    <Td>TOTAL COST</Td>
                    <Td right>{inr(selected.totEntered)}</Td>
                    <Td className="text-gray-400 text-xs">{selected.nMonths} months active</Td>
                    <Td right className="text-red-700">{inr(selected.totEst)}</Td><Td />
                  </tr>
                  <tr className="bg-brand-50 font-bold">
                    <Td>COST PER EGG{selected.eggs > 0 ? ` (on ${selected.eggs.toLocaleString('en-IN')} eggs)` : ''}</Td>
                    <Td right>{selected.cpeEntered != null ? `Rs ${selected.cpeEntered.toFixed(2)}` : 'no eggs yet'}</Td>
                    <Td />
                    <Td right className="text-red-700">{selected.cpeEst != null ? `Rs ${selected.cpeEst.toFixed(2)}` : 'no eggs yet'}</Td>
                    <Td className="text-xs font-normal text-gray-500">
                      {selected.revPerEgg != null
                        ? `sold at Rs ${selected.revPerEgg.toFixed(2)}/egg — margin Rs ${(selected.revPerEgg - (selected.cpeEst ?? 0)).toFixed(2)}`
                        : 'a flock that has not laid has no cost per egg'}
                    </Td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </Card>

          <Card padding={false}>
            <CardHeader title="Every flock, side by side"
              subtitle="A flock that has not started laying shows no cost per egg, because there is nothing to divide by — not a zero." />
            <div className="overflow-x-auto">
              <Table>
                <thead><tr>
                  <Th>Flock</Th><Th>Status</Th><Th right>Months</Th><Th right>Feed kg</Th>
                  <Th right>Unpriced kg</Th><Th right>Eggs</Th>
                  <Th right>Cost/egg entered</Th><Th right>Cost/egg estimated</Th>
                  <Th right>Sold at</Th><Th right>Margin/egg</Th>
                  <Th right>Eggs/hen</Th><Th right>vs book</Th>
                </tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className={`border-b border-gray-50 ${r.id === selected.id ? 'bg-brand-50/40' : ''}`}>
                      <Td className="font-semibold text-brand-700">F-{r.flock_no}</Td>
                      <Td className="text-gray-500 text-xs">{r.status}</Td>
                      <Td right>{r.nMonths}</Td>
                      <Td right>{Math.round(r.feedKg).toLocaleString('en-IN')}</Td>
                      <Td right className={r.feedKgUnpriced > 0 ? 'text-amber-700' : 'text-gray-400'}>
                        {r.feedKgUnpriced > 0 ? Math.round(r.feedKgUnpriced).toLocaleString('en-IN') : '—'}
                      </Td>
                      <Td right>{r.eggs ? r.eggs.toLocaleString('en-IN') : '—'}</Td>
                      <Td right>{r.cpeEntered != null ? `Rs ${r.cpeEntered.toFixed(2)}` : '—'}</Td>
                      <Td right className="font-medium text-red-700">{r.cpeEst != null ? `Rs ${r.cpeEst.toFixed(2)}` : '—'}</Td>
                      <Td right>{r.revPerEgg != null ? `Rs ${r.revPerEgg.toFixed(2)}` : '—'}</Td>
                      <Td right className={r.revPerEgg != null && r.cpeEst != null
                        ? (r.revPerEgg - r.cpeEst >= 0 ? 'text-green-700 font-medium' : 'text-red-600 font-medium') : ''}>
                        {r.revPerEgg != null && r.cpeEst != null ? `Rs ${(r.revPerEgg - r.cpeEst).toFixed(2)}` : '—'}
                      </Td>
                      <Td right>{r.eggsPerHen != null && r.eggsPerHen > 0 ? r.eggsPerHen.toFixed(1) : '—'}</Td>
                      <Td right>{r.eggsPerHen != null && r.eggsPerHen > 0 && r.stdTe
                        ? `${(r.eggsPerHen / r.stdTe * 100).toFixed(0)}%` : '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>

          <Card>
            <div className="text-xs text-gray-600 space-y-1.5 leading-relaxed">
              <p><strong>This page writes nothing.</strong> No migration, no column, no saved setting.
                The feed rate lives in the page and is gone when you leave it.</p>
              <p><strong>Scaling is a straight month average</strong> — a line entered for 4 of 17
                months is multiplied by 17/4. It assumes the missing months cost about the same as
                the entered ones. For salary and electricity that is reasonable; for medicine it is
                rougher, since vaccination is heaviest early.</p>
              <p><strong>Salary and electricity are the SITE's whole bill</strong> for the months the
                flock was there, not that flock's share. Two flocks on one site each carry the full
                amount, so their estimates are a ceiling rather than a precise figure.</p>
              <p><strong>A line showing "no data" is missing from BOTH columns.</strong> Nothing can
                be scaled up from nothing, and a made-up figure there would be worse than a gap.</p>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
