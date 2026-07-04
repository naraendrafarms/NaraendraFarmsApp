import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal, Textarea,
  Table, Th, Td, Badge, SectionHeader, Spinner, Divider
} from '@/components/ui'
import {
  Shield, Users, Bird, Factory, Zap, IndianRupee,
  CheckCircle, AlertCircle, Plus, Edit2, ChevronRight,
  BookOpen, Trash2, Building2
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

// ── TAB IDs ──────────────────────────────────────────────────────
type Tab = 'overview' | 'users' | 'flocks' | 'elec' | 'salary' | 'masters' | 'company'

// ── COMPANY PROFILE TAB ──────────────────────────────────────────
const CompanySettingsCard: React.FC = () => {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['company_settings'],
    queryFn: async () => {
      const { data } = await supabase.from('company_settings').select('*').limit(1).maybeSingle()
      return data
    },
  })
  const [form, setForm] = useState<any>(null)
  useEffect(() => { if (data) setForm(data) }, [data])
  const s = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        company_name: form.company_name || 'Naraendra Farms',
        address_line1: form.address_line1 || null,
        address_line2: form.address_line2 || null,
        gstin: form.gstin || null,
        office_phone: form.office_phone || null,
        billing_location: form.billing_location || null,
        site_location: form.site_location || null,
        site_contact_1: form.site_contact_1 || null,
        site_contact_2: form.site_contact_2 || null,
        po_terms: form.po_terms || null,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('company_settings').update(payload).eq('id', form.id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Company profile saved'); qc.invalidateQueries({ queryKey: ['company_settings'] }) },
    onError: (e: any) => toast.error(e.message),
  })

  if (isLoading || !form) return <Spinner />
  return (
    <Card className="space-y-4">
      <p className="text-sm font-semibold text-gray-700">Company Profile</p>
      <p className="text-xs text-gray-400">Used on the Purchase Order printout (letterhead, GSTIN, locations, terms &amp; conditions). This is the same company record used by Employees → Payslip Generator's "Company Settings" (PAN/PF/ESI reg. numbers are edited there).</p>
      <FormRow cols={2}>
        <Input label="Company Name" value={form.company_name ?? ''} onChange={e => s('company_name', e.target.value)} />
        <Input label="GSTIN" value={form.gstin ?? ''} onChange={e => s('gstin', e.target.value)} />
      </FormRow>
      <FormRow cols={2}>
        <Input label="Address Line 1" value={form.address_line1 ?? ''} onChange={e => s('address_line1', e.target.value)} />
        <Input label="Address Line 2" value={form.address_line2 ?? ''} onChange={e => s('address_line2', e.target.value)} />
      </FormRow>
      <FormRow cols={3}>
        <Input label="Office Phone" value={form.office_phone ?? ''} onChange={e => s('office_phone', e.target.value)} />
        <Input label="Billing Location" value={form.billing_location ?? ''} onChange={e => s('billing_location', e.target.value)} />
        <Input label="Site / Delivery Location" value={form.site_location ?? ''} onChange={e => s('site_location', e.target.value)} />
      </FormRow>
      <FormRow cols={2}>
        <Input label="Site Contact 1" value={form.site_contact_1 ?? ''} onChange={e => s('site_contact_1', e.target.value)} placeholder="Name / phone for delivery at site" />
        <Input label="Site Contact 2" value={form.site_contact_2 ?? ''} onChange={e => s('site_contact_2', e.target.value)} placeholder="Name / phone for delivery at site" />
      </FormRow>
      <Textarea label="Purchase Order — Terms & Conditions" rows={4} value={form.po_terms ?? ''} onChange={e => s('po_terms', e.target.value)} />
      <p className="text-xs text-gray-400 -mt-2">One point per line — shown as-is on the PO printout.</p>
      <Button onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save Company Profile</Button>
    </Card>
  )
}

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
                <Badge color={f.site_type==='laying'?'green':f.site_type==='rearing'?'yellow':'blue'}>{{laying:'Laying',rearing:'Rearing',feedmill:'Feed Mill',hatchery:'Hatchery',office:'Office'}[f.site_type as string]??f.site_type}</Badge>
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
  const [flockId, setFlockId] = useState('')
  const [shedIds, setShedIds] = useState<string[]>([])

  const { data: flocks, isLoading } = useQuery({
    queryKey: ['flocks_sheds'],
    queryFn: async () => {
      const{data}=await supabase.from('flocks')
        .select('id,flock_no,status,current_shed_id,placement_date,breed')
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
  // All flock→shed links (many-to-many)
  const { data: links } = useQuery({
    queryKey: ['flock_sheds_links'],
    queryFn: async () => {
      const{data}=await supabase.from('flock_sheds').select('flock_id,shed_id')
      return data??[]
    }
  })

  const shedLabel = (id:string) => {
    const s:any = sheds?.find((x:any)=>x.id===id)
    return s ? `${s.farms?.code} — Shed ${s.shed_no}${s.shed_name?' ('+s.shed_name+')':''}` : '—'
  }
  const shedsForFlock = (fid:string) => (links??[]).filter((l:any)=>l.flock_id===fid).map((l:any)=>l.shed_id)

  const openEdit = (f:any) => {
    setFlockId(f.id)
    setShedIds(shedsForFlock(f.id))
    setShowForm(true)
  }
  const openNew = () => { setFlockId(''); setShedIds([]); setShowForm(true) }
  const toggleShed = (id:string) =>
    setShedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])

  const mut = useMutation({
    mutationFn: async () => {
      if(!flockId) throw new Error('Select a flock')
      // Replace all links for this flock
      const { error: delErr } = await supabase.from('flock_sheds').delete().eq('flock_id', flockId)
      if(delErr) throw delErr
      if(shedIds.length){
        const rows = shedIds.map(sid => ({ flock_id: flockId, shed_id: sid }))
        const { error: insErr } = await supabase.from('flock_sheds').insert(rows)
        if(insErr) throw insErr
      }
      // Keep current_shed_id pointing at the first selected shed (backward compat)
      const { error: updErr } = await supabase.from('flocks')
        .update({ current_shed_id: shedIds[0] ?? null }).eq('id', flockId)
      if(updErr) throw updErr
    },
    onSuccess: ()=>{
      toast.success('Sheds updated!')
      qc.invalidateQueries({queryKey:['flocks_sheds']})
      qc.invalidateQueries({queryKey:['flock_sheds_links']})
      setShowForm(false)
    },
    onError: (e:any)=>toast.error(e.message)
  })

  const flockOptions = flocks?.map((f:any)=>({value:f.id,label:`Flock ${f.flock_no} (${f.status})`}))??[]

  // Group sheds by farm for the picker
  const shedsByFarm: Record<string, any[]> = {}
  for(const s of (sheds??[])){
    const farm = (s.farms as any)?.code ?? 'Other'
    if(!shedsByFarm[farm]) shedsByFarm[farm]=[]
    shedsByFarm[farm].push(s)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Assign each flock to one or more sheds. A flock can span multiple sheds.</p>
        <Button icon={<Plus size={16}/>} onClick={openNew}>Assign Sheds</Button>
      </div>
      {isLoading?<Spinner/>:(
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Flock</Th><Th>Breed</Th><Th>Status</Th><Th>Placed</Th><Th>Assigned Sheds</Th><Th></Th>
            </tr></thead>
            <tbody>
              {flocks?.map((f:any)=>{
                const fSheds = shedsForFlock(f.id)
                return (
                <tr key={f.id} className="hover:bg-gray-50">
                  <Td><span className="font-bold text-brand-700">Flock {f.flock_no}</span></Td>
                  <Td className="text-xs">{f.breed??'—'}</Td>
                  <Td><Badge color={f.status==='laying'?'green':f.status==='closed'?'gray':'yellow'}>{f.status}</Badge></Td>
                  <Td className="text-xs">{f.placement_date??'—'}</Td>
                  <Td>
                    {fSheds.length
                      ? <div className="flex flex-wrap gap-1">{fSheds.map((sid:string)=>(
                          <span key={sid} className="text-xs font-medium text-green-700 bg-green-50 rounded px-1.5 py-0.5">{shedLabel(sid)}</span>
                        ))}</div>
                      : <span className="text-orange-500 text-xs">Not assigned</span>}
                  </Td>
                  <Td>
                    <button onClick={()=>openEdit(f)}
                      className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600">
                      <Edit2 size={13}/>
                    </button>
                  </Td>
                </tr>
              )})}
            </tbody>
          </Table>
        </Card>
      )}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title="Assign Flock to Sheds" size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <Select label="Flock" required placeholder="— Select flock —" options={flockOptions} value={flockId} onChange={e=>{setFlockId(e.target.value); setShedIds(shedsForFlock(e.target.value))}}/>
          {flockId && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Sheds <span className="text-gray-400">({shedIds.length} selected)</span></p>
              <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {Object.entries(shedsByFarm).map(([farm, farmSheds])=>(
                  <div key={farm} className="p-2">
                    <p className="text-xs font-semibold text-brand-700 mb-1">{farm}</p>
                    <div className="space-y-1">
                      {farmSheds.map((s:any)=>(
                        <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                          <input type="checkbox" checked={shedIds.includes(s.id)} onChange={()=>toggleShed(s.id)}
                            className="rounded border-gray-300 text-brand-600"/>
                          <span>Shed {s.shed_no}{s.shed_name?' ('+s.shed_name+')':''}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Tick all sheds this flock occupies. Untick all to un-assign.</p>
            </div>
          )}
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

  // Distinct query key from the useConfigOptions hook — the hook filters to
  // active options only; this management list must show everything.
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['config_options_admin', grp],
    queryFn: async () => {
      const { data } = await supabase.from('config_options').select('id,value,sort_order,is_active').eq('grp', grp).order('sort_order').order('value')
      return data ?? []
    }
  })

  const inv = () => { qc.invalidateQueries({ queryKey: ['config_options_admin', grp] }); qc.invalidateQueries({ queryKey: ['config_options', grp] }) }

  const toggleActiveMut = useMutation({
    mutationFn: async (r: any) => {
      const { error } = await supabase.from('config_options').update({ is_active: !(r.is_active ?? true) }).eq('id', r.id)
      if (error) throw error
    },
    onSuccess: () => inv(),
    onError: (e: any) => toast.error(e.message)
  })

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
                  <Button size="sm" onClick={() => { if (confirm(`Renaming "${r.value}" only changes this dropdown — any existing record already saved with the old value won't be updated and will show the old text forever. Continue?`)) saveMut.mutate({ id: r.id, value: editVal }) }} loading={saveMut.isPending}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                </>
              ) : confirmDelId === r.id ? (
                <>
                  <span className="flex-1 text-xs text-red-600">Delete "{r.value}"? Existing records already saved with this value are NOT updated — they'll keep showing "{r.value}" even though it's no longer a valid option.</span>
                  <Button size="sm" variant="danger" onClick={() => delMut.mutate(r.id)} loading={delMut.isPending}>Yes</Button>
                  <Button size="sm" variant="secondary" onClick={() => setConfirmDelId(null)}>No</Button>
                </>
              ) : (
                <>
                  <span className={`flex-1 text-sm rounded px-2 py-1 ${r.is_active === false ? 'text-gray-400 bg-gray-100 line-through' : 'text-gray-700 bg-gray-50'}`}>
                    {r.value}{r.is_active === false && <span className="ml-1.5 text-[10px] uppercase tracking-wide no-underline text-amber-600 font-semibold">inactive</span>}
                  </span>
                  <button onClick={() => toggleActiveMut.mutate(r)} title={r.is_active === false ? 'Activate — show in dropdowns again' : 'Deactivate — hide from dropdowns without deleting'}
                    className="px-1.5 py-0.5 text-[10px] rounded border border-gray-200 text-gray-500 hover:text-amber-600 hover:border-amber-300">
                    {r.is_active === false ? 'On' : 'Off'}
                  </button>
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

// Editor for designation_extra_days (extra days paid per designation)
const ExtraDaysConfigCard: React.FC = () => {
  const qc = useQueryClient()
  const [editId, setEditId] = useState<string|null>(null)
  const [eGe, setEGe] = useState('')
  const [eLt, setELt] = useState('')
  const [newDesig, setNewDesig] = useState('')
  const [newGe, setNewGe] = useState('')
  const [newLt, setNewLt] = useState('')
  const [confirmDelId, setConfirmDelId] = useState<string|null>(null)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['designation_extra_days_admin'],
    queryFn: async () => {
      const { data } = await supabase.from('designation_extra_days')
        .select('id,designation,extra_days_ge15,extra_days_lt15').order('designation')
      return data ?? []
    }
  })

  const inv = () => {
    qc.invalidateQueries({ queryKey: ['designation_extra_days_admin'] })
    qc.invalidateQueries({ queryKey: ['designation_extra_days'] })
  }

  const addMut = useMutation({
    mutationFn: async () => {
      if (!newDesig.trim()) throw new Error('Designation required')
      const { error } = await supabase.from('designation_extra_days').insert({
        designation: newDesig.trim().toUpperCase(),
        extra_days_ge15: Number(newGe) || 0,
        extra_days_lt15: Number(newLt) || 0,
      })
      if (error) throw error
    },
    onSuccess: () => { toast.success('Added!'); inv(); setNewDesig(''); setNewGe(''); setNewLt('') },
    onError: (e: any) => toast.error(e.message)
  })

  const saveMut = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from('designation_extra_days').update({
        extra_days_ge15: Number(eGe) || 0,
        extra_days_lt15: Number(eLt) || 0,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Saved!'); inv(); setEditId(null) },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('designation_extra_days').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Deleted!'); inv(); setConfirmDelId(null) },
    onError: (e: any) => toast.error(e.message)
  })

  return (
    <Card className="space-y-3 sm:col-span-2 lg:col-span-3">
      <div>
        <p className="font-semibold text-gray-700 text-sm">Extra Days per Designation</p>
        <p className="text-xs text-gray-400">Extra days added to salary based on designation. "≥15 days" applies when paid days ≥ 15, otherwise "&lt;15 days" applies. Extra pay = gross rate ÷ month days × extra days.</p>
      </div>
      {isLoading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <Table>
            <thead><tr>
              <Th>Designation</Th>
              <Th right>Extra Days (≥15 paid)</Th>
              <Th right>Extra Days (&lt;15 paid)</Th>
              <Th></Th>
            </tr></thead>
            <tbody>
              {(rows as any[]).map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td className="font-medium">{r.designation}</Td>
                  {editId === r.id ? (
                    <>
                      <Td right><Input label="" type="number" value={eGe} onChange={e => setEGe(e.target.value)} className="w-20 text-right" /></Td>
                      <Td right><Input label="" type="number" value={eLt} onChange={e => setELt(e.target.value)} className="w-20 text-right" /></Td>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" onClick={() => saveMut.mutate({ id: r.id })} loading={saveMut.isPending}>Save</Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                        </div>
                      </Td>
                    </>
                  ) : confirmDelId === r.id ? (
                    <>
                      <Td colSpan={2} className="text-right text-xs text-red-600">Delete "{r.designation}"?</Td>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="danger" onClick={() => delMut.mutate(r.id)} loading={delMut.isPending}>Yes</Button>
                          <Button size="sm" variant="secondary" onClick={() => setConfirmDelId(null)}>No</Button>
                        </div>
                      </Td>
                    </>
                  ) : (
                    <>
                      <Td right>{r.extra_days_ge15}</Td>
                      <Td right>{r.extra_days_lt15}</Td>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => { setEditId(r.id); setEGe(String(r.extra_days_ge15)); setELt(String(r.extra_days_lt15)) }}
                            className="p-1 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
                          <button onClick={() => setConfirmDelId(r.id)}
                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
                        </div>
                      </Td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-end pt-1 border-t border-gray-100">
        <Input label="Designation" value={newDesig} onChange={e => setNewDesig(e.target.value)} placeholder="e.g. SUPERVISOR" className="flex-1 min-w-[160px]" />
        <Input label="Extra (≥15)" type="number" value={newGe} onChange={e => setNewGe(e.target.value)} className="w-24" />
        <Input label="Extra (&lt;15)" type="number" value={newLt} onChange={e => setNewLt(e.target.value)} className="w-24" />
        <Button size="sm" icon={<Plus size={14}/>} onClick={() => addMut.mutate()} loading={addMut.isPending}>Add</Button>
      </div>
    </Card>
  )
}

// Editor for skill_wages (minimum-wage floor per skill category, drives Basic split)
const SkillWagesCard: React.FC = () => {
  const qc = useQueryClient()
  const [editId, setEditId] = useState<number|null>(null)
  const [eName, setEName] = useState('')
  const [eWage, setEWage] = useState('')
  const [newName, setNewName] = useState('')
  const [newWage, setNewWage] = useState('')
  const [confirmDelId, setConfirmDelId] = useState<number|null>(null)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['skill_wages_admin'],
    queryFn: async () => {
      const { data } = await supabase.from('skill_wages')
        .select('id,skill_category,min_wage,sort_order').order('sort_order').order('skill_category')
      return data ?? []
    }
  })
  const inv = () => {
    qc.invalidateQueries({ queryKey: ['skill_wages_admin'] })
    qc.invalidateQueries({ queryKey: ['skill_wages'] })
  }

  const addMut = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) throw new Error('Category name required')
      const maxOrder = (rows as any[]).reduce((m: number, r: any) => Math.max(m, r.sort_order ?? 0), 0)
      const { error } = await supabase.from('skill_wages').insert({
        skill_category: newName.trim(), min_wage: Number(newWage) || 0, sort_order: maxOrder + 1,
      })
      if (error) throw error
    },
    onSuccess: () => { toast.success('Added!'); inv(); setNewName(''); setNewWage('') },
    onError: (e: any) => toast.error(e.message)
  })
  const saveMut = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      if (!eName.trim()) throw new Error('Category name required')
      const { error } = await supabase.from('skill_wages').update({
        skill_category: eName.trim(), min_wage: Number(eWage) || 0, updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Saved!'); inv(); setEditId(null) },
    onError: (e: any) => toast.error(e.message)
  })
  const delMut = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('skill_wages').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Deleted!'); inv(); setConfirmDelId(null) },
    onError: (e: any) => toast.error(e.message)
  })

  return (
    <Card className="space-y-3 sm:col-span-2 lg:col-span-3">
      <div>
        <p className="font-semibold text-gray-700 text-sm">Skill Category — Minimum Wage (Basic floor)</p>
        <p className="text-xs text-gray-400">Sets the minimum Basic for each skill category. When PF applies, Basic = max(50% of gross, this floor). Editable — changes apply to the next salary generation.</p>
      </div>
      {isLoading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <Table>
            <thead><tr><Th>Skill Category</Th><Th right>Min Wage (₹)</Th><Th></Th></tr></thead>
            <tbody>
              {(rows as any[]).map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  {editId === r.id ? (
                    <>
                      <Td><Input label="" value={eName} onChange={e => setEName(e.target.value)} className="min-w-[160px]" /></Td>
                      <Td right><Input label="" type="number" value={eWage} onChange={e => setEWage(e.target.value)} className="w-28 text-right" /></Td>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" onClick={() => saveMut.mutate({ id: r.id })} loading={saveMut.isPending}>Save</Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                        </div>
                      </Td>
                    </>
                  ) : confirmDelId === r.id ? (
                    <>
                      <Td colSpan={2} className="text-right text-xs text-red-600">Delete "{r.skill_category}"?</Td>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="danger" onClick={() => delMut.mutate(r.id)} loading={delMut.isPending}>Yes</Button>
                          <Button size="sm" variant="secondary" onClick={() => setConfirmDelId(null)}>No</Button>
                        </div>
                      </Td>
                    </>
                  ) : (
                    <>
                      <Td className="font-medium">{r.skill_category}</Td>
                      <Td right>{inr(r.min_wage)}</Td>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => { setEditId(r.id); setEName(r.skill_category); setEWage(String(r.min_wage)) }}
                            className="p-1 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
                          <button onClick={() => setConfirmDelId(r.id)}
                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
                        </div>
                      </Td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-end pt-1 border-t border-gray-100">
        <Input label="Skill Category" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. UnSkilled" className="flex-1 min-w-[160px]" />
        <Input label="Min Wage (₹)" type="number" value={newWage} onChange={e => setNewWage(e.target.value)} className="w-32" />
        <Button size="sm" icon={<Plus size={14}/>} onClick={() => addMut.mutate()} loading={addMut.isPending}>Add</Button>
      </div>
    </Card>
  )
}

// Read-only reference of the statutory rules the salary code applies (ESI / PF / PT).
const StatutoryRulesCard: React.FC = () => (
  <Card className="space-y-4 sm:col-span-2 lg:col-span-3">
    <div>
      <p className="font-semibold text-gray-700 text-sm">Statutory Rules used in salary calculation</p>
      <p className="text-xs text-gray-400">These are the exact rates/ceilings the app applies. Reference only — set ESI/PF/PT applicability and "Restrict PF" per employee in Employees.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* ESI */}
      <div className="border border-gray-100 rounded-lg p-3 space-y-1.5">
        <p className="text-sm font-semibold text-purple-700">ESI</p>
        <p className="text-xs text-gray-600">Applies only when <b>gross ≤ ₹21,000</b>. If gross &gt; 21,000 → ESI = 0.</p>
        <ul className="text-xs text-gray-700 list-disc ml-4 space-y-0.5">
          <li>Employee: <b>0.75%</b> of gross</li>
          <li>Employer: <b>3.25%</b> of gross</li>
        </ul>
      </div>

      {/* Basic split */}
      <div className="border border-gray-100 rounded-lg p-3 space-y-1.5">
        <p className="text-sm font-semibold text-amber-700">Basic / HRA / Allowance split</p>
        <p className="text-xs text-gray-600">From <b>Monthly Gross</b>:</p>
        <ul className="text-xs text-gray-700 list-disc ml-4 space-y-0.5">
          <li>PF <b>not</b> applicable → whole amount = Basic (all to employee)</li>
          <li>PF applicable → Basic = max(<b>50%</b> gross, skill <b>min-wage</b>)</li>
          <li>HRA = min(<b>30%</b> gross, gross − Basic)</li>
          <li>Allowance = balance</li>
          <li>Per-employee Basic/HRA/Allowance overrides win when set</li>
        </ul>
      </div>

      {/* PF */}
      <div className="border border-gray-100 rounded-lg p-3 space-y-1.5">
        <p className="text-sm font-semibold text-blue-700">PF (EPF)</p>
        <p className="text-xs text-gray-600">On <b>Basic</b>. If <b>Restrict PF</b> is on, Basic is capped at <b>₹15,000</b> (max PF ₹1,800).</p>
        <ul className="text-xs text-gray-700 list-disc ml-4 space-y-0.5">
          <li>Employee PF: <b>12%</b> of Basic (capped)</li>
          <li>Employer EPS: <b>8.33%</b> of min(Basic, 15,000)</li>
          <li>Employer EPF diff: PF − EPS</li>
          <li>Admin charges: <b>0.5%</b> of min(Basic, 15,000)</li>
          <li>EDLI: <b>0.5%</b> of min(Basic, 15,000)</li>
        </ul>
      </div>

      {/* PT */}
      <div className="border border-gray-100 rounded-lg p-3 space-y-1.5">
        <p className="text-sm font-semibold text-green-700">PT (Professional Tax)</p>
        <p className="text-xs text-gray-600">Telangana / AP slab, on monthly gross:</p>
        <ul className="text-xs text-gray-700 list-disc ml-4 space-y-0.5">
          <li>gross ≤ ₹15,000 → <b>₹0</b></li>
          <li>₹15,001 – ₹20,000 → <b>₹150</b></li>
          <li>above ₹20,000 → <b>₹200</b></li>
        </ul>
      </div>
    </div>

    <p className="text-xs text-gray-400">
      Net = Earned − PF(employee) − VPF − ESI(employee) − PT − LWF − TDS − Other Deduction − Advance.
      Extra-days pay per designation is configured above.
    </p>
  </Card>
)

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{title}</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
  </div>
)

