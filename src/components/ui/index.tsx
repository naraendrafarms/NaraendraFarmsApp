import React from 'react'
import { Loader2, X, ChevronDown, Printer } from 'lucide-react'

// ── BUTTON ──────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
type BtnSize    = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
  loading?: boolean
  icon?: React.ReactNode
}

const btnStyles: Record<BtnVariant, string> = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  danger:    'bg-red-600 text-white hover:bg-red-700',
  ghost:     'text-gray-600 hover:bg-gray-100',
  outline:   'border border-gray-300 text-gray-700 hover:bg-gray-50',
}
const btnSizes: Record<BtnSize, string> = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading, icon, children,
  className = '', disabled, ...rest
}) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center rounded-lg font-medium
      transition-colors focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-brand-500 focus-visible:ring-offset-1
      disabled:opacity-50 disabled:cursor-not-allowed
      ${btnStyles[variant]} ${btnSizes[size]} ${className}`}
  >
    {loading ? <Loader2 className="animate-spin" size={14} /> : icon}
    {children}
  </button>
)

// ── DATE INPUT (DD/MM/YYYY display, YYYY-MM-DD storage) ─────────
// Native <input type="date"> shows in browser/OS locale (MM/DD/YYYY on US Android).
// This component uses a text input with DD/MM/YYYY mask that works everywhere.
interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  value?: string   // YYYY-MM-DD
  onChange?: (e: any) => void
}

function isoToDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

function displayToISO(disp: string): string {
  const m = disp.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return ''
  return `${m[3]}-${m[2]}-${m[1]}`
}

export const DateInput: React.FC<DateInputProps> = ({
  label, error, hint, required, value = '', onChange, className = '', id, ...rest
}) => {
  const [disp, setDisp] = React.useState(() => isoToDisplay(value))
  React.useEffect(() => { setDisp(isoToDisplay(value)) }, [value])
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '_')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d]/g, '').slice(0, 8)
    let formatted = raw
    if (raw.length > 4) formatted = raw.slice(0,2) + '/' + raw.slice(2,4) + '/' + raw.slice(4)
    else if (raw.length > 2) formatted = raw.slice(0,2) + '/' + raw.slice(2)
    setDisp(formatted)
    const iso = displayToISO(formatted)
    if (iso) onChange?.({ target: { value: iso } })
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        value={disp}
        onChange={handleChange}
        {...rest}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900
          placeholder-gray-400 shadow-sm transition-colors
          border-gray-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}`}
      />
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}


interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}
export const Input: React.FC<InputProps> = ({
  label, error, hint, required, className = '', id, ...rest
}) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '_')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        {...rest}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900
          placeholder-gray-400 shadow-sm transition-colors
          border-gray-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}`}
      />
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ── SELECT ───────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  options: Array<{ value: string; label: string } | string>
  placeholder?: string
}
export const Select: React.FC<SelectProps> = ({
  label, error, hint, required, options, placeholder,
  className = '', id, ...rest
}) => {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '_')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          {...rest}
          className={`w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm text-gray-900
            shadow-sm transition-colors bg-white
            border-gray-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${error ? 'border-red-400' : ''} ${className}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => {
            const v = typeof o === 'string' ? o : o.value
            const l = typeof o === 'string' ? o : o.label
            return <option key={v} value={v}>{l}</option>
          })}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ── SEARCHABLE SELECT ────────────────────────────────────────
interface SearchableSelectProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  placeholder?: string
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label, error, hint, required, placeholder = 'Select…', options,
  value, onChange, disabled, className = '',
}) => {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const ref = React.useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)
  const filtered = query.trim() === ''
    ? options
    : options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pick = (v: string) => { onChange(v); setOpen(false); setQuery('') }

  return (
    <div className={`flex flex-col gap-1 ${className}`} ref={ref}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) setOpen(v => !v) }}
          className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm shadow-sm bg-white text-left
            border-gray-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${error ? 'border-red-400' : ''}`}
        >
          <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown size={14} className="text-gray-400 shrink-0 ml-2" />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <ul className="max-h-52 overflow-y-auto py-1">
              {placeholder && (
                <li
                  className="px-3 py-2 text-sm text-gray-400 cursor-pointer hover:bg-gray-50"
                  onClick={() => pick('')}
                >
                  {placeholder}
                </li>
              )}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-400">No results</li>
              )}
              {filtered.map(o => (
                <li
                  key={o.value}
                  onClick={() => pick(o.value)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-brand-50
                    ${o.value === value ? 'bg-brand-50 font-medium text-brand-700' : 'text-gray-800'}`}
                >
                  {o.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ── TEXTAREA ─────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  required?: boolean
}
export const Textarea: React.FC<TextareaProps> = ({ label, error, required, className='', id, ...rest }) => {
  const tid = id ?? label?.toLowerCase().replace(/\s+/g,'_')
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={tid} className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>}
      <textarea id={tid} {...rest} rows={3}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm
          border-gray-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500
          ${error?'border-red-400':''} ${className}`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ── CARD ─────────────────────────────────────────────────────
export const Card: React.FC<{ children: React.ReactNode; className?: string; padding?: boolean }> = ({
  children, className = '', padding = true
}) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${padding ? 'p-5' : ''} ${className}`}>
    {children}
  </div>
)

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({
  title, subtitle, action
}) => (
  <div className="flex items-start justify-between mb-4">
    <div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
)

