import React, { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { fmtDate, today } from '@/lib/utils'
import {
  Card, CardHeader, Button, Input, Select, SearchableSelect, Modal, Table, Th, Td,
  Badge, SectionHeader, Spinner, EmptyState, DateInput, FormRow,
} from '@/components/ui'
import { Plus, Trash2, Pencil, ClipboardList, Printer, Download, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { printPurchaseIntent } from '@/lib/invoicePrint'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import * as XLSX from 'xlsx'
import { useItemOptionsWithAliases, registerItemAlias, resolveItemIdByName } from '@/lib/itemAliases'

// Purchase Intent (indent) — optional stage before a Purchase Order, matching
// the paper/Excel "INDENT FOR NARAENDRA BREEDING FARMS" format already in
// use: header (date, requesting site, prepared/approved by) + line items
// (require for, item, qty, pack size, UOM, total, best-delivery-by). Kept
// completely separate from Purchase Order / GRN naming — each is its own
// document, linked only via an optional reference, never sharing a number.

type LineForm = {
  id?: string  // existing purchase_intent_lines.id — present only for rows loaded from an existing intent (openEdit); absent for newly-added lines. Used to UPDATE in place instead of delete-all-then-reinsert, so ordered_qty/status tracking survives an edit.
  require_for: string
  item_id: string
  item_name: string
  require_qty: string
  pack_size: string
  uom: string
  best_delivery_by: string
  supplier_party_id: string
}

const emptyLine = (): LineForm => ({
  require_for: '', item_id: '', item_name: '', require_qty: '', pack_size: '', uom: '',
  best_delivery_by: '', supplier_party_id: '',
})

const emptyHeader = () => ({
  intent_no: '', intent_date: today(), farm_id: '', prepared_by: '', approved_by: '', remarks: '',
})

export const PurchaseIntentPage: React.FC = () => {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [header, setHeader] = useState(emptyHeader())
  const [lines, setLines] = useState<LineForm[]>([emptyLine()])
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').order('name'); return data ?? [] }
  })
  const { data: items } = useQuery({
    queryKey: ['items_active'],
    queryFn: async () => { const { data } = await supabase.from('items').select('id,name,unit,manufacturer').eq('is_active', true).order('name'); return data ?? [] }
  })
  const itemById = new Map((items ?? []).map((it: any) => [it.id, it]))
  const itemByNameLower = new Map((items ?? []).map((it: any) => [it.name.toLowerCase().trim(), it]))
  const manufacturerForLine = (l: LineForm) => {
    const it = (l.item_id && itemById.get(l.item_id)) || itemByNameLower.get(l.item_name.toLowerCase().trim())
    return it?.manufacturer ?? null
  }
  // Alias-aware item search — the Intent line's item name stays free text
  // (an intent name legitimately differs from the PO/GRN name for the same
  // real item), but typing an already-known alias (this item's Items
  // Master name, or a name it was linked under from a past PO/GRN/Intent)
  // auto-resolves item_id silently; a "Link to Item" picker handles a
  // genuinely new name.
  const { options: itemOptionsAlias, items: itemsForAlias } = useItemOptionsWithAliases()
  const [linkingLine, setLinkingLine] = useState<number | null>(null)
  const { data: parties } = useQuery({
    queryKey: ['parties_suppliers_intent'],
    queryFn: async () => { const { data } = await supabase.from('parties').select('id,name').in('type', ['supplier', 'both']).order('name'); return data ?? [] }
  })

  const { data: intents, isLoading } = useQuery({
    queryKey: ['purchase_intents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_intents')
        .select('*, farms(name,code), purchase_intent_lines(id,item_name,require_qty,ordered_qty,status)')
        .order('intent_date', { ascending: false })
      if (error) throw error
      return data ?? []
    }
  })

  const openAdd = () => {
    setEditingId(null)
    setHeader(emptyHeader())
    setLines([emptyLine()])
    setShowForm(true)
  }

  const openEdit = async (intent: any) => {
    setEditingId(intent.id)
    setHeader({
      intent_no: intent.intent_no ?? '', intent_date: intent.intent_date ?? today(),
      farm_id: intent.farm_id ?? '', prepared_by: intent.prepared_by ?? '',
      approved_by: intent.approved_by ?? '', remarks: intent.remarks ?? '',
    })
    const { data: fullLines } = await supabase.from('purchase_intent_lines')
      .select('*').eq('intent_id', intent.id).order('sl_no')
    setLines((fullLines ?? []).map((l: any) => ({
      id: l.id,
      require_for: l.require_for ?? '', item_id: l.item_id ?? '', item_name: l.item_name ?? '',
      require_qty: l.require_qty != null ? String(l.require_qty) : '',
      pack_size: l.pack_size != null ? String(l.pack_size) : '',
      uom: l.uom ?? '', best_delivery_by: l.best_delivery_by ?? '',
      supplier_party_id: l.supplier_party_id ?? '',
    })))
    setShowForm(true)
  }

  const setLine = (i: number, patch: Partial<LineForm>) =>
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  const addLine = () => setLines(ls => [...ls, emptyLine()])
  const removeLine = (i: number) => setLines(ls => ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls)

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!header.intent_no.trim()) throw new Error('Intent No. is required')
      const validLines = lines.filter(l => l.item_name.trim() && parseFloat(l.require_qty) > 0)
      if (validLines.length === 0) throw new Error('Add at least one line item')

      const payload = {
        intent_no: header.intent_no.trim(),
        intent_date: header.intent_date,
        farm_id: header.farm_id || null,
        prepared_by: header.prepared_by || null,
        approved_by: header.approved_by || null,
        remarks: header.remarks || null,
        created_by: profile?.id || null,
      }

      let intentId = editingId
      if (editingId) {
        const { error } = await supabase.from('purchase_intents').update(payload).eq('id', editingId)
        if (error) throw error

        // Diff-based upsert instead of delete-all-then-reinsert: a full
        // delete+insert generated new ids for every line on every edit,
        // resetting ordered_qty/status back to defaults (erasing PO-linkage
        // tracking) and breaking any purchase_orders.intent_line_id that
        // pointed at the now-deleted old row id. Update existing lines by
        // their real id (preserving ordered_qty/status), insert genuinely
        // new lines, and delete only the lines the user actually removed
        // from the table.
        const { data: existingLines, error: exErr } = await supabase.from('purchase_intent_lines')
          .select('id').eq('intent_id', editingId)
        if (exErr) throw exErr
        const existingIds = (existingLines ?? []).map((l: any) => l.id)
        const keptIds = validLines.filter(l => l.id).map(l => l.id as string)
        const removedIds = existingIds.filter((id: string) => !keptIds.includes(id))

        if (removedIds.length) {
          const { error: delErr } = await supabase.from('purchase_intent_lines').delete().in('id', removedIds)
          if (delErr) throw delErr
        }

        for (let idx = 0; idx < validLines.length; idx++) {
          const l = validLines[idx]
          const qty = parseFloat(l.require_qty) || 0
          const pack = parseFloat(l.pack_size) || 0
          const row = {
            intent_id: intentId,
            sl_no: idx + 1,
            require_for: l.require_for || null,
            item_id: l.item_id || null,
            item_name: l.item_name.trim(),
            require_qty: qty,
            pack_size: pack || null,
            uom: l.uom || null,
            total_qty: pack ? qty * pack : qty,
            best_delivery_by: l.best_delivery_by || null,
            supplier_party_id: l.supplier_party_id || null,
          }
          if (l.id) {
            // Existing line — UPDATE in place. Deliberately does NOT touch
            // ordered_qty/status, so quantity tracking against linked POs
            // survives editing an unrelated field (e.g. fixing a typo in
            // require_for).
            const { error: updErr } = await supabase.from('purchase_intent_lines').update(row).eq('id', l.id)
            if (updErr) throw updErr
          } else {
            // Genuinely new line added in this edit session.
            const { error: insErr } = await supabase.from('purchase_intent_lines').insert(row)
            if (insErr) throw insErr
          }
        }
      } else {
        const { data, error } = await supabase.from('purchase_intents').insert(payload).select('id').single()
        if (error) throw error
        intentId = data.id

        const lineRows = validLines.map((l, idx) => {
          const qty = parseFloat(l.require_qty) || 0
          const pack = parseFloat(l.pack_size) || 0
          return {
            intent_id: intentId,
            sl_no: idx + 1,
            require_for: l.require_for || null,
            item_id: l.item_id || null,
            item_name: l.item_name.trim(),
            require_qty: qty,
            pack_size: pack || null,
            uom: l.uom || null,
            total_qty: pack ? qty * pack : qty,
            best_delivery_by: l.best_delivery_by || null,
            supplier_party_id: l.supplier_party_id || null,
          }
        })
        const { error: lineErr } = await supabase.from('purchase_intent_lines').insert(lineRows)
        if (lineErr) throw lineErr
      }
    },
    onSuccess: () => {
      toast.success(editingId ? 'Purchase Intent updated' : 'Purchase Intent created')
      qc.invalidateQueries({ queryKey: ['purchase_intents'] })
      qc.invalidateQueries({ queryKey: ['purchase_intent_lines_open'] })
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchase_intents').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['purchase_intents'] }) },
    onError: (e: any) => toast.error(e.message),
  })

  const bulkDeleteMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('purchase_intents').delete().in('id', Array.from(selectedIds))
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(`${selectedIds.size} intent(s) deleted`)
      setSelectedIds(new Set())
      qc.invalidateQueries({ queryKey: ['purchase_intents'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const toggleSel = (id: string) => setSelectedIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleAllSel = () => {
    if (selectedIds.size === (intents ?? []).length) setSelectedIds(new Set())
    else setSelectedIds(new Set((intents ?? []).map((r: any) => r.id)))
  }

  const handlePrint = async (intent: any) => {
    const { data: fullLines, error } = await supabase.from('purchase_intent_lines')
      .select('*, parties(name)').eq('intent_id', intent.id).order('sl_no')
    if (error) { toast.error(error.message); return }
    printPurchaseIntent(
      { intent_no: intent.intent_no, intent_date: intent.intent_date, farm_name: intent.farms?.name ?? null,
        prepared_by: intent.prepared_by, approved_by: intent.approved_by, remarks: intent.remarks },
      (fullLines ?? []).map((l: any) => ({
        sl_no: l.sl_no, require_for: l.require_for, item_name: l.item_name,
        require_qty: l.require_qty, pack_size: l.pack_size, uom: l.uom, total_qty: l.total_qty,
        best_delivery_by: l.best_delivery_by, supplier_name: l.parties?.name ?? null,
      }))
    )
  }

  // Matches the original uploaded Excel format — one sheet per intent, with
  // the company letterhead block and Prepared By / Approved By footer, not
  // just a flat table of columns. A plain CSV can't carry that layout,
  // hence a real multi-sheet .xlsx here instead of exportCSV().
  const handleExport = async () => {
    const rowsToExport = intents ?? []
    if (rowsToExport.length === 0) { toast.error('Nothing to export'); return }
    const { data: allLines } = await supabase.from('purchase_intent_lines')
      .select('*, parties(name)')
      .in('intent_id', rowsToExport.map((r: any) => r.id))
      .order('intent_id').order('sl_no')
    const linesByIntent = new Map<string, any[]>()
    for (const l of allLines ?? []) {
      if (!linesByIntent.has(l.intent_id)) linesByIntent.set(l.intent_id, [])
      linesByIntent.get(l.intent_id)!.push(l)
    }

    const wb = XLSX.utils.book_new()
    for (const intent of rowsToExport) {
      const lines = linesByIntent.get(intent.id) ?? []
      const aoa: (string | number)[][] = [
        ['INDENT FOR NARAENDRA BREEDING FARMS'],
        ['Naraendra Farms', '', '', '5-9-22/21, 1st Floor, JVR Amrit Enclave, Adarsh Nagar, Hyderabad', '', 'GSTIN: 36ABJFM1393C1ZC'],
        ['Intent No', intent.intent_no, '', 'Date of Indent', fmtDate(intent.intent_date), '', 'Site', intent.farms?.name ?? ''],
        [],
        ['SL No', 'Require For', 'Item', 'Require Qty', 'Pack Size', 'UOM', 'Total', 'Best Delivery By', 'Supplier'],
        ...lines.map((l: any) => [
          l.sl_no, l.require_for ?? '', l.item_name ?? '', l.require_qty ?? '', l.pack_size ?? '',
          l.uom ?? '', l.total_qty ?? '', l.best_delivery_by ? fmtDate(l.best_delivery_by) : '', l.parties?.name ?? '',
        ]),
        [],
        ['Prepared By', intent.prepared_by ?? '', '', '', '', '', 'Approved By', intent.approved_by ?? ''],
      ]
      if (intent.remarks) aoa.push(['Remarks', intent.remarks])
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      ws['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 26 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 20 }]
      // Sheet names are capped at 31 chars and can't contain \/?*[] — strip
      // and truncate the intent_no so a slash-heavy number like
      // "PI/NBF/2026/001" doesn't silently break the export.
      const sheetName = (intent.intent_no || intent.id).replace(/[\\/?*[\]]/g, '-').slice(0, 31) || 'Intent'
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    }
    XLSX.writeFile(wb, `purchase-intents-${today()}.xlsx`)
  }

  const IMPORT_HEADERS = ['intent_no', 'intent_date', 'site', 'prepared_by', 'approved_by', 'require_for', 'item', 'qty', 'pack_size', 'uom', 'best_delivery_by', 'supplier', 'remarks']
  const downloadTemplate = () => downloadXlsxTemplate('purchase_intent_import_template.xlsx', IMPORT_HEADERS,
    ['PI/NBF/2026/001', '2026-07-12', 'Hitech Breeding Farms', 'Sourav', 'Ajay', 'ALL FLOCK', 'AQUAMAX', '30', '5', 'LTR', '2026-07-20', 'ABC Traders', ''])

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { headers, rows } = await parseFile(file)
      const col = (name: string) => headers.indexOf(name)
      const get = (r: string[], name: string) => { const c = col(name); return c >= 0 ? (r[c] ?? '').toString().trim() : '' }
      const dataRows = rows.filter(r => r.some(c => (c ?? '').toString().trim() !== ''))
      if (!dataRows.length) { toast.error('No data rows found'); return }

      const farmByName = new Map((farms ?? []).map((f: any) => [f.name.toLowerCase().trim(), f.id]))
      const partyByName = new Map((parties ?? []).map((p: any) => [p.name.toLowerCase().trim(), p.id]))
      const itemByName = new Map((items ?? []).map((it: any) => [it.name.toLowerCase().trim(), it]))

      // Group rows by intent_no — one Excel file can contain multiple
      // intents, each with several line items, just like the multi-line
      // form above.
      const byIntent = new Map<string, string[][]>()
      for (const r of dataRows) {
        const no = get(r, 'intent_no')
        if (!no) continue
        if (!byIntent.has(no)) byIntent.set(no, [])
        byIntent.get(no)!.push(r)
      }
      if (byIntent.size === 0) { toast.error('Rows must have intent_no'); return }

      let intentCount = 0, lineCount = 0
      for (const [intentNo, groupRows] of byIntent) {
        const first = groupRows[0]
        const { data: intentRow, error: intentErr } = await supabase.from('purchase_intents').insert({
          intent_no: intentNo,
          intent_date: get(first, 'intent_date') || today(),
          farm_id: farmByName.get(get(first, 'site').toLowerCase()) ?? null,
          prepared_by: get(first, 'prepared_by') || null,
          approved_by: get(first, 'approved_by') || null,
          remarks: get(first, 'remarks') || null,
          created_by: profile?.id || null,
        }).select('id').single()
        if (intentErr) throw new Error(`${intentNo}: ${intentErr.message}`)
        intentCount++

        const lineRows = groupRows.map((r, idx) => {
          const itemName = get(r, 'item')
          const matchedItem = itemByName.get(itemName.toLowerCase())
          const qty = parseFloat(get(r, 'qty')) || 0
          const pack = parseFloat(get(r, 'pack_size')) || 0
          return {
            intent_id: intentRow.id,
            sl_no: idx + 1,
            require_for: get(r, 'require_for') || null,
            item_id: matchedItem?.id ?? null,
            item_name: itemName,
            require_qty: qty,
            pack_size: pack || null,
            uom: get(r, 'uom') || null,
            total_qty: pack ? qty * pack : qty,
            best_delivery_by: get(r, 'best_delivery_by') || null,
            supplier_party_id: partyByName.get(get(r, 'supplier').toLowerCase()) ?? null,
          }
        }).filter(l => l.item_name)
        if (lineRows.length === 0) continue
        const { error: lineErr } = await supabase.from('purchase_intent_lines').insert(lineRows)
        if (lineErr) throw new Error(`${intentNo}: ${lineErr.message}`)
        lineCount += lineRows.length
      }
      qc.invalidateQueries({ queryKey: ['purchase_intents'] })
      toast.success(`Imported ${intentCount} intent(s) · ${lineCount} line item(s)`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      e.target.value = ''
    }
  }

  const rows = intents ?? []

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Purchase Intent"
        subtitle="Requirement raised before a Purchase Order — optional, matches your Indent format"
        action={
          <div className="flex gap-2">
            <Button variant="outline" icon={<Download size={14} />} onClick={downloadTemplate}>Template</Button>
            <Button variant="outline" icon={<Upload size={14} />} onClick={() => importRef.current?.click()}>Import</Button>
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            <Button variant="outline" icon={<Download size={14} />} onClick={handleExport}>Export</Button>
            <Button icon={<Plus size={16} />} onClick={openAdd}>New Intent</Button>
          </div>
        }
      />

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm">
          <span className="text-red-700 font-medium">{selectedIds.size} selected</span>
          <Button variant="danger" size="sm" loading={bulkDeleteMut.isPending}
            onClick={() => { if (confirm(`Delete ${selectedIds.size} selected intent(s)?`)) bulkDeleteMut.mutate() }}>
            <Trash2 size={14} className="mr-1" /> Delete Selected
          </Button>
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<ClipboardList size={32} />} title="No purchase intents yet"
            subtitle="Raise one before creating a Purchase Order, or skip this and create POs directly."
            action={<Button icon={<Plus size={16} />} onClick={openAdd}>New Intent</Button>} />
        ) : (
          <Table>
            <thead><tr>
              <Th><input type="checkbox" checked={rows.length > 0 && selectedIds.size === rows.length} onChange={toggleAllSel} /></Th>
              <Th>Intent No.</Th>
              <Th>Date</Th>
              <Th>Site</Th>
              <Th>Items</Th>
              <Th>Prepared By</Th>
              <Th>Approved By</Th>
              <Th>Status</Th>
              <Th right>Actions</Th>
            </tr></thead>
            <tbody>
              {rows.map((r: any) => {
                const linesArr = r.purchase_intent_lines ?? []
                const allOrdered = linesArr.length > 0 && linesArr.every((l: any) => l.status === 'ordered')
                const anyOrdered = linesArr.some((l: any) => (l.ordered_qty ?? 0) > 0)
                const status = allOrdered ? 'ordered' : anyOrdered ? 'partial' : 'open'
                const statusColor = status === 'ordered' ? 'green' : status === 'partial' ? 'orange' : 'gray'
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <Td><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSel(r.id)} /></Td>
                    <Td className="font-medium text-gray-900">{r.intent_no}</Td>
                    <Td>{fmtDate(r.intent_date)}</Td>
                    <Td>{r.farms?.name ?? '—'}</Td>
                    <Td>{linesArr.length} item{linesArr.length !== 1 ? 's' : ''}</Td>
                    <Td>{r.prepared_by ?? '—'}</Td>
                    <Td>{r.approved_by ?? '—'}</Td>
                    <Td><Badge color={statusColor as any}>{status}</Badge></Td>
                    <Td right>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handlePrint(r)} className="p-1.5 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600" title="Print"><Printer size={14} /></button>
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => { if (confirm('Delete this Purchase Intent?')) deleteMut.mutate(r.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Purchase Intent' : 'New Purchase Intent'} size="2xl"
        footer={<>
          <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button variant="primary" loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>
        </>}
      >
        <div className="flex flex-col gap-4">
          <FormRow cols={3}>
            <Input label="Intent No." required value={header.intent_no} onChange={e => setHeader(h => ({ ...h, intent_no: e.target.value }))} placeholder="e.g. PI/NBF/2026/001" />
            <DateInput label="Intent Date" value={header.intent_date} onChange={e => setHeader(h => ({ ...h, intent_date: e.target.value }))} />
            <Select label="Requesting Site" placeholder="Select site"
              options={(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))}
              value={header.farm_id} onChange={e => setHeader(h => ({ ...h, farm_id: e.target.value }))} />
          </FormRow>
          <FormRow cols={3}>
            <Input label="Prepared By" value={header.prepared_by} onChange={e => setHeader(h => ({ ...h, prepared_by: e.target.value }))} />
            <Input label="Approved By" value={header.approved_by} onChange={e => setHeader(h => ({ ...h, approved_by: e.target.value }))} />
            <Input label="Remarks" value={header.remarks} onChange={e => setHeader(h => ({ ...h, remarks: e.target.value }))} />
          </FormRow>

          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Line Items</span>
              <Button variant="outline" size="xs" icon={<Plus size={13} />} onClick={addLine}>Add Line</Button>
            </div>
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50 text-gray-500 uppercase">
                  <th className="px-2 py-1.5 text-left">Require For</th>
                  <th className="px-2 py-1.5 text-left">Item</th>
                  <th className="px-2 py-1.5 text-right">Qty</th>
                  <th className="px-2 py-1.5 text-right">Pack Size</th>
                  <th className="px-2 py-1.5 text-left">UOM</th>
                  <th className="px-2 py-1.5 text-left">Best Delivery By</th>
                  <th className="px-2 py-1.5 text-left">Supplier</th>
                  <th className="px-2 py-1.5 sticky right-0 bg-gray-50"></th>
                </tr></thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-2 py-1.5"><input value={l.require_for} onChange={e => setLine(i, { require_for: e.target.value })}
                        className="w-24 border border-gray-200 rounded px-1.5 py-1 text-xs" placeholder="Site/Flock" /></td>
                      <td className="px-2 py-1.5">
                        <input value={l.item_name}
                          onChange={e => setLine(i, { item_name: e.target.value, item_id: '' })}
                          onBlur={async e => {
                            const name = e.target.value.trim()
                            if (!name || l.item_id) return
                            const resolved = await resolveItemIdByName(name).catch(() => null)
                            if (resolved) setLine(i, { item_id: resolved })
                          }}
                          list={`items-list-${i}`}
                          className="w-32 border border-gray-200 rounded px-1.5 py-1 text-xs" placeholder="Item name" />
                        <datalist id={`items-list-${i}`}>
                          {itemsForAlias.map((it: any) => <option key={it.id} value={it.name} label={it.manufacturer ? `${it.name} · ${it.manufacturer}` : it.name} />)}
                        </datalist>
                        {l.item_name && manufacturerForLine(l) && (
                          <div className="text-[10px] text-gray-500 mt-0.5">Mfr: {manufacturerForLine(l)}</div>
                        )}
                        {l.item_name && (
                          l.item_id ? (
                            <div className="text-[10px] text-blue-600 mt-0.5">✓ linked to Items Master</div>
                          ) : (
                            <button type="button" onClick={() => setLinkingLine(i)}
                              className="text-[10px] text-amber-600 hover:text-amber-800 underline mt-0.5">
                              Not linked — Link to Item
                            </button>
                          )
                        )}
                        {linkingLine === i && (
                          <div className="mt-1 w-56">
                            <SearchableSelect
                              placeholder="Search Items Master…"
                              options={itemOptionsAlias}
                              value=""
                              onChange={async v => {
                                if (!v) { setLinkingLine(null); return }
                                await registerItemAlias(v, l.item_name, 'intent').catch(() => {})
                                setLine(i, { item_id: v })
                                setLinkingLine(null)
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1.5"><input type="number" value={l.require_qty} onChange={e => setLine(i, { require_qty: e.target.value })}
                        className="w-16 border border-gray-200 rounded px-1.5 py-1 text-xs text-right" /></td>
                      <td className="px-2 py-1.5"><input type="number" value={l.pack_size} onChange={e => setLine(i, { pack_size: e.target.value })}
                        className="w-16 border border-gray-200 rounded px-1.5 py-1 text-xs text-right" /></td>
                      <td className="px-2 py-1.5"><input value={l.uom} onChange={e => setLine(i, { uom: e.target.value })}
                        className="w-14 border border-gray-200 rounded px-1.5 py-1 text-xs" placeholder="KG" /></td>
                      <td className="px-2 py-1.5"><input type="date" value={l.best_delivery_by} onChange={e => setLine(i, { best_delivery_by: e.target.value })}
                        className="w-32 border border-gray-200 rounded px-1.5 py-1 text-xs" /></td>
                      <td className="px-2 py-1.5">
                        <select value={l.supplier_party_id} onChange={e => setLine(i, { supplier_party_id: e.target.value })}
                          className="w-28 border border-gray-200 rounded px-1.5 py-1 text-xs">
                          <option value="">—</option>
                          {(parties ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 sticky right-0 bg-white border-l border-gray-100">
                        <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600" title="Remove line"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
