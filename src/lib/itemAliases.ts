import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Alias-aware item search — a single item can be known by several names
// (Purchase Intent name, PO name, GRN/invoice name, Medicine Master name,
// etc.). Instead of matching those names against each other as plain text
// (fragile — a stray space or different casing breaks the match, as with
// the Vitalosin duplicate), every name an item is known by is an explicit
// row in item_aliases pointing at one canonical items.id. This hook
// returns SearchableSelect-ready options where `searchText` includes every
// alias, so typing ANY of an item's known names finds it — while `label`
// still shows just the canonical Items Master name.
export function useItemOptionsWithAliases(opts?: { category?: string }) {
  const { data: items } = useQuery({
    queryKey: ['items_for_alias_search', opts?.category ?? null],
    queryFn: async () => {
      let q = supabase.from('items').select('id,name,unit,category').eq('is_active', true).order('name')
      if (opts?.category) q = q.eq('category', opts.category)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
  const { data: aliases } = useQuery({
    queryKey: ['item_aliases_all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('item_aliases').select('item_id,alias')
      if (error) throw error
      return data ?? []
    },
    staleTime: 60 * 1000,
  })

  const aliasMap = new Map<string, string[]>()
  for (const a of aliases ?? []) {
    const list = aliasMap.get(a.item_id) ?? []
    list.push(a.alias)
    aliasMap.set(a.item_id, list)
  }

  const options = (items ?? []).map((it: any) => ({
    value: it.id,
    label: `${it.name}${it.unit ? ` (${it.unit})` : ''}`,
    searchText: (aliasMap.get(it.id) ?? [it.name]).join(' '),
  }))

  return { options, items: items ?? [] }
}

// Same idea as useItemOptionsWithAliases, but for the medicines_master-based
// dropdowns (Daily Entry, Bulk Daily Entry, Flock Sales, VHL, Feed GRN) —
// each medicine now carries item_id (migration 453), so its option's
// searchText includes every alias of the item it's linked to, not just its
// own medicines_master.name.
export function useMedicineOptionsWithAliases() {
  const { data: medicines } = useQuery({
    queryKey: ['medicines_for_alias_search'],
    queryFn: async () => {
      const { data, error } = await supabase.from('medicines_master')
        .select('id,name,unit,rate,item_id').eq('is_active', true).order('name')
      if (error) throw error
      return data ?? []
    },
  })
  const { data: aliases } = useQuery({
    queryKey: ['item_aliases_all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('item_aliases').select('item_id,alias')
      if (error) throw error
      return data ?? []
    },
    staleTime: 60 * 1000,
  })

  const aliasMap = new Map<string, string[]>()
  for (const a of aliases ?? []) {
    const list = aliasMap.get(a.item_id) ?? []
    list.push(a.alias)
    aliasMap.set(a.item_id, list)
  }

  const options = (medicines ?? []).map((m: any) => ({
    value: m.id,
    label: `${m.name}${m.unit ? ` (${m.unit})` : ''}`,
    searchText: m.item_id ? (aliasMap.get(m.item_id) ?? [m.name]).join(' ') : m.name,
  }))

  return { options, medicines: medicines ?? [] }
}

// Registers a free-text name as a permanent alias for an item — call this
// whenever a user picks/links an item for a name that isn't already known
// (e.g. a "Link to Item" action on a Purchase Intent/PO/GRN line). Once
// registered, that exact name resolves to the same item everywhere,
// forever, without relying on a fragile string match at read time.
export async function registerItemAlias(itemId: string, alias: string, source: string = 'manual') {
  if (!itemId || !alias?.trim()) return
  const { error } = await supabase.rpc('fn_register_item_alias', {
    p_item_id: itemId, p_alias: alias.trim(), p_source: source,
  })
  if (error) throw error
}

// Resolves a free-text name to its linked item_id, if any alias already
// matches it exactly (case/whitespace-insensitive).
export async function resolveItemIdByName(name: string): Promise<string | null> {
  if (!name?.trim()) return null
  const { data, error } = await supabase.rpc('fn_resolve_item_id', { p_name: name.trim() })
  if (error) throw error
  return data ?? null
}

export function useInvalidateItemAliases() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['item_aliases_all'] })
    qc.invalidateQueries({ queryKey: ['items_for_alias_search'] })
  }
}
