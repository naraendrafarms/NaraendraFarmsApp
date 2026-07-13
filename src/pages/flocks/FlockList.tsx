import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useFarmScope } from '@/lib/useFarmScope'
import { inr, pct, fmtDate, statusColor } from '@/lib/utils'
import {
  Card, CardHeader, Button, Modal, Input, Select, FormRow, Divider,
  Table, Th, Td, Badge, Spinner, SectionHeader, EmptyState
, DateInput } from '@/components/ui'
import { Plus, Bird, Eye, Trash2, CheckSquare, Edit2, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import type { Flock } from '@/types'

const BREEDS = ['VENCO-430', 'VENCO-440', 'Vencobb-400', 'Hubbard', 'Cobb-500', 'Ross-308']

// ── NEW FLOCK FORM ──────────────────────────────────────────────
const FlockForm: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const qc = useQueryClient()
  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('*').eq('is_active', true).order('name')
      return data ?? []
    }
  })

  const [form, setForm] = useState({
    flock_no: '', breed: 'VENCO-430',
    rearing_farm_id: '', laying_farm_id: '',
    placement_date: '', paid_female: '', paid_male: '',
    free_female: '0', free_male: '0', chick_rate: '',
    laying_start_date: '', supplier: 'Venkateshwara Hatcheries', remarks: '',
    chick_invoice_no: '', chick_invoice_date: '', laying_season: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const farmOptions = farms?.map(f => ({ value: f.id, label: f.name })) ?? []

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.flock_no)          e.flock_no = 'Required'
    if (!form.rearing_farm_id)   e.rearing_farm_id = 'Required'
    if (!form.laying_farm_id)    e.laying_farm_id = 'Required'
    if (!form.placement_date)    e.placement_date = 'Required'
    if (!form.paid_female || isNaN(+form.paid_female)) e.paid_female = 'Must be a number'
    if (!form.paid_male   || isNaN(+form.paid_male))   e.paid_male = 'Must be a number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error('Validation failed')
      const { data: newFlock, error } = await supabase.from('flocks').insert({
        flock_no:         form.flock_no.trim(),
        breed:            form.breed,
        rearing_farm_id:  form.rearing_farm_id,
        laying_farm_id:   form.laying_farm_id,
        placement_date:   form.placement_date,
        paid_female:      parseInt(form.paid_female),
        paid_male:        parseInt(form.paid_male),
        free_female:      parseInt(form.free_female) || 0,
        free_male:        parseInt(form.free_male) || 0,
        chick_rate:       parseFloat(form.chick_rate) || 320,
        laying_start_date: form.laying_start_date || null,
        laying_season:    form.laying_season || null,
        supplier:         form.supplier,
        remarks:          form.remarks,
        chick_invoice_no:   form.chick_invoice_no || null,
        chick_invoice_date: form.chick_invoice_date || null,
        status:           'rearing',
      }).select('id').single()
      if (error) throw error
      // Auto-create supplier_invoice record if invoice details provided
      if (form.chick_invoice_no && newFlock) {
        const chickCost = ((parseInt(form.paid_female)||0)+(parseInt(form.paid_male)||0)) * (parseFloat(form.chick_rate)||0)
        await supabase.from('supplier_invoices').insert({
          invoice_no:   form.chick_invoice_no,
          invoice_date: form.chick_invoice_date || form.placement_date,
          supplier_name: form.supplier,
          source_type:  'chick',
          flock_id:     newFlock.id,
          farm_id:      form.rearing_farm_id || null,
          total_amount: chickCost,
          payment_status: 'unpaid',
        })
      }
    },
    onSuccess: () => {
      toast.success(`Flock ${form.flock_no} added successfully!`)
      qc.invalidateQueries({ queryKey: ['flocks'] })
      qc.invalidateQueries({ queryKey: ['flock_summary'] })
      qc.invalidateQueries({ queryKey: ['flock_dashboard'] })
      onSuccess()
    },
    onError: (e: any) => toast.error(e.message)
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <FormRow>
        <Input label="Flock No" required placeholder="e.g. 21"
          value={form.flock_no} onChange={e => set('flock_no', e.target.value)}
          error={errors.flock_no} />
        <Select label="Breed" required
          options={BREEDS} value={form.breed}
          onChange={e => set('breed', e.target.value)} />
      </FormRow>

      <FormRow>
        <Select label="Rearing Farm" required placeholder="— Select —"
          options={farmOptions} value={form.rearing_farm_id}
          onChange={e => set('rearing_farm_id', e.target.value)}
          error={errors.rearing_farm_id} />
        <Select label="Laying Farm" required placeholder="— Select —"
          options={farmOptions} value={form.laying_farm_id}
          onChange={e => set('laying_farm_id', e.target.value)}
          error={errors.laying_farm_id} />
      </FormRow>

      <Divider label="Placement" />
      <FormRow>
        <Input label="Placement Date" required type="date"
          value={form.placement_date} onChange={e => set('placement_date', e.target.value)}
          error={errors.placement_date} />
        <Input label="Chick Rate (Rs/chick)" type="number" step="0.01"
          value={form.chick_rate} onChange={e => set('chick_rate', e.target.value)} />
      </FormRow>

      <FormRow cols={4}>
        <Input label="Paid Female" required type="number"
          value={form.paid_female} onChange={e => set('paid_female', e.target.value)}
          error={errors.paid_female} />
        <Input label="Paid Male" required type="number"
          value={form.paid_male} onChange={e => set('paid_male', e.target.value)}
          error={errors.paid_male} />
        <Input label="Free Female" type="number"
          value={form.free_female} onChange={e => set('free_female', e.target.value)} />
        <Input label="Free Male" type="number"
          value={form.free_male} onChange={e => set('free_male', e.target.value)} />
      </FormRow>

      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
        <strong>Total Placed:</strong>{' '}
        {((parseInt(form.paid_female)||0)+(parseInt(form.free_female)||0)).toLocaleString('en-IN')} F + {' '}
        {((parseInt(form.paid_male)||0)+(parseInt(form.free_male)||0)).toLocaleString('en-IN')} M
        {' '} | <strong>Chick Cost:</strong>{' '}
        {inr(((parseInt(form.paid_female)||0)+(parseInt(form.paid_male)||0)) * (parseFloat(form.chick_rate)||0))}
      </div>

      <Divider label="Chick Invoice" />
      <FormRow>
        <Input label="Invoice No" placeholder="e.g. VH/2024/1234"
          value={form.chick_invoice_no} onChange={e => set('chick_invoice_no', e.target.value)} />
        <Input label="Invoice Date" type="date"
          value={form.chick_invoice_date} onChange={e => set('chick_invoice_date', e.target.value)} />
      </FormRow>
      <p className="text-xs text-gray-400 -mt-2">Entering invoice details will auto-add it to the Invoice Register for payment tracking.</p>

      <Divider label="Optional" />
      <FormRow>
        <Input label="Laying Start Date" type="date"
          value={form.laying_start_date} onChange={e => set('laying_start_date', e.target.value)} />
        <Input label="Supplier / Hatchery"
          value={form.supplier} onChange={e => set('supplier', e.target.value)} />
      </FormRow>
      <FormRow>
        <Select label="Laying Season" placeholder="— Not set —"
          value={(form as any).laying_season ?? ''} onChange={e => set('laying_season' as any, e.target.value)}
          options={[{ value: 'Summer', label: 'Summer Laying' }, { value: 'Winter', label: 'Winter Laying' }]} />
      </FormRow>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save Flock</Button>
      </div>
    </div>
  )
}

