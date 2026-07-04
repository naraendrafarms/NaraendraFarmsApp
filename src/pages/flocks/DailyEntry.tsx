import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import { useFarmScope } from '@/lib/useFarmScope'
import { useFeedRates } from '@/hooks/useFeedRates'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import {
  Card, CardHeader, Button, Input, Select, FormRow, Divider,
  SectionHeader, Spinner, Badge
, DateInput, SearchableSelect } from '@/components/ui'
import toast from 'react-hot-toast'
import { Save, ChevronLeft, ChevronRight, Download, Upload, Plus, Trash2 } from 'lucide-react'

function exportCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

const DAILY_HEADERS = ['date','opening_female','opening_male','feed_female_kg','feed_type_f','feed_male_kg','feed_type_m','he_eggs','he_grade_a','he_grade_b','he_grade_c','je_eggs','te_eggs','be_eggs','le_eggs','wastage_eggs','transfer_female','transfer_male','cull_female','cull_male','mortality_female','mortality_male','lighting_hrs','age_weeks','remarks']
const DAILY_EXAMPLE = ['2026-01-01',500,20,65,'L1',3,'MALE',440,400,30,10,0,0,5,5,0,0,0,0,0,1,0,16,25,'']


export const DailyEntry: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const feedRates = useFeedRates()
  const [selectedFlock, setSelectedFlock] = useState(() => localStorage.getItem('de_flock') ?? '')
  const [selectedShed, setSelectedShed] = useState(() => localStorage.getItem('de_shed') ?? '')
  const [date, setDate] = useState(() => localStorage.getItem('de_date') ?? today())
  useEffect(() => { localStorage.setItem('de_flock', selectedFlock) }, [selectedFlock])
  useEffect(() => { localStorage.setItem('de_shed', selectedShed) }, [selectedShed])
  useEffect(() => { localStorage.setItem('de_date', date) }, [date])

  const [quickEntry, setQuickEntry] = useState(false)
  const [showWastageTypes, setShowWastageTypes] = useState(false)
  const [heQuickTotal, setHeQuickTotal] = useState('')
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const { data: flocks } = useQuery({
    queryKey: ['active_flocks', farmId],
    queryFn: async () => {
      let q = supabase
        .from('flocks')
        .select('id, flock_no, status, laying_farm_id, rearing_farm_id, laying_start_date, placement_date, farms!laying_farm_id(name)')
        .neq('status', 'closed')
        .eq('is_vhl_contract', false)
        .order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q
      return data ?? []
    }
  })

  // Load sheds from rearing farm if status=rearing, else laying farm
  const { data: sheds } = useQuery({
    queryKey: ['sheds_for_flock', selectedFlock],
    queryFn: async () => {
      const flock = flocks?.find((f: any) => f.id === selectedFlock)
      // Use rearing farm sheds when still in rearing phase, laying farm sheds after transfer
      const farmId = flock?.status === 'rearing'
        ? (flock?.rearing_farm_id ?? flock?.laying_farm_id)
        : (flock?.laying_farm_id ?? flock?.rearing_farm_id)
      if (!farmId) return []
      const { data } = await supabase
        .from('sheds')
        .select('id,shed_no,shed_name,shed_type')
        .eq('farm_id', farmId)
        .eq('is_active', true)
        .order('shed_no')
      return data ?? []
    },
    enabled: !!selectedFlock && !!flocks
  })

  const { data: feedTypesData = [] } = useQuery({
    queryKey: ['feed_types'],
    queryFn: async () => { const { data } = await supabase.from('feed_types').select('code').eq('is_active', true).order('sort_order'); return (data ?? []).map((r: any) => r.code as string) },
    staleTime: 10 * 60 * 1000,
  })
  const FEED_TYPES = feedTypesData.length ? feedTypesData : ['BCM','BGM','BDM','PBM','L1','L2','L3','CHICK','MALE']

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['daily_record', selectedFlock, date, selectedShed],
    queryFn: async () => {
      if (!selectedFlock || !date) return null
      let q = supabase
        .from('daily_records')
        .select('*')
        .eq('flock_id', selectedFlock)
        .eq('record_date', date)
      if (selectedShed) q = q.eq('shed_id', selectedShed)
      else q = q.is('shed_id', null)
      const { data } = await q.single()
      return data
    },
    enabled: !!selectedFlock && !!date
  })

  // Check shed placement batch for this shed+date (to auto-fill opening on first day)
  const { data: shedPlacement } = useQuery({
    queryKey: ['shed_placement', selectedFlock, selectedShed, date],
    queryFn: async () => {
      if (!selectedFlock || !selectedShed || !date) return null
      const { data } = await supabase
        .from('shed_allocations')
        .select('female_count, male_count')
        .eq('flock_id', selectedFlock)
        .eq('shed_id', selectedShed)
        .eq('allocated_date', date)
        .single()
      return data
    },
    enabled: !!selectedFlock && !!selectedShed && !!date
  })

  // Get previous day to pre-fill opening birds — must match same shed
  const { data: prevRecord } = useQuery({
    queryKey: ['prev_daily', selectedFlock, date, selectedShed],
    queryFn: async () => {
      if (!selectedFlock) return null
      let q = supabase
        .from('daily_records')
        .select('closing_female, closing_male, record_date')
        .eq('flock_id', selectedFlock)
        .lt('record_date', date)
        .order('record_date', { ascending: false })
        .limit(1)
      if (selectedShed) q = q.eq('shed_id', selectedShed)
      else q = q.is('shed_id', null)
      const { data } = await q.single()
      return data
    },
    enabled: !!selectedFlock && !!date
  })

  const [medRows, setMedRows] = useState<Array<{ medicine_id: string; qty: string; unit: string; rate: string; remarks: string }>>([])

  const { data: medicines } = useQuery({
    queryKey: ['medicines_active'],
    queryFn: async () => { const{data}=await supabase.from('medicines_master').select('id,name,unit,rate').eq('is_active',true).order('name'); return data??[] }
  })

  // Real weighted-average purchase cost from GRN, keyed by medicine_id — prefer
  // this over medicines_master.rate (a manually-set price that drifts from
  // actual purchase cost and is often left blank/stale), so medicine/vaccine
  // amounts recorded here match what P&L reports actually expect.
  const { data: medicineStockRates } = useQuery({
    queryKey: ['v_medicine_stock_rates'],
    queryFn: async () => {
      const { data } = await supabase.from('v_medicine_stock').select('medicine_id,purchased_qty,purchase_value,adjustment_rate')
      const m: Record<string, number> = {}
      for (const r of (data ?? [])) {
        const qty = Number(r.purchased_qty) || 0
        if (r.medicine_id && qty > 0) m[r.medicine_id] = Number(r.purchase_value) / qty
        else if (r.medicine_id && Number(r.adjustment_rate) > 0) m[r.medicine_id] = Number(r.adjustment_rate)
      }
      return m
    }
  })

  const { data: existingMedUsage } = useQuery({
    queryKey: ['daily_med_usage', selectedFlock, date],
    queryFn: async () => {
      if (!selectedFlock || !date) return []
      const{data}=await supabase.from('medicine_usage').select('*').eq('flock_id', selectedFlock).eq('usage_date', date)
      return data??[]
    },
    enabled: !!selectedFlock && !!date
  })

  const [form, setForm] = useState({
    opening_female: '', opening_male: '',
    feed_female_kg: '', feed_male_kg: '',
    feed_type_f: 'L1', feed_type_m: 'MALE',
    total_eggs: '', he_eggs: '', he_grade_a: '', he_grade_b: '', he_grade_c: '',
    je_eggs: '0', te_eggs: '0', be_eggs: '0', le_eggs: '0', wastage_eggs: '0',
    wastage_he: '', wastage_je: '', wastage_te: '', wastage_be: '',
    transfer_female: '0', transfer_male: '0',
    cull_female: '0', cull_male: '0',
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
        he_grade_a:     existing.he_grade_a?.toString() ?? '',
        he_grade_b:     existing.he_grade_b?.toString() ?? '',
        he_grade_c:     existing.he_grade_c?.toString() ?? '',
        je_eggs:        existing.je_eggs?.toString() ?? '0',
        te_eggs:        existing.te_eggs?.toString() ?? '0',
        be_eggs:        existing.be_eggs?.toString() ?? '0',
        le_eggs:        existing.le_eggs?.toString() ?? '0',
        wastage_eggs:   existing.wastage_eggs?.toString() ?? '0',
        wastage_he:     existing.wastage_he?.toString() ?? '',
        wastage_je:     existing.wastage_je?.toString() ?? '',
        wastage_te:     existing.wastage_te?.toString() ?? '',
        wastage_be:     existing.wastage_be?.toString() ?? '',
        transfer_female: existing.transfer_female?.toString() ?? existing.trcull_female?.toString() ?? '0',
        transfer_male:   existing.transfer_male?.toString() ?? existing.trcull_male?.toString() ?? '0',
        cull_female:     existing.cull_female?.toString() ?? '0',
        cull_male:       existing.cull_male?.toString() ?? '0',
        mortality_female: existing.mortality_female?.toString() ?? '0',
        mortality_male:   existing.mortality_male?.toString() ?? '0',
        closing_female: existing.closing_female?.toString() ?? '',
        closing_male:   existing.closing_male?.toString() ?? '',
        lighting_hrs:   existing.lighting_hrs?.toString() ?? '',
        age_weeks:      existing.age_weeks?.toString() ?? '',
        remarks:        existing.remarks ?? ''
      })
      if (existing.wastage_he || existing.wastage_je || existing.wastage_te || existing.wastage_be) {
        setShowWastageTypes(true)
      }
    } else if (shedPlacement && !existing) {
      // First-day placement: opening = the batch size received
      setForm(f => ({
        ...f,
        opening_female: shedPlacement.female_count?.toString() ?? '',
        opening_male:   shedPlacement.male_count?.toString() ?? '',
      }))
    } else if (prevRecord && !existing) {
      setForm(f => ({
        ...f,
        opening_female: prevRecord.closing_female?.toString() ?? '',
        opening_male:   prevRecord.closing_male?.toString() ?? '',
      }))
    }
  }, [existing, prevRecord, shedPlacement])

  // Auto-compute closing = opening - transfer - cull - mortality
  const autoClose = () => {
    const of = parseInt(form.opening_female) || 0
    const om = parseInt(form.opening_male) || 0
    const trf = parseInt(form.transfer_female) || 0
    const trm = parseInt(form.transfer_male) || 0
    const cf = parseInt(form.cull_female) || 0
    const cm = parseInt(form.cull_male) || 0
    const mf = parseInt(form.mortality_female) || 0
    const mm = parseInt(form.mortality_male) || 0
    setForm(f => ({
      ...f,
      closing_female: Math.max(0, of - trf - cf - mf).toString(),
      closing_male:   Math.max(0, om - trm - cm - mm).toString(),
    }))
  }

  // Auto-compute closing whenever any bird movement field changes
  useEffect(() => {
    const of = parseInt(form.opening_female) || 0
    const om = parseInt(form.opening_male) || 0
    const trf = parseInt(form.transfer_female) || 0
    const trm = parseInt(form.transfer_male) || 0
    const cf = parseInt(form.cull_female) || 0
    const cm = parseInt(form.cull_male) || 0
    const mf = parseInt(form.mortality_female) || 0
    const mm = parseInt(form.mortality_male) || 0
    setForm(f => ({
      ...f,
      closing_female: Math.max(0, of - trf - cf - mf).toString(),
      closing_male:   Math.max(0, om - trm - cm - mm).toString(),
    }))
  }, [form.opening_female, form.opening_male, form.transfer_female, form.transfer_male, form.cull_female, form.cull_male, form.mortality_female, form.mortality_male])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const selectedFlockData = flocks?.find((f: any) => f.id === selectedFlock)
  const isLayingPhase = selectedFlockData?.status === 'laying' ||
    !!(selectedFlockData?.laying_start_date && date >= selectedFlockData.laying_start_date)

  // Populate medicine rows from existing usage records
  React.useEffect(() => {
    if (existingMedUsage && existingMedUsage.length > 0) {
      setMedRows(existingMedUsage.map((u: any) => ({
        medicine_id: u.medicine_id ?? '',
        qty: u.quantity?.toString() ?? '',
        unit: u.unit ?? '',
        rate: u.rate?.toString() ?? '',
        remarks: u.remarks ?? ''
      })))
    } else if (!existingMedUsage || existingMedUsage.length === 0) {
      setMedRows([])
    }
  }, [existingMedUsage])

  // Auto-fill age_weeks from placement_date when no existing record
  React.useEffect(() => {
    if (existing || !selectedFlockData?.placement_date || !date) return
    const dayAge = Math.floor((new Date(date).getTime() - new Date(selectedFlockData.placement_date).getTime()) / 86400000)
    const wk = parseFloat((dayAge / 7).toFixed(1))
    if (wk >= 0) setForm(f => ({ ...f, age_weeks: wk.toString() }))
  }, [existing, selectedFlockData, date])

  const mut = useMutation({
    mutationFn: async () => {
      if (!selectedFlock || !date) throw new Error('Select flock and date')
      const payload = {
        flock_id:         selectedFlock,
        record_date:      date,
        farm_id:          selectedFlockData?.status === 'rearing'
          ? (selectedFlockData?.rearing_farm_id ?? selectedFlockData?.laying_farm_id)
          : (selectedFlockData?.laying_farm_id ?? selectedFlockData?.rearing_farm_id),
        shed_id:          selectedShed || null,
        opening_female:   parseInt(form.opening_female) || 0,
        opening_male:     parseInt(form.opening_male) || 0,
        feed_female_kg:   parseFloat(form.feed_female_kg) || 0,
        feed_male_kg:     parseFloat(form.feed_male_kg) || 0,
        feed_type_f:      form.feed_type_f,
        feed_type_m:      form.feed_type_m,
        total_eggs:       parseInt(form.total_eggs) || 0,
        he_eggs:          parseInt(form.he_eggs) || 0,
        he_grade_a:       parseInt(form.he_grade_a) || null,
        he_grade_b:       parseInt(form.he_grade_b) || null,
        he_grade_c:       parseInt(form.he_grade_c) || null,
        je_eggs:          parseInt(form.je_eggs) || 0,
        te_eggs:          parseInt(form.te_eggs) || 0,
        be_eggs:          parseInt(form.be_eggs) || 0,
        le_eggs:          parseInt(form.le_eggs) || 0,
        wastage_eggs:     parseInt(form.wastage_eggs) || null,
        wastage_he:       parseInt(form.wastage_he) || null,
        wastage_je:       parseInt(form.wastage_je) || null,
        wastage_te:       parseInt(form.wastage_te) || null,
        wastage_be:       parseInt(form.wastage_be) || null,
        transfer_female:  parseInt(form.transfer_female) || 0,
        transfer_male:    parseInt(form.transfer_male) || 0,
        cull_female:      parseInt(form.cull_female) || 0,
        cull_male:        parseInt(form.cull_male) || 0,
        trcull_female:    (parseInt(form.transfer_female)||0) + (parseInt(form.cull_female)||0),
        trcull_male:      (parseInt(form.transfer_male)||0) + (parseInt(form.cull_male)||0),
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
        const { error } = await supabase.from('daily_records').insert({ ...payload })
        if (error) throw error
      }
      // Mirror feed to daily_feed so the Flock → Feed tab shows it
      const ff = parseFloat(form.feed_female_kg) || 0
      const fm = parseFloat(form.feed_male_kg) || 0
      if (ff > 0 || fm > 0) {
        const ftF = form.feed_type_f || 'BCM'
        const ftM = form.feed_type_m || 'BCM'
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
      // Save medicine usage rows — delete existing FLOCK-LEVEL rows then
      // re-insert. The shed_id filter matters: without it this wiped the
      // per-shed medicine rows saved from Bulk Daily Entry for the same day.
      await supabase.from('medicine_usage').delete().eq('flock_id', selectedFlock).eq('usage_date', date).is('shed_id', null)
      const validMedRows = medRows.filter(r => r.medicine_id && r.qty)
      if (validMedRows.length > 0) {
        const medPayload = validMedRows.map(r => ({
          flock_id:    selectedFlock,
          usage_date:  date,
          medicine_id: r.medicine_id,
          quantity:    parseFloat(r.qty) || null,
          unit:        r.unit || null,
          rate:        parseFloat(r.rate) || null,
          amount:      (parseFloat(r.qty)||0) * (parseFloat(r.rate)||0) || null,
          remarks:     r.remarks || null,
        }))
        const { error } = await supabase.from('medicine_usage').insert(medPayload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(existing ? '✅ Record updated' : 'Record saved!')
      qc.invalidateQueries({ queryKey: ['daily_record', selectedFlock, date] })
      qc.invalidateQueries({ queryKey: ['daily_med_usage', selectedFlock, date] })
      qc.invalidateQueries({ queryKey: ['recent_records', selectedFlock] })
      qc.invalidateQueries({ queryKey: ['flock_summary'] })
      qc.invalidateQueries({ queryKey: ['v_medicine_stock'] })
      qc.invalidateQueries({ queryKey: ['flock_daily_feed', selectedFlock] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  // Local-time date maths — toISOString() is UTC and shifts a day early in IST
  const localYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const prevDay = () => {
    const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()-1)
    setDate(localYMD(d))
  }
  const nextDay = () => {
    const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()+1)
    setDate(localYMD(d))
  }

  // Recent 14 days records for selected flock (all sheds)
  const fourteenDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate()-14); return localYMD(d) })()
  const { data: recentRecords } = useQuery({
    queryKey: ['recent_records', selectedFlock, fourteenDaysAgo],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_records')
        .select('*,sheds(shed_no,shed_name)')
        .eq('flock_id', selectedFlock)
        .gte('record_date', fourteenDaysAgo)
        .order('record_date', { ascending: false })
      return data ?? []
    },
    enabled: !!selectedFlock
  })

  // Computed metrics
  const openF = parseInt(form.opening_female)||0
  const totalEggs = parseInt(form.total_eggs)||0
  const heEggs = parseInt(form.he_eggs)||0
  const hdPct = openF>0 ? (totalEggs/openF*100).toFixed(1)+'%' : '—'
  const hePct = totalEggs>0 ? (heEggs/totalEggs*100).toFixed(1)+'%' : '—'

  const handleExport = async () => {
    if (!selectedFlock) { toast.error('Select a flock first'); return }
    const { data } = await supabase.from('daily_records')
      .select('*').eq('flock_id', selectedFlock).order('record_date')
    if (!data?.length) { toast.error('No records to export'); return }
    exportCSV(`daily_${selectedFlockData?.flock_no}_records.csv`,
      DAILY_HEADERS,
      data.map((r: any) => [r.record_date,r.opening_female,r.opening_male,r.feed_female_kg,r.feed_type_f,r.feed_male_kg,r.feed_type_m,r.he_eggs,r.he_grade_a,r.he_grade_b,r.he_grade_c,r.je_eggs,r.te_eggs,r.be_eggs,r.le_eggs,r.wastage_eggs,r.transfer_female??r.trcull_female,r.transfer_male??r.trcull_male,r.cull_female??0,r.cull_male??0,r.mortality_female,r.mortality_male,r.lighting_hrs,r.age_weeks,r.remarks])
    )
  }

  const handleTemplate = () => downloadXlsxTemplate('daily_entry_template.xlsx', DAILY_HEADERS, DAILY_EXAMPLE)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!selectedFlock) { toast.error('Select a flock first'); e.target.value = ''; return }
    const { headers, rows } = await parseFile(file)
    const col = (n: string) => { const i = headers.indexOf(n); return i >= 0 ? i : headers.indexOf(n.replace(/_/g,'')) }
    const farmId = selectedFlockData?.status === 'rearing'
      ? (selectedFlockData?.rearing_farm_id ?? selectedFlockData?.laying_farm_id)
      : (selectedFlockData?.laying_farm_id ?? selectedFlockData?.rearing_farm_id)
    let saved = 0, skipped = 0
    for (const r of rows) {
      const dateVal = r[col('date')]?.trim()
      if (!dateVal) { skipped++; continue }
      const openingF = parseInt(r[col('opening_female')] || r[col('openingfemale')] || '0') || 0
      const openingM = parseInt(r[col('opening_male')]   || r[col('openingmale')]   || '0') || 0
      const heEggs   = parseInt(r[col('he_eggs')]        || r[col('heeggs')]        || '0') || 0
      const jeEggs   = parseInt(r[col('je_eggs')]        || r[col('jeeggs')]        || '0') || 0
      const teEggs   = parseInt(r[col('te_eggs')]        || r[col('teeggs')]        || '0') || 0
      const beEggs   = parseInt(r[col('be_eggs')]        || r[col('beeggs')]        || '0') || 0
      const leEggs   = parseInt(r[col('le_eggs')]        || r[col('leeggs')]        || '0') || 0
      const transferF = parseInt(r[col('transfer_female')] || r[col('transferfemale')] || r[col('trcull_female')] || '0') || 0
      const transferM = parseInt(r[col('transfer_male')]   || r[col('transfermale')]   || r[col('trcull_male')]   || '0') || 0
      const cullF     = parseInt(r[col('cull_female')]     || r[col('cullfemale')]     || '0') || 0
      const cullM     = parseInt(r[col('cull_male')]       || r[col('cullmale')]       || '0') || 0
      const mortalityF = parseInt(r[col('mortality_female')] || r[col('mortalityfemale')] || '0') || 0
      const mortalityM = parseInt(r[col('mortality_male')]   || r[col('mortalitymale')]   || '0') || 0
      const payload: any = {
        flock_id: selectedFlock, record_date: dateVal, farm_id: farmId,
        opening_female:   openingF,
        opening_male:     openingM,
        feed_female_kg:   parseFloat(r[col('feed_female_kg')] || r[col('feedfemalekg')] || '0') || 0,
        feed_male_kg:     parseFloat(r[col('feed_male_kg')]   || r[col('feedmalekg')]   || '0') || 0,
        feed_type_f:      r[col('feed_type_f')]  || r[col('feedtypef')]  || 'L1',
        feed_type_m:      r[col('feed_type_m')]  || r[col('feedtypem')]  || 'MALE',
        total_eggs:       heEggs + jeEggs + teEggs + beEggs + leEggs,
        he_eggs:          heEggs,
        he_grade_a:       parseInt(r[col('he_grade_a')]       || r[col('hegradea')]        || '0') || null,
        he_grade_b:       parseInt(r[col('he_grade_b')]       || r[col('hegradeb')]        || '0') || null,
        he_grade_c:       parseInt(r[col('he_grade_c')]       || r[col('hegradec')]        || '0') || null,
        je_eggs:          jeEggs,
        te_eggs:          teEggs,
        be_eggs:          beEggs,
        le_eggs:          leEggs,
        wastage_eggs:     parseInt(r[col('wastage_eggs')]     || r[col('wastageeggs')]     || '0') || null,
        transfer_female:  transferF,
        transfer_male:    transferM,
        cull_female:      cullF,
        cull_male:        cullM,
        trcull_female:    transferF + cullF,
        trcull_male:      transferM + cullM,
        mortality_female: mortalityF,
        mortality_male:   mortalityM,
        closing_female:   Math.max(0, openingF - mortalityF - transferF - cullF),
        closing_male:     Math.max(0, openingM - mortalityM - transferM - cullM),
        lighting_hrs:     parseFloat(r[col('lighting_hrs')]   || r[col('lightinghrs')]     || '') || null,
        age_weeks:        parseFloat(r[col('age_weeks')]      || r[col('ageweeks')]        || '') || null,
        remarks:          r[col('remarks')] || null,
      }
      // daily_records has no plain (flock_id,record_date) unique constraint —
      // only partial indexes including farm_id (+shed_id when set), so a
      // naive upsert onConflict here throws "no unique or exclusion
      // constraint matching" at runtime. Select-then-insert/update instead,
      // same pattern the manual save path already uses.
      const { data: existingRow } = await supabase.from('daily_records')
        .select('id').eq('flock_id', selectedFlock).eq('record_date', dateVal).eq('farm_id', farmId).is('shed_id', null).maybeSingle()
      const { error } = existingRow
        ? await supabase.from('daily_records').update(payload).eq('id', existingRow.id)
        : await supabase.from('daily_records').insert(payload)
      if (error) { skipped++; console.error(error) } else { saved++ }
    }
    qc.invalidateQueries({ queryKey: ['daily_record'] })
    qc.invalidateQueries({ queryKey: ['flock_summary'] })
    toast.success(`Imported ${saved} records${skipped ? `, skipped ${skipped}` : ''}`)
    e.target.value = ''
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Daily Flock Entry" subtitle="Enter daily production and bird movement data"
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleTemplate}>Template</Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={() => importRef.current?.click()}>Import Excel/CSV</Button>
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </div>
        }
      />

      {/* Quick Entry Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setQuickEntry(v => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${quickEntry ? 'bg-brand-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${quickEntry ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <span className="text-sm font-medium text-gray-700">Quick Entry Mode</span>
        {quickEntry && <span className="text-xs text-gray-400">— Shows only essential fields</span>}
      </div>

      {/* Flock + Shed + Date selector */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <Select label="Select Flock" required placeholder="— Choose flock —"
              options={(flocks??[]).map((f:any)=>({ value:f.id, label:`Flock ${f.flock_no} — ${f.status}` }))}
              value={selectedFlock} onChange={e => { setSelectedFlock(e.target.value); setSelectedShed(''); setHeQuickTotal('') }}
            />
          </div>
          <div className="w-52">
            <Select label="Shed (optional)" placeholder="— All / No shed —"
              options={(sheds??[]).map((s:any)=>({ value:s.id, label:`${s.shed_no}${s.shed_name ? ' — '+s.shed_name : ''} (${s.shed_type})` }))}
              value={selectedShed} onChange={e => setSelectedShed(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={prevDay} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
              <ChevronLeft size={16}/>
            </button>
            <DateInput label="Date" value={date} onChange={e => setDate(e.target.value)} />
            <button onClick={nextDay} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
              <ChevronRight size={16}/>
            </button>
          </div>
          {selectedShed && (() => { const s = (sheds??[]).find((x:any)=>x.id===selectedShed); return s ? <Badge color="green">Shed: {s.shed_no}{s.shed_name ? ' — '+s.shed_name : ''}</Badge> : null })()}
          {existing && <Badge color="blue">Editing existing record</Badge>}
          {shedPlacement && !existing && (
            <span className="text-xs text-green-600 font-medium">🐣 Placement day — opening filled from batch ({shedPlacement.female_count}F + {shedPlacement.male_count}M)</span>
          )}
          {prevRecord && !existing && !shedPlacement && (
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
                <Input label="Transfer Female" type="number"
                  value={form.transfer_female} onChange={e => set('transfer_female', e.target.value)}
                  hint="Moved to another farm" />
                <Input label="Transfer Male" type="number"
                  value={form.transfer_male} onChange={e => set('transfer_male', e.target.value)}
                  hint="Moved to another farm" />
                <Input label="Cull Female" type="number"
                  value={form.cull_female} onChange={e => set('cull_female', e.target.value)}
                  hint="⚠ Only culls NOT in NHE Bird Sales — Bird Sales auto-deduct" />
                <Input label="Cull Male" type="number"
                  value={form.cull_male} onChange={e => set('cull_male', e.target.value)}
                  hint="⚠ Only culls NOT in NHE Bird Sales — Bird Sales auto-deduct" />
              </FormRow>
              <FormRow cols={4}>
                <Input label="Mortality Female" type="number"
                  value={form.mortality_female} onChange={e => set('mortality_female', e.target.value)} />
                <Input label="Mortality Male" type="number"
                  value={form.mortality_male} onChange={e => set('mortality_male', e.target.value)} />
                <div className="col-span-2 flex items-end">
                  <div className="text-xs text-gray-500 pb-1">
                    Closing = Opening − Transfer − Cull − Mortality
                  </div>
                </div>
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
                options={FEED_TYPES} value={form.feed_type_m}
                onChange={e => set('feed_type_m', e.target.value)} />
            </FormRow>
          </Card>

          {/* Eggs — only shown after laying starts */}
          {isLayingPhase ? (
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
            <FormRow cols={2}>
              <Input label="Total Eggs" type="number" required
                value={form.total_eggs} onChange={e => set('total_eggs', e.target.value)} />
              <Input label="HE Total" type="number"
                value={form.he_eggs} onChange={e => set('he_eggs', e.target.value)}
                hint={selectedShed ? "HE count for this shed" : "Combined HE — fill grades below"} />
            </FormRow>
            {/* Grade Breakdown only at flock level — grading happens after collection from all sheds */}
            {!selectedShed && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">HE Grade Breakdown <span className="normal-case font-normal text-green-600">(flock-level — enter after grading all sheds)</span></p>
                <FormRow cols={3}>
                  <Input label="Grade A" type="number"
                    value={form.he_grade_a} onChange={e => set('he_grade_a', e.target.value)} />
                  <Input label="Grade B" type="number"
                    value={form.he_grade_b} onChange={e => set('he_grade_b', e.target.value)} />
                  <Input label="Grade C" type="number"
                    value={form.he_grade_c} onChange={e => set('he_grade_c', e.target.value)} />
                </FormRow>
              </div>
            )}
            {selectedShed && (
              <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                ⚠ Grade Breakdown (A/B/C) is entered at flock level after collecting eggs from all sheds — not per shed. Select "All / No shed" to enter grades.
              </div>
            )}
            <div className="mt-3">
              <FormRow cols={3}>
                <Input label="Jumbo Eggs (JE)" type="number"
                  value={form.je_eggs} onChange={e => set('je_eggs', e.target.value)} />
                <Input label="Table Eggs (TE)" type="number"
                  value={form.te_eggs} onChange={e => set('te_eggs', e.target.value)} />
                <Input label="Broken Eggs (BE)" type="number"
                  value={form.be_eggs} onChange={e => set('be_eggs', e.target.value)} />
              </FormRow>
              <div className="mt-3">
                <FormRow cols={3}>
                  <Input label="Leached Eggs (LE)" type="number"
                    value={form.le_eggs} onChange={e => set('le_eggs', e.target.value)} />
                  <Input label="Wastage (unspecified)" type="number"
                    value={form.wastage_eggs} onChange={e => set('wastage_eggs', e.target.value)} />
                </FormRow>
              </div>
              {/* Live egg totals */}
              {(() => {
                const he = parseInt(form.he_eggs) || 0
                const je = parseInt(form.je_eggs) || 0
                const te = parseInt(form.te_eggs) || 0
                const be = parseInt(form.be_eggs) || 0
                const le = parseInt(form.le_eggs) || 0
                const total = he + je + te + be + le
                const ga = parseInt(form.he_grade_a) || 0
                const gb = parseInt(form.he_grade_b) || 0
                const gc = parseInt(form.he_grade_c) || 0
                const gradeTotal = ga + gb + gc
                const gradeDiff = he - gradeTotal
                if (!total && !gradeTotal) return null
                return (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="bg-brand-50 border border-brand-200 rounded px-2 py-1 font-semibold text-brand-800">
                      Total Eggs: {total.toLocaleString('en-IN')}
                    </span>
                    {he > 0 && <span className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-600">HE: {he}</span>}
                    {je > 0 && <span className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-600">JE: {je}</span>}
                    {te > 0 && <span className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-600">TE: {te}</span>}
                    {be > 0 && <span className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-600">BE: {be}</span>}
                    {le > 0 && <span className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-600">LE: {le}</span>}
                    {gradeTotal > 0 && (
                      <span className={`rounded px-2 py-1 font-semibold border ${gradeDiff === 0 ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-700'}`}>
                        A+B+C: {gradeTotal} | HE: {he} {gradeDiff === 0 ? '✓' : `| Diff: ${gradeDiff > 0 ? '+' : ''}${gradeDiff}`}
                      </span>
                    )}
                  </div>
                )
              })()}
              <div className="mt-3">
                <button type="button" onClick={() => setShowWastageTypes(w => !w)}
                  className={`text-xs px-2 py-0.5 rounded border ${showWastageTypes ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                  {showWastageTypes ? '× Hide Wastage by Type' : '+ Wastage by Type'}
                </button>
                {showWastageTypes && (
                  <div className="mt-2">
                    <FormRow cols={4}>
                      <Input label="Wastage HE" type="number"
                        value={form.wastage_he} onChange={e => set('wastage_he', e.target.value)} />
                      <Input label="Wastage JE" type="number"
                        value={form.wastage_je} onChange={e => set('wastage_je', e.target.value)} />
                      <Input label="Wastage TE" type="number"
                        value={form.wastage_te} onChange={e => set('wastage_te', e.target.value)} />
                      <Input label="Wastage BE" type="number"
                        value={form.wastage_be} onChange={e => set('wastage_be', e.target.value)} />
                    </FormRow>
                  </div>
                )}
              </div>
            </div>
          </Card>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              🥚 Egg collection fields will appear once laying starts
              {selectedFlockData?.laying_start_date
                ? ` (Laying start: ${selectedFlockData.laying_start_date})`
                : ' — set Laying Start Date in the flock settings'}
            </div>
          )}

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

          {/* Medicine / Vaccine Usage */}
          <Card>
            <CardHeader title="Medicine & Vaccine Used Today"
              action={
                <Button size="sm" variant="outline" icon={<Plus size={14}/>}
                  onClick={() => setMedRows(r => [...r, { medicine_id: '', qty: '', unit: '', rate: '', remarks: '' }])}>
                  Add Row
                </Button>
              }
            />
            {medRows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">No medicine/vaccine recorded for today — click Add Row to record usage</p>
            ) : (
              <div className="space-y-2">
                {medRows.map((row, i) => {
                  const autoAmt = (parseFloat(row.qty)||0) * (parseFloat(row.rate)||0)
                  return (
                    <div key={i} className="flex gap-2 items-end flex-wrap bg-gray-50 rounded-lg px-3 py-2">
                      <div className="w-44">
                        <label className="text-xs text-gray-500 mb-1 block">Medicine / Vaccine</label>
                        <SearchableSelect
                          value={row.medicine_id}
                          onChange={(v) => {
                            const med = (medicines??[]).find((m: any) => m.id === v)
                            const realRate = medicineStockRates?.[v]
                            const rate = realRate != null ? realRate.toFixed(2) : (med?.rate?.toString() ?? row.rate)
                            setMedRows(rows => rows.map((r, j) => j===i ? { ...r, medicine_id: v, unit: med?.unit??r.unit, rate } : r))
                          }}
                          options={(medicines??[]).map((m: any) => ({ value: m.id, label: m.name }))}
                          placeholder="Search medicine…" />
                      </div>
                      <div className="w-20">
                        <label className="text-xs text-gray-500 mb-1 block">Qty</label>
                        <input type="number" step="0.001" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          value={row.qty} onChange={e => setMedRows(rows => rows.map((r,j) => j===i?{...r,qty:e.target.value}:r))} />
                      </div>
                      <div className="w-16">
                        <label className="text-xs text-gray-500 mb-1 block">Unit</label>
                        <input type="text" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          value={row.unit} onChange={e => setMedRows(rows => rows.map((r,j) => j===i?{...r,unit:e.target.value}:r))} />
                      </div>
                      <div className="w-20">
                        <label className="text-xs text-gray-500 mb-1 block">Rate ₹</label>
                        <input type="number" step="0.01" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          value={row.rate} onChange={e => setMedRows(rows => rows.map((r,j) => j===i?{...r,rate:e.target.value}:r))} />
                      </div>
                      {autoAmt > 0 && <span className="text-xs text-gray-500 pb-2">= ₹{autoAmt.toFixed(2)}</span>}
                      <div className="flex-1 min-w-28">
                        <label className="text-xs text-gray-500 mb-1 block">Remarks</label>
                        <input type="text" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          value={row.remarks} onChange={e => setMedRows(rows => rows.map((r,j) => j===i?{...r,remarks:e.target.value}:r))} />
                      </div>
                      <button onClick={() => setMedRows(rows => rows.filter((_,j) => j!==i))}
                        className="p-1.5 text-gray-400 hover:text-red-600 mb-0.5"><Trash2 size={14}/></button>
                    </div>
                  )
                })}
                {medRows.some(r => r.qty && r.rate) && (
                  <div className="text-right text-xs text-gray-600 pr-8 pt-1">
                    Total medicine cost today: <strong>₹{medRows.reduce((s,r) => s + (parseFloat(r.qty)||0)*(parseFloat(r.rate)||0), 0).toFixed(2)}</strong>
                  </div>
                )}
              </div>
            )}
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSelectedFlock('')}>Clear</Button>
            <Button icon={<Save size={16}/>} loading={mut.isPending} onClick={() => mut.mutate()}>
              {existing ? 'Update Record' : 'Save Record'}
            </Button>
          </div>

          {/* Recent Records Table */}
          {recentRecords && recentRecords.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-800 text-sm">Recent Records (Last 14 Days)</p>
                <span className="text-xs text-gray-400">{recentRecords.length} record{recentRecords.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Date','Shed','♀ Deaths','♂ Deaths','HE (A+B+C)','NHE (JE+TE+BE)','Feed kg','HD%',''].map((h,i) => (
                        <th key={i} className="py-2 px-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentRecords.map((r: any) => {
                      const he = (r.he_grade_a ?? 0) + (r.he_grade_b ?? 0) + (r.he_grade_c ?? 0)
                      const nhe = (r.je_eggs ?? 0) + (r.te_eggs ?? 0) + (r.be_eggs ?? 0)
                      const openF = r.opening_female ?? 0
                      const hdPct = openF > 0 ? (r.total_eggs ?? 0) / openF * 100 : null
                      const hdColor = hdPct == null ? 'text-gray-400' : hdPct >= 80 ? 'text-green-600 font-bold' : hdPct >= 65 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'
                      const shedLabel = r.sheds ? `${r.sheds.shed_no}${r.sheds.shed_name ? ' '+r.sheds.shed_name : ''}` : '—'
                      const totalFeed = ((r.feed_female_kg ?? 0) + (r.feed_male_kg ?? 0)).toFixed(1)
                      return (
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-1.5 px-2 font-medium whitespace-nowrap">{r.record_date}</td>
                          <td className="py-1.5 px-2 text-gray-500">{shedLabel}</td>
                          <td className="py-1.5 px-2 text-center">{r.mortality_female ?? 0}</td>
                          <td className="py-1.5 px-2 text-center">{r.mortality_male ?? 0}</td>
                          <td className="py-1.5 px-2 text-center">{he > 0 ? he.toLocaleString('en-IN') : '—'}</td>
                          <td className="py-1.5 px-2 text-center">{nhe > 0 ? nhe.toLocaleString('en-IN') : '—'}</td>
                          <td className="py-1.5 px-2 text-center">{parseFloat(totalFeed) > 0 ? totalFeed : '—'}</td>
                          <td className={`py-1.5 px-2 text-center ${hdColor}`}>{hdPct != null ? hdPct.toFixed(1)+'%' : '—'}</td>
                          <td className="py-1.5 px-2">
                            <button
                              className="text-brand-600 hover:text-brand-800 text-xs font-medium whitespace-nowrap"
                              onClick={() => { setDate(r.record_date); setSelectedShed(r.shed_id ?? '') }}
                            >
                              ✏ Edit
                            </button>
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
    </div>
  )
}
