import React, { useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FeedTransfer } from '@/pages/feed/FeedPages'
import { StockPage } from '@/pages/feed/StockPage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { parseFile } from '@/lib/parseFile'
import {
  Card, Button, Input, Modal,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState, StatCard
, DateInput } from '@/components/ui'
import { Plus, Edit2, Trash2, Download, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

// ── helpers ───────────────────────────────────────────────────────
function exportCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

function exportXlsx(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = headers.map(h => ({ wch: Math.max(String(h).length + 2, 14) }))
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.writeFile(wb, filename)
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

type Tab = 'Raw Materials Stock' | 'Production' | 'Finished Feed Stock' | 'Stock Dispatch' | 'Formulas' | 'Raw Material Adj.' | 'Expenses' | 'Flock Allocation'

// ══════════════════════════════════════════════════════════════════
// FINISHED FEED STOCK TAB
// ══════════════════════════════════════════════════════════════════
const FinishedFeedStockTab: React.FC = () => {
  const { data: feedTypes = [] } = useQuery({
    queryKey: ['feed_types'],
    queryFn: async () => { const { data } = await supabase.from('feed_types').select('id,code,name').eq('is_active',true).order('sort_order'); return data ?? [] }
  })
  const { data: productions = [] } = useQuery({
    queryKey: ['feed_production'],
    queryFn: async () => { const { data } = await supabase.from('feed_production').select('feed_type_id,quantity_kg'); return data ?? [] }
  })
  const { data: dispatches = [] } = useQuery({
    queryKey: ['feed_transfers'],
    queryFn: async () => { const { data } = await supabase.from('feed_transfers').select('feed_type_id,quantity_kg'); return data ?? [] }
  })

  const rows = (feedTypes as any[]).map((ft: any) => {
    const produced   = (productions as any[]).filter((p: any) => p.feed_type_id === ft.id).reduce((s: number, p: any) => s + (p.quantity_kg ?? 0), 0)
    const dispatched = (dispatches  as any[]).filter((d: any) => d.feed_type_id === ft.id).reduce((s: number, d: any) => s + (d.quantity_kg ?? 0), 0)
    return { ...ft, produced, dispatched, balance: produced - dispatched }
  }).filter((r: any) => r.produced > 0 || r.dispatched > 0)

  const totalProd = rows.reduce((s, r) => s + r.produced, 0)
  const totalDisp = rows.reduce((s, r) => s + r.dispatched, 0)
  const totalBal  = rows.reduce((s, r) => s + r.balance, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="!p-4"><p className="text-xs text-gray-500">Total Produced</p><p className="text-xl font-bold text-brand-700 mt-1">{(totalProd/1000).toFixed(2)} MT</p><p className="text-xs text-gray-400">{totalProd.toLocaleString('en-IN')} kg</p></Card>
        <Card className="!p-4"><p className="text-xs text-gray-500">Total Dispatched</p><p className="text-xl font-bold text-blue-700 mt-1">{(totalDisp/1000).toFixed(2)} MT</p><p className="text-xs text-gray-400">{totalDisp.toLocaleString('en-IN')} kg</p></Card>
        <Card className="!p-4"><p className="text-xs text-gray-500">Balance in Stock</p><p className={`text-xl font-bold mt-1 ${totalBal < 0 ? 'text-red-600' : 'text-green-700'}`}>{(totalBal/1000).toFixed(2)} MT</p><p className="text-xs text-gray-400">{totalBal.toLocaleString('en-IN')} kg</p></Card>
      </div>
      <Card padding={false}>
        <Table>
          <thead><tr>
            <Th>Feed Type</Th>
            <Th right>Produced (kg)</Th>
            <Th right>Dispatched to Farms (kg)</Th>
            <Th right>Balance (kg)</Th>
          </tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <Td><Badge color="blue">{r.code}</Badge><span className="text-sm ml-2">{r.name}</span></Td>
                <Td right>{r.produced.toLocaleString('en-IN')}</Td>
                <Td right className="text-blue-600">{r.dispatched.toLocaleString('en-IN')}</Td>
                <Td right className={r.balance < 0 ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}>{r.balance.toLocaleString('en-IN')}</Td>
              </tr>
            ))}
          </tbody>
          {rows.length > 1 && (
            <tfoot><tr className="bg-gray-50 font-semibold">
              <Td>TOTAL</Td>
              <Td right>{totalProd.toLocaleString('en-IN')}</Td>
              <Td right className="text-blue-600">{totalDisp.toLocaleString('en-IN')}</Td>
              <Td right className={totalBal < 0 ? 'text-red-600' : 'text-green-700'}>{totalBal.toLocaleString('en-IN')}</Td>
            </tr></tfoot>
          )}
        </Table>
        {rows.length === 0 && <EmptyState title="No production records yet" />}
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export const FeedMillPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const urlTab = searchParams.get('tab')
  const initialTab: Tab =
    urlTab === 'production' ? 'Production' :
    urlTab === 'finished'   ? 'Finished Feed Stock' :
    urlTab === 'dispatch'   ? 'Stock Dispatch' :
    urlTab === 'formulas'   ? 'Formulas' : 'Raw Materials Stock'
  const [tab, setTab] = useState<Tab>(initialTab)

  const mainTabs: Tab[] = ['Raw Materials Stock', 'Production', 'Finished Feed Stock', 'Stock Dispatch']
  const moreTabs: Tab[] = ['Formulas', 'Raw Material Adj.', 'Expenses', 'Flock Allocation']

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Feed Mill</h1>
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {mainTabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${tab===t ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
        <div className="w-px bg-gray-200 mx-1" />
        {moreTabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${tab===t ? 'border-b-2 border-gray-500 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Raw Materials Stock' && <StockPage feedOnly />}
      {tab === 'Production'          && <ProductionTab />}
      {tab === 'Finished Feed Stock' && <FinishedFeedStockTab />}
      {tab === 'Stock Dispatch'      && <FeedTransfer />}
      {tab === 'Formulas'            && <FormulasTab />}
      {tab === 'Raw Material Adj.'   && <StockTab />}
      {tab === 'Expenses'            && <ExpensesTab />}
      {tab === 'Flock Allocation'    && <FlockAllocationTab />}
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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [fSearch, setFSearch] = useState('')
  const [fType, setFType] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const { data: feedTypes = [] } = useQuery({
    queryKey: ['feed_types'],
    queryFn: async () => { const { data } = await supabase.from('feed_types').select('id,code,name,category').eq('is_active', true).order('sort_order'); return data ?? [] }
  })

  const { data: formulas = [], isLoading } = useQuery({
    queryKey: ['feed_formulas'],
    queryFn: async () => {
      const { data } = await supabase.from('feed_formulas').select('*, feed_types(id,code,name)').order('formula_code')
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

  // filtered list
  const filtered = formulas.filter((f: any) => {
    const q = fSearch.toLowerCase()
    const matchQ = !q || f.formula_code?.toLowerCase().includes(q) || f.formula_name?.toLowerCase().includes(q)
    const matchT = !fType || f.feed_type_id === fType
    return matchQ && matchT
  })

  const allChecked = filtered.length > 0 && filtered.every((f: any) => selected.has(f.id))
  const toggleAll = () => {
    if (allChecked) setSelected(new Set())
    else setSelected(new Set(filtered.map((f: any) => f.id)))
  }
  const toggleOne = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const saveMut = useMutation({
    mutationFn: async (d: any) => {
      const { ingredients: ings, ...fData } = d
      let fId = fData.id
      if (fId) {
        const { error } = await supabase.from('feed_formulas').update(fData).eq('id', fId)
        if (error) throw error
      } else {
        const { data: ins, error } = await supabase.from('feed_formulas').insert(fData).select('id').single()
        if (error) throw error
        fId = ins.id
      }
      // save ingredients if provided inline
      if (ings) {
        await supabase.from('feed_formula_ingredients').delete().eq('formula_id', fId)
        const rows = ings.filter((i: any) => i.ingredient_name?.trim()).map((i: any, idx: number) => ({
          formula_id: fId, ingredient_name: i.ingredient_name.trim(),
          ingredient_code: i.ingredient_code || null,
          percentage: Number(i.percentage) || 0,
          kg_per_1000: i.kg_per_1000 !== '' ? Number(i.kg_per_1000) : null,
          sort_order: idx + 1,
        }))
        if (rows.length) { const { error } = await supabase.from('feed_formula_ingredients').insert(rows); if (error) throw error }
      }
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_formulas']}); qc.invalidateQueries({queryKey:['feed_formula_ingredients']}); setShowForm(false); setEditing(null); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feed_formulas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_formulas']}); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('feed_formulas').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_formulas']}); qc.invalidateQueries({queryKey:['feed_formula_ingredients']}); setSelected(new Set()); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
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
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_formula_ingredients']}); setEditIngredient(null); setShowAddIngredient(null); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const delIngMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feed_formula_ingredients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_formula_ingredients']}); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
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
    exportXlsx('feed_formulas.xlsx', ['formula_code','formula_name','flock_type','age_week_from','age_week_to','version','ingredient_code','ingredient_name','percentage','kg_per_1000','sort_order'], rows)
  }

  function handleTemplate() {
    exportXlsx('feed_formula_template.xlsx', ['formula_code','formula_name','flock_type','age_week_from','age_week_to','version','ingredient_code','ingredient_name','percentage','kg_per_1000','sort_order'], [
      ['PS-NB','Starter (0-7th week)','Breeder',0,7,1,'11','MAIZE-12%Moisture',67.3,673.91,1]
    ])
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const { headers, rows } = await parseFile(file)
    const col = (name: string) => headers.indexOf(name)
    let imported = 0
    for (const vals of rows) {
      const fc = vals[col('formula_code')]?.trim()
      if (!fc) continue
      let { data: fRows } = await supabase.from('feed_formulas').select('id').eq('formula_code', fc).limit(1)
      let fId = fRows?.[0]?.id
      if (!fId) {
        const { data: ins } = await supabase.from('feed_formulas').insert({
          formula_code: fc, formula_name: vals[col('formula_name')] || fc,
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
        formula_id: fId, ingredient_code: vals[col('ingredient_code')] || null,
        ingredient_name: ingName, percentage: Number(vals[col('percentage')]) || 0,
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
          <Button size="sm" variant="outline" onClick={() => importRef.current?.click()}><Upload size={14}/> Import</Button>
          <Button size="sm" variant="outline" onClick={handleExport}><Download size={14}/> Export</Button>
          {selected.size > 0 && <Button size="sm" variant="outline" loading={bulkDelMut.isPending} onClick={() => { if(confirm(`Delete ${selected.size} formula(s)?`)) bulkDelMut.mutate(Array.from(selected)) }} className="text-red-600 border-red-300"><Trash2 size={14}/> Delete ({selected.size})</Button>}
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={14}/> Add Formula</Button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
        </div>
      } />

      {/* Filter bar */}
      <Card>
        <div className="flex flex-wrap gap-3 p-3 items-center">
          <Input placeholder="Search code or name…" value={fSearch} onChange={e => setFSearch(e.target.value)} className="w-48 text-sm" />
          <Sel value={fType} onChange={e => setFType(e.target.value)} className="w-48 text-sm" placeholder="All Feed Types">
            {feedTypes.map((ft: any) => <option key={ft.id} value={ft.id}>{ft.code} — {ft.name}</option>)}
          </Sel>
          {(fSearch || fType) && <Button size="sm" variant="ghost" onClick={() => { setFSearch(''); setFType('') }}>Clear</Button>}
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} formula(s)</span>
        </div>
      </Card>

      {isLoading ? <Spinner /> : filtered.length === 0 ? <EmptyState title="No formulas found" /> : (
        <div className="space-y-3">
          {/* Select all row */}
          <div className="flex items-center gap-2 px-1">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 rounded accent-green-600 cursor-pointer" />
            <span className="text-xs text-gray-500">Select all ({filtered.length})</span>
          </div>
          {filtered.map((f: any) => {
            const ings = ingredients[f.id] ?? []
            const isOpen = expanded === f.id
            return (
              <Card key={f.id}>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 flex-wrap flex-1 cursor-pointer" onClick={() => setExpanded(isOpen ? null : f.id)}>
                    <input type="checkbox" checked={selected.has(f.id)} onClick={e => e.stopPropagation()} onChange={() => toggleOne(f.id)} className="w-4 h-4 rounded accent-green-600 cursor-pointer" />
                    {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    <span className="font-semibold text-gray-800">{f.formula_code}</span>
                    <span className="text-gray-600 text-sm">{f.formula_name}</span>
                    <Badge color="blue">{f.flock_type}</Badge>
                    {f.feed_types && <Badge color="green">{(f.feed_types as any).code}</Badge>}
                    {f.age_week_from != null && <span className="text-xs text-gray-500">Week {f.age_week_from}–{f.age_week_to ?? '∞'}</span>}
                    <span className="text-xs text-gray-400">v{f.version} · {ings.length} ingredients</span>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="outline" title="Add ingredient" onClick={() => setShowAddIngredient(f.id)}><Plus size={13}/></Button>
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

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Formula' : 'Add Formula'} size="lg">
        <FormulaForm initial={editing} existingIngs={editing ? ingredients[editing.id] : undefined} feedTypes={feedTypes} onSave={(d: any) => saveMut.mutate(d)} loading={saveMut.isPending} />
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

const BLANK_ING = { ingredient_code: '', ingredient_name: '', percentage: '', kg_per_1000: '' }

const FormulaForm: React.FC<{ initial: any; existingIngs?: any[]; feedTypes?: any[]; onSave: (d: any) => void; loading: boolean }> = ({ initial, existingIngs, feedTypes = [], onSave, loading }) => {
  const [form, setForm] = useState({ formula_code:'', formula_name:'', flock_type:'Breeder', age_week_from:'', age_week_to:'', version:'1', notes:'', is_active: true, ...initial, feed_type_id: initial?.feed_type_id ?? '' })
  const [ings, setIngs] = useState<typeof BLANK_ING[]>(
    existingIngs?.length ? existingIngs.map(i => ({ ingredient_code: i.ingredient_code||'', ingredient_name: i.ingredient_name, percentage: String(i.percentage), kg_per_1000: i.kg_per_1000 != null ? String(i.kg_per_1000) : '' }))
    : [{ ...BLANK_ING }]
  )
  const s = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm((f: any) => ({...f, [k]: e.target.value}))

  const handleFeedTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ftId = e.target.value
    const ft = feedTypes.find((x: any) => x.id === ftId)
    const name = ft?.name?.toLowerCase() ?? ''
    const flock_type = name.includes('broiler') ? 'Broiler' : name.includes('layer') ? 'Layer' : 'Breeder'
    setForm((f: any) => ({ ...f, feed_type_id: ftId, flock_type }))
  }
  const si = (idx: number, k: keyof typeof BLANK_ING) => (e: React.ChangeEvent<HTMLInputElement>) => setIngs(prev => prev.map((r, i) => i === idx ? {...r, [k]: e.target.value} : r))
  const addRow = () => setIngs(prev => [...prev, { ...BLANK_ING }])
  const removeRow = (idx: number) => setIngs(prev => prev.filter((_, i) => i !== idx))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      ...form,
      age_week_from: form.age_week_from !== '' ? Number(form.age_week_from) : null,
      age_week_to: form.age_week_to !== '' ? Number(form.age_week_to) : null,
      version: Number(form.version),
      feed_type_id: form.feed_type_id || null,
      ingredients: ings,
    })
  }
  const totalPct = ings.reduce((s, i) => s + (Number(i.percentage) || 0), 0)

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Formula Code *"><Input value={form.formula_code} onChange={s('formula_code')} required /></Field>
        <Field label="Version"><Input type="number" value={form.version} onChange={s('version')} /></Field>
      </div>
      <Field label="Formula Name *"><Input value={form.formula_name} onChange={s('formula_name')} required /></Field>
      <Field label="Feed Type *">
        <Sel value={form.feed_type_id} onChange={handleFeedTypeChange} placeholder="— Select Feed Type from Master —" required>
          {feedTypes.map((ft: any) => <option key={ft.id} value={ft.id}>{ft.code} — {ft.name}</option>)}
        </Sel>
        {form.feed_type_id && <p className="text-xs text-gray-400 mt-0.5">Flock Type: <strong>{form.flock_type}</strong></p>}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Week From"><Input type="number" step="0.1" value={form.age_week_from} onChange={s('age_week_from')} /></Field>
        <Field label="Week To"><Input type="number" step="0.1" value={form.age_week_to} onChange={s('age_week_to')} /></Field>
      </div>
      <Field label="Notes"><Input value={form.notes||''} onChange={s('notes')} /></Field>

      {/* Inline ingredient entry */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">Ingredients</p>
          <span className="text-xs text-gray-500">Total %: <span className={totalPct > 100.05 ? 'text-red-600 font-bold' : 'text-green-700 font-semibold'}>{totalPct.toFixed(4)}</span></span>
        </div>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1.5 text-left w-12">#</th>
                <th className="px-2 py-1.5 text-left w-16">Code</th>
                <th className="px-2 py-1.5 text-left">Ingredient Name *</th>
                <th className="px-2 py-1.5 text-right w-20">%</th>
                <th className="px-2 py-1.5 text-right w-24">Kg/1000</th>
                <th className="px-2 py-1.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {ings.map((ing, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="px-2 py-1 text-gray-400">{idx+1}</td>
                  <td className="px-2 py-1"><input className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs" value={ing.ingredient_code} onChange={si(idx,'ingredient_code')} placeholder="Code" /></td>
                  <td className="px-2 py-1"><input className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs" value={ing.ingredient_name} onChange={si(idx,'ingredient_name')} placeholder="e.g. MAIZE" required={idx===0} /></td>
                  <td className="px-2 py-1"><input type="number" step="0.0001" className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs text-right" value={ing.percentage} onChange={si(idx,'percentage')} placeholder="0" /></td>
                  <td className="px-2 py-1"><input type="number" step="0.001" className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs text-right" value={ing.kg_per_1000} onChange={si(idx,'kg_per_1000')} placeholder="auto" /></td>
                  <td className="px-2 py-1 text-center"><button type="button" onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={11}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={addRow} className="mt-2 text-xs text-green-700 hover:text-green-900 font-medium flex items-center gap-1"><Plus size={12}/> Add row</button>
      </div>

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
  const { data: formulas = [] } = useQuery({ queryKey:['feed_formulas'], queryFn: async () => { const {data} = await supabase.from('feed_formulas').select('id,formula_code,formula_name,feed_types(code,name)').eq('is_active',true).order('formula_code'); return data??[] }})
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
        // Resolve ingredient IDs so raw-material stock is properly decremented
        const { data: ingrMaster } = await supabase.from('feed_ingredients').select('id,name,code')
        const byName: Record<string, string> = {}
        const byCode: Record<string, string> = {}
        for (const fi of (ingrMaster ?? [])) {
          byName[fi.name.toLowerCase().trim()] = fi.id
          if (fi.code) byCode[fi.code.toLowerCase().trim()] = fi.id
        }
        const rows = ings.map((i: any) => {
          const key = (i.ingredient_name ?? '').toLowerCase().trim()
          const ingredient_id = byName[key] ?? byCode[key] ?? null
          return { production_id: logData.id, ingredient_name: i.ingredient_name, quantity_kg: i.quantity_kg, ingredient_id }
        })
        await supabase.from('feed_production_ingredients').insert(rows)
      }
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_production_log']}); setShowForm(false); setEditing(null); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const {error} = await supabase.from('feed_production_log').delete().eq('id',id); if(error) throw error },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feed_production_log']}); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
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
    exportXlsx('feed_production.xlsx', ['date','formula_code','formula_name','farm','quantity_kg','ingredient_name','ingredient_kg','remarks'], rows)
  }

  const totalKg = logs.reduce((s: number, l: any) => s + Number(l.quantity_kg), 0)

  return (
    <div className="space-y-4">
      <SectionHeader title="Production Log" action={
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleExport}><Download size={14}/> Export</Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={14}/> Add Daily Entry</Button>
        </div>
      } />

      <Card>
        <div className="flex flex-wrap gap-3 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">From</span>
            <DateInput value={fFrom} onChange={e => setFFrom(e.target.value)} className="w-36 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">To</span>
            <DateInput value={fTo} onChange={e => setFTo(e.target.value)} className="w-36 text-sm" />
          </div>
          <Sel value={fFarm} onChange={e => setFFarm(e.target.value)} className="w-44 text-sm" placeholder="All Farms">
            {farms.map((f:any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Sel>
          <Button size="sm" variant="ghost" onClick={() => { setFFrom(''); setFTo(''); setFFarm('') }}>Clear</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard title="Total Production" value={`${totalKg.toLocaleString()} Kg`} />
        <StatCard title="Daily Entries" value={String(logs.length)} />
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
                <Td>
                  <span className="font-medium">{l.feed_formulas?.formula_code}</span>
                  {l.feed_formulas?.feed_types && <span className="ml-1.5 text-xs font-semibold text-green-700 bg-green-50 px-1 py-0.5 rounded">{(l.feed_formulas.feed_types as any).code}</span>}
                  <br/><span className="text-xs text-gray-500">{l.feed_formulas?.formula_name}</span>
                </Td>
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

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Daily Entry' : 'Add Daily Entry'} size="lg">
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
        <Field label="Date *"><DateInput value={form.production_date} onChange={e => setForm((f:any) => ({...f,production_date:e.target.value}))} required /></Field>
        <Field label="Farm">
          <Sel value={form.farm_id} onChange={e => setForm((f:any) => ({...f,farm_id:e.target.value}))} placeholder="Select Farm">
            {farms.map((f:any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Sel>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Formula">
          <Sel value={form.formula_id} onChange={e => handleFormulaChange(e.target.value)} placeholder="Select Formula">
            {formulas.map((f:any) => <option key={f.id} value={f.id}>{f.formula_code}{(f.feed_types as any)?.code ? ` [${(f.feed_types as any).code}]` : ''} – {f.formula_name}</option>)}
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
const ADJ_TYPES = ['Opening','Addition','Write-off','Transfer Out','Transfer In','Correction']

const StockTab: React.FC = () => {
  const qc = useQueryClient()
  const [fFarm, setFFarm] = useState('')
  const [fFrom, setFFrom] = useState('')
  const [fTo,   setFTo]   = useState('')
  const [section, setSection] = useState<'summary'|'adjustments'>('summary')
  const [showAdjForm, setShowAdjForm] = useState(false)
  const [editingAdj, setEditingAdj] = useState<any>(null)
  const [showMerge, setShowMerge] = useState(false)
  const [mergeFrom, setMergeFrom] = useState('')
  const [mergeTo,   setMergeTo]   = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const { data: farms = [] } = useQuery({ queryKey:['farms'], queryFn: async () => { const {data} = await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name'); return data??[] }})

  const { data: grnData = [], isLoading: grnLoading } = useQuery({
    queryKey: ['stock_grn', fFarm, fFrom, fTo],
    queryFn: async () => {
      let q = supabase.from('grn').select('ingredient_id,item_name,feed_ingredients(name,code), qty, grn_date, farm_id').eq('category', 'Feed')
      if (fFarm) q = q.eq('farm_id', fFarm)
      if (fFrom) q = q.gte('grn_date', fFrom)
      if (fTo)   q = q.lte('grn_date', fTo)
      const {data} = await q; return data ?? []
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
      const {data} = await q; return data ?? []
    }
  })

  const { data: adjData = [], isLoading: adjLoading } = useQuery({
    queryKey: ['stock_adj', fFarm, fFrom, fTo],
    queryFn: async () => {
      let q = supabase.from('feed_stock_adjustments').select('*, farms(name,code)').order('adjustment_date', {ascending: false})
      if (fFarm) q = q.eq('farm_id', fFarm)
      if (fFrom) q = q.gte('adjustment_date', fFrom)
      if (fTo)   q = q.lte('adjustment_date', fTo)
      const {data} = await q; return data ?? []
    }
  })

  const saveAdjMut = useMutation({
    mutationFn: async (d: any) => {
      if (d.id) { const {error} = await supabase.from('feed_stock_adjustments').update(d).eq('id',d.id); if(error) throw error }
      else { const {error} = await supabase.from('feed_stock_adjustments').insert(d); if(error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['stock_adj']}); setShowAdjForm(false); setEditingAdj(null); toast.success('Saved') },
    onError: (e:any) => toast.error(e.message)
  })

  const delAdjMut = useMutation({
    mutationFn: async (id: string) => { const {error} = await supabase.from('feed_stock_adjustments').delete().eq('id',id); if(error) throw error },
    onSuccess: () => { qc.invalidateQueries({queryKey:['stock_adj']}); toast.success('Deleted') },
    onError: (e:any) => toast.error(e.message)
  })

  // Build stock map: GRN received + adjustments - production consumed
  const stockMap: Record<string, { code?:string; received: number; adjusted: number; consumed: number }> = {}

  grnData.forEach((g: any) => {
    const name = (g.feed_ingredients as any)?.name ?? 'Unknown'
    const code = (g.feed_ingredients as any)?.code
    if (!stockMap[name]) stockMap[name] = { code, received: 0, adjusted: 0, consumed: 0 }
    stockMap[name].received += Number(g.qty ?? 0)
  })

  adjData.forEach((a: any) => {
    const name = a.ingredient_name
    if (!stockMap[name]) stockMap[name] = { code: a.ingredient_code, received: 0, adjusted: 0, consumed: 0 }
    stockMap[name].adjusted += Number(a.adjustment_kg ?? 0)
    if (!stockMap[name].code && a.ingredient_code) stockMap[name].code = a.ingredient_code
  })

  prodData.forEach((p: any) => {
    ((p.feed_production_ingredients as any[]) ?? []).forEach((i: any) => {
      const name = i.ingredient_name
      if (!stockMap[name]) stockMap[name] = { received: 0, adjusted: 0, consumed: 0 }
      stockMap[name].consumed += Number(i.quantity_kg ?? 0)
    })
  })

  const stockRows = Object.entries(stockMap)
    .map(([name, v]) => ({ name, code: v.code, received: v.received, adjusted: v.adjusted, consumed: v.consumed, balance: v.received + v.adjusted - v.consumed }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const lowStock = stockRows.filter(r => r.balance < 0).length
  const isLoading = grnLoading || prodLoading || adjLoading

  // All ingredient names for merge dropdown
  const allIngNames = Array.from(new Set([
    ...grnData.map((g:any) => (g.feed_ingredients as any)?.name).filter(Boolean),
    ...adjData.map((a:any) => a.ingredient_name).filter(Boolean),
    ...prodData.flatMap((p:any) => (p.feed_production_ingredients??[]).map((i:any) => i.ingredient_name)).filter(Boolean),
  ])).sort()

  async function doMerge() {
    if (!mergeFrom || !mergeTo || mergeFrom === mergeTo) return
    if (!confirm(`Rename all "${mergeFrom}" entries to "${mergeTo}"?`)) return
    // Update in production_ingredients
    await supabase.from('feed_production_ingredients').update({ingredient_name: mergeTo}).eq('ingredient_name', mergeFrom)
    // Update in stock_adjustments
    await supabase.from('feed_stock_adjustments').update({ingredient_name: mergeTo}).eq('ingredient_name', mergeFrom)
    // Update in feed_formula_ingredients
    await supabase.from('feed_formula_ingredients').update({ingredient_name: mergeTo}).eq('ingredient_name', mergeFrom)
    qc.invalidateQueries({queryKey:['stock_grn']}); qc.invalidateQueries({queryKey:['stock_prod']}); qc.invalidateQueries({queryKey:['stock_adj']})
    qc.invalidateQueries({queryKey:['feed_formula_ingredients']})
    setShowMerge(false); setMergeFrom(''); setMergeTo('')
    toast.success(`Merged "${mergeFrom}" → "${mergeTo}"`)
  }

  function handleExport() {
    exportXlsx('feed_stock.xlsx',
      ['ingredient_code','ingredient_name','grn_received_kg','adjustments_kg','consumed_kg','balance_kg'],
      stockRows.map(r => [r.code??'', r.name, r.received, r.adjusted, r.consumed, r.balance]))
  }

  function handleTemplate() {
    exportXlsx('feed_stock_adj_template.xlsx',
      ['date','ingredient_name','ingredient_code','farm_code','adjustment_kg','adjustment_type','remarks'],
      [['2026-01-01','MAIZE-12%Moisture','11','NF1',5000,'Opening','Opening stock as on date']])
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const { headers, rows } = await parseFile(file)
      const col = (n:string) => headers.indexOf(n)
      let count = 0
      for (const v of rows) {
        const ingName = v[col('ingredient_name')]?.trim(); if (!ingName) continue
        const farmCode = v[col('farm_code')]?.trim()
        let farmId: string|null = null
        if (farmCode) { const {data} = await supabase.from('farms').select('id').eq('code', farmCode).limit(1); farmId = data?.[0]?.id ?? null }
        const adjKg = Number(v[col('adjustment_kg')]) || 0; if (!adjKg) continue
        await supabase.from('feed_stock_adjustments').insert({
          adjustment_date: v[col('date')] || today(),
          ingredient_name: ingName,
          ingredient_code: v[col('ingredient_code')] || null,
          farm_id: farmId,
          adjustment_kg: adjKg,
          adjustment_type: v[col('adjustment_type')] || 'Opening',
          remarks: v[col('remarks')] || null,
        })
        count++
      }
      qc.invalidateQueries({queryKey:['stock_adj']}); toast.success(`Imported ${count} adjustments`)
    } catch(err: any) { toast.error(err.message) }
    e.target.value = ''
  }

  const filterBar = (
    <Card>
      <div className="flex flex-wrap gap-3 p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">From</span>
          <DateInput value={fFrom} onChange={e => setFFrom(e.target.value)} className="w-36 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">To</span>
          <DateInput value={fTo} onChange={e => setFTo(e.target.value)} className="w-36 text-sm" />
        </div>
        <Sel value={fFarm} onChange={e => setFFarm(e.target.value)} className="w-44 text-sm" placeholder="All Farms">
          {farms.map((f:any) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Sel>
        <Button size="sm" variant="ghost" onClick={() => { setFFrom(''); setFTo(''); setFFarm('') }}>Clear</Button>
      </div>
    </Card>
  )

  return (
    <div className="space-y-4">
      <SectionHeader title="Stock Status" action={
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleTemplate}><Download size={14}/> Template</Button>
          <Button size="sm" variant="outline" onClick={() => importRef.current?.click()}><Upload size={14}/> Import</Button>
          <Button size="sm" variant="outline" onClick={handleExport}><Download size={14}/> Export</Button>
          <Button size="sm" variant="outline" onClick={() => setShowMerge(true)}>Merge Names</Button>
          <Button size="sm" onClick={() => { setEditingAdj(null); setShowAdjForm(true) }}><Plus size={14}/> Add Adjustment</Button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
        </div>
      } />

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['summary','adjustments'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors capitalize ${section===s ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {s === 'summary' ? 'Stock Summary' : 'Manual Adjustments'}
          </button>
        ))}
      </div>

      {filterBar}

      {section === 'summary' && (
        <>
          {lowStock > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              ⚠️ {lowStock} ingredient(s) have negative balance in selected period
            </div>
          )}
          {isLoading ? <Spinner /> : stockRows.length === 0 ? <EmptyState title="No data in selected period" /> : (
            <Table>
              <thead><tr>
                <Th>Code</Th><Th>Ingredient</Th>
                <Th className="text-right">GRN Received</Th>
                <Th className="text-right">Adjustments</Th>
                <Th className="text-right">Consumed</Th>
                <Th className="text-right">Balance (Kg)</Th>
              </tr></thead>
              <tbody>
                {stockRows.map(r => (
                  <tr key={r.name} className={`hover:bg-gray-50 ${r.balance < 0 ? 'bg-red-50' : ''}`}>
                    <Td className="text-gray-500 text-xs">{r.code}</Td>
                    <Td className="font-medium">{r.name}</Td>
                    <Td className="text-right">{r.received.toLocaleString('en-IN',{maximumFractionDigits:3})}</Td>
                    <Td className={`text-right ${r.adjusted >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>{r.adjusted !== 0 ? (r.adjusted > 0 ? '+' : '') + r.adjusted.toLocaleString('en-IN',{maximumFractionDigits:3}) : '—'}</Td>
                    <Td className="text-right text-orange-700">{r.consumed.toLocaleString('en-IN',{maximumFractionDigits:3})}</Td>
                    <Td className={`text-right font-semibold ${r.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {r.balance.toLocaleString('en-IN',{maximumFractionDigits:3})}
                    </Td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold text-sm">
                  <Td colSpan={2}>Total</Td>
                  <Td className="text-right">{stockRows.reduce((s,r)=>s+r.received,0).toLocaleString('en-IN',{maximumFractionDigits:3})}</Td>
                  <Td className="text-right">{stockRows.reduce((s,r)=>s+r.adjusted,0).toLocaleString('en-IN',{maximumFractionDigits:3})}</Td>
                  <Td className="text-right text-orange-700">{stockRows.reduce((s,r)=>s+r.consumed,0).toLocaleString('en-IN',{maximumFractionDigits:3})}</Td>
                  <Td className="text-right text-green-700">{stockRows.reduce((s,r)=>s+r.balance,0).toLocaleString('en-IN',{maximumFractionDigits:3})}</Td>
                </tr>
              </tbody>
            </Table>
          )}
        </>
      )}

      {section === 'adjustments' && (
        <>
          {adjLoading ? <Spinner /> : adjData.length === 0 ? <EmptyState title="No adjustments yet" action={<Button onClick={() => setShowAdjForm(true)} icon={<Plus size={14}/>}>Add Adjustment</Button>} /> : (
            <Table>
              <thead><tr>
                <Th>Date</Th><Th>Ingredient</Th><Th>Type</Th><Th>Farm</Th>
                <Th className="text-right">Kg</Th><Th>Remarks</Th><Th></Th>
              </tr></thead>
              <tbody>
                {(adjData as any[]).map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <Td>{fmtDate(a.adjustment_date)}</Td>
                    <Td className="font-medium">{a.ingredient_name}<br/><span className="text-xs text-gray-400">{a.ingredient_code}</span></Td>
                    <Td><Badge color={a.adjustment_kg >= 0 ? 'green' : 'red'}>{a.adjustment_type}</Badge></Td>
                    <Td>{(a.farms as any)?.code ?? '—'}</Td>
                    <Td className={`text-right font-semibold ${a.adjustment_kg >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {a.adjustment_kg >= 0 ? '+' : ''}{Number(a.adjustment_kg).toLocaleString('en-IN',{maximumFractionDigits:3})}
                    </Td>
                    <Td className="text-xs">{a.remarks}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingAdj(a); setShowAdjForm(true) }}><Edit2 size={13}/></Button>
                        <Button size="sm" variant="ghost" onClick={() => { if(confirm('Delete?')) delAdjMut.mutate(a.id) }}><Trash2 size={13} className="text-red-500"/></Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}

      {/* Adjustment Form Modal */}
      <Modal open={showAdjForm} onClose={() => { setShowAdjForm(false); setEditingAdj(null) }} title={editingAdj ? 'Edit Adjustment' : 'Add Stock Adjustment'} size="md">
        <StockAdjForm initial={editingAdj} farms={farms} onSave={(d: any) => saveAdjMut.mutate(d)} loading={saveAdjMut.isPending} />
      </Modal>

      {/* Merge Names Modal */}
      <Modal open={showMerge} onClose={() => setShowMerge(false)} title="Merge Ingredient Names" size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowMerge(false)}>Cancel</Button><Button onClick={doMerge} disabled={!mergeFrom||!mergeTo||mergeFrom===mergeTo}>Merge</Button></>}>
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600">Rename all records of one ingredient name to another. This updates production, adjustments, and formula ingredients.</p>
          <Field label="Rename From (old name)">
            <Sel value={mergeFrom} onChange={e => setMergeFrom(e.target.value)} placeholder="Select ingredient to rename">
              {allIngNames.map(n => <option key={n} value={n}>{n}</option>)}
            </Sel>
          </Field>
          <Field label="Rename To (new/canonical name)">
            <Sel value={mergeTo} onChange={e => setMergeTo(e.target.value)} placeholder="Select target name">
              {allIngNames.map(n => <option key={n} value={n}>{n}</option>)}
            </Sel>
          </Field>
          {mergeFrom && mergeTo && mergeFrom !== mergeTo && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
              All records named "{mergeFrom}" will be renamed to "{mergeTo}". This cannot be undone.
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

const StockAdjForm: React.FC<{ initial: any; farms: any[]; onSave: (d:any)=>void; loading: boolean }> = ({ initial, farms, onSave, loading }) => {
  const [form, setForm] = useState({
    adjustment_date: today(), ingredient_name:'', ingredient_code:'',
    adjustment_kg:'', adjustment_type:'Opening', remarks:'',
    ...initial, farm_id: initial?.farm_id ?? ''
  })
  const s = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm((f:any) => ({...f,[k]:e.target.value}))
  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ ...form, adjustment_kg: Number(form.adjustment_kg), farm_id: form.farm_id || null })
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date *"><DateInput value={form.adjustment_date} onChange={s('adjustment_date')} required /></Field>
        <Field label="Type">
          <Sel value={form.adjustment_type} onChange={s('adjustment_type')}>
            {ADJ_TYPES.map(t => <option key={t}>{t}</option>)}
          </Sel>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ingredient Name *"><Input value={form.ingredient_name} onChange={s('ingredient_name')} required placeholder="e.g. MAIZE" /></Field>
        <Field label="Code"><Input value={form.ingredient_code||''} onChange={s('ingredient_code')} placeholder="e.g. 11" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Farm">
          <Sel value={form.farm_id} onChange={s('farm_id')} placeholder="Select Farm">
            {farms.map((f:any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Sel>
        </Field>
        <Field label="Quantity (Kg) *">
          <Input type="number" step="0.001" value={form.adjustment_kg} onChange={s('adjustment_kg')} required
            placeholder="Positive = add, Negative = deduct" />
        </Field>
      </div>
      <Field label="Remarks"><Input value={form.remarks||''} onChange={s('remarks')} /></Field>
      <p className="text-xs text-gray-400">Tip: use negative value for write-off / Transfer Out</p>
      <div className="flex justify-end pt-1">
        <Button type="submit" loading={loading}>Save Adjustment</Button>
      </div>
    </form>
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
    onSuccess: () => { qc.invalidateQueries({queryKey:['feedmill_expenses']}); setShowForm(false); setEditing(null); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const {error} = await supabase.from('feedmill_expenses').delete().eq('id',id); if(error) throw error },
    onSuccess: () => { qc.invalidateQueries({queryKey:['feedmill_expenses']}); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  function handleExport() {
    exportXlsx('feedmill_expenses.xlsx',
      ['date','category','farm','description','amount','vendor','invoice','remarks'],
      expenses.map((e:any) => [fmtDate(e.expense_date), e.category, (e.farms as any)?.code??'', e.description??'', e.amount, e.vendor_name??'', e.invoice_no??'', e.remarks??'']))
  }

  function handleTemplate() {
    exportXlsx('feedmill_expenses_template.xlsx',
      ['date','category','farm_code','description','amount','vendor_name','invoice_no','remarks'],
      [['2026-01-01','Labour','NF1','Daily labour',5000,'','','']])
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if(!file) return
    const { headers, rows } = await parseFile(file)
    const col = (n:string) => headers.indexOf(n)
    let count = 0
    for (const v of rows) {
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
          <Button size="sm" variant="outline" onClick={() => importRef.current?.click()}><Upload size={14}/> Import</Button>
          <Button size="sm" variant="outline" onClick={handleExport}><Download size={14}/> Export</Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={14}/> Add Expense</Button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
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
            <DateInput value={fFrom} onChange={e => setFFrom(e.target.value)} className="w-36 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">To</span>
            <DateInput value={fTo} onChange={e => setFTo(e.target.value)} className="w-36 text-sm" />
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
        <Field label="Date *"><DateInput value={form.expense_date} onChange={s('expense_date')} required /></Field>
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

// ══════════════════════════════════════════════════════════════════
// FLOCK ALLOCATION TAB
// Enter total feed per farm → auto-distribute to all flocks in that
// farm proportionally by average bird count for the month
// ══════════════════════════════════════════════════════════════════
const FlockAllocationTab: React.FC = () => {
  const qc = useQueryClient()
  const [farm, setFarm]   = React.useState('')
  const [month, setMonth] = React.useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [feedType, setFeedType] = React.useState('')
  const [totalKg, setTotalKg]   = React.useState('')
  const [rows, setRows] = React.useState<{flockId:string;flockNo:string|number;avgBirds:number;femaleKg:string;maleKg:string}[]>([])
  const [saving, setSaving] = React.useState(false)

  const { data: farms = [] } = useQuery({ queryKey:['farms'], queryFn: async () => { const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name'); return data??[] } })

  const { data: flockData, isLoading: loadingFlocks } = useQuery({
    queryKey: ['alloc_flocks', farm, month],
    enabled: !!(farm && month),
    queryFn: async () => {
      const monthStart = month + '-01'
      const [y, m] = month.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      const monthEnd = `${month}-${lastDay}`

      const { data } = await supabase
        .from('daily_records')
        .select('flock_id, opening_female, opening_male, flocks(flock_no, farm_id)')
        .gte('record_date', monthStart)
        .lte('record_date', monthEnd)
        .not('flocks', 'is', null)

      if (!data) return []
      const map: Record<string, { flockNo: string|number; totalBirds: number; count: number }> = {}
      for (const r of data) {
        const flock = r.flocks as any
        if (!flock || flock.farm_id !== farm) continue
        if (!map[r.flock_id]) map[r.flock_id] = { flockNo: flock.flock_no, totalBirds: 0, count: 0 }
        map[r.flock_id].totalBirds += (r.opening_female ?? 0) + (r.opening_male ?? 0)
        map[r.flock_id].count++
      }
      return Object.entries(map).map(([flockId, v]) => ({
        flockId, flockNo: v.flockNo,
        avgBirds: v.count > 0 ? Math.round(v.totalBirds / v.count) : 0,
      })).sort((a, b) => Number(a.flockNo) - Number(b.flockNo))
    }
  })

  React.useEffect(() => {
    if (!flockData?.length) { setRows([]); return }
    const total = parseFloat(totalKg) || 0
    const totalBirds = flockData.reduce((s, f) => s + f.avgBirds, 0)
    setRows(flockData.map(f => {
      const pct = totalBirds > 0 ? f.avgBirds / totalBirds : 1 / flockData.length
      const kg = total * pct
      return {
        flockId: f.flockId, flockNo: f.flockNo, avgBirds: f.avgBirds,
        femaleKg: kg > 0 ? (kg * 0.9).toFixed(1) : '',
        maleKg:   kg > 0 ? (kg * 0.1).toFixed(1) : '',
      }
    }))
  }, [flockData, totalKg])

  const allocTotal = rows.reduce((s, r) => s + (parseFloat(r.femaleKg)||0) + (parseFloat(r.maleKg)||0), 0)
  const enteredTotal = parseFloat(totalKg) || 0
  const diff = Math.abs(allocTotal - enteredTotal)

  const handleSave = async () => {
    if (!farm || !month || !feedType) { toast.error('Select farm, month and feed type'); return }
    if (!rows.length) { toast.error('No flocks found for this farm and month'); return }
    const validRows = rows.filter(r => (parseFloat(r.femaleKg)||0) > 0 || (parseFloat(r.maleKg)||0) > 0)
    if (!validRows.length) { toast.error('Enter feed quantities'); return }
    setSaving(true)
    try {
      const feedDate = month + '-01'
      for (const r of validRows) {
        const { error } = await supabase.from('daily_feed').upsert({
          flock_id: r.flockId, feed_date: feedDate, feed_type: feedType,
          female_kg: parseFloat(r.femaleKg) || 0,
          male_kg:   parseFloat(r.maleKg)   || 0,
        }, { onConflict: 'flock_id,feed_date,feed_type' })
        if (error) throw error
      }
      qc.invalidateQueries({ queryKey: ['flock_daily_feed'] })
      toast.success(`Feed allocated to ${validRows.length} flocks for ${month}`)
    } catch(e: any) {
      toast.error('Save failed: ' + e.message)
    }
    setSaving(false)
  }

  const resetAuto = () => {
    const total = parseFloat(totalKg) || 0
    const totalBirds = rows.reduce((s,r)=>s+r.avgBirds,0)
    setRows(rows.map(r => {
      const pct = totalBirds > 0 ? r.avgBirds / totalBirds : 1/rows.length
      const kg = total * pct
      return { ...r, femaleKg: (kg*0.9).toFixed(1), maleKg: (kg*0.1).toFixed(1) }
    }))
  }

  const inputCls = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white'

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Farm-level Feed Allocation"
        subtitle="Enter total feed for a farm/month — auto-distributes to all flocks by bird count. Each flock's monthly entry is saved to its Feed tab."
      />

      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Farm *">
            <Sel value={farm} onChange={e => setFarm(e.target.value)} placeholder="Select Farm">
              {(farms as any[]).map((f:any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Sel>
          </Field>
          <Field label="Month *">
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Feed Type *">
            <input value={feedType} onChange={e => setFeedType(e.target.value)} placeholder="e.g. BCM, L1, Male" className={inputCls} />
          </Field>
          <Field label="Total Kg for Farm *">
            <input type="number" step="0.1" value={totalKg} onChange={e => setTotalKg(e.target.value)} placeholder="e.g. 45000" className={inputCls} />
          </Field>
        </div>
      </Card>

      {farm && month && (
        loadingFlocks ? <Spinner /> : rows.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">No daily records found for this farm in {month}</div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
              Found <strong>{rows.length} active flock(s)</strong> at this farm in {month}.
              Feed split proportionally by average bird count. Female/Male ratio defaults to 90/10 — adjust as needed before saving.
              {diff > 1 && enteredTotal > 0 && (
                <span className="ml-2 text-amber-700 font-medium">
                  ⚠ Allocated {allocTotal.toFixed(1)} kg vs entered {enteredTotal.toFixed(1)} kg (diff: {diff.toFixed(1)} kg).
                </span>
              )}
            </div>

            <Card padding={false}>
              <Table>
                <thead><tr>
                  <Th>Flock</Th>
                  <Th right>Avg Birds (Month)</Th>
                  <Th right>Share %</Th>
                  <Th right>Female Kg</Th>
                  <Th right>Male Kg</Th>
                  <Th right>Total Kg</Th>
                </tr></thead>
                <tbody>
                  {rows.map((r, i) => {
                    const totalBirds = rows.reduce((s, x) => s + x.avgBirds, 0)
                    const pct = totalBirds > 0 ? (r.avgBirds / totalBirds * 100).toFixed(1) : '—'
                    const rowTotal = (parseFloat(r.femaleKg)||0) + (parseFloat(r.maleKg)||0)
                    return (
                      <tr key={r.flockId} className="hover:bg-gray-50">
                        <Td className="font-semibold text-brand-700">F-{r.flockNo}</Td>
                        <Td right>{r.avgBirds.toLocaleString('en-IN')}</Td>
                        <Td right className="text-gray-500 text-xs font-semibold">{pct}%</Td>
                        <Td right>
                          <input type="number" step="0.1" value={r.femaleKg}
                            onChange={e => setRows(prev => prev.map((x,j) => j===i ? {...x,femaleKg:e.target.value} : x))}
                            className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        </Td>
                        <Td right>
                          <input type="number" step="0.1" value={r.maleKg}
                            onChange={e => setRows(prev => prev.map((x,j) => j===i ? {...x,maleKg:e.target.value} : x))}
                            className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400" />
                        </Td>
                        <Td right className="font-semibold">{rowTotal > 0 ? rowTotal.toFixed(1) : '—'}</Td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold text-sm">
                    <Td>TOTAL</Td>
                    <Td right>{rows.reduce((s,r)=>s+r.avgBirds,0).toLocaleString('en-IN')}</Td>
                    <Td right>100%</Td>
                    <Td right>{rows.reduce((s,r)=>s+(parseFloat(r.femaleKg)||0),0).toFixed(1)}</Td>
                    <Td right>{rows.reduce((s,r)=>s+(parseFloat(r.maleKg)||0),0).toFixed(1)}</Td>
                    <Td right className={diff > 1 && enteredTotal > 0 ? 'text-amber-600' : 'text-green-700'}>{allocTotal.toFixed(1)}</Td>
                  </tr>
                </tfoot>
              </Table>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={resetAuto}>Reset to Auto</Button>
              <Button loading={saving} onClick={handleSave}>
                Save to {rows.length} Flocks
              </Button>
            </div>
          </>
        )
      )}
    </div>
  )
}
