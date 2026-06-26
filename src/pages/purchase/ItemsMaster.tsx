import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Card, CardHeader, Input, Select, FormRow, Modal,
  EmptyState, Spinner, Td, Th
} from '@/components/ui'
import { Plus, Edit2, Search, Package, ToggleLeft, ToggleRight, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useConfigOptions } from '@/hooks/useConfigOptions'

// ─── Category grouping (values match item_category config_options) ────────────
const FEED_CATS = ['Feed Ingredient']
const MED_CATS  = ['Medicine', 'Vaccine', 'Supplement', 'Sanitizer', 'Injectable', 'Disinfectant', 'Pesticide']
const PKG_CATS  = ['Packaging']
const EQP_CATS  = ['Equipment', 'Spares', 'Chemical', 'Other']

const emptyForm = () => ({
  code: '', name: '', short_name: '', category: '', sub_type: '',
  unit: 'kg', hsn_code: '', manufacturer: '', description: '',
  protein_pct: '', moisture_pct: '', reorder_level: '', is_active: true,
})

// ─── Component ────────────────────────────────────────────────────────────────
export const ItemsMasterPage: React.FC = () => {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyForm())

  const categoryOptions  = useConfigOptions('item_category')
  const unitOptions      = useConfigOptions('unit')
  const feedSubOptions   = useConfigOptions('ingredient_category')
  const medSubOptions    = useConfigOptions('medicine_subtype')

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

  const openNew = () => {
    setEditing(null); setForm(emptyForm()); setShowForm(true)
  }
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

  // Group by category for display
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const i of filtered) {
      if (!map[i.category]) map[i.category] = []
      map[i.category].push(i)
    }
    return map
  }, [filtered])

  if (isLoading) return <Spinner />

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Items Master</h1>
          <p className="text-sm text-gray-500">{(items ?? []).length} items · Feed ingredients, medicines, packaging, equipment and all</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
          <Plus size={16}/> Add Item
        </button>
      </div>

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
                    <Th>Code</Th><Th>Name</Th><Th>Short Name</Th>
                    <Th>Sub Type</Th><Th>Unit</Th><Th>HSN</Th>
                    {FEED_CATS.includes(cat) && <><Th>Protein%</Th><Th>Moisture%</Th></>}
                    {MED_CATS.includes(cat)  && <Th>Manufacturer</Th>}
                    <Th>Reorder</Th><Th>Status</Th><Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
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
                        <button onClick={() => openEdit(item)}
                          className="text-brand-600 hover:text-brand-800">
                          <Edit2 size={14}/>
                        </button>
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

            {/* Feed Ingredient fields */}
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

            {/* Medicine / Vaccine fields */}
            {isMed && (
              <>
                <FormRow>
                  <Select label="Form / Type"
                    options={medSubOptions} value={form.sub_type}
                    onChange={e => s('sub_type', e.target.value)} placeholder="— Select —"/>
                  <Input label="Manufacturer" value={form.manufacturer}
                    onChange={e => s('manufacturer', e.target.value)} placeholder="e.g. Zoetis"/>
                </FormRow>
              </>
            )}

            {/* Packaging fields */}
            {isPkg && (
              <Input label="Description / Size" value={form.description}
                onChange={e => s('description', e.target.value)} placeholder="e.g. 50kg Gunny Bag"/>
            )}

            {/* Equipment / Spares fields */}
            {isEqp && (
              <FormRow>
                <Input label="Make / Model" value={form.manufacturer}
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
    </div>
  )
}
