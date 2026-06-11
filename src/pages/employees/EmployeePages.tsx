import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate } from '@/lib/utils'
import {
  Card, CardHeader, Button, Input, Select, FormRow, Modal, Divider,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState
} from '@/components/ui'
import { Plus, Users, IndianRupee, Edit2, Trash2, Merge, Download, Upload, FileText, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import { useAuth, can } from '@/lib/auth'
import { parseFile } from '@/lib/parseFile'

// ── CSV export helper ─────────────────────────────────────────────
function exportCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

// ── Constants ─────────────────────────────────────────────────────
const DESIGNATIONS = ['Site Incharge','Farm Manager','Computer Operator','Site Supervisor',
  'Feed Mill Operator','Store Keeper','Driver','Security','Hatchery Staff','Watchman','Helper','Other']

const FY_OPTIONS = [
  {value:'2024-25',label:'FY 2024-25'},
  {value:'2025-26',label:'FY 2025-26'},
  {value:'2026-27',label:'FY 2026-27'},
]
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fyMonths(fy: string): string[] {
  const [startY] = fy.split('-').map(Number)
  const months: string[] = []
  for (let m = 4; m <= 12; m++) months.push(`${startY}-${String(m).padStart(2,'0')}-01`)
  for (let m = 1; m <= 3; m++) months.push(`${startY+1}-${String(m).padStart(2,'0')}-01`)
  return months
}

// ── Checkbox ──────────────────────────────────────────────────────
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
        <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} loading={loading} onClick={onDelete}>Delete {count} employees</Button>
      </div>
    </div>
  )

