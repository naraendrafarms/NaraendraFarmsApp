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
const TEMPLATE_HEADERS = [
  'Flock No', 'Sex', 'Age (weeks)', 'Week Ending (DD/MM/YYYY)',
  'Avg Body Weight (g)', 'Birds Weighed', 'Uniformity %', 'CV %', 'Remarks',
]
const TEMPLATE_EXAMPLE = ['19', 'Female', 30, '05/04/2026', 3450, 100, 82, 8.5, '']

export const FlockWeeklyPerformance: React.FC = () => {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [flockFilter, setFlockFilter] = useState('')
  const [sexFilter, setSexFilter] = useState('Female')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const blank = { flock_id: '', sex: 'Female', week_of_age: '', week_ending: '',
                  avg_body_weight_g: '', birds_weighed: '', uniformity_pct: '', cv_pct: '', remarks: '' }
  const [form, setForm] = useState(blank)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: flocks = [] } = useQuery({
    queryKey: ['fwp_flocks'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('id,flock_no,placement_date,laying_season')
        .eq('is_vhl_contract', false).order('flock_no')
      return data ?? []
    }
  })

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['flock_weekly_performance'],
    queryFn: async () => fetchAllPages<any>((from, to) => supabase
      .from('flock_weekly_performance').select('*, flocks(flock_no,laying_season)')
      .order('week_of_age').range(from, to), 'Weekly performance')
  })

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

  const stdFor = (sex: string, season: string | null, wk: number) =>
    (std as any[]).find((r: any) =>
      r.sex === sex && r.week_of_age === wk &&
      (sex === 'Male' ? r.season === 'Both' : r.season === season)) ?? null

  const flockOptions = flocks.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))

  const shown = useMemo(() => rows
    .filter((r: any) => (!flockFilter || r.flock_id === flockFilter) && (!sexFilter || r.sex === sexFilter))
    .map((r: any) => {
      const season = r.flocks?.laying_season ?? null
      const st = stdFor(r.sex, season, r.week_of_age)
      const actual = r.avg_body_weight_g == null ? null : Number(r.avg_body_weight_g)
      const target = st?.body_weight_g == null ? null : Number(st.body_weight_g)
      return {
        ...r, season, target,
        diff: actual != null && target != null ? actual - target : null,
        pctOfStd: actual != null && target ? Math.round(actual / target * 1000) / 10 : null,
        stdFeed: st?.feed_g_per_day ?? null,
        stdFeedType: st?.feed_type ?? null,
      }
    })
    .sort((a: any, b: any) => a.week_of_age - b.week_of_age), [rows, flockFilter, sexFilter, std])

  const chart = shown
    .filter((r: any) => r.avg_body_weight_g != null)
    .map((r: any) => ({ wk: r.week_of_age, Actual: Number(r.avg_body_weight_g), Standard: r.target }))

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
      const iBw = idx('body weight'), iN = idx('birds'), iU = idx('uniformity'), iCv = idx('cv'), iRem = idx('remarks')
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
          avg_body_weight_g: num(iBw), birds_weighed: num(iN),
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
          Columns: Flock No · Sex · Age (weeks) · Week Ending · Avg Body Weight (g) · Birds Weighed ·
          Uniformity % · CV % · Remarks. Only Flock No and Age are required — leave the rest blank
          and they stay blank rather than becoming zero. Flock numbers match with or without "F-".
          Feed is not entered here: it is already recorded daily under Daily Entry.
        </p>
      </Card>

      <div className="flex gap-3 items-end flex-wrap">
        <SearchableSelect placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={v => setFlockFilter(v)} className="w-44" />
        <Select label="Sex" value={sexFilter} onChange={e => setSexFilter(e.target.value)}
          options={[{ value: 'Female', label: 'Female' }, { value: 'Male', label: 'Male' }]} />
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
                  <Line type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Standard" stroke="#9ca3af" strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '1000px' }}>
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Flock</th>
                    <th className="px-3 py-2 text-right">Age (wk)</th>
                    <th className="px-3 py-2 text-left">Week ending</th>
                    <th className="px-3 py-2 text-right">Actual (g)</th>
                    <th className="px-3 py-2 text-right">Standard (g)</th>
                    <th className="px-3 py-2 text-right">Diff</th>
                    <th className="px-3 py-2 text-right">% of Std</th>
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
                      <td className="px-3 py-2 text-right font-semibold">{r.avg_body_weight_g ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{r.target ?? '—'}</td>
                      <td className={`px-3 py-2 text-right font-medium ${r.diff == null ? 'text-gray-400' : r.diff < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {r.diff == null ? '—' : `${r.diff > 0 ? '+' : ''}${Math.round(r.diff)}`}
                      </td>
                      <td className="px-3 py-2 text-right">{r.pctOfStd == null ? '—' : `${r.pctOfStd}%`}</td>
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
              Standard is the Vencobb430 figure for that age — Summer or Winter by the flock's laying
              season, and the single male curve for males. A dash under Standard means the book has no
              figure for that age, not that the target is zero.
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
