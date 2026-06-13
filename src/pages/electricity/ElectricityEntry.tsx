import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtMonth } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState
} from '@/components/ui'
import { Plus, Zap, Edit2, Download, BarChart2, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

function exportCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

const ALLOC_METHODS = [
  { value: 'full',               label: 'Full — assign 100% to one flock' },
  { value: 'bird_proportion',    label: 'Bird Proportion — split by bird count' },
  { value: 'manual',             label: 'Manual — enter % directly' },
]

// ── BILLS ENTRY TAB ──────────────────────────────────────────────
const BillsTab: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [filterMonth, setFilterMonth] = useState('')

  const { data: meters } = useQuery({
    queryKey: ['meters'],
    queryFn: async () => {
      const { data } = await supabase.from('electricity_meters').select('*, farms(name,code)').eq('is_active',true).order('meter_name')
      return data ?? []
    }
  })

  const { data: bills, isLoading } = useQuery({
    queryKey: ['elec_bills', filterMonth],
    queryFn: async () => {
      let q = supabase.from('electricity_bills')
        .select('*, electricity_meters(meter_name,usc_no,farms(name,code))')
        .order('bill_month', { ascending: false }).limit(200)
      if (filterMonth) q = q.eq('bill_month', filterMonth + '-01')
      const { data } = await q; return data ?? []
    }
  })

  const [form, setForm] = useState({ meter_id:'', bill_month:'', units_consumed:'', amount:'', acd_dc_due:'0', deposit_amount:'0', paid_date:'', remarks:'' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openForm = (bill?: any) => {
    if (bill) {
      setEditing(bill)
      setForm({ meter_id: bill.meter_id, bill_month: bill.bill_month?.slice(0,7), units_consumed: bill.units_consumed?.toString()??'', amount: bill.amount?.toString()??'', acd_dc_due: bill.acd_dc_due?.toString()??'0', deposit_amount: bill.deposit_amount?.toString()??'0', paid_date: bill.paid_date??'', remarks: bill.remarks??'' })
    } else {
      setEditing(null)
      setForm({ meter_id:'', bill_month:'', units_consumed:'', amount:'', acd_dc_due:'0', deposit_amount:'0', paid_date:'', remarks:'' })
    }
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      const payload = { meter_id: form.meter_id, bill_month: form.bill_month+'-01', units_consumed: parseInt(form.units_consumed)||null, amount: parseFloat(form.amount), acd_dc_due: parseFloat(form.acd_dc_due)||0, deposit_amount: parseFloat(form.deposit_amount)||0, paid_date: form.paid_date||null, remarks: form.remarks||null }
      if (!payload.meter_id || !payload.bill_month || !payload.amount) throw new Error('Meter, month and amount required')
      if (editing) { const{error}=await supabase.from('electricity_bills').update(payload).eq('id',editing.id); if(error)throw error }
      else { const{error}=await supabase.from('electricity_bills').insert(payload); if(error)throw error }
    },
    onSuccess: () => { toast.success(editing?'Updated!':'Saved!'); qc.invalidateQueries({queryKey:['elec_bills']}); setShowForm(false) },
    onError: (e:any) => toast.error(e.message)
  })

  const meterOptions = (meters??[]).map((m:any) => ({ value: m.id, label: `${m.meter_name} (${m.usc_no}) — ${m.farms?.name}` }))
  const totalThisMonth = (bills??[]).filter((b:any)=>b.bill_month?.slice(0,7)===filterMonth).reduce((s:number,b:any)=>s+b.amount,0)

  return (
    <>
      <div className="flex gap-2 items-center justify-between mb-4">
        <div className="flex gap-3 items-center">
          <Input label="" type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="w-48" />
          {filterMonth && <Button variant="ghost" size="sm" onClick={()=>setFilterMonth('')}>Clear</Button>}
          {filterMonth && bills && <span className="text-sm text-gray-500">Total: <strong>{inr(totalThisMonth)}</strong></span>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Download size={14}/>}
            onClick={()=>exportCSV('electricity_bills.csv',['meter_name','usc_no','site','bill_month','units_consumed','amount','acd_dc_due','deposit_amount','paid_date','remarks'],(bills??[]).map((b:any)=>[b.electricity_meters?.meter_name,b.electricity_meters?.usc_no,b.electricity_meters?.farms?.name,b.bill_month?.slice(0,7),b.units_consumed,b.amount,b.acd_dc_due,b.deposit_amount,b.paid_date,b.remarks]))}>
            Export
          </Button>
          <Button icon={<Plus size={16}/>} onClick={()=>openForm()}>Add Bill</Button>
        </div>
      </div>

      {/* Meter summary cards */}
      {(meters??[]).length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {(meters??[]).map((m:any) => {
            const latest = (bills??[]).find((b:any)=>b.meter_id===m.id)
            return (
              <Card key={m.id} className="!p-3">
                <div className="flex items-center gap-2 mb-1"><Zap size={14} className="text-orange-500"/><span className="text-xs font-medium text-gray-600 truncate">{m.meter_name}</span></div>
                <p className="text-xs text-gray-400">{m.farms?.code} · USC: {m.usc_no}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{latest ? inr(latest.amount) : '—'}</p>
                <p className="text-xs text-gray-400">{latest ? fmtMonth(latest.bill_month) : 'No bills'}</p>
              </Card>
            )
          })}
        </div>
      )}

      {isLoading ? <Spinner/> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Meter / Site</Th><Th>USC No</Th><Th>Month</Th>
              <Th right>Units</Th><Th right>Amount</Th><Th right>ACD/DC Due</Th>
              <Th right>Deposit</Th><Th>Paid Date</Th><Th>Remarks</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(bills??[]).map((b:any) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <Td><span className="font-medium text-sm">{b.electricity_meters?.meter_name}</span><br/><span className="text-xs text-gray-400">{b.electricity_meters?.farms?.name}</span></Td>
                  <Td className="text-xs text-gray-400 font-mono">{b.electricity_meters?.usc_no}</Td>
                  <Td className="text-sm font-medium">{fmtMonth(b.bill_month)}</Td>
                  <Td right>{b.units_consumed?.toLocaleString('en-IN')??'—'}</Td>
                  <Td right><span className="font-semibold">{inr(b.amount)}</span></Td>
                  <Td right>{b.acd_dc_due>0?inr(b.acd_dc_due):'—'}</Td>
                  <Td right>{b.deposit_amount>0?inr(b.deposit_amount):'—'}</Td>
                  <Td className="text-xs">{b.paid_date??'—'}</Td>
                  <Td className="text-xs text-gray-400 max-w-xs truncate">{b.remarks??''}</Td>
                  <Td><button onClick={()=>openForm(b)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button></Td>
                </tr>
              ))}
            </tbody>
            {(bills??[]).length>0 && (
              <tfoot><tr className="bg-gray-50">
                <Td colSpan={4}><strong>TOTAL ({(bills??[]).length} bills)</strong></Td>
                <Td right><strong>{inr((bills??[]).reduce((s:number,b:any)=>s+b.amount,0))}</strong></Td>
                <Td right><strong>{inr((bills??[]).reduce((s:number,b:any)=>s+(b.acd_dc_due||0),0))}</strong></Td>
                <Td colSpan={4}/>
              </tr></tfoot>
            )}
          </Table>
          {(bills??[]).length===0 && <EmptyState icon={<Zap size={32}/>} title="No bills entered" action={<Button onClick={()=>openForm()} icon={<Plus size={16}/>}>Add Bill</Button>}/>}
        </Card>
      )}

      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editing?'Edit Bill':'Add Electricity Bill'} size="md"
        footer={<><Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={()=>mut.mutate()}>{editing?'Update':'Save'}</Button></>}>
        <div className="space-y-4">
          <Select label="Meter / Site" required placeholder="— Select meter —" options={meterOptions} value={form.meter_id} onChange={e=>set('meter_id',e.target.value)}/>
          <FormRow>
            <Input label="Bill Month" required type="month" value={form.bill_month} onChange={e=>set('bill_month',e.target.value)}/>
            <Input label="Amount (₹)" required type="number" step="0.01" value={form.amount} onChange={e=>set('amount',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="Units Consumed" type="number" value={form.units_consumed} onChange={e=>set('units_consumed',e.target.value)}/>
            <Input label="ACD/DC Due (₹)" type="number" step="0.01" value={form.acd_dc_due} onChange={e=>set('acd_dc_due',e.target.value)}/>
          </FormRow>
          <FormRow>
            <Input label="Deposit Amount (₹)" type="number" step="0.01" value={form.deposit_amount} onChange={e=>set('deposit_amount',e.target.value)}/>
            <Input label="Paid Date" type="date" value={form.paid_date} onChange={e=>set('paid_date',e.target.value)}/>
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e=>set('remarks',e.target.value)}/>
        </div>
      </Modal>
    </>
  )
}

