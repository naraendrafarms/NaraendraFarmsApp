import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { Card, CardHeader, Input, Select, FormRow, Modal, EmptyState, Spinner, Td, Th, DateInput, Badge } from '@/components/ui'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, Download, X } from 'lucide-react'
import { useConfigOptions } from '@/hooks/useConfigOptions'

const GST_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '5', label: '5%' },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
]

const BATCH_CATS = new Set(['Medicine', 'Vaccine', 'Supplement', 'Injectable'])

function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const lines = [headers, ...rows].map(r => r.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(','))
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

const emptyForm = () => ({
  grn_no: '', grn_date: today(), farm_id: '', party_id: '',
  invoice_no: '', invoice_date: today(), category: 'Feed Ingredient',
  item_id: '', item_name: '', flock_id: '',
  qty: '', unit: '', bags: '', price_per_unit: '',
  basic_amount: '', gst_pct: '0', gst_amount: '', total_amount: '',
  batch_no: '', expiry_date: '', vehicle_no: '', remarks: ''
})

export const GRNPage: React.FC = () => {
  const qc = useQueryClient()
  const categoryOptions = useConfigOptions('item_category')
  const CATEGORIES = categoryOptions.map(o => o.value)

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

  const [form, setForm] = useState(emptyForm())
  const [itemSearch, setItemSearch] = useState('')

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const basicCalc = (parseFloat(form.qty) || 0) * (parseFloat(form.price_per_unit) || 0)
  const gstCalc = basicCalc * (parseFloat(form.gst_pct) || 0) / 100
  const totalCalc = basicCalc + gstCalc

  const isChick = form.category === 'Chicks'
  const needsBatch = BATCH_CATS.has(form.category)

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

  const { data: flocks } = useQuery({
    queryKey: ['flocks-active'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks').select('id,flock_no').order('flock_no')
      return data ?? []
    }
  })

  const { data: grns, isLoading } = useQuery({
    queryKey: ['grns'],
    queryFn: async () => {
      const { data } = await supabase.from('grn')
        .select('*, farms(name), parties(name)')
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

  const stats = useMemo(() => {
    if (!fItem || filtered.length === 0) return null
    const rates = filtered.map((g: any) => parseFloat(g.price_per_unit) || 0).filter(Boolean)
    if (!rates.length) return null
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length
    return { avg, min: Math.min(...rates), max: Math.max(...rates) }
  }, [fItem, filtered])

  const filteredItems = useMemo(() => {
    if (!items) return []
    return items.filter((i: any) => {
      const catMatch = !form.category || i.category === form.category
      const search = itemSearch.toLowerCase()
      const nameMatch = !search || i.name.toLowerCase().includes(search) || (i.code ?? '').toLowerCase().includes(search)
      return catMatch && nameMatch
    })
  }, [items, form.category, itemSearch])

  const openAdd = () => {
    setEditing(null)
    setItemSearch('')
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (g: any) => {
    setEditing(g)
    setItemSearch('')
    setForm({
      grn_no: g.grn_no ?? '',
      grn_date: g.grn_date ?? today(),
      farm_id: g.farm_id ?? '',
      party_id: g.party_id ?? '',
      invoice_no: g.invoice_no ?? '',
      invoice_date: g.invoice_date ?? today(),
      category: g.category ?? 'Feed Ingredient',
      item_id: g.item_id ?? '',
      item_name: g.item_name ?? '',
      flock_id: g.flock_id ?? '',
      qty: g.qty?.toString() ?? '',
      unit: g.unit ?? '',
      bags: g.bags?.toString() ?? '',
      price_per_unit: g.price_per_unit?.toString() ?? '',
      basic_amount: g.basic_amount?.toString() ?? '',
      gst_pct: g.gst_pct?.toString() ?? '0',
      gst_amount: g.gst_amount?.toString() ?? '',
      total_amount: g.total_amount?.toString() ?? '',
      batch_no: g.batch_no ?? '',
      expiry_date: g.expiry_date ?? '',
      vehicle_no: g.vehicle_no ?? '',
      remarks: g.remarks ?? ''
    })
    setShowForm(true)
  }

  const payload = () => ({
    grn_no: form.grn_no,
    grn_date: form.grn_date,
    farm_id: form.farm_id,
    party_id: form.party_id || null,
    invoice_no: form.invoice_no || null,
    invoice_date: form.invoice_date || null,
    category: form.category,
    item_id: form.item_id || null,
    ingredient_id: form.category === 'Feed Ingredient' ? (form.item_id || null) : null,
    item_name: form.item_name || null,
    qty: parseFloat(form.qty) || null,
    unit: form.unit || null,
    bags: parseInt(form.bags) || null,
    price_per_unit: parseFloat(form.price_per_unit) || null,
    basic_amount: parseFloat(form.basic_amount) || basicCalc || null,
    gst_pct: parseFloat(form.gst_pct) || 0,
    gst_amount: parseFloat(form.gst_amount) || (gstCalc > 0 ? +gstCalc.toFixed(2) : null),
    total_amount: parseFloat(form.total_amount) || totalCalc || null,
    batch_no: needsBatch ? (form.batch_no || null) : null,
    expiry_date: needsBatch ? (form.expiry_date || null) : null,
    flock_id: (isChick || needsBatch) ? (form.flock_id || null) : null,
    vehicle_no: form.vehicle_no || null,
    remarks: form.remarks || null
  })

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.grn_no || !form.grn_date || !form.farm_id) throw new Error('GRN No, date and farm are required')
      if (isChick && !form.flock_id) throw new Error('Select the flock for this chick GRN')
      if (editing) {
        const { error } = await supabase.from('grn').update(payload()).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('grn').insert(payload())
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grns'] })
      toast.success(editing ? 'GRN updated' : 'GRN saved')
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
    const headers = ['GRN No', 'Date', 'Farm', 'Supplier', 'Category', 'Item', 'Qty', 'Unit', 'Bags', 'Rate', 'Basic', 'GST%', 'GST Amt', 'Total', 'Batch', 'Expiry', 'Vehicle', 'Remarks']
    const rows = filtered.map((g: any) => [
      g.grn_no, fmtDate(g.grn_date), g.farms?.name ?? '', g.parties?.name ?? '',
      g.category ?? '', g.item_name ?? '',
      g.qty?.toString() ?? '', g.unit ?? '', g.bags?.toString() ?? '',
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
                {filtered.map((g: any) => (
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
                    <Td className="text-right">{g.price_per_unit != null ? inr(g.price_per_unit) : '-'}</Td>
                    <Td className="text-right">{g.basic_amount != null ? inr(g.basic_amount) : '-'}</Td>
                    <Td className="text-right">{g.gst_pct != null ? `${g.gst_pct}%` : '-'}</Td>
                    <Td className="text-right font-medium">{g.total_amount != null ? inr(g.total_amount) : '-'}</Td>
                    <Td>{g.batch_no ?? '-'}</Td>
                    <Td>{g.expiry_date ? fmtDate(g.expiry_date) : '-'}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(g)} className="p-1 hover:text-blue-600"><Edit2 size={14} /></button>
                        <button onClick={() => setDelId(g.id)} className="p-1 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit GRN' : 'Add GRN'} size="lg">
        <div className="space-y-4 p-1">
          <FormRow cols={3}>
            <Input
              label="GRN No"
              required
              value={form.grn_no}
              onChange={e => s('grn_no', e.target.value)}
              placeholder={`GRN-${grnDateStr}-001`}
            />
            <DateInput
              label="GRN Date"
              required
              value={form.grn_date}
              onChange={e => s('grn_date', e.target.value)}
            />
            <Select
              label="Farm"
              required
              value={form.farm_id}
              onChange={e => s('farm_id', e.target.value)}
              options={[{ value: '', label: 'Select Farm' }, ...(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))]}
            />
          </FormRow>

          <FormRow cols={3}>
            <Select
              label="Supplier"
              value={form.party_id}
              onChange={e => s('party_id', e.target.value)}
              options={[{ value: '', label: 'Select Supplier' }, ...(parties ?? []).map((p: any) => ({ value: p.id, label: p.name }))]}
            />
            <Input
              label="Invoice No"
              value={form.invoice_no}
              onChange={e => s('invoice_no', e.target.value)}
            />
            <DateInput
              label="Invoice Date"
              value={form.invoice_date}
              onChange={e => s('invoice_date', e.target.value)}
            />
          </FormRow>

          <FormRow cols={2}>
            <Select
              label="Category"
              required
              value={form.category}
              onChange={e => {
                setForm(f => ({ ...f, category: e.target.value, item_id: '', item_name: '', unit: '' }))
                setItemSearch('')
              }}
              options={categoryOptions}
            />
            <Input
              label="Vehicle No"
              value={form.vehicle_no}
              onChange={e => s('vehicle_no', e.target.value)}
            />
          </FormRow>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">Item</label>
            <Input
              placeholder="Search by name or code…"
              value={itemSearch}
              onChange={e => setItemSearch(e.target.value)}
            />
            <select
              className="w-full border rounded px-2 py-1.5 text-sm"
              size={5}
              value={form.item_id}
              onChange={e => {
                const item = (items ?? []).find((i: any) => i.id === e.target.value)
                if (item) {
                  setForm(f => ({ ...f, item_id: item.id, item_name: item.name, unit: item.unit ?? f.unit }))
                }
              }}
            >
              <option value="">— select item —</option>
              {filteredItems.map((i: any) => (
                <option key={i.id} value={i.id}>{i.code ? `[${i.code}] ` : ''}{i.name}</option>
              ))}
            </select>
            {form.item_name && (
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <span>Selected: <strong>{form.item_name}</strong></span>
                <button onClick={() => setForm(f => ({ ...f, item_id: '', item_name: '', unit: '' }))}><X size={12} /></button>
              </div>
            )}
          </div>

          <FormRow cols={4}>
            <Input
              label="Qty"
              type="number"
              value={form.qty}
              onChange={e => s('qty', e.target.value)}
            />
            <Input
              label="Unit"
              value={form.unit}
              onChange={e => s('unit', e.target.value)}
            />
            <Input
              label="Bags"
              type="number"
              value={form.bags}
              onChange={e => s('bags', e.target.value)}
            />
            <Select
              label="GST %"
              value={form.gst_pct}
              onChange={e => s('gst_pct', e.target.value)}
              options={GST_OPTIONS}
            />
          </FormRow>

          <FormRow cols={3}>
            <Input
              label="Rate per Unit"
              type="number"
              value={form.price_per_unit}
              onChange={e => s('price_per_unit', e.target.value)}
            />
            <Input
              label="Basic Amount"
              type="number"
              value={form.basic_amount}
              onChange={e => s('basic_amount', e.target.value)}
              hint={basicCalc > 0 ? `Auto: ${inr(basicCalc)}` : undefined}
            />
            <Input
              label="Total Amount"
              type="number"
              value={form.total_amount}
              onChange={e => s('total_amount', e.target.value)}
              hint={totalCalc > 0 ? `Auto: ${inr(totalCalc)}` : undefined}
            />
          </FormRow>

          {needsBatch && (
            <FormRow cols={3}>
              <Input
                label="Batch No"
                value={form.batch_no}
                onChange={e => s('batch_no', e.target.value)}
              />
              <DateInput
                label="Expiry Date"
                value={form.expiry_date}
                onChange={e => s('expiry_date', e.target.value)}
              />
              <Select
                label="Flock (optional)"
                value={form.flock_id}
                onChange={e => s('flock_id', e.target.value)}
                options={[{ value: '', label: 'None' }, ...(flocks ?? []).map((f: any) => ({ value: f.id, label: f.flock_no }))]}
              />
            </FormRow>
          )}

          {isChick && (
            <Select
              label="Flock"
              required
              value={form.flock_id}
              onChange={e => s('flock_id', e.target.value)}
              options={[{ value: '', label: 'Select Flock' }, ...(flocks ?? []).map((f: any) => ({ value: f.id, label: f.flock_no }))]}
            />
          )}

          <Input
            label="Remarks"
            value={form.remarks}
            onChange={e => s('remarks', e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => mut.mutate()}
              disabled={mut.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {mut.isPending ? 'Saving…' : editing ? 'Update' : 'Save'}
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
