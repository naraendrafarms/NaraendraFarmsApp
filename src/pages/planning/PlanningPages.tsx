import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Card, Button, Input, Select, FormRow, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState, StatCard, DateInput, MultiSelect
} from '@/components/ui'
import { inr, daysBetween, today as todayIST } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Save, Trash2 } from 'lucide-react'

// ── Shared helpers ──────────────────────────────────────────────────────────

const MAX_AGE_WEEKS = 90

async function fetchPlans(planType: 'flock_projection' | 'quarterly_budget') {
  const { data, error } = await supabase.from('plans').select('*').eq('plan_type', planType).order('created_at', { ascending: false })
  if (error) { toast.error(error.message); return [] }
  return data ?? []
}

async function fetchPlanLines(planId: string) {
  const { data } = await supabase.from('plan_lines').select('*').eq('plan_id', planId).order('period_label')
  return data ?? []
}

// ── Flock Cost Projection ────────────────────────────────────────────────────

const FlockProjectionTab: React.FC = () => {
  const qc = useQueryClient()
  const [view, setView] = useState<'generated' | 'manual'>('generated')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const { data: plans } = useQuery({ queryKey: ['plans_flock_projection'], queryFn: () => fetchPlans('flock_projection') })
  const { data: lines } = useQuery({
    queryKey: ['plan_lines', selectedPlanId],
    queryFn: () => fetchPlanLines(selectedPlanId as string),
    enabled: !!selectedPlanId,
  })

  const { data: farms } = useQuery({
    queryKey: ['farms_for_planning'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name').eq('is_active', true).order('name'); return data ?? [] }
  })
  const { data: allFlocks } = useQuery({
    queryKey: ['flocks_for_planning'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('id,flock_no,breed,placement_date,status,chick_rate,total_placed_f,total_placed_m,laying_farm_id,rearing_farm_id')
        .order('placement_date', { ascending: false })
      return data ?? []
    }
  })

  // ── Generated view form state ──
  const [gForm, setGForm] = useState({
    title: '', farmId: '', breed: '', placementDate: todayIST(),
    plannedFemale: '', plannedMale: '', refFlockIds: [] as string[],
    feedRate: '', eggRate: '', chickRate: '',
  })

  const breedOptions = useMemo(() => Array.from(new Set((allFlocks ?? []).map((f: any) => f.breed).filter(Boolean))), [allFlocks])
  const referenceCandidates = useMemo(
    () => (allFlocks ?? []).filter((f: any) => (!gForm.breed || f.breed === gForm.breed) && f.status !== 'rearing'),
    [allFlocks, gForm.breed]
  )

  // Auto-pick last 3 matching-breed flocks as the default reference set once breed is chosen.
  React.useEffect(() => {
    if (gForm.breed && gForm.refFlockIds.length === 0) {
      const defaults = referenceCandidates.slice(0, 3).map((f: any) => f.id)
      if (defaults.length) setGForm(f => ({ ...f, refFlockIds: defaults }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gForm.breed])

  const refFlockIds = gForm.refFlockIds
  const { data: refDailyRecords } = useQuery({
    queryKey: ['ref_daily_records', refFlockIds.join(',')],
    queryFn: async () => {
      if (!refFlockIds.length) return []
      const { data } = await supabase.from('daily_records')
        .select('flock_id, record_date, opening_female, opening_male, mortality_female, mortality_male, feed_female_kg, feed_male_kg, total_eggs, he_eggs')
        .in('flock_id', refFlockIds)
      return data ?? []
    },
    enabled: refFlockIds.length > 0,
  })
  const { data: refMedUsage } = useQuery({
    queryKey: ['ref_medicine_usage', refFlockIds.join(',')],
    queryFn: async () => {
      if (!refFlockIds.length) return []
      const { data } = await supabase.from('medicine_usage').select('flock_id, usage_date, amount').in('flock_id', refFlockIds)
      return data ?? []
    },
    enabled: refFlockIds.length > 0,
  })

  // Bucket every reference flock's actuals by age-in-weeks, then average across
  // however many reference flocks have data for that week — this IS the
  // "generated from real data" curve; only the feed/egg rate below is a
  // number the admin supplies (labelled clearly as the price basis).
  const weeklyCurve = useMemo(() => {
    if (!refFlockIds.length) return []
    const placementByFlock = new Map((allFlocks ?? []).filter((f: any) => refFlockIds.includes(f.id)).map((f: any) => [f.id, f.placement_date]))
    const buckets: Record<number, { feedKg: number; mortF: number; mortM: number; eggs: number; heEggs: number; flocksSeen: Set<string> }> = {}
    for (const r of (refDailyRecords ?? [])) {
      const placement = placementByFlock.get(r.flock_id)
      if (!placement) continue
      const wk = Math.min(MAX_AGE_WEEKS, Math.floor(daysBetween(placement, r.record_date) / 7) + 1)
      const b = (buckets[wk] ??= { feedKg: 0, mortF: 0, mortM: 0, eggs: 0, heEggs: 0, flocksSeen: new Set() })
      b.feedKg += (r.feed_female_kg ?? 0) + (r.feed_male_kg ?? 0)
      b.mortF += r.mortality_female ?? 0
      b.mortM += r.mortality_male ?? 0
      b.eggs += r.total_eggs ?? 0
      b.heEggs += r.he_eggs ?? 0
      b.flocksSeen.add(r.flock_id)
    }
    const medByWeek: Record<number, number> = {}
    for (const m of (refMedUsage ?? [])) {
      const placement = placementByFlock.get(m.flock_id)
      if (!placement) continue
      const wk = Math.min(MAX_AGE_WEEKS, Math.floor(daysBetween(placement, m.usage_date) / 7) + 1)
      medByWeek[wk] = (medByWeek[wk] ?? 0) + (m.amount ?? 0)
    }
    return Object.entries(buckets)
      .map(([wk, b]) => ({
        week: Number(wk),
        avgFeedKg: b.feedKg / b.flocksSeen.size,
        avgMortF: b.mortF / b.flocksSeen.size,
        avgMortM: b.mortM / b.flocksSeen.size,
        avgEggs: b.eggs / b.flocksSeen.size,
        avgHeEggs: b.heEggs / b.flocksSeen.size,
        avgMedCost: (medByWeek[Number(wk)] ?? 0) / b.flocksSeen.size,
      }))
      .sort((a, b) => a.week - b.week)
  }, [refDailyRecords, refMedUsage, refFlockIds, allFlocks])

  const feedRate = parseFloat(gForm.feedRate) || 0
  const eggRate = parseFloat(gForm.eggRate) || 0
  const chickRate = parseFloat(gForm.chickRate) || (referenceCandidates[0]?.chick_rate ?? 0)
  const plannedF = parseInt(gForm.plannedFemale) || 0
  const plannedM = parseInt(gForm.plannedMale) || 0

  const projectionRows = useMemo(() => {
    let cumCost = 0, cumRevenue = 0
    const scale = plannedF + plannedM
    const refScale = (referenceCandidates.find((f: any) => refFlockIds.includes(f.id))?.total_placed_f ?? 0)
      + (referenceCandidates.find((f: any) => refFlockIds.includes(f.id))?.total_placed_m ?? 0)
    const ratio = refScale > 0 ? scale / refScale : 1
    return weeklyCurve.map(w => {
      const feedCost = w.avgFeedKg * ratio * feedRate
      const medCost = w.avgMedCost * ratio
      const revenue = w.avgHeEggs * ratio * eggRate
      const weekCost = feedCost + medCost
      cumCost += weekCost
      cumRevenue += revenue
      return { ...w, feedCost, medCost, weekCost, revenue, cumCost: cumCost + chickRate * scale, cumRevenue, netPosition: cumRevenue - (cumCost + chickRate * scale) }
    })
  }, [weeklyCurve, feedRate, eggRate, chickRate, plannedF, plannedM, referenceCandidates, refFlockIds])

  const chickCostTotal = chickRate * (plannedF + plannedM)
  const totalCostToDate = projectionRows.length ? projectionRows[projectionRows.length - 1].cumCost : chickCostTotal
  const peakCapital = projectionRows.reduce((max, r) => Math.min(max, r.netPosition), 0)
  const breakEvenWeek = projectionRows.find(r => r.netPosition >= 0)?.week ?? null

  const saveGeneratedMut = useMutation({
    mutationFn: async () => {
      if (!gForm.title.trim()) throw new Error('Title required')
      const { data: plan, error } = await supabase.from('plans').insert({
        plan_type: 'flock_projection', variant: 'generated', title: gForm.title,
        farm_id: gForm.farmId || null, breed: gForm.breed || null, placement_date: gForm.placementDate,
        planned_female: plannedF, planned_male: plannedM, reference_flock_ids: gForm.refFlockIds,
        price_basis: `Feed rate ₹${feedRate}/kg, Egg rate ₹${eggRate}/egg, Chick rate ₹${chickRate}/bird (entered at save time)`,
      }).select().single()
      if (error) throw error
      const lineRows = projectionRows.map(r => ({
        plan_id: plan.id, period_label: `W${r.week}`, category: 'feed', flow: 'out', amount: r.feedCost,
      })).concat(projectionRows.map(r => ({
        plan_id: plan.id, period_label: `W${r.week}`, category: 'medicine', flow: 'out', amount: r.medCost,
      }))).concat(projectionRows.map(r => ({
        plan_id: plan.id, period_label: `W${r.week}`, category: 'revenue', flow: 'in', amount: r.revenue,
      }))).concat([{ plan_id: plan.id, period_label: 'W0', category: 'chick_cost', flow: 'out', amount: chickCostTotal }])
      if (lineRows.length) { const { error: e2 } = await supabase.from('plan_lines').insert(lineRows); if (e2) throw e2 }
      return plan
    },
    onSuccess: () => { toast.success('Projection saved'); qc.invalidateQueries({ queryKey: ['plans_flock_projection'] }) },
    onError: (e: any) => toast.error(e.message),
  })

  // ── Manual view form state ──
  const [mForm, setMForm] = useState({
    title: '', plannedFemale: '', plannedMale: '', chickRate: '',
    feedGPerBirdDay: '', feedRate: '', mortalityPct: '', medicinePerBird: '',
    labourPerMonth: '', overheadPerMonth: '', projectionWeeks: '18',
  })
  const mPlannedF = parseInt(mForm.plannedFemale) || 0
  const mPlannedM = parseInt(mForm.plannedMale) || 0
  const mScale = mPlannedF + mPlannedM
  const mWeeks = parseInt(mForm.projectionWeeks) || 18
  const mChickCost = (parseFloat(mForm.chickRate) || 0) * mScale
  const mFeedCostTotal = (parseFloat(mForm.feedGPerBirdDay) || 0) / 1000 * mScale * 7 * mWeeks * (parseFloat(mForm.feedRate) || 0)
  const mMedCostTotal = (parseFloat(mForm.medicinePerBird) || 0) * mScale
  const mLabourTotal = (parseFloat(mForm.labourPerMonth) || 0) * (mWeeks / 4.33)
  const mOverheadTotal = (parseFloat(mForm.overheadPerMonth) || 0) * (mWeeks / 4.33)
  const mMortalityLoss = (parseFloat(mForm.mortalityPct) || 0) / 100 * mScale
  const mTotalCost = mChickCost + mFeedCostTotal + mMedCostTotal + mLabourTotal + mOverheadTotal

  const saveManualMut = useMutation({
    mutationFn: async () => {
      if (!mForm.title.trim()) throw new Error('Title required')
      const { data: plan, error } = await supabase.from('plans').insert({
        plan_type: 'flock_projection', variant: 'manual', title: mForm.title,
        planned_female: mPlannedF, planned_male: mPlannedM,
        notes: JSON.stringify(mForm),
      }).select().single()
      if (error) throw error
      const lineRows = [
        { plan_id: plan.id, period_label: 'Total', category: 'chick_cost', flow: 'out', amount: mChickCost },
        { plan_id: plan.id, period_label: 'Total', category: 'feed', flow: 'out', amount: mFeedCostTotal },
        { plan_id: plan.id, period_label: 'Total', category: 'medicine', flow: 'out', amount: mMedCostTotal },
        { plan_id: plan.id, period_label: 'Total', category: 'labour', flow: 'out', amount: mLabourTotal },
        { plan_id: plan.id, period_label: 'Total', category: 'overhead', flow: 'out', amount: mOverheadTotal },
      ]
      const { error: e2 } = await supabase.from('plan_lines').insert(lineRows)
      if (e2) throw e2
      return plan
    },
    onSuccess: () => { toast.success('Manual plan saved'); qc.invalidateQueries({ queryKey: ['plans_flock_projection'] }) },
    onError: (e: any) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('plans').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['plans_flock_projection'] }); setSelectedPlanId(null) },
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setView('generated')}
          className={`px-4 py-2 text-sm font-medium ${view === 'generated' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>
          Generated (from actual flock history)
        </button>
        <button onClick={() => setView('manual')}
          className={`px-4 py-2 text-sm font-medium ${view === 'manual' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>
          Manual Entry (your own assumptions)
        </button>
      </div>

      {view === 'generated' && (
        <Card>
          <SectionHeader title="New Projection — Generated from Historical Flocks" />
          <FormRow cols={3}>
            <Input label="Title" value={gForm.title} onChange={e => setGForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Flock 22 Projection" />
            <Select label="Site" options={[{ value: '', label: '— Select —' }, ...(farms ?? []).map((s: any) => ({ value: s.id, label: s.name }))]}
              value={gForm.farmId} onChange={e => setGForm(f => ({ ...f, farmId: e.target.value }))} />
            <Select label="Breed" options={[{ value: '', label: '— Select —' }, ...breedOptions.map((b: any) => ({ value: b, label: b }))]}
              value={gForm.breed} onChange={e => setGForm(f => ({ ...f, breed: e.target.value, refFlockIds: [] }))} />
          </FormRow>
          <FormRow cols={3}>
            <DateInput label="Planned Placement Date" value={gForm.placementDate} onChange={e => setGForm(f => ({ ...f, placementDate: e.target.value }))} />
            <Input label="Planned Female" type="number" value={gForm.plannedFemale} onChange={e => setGForm(f => ({ ...f, plannedFemale: e.target.value }))} />
            <Input label="Planned Male" type="number" value={gForm.plannedMale} onChange={e => setGForm(f => ({ ...f, plannedMale: e.target.value }))} />
          </FormRow>
          <MultiSelect label="Reference Flocks (used to build the feed/mortality/production curve — auto-picked, adjust if needed)"
            options={referenceCandidates.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no} (${f.breed}, placed ${f.placement_date})` }))}
            value={gForm.refFlockIds} onChange={v => setGForm(f => ({ ...f, refFlockIds: v }))} />
          <FormRow cols={3}>
            <Input label="Feed Rate (₹/kg) — current rate, you enter this" type="number" value={gForm.feedRate} onChange={e => setGForm(f => ({ ...f, feedRate: e.target.value }))} />
            <Input label="Egg Rate (₹/egg) — current rate, you enter this" type="number" value={gForm.eggRate} onChange={e => setGForm(f => ({ ...f, eggRate: e.target.value }))} />
            <Input label="Chick Rate (₹/bird)" type="number" value={gForm.chickRate} onChange={e => setGForm(f => ({ ...f, chickRate: e.target.value }))}
              placeholder={String(referenceCandidates[0]?.chick_rate ?? '')} />
          </FormRow>

          {weeklyCurve.length === 0 && gForm.refFlockIds.length > 0 && (
            <div className="text-sm text-gray-400 py-4">No daily records found for the selected reference flocks.</div>
          )}

          {projectionRows.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-3">
                <StatCard title="Chick Cost" value={inr(chickCostTotal)} />
                <StatCard title="Total Cost (to last data week)" value={inr(totalCostToDate)} />
                <StatCard title="Capital Tied Up at Peak" value={inr(Math.abs(peakCapital))} />
                <StatCard title="Projected Break-even Week" value={breakEvenWeek ? `Week ${breakEvenWeek}` : 'Not reached'} />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <thead><tr>
                    <Th>Week</Th><Th right>Feed Cost</Th><Th right>Medicine Cost</Th><Th right>Revenue (HE)</Th><Th right>Cumulative Net</Th>
                  </tr></thead>
                  <tbody>
                    {projectionRows.map(r => (
                      <tr key={r.week}>
                        <Td>W{r.week}</Td>
                        <Td right>{inr(r.feedCost)}</Td>
                        <Td right>{inr(r.medCost)}</Td>
                        <Td right>{inr(r.revenue)}</Td>
                        <Td right className={r.netPosition >= 0 ? 'text-green-700' : 'text-red-600'}>{inr(r.netPosition)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="mt-3">
                <Button icon={<Save size={14} />} onClick={() => saveGeneratedMut.mutate()} disabled={saveGeneratedMut.isPending}>Save Projection</Button>
              </div>
            </>
          )}
        </Card>
      )}

      {view === 'manual' && (
        <Card>
          <SectionHeader title="New Projection — Your Own Assumptions" />
          <FormRow cols={3}>
            <Input label="Title" value={mForm.title} onChange={e => setMForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. New Site Flock Plan" />
            <Input label="Planned Female" type="number" value={mForm.plannedFemale} onChange={e => setMForm(f => ({ ...f, plannedFemale: e.target.value }))} />
            <Input label="Planned Male" type="number" value={mForm.plannedMale} onChange={e => setMForm(f => ({ ...f, plannedMale: e.target.value }))} />
          </FormRow>
          <FormRow cols={3}>
            <Input label="Chick Rate (₹/bird)" type="number" value={mForm.chickRate} onChange={e => setMForm(f => ({ ...f, chickRate: e.target.value }))} />
            <Input label="Feed (g/bird/day)" type="number" value={mForm.feedGPerBirdDay} onChange={e => setMForm(f => ({ ...f, feedGPerBirdDay: e.target.value }))} />
            <Input label="Feed Rate (₹/kg)" type="number" value={mForm.feedRate} onChange={e => setMForm(f => ({ ...f, feedRate: e.target.value }))} />
          </FormRow>
          <FormRow cols={3}>
            <Input label="Mortality %" type="number" value={mForm.mortalityPct} onChange={e => setMForm(f => ({ ...f, mortalityPct: e.target.value }))} />
            <Input label="Medicine ₹/bird (total)" type="number" value={mForm.medicinePerBird} onChange={e => setMForm(f => ({ ...f, medicinePerBird: e.target.value }))} />
            <Input label="Projection Period (weeks)" type="number" value={mForm.projectionWeeks} onChange={e => setMForm(f => ({ ...f, projectionWeeks: e.target.value }))} />
          </FormRow>
          <FormRow cols={2}>
            <Input label="Labour ₹/month (lump sum)" type="number" value={mForm.labourPerMonth} onChange={e => setMForm(f => ({ ...f, labourPerMonth: e.target.value }))} />
            <Input label="Overhead ₹/month (lump sum)" type="number" value={mForm.overheadPerMonth} onChange={e => setMForm(f => ({ ...f, overheadPerMonth: e.target.value }))} />
          </FormRow>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-3">
            <StatCard title="Chick Cost" value={inr(mChickCost)} />
            <StatCard title="Feed Cost" value={inr(mFeedCostTotal)} />
            <StatCard title="Medicine Cost" value={inr(mMedCostTotal)} />
            <StatCard title="Labour + Overhead" value={inr(mLabourTotal + mOverheadTotal)} />
          </div>
          <div className="text-lg font-bold text-gray-800 mb-3">Total Projected Cost: {inr(mTotalCost)}
            {mMortalityLoss > 0 && <span className="text-sm font-normal text-gray-500 ml-2">(~{mMortalityLoss.toFixed(0)} birds expected loss to mortality)</span>}
          </div>
          <Button icon={<Save size={14} />} onClick={() => saveManualMut.mutate()} disabled={saveManualMut.isPending}>Save Plan</Button>
        </Card>
      )}

      <Card>
        <SectionHeader title="Saved Plans" />
        {!plans?.length ? <EmptyState title="No plans saved yet" /> : (
          <Table>
            <thead><tr><Th>Title</Th><Th>Variant</Th><Th>Status</Th><Th>Created</Th><Th></Th></tr></thead>
            <tbody>
              {plans.map((p: any) => (
                <tr key={p.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedPlanId(p.id === selectedPlanId ? null : p.id)}>
                  <Td>{p.title}</Td>
                  <Td><Badge color={p.variant === 'generated' ? 'green' : 'gray'}>{p.variant}</Badge></Td>
                  <Td>{p.status}</Td>
                  <Td>{new Date(p.created_at).toLocaleDateString('en-GB')}</Td>
                  <Td><button onClick={e => { e.stopPropagation(); deleteMut.mutate(p.id) }}><Trash2 size={14} className="text-red-500" /></button></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {selectedPlanId && lines && (
          <div className="mt-3 overflow-x-auto">
            <Table>
              <thead><tr><Th>Period</Th><Th>Category</Th><Th right>Amount</Th></tr></thead>
              <tbody>{lines.map((l: any) => (
                <tr key={l.id}><Td>{l.period_label}</Td><Td>{l.category}</Td><Td right>{inr(l.amount)}</Td></tr>
              ))}</tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Quarterly Budget / Cash Flow Forecast ────────────────────────────────────

const BUDGET_CATEGORIES = [
  'sales_collection', 'he_sale', 'je_sale', 'te_sale', 'be_sale', 'bird_sale', 'litter_sale', 'bag_sale',
  'expense', 'salary', 'advance', 'capex', 'drawings', 'loan',
]

const QuarterlyBudgetTab: React.FC = () => {
  const qc = useQueryClient()
  const [view, setView] = useState<'generated' | 'manual'>('generated')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const currentYear = new Date(todayIST()).getFullYear()
  const [year, setYear] = useState(currentYear)
  const [quarter, setQuarter] = useState(1)

  const { data: plans } = useQuery({ queryKey: ['plans_quarterly_budget'], queryFn: () => fetchPlans('quarterly_budget') })
  const { data: lines } = useQuery({
    queryKey: ['plan_lines', selectedPlanId],
    queryFn: () => fetchPlanLines(selectedPlanId as string),
    enabled: !!selectedPlanId,
  })

  const quarterMonths = useMemo(() => {
    const startMonth = (quarter - 1) * 3
    return [0, 1, 2].map(i => {
      const m = startMonth + i
      return `${year}-${String(m + 1).padStart(2, '0')}`
    })
  }, [year, quarter])

  // Trailing average: pull the last 6 months of cash_book actuals by category
  // to project this quarter forward. Simple, transparent, and re-runs live —
  // saving freezes it as a snapshot.
  const { data: trailingCashBook } = useQuery({
    queryKey: ['trailing_cash_book', year, quarter],
    queryFn: async () => {
      const startMonth = (quarter - 1) * 3
      const sixMonthsBack = new Date(year, startMonth - 6, 1).toISOString().slice(0, 10)
      const quarterStart = new Date(year, startMonth, 1).toISOString().slice(0, 10)
      const { data } = await supabase.from('cash_book').select('txn_date,category,amount_in,amount_out').gte('txn_date', sixMonthsBack).lt('txn_date', quarterStart)
      return data ?? []
    },
  })
  const { data: currentBalance } = useQuery({
    queryKey: ['current_cash_balance'],
    queryFn: async () => {
      const { data } = await supabase.from('cash_book').select('amount_in,amount_out')
      return (data ?? []).reduce((s: number, t: any) => s + (t.amount_in ?? 0) - (t.amount_out ?? 0), 0)
    }
  })

  const trailingByCategory = useMemo(() => {
    const monthsSeen = new Set((trailingCashBook ?? []).map((t: any) => t.txn_date.slice(0, 7)))
    const divisor = Math.max(1, monthsSeen.size)
    const byCat: Record<string, { in: number; out: number }> = {}
    for (const t of (trailingCashBook ?? [])) {
      const cat = t.category || 'other'
      const c = (byCat[cat] ??= { in: 0, out: 0 })
      c.in += t.amount_in ?? 0
      c.out += t.amount_out ?? 0
    }
    return Object.entries(byCat).map(([cat, v]) => ({ category: cat, avgIn: v.in / divisor, avgOut: v.out / divisor }))
  }, [trailingCashBook])

  const generatedForecast = useMemo(() => {
    let balance = currentBalance ?? 0
    return quarterMonths.map(month => {
      const monthIn = trailingByCategory.reduce((s, c) => s + c.avgIn, 0)
      const monthOut = trailingByCategory.reduce((s, c) => s + c.avgOut, 0)
      balance += monthIn - monthOut
      return { month, monthIn, monthOut, closingBalance: balance }
    })
  }, [quarterMonths, trailingByCategory, currentBalance])

  const saveGeneratedMut = useMutation({
    mutationFn: async () => {
      const { data: plan, error } = await supabase.from('plans').insert({
        plan_type: 'quarterly_budget', variant: 'generated', title: `Q${quarter} ${year} Forecast (generated)`,
        period_year: year, period_quarter: quarter, opening_balance: currentBalance ?? 0,
        price_basis: 'Trailing 6-month average by cash_book category',
      }).select().single()
      if (error) throw error
      const lineRows = trailingByCategory.flatMap(c => quarterMonths.map(month => ([
        { plan_id: plan.id, period_label: month, category: c.category, flow: 'in', amount: c.avgIn },
        { plan_id: plan.id, period_label: month, category: c.category, flow: 'out', amount: c.avgOut },
      ]))).flat()
      if (lineRows.length) { const { error: e2 } = await supabase.from('plan_lines').insert(lineRows); if (e2) throw e2 }
      return plan
    },
    onSuccess: () => { toast.success('Forecast saved'); qc.invalidateQueries({ queryKey: ['plans_quarterly_budget'] }) },
    onError: (e: any) => toast.error(e.message),
  })

  // ── Manual budget entry ──
  const [budgetTitle, setBudgetTitle] = useState('')
  const [budgetLines, setBudgetLines] = useState<Record<string, Record<string, { in: string; out: string }>>>({})

  const setLine = (month: string, cat: string, field: 'in' | 'out', val: string) => {
    setBudgetLines(prev => ({
      ...prev,
      [month]: { ...prev[month], [cat]: { ...prev[month]?.[cat], [field]: val, [field === 'in' ? 'out' : 'in']: prev[month]?.[cat]?.[field === 'in' ? 'out' : 'in'] ?? '' } }
    }))
  }

  const manualTotals = useMemo(() => {
    let totalIn = 0, totalOut = 0
    for (const month of quarterMonths) {
      for (const cat of BUDGET_CATEGORIES) {
        totalIn += parseFloat(budgetLines[month]?.[cat]?.in || '0') || 0
        totalOut += parseFloat(budgetLines[month]?.[cat]?.out || '0') || 0
      }
    }
    return { totalIn, totalOut }
  }, [budgetLines, quarterMonths])

  const saveManualMut = useMutation({
    mutationFn: async () => {
      if (!budgetTitle.trim()) throw new Error('Title required')
      const { data: plan, error } = await supabase.from('plans').insert({
        plan_type: 'quarterly_budget', variant: 'manual', title: budgetTitle,
        period_year: year, period_quarter: quarter,
      }).select().single()
      if (error) throw error
      const lineRows: any[] = []
      for (const month of quarterMonths) {
        for (const cat of BUDGET_CATEGORIES) {
          const inAmt = parseFloat(budgetLines[month]?.[cat]?.in || '0') || 0
          const outAmt = parseFloat(budgetLines[month]?.[cat]?.out || '0') || 0
          if (inAmt) lineRows.push({ plan_id: plan.id, period_label: month, category: cat, flow: 'in', amount: inAmt })
          if (outAmt) lineRows.push({ plan_id: plan.id, period_label: month, category: cat, flow: 'out', amount: outAmt })
        }
      }
      if (lineRows.length) { const { error: e2 } = await supabase.from('plan_lines').insert(lineRows); if (e2) throw e2 }
      return plan
    },
    onSuccess: () => { toast.success('Budget saved'); qc.invalidateQueries({ queryKey: ['plans_quarterly_budget'] }); setBudgetTitle(''); setBudgetLines({}) },
    onError: (e: any) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('plans').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['plans_quarterly_budget'] }); setSelectedPlanId(null) },
  })

  return (
    <div className="space-y-4">
      <FormRow cols={2}>
        <Input label="Year" type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || currentYear)} />
        <Select label="Quarter" options={[1, 2, 3, 4].map(q => ({ value: String(q), label: `Q${q}` }))} value={String(quarter)} onChange={e => setQuarter(parseInt(e.target.value))} />
      </FormRow>

      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setView('generated')}
          className={`px-4 py-2 text-sm font-medium ${view === 'generated' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>
          Generated (from actual cash book)
        </button>
        <button onClick={() => setView('manual')}
          className={`px-4 py-2 text-sm font-medium ${view === 'manual' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>
          Manual Budget
        </button>
      </div>

      {view === 'generated' && (
        <Card>
          <SectionHeader title={`Q${quarter} ${year} Cash Flow Forecast — trailing 6-month average`} />
          <div className="text-sm text-gray-500 mb-3">Opening balance (today's actual cash+bank): {inr(currentBalance ?? 0)}</div>
          <div className="overflow-x-auto">
            <Table>
              <thead><tr><Th>Month</Th><Th right>Projected In</Th><Th right>Projected Out</Th><Th right>Closing Balance</Th></tr></thead>
              <tbody>
                {generatedForecast.map(f => (
                  <tr key={f.month}>
                    <Td>{f.month}</Td>
                    <Td right>{inr(f.monthIn)}</Td>
                    <Td right>{inr(f.monthOut)}</Td>
                    <Td right className={f.closingBalance < 0 ? 'text-red-600 font-semibold' : ''}>{inr(f.closingBalance)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="mt-3"><Button icon={<Save size={14} />} onClick={() => saveGeneratedMut.mutate()} disabled={saveGeneratedMut.isPending}>Save Forecast</Button></div>
        </Card>
      )}

      {view === 'manual' && (
        <Card>
          <SectionHeader title={`Q${quarter} ${year} Manual Budget`} />
          <Input label="Title" value={budgetTitle} onChange={e => setBudgetTitle(e.target.value)} placeholder="e.g. Q1 2026 Budget" className="mb-3" />
          {quarterMonths.map(month => (
            <div key={month} className="mb-4">
              <div className="font-semibold text-sm text-gray-700 mb-1">{month}</div>
              <div className="overflow-x-auto">
                <Table>
                  <thead><tr><Th>Category</Th><Th right>Budgeted In</Th><Th right>Budgeted Out</Th></tr></thead>
                  <tbody>
                    {BUDGET_CATEGORIES.map(cat => (
                      <tr key={cat}>
                        <Td>{cat}</Td>
                        <Td right><input type="number" className="w-24 text-right border rounded px-1 py-0.5 text-sm"
                          value={budgetLines[month]?.[cat]?.in ?? ''} onChange={e => setLine(month, cat, 'in', e.target.value)} /></Td>
                        <Td right><input type="number" className="w-24 text-right border rounded px-1 py-0.5 text-sm"
                          value={budgetLines[month]?.[cat]?.out ?? ''} onChange={e => setLine(month, cat, 'out', e.target.value)} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          ))}
          <div className="text-sm text-gray-600 mb-3">Total Budgeted In: {inr(manualTotals.totalIn)} | Total Budgeted Out: {inr(manualTotals.totalOut)} | Net: {inr(manualTotals.totalIn - manualTotals.totalOut)}</div>
          <Button icon={<Save size={14} />} onClick={() => saveManualMut.mutate()} disabled={saveManualMut.isPending}>Save Budget</Button>
        </Card>
      )}

      <Card>
        <SectionHeader title="Saved Budgets/Forecasts" />
        {!plans?.length ? <EmptyState title="No budgets saved yet" /> : (
          <Table>
            <thead><tr><Th>Title</Th><Th>Variant</Th><Th>Period</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {plans.map((p: any) => (
                <tr key={p.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedPlanId(p.id === selectedPlanId ? null : p.id)}>
                  <Td>{p.title}</Td>
                  <Td><Badge color={p.variant === 'generated' ? 'green' : 'gray'}>{p.variant}</Badge></Td>
                  <Td>Q{p.period_quarter} {p.period_year}</Td>
                  <Td>{p.status}</Td>
                  <Td><button onClick={e => { e.stopPropagation(); deleteMut.mutate(p.id) }}><Trash2 size={14} className="text-red-500" /></button></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {selectedPlanId && lines && (
          <div className="mt-3 overflow-x-auto">
            <Table>
              <thead><tr><Th>Month</Th><Th>Category</Th><Th>Flow</Th><Th right>Amount</Th></tr></thead>
              <tbody>{lines.map((l: any) => (
                <tr key={l.id}><Td>{l.period_label}</Td><Td>{l.category}</Td><Td>{l.flow}</Td><Td right>{inr(l.amount)}</Td></tr>
              ))}</tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ── CA Analysis of Financial Result ──────────────────────────────────────────
// Matches the owner's real CA statement layout exactly (Turnover -> Cost of
// Production -> Gross Profit -> Indirect Expenses -> Net Profit -> Working
// Capital -> Ratios). Whatever has a clean, honest single data source in the
// app is computed automatically; everything the app genuinely has no record
// of (RM Consumed split, Other Direct/Indirect Expenses, Payment to
// Promoters, Depreciation, Net Worth, Inventories valuation, Loans &
// Advances, Other Current Assets, Current Liabilities-Expenses) is a plain
// manual field, not a guess.

// Turnover is sourced from invoiced sales (nhe_sales header amount + he_dispatch
// amount), not cash_book receipts — a CA's Turnover is invoiced sales, and HE
// dispatch only hits cash_book on payment receipt (see CLAUDE.md §5), so a cash
// figure here would disagree with the accrual Sundry Debtors below.
const PRODUCT_SALE_TYPES = ['je', 'te', 'be', 'bird_sale', 'bird_cull', 'bird_lame', 'bird_weak', 'bird_sex_error', 'manure']
const OTHER_INCOME_SALE_TYPES = ['gas', 'other']
const EGG_SALE_TYPES = ['je', 'te', 'be']
// Two explicit allowlists, no default bucket — a designation in neither list
// (new hire, typo, a role not yet seen) goes to its own "Unclassified Wages"
// line instead of silently defaulting into Direct Wages or Employee Benefits.
const OFFICE_DESIGNATIONS = ['Administration Head', 'Operations Head', 'Manager Finance', 'Administrative Manager', 'Accountant']
const DIRECT_DESIGNATIONS = ['Site Manager', 'Site Supervisor', 'Security', 'Store Keeper', 'Poultry Assistant', 'Attender', 'Driver', 'Electrician', 'Helper', 'Medium Vehicle Driver']
const grossSalary = (r: any) => (r.earned_salary ?? 0) + (r.ot_bonus ?? 0) + (r.arrears ?? 0)

const CAStatementTab: React.FC = () => {
  const qc = useQueryClient()
  const currentYear = new Date(todayIST()).getFullYear()
  const [periodStart, setPeriodStart] = useState(`${currentYear}-04-01`)
  const [periodEnd, setPeriodEnd] = useState(todayIST())
  const [title, setTitle] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: savedStatements } = useQuery({
    queryKey: ['ca_financial_statements'],
    queryFn: async () => { const { data, error } = await supabase.from('ca_financial_statements').select('*').order('created_at', { ascending: false }); if (error) toast.error(error.message); return data ?? [] }
  })

  const { data: nheSales } = useQuery({
    queryKey: ['ca_nhe_sales', periodStart, periodEnd],
    queryFn: async () => { const { data } = await supabase.from('nhe_sales').select('sale_type,amount,sale_date').gte('sale_date', periodStart).lte('sale_date', periodEnd); return data ?? [] }
  })
  const { data: heDispatch } = useQuery({
    queryKey: ['ca_he_dispatch', periodStart, periodEnd],
    queryFn: async () => { const { data } = await supabase.from('he_dispatch').select('amount,invoice_eggs,dispatch_date').gte('dispatch_date', periodStart).lte('dispatch_date', periodEnd); return data ?? [] }
  })
  // Egg quantity/value per sale_type comes from nhe_sale_lines (not the
  // nhe_sales header) so a multi-type invoice attributes value per egg type
  // correctly — migration 117 backfilled a line for every historical je/te/be
  // header row, so line coverage matches the header data used for Turnover.
  const { data: eggSaleLines } = useQuery({
    queryKey: ['ca_nhe_sale_lines', periodStart, periodEnd],
    queryFn: async () => {
      const { data } = await supabase.from('nhe_sale_lines').select('sale_type,quantity,amount,nhe_sales!inner(sale_date)').in('sale_type', EGG_SALE_TYPES)
        .gte('nhe_sales.sale_date', periodStart).lte('nhe_sales.sale_date', periodEnd)
      return data ?? []
    }
  })
  // cash_book category no longer used for Product Sales/Other Income
  // (Turnover is accrual now) — only for the pure-cash "other" misc income
  // that has no invoice source, and for the Cash & Bank balance below.
  const { data: cashBookOtherIncome } = useQuery({
    queryKey: ['ca_cash_book_other', periodStart, periodEnd],
    queryFn: async () => {
      const { data } = await supabase.from('cash_book').select('amount_in,nhe_sale_id,he_dispatch_id').eq('category', 'other')
        .is('nhe_sale_id', null).is('he_dispatch_id', null).gte('txn_date', periodStart).lte('txn_date', periodEnd)
      return data ?? []
    }
  })
  const { data: electricityBills } = useQuery({
    queryKey: ['ca_electricity', periodStart, periodEnd],
    queryFn: async () => { const { data } = await supabase.from('electricity_bills').select('amount,bill_month').gte('bill_month', periodStart).lte('bill_month', periodEnd); return data ?? [] }
  })
  const { data: salaryRows } = useQuery({
    queryKey: ['ca_salary', periodStart, periodEnd],
    queryFn: async () => {
      const { data } = await supabase.from('salary_monthly').select('earned_salary,ot_bonus,arrears,month,employees(designation)').gte('month', periodStart).lte('month', periodEnd)
      return data ?? []
    }
  })
  const { data: eggProduction } = useQuery({
    queryKey: ['ca_production_qty', periodStart, periodEnd],
    queryFn: async () => { const { data } = await supabase.from('daily_records').select('total_eggs').gte('record_date', periodStart).lte('record_date', periodEnd); return data ?? [] }
  })
  const { data: partyBalances } = useQuery({
    queryKey: ['ca_party_ledger', periodEnd],
    queryFn: async () => {
      const { data } = await supabase.from('v_party_ledger').select('party_id,debit,credit,parties(type)').lte('txn_date', periodEnd)
      return data ?? []
    }
  })
  const { data: cashBankBalance } = useQuery({
    queryKey: ['ca_cash_bank_balance', periodEnd],
    queryFn: async () => {
      const [{ data: cb }, { data: bt }] = await Promise.all([
        supabase.from('cash_book').select('amount_in,amount_out').lte('txn_date', periodEnd),
        supabase.from('bank_transactions').select('txn_type,amount').lte('txn_date', periodEnd),
      ])
      const cashBal = (cb ?? []).reduce((s: number, t: any) => s + (t.amount_in ?? 0) - (t.amount_out ?? 0), 0)
      const bankBal = (bt ?? []).reduce((s: number, t: any) => s + (t.txn_type === 'Credit' ? (t.amount ?? 0) : -(t.amount ?? 0)), 0)
      return cashBal + bankBal
    }
  })

  const productSales = useMemo(() => {
    const fromNhe = (nheSales ?? []).filter((t: any) => PRODUCT_SALE_TYPES.includes(t.sale_type)).reduce((s: number, t: any) => s + (t.amount ?? 0), 0)
    const fromHe = (heDispatch ?? []).reduce((s: number, d: any) => s + (d.amount ?? 0), 0)
    return fromNhe + fromHe
  }, [nheSales, heDispatch])
  const otherIncome = useMemo(() => {
    const fromNhe = (nheSales ?? []).filter((t: any) => OTHER_INCOME_SALE_TYPES.includes(t.sale_type)).reduce((s: number, t: any) => s + (t.amount ?? 0), 0)
    const fromCashOnly = (cashBookOtherIncome ?? []).reduce((s: number, t: any) => s + (t.amount_in ?? 0), 0)
    return fromNhe + fromCashOnly
  }, [nheSales, cashBookOtherIncome])
  const electricity = useMemo(() => (electricityBills ?? []).reduce((s: number, b: any) => s + (b.amount ?? 0), 0), [electricityBills])
  const wageBuckets = useMemo(() => {
    const buckets = { direct: 0, office: 0, unclassified: 0, unclassifiedDesignations: new Set<string>() }
    for (const r of (salaryRows ?? []) as any[]) {
      const designation = r.employees?.designation
      const amt = grossSalary(r)
      if (DIRECT_DESIGNATIONS.includes(designation)) buckets.direct += amt
      else if (OFFICE_DESIGNATIONS.includes(designation)) buckets.office += amt
      else { buckets.unclassified += amt; buckets.unclassifiedDesignations.add(designation || '(no designation)') }
    }
    return buckets
  }, [salaryRows])
  const directWages = wageBuckets.direct
  const employeeBenefits = wageBuckets.office
  const unclassifiedWages = wageBuckets.unclassified
  const totalProductionQty = useMemo(() => (eggProduction ?? []).reduce((s: number, r: any) => s + (r.total_eggs ?? 0), 0), [eggProduction])
  const nheEggPricing = useMemo(() => {
    let qty = 0, amt = 0
    for (const l of (eggSaleLines ?? []) as any[]) { qty += l.quantity ?? 0; amt += l.amount ?? 0 }
    return { qty, amt, avgPrice: qty > 0 ? amt / qty : 0 }
  }, [eggSaleLines])
  const heEggPricing = useMemo(() => {
    const qty = (heDispatch ?? []).reduce((s: number, d: any) => s + (d.invoice_eggs ?? 0), 0)
    const amt = (heDispatch ?? []).reduce((s: number, d: any) => s + (d.amount ?? 0), 0)
    return { qty, amt, avgPrice: qty > 0 ? amt / qty : 0 }
  }, [heDispatch])
  const sundryDebtors = useMemo(() => {
    const byParty: Record<string, number> = {}
    for (const r of (partyBalances ?? []) as any[]) {
      if (!['buyer', 'both'].includes(r.parties?.type)) continue
      byParty[r.party_id] = (byParty[r.party_id] ?? 0) + (r.debit ?? 0) - (r.credit ?? 0)
    }
    return Object.values(byParty).filter(v => v > 0).reduce((s, v) => s + v, 0)
  }, [partyBalances])
  const creditorsGoods = useMemo(() => {
    const byParty: Record<string, number> = {}
    for (const r of (partyBalances ?? []) as any[]) {
      if (!['supplier', 'both'].includes(r.parties?.type)) continue
      byParty[r.party_id] = (byParty[r.party_id] ?? 0) + (r.credit ?? 0) - (r.debit ?? 0)
    }
    return Object.values(byParty).filter(v => v > 0).reduce((s, v) => s + v, 0)
  }, [partyBalances])

  // Manual-entry fields — no clean single data source exists for these yet.
  const [manual, setManual] = useState({
    rmConsumed: '', otherDirectExpenses: '', paymentToPromoters: '', otherIndirectExpenses: '', depreciation: '',
    netWorth: '', inventories: '', loansAdvances: '', otherCurrentAssets: '', currentLiabilitiesExpenses: '',
  })
  const setM = (k: keyof typeof manual, v: string) => setManual(m => ({ ...m, [k]: v }))
  const num = (v: string) => parseFloat(v) || 0
  const entered = (v: string) => v.trim() !== ''

  // A blank manual field defaults to 0 in the arithmetic below, which would
  // otherwise silently understate cost / overstate liquidity with a
  // confident-looking wrong number. Track which totals actually depend on a
  // still-blank manual field so the UI can show "—" instead of trusting it.
  // Unclassified wages (a designation in neither allowlist) block Gross/Net
  // Profit the same way a blank manual field does — a new designation added
  // in config_options can never silently shift the COP split unnoticed.
  const copIncomplete = !entered(manual.rmConsumed) || !entered(manual.otherDirectExpenses) || unclassifiedWages > 0
  const indirectIncomplete = !entered(manual.paymentToPromoters) || !entered(manual.otherIndirectExpenses) || !entered(manual.depreciation)
  const netProfitIncomplete = copIncomplete || indirectIncomplete
  const currentAssetsIncomplete = !entered(manual.inventories) || !entered(manual.loansAdvances) || !entered(manual.otherCurrentAssets)
  const currentLiabIncomplete = !entered(manual.currentLiabilitiesExpenses)
  const workingCapitalIncomplete = currentAssetsIncomplete || currentLiabIncomplete

  const totalTurnover = productSales + otherIncome
  const totalCOP = num(manual.rmConsumed) + directWages + electricity + num(manual.otherDirectExpenses)
  const grossProfit = totalTurnover - totalCOP
  const totalIndirect = employeeBenefits + num(manual.paymentToPromoters) + num(manual.otherIndirectExpenses) + num(manual.depreciation)
  const netProfit = grossProfit - totalIndirect
  const totalCurrentAssets = num(manual.inventories) + num(manual.loansAdvances) + sundryDebtors + (cashBankBalance ?? 0) + num(manual.otherCurrentAssets)
  const totalCurrentLiabilities = creditorsGoods + num(manual.currentLiabilitiesExpenses)
  const workingCapital = totalCurrentAssets - totalCurrentLiabilities
  const gpRatio = totalTurnover > 0 ? grossProfit / totalTurnover : 0
  const npRatio = totalTurnover > 0 ? netProfit / totalTurnover : 0
  const currentRatio = totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 0
  const quickRatio = totalCurrentLiabilities > 0 ? (totalCurrentAssets - num(manual.inventories)) / totalCurrentLiabilities : 0
  const dash = (incomplete: boolean, text: string) => incomplete ? '— (enter manual fields)' : text
  const debtorsTurnoverRatio = totalTurnover > 0 ? sundryDebtors / totalTurnover : 0
  const creditorsTurnoverRatio = totalTurnover > 0 ? creditorsGoods / totalTurnover : 0

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Title required')
      const { error } = await supabase.from('ca_financial_statements').insert({
        title, period_start: periodStart, period_end: periodEnd,
        product_sales: productSales, other_income: otherIncome,
        rm_consumed: num(manual.rmConsumed), direct_wages: directWages, electricity, other_direct_expenses: num(manual.otherDirectExpenses),
        employee_benefits: employeeBenefits, payment_to_promoters: num(manual.paymentToPromoters), other_indirect_expenses: num(manual.otherIndirectExpenses), depreciation: num(manual.depreciation),
        total_production_qty: totalProductionQty,
        net_worth: num(manual.netWorth), inventories: num(manual.inventories), loans_advances: num(manual.loansAdvances),
        sundry_debtors: sundryDebtors, cash_bank: cashBankBalance ?? 0, other_current_assets: num(manual.otherCurrentAssets),
        current_liabilities_goods: creditorsGoods, current_liabilities_expenses: num(manual.currentLiabilitiesExpenses),
      })
      if (error) throw error
    },
    onSuccess: () => { toast.success('Statement saved'); qc.invalidateQueries({ queryKey: ['ca_financial_statements'] }) },
    onError: (e: any) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('ca_financial_statements').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['ca_financial_statements'] }); setSelectedId(null) },
  })

  const selected = (savedStatements ?? []).find((s: any) => s.id === selectedId)

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader title="Analysis of Financial Result — same layout as your CA's statement" />
        <FormRow cols={3}>
          <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. FY 25-26" />
          <DateInput label="Period Start" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
          <DateInput label="Period End" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
        </FormRow>

        <div className="overflow-x-auto mt-3">
          <Table>
            <thead><tr><Th>Particulars</Th><Th right>Amount</Th><Th>Source</Th></tr></thead>
            <tbody>
              <tr><Td className="font-semibold" colSpan={3}>1. TURNOVER</Td></tr>
              <tr><Td>Product Sales</Td><Td right>{inr(productSales)}</Td><Td className="text-xs text-gray-400">NHE Sales + HE Dispatch (invoiced, accrual basis)</Td></tr>
              <tr><Td>Other Income</Td><Td right>{inr(otherIncome)}</Td><Td className="text-xs text-gray-400">NHE Sales (gas/other) + Cash Book misc income with no invoice</Td></tr>
              <tr><Td className="font-semibold">Total Turnover</Td><Td right className="font-semibold">{inr(totalTurnover)}</Td><Td /></tr>

              <tr><Td className="font-semibold" colSpan={3}>2. COST OF PRODUCTION</Td></tr>
              <tr><Td>RM Consumed</Td><Td right><input type="number" className="w-32 text-right border rounded px-1 py-0.5 text-sm" value={manual.rmConsumed} onChange={e => setM('rmConsumed', e.target.value)} /></Td><Td className="text-xs text-amber-600">Manual — no dedicated source yet</Td></tr>
              <tr><Td>Direct Wages</Td><Td right>{inr(directWages)}</Td><Td className="text-xs text-gray-400">Salary (gross), site/operational designations</Td></tr>
              <tr><Td>Electricity</Td><Td right>{inr(electricity)}</Td><Td className="text-xs text-gray-400">Electricity Bills</Td></tr>
              {unclassifiedWages > 0 && (
                <tr><Td className="text-amber-700">Unclassified Wages (not in Direct Wages/Employee Benefits above)</Td><Td right className="text-amber-700">{inr(unclassifiedWages)}</Td>
                  <Td className="text-xs text-amber-600">Designation(s) not in the known list: {Array.from(wageBuckets.unclassifiedDesignations).join(', ')} — blocks Gross/Net Profit below until resolved.</Td></tr>
              )}
              <tr><Td>Other Direct Expenses</Td><Td right><input type="number" className="w-32 text-right border rounded px-1 py-0.5 text-sm" value={manual.otherDirectExpenses} onChange={e => setM('otherDirectExpenses', e.target.value)} /></Td><Td className="text-xs text-amber-600">Manual</Td></tr>
              <tr><Td className="font-semibold">Total Cost of Production</Td><Td right className="font-semibold">{dash(copIncomplete, inr(totalCOP))}</Td><Td /></tr>

              <tr><Td className="font-semibold">3. Gross Profit [1-2]</Td><Td right className="font-semibold">{dash(copIncomplete, inr(grossProfit))}</Td><Td /></tr>

              <tr><Td className="font-semibold" colSpan={3}>4. INDIRECT EXPENSES</Td></tr>
              <tr><Td>Employee Benefits</Td><Td right>{inr(employeeBenefits)}</Td><Td className="text-xs text-gray-400">Salary (office/admin designations)</Td></tr>
              <tr><Td>Payment to Promoters</Td><Td right><input type="number" className="w-32 text-right border rounded px-1 py-0.5 text-sm" value={manual.paymentToPromoters} onChange={e => setM('paymentToPromoters', e.target.value)} /></Td><Td className="text-xs text-amber-600">Manual</Td></tr>
              <tr><Td>Other Indirect Expenses</Td><Td right><input type="number" className="w-32 text-right border rounded px-1 py-0.5 text-sm" value={manual.otherIndirectExpenses} onChange={e => setM('otherIndirectExpenses', e.target.value)} /></Td><Td className="text-xs text-amber-600">Manual</Td></tr>
              <tr><Td>Depreciation</Td><Td right><input type="number" className="w-32 text-right border rounded px-1 py-0.5 text-sm" value={manual.depreciation} onChange={e => setM('depreciation', e.target.value)} /></Td><Td className="text-xs text-amber-600">Manual — no fixed asset register yet</Td></tr>
              <tr><Td className="font-semibold">Total Indirect Expenses</Td><Td right className="font-semibold">{dash(indirectIncomplete, inr(totalIndirect))}</Td><Td /></tr>

              <tr><Td className="font-semibold">5. Net Profit [3-4]</Td><Td right className={`font-semibold ${netProfitIncomplete ? '' : netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{dash(netProfitIncomplete, inr(netProfit))}</Td><Td /></tr>

              <tr><Td className="font-semibold" colSpan={3}>6. QUANTITATIVE INFORMATION</Td></tr>
              <tr><Td>Total Production (Eggs)</Td><Td right>{totalProductionQty.toLocaleString('en-IN')}</Td><Td className="text-xs text-gray-400">Daily Records (produced, not sold)</Td></tr>
              <tr><Td>NHE Eggs Sold (JE+TE+BE)</Td><Td right>{nheEggPricing.qty.toLocaleString('en-IN')}</Td><Td className="text-xs text-gray-400">NHE Sale Lines</Td></tr>
              <tr><Td>Avg NHE Egg Price (₹/egg)</Td><Td right>{nheEggPricing.avgPrice.toFixed(2)}</Td><Td className="text-xs text-gray-400">NHE egg sale value ÷ eggs sold</Td></tr>
              <tr><Td>HE Eggs Dispatched</Td><Td right>{heEggPricing.qty.toLocaleString('en-IN')}</Td><Td className="text-xs text-gray-400">HE Dispatch</Td></tr>
              <tr><Td>Avg HE Rate (₹/egg)</Td><Td right>{heEggPricing.avgPrice.toFixed(2)}</Td><Td className="text-xs text-gray-400">HE dispatch value ÷ invoice eggs — priced on a different basis to NHE, kept separate</Td></tr>

              <tr><Td>Net Worth</Td><Td right><input type="number" className="w-32 text-right border rounded px-1 py-0.5 text-sm" value={manual.netWorth} onChange={e => setM('netWorth', e.target.value)} /></Td><Td className="text-xs text-amber-600">Manual — no equity ledger yet</Td></tr>

              <tr><Td className="font-semibold" colSpan={3}>WORKING CAPITAL</Td></tr>
              <tr><Td>Inventories</Td><Td right><input type="number" className="w-32 text-right border rounded px-1 py-0.5 text-sm" value={manual.inventories} onChange={e => setM('inventories', e.target.value)} /></Td><Td className="text-xs text-amber-600">Manual — stock valuation not built yet</Td></tr>
              <tr><Td>Loans &amp; Advances</Td><Td right><input type="number" className="w-32 text-right border rounded px-1 py-0.5 text-sm" value={manual.loansAdvances} onChange={e => setM('loansAdvances', e.target.value)} /></Td><Td className="text-xs text-amber-600">Manual</Td></tr>
              <tr><Td>Sundry Debtors</Td><Td right>{inr(sundryDebtors)}</Td><Td className="text-xs text-gray-400">Party Ledger (buyer balances)</Td></tr>
              <tr><Td>Cash &amp; Bank</Td><Td right>{inr(cashBankBalance ?? 0)}</Td><Td className="text-xs text-gray-400">Cash Book + Bank Ledger</Td></tr>
              <tr><Td>Other Current Assets</Td><Td right><input type="number" className="w-32 text-right border rounded px-1 py-0.5 text-sm" value={manual.otherCurrentAssets} onChange={e => setM('otherCurrentAssets', e.target.value)} /></Td><Td className="text-xs text-amber-600">Manual</Td></tr>
              <tr><Td className="font-semibold">Total Current Assets</Td><Td right className="font-semibold">{dash(currentAssetsIncomplete, inr(totalCurrentAssets))}</Td><Td /></tr>
              <tr><Td>Current Liabilities (Goods)</Td><Td right>{inr(creditorsGoods)}</Td><Td className="text-xs text-gray-400">Party Ledger (supplier balances)</Td></tr>
              <tr><Td>Current Liabilities (Expenses)</Td><Td right><input type="number" className="w-32 text-right border rounded px-1 py-0.5 text-sm" value={manual.currentLiabilitiesExpenses} onChange={e => setM('currentLiabilitiesExpenses', e.target.value)} /></Td><Td className="text-xs text-amber-600">Manual</Td></tr>
              <tr><Td className="font-semibold">Total Current Liabilities</Td><Td right className="font-semibold">{dash(currentLiabIncomplete, inr(totalCurrentLiabilities))}</Td><Td /></tr>
              <tr><Td className="font-semibold">Working Capital [CA-CL]</Td><Td right className="font-semibold">{dash(workingCapitalIncomplete, inr(workingCapital))}</Td><Td /></tr>

              <tr><Td className="font-semibold" colSpan={3}>RATIOS</Td></tr>
              <tr><Td>Gross Profit Ratio</Td><Td right>{dash(copIncomplete, (gpRatio * 100).toFixed(2) + '%')}</Td><Td /></tr>
              <tr><Td>Net Profit Ratio</Td><Td right>{dash(netProfitIncomplete, (npRatio * 100).toFixed(2) + '%')}</Td><Td /></tr>
              <tr><Td>Current Ratio</Td><Td right>{dash(workingCapitalIncomplete, currentRatio.toFixed(2))}</Td><Td /></tr>
              <tr><Td>Quick Ratio</Td><Td right>{dash(workingCapitalIncomplete, quickRatio.toFixed(2))}</Td><Td /></tr>
              <tr><Td>Debtors Turnover Ratio</Td><Td right>{debtorsTurnoverRatio.toFixed(4)}</Td><Td className="text-xs text-gray-400">As per CA workings (÷ Total Turnover)</Td></tr>
              <tr><Td>Creditors Turnover Ratio</Td><Td right>{creditorsTurnoverRatio.toFixed(4)}</Td><Td className="text-xs text-gray-400">As per CA workings (÷ Total Turnover)</Td></tr>
            </tbody>
          </Table>
        </div>
        <div className="mt-3"><Button icon={<Save size={14} />} onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>Save Statement</Button></div>
      </Card>

      <Card>
        <SectionHeader title="Saved Statements" />
        {!savedStatements?.length ? <EmptyState title="No statements saved yet" /> : (
          <Table>
            <thead><tr><Th>Title</Th><Th>Period</Th><Th>Status</Th><Th right>Net Profit</Th><Th></Th></tr></thead>
            <tbody>
              {savedStatements.map((s: any) => (
                <tr key={s.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}>
                  <Td>{s.title}</Td>
                  <Td>{s.period_start} to {s.period_end}</Td>
                  <Td>{s.status}</Td>
                  <Td right>{inr((s.product_sales + s.other_income) - (s.rm_consumed + s.direct_wages + s.electricity + s.other_direct_expenses) - (s.employee_benefits + s.payment_to_promoters + s.other_indirect_expenses + s.depreciation))}</Td>
                  <Td><button onClick={e => { e.stopPropagation(); deleteMut.mutate(s.id) }}><Trash2 size={14} className="text-red-500" /></button></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {selected && (
          <div className="mt-3 text-sm text-gray-600">
            Turnover: {inr(selected.product_sales + selected.other_income)} | Working Capital: {inr((selected.inventories + selected.loans_advances + selected.sundry_debtors + selected.cash_bank + selected.other_current_assets) - (selected.current_liabilities_goods + selected.current_liabilities_expenses))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Page shell ────────────────────────────────────────────────────────────

export const PlanningPage: React.FC = () => {
  const [tab, setTab] = useState<'flock' | 'budget' | 'ca'>('flock')
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Planning</h1>
        <p className="text-sm text-gray-500">Admin only. Forward-looking flock cost projections and quarterly cash-flow budgets — not visible to any other role.</p>
      </div>
      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setTab('flock')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'flock' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>
          Upcoming Flock Cost Projection
        </button>
        <button onClick={() => setTab('budget')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'budget' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>
          Quarterly Budget &amp; Cash Flow
        </button>
        <button onClick={() => setTab('ca')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'ca' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>
          CA Analysis of Financial Result
        </button>
      </div>
      {tab === 'flock' && <FlockProjectionTab />}
      {tab === 'budget' && <QuarterlyBudgetTab />}
      {tab === 'ca' && <CAStatementTab />}
    </div>
  )
}
