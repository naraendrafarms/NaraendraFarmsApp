import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today, fmtDate } from '@/lib/utils'
import { useAuth, moduleLevel } from '@/lib/auth'
import {
  Card, CardHeader, Button, Select, Spinner, EmptyState, DateInput,
  Table, Th, Td, Badge,
} from '@/components/ui'
import { Save, Egg, HeartCrack, Wheat } from 'lucide-react'
import toast from 'react-hot-toast'

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

const ROUNDS = [1, 2, 3, 4] as const
const n = (v: string) => (v.trim() === '' ? 0 : Number(v) || 0)
const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v))

export const LineDailyEntry: React.FC = () => {
  const qc = useQueryClient()
  const { profile } = useAuth()
  const canEdit = moduleLevel('line_entry') === 'full'

  const [shedId, setShedId] = useState('')
  const [date, setDate] = useState(today())
  const [tab, setTab] = useState<'eggs' | 'mortality' | 'feed'>('eggs')
  const [feedTypeId, setFeedTypeId] = useState('')

  const [eggs, setEggs] = useState<Record<string, EggRow>>({})
  const [mort, setMort] = useState<Record<string, MortRow>>({})
  const [feed, setFeed] = useState<Record<string, FeedRow>>({})

  // Only line-managed sheds. A shed that has not been switched on is not
  // offered at all, which is what keeps this additive.
  const { data: sheds } = useQuery({
    queryKey: ['line_managed_sheds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sheds')
        .select('id,shed_no,shed_name,farm_id,farms(name)')
        .eq('line_managed', true)
        .order('shed_no')
      if (error) throw error
      return data ?? []
    },
  })

  useEffect(() => {
    if (!shedId && sheds?.length) setShedId(sheds[0].id)
  }, [sheds, shedId])

  const { data: feedTypes } = useQuery({
    queryKey: ['feed_types_active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_types').select('id,code,name').eq('is_active', true).order('code')
      if (error) throw error
      return data ?? []
    },
  })

  const { data: lines, isLoading } = useQuery({
    queryKey: ['lines_for_entry', shedId],
    enabled: !!shedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shed_lines')
        .select('id,side,line_no,boxes,boxes_female,boxes_male')
        .eq('shed_id', shedId).eq('is_active', true)
        .order('side').order('line_no')
      if (error) throw error
      return data ?? []
    },
  })

  const lineIds = useMemo(() => (lines ?? []).map((l: any) => l.id), [lines])

  // Everything already recorded for these lines on this date, plus the shed's
  // own daily_records row so the two can be shown side by side.
  const { data: existing } = useQuery({
    queryKey: ['line_day', shedId, date, lineIds.length],
    enabled: !!shedId && lineIds.length > 0,
    queryFn: async () => {
      const [prod, mo, fd, dr] = await Promise.all([
        supabase.from('line_production').select('*').in('line_id', lineIds).eq('record_date', date),
        supabase.from('line_mortality').select('*').in('line_id', lineIds).eq('record_date', date),
        supabase.from('line_feed').select('*').in('line_id', lineIds).eq('record_date', date),
        supabase.from('daily_records')
          .select('total_eggs,mortality_female,mortality_male,feed_female_kg,feed_male_kg,flocks(flock_no)')
          .eq('shed_id', shedId).eq('record_date', date).maybeSingle(),
      ])
      return {
        prod: prod.data ?? [], mort: mo.data ?? [], feed: fd.data ?? [],
        shedDay: dr.data ?? null,
      }
    },
  })

  // Load what is stored into the form. Runs whenever the shed or date changes,
  // so switching back to a day already entered shows the saved figures rather
  // than blanks that would overwrite them on the next save.
  useEffect(() => {
    if (!lines) return
    const e: Record<string, EggRow> = {}
    const m: Record<string, MortRow> = {}
    const f: Record<string, FeedRow> = {}
    for (const l of lines) {
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
    let ft = ''
    for (const r of existing?.feed ?? []) {
      if (!f[r.line_id]) continue
      f[r.line_id] = {
        f: r.female_kg ? String(r.female_kg) : '',
        m: r.male_kg ? String(r.male_kg) : '',
      }
      if (r.feed_type_id) ft = r.feed_type_id
    }
    setEggs(e); setMort(m); setFeed(f)
    if (ft) setFeedTypeId(ft)
  }, [lines, existing])

  // ── Totals, and the comparison against the shed's own figure ──────────────
  const totals = useMemo(() => {
    let eggTotal = 0, mf = 0, mm = 0, df = 0, dm = 0, feedF = 0, feedM = 0
    for (const id of lineIds) {
      const e = eggs[id]; if (e) eggTotal += n(e.r1) + n(e.r2) + n(e.r3) + n(e.r4)
      const m = mort[id]; if (m) { mf += n(m.mf); mm += n(m.mm); df += n(m.df); dm += n(m.dm) }
      const f = feed[id]; if (f) { feedF += n(f.f); feedM += n(f.m) }
    }
    return { eggTotal, mf, mm, df, dm, mortF: mf + df, mortM: mm + dm, feedF, feedM }
  }, [eggs, mort, feed, lineIds])

  const shedDay = existing?.shedDay as any
  // A gap is SHOWN, never closed. Blank when the shed day has not been entered
  // yet -- an unentered day is not a disagreement.
  const gap = (lineVal: number, shedVal: number | null | undefined) =>
    shedVal == null ? null : Math.round((lineVal - shedVal) * 1000) / 1000

  const save = useMutation({
    mutationFn: async () => {
      if (!canEdit) throw new Error('You have view-only access to line entry')
      const by = profile?.id ?? null

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

      if (!feedTypeId) throw new Error('Choose the feed type for the day first')
      const rows: any[] = []
      for (const id of lineIds) {
        const f = feed[id]; if (!f) continue
        if (f.f.trim() === '' && f.m.trim() === '') continue
        rows.push({
          line_id: id, record_date: date, feed_type_id: feedTypeId,
          female_kg: numOrNull(f.f) ?? 0, male_kg: numOrNull(f.m) ?? 0, entered_by: by,
        })
      }
      if (!rows.length) throw new Error('Nothing to save — no feed entered')
      const { error } = await supabase.from('line_feed')
        .upsert(rows, { onConflict: 'line_id,record_date,feed_type_id' })
      if (error) throw error
      return rows.length
    },
    onSuccess: (count) => {
      toast.success(`Saved ${count} line${count === 1 ? '' : 's'}`)
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
              Save {tab === 'eggs' ? 'Eggs' : tab === 'mortality' ? 'Mortality' : 'Feed'}
            </Button>
          : <Badge color="gray">View only</Badge>}
      />

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Shed" value={shedId}
            onChange={e => setShedId((e.target as HTMLSelectElement).value)}
            options={(sheds ?? []).map((s: any) => ({
              value: s.id,
              label: `${s.farms?.name ?? ''} — Shed ${s.shed_no}${s.shed_name ? ` (${s.shed_name})` : ''}`,
            }))} />
          <DateInput label="Date" value={date} onChange={setDate} />
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
            {([['eggs', 'Eggs', Egg], ['mortality', 'Mortality', HeartCrack], ['feed', 'Feed', Wheat]] as const)
              .map(([k, label, Icon]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 border-b-2 -mb-px ${
                    tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  <Icon size={14} />{label}
                </button>
              ))}
          </div>

          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-x-6 gap-y-1">
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
            <div className="px-4 py-3 border-b border-gray-100 max-w-sm">
              <Select label="Feed type for the day (applies to every line)"
                value={feedTypeId}
                onChange={e => setFeedTypeId((e.target as HTMLSelectElement).value)}
                options={[{ value: '', label: '— Select —' },
                  ...(feedTypes ?? []).map((f: any) => ({ value: f.id, label: `${f.code} — ${f.name}` }))]} />
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th>Side</Th><Th>Line</Th><Th right>Boxes</Th>
                {tab === 'eggs' && <>
                  <Th right>R1</Th><Th right>R2</Th><Th right>R3</Th><Th right>R4</Th><Th right>Total</Th>
                </>}
                {tab === 'mortality' && <>
                  <Th right>Morning F</Th><Th right>Morning M</Th>
                  <Th right>Day F</Th><Th right>Day M</Th><Th right>Total</Th><Th>Reason</Th>
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
                      <Td right className="text-gray-500">{l.boxes ?? '—'}</Td>
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

          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
            {shed?.farms?.name} — Shed {shed?.shed_no} · {lines.length} lines · {fmtDate(date)}.
            A blank box is left alone on save; it is not stored as a zero.
          </div>
        </Card>
      )}
    </div>
  )
}
