import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Effective rate for a medicine/vaccine item — sourced from stock_ledger's
// most recent INWARD unit_price. stock_ledger already carries unit_price
// for every inward txn_type (grn_in, opening, adjustment_in), so this
// covers items priced via a GRN receipt AND items priced only via an
// Inventory opening-stock or adjustment entry — previously the Flock
// Detail "Medicine" tab only ever looked at GRN, showing "not in GRN" for
// anything priced the other way (e.g. Aquamax/Solucal), while the
// Medicine & Vaccine list page didn't look anything up at all and just
// showed whatever (usually nothing) was typed into the entry form's rate
// box. Both now resolve rate identically through this one source.
const OUT_TYPES = new Set(['production_out', 'medicine_out', 'adjustment_out', 'transfer_out', 'dispatch_out'])
const norm = (s?: string | null) => (s ?? '').trim().toLowerCase()

export function useMedicineRates() {
  const { data } = useQuery({
    queryKey: ['medicine_rates_stock_ledger'],
    queryFn: async () => {
      let all: any[] = [], from = 0
      while (true) {
        const { data } = await supabase.from('stock_ledger')
          .select('item_id,item_name,txn_type,unit_price,txn_date')
          .order('txn_date', { ascending: true }).range(from, from + 999)
        if (!data || !data.length) break
        all = all.concat(data); if (data.length < 1000) break; from += 1000
      }
      return all
    },
    staleTime: 60 * 1000,
  })

  const byId: Record<string, { rate: number; date: string }> = {}
  const byName: Record<string, { rate: number; date: string }> = {}
  for (const r of data ?? []) {
    if (OUT_TYPES.has(r.txn_type) || r.unit_price == null) continue
    const date = r.txn_date ?? ''
    if (r.item_id && date >= (byId[r.item_id]?.date ?? '')) byId[r.item_id] = { rate: Number(r.unit_price), date }
    const nm = norm(r.item_name)
    if (nm && date >= (byName[nm]?.date ?? '')) byName[nm] = { rate: Number(r.unit_price), date }
  }

  return (itemId?: string | null, name?: string | null): number | null => {
    if (itemId && byId[itemId]) return byId[itemId].rate
    const nm = norm(name)
    if (nm && byName[nm]) return byName[nm].rate
    if (nm) {
      const found = Object.keys(byName).find(k => k.includes(nm) || nm.includes(k))
      if (found) return byName[found].rate
    }
    return null
  }
}
