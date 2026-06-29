import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Recipe-cost per kg for each finished feed type.
 * cost/kg of a formula = Σ (ingredient_percentage/100 × latest GRN price of that ingredient)
 * A feed type's cost/kg = average recipe cost of the active formulas mapped to it (feed_formulas.feed_type_id).
 *
 * Returns:
 *  - byTypeId:  { [feed_type_id]: cost_per_kg }
 *  - byCode:    { [feed_type_code_lowercased]: cost_per_kg }
 *  - rate(code): helper → cost/kg for a feed type code (0 if unknown)
 */
export interface FeedRates {
  byTypeId: Record<string, number>
  byCode: Record<string, number>
  rate: (code?: string | null) => number
}

export function useFeedRates(): FeedRates {
  const { data } = useQuery({
    queryKey: ['feed_recipe_rates'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<FeedRates> => {
      // 1. Latest GRN price per ingredient (feed category)
      const { data: grn } = await supabase
        .from('grn')
        .select('item_name,price_per_unit,qty,other_charges,grn_date,feed_ingredients(name)')
        .eq('category', 'Feed')
        .order('grn_date', { ascending: false })
      const rateByIng: Record<string, number> = {}
      for (const g of (grn ?? [])) {
        const name = (g as any).item_name || (g as any).feed_ingredients?.name
        if (name && g.price_per_unit) {
          const k = String(name).trim().toLowerCase()
          // landed rate = material rate + transport per unit (latest GRN wins)
          const qty = Number((g as any).qty) || 0
          const landed = Number(g.price_per_unit) + (qty > 0 ? (Number((g as any).other_charges) || 0) / qty : 0)
          if (!(k in rateByIng)) rateByIng[k] = landed
        }
      }
      // Fall back to opening-stock / adjustment rate for items with no GRN purchase
      const { data: slRates } = await supabase
        .from('stock_ledger')
        .select('item_name,unit_price,txn_date,txn_type')
        .in('txn_type', ['opening', 'adjustment_in'])
        .order('txn_date', { ascending: false })
      for (const r of (slRates ?? [])) {
        const k = String((r as any).item_name ?? '').trim().toLowerCase()
        if (k && r.unit_price && !(k in rateByIng)) rateByIng[k] = Number(r.unit_price)
      }

      // 2. Formulas with their feed type
      const { data: formulas } = await supabase
        .from('feed_formulas')
        .select('id,feed_type_id,is_active')
      // 3. Formula ingredients (percentages)
      const { data: fIng } = await supabase
        .from('feed_formula_ingredients')
        .select('formula_id,ingredient_name,percentage')
      // 4. Feed types (id ↔ code)
      const { data: feedTypes } = await supabase
        .from('feed_types')
        .select('id,code')

      // cost/kg per formula
      const costByFormula: Record<string, number> = {}
      const ingByFormula: Record<string, any[]> = {}
      for (const r of (fIng ?? [])) {
        (ingByFormula[r.formula_id] ??= []).push(r)
      }
      for (const f of (formulas ?? [])) {
        const ings = ingByFormula[f.id] ?? []
        let cost = 0
        for (const ing of ings) {
          const pct = Number(ing.percentage) || 0
          const rate = rateByIng[String(ing.ingredient_name ?? '').trim().toLowerCase()] || 0
          cost += (pct / 100) * rate
        }
        costByFormula[f.id] = cost
      }

      // feed type cost = average of mapped formulas' costs (ignore 0-cost formulas)
      const acc: Record<string, { sum: number; n: number }> = {}
      for (const f of (formulas ?? [])) {
        if (!f.feed_type_id) continue
        const c = costByFormula[f.id] || 0
        if (c <= 0) continue
        const a = (acc[f.feed_type_id] ??= { sum: 0, n: 0 })
        a.sum += c; a.n += 1
      }
      const byTypeId: Record<string, number> = {}
      for (const [tid, a] of Object.entries(acc)) byTypeId[tid] = a.n ? a.sum / a.n : 0

      const byCode: Record<string, number> = {}
      for (const ft of (feedTypes ?? [])) {
        if (ft.code && byTypeId[ft.id] != null) byCode[String(ft.code).trim().toLowerCase()] = byTypeId[ft.id]
      }

      return {
        byTypeId, byCode,
        rate: (code?: string | null) => code ? (byCode[String(code).trim().toLowerCase()] ?? 0) : 0,
      }
    }
  })

  return data ?? { byTypeId: {}, byCode: {}, rate: () => 0 }
}
