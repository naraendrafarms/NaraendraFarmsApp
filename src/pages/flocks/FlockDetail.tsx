import React, { useState, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, pct, fmtDate, flockAgeWeeks, flockAgeLabel, flockAgeWeekBucket, exportCSV, fetchAllPages } from '@/lib/utils'
import {
  Card, CardHeader, Button, Badge, Table, Th, Td,
  SectionHeader, Spinner, StatCard, Divider, Input, Select
, DateInput } from '@/components/ui'
import {
  Bird, Egg, TrendingUp, ArrowLeft, Calendar,
  BarChart2, DollarSign, Package, Trash2, Upload, Download, Printer
} from 'lucide-react'
import toast from 'react-hot-toast'
import { parseFile } from '@/lib/parseFile'
import { printReport } from '@/lib/invoicePrint'
import { useFeedRates } from '@/hooks/useFeedRates'
import { useMedicineRates } from '@/lib/medicineRates'

// ── Bulk selection helpers ─────────────────────────────────────────────────────
const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

const BulkBar: React.FC<{ count: number; onDelete: () => void; onClear: () => void; loading?: boolean }> = ({ count, onDelete, onClear, loading }) => count === 0 ? null : (
  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
    <span className="text-sm font-medium text-red-700">{count} selected</span>
    <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
    <div className="ml-auto">
      <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} loading={loading} onClick={onDelete}>Delete {count} rows</Button>
    </div>
  </div>
)

const ConfirmBulkDelete: React.FC<{ label: string; onConfirm: () => void; onCancel: () => void }> = ({ label, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl shadow-xl p-6 w-80">
      <p className="font-semibold text-gray-900 mb-1">Delete records?</p>
      <p className="text-sm text-gray-500 mb-5">{label}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" size="sm" onClick={onConfirm}>Delete</Button>
      </div>
    </div>
  </div>
)
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Legend
} from 'recharts'

const NHE_LABEL: Record<string, string> = {
  je: 'Jumbo Eggs (JE)', te: 'Table Eggs (TE)', be: 'Broken/Crack Eggs (BE)',
  bird_cull: 'Bird Sales — Cull', bird_lame: 'Bird Sales — Lame',
  bird_weak: 'Bird Sales — Weak', bird_sex_error: 'Bird Sales — Sex Error',
  gas: 'Gas Cylinders', manure: 'Manure / Litter', other: 'Other Income',
}

