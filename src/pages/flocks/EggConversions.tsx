import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { fmtDate, today } from '@/lib/utils'
import { useFarmScope } from '@/lib/useFarmScope'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState
, DateInput, SearchableSelect } from '@/components/ui'
import { Plus, ArrowRight, Pencil, Trash2, Upload, FileDown, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { useConfigOptions } from '@/hooks/useConfigOptions'

const EGG_TYPES_FB = [
  { value: 'he_grade_a', label: 'HE Grade A' },
  { value: 'he_grade_b', label: 'HE Grade B' },
  { value: 'he_grade_c', label: 'HE Grade C' },
  { value: 'je_eggs',    label: 'Jumbo Eggs (JE)' },
  { value: 'te_eggs',    label: 'Table Eggs (TE)' },
  { value: 'be_eggs',    label: 'Broken Eggs (BE)' },
  { value: 'le_eggs',    label: 'Leached Eggs (LE)' },
]

export const EggConversions: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const EGG_TYPES = useConfigOptions('egg_type', EGG_TYPES_FB)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [flockFilter, setFlockFilter] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,laying_farm_id,rearing_farm_id').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q; return data ?? []
    }
  })

  // farm_id was never populated on conversions, making them invisible to
  // any farm-scoped report — derive it from the flock's laying/rearing farm.
  const farmIdForFlock = (flockId: string) => {
    const f = (flocks ?? []).find((x: any) => x.id === flockId)
    return f?.laying_farm_id ?? f?.rearing_farm_id ?? null
  }

  const { data: conversions, isLoading } = useQuery({
    queryKey: ['egg_conversions', flockFilter],
    queryFn: async () => {
      let q = supabase.from('egg_conversions')
        .select('*, flocks(flock_no)')
        .order('conversion_date', { ascending: false })
        .limit(200)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q; return data ?? []
    }
  })

  const [form, setForm] = useState({
    flock_id: '', conversion_date: today(),
    from_type: 'he_grade_c', from_qty: '',
    to_type: 'te_eggs', to_qty: '',
    reason: ''
  })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openForm = (row?: any) => {
    if (row) {
      setEditing(row)
      setForm({
        flock_id: row.flock_id ?? '',
        conversion_date: row.conversion_date ?? today(),
        from_type: row.from_type ?? 'he_grade_c',
        from_qty: row.from_qty?.toString() ?? '',
        to_type: row.to_type ?? 'te_eggs',
        to_qty: row.to_qty?.toString() ?? '',
        reason: row.reason ?? ''
      })
    } else {
      setEditing(null)
      setForm({ flock_id: flockFilter, conversion_date: today(), from_type: 'he_grade_c', from_qty: '', to_type: 'te_eggs', to_qty: '', reason: '' })
    }
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.flock_id || !form.from_qty || !form.to_qty)
        throw new Error('Flock, from qty and to qty required')
      if (form.from_type === form.to_type)
        throw new Error('From and To types cannot be the same')
      if ((parseInt(form.from_qty) || 0) <= 0 || (parseInt(form.to_qty) || 0) <= 0)
        throw new Error('Quantities must be positive')
      const payload = {
        flock_id: form.flock_id,
        farm_id: farmIdForFlock(form.flock_id),
        conversion_date: form.conversion_date,
        from_type: form.from_type,
        from_qty: parseInt(form.from_qty),
        to_type: form.to_type,
        to_qty: parseInt(form.to_qty),
        reason: form.reason || null
      }
      if (editing) {
        const { error } = await supabase.from('egg_conversions').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('egg_conversions').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Conversion updated' : 'Conversion recorded')
      qc.invalidateQueries({ queryKey: ['egg_conversions'] })
      setShowForm(false); setEditing(null)
      setForm({ flock_id: flockFilter, conversion_date: today(), from_type: 'he_grade_c', from_qty: '', to_type: 'te_eggs', to_qty: '', reason: '' })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('egg_conversions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['egg_conversions'] }); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message)
  })

  const parseDMY = (v: string) => {
    if (!v) return null
    const str = String(v).trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)
    const [d, m, y] = str.split('/')
    if (d && m && y) return `${y.padStart(4, '20')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    return null
  }

  const downloadTemplate = () => {
    downloadXlsxTemplate(
      'EggConversions_Template.xlsx',
      ['flock_no', 'conversion_date', 'from_type', 'from_qty', 'to_type', 'to_qty', 'reason'],
      ['1', today().split('-').reverse().join('/'), 'he_grade_c', '500', 'te_eggs', '500', 'Old stock']
    )
  }

  const exportRows = () => {
    const data = (conversions ?? []).map((c: any) => ({
      flock_no: c.flocks?.flock_no ?? '',
      conversion_date: fmtDate(c.conversion_date),
      from_type: c.from_type,
      from_qty: c.from_qty ?? 0,
      to_type: c.to_type,
      to_qty: c.to_qty ?? 0,
      reason: c.reason ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Conversions')
    XLSX.writeFile(wb, `EggConversions_${today()}.xlsx`)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    e.target.value = ''
    try {
      const { headers, rows } = await parseFile(file)
      if (!rows.length) { toast.error('No data found in file'); return }
      const col = (n: string) => headers.indexOf(n)
      const flockMap = Object.fromEntries((flocks ?? []).map((f: any) => [String(f.flock_no), f.id]))
      const parsed = rows.map((r: string[]) => {
        const flockNo = String(r[col('flock_no')] ?? '').replace(/^F-/i, '').trim()
        return {
          flock_id: flockMap[flockNo] ?? null,
          conversion_date: parseDMY(r[col('conversion_date')]) ?? today(),
          from_type: r[col('from_type')] || 'he_grade_c',
          from_qty: parseInt(r[col('from_qty')]) || 0,
          to_type: r[col('to_type')] || 'te_eggs',
          to_qty: parseInt(r[col('to_qty')]) || 0,
          reason: r[col('reason')] || null,
        }
      }).filter((r: any) => r.flock_id && r.from_type !== r.to_type && r.from_qty > 0 && r.to_qty > 0)
        .map((r: any) => ({ ...r, farm_id: farmIdForFlock(r.flock_id) }))
      if (!parsed.length) { toast.error('No valid rows matched a known flock'); return }
      // Skip rows that already exist — re-importing the same file used to
      // double-count every conversion against stock.
      const { data: existing } = await supabase.from('egg_conversions')
        .select('flock_id,conversion_date,from_type,to_type,from_qty')
        .in('flock_id', [...new Set(parsed.map((r: any) => r.flock_id))])
      const exists = (r: any) => (existing ?? []).some((e: any) =>
        e.flock_id === r.flock_id && e.conversion_date === r.conversion_date &&
        e.from_type === r.from_type && e.to_type === r.to_type && e.from_qty === r.from_qty)
      const fresh = parsed.filter((r: any) => !exists(r))
      const skipped = parsed.length - fresh.length
      if (!fresh.length) { toast.error(`All ${skipped} rows already exist — nothing imported`); return }
      const { error } = await supabase.from('egg_conversions').insert(fresh)
      if (error) throw error
      toast.success(`Imported ${fresh.length} conversions${skipped ? ` (${skipped} duplicates skipped)` : ''}`)
      qc.invalidateQueries({ queryKey: ['egg_conversions'] })
    } catch (err: any) {
      toast.error('Import failed: ' + err.message)
    }
  }

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const typeLabel = (v: string) => EGG_TYPES.find(t => t.value === v)?.label ?? v

  return (
    <div className="space-y-5">
      <SectionHeader title="Egg Conversions"
        subtitle="Record HE↔NHE type conversions (e.g. Grade C → Table Eggs)"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<FileDown size={15}/>} onClick={downloadTemplate}>Template</Button>
            <Button variant="secondary" icon={<Upload size={15}/>} onClick={() => fileRef.current?.click()}>Import</Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            {(conversions?.length ?? 0) > 0 && (
              <Button variant="secondary" icon={<Download size={15}/>} onClick={exportRows}>Export</Button>
            )}
            <Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Conversion</Button>
          </div>
        }
      />

      <div className="flex gap-3 items-end">
        <SearchableSelect placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={v => setFlockFilter(v)} className="w-44" />
        {flockFilter && <Button variant="ghost" size="sm" onClick={() => setFlockFilter('')}>Clear</Button>}
      </div>

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>Flock</Th>
              <Th>From</Th><Th right>From Qty</Th>
              <Th></Th>
              <Th>To</Th><Th right>To Qty</Th>
              <Th>Reason</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(conversions ?? []).map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <Td className="text-sm">{fmtDate(c.conversion_date)}</Td>
                  <Td><Badge color="green">F-{c.flocks?.flock_no}</Badge></Td>
                  <Td><span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">{typeLabel(c.from_type)}</span></Td>
                  <Td right className="font-medium text-red-600">{c.from_qty?.toLocaleString('en-IN')}</Td>
                  <Td><ArrowRight size={14} className="text-gray-400 mx-auto"/></Td>
                  <Td><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">{typeLabel(c.to_type)}</span></Td>
                  <Td right className="font-medium text-green-600">{c.to_qty?.toLocaleString('en-IN')}</Td>
                  <Td className="text-xs text-gray-400">{c.reason ?? '—'}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openForm(c)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil size={13}/></button>
                      <button onClick={() => { if (confirm('Delete this conversion?')) delMut.mutate(c.id) }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {(conversions ?? []).length === 0 && (
            <EmptyState icon={<ArrowRight size={32}/>} title="No conversions yet"
              action={<Button onClick={() => openForm()} icon={<Plus size={16}/>}>Add Conversion</Button>}
            />
          )}
        </Card>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Egg Conversion' : 'Record Egg Conversion'} size="md"
        footer={
          <><Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button></>
        }>
        <div className="space-y-4">
          <FormRow>
            <SearchableSelect label="Flock" required placeholder="— Select —" options={flockOptions}
              value={form.flock_id} onChange={v => s('flock_id', v)} />
            <DateInput label="Date" required value={form.conversion_date}
              onChange={e => s('conversion_date', e.target.value)} />
          </FormRow>
          <div className="grid grid-cols-5 gap-3 items-end">
            <div className="col-span-2 space-y-3">
              <Select label="From Type" options={EGG_TYPES} value={form.from_type}
                onChange={e => s('from_type', e.target.value)} />
              <Input label="From Qty" required type="number" value={form.from_qty}
                onChange={e => s('from_qty', e.target.value)} />
            </div>
            <div className="flex items-center justify-center pb-2">
              <ArrowRight size={20} className="text-gray-400"/>
            </div>
            <div className="col-span-2 space-y-3">
              <Select label="To Type" options={EGG_TYPES} value={form.to_type}
                onChange={e => s('to_type', e.target.value)} />
              <Input label="To Qty" required type="number" value={form.to_qty}
                onChange={e => s('to_qty', e.target.value)} />
            </div>
          </div>
          <Input label="Reason" placeholder="e.g. Old stock — eggs too old for setting"
            value={form.reason} onChange={e => s('reason', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
