import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import { useFarmScope } from '@/lib/useFarmScope'
import {
  Card, CardHeader, Button, Input, Select, FormRow, Divider,
  SectionHeader, Spinner, Badge
} from '@/components/ui'
import toast from 'react-hot-toast'
import { Save, ChevronLeft, ChevronRight } from 'lucide-react'

const FEED_TYPES = ['BCM','BGM','BDM','PBM','L1','L2','L3','CHICK']

export const DailyEntry: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [selectedFlock, setSelectedFlock] = useState('')
  const [date, setDate] = useState(today())

  const { data: flocks } = useQuery({
    queryKey: ['active_flocks', farmId],
    queryFn: async () => {
      let q = supabase
        .from('flocks')
        .select('id, flock_no, status, laying_farm_id, rearing_farm_id, farms!laying_farm_id(name)')
        .neq('status', 'closed')
        .order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q
      return data ?? []
    }
  })

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['daily_record', selectedFlock, date],
    queryFn: async () => {
      if (!selectedFlock || !date) return null
      const { data } = await supabase
        .from('daily_records')
        .select('*')
        .eq('flock_id', selectedFlock)
        .eq('record_date', date)
        .single()
      return data
    },
    enabled: !!selectedFlock && !!date
  })

  // Get previous day to pre-fill opening birds
  const { data: prevRecord } = useQuery({
    queryKey: ['prev_daily', selectedFlock, date],
    queryFn: async () => {
      if (!selectedFlock) return null
      const { data } = await supabase
        .from('daily_records')
        .select('closing_female, closing_male, record_date')
        .eq('flock_id', selectedFlock)
        .lt('record_date', date)
        .order('record_date', { ascending: false })
        .limit(1)
        .single()
      return data
    },
    enabled: !!selectedFlock && !!date
  })

  const [form, setForm] = useState({
    opening_female: '', opening_male: '',
    feed_female_kg: '', feed_male_kg: '',
    feed_type_f: 'L1', feed_type_m: 'MALE',
    total_eggs: '', he_eggs: '', je_eggs: '0', te_eggs: '0', be_eggs: '0', le_eggs: '0',
    trcull_female: '0', trcull_male: '0',
    mortality_female: '0', mortality_male: '0',
    closing_female: '', closing_male: '',
    lighting_hrs: '', age_weeks: '',
    remarks: ''
  })

  // Pre-fill when existing record loads or prev record available
  useEffect(() => {
    if (existing) {
      setForm({
        opening_female: existing.opening_female?.toString() ?? '',
        opening_male:   existing.opening_male?.toString() ?? '',
        feed_female_kg: existing.feed_female_kg?.toString() ?? '',
        feed_male_kg:   existing.feed_male_kg?.toString() ?? '',
        feed_type_f:    existing.feed_type_f ?? 'L1',
        feed_type_m:    existing.feed_type_m ?? 'MALE',
        total_eggs:     existing.total_eggs?.toString() ?? '',
        he_eggs:        existing.he_eggs?.toString() ?? '',
        je_eggs:        existing.je_eggs?.toString() ?? '0',
        te_eggs:        existing.te_eggs?.toString() ?? '0',
        be_eggs:        existing.be_eggs?.toString() ?? '0',
        le_eggs:        existing.le_eggs?.toString() ?? '0',
        trcull_female:  existing.trcull_female?.toString() ?? '0',
        trcull_male:    existing.trcull_male?.toString() ?? '0',
        mortality_female: existing.mortality_female?.toString() ?? '0',
        mortality_male:   existing.mortality_male?.toString() ?? '0',
        closing_female: existing.closing_female?.toString() ?? '',
        closing_male:   existing.closing_male?.toString() ?? '',
        lighting_hrs:   existing.lighting_hrs?.toString() ?? '',
        age_weeks:      existing.age_weeks?.toString() ?? '',
        remarks:        existing.remarks ?? ''
      })
    } else if (prevRecord && !existing) {
      setForm(f => ({
        ...f,
        opening_female: prevRecord.closing_female?.toString() ?? '',
        opening_male:   prevRecord.closing_male?.toString() ?? '',
      }))
    }
  }, [existing, prevRecord])

  // Auto-compute closing = opening - trcull - mort
  const autoClose = () => {
    const of = parseInt(form.opening_female) || 0
    const om = parseInt(form.opening_male) || 0
    const tcf = parseInt(form.trcull_female) || 0
    const tcm = parseInt(form.trcull_male) || 0
    const mf = parseInt(form.mortality_female) || 0
    const mm = parseInt(form.mortality_male) || 0
    setForm(f => ({
      ...f,
      closing_female: Math.max(0, of - tcf - mf).toString(),
      closing_male:   Math.max(0, om - tcm - mm).toString(),
    }))
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const selectedFlockData = flocks?.find((f: any) => f.id === selectedFlock)

  const mut = useMutation({
    mutationFn: async () => {
      if (!selectedFlock || !date) throw new Error('Select flock and date')
      const payload = {
        flock_id:         selectedFlock,
        record_date:      date,
        farm_id:          selectedFlockData?.laying_farm_id ?? selectedFlockData?.rearing_farm_id,
        opening_female:   parseInt(form.opening_female) || 0,
        opening_male:     parseInt(form.opening_male) || 0,
        feed_female_kg:   parseFloat(form.feed_female_kg) || 0,
        feed_male_kg:     parseFloat(form.feed_male_kg) || 0,
        feed_type_f:      form.feed_type_f,
        feed_type_m:      form.feed_type_m,
        total_eggs:       parseInt(form.total_eggs) || 0,
        he_eggs:          parseInt(form.he_eggs) || 0,
        je_eggs:          parseInt(form.je_eggs) || 0,
        te_eggs:          parseInt(form.te_eggs) || 0,
        be_eggs:          parseInt(form.be_eggs) || 0,
        le_eggs:          parseInt(form.le_eggs) || 0,
        trcull_female:    parseInt(form.trcull_female) || 0,
        trcull_male:      parseInt(form.trcull_male) || 0,
        mortality_female: parseInt(form.mortality_female) || 0,
        mortality_male:   parseInt(form.mortality_male) || 0,
        closing_female:   parseInt(form.closing_female) || 0,
        closing_male:     parseInt(form.closing_male) || 0,
        lighting_hrs:     parseFloat(form.lighting_hrs) || null,
        age_weeks:        parseFloat(form.age_weeks) || null,
        remarks:          form.remarks || null,
      }
      if (existing) {
        const { error } = await supabase.from('daily_records').update(payload).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('daily_records').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(existing ? 'Record updated!' : 'Record saved!')
      qc.invalidateQueries({ queryKey: ['daily_record', selectedFlock, date] })
      qc.invalidateQueries({ queryKey: ['flock_summary'] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const prevDay = () => {
    const d = new Date(date); d.setDate(d.getDate()-1)
    setDate(d.toISOString().split('T')[0])
  }
  const nextDay = () => {
    const d = new Date(date); d.setDate(d.getDate()+1)
    setDate(d.toISOString().split('T')[0])
  }

  // Computed metrics
  const openF = parseInt(form.opening_female)||0
  const totalEggs = parseInt(form.total_eggs)||0
  const heEggs = parseInt(form.he_eggs)||0
  const hdPct = openF>0 ? (totalEggs/openF*100).toFixed(1)+'%' : '—'
  const hePct = totalEggs>0 ? (heEggs/totalEggs*100).toFixed(1)+'%' : '—'

  return (
    <div className="space-y-5">
      <SectionHeader title="Daily Flock Entry" subtitle="Enter daily production and bird movement data" />

      {/* Flock + Date selector */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <Select label="Select Flock" required placeholder="— Choose flock —"
              options={(flocks??[]).map((f:any)=>({ value:f.id, label:`Flock ${f.flock_no} — ${f.status}` }))}
              value={selectedFlock} onChange={e => setSelectedFlock(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={prevDay} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
              <ChevronLeft size={16}/>
            </button>
            <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <button onClick={nextDay} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
              <ChevronRight size={16}/>
            </button>
          </div>
          {existing && <Badge color="blue">Editing existing record</Badge>}
          {prevRecord && !existing && (
            <span className="text-xs text-gray-400">Opening pre-filled from previous day ({prevRecord.record_date})</span>
          )}
        </div>
      </Card>

      {selectedFlock && (
        <>
          {/* Birds */}
          <Card>
            <CardHeader title="Bird Count" />
            <div className="space-y-4">
              <FormRow cols={4}>
                <Input label="Opening Female" type="number" required
                  value={form.opening_female} onChange={e => set('opening_female', e.target.value)} />
                <Input label="Opening Male" type="number" required
                  value={form.opening_male} onChange={e => set('opening_male', e.target.value)} />
                <div/>
                <Button variant="secondary" size="sm" onClick={autoClose} className="self-end">
                  Auto-compute Closing
                </Button>
              </FormRow>
              <FormRow cols={4}>
                <Input label="Tr+Cull Female" type="number"
                  value={form.trcull_female} onChange={e => set('trcull_female', e.target.value)}
                  hint="Transfers + culls" />
                <Input label="Tr+Cull Male" type="number"
                  value={form.trcull_male} onChange={e => set('trcull_male', e.target.value)} />
                <Input label="Mortality Female" type="number"
                  value={form.mortality_female} onChange={e => set('mortality_female', e.target.value)} />
                <Input label="Mortality Male" type="number"
                  value={form.mortality_male} onChange={e => set('mortality_male', e.target.value)} />
              </FormRow>
              <FormRow cols={4}>
                <Input label="Closing Female" type="number"
                  value={form.closing_female} onChange={e => set('closing_female', e.target.value)} />
                <Input label="Closing Male" type="number"
                  value={form.closing_male} onChange={e => set('closing_male', e.target.value)} />
              </FormRow>
            </div>
          </Card>

          {/* Feed */}
          <Card>
            <CardHeader title="Feed Consumption" />
            <FormRow cols={4}>
              <Input label="Female Feed (kg)" type="number" step="0.001"
                value={form.feed_female_kg} onChange={e => set('feed_female_kg', e.target.value)} />
              <Select label="Female Feed Type"
                options={FEED_TYPES} value={form.feed_type_f}
                onChange={e => set('feed_type_f', e.target.value)} />
              <Input label="Male Feed (kg)" type="number" step="0.001"
                value={form.feed_male_kg} onChange={e => set('feed_male_kg', e.target.value)} />
              <Select label="Male Feed Type"
                options={['MALE','BCM','PBM']} value={form.feed_type_m}
                onChange={e => set('feed_type_m', e.target.value)} />
            </FormRow>
          </Card>

          {/* Eggs */}
          <Card>
            <CardHeader
              title="Egg Collection"
              action={
                <div className="flex gap-4 text-sm">
                  <span>HD%: <strong className={(parseFloat(hdPct)>85?'text-green-600':'text-orange-500')} >{hdPct}</strong></span>
                  <span>HE%: <strong className={(parseFloat(hePct)>88?'text-green-600':'text-orange-500')}>{hePct}</strong></span>
                </div>
              }
            />
            <FormRow cols={3}>
              <Input label="Total Eggs" type="number" required
                value={form.total_eggs} onChange={e => set('total_eggs', e.target.value)} />
              <Input label="HE (Hatching Eggs)" type="number"
                value={form.he_eggs} onChange={e => set('he_eggs', e.target.value)} />
              <Input label="Jumbo Eggs (JE)" type="number"
                value={form.je_eggs} onChange={e => set('je_eggs', e.target.value)} />
            </FormRow>
            <div className="mt-3">
              <FormRow cols={3}>
                <Input label="Table Eggs (TE)" type="number"
                  value={form.te_eggs} onChange={e => set('te_eggs', e.target.value)} />
                <Input label="Broken Eggs (BE)" type="number"
                  value={form.be_eggs} onChange={e => set('be_eggs', e.target.value)} />
                <Input label="Litter Eggs (LE)" type="number"
                  value={form.le_eggs} onChange={e => set('le_eggs', e.target.value)} />
              </FormRow>
            </div>
          </Card>

          {/* Misc */}
          <Card>
            <CardHeader title="Other Details" />
            <FormRow>
              <Input label="Lighting Hours" type="number" step="0.5"
                value={form.lighting_hrs} onChange={e => set('lighting_hrs', e.target.value)} />
              <Input label="Age (Weeks)" type="number" step="0.1"
                value={form.age_weeks} onChange={e => set('age_weeks', e.target.value)} />
            </FormRow>
            <div className="mt-4">
              <Input label="Remarks"
                value={form.remarks} onChange={e => set('remarks', e.target.value)} />
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSelectedFlock('')}>Clear</Button>
            <Button icon={<Save size={16}/>} loading={mut.isPending} onClick={() => mut.mutate()}>
              {existing ? 'Update Record' : 'Save Record'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
