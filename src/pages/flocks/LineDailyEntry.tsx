import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today, fmtDate } from '@/lib/utils'
import { useAuth, moduleLevel } from '@/lib/auth'
import {
  Card, CardHeader, Button, Select, Spinner, EmptyState, DateInput,
  Table, Th, Td, Badge,
} from '@/components/ui'
import { Save, Egg, HeartCrack, Wheat, Bird, ArrowLeftRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { lineSex } from '@/lib/lineSex'

// Line-wise daily entry, running in PARALLEL with Bulk Daily Entry.
//
// Nothing here writes to daily_records. The owner's instruction was that the
// two stay separate: the shed figure is still closed by the site manager on
// the existing screens exactly as before, and this page only shows the line
// total beside it so a gap is visible. There is deliberately no button that
// copies one into the other -- that was considered and left for later, once
// the line figures have been trusted for a while.
//
// Shape follows how the farm actually records a day:
//   Eggs      -- per line, per round, all four rounds.
//   Mortality -- TWO entries per line: morning and day. Their sum is the day's
//                line mortality, and the lines together should equal the shed.
//   Feed      -- per line kg, but ONE feed type chosen for the whole day
//                rather than per line.
//
// Only sheds with line_managed = TRUE appear. Today that is Agraharam
// Potlapally 1-4 and nothing else, so no existing site is affected.

type EggRow = { r1: string; r2: string; r3: string; r4: string }
type MortRow = { mf: string; mm: string; df: string; dm: string; reason: string }
type FeedRow = { f: string; m: string }
type PlaceRow = { f: string; m: string }

const ROUNDS = [1, 2, 3, 4] as const
const n = (v: string) => (v.trim() === '' ? 0 : Number(v) || 0)
const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v))

