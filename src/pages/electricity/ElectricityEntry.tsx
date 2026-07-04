import React, { useState, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtMonth, currentFY } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState
, DateInput } from '@/components/ui'
import { Plus, Zap, Edit2, Trash2, Download, Upload, BarChart2, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

function exportCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const escape = (v: string|number|null|undefined) => `"${String(v??'').replace(/"/g,'""')}"`
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

async function parseFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  if (file.name.endsWith('.csv')) {
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    const parse = (line: string) => line.split(',').map(v => v.replace(/^"|"$/g,'').replace(/""/g,'"').trim())
    return { headers: parse(lines[0]), rows: lines.slice(1).map(parse) }
  }
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })
  const [headers, ...rows] = data as string[][]
  return { headers: headers.map(String), rows: rows.map(r => r.map(String)) }
}

const ALLOC_METHODS = [
  { value: 'full',            label: 'Full — 100% to one flock' },
  { value: 'bird_proportion', label: 'Bird Proportion' },
  { value: 'manual',          label: 'Manual %' },
]

const FY_OPTIONS = ['2024-25','2025-26','2026-27']
const MONTH_NAMES = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']

function fyMonths(fy: string): string[] {
  const [startY] = fy.split('-').map(Number)
  const months = []
  for (let m = 4; m <= 12; m++) months.push(`${startY}-${String(m).padStart(2,'0')}-01`)
  for (let m = 1; m <= 3; m++) months.push(`${startY+1}-${String(m).padStart(2,'0')}-01`)
  return months
}

// ── BILLS ENTRY TAB ──────────────────────────────────────────────────────────

