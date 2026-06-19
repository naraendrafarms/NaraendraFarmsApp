import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Input, Select, Button } from '@/components/ui'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

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
