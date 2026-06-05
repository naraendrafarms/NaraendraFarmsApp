import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td,
  Badge, SectionHeader, Spinner, EmptyState, Divider
} from '@/components/ui'
import { Plus, Edit2, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

// ── GENERIC MASTER TABLE ─────────────────────────────────────────
const MasterTable: React.FC<{
  title: string
  subtitle?: string
  columns: Array<{ label: string; key: string; right?: boolean; render?: (row: any) => React.ReactNode }>
  data: any[]
  onEdit: (row: any) => void
  onAdd: () => void
  loading: boolean
}> = ({ title, subtitle, columns, data, onEdit, onAdd, loading }) => (
  <div className="space-y-4">
    <SectionHeader title={title} subtitle={subtitle}
      action={<Button icon={<Plus size={16}/>} onClick={onAdd}>Add {title.replace(/s$/,'')}</Button>}
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
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({name:'',type:'supplier',category:'',contact:'',address:'',gstin:''})
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const {data,isLoading}=useQuery({queryKey:['parties'],queryFn:async()=>{const{data}=await supabase.from('parties').select('*').order('name');return data??[]}})

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

  return (
    <>
      <MasterTable title="Parties" subtitle="Buyers and suppliers" loading={isLoading}
        data={data??[]} onAdd={()=>open()} onEdit={open}
        columns={[
          {label:'Name',key:'name',render:r=><span className="font-medium">{r.name}</span>},
          {label:'Type',key:'type',render:r=><Badge color={r.type==='buyer'?'green':r.type==='supplier'?'blue':'orange'}>{r.type}</Badge>},
          {label:'Category',key:'category'},
          {label:'Contact',key:'contact'},
          {label:'GSTIN',key:'gstin',render:r=><span className="text-xs font-mono">{r.gstin??'—'}</span>},
          {label:'Status',key:'is_active',render:r=><Badge color={r.is_active?'green':'gray'}>{r.is_active?'Active':'Inactive'}</Badge>},
        ]}
      />
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

  return (
    <>
      <MasterTable title="Medicines & Vaccines" subtitle="Medical and vaccine inventory" loading={isLoading}
        data={data??[]} onAdd={()=>open()} onEdit={open}
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
