import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyDbError } from '@/lib/utils'
import { Input, Select, Button } from '@/components/ui'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'
import { useConfigOptions } from '@/hooks/useConfigOptions'

// ── QuickAddParty ─────────────────────────────────────────────────────────────

interface QuickAddPartyProps {
  /** Called with the newly created party { id, name } so the parent can auto-select it */
  onCreated: (party: { id: string; name: string }) => void
  /** Default type pre-filled in the form */
  defaultType?: 'buyer' | 'supplier' | 'both'
}

export const QuickAddParty: React.FC<QuickAddPartyProps> = ({ onCreated, defaultType = 'supplier' }) => {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState(defaultType)
  const [gstin, setGstin] = useState('')
  const [contact, setContact] = useState('')

  const mut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name is required')
      const { data, error } = await supabase
        .from('parties')
        .insert({ name: name.trim(), type, gstin: gstin || null, contact: contact || null })
        .select('id,name')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`${data.name} added`)
      qc.invalidateQueries({ queryKey: ['parties'] })
      qc.invalidateQueries({ queryKey: ['parties_buyers'] })
      qc.invalidateQueries({ queryKey: ['parties_supp'] })
      onCreated(data)
      setOpen(false)
      setName(''); setGstin(''); setContact(''); setType(defaultType)
    },
    onError: (e: any) => toast.error(e.message)
  })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-dashed border-brand-400 text-brand-600 hover:bg-brand-50 transition-colors"
        title="Add new party"
      >
        <Plus size={15} />
      </button>
    )
  }

  return (
    <div className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-72 mt-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">Quick Add Party</p>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={15}/></button>
      </div>
      <div className="space-y-2">
        <Input label="Name *" value={name} onChange={e => setName(e.target.value)} placeholder="Party name" autoFocus />
        <Select label="Type" value={type} onChange={e => setType(e.target.value as any)}
          options={[{value:'buyer',label:'Buyer'},{value:'supplier',label:'Supplier'},{value:'both',label:'Both'}]} />
        <Input label="GSTIN" value={gstin} onChange={e => setGstin(e.target.value)} placeholder="Optional" />
        <Input label="Contact / Phone" value={contact} onChange={e => setContact(e.target.value)} placeholder="Optional" />
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={() => mut.mutate()} loading={mut.isPending} className="flex-1">Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ── QuickAddIngredient ────────────────────────────────────────────────────────

interface QuickAddIngredientProps {
  onCreated: (ingredient: { id: string; name: string; code: string }) => void
}

export const QuickAddIngredient: React.FC<QuickAddIngredientProps> = ({ onCreated }) => {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [unit, setUnit] = useState('Kg')

  const mut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name is required')
      const autoCode = code.trim() || name.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8)
      const { data, error } = await supabase
        .from('feed_ingredients')
        .insert({ name: name.trim(), code: autoCode, unit })
        .select('id,name,code')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`${data.name} added`)
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      qc.invalidateQueries({ queryKey: ['feed_ingredients'] })
      onCreated(data)
      setOpen(false)
      setName(''); setCode(''); setUnit('Kg')
    },
    onError: (e: any) => toast.error(e.message)
  })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-dashed border-brand-400 text-brand-600 hover:bg-brand-50 transition-colors"
        title="Add new ingredient"
      >
        <Plus size={15} />
      </button>
    )
  }

  return (
    <div className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-64 mt-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">Quick Add Ingredient</p>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={15}/></button>
      </div>
      <div className="space-y-2">
        <Input label="Name *" value={name} onChange={e => { setName(e.target.value); if (!code) setCode(e.target.value.replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(0,8)) }} placeholder="e.g. Maize" autoFocus />
        <Input label="Code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Auto-generated" />
        <Select label="Unit" value={unit} onChange={e => setUnit(e.target.value)}
          options={['Kg','Ltr','Bag','Nos','MT','Gm']} />
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={() => mut.mutate()} loading={mut.isPending} className="flex-1">Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ── QuickAddMedicine ──────────────────────────────────────────────────────────
// Medicine dropdowns (Bulk Daily Entry, Daily Entry, Flock Sales, VHL) read
// from `medicines_master`, while GRN/Items Master read from the unified
// `items` table — the two are linked via medicines_master.item_id (migration
// 453), but are separate rows. Adding a medicine here writes BOTH, in one
// step, so it's immediately usable everywhere instead of only appearing in
// whichever table a naive single insert would have hit.

interface QuickAddMedicineProps {
  onCreated: (medicine: { id: string; name: string }) => void
  /** Item category to file this under in Items Master — default 'Medicine' */
  defaultCategory?: string
}

export const QuickAddMedicine: React.FC<QuickAddMedicineProps> = ({ onCreated, defaultCategory = 'Medicine' }) => {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState(defaultCategory)
  const [unit, setUnit] = useState('ml')
  const categoryOptions = useConfigOptions('item_category', [
    { value: 'Medicine', label: 'Medicine' }, { value: 'Vaccine', label: 'Vaccine' },
    { value: 'Supplement', label: 'Supplement' }, { value: 'Sanitizer', label: 'Sanitizer' },
    { value: 'Injectable', label: 'Injectable' }, { value: 'Disinfectant', label: 'Disinfectant' },
  ]).filter(o => ['Medicine','Vaccine','Supplement','Sanitizer','Injectable','Disinfectant'].includes(o.value))
  const unitOptions = useConfigOptions('unit', [
    { value: 'ml', label: 'ml' }, { value: 'Ltr', label: 'Ltr' }, { value: 'Gm', label: 'Gm' },
    { value: 'Kg', label: 'Kg' }, { value: 'Nos', label: 'Nos' }, { value: 'Tab', label: 'Tab' },
  ])

  const mut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name is required')
      const trimmed = name.trim()
      // The database refuses a duplicate name in either master (migration 616).
      // Quick Add is used mid-entry, so the useful response to "it already
      // exists" is not an error — it is to reuse the existing entry and let the
      // user carry on. isDuplicate below only ever swallows the unique
      // violation; any other error is still thrown.
      const isDuplicate = (e: any) =>
        String(e?.code ?? '') === '23505' || String(e?.message ?? '').toLowerCase().includes('duplicate key value')

      let itemId: string | null = null
      const { data: item, error: itemErr } = await supabase
        .from('items')
        .insert({ name: trimmed, category, unit })
        .select('id,name')
        .single()
      if (itemErr && !isDuplicate(itemErr)) throw itemErr
      if (item) itemId = item.id
      else {
        const { data: existing } = await supabase.from('items')
          .select('id').ilike('name', trimmed).limit(1).maybeSingle()
        itemId = existing?.id ?? null
      }

      const { data: med, error: medErr } = await supabase
        .from('medicines_master')
        .insert({ name: trimmed, unit, item_id: itemId })
        .select('id,name')
        .single()
      if (medErr && !isDuplicate(medErr)) throw medErr
      if (med) return { ...med, reused: false }

      const { data: existingMed, error: lookupErr } = await supabase
        .from('medicines_master')
        .select('id,name').ilike('name', trimmed).limit(1).maybeSingle()
      if (lookupErr) throw lookupErr
      if (!existingMed) throw new Error(`"${trimmed}" already exists but could not be found — check Masters → Medicines.`)
      return { ...existingMed, reused: true }
    },
    onSuccess: (data: any) => {
      toast.success(data.reused ? `${data.name} already existed — selected it` : `${data.name} added`)
      qc.invalidateQueries({ queryKey: ['medicines_master_list'] })
      qc.invalidateQueries({ queryKey: ['medicines_for_alias_search'] })
      qc.invalidateQueries({ queryKey: ['items_for_alias_search'] })
      qc.invalidateQueries({ queryKey: ['items-all'] })
      qc.invalidateQueries({ queryKey: ['items_master'] })
      onCreated(data)
      setOpen(false)
      setName(''); setCategory(defaultCategory); setUnit('ml')
    },
    onError: (e: any) => toast.error(friendlyDbError(e, 'medicine'))
  })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-dashed border-brand-400 text-brand-600 hover:bg-brand-50 transition-colors"
        title="Add new medicine"
      >
        <Plus size={15} />
      </button>
    )
  }

  return (
    <div className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-64 mt-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">Quick Add Medicine</p>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={15}/></button>
      </div>
      <div className="space-y-2">
        <Input label="Name *" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amoxicillin" autoFocus />
        <Select label="Category" value={category} onChange={e => setCategory(e.target.value)}
          options={categoryOptions} />
        <Select label="Unit" value={unit} onChange={e => setUnit(e.target.value)}
          options={unitOptions} />
        <p className="text-xs text-gray-400">Also added to Items Master under this category, so it shows up in GRN/Purchase too.</p>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={() => mut.mutate()} loading={mut.isPending} className="flex-1">Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}