// ── ALLOCATION TAB ───────────────────────────────────────────────
const AllocationTab: React.FC = () => {
  const qc = useQueryClient()
  const [filterMonth, setFilterMonth] = useState('')
  const [allocModal, setAllocModal] = useState<any>(null)
  const [allocForm, setAllocForm] = useState<{ flock_id: string; alloc_pct: string; method: string }[]>([])

  const { data: bills, isLoading } = useQuery({
    queryKey: ['elec_bills_alloc', filterMonth],
    queryFn: async () => {
      let q = supabase.from('electricity_bills')
        .select('*, electricity_meters(meter_name,usc_no,farms(name,code))')
        .order('bill_month', { ascending: false }).limit(200)
      if (filterMonth) q = q.eq('bill_month', filterMonth + '-01')
      const { data } = await q; return data ?? []
    }
  })

  const { data: allocations } = useQuery({
    queryKey: ['elec_allocations'],
    queryFn: async () => {
      const { data } = await supabase.from('electricity_allocation').select('*, flocks(flock_no)')
      return data ?? []
    }
  })

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all'],
    queryFn: async () => { const{data}=await supabase.from('flocks').select('id,flock_no,status').order('flock_no'); return data??[] }
  })

  const openAlloc = (bill: any) => {
    const existing = (allocations??[]).filter((a:any)=>a.bill_id===bill.id)
    if (existing.length > 0) {
      setAllocForm(existing.map((a:any)=>({ flock_id: a.flock_id, alloc_pct: (a.alloc_pct*100).toFixed(1), method: a.alloc_method })))
    } else {
      setAllocForm([{ flock_id: '', alloc_pct: '100', method: 'full' }])
    }
    setAllocModal(bill)
  }

  const addAllocRow = () => setAllocForm(f=>[...f,{flock_id:'',alloc_pct:'',method:'manual'}])
  const removeAllocRow = (i:number) => setAllocForm(f=>f.filter((_,j)=>j!==i))
  const setAllocField = (i:number,k:string,v:string) => setAllocForm(f=>f.map((r,j)=>j===i?{...r,[k]:v}:r))

  const allocMut = useMutation({
    mutationFn: async () => {
      if (!allocModal) return
      const total = allocForm.reduce((s,r)=>s+parseFloat(r.alloc_pct||'0'),0)
      if (Math.abs(total-100)>0.5) throw new Error(`Percentages must add up to 100% (currently ${total.toFixed(1)}%)`)
      // delete existing then insert
      await supabase.from('electricity_allocation').delete().eq('bill_id', allocModal.id)
      const rows = allocForm.filter(r=>r.flock_id).map(r=>({
        bill_id: allocModal.id,
        flock_id: r.flock_id,
        alloc_method: r.method,
        alloc_pct: parseFloat(r.alloc_pct)/100,
        allocated_amount: allocModal.amount * parseFloat(r.alloc_pct)/100,
      }))
      if (rows.length) {
        const{error}=await supabase.from('electricity_allocation').insert(rows)
        if(error)throw error
      }
    },
    onSuccess: () => { toast.success('Allocation saved'); qc.invalidateQueries({queryKey:['elec_allocations']}); setAllocModal(null) },
    onError: (e:any) => toast.error(e.message)
  })

  const allocByBill = useMemo(()=>{
    const map: Record<string,any[]>={}
    ;(allocations??[]).forEach((a:any)=>{ if(!map[a.bill_id])map[a.bill_id]=[]; map[a.bill_id].push(a) })
    return map
  },[allocations])

  const flockOptions = (flocks??[]).map((f:any)=>({value:f.id,label:`Flock ${f.flock_no} (${f.status})`}))

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 mb-4">
        <strong>Allocation</strong> — split each electricity bill's cost across flocks for accurate P&amp;L. Select a bill and assign what % of the cost goes to which flock. Total must equal 100%.
      </div>
      <div className="flex gap-3 items-center mb-4">
        <Input label="" type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="w-48"/>
        {filterMonth && <Button variant="ghost" size="sm" onClick={()=>setFilterMonth('')}>Clear</Button>}
      </div>
      {isLoading ? <Spinner/> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Meter / Site</Th><Th>Month</Th><Th right>Amount</Th>
              <Th>Allocated To</Th><Th>Status</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(bills??[]).map((b:any) => {
                const allocs = allocByBill[b.id] ?? []
                const totalAllocPct = allocs.reduce((s:number,a:any)=>s+(a.alloc_pct??0),0)
                const isAllocated = allocs.length > 0 && Math.abs(totalAllocPct-1)<0.01
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <Td>
                      <span className="font-medium text-sm">{b.electricity_meters?.meter_name}</span>
                      <br/><span className="text-xs text-gray-400">{b.electricity_meters?.farms?.name}</span>
                    </Td>
                    <Td className="text-sm font-medium">{fmtMonth(b.bill_month)}</Td>
                    <Td right><span className="font-semibold">{inr(b.amount)}</span></Td>
                    <Td className="text-xs">
                      {allocs.length>0
                        ? allocs.map((a:any)=>`F-${a.flocks?.flock_no} (${((a.alloc_pct??0)*100).toFixed(0)}%)`).join(', ')
                        : <span className="text-gray-300">Not allocated</span>}
                    </Td>
                    <Td>
                      <Badge color={isAllocated?'green':allocs.length>0?'yellow':'gray'}>
                        {isAllocated?'Done':allocs.length>0?'Partial':'Pending'}
                      </Badge>
                    </Td>
                    <Td>
                      <button onClick={()=>openAlloc(b)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600">
                        <Settings size={13}/>
                      </button>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
          {(bills??[]).length===0 && <EmptyState icon={<Zap size={32}/>} title="No bills found" />}
        </Card>
      )}

      <Modal open={!!allocModal} onClose={()=>setAllocModal(null)}
        title={`Allocate — ${allocModal?.electricity_meters?.meter_name} ${fmtMonth(allocModal?.bill_month)} — ${inr(allocModal?.amount??0)}`}
        size="md"
        footer={<><Button variant="secondary" onClick={()=>setAllocModal(null)}>Cancel</Button><Button loading={allocMut.isPending} onClick={()=>allocMut.mutate()}>Save Allocation</Button></>}>
        <div className="space-y-3">
          {allocForm.map((row,i)=>(
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <Select label={i===0?'Flock':''} placeholder="— Select Flock —"
                  options={flockOptions} value={row.flock_id}
                  onChange={e=>setAllocField(i,'flock_id',e.target.value)}/>
              </div>
              <div className="w-24">
                <Input label={i===0?'%':''} type="number" step="0.1" value={row.alloc_pct}
                  onChange={e=>setAllocField(i,'alloc_pct',e.target.value)}/>
              </div>
              <div className="w-40">
                <Select label={i===0?'Method':''} options={ALLOC_METHODS} value={row.method}
                  onChange={e=>setAllocField(i,'method',e.target.value)}/>
              </div>
              {allocForm.length>1 && (
                <button onClick={()=>removeAllocRow(i)} className="mb-1 text-red-400 hover:text-red-600 text-lg font-bold">×</button>
              )}
            </div>
          ))}
          <div className="flex justify-between items-center pt-1">
            <button onClick={addAllocRow} className="text-sm text-brand-600 hover:underline">+ Add flock</button>
            <span className={`text-sm font-semibold ${Math.abs(allocForm.reduce((s,r)=>s+parseFloat(r.alloc_pct||'0'),0)-100)<0.5?'text-green-600':'text-red-500'}`}>
              Total: {allocForm.reduce((s,r)=>s+parseFloat(r.alloc_pct||'0'),0).toFixed(1)}%
            </span>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ── HISTORY TAB ──────────────────────────────────────────────────
const HistoryTab: React.FC = () => {
  const [filterMeter, setFilterMeter] = useState('')

  const { data: meters } = useQuery({
    queryKey: ['meters'],
    queryFn: async () => { const{data}=await supabase.from('electricity_meters').select('id,meter_name,usc_no,farms(name,code)').eq('is_active',true).order('meter_name'); return data??[] }
  })

  const { data: bills, isLoading } = useQuery({
    queryKey: ['elec_history', filterMeter],
    queryFn: async () => {
      let q = supabase.from('electricity_bills')
        .select('*, electricity_meters(meter_name,usc_no,farms(name,code))')
        .order('bill_month', { ascending: false }).limit(500)
      if (filterMeter) q = q.eq('meter_id', filterMeter)
      const{data}=await q; return data??[]
    }
  })

  // Group by month
  const byMonth = useMemo(()=>{
    const map: Record<string,{month:string;bills:any[];total:number;units:number}> = {}
    ;(bills??[]).forEach((b:any)=>{
      const m = b.bill_month?.slice(0,7)??''
      if(!map[m]) map[m]={month:m,bills:[],total:0,units:0}
      map[m].bills.push(b)
      map[m].total += b.amount??0
      map[m].units += b.units_consumed??0
    })
    return Object.values(map).sort((a,b)=>b.month.localeCompare(a.month))
  },[bills])

  const grandTotal = (bills??[]).reduce((s:number,b:any)=>s+(b.amount??0),0)
  const meterOptions = (meters??[]).map((m:any)=>({value:m.id,label:`${m.meter_name} — ${m.farms?.name}`}))

  return (
    <>
      <div className="flex gap-3 items-center justify-between mb-4">
        <Select label="" placeholder="All Meters" options={meterOptions} value={filterMeter} onChange={e=>setFilterMeter(e.target.value)} className="w-64"/>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Total ({(bills??[]).length} bills): <strong className="text-gray-900">{inr(grandTotal)}</strong></span>
        </div>
        <Button variant="outline" size="sm" icon={<Download size={14}/>}
          onClick={()=>exportCSV('elec_history.csv',['month','meter','site','units','amount','paid_date'],(bills??[]).map((b:any)=>[b.bill_month?.slice(0,7),b.electricity_meters?.meter_name,b.electricity_meters?.farms?.name,b.units_consumed,b.amount,b.paid_date]))}>
          Export CSV
        </Button>
      </div>

      {isLoading ? <Spinner/> : (
        <div className="space-y-4">
          {byMonth.map(group => (
            <Card key={group.month} padding={false}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="font-semibold text-gray-800">{fmtMonth(group.month+'-01')}</span>
                <div className="flex gap-6 text-sm">
                  <span className="text-gray-500">{group.units.toLocaleString('en-IN')} units</span>
                  <span className="font-bold text-gray-900">{inr(group.total)}</span>
                  <Badge color={group.bills.every((b:any)=>b.paid_date)?'green':'yellow'}>
                    {group.bills.every((b:any)=>b.paid_date)?'All Paid':'Pending'}
                  </Badge>
                </div>
              </div>
              <Table>
                <thead><tr>
                  <Th>Meter</Th><Th>Site</Th><Th right>Units</Th>
                  <Th right>Amount</Th><Th right>ACD/DC</Th><Th>Paid Date</Th><Th>Remarks</Th>
                </tr></thead>
                <tbody>
                  {group.bills.map((b:any)=>(
                    <tr key={b.id} className="hover:bg-gray-50">
                      <Td className="text-sm">{b.electricity_meters?.meter_name}</Td>
                      <Td className="text-xs text-gray-500">{b.electricity_meters?.farms?.name}</Td>
                      <Td right className="text-xs">{b.units_consumed?.toLocaleString('en-IN')??'—'}</Td>
                      <Td right><span className="font-semibold">{inr(b.amount)}</span></Td>
                      <Td right className="text-xs">{b.acd_dc_due>0?inr(b.acd_dc_due):'—'}</Td>
                      <Td className="text-xs">{b.paid_date ? <Badge color="green">{b.paid_date}</Badge> : <Badge color="yellow">Unpaid</Badge>}</Td>
                      <Td className="text-xs text-gray-400">{b.remarks??''}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ))}
          {byMonth.length===0 && <EmptyState icon={<BarChart2 size={32}/>} title="No billing history found"/>}
        </div>
      )}
    </>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
type TabKey = 'bills' | 'allocation' | 'history'

export const ElectricityEntry: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('bills')

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'bills',      label: 'Bills Entry' },
    { key: 'allocation', label: 'Allocation to Flocks' },
    { key: 'history',    label: 'History' },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader title="Electricity" subtitle="Bill entry, flock allocation and history" />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===t.key?'border-brand-600 text-brand-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bills'      && <BillsTab />}
      {tab === 'allocation' && <AllocationTab />}
      {tab === 'history'    && <HistoryTab />}
    </div>
  )
}
