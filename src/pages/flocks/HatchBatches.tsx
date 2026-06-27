import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { fmtDate, today, pct } from '@/lib/utils'
import { useFarmScope } from '@/lib/useFarmScope'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState, StatCard, Divider
, DateInput } from '@/components/ui'
import { Plus, Edit2, Egg, Trash2, Download, Upload, FileDown } from 'lucide-react'
import toast from 'react-hot-toast'

// ── helpers ───────────────────────────────────────────────────────────────────
const p2 = (n: number) => parseFloat(n.toFixed(2))
const pct2 = (num: number, den: number) => den > 0 ? p2((num / den) * 100) : 0
const N = (v: any) => parseInt(v) || 0
const F = (v: any) => parseFloat(v) || 0

function ageDays(placementDate: string | null, settingDate: string): number | null {
  if (!placementDate || !settingDate) return null
  const d = Math.round((new Date(settingDate).getTime() - new Date(placementDate).getTime()) / 86400000)
  return d > 0 ? d : null
}
function ageLabel(days: number | null) {
  if (!days) return '—'
  const wk = Math.floor(days / 7)
  const d = days % 7
  return d > 0 ? `${wk}w ${d}d` : `${wk}w`
}

// ── computed row values ───────────────────────────────────────────────────────
function rowCalc(b: any) {
  const received = b.eggs_set ?? 0
  const broken   = b.broken_transit ?? 0
  const setting  = received - broken
  const inf      = b.infertile ?? 0
  const blst     = b.blasters ?? 0
  const fertile  = setting - inf          // fertile = setting - infertile
  const hatched  = b.hatched_chicks ?? 0
  const std      = b.std_chicks ?? (hatched - (b.culled_chicks ?? 0) - (b.rejects ?? 0))
  const unhatch  = b.unhatched ?? 0
  const reject   = b.rejects ?? 0
  const saleChk  = b.chicks_sold ?? 0
  const hatchPct = pct2(std, setting - inf - blst)  // hatch % on hatching-egg basis
  const stdPct   = pct2(std, setting)
  const stdBySetting = p2(setting * stdPct / 100)
  return {
    received, broken, setting, inf, fertile,
    blst, hatched, std, unhatch, reject, saleChk,
    brokenPct:  pct2(broken, received),
    infPct:     pct2(inf, setting),
    blstPct:    pct2(blst, setting),
    unhatchPct: pct2(unhatch, setting),
    rejectPct:  pct2(reject, setting),
    hatchPct,   stdPct, stdBySetting,
    stdMinusSale: std - saleChk,
  }
}

// ── Excel export ─────────────────────────────────────────────────────────────
function exportExcel(rows: any[]) {
  const data = rows.map((b: any) => {
    const r = rowCalc(b)
    return {
      'Flock':          `F-${b.flocks?.flock_no ?? b.he_dispatch?.flocks?.flock_no ?? ''}`,
      'Invoice/DC':     b.invoice_no ?? b.he_dispatch?.invoice_no ?? (b.he_dispatch?.dc_no ? `DC-${b.he_dispatch.dc_no}` : ''),
      'Hatchery':       b.hatchery_name ?? '',
      'Setting Date':   fmtDate(b.setting_date),
      'Hatch Date':     b.hatch_date ? fmtDate(b.hatch_date) : '',
      'Setting No':     b.setting_no ?? '',
      'Age @ Setting':  b.flocks?.placement_date && b.setting_date
        ? Math.round((new Date(b.setting_date).getTime() - new Date(b.flocks.placement_date).getTime()) / 86400000) + ' days'
        : '',
      'Eggs Weight':    b.eggs_weight ?? '',
      'Received':       r.received,
      'Setting':        r.setting,
      'Broken':         r.broken,
      'Broken%':        r.brokenPct,
      'Inf':            r.inf,
      'Inf%':           r.infPct,
      'Blst':           r.blst,
      'Blst%':          r.blstPct,
      'Sale Chk':       r.saleChk,
      'Hatch%':         r.hatchPct,
      'Std':            r.std,
      'Unhatch':        r.unhatch,
      'Unhatch%':       r.unhatchPct,
      'Reject':         r.reject,
      'Reject%':        r.rejectPct,
      'Setting×STD%':   r.stdBySetting,
      'STD-Sale Chicks': r.stdMinusSale,
      'Remarks':        b.remarks ?? '',
    }
  })
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Hatch Batches')
  XLSX.writeFile(wb, `HatchBatches_${today()}.xlsx`)
}

