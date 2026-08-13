import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Faint NF monogram behind the app's pages, on screen only.
//
// Deliberate choices, all of them about not getting in the way of the numbers:
//
//  * It sits BEHIND the cards, which keep their solid white backgrounds — so it
//    shows in the space around and between them and never behind a figure you
//    are reading or a box you are typing into. Making the cards translucent
//    would show more of the mark and make Bulk Daily Entry's grid harder to
//    read, which is the opposite of the point.
//  * Fixed, not scrolling: on a long page a scrolling mark drifts off and is
//    never seen again. Fixed makes it part of the backdrop.
//  * pointer-events:none so it can never swallow a click or a tap.
//  * print:hidden — printed output has its own letterhead; a screen watermark
//    on an invoice would be wrong.
//  * aria-hidden: it is decoration, and a screen reader announcing "NF" on
//    every page would be noise.
export const Watermark: React.FC<{ size?: number; opacity?: number }> = ({
  size = 380, opacity = 0.035,
}) => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden print:hidden"
    style={{ opacity }}
  >
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="10" fill="#14532d" />
      <text x="32" y="43" fontFamily="Georgia, 'Iowan Old Style', serif" fontWeight={700}
        fontSize={30} letterSpacing={-1} textAnchor="middle">
        <tspan fill="#f7f1e4">N</tspan><tspan fill="#d6ab5f">F</tspan>
      </text>
    </svg>
  </div>
)

// Whether the watermark is switched on, from Company Profile. Defaults to ON
// while the setting loads or if the row is missing, so a slow query does not
// make the mark flicker in and out on every navigation.
export function useWatermarkEnabled(): boolean {
  const { data } = useQuery({
    queryKey: ['company_show_watermark'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from('company_settings')
        .select('show_watermark').limit(1).maybeSingle()
      if (error) return null
      return data
    },
  })
  return data?.show_watermark !== false
}
