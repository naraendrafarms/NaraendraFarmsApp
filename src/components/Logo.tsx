import React from 'react'

// Naraendra Farms brand mark — the "NF" monogram chip, always the same
// green (#14532d) + gold (#d6ab5f) + paper (#f7f1e4), used identically
// everywhere (sidebar, login, favicon, letterhead) rather than a different
// treatment per surface.
export const LogoChip: React.FC<{ size?: number; radius?: number }> = ({ size = 40, radius = 6 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx={radius} fill="#14532d" />
    <text x="32" y="43" fontFamily="Georgia, 'Iowan Old Style', serif" fontWeight={700} fontSize={30}
      letterSpacing={-1} textAnchor="middle">
      <tspan fill="#f7f1e4">N</tspan><tspan fill="#d6ab5f">F</tspan>
    </text>
  </svg>
)

// Full lockup: chip + "Naraendra Farms" wordmark. `dark` = true renders the
// wordmark in paper/cream for use on dark green backgrounds (sidebar, login);
// `dark` = false renders it in brand green for light backgrounds (letterhead).
export const LogoLockup: React.FC<{ chipSize?: number; dark?: boolean; subtitle?: string }> = ({
  chipSize = 40, dark = true, subtitle,
}) => {
  const nameColor = dark ? '#f7f1e4' : '#14532d'
  const subColor = dark ? '#d6ab5f' : '#3a6b4c'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <LogoChip size={chipSize} />
      <div style={{ lineHeight: 1.15 }}>
        <div style={{ fontWeight: 800, fontSize: chipSize * 0.44, color: nameColor }}>
          Nara<span style={{ color: '#d6ab5f' }}>e</span>ndra Farms
        </div>
        {subtitle && (
          <div style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: chipSize * 0.22,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: subColor,
          }}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}
