import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { fmtDate } from '@/lib/utils'
import { today } from '@/lib/utils'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import {
  Card, Button, Input, Select, FormRow, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState
, DateInput, SearchableSelect } from '@/components/ui'
import { Plus, Pencil, Trash2, Upload, FileDown, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

export const EggOpeningStockPage: React.FC = () => {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    flock_id: '', as_of_date: today(),
    he_grade_a: '0', he_grade_b: '0', he_grade_c: '0',
    je_eggs: '0', te_eggs: '0', be_eggs: '0', le_eggs: '0'
  })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no,status').order('flock_no'); return data ?? [] }
  })

  const { data: stocks, isLoading } = useQuery({
    queryKey: ['egg_opening_stock'],
    queryFn: async () => {
      const { data } = await supabase.from('egg_opening_stock')
        .select('*, flocks(flock_no,status)')
        .order('as_of_date', { ascending: false })
      return data ?? []
    }
  })

  const openForm = (row?: any) => {
    if (row) {
      setEditing(row)
      setForm({
        flock_id: row.flock_id, as_of_date: row.as_of_date,
        he_grade_a: row.he_grade_a?.toString() ?? '0',
        he_grade_b: row.he_grade_b?.toString() ?? '0',
        he_grade_c: row.he_grade_c?.toString() ?? '0',
        je_eggs: row.je_eggs?.toString() ?? '0',
        te_eggs: row.te_eggs?.toString() ?? '0',
        be_eggs: row.be_eggs?.toString() ?? '0',
        le_eggs: row.le_eggs?.toString() ?? '0',
      })
    } else {
      setEditing(null)
      setForm({ flock_id: '', as_of_date: today(), he_grade_a: '0', he_grade_b: '0', he_grade_c: '0', je_eggs: '0', te_eggs: '0', be_eggs: '0', le_eggs: '0' })
    }
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.flock_id || !form.as_of_date) throw new Error('Flock and date required')
      const payload = {
        flock_id: form.flock_id, as_of_date: form.as_of_date,
        he_grade_a: parseInt(form.he_grade_a) || 0,
        he_grade_b: parseInt(form.he_grade_b) || 0,
        he_grade_c: parseInt(form.he_grade_c) || 0,
        je_eggs: parseInt(form.je_eggs) || 0,
        te_eggs: parseInt(form.te_eggs) || 0,
        be_eggs: parseInt(form.be_eggs) || 0,
        le_eggs: parseInt(form.le_eggs) || 0,
      }
      // Reject negative counts before they seed the stock-register running total
      for (const k of ['he_grade_a','he_grade_b','he_grade_c','je_eggs','te_eggs','be_eggs','le_eggs'] as const) {
        if ((payload as any)[k] < 0) throw new Error('Egg counts cannot be negative')
      }
      if (editing) {
        const { error } = await supabase.from('egg_opening_stock').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        // Add used to silently overwrite an existing flock's balance via
        // upsert — block it and point at Edit instead.
        const { data: existing } = await supabase.from('egg_opening_stock').select('id').eq('flock_id', form.flock_id).maybeSingle()
        if (existing) throw new Error('This flock already has an opening stock entry — edit that entry instead of adding a new one.')
        const { error } = await supabase.from('egg_opening_stock').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated' : 'Opening stock saved')
      qc.invalidateQueries({ queryKey: ['egg_opening_stock'] })
      setShowForm(false); setEditing(null)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('egg_opening_stock').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['egg_opening_stock'] }); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message)
  })

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => { const { error } = await supabase.from('egg_opening_stock').delete().in('id', ids); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['egg_opening_stock'] }); toast.success('Deleted'); setSel(new Set()) },
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
      'EggOpeningStock_Template.xlsx',
      ['flock_no', 'as_of_date', 'he_grade_a', 'he_grade_b', 'he_grade_c', 'je_eggs', 'te_eggs', 'be_eggs', 'le_eggs'],
      ['1', today().split('-').reverse().join('/'), '0', '0', '0', '0', '0', '0', '0']
    )
  }

  const exportRows = () => {
    const data = (stocks ?? []).map((r: any) => ({
      flock_no: r.flocks?.flock_no ?? '',
      as_of_date: fmtDate(r.as_of_date),
      he_grade_a: r.he_grade_a ?? 0, he_grade_b: r.he_grade_b ?? 0, he_grade_c: r.he_grade_c ?? 0,
      je_eggs: r.je_eggs ?? 0, te_eggs: r.te_eggs ?? 0, be_eggs: r.be_eggs ?? 0, le_eggs: r.le_eggs ?? 0,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Opening Stock')
    XLSX.writeFile(wb, `EggOpeningStock_${today()}.xlsx`)
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
          as_of_date: parseDMY(r[col('as_of_date')]) ?? today(),
          he_grade_a: parseInt(r[col('he_grade_a')]) || 0,
          he_grade_b: parseInt(r[col('he_grade_b')]) || 0,
          he_grade_c: parseInt(r[col('he_grade_c')]) || 0,
          je_eggs: parseInt(r[col('je_eggs')]) || 0,
          te_eggs: parseInt(r[col('te_eggs')]) || 0,
          be_eggs: parseInt(r[col('be_eggs')]) || 0,
          le_eggs: parseInt(r[col('le_eggs')]) || 0,
        }
      }).filter((r: any) => r.flock_id)
      if (!parsed.length) { toast.error('No rows matched a known flock'); return }
      // Dedupe by flock within the file (keep last) — one upsert batch
      // touching the same flock twice aborts the whole import in Postgres.
      const byFlock = new Map(parsed.map((r: any) => [r.flock_id, r]))
      const deduped = [...byFlock.values()]
      const collapsed = parsed.length - deduped.length
      const { error } = await supabase.from('egg_opening_stock').upsert(deduped, { onConflict: 'flock_id' })
      if (error) throw error
      toast.success(`Imported ${deduped.length} entries${collapsed ? ` (${collapsed} duplicate file-row(s) collapsed)` : ''}`)
      qc.invalidateQueries({ queryKey: ['egg_opening_stock'] })
    } catch (err: any) {
      toast.error('Import failed: ' + err.message)
    }
  }

  const rows_ = stocks ?? []
  const allSel = rows_.length > 0 && sel.size === rows_.length
  const someSel = sel.size > 0 && sel.size < rows_.length
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(allSel ? new Set() : new Set(rows_.map((r: any) => r.id)))

  const flockOptions = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no} (${f.status})` }))
  const N = (v: any) => v > 0 ? v.toLocaleString('en-IN') : '—'

  return (
    <div className="space-y-5">
      <SectionHeader title="Egg Opening Stock"
        subtitle="One-time opening balance per flock — enter stock on hand from Week 19 Day 1 before daily entries begin"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<FileDown size={15}/>} onClick={downloadTemplate}>Template</Button>
            <Button variant="secondary" icon={<Upload size={15}/>} onClick={() => fileRef.current?.click()}>Import</Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            {rows_.length > 0 && (
              <Button variant="secondary" icon={<Download size={15}/>} onClick={exportRows}>Export</Button>
            )}
            <Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Opening Stock</Button>
          </div>
        }
      />

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        Enter the egg stock balance for each flock as of the date production records start. This is used as the starting balance in the stock register running total.
      </div>

      {showForm && (
        <Card>
          <p className="font-semibold text-gray-700 mb-4">{editing ? 'Edit' : 'New'} Opening Stock Entry</p>
          <div className="space-y-4">
            <FormRow>
              <SearchableSelect label="Flock" required placeholder="— Select Flock —" options={flockOptions}
                value={form.flock_id} onChange={v => s('flock_id', v)} />
              <DateInput label="As of Date" required value={form.as_of_date} onChange={e => s('as_of_date', e.target.value)} />
            </FormRow>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">HE Eggs (Hatching)</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Grade A" type="number" value={form.he_grade_a} onChange={e => s('he_grade_a', e.target.value)} />
              <Input label="Grade B" type="number" value={form.he_grade_b} onChange={e => s('he_grade_b', e.target.value)} />
              <Input label="Grade C" type="number" value={form.he_grade_c} onChange={e => s('he_grade_c', e.target.value)} />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NHE Eggs</p>
            <div className="grid grid-cols-4 gap-3">
              <Input label="Jumbo (JE)" type="number" value={form.je_eggs} onChange={e => s('je_eggs', e.target.value)} />
              <Input label="Table (TE)" type="number" value={form.te_eggs} onChange={e => s('te_eggs', e.target.value)} />
              <Input label="Broken (BE)" type="number" value={form.be_eggs} onChange={e => s('be_eggs', e.target.value)} />
              <Input label="Leached (LE)" type="number" value={form.le_eggs} onChange={e => s('le_eggs', e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
              <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button>
            </div>
          </div>
        </Card>
      )}

      {sel.size > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-red-700">{sel.size} selected</span>
          <button onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
          <div className="ml-auto">
            <Button size="sm" variant="danger" loading={bulkDelMut.isPending}
              onClick={() => { if (confirm(`Delete ${sel.size} opening stock entries? This cannot be undone.`)) bulkDelMut.mutate([...sel]) }}>
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><CB checked={allSel} indeterminate={someSel} onChange={toggleAll} /></Th>
              <Th>Flock</Th><Th>As of Date</Th>
              <Th right>HE Gr A</Th><Th right>HE Gr B</Th><Th right>HE Gr C</Th>
              <Th right>JE</Th><Th right>TE</Th><Th right>BE</Th><Th right>LE</Th>
              <Th right>Total HE</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(stocks ?? []).map((r: any) => (
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id) ? 'bg-blue-50' : ''}`}>
                  <Td><CB checked={sel.has(r.id)} onChange={() => toggle(r.id)} /></Td>
                  <Td><Badge color="green">F-{r.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(r.as_of_date)}</Td>
                  <Td right className="text-xs text-emerald-600">{N(r.he_grade_a)}</Td>
                  <Td right className="text-xs text-yellow-600">{N(r.he_grade_b)}</Td>
                  <Td right className="text-xs text-orange-600">{N(r.he_grade_c)}</Td>
                  <Td right className="text-xs">{N(r.je_eggs)}</Td>
                  <Td right className="text-xs">{N(r.te_eggs)}</Td>
                  <Td right className="text-xs">{N(r.be_eggs)}</Td>
                  <Td right className="text-xs">{N(r.le_eggs)}</Td>
                  <Td right className="text-xs font-semibold">{N((r.he_grade_a||0)+(r.he_grade_b||0)+(r.he_grade_c||0))}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openForm(r)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil size={13}/></button>
                      <button onClick={() => { if (confirm('Delete opening stock?')) delMut.mutate(r.id) }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {(stocks ?? []).length === 0 && <EmptyState title="No opening stock entries" action={<Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Opening Stock</Button>} />}
        </Card>
      )}
    </div>
  )
}
