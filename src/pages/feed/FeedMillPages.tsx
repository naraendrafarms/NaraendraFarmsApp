import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import {
  Card, Button, Input, Modal,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState, StatCard
} from '@/components/ui'
import { Plus, Edit2, Trash2, Download, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

// ── helpers ───────────────────────────────────────────────────────
function exportCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

// Simple field wrapper used throughout this file
const Field: React.FC<{ label: string; children: React.ReactNode; half?: boolean }> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
)

// Native select styled to match the app
const Sel: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }> = ({ className='', children, placeholder, ...rest }) => (
  <select className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white ${className}`} {...rest}>
    {placeholder && <option value="">{placeholder}</option>}
    {children}
  </select>
)

const TABS = ['Formulas','Production','Stock','Expenses'] as const
type Tab = typeof TABS[number]

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export const FeedMillPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('Formulas')
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Feed Mill</h1>
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab===t ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Formulas'    && <FormulasTab />}
      {tab === 'Production'  && <ProductionTab />}
      {tab === 'Stock'       && <StockTab />}
      {tab === 'Expenses'    && <ExpensesTab />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// FORMULAS TAB
// ══════════════════════════════════════════════════════════════════
const FormulasTab: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [expanded, setExpanded] = useState<string|null>(null)
  const [editIngredient, setEditIngredient] = useState<any>(null)
  const [showAddIngredient, setShowAddIngredient] = useState<string|null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const { data: formulas = [], isLoading } = useQuery({
    queryKey: ['feed_formulas'],
    queryFn: async () => {
      const { data } = await supabase.from('feed_formulas').select('*').order('formula_code')
      return data ?? []
    }
  })

  const { data: ingredients = {} } = useQuery({
    queryKey: ['feed_formula_ingredients'],
    queryFn: async () => {
      const { data } = await supabase.from('feed_formula_ingredients').select('*').order('sort_order')
      if (!data) return {}
      const m: Record<string, any[]> = {}
      data.forEach(r => { if (!m[r.formula_id]) m[r.formula_id] = []; m[r.formula_id].push(r) })
      return m
    }
  })

  const saveMut = useMutation({
    mutationFn: async (d: any) => {
      if (d.id) {
        const { error } = await supabase.from('feed_formulas').update(d).eq('id', d.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('feed_formulas').insert(d)
        if (error) throw error
      }
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_formulas']}); setShowForm(false); setEditing(null); toast.success('Saved') }
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feed_formulas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_formulas']}); toast.success('Deleted') }
  })

  const saveIngMut = useMutation({
    mutationFn: async (d: any) => {
      if (d.id) {
        const { id, ...rest } = d
        const { error } = await supabase.from('feed_formula_ingredients').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('feed_formula_ingredients').insert(d)
        if (error) throw error
      }
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_formula_ingredients']}); setEditIngredient(null); setShowAddIngredient(null); toast.success('Saved') }
  })

  const delIngMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feed_formula_ingredients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_formula_ingredients']}); toast.success('Deleted') }
  })

  function handleExport() {
    const rows: (string|number|null|undefined)[][] = []
    formulas.forEach((f: any) => {
      const ings = ingredients[f.id] ?? []
      if (ings.length === 0) {
        rows.push([f.formula_code, f.formula_name, f.flock_type, f.age_week_from??'', f.age_week_to??'', f.version, '', '', '', '', ''])
      } else {
        ings.forEach((i: any) => rows.push([f.formula_code, f.formula_name, f.flock_type, f.age_week_from??'', f.age_week_to??'', f.version, i.ingredient_code??'', i.ingredient_name, i.percentage, i.kg_per_1000??'', i.sort_order]))
      }
    })
    exportCSV('feed_formulas.csv', ['formula_code','formula_name','flock_type','age_week_from','age_week_to','version','ingredient_code','ingredient_name','percentage','kg_per_1000','sort_order'], rows)
  }

  function handleTemplate() {
    exportCSV('feed_formula_template.csv', ['formula_code','formula_name','flock_type','age_week_from','age_week_to','version','ingredient_code','ingredient_name','percentage','kg_per_1000','sort_order'], [
      ['PS-NB','Starter (0-7th week)','Breeder',0,7,1,'11','MAIZE-12%Moisture',67.3,673.91,1]
    ])
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(Boolean)
    const headers = lines[0].split(',').map((h: string) => h.replace(/"/g,'').trim().toLowerCase())
    const col = (name: string) => headers.indexOf(name)
    let imported = 0
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map((v: string) => v.replace(/^"|"$/g,'').trim())
      const fc = vals[col('formula_code')]?.trim()
      if (!fc) continue
      let { data: fRows } = await supabase.from('feed_formulas').select('id').eq('formula_code', fc).limit(1)
      let fId = fRows?.[0]?.id
      if (!fId) {
        const { data: ins } = await supabase.from('feed_formulas').insert({
          formula_code: fc,
          formula_name: vals[col('formula_name')] || fc,
          flock_type: vals[col('flock_type')] || 'Breeder',
          age_week_from: vals[col('age_week_from')] ? Number(vals[col('age_week_from')]) : null,
          age_week_to: vals[col('age_week_to')] ? Number(vals[col('age_week_to')]) : null,
          version: vals[col('version')] ? Number(vals[col('version')]) : 1,
        }).select('id').single()
        fId = ins?.id
      }
      const ingName = vals[col('ingredient_name')]?.trim()
      if (!fId || !ingName) continue
      await supabase.from('feed_formula_ingredients').upsert({
        formula_id: fId,
        ingredient_code: vals[col('ingredient_code')] || null,
        ingredient_name: ingName,
        percentage: Number(vals[col('percentage')]) || 0,
        kg_per_1000: vals[col('kg_per_1000')] ? Number(vals[col('kg_per_1000')]) : null,
        sort_order: vals[col('sort_order')] ? Number(vals[col('sort_order')]) : 0,
      }, { onConflict: 'formula_id,ingredient_name', ignoreDuplicates: false })
      imported++
    }
    qc.invalidateQueries({queryKey:['feed_formulas']}); qc.invalidateQueries({queryKey:['feed_formula_ingredients']})
    toast.success(`Imported ${imported} ingredients`)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Feed Formulas" action={
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleTemplate}><Download size={14}/> Template</Button>
          <Button size="sm" variant="outline" onClick={() => importRef.current?.click()}><Upload size={14}/> Import CSV</Button>
          <Button size="sm" variant="outline" onClick={handleExport}><Download size={14}/> Export</Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={14}/> Add Formula</Button>
          <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </div>
      } />

      {isLoading ? <Spinner /> : formulas.length === 0 ? <EmptyState title="No formulas yet" /> : (
        <div className="space-y-3">
          {formulas.map((f: any) => {
            const ings = ingredients[f.id] ?? []
            const isOpen = expanded === f.id
            return (
              <Card key={f.id}>
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : f.id)}>
                  <div className="flex items-center gap-3 flex-wrap">
                    {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    <span className="font-semibold text-gray-800">{f.formula_code}</span>
                    <span className="text-gray-600 text-sm">{f.formula_name}</span>
                    <Badge color="blue">{f.flock_type}</Badge>
                    {f.age_week_from != null && <span className="text-xs text-gray-500">Week {f.age_week_from}–{f.age_week_to ?? '∞'}</span>}
                    <span className="text-xs text-gray-400">v{f.version} · {ings.length} ingredients</span>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => setShowAddIngredient(f.id)}><Plus size={13}/></Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(f); setShowForm(true) }}><Edit2 size={13}/></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete formula and all its ingredients?')) delMut.mutate(f.id) }}><Trash2 size={13} className="text-red-500"/></Button>
                  </div>
                </div>
                {isOpen && ings.length > 0 && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Code</th>
                          <th className="px-3 py-2 text-left">Ingredient</th>
                          <th className="px-3 py-2 text-right">%</th>
                          <th className="px-3 py-2 text-right">Kg/1000</th>
                          <th className="px-3 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ings.map((ing: any, idx: number) => (
                          <tr key={ing.id} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="px-3 py-1.5 text-gray-400">{idx+1}</td>
                            <td className="px-3 py-1.5 text-gray-500">{ing.ingredient_code}</td>
                            <td className="px-3 py-1.5 font-medium">{ing.ingredient_name}</td>
                            <td className="px-3 py-1.5 text-right">{Number(ing.percentage).toFixed(4)}</td>
                            <td className="px-3 py-1.5 text-right">{ing.kg_per_1000 != null ? Number(ing.kg_per_1000).toFixed(3) : ''}</td>
                            <td className="px-3 py-1.5 text-center">
                              <div className="flex gap-1 justify-center">
                                <button className="text-blue-500 hover:text-blue-700" onClick={() => setEditIngredient(ing)}><Edit2 size={12}/></button>
                                <button className="text-red-400 hover:text-red-600" onClick={() => { if (confirm('Delete ingredient?')) delIngMut.mutate(ing.id) }}><Trash2 size={12}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-green-50 font-semibold">
                          <td colSpan={3} className="px-3 py-1.5 text-right text-xs text-gray-600">Total</td>
                          <td className="px-3 py-1.5 text-right text-xs">{ings.reduce((s: number, i: any) => s+Number(i.percentage), 0).toFixed(4)}</td>
                          <td className="px-3 py-1.5 text-right text-xs">{ings.reduce((s: number, i: any) => s+Number(i.kg_per_1000??0), 0).toFixed(3)}</td>
                          <td/>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Formula' : 'Add Formula'} size="md">
        <FormulaForm initial={editing} onSave={(d: any) => saveMut.mutate(d)} loading={saveMut.isPending} />
      </Modal>
      <Modal open={!!showAddIngredient} onClose={() => setShowAddIngredient(null)} title="Add Ingredient" size="md">
        <IngredientForm formulaId={showAddIngredient!} initial={null} onSave={(d: any) => saveIngMut.mutate(d)} loading={saveIngMut.isPending} />
      </Modal>
      <Modal open={!!editIngredient} onClose={() => setEditIngredient(null)} title="Edit Ingredient" size="md">
        <IngredientForm formulaId={editIngredient?.formula_id} initial={editIngredient} onSave={(d: any) => saveIngMut.mutate(d)} loading={saveIngMut.isPending} />
      </Modal>
    </div>
  )
}

const FormulaForm: React.FC<{ initial: any; onSave: (d: any) => void; loading: boolean }> = ({ initial, onSave, loading }) => {
  const [form, setForm] = useState({ formula_code:'', formula_name:'', flock_type:'Breeder', age_week_from:'', age_week_to:'', version:'1', notes:'', is_active: true, ...initial })
  const s = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm((f: any) => ({...f, [k]: e.target.value}))
  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ ...form, age_week_from: form.age_week_from !== '' ? Number(form.age_week_from) : null, age_week_to: form.age_week_to !== '' ? Number(form.age_week_to) : null, version: Number(form.version) })
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Formula Code *"><Input value={form.formula_code} onChange={s('formula_code')} required /></Field>
        <Field label="Version"><Input type="number" value={form.version} onChange={s('version')} /></Field>
      </div>
      <Field label="Formula Name *"><Input value={form.formula_name} onChange={s('formula_name')} required /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Flock Type">
          <Sel value={form.flock_type} onChange={s('flock_type')}>
            <option>Breeder</option><option>Broiler</option><option>Layer</option>
          </Sel>
        </Field>
        <Field label="Week From"><Input type="number" step="0.1" value={form.age_week_from} onChange={s('age_week_from')} /></Field>
        <Field label="Week To"><Input type="number" step="0.1" value={form.age_week_to} onChange={s('age_week_to')} /></Field>
      </div>
      <Field label="Notes"><Input value={form.notes||''} onChange={s('notes')} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={loading}>Save Formula</Button>
      </div>
    </form>
  )
}

const IngredientForm: React.FC<{ formulaId: string; initial: any; onSave: (d: any) => void; loading: boolean }> = ({ formulaId, initial, onSave, loading }) => {
  const [form, setForm] = useState({ formula_id: formulaId, ingredient_code:'', ingredient_name:'', percentage:'0', kg_per_1000:'', sort_order:'0', ...initial })
  React.useEffect(() => { setForm((f: any) => ({...f, formula_id: formulaId})) }, [formulaId])
  const s = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({...f, [k]: e.target.value}))
  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ ...form, percentage: Number(form.percentage), kg_per_1000: form.kg_per_1000 !== '' ? Number(form.kg_per_1000) : null, sort_order: Number(form.sort_order) })
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Code"><Input value={form.ingredient_code||''} onChange={s('ingredient_code')} /></Field>
        <Field label="Sort Order"><Input type="number" value={form.sort_order} onChange={s('sort_order')} /></Field>
      </div>
      <Field label="Ingredient Name *"><Input value={form.ingredient_name} onChange={s('ingredient_name')} required /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Percentage %"><Input type="number" step="0.0001" value={form.percentage} onChange={s('percentage')} required /></Field>
        <Field label="Kg per 1000 Kg"><Input type="number" step="0.001" value={form.kg_per_1000||''} onChange={s('kg_per_1000')} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={loading}>Save Ingredient</Button>
      </div>
    </form>
  )
}

// ══════════════════════════════════════════════════════════════════
// PRODUCTION TAB
// ══════════════════════════════════════════════════════════════════
const ProductionTab: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [fFrom, setFFrom] = useState('')
  const [fTo,   setFTo]   = useState('')
  const [fFarm, setFFarm] = useState('')

  const { data: farms = [] } = useQuery({ queryKey:['farms'], queryFn: async () => { const {data} = await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name'); return data??[] }})
  const { data: formulas = [] } = useQuery({ queryKey:['feed_formulas'], queryFn: async () => { const {data} = await supabase.from('feed_formulas').select('id,formula_code,formula_name').eq('is_active',true).order('formula_code'); return data??[] }})
  const { data: allIngredients = {} } = useQuery({
    queryKey:['feed_formula_ingredients'],
    queryFn: async () => {
      const {data} = await supabase.from('feed_formula_ingredients').select('*').order('sort_order')
      if (!data) return {}
      const m: Record<string,any[]> = {}
      data.forEach((r: any) => { if(!m[r.formula_id]) m[r.formula_id]=[]; m[r.formula_id].push(r) })
      return m
    }
  })

  const { data: logs = [], isLoading } = useQuery({
    queryKey:['feed_production_log', fFrom, fTo, fFarm],
    queryFn: async () => {
      let q = supabase.from('feed_production_log')
        .select('*, feed_formulas(formula_code,formula_name), farms(name,code), feed_production_ingredients(*)')
        .order('production_date', {ascending:false})
      if (fFrom) q = q.gte('production_date', fFrom)
      if (fTo)   q = q.lte('production_date', fTo)
      if (fFarm) q = q.eq('farm_id', fFarm)
      const {data} = await q
      return data??[]
    }
  })

  const saveMut = useMutation({
    mutationFn: async (d: any) => {
      const { ingredients: ings, ...logData } = d
      if (logData.id) {
        const {error} = await supabase.from('feed_production_log').update(logData).eq('id', logData.id); if(error) throw error
        await supabase.from('feed_production_ingredients').delete().eq('production_id', logData.id)
      } else {
        const {data: inserted, error} = await supabase.from('feed_production_log').insert(logData).select('id').single(); if(error) throw error
        logData.id = inserted.id
      }
      if (ings?.length) {
        const rows = ings.map((i: any) => ({production_id: logData.id, ingredient_name: i.ingredient_name, quantity_kg: i.quantity_kg}))
        await supabase.from('feed_production_ingredients').insert(rows)
      }
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_production_log']}); setShowForm(false); setEditing(null); toast.success('Saved') }
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const {error} = await supabase.from('feed_production_log').delete().eq('id',id); if(error) throw error },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_production_log']}); toast.success('Deleted') }
  })

  function handleExport() {
    const rows: (string|number|null|undefined)[][] = []
    logs.forEach((l: any) => {
      const ings = l.feed_production_ingredients ?? []
      if (ings.length === 0) {
        rows.push([fmtDate(l.production_date), l.feed_formulas?.formula_code??'', l.feed_formulas?.formula_name??'', l.farms?.code??'', l.quantity_kg, '', '', l.remarks??''])
      } else {
        ings.forEach((i: any) => rows.push([fmtDate(l.production_date), l.feed_formulas?.formula_code??'', l.feed_formulas?.formula_name??'', l.farms?.code??'', l.quantity_kg, i.ingredient_name, i.quantity_kg, l.remarks??'']))
      }
    })
    exportCSV('feed_production.csv', ['date','formula_code','formula_name','farm','quantity_kg','ingredient_name','ingredient_kg','remarks'], rows)
  }

  const totalKg = logs.reduce((s: number, l: any) => s + Number(l.quantity_kg), 0)

  return (
    <div className="space-y-4">
      <SectionHeader title="Production Log" action={
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleExport}><Download size={14}/> Export</Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={14}/> Add Production</Button>
        </div>
      } />

      <Card>
        <div className="flex flex-wrap gap-3 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">From</span>
            <Input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} className="w-36 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">To</span>
            <Input type="date" value={fTo} onChange={e => setFTo(e.target.value)} className="w-36 text-sm" />
          </div>
          <Sel value={fFarm} onChange={e => setFFarm(e.target.value)} className="w-44 text-sm" placeholder="All Farms">
            {farms.map((f:any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Sel>
          <Button size="sm" variant="ghost" onClick={() => { setFFrom(''); setFTo(''); setFFarm('') }}>Clear</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard title="Total Production" value={`${totalKg.toLocaleString()} Kg`} />
        <StatCard title="Batches" value={String(logs.length)} />
      </div>

      {isLoading ? <Spinner /> : logs.length === 0 ? <EmptyState title="No production records" /> : (
        <Table>
          <thead><tr>
            <Th>Date</Th><Th>Formula</Th><Th>Farm</Th><Th>Qty (Kg)</Th><Th>Ingredients</Th><Th>Remarks</Th><Th>Actions</Th>
          </tr></thead>
          <tbody>
            {logs.map((l: any) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <Td>{fmtDate(l.production_date)}</Td>
                <Td><span className="font-medium">{l.feed_formulas?.formula_code}</span><br/><span className="text-xs text-gray-500">{l.feed_formulas?.formula_name}</span></Td>
                <Td>{l.farms?.code ?? l.farms?.name ?? '—'}</Td>
                <Td className="font-semibold">{Number(l.quantity_kg).toLocaleString()}</Td>
                <Td className="text-xs text-gray-500">{(l.feed_production_ingredients??[]).length} items</Td>
                <Td className="text-xs">{l.remarks}</Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(l); setShowForm(true) }}><Edit2 size={13}/></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if(confirm('Delete?')) delMut.mutate(l.id) }}><Trash2 size={13} className="text-red-500"/></Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Production' : 'Add Production'} size="lg">
        <ProductionForm
          initial={editing}
          farms={farms}
          formulas={formulas}
          allIngredients={allIngredients}
          onSave={(d: any) => saveMut.mutate(d)}
          loading={saveMut.isPending}
        />
      </Modal>
    </div>
  )
}

const ProductionForm: React.FC<{
  initial: any; farms: any[]; formulas: any[]; allIngredients: Record<string,any[]>;
  onSave: (d: any) => void; loading: boolean
}> = ({ initial, farms, formulas, allIngredients, onSave, loading }) => {
  const existingIngs = initial?.feed_production_ingredients ?? []
  const [form, setForm] = useState({
    id: initial?.id ?? undefined,
    production_date: initial?.production_date ?? today(),
    formula_id: initial?.formula_id ?? '',
    farm_id: initial?.farm_id ?? '',
    quantity_kg: initial?.quantity_kg ?? '',
    remarks: initial?.remarks ?? '',
  })
  const [ings, setIngs] = useState<{ingredient_name:string; quantity_kg:string}[]>(
    existingIngs.map((i:any) => ({ingredient_name:i.ingredient_name, quantity_kg: String(i.quantity_kg)}))
  )

  function handleFormulaChange(formulaId: string) {
    setForm((f: any) => ({...f, formula_id: formulaId}))
    if (!formulaId) { setIngs([]); return }
    const fIngs = allIngredients[formulaId] ?? []
    setIngs(fIngs.map((i: any) => ({ ingredient_name: i.ingredient_name, quantity_kg: '' })))
  }

  function recalcKg(qty: string) {
    setForm((f: any) => ({...f, quantity_kg: qty}))
    if (!qty || !form.formula_id) return
    const qtyNum = Number(qty)
    const fIngs = allIngredients[form.formula_id] ?? []
    setIngs(fIngs.map((i: any) => ({
      ingredient_name: i.ingredient_name,
      quantity_kg: i.kg_per_1000 != null ? String(+(i.kg_per_1000 * qtyNum / 1000).toFixed(3)) : ''
    })))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      ...form,
      quantity_kg: Number(form.quantity_kg),
      farm_id: form.farm_id || null,
      formula_id: form.formula_id || null,
      ingredients: ings.filter(i => i.ingredient_name && i.quantity_kg).map(i => ({ ingredient_name: i.ingredient_name, quantity_kg: Number(i.quantity_kg) }))
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date *"><Input type="date" value={form.production_date} onChange={e => setForm((f:any) => ({...f,production_date:e.target.value}))} required /></Field>
        <Field label="Farm">
          <Sel value={form.farm_id} onChange={e => setForm((f:any) => ({...f,farm_id:e.target.value}))} placeholder="Select Farm">
            {farms.map((f:any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Sel>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Formula">
          <Sel value={form.formula_id} onChange={e => handleFormulaChange(e.target.value)} placeholder="Select Formula">
            {formulas.map((f:any) => <option key={f.id} value={f.id}>{f.formula_code} – {f.formula_name}</option>)}
          </Sel>
        </Field>
        <Field label="Quantity (Kg) *">
          <Input type="number" step="0.001" value={form.quantity_kg} onChange={e => recalcKg(e.target.value)} required />
        </Field>
      </div>
      <Field label="Remarks"><Input value={form.remarks} onChange={e => setForm((f:any) => ({...f,remarks:e.target.value}))} /></Field>

      {ings.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Ingredients Consumed (auto-calculated, editable)</p>
          <div className="border rounded overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr><th className="px-2 py-1.5 text-left">Ingredient</th><th className="px-2 py-1.5 text-right w-28">Kg</th></tr>
              </thead>
              <tbody>
                {ings.map((ing, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="px-2 py-1">{ing.ingredient_name}</td>
                    <td className="px-2 py-1">
                      <input type="number" step="0.001" className="w-full text-right border border-gray-200 rounded px-1 py-0.5 text-xs"
                        value={ing.quantity_kg}
                        onChange={e => setIngs(prev => prev.map((x,i) => i===idx ? {...x,quantity_kg:e.target.value} : x))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={loading}>Save Production</Button>
      </div>
    </form>
  )
}

// ══════════════════════════════════════════════════════════════════
// STOCK TAB
// ══════════════════════════════════════════════════════════════════
const StockTab: React.FC = () => {
  const [fFarm, setFFarm] = useState('')
  const [fFrom, setFFrom] = useState('')
  const [fTo,   setFTo]   = useState('')

  const { data: farms = [] } = useQuery({ queryKey:['farms'], queryFn: async () => { const {data} = await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name'); return data??[] }})

  const { data: grnData = [], isLoading: grnLoading } = useQuery({
    queryKey: ['stock_grn', fFarm, fFrom, fTo],
    queryFn: async () => {
      let q = supabase.from('grn').select('feed_ingredients(name,code), quantity_kg, grn_date, farm_id')
      if (fFarm) q = q.eq('farm_id', fFarm)
      if (fFrom) q = q.gte('grn_date', fFrom)
      if (fTo)   q = q.lte('grn_date', fTo)
      const {data} = await q
      return data ?? []
    }
  })

  const { data: prodData = [], isLoading: prodLoading } = useQuery({
    queryKey: ['stock_prod', fFarm, fFrom, fTo],
    queryFn: async () => {
      let q = supabase.from('feed_production_log')
        .select('feed_production_ingredients(ingredient_name, quantity_kg), production_date, farm_id')
      if (fFarm) q = q.eq('farm_id', fFarm)
      if (fFrom) q = q.gte('production_date', fFrom)
      if (fTo)   q = q.lte('production_date', fTo)
      const {data} = await q
      return data ?? []
    }
  })

  const stockMap: Record<string, { code?:string; received: number; consumed: number }> = {}

  grnData.forEach((g: any) => {
    const name = (g.feed_ingredients as any)?.name ?? 'Unknown'
    const code = (g.feed_ingredients as any)?.code
    if (!stockMap[name]) stockMap[name] = { code, received: 0, consumed: 0 }
    stockMap[name].received += Number(g.quantity_kg ?? 0)
  })

  prodData.forEach((p: any) => {
    ((p.feed_production_ingredients as any[]) ?? []).forEach((i: any) => {
      const name = i.ingredient_name
      if (!stockMap[name]) stockMap[name] = { received: 0, consumed: 0 }
      stockMap[name].consumed += Number(i.quantity_kg ?? 0)
    })
  })

  const stockRows = Object.entries(stockMap)
    .map(([name, v]) => ({ name, code: v.code, received: v.received, consumed: v.consumed, balance: v.received - v.consumed }))
    .sort((a, b) => a.name.localeCompare(b.name))

  function handleExport() {
    exportCSV('feed_stock.csv', ['ingredient_code','ingredient_name','received_kg','consumed_kg','balance_kg'],
      stockRows.map(r => [r.code??'', r.name, r.received, r.consumed, r.balance]))
  }

  const isLoading = grnLoading || prodLoading
  const lowStock = stockRows.filter(r => r.balance < 0).length

  return (
    <div className="space-y-4">
      <SectionHeader title="Stock Status (GRN In – Production Out)" action={
        <Button size="sm" variant="outline" onClick={handleExport}><Download size={14}/> Export</Button>
      } />

      <Card>
        <div className="flex flex-wrap gap-3 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">From</span>
            <Input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} className="w-36 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">To</span>
            <Input type="date" value={fTo} onChange={e => setFTo(e.target.value)} className="w-36 text-sm" />
          </div>
          <Sel value={fFarm} onChange={e => setFFarm(e.target.value)} className="w-44 text-sm" placeholder="All Farms">
            {farms.map((f:any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Sel>
          <Button size="sm" variant="ghost" onClick={() => { setFFrom(''); setFTo(''); setFFarm('') }}>Clear</Button>
        </div>
      </Card>

      {lowStock > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          ⚠️ {lowStock} ingredient(s) have negative balance in selected period
        </div>
      )}

      {isLoading ? <Spinner /> : stockRows.length === 0 ? <EmptyState title="No data in selected period" /> : (
        <Table>
          <thead><tr>
            <Th>Code</Th><Th>Ingredient</Th>
            <Th className="text-right">Received (Kg)</Th>
            <Th className="text-right">Consumed (Kg)</Th>
            <Th className="text-right">Balance (Kg)</Th>
          </tr></thead>
          <tbody>
            {stockRows.map(r => (
              <tr key={r.name} className={`hover:bg-gray-50 ${r.balance < 0 ? 'bg-red-50' : ''}`}>
                <Td className="text-gray-500 text-xs">{r.code}</Td>
                <Td className="font-medium">{r.name}</Td>
                <Td className="text-right">{r.received.toLocaleString('en-IN', {maximumFractionDigits:3})}</Td>
                <Td className="text-right text-orange-700">{r.consumed.toLocaleString('en-IN', {maximumFractionDigits:3})}</Td>
                <Td className={`text-right font-semibold ${r.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {r.balance.toLocaleString('en-IN', {maximumFractionDigits:3})}
                </Td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold text-sm">
              <Td colSpan={2}>Total</Td>
              <Td className="text-right">{stockRows.reduce((s,r)=>s+r.received,0).toLocaleString('en-IN',{maximumFractionDigits:3})}</Td>
              <Td className="text-right text-orange-700">{stockRows.reduce((s,r)=>s+r.consumed,0).toLocaleString('en-IN',{maximumFractionDigits:3})}</Td>
              <Td className="text-right text-green-700">{stockRows.reduce((s,r)=>s+r.balance,0).toLocaleString('en-IN',{maximumFractionDigits:3})}</Td>
            </tr>
          </tbody>
        </Table>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// EXPENSES TAB
// ══════════════════════════════════════════════════════════════════
const EXPENSE_CATEGORIES = ['Labour','Oral Medicine','Electricity','Fuel','Maintenance','Packaging','Transport','Other']

const ExpensesTab: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [fCat,  setFCat]  = useState('')
  const [fFrom, setFFrom] = useState('')
  const [fTo,   setFTo]   = useState('')
  const [fFarm, setFFarm] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const { data: farms = [] } = useQuery({ queryKey:['farms'], queryFn: async () => { const {data} = await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name'); return data??[] }})

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['feedmill_expenses', fCat, fFrom, fTo, fFarm],
    queryFn: async () => {
      let q = supabase.from('feedmill_expenses').select('*, farms(name,code)').order('expense_date', {ascending:false})
      if (fCat)  q = q.eq('category', fCat)
      if (fFarm) q = q.eq('farm_id', fFarm)
      if (fFrom) q = q.gte('expense_date', fFrom)
      if (fTo)   q = q.lte('expense_date', fTo)
      const {data} = await q; return data??[]
    }
  })

  const saveMut = useMutation({
    mutationFn: async (d: any) => {
      if (d.id) { const {error} = await supabase.from('feedmill_expenses').update(d).eq('id',d.id); if(error) throw error }
      else { const {error} = await supabase.from('feedmill_expenses').insert(d); if(error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feedmill_expenses']}); setShowForm(false); setEditing(null); toast.success('Saved') }
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const {error} = await supabase.from('feedmill_expenses').delete().eq('id',id); if(error) throw error },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feedmill_expenses']}); toast.success('Deleted') }
  })

  function handleExport() {
    exportCSV('feedmill_expenses.csv',
      ['date','category','farm','description','amount','vendor','invoice','remarks'],
      expenses.map((e:any) => [fmtDate(e.expense_date), e.category, (e.farms as any)?.code??'', e.description??'', e.amount, e.vendor_name??'', e.invoice_no??'', e.remarks??'']))
  }

  function handleTemplate() {
    exportCSV('feedmill_expenses_template.csv',
      ['date','category','farm_code','description','amount','vendor_name','invoice_no','remarks'],
      [['2026-01-01','Labour','NF1','Daily labour',5000,'','','']])
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if(!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(Boolean)
    const headers = lines[0].split(',').map((h: string) => h.replace(/"/g,'').trim().toLowerCase())
    const col = (n:string) => headers.indexOf(n)
    let count = 0
    for (let i = 1; i < lines.length; i++) {
      const v = lines[i].split(',').map((x: string) => x.replace(/^"|"$/g,'').trim())
      const farmCode = v[col('farm_code')]?.trim()
      let farmId: string|null = null
      if (farmCode) {
        const {data} = await supabase.from('farms').select('id').eq('code', farmCode).limit(1)
        farmId = data?.[0]?.id ?? null
      }
      await supabase.from('feedmill_expenses').insert({
        expense_date: v[col('date')],
        category: v[col('category')] || 'Other',
        farm_id: farmId,
        description: v[col('description')] || null,
        amount: Number(v[col('amount')]) || 0,
        vendor_name: v[col('vendor_name')] || null,
        invoice_no: v[col('invoice_no')] || null,
        remarks: v[col('remarks')] || null,
      })
      count++
    }
    qc.invalidateQueries({queryKey:['feedmill_expenses']}); toast.success(`Imported ${count} records`); e.target.value = ''
  }

  const totalAmt = expenses.reduce((s:number, e:any) => s + Number(e.amount), 0)
  const byCat: Record<string,number> = {}
  expenses.forEach((e:any) => { byCat[e.category] = (byCat[e.category]??0) + Number(e.amount) })

  return (
    <div className="space-y-4">
      <SectionHeader title="Feed Mill Expenses" action={
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleTemplate}><Download size={14}/> Template</Button>
          <Button size="sm" variant="outline" onClick={() => importRef.current?.click()}><Upload size={14}/> Import CSV</Button>
          <Button size="sm" variant="outline" onClick={handleExport}><Download size={14}/> Export</Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={14}/> Add Expense</Button>
          <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </div>
      } />

      <Card>
        <div className="flex flex-wrap gap-3 p-3">
          <Sel value={fCat} onChange={e => setFCat(e.target.value)} className="w-40 text-sm" placeholder="All Categories">
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Sel>
          <Sel value={fFarm} onChange={e => setFFarm(e.target.value)} className="w-44 text-sm" placeholder="All Farms">
            {farms.map((f:any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Sel>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">From</span>
            <Input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} className="w-36 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">To</span>
            <Input type="date" value={fTo} onChange={e => setFTo(e.target.value)} className="w-36 text-sm" />
          </div>
          <Button size="sm" variant="ghost" onClick={() => { setFCat(''); setFFrom(''); setFTo(''); setFFarm('') }}>Clear</Button>
        </div>
      </Card>

      {Object.keys(byCat).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(byCat).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
            <StatCard key={cat} title={cat} value={inr(amt)} />
          ))}
        </div>
      )}

      <div className="text-sm font-semibold text-gray-700 px-1">Total: {inr(totalAmt)}</div>

      {isLoading ? <Spinner /> : expenses.length === 0 ? <EmptyState title="No expenses" /> : (
        <Table>
          <thead><tr><Th>Date</Th><Th>Category</Th><Th>Farm</Th><Th>Description</Th><Th>Vendor</Th><Th>Invoice</Th><Th className="text-right">Amount</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {expenses.map((e: any) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <Td>{fmtDate(e.expense_date)}</Td>
                <Td><Badge color="gray">{e.category}</Badge></Td>
                <Td>{(e.farms as any)?.code ?? '—'}</Td>
                <Td>{e.description}</Td>
                <Td className="text-sm">{e.vendor_name}</Td>
                <Td className="text-sm">{e.invoice_no}</Td>
                <Td className="text-right font-semibold">{inr(e.amount)}</Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(e); setShowForm(true) }}><Edit2 size={13}/></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if(confirm('Delete?')) delMut.mutate(e.id) }}><Trash2 size={13} className="text-red-500"/></Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Expense' : 'Add Expense'} size="md">
        <ExpenseForm initial={editing} farms={farms} onSave={(d: any) => saveMut.mutate(d)} loading={saveMut.isPending} />
      </Modal>
    </div>
  )
}

const ExpenseForm: React.FC<{ initial: any; farms: any[]; onSave: (d:any) => void; loading: boolean }> = ({ initial, farms, onSave, loading }) => {
  const [form, setForm] = useState({
    expense_date: today(), category:'Other', description:'', amount:'', vendor_name:'', invoice_no:'', remarks:'',
    ...initial, farm_id: initial?.farm_id ?? ''
  })
  const s = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm((f: any) => ({...f, [k]: e.target.value}))
  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ ...form, amount: Number(form.amount), farm_id: form.farm_id || null })
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date *"><Input type="date" value={form.expense_date} onChange={s('expense_date')} required /></Field>
        <Field label="Category">
          <Sel value={form.category} onChange={s('category')}>
            {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Sel>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Farm">
          <Sel value={form.farm_id} onChange={s('farm_id')} placeholder="Select Farm">
            {farms.map((f:any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Sel>
        </Field>
        <Field label="Amount *"><Input type="number" step="0.01" value={form.amount} onChange={s('amount')} required /></Field>
      </div>
      <Field label="Description"><Input value={form.description||''} onChange={s('description')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Vendor Name"><Input value={form.vendor_name||''} onChange={s('vendor_name')} /></Field>
        <Field label="Invoice No"><Input value={form.invoice_no||''} onChange={s('invoice_no')} /></Field>
      </div>
      <Field label="Remarks"><Input value={form.remarks||''} onChange={s('remarks')} /></Field>
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>Save Expense</Button>
      </div>
    </form>
  )
}
