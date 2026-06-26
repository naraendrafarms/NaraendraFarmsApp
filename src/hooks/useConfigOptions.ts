import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ConfigOption {
  value: string
  label: string
}

/** Fetches a dropdown list from config_options by group. Falls back to provided defaults if DB is empty. */
export function useConfigOptions(grp: string, fallback: ConfigOption[] = []): ConfigOption[] {
  const { data } = useQuery({
    queryKey: ['config_options', grp],
    queryFn: async () => {
      const { data } = await supabase
        .from('config_options')
        .select('value, label, sort_order')
        .eq('grp', grp)
        .order('sort_order')
        .order('value')
      return (data ?? []).map((r: any) => ({
        value: r.value as string,
        label: (r.label ?? r.value) as string,
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
  return data?.length ? data : fallback
}

/** Simple string-only variant — returns just the values array. */
export function useConfigValues(grp: string, fallback: string[] = []): string[] {
  const opts = useConfigOptions(grp, fallback.map(v => ({ value: v, label: v })))
  return opts.map(o => o.value)
}
