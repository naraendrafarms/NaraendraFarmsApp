import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td,
  Badge, SectionHeader, Spinner, EmptyState, Divider
} from '@/components/ui'
import { Plus, Edit2, Settings, Trash2, Merge, Download, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

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
}> = ({ title, subtitle, columns, data, onEdit, onAdd, loading, headerAction }) => (
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
            {columns.map(c => <Th key={c.key} right={c.right}>{c.label}</Th>)}
            <Th></Th>
          </tr></thead>
          <tbody>{data.map((row,i) => (
            <tr key={row.id??i} className="hover:bg-gray-50">
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
  const [form, setForm] = useState({code:'',name:'',site_type:'laying',address:'',taluka:'',elec_usc_1:'',contact:''})
  const s = (k:string,v:string) => setForm(f=>({...f,[k]:v}))

  const {data,isLoading} = useQuery({queryKey:['farms'],queryFn:async()=>{const{data}=await supabase.from('farms').select('*').order('name'); return data??[]}})

  const open = (row?:any) => {
    setEditing(row??null)
    setForm(row?{code:row.code,name:row.name,site_type:row.site_type,address:row.address??'',taluka:row.taluka??'',elec_usc_1:row.elec_usc_1??'',contact:row.contact??''}:{code:'',name:'',site_type:'laying',address:'',taluka:'',elec_usc_1:'',contact:''})
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if(!form.code||!form.name) throw new Error('Code and name required')
      const p={code:form.code.toUpperCase(),name:form.name,site_type:form.site_type,address:form.address||null,taluka:form.taluka||null,elec_usc_1:form.elec_usc_1||null,contact:form.contact||null}
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
          {label:'Elec USC',key:'elec_usc_1',render:r=><span className="text-xs text-gray-400">{r.elec_usc_1??'—'}</span>},
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
            <Input label="Electricity USC No" value={form.elec_usc_1} onChange={e=>s('elec_usc_1',e.target.value)} hint="Primary meter USC" />
            <Input label="Contact" value={form.contact} onChange={e=>s('contact',e.target.value)} />
          </FormRow>
          <Input label="Address" value={form.address} onChange={e=>s('address',e.target.value)} />
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

  return (
    <>
      <MasterTable title="Feed Ingredients" subtitle="Raw materials for feed production" loading={isLoading}
        data={data??[]} onAdd={()=>open()} onEdit={open}
        columns={[
          {label:'Code',key:'code',render:r=><span className="font-mono text-xs font-bold text-brand-700">{r.code}</span>},
          {label:'Name',key:'name'},
          {label:'Short Name',key:'short_name'},
          {label:'Category',key:'category',render:r=><Badge color="blue">{r.category}</Badge>},
          {label:'Unit',key:'unit'},
          {label:'Protein%',key:'protein_pct',right:true},
          {label:'Moisture%',key:'moisture_pct',right:true},
          {label:'Status',key:'is_active',render:r=><Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge>},
        ]}
      />
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
    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''))
    const records = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''))
      const obj: Record<string,string> = {}
      headers.forEach((h,i) => { obj[h] = vals[i] ?? '' })
      return obj
    })
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
              <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={()=>importRef.current?.click()}>Import CSV</Button>
              <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleImportParties(f)}}/>
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
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id)?'bg-red-50':''}`}>
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
  const [form, setForm] = useState({name:'',type:'medicine',unit:'ml',manufacturer:'',rate:''})
  const medImportRef = useRef<HTMLInputElement>(null)
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const {data,isLoading}=useQuery({queryKey:['medicines'],queryFn:async()=>{const{data}=await supabase.from('medicines_master').select('*').order('name');return data??[]}})

  const open=(row?:any)=>{
    setEditing(row??null)
    setForm(row?{name:row.name,type:row.type,unit:row.unit,manufacturer:row.manufacturer??'',rate:row.rate?.toString()??''}:{name:'',type:'medicine',unit:'ml',manufacturer:'',rate:''})
    setShowForm(true)
  }

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.name)throw new Error('Name required')
      const p={name:form.name,type:form.type,unit:form.unit,manufacturer:form.manufacturer||null,rate:parseFloat(form.rate)||null}
      if(editing){const{error}=await supabase.from('medicines_master').update(p).eq('id',editing.id);if(error)throw error}
      else{const{error}=await supabase.from('medicines_master').insert(p);if(error)throw error}
    },
    onSuccess:()=>{toast.success('Saved!');qc.invalidateQueries({queryKey:['medicines']});setShowForm(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const typeColors:Record<string,any>={medicine:'blue',vaccine:'green',supplement:'yellow',disinfectant:'red',other:'gray'}

  const handleExportMeds = () => {
    exportCSV('medicines_master.csv',
      ['name','type','unit','manufacturer','rate'],
      (data??[]).map((r:any)=>[r.name,r.type,r.unit,r.manufacturer,r.rate])
    )
  }

  const handleImportMeds = async (file: File) => {
    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''))
    const records = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''))
      const obj: Record<string,string> = {}
      headers.forEach((h,i) => { obj[h] = vals[i] ?? '' })
      return obj
    })
    const toUpsert = records.filter(r=>r.name).map(r=>({
      name: r.name, type: r.type||'medicine', unit: r.unit||'ml',
      manufacturer: r.manufacturer||null, rate: parseFloat(r.rate)||null,
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
      <MasterTable title="Medicines & Vaccines" subtitle="Medical and vaccine inventory" loading={isLoading}
        data={data??[]} onAdd={()=>open()} onEdit={open}
        headerAction={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={()=>exportCSV('medicines_template.csv',['name','type','unit','manufacturer','rate'],[['Newcastle Vaccine','vaccine','dose','Zoetis','15']])}>Template</Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={()=>medImportRef.current?.click()}>Import CSV</Button>
            <input ref={medImportRef} type="file" accept=".csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleImportMeds(f)}}/>
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExportMeds}>Export CSV</Button>
          </div>
        }
        columns={[
          {label:'Name',key:'name',render:r=><span className="font-medium">{r.name}</span>},
          {label:'Type',key:'type',render:r=><Badge color={typeColors[r.type]??'gray'}>{r.type}</Badge>},
          {label:'Unit',key:'unit'},
          {label:'Manufacturer',key:'manufacturer'},
          {label:'Rate',key:'rate',right:true,render:r=>r.rate?`Rs ${r.rate}`:'—'},
          {label:'Status',key:'is_active',render:r=><Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge>},
        ]}
      />
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
            <Input label="Rate per Unit (Rs)" type="number" step="0.01" value={form.rate} onChange={e=>s('rate',e.target.value)} />
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

  return (
    <>
      <MasterTable title="Hatcheries" subtitle="Hatchery buyers for HE dispatch" loading={isLoading}
        data={data??[]} onAdd={()=>open()} onEdit={open}
        columns={[
          {label:'Name',key:'name',render:r=><span className="font-medium">{r.name}</span>},
          {label:'Type',key:'type',render:r=><Badge color={r.type==='Hitech'?'green':r.type==='VHL'?'blue':'gray'}>{r.type}</Badge>},
          {label:'Location',key:'location'},
          {label:'City',key:'city'},
          {label:'Contact',key:'contact'},
          {label:'Status',key:'is_active',render:r=><Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge>},
        ]}
      />
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

  const farmOptions=farms?.map((f:any)=>({value:f.id,label:f.name}))??[]

  return (
    <>
      <MasterTable title="Electricity Meters" subtitle="Meter USC codes per site" loading={isLoading}
        data={data??[]} onAdd={()=>open()} onEdit={open}
        columns={[
          {label:'Meter Name',key:'meter_name',render:r=><span className="font-medium">{r.meter_name}</span>},
          {label:'Farm',key:'farm',render:r=><span className="text-xs font-mono text-brand-700">{r.farms?.code}</span>},
          {label:'USC No',key:'usc_no',render:r=><span className="font-mono text-sm">{r.usc_no}</span>},
          {label:'Service No',key:'service_no',render:r=><span className="text-xs text-gray-400">{r.service_no??'—'}</span>},
          {label:'Status',key:'is_active',render:r=><Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge>},
        ]}
      />
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
  const [form, setForm] = useState({code:'',name:'',category:'layer',week_from:'',week_to:'',sex:'female',sort_order:'0'})
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const {data,isLoading}=useQuery({queryKey:['feed_types'],queryFn:async()=>{const{data}=await supabase.from('feed_types').select('*').order('sort_order');return data??[]}})

  const open=(row?:any)=>{
    setEditing(row??null)
    setForm(row?{code:row.code,name:row.name,category:row.category,week_from:row.week_from?.toString()??'',week_to:row.week_to?.toString()??'',sex:row.sex,sort_order:row.sort_order?.toString()??'0'}:{code:'',name:'',category:'layer',week_from:'',week_to:'',sex:'female',sort_order:'0'})
    setShowForm(true)
  }

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.code||!form.name)throw new Error('Code and name required')
      const p={code:form.code.toUpperCase(),name:form.name,category:form.category,week_from:parseInt(form.week_from)||null,week_to:parseInt(form.week_to)||null,sex:form.sex,sort_order:parseInt(form.sort_order)||0}
      if(editing){const{error}=await supabase.from('feed_types').update(p).eq('id',editing.id);if(error)throw error}
      else{const{error}=await supabase.from('feed_types').insert(p);if(error)throw error}
    },
    onSuccess:()=>{toast.success('Saved!');qc.invalidateQueries({queryKey:['feed_types']});setShowForm(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const catColors:Record<string,any>={starter:'yellow',grower:'green',developer:'blue',pre_breeder:'orange',layer:'brand',male:'gray'}

  return (
    <>
      <MasterTable title="Feed Types" subtitle="Feed stages: BCM, BGM, L1, L2, L3..." loading={isLoading}
        data={data??[]} onAdd={()=>open()} onEdit={open}
        columns={[
          {label:'Code',key:'code',render:r=><span className="font-mono text-xs font-bold text-brand-700">{r.code}</span>},
          {label:'Name',key:'name',render:r=><span className="font-medium">{r.name}</span>},
          {label:'Category',key:'category',render:r=><Badge color={catColors[r.category]??'gray'}>{r.category}</Badge>},
          {label:'Weeks',key:'weeks',render:r=>(r.week_from||r.week_to)?`Wk ${r.week_from??'?'}–${r.week_to??'?'}`:'—'},
          {label:'Sex',key:'sex'},
          {label:'Order',key:'sort_order',right:true},
          {label:'Status',key:'is_active',render:r=><Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge>},
        ]}
      />
      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editing?'Edit Feed Type':'Add Feed Type'} size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>{editing?'Update':'Save'}</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Input label="Code" required value={form.code} onChange={e=>s('code',e.target.value)} hint="e.g. L1, BCM, MALE"/>
            <Input label="Full Name" required value={form.name} onChange={e=>s('name',e.target.value)} hint="e.g. Layer-1 Mash"/>
          </FormRow>
          <FormRow>
            <Select label="Category" options={['starter','grower','developer','pre_breeder','layer','male']} value={form.category} onChange={e=>s('category',e.target.value)}/>
            <Select label="Sex" options={['female','male','both']} value={form.sex} onChange={e=>s('sex',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="Week From" type="number" value={form.week_from} onChange={e=>s('week_from',e.target.value)}/>
            <Input label="Week To" type="number" value={form.week_to} onChange={e=>s('week_to',e.target.value)}/>
            <Input label="Sort Order" type="number" value={form.sort_order} onChange={e=>s('sort_order',e.target.value)}/>
          </FormRow>
        </div>
      </Modal>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════
// VACCINATION SCHEDULE MASTER
// ══════════════════════════════════════════════════════════════════
export const VaccinationSchedulePage: React.FC = () => {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['vaccination_schedule'],
    queryFn: async () => {
      const { data } = await supabase.from('vaccination_schedule').select('*').order('sno')
      return data ?? []
    }
  })

  function handleExport() {
    exportCSV('vaccination_schedule.csv',
      ['S.No','Age','Vaccine Name','Dose','Route','Product'],
      rows.map((r: any) => [r.sno, r.age_label, r.vaccine_name, r.dose??'', r.route??'', r.product??'']))
  }

  const routeColor: Record<string,any> = { 'S/C':'blue','I/M':'red','I/O':'green','D/W':'yellow','N/D':'orange','W/W':'gray' }

  return (
    <div className="space-y-4">
      <SectionHeader title="Vaccination Schedule" subtitle="Narendra Breeder — Recommended Schedule (67 entries)" action={
        <Button size="sm" variant="outline" onClick={handleExport}><Download size={14}/> Export CSV</Button>
      } />
      {isLoading ? <Spinner /> : rows.length === 0 ? <EmptyState title="No schedule data. Run migration 029 first." /> : (
        <Table>
          <thead><tr>
            <Th>S.No</Th><Th>Age</Th><Th>Vaccine / Treatment</Th><Th>Dose</Th><Th>Route</Th><Th>Product</Th>
          </tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <Td className="text-gray-400 text-xs font-mono">{r.sno}</Td>
                <Td><span className="font-semibold text-sm">{r.age_label}</span></Td>
                <Td className="font-medium">{r.vaccine_name}</Td>
                <Td className="text-sm text-gray-600">{r.dose}</Td>
                <Td>{r.route ? <Badge color={routeColor[r.route] ?? 'gray'}>{r.route}</Badge> : null}</Td>
                <Td className="text-sm text-gray-600">{r.product}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
