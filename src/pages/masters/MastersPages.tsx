import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td,
  Badge, SectionHeader, Spinner, EmptyState, Divider
} from '@/components/ui'
import { Plus, Edit2, Settings, Trash2, Merge, Download, Upload, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { parseFile } from '@/lib/parseFile'

function exportCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

// ── SHARED BULK HELPERS ──────────────────────────────────────────
const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

const BulkBar: React.FC<{ count: number; onDelete: () => void; onClear: () => void; onMerge?: () => void; loading?: boolean }> = ({ count, onDelete, onClear, onMerge, loading }) =>
  count === 0 ? null : (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
      <span className="text-sm font-medium text-red-700">{count} selected</span>
      <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
      <div className="ml-auto flex gap-2">
        {onMerge && count >= 2 && (
          <Button variant="outline" size="sm" icon={<Merge size={14}/>} onClick={onMerge}>Merge {count} into 1</Button>
        )}
        <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} loading={loading} onClick={onDelete}>Delete {count} rows</Button>
      </div>
    </div>
  )

// ── GENERIC MASTER TABLE ─────────────────────────────────────────
const MasterTable: React.FC<{
  title: string
  subtitle?: string
  columns: Array<{ label: string; key: string; right?: boolean; render?: (row: any) => React.ReactNode }>
  data: any[]
  onEdit: (row: any) => void
  onAdd: () => void
  loading: boolean
  headerAction?: React.ReactNode
  sel?: Set<string>
  onToggle?: (id: string) => void
  onToggleAll?: () => void
  allSel?: boolean
  someSel?: boolean
}> = ({ title, subtitle, columns, data, onEdit, onAdd, loading, headerAction, sel, onToggle, onToggleAll, allSel, someSel }) => (
  <div className="space-y-4">
    <SectionHeader title={title} subtitle={subtitle}
      action={
        <div className="flex gap-2 items-center">
          {headerAction}
          <Button icon={<Plus size={16}/>} onClick={onAdd}>Add {title.replace(/s$/,'')}</Button>
        </div>
      }
    />
    {loading ? <Spinner/> : (
      <Card padding={false}>
        <Table>
          <thead><tr>
            {sel && (
              <Th><CB checked={!!allSel} indeterminate={someSel && !allSel} onChange={onToggleAll??(() => {})}/></Th>
            )}
            {columns.map(c => <Th key={c.key} right={c.right}>{c.label}</Th>)}
            <Th></Th>
          </tr></thead>
          <tbody>{data.map((row,i) => (
            <tr key={row.id??i} className={`hover:bg-gray-50 ${sel?.has(row.id) ? 'bg-blue-50' : ''}`}>
              {sel && (
                <Td><CB checked={sel.has(row.id)} onChange={() => onToggle?.(row.id)}/></Td>
              )}
              {columns.map(c => (
                <Td key={c.key} right={c.right}>
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </Td>
              ))}
              <Td>
                <button onClick={() => onEdit(row)}
                  className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors">
                  <Edit2 size={13}/>
                </button>
              </Td>
            </tr>
          ))}</tbody>
        </Table>
        {data.length === 0 && <EmptyState icon={<Settings size={32}/>} title={`No ${title.toLowerCase()} yet`} action={<Button onClick={onAdd} icon={<Plus size={16}/>}>Add</Button>}/>}
      </Card>
    )}
  </div>
)

