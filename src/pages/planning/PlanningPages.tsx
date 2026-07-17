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

// ── Page shell ────────────────────────────────────────────────────────────

export const PlanningPage: React.FC = () => {
  const [tab, setTab] = useState<'flock' | 'budget'>('flock')
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
      </div>
      {tab === 'flock' && <FlockProjectionTab />}
      {tab === 'budget' && <QuarterlyBudgetTab />}
    </div>
  )
}
