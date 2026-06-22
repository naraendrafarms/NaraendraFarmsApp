import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import { Card, CardHeader, Button, Select, Spinner, EmptyState, DateInput } from '@/components/ui'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Row state for per-flock mode (one row = one flock) ────────────────────────
type FlockRow = {
  je_eggs: string; te_eggs: string; be_eggs: string
  mortality_female: string; mortality_male: string
  feed_female_kg: string
  med_id: string; med_qty: string
  existingDailyId: string | null
  existingMedId: string | null
}
const emptyFlockRow = (): FlockRow => ({
  je_eggs: '', te_eggs: '', be_eggs: '',
  mortality_female: '', mortality_male: '',
  feed_female_kg: '', med_id: '', med_qty: '',
  existingDailyId: null, existingMedId: null,
})

// ── Row state for per-shed mode (one row = one shed of one flock) ─────────────
type ShedRow = {
  he_eggs: string; je_eggs: string; te_eggs: string; be_eggs: string
  mortality_female: string; mortality_male: string
  feed_female_kg: string; feed_male_kg: string
  transfer_female: string; transfer_male: string
  cull_female: string; cull_male: string
  lighting_hrs: string; remarks: string
  existingId: string | null
}
const emptyShedRow = (): ShedRow => ({
  he_eggs: '', je_eggs: '', te_eggs: '', be_eggs: '',
  mortality_female: '', mortality_male: '',
  feed_female_kg: '', feed_male_kg: '',
  transfer_female: '', transfer_male: '',
  cull_female: '', cull_male: '',
  lighting_hrs: '', remarks: '',
  existingId: null,
})

