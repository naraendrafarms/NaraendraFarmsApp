import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Which farms are VHL. There is NO is_vhl flag on farms or sheds - checked:
// is_vhl_contract lives only on flocks (migration 358 set Bodjanampet-2 as the
// VHL flock's laying and rearing farm). So a VHL site is derived: any farm that
// is the laying or rearing farm of a VHL flock. This is the same derivation VHL
// Bulk Daily Entry already uses to find its sheds, so the two cannot disagree.
//
// Closed flocks are INCLUDED. A site does not stop being VHL because its flock
// closed, and excluding them would hide a closed VHL flock's line history -
// exactly the fault the VHL Dashboard had before the "Show closed" toggle.
export function useVhlFarmIds() {
  const { data, isLoading } = useQuery({
    queryKey: ['vhl_farm_ids'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('laying_farm_id,rearing_farm_id').eq('is_vhl_contract', true)
      const ids = new Set<string>()
      for (const f of (data ?? []) as any[]) {
        if (f.laying_farm_id) ids.add(f.laying_farm_id)
        if (f.rearing_farm_id) ids.add(f.rearing_farm_id)
      }
      return Array.from(ids)
    },
  })
  return { vhlFarmIds: data ?? [], vhlFarmIdsLoading: isLoading }
}

// Keep a shed when we are on a VHL screen and it sits at a VHL farm, or when we
// are on an ordinary screen and it does not. While the id list is still loading
// nothing is filtered out on ordinary screens and nothing is let in on VHL
// ones, so a half-loaded page never shows the wrong site's sheds.
export function makeShedSiteFilter(vhl: boolean, vhlFarmIds: string[], loading: boolean) {
  const set = new Set(vhlFarmIds)
  return (farmId: string | null | undefined) => {
    if (loading) return !vhl
    return vhl ? set.has(farmId ?? '') : !set.has(farmId ?? '')
  }
}