// ── EMPLOYEE LIST ────────────────────────────────────────────────
export const EmployeeList: React.FC = () => {
  const qc = useQueryClient()
  const { profile } = useAuth()
  const [showForm,    setShowForm]    = useState(false)
  const [editing,     setEditing]     = useState<any>(null)
  const [farmFilter,  setFarmFilter]  = useState('')
  const [sel,         setSel]         = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [mergeOpen,   setMergeOpen]   = useState(false)
  const [mergeKeepId, setMergeKeepId] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

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
      let q = supabase.from('employees')
        .select('*, farms(name,code)')
        .order('name')
      if (farmFilter) q = q.eq('farm_id', farmFilter)
      const { data } = await q
      return data ?? []
    }
  })

  const [form, setForm] = useState({
    emp_id:'', name:'', designation:'', farm_id:'', department:'',
    base_salary:'', increment:'0', bank_name:'', bank_branch:'', account_no:'', ifsc:'',
    joining_date:'', leaving_date:'', dob:'', gender:'', mobile:'', esi_no:'', pf_no:'',
    uan_no:'', is_active:'true',
    esi_applicable:'false', pf_applicable:'false', pt_applicable:'false'
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
        joining_date: emp.joining_date??'', leaving_date: emp.leaving_date??'',
        dob: emp.dob??'', gender: emp.gender??'',
        mobile: emp.mobile??'', esi_no: emp.esi_no??'', pf_no: emp.pf_no??'',
        uan_no: emp.uan_no??'',
        is_active: emp.is_active?'true':'false',
        esi_applicable: emp.esi_applicable?'true':'false',
        pf_applicable: emp.pf_applicable?'true':'false',
        pt_applicable: emp.pt_applicable?'true':'false',
      })
    } else {
      setEditing(null)
      setForm({emp_id:'',name:'',designation:'',farm_id:'',department:'',
        base_salary:'',increment:'0',bank_name:'',bank_branch:'',account_no:'',ifsc:'',
        joining_date:'',leaving_date:'',dob:'',gender:'',mobile:'',esi_no:'',pf_no:'',
        uan_no:'',is_active:'true',esi_applicable:'false',pf_applicable:'false',pt_applicable:'false'})
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
        joining_date: form.joining_date || null, leaving_date: form.leaving_date || null,
        dob: form.dob || null, gender: form.gender || null,
        mobile: form.mobile || null, esi_no: form.esi_no || null, pf_no: form.pf_no || null,
        uan_no: form.uan_no || null,
        is_active: form.is_active === 'true',
        esi_applicable: form.esi_applicable === 'true',
        pf_applicable: form.pf_applicable === 'true',
        pt_applicable: form.pt_applicable === 'true',
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

  const mergeMut = useMutation({
    mutationFn: async ({ keepId, dropIds }: { keepId: string; dropIds: string[] }) => {
      for (const oldId of dropIds) {
        await supabase.from('salary_monthly').update({ employee_id: keepId }).eq('employee_id', oldId)
        const { error } = await supabase.from('employees').delete().eq('id', oldId)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Merged — salary records remapped to kept employee')
      qc.invalidateQueries({ queryKey: ['employees'] })
      setSel(new Set()); setMergeOpen(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const { headers: hdrs, rows } = await parseFile(file)
    if (rows.length === 0) { toast.error('Empty file'); return }
    const records = rows.map(vals => { const obj: Record<string,string> = {}; hdrs.forEach((h,i) => { obj[h] = vals[i]??'' }); return obj })
    // Resolve farm names
    const { data: allFarms } = await supabase.from('farms').select('id,name')
    const farmMap: Record<string,string> = {}
    for (const f of (allFarms??[])) farmMap[f.name.toLowerCase()] = f.id

    const toUpsert = records.filter(r => r.name).map(r => ({
      emp_id: r.emp_id || null,
      name: r.name,
      designation: r.designation || null,
      farm_id: farmMap[r.farm_name?.toLowerCase()] || null,
      base_salary: parseFloat(r.base_salary) || null,
      mobile: r.mobile || null,
      esi_no: r.esi_no || null,
      pf_no: r.pf_no || null,
      uan_no: r.uan_no || null,
      bank_name: r.bank_name || null,
      account_no: r.account_no || null,
      ifsc: r.ifsc || null,
      joining_date: r.joining_date || null,
    }))

    if (!toUpsert.length) { toast.error('No valid rows'); return }
    const { error } = await supabase.from('employees').upsert(toUpsert, { onConflict: 'emp_id', ignoreDuplicates: false })
    if (error) { toast.error(error.message); return }
    toast.success(`Imported ${toUpsert.length} employees`)
    qc.invalidateQueries({ queryKey: ['employees'] })
    if (importRef.current) importRef.current.value = ''
  }

  const downloadTemplate = () => {
    exportCSV('employees_template.csv',
      ['emp_id','name','designation','farm_name','base_salary','mobile','esi_no','pf_no','uan_no','bank_name','account_no','ifsc','joining_date'],
      [['BPS4001','John Doe','Helper','Farm Name Here','8000','9876543210','','','','SBI','123456789','SBIN0001234','2024-01-01']]
    )
  }

  const allEmpIds = (employees??[]).map((e:any)=>e.id)
  const toggle = (id:string) => setSel(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})
  const farmOptions = farms?.map((f:any)=>({value:f.id,label:f.name}))??[]
  const byFarm = employees?.reduce((acc:any,e:any)=>{ const k=e.farms?.name||'Unknown'; (acc[k]??=[]).push(e); return acc; },{})??{}

  return (
    <div className="space-y-5">
      <SectionHeader title="Employees"
        subtitle={`${employees?.length??0} total employees`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={downloadTemplate}>Template</Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={()=>importRef.current?.click()}>Import CSV</Button>
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportCSV}/>
            <Button icon={<Plus size={16}/>} onClick={()=>openEdit()}>Add Employee</Button>
          </div>
        }
      />
      <div className="flex gap-3">
        <Select label="" placeholder="All Sites" options={farmOptions} value={farmFilter}
          onChange={e=>setFarmFilter(e.target.value)} className="w-52" />
        {farmFilter && <Button variant="ghost" size="sm" onClick={()=>setFarmFilter('')}>Clear</Button>}
      </div>
      <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={()=>setSel(new Set())} onDelete={()=>setBulkConfirm(true)}
        onMerge={()=>{ const first=[...sel][0]; setMergeKeepId(first); setMergeOpen(true) }} />
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
                <Th>Bank</Th><Th>ESI/PF</Th><Th>Status</Th><Th></Th>
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
                  <Td className="text-xs">
                    {e.esi_applicable&&<span className="mr-1 text-blue-600">ESI</span>}
                    {e.pf_applicable&&<span className="mr-1 text-purple-600">PF</span>}
                    {e.pt_applicable&&<span className="text-orange-600">PT</span>}
                    {!e.esi_applicable&&!e.pf_applicable&&!e.pt_applicable&&<span className="text-gray-300">—</span>}
                  </Td>
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
      {mergeOpen && (
        <Modal open onClose={()=>setMergeOpen(false)} title="Merge Duplicate Employees" size="md"
          footer={<>
            <Button variant="secondary" onClick={()=>setMergeOpen(false)}>Cancel</Button>
            <Button loading={mergeMut.isPending} onClick={()=>mergeMut.mutate({ keepId: mergeKeepId, dropIds: [...sel].filter(id=>id!==mergeKeepId) })}>
              Merge — Keep Selected
            </Button>
          </>}>
          <p className="text-sm text-gray-600 mb-4">Select which record to <strong>keep</strong>. All salary records linked to the others will be remapped to the kept employee, then duplicates are deleted.</p>
          <div className="space-y-2">
            {[...sel].map(id => {
              const emp = employees?.find((e:any)=>e.id===id)
              if (!emp) return null
              return (
                <label key={id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mergeKeepId===id?'border-brand-500 bg-brand-50':'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="mergeEmp" value={id} checked={mergeKeepId===id} onChange={()=>setMergeKeepId(id)} className="mt-0.5 text-brand-600"/>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.emp_id??'No ID'} · {emp.designation??'No designation'} · {emp.farms?.name??'No site'}</p>
                    <p className="text-xs text-gray-400">Salary: {emp.base_salary?`Rs ${emp.base_salary.toLocaleString('en-IN')}`:'—'}</p>
                    {mergeKeepId===id ? <span className="text-xs text-brand-600 font-medium">← Keep this one</span>
                      : <span className="text-xs text-red-500">Will be deleted after remapping</span>}
                  </div>
                </label>
              )
            })}
          </div>
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
          <FormRow>
            <Input label="Joining Date" type="date" value={form.joining_date} onChange={e=>s('joining_date',e.target.value)} />
            <Input label="Leaving Date" type="date" value={form.leaving_date} onChange={e=>s('leaving_date',e.target.value)} />
            <Select label="Status" options={[{value:'true',label:'Active'},{value:'false',label:'Left / Inactive'}]} value={form.is_active} onChange={e=>s('is_active',e.target.value)} />
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
            <Input label="UAN No" value={form.uan_no} onChange={e=>s('uan_no',e.target.value)} hint="UAN for PF" />
          </FormRow>
          <FormRow>
            <Select label="ESI Applicable" options={[{value:'true',label:'Yes'},{value:'false',label:'No'}]} value={form.esi_applicable} onChange={e=>s('esi_applicable',e.target.value)} />
            <Select label="PF Applicable" options={[{value:'true',label:'Yes'},{value:'false',label:'No'}]} value={form.pf_applicable} onChange={e=>s('pf_applicable',e.target.value)} />
            <Select label="PT Applicable" options={[{value:'true',label:'Yes'},{value:'false',label:'No'}]} value={form.pt_applicable} onChange={e=>s('pt_applicable',e.target.value)} />
          </FormRow>
        </div>
      </Modal>
    </div>
  )
}

// ── SALARY ABSTRACT ───────────────────────────────────────────────
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

  const fmtMonth = (m: string) => {
    const [yr, mn] = m.slice(0,7).split('-')
    return `${MONTH_NAMES[parseInt(mn)-1]} ${yr}`
  }

  const byMonth: Record<string, any[]> = {}
  for (const r of (rows ?? [])) {
    const k = r.month.slice(0,7);
    (byMonth[k] ??= []).push(r)
  }

  const handleExport = () => {
    if (!rows?.length) return
    exportCSV('salary_abstract.csv',
      ['Month','Site','Site Code','Employees','Earned Salary','Advance','Net Salary'],
      rows.map(r => [fmtMonth(r.month), r.farm, r.farmCode, r.count, r.earned, r.advance, r.net])
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Salary Abstract" subtitle="Auto-computed site-wise monthly salary summary"
        action={<Button variant="outline" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>}
      />
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

// ── SALARY ENTRY ──────────────────────────────────────────────────
export const SalaryEntryPage: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [filterFarm, setFilterFarm] = useState('')
  const [selectedFY, setSelectedFY] = useState('2025-26')
  const [selectedMonth, setSelectedMonth] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const blankForm = () => ({
    employee_id:'', month:'', days_worked:'',
    basic_salary:'', hra:'0', advance:'0', tds:'0', hold:'0', arrears:'0', ot_bonus:'0',
    esi_employee:'0', esi_employer:'0', pf_employee:'0', pf_employer:'0', pt:'0',
    gross_salary:'', net_salary:'', remarks:'',
    payment_mode:'Cash', payment_ref:'', is_paid:'false'
  })
  const [form, setForm] = useState(blankForm())
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const months = fyMonths(selectedFY)

  const {data:farms}=useQuery({queryKey:['farms'],queryFn:async()=>{const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name');return data??[]}})
  const {data:employees}=useQuery({
    queryKey:['employees_sal',filterFarm],
    queryFn:async()=>{
      let q=supabase.from('employees')
        .select('id,name,emp_id,designation,base_salary,esi_applicable,pf_applicable,pt_applicable,farms(name,code)')
        .eq('is_active',true).order('name')
      if(filterFarm)q=q.eq('farm_id',filterFarm)
      const{data}=await q;return data??[]
    }
  })

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

  const {data:salaries,isLoading:loadingDetail}=useQuery({
    queryKey:['salary_monthly_detail',selectedMonth,filterFarm],
    enabled:!!selectedMonth,
    queryFn:async()=>{
      let q=supabase.from('salary_monthly')
        .select('*, employees(name,emp_id,base_salary,designation,esi_applicable,pf_applicable,farms(name,code))')
        .eq('month',selectedMonth).order('net_salary',{ascending:false})
      if(filterFarm)q=q.eq('employees.farm_id',filterFarm)
      const{data}=await q;return data??[]
    }
  })

  const calcPayroll = () => {
    const emp = employees?.find((e:any) => e.id === form.employee_id)
    const basic = parseFloat(form.basic_salary) || parseFloat(emp?.base_salary) || 0
    const hra = parseFloat(form.hra) || 0
    const gross = basic + hra + (parseFloat(form.arrears)||0) + (parseFloat(form.ot_bonus)||0)
    const esi_emp = emp?.esi_applicable ? Math.round(gross * 0.0075) : 0
    const pf_emp = emp?.pf_applicable ? Math.round(basic * 0.12) : 0
    const pf_er = emp?.pf_applicable ? Math.round(basic * 0.12) : 0
    const esi_er = emp?.esi_applicable ? Math.round(gross * 0.0325) : 0
    const net = gross - esi_emp - pf_emp - (parseFloat(form.pt)||0) - (parseFloat(form.advance)||0) - (parseFloat(form.tds)||0) - (parseFloat(form.hold)||0)
    setForm(f => ({...f, gross_salary: gross.toFixed(0), esi_employee: esi_emp.toFixed(2), esi_employer: esi_er.toFixed(2), pf_employee: pf_emp.toFixed(2), pf_employer: pf_er.toFixed(2), net_salary: net.toFixed(0)}))
  }

  const openEditEntry = (rec: any) => {
    setEditingId(rec.id)
    setForm({
      employee_id: rec.employee_id,
      month: rec.month?.slice(0,7) ?? '',
      days_worked: rec.days_worked?.toString() ?? '',
      basic_salary: rec.basic_salary?.toString() ?? '',
      hra: rec.hra?.toString() ?? '0',
      advance: rec.advance?.toString() ?? '0',
      tds: rec.tds?.toString() ?? '0',
      hold: rec.hold?.toString() ?? '0',
      arrears: rec.arrears?.toString() ?? '0',
      ot_bonus: rec.ot_bonus?.toString() ?? '0',
      esi_employee: rec.esi_employee?.toString() ?? '0',
      esi_employer: rec.esi_employer?.toString() ?? '0',
      pf_employee: rec.pf_employee?.toString() ?? '0',
      pf_employer: rec.pf_employer?.toString() ?? '0',
      pt: rec.pt?.toString() ?? '0',
      gross_salary: rec.gross_salary?.toString() ?? '',
      net_salary: rec.net_salary?.toString() ?? '',
      remarks: rec.remarks ?? '',
      payment_mode: rec.payment_mode ?? 'Cash',
      payment_ref: rec.payment_ref ?? '',
      is_paid: rec.is_paid ? 'true' : 'false',
    })
    setShowForm(true)
  }

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.employee_id||!form.month)throw new Error('Employee and month required')
      const gross = parseFloat(form.gross_salary) || (parseFloat(form.basic_salary)||0) + (parseFloat(form.hra)||0)
      const payload = {
        employee_id:form.employee_id, month:form.month+'-01',
        days_worked:parseInt(form.days_worked)||null,
        basic_salary:parseFloat(form.basic_salary)||null,
        hra:parseFloat(form.hra)||0,
        gross_salary: gross,
        earned_salary: gross,
        advance:parseFloat(form.advance)||0,
        tds:parseFloat(form.tds)||0,
        hold:parseFloat(form.hold)||0,
        arrears:parseFloat(form.arrears)||0,
        ot_bonus:parseFloat(form.ot_bonus)||0,
        esi_employee:parseFloat(form.esi_employee)||0,
        esi_employer:parseFloat(form.esi_employer)||0,
        pf_employee:parseFloat(form.pf_employee)||0,
        pf_employer:parseFloat(form.pf_employer)||0,
        pt:parseFloat(form.pt)||0,
        net_salary:parseFloat(form.net_salary)||0,
        payment_mode:form.payment_mode||'Cash',
        payment_ref:form.payment_ref||null,
        is_paid:form.is_paid==='true',
        remarks:form.remarks||null,
      }
      const{error}=await supabase.from('salary_monthly').upsert(payload,{onConflict:'employee_id,month'})
      if(error)throw error
    },
    onSuccess:()=>{toast.success('Salary saved!');qc.invalidateQueries({queryKey:['salary_monthly_detail','salary_fy_summary']});setShowForm(false);setEditingId(null)},
    onError:(e:any)=>toast.error(e.message)
  })

  const delMut=useMutation({
    mutationFn:async(id:string)=>{const{error}=await supabase.from('salary_monthly').delete().eq('id',id);if(error)throw error},
    onSuccess:()=>{toast.success('Deleted');qc.invalidateQueries({queryKey:['salary_monthly_detail','salary_fy_summary']})},
    onError:(e:any)=>toast.error(e.message)
  })

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const { headers: hdrs, rows } = await parseFile(file)
    if (rows.length === 0) { toast.error('Empty file'); return }
    const records = rows.map(vals => { const obj: Record<string,string> = {}; hdrs.forEach((h,i) => { obj[h] = vals[i]??'' }); return obj })
    const { data: allEmps } = await supabase.from('employees').select('id,emp_id')
    const empMap: Record<string,string> = {}
    for (const e of (allEmps??[])) if(e.emp_id) empMap[e.emp_id] = e.id

    const toUpsert = records.filter(r=>r.emp_id&&r.month).map(r => {
      const basic = parseFloat(r.basic_salary)||0
      const hra = parseFloat(r.hra)||0
      const gross = basic + hra + (parseFloat(r.arrears)||0) + (parseFloat(r.ot_bonus)||0)
      const net = gross - (parseFloat(r.esi_employee)||0) - (parseFloat(r.pf_employee)||0) - (parseFloat(r.pt)||0) - (parseFloat(r.advance)||0) - (parseFloat(r.tds)||0)
      return {
        employee_id: empMap[r.emp_id],
        month: r.month.length===7 ? r.month+'-01' : r.month,
        days_worked: parseInt(r.days_worked)||null,
        basic_salary: basic||null, hra: hra||0,
        gross_salary: gross, earned_salary: gross,
        advance: parseFloat(r.advance)||0,
        arrears: parseFloat(r.arrears)||0,
        ot_bonus: parseFloat(r.ot_bonus)||0,
        tds: parseFloat(r.tds)||0,
        esi_employee: parseFloat(r.esi_employee)||0,
        pf_employee: parseFloat(r.pf_employee)||0,
        pt: parseFloat(r.pt)||0,
        net_salary: net,
        remarks: r.remarks||null,
      }
    }).filter(r=>r.employee_id)

    if (!toUpsert.length) { toast.error('No valid rows (emp_id not found)'); return }
    const { error } = await supabase.from('salary_monthly').upsert(toUpsert, { onConflict: 'employee_id,month' })
    if (error) { toast.error(error.message); return }
    toast.success(`Imported ${toUpsert.length} records`)
    qc.invalidateQueries({ queryKey: ['salary_monthly_detail','salary_fy_summary'] })
    if (importRef.current) importRef.current.value = ''
  }

  const exportMonth = () => {
    if (!salaries?.length) return
    exportCSV(`salary_${selectedMonth?.slice(0,7)}.csv`,
      ['Emp ID','Name','Site','Days','Basic','HRA','Gross','ESI Emp','ESI Er','PF Emp','PF Er','PT','Advance','TDS','Hold','Arrears','OT Bonus','Net','Payment Mode','Is Paid','Remarks'],
      salaries.map((r:any)=>[
        r.employees?.emp_id, r.employees?.name, r.employees?.farms?.name,
        r.days_worked, r.basic_salary, r.hra, r.gross_salary,
        r.esi_employee, r.esi_employer, r.pf_employee, r.pf_employer, r.pt,
        r.advance, r.tds, r.hold, r.arrears, r.ot_bonus, r.net_salary,
        r.payment_mode, r.is_paid?'Yes':'No', r.remarks
      ])
    )
  }

  const farmOptions=farms?.map((f:any)=>({value:f.id,label:f.name}))??[]
  const empOptions=employees?.map((e:any)=>({value:e.id,label:`${e.name} (${e.emp_id??e.farms?.code})`}))??[]
  const fyTotal = Object.values(monthlySummary??{}).reduce((s,m)=>s+m.net,0)
  const fyEmployees = Object.values(monthlySummary??{}).reduce((s,m)=>s+m.count,0)
  const selectedMonthData = selectedMonth && monthlySummary?.[selectedMonth.slice(0,7)]

  return (
    <div className="space-y-5">
      <SectionHeader title="Salary Register" subtitle="Year-wise and month-wise salary details"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={()=>exportCSV('salary_import_template.csv',['emp_id','month','days_worked','basic_salary','hra','advance','arrears','ot_bonus','tds','esi_employee','pf_employee','pt','remarks'],[['BPS4001','2025-06','26','8000','2000','0','0','0','0','','','','']]) }>Template</Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={()=>importRef.current?.click()}>Import CSV</Button>
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportCSV}/>
            <Button icon={<Plus size={16}/>} onClick={()=>{setForm(blankForm());setEditingId(null);setShowForm(true)}}>Add Entry</Button>
          </div>
        }
      />

      <div className="flex gap-3 flex-wrap items-end">
        <Select label="Financial Year" options={FY_OPTIONS} value={selectedFY} onChange={e=>{setSelectedFY(e.target.value);setSelectedMonth('')}} className="w-40"/>
        <Select label="" placeholder="All Sites" options={farmOptions} value={filterFarm} onChange={e=>setFilterFarm(e.target.value)} className="w-48"/>
        {filterFarm&&<Button variant="ghost" size="sm" onClick={()=>setFilterFarm('')}>Clear</Button>}
      </div>

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
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={exportMonth}>Export</Button>
              <button onClick={()=>setSelectedMonth('')} className="text-gray-400 hover:text-gray-600 text-sm">✕ Close</button>
            </div>
          </div>
          {loadingDetail?<div className="p-6 text-center"><Spinner/></div>:(
            <Table>
              <thead><tr>
                <Th>Employee</Th><Th>Site</Th><Th right>Days</Th>
                <Th right>Gross</Th><Th right>ESI</Th><Th right>PF</Th><Th right>PT</Th>
                <Th right>Advance</Th><Th right>TDS</Th><Th right>Net Salary</Th><Th>Paid</Th><Th></Th>
              </tr></thead>
              <tbody>
                {salaries?.map((r:any)=>(
                  <tr key={r.id} className="hover:bg-gray-50">
                    <Td><span className="font-medium">{r.employees?.name}</span><span className="text-xs text-gray-400 ml-1">{r.employees?.emp_id}</span></Td>
                    <Td className="text-xs">{r.employees?.farms?.name??'HO/Others'}</Td>
                    <Td right>{r.days_worked??'—'}</Td>
                    <Td right>{r.gross_salary?inr(r.gross_salary):'—'}</Td>
                    <Td right className="text-xs">{r.esi_employee>0?inr(r.esi_employee):'—'}</Td>
                    <Td right className="text-xs">{r.pf_employee>0?inr(r.pf_employee):'—'}</Td>
                    <Td right className="text-xs">{r.pt>0?inr(r.pt):'—'}</Td>
                    <Td right className="text-orange-600">{r.advance>0?inr(r.advance):'—'}</Td>
                    <Td right>{r.tds>0?inr(r.tds):'—'}</Td>
                    <Td right className="font-semibold text-green-700">{inr(r.net_salary)}</Td>
                    <Td><Badge color={r.is_paid?'green':'gray'}>{r.is_paid?'Paid':'Pending'}</Badge></Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={()=>openEditEntry(r)} className="p-1 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={12}/></button>
                        <button onClick={()=>delMut.mutate(r.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={12}/></button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {salaries && salaries.length>0 && (
                  <tr className="bg-gray-50 font-semibold">
                    <Td colSpan={3}>Total ({salaries.length} employees)</Td>
                    <Td right>{inr(salaries.reduce((s:number,r:any)=>s+(r.gross_salary??0),0))}</Td>
                    <Td right>{inr(salaries.reduce((s:number,r:any)=>s+(r.esi_employee??0),0))}</Td>
                    <Td right>{inr(salaries.reduce((s:number,r:any)=>s+(r.pf_employee??0),0))}</Td>
                    <Td right>{inr(salaries.reduce((s:number,r:any)=>s+(r.pt??0),0))}</Td>
                    <Td right className="text-orange-600">{inr(salaries.reduce((s:number,r:any)=>s+(r.advance??0),0))}</Td>
                    <Td right>{inr(salaries.reduce((s:number,r:any)=>s+(r.tds??0),0))}</Td>
                    <Td right className="text-green-700">{inr(salaries.reduce((s:number,r:any)=>s+(r.net_salary??0),0))}</Td>
                    <Td colSpan={2}></Td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
          {!loadingDetail&&!salaries?.length&&<EmptyState icon={<IndianRupee size={32}/>} title="No salary entries for this month" action={<Button onClick={()=>setShowForm(true)} icon={<Plus size={16}/>}>Add Entry</Button>}/>}
        </Card>
      )}

      <Modal open={showForm} onClose={()=>{setShowForm(false);setEditingId(null)}} title={editingId?'Edit Salary Entry':'Add Salary Entry'} size="lg"
        footer={<><Button variant="secondary" onClick={()=>{setShowForm(false);setEditingId(null)}}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Select label="Site" placeholder="— Filter —" options={farmOptions} value={filterFarm} onChange={e=>setFilterFarm(e.target.value)}/>
            <Select label="Employee" required placeholder="— Select —" options={empOptions} value={form.employee_id} onChange={e=>s('employee_id',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="Month" required type="month" value={form.month} onChange={e=>s('month',e.target.value)}/>
            <Input label="Days Worked" type="number" value={form.days_worked} onChange={e=>s('days_worked',e.target.value)}/>
          </FormRow>
          <Divider label="Earnings"/>
          <FormRow>
            <Input label="Basic Salary" type="number" value={form.basic_salary} onChange={e=>s('basic_salary',e.target.value)}/>
            <Input label="HRA" type="number" value={form.hra} onChange={e=>s('hra',e.target.value)}/>
            <Input label="Gross Salary" type="number" value={form.gross_salary} onChange={e=>s('gross_salary',e.target.value)}/>
          </FormRow>
          {(() => {
            const selEmp = employees?.find((e:any)=>e.id===form.employee_id)
            const hasESI = selEmp?.esi_applicable
            const hasPF  = selEmp?.pf_applicable
            const hasPT  = selEmp?.pt_applicable
            if (!selEmp) return null
            if (!hasESI && !hasPF && !hasPT) return (
              <div className="text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">No statutory deductions (ESI/PF/PT) applicable for this employee</div>
            )
            return (<>
              <Divider label="Statutory Deductions"/>
              {hasESI && <FormRow>
                <Input label="ESI Employee (0.75%)" type="number" value={form.esi_employee} onChange={e=>s('esi_employee',e.target.value)}/>
                <Input label="ESI Employer (3.25%)" type="number" value={form.esi_employer} onChange={e=>s('esi_employer',e.target.value)}/>
              </FormRow>}
              {(hasPF||hasPT) && <FormRow>
                {hasPF && <Input label="PF Employee (12%)" type="number" value={form.pf_employee} onChange={e=>s('pf_employee',e.target.value)}/>}
                {hasPF && <Input label="PF Employer (12%)" type="number" value={form.pf_employer} onChange={e=>s('pf_employer',e.target.value)}/>}
                {hasPT && <Input label="PT (Professional Tax)" type="number" value={form.pt} onChange={e=>s('pt',e.target.value)}/>}
              </FormRow>}
            </>)
          })()}
          <Divider label="Other Deductions &amp; Additions"/>
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
            <div className="flex items-end"><Button variant="secondary" onClick={calcPayroll}>Auto Calc</Button></div>
          </FormRow>
          <Divider label="Payment"/>
          <FormRow>
            <Select label="Payment Mode" options={['Cash','Bank Transfer','Cheque']} value={form.payment_mode} onChange={e=>s('payment_mode',e.target.value)}/>
            <Input label="UTR / Cheque No" value={form.payment_ref} onChange={e=>s('payment_ref',e.target.value)}/>
            <Select label="Paid?" options={[{value:'false',label:'Pending'},{value:'true',label:'Paid'}]} value={form.is_paid} onChange={e=>s('is_paid',e.target.value)}/>
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e=>s('remarks',e.target.value)}/>
        </div>
      </Modal>
    </div>
  )
}

// ── BONUS PAGE ────────────────────────────────────────────────────
export const BonusPage: React.FC = () => {
  const qc = useQueryClient()
  const { profile } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [filterFarm, setFilterFarm] = useState('')
  const [form, setForm] = useState({employee_id:'',bonus_year:'',amount:'',bonus_type:'festival',paid_date:'',remarks:''})
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))
  const importRef = useRef<HTMLInputElement>(null)

  const {data:farms}=useQuery({queryKey:['farms'],queryFn:async()=>{const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name');return data??[]}})
  const {data:employees}=useQuery({queryKey:['employees',filterFarm],queryFn:async()=>{let q=supabase.from('employees').select('id,name,emp_id,farms(name,code)').eq('is_active',true).order('name');if(filterFarm)q=q.eq('farm_id',filterFarm);const{data}=await q;return data??[]}})
  const {data:bonuses,isLoading}=useQuery({queryKey:['bonuses'],queryFn:async()=>{const{data}=await supabase.from('bonus').select('*, employees(name,emp_id,farms(name,code))').order('paid_date',{ascending:false});return data??[]}})

  const mut=useMutation({
    mutationFn:async()=>{
      if(!form.employee_id||!form.bonus_year||!form.amount)throw new Error('Employee, year and amount required')
      if (editingId) {
        const{error}=await supabase.from('bonus').update({
          amount:parseFloat(form.amount), bonus_type:form.bonus_type,
          paid_date:form.paid_date||null, remarks:form.remarks||null,
        }).eq('id',editingId)
        if(error)throw error
      } else {
        const{error}=await supabase.from('bonus').upsert({
          employee_id:form.employee_id, bonus_year:parseInt(form.bonus_year),
          amount:parseFloat(form.amount), bonus_type:form.bonus_type,
          paid_date:form.paid_date||null, remarks:form.remarks||null,
        },{onConflict:'employee_id,bonus_year'})
        if(error)throw error
      }
    },
    onSuccess:()=>{toast.success('Bonus saved!');qc.invalidateQueries({queryKey:['bonuses']});setShowForm(false);setEditingId(null)},
    onError:(e:any)=>toast.error(e.message)
  })

  const delMut=useMutation({
    mutationFn:async(id:string)=>{const{error}=await supabase.from('bonus').delete().eq('id',id);if(error)throw error},
    onSuccess:()=>{toast.success('Deleted');qc.invalidateQueries({queryKey:['bonuses']})},
    onError:(e:any)=>toast.error(e.message)
  })

  const openEdit = (b: any) => {
    setEditingId(b.id)
    setForm({
      employee_id: b.employee_id,
      bonus_year: b.bonus_year?.toString() ?? '',
      amount: b.amount?.toString() ?? '',
      bonus_type: b.bonus_type ?? 'festival',
      paid_date: b.paid_date ?? '',
      remarks: b.remarks ?? '',
    })
    setShowForm(true)
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const { headers: hdrs, rows } = await parseFile(file)
    if (rows.length === 0) { toast.error('Empty file'); return }
    const records = rows.map(vals => { const obj: Record<string,string> = {}; hdrs.forEach((h,i) => { obj[h] = vals[i]??'' }); return obj })
    const { data: allEmps } = await supabase.from('employees').select('id,emp_id')
    const empMap: Record<string,string> = {}
    for (const e of (allEmps??[])) if(e.emp_id) empMap[e.emp_id] = e.id
    const toUpsert = records.filter(r=>r.emp_id&&r.bonus_year&&r.amount).map(r=>({
      employee_id: empMap[r.emp_id],
      bonus_year: parseInt(r.bonus_year),
      amount: parseFloat(r.amount),
      bonus_type: r.bonus_type||'festival',
      paid_date: r.paid_date||null,
      remarks: r.remarks||null,
    })).filter(r=>r.employee_id)
    if (!toUpsert.length) { toast.error('No valid rows'); return }
    const { error } = await supabase.from('bonus').upsert(toUpsert, { onConflict: 'employee_id,bonus_year' })
    if (error) { toast.error(error.message); return }
    toast.success(`Imported ${toUpsert.length} bonuses`)
    qc.invalidateQueries({ queryKey: ['bonuses'] })
    if (importRef.current) importRef.current.value = ''
  }

  const handleExport = () => {
    if (!bonuses?.length) return
    exportCSV('bonuses.csv',
      ['emp_id','name','site','bonus_year','amount','bonus_type','paid_date','remarks'],
      bonuses.map((b:any)=>[b.employees?.emp_id,b.employees?.name,b.employees?.farms?.name,b.bonus_year,b.amount,b.bonus_type,b.paid_date,b.remarks])
    )
  }

  const farmOptions=farms?.map((f:any)=>({value:f.id,label:f.name}))??[]
  const empOptions=employees?.map((e:any)=>({value:e.id,label:`${e.name} (${e.farms?.code})`}))??[]
  const totalBonus=bonuses?.reduce((s:number,b:any)=>s+(b.amount??0),0)??0

  return (
    <div className="space-y-5">
      <SectionHeader title="Bonus" subtitle={`Total bonus paid: ${inr(totalBonus)}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={()=>exportCSV('bonus_template.csv',['emp_id','bonus_year','amount','bonus_type','paid_date','remarks'],[['BPS4001','2025','5000','festival','2025-10-15','']])}>Template</Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={()=>importRef.current?.click()}>Import CSV</Button>
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportCSV}/>
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>
            <Button icon={<Plus size={16}/>} onClick={()=>{setForm({employee_id:'',bonus_year:new Date().getFullYear().toString(),amount:'',bonus_type:'festival',paid_date:'',remarks:''});setEditingId(null);setShowForm(true)}}>Add Bonus</Button>
          </div>
        }
      />
      <div className="flex gap-3">
        <Select label="" placeholder="All Sites" options={farmOptions} value={filterFarm} onChange={e=>setFilterFarm(e.target.value)} className="w-48"/>
        {filterFarm&&<Button variant="ghost" size="sm" onClick={()=>setFilterFarm('')}>Clear</Button>}
      </div>
      {isLoading?<Spinner/>:(
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Employee</Th><Th>Site</Th><Th right>Year</Th><Th>Type</Th>
              <Th right>Amount</Th><Th>Paid Date</Th><Th>Remarks</Th><Th></Th>
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
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={()=>openEdit(b)} className="p-1 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={12}/></button>
                      {can.delete(profile?.role) && (
                        <button onClick={()=>delMut.mutate(b.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={12}/></button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {!bonuses?.length&&<EmptyState icon={<IndianRupee size={32}/>} title="No bonus records" action={<Button onClick={()=>setShowForm(true)} icon={<Plus size={16}/>}>Add Bonus</Button>}/>}
        </Card>
      )}
      <Modal open={showForm} onClose={()=>{setShowForm(false);setEditingId(null)}} title={editingId?'Edit Bonus':'Add Bonus'} size="md"
        footer={<><Button variant="secondary" onClick={()=>{setShowForm(false);setEditingId(null)}}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Select label="Site" placeholder="— Filter —" options={farmOptions} value={filterFarm} onChange={e=>setFilterFarm(e.target.value)}/>
            <Select label="Employee" required placeholder="— Select —" options={empOptions} value={form.employee_id} onChange={e=>s('employee_id',e.target.value)} disabled={!!editingId}/>
          </FormRow>
          <FormRow>
            <Input label="Bonus Year" required type="number" value={form.bonus_year} onChange={e=>s('bonus_year',e.target.value)} hint="e.g. 2025" disabled={!!editingId}/>
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

// ── ESI / PF REPORT ───────────────────────────────────────────────
export const ESIPFReportPage: React.FC = () => {
  const qc = useQueryClient()
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const [filterMonth, setFilterMonth] = useState(defaultMonth)
  const [filterFarm, setFilterFarm] = useState('')
  const [editRec, setEditRec] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const ef = (k:string) => (e:any) => setEditForm((p:any)=>({...p,[k]:e.target.value}))

  const {data:farms}=useQuery({queryKey:['farms'],queryFn:async()=>{const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name');return data??[]}})

  const {data:rows, isLoading}=useQuery({
    queryKey:['esipf_report',filterMonth,filterFarm],
    enabled:!!filterMonth,
    queryFn:async()=>{
      let q=supabase.from('salary_monthly')
        .select('*, employees!inner(name,emp_id,esi_applicable,pf_applicable,pt_applicable,farm_id,farms(name,code))')
        .eq('month',filterMonth+'-01')
      if(filterFarm)q=q.eq('employees.farm_id',filterFarm)
      const{data,error}=await q
      if(error)throw error
      return data??[]
    }
  })

  const openEdit = (r: any) => {
    setEditRec(r)
    setEditForm({
      gross_salary: r.gross_salary?.toString()??'',
      esi_employee: r.esi_employee?.toString()??'0',
      esi_employer: r.esi_employer?.toString()??'0',
      pf_employee: r.pf_employee?.toString()??'0',
      pf_employer: r.pf_employer?.toString()??'0',
      pt: r.pt?.toString()??'0',
      net_salary: r.net_salary?.toString()??'',
      is_paid: r.is_paid?'true':'false',
      payment_mode: r.payment_mode??'Cash',
      payment_ref: r.payment_ref??'',
      remarks: r.remarks??'',
    })
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('salary_monthly').update({
        gross_salary: parseFloat(editForm.gross_salary)||null,
        esi_employee: parseFloat(editForm.esi_employee)||0,
        esi_employer: parseFloat(editForm.esi_employer)||0,
        pf_employee: parseFloat(editForm.pf_employee)||0,
        pf_employer: parseFloat(editForm.pf_employer)||0,
        pt: parseFloat(editForm.pt)||0,
        net_salary: parseFloat(editForm.net_salary)||0,
        is_paid: editForm.is_paid==='true',
        payment_mode: editForm.payment_mode||'Cash',
        payment_ref: editForm.payment_ref||null,
        remarks: editForm.remarks||null,
      }).eq('id', editRec.id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({queryKey:['esipf_report']}); setEditRec(null) },
    onError: (e:any) => toast.error(e.message),
  })

  const totals = (rows??[]).reduce((acc:any,r:any)=>{
    acc.esi_emp   += r.esi_employee??0
    acc.esi_er    += r.esi_employer??0
    acc.pf_emp    += r.pf_employee??0
    acc.pf_er     += r.pf_employer??0
    acc.pt        += r.pt??0
    return acc
  }, {esi_emp:0,esi_er:0,pf_emp:0,pf_er:0,pt:0})

  const handleExport = () => {
    if (!rows?.length) return
    exportCSV(`esipf_${filterMonth}.csv`,
      ['Emp ID','Name','Site','Gross','ESI Employee','ESI Employer','PF Employee','PF Employer','PT'],
      (rows??[]).map((r:any)=>[
        r.employees?.emp_id, r.employees?.name, r.employees?.farms?.name,
        r.gross_salary, r.esi_employee, r.esi_employer, r.pf_employee, r.pf_employer, r.pt
      ])
    )
  }

  const farmOptions=farms?.map((f:any)=>({value:f.id,label:f.name}))??[]

  return (
    <div className="space-y-5">
      <SectionHeader title="ESI / PF Report" subtitle="Statutory deduction report for ESIC & EPFO filing"
        action={<Button variant="outline" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>}
      />
      <div className="flex gap-3 flex-wrap items-end">
        <Input label="Month" type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="w-48"/>
        <Select label="" placeholder="All Sites" options={farmOptions} value={filterFarm} onChange={e=>setFilterFarm(e.target.value)} className="w-48"/>
        {filterFarm&&<Button variant="ghost" size="sm" onClick={()=>setFilterFarm('')}>Clear</Button>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          {label:'ESI Employee',val:totals.esi_emp,color:'text-blue-700'},
          {label:'ESI Employer',val:totals.esi_er,color:'text-blue-900'},
          {label:'PF Employee',val:totals.pf_emp,color:'text-purple-700'},
          {label:'PF Employer',val:totals.pf_er,color:'text-purple-900'},
          {label:'Prof. Tax (PT)',val:totals.pt,color:'text-orange-700'},
        ].map(c=>(
          <Card key={c.label}>
            <div className="text-xs text-gray-500">{c.label}</div>
            <div className={`text-lg font-bold mt-1 ${c.color}`}>{inr(c.val)}</div>
          </Card>
        ))}
      </div>

      {isLoading?<Spinner/>:(
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Employee</Th><Th>Site</Th><Th right>Gross</Th>
              <Th right>ESI (Emp)</Th><Th right>ESI (Employer)</Th>
              <Th right>PF (Emp)</Th><Th right>PF (Employer)</Th><Th right>PT</Th>
              <Th right>Net</Th><Th>Paid</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(rows??[]).map((r:any)=>(
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td><span className="font-medium">{r.employees?.name}</span><span className="text-xs text-gray-400 ml-1">{r.employees?.emp_id}</span></Td>
                  <Td className="text-xs">{r.employees?.farms?.name}</Td>
                  <Td right>{r.gross_salary?inr(r.gross_salary):'—'}</Td>
                  <Td right>{r.esi_employee>0?inr(r.esi_employee):'—'}</Td>
                  <Td right>{r.esi_employer>0?inr(r.esi_employer):'—'}</Td>
                  <Td right>{r.pf_employee>0?inr(r.pf_employee):'—'}</Td>
                  <Td right>{r.pf_employer>0?inr(r.pf_employer):'—'}</Td>
                  <Td right>{r.pt>0?inr(r.pt):'—'}</Td>
                  <Td right className="font-semibold text-green-700">{r.net_salary?inr(r.net_salary):'—'}</Td>
                  <Td><Badge color={r.is_paid?'green':'gray'}>{r.is_paid?'Paid':'Pending'}</Badge></Td>
                  <Td><button onClick={()=>openEdit(r)} className="p-1 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600" title="Edit"><Edit2 size={12}/></button></Td>
                </tr>
              ))}
              {(rows??[]).length>0 && (
                <tr className="bg-gray-50 font-semibold">
                  <Td colSpan={2}>Total ({rows?.length} employees)</Td>
                  <Td right>{inr((rows??[]).reduce((s:number,r:any)=>s+(r.gross_salary??0),0))}</Td>
                  <Td right>{inr(totals.esi_emp)}</Td>
                  <Td right>{inr(totals.esi_er)}</Td>
                  <Td right>{inr(totals.pf_emp)}</Td>
                  <Td right>{inr(totals.pf_er)}</Td>
                  <Td right>{inr(totals.pt)}</Td>
                  <Td right className="text-green-700">{inr((rows??[]).reduce((s:number,r:any)=>s+(r.net_salary??0),0))}</Td>
                  <Td colSpan={2}></Td>
                </tr>
              )}
            </tbody>
          </Table>
          {!(rows??[]).length&&<EmptyState icon={<FileText size={32}/>} title="No data for selected month"/>}
        </Card>
      )}

      <Modal open={!!editRec} onClose={()=>setEditRec(null)} title={`Edit Salary — ${editRec?.employees?.name} (${filterMonth})`} size="md"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={()=>setEditRec(null)}>Cancel</Button><Button loading={saveMut.isPending} onClick={()=>saveMut.mutate()}>Save</Button></div>}>
        {editRec && (
          <div className="space-y-3">
            <FormRow>
              <Input label="Gross Salary" type="number" value={editForm.gross_salary} onChange={ef('gross_salary')}/>
              <Input label="Net Salary" type="number" value={editForm.net_salary} onChange={ef('net_salary')}/>
            </FormRow>
            {editRec.employees?.esi_applicable && <FormRow>
              <Input label="ESI Employee (0.75%)" type="number" value={editForm.esi_employee} onChange={ef('esi_employee')}/>
              <Input label="ESI Employer (3.25%)" type="number" value={editForm.esi_employer} onChange={ef('esi_employer')}/>
            </FormRow>}
            {editRec.employees?.pf_applicable && <FormRow>
              <Input label="PF Employee (12%)" type="number" value={editForm.pf_employee} onChange={ef('pf_employee')}/>
              <Input label="PF Employer (12%)" type="number" value={editForm.pf_employer} onChange={ef('pf_employer')}/>
            </FormRow>}
            {editRec.employees?.pt_applicable && <Input label="PT (Professional Tax)" type="number" value={editForm.pt} onChange={ef('pt')}/>}
            <Divider label="Payment"/>
            <FormRow>
              <Select label="Payment Mode" options={['Cash','Bank Transfer','Cheque']} value={editForm.payment_mode} onChange={ef('payment_mode')}/>
              <Input label="UTR / Cheque No" value={editForm.payment_ref} onChange={ef('payment_ref')}/>
              <Select label="Paid?" options={[{value:'false',label:'Pending'},{value:'true',label:'Paid'}]} value={editForm.is_paid} onChange={ef('is_paid')}/>
            </FormRow>
            <Input label="Remarks" value={editForm.remarks} onChange={ef('remarks')}/>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── PAYROLL SUMMARY ───────────────────────────────────────────────
export const PayrollSummaryPage: React.FC = () => {
  const [selectedFY, setSelectedFY] = useState('2025-26')
  const months = fyMonths(selectedFY)
  const [startM, endM] = [months[0], months[months.length-1]]

  const {data:summaryData, isLoading}=useQuery({
    queryKey:['payroll_summary',selectedFY],
    queryFn:async()=>{
      const{data,error}=await supabase.from('salary_monthly')
        .select('month,gross_salary,net_salary,advance,esi_employee,esi_employer,pf_employee,pf_employer,pt,employees!inner(farm_id,farms(name,code))')
        .gte('month',startM).lte('month',endM)
      if(error)throw error
      return data??[]
    }
  })

  const bonusYears = Array.from(new Set(months.map(m=>parseInt(m.slice(0,4)))))
  const {data:bonusData}=useQuery({
    queryKey:['bonus_fy',selectedFY],
    queryFn:async()=>{
      const{data}=await supabase.from('bonus').select('amount,bonus_year').in('bonus_year',bonusYears)
      return data??[]
    }
  })
  const totalBonus = (bonusData??[]).reduce((s:number,b:any)=>s+(b.amount??0),0)

  const byMonth: Record<string,{label:string,gross:number,net:number,advance:number,esi:number,pf:number,pt:number,count:number}> = {}
  for (const m of months) {
    const key = m.slice(0,7)
    const [yr,mn] = key.split('-')
    byMonth[key] = {label:`${MONTH_NAMES[parseInt(mn)-1]} ${yr}`,gross:0,net:0,advance:0,esi:0,pf:0,pt:0,count:0}
  }
  for (const r of (summaryData??[])) {
    const key = r.month.slice(0,7)
    if (byMonth[key]) {
      byMonth[key].gross += r.gross_salary??0
      byMonth[key].net += r.net_salary??0
      byMonth[key].advance += r.advance??0
      byMonth[key].esi += (r.esi_employee??0) + (r.esi_employer??0)
      byMonth[key].pf += (r.pf_employee??0) + (r.pf_employer??0)
      byMonth[key].pt += r.pt??0
      byMonth[key].count++
    }
  }

  const chartData = Object.values(byMonth)
  const totals = Object.values(byMonth).reduce((acc,m)=>({
    gross: acc.gross+m.gross, net: acc.net+m.net, advance: acc.advance+m.advance,
    esi: acc.esi+m.esi, pf: acc.pf+m.pf, pt: acc.pt+m.pt
  }), {gross:0,net:0,advance:0,esi:0,pf:0,pt:0})

  const handleExport = () => {
    exportCSV(`payroll_summary_${selectedFY}.csv`,
      ['Month','Employees','Gross','Net','Advance','ESI (Total)','PF (Total)','PT'],
      Object.entries(byMonth).map(([,m])=>[m.label,m.count,m.gross,m.net,m.advance,m.esi,m.pf,m.pt])
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Payroll Summary" subtitle="FY-wise payroll analysis and charts"
        action={<Button variant="outline" icon={<Download size={14}/>} onClick={handleExport}>Export Year CSV</Button>}
      />
      <div className="flex gap-3 items-end">
        <Select label="Financial Year" options={FY_OPTIONS} value={selectedFY} onChange={e=>setSelectedFY(e.target.value)} className="w-40"/>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          {label:'Total Gross',val:totals.gross,color:'text-gray-800'},
          {label:'Total Net',val:totals.net,color:'text-green-700'},
          {label:'Total Advance',val:totals.advance,color:'text-orange-600'},
          {label:'Total ESI',val:totals.esi,color:'text-blue-700'},
          {label:'Total PF',val:totals.pf,color:'text-purple-700'},
          {label:'Total PT',val:totals.pt,color:'text-orange-700'},
          {label:'Total Bonus',val:totalBonus,color:'text-yellow-700'},
        ].map(c=>(
          <Card key={c.label}>
            <div className="text-xs text-gray-500">{c.label}</div>
            <div className={`text-base font-bold mt-1 ${c.color}`}>{inr(c.val)}</div>
          </Card>
        ))}
      </div>

      {isLoading?<Spinner/>:(
        <Card>
          <div className="font-semibold text-gray-800 mb-4">Monthly Payroll — {selectedFY}</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{top:4,right:8,left:8,bottom:4}}>
              <XAxis dataKey="label" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}} tickFormatter={(v)=>`${(v/1000).toFixed(0)}K`}/>
              <Tooltip formatter={(v:number)=>inr(v)}/>
              <Legend/>
              <Bar dataKey="gross" name="Gross" fill="#6366f1" stackId="a"/>
              <Bar dataKey="esi" name="ESI" fill="#3b82f6" stackId="b"/>
              <Bar dataKey="pf" name="PF" fill="#8b5cf6" stackId="b"/>
              <Bar dataKey="net" name="Net" fill="#22c55e" stackId="c"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Site-wise monthly heatmap grid */}
      {!isLoading && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Monthly Detail</h3>
          </div>
          <Table>
            <thead><tr>
              <Th>Month</Th><Th right>Employees</Th><Th right>Gross</Th>
              <Th right>ESI</Th><Th right>PF</Th><Th right>PT</Th>
              <Th right>Advance</Th><Th right>Net</Th>
            </tr></thead>
            <tbody>
              {Object.entries(byMonth).map(([key,m])=>(
                <tr key={key} className="hover:bg-gray-50">
                  <Td className="font-medium">{m.label}</Td>
                  <Td right>{m.count||'—'}</Td>
                  <Td right>{m.gross?inr(m.gross):'—'}</Td>
                  <Td right className="text-blue-600">{m.esi?inr(m.esi):'—'}</Td>
                  <Td right className="text-purple-600">{m.pf?inr(m.pf):'—'}</Td>
                  <Td right className="text-orange-600">{m.pt?inr(m.pt):'—'}</Td>
                  <Td right className="text-orange-500">{m.advance?inr(m.advance):'—'}</Td>
                  <Td right className="font-semibold text-green-700">{m.net?inr(m.net):'—'}</Td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <Td>FY Total</Td>
                <Td right></Td>
                <Td right>{inr(totals.gross)}</Td>
                <Td right className="text-blue-600">{inr(totals.esi)}</Td>
                <Td right className="text-purple-600">{inr(totals.pf)}</Td>
                <Td right className="text-orange-600">{inr(totals.pt)}</Td>
                <Td right className="text-orange-500">{inr(totals.advance)}</Td>
                <Td right className="text-green-700">{inr(totals.net)}</Td>
              </tr>
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}

// ── ATTENDANCE REGISTER (yearly working days grid) ────────────────
export const AttendanceRegisterPage: React.FC = () => {
  const qc = useQueryClient()
  const [selectedFY, setSelectedFY] = useState('2025-26')
  const [filterFarm, setFilterFarm] = useState('')
  const months = fyMonths(selectedFY)

  // inline edit state: { empId, month, currentDays }
  const [editCell, setEditCell] = useState<{empId:string;month:string;days:string}|null>(null)
  const [savingCell, setSavingCell] = useState(false)

  const {data:farms}=useQuery({queryKey:['farms'],queryFn:async()=>{const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name');return data??[]}})

  const {data:salaries, isLoading}=useQuery({
    queryKey:['attendance_fy',selectedFY,filterFarm],
    queryFn:async()=>{
      const [startM, endM] = [months[0], months[months.length-1]]
      let q = supabase.from('salary_monthly')
        .select('id,employee_id,month,days_worked,employees!inner(name,emp_id,farm_id,farms(name,code))')
        .gte('month',startM).lte('month',endM)
      if (filterFarm) q = q.eq('employees.farm_id', filterFarm)
      const {data} = await q
      return data ?? []
    }
  })

  // Build: empId → { emp info, monthKey → {id, days} }
  const empMap: Record<string,{name:string,empId:string,site:string,months:Record<string,{id:string;days:number|null}>}> = {}
  for (const r of (salaries??[])) {
    const emp = (r as any).employees
    const id = r.employee_id
    if (!empMap[id]) empMap[id] = {name:emp?.name??'',empId:emp?.emp_id??'',site:emp?.farms?.name??'—',months:{}}
    empMap[id].months[r.month.slice(0,7)] = { id: (r as any).id, days: r.days_worked ?? null }
  }
  const empRows = Object.values(empMap).sort((a,b)=>a.site.localeCompare(b.site)||a.name.localeCompare(b.name))

  const farmOptions = (farms??[]).map((f:any)=>({value:f.id,label:f.name}))
  const MONTH_LABELS = months.map(m=>{const[yr,mn]=m.slice(0,7).split('-');return `${MONTH_NAMES[parseInt(mn)-1]} ${yr.slice(2)}`})

  const saveDays = async () => {
    if (!editCell) return
    setSavingCell(true)
    const entry = empMap[editCell.empId]?.months[editCell.month]
    const days = parseInt(editCell.days) || null
    if (entry?.id) {
      await supabase.from('salary_monthly').update({ days_worked: days }).eq('id', entry.id)
    }
    qc.invalidateQueries({ queryKey: ['attendance_fy'] })
    setSavingCell(false)
    setEditCell(null)
    toast.success('Days updated')
  }

  const handleExport = () => {
    exportCSV(`attendance_${selectedFY}.csv`,
      ['Employee','Emp ID','Site',...MONTH_LABELS,'Total Days'],
      empRows.map(e=>{
        const mDays = months.map(m=>e.months[m.slice(0,7)]?.days??'')
        const total = months.reduce((s,m)=>s+(e.months[m.slice(0,7)]?.days??0),0)
        return [e.name,e.empId,e.site,...mDays,total]
      })
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Attendance Register"
        subtitle="Year-wise working days per employee — click any cell to edit"
        action={<Button variant="outline" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>}
      />
      <div className="flex gap-3 flex-wrap items-end">
        <Select label="Financial Year" options={FY_OPTIONS} value={selectedFY} onChange={e=>setSelectedFY(e.target.value)} className="w-40"/>
        <Select label="" placeholder="All Sites" options={farmOptions} value={filterFarm} onChange={e=>setFilterFarm(e.target.value)} className="w-48"/>
        {filterFarm&&<Button variant="ghost" size="sm" onClick={()=>setFilterFarm('')}>Clear</Button>}
      </div>
      {isLoading ? <Spinner/> : (
        <div className="overflow-x-auto">
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th>Employee</Th><Th>Site</Th>
                {MONTH_LABELS.map((m,i)=><Th key={i} right className="text-xs px-2">{m}</Th>)}
                <Th right>Total</Th>
              </tr></thead>
              <tbody>
                {empRows.map(e=>{
                  const total = months.reduce((s,m)=>s+(e.months[m.slice(0,7)]?.days??0),0)
                  return (
                    <tr key={e.empId+e.name} className="hover:bg-gray-50">
                      <Td>
                        <span className="font-medium text-sm">{e.name}</span>
                        {e.empId&&<span className="text-xs text-gray-400 ml-1">({e.empId})</span>}
                      </Td>
                      <Td className="text-xs text-gray-500">{e.site}</Td>
                      {months.map(m=>{
                        const key = m.slice(0,7)
                        const entry = e.months[key]
                        const d = entry?.days
                        const isEditing = editCell?.empId===e.empId && editCell?.month===key && !!entry?.id
                        if (!entry?.id) return <Td key={m} right className="text-gray-300 text-xs px-2">—</Td>
                        if (isEditing) return (
                          <Td key={m} right className="px-1">
                            <input autoFocus type="number" min={0} max={31} value={editCell!.days}
                              onChange={ev=>setEditCell(c=>c?({...c,days:ev.target.value}):c)}
                              onKeyDown={ev=>{ if(ev.key==='Enter') saveDays(); if(ev.key==='Escape') setEditCell(null) }}
                              onBlur={saveDays}
                              className="w-12 border border-brand-400 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 py-0.5"
                            />
                          </Td>
                        )
                        return (
                          <td key={m} className={`text-sm px-2 text-right cursor-pointer hover:bg-brand-50 rounded border-b border-gray-100 py-2 ${d!=null&&d<20?'text-red-500':d!=null&&d>=26?'text-green-600':'text-gray-700'}`}
                            title="Click to edit"
                            onClick={()=>setEditCell({empId:e.empId,month:key,days:d?.toString()??''})}>
                            {d!=null?d:'—'}
                          </td>
                        )
                      })}
                      <Td right className="font-semibold">{total||'—'}</Td>
                    </tr>
                  )
                })}
                {empRows.length===0&&<tr><Td colSpan={months.length+3} className="text-center text-gray-400 py-6">No data for this FY</Td></tr>}
              </tbody>
            </Table>
          </Card>
        </div>
      )}
      {savingCell && <div className="fixed bottom-4 right-4 bg-brand-600 text-white text-sm px-4 py-2 rounded-lg shadow">Saving...</div>}
    </div>
  )
}
