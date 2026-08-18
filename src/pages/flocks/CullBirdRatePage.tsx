import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, today, fmtDate, fetchAllPages } from '@/lib/utils'
import {
  Card, Button, Input, Modal, Table, Th, Td, SectionHeader, Spinner, EmptyState,
  DateInput, StatCard
} from '@/components/ui'
import { Plus, Trash2, Pencil, Search, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'
import toast from 'react-hot-toast'

// Daily cull bird rate, ₹ per kg. Unlike the HE Association rate — one rate a
// week, Sun-Sat — cull rates move day to day, so a day IS the unit here and
// rate_date is unique in the table.
export const CullBirdRatePage: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const blank = { rate_date: today(), rate_per_kg: '', remarks: '' }
  const [form, setForm] = useState(blank)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Paged, not a bare select — a daily register passes 1,000 rows in under
  // three years and a capped read would silently drop the oldest rates from
  // the chart and the averages.
  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['cull_bird_rate'],
    queryFn: async () => fetchAllPages<any>((from, to) => supabase
      .from('cull_bird_rate').select('*')
      .order('rate_date', { ascending: false }).order('id').range(from, to), 'Cull bird rates')
  })

  const filtered = rates.filter((r: any) => {
    if (fromDate && r.rate_date < fromDate) return false
    if (toDate && r.rate_date > toDate) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      if (!`${r.rate_date} ${r.rate_per_kg} ${r.remarks ?? ''}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const rate = parseFloat(form.rate_per_kg)
      if (!form.rate_date) throw new Error('Pick the date')
      if (!isFinite(rate) || rate <= 0) throw new Error('Enter the rate per kg')
      if (editingId) {
        const { error } = await supabase.from('cull_bird_rate')
          .update({ rate_date: form.rate_date, rate_per_kg: rate, remarks: form.remarks || null })
          .eq('id', editingId)
        if (error) throw error
      } else {
        // One rate per day. Adding a second for a day that already has one would
        // leave two answers to the same question, so it is blocked and points
        // at Edit — the same guard the HE weekly register uses.
        const { data: existing } = await supabase.from('cull_bird_rate')
          .select('id,rate_per_kg').eq('rate_date', form.rate_date).maybeSingle()
        if (existing) throw new Error(`A rate (${inr(existing.rate_per_kg)}/kg) is already saved for ${fmtDate(form.rate_date)} — edit that entry instead.`)
        const { error } = await supabase.from('cull_bird_rate')
          .insert({ rate_date: form.rate_date, rate_per_kg: rate, remarks: form.remarks || null })
        if (error) throw error
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cull_bird_rate'] }); setShowForm(false); setEditingId(null); setForm(blank); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('cull_bird_rate').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cull_bird_rate'] }); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  const openEdit = (r: any) => {
    setEditingId(r.id)
    setForm({ rate_date: r.rate_date, rate_per_kg: r.rate_per_kg?.toString() ?? '', remarks: r.remarks ?? '' })
    setShowForm(true)
  }

  // Latest, and the simple average across whatever is on screen. The average is
  // of the DAYS shown, not weighted by any quantity — the register holds rates
  // only, so there is no weight here to weight it by.
  const latest = rates[0]
  const avg = filtered.length
    ? filtered.reduce((a: number, r: any) => a + Number(r.rate_per_kg), 0) / filtered.length
    : null
  const high = filtered.length ? Math.max(...filtered.map((r: any) => Number(r.rate_per_kg))) : null
  const low  = filtered.length ? Math.min(...filtered.map((r: any) => Number(r.rate_per_kg))) : null

  const chart = [...filtered].reverse().map((r: any) => ({
    date: fmtDate(r.rate_date).slice(0, 5),
    rate: Number(r.rate_per_kg),
  }))

  return (
    <div className="space-y-5">
      <SectionHeader title="Cull Bird Rate Register"
        subtitle={`Daily rate in ₹ per kg${
          filtered.length !== rates.length ? ` — showing ${filtered.length.toLocaleString('en-IN')} of ${rates.length.toLocaleString('en-IN')} day(s)` :
          rates.length ? ` — ${rates.length.toLocaleString('en-IN')} day(s) recorded` : ''}`}
        action={<Button icon={<Plus size={15} />} onClick={() => { setEditingId(null); setForm(blank); setShowForm(true) }}>Add Rate</Button>}
      />

      {rates.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Latest rate" value={latest ? `${inr(latest.rate_per_kg)}/kg` : '—'}
            icon={<TrendingUp size={18} />} color="text-brand-600" />
          <StatCard title="Average (shown)" value={avg != null ? `${inr(avg)}/kg` : '—'}
            icon={<TrendingUp size={18} />} color="text-gray-600" />
          <StatCard title="Highest (shown)" value={high != null ? `${inr(high)}/kg` : '—'}
            icon={<TrendingUp size={18} />} color="text-green-600" />
          <StatCard title="Lowest (shown)" value={low != null ? `${inr(low)}/kg` : '—'}
            icon={<TrendingUp size={18} />} color="text-red-600" />
        </div>
      )}

      <div className="flex gap-3 items-end flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search date, rate, remarks…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <DateInput label="From" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <DateInput label="To" value={toDate} onChange={e => setToDate(e.target.value)} />
        {(search || fromDate || toDate) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFromDate(''); setToDate('') }}>Clear</Button>
        )}
      </div>

      {isLoading ? <Spinner /> : filtered.length === 0 ? (
        <Card><EmptyState title={rates.length ? 'No rates in this selection' : 'No cull bird rates recorded yet'} /></Card>
      ) : (
        <>
          {chart.length > 1 && (
            <Card>
              <h3 className="font-semibold text-gray-800 mb-4">Rate per kg over time</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => `${inr(Number(v))}/kg`} />
                  <Line type="monotone" dataKey="rate" name="₹/kg" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
          <Card padding={false}>
            <Table>
              <thead><tr><Th>Date</Th><Th right>Rate per kg</Th><Th right>Change</Th><Th>Remarks</Th><Th right>Actions</Th></tr></thead>
              <tbody>
                {filtered.map((r: any, i: number) => {
                  // Change against the NEXT row down, which is the previous day
                  // recorded — not necessarily yesterday, since a day with no
                  // entry is simply absent rather than carried forward.
                  const prev = filtered[i + 1]
                  const delta = prev ? Number(r.rate_per_kg) - Number(prev.rate_per_kg) : null
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <Td className="font-medium">{fmtDate(r.rate_date)}</Td>
                      <Td right className="font-semibold">{inr(r.rate_per_kg)}</Td>
                      <Td right className={delta == null ? 'text-gray-400' : delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-400'}>
                        {delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`}
                      </Td>
                      <Td>{r.remarks ?? '—'}</Td>
                      <Td right>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEdit(r)}><Pencil size={14} className="text-gray-400 hover:text-brand-600" /></button>
                          <button onClick={() => confirm(`Delete the rate for ${fmtDate(r.rate_date)}?`) && delMut.mutate(r.id)}>
                            <Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </Card>
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editingId ? 'Edit Cull Bird Rate' : 'Add Cull Bird Rate'}
        footer={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>}>
        <div className="space-y-3">
          <DateInput label="Date *" required value={form.rate_date} onChange={e => s('rate_date', e.target.value)} />
          <Input label="Rate per kg (₹) *" type="number" step="0.01" value={form.rate_per_kg}
            onChange={e => s('rate_per_kg', e.target.value)} hint="e.g. 82.50" />
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
          <p className="text-xs text-gray-500">
            One rate per day. If a rate is already saved for this date the app will say so and point you
            at Edit, rather than leaving two different rates for the same day.
          </p>
        </div>
      </Modal>
    </div>
  )
}