const MastersHub: React.FC = () => (
  <div className="space-y-8">
    <p className="text-sm text-gray-500">
      All dropdown lists used across every page are managed here. No hardcoded options exist in the app — add, edit, or remove values and they reflect immediately in all forms.
    </p>

    <Section title="Items & Inventory">
      <InlineConfig title="Item Categories" grp="item_category" placeholder="e.g. Feed Ingredient, Medicine" />
      <InlineConfig title="Units of Measure" grp="unit" placeholder="e.g. kg, Ltr, Nos" />
      <InlineConfig title="Stock Adjustment Types" grp="adjustment_type" placeholder="e.g. Wastage, Damage" />
      <InlineConfig title="Feed Ingredient Sub-Types" grp="ingredient_category" placeholder="e.g. grain, protein, mineral" />
      <InlineConfig title="Medicine Sub-Types" grp="medicine_subtype" placeholder="e.g. Tablet, Liquid, Vial" />
      <InlineMaster title="Units Master (legacy)" queryKey="units_master" table="units_master" placeholder="Unit name" />
    </Section>

    <Section title="Purchase / GRN">
      <InlineConfig title="PO Material Types" grp="material_type" placeholder="e.g. Feed Raw Material" />
      <InlineConfig title="GRN Receipt Categories" grp="grn_category" placeholder="e.g. Feed, Medicine" />
      <InlineConfig title="Material Status" grp="material_status" placeholder="e.g. Pending, Received" />
      <InlineConfig title="GST Rates" grp="gst_rate" placeholder="e.g. 5, 12, 18" />
      <InlineConfig title="GST Supplier Types" grp="gst_supplier_type" placeholder="e.g. Registered" />
      <InlineConfig title="Purchase Nature" grp="purchase_nature" placeholder="e.g. Purchase, Expense" />
    </Section>

    <Section title="Payments">
      <InlineConfig title="Payment Methods" grp="payment_method" placeholder="e.g. NEFT, Cash, UPI" />
      <InlineConfig title="Payment Status" grp="payment_status" placeholder="e.g. Pending, Paid, HOLD" />
      <InlineConfig title="Invoice Source Types" grp="invoice_source" placeholder="e.g. GRN, Chick Purchase" />
    </Section>

    <Section title="Expenses">
      <InlineConfig title="Farm Expense Categories" grp="farm_expense" placeholder="e.g. maintenance, transport" />
      <InlineConfig title="Feed Mill Expense Categories" grp="feedmill_expense" placeholder="e.g. Labour, Electricity" />
      <InlineConfig title="Feed Mill Adjustment Types" grp="feedmill_adjustment" placeholder="e.g. Opening, Write-off" />
      <InlineConfig title="Expense Payment Modes" grp="expense_payment_mode" placeholder="e.g. Cash, Bank" />
    </Section>

    <Section title="Accounts / Cash Book">
      <InlineConfig title="Transaction Types" grp="txn_type" placeholder="e.g. receipt, payment" />
      <InlineConfig title="Cash Book Categories" grp="cashbook_category" placeholder="e.g. je_sale, salary" />
    </Section>

    <Section title="Flocks & Birds">
      <InlineConfig title="Bird Breeds" grp="breed" placeholder="e.g. VENCO-430, Cobb-500" />
      <InlineConfig title="Vaccine / Medicine Routes" grp="vaccine_route" placeholder="e.g. Drinking Water" />
      <InlineConfig title="Egg Types" grp="egg_type" placeholder="e.g. HE Grade A, JE Eggs" />
    </Section>

    <Section title="Employees">
      <InlineConfig title="Designations" grp="designation" placeholder="e.g. Farm Manager" />
      <InlineConfig title="Attendance Status" grp="attendance_status" placeholder="e.g. P, A, H" />
      <InlineConfig title="Advance Types" grp="advance_type" placeholder="e.g. Cash, Egg" />
      <SkillWagesCard />
      <ExtraDaysConfigCard />
    </Section>

    <Section title="Statutory (ESI / PF / PT)">
      <StatutoryRulesCard />
    </Section>

    <p className="text-xs text-gray-400">
      Feed Types are managed separately in <strong>Masters → Feed Types</strong>. Farms, Sites, Sheds, Hatcheries, and Vaccination Schedules have their own dedicated masters pages.
    </p>
  </div>
)

// ── MAIN ADMIN CENTRE ────────────────────────────────────────────
const TAB_PARAM_MAP: Record<string, Tab> = {
  overview: 'overview',
  company: 'company',
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
    { id:'company',  label:'Company Profile',      icon:<Building2 size={15}/> },
    { id:'masters',  label:'Masters',              icon:<BookOpen size={15}/> },
    { id:'flocks',   label:'Flock–Shed Assignment', icon:<Bird size={15}/> },
    { id:'elec',     label:'Electricity Allocation', icon:<Zap size={15}/> },
    { id:'salary',   label:'Salary Allocation',     icon:<IndianRupee size={15}/> },
    { id:'users',    label:'Users',                 icon:<Shield size={15}/> },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader title="Admin Centre" subtitle="Configure sites, flocks, users and cost allocations for full P&L" />

      {/* hidden — sidebar links drive tab via ?tab= param */}
      <div className="hidden">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'company'  && <CompanySettingsCard />}
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
