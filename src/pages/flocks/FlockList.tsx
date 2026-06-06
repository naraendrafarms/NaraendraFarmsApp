import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useFarmScope } from '@/lib/useFarmScope'
import { inr, pct, fmtDate, statusColor } from '@/lib/utils'
import {
  Card, CardHeader, Button, Modal, Input, Select, FormRow, Divider,
  Table, Th, Td, Badge, Spinner, SectionHeader, EmptyState
} from '@/components/ui'
import { Plus, Bird, Eye } from 'lucide-react'
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
    free_female: '0', free_male: '0', chick_rate: '320',
    laying_start_date: '', supplier: 'Venkateshwara Hatcheries', remarks: ''
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
      const { error } = await supabase.from('flocks').insert({
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
        supplier:         form.supplier,
        remarks:          form.remarks,
        status:           'rearing',
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(`Flock ${form.flock_no} added successfully!`)
      qc.invalidateQueries({ queryKey: ['flocks'] })
      qc.invalidateQueries({ queryKey: ['flock_summary'] })
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
        {inr(((parseInt(form.paid_female)||0)+(parseInt(form.paid_male)||0)) * (parseFloat(form.chick_rate)||320))}
      </div>

      <Divider label="Optional" />
      <FormRow>
        <Input label="Laying Start Date" type="date"
          value={form.laying_start_date} onChange={e => set('laying_start_date', e.target.value)} />
        <Input label="Supplier / Source"
          value={form.supplier} onChange={e => set('supplier', e.target.value)} />
      </FormRow>
    </div>
  )
}

// ── FLOCK LIST ──────────────────────────────────────────────────
export const FlockList: React.FC = () => {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all'|'rearing'|'laying'|'closed'>('all')
  const qc = useQueryClient()
  const { applyFarmFilter, farmId } = useFarmScope()

  const { data: flocks, isLoading } = useQuery({
    queryKey: ['flocks', farmId],
    queryFn: async () => {
      let q = supabase
        .from('v_flock_summary')
        .select('*')
        .order('flock_no')
      q = applyFarmFilter(q, 'laying_farm_id')
      const { data } = await q
      return data ?? []
    }
  })

  const filtered = flocks?.filter(f => filter === 'all' ? true : f.status === filter) ?? []

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Flocks"
        subtitle={`${flocks?.length ?? 0} total • ${flocks?.filter((f:any)=>f.status!=='closed').length??0} active`}
        action={
          <Button icon={<Plus size={16}/>} onClick={() => setShowForm(true)}>
            Add Flock
          </Button>
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

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead>
              <tr>
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
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <Td><span className="font-bold text-gray-900">F-{f.flock_no}</span></Td>
                  <Td>
                    <Badge color={f.status==='laying'?'green':f.status==='rearing'?'yellow':'gray'}>
                      {f.status}
                    </Badge>
                  </Td>
                  <Td className="text-xs">{f.laying_farm}</Td>
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
                    <Link to={`/flocks/${f.id}`}
                      className="p-1.5 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors inline-flex">
                      <Eye size={14}/>
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {filtered.length === 0 && (
            <EmptyState icon={<Bird size={32}/>} title="No flocks found"
              subtitle={filter!=='all'?`No ${filter} flocks`:'Add your first flock to get started'}
              action={<Button onClick={()=>setShowForm(true)} icon={<Plus size={16}/>}>Add Flock</Button>}
            />
          )}
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add New Flock" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button>Save Flock</Button>
          </>
        }>
        <FlockForm onClose={() => setShowForm(false)} onSuccess={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}