export const LineDailyEntry: React.FC = () => {
  const qc = useQueryClient()
  const { profile } = useAuth()
  const canEdit = moduleLevel('line_entry') === 'full'

  const [shedId, setShedId] = useState('')
  const [date, setDate] = useState(today())
  const [tab, setTab] = useState<'birds' | 'eggs' | 'mortality' | 'feed' | 'transfer'>('birds')
  // Two feed types for the day, not one: males are on male feed while females
  // are on a layer ration, so a single dropdown could never describe a day
  // correctly. Mirrors Bulk Daily Entry, which has held feed_type_f and
  // feed_type_m at shed level all along.
  const [feedTypeF, setFeedTypeF] = useState('')
  const [feedTypeM, setFeedTypeM] = useState('')
  // Side filter. A shed has A-D or just A-B depending on how it was built, so
  // the choices come from the shed's own lines rather than a fixed list.
  const [sideFilter, setSideFilter] = useState('')

  const [eggs, setEggs] = useState<Record<string, EggRow>>({})
  const [mort, setMort] = useState<Record<string, MortRow>>({})
  const [feed, setFeed] = useState<Record<string, FeedRow>>({})
  const [place, setPlace] = useState<Record<string, PlaceRow>>({})
  // One line-to-line move at a time. A move is a fact with its own date, not a
  // grid to be edited, so it is added and listed rather than typed in place.
  const [xfer, setXfer] = useState({ from: '', to: '', f: '', m: '', remarks: '' })

  // Only line-managed sheds. A shed that has not been switched on is not
  // offered at all, which is what keeps this additive.
  const { data: sheds } = useQuery({
    queryKey: ['line_managed_sheds', profile?.id, profile?.role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sheds')
        .select('id,shed_no,shed_name,farm_id,farms(name)')
        .eq('line_managed', true)
        .order('shed_no')
      if (error) throw error
      const all = data ?? []
      // A shed supervisor works only on the sheds assigned to them. Several
      // people can hold the same shed, so this is a plain membership test, not
      // an ownership one. Every other role sees all line-managed sheds.
      if (profile?.role !== 'shed_supervisor') return all
      const { data: mine } = await supabase
        .from('profile_sheds').select('shed_id').eq('profile_id', profile.id)
      const allowed = new Set((mine ?? []).map((r: any) => r.shed_id))
      return all.filter((sh: any) => allowed.has(sh.id))
    },
  })

  useEffect(() => {
    if (!shedId && sheds?.length) setShedId(sheds[0].id)
  }, [sheds, shedId])

  const { data: feedTypes } = useQuery({
    queryKey: ['feed_types_active'],
    queryFn: async () => {
      // Same list, same order as Bulk Daily Entry uses at shed level (active
      // feed types by sort_order), so the two screens can never offer a
      // different set of feeds for the same day.
      const { data, error } = await supabase
        .from('feed_types').select('id,code,name,sort_order')
        .eq('is_active', true).order('sort_order')
      if (error) throw error
      return data ?? []
    },
  })

  const { data: allLines, isLoading } = useQuery({
    queryKey: ['lines_for_entry', shedId],
    enabled: !!shedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shed_lines')
        .select('id,side,line_no,boxes,boxes_female,boxes_male,birds_per_box')
        .eq('shed_id', shedId).eq('is_active', true)
        .order('side').order('line_no')
      if (error) throw error
      return data ?? []
    },
  })

  const sides = useMemo(
    () => Array.from(new Set((allLines ?? []).map((l: any) => l.side))).sort(),
    [allLines])

  // Reset the side filter when the chosen shed has no such side -- otherwise
  // switching from a four-sided shed to a two-sided one shows an empty grid.
  useEffect(() => {
    if (sideFilter && !sides.includes(sideFilter)) setSideFilter('')
  }, [sides, sideFilter])

  const lines = useMemo(
    () => (allLines ?? []).filter((l: any) => !sideFilter || l.side === sideFilter),
    [allLines, sideFilter])

  // Saving, totals and the shed comparison run over the WHOLE shed, never the
  // filtered view -- a filter is for reading, and must not quietly change what
  // a Save writes or make a shed total look wrong.
  const lineIds = useMemo(() => (allLines ?? []).map((l: any) => l.id), [allLines])

  // Everything already recorded for these lines on this date, plus the shed's
  // own daily_records row so the two can be shown side by side.
  const { data: existing } = useQuery({
    queryKey: ['line_day', shedId, date, lineIds.length],
    enabled: !!shedId && lineIds.length > 0,
    queryFn: async () => {
      const [prod, mo, fd, dr, bal, pl, tr] = await Promise.all([
        supabase.from('line_production').select('*').in('line_id', lineIds).eq('record_date', date),
        supabase.from('line_mortality').select('*').in('line_id', lineIds).eq('record_date', date),
        supabase.from('line_feed').select('*').in('line_id', lineIds).eq('record_date', date),
        supabase.from('daily_records')
          .select('flock_id,closing_female,closing_male,total_eggs,mortality_female,mortality_male,feed_female_kg,feed_male_kg,flocks(flock_no)')
          .eq('shed_id', shedId).eq('record_date', date).maybeSingle(),
        supabase.from('v_line_balance').select('*').in('line_id', lineIds),
        supabase.from('line_placements').select('*').in('line_id', lineIds),
        supabase.from('line_transfers').select('*, from_line:from_line_id(side,line_no), to_line:to_line_id(side,line_no)')
          .or(`from_line_id.in.(${lineIds.join(',')}),to_line_id.in.(${lineIds.join(',')})`)
          .order('transfer_date', { ascending: false }).limit(50),
      ])
      return {
        prod: prod.data ?? [], mort: mo.data ?? [], feed: fd.data ?? [],
        shedDay: dr.data ?? null,
        balance: bal.data ?? [], placements: pl.data ?? [], transfers: tr.data ?? [],
      }
    },
  })

  // Load what is stored into the form. Runs whenever the shed or date changes,
  // so switching back to a day already entered shows the saved figures rather
  // than blanks that would overwrite them on the next save.
  useEffect(() => {
    if (!allLines) return
    const e: Record<string, EggRow> = {}
    const m: Record<string, MortRow> = {}
    const f: Record<string, FeedRow> = {}
    for (const l of allLines) {
      e[l.id] = { r1: '', r2: '', r3: '', r4: '' }
      m[l.id] = { mf: '', mm: '', df: '', dm: '', reason: '' }
      f[l.id] = { f: '', m: '' }
    }
    for (const p of existing?.prod ?? []) {
      if (!e[p.line_id]) continue
      const k = ('r' + p.round_no) as keyof EggRow
      e[p.line_id][k] = String(p.eggs ?? '')
    }
    for (const r of existing?.mort ?? []) {
      if (!m[r.line_id]) continue
      m[r.line_id] = {
        mf: r.morning_female ? String(r.morning_female) : '',
        mm: r.morning_male ? String(r.morning_male) : '',
        df: r.day_female ? String(r.day_female) : '',
        dm: r.day_male ? String(r.day_male) : '',
        reason: r.reason ?? '',
      }
    }
    // A line can now hold two feed rows for one day -- one per sex -- so merge
    // rather than overwrite, and take each sex's feed type from the row that
    // actually carries that sex's kg.
    let ftF = '', ftM = ''
    for (const r of existing?.feed ?? []) {
      if (!f[r.line_id]) continue
      if (Number(r.female_kg) > 0) {
        f[r.line_id].f = String(r.female_kg)
        if (r.feed_type_id) ftF = r.feed_type_id
      }
      if (Number(r.male_kg) > 0) {
        f[r.line_id].m = String(r.male_kg)
        if (r.feed_type_id) ftM = r.feed_type_id
      }
    }
    const pz: Record<string, PlaceRow> = {}
    for (const l of allLines) pz[l.id] = { f: '', m: '' }
    for (const r of existing?.placements ?? []) {
      if (!pz[r.line_id]) continue
      pz[r.line_id] = { f: r.female ? String(r.female) : '', m: r.male ? String(r.male) : '' }
    }
    setPlace(pz)
    setEggs(e); setMort(m); setFeed(f)
    if (ftF) setFeedTypeF(ftF)
    if (ftM) setFeedTypeM(ftM)
  }, [allLines, existing])

  // ── Totals, and the comparison against the shed's own figure ──────────────
  // Current birds per line, from v_line_balance. Keyed by line so every tab can
  // show what a line actually holds -- the thing that was missing when
  // mortality could be typed against a line with no birds in it.
  const balByLine = useMemo(() => {
    const m: Record<string, any> = {}
    for (const b of (existing?.balance ?? []) as any[]) m[b.line_id] = b
    return m
  }, [existing])

  const totals = useMemo(() => {
    let eggTotal = 0, mf = 0, mm = 0, df = 0, dm = 0, feedF = 0, feedM = 0
    for (const id of lineIds) {
      const e = eggs[id]; if (e) eggTotal += n(e.r1) + n(e.r2) + n(e.r3) + n(e.r4)
      const m = mort[id]; if (m) { mf += n(m.mf); mm += n(m.mm); df += n(m.df); dm += n(m.dm) }
      const f = feed[id]; if (f) { feedF += n(f.f); feedM += n(f.m) }
    }
    let curF = 0, curM = 0, capacity = 0, boxes = 0
    for (const l of (allLines ?? []) as any[]) {
      const b = balByLine[l.id]
      curF += b?.current_female ?? 0
      curM += b?.current_male ?? 0
      boxes += l.boxes ?? 0
      capacity += (l.boxes ?? 0) * (l.birds_per_box ?? 0)
    }
    return { eggTotal, mf, mm, df, dm, mortF: mf + df, mortM: mm + dm, feedF, feedM,
             curF, curM, capacity, boxes }
  }, [eggs, mort, feed, lineIds, allLines, balByLine])

  const flockId = (existing?.shedDay as any)?.flock_id ?? null

  const shedDay = existing?.shedDay as any
  // A gap is SHOWN, never closed. Blank when the shed day has not been entered
  // yet -- an unentered day is not a disagreement.
  const gap = (lineVal: number, shedVal: number | null | undefined) =>
    shedVal == null ? null : Math.round((lineVal - shedVal) * 1000) / 1000

  const save = useMutation({
    mutationFn: async () => {
      if (!canEdit) throw new Error('You have view-only access to line entry')
      const by = profile?.id ?? null

      if (tab === 'birds') {
        if (!flockId) throw new Error('No shed daily record for this date, so there is no flock to place birds against')
        const rows: any[] = []
        for (const id of lineIds) {
          const pz = place[id]; if (!pz) continue
          if (pz.f.trim() === '' && pz.m.trim() === '') continue
          rows.push({ line_id: id, flock_id: flockId, placed_date: date,
                      female: n(pz.f), male: n(pz.m), entered_by: by })
        }
        if (!rows.length) throw new Error('Nothing to save — no bird counts entered')
        const { error } = await supabase.from('line_placements')
          .upsert(rows, { onConflict: 'line_id,flock_id' })
        if (error) throw error
        return rows.length
      }

      if (tab === 'transfer') {
        if (!flockId) throw new Error('No shed daily record for this date, so there is no flock to transfer')
        if (!xfer.from || !xfer.to) throw new Error('Choose both the line moved from and the line moved to')
        if (xfer.from === xfer.to) throw new Error('From and To cannot be the same line')
        if (n(xfer.f) === 0 && n(xfer.m) === 0) throw new Error('Enter how many birds moved')
        const { error } = await supabase.from('line_transfers').insert({
          flock_id: flockId, transfer_date: date,
          from_line_id: xfer.from, to_line_id: xfer.to,
          female: n(xfer.f), male: n(xfer.m),
          remarks: xfer.remarks.trim() || null, entered_by: by,
        })
        if (error) throw error
        return 1
      }

      if (tab === 'eggs') {
        const rows: any[] = []
        for (const id of lineIds) {
          const e = eggs[id]; if (!e) continue
          for (const r of ROUNDS) {
            const v = e[('r' + r) as keyof EggRow]
            if (v.trim() === '') continue          // untouched round: not a zero
            rows.push({ line_id: id, record_date: date, round_no: r, eggs: n(v), entered_by: by })
          }
        }
        if (!rows.length) throw new Error('Nothing to save — no egg figures entered')
        const { error } = await supabase.from('line_production')
          .upsert(rows, { onConflict: 'line_id,record_date,round_no' })
        if (error) throw error
        return rows.length
      }

      if (tab === 'mortality') {
        const rows: any[] = []
        for (const id of lineIds) {
          const m = mort[id]; if (!m) continue
          const any = [m.mf, m.mm, m.df, m.dm].some(v => v.trim() !== '')
          if (!any && !m.reason.trim()) continue
          rows.push({
            line_id: id, record_date: date,
            morning_female: n(m.mf), morning_male: n(m.mm),
            day_female: n(m.df), day_male: n(m.dm),
            // female/male stay the DAY TOTAL, so anything reading the original
            // columns sees the same number the two halves add up to.
            female: n(m.mf) + n(m.df), male: n(m.mm) + n(m.dm),
            reason: m.reason.trim() || null, entered_by: by,
          })
        }
        if (!rows.length) throw new Error('Nothing to save — no mortality entered')
        const { error } = await supabase.from('line_mortality')
          .upsert(rows, { onConflict: 'line_id,record_date' })
        if (error) throw error
        return rows.length
      }

      const anyF = lineIds.some(id => (feed[id]?.f ?? '').trim() !== '')
      const anyM = lineIds.some(id => (feed[id]?.m ?? '').trim() !== '')
      if (anyF && !feedTypeF) throw new Error('Choose the FEMALE feed type for the day')
      if (anyM && !feedTypeM) throw new Error('Choose the MALE feed type for the day')

      // One row per line per feed type. Female kg is booked against the female
      // feed type and male kg against the male one, so the two never get mixed
      // under a single ration. When both happen to be the same feed type they
      // collapse into one row, which is what the unique key expects.
      const rows: any[] = []
      for (const id of lineIds) {
        const f = feed[id]; if (!f) continue
        const hasF = f.f.trim() !== '', hasM = f.m.trim() !== ''
        if (!hasF && !hasM) continue
        if (hasF && hasM && feedTypeF === feedTypeM) {
          rows.push({ line_id: id, record_date: date, feed_type_id: feedTypeF,
                      female_kg: n(f.f), male_kg: n(f.m), entered_by: by })
          continue
        }
        if (hasF) rows.push({ line_id: id, record_date: date, feed_type_id: feedTypeF,
                              female_kg: n(f.f), male_kg: 0, entered_by: by })
        if (hasM) rows.push({ line_id: id, record_date: date, feed_type_id: feedTypeM,
                              female_kg: 0, male_kg: n(f.m), entered_by: by })
      }
      if (!rows.length) throw new Error('Nothing to save — no feed entered')
      const { error } = await supabase.from('line_feed')
        .upsert(rows, { onConflict: 'line_id,record_date,feed_type_id' })
      if (error) throw error
      return rows.length
    },
    onSuccess: (count) => {
      toast.success(tab === 'transfer' ? 'Transfer recorded' : `Saved ${count} line${count === 1 ? '' : 's'}`)
      if (tab === 'transfer') setXfer({ from: '', to: '', f: '', m: '', remarks: '' })
      qc.invalidateQueries({ queryKey: ['line_day'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const shed = (sheds ?? []).find((s: any) => s.id === shedId) as any
  const cell = 'w-16 px-1 py-1 border border-gray-200 rounded text-right text-sm'

  const Cmp: React.FC<{ label: string; line: number; shed: number | null | undefined; unit?: string }> =
    ({ label, line, shed: sv, unit = '' }) => {
      const g = gap(line, sv)
      return (
        <div className="text-xs">
          <span className="text-gray-500">{label}</span>{' '}
          <strong>{line.toLocaleString('en-IN')}{unit}</strong>
          {g == null ? (
            <span className="ml-1 text-gray-400">— shed day not entered</span>
          ) : g === 0 ? (
            <span className="ml-1 text-green-600">= shed {sv?.toLocaleString('en-IN')}{unit}</span>
          ) : (
            <span className="ml-1 text-amber-600">
              vs shed {sv?.toLocaleString('en-IN')}{unit} ({g > 0 ? '+' : ''}{g.toLocaleString('en-IN')})
            </span>
          )}
        </div>
      )
    }

  return (
    <div className="space-y-4">
      <CardHeader
        title="Line Daily Entry"
        subtitle="Eggs by round, morning and day mortality, and feed — line by line. Runs alongside Bulk Daily Entry; nothing here changes the shed's daily record."
        action={canEdit
          ? <Button icon={<Save size={16} />} loading={save.isPending} onClick={() => save.mutate()}>
              {tab === 'transfer' ? 'Record Transfer'
                : `Save ${tab === 'birds' ? 'Birds' : tab === 'eggs' ? 'Eggs'
                    : tab === 'mortality' ? 'Mortality' : 'Feed'}`}
            </Button>
          : <Badge color="gray">View only</Badge>}
      />

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Select label="Shed" value={shedId}
            onChange={e => setShedId((e.target as HTMLSelectElement).value)}
            options={(sheds ?? []).map((s: any) => ({
              value: s.id,
              label: `${s.farms?.name ?? ''} — Shed ${s.shed_no}${s.shed_name ? ` (${s.shed_name})` : ''}`,
            }))} />
          <DateInput label="Date" value={date} onChange={e => setDate(e.target.value)} />
          <Select label="Side / Lines" value={sideFilter}
            onChange={e => setSideFilter((e.target as HTMLSelectElement).value)}
            options={[{ value: '', label: `All lines (${(allLines ?? []).length})` },
              ...sides.map((sd: string) => ({
                value: sd,
                label: `Side ${sd} (${(allLines ?? []).filter((l: any) => l.side === sd).length} lines)`,
              }))]} />
          <div className="flex items-end text-sm text-gray-600">
            {shedDay?.flocks?.flock_no
              ? <span>Flock <strong>{shedDay.flocks.flock_no}</strong> on {fmtDate(date)}</span>
              : <span className="text-gray-400">No shed daily record for {fmtDate(date)} yet</span>}
          </div>
        </div>
      </Card>

      {!sheds?.length ? (
        <EmptyState title="No line-managed sheds"
          subtitle="A shed only appears here once it is switched to line-managed. Agraharam Potlapally sheds 1–4 are the first." />
      ) : isLoading ? <Spinner /> : !lines?.length ? (
        <EmptyState title="This shed has no lines"
          subtitle="Add its lines under Masters → Line Master first." />
      ) : (
        <Card padding={false}>
          <div className="flex border-b border-gray-100">
            {([['birds', 'Birds', Bird], ['eggs', 'Eggs', Egg], ['mortality', 'Mortality', HeartCrack],
               ['feed', 'Feed', Wheat], ['transfer', 'Line Transfer', ArrowLeftRight]] as const)
              .map(([k, label, Icon]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 border-b-2 -mb-px ${
                    tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  <Icon size={14} />{label}
                </button>
              ))}
          </div>

          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-x-6 gap-y-1">
            {tab === 'birds' && <>
              <Cmp label="Line birds F" line={totals.curF} shed={shedDay?.closing_female} />
              <Cmp label="M" line={totals.curM} shed={shedDay?.closing_male} />
              <div className="text-xs text-gray-500">
                Capacity <strong>{totals.capacity.toLocaleString('en-IN')}</strong> birds
                {' '}({totals.boxes.toLocaleString('en-IN')} boxes × birds per box)
              </div>
            </>}
            {tab === 'transfer' && <div className="text-xs text-gray-500">
              Moving birds from one line to another. Both lines' counts change; the shed total does not.
            </div>}
            {tab === 'eggs' && <Cmp label="Line eggs" line={totals.eggTotal} shed={shedDay?.total_eggs} />}
            {tab === 'mortality' && <>
              <Cmp label="Line mortality F" line={totals.mortF} shed={shedDay?.mortality_female} />
              <Cmp label="M" line={totals.mortM} shed={shedDay?.mortality_male} />
              <div className="text-xs text-gray-500">
                Morning <strong>{(totals.mf + totals.mm).toLocaleString('en-IN')}</strong>
                {' + '}Day <strong>{(totals.df + totals.dm).toLocaleString('en-IN')}</strong>
              </div>
            </>}
            {tab === 'feed' && <>
              <Cmp label="Line feed F" line={totals.feedF} shed={shedDay?.feed_female_kg} unit=" kg" />
              <Cmp label="M" line={totals.feedM} shed={shedDay?.feed_male_kg} unit=" kg" />
            </>}
          </div>

          {tab === 'feed' && (
            <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
              <Select label="FEMALE feed type for the day (every line)"
                value={feedTypeF}
                onChange={e => setFeedTypeF((e.target as HTMLSelectElement).value)}
                options={[{ value: '', label: '— Select —' },
                  ...(feedTypes ?? []).map((f: any) => ({ value: f.id, label: `${f.code} — ${f.name}` }))]} />
              <Select label="MALE feed type for the day (every line)"
                value={feedTypeM}
                onChange={e => setFeedTypeM((e.target as HTMLSelectElement).value)}
                options={[{ value: '', label: '— Select —' },
                  ...(feedTypes ?? []).map((f: any) => ({ value: f.id, label: `${f.code} — ${f.name}` }))]} />
              <p className="sm:col-span-2 text-xs text-gray-500">
                One feed type each for the whole day, not per line. Only the sex you actually
                enter kg for needs a type chosen — a shed with no males needs no male feed type.
              </p>
            </div>
          )}

          {tab === 'transfer' ? (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select label="From line" value={xfer.from}
                  onChange={e => setXfer(x => ({ ...x, from: (e.target as HTMLSelectElement).value }))}
                  options={[{ value: '', label: '— Select —' }, ...lines.map((l: any) => ({
                    value: l.id,
                    label: `${l.side}-${l.line_no} (${(balByLine[l.id]?.current_female ?? 0) + (balByLine[l.id]?.current_male ?? 0)} birds)`,
                  }))]} />
                <Select label="To line" value={xfer.to}
                  onChange={e => setXfer(x => ({ ...x, to: (e.target as HTMLSelectElement).value }))}
                  options={[{ value: '', label: '— Select —' }, ...lines.map((l: any) => ({
                    value: l.id,
                    label: `${l.side}-${l.line_no} (${(balByLine[l.id]?.current_female ?? 0) + (balByLine[l.id]?.current_male ?? 0)} birds)`,
                  }))]} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Female</label>
                    <input type="number" inputMode="numeric" disabled={!canEdit} value={xfer.f}
                      onChange={e => setXfer(x => ({ ...x, f: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Male</label>
                    <input type="number" inputMode="numeric" disabled={!canEdit} value={xfer.m}
                      onChange={e => setXfer(x => ({ ...x, m: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <input type="text" disabled={!canEdit} value={xfer.remarks}
                    onChange={e => setXfer(x => ({ ...x, remarks: e.target.value }))}
                    placeholder="optional"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Dated {fmtDate(date)} — the date box at the top. Any two lines can be chosen,
                including lines in different sheds, because birds do move between sheds here.
              </p>

              <div className="overflow-x-auto">
                <Table>
                  <thead><tr>
                    <Th>Date</Th><Th>From</Th><Th>To</Th>
                    <Th right>Female</Th><Th right>Male</Th><Th>Remarks</Th>
                  </tr></thead>
                  <tbody>
                    {(existing?.transfers ?? []).length === 0 ? (
                      <tr><Td colSpan={6} className="text-gray-400 text-center py-4">
                        No line transfers recorded for these lines yet
                      </Td></tr>
                    ) : (existing?.transfers ?? []).map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <Td>{fmtDate(t.transfer_date)}</Td>
                        <Td>{t.from_line ? `${t.from_line.side}-${t.from_line.line_no}` : '—'}</Td>
                        <Td>{t.to_line ? `${t.to_line.side}-${t.to_line.line_no}` : '—'}</Td>
                        <Td right>{t.female || ''}</Td>
                        <Td right>{t.male || ''}</Td>
                        <Td className="text-xs text-gray-500">{t.remarks ?? ''}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th>Side</Th><Th>Line</Th><Th>Holds</Th><Th right>Boxes</Th>
                {tab === 'birds' && <>
                  <Th right>Birds/Box</Th><Th right>Capacity</Th>
                  <Th right>Placed F</Th><Th right>Placed M</Th>
                  <Th right>In</Th><Th right>Out</Th><Th right>Died</Th>
                  <Th right>Now F</Th><Th right>Now M</Th>
                </>}
                {tab === 'eggs' && <>
                  <Th right>R1</Th><Th right>R2</Th><Th right>R3</Th><Th right>R4</Th><Th right>Total</Th>
                </>}
                {tab === 'mortality' && <>
                  <Th right>Morning F</Th><Th right>Morning M</Th>
                  <Th right>Day F</Th><Th right>Day M</Th><Th right>Total</Th><Th right>Birds Now</Th><Th>Reason</Th>
                </>}
                {tab === 'feed' && <><Th right>Female kg</Th><Th right>Male kg</Th><Th right>Total kg</Th></>}
              </tr></thead>
              <tbody>
                {lines.map((l: any) => {
                  const e = eggs[l.id] ?? { r1: '', r2: '', r3: '', r4: '' }
                  const m = mort[l.id] ?? { mf: '', mm: '', df: '', dm: '', reason: '' }
                  const f = feed[l.id] ?? { f: '', m: '' }
                  const setE = (k: keyof EggRow, v: string) =>
                    setEggs(p => ({ ...p, [l.id]: { ...p[l.id], [k]: v } }))
                  const setM = (k: keyof MortRow, v: string) =>
                    setMort(p => ({ ...p, [l.id]: { ...p[l.id], [k]: v } }))
                  const setF = (k: keyof FeedRow, v: string) =>
                    setFeed(p => ({ ...p, [l.id]: { ...p[l.id], [k]: v } }))
                  return (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <Td><Badge color="blue">{l.side}</Badge></Td>
                      <Td>{l.line_no}</Td>
                      <Td>{(() => {
                        const sx = lineSex(l)
                        return sx == null ? <span className="text-gray-300">—</span>
                          : <Badge color={sx === 'M' ? 'orange' : sx === 'F' ? 'blue' : 'gray'}>{sx}</Badge>
                      })()}</Td>
                      <Td right className="text-gray-500">{l.boxes ?? '—'}</Td>
                      {tab === 'birds' && (() => {
                        const b = balByLine[l.id]
                        const pz = place[l.id] ?? { f: '', m: '' }
                        const setP = (k: keyof PlaceRow, v: string) =>
                          setPlace(p => ({ ...p, [l.id]: { ...p[l.id], [k]: v } }))
                        const cap = (l.boxes ?? 0) * (l.birds_per_box ?? 0)
                        const over = (b?.current_female ?? 0) + (b?.current_male ?? 0) > cap && cap > 0
                        return <>
                          <Td right className="text-gray-500">{l.birds_per_box ?? '—'}</Td>
                          <Td right className={over ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                            {cap || '—'}
                          </Td>
                          <Td right>
                            <input type="number" inputMode="numeric" className={cell} disabled={!canEdit}
                              value={pz.f} onChange={ev => setP('f', ev.target.value)} />
                          </Td>
                          <Td right>
                            <input type="number" inputMode="numeric" className={cell} disabled={!canEdit}
                              value={pz.m} onChange={ev => setP('m', ev.target.value)} />
                          </Td>
                          <Td right className="text-gray-500">{((b?.in_female ?? 0) + (b?.in_male ?? 0)) || ''}</Td>
                          <Td right className="text-gray-500">{((b?.out_female ?? 0) + (b?.out_male ?? 0)) || ''}</Td>
                          <Td right className="text-gray-500">{((b?.mort_female ?? 0) + (b?.mort_male ?? 0)) || ''}</Td>
                          <Td right><strong>{b?.current_female ?? ''}</strong></Td>
                          <Td right><strong>{b?.current_male ?? ''}</strong></Td>
                        </>
                      })()}
                      {tab === 'eggs' && <>
                        {ROUNDS.map(r => (
                          <Td key={r} right>
                            <input type="number" inputMode="numeric" className={cell} disabled={!canEdit}
                              value={e[('r' + r) as keyof EggRow]}
                              onChange={ev => setE(('r' + r) as keyof EggRow, ev.target.value)} />
                          </Td>
                        ))}
                        <Td right><strong>{(n(e.r1) + n(e.r2) + n(e.r3) + n(e.r4)) || ''}</strong></Td>
                      </>}
                      {tab === 'mortality' && <>
                        {(['mf', 'mm', 'df', 'dm'] as const).map(k => (
                          <Td key={k} right>
                            <input type="number" inputMode="numeric" className={cell} disabled={!canEdit}
                              value={m[k]} onChange={ev => setM(k, ev.target.value)} />
                          </Td>
                        ))}
                        <Td right><strong>{(n(m.mf) + n(m.mm) + n(m.df) + n(m.dm)) || ''}</strong></Td>
                        <Td right className={(balByLine[l.id]?.current_female ?? 0) + (balByLine[l.id]?.current_male ?? 0) === 0
                          ? 'text-amber-600' : 'text-gray-500'}>
                          {(balByLine[l.id]?.current_female ?? 0) + (balByLine[l.id]?.current_male ?? 0) || 'no birds'}
                        </Td>
                        <Td>
                          <input type="text" className="w-32 px-1 py-1 border border-gray-200 rounded text-sm"
                            disabled={!canEdit} value={m.reason} placeholder="optional"
                            onChange={ev => setM('reason', ev.target.value)} />
                        </Td>
                      </>}
                      {tab === 'feed' && <>
                        <Td right>
                          <input type="number" inputMode="decimal" step="0.01" className={cell} disabled={!canEdit}
                            value={f.f} onChange={ev => setF('f', ev.target.value)} />
                        </Td>
                        <Td right>
                          <input type="number" inputMode="decimal" step="0.01" className={cell} disabled={!canEdit}
                            value={f.m} onChange={ev => setF('m', ev.target.value)} />
                        </Td>
                        <Td right><strong>{(n(f.f) + n(f.m)) || ''}</strong></Td>
                      </>}
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
          )}

          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
            {shed?.farms?.name} — Shed {shed?.shed_no} · {fmtDate(date)} ·
            {sideFilter
              ? ` showing side ${sideFilter} (${lines.length} of ${(allLines ?? []).length} lines)`
              : ` all ${lines.length} lines`}.
            The side filter changes what you SEE only — Save always writes the whole shed,
            and the totals above are the whole shed too. A blank box is left alone on save;
            it is not stored as a zero.
          </div>
        </Card>
      )}
    </div>
  )
}
