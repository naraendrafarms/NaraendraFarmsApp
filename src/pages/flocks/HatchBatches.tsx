import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { fmtDate, today, pct, fetchAllPages, AGE_BANDS, SEASONS, flockAgeWeeksAt, inAgeBand, inSeason } from '@/lib/utils'
import { useFarmScope } from '@/lib/useFarmScope'
import { useFormDraft } from '@/hooks/useFormDraft'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState, StatCard, Divider
, DateInput, SearchableSelect } from '@/components/ui'
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
  // Hatch % is chicks sold ÷ setting eggs — the farm's own definition. It used
  // to be std ÷ (setting − infertile − blasters), which is a different figure
  // and never matched the hatchery's sheet.
  const hatchPct = pct2(saleChk, setting)
  // STD Hatch % is NOT calculated — it is typed in from the hatchery report.
  const stdHatchPct = b.std_hatch_pct ?? null
  const stdPct   = pct2(std, setting)
  // Actual Std — the chicks the hatchery's own report accounts for, hatched
  // less culled less rejected. This column used to be Setting × STD%, which
  // became a duplicate of Std the moment STD Hatch % started driving Std
  // (both were setting × the same percentage). The gap between the two is the
  // figure worth seeing on the row.
  const actualStd = hatched > 0 ? Math.max(0, hatched - (b.culled_chicks ?? 0) - reject) : null
  return {
    received, broken, setting, inf, fertile,
    blst, hatched, std, unhatch, reject, saleChk,
    brokenPct:  pct2(broken, received),
    infPct:     pct2(inf, setting),
    blstPct:    pct2(blst, setting),
    unhatchPct: pct2(unhatch, setting),
    rejectPct:  pct2(reject, setting),
    hatchPct,   stdHatchPct, stdPct, actualStd,
    // Sale Chk − Std: chicks actually received against what the STD Hatch %
    // expected. Negative = short received, positive = more than expected. It
    // used to be the other way round (Std − Sale), which showed a shortfall as
    // a positive number.
    stdMinusSale: saleChk - std,
  }
}

