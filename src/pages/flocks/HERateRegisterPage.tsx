import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, today } from '@/lib/utils'
import { Card, Button, Input, Select, FormRow, Modal, Table, Th, Td, SectionHeader, Spinner, EmptyState, DateInput, usePagination, PageSizeControl } from '@/components/ui'
import { Plus, Trash2, TrendingUp, Pencil, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = ['Weekly Rates', 'Vendor Rates', 'STD Production Curve'] as const

// Sunday of the week containing `d`
function weekStartOf(d: Date) {
  const x = new Date(d)
  x.setDate(x.getDate() - x.getDay())
  return x
}
// Local getters, NOT toISOString() (UTC) — the latter shifts the date back a
// day before 5:30am IST, saving a Saturday as the week's "Sunday" and breaking
// rate lookups keyed on week_start.
function fmt(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

export const HERateRegisterPage: React.FC = () => {
  const [tab, setTab] = useState<typeof TABS[number]>('Weekly Rates')
  return (
    <div className="space-y-5">
      <SectionHeader title="Hatching Egg Rate Register" subtitle="Weekly Association rate (Sun-Sat, declared Friday) — auto-suggested on HE Dispatch" />
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Weekly Rates' && <WeeklyRatesTab />}
      {tab === 'Vendor Rates' && <VendorRatesTab />}
      {tab === 'STD Production Curve' && <StdCurveTab />}
    </div>
  )
}

const WeeklyRatesTab: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const nextSunday = weekStartOf(new Date(new Date().setDate(new Date().getDate() + 7)))
  const nextSaturday = new Date(nextSunday); nextSaturday.setDate(nextSaturday.getDate() + 6)
  const blank = { week_start: fmt(nextSunday), week_end: fmt(nextSaturday), rate: '', declared_date: today(), remarks: '' }
  const [form, setForm] = useState(blank)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['he_rate_register'],
    queryFn: async () => { const { data } = await supabase.from('he_rate_register').select('*').order('week_start', { ascending: false }); return data ?? [] }
  })

  const filtered = search.trim()
    ? rates.filter((r: any) => `${r.week_start} ${r.week_end} ${r.declared_date ?? ''} ${r.rate} ${r.remarks ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    : rates
  const { page, setPage, pageSize, setPageSize, totalPages, from, to } = usePagination(filtered.length, filtered.length)
  const visibleRows = filtered.slice(from, to)

  const saveMut = useMutation({
    mutationFn: async () => {
      const rate = parseFloat(form.rate) || 0
      if (!rate) throw new Error('Enter rate')
      if (!form.week_start || !form.week_end) throw new Error('Pick the week')
      if (editingId) {
        const { error } = await supabase.from('he_rate_register')
          .update({ week_start: form.week_start, week_end: form.week_end, rate, declared_date: form.declared_date || null, remarks: form.remarks || null })
          .eq('id', editingId)
        if (error) throw error
      } else {
        // Adding used to silently overwrite an existing week's rate via
        // upsert — block it and point at Edit instead.
        const { data: existing } = await supabase.from('he_rate_register').select('id,rate').eq('week_start', form.week_start).maybeSingle()
        if (existing) throw new Error(`A rate (₹${existing.rate}) already exists for the week starting ${form.week_start} — edit that entry instead.`)
        const { error } = await supabase.from('he_rate_register')
          .insert({ week_start: form.week_start, week_end: form.week_end, rate, declared_date: form.declared_date || null, remarks: form.remarks || null })
        if (error) throw error
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['he_rate_register'] }); setShowForm(false); setEditingId(null); setForm(blank); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })
  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('he_rate_register').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['he_rate_register'] }); toast.success('Deleted') },
  })

  // Auto-set week_end when week_start picked (parse as local midnight so the
  // +6-day arithmetic can't straddle a UTC day boundary)
  const onWeekStart = (v: string) => {
    if (!v) { s('week_start', v); return }
    const d = new Date(v + 'T00:00:00'); const end = new Date(d); end.setDate(end.getDate() + 6)
    setForm(f => ({ ...f, week_start: v, week_end: fmt(end) }))
  }

  const openEdit = (r: any) => {
    setEditingId(r.id)
    setForm({ week_start: r.week_start, week_end: r.week_end, rate: r.rate?.toString() ?? '', declared_date: r.declared_date ?? '', remarks: r.remarks ?? '' })
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search week, rate, remarks…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <Button icon={<Plus size={14} />} onClick={() => { setEditingId(null); setForm(blank); setShowForm(true) }}>Add Weekly Rate</Button>
      </div>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Week (Sun-Sat)</Th><Th>Declared</Th><Th right>Rate</Th><Th>Remarks</Th><Th right>Actions</Th></tr></thead>
            <tbody>
              {visibleRows.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td className="font-medium">{r.week_start} → {r.week_end}</Td>
                  <Td>{r.declared_date ?? '—'}</Td>
                  <Td right className="font-semibold text-green-700">{inr(r.rate)}</Td>
                  <Td>{r.remarks ?? '—'}</Td>
                  <Td right>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(r)}><Pencil size={14} className="text-gray-400 hover:text-brand-600" /></button>
                      <button onClick={() => confirm('Delete this rate?') && delMut.mutate(r.id)}><Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button>
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><Td colSpan={5}><EmptyState icon={<TrendingUp size={28} />} title="No weekly rates found" /></Td></tr>}
            </tbody>
          </Table>
          <PageSizeControl page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize}
            totalPages={totalPages} totalItems={filtered.length} className="border-t border-gray-100" />
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Weekly Rate' : 'Add Weekly Rate'}
        footer={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>}>
        <div className="space-y-3">
          <FormRow>
            <DateInput label="Week Start (Sunday) *" value={form.week_start} onChange={e => onWeekStart(e.target.value)} />
            <DateInput label="Week End (Saturday)" value={form.week_end} onChange={e => s('week_end', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Rate (₹/egg) *" type="number" step="0.01" value={form.rate} onChange={e => s('rate', e.target.value)} />
            <DateInput label="Declared Date" value={form.declared_date} onChange={e => s('declared_date', e.target.value)} />
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

// ── VENDOR RATE DIFFERENTIAL ─────────────────────────────────────
// Vendor's actual rate = latest Association rate + this vendor's diff
// (e.g. Hitech = Association - 1.5).
const VendorRatesTab: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const blank = { party_id: '', diff: '', remarks: '' }
  const [form, setForm] = useState(blank)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: parties = [] } = useQuery({
    queryKey: ['parties_vendors'],
    queryFn: async () => { const { data } = await supabase.from('parties').select('id,name').in('type', ['supplier', 'both']).order('name'); return data ?? [] }
  })
  const { data: diffs = [], isLoading } = useQuery({
    queryKey: ['he_vendor_rate_diff'],
    queryFn: async () => { const { data } = await supabase.from('he_vendor_rate_diff').select('*, parties(name)').order('id'); return data ?? [] }
  })
  const { data: latestRate } = useQuery({
    queryKey: ['he_rate_latest'],
    // Only weeks that have already started — new rates default to NEXT
    // Sunday, so the newest row is usually a not-yet-effective future week
    // and every vendor's "Effective Rate" was computed against it.
    queryFn: async () => { const { data } = await supabase.from('he_rate_register').select('rate,week_start,week_end').lte('week_start', today()).order('week_start', { ascending: false }).limit(1).maybeSingle(); return data }
  })

  const filtered = search.trim()
    ? diffs.filter((r: any) => `${r.parties?.name ?? ''} ${r.diff} ${r.remarks ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    : diffs

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.party_id) throw new Error('Pick a vendor')
      const diff = parseFloat(form.diff) || 0
      if (editingId) {
        const { error } = await supabase.from('he_vendor_rate_diff').update({ party_id: form.party_id, diff, remarks: form.remarks || null }).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('he_vendor_rate_diff').upsert({ party_id: form.party_id, diff, remarks: form.remarks || null }, { onConflict: 'party_id' })
        if (error) throw error
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['he_vendor_rate_diff'] }); setShowForm(false); setEditingId(null); setForm(blank); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })
  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('he_vendor_rate_diff').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['he_vendor_rate_diff'] }); toast.success('Deleted') },
  })

  const openEdit = (r: any) => { setEditingId(r.id); setForm({ party_id: r.party_id, diff: r.diff?.toString() ?? '', remarks: r.remarks ?? '' }); setShowForm(true) }

  return (
    <div className="space-y-4">
      {latestRate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
          Latest Association rate ({latestRate.week_start} → {latestRate.week_end}): <strong>{inr(latestRate.rate)}</strong> — vendor rates below are computed against this.
        </div>
      )}
      <div className="flex justify-between items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <Button icon={<Plus size={14} />} onClick={() => { setEditingId(null); setForm(blank); setShowForm(true) }}>Add Vendor Rate</Button>
      </div>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Vendor</Th><Th right>Diff vs Association</Th><Th right>Effective Rate</Th><Th>Remarks</Th><Th right>Actions</Th></tr></thead>
            <tbody>
              {filtered.map((r: any) => {
                const eff = latestRate ? Number(latestRate.rate) + Number(r.diff) : null
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <Td className="font-medium">{r.parties?.name ?? '—'}</Td>
                    <Td right className={Number(r.diff) < 0 ? 'text-red-600' : Number(r.diff) > 0 ? 'text-green-600' : ''}>{Number(r.diff) > 0 ? '+' : ''}{r.diff}</Td>
                    <Td right className="font-semibold">{eff != null ? inr(eff) : '—'}</Td>
                    <Td>{r.remarks ?? '—'}</Td>
                    <Td right>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(r)}><Pencil size={14} className="text-gray-400 hover:text-brand-600" /></button>
                        <button onClick={() => confirm('Delete?') && delMut.mutate(r.id)}><Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><Td colSpan={5}><EmptyState title="No vendor rate differentials set yet" /></Td></tr>}
            </tbody>
          </Table>
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Vendor Rate' : 'Add Vendor Rate'}
        footer={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>}>
        <div className="space-y-3">
          <Select label="Vendor *" value={form.party_id} onChange={e => s('party_id', e.target.value)} placeholder="Select Vendor"
            options={parties.map((p: any) => ({ value: p.id, label: p.name }))} />
          <Input label="Diff vs Association Rate (₹/egg) *" type="number" step="0.01" value={form.diff} onChange={e => s('diff', e.target.value)}
            hint="e.g. -1.5 for a vendor that pays 1.5 less than Association rate" />
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

const SEASONS = ['Summer', 'Winter'] as const

// Column order matches the Venco "Production Performance" sheet exactly, so
// an import can map header -> field with no manual re-entry.
const STD_COLS: { key: string; label: string }[] = [
  { key: 'week_of_age',        label: 'Age (weeks)' },
  { key: 'cum_depletion_pct',  label: 'Cum Depletion %' },
  { key: 'hen_week_pct',       label: 'Hen Week %' },
  { key: 'he_pct',             label: 'HE %' },
  { key: 'weekly_te_hh',       label: 'Weekly TE/HH' },
  { key: 'cum_te_hh',          label: 'Cum. TE/HH' },
  { key: 'weekly_he_hh',       label: 'Weekly HE/HH' },
  { key: 'cum_he_hh',          label: 'Cum. HE/HH' },
  { key: 'hatch_pct',          label: 'Hatch %' },
  { key: 'weekly_chicks_hh',   label: 'Weekly Chicks/HH' },
  { key: 'cum_chicks_hh',      label: 'Cum. Chicks/HH' },
]

const StdCurveTab: React.FC = () => {
  const qc = useQueryClient()
  const [season, setSeason] = useState<typeof SEASONS[number]>('Summer')
  const [showForm, setShowForm] = useState(false)
  const [importing, setImporting] = useState(false)
  const blankForm = () => Object.fromEntries(STD_COLS.map(c => [c.key, '']))
  const [form, setForm] = useState<Record<string, string>>(blankForm())
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: curve = [], isLoading } = useQuery({
    queryKey: ['std_production_curve', season],
    queryFn: async () => { const { data } = await supabase.from('std_production_curve').select('*').eq('season', season).order('week_of_age'); return data ?? [] }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const week = parseInt(form.week_of_age)
      if (!week) throw new Error('Enter week of age')
      const row: any = { season, week_of_age: week }
      for (const c of STD_COLS) if (c.key !== 'week_of_age') row[c.key] = form[c.key] !== '' ? parseFloat(form[c.key]) : null
      const { error } = await supabase.from('std_production_curve').upsert(row, { onConflict: 'season,week_of_age' })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['std_production_curve', season] }); setShowForm(false); setForm(blankForm()); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })
  const delMut = useMutation({
    mutationFn: async (week: number) => { const { error } = await supabase.from('std_production_curve').delete().eq('season', season).eq('week_of_age', week); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['std_production_curve', season] }); toast.success('Deleted') },
  })

  // Import the exact Venco "Production Performance" Excel — one sheet per
  // season, title row names the season (SUMMER/WINTER), header row 2, data
  // from row 3. '---' cells (breed not yet laying at that age) are skipped.
  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      let totalRows = 0
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName]
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' })
        const titleRow = (raw[0] ?? []).join(' ').toUpperCase()
        const sheetSeason: 'Summer' | 'Winter' | null =
          titleRow.includes('SUMMER') ? 'Summer' : titleRow.includes('WINTER') ? 'Winter' : null
        if (!sheetSeason) continue
        const rows = raw.slice(2).filter(r => r[0] !== '' && r[0] != null)
        const upserts = rows.map(r => {
          const row: any = { season: sheetSeason, week_of_age: Number(r[0]) }
          const num = (v: any) => (v === '---' || v === '' || v == null ? null : Number(v))
          row.cum_depletion_pct = num(r[1]); row.hen_week_pct = num(r[2]); row.he_pct = num(r[3])
          row.weekly_te_hh = num(r[4]); row.cum_te_hh = num(r[5]); row.weekly_he_hh = num(r[6]); row.cum_he_hh = num(r[7])
          row.hatch_pct = num(r[8]); row.weekly_chicks_hh = num(r[9]); row.cum_chicks_hh = num(r[10])
          return row
        }).filter(r => !isNaN(r.week_of_age))
        // Dedupe within the sheet by (season, week_of_age) keeping the last —
        // Postgres aborts the whole upsert if one batch touches a key twice.
        const byKey = new Map(upserts.map(r => [`${r.season}|${r.week_of_age}`, r]))
        const deduped = [...byKey.values()]
        if (deduped.length) {
          const { error } = await supabase.from('std_production_curve').upsert(deduped, { onConflict: 'season,week_of_age' })
          if (error) throw error
          totalRows += deduped.length
        }
      }
      if (totalRows === 0) throw new Error("Couldn't find a SUMMER or WINTER sheet in this file")
      toast.success(`Imported ${totalRows} weeks`)
      qc.invalidateQueries({ queryKey: ['std_production_curve'] })
    } catch (e: any) { toast.error(e.message) }
    finally { setImporting(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <Select value={season} onChange={e => setSeason(e.target.value as any)} options={SEASONS.map(s => ({ value: s, label: `${s} Laying` }))} />
        <div className="flex gap-2">
          <label className={`text-sm font-medium px-3 py-2 rounded-lg border cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'}`}>
            {importing ? 'Importing…' : 'Import Venco Excel'}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = '' }} />
          </label>
          <Button icon={<Plus size={14} />} onClick={() => { setForm(blankForm()); setShowForm(true) }}>Add Week</Button>
        </div>
      </div>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <Table>
              <thead><tr>{STD_COLS.map(c => <Th key={c.key} right={c.key !== 'week_of_age'}>{c.label}</Th>)}<Th right>Actions</Th></tr></thead>
              <tbody>
                {curve.map((r: any) => (
                  <tr key={r.week_of_age} className="hover:bg-gray-50">
                    {STD_COLS.map(c => (
                      <Td key={c.key} right={c.key !== 'week_of_age'} className={c.key === 'week_of_age' ? 'font-medium' : 'text-xs'}>
                        {r[c.key] != null ? r[c.key] : '—'}
                      </Td>
                    ))}
                    <Td right><button onClick={() => confirm('Delete?') && delMut.mutate(r.week_of_age)}><Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button></Td>
                  </tr>
                ))}
                {curve.length === 0 && <tr><Td colSpan={STD_COLS.length + 1}><EmptyState title={`No ${season} Laying curve entries yet`} /></Td></tr>}
              </tbody>
            </Table>
          </div>
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={`Add ${season} Laying Week`}
        footer={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>}>
        <div className="space-y-3">
          {STD_COLS.map(c => (
            <Input key={c.key} label={c.key === 'week_of_age' ? 'Week of Age *' : c.label} type="number" step="0.01"
              value={form[c.key]} onChange={e => s(c.key, e.target.value)} />
          ))}
        </div>
      </Modal>
    </div>
  )
}
