import React, { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchAllPages, fmtDate } from '@/lib/utils'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import {
  Card, Button, Input, Select, Modal, SectionHeader, Spinner, EmptyState,
  SearchableSelect, DateInput, StatCard
} from '@/components/ui'
import { Plus, Trash2, Pencil, Upload, FileDown, Scale } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import toast from 'react-hot-toast'

// Weekly body weight and uniformity per flock, against the Vencobb430 standard.
//
// This is the panel the Monthly Production Review has always listed as
// deliberately absent: the app records feed and eggs daily but has never held a
// bird weight, so weight, gain, uniformity and CV had nothing to report from.
//
// Feed is NOT entered here. It is already recorded daily in daily_feed, and a
// second copy would give two answers to one question.
// Column order follows the farm's own weekly body weight register: actual
// average, then the spread (min and max), which is what that book records
// instead of a uniformity percentage.
const TEMPLATE_HEADERS = [
  'Flock No', 'Sex', 'Age (weeks)', 'Week Ending (DD/MM/YYYY)',
  'Avg Body Weight (g)', 'Min Body Weight (g)', 'Max Body Weight (g)',
  'Birds Weighed', 'Uniformity %', 'CV %', 'Remarks',
]
const TEMPLATE_EXAMPLE = ['23', 'Female', 1, '13/08/2026', 151, 99, 212, '', '', '', 'Full feed (1st week)']

