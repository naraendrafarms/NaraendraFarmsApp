import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import { Card, CardHeader, Button, Select, Spinner, EmptyState, DateInput, SearchableSelect } from '@/components/ui'
import { Save, Download, Upload, FileSpreadsheet } from 'lucide-react'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import { useFeedRates } from '@/hooks/useFeedRates'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────
type FlockRow = {
  he_eggs: string; je_eggs: string; te_eggs: string; be_eggs: string; le_eggs: string
  he_grade_a: string; he_grade_b: string; he_grade_c: string
  wastage_he: string; wastage_je: string; wastage_te: string; wastage_be: string
  mortality_female: string; mortality_male: string
  feed_female_kg: string; feed_type_f: string
  feed_male_kg: string; feed_type_m: string
  med_id: string; med_qty: string
  existingDailyId: string | null; existingMedId: string | null
}
const emptyFlockRow = (): FlockRow => ({
  he_eggs: '', je_eggs: '', te_eggs: '', be_eggs: '', le_eggs: '',
  he_grade_a: '', he_grade_b: '', he_grade_c: '',
  wastage_he: '', wastage_je: '', wastage_te: '', wastage_be: '',
  mortality_female: '', mortality_male: '',
  feed_female_kg: '', feed_type_f: 'BCM',
  feed_male_kg: '', feed_type_m: 'BCM',
  med_id: '', med_qty: '',
  existingDailyId: null, existingMedId: null,
})

type ShedRow = {
  opening_female: string; opening_male: string
  he_eggs: string; je_eggs: string; te_eggs: string; be_eggs: string; le_eggs: string
  he_grade_a: string; he_grade_b: string; he_grade_c: string
  wastage_he: string; wastage_je: string; wastage_te: string; wastage_be: string
  mortality_female: string; mortality_male: string
  feed_female_kg: string; feed_type_f: string
  feed_male_kg: string; feed_type_m: string
  transfer_female: string; transfer_male: string
  cull_female: string; cull_male: string
  closing_female: string; closing_male: string
  lighting_hrs: string; remarks: string
  med_id: string; med_qty: string
  existingId: string | null; existingMedId: string | null
}
const emptyShedRow = (): ShedRow => ({
  opening_female: '', opening_male: '',
  he_eggs: '', je_eggs: '', te_eggs: '', be_eggs: '', le_eggs: '',
  he_grade_a: '', he_grade_b: '', he_grade_c: '',
  wastage_he: '', wastage_je: '', wastage_te: '', wastage_be: '',
  mortality_female: '', mortality_male: '',
  feed_female_kg: '', feed_type_f: 'BCM',
  feed_male_kg: '', feed_type_m: 'BCM',
  transfer_female: '', transfer_male: '',
  cull_female: '', cull_male: '',
  closing_female: '', closing_male: '',
  lighting_hrs: '', remarks: '',
  med_id: '', med_qty: '',
  existingId: null, existingMedId: null,
})

// numeric sort for shed_no (handles "1","2"..."10" correctly)
const shedSort = (a: any, b: any) => {
  const na = parseInt(a.shed_no ?? '0') || 0
  const nb = parseInt(b.shed_no ?? '0') || 0
  return na !== nb ? na - nb : (a.shed_no ?? '').localeCompare(b.shed_no ?? '')
}