export const FlockDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'overview'|'daily'|'weekly'|'monthly'|'financial'|'costincome'|'transfers'|'placements'|'std'>('overview')
  const [placementForm, setPlacementForm] = useState({ allocated_date: '', shed_id: '', female_count: '', male_count: '', notes: '' })
  const [editPlacementId, setEditPlacementId] = useState<string|null>(null)
  const [showPlacementForm, setShowPlacementForm] = useState(false)
  const [selPlacements, setSelPlacements] = useState<Set<string>>(new Set())
  const [bulkPlacementConfirm, setBulkPlacementConfirm] = useState(false)
  const transferImportRef = useRef<HTMLInputElement>(null)
  const blankTransfer = () => ({
    transfer_date: new Date().toISOString().split('T')[0],
    from_farm_id: '', to_farm_id: '', from_shed_id: '', to_shed_id: '',
    female_count: '0', male_count: '0',
    sex_error_female: '0', sex_error_male: '0',
    sold_female: '0', sold_male: '0',
    is_final_transfer: false, notes: ''
  })
  const [transferForm, setTransferForm] = useState(blankTransfer())
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [editTransferId, setEditTransferId] = useState<string|null>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  // Date filter state for daily tab
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Date filter state for financial tab HE dispatch
  const [heFromDate, setHeFromDate] = useState('')
  const [heToDate, setHeToDate] = useState('')

  // CSV import state
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: flock, isLoading } = useQuery({
    queryKey: ['flock', id],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('*, rearing_farm:farms!rearing_farm_id(name,code), laying_farm:farms!laying_farm_id(name,code)')
        .eq('id', id!).single()
      return data
    }
  })

  const { data: daily } = useQuery({
    queryKey: ['flock_daily', id],
    queryFn: async () => fetchAllPages<any>(
      (from, to) => supabase.from('daily_records')
        .select('*').eq('flock_id', id!).order('record_date')
        .order('id').range(from, to),
      'Flock daily records'
    )
  })

  // The hatch results for this flock. he_dispatch.hatch_pct is a leftover from
  // the app's first schema and is empty on every dispatch the farm has made --
  // the real figures live on the hatch batch, linked to a dispatch by
  // dispatch_id. Flock 19 had 14 batches linked, all with a hatchability
  // figure, while the vs-Standard tab read the empty column and showed
  // nothing. Reading the batches is the whole fix.
  const { data: hatchBatches } = useQuery({
    queryKey: ['flock_hatch_batches', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from('hatch_batches')
        .select('id,dispatch_id,flock_id,setting_date,eggs_set,hatched_chicks,hatchability_pct,' +
                'he_dispatch:dispatch_id(dispatch_date,flock_id)')
        .or(`flock_id.eq.${id},he_dispatch.flock_id.eq.${id}`)
        .order('setting_date')
      return data ?? []
    }
  })
  const { data: heDispatch } = useQuery({
    queryKey: ['flock_he', id],
    queryFn: async () => {
      const { data } = await supabase.from('he_dispatch')
        .select('*').eq('flock_id', id!).order('dispatch_date', { ascending: false })
      return data ?? []
    }
  })

  const { data: nheSales } = useQuery({
    queryKey: ['flock_nhe', id],
    queryFn: async () => {
      const { data } = await supabase.from('nhe_sales')
        .select('*, nhe_sale_lines(sale_type,amount)').eq('flock_id', id!).order('sale_date', { ascending: false })
      return data ?? []
    }
  })

  const { data: stdCurve } = useQuery({
    queryKey: ['std_curve', flock?.laying_season],
    enabled: !!flock?.laying_season,
    queryFn: async () => {
      const { data } = await supabase.from('std_production_curve')
        .select('*').eq('season', flock!.laying_season).order('week_of_age')
      return data ?? []
    }
  })

  const { data: farms } = useQuery({
    queryKey: ['farms_list'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').order('name')
      return data ?? []
    }
  })

  const { data: allSheds } = useQuery({
    queryKey: ['all_sheds'],
    queryFn: async () => {
      const { data } = await supabase.from('sheds').select('id,shed_no,shed_name,farm_id').eq('is_active', true)
      return data ?? []
    }
  })

  const { data: transfers, refetch: refetchTransfers } = useQuery({
    queryKey: ['flock_transfers', id],
    queryFn: async () => {
      const { data } = await supabase.from('flock_transfers')
        .select('*,from_farm:farms!from_farm_id(name),to_farm:farms!to_farm_id(name),from_shed:sheds!from_shed_id(shed_no,shed_name),to_shed:sheds!to_shed_id(shed_no,shed_name)')
        .eq('flock_id', id!).order('transfer_date', { ascending: false })
      return data ?? []
    }
  })

  const { data: placements } = useQuery({
    queryKey: ['flock_placements', id],
    queryFn: async () => {
      const { data } = await supabase.from('shed_allocations')
        .select('*,shed:sheds(shed_no,shed_name,capacity_female,capacity_male,total_boxes,birds_per_box)')
        .eq('flock_id', id!).order('allocated_date')
      return data ?? []
    }
  })

  const savePlacementMut = useMutation({
    mutationFn: async () => {
      if (!placementForm.allocated_date) throw new Error('Date required')
      const payload = {
        flock_id: id,
        farm_id: flock?.rearing_farm_id ?? flock?.laying_farm_id,
        allocated_date: placementForm.allocated_date,
        shed_id: placementForm.shed_id || null,
        female_count: parseInt(placementForm.female_count) || 0,
        male_count: parseInt(placementForm.male_count) || 0,
        notes: placementForm.notes || null,
      }
      if (editPlacementId) {
        const { error } = await supabase.from('shed_allocations').update(payload).eq('id', editPlacementId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('shed_allocations').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flock_placements', id] })
      qc.invalidateQueries({ queryKey: ['flock', id] })
      qc.invalidateQueries({ queryKey: ['flock_dashboard'] })
      setPlacementForm({ allocated_date: '', shed_id: '', female_count: '', male_count: '', notes: '' })
      setEditPlacementId(null); setShowPlacementForm(false)
      toast.success(editPlacementId ? 'Placement updated' : 'Placement recorded')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delPlacementMut = useMutation({
    mutationFn: async (pid: string) => {
      const { error } = await supabase.from('shed_allocations').delete().eq('id', pid)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flock_placements', id] })
      qc.invalidateQueries({ queryKey: ['flock', id] })
      toast.success('Deleted')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const bulkDelPlacementMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('shed_allocations').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flock_placements', id] })
      qc.invalidateQueries({ queryKey: ['flock', id] })
      setSelPlacements(new Set()); setBulkPlacementConfirm(false)
      toast.success('Deleted')
    },
    onError: (e: any) => toast.error(e.message)
  })

  // Shared by single-entry (addTransferMut) and bulk CSV import — deducts the
  // transferred birds from the SOURCE shed's daily record for that date.
  // Without this, imported transfers credit the destination shed but never
  // reduce the source shed's count (the exact corruption class fixed for
  // Flock 22 earlier — that fix only covered the single-entry form).
  const deductFromSourceShed = async (opts: {
    flockId: string; date: string; farmId: string | null; shedId: string | null; trF: number; trM: number
  }) => {
    if (opts.trF <= 0 && opts.trM <= 0) return
    let drQuery = supabase.from('daily_records')
      .select('id,transfer_female,transfer_male,opening_female,opening_male,cull_female,cull_male,mortality_female,mortality_male')
      .eq('flock_id', opts.flockId).eq('record_date', opts.date)
    drQuery = opts.shedId ? drQuery.eq('shed_id', opts.shedId) : drQuery.is('shed_id', null)
    drQuery = opts.farmId ? drQuery.eq('farm_id', opts.farmId) : drQuery.is('farm_id', null)
    const { data: dr } = await drQuery.maybeSingle()
    const newTrF = (dr?.transfer_female ?? 0) + opts.trF
    const newTrM = (dr?.transfer_male ?? 0) + opts.trM
    const closingF = Math.max(0, (dr?.opening_female ?? 0) - newTrF - (dr?.cull_female ?? 0) - (dr?.mortality_female ?? 0))
    const closingM = Math.max(0, (dr?.opening_male ?? 0) - newTrM - (dr?.cull_male ?? 0) - (dr?.mortality_male ?? 0))
    const trcullF = newTrF + (dr?.cull_female ?? 0)
    const trcullM = newTrM + (dr?.cull_male ?? 0)
    if (dr) {
      await supabase.from('daily_records').update({
        transfer_female: newTrF, transfer_male: newTrM,
        trcull_female: trcullF, trcull_male: trcullM,
        ...(dr.opening_female ? { closing_female: closingF, closing_male: closingM } : {})
      }).eq('id', dr.id)
    } else {
      await supabase.from('daily_records').insert({
        flock_id: opts.flockId, record_date: opts.date,
        farm_id: opts.farmId, shed_id: opts.shedId,
        transfer_female: opts.trF, transfer_male: opts.trM,
        trcull_female: opts.trF, trcull_male: opts.trM,
        cull_female: 0, cull_male: 0,
        mortality_female: 0, mortality_male: 0,
      })
    }
  }

  // Move the birds between the two sheds' ALLOCATIONS as well as the daily
  // records. Until now a transfer told the daily record what moved but never
  // told the flock where it now lives: Flock 23's birds went from shed 10 into
  // sheds 5, 6 and 12 on 17/08/2026, and Bulk Daily Entry — which builds its
  // shed list from flock_sheds then shed_allocations — still offered only
  // sheds 10 and 11, so yesterday's production could not be entered at all.
  // sign = +1 when recording a transfer, -1 when undoing one.
  const moveShedAllocation = async (t: {
    flockId: string; date: string; trF: number; trM: number
    fromShedId: string | null; fromFarmId: string | null
    toShedId: string | null; toFarmId: string | null
  }, sign: 1 | -1) => {
    const f = (t.trF || 0) * sign, m = (t.trM || 0) * sign
    if (!f && !m) return

    // Every allocation row for a shed, newest first. A shed is often allocated
    // in more than one go — Flock 23's shed 10 has 22,538 birds on one date and
    // 1,208 on the next — so a reduction has to work its way BACK through them.
    // Taking 17,327 birds off the newest row alone floors it at zero and leaves
    // the older row untouched, which says 22,538 birds are still in a shed that
    // has been emptied.
    const rowsFor = async (shedId: string) => {
      const { data } = await supabase.from('shed_allocations')
        .select('id,female_count,male_count,allocated_date')
        .eq('flock_id', t.flockId).eq('shed_id', shedId)
        .order('allocated_date', { ascending: false })
      return data ?? []
    }
    const latest = async (shedId: string) => (await rowsFor(shedId))[0] ?? null

    // Spread a reduction across the rows, newest first, until it is used up.
    const reduceAcross = async (shedId: string, needF: number, needM: number) => {
      for (const r of await rowsFor(shedId)) {
        if (needF <= 0 && needM <= 0) break
        const takeF = Math.min(needF, r.female_count ?? 0)
        const takeM = Math.min(needM, r.male_count ?? 0)
        if (!takeF && !takeM) continue
        const { error } = await supabase.from('shed_allocations').update({
          female_count: (r.female_count ?? 0) - takeF,
          male_count:   (r.male_count ?? 0) - takeM,
        }).eq('id', r.id)
        if (error) throw error
        needF -= takeF; needM -= takeM
      }
    }

    if (t.toShedId) {
      const dest = await latest(t.toShedId)
      if (dest) {
        const { error } = await supabase.from('shed_allocations').update({
          female_count: Math.max(0, (dest.female_count ?? 0) + f),
          male_count:   Math.max(0, (dest.male_count ?? 0) + m),
        }).eq('id', dest.id)
        if (error) throw error
      } else if (sign === 1) {
        // Nothing to add to, so the shed is new to this flock — give it a row,
        // otherwise the shed stays invisible to every screen that reads
        // allocations.
        const { error } = await supabase.from('shed_allocations').insert({
          flock_id: t.flockId, shed_id: t.toShedId, farm_id: t.toFarmId,
          allocated_date: t.date, female_count: Math.max(0, f), male_count: Math.max(0, m),
          notes: 'Created by a shed transfer',
        })
        if (error) throw error
      }
    }

    if (t.fromShedId) {
      if (sign === 1) {
        // No rows means the source was never allocated in the first place —
        // reduceAcross simply finds nothing, rather than inventing a negative
        // placement.
        await reduceAcross(t.fromShedId, t.trF || 0, t.trM || 0)
      } else {
        // Undoing a transfer: the birds go back on the source's newest row.
        const src = await latest(t.fromShedId)
        if (src) {
          const { error } = await supabase.from('shed_allocations').update({
            female_count: (src.female_count ?? 0) + (t.trF || 0),
            male_count:   (src.male_count ?? 0) + (t.trM || 0),
          }).eq('id', src.id)
          if (error) throw error
        }
      }
    }
  }

  // Undo everything a transfer did: the source shed's daily-record deduction
  // and the birds' move between the two sheds' allocations. Delete uses it on
  // its own; EDIT uses it to take the OLD figures back out before putting the
  // new ones in — otherwise correcting a bird count leaves both sheds carrying
  // the original number with nothing on screen to say so.
  const undoTransferEffects = async (t: any) => {
    const trF = t.female_count || 0, trM = t.male_count || 0
    if (trF || trM) {
      let drQuery = supabase.from('daily_records')
        .select('id,transfer_female,transfer_male,trcull_female,trcull_male,opening_female,opening_male,cull_female,cull_male,mortality_female,mortality_male')
        .eq('flock_id', id!).eq('record_date', t.transfer_date)
      drQuery = t.from_shed_id ? drQuery.eq('shed_id', t.from_shed_id) : drQuery.is('shed_id', null)
      drQuery = t.from_farm_id ? drQuery.eq('farm_id', t.from_farm_id) : drQuery.is('farm_id', null)
      const { data: dr } = await drQuery.maybeSingle()
      if (dr) {
        const newTrF = Math.max(0, (dr.transfer_female ?? 0) - trF)
        const newTrM = Math.max(0, (dr.transfer_male ?? 0) - trM)
        // trcull was incremented alongside transfer when the transfer was
        // added (trcull = transfer + cull) — must be reversed by the same
        // amount, or it stays permanently overstated.
        const newTrcullF = Math.max(0, (dr.trcull_female ?? 0) - trF)
        const newTrcullM = Math.max(0, (dr.trcull_male ?? 0) - trM)
        const closingF = Math.max(0, (dr.opening_female ?? 0) - newTrF - (dr.cull_female ?? 0) - (dr.mortality_female ?? 0))
        const closingM = Math.max(0, (dr.opening_male ?? 0) - newTrM - (dr.cull_male ?? 0) - (dr.mortality_male ?? 0))
        await supabase.from('daily_records').update({
          transfer_female: newTrF, transfer_male: newTrM,
          trcull_female: newTrcullF, trcull_male: newTrcullM,
          ...(dr.opening_female ? { closing_female: closingF, closing_male: closingM } : {})
        }).eq('id', dr.id)
      }
    }
    await moveShedAllocation({
      flockId: id!, date: t.transfer_date, trF, trM,
      fromShedId: t.from_shed_id ?? null, fromFarmId: t.from_farm_id ?? null,
      toShedId: t.to_shed_id ?? null, toFarmId: t.to_farm_id ?? null,
    }, -1)
  }

  const addTransferMut = useMutation({
    mutationFn: async () => {
      if (!transferForm.to_farm_id) throw new Error('To Farm is required')
      const trF = parseInt(transferForm.female_count) || 0
      const trM = parseInt(transferForm.male_count) || 0
      const payload = {
        flock_id: id,
        transfer_date: transferForm.transfer_date,
        from_farm_id: transferForm.from_farm_id || null,
        to_farm_id: transferForm.to_farm_id,
        from_shed_id: transferForm.from_shed_id || null,
        to_shed_id: transferForm.to_shed_id || null,
        female_count: trF,
        male_count: trM,
        sex_error_female: parseInt(transferForm.sex_error_female) || 0,
        sex_error_male: parseInt(transferForm.sex_error_male) || 0,
        sold_female: parseInt(transferForm.sold_female) || 0,
        sold_male: parseInt(transferForm.sold_male) || 0,
        is_final_transfer: transferForm.is_final_transfer,
        notes: transferForm.notes || null,
      }
      const { error } = await supabase.from('flock_transfers').insert(payload)
      if (error) throw error

      // Auto-deduct transferred birds from the SOURCE shed's daily record for
      // that date. Must filter by shed_id (and farm_id) — a flock can have a
      // separate daily_records row per shed, and matching on flock_id+date
      // alone can grab the DESTINATION shed's row instead (its transfer_in
      // credit gets wiped out by an equal-and-opposite "transfer out" written
      // onto the same row). unique key is (flock_id, record_date, farm_id, shed_id).
      await deductFromSourceShed({
        flockId: id!, date: transferForm.transfer_date,
        farmId: transferForm.from_farm_id || null, shedId: transferForm.from_shed_id || null,
        trF, trM,
      })

      await moveShedAllocation({
        flockId: id!, date: transferForm.transfer_date, trF, trM,
        fromShedId: transferForm.from_shed_id || null, fromFarmId: transferForm.from_farm_id || null,
        toShedId: transferForm.to_shed_id || null, toFarmId: transferForm.to_farm_id || null,
      }, 1)

      // If marked as final transfer, update flock status to laying
      if (transferForm.is_final_transfer) {
        const { error: fe } = await supabase.from('flocks').update({
          status: 'laying',
          laying_farm_id: transferForm.to_farm_id,
          laying_start_date: transferForm.transfer_date,
        }).eq('id', id!)
        if (fe) throw fe
      }
    },
    onSuccess: () => {
      toast.success(transferForm.is_final_transfer ? 'Transfer complete! Flock status → Laying' : 'Transfer recorded!')
      qc.invalidateQueries({ queryKey: ['flock_transfers', id] })
      qc.invalidateQueries({ queryKey: ['flock_daily', id] })
      qc.invalidateQueries({ queryKey: ['flock', id] })
      qc.invalidateQueries({ queryKey: ['shed_allocations', id] })
      qc.invalidateQueries({ queryKey: ['flock_sheds_full'] })
      setShowTransferForm(false)
      setTransferForm(blankTransfer())
    },
    onError: (e: any) => toast.error(e.message)
  })

  const updateTransferMut = useMutation({
    mutationFn: async () => {
      if (!editTransferId) throw new Error('No transfer selected')
      if (!transferForm.to_farm_id) throw new Error('To Farm is required')
      const payload = {
        transfer_date: transferForm.transfer_date,
        from_farm_id: transferForm.from_farm_id || null,
        to_farm_id: transferForm.to_farm_id,
        from_shed_id: transferForm.from_shed_id || null,
        to_shed_id: transferForm.to_shed_id || null,
        female_count: parseInt(transferForm.female_count) || 0,
        male_count: parseInt(transferForm.male_count) || 0,
        sex_error_female: parseInt(transferForm.sex_error_female) || 0,
        sex_error_male: parseInt(transferForm.sex_error_male) || 0,
        sold_female: parseInt(transferForm.sold_female) || 0,
        sold_male: parseInt(transferForm.sold_male) || 0,
        is_final_transfer: transferForm.is_final_transfer,
        notes: transferForm.notes || null,
      }
      // Read the transfer as it stands BEFORE saving — its old figures are what
      // has to come back out of the daily record and the shed allocations.
      const { data: old, error: oe } = await supabase.from('flock_transfers')
        .select('*').eq('id', editTransferId).single()
      if (oe) throw oe

      await undoTransferEffects(old)

      const { error } = await supabase.from('flock_transfers').update(payload).eq('id', editTransferId)
      if (error) throw error

      // …and the new figures go in exactly as a fresh transfer would put them.
      const trF = payload.female_count, trM = payload.male_count
      await deductFromSourceShed({
        flockId: id!, date: payload.transfer_date,
        farmId: payload.from_farm_id, shedId: payload.from_shed_id, trF, trM,
      })
      await moveShedAllocation({
        flockId: id!, date: payload.transfer_date, trF, trM,
        fromShedId: payload.from_shed_id, fromFarmId: payload.from_farm_id,
        toShedId: payload.to_shed_id, toFarmId: payload.to_farm_id,
      }, 1)

      // Ticking "Final Transfer" on an edit did nothing before — the flock kept
      // its old status and laying farm, so the tick box lied.
      if (payload.is_final_transfer && !old.is_final_transfer) {
        const { error: fe } = await supabase.from('flocks').update({
          status: 'laying',
          laying_farm_id: payload.to_farm_id,
          laying_start_date: payload.transfer_date,
        }).eq('id', id!)
        if (fe) throw fe
      }
    },
    onSuccess: () => {
      toast.success('Transfer updated')
      qc.invalidateQueries({ queryKey: ['flock_transfers', id] })
      qc.invalidateQueries({ queryKey: ['flock_daily', id] })
      qc.invalidateQueries({ queryKey: ['daily_records'] })
      qc.invalidateQueries({ queryKey: ['flock', id] })
      qc.invalidateQueries({ queryKey: ['shed_allocations', id] })
      qc.invalidateQueries({ queryKey: ['flock_sheds_full'] })
      setShowTransferForm(false); setEditTransferId(null)
      setTransferForm(blankTransfer())
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteTransferMut = useMutation({
    mutationFn: async (t: any) => {
      const { error } = await supabase.from('flock_transfers').delete().eq('id', t.id)
      if (error) throw error
      await undoTransferEffects(t)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flock_transfers', id] })
      qc.invalidateQueries({ queryKey: ['daily_records'] })
      qc.invalidateQueries({ queryKey: ['shed_allocations', id] })
      qc.invalidateQueries({ queryKey: ['flock_sheds_full'] })
      toast.success('Transfer deleted')
    },
    onError: (e: any) => toast.error('Delete failed: ' + (e.message || e.details)),
  })

  const handleTransferImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) { toast.error('Empty file'); return }
    const hdrs = lines[0].split(',').map(h => h.replace(/"/g,'').trim().toLowerCase().replace(/\s+/g,'_'))
    const col = (n: string) => hdrs.indexOf(n)
    const { data: allFarmsData } = await supabase.from('farms').select('id,name,code')
    const farmMap: Record<string,string> = {}
    for (const f of allFarmsData??[]) { farmMap[f.name.toLowerCase()] = f.id; farmMap[f.code?.toLowerCase()] = f.id }
    const { data: allSheds } = await supabase.from('sheds').select('id,shed_no,farm_id')
    const shedKey = (farmId: string, shedNo: string) => `${farmId}|${shedNo}`.toLowerCase()
    const shedMap: Record<string,string> = {}
    for (const sh of allSheds??[]) shedMap[shedKey(sh.farm_id, String(sh.shed_no))] = sh.id
    let saved = 0
    for (const line of lines.slice(1)) {
      const vals = line.split(',').map(v => v.replace(/"/g,'').trim())
      const fromFarm = farmMap[vals[col('from_farm')]?.toLowerCase()]
      const toFarm = farmMap[vals[col('to_farm')]?.toLowerCase()]
      if (!vals[col('transfer_date')] || !toFarm) continue
      const fromShedNo = vals[col('from_shed')]
      const toShedNo = vals[col('to_shed')]
      const fromShed = fromFarm && fromShedNo ? shedMap[shedKey(fromFarm, fromShedNo)] : undefined
      const toShed = toShedNo ? shedMap[shedKey(toFarm, toShedNo)] : undefined
      const trF = parseInt(vals[col('female_count')])||0
      const trM = parseInt(vals[col('male_count')])||0
      await supabase.from('flock_transfers').insert({
        flock_id: id,
        transfer_date: vals[col('transfer_date')],
        from_farm_id: fromFarm || null,
        to_farm_id: toFarm,
        from_shed_id: fromShed || null,
        to_shed_id: toShed || null,
        female_count: trF,
        male_count: trM,
        sex_error_female: parseInt(vals[col('sex_error_female')])||0,
        sex_error_male: parseInt(vals[col('sex_error_male')])||0,
        sold_female: parseInt(vals[col('sold_female')])||0,
        sold_male: parseInt(vals[col('sold_male')])||0,
        notes: vals[col('notes')]||null,
      })
      // Same source-shed deduction the single-entry form applies — without
      // this, imported transfers credited the destination but never reduced
      // the source shed's bird count (the Flock 22 corruption class).
      await deductFromSourceShed({
        flockId: id!, date: vals[col('transfer_date')],
        farmId: fromFarm || null, shedId: fromShed || null,
        trF, trM,
      })
      saved++
    }
    toast.success(`Imported ${saved} transfer records`)
    qc.invalidateQueries({ queryKey: ['flock_transfers', id] })
    qc.invalidateQueries({ queryKey: ['flock_daily', id] })
    qc.invalidateQueries({ queryKey: ['flock', id] })
    if (e.target) e.target.value = ''
  }

  // Medicine cost used to be read from medicine_monthly, a rollup table that is
  // not being filled — so every flock's Financial tab showed Medicine 0.00 while
  // Flock Management → Dashboard → Medicine, which reads medicine_usage, showed
  // the real amounts. Read the same table the entries actually go into.
  const { data: medUsage } = useQuery({
    queryKey: ['flock_med_usage', id],
    queryFn: async () => fetchAllPages<any>((from, to) => supabase.from('medicine_usage')
      .select('usage_date,quantity,unit,amount,rate,medicine_id,medicines_master(name,type,item_id)')
      .eq('flock_id', id!).order('usage_date').order('id').range(from, to), 'Medicine usage', toast.error),
  })

  // Feed cost: kg from the daily records × recipe cost/kg for the feed type fed
  // that day. Falls back to the flock's average when a day carries no feed type.
  const feedRates = useFeedRates()

  // Site-level costs. Attendance and electricity are recorded per SITE, never
  // per flock, so these are the site's own figures — see the note rendered with
  // them. Salary is built from each employee's real per-day rate
  // (earned_salary / days_worked) times the days they were actually present,
  // NOT a month divided by 30.
  const { data: siteSalary } = useQuery({
    queryKey: ['flock_site_salary', id],
    queryFn: async () => {
      const { data } = await supabase.from('salary_monthly')
        .select('month,earned_salary,net_salary,days_worked,employee_id,employees!employee_id(farm_id)')
      return data ?? []
    },
  })
  const { data: siteElectricity } = useQuery({
    queryKey: ['flock_site_electricity', id],
    queryFn: async () => {
      // A site can have more than one transformer/meter — every meter's bill
      // for that site is added, per your instruction.
      const { data } = await supabase.from('electricity_bills')
        .select('bill_month,amount,electricity_meters(farm_id)')
      return data ?? []
    },
  })
  const { data: heRates } = useQuery({
    queryKey: ['he_rate_register_all'],
    queryFn: async () => {
      const { data } = await supabase.from('he_rate_register')
        .select('week_start,week_end,rate').order('week_start')
      return data ?? []
    },
  })
  const { data: nheRateRows } = useQuery({
    queryKey: ['nhe_recent_rates'],
    queryFn: async () => {
      // 441 rows against .limit(500) — close enough that the next season would
      // have started dropping the oldest rates out of the rate history.
      return fetchAllPages<any>((from, to) => supabase.from('nhe_sales')
        .select('sale_date,sale_type,rate,qty')
        .order('sale_date', { ascending: false }).order('id').range(from, to), 'NHE rate history')
    },
  })
  const [ciFrom, setCiFrom] = useState('')
  const [ciTo, setCiTo] = useState('')
  // Stock rate = what the medicine is actually valued at in stock. The row's
  // own `amount` is only as good as the rate typed when it was saved, and on
  // Flock 20 that read Rs 1,816 against a real Rs 3,27,856 — so the Financial
  // and Cost & Income tabs were understating medicine ~180x. Same helper the
  // Dashboard's "Cost (Stock Rates)" uses, so all pages agree by construction.
  const medRate = useMedicineRates()

  const { data: otherExpenses } = useQuery({
    queryKey: ['flock_other_expenses', id],
    queryFn: async () => {
      const { data } = await supabase.from('farm_expenses')
        .select('expense_date,category,description,amount,farm_id,flock_id')
        .eq('flock_id', id!).order('expense_date')
      return data ?? []
    },
  })

  const bulkDelMut = useMutation({
    mutationFn: async (dates: string[]) => {
      // collect all raw record IDs for the selected dates (handles multi-shed)
      const allIds = dailyAggregated
        .filter((d: any) => dates.includes(d.record_date))
        .flatMap((d: any) => d._ids as string[])
      const { error } = await supabase.from('daily_records').delete().in('id', allIds)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_daily', id] }); setSel(new Set()); setBulkConfirm(false) },
    onError: (e: any) => toast.error(e.message),
  })

  // dailyIndexMap: maps record_date → ascending day index (for week number)
  // MUST be before early returns — useMemo is a hook
  const dailyIndexMap = useMemo<Map<string, number>>(() => {
    const m = new Map<string, number>()
    const dates = [...new Set((daily ?? []).map(d => d.record_date))].sort()
    dates.forEach((date, i) => m.set(date, i))
    return m
  }, [daily])

  // dailyAggregated: group by date, sum all shed values into one row per day
  const dailyAggregated = useMemo(() => {
    const map = new Map<string, any>()
    for (const d of daily ?? []) {
      const ex = map.get(d.record_date)
      if (!ex) {
        map.set(d.record_date, {
          ...d,
          _ids: [d.id],
          _sheds: 1,
        })
      } else {
        ex._ids.push(d.id)
        ex._sheds += 1
        ex.opening_female   = (ex.opening_female   ?? 0) + (d.opening_female   ?? 0)
        ex.opening_male     = (ex.opening_male     ?? 0) + (d.opening_male     ?? 0)
        ex.feed_female_kg   = (ex.feed_female_kg   ?? 0) + (d.feed_female_kg   ?? 0)
        ex.feed_male_kg     = (ex.feed_male_kg     ?? 0) + (d.feed_male_kg     ?? 0)
        ex.total_eggs       = (ex.total_eggs       ?? 0) + (d.total_eggs       ?? 0)
        ex.he_eggs          = (ex.he_eggs          ?? 0) + (d.he_eggs          ?? 0)
        ex.mortality_female = (ex.mortality_female ?? 0) + (d.mortality_female ?? 0)
        ex.mortality_male   = (ex.mortality_male   ?? 0) + (d.mortality_male   ?? 0)
        ex.cull_female      = (ex.cull_female      ?? 0) + (d.cull_female      ?? 0)
        ex.cull_male        = (ex.cull_male        ?? 0) + (d.cull_male        ?? 0)
        ex.transfer_female  = (ex.transfer_female  ?? 0) + (d.transfer_female  ?? 0)
        ex.transfer_male    = (ex.transfer_male    ?? 0) + (d.transfer_male    ?? 0)
        ex.trcull_female    = (ex.trcull_female    ?? 0) + (d.trcull_female    ?? 0)
        ex.trcull_male      = (ex.trcull_male      ?? 0) + (d.trcull_male      ?? 0)
        const openF = ex.opening_female ?? 0
        ex.hd_pct = openF > 0 ? (ex.total_eggs ?? 0) / openF : null
        ex.he_pct = (ex.total_eggs ?? 0) > 0 ? (ex.he_eggs ?? 0) / (ex.total_eggs ?? 0) : null
      }
    }
    // Always derive closing from opening − transfer − cull − mortality so the
    // table stays self-consistent even if a stored closing value is stale.
    for (const row of map.values()) {
      const trF = row.transfer_female ?? row.trcull_female ?? 0
      const trM = row.transfer_male   ?? row.trcull_male   ?? 0
      row.closing_female = Math.max(0, (row.opening_female ?? 0) - trF - (row.cull_female ?? 0) - (row.mortality_female ?? 0))
      row.closing_male   = Math.max(0, (row.opening_male   ?? 0) - trM - (row.cull_male   ?? 0) - (row.mortality_male   ?? 0))
    }
    return Array.from(map.values()) // ascending by date (Map preserves insertion order and daily is ordered asc)
  }, [daily])

  // Weekly Flock Report — dailyAggregated rolled up by week-of-age (this
  // flock's own week numbering from placement_date), one row per week.
  const weeklyAgg = useMemo(() => {
    if (!flock?.placement_date) return []
    const map = new Map<number, any>()
    for (const d of dailyAggregated) {
      // 0-based: the placement week is Week 0, matching the standard curve and
      // the auto-filled Age (weeks). Days before placement bucket at -1.
      const weekNum = flockAgeWeekBucket(flock.placement_date, d.record_date) ?? 0
      const eggs = d.total_eggs ?? 0
      const he = d.he_eggs ?? 0
      const openF = d.opening_female ?? 0
      const ex = map.get(weekNum)
      if (!ex) {
        map.set(weekNum, {
          weekNum, days: 1, totalEggs: eggs, totalHE: he,
          mortF: d.mortality_female ?? 0, mortM: d.mortality_male ?? 0,
          feedF: d.feed_female_kg ?? 0, feedM: d.feed_male_kg ?? 0,
          hdSum: openF > 0 ? eggs / openF : 0, hdCount: openF > 0 ? 1 : 0,
          firstDate: d.record_date, lastDate: d.record_date,
          openF, openM: d.opening_male ?? 0, closeF: d.closing_female ?? 0, closeM: d.closing_male ?? 0,
        })
      } else {
        ex.days += 1
        ex.totalEggs += eggs
        ex.totalHE += he
        ex.mortF += d.mortality_female ?? 0
        ex.mortM += d.mortality_male ?? 0
        ex.feedF += d.feed_female_kg ?? 0
        ex.feedM += d.feed_male_kg ?? 0
        if (openF > 0) { ex.hdSum += eggs / openF; ex.hdCount += 1 }
        ex.lastDate = d.record_date
        ex.closeF = d.closing_female ?? ex.closeF
        ex.closeM = d.closing_male ?? ex.closeM
      }
    }
    return Array.from(map.values()).sort((a, b) => a.weekNum - b.weekNum).map(w => ({
      ...w,
      hdPct: w.hdCount > 0 ? w.hdSum / w.hdCount : null,
      hePct: w.totalEggs > 0 ? w.totalHE / w.totalEggs : null,
    }))
  }, [dailyAggregated, flock?.placement_date])

  // displayDaily: reversed + date filtered (one row per date, aggregated across sheds)
  const displayDaily = useMemo(() => {
    let arr = [...dailyAggregated].reverse()
    if (fromDate) arr = arr.filter(d => d.record_date >= fromDate)
    if (toDate) arr = arr.filter(d => d.record_date <= toDate)
    return arr
  }, [dailyAggregated, fromDate, toDate])

  const uniqueDates = dailyAggregated.length

  // heDispatch filtered for financial tab
  const displayHeDispatch = useMemo(() => {
    let arr = heDispatch ?? []
    if (heFromDate) arr = arr.filter(d => d.dispatch_date >= heFromDate)
    if (heToDate) arr = arr.filter(d => d.dispatch_date <= heToDate)
    return arr
  }, [heDispatch, heFromDate, heToDate])

  // MUST stay above the early returns below: a hook placed after them runs
  // only once data has loaded, so the first (loading) render and the next
  // render have different hook counts — React error #310. Cached flocks hid
  // this because they skip the loading render entirely.

  // vs Standard tab's actual-vs-Venco-curve rows, duplicated here (same pure
  // computation as the tab's own render) purely so Export/Print can build
  // rows without needing the tab's JSX to have already rendered.
  const stdExportRows = useMemo(() => {
    if (!flock?.laying_season || !stdCurve || stdCurve.length === 0) return []
    const HH = flock.total_placed_f ?? 0
    type WeekAgg = { openFSum: number; totalEggs: number; heEggs: number; depletion: number }
    const weekly: Record<number, WeekAgg> = {}
    for (const d of (daily ?? [])) {
      if (!d.record_date) continue
      const wk = flockAgeWeeks(flock.placement_date, d.record_date)
      if (wk < 0) continue
      const row = weekly[wk] ??= { openFSum: 0, totalEggs: 0, heEggs: 0, depletion: 0 }
      row.openFSum += d.opening_female ?? 0
      row.totalEggs += d.total_eggs ?? 0
      row.heEggs += d.he_eggs ?? 0
      row.depletion += (d.mortality_female ?? 0) + (d.cull_female ?? 0)
    }
    // Hatch results come from the BATCHES, weighted by eggs set -- a 30,000-egg
    // batch and a 5,000-egg batch must not count equally, which a plain average
    // of percentages would do. The week is the flock's age on the DISPATCH date
    // the batch was set from, since that is when those eggs left the farm.
    // Where a batch has no dispatch link, its own setting date is used.
    const hatchWeekly: Record<number, { pctXeggs: number; eggs: number; chicks: number }> = {}
    for (const b of (hatchBatches ?? []) as any[]) {
      const when = b.he_dispatch?.dispatch_date ?? b.setting_date
      if (!when) continue
      const wk = flockAgeWeeks(flock.placement_date, when)
      if (wk < 0) continue
      const row = hatchWeekly[wk] ??= { pctXeggs: 0, eggs: 0, chicks: 0 }
      const eggs = Number(b.eggs_set ?? 0)
      if (b.hatchability_pct != null && eggs > 0) {
        row.pctXeggs += Number(b.hatchability_pct) * eggs
        row.eggs += eggs
      }
      row.chicks += Number(b.hatched_chicks ?? 0)
    }
    const variance = (actual: number | null, std: number | null) =>
      actual == null || std == null ? null : actual - std
    let cumDepletion = 0, cumTeHh = 0, cumHeHh = 0, cumChicksHh = 0, cumDeaths = 0
    return stdCurve.map((s: any) => {
      const w = weekly[s.week_of_age]
      const actualHd = w && w.openFSum > 0 ? (w.totalEggs / w.openFSum) * 100 : null
      const actualHe = w && w.totalEggs > 0 ? (w.heEggs / w.totalEggs) * 100 : null
      const hw = hatchWeekly[s.week_of_age]
      const actualHatch = hw && hw.eggs > 0 ? hw.pctXeggs / hw.eggs : null
      const weeklyChicksHh = hw && HH > 0 && hw.chicks > 0 ? hw.chicks / HH : null
      const weeklyTeHh = w && HH > 0 ? w.totalEggs / HH : null
      const weeklyHeHh = w && HH > 0 ? w.heEggs / HH : null
      const weeklyDepletionPct = w && HH > 0 ? (w.depletion / HH) * 100 : null
      if (w) { cumDepletion += weeklyDepletionPct ?? 0; cumTeHh += weeklyTeHh ?? 0; cumHeHh += weeklyHeHh ?? 0; cumDeaths += w.depletion }
      cumChicksHh += weeklyChicksHh ?? 0
      return {
        s, actualHd, actualHe, actualHatch, weeklyTeHh, weeklyHeHh, weeklyChicksHh,
        cumChicksHh: cumChicksHh > 0 ? cumChicksHh : null,
        deaths: w ? w.depletion : null, cumDeaths: w ? cumDeaths : null,
        eggs: w ? w.totalEggs : null, heEggs: w ? w.heEggs : null, birdDays: w ? w.openFSum : null,
        eggsSet: hw?.eggs ?? null, chicks: hw?.chicks ?? null,
        vChicksHh: variance(weeklyChicksHh, s.weekly_chicks_hh),
        vCumChicksHh: variance(cumChicksHh > 0 ? cumChicksHh : null, s.cum_chicks_hh),
        cumDepletion: w ? cumDepletion : null, cumTeHh: w ? cumTeHh : null, cumHeHh: w ? cumHeHh : null,
        vDepletion: variance(w ? cumDepletion : null, s.cum_depletion_pct),
        vHd: variance(actualHd, s.hen_week_pct), vHe: variance(actualHe, s.he_pct),
        vTeHh: variance(weeklyTeHh, s.weekly_te_hh), vCumTeHh: variance(w ? cumTeHh : null, s.cum_te_hh),
        vHeHh: variance(weeklyHeHh, s.weekly_he_hh), vCumHeHh: variance(w ? cumHeHh : null, s.cum_he_hh),
        vHatch: variance(actualHatch, s.hatch_pct),
      }
    })
  }, [flock?.laying_season, flock?.total_placed_f, flock?.placement_date, stdCurve, daily, hatchBatches])

  if (isLoading) return <Spinner />
  if (!flock) return <div className="p-8 text-center text-gray-500">Flock not found</div>

  // Computed totals from displayDaily (one row per date, sheds already
  // summed, AND the From/To date filter applied) — this is the TOTAL row
  // shown under the table, so it must match whatever range is currently
  // filtered. Previously summed dailyAggregated (the full, unfiltered
  // flock lifetime) instead, so picking a date range narrowed the rows
  // shown but left the TOTAL row showing the all-time total regardless.
  const totalEggs  = displayDaily.reduce((s, d) => s + (d.total_eggs ?? 0), 0)
  const totalHE    = displayDaily.reduce((s, d) => s + (d.he_eggs ?? 0), 0)
  const totalMortF = displayDaily.reduce((s, d) => s + (d.mortality_female ?? 0), 0)
  const totalMortM = displayDaily.reduce((s, d) => s + (d.mortality_male ?? 0), 0)
  const totalTrF   = displayDaily.reduce((s, d) => s + (d.transfer_female ?? d.trcull_female ?? 0), 0)
  const totalTrM   = displayDaily.reduce((s, d) => s + (d.transfer_male   ?? d.trcull_male   ?? 0), 0)
  const totalCullF = displayDaily.reduce((s, d) => s + (d.cull_female ?? 0), 0)
  const totalCullM = displayDaily.reduce((s, d) => s + (d.cull_male   ?? 0), 0)
  const totalFeedF = displayDaily.reduce((s, d) => s + (d.feed_female_kg ?? 0), 0)
  const totalFeedM = displayDaily.reduce((s, d) => s + (d.feed_male_kg ?? 0), 0)
  const hePct = totalEggs > 0 ? totalHE / totalEggs : 0

  // Bulk selection helpers for daily tab (select by date, delete all shed rows for that date)
  const dailyDates = dailyAggregated.map((d: any) => d.record_date)
  const allDailySel = dailyDates.length > 0 && dailyDates.every((dt: string) => sel.has(dt))
  const someDailySel = dailyDates.some((dt: string) => sel.has(dt))
  const toggleDaily = (dt: string) => setSel(s => { const n = new Set(s); n.has(dt) ? n.delete(dt) : n.add(dt); return n })
  const toggleAllDaily = () => setSel(s => { const n = new Set(s); allDailySel ? dailyDates.forEach((dt: string) => n.delete(dt)) : dailyDates.forEach((dt: string) => n.add(dt)); return n })

  const heRevenue  = heDispatch?.reduce((s, d) => s + (d.amount ?? 0), 0) ?? 0
  const nheRevenue = nheSales?.reduce((s, d) => s + (d.amount ?? 0), 0) ?? 0
  // quantity x stock rate, falling back to the row's own rate only when the
  // item has never been priced in stock.
  const medRowCost = (m: any) => {
    const stock = medRate(m.medicines_master?.item_id, m.medicines_master?.name ?? '')
    return (m.quantity ?? 0) * (stock ?? m.rate ?? 0)
  }
  const medUnpricedCount = (medUsage ?? []).filter((m: any) =>
    medRate(m.medicines_master?.item_id, m.medicines_master?.name ?? '') == null && !m.rate).length
  const medCost    = (medUsage ?? []).reduce((s: number, m: any) => s + medRowCost(m), 0)
  const chickCost  = flock.chick_cost ?? 0
  const totalRevenue = heRevenue + nheRevenue

  // ── Feed cost ────────────────────────────────────────────────────────────
  // kg actually fed × the recipe cost/kg of the feed type fed that day. The
  // Financial tab used to say "See Feed Report" and leave it out of the total,
  // which made every flock's cost understated by its single largest expense.
  const feedRate = (t: any) => (t ? (feedRates.byTypeId[t] ?? feedRates.rate(t)) : 0)
  const feedCost = (daily ?? []).reduce((sum: number, d: any) =>
    sum + (d.feed_female_kg ?? 0) * feedRate(d.feed_type_f)
        + (d.feed_male_kg ?? 0) * feedRate(d.feed_type_m), 0)
  // Fallback: if no feed type is recorded, the rate resolves to 0 and the cost
  // silently vanishes. Surface how much feed that applies to instead of hiding it.
  const feedKgUnpriced = (daily ?? []).reduce((sum: number, d: any) =>
    sum + (feedRate(d.feed_type_f) ? 0 : (d.feed_female_kg ?? 0))
        + (feedRate(d.feed_type_m) ? 0 : (d.feed_male_kg ?? 0)), 0)

  // ── Which site the flock was on, for any date ────────────────────────────
  // Costs follow the batch: the day it moves to Bodjanampet-1, that day's cost
  // is Bodjanampet-1's and never Kethireddypally's.
  const transfersAsc = [...(transfers ?? [])].sort((a: any, b: any) =>
    String(a.transfer_date).localeCompare(String(b.transfer_date)))
  const siteOnDate = (d: string): string | null => {
    let site = flock.rearing_farm_id ?? flock.laying_farm_id ?? null
    if (flock.laying_start_date && d >= flock.laying_start_date) site = flock.laying_farm_id ?? site
    for (const t of transfersAsc) {
      if (t.transfer_date && d >= t.transfer_date && t.to_farm_id) site = t.to_farm_id
    }
    return site
  }
  const monthsActive = Array.from(new Set((daily ?? []).map((d: any) => String(d.record_date).slice(0, 7))))

  // ── Site costs: salary and electricity ───────────────────────────────────
  // Both are recorded per SITE and there is nothing in the data that says which
  // flock a worker or a unit of power went to. They are reported as the SITE's
  // figure, never divided between flocks sharing that site — a split would be
  // an invented number, and you asked for option (c).
  const siteMonths = new Set(monthsActive.map(m => `${m}|${siteOnDate(m + '-15') ?? ''}`))
  const salaryCost = (siteSalary ?? []).reduce((sum: number, r: any) => {
    const m = String(r.month ?? '').slice(0, 7)
    const farm = r.employees?.farm_id ?? ''
    return siteMonths.has(`${m}|${farm}`) ? sum + (r.earned_salary ?? r.net_salary ?? 0) : sum
  }, 0)
  const electricityCost = (siteElectricity ?? []).reduce((sum: number, b: any) => {
    const m = String(b.bill_month ?? '').slice(0, 7)
    const farm = b.electricity_meters?.farm_id ?? ''
    // Every meter/transformer on the site counts — a site with two of them adds both.
    return siteMonths.has(`${m}|${farm}`) ? sum + (b.amount ?? 0) : sum
  }, 0)

  // Diesel, transport, bags, repairs — whatever was entered against this flock.
  const otherExpCost = (otherExpenses ?? []).reduce((s: number, e: any) => s + (e.amount ?? 0), 0)
  const otherExpByCat = (otherExpenses ?? []).reduce((acc: any, e: any) => {
    const k = e.category || 'other'; acc[k] = (acc[k] ?? 0) + (e.amount ?? 0); return acc
  }, {} as Record<string, number>)

  // ── Cost & Income tab ────────────────────────────────────────────────────
  // Eggs produced are VALUED each day, so a day with production but no dispatch
  // still shows what it earned: HE at that week's rate from the HE Rate
  // Register, other eggs at the most recent rate actually achieved for that
  // sale type. Actual sales are shown separately, on the date they happened.

  const heRateOn = (d: string): number => {
    const w = (heRates ?? []).find((r: any) => d >= r.week_start && d <= r.week_end)
    return w?.rate ?? 0
  }
  // Latest rate achieved for each NHE type, taken from real sales.
  const nheRateByType = (() => {
    const m: Record<string, number> = {}
    for (const r of (nheRateRows ?? []) as any[]) {
      if (r.sale_type && r.rate && m[r.sale_type] == null) m[r.sale_type] = r.rate
    }
    return m
  })()


  const salesByDate = (() => {
    const m: Record<string, number> = {}
    for (const d of (heDispatch ?? []) as any[]) {
      const k = String(d.dispatch_date); m[k] = (m[k] ?? 0) + (d.amount ?? 0)
    }
    for (const s2 of (nheSales ?? []) as any[]) {
      const k = String(s2.sale_date); m[k] = (m[k] ?? 0) + (s2.amount ?? 0)
    }
    return m
  })()

  const medByDate = (() => {
    const m: Record<string, number> = {}
    for (const r of (medUsage ?? []) as any[]) {
      const k = String(r.usage_date); m[k] = (m[k] ?? 0) + medRowCost(r)
    }
    return m
  })()

  const expByDate = (() => {
    const m: Record<string, number> = {}
    for (const e of (otherExpenses ?? []) as any[]) {
      const k = String(e.expense_date); m[k] = (m[k] ?? 0) + (e.amount ?? 0)
    }
    return m
  })()

  const farmName = (() => {
    const m: Record<string, string> = {}
    for (const f of ((farms ?? []) as any[])) m[f.id] = f.name ?? f.code
    return m
  })()

  // One row per date. Chick cost sits on the placement day only, exactly as you
  // asked — so it appears once and never distorts cost per egg on other days.
  const ciDaily = (() => {
    const byDate: Record<string, any> = {}
    for (const d of (dailyAggregated ?? []) as any[]) {
      const k = String(d.record_date)
      byDate[k] ??= { date: k, eggs: 0, he: 0, feedKg: 0, feedCost: 0 }
      byDate[k].eggs += d.total_eggs ?? 0
      byDate[k].he += d.he_eggs ?? 0
      byDate[k].feedKg += (d.feed_female_kg ?? 0) + (d.feed_male_kg ?? 0)
      byDate[k].feedCost += (d.feed_female_kg ?? 0) * feedRate(d.feed_type_f)
                          + (d.feed_male_kg ?? 0) * feedRate(d.feed_type_m)
    }
    const placement = flock.placement_date ? String(flock.placement_date) : null
    return Object.values(byDate).map((r: any) => {
      const nonHe = Math.max(0, r.eggs - r.he)
      // Non-HE eggs are valued at the table-egg rate, the commonest NHE type;
      // a per-grade split would need grade-wise production, which the daily
      // record does not carry.
      const nheRate = nheRateByType['te'] ?? nheRateByType['je'] ?? 0
      const value = r.he * heRateOn(r.date) + nonHe * nheRate
      const chick = placement && r.date === placement ? chickCost : 0
      const med = medByDate[r.date] ?? 0
      const exp = expByDate[r.date] ?? 0
      const cost = r.feedCost + med + exp
      return {
        ...r, site: farmName[siteOnDate(r.date) ?? ''] ?? '—',
        value, sales: salesByDate[r.date] ?? 0,
        med, exp, chick, cost,
        perEgg: r.eggs > 0 ? cost / r.eggs : 0,
      }
    }).filter((r: any) => (!ciFrom || r.date >= ciFrom) && (!ciTo || r.date <= ciTo))
      .sort((a: any, b: any) => b.date.localeCompare(a.date))
  })()

  // Monthly rolls the daily figures up and ADDS the site costs, which only
  // exist per month — so the month view is complete where the day view cannot be.
  const ciMonthly = (() => {
    const m: Record<string, any> = {}
    for (const r of ciDaily) {
      const k = r.date.slice(0, 7)
      m[k] ??= { month: k, eggs: 0, he: 0, feedCost: 0, med: 0, exp: 0, value: 0, sales: 0, chick: 0, site: r.site }
      m[k].eggs += r.eggs; m[k].he += r.he; m[k].feedCost += r.feedCost
      m[k].med += r.med; m[k].exp += r.exp; m[k].value += r.value; m[k].sales += r.sales; m[k].chick += r.chick
    }
    return Object.values(m).map((r: any) => {
      const sal = (siteSalary ?? []).reduce((s2: number, x: any) =>
        String(x.month ?? '').slice(0, 7) === r.month
        && (x.employees?.farm_id ?? '') === (siteOnDate(r.month + '-15') ?? '')
          ? s2 + (x.earned_salary ?? x.net_salary ?? 0) : s2, 0)
      const elec = (siteElectricity ?? []).reduce((s2: number, b: any) =>
        String(b.bill_month ?? '').slice(0, 7) === r.month
        && (b.electricity_meters?.farm_id ?? '') === (siteOnDate(r.month + '-15') ?? '')
          ? s2 + (b.amount ?? 0) : s2, 0)
      const total = r.feedCost + r.med + r.exp + r.chick + sal + elec
      return { ...r, sal, elec, total, perEgg: r.eggs > 0 ? total / r.eggs : 0 }
    }).sort((a: any, b: any) => b.month.localeCompare(a.month))
  })()

  // ── Financial tab date range ─────────────────────────────────────────────
  // The Revenue and Cost cards were lifetime-only, so there was no way to ask
  // "what did this flock earn and cost in July". The same From/To that filters
  // the HE Dispatch table now filters every figure on the tab, so the cards and
  // the table can never describe different periods.
  const inFin = (d: any) => {
    const k = String(d ?? '')
    return (!heFromDate || k >= heFromDate) && (!heToDate || k <= heToDate)
  }
  const finRanged = !!(heFromDate || heToDate)

  const fHeRevenue = (heDispatch ?? []).filter((d: any) => inFin(d.dispatch_date))
    .reduce((s2: number, d: any) => s2 + (d.amount ?? 0), 0)
  const fNheSales = (nheSales ?? []).filter((d: any) => inFin(d.sale_date))
  const fNheRevenue = fNheSales.reduce((s2: number, d: any) => s2 + (d.amount ?? 0), 0)
  const fTotalRevenue = fHeRevenue + fNheRevenue

  const fMedUsage = (medUsage ?? []).filter((m: any) => inFin(m.usage_date))
  const fMedCost = fMedUsage.reduce((s2: number, m: any) => s2 + medRowCost(m), 0)
  const fMedUnpriced = fMedUsage.filter((m: any) =>
    medRate(m.medicines_master?.item_id, m.medicines_master?.name ?? '') == null && !m.rate).length
  const fDaily = (daily ?? []).filter((d: any) => inFin(d.record_date))
  const fFeedCost = fDaily.reduce((sum: number, d: any) =>
    sum + (d.feed_female_kg ?? 0) * feedRate(d.feed_type_f)
        + (d.feed_male_kg ?? 0) * feedRate(d.feed_type_m), 0)
  const fFeedKg = fDaily.reduce((sum: number, d: any) =>
    sum + (d.feed_female_kg ?? 0) + (d.feed_male_kg ?? 0), 0)
  const fFeedKgUnpriced = fDaily.reduce((sum: number, d: any) =>
    sum + (feedRate(d.feed_type_f) ? 0 : (d.feed_female_kg ?? 0))
        + (feedRate(d.feed_type_m) ? 0 : (d.feed_male_kg ?? 0)), 0)
  // Which feed types are behind the unpriced kg — "no feed type at all" is only
  // one of the two causes, and saying so without checking would be a guess.
  const fFeedUnpricedTypes = Array.from(new Set(fDaily.flatMap((d: any) => [
    (d.feed_female_kg ?? 0) > 0 && !feedRate(d.feed_type_f) ? (d.feed_type_f ? String(d.feed_type_f) : '(none recorded)') : null,
    (d.feed_male_kg ?? 0) > 0 && !feedRate(d.feed_type_m) ? (d.feed_type_m ? String(d.feed_type_m) : '(none recorded)') : null,
  ]).filter(Boolean) as string[])).slice(0, 6)

  const fExpenses = (otherExpenses ?? []).filter((e: any) => inFin(e.expense_date))
  const fOtherExpCost = fExpenses.reduce((s2: number, e: any) => s2 + (e.amount ?? 0), 0)
  const fOtherExpByCat = fExpenses.reduce((acc: any, e: any) => {
    const k = e.category || 'other'; acc[k] = (acc[k] ?? 0) + (e.amount ?? 0); return acc
  }, {} as Record<string, number>)

  // Chick cost is a single event on the placement date, so it only belongs in
  // the range if that date falls inside it. Including it regardless would make
  // any one-month view read as though the birds were bought again that month.
  const fChickCost = (!finRanged || inFin(flock.placement_date)) ? chickCost : 0

  // Site salary/electricity for the months touched by the range.
  const fMonths = new Set(fDaily.map((d: any) => String(d.record_date).slice(0, 7)))
  const fSiteMonths = new Set(Array.from(fMonths).map((m: any) => `${m}|${siteOnDate(m + '-15') ?? ''}`))
  const fSalaryCost = (siteSalary ?? []).reduce((sum: number, r: any) =>
    fSiteMonths.has(`${String(r.month ?? '').slice(0, 7)}|${r.employees?.farm_id ?? ''}`)
      ? sum + (r.earned_salary ?? r.net_salary ?? 0) : sum, 0)
  const fElectricityCost = (siteElectricity ?? []).reduce((sum: number, b: any) =>
    fSiteMonths.has(`${String(b.bill_month ?? '').slice(0, 7)}|${b.electricity_meters?.farm_id ?? ''}`)
      ? sum + (b.amount ?? 0) : sum, 0)

  const fEggs = fDaily.reduce((s2: number, d: any) => s2 + (d.total_eggs ?? 0), 0)
  const fDirectCost = fChickCost + fMedCost + fFeedCost + fOtherExpCost
  const fTotalCost = fDirectCost + fSalaryCost + fElectricityCost
  const fCostPerEgg = fEggs > 0 ? fTotalCost / fEggs : 0

  const directCost = chickCost + medCost + feedCost + otherExpCost
  const totalCost  = directCost + salaryCost + electricityCost
  const costPerEgg = totalEggs > 0 ? totalCost / totalEggs : 0

  // Monthly chart data (from full ascending daily array)
  const monthlyData = daily?.reduce((acc: any[], d) => {
    const m = d.record_date.slice(0, 7)
    const existing = acc.find(x => x.month === m)
    if (existing) {
      existing.eggs += d.total_eggs ?? 0
      existing.he   += d.he_eggs ?? 0
      existing.mort += (d.mortality_female ?? 0) + (d.mortality_male ?? 0)
    } else {
      acc.push({ month: m, eggs: d.total_eggs ?? 0, he: d.he_eggs ?? 0,
        mort: (d.mortality_female ?? 0) + (d.mortality_male ?? 0) })
    }
    return acc
  }, []) ?? []

  // Same rows as monthlyData, plus the per-month feed/mortality/avg-birds
  // figures the Monthly tab already computes inline in its render — shared
  // here so Export/Print use the exact same numbers shown on screen.
  const monthlyRows = monthlyData.map((m: any) => {
    const monthDaily = daily?.filter(d => d.record_date.startsWith(m.month)) ?? []
    const avgF = monthDaily.reduce((s, d) => s + (d.opening_female ?? 0), 0) / Math.max(monthDaily.length, 1)
    const feedF = monthDaily.reduce((s, d) => s + (d.feed_female_kg ?? 0), 0)
    const feedM = monthDaily.reduce((s, d) => s + (d.feed_male_kg ?? 0), 0)
    const mortF = monthDaily.reduce((s, d) => s + (d.mortality_female ?? 0), 0)
    return { ...m, days: monthDaily.length, avgF, feedF, feedM, mortF }
  })

  // Aggregate the most recent date's records across all sheds
  const lastDate = daily?.length ? daily[daily.length - 1].record_date : null
  const lastDateRecords = daily?.filter(d => d.record_date === lastDate) ?? []
  const lastRecord = lastDate ? {
    ...lastDateRecords[0],
    // Derive closing from opening − transfer − cull − mortality (not the stored
    // closing) so a stale stored value can't show a wrong alive count.
    closing_female: Math.max(0, lastDateRecords.reduce((s, d) => s + ((d.opening_female ?? 0) - (d.transfer_female ?? d.trcull_female ?? 0) - (d.cull_female ?? 0) - (d.mortality_female ?? 0)), 0)),
    closing_male:   Math.max(0, lastDateRecords.reduce((s, d) => s + ((d.opening_male   ?? 0) - (d.transfer_male   ?? d.trcull_male   ?? 0) - (d.cull_male   ?? 0) - (d.mortality_male   ?? 0)), 0)),
    opening_female: lastDateRecords.reduce((s, d) => s + (d.opening_female ?? 0), 0),
    opening_male:   lastDateRecords.reduce((s, d) => s + (d.opening_male   ?? 0), 0),
    total_eggs:     lastDateRecords.reduce((s, d) => s + (d.total_eggs     ?? 0), 0),
    he_eggs:        lastDateRecords.reduce((s, d) => s + (d.he_eggs        ?? 0), 0),
    feed_female_kg: lastDateRecords.reduce((s, d) => s + (d.feed_female_kg ?? 0), 0),
    feed_male_kg:   lastDateRecords.reduce((s, d) => s + (d.feed_male_kg   ?? 0), 0),
  } : null
  const ageWeeks = flockAgeWeeks(flock.placement_date)

  // Builds the headers/rows for whichever tab is currently active, shared by
  // both the generic Export (CSV) and Print buttons in the tab bar below.
  const getTabExportData = (): { title: string; subtitle?: string; headers: string[]; rows: (string|number)[][]; rightAlignFrom?: number } | null => {
    switch (tab) {
      case 'overview':
        return {
          title: `Flock ${flock.flock_no} — Overview`,
          headers: ['Metric', 'Value'],
          rightAlignFrom: 1,
          rows: [
            ['Placed (Paid)', `${flock.paid_female?.toLocaleString('en-IN')} F + ${flock.paid_male?.toLocaleString('en-IN')} M`],
            ['Placed (Free)', `${flock.free_female?.toLocaleString('en-IN')} F + ${flock.free_male?.toLocaleString('en-IN')} M`],
            ['Total Placed', `${flock.total_placed_f?.toLocaleString('en-IN')} F + ${flock.total_placed_m?.toLocaleString('en-IN')} M`],
            ['Transfers', `${totalTrF.toLocaleString('en-IN')} F + ${totalTrM.toLocaleString('en-IN')} M`],
            ['Culls Removed', `${totalCullF.toLocaleString('en-IN')} F + ${totalCullM.toLocaleString('en-IN')} M`],
            ['Mortality (C15/C16)', `${totalMortF.toLocaleString('en-IN')} F + ${totalMortM.toLocaleString('en-IN')} M`],
            ['Closing Alive', `${(lastRecord?.closing_female??0).toLocaleString('en-IN')} F + ${(lastRecord?.closing_male??0).toLocaleString('en-IN')} M`],
            ['Total Eggs', totalEggs.toLocaleString('en-IN')],
            ['Hatching Eggs (HE)', totalHE.toLocaleString('en-IN')],
            ['HE %', pct(hePct)],
            ['HE Dispatched', (heDispatch?.reduce((s,d)=>s+(d.total_dispatched??0),0)??0).toLocaleString('en-IN')],
            ['Free Eggs (2%)', (heDispatch?.reduce((s,d)=>s+(d.free_eggs??0),0)??0).toLocaleString('en-IN')],
            ['Feed ♀ (kg)', totalFeedF.toLocaleString('en-IN')],
            ['Feed ♂ (kg)', totalFeedM.toLocaleString('en-IN')],
            ['Placement', fmtDate(flock.placement_date)],
            ['Laying Start', fmtDate(flock.laying_start_date)],
          ],
        }
      case 'daily':
        return {
          title: `Flock ${flock.flock_no} — Daily Records`,
          headers: ['Date','Week/Day','Open ♀','Open ♂','Feed ♀','Feed ♂','Eggs','HD%','HE','HE%','Tr ♀','Cull ♀','Mort ♀','Mort ♂','Close ♀','Close ♂'],
          rightAlignFrom: 2,
          rows: displayDaily.map((d: any) => {
            const ageLabel = flockAgeLabel(flock.placement_date, d.record_date)
            return [
              fmtDate(d.record_date), ageLabel,
              d.opening_female ?? 0, d.opening_male ?? 0, d.feed_female_kg ?? 0, d.feed_male_kg ?? 0,
              d.total_eggs ?? 0, d.hd_pct != null ? pct(d.hd_pct,1) : '—',
              d.he_eggs ?? 0, d.he_pct != null ? pct(d.he_pct,1) : '—',
              (d.transfer_female??d.trcull_female??0) || '—', d.cull_female || '—',
              d.mortality_female || '—', d.mortality_male || '—', d.closing_female ?? 0, d.closing_male ?? 0,
            ]
          }),
        }
      case 'weekly':
        return {
          title: `Flock ${flock.flock_no} — Weekly Report`,
          headers: ['Week','Date Range','Days Logged','Open ♀','Close ♀','Close ♂','Total Eggs','HD%','HE','HE%','Mort ♀','Mort ♂','Feed ♀','Feed ♂'],
          rightAlignFrom: 2,
          rows: weeklyAgg.map((w: any) => [
            w.weekNum < 0 ? 'Pre-placement' : `Week ${w.weekNum}`, `${fmtDate(w.firstDate)} – ${fmtDate(w.lastDate)}`, `${w.days}/7`,
            w.openF, w.closeF, w.closeM, w.totalEggs, w.hdPct != null ? pct(w.hdPct,1) : '—',
            w.totalHE, w.hePct != null ? pct(w.hePct,1) : '—', w.mortF || '—', w.mortM || '—', w.feedF, w.feedM,
          ]),
        }
      case 'monthly':
        return {
          title: `Flock ${flock.flock_no} — Monthly Report`,
          headers: ['Month','Days','Eggs','HE','HE%','Avg Open ♀','Mort ♀','Feed ♀ kg','Feed ♂ kg'],
          rightAlignFrom: 1,
          rows: monthlyRows.map((m: any) => [
            m.month, m.days, m.eggs, m.he, m.eggs > 0 ? pct(m.he/m.eggs) : '—',
            Math.round(m.avgF), m.mortF || '—', m.feedF, m.feedM,
          ]),
        }
      case 'placements':
        return {
          title: `Flock ${flock.flock_no} — Chick Placements`,
          headers: ['Date','Shed','Female','Male','Total Birds','Notes'],
          rightAlignFrom: 2,
          rows: (placements ?? []).map((p: any) => [
            fmtDate(p.allocated_date), p.shed ? `${p.shed.shed_no}${p.shed.shed_name ? ' — '+p.shed.shed_name : ''}` : '—',
            p.female_count ?? 0, p.male_count ?? 0, (p.female_count??0)+(p.male_count??0), p.notes ?? '—',
          ]),
        }
      case 'transfers':
        return {
          title: `Flock ${flock.flock_no} — Transfers`,
          headers: ['Date','From','To','♀ Transferred','♂ Transferred','Sex Errors','Sold','Notes','Status'],
          rightAlignFrom: 3,
          rows: (transfers ?? []).map((t: any) => [
            fmtDate(t.transfer_date), t.from_farm?.name ?? 'KRP', t.to_farm?.name ?? '—',
            t.female_count ?? 0, t.male_count ?? 0,
            `${t.sex_error_female||0}♀ ${t.sex_error_male||0}♂`, `${t.sold_female||0}♀ ${t.sold_male||0}♂`,
            t.notes ?? '—', t.is_final_transfer ? 'Final' : 'Partial',
          ]),
        }
      case 'financial':
        // Prints the SAME figures the tab is showing, range included. It used
        // to print the lifetime totals and the old "Partial Cost" line, so a
        // filtered screen and its printout disagreed — and the printout was
        // the one that left out feed, salary and electricity.
        return {
          title: `Flock ${flock.flock_no} — Financial Summary`,
          subtitle: finRanged
            ? `${heFromDate ? fmtDate(heFromDate) : 'start'} to ${heToDate ? fmtDate(heToDate) : 'today'}`
            : 'Whole life of the flock',
          headers: ['Item', 'Amount'],
          rightAlignFrom: 1,
          rows: [
            ['HE Revenue', inr(fHeRevenue)],
            ...Object.entries(fNheSales.reduce((acc: any, s2: any) => {
              if (s2.nhe_sale_lines?.length > 0) s2.nhe_sale_lines.forEach((l: any) => { acc[l.sale_type] = (acc[l.sale_type] ?? 0) + (l.amount ?? 0) })
              else acc[s2.sale_type] = (acc[s2.sale_type] ?? 0) + (s2.amount ?? 0)
              return acc
            }, {}) ?? {}).map(([type, amt]: any) => [`• ${NHE_LABEL[type] ?? type}`, inr(amt)]),
            ['TOTAL REVENUE', inr(fTotalRevenue)],
            ['', ''],
            ['Chick Cost', fChickCost ? inr(fChickCost) : 'outside range'],
            ['Medicine & Vaccine (qty × stock rate)', inr(fMedCost)],
            [`Feed Cost (${fFeedKg.toLocaleString('en-IN')} kg)`, inr(fFeedCost)],
            ...(fFeedKgUnpriced > 0
              ? [[`  ⚠ ${fFeedKgUnpriced.toLocaleString('en-IN')} kg unpriced — excluded`, '']] : []),
            ...Object.entries(fOtherExpByCat).map(([cat, amt]: any) => [`• ${cat}`, inr(amt)]),
            ['DIRECT COST', inr(fDirectCost)],
            ['Salary (site total, not split)', inr(fSalaryCost)],
            ['Electricity (site, all meters)', inr(fElectricityCost)],
            ['TOTAL COST', inr(fTotalCost)],
            [`Cost per Egg (on ${fEggs.toLocaleString('en-IN')} eggs)`, fEggs > 0 ? `Rs ${fCostPerEgg.toFixed(3)}` : '—'],
            ['', ''],
            [`HE DISPATCH (${displayHeDispatch.length} records)`, ''],
            ...displayHeDispatch.map((d: any) => [
              `${fmtDate(d.dispatch_date)} — DC ${d.dc_no ?? '—'} · ${(d.total_dispatched ?? 0).toLocaleString('en-IN')} eggs`,
              d.amount ? inr(d.amount) : '—',
            ]),
            ['DISPATCH TOTAL', inr(displayHeDispatch.reduce((a: number, d: any) => a + (d.amount ?? 0), 0))],
          ],
        }
      case 'costincome':
        // Month rows carry the complete cost; day rows carry the direct costs.
        // Both are printed, so the sheet matches the screen exactly.
        return {
          title: `Flock ${flock.flock_no} — Cost & Income`,
          subtitle: (ciFrom || ciTo)
            ? `${ciFrom ? fmtDate(ciFrom) : 'start'} to ${ciTo ? fmtDate(ciTo) : 'today'}`
            : 'Whole life of the flock',
          headers: ['Period','Site','Total Eggs','HE Eggs','Egg Value','Actual Sales','Feed','Medicine','Expenses','Chick','Salary*','Electricity*','Total Cost','Cost/Egg'],
          rightAlignFrom: 2,
          rows: [
            ['— MONTH-WISE (complete cost) —', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ...ciMonthly.map((r: any) => [
              r.month, r.site, r.eggs, r.he, inr(r.value), inr(r.sales),
              inr(r.feedCost), inr(r.med), inr(r.exp), r.chick ? inr(r.chick) : '—',
              inr(r.sal), inr(r.elec), inr(r.total), r.eggs > 0 ? `Rs ${r.perEgg.toFixed(3)}` : '—',
            ]),
            ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['— DAY-WISE (direct cost only) —', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ...ciDaily.map((r: any) => [
              fmtDate(r.date), r.site, r.eggs, r.he, inr(r.value), inr(r.sales),
              inr(r.feedCost), inr(r.med), inr(r.exp), r.chick ? inr(r.chick) : '—',
              '—', '—', inr(r.cost), r.eggs > 0 ? `Rs ${r.perEgg.toFixed(3)}` : '—',
            ]),
            ['DAY TOTAL', '',
              ciDaily.reduce((a: number, r: any) => a + r.eggs, 0),
              ciDaily.reduce((a: number, r: any) => a + r.he, 0),
              inr(ciDaily.reduce((a: number, r: any) => a + r.value, 0)),
              inr(ciDaily.reduce((a: number, r: any) => a + r.sales, 0)),
              inr(ciDaily.reduce((a: number, r: any) => a + r.feedCost, 0)),
              inr(ciDaily.reduce((a: number, r: any) => a + r.med, 0)),
              inr(ciDaily.reduce((a: number, r: any) => a + r.exp, 0)),
              '—', '—', '—',
              inr(ciDaily.reduce((a: number, r: any) => a + r.cost, 0)), '—'],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['* Salary and Electricity are the SITE totals for the month, not this flock\'s share, and are never split between flocks sharing a site. Day-wise excludes them because they are monthly figures.',
              '', '', '', '', '', '', '', '', '', '', '', '', ''],
          ],
        }
      case 'std':
        return {
          title: `Flock ${flock.flock_no} — Actual vs ${flock.laying_season ?? ''} Standard`,
          headers: ['Age (wk)','Std Cum Depl%','Actual','Var','Std Hen Wk%','Actual','Var','Std HE%','Actual','Var',
            'Std Hatch%','Actual','Var','Std Wk Chicks/HH','Actual','Var','Std Cum Chicks/HH','Actual','Var',
            'Deaths+culls wk','Deaths+culls cum','Eggs','HE eggs','Bird-days','Eggs set','Chicks hatched'],
          rightAlignFrom: 1,
          rows: stdExportRows.map((r: any) => {
            const f = (v: number|null, d=1) => v != null ? v.toFixed(d) : '—'
            return [
              r.s.week_of_age, f(r.s.cum_depletion_pct), f(r.cumDepletion), f(r.vDepletion),
              f(r.s.hen_week_pct), f(r.actualHd), f(r.vHd),
              f(r.s.he_pct), f(r.actualHe), f(r.vHe),
              f(r.s.hatch_pct), f(r.actualHatch), f(r.vHatch),
              f(r.s.weekly_chicks_hh, 2), f(r.weeklyChicksHh, 2), f(r.vChicksHh, 2),
              f(r.s.cum_chicks_hh, 2), f(r.cumChicksHh, 2), f(r.vCumChicksHh, 2),
              r.deaths ?? '', r.cumDeaths ?? '', r.eggs ?? '', r.heEggs ?? '',
              r.birdDays ?? '', r.eggsSet ?? '', r.chicks ?? '',
            ]
          }),
        }
      default:
        return null
    }
  }
  const handleTabExport = () => {
    const d = getTabExportData()
    if (!d) return
    exportCSV(`flock_${flock.flock_no}_${tab}.csv`, d.headers, d.rows)
  }
  const handleTabPrint = () => {
    const d = getTabExportData()
    if (!d) return
    printReport({ title: d.title, subtitle: d.subtitle, headers: d.headers, rows: d.rows, rightAlignFrom: d.rightAlignFrom })
  }

  // CSV template download
  const handleDownloadTemplate = () => {
    const headers = 'flock_no,record_date,opening_female,opening_male,feed_female_kg,feed_male_kg,he_eggs,je_eggs,te_eggs,be_eggs,le_eggs,transfer_female,transfer_male,cull_female,cull_male,mortality_female,mortality_male'
    const blob = new Blob([headers + '\n'], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daily_records_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import handler (CSV or Excel)
  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const { headers: hdrs, rows: rawRows } = await parseFile(file)
      if (rawRows.length === 0) { toast.error('Empty file'); return }
      const records = rawRows.map(vals => { const obj: any = {}; hdrs.forEach((h,i) => { obj[h] = vals[i]??'' }); return obj })
      const rows = records.map((r: any) => {
        const openingF = parseInt(r.opening_female) || 0
        const openingM = parseInt(r.opening_male) || 0
        const heEggs = parseInt(r.he_eggs) || 0
        const jeEggs = parseInt(r.je_eggs) || 0
        const teEggs = parseInt(r.te_eggs) || 0
        const beEggs = parseInt(r.be_eggs) || 0
        const leEggs = parseInt(r.le_eggs) || 0
        const transferF = parseInt(r.transfer_female) || parseInt(r.trcull_female) || 0
        const transferM = parseInt(r.transfer_male)   || parseInt(r.trcull_male)   || 0
        const cullF = parseInt(r.cull_female) || 0
        const cullM = parseInt(r.cull_male)   || 0
        const mortalityF = parseInt(r.mortality_female) || 0
        const mortalityM = parseInt(r.mortality_male) || 0
        return {
          flock_id: id,
          record_date: r.record_date,
          opening_female: openingF || null,
          opening_male: openingM || null,
          feed_female_kg: parseFloat(r.feed_female_kg) || null,
          feed_male_kg: parseFloat(r.feed_male_kg) || null,
          total_eggs: heEggs + jeEggs + teEggs + beEggs + leEggs,
          he_eggs: heEggs || null,
          je_eggs: jeEggs || null,
          te_eggs: teEggs || null,
          be_eggs: beEggs || null,
          le_eggs: leEggs || null,
          transfer_female: transferF,
          transfer_male:   transferM,
          cull_female:     cullF,
          cull_male:       cullM,
          trcull_female:   transferF + cullF,
          trcull_male:     transferM + cullM,
          mortality_female: mortalityF,
          mortality_male: mortalityM,
          closing_female: Math.max(0, openingF - mortalityF - transferF - cullF),
          closing_male: Math.max(0, openingM - mortalityM - transferM - cullM),
        }
      }).filter((r: any) => r.record_date)

      const { error } = await supabase.from('daily_records').upsert(rows, { onConflict: 'flock_id,record_date' })
      if (error) throw error
      toast.success(`Imported ${rows.length} records!`)
      qc.invalidateQueries({ queryKey: ['flock_daily', id] })
    } catch (e: any) {
      toast.error('Import failed: ' + e.message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/flocks" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} className="text-gray-500"/>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Flock {flock.flock_no}</h1>
            <Badge color={flock.status === 'laying' ? 'green' : flock.status === 'rearing' ? 'yellow' : 'gray'}>
              {flock.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {flock.breed} • {flock.rearing_farm?.name ?? '—'}{flock.laying_farm?.name ? ` → ${flock.laying_farm.name}` : ''} • Age: {ageWeeks} weeks
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link to="/flocks/daily">
            <Button variant="outline" size="sm" icon={<Calendar size={14}/>}>Daily Entry</Button>
          </Link>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard title="Total Eggs" value={totalEggs.toLocaleString('en-IN')}
          subtitle="Lifetime production" icon={<Egg size={18}/>} color="text-yellow-600" />
        <StatCard title="HE Eggs" value={totalHE.toLocaleString('en-IN')}
          subtitle={pct(hePct)+' of eggs'} icon={<Egg size={18}/>} color="text-brand-600" />
        <StatCard title="Alive ♀" value={(lastRecord
            ? (lastRecord.closing_female > 0 ? lastRecord.closing_female : (lastRecord.opening_female > 0 ? lastRecord.opening_female : 0))
            : flock.total_placed_f
          )?.toLocaleString('en-IN')}
          subtitle={'Mortality: '+totalMortF.toLocaleString('en-IN')} icon={<Bird size={18}/>} color="text-green-600" />
        <StatCard title="HE Revenue" value={inr(heRevenue)}
          subtitle="From HE Dispatch records" icon={<DollarSign size={18}/>} color="text-green-700" />
        <StatCard title="Total Revenue" value={inr(totalRevenue)}
          subtitle="HE + NHE all sources" icon={<TrendingUp size={18}/>} color="text-green-700" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['overview','placements','daily','weekly','monthly','financial','costincome','transfers','std'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px
              ${tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'std' ? 'vs Standard' : t === 'costincome' ? 'Cost & Income' : t}
          </button>
        ))}
      </div>

      {/* Export/Print — same data as whichever tab is active. Daily has its
          own Export Excel already (date-range aware), so skip the generic
          one there to avoid two differently-scoped Export buttons. */}
      <div className="flex justify-end gap-2">
        {tab !== 'daily' && (
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleTabExport}>Export</Button>
        )}
        <Button variant="outline" size="sm" icon={<Printer size={14}/>} onClick={handleTabPrint}>Print</Button>
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bird reconciliation */}
            <Card>
              <CardHeader title="Bird Reconciliation" />
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Placed (Paid)', flock.paid_female?.toLocaleString('en-IN')+' F + '+flock.paid_male?.toLocaleString('en-IN')+' M'],
                    ['Placed (Free)', flock.free_female?.toLocaleString('en-IN')+' F + '+flock.free_male?.toLocaleString('en-IN')+' M'],
                    ['Total Placed', flock.total_placed_f?.toLocaleString('en-IN')+' F + '+flock.total_placed_m?.toLocaleString('en-IN')+' M'],
                    ['Transfers', totalTrF.toLocaleString('en-IN')+' F + '+totalTrM.toLocaleString('en-IN')+' M'],
                    ['Culls Removed', totalCullF.toLocaleString('en-IN')+' F + '+totalCullM.toLocaleString('en-IN')+' M'],
                    ['Mortality (C15/C16)', totalMortF.toLocaleString('en-IN')+' F + '+totalMortM.toLocaleString('en-IN')+' M'],
                    ['Closing Alive', (lastRecord?.closing_female??0).toLocaleString('en-IN')+' F + '+(lastRecord?.closing_male??0).toLocaleString('en-IN')+' M'],
                  ].map(([label, val]) => (
                    <tr key={label as string} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-gray-500 font-medium">{label}</td>
                      <td className="py-2 text-right font-semibold text-gray-900">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Production summary */}
            <Card>
              <CardHeader title="Production Summary" />
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Total Eggs', totalEggs.toLocaleString('en-IN')],
                    ['Hatching Eggs (HE)', totalHE.toLocaleString('en-IN')],
                    ['HE %', pct(hePct)],
                    ['HE Dispatched', (heDispatch?.reduce((s,d)=>s+(d.total_dispatched??0),0)??0).toLocaleString('en-IN')],
                    ['Free Eggs (2%)', (heDispatch?.reduce((s,d)=>s+(d.free_eggs??0),0)??0).toLocaleString('en-IN')],
                    ['Feed ♀ (kg)', totalFeedF.toLocaleString('en-IN')],
                    ['Feed ♂ (kg)', totalFeedM.toLocaleString('en-IN')],
                    ['Placement', fmtDate(flock.placement_date)],
                    ['Laying Start', fmtDate(flock.laying_start_date)],
                  ].map(([label, val]) => (
                    <tr key={label as string} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-gray-500 font-medium">{label}</td>
                      <td className="py-2 text-right font-semibold text-gray-900">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Chart */}
          {monthlyData.length > 0 && (
            <Card>
              <CardHeader title="Monthly Production" />
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData} margin={{ top:4, right:8, bottom:4, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => v.toLocaleString('en-IN')} />
                  <Legend />
                  <Bar dataKey="eggs" fill="#22c55e" name="Total Eggs" />
                  <Bar dataKey="he"   fill="#3b82f6" name="HE Eggs" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* DAILY TAB */}
      {tab === 'daily' && (
        <>
          {/* Daily tab action bar: import/export buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleDownloadTemplate}>
              Download Template
            </Button>
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={() => {
              // Export exactly what the table shows: the date-range filter
              // applied (previously ignored — this always exported every
              // record regardless of From/To) and multi-shed rows summed
              // into one row per day (previously exported the raw per-shed
              // rows). Previously also missing Feed/Eggs/HD%/HE/HE% columns
              // entirely, even though they're all visible on screen.
              const rows = [...displayDaily].reverse()
              exportCSV(
                `flock_${flock?.flock_no ?? id}_daily_records.csv`,
                ['Date','Week/Day','Opening F','Opening M','Feed F (kg)','Feed M (kg)','Total Eggs','HD%','HE Eggs','HE%','Transfer F','Cull F','Mortality F','Mortality M','Closing F','Closing M'],
                rows.map((d: any) => {
                  const ageLabel = flockAgeLabel(flock?.placement_date, d.record_date)
                  return [
                    d.record_date, ageLabel,
                    d.opening_female ?? 0, d.opening_male ?? 0,
                    d.feed_female_kg ?? 0, d.feed_male_kg ?? 0,
                    d.total_eggs ?? 0, d.hd_pct != null ? (d.hd_pct * 100).toFixed(1) : '',
                    d.he_eggs ?? 0, d.he_pct != null ? (d.he_pct * 100).toFixed(1) : '',
                    d.transfer_female ?? d.trcull_female ?? 0, d.cull_female ?? 0,
                    d.mortality_female ?? 0, d.mortality_male ?? 0,
                    d.closing_female ?? 0, d.closing_male ?? 0,
                  ]
                }).concat([[
                  `TOTAL (${rows.length} days${(fromDate || toDate) ? ' in range' : ''})`, '', '', '',
                  totalFeedF, totalFeedM, totalEggs, pct(hePct, 1),
                  totalHE, pct(hePct, 1), totalTrF, totalCullF, totalMortF, totalMortM,
                  lastRecord?.closing_female ?? '', lastRecord?.closing_male ?? '',
                ]])
              )
            }}>
              Export Excel
            </Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>}
              loading={importing}
              onClick={() => fileInputRef.current?.click()}>
              Import CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleImport(file)
              }}
            />
          </div>

          {/* Date filter bar */}
          <div className="flex items-center gap-3 flex-wrap bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-sm font-medium text-gray-600">Filter:</span>
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              From
              <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm" />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              To
              <DateInput value={toDate} onChange={e => setToDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm" />
            </label>
            {(fromDate || toDate) && (
              <button onClick={() => { setFromDate(''); setToDate('') }}
                className="text-xs text-brand-600 hover:text-brand-800 underline">Clear</button>
            )}
            <span className="text-xs text-gray-500 ml-auto">
              Showing {displayDaily.length} of {uniqueDates} days
              {daily && daily.length > uniqueDates ? ` (${daily.length} records across ${uniqueDates} days, multi-shed aggregated)` : ''}
            </span>
          </div>

          <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-2 sticky left-0 bg-gray-50"><CB checked={allDailySel} indeterminate={someDailySel && !allDailySel} onChange={toggleAllDaily}/></th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50">Date</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-600">Wk/Day</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Open ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Open ♂</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Feed ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Feed ♂</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Eggs</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">HD%</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">HE</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">HE%</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Tr ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Cull ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Mort ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Mort ♂</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Close ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Close ♂</th>
                  </tr>
                </thead>
                <tbody>
                  {displayDaily.map((d) => {
                    const isLayingPeriod = flock.laying_start_date && d.record_date >= flock.laying_start_date
                    const ageLabel = flockAgeLabel(flock.placement_date, d.record_date)
                    return (
                      <tr key={d.record_date} className={`border-b border-gray-50 hover:bg-gray-50
                        ${sel.has(d.record_date) ? 'bg-red-50' : isLayingPeriod ? 'bg-green-50/30' : 'bg-yellow-50/30'}`}>
                        <td className="px-2 py-1.5"><CB checked={sel.has(d.record_date)} onChange={() => toggleDaily(d.record_date)}/></td>
                        <td className="px-2 py-1.5 sticky left-0 font-medium"
                          style={{ backgroundColor: sel.has(d.record_date) ? '#fef2f2' : isLayingPeriod ? '#f0fdf4' : '#fefce8' }}>
                          {fmtDate(d.record_date)}{d._sheds > 1 ? <span className="ml-1 text-blue-400 text-[10px]">{d._sheds} sheds</span> : ''}
                        </td>
                        <td className="px-2 py-1.5 text-gray-400 text-xs whitespace-nowrap">{ageLabel}</td>
                        <td className="px-2 py-1.5 text-right">{d.opening_female?.toLocaleString('en-IN')}</td>
                        <td className="px-2 py-1.5 text-right">{d.opening_male?.toLocaleString('en-IN')}</td>
                        <td className="px-2 py-1.5 text-right">{d.feed_female_kg?.toLocaleString('en-IN')}</td>
                        <td className="px-2 py-1.5 text-right">{d.feed_male_kg?.toLocaleString('en-IN')}</td>
                        <td className="px-2 py-1.5 text-right font-medium">{d.total_eggs?.toLocaleString('en-IN')}</td>
                        <td className={`px-2 py-1.5 text-right ${(d.hd_pct??0)>0.85?'text-green-600':'text-orange-500'}`}>
                          {pct(d.hd_pct, 1)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium text-blue-600">{d.he_eggs?.toLocaleString('en-IN')}</td>
                        <td className={`px-2 py-1.5 text-right ${(d.he_pct??0)>0.88?'text-green-600':'text-orange-500'}`}>
                          {pct(d.he_pct, 1)}
                        </td>
                        <td className="px-2 py-1.5 text-right text-blue-500">{(d.transfer_female??d.trcull_female??0) > 0 ? (d.transfer_female??d.trcull_female) : '—'}</td>
                        <td className="px-2 py-1.5 text-right text-orange-500">{(d.cull_female??0) > 0 ? d.cull_female : '—'}</td>
                        <td className="px-2 py-1.5 text-right text-red-500">{d.mortality_female > 0 ? d.mortality_female : '—'}</td>
                        <td className="px-2 py-1.5 text-right text-red-500">{d.mortality_male > 0 ? d.mortality_male : '—'}</td>
                        <td className="px-2 py-1.5 text-right">{d.closing_female?.toLocaleString('en-IN')}</td>
                        <td className="px-2 py-1.5 text-right">{d.closing_male?.toLocaleString('en-IN')}</td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Totals row */}
                {daily && daily.length > 0 && (
                  <tfoot>
                    <tr className="bg-yellow-50 font-bold text-xs">
                      <td className="px-2 py-2"></td>
                      <td className="px-2 py-2 sticky left-0 bg-yellow-50" colSpan={2}>TOTAL ({displayDaily.length} days{(fromDate || toDate) ? ' in range' : ''})</td>
                      <td className="px-2 py-2 text-right">—</td>
                      <td className="px-2 py-2 text-right">—</td>
                      <td className="px-2 py-2 text-right">{totalFeedF.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{totalFeedM.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{totalEggs.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{pct(hePct,1)}</td>
                      <td className="px-2 py-2 text-right">{totalHE.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{pct(hePct,1)}</td>
                      <td className="px-2 py-2 text-right">{totalTrF.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{totalCullF.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{totalMortF.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{totalMortM.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{lastRecord?.closing_female?.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{lastRecord?.closing_male?.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
          {bulkConfirm && (
            <ConfirmBulkDelete label={`Delete ${sel.size} daily records? This cannot be undone.`}
              onConfirm={() => bulkDelMut.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
          )}
        </>
      )}

      {/* WEEKLY TAB — rolled up by this flock's own week-of-age, from Daily records */}
      {tab === 'weekly' && (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-2 text-left font-semibold text-gray-600">Week</th>
                  <th className="px-2 py-2 text-left font-semibold text-gray-600">Date Range</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">Days Logged</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">Open ♀</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">Close ♀</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">Close ♂</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">Total Eggs</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">HD%</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">HE</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">HE%</th>
                  <th className="px-2 py-2 text-right font-semibold text-red-500">Mort ♀</th>
                  <th className="px-2 py-2 text-right font-semibold text-red-500">Mort ♂</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">Feed ♀</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">Feed ♂</th>
                </tr>
              </thead>
              <tbody>
                {weeklyAgg.map((w: any) => (
                  <tr key={w.weekNum} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-2 py-1.5 font-medium">{w.weekNum < 0 ? 'Pre-placement' : `Week ${w.weekNum}`}</td>
                    <td className="px-2 py-1.5 text-gray-400 whitespace-nowrap">{fmtDate(w.firstDate)} – {fmtDate(w.lastDate)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-400">{w.days}/7</td>
                    <td className="px-2 py-1.5 text-right">{w.openF?.toLocaleString('en-IN')}</td>
                    <td className="px-2 py-1.5 text-right">{w.closeF?.toLocaleString('en-IN')}</td>
                    <td className="px-2 py-1.5 text-right">{w.closeM?.toLocaleString('en-IN')}</td>
                    <td className="px-2 py-1.5 text-right font-medium">{w.totalEggs.toLocaleString('en-IN')}</td>
                    <td className={`px-2 py-1.5 text-right ${(w.hdPct??0)>0.85?'text-green-600':'text-orange-500'}`}>{w.hdPct != null ? pct(w.hdPct, 1) : '—'}</td>
                    <td className="px-2 py-1.5 text-right font-medium text-blue-600">{w.totalHE.toLocaleString('en-IN')}</td>
                    <td className={`px-2 py-1.5 text-right ${(w.hePct??0)>0.88?'text-green-600':'text-orange-500'}`}>{w.hePct != null ? pct(w.hePct, 1) : '—'}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{w.mortF > 0 ? w.mortF : '—'}</td>
                    <td className="px-2 py-1.5 text-right text-red-500">{w.mortM > 0 ? w.mortM : '—'}</td>
                    <td className="px-2 py-1.5 text-right">{w.feedF.toLocaleString('en-IN')}</td>
                    <td className="px-2 py-1.5 text-right">{w.feedM.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {weeklyAgg.length === 0 && (
                  <tr><td colSpan={14} className="text-center text-gray-400 py-6">No daily records yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MONTHLY TAB */}
      {tab === 'monthly' && (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Month</Th><Th right>Days</Th><Th right>Eggs</Th><Th right>HE</Th>
              <Th right>HE%</Th><Th right>Avg Open ♀</Th><Th right>Mort ♀</Th>
              <Th right>Feed ♀ kg</Th><Th right>Feed ♂ kg</Th>
            </tr></thead>
            <tbody>
              {monthlyRows.map((m: any) => (
                  <tr key={m.month} className="hover:bg-gray-50">
                    <Td className="font-medium">{m.month}</Td>
                    <Td right>{m.days}</Td>
                    <Td right className="font-medium">{m.eggs.toLocaleString('en-IN')}</Td>
                    <Td right className="text-blue-600 font-medium">{m.he.toLocaleString('en-IN')}</Td>
                    <Td right>
                      <span className={m.eggs > 0 && (m.he/m.eggs) > 0.88 ? 'text-green-600' : 'text-orange-500'}>
                        {m.eggs > 0 ? pct(m.he/m.eggs) : '—'}
                      </span>
                    </Td>
                    <Td right>{Math.round(m.avgF).toLocaleString('en-IN')}</Td>
                    <Td right className="text-red-500">{m.mortF > 0 ? m.mortF : '—'}</Td>
                    <Td right>{m.feedF.toLocaleString('en-IN')}</Td>
                    <Td right>{m.feedM.toLocaleString('en-IN')}</Td>
                  </tr>
              ))}
            </tbody>
            {monthlyRows.length > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                <Td>TOTAL ({monthlyRows.length} months)</Td>
                <Td right>{monthlyRows.reduce((s: number, m: any) => s + (m.days ?? 0), 0)}</Td>
                <Td right>{monthlyRows.reduce((s: number, m: any) => s + (m.eggs ?? 0), 0).toLocaleString('en-IN')}</Td>
                <Td right>{monthlyRows.reduce((s: number, m: any) => s + (m.he ?? 0), 0).toLocaleString('en-IN')}</Td>
                <Td right>
                  {(() => {
                    const e = monthlyRows.reduce((s: number, m: any) => s + (m.eggs ?? 0), 0)
                    const h = monthlyRows.reduce((s: number, m: any) => s + (m.he ?? 0), 0)
                    return e > 0 ? pct(h / e) : '—'
                  })()}
                </Td>
                {/* Average birds is deliberately blank: averaging monthly
                    averages over months of different lengths gives a figure
                    that belongs to no month. */}
                <Td right className="text-gray-400">—</Td>
                <Td right className="text-red-500">{monthlyRows.reduce((s: number, m: any) => s + (m.mortF ?? 0), 0).toLocaleString('en-IN')}</Td>
                <Td right>{Math.round(monthlyRows.reduce((s: number, m: any) => s + (m.feedF ?? 0), 0)).toLocaleString('en-IN')}</Td>
                <Td right>{Math.round(monthlyRows.reduce((s: number, m: any) => s + (m.feedM ?? 0), 0)).toLocaleString('en-IN')}</Td>
              </tr></tfoot>
            )}
          </Table>
        </Card>
      )}

      {/* PLACEMENTS TAB */}
      {tab === 'placements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-gray-800">Chick Placements</h3>
              <p className="text-xs text-gray-400 mt-0.5">Record each batch of chicks received — per shed, per day. Total Placed on the flock updates automatically.</p>
            </div>
            <Button size="sm" onClick={() => { setPlacementForm({ allocated_date: flock?.placement_date ?? '', shed_id: '', female_count: '', male_count: '', notes: '' }); setEditPlacementId(null); setShowPlacementForm(true) }}>
              + Add Placement
            </Button>
          </div>

          {showPlacementForm && (
            <Card>
              <CardHeader title={editPlacementId ? 'Edit Placement' : 'Record Chick Intake'} />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DateInput label="Date Received" required value={placementForm.allocated_date}
                    onChange={e => setPlacementForm(f => ({ ...f, allocated_date: e.target.value }))} />
                  <Select label="Shed" placeholder="— Select shed —"
                    options={(allSheds ?? []).map((s: any) => ({ value: s.id, label: `${s.shed_no}${s.shed_name ? ' — ' + s.shed_name : ''}` }))}
                    value={placementForm.shed_id}
                    onChange={e => setPlacementForm(f => ({ ...f, shed_id: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Female Count" type="number" required value={placementForm.female_count}
                    onChange={e => setPlacementForm(f => ({ ...f, female_count: e.target.value }))} />
                  <Input label="Male Count" type="number" value={placementForm.male_count}
                    onChange={e => setPlacementForm(f => ({ ...f, male_count: e.target.value }))} />
                </div>
                <Input label="Notes" value={placementForm.notes}
                  onChange={e => setPlacementForm(f => ({ ...f, notes: e.target.value }))} />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => { setShowPlacementForm(false); setEditPlacementId(null) }}>Cancel</Button>
                  <Button size="sm" loading={savePlacementMut.isPending} onClick={() => savePlacementMut.mutate()}>
                    {editPlacementId ? 'Update' : 'Save Placement'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {(placements ?? []).length === 0 ? (
            <Card>
              <div className="text-center py-8 text-gray-400 text-sm">
                No placements recorded yet. Click "Add Placement" to record your first chick batch.
              </div>
            </Card>
          ) : (
            <Card>
              {selPlacements.size > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-3">
                  <span className="text-sm font-medium text-red-700">{selPlacements.size} selected</span>
                  <button onClick={() => setSelPlacements(new Set())} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
                  <div className="ml-auto">
                    <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} onClick={() => setBulkPlacementConfirm(true)}>
                      Delete {selPlacements.size}
                    </Button>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                      <th className="px-3 py-2 w-8">
                        <CB
                          checked={(placements ?? []).length > 0 && selPlacements.size === (placements ?? []).length}
                          indeterminate={selPlacements.size > 0 && selPlacements.size < (placements ?? []).length}
                          onChange={() => {
                            if (selPlacements.size === (placements ?? []).length) setSelPlacements(new Set())
                            else setSelPlacements(new Set((placements ?? []).map((p: any) => p.id)))
                          }}
                        />
                      </th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Shed</th>
                      <th className="px-3 py-2 text-right">Female</th>
                      <th className="px-3 py-2 text-right">Male</th>
                      <th className="px-3 py-2 text-right">Total Birds</th>
                      <th className="px-3 py-2 text-right">Shed Capacity</th>
                      <th className="px-3 py-2 text-right">Box Usage</th>
                      <th className="px-3 py-2 text-right">Utilization</th>
                      <th className="px-3 py-2">Notes</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(placements ?? []).map((p: any) => {
                      const total = (p.female_count ?? 0) + (p.male_count ?? 0)
                      const capF = p.shed?.capacity_female ?? 0
                      const capM = p.shed?.capacity_male ?? 0
                      const totalCap = capF + capM
                      const birdsPerBox = p.shed?.birds_per_box ?? 0
                      const totalBoxes = p.shed?.total_boxes ?? 0
                      const usedBoxes = birdsPerBox > 0 ? Math.ceil(total / birdsPerBox) : null
                      const utilPct = totalCap > 0 ? Math.round(total / totalCap * 100) : null
                      const utilColor = utilPct == null ? '' : utilPct > 100 ? 'text-red-600 font-bold' : utilPct > 85 ? 'text-orange-500 font-semibold' : 'text-green-600'
                      return (
                      <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${selPlacements.has(p.id) ? 'bg-red-50' : ''}`}>
                        <td className="px-3 py-2">
                          <CB checked={selPlacements.has(p.id)} onChange={() => setSelPlacements(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n })} />
                        </td>
                        <td className="px-3 py-2">{fmtDate(p.allocated_date)}</td>
                        <td className="px-3 py-2">{p.shed ? `${p.shed.shed_no}${p.shed.shed_name ? ' — ' + p.shed.shed_name : ''}` : <span className="text-gray-400">—</span>}</td>
                        <td className="px-3 py-2 text-right">{p.female_count?.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{p.male_count?.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right font-medium">{total.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right text-xs text-gray-500">{totalCap > 0 ? `${capF}F + ${capM}M = ${totalCap}` : '—'}</td>
                        <td className="px-3 py-2 text-right text-xs text-gray-500">{usedBoxes != null ? `${usedBoxes} / ${totalBoxes}` : '—'}</td>
                        <td className={`px-3 py-2 text-right text-xs ${utilColor}`}>{utilPct != null ? `${utilPct}%` : '—'}</td>
                        <td className="px-3 py-2 text-gray-400 text-xs">{p.notes ?? '—'}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2 justify-end">
                            <button className="text-xs text-blue-600 hover:underline" onClick={() => {
                              setPlacementForm({ allocated_date: p.allocated_date, shed_id: p.shed_id ?? '', female_count: p.female_count?.toString() ?? '', male_count: p.male_count?.toString() ?? '', notes: p.notes ?? '' })
                              setEditPlacementId(p.id); setShowPlacementForm(true)
                            }}>Edit</button>
                            <button className="text-xs text-red-500 hover:underline" onClick={() => { if (confirm('Delete this placement?')) delPlacementMut.mutate(p.id) }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold text-sm">
                      <td className="px-3 py-2" colSpan={3}>Total Received</td>
                      <td className="px-3 py-2 text-right">{(placements ?? []).reduce((s: number, p: any) => s + (p.female_count ?? 0), 0).toLocaleString('en-IN')} F</td>
                      <td className="px-3 py-2 text-right">{(placements ?? []).reduce((s: number, p: any) => s + (p.male_count ?? 0), 0).toLocaleString('en-IN')} M</td>
                      <td className="px-3 py-2 text-right text-brand-700">{(placements ?? []).reduce((s: number, p: any) => s + (p.female_count ?? 0) + (p.male_count ?? 0), 0).toLocaleString('en-IN')}</td>
                      <td colSpan={4}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3 px-1">
                ✓ "Total Placed" on the flock overview updates automatically from these placement records.
              </p>
            </Card>
          )}
          {bulkPlacementConfirm && (
            <ConfirmBulkDelete label={`Delete ${selPlacements.size} placement records? This cannot be undone.`}
              onConfirm={() => bulkDelPlacementMut.mutate([...selPlacements])}
              onCancel={() => setBulkPlacementConfirm(false)} />
          )}
        </div>
      )}

      {/* TRANSFERS TAB */}
      {tab === 'transfers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-gray-800">Flock Transfers</h3>
              <p className="text-xs text-gray-400 mt-0.5">Record bird movements between sites. Include sex errors and pre-transfer sales.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const hdrs = ['transfer_date','from_farm','to_farm','from_shed','to_shed','female_count','male_count','sex_error_female','sex_error_male','sold_female','sold_male','notes']
                const ex = [new Date().toISOString().slice(0,10),'Kethereddypally','Agraharam','10','1','8000','800','50','0','0','0','Batch 1']
                const csv = [hdrs, ex].map(r => r.map(v=>`"${v}"`).join(',')).join('\n')
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = 'transfer_template.csv'; a.click()
              }}>Template</Button>
              <Button variant="outline" size="sm" onClick={() => transferImportRef.current?.click()}>Import CSV</Button>
              <input ref={transferImportRef} type="file" accept=".csv" className="hidden" onChange={handleTransferImport}/>
              <Button size="sm" onClick={() => {
                if (showTransferForm) { setShowTransferForm(false); setEditTransferId(null); setTransferForm(blankTransfer()) }
                else { setEditTransferId(null); setTransferForm(blankTransfer()); setShowTransferForm(true) }
              }}>
                {showTransferForm ? 'Cancel' : '+ Add Transfer'}
              </Button>
            </div>
          </div>

          {showTransferForm && (
            <Card>
              <CardHeader title={editTransferId ? 'Edit Transfer Entry' : 'New Transfer Entry'} />
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Transfer Date *</label>
                    <DateInput value={transferForm.transfer_date}
                      onChange={e => setTransferForm(f => ({ ...f, transfer_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">From Farm</label>
                    <select value={transferForm.from_farm_id}
                      onChange={e => setTransferForm(f => ({ ...f, from_farm_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— None —</option>
                      {(farms ?? []).map((fm: any) => <option key={fm.id} value={fm.id}>{fm.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">To Farm *</label>
                    <select value={transferForm.to_farm_id}
                      onChange={e => setTransferForm(f => ({ ...f, to_farm_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— Select —</option>
                      {(farms ?? []).map((fm: any) => <option key={fm.id} value={fm.id}>{fm.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">From Shed</label>
                    <select value={transferForm.from_shed_id}
                      onChange={e => setTransferForm(f => ({ ...f, from_shed_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— None —</option>
                      {(allSheds ?? []).filter((s: any) => !transferForm.from_farm_id || s.farm_id === transferForm.from_farm_id).map((s: any) => <option key={s.id} value={s.id}>{s.shed_no}{s.shed_name ? ' — '+s.shed_name : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">To Shed</label>
                    <select value={transferForm.to_shed_id}
                      onChange={e => setTransferForm(f => ({ ...f, to_shed_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— None —</option>
                      {(allSheds ?? []).filter((s: any) => !transferForm.to_farm_id || s.farm_id === transferForm.to_farm_id).map((s: any) => <option key={s.id} value={s.id}>{s.shed_no}{s.shed_name ? ' — '+s.shed_name : ''}</option>)}
                    </select>
                  </div>
                </div>

                {/* Birds transferred */}
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-semibold text-green-700 mb-2 uppercase">Birds Transferred</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">♀ Female Count</label>
                      <input type="number" min="0" value={transferForm.female_count}
                        onChange={e => setTransferForm(f => ({ ...f, female_count: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">♂ Male Count</label>
                      <input type="number" min="0" value={transferForm.male_count}
                        onChange={e => setTransferForm(f => ({ ...f, male_count: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                  </div>
                </div>

                {/* Birds NOT transferred */}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-2 uppercase">Birds Not Transferred (optional)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Sex Error ♀</label>
                      <input type="number" min="0" value={transferForm.sex_error_female}
                        onChange={e => setTransferForm(f => ({ ...f, sex_error_female: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="Wrong sex removed"/>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Sex Error ♂</label>
                      <input type="number" min="0" value={transferForm.sex_error_male}
                        onChange={e => setTransferForm(f => ({ ...f, sex_error_male: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Sold ♀</label>
                      <input type="number" min="0" value={transferForm.sold_female}
                        onChange={e => setTransferForm(f => ({ ...f, sold_female: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="Sold before shift"/>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Sold ♂</label>
                      <input type="number" min="0" value={transferForm.sold_male}
                        onChange={e => setTransferForm(f => ({ ...f, sold_male: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <input type="text" value={transferForm.notes}
                    onChange={e => setTransferForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Optional notes..." />
                </div>

                {/* Final transfer checkbox */}
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${transferForm.is_final_transfer ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                  <input type="checkbox" checked={transferForm.is_final_transfer}
                    onChange={e => setTransferForm(f => ({ ...f, is_final_transfer: e.target.checked }))}
                    className="mt-0.5 rounded text-green-600"/>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">✅ This is the final transfer — all birds shifted</p>
                    <p className="text-xs text-gray-500 mt-0.5">Checking this will automatically change flock status from <strong>Rearing → Laying</strong> and set the laying farm to the destination.</p>
                  </div>
                </label>

                {editTransferId && (
                  <p className="text-xs text-gray-400">Note: editing updates the transfer record only — it does not re-adjust daily bird counts or flock status.</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowTransferForm(false); setEditTransferId(null); setTransferForm(blankTransfer()) }}>Cancel</Button>
                  {editTransferId ? (
                    <Button size="sm" loading={updateTransferMut.isPending} onClick={() => updateTransferMut.mutate()}>
                      Update Transfer
                    </Button>
                  ) : (
                    <Button size="sm" loading={addTransferMut.isPending} onClick={() => addTransferMut.mutate()}>
                      {transferForm.is_final_transfer ? 'Save & Mark as Laying' : 'Save Transfer'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">From → To</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 text-xs">♀ Transferred</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 text-xs">♂ Transferred</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 text-xs">Sex Errors</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 text-xs">Sold</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">Notes</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">Status</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 text-xs"></th>
                  </tr>
                </thead>
                <tbody>
                  {(transfers ?? []).length === 0 ? (
                    <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400 text-sm">No transfers recorded yet</td></tr>
                  ) : (transfers ?? []).map((t: any) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{fmtDate(t.transfer_date)}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className="text-gray-500">{t.from_farm?.name ?? 'KRP'}</span>
                        <span className="text-gray-400 mx-1">→</span>
                        <span className="font-medium text-brand-700">{t.to_farm?.name ?? '—'}</span>
                        {t.from_shed && <div className="text-gray-400 text-[10px]">Shed {t.from_shed.shed_no} → {t.to_shed?.shed_no ?? '—'}</div>}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-medium">{t.female_count > 0 ? t.female_count.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-3 py-2 text-right text-xs font-medium">{t.male_count > 0 ? t.male_count.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-3 py-2 text-right text-xs text-amber-600">
                        {(t.sex_error_female||0)+(t.sex_error_male||0) > 0
                          ? `${t.sex_error_female||0}♀ ${t.sex_error_male||0}♂` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-orange-600">
                        {(t.sold_female||0)+(t.sold_male||0) > 0
                          ? `${t.sold_female||0}♀ ${t.sold_male||0}♂` : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{t.notes ?? '—'}</td>
                      <td className="px-3 py-2">
                        {t.is_final_transfer
                          ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Final ✓</span>
                          : <span className="text-xs text-gray-400">Partial</span>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button className="text-xs text-blue-600 hover:underline" onClick={() => {
                          setEditTransferId(t.id)
                          setTransferForm({
                            transfer_date: t.transfer_date,
                            from_farm_id: t.from_farm_id ?? '',
                            to_farm_id: t.to_farm_id ?? '',
                            from_shed_id: t.from_shed_id ?? '',
                            to_shed_id: t.to_shed_id ?? '',
                            female_count: (t.female_count ?? 0).toString(),
                            male_count: (t.male_count ?? 0).toString(),
                            sex_error_female: (t.sex_error_female ?? 0).toString(),
                            sex_error_male: (t.sex_error_male ?? 0).toString(),
                            sold_female: (t.sold_female ?? 0).toString(),
                            sold_male: (t.sold_male ?? 0).toString(),
                            is_final_transfer: !!t.is_final_transfer,
                            notes: t.notes ?? '',
                          })
                          setShowTransferForm(true)
                        }}>Edit</button>
                        <button className="text-xs text-red-600 hover:underline ml-3"
                          onClick={() => { if (confirm('Delete this transfer? Bird counts will be restored.')) deleteTransferMut.mutate(t) }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {(transfers ?? []).length > 0 && (() => {
                  const totF = (transfers??[]).reduce((s:number,t:any)=>s+(t.female_count||0),0)
                  const totM = (transfers??[]).reduce((s:number,t:any)=>s+(t.male_count||0),0)
                  const totSEF = (transfers??[]).reduce((s:number,t:any)=>s+(t.sex_error_female||0),0)
                  const totSEM = (transfers??[]).reduce((s:number,t:any)=>s+(t.sex_error_male||0),0)
                  const totSF = (transfers??[]).reduce((s:number,t:any)=>s+(t.sold_female||0),0)
                  const totSM = (transfers??[]).reduce((s:number,t:any)=>s+(t.sold_male||0),0)
                  return (
                    <tfoot><tr className="bg-gray-50 font-semibold text-xs">
                      <td className="px-3 py-2" colSpan={2}>TOTAL ({(transfers??[]).length} entries)</td>
                      <td className="px-3 py-2 text-right">{totF.toLocaleString('en-IN')} ♀</td>
                      <td className="px-3 py-2 text-right">{totM.toLocaleString('en-IN')} ♂</td>
                      <td className="px-3 py-2 text-right text-amber-600">{totSEF}♀ {totSEM}♂</td>
                      <td className="px-3 py-2 text-right text-orange-600">{totSF}♀ {totSM}♂</td>
                      <td colSpan={3}/>
                    </tr></tfoot>
                  )
                })()}
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* FINANCIAL TAB */}
      {tab === 'costincome' && (
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap gap-3 items-end">
              <label className="flex items-center gap-1.5 text-sm text-gray-600">From
                <DateInput value={ciFrom} onChange={e => setCiFrom(e.target.value)} /></label>
              <label className="flex items-center gap-1.5 text-sm text-gray-600">To
                <DateInput value={ciTo} onChange={e => setCiTo(e.target.value)} /></label>
              {(ciFrom || ciTo) && <Button variant="ghost" size="sm" onClick={() => { setCiFrom(''); setCiTo('') }}>Clear</Button>}
              <p className="text-[11px] text-gray-500 ml-auto max-w-lg">
                Eggs are <strong>valued the day they are produced</strong> — HE at that week's rate from the HE Rate
                Register, other eggs at the latest rate actually achieved in NHE sales. <strong>Actual Sales</strong> is
                money that really came in on that date, so the two rarely match day to day.
              </p>
            </div>
          </Card>

          {/* Monthly first — it is the only complete picture, because salary and
              electricity exist per month, not per day. */}
          <Card padding={false}>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Month-wise — complete cost</h3>
              <span className="text-[11px] text-gray-500">includes site salary &amp; electricity</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <thead><tr>
                  <Th>Month</Th><Th>Site</Th><Th right>Total Eggs</Th><Th right>HE Eggs</Th>
                  <Th right className="text-green-700">Egg Value</Th><Th right className="text-green-700">Actual Sales</Th>
                  <Th right>Feed</Th><Th right>Medicine</Th><Th right>Expenses</Th>
                  <Th right>Chick</Th><Th right>Salary*</Th><Th right>Electricity*</Th>
                  <Th right className="text-orange-700">Total Cost</Th><Th right>Cost/Egg</Th>
                </tr></thead>
                <tbody>
                  {ciMonthly.map((r: any) => (
                    <tr key={r.month} className="hover:bg-gray-50 text-xs">
                      <Td className="font-medium">{r.month}</Td>
                      <Td className="text-gray-500">{r.site}</Td>
                      <Td right>{r.eggs.toLocaleString('en-IN')}</Td>
                      <Td right>{r.he.toLocaleString('en-IN')}</Td>
                      <Td right className="text-green-700">{inr(r.value)}</Td>
                      <Td right className="text-green-700">{inr(r.sales)}</Td>
                      <Td right>{inr(r.feedCost)}</Td>
                      <Td right>{inr(r.med)}</Td>
                      <Td right>{inr(r.exp)}</Td>
                      <Td right>{r.chick ? inr(r.chick) : '—'}</Td>
                      <Td right className="text-gray-500">{inr(r.sal)}</Td>
                      <Td right className="text-gray-500">{inr(r.elec)}</Td>
                      <Td right className="font-semibold text-orange-700">{inr(r.total)}</Td>
                      <Td right className="font-semibold">{r.eggs > 0 ? `Rs ${r.perEgg.toFixed(3)}` : '—'}</Td>
                    </tr>
                  ))}
                  {ciMonthly.length === 0 && (
                    <tr><Td colSpan={14} className="text-center text-gray-400 py-8">No daily records in this range.</Td></tr>
                  )}
                </tbody>
              </Table>
            </div>
            <div className="px-4 py-2 border-t border-gray-100 text-[11px] text-amber-800 bg-amber-50">
              * Salary and Electricity are the <strong>whole site's</strong> figures for that month, not this flock's
              share. Attendance and power are recorded per site and nothing says which flock they belong to, so where
              two flocks share a site both show the same number. They are <strong>not</strong> divided — a split would
              be invented. Electricity adds every meter/transformer on the site.
            </div>
          </Card>

          {/* Day-wise: only the costs that genuinely exist per day. */}
          <Card padding={false}>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Day-wise — direct cost only</h3>
              <span className="text-[11px] text-gray-500">{ciDaily.length} days</span>
            </div>
            <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
              <Table>
                <thead><tr>
                  <Th>Date</Th><Th>Site</Th><Th right>Total Eggs</Th><Th right>HE Eggs</Th>
                  <Th right className="text-green-700">Egg Value</Th><Th right className="text-green-700">Actual Sales</Th>
                  <Th right>Feed kg</Th><Th right>Feed</Th><Th right>Medicine</Th><Th right>Expenses</Th>
                  <Th right className="text-orange-700">Direct Cost</Th><Th right>Cost/Egg</Th>
                </tr></thead>
                <tbody>
                  {ciDaily.map((r: any) => (
                    <tr key={r.date} className="hover:bg-gray-50 text-xs">
                      <Td>{fmtDate(r.date)}</Td>
                      <Td className="text-gray-500">{r.site}</Td>
                      <Td right>{r.eggs.toLocaleString('en-IN')}</Td>
                      <Td right>{r.he.toLocaleString('en-IN')}</Td>
                      <Td right className="text-green-700">{inr(r.value)}</Td>
                      <Td right className="text-green-700">{r.sales ? inr(r.sales) : '—'}</Td>
                      <Td right className="text-gray-500">{r.feedKg.toLocaleString('en-IN')}</Td>
                      <Td right>{inr(r.feedCost)}</Td>
                      <Td right>{r.med ? inr(r.med) : '—'}</Td>
                      <Td right>{r.exp ? inr(r.exp) : '—'}</Td>
                      <Td right className="font-semibold text-orange-700">{inr(r.cost)}</Td>
                      <Td right>{r.eggs > 0 ? `Rs ${r.perEgg.toFixed(3)}` : '—'}</Td>
                    </tr>
                  ))}
                  {ciDaily.length === 0 && (
                    <tr><Td colSpan={12} className="text-center text-gray-400 py-8">No daily records in this range.</Td></tr>
                  )}
                </tbody>
                {ciDaily.length > 0 && (
                  <tfoot><tr className="bg-brand-50 text-xs font-semibold text-brand-800">
                    <Td colSpan={2}>TOTAL</Td>
                    <Td right>{ciDaily.reduce((a: number, r: any) => a + r.eggs, 0).toLocaleString('en-IN')}</Td>
                    <Td right>{ciDaily.reduce((a: number, r: any) => a + r.he, 0).toLocaleString('en-IN')}</Td>
                    <Td right>{inr(ciDaily.reduce((a: number, r: any) => a + r.value, 0))}</Td>
                    <Td right>{inr(ciDaily.reduce((a: number, r: any) => a + r.sales, 0))}</Td>
                    <Td right>{ciDaily.reduce((a: number, r: any) => a + r.feedKg, 0).toLocaleString('en-IN')}</Td>
                    <Td right>{inr(ciDaily.reduce((a: number, r: any) => a + r.feedCost, 0))}</Td>
                    <Td right>{inr(ciDaily.reduce((a: number, r: any) => a + r.med, 0))}</Td>
                    <Td right>{inr(ciDaily.reduce((a: number, r: any) => a + r.exp, 0))}</Td>
                    <Td right>{inr(ciDaily.reduce((a: number, r: any) => a + r.cost, 0))}</Td>
                    <Td right>—</Td>
                  </tr></tfoot>
                )}
              </Table>
            </div>
            <div className="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-500">
              Day-wise deliberately excludes salary and electricity — they are recorded monthly, and dividing a month
              by its days would put a made-up number next to measured ones. Chick cost sits on the placement day only,
              so it never distorts cost per egg. For the complete cost, read the month table above.
            </div>
          </Card>
        </div>
      )}

      {tab === 'financial' && (
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap gap-3 items-end">
              <label className="flex items-center gap-1.5 text-sm text-gray-600">From
                <DateInput value={heFromDate} onChange={e => setHeFromDate(e.target.value)} /></label>
              <label className="flex items-center gap-1.5 text-sm text-gray-600">To
                <DateInput value={heToDate} onChange={e => setHeToDate(e.target.value)} /></label>
              {finRanged && <Button variant="ghost" size="sm" onClick={() => { setHeFromDate(''); setHeToDate('') }}>Clear</Button>}
              <p className="text-[11px] text-gray-500 ml-auto max-w-lg">
                {finRanged
                  ? 'This range applies to EVERYTHING on this tab — Revenue, Cost and the dispatch table below, so they always describe the same period.'
                  : 'No range set — showing the whole life of the flock. Set From/To to see one month or one week.'}
              </p>
            </div>
          </Card>
          {finRanged && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              Showing <strong>{heFromDate ? fmtDate(heFromDate) : 'start'} → {heToDate ? fmtDate(heToDate) : 'today'}</strong>.
              Chick cost is counted only if the placement date falls inside this range, otherwise a one-month view would
              read as though the birds were bought again that month.
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader title="Revenue" />
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">HE Revenue</td>
                    <td className="py-2 text-right font-semibold text-green-700">{inr(fHeRevenue)}</td>
                  </tr>
                  {/* NHE by type — use lines when available, else header sale_type */}
                  {Object.entries(fNheSales.reduce((acc: any, s: any) => {
                    if (s.nhe_sale_lines?.length > 0) {
                      s.nhe_sale_lines.forEach((l: any) => {
                        acc[l.sale_type] = (acc[l.sale_type] ?? 0) + (l.amount ?? 0)
                      })
                    } else {
                      acc[s.sale_type] = (acc[s.sale_type] ?? 0) + (s.amount ?? 0)
                    }
                    return acc
                  }, {}) ?? {}).map(([type, amt]: any) => (
                    <tr key={type} className="border-b border-gray-50">
                      <td className="py-2 text-gray-500 pl-4">• {NHE_LABEL[type] ?? type}</td>
                      <td className="py-2 text-right font-medium">{inr(amt)}</td>
                    </tr>
                  ))}
                  <tr className="bg-green-50">
                    <td className="py-2 font-bold">TOTAL REVENUE</td>
                    <td className="py-2 text-right font-bold text-green-700 text-base">{inr(fTotalRevenue)}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
            <Card>
              <CardHeader title="Cost" />
              <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                <strong>Salary and Electricity are the SITE's totals for the months this flock was running</strong>,
                not this flock's share. Attendance and power are recorded per site, and nothing in the data says which
                flock a worker or a unit of power went to — so where two flocks share a site, both show the same site
                figure. Splitting it would be an invented number.
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">Chick Cost ({flock.paid_female+flock.paid_male} paid × Rs{flock.chick_rate})</td>
                    <td className="py-2 text-right font-semibold">{fChickCost ? inr(fChickCost) : <span className="text-xs text-gray-400">outside range</span>}</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">
                      Medicine &amp; Vaccine <span className="text-xs text-gray-400">(qty × stock rate)</span>
                    </td>
                    <td className="py-2 text-right font-semibold">{inr(fMedCost)}</td>
                  </tr>
                  {fMedUnpriced > 0 && (
                    <tr className="border-b border-gray-50">
                      <td className="py-2 pl-4 text-xs text-amber-700" colSpan={2}>
                        ⚠️ {fMedUnpriced} medicine entr{fMedUnpriced === 1 ? 'y has' : 'ies have'} no stock rate and no
                        rate of their own, so they count as zero. Price them by recording a purchase (GRN) or an
                        Inventory opening/adjustment for that item.
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">
                      Feed Cost <span className="text-xs text-gray-400">({fFeedKg.toLocaleString('en-IN')} kg × recipe cost/kg)</span>
                    </td>
                    <td className="py-2 text-right font-semibold">{inr(fFeedCost)}</td>
                  </tr>
                  {fFeedKgUnpriced > 0 && (
                    <tr className="border-b border-gray-50">
                      <td className="py-2 pl-4 text-xs text-amber-700" colSpan={2}>
                        ⚠️ {fFeedKgUnpriced.toLocaleString('en-IN')} kg could not be priced, so the feed cost above
                        excludes it. Either the day's row has no Feed Type filled in (older entries and imports often
                        don't), or the feed type used has no costed formula behind it — a formula's cost/kg is built
                        from its ingredients' latest purchase prices, so a feed type with no formula mapped, or with
                        ingredients that have never been purchased, prices at zero.
                        {fFeedUnpricedTypes.length > 0 && <> Feed types involved: <strong>{fFeedUnpricedTypes.join(', ')}</strong>.</>}
                      </td>
                    </tr>
                  )}
                  {Object.entries(fOtherExpByCat).map(([cat, amt]: any) => (
                    <tr key={cat} className="border-b border-gray-50">
                      <td className="py-2 text-gray-500 pl-4 capitalize">• {cat}</td>
                      <td className="py-2 text-right font-medium">{inr(amt)}</td>
                    </tr>
                  ))}
                  <tr className="bg-orange-50/60">
                    <td className="py-2 font-semibold">Direct Cost (chick, feed, medicine, expenses)</td>
                    <td className="py-2 text-right font-semibold text-orange-700">{inr(fDirectCost)}</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">Salary <span className="text-xs text-gray-400">(site total)</span></td>
                    <td className="py-2 text-right font-semibold">{inr(fSalaryCost)}</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">Electricity <span className="text-xs text-gray-400">(site, all meters)</span></td>
                    <td className="py-2 text-right font-semibold">{inr(fElectricityCost)}</td>
                  </tr>
                  <tr className="bg-orange-50">
                    <td className="py-2 font-bold">TOTAL COST</td>
                    <td className="py-2 text-right font-bold text-orange-700 text-base">{inr(fTotalCost)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-2 font-semibold">Cost per Egg <span className="text-xs font-normal text-gray-400">(on {fEggs.toLocaleString('en-IN')} total eggs)</span></td>
                    <td className="py-2 text-right font-bold text-gray-800">{fEggs > 0 ? `Rs ${fCostPerEgg.toFixed(3)}` : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
          {/* HE Dispatch table */}
          <Card>
            <CardHeader title={`HE Dispatch (${displayHeDispatch.length} of ${heDispatch?.length ?? 0} records)`} />
            {/* Date filter for HE dispatch */}
            <div className="flex items-center gap-3 flex-wrap mb-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-sm font-medium text-gray-600">Filter:</span>
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                From
                <DateInput value={heFromDate} onChange={e => setHeFromDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm" />
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                To
                <DateInput value={heToDate} onChange={e => setHeToDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm" />
              </label>
              {(heFromDate || heToDate) && (
                <button onClick={() => { setHeFromDate(''); setHeToDate('') }}
                  className="text-xs text-brand-600 hover:text-brand-800 underline">Clear</button>
              )}
              <span className="text-xs text-gray-500 ml-auto">
                Showing {displayHeDispatch.length} of {heDispatch?.length ?? 0} records
              </span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <thead><tr>
                  <Th>Dispatch Date</Th><Th>Prod Date</Th><Th right>DC No</Th>
                  <Th right>Dispatched</Th><Th right>Free</Th><Th right>Invoice</Th>
                  <Th right>Rate</Th><Th right>Amount</Th>
                </tr></thead>
                <tbody>
                  {displayHeDispatch.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <Td className="text-xs">{fmtDate(d.dispatch_date)}</Td>
                      <Td className="text-xs text-gray-400">{fmtDate(d.prod_date)}</Td>
                      <Td right className="text-xs">{d.dc_no}</Td>
                      <Td right>{d.total_dispatched?.toLocaleString('en-IN')}</Td>
                      <Td right className="text-xs text-orange-500">{d.free_eggs > 0 ? d.free_eggs : '—'}</Td>
                      <Td right>{d.invoice_eggs?.toLocaleString('en-IN')}</Td>
                      <Td right className="text-xs">{d.rate ? `Rs ${d.rate}` : '—'}</Td>
                      <Td right className="font-semibold text-green-700">{d.amount ? inr(d.amount) : '—'}</Td>
                    </tr>
                  ))}
                  {displayHeDispatch.length === 0 && (
                    <tr><Td colSpan={8} className="text-center text-gray-400 py-6">No dispatches in this range.</Td></tr>
                  )}
                </tbody>
                {displayHeDispatch.length > 0 && (
                  <tfoot>
                    <tr className="bg-brand-50 border-t-2 border-brand-200 text-xs font-semibold text-brand-800">
                      <Td colSpan={3}>TOTAL ({displayHeDispatch.length} dispatches)</Td>
                      <Td right>{displayHeDispatch.reduce((a: number, d: any) => a + (d.total_dispatched ?? 0), 0).toLocaleString('en-IN')}</Td>
                      <Td right className="text-orange-600">{displayHeDispatch.reduce((a: number, d: any) => a + (d.free_eggs ?? 0), 0).toLocaleString('en-IN')}</Td>
                      <Td right>{displayHeDispatch.reduce((a: number, d: any) => a + (d.invoice_eggs ?? 0), 0).toLocaleString('en-IN')}</Td>
                      {/* Rate is per dispatch, so an average is the only honest
                          figure here — total amount ÷ total invoiced eggs. */}
                      <Td right className="font-normal text-gray-500">
                        {(() => {
                          const eggs = displayHeDispatch.reduce((a: number, d: any) => a + (d.invoice_eggs ?? 0), 0)
                          const amt = displayHeDispatch.reduce((a: number, d: any) => a + (d.amount ?? 0), 0)
                          return eggs > 0 ? `avg Rs ${(amt / eggs).toFixed(2)}` : '—'
                        })()}
                      </Td>
                      <Td right className="text-green-700">{inr(displayHeDispatch.reduce((a: number, d: any) => a + (d.amount ?? 0), 0))}</Td>
                    </tr>
                  </tfoot>
                )}
              </Table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'std' && (
        <div className="space-y-5">
          {!flock.laying_season ? (
            <Card>
              <div className="p-6 text-sm text-gray-500 text-center">
                This flock has no Laying Season set (Summer/Winter), so it can't be compared against the Venco standard curve.
                Set it on the flock's Overview/Edit form to enable this view.
              </div>
            </Card>
          ) : !stdCurve || stdCurve.length === 0 ? (
            <Card>
              <div className="p-6 text-sm text-gray-500 text-center">
                No standard curve data found for "{flock.laying_season} Laying". Import the Venco Excel from the HE Rate Register &rarr; STD Curve tab.
              </div>
            </Card>
          ) : (() => {
            const HH = flock.total_placed_f ?? 0
            // Per-week totals from daily_records, keyed by week-of-age.
            // HD%/HE% are weighted (sum of eggs ÷ sum of the denominator across
            // the week), not a simple average of each day's own %, since a
            // simple average diverges from the true rate whenever opening
            // bird count or egg count varies day to day within the week (e.g.
            // mortality) — matches the weighted formula already used by
            // v_flock_summary (All Flocks Data) and the Reports page.
            type WeekAgg = { openFSum: number; totalEggs: number; heEggs: number; depletion: number }
            const weekly: Record<number, WeekAgg> = {}
            for (const d of (daily ?? [])) {
              if (!d.record_date) continue
              const wk = flockAgeWeeks(flock.placement_date, d.record_date)
              if (wk < 0) continue
              const row = weekly[wk] ??= { openFSum: 0, totalEggs: 0, heEggs: 0, depletion: 0 }
              row.openFSum += d.opening_female ?? 0
              row.totalEggs += d.total_eggs ?? 0
              row.heEggs += d.he_eggs ?? 0
              row.depletion += (d.mortality_female ?? 0) + (d.cull_female ?? 0)
            }
            // Hatch results from the BATCHES, weighted by eggs set. See the
            // note on the memo above: he_dispatch.hatch_pct is empty on every
            // dispatch, so reading it showed nothing however many batches were
            // linked.
            const hatchWeekly: Record<number, { pctXeggs: number; eggs: number; chicks: number }> = {}
            for (const b of (hatchBatches ?? []) as any[]) {
              const when = b.he_dispatch?.dispatch_date ?? b.setting_date
              if (!when) continue
              const wk = flockAgeWeeks(flock.placement_date, when)
              if (wk < 0) continue
              const row = hatchWeekly[wk] ??= { pctXeggs: 0, eggs: 0, chicks: 0 }
              const eggs = Number(b.eggs_set ?? 0)
              if (b.hatchability_pct != null && eggs > 0) {
                row.pctXeggs += Number(b.hatchability_pct) * eggs
                row.eggs += eggs
              }
              row.chicks += Number(b.hatched_chicks ?? 0)
            }
            const variance = (actual: number | null, std: number | null) =>
              actual == null || std == null ? null : actual - std
            const varClass = (v: number | null) => v == null ? '' : v >= 0 ? 'text-green-600' : 'text-red-500'
            const fmt = (v: number | null, d = 1) => v != null ? v.toFixed(d) : '—'
            // The standard as a NUMBER, not only a rate: a percentage cannot be
            // checked against a register, and "3.15%" means nothing until it is
            // read as "1,439 birds". Standards that are per hen housed are
            // multiplied by the birds placed; rates that apply to something the
            // flock actually did (hen-day, HE%, hatch%) are applied to that same
            // real base, so standard and actual are answering one question.
            const sub = (v: number | null | undefined, suffix = '') =>
              v == null || !isFinite(v) ? null
                : <div className="text-[10px] text-gray-400">{Math.round(v).toLocaleString('en-IN')}{suffix}</div>

            let cumDepletion = 0, cumTeHh = 0, cumHeHh = 0, cumChicksHh = 0, cumDeaths = 0

            const rows = stdCurve.map((s: any) => {
              const w = weekly[s.week_of_age]
              const actualHd = w && w.openFSum > 0 ? (w.totalEggs / w.openFSum) * 100 : null
              const actualHe = w && w.totalEggs > 0 ? (w.heEggs / w.totalEggs) * 100 : null
              const hw = hatchWeekly[s.week_of_age]
              const actualHatch = hw && hw.eggs > 0 ? hw.pctXeggs / hw.eggs : null
              const weeklyChicksHh = hw && HH > 0 && hw.chicks > 0 ? hw.chicks / HH : null
              const weeklyTeHh = w && HH > 0 ? w.totalEggs / HH : null
              const weeklyHeHh = w && HH > 0 ? w.heEggs / HH : null
              const weeklyDepletionPct = w && HH > 0 ? (w.depletion / HH) * 100 : null
              if (w) {
                cumDepletion += weeklyDepletionPct ?? 0
                cumTeHh += weeklyTeHh ?? 0
                cumHeHh += weeklyHeHh ?? 0
                cumDeaths += w.depletion
              }
              cumChicksHh += weeklyChicksHh ?? 0
              return {
                s, actualHd, actualHe, actualHatch, weeklyTeHh, weeklyHeHh, weeklyDepletionPct,
                cumDepletion: w ? cumDepletion : null, cumTeHh: w ? cumTeHh : null, cumHeHh: w ? cumHeHh : null,
                weeklyChicksHh, cumChicksHh: cumChicksHh > 0 ? cumChicksHh : null,
                // The raw figures every percentage is worked out from. A page
                // that shows only percentages cannot be checked against a
                // register, and cannot be argued with either.
                deaths: w ? w.depletion : null, cumDeaths: w ? cumDeaths : null,
                eggs: w ? w.totalEggs : null, heEggs: w ? w.heEggs : null,
                birdDays: w ? w.openFSum : null,
                eggsSet: hw?.eggs ?? null, chicks: hw?.chicks ?? null,
              }
            })

            return (
              <Card>
                <CardHeader title={`Actual vs Venco ${flock.laying_season} Laying Standard`} />
                <div className="overflow-x-auto">
                  <Table>
                    <thead>
                      <tr>
                        <Th>Age (wk)</Th>
                        <Th right>Std Cum Depletion %</Th>
                        <Th right>Actual</Th>
                        <Th right>Var</Th>
                        <Th right>Std Hen Week %</Th>
                        <Th right>Actual</Th>
                        <Th right>Var</Th>
                        <Th right>Std HE %</Th>
                        <Th right>Actual</Th>
                        <Th right>Var</Th>
                        <Th right>Std Weekly TE/HH</Th>
                        <Th right>Actual</Th>
                        <Th right>Var</Th>
                        <Th right>Std Cum TE/HH</Th>
                        <Th right>Actual</Th>
                        <Th right>Var</Th>
                        <Th right>Std Weekly HE/HH</Th>
                        <Th right>Actual</Th>
                        <Th right>Var</Th>
                        <Th right>Std Cum HE/HH</Th>
                        <Th right>Actual</Th>
                        <Th right>Var</Th>
                        <Th right>Std Hatch %</Th>
                        <Th right>Actual</Th>
                        <Th right>Var</Th>
                        <Th right>Std Weekly Chicks/HH</Th>
                        <Th right>Actual</Th>
                        <Th right>Var</Th>
                        <Th right>Std Cum Chicks/HH</Th>
                        <Th right>Actual</Th>
                        <Th right>Var</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => {
                        const s = r.s
                        const vDepletion = variance(r.cumDepletion, s.cum_depletion_pct)
                        const vHd = variance(r.actualHd, s.hen_week_pct)
                        const vHe = variance(r.actualHe, s.he_pct)
                        const vTeHh = variance(r.weeklyTeHh, s.weekly_te_hh)
                        const vCumTeHh = variance(r.cumTeHh, s.cum_te_hh)
                        const vHeHh = variance(r.weeklyHeHh, s.weekly_he_hh)
                        const vCumHeHh = variance(r.cumHeHh, s.cum_he_hh)
                        const vHatch = variance(r.actualHatch, s.hatch_pct)
                        return (
                          <tr key={s.week_of_age} className="border-b border-gray-50">
                            <Td>{s.week_of_age}</Td>
                            <Td right>
                              {fmt(s.cum_depletion_pct)}
                              {sub(s.cum_depletion_pct != null && HH > 0 ? (s.cum_depletion_pct / 100) * HH : null, ' birds')}
                            </Td>
                            <Td right>
                              {fmt(r.cumDepletion)}
                              {r.cumDeaths != null && r.cumDeaths > 0 && (
                                <div className="text-[10px] text-gray-400">
                                  {r.cumDeaths.toLocaleString('en-IN')} of {HH.toLocaleString('en-IN')}
                                  {r.deaths ? ` · +${r.deaths.toLocaleString('en-IN')} this wk` : ''}
                                </div>
                              )}
                            </Td>
                            <Td right className={varClass(vDepletion != null ? -vDepletion : null)}>{fmt(vDepletion)}</Td>
                            <Td right>
                              {fmt(s.hen_week_pct)}
                              {sub(s.hen_week_pct != null && r.birdDays ? (s.hen_week_pct / 100) * r.birdDays : null, ' eggs')}
                            </Td>
                            <Td right>
                              {fmt(r.actualHd)}
                              {r.eggs ? <div className="text-[10px] text-gray-400">
                                {r.eggs.toLocaleString('en-IN')} eggs / {r.birdDays?.toLocaleString('en-IN')} bird-days
                              </div> : null}
                            </Td>
                            <Td right className={varClass(vHd)}>{fmt(vHd)}</Td>
                            <Td right>
                              {fmt(s.he_pct)}
                              {sub(s.he_pct != null && r.eggs ? (s.he_pct / 100) * r.eggs : null, ' HE')}
                            </Td>
                            <Td right>
                              {fmt(r.actualHe)}
                              {r.heEggs ? <div className="text-[10px] text-gray-400">{r.heEggs.toLocaleString('en-IN')} HE</div> : null}
                            </Td>
                            <Td right className={varClass(vHe)}>{fmt(vHe)}</Td>
                            <Td right>
                              {fmt(s.weekly_te_hh)}
                              {sub(s.weekly_te_hh != null && HH > 0 ? s.weekly_te_hh * HH : null, ' eggs')}
                            </Td>
                            <Td right>{fmt(r.weeklyTeHh)}{sub(r.eggs, ' eggs')}</Td>
                            <Td right className={varClass(vTeHh)}>{fmt(vTeHh)}</Td>
                            <Td right>
                              {fmt(s.cum_te_hh)}
                              {sub(s.cum_te_hh != null && HH > 0 ? s.cum_te_hh * HH : null, ' eggs')}
                            </Td>
                            <Td right>{fmt(r.cumTeHh)}</Td>
                            <Td right className={varClass(vCumTeHh)}>{fmt(vCumTeHh)}</Td>
                            <Td right>
                              {fmt(s.weekly_he_hh)}
                              {sub(s.weekly_he_hh != null && HH > 0 ? s.weekly_he_hh * HH : null, ' HE')}
                            </Td>
                            <Td right>{fmt(r.weeklyHeHh)}{sub(r.heEggs, ' HE')}</Td>
                            <Td right className={varClass(vHeHh)}>{fmt(vHeHh)}</Td>
                            <Td right>
                              {fmt(s.cum_he_hh)}
                              {sub(s.cum_he_hh != null && HH > 0 ? s.cum_he_hh * HH : null, ' HE')}
                            </Td>
                            <Td right>{fmt(r.cumHeHh)}</Td>
                            <Td right className={varClass(vCumHeHh)}>{fmt(vCumHeHh)}</Td>
                            <Td right>
                              {fmt(s.hatch_pct)}
                              {sub(s.hatch_pct != null && r.eggsSet ? (s.hatch_pct / 100) * r.eggsSet : null, ' chicks')}
                            </Td>
                            <Td right>
                              {fmt(r.actualHatch)}
                              {r.eggsSet ? <div className="text-[10px] text-gray-400">
                                {r.eggsSet.toLocaleString('en-IN')} set → {(r.chicks ?? 0).toLocaleString('en-IN')} chicks
                              </div> : null}
                            </Td>
                            <Td right className={varClass(vHatch)}>{fmt(vHatch)}</Td>
                            <Td right>
                              {fmt(s.weekly_chicks_hh)}
                              {sub(s.weekly_chicks_hh != null && HH > 0 ? s.weekly_chicks_hh * HH : null, ' chicks')}
                            </Td>
                            <Td right>
                              {fmt(r.weeklyChicksHh, 2)}
                              {r.chicks ? <div className="text-[10px] text-gray-400">{r.chicks.toLocaleString('en-IN')} chicks</div> : null}
                            </Td>
                            <Td right className={varClass(variance(r.weeklyChicksHh, s.weekly_chicks_hh))}>
                              {fmt(variance(r.weeklyChicksHh, s.weekly_chicks_hh), 2)}
                            </Td>
                            <Td right>
                              {fmt(s.cum_chicks_hh)}
                              {sub(s.cum_chicks_hh != null && HH > 0 ? s.cum_chicks_hh * HH : null, ' chicks')}
                            </Td>
                            <Td right>{fmt(r.cumChicksHh, 2)}</Td>
                            <Td right className={varClass(variance(r.cumChicksHh, s.cum_chicks_hh))}>
                              {fmt(variance(r.cumChicksHh, s.cum_chicks_hh), 2)}
                            </Td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>
                <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
                  BOTH sides show the real numbers under the percentage. A standard per hen housed is multiplied by
                  the {HH.toLocaleString('en-IN')} females placed; a standard RATE (hen-day, HE%, hatch%) is applied to
                  what this flock actually did — the same bird-days, the same eggs, the same eggs set — so the standard
                  and the actual answer one question and the gap between them is a real number of birds, eggs or chicks. Depletion is deaths plus culls measured against the
                  {' '}{HH.toLocaleString('en-IN')} females placed. Hen-day is eggs divided by bird-days (the daily
                  opening counts added up). Hatch % and Chicks/HH come from the HATCH BATCHES linked to this flock's
                  dispatches, weighted by eggs set — they stay blank for any week whose batches have not been linked.
                </div>
              </Card>
            )
          })()}
        </div>
      )}
    </div>
  )
}