// ── BADGE ─────────────────────────────────────────────────────
type BadgeColor = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'orange'
const badgeColors: Record<BadgeColor, string> = {
  green:  'bg-green-50 text-green-700 ring-green-600/20',
  yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  red:    'bg-red-50 text-red-700 ring-red-600/20',
  blue:   'bg-blue-50 text-blue-700 ring-blue-600/20',
  gray:   'bg-gray-50 text-gray-600 ring-gray-500/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
}
export const Badge: React.FC<{ children: React.ReactNode; color?: BadgeColor }> = ({
  children, color = 'gray'
}) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeColors[color]}`}>
    {children}
  </span>
)

// ── MODAL ─────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  footer?: React.ReactNode
}
const modalSizes = { sm:'max-w-sm', md:'max-w-md', lg:'max-w-lg', xl:'max-w-xl', '2xl':'max-w-2xl' }

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size='md', footer }) => {
  const bodyRef = React.useRef<HTMLDivElement>(null)
  if (!open) return null

  // Print ONLY this modal's content, in an isolated hidden iframe — printing
  // the live page directly (window.print()) bled the page behind the modal
  // into the output once the modal's own fixed positioning was relaxed for
  // print. This never touches the main document, so nothing else can leak in.
  const printModal = () => {
    const content = bodyRef.current
    if (!content) return
    const iframe = document.createElement('iframe')
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' })
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument
    if (!doc) { document.body.removeChild(iframe); return }
    const styles = Array.from(document.styleSheets).map(ss => {
      try { return `<style>${Array.from(ss.cssRules).map(r => r.cssText).join('\n')}</style>` }
      catch { return ss.href ? `<link rel="stylesheet" href="${ss.href}">` : '' }
    }).join('\n')
    doc.open()
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">${styles}<style>
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body { padding: 16px; font-family: inherit; }
      h1 { font-size: 15px; font-weight: 600; margin: 0 0 12px; }
    </style></head><body><h1>${title ?? ''}</h1>${content.innerHTML}</body></html>`)
    doc.close()
    iframe.onload = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${modalSizes[size]} max-h-[90vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-1">
            <button onClick={printModal} title="Print / Save as PDF" className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <Printer size={16} className="text-gray-400" />
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">{footer}</div>
        )}
      </div>
    </div>
  )
}

// ── STAT CARD ─────────────────────────────────────────────────
export const StatCard: React.FC<{
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: string
  trend?: { value: number; label: string }
}> = ({ title, value, subtitle, icon, color = 'text-brand-600', trend }) => (
  <Card>
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {icon && <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>{icon}</div>}
    </div>
    <div className="mt-2">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      {trend && (
        <p className={`text-xs mt-1 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}% {trend.label}
        </p>
      )}
    </div>
  </Card>
)

// ── TABLE ─────────────────────────────────────────────────────
// Header row freezes to the top of the viewport on scroll (like Excel freeze
// panes) on every page using this shared Table/Th — this is deliberately the
// one central place that controls it, instead of each page reimplementing
// sticky headers itself. overflow-y is explicitly kept "visible" so the
// sticky positioning context is the page viewport, not this wrapper div
// (setting only overflow-x-auto would otherwise silently make browsers
// promote overflow-y to "auto" too, trapping sticky inside an unscrolled div
// where it never appears to float — the classic sticky-in-table footgun).
export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className='' }) => (
  <div className={`overflow-x-auto overflow-y-visible rounded-xl border border-gray-100 ${className}`}>
    <table className="w-full text-sm">{children}</table>
  </div>
)
export const Th: React.FC<{ children?: React.ReactNode; className?: string; right?: boolean; colSpan?: number }> = ({ children, className='', right, colSpan }) => (
  <th colSpan={colSpan} className={`sticky top-0 z-10 px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-50
    border-b border-gray-100 ${right?'text-right':'text-left'} ${className}`}>
    {children}
  </th>
)
export const Td: React.FC<{ children?: React.ReactNode; className?: string; right?: boolean; colSpan?: number }> = ({ children, className='', right, colSpan }) => (
  <td colSpan={colSpan} className={`px-3 py-2.5 text-gray-700 border-b border-gray-50 ${right?'text-right':'text-left'} ${className}`}>
    {children}
  </td>
)

// ── EMPTY STATE ────────────────────────────────────────────────
export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode }> = ({
  icon, title, subtitle, action
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="p-4 bg-gray-50 rounded-full mb-4 text-gray-400">{icon}</div>}
    <h3 className="font-medium text-gray-900">{title}</h3>
    {subtitle && <p className="text-sm text-gray-500 mt-1 max-w-xs">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

// ── LOADING SPINNER ────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <div className="flex justify-center items-center py-8">
    <Loader2 size={size} className="animate-spin text-brand-500" />
  </div>
)

// ── SECTION HEADER ─────────────────────────────────────────────
export const SectionHeader: React.FC<{
  title: string; subtitle?: string; action?: React.ReactNode
}> = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
)

// ── FORM ROW (2-column grid) ────────────────────────────────────
export const FormRow: React.FC<{ children: React.ReactNode; cols?: 2|3|4 }> = ({ children, cols=2 }) => (
  <div className={`grid gap-4 ${cols===2?'grid-cols-1 sm:grid-cols-2':cols===3?'grid-cols-1 sm:grid-cols-3':'grid-cols-2 sm:grid-cols-4'}`}>
    {children}
  </div>
)

// ── DIVIDER ────────────────────────────────────────────────────
export const Divider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="relative my-4">
    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
    {label && <div className="relative flex justify-start"><span className="pr-3 text-xs text-gray-400 bg-white">{label}</span></div>}
  </div>
)