// ── Component ─────────────────────────────────────────────────────────────────
export const BulkDailyEntry: React.FC = () => {
  const qc = useQueryClient()
  const feedRates = useFeedRates()
  const [date, setDate] = useState(today())
  const [saving, setSaving] = useState(false)
  const [selectedFarm, setSelectedFarm] = useState('')
  const [selectedFlock, setSelectedFlock] = useState('')
  const [flockRows, setFlockRows] = useState<Record<string, FlockRow>>({})
  const [shedRows, setShedRows] = useState<Record<string, ShedRow>>({})
  // Flock-level grade breakdown (shed mode only) — he_grade_a/b/c + existing row id
  const [gradeRow, setGradeRow] = useState({ he_grade_a: '', he_grade_b: '', he_grade_c: '', existingId: null as string | null })
  const [showWastage, setShowWastage] = useState(false)

  // ── Master data ──────────────────────────────────────────────────────────────
  const { data: feedTypesRaw = [] } = useQuery({
    queryKey: ['feed_types'],
    queryFn: async () => { const { data } = await supabase.from('feed_types').select('code').eq('is_active', true).order('sort_order'); return (data ?? []).map((r: any) => r.code as string) },
    staleTime: 10 * 60 * 1000,
  })
  const FEED_TYPES = feedTypesRaw.length ? feedTypesRaw : ['BCM','BGM','BDM','PBM','L1','L2','L3','CHICK','MALE']

  const { data: farms } = useQuery({
    queryKey: ['farms_list'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').order('name'); return data ?? [] }
  })

  const { data: allFlocks, isLoading: flocksLoading } = useQuery({
    queryKey: ['bulk_daily_flocks'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('id,flock_no,breed,status,laying_farm_id,rearing_farm_id,laying_farm:farms!laying_farm_id(name,code)')
        .neq('status', 'closed').order('flock_no', { ascending: true })
      return data ?? []
    }
  })

  const { data: medicines } = useQuery({
    queryKey: ['medicines_master_list'],
    queryFn: async () => { const { data } = await supabase.from('medicines_master').select('id,name').order('name'); return data ?? [] }
  })

  // ── Sheds for selected flock: flock_sheds → shed_allocations → farm sheds ──
  const flockObj = useMemo(() => (allFlocks ?? []).find((f: any) => f.id === selectedFlock), [allFlocks, selectedFlock])
  const farmIdForFlock = (flockObj as any)?.laying_farm_id ?? (flockObj as any)?.rearing_farm_id

  const { data: rawSheds, isLoading: shedsLoading } = useQuery({
    queryKey: ['flock_sheds_full', selectedFlock, farmIdForFlock],
    enabled: !!selectedFlock,
    queryFn: async () => {
      // 1. Try flock_sheds link table
      const { data: fsData } = await supabase
        .from('flock_sheds')
        .select('shed_id,sheds(id,shed_no,shed_name,farm_id,capacity_female,capacity_male)')
        .eq('flock_id', selectedFlock)
      const fromFS = (fsData ?? []).map((r: any) => r.sheds).filter(Boolean)

      if (fromFS.length > 0) return fromFS

      // 2. Fallback: shed_allocations (distinct sheds ever used by this flock)
      const { data: saData } = await supabase
        .from('shed_allocations')
        .select('shed_id,sheds(id,shed_no,shed_name,farm_id,capacity_female,capacity_male)')
        .eq('flock_id', selectedFlock)
      const seen = new Set<string>()
      const fromSA: any[] = []
      for (const r of (saData ?? [])) {
        const s = r.sheds as any
        if (s && !seen.has(s.id)) { seen.add(s.id); fromSA.push(s) }
      }
      if (fromSA.length > 0) return fromSA

      // 3. Last fallback: all active sheds on the flock's farm
      if (farmIdForFlock) {
        const { data: farmSheds } = await supabase
          .from('sheds').select('id,shed_no,shed_name,farm_id,capacity_female,capacity_male')
          .eq('farm_id', farmIdForFlock).eq('is_active', true)
        return farmSheds ?? []
      }
      return []
    }
  })

  const flockSheds = useMemo(() => [...(rawSheds ?? [])].sort(shedSort), [rawSheds])

  // ── Existing daily records for date ─────────────────────────────────────────
  const { data: existingDR, isLoading: existingLoading, isFetching: existingFetching } = useQuery({
    queryKey: ['bulk_existing_dr', date, selectedFlock],
    enabled: !!date && date.length === 10,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase.from('daily_records')
        .select('id,flock_id,shed_id,opening_female,opening_male,he_eggs,je_eggs,te_eggs,be_eggs,le_eggs,he_grade_a,he_grade_b,he_grade_c,wastage_he,wastage_je,wastage_te,wastage_be,mortality_female,mortality_male,feed_female_kg,feed_type_f,feed_male_kg,feed_type_m,transfer_female,transfer_male,cull_female,cull_male,closing_female,closing_male,lighting_hrs,remarks')
        .eq('record_date', date)
      if (selectedFlock) q = q.eq('flock_id', selectedFlock)
      const { data } = await q
      return data ?? []
    }
  })

  // Previous day closing for opening balance
  const prevDate = useMemo(() => {
    if (!date || date.length < 10) return ''
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      d.setDate(d.getDate() - 1)
      return d.toISOString().slice(0, 10)
    } catch { return '' }
  }, [date])

  const { data: prevDR } = useQuery({
    queryKey: ['bulk_prev_dr', prevDate, selectedFlock],
    enabled: !!selectedFlock && !!prevDate,
    queryFn: async () => {
      const { data } = await supabase.from('daily_records')
        .select('shed_id,closing_female,closing_male')
        .eq('flock_id', selectedFlock).eq('record_date', prevDate)
      return data ?? []
    }
  })

  // existingFeed removed — feed is now read from daily_records.feed_female_kg for consistency

  const { data: existingMed } = useQuery({
    queryKey: ['bulk_existing_med', date, selectedFlock],
    enabled: !!date && date.length === 10,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase.from('medicine_usage').select('id,flock_id,shed_id,medicine_id,quantity').eq('usage_date', date)
      if (selectedFlock) q = q.eq('flock_id', selectedFlock)
      const { data } = await q; return data ?? []
    }
  })

  // ── Init flock rows ──────────────────────────────────────────────────────────
  const visibleFlocks = useMemo(() =>
    selectedFarm
      ? (allFlocks ?? []).filter((f: any) => f.laying_farm_id === selectedFarm || f.rearing_farm_id === selectedFarm)
      : (allFlocks ?? []),
    [allFlocks, selectedFarm])

  useEffect(() => {
    if (selectedFlock) return
    if (existingFetching) return   // keep rows intact while date is loading
    const newRows: Record<string, FlockRow> = {}
    for (const f of visibleFlocks) {
      const dr = (existingDR ?? []).find((r: any) => r.flock_id === f.id && !r.shed_id)
      const mu = (existingMed ?? []).find((r: any) => r.flock_id === f.id && !r.shed_id)
      newRows[f.id] = {
        he_eggs: dr?.he_eggs?.toString() ?? '',
        je_eggs: dr?.je_eggs?.toString() ?? '', te_eggs: dr?.te_eggs?.toString() ?? '',
        be_eggs: dr?.be_eggs?.toString() ?? '', le_eggs: dr?.le_eggs?.toString() ?? '',
        he_grade_a: dr?.he_grade_a?.toString() ?? '',
        he_grade_b: dr?.he_grade_b?.toString() ?? '',
        he_grade_c: dr?.he_grade_c?.toString() ?? '',
        wastage_he: dr?.wastage_he?.toString() ?? '',
        wastage_je: dr?.wastage_je?.toString() ?? '',
        wastage_te: dr?.wastage_te?.toString() ?? '',
        wastage_be: dr?.wastage_be?.toString() ?? '',
        mortality_female: dr?.mortality_female?.toString() ?? '',
        mortality_male: dr?.mortality_male?.toString() ?? '',
        feed_female_kg: dr?.feed_female_kg?.toString() ?? '',
        feed_type_f: dr?.feed_type_f ?? 'BCM',
        feed_male_kg: dr?.feed_male_kg?.toString() ?? '',
        feed_type_m: dr?.feed_type_m ?? 'BCM',
        med_id: mu?.medicine_id ?? '', med_qty: mu?.quantity?.toString() ?? '',
        existingDailyId: dr?.id ?? null, existingMedId: mu?.id ?? null,
      }
    }
    setFlockRows(newRows)
  }, [visibleFlocks.length, existingDR, existingMed, selectedFlock])

  // ── Init shed rows ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedFlock || !flockSheds.length) return
    if (existingFetching) return   // keep rows intact while date is loading
    const newRows: Record<string, ShedRow> = {}
    for (const shed of flockSheds) {
      const dr = (existingDR ?? []).find((r: any) => r.shed_id === shed.id)
      const mu = (existingMed ?? []).find((r: any) => r.shed_id === shed.id)
      const prev = (prevDR ?? []).find((r: any) => r.shed_id === shed.id)
      // opening = today's record opening, or prev day closing, or capacity
      const openF = dr?.opening_female?.toString() ?? prev?.closing_female?.toString() ?? ''
      const openM = dr?.opening_male?.toString() ?? prev?.closing_male?.toString() ?? ''
      const trcullF = (parseInt(dr?.transfer_female ?? '0') || 0) + (parseInt(dr?.cull_female ?? '0') || 0)
      const trcullM = (parseInt(dr?.transfer_male ?? '0') || 0) + (parseInt(dr?.cull_male ?? '0') || 0)
      const closeF = dr?.closing_female?.toString() ?? (
        openF ? String(Math.max(0, parseInt(openF) - (parseInt(dr?.mortality_female ?? '0') || 0) - trcullF)) : ''
      )
      const closeM = dr?.closing_male?.toString() ?? (
        openM ? String(Math.max(0, parseInt(openM) - (parseInt(dr?.mortality_male ?? '0') || 0) - trcullM)) : ''
      )
      newRows[shed.id] = {
        opening_female: openF, opening_male: openM,
        he_eggs: dr?.he_eggs?.toString() ?? '', je_eggs: dr?.je_eggs?.toString() ?? '',
        te_eggs: dr?.te_eggs?.toString() ?? '', be_eggs: dr?.be_eggs?.toString() ?? '',
        le_eggs: dr?.le_eggs?.toString() ?? '',
        he_grade_a: dr?.he_grade_a?.toString() ?? '',
        he_grade_b: dr?.he_grade_b?.toString() ?? '',
        he_grade_c: dr?.he_grade_c?.toString() ?? '',
        wastage_he: dr?.wastage_he?.toString() ?? '',
        wastage_je: dr?.wastage_je?.toString() ?? '',
        wastage_te: dr?.wastage_te?.toString() ?? '',
        wastage_be: dr?.wastage_be?.toString() ?? '',
        mortality_female: dr?.mortality_female?.toString() ?? '',
        mortality_male: dr?.mortality_male?.toString() ?? '',
        feed_female_kg: dr?.feed_female_kg?.toString() ?? '',
        feed_type_f: dr?.feed_type_f ?? 'BCM',
        feed_male_kg: dr?.feed_male_kg?.toString() ?? '',
        feed_type_m: dr?.feed_type_m ?? 'BCM',
        transfer_female: dr?.transfer_female?.toString() ?? '',
        transfer_male: dr?.transfer_male?.toString() ?? '',
        cull_female: dr?.cull_female?.toString() ?? '',
        cull_male: dr?.cull_male?.toString() ?? '',
        closing_female: closeF, closing_male: closeM,
        lighting_hrs: dr?.lighting_hrs?.toString() ?? '', remarks: dr?.remarks ?? '',
        med_id: mu?.medicine_id ?? '', med_qty: mu?.quantity?.toString() ?? '',
        existingId: dr?.id ?? null, existingMedId: mu?.id ?? null,
      }
    }
    setShedRows(newRows)
  }, [flockSheds, existingDR, existingMed, prevDR, selectedFlock])

  const updateShedRow = (id: string, field: keyof ShedRow, val: string) => {
    setShedRows(prev => {
      const r = { ...prev[id], [field]: val }
      // auto-recompute closing
      const of_ = parseInt(r.opening_female) || 0
      const om = parseInt(r.opening_male) || 0
      const mf = parseInt(r.mortality_female) || 0
      const mm = parseInt(r.mortality_male) || 0
      const tf = (parseInt(r.transfer_female) || 0) + (parseInt(r.cull_female) || 0)
      const tm = (parseInt(r.transfer_male) || 0) + (parseInt(r.cull_male) || 0)
      if (of_ > 0 && !['closing_female','closing_male'].includes(field)) r.closing_female = String(Math.max(0, of_ - mf - tf))
      if (om > 0 && !['closing_female','closing_male'].includes(field)) r.closing_male = String(Math.max(0, om - mm - tm))
      return { ...prev, [id]: r }
    })
  }

  // Init grade row from flock-level record (shed_id IS NULL) when in shed mode
  useEffect(() => {
    if (!selectedFlock) return
    const flockLevel = (existingDR ?? []).find((r: any) => r.flock_id === selectedFlock && !r.shed_id)
    setGradeRow({
      he_grade_a: flockLevel?.he_grade_a?.toString() ?? '',
      he_grade_b: flockLevel?.he_grade_b?.toString() ?? '',
      he_grade_c: flockLevel?.he_grade_c?.toString() ?? '',
      existingId: flockLevel?.id ?? null,
    })
  }, [existingDR, selectedFlock])

  const updateFlockRow = (id: string, field: keyof FlockRow, val: string) =>
    setFlockRows(p => ({ ...p, [id]: { ...p[id], [field]: val } }))

  // ── Save shed mode ───────────────────────────────────────────────────────────
  const handleSaveShedMode = async () => {
    if (!flockSheds.length || !selectedFlock) return
    setSaving(true); let errors = 0; let saved = 0
    for (const shed of flockSheds) {
      const r = shedRows[shed.id]
      if (!r) continue
      const he = parseInt(r.he_eggs) || 0, je = parseInt(r.je_eggs) || 0
      const te = parseInt(r.te_eggs) || 0, be = parseInt(r.be_eggs) || 0
      const le = parseInt(r.le_eggs) || 0
      const whe = parseInt(r.wastage_he) || null, wje = parseInt(r.wastage_je) || null
      const wte = parseInt(r.wastage_te) || null, wbe = parseInt(r.wastage_be) || null
      const mf = parseInt(r.mortality_female) || 0, mm = parseInt(r.mortality_male) || 0
      const ff = parseFloat(r.feed_female_kg) || 0, fm = parseFloat(r.feed_male_kg) || 0
      const tf = parseInt(r.transfer_female) || 0, tm = parseInt(r.transfer_male) || 0
      const cf = parseInt(r.cull_female) || 0, cm = parseInt(r.cull_male) || 0
      const hasData = he || je || te || be || le || mf || mm || ff || fm || tf || cf || r.lighting_hrs || r.remarks
      if (!hasData) continue
      const of_ = parseInt(r.opening_female) || null
      const om = parseInt(r.opening_male) || null
      const clf = parseInt(r.closing_female) || null
      const clm = parseInt(r.closing_male) || null
      const payload: any = {
        flock_id: selectedFlock, shed_id: shed.id,
        farm_id: shed.farm_id ?? farmIdForFlock ?? null,
        record_date: date,
        opening_female: of_, opening_male: om,
        he_eggs: he, je_eggs: je, te_eggs: te, be_eggs: be, le_eggs: le,
        total_eggs: he + je + te + be + le,
        wastage_he: whe, wastage_je: wje, wastage_te: wte, wastage_be: wbe,
        mortality_female: mf, mortality_male: mm,
        feed_female_kg: ff, feed_type_f: r.feed_type_f || 'BCM',
        feed_male_kg: fm, feed_type_m: r.feed_type_m || 'BCM',
        transfer_female: tf, transfer_male: tm,
        cull_female: cf, cull_male: cm,
        trcull_female: tf + cf, trcull_male: tm + cm,
        closing_female: clf, closing_male: clm,
        lighting_hrs: parseFloat(r.lighting_hrs) || null,
        remarks: r.remarks || null,
      }
      const { error } = r.existingId
        ? await supabase.from('daily_records').update(payload).eq('id', r.existingId)
        : await supabase.from('daily_records').insert(payload)
      if (error) { console.error(error); errors++ } else saved++

      // Mirror feed to daily_feed so Flock → Feed tab shows it
      if (ff > 0 || fm > 0) {
        const ftF = r.feed_type_f || 'BCM'
        const ftM = r.feed_type_m || 'BCM'
        if (ftF === ftM) {
          await supabase.from('daily_feed').upsert(
            { flock_id: selectedFlock, feed_date: date, feed_type: ftF, female_kg: ff, male_kg: fm, female_cost: Math.round(ff * feedRates.rate(ftF) * 100) / 100, male_cost: Math.round(fm * feedRates.rate(ftF) * 100) / 100 },
            { onConflict: 'flock_id,feed_date,feed_type' }
          )
        } else {
          if (ff > 0) await supabase.from('daily_feed').upsert(
            { flock_id: selectedFlock, feed_date: date, feed_type: ftF, female_kg: ff, male_kg: 0, female_cost: Math.round(ff * feedRates.rate(ftF) * 100) / 100, male_cost: 0 },
            { onConflict: 'flock_id,feed_date,feed_type' }
          )
          if (fm > 0) await supabase.from('daily_feed').upsert(
            { flock_id: selectedFlock, feed_date: date, feed_type: ftM, female_kg: 0, male_kg: fm, female_cost: 0, male_cost: Math.round(fm * feedRates.rate(ftM) * 100) / 100 },
            { onConflict: 'flock_id,feed_date,feed_type' }
          )
        }
      }

      // medicine per shed
      if (r.med_id && r.med_qty) {
        const medPayload = { flock_id: selectedFlock, shed_id: shed.id, usage_date: date, medicine_id: r.med_id, quantity: parseFloat(r.med_qty) || 0, unit: 'ml' }
        const { error: me } = r.existingMedId
          ? await supabase.from('medicine_usage').update(medPayload).eq('id', r.existingMedId)
          : await supabase.from('medicine_usage').insert(medPayload)
        if (me) console.error(me)
      }
    }
    // Save flock-level grade breakdown (shed_id IS NULL)
    const ga = parseInt(gradeRow.he_grade_a) || null
    const gb = parseInt(gradeRow.he_grade_b) || null
    const gc = parseInt(gradeRow.he_grade_c) || null
    if (ga !== null || gb !== null || gc !== null) {
      if (gradeRow.existingId) {
        const { error } = await supabase.from('daily_records')
          .update({ he_grade_a: ga, he_grade_b: gb, he_grade_c: gc })
          .eq('id', gradeRow.existingId)
        if (error) console.error('Grade update error:', error)
      } else {
        const { error } = await supabase.from('daily_records').insert({
          flock_id: selectedFlock, record_date: date,
          farm_id: farmIdForFlock ?? null,
          shed_id: null,
          he_grade_a: ga, he_grade_b: gb, he_grade_c: gc,
          he_eggs: 0, je_eggs: 0, te_eggs: 0, be_eggs: 0, le_eggs: 0, total_eggs: 0,
          mortality_female: 0, mortality_male: 0,
        })
        if (error) console.error('Grade insert error:', error)
      }
    }

    setSaving(false)
    qc.invalidateQueries({ queryKey: ['bulk_existing_dr', date, selectedFlock] })
    qc.invalidateQueries({ queryKey: ['bulk_existing_med', date, selectedFlock] })
    qc.invalidateQueries({ queryKey: ['flock_daily_feed', selectedFlock] })
    if (errors === 0) toast.success(`Saved ${saved} shed(s) for ${date}`)
    else toast.error(`Saved ${saved} with ${errors} error(s)`)
  }

  // ── Save flock mode ──────────────────────────────────────────────────────────
  const handleSaveFlockMode = async () => {
    if (!visibleFlocks.length) return
    setSaving(true); let errors = 0; let saved = 0
    for (const flock of visibleFlocks) {
      const r = flockRows[flock.id]
      if (!r) continue
      const hasEggs = r.he_eggs || r.je_eggs || r.te_eggs || r.be_eggs || r.le_eggs
      const hasDeaths = r.mortality_female || r.mortality_male
      if (!hasEggs && !hasDeaths && !r.feed_female_kg && !r.feed_male_kg && !(r.med_id && r.med_qty)) continue
      try {
        const he = parseInt(r.he_eggs) || 0
        const je = parseInt(r.je_eggs) || 0, te = parseInt(r.te_eggs) || 0, be = parseInt(r.be_eggs) || 0
        const le = parseInt(r.le_eggs) || 0
        const ff = parseFloat(r.feed_female_kg) || 0, fm = parseFloat(r.feed_male_kg) || 0
        if (hasEggs || hasDeaths || ff || fm) {
          const payload: any = {
            flock_id: flock.id, record_date: date,
            farm_id: (flock as any).laying_farm_id ?? (flock as any).rearing_farm_id ?? null,
            he_eggs: he, je_eggs: je, te_eggs: te, be_eggs: be, le_eggs: le,
            total_eggs: he + je + te + be + le,
            he_grade_a: parseInt(r.he_grade_a) || null,
            he_grade_b: parseInt(r.he_grade_b) || null,
            he_grade_c: parseInt(r.he_grade_c) || null,
            wastage_he: parseInt(r.wastage_he) || null,
            wastage_je: parseInt(r.wastage_je) || null,
            wastage_te: parseInt(r.wastage_te) || null,
            wastage_be: parseInt(r.wastage_be) || null,
            mortality_female: parseInt(r.mortality_female) || 0,
            mortality_male: parseInt(r.mortality_male) || 0,
            feed_female_kg: ff, feed_type_f: r.feed_type_f || 'BCM',
            feed_male_kg: fm, feed_type_m: r.feed_type_m || 'BCM',
          }
          const { error } = r.existingDailyId
            ? await supabase.from('daily_records').update(payload).eq('id', r.existingDailyId)
            : await supabase.from('daily_records').upsert(payload, { onConflict: 'flock_id,record_date,farm_id' })
          if (error) { console.error(error); errors++ }
        }
        if (ff || fm) {
          const ftF = r.feed_type_f || 'BCM'
          const ftM = r.feed_type_m || 'BCM'
          if (ftF === ftM) {
            await supabase.from('daily_feed').upsert(
              { flock_id: flock.id, feed_date: date, feed_type: ftF, female_kg: ff, male_kg: fm, female_cost: Math.round(ff * feedRates.rate(ftF) * 100) / 100, male_cost: Math.round(fm * feedRates.rate(ftF) * 100) / 100 },
              { onConflict: 'flock_id,feed_date,feed_type' }
            )
          } else {
            if (ff) await supabase.from('daily_feed').upsert(
              { flock_id: flock.id, feed_date: date, feed_type: ftF, female_kg: ff, male_kg: 0, female_cost: Math.round(ff * feedRates.rate(ftF) * 100) / 100, male_cost: 0 },
              { onConflict: 'flock_id,feed_date,feed_type' }
            )
            if (fm) await supabase.from('daily_feed').upsert(
              { flock_id: flock.id, feed_date: date, feed_type: ftM, female_kg: 0, male_kg: fm, female_cost: 0, male_cost: Math.round(fm * feedRates.rate(ftM) * 100) / 100 },
              { onConflict: 'flock_id,feed_date,feed_type' }
            )
          }
        }
        if (r.med_id && r.med_qty) {
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

  // Medicine name <-> id maps (for Excel import/export by name)
  const medNameToId = useMemo(() => {
    const m: Record<string, string> = {}
    for (const x of (medicines ?? [])) m[String(x.name).toLowerCase().trim()] = x.id
    return m
  }, [medicines])
  const medIdToName = useMemo(() => {
    const m: Record<string, string> = {}
    for (const x of (medicines ?? [])) m[x.id] = x.name
    return m
  }, [medicines])

  const importRef = useRef<HTMLInputElement>(null)

  // ── FLOCK MODE: template / export / import ───────────────────────────────────
  const FLOCK_HEADERS = ['Flock No','Feed F kg','Feed Type F','Feed M kg','Feed Type M',
    'Death F','Death M','HE','JE','TE','BE','LE','Grade A','Grade B','Grade C',
    'Wastage HE','Wastage JE','Wastage TE','Wastage BE','Medicine','Med Qty']

  const flockTemplate = () => downloadXlsxTemplate('bulk_all_flocks_template.xlsx', FLOCK_HEADERS,
    ['101','120','BCM','30','MALE','2','1','500','40','20','10','5','300','150','50','','','','','',''])

  const flockExport = () => {
    const data = visibleFlocks.map((f: any) => {
      const r = flockRows[f.id] ?? emptyFlockRow()
      return {
        'Flock No': f.flock_no, 'Feed F kg': r.feed_female_kg, 'Feed Type F': r.feed_type_f,
        'Feed M kg': r.feed_male_kg, 'Feed Type M': r.feed_type_m,
        'Death F': r.mortality_female, 'Death M': r.mortality_male,
        HE: r.he_eggs, JE: r.je_eggs, TE: r.te_eggs, BE: r.be_eggs, LE: r.le_eggs,
        'Grade A': r.he_grade_a, 'Grade B': r.he_grade_b, 'Grade C': r.he_grade_c,
        'Wastage HE': r.wastage_he, 'Wastage JE': r.wastage_je, 'Wastage TE': r.wastage_te, 'Wastage BE': r.wastage_be,
        Medicine: r.med_id ? (medIdToName[r.med_id] ?? '') : '', 'Med Qty': r.med_qty,
      }
    })
    const ws = XLSX.utils.json_to_sheet(data, { header: FLOCK_HEADERS })
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'All Flocks')
    XLSX.writeFile(wb, `BulkDaily_AllFlocks_${date}.xlsx`)
    toast.success('Exported current grid')
  }

  const flockImport = async (file: File) => {
    try {
      const { headers, rows } = await parseFile(file)
      const idx = (n: string) => headers.findIndex(h => h.toLowerCase().trim() === n.toLowerCase())
      const ci = {
        flock: idx('Flock No'), ff: idx('Feed F kg'), ftf: idx('Feed Type F'), fm: idx('Feed M kg'), ftm: idx('Feed Type M'),
        df: idx('Death F'), dm: idx('Death M'), he: idx('HE'), je: idx('JE'), te: idx('TE'), be: idx('BE'), le: idx('LE'),
        ga: idx('Grade A'), gb: idx('Grade B'), gc: idx('Grade C'),
        whe: idx('Wastage HE'), wje: idx('Wastage JE'), wte: idx('Wastage TE'), wbe: idx('Wastage BE'),
        med: idx('Medicine'), mq: idx('Med Qty'),
      }
      if (ci.flock < 0) { toast.error('File needs a "Flock No" column'); return }
      const flockByNo: Record<string, any> = {}
      for (const f of visibleFlocks) flockByNo[String(f.flock_no).trim()] = f
      let matched = 0
      setFlockRows(prev => {
        const next = { ...prev }
        for (const row of (rows as any[])) {
          const fno = String(row[ci.flock] ?? '').trim()
          const f = flockByNo[fno]
          if (!f) continue
          matched++
          const g = (i: number) => i >= 0 ? String(row[i] ?? '').trim() : ''
          const cur = next[f.id] ?? emptyFlockRow()
          const medName = g(ci.med).toLowerCase()
          next[f.id] = {
            ...cur,
            feed_female_kg: g(ci.ff) || cur.feed_female_kg, feed_type_f: g(ci.ftf) || cur.feed_type_f,
            feed_male_kg: g(ci.fm) || cur.feed_male_kg, feed_type_m: g(ci.ftm) || cur.feed_type_m,
            mortality_female: g(ci.df) || cur.mortality_female, mortality_male: g(ci.dm) || cur.mortality_male,
            he_eggs: g(ci.he) || cur.he_eggs, je_eggs: g(ci.je) || cur.je_eggs, te_eggs: g(ci.te) || cur.te_eggs,
            be_eggs: g(ci.be) || cur.be_eggs, le_eggs: g(ci.le) || cur.le_eggs,
            he_grade_a: g(ci.ga) || cur.he_grade_a, he_grade_b: g(ci.gb) || cur.he_grade_b, he_grade_c: g(ci.gc) || cur.he_grade_c,
            wastage_he: g(ci.whe) || cur.wastage_he, wastage_je: g(ci.wje) || cur.wastage_je,
            wastage_te: g(ci.wte) || cur.wastage_te, wastage_be: g(ci.wbe) || cur.wastage_be,
            med_id: medName && medNameToId[medName] ? medNameToId[medName] : cur.med_id,
            med_qty: g(ci.mq) || cur.med_qty,
          }
        }
        return next
      })
      toast.success(`Imported ${matched} flock(s) into grid — review and click Save All`)
    } catch (e: any) { toast.error(e.message) }
    finally { if (importRef.current) importRef.current.value = '' }
  }

  // ── SHED MODE: template / export / import ────────────────────────────────────
  // NOTE: Close F/M are NOT in the template — they are auto-calculated (Open − Death − Transfer − Cull) on import.
  const SHED_HEADERS = ['Shed No','Open F','Open M','Feed F kg','Feed Type F','Feed M kg','Feed Type M',
    'Transfer F','Transfer M','Cull F','Cull M','Death F','Death M','HE','JE','TE','BE','LE',
    'Wastage HE','Wastage JE','Wastage TE','Wastage BE',
    'Grade A','Grade B','Grade C','Lighting Hrs','Medicine','Med Qty','Remarks']

  // NOTE: Grade A/B/C are FLOCK-LEVEL (one set for the whole flock, entered after grading all sheds).
  // In the sheet, put them on the FIRST shed row only — they apply to the flock, not each shed.
  const shedTemplate = () => downloadXlsxTemplate('bulk_flockwise_template.xlsx', SHED_HEADERS,
    ['1','1000','100','120','BCM','30','MALE','0','0','0','0','2','1','500','40','20','10','5','','','','','300','150','50','16','','','OK (Grade A/B/C = flock total, first row only · Closing auto-calculated)'])

  const shedExport = () => {
    const data = flockSheds.map((shed: any, i: number) => {
      const r = shedRows[shed.id] ?? emptyShedRow()
      return {
        'Shed No': shed.shed_no, 'Open F': r.opening_female, 'Open M': r.opening_male,
        'Feed F kg': r.feed_female_kg, 'Feed Type F': r.feed_type_f, 'Feed M kg': r.feed_male_kg, 'Feed Type M': r.feed_type_m,
        'Transfer F': r.transfer_female, 'Transfer M': r.transfer_male, 'Cull F': r.cull_female, 'Cull M': r.cull_male,
        'Death F': r.mortality_female, 'Death M': r.mortality_male,
        HE: r.he_eggs, JE: r.je_eggs, TE: r.te_eggs, BE: r.be_eggs, LE: r.le_eggs,
        'Wastage HE': r.wastage_he, 'Wastage JE': r.wastage_je, 'Wastage TE': r.wastage_te, 'Wastage BE': r.wastage_be,
        // Flock-level grade on first row only
        'Grade A': i === 0 ? gradeRow.he_grade_a : '', 'Grade B': i === 0 ? gradeRow.he_grade_b : '', 'Grade C': i === 0 ? gradeRow.he_grade_c : '',
        'Lighting Hrs': r.lighting_hrs,
        Medicine: r.med_id ? (medIdToName[r.med_id] ?? '') : '', 'Med Qty': r.med_qty, Remarks: r.remarks,
      }
    })
    const ws = XLSX.utils.json_to_sheet(data, { header: SHED_HEADERS })
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Sheds')
    XLSX.writeFile(wb, `BulkDaily_Flock${flockObj?.flock_no}_${date}.xlsx`)
    toast.success('Exported current grid')
  }

  const shedImport = async (file: File) => {
    try {
      const { headers, rows } = await parseFile(file)
      const idx = (n: string) => headers.findIndex(h => h.toLowerCase().trim() === n.toLowerCase())
      const ci = {
        shed: idx('Shed No'), of: idx('Open F'), om: idx('Open M'), ff: idx('Feed F kg'), ftf: idx('Feed Type F'),
        fm: idx('Feed M kg'), ftm: idx('Feed Type M'), trf: idx('Transfer F'), trm: idx('Transfer M'),
        cf: idx('Cull F'), cm: idx('Cull M'), df: idx('Death F'), dm: idx('Death M'),
        he: idx('HE'), je: idx('JE'), te: idx('TE'), be: idx('BE'), le: idx('LE'),
        whe: idx('Wastage HE'), wje: idx('Wastage JE'), wte: idx('Wastage TE'), wbe: idx('Wastage BE'),
        ga: idx('Grade A'), gb: idx('Grade B'), gc: idx('Grade C'),
        lt: idx('Lighting Hrs'), med: idx('Medicine'), mq: idx('Med Qty'), rem: idx('Remarks'),
      }
      if (ci.shed < 0) { toast.error('File needs a "Shed No" column'); return }
      const shedByNo: Record<string, any> = {}
      for (const s of flockSheds) shedByNo[String(s.shed_no).trim()] = s
      let matched = 0
      // Flock-level grade: take from whichever row has any grade value
      const gv = (i: number, row: any) => i >= 0 ? String(row[i] ?? '').trim() : ''
      let gA = '', gB = '', gC = ''
      for (const row of (rows as any[])) {
        const a = gv(ci.ga, row), b = gv(ci.gb, row), c = gv(ci.gc, row)
        if (a || b || c) { gA = a || gA; gB = b || gB; gC = c || gC }
      }
      if (gA || gB || gC) setGradeRow(g => ({ ...g, he_grade_a: gA || g.he_grade_a, he_grade_b: gB || g.he_grade_b, he_grade_c: gC || g.he_grade_c }))
      setShedRows(prev => {
        const next = { ...prev }
        for (const row of (rows as any[])) {
          const sno = String(row[ci.shed] ?? '').trim()
          const s = shedByNo[sno]
          if (!s) continue
          matched++
          const g = (i: number) => i >= 0 ? String(row[i] ?? '').trim() : ''
          const cur = next[s.id] ?? emptyShedRow()
          const medName = g(ci.med).toLowerCase()
          // Auto-calculate closing = opening − death − transfer − cull (never read from Excel)
          const openF = g(ci.of) || cur.opening_female, openM = g(ci.om) || cur.opening_male
          const dF = g(ci.df) || cur.mortality_female, dM = g(ci.dm) || cur.mortality_male
          const trF = g(ci.trf) || cur.transfer_female, trM = g(ci.trm) || cur.transfer_male
          const cF = g(ci.cf) || cur.cull_female, cM = g(ci.cm) || cur.cull_male
          const closeF = (parseInt(openF) || 0) > 0 ? String(Math.max(0, (parseInt(openF)||0) - (parseInt(dF)||0) - (parseInt(trF)||0) - (parseInt(cF)||0))) : cur.closing_female
          const closeM = (parseInt(openM) || 0) > 0 ? String(Math.max(0, (parseInt(openM)||0) - (parseInt(dM)||0) - (parseInt(trM)||0) - (parseInt(cM)||0))) : cur.closing_male
          next[s.id] = {
            ...cur,
            opening_female: openF, opening_male: openM,
            feed_female_kg: g(ci.ff) || cur.feed_female_kg, feed_type_f: g(ci.ftf) || cur.feed_type_f,
            feed_male_kg: g(ci.fm) || cur.feed_male_kg, feed_type_m: g(ci.ftm) || cur.feed_type_m,
            transfer_female: trF, transfer_male: trM,
            cull_female: cF, cull_male: cM,
            mortality_female: dF, mortality_male: dM,
            he_eggs: g(ci.he) || cur.he_eggs, je_eggs: g(ci.je) || cur.je_eggs, te_eggs: g(ci.te) || cur.te_eggs,
            be_eggs: g(ci.be) || cur.be_eggs, le_eggs: g(ci.le) || cur.le_eggs,
            wastage_he: g(ci.whe) || cur.wastage_he, wastage_je: g(ci.wje) || cur.wastage_je,
            wastage_te: g(ci.wte) || cur.wastage_te, wastage_be: g(ci.wbe) || cur.wastage_be,
            closing_female: closeF, closing_male: closeM,
            lighting_hrs: g(ci.lt) || cur.lighting_hrs,
            med_id: medName && medNameToId[medName] ? medNameToId[medName] : cur.med_id,
            med_qty: g(ci.mq) || cur.med_qty, remarks: g(ci.rem) || cur.remarks,
          }
        }
        return next
      })
      toast.success(`Imported ${matched} shed(s) into grid — review and click Save All`)
    } catch (e: any) { toast.error(e.message) }
    finally { if (importRef.current) importRef.current.value = '' }
  }

  const isSheedMode = !!selectedFlock
  const isLoading = flocksLoading || (isSheedMode && shedsLoading)

  const grouped: Record<string, any[]> = {}
  for (const f of visibleFlocks) {
    const farm = (f as any).laying_farm?.name ?? 'Unknown'
    if (!grouped[farm]) grouped[farm] = []
    grouped[farm].push(f)
  }

  if (isLoading) return <div className="p-8 text-center"><Spinner /></div>

  // Shed column totals — live sum of every entered value
  const shedTotals = (() => {
    const vals = Object.values(shedRows)
    const n = (f: keyof ShedRow) => vals.reduce((s, r) => s + (parseFloat(r[f] as string) || 0), 0)
    return {
      open_f: n('opening_female'), open_m: n('opening_male'),
      feed_f: n('feed_female_kg'), feed_m: n('feed_male_kg'),
      trf_f: n('transfer_female'), trf_m: n('transfer_male'),
      cull_f: n('cull_female'), cull_m: n('cull_male'),
      mort_f: n('mortality_female'), mort_m: n('mortality_male'),
      he: n('he_eggs'), je: n('je_eggs'), te: n('te_eggs'), be: n('be_eggs'), le: n('le_eggs'),
      wst_he: n('wastage_he'), wst_je: n('wastage_je'), wst_te: n('wastage_te'), wst_be: n('wastage_be'),
      close_f: n('closing_female'), close_m: n('closing_male'),
    }
  })()

  const numInput = (val: string, onChange: (v: string) => void, w = 'w-14', tabIndex?: number) => (
    <input type="number" min="0" value={val} onChange={e => onChange(e.target.value)} placeholder="0"
      tabIndex={tabIndex}
      className={`${w} text-center border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white`} />
  )

  return (
    <div className="space-y-4">
      <CardHeader
        title="Bulk Daily Entry"
        subtitle={isSheedMode
          ? `Flock ${flockObj?.flock_no} — all ${flockSheds.length} shed(s) at once`
          : 'Enter production data for all active flocks in one go'}
        action={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Select label="" value={selectedFlock}
              onChange={e => { setSelectedFlock(e.target.value); setSelectedFarm('') }}
              options={flockOptions} className="w-52" />
            {!isSheedMode && (
              <Select label="" value={selectedFarm}
                onChange={e => setSelectedFarm(e.target.value)}
                options={[{ value: '', label: '— All Farms —' }, ...(farms ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` }))]}
                className="w-44" />
            )}
            <DateInput value={date} onChange={e => setDate(e.target.value)} />
            <Button icon={<Save size={16} />} loading={saving}
              onClick={isSheedMode ? handleSaveShedMode : handleSaveFlockMode}>
              Save All
            </Button>
          </div>
        }
      />

      {/* Import / Export / Template toolbar (mode-aware) */}
      <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) (isSheedMode ? shedImport(f) : flockImport(f)) }} />
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-400 mr-1">{isSheedMode ? `Flock-wise (sheds)` : 'All Flocks'}:</span>
        <Button size="sm" variant="outline" icon={<Upload size={14}/>} onClick={() => importRef.current?.click()}>Import</Button>
        <Button size="sm" variant="outline" icon={<Download size={14}/>} onClick={isSheedMode ? shedExport : flockExport}>Export</Button>
        <Button size="sm" variant="ghost" icon={<FileSpreadsheet size={14}/>} onClick={isSheedMode ? shedTemplate : flockTemplate}>Template</Button>
        <span className="text-xs text-gray-400">Import fills the grid — review, then click <strong>Save All</strong>.</span>
      </div>

      {existingFetching && <div className="text-center py-2 text-xs text-gray-400">Loading records for {date}…</div>}

      {/* ── SHED MODE ── */}
      {isSheedMode && (
        <>
          {flockSheds.length === 0 && (
            <EmptyState icon={<Save size={32} />} title="No sheds found for this flock" />
          )}
          {flockSheds.length > 0 && (
            <Card padding={false}>
              <div className="px-4 py-2 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
                <h3 className="font-semibold text-brand-800 text-sm">Flock {flockObj?.flock_no} — {flockSheds.length} Sheds</h3>
                <button onClick={() => setShowWastage(w => !w)}
                  className={`text-xs px-2 py-0.5 rounded border ${showWastage ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                  {showWastage ? '× Hide Wastage' : '+ Wastage'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-2 py-2 text-left sticky left-0 bg-gray-50 z-10">Shed</th>
                      <th className="px-1 py-2 text-center">Open ♀</th>
                      <th className="px-1 py-2 text-center">Open ♂</th>
                      <th className="px-1 py-2 text-center">Feed ♀ kg</th>
                      <th className="px-1 py-2 text-center">Type ♀</th>
                      <th className="px-1 py-2 text-center">Feed ♂ kg</th>
                      <th className="px-1 py-2 text-center">Type ♂</th>
                      <th className="px-1 py-2 text-center">Trf ♀</th>
                      <th className="px-1 py-2 text-center">Trf ♂</th>
                      <th className="px-1 py-2 text-center text-amber-700 bg-amber-50" title="Only enter culls NOT recorded in NHE Bird Sales. Birds sold via NHE Bird Sales are auto-deducted — entering here too will double-count.">Cull ♀ ⚠</th>
                      <th className="px-1 py-2 text-center text-amber-700 bg-amber-50" title="Only enter culls NOT recorded in NHE Bird Sales. Birds sold via NHE Bird Sales are auto-deducted — entering here too will double-count.">Cull ♂ ⚠</th>
                      <th className="px-1 py-2 text-center">Death ♀</th>
                      <th className="px-1 py-2 text-center">Death ♂</th>
                      <th className="px-1 py-2 text-center">HE</th>
                      <th className="px-1 py-2 text-center">JE</th>
                      <th className="px-1 py-2 text-center">TE</th>
                      <th className="px-1 py-2 text-center">BE</th>
                      <th className="px-1 py-2 text-center">LE</th>
                      {showWastage && <><th className="px-1 py-2 text-center bg-red-50">Wst HE</th><th className="px-1 py-2 text-center bg-red-50">Wst JE</th><th className="px-1 py-2 text-center bg-red-50">Wst TE</th><th className="px-1 py-2 text-center bg-red-50">Wst BE</th></>}
                      <th className="px-1 py-2 text-center bg-blue-50">Close ♀</th>
                      <th className="px-1 py-2 text-center bg-blue-50">Close ♂</th>
                      <th className="px-1 py-2 text-center">Light</th>
                      <th className="px-1 py-2 text-left" style={{ minWidth: 140 }}>Medicine</th>
                      <th className="px-1 py-2 text-center">Med Qty</th>
                      <th className="px-1 py-2 text-left" style={{ minWidth: 100 }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flockSheds.map((shed: any, idx: number) => {
                      const r = shedRows[shed.id] ?? emptyShedRow()
                      const u = (f: keyof ShedRow) => (v: string) => updateShedRow(shed.id, f, v)
                      // Two-phase tab order:
                      // Phase 1 (bird mgmt, 12 cols): Open♀ Open♂ Feed♀ FeedType♀ Feed♂ FeedType♂ Trf♀ Trf♂ Cull♀ Cull♂ Death♀ Death♂
                      // Phase 2 (eggs, 11 cols):      HE JE TE BE LE Close♀ Close♂ Light Med MedQty Remarks
                      const P1 = 12, P2 = 11, N = flockSheds.length
                      const t1 = (col: number) => idx * P1 + col
                      const t2 = (col: number) => N * P1 + idx * P2 + col
                      return (
                            <tr key={shed.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <td className="px-2 py-1.5 sticky left-0 bg-inherit z-10 font-semibold text-brand-700 whitespace-nowrap">
                                Shed {shed.shed_no}{shed.shed_name ? ` · ${shed.shed_name}` : ''}
                              </td>
                              {/* Phase 1 — bird management */}
                              <td className="px-1 py-1">{numInput(r.opening_female, u('opening_female'), 'w-14', t1(1))}</td>
                              <td className="px-1 py-1">{numInput(r.opening_male, u('opening_male'), 'w-14', t1(2))}</td>
                              <td className="px-1 py-1">{numInput(r.feed_female_kg, u('feed_female_kg'), 'w-14', t1(3))}</td>
                              <td className="px-1 py-1">
                                <select tabIndex={t1(4)} value={r.feed_type_f} onChange={e => updateShedRow(shed.id, 'feed_type_f', e.target.value)}
                                  className="w-full border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white">
                                  {FEED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </td>
                              <td className="px-1 py-1">{numInput(r.feed_male_kg, u('feed_male_kg'), 'w-14', t1(5))}</td>
                              <td className="px-1 py-1">
                                <select tabIndex={t1(6)} value={r.feed_type_m} onChange={e => updateShedRow(shed.id, 'feed_type_m', e.target.value)}
                                  className="w-full border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white">
                                  {FEED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </td>
                              <td className="px-1 py-1">{numInput(r.transfer_female, u('transfer_female'), 'w-14', t1(7))}</td>
                              <td className="px-1 py-1">{numInput(r.transfer_male, u('transfer_male'), 'w-14', t1(8))}</td>
                              <td className="px-1 py-1">{numInput(r.cull_female, u('cull_female'), 'w-14', t1(9))}</td>
                              <td className="px-1 py-1">{numInput(r.cull_male, u('cull_male'), 'w-14', t1(10))}</td>
                              <td className="px-1 py-1">{numInput(r.mortality_female, u('mortality_female'), 'w-14', t1(11))}</td>
                              <td className="px-1 py-1">{numInput(r.mortality_male, u('mortality_male'), 'w-14', t1(12))}</td>
                              {/* Phase 2 — egg production */}
                              <td className="px-1 py-1">{numInput(r.he_eggs, u('he_eggs'), 'w-14', t2(1))}</td>
                              <td className="px-1 py-1">{numInput(r.je_eggs, u('je_eggs'), 'w-14', t2(2))}</td>
                              <td className="px-1 py-1">{numInput(r.te_eggs, u('te_eggs'), 'w-14', t2(3))}</td>
                              <td className="px-1 py-1">{numInput(r.be_eggs, u('be_eggs'), 'w-14', t2(4))}</td>
                              <td className="px-1 py-1">{numInput(r.le_eggs, u('le_eggs'), 'w-14', t2(5))}</td>
                              {showWastage && <><td className="px-1 py-1 bg-red-50/30">{numInput(r.wastage_he, u('wastage_he'))}</td><td className="px-1 py-1 bg-red-50/30">{numInput(r.wastage_je, u('wastage_je'))}</td><td className="px-1 py-1 bg-red-50/30">{numInput(r.wastage_te, u('wastage_te'))}</td><td className="px-1 py-1 bg-red-50/30">{numInput(r.wastage_be, u('wastage_be'))}</td></>}
                              <td className="px-1 py-1 bg-blue-50/40">{numInput(r.closing_female, u('closing_female'), 'w-14', t2(6))}</td>
                              <td className="px-1 py-1 bg-blue-50/40">{numInput(r.closing_male, u('closing_male'), 'w-14', t2(7))}</td>
                              <td className="px-1 py-1">{numInput(r.lighting_hrs, u('lighting_hrs'), 'w-14', t2(8))}</td>
                              <td className="px-1 py-1">
                                <SearchableSelect value={r.med_id} onChange={(v) => updateShedRow(shed.id, 'med_id', v)} options={medOptions} placeholder="Search medicine…" />
                              </td>
                              <td className="px-1 py-1">
                                <input type="number" min="0" value={r.med_qty} placeholder="qty" disabled={!r.med_id}
                                  tabIndex={t2(10)}
                                  onChange={e => updateShedRow(shed.id, 'med_qty', e.target.value)}
                                  className="w-14 text-center border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-300" />
                              </td>
                              <td className="px-1 py-1">
                                <input type="text" value={r.remarks} placeholder="remarks"
                                  tabIndex={t2(11)}
                                  onChange={e => updateShedRow(shed.id, 'remarks', e.target.value)}
                                  className="w-24 border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white" />
                              </td>
                            </tr>
                      )
                    })}
                  </tbody>
                  {/* ── Totals row ── */}
                  {flockSheds.length > 1 && (
                    <tfoot>
                      <tr className="bg-brand-50 border-t-2 border-brand-200 text-xs font-semibold text-brand-800">
                        <td className="px-2 py-1.5 sticky left-0 bg-brand-50 z-10">TOTAL</td>
                        {/* Phase 1 cols */}
                        <td className="px-1 py-1.5 text-center">{shedTotals.open_f || '—'}</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.open_m || '—'}</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.feed_f ? shedTotals.feed_f.toFixed(1) : '—'}</td>
                        <td className="px-1 py-1.5 text-center text-gray-400">—</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.feed_m ? shedTotals.feed_m.toFixed(1) : '—'}</td>
                        <td className="px-1 py-1.5 text-center text-gray-400">—</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.trf_f || '—'}</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.trf_m || '—'}</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.cull_f || '—'}</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.cull_m || '—'}</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.mort_f || '—'}</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.mort_m || '—'}</td>
                        {/* Phase 2 cols */}
                        <td className="px-1 py-1.5 text-center">{shedTotals.he || '—'}</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.je || '—'}</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.te || '—'}</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.be || '—'}</td>
                        <td className="px-1 py-1.5 text-center">{shedTotals.le || '—'}</td>
                        {showWastage && <>
                          <td className="px-1 py-1.5 text-center bg-red-50/60">{shedTotals.wst_he || '—'}</td>
                          <td className="px-1 py-1.5 text-center bg-red-50/60">{shedTotals.wst_je || '—'}</td>
                          <td className="px-1 py-1.5 text-center bg-red-50/60">{shedTotals.wst_te || '—'}</td>
                          <td className="px-1 py-1.5 text-center bg-red-50/60">{shedTotals.wst_be || '—'}</td>
                        </>}
                        <td className="px-1 py-1.5 text-center bg-blue-50/60">{shedTotals.close_f || '—'}</td>
                        <td className="px-1 py-1.5 text-center bg-blue-50/60">{shedTotals.close_m || '—'}</td>
                        <td className="px-1 py-1.5 text-center text-gray-400">—</td>
                        <td className="px-1 py-1.5 text-center text-gray-400" colSpan={3}>—</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              {/* ── Flock-level grade breakdown ── */}
              {(() => {
                const sums = { he: shedTotals.he, je: shedTotals.je, te: shedTotals.te, be: shedTotals.be, le: shedTotals.le }
                const gi = (f: string) => <input type="number" min="0"
                  value={(gradeRow as any)[f]} placeholder="0"
                  onChange={e => setGradeRow(g => ({ ...g, [f]: e.target.value }))}
                  className="w-24 text-center border border-green-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400 bg-white" />
                const gradeA = parseInt(gradeRow.he_grade_a) || 0
                const gradeB = parseInt(gradeRow.he_grade_b) || 0
                const gradeC = parseInt(gradeRow.he_grade_c) || 0
                const gradeTotal = gradeA + gradeB + gradeC
                const gradeDiff = sums.he - gradeTotal
                const graded = gradeTotal > 0
                return (
                  <div className="px-4 py-3 border-t border-gray-100 bg-green-50/40">
                    <p className="text-xs font-semibold text-green-800 mb-2">HE Grade Breakdown (flock-level — enter after grading all sheds)</p>
                    <div className="flex flex-wrap items-start gap-6">
                      {/* Shed egg totals */}
                      <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                        <span className="bg-white border border-gray-200 rounded px-2 py-1">HE: <strong className="text-gray-800">{sums.he || '—'}</strong></span>
                        <span className="bg-white border border-gray-200 rounded px-2 py-1">JE: <strong className="text-gray-800">{sums.je || '—'}</strong></span>
                        <span className="bg-white border border-gray-200 rounded px-2 py-1">TE: <strong className="text-gray-800">{sums.te || '—'}</strong></span>
                        <span className="bg-white border border-gray-200 rounded px-2 py-1">BE: <strong className="text-gray-800">{sums.be || '—'}</strong></span>
                        <span className="bg-white border border-gray-200 rounded px-2 py-1">LE: <strong className="text-gray-800">{sums.le || '—'}</strong></span>
                        <span className="bg-white border border-gray-200 rounded px-2 py-1">Total NHE: <strong className="text-gray-800">{(sums.je+sums.te+sums.be) || '—'}</strong></span>
                      </div>
                      {/* Grade inputs */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="text-xs text-gray-600">Grade A</label>{gi('he_grade_a')}
                        <label className="text-xs text-gray-600">Grade B</label>{gi('he_grade_b')}
                        <label className="text-xs text-gray-600">Grade C</label>{gi('he_grade_c')}
                      </div>
                      {/* Grade match indicator */}
                      {graded && (
                        <div className={`flex items-center gap-3 text-xs font-semibold px-3 py-1.5 rounded-lg border ${gradeDiff === 0 ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-800'}`}>
                          <span>A+B+C: {gradeTotal}</span>
                          <span>|</span>
                          <span>HE total: {sums.he}</span>
                          <span>|</span>
                          {gradeDiff === 0
                            ? <span>✓ Matched</span>
                            : <span>Diff: {gradeDiff > 0 ? '+' : ''}{gradeDiff} {gradeDiff > 0 ? '(ungraded)' : '(over-graded)'}</span>
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </Card>
          )}
        </>
      )}

      {/* ── FLOCK MODE ── */}
      {!isSheedMode && (
        <>
          {visibleFlocks.length === 0 && <EmptyState icon={<Save size={32} />} title="No active flocks found" />}
          {Object.entries(grouped).map(([farm, farmFlocks]) => (
            <Card key={farm} padding={false}>
              <div className="px-4 py-2 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
                <h3 className="font-semibold text-brand-800 text-sm">{farm}</h3>
                <button onClick={() => setShowWastage(w => !w)}
                  className={`text-xs px-2 py-0.5 rounded border ${showWastage ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                  {showWastage ? '× Hide Wastage' : '+ Wastage'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-3 py-2 text-left">Flock</th>
                      <th className="px-2 py-2 text-center">Feed ♀ kg</th>
                      <th className="px-2 py-2 text-center">Type ♀</th>
                      <th className="px-2 py-2 text-center">Feed ♂ kg</th>
                      <th className="px-2 py-2 text-center">Type ♂</th>
                      <th className="px-2 py-2 text-center">Death ♀</th>
                      <th className="px-2 py-2 text-center">Death ♂</th>
                      <th className="px-2 py-2 text-center">HE</th>
                      <th className="px-2 py-2 text-center">JE</th>
                      <th className="px-2 py-2 text-center">TE</th>
                      <th className="px-2 py-2 text-center">BE</th>
                      <th className="px-2 py-2 text-center">LE</th>
                      <th className="px-2 py-2 text-center bg-green-50">Grd A</th>
                      <th className="px-2 py-2 text-center bg-green-50">Grd B</th>
                      <th className="px-2 py-2 text-center bg-green-50">Grd C</th>
                      {showWastage && <><th className="px-2 py-2 text-center bg-red-50">Wst HE</th><th className="px-2 py-2 text-center bg-red-50">Wst JE</th><th className="px-2 py-2 text-center bg-red-50">Wst TE</th><th className="px-2 py-2 text-center bg-red-50">Wst BE</th></>}
                      <th className="px-2 py-2 text-left" style={{ minWidth: 160 }}>Medicine</th>
                      <th className="px-2 py-2 text-center">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmFlocks.map((flock: any, idx: number) => {
                      const r = flockRows[flock.id] ?? emptyFlockRow()
                      return (
                        <tr key={flock.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-3 py-1.5 font-semibold text-brand-700">
                            F-{flock.flock_no}
                            {flock.breed && <span className="text-xs text-gray-400 ml-1">{flock.breed}</span>}
                          </td>
                          <td className="px-1 py-1">
                            <input type="number" min="0" value={r.feed_female_kg} placeholder="0"
                              onChange={e => updateFlockRow(flock.id, 'feed_female_kg', e.target.value)}
                              className="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white" />
                          </td>
                          <td className="px-1 py-1">
                            <select value={r.feed_type_f} onChange={e => updateFlockRow(flock.id, 'feed_type_f', e.target.value)}
                              className="w-full border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white">
                              {FEED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="px-1 py-1">
                            <input type="number" min="0" value={r.feed_male_kg} placeholder="0"
                              onChange={e => updateFlockRow(flock.id, 'feed_male_kg', e.target.value)}
                              className="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white" />
                          </td>
                          <td className="px-1 py-1">
                            <select value={r.feed_type_m} onChange={e => updateFlockRow(flock.id, 'feed_type_m', e.target.value)}
                              className="w-full border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white">
                              {FEED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          {(['mortality_female','mortality_male'] as const).map(field => (
                            <td key={field} className="px-1 py-1">
                              <input type="number" min="0" value={r[field]} placeholder="0"
                                onChange={e => updateFlockRow(flock.id, field, e.target.value)}
                                className="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white" />
                            </td>
                          ))}
                          {(['he_eggs','je_eggs','te_eggs','be_eggs','le_eggs'] as const).map(field => (
                            <td key={field} className="px-1 py-1">
                              <input type="number" min="0" value={r[field]} placeholder="0"
                                onChange={e => updateFlockRow(flock.id, field, e.target.value)}
                                className="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white" />
                            </td>
                          ))}
                          {(['he_grade_a','he_grade_b','he_grade_c'] as const).map(field => (
                            <td key={field} className="px-1 py-1 bg-green-50/40">
                              <input type="number" min="0" value={r[field]} placeholder="0"
                                onChange={e => updateFlockRow(flock.id, field, e.target.value)}
                                className="w-full text-center border border-green-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400 bg-white" />
                            </td>
                          ))}
                          {showWastage && (['wastage_he','wastage_je','wastage_te','wastage_be'] as const).map(field => (
                            <td key={field} className="px-1 py-1 bg-red-50/30">
                              <input type="number" min="0" value={r[field]} placeholder="0"
                                onChange={e => updateFlockRow(flock.id, field, e.target.value)}
                                className="w-full text-center border border-red-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-400 bg-white" />
                            </td>
                          ))}
                          <td className="px-1 py-1">
                            <SearchableSelect value={r.med_id} onChange={(v) => updateFlockRow(flock.id, 'med_id', v)} options={medOptions} placeholder="Search medicine…" />
                          </td>
                          <td className="px-1 py-1">
                            <input type="number" min="0" value={r.med_qty} placeholder="qty" disabled={!r.med_id}
                              onChange={e => updateFlockRow(flock.id, 'med_qty', e.target.value)}
                              className="w-16 text-center border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-300" />
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

      {((isSheedMode && flockSheds.length > 0) || (!isSheedMode && visibleFlocks.length > 0)) && (
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
