import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate, today, pct } from '@/lib/utils'
import { useFarmScope } from '@/lib/useFarmScope'
import {
  Card, CardHeader, Button, Input, Select, FormRow, Modal, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState, StatCard, Divider
} from '@/components/ui'
import { Plus, Edit2, Egg } from 'lucide-react'
import toast from 'react-hot-toast'

export const HatchBatches: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [flockFilter, setFlockFilter] = useState('')
  const [tab, setTab] = useState<'batches'|'pipeline'>('batches')

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q; return data ?? []
    }
  })

  // Load dispatches for invoice linking
  const { data: dispatches } = useQuery({
    queryKey: ['he_dispatch_for_hatch', flockFilter],
    queryFn: async () => {
      let q = supabase.from('he_dispatch')
        .select('id,dispatch_date,invoice_no,dc_no,total_dispatched,flock_id,flocks(flock_no)')
        .order('dispatch_date', { ascending: false })
        .limit(300)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q; return data ?? []
    }
  })

  const { data: batches, isLoading } = useQuery({
    queryKey: ['hatch_batches', flockFilter],
    queryFn: async () => {
      let q = supabase.from('hatch_batches')
        .select('*, he_dispatch(dispatch_date,invoice_no,dc_no,total_dispatched,flocks(flock_no)), flocks(flock_no)')
        .order('setting_date', { ascending: false })
        .limit(200)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q; return data ?? []
    }
  })

  const emptyForm = {
    dispatch_id: '', flock_id: flockFilter, invoice_no: '',
    hatchery_name: '', setting_date: today(), eggs_set: '', broken_transit: '0',
    fertile_eggs: '', hatched_chicks: '', culled_chicks: '0',
    unhatched: '', blasters: '0', rejects: '0',
    chicks_sold: '', hatch_date: '', remarks: ''
  }
  const [form, setForm] = useState(emptyForm)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openForm = (row?: any) => {
    if (row) {
      setEditing(row)
      setForm({
        dispatch_id: row.dispatch_id ?? '',
        flock_id: row.flock_id ?? '',
        invoice_no: row.invoice_no ?? '',
        hatchery_name: row.hatchery_name ?? '',
        setting_date: row.setting_date ?? today(),
        eggs_set: row.eggs_set?.toString() ?? '',
        broken_transit: row.broken_transit?.toString() ?? '0',
        fertile_eggs: row.fertile_eggs?.toString() ?? '',
        hatched_chicks: row.hatched_chicks?.toString() ?? '',
        culled_chicks: row.culled_chicks?.toString() ?? '0',
        unhatched: row.unhatched?.toString() ?? '',
        blasters: row.blasters?.toString() ?? '0',
        rejects: row.rejects?.toString() ?? '0',
        chicks_sold: row.chicks_sold?.toString() ?? '',
        hatch_date: row.hatch_date ?? '',
        remarks: row.remarks ?? ''
      })
    } else {
      setEditing(null)
      setForm({ ...emptyForm, flock_id: flockFilter })
    }
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.setting_date) throw new Error('Setting date required')
      const eggsSet = parseInt(form.eggs_set) || null
      const fertile = parseInt(form.fertile_eggs) || null
      const hatched = parseInt(form.hatched_chicks) || null
      const fertilityPct = fertile && eggsSet ? parseFloat(((fertile / eggsSet) * 100).toFixed(2)) : null
      const hatchPct = hatched && fertile ? parseFloat(((hatched / fertile) * 100).toFixed(2)) : null

      // Auto-fill flock from dispatch if not set
      let flockId = form.flock_id
      if (!flockId && form.dispatch_id) {
        const d = dispatches?.find((d: any) => d.id === form.dispatch_id)
        flockId = d?.flock_id ?? ''
      }

      const payload = {
        dispatch_id: form.dispatch_id || null,
        flock_id: flockId || null,
        invoice_no: form.invoice_no || null,
        hatchery_name: form.hatchery_name || null,
        setting_date: form.setting_date,
        eggs_set: eggsSet,
        broken_transit: parseInt(form.broken_transit) || 0,
        fertile_eggs: fertile,
        hatched_chicks: hatched,
        culled_chicks: parseInt(form.culled_chicks) || 0,
        unhatched: parseInt(form.unhatched) || null,
        blasters: parseInt(form.blasters) || 0,
        rejects: parseInt(form.rejects) || 0,
        chicks_sold: parseInt(form.chicks_sold) || null,
        hatch_date: form.hatch_date || null,
        fertility_pct: fertilityPct,
        hatchability_pct: hatchPct,
        remarks: form.remarks || null
      }
      if (editing) {
        const { error } = await supabase.from('hatch_batches').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('hatch_batches').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Saved!')
      qc.invalidateQueries({ queryKey: ['hatch_batches'] })
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const dispatchOptions = (dispatches ?? []).map((d: any) => ({
    value: d.id,
    label: `${d.invoice_no ? d.invoice_no + ' — ' : d.dc_no ? 'DC-' + d.dc_no + ' — ' : ''}${fmtDate(d.dispatch_date)} (${d.total_dispatched?.toLocaleString('en-IN')} eggs) F-${d.flocks?.flock_no}`
  }))

  // Pipeline: batches without hatch report yet
  const pipeline = (batches ?? []).filter((b: any) => !b.hatched_chicks && b.setting_date)
  const completed = (batches ?? []).filter((b: any) => b.hatched_chicks)

  // Summary stats
  const totalEggsSet = completed.reduce((s: number, b: any) => s + (b.eggs_set ?? 0), 0)
  const totalHatched = completed.reduce((s: number, b: any) => s + (b.hatched_chicks ?? 0), 0)
  const totalChicksSold = completed.reduce((s: number, b: any) => s + (b.chicks_sold ?? 0), 0)
  const avgFertility = completed.length ? completed.reduce((s: number, b: any) => s + (b.fertility_pct ?? 0), 0) / completed.filter((b: any) => b.fertility_pct).length : 0
  const avgHatch = completed.length ? completed.reduce((s: number, b: any) => s + (b.hatchability_pct ?? 0), 0) / completed.filter((b: any) => b.hatchability_pct).length : 0

  const displayed = tab === 'pipeline' ? pipeline : (batches ?? [])

  return (
    <div className="space-y-5">
      <SectionHeader title="Hatch Batches"
        subtitle="Link dispatched invoices to hatchery settings and record hatch reports"
        action={<Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Batch</Button>}
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([['batches','All Batches'],['pipeline','Pipeline (Awaiting Hatch)']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===t?'border-brand-600 text-brand-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}{t==='pipeline' && pipeline.length > 0 && <span className="ml-1.5 bg-orange-100 text-orange-700 text-xs px-1.5 rounded-full">{pipeline.length}</span>}
          </button>
        ))}
      </div>

      <div className="flex gap-3 items-end">
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
        {flockFilter && <Button variant="ghost" size="sm" onClick={() => setFlockFilter('')}>Clear</Button>}
      </div>

      {completed.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Eggs Set" value={totalEggsSet.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-brand-600"/>
          <StatCard title="Chicks Hatched" value={totalHatched.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-green-600"/>
          <StatCard title="Avg Fertility" value={`${avgFertility.toFixed(1)}%`} icon={<Egg size={18}/>} color={avgFertility > 90 ? 'text-green-600' : 'text-orange-500'}/>
          <StatCard title="Avg Hatchability" value={`${avgHatch.toFixed(1)}%`} icon={<Egg size={18}/>} color={avgHatch > 80 ? 'text-green-600' : 'text-orange-500'}/>
        </div>
      )}

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Flock</Th><Th>Invoice / DC</Th><Th>Hatchery</Th>
              <Th>Setting Date</Th><Th>Hatch Date</Th>
              <Th right>Eggs Set</Th><Th right>Fertile</Th><Th right>Hatched</Th>
              <Th right>Fertility%</Th><Th right>Hatch%</Th>
              <Th right>Chicks Sold</Th><Th></Th>
            </tr></thead>
            <tbody>
              {displayed.map((b: any) => {
                const hasReport = !!b.hatched_chicks
                return (
                  <tr key={b.id} className={`hover:bg-gray-50 ${!hasReport ? 'bg-yellow-50' : ''}`}>
                    <Td><Badge color="green">F-{b.flocks?.flock_no ?? b.he_dispatch?.flocks?.flock_no}</Badge></Td>
                    <Td className="text-xs">
                      {b.invoice_no
                        ? <span className="font-medium text-blue-700">{b.invoice_no}</span>
                        : b.he_dispatch?.invoice_no
                          ? <span className="font-medium text-blue-700">{b.he_dispatch.invoice_no}</span>
                          : b.he_dispatch?.dc_no ? `DC-${b.he_dispatch.dc_no}` : '—'}
                    </Td>
                    <Td className="text-sm">{b.hatchery_name ?? '—'}</Td>
                    <Td className="text-xs">{fmtDate(b.setting_date)}</Td>
                    <Td className="text-xs">{b.hatch_date ? fmtDate(b.hatch_date) : <span className="text-orange-400 text-xs">Awaiting</span>}</Td>
                    <Td right className="text-sm">{b.eggs_set?.toLocaleString('en-IN') ?? '—'}</Td>
                    <Td right className="text-xs">{b.fertile_eggs?.toLocaleString('en-IN') ?? '—'}</Td>
                    <Td right className="text-xs">{b.hatched_chicks?.toLocaleString('en-IN') ?? '—'}</Td>
                    <Td right className={`text-xs font-medium ${b.fertility_pct >= 90 ? 'text-green-600' : b.fertility_pct ? 'text-orange-500' : 'text-gray-400'}`}>
                      {b.fertility_pct ? `${b.fertility_pct}%` : '—'}
                    </Td>
                    <Td right className={`text-xs font-medium ${b.hatchability_pct >= 80 ? 'text-green-600' : b.hatchability_pct ? 'text-orange-500' : 'text-gray-400'}`}>
                      {b.hatchability_pct ? `${b.hatchability_pct}%` : '—'}
                    </Td>
                    <Td right className="text-sm font-medium">{b.chicks_sold?.toLocaleString('en-IN') ?? '—'}</Td>
                    <Td>
                      <button onClick={() => openForm(b)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600">
                        <Edit2 size={13}/>
                      </button>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
          {displayed.length === 0 && (
            <EmptyState icon={<Egg size={32}/>} title={tab === 'pipeline' ? 'No batches awaiting hatch' : 'No hatch batches yet'}
              action={<Button onClick={() => openForm()} icon={<Plus size={16}/>}>Add Batch</Button>}
            />
          )}
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editing ? 'Edit Hatch Batch' : 'New Hatch Batch'} size="lg"
        footer={
          <><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>{editing ? 'Update' : 'Save'}</Button></>
        }>
        <div className="space-y-4">
          <FormRow>
            <Select label="Flock" placeholder="— Select or auto from invoice —" options={flockOptions}
              value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
            <Input label="Hatchery Name" placeholder="e.g. Hitech Hatch Fresh Pvt Ltd"
              value={form.hatchery_name} onChange={e => s('hatchery_name', e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Link Dispatch Invoice" placeholder="— Select invoice (optional) —"
              options={dispatchOptions} value={form.dispatch_id}
              onChange={e => {
                s('dispatch_id', e.target.value)
                const d = dispatches?.find((d: any) => d.id === e.target.value)
                if (d) {
                  if (d.invoice_no) s('invoice_no', d.invoice_no)
                  if (d.flock_id) s('flock_id', d.flock_id)
                  if (d.total_dispatched) s('eggs_set', d.total_dispatched.toString())
                }
              }} />
            <Input label="Invoice No (override)" placeholder="INV-2026-001"
              value={form.invoice_no} onChange={e => s('invoice_no', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Setting Date" required type="date" value={form.setting_date}
              onChange={e => s('setting_date', e.target.value)} />
            <Input label="Hatch Date" type="date" value={form.hatch_date}
              onChange={e => s('hatch_date', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Eggs Set" type="number" value={form.eggs_set}
              onChange={e => s('eggs_set', e.target.value)} />
            <Input label="Broken in Transit" type="number" value={form.broken_transit}
              onChange={e => s('broken_transit', e.target.value)} />
          </FormRow>
          <Divider label="Hatch Report (fill after hatch — Hitech only gives full detail)" />
          <FormRow cols={3}>
            <Input label="Fertile Eggs" type="number" value={form.fertile_eggs}
              onChange={e => s('fertile_eggs', e.target.value)} />
            <Input label="Hatched Chicks" type="number" value={form.hatched_chicks}
              onChange={e => s('hatched_chicks', e.target.value)} />
            <Input label="Culled Chicks" type="number" value={form.culled_chicks}
              onChange={e => s('culled_chicks', e.target.value)} />
          </FormRow>
          <FormRow cols={3}>
            <Input label="Unhatched" type="number" value={form.unhatched}
              onChange={e => s('unhatched', e.target.value)} />
            <Input label="Blasters" type="number" value={form.blasters}
              onChange={e => s('blasters', e.target.value)} />
            <Input label="Rejects" type="number" value={form.rejects}
              onChange={e => s('rejects', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Chicks Sold" type="number" value={form.chicks_sold}
              onChange={e => s('chicks_sold', e.target.value)} />
            <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
          </FormRow>
          {(form.eggs_set && form.fertile_eggs) && (
            <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700 flex gap-6">
              <span>Fertility: <strong>{((parseInt(form.fertile_eggs)||0)/(parseInt(form.eggs_set)||1)*100).toFixed(1)}%</strong></span>
              {form.hatched_chicks && <span>Hatchability: <strong>{((parseInt(form.hatched_chicks)||0)/(parseInt(form.fertile_eggs)||1)*100).toFixed(1)}%</strong></span>}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
