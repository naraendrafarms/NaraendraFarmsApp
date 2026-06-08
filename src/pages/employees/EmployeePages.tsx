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

// ── INDIVIDUAL SALARY ENTRY ──────────────────────────────────────
const FY_OPTIONS = [
  {value:'2024-25',label:'FY 2024-25'},
  {value:'2025-26',label:'FY 2025-26'},
]
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fyMonths(fy: string): string[] {
  const [startY] = fy.split('-').map(Number)
  const months: string[] = []
  for (let m = 4; m <= 12; m++) months.push(`${startY}-${String(m).padStart(2,'0')}-01`)
  for (let m = 1; m <= 3; m++) months.push(`${startY+1}-${String(m).padStart(2,'0')}-01`)
  return months
}

export const SalaryEntryPage: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [filterFarm, setFilterFarm] = useState('')
  const [selectedFY, setSelectedFY] = useState('2025-26')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [form, setForm] = useState({employee_id:'',month:'',days_worked:'',advance:'0',tds:'0',hold:'0',arrears:'0',ot_bonus:'0',net_salary:''})
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const months = fyMonths(selectedFY)

  const {data:farms}=useQuery({queryKey:['farms'],queryFn:async()=>{const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name');return data??[]}})
  const {data:employees}=useQuery({
    queryKey:['employees',filterFarm],
    queryFn:async()=>{
      let q=supabase.from('employees').select('id,name,emp_id,designation,base_salary,farms(name,code)').eq('is_active',true).order('name')
      if(filterFarm)q=q.eq('farm_id',filterFarm)
      const{data}=await q;return data??[]
    }
  })

  // Monthly totals for the whole FY (for summary cards)
  const {data:monthlySummary}=useQuery({
    queryKey:['salary_fy_summary',selectedFY,filterFarm],
    queryFn:async()=>{
      const [startM, endM] = [months[0], months[months.length-1]]
      let q=supabase.from('salary_monthly')
        .select('month,net_salary,earned_salary,advance,employees!inner(farm_id)')
        .gte('month',startM).lte('month',endM)
      if(filterFarm)q=q.eq('employees.farm_id',filterFarm)
      const{data}=await q
      const agg: Record<string,{net:number,earned:number,advance:number,count:number}> = {}
      for (const r of (data??[])) {
        const k = r.month.slice(0,7)
        if(!agg[k]) agg[k]={net:0,earned:0,advance:0,count:0}
        agg[k].net += r.net_salary??0
        agg[k].earned += r.earned_salary??0
        agg[k].advance += r.advance??0
        agg[k].count++
      }
      return agg
    }
  })

  // Detailed records for selected month
  const {data:salaries,isLoading:loadingDetail}=useQuery({
    queryKey:['salary_monthly_detail',selectedMonth,filterFarm],
    enabled:!!selectedMonth,
    queryFn:async()=>{
      let q=supabase.from('salary_monthly')
        .select('*, employees(name,emp_id,base_salary,designation,farms(name,code))')
        .eq('month',selectedMonth).order('net_salary',{ascending:false})
      if(filterFarm)q=q.eq('employees.farm_id',filterFarm)
      const{data}=await q;return data??[]
    }
  })

  const calcNet=()=>{
    const base=parseFloat(employees?.find((e:any)=>e.id===form.employee_id)?.base_salary??'0')||0
    const net=(base+(parseFloat(form.arrears)||0)+(parseFloat(form.ot_bonus)||0))-(parseFloat(form.advance)||0)-(parseFloat(form.tds)||0)-(parseFloat(form.hold)||0)
    setForm(f=>({...f,net_salary:net.toFixed(0)}))
  }

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.employee_id||!form.month)throw new Error('Employee and month required')
      const{error}=await supabase.from('salary_monthly').upsert({
        employee_id:form.employee_id,month:form.month+'-01',
        days_worked:parseInt(form.days_worked)||null,
        advance:parseFloat(form.advance)||0,
        tds:parseFloat(form.tds)||0,
        hold:parseFloat(form.hold)||0,
        arrears:parseFloat(form.arrears)||0,
        ot_bonus:parseFloat(form.ot_bonus)||0,
        net_salary:parseFloat(form.net_salary)||0,
      },{onConflict:'employee_id,month'})
      if(error)throw error
    },
    onSuccess:()=>{toast.success('Salary saved!');qc.invalidateQueries({queryKey:['salary_monthly','salary_fy_summary']});setShowForm(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const farmOptions=farms?.map((f:any)=>({value:f.id,label:f.name}))??[]
  const empOptions=employees?.map((e:any)=>({value:e.id,label:`${e.name} (${e.emp_id??e.farms?.code})`}))??[]

  const fyTotal = Object.values(monthlySummary??{}).reduce((s,m)=>s+m.net,0)
  const fyEmployees = Object.values(monthlySummary??{}).reduce((s,m)=>s+m.count,0)

  const selectedMonthData = selectedMonth && monthlySummary?.[selectedMonth.slice(0,7)]

  return (
    <div className="space-y-5">
      <SectionHeader title="Salary Register" subtitle="Year-wise and month-wise salary details"
        action={<Button icon={<Plus size={16}/>} onClick={()=>{setForm({employee_id:'',month:'',days_worked:'',advance:'0',tds:'0',hold:'0',arrears:'0',ot_bonus:'0',net_salary:''});setShowForm(true)}}>Add Entry</Button>}/>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <Select label="Financial Year" options={FY_OPTIONS} value={selectedFY} onChange={e=>{setSelectedFY(e.target.value);setSelectedMonth('')}} className="w-40"/>
        <Select label="" placeholder="All Sites" options={farmOptions} value={filterFarm} onChange={e=>setFilterFarm(e.target.value)} className="w-48"/>
        {filterFarm&&<Button variant="ghost" size="sm" onClick={()=>setFilterFarm('')}>Clear</Button>}
      </div>

      {/* FY Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <div className="text-xs text-gray-500">FY Total Net Salary</div>
          <div className="text-xl font-bold text-brand-700 mt-1">{inr(fyTotal)}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500">Monthly Avg</div>
          <div className="text-xl font-bold text-gray-800 mt-1">{inr(fyTotal/12)}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500">Total Employee-Months</div>
          <div className="text-xl font-bold text-gray-800 mt-1">{fyEmployees.toLocaleString('en-IN')}</div>
        </Card>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {months.map(m => {
          const key = m.slice(0,7)
          const d = monthlySummary?.[key]
          const [yr,mn] = key.split('-')
          const label = `${MONTH_NAMES[parseInt(mn)-1]} ${yr}`
          const isSelected = selectedMonth === m
          return (
            <button key={m} onClick={()=>setSelectedMonth(isSelected?'':m)}
              className={`rounded-lg border p-3 text-left transition-all ${isSelected?'border-brand-500 bg-brand-50':'border-gray-200 bg-white hover:border-brand-300'}`}>
              <div className="text-xs font-semibold text-gray-600">{label}</div>
              {d ? (
                <>
                  <div className="text-sm font-bold text-brand-700 mt-1">{inr(d.net)}</div>
                  <div className="text-[10px] text-gray-400">{d.count} employees</div>
                </>
              ) : (
                <div className="text-xs text-gray-300 mt-1">No data</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Detail table for selected month */}
      {selectedMonth && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {MONTH_NAMES[parseInt(selectedMonth.slice(5,7))-1]} {selectedMonth.slice(0,4)} — Salary Details
              </h3>
              {selectedMonthData && (
                <p className="text-xs text-gray-500">{selectedMonthData.count} employees · Net: {inr(selectedMonthData.net)} · Advance: {inr(selectedMonthData.advance)}</p>
              )}
            </div>
            <button onClick={()=>setSelectedMonth('')} className="text-gray-400 hover:text-gray-600 text-sm">✕ Close</button>
          </div>
          {loadingDetail?<div className="p-6 text-center"><Spinner/></div>:(
            <Table>
              <thead><tr>
                <Th>Employee</Th><Th>Site</Th><Th right>Days</Th>
                <Th right>Earned</Th><Th right>Advance</Th><Th right>TDS</Th><Th right>Net Salary</Th>
              </tr></thead>
              <tbody>
                {salaries?.map((s:any)=>(
                  <tr key={s.id} className="hover:bg-gray-50">
                    <Td><span className="font-medium">{s.employees?.name}</span><span className="text-xs text-gray-400 ml-1">{s.employees?.emp_id}</span></Td>
                    <Td className="text-xs">{s.employees?.farms?.name??'HO/Others'}</Td>
                    <Td right>{s.days_worked??'—'}</Td>
                    <Td right>{s.earned_salary?inr(s.earned_salary):'—'}</Td>
                    <Td right className="text-orange-600">{s.advance>0?inr(s.advance):'—'}</Td>
                    <Td right>{s.tds>0?inr(s.tds):'—'}</Td>
                    <Td right className="font-semibold text-green-700">{inr(s.net_salary)}</Td>
                  </tr>
                ))}
                {salaries && salaries.length>0 && (
                  <tr className="bg-gray-50 font-semibold">
                    <Td colSpan={3}>Total ({salaries.length} employees)</Td>
                    <Td right>{inr(salaries.reduce((s:number,r:any)=>s+(r.earned_salary??0),0))}</Td>
                    <Td right className="text-orange-600">{inr(salaries.reduce((s:number,r:any)=>s+(r.advance??0),0))}</Td>
                    <Td right>{inr(salaries.reduce((s:number,r:any)=>s+(r.tds??0),0))}</Td>
                    <Td right className="text-green-700">{inr(salaries.reduce((s:number,r:any)=>s+(r.net_salary??0),0))}</Td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
          {!loadingDetail&&!salaries?.length&&<EmptyState icon={<IndianRupee size={32}/>} title="No salary entries for this month" action={<Button onClick={()=>setShowForm(true)} icon={<Plus size={16}/>}>Add Entry</Button>}/>}
        </Card>
      )}

      <Modal open={showForm} onClose={()=>setShowForm(false)} title="Add Salary Entry" size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Select label="Site" placeholder="— Filter —" options={farmOptions} value={filterFarm} onChange={e=>setFilterFarm(e.target.value)}/>
            <Select label="Employee" required placeholder="— Select —" options={empOptions} value={form.employee_id} onChange={e=>s('employee_id',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="Month" required type="month" value={form.month} onChange={e=>s('month',e.target.value)}/>
            <Input label="Days Worked" type="number" value={form.days_worked} onChange={e=>s('days_worked',e.target.value)}/>
          </FormRow>
          <Divider label="Deductions"/>
          <FormRow>
            <Input label="Advance" type="number" value={form.advance} onChange={e=>s('advance',e.target.value)}/>
            <Input label="TDS" type="number" value={form.tds} onChange={e=>s('tds',e.target.value)}/>
            <Input label="Hold" type="number" value={form.hold} onChange={e=>s('hold',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="Arrears" type="number" value={form.arrears} onChange={e=>s('arrears',e.target.value)}/>
            <Input label="OT / Bonus" type="number" value={form.ot_bonus} onChange={e=>s('ot_bonus',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="Net Salary" required type="number" value={form.net_salary} onChange={e=>s('net_salary',e.target.value)}/>
            <div className="flex items-end"><Button variant="secondary" onClick={calcNet}>Auto Calc</Button></div>
          </FormRow>
        </div>
      </Modal>
    </div>
  )
}

// ── BONUS ENTRY ──────────────────────────────────────────────────
export const BonusPage: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [filterFarm, setFilterFarm] = useState('')
  const [form, setForm] = useState({employee_id:'',bonus_year:'',amount:'',bonus_type:'festival',paid_date:'',remarks:''})
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const {data:farms}=useQuery({queryKey:['farms'],queryFn:async()=>{const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name');return data??[]}})
  const {data:employees}=useQuery({queryKey:['employees',filterFarm],queryFn:async()=>{let q=supabase.from('employees').select('id,name,emp_id,farms(name,code)').eq('is_active',true).order('name');if(filterFarm)q=q.eq('farm_id',filterFarm);const{data}=await q;return data??[]}})
  const {data:bonuses,isLoading}=useQuery({queryKey:['bonuses'],queryFn:async()=>{const{data}=await supabase.from('bonus').select('*, employees(name,emp_id,farms(name,code))').order('paid_date',{ascending:false});return data??[]}})

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.employee_id||!form.bonus_year||!form.amount)throw new Error('Employee, year and amount required')
      const{error}=await supabase.from('bonus').upsert({
        employee_id:form.employee_id, bonus_year:parseInt(form.bonus_year),
        amount:parseFloat(form.amount), bonus_type:form.bonus_type,
        paid_date:form.paid_date||null, remarks:form.remarks||null,
      },{onConflict:'employee_id,bonus_year'})
      if(error)throw error
    },
    onSuccess:()=>{toast.success('Bonus saved!');qc.invalidateQueries({queryKey:['bonuses']});setShowForm(false)},
    onError:(e:any)=>toast.error(e.message)
  })

  const farmOptions=farms?.map((f:any)=>({value:f.id,label:f.name}))??[]
  const empOptions=employees?.map((e:any)=>({value:e.id,label:`${e.name} (${e.farms?.code})`}))??[]
  const totalBonus=bonuses?.reduce((s:number,b:any)=>s+(b.amount??0),0)??0

  return (
    <div className="space-y-5">
      <SectionHeader title="Bonus" subtitle={`Total bonus paid: ${inr(totalBonus)}`}
        action={<Button icon={<Plus size={16}/>} onClick={()=>{setForm({employee_id:'',bonus_year:new Date().getFullYear().toString(),amount:'',bonus_type:'festival',paid_date:'',remarks:''});setShowForm(true)}}>Add Bonus</Button>}/>
      <div className="flex gap-3">
        <Select label="" placeholder="All Sites" options={farmOptions} value={filterFarm} onChange={e=>setFilterFarm(e.target.value)} className="w-48"/>
        {filterFarm&&<Button variant="ghost" size="sm" onClick={()=>setFilterFarm('')}>Clear</Button>}
      </div>
      {isLoading?<Spinner/>:(
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Employee</Th><Th>Site</Th><Th right>Year</Th><Th>Type</Th>
              <Th right>Amount</Th><Th>Paid Date</Th><Th>Remarks</Th>
            </tr></thead>
            <tbody>
              {bonuses?.map((b:any)=>(
                <tr key={b.id} className="hover:bg-gray-50">
                  <Td className="font-medium">{b.employees?.name}</Td>
                  <Td className="text-xs">{b.employees?.farms?.name}</Td>
                  <Td right>{b.bonus_year}</Td>
                  <Td><Badge color="yellow">{b.bonus_type}</Badge></Td>
                  <Td right className="font-semibold text-green-700">{inr(b.amount)}</Td>
                  <Td>{b.paid_date??'—'}</Td>
                  <Td className="text-xs text-gray-400">{b.remarks??'—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {!bonuses?.length&&<EmptyState icon={<IndianRupee size={32}/>} title="No bonus records" action={<Button onClick={()=>setShowForm(true)} icon={<Plus size={16}/>}>Add Bonus</Button>}/>}
        </Card>
      )}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title="Add Bonus" size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Select label="Site" placeholder="— Filter —" options={farmOptions} value={filterFarm} onChange={e=>setFilterFarm(e.target.value)}/>
            <Select label="Employee" required placeholder="— Select —" options={empOptions} value={form.employee_id} onChange={e=>s('employee_id',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="Bonus Year" required type="number" value={form.bonus_year} onChange={e=>s('bonus_year',e.target.value)} hint="e.g. 2025"/>
            <Select label="Type" options={['festival','annual','performance','other']} value={form.bonus_type} onChange={e=>s('bonus_type',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="Amount" required type="number" value={form.amount} onChange={e=>s('amount',e.target.value)}/>
            <Input label="Paid Date" type="date" value={form.paid_date} onChange={e=>s('paid_date',e.target.value)}/>
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e=>s('remarks',e.target.value)}/>
        </div>
      </Modal>
    </div>
  )
}