// ── EDIT FLOCK FORM ─────────────────────────────────────────────
const EditFlockForm: React.FC<{ flockId: string; onClose: () => void }> = ({ flockId, onClose }) => {
  const qc = useQueryClient()
  const { data: farms } = useQuery({ queryKey:['farms'], queryFn: async()=>{ const{data}=await supabase.from('farms').select('*').eq('is_active',true).order('name'); return data??[] } })
  const farmOptions = (farms??[]).map((f:any) => ({ value: f.id, label: f.name }))

  const { data: flock, isLoading: flockLoading } = useQuery({
    queryKey: ['flock_full', flockId],
    queryFn: async () => {
      const { data } = await supabase.from('flocks').select('*').eq('id', flockId).single()
      return data
    },
    enabled: !!flockId
  })

  const [form, setForm] = useState({
    flock_no: '', breed: 'VENCO-430', rearing_farm_id: '', laying_farm_id: '',
    status: 'rearing', placement_date: '', laying_start_date: '',
    chick_rate: '320', supplier: '', remarks: '', laying_season: '',
    is_vhl_contract: false,
  })

  // populate form once flock loads
  React.useEffect(() => {
    if (flock) setForm({
      flock_no: flock.flock_no ?? '',
      breed: flock.breed ?? 'VENCO-430',
      rearing_farm_id: flock.rearing_farm_id ?? '',
      laying_farm_id: flock.laying_farm_id ?? '',
      status: flock.status ?? 'rearing',
      placement_date: flock.placement_date ?? '',
      laying_start_date: flock.laying_start_date ?? '',
      chick_rate: flock.chick_rate?.toString() ?? '',
      supplier: flock.supplier ?? '',
      remarks: flock.remarks ?? '',
      laying_season: flock.laying_season ?? '',
      is_vhl_contract: flock.is_vhl_contract ?? false,
    })
  }, [flock])
  const s = (k:string,v:string) => setForm(f=>({...f,[k]:v}))

  const mut = useMutation({
    mutationFn: async () => {
      if (!flockId) return
      // Closing a flock zeroes its bird count in summaries — warn if it
      // still has unpaid sales/dispatches, but don't hard-block.
      if (form.status === 'closed' && flock?.status !== 'closed') {
        const [{ count: nheOpen }, { count: heOpen }] = await Promise.all([
          supabase.from('nhe_sales').select('id', { count: 'exact', head: true }).eq('flock_id', flockId).or('payment_status.eq.Pending,payment_status.is.null'),
          supabase.from('he_dispatch').select('id', { count: 'exact', head: true }).eq('flock_id', flockId).or('payment_status.eq.Pending,payment_status.is.null'),
        ])
        const open = (nheOpen ?? 0) + (heOpen ?? 0)
        if (open > 0 && !window.confirm(`This flock still has ${open} unpaid sale(s)/dispatch(es). Closing it will zero its bird count in summaries. Close anyway?`)) {
          throw new Error('Close cancelled')
        }
      }
      const { error } = await supabase.from('flocks').update({
        flock_no: form.flock_no,
        breed: form.breed,
        rearing_farm_id: form.rearing_farm_id || null,
        laying_farm_id: form.laying_farm_id || null,
        status: form.status,
        placement_date: form.placement_date || null,
        laying_start_date: form.laying_start_date || null,
        chick_rate: parseFloat(form.chick_rate) || null,
        supplier: form.supplier || null,
        remarks: form.remarks || null,
        laying_season: form.laying_season || null,
        is_vhl_contract: form.is_vhl_contract,
      }).eq('id', flockId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Flock updated')
      qc.invalidateQueries({queryKey:['flocks']})
      qc.invalidateQueries({queryKey:['flock_full', flockId]})
      qc.invalidateQueries({queryKey:['flock_dashboard']})
      onClose()
    },
    onError: (e:any) => toast.error(e.message)
  })

  if (flockLoading || !flock) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700">
        Editing <strong>Flock F-{flock.flock_no}</strong>. All fields pre-loaded from database.
      </div>
      <FormRow>
        <Input label="Flock No" value={form.flock_no} onChange={e=>s('flock_no',e.target.value)}/>
        <Select label="Breed" options={BREEDS} value={form.breed} onChange={e=>s('breed',e.target.value)}/>
        <Select label="Status" options={['rearing','laying','closed']} value={form.status} onChange={e=>s('status',e.target.value)}/>
      </FormRow>
      <FormRow>
        <Select label="Rearing Farm (start site)" placeholder="— Select —" options={farmOptions} value={form.rearing_farm_id} onChange={e=>s('rearing_farm_id',e.target.value)}/>
        <Select label="Laying Farm (transfer site)" placeholder="— Select —" options={farmOptions} value={form.laying_farm_id} onChange={e=>s('laying_farm_id',e.target.value)}/>
      </FormRow>
      <FormRow>
        <DateInput label="Placement Date" value={form.placement_date} onChange={e=>s('placement_date',e.target.value)}/>
        <DateInput label="Laying Start Date" value={form.laying_start_date} onChange={e=>s('laying_start_date',e.target.value)}/>
        <Input label="Chick Rate (₹)" type="number" value={form.chick_rate} onChange={e=>s('chick_rate',e.target.value)}/>
      </FormRow>
      <FormRow>
        <Input label="Supplier" value={form.supplier} onChange={e=>s('supplier',e.target.value)}/>
        <Select label="Laying Season" placeholder="— Not set —" value={form.laying_season} onChange={e=>s('laying_season',e.target.value)}
          options={[{ value: 'Summer', label: 'Summer Laying' }, { value: 'Winter', label: 'Winter Laying' }]} />
      </FormRow>
      <FormRow>
        <Input label="Remarks" value={form.remarks} onChange={e=>s('remarks',e.target.value)}/>
      </FormRow>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={form.is_vhl_contract} onChange={e => setForm(f => ({ ...f, is_vhl_contract: e.target.checked }))} className="rounded" />
        VHL Contract Flock (tracked separately under the VHL module — daily entry, medicine, egg production, billing)
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={mut.isPending} onClick={()=>mut.mutate()}>Save Changes</Button>
      </div>
    </div>
  )
}