export const BulkDailyEntry: React.FC = () => {
  const qc = useQueryClient()
  const [date, setDate] = useState(today())
  const [saving, setSaving] = useState(false)

  // Filters
  const [selectedFarm, setSelectedFarm] = useState('')
  const [selectedFlock, setSelectedFlock] = useState('')

  // Row states
  const [flockRows, setFlockRows] = useState<Record<string, FlockRow>>({})
  const [shedRows, setShedRows] = useState<Record<string, ShedRow>>({})   // keyed by shed_id

  // ── Master data ──────────────────────────────────────────────────────────────
  const { data: farms } = useQuery({
    queryKey: ['farms_list'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').order('name')
      return data ?? []
    }
  })

  const { data: allFlocks, isLoading: flocksLoading } = useQuery({
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

  // ── Sheds for selected flock ─────────────────────────────────────────────────
  const { data: flockSheds, isLoading: shedsLoading } = useQuery({
    queryKey: ['flock_sheds', selectedFlock],
    enabled: !!selectedFlock,
    queryFn: async () => {
      const { data } = await supabase
        .from('flock_sheds')
        .select('shed_id,sheds(id,shed_no,farm_id,farms(name,code))')
        .eq('flock_id', selectedFlock)
      return (data ?? []).map((r: any) => r.sheds).filter(Boolean)
    }
  })

  // ── Existing records for selected date ───────────────────────────────────────
  const { data: existingDR, isLoading: existingLoading } = useQuery({
    queryKey: ['bulk_existing_dr', date, selectedFlock],
    enabled: !!date,
    queryFn: async () => {
      let q = supabase.from('daily_records')
        .select('id,flock_id,shed_id,he_eggs,je_eggs,te_eggs,be_eggs,mortality_female,mortality_male,feed_female_kg,feed_male_kg,transfer_female,transfer_male,cull_female,cull_male,lighting_hrs,remarks')
        .eq('record_date', date)
      if (selectedFlock) q = q.eq('flock_id', selectedFlock)
      const { data } = await q
      return data ?? []
    }
  })

  const { data: existingFeed } = useQuery({
    queryKey: ['bulk_existing_feed', date, selectedFlock],
    enabled: !!date && !selectedFlock,
    queryFn: async () => {
      const { data } = await supabase.from('daily_feed')
        .select('id,flock_id,female_kg').eq('feed_date', date)
      return data ?? []
    }
  })

  const { data: existingMed } = useQuery({
    queryKey: ['bulk_existing_med', date],
    enabled: !!date && !selectedFlock,
    queryFn: async () => {
      const { data } = await supabase.from('medicine_usage')
        .select('id,flock_id,medicine_id,quantity').eq('usage_date', date)
      return data ?? []
    }
  })

  // ── Init flock rows ──────────────────────────────────────────────────────────
  const visibleFlocks = selectedFarm
    ? (allFlocks ?? []).filter((f: any) => f.laying_farm_id === selectedFarm || f.rearing_farm_id === selectedFarm)
    : (allFlocks ?? [])

  useEffect(() => {
    if (selectedFlock) return
    const newRows: Record<string, FlockRow> = {}
    for (const f of visibleFlocks) {
      const dr = (existingDR ?? []).find((r: any) => r.flock_id === f.id && !r.shed_id)
      const fd = (existingFeed ?? []).find((r: any) => r.flock_id === f.id)
      const mu = (existingMed ?? []).find((r: any) => r.flock_id === f.id)
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
    setFlockRows(newRows)
  }, [visibleFlocks.length, existingDR, existingFeed, existingMed, selectedFlock])

  // ── Init shed rows ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedFlock || !flockSheds) return
    const newRows: Record<string, ShedRow> = {}
    for (const shed of flockSheds) {
      const dr = (existingDR ?? []).find((r: any) => r.shed_id === shed.id)
      newRows[shed.id] = {
        he_eggs: dr?.he_eggs?.toString() ?? '',
        je_eggs: dr?.je_eggs?.toString() ?? '',
        te_eggs: dr?.te_eggs?.toString() ?? '',
        be_eggs: dr?.be_eggs?.toString() ?? '',
        mortality_female: dr?.mortality_female?.toString() ?? '',
        mortality_male: dr?.mortality_male?.toString() ?? '',
        feed_female_kg: dr?.feed_female_kg?.toString() ?? '',
        feed_male_kg: dr?.feed_male_kg?.toString() ?? '',
        transfer_female: dr?.transfer_female?.toString() ?? '',
        transfer_male: dr?.transfer_male?.toString() ?? '',
        cull_female: dr?.cull_female?.toString() ?? '',
        cull_male: dr?.cull_male?.toString() ?? '',
        lighting_hrs: dr?.lighting_hrs?.toString() ?? '',
        remarks: dr?.remarks ?? '',
        existingId: dr?.id ?? null,
      }
    }
    setShedRows(newRows)
  }, [flockSheds, existingDR, selectedFlock])

  const updateFlockRow = (id: string, field: keyof FlockRow, val: string) =>
    setFlockRows(p => ({ ...p, [id]: { ...p[id], [field]: val } }))

  const updateShedRow = (id: string, field: keyof ShedRow, val: string) =>
    setShedRows(p => ({ ...p, [id]: { ...p[id], [field]: val } }))

  // ── Save all (shed mode) ─────────────────────────────────────────────────────
  const handleSaveShedMode = async () => {
    if (!flockSheds || !date || !selectedFlock) return
    const flock = (allFlocks ?? []).find((f: any) => f.id === selectedFlock)
    setSaving(true)
    let errors = 0; let saved = 0

    for (const shed of flockSheds) {
      const r = shedRows[shed.id]
      if (!r) continue
      const he = parseInt(r.he_eggs) || 0
      const je = parseInt(r.je_eggs) || 0
      const te = parseInt(r.te_eggs) || 0
      const be = parseInt(r.be_eggs) || 0
      const mf = parseInt(r.mortality_female) || 0
      const mm = parseInt(r.mortality_male) || 0
      const hasData = he || je || te || be || mf || mm ||
        r.feed_female_kg || r.feed_male_kg || r.transfer_female || r.cull_female || r.lighting_hrs || r.remarks
      if (!hasData) continue

      const payload: any = {
        flock_id: selectedFlock,
        shed_id: shed.id,
        farm_id: shed.farm_id ?? flock?.laying_farm_id ?? flock?.rearing_farm_id ?? null,
        record_date: date,
        he_eggs: he, je_eggs: je, te_eggs: te, be_eggs: be,
        total_eggs: he + je + te + be,
        mortality_female: mf, mortality_male: mm,
        feed_female_kg: parseFloat(r.feed_female_kg) || 0,
        feed_male_kg: parseFloat(r.feed_male_kg) || 0,
        transfer_female: parseInt(r.transfer_female) || 0,
        transfer_male: parseInt(r.transfer_male) || 0,
        cull_female: parseInt(r.cull_female) || 0,
        cull_male: parseInt(r.cull_male) || 0,
        trcull_female: (parseInt(r.transfer_female) || 0) + (parseInt(r.cull_female) || 0),
        trcull_male: (parseInt(r.transfer_male) || 0) + (parseInt(r.cull_male) || 0),
        lighting_hrs: parseFloat(r.lighting_hrs) || null,
        remarks: r.remarks || null,
      }
      const { error } = r.existingId
        ? await supabase.from('daily_records').update(payload).eq('id', r.existingId)
        : await supabase.from('daily_records').insert(payload)
      if (error) { console.error(error); errors++ } else saved++
    }

    setSaving(false)
    qc.invalidateQueries({ queryKey: ['bulk_existing_dr', date, selectedFlock] })
    if (errors === 0) toast.success(`Saved ${saved} shed(s) for ${date}`)
    else toast.error(`Saved ${saved} with ${errors} error(s)`)
  }

  // ── Save all (flock mode) ────────────────────────────────────────────────────
  const handleSaveFlockMode = async () => {
    if (!visibleFlocks.length || !date) return
    setSaving(true)
    let errors = 0; let saved = 0

    for (const flock of visibleFlocks) {
      const r = flockRows[flock.id]
      if (!r) continue
      const hasEggs = r.je_eggs || r.te_eggs || r.be_eggs
      const hasDeaths = r.mortality_female || r.mortality_male
      const hasFeed = r.feed_female_kg
      const hasMed = r.med_id && r.med_qty
      if (!hasEggs && !hasDeaths && !hasFeed && !hasMed) continue

      try {
        if (hasEggs || hasDeaths) {
          const je = parseInt(r.je_eggs) || 0
          const te = parseInt(r.te_eggs) || 0
          const be = parseInt(r.be_eggs) || 0
          const payload: any = {
            flock_id: flock.id,
            record_date: date,
            farm_id: (flock as any).laying_farm_id ?? (flock as any).rearing_farm_id ?? null,
            je_eggs: je, te_eggs: te, be_eggs: be, total_eggs: je + te + be,
            mortality_female: parseInt(r.mortality_female) || 0,
            mortality_male: parseInt(r.mortality_male) || 0,
          }
          const { error } = r.existingDailyId
            ? await supabase.from('daily_records').update(payload).eq('id', r.existingDailyId)
            : await supabase.from('daily_records').upsert(payload, { onConflict: 'flock_id,record_date,farm_id' })
          if (error) { console.error(error); errors++ }
        }
        if (hasFeed) {
          const { error } = await supabase.from('daily_feed')
            .upsert({ flock_id: flock.id, feed_date: date, feed_type: 'L1', female_kg: parseFloat(r.feed_female_kg) || 0, female_cost: 0, male_kg: 0, male_cost: 0 },
              { onConflict: 'flock_id,feed_date,feed_type' })
          if (error) { console.error(error); errors++ }
        }
        if (hasMed) {
          const medPayload = { flock_id: flock.id, usage_date: date, medicine_id: r.med_id, quantity: parseFloat(r.med_qty) || 0, unit: 'ml' }
          const { error } = r.existingMedId
            ? await supabase.from('medicine_usage').update(medPayload).eq('id', r.existingMedId)
            : await supabase.from('medicine_usage').insert(medPayload)
          if (error) { console.error(error); errors++ }
        }
        saved++
      } catch (e) { console.error(e); errors++ }
    }

    setSaving(false)
    qc.invalidateQueries({ queryKey: ['bulk_existing_dr', date, ''] })
    qc.invalidateQueries({ queryKey: ['bulk_existing_feed', date, ''] })
    qc.invalidateQueries({ queryKey: ['bulk_existing_med', date] })
    if (errors === 0) toast.success(`Saved ${saved} flock(s) for ${date}`)
    else toast.error(`Saved ${saved} with ${errors} error(s)`)
  }

  const medOptions = [
    { value: '', label: '— None —' },
    ...(medicines ?? []).map((m: any) => ({ value: m.id, label: m.name }))
  ]

  const flockOptions = [
    { value: '', label: '— All Flocks (by farm) —' },
    ...(allFlocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}${f.breed ? ` · ${f.breed}` : ''}` }))
  ]

  const isSheedMode = !!selectedFlock
  const isLoading = flocksLoading || (isSheedMode && shedsLoading)

  // Group flocks by farm for flock mode
  const grouped: Record<string, any[]> = {}
  for (const f of visibleFlocks) {
    const farm = (f as any).laying_farm?.name ?? 'Unknown'
    if (!grouped[farm]) grouped[farm] = []
    grouped[farm].push(f)
  }

  const selectedFlockObj = (allFlocks ?? []).find((f: any) => f.id === selectedFlock)

  if (isLoading) return <div className="p-8 text-center"><Spinner /></div>

  return (
    <div className="space-y-4">
      <CardHeader
        title="Bulk Daily Entry"
        subtitle={isSheedMode
          ? `Flock ${selectedFlockObj?.flock_no} — enter data for all sheds at once`
          : 'Enter production data for all active flocks in one go'}
        action={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Select
              label=""
              value={selectedFlock}
              onChange={e => { setSelectedFlock(e.target.value); setSelectedFarm('') }}
              options={flockOptions}
              className="w-52"
            />
            {!isSheedMode && (
              <Select
                label=""
                value={selectedFarm}
                onChange={e => setSelectedFarm(e.target.value)}
                options={[
                  { value: '', label: '— All Farms —' },
                  ...(farms ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` }))
                ]}
                className="w-44"
              />
            )}
            <DateInput value={date} onChange={setDate} />
            <Button
              icon={<Save size={16} />}
              loading={saving}
              onClick={isSheedMode ? handleSaveShedMode : handleSaveFlockMode}
            >
              Save All
            </Button>
          </div>
        }
      />

      {existingLoading && <div className="text-center py-4"><Spinner /></div>}

      {/* ── SHED MODE: one row per shed of selected flock ── */}
      {isSheedMode && (
        <>
          {(!flockSheds || flockSheds.length === 0) && (
            <EmptyState icon={<Save size={32} />} title="No sheds linked to this flock" />
          )}
          {flockSheds && flockSheds.length > 0 && (
            <Card padding={false}>
              <div className="px-4 py-2 bg-brand-50 border-b border-brand-100">
                <h3 className="font-semibold text-brand-800 text-sm">
                  Flock {selectedFlockObj?.flock_no} — {flockSheds.length} shed(s)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-3 py-2 text-left sticky left-0 bg-gray-50">Shed</th>
                      <th className="px-2 py-2 text-center">HE</th>
                      <th className="px-2 py-2 text-center">JE</th>
                      <th className="px-2 py-2 text-center">TE</th>
                      <th className="px-2 py-2 text-center">BE</th>
                      <th className="px-2 py-2 text-center">Death ♀</th>
                      <th className="px-2 py-2 text-center">Death ♂</th>
                      <th className="px-2 py-2 text-center">Feed ♀ kg</th>
                      <th className="px-2 py-2 text-center">Feed ♂ kg</th>
                      <th className="px-2 py-2 text-center">Trf ♀</th>
                      <th className="px-2 py-2 text-center">Trf ♂</th>
                      <th className="px-2 py-2 text-center">Cull ♀</th>
                      <th className="px-2 py-2 text-center">Cull ♂</th>
                      <th className="px-2 py-2 text-center">Light hrs</th>
                      <th className="px-2 py-2 text-left" style={{ minWidth: 120 }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flockSheds.map((shed: any, idx: number) => {
                      const r = shedRows[shed.id] ?? emptyShedRow()
                      const isOdd = idx % 2 === 0
                      const numFields: (keyof ShedRow)[] = [
                        'he_eggs','je_eggs','te_eggs','be_eggs',
                        'mortality_female','mortality_male',
                        'feed_female_kg','feed_male_kg',
                        'transfer_female','transfer_male',
                        'cull_female','cull_male','lighting_hrs'
                      ]
                      return (
                        <tr key={shed.id} className={isOdd ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-3 py-1.5 sticky left-0 bg-inherit font-semibold text-brand-700">
                            Shed {shed.shed_no}
                            {(shed.farms as any)?.code && <span className="text-xs text-gray-400 ml-1">({(shed.farms as any).code})</span>}
                          </td>
                          {numFields.map(field => (
                            <td key={field} className="px-1 py-1">
                              <input
                                type="number" min="0"
                                value={r[field] as string}
                                onChange={e => updateShedRow(shed.id, field, e.target.value)}
                                placeholder="0"
                                className="w-16 text-center border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
                              />
                            </td>
                          ))}
                          <td className="px-1 py-1">
                            <input
                              type="text"
                              value={r.remarks}
                              onChange={e => updateShedRow(shed.id, 'remarks', e.target.value)}
                              placeholder="remarks"
                              className="w-28 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── FLOCK MODE: one row per flock grouped by farm ── */}
      {!isSheedMode && (
        <>
          {visibleFlocks.length === 0 && (
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
                      <th className="px-3 py-2 text-left" style={{ minWidth: 160 }}>Medicine</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmFlocks.map((flock: any, idx: number) => {
                      const r = flockRows[flock.id] ?? emptyFlockRow()
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
                                type="number" min="0"
                                value={r[field] as string}
                                onChange={e => updateFlockRow(flock.id, field, e.target.value)}
                                placeholder="0"
                                className="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
                              />
                            </td>
                          ))}
                          <td className="px-1 py-1">
                            <select
                              value={r.med_id}
                              onChange={e => updateFlockRow(flock.id, 'med_id', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
                            >
                              {medOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="number" min="0"
                              value={r.med_qty}
                              onChange={e => updateFlockRow(flock.id, 'med_qty', e.target.value)}
                              placeholder="qty"
                              disabled={!r.med_id}
                              className="w-16 text-center border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-300"
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
        </>
      )}

      {((isSheedMode && flockSheds && flockSheds.length > 0) || (!isSheedMode && visibleFlocks.length > 0)) && (
        <div className="flex justify-end pb-6">
          <Button icon={<Save size={16} />} loading={saving} size="lg"
            onClick={isSheedMode ? handleSaveShedMode : handleSaveFlockMode}>
            Save All
          </Button>
        </div>
      )}
    </div>
  )
}