// ── FARMS MASTER ─────────────────────────────────────────────────
export const FarmsMaster: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({code:'',name:'',site_type:'laying',address:'',taluka:'',elec_usc_1:'',elec_usc_2:'',contact:''})
  const s = (k:string,v:string) => setForm(f=>({...f,[k]:v}))

  const {data,isLoading} = useQuery({queryKey:['farms'],queryFn:async()=>{const{data}=await supabase.from('farms').select('*').order('name'); return data??[]}})

  const open = (row?:any) => {
    setEditing(row??null)
    setForm(row?{code:row.code,name:row.name,site_type:row.site_type,address:row.address??'',taluka:row.taluka??'',elec_usc_1:row.elec_usc_1??'',elec_usc_2:row.elec_usc_2??'',contact:row.contact??''}:{code:'',name:'',site_type:'laying',address:'',taluka:'',elec_usc_1:'',elec_usc_2:'',contact:''})
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if(!form.code||!form.name) throw new Error('Code and name required')
      const p={code:form.code.toUpperCase(),name:form.name,site_type:form.site_type,address:form.address||null,taluka:form.taluka||null,elec_usc_1:form.elec_usc_1||null,elec_usc_2:form.elec_usc_2||null,contact:form.contact||null}
      if(editing){const{error}=await supabase.from('farms').update(p).eq('id',editing.id);if(error)throw error}
      else{const{error}=await supabase.from('farms').insert(p);if(error)throw error}
    },
    onSuccess:()=>{toast.success('Saved!');qc.invalidateQueries({queryKey:['farms']});setShowForm(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  return (
    <>
      <MasterTable title="Farms" subtitle="Farm sites and locations" loading={isLoading}
        data={data??[]} onAdd={()=>open()} onEdit={open}
        columns={[
          {label:'Code',key:'code',render:r=><span className="font-mono text-xs font-bold text-brand-700">{r.code}</span>},
          {label:'Name',key:'name',render:r=><span className="font-medium">{r.name}</span>},
          {label:'Type',key:'site_type',render:r=><Badge color={r.site_type==='laying'?'green':r.site_type==='rearing'?'yellow':'blue'}>{r.site_type}</Badge>},
          {label:'Taluka',key:'taluka'},
          {label:'Meter 1 (USC)',key:'elec_usc_1',render:r=><span className="text-xs text-gray-500">{r.elec_usc_1??'—'}</span>},
          {label:'Meter 2 (USC)',key:'elec_usc_2',render:r=><span className="text-xs text-gray-500">{r.elec_usc_2??'—'}</span>},
          {label:'Status',key:'is_active',render:r=><Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge>},
        ]}
      />
      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editing?'Edit Farm':'Add Farm'} size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>{editing?'Update':'Save'}</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Input label="Code" required value={form.code} onChange={e=>s('code',e.target.value)} hint="e.g. KPALLY" />
            <Input label="Farm Name" required value={form.name} onChange={e=>s('name',e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Site Type" options={['rearing','laying','feedmill','hatchery','office']} value={form.site_type} onChange={e=>s('site_type',e.target.value)} />
            <Input label="Taluka" value={form.taluka} onChange={e=>s('taluka',e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Elec USC No — Meter 1" value={form.elec_usc_1} onChange={e=>s('elec_usc_1',e.target.value)} hint="Primary meter USC" />
            <Input label="Elec USC No — Meter 2" value={form.elec_usc_2} onChange={e=>s('elec_usc_2',e.target.value)} hint="Second meter USC (if any)" />
          </FormRow>
          <FormRow>
            <Input label="Contact" value={form.contact} onChange={e=>s('contact',e.target.value)} />
            <Input label="Address" value={form.address} onChange={e=>s('address',e.target.value)} />
          </FormRow>
        </div>
      </Modal>
    </>
  )
}

// ── FEED INGREDIENTS MASTER ──────────────────────────────────────
export const IngredientsMaster: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({code:'',name:'',short_name:'',category:'grain',unit:'kg',protein_pct:'',moisture_pct:''})
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeKeepId, setMergeKeepId] = useState('')
  const importRef = useRef<HTMLInputElement>(null)
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const {data,isLoading}=useQuery({queryKey:['ingredients'],queryFn:async()=>{const{data}=await supabase.from('feed_ingredients').select('*').order('code');return data??[]}})

  const open=(row?:any)=>{
    setEditing(row??null)
    setForm(row?{code:row.code,name:row.name,short_name:row.short_name??'',category:row.category,unit:row.unit,protein_pct:row.protein_pct?.toString()??'',moisture_pct:row.moisture_pct?.toString()??''}:{code:'',name:'',short_name:'',category:'grain',unit:'kg',protein_pct:'',moisture_pct:''})
    setShowForm(true)
  }

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.code||!form.name)throw new Error('Code and name required')
      const p={code:form.code.toUpperCase(),name:form.name,short_name:form.short_name||null,category:form.category,unit:form.unit,protein_pct:parseFloat(form.protein_pct)||null,moisture_pct:parseFloat(form.moisture_pct)||null}
      if(editing){const{error}=await supabase.from('feed_ingredients').update(p).eq('id',editing.id);if(error)throw error}
      else{const{error}=await supabase.from('feed_ingredients').insert(p);if(error)throw error}
    },
    onSuccess:()=>{toast.success('Saved!');qc.invalidateQueries({queryKey:['ingredients']});setShowForm(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const bulkDelMut=useMutation({
    mutationFn:async(ids:string[])=>{const{error}=await supabase.from('feed_ingredients').delete().in('id',ids);if(error)throw error},
    onSuccess:()=>{toast.success('Deleted');qc.invalidateQueries({queryKey:['ingredients']});setSel(new Set());setBulkConfirm(false)},
    onError:(e:any)=>{
      if(e.message?.includes('foreign key')||e.code==='23503')
        toast.error('Some ingredients could not be deleted — they have linked records')
      else toast.error(e.message)
      setBulkConfirm(false)
    }
  })

  const mergeMut=useMutation({
    mutationFn:async({keepId,dropIds}:{keepId:string;dropIds:string[]})=>{
      for(const oldId of dropIds){
        // Remap formula composition and GRN lines to the kept ingredient
        await supabase.from('feed_formula_ingredients').update({ingredient_id:keepId}).eq('ingredient_id',oldId)
        await supabase.from('grn_items').update({ingredient_id:keepId}).eq('ingredient_id',oldId)
        const{error}=await supabase.from('feed_ingredients').delete().eq('id',oldId)
        if(error)throw error
      }
    },
    onSuccess:()=>{toast.success('Merged successfully');qc.invalidateQueries({queryKey:['ingredients']});setSel(new Set());setMergeOpen(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const rows = data??[]
  const ids = rows.map((r:any)=>r.id)
  const allSel = ids.length>0 && ids.every((id:string)=>sel.has(id))
  const someSel = ids.some((id:string)=>sel.has(id))
  const toggle=(id:string)=>setSel(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})
  const toggleAll=()=>setSel(s=>{const n=new Set(s);allSel?ids.forEach((id:string)=>n.delete(id)):ids.forEach((id:string)=>n.add(id));return n})

  const handleExport=()=>exportCSV('feed_ingredients.csv',
    ['code','name','short_name','category','unit','protein_pct','moisture_pct'],
    rows.map((r:any)=>[r.code,r.name,r.short_name,r.category,r.unit,r.protein_pct,r.moisture_pct])
  )

  const handleImport=async(file:File)=>{
    const{headers:hdrs,rows:fileRows}=await parseFile(file)
    const records=fileRows.map(vals=>{const obj:Record<string,string>={};hdrs.forEach((h,i)=>{obj[h]=vals[i]??''});return obj})
    const toUpsert=records.filter(r=>r.code&&r.name).map(r=>({
      code:r.code.toUpperCase(),name:r.name,short_name:r.short_name||null,
      category:r.category||'grain',unit:r.unit||'kg',
      protein_pct:parseFloat(r.protein_pct)||null,moisture_pct:parseFloat(r.moisture_pct)||null,
    }))
    if(!toUpsert.length){toast.error('No valid rows');return}
    const{error}=await supabase.from('feed_ingredients').upsert(toUpsert,{onConflict:'code',ignoreDuplicates:true})
    if(error){toast.error(error.message);return}
    toast.success(`Imported ${toUpsert.length} ingredients`)
    qc.invalidateQueries({queryKey:['ingredients']})
    if(importRef.current)importRef.current.value=''
  }

  return (
    <>
      <div className="space-y-4">
        {/* Blue info banner for Feed Mill linkage */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Info size={16} className="text-blue-500 mt-0.5 shrink-0"/>
          <p className="text-sm text-blue-800">
            <strong>Feed Ingredients</strong> are used in Feed Formulas (formula composition) and GRN (purchase records).
            Changes here affect ingredient lookups in <strong>Feed Mill → Formula &amp; Production</strong> and <strong>GRN Entry</strong>.
          </p>
        </div>
        <SectionHeader title="Feed Ingredients" subtitle="Raw materials for feed production"
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={()=>exportCSV('ingredients_template.csv',['code','name','short_name','category','unit','protein_pct','moisture_pct'],[['MAIZE','Maize Grain','Maize','grain','kg','9.0','14.0']])}>Template</Button>
              <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={()=>importRef.current?.click()}>Import</Button>
              <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleImport(f)}}/>
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>
              <Button icon={<Plus size={16}/>} onClick={()=>open()}>Add Ingredient</Button>
            </div>
          }
        />
        <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={()=>setSel(new Set())} onDelete={()=>setBulkConfirm(true)}
          onMerge={()=>{const first=[...sel][0];setMergeKeepId(first);setMergeOpen(true)}}/>
        {isLoading?<Spinner/>:(
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allSel} indeterminate={someSel&&!allSel} onChange={toggleAll}/></Th>
                <Th>Code</Th><Th>Name</Th><Th>Short Name</Th><Th>Category</Th><Th>Unit</Th>
                <Th right>Protein%</Th><Th right>Moisture%</Th><Th>Status</Th><Th></Th>
              </tr></thead>
              <tbody>{rows.map((r:any)=>(
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id)?'bg-blue-50':''}`}>
                  <Td><CB checked={sel.has(r.id)} onChange={()=>toggle(r.id)}/></Td>
                  <Td><span className="font-mono text-xs font-bold text-brand-700">{r.code}</span></Td>
                  <Td>{r.name}</Td>
                  <Td>{r.short_name??'—'}</Td>
                  <Td><Badge color="blue">{r.category}</Badge></Td>
                  <Td>{r.unit}</Td>
                  <Td right>{r.protein_pct??'—'}</Td>
                  <Td right>{r.moisture_pct??'—'}</Td>
                  <Td><Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge></Td>
                  <Td><button onClick={()=>open(r)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button></Td>
                </tr>
              ))}</tbody>
            </Table>
            {rows.length===0&&<EmptyState icon={<Settings size={32}/>} title="No ingredients yet" action={<Button onClick={()=>open()} icon={<Plus size={16}/>}>Add</Button>}/>}
          </Card>
        )}
      </div>

      {/* Bulk delete confirm */}
      {bulkConfirm&&(
        <Modal open onClose={()=>setBulkConfirm(false)} title="Bulk Delete Ingredients" size="sm"
          footer={<><Button variant="secondary" onClick={()=>setBulkConfirm(false)}>Cancel</Button><Button variant="danger" loading={bulkDelMut.isPending} onClick={()=>bulkDelMut.mutate([...sel])}>Delete {sel.size} ingredients</Button></>}>
          <p className="text-sm text-gray-700">Delete <strong>{sel.size} selected ingredients</strong>? This cannot be undone.</p>
          <p className="text-xs text-gray-500 mt-2">Ingredients used in Feed Formulas or GRN cannot be deleted.</p>
        </Modal>
      )}

      {/* Merge modal */}
      {mergeOpen&&(
        <Modal open onClose={()=>setMergeOpen(false)} title="Merge Duplicate Ingredients" size="md"
          footer={<>
            <Button variant="secondary" onClick={()=>setMergeOpen(false)}>Cancel</Button>
            <Button loading={mergeMut.isPending} onClick={()=>mergeMut.mutate({keepId:mergeKeepId,dropIds:[...sel].filter(id=>id!==mergeKeepId)})}>
              Merge — Keep Selected
            </Button>
          </>}>
          <p className="text-sm text-gray-600 mb-4">Select which record to <strong>keep</strong>. All Formula and GRN links will be remapped to the kept record, then duplicates are deleted.</p>
          <div className="space-y-2">
            {[...sel].map(id=>{
              const row=rows.find((r:any)=>r.id===id)
              if(!row)return null
              return(
                <label key={id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mergeKeepId===id?'border-brand-500 bg-brand-50':'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="mergeKeep" value={id} checked={mergeKeepId===id} onChange={()=>setMergeKeepId(id)} className="mt-0.5 text-brand-600"/>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{row.name} <span className="font-mono text-xs text-brand-600">({row.code})</span></p>
                    <p className="text-xs text-gray-500">{row.category} • {row.unit}{row.protein_pct?` • Protein: ${row.protein_pct}%`:''}</p>
                    {mergeKeepId===id&&<span className="text-xs text-brand-600 font-medium">← Keep this one</span>}
                    {mergeKeepId!==id&&<span className="text-xs text-red-500">Will be deleted after remapping</span>}
                  </div>
                </label>
              )
            })}
          </div>
        </Modal>
      )}

      {/* Add/Edit modal */}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editing?'Edit Ingredient':'Add Ingredient'} size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>{editing?'Update':'Save'}</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Input label="Code" required value={form.code} onChange={e=>s('code',e.target.value)} hint="e.g. MAIZE" />
            <Input label="Full Name" required value={form.name} onChange={e=>s('name',e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Short Name" value={form.short_name} onChange={e=>s('short_name',e.target.value)} />
            <Select label="Category" options={['grain','protein','mineral','supplement','additive','other']} value={form.category} onChange={e=>s('category',e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Unit" value={form.unit} onChange={e=>s('unit',e.target.value)} />
            <Input label="Protein %" type="number" step="0.01" value={form.protein_pct} onChange={e=>s('protein_pct',e.target.value)} />
            <Input label="Moisture %" type="number" step="0.01" value={form.moisture_pct} onChange={e=>s('moisture_pct',e.target.value)} />
          </FormRow>
        </div>
      </Modal>
    </>
  )
}

// ── PARTIES MASTER ───────────────────────────────────────────────
export const PartiesMaster: React.FC = () => {
  const qc = useQueryClient()
  const [showForm,    setShowForm]    = useState(false)
  const [editing,     setEditing]     = useState<any>(null)
  const [deleteRow,   setDeleteRow]   = useState<any>(null)
  const [sel,          setSel]          = useState<Set<string>>(new Set())
  const [bulkConfirm,  setBulkConfirm]  = useState(false)
  const [mergeOpen,    setMergeOpen]    = useState(false)
  const [mergeKeepId,  setMergeKeepId]  = useState('')
  const [filterName,   setFilterName]   = useState('')
  const [filterType,   setFilterType]   = useState('')
  const [form, setForm] = useState({name:'',type:'supplier',category:'',contact:'',address:'',gstin:''})
  const importRef = useRef<HTMLInputElement>(null)
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const {data:allData,isLoading}=useQuery({queryKey:['parties'],queryFn:async()=>{const{data}=await supabase.from('parties').select('*').order('created_at',{ascending:false});return data??[]}})

  const data = (allData??[]).filter((r:any)=>{
    if(filterName && !r.name.toLowerCase().includes(filterName.toLowerCase())) return false
    if(filterType && r.type !== filterType) return false
    return true
  })

  const open=(row?:any)=>{
    setEditing(row??null)
    setForm(row?{name:row.name,type:row.type,category:row.category??'',contact:row.contact??'',address:row.address??'',gstin:row.gstin??''}:{name:'',type:'supplier',category:'',contact:'',address:'',gstin:''})
    setShowForm(true)
  }

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.name)throw new Error('Name required')
      const p={name:form.name,type:form.type,category:form.category||null,contact:form.contact||null,address:form.address||null,gstin:form.gstin||null}
      if(editing){const{error}=await supabase.from('parties').update(p).eq('id',editing.id);if(error)throw error}
      else{const{error}=await supabase.from('parties').insert(p);if(error)throw error}
    },
    onSuccess:()=>{toast.success('Saved!');qc.invalidateQueries({queryKey:['parties']});setShowForm(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const delMut=useMutation({
    mutationFn:async(id:string)=>{ const{error}=await supabase.from('parties').delete().eq('id',id); if(error)throw error },
    onSuccess:()=>{toast.success('Deleted');qc.invalidateQueries({queryKey:['parties']});setDeleteRow(null)},
    onError:(e:any)=>{
      if(e.message?.includes('foreign key')||e.code==='23503')
        toast.error('Cannot delete — party has linked records (GRN / sales)')
      else toast.error(e.message)
      setDeleteRow(null)
    }
  })

  const bulkDelMut=useMutation({
    mutationFn:async(ids:string[])=>{ const{error}=await supabase.from('parties').delete().in('id',ids); if(error)throw error },
    onSuccess:()=>{toast.success('Deleted');qc.invalidateQueries({queryKey:['parties']});setSel(new Set());setBulkConfirm(false)},
    onError:(e:any)=>{
      if(e.message?.includes('foreign key')||e.code==='23503')
        toast.error('Some parties could not be deleted — they have linked records')
      else toast.error(e.message)
      setBulkConfirm(false)
    }
  })

  const mergeMut = useMutation({
    mutationFn: async ({ keepId, dropIds }: { keepId: string; dropIds: string[] }) => {
      for (const oldId of dropIds) {
        await supabase.from('grn').update({ party_id: keepId }).eq('party_id', oldId)
        await supabase.from('he_dispatch').update({ party_id: keepId }).eq('party_id', oldId)
        await supabase.from('nhe_sales').update({ party_id: keepId }).eq('party_id', oldId)
        const { error } = await supabase.from('parties').delete().eq('id', oldId)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Merged successfully — all linked records updated')
      qc.invalidateQueries({ queryKey: ['parties'] })
      setSel(new Set()); setMergeOpen(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const partyIds=data.map((r:any)=>r.id)
  const allSel=partyIds.length>0&&partyIds.every((id:string)=>sel.has(id))
  const someSel=partyIds.some((id:string)=>sel.has(id))
  const toggle=(id:string)=>setSel(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})
  const toggleAll=()=>setSel(s=>{const n=new Set(s);allSel?partyIds.forEach((id:string)=>n.delete(id)):partyIds.forEach((id:string)=>n.add(id));return n})

  const handleExportParties = () => {
    exportCSV('parties.csv',
      ['name','type','category','contact','address','gstin'],
      (allData??[]).map((r:any)=>[r.name,r.type,r.category,r.contact,r.address,r.gstin])
    )
  }

  const handleImportParties = async (file: File) => {
    const { headers: hdrs, rows } = await parseFile(file)
    const records = rows.map(vals => { const obj: Record<string,string> = {}; hdrs.forEach((h,i) => { obj[h] = vals[i]??'' }); return obj })
    const toUpsert = records.filter(r=>r.name).map(r=>({
      name: r.name, type: r.type||'supplier',
      category: r.category||null, contact: r.contact||null,
      address: r.address||null, gstin: r.gstin||null,
    }))
    if (!toUpsert.length) { toast.error('No valid rows'); return }
    const { error } = await supabase.from('parties').upsert(toUpsert, { onConflict: 'name,type', ignoreDuplicates: true })
    if (error) { toast.error(error.message); return }
    toast.success(`Imported ${toUpsert.length} parties`)
    qc.invalidateQueries({ queryKey: ['parties'] })
    if (importRef.current) importRef.current.value = ''
  }

  return (
    <>
      <div className="space-y-4">
        <SectionHeader title="Parties" subtitle="Buyers and suppliers"
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={()=>exportCSV('parties_template.csv',['name','type','category','contact','address','gstin'],[['NBF Feeds Ltd','supplier','Feed','9876543210','Chennai','29ABCDE1234F1Z5']])}>Template</Button>
              <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={()=>importRef.current?.click()}>Import</Button>
              <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleImportParties(f)}}/>
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExportParties}>Export CSV</Button>
              <Button icon={<Plus size={16}/>} onClick={()=>open()}>Add Party</Button>
            </div>
          } />
        <div className="flex gap-3 flex-wrap">
          <Input label="" placeholder="Search by name…" value={filterName} onChange={e=>setFilterName(e.target.value)} className="w-52"/>
          <Select label="" placeholder="All Types" options={['buyer','supplier','both']} value={filterType} onChange={e=>setFilterType(e.target.value)} className="w-36"/>
          {(filterName||filterType)&&<Button variant="ghost" size="sm" onClick={()=>{setFilterName('');setFilterType('')}}>Clear</Button>}
          <span className="text-xs text-gray-400 self-end pb-2">{data.length} of {allData?.length??0}</span>
        </div>
        <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={()=>setSel(new Set())} onDelete={()=>setBulkConfirm(true)}
          onMerge={()=>{ const first=[...sel][0]; setMergeKeepId(first); setMergeOpen(true) }} />
        {isLoading?<Spinner/>:(
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allSel} indeterminate={someSel&&!allSel} onChange={toggleAll}/></Th>
                <Th>Name</Th><Th>Type</Th><Th>Category</Th><Th>Contact</Th>
                <Th>GSTIN</Th><Th>Status</Th><Th></Th>
              </tr></thead>
              <tbody>{data.map((r:any)=>(
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id)?'bg-blue-50':''}`}>
                  <Td><CB checked={sel.has(r.id)} onChange={()=>toggle(r.id)}/></Td>
                  <Td><span className="font-medium">{r.name}</span></Td>
                  <Td><Badge color={r.type==='buyer'?'green':r.type==='supplier'?'blue':'orange'}>{r.type}</Badge></Td>
                  <Td>{r.category??'—'}</Td>
                  <Td>{r.contact??'—'}</Td>
                  <Td><span className="text-xs font-mono">{r.gstin??'—'}</span></Td>
                  <Td><Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={()=>open(r)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
                      <button onClick={()=>setDeleteRow(r)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                    </div>
                  </Td>
                </tr>
              ))}</tbody>
            </Table>
            {data.length===0&&<EmptyState icon={<Settings size={32}/>} title="No parties found" action={<Button onClick={()=>open()} icon={<Plus size={16}/>}>Add</Button>}/>}
          </Card>
        )}
      </div>
      {deleteRow&&(
        <Modal open onClose={()=>setDeleteRow(null)} title="Delete Party" size="sm"
          footer={<><Button variant="secondary" onClick={()=>setDeleteRow(null)}>Cancel</Button><Button variant="danger" loading={delMut.isPending} onClick={()=>delMut.mutate(deleteRow.id)}>Delete</Button></>}>
          <p className="text-sm text-gray-700">Delete <strong>{deleteRow.name}</strong>? This cannot be undone.</p>
          <p className="text-xs text-gray-500 mt-2">Note: deletion will fail if this party has linked GRN / purchase / sales records.</p>
        </Modal>
      )}
      {bulkConfirm&&(
        <Modal open onClose={()=>setBulkConfirm(false)} title="Bulk Delete Parties" size="sm"
          footer={<><Button variant="secondary" onClick={()=>setBulkConfirm(false)}>Cancel</Button><Button variant="danger" loading={bulkDelMut.isPending} onClick={()=>bulkDelMut.mutate([...sel])}>Delete {sel.size} parties</Button></>}>
          <p className="text-sm text-gray-700">Delete <strong>{sel.size} selected parties</strong>? This cannot be undone.</p>
          <p className="text-xs text-gray-500 mt-2">Note: parties with linked GRN / sales records cannot be deleted.</p>
        </Modal>
      )}
      {mergeOpen && (
        <Modal open onClose={()=>setMergeOpen(false)} title="Merge Duplicate Parties" size="md"
          footer={<>
            <Button variant="secondary" onClick={()=>setMergeOpen(false)}>Cancel</Button>
            <Button loading={mergeMut.isPending} onClick={()=>mergeMut.mutate({ keepId: mergeKeepId, dropIds: [...sel].filter(id=>id!==mergeKeepId) })}>
              Merge — Keep Selected
            </Button>
          </>}>
          <p className="text-sm text-gray-600 mb-4">Select which record to <strong>keep</strong>. All GRN, HE dispatch and sales linked to the others will be remapped to the kept record, then duplicates are deleted.</p>
          <div className="space-y-2">
            {[...sel].map(id => {
              const row = allData?.find((r:any)=>r.id===id)
              if (!row) return null
              return (
                <label key={id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mergeKeepId===id?'border-brand-500 bg-brand-50':'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="mergeKeep" value={id} checked={mergeKeepId===id} onChange={()=>setMergeKeepId(id)} className="mt-0.5 text-brand-600"/>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.type} {row.category?`• ${row.category}`:''} {row.contact?`• ${row.contact}`:''}</p>
                    {mergeKeepId===id && <span className="text-xs text-brand-600 font-medium">← Keep this one</span>}
                    {mergeKeepId!==id && <span className="text-xs text-red-500">Will be deleted after remapping</span>}
                  </div>
                </label>
              )
            })}
          </div>
        </Modal>
      )}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editing?'Edit Party':'Add Party'} size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>{editing?'Update':'Save'}</Button></>}>
        <div className="space-y-4">
          <Input label="Party Name" required value={form.name} onChange={e=>s('name',e.target.value)} />
          <FormRow>
            <Select label="Type" options={['buyer','supplier','both']} value={form.type} onChange={e=>s('type',e.target.value)} />
            <Input label="Category" value={form.category} onChange={e=>s('category',e.target.value)} hint="e.g. Maize Supplier, HE Buyer" />
          </FormRow>
          <FormRow>
            <Input label="Contact" value={form.contact} onChange={e=>s('contact',e.target.value)} />
            <Input label="GSTIN" value={form.gstin} onChange={e=>s('gstin',e.target.value)} />
          </FormRow>
          <Input label="Address" value={form.address} onChange={e=>s('address',e.target.value)} />
        </div>
      </Modal>
    </>
  )
}

