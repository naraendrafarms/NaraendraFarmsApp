import React, { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Card, CardHeader, Input, Select, FormRow, Modal,
  EmptyState, Spinner, Td, Th
} from '@/components/ui'
import {
  Plus, Edit2, Search, Package, ToggleLeft, ToggleRight,
  Trash2, Download, Upload, FileDown, CheckSquare, Square, GitMerge, Tags, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useConfigOptions } from '@/hooks/useConfigOptions'
import * as XLSX from 'xlsx'
import { registerItemAlias } from '@/lib/itemAliases'

// ─── Category grouping ────────────────────────────────────────────────────────
const FEED_CATS = ['Feed Ingredient']
const MED_CATS  = ['Medicine', 'Vaccine', 'Supplement', 'Sanitizer', 'Injectable', 'Disinfectant', 'Pesticide']
const PKG_CATS  = ['Packaging']
const EQP_CATS  = ['Equipment', 'Spares', 'Chemical', 'Other']

const TEMPLATE_HEADERS = [
  'name', 'code', 'short_name', 'category', 'sub_type', 'unit',
  'hsn_code', 'manufacturer', 'protein_pct', 'moisture_pct', 'reorder_level'
]

const emptyForm = () => ({
  code: '', name: '', short_name: '', category: '', sub_type: '',
  unit: 'kg', hsn_code: '', manufacturer: '', description: '',
  protein_pct: '', moisture_pct: '', reorder_level: '', is_active: true,
})

