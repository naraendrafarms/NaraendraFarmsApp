import { useAuth } from '@/lib/auth'

/**
 * Returns a Supabase query filter for farm-scoped queries.
 * Site incharges only see their assigned farm's data.
 * All other roles see everything.
 */
export function useFarmScope() {
  const { profile } = useAuth()
  const isSiteIncharge = profile?.role === 'site_incharge'
  const farmId = profile?.farm_id ?? null

  /**
   * Apply to a supabase query on a column that holds farm_id.
   * Usage: let q = supabase.from('flocks').select('*')
   *        q = applyFarmFilter(q, 'laying_farm_id')
   */
  function applyFarmFilter(query: any, column = 'farm_id') {
    if (isSiteIncharge && farmId) {
      return query.eq(column, farmId)
    }
    return query
  }

  /**
   * Apply OR filter for flocks which have both laying_farm_id and rearing_farm_id.
   * Supabase supports .or() for this.
   */
  function applyFlockFarmFilter(query: any) {
    if (isSiteIncharge && farmId) {
      return query.or(`laying_farm_id.eq.${farmId},rearing_farm_id.eq.${farmId}`)
    }
    return query
  }

  return { isSiteIncharge, farmId, applyFarmFilter, applyFlockFarmFilter }
}
