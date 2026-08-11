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
      let q = supabase.from('items').select('id,name,unit,category,manufacturer').eq('is_active', true).order('name')
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
    label: `${it.name}${it.manufacturer ? ` · ${it.manufacturer}` : ''}${it.unit ? ` (${it.unit})` : ''}`,
    searchText: [...(aliasMap.get(it.id) ?? [it.name]), it.manufacturer].filter(Boolean).join(' '),
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
      // The linked item is fetched too, because Item Master is the source of
      // truth: a medicine whose item has been deleted or deactivated must not
      // keep appearing in the dropdown after the master was cleaned up.
      const { data, error } = await supabase.from('medicines_master')
        .select('id,name,unit,rate,item_id,items!item_id(id,name,is_active)')
        .eq('is_active', true).order('name')
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

  // Two things the dropdown got wrong, both of which survived a master cleanup
  // and kept showing entries the user had already dealt with:
  //
  //   1. Every medicines_master row was listed, so two rows with the SAME name
  //      appeared twice — indistinguishable, and picking the wrong one splits
  //      the history across two entries again.
  //   2. The linked item was never checked, so a medicine pointing at an item
  //      that had been merged away or deactivated stayed in the list forever.
  //
  // Deduplication is by NAME, not by item_id. Two different medicines can
  // legitimately share one item — "Anichol 60" is the Jubilant brand of the
  // item "Choline Chloride 60%" — and collapsing those would hide a real,
  // separately-tracked product.
  const live = (medicines ?? []).filter((m: any) => {
    const it = Array.isArray(m.items) ? m.items[0] : m.items
    // No link at all is allowed — a just-added medicine is linked a moment
    // later by the trigger, and hiding it would look like the save failed.
    // A link to an item that is gone or inactive is not.
    if (!m.item_id) return true
    return !!it && it.is_active !== false
  })

  const normName = (s: any) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
  const byName = new Map<string, any>()
  for (const m of live) {
    const key = normName(m.name)
    const kept = byName.get(key)
    // Prefer the linked row: it is the one Item Master knows about, and the
    // one whose unit comes from the source of truth.
    if (!kept || (!kept.item_id && m.item_id)) byName.set(key, m)
  }

  const options = Array.from(byName.values()).map((m: any) => ({
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

// ── Name canonicalisation for the price lookups ─────────────────────────────
// Feed Mill and useFeedRates price an ingredient by matching its NAME against
// GRN item names. That breaks the moment the same item is written two ways —
// "Toxfin 360 Dry" in a formula vs "Toxfin360 Dry" on every GRN — and the
// ingredient silently costs zero while the rest of the formula prices fine.
//
// Merging the duplicate items in Items Master does NOT fix this: the merge
// remaps ids (item_id, ingredient_id) and carries the aliases over, but
// feed_formula_ingredients.ingredient_name is plain text and is never
// rewritten. The alias table already knows both spellings are the same item,
// so the fix is to collapse every name through it before matching.
//
// Returns a map of lower(alias) -> lower(canonical items.name). Callers should
// pass BOTH sides of a comparison through it, so a GRN written under an alias
// and a formula written under another both land on the same key.
export async function fetchItemNameCanonMap(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('item_aliases')
    .select('alias, items!item_id(name)')
  if (error) return {}
  const m: Record<string, string> = {}
  for (const r of data ?? []) {
    const rel = (r as any).items
    const canonical = Array.isArray(rel) ? rel[0]?.name : rel?.name
    if (!canonical) continue
    const alias = String((r as any).alias ?? '').trim().toLowerCase()
    if (alias) m[alias] = String(canonical).trim().toLowerCase()
  }
  return m
}

// Applies the map above; falls back to the name itself when no alias exists,
// so behaviour is unchanged for every item that was already matching.
export const canonName = (canon: Record<string, string>, name: any): string => {
  const k = String(name ?? '').trim().toLowerCase()
  return canon[k] ?? k
}