// ── MEDICINES MASTER ─────────────────────────────────────────────
export const MedicinesMaster: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({name:'',type:'medicine',unit:'ml',manufacturer:'',rate:'',batch_no:'',expiry_date:''})
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeKeepId, setMergeKeepId] = useState('')
  const medImportRef = useRef<HTMLInputElement>(null)
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const {data,isLoading}=useQuery({queryKey:['medicines'],queryFn:async()=>{const{data}=await supabase.from('medicines_master').select('*').order('name');return data??[]}})

  const open=(row?:any)=>{
    setEditing(row??null)
    setForm(row?{name:row.name,type:row.type,unit:row.unit,manufacturer:row.manufacturer??'',rate:row.rate?.toString()??'',batch_no:row.batch_no??'',expiry_date:row.expiry_date??''}:{name:'',type:'medicine',unit:'ml',manufacturer:'',rate:'',batch_no:'',expiry_date:''})
    setShowForm(true)
  }

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.name)throw new Error('Name required')
      const p={name:form.name,type:form.type,unit:form.unit,manufacturer:form.manufacturer||null,rate:parseFloat(form.rate)||null,batch_no:form.batch_no||null,expiry_date:form.expiry_date||null}
      if(editing){const{error}=await supabase.from('medicines_master').update(p).eq('id',editing.id);if(error)throw error}
      else{const{error}=await supabase.from('medicines_master').insert(p);if(error)throw error}
    },
    onSuccess:()=>{toast.success('Saved!');qc.invalidateQueries({queryKey:['medicines']});setShowForm(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const bulkDelMut=useMutation({
    mutationFn:async(ids:string[])=>{const{error}=await supabase.from('medicines_master').delete().in('id',ids);if(error)throw error},
    onSuccess:()=>{toast.success('Deleted');qc.invalidateQueries({queryKey:['medicines']});setSel(new Set());setBulkConfirm(false)},
    onError:(e:any)=>{
      if(e.message?.includes('foreign key')||e.code==='23503')
        toast.error('Some medicines could not be deleted — they have linked usage records')
      else toast.error(e.message)
      setBulkConfirm(false)
    }
  })

  const mergeMut=useMutation({
    mutationFn:async({keepId,dropIds}:{keepId:string;dropIds:string[]})=>{
      // Delete duplicates (no FK remap — medicine_usage links are complex)
      for(const oldId of dropIds){
        const{error}=await supabase.from('medicines_master').delete().eq('id',oldId)
        if(error)throw error
      }
    },
    onSuccess:()=>{toast.success('Merged — duplicates deleted');qc.invalidateQueries({queryKey:['medicines']});setSel(new Set());setMergeOpen(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const rows=data??[]
  const ids=rows.map((r:any)=>r.id)
  const allSel=ids.length>0&&ids.every((id:string)=>sel.has(id))
  const someSel=ids.some((id:string)=>sel.has(id))
  const toggle=(id:string)=>setSel(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})
  const toggleAll=()=>setSel(s=>{const n=new Set(s);allSel?ids.forEach((id:string)=>n.delete(id)):ids.forEach((id:string)=>n.add(id));return n})

  const typeColors:Record<string,any>={medicine:'blue',vaccine:'green',supplement:'yellow',disinfectant:'red',other:'gray'}

  const handleExportMeds = () => {
    exportCSV('medicines_master.csv',
      ['name','type','unit','manufacturer','rate','batch_no','expiry_date'],
      rows.map((r:any)=>[r.name,r.type,r.unit,r.manufacturer,r.rate,r.batch_no,r.expiry_date])
    )
  }

  const handleImportMeds = async (file: File) => {
    const { headers: hdrs, rows: fileRows } = await parseFile(file)
    const records = fileRows.map(vals => { const obj: Record<string,string> = {}; hdrs.forEach((h,i) => { obj[h] = vals[i]??'' }); return obj })
    const toUpsert = records.filter(r=>r.name).map(r=>({
      name: r.name, type: r.type||'medicine', unit: r.unit||'ml',
      manufacturer: r.manufacturer||null, rate: parseFloat(r.rate)||null,
      batch_no: r.batch_no||null, expiry_date: r.expiry_date||null,
    }))
    if (!toUpsert.length) { toast.error('No valid rows'); return }
    const { error } = await supabase.from('medicines_master').upsert(toUpsert, { onConflict: 'name', ignoreDuplicates: true })
    if (error) { toast.error(error.message); return }
    toast.success(`Imported ${toUpsert.length} medicines`)
    qc.invalidateQueries({ queryKey: ['medicines'] })
    if (medImportRef.current) medImportRef.current.value = ''
  }

  return (
    <>
      <div className="space-y-4">
        <SectionHeader title="Medicines & Vaccines" subtitle="Medical and vaccine inventory"
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={()=>exportCSV('medicines_template.csv',['name','type','unit','manufacturer','rate','batch_no','expiry_date'],[['Newcastle Vaccine','vaccine','dose','Zoetis','15','BT2024001','2025-12-31']])}>Template</Button>
              <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={()=>medImportRef.current?.click()}>Import</Button>
              <input ref={medImportRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleImportMeds(f)}}/>
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExportMeds}>Export CSV</Button>
              <Button icon={<Plus size={16}/>} onClick={()=>open()}>Add Medicine</Button>
            </div>
          }
        />
        <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={()=>setSel(new Set())} onDelete={()=>setBulkConfirm(true)}
          onMerge={()=>{const first=[...sel][0];setMergeKeepId(first);setMergeOpen(true)}}/>
        {isLoading?<Spinner/>:(
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allSel} indeterminate={someSel&&!allSel} onChange={toggleAll}/></Th>
                <Th>Name</Th><Th>Type</Th><Th>Unit</Th><Th>Manufacturer</Th>
                <Th>Batch No</Th><Th>Expiry Date</Th><Th right>Rate (Rs)</Th><Th>Status</Th><Th></Th>
              </tr></thead>
              <tbody>{rows.map((r:any)=>(
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id)?'bg-blue-50':''}`}>
                  <Td><CB checked={sel.has(r.id)} onChange={()=>toggle(r.id)}/></Td>
                  <Td><span className="font-medium">{r.name}</span></Td>
                  <Td><Badge color={typeColors[r.type]??'gray'}>{r.type}</Badge></Td>
                  <Td>{r.unit}</Td>
                  <Td>{r.manufacturer??'—'}</Td>
                  <Td>{r.batch_no??'—'}</Td>
                  <Td>{r.expiry_date?fmtDate(r.expiry_date):'—'}</Td>
                  <Td right>{r.rate?`₹${Number(r.rate).toLocaleString('en-IN')}`:'—'}</Td>
                  <Td><Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge></Td>
                  <Td><button onClick={()=>open(r)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button></Td>
                </tr>
              ))}</tbody>
            </Table>
            {rows.length===0&&<EmptyState icon={<Settings size={32}/>} title="No medicines yet" action={<Button onClick={()=>open()} icon={<Plus size={16}/>}>Add</Button>}/>}
          </Card>
        )}
      </div>

      {bulkConfirm&&(
        <Modal open onClose={()=>setBulkConfirm(false)} title="Bulk Delete Medicines" size="sm"
          footer={<><Button variant="secondary" onClick={()=>setBulkConfirm(false)}>Cancel</Button><Button variant="danger" loading={bulkDelMut.isPending} onClick={()=>bulkDelMut.mutate([...sel])}>Delete {sel.size} medicines</Button></>}>
          <p className="text-sm text-gray-700">Delete <strong>{sel.size} selected medicines</strong>? This cannot be undone.</p>
          <p className="text-xs text-gray-500 mt-2">Medicines with linked usage records cannot be deleted.</p>
        </Modal>
      )}

      {mergeOpen&&(
        <Modal open onClose={()=>setMergeOpen(false)} title="Merge Duplicate Medicines" size="md"
          footer={<>
            <Button variant="secondary" onClick={()=>setMergeOpen(false)}>Cancel</Button>
            <Button loading={mergeMut.isPending} onClick={()=>mergeMut.mutate({keepId:mergeKeepId,dropIds:[...sel].filter(id=>id!==mergeKeepId)})}>
              Merge — Keep Selected
            </Button>
          </>}>
          <p className="text-sm text-gray-600 mb-3">Select which record to <strong>keep</strong>. Duplicate records will be deleted.</p>
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2 mb-4">Note: existing medicine usage records linked to duplicates will not be remapped. Only use this for records with no usage history.</p>
          <div className="space-y-2">
            {[...sel].map(id=>{
              const row=rows.find((r:any)=>r.id===id)
              if(!row)return null
              return(
                <label key={id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mergeKeepId===id?'border-brand-500 bg-brand-50':'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="mergeKeep" value={id} checked={mergeKeepId===id} onChange={()=>setMergeKeepId(id)} className="mt-0.5 text-brand-600"/>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.type} • {row.unit}{row.manufacturer?` • ${row.manufacturer}`:''}</p>
                    {mergeKeepId===id&&<span className="text-xs text-brand-600 font-medium">← Keep this one</span>}
                    {mergeKeepId!==id&&<span className="text-xs text-red-500">Will be deleted</span>}
                  </div>
                </label>
              )
            })}
          </div>
        </Modal>
      )}

      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editing?'Edit Medicine':'Add Medicine'} size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>{editing?'Update':'Save'}</Button></>}>
        <div className="space-y-4">
          <Input label="Medicine / Vaccine Name" required value={form.name} onChange={e=>s('name',e.target.value)} />
          <FormRow>
            <Select label="Type" options={['medicine','vaccine','supplement','sanitizer','injectable','disinfectant','pesticide','other']} value={form.type} onChange={e=>s('type',e.target.value)} />
            <Input label="Unit" value={form.unit} onChange={e=>s('unit',e.target.value)} hint="ml, litre, gm, kg, dose, vial..." />
          </FormRow>
          <FormRow>
            <Input label="Manufacturer" value={form.manufacturer} onChange={e=>s('manufacturer',e.target.value)} />
            <Input label="Rate per Unit (₹)" type="number" step="0.01" value={form.rate} onChange={e=>s('rate',e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Batch No" value={form.batch_no} onChange={e=>s('batch_no',e.target.value)} hint="e.g. BT2024001" />
            <Input label="Expiry Date" type="date" value={form.expiry_date} onChange={e=>s('expiry_date',e.target.value)} />
          </FormRow>
        </div>
      </Modal>
    </>
  )
}

export const ShedsMaster: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [farmFilter, setFarmFilter] = useState('')
  const [form, setForm] = useState({
    farm_id:'', shed_no:'', shed_name:'', shed_type:'laying', sex:'combined',
    capacity_female:'', capacity_male:'', a_side_boxes:'', b_side_boxes:'',
    birds_per_box:'', water_tank_litres:'', remarks:''
  })
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const {data:farms}=useQuery({queryKey:['farms'],queryFn:async()=>{const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name');return data??[]}})
  const {data,isLoading}=useQuery({
    queryKey:['sheds',farmFilter],
    queryFn:async()=>{
      let q=supabase.from('sheds').select('*, farms(name,code)').order('shed_no')
      if(farmFilter)q=q.eq('farm_id',farmFilter)
      const{data}=await q;return data??[]
    }
  })

  const open=(row?:any)=>{
    setEditing(row??null)
    setForm(row?{farm_id:row.farm_id,shed_no:row.shed_no,shed_name:row.shed_name??'',shed_type:row.shed_type,sex:row.sex,capacity_female:row.capacity_female?.toString()??'',capacity_male:row.capacity_male?.toString()??'',a_side_boxes:row.a_side_boxes?.toString()??'',b_side_boxes:row.b_side_boxes?.toString()??'',birds_per_box:row.birds_per_box?.toString()??'',water_tank_litres:row.water_tank_litres?.toString()??'',remarks:row.remarks??''}:{farm_id:'',shed_no:'',shed_name:'',shed_type:'laying',sex:'combined',capacity_female:'',capacity_male:'',a_side_boxes:'',b_side_boxes:'',birds_per_box:'',water_tank_litres:'',remarks:''})
    setShowForm(true)
  }

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.farm_id||!form.shed_no)throw new Error('Farm and Shed No required')
      const p={farm_id:form.farm_id,shed_no:form.shed_no,shed_name:form.shed_name||null,shed_type:form.shed_type,sex:form.sex,capacity_female:parseInt(form.capacity_female)||null,capacity_male:parseInt(form.capacity_male)||null,a_side_boxes:parseInt(form.a_side_boxes)||null,b_side_boxes:parseInt(form.b_side_boxes)||null,birds_per_box:parseFloat(form.birds_per_box)||null,water_tank_litres:parseInt(form.water_tank_litres)||null,remarks:form.remarks||null}
      if(editing){const{error}=await supabase.from('sheds').update(p).eq('id',editing.id);if(error)throw error}
      else{const{error}=await supabase.from('sheds').insert(p);if(error)throw error}
    },
    onSuccess:()=>{toast.success('Saved!');qc.invalidateQueries({queryKey:['sheds']});setShowForm(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const farmOptions=farms?.map((f:any)=>({value:f.id,label:f.name}))??[]

  return (
    <>
      <div className="space-y-4">
        <SectionHeader title="Sheds" subtitle="Shed capacity per farm site"
          action={<Button icon={<Plus size={16}/>} onClick={()=>open()}>Add Shed</Button>}/>
        <div className="flex gap-3">
          <Select label="" placeholder="All Sites" options={farmOptions} value={farmFilter} onChange={e=>setFarmFilter(e.target.value)} className="w-52"/>
          {farmFilter&&<Button variant="ghost" size="sm" onClick={()=>setFarmFilter('')}>Clear</Button>}
        </div>
        {isLoading?<Spinner/>:(
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th>Farm</Th><Th>Shed No</Th><Th>Name</Th><Th>Type</Th><Th>Sex</Th>
                <Th right>Cap ♀</Th><Th right>Cap ♂</Th><Th right>Boxes A</Th><Th right>Boxes B</Th>
                <Th right>Birds/Box</Th><Th></Th>
              </tr></thead>
              <tbody>{data?.map((r:any)=>(
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td><span className="text-xs font-mono text-brand-700">{r.farms?.code}</span></Td>
                  <Td><span className="font-semibold">{r.shed_no}</span></Td>
                  <Td>{r.shed_name??'—'}</Td>
                  <Td><Badge color="blue">{r.shed_type}</Badge></Td>
                  <Td><Badge color="gray">{r.sex}</Badge></Td>
                  <Td right>{r.capacity_female?.toLocaleString('en-IN')??'—'}</Td>
                  <Td right>{r.capacity_male?.toLocaleString('en-IN')??'—'}</Td>
                  <Td right>{r.a_side_boxes??'—'}</Td>
                  <Td right>{r.b_side_boxes??'—'}</Td>
                  <Td right>{r.birds_per_box??'—'}</Td>
                  <Td><button onClick={()=>open(r)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button></Td>
                </tr>
              ))}</tbody>
            </Table>
            {data?.length===0&&<EmptyState icon={<Settings size={32}/>} title="No sheds added" action={<Button onClick={()=>open()} icon={<Plus size={16}/>}>Add Shed</Button>}/>}
          </Card>
        )}
      </div>
      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editing?'Edit Shed':'Add Shed'} size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>{editing?'Update':'Save'}</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Select label="Farm / Site" required placeholder="— Select —" options={farmOptions} value={form.farm_id} onChange={e=>s('farm_id',e.target.value)}/>
            <Input label="Shed No" required value={form.shed_no} onChange={e=>s('shed_no',e.target.value)} hint="e.g. A, B, C1"/>
          </FormRow>
          <FormRow>
            <Input label="Shed Name" value={form.shed_name} onChange={e=>s('shed_name',e.target.value)}/>
            <Select label="Shed Type" options={['brooding','grower','laying','rearing']} value={form.shed_type} onChange={e=>s('shed_type',e.target.value)}/>
            <Select label="Sex" options={['female','male','combined']} value={form.sex} onChange={e=>s('sex',e.target.value)}/>
          </FormRow>
          <Divider label="Capacity"/>
          <FormRow>
            <Input label="Capacity Female" type="number" value={form.capacity_female} onChange={e=>s('capacity_female',e.target.value)}/>
            <Input label="Capacity Male" type="number" value={form.capacity_male} onChange={e=>s('capacity_male',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="A-Side Boxes" type="number" value={form.a_side_boxes} onChange={e=>s('a_side_boxes',e.target.value)}/>
            <Input label="B-Side Boxes" type="number" value={form.b_side_boxes} onChange={e=>s('b_side_boxes',e.target.value)}/>
            <Input label="Birds/Box" type="number" step="0.01" value={form.birds_per_box} onChange={e=>s('birds_per_box',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="Water Tank (Litres)" type="number" value={form.water_tank_litres} onChange={e=>s('water_tank_litres',e.target.value)}/>
            <Input label="Remarks" value={form.remarks} onChange={e=>s('remarks',e.target.value)}/>
          </FormRow>
        </div>
      </Modal>
    </>
  )
}

// ── HATCHERIES MASTER ────────────────────────────────────────────
export const HatcheriesMaster: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({name:'',type:'Hitech',location:'',city:'',contact:''})
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeKeepId, setMergeKeepId] = useState('')
  const importRef = useRef<HTMLInputElement>(null)
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const {data,isLoading}=useQuery({queryKey:['hatcheries'],queryFn:async()=>{const{data}=await supabase.from('hatcheries').select('*').order('name');return data??[]}})

  const open=(row?:any)=>{
    setEditing(row??null)
    setForm(row?{name:row.name,type:row.type,location:row.location??'',city:row.city??'',contact:row.contact??''}:{name:'',type:'Hitech',location:'',city:'',contact:''})
    setShowForm(true)
  }

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.name)throw new Error('Name required')
      const p={name:form.name,type:form.type,location:form.location||null,city:form.city||null,contact:form.contact||null}
      if(editing){const{error}=await supabase.from('hatcheries').update(p).eq('id',editing.id);if(error)throw error}
      else{const{error}=await supabase.from('hatcheries').insert(p);if(error)throw error}
    },
    onSuccess:()=>{toast.success('Saved!');qc.invalidateQueries({queryKey:['hatcheries']});setShowForm(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const bulkDelMut=useMutation({
    mutationFn:async(ids:string[])=>{const{error}=await supabase.from('hatcheries').delete().in('id',ids);if(error)throw error},
    onSuccess:()=>{toast.success('Deleted');qc.invalidateQueries({queryKey:['hatcheries']});setSel(new Set());setBulkConfirm(false)},
    onError:(e:any)=>{
      if(e.message?.includes('foreign key')||e.code==='23503')
        toast.error('Some hatcheries could not be deleted — they have linked dispatch records')
      else toast.error(e.message)
      setBulkConfirm(false)
    }
  })

  const mergeMut=useMutation({
    mutationFn:async({keepId,dropIds}:{keepId:string;dropIds:string[]})=>{
      for(const oldId of dropIds){
        // Remap he_dispatch records to kept hatchery
        await supabase.from('he_dispatch').update({hatchery_id:keepId}).eq('hatchery_id',oldId)
        const{error}=await supabase.from('hatcheries').delete().eq('id',oldId)
        if(error)throw error
      }
    },
    onSuccess:()=>{toast.success('Merged successfully');qc.invalidateQueries({queryKey:['hatcheries']});setSel(new Set());setMergeOpen(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const rows=data??[]
  const ids=rows.map((r:any)=>r.id)
  const allSel=ids.length>0&&ids.every((id:string)=>sel.has(id))
  const someSel=ids.some((id:string)=>sel.has(id))
  const toggle=(id:string)=>setSel(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})
  const toggleAll=()=>setSel(s=>{const n=new Set(s);allSel?ids.forEach((id:string)=>n.delete(id)):ids.forEach((id:string)=>n.add(id));return n})

  const handleExport=()=>exportCSV('hatcheries.csv',
    ['name','type','location','city','contact'],
    rows.map((r:any)=>[r.name,r.type,r.location,r.city,r.contact])
  )

  const handleImport=async(file:File)=>{
    const{headers:hdrs,rows:fileRows}=await parseFile(file)
    const records=fileRows.map(vals=>{const obj:Record<string,string>={};hdrs.forEach((h,i)=>{obj[h]=vals[i]??''});return obj})
    const toUpsert=records.filter(r=>r.name).map(r=>({
      name:r.name,type:r.type||'Hitech',
      location:r.location||null,city:r.city||null,contact:r.contact||null,
    }))
    if(!toUpsert.length){toast.error('No valid rows');return}
    const{error}=await supabase.from('hatcheries').upsert(toUpsert,{onConflict:'name',ignoreDuplicates:true})
    if(error){toast.error(error.message);return}
    toast.success(`Imported ${toUpsert.length} hatcheries`)
    qc.invalidateQueries({queryKey:['hatcheries']})
    if(importRef.current)importRef.current.value=''
  }

  return (
    <>
      <div className="space-y-4">
        <SectionHeader title="Hatcheries" subtitle="Hatchery buyers for HE dispatch"
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={()=>exportCSV('hatcheries_template.csv',['name','type','location','city','contact'],[['Hitech Hatchery Pune','Hitech','Pune Industrial Area','Pune','9876543210']])}>Template</Button>
              <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={()=>importRef.current?.click()}>Import</Button>
              <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleImport(f)}}/>
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>
              <Button icon={<Plus size={16}/>} onClick={()=>open()}>Add Hatchery</Button>
            </div>
          }
        />
        <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={()=>setSel(new Set())} onDelete={()=>setBulkConfirm(true)}
          onMerge={()=>{const first=[...sel][0];setMergeKeepId(first);setMergeOpen(true)}}/>
        {isLoading?<Spinner/>:(
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allSel} indeterminate={someSel&&!allSel} onChange={toggleAll}/></Th>
                <Th>Name</Th><Th>Type</Th><Th>Location</Th><Th>City</Th><Th>Contact</Th><Th>Status</Th><Th></Th>
              </tr></thead>
              <tbody>{rows.map((r:any)=>(
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id)?'bg-blue-50':''}`}>
                  <Td><CB checked={sel.has(r.id)} onChange={()=>toggle(r.id)}/></Td>
                  <Td><span className="font-medium">{r.name}</span></Td>
                  <Td><Badge color={r.type==='Hitech'?'green':r.type==='VHL'?'blue':'gray'}>{r.type}</Badge></Td>
                  <Td>{r.location??'—'}</Td>
                  <Td>{r.city??'—'}</Td>
                  <Td>{r.contact??'—'}</Td>
                  <Td><Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge></Td>
                  <Td><button onClick={()=>open(r)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button></Td>
                </tr>
              ))}</tbody>
            </Table>
            {rows.length===0&&<EmptyState icon={<Settings size={32}/>} title="No hatcheries yet" action={<Button onClick={()=>open()} icon={<Plus size={16}/>}>Add</Button>}/>}
          </Card>
        )}
      </div>

      {bulkConfirm&&(
        <Modal open onClose={()=>setBulkConfirm(false)} title="Bulk Delete Hatcheries" size="sm"
          footer={<><Button variant="secondary" onClick={()=>setBulkConfirm(false)}>Cancel</Button><Button variant="danger" loading={bulkDelMut.isPending} onClick={()=>bulkDelMut.mutate([...sel])}>Delete {sel.size} hatcheries</Button></>}>
          <p className="text-sm text-gray-700">Delete <strong>{sel.size} selected hatcheries</strong>? This cannot be undone.</p>
          <p className="text-xs text-gray-500 mt-2">Hatcheries with linked HE dispatch records cannot be deleted.</p>
        </Modal>
      )}

      {mergeOpen&&(
        <Modal open onClose={()=>setMergeOpen(false)} title="Merge Duplicate Hatcheries" size="md"
          footer={<>
            <Button variant="secondary" onClick={()=>setMergeOpen(false)}>Cancel</Button>
            <Button loading={mergeMut.isPending} onClick={()=>mergeMut.mutate({keepId:mergeKeepId,dropIds:[...sel].filter(id=>id!==mergeKeepId)})}>
              Merge — Keep Selected
            </Button>
          </>}>
          <p className="text-sm text-gray-600 mb-4">Select which record to <strong>keep</strong>. All HE dispatch records will be remapped to the kept hatchery, then duplicates are deleted.</p>
          <div className="space-y-2">
            {[...sel].map(id=>{
              const row=rows.find((r:any)=>r.id===id)
              if(!row)return null
              return(
                <label key={id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mergeKeepId===id?'border-brand-500 bg-brand-50':'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="mergeKeep" value={id} checked={mergeKeepId===id} onChange={()=>setMergeKeepId(id)} className="mt-0.5 text-brand-600"/>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.type}{row.city?` • ${row.city}`:''}{row.contact?` • ${row.contact}`:''}</p>
                    {mergeKeepId===id&&<span className="text-xs text-brand-600 font-medium">← Keep this one</span>}
                    {mergeKeepId!==id&&<span className="text-xs text-red-500">Will be deleted after remapping</span>}
                  </div>
                </label>
              )
            })}
          </div>
        </Modal>
      )}

      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editing?'Edit Hatchery':'Add Hatchery'} size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>{editing?'Update':'Save'}</Button></>}>
        <div className="space-y-4">
          <Input label="Hatchery Name" required value={form.name} onChange={e=>s('name',e.target.value)}/>
          <FormRow>
            <Select label="Type" options={['Hitech','VHL','Other']} value={form.type} onChange={e=>s('type',e.target.value)}/>
            <Input label="City" value={form.city} onChange={e=>s('city',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="Location / Address" value={form.location} onChange={e=>s('location',e.target.value)}/>
            <Input label="Contact" value={form.contact} onChange={e=>s('contact',e.target.value)}/>
          </FormRow>
        </div>
      </Modal>
    </>
  )
}

