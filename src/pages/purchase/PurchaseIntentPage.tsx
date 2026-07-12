import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { fmtDate, today } from '@/lib/utils'
import {
  Card, CardHeader, Button, Input, Select, SearchableSelect, Modal, Table, Th, Td,
  Badge, SectionHeader, Spinner, EmptyState, DateInput, FormRow,
} from '@/components/ui'
import { Plus, Trash2, Pencil, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'

// Purchase Intent (indent) — optional stage before a Purchase Order, matching
// the paper/Excel "INDENT FOR NARAENDRA BREEDING FARMS" format already in
// use: header (date, requesting site, prepared/approved by) + line items
// (require for, item, qty, pack size, UOM, total, best-delivery-by). Kept
// completely separate from Purchase Order / GRN naming — each is its own
// document, linked only via an optional reference, never sharing a number.

type LineForm = {
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

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').order('name'); return data ?? [] }
  })
  const { data: items } = useQuery({
    queryKey: ['items_active'],
    queryFn: async () => { const { data } = await supabase.from('items').select('id,name,unit').eq('is_active', true).order('name'); return data ?? [] }
  })
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
        await supabase.from('purchase_intent_lines').delete().eq('intent_id', editingId)
      } else {
        const { data, error } = await supabase.from('purchase_intents').insert(payload).select('id').single()
        if (error) throw error
        intentId = data.id
      }

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

  const rows = intents ?? []

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Purchase Intent"
        subtitle="Requirement raised before a Purchase Order — optional, matches your Indent format"
        action={<Button icon={<Plus size={16} />} onClick={openAdd}>New Intent</Button>}
      />

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
                    <Td className="font-medium text-gray-900">{r.intent_no}</Td>
                    <Td>{fmtDate(r.intent_date)}</Td>
                    <Td>{r.farms?.name ?? '—'}</Td>
                    <Td>{linesArr.length} item{linesArr.length !== 1 ? 's' : ''}</Td>
                    <Td>{r.prepared_by ?? '—'}</Td>
                    <Td>{r.approved_by ?? '—'}</Td>
                    <Td><Badge color={statusColor as any}>{status}</Badge></Td>
                    <Td right>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Pencil size={14} /></button>
                        <button onClick={() => { if (confirm('Delete this Purchase Intent?')) deleteMut.mutate(r.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
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
                  <th className="px-2 py-1.5"></th>
                </tr></thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-2 py-1.5"><input value={l.require_for} onChange={e => setLine(i, { require_for: e.target.value })}
                        className="w-24 border border-gray-200 rounded px-1.5 py-1 text-xs" placeholder="Site/Flock" /></td>
                      <td className="px-2 py-1.5">
                        <input value={l.item_name} onChange={e => setLine(i, { item_name: e.target.value, item_id: '' })}
                          list={`items-list-${i}`}
                          className="w-32 border border-gray-200 rounded px-1.5 py-1 text-xs" placeholder="Item name" />
                        <datalist id={`items-list-${i}`}>
                          {(items ?? []).map((it: any) => <option key={it.id} value={it.name} />)}
                        </datalist>
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
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
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
