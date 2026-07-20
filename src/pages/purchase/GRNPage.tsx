import React, { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { Card, CardHeader, Input, Select, FormRow, Modal, EmptyState, Spinner, Td, Th, DateInput, Badge, Button, usePagination, PageSizeControl } from '@/components/ui'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, Download, Upload, X, Printer } from 'lucide-react'
import { useConfigOptions } from '@/hooks/useConfigOptions'
import { printGRN } from '@/lib/invoicePrint'
import { registerItemAlias } from '@/lib/itemAliases'

// Raw GRN input columns for the import template — only fields the user types.
// Amounts (basic / gst / total) are computed in code on import, never imported.
// free_qty and flock_no only apply when category = 'Chicks' — free_qty is
// the number of free birds received (not charged), flock_no is resolved to
// flock_id by lookup against the flocks table on import.
const GRN_TEMPLATE_HEADERS = [
  'grn_no', 'grn_date', 'farm', 'supplier', 'category', 'item',
  'qty', 'unit', 'bags', 'bag_type', 'price_per_unit', 'gst_pct',
  'invoice_no', 'invoice_date', 'batch_no', 'expiry_date', 'vehicle_no', 'remarks',
  'free_qty', 'flock_no',
]
const GRN_TEMPLATE_EXAMPLE = [
  'GRN-20250601-001', '2025-06-01', 'Farm A', 'Vendor ABC', 'Feed Ingredient', 'Maize',
  '1000', 'kg', '20', 'Maize 50kg', '25', '0',
  'INV-001', '2025-06-01', '', '', 'AP01AB1234', '',
  '', '',
]

// BATCH_CATS: medicine-type categories that need batch/expiry tracking
const BATCH_CATS = new Set(['Medicine', 'Vaccine', 'Supplement', 'Injectable'])

// Feed stock is aggregated in kg everywhere — normalize MT/Quintal into kg,
// scaling the rate inversely so amounts stay identical. Shared by the manual
// save form and the bulk import path so neither can drift from the other.
// Throws if unit === 'Bag' for Feed Ingredient (no fixed kg conversion).
function normalizeFeedUnit(p: { qty: number | null; price_per_unit: number | null; unit: string | null }) {
  if (p.unit === 'Bag') throw new Error('For Feed Ingredients use kg, MT or Quintal — "Bag" has no fixed kg conversion')
  const unitFactor = p.unit === 'MT' ? 1000 : p.unit === 'Quintal' ? 100 : 1
  if (unitFactor !== 1) {
    p.qty = (p.qty ?? 0) * unitFactor
    p.price_per_unit = p.price_per_unit != null ? p.price_per_unit / unitFactor : null
    p.unit = 'kg'
  }
  return p
}

function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const lines = [headers, ...rows].map(r => r.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(','))
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

// ── Bill-level (header) fields — shared across every item line in one GRN
// bill. Everything item-specific (qty, rate, category, batch...) lives on
// ItemLine below, so a single Add GRN submit can save several line items
// under the same GRN No/date/farm/supplier in one go.
const emptyHeader = () => ({
  grn_no: '', grn_date: today(), farm_id: '', party_id: '',
  invoice_no: '', invoice_date: today(), vehicle_no: '',
})

type ItemLine = {
  po_id: string; category: string; item_id: string; item_name: string
  qty: string; unit: string; bags: string; bag_type: string
  price_per_unit: string; gst_pct: string; other_charges: string
  basic_amount: string; gst_amount: string; total_amount: string
  free_qty: string; batch_no: string; expiry_date: string; flock_id: string
  remarks: string; itemSearch: string
  // Which of basic/gst/total amounts the user typed by hand this session —
  // those stick; everything else keeps following the live qty×rate calc.
  manualAmountFields: Set<string>
}

const emptyLine = (): ItemLine => ({
  po_id: '', category: 'Feed Ingredient', item_id: '', item_name: '',
  qty: '', unit: '', bags: '', bag_type: '',
  price_per_unit: '', gst_pct: '0', other_charges: '',
  basic_amount: '', gst_amount: '', total_amount: '',
  free_qty: '', batch_no: '', expiry_date: '', flock_id: '',
  remarks: '', itemSearch: '', manualAmountFields: new Set(),
})

function lineCalc(line: ItemLine) {
  const basicCalc = (parseFloat(line.qty) || 0) * (parseFloat(line.price_per_unit) || 0)
  const gstCalc = basicCalc * (parseFloat(line.gst_pct) || 0) / 100
  const otherCharges = parseFloat(line.other_charges) || 0
  const totalCalc = basicCalc + gstCalc + otherCharges
  const landedRate = (parseFloat(line.qty) || 0) > 0
    ? (parseFloat(line.price_per_unit) || 0) + otherCharges / (parseFloat(line.qty) || 1)
    : (parseFloat(line.price_per_unit) || 0)
  const isChick = line.category === 'Chicks'
  const needsBatch = BATCH_CATS.has(line.category)
  return { basicCalc, gstCalc, otherCharges, totalCalc, landedRate, isChick, needsBatch }
}

