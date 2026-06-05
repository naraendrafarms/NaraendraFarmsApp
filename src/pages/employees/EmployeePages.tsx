import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate } from '@/lib/utils'
import {
  Card, CardHeader, Button, Input, Select, FormRow, Modal, Divider,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState
} from '@/components/ui'
import { Plus, Users, IndianRupee, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

const DESIGNATIONS = ['Site Incharge','Farm Manager','Computer Operator','Site Supervisor',
  'Feed Mill Operator','Store Keeper','Driver','Security','Hatchery Staff','Watchman','Helper','Other']

// ── EMPLOYEE LIST ────────────────────────────────────────────────
export const EmployeeList: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [farmFilter, setFarmFilter] = useState('')

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
    joining_date:'', is_active:'true'
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
        joining_date: emp.joining_date??'', is_active: emp.is_active?'true':'false'
      })
    } else {
      setEditing(null)
      setForm({emp_id:'',name:'',designation:'',farm_id:'',department:'',
        base_salary:'',increment:'0',bank_name:'',bank_branch:'',account_no:'',ifsc:'',
        joining_date:'',is_active:'true'})
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
        is_active: form.is_active === 'true'
      }
      if (editing) { const {error}=await supabase.from('employees').update(payload).eq('id',editing.id); if(error)throw error }
      else { const {error}=await supabase.from('employees').insert(payload); if(error)throw error }
    },
    onSuccess: () => { toast.success('Saved!'); qc.invalidateQueries({queryKey:['employees']}); setShowForm(false) },
    onError: (e:any) => toast.error(e.message)
  })

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
      {isLoading ? <Spinner/> : (
        Object.entries(byFarm).map(([farm, emps]:any) => (
          <Card key={farm} padding={false}>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{farm}</h3>
              <Badge color="gray">{emps.length} employees</Badge>
            </div>
            <Table>
              <thead><tr>
                <Th>Emp ID</Th><Th>Name</Th><Th>Designation</Th>
                <Th right>Basic Salary</Th><Th right>Increment</Th>
                <Th>Bank</Th><Th>Status</Th><Th></Th>
              </tr></thead>
              <tbody>{emps.map((e:any)=>(
                <tr key={e.id} className="hover:bg-gray-50">
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
        ))
      )}
      {employees?.length===0 && <EmptyState icon={<Users size={32}/>} title="No employees yet" action={<Button onClick={()=>openEdit()} icon={<Plus size={16}/>}>Add Employee</Button>}/>}

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
          <Divider label="Bank Details" />
          <FormRow>
            <Input label="Bank Name" value={form.bank_name} onChange={e=>s('bank_name',e.target.value)} />
            <Input label="Branch" value={form.bank_branch} onChange={e=>s('bank_branch',e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Account No" value={form.account_no} onChange={e=>s('account_no',e.target.value)} />
            <Input label="IFSC Code" value={form.ifsc} onChange={e=>s('ifsc',e.target.value)} />
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

// ── SALARY ABSTRACT ENTRY ──────────────────────────────────────────
export const SalaryAbstractPage: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [filterMonth, setFilterMonth] = useState('')

  const { data: farms } = useQuery({ queryKey:['farms'], queryFn: async()=>{const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name'); return data??[]} })

  const { data: abstracts, isLoading } = useQuery({
    queryKey:['salary_abstract', filterMonth],
    queryFn: async () => {
      let q = supabase.from('salary_abstract').select('*, farms(name,code)').order('month',{ascending:false})
      if (filterMonth) q = q.eq('month', filterMonth+'-01')
      const {data}=await q; return data??[]
    }
  })

  const [form, setForm] = useState({farm_id:'',month:'',total_salary:'',total_advance:'0',net_salary:'',employee_count:''})
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.farm_id||!form.month||!form.total_salary) throw new Error('Site, month and salary required')
      const {error}=await supabase.from('salary_abstract').upsert({
        farm_id:form.farm_id, month:form.month+'-01',
        total_salary:parseFloat(form.total_salary), total_advance:parseFloat(form.total_advance)||0,
        net_salary:parseFloat(form.net_salary)||parseFloat(form.total_salary)-parseFloat(form.total_advance||'0'),
        employee_count:parseInt(form.employee_count)||null
      },{onConflict:'farm_id,month'})
      if(error) throw error
    },
    onSuccess: ()=>{ toast.success('Salary abstract saved!'); qc.invalidateQueries({queryKey:['salary_abstract']}); setShowForm(false) },
    onError: (e:any)=>toast.error(e.message)
  })

  const farmOptions=farms?.map((f:any)=>({value:f.id,label:f.name}))??[]

  return (
    <div className="space-y-5">
      <SectionHeader title="Salary Abstract" subtitle="Site-wise monthly salary summary"
        action={<Button icon={<Plus size={16}/>} onClick={()=>setShowForm(true)}>Add Entry</Button>} />
      <div className="flex gap-3">
        <Input label="" type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="w-48" />
        {filterMonth&&<Button variant="ghost" size="sm" onClick={()=>setFilterMonth('')}>Clear</Button>}
      </div>
      {isLoading?<Spinner/>:(
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Site</Th><Th>Month</Th><Th right>Earned Salary</Th><Th right>Advance</Th>
              <Th right>Net Salary</Th><Th right>Employees</Th>
            </tr></thead>
            <tbody>
              {abstracts?.map((a:any)=>(
                <tr key={a.id} className="hover:bg-gray-50">
                  <Td><span className="font-medium">{a.farms?.name}</span></Td>
                  <Td>{fmtDate(a.month)}</Td>
                  <Td right>{inr(a.total_salary)}</Td>
                  <Td right className="text-orange-600">{a.total_advance>0?inr(a.total_advance):'—'}</Td>
                  <Td right className="font-semibold text-green-700">{inr(a.net_salary)}</Td>
                  <Td right>{a.employee_count??'—'}</Td>
                </tr>
              ))}
            </tbody>
            {abstracts&&abstracts.length>0&&(
              <tfoot><tr className="bg-gray-50">
                <Td colSpan={2}><strong>TOTAL</strong></Td>
                <Td right><strong>{inr(abstracts.reduce((s:number,a:any)=>s+a.total_salary,0))}</strong></Td>
                <Td right><strong>{inr(abstracts.reduce((s:number,a:any)=>s+(a.total_advance||0),0))}</strong></Td>
                <Td right><strong>{inr(abstracts.reduce((s:number,a:any)=>s+a.net_salary,0))}</strong></Td>
                <Td right><strong>{abstracts.reduce((s:number,a:any)=>s+(a.employee_count||0),0)}</strong></Td>
              </tr></tfoot>
            )}
          </Table>
          {abstracts?.length===0&&<EmptyState icon={<IndianRupee size={32}/>} title="No salary data" action={<Button onClick={()=>setShowForm(true)} icon={<Plus size={16}/>}>Add Entry</Button>}/>}
        </Card>
      )}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title="Add Salary Abstract" size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Select label="Site / Farm" required placeholder="— Select —" options={farmOptions} value={form.farm_id} onChange={e=>s('farm_id',e.target.value)} />
            <Input label="Month" required type="month" value={form.month} onChange={e=>s('month',e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Total Earned Salary" required type="number" value={form.total_salary} onChange={e=>s('total_salary',e.target.value)} />
            <Input label="Total Advance" type="number" value={form.total_advance} onChange={e=>s('total_advance',e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Net Salary" type="number" value={form.net_salary}
              onChange={e=>s('net_salary',e.target.value)}
              hint={`Auto: ${inr((parseFloat(form.total_salary)||0)-(parseFloat(form.total_advance)||0))}`} />
            <Input label="No. of Employees" type="number" value={form.employee_count} onChange={e=>s('employee_count',e.target.value)} />
          </FormRow>
        </div>
      </Modal>
    </div>
  )
}