export const FlockWeeklyPerformance: React.FC = () => {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [flockFilter, setFlockFilter] = useState('')
  const [sexFilter, setSexFilter] = useState('Female')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const blank = { flock_id: '', sex: 'Female', week_of_age: '', week_ending: '',
                  avg_body_weight_g: '', min_body_weight_g: '', max_body_weight_g: '',
                  birds_weighed: '', uniformity_pct: '', cv_pct: '', remarks: '' }
  const [form, setForm] = useState(blank)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: flocks = [] } = useQuery({
    queryKey: ['fwp_flocks'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('id,flock_no,placement_date,laying_season,rearing_season')
        .eq('is_vhl_contract', false).order('flock_no')
      return data ?? []
    }
  })

  // Plain select, with the flock joined in JS below. Embedding flocks(...) needs
  // a foreign key from flock_weekly_performance.flock_id to flocks.id; without
  // one PostgREST rejects the whole request and the page shows "nothing
  // recorded" even though the rows are there — which is exactly what happened
  // when this page first shipped. The flock list is already loaded above, so
  // there is nothing to gain from making the database do the join.
  const { data: rawRows = [], isLoading } = useQuery({
    queryKey: ['flock_weekly_performance'],
    queryFn: async () => fetchAllPages<any>((from, to) => supabase
      .from('flock_weekly_performance').select('*')
      .order('week_of_age').order('id').range(from, to), 'Weekly performance')
  })

  const rows = useMemo(() => {
    const byId = new Map((flocks as any[]).map((f: any) => [f.id, f]))
    return (rawRows as any[]).map((r: any) => ({ ...r, flocks: byId.get(r.flock_id) ?? null }))
  }, [rawRows, flocks])

  // The standard for the same weeks. Male standards are filed under season
  // 'Both' — the book gives one male curve for winter and summer alike.
  const { data: std = [] } = useQuery({
    queryKey: ['fwp_breed_standard'],
    queryFn: async () => {
      const { data } = await supabase.from('breed_standard')
        .select('season,sex,phase,week_of_age,body_weight_g,weekly_gain_g,feed_g_per_day,feed_type')
      return data ?? []
    }
  })

  // Which season's table applies depends on the PHASE, and the two are not the
  // same season:
  //
  //   weeks 1-24 (brooding/growing) -> the season the chicks were BROODED in,
  //     which the book defines by month: Summer Feb-Jul, Winter Aug-Jan. That
  //     is knowable from the placement date, so no one has to type it.
  //   weeks 24+ (laying) -> the flock's LAYING season, set on the flock master.
  //
  // Getting this wrong is how the standard came back empty for flock 23 week 1:
  // the page asked for a laying season on a one-week-old chick, found none, and
  // showed a dash as though the book had no figure.
  const broodingSeason = (placement?: string | null) => {
    if (!placement) return null
    const m = parseInt(placement.slice(5, 7), 10)
    return (m >= 2 && m <= 7) ? 'Summer' : 'Winter'
  }

  const stdFor = (sex: string, wk: number, flock: any) => {
    const rows = (std as any[]).filter((r: any) => r.sex === sex && r.week_of_age === wk)
    if (!rows.length) return null
    if (sex === 'Male') return rows.find((r: any) => r.season === 'Both') ?? null
    const laying = rows.filter((r: any) => r.phase === 'Laying')
    const growing = rows.filter((r: any) => r.phase === 'Growing')
    // Week 24 appears in both books; a flock with a laying season set is read as
    // laying, otherwise as the last growing week.
    if (wk > 24 || (wk === 24 && flock?.laying_season)) {
      return laying.find((r: any) => r.season === flock?.laying_season) ?? null
    }
    // A season the farm has RECORDED beats one worked out from the calendar:
    // the month rule is only a sensible default for flocks nobody has set.
    const bs = flock?.rearing_season || broodingSeason(flock?.placement_date)
    if (bs) return growing.find((r: any) => r.season === bs) ?? null
    // No placement date: only answer if both seasons agree for that week, so a
    // guess is never presented as the standard.
    const distinct = [...new Set(growing.map((r: any) => Number(r.body_weight_g)))]
    return distinct.length === 1 ? growing[0] : null
  }

  const flockOptions = flocks.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))

  const shown = useMemo(() => rows
    .filter((r: any) => (!flockFilter || r.flock_id === flockFilter) && (!sexFilter || r.sex === sexFilter))
    .map((r: any) => {
      const season = r.flocks?.laying_season ?? null
      const st = stdFor(r.sex, r.week_of_age, r.flocks)
      const actual = r.avg_body_weight_g == null ? null : Number(r.avg_body_weight_g)
      const target = st?.body_weight_g == null ? null : Number(st.body_weight_g)
      // Gain is the difference between this week and the previous week
      // RECORDED for the same flock and sex — not stored as its own figure,
      // which would let the two disagree. Week 1 has no previous week here, so
      // its gain shows a dash until a week 0 (placement weight) is entered.
      const prev = rows.find((p: any) => p.flock_id === r.flock_id && p.sex === r.sex
        && p.week_of_age === r.week_of_age - 1 && p.avg_body_weight_g != null)
      const gain = actual != null && prev ? actual - Number(prev.avg_body_weight_g) : null
      return {
        ...r, season, target, gain, stdGain: st?.weekly_gain_g ?? null,
        diff: actual != null && target != null ? actual - target : null,
        pctOfStd: actual != null && target ? Math.round(actual / target * 1000) / 10 : null,
        stdFeed: st?.feed_g_per_day ?? null,
        stdFeedType: st?.feed_type ?? null,
      }
    })
    // Week first, then sex: in the Both view the two sexes of a week belong
    // together, which is how the farm's own weekly report is laid out.
    .sort((a: any, b: any) => a.week_of_age - b.week_of_age || String(a.sex).localeCompare(String(b.sex))),
    [rows, flockFilter, sexFilter, std])

  // With one sex selected the chart is a plain actual-against-standard pair.
  // With Both, plotting one "Actual" line would draw a zig-zag between the
  // sexes, so each sex gets its own line and its own standard.
  const showingBoth = !sexFilter
  const chart = React.useMemo(() => {
    const withBw = shown.filter((r: any) => r.avg_body_weight_g != null)
    if (!showingBoth) {
      return withBw.map((r: any) => ({ wk: r.week_of_age, Actual: Number(r.avg_body_weight_g), Standard: r.target }))
    }
    const byWeek = new Map<number, any>()
    for (const r of withBw) {
      const e = byWeek.get(r.week_of_age) ?? { wk: r.week_of_age }
      if (r.sex === 'Male') { e['Male'] = Number(r.avg_body_weight_g); e['Male std'] = r.target }
      else { e['Female'] = Number(r.avg_body_weight_g); e['Female std'] = r.target }
      byWeek.set(r.week_of_age, e)
    }
    return [...byWeek.values()].sort((a, b) => a.wk - b.wk)
  }, [shown, showingBoth])

  const withBoth = shown.filter((r: any) => r.diff != null)
  const avgPct = withBoth.length
    ? Math.round(withBoth.reduce((a: number, r: any) => a + r.pctOfStd, 0) / withBoth.length * 10) / 10
    : null
  const belowStd = withBoth.filter((r: any) => r.diff < 0).length

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.flock_id) throw new Error('Pick a flock')
      const wk = parseInt(form.week_of_age)
      if (!wk || wk < 1 || wk > 100) throw new Error('Age in weeks must be between 1 and 100')
      const row = {
        flock_id: form.flock_id, sex: form.sex, week_of_age: wk,
        week_ending: form.week_ending || null,
        avg_body_weight_g: form.avg_body_weight_g === '' ? null : Number(form.avg_body_weight_g),
        min_body_weight_g: form.min_body_weight_g === '' ? null : Number(form.min_body_weight_g),
        max_body_weight_g: form.max_body_weight_g === '' ? null : Number(form.max_body_weight_g),
        birds_weighed: form.birds_weighed === '' ? null : parseInt(form.birds_weighed),
        uniformity_pct: form.uniformity_pct === '' ? null : Number(form.uniformity_pct),
        cv_pct: form.cv_pct === '' ? null : Number(form.cv_pct),
        remarks: form.remarks || null,
      }
      // One row per flock + week + sex. A second entry for the same week would
      // leave two answers to "what did they weigh that week".
      const q = editingId
        ? await supabase.from('flock_weekly_performance').update(row).eq('id', editingId)
        : await supabase.from('flock_weekly_performance').upsert(row, { onConflict: 'flock_id,week_of_age,sex' })
      if (q.error) throw q.error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_weekly_performance'] }); setShowForm(false); setEditingId(null); setForm(blank); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('flock_weekly_performance').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_weekly_performance'] }); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const { headers, rows: raw } = await parseFile(file)
      const idx = (name: string) => headers.findIndex(h => h.includes(name))
      const iFlock = idx('flock'), iSex = idx('sex'), iWk = idx('age'), iEnd = idx('week ending')
      // "avg/min/max body weight" all contain "body weight", so each is matched
      // on its own prefix first and only then on the generic name.
      const iBw = headers.findIndex(h => h.includes('avg body weight')) >= 0
        ? headers.findIndex(h => h.includes('avg body weight')) : idx('body weight')
      const iMin = headers.findIndex(h => h.includes('min body weight'))
      const iMax = headers.findIndex(h => h.includes('max body weight'))
      const iN = idx('birds'), iU = idx('uniformity'), iCv = idx('cv'), iRem = idx('remarks')
      if (iFlock < 0 || iWk < 0) throw new Error('The sheet needs at least a Flock No and an Age (weeks) column')

      // Flock is matched on flock_no, with or without an "F-" prefix, because
      // both forms appear in the farm's own sheets.
      const byNo = new Map<string, string>()
      for (const f of flocks as any[]) byNo.set(String(f.flock_no).trim().toUpperCase().replace(/^F-/, ''), f.id)

      let unknownFlock = 0, badWeek = 0
      const toSave: any[] = []
      for (const r of raw) {
        const key = String(r[iFlock] ?? '').trim().toUpperCase().replace(/^F-/, '')
        if (!key) continue
        const fid = byNo.get(key)
        if (!fid) { unknownFlock++; continue }
        const wk = parseInt(String(r[iWk] ?? '').trim())
        if (!wk || wk < 1 || wk > 100) { badWeek++; continue }
        const num = (i: number) => {
          if (i < 0) return null
          const v = String(r[i] ?? '').trim().replace(/,/g, '')
          return v === '' ? null : (isFinite(Number(v)) ? Number(v) : null)
        }
        // DD/MM/YYYY from the template, or an ISO date if the cell was a real
        // Excel date. Anything unreadable is left blank rather than guessed.
        let weekEnd: string | null = null
        if (iEnd >= 0) {
          const v = String(r[iEnd] ?? '').trim()
          const dmy = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
          if (dmy) weekEnd = `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`
          else if (/^\d{4}-\d{2}-\d{2}/.test(v)) weekEnd = v.slice(0, 10)
        }
        const sex = String(r[iSex] ?? 'Female').trim().toLowerCase().startsWith('m') ? 'Male' : 'Female'
        toSave.push({
          flock_id: fid, sex, week_of_age: wk, week_ending: weekEnd,
          avg_body_weight_g: num(iBw), min_body_weight_g: num(iMin), max_body_weight_g: num(iMax),
          birds_weighed: num(iN),
          uniformity_pct: num(iU), cv_pct: num(iCv),
          remarks: iRem >= 0 ? (String(r[iRem] ?? '').trim() || null) : null,
        })
      }
      if (!toSave.length) throw new Error(`Nothing to import — ${unknownFlock} row(s) had an unknown flock, ${badWeek} had no usable age`)

      const { error } = await supabase.from('flock_weekly_performance')
        .upsert(toSave, { onConflict: 'flock_id,week_of_age,sex' })
      if (error) throw error
      toast.success(`Imported ${toSave.length} week(s)${unknownFlock ? `, ${unknownFlock} unknown-flock row(s) skipped` : ''}${badWeek ? `, ${badWeek} row(s) with no usable age skipped` : ''}`)
      qc.invalidateQueries({ queryKey: ['flock_weekly_performance'] })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const openEdit = (r: any) => {
    setEditingId(r.id)
    setForm({
      flock_id: r.flock_id, sex: r.sex, week_of_age: String(r.week_of_age),
      week_ending: r.week_ending ?? '',
      avg_body_weight_g: r.avg_body_weight_g?.toString() ?? '',
      min_body_weight_g: r.min_body_weight_g?.toString() ?? '',
      max_body_weight_g: r.max_body_weight_g?.toString() ?? '',
      birds_weighed: r.birds_weighed?.toString() ?? '',
      uniformity_pct: r.uniformity_pct?.toString() ?? '',
      cv_pct: r.cv_pct?.toString() ?? '',
      remarks: r.remarks ?? '',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Flock Weekly Performance"
        subtitle={`Body weight and uniformity by week of age, against the Vencobb430 standard${
          rows.length ? ` — ${rows.length.toLocaleString('en-IN')} week(s) recorded` : ''}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<FileDown size={15} />}
              onClick={() => downloadXlsxTemplate('Flock_Weekly_Performance_Template.xlsx', TEMPLATE_HEADERS, TEMPLATE_EXAMPLE)}>
              Template
            </Button>
            <Button variant="secondary" icon={<Upload size={15} />} onClick={() => fileRef.current?.click()}>Import</Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            <Button icon={<Plus size={16} />} onClick={() => { setEditingId(null); setForm(blank); setShowForm(true) }}>Add Week</Button>
          </div>
        }
      />

      <Card>
        <p className="text-sm text-gray-600">
          Download the Template, fill one row per flock per week, and Import. Re-importing the same
          week overwrites that week rather than adding a second row, so a corrected sheet can simply
          be sent again.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Columns: Flock No · Sex · Age (weeks) · Week Ending · Avg / Min / Max Body Weight (g) ·
          Birds Weighed · Uniformity % · CV % · Remarks. Only Flock No and Age are required — leave the rest blank
          and they stay blank rather than becoming zero. Flock numbers match with or without "F-".
          Feed is not entered here: it is already recorded daily under Daily Entry.
        </p>
      </Card>

      <div className="flex gap-3 items-end flex-wrap">
        <SearchableSelect placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={v => setFlockFilter(v)} className="w-44" />
        <Select label="Sex" value={sexFilter} onChange={e => setSexFilter(e.target.value)}
          options={[{ value: 'Female', label: 'Female' }, { value: 'Male', label: 'Male' },
                    { value: '', label: 'Both (male and female)' }]} />
      </div>

      {withBoth.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard title="Weeks compared" value={withBoth.length.toString()} icon={<Scale size={18} />} color="text-brand-600" />
          <StatCard title="Average of standard" value={avgPct != null ? `${avgPct}%` : '—'} icon={<Scale size={18} />}
            color={avgPct != null && avgPct >= 97 ? 'text-green-600' : 'text-orange-500'} />
          <StatCard title="Weeks below standard" value={belowStd.toString()} icon={<Scale size={18} />}
            color={belowStd > 0 ? 'text-red-600' : 'text-green-600'} />
        </div>
      )}

      {isLoading ? <Spinner /> : shown.length === 0 ? (
        <Card><EmptyState title={rows.length ? 'No weeks for this selection' : 'No weekly weights recorded yet — use Template, then Import'} /></Card>
      ) : (
        <>
          {chart.length > 1 && (
            <Card>
              <h3 className="font-semibold text-gray-800 mb-4">Body weight against standard</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="wk" tick={{ fontSize: 11 }} label={{ value: 'Week of age', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => v == null ? '—' : `${Number(v).toLocaleString('en-IN')} g`} />
                  <Legend />
                  {showingBoth ? (
                    <>
                      <Line type="monotone" dataKey="Female" stroke="#ec4899" strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="Female std" stroke="#f9a8d4" strokeDasharray="4 4" dot={false} connectNulls />
                      <Line type="monotone" dataKey="Male" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="Male std" stroke="#93c5fd" strokeDasharray="4 4" dot={false} connectNulls />
                    </>
                  ) : (
                    <>
                      <Line type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Standard" stroke="#9ca3af" strokeDasharray="4 4" dot={false} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '1240px' }}>
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Flock</th>
                    <th className="px-3 py-2 text-right">Age (wk)</th>
                    <th className="px-3 py-2 text-left">Week ending</th>
                    <th className="px-3 py-2">Sex</th>
                    <th className="px-3 py-2 text-right">Actual (g)</th>
                    <th className="px-3 py-2 text-right">Standard (g)</th>
                    <th className="px-3 py-2 text-right">Diff</th>
                    <th className="px-3 py-2 text-right">% of Std</th>
                    <th className="px-3 py-2 text-right">Min</th>
                    <th className="px-3 py-2 text-right">Max</th>
                    <th className="px-3 py-2 text-right">Gain</th>
                    <th className="px-3 py-2 text-right">Std Gain</th>
                    <th className="px-3 py-2 text-right">Birds</th>
                    <th className="px-3 py-2 text-right">Uniformity</th>
                    <th className="px-3 py-2 text-left">Std feed</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r: any) => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">F-{r.flocks?.flock_no ?? '?'}</td>
                      <td className="px-3 py-2 text-right">{r.week_of_age}</td>
                      <td className="px-3 py-2">{r.week_ending ? fmtDate(r.week_ending) : '—'}</td>
                      <td className={`px-3 py-2 text-xs font-medium ${r.sex === 'Male' ? 'text-blue-600' : 'text-pink-600'}`}>{r.sex}</td>
                      <td className="px-3 py-2 text-right font-semibold">{r.avg_body_weight_g ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{r.target ?? '—'}</td>
                      <td className={`px-3 py-2 text-right font-medium ${r.diff == null ? 'text-gray-400' : r.diff < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {r.diff == null ? '—' : `${r.diff > 0 ? '+' : ''}${Math.round(r.diff)}`}
                      </td>
                      <td className="px-3 py-2 text-right">{r.pctOfStd == null ? '—' : `${r.pctOfStd}%`}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{r.min_body_weight_g ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{r.max_body_weight_g ?? '—'}</td>
                      <td className={`px-3 py-2 text-right ${r.gain == null ? 'text-gray-400' : r.stdGain != null && r.gain < r.stdGain ? 'text-red-600' : 'text-green-600'}`}>
                        {r.gain == null ? '—' : `+${Math.round(r.gain)}`}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500">{r.stdGain ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{r.birds_weighed ?? '—'}</td>
                      <td className="px-3 py-2 text-right">{r.uniformity_pct == null ? '—' : `${r.uniformity_pct}%`}</td>
                      <td className="px-3 py-2 text-gray-500">
                        {r.stdFeedType ? `${r.stdFeedType}${r.stdFeed ? ` · ${r.stdFeed} g` : ''}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEdit(r)}><Pencil size={14} className="text-gray-400 hover:text-brand-600" /></button>
                          <button onClick={() => confirm(`Delete week ${r.week_of_age} for F-${r.flocks?.flock_no}?`) && delMut.mutate(r.id)}>
                            <Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 px-3 py-2">
              Standard is the Vencobb430 figure for that age. For weeks 1-24 the season comes from
              when the chicks were BROODED — the book's own definition, Summer Feb-Jul and Winter
              Aug-Jan, worked out from the placement date. From week 24 it comes from the flock's
              LAYING season, set on the flock master. Males use the single male curve, which the book
              says applies to both seasons. A dash under Standard means the book has no figure for
              that age, or the flock has no laying season set yet.
            </p>
          </Card>
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editingId ? 'Edit Week' : 'Add Week'}
        footer={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>}>
        <div className="space-y-3">
          <SearchableSelect placeholder="Select flock" options={flockOptions}
            value={form.flock_id} onChange={v => s('flock_id', v)} />
          <Select label="Sex" value={form.sex} onChange={e => s('sex', e.target.value)}
            options={[{ value: 'Female', label: 'Female' }, { value: 'Male', label: 'Male' }]} />
          <Input label="Age (weeks) *" type="number" value={form.week_of_age} onChange={e => s('week_of_age', e.target.value)} />
          <DateInput label="Week ending" value={form.week_ending} onChange={e => s('week_ending', e.target.value)} />
          <Input label="Avg body weight (g)" type="number" step="1" value={form.avg_body_weight_g} onChange={e => s('avg_body_weight_g', e.target.value)} />
          <Input label="Min body weight (g)" type="number" value={form.min_body_weight_g} onChange={e => s('min_body_weight_g', e.target.value)} />
          <Input label="Max body weight (g)" type="number" value={form.max_body_weight_g} onChange={e => s('max_body_weight_g', e.target.value)} />
          <Input label="Birds weighed" type="number" value={form.birds_weighed} onChange={e => s('birds_weighed', e.target.value)}
            hint="An average from 20 birds is not the same as one from 200 — recording the count keeps that visible" />
          <Input label="Uniformity %" type="number" step="0.1" value={form.uniformity_pct} onChange={e => s('uniformity_pct', e.target.value)} />
          <Input label="CV %" type="number" step="0.1" value={form.cv_pct} onChange={e => s('cv_pct', e.target.value)} />
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