// ── ELECTRICITY METERS MASTER ────────────────────────────────────
export const MetersMaster: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({farm_id:'',usc_no:'',service_no:'',meter_name:''})
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const {data:farms}=useQuery({queryKey:['farms'],queryFn:async()=>{const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name');return data??[]}})
  const {data,isLoading}=useQuery({queryKey:['meters'],queryFn:async()=>{const{data}=await supabase.from('electricity_meters').select('*, farms(name,code)').order('meter_name');return data??[]}})

  const open=(row?:any)=>{
    setEditing(row??null)
    setForm(row?{farm_id:row.farm_id,usc_no:row.usc_no,service_no:row.service_no??'',meter_name:row.meter_name}:{farm_id:'',usc_no:'',service_no:'',meter_name:''})
    setShowForm(true)
  }

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.farm_id||!form.usc_no||!form.meter_name)throw new Error('Farm, USC No and Name required')
      const p={farm_id:form.farm_id,usc_no:form.usc_no,service_no:form.service_no||null,meter_name:form.meter_name}
      if(editing){const{error}=await supabase.from('electricity_meters').update(p).eq('id',editing.id);if(error)throw error}
      else{const{error}=await supabase.from('electricity_meters').insert(p);if(error)throw error}
    },
    onSuccess:()=>{toast.success('Saved!');qc.invalidateQueries({queryKey:['meters']});setShowForm(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const bulkDelMut=useMutation({
    mutationFn:async(ids:string[])=>{const{error}=await supabase.from('electricity_meters').delete().in('id',ids);if(error)throw error},
    onSuccess:()=>{toast.success('Deleted');qc.invalidateQueries({queryKey:['meters']});setSel(new Set());setBulkConfirm(false)},
    onError:(e:any)=>{
      if(e.message?.includes('foreign key')||e.code==='23503')
        toast.error('Some meters could not be deleted — they have linked electricity readings')
      else toast.error(e.message)
      setBulkConfirm(false)
    }
  })

  const rows=data??[]
  const ids=rows.map((r:any)=>r.id)
  const allSel=ids.length>0&&ids.every((id:string)=>sel.has(id))
  const someSel=ids.some((id:string)=>sel.has(id))
  const toggle=(id:string)=>setSel(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})
  const toggleAll=()=>setSel(s=>{const n=new Set(s);allSel?ids.forEach((id:string)=>n.delete(id)):ids.forEach((id:string)=>n.add(id));return n})

  const handleExport=()=>exportCSV('electricity_meters.csv',
    ['meter_name','farm_code','usc_no','service_no'],
    rows.map((r:any)=>[r.meter_name,r.farms?.code,r.usc_no,r.service_no])
  )

  const farmOptions=farms?.map((f:any)=>({value:f.id,label:f.name}))??[]

  return (
    <>
      <div className="space-y-4">
        <SectionHeader title="Electricity Meters" subtitle="Meter USC codes per site"
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>
              <Button icon={<Plus size={16}/>} onClick={()=>open()}>Add Meter</Button>
            </div>
          }
        />
        <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={()=>setSel(new Set())} onDelete={()=>setBulkConfirm(true)}/>
        {isLoading?<Spinner/>:(
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allSel} indeterminate={someSel&&!allSel} onChange={toggleAll}/></Th>
                <Th>Meter Name</Th><Th>Farm</Th><Th>USC No</Th><Th>Service No</Th><Th>Status</Th><Th></Th>
              </tr></thead>
              <tbody>{rows.map((r:any)=>(
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id)?'bg-blue-50':''}`}>
                  <Td><CB checked={sel.has(r.id)} onChange={()=>toggle(r.id)}/></Td>
                  <Td><span className="font-medium">{r.meter_name}</span></Td>
                  <Td><span className="text-xs font-mono text-brand-700">{r.farms?.code}</span></Td>
                  <Td><span className="font-mono text-sm">{r.usc_no}</span></Td>
                  <Td><span className="text-xs text-gray-400">{r.service_no??'—'}</span></Td>
                  <Td><Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge></Td>
                  <Td><button onClick={()=>open(r)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button></Td>
                </tr>
              ))}</tbody>
            </Table>
            {rows.length===0&&<EmptyState icon={<Settings size={32}/>} title="No meters yet" action={<Button onClick={()=>open()} icon={<Plus size={16}/>}>Add</Button>}/>}
          </Card>
        )}
      </div>

      {bulkConfirm&&(
        <Modal open onClose={()=>setBulkConfirm(false)} title="Bulk Delete Meters" size="sm"
          footer={<><Button variant="secondary" onClick={()=>setBulkConfirm(false)}>Cancel</Button><Button variant="danger" loading={bulkDelMut.isPending} onClick={()=>bulkDelMut.mutate([...sel])}>Delete {sel.size} meters</Button></>}>
          <p className="text-sm text-gray-700">Delete <strong>{sel.size} selected meters</strong>? This cannot be undone.</p>
          <p className="text-xs text-gray-500 mt-2">Meters with linked electricity readings cannot be deleted.</p>
        </Modal>
      )}

      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editing?'Edit Meter':'Add Meter'} size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>{editing?'Update':'Save'}</Button></>}>
        <div className="space-y-4">
          <Select label="Farm / Site" required placeholder="— Select —" options={farmOptions} value={form.farm_id} onChange={e=>s('farm_id',e.target.value)}/>
          <Input label="Meter Name" required value={form.meter_name} onChange={e=>s('meter_name',e.target.value)} hint="e.g. Bodjanampet-1 Main"/>
          <FormRow>
            <Input label="USC No" required value={form.usc_no} onChange={e=>s('usc_no',e.target.value)} hint="From electricity bill"/>
            <Input label="Service No" value={form.service_no} onChange={e=>s('service_no',e.target.value)}/>
          </FormRow>
        </div>
      </Modal>
    </>
  )
}

// ── FEED TYPES MASTER ────────────────────────────────────────────
export const FeedTypesMaster: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({code:'',name:'',category:'layer',week_from:'',week_to:'',sex:'female',sort_order:'0',is_active:true})
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const s=(k:string,v:any)=>setForm(f=>({...f,[k]:v}))

  const {data,isLoading}=useQuery({queryKey:['feed_types'],queryFn:async()=>{const{data}=await supabase.from('feed_types').select('*').order('sort_order');return data??[]}})

  const open=(row?:any)=>{
    setEditing(row??null)
    setForm(row
      ? {code:row.code,name:row.name,category:row.category,week_from:row.week_from?.toString()??'',week_to:row.week_to?.toString()??'',sex:row.sex,sort_order:row.sort_order?.toString()??'0',is_active:row.is_active??true}
      : {code:'',name:'',category:'layer',week_from:'',week_to:'',sex:'female',sort_order:'0',is_active:true})
    setShowForm(true)
  }

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.code||!form.name)throw new Error('Code and name required')
      const p={code:form.code.toUpperCase().trim(),name:form.name.trim(),category:form.category,week_from:parseInt(form.week_from)||null,week_to:parseInt(form.week_to)||null,sex:form.sex,sort_order:parseInt(form.sort_order)||0,is_active:form.is_active}
      if(editing){const{error}=await supabase.from('feed_types').update(p).eq('id',editing.id);if(error)throw error}
      else{const{error}=await supabase.from('feed_types').insert(p);if(error)throw error}
    },
    onSuccess:()=>{toast.success('Saved!');qc.invalidateQueries({queryKey:['feed_types']});setShowForm(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const delMut=useMutation({
    mutationFn:async(id:string)=>{const{error}=await supabase.from('feed_types').delete().eq('id',id);if(error)throw error},
    onSuccess:()=>{toast.success('Deleted');qc.invalidateQueries({queryKey:['feed_types']})},
    onError:(e:any)=>toast.error(e.message)
  })

  const bulkDelMut=useMutation({
    mutationFn:async(ids:string[])=>{const{error}=await supabase.from('feed_types').delete().in('id',ids);if(error)throw error},
    onSuccess:()=>{toast.success('Deleted');qc.invalidateQueries({queryKey:['feed_types']});setSel(new Set());setBulkConfirm(false)},
    onError:(e:any)=>{
      if(e.message?.includes('foreign key')||e.code==='23503')
        toast.error('Some feed types could not be deleted — they have linked records')
      else toast.error(e.message)
      setBulkConfirm(false)
    }
  })

  const toggleMut=useMutation({
    mutationFn:async(row:any)=>{const{error}=await supabase.from('feed_types').update({is_active:!row.is_active}).eq('id',row.id);if(error)throw error},
    onSuccess:()=>qc.invalidateQueries({queryKey:['feed_types']}),
    onError:(e:any)=>toast.error(e.message)
  })

  const rows=data??[]
  const ids=rows.map((r:any)=>r.id)
  const allSel=ids.length>0&&ids.every((id:string)=>sel.has(id))
  const someSel=ids.some((id:string)=>sel.has(id))
  const toggle=(id:string)=>setSel(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})
  const toggleAll=()=>setSel(s=>{const n=new Set(s);allSel?ids.forEach((id:string)=>n.delete(id)):ids.forEach((id:string)=>n.add(id));return n})

  const catColors:Record<string,any>={starter:'yellow',grower:'green',developer:'blue',pre_breeder:'orange',layer:'brand',male:'gray'}

  const handleExport=()=>exportCSV('feed_types.csv',
    ['code','name','category','week_from','week_to','sex','sort_order'],
    rows.map((r:any)=>[r.code,r.name,r.category,r.week_from,r.week_to,r.sex,r.sort_order])
  )

  const handleImport=async(file:File)=>{
    const{headers:hdrs,rows:fileRows}=await parseFile(file)
    const records=fileRows.map(vals=>{const obj:Record<string,string>={};hdrs.forEach((h,i)=>{obj[h]=vals[i]??''});return obj})
    const toUpsert=records.filter(r=>r.code&&r.name).map(r=>({
      code:r.code.toUpperCase().trim(),name:r.name.trim(),
      category:r.category||'layer',
      week_from:parseInt(r.week_from)||null,week_to:parseInt(r.week_to)||null,
      sex:r.sex||'female',sort_order:parseInt(r.sort_order)||0,
    }))
    if(!toUpsert.length){toast.error('No valid rows');return}
    const{error}=await supabase.from('feed_types').upsert(toUpsert,{onConflict:'code',ignoreDuplicates:true})
    if(error){toast.error(error.message);return}
    toast.success(`Imported ${toUpsert.length} feed types`)
    qc.invalidateQueries({queryKey:['feed_types']})
    if(importRef.current)importRef.current.value=''
  }

  return (
    <>
      <div className="space-y-4">
        <SectionHeader title="Feed Types" subtitle="Feed stage codes: BCM, BGM, L1, L2, L3... — editable"
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={()=>exportCSV('feed_types_template.csv',['code','name','category','week_from','week_to','sex','sort_order'],[['L1','Layer-1 Mash','layer','18','28','female','10']])}>Template</Button>
              <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={()=>importRef.current?.click()}>Import</Button>
              <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleImport(f)}}/>
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>
              <Button icon={<Plus size={16}/>} onClick={()=>open()}>Add Feed Type</Button>
            </div>
          }
        />
        <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={()=>setSel(new Set())} onDelete={()=>setBulkConfirm(true)}/>
        {isLoading?<Spinner/>:(
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allSel} indeterminate={someSel&&!allSel} onChange={toggleAll}/></Th>
                <Th>Code</Th><Th>Name</Th><Th>Category</Th><Th>Weeks</Th><Th>Sex</Th>
                <Th right>Order</Th><Th>Status</Th><Th></Th>
              </tr></thead>
              <tbody>{rows.map((r:any)=>(
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id)?'bg-blue-50':''}`}>
                  <Td><CB checked={sel.has(r.id)} onChange={()=>toggle(r.id)}/></Td>
                  <Td><span className="font-mono text-sm font-bold text-brand-700">{r.code}</span></Td>
                  <Td><span className="font-medium">{r.name}</span></Td>
                  <Td><Badge color={catColors[r.category]??'gray'}>{r.category}</Badge></Td>
                  <Td>{(r.week_from||r.week_to)?`Wk ${r.week_from??'?'}–${r.week_to??'?'}`:'—'}</Td>
                  <Td>{r.sex}</Td>
                  <Td right>{r.sort_order}</Td>
                  <Td>
                    <button onClick={()=>toggleMut.mutate(r)} className="focus:outline-none">
                      <Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge>
                    </button>
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={()=>open(r)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
                      <button onClick={()=>{if(confirm(`Delete feed type "${r.code}"?`))delMut.mutate(r.id)}}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}</tbody>
            </Table>
            {rows.length===0&&<EmptyState icon={<Settings size={32}/>} title="No feed types yet" action={<Button onClick={()=>open()} icon={<Plus size={16}/>}>Add</Button>}/>}
          </Card>
        )}
      </div>

      {bulkConfirm&&(
        <Modal open onClose={()=>setBulkConfirm(false)} title="Bulk Delete Feed Types" size="sm"
          footer={<><Button variant="secondary" onClick={()=>setBulkConfirm(false)}>Cancel</Button><Button variant="danger" loading={bulkDelMut.isPending} onClick={()=>bulkDelMut.mutate([...sel])}>Delete {sel.size} feed types</Button></>}>
          <p className="text-sm text-gray-700">Delete <strong>{sel.size} selected feed types</strong>? This cannot be undone.</p>
          <p className="text-xs text-gray-500 mt-2">Feed types with linked production or formula records cannot be deleted.</p>
        </Modal>
      )}

      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editing?`Edit Feed Type — ${editing.code}`:'Add Feed Type'} size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>{editing?'Update':'Save'}</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Input label="Code *" required value={form.code} onChange={e=>s('code',e.target.value)} hint="e.g. L1, BCM, MALE (auto-uppercased)"/>
            <Input label="Full Name *" required value={form.name} onChange={e=>s('name',e.target.value)} hint="e.g. Layer-1 Mash"/>
          </FormRow>
          <FormRow>
            <Select label="Category" options={['starter','grower','developer','pre_breeder','layer','male']} value={form.category} onChange={e=>s('category',e.target.value)}/>
            <Select label="Sex" options={['female','male','both']} value={form.sex} onChange={e=>s('sex',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="Week From" type="number" value={form.week_from} onChange={e=>s('week_from',e.target.value)} hint="Age week start"/>
            <Input label="Week To" type="number" value={form.week_to} onChange={e=>s('week_to',e.target.value)} hint="Age week end"/>
            <Input label="Sort Order" type="number" value={form.sort_order} onChange={e=>s('sort_order',e.target.value)}/>
          </FormRow>
          <Select label="Status" options={[{value:'true',label:'Active'},{value:'false',label:'Inactive'}]}
            value={String(form.is_active)} onChange={e=>s('is_active',e.target.value==='true')}/>
        </div>
      </Modal>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════
// VACCINATION SCHEDULE MASTER
// ══════════════════════════════════════════════════════════════════
const EMPTY_VACC = { sno: '', age_label: '', vaccine_name: '', dose: '', route: '', product: '' }
const ROUTES = ['S/C','I/M','I/O','D/W','N/D','W/W','Spray','Eye Drop','Drinking Water']
const routeColor: Record<string,any> = { 'S/C':'blue','I/M':'red','I/O':'green','D/W':'yellow','N/D':'orange','W/W':'gray','Spray':'purple','Eye Drop':'teal','Drinking Water':'blue' }

export const VaccinationSchedulePage: React.FC = () => {
  const qc = useQueryClient()
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['vaccination_schedule'],
    queryFn: async () => {
      const { data } = await supabase.from('vaccination_schedule').select('*').order('sno')
      return data ?? []
    }
  })

  const [sel, setSel] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_VACC)
  const [delId, setDelId] = useState<string|null>(null)
  const [bulkDel, setBulkDel] = useState(false)

  const ids = rows.map((r: any) => r.id)
  const allSel = ids.length > 0 && ids.every((id: string) => sel.has(id))
  const someSel = ids.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? ids.forEach((id: string) => n.delete(id)) : ids.forEach((id: string) => n.add(id)); return n })
  const f = (k: string) => (e: any) => setForm((p: any) => ({...p, [k]: e.target.value}))

  const saveMut = useMutation({
    mutationFn: async () => {
      const p = { sno: form.sno ? Number(form.sno) : null, age_label: form.age_label, vaccine_name: form.vaccine_name, dose: form.dose||null, route: form.route||null, product: form.product||null }
      if (editing) await supabase.from('vaccination_schedule').update(p).eq('id', editing.id)
      else await supabase.from('vaccination_schedule').insert(p)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vaccination_schedule'] }); setOpen(false); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { await supabase.from('vaccination_schedule').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vaccination_schedule'] }); setDelId(null); toast.success('Deleted') },
  })

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('vaccination_schedule').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vaccination_schedule'] }); setSel(new Set()); setBulkDel(false); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  const openNew  = () => { setEditing(null); setForm({...EMPTY_VACC}); setOpen(true) }
  const openEdit = (r: any) => { setEditing(r); setForm({...EMPTY_VACC,...r, sno: r.sno?.toString()??''}); setOpen(true) }

  function handleExport() {
    const toExport = sel.size > 0 ? rows.filter((r: any) => sel.has(r.id)) : rows
    exportCSV('vaccination_schedule.csv',
      ['S.No','Age','Vaccine Name','Dose','Route','Product'],
      toExport.map((r: any) => [r.sno, r.age_label, r.vaccine_name, r.dose??'', r.route??'', r.product??'']))
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Vaccination Schedule" subtitle="Narendra Breeder — Recommended Schedule" action={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" icon={<Download size={14}/>} onClick={handleExport}>
            {sel.size > 0 ? `Export ${sel.size}` : 'Export CSV'}
          </Button>
          <Button size="sm" icon={<Plus size={14}/>} onClick={openNew}>Add Entry</Button>
        </div>
      } />
      {sel.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-blue-700">{sel.size} selected</span>
          <button onClick={() => setBulkDel(true)} className="text-sm text-red-600 hover:underline font-medium">Delete selected</button>
          <button onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:text-gray-700 underline ml-auto">Clear</button>
        </div>
      )}
      {isLoading ? <Spinner /> : rows.length === 0 ? <EmptyState title="No schedule data." /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
              <Th>S.No</Th><Th>Age</Th><Th>Vaccine / Treatment</Th><Th>Dose</Th><Th>Route</Th><Th>Product</Th><Th></Th>
            </tr></thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id) ? 'bg-blue-50' : ''}`}>
                  <Td><CB checked={sel.has(r.id)} onChange={() => toggle(r.id)}/></Td>
                  <Td className="text-gray-400 text-xs font-mono">{r.sno}</Td>
                  <Td><span className="font-semibold text-sm">{r.age_label}</span></Td>
                  <Td className="font-medium">{r.vaccine_name}</Td>
                  <Td className="text-sm text-gray-600">{r.dose}</Td>
                  <Td>{r.route ? <Badge color={routeColor[r.route] ?? 'gray'}>{r.route}</Badge> : null}</Td>
                  <Td className="text-sm text-gray-600">{r.product}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)} className="p-1 text-blue-400 hover:text-blue-600"><Edit2 size={13}/></button>
                      <button onClick={() => setDelId(r.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Schedule Entry' : 'Add Schedule Entry'}
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save</Button></div>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="S.No" type="number" value={form.sno} onChange={f('sno')} />
            <Input label="Age Label *" value={form.age_label} onChange={f('age_label')} placeholder="e.g. Day 1, Week 4" required />
          </div>
          <Input label="Vaccine / Treatment Name *" value={form.vaccine_name} onChange={f('vaccine_name')} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Dose" value={form.dose} onChange={f('dose')} placeholder="e.g. 1 drop" />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Route</label>
              <select value={form.route} onChange={f('route')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Select route</option>
                {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <Input label="Product / Brand" value={form.product} onChange={f('product')} placeholder="e.g. Nobilis IB+ND" />
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Delete Entry"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button><Button variant="danger" onClick={() => delId && delMut.mutate(delId)} loading={delMut.isPending}>Delete</Button></div>}>
        <p className="text-sm text-gray-600">Delete this vaccination schedule entry?</p>
      </Modal>
      <Modal open={bulkDel} onClose={() => setBulkDel(false)} title="Delete Selected Entries"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setBulkDel(false)}>Cancel</Button><Button variant="danger" onClick={() => bulkDelMut.mutate(Array.from(sel))} loading={bulkDelMut.isPending}>Delete {sel.size} entries</Button></div>}>
        <p className="text-sm text-gray-600">Delete {sel.size} selected vaccination schedule entries?</p>
      </Modal>
    </div>
  )
}