// ─── Component ────────────────────────────────────────────────────────────────
export const ItemsMasterPage: React.FC = () => {
  const qc = useQueryClient()
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState<any>(null)
  const [form, setForm]             = useState(emptyForm())
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<any>(null) // single item or 'bulk'
  const [mergeModal, setMergeModal] = useState(false)
  const [keepId, setKeepId]         = useState<string>('')
  const [merging, setMerging]       = useState(false)
  const [aliasItem, setAliasItem]   = useState<any>(null)
  const [newAlias, setNewAlias]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const categoryOptions = useConfigOptions('item_category')
  const unitOptions     = useConfigOptions('unit')
  const feedSubOptions  = useConfigOptions('ingredient_category')
  const medSubOptions   = useConfigOptions('medicine_subtype')

  const { data: items, isLoading } = useQuery({
    queryKey: ['items_master'],
    queryFn: async () => {
      const { data } = await supabase
        .from('items')
        .select('*')
        .order('category').order('name')
      return data ?? []
    }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload: any = {
        code:          form.code.trim() || null,
        name:          form.name.trim(),
        short_name:    form.short_name.trim() || null,
        category:      form.category,
        sub_type:      form.sub_type || null,
        unit:          form.unit,
        hsn_code:      form.hsn_code.trim() || null,
        manufacturer:  form.manufacturer.trim() || null,
        protein_pct:   parseFloat(form.protein_pct) || null,
        moisture_pct:  parseFloat(form.moisture_pct) || null,
        reorder_level: parseFloat(form.reorder_level) || 0,
        is_active:     form.is_active,
      }
      if (!payload.name)     throw new Error('Name is required')
      if (!payload.category) throw new Error('Category is required')
      // Manufacturer (labeled "Make / Model" for Equipment) is only shown
      // for Medicine/Equipment categories — require it there, since a
      // Medicine/Equipment item with no known manufacturer is exactly the
      // kind of item Purchase Intent/PO/GRN downstream needs it to be set on.
      if ((MED_CATS.includes(payload.category) || EQP_CATS.includes(payload.category)) && !payload.manufacturer) {
        throw new Error(MED_CATS.includes(payload.category) ? 'Manufacturer is required' : 'Make / Model is required')
      }
      if (editing) {
        const { error } = await supabase.from('items').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('items').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Item updated!' : 'Item added!')
      qc.invalidateQueries({ queryKey: ['items_master'] })
      setShowForm(false); setEditing(null); setForm(emptyForm())
    },
    onError: (e: any) => toast.error(e.message),
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from('items').update({ is_active: val }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items_master'] }),
    onError: (e: any) => toast.error(e.message),
  })

  // ── Aliases: every other name this item is known by (Purchase Intent,
  // PO, GRN, Medicine Master) — searchable everywhere via item_aliases.
  const { data: aliasesForItemRaw } = useQuery({
    queryKey: ['item_aliases_for_item', aliasItem?.id],
    enabled: !!aliasItem,
    queryFn: async () => {
      const { data, error } = await supabase.from('item_aliases').select('id,alias,source')
        .eq('item_id', aliasItem.id).order('created_at')
      if (error) throw error
      return data ?? []
    },
  })
  // The item's own canonical name/short_name are themselves seeded as
  // aliases (so the item is always found by its own name) — hide those
  // here since they're redundant with the modal title; only show the
  // "extra" names someone deliberately added.
  const aliasesForItem = (aliasesForItemRaw ?? []).filter((a: any) => a.source !== 'item_name' && a.source !== 'short_name')
  const addAliasMut = useMutation({
    mutationFn: async (alias: string) => {
      if (!alias.trim()) throw new Error('Enter a name')
      await registerItemAlias(aliasItem.id, alias, 'manual')
    },
    onSuccess: () => {
      setNewAlias('')
      qc.invalidateQueries({ queryKey: ['item_aliases_for_item', aliasItem?.id] })
      qc.invalidateQueries({ queryKey: ['item_aliases_all'] })
      toast.success('Alias added')
    },
    onError: (e: any) => toast.error(e.message || 'That name is already linked to a different item'),
  })
  const removeAliasMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('item_aliases').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['item_aliases_for_item', aliasItem?.id] })
      qc.invalidateQueries({ queryKey: ['item_aliases_all'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      // Deleting an item silently SET NULLs every GRN/ledger link it has —
      // block if references exist; merge into another item instead.
      const [{ count: grnCount }, { count: ledgerCount }] = await Promise.all([
        supabase.from('grn').select('id', { count: 'exact', head: true }).in('item_id', ids),
        supabase.from('stock_ledger').select('id', { count: 'exact', head: true }).in('item_id', ids),
      ])
      const refs = (grnCount ?? 0) + (ledgerCount ?? 0)
      if (refs > 0) throw new Error(`Can't delete — ${grnCount ?? 0} GRN(s) and ${ledgerCount ?? 0} stock ledger row(s) reference these item(s). Merge into another item instead, or deactivate.`)
      const { error } = await supabase.from('items').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: (_d, ids) => {
      toast.success(`${ids.length} item${ids.length > 1 ? 's' : ''} deleted`)
      setSelected(new Set())
      setConfirmDelete(null)
      qc.invalidateQueries({ queryKey: ['items_master'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const handleMerge = async () => {
    if (!keepId || selected.size < 2) return
    const dupeIds = [...selected].filter(id => id !== keepId)
    setMerging(true)
    try {
      // Remap item_id in all child tables from duplicates → kept item.
      // medicines_master and purchase_intent_lines were added once
      // item_aliases/item_id-linking landed on them (migrations 437, 453) —
      // without remapping these too, medicines_master.item_id would go
      // NULL (ON DELETE SET NULL) undoing the medicine auto-link fix, and
      // purchase_intent_lines.item_id (plain FK, no ON DELETE clause) would
      // block the whole merge with a raw foreign-key-violation error.
      const TABLES = [
        'grn', 'medicine_usage', 'medicine_purchases', 'medicines_master',
        'feed_production_ingredients', 'purchase_orders', 'purchase_intent_lines', 'stock_ledger',
      ]
      for (const table of TABLES) {
        const { error } = await supabase
          .from(table)
          .update({ item_id: keepId })
          .in('item_id', dupeIds)
        if (error && !error.message.includes('does not exist')) throw error
      }
      // grn and feed_production_ingredients also still carry a legacy
      // ingredient_id column from before items unified feed_ingredients +
      // medicines_master + general_items (migration 151) — Feed Mill's
      // stock summary reads THIS column directly, not item_id, so without
      // remapping it too a merge would leave Feed Mill's numbers split
      // across the old and new ids even though item_id is now correct.
      for (const table of ['grn', 'feed_production_ingredients']) {
        const { error } = await supabase
          .from(table)
          .update({ ingredient_id: keepId })
          .in('ingredient_id', dupeIds)
        if (error && !error.message.includes('does not exist') && !error.message.includes('column')) throw error
      }
      // item_aliases.item_id cascades on delete, so without remapping first
      // every alias the duplicate items were known by would be silently
      // lost instead of carried over to the kept item. Its alias text is
      // also globally unique, so a duplicate that already exists for the
      // kept item can't be blanket-UPDATEd (would violate that
      // constraint) — drop those, remap the rest.
      const { data: keptAliases } = await supabase.from('item_aliases').select('id,alias').eq('item_id', keepId)
      const keptNorm = new Set((keptAliases ?? []).map((a: any) => a.alias.trim().toLowerCase()))
      const { data: dupeAliases } = await supabase.from('item_aliases').select('id,alias').in('item_id', dupeIds)
      for (const da of dupeAliases ?? []) {
        const norm = da.alias.trim().toLowerCase()
        if (keptNorm.has(norm)) {
          await supabase.from('item_aliases').delete().eq('id', da.id)
        } else {
          const { error: aliasErr } = await supabase.from('item_aliases').update({ item_id: keepId }).eq('id', da.id)
          if (aliasErr) throw new Error(`Alias remap failed: ${aliasErr.message}`)
          keptNorm.add(norm)
        }
      }
      // Also rewrite the denormalized item_name/ingredient_name text
      // columns — item_id now correctly points at the kept item on every
      // table, but several pages display this text column directly rather
      // than joining through item_id (PO list, Purchase Intent list, Feed
      // Mill), so without this they'd keep showing the OLD item's name
      // even though the link underneath is now correct.
      const { data: keptItem } = await supabase.from('items').select('name').eq('id', keepId).single()
      const { data: dropped } = await supabase.from('items').select('name').in('id', dupeIds)
      let renameWarnings = 0
      if (keptItem?.name) {
        for (const d of (dropped ?? [])) {
          if (!d.name || d.name === keptItem.name) continue
          const { error: e1 } = await supabase.from('grn').update({ item_name: keptItem.name }).eq('item_name', d.name)
          if (e1) throw new Error(`grn rename failed: ${e1.message}`)
          const { error: e2 } = await supabase.from('stock_ledger').update({ item_name: keptItem.name }).eq('item_name', d.name)
          if (e2) throw new Error(`stock_ledger rename failed: ${e2.message}`)
          const { error: e3 } = await supabase.from('purchase_intent_lines').update({ item_name: keptItem.name }).eq('item_name', d.name)
          if (e3) throw new Error(`Purchase Intent rename failed: ${e3.message}`)
          const { error: e4 } = await supabase.from('feed_production_ingredients').update({ ingredient_name: keptItem.name }).eq('ingredient_name', d.name)
          if (e4 && !e4.message.includes('does not exist')) throw new Error(`Feed Mill rename failed: ${e4.message}`)
          // purchase_orders has UNIQUE(po_no, item_name) — a blanket rename
          // could collide with another PO under the same po_no that already
          // uses the kept item's name. Non-fatal: skip that row rather than
          // aborting the whole merge; surfaced as a warning afterward.
          const { error: e5 } = await supabase.from('purchase_orders').update({ item_name: keptItem.name }).eq('item_name', d.name)
          if (e5) renameWarnings++
        }
      }
      // Delete the duplicates
      const { error: delErr } = await supabase.from('items').delete().in('id', dupeIds)
      if (delErr) throw delErr

      toast.success(`Merged ${dupeIds.length} item${dupeIds.length > 1 ? 's' : ''} into the selected item`
        + (renameWarnings ? ` — ${renameWarnings} PO row(s) kept their old item name (name clash on that PO number); item link is still correct, edit those manually if needed` : ''))
      setSelected(new Set())
      setMergeModal(false)
      setKeepId('')
      qc.invalidateQueries({ queryKey: ['items_master'] })
      qc.invalidateQueries({ queryKey: ['item_aliases_all'] })
      qc.invalidateQueries({ queryKey: ['item_aliases_for_item'] })
    } catch (e: any) {
      toast.error('Merge failed: ' + e.message)
    } finally {
      setMerging(false)
    }
  }

  const openMerge = () => {
    setKeepId([...selected][0])
    setMergeModal(true)
  }

  const openNew  = () => { setEditing(null); setForm(emptyForm()); setShowForm(true) }
  const openEdit = (item: any) => {
    setEditing(item)
    setForm({
      code: item.code ?? '', name: item.name ?? '', short_name: item.short_name ?? '',
      category: item.category ?? '', sub_type: item.sub_type ?? '',
      unit: item.unit ?? 'kg', hsn_code: item.hsn_code ?? '',
      manufacturer: item.manufacturer ?? '', description: '',
      protein_pct: item.protein_pct ?? '', moisture_pct: item.moisture_pct ?? '',
      reorder_level: item.reorder_level ?? '', is_active: item.is_active ?? true,
    })
    setShowForm(true)
  }

  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const isFeed = FEED_CATS.includes(form.category)
  const isMed  = MED_CATS.includes(form.category)
  const isPkg  = PKG_CATS.includes(form.category)
  const isEqp  = EQP_CATS.includes(form.category)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (items ?? []).filter((i: any) => {
      if (catFilter && i.category !== catFilter) return false
      if (q && !`${i.name} ${i.code ?? ''} ${i.short_name ?? ''} ${i.manufacturer ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, search, catFilter])

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const i of filtered) {
      if (!map[i.category]) map[i.category] = []
      map[i.category].push(i)
    }
    return map
  }, [filtered])

  const filteredIds = filtered.map((i: any) => i.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const s = new Set(prev); filteredIds.forEach(id => s.delete(id)); return s })
    } else {
      setSelected(prev => new Set([...prev, ...filteredIds]))
    }
  }
  const toggleOne = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  // ── Export Excel ─────────────────────────────────────────────────────────────
  const exportExcel = () => {
    // Column keys MUST match TEMPLATE_HEADERS exactly (lowercase) so a
    // freshly exported file can be re-imported without every row being
    // silently dropped by the `r.name` lookup in importExcel.
    const rows = (items ?? []).map((i: any) => ({
      name: i.name,
      code: i.code ?? '',
      short_name: i.short_name ?? '',
      category: i.category,
      sub_type: i.sub_type ?? '',
      unit: i.unit,
      hsn_code: i.hsn_code ?? '',
      manufacturer: i.manufacturer ?? '',
      protein_pct: i.protein_pct ?? '',
      moisture_pct: i.moisture_pct ?? '',
      reorder_level: i.reorder_level ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Items Master')
    XLSX.writeFile(wb, 'items_master.xlsx')
  }

  // ── Download Template ─────────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const sample = [{
      name: 'Maize 12% Moisture', code: 'MAIZE', short_name: 'Maize',
      category: 'Feed Ingredient', sub_type: 'grain', unit: 'kg',
      hsn_code: '10059010', manufacturer: '', protein_pct: 8.5,
      moisture_pct: 12.0, reorder_level: 1000,
    }]
    const ws = XLSX.utils.json_to_sheet(sample, { header: TEMPLATE_HEADERS })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Items Import Template')
    XLSX.writeFile(wb, 'items_import_template.xlsx')
  }

  // ── Import Excel ──────────────────────────────────────────────────────────────
  const importExcel = async (file: File) => {
    try {
      const buf  = await file.arrayBuffer()
      const wb   = XLSX.read(buf)
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<any>(ws)
      if (!rows.length) { toast.error('No data found in file'); return }

      const records = rows.map((r: any) => ({
        name:          String(r.name ?? '').trim(),
        code:          r.code ? String(r.code).trim() : null,
        short_name:    r.short_name ? String(r.short_name).trim() : null,
        category:      String(r.category ?? 'Other').trim(),
        sub_type:      r.sub_type ? String(r.sub_type).trim() : null,
        unit:          String(r.unit ?? 'kg').trim(),
        hsn_code:      r.hsn_code ? String(r.hsn_code).trim() : null,
        manufacturer:  r.manufacturer ? String(r.manufacturer).trim() : null,
        protein_pct:   r.protein_pct  ? parseFloat(r.protein_pct)  : null,
        moisture_pct:  r.moisture_pct ? parseFloat(r.moisture_pct) : null,
        reorder_level: r.reorder_level ? parseFloat(r.reorder_level) : 0,
        is_active:     true,
      })).filter(r => r.name)

      if (!records.length) { toast.error('No valid rows (name is required)'); return }

      // Check existing names to avoid duplicates
      const names = records.map(r => r.name.toLowerCase())
      const { data: existing } = await supabase.from('items').select('name').in('name', records.map(r => r.name))
      const existingNames = new Set((existing ?? []).map((i: any) => i.name.toLowerCase()))
      const newRecords = records.filter(r => !existingNames.has(r.name.toLowerCase()))
      const skipCount  = records.length - newRecords.length

      if (!newRecords.length) {
        toast('All items already exist — nothing imported', { icon: 'ℹ️' })
        return
      }

      const { error } = await supabase.from('items').insert(newRecords)
      if (error) throw error

      toast.success(`Imported ${newRecords.length} items${skipCount ? ` (${skipCount} skipped — already exist)` : ''}`)
      qc.invalidateQueries({ queryKey: ['items_master'] })
    } catch (e: any) {
      toast.error('Import failed: ' + e.message)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (isLoading) return <Spinner />

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Items Master</h1>
          <p className="text-sm text-gray-500">{(items ?? []).length} items · Feed ingredients, medicines, packaging, equipment and all</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <FileDown size={15}/> Template
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Upload size={15}/> Import
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Download size={15}/> Export
          </button>
          {selected.size >= 2 && (
            <button onClick={openMerge}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
              <GitMerge size={15}/> Merge ({selected.size})
            </button>
          )}
          {someSelected && (
            <button onClick={() => setConfirmDelete('bulk')}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
              <Trash2 size={15}/> Delete ({selected.size})
            </button>
          )}
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
            <Plus size={16}/> Add Item
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
        onChange={e => { if (e.target.files?.[0]) importExcel(e.target.files[0]) }}/>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, code, manufacturer..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"/>
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
          <option value="">All Categories</option>
          {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table grouped by category */}
      {Object.keys(grouped).length === 0
        ? <EmptyState icon={<Package size={32}/>} title="No items found" subtitle="Add items using the button above"/>
        : Object.entries(grouped).map(([cat, rows]) => (
          <Card key={cat}>
            <CardHeader title={cat} subtitle={`${rows.length} items`}/>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <Th>
                      <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                        {allSelected ? <CheckSquare size={15} className="text-brand-600"/> : <Square size={15}/>}
                      </button>
                    </Th>
                    <Th>Code</Th><Th>Name</Th><Th>Short Name</Th>
                    <Th>Sub Type</Th><Th>Unit</Th><Th>HSN</Th>
                    {FEED_CATS.includes(cat) && <><Th>Protein%</Th><Th>Moisture%</Th></>}
                    {MED_CATS.includes(cat)  && <Th>Manufacturer</Th>}
                    <Th>Reorder</Th><Th>Status</Th><Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item: any) => (
                    <tr key={item.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 ${selected.has(item.id) ? 'bg-brand-50' : ''}`}>
                      <Td>
                        <button onClick={() => toggleOne(item.id)} className="text-gray-400 hover:text-gray-600">
                          {selected.has(item.id)
                            ? <CheckSquare size={15} className="text-brand-600"/>
                            : <Square size={15}/>}
                        </button>
                      </Td>
                      <Td className="font-mono text-xs text-gray-500">{item.code ?? '—'}</Td>
                      <Td className="font-medium">{item.name}</Td>
                      <Td className="text-gray-500">{item.short_name ?? '—'}</Td>
                      <Td className="text-gray-500 capitalize">{item.sub_type ?? '—'}</Td>
                      <Td>{item.unit}</Td>
                      <Td className="text-gray-500">{item.hsn_code ?? '—'}</Td>
                      {FEED_CATS.includes(cat) && <>
                        <Td>{item.protein_pct != null ? `${item.protein_pct}%` : '—'}</Td>
                        <Td>{item.moisture_pct != null ? `${item.moisture_pct}%` : '—'}</Td>
                      </>}
                      {MED_CATS.includes(cat) && <Td className="text-gray-500">{item.manufacturer ?? '—'}</Td>}
                      <Td>{item.reorder_level > 0 ? `${item.reorder_level} ${item.unit}` : '—'}</Td>
                      <Td>
                        <button onClick={() => toggleActive.mutate({ id: item.id, val: !item.is_active })}
                          className={`flex items-center gap-1 text-xs font-medium ${item.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                          {item.is_active ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
                          {item.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setAliasItem(item)} className="text-purple-600 hover:text-purple-800" title="Manage alias names">
                            <Tags size={14}/>
                          </button>
                          <button onClick={() => openEdit(item)} className="text-brand-600 hover:text-brand-800">
                            <Edit2 size={14}/>
                          </button>
                          <button onClick={() => setConfirmDelete(item)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      }

      {/* Add / Edit Modal */}
      {showForm && (
        <Modal open={showForm} title={editing ? `Edit — ${editing.name}` : 'Add Item'}
          onClose={() => { setShowForm(false); setEditing(null); setForm(emptyForm()) }}>
          <div className="space-y-4">
            <FormRow>
              <Input label="Item Name" required value={form.name}
                onChange={e => s('name', e.target.value)} placeholder="e.g. Maize 12% Moisture"/>
              <Input label="Code" value={form.code}
                onChange={e => s('code', e.target.value)} placeholder="e.g. MAIZE"/>
            </FormRow>
            <FormRow>
              <Select label="Category" required
                options={categoryOptions}
                value={form.category} onChange={e => { s('category', e.target.value); s('sub_type', '') }}
                placeholder="— Select Category —"/>
              <Select label="Unit" required
                options={unitOptions}
                value={form.unit} onChange={e => s('unit', e.target.value)}/>
            </FormRow>
            <FormRow>
              <Input label="Short Name" value={form.short_name}
                onChange={e => s('short_name', e.target.value)} placeholder="e.g. Maize"/>
              <Input label="HSN Code" value={form.hsn_code}
                onChange={e => s('hsn_code', e.target.value)} placeholder="e.g. 10059010"/>
            </FormRow>

            {isFeed && (
              <>
                <Select label="Sub Type"
                  options={feedSubOptions} value={form.sub_type}
                  onChange={e => s('sub_type', e.target.value)} placeholder="— Select —"/>
                <FormRow>
                  <Input label="Protein %" type="number" value={form.protein_pct}
                    onChange={e => s('protein_pct', e.target.value)} placeholder="e.g. 8.5"/>
                  <Input label="Moisture %" type="number" value={form.moisture_pct}
                    onChange={e => s('moisture_pct', e.target.value)} placeholder="e.g. 12.0"/>
                </FormRow>
              </>
            )}

            {isMed && (
              <FormRow>
                <Select label="Form / Type"
                  options={medSubOptions} value={form.sub_type}
                  onChange={e => s('sub_type', e.target.value)} placeholder="— Select —"/>
                <Input label="Manufacturer" required value={form.manufacturer}
                  onChange={e => s('manufacturer', e.target.value)} placeholder="e.g. Zoetis"/>
              </FormRow>
            )}

            {isPkg && (
              <Input label="Description / Size" value={form.description}
                onChange={e => s('description', e.target.value)} placeholder="e.g. 50kg Gunny Bag"/>
            )}

            {isEqp && (
              <FormRow>
                <Input label="Make / Model" required value={form.manufacturer}
                  onChange={e => s('manufacturer', e.target.value)} placeholder="e.g. Kirloskar"/>
                <Input label="Description" value={form.description}
                  onChange={e => s('description', e.target.value)} placeholder="e.g. Water pump 1HP"/>
              </FormRow>
            )}

            <FormRow>
              <Input label={`Reorder Level (${form.unit || 'unit'})`} type="number"
                value={form.reorder_level}
                onChange={e => s('reorder_level', e.target.value)}
                placeholder="Alert when stock falls below this"/>
            </FormRow>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active}
                onChange={e => s('is_active', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"/>
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>

            <div className="flex gap-3 justify-end pt-2 border-t">
              <button onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {saveMut.isPending ? 'Saving...' : editing ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Merge Modal */}
      {mergeModal && (
        <Modal open={mergeModal} title="Merge Items" onClose={() => setMergeModal(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select which item to <strong>keep</strong>. All GRN, stock, purchase orders, and usage records linked to the other items will be remapped to the kept item. The duplicate items will then be deleted.
            </p>
            <div className="space-y-2">
              {[...(items ?? [])].filter((i: any) => selected.has(i.id)).map((item: any) => (
                <label key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    keepId === item.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <input type="radio" name="keepItem" value={item.id}
                    checked={keepId === item.id}
                    onChange={() => setKeepId(item.id)}
                    className="accent-purple-600"/>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.category} · {item.unit}
                      {item.code ? ` · Code: ${item.code}` : ''}
                      {item.manufacturer ? ` · ${item.manufacturer}` : ''}
                    </div>
                  </div>
                  {keepId === item.id && (
                    <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">KEEP</span>
                  )}
                </label>
              ))}
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              The {selected.size - 1} other item{selected.size > 2 ? 's' : ''} will be permanently deleted after remapping. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end pt-2 border-t">
              <button onClick={() => setMergeModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleMerge} disabled={!keepId || merging}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {merging ? 'Merging…' : 'Confirm Merge'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Aliases Modal — every other name this item is known by, so search
          in Purchase Intent / PO / GRN / Medicine dropdowns finds it under
          any of these names, not just its canonical Items Master name. */}
      {aliasItem && (
        <Modal open={!!aliasItem} title={`Alias Names — ${aliasItem.name}`} onClose={() => { setAliasItem(null); setNewAlias('') }}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Add every other name this item is known by (Purchase Intent wording, PO wording, invoice/GRN name, etc.) — search anywhere in the app will then find it by any of these names, not just "{aliasItem.name}".
            </p>
            <div className="flex gap-2">
              <input
                value={newAlias}
                onChange={e => setNewAlias(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newAlias.trim()) addAliasMut.mutate(newAlias) }}
                placeholder="e.g. IBH Killed VAC, or the full invoice name"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={() => addAliasMut.mutate(newAlias)}
                disabled={addAliasMut.isPending || !newAlias.trim()}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {(aliasesForItem ?? []).length === 0 && (
                <p className="text-xs text-gray-400 py-4 text-center">No alias names yet — this item is only found by "{aliasItem.name}".</p>
              )}
              {(aliasesForItem ?? []).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm text-gray-800">{a.alias}</span>
                    <span className="text-[10px] text-gray-400 ml-2 uppercase">{a.source}</span>
                  </div>
                  <button onClick={() => removeAliasMut.mutate(a.id)} className="text-gray-400 hover:text-red-600">
                    <X size={14}/>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t">
              <button onClick={() => { setAliasItem(null); setNewAlias('') }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <Modal open={!!confirmDelete}
          title={confirmDelete === 'bulk' ? `Delete ${selected.size} Items?` : `Delete "${confirmDelete.name}"?`}
          onClose={() => setConfirmDelete(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {confirmDelete === 'bulk'
                ? `This will permanently delete ${selected.size} selected item${selected.size > 1 ? 's' : ''}. This cannot be undone.`
                : 'This will permanently delete this item. This cannot be undone.'}
            </p>
            <div className="flex gap-3 justify-end pt-2 border-t">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(
                  confirmDelete === 'bulk' ? [...selected] : [confirmDelete.id]
                )}
                disabled={deleteMut.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deleteMut.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
