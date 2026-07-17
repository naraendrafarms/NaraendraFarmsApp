import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, Button, Spinner, DateInput, MultiSelect } from '@/components/ui'
import toast from 'react-hot-toast'
import { Copy, CheckCircle, Download } from 'lucide-react'
import { today as todayIST, daysBetween, exportCSV } from '@/lib/utils'

const pad2 = (n: number) => Math.abs(n).toString().padStart(2, '0')
const fmtDMY2 = (d: string) => { const [y, m, day] = d.split('-'); return `${day}.${m}.${y.slice(2)}` }
const pct1 = (n: number) => n.toFixed(2) + '%'
const sign = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2)

// Numbered list of only the entries that actually happened that day — no
// blank placeholder lines when there's nothing to report.
function listOrNone(items: string[]): string[] {
  return items.length ? items.map((s, i) => `${i + 1}.${s}`) : ['None']
}

export const DailySummaryPage: React.FC = () => {
  // toISOString() is UTC — before 5:30am IST it opened on yesterday's date
  const today = todayIST()
  const [date, setDate] = useState(today)
  const [siteIds, setSiteIds] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const prevDate = React.useMemo(() => {
    const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  }, [date])

  const { data: farms } = useQuery({
    queryKey: ['farms_daily_summary'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').eq('is_active', true).order('name'); return data ?? [] }
  })

  const { data: flocks, isLoading } = useQuery({
    queryKey: ['active_flocks_summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flocks')
        .select('id, flock_no, breed, status, placement_date, laying_season, rearing_farm_id, laying_farm_id, rearing_farm:farms!rearing_farm_id(name, code), laying_farm:farms!laying_farm_id(name, code)')
        .in('status', ['rearing', 'laying'])
        .order('flock_no')
      if (error) { toast.error(error.message); return [] }
      return (data ?? []).map((f: any) => ({
        ...f,
        farm_id: f.status === 'rearing' ? f.rearing_farm_id : f.laying_farm_id,
        farms: f.status === 'rearing' ? f.rearing_farm : f.laying_farm,
      }))
    }
  })

  const flockIds = flocks?.map((f: any) => f.id) ?? []

  // Per-shed rows for the selected date AND the previous date (for the
  // shed-wise HD% +/- variance line), plus feed/eggs/mortality/birds.
  const { data: records } = useQuery({
    queryKey: ['daily_summary_records', date, prevDate, flockIds.join(',')],
    queryFn: async () => {
      if (!flockIds.length) return []
      const { data, error } = await supabase
        .from('daily_records')
        .select('flock_id, shed_id, record_date, he_eggs, je_eggs, te_eggs, be_eggs, le_eggs, total_eggs, mortality_female, mortality_male, transfer_female, transfer_male, cull_female, cull_male, feed_female_kg, feed_male_kg, opening_female, opening_male, closing_female, closing_male, sheds(shed_no)')
        .in('flock_id', flockIds)
        .in('record_date', [date, prevDate])
      if (error) { toast.error(error.message); return [] }
      return data ?? []
    },
    enabled: flockIds.length > 0
  })

  // Medicine/Vaccine given that day — sanitizers split out into their own
  // "Water sanitation" section; everything else (medicine/vaccine/
  // supplement/etc.) goes under "MEDICINE & VACCINE".
  const { data: medUsage } = useQuery({
    queryKey: ['daily_summary_medicine', date, flockIds.join(',')],
    queryFn: async () => {
      if (!flockIds.length) return []
      const { data } = await supabase.from('medicine_usage')
        .select('flock_id, quantity, unit, medicines_master(name,type)')
        .in('flock_id', flockIds).eq('usage_date', date)
      return data ?? []
    },
    enabled: flockIds.length > 0
  })

  // Spray-route vaccinations that day — best-effort source (no separate
  // "spray log" exists in the app; vaccination_records.route='spray' is
  // the closest real signal). Flag to the user if this isn't quite right.
  const { data: sprayRecords } = useQuery({
    queryKey: ['daily_summary_spray', date, flockIds.join(',')],
    queryFn: async () => {
      if (!flockIds.length) return []
      const { data } = await supabase.from('vaccination_records')
        .select('flock_id, vaccine_name, quantity, unit')
        .in('flock_id', flockIds).eq('vaccine_date', date).eq('route', 'spray')
      return data ?? []
    },
    enabled: flockIds.length > 0
  })

  const { data: stdCurves } = useQuery({
    queryKey: ['std_production_curve_all'],
    queryFn: async () => { const { data } = await supabase.from('std_production_curve').select('season,week_of_age,hen_week_pct,he_pct'); return data ?? [] }
  })

  // Manpower — by SITE (farm), not by flock, from Employees (designation +
  // site) and that day's Attendance marks (P = full day, H = half day). A
  // site with no active flock still gets its own manpower-only block.
  const { data: employees } = useQuery({
    queryKey: ['employees_for_manpower'],
    queryFn: async () => { const { data } = await supabase.from('employees').select('id,designation,farm_id,gender').eq('is_active', true); return data ?? [] }
  })
  const { data: attendance } = useQuery({
    queryKey: ['attendance_for_manpower', date],
    queryFn: async () => { const { data } = await supabase.from('attendance_daily').select('employee_id,farm_id,status').eq('attendance_date', date); return data ?? [] }
  })
  // Real designation list + display order comes from config_options, not a
  // guessed set of buckets — whatever designations actually exist in the
  // app show up here, in the order the app's own dropdown uses.
  const { data: designationOptions } = useQuery({
    queryKey: ['designation_options_for_manpower'],
    queryFn: async () => { const { data } = await supabase.from('config_options').select('value,sort_order').eq('grp', 'designation').eq('is_active', true).order('sort_order'); return data ?? [] }
  })

  const designationOrder = React.useMemo(() => {
    const m = new Map<string, number>()
    ;(designationOptions ?? []).forEach((d: any, i: number) => m.set(d.value, d.sort_order ?? i))
    return m
  }, [designationOptions])

  const manpowerBySite = React.useMemo(() => {
    const attByEmp = new Map((attendance ?? []).map((a: any) => [a.employee_id, a.status]))
    const bySite: Record<string, Record<string, { p: number; h: number }>> = {}
    for (const e of (employees ?? [])) {
      const siteId = e.farm_id ?? '__none__'
      // Helper is the one designation split by gender (Male/Female Helper) —
      // every other designation is left alone, as requested.
      const baseDesignation = e.designation || 'Unspecified'
      const designation = baseDesignation.toLowerCase() === 'helper'
        ? `Helper (${e.gender || 'Unspecified'})`
        : baseDesignation
      const st = attByEmp.get(e.id)
      const isP = st === 'P' || st === 'OT'
      const isH = st === 'H'
      const site = (bySite[siteId] ??= {})
      const d = (site[designation] ??= { p: 0, h: 0 })
      if (isP) d.p++
      if (isH) d.h++
    }
    return bySite
  }, [employees, attendance])

  const orderFor = (designation: string) => designationOrder.get(designation.replace(/ \((Male|Female|Unspecified)\)$/, '')) ?? 999

  const manpowerLines = (siteId: string) => {
    const site = manpowerBySite[siteId] ?? {}
    const designations = Object.keys(site).sort((a, b) => orderFor(a) - orderFor(b) || a.localeCompare(b))
    if (!designations.length) return ['(no employees mapped to this site)']
    return designations.map(d => `${d} — P:${site[d].p} H:${site[d].h}`)
  }

  // A flock can have multiple daily_records rows for one date — one per shed.
  const recordsByFlockDate = React.useMemo(() => {
    const m: Record<string, any[]> = {}
    for (const r of (records ?? [])) {
      if (r.record_date !== date) continue
      ;(m[r.flock_id] ??= []).push(r)
    }
    return m
  }, [records, date])
  const prevHdByShed = React.useMemo(() => {
    const m: Record<string, number | null> = {}
    for (const r of (records ?? [])) {
      if (r.record_date !== prevDate) continue
      const openF = r.opening_female ?? 0
      m[r.shed_id] = openF > 0 ? ((r.total_eggs ?? 0) / openF) * 100 : null
    }
    return m
  }, [records, prevDate])
  const prevOverallHdByFlock = React.useMemo(() => {
    const sums: Record<string, { eggs: number; openF: number }> = {}
    for (const r of (records ?? [])) {
      if (r.record_date !== prevDate) continue
      const s = sums[r.flock_id] ??= { eggs: 0, openF: 0 }
      s.eggs += r.total_eggs ?? 0; s.openF += r.opening_female ?? 0
    }
    const out: Record<string, number | null> = {}
    for (const [fid, s] of Object.entries(sums)) out[fid] = s.openF > 0 ? (s.eggs / s.openF) * 100 : null
    return out
  }, [records, prevDate])

  const medByFlock = React.useMemo(() => {
    const m: Record<string, any[]> = {}
    for (const r of (medUsage ?? [])) (m[r.flock_id] ??= []).push(r)
    return m
  }, [medUsage])
  const sprayByFlock = React.useMemo(() => {
    const m: Record<string, any[]> = {}
    for (const r of (sprayRecords ?? [])) (m[r.flock_id] ??= []).push(r)
    return m
  }, [sprayRecords])

  const stdFor = (season: string | null, weekOfAge: number) => (stdCurves ?? []).find((s: any) => s.season === season && s.week_of_age === weekOfAge) ?? null

  const buildFlockBlock = (f: any): { lines: string[]; stats: any } => {
    const shedRows = recordsByFlockDate[f.id] ?? []
    const farmName = (f.farms?.name ?? 'Unknown Site').toUpperCase()
    const ageDays = daysBetween(f.placement_date, date)
    const ageWk = Math.floor(ageDays / 7), ageRem = ageDays % 7

    const sum = (k: string) => shedRows.reduce((s: number, r: any) => s + (r[k] ?? 0), 0)
    const openF = sum('opening_female'), openM = sum('opening_male')
    const mortF = sum('mortality_female'), mortM = sum('mortality_male')
    const recvF = sum('transfer_female'), recvM = sum('transfer_male')
    const cullF = sum('cull_female'), cullM = sum('cull_male')
    const closeF = sum('closing_female'), closeM = sum('closing_male')
    const feedF = sum('feed_female_kg'), feedM = sum('feed_male_kg')
    const totalEggs = sum('total_eggs'), heEggs = sum('he_eggs')
    const jeEggs = sum('je_eggs'), teEggs = sum('te_eggs'), beEggs = sum('be_eggs'), leEggs = sum('le_eggs')
    const hePct = totalEggs > 0 ? (heEggs / totalEggs) * 100 : 0
    const todayHd = openF > 0 ? (totalEggs / openF) * 100 : 0
    const prevHd = prevOverallHdByFlock[f.id]
    const std = stdFor(f.laying_season, ageWk)

    const lines: string[] = []
    lines.push(farmName)
    lines.push(`          Flock.${f.flock_no}`)
    lines.push(`        Dt.${fmtDMY2(date)}`)
    lines.push(`       Age.${ageWk}.${pad2(ageRem)}wk`)
    lines.push(`BIRDS: Op ${openF}+${openM} | Mort ${pad2(mortF)}+${pad2(mortM)} | Recv ${pad2(recvF)}+${pad2(recvM)} | C/s ${pad2(cullF)}+${pad2(cullM)} | Close ${closeF}+${closeM}`)
    lines.push(`FEED: ${Math.round(feedF)}+${Math.round(feedM)} kg`)
    lines.push(`      PRODUCTION`)
    lines.push(`Sl.   HD      +/-   F+M`)
    for (const r of shedRows.slice().sort((a: any, b: any) => (a.sheds?.shed_no ?? '').localeCompare(b.sheds?.shed_no ?? ''))) {
      const shedOpenF = r.opening_female ?? 0
      const shedHd = shedOpenF > 0 ? ((r.total_eggs ?? 0) / shedOpenF) * 100 : 0
      const prevShedHd = prevHdByShed[r.shed_id]
      const variance = prevShedHd != null ? shedHd - prevShedHd : 0
      const shedMortF = r.mortality_female ?? 0, shedMortM = r.mortality_male ?? 0
      lines.push(`${r.sheds?.shed_no ?? '—'}.${pct1(shedHd)}${sign(variance)}(${shedMortF}+${shedMortM})`)
    }
    lines.push(`He.Std.${std?.he_pct != null ? std.he_pct.toFixed(0) + '%' : '—'}`)
    lines.push(`He.act.${pct1(hePct)}`)
    const pctOf = (n: number) => totalEggs > 0 ? (n / totalEggs * 100).toFixed(2) : '0.00'
    lines.push(`Eggs: HE ${heEggs} | JE ${jeEggs}(${pctOf(jeEggs)}%) | TE ${teEggs}(${pctOf(teEggs)}%) | BE ${beEggs}(${pctOf(beEggs)}%) | LE ${leEggs}(${pctOf(leEggs)}%) | Total ${totalEggs}`)
    lines.push(`Today prd.${pct1(todayHd)} (${sign(prevHd != null ? todayHd - prevHd : 0)})`)
    lines.push(`Production Std.${std?.hen_week_pct != null ? std.hen_week_pct.toFixed(0) + '%' : '—'}`)
    // Group by the real medicines_master.type value instead of assuming a
    // binary "sanitizer or not" split — whatever types are actually in use
    // (medicine, vaccine, sanitizer, supplement, disinfectant, ...) each get
    // their own labeled section, so nothing gets silently mislabeled.
    const medsForFlock = medByFlock[f.id] ?? []
    const typeGroups: Record<string, any[]> = {}
    for (const m of medsForFlock) {
      const type = m.medicines_master?.type || 'other'
      ;(typeGroups[type] ??= []).push(m)
    }
    const sectionLabel = (type: string) =>
      type === 'sanitizer' ? 'Water sanitation'
      : type === 'medicine' || type === 'vaccine' ? 'MEDICINE & VACCINE'
      : type.charAt(0).toUpperCase() + type.slice(1)
    const medVaccineItems = [...(typeGroups['medicine'] ?? []), ...(typeGroups['vaccine'] ?? [])]
    const otherTypes = Object.keys(typeGroups).filter(t => t !== 'medicine' && t !== 'vaccine')

    lines.push(`  ${sectionLabel('medicine')}`)
    lines.push(...listOrNone(medVaccineItems.map((m: any) => `${m.medicines_master?.name ?? '—'}=${m.quantity ?? ''}${m.unit ?? ''}`)))
    for (const type of otherTypes) {
      lines.push(`        ${sectionLabel(type)}`)
      lines.push(...listOrNone(typeGroups[type].map((m: any) => `${m.medicines_master?.name ?? '—'}=${m.quantity ?? ''}${m.unit ?? ''}`)))
    }
    lines.push(`             SPRAY`)
    const sprays = sprayByFlock[f.id] ?? []
    lines.push(...listOrNone(sprays.map((s: any) => `${s.vaccine_name ?? '—'}=${s.quantity ?? ''}${s.unit ?? ''}`)))
    lines.push(...manpowerLines(f.farm_id))
    return { lines, stats: { totalEggs, heEggs, hd: todayHd, mort: mortF + mortM, feed: feedF + feedM } }
  }

  const activeSiteIds = new Set((flocks ?? []).map((f: any) => f.farm_id).filter(Boolean))
  const flocklessSitesAll = (farms ?? []).filter((s: any) => !activeSiteIds.has(s.id))

  const allBlocksAll = React.useMemo(() => {
    if (!flocks) return []
    return (flocks as any[]).map(f => { const { lines, stats } = buildFlockBlock(f); return { flock: f, lines, stats } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flocks, recordsByFlockDate, prevHdByShed, prevOverallHdByFlock, medByFlock, sprayByFlock, stdCurves, manpowerBySite, date])

  // Site filter — no selection means "All Sites"; otherwise only the
  // ticked sites are shown/copied/exported.
  const allBlocks = siteIds.length ? allBlocksAll.filter(b => siteIds.includes(b.flock.farm_id)) : allBlocksAll
  const flocklessSites = siteIds.length ? flocklessSitesAll.filter((s: any) => siteIds.includes(s.id)) : flocklessSitesAll

  const siteOptions = ((farms ?? []) as any[]).map((s: any) => ({ value: s.id, label: s.name }))

  const handleExport = () => {
    if (!allBlocks.length) { toast.error('No data to export'); return }
    exportCSV(`daily_summary_${date}.csv`,
      ['Flock', 'Site', 'HE Eggs', 'Total Eggs', 'HD %', 'Mortality', 'Feed (kg)'],
      allBlocks.map(({ flock: f, stats }) => [f.flock_no, f.farms?.name ?? '', stats.heEggs, stats.totalEggs, stats.hd.toFixed(1), stats.mort, Math.round(stats.feed)])
    )
  }

  const copyAll = () => {
    const parts = allBlocks.map(b => b.lines.join('\n'))
    for (const site of flocklessSites) {
      parts.push([site.name.toUpperCase(), '(no active flock)', ...manpowerLines(site.id)].join('\n'))
    }
    if (!parts.length) { toast.error('Nothing to copy for this site'); return }
    navigator.clipboard.writeText(parts.join('\n\n================================\n\n')).then(() => {
      setCopied('all')
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(null), 3000)
    })
  }

  if (isLoading) return <div className="flex justify-center p-8"><Spinner size={32} /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Farm Summary</h1>
          <p className="text-sm text-gray-500">Copy and paste into WhatsApp — Feed Std and Egg Weight have no data source yet, shown as "—"</p>
        </div>
        <div className="flex items-center gap-2">
          <MultiSelect options={siteOptions} value={siteIds} onChange={setSiteIds} placeholder="All Sites" className="w-44" />
          <DateInput value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export</Button>
          <Button onClick={copyAll} variant={copied === 'all' ? 'secondary' : 'primary'} size="sm">
            {copied === 'all' ? <><CheckCircle size={15} className="mr-1" />Copied!</> : <><Copy size={15} className="mr-1" />Copy</>}
          </Button>
        </div>
      </div>

      {allBlocks.map(({ flock: f, lines }) => (
        <Card key={f.id} padding={false}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900">Flock {f.flock_no} — {f.farms?.name ?? '—'}</span>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-gray-50 rounded-lg p-3 overflow-x-auto">{lines.join('\n')}</pre>
          </div>
        </Card>
      ))}

      {flocklessSites.map((site: any) => (
        <Card key={site.id} padding={false}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900">{site.name} — no active flock</span>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-gray-50 rounded-lg p-3 overflow-x-auto">{[site.name.toUpperCase(), ...manpowerLines(site.id)].join('\n')}</pre>
          </div>
        </Card>
      ))}

      {allBlocks.length === 0 && flocklessSites.length === 0 && (
        <Card><div className="p-8 text-center text-gray-400">No active flocks or sites found</div></Card>
      )}
    </div>
  )
}