// ── FLOCK LIST ──────────────────────────────────────────────────
export const FlockList: React.FC = () => {
  const [showForm, setShowForm] = useState(false)
  const [editFlock, setEditFlock] = useState<string|null>(null)
  const [filter, setFilter] = useState<'all'|'rearing'|'laying'|'closed'>('all')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [delTarget, setDelTarget] = useState<string|null>(null)
  const qc = useQueryClient()
  const { applyFarmFilter, applyFlockFarmFilter, farmId } = useFarmScope()

  const { data: flocks, isLoading } = useQuery({
    queryKey: ['flocks', farmId],
    queryFn: async () => {
      let q = supabase
        .from('v_flock_summary')
        .select('*')
        .eq('is_vhl_contract', false)
        .order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q
      return data ?? []
    }
  })

  const filtered = flocks?.filter(f => filter === 'all' ? true : f.status === filter) ?? []

  const exportFlocks = () => {
    const headers = ['flock_no','breed','status','placement_date','laying_start_date','current_female','current_male','farm']
    const csv = [headers.join(',')]
    for (const f of filtered) {
      csv.push(headers.map(h => {
        const v = (f as any)[h] ?? (h==='farm' ? ((f as any).laying_farm_name ?? (f as any).farm_name ?? '') : '')
        return `"${String(v ?? '').replace(/"/g,'""')}"`
      }).join(','))
    }
    const blob = new Blob([csv.join('\n')], { type:'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `flocks_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const CHUNK = 100
      for (let i = 0; i < ids.length; i += CHUNK) {
        const { error } = await supabase.from('flocks').delete().in('id', ids.slice(i, i + CHUNK))
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(`${sel.size} flock(s) deleted`)
      setSel(new Set())
      setBulkConfirm(false)
      qc.invalidateQueries({ queryKey: ['flocks'] })
      qc.invalidateQueries({ queryKey: ['flock_summary'] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const singleDelMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('flocks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Flock deleted')
      setDelTarget(null)
      qc.invalidateQueries({ queryKey: ['flocks'] })
      qc.invalidateQueries({ queryKey: ['flock_summary'] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const allFilteredIds = filtered.map((f: any) => f.id)
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id: string) => sel.has(id))

  const toggleAll = () => {
    if (allSelected) {
      setSel(new Set())
    } else {
      setSel(new Set(allFilteredIds))
    }
  }

  const toggleOne = (id: string) => {
    setSel(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const delTargetFlock = flocks?.find((f: any) => f.id === delTarget)

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Flocks"
        subtitle={`${flocks?.length ?? 0} total • ${flocks?.filter((f:any)=>f.status!=='closed').length??0} active`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={exportFlocks}>Export</Button>
            <Button icon={<Plus size={16}/>} onClick={() => setShowForm(true)}>
              Add Flock
            </Button>
          </div>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all','rearing','laying','closed'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize
              ${filter===s ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {s}
            <span className="ml-1 text-xs opacity-70">
              ({s==='all' ? (flocks?.length ?? 0) : (flocks?.filter((f:any)=>f.status===s).length ?? 0)})
            </span>
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {sel.size > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          <CheckSquare size={16} className="text-red-600 shrink-0" />
          <span className="text-sm font-medium text-red-700">{sel.size} flock{sel.size > 1 ? 's' : ''} selected</span>
          <button onClick={() => setSel(new Set())}
            className="text-xs text-red-500 hover:text-red-700 underline">Clear</button>
          <div className="flex-1" />
          <button onClick={() => setBulkConfirm(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Trash2 size={14}/> Delete {sel.size} flock{sel.size > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead>
              <tr>
                <Th>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer" />
                </Th>
                <Th>Flock No</Th>
                <Th>Status</Th>
                <Th>Laying Site</Th>
                <Th>Placement</Th>
                <Th right>Placed F+M</Th>
                <Th right>Alive ♀</Th>
                <Th right>Total Eggs</Th>
                <Th right>HE</Th>
                <Th right>HE%</Th>
                <Th right>Revenue</Th>
                <Th>Last Record</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f: any) => (
                <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${sel.has(f.id) ? 'bg-red-50' : ''}`}>
                  <Td>
                    <input type="checkbox" checked={sel.has(f.id)} onChange={() => toggleOne(f.id)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer" />
                  </Td>
                  <Td><span className="font-bold text-gray-900">F-{f.flock_no}</span></Td>
                  <Td>
                    <Badge color={f.status==='laying'?'green':f.status==='rearing'?'yellow':'gray'}>
                      {f.status}
                    </Badge>
                  </Td>
                  <Td className="text-xs">
                    {f.laying_farm
                      ? f.laying_farm
                      : f.rearing_farm
                        ? <span className="text-gray-400 italic">{f.rearing_farm} (rearing)</span>
                        : <span className="text-red-400 italic">Not set</span>}
                  </Td>
                  <Td className="text-xs">{fmtDate(f.placement_date)}</Td>
                  <Td right className="text-xs">
                    {(f.total_placed_f??0).toLocaleString('en-IN')} + {(f.total_placed_m??0).toLocaleString('en-IN')}
                  </Td>
                  <Td right>{(f.current_female??0).toLocaleString('en-IN')}</Td>
                  <Td right className="text-xs">{((f.total_eggs??0)/100000).toFixed(2)}L</Td>
                  <Td right className="text-xs">{((f.total_he??0)/100000).toFixed(2)}L</Td>
                  <Td right>
                    <span className={(f.he_pct??0)>0.88?'text-green-600 font-medium':'text-orange-500'}>
                      {pct(f.he_pct)}
                    </span>
                  </Td>
                  <Td right className="text-xs font-medium text-green-700">{inr(f.he_revenue+f.nhe_revenue)}</Td>
                  <Td className="text-xs text-gray-400">{fmtDate(f.last_record_date)}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Link to={`/flocks/${f.id}`}
                        className="p-1.5 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors inline-flex">
                        <Eye size={14}/>
                      </Link>
                      <button onClick={() => setEditFlock(f.id)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors inline-flex">
                        <Edit2 size={14}/>
                      </button>
                      <button onClick={() => setDelTarget(f.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors inline-flex">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold text-xs">
                  <Td colSpan={5} className="text-right">TOTAL ({filtered.length} flock{filtered.length > 1 ? 's' : ''}{filter !== 'all' ? ` — ${filter}` : ''})</Td>
                  <Td right className="text-xs">
                    {filtered.reduce((s: number, f: any) => s + (f.total_placed_f ?? 0), 0).toLocaleString('en-IN')} + {filtered.reduce((s: number, f: any) => s + (f.total_placed_m ?? 0), 0).toLocaleString('en-IN')}
                  </Td>
                  <Td right>{filtered.reduce((s: number, f: any) => s + (f.current_female ?? 0), 0).toLocaleString('en-IN')}</Td>
                  <Td right className="text-xs">{(filtered.reduce((s: number, f: any) => s + (f.total_eggs ?? 0), 0) / 100000).toFixed(2)}L</Td>
                  <Td right className="text-xs">{(filtered.reduce((s: number, f: any) => s + (f.total_he ?? 0), 0) / 100000).toFixed(2)}L</Td>
                  <Td right></Td>
                  <Td right className="text-xs text-green-700">{inr(filtered.reduce((s: number, f: any) => s + (f.he_revenue ?? 0) + (f.nhe_revenue ?? 0), 0))}</Td>
                  <Td></Td>
                  <Td></Td>
                </tr>
              </tfoot>
            )}
          </Table>
          {filtered.length === 0 && (
            <EmptyState icon={<Bird size={32}/>} title="No flocks found"
              subtitle={filter!=='all'?`No ${filter} flocks`:'Add your first flock to get started'}
              action={<Button onClick={()=>setShowForm(true)} icon={<Plus size={16}/>}>Add Flock</Button>}
            />
          )}
        </Card>
      )}

      {/* Edit flock modal */}
      <Modal open={!!editFlock} onClose={() => setEditFlock(null)} title="Edit Flock" size="lg">
        {editFlock && <EditFlockForm flockId={editFlock} onClose={() => setEditFlock(null)} />}
      </Modal>

      {/* Add flock modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add New Flock" size="lg">
        <FlockForm onClose={() => setShowForm(false)} onSuccess={() => setShowForm(false)} />
      </Modal>

      {/* Single delete confirmation modal */}
      <Modal open={!!delTarget} onClose={() => setDelTarget(null)} title="Delete Flock" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDelTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={singleDelMut.isPending}
              onClick={() => delTarget && singleDelMut.mutate(delTarget)}>
              Delete Permanently
            </Button>
          </>
        }>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <strong>Flock {delTargetFlock?.flock_no}</strong>?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <strong>Warning:</strong> This will permanently delete the flock and ALL linked data
            (daily records, egg dispatches, sales, medicine records, vaccinations).
            This cannot be undone.
          </div>
        </div>
      </Modal>

      {/* Bulk delete confirmation modal */}
      <Modal open={bulkConfirm} onClose={() => setBulkConfirm(false)} title="Delete Multiple Flocks" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkConfirm(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={bulkDelMut.isPending}
              onClick={() => bulkDelMut.mutate(Array.from(sel))}>
              Delete {sel.size} Flock{sel.size > 1 ? 's' : ''} Permanently
            </Button>
          </>
        }>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <strong>{sel.size} flock{sel.size > 1 ? 's' : ''}</strong>?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <strong>Warning:</strong> This will permanently delete all selected flocks and ALL linked data
            (daily records, egg dispatches, sales, medicine records, vaccinations).
            This cannot be undone.
          </div>
        </div>
      </Modal>
    </div>
  )
}
