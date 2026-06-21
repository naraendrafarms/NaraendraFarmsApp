import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal,
  Table, Th, Td, Badge, SectionHeader, Spinner, Divider
} from '@/components/ui'
import {
  Shield, Users, Bird, Factory, Zap, IndianRupee,
  CheckCircle, AlertCircle, Plus, Edit2, ChevronRight,
  BookOpen, Trash2
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

// ── TAB IDs ──────────────────────────────────────────────────────
type Tab = 'overview' | 'users' | 'flocks' | 'elec' | 'salary' | 'masters'

// ── OVERVIEW TAB ─────────────────────────────────────────────────
const Overview: React.FC = () => {
  const { data: farms }    = useQuery({ queryKey:['farms'],    queryFn: async () => { const{data}=await supabase.from('farms').select('id,name,code,site_type').order('name');return data??[] } })
  const { data: flocks }   = useQuery({ queryKey:['flocks_all'],  queryFn: async () => { const{data}=await supabase.from('flocks').select('id,flock_no,status,laying_farm_id,rearing_farm_id,current_shed_id');return data??[] } })
  const { data: users }    = useQuery({ queryKey:['users_admin'], queryFn: async () => { const{data}=await supabase.from('profiles').select('id,full_name,role,is_active,farm_id');return data??[] } })
  const { data: sheds }    = useQuery({ queryKey:['sheds',''],   queryFn: async () => { const{data}=await supabase.from('sheds').select('id,farm_id,shed_no,shed_name,capacity_female');return data??[] } })
  const { data: meters }   = useQuery({ queryKey:['meters'],     queryFn: async () => { const{data}=await supabase.from('electricity_meters').select('id,meter_name,farm_id');return data??[] } })
  const { data: empls }    = useQuery({ queryKey:['employees',''],queryFn: async () => { const{data}=await supabase.from('employees').select('id,farm_id,is_active').eq('is_active',true);return data??[] } })

  const checks = [
    { label: 'Farm/Sites configured',   ok: (farms?.length??0)>0,  count: farms?.length??0,   link:'/masters/farms',    icon:<Factory size={16}/> },
    { label: 'Sheds configured',         ok: (sheds?.length??0)>0,  count: sheds?.length??0,   link:'/masters/sheds',    icon:<Factory size={16}/> },
    { label: 'Active flocks',            ok: (flocks?.filter((f:any)=>f.status==='active').length??0)>0, count: flocks?.filter((f:any)=>f.status==='active').length??0, link:'/flocks', icon:<Bird size={16}/> },
    { label: 'Flocks with shed assigned', ok: (flocks?.filter((f:any)=>f.current_shed_id).length??0)>0, count: flocks?.filter((f:any)=>f.current_shed_id).length??0, link:'#flocks', icon:<Bird size={16}/> },
    { label: 'Electricity meters',        ok: (meters?.length??0)>0, count: meters?.length??0, link:'/masters/meters',   icon:<Zap size={16}/> },
    { label: 'Active employees',          ok: (empls?.length??0)>0,  count: empls?.length??0,  link:'/employees',        icon:<Users size={16}/> },
    { label: 'App users',                 ok: (users?.length??0)>0,  count: users?.length??0,  link:'/admin/users',      icon:<Shield size={16}/> },
    { label: 'Site Incharges assigned',   ok: (users?.filter((u:any)=>u.role==='site_incharge'&&u.farm_id).length??0)>0, count: users?.filter((u:any)=>u.role==='site_incharge'&&u.farm_id).length??0, link:'/admin/users', icon:<Shield size={16}/> },
  ]

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Check what has been set up. Click any item to configure it.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {checks.map(c => (
          <Link key={c.label} to={c.link.startsWith('#') ? '#' : c.link}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.ok ? 'bg-green-100 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
              {c.ok ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{c.label}</p>
              <p className={`text-xs ${c.ok ? 'text-green-600' : 'text-orange-500'}`}>
                {c.count > 0 ? `${c.count} configured` : 'Not set up yet'}
              </p>
            </div>
            <ChevronRight size={14} className="text-gray-300"/>
          </Link>
        ))}
      </div>

      <Divider label="Farm Summary" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {farms?.map((f:any) => {
          const farmFlocks = flocks?.filter((fl:any) => fl.laying_farm_id===f.id||fl.rearing_farm_id===f.id) ?? []
          const farmSheds  = sheds?.filter((s:any) => s.farm_id===f.id) ?? []
          const farmEmpls  = empls?.filter((e:any) => e.farm_id===f.id) ?? []
          const incharge   = users?.find((u:any) => u.role==='site_incharge'&&u.farm_id===f.id)
          return (
            <Card key={f.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand-700">{f.code}</span>
                <Badge color={f.site_type==='laying'?'green':f.site_type==='rearing'?'yellow':'blue'}>{f.site_type}</Badge>
              </div>
              <p className="font-semibold text-gray-800 text-sm">{f.name}</p>
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>Flocks: <span className="font-medium text-gray-700">{farmFlocks.length}</span></p>
                <p>Sheds: <span className="font-medium text-gray-700">{farmSheds.length}</span></p>
                <p>Employees: <span className="font-medium text-gray-700">{farmEmpls.length}</span></p>
                <p>Incharge: {incharge
                  ? <span className="font-medium text-green-700">{incharge.full_name}</span>
                  : <span className="text-orange-500">Not assigned</span>}
                </p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── FLOCK SHED ASSIGNMENT ────────────────────────────────────────
const FlockShedAssign: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ flock_id:'', shed_id:'' })

  const { data: flocks, isLoading } = useQuery({
    queryKey: ['flocks_sheds'],
    queryFn: async () => {
      const{data}=await supabase.from('flocks')
        .select('id,flock_no,status,current_shed_id,sheds(shed_no,shed_name,farms(name,code)),placement_date,breed')
        .order('flock_no')
      return data??[]
    }
  })
  const { data: sheds } = useQuery({
    queryKey: ['sheds',''],
    queryFn: async () => {
      const{data}=await supabase.from('sheds').select('id,shed_no,shed_name,shed_type,farm_id,farms(name,code)').order('shed_no')
      return data??[]
    }
  })

  const selectedFlock = flocks?.find((f:any)=>f.id===form.flock_id)
  const shedOptions = sheds?.map((s:any)=>({value:s.id,label:`${s.farms?.code} — Shed ${s.shed_no}${s.shed_name?' ('+s.shed_name+')':''}`}))??[]

  const mut = useMutation({
    mutationFn: async () => {
      if(!form.flock_id) throw new Error('Select a flock')
      const{error}=await supabase.from('flocks').update({current_shed_id:form.shed_id||null}).eq('id',form.flock_id)
      if(error)throw error
    },
    onSuccess: ()=>{ toast.success('Shed assigned!'); qc.invalidateQueries({queryKey:['flocks_sheds']}); setShowForm(false) },
    onError: (e:any)=>toast.error(e.message)
  })

  const flockOptions = flocks?.map((f:any)=>({value:f.id,label:`Flock ${f.flock_no} (${f.status})`}))??[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Assign each flock to its current shed location.</p>
        <Button icon={<Plus size={16}/>} onClick={()=>{setForm({flock_id:'',shed_id:''});setShowForm(true)}}>Assign Shed</Button>
      </div>
      {isLoading?<Spinner/>:(
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Flock</Th><Th>Breed</Th><Th>Status</Th><Th>Placed</Th><Th>Current Shed</Th><Th></Th>
            </tr></thead>
            <tbody>
              {flocks?.map((f:any)=>(
                <tr key={f.id} className="hover:bg-gray-50">
                  <Td><span className="font-bold text-brand-700">Flock {f.flock_no}</span></Td>
                  <Td className="text-xs">{f.breed??'—'}</Td>
                  <Td><Badge color={f.status==='active'?'green':f.status==='closed'?'gray':'yellow'}>{f.status}</Badge></Td>
                  <Td className="text-xs">{f.placement_date??'—'}</Td>
                  <Td>
                    {f.sheds
                      ? <span className="font-medium text-green-700">{f.sheds.farms?.code} — Shed {f.sheds.shed_no}{f.sheds.shed_name?' ('+f.sheds.shed_name+')':''}</span>
                      : <span className="text-orange-500 text-xs">Not assigned</span>}
                  </Td>
                  <Td>
                    <button onClick={()=>{setForm({flock_id:f.id,shed_id:f.current_shed_id??''});setShowForm(true)}}
                      className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600">
                      <Edit2 size={13}/>
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title="Assign Flock to Shed" size="sm"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <Select label="Flock" required placeholder="— Select flock —" options={flockOptions} value={form.flock_id} onChange={e=>setForm(f=>({...f,flock_id:e.target.value}))}/>
          <Select label="Shed" placeholder="— Select shed —" options={shedOptions} value={form.shed_id} onChange={e=>setForm(f=>({...f,shed_id:e.target.value}))}/>
          {!form.shed_id && <p className="text-xs text-gray-400">Leave blank to un-assign the shed.</p>}
        </div>
      </Modal>
    </div>
  )
}

// ── ELECTRICITY COST ALLOCATION ──────────────────────────────────
const ElecAllocation: React.FC = () => {
  const qc = useQueryClient()
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0,7))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({})

  const { data: bills } = useQuery({
    queryKey: ['elec_bills_alloc', month],
    queryFn: async () => {
      const{data}=await supabase.from('electricity_bills')
        .select('*, electricity_meters(meter_name,farms(name,code))')
        .gte('bill_month',month+'-01').lte('bill_month',month+'-31')
      return data??[]
    }
  })
  const { data: flocks } = useQuery({
    queryKey: ['flocks_active'],
    queryFn: async () => { const{data}=await supabase.from('flocks').select('id,flock_no,laying_farm_id,rearing_farm_id').eq('status','active').order('flock_no'); return data??[] }
  })
  const { data: allocs } = useQuery({
    queryKey: ['elec_alloc', month],
    queryFn: async () => {
      const{data}=await supabase.from('electricity_allocation')
        .select('*').gte('month',month+'-01').lte('month',month+'-31')
      return data??[]
    }
  })

  const totalBill = bills?.reduce((s:number,b:any)=>s+(b.amount??0),0)??0
  const totalAllocated = allocs?.reduce((s:number,a:any)=>s+(a.amount??0),0)??0
  const flockOptions = flocks?.map((f:any)=>({value:f.id,label:`Flock ${f.flock_no}`}))??[]
  const billOptions  = bills?.map((b:any)=>({value:b.id,label:`${b.electricity_meters?.meter_name} — ${inr(b.amount)}`}))??[]

  const mut = useMutation({
    mutationFn: async () => {
      if(!form.bill_id||!form.flock_id||!form.amount) throw new Error('Bill, flock and amount required')
      const{error}=await supabase.from('electricity_allocation').upsert({
        bill_id:form.bill_id, flock_id:form.flock_id, month:month+'-01',
        amount:parseFloat(form.amount), units:parseFloat(form.units)||null, remarks:form.remarks||null
      },{onConflict:'bill_id,flock_id'})
      if(error)throw error
    },
    onSuccess:()=>{ toast.success('Allocation saved!'); qc.invalidateQueries({queryKey:['elec_alloc']}); setShowForm(false) },
    onError:(e:any)=>toast.error(e.message)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input label="" type="month" value={month} onChange={e=>setMonth(e.target.value)} className="w-44"/>
        <Button icon={<Plus size={16}/>} onClick={()=>{setForm({bill_id:'',flock_id:'',amount:'',units:'',remarks:''});setShowForm(true)}}>Add Allocation</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><p className="text-xs text-gray-400">Total Bill</p><p className="text-lg font-bold text-blue-700">{inr(totalBill)}</p></Card>
        <Card><p className="text-xs text-gray-400">Allocated</p><p className="text-lg font-bold text-green-700">{inr(totalAllocated)}</p></Card>
        <Card><p className="text-xs text-gray-400">Unallocated</p><p className={`text-lg font-bold ${totalBill-totalAllocated>0?'text-orange-600':'text-gray-400'}`}>{inr(totalBill-totalAllocated)}</p></Card>
      </div>

      <p className="text-xs text-gray-400">Bills this month: {bills?.length??0} meters | Electricity cost splits below.</p>
      {bills?.length===0 && <Card><p className="text-sm text-gray-400 text-center py-4">No electricity bills for {month}. Import bills first.</p></Card>}

      {(allocs?.length??0)>0&&(
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Meter</Th><Th>Flock</Th><Th right>Units</Th><Th right>Amount</Th><Th>Remarks</Th><Th></Th></tr></thead>
            <tbody>
              {allocs?.map((a:any)=>(
                <tr key={a.id} className="hover:bg-gray-50">
                  <Td className="text-xs">{bills?.find((b:any)=>b.id===a.bill_id)?.electricity_meters?.meter_name??'—'}</Td>
                  <Td>{flocks?.find((f:any)=>f.id===a.flock_id)?`Flock ${flocks?.find((f:any)=>f.id===a.flock_id)?.flock_no}`:'—'}</Td>
                  <Td right className="text-xs">{a.units??'—'}</Td>
                  <Td right className="font-medium">{inr(a.amount)}</Td>
                  <Td className="text-xs text-gray-400">{a.remarks??'—'}</Td>
                  <Td>
                    <button onClick={()=>{setForm({bill_id:a.bill_id,flock_id:a.flock_id,amount:a.amount?.toString(),units:a.units?.toString()??'',remarks:a.remarks??''});setShowForm(true)}}
                      className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="bg-gray-50 font-semibold">
              <Td colSpan={3}>Total Allocated</Td>
              <Td right>{inr(totalAllocated)}</Td><Td colSpan={2}></Td>
            </tr></tfoot>
          </Table>
        </Card>
      )}

      <Modal open={showForm} onClose={()=>setShowForm(false)} title="Electricity Cost Allocation" size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <Select label="Electricity Bill (Meter)" required placeholder="— Select meter —" options={billOptions} value={form.bill_id} onChange={e=>setForm((f:any)=>({...f,bill_id:e.target.value}))}/>
          <Select label="Allocate to Flock" required placeholder="— Select flock —" options={flockOptions} value={form.flock_id} onChange={e=>setForm((f:any)=>({...f,flock_id:e.target.value}))}/>
          <FormRow>
            <Input label="Amount (Rs)" required type="number" value={form.amount} onChange={e=>setForm((f:any)=>({...f,amount:e.target.value}))} hint="Portion of the bill for this flock"/>
            <Input label="Units (kWh)" type="number" value={form.units} onChange={e=>setForm((f:any)=>({...f,units:e.target.value}))}/>
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e=>setForm((f:any)=>({...f,remarks:e.target.value}))} hint="e.g. 60% allocated to Flock 16"/>
        </div>
      </Modal>
    </div>
  )
}

// ── SALARY ALLOCATION ────────────────────────────────────────────
const SalaryAllocation: React.FC = () => {
  const qc = useQueryClient()
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0,7))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({})

  const { data: abstracts } = useQuery({
    queryKey: ['salary_abstract', month],
    queryFn: async () => {
      const{data}=await supabase.from('salary_abstract')
        .select('*, farms(name,code)').gte('month',month+'-01').lte('month',month+'-31')
      return data??[]
    }
  })
  const { data: flocks } = useQuery({
    queryKey: ['flocks_active'],
    queryFn: async () => { const{data}=await supabase.from('flocks').select('id,flock_no,laying_farm_id').eq('status','active').order('flock_no');return data??[] }
  })
  const { data: salAllocs } = useQuery({
    queryKey: ['sal_alloc', month],
    queryFn: async () => {
      const{data}=await supabase.from('salary_allocation')
        .select('*').gte('month',month+'-01').lte('month',month+'-31')
      return data??[]
    }
  })

  const totalSalary = abstracts?.reduce((s:number,a:any)=>s+(a.net_salary??0),0)??0
  const totalAllocated = salAllocs?.reduce((s:number,a:any)=>s+(a.amount??0),0)??0
  const flockOptions  = flocks?.map((f:any)=>({value:f.id,label:`Flock ${f.flock_no}`}))??[]
  const absOptions    = abstracts?.map((a:any)=>({value:a.id,label:`${a.farms?.name} — ${inr(a.net_salary)}`}))??[]

  const mut = useMutation({
    mutationFn: async () => {
      if(!form.abstract_id||!form.flock_id||!form.amount) throw new Error('Site salary, flock and amount required')
      const{error}=await supabase.from('salary_allocation').upsert({
        abstract_id:form.abstract_id, flock_id:form.flock_id, month:month+'-01',
        amount:parseFloat(form.amount), pct:parseFloat(form.pct)||null, remarks:form.remarks||null
      },{onConflict:'abstract_id,flock_id'})
      if(error)throw error
    },
    onSuccess:()=>{ toast.success('Allocation saved!'); qc.invalidateQueries({queryKey:['sal_alloc']}); setShowForm(false) },
    onError:(e:any)=>toast.error(e.message)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input label="" type="month" value={month} onChange={e=>setMonth(e.target.value)} className="w-44"/>
        <Button icon={<Plus size={16}/>} onClick={()=>{setForm({abstract_id:'',flock_id:'',amount:'',pct:'',remarks:''});setShowForm(true)}}>Add Allocation</Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Card><p className="text-xs text-gray-400">Total Salary</p><p className="text-lg font-bold text-blue-700">{inr(totalSalary)}</p></Card>
        <Card><p className="text-xs text-gray-400">Allocated</p><p className="text-lg font-bold text-green-700">{inr(totalAllocated)}</p></Card>
        <Card><p className="text-xs text-gray-400">Unallocated</p><p className={`text-lg font-bold ${totalSalary-totalAllocated>0?'text-orange-600':'text-gray-400'}`}>{inr(totalSalary-totalAllocated)}</p></Card>
      </div>
      {abstracts?.length===0 && <Card><p className="text-sm text-gray-400 text-center py-4">No salary abstract for {month}. Import salary first.</p></Card>}
      {(salAllocs?.length??0)>0&&(
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Site</Th><Th>Flock</Th><Th right>%</Th><Th right>Amount</Th><Th>Remarks</Th><Th></Th></tr></thead>
            <tbody>
              {salAllocs?.map((a:any)=>(
                <tr key={a.id} className="hover:bg-gray-50">
                  <Td className="text-xs">{abstracts?.find((ab:any)=>ab.id===a.abstract_id)?.farms?.name??'—'}</Td>
                  <Td>{flocks?.find((f:any)=>f.id===a.flock_id)?`Flock ${flocks?.find((f:any)=>f.id===a.flock_id)?.flock_no}`:'—'}</Td>
                  <Td right className="text-xs">{a.pct?a.pct+'%':'—'}</Td>
                  <Td right className="font-medium">{inr(a.amount)}</Td>
                  <Td className="text-xs text-gray-400">{a.remarks??'—'}</Td>
                  <Td>
                    <button onClick={()=>{setForm({abstract_id:a.abstract_id,flock_id:a.flock_id,amount:a.amount?.toString(),pct:a.pct?.toString()??'',remarks:a.remarks??''});setShowForm(true)}}
                      className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="bg-gray-50 font-semibold">
              <Td colSpan={3}>Total Allocated</Td>
              <Td right>{inr(totalAllocated)}</Td><Td colSpan={2}></Td>
            </tr></tfoot>
          </Table>
        </Card>
      )}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title="Salary Cost Allocation" size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <Select label="Site Salary (Farm)" required placeholder="— Select farm abstract —" options={absOptions} value={form.abstract_id} onChange={e=>setForm((f:any)=>({...f,abstract_id:e.target.value}))}/>
          <Select label="Allocate to Flock" required placeholder="— Select flock —" options={flockOptions} value={form.flock_id} onChange={e=>setForm((f:any)=>({...f,flock_id:e.target.value}))}/>
          <FormRow>
            <Input label="Amount (Rs)" required type="number" value={form.amount} onChange={e=>setForm((f:any)=>({...f,amount:e.target.value}))}/>
            <Input label="% of Site Salary" type="number" step="0.1" value={form.pct} onChange={e=>setForm((f:any)=>({...f,pct:e.target.value}))} hint="Optional — for reference"/>
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e=>setForm((f:any)=>({...f,remarks:e.target.value}))} hint="e.g. BPET1 salary 100% to Flock 17"/>
        </div>
      </Modal>
    </div>
  )
}

// ── MASTERS HUB ─────────────────────────────────────────────────
// InlineMaster for categories_master / units_master (own tables)
const InlineMaster: React.FC<{
  title: string
  queryKey: string
  table: string
  placeholder: string
}> = ({ title, queryKey, table, placeholder }) => {
  const qc = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<number|null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDelId, setConfirmDelId] = useState<number|null>(null)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data } = await supabase.from(table).select('id,name,sort_order').order('sort_order').order('name')
      return data ?? []
    }
  })

  const addMut = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) throw new Error('Name required')
      const maxOrder = (rows as any[]).reduce((m: number, r: any) => Math.max(m, r.sort_order ?? 0), 0)
      const { error } = await supabase.from(table).insert({ name: newName.trim(), sort_order: maxOrder + 1 })
      if (error) throw error
    },
    onSuccess: () => { toast.success('Added!'); qc.invalidateQueries({ queryKey: [queryKey] }); setNewName('') },
    onError: (e: any) => toast.error(e.message)
  })

  const saveMut = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      if (!name.trim()) throw new Error('Name required')
      const { error } = await supabase.from(table).update({ name: name.trim() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Saved!'); qc.invalidateQueries({ queryKey: [queryKey] }); setEditId(null) },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Deleted!'); qc.invalidateQueries({ queryKey: [queryKey] }); setConfirmDelId(null) },
    onError: (e: any) => toast.error(e.message)
  })

  return (
    <Card className="space-y-3">
      <p className="font-semibold text-gray-700 text-sm">{title}</p>
      {isLoading ? <Spinner /> : (
        <div className="space-y-1.5">
          {(rows as any[]).map((r: any) => (
            <div key={r.id} className="flex items-center gap-2">
              {editId === r.id ? (
                <>
                  <Input label="" value={editName} onChange={e => setEditName(e.target.value)}
                    className="flex-1 text-sm" placeholder={placeholder} />
                  <Button size="sm" onClick={() => saveMut.mutate({ id: r.id, name: editName })} loading={saveMut.isPending}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                </>
              ) : confirmDelId === r.id ? (
                <>
                  <span className="flex-1 text-xs text-red-600">Delete "{r.name}"?</span>
                  <Button size="sm" variant="danger" onClick={() => delMut.mutate(r.id)} loading={delMut.isPending}>Yes</Button>
                  <Button size="sm" variant="secondary" onClick={() => setConfirmDelId(null)}>No</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-700 bg-gray-50 rounded px-2 py-1">{r.name}</span>
                  <button onClick={() => { setEditId(r.id); setEditName(r.name) }}
                    className="p-1 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
                  <button onClick={() => setConfirmDelId(r.id)}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <Input label="" value={newName} onChange={e => setNewName(e.target.value)}
          placeholder={`New ${placeholder.toLowerCase()}…`} className="flex-1 text-sm" />
        <Button size="sm" icon={<Plus size={14}/>} onClick={() => addMut.mutate()} loading={addMut.isPending}>Add</Button>
      </div>
    </Card>
  )
}

// InlineConfig for config_options table (uses grp column)
const InlineConfig: React.FC<{ title: string; grp: string; placeholder: string }> = ({ title, grp, placeholder }) => {
  const qc = useQueryClient()
  const [newVal, setNewVal] = useState('')
  const [editId, setEditId] = useState<number|null>(null)
  const [editVal, setEditVal] = useState('')
  const [confirmDelId, setConfirmDelId] = useState<number|null>(null)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['config_options', grp],
    queryFn: async () => {
      const { data } = await supabase.from('config_options').select('id,value,sort_order').eq('grp', grp).order('sort_order').order('value')
      return data ?? []
    }
  })

  const inv = () => qc.invalidateQueries({ queryKey: ['config_options', grp] })

  const addMut = useMutation({
    mutationFn: async () => {
      if (!newVal.trim()) throw new Error('Value required')
      const maxOrder = (rows as any[]).reduce((m: number, r: any) => Math.max(m, r.sort_order ?? 0), 0)
      const { error } = await supabase.from('config_options').insert({ grp, value: newVal.trim(), sort_order: maxOrder + 1 })
      if (error) throw error
    },
    onSuccess: () => { toast.success('Added!'); inv(); setNewVal('') },
    onError: (e: any) => toast.error(e.message)
  })

  const saveMut = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: string }) => {
      if (!value.trim()) throw new Error('Value required')
      const { error } = await supabase.from('config_options').update({ value: value.trim() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Saved!'); inv(); setEditId(null) },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('config_options').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Deleted!'); inv(); setConfirmDelId(null) },
    onError: (e: any) => toast.error(e.message)
  })

  return (
    <Card className="space-y-3">
      <p className="font-semibold text-gray-700 text-sm">{title}</p>
      {isLoading ? <Spinner /> : (
        <div className="space-y-1.5">
          {(rows as any[]).map((r: any) => (
            <div key={r.id} className="flex items-center gap-2">
              {editId === r.id ? (
                <>
                  <Input label="" value={editVal} onChange={e => setEditVal(e.target.value)} className="flex-1 text-sm" placeholder={placeholder} />
                  <Button size="sm" onClick={() => saveMut.mutate({ id: r.id, value: editVal })} loading={saveMut.isPending}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                </>
              ) : confirmDelId === r.id ? (
                <>
                  <span className="flex-1 text-xs text-red-600">Delete "{r.value}"?</span>
                  <Button size="sm" variant="danger" onClick={() => delMut.mutate(r.id)} loading={delMut.isPending}>Yes</Button>
                  <Button size="sm" variant="secondary" onClick={() => setConfirmDelId(null)}>No</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-700 bg-gray-50 rounded px-2 py-1">{r.value}</span>
                  <button onClick={() => { setEditId(r.id); setEditVal(r.value) }}
                    className="p-1 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
                  <button onClick={() => setConfirmDelId(r.id)}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <Input label="" value={newVal} onChange={e => setNewVal(e.target.value)}
          placeholder={`New ${placeholder.toLowerCase()}…`} className="flex-1 text-sm" />
        <Button size="sm" icon={<Plus size={14}/>} onClick={() => addMut.mutate()} loading={addMut.isPending}>Add</Button>
      </div>
    </Card>
  )
}

const MastersHub: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-gray-500">Edit the dropdown lists used across all entry pages. Changes take effect immediately.</p>

    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Inventory</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InlineMaster title="Inventory Categories" queryKey="categories_master" table="categories_master" placeholder="Category name" />
        <InlineMaster title="Units of Measure" queryKey="units_master" table="units_master" placeholder="Unit (kg, Ltr, Nos…)" />
      </div>
    </div>

    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Purchase / GRN</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InlineConfig title="Material Types (PO / GRN)" grp="material_type" placeholder="e.g. Feed Raw Material" />
        <InlineConfig title="Purchase Categories" grp="purchase_category" placeholder="e.g. Feed, Medicine" />
      </div>
    </div>

    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Payments</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InlineConfig title="Payment Methods" grp="payment_method" placeholder="e.g. NEFT, Cash" />
      </div>
    </div>

    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Flocks</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InlineConfig title="Bird Breeds" grp="breed" placeholder="e.g. VENCO-430" />
        <InlineConfig title="Feed Types (Daily Entry)" grp="feed_type" placeholder="e.g. L1, BCM" />
      </div>
    </div>

    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Employees</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InlineConfig title="Designations" grp="designation" placeholder="e.g. Farm Manager" />
      </div>
    </div>
  </div>
)

// ── MAIN ADMIN CENTRE ────────────────────────────────────────────
const TAB_PARAM_MAP: Record<string, Tab> = {
  overview: 'overview',
  flocks: 'flocks',
  electricity: 'elec',
  elec: 'elec',
  salary: 'salary',
  users: 'users',
  masters: 'masters',
}

export const AdminCentre: React.FC = () => {
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialTab: Tab = (tabParam && TAB_PARAM_MAP[tabParam]) ? TAB_PARAM_MAP[tabParam] : 'overview'
  const [tab, setTab] = useState<Tab>(initialTab)

  // Sync tab when URL param changes
  React.useEffect(() => {
    const p = searchParams.get('tab')
    if (p && TAB_PARAM_MAP[p]) setTab(TAB_PARAM_MAP[p])
    else setTab('overview')
  }, [searchParams])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id:'overview', label:'Setup Overview',       icon:<CheckCircle size={15}/> },
    { id:'masters',  label:'Masters',              icon:<BookOpen size={15}/> },
    { id:'flocks',   label:'Flock–Shed Assignment', icon:<Bird size={15}/> },
    { id:'elec',     label:'Electricity Allocation', icon:<Zap size={15}/> },
    { id:'salary',   label:'Salary Allocation',     icon:<IndianRupee size={15}/> },
    { id:'users',    label:'Users',                 icon:<Shield size={15}/> },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader title="Admin Centre" subtitle="Configure sites, flocks, users and cost allocations for full P&L" />

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap border-b border-gray-100 pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === t.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'masters'  && <MastersHub />}
      {tab === 'flocks'   && <FlockShedAssign />}
      {tab === 'elec'     && <ElecAllocation />}
      {tab === 'salary'   && <SalaryAllocation />}
      {tab === 'users'    && (
        <div className="text-center py-8">
          <Shield size={32} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500 mb-3">User management is on a dedicated page.</p>
          <Link to="/admin/users"><Button>Go to User Management</Button></Link>
        </div>
      )}
    </div>
  )
}