const BillsTab: React.FC = () => {
  const qc = useQueryClient()
  const importRef = useRef<HTMLInputElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterMeter, setFilterMeter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: meters } = useQuery({
    queryKey: ['meters'],
    queryFn: async () => {
      const { data } = await supabase.from('electricity_meters').select('*, farms(name,code)').eq('is_active',true).order('meter_name')
      return data ?? []
    }
  })

  const { data: bills, isLoading } = useQuery({
    queryKey: ['elec_bills', filterMonth, filterMeter],
    queryFn: async () => {
      let q = supabase.from('electricity_bills')
        .select('*, electricity_meters(meter_name,usc_no,farms(name,code))')
        .order('bill_month', { ascending: false }).limit(500)
      if (filterMonth) q = q.eq('bill_month', filterMonth + '-01')
      if (filterMeter) q = q.eq('meter_id', filterMeter)
      const { data } = await q; return data ?? []
    }
  })

  const blank = () => ({ meter_id:'', bill_month:'', units_consumed:'', amount:'', acd_dc_due:'0', deposit_amount:'0', deposit_interest:'0', meter_rent:'0', paid_date:'', remarks:'' })
  const [form, setForm] = useState(blank())
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openForm = (bill?: any) => {
    if (bill) {
      setEditing(bill)
      setForm({ meter_id: bill.meter_id, bill_month: bill.bill_month?.slice(0,7)??'', units_consumed: bill.units_consumed?.toString()??'', amount: bill.amount?.toString()??'', acd_dc_due: bill.acd_dc_due?.toString()??'0', deposit_amount: bill.deposit_amount?.toString()??'0', deposit_interest: bill.deposit_interest?.toString()??'0', meter_rent: bill.meter_rent?.toString()??'0', paid_date: bill.paid_date??'', remarks: bill.remarks??'' })
    } else {
      setEditing(null)
      setForm(blank())
    }
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      const payload = { meter_id: form.meter_id, bill_month: form.bill_month+'-01', units_consumed: parseInt(form.units_consumed)||null, amount: parseFloat(form.amount), acd_dc_due: parseFloat(form.acd_dc_due)||0, deposit_amount: parseFloat(form.deposit_amount)||0, deposit_interest: parseFloat(form.deposit_interest)||0, meter_rent: parseFloat(form.meter_rent)||0, paid_date: form.paid_date||null, remarks: form.remarks||null }
      if (!payload.meter_id || !payload.bill_month || !payload.amount) throw new Error('Meter, month and amount required')
      if (editing) {
        const{error}=await supabase.from('electricity_bills').update(payload).eq('id',editing.id); if(error)throw error
        // Allocations store both alloc_pct and a pre-computed allocated_amount
        // (= old bill amount x pct). Editing the bill amount previously left
        // allocated_amount stale, drifting out of sync with both the new
        // total and its own stored percentage — recompute every allocation
        // row for this bill now.
        const { data: allocs } = await supabase.from('electricity_allocation').select('id,alloc_pct').eq('bill_id', editing.id)
        for (const a of (allocs ?? [])) {
          const newAmt = Math.round((payload.amount * (a.alloc_pct ?? 0) / 100) * 100) / 100
          await supabase.from('electricity_allocation').update({ allocated_amount: newAmt }).eq('id', a.id)
        }
      }
      else { const{error}=await supabase.from('electricity_bills').insert(payload); if(error)throw error }
    },
    onSuccess: () => { toast.success(editing?'Updated!':'Saved!'); qc.invalidateQueries({queryKey:['elec_bills']}); qc.invalidateQueries({queryKey:['elec_allocations']}); setShowForm(false) },
    onError: (e:any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      // Delete allocations first (cascade in case FK doesn't have ON DELETE CASCADE yet)
      await supabase.from('electricity_allocation').delete().eq('bill_id', id)
      const { error } = await supabase.from('electricity_bills').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({queryKey:['elec_bills']}); qc.invalidateQueries({queryKey:['elec_allocations']}) },
    onError: (e:any) => toast.error('Delete failed: ' + e.message)
  })

  const bulkDelete = async () => {
    if (!selected.size) return
    if (!confirm(`Delete ${selected.size} bill(s)?`)) return
    const ids = [...selected]
    // Delete allocations first, then bills
    for (let i = 0; i < ids.length; i += 50) {
      await supabase.from('electricity_allocation').delete().in('bill_id', ids.slice(i, i+50))
    }
    for (let i = 0; i < ids.length; i += 50) {
      await supabase.from('electricity_bills').delete().in('id', ids.slice(i, i+50))
    }
    setSelected(new Set())
    qc.invalidateQueries({queryKey:['elec_bills']})
    qc.invalidateQueries({queryKey:['elec_allocations']})
    toast.success(`Deleted ${ids.length} bills`)
  }

  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => {
    if (selected.size === (bills??[]).length) setSelected(new Set())
    else setSelected(new Set((bills??[]).map((b:any) => b.id)))
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const { headers: hdrs, rows } = await parseFile(file)
    if (!rows.length) { toast.error('Empty file'); return }
    const meterMap: Record<string,string> = {}
    for (const m of (meters??[])) { meterMap[m.meter_name?.toLowerCase()] = m.id; meterMap[m.usc_no?.toLowerCase()] = m.id }
    const toInsert = rows.map(vals => {
      const obj: Record<string,string> = {}; hdrs.forEach((h,i) => obj[h.toLowerCase().replace(/\s+/g,'_')] = vals[i]??'')
      const meter_id = meterMap[obj.meter_name?.toLowerCase()] || meterMap[obj.usc_no?.toLowerCase()]
      if (!meter_id || !obj.bill_month || !obj.amount) return null
      const month = obj.bill_month.length === 7 ? obj.bill_month + '-01' : obj.bill_month
      return { meter_id, bill_month: month, units_consumed: parseInt(obj.units_consumed)||null, amount: parseFloat(obj.amount)||0, acd_dc_due: parseFloat(obj.acd_dc_due)||0, deposit_amount: parseFloat(obj.deposit_amount)||0, paid_date: obj.paid_date||null, remarks: obj.remarks||null }
    }).filter(Boolean) as any[]
    if (!toInsert.length) { toast.error('No valid rows (meter_name/usc_no not matched)'); return }
    const { error } = await supabase.from('electricity_bills').upsert(toInsert, { onConflict: 'meter_id,bill_month' })
    if (error) { toast.error(error.message); return }
    toast.success(`Imported ${toInsert.length} bills`)
    qc.invalidateQueries({queryKey:['elec_bills']})
    if (importRef.current) importRef.current.value = ''
  }

  const meterOptions = (meters??[]).map((m:any) => ({ value: m.id, label: `${m.meter_name} (${m.usc_no}) — ${m.farms?.name}` }))
  const totals = {
    amount: (bills??[]).reduce((s:number,b:any)=>s+(b.amount??0),0),
    units: (bills??[]).reduce((s:number,b:any)=>s+(b.units_consumed??0),0),
    depositInterest: (bills??[]).reduce((s:number,b:any)=>s+(b.deposit_interest??0),0),
    netPayable: (bills??[]).reduce((s:number,b:any)=>s+(b.amount??0)-(b.deposit_interest??0),0),
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 items-end justify-between mb-4">
        <div className="flex flex-wrap gap-2 items-end">
          <Input label="" type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="w-44" />
          <Select label="" placeholder="All Meters" options={meterOptions} value={filterMeter} onChange={e=>setFilterMeter(e.target.value)} className="w-56" />
          {(filterMonth||filterMeter) && <Button variant="ghost" size="sm" onClick={()=>{setFilterMonth('');setFilterMeter('')}}>Clear</Button>}
          {bills && <span className="text-sm text-gray-500 self-center">{bills.length} bills · {totals.units.toLocaleString('en-IN')} units · <strong>{inr(totals.amount)}</strong>{totals.depositInterest>0 && <span className="text-green-600 ml-2">− {inr(totals.depositInterest)} interest = <strong>{inr(totals.netPayable)}</strong> net</span>}</span>}
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && <Button variant="outline" size="sm" className="!text-red-600 !border-red-300" onClick={bulkDelete}>Delete {selected.size}</Button>}
          <Button variant="outline" size="sm" icon={<Download size={14}/>}
            onClick={()=>exportCSV('electricity_bills_template.csv',['meter_name','bill_month','units_consumed','amount','acd_dc_due','deposit_amount','paid_date','remarks'],[['Main Meter','2025-06','1200','18500','0','0','2025-06-15','']]) }>
            Template
          </Button>
          <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={()=>importRef.current?.click()}>Import</Button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport}/>
          <Button variant="outline" size="sm" icon={<Download size={14}/>}
            onClick={()=>exportCSV('electricity_bills.csv',['meter_name','usc_no','site','bill_month','units_consumed','amount','acd_dc_due','deposit_amount','paid_date','remarks'],(bills??[]).map((b:any)=>[b.electricity_meters?.meter_name,b.electricity_meters?.usc_no,b.electricity_meters?.farms?.name,b.bill_month?.slice(0,7),b.units_consumed,b.amount,b.acd_dc_due,b.deposit_amount,b.paid_date,b.remarks]))}>
            Export
          </Button>
          <Button icon={<Plus size={16}/>} onClick={()=>openForm()}>Add Bill</Button>
        </div>
      </div>

      {/* Meter summary cards */}
      {(meters??[]).length > 0 && !filterMeter && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {(meters??[]).map((m:any) => {
            const latest = (bills??[]).find((b:any)=>b.meter_id===m.id)
            return (
              <Card key={m.id} className="!p-3">
                <div className="flex items-center gap-2 mb-1"><Zap size={14} className="text-orange-500"/><span className="text-xs font-medium text-gray-600 truncate">{m.meter_name}</span></div>
                <p className="text-xs text-gray-400">{m.farms?.code} · {m.usc_no}</p>
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
              <Th><input type="checkbox" checked={selected.size>0&&selected.size===(bills??[]).length} onChange={toggleAll} className="rounded"/></Th>
              <Th>Meter / Site</Th><Th>USC No</Th><Th>Month</Th>
              <Th right>Units</Th><Th right>Amount</Th><Th right>ACD/DC</Th>
              <Th right>Deposit</Th><Th right>Int. Credit</Th><Th right>Net Payable</Th><Th>Paid Date</Th><Th>Remarks</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(bills??[]).map((b:any) => (
                <tr key={b.id} className={`hover:bg-gray-50 ${selected.has(b.id)?'bg-brand-50':''}`}>
                  <Td><input type="checkbox" checked={selected.has(b.id)} onChange={()=>toggleSelect(b.id)} className="rounded"/></Td>
                  <Td><span className="font-medium text-sm">{b.electricity_meters?.meter_name}</span><br/><span className="text-xs text-gray-400">{b.electricity_meters?.farms?.name}</span></Td>
                  <Td className="text-xs text-gray-400 font-mono">{b.electricity_meters?.usc_no}</Td>
                  <Td className="text-sm font-medium">{fmtMonth(b.bill_month)}</Td>
                  <Td right>{b.units_consumed?.toLocaleString('en-IN')??'—'}</Td>
                  <Td right><span className="font-semibold">{inr(b.amount)}</span></Td>
                  <Td right>{b.acd_dc_due>0?inr(b.acd_dc_due):'—'}</Td>
                  <Td right>{b.deposit_amount>0?inr(b.deposit_amount):'—'}</Td>
                  <Td right>{b.deposit_interest>0?<span className="text-green-600 font-medium">+{inr(b.deposit_interest)}</span>:'—'}</Td>
                  <Td right><span className="font-semibold">{inr((b.amount??0)-(b.deposit_interest??0))}</span></Td>
                  <Td className="text-xs">{b.paid_date ? <Badge color="green">{b.paid_date}</Badge> : <span className="text-gray-300">—</span>}</Td>
                  <Td className="text-xs text-gray-400 max-w-xs truncate">{b.remarks??''}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={()=>openForm(b)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
                      <button onClick={()=>{ if(confirm('Delete this bill?')) delMut.mutate(b.id) }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
            {(bills??[]).length > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold">
                <Td colSpan={4}>TOTAL ({(bills??[]).length} bills)</Td>
                <Td right>{totals.units.toLocaleString('en-IN')}</Td>
                <Td right>{inr(totals.amount)}</Td>
                <Td colSpan={2}/>
                <Td right className="text-green-600">{totals.depositInterest>0?`+${inr(totals.depositInterest)}`:'—'}</Td>
                <Td right className="font-bold">{inr(totals.netPayable)}</Td>
                <Td colSpan={3}/>
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
            <Input label="Security Deposit (₹)" type="number" step="0.01" value={form.deposit_amount} onChange={e=>set('deposit_amount',e.target.value)}/>
            <Input label="Deposit Interest Credit (₹)" type="number" step="0.01" value={form.deposit_interest} onChange={e=>set('deposit_interest',e.target.value)} hint="Annual interest credited by APEPDCL — reduces net payable"/>
          </FormRow>
          <FormRow>
            <Input label="Meter Rent (₹)" type="number" step="0.01" value={form.meter_rent} onChange={e=>set('meter_rent',e.target.value)}/>
            <DateInput label="Paid Date" value={form.paid_date} onChange={e=>set('paid_date',e.target.value)}/>
          </FormRow>
          {(parseFloat(form.deposit_interest)||0) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
              Net Payable = {inr((parseFloat(form.amount)||0) - (parseFloat(form.deposit_interest)||0))}
              &nbsp;(Bill {inr(parseFloat(form.amount)||0)} − Interest {inr(parseFloat(form.deposit_interest)||0)})
            </div>
          )}
          <Input label="Remarks" value={form.remarks} onChange={e=>set('remarks',e.target.value)}/>
        </div>
      </Modal>
    </>
  )
}

// ── ALLOCATION TAB ────────────────────────────────────────────────────────────

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
    queryFn: async () => { const{data}=await supabase.from('electricity_allocation').select('*, flocks(flock_no)'); return data??[] }
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
      await supabase.from('electricity_allocation').delete().eq('bill_id', allocModal.id)
      const rows = allocForm.filter(r=>r.flock_id).map(r=>({
        bill_id: allocModal.id, flock_id: r.flock_id, alloc_method: r.method,
        alloc_pct: parseFloat(r.alloc_pct)/100,
        allocated_amount: allocModal.amount * parseFloat(r.alloc_pct)/100,
      }))
      if (rows.length) { const{error}=await supabase.from('electricity_allocation').insert(rows); if(error)throw error }
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
        <strong>Allocation</strong> — split each bill's cost across flocks for accurate P&amp;L. Total must equal 100%.
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
                    <Td><span className="font-medium text-sm">{b.electricity_meters?.meter_name}</span><br/><span className="text-xs text-gray-400">{b.electricity_meters?.farms?.name}</span></Td>
                    <Td className="text-sm font-medium">{fmtMonth(b.bill_month)}</Td>
                    <Td right><span className="font-semibold">{inr(b.amount)}</span></Td>
                    <Td className="text-xs">
                      {allocs.length>0 ? allocs.map((a:any)=>`F-${a.flocks?.flock_no} (${((a.alloc_pct??0)*100).toFixed(0)}%)`).join(', ') : <span className="text-gray-300">Not allocated</span>}
                    </Td>
                    <Td><Badge color={isAllocated?'green':allocs.length>0?'yellow':'gray'}>{isAllocated?'Done':allocs.length>0?'Partial':'Pending'}</Badge></Td>
                    <Td><button onClick={()=>openAlloc(b)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Settings size={13}/></button></Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
          {(bills??[]).length===0 && <EmptyState icon={<Zap size={32}/>} title="No bills found"/>}
        </Card>
      )}
      <Modal open={!!allocModal} onClose={()=>setAllocModal(null)}
        title={allocModal ? `Allocate — ${allocModal.electricity_meters?.meter_name} ${fmtMonth(allocModal.bill_month)} — ${inr(allocModal.amount??0)}` : ''} size="md"
        footer={<><Button variant="secondary" onClick={()=>setAllocModal(null)}>Cancel</Button><Button loading={allocMut.isPending} onClick={()=>allocMut.mutate()}>Save Allocation</Button></>}>
        <div className="space-y-3">
          {allocForm.map((row,i)=>(
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1"><Select label={i===0?'Flock':''} placeholder="— Select —" options={flockOptions} value={row.flock_id} onChange={e=>setAllocField(i,'flock_id',e.target.value)}/></div>
              <div className="w-20"><Input label={i===0?'%':''} type="number" step="0.1" value={row.alloc_pct} onChange={e=>setAllocField(i,'alloc_pct',e.target.value)}/></div>
              <div className="w-36"><Select label={i===0?'Method':''} options={ALLOC_METHODS} value={row.method} onChange={e=>setAllocField(i,'method',e.target.value)}/></div>
              {allocForm.length>1 && <button onClick={()=>removeAllocRow(i)} className="mb-1 text-red-400 hover:text-red-600 text-lg font-bold">×</button>}
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

// ── HISTORY TAB ───────────────────────────────────────────────────────────────

const HistoryTab: React.FC = () => {
  const [filterMeter, setFilterMeter] = useState('')
  const [filterFarm, setFilterFarm] = useState('')

  const { data: farms } = useQuery({ queryKey:['farms'], queryFn: async()=>{ const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name'); return data??[] } })
  const { data: meters } = useQuery({ queryKey:['meters'], queryFn: async()=>{ const{data}=await supabase.from('electricity_meters').select('id,meter_name,usc_no,farm_id,farms(name,code)').eq('is_active',true).order('meter_name'); return data??[] } })

  const filteredMeters = useMemo(()=>{
    if (!filterFarm) return meters??[]
    return (meters??[]).filter((m:any)=>m.farm_id===filterFarm)
  },[meters,filterFarm])

  const { data: bills, isLoading } = useQuery({
    queryKey: ['elec_history', filterMeter, filterFarm],
    queryFn: async () => {
      let q = supabase.from('electricity_bills')
        .select('*, electricity_meters!inner(meter_name,usc_no,farm_id,farms(name,code))')
        .order('bill_month', { ascending: false }).limit(1000)
      if (filterMeter) q = q.eq('meter_id', filterMeter)
      if (filterFarm) q = q.eq('electricity_meters.farm_id', filterFarm)
      const{data}=await q; return data??[]
    }
  })

  const byMonth = useMemo(()=>{
    const map: Record<string,{month:string;bills:any[];total:number;units:number}>={}
    ;(bills??[]).forEach((b:any)=>{ const m=b.bill_month?.slice(0,7)??''; if(!map[m])map[m]={month:m,bills:[],total:0,units:0}; map[m].bills.push(b); map[m].total+=b.amount??0; map[m].units+=b.units_consumed??0 })
    return Object.values(map).sort((a,b)=>b.month.localeCompare(a.month))
  },[bills])

  const grandTotal = (bills??[]).reduce((s:number,b:any)=>s+(b.amount??0),0)
  const grandUnits = (bills??[]).reduce((s:number,b:any)=>s+(b.units_consumed??0),0)
  const meterOptions = filteredMeters.map((m:any)=>({value:m.id,label:`${m.meter_name} — ${m.farms?.name}`}))
  const farmOptions = (farms??[]).map((f:any)=>({value:f.id,label:f.name}))

  return (
    <>
      <div className="flex flex-wrap gap-3 items-end justify-between mb-4">
        <div className="flex flex-wrap gap-2 items-end">
          <Select label="" placeholder="All Sites" options={farmOptions} value={filterFarm} onChange={e=>{setFilterFarm(e.target.value);setFilterMeter('')}} className="w-48"/>
          <Select label="" placeholder="All Meters" options={meterOptions} value={filterMeter} onChange={e=>setFilterMeter(e.target.value)} className="w-64"/>
          {(filterFarm||filterMeter) && <Button variant="ghost" size="sm" onClick={()=>{setFilterFarm('');setFilterMeter('')}}>Clear</Button>}
        </div>
        <div className="flex gap-4 text-sm text-gray-600 items-center">
          <span>{(bills??[]).length} bills · <strong>{grandUnits.toLocaleString('en-IN')}</strong> units · <strong className="text-gray-900">{inr(grandTotal)}</strong></span>
          <Button variant="outline" size="sm" icon={<Download size={14}/>}
            onClick={()=>exportCSV('elec_history.csv',['month','meter','site','units','amount','acd_dc_due','paid_date'],(bills??[]).map((b:any)=>[b.bill_month?.slice(0,7),b.electricity_meters?.meter_name,b.electricity_meters?.farms?.name,b.units_consumed,b.amount,b.acd_dc_due,b.paid_date]))}>
            Export
          </Button>
        </div>
      </div>
      {isLoading ? <Spinner/> : (
        <div className="space-y-3">
          {byMonth.map(group => (
            <Card key={group.month} padding={false}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="font-semibold text-gray-800">{fmtMonth(group.month+'-01')}</span>
                <div className="flex gap-6 text-sm">
                  <span className="text-gray-500">{group.units.toLocaleString('en-IN')} units</span>
                  <span className="font-bold text-gray-900">{inr(group.total)}</span>
                  {group.units>0 && <span className="text-gray-500">₹{(group.total/group.units).toFixed(2)}/unit</span>}
                  <Badge color={group.bills.every((b:any)=>b.paid_date)?'green':'yellow'}>
                    {group.bills.every((b:any)=>b.paid_date)?'All Paid':'Pending'}
                  </Badge>
                </div>
              </div>
              <Table>
                <thead><tr><Th>Meter</Th><Th>Site</Th><Th right>Units</Th><Th right>Amount</Th><Th right>₹/unit</Th><Th right>ACD/DC</Th><Th>Paid</Th></tr></thead>
                <tbody>
                  {group.bills.map((b:any)=>(
                    <tr key={b.id} className="hover:bg-gray-50">
                      <Td className="text-sm">{b.electricity_meters?.meter_name}</Td>
                      <Td className="text-xs text-gray-500">{b.electricity_meters?.farms?.name}</Td>
                      <Td right className="text-xs">{b.units_consumed?.toLocaleString('en-IN')??'—'}</Td>
                      <Td right><span className="font-semibold">{inr(b.amount)}</span></Td>
                      <Td right className="text-xs text-gray-500">{b.units_consumed>0?`₹${(b.amount/b.units_consumed).toFixed(2)}`:'—'}</Td>
                      <Td right className="text-xs">{b.acd_dc_due>0?inr(b.acd_dc_due):'—'}</Td>
                      <Td className="text-xs">{b.paid_date ? <Badge color="green">{b.paid_date}</Badge> : <Badge color="yellow">Unpaid</Badge>}</Td>
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

// ── ANALYSIS TAB ──────────────────────────────────────────────────────────────

const AnalysisTab: React.FC = () => {
  const [selectedFY, setSelectedFY] = useState(currentFY)
  const [compareFY, setCompareFY] = useState('')

  const months = fyMonths(selectedFY)
  const compareMonths = compareFY ? fyMonths(compareFY) : []

  const { data: farms } = useQuery({ queryKey:['farms'], queryFn: async()=>{ const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name'); return data??[] } })
  const { data: meters } = useQuery({ queryKey:['meters'], queryFn: async()=>{ const{data}=await supabase.from('electricity_meters').select('id,meter_name,usc_no,farm_id,farms(name,code)').eq('is_active',true); return data??[] } })

  const { data: bills } = useQuery({
    queryKey: ['elec_analysis', selectedFY, compareFY],
    queryFn: async () => {
      const allMonths = [...months, ...compareMonths]
      const { data } = await supabase.from('electricity_bills')
        .select('meter_id,bill_month,units_consumed,amount,electricity_meters(farm_id,farms(name,code))')
        .in('bill_month', allMonths)
      return data ?? []
    }
  })

  // Site-wise yearly totals
  const siteData = useMemo(()=>{
    const map: Record<string,{name:string;fy:number;fyUnits:number;cfy:number;cfyUnits:number}> = {}
    for (const b of (bills??[]) as any[]) {
      const farmId = b.electricity_meters?.farm_id
      const farmName = b.electricity_meters?.farms?.name ?? 'Unknown'
      if (!farmId) continue
      if (!map[farmId]) map[farmId] = {name:farmName,fy:0,fyUnits:0,cfy:0,cfyUnits:0}
      if (months.includes(b.bill_month)) { map[farmId].fy += b.amount??0; map[farmId].fyUnits += b.units_consumed??0 }
      if (compareMonths.includes(b.bill_month)) { map[farmId].cfy += b.amount??0; map[farmId].cfyUnits += b.units_consumed??0 }
    }
    return Object.values(map).sort((a,b)=>b.fy-a.fy)
  },[bills,months,compareMonths])

  // Month-wise trend across current FY
  const monthTrend = useMemo(()=>{
    return months.map((m,i)=>{
      const mBills = (bills??[] as any[]).filter((b:any)=>b.bill_month===m)
      const total = mBills.reduce((s:number,b:any)=>s+(b.amount??0),0)
      const units = mBills.reduce((s:number,b:any)=>s+(b.units_consumed??0),0)
      const cMonth = compareMonths[i]
      const cBills = cMonth ? (bills??[] as any[]).filter((b:any)=>b.bill_month===cMonth) : []
      const cTotal = cBills.reduce((s:number,b:any)=>s+(b.amount??0),0)
      const cUnits = cBills.reduce((s:number,b:any)=>s+(b.units_consumed??0),0)
      return { label: MONTH_NAMES[i], month: m, total, units, cTotal, cUnits, ratePerUnit: units>0?total/units:0 }
    })
  },[bills,months,compareMonths])

  const fyTotal = siteData.reduce((s,d)=>s+d.fy,0)
  const fyUnits = siteData.reduce((s,d)=>s+d.fyUnits,0)
  const cfyTotal = siteData.reduce((s,d)=>s+d.cfy,0)
  const cfyUnits = siteData.reduce((s,d)=>s+d.cfyUnits,0)
  const maxBar = Math.max(...siteData.map(d=>Math.max(d.fy,d.cfy)), 1)

  const handleExport = () => {
    exportCSV(`electricity_analysis_${selectedFY}.csv`,
      ['Site','FY Amount','FY Units','FY ₹/unit', ...(compareFY?[`${compareFY} Amount`,`${compareFY} Units`,`${compareFY} ₹/unit`]:[])],
      siteData.map(d=>[d.name, d.fy, d.fyUnits, d.fyUnits>0?(d.fy/d.fyUnits).toFixed(2):'', ...(compareFY?[d.cfy, d.cfyUnits, d.cfyUnits>0?(d.cfy/d.cfyUnits).toFixed(2):'']:[])])
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex gap-3 items-end flex-wrap">
          <Select label="Financial Year" options={FY_OPTIONS} value={selectedFY} onChange={e=>setSelectedFY(e.target.value)} className="w-36"/>
          <Select label="Compare with FY" placeholder="— No compare —" options={FY_OPTIONS.filter(f=>f!==selectedFY)} value={compareFY} onChange={e=>setCompareFY(e.target.value)} className="w-40"/>
          {compareFY && <Button variant="ghost" size="sm" onClick={()=>setCompareFY('')}>Clear</Button>}
        </div>
        <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export</Button>
      </div>

      {/* FY summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="!p-4"><div className="text-xs text-gray-500">{selectedFY} Total Amount</div><div className="text-xl font-bold text-orange-600 mt-1">{inr(fyTotal)}</div></Card>
        <Card className="!p-4"><div className="text-xs text-gray-500">{selectedFY} Total Units</div><div className="text-xl font-bold text-gray-800 mt-1">{fyUnits.toLocaleString('en-IN')}</div></Card>
        <Card className="!p-4"><div className="text-xs text-gray-500">Avg ₹/unit ({selectedFY})</div><div className="text-xl font-bold text-gray-800 mt-1">₹{fyUnits>0?(fyTotal/fyUnits).toFixed(2):'—'}</div></Card>
        {compareFY ? (
          <Card className="!p-4">
            <div className="text-xs text-gray-500">{compareFY} Total</div>
            <div className="text-xl font-bold text-blue-600 mt-1">{inr(cfyTotal)}</div>
            <div className="text-xs text-gray-400 mt-0.5">{cfyUnits>0?`₹${(cfyTotal/cfyUnits).toFixed(2)}/unit`:''}</div>
            {cfyTotal>0&&<div className={`text-xs font-semibold mt-1 ${fyTotal>cfyTotal?'text-red-500':'text-green-600'}`}>{fyTotal>cfyTotal?'▲':'▼'} {Math.abs(((fyTotal-cfyTotal)/cfyTotal)*100).toFixed(1)}% vs last year</div>}
          </Card>
        ) : (
          <Card className="!p-4"><div className="text-xs text-gray-500">Sites with meters</div><div className="text-xl font-bold text-gray-800 mt-1">{siteData.length}</div></Card>
        )}
      </div>

      {/* Site-wise comparison bar chart */}
      <Card>
        <div className="font-semibold text-gray-800 mb-4">Site-wise Electricity Cost</div>
        <div className="space-y-3">
          {siteData.map(d => (
            <div key={d.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{d.name}</span>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="font-semibold text-orange-600">{inr(d.fy)} · {d.fyUnits.toLocaleString('en-IN')} units</span>
                  {compareFY && d.cfy>0 && <span className="text-blue-500">{inr(d.cfy)} · {d.cfyUnits.toLocaleString('en-IN')} units ({compareFY})</span>}
                </div>
              </div>
              <div className="h-5 bg-gray-100 rounded-full overflow-hidden relative">
                <div className="h-full bg-orange-400 rounded-full" style={{width:`${(d.fy/maxBar)*100}%`}}/>
              </div>
              {compareFY && d.cfy>0 && (
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mt-1 relative">
                  <div className="h-full bg-blue-300 rounded-full" style={{width:`${(d.cfy/maxBar)*100}%`}}/>
                </div>
              )}
            </div>
          ))}
          {siteData.length===0 && <div className="text-gray-400 text-sm text-center py-4">No data for selected year</div>}
        </div>
        {compareFY && <div className="flex gap-4 mt-3 text-xs"><span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-400 rounded-full inline-block"/>{selectedFY}</span><span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-300 rounded-full inline-block"/>{compareFY}</span></div>}
      </Card>

      {/* Month-wise trend table */}
      <Card padding={false}>
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800">Month-wise Trend — {selectedFY}</div>
        <Table>
          <thead><tr>
            <Th>Month</Th>
            <Th right>Units</Th><Th right>Amount</Th><Th right>₹/unit</Th>
            {compareFY && <><Th right>{compareFY} Units</Th><Th right>{compareFY} Amount</Th><Th right>Diff</Th></>}
          </tr></thead>
          <tbody>
            {monthTrend.map(row=>(
              <tr key={row.month} className="hover:bg-gray-50">
                <Td className="font-medium">{row.label}</Td>
                <Td right>{row.units>0?row.units.toLocaleString('en-IN'):'—'}</Td>
                <Td right>{row.total>0?<span className="font-semibold">{inr(row.total)}</span>:'—'}</Td>
                <Td right className="text-xs text-gray-500">{row.ratePerUnit>0?`₹${row.ratePerUnit.toFixed(2)}`:'—'}</Td>
                {compareFY && <>
                  <Td right className="text-blue-500">{row.cUnits>0?row.cUnits.toLocaleString('en-IN'):'—'}</Td>
                  <Td right className="text-blue-500">{row.cTotal>0?inr(row.cTotal):'—'}</Td>
                  <Td right>
                    {row.total>0&&row.cTotal>0&&(
                      <span className={`text-xs font-semibold ${row.total>row.cTotal?'text-red-500':'text-green-600'}`}>
                        {row.total>row.cTotal?'▲':'▼'} {Math.abs(((row.total-row.cTotal)/row.cTotal)*100).toFixed(1)}%
                      </span>
                    )}
                  </Td>
                </>}
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="bg-gray-50 font-semibold">
            <Td>TOTAL</Td>
            <Td right>{fyUnits.toLocaleString('en-IN')}</Td>
            <Td right>{inr(fyTotal)}</Td>
            <Td right className="text-xs">{fyUnits>0?`₹${(fyTotal/fyUnits).toFixed(2)}`:''}</Td>
            {compareFY && <>
              <Td right className="text-blue-500">{cfyUnits.toLocaleString('en-IN')}</Td>
              <Td right className="text-blue-500">{inr(cfyTotal)}</Td>
              <Td right>{cfyTotal>0&&<span className={`text-xs font-semibold ${fyTotal>cfyTotal?'text-red-500':'text-green-600'}`}>{fyTotal>cfyTotal?'▲':'▼'} {Math.abs(((fyTotal-cfyTotal)/cfyTotal)*100).toFixed(1)}%</span>}</Td>
            </>}
          </tr></tfoot>
        </Table>
      </Card>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

type TabKey = 'bills' | 'allocation' | 'history' | 'analysis'

export const ElectricityEntry: React.FC = () => {
  const location = useLocation()
  const initialTab: TabKey = location.pathname.includes('allocation') ? 'allocation'
    : location.pathname.includes('history') ? 'history'
    : location.pathname.includes('analysis') ? 'analysis'
    : 'bills'

  const [tab, setTab] = useState<TabKey>(initialTab)

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'bills',      label: '⚡ Bills Entry' },
    { key: 'allocation', label: '📊 Allocation' },
    { key: 'history',    label: '📋 History' },
    { key: 'analysis',   label: '📈 Analysis' },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader title="Electricity" subtitle="Bill entry, flock allocation, history and analysis"/>
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab===t.key?'border-brand-600 text-brand-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'bills'      && <BillsTab />}
      {tab === 'allocation' && <AllocationTab />}
      {tab === 'history'    && <HistoryTab />}
      {tab === 'analysis'   && <AnalysisTab />}
    </div>
  )
}
