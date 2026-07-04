import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import {
  Card, CardHeader, Button, Input, Select, FormRow, SectionHeader, Spinner,
  EmptyState, Table, Th, Td, DateInput, Badge
} from '@/components/ui'
import { Save, ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Bird, Download, Printer } from 'lucide-react'
import toast from 'react-hot-toast'

function exportCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}
const localYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// ═══════════════════════════════════════════════════════════════
// VHL Flocks — flocks flagged is_vhl_contract, entry point to the rest
// ═══════════════════════════════════════════════════════════════
export const VHLFlocksPage: React.FC = () => {
  const { data: flocks, isLoading } = useQuery({
    queryKey: ['vhl_flocks'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('id,flock_no,status,breed,placement_date,total_placed_f,total_placed_m,laying_farm_id,rearing_farm_id,farms!laying_farm_id(name)')
        .eq('is_vhl_contract', true).order('flock_no')
      return data ?? []
    }
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="VHL Flocks" subtitle="Contract flocks under VHL regulations — separate from our normal flock operations." />
      {isLoading ? <Spinner /> : !flocks?.length ? (
        <EmptyState icon={<Bird size={32}/>} title="No VHL flocks yet" subtitle="Tag a flock as a VHL contract flock in Flock Management to see it here." />
      ) : (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Flock No</Th><Th>Site</Th><Th>Breed</Th><Th>Status</Th><Th>Placement Date</Th><Th right>Placed F</Th><Th right>Placed M</Th></tr></thead>
            <tbody>
              {flocks.map((f: any) => (
                <tr key={f.id} className="hover:bg-gray-50 text-sm">
                  <Td className="font-medium">{f.flock_no}</Td>
                  <Td className="text-xs">{f.farms?.name ?? '—'}</Td>
                  <Td className="text-xs">{f.breed ?? '—'}</Td>
                  <Td><Badge color={f.status==='closed'?'gray':'green'}>{f.status}</Badge></Td>
                  <Td className="text-xs">{f.placement_date ? fmtDate(f.placement_date) : '—'}</Td>
                  <Td right className="text-xs">{f.total_placed_f?.toLocaleString('en-IN') ?? '—'}</Td>
                  <Td right className="text-xs">{f.total_placed_m?.toLocaleString('en-IN') ?? '—'}</Td>
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
    queryKey: ['vhl_flocks_active'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks').select('id,flock_no,status,placement_date,laying_start_date')
        .eq('is_vhl_contract', true).neq('status', 'closed').order('flock_no')
      return data ?? []
    }
  })
  const flock = flocks?.find((f: any) => f.id === flockId)
  const isLayingPhase = flock?.status === 'laying' || !!(flock?.laying_start_date && date >= flock.laying_start_date)

  const { data: existing } = useQuery({
    queryKey: ['vhl_daily_record', flockId, date],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry').select('*').eq('flock_id', flockId).eq('record_date', date).maybeSingle()
      return data
    },
    enabled: !!flockId && !!date
  })

  const { data: prevRecord } = useQuery({
    queryKey: ['vhl_prev_daily', flockId, date],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry').select('closing_female,closing_male,record_date')
        .eq('flock_id', flockId).lt('record_date', date).order('record_date', { ascending: false }).limit(1).maybeSingle()
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
    if (['opening_female','opening_male','trcull_female','trcull_male','mortality_female','mortality_male'].includes(k)) {
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

  const fourteenDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate()-14); return localYMD(d) })()
  const { data: recentRecords } = useQuery({
    queryKey: ['vhl_recent_records', flockId, fourteenDaysAgo],
    queryFn: async () => {
      const { data } = await supabase.from('vhl_daily_entry').select('*').eq('flock_id', flockId).gte('record_date', fourteenDaysAgo).order('record_date', { ascending: false })
      return data ?? []
    },
    enabled: !!flockId
  })

  const openF = parseInt(form.opening_female) || 0
  const totalEggs = parseInt(form.total_eggs) || 0
  const hdPct = openF > 0 ? (totalEggs / openF * 100).toFixed(1) + '%' : '—'

  return (
    <div className="space-y-5">
      <SectionHeader title="VHL Daily Entry" subtitle="Daily production & bird movement for VHL contract flocks — separate from our regular flock records." />
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
                  <Td><button onClick={() => openEdit(m)} className="p-1 text-blue-400 hover:text-blue-600"><Pencil size={14}/></button></Td>
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
  const [form, setForm] = useState({ usage_date: today(), vhl_medicine_id: '', quantity: '', unit: '', remarks: '' })

  const { data: flocks } = useQuery({
    queryKey: ['vhl_flocks_active'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no').eq('is_vhl_contract', true).order('flock_no'); return data ?? [] }
  })
  const { data: meds } = useQuery({
    queryKey: ['vhl_medicines_active'],
    queryFn: async () => { const { data } = await supabase.from('vhl_medicines').select('id,name,unit').eq('is_active', true).order('name'); return data ?? [] }
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
      const { error } = await supabase.from('vhl_medicine_usage').insert({
        flock_id: flockId, usage_date: form.usage_date, vhl_medicine_id: form.vhl_medicine_id,
        quantity: parseFloat(form.quantity), unit: form.unit || null, remarks: form.remarks || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Usage recorded'); qc.invalidateQueries({ queryKey: ['vhl_medicine_usage'] })
      setForm({ usage_date: today(), vhl_medicine_id: '', quantity: '', unit: '', remarks: '' })
    },
    onError: (e: any) => toast.error(e.message),
  })

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
        <Button onClick={() => addMut.mutate()} loading={addMut.isPending}>Record Usage</Button>
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
                  <Td><button onClick={() => delMut.mutate(r.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14}/></button></Td>
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
  const [form, setForm] = useState({ production_date: today(), he_qty: '', te_qty: '', dc_no: '', vehicle_no: '', remarks: '' })
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [invoiceNo, setInvoiceNo] = useState('')

  const { data: flocks } = useQuery({
    queryKey: ['vhl_flocks_active'],
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
      const amount = Math.round((he + te) * currentRate * 100) / 100
      const { data: dup } = await supabase.from('vhl_egg_production').select('id').eq('flock_id', flockId).eq('production_date', form.production_date).maybeSingle()
      if (dup) throw new Error('An entry already exists for this flock and date — edit it instead')
      const { error } = await supabase.from('vhl_egg_production').insert({
        flock_id: flockId, production_date: form.production_date, he_qty: he, te_qty: te,
        rate_per_egg: currentRate, amount, dc_no: form.dc_no || null, vehicle_no: form.vehicle_no || null, remarks: form.remarks || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Production recorded'); qc.invalidateQueries({ queryKey: ['vhl_egg_production'] })
      setForm({ production_date: today(), he_qty: '', te_qty: '', dc_no: '', vehicle_no: '', remarks: '' })
    },
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
          <p className="text-sm text-green-700 font-medium">Auto Amount: {inr(((parseInt(form.he_qty)||0)+(parseInt(form.te_qty)||0)) * currentRate)}</p>
        )}
        <Button onClick={() => addMut.mutate()} loading={addMut.isPending}>Save Dispatch</Button>
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

      {isLoading ? <Spinner /> : !rows?.length ? (
        <EmptyState icon={<Bird size={32}/>} title="No production recorded for this period" />
      ) : (
        <Card padding={false}>
          <CardHeader title={`${rows.length} days — ${totalEggs.toLocaleString('en-IN')} eggs — ${inr(totalAmount)}`} />
          <Table>
            <thead><tr><Th>Date</Th><Th>Flock</Th><Th right>HE</Th><Th right>TE</Th><Th right>Total</Th><Th right>Rate</Th><Th right>Amount</Th><Th>DC No</Th><Th>Vehicle</Th><Th>Invoice No</Th></tr></thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50 text-sm">
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
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
