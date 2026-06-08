import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate } from '@/lib/utils'
import {
  Card, CardHeader, Button, Input, Select, FormRow, Modal, Divider,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState
} from '@/components/ui'
import { Plus, Users, IndianRupee, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const DESIGNATIONS = ['Site Incharge','Farm Manager','Computer Operator','Site Supervisor',
  'Feed Mill Operator','Store Keeper','Driver','Security','Hatchery Staff','Watchman','Helper','Other']

const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

const BulkBar: React.FC<{ count: number; onDelete: () => void; onClear: () => void; loading?: boolean }> = ({ count, onDelete, onClear, loading }) =>
  count === 0 ? null : (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
      <span className="text-sm font-medium text-red-700">{count} selected</span>
      <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
      <div className="ml-auto">
        <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} loading={loading} onClick={onDelete}>Delete {count} employees</Button>
      </div>
    </div>
  )

// ── EMPLOYEE LIST ────────────────────────────────────────────────
export const EmployeeList: React.FC = () => {
  const qc = useQueryClient()
  const [showForm,    setShowForm]    = useState(false)
  const [editing,     setEditing]     = useState<any>(null)
  const [farmFilter,  setFarmFilter]  = useState('')
  const [sel,         setSel]         = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name')
      return data ?? []
    }
  })

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', farmFilter],
    queryFn: async () => {
      let q = supabase.from('employees').select('*, farms(name,code)').order('name')
      if (farmFilter) q = q.eq('farm_id', farmFilter)
      const { data } = await q
      return data ?? []
    }
  })

  const [form, setForm] = useState({
    emp_id:'', name:'', designation:'', farm_id:'', department:'',
    base_salary:'', increment:'0', bank_name:'', bank_branch:'', account_no:'', ifsc:'',
    joining_date:'', dob:'', gender:'', mobile:'', esi_no:'', pf_no:'', is_active:'true'
  })
  const s = (k:string,v:string) => setForm(f=>({...f,[k]:v}))

  const openEdit = (emp?: any) => {
    if (emp) {
      setEditing(emp)
      setForm({
        emp_id: emp.emp_id??'', name: emp.name, designation: emp.designation??'',
        farm_id: emp.farm_id??'', department: emp.department??'',
        base_salary: emp.base_salary?.toString()??'', increment: emp.increment?.toString()??'0',
        bank_name: emp.bank_name??'', bank_branch: emp.bank_branch??'',
        account_no: emp.account_no??'', ifsc: emp.ifsc??'',
        joining_date: emp.joining_date??'', dob: emp.dob??'', gender: emp.gender??'',
        mobile: emp.mobile??'', esi_no: emp.esi_no??'', pf_no: emp.pf_no??'',
        is_active: emp.is_active?'true':'false'
      })
    } else {
      setEditing(null)
      setForm({emp_id:'',name:'',designation:'',farm_id:'',department:'',
        base_salary:'',increment:'0',bank_name:'',bank_branch:'',account_no:'',ifsc:'',
        joining_date:'',dob:'',gender:'',mobile:'',esi_no:'',pf_no:'',is_active:'true'})
    }
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.farm_id) throw new Error('Name and site required')
      const payload = {
        emp_id: form.emp_id || null, name: form.name, designation: form.designation || null,
        farm_id: form.farm_id, department: form.department || null,
        base_salary: parseFloat(form.base_salary) || null,
        increment: parseFloat(form.increment) || 0,
        bank_name: form.bank_name || null, bank_branch: form.bank_branch || null,
        account_no: form.account_no || null, ifsc: form.ifsc || null,
        joining_date: form.joining_date || null,
        dob: form.dob || null, gender: form.gender || null,
        mobile: form.mobile || null, esi_no: form.esi_no || null, pf_no: form.pf_no || null,
        is_active: form.is_active === 'true'
      }
      if (editing) { const {error}=await supabase.from('employees').update(payload).eq('id',editing.id); if(error)throw error }
      else { const {error}=await supabase.from('employees').insert(payload); if(error)throw error }
    },
    onSuccess: () => { toast.success('Saved!'); qc.invalidateQueries({queryKey:['employees']}); setShowForm(false) },
    onError: (e:any) => toast.error(e.message)
  })

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => { const{error}=await supabase.from('employees').delete().in('id',ids); if(error)throw error },
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({queryKey:['employees']}); setSel(new Set()); setBulkConfirm(false) },
    onError: (e:any) => { toast.error(e.message); setBulkConfirm(false) }
  })

  const allEmpIds = (employees??[]).map((e:any)=>e.id)
  const allSel = allEmpIds.length > 0 && allEmpIds.every((id:string)=>sel.has(id))
  const toggle = (id:string) => setSel(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})

  const farmOptions = farms?.map((f:any)=>({value:f.id,label:f.name}))??[]
  const byFarm = employees?.reduce((acc:any,e:any)=>{ const k=e.farms?.name||'Unknown'; (acc[k]??=[]).push(e); return acc; },{})??{}

  return (
    <div className="space-y-5">
      <SectionHeader title="Employees"
        subtitle={`${employees?.length??0} total employees`}
        action={<Button icon={<Plus size={16}/>} onClick={()=>openEdit()}>Add Employee</Button>}
      />
      <div className="flex gap-3">
        <Select label="" placeholder="All Sites" options={farmOptions} value={farmFilter}
          onChange={e=>setFarmFilter(e.target.value)} className="w-52" />
        {farmFilter && <Button variant="ghost" size="sm" onClick={()=>setFarmFilter('')}>Clear</Button>}
      </div>
      <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={()=>setSel(new Set())} onDelete={()=>setBulkConfirm(true)} />
      {isLoading ? <Spinner/> : (
        Object.entries(byFarm).map(([farm, emps]:any) => {
          const farmIds = emps.map((e:any)=>e.id)
          const farmAllSel = farmIds.length>0 && farmIds.every((id:string)=>sel.has(id))
          const farmSomeSel = farmIds.some((id:string)=>sel.has(id))
          const toggleFarm = () => setSel(s=>{const n=new Set(s);farmAllSel?farmIds.forEach((id:string)=>n.delete(id)):farmIds.forEach((id:string)=>n.add(id));return n})
          return (
          <Card key={farm} padding={false}>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{farm}</h3>
              <Badge color="gray">{emps.length} employees</Badge>
            </div>
            <Table>
              <thead><tr>
                <Th><CB checked={farmAllSel} indeterminate={farmSomeSel&&!farmAllSel} onChange={toggleFarm}/></Th>
                <Th>Emp ID</Th><Th>Name</Th><Th>Designation</Th>
                <Th right>Basic Salary</Th><Th right>Increment</Th>
                <Th>Bank</Th><Th>Status</Th><Th></Th>
              </tr></thead>
              <tbody>{emps.map((e:any)=>(
                <tr key={e.id} className={`hover:bg-gray-50 ${sel.has(e.id)?'bg-red-50':''}`}>
                  <Td><CB checked={sel.has(e.id)} onChange={()=>toggle(e.id)}/></Td>
                  <Td className="text-xs text-gray-400">{e.emp_id??'—'}</Td>
                  <Td><span className="font-medium">{e.name}</span></Td>
                  <Td className="text-xs">{e.designation??'—'}</Td>
                  <Td right>{e.base_salary?inr(e.base_salary):'—'}</Td>
                  <Td right className="text-xs">{e.increment?inr(e.increment):'—'}</Td>
                  <Td className="text-xs">{e.bank_name??'—'}</Td>
                  <Td><Badge color={e.is_active?'green':'gray'}>{e.is_active?'Active':'Left'}</Badge></Td>
                  <Td><button onClick={()=>openEdit(e)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button></Td>
                </tr>
              ))}</tbody>
            </Table>
          </Card>
          )
        })
      )}
      {employees?.length===0 && <EmptyState icon={<Users size={32}/>} title="No employees yet" action={<Button onClick={()=>openEdit()} icon={<Plus size={16}/>}>Add Employee</Button>}/>}

      {bulkConfirm&&(
        <Modal open onClose={()=>setBulkConfirm(false)} title="Bulk Delete Employees" size="sm"
          footer={<><Button variant="secondary" onClick={()=>setBulkConfirm(false)}>Cancel</Button><Button variant="danger" loading={bulkDelMut.isPending} onClick={()=>bulkDelMut.mutate([...sel])}>Delete {sel.size} employees</Button></>}>
          <p className="text-sm text-gray-700">Permanently delete <strong>{sel.size} selected employees</strong>? This cannot be undone.</p>
        </Modal>
      )}

      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editing?'Edit Employee':'Add Employee'} size="lg"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>{editing?'Update':'Save'}</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Input label="Employee ID" value={form.emp_id} onChange={e=>s('emp_id',e.target.value)} hint="e.g. BPS4008" />
            <Input label="Full Name" required value={form.name} onChange={e=>s('name',e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Site / Farm" required placeholder="— Select —" options={farmOptions} value={form.farm_id} onChange={e=>s('farm_id',e.target.value)} />
            <Select label="Designation" options={DESIGNATIONS} value={form.designation} onChange={e=>s('designation',e.target.value)} placeholder="— Select —" />
          </FormRow>
          <FormRow>
            <Input label="Basic Salary" type="number" value={form.base_salary} onChange={e=>s('base_salary',e.target.value)} />
            <Input label="Increment" type="number" value={form.increment} onChange={e=>s('increment',e.target.value)} />
          </FormRow>
          <Divider label="Personal Details" />
          <FormRow>
            <Input label="Date of Birth" type="date" value={form.dob} onChange={e=>s('dob',e.target.value)} />
            <Select label="Gender" placeholder="— Select —" options={['Male','Female','Other']} value={form.gender} onChange={e=>s('gender',e.target.value)} />
            <Input label="Mobile" value={form.mobile} onChange={e=>s('mobile',e.target.value)} />
          </FormRow>
          <Divider label="Bank Details" />
          <FormRow>
            <Input label="Bank Name" value={form.bank_name} onChange={e=>s('bank_name',e.target.value)} />
            <Input label="Branch" value={form.bank_branch} onChange={e=>s('bank_branch',e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Account No" value={form.account_no} onChange={e=>s('account_no',e.target.value)} />
            <Input label="IFSC Code" value={form.ifsc} onChange={e=>s('ifsc',e.target.value)} />
          </FormRow>
          <Divider label="Statutory" />
          <FormRow>
            <Input label="ESI No" value={form.esi_no} onChange={e=>s('esi_no',e.target.value)} hint="Employee State Insurance No" />
            <Input label="PF No" value={form.pf_no} onChange={e=>s('pf_no',e.target.value)} hint="Provident Fund No" />
          </FormRow>
          <FormRow>
            <Input label="Joining Date" type="date" value={form.joining_date} onChange={e=>s('joining_date',e.target.value)} />
            <Select label="Status" options={[{value:'true',label:'Active'},{value:'false',label:'Left / Inactive'}]} value={form.is_active} onChange={e=>s('is_active',e.target.value)} />
          </FormRow>
        </div>
      </Modal>
    </div>
  )
}

// ── SALARY ABSTRACT (auto-computed from salary_monthly) ────────────
export const SalaryAbstractPage: React.FC = () => {
  const [filterMonth, setFilterMonth] = useState('')

  const { data: rows, isLoading } = useQuery({
    queryKey: ['salary_abstract_computed', filterMonth],
    queryFn: async () => {
      let q = supabase
        .from('salary_monthly')
        .select('month, earned_salary, advance, net_salary, employees!inner(farm_id, farms(name,code))')
        .order('month', { ascending: false })
      if (filterMonth) q = q.eq('month', filterMonth + '-01')
      const { data, error } = await q
      if (error) throw error

      const agg: Record<string, { farm: string; farmCode: string; month: string; earned: number; advance: number; net: number; count: number }> = {}
      for (const r of (data ?? [])) {
        const emp = (r as any).employees
        const farm = emp?.farms?.name ?? 'Unknown'
        const farmCode = emp?.farms?.code ?? ''
        const key = `${emp?.farm_id ?? 'x'}__${r.month}`
        if (!agg[key]) agg[key] = { farm, farmCode, month: r.month, earned: 0, advance: 0, net: 0, count: 0 }
        agg[key].earned  += (r as any).earned_salary ?? 0
        agg[key].advance += (r as any).advance ?? 0
        agg[key].net     += (r as any).net_salary ?? 0
        agg[key].count++
      }
      return Object.values(agg).sort((a, b) => b.month.localeCompare(a.month) || a.farm.localeCompare(b.farm))
    }
  })

  const MONTH_NAMES2 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const fmtMonth = (m: string) => {
    const [yr, mn] = m.slice(0,7).split('-')
    return `${MONTH_NAMES2[parseInt(mn)-1]} ${yr}`
  }

  const byMonth: Record<string, any[]> = {}
  for (const r of (rows ?? [])) {
    const k = r.month.slice(0,7);
    (byMonth[k] ??= []).push(r)
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Salary Abstract" subtitle="Auto-computed site-wise monthly salary summary" />
      <div className="flex gap-3">
        <Input label="" type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="w-48" />
        {filterMonth&&<Button variant="ghost" size="sm" onClick={()=>setFilterMonth('')}>Clear</Button>}
      </div>
      {isLoading?<Spinner/>:(
        Object.entries(byMonth).map(([monthKey, farmRows]) => {
          const totEarned = farmRows.reduce((s,r)=>s+r.earned,0)
          const totAdv    = farmRows.reduce((s,r)=>s+r.advance,0)
          const totNet    = farmRows.reduce((s,r)=>s+r.net,0)
          const totCount  = farmRows.reduce((s,r)=>s+r.count,0)
          return (
            <Card key={monthKey} padding={false}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{fmtMonth(monthKey+'-01')}</h3>
                <Badge color="gray">{totCount} employees</Badge>
              </div>
              <Table>
                <thead><tr>
                  <Th>Site</Th><Th right>Employees</Th><Th right>Earned Salary</Th>
                  <Th right>Advance</Th><Th right>Net Salary</Th>
                </tr></thead>
                <tbody>
                  {farmRows.map(r=>(
                    <tr key={r.farm+r.month} className="hover:bg-gray-50">
                      <Td><span className="font-medium">{r.farm}</span>{r.farmCode&&<span className="text-xs text-gray-400 ml-1">({r.farmCode})</span>}</Td>
                      <Td right>{r.count}</Td>
                      <Td right>{inr(r.earned)}</Td>
                      <Td right className="text-orange-600">{r.advance>0?inr(r.advance):'—'}</Td>
                      <Td right className="font-semibold text-green-700">{inr(r.net)}</Td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-gray-50 font-semibold">
                  <Td>TOTAL</Td>
                  <Td right>{totCount}</Td>
                  <Td right>{inr(totEarned)}</Td>
                  <Td right className="text-orange-600">{totAdv>0?inr(totAdv):'—'}</Td>
                  <Td right className="text-green-700">{inr(totNet)}</Td>
                </tr></tfoot>
              </Table>
            </Card>
          )
        })
      )}
      {rows?.length===0&&<EmptyState icon={<IndianRupee size={32}/>} title="No salary data loaded" />}
    </div>
  )
}