export const GRNPage: React.FC = () => {
  const qc = useQueryClient()
  const categoryOptions = useConfigOptions('item_category')
  const CATEGORIES = categoryOptions.map(o => o.value)
  const gstOptions  = useConfigOptions('gst_rate')
  const unitOptions = useConfigOptions('unit')
  const bagTypeOptions = useConfigOptions('bag_type')

  const [fFrom, setFFrom] = useState('')
  const [fTo, setFTo] = useState('')
  const [fFarm, setFFarm] = useState('')
  const [fCat, setFCat] = useState('')
  const [fItem, setFItem] = useState('')
  const [fParty, setFParty] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [delId, setDelId] = useState<string | null>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkDelConfirm, setBulkDelConfirm] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const [header, setHeader] = useState(emptyHeader())
  const [lines, setLines] = useState<ItemLine[]>([emptyLine()])

  const hs = (k: string, v: string) => setHeader(h => ({ ...h, [k]: v }))

  const updateLine = (idx: number, field: keyof ItemLine, val: string) => {
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l
      const next: ItemLine = { ...l, [field]: val } as any
      if (['qty', 'price_per_unit', 'gst_pct', 'other_charges'].includes(field)) next.manualAmountFields = new Set()
      return next
    }))
  }
  const setLineManualAmount = (idx: number, field: 'basic_amount' | 'gst_amount' | 'total_amount', val: string) => {
    setLines(prev => prev.map((l, i) => i !== idx ? l : { ...l, [field]: val, manualAmountFields: new Set(l.manualAmountFields).add(field) }))
  }
  const setLinePatch = (idx: number, patch: Partial<ItemLine>) => setLines(prev => prev.map((l, i) => i !== idx ? l : { ...l, ...patch }))
  const addLine = () => setLines(prev => [...prev, emptyLine()])
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').order('name')
      return data ?? []
    }
  })

  const { data: parties } = useQuery({
    queryKey: ['parties-supplier'],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id,name,type')
        .in('type', ['supplier', 'both']).order('name')
      return data ?? []
    }
  })

  const { data: items } = useQuery({
    queryKey: ['items-all'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('id,code,name,category,unit').eq('is_active', true).order('name')
      return data ?? []
    }
  })
  // Every name an item is known by (Intent/PO/GRN/Medicine name) — lets the
  // item search below find an item by ANY of its names, not just its
  // canonical Items Master name.
  const { data: itemAliasesGrn } = useQuery({
    queryKey: ['item_aliases_all'],
    queryFn: async () => { const { data } = await supabase.from('item_aliases').select('item_id,alias'); return data ?? [] },
    staleTime: 60 * 1000,
  })

  const { data: flocks } = useQuery({
    queryKey: ['flocks-active'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks').select('id,flock_no').order('flock_no')
      return data ?? []
    }
  })

  // Purchase Orders available to link this GRN against — the item/vendor
  // name is only a pre-fill convenience; GRN keeps its own independent
  // item_name (e.g. the full formal invoice name) once selected.
  const { data: openPOs } = useQuery({
    queryKey: ['pos_for_grn_link'],
    queryFn: async () => {
      const { data } = await supabase.from('purchase_orders')
        .select('id,po_no,item_name,quantity,unit,vendor_name,party_id,dose,material_status')
        .order('po_date', { ascending: false })
        .limit(500)
      return data ?? []
    }
  })

  const { data: grns, isLoading } = useQuery({
    queryKey: ['grns'],
    queryFn: async () => {
      const { data } = await supabase.from('grn')
        .select('*, farms(name), parties(name,gstin)')
        .order('grn_date', { ascending: false })
        .order('grn_no', { ascending: false })
        .limit(2000)
      return data ?? []
    }
  })

  const filtered = useMemo(() => {
    if (!grns) return []
    return grns.filter((g: any) => {
      if (fFrom && g.grn_date < fFrom) return false
      if (fTo && g.grn_date > fTo) return false
      if (fFarm && g.farm_id !== fFarm) return false
      if (fCat && g.category !== fCat) return false
      if (fItem && !(g.item_name ?? '').toLowerCase().includes(fItem.toLowerCase())) return false
      if (fParty && g.party_id !== fParty) return false
      return true
    })
  }, [grns, fFrom, fTo, fFarm, fCat, fItem, fParty])

  // Render a page at a time — the underlying fetch/filter above still runs
  // over the full (capped) result set, this only limits how many rows paint
  // to the screen at once so a long GRN history doesn't render 2000 rows.
  const { page, setPage, pageSize, setPageSize, totalPages, from, to } = usePagination(filtered.length, [fFrom, fTo, fFarm, fCat, fItem, fParty])
  const visibleRows = filtered.slice(from, to)

  const stats = useMemo(() => {
    if (!fItem || filtered.length === 0) return null
    const rates = filtered.map((g: any) => parseFloat(g.price_per_unit) || 0).filter(Boolean)
    if (!rates.length) return null
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length
    return { avg, min: Math.min(...rates), max: Math.max(...rates) }
  }, [fItem, filtered])

  const itemAliasMapGrn = useMemo(() => {
    const m: Record<string, string[]> = {}
    for (const a of itemAliasesGrn ?? []) (m[a.item_id] ??= []).push(a.alias)
    return m
  }, [itemAliasesGrn])

  const filteredItemsFor = (line: ItemLine) => {
    if (!items) return []
    const search = line.itemSearch.toLowerCase()
    return items.filter((i: any) => {
      const catMatch = !line.category || i.category === line.category
      const haystack = `${i.name} ${i.code ?? ''} ${(itemAliasMapGrn[i.id] ?? []).join(' ')}`.toLowerCase()
      const nameMatch = !search || haystack.includes(search)
      return catMatch && nameMatch
    })
  }

  const openAdd = () => {
    setEditing(null)
    setHeader(emptyHeader())
    setLines([emptyLine()])
    setShowForm(true)
  }

  const lineFromRow = (g: any): ItemLine => ({
    po_id: g.po_id ?? '', category: g.category ?? 'Feed Ingredient',
    item_id: g.item_id ?? '', item_name: g.item_name ?? '',
    qty: g.qty?.toString() ?? '', unit: g.unit ?? '', bags: g.bags?.toString() ?? '', bag_type: g.bag_type ?? '',
    price_per_unit: g.price_per_unit?.toString() ?? '',
    gst_pct: g.gst_pct?.toString() ?? '0', other_charges: g.other_charges?.toString() ?? '',
    // Editing an existing GRN: whatever amounts were actually saved are the
    // "manual" starting point (they may already differ from a fresh qty×rate
    // calc), so keep them as-is unless qty/rate/gst/other charges are
    // touched again in this edit session.
    basic_amount: g.basic_amount?.toString() ?? '', gst_amount: g.gst_amount?.toString() ?? '',
    total_amount: g.total_amount?.toString() ?? '',
    free_qty: g.free_qty?.toString() ?? '', batch_no: g.batch_no ?? '', expiry_date: g.expiry_date ?? '',
    flock_id: g.flock_id ?? '', remarks: g.remarks ?? '', itemSearch: '',
    manualAmountFields: new Set(['basic_amount', 'gst_amount', 'total_amount']),
  })

  const openEdit = (g: any) => {
    setEditing(g)
    setHeader({
      grn_no: g.grn_no ?? '',
      grn_date: g.grn_date ?? today(),
      farm_id: g.farm_id ?? '',
      party_id: g.party_id ?? '',
      invoice_no: g.invoice_no ?? '',
      invoice_date: g.invoice_date ?? today(),
      vehicle_no: g.vehicle_no ?? '',
    })
    setLines([lineFromRow(g)])
    setShowForm(true)
  }

  const linePayload = (line: ItemLine) => {
    const { basicCalc, gstCalc, otherCharges, totalCalc, isChick, needsBatch } = lineCalc(line)
    return {
      grn_no: header.grn_no,
      grn_date: header.grn_date,
      farm_id: header.farm_id,
      party_id: header.party_id || null,
      invoice_no: header.invoice_no || null,
      invoice_date: header.invoice_date || null,
      category: line.category,
      item_id: line.item_id || null,
      item_name: line.item_name || null,
      po_id: line.po_id || null,
      qty: parseFloat(line.qty) || null,
      unit: line.unit || null,
      bags: parseInt(line.bags) || null,
      bag_type: line.bag_type || null,
      price_per_unit: parseFloat(line.price_per_unit) || null,
      // The live qty×rate calculation wins over the stored value whenever it's
      // available (so correcting qty/rate updates a stale saved amount) —
      // UNLESS the user directly typed into that specific field this session,
      // in which case their figure is what actually gets saved.
      basic_amount: (line.manualAmountFields.has('basic_amount') ? parseFloat(line.basic_amount) : (basicCalc > 0 ? basicCalc : parseFloat(line.basic_amount))) || null,
      gst_pct: parseFloat(line.gst_pct) || 0,
      gst_amount: (line.manualAmountFields.has('gst_amount') ? parseFloat(line.gst_amount) : (gstCalc > 0 ? +gstCalc.toFixed(2) : parseFloat(line.gst_amount))) || null,
      other_charges: otherCharges || null,
      total_amount: (line.manualAmountFields.has('total_amount') ? parseFloat(line.total_amount) : (totalCalc > 0 ? totalCalc : parseFloat(line.total_amount))) || null,
      batch_no: needsBatch ? (line.batch_no || null) : null,
      expiry_date: needsBatch ? (line.expiry_date || null) : null,
      flock_id: (isChick || needsBatch) ? (line.flock_id || null) : null,
      free_qty: isChick ? (parseInt(line.free_qty) || 0) : null,
      vehicle_no: header.vehicle_no || null,
      remarks: line.remarks || null
    }
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!header.grn_no || !header.grn_date || !header.farm_id) throw new Error('GRN No, date and farm are required')
      if (!lines.length) throw new Error('Add at least one item')
      const payloads: any[] = []
      for (const line of lines) {
        const { isChick } = lineCalc(line)
        if (!line.item_id && !line.item_name) throw new Error('Select an item for every line')
        if (isChick && !line.flock_id) throw new Error('Select the flock for the Chicks line')
        if (line.expiry_date && line.expiry_date < header.grn_date) throw new Error('Expiry date is before the GRN date — goods already expired at receipt?')
        const p = linePayload(line) as any
        if (line.category === 'Feed Ingredient') normalizeFeedUnit(p)
        payloads.push(p)
      }
      if (editing) {
        const { error } = await supabase.from('grn').update(payloads[0]).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('grn').insert(payloads)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grns'] })
      toast.success(editing ? 'GRN updated' : `GRN saved (${lines.length} item${lines.length > 1 ? 's' : ''})`)
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('grn').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grns'] }); toast.success('GRN deleted'); setDelId(null) },
    onError: (e: any) => toast.error(e.message)
  })

  const bulkDeleteMut = useMutation({
    mutationFn: async () => {
      const ids = Array.from(sel)
      const { error } = await supabase.from('grn').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grns'] })
      toast.success(`${sel.size} GRN(s) deleted`)
      setSel(new Set())
      setBulkDelConfirm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const downloadTemplate = () =>
    downloadXlsxTemplate('grn_import_template.xlsx', GRN_TEMPLATE_HEADERS, GRN_TEMPLATE_EXAMPLE)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { headers, rows } = await parseFile(file)
      const col = (name: string) => headers.indexOf(name)
      const dataRows = rows.filter(r => r.some(c => (c ?? '').toString().trim() !== ''))
      if (!dataRows.length) { toast.error('No data rows found'); return }

      const farmByName = new Map((farms ?? []).map((f: any) => [f.name.toLowerCase().trim(), f.id]))
      const partyByName = new Map((parties ?? []).map((p: any) => [p.name.toLowerCase().trim(), p.id]))
      const itemByName = new Map((items ?? []).map((i: any) => [i.name.toLowerCase().trim(), i]))
      const flockByNo = new Map((flocks ?? []).map((f: any) => [f.flock_no.toString().toLowerCase().trim(), f.id]))

      const get = (r: string[], name: string) => { const c = col(name); return c >= 0 ? (r[c] ?? '').toString().trim() : '' }

      let feedSkipped = 0, chickSkipped = 0
      const inserts: any[] = []
      for (const r of dataRows) {
        const qty = parseFloat(get(r, 'qty')) || 0
        const rate = parseFloat(get(r, 'price_per_unit')) || 0
        const gstPct = parseFloat(get(r, 'gst_pct')) || 0

        const category = get(r, 'category') || 'Feed Ingredient'
        const itemName = get(r, 'item')
        const matchedItem = itemByName.get(itemName.toLowerCase())
        const farmName = get(r, 'farm')
        const partyName = get(r, 'supplier')
        const unit = get(r, 'unit') || matchedItem?.unit || null

        // Chicks: flock_id is required, same as the manual form — skip the
        // row (with a toast count) rather than insert with a null flock_id.
        // For batch-tracked categories (medicine/vaccine/etc.) flock is
        // optional, same as the form.
        const flockNo = get(r, 'flock_no')
        let flock_id: string | null = flockNo ? (flockByNo.get(flockNo.toLowerCase()) ?? null) : null
        if (category === 'Chicks' && !flock_id) { chickSkipped++; continue }

        // Feed Ingredient: mirror the manual form's payload() unit
        // normalization exactly — reject 'Bag', convert MT/Quintal to kg
        // with inverse rate scaling — so an imported row can't silently
        // understate stock by 100-1000x or bypass the form's Bag block.
        let normQty = qty, normRate = rate, normUnit = unit
        if (category === 'Feed Ingredient') {
          try {
            const norm = normalizeFeedUnit({ qty, price_per_unit: rate, unit })
            normQty = norm.qty ?? 0
            normRate = norm.price_per_unit ?? 0
            normUnit = norm.unit
          } catch {
            feedSkipped++
            continue
          }
        }

        // Amounts computed here — never taken from the template
        const basic = +(normQty * normRate).toFixed(2)
        const gstAmt = +(basic * gstPct / 100).toFixed(2)
        const total = +(basic + gstAmt).toFixed(2)

        inserts.push({
          grn_no: get(r, 'grn_no') || null,
          grn_date: get(r, 'grn_date') || today(),
          farm_id: farmByName.get(farmName.toLowerCase()) ?? null,
          party_id: partyByName.get(partyName.toLowerCase()) ?? null,
          invoice_no: get(r, 'invoice_no') || null,
          invoice_date: get(r, 'invoice_date') || null,
          category,
          item_id: matchedItem?.id ?? null,
          item_name: itemName || null,
          qty: normQty || null,
          unit: normUnit,
          bags: parseInt(get(r, 'bags')) || null,
          bag_type: get(r, 'bag_type') || null,
          price_per_unit: normRate || null,
          basic_amount: basic || null,
          gst_pct: gstPct || 0,
          gst_amount: gstAmt || null,
          total_amount: total || null,
          // Mirror the form's payload(): batch/expiry only apply to
          // medicine-type categories — the import used to write them for
          // every category, and a later form-edit silently erased them.
          batch_no: BATCH_CATS.has(category) ? (get(r, 'batch_no') || null) : null,
          expiry_date: BATCH_CATS.has(category) ? (get(r, 'expiry_date') || null) : null,
          flock_id: (category === 'Chicks' || BATCH_CATS.has(category)) ? flock_id : null,
          free_qty: category === 'Chicks' ? (parseInt(get(r, 'free_qty')) || 0) : null,
          vehicle_no: get(r, 'vehicle_no') || null,
          remarks: get(r, 'remarks') || null,
        })
      }

      const validInserts = inserts.filter(g => g.grn_no && g.grn_date)
      if (!validInserts.length) {
        if (feedSkipped || chickSkipped) {
          toast.error(`No valid rows — ${feedSkipped} Feed Ingredient row(s) skipped (Bag unit not allowed), ${chickSkipped} Chicks row(s) skipped (flock not found)`)
        } else {
          toast.error('Rows must have grn_no and grn_date')
        }
        return
      }
      const { error } = await supabase.from('grn').insert(validInserts)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['grns'] })
      let msg = `Imported ${validInserts.length} GRN(s)`
      if (feedSkipped) msg += ` — ${feedSkipped} Feed Ingredient row(s) skipped (Bag unit not allowed)`
      if (chickSkipped) msg += ` — ${chickSkipped} Chicks row(s) skipped (flock not found)`
      toast.success(msg)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      e.target.value = ''
    }
  }

  const toggleSel = (id: string) => setSel(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const toggleAll = () => {
    if (sel.size === filtered.length) setSel(new Set())
    else setSel(new Set(filtered.map((g: any) => g.id)))
  }

  const handleExport = () => {
    const headers = ['GRN No', 'Date', 'Farm', 'Supplier', 'Category', 'Item', 'Qty', 'Unit', 'Bags', 'Bag Type', 'Rate', 'Basic', 'GST%', 'GST Amt', 'Total', 'Batch', 'Expiry', 'Vehicle', 'Remarks']
    const rows = filtered.map((g: any) => [
      g.grn_no, fmtDate(g.grn_date), g.farms?.name ?? '', g.parties?.name ?? '',
      g.category ?? '', g.item_name ?? '',
      g.qty?.toString() ?? '', g.unit ?? '', g.bags?.toString() ?? '', g.bag_type ?? '',
      g.price_per_unit?.toString() ?? '', g.basic_amount?.toString() ?? '',
      g.gst_pct?.toString() ?? '', g.gst_amount?.toString() ?? '',
      g.total_amount?.toString() ?? '', g.batch_no ?? '', g.expiry_date ? fmtDate(g.expiry_date) : '',
      g.vehicle_no ?? '', g.remarks ?? ''
    ])
    exportCSV(`GRN-${today()}.csv`, headers, rows)
  }

  const grnDateStr = today().replace(/-/g, '')

  return (
    <div className="space-y-4 p-4">
      <CardHeader
        title="Goods Received Notes"
        action={
          <div className="flex gap-2">
            {sel.size > 0 && (
              <button
                onClick={() => setBulkDelConfirm(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Trash2 size={14} /> Delete ({sel.size})
              </button>
            )}
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
            >
              <Download size={14} /> Template
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
            >
              <Upload size={14} /> Import
            </button>
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
            >
              <Download size={14} /> Export
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus size={14} /> Add GRN
            </button>
          </div>
        }
      />

      <Card>
        <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <DateInput label="From" value={fFrom} onChange={e => setFFrom(e.target.value)} />
          <DateInput label="To" value={fTo} onChange={e => setFTo(e.target.value)} />
          <Select
            label="Farm"
            value={fFarm}
            onChange={e => setFFarm(e.target.value)}
            options={[{ value: '', label: 'All Farms' }, ...(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))]}
          />
          <Select
            label="Category"
            value={fCat}
            onChange={e => setFCat(e.target.value)}
            options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
          />
          <Input
            label="Item"
            placeholder="Search item…"
            value={fItem}
            onChange={e => setFItem(e.target.value)}
          />
          <Select
            label="Supplier"
            value={fParty}
            onChange={e => setFParty(e.target.value)}
            options={[{ value: '', label: 'All Suppliers' }, ...(parties ?? []).map((p: any) => ({ value: p.id, label: p.name }))]}
          />
        </div>
      </Card>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <div className="p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Avg Rate</div>
              <div className="text-lg font-semibold">{inr(stats.avg)}</div>
            </div>
          </Card>
          <Card>
            <div className="p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Min Rate</div>
              <div className="text-lg font-semibold text-green-700">{inr(stats.min)}</div>
            </div>
          </Card>
          <Card>
            <div className="p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Max Rate</div>
              <div className="text-lg font-semibold text-red-700">{inr(stats.max)}</div>
            </div>
          </Card>
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="flex justify-center p-8"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No GRNs found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <Th>
                    <input type="checkbox" checked={sel.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                  </Th>
                  <Th>GRN No</Th>
                  <Th>Date</Th>
                  <Th>Farm</Th>
                  <Th>Supplier</Th>
                  <Th>Category</Th>
                  <Th>Item</Th>
                  <Th>Qty</Th>
                  <Th>Unit</Th>
                  <Th>Bags</Th>
                  <Th>Bag Type</Th>
                  <Th>Rate</Th>
                  <Th>Basic</Th>
                  <Th>GST%</Th>
                  <Th>Total</Th>
                  <Th>Batch</Th>
                  <Th>Expiry</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((g: any) => (
                  <tr key={g.id} className="border-b hover:bg-gray-50">
                    <Td>
                      <input type="checkbox" checked={sel.has(g.id)} onChange={() => toggleSel(g.id)} />
                    </Td>
                    <Td className="font-medium">{g.grn_no}</Td>
                    <Td>{fmtDate(g.grn_date)}</Td>
                    <Td>{g.farms?.name ?? '-'}</Td>
                    <Td>{g.parties?.name ?? '-'}</Td>
                    <Td>
                      <Badge>{g.category}</Badge>
                    </Td>
                    <Td>{g.item_name ?? '-'}</Td>
                    <Td className="text-right">{g.qty?.toLocaleString('en-IN') ?? '-'}</Td>
                    <Td>{g.unit ?? '-'}</Td>
                    <Td className="text-right">{g.bags ?? '-'}</Td>
                    <Td className="text-xs">{g.bag_type ?? '-'}</Td>
                    <Td className="text-right">{g.price_per_unit != null ? inr(g.price_per_unit) : '-'}</Td>
                    <Td className="text-right">{g.basic_amount != null ? inr(g.basic_amount) : '-'}</Td>
                    <Td className="text-right">{g.gst_pct != null ? `${g.gst_pct}%` : '-'}</Td>
                    <Td className="text-right font-medium">{g.total_amount != null ? inr(g.total_amount) : '-'}</Td>
                    <Td>{g.batch_no ?? '-'}</Td>
                    <Td>{g.expiry_date ? fmtDate(g.expiry_date) : '-'}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(g)} className="p-1 hover:text-blue-600"><Edit2 size={14} /></button>
                        <button onClick={() => printGRN({
                          id: g.id, grn_date: g.grn_date, grn_no: g.grn_no, invoice_no: g.invoice_no,
                          invoice_date: g.invoice_date, party_name: g.parties?.name ?? '—',
                          item_name: g.item_name ?? '—',
                          qty: g.qty, unit: g.unit, price_per_unit: g.price_per_unit,
                          basic_amount: g.basic_amount, gst_pct: g.gst_pct, gst_amount: g.gst_amount,
                          total_amount: g.total_amount, cgst_amount: null,
                          sgst_amount: null, igst_amount: null,
                          party_gstin: g.parties?.gstin ?? null, vehicle_no: g.vehicle_no,
                          farm_name: g.farms?.name, is_rcm: false
                        })} className="p-1 hover:text-blue-600" title="Print GRN"><Printer size={14} /></button>
                        <button onClick={() => setDelId(g.id)} className="p-1 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {totalPages > 1 && (
                  <tr className="border-t border-gray-200 bg-gray-50/60 text-gray-500">
                    <Td colSpan={7} className="text-right text-xs">This page ({visibleRows.length} of {filtered.length})</Td>
                    <Td className="text-right text-xs">{visibleRows.reduce((s: number, g: any) => s + (g.qty ?? 0), 0).toLocaleString('en-IN')}</Td>
                    <Td></Td>
                    <Td className="text-right text-xs">{visibleRows.reduce((s: number, g: any) => s + (g.bags ?? 0), 0).toLocaleString('en-IN')}</Td>
                    <Td></Td>
                    <Td></Td>
                    <Td className="text-right text-xs">{inr(visibleRows.reduce((s: number, g: any) => s + (g.basic_amount ?? 0), 0))}</Td>
                    <Td></Td>
                    <Td className="text-right text-xs">{inr(visibleRows.reduce((s: number, g: any) => s + (g.total_amount ?? 0), 0))}</Td>
                    <Td></Td><Td></Td><Td></Td>
                  </tr>
                )}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <Td colSpan={7} className="text-right text-xs">TOTAL ({filtered.length}{(fFrom || fTo) ? ' in range' : ''})</Td>
                  <Td className="text-right text-xs">{filtered.reduce((s: number, g: any) => s + (g.qty ?? 0), 0).toLocaleString('en-IN')}</Td>
                  <Td></Td>
                  <Td className="text-right text-xs">{filtered.reduce((s: number, g: any) => s + (g.bags ?? 0), 0).toLocaleString('en-IN')}</Td>
                  <Td></Td>
                  <Td></Td>
                  <Td className="text-right text-xs">{inr(filtered.reduce((s: number, g: any) => s + (g.basic_amount ?? 0), 0))}</Td>
                  <Td></Td>
                  <Td className="text-right text-xs">{inr(filtered.reduce((s: number, g: any) => s + (g.total_amount ?? 0), 0))}</Td>
                  <Td></Td>
                  <Td></Td>
                  <Td></Td>
                </tr>
              </tfoot>
            </table>
            <PageSizeControl page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize}
              totalPages={totalPages} totalItems={filtered.length} className="border-t border-gray-100" />
          </div>
        )}
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit GRN' : 'Add GRN'} size="lg">
        <div className="space-y-4 p-1">
          <FormRow cols={3}>
            <Input
              label="GRN No"
              required
              value={header.grn_no}
              onChange={e => hs('grn_no', e.target.value)}
              placeholder={`GRN-${grnDateStr}-001`}
            />
            <DateInput
              label="GRN Date"
              required
              value={header.grn_date}
              onChange={e => hs('grn_date', e.target.value)}
            />
            <Select
              label="Farm"
              required
              value={header.farm_id}
              onChange={e => hs('farm_id', e.target.value)}
              options={[{ value: '', label: 'Select Farm' }, ...(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))]}
            />
          </FormRow>

          <FormRow cols={3}>
            <Select
              label="Supplier"
              value={header.party_id}
              onChange={e => hs('party_id', e.target.value)}
              options={[{ value: '', label: 'Select Supplier' }, ...(parties ?? []).map((p: any) => ({ value: p.id, label: p.name }))]}
            />
            <Input
              label="Invoice No"
              value={header.invoice_no}
              onChange={e => hs('invoice_no', e.target.value)}
            />
            <DateInput
              label="Invoice Date"
              value={header.invoice_date}
              onChange={e => hs('invoice_date', e.target.value)}
            />
          </FormRow>

          <Input
            label="Vehicle No"
            value={header.vehicle_no}
            onChange={e => hs('vehicle_no', e.target.value)}
          />

          {!editing && (
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              GRN No/Date/Farm/Supplier/Invoice/Vehicle above apply to every item below — one bill, many items. Use "+ Add Another Item" for each additional line.
            </p>
          )}

          {lines.map((line, idx) => {
            const { basicCalc, totalCalc, landedRate, isChick, needsBatch } = lineCalc(line)
            const lu = (k: keyof ItemLine) => (v: string) => updateLine(idx, k, v)
            return (
              <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Item {idx + 1}</span>
                  {lines.length > 1 && (
                    <button onClick={() => removeLine(idx)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>

                <FormRow cols={2}>
                  <Select
                    label="Category"
                    required
                    value={line.category}
                    onChange={e => setLinePatch(idx, { category: e.target.value, item_id: '', item_name: '', unit: '', itemSearch: '' })}
                    options={categoryOptions}
                  />
                  <div />
                </FormRow>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">Link to Purchase Order (optional)</label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    value={line.po_id}
                    onChange={e => {
                      const po = (openPOs ?? []).find((p: any) => p.id === e.target.value)
                      if (po) {
                        // Pre-fill as a convenience only — GRN's item_name stays a
                        // separate, independently-editable field from here on.
                        setLinePatch(idx, {
                          po_id: po.id,
                          item_name: po.item_name ? `${po.item_name}${po.dose ? ' ' + po.dose + ' Dose' : ''}` : line.item_name,
                          unit: po.unit || line.unit,
                          qty: line.qty || (po.quantity != null ? String(po.quantity) : line.qty),
                        })
                        if (po.party_id && !header.party_id) hs('party_id', po.party_id)
                      } else {
                        setLinePatch(idx, { po_id: '' })
                      }
                    }}
                  >
                    <option value="">— Not linked to a PO —</option>
                    {(openPOs ?? []).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.po_no} — {p.item_name ?? '—'} — {p.vendor_name}{p.material_status ? ` (${p.material_status})` : ''}</option>
                    ))}
                  </select>
                  {line.po_id && <p className="text-xs text-blue-600">Linked — this line will be traceable back to that PO.</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">Item</label>
                  <Input
                    placeholder="Search by name or code…"
                    value={line.itemSearch}
                    onChange={e => updateLine(idx, 'itemSearch', e.target.value)}
                  />
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    size={5}
                    value={line.item_id}
                    onChange={e => {
                      const item = (items ?? []).find((i: any) => i.id === e.target.value)
                      if (item) setLinePatch(idx, { item_id: item.id, item_name: item.name, unit: item.unit ?? line.unit })
                    }}
                  >
                    <option value="">— select item —</option>
                    {filteredItemsFor(line).map((i: any) => (
                      <option key={i.id} value={i.id}>{i.code ? `[${i.code}] ` : ''}{i.name}</option>
                    ))}
                  </select>
                  {line.item_name && line.item_id && (
                    <div className="flex items-center gap-2 text-xs text-blue-700">
                      <span>Selected: <strong>{line.item_name}</strong></span>
                      <button onClick={() => setLinePatch(idx, { item_id: '', item_name: '', unit: '' })}><X size={12} /></button>
                    </div>
                  )}
                  {line.item_name && !line.item_id && (
                    <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
                      <span>⚠ "{line.item_name}" is typed text, not picked from the Items Master — stock/consumption reports group by exact item name, so this will show as a separate item unless the spelling exactly matches every other GRN for it.</span>
                      <button onClick={() => setLinePatch(idx, { item_id: '', item_name: '', unit: '' })} className="shrink-0"><X size={12} /></button>
                    </div>
                  )}
                </div>

                <FormRow cols={4}>
                  <Input
                    label="Qty"
                    type="number"
                    value={line.qty}
                    onChange={e => updateLine(idx, 'qty', e.target.value)}
                  />
                  <Input
                    label="Unit"
                    value={line.unit}
                    onChange={e => updateLine(idx, 'unit', e.target.value)}
                  />
                  <Input
                    label="Bags"
                    type="number"
                    value={line.bags}
                    onChange={e => updateLine(idx, 'bags', e.target.value)}
                    hint={(() => { const q = parseFloat(line.qty) || 0, b = parseInt(line.bags) || 0; return q > 0 && b > 0 ? `Avg Bag Weight: ${(q / b).toFixed(2)} ${line.unit || ''}` : undefined })()}
                  />
                  <Select
                    label="Bag Type"
                    value={line.bag_type}
                    onChange={e => updateLine(idx, 'bag_type', e.target.value)}
                    placeholder="— Select —"
                    options={bagTypeOptions}
                  />
                </FormRow>

                <FormRow cols={3}>
                  <Select
                    label="GST %"
                    value={line.gst_pct}
                    onChange={e => updateLine(idx, 'gst_pct', e.target.value)}
                    options={gstOptions}
                  />
                  <Input
                    label="Rate per Unit"
                    type="number"
                    value={line.price_per_unit}
                    onChange={e => updateLine(idx, 'price_per_unit', e.target.value)}
                  />
                  <Input
                    label="Basic Amount"
                    type="number"
                    value={line.basic_amount}
                    onChange={e => setLineManualAmount(idx, 'basic_amount', e.target.value)}
                    hint={[
                      basicCalc > 0 ? `Auto-calc: ${inr(basicCalc)}` : null,
                      line.manualAmountFields.has('basic_amount') ? 'Manually entered — overrides auto-calc' : null,
                    ].filter(Boolean).join(' · ') || undefined}
                  />
                </FormRow>

                <FormRow cols={3}>
                  <Input
                    label="Transport / Other Charges"
                    type="number"
                    value={line.other_charges}
                    onChange={e => updateLine(idx, 'other_charges', e.target.value)}
                    hint="Freight you pay — added to landed cost"
                  />
                  <Input
                    label="Total Amount"
                    type="number"
                    value={line.total_amount}
                    onChange={e => setLineManualAmount(idx, 'total_amount', e.target.value)}
                    hint={[
                      totalCalc > 0 ? `Auto-calc (incl. transport): ${inr(totalCalc)}` : null,
                      line.manualAmountFields.has('total_amount') ? 'Manually entered — overrides auto-calc' : null,
                    ].filter(Boolean).join(' · ') || undefined}
                  />
                  <Input
                    label="Landed Rate / Unit"
                    type="number"
                    value={landedRate ? landedRate.toFixed(3) : ''}
                    onChange={() => {}}
                    disabled
                    hint="Material + transport ÷ qty — used for stock & production cost"
                  />
                </FormRow>

                {needsBatch && (
                  <FormRow cols={3}>
                    <Input
                      label="Batch No"
                      value={line.batch_no}
                      onChange={e => updateLine(idx, 'batch_no', e.target.value)}
                    />
                    <DateInput
                      label="Expiry Date"
                      value={line.expiry_date}
                      onChange={e => updateLine(idx, 'expiry_date', e.target.value)}
                    />
                    <Select
                      label="Flock (optional)"
                      value={line.flock_id}
                      onChange={e => updateLine(idx, 'flock_id', e.target.value)}
                      options={[{ value: '', label: 'None' }, ...(flocks ?? []).map((f: any) => ({ value: f.id, label: f.flock_no }))]}
                    />
                  </FormRow>
                )}

                {isChick && (
                  <FormRow cols={2}>
                    <Select
                      label="Flock"
                      required
                      value={line.flock_id}
                      onChange={e => updateLine(idx, 'flock_id', e.target.value)}
                      options={[{ value: '', label: 'Select Flock' }, ...(flocks ?? []).map((f: any) => ({ value: f.id, label: f.flock_no }))]}
                    />
                    <Input
                      label="Free Chicks"
                      type="number"
                      value={line.free_qty}
                      onChange={e => updateLine(idx, 'free_qty', e.target.value)}
                      hint={`Free birds received (not charged). Total received = ${(parseInt(line.qty) || 0) + (parseInt(line.free_qty) || 0)}`}
                    />
                  </FormRow>
                )}

                <Input
                  label="Remarks"
                  value={line.remarks}
                  onChange={e => updateLine(idx, 'remarks', e.target.value)}
                />
              </div>
            )
          })}

          {!editing && (
            <button
              onClick={addLine}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-brand-300 text-brand-700 rounded hover:bg-brand-50"
            >
              <Plus size={14} /> Add Another Item
            </button>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => mut.mutate()}
              disabled={mut.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {mut.isPending ? 'Saving…' : editing ? 'Update' : `Save${lines.length > 1 ? ` (${lines.length} items)` : ''}`}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Delete GRN">
        <div className="p-4 space-y-4">
          <p className="text-sm">Are you sure you want to delete this GRN? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDelId(null)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => delId && deleteMut.mutate(delId)}
              disabled={deleteMut.isPending}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={bulkDelConfirm} onClose={() => setBulkDelConfirm(false)} title="Delete Selected GRNs">
        <div className="p-4 space-y-4">
          <p className="text-sm">Delete {sel.size} selected GRN(s)? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setBulkDelConfirm(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => bulkDeleteMut.mutate()}
              disabled={bulkDeleteMut.isPending}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {bulkDeleteMut.isPending ? 'Deleting…' : `Delete ${sel.size}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
