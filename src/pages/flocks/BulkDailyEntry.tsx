import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import {
  Card, CardHeader, Button, Select, Spinner, EmptyState, DateInput
} from '@/components/ui'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'

type RowState = {
  je_eggs: string; te_eggs: string; be_eggs: string
  mortality_female: string; mortality_male: string
  feed_female_kg: string
  med_id: string; med_qty: string
  existingDailyId: string | null
  existingMedId: string | null
}

const emptyRow = (): RowState => ({
  je_eggs: '', te_eggs: '', be_eggs: '',
  mortality_female: '', mortality_male: '',
  feed_female_kg: '',
  med_id: '', med_qty: '',
  existingDailyId: null, existingMedId: null,
})

export const BulkDailyEntry: React.FC = () => {
  const qc = useQueryClient()
  const [date, setDate] = useState(today())
  const [rows, setRows] = useState<Record<string, RowState>>({})
  const [saving, setSaving] = useState(false)

  const { data: flocks, isLoading: flocksLoading } = useQuery({
    queryKey: ['bulk_daily_flocks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('flocks')
        .select('id,flock_no,breed,status,laying_farm_id,rearing_farm_id,laying_farm:farms!laying_farm_id(name,code)')
        .neq('status', 'closed')
        .order('flock_no', { ascending: true })
      return data ?? []
    }
  })

  const { data: medicines } = useQuery({
    queryKey: ['medicines_master_list'],
    queryFn: async () => {
      const { data } = await supabase.from('medicines_master').select('id,name').order('name')
      return data ?? []
    }
  })

  // Load existing records for the selected date
  const { data: existing, isLoading: existingLoading } = useQuery({
    queryKey: ['bulk_existing', date],
    queryFn: async () => {
      const [dr, mu] = await Promise.all([
        supabase.from('daily_records')
          .select('id,flock_id,je_eggs,te_eggs,be_eggs,mortality_female,mortality_male')
          .eq('record_date', date),
        supabase.from('medicine_usage')
          .select('id,flock_id,medicine_id,quantity')
          .eq('usage_date', date),
      ])
      return { dr: dr.data ?? [], mu: mu.data ?? [] }
    },
    enabled: !!date,
  })

  const { data: feedExisting } = useQuery({
    queryKey: ['bulk_feed_existing', date],
    queryFn: async () => {
      const { data } = await supabase.from('daily_feed')
        .select('id,flock_id,female_kg,feed_type')
        .eq('feed_date', date)
      return data ?? []
    },
    enabled: !!date,
  })

  // Initialise rows from flocks + existing data
  useEffect(() => {
    if (!flocks) return
    const newRows: Record<string, RowState> = {}
    for (const f of flocks) {
      const dr = existing?.dr.find((r: any) => r.flock_id === f.id)
      const mu = existing?.mu.find((r: any) => r.flock_id === f.id)
      const fd = feedExisting?.find((r: any) => r.flock_id === f.id)
      newRows[f.id] = {
        je_eggs: dr?.je_eggs?.toString() ?? '',
        te_eggs: dr?.te_eggs?.toString() ?? '',
        be_eggs: dr?.be_eggs?.toString() ?? '',
        mortality_female: dr?.mortality_female?.toString() ?? '',
        mortality_male: dr?.mortality_male?.toString() ?? '',
        feed_female_kg: fd?.female_kg?.toString() ?? '',
        med_id: mu?.medicine_id ?? '',
        med_qty: mu?.quantity?.toString() ?? '',
        existingDailyId: dr?.id ?? null,
        existingMedId: mu?.id ?? null,
      }
    }
    setRows(newRows)
  }, [flocks, existing, feedExisting])

  const updateRow = (flockId: string, field: keyof RowState, value: string) => {
    setRows(prev => ({ ...prev, [flockId]: { ...prev[flockId], [field]: value } }))
  }

  const handleSaveAll = async () => {
    if (!flocks || !date) return
    setSaving(true)
    let errors = 0
    let saved = 0

    for (const flock of flocks) {
      const r = rows[flock.id]
      if (!r) continue

      const hasEggs = r.je_eggs || r.te_eggs || r.be_eggs
      const hasDeaths = r.mortality_female || r.mortality_male
      const hasFeed = r.feed_female_kg
      const hasMed = r.med_id && r.med_qty

      if (!hasEggs && !hasDeaths && !hasFeed && !hasMed) continue

      try {
        // 1. daily_records upsert (eggs + deaths)
        if (hasEggs || hasDeaths) {
          const je = parseInt(r.je_eggs) || 0
          const te = parseInt(r.te_eggs) || 0
          const be = parseInt(r.be_eggs) || 0
          const totalEggs = je + te + be
          const payload: any = {
            flock_id: flock.id,
            record_date: date,
            farm_id: (flock as any).laying_farm_id ?? (flock as any).rearing_farm_id ?? null,
            je_eggs: je,
            te_eggs: te,
            be_eggs: be,
            total_eggs: totalEggs,
            mortality_female: parseInt(r.mortality_female) || 0,
            mortality_male: parseInt(r.mortality_male) || 0,
          }
          const { error } = r.existingDailyId
            ? await supabase.from('daily_records').update(payload).eq('id', r.existingDailyId)
            : await supabase.from('daily_records').upsert(payload, { onConflict: 'flock_id,record_date,farm_id' })
          if (error) { console.error(error); errors++ }
        }

        // 2. daily_feed upsert
        if (hasFeed) {
          const feedPayload = {
            flock_id: flock.id,
            feed_date: date,
            feed_type: 'L1',
            female_kg: parseFloat(r.feed_female_kg) || 0,
            female_cost: 0,
            male_kg: 0,
            male_cost: 0,
          }
          const { error } = await supabase.from('daily_feed')
            .upsert(feedPayload, { onConflict: 'flock_id,feed_date,feed_type' })
          if (error) { console.error(error); errors++ }
        }

        // 3. medicine_usage upsert
        if (hasMed) {
          const medPayload = {
            flock_id: flock.id,
            usage_date: date,
            medicine_id: r.med_id,
            quantity: parseFloat(r.med_qty) || 0,
            unit: 'ml',
          }
          if (r.existingMedId) {
            const { error } = await supabase.from('medicine_usage').update(medPayload).eq('id', r.existingMedId)
            if (error) { console.error(error); errors++ }
          } else {
            const { error } = await supabase.from('medicine_usage').insert(medPayload)
            if (error) { console.error(error); errors++ }
          }
        }

        saved++
      } catch (e: any) {
        console.error(e)
        errors++
      }
    }

    setSaving(false)
    qc.invalidateQueries({ queryKey: ['bulk_existing', date] })
    qc.invalidateQueries({ queryKey: ['bulk_feed_existing', date] })

    if (errors === 0) toast.success(`Saved ${saved} shed(s) for ${date}`)
    else toast.error(`Saved ${saved} shed(s) with ${errors} error(s) — check console`)
  }

  // Group flocks by farm
  const grouped: Record<string, any[]> = {}
  for (const f of (flocks ?? [])) {
    const farm = (f as any).laying_farm?.name ?? 'Unknown'
    if (!grouped[farm]) grouped[farm] = []
    grouped[farm].push(f)
  }

  const medOptions = [
    { value: '', label: '— None —' },
    ...(medicines ?? []).map((m: any) => ({ value: m.id, label: m.name }))
  ]

  if (flocksLoading) return <div className="p-8 text-center"><Spinner /></div>

  return (
    <div className="space-y-4">
      <CardHeader
        title="Bulk Daily Entry"
        subtitle="Enter production data for all active sheds in one go"
        action={
          <div className="flex items-center gap-3">
            <DateInput value={date} onChange={setDate} />
            <Button icon={<Save size={16} />} loading={saving} onClick={handleSaveAll}>
              Save All
            </Button>
          </div>
        }
      />

      {existingLoading && <div className="text-center py-4"><Spinner /></div>}

      {!flocks?.length && (
        <EmptyState icon={<Save size={32} />} title="No active flocks found" />
      )}

      {Object.entries(grouped).map(([farm, farmFlocks]) => (
        <Card key={farm} padding={false}>
          <div className="px-4 py-2 bg-brand-50 border-b border-brand-100">
            <h3 className="font-semibold text-brand-800 text-sm">{farm}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-3 py-2 text-left">Flock</th>
                  <th className="px-3 py-2 text-center">JE Eggs</th>
                  <th className="px-3 py-2 text-center">TE Eggs</th>
                  <th className="px-3 py-2 text-center">BE Eggs</th>
                  <th className="px-3 py-2 text-center">Deaths ♀</th>
                  <th className="px-3 py-2 text-center">Deaths ♂</th>
                  <th className="px-3 py-2 text-center">Feed (kg)</th>
                  <th className="px-3 py-2 text-left" style={{ minWidth: 180 }}>Medicine</th>
                  <th className="px-3 py-2 text-center">Med Qty</th>
                </tr>
              </thead>
              <tbody>
                {farmFlocks.map((flock, idx) => {
                  const r = rows[flock.id] ?? emptyRow()
                  const isOdd = idx % 2 === 0
                  return (
                    <tr key={flock.id} className={isOdd ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 py-1.5">
                        <span className="font-semibold text-brand-700">F-{flock.flock_no}</span>
                        {flock.breed && <span className="text-xs text-gray-400 ml-1">{flock.breed}</span>}
                      </td>
                      {(['je_eggs','te_eggs','be_eggs','mortality_female','mortality_male','feed_female_kg'] as const).map(field => (
                        <td key={field} className="px-1 py-1">
                          <input
                            type="number"
                            min="0"
                            value={r[field] as string}
                            onChange={e => updateRow(flock.id, field, e.target.value)}
                            placeholder="0"
                            className="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400 bg-white"
                          />
                        </td>
                      ))}
                      <td className="px-1 py-1">
                        <select
                          value={r.med_id}
                          onChange={e => updateRow(flock.id, 'med_id', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
                        >
                          {medOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          min="0"
                          value={r.med_qty}
                          onChange={e => updateRow(flock.id, 'med_qty', e.target.value)}
                          placeholder="qty"
                          disabled={!r.med_id}
                          className="w-20 text-center border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-300"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {flocks && flocks.length > 0 && (
        <div className="flex justify-end pb-6">
          <Button icon={<Save size={16} />} loading={saving} onClick={handleSaveAll} size="lg">
            Save All Sheds
          </Button>
        </div>
      )}
    </div>
  )
}