// ── template download ─────────────────────────────────────────────────────────
function downloadTemplate() {
  const headers = [['Flock No','Invoice No','DC No','Hatchery Name','Setting No',
    'Setting Date (DD/MM/YYYY)','Hatch Date (DD/MM/YYYY)','Eggs Weight',
    'Received','Broken in Transit','Infertile','Blasters','Hatched Chicks',
    'Culled Chicks','Unhatched','Rejects','Chicks Sold','Chick Rate','Remarks']]
  const ws = XLSX.utils.aoa_to_sheet(headers)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, 'HatchBatches_Template.xlsx')
}

// ── main component ─────────────────────────────────────────────────────────────
export const HatchBatches: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState<any>(null)
  const [flockFilter, setFlockFilter] = useState('')
  const [tab, setTab]               = useState<'batches'|'pipeline'>('batches')
  const [sel, setSel]               = useState<Set<string>>(new Set())
  const [delConfirm, setDelConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,placement_date').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q; return data ?? []
    }
  })

  const { data: dispatches } = useQuery({
    queryKey: ['he_dispatch_for_hatch', flockFilter],
    queryFn: async () => {
      let q = supabase.from('he_dispatch')
        .select('id,dispatch_date,invoice_no,dc_no,total_dispatched,flock_id,flocks(flock_no)')
        .order('dispatch_date', { ascending: false }).limit(300)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q; return data ?? []
    }
  })

  const { data: batches, isLoading } = useQuery({
    queryKey: ['hatch_batches', flockFilter],
    queryFn: async () => {
      let q = supabase.from('hatch_batches')
        .select('*, he_dispatch(dispatch_date,invoice_no,dc_no,total_dispatched,flocks(flock_no,placement_date)), flocks(flock_no,placement_date)')
        .order('setting_date', { ascending: false }).limit(200)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q; return data ?? []
    }
  })

  // Fetch dispatch lines for all batches that have a linked dispatch (for egg age + flock age at prod)
  const dispatchIds = [...new Set((batches ?? []).map((b: any) => b.dispatch_id).filter(Boolean))]
  const { data: allDispatchLines } = useQuery({
    queryKey: ['hatch_dispatch_lines', dispatchIds.join(',')],
    enabled: dispatchIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('he_dispatch_lines')
        .select('dispatch_id,prod_date,grade_a,grade_b,grade_c')
        .in('dispatch_id', dispatchIds)
      return data ?? []
    }
  })
  // Build a map: dispatch_id -> avg prod_date (as Date ms), total eggs
  const dispatchAvgProd: Record<string, number> = {}
  if (allDispatchLines) {
    const groups: Record<string, { sumMs: number; count: number }> = {}
    for (const l of allDispatchLines) {
      if (!l.dispatch_id || !l.prod_date) continue
      const ms = new Date(l.prod_date).getTime()
      if (!groups[l.dispatch_id]) groups[l.dispatch_id] = { sumMs: 0, count: 0 }
      const qty = (l.grade_a || 0) + (l.grade_b || 0) + (l.grade_c || 0)
      // weighted average by egg quantity
      groups[l.dispatch_id].sumMs += ms * (qty || 1)
      groups[l.dispatch_id].count += (qty || 1)
    }
    for (const [id, g] of Object.entries(groups)) {
      dispatchAvgProd[id] = g.sumMs / g.count
    }
  }

  // ── form state ───────────────────────────────────────────────────────────────
  const emptyForm = {
    dispatch_id: '', flock_id: flockFilter, invoice_no: '',
    hatchery_name: '', setting_no: '', eggs_weight: '',
    setting_date: today(), hatch_date: '',
    eggs_set: '', broken_transit: '0', infertile: '0',
    blasters: '0', hatched_chicks: '', culled_chicks: '0',
    std_chicks: '', unhatched: '', rejects: '0',
    chicks_sold: '', chick_rate: '', remarks: ''
  }
  const [form, setForm] = useState(emptyForm)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openForm = (row?: any) => {
    if (row) {
      setEditing(row)
      setForm({
        dispatch_id:    row.dispatch_id ?? '',
        flock_id:       row.flock_id ?? '',
        invoice_no:     row.invoice_no ?? '',
        hatchery_name:  row.hatchery_name ?? '',
        setting_no:     row.setting_no ?? '',
        eggs_weight:    row.eggs_weight?.toString() ?? '',
        setting_date:   row.setting_date ?? today(),
        hatch_date:     row.hatch_date ?? '',
        eggs_set:       row.eggs_set?.toString() ?? '',
        broken_transit: row.broken_transit?.toString() ?? '0',
        infertile:      row.infertile?.toString() ?? '0',
        blasters:       row.blasters?.toString() ?? '0',
        hatched_chicks: row.hatched_chicks?.toString() ?? '',
        culled_chicks:  row.culled_chicks?.toString() ?? '0',
        std_chicks:     row.std_chicks?.toString() ?? '',
        unhatched:      row.unhatched?.toString() ?? '',
        rejects:        row.rejects?.toString() ?? '0',
        chicks_sold:    row.chicks_sold?.toString() ?? '',
        chick_rate:     row.chick_rate?.toString() ?? '',
        remarks:        row.remarks ?? ''
      })
    } else {
      setEditing(null)
      setForm({ ...emptyForm, flock_id: flockFilter })
    }
    setShowForm(true)
  }

  // ── derived form values ───────────────────────────────────────────────────────
  const fReceived  = N(form.eggs_set)
  const fBroken    = N(form.broken_transit)
  const fSetting   = fReceived - fBroken
  const fInf       = N(form.infertile)
  const fBlst      = N(form.blasters)
  const fFertile   = fSetting - fInf
  const fHatched   = N(form.hatched_chicks)
  const fCulled    = N(form.culled_chicks)
  const fRejects   = N(form.rejects)
  const fStd       = N(form.std_chicks) || (fHatched - fCulled - fRejects)
  const fUnhatch   = N(form.unhatched)
  const fHatchEggs = fSetting - fInf - fBlst  // eggs that should hatch
  const autoStd    = fHatched > 0 ? fHatched - fCulled - fRejects : 0

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.setting_date) throw new Error('Setting date required')
      let flockId = form.flock_id
      if (!flockId && form.dispatch_id) {
        const d = dispatches?.find((d: any) => d.id === form.dispatch_id)
        flockId = d?.flock_id ?? ''
      }
      const settingVal = fSetting
      const fertileVal = fFertile || null
      const stdVal     = N(form.std_chicks) || autoStd || null
      const payload = {
        dispatch_id:      form.dispatch_id || null,
        flock_id:         flockId || null,
        invoice_no:       form.invoice_no || null,
        hatchery_name:    form.hatchery_name || null,
        setting_no:       form.setting_no || null,
        eggs_weight:      F(form.eggs_weight) || null,
        setting_date:     form.setting_date,
        hatch_date:       form.hatch_date || null,
        eggs_set:         N(form.eggs_set) || null,
        broken_transit:   fBroken,
        infertile:        fInf,
        blasters:         fBlst,
        fertile_eggs:     fertileVal,
        hatched_chicks:   N(form.hatched_chicks) || null,
        culled_chicks:    fCulled,
        std_chicks:       stdVal,
        unhatched:        N(form.unhatched) || null,
        rejects:          fRejects,
        chicks_sold:      N(form.chicks_sold) || null,
        chick_rate:       F(form.chick_rate) || null,
        chick_amount:     N(form.chicks_sold) * F(form.chick_rate) || null,
        remarks:          form.remarks || null,
        fertility_pct:    fertileVal && N(form.eggs_set) ? p2(fertileVal / N(form.eggs_set) * 100) : null,
        hatchability_pct: stdVal && fHatchEggs > 0 ? p2(stdVal / fHatchEggs * 100) : null,
      }
      if (editing) {
        const { error } = await supabase.from('hatch_batches').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('hatch_batches').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Saved!')
      qc.invalidateQueries({ queryKey: ['hatch_batches'] })
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  // ── bulk delete ──────────────────────────────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('hatch_batches').delete().in('id', [...sel])
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(`Deleted ${sel.size} batch(es)`)
      qc.invalidateQueries({ queryKey: ['hatch_batches'] })
      setSel(new Set()); setDelConfirm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  // ── single delete ────────────────────────────────────────────────────────────
  const delOneMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hatch_batches').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Batch deleted')
      qc.invalidateQueries({ queryKey: ['hatch_batches'] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  // ── import ───────────────────────────────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    e.target.value = ''
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
    if (!rows.length) { toast.error('No data found in file'); return }

    const flockMap = Object.fromEntries((flocks ?? []).map((f: any) => [String(f.flock_no), f.id]))
    const parsed = rows.map((r: any) => {
      const flockNo = String(r['Flock No'] ?? '').replace(/^F-/i, '').trim()
      const flockId = flockMap[flockNo] ?? null
      const parseDate = (v: any) => {
        if (!v) return null
        const s = String(v)
        const [d, m, y] = s.includes('/') ? s.split('/') : [null, null, null]
        if (d && m && y) return `${y.padStart(4,'20')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
        return null
      }
      return {
        flock_id:       flockId,
        invoice_no:     r['Invoice No'] ? String(r['Invoice No']) : null,
        hatchery_name:  r['Hatchery Name'] ? String(r['Hatchery Name']) : null,
        setting_no:     r['Setting No'] ? String(r['Setting No']) : null,
        eggs_weight:    parseFloat(r['Eggs Weight']) || null,
        setting_date:   parseDate(r['Setting Date (DD/MM/YYYY)']) ?? today(),
        hatch_date:     parseDate(r['Hatch Date (DD/MM/YYYY)']) ?? null,
        eggs_set:       parseInt(r['Received']) || null,
        broken_transit: parseInt(r['Broken in Transit']) || 0,
        infertile:      parseInt(r['Infertile']) || 0,
        blasters:       parseInt(r['Blasters']) || 0,
        hatched_chicks: parseInt(r['Hatched Chicks']) || null,
        culled_chicks:  parseInt(r['Culled Chicks']) || 0,
        // std_chicks derived = hatched − culled − rejects
        std_chicks:     ((parseInt(r['Hatched Chicks']) || 0) - (parseInt(r['Culled Chicks']) || 0) - (parseInt(r['Rejects']) || 0)) || null,
        unhatched:      parseInt(r['Unhatched']) || null,
        rejects:        parseInt(r['Rejects']) || 0,
        chicks_sold:    parseInt(r['Chicks Sold']) || null,
        chick_rate:     parseFloat(r['Chick Rate']) || null,
        remarks:        r['Remarks'] ? String(r['Remarks']) : null,
      }
    })
    const { error } = await supabase.from('hatch_batches').insert(parsed)
    if (error) toast.error(`Import failed: ${error.message}`)
    else { toast.success(`Imported ${parsed.length} batches`); qc.invalidateQueries({ queryKey: ['hatch_batches'] }) }
  }

  // ── display state ─────────────────────────────────────────────────────────────
  const flockOptions    = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const dispatchOptions = (dispatches ?? []).map((d: any) => ({
    value: d.id,
    label: `${d.invoice_no ? d.invoice_no + ' — ' : d.dc_no ? 'DC-' + d.dc_no + ' — ' : ''}${fmtDate(d.dispatch_date)} (${d.total_dispatched?.toLocaleString('en-IN')} eggs) F-${d.flocks?.flock_no}`
  }))

  const pipeline  = (batches ?? []).filter((b: any) => !b.hatched_chicks && b.setting_date)
  const completed = (batches ?? []).filter((b: any) => b.hatched_chicks)
  const displayed = tab === 'pipeline' ? pipeline : (batches ?? [])

  const totalEggsSet    = completed.reduce((s: number, b: any) => s + (b.eggs_set ?? 0), 0)
  const totalHatched    = completed.reduce((s: number, b: any) => s + (b.std_chicks ?? (b.hatched_chicks ?? 0)), 0)
  const avgFertility    = completed.filter((b: any) => b.fertility_pct).length
    ? completed.reduce((s: number, b: any) => s + (b.fertility_pct ?? 0), 0) / completed.filter((b: any) => b.fertility_pct).length : 0
  const avgHatch        = completed.filter((b: any) => b.hatchability_pct).length
    ? completed.reduce((s: number, b: any) => s + (b.hatchability_pct ?? 0), 0) / completed.filter((b: any) => b.hatchability_pct).length : 0

  const allSel = displayed.length > 0 && displayed.every((b: any) => sel.has(b.id))
  const toggleAll = () => {
    if (allSel) setSel(new Set())
    else setSel(new Set(displayed.map((b: any) => b.id)))
  }

  // ── UI helper ─────────────────────────────────────────────────────────────────
  const pctCell = (v: number) => v > 0 ? `${v}%` : '—'

  return (
    <div className="space-y-5">
      <SectionHeader title="Hatch Batches"
        subtitle="Link dispatched invoices to hatchery settings and record hatch reports"
        action={
          <div className="flex gap-2">
            {sel.size > 0 && (
              <Button variant="danger" icon={<Trash2 size={15}/>} onClick={() => setDelConfirm(true)}>
                Delete ({sel.size})
              </Button>
            )}
            <Button variant="secondary" icon={<FileDown size={15}/>} onClick={downloadTemplate}>Template</Button>
            <Button variant="secondary" icon={<Upload size={15}/>} onClick={() => fileRef.current?.click()}>Import</Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            {(batches?.length ?? 0) > 0 && (
              <Button variant="secondary" icon={<Download size={15}/>} onClick={() => exportExcel(displayed)}>Export</Button>
            )}
            <Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Batch</Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([['batches','All Batches'],['pipeline','Pipeline (Awaiting Hatch)']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===t?'border-brand-600 text-brand-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}{t==='pipeline' && pipeline.length > 0 && <span className="ml-1.5 bg-orange-100 text-orange-700 text-xs px-1.5 rounded-full">{pipeline.length}</span>}
          </button>
        ))}
      </div>

      <div className="flex gap-3 items-end">
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
        {flockFilter && <Button variant="ghost" size="sm" onClick={() => setFlockFilter('')}>Clear</Button>}
      </div>

      {completed.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Eggs Set" value={totalEggsSet.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-brand-600"/>
          <StatCard title="Std Chicks Hatched" value={totalHatched.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-green-600"/>
          <StatCard title="Avg Fertility" value={`${avgFertility.toFixed(1)}%`} icon={<Egg size={18}/>} color={avgFertility > 90 ? 'text-green-600' : 'text-orange-500'}/>
          <StatCard title="Avg Hatchability" value={`${avgHatch.toFixed(1)}%`} icon={<Egg size={18}/>} color={avgHatch > 80 ? 'text-green-600' : 'text-orange-500'}/>
        </div>
      )}

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '2100px' }}>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 w-8">
                    <input type="checkbox" checked={allSel} onChange={toggleAll} className="w-4 h-4 rounded" />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Flock</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Invoice / DC</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Hatchery</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Setting Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Hatch Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Setting No</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Age@Setting</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Age@Prod</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Egg Age</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Eggs Wt</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Received</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Setting</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Broken</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Broken%</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Inf</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Inf%</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Blst</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Blst%</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Sale Chk</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Hatch%</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Std</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Unhatch</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Unhatch%</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Reject</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Reject%</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Stg×STD%</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">STD-Sale</th>
                  <th className="px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((b: any) => {
                  const r = rowCalc(b)
                  const hasReport = !!b.hatched_chicks
                  const placement = b.flocks?.placement_date ?? b.he_dispatch?.flocks?.placement_date ?? null
                  const ageAtSetting = ageDays(placement, b.setting_date)
                  // Flock age at avg production date + egg age (avg prod → setting)
                  const avgProdMs = b.dispatch_id ? dispatchAvgProd?.[b.dispatch_id] : null
                  const avgProdDate = avgProdMs ? new Date(avgProdMs).toISOString().slice(0,10) : null
                  const ageAtProd = ageDays(placement, avgProdDate ?? b.setting_date)
                  const eggAgeDays = avgProdDate && b.setting_date
                    ? Math.round((new Date(b.setting_date).getTime() - new Date(avgProdDate).getTime()) / 86400000)
                    : null
                  const isSelected = sel.has(b.id)
                  return (
                    <tr key={b.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${!hasReport ? 'bg-yellow-50' : ''} ${isSelected ? '!bg-blue-50' : ''}`}>
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={isSelected}
                          onChange={e => {
                            const next = new Set(sel)
                            e.target.checked ? next.add(b.id) : next.delete(b.id)
                            setSel(next)
                          }} className="w-4 h-4 rounded" />
                      </td>
                      <td className="px-3 py-2"><Badge color="green">F-{b.flocks?.flock_no ?? b.he_dispatch?.flocks?.flock_no}</Badge></td>
                      <td className="px-3 py-2 text-xs">
                        {b.invoice_no
                          ? <span className="font-medium text-blue-700">{b.invoice_no}</span>
                          : b.he_dispatch?.invoice_no
                            ? <span className="font-medium text-blue-700">{b.he_dispatch.invoice_no}</span>
                            : b.he_dispatch?.dc_no ? `DC-${b.he_dispatch.dc_no}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{b.hatchery_name ?? '—'}</td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{fmtDate(b.setting_date)}</td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                        {b.hatch_date ? fmtDate(b.hatch_date) : <span className="text-orange-400">Awaiting</span>}
                      </td>
                      <td className="px-3 py-2 text-xs">{b.setting_no ?? '—'}</td>
                      <td className="px-3 py-2 text-xs text-center text-blue-600 font-medium">{ageLabel(ageAtSetting)}</td>
                      <td className="px-3 py-2 text-xs text-center text-purple-600 font-medium">{ageLabel(ageAtProd)}</td>
                      <td className="px-3 py-2 text-xs text-center text-orange-600 font-medium">{eggAgeDays != null ? `${eggAgeDays}d` : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right">{b.eggs_weight ?? '—'}</td>
                      <td className="px-3 py-2 text-xs text-right font-medium">{r.received > 0 ? r.received.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right">{r.setting > 0 ? r.setting.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right">{r.broken > 0 ? r.broken : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right text-orange-600">{r.broken > 0 ? pctCell(r.brokenPct) : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right">{r.inf > 0 ? r.inf : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right text-orange-600">{r.inf > 0 ? pctCell(r.infPct) : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right">{r.blst > 0 ? r.blst : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right text-orange-600">{r.blst > 0 ? pctCell(r.blstPct) : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right">{r.saleChk > 0 ? r.saleChk.toLocaleString('en-IN') : '—'}</td>
                      <td className={`px-3 py-2 text-xs text-right font-semibold ${r.hatchPct >= 80 ? 'text-green-600' : r.hatchPct > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {r.hatchPct > 0 ? pctCell(r.hatchPct) : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-right font-medium text-green-700">{r.std > 0 ? r.std.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right">{r.unhatch > 0 ? r.unhatch : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right text-orange-600">{r.unhatch > 0 ? pctCell(r.unhatchPct) : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right">{r.reject > 0 ? r.reject : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right text-red-500">{r.reject > 0 ? pctCell(r.rejectPct) : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right">{r.stdBySetting > 0 ? r.stdBySetting.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right">{r.std > 0 ? r.stdMinusSale.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => openForm(b)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600">
                            <Edit2 size={13}/>
                          </button>
                          <button onClick={() => { if (confirm('Delete this hatch batch? This cannot be undone.')) delOneMut.mutate(b.id) }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {displayed.length === 0 && (
            <EmptyState icon={<Egg size={32}/>} title={tab === 'pipeline' ? 'No batches awaiting hatch' : 'No hatch batches yet'}
              action={<Button onClick={() => openForm()} icon={<Plus size={16}/>}>Add Batch</Button>}
            />
          )}
        </Card>
      )}

      {/* Delete confirm */}
      <Modal open={delConfirm} onClose={() => setDelConfirm(false)} title="Delete Batches" size="sm"
        footer={
          <><Button variant="secondary" onClick={() => setDelConfirm(false)}>Cancel</Button>
          <Button variant="danger" loading={deleteMut.isPending} onClick={() => deleteMut.mutate()}>
            Delete {sel.size} batch(es)
          </Button></>
        }>
        <p className="text-sm text-gray-700">Are you sure you want to delete {sel.size} hatch batch(es)? This cannot be undone.</p>
      </Modal>

      {/* Entry form */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editing ? 'Edit Hatch Batch' : 'New Hatch Batch'} size="xl"
        footer={
          <><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>{editing ? 'Update' : 'Save'}</Button></>
        }>
        <div className="space-y-4">
          <FormRow cols={3}>
            <Select label="Flock" placeholder="— Select or auto from invoice —" options={flockOptions}
              value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
            <Input label="Hatchery Name" placeholder="e.g. Hitech Hatch Fresh Pvt Ltd"
              value={form.hatchery_name} onChange={e => s('hatchery_name', e.target.value)} />
            <Input label="Setting No" placeholder="e.g. S-2026-01"
              value={form.setting_no} onChange={e => s('setting_no', e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Link Dispatch Invoice" placeholder="— Select invoice (optional) —"
              options={dispatchOptions} value={form.dispatch_id}
              onChange={e => {
                s('dispatch_id', e.target.value)
                const d = dispatches?.find((d: any) => d.id === e.target.value)
                if (d) {
                  if (d.invoice_no) s('invoice_no', d.invoice_no)
                  if (d.flock_id)   s('flock_id', d.flock_id)
                  if (d.total_dispatched) s('eggs_set', d.total_dispatched.toString())
                }
              }} />
            <Input label="Invoice No (override)" placeholder="INV-2026-001"
              value={form.invoice_no} onChange={e => s('invoice_no', e.target.value)} />
          </FormRow>
          <FormRow cols={3}>
            <DateInput label="Setting Date *" required value={form.setting_date}
              onChange={e => s('setting_date', e.target.value)} />
            <DateInput label="Hatch Date" value={form.hatch_date}
              onChange={e => s('hatch_date', e.target.value)} />
            <Input label="Eggs Weight (kg/g)" type="number" step="0.01" value={form.eggs_weight}
              onChange={e => s('eggs_weight', e.target.value)} />
          </FormRow>

          <Divider label="Setting Details" />
          <FormRow cols={3}>
            <Input label="Received (Total from Farm)" type="number" value={form.eggs_set}
              onChange={e => s('eggs_set', e.target.value)} />
            <Input label="Broken in Transit" type="number" value={form.broken_transit}
              onChange={e => s('broken_transit', e.target.value)} />
            <div className="flex items-end pb-1">
              {fSetting > 0 && (
                <p className="text-sm bg-blue-50 text-blue-700 rounded px-3 py-2 w-full">
                  Setting: <strong>{fSetting.toLocaleString('en-IN')}</strong>
                  {fBroken > 0 && <span className="text-xs ml-2">Broken% {pct2(fBroken, fReceived).toFixed(1)}%</span>}
                </p>
              )}
            </div>
          </FormRow>

          <Divider label="Hatch Report (fill after hatch)" />
          <FormRow cols={4}>
            <Input label="Infertile" type="number" value={form.infertile}
              onChange={e => s('infertile', e.target.value)}
              hint={fSetting > 0 && fInf > 0 ? `${pct2(fInf, fSetting).toFixed(1)}%` : ''} />
            <Input label="Blasters" type="number" value={form.blasters}
              onChange={e => s('blasters', e.target.value)}
              hint={fSetting > 0 && fBlst > 0 ? `${pct2(fBlst, fSetting).toFixed(1)}%` : ''} />
            <Input label="Hatched (Total)" type="number" value={form.hatched_chicks}
              onChange={e => {
                s('hatched_chicks', e.target.value)
                const h = parseInt(e.target.value) || 0
                const autoS = h - fCulled - fRejects
                if (autoS >= 0) s('std_chicks', autoS.toString())
              }} />
            <Input label="Culled Chicks" type="number" value={form.culled_chicks}
              onChange={e => {
                s('culled_chicks', e.target.value)
                const c = parseInt(e.target.value) || 0
                const autoS = fHatched - c - fRejects
                if (autoS >= 0) s('std_chicks', autoS.toString())
              }} />
          </FormRow>
          <FormRow cols={4}>
            <Input label="Std Chicks (auto)" type="number" value={form.std_chicks}
              onChange={e => s('std_chicks', e.target.value)}
              hint={autoStd > 0 && !form.std_chicks ? `Auto: ${autoStd}` : ''} />
            <Input label="Unhatched" type="number" value={form.unhatched}
              onChange={e => s('unhatched', e.target.value)}
              hint={fSetting > 0 && N(form.unhatched) > 0 ? `${pct2(N(form.unhatched), fSetting).toFixed(1)}%` : ''} />
            <Input label="Rejects" type="number" value={form.rejects}
              onChange={e => {
                s('rejects', e.target.value)
                const r = parseInt(e.target.value) || 0
                const autoS = fHatched - fCulled - r
                if (autoS >= 0) s('std_chicks', autoS.toString())
              }}
              hint={fSetting > 0 && fRejects > 0 ? `${pct2(fRejects, fSetting).toFixed(1)}%` : ''} />
            <div />
          </FormRow>

          <Divider label="Chick Sales" />
          <FormRow cols={3}>
            <Input label="Chicks Sold" type="number" value={form.chicks_sold}
              onChange={e => s('chicks_sold', e.target.value)} />
            <Input label="Chick Rate (₹/chick)" type="number" step="0.01" value={form.chick_rate}
              onChange={e => s('chick_rate', e.target.value)}
              hint={form.chicks_sold && form.chick_rate ? `Revenue: ₹${(N(form.chicks_sold)*F(form.chick_rate)).toLocaleString('en-IN')}` : ''} />
            <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
          </FormRow>

          {fSetting > 0 && (
            <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700 flex gap-6 flex-wrap">
              {fInf > 0 && <span>Inf%: <strong>{pct2(fInf, fSetting).toFixed(1)}%</strong></span>}
              {fBlst > 0 && <span>Blst%: <strong>{pct2(fBlst, fSetting).toFixed(1)}%</strong></span>}
              {fHatched > 0 && (
                <>
                  <span>Std: <strong>{fStd.toLocaleString('en-IN')}</strong></span>
                  {fHatchEggs > 0 && <span>Hatch%: <strong>{pct2(fStd, fHatchEggs).toFixed(1)}%</strong></span>}
                  {N(form.unhatched) > 0 && <span>Unhatch%: <strong>{pct2(N(form.unhatched), fSetting).toFixed(1)}%</strong></span>}
                </>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
