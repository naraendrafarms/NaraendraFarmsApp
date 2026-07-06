import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import {
  Card, CardHeader, Button, Input, Select, FormRow, SectionHeader, Spinner,
  EmptyState, Table, Th, Td, DateInput, Badge, Modal
} from '@/components/ui'
import { Save, ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Bird, Download, Printer, Upload, Egg, TrendingUp, Activity, DollarSign } from 'lucide-react'
import { StatCard } from '@/components/ui'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import toast from 'react-hot-toast'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import * as XLSX from 'xlsx'

function exportCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}
const localYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// ═══════════════════════════════════════════════════════════════
// VHL Flocks — flocks flagged is_vhl_contract, entry point to the rest
// ═══════════════════════════════════════════════════════════════
export const VHLFlocksPage: React.FC = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: flocks, isLoading } = useQuery({
    queryKey: ['vhl_flocks'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('id,flock_no,status,breed,placement_date,total_placed_f,total_placed_m,laying_farm_id,rearing_farm_id,farms!laying_farm_id(name)')
        .eq('is_vhl_contract', true).order('flock_no')
      return data ?? []
    }
  })

  // Latest shed-wise/daily closing counts, so the list reflects real current
  // birds instead of the static placement-day numbers on the flocks table.
  const { data: latestDaily } = useQuery({
    queryKey: ['vhl_flocks_latest_daily'],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry')
        .select('flock_id,record_date,opening_female,opening_male,closing_female,closing_male')
        .order('record_date', { ascending: false }).limit(2000)
      return data ?? []
    }
  })
  const currentByFlock = React.useMemo(() => {
    const latestDate: Record<string, string> = {}
    for (const r of (latestDaily ?? [])) if (!latestDate[r.flock_id] || r.record_date > latestDate[r.flock_id]) latestDate[r.flock_id] = r.record_date
    const out: Record<string, { female: number; male: number; date: string }> = {}
    for (const r of (latestDaily ?? [])) {
      if (r.record_date !== latestDate[r.flock_id]) continue
      if (!out[r.flock_id]) out[r.flock_id] = { female: 0, male: 0, date: r.record_date }
      out[r.flock_id].female += r.closing_female ?? r.opening_female ?? 0
      out[r.flock_id].male += r.closing_male ?? r.opening_male ?? 0
    }
    return out
  }, [latestDaily])

  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const openEdit = (f: any) => {
    setEditing(f)
    setForm({ breed: f.breed ?? '', placement_date: f.placement_date ?? '', status: f.status ?? 'rearing',
      total_placed_f: f.total_placed_f ?? '', total_placed_m: f.total_placed_m ?? '' })
  }
  const s = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('flocks').update({
        breed: form.breed || null, placement_date: form.placement_date || null, status: form.status,
        total_placed_f: parseInt(form.total_placed_f) || 0, total_placed_m: parseInt(form.total_placed_m) || 0,
      }).eq('id', editing.id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Flock updated'); qc.invalidateQueries({ queryKey: ['vhl_flocks'] }); qc.invalidateQueries({ queryKey: ['vhl_dashboard_flocks'] }); setEditing(null) },
    onError: (e: any) => toast.error(e.message),
  })

  const goToDailyEntry = (flockId: string) => { localStorage.setItem('vhl_de_flock', flockId); navigate('/vhl/daily-entry') }

  return (
    <div className="space-y-5">
      <SectionHeader title="VHL Flocks" subtitle="Contract flocks under VHL regulations — separate from our normal flock operations." />
      {isLoading ? <Spinner /> : !flocks?.length ? (
        <EmptyState icon={<Bird size={32}/>} title="No VHL flocks yet" subtitle="Tag a flock as a VHL contract flock in Flock Management to see it here." />
      ) : (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Flock No</Th><Th>Site</Th><Th>Breed</Th><Th>Status</Th><Th>Placement Date</Th><Th right>Current ♀</Th><Th right>Current ♂</Th><Th right>As of</Th><Th right>Actions</Th></tr></thead>
            <tbody>
              {flocks.map((f: any) => {
                const c = currentByFlock[f.id]
                return (
                <tr key={f.id} className="hover:bg-gray-50 text-sm">
                  <Td className="font-medium">
                    <button className="text-brand-700 hover:underline" onClick={() => goToDailyEntry(f.id)} title="Open Daily Entry for this flock">{f.flock_no}</button>
                  </Td>
                  <Td className="text-xs">{f.farms?.name ?? '—'}</Td>
                  <Td className="text-xs">{f.breed ?? '—'}</Td>
                  <Td><Badge color={f.status==='closed'?'gray':'green'}>{f.status}</Badge></Td>
                  <Td className="text-xs">{f.placement_date ? fmtDate(f.placement_date) : '—'}</Td>
                  <Td right className="text-xs">{(c?.female ?? f.total_placed_f)?.toLocaleString('en-IN') ?? '—'}</Td>
                  <Td right className="text-xs">{(c?.male ?? f.total_placed_m)?.toLocaleString('en-IN') ?? '—'}</Td>
                  <Td right className="text-xs text-gray-400">{c ? fmtDate(c.date) : 'placement'}</Td>
                  <Td right><Button size="sm" variant="ghost" onClick={() => openEdit(f)}><Pencil size={13}/></Button></Td>
                </tr>
              )})}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit Flock ${editing?.flock_no ?? ''}`}
        footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save</Button></>}>
        <div className="space-y-3">
          <FormRow>
            <Input label="Breed" value={form.breed} onChange={e => s('breed', e.target.value)} />
            <DateInput label="Placement Date" value={form.placement_date} onChange={e => s('placement_date', e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Status" value={form.status} onChange={e => s('status', e.target.value)}
              options={[{ value: 'rearing', label: 'Rearing' }, { value: 'laying', label: 'Laying' }, { value: 'closed', label: 'Closed' }]} />
          </FormRow>
          <FormRow>
            <Input label="Total Placed F" type="number" value={form.total_placed_f} onChange={e => s('total_placed_f', e.target.value)} />
            <Input label="Total Placed M" type="number" value={form.total_placed_m} onChange={e => s('total_placed_m', e.target.value)} />
          </FormRow>
          <p className="text-xs text-gray-400">These are the flock's original placement numbers. Day-to-day bird counts (Current ♀/♂ above) come from Daily Entry, not from here.</p>
        </div>
      </Modal>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VHL Daily Entry — mirrors regular Daily Entry's bird/feed/egg fields,
// writes to vhl_daily_entry (fully separate table, no shed/cost complexity
// since feed/medicine here don't come from our stock).
// ═══════════════════════════════════════════════════════════════
const EMPTY_VHL_DAILY = {
  opening_female: '', opening_male: '',
  received_female: '0', received_male: '0',
  trcull_female: '0', trcull_male: '0',
  mortality_female: '0', mortality_male: '0',
  closing_female: '', closing_male: '',
  feed_female_kg: '', feed_male_kg: '', feed_type_f: '', feed_type_m: '',
  total_eggs: '', he_eggs: '', je_eggs: '0', te_eggs: '0', be_eggs: '0', le_eggs: '0',
  lighting_hrs: '', age_weeks: '', remarks: '',
}

export const VHLDailyEntryPage: React.FC = () => {
  const qc = useQueryClient()
  const [flockId, setFlockId] = useState(() => localStorage.getItem('vhl_de_flock') ?? '')
  const [date, setDate] = useState(() => localStorage.getItem('vhl_de_date') ?? today())
  useEffect(() => { localStorage.setItem('vhl_de_flock', flockId) }, [flockId])
  useEffect(() => { localStorage.setItem('vhl_de_date', date) }, [date])

  const { data: flocks } = useQuery({
    queryKey: ['vhl_flocks_active_de'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks').select('id,flock_no,status,placement_date,laying_start_date')
        .eq('is_vhl_contract', true).neq('status', 'closed').order('flock_no')
      return data ?? []
    }
  })
  const flock = flocks?.find((f: any) => f.id === flockId)
  const isLayingPhase = flock?.status === 'laying' || !!(flock?.laying_start_date && date >= flock.laying_start_date)

  // This screen only ever writes/reads the no-shed (whole-flock) row for a
  // date — shed-wise rows are Bulk Daily Entry's. Without this filter,
  // .maybeSingle() throws once any shed-wise rows exist for the same
  // flock+date (more than one row would match).
  const { data: existing } = useQuery({
    queryKey: ['vhl_daily_record', flockId, date],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry').select('*').eq('flock_id', flockId).eq('record_date', date).is('shed_id', null).maybeSingle()
      return data
    },
    enabled: !!flockId && !!date
  })

  const { data: prevRecord } = useQuery({
    queryKey: ['vhl_prev_daily', flockId, date],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry').select('closing_female,closing_male,record_date')
        .eq('flock_id', flockId).is('shed_id', null).lt('record_date', date).order('record_date', { ascending: false }).limit(1).maybeSingle()
      return data
    },
    enabled: !!flockId && !!date
  })

  const [form, setForm] = useState<any>(EMPTY_VHL_DAILY)

  useEffect(() => {
    if (existing) {
      setForm({
        opening_female: existing.opening_female?.toString() ?? '', opening_male: existing.opening_male?.toString() ?? '',
        received_female: existing.received_female?.toString() ?? '0', received_male: existing.received_male?.toString() ?? '0',
        trcull_female: existing.trcull_female?.toString() ?? '0', trcull_male: existing.trcull_male?.toString() ?? '0',
        mortality_female: existing.mortality_female?.toString() ?? '0', mortality_male: existing.mortality_male?.toString() ?? '0',
        closing_female: existing.closing_female?.toString() ?? '', closing_male: existing.closing_male?.toString() ?? '',
        feed_female_kg: existing.feed_female_kg?.toString() ?? '', feed_male_kg: existing.feed_male_kg?.toString() ?? '',
        feed_type_f: existing.feed_type_f ?? '', feed_type_m: existing.feed_type_m ?? '',
        total_eggs: existing.total_eggs?.toString() ?? '', he_eggs: existing.he_eggs?.toString() ?? '',
        je_eggs: existing.je_eggs?.toString() ?? '0', te_eggs: existing.te_eggs?.toString() ?? '0',
        be_eggs: existing.be_eggs?.toString() ?? '0', le_eggs: existing.le_eggs?.toString() ?? '0',
        lighting_hrs: existing.lighting_hrs?.toString() ?? '', age_weeks: existing.age_weeks?.toString() ?? '',
        remarks: existing.remarks ?? '',
      })
    } else if (prevRecord) {
      setForm((f: any) => ({ ...f, opening_female: prevRecord.closing_female?.toString() ?? '', opening_male: prevRecord.closing_male?.toString() ?? '' }))
    } else {
      setForm(EMPTY_VHL_DAILY)
    }
  }, [existing, prevRecord])

  useEffect(() => {
    if (existing || !flock?.placement_date || !date) return
    const dayAge = Math.floor((new Date(date).getTime() - new Date(flock.placement_date).getTime()) / 86400000)
    const wk = parseFloat((dayAge / 7).toFixed(1))
    if (wk >= 0) setForm((f: any) => ({ ...f, age_weeks: wk.toString() }))
  }, [existing, flock, date])

  const set = (k: string, v: string) => setForm((f: any) => {
    const nf = { ...f, [k]: v }
    // First-ever entry for this flock (no prior day to carry Opening forward
    // from) — Received IS the Opening count, so auto-fill it instead of
    // making you type the same number twice.
    if (!existing && !prevRecord) {
      if (k === 'received_female' && !f.opening_female) nf.opening_female = v
      if (k === 'received_male' && !f.opening_male) nf.opening_male = v
    }
    if (['opening_female','opening_male','received_female','received_male','trcull_female','trcull_male','mortality_female','mortality_male'].includes(k)) {
      const of = parseInt(nf.opening_female) || 0, om = parseInt(nf.opening_male) || 0
      const tf = parseInt(nf.trcull_female) || 0, tm = parseInt(nf.trcull_male) || 0
      const mf = parseInt(nf.mortality_female) || 0, mm = parseInt(nf.mortality_male) || 0
      nf.closing_female = Math.max(0, of - tf - mf).toString()
      nf.closing_male = Math.max(0, om - tm - mm).toString()
    }
    if (['he_eggs','je_eggs','te_eggs','be_eggs','le_eggs'].includes(k)) {
      const he = parseInt(k==='he_eggs'?v:nf.he_eggs)||0, je = parseInt(k==='je_eggs'?v:nf.je_eggs)||0
      const te = parseInt(k==='te_eggs'?v:nf.te_eggs)||0, be = parseInt(k==='be_eggs'?v:nf.be_eggs)||0, le = parseInt(k==='le_eggs'?v:nf.le_eggs)||0
      nf.total_eggs = (he+je+te+be+le) ? String(he+je+te+be+le) : ''
    }
    return nf
  })

  const mut = useMutation({
    mutationFn: async () => {
      if (!flockId || !date) throw new Error('Select flock and date')
      const payload = {
        flock_id: flockId, record_date: date,
        opening_female: parseInt(form.opening_female) || 0, opening_male: parseInt(form.opening_male) || 0,
        received_female: parseInt(form.received_female) || 0, received_male: parseInt(form.received_male) || 0,
        trcull_female: parseInt(form.trcull_female) || 0, trcull_male: parseInt(form.trcull_male) || 0,
        mortality_female: parseInt(form.mortality_female) || 0, mortality_male: parseInt(form.mortality_male) || 0,
        closing_female: parseInt(form.closing_female) || 0, closing_male: parseInt(form.closing_male) || 0,
        feed_female_kg: parseFloat(form.feed_female_kg) || 0, feed_male_kg: parseFloat(form.feed_male_kg) || 0,
        feed_type_f: form.feed_type_f || null, feed_type_m: form.feed_type_m || null,
        total_eggs: parseInt(form.total_eggs) || 0, he_eggs: parseInt(form.he_eggs) || 0,
        je_eggs: parseInt(form.je_eggs) || 0, te_eggs: parseInt(form.te_eggs) || 0,
        be_eggs: parseInt(form.be_eggs) || 0, le_eggs: parseInt(form.le_eggs) || 0,
        lighting_hrs: parseFloat(form.lighting_hrs) || null, age_weeks: parseFloat(form.age_weeks) || null,
        remarks: form.remarks || null,
      }
      if (existing) {
        const { error } = await supabase.from('vhl_daily_entry').update(payload).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('vhl_daily_entry').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(existing ? 'VHL record updated' : 'VHL record saved')
      qc.invalidateQueries({ queryKey: ['vhl_daily_record'] })
      qc.invalidateQueries({ queryKey: ['vhl_recent_records'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const prevDay = () => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()-1); setDate(localYMD(d)) }
  const nextDay = () => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()+1); setDate(localYMD(d)) }

  // Anchored to the date being edited, not real-world "today" — see same
  // fix in VHLBulkDailyEntryPage for why.
  const fourteenDaysBeforeSelected = (() => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()-14); return localYMD(d) })()
  const { data: recentRecords } = useQuery({
    queryKey: ['vhl_recent_records', flockId, fourteenDaysBeforeSelected],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry').select('*').eq('flock_id', flockId).is('shed_id', null).gte('record_date', fourteenDaysBeforeSelected).lte('record_date', date).order('record_date', { ascending: false })
      return data ?? []
    },
    enabled: !!flockId
  })

  const openF = parseInt(form.opening_female) || 0
  const totalEggs = parseInt(form.total_eggs) || 0
  const hdPct = openF > 0 ? (totalEggs / openF * 100).toFixed(1) + '%' : '—'

  const VHL_DAILY_HEADERS = ['date','opening_female','opening_male','feed_female_kg','feed_type_f','feed_male_kg','feed_type_m','he_eggs','je_eggs','te_eggs','be_eggs','le_eggs','transfer_female','transfer_male','cull_female','cull_male','mortality_female','mortality_male','lighting_hrs','age_weeks','remarks']
  const VHL_DAILY_EXAMPLE = ['2026-01-01',20800,2500,1200,'L1',150,'MALE',15000,0,0,300,0,0,0,0,0,20,15,16,60,'']
  const importRef = React.useRef<HTMLInputElement>(null)

  const handleTemplate = () => downloadXlsxTemplate('vhl_daily_entry_template.xlsx', VHL_DAILY_HEADERS, VHL_DAILY_EXAMPLE)
  const handleExport = async () => {
    if (!flockId) { toast.error('Select a flock first'); return }
    const { data } = await supabase.from('vhl_daily_entry').select('*').eq('flock_id', flockId).is('shed_id', null).order('record_date')
    if (!data?.length) { toast.error('No records to export'); return }
    exportCSV(`vhl_daily_${flock?.flock_no}_records.csv`, VHL_DAILY_HEADERS,
      data.map((r: any) => [r.record_date,r.opening_female,r.opening_male,r.feed_female_kg,r.feed_type_f,r.feed_male_kg,r.feed_type_m,r.he_eggs,r.je_eggs,r.te_eggs,r.be_eggs,r.le_eggs,r.transfer_female,r.transfer_male,r.cull_female,r.cull_male,r.mortality_female,r.mortality_male,r.lighting_hrs,r.age_weeks,r.remarks]))
  }
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!flockId) { toast.error('Select a flock first'); e.target.value = ''; return }
    const { headers, rows } = await parseFile(file)
    const col = (n: string) => { const i = headers.indexOf(n); return i >= 0 ? i : headers.indexOf(n.replace(/_/g,'')) }
    let saved = 0, skipped = 0
    for (const r of rows) {
      const dateVal = r[col('date')]?.trim()
      if (!dateVal) { skipped++; continue }
      const openingF = parseInt(r[col('opening_female')] || '0') || 0
      const openingM = parseInt(r[col('opening_male')] || '0') || 0
      const transferF = parseInt(r[col('transfer_female')] || '0') || 0
      const transferM = parseInt(r[col('transfer_male')] || '0') || 0
      const cullF = parseInt(r[col('cull_female')] || '0') || 0
      const cullM = parseInt(r[col('cull_male')] || '0') || 0
      const mortalityF = parseInt(r[col('mortality_female')] || '0') || 0
      const mortalityM = parseInt(r[col('mortality_male')] || '0') || 0
      const he = parseInt(r[col('he_eggs')] || '0') || 0
      const je = parseInt(r[col('je_eggs')] || '0') || 0
      const te = parseInt(r[col('te_eggs')] || '0') || 0
      const be = parseInt(r[col('be_eggs')] || '0') || 0
      const le = parseInt(r[col('le_eggs')] || '0') || 0
      const payload: any = {
        flock_id: flockId, record_date: dateVal,
        opening_female: openingF, opening_male: openingM,
        feed_female_kg: parseFloat(r[col('feed_female_kg')] || '0') || 0,
        feed_male_kg: parseFloat(r[col('feed_male_kg')] || '0') || 0,
        feed_type_f: r[col('feed_type_f')] || null, feed_type_m: r[col('feed_type_m')] || null,
        he_eggs: he, je_eggs: je, te_eggs: te, be_eggs: be, le_eggs: le, total_eggs: he+je+te+be+le,
        transfer_female: transferF, transfer_male: transferM, cull_female: cullF, cull_male: cullM,
        trcull_female: transferF + cullF, trcull_male: transferM + cullM,
        mortality_female: mortalityF, mortality_male: mortalityM,
        closing_female: Math.max(0, openingF - transferF - cullF - mortalityF),
        closing_male: Math.max(0, openingM - transferM - cullM - mortalityM),
        lighting_hrs: parseFloat(r[col('lighting_hrs')] || '') || null,
        age_weeks: parseFloat(r[col('age_weeks')] || '') || null,
        remarks: r[col('remarks')] || null,
      }
      const { data: existingRow } = await supabase.from('vhl_daily_entry').select('id').eq('flock_id', flockId).eq('record_date', dateVal).is('shed_id', null).maybeSingle()
      const { error } = existingRow
        ? await supabase.from('vhl_daily_entry').update(payload).eq('id', existingRow.id)
        : await supabase.from('vhl_daily_entry').insert(payload)
      if (error) { skipped++; console.error(error) } else saved++
    }
    qc.invalidateQueries({ queryKey: ['vhl_daily_record'] })
    qc.invalidateQueries({ queryKey: ['vhl_recent_records'] })
    toast.success(`Imported ${saved} records${skipped ? `, skipped ${skipped}` : ''}`)
    e.target.value = ''
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="VHL Daily Entry" subtitle="Daily production & bird movement for VHL contract flocks — separate from our regular flock records."
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleTemplate}>Template</Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={() => importRef.current?.click()}>Import Excel/CSV</Button>
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </div>
        } />
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <Select label="VHL Flock" required placeholder="— Choose flock —"
              options={(flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no} — ${f.status}` }))}
              value={flockId} onChange={e => setFlockId(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={prevDay} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><ChevronLeft size={16}/></button>
            <DateInput label="Date" value={date} onChange={e => setDate(e.target.value)} />
            <button onClick={nextDay} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><ChevronRight size={16}/></button>
          </div>
          {existing && <Badge color="blue">Editing existing record</Badge>}
        </div>
      </Card>

      {flockId && (
        <>
          <Card>
            <CardHeader title="Bird Count" />
            <div className="space-y-4">
              <FormRow cols={4}>
                <Input label="Opening Female" type="number" value={form.opening_female} onChange={e => set('opening_female', e.target.value)} />
                <Input label="Opening Male" type="number" value={form.opening_male} onChange={e => set('opening_male', e.target.value)} />
                <Input label="Received Female" type="number" value={form.received_female} onChange={e => set('received_female', e.target.value)} hint="Birds received from rearing site" />
                <Input label="Received Male" type="number" value={form.received_male} onChange={e => set('received_male', e.target.value)} />
              </FormRow>
              <FormRow cols={4}>
                <Input label="Transfer/Cull Female" type="number" value={form.trcull_female} onChange={e => set('trcull_female', e.target.value)} />
                <Input label="Transfer/Cull Male" type="number" value={form.trcull_male} onChange={e => set('trcull_male', e.target.value)} />
                <Input label="Mortality Female" type="number" value={form.mortality_female} onChange={e => set('mortality_female', e.target.value)} />
                <Input label="Mortality Male" type="number" value={form.mortality_male} onChange={e => set('mortality_male', e.target.value)} />
              </FormRow>
              <FormRow cols={4}>
                <Input label="Closing Female" type="number" disabled value={form.closing_female} hint="Auto: Opening − Tr/Cull − Mortality" />
                <Input label="Closing Male" type="number" disabled value={form.closing_male} hint="Auto" />
              </FormRow>
            </div>
          </Card>

          <Card>
            <CardHeader title="Feed Consumption (VHL-supplied, record only)" />
            <FormRow cols={4}>
              <Input label="Female Feed (kg)" type="number" step="0.001" value={form.feed_female_kg} onChange={e => set('feed_female_kg', e.target.value)} />
              <Input label="Female Feed Type" value={form.feed_type_f} onChange={e => set('feed_type_f', e.target.value)} placeholder="Per VHL spec" />
              <Input label="Male Feed (kg)" type="number" step="0.001" value={form.feed_male_kg} onChange={e => set('feed_male_kg', e.target.value)} />
              <Input label="Male Feed Type" value={form.feed_type_m} onChange={e => set('feed_type_m', e.target.value)} placeholder="Per VHL spec" />
            </FormRow>
          </Card>

          {isLayingPhase ? (
            <Card>
              <CardHeader title="Egg Collection" action={<span className="text-sm">HD%: <strong>{hdPct}</strong></span>} />
              <FormRow cols={2}>
                <Input label="Total Eggs" type="number" disabled value={form.total_eggs} hint="Auto: HE+JE+TE+BE+LE" />
                <Input label="HE (Hatching Eggs)" type="number" value={form.he_eggs} onChange={e => set('he_eggs', e.target.value)} />
              </FormRow>
              <div className="mt-3">
                <FormRow cols={3}>
                  <Input label="Jumbo Eggs (JE)" type="number" value={form.je_eggs} onChange={e => set('je_eggs', e.target.value)} />
                  <Input label="Table Eggs (TE)" type="number" value={form.te_eggs} onChange={e => set('te_eggs', e.target.value)} />
                  <Input label="Broken Eggs (BE)" type="number" value={form.be_eggs} onChange={e => set('be_eggs', e.target.value)} />
                </FormRow>
                <div className="mt-3">
                  <Input label="Leached Eggs (LE)" type="number" value={form.le_eggs} onChange={e => set('le_eggs', e.target.value)} />
                </div>
              </div>
            </Card>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">🥚 Egg collection fields appear once this flock starts laying.</div>
          )}

          <Card>
            <CardHeader title="Other Details" />
            <FormRow>
              <Input label="Lighting Hours" type="number" step="0.5" value={form.lighting_hrs} onChange={e => set('lighting_hrs', e.target.value)} />
              <Input label="Age (Weeks)" type="number" step="0.1" value={form.age_weeks} onChange={e => set('age_weeks', e.target.value)} />
            </FormRow>
            <div className="mt-4"><Input label="Remarks" value={form.remarks} onChange={e => set('remarks', e.target.value)} /></div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button icon={<Save size={16}/>} loading={mut.isPending} onClick={() => mut.mutate()}>{existing ? 'Update Record' : 'Save Record'}</Button>
          </div>

          {recentRecords && recentRecords.length > 0 && (
            <Card>
              <p className="font-semibold text-gray-800 text-sm mb-3">Recent Records (Last 14 Days)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-100">
                    {['Date','♀ Deaths','♂ Deaths','HE','JE+TE+BE','Feed kg','HD%',''].map((h,i) => <th key={i} className="py-2 px-2 text-left font-semibold text-gray-500">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {recentRecords.map((r: any) => {
                      const nhe = (r.je_eggs??0)+(r.te_eggs??0)+(r.be_eggs??0)
                      const of = r.opening_female ?? 0
                      const hd = of > 0 ? ((r.total_eggs??0)/of*100) : null
                      return (
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-1.5 px-2 font-medium">{r.record_date}</td>
                          <td className="py-1.5 px-2">{r.mortality_female ?? 0}</td>
                          <td className="py-1.5 px-2">{r.mortality_male ?? 0}</td>
                          <td className="py-1.5 px-2">{r.he_eggs ?? 0}</td>
                          <td className="py-1.5 px-2">{nhe}</td>
                          <td className="py-1.5 px-2">{((r.feed_female_kg??0)+(r.feed_male_kg??0)).toFixed(1)}</td>
                          <td className="py-1.5 px-2">{hd != null ? hd.toFixed(1)+'%' : '—'}</td>
                          <td className="py-1.5 px-2"><button onClick={() => setDate(r.record_date)} className="text-brand-600 text-xs font-medium">Edit</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VHL Medicine Master — fully separate list, no link to our Items Master
// ═══════════════════════════════════════════════════════════════
export const VHLMedicineMasterPage: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', unit: 'ml', is_active: true })

  const { data: meds, isLoading } = useQuery({
    queryKey: ['vhl_medicines'],
    queryFn: async () => { const { data } = await supabase.from('vhl_medicines').select('*').order('name'); return data ?? [] }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('Name required')
      if (editing) {
        const { error } = await supabase.from('vhl_medicines').update(form).eq('id', editing.id)
        if (error) throw error
      } else {
        const dup = (meds ?? []).find((m: any) => m.name.trim().toLowerCase() === form.name.trim().toLowerCase())
        if (dup) throw new Error('A VHL medicine with this name already exists')
        const { error } = await supabase.from('vhl_medicines').insert(form)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Saved'); qc.invalidateQueries({ queryKey: ['vhl_medicines'] })
      setShowForm(false); setEditing(null); setForm({ name: '', unit: 'ml', is_active: true })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const openEdit = (m: any) => { setEditing(m); setForm({ name: m.name, unit: m.unit ?? 'ml', is_active: m.is_active }); setShowForm(true) }

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { count } = await supabase.from('vhl_medicine_usage').select('id', { count: 'exact', head: true }).eq('vhl_medicine_id', id)
      if ((count ?? 0) > 0) throw new Error(`Cannot delete — ${count} usage record(s) reference this medicine. Mark it Inactive instead.`)
      const { error } = await supabase.from('vhl_medicines').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['vhl_medicines'] }) },
    onError: (e: any) => toast.error(e.message),
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="VHL Medicine Master" subtitle="Medicines/vaccines used per VHL's regulations — separate from our Items Master, no stock impact."
        action={<Button size="sm" icon={<Plus size={14}/>} onClick={() => { setEditing(null); setForm({ name: '', unit: 'ml', is_active: true }); setShowForm(true) }}>Add Medicine</Button>} />

      {showForm && (
        <Card className="space-y-3">
          <FormRow cols={3}>
            <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="ml, gm, Dose" />
          </FormRow>
          <div className="flex gap-2">
            <Button onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save</Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
          </div>
        </Card>
      )}

      {isLoading ? <Spinner /> : !meds?.length ? (
        <EmptyState title="No VHL medicines yet" subtitle="Add the medicines/vaccines VHL requires you to track." />
      ) : (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Name</Th><Th>Unit</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {meds.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50 text-sm">
                  <Td className="font-medium">{m.name}</Td>
                  <Td className="text-xs">{m.unit}</Td>
                  <Td><Badge color={m.is_active ? 'green' : 'gray'}>{m.is_active ? 'Active' : 'Inactive'}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(m)} className="p-1 text-blue-400 hover:text-blue-600"><Pencil size={14}/></button>
                      <button onClick={() => { if (window.confirm(`Delete "${m.name}"?`)) delMut.mutate(m.id) }} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VHL Medicine Usage Log — daily entries against the VHL medicine master
// ═══════════════════════════════════════════════════════════════
export const VHLMedicineUsagePage: React.FC = () => {
  const qc = useQueryClient()
  const [flockId, setFlockId] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ usage_date: today(), vhl_medicine_id: '', quantity: '', unit: '', remarks: '' })

  const { data: flocks } = useQuery({
    queryKey: ['vhl_flocks_active_medusage'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no').eq('is_vhl_contract', true).order('flock_no'); return data ?? [] }
  })
  const { data: meds } = useQuery({
    queryKey: ['vhl_medicines_all'],
    queryFn: async () => { const { data } = await supabase.from('vhl_medicines').select('id,name,unit').order('name'); return data ?? [] }
  })
  const { data: rows, isLoading } = useQuery({
    queryKey: ['vhl_medicine_usage', flockId],
    queryFn: async () => {
      let q = supabase.from('vhl_medicine_usage').select('*,flocks(flock_no),vhl_medicines(name,unit)').order('usage_date', { ascending: false })
      if (flockId) q = q.eq('flock_id', flockId)
      const { data } = await q
      return data ?? []
    }
  })

  const addMut = useMutation({
    mutationFn: async () => {
      if (!flockId) throw new Error('Select a VHL flock first')
      if (!form.vhl_medicine_id || !form.quantity) throw new Error('Medicine and quantity required')
      const payload = {
        flock_id: flockId, usage_date: form.usage_date, vhl_medicine_id: form.vhl_medicine_id,
        quantity: parseFloat(form.quantity), unit: form.unit || null, remarks: form.remarks || null,
      }
      if (editing) {
        const { error } = await supabase.from('vhl_medicine_usage').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('vhl_medicine_usage').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Usage updated' : 'Usage recorded'); qc.invalidateQueries({ queryKey: ['vhl_medicine_usage'] })
      setForm({ usage_date: today(), vhl_medicine_id: '', quantity: '', unit: '', remarks: '' }); setEditing(null)
    },
    onError: (e: any) => toast.error(e.message),
  })

  const openEdit = (r: any) => {
    setEditing(r); setFlockId(r.flock_id)
    setForm({ usage_date: r.usage_date, vhl_medicine_id: r.vhl_medicine_id ?? '', quantity: r.quantity?.toString() ?? '', unit: r.unit ?? '', remarks: r.remarks ?? '' })
  }

  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('vhl_medicine_usage').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['vhl_medicine_usage'] }) },
    onError: (e: any) => toast.error(e.message),
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="VHL Medicine Usage Log" subtitle="Record what's used, per VHL's regulations — no stock/GRN impact on our side." />
      <Card className="space-y-3">
        <FormRow cols={2}>
          <Select label="VHL Flock" placeholder="— Select —" value={flockId} onChange={e => setFlockId(e.target.value)}
            options={(flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))} />
        </FormRow>
        <FormRow cols={4}>
          <div><label className="text-sm font-medium text-gray-700">Date</label><DateInput value={form.usage_date} onChange={e => setForm(f => ({ ...f, usage_date: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" /></div>
          <Select label="Medicine" placeholder="— Select —" value={form.vhl_medicine_id}
            onChange={e => { const m = (meds ?? []).find((x: any) => x.id === e.target.value); setForm(f => ({ ...f, vhl_medicine_id: e.target.value, unit: m?.unit ?? f.unit })) }}
            options={(meds ?? []).map((m: any) => ({ value: m.id, label: m.name }))} />
          <Input label="Quantity" type="number" step="0.001" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
          <Input label="Unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
        </FormRow>
        <Input label="Remarks" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
        <div className="flex gap-2">
          <Button onClick={() => addMut.mutate()} loading={addMut.isPending}>{editing ? 'Update Usage' : 'Record Usage'}</Button>
          {editing && <Button variant="secondary" onClick={() => { setEditing(null); setForm({ usage_date: today(), vhl_medicine_id: '', quantity: '', unit: '', remarks: '' }) }}>Cancel</Button>}
        </div>
      </Card>

      {isLoading ? <Spinner /> : !rows?.length ? (
        <EmptyState title="No usage recorded yet" />
      ) : (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Date</Th><Th>Flock</Th><Th>Medicine</Th><Th right>Qty</Th><Th>Unit</Th><Th>Remarks</Th><Th></Th></tr></thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50 text-sm">
                  <Td className="text-xs">{fmtDate(r.usage_date)}</Td>
                  <Td className="text-xs">{r.flocks?.flock_no ?? '—'}</Td>
                  <Td className="text-xs">{r.vhl_medicines?.name ?? '—'}</Td>
                  <Td right className="text-xs">{r.quantity}</Td>
                  <Td className="text-xs">{r.unit ?? r.vhl_medicines?.unit ?? '—'}</Td>
                  <Td className="text-xs">{r.remarks ?? '—'}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)} className="p-1 text-blue-400 hover:text-blue-600"><Pencil size={14}/></button>
                      <button onClick={() => delMut.mutate(r.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VHL Egg Production — daily dispatch, ₹/egg (effective-dated rate),
// monthly consolidated billing (same daily-dispatch/month-end-invoice
// pattern as the Site Invoice page).
// ═══════════════════════════════════════════════════════════════
export const VHLEggProductionPage: React.FC = () => {
  const qc = useQueryClient()
  const [flockId, setFlockId] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ production_date: today(), he_qty: '', te_qty: '', dc_no: '', vehicle_no: '', remarks: '' })
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [invoiceNo, setInvoiceNo] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())

  const { data: flocks } = useQuery({
    queryKey: ['vhl_flocks_active_eggprod'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no').eq('is_vhl_contract', true).order('flock_no'); return data ?? [] }
  })
  const { data: rateHistory } = useQuery({
    queryKey: ['vhl_egg_rate_history'],
    queryFn: async () => { const { data } = await supabase.from('vhl_egg_rate_history').select('*').order('effective_date', { ascending: false }); return data ?? [] }
  })
  const currentRate = (() => {
    const applicable = (rateHistory ?? []).filter((r: any) => r.effective_date <= form.production_date)
    return applicable.length ? Number(applicable[0].rate_per_egg) : 0
  })()

  const monthStart = month + '-01'
  const [y, m] = month.split('-').map(Number)
  const monthEnd = `${y}-${String(m).padStart(2,'0')}-${String(new Date(y, m, 0).getDate()).padStart(2,'0')}`

  const { data: rows, isLoading } = useQuery({
    queryKey: ['vhl_egg_production', flockId, month],
    queryFn: async () => {
      let q = supabase.from('vhl_egg_production').select('*,flocks(flock_no)').gte('production_date', monthStart).lte('production_date', monthEnd).order('production_date')
      if (flockId) q = q.eq('flock_id', flockId)
      const { data } = await q
      return data ?? []
    }
  })

  const totalEggs = rows?.reduce((s: number, r: any) => s + (r.he_qty ?? 0) + (r.te_qty ?? 0), 0) ?? 0
  const totalAmount = rows?.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0) ?? 0
  const alreadyInvoiced = (rows ?? []).filter((r: any) => r.invoice_no)

  const addMut = useMutation({
    mutationFn: async () => {
      if (!flockId) throw new Error('Select a VHL flock')
      const he = parseInt(form.he_qty) || 0, te = parseInt(form.te_qty) || 0
      if (!he && !te) throw new Error('Enter HE or TE quantity')
      const rate = editing ? Number(editing.rate_per_egg) : currentRate
      const amount = Math.round((he + te) * rate * 100) / 100
      const payload = {
        flock_id: flockId, production_date: form.production_date, he_qty: he, te_qty: te,
        rate_per_egg: rate, amount, dc_no: form.dc_no || null, vehicle_no: form.vehicle_no || null, remarks: form.remarks || null,
      }
      if (editing) {
        const { error } = await supabase.from('vhl_egg_production').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { data: dup } = await supabase.from('vhl_egg_production').select('id').eq('flock_id', flockId).eq('production_date', form.production_date).maybeSingle()
        if (dup) throw new Error('An entry already exists for this flock and date — edit it instead')
        const { error } = await supabase.from('vhl_egg_production').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Production updated' : 'Production recorded'); qc.invalidateQueries({ queryKey: ['vhl_egg_production'] })
      setForm({ production_date: today(), he_qty: '', te_qty: '', dc_no: '', vehicle_no: '', remarks: '' }); setEditing(null)
    },
    onError: (e: any) => toast.error(e.message),
  })

  const openEdit = (r: any) => {
    setEditing(r); setFlockId(r.flock_id)
    setForm({ production_date: r.production_date, he_qty: r.he_qty?.toString() ?? '', te_qty: r.te_qty?.toString() ?? '', dc_no: r.dc_no ?? '', vehicle_no: r.vehicle_no ?? '', remarks: r.remarks ?? '' })
  }

  const delMut = useMutation({
    mutationFn: async (ids: string[]) => { const { error } = await supabase.from('vhl_egg_production').delete().in('id', ids); if (error) throw error },
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['vhl_egg_production'] }); setSel(new Set()) },
    onError: (e: any) => toast.error(e.message),
  })

  const invoiceMut = useMutation({
    mutationFn: async () => {
      if (!invoiceNo.trim()) throw new Error('Enter an invoice number')
      const ids = (rows ?? []).map((r: any) => r.id)
      if (!ids.length) throw new Error('No production rows for this period')
      const { error } = await supabase.from('vhl_egg_production').update({ invoice_no: invoiceNo.trim() }).in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(`Invoice ${invoiceNo.trim()} applied`); qc.invalidateQueries({ queryKey: ['vhl_egg_production'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const handleExport = () => {
    if (!rows?.length) return
    exportCSV(`vhl_egg_production_${month}.csv`,
      ['Date','Flock','HE Qty','TE Qty','Total','Rate/Egg','Amount','DC No','Vehicle No','Invoice No'],
      rows.map((r: any) => [fmtDate(r.production_date), r.flocks?.flock_no ?? '', r.he_qty, r.te_qty, (r.he_qty??0)+(r.te_qty??0), r.rate_per_egg, r.amount, r.dc_no ?? '', r.vehicle_no ?? '', r.invoice_no ?? '']))
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="VHL Egg Production" subtitle="Daily HE+TE production dispatched to VHL — billed monthly at the effective ₹/egg rate."
        action={<Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport} disabled={!rows?.length}>Export CSV</Button>} />

      <Card className="space-y-3">
        <p className="text-xs font-semibold text-gray-600 uppercase">Record Today's Dispatch</p>
        <FormRow cols={3}>
          <Select label="VHL Flock" placeholder="— Select —" value={flockId} onChange={e => setFlockId(e.target.value)}
            options={(flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))} />
          <div><label className="text-sm font-medium text-gray-700">Date</label><DateInput value={form.production_date} onChange={e => setForm(f => ({ ...f, production_date: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" /></div>
          <Input label={`Rate/Egg (₹) — effective ${inr(currentRate)}`} type="number" value={currentRate} disabled />
        </FormRow>
        <FormRow cols={4}>
          <Input label="HE Qty" type="number" value={form.he_qty} onChange={e => setForm(f => ({ ...f, he_qty: e.target.value }))} />
          <Input label="TE Qty (JE+TE)" type="number" value={form.te_qty} onChange={e => setForm(f => ({ ...f, te_qty: e.target.value }))} />
          <Input label="DC No" value={form.dc_no} onChange={e => setForm(f => ({ ...f, dc_no: e.target.value }))} />
          <Input label="Vehicle No" value={form.vehicle_no} onChange={e => setForm(f => ({ ...f, vehicle_no: e.target.value }))} />
        </FormRow>
        {(parseInt(form.he_qty)||0) + (parseInt(form.te_qty)||0) > 0 && (
          <p className="text-sm text-green-700 font-medium">Auto Amount: {inr(((parseInt(form.he_qty)||0)+(parseInt(form.te_qty)||0)) * (editing ? Number(editing.rate_per_egg) : currentRate))}</p>
        )}
        <div className="flex gap-2">
          <Button onClick={() => addMut.mutate()} loading={addMut.isPending}>{editing ? 'Update Dispatch' : 'Save Dispatch'}</Button>
          {editing && <Button variant="secondary" onClick={() => { setEditing(null); setForm({ production_date: today(), he_qty: '', te_qty: '', dc_no: '', vehicle_no: '', remarks: '' }) }}>Cancel</Button>}
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-xs font-semibold text-gray-600 uppercase">Monthly Billing</p>
        <FormRow cols={3}>
          <Select label="VHL Flock" placeholder="All Flocks" value={flockId} onChange={e => setFlockId(e.target.value)}
            options={(flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))} />
          <div><label className="text-sm font-medium text-gray-700">Month</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" /></div>
        </FormRow>
        {rows && rows.length > 0 && (
          <>
            <p className="text-xs text-gray-500">
              {alreadyInvoiced.length > 0
                ? `${alreadyInvoiced.length} of ${rows.length} rows already invoiced${alreadyInvoiced[0]?.invoice_no ? ` (${alreadyInvoiced[0].invoice_no})` : ''}.`
                : `${rows.length} rows, ${totalEggs.toLocaleString('en-IN')} eggs, ${inr(totalAmount)} — none invoiced yet.`}
            </p>
            <div className="flex gap-3 items-end flex-wrap">
              <Input label="Invoice No" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. VHL/2026-27/001" className="w-64" />
              <Button onClick={() => invoiceMut.mutate()} loading={invoiceMut.isPending}>Apply Invoice to {rows.length} rows</Button>
            </div>
          </>
        )}
      </Card>

      {sel.size > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-red-700">{sel.size} selected</span>
          <button onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
          <div className="ml-auto">
            <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} loading={delMut.isPending}
              onClick={() => { if (window.confirm(`Delete ${sel.size} row(s)?`)) delMut.mutate([...sel]) }}>Delete {sel.size} rows</Button>
          </div>
        </div>
      )}

      {isLoading ? <Spinner /> : !rows?.length ? (
        <EmptyState icon={<Bird size={32}/>} title="No production recorded for this period" />
      ) : (
        <Card padding={false}>
          <CardHeader title={`${rows.length} days — ${totalEggs.toLocaleString('en-IN')} eggs — ${inr(totalAmount)}`} />
          <Table>
            <thead><tr>
              <Th><input type="checkbox" checked={sel.size > 0 && sel.size === rows.length} onChange={() => setSel(sel.size === rows.length ? new Set() : new Set(rows.map((r: any) => r.id)))} className="rounded" /></Th>
              <Th>Date</Th><Th>Flock</Th><Th right>HE</Th><Th right>TE</Th><Th right>Total</Th><Th right>Rate</Th><Th right>Amount</Th><Th>DC No</Th><Th>Vehicle</Th><Th>Invoice No</Th><Th></Th>
            </tr></thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className={`hover:bg-gray-50 text-sm ${sel.has(r.id) ? 'bg-brand-50' : ''}`}>
                  <Td><input type="checkbox" checked={sel.has(r.id)} onChange={() => setSel(s => { const n = new Set(s); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n })} className="rounded" /></Td>
                  <Td className="text-xs">{fmtDate(r.production_date)}</Td>
                  <Td className="text-xs">{r.flocks?.flock_no ?? '—'}</Td>
                  <Td right className="text-xs">{r.he_qty ?? 0}</Td>
                  <Td right className="text-xs">{r.te_qty ?? 0}</Td>
                  <Td right className="text-xs font-medium">{(r.he_qty??0)+(r.te_qty??0)}</Td>
                  <Td right className="text-xs">{inr(r.rate_per_egg)}</Td>
                  <Td right className="text-xs font-semibold">{inr(r.amount)}</Td>
                  <Td className="text-xs">{r.dc_no ?? '—'}</Td>
                  <Td className="text-xs">{r.vehicle_no ?? '—'}</Td>
                  <Td className="text-xs">{r.invoice_no ?? <span className="text-orange-500">not invoiced</span>}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)} className="p-1 text-blue-400 hover:text-blue-600"><Pencil size={14}/></button>
                      <button onClick={() => { if (window.confirm('Delete this row?')) delMut.mutate([r.id]) }} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VHL Bulk (Shed-wise) Daily Entry — mirrors the regular Bulk Daily Entry's
// shed mode: enter each shed separately, closing auto-computed per shed,
// plus one flock-level HE grade breakdown (graded after collecting from
// all sheds). Writes to vhl_daily_entry (shed_id set per shed, null for the
// grade-only flock-level row) — no medicine here (use VHL Medicine Usage
// Log instead) and no feed costing (VHL feed isn't ours to cost).
// ═══════════════════════════════════════════════════════════════
type VhlShedRow = {
  opening_female: string; opening_male: string
  he_eggs: string; je_eggs: string; te_eggs: string; be_eggs: string; le_eggs: string
  wastage_he: string; wastage_je: string; wastage_te: string; wastage_be: string
  mortality_female: string; mortality_male: string
  feed_female_kg: string; feed_type_f: string; feed_male_kg: string; feed_type_m: string
  transfer_female: string; transfer_male: string; cull_female: string; cull_male: string
  closing_female: string; closing_male: string
  lighting_hrs: string; remarks: string
  existingId: string | null
}
const emptyVhlShedRow = (): VhlShedRow => ({
  opening_female: '', opening_male: '',
  he_eggs: '', je_eggs: '', te_eggs: '', be_eggs: '', le_eggs: '',
  wastage_he: '', wastage_je: '', wastage_te: '', wastage_be: '',
  mortality_female: '', mortality_male: '',
  feed_female_kg: '', feed_type_f: '', feed_male_kg: '', feed_type_m: '',
  transfer_female: '', transfer_male: '', cull_female: '', cull_male: '',
  closing_female: '', closing_male: '',
  lighting_hrs: '', remarks: '',
  existingId: null,
})

export const VHLBulkDailyEntryPage: React.FC = () => {
  const qc = useQueryClient()
  const [flockId, setFlockId] = useState('')
  const [date, setDate] = useState(today())
  const [saving, setSaving] = useState(false)
  const [shedRows, setShedRows] = useState<Record<string, VhlShedRow>>({})
  const [showWastage, setShowWastage] = useState(false)

  const { data: flocks } = useQuery({
    queryKey: ['vhl_flocks_active_bulk'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no,laying_farm_id,rearing_farm_id').eq('is_vhl_contract', true).neq('status', 'closed').order('flock_no'); return data ?? [] }
  })
  const flock = flocks?.find((f: any) => f.id === flockId)

  const { data: sheds } = useQuery({
    queryKey: ['vhl_sheds', flockId],
    queryFn: async () => {
      const farmId = flock?.laying_farm_id ?? flock?.rearing_farm_id
      if (!farmId) return []
      const { data } = await supabase.from('sheds').select('id,shed_no,shed_name').eq('farm_id', farmId).eq('is_active', true).order('shed_no')
      return data ?? []
    },
    enabled: !!flockId && !!flock
  })

  const { data: existingRows } = useQuery({
    queryKey: ['vhl_bulk_existing', flockId, date],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry').select('*').eq('flock_id', flockId).eq('record_date', date)
      return data ?? []
    },
    enabled: !!flockId && !!date
  })

  const { data: prevRows } = useQuery({
    queryKey: ['vhl_bulk_prev', flockId, date],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry').select('shed_id,closing_female,closing_male,record_date')
        .eq('flock_id', flockId).lt('record_date', date).order('record_date', { ascending: false }).limit((sheds ?? []).length + 5)
      return data ?? []
    },
    enabled: !!flockId && !!date && !!sheds
  })

  // Populate shed rows from existing records (or previous day's closing)
  useEffect(() => {
    if (!sheds) return
    const rows: Record<string, VhlShedRow> = {}
    for (const shed of sheds as any[]) {
      const ex = (existingRows ?? []).find((r: any) => r.shed_id === shed.id)
      const prev = (prevRows ?? []).find((r: any) => r.shed_id === shed.id)
      const row = emptyVhlShedRow()
      if (ex) {
        row.opening_female = ex.opening_female?.toString() ?? ''
        row.opening_male = ex.opening_male?.toString() ?? ''
        row.he_eggs = ex.he_eggs?.toString() ?? ''
        row.je_eggs = ex.je_eggs?.toString() ?? ''
        row.te_eggs = ex.te_eggs?.toString() ?? ''
        row.be_eggs = ex.be_eggs?.toString() ?? ''
        row.le_eggs = ex.le_eggs?.toString() ?? ''
        row.wastage_he = ex.wastage_he?.toString() ?? ''
        row.wastage_je = ex.wastage_je?.toString() ?? ''
        row.wastage_te = ex.wastage_te?.toString() ?? ''
        row.wastage_be = ex.wastage_be?.toString() ?? ''
        row.mortality_female = ex.mortality_female?.toString() ?? ''
        row.mortality_male = ex.mortality_male?.toString() ?? ''
        row.feed_female_kg = ex.feed_female_kg?.toString() ?? ''
        row.feed_type_f = ex.feed_type_f ?? ''
        row.feed_male_kg = ex.feed_male_kg?.toString() ?? ''
        row.feed_type_m = ex.feed_type_m ?? ''
        row.transfer_female = ex.transfer_female?.toString() ?? ''
        row.transfer_male = ex.transfer_male?.toString() ?? ''
        row.cull_female = ex.cull_female?.toString() ?? ''
        row.cull_male = ex.cull_male?.toString() ?? ''
        row.closing_female = ex.closing_female?.toString() ?? ''
        row.closing_male = ex.closing_male?.toString() ?? ''
        row.lighting_hrs = ex.lighting_hrs?.toString() ?? ''
        row.remarks = ex.remarks ?? ''
        row.existingId = ex.id
      } else if (prev) {
        row.opening_female = prev.closing_female?.toString() ?? ''
        row.opening_male = prev.closing_male?.toString() ?? ''
      }
      rows[shed.id] = row
    }
    setShedRows(rows)
  }, [sheds, existingRows, prevRows])

  const setShed = (shedId: string, k: keyof VhlShedRow, v: string) => setShedRows(rows => {
    const r = { ...(rows[shedId] ?? emptyVhlShedRow()), [k]: v }
    if (['opening_female','opening_male','transfer_female','transfer_male','cull_female','cull_male','mortality_female','mortality_male'].includes(k)) {
      const of_ = parseInt(r.opening_female) || 0, om = parseInt(r.opening_male) || 0
      const tf = parseInt(r.transfer_female) || 0, tm = parseInt(r.transfer_male) || 0
      const cf = parseInt(r.cull_female) || 0, cm = parseInt(r.cull_male) || 0
      const mf = parseInt(r.mortality_female) || 0, mm = parseInt(r.mortality_male) || 0
      r.closing_female = Math.max(0, of_ - tf - cf - mf).toString()
      r.closing_male = Math.max(0, om - tm - cm - mm).toString()
    }
    return { ...rows, [shedId]: r }
  })

  const handleSave = async () => {
    if (!flockId || !date) { toast.error('Select flock and date'); return }
    setSaving(true)
    let saved = 0, errors = 0
    for (const shed of (sheds ?? []) as any[]) {
      const r = shedRows[shed.id]
      if (!r) continue
      const he = parseInt(r.he_eggs) || 0, je = parseInt(r.je_eggs) || 0, te = parseInt(r.te_eggs) || 0, be = parseInt(r.be_eggs) || 0, le = parseInt(r.le_eggs) || 0
      const mf = parseInt(r.mortality_female) || 0, mm = parseInt(r.mortality_male) || 0
      const ff = parseFloat(r.feed_female_kg) || 0, fm = parseFloat(r.feed_male_kg) || 0
      const tf = parseInt(r.transfer_female) || 0, tm = parseInt(r.transfer_male) || 0
      const cf = parseInt(r.cull_female) || 0, cm = parseInt(r.cull_male) || 0
      const hasData = he || je || te || be || le || mf || mm || ff || fm || tf || tm || cf || cm
        || r.lighting_hrs || r.remarks || r.opening_female || r.opening_male || r.existingId
      if (!hasData) continue
      const intOrNull = (v: string) => v === '' || v == null || isNaN(parseInt(v)) ? null : parseInt(v)
      const payload = {
        flock_id: flockId, shed_id: shed.id, record_date: date,
        opening_female: intOrNull(r.opening_female), opening_male: intOrNull(r.opening_male),
        he_eggs: he, je_eggs: je, te_eggs: te, be_eggs: be, le_eggs: le, total_eggs: he+je+te+be+le,
        wastage_he: parseInt(r.wastage_he) || null, wastage_je: parseInt(r.wastage_je) || null,
        wastage_te: parseInt(r.wastage_te) || null, wastage_be: parseInt(r.wastage_be) || null,
        mortality_female: mf, mortality_male: mm,
        feed_female_kg: ff, feed_type_f: r.feed_type_f || null, feed_male_kg: fm, feed_type_m: r.feed_type_m || null,
        transfer_female: tf, transfer_male: tm, cull_female: cf, cull_male: cm,
        trcull_female: tf + cf, trcull_male: tm + cm,
        closing_female: intOrNull(r.closing_female), closing_male: intOrNull(r.closing_male),
        lighting_hrs: parseFloat(r.lighting_hrs) || null, remarks: r.remarks || null,
      }
      const { error } = r.existingId
        ? await supabase.from('vhl_daily_entry').update(payload).eq('id', r.existingId)
        : await supabase.from('vhl_daily_entry').insert(payload)
      if (error) { console.error(error); errors++ } else saved++
    }
    setSaving(false)
    qc.invalidateQueries({ queryKey: ['vhl_bulk_existing'] })
    if (errors) toast.error(`Saved ${saved} shed(s), ${errors} failed`)
    else toast.success(`Saved ${saved} shed record(s)`)
  }

  const importRef = React.useRef<HTMLInputElement>(null)
  const SHED_HEADERS = ['Shed No','Open F','Open M','Feed F kg','Feed Type F','Feed M kg','Feed Type M',
    'Transfer F','Transfer M','Cull F','Cull M','Death F','Death M','HE','JE','TE','BE','LE',
    'Wastage HE','Wastage JE','Wastage TE','Wastage BE','Lighting Hrs','Remarks']

  const handleTemplate = () => downloadXlsxTemplate('vhl_bulk_daily_template.xlsx', SHED_HEADERS,
    ['1','20800','2500','1200','L1','150','MALE','0','0','0','0','20','15','15000','0','0','300','0','','','','','16','OK (Closing auto-calculated)'])

  const handleExport = () => {
    if (!flockId || !sheds?.length) { toast.error('Select a flock first'); return }
    const data = (sheds as any[]).map((shed) => {
      const r = shedRows[shed.id] ?? emptyVhlShedRow()
      return {
        'Shed No': shed.shed_no, 'Open F': r.opening_female, 'Open M': r.opening_male,
        'Feed F kg': r.feed_female_kg, 'Feed Type F': r.feed_type_f, 'Feed M kg': r.feed_male_kg, 'Feed Type M': r.feed_type_m,
        'Transfer F': r.transfer_female, 'Transfer M': r.transfer_male, 'Cull F': r.cull_female, 'Cull M': r.cull_male,
        'Death F': r.mortality_female, 'Death M': r.mortality_male,
        HE: r.he_eggs, JE: r.je_eggs, TE: r.te_eggs, BE: r.be_eggs, LE: r.le_eggs,
        'Wastage HE': r.wastage_he, 'Wastage JE': r.wastage_je, 'Wastage TE': r.wastage_te, 'Wastage BE': r.wastage_be,
        'Lighting Hrs': r.lighting_hrs, Remarks: r.remarks,
      }
    })
    const ws = XLSX.utils.json_to_sheet(data, { header: SHED_HEADERS })
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Sheds')
    XLSX.writeFile(wb, `VHL_BulkDaily_Flock${flock?.flock_no}_${date}.xlsx`)
    toast.success('Exported current grid')
  }

  const handleImport = async (file: File) => {
    if (!flockId) { toast.error('Select a flock first'); return }
    try {
      const { headers, rows } = await parseFile(file)
      const idx = (n: string) => headers.findIndex(h => h.toLowerCase().trim() === n.toLowerCase())
      const ci = {
        shed: idx('Shed No'), of: idx('Open F'), om: idx('Open M'), ff: idx('Feed F kg'), ftf: idx('Feed Type F'),
        fm: idx('Feed M kg'), ftm: idx('Feed Type M'), trf: idx('Transfer F'), trm: idx('Transfer M'),
        cf: idx('Cull F'), cm: idx('Cull M'), df: idx('Death F'), dm: idx('Death M'),
        he: idx('HE'), je: idx('JE'), te: idx('TE'), be: idx('BE'), le: idx('LE'),
        whe: idx('Wastage HE'), wje: idx('Wastage JE'), wte: idx('Wastage TE'), wbe: idx('Wastage BE'),
        light: idx('Lighting Hrs'), rem: idx('Remarks'),
      }
      const shedByNo: Record<string, any> = {}
      for (const s of (sheds ?? []) as any[]) shedByNo[String(s.shed_no).trim()] = s
      let matched = 0
      setShedRows(prev => {
        const next = { ...prev }
        for (const row of rows) {
          const shedNo = ci.shed >= 0 ? row[ci.shed]?.trim() : ''
          const shed = shedByNo[shedNo]
          if (!shed) continue
          matched++
          const g = (i: number) => i >= 0 ? row[i] : ''
          const cur = next[shed.id] ?? emptyVhlShedRow()
          next[shed.id] = {
            ...cur,
            opening_female: g(ci.of) || cur.opening_female, opening_male: g(ci.om) || cur.opening_male,
            feed_female_kg: g(ci.ff) || cur.feed_female_kg, feed_type_f: g(ci.ftf) || cur.feed_type_f,
            feed_male_kg: g(ci.fm) || cur.feed_male_kg, feed_type_m: g(ci.ftm) || cur.feed_type_m,
            transfer_female: g(ci.trf) || cur.transfer_female, transfer_male: g(ci.trm) || cur.transfer_male,
            cull_female: g(ci.cf) || cur.cull_female, cull_male: g(ci.cm) || cur.cull_male,
            mortality_female: g(ci.df) || cur.mortality_female, mortality_male: g(ci.dm) || cur.mortality_male,
            he_eggs: g(ci.he) || cur.he_eggs, je_eggs: g(ci.je) || cur.je_eggs, te_eggs: g(ci.te) || cur.te_eggs,
            be_eggs: g(ci.be) || cur.be_eggs, le_eggs: g(ci.le) || cur.le_eggs,
            wastage_he: g(ci.whe) || cur.wastage_he, wastage_je: g(ci.wje) || cur.wastage_je,
            wastage_te: g(ci.wte) || cur.wastage_te, wastage_be: g(ci.wbe) || cur.wastage_be,
            lighting_hrs: g(ci.light) || cur.lighting_hrs, remarks: g(ci.rem) || cur.remarks,
          }
        }
        return next
      })
      toast.success(`Imported ${matched} shed(s) into grid — review and click Save All`)
    } catch (e: any) { toast.error(e.message) }
    finally { if (importRef.current) importRef.current.value = '' }
  }

  const numInput = (val: string, onChange: (v: string) => void, w = 'w-14') => (
    <input type="number" min="0" value={val} onChange={e => onChange(e.target.value)} placeholder="0"
      className={`${w} text-center border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white`} />
  )

  // Anchored to the date being edited, not real-world "today" — otherwise
  // historical/backfilled data (e.g. an Excel import of past months) would
  // never show up here just because it's older than 14 real-world days.
  const fourteenDaysBeforeSelected = (() => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() - 14); return localYMD(d) })()
  const { data: recentBulkRows } = useQuery({
    queryKey: ['vhl_bulk_recent', flockId, fourteenDaysBeforeSelected],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry')
        .select('id,record_date,shed_id,opening_female,opening_male,closing_female,closing_male,total_eggs,he_eggs,mortality_female,mortality_male,sheds(shed_no,shed_name)')
        .eq('flock_id', flockId).not('shed_id', 'is', null).gte('record_date', fourteenDaysBeforeSelected).lte('record_date', date)
        .order('record_date', { ascending: false }).order('shed_id')
      return data ?? []
    },
    enabled: !!flockId
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="VHL Bulk Daily Entry (Shed-wise)" subtitle="Enter each shed separately — combines into the VHL flock's daily record."
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleTemplate}>Template</Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={() => importRef.current?.click()}>Import</Button>
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export</Button>
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }} />
          </div>
        } />
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <Select label="VHL Flock" required placeholder="— Choose flock —"
              options={(flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))}
              value={flockId} onChange={e => setFlockId(e.target.value)} />
          </div>
          <DateInput label="Date" value={date} onChange={e => setDate(e.target.value)} />
          <Button icon={<Save size={16}/>} loading={saving} onClick={handleSave} disabled={!flockId || !sheds?.length}>Save All</Button>
        </div>
      </Card>

      {flockId && !sheds?.length && <EmptyState title="No sheds found for this flock's site" />}

      {flockId && (sheds ?? []).length > 0 && (
        <Card padding={false}>
          <div className="px-4 py-2 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
            <h3 className="font-semibold text-brand-800 text-sm">Flock {flock?.flock_no} — {(sheds ?? []).length} Sheds</h3>
            <button onClick={() => setShowWastage(w => !w)}
              className={`text-xs px-2 py-0.5 rounded border ${showWastage ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
              {showWastage ? '× Hide Wastage' : '+ Wastage'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-2 py-2 text-left sticky left-0 bg-gray-50 z-10">Shed</th>
                  <th className="px-1 py-2 text-center">Open ♀</th>
                  <th className="px-1 py-2 text-center">Open ♂</th>
                  <th className="px-1 py-2 text-center">Feed ♀ kg</th>
                  <th className="px-1 py-2 text-center">Type ♀</th>
                  <th className="px-1 py-2 text-center">Feed ♂ kg</th>
                  <th className="px-1 py-2 text-center">Type ♂</th>
                  <th className="px-1 py-2 text-center">Transfer ♀</th>
                  <th className="px-1 py-2 text-center">Transfer ♂</th>
                  <th className="px-1 py-2 text-center">Cull ♀</th>
                  <th className="px-1 py-2 text-center">Cull ♂</th>
                  <th className="px-1 py-2 text-center">Death ♀</th>
                  <th className="px-1 py-2 text-center">Death ♂</th>
                  <th className="px-1 py-2 text-center">HE</th>
                  <th className="px-1 py-2 text-center">JE</th>
                  <th className="px-1 py-2 text-center">TE</th>
                  <th className="px-1 py-2 text-center">BE</th>
                  <th className="px-1 py-2 text-center">LE</th>
                  {showWastage && <><th className="px-1 py-2 text-center bg-red-50">Wst HE</th><th className="px-1 py-2 text-center bg-red-50">Wst JE</th><th className="px-1 py-2 text-center bg-red-50">Wst TE</th><th className="px-1 py-2 text-center bg-red-50">Wst BE</th></>}
                  <th className="px-1 py-2 text-center bg-blue-50">Close ♀</th>
                  <th className="px-1 py-2 text-center bg-blue-50">Close ♂</th>
                  <th className="px-1 py-2 text-center">Light</th>
                  <th className="px-1 py-2 text-left" style={{ minWidth: 100 }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(sheds ?? []).map((shed: any, idx: number) => {
                  const r = shedRows[shed.id] ?? emptyVhlShedRow()
                  const u = (f: keyof VhlShedRow) => (v: string) => setShed(shed.id, f, v)
                  return (
                    <tr key={shed.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-2 py-1.5 sticky left-0 bg-inherit z-10 font-semibold text-brand-700 whitespace-nowrap">
                        Shed {shed.shed_no}{shed.shed_name ? ` · ${shed.shed_name}` : ''}
                      </td>
                      <td className="px-1 py-1">{numInput(r.opening_female, u('opening_female'))}</td>
                      <td className="px-1 py-1">{numInput(r.opening_male, u('opening_male'))}</td>
                      <td className="px-1 py-1">{numInput(r.feed_female_kg, u('feed_female_kg'))}</td>
                      <td className="px-1 py-1">
                        <input type="text" value={r.feed_type_f} onChange={e => u('feed_type_f')(e.target.value)} placeholder="type"
                          className="w-16 border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white" />
                      </td>
                      <td className="px-1 py-1">{numInput(r.feed_male_kg, u('feed_male_kg'))}</td>
                      <td className="px-1 py-1">
                        <input type="text" value={r.feed_type_m} onChange={e => u('feed_type_m')(e.target.value)} placeholder="type"
                          className="w-16 border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white" />
                      </td>
                      <td className="px-1 py-1">{numInput(r.transfer_female, u('transfer_female'))}</td>
                      <td className="px-1 py-1">{numInput(r.transfer_male, u('transfer_male'))}</td>
                      <td className="px-1 py-1">{numInput(r.cull_female, u('cull_female'))}</td>
                      <td className="px-1 py-1">{numInput(r.cull_male, u('cull_male'))}</td>
                      <td className="px-1 py-1">{numInput(r.mortality_female, u('mortality_female'))}</td>
                      <td className="px-1 py-1">{numInput(r.mortality_male, u('mortality_male'))}</td>
                      <td className="px-1 py-1">{numInput(r.he_eggs, u('he_eggs'))}</td>
                      <td className="px-1 py-1">{numInput(r.je_eggs, u('je_eggs'))}</td>
                      <td className="px-1 py-1">{numInput(r.te_eggs, u('te_eggs'))}</td>
                      <td className="px-1 py-1">{numInput(r.be_eggs, u('be_eggs'))}</td>
                      <td className="px-1 py-1">{numInput(r.le_eggs, u('le_eggs'))}</td>
                      {showWastage && <>
                        <td className="px-1 py-1 bg-red-50/30">{numInput(r.wastage_he, u('wastage_he'))}</td>
                        <td className="px-1 py-1 bg-red-50/30">{numInput(r.wastage_je, u('wastage_je'))}</td>
                        <td className="px-1 py-1 bg-red-50/30">{numInput(r.wastage_te, u('wastage_te'))}</td>
                        <td className="px-1 py-1 bg-red-50/30">{numInput(r.wastage_be, u('wastage_be'))}</td>
                      </>}
                      <td className="px-1 py-1 bg-blue-50/40">{numInput(r.closing_female, u('closing_female'))}</td>
                      <td className="px-1 py-1 bg-blue-50/40">{numInput(r.closing_male, u('closing_male'))}</td>
                      <td className="px-1 py-1">{numInput(r.lighting_hrs, u('lighting_hrs'))}</td>
                      <td className="px-1 py-1">
                        <input type="text" value={r.remarks} onChange={e => u('remarks')(e.target.value)} placeholder="remarks"
                          className="w-24 border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {flockId && recentBulkRows && recentBulkRows.length > 0 && (
        <Card>
          <p className="font-semibold text-gray-800 text-sm mb-3">Recent Shed-wise Entries (14 days up to {date})</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-100">
                {['Date','Shed','Open ♀','Open ♂','Close ♀','Close ♂','Total Eggs','HE','Death ♀','Death ♂',''].map((h,i) => <th key={i} className="py-2 px-2 text-left font-semibold text-gray-500">{h}</th>)}
              </tr></thead>
              <tbody>
                {recentBulkRows.map((r: any) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-1.5 px-2 font-medium">{r.record_date}</td>
                    <td className="py-1.5 px-2">{r.sheds?.shed_name ?? r.sheds?.shed_no ?? '—'}</td>
                    <td className="py-1.5 px-2">{r.opening_female ?? 0}</td>
                    <td className="py-1.5 px-2">{r.opening_male ?? 0}</td>
                    <td className="py-1.5 px-2">{r.closing_female ?? 0}</td>
                    <td className="py-1.5 px-2">{r.closing_male ?? 0}</td>
                    <td className="py-1.5 px-2">{r.total_eggs ?? 0}</td>
                    <td className="py-1.5 px-2">{r.he_eggs ?? 0}</td>
                    <td className="py-1.5 px-2">{r.mortality_female ?? 0}</td>
                    <td className="py-1.5 px-2">{r.mortality_male ?? 0}</td>
                    <td className="py-1.5 px-2"><button onClick={() => setDate(r.record_date)} className="text-brand-600 text-xs font-medium">Load</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VHL Dashboard — KPI overview for VHL contract flocks, reads from
// vhl_daily_entry / vhl_egg_production so numbers never mix with our
// regular Dashboard's daily_records/v_flock_summary figures.
// ═══════════════════════════════════════════════════════════════
export const VHLDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const goToDailyEntry = (flockId: string) => { localStorage.setItem('vhl_de_flock', flockId); navigate('/vhl/daily-entry') }
  const { data: flocks, isLoading } = useQuery({
    queryKey: ['vhl_dashboard_flocks'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('id,flock_no,status,placement_date,total_placed_f,total_placed_m,laying_farm_id,farms!laying_farm_id(name)')
        .eq('is_vhl_contract', true).order('flock_no')
      return data ?? []
    }
  })

  const thirtyDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate()-30); return localYMD(d) })()
  const { data: recentDaily } = useQuery({
    queryKey: ['vhl_dashboard_daily', thirtyDaysAgo],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry')
        .select('flock_id,record_date,total_eggs,he_eggs,mortality_female,mortality_male,closing_female,closing_male')
        .gte('record_date', thirtyDaysAgo).order('record_date')
      return data ?? []
    },
    enabled: !!flocks?.length
  })

  const monthStart = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` })()
  const { data: eggProdMonth } = useQuery({
    queryKey: ['vhl_dashboard_egg_prod', monthStart],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_egg_production').select('flock_id,he_qty,te_qty,amount').gte('production_date', monthStart)
      return data ?? []
    },
    enabled: !!flocks?.length
  })

  // Current birds per flock — sum of the latest date's rows (shed-wise or single, never both for the same date)
  const currentByFlock = React.useMemo(() => {
    const latestDatePerFlock: Record<string, string> = {}
    for (const r of (recentDaily ?? [])) {
      if (!latestDatePerFlock[r.flock_id] || r.record_date > latestDatePerFlock[r.flock_id]) latestDatePerFlock[r.flock_id] = r.record_date
    }
    const out: Record<string, { female: number; male: number }> = {}
    for (const r of (recentDaily ?? [])) {
      if (r.record_date !== latestDatePerFlock[r.flock_id]) continue
      if (!out[r.flock_id]) out[r.flock_id] = { female: 0, male: 0 }
      out[r.flock_id].female += r.closing_female ?? 0
      out[r.flock_id].male += r.closing_male ?? 0
    }
    return out
  }, [recentDaily])

  const activeFlocks = (flocks ?? []).filter((f: any) => f.status !== 'closed')
  const totalBirds = activeFlocks.reduce((s: number, f: any) => {
    const c = currentByFlock[f.id]
    return s + (c ? c.female + c.male : (f.total_placed_f ?? 0) + (f.total_placed_m ?? 0))
  }, 0)
  const totalEggsThisMonth = (eggProdMonth ?? []).reduce((s: number, r: any) => s + (r.he_qty ?? 0) + (r.te_qty ?? 0), 0)
  const totalRevenueThisMonth = (eggProdMonth ?? []).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0)

  const chartData = React.useMemo(() => {
    const byDate: Record<string, { date: string; eggs: number; he: number; mort: number }> = {}
    for (const r of (recentDaily ?? [])) {
      if (!byDate[r.record_date]) byDate[r.record_date] = { date: r.record_date, eggs: 0, he: 0, mort: 0 }
      byDate[r.record_date].eggs += r.total_eggs ?? 0
      byDate[r.record_date].he += r.he_eggs ?? 0
      byDate[r.record_date].mort += (r.mortality_female ?? 0) + (r.mortality_male ?? 0)
    }
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
      .map(r => { const p = r.date.split('-'); const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return { ...r, date: `${p[2]} ${mn[parseInt(p[1])-1]}` } })
  }, [recentDaily])

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      <SectionHeader title="VHL Dashboard" subtitle={`${activeFlocks.length} active VHL flock${activeFlocks.length !== 1 ? 's' : ''}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Birds (VHL)" value={totalBirds.toLocaleString('en-IN')} subtitle={`${activeFlocks.length} flocks running`} icon={<Bird size={18}/>} color="text-brand-600" />
        <StatCard title="Eggs This Month" value={totalEggsThisMonth.toLocaleString('en-IN')} subtitle="HE + TE dispatched to VHL" icon={<Egg size={18}/>} color="text-yellow-600" />
        <StatCard title="Revenue This Month" value={inr(totalRevenueThisMonth)} subtitle="At effective ₹/egg rate" icon={<DollarSign size={18}/>} color="text-green-600" />
        <StatCard title="Active VHL Flocks" value={activeFlocks.length} subtitle={`${(flocks ?? []).filter((f: any) => f.status === 'closed').length} closed`} icon={<Activity size={18}/>} color="text-blue-600" />
      </div>

      {!activeFlocks.length ? (
        <EmptyState icon={<Bird size={32}/>} title="No active VHL flocks" subtitle="Tag a flock as VHL Contract in Flock Management to see it here." />
      ) : (
        <Card>
          <CardHeader title="Active VHL Flocks" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeFlocks.map((f: any) => {
              const c = currentByFlock[f.id]
              return (
                <button key={f.id} onClick={() => goToDailyEntry(f.id)} title="Open Daily Entry for this flock"
                  className="text-left p-4 rounded-xl border border-gray-100 hover:border-brand-300 hover:shadow-sm transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900">F-{f.flock_no}</span>
                    <Badge color={f.status === 'laying' ? 'green' : f.status === 'rearing' ? 'yellow' : 'gray'}>{f.status}</Badge>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between"><span>Site</span><span className="font-medium text-gray-900 truncate max-w-[100px]">{f.farms?.name ?? '—'}</span></div>
                    <div className="flex justify-between"><span>Birds ♀</span><span className="font-medium text-gray-900">{(c?.female ?? f.total_placed_f ?? 0).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Birds ♂</span><span className="font-medium text-gray-900">{(c?.male ?? f.total_placed_m ?? 0).toLocaleString('en-IN')}</span></div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-400">Placed: {fmtDate(f.placement_date)}</div>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader title="14-Day Production" subtitle="Eggs + HE across all VHL flocks" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => v.toLocaleString('en-IN')} />
              <Line type="monotone" dataKey="eggs" stroke="#22c55e" strokeWidth={2} dot={false} name="Total Eggs" />
              <Line type="monotone" dataKey="he" stroke="#3b82f6" strokeWidth={2} dot={false} name="HE Eggs" />
              <Line type="monotone" dataKey="mort" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Mortality" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VHL Shed Performance — per-shed breakdown for VHL flocks, reads from
// vhl_daily_entry (never daily_records) so it stays fully separate from
// the regular Shed-wise Performance report.
// ═══════════════════════════════════════════════════════════════
function vhlPctVal(num: number, den: number) { return den > 0 ? num / den * 100 : null }
function vhlColorPct(val: number | null, good = 80, warn = 65) {
  if (val == null) return 'text-gray-400'
  return val >= good ? 'text-green-600 font-semibold' : val >= warn ? 'text-amber-600 font-semibold' : 'text-red-600 font-semibold'
}

export const VHLShedPerformancePage: React.FC = () => {
  const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate()-n); return localYMD(d) }
  const [fromDate, setFromDate] = useState(daysAgo(30))
  const [toDate, setToDate] = useState(today())

  const { data: records, isLoading } = useQuery({
    queryKey: ['vhl_shed_perf', fromDate, toDate],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry')
        .select('record_date,shed_id,flock_id,opening_female,closing_female,mortality_female,mortality_male,total_eggs,he_eggs,je_eggs,te_eggs,be_eggs,le_eggs,feed_female_kg,feed_male_kg,sheds(shed_no,shed_name),flocks(flock_no)')
        .gte('record_date', fromDate).lte('record_date', toDate)
      return data ?? []
    }
  })

  const recs = records ?? []
  const agg = (rows: any[]) => {
    const eggs = rows.reduce((s, r) => s + (r.total_eggs ?? 0), 0)
    const he = rows.reduce((s, r) => s + (r.he_eggs ?? 0), 0)
    const je = rows.reduce((s, r) => s + (r.je_eggs ?? 0), 0)
    const te = rows.reduce((s, r) => s + (r.te_eggs ?? 0), 0)
    const be = rows.reduce((s, r) => s + (r.be_eggs ?? 0), 0)
    const le = rows.reduce((s, r) => s + (r.le_eggs ?? 0), 0)
    const mortF = rows.reduce((s, r) => s + (r.mortality_female ?? 0), 0)
    const mortM = rows.reduce((s, r) => s + (r.mortality_male ?? 0), 0)
    const feedF = rows.reduce((s, r) => s + (r.feed_female_kg ?? 0), 0)
    const feedM = rows.reduce((s, r) => s + (r.feed_male_kg ?? 0), 0)
    const birdDays = rows.reduce((s, r) => s + (r.opening_female ?? 0), 0)
    return { eggs, he, je, te, be, le, mortF, mortM, feedF, feedM, days: rows.length, hdPct: vhlPctVal(eggs, birdDays), hePct: vhlPctVal(he, eggs) }
  }

  const byShed = React.useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const r of recs) {
      const k = r.shed_id ?? '__noshed__'
      if (!map[k]) map[k] = []
      map[k].push(r)
    }
    return Object.entries(map).map(([key, rows]) => {
      const shed = (rows[0] as any).sheds
      const flockNos = [...new Set(rows.map((r: any) => r.flocks?.flock_no).filter(Boolean))]
      return { key, shed, s: agg(rows), flockNos }
    }).sort((a, b) => (a.shed?.shed_no ?? '').localeCompare(b.shed?.shed_no ?? ''))
  }, [recs])

  const totals = agg(recs)

  return (
    <div className="space-y-5">
      <SectionHeader title="VHL Shed-wise Performance" subtitle="Per-shed production breakdown for VHL contract flocks." />
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <DateInput label="From Date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <DateInput label="To Date" value={toDate} onChange={e => setToDate(e.target.value)} />
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(daysAgo(7)); setToDate(today()) }}>7d</Button>
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(daysAgo(30)); setToDate(today()) }}>30d</Button>
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(daysAgo(90)); setToDate(today()) }}>90d</Button>
          </div>
        </div>
      </Card>

      {!isLoading && recs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard title="Total Eggs" value={totals.eggs.toLocaleString('en-IN')} icon={<Egg size={16}/>} color="text-yellow-600" />
          <StatCard title="HE Eggs" value={totals.he.toLocaleString('en-IN')} icon={<Egg size={16}/>} color="text-green-600" />
          <StatCard title="Avg HD%" value={totals.hdPct != null ? totals.hdPct.toFixed(1)+'%' : '—'} icon={<TrendingUp size={16}/>} color={vhlColorPct(totals.hdPct)} />
          <StatCard title="Avg HE%" value={totals.hePct != null ? totals.hePct.toFixed(1)+'%' : '—'} icon={<TrendingUp size={16}/>} color={vhlColorPct(totals.hePct, 90, 75)} />
          <StatCard title="Total Mortality F" value={totals.mortF.toLocaleString('en-IN')} icon={<Bird size={16}/>} color="text-red-500" />
        </div>
      )}

      {isLoading ? <Spinner /> : recs.length === 0 ? (
        <EmptyState icon={<Egg size={32}/>} title="No VHL records in this date range" />
      ) : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Shed</Th><Th>Flocks</Th><Th right>Days</Th><Th right>Total Eggs</Th><Th right>HE</Th>
              <Th right>HD%</Th><Th right>HE%</Th><Th right>JE</Th><Th right>TE</Th><Th right>BE+LE</Th>
              <Th right>Mort F</Th><Th right>Mort M</Th><Th right>Feed kg</Th>
            </tr></thead>
            <tbody>
              {byShed.map(({ key, shed, s, flockNos }) => (
                <tr key={key} className="hover:bg-gray-50">
                  <Td className="text-xs font-mono text-purple-700">{shed?.shed_no ?? <span className="text-gray-400">No shed</span>}{shed?.shed_name ? ` — ${shed.shed_name}` : ''}</Td>
                  <Td className="text-xs">{flockNos.map((f: any) => <span key={f} className="inline-block bg-green-100 text-green-800 rounded px-1 mr-0.5 text-xs">F-{f}</span>)}</Td>
                  <Td right className="text-xs">{s.days}</Td>
                  <Td right className="text-xs font-semibold">{s.eggs.toLocaleString('en-IN')}</Td>
                  <Td right className="text-xs text-green-700">{s.he.toLocaleString('en-IN')}</Td>
                  <Td right className={`text-xs ${vhlColorPct(s.hdPct)}`}>{s.hdPct != null ? s.hdPct.toFixed(1)+'%' : '—'}</Td>
                  <Td right className={`text-xs ${vhlColorPct(s.hePct, 90, 75)}`}>{s.hePct != null ? s.hePct.toFixed(1)+'%' : '—'}</Td>
                  <Td right className="text-xs">{s.je.toLocaleString('en-IN')}</Td>
                  <Td right className="text-xs">{s.te.toLocaleString('en-IN')}</Td>
                  <Td right className="text-xs">{(s.be+s.le).toLocaleString('en-IN')}</Td>
                  <Td right className="text-xs">{s.mortF}</Td>
                  <Td right className="text-xs">{s.mortM}</Td>
                  <Td right className="text-xs">{(s.feedF+s.feedM).toFixed(1)}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold text-sm">
                <Td colSpan={2}>TOTAL</Td>
                <Td right className="text-xs">{totals.days}</Td>
                <Td right className="text-xs">{totals.eggs.toLocaleString('en-IN')}</Td>
                <Td right className="text-xs">{totals.he.toLocaleString('en-IN')}</Td>
                <Td colSpan={2}></Td>
                <Td right className="text-xs">{totals.je.toLocaleString('en-IN')}</Td>
                <Td right className="text-xs">{totals.te.toLocaleString('en-IN')}</Td>
                <Td right className="text-xs">{(totals.be+totals.le).toLocaleString('en-IN')}</Td>
                <Td right className="text-xs">{totals.mortF}</Td>
                <Td right className="text-xs">{totals.mortM}</Td>
                <Td right className="text-xs">{(totals.feedF+totals.feedM).toFixed(1)}</Td>
              </tr>
            </tfoot>
          </Table>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VHL Egg Stock Register — running Production vs Dispatched (HE/NHE)
// balance per day, computed live from vhl_daily_entry (production) and
// vhl_egg_production (dispatched/billed) — no derived/formula sheet
// involved, unlike the source Excel's "Egg" tab which this replaces.
// ═══════════════════════════════════════════════════════════════
const EGG_GRADES = ['he', 'je', 'te', 'be', 'le'] as const
type EggGrade = typeof EGG_GRADES[number]
const EGG_GRADE_LABEL: Record<EggGrade, string> = { he: 'HE', je: 'JE', te: 'TE', be: 'BE', le: 'LE' }

export const VHLEggStockRegisterPage: React.FC = () => {
  const [flockId, setFlockId] = useState('')
  const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate()-n); return localYMD(d) }
  const [fromDate, setFromDate] = useState(daysAgo(30))
  const [toDate, setToDate] = useState(today())

  const { data: flocks } = useQuery({
    queryKey: ['vhl_flocks_egg_register'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no').eq('is_vhl_contract', true).order('flock_no'); return data ?? [] }
  })

  // No lower date bound — need the FULL history up to toDate so Opening on
  // the first visible row carries forward correctly, not just from 0.
  const { data: production } = useQuery({
    queryKey: ['vhl_egg_register_prod', flockId, toDate],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry')
        .select('record_date,he_eggs,je_eggs,te_eggs,be_eggs,le_eggs,wastage_he,wastage_je,wastage_te,wastage_be')
        .eq('flock_id', flockId).lte('record_date', toDate)
      return data ?? []
    },
    enabled: !!flockId
  })
  const { data: dispatched } = useQuery({
    queryKey: ['vhl_egg_register_dispatch', flockId, toDate],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_egg_production')
        .select('production_date,he_qty,te_qty,invoice_no')
        .eq('flock_id', flockId).lte('production_date', toDate)
      return data ?? []
    },
    enabled: !!flockId
  })

  type DayTotals = Record<EggGrade, { prod: number; wastage: number; disp: number }>
  const rows = React.useMemo(() => {
    const byDate: Record<string, DayTotals> = {}
    const blank = (): DayTotals => ({ he: { prod: 0, wastage: 0, disp: 0 }, je: { prod: 0, wastage: 0, disp: 0 }, te: { prod: 0, wastage: 0, disp: 0 }, be: { prod: 0, wastage: 0, disp: 0 }, le: { prod: 0, wastage: 0, disp: 0 } })
    for (const r of (production ?? [])) {
      const d = r.record_date
      if (!byDate[d]) byDate[d] = blank()
      byDate[d].he.prod += r.he_eggs ?? 0; byDate[d].he.wastage += r.wastage_he ?? 0
      byDate[d].je.prod += r.je_eggs ?? 0; byDate[d].je.wastage += r.wastage_je ?? 0
      byDate[d].te.prod += r.te_eggs ?? 0; byDate[d].te.wastage += r.wastage_te ?? 0
      byDate[d].be.prod += r.be_eggs ?? 0; byDate[d].be.wastage += r.wastage_be ?? 0
      byDate[d].le.prod += r.le_eggs ?? 0
    }
    for (const r of (dispatched ?? [])) {
      const d = r.production_date
      if (!byDate[d]) byDate[d] = blank()
      byDate[d].he.disp += r.he_qty ?? 0
      byDate[d].te.disp += r.te_qty ?? 0
    }
    // Running Opening -> Closing per grade, same ledger shape as the source
    // Excel. JE/BE/LE have no dispatch data (vhl_egg_production only tracks
    // he_qty/te_qty), so their Dispatch column is always 0 for those grades.
    const bal: Record<EggGrade, number> = { he: 0, je: 0, te: 0, be: 0, le: 0 }
    const all = Object.keys(byDate).sort().map(d => {
      const day = byDate[d]
      const out: any = { date: d }
      for (const g of EGG_GRADES) {
        const opening = bal[g]
        const closing = opening + day[g].prod - day[g].wastage - day[g].disp
        out[g] = { opening, prod: day[g].prod, wastage: day[g].wastage, disp: day[g].disp, closing }
        bal[g] = closing
      }
      return out
    })
    return all.filter(r => r.date >= fromDate)
  }, [production, dispatched, fromDate])

  const totals = rows.reduce((acc: any, r: any) => {
    for (const g of EGG_GRADES) {
      acc[g].prod += r[g].prod; acc[g].wastage += r[g].wastage; acc[g].disp += r[g].disp
    }
    return acc
  }, Object.fromEntries(EGG_GRADES.map(g => [g, { prod: 0, wastage: 0, disp: 0 }])) as Record<EggGrade, { prod: number; wastage: number; disp: number }>)

  const GRADE_LABEL: Record<EggGrade, string> = { he: 'HE', je: 'JE', te: 'TE', be: 'BE', le: 'LE' }

  const handleExport = () => {
    if (!rows.length) return
    const wb = XLSX.utils.book_new()
    const headers = ['Date', ...EGG_GRADES.flatMap(g => [`${EGG_GRADE_LABEL[g]} Opening`, `${EGG_GRADE_LABEL[g]} Production`, `${EGG_GRADE_LABEL[g]} Wastage`, `${EGG_GRADE_LABEL[g]} Dispatch`, `${EGG_GRADE_LABEL[g]} Closing`])]
    const data = [headers, ...rows.map((r: any) => [r.date, ...EGG_GRADES.flatMap(g => [r[g].opening, r[g].prod, r[g].wastage, r[g].disp, r[g].closing])])]
    const ws = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'Egg Stock Register')
    XLSX.writeFile(wb, `VHL_EggStockRegister_${fromDate}_${toDate}.xlsx`)
    toast.success('Downloaded')
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="VHL Egg Stock Register" subtitle="Opening / Received / Dispatch / Closing for every grade (HE/JE/TE/BE/LE), side by side — computed live, no formulas. Dispatch data only exists for HE/TE, so JE/BE/LE Dispatch is always 0."
        action={<Button variant="outline" icon={<Download size={14}/>} onClick={handleExport}>Export Excel</Button>} />
      <Card className="flex flex-wrap gap-3 items-end">
        <Select label="VHL Flock" placeholder="— Choose flock —" value={flockId} onChange={e => setFlockId(e.target.value)}
          options={(flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))} />
        <DateInput label="From" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <DateInput label="To" value={toDate} onChange={e => setToDate(e.target.value)} />
      </Card>
      {!flockId ? (
        <EmptyState icon={<Egg size={32}/>} title="Select a VHL flock" />
      ) : !rows.length ? (
        <EmptyState icon={<Egg size={32}/>} title="No production or dispatch data in this range" />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th className="text-center">&nbsp;</Th>
                  {EGG_GRADES.map(g => <Th key={g} colSpan={4} className="text-center border-l border-gray-200">{EGG_GRADE_LABEL[g]}</Th>)}
                </tr>
                <tr>
                  <Th>Date</Th>
                  {EGG_GRADES.map(g => (
                    <React.Fragment key={g}>
                      <Th right className="border-l border-gray-200">Opening</Th>
                      <Th right>Received</Th>
                      <Th right>Dispatch</Th>
                      <Th right>Closing</Th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.date} className="hover:bg-gray-50">
                    <Td className="text-sm font-medium whitespace-nowrap">{fmtDate(r.date)}</Td>
                    {EGG_GRADES.map(g => (
                      <React.Fragment key={g}>
                        <Td right className="text-sm text-gray-500 border-l border-gray-100">{r[g].opening.toLocaleString('en-IN')}</Td>
                        <Td right className="text-sm text-green-700">{r[g].prod>0?r[g].prod.toLocaleString('en-IN'):'—'}</Td>
                        <Td right className="text-sm text-orange-600">{r[g].disp>0?r[g].disp.toLocaleString('en-IN'):'—'}</Td>
                        <Td right className={`text-sm font-semibold ${r[g].closing<0?'text-red-600':'text-green-800'}`}>{r[g].closing.toLocaleString('en-IN')}</Td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <Td>TOTAL</Td>
                  {EGG_GRADES.map(g => (
                    <React.Fragment key={g}>
                      <Td right className="border-l border-gray-100">{rows[0]?.[g].opening.toLocaleString('en-IN')}</Td>
                      <Td right>{totals[g].prod.toLocaleString('en-IN')}</Td>
                      <Td right>{totals[g].disp.toLocaleString('en-IN')}</Td>
                      <Td right>{rows[rows.length-1]?.[g].closing.toLocaleString('en-IN')}</Td>
                    </React.Fragment>
                  ))}
                </tr>
              </tfoot>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