// ── Excel export ─────────────────────────────────────────────────────────────
function exportExcel(rows: any[]) {
  const data = rows.map((b: any) => {
    const r = rowCalc(b)
    return {
      'Flock':          `F-${b.flocks?.flock_no ?? b.he_dispatch?.flocks?.flock_no ?? ''}`,
      'Invoice/DC':     b.invoice_no ?? b.he_dispatch?.invoice_no ?? (b.he_dispatch?.dc_no ? `DC-${b.he_dispatch.dc_no}` : ''),
      'Hatchery':       b.hatcheries?.name ?? b.hatchery_name ?? '',
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
      'STD Hatch%':     r.stdHatchPct ?? '',
      'Std':            r.std,
      'Unhatch':        r.unhatch,
      'Unhatch%':       r.unhatchPct,
      'Reject':         r.reject,
      'Reject%':        r.rejectPct,
      'Actual Std':     r.actualStd ?? '',
      'Sale−STD Chicks': r.stdMinusSale,
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
  // 'Hatchery Name' must match a name in Masters → Hatcheries to be linked;
  // 'STD Hatch %' is the figure off the hatchery report and sets Std Chicks
  // (setting eggs × the percentage). Leave it blank and Std falls back to
  // Hatched − Culled − Rejects.
  const headers = [['Flock No','Invoice No','DC No','Hatchery Name','Setting No',
    'Setting Date (DD/MM/YYYY)','Hatch Date (DD/MM/YYYY)','Eggs Weight',
    'Received','Broken in Transit','Infertile','Blasters','Hatched Chicks',
    'Culled Chicks','STD Hatch %','Unhatched','Rejects','Chicks Sold','Chick Rate','Remarks']]
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
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [hatcheryFilter, setHatcheryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [belowOnly, setBelowOnly] = useState(false)
  const [ageBand, setAgeBand] = useState('')
  const [season, setSeason] = useState('')
  const [tab, setTab]               = useState<'batches'|'pipeline'|'hatchery'>('batches')
  const [sel, setSel]               = useState<Set<string>>(new Set())
  const [delConfirm, setDelConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,placement_date,laying_season').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q; return data ?? []
    }
  })

  // The hatchery master. Every hatchery dropdown on this page reads this table —
  // no hatchery is named anywhere in the code, including Hitech. Add them under
  // Masters → Hatcheries.
  const { data: hatcheries } = useQuery({
    queryKey: ['hatcheries'],
    queryFn: async () => {
      const { data } = await supabase.from('hatcheries')
        .select('id,name,provides_hatch_report').order('name')
      return data ?? []
    }
  })

  const { data: dispatches } = useQuery({
    queryKey: ['he_dispatch_for_hatch', flockFilter],
    queryFn: async () => {
      // Paged, not capped. The Pipeline must show every dispatch that has no
      // hatch report — a cap would hide exactly the oldest ones, which are the
      // ones most overdue.
      return fetchAllPages<any>((from, to) => {
        let q = supabase.from('he_dispatch')
          .select('id,dispatch_date,invoice_no,dc_no,total_dispatched,flock_id,hatchery_id,flocks(flock_no),hatcheries(name,provides_hatch_report)')
          .order('dispatch_date', { ascending: false }).order('id').range(from, to)
        if (flockFilter) q = q.eq('flock_id', flockFilter)
        return q
      }, 'HE dispatches for hatch batches', (m) => toast.error(m))
    }
  })

  // Assign the hatchery to a dispatch after the fact. At loading time nobody
  // knows where the lorry is going, so this is set later — from here.
  const assignHatchery = useMutation({
    mutationFn: async ({ id, hatchery_id }: { id: string; hatchery_id: string }) => {
      const { error } = await supabase.from('he_dispatch')
        .update({ hatchery_id: hatchery_id || null }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Hatchery updated')
      qc.invalidateQueries({ queryKey: ['he_dispatch_for_hatch'] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  // The Vencobb430 hatchability standard, by flock age and laying season. Used
  // only to SUGGEST STD Hatch % when the box is empty — measured across all 394
  // existing batches, what was being typed by hand already matched this within
  // 0.23 of a point on average, so the suggestion saves typing rather than
  // changing anything.
  const { data: hatchStd = [] } = useQuery({
    queryKey: ['breed_standard_hatch'],
    queryFn: async () => {
      const { data } = await supabase.from('breed_standard')
        .select('season,week_of_age,hatchability_pct')
        .eq('sex', 'Female').eq('phase', 'Laying')
      return data ?? []
    }
  })

  const { data: batches, isLoading } = useQuery({
    queryKey: ['hatch_batches', flockFilter],
    queryFn: async () => {
      // Was .limit(200). With 395 batches that silently dropped half the
      // history from the table, the TOTAL row, the four stat cards, the
      // Hatchery Comparison and the Excel export — every figure on the page
      // described only the 200 most recent settings, with nothing saying so.
      return fetchAllPages<any>((from, to) => {
        let q = supabase.from('hatch_batches')
          .select('*, hatcheries(name), he_dispatch(dispatch_date,invoice_no,dc_no,total_dispatched,flocks(flock_no,placement_date)), flocks(flock_no,placement_date)')
          .order('setting_date', { ascending: false }).order('id').range(from, to)
        if (flockFilter) q = q.eq('flock_id', flockFilter)
        return q
      }, 'Hatch batches', (m) => toast.error(m))
    }
  })

  // How much of each dispatch is already set. Read across ALL batches, not the
  // filtered list, because how many eggs are left in an invoice cannot depend on
  // which flock the page happens to be showing.
  const { data: allocRows = [] } = useQuery({
    queryKey: ['hatch_alloc_all'],
    queryFn: async () => fetchAllPages<any>((from, to) => supabase.from('hatch_batches')
      .select('id,dispatch_id,eggs_set').not('dispatch_id', 'is', null)
      .order('id').range(from, to), 'Hatch batch allocation'),
  })
  const usedByDispatch = React.useMemo(() => {
    const m: Record<string, number> = {}
    for (const b of (allocRows as any[])) {
      if (!b.dispatch_id) continue
      m[b.dispatch_id] = (m[b.dispatch_id] ?? 0) + (Number(b.eggs_set) || 0)
    }
    return m
  }, [allocRows])

  // Dispatch lines are needed for two things now: the egg age / flock-age-at-
  // production of batches that ARE linked, and the production-date range shown
  // against each candidate in the link dropdown, so choosing the right dispatch
  // does not mean opening another page.
  const dispatchIds = [...new Set([
    ...(batches ?? []).map((b: any) => b.dispatch_id),
    ...(dispatches ?? []).map((d: any) => d.id),
  ].filter(Boolean))]
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
  // And the first/last production date on each dispatch, shown against the
  // candidates in the dropdown — Flock 20's dispatches around one setting date
  // span nearly four weeks of production, so which one is picked moves Egg Age
  // by up to 27 days.
  const dispatchProdRange: Record<string, { min: string; max: string }> = {}
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
      const r = dispatchProdRange[l.dispatch_id]
      if (!r) dispatchProdRange[l.dispatch_id] = { min: l.prod_date, max: l.prod_date }
      else {
        if (l.prod_date < r.min) r.min = l.prod_date
        if (l.prod_date > r.max) r.max = l.prod_date
      }
    }
    for (const [id, g] of Object.entries(groups)) {
      dispatchAvgProd[id] = g.sumMs / g.count
    }
  }

  // ── form state ───────────────────────────────────────────────────────────────
  const emptyForm = {
    dispatch_id: '', flock_id: flockFilter, invoice_no: '',
    hatchery_id: '', std_hatch_pct: '',
    hatchery_name: '', setting_no: '', eggs_weight: '',
    setting_date: today(), hatch_date: '',
    eggs_set: '', broken_transit: '0', infertile: '0',
    blasters: '0', hatched_chicks: '', culled_chicks: '0',
    std_chicks: '', unhatched: '', rejects: '0',
    chicks_sold: '', chick_rate: '', remarks: ''
  }
  const [form, setForm] = useState(emptyForm)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  React.useEffect(() => {
    if (!showForm) return
    saveDraft(form)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, showForm])
  // Once Std Chicks is typed in by hand, nothing may overwrite it. The old form
  // recomputed it on every keystroke in Hatched / Culled / Rejects, so a figure
  // taken off the hatchery's report was silently replaced by a subtraction.
  const [stdTouched, setStdTouched] = useState(false)
  // Whether the user has explicitly touched the Link Dispatch Invoice field
  // this time round — picked one, or deliberately cleared it. Until they do,
  // the auto-link suggestion is free to fill it in; once they do, their
  // choice (including "none") stands, and auto-link never overrides it again.
  const [linkTouched, setLinkTouched] = useState(false)
  // Draft autosave -- keyed to the batch being edited, or 'new' for a fresh
  // entry. A restored draft still goes through the normal Save button and its
  // normal validation, so it can never slip into the table as a duplicate;
  // the draft itself is deleted the moment that real save succeeds.
  const draftKey = editing?.id ?? 'new'
  const { draft, draftChecked, saveDraft, clearDraft } = useFormDraft('hatch_batches', draftKey, showForm)
  const [draftDismissed, setDraftDismissed] = useState(false)
  // STD Hatch % OWNS Std Chicks: Std = Setting × STD Hatch % ÷ 100, on the
  // setting-eggs base. So the subtraction (Hatched − Culled − Rejects) only
  // fills the box while STD Hatch % is blank — otherwise the two would fight
  // and whichever was typed last would win, which is how the old form lost
  // figures taken off the hatchery report.
  const setStdAuto = (v: number) => {
    if (form.std_hatch_pct.trim() !== '') return
    if (!stdTouched && v >= 0) s('std_chicks', v.toString())
  }
  const stdFromPct = (pctStr: string, setting: number) =>
    pctStr.trim() !== '' && setting > 0 ? Math.round(setting * F(pctStr) / 100) : null

  const openForm = (row?: any) => {
    setStdTouched(!!row?.std_chicks)
    setLinkTouched(false)
    setDraftDismissed(false)
    if (row) {
      setEditing(row)
      setForm({
        dispatch_id:    row.dispatch_id ?? '',
        flock_id:       row.flock_id ?? '',
        invoice_no:     row.invoice_no ?? '',
        hatchery_id:    row.hatchery_id ?? '',
        std_hatch_pct:  row.std_hatch_pct?.toString() ?? '',
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
  // Standard hatchability for the flock's age on the SETTING date. Age is in
  // whole weeks from placement, because the book is published per week.
  const stdHatchForForm = (() => {
    const fl = flocks?.find((f: any) => f.id === form.flock_id)
    if (!fl?.placement_date || !form.setting_date || !fl.laying_season) return null
    const wk = Math.round((new Date(form.setting_date + 'T00:00:00').getTime()
      - new Date(fl.placement_date + 'T00:00:00').getTime()) / 86400000 / 7)
    const row = (hatchStd as any[]).find((r: any) => r.season === fl.laying_season && r.week_of_age === wk)
    return row?.hatchability_pct != null ? { pct: Number(row.hatchability_pct), wk, season: fl.laying_season } : null
  })()

  // On a NEW batch, fill STD Hatch % from the standard as soon as the flock and
  // setting date are known. Only ever when the box is empty and only when
  // adding: editing an existing batch leaves its figure exactly as saved, so
  // none of the 394 already entered can be rewritten by this.
  React.useEffect(() => {
    if (!showForm || editing) return
    if (form.std_hatch_pct.trim() !== '') return
    if (!stdHatchForForm) return
    s('std_hatch_pct', String(stdHatchForForm.pct))
    const derived = stdFromPct(String(stdHatchForForm.pct), fSetting)
    if (derived != null) { setStdTouched(false); s('std_chicks', derived.toString()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm, editing, form.flock_id, form.setting_date, stdHatchForForm?.pct, fSetting])

  const fStd       = N(form.std_chicks) || (fHatched - fCulled - fRejects)
  const fUnhatch   = N(form.unhatched)
  const fHatchEggs = fSetting - fInf - fBlst  // eggs that should hatch
  const autoStd    = fHatched > 0 ? fHatched - fCulled - fRejects : 0

  // Std cannot exceed the eggs that actually became chicks. The Paridhi batch
  // is why this exists: 570 infertile + 307 blasters + 1,474 unhatched leaves
  // 7,620 eggs hatched out of 9,971 set, yet an entered 85.5% produced a Std of
  // 8,525 — 905 chicks that never existed. The percentage was on some base
  // other than setting eggs, and nothing on the screen said so.
  const eggsHatched = fUnhatch > 0 ? fHatchEggs - fUnhatch
    : (fHatched > 0 ? fHatched : null)
  // Std sitting above the chicks that hatched is NOT an error — Std is the
  // standard the batch was measured against, so falling short of it is ordinary
  // performance (372 of the 394 imported batches do). Only a Std above the
  // hatchable eggs is genuinely impossible; that is the one worth stopping on.
  // Short-of-standard gets a plain, non-alarming note instead.
  const stdWarning: string | null = (() => {
    if (fStd <= 0) return null
    if (fHatchEggs > 0 && fStd > fHatchEggs)
      return `Std Chicks (${fStd.toLocaleString('en-IN')}) is more than the hatchable eggs (${fHatchEggs.toLocaleString('en-IN')} = setting − infertile − blasters), which cannot happen. Check the STD Hatch %.`
    return null
  })()
  const belowStd: string | null = (!stdWarning && fStd > 0 && eggsHatched != null && eggsHatched > 0 && fStd > eggsHatched)
    ? `Below standard by ${(fStd - eggsHatched).toLocaleString('en-IN')} chicks — ${eggsHatched.toLocaleString('en-IN')} hatched against a standard of ${fStd.toLocaleString('en-IN')}.`
    : null

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.setting_date) throw new Error('Setting date required')
      // Basic sanity guards — negatives here silently corrupted every % stat
      if (fBroken > N(form.eggs_set)) throw new Error('Broken-in-transit cannot exceed eggs set')
      if (fHatchEggs > 0 && (N(form.hatched_chicks) + fCulled + fRejects) > fHatchEggs)
        throw new Error('Hatched + culled + rejects cannot exceed hatchable eggs (setting − infertile − blasters)')
      if (form.hatch_date && form.hatch_date < form.setting_date)
        throw new Error('Hatch date cannot be before setting date')
      // A dispatch can feed several settings, but not more eggs than it carried.
      // Without this, linking the same invoice to two full batches records twice
      // the eggs that ever left the farm, and every hatch % after it is measured
      // against eggs that did not exist.
      const linkId = form.dispatch_id || autoLinkMatch?.id || null
      if (linkId) {
        const d = (dispatches ?? []).find((x: any) => x.id === linkId)
        if (d) {
          const { total, used } = remainingOf(d)
          if (total > 0 && N(form.eggs_set) > total - used) {
            throw new Error(
              `This invoice carried ${total.toLocaleString('en-IN')} eggs and ${used.toLocaleString('en-IN')} are already set against it — `
              + `${Math.max(0, total - used).toLocaleString('en-IN')} remain. Reduce Eggs Set, or correct the invoice quantity.`)
          }
        }
      }
      let flockId = form.flock_id
      if (!flockId && form.dispatch_id) {
        const d = dispatches?.find((d: any) => d.id === form.dispatch_id)
        flockId = d?.flock_id ?? ''
      }
      const settingVal = fSetting
      const fertileVal = fFertile || null
      // An entered Std of 0 is a real figure (a total failure), so an empty box
      // is the only thing that falls back to the calculation.
      const stdVal     = form.std_chicks.trim() !== '' ? N(form.std_chicks) : (autoStd || null)
      const payload = {
        // Unambiguous match links itself; anything less certain stays null.
        dispatch_id:      form.dispatch_id || autoLinkMatch?.id || null,
        flock_id:         flockId || null,
        invoice_no:       form.invoice_no || null,
        hatchery_id:      form.hatchery_id || null,
        std_hatch_pct:    form.std_hatch_pct.trim() !== '' ? F(form.std_hatch_pct) : null,
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
        // Same denominator as hatchability (post-broken setting count) — was
        // eggs_set (received), understating fertility whenever transit
        // breakage > 0.
        fertility_pct:    fertileVal && settingVal > 0 ? p2(fertileVal / settingVal * 100) : null,
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
      clearDraft(draftKey)
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
    // cellDates: a real Excel date cell arrives as a serial NUMBER without it,
    // and the parser below only ever understood DD/MM/YYYY text — so every date
    // in a normally-typed sheet failed, the setting date fell back to today and
    // the hatch date was dropped entirely.
    const wb = XLSX.read(buf, { cellDates: true })
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
    if (!rows.length) { toast.error('No data found in file'); return }

    const flockMap = Object.fromEntries((flocks ?? []).map((f: any) => [String(f.flock_no), f.id]))
    const parsed = rows.map((r: any) => {
      const flockNo = String(r['Flock No'] ?? '').replace(/^F-/i, '').trim()
      const flockId = flockMap[flockNo] ?? null
      // Three shapes have to be accepted, because a spreadsheet produces all
      // three: a real date cell, an Excel serial number (older files, or a
      // sheet read without cellDates), and DD/MM/YYYY text.
      const iso = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
      const parseDate = (v: any) => {
        if (v === null || v === undefined || v === '') return null
        if (v instanceof Date && !isNaN(v.getTime())) return iso(v)
        if (typeof v === 'number' && isFinite(v)) {
          // Excel day 1 is 01/01/1900, and the sheet format wrongly counts 1900
          // as a leap year — the 25569/86400 offset is the standard correction.
          const dt = new Date(Math.round((v - 25569) * 86400 * 1000))
          return isNaN(dt.getTime()) ? null : iso(dt)
        }
        const str = String(v).trim()
        const [d, m, y] = str.includes('/') ? str.split('/') : [null, null, null]
        // Reject non-4-digit years instead of padStart forcing "1" -> "2001"
        if (d && m && y && /^\d{4}$/.test(y)) return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
        // ISO text, e.g. 2025-09-26
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
        return null
      }
      // Same rules as the form, not a second copy of them: STD Hatch % owns
      // Std Chicks (setting × pct), and the subtraction is used only when the
      // sheet has no percentage. An import used to write a different Std from
      // the same numbers, which is how two screens quietly disagree.
      const received  = parseInt(r['Received']) || 0
      const brokenT   = parseInt(r['Broken in Transit']) || 0
      const setting   = received - brokenT
      const rawPct    = r['STD Hatch %']
      const stdPctVal = rawPct !== undefined && rawPct !== null && String(rawPct).trim() !== ''
        ? parseFloat(rawPct) : null
      const stdFromPctVal = stdPctVal != null && setting > 0
        ? Math.round(setting * stdPctVal / 100) : null
      const stdBySub = Math.max(0, (parseInt(r['Hatched Chicks']) || 0)
        - (parseInt(r['Culled Chicks']) || 0) - (parseInt(r['Rejects']) || 0))
      // Hatchery Name is matched to the master, case- and space-insensitively.
      // An unmatched name is NOT invented as a new hatchery — it stays as text
      // on the row so it is visible and can be corrected.
      const settingD = parseDate(r['Setting Date (DD/MM/YYYY)'])
      const rawHatchD = parseDate(r['Hatch Date (DD/MM/YYYY)'])
      // A hatch date BEFORE the setting date cannot be true — it is the
      // classic day/month flip, where a sheet typed as 05/10/2025 was read by
      // Excel as 10 May. Such a date is dropped rather than stored, and the
      // rows are counted so they can be corrected in the sheet; guessing the
      // flip would be inventing a date the farm never wrote.
      const hatchD = rawHatchD && settingD && rawHatchD < settingD ? null : rawHatchD
      const hName = r['Hatchery Name'] ? String(r['Hatchery Name']).trim() : null
      const hMatch = hName
        ? (hatcheries ?? []).find((h: any) => h.name.toLowerCase().trim() === hName.toLowerCase())
        : null
      return {
        flock_id:       flockId,
        invoice_no:     r['Invoice No'] ? String(r['Invoice No']) : null,
        hatchery_id:    hMatch?.id ?? null,
        std_hatch_pct:  stdPctVal,
        hatchery_name:  hName,
        setting_no:     r['Setting No'] ? String(r['Setting No']) : null,
        eggs_weight:    parseFloat(r['Eggs Weight']) || null,
        // No silent today(). A row whose setting date cannot be read is
        // rejected below and counted, instead of every unreadable row landing
        // on the same made-up date.
        setting_date:   settingD,
        hatch_date:     hatchD,
        // Carried only to count the dropped ones for the message; stripped
        // before insert, since it is not a column.
        __rawHatch:     rawHatchD,
        eggs_set:       parseInt(r['Received']) || null,
        broken_transit: parseInt(r['Broken in Transit']) || 0,
        infertile:      parseInt(r['Infertile']) || 0,
        blasters:       parseInt(r['Blasters']) || 0,
        hatched_chicks: parseInt(r['Hatched Chicks']) || null,
        culled_chicks:  parseInt(r['Culled Chicks']) || 0,
        // STD Hatch % first; otherwise hatched − culled − rejects, clamped at 0
        // so a blank Hatched with nonzero culls can't produce a negative figure
        std_chicks:     stdFromPctVal ?? (stdBySub || null),
        unhatched:      parseInt(r['Unhatched']) || null,
        rejects:        parseInt(r['Rejects']) || 0,
        chicks_sold:    parseInt(r['Chicks Sold']) || null,
        chick_rate:     parseFloat(r['Chick Rate']) || null,
        remarks:        r['Remarks'] ? String(r['Remarks']) : null,
      }
    })
    // Skip rows with no flock match, and rows that duplicate an existing
    // batch — re-importing the same file used to double-book everything.
    const valid = parsed.filter((r: any) => r.flock_id && r.setting_date)
    const noFlock = parsed.filter((r: any) => !r.flock_id).length
    const noDate  = parsed.filter((r: any) => r.flock_id && !r.setting_date).length
    // Counted here so the message can name them: a hatch date earlier than the
    // setting date was dropped above.
    const droppedHatch = parsed.filter((r: any) => r.flock_id && r.setting_date
      && !r.hatch_date && r['__rawHatch']).length
    const { data: existingBatches } = await supabase.from('hatch_batches')
      .select('flock_id,setting_date,hatchery_name')
      .in('flock_id', [...new Set(valid.map((r: any) => r.flock_id))])
    const isDup = (r: any) => (existingBatches ?? []).some((e: any) =>
      e.flock_id === r.flock_id && e.setting_date === r.setting_date && (e.hatchery_name ?? '') === (r.hatchery_name ?? ''))
    const fresh = valid.filter((r: any) => !isDup(r))
    const dups = valid.length - fresh.length
    if (!fresh.length) { toast.error(`Nothing imported — ${dups} duplicate(s), ${noFlock} row(s) with unknown flock`); return }
    // Only a Std above the hatchable eggs is impossible. Std above the chicks
    // that hatched just means the batch came in under its standard, which is
    // normal — flagging that fired on 372 of 394 rows and buried the real fault.
    const impossible = fresh.filter((r: any) => {
      const hatchable = (r.eggs_set ?? 0) - (r.broken_transit ?? 0) - (r.infertile ?? 0) - (r.blasters ?? 0)
      return (r.std_chicks ?? 0) > 0 && hatchable > 0 && r.std_chicks > hatchable
    }).length

    const toInsert = fresh.map(({ __rawHatch, ...row }: any) => row)
    const { error } = await supabase.from('hatch_batches').insert(toInsert)
    if (error) toast.error(`Import failed: ${error.message}`)
    else {
      toast.success(`Imported ${fresh.length} batches${dups ? `, ${dups} duplicate(s) skipped` : ''}${noFlock ? `, ${noFlock} unknown-flock row(s) skipped` : ''}${noDate ? `, ${noDate} row(s) skipped with an unreadable setting date` : ''}`)
      if (droppedHatch > 0) toast.error(
        `${droppedHatch} row(s) had a hatch date BEFORE the setting date — usually a day/month flip in the sheet. Those hatch dates were left blank; fix them in Excel and re-import, or edit the batches.`,
        { duration: 10000 })
      if (impossible > 0) toast.error(
        `${impossible} imported row(s) have a Std higher than the hatchable eggs, which cannot happen — check their STD Hatch %.`,
        { duration: 8000 })
      qc.invalidateQueries({ queryKey: ['hatch_batches'] })
    }
  }

  // ── display state ─────────────────────────────────────────────────────────────
  const flockOptions    = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const hatcheryOptions = (hatcheries ?? []).map((h: any) => ({ value: h.id, label: h.name }))
  // The FILTER list is built from the batches, not from the hatchery master, so
  // that batches carrying only a typed hatchery name — entered before the
  // dropdown existed, or imported with a name that matched nothing — can still
  // be filtered to. A hatchery you cannot select is a hatchery you cannot check.
  const hatcheryFilterOptions = (() => {
    const m = new Map<string, string>()
    for (const b of (batches ?? [])) {
      const key = b.hatchery_id ?? `text:${b.hatchery_name ?? '(not set)'}`
      const label = b.hatcheries?.name ?? b.hatchery_name ?? '(not set)'
      if (!m.has(key)) m.set(key, b.hatchery_id ? label : `${label} (typed)`)
    }
    return [...m].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))
  })()
  // The link dropdown puts the LIKELY dispatches first: same flock as the form,
  // dispatched in the three weeks before the setting date — eggs cannot be set
  // before they are laid. Each carries its production-date range, which is the
  // thing you actually need to pick the right one.
  const dispatchOptionLabel = (d: any) => {
    const rng = dispatchProdRange[d.id]
    return `${d.invoice_no ? d.invoice_no + ' — ' : d.dc_no ? 'DC-' + d.dc_no + ' — ' : ''}`
      + `${fmtDate(d.dispatch_date)} (${d.total_dispatched?.toLocaleString('en-IN')} eggs) F-${d.flocks?.flock_no}`
      + (rng ? ` · prod ${fmtDate(rng.min)}${rng.max !== rng.min ? `–${fmtDate(rng.max)}` : ''}` : '')
  }
  const isCandidate = (d: any) => {
    if (!form.flock_id || d.flock_id !== form.flock_id) return false
    if (!form.setting_date || d.dispatch_date > form.setting_date) return false
    return (new Date(form.setting_date).getTime() - new Date(d.dispatch_date).getTime()) / 86400000 <= 21
  }
  // Eggs of a dispatch not yet set. A dispatch legitimately feeds more than one
  // batch — a lakh eggs get split across hatcheries and settings — so it stays
  // in the list while any remain. Once it is fully set it drops OUT: with a
  // hundred invoices, a list that keeps everything ever sent is a list nobody
  // can read, and every spent invoice in it is one more chance to link the
  // wrong one twice.
  const remainingOf = (d: any) => {
    const total = Number(d.total_dispatched) || 0
    let used = usedByDispatch[d.id] ?? 0
    // The batch being edited must not count against itself, or reopening it
    // would show its own eggs as already spent.
    if (editing?.id) {
      const own = (allocRows as any[]).find((b: any) => b.id === editing.id && b.dispatch_id === d.id)
      if (own) used -= Number(own.eggs_set) || 0
    }
    return { total, used, left: total - used }
  }
  const withRemaining = (d: any) => {
    const { total, used, left } = remainingOf(d)
    const base = dispatchOptionLabel(d)
    if (used <= 0 || total <= 0) return base
    return `${base} · ${used.toLocaleString('en-IN')} set, ${Math.max(0, left).toLocaleString('en-IN')} left`
  }
  // Fully set dispatches are hidden — except the one this batch is already
  // linked to, which must stay selectable or an edit would silently unlink it.
  const selectable = (dispatches ?? []).filter((d: any) =>
    d.id === form.dispatch_id || remainingOf(d).left > 0)
  const dispatchOptions = [
    ...selectable.filter(isCandidate).map((d: any) => ({
      value: d.id, label: `★ ${withRemaining(d)}`
    })),
    ...selectable.filter((d: any) => !isCandidate(d)).map((d: any) => ({
      value: d.id, label: withRemaining(d)
    })),
  ]

  // Auto-link, but only when there is nothing to guess: exactly ONE dispatch of
  // this flock, on or before the setting date, whose quantity equals Received.
  // Two matches, or none, and it stays blank and asks — a 1,00,800-egg dispatch
  // can be split across several hatcheries and settings, so "nearest" would be
  // an assumption dressed up as a fact.
  const autoLinkMatch = (() => {
    if (linkTouched || form.dispatch_id || !form.flock_id || !form.eggs_set) return null
    const want = N(form.eggs_set)
    if (want <= 0) return null
    // Matching on total_dispatched alone would happily propose an invoice
    // that another batch already fully consumed — remainingOf(d).left <= 0 —
    // and the save would then reject it with a confusing "0 remain" error
    // for an invoice the user never chose. Only ever propose one with enough
    // left to actually cover this setting.
    const hits = (dispatches ?? []).filter((d: any) =>
      isCandidate(d) && d.total_dispatched === want && remainingOf(d).left >= want)
    return hits.length === 1 ? hits[0] : null
  })()

  // The date range narrows EVERYTHING that describes the batches — the table,
  // the TOTAL row, the tiles, the Hatchery Comparison and the Excel export all
  // read from these two, so a filtered figure can never sit next to an
  // unfiltered one. Filtered on setting date, the date the table is sorted by.
  // Blank ends are open: a From with no To runs to the newest batch.
  //
  // Hatchery is matched on the LINKED hatchery where there is one and on the
  // typed name where there is not, because batches entered before the dropdown
  // existed carry only text — filtering on hatchery_id alone would hide them.
  //
  // Search covers setting no, invoice and DC together: those are the three
  // numbers a hatchery quotes when it rings up about a batch, and hunting for
  // one of them through 394 rows was the reason this box exists.
  const q = search.trim().toLowerCase()
  const inRange = (batches ?? []).filter((b: any) => {
    if (fromDate && !(b.setting_date && b.setting_date >= fromDate)) return false
    if (toDate   && !(b.setting_date && b.setting_date <= toDate)) return false
    if (hatcheryFilter) {
      const key = b.hatchery_id ?? `text:${b.hatchery_name ?? '(not set)'}`
      if (key !== hatcheryFilter) return false
    }
    if (q) {
      const hay = `${b.setting_no ?? ''} ${b.invoice_no ?? ''} ${b.dc_no ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    // Below-standard only: hatched short of what the STD Hatch % expected.
    // Batches with no hatch report yet cannot be judged, so they drop out.
    if (belowOnly) {
      if (b.hatched_chicks == null) return false
      if ((b.hatched_chicks ?? 0) >= (b.std_chicks ?? 0)) return false
    }
    // Flock age at setting, measured from the flock's placement date.
    if (ageBand && !inAgeBand(ageBand, flockAgeWeeksAt(b.flocks?.placement_date, b.setting_date))) return false
    // Season the eggs were SET in -- see the note on SEASONS in lib/utils.
    if (season && !inSeason(season, b.setting_date)) return false
    return true
  })

  // null/undefined = awaiting hatch; a recorded 0 is a total-failure batch
  // that IS completed (it used to be stuck in "pipeline" forever)
  const completed = inRange.filter((b: any) => b.hatched_chicks != null)
  const displayed = inRange

  // ── the pipeline, rebuilt ────────────────────────────────────────────────────
  // It used to list hatch_batches rows with no hatch report, which meant eggs
  // were invisible until somebody remembered to create a batch by hand — and
  // nobody had: 26 dispatches and 16.4 lakh eggs were nowhere on this page.
  // It now starts from the DISPATCH, so eggs appear the moment they leave.
  const batchedDispatchIds = new Set((batches ?? []).map((b: any) => b.dispatch_id).filter(Boolean))
  const openDispatches = (dispatches ?? []).filter((d: any) => !batchedDispatchIds.has(d.id))
  // Only hatcheries ticked "sends hatchability report" in the master are chased.
  // Nothing here tests for a hatchery by name.
  const awaitingReport = openDispatches.filter((d: any) => d.hatcheries?.provides_hatch_report)
  // Where the lorry went is decided after loading, so these are not errors —
  // they are simply not assigned yet, and must not disappear meanwhile.
  const unassigned     = openDispatches.filter((d: any) => !d.hatchery_id)
  const pipeline       = [...awaitingReport, ...unassigned]

  const daysSince = (d: string) => Math.round((Date.now() - new Date(d).getTime()) / 86400000)

  // ── hatchery-wise comparison ─────────────────────────────────────────────────
  // Grouped on hatchery_id where present, falling back to the old typed name so
  // batches entered before the dropdown existed still appear.
  const byHatchery = (() => {
    const m: Record<string, any> = {}
    for (const b of completed) {
      const key = b.hatchery_id ?? `text:${b.hatchery_name ?? '(not set)'}`
      const name = b.hatcheries?.name ?? b.hatchery_name ?? '(not set)'
      const r = rowCalc(b)
      if (!m[key]) m[key] = { name, batches: 0, received: 0, setting: 0, broken: 0, inf: 0,
                              blst: 0, std: 0, saleChk: 0, reject: 0, unhatch: 0,
                              stdHatchSum: 0, stdHatchWeight: 0, typedOnly: !b.hatchery_id }
      const g = m[key]
      g.batches++; g.received += r.received; g.setting += r.setting; g.broken += r.broken
      g.inf += r.inf; g.blst += r.blst; g.std += r.std; g.saleChk += r.saleChk
      g.reject += r.reject; g.unhatch += r.unhatch
      if (r.stdHatchPct != null) { g.stdHatchSum += r.stdHatchPct * (r.setting || 1); g.stdHatchWeight += (r.setting || 1) }
    }
    return Object.values(m).sort((a: any, b: any) => b.setting - a.setting)
  })()

  // Every headline figure is recomputed from the summed counts, the same way
  // the TOTAL row and the Hatchery Comparison already work. Hatchability used to
  // be an egg-weighted average of the stored hatchability_pct column, which only
  // the entry form ever fills — so all 394 imported batches carried nulls and
  // the card read 0.0%. Reading the counts means a figure can never depend on
  // whether a row was typed or imported.
  const tot = completed.reduce((a: any, b: any) => {
    const r = rowCalc(b)
    a.received += r.received
    a.hatched += r.hatched; a.std += r.std
    return a
  }, { received: 0, hatched: 0, std: 0 })

  const totalEggsSet = tot.received
  const totalStd     = tot.std        // the standard expectation, not chicks
  const totalHatched = tot.hatched    // chicks the hatchery actually hatched
  // Hatchability on the farm's definition: chicks hatched ÷ TOTAL eggs set,
  // breakage included. Not hatched ÷ fertile eggs (which measures the incubator
  // alone and reads several points higher).
  const avgHatch = tot.received > 0 ? tot.hatched / tot.received * 100 : 0
  // Avg Std on the SAME base, so the two tiles can be read against each other:
  // the standard those eggs were expected to deliver, against what they did.
  const avgStd   = tot.received > 0 ? tot.std / tot.received * 100 : 0

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
        subtitle={`${displayed.length.toLocaleString('en-IN')} batch(es)${flockFilter ? ' in this flock' : ''}${
          hatcheryFilter ? ' at this hatchery' : ''}${belowOnly ? ', below standard only' : ''}${
          ageBand ? `, flock ${AGE_BANDS.find(x => x.value === ageBand)?.label.toLowerCase()} at setting` : ''}${
          season ? `, set in ${SEASONS.find(x => x.value === season)?.label}` : ''}${
          q ? ` matching "${search.trim()}"` : ''}${
          fromDate || toDate ? ` set ${fromDate ? fmtDate(fromDate) : 'the beginning'} to ${toDate ? fmtDate(toDate) : 'now'}` : ''
        } — every figure on this page, and the Excel export, covers exactly these${
          displayed.length !== (batches ?? []).length ? ` (${(batches ?? []).length.toLocaleString('en-IN')} in total)` : ''}`}
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
        {([['batches','All Batches'],['pipeline','Pipeline (Awaiting Hatch)'],['hatchery','Hatchery Comparison']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===t?'border-brand-600 text-brand-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}{t==='pipeline' && pipeline.length > 0 && <span className="ml-1.5 bg-orange-100 text-orange-700 text-xs px-1.5 rounded-full">{pipeline.length}</span>}
          </button>
        ))}
      </div>

      <div className="flex gap-3 items-end">
        <SearchableSelect placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={v => setFlockFilter(v)} className="w-44" />
        <SearchableSelect placeholder="All Hatcheries" options={hatcheryFilterOptions}
          value={hatcheryFilter} onChange={v => setHatcheryFilter(v)} className="w-48" />
        <DateInput label="From (setting date)" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <DateInput label="To" value={toDate} onChange={e => setToDate(e.target.value)} />
        <Input label="Search setting / invoice / DC" placeholder="e.g. 22-110-525"
          value={search} onChange={e => setSearch(e.target.value)} className="w-52" />
        <SearchableSelect placeholder="Any flock age" options={AGE_BANDS.map(b => ({ value: b.value, label: b.label }))}
          value={ageBand} onChange={v => setAgeBand(v)} className="w-40" />
        <SearchableSelect placeholder="Any season" options={SEASONS.map(x => ({ value: x.value, label: x.label }))}
          value={season} onChange={v => setSeason(v)} className="w-44" />
        <label className="flex items-center gap-2 text-sm text-gray-600 pb-2 whitespace-nowrap">
          <input type="checkbox" checked={belowOnly} onChange={e => setBelowOnly(e.target.checked)}
            className="rounded border-gray-300"/>
          Below standard only
        </label>
        {(flockFilter || hatcheryFilter || fromDate || toDate || search || belowOnly || ageBand || season) && (
          <Button variant="ghost" size="sm"
            onClick={() => { setFlockFilter(''); setHatcheryFilter(''); setFromDate(''); setToDate(''); setSearch(''); setBelowOnly(false); setAgeBand(''); setSeason('') }}>Clear</Button>
        )}
      </div>

      {completed.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Total Eggs Set" value={totalEggsSet.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-brand-600"/>
          {/* Two separate figures. Std is what the typed STD Hatch % expects;
              Chicks Hatched is what the hatchery reported. The single card used
              to be labelled "Std Chicks Hatched", which read as the second while
              showing the first. */}
          <StatCard title="Std Chicks (Standard)" value={totalStd.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-gray-600"/>
          <StatCard title="Chicks Hatched" value={totalHatched.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-green-600"/>
          {/* Avg Std and Avg Hatchability share the total-eggs-set base on
              purpose — expected against achieved, directly comparable, and the
              gap between them is the shortfall against standard. */}
          <StatCard title="Avg Std" value={`${avgStd.toFixed(1)}%`} icon={<Egg size={18}/>} color="text-gray-600"/>
          <StatCard title="Avg Hatchability" value={`${avgHatch.toFixed(1)}%`} icon={<Egg size={18}/>}
            color={avgHatch >= avgStd ? 'text-green-600' : 'text-orange-500'}/>
        </div>
      )}

      {tab === 'batches' && (isLoading ? <Spinner /> : (
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
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">STD Hatch%</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Std</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Unhatch</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Unhatch%</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Reject</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Reject%</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Actual Std</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">Sale−STD</th>
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
                  // No fallback to the setting date. It used to silently use it
                  // when the batch had no linked dispatch, which made Age@Prod
                  // an exact copy of Age@Setting — a made-up figure that looked
                  // real, while Egg Age (which has no fallback) showed a dash
                  // from the very same missing data.
                  const ageAtProd = avgProdDate ? ageDays(placement, avgProdDate) : null
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
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{b.hatcheries?.name ?? b.hatchery_name ?? '—'}</td>
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
                      <td className={`px-3 py-2 text-xs text-right font-semibold ${(r.stdHatchPct ?? 0) >= 80 ? 'text-green-600' : r.stdHatchPct != null ? 'text-orange-500' : 'text-gray-400'}`}>
                        {r.stdHatchPct != null ? `${r.stdHatchPct}%` : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-right font-medium text-green-700">{r.std > 0 ? r.std.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right">{r.unhatch > 0 ? r.unhatch : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right text-orange-600">{r.unhatch > 0 ? pctCell(r.unhatchPct) : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right">{r.reject > 0 ? r.reject : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right text-red-500">{r.reject > 0 ? pctCell(r.rejectPct) : '—'}</td>
                      {/* Hatched − culled − rejects, straight off the report.
                          Red when it falls short of the Std the entered
                          STD Hatch % implies. */}
                      <td className={`px-3 py-2 text-xs text-right ${r.actualStd != null && r.std > 0 && r.actualStd < r.std ? 'text-red-600 font-semibold' : ''}`}>
                        {r.actualStd != null ? r.actualStd.toLocaleString('en-IN') : '—'}
                      </td>
                      <td className={`px-3 py-2 text-xs text-right ${r.stdMinusSale < 0 ? 'text-red-600 font-semibold' : ''}`}>
                        {r.std > 0 ? r.stdMinusSale.toLocaleString('en-IN') : '—'}
                      </td>
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
              {displayed.length > 0 && (() => {
                // % totals are recomputed from the summed underlying counts
                // (broken/received etc.), not an average of each row's own
                // %, so a mix of small and large batches doesn't skew it.
                const t = displayed.reduce((s: any, b: any) => {
                  const r = rowCalc(b)
                  s.received += r.received; s.setting += r.setting; s.broken += r.broken
                  s.inf += r.inf; s.blst += r.blst; s.saleChk += r.saleChk
                  s.std += r.std; s.unhatch += r.unhatch; s.reject += r.reject
                  if (r.stdHatchPct != null) {
                    s.stdHatchSum += r.stdHatchPct * (r.setting || 1)
                    s.stdHatchWeight += (r.setting || 1)
                  }
                  return s
                }, { received: 0, setting: 0, broken: 0, inf: 0, blst: 0, saleChk: 0, std: 0, unhatch: 0, reject: 0,
                     stdHatchSum: 0, stdHatchWeight: 0 })
                return (
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                      <td className="px-3 py-2" colSpan={11}>TOTAL ({displayed.length})</td>
                      <td className="px-3 py-2 text-xs text-right">{t.received.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-xs text-right">{t.setting.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-xs text-right">{t.broken.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-xs text-right text-orange-600">{pctCell(pct2(t.broken, t.received))}</td>
                      <td className="px-3 py-2 text-xs text-right">{t.inf.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-xs text-right text-orange-600">{pctCell(pct2(t.inf, t.setting))}</td>
                      <td className="px-3 py-2 text-xs text-right">{t.blst.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-xs text-right text-orange-600">{pctCell(pct2(t.blst, t.setting))}</td>
                      <td className="px-3 py-2 text-xs text-right">{t.saleChk.toLocaleString('en-IN')}</td>
                      {/* chicks sold ÷ setting, same basis as each row */}
                      <td className="px-3 py-2 text-xs text-right">{pctCell(pct2(t.saleChk, t.setting))}</td>
                      {/* STD Hatch % is entered per batch, so the total is the
                          egg-weighted average of the ones that carry it — a
                          plain mean would let a 5,000-egg batch outweigh a
                          50,000-egg one. */}
                      <td className="px-3 py-2 text-xs text-right">{t.stdHatchWeight > 0 ? `${p2(t.stdHatchSum / t.stdHatchWeight)}%` : '—'}</td>
                      <td className="px-3 py-2 text-xs text-right text-green-700">{t.std.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-xs text-right">{t.unhatch.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-xs text-right text-orange-600">{pctCell(pct2(t.unhatch, t.setting))}</td>
                      <td className="px-3 py-2 text-xs text-right">{t.reject.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-xs text-right text-red-500">{pctCell(pct2(t.reject, t.setting))}</td>
                      <td className="px-3 py-2" colSpan={3}></td>
                    </tr>
                  </tfoot>
                )
              })()}
            </table>
          </div>
          {displayed.length === 0 && (
            <EmptyState icon={<Egg size={32}/>} title="No hatch batches yet"
              action={<Button onClick={() => openForm()} icon={<Plus size={16}/>}>Add Batch</Button>}
            />
          )}
        </Card>
      ))}

      {/* ── Pipeline: driven by dispatches, not by hatch batches ─────────────── */}
      {tab === 'pipeline' && (
        <div className="space-y-4">
          {hatcheryOptions.length === 0 && (
            <Card>
              <p className="text-sm text-orange-700 bg-orange-50 rounded px-3 py-2">
                No hatcheries in the master yet. Add them under <strong>Masters → Hatcheries</strong>,
                and tick <strong>“Sends hatchability report”</strong> on the one that sends you reports —
                only those are chased here.
              </p>
            </Card>
          )}
          {([['Awaiting hatch report', awaitingReport, 'These went to a hatchery that sends a report, and no report has been entered yet.'],
             ['Hatchery not assigned', unassigned, 'Dispatched, but where they went has not been recorded yet. Set the hatchery here as soon as you know.']] as const)
            .map(([title, rows, note]) => (
            <Card key={title} padding={false}>
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-sm text-gray-800">{title} ({rows.length})</h3>
                <p className="text-xs text-gray-500 mt-0.5">{note}</p>
              </div>
              {rows.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">Nothing here.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <thead><tr>
                      <Th>Flock</Th><Th>Dispatch Date</Th><Th>Invoice / DC</Th>
                      <Th>Eggs</Th><Th>Days Since</Th><Th>Hatchery</Th><Th></Th>
                    </tr></thead>
                    <tbody>
                      {rows.map((d: any) => (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <Td><Badge color="green">F-{d.flocks?.flock_no}</Badge></Td>
                          <Td>{fmtDate(d.dispatch_date)}</Td>
                          <Td className="text-xs">{d.invoice_no ?? (d.dc_no ? `DC-${d.dc_no}` : '—')}</Td>
                          <Td right>{d.total_dispatched?.toLocaleString('en-IN') ?? '—'}</Td>
                          <Td right>
                            <span className={daysSince(d.dispatch_date) > 25 ? 'text-red-600 font-semibold' : ''}>
                              {daysSince(d.dispatch_date)}d
                            </span>
                          </Td>
                          <Td>
                            <Select className="w-48" placeholder="— Not assigned —"
                              options={hatcheryOptions} value={d.hatchery_id ?? ''}
                              onChange={e => assignHatchery.mutate({ id: d.id, hatchery_id: e.target.value })} />
                          </Td>
                          <Td>
                            <Button size="sm" variant="outline" onClick={() => {
                              // Open the batch form already linked to this
                              // dispatch, so nothing is re-typed.
                              setStdTouched(false); setEditing(null)
                              setForm({
                                ...emptyForm,
                                dispatch_id: d.id,
                                flock_id: d.flock_id ?? '',
                                invoice_no: d.invoice_no ?? '',
                                hatchery_id: d.hatchery_id ?? '',
                                eggs_set: d.total_dispatched?.toString() ?? '',
                                setting_date: d.dispatch_date,
                              })
                              setShowForm(true)
                            }}>Enter Report</Button>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── Hatchery comparison ──────────────────────────────────────────────── */}
      {tab === 'hatchery' && (
        <Card padding={false}>
          {byHatchery.length === 0 ? (
            <EmptyState icon={<Egg size={32}/>} title="No completed hatch reports yet"
              action={<Button onClick={() => setTab('pipeline')}>Go to Pipeline</Button>} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead><tr>
                  <Th>Hatchery</Th><Th>Batches</Th><Th>Received</Th><Th>Setting</Th>
                  <Th>Broken%</Th><Th>Inf%</Th><Th>Blst%</Th><Th>Sale Chk</Th>
                  <Th>Hatch%</Th><Th>STD Hatch%</Th><Th>Std</Th><Th>Reject%</Th><Th>Unhatch%</Th>
                </tr></thead>
                <tbody>
                  {byHatchery.map((g: any) => (
                    <tr key={g.name} className="hover:bg-gray-50">
                      <Td>
                        <span className="font-medium">{g.name}</span>
                        {g.typedOnly && <span className="ml-2 text-xs text-orange-500">typed, not linked</span>}
                      </Td>
                      <Td right>{g.batches}</Td>
                      <Td right>{g.received.toLocaleString('en-IN')}</Td>
                      <Td right>{g.setting.toLocaleString('en-IN')}</Td>
                      <Td right>{pctCell(pct2(g.broken, g.received))}</Td>
                      <Td right>{pctCell(pct2(g.inf, g.setting))}</Td>
                      <Td right>{pctCell(pct2(g.blst, g.setting))}</Td>
                      <Td right>{g.saleChk.toLocaleString('en-IN')}</Td>
                      <Td right><strong>{pctCell(pct2(g.saleChk, g.setting))}</strong></Td>
                      <Td right><strong>{g.stdHatchWeight > 0 ? `${p2(g.stdHatchSum / g.stdHatchWeight)}%` : '—'}</strong></Td>
                      <Td right>{g.std.toLocaleString('en-IN')}</Td>
                      <Td right>{pctCell(pct2(g.reject, g.setting))}</Td>
                      <Td right>{pctCell(pct2(g.unhatch, g.setting))}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <p className="px-4 py-3 text-xs text-gray-500 border-t border-gray-100">
                Percentages are recomputed from the summed counts, not averaged across batches,
                so a small batch cannot outweigh a large one. STD Hatch % is the egg-weighted
                average of the figures you entered.
              </p>
            </div>
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
          <Button loading={mut.isPending} onClick={() => {
            // Warn, never block: the hatchery's own sheet sometimes disagrees
            // with itself, and refusing the save would just move the figure
            // into someone's notebook.
            if (stdWarning && !window.confirm(`${stdWarning}\n\nSave anyway?`)) return
            mut.mutate()
          }}>{editing ? 'Update' : 'Save'}</Button></>
        }>
        <div className="space-y-4">
          {draftChecked && draft && !draftDismissed && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <span>Unsaved draft found from {new Date(draft.updatedAt).toLocaleString('en-IN')} — restore it?</span>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="secondary" onClick={() => setDraftDismissed(true)}>Discard</Button>
                <Button size="sm" onClick={() => { setForm(f => ({ ...f, ...draft.data })); setDraftDismissed(true) }}>Restore</Button>
              </div>
            </div>
          )}
          <FormRow cols={3}>
            <SearchableSelect label="Flock" placeholder="— Select or auto from invoice —" options={flockOptions}
              value={form.flock_id} onChange={v => s('flock_id', v)} />
            <SearchableSelect label="Hatchery" placeholder="— Select hatchery —"
              options={hatcheryOptions} value={form.hatchery_id} onChange={v => s('hatchery_id', v)}
              hint={hatcheryOptions.length === 0
                ? 'No hatcheries yet — add them under Masters → Hatcheries'
                : (!form.hatchery_id && form.hatchery_name ? `Was typed as: ${form.hatchery_name}` : '')} />
            <Input label="Setting No" placeholder="e.g. S-2026-01"
              value={form.setting_no} onChange={e => s('setting_no', e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Link Dispatch Invoice" placeholder="— Select invoice (optional) —"
              options={dispatchOptions} value={form.dispatch_id}
              onChange={e => {
                setLinkTouched(true)
                s('dispatch_id', e.target.value)
                const d = dispatches?.find((d: any) => d.id === e.target.value)
                if (d) {
                  if (d.invoice_no) s('invoice_no', d.invoice_no)
                  if (d.flock_id)   s('flock_id', d.flock_id)
                  // Eggs Set is what THIS setting received, which is often part
                  // of an invoice: NF/HHF/25-26/45 carried 50,400 and one
                  // setting took 20,160. Filling it with the whole invoice
                  // overwrote the real figure — on an existing batch it
                  // destroyed a number somebody had already entered. So it is
                  // only suggested into an EMPTY box, and what is suggested is
                  // what remains of the invoice, not its full quantity.
                  if (!form.eggs_set || form.eggs_set.trim() === '') {
                    const { total, used } = remainingOf(d)
                    const left = total - used
                    if (left > 0) s('eggs_set', String(left))
                  }
                }
              }}
              hint={form.dispatch_id
                ? (() => {
                    // Editing an existing batch: say what it is linked to and
                    // that the link can be changed or cleared here, since a
                    // wrong link is corrected on this screen and nowhere else.
                    const d = (dispatches ?? []).find((x: any) => x.id === form.dispatch_id)
                    if (!d) return 'Linked. Choose another invoice to move this batch, or the blank option to unlink it.'
                    const { total, used, left } = remainingOf(d)
                    return `Linked to ${d.invoice_no ?? 'DC-' + d.dc_no} — ${total.toLocaleString('en-IN')} eggs`
                      + (used > 0 ? `, ${used.toLocaleString('en-IN')} already set, ${Math.max(0, left).toLocaleString('en-IN')} left` : '')
                      + '. Choose another invoice to move this batch, or the blank option to unlink it.'
                  })()
                : autoLinkMatch
                  ? `Will link automatically to ${autoLinkMatch.invoice_no ?? 'DC-' + autoLinkMatch.dc_no} — same flock, ${autoLinkMatch.total_dispatched?.toLocaleString('en-IN')} eggs on ${fmtDate(autoLinkMatch.dispatch_date)}`
                  : (dispatchOptions.some(o => o.label.startsWith('★'))
                      ? '★ marks this flock\u2019s dispatches in the 3 weeks before the setting date. Fully set invoices are not listed. Without a link, Age@Prod and Egg Age stay blank.'
                      : 'Without a link, Age@Prod and Egg Age stay blank — the app cannot know when these eggs were laid.')} />
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
            {/* Setting is the base of STD Hatch %, so changing either of these
                re-derives Std Chicks rather than leaving a stale count. */}
            <Input label="Received (Total from Farm)" type="number" value={form.eggs_set}
              onChange={e => {
                s('eggs_set', e.target.value)
                const d = stdFromPct(form.std_hatch_pct, (parseInt(e.target.value) || 0) - fBroken)
                if (d != null) s('std_chicks', d.toString())
              }} />
            <Input label="Broken in Transit" type="number" value={form.broken_transit}
              onChange={e => {
                s('broken_transit', e.target.value)
                const d = stdFromPct(form.std_hatch_pct, fReceived - (parseInt(e.target.value) || 0))
                if (d != null) s('std_chicks', d.toString())
              }} />
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
                setStdAuto((parseInt(e.target.value) || 0) - fCulled - fRejects)
              }} />
            <Input label="Culled Chicks" type="number" value={form.culled_chicks}
              onChange={e => {
                s('culled_chicks', e.target.value)
                setStdAuto(fHatched - (parseInt(e.target.value) || 0) - fRejects)
              }} />
          </FormRow>
          <FormRow cols={4}>
            <Input label="Std Chicks" type="number" value={form.std_chicks}
              onChange={e => { setStdTouched(true); s('std_chicks', e.target.value) }}
              hint={(() => {
                const fromPct = stdFromPct(form.std_hatch_pct, fSetting)
                // Cross-check, never a silent overwrite: if the report's own
                // Hatched − Culled − Rejects disagrees with its percentage, you
                // see both instead of one quietly winning.
                if (fromPct != null) {
                  const typed = N(form.std_chicks)
                  if (typed !== fromPct) return `From STD Hatch %: ${fromPct.toLocaleString('en-IN')} — your figure is kept`
                  return autoStd > 0 && autoStd !== fromPct
                    ? `From STD Hatch %. Hatched − culled − rejects = ${autoStd.toLocaleString('en-IN')}`
                    : 'From STD Hatch % × setting eggs'
                }
                if (autoStd > 0) {
                  return stdTouched && N(form.std_chicks) !== autoStd
                    ? `Your figure is kept. Calculated would be ${autoStd.toLocaleString('en-IN')}`
                    : `Calculated: ${autoStd.toLocaleString('en-IN')}`
                }
                return ''
              })()} />
            <Input label="Unhatched" type="number" value={form.unhatched}
              onChange={e => s('unhatched', e.target.value)}
              hint={fSetting > 0 && N(form.unhatched) > 0 ? `${pct2(N(form.unhatched), fSetting).toFixed(1)}%` : ''} />
            <Input label="Rejects" type="number" value={form.rejects}
              onChange={e => {
                s('rejects', e.target.value)
                setStdAuto(fHatched - fCulled - (parseInt(e.target.value) || 0))
              }}
              hint={fSetting > 0 && fRejects > 0 ? `${pct2(fRejects, fSetting).toFixed(1)}%` : ''} />
            {/* Typed in from the hatchery's report — the app never calculates
                this one. Hatch % below IS calculated: chicks sold ÷ setting. */}
            <Input label="STD Hatch % (from report)" type="number" step="0.01" value={form.std_hatch_pct}
              onChange={e => {
                s('std_hatch_pct', e.target.value)
                // Your percentage drives the chick count, so it takes the box
                // back from any earlier manual entry.
                const derived = stdFromPct(e.target.value, fSetting)
                if (derived != null) { setStdTouched(false); s('std_chicks', derived.toString()) }
              }}
              hint={fSetting > 0 && form.std_hatch_pct.trim() !== ''
                ? `Std = ${fSetting.toLocaleString('en-IN')} setting × ${F(form.std_hatch_pct)}%`
                : 'Entered from the hatchery report — it sets Std Chicks'} />
            {/* The book's figure for this flock's age, offered but never forced:
                the hatchery report stays the authority, and a batch you type
                differently keeps your number. */}
            {stdHatchForForm && (
              <div className="col-span-full -mt-2">
                <p className="text-xs text-gray-500">
                  Venco standard at {stdHatchForForm.wk} weeks ({stdHatchForForm.season}):{' '}
                  <strong>{stdHatchForForm.pct}%</strong>
                  {form.std_hatch_pct.trim() === '' ? (
                    <button type="button" className="ml-2 text-brand-600 underline"
                      onClick={() => {
                        s('std_hatch_pct', String(stdHatchForForm.pct))
                        const derived = stdFromPct(String(stdHatchForForm.pct), fSetting)
                        if (derived != null) { setStdTouched(false); s('std_chicks', derived.toString()) }
                      }}>use this</button>
                  ) : Math.abs(F(form.std_hatch_pct) - stdHatchForForm.pct) >= 0.05 ? (
                    <span className="ml-2 text-orange-600">
                      — you have entered {F(form.std_hatch_pct)}%, a difference of{' '}
                      {(F(form.std_hatch_pct) - stdHatchForForm.pct).toFixed(2)} points
                    </span>
                  ) : <span className="ml-2 text-green-600">— matches what you entered</span>}
                </p>
              </div>
            )}
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

          {stdWarning && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              <strong>Check this before saving.</strong> {stdWarning}
              <span className="block text-xs mt-1 text-red-600">
                You can still save — it will ask you to confirm.
              </span>
            </div>
          )}

          {belowStd && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
              {belowStd}
            </div>
          )}

          {fSetting > 0 && (
            <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700 flex gap-6 flex-wrap">
              {fInf > 0 && <span>Inf%: <strong>{pct2(fInf, fSetting).toFixed(1)}%</strong></span>}
              {fBlst > 0 && <span>Blst%: <strong>{pct2(fBlst, fSetting).toFixed(1)}%</strong></span>}
              {fHatched > 0 && (
                <>
                  <span>Std: <strong>{fStd.toLocaleString('en-IN')}</strong></span>
                  {/* chicks sold ÷ setting eggs */}
                  {N(form.chicks_sold) > 0 && <span>Hatch%: <strong>{pct2(N(form.chicks_sold), fSetting).toFixed(1)}%</strong></span>}
                  {form.std_hatch_pct.trim() !== '' && <span>STD Hatch%: <strong>{F(form.std_hatch_pct).toFixed(2)}%</strong></span>}
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
