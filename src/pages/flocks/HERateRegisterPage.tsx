import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, today } from '@/lib/utils'
import { Card, Button, Input, Select, FormRow, Modal, Table, Th, Td, SectionHeader, Spinner, EmptyState, DateInput } from '@/components/ui'
import { Plus, Trash2, TrendingUp, Pencil, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = ['Weekly Rates', 'Vendor Rates', 'STD Production Curve'] as const

// Sunday of the week containing `d`
function weekStartOf(d: Date) {
  const x = new Date(d)
  x.setDate(x.getDate() - x.getDay())
  return x
}
function fmt(d: Date) { return d.toISOString().slice(0, 10) }

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
        const { error } = await supabase.from('he_rate_register')
          .upsert({ week_start: form.week_start, week_end: form.week_end, rate, declared_date: form.declared_date || null, remarks: form.remarks || null }, { onConflict: 'week_start' })
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

  // Auto-set week_end when week_start picked
  const onWeekStart = (v: string) => {
    if (!v) { s('week_start', v); return }
    const d = new Date(v); const end = new Date(d); end.setDate(end.getDate() + 6)
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
              {filtered.map((r: any) => (
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
    queryFn: async () => { const { data } = await supabase.from('he_rate_register').select('rate,week_start,week_end').order('week_start', { ascending: false }).limit(1).maybeSingle(); return data }
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

const StdCurveTab: React.FC = () => {
  const qc = useQueryClient()
  const [season, setSeason] = useState<typeof SEASONS[number]>('Summer')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ week_of_age: '', std_production_pct: '' })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: curve = [], isLoading } = useQuery({
    queryKey: ['std_production_curve', season],
    queryFn: async () => { const { data } = await supabase.from('std_production_curve').select('*').eq('season', season).order('week_of_age'); return data ?? [] }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const week = parseInt(form.week_of_age), pct = parseFloat(form.std_production_pct)
      if (!week || isNaN(pct)) throw new Error('Enter week of age and standard %')
      const { error } = await supabase.from('std_production_curve').upsert({ season, week_of_age: week, std_production_pct: pct }, { onConflict: 'season,week_of_age' })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['std_production_curve', season] }); setShowForm(false); setForm({ week_of_age: '', std_production_pct: '' }); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })
  const delMut = useMutation({
    mutationFn: async (week: number) => { const { error } = await supabase.from('std_production_curve').delete().eq('season', season).eq('week_of_age', week); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['std_production_curve', season] }); toast.success('Deleted') },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={season} onChange={e => setSeason(e.target.value as any)} options={SEASONS.map(s => ({ value: s, label: `${s} Laying` }))} />
        <Button icon={<Plus size={14} />} onClick={() => { setForm({ week_of_age: '', std_production_pct: '' }); setShowForm(true) }}>Add Week</Button>
      </div>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Week of Age</Th><Th right>Std Production %</Th><Th right>Actions</Th></tr></thead>
            <tbody>
              {curve.map((r: any) => (
                <tr key={r.week_of_age} className="hover:bg-gray-50">
                  <Td className="font-medium">Week {r.week_of_age}</Td>
                  <Td right>{r.std_production_pct}%</Td>
                  <Td right><button onClick={() => confirm('Delete?') && delMut.mutate(r.week_of_age)}><Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button></Td>
                </tr>
              ))}
              {curve.length === 0 && <tr><Td colSpan={3}><EmptyState title={`No ${season} Laying curve entries yet`} /></Td></tr>}
            </tbody>
          </Table>
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={`Add ${season} Laying Week`}
        footer={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>}>
        <div className="space-y-3">
          <Input label="Week of Age *" type="number" value={form.week_of_age} onChange={e => s('week_of_age', e.target.value)} />
          <Input label="Standard Production % *" type="number" step="0.01" value={form.std_production_pct} onChange={e => s('std_production_pct', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
