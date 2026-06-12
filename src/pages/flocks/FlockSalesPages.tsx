import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { useFarmScope } from '@/lib/useFarmScope'
import {
  Card, CardHeader, Button, Input, Select, FormRow, Modal, Divider,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState, StatCard
} from '@/components/ui'
import { Plus, Package, Edit2, Egg, Trash2, Upload, Download, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { parseFile } from '@/lib/parseFile'

// ── CSV helper ────────────────────────────────────────────────────
function exportFlatCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

// ── Bulk selection helpers ────────────────────────────────────────
const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

const BulkBar: React.FC<{ count: number; onDelete: () => void; onClear: () => void; loading?: boolean }> = ({ count, onDelete, onClear, loading }) => count === 0 ? null : (
  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
    <span className="text-sm font-medium text-red-700">{count} selected</span>
    <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
    <div className="ml-auto">
      <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} loading={loading} onClick={onDelete}>Delete {count} rows</Button>
    </div>
  </div>
)

const ConfirmBulkDelete: React.FC<{ label: string; onConfirm: () => void; onCancel: () => void }> = ({ label, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl shadow-xl p-6 w-80">
      <p className="font-semibold text-gray-900 mb-1">Delete records?</p>
      <p className="text-sm text-gray-500 mb-5">{label}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" size="sm" onClick={onConfirm}>Delete</Button>
      </div>
    </div>
  </div>
)

// ── HE DISPATCH ──────────────────────────────────────────────────
export const HEDispatch: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [flockFilter, setFlockFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [importing, setImporting] = useState(false)
  const [noInvoiceOnly, setNoInvoiceOnly] = useState(false)
  const [tab, setTab] = useState<'dispatch'|'stock'>('dispatch')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,status,laying_farm_id,rearing_farm_id').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q
      return data ?? []
    }
  })

  const { data: parties } = useQuery({
    queryKey: ['parties_buyers'],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id,name')
        .in('type', ['buyer','both']).order('name')
      return data ?? []
    }
  })

  const { data: hatcheries } = useQuery({
    queryKey: ['hatcheries'],
    queryFn: async () => {
      const { data } = await supabase.from('hatcheries').select('id,name').order('name')
      return data ?? []
    }
  })

  const hasFilter = !!(flockFilter || fromDate || toDate)

  const { data: dispatches, isLoading } = useQuery({
    queryKey: ['he_dispatch', flockFilter, fromDate, toDate],
    queryFn: async () => {
      let q = supabase.from('he_dispatch')
        .select('*, flocks(flock_no), parties(name), hatcheries(name)')
        .order('dispatch_date', { ascending: false })
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      if (fromDate) q = q.gte('dispatch_date', fromDate)
      if (toDate) q = q.lte('dispatch_date', toDate)
      if (!hasFilter) q = q.limit(200)
      const { data } = await q; return data ?? []
    }
  })

  // Dispatch lines: one row per production date with grade split
  type DispLine = { prod_date: string; grade_a: string; grade_b: string; grade_c: string; rate: string }
  const emptyLine = (): DispLine => ({ prod_date: today(), grade_a: '', grade_b: '', grade_c: '', rate: '' })
  const [lines, setLines] = useState<DispLine[]>([emptyLine()])
  const setLine = (i: number, k: keyof DispLine, v: string) =>
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l))
  const addLine = () => setLines(ls => [...ls, emptyLine()])
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i))

  const [form, setForm] = useState({
    flock_id: '', dispatch_date: today(),
    dc_no: '', invoice_no: '', party_id: '', hatchery_id: '',
    free_eggs: '0', rate: '', amount: '', remarks: ''
  })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Totals from lines
  const lineTotal = (f: keyof DispLine) => lines.reduce((sum, l) => sum + (parseInt((l as any)[f]) || 0), 0)
  const totalFromLines = lineTotal('grade_a') + lineTotal('grade_b') + lineTotal('grade_c')
  const invoiceEggs = totalFromLines - (parseInt(form.free_eggs)||0)
  const autoAmount = invoiceEggs * (parseFloat(form.rate)||0)

  const openForm = (row?: any) => {
    if (row) {
      setEditing(row)
      setForm({
        flock_id: row.flock_id, dispatch_date: row.dispatch_date,
        dc_no: row.dc_no?.toString() ?? '', invoice_no: row.invoice_no ?? '',
        party_id: row.party_id ?? '', hatchery_id: row.hatchery_id ?? '',
        free_eggs: row.free_eggs?.toString() ?? '0', rate: row.rate?.toString() ?? '',
        amount: row.amount?.toString() ?? '', remarks: row.remarks ?? ''
      })
      // Load existing lines for this dispatch
      supabase.from('he_dispatch_lines').select('*').eq('dispatch_id', row.id).order('prod_date')
        .then(({ data }) => {
          if (data && data.length > 0)
            setLines(data.map((l: any) => ({
              prod_date: l.prod_date, grade_a: l.grade_a?.toString() ?? '',
              grade_b: l.grade_b?.toString() ?? '', grade_c: l.grade_c?.toString() ?? '',
              rate: l.rate?.toString() ?? ''
            })))
          else
            setLines([{ prod_date: row.prod_date ?? today(), grade_a: row.grade_a?.toString() ?? '', grade_b: row.grade_b?.toString() ?? '', grade_c: '0', rate: row.rate?.toString() ?? '' }])
        })
    } else {
      setEditing(null)
      setForm({ flock_id: flockFilter, dispatch_date: today(), dc_no: '', invoice_no: '',
        party_id: '', hatchery_id: '', free_eggs: '0', rate: '', amount: '', remarks: '' })
      setLines([emptyLine()])
    }
    setShowForm(true)
  }

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.from('he_dispatch').delete().in('id', ids) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['he_dispatch'] }); setSel(new Set()); setBulkConfirm(false) }
  })

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.flock_id || !form.dispatch_date) throw new Error('Flock and dispatch date required')
      if (lines.length === 0 || totalFromLines === 0) throw new Error('Add at least one production line with qty')
      const gradeA = lineTotal('grade_a'), gradeB = lineTotal('grade_b'), gradeC = lineTotal('grade_c')
      // first/last prod dates from lines
      const sortedDates = lines.map(l => l.prod_date).filter(Boolean).sort()
      const prodDateFrom = sortedDates[0] || null
      const prodDateTo = sortedDates.length > 1 ? sortedDates[sortedDates.length - 1] : null
      const inv = totalFromLines - (parseInt(form.free_eggs)||0)
      const payload = {
        flock_id: form.flock_id, dispatch_date: form.dispatch_date,
        prod_date: prodDateFrom, prod_date_to: prodDateTo,
        dc_no: parseInt(form.dc_no) || null, invoice_no: form.invoice_no || null,
        party_id: form.party_id || null, hatchery_id: form.hatchery_id || null,
        grade_a: gradeA, grade_b: gradeB,
        total_dispatched: totalFromLines,
        free_eggs: parseInt(form.free_eggs) || 0,
        invoice_eggs: inv, rate: parseFloat(form.rate) || null,
        amount: parseFloat(form.amount) || autoAmount || null,
        remarks: form.remarks || null
      }
      let dispatchId: string
      if (editing) {
        const { error } = await supabase.from('he_dispatch').update(payload).eq('id', editing.id)
        if (error) throw error
        dispatchId = editing.id
        // Delete old lines and re-insert
        await supabase.from('he_dispatch_lines').delete().eq('dispatch_id', dispatchId)
      } else {
        const { data, error } = await supabase.from('he_dispatch').insert(payload).select('id').single()
        if (error) throw error
        dispatchId = data.id
      }
      // Insert lines
      const linePayload = lines
        .filter(l => l.prod_date && (parseInt(l.grade_a)||0) + (parseInt(l.grade_b)||0) + (parseInt(l.grade_c)||0) > 0)
        .map(l => ({
          dispatch_id: dispatchId,
          flock_id: form.flock_id,
          prod_date: l.prod_date,
          grade_a: parseInt(l.grade_a) || 0,
          grade_b: parseInt(l.grade_b) || 0,
          grade_c: parseInt(l.grade_c) || 0,
          rate: parseFloat(l.rate) || parseFloat(form.rate) || null
        }))
      if (linePayload.length > 0) {
        const { error } = await supabase.from('he_dispatch_lines').insert(linePayload)
        if (error) throw error
      }
    },
    onSuccess: () => { toast.success('Saved!'); qc.invalidateQueries({ queryKey: ['he_dispatch'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.message)
  })

  const filtered = (dispatches ?? []).filter((d: any) => !noInvoiceOnly || !d.invoice_no)
  const totalDisp = filtered.reduce((s: number, d: any) => s + d.total_dispatched, 0)
  const totalAmt  = filtered.reduce((s: number, d: any) => s + (d.amount ?? 0), 0)
  const totalFree = filtered.reduce((s: number, d: any) => s + (d.free_eggs ?? 0), 0)
  const noInvoiceCount = (dispatches ?? []).filter((d: any) => !d.invoice_no).length

  // Stock register: grade-split production vs dispatch lines per flock
  const { data: stockData } = useQuery({
    queryKey: ['he_stock_register', flockFilter],
    queryFn: async () => {
      let dq = supabase.from('daily_records')
        .select('record_date,flock_id,he_eggs,he_grade_a,he_grade_b,he_grade_c,be_eggs,le_eggs,wastage_eggs,flocks(flock_no)')
        .order('record_date', { ascending: false })
      let lq = supabase.from('he_dispatch_lines')
        .select('prod_date,flock_id,grade_a,grade_b,grade_c,he_dispatch(dispatch_date,invoice_no)')
        .order('prod_date', { ascending: false })
      if (flockFilter) { dq = dq.eq('flock_id', flockFilter); lq = lq.eq('flock_id', flockFilter) }
      const [{ data: prod }, { data: dispLines }] = await Promise.all([dq, lq])
      type StockRow = { date: string; flock: string; prod_a: number; prod_b: number; prod_c: number; disp_a: number; disp_b: number; disp_c: number; broken: number; leached: number; wastage: number }
      const map = new Map<string, StockRow>()
      for (const r of (prod ?? [])) {
        const key = `${r.record_date}__${r.flock_id}`
        const ex = map.get(key) ?? { date: r.record_date, flock: `F-${(r.flocks as any)?.flock_no}`, prod_a:0,prod_b:0,prod_c:0,disp_a:0,disp_b:0,disp_c:0,broken:0,leached:0,wastage:0 }
        ex.prod_a += r.he_grade_a ?? r.he_eggs ?? 0
        ex.prod_b += r.he_grade_b ?? 0
        ex.prod_c += r.he_grade_c ?? 0
        ex.broken += r.be_eggs ?? 0
        ex.leached += r.le_eggs ?? 0
        ex.wastage += r.wastage_eggs ?? 0
        map.set(key, ex)
      }
      for (const l of (dispLines ?? [])) {
        const key = `${l.prod_date}__${l.flock_id}`
        const ex = map.get(key) ?? { date: l.prod_date, flock: `F-${l.flock_id?.slice(0,4)}`, prod_a:0,prod_b:0,prod_c:0,disp_a:0,disp_b:0,disp_c:0,broken:0,leached:0,wastage:0 }
        ex.disp_a += l.grade_a ?? 0
        ex.disp_b += l.grade_b ?? 0
        ex.disp_c += l.grade_c ?? 0
        map.set(key, ex)
      }
      const rows = [...map.values()].sort((a,b) => b.date.localeCompare(a.date))
      const asc = [...rows].reverse()
      let balA=0, balB=0, balC=0
      const withBal = asc.map(r => {
        balA += r.prod_a - r.disp_a
        balB += r.prod_b - r.disp_b
        balC += r.prod_c - r.disp_c
        return { ...r, bal_a: balA, bal_b: balB, bal_c: balC, bal_total: balA+balB+balC }
      }).reverse()
      return withBal
    }
  })

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const partyOptions = parties?.map((p: any) => ({ value: p.id, label: p.name })) ?? []
  const hatchOptions = hatcheries?.map((h: any) => ({ value: h.id, label: h.name })) ?? []

  const dispIds = (dispatches ?? []).map((d: any) => d.id)
  const allSel = dispIds.length > 0 && dispIds.every((id: string) => sel.has(id))
  const someSel = dispIds.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? dispIds.forEach((id: string) => n.delete(id)) : dispIds.forEach((id: string) => n.add(id)); return n })

  // CSV template download
  const handleDownloadTemplate = () => {
    const headers = 'flock_no,dispatch_date,prod_date,dc_no,grade_a,grade_b,total_dispatched,free_eggs,rate,amount,party_name,remarks'
    const blob = new Blob([headers + '\n'], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'he_dispatch_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import handler (CSV or Excel)
  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const { headers: hdrs, rows: rawRows } = await parseFile(file)
      if (rawRows.length === 0) { toast.error('Empty file'); return }
      const records = rawRows.map(vals => { const obj: any = {}; hdrs.forEach((h,i) => { obj[h] = vals[i]??'' }); return obj })

      const rows = records.map((r: any) => {
        const flockMatch = flocks?.find((f: any) => String(f.flock_no) === String(r.flock_no))
        const partyMatch = parties?.find((p: any) => p.name === r.party_name)
        const totalDispatched = parseInt(r.total_dispatched) || 0
        const freeEggs = parseInt(r.free_eggs) || 0
        return {
          flock_id: flockMatch?.id ?? null,
          dispatch_date: r.dispatch_date || null,
          prod_date: r.prod_date || null,
          dc_no: parseInt(r.dc_no) || null,
          grade_a: parseInt(r.grade_a) || 0,
          grade_b: parseInt(r.grade_b) || 0,
          total_dispatched: totalDispatched,
          free_eggs: freeEggs,
          invoice_eggs: totalDispatched - freeEggs,
          rate: parseFloat(r.rate) || null,
          amount: parseFloat(r.amount) || null,
          party_id: partyMatch?.id ?? null,
          remarks: r.remarks || null,
        }
      }).filter((r: any) => r.flock_id && r.dispatch_date)

      if (rows.length === 0) {
        toast.error('No valid rows found. Check flock_no values match existing flocks.')
        return
      }

      const { error } = await supabase.from('he_dispatch').insert(rows)
      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          toast.error('Some records already exist (duplicate dispatch dates). Please check your data.')
        } else {
          throw error
        }
        return
      }
      toast.success(`Imported ${rows.length} dispatch records!`)
      qc.invalidateQueries({ queryKey: ['he_dispatch'] })
    } catch (e: any) {
      toast.error('Import failed: ' + e.message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // prod date display helper
  const prodDateLabel = (d: any) => {
    if (!d.prod_date) return '—'
    if (d.prod_date_to && d.prod_date_to !== d.prod_date)
      return `${fmtDate(d.prod_date)} – ${fmtDate(d.prod_date_to)}`
    return fmtDate(d.prod_date)
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="HE Dispatch & Sales"
        subtitle="Hatching egg dispatches to hatcheries"
        action={<Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Dispatch</Button>}
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['dispatch','stock'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===t?'border-brand-600 text-brand-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'dispatch' ? 'Dispatches' : 'Daily Stock Register'}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex gap-3 flex-wrap items-end">
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
        {tab === 'dispatch' && <>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          From
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm" />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          To
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={noInvoiceOnly} onChange={e => setNoInvoiceOnly(e.target.checked)}
            className="rounded border-gray-300 text-orange-500"/>
          <span className="text-orange-600 font-medium">
            No Invoice only {noInvoiceCount > 0 && <span className="bg-orange-100 text-orange-700 text-xs px-1.5 rounded-full">{noInvoiceCount}</span>}
          </span>
        </label>
        </>}
        {hasFilter && <Button variant="ghost" size="sm" onClick={() => { setFlockFilter(''); setFromDate(''); setToDate(''); setNoInvoiceOnly(false) }}>Clear</Button>}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleDownloadTemplate}>
            Download Template
          </Button>
          <Button variant="outline" size="sm" icon={<Upload size={14}/>}
            loading={importing}
            onClick={() => fileInputRef.current?.click()}>
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
            }}
          />
        </div>
      </div>

      {/* Summary */}
      {dispatches && dispatches.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Dispatched" value={totalDisp.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-brand-600" />
          <StatCard title="Free Eggs" value={totalFree.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-yellow-600" />
          <StatCard title="Total Revenue" value={inr(totalAmt)} icon={<Package size={18}/>} color="text-green-600" />
        </div>
      )}

      <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />

      {tab === 'dispatch' && (isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
              <Th>Flock</Th><Th>Dispatch Date</Th><Th>Prod Date</Th>
              <Th right>DC No</Th><Th>Invoice No</Th><Th>Party</Th><Th>Hatchery</Th>
              <Th right>Dispatched</Th><Th right>Free</Th><Th right>Invoice Qty</Th>
              <Th right>Rate</Th><Th right>Amount</Th><Th></Th>
            </tr></thead>
            <tbody>
              {filtered.map((d: any) => (
                <tr key={d.id} className={`hover:bg-gray-50 ${sel.has(d.id) ? 'bg-red-50' : !d.invoice_no ? 'bg-orange-50' : ''}`}>
                  <Td><CB checked={sel.has(d.id)} onChange={() => toggle(d.id)}/></Td>
                  <Td><Badge color="green">F-{d.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(d.dispatch_date)}</Td>
                  <Td className="text-xs text-gray-500">{prodDateLabel(d)}</Td>
                  <Td right className="text-xs">{d.dc_no ?? '—'}</Td>
                  <Td className="text-xs">
                    {d.invoice_no
                      ? <span className="font-medium text-blue-700">{d.invoice_no}</span>
                      : <span className="flex items-center gap-1 text-orange-500"><AlertCircle size={11}/>Pending</span>}
                  </Td>
                  <Td className="text-xs max-w-[120px] truncate">{d.parties?.name ?? '—'}</Td>
                  <Td className="text-xs text-gray-400 max-w-[100px] truncate">{d.hatcheries?.name ?? '—'}</Td>
                  <Td right className="font-medium">{d.total_dispatched?.toLocaleString('en-IN')}</Td>
                  <Td right className="text-xs text-orange-500">{d.free_eggs > 0 ? d.free_eggs : '—'}</Td>
                  <Td right className="text-xs">{d.invoice_eggs?.toLocaleString('en-IN') ?? '—'}</Td>
                  <Td right className="text-xs">{d.rate ? `Rs ${d.rate}` : '—'}</Td>
                  <Td right className="font-semibold text-green-700 text-xs">{d.amount ? inr(d.amount) : '—'}</Td>
                  <Td>
                    <button onClick={() => openForm(d)}
                      className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600">
                      <Edit2 size={13}/>
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot><tr className="bg-gray-50">
                <Td colSpan={8}><strong>TOTAL ({filtered.length} records)</strong></Td>
                <Td right><strong>{totalDisp.toLocaleString('en-IN')}</strong></Td>
                <Td right><strong>{totalFree.toLocaleString('en-IN')}</strong></Td>
                <Td right><strong>{(totalDisp - totalFree).toLocaleString('en-IN')}</strong></Td>
                <Td right>—</Td>
                <Td right><strong className="text-green-700">{inr(totalAmt)}</strong></Td>
                <Td> </Td>
              </tr></tfoot>
            )}
          </Table>
          {filtered.length === 0 && (
            <EmptyState icon={<Egg size={32}/>} title={noInvoiceOnly ? 'All dispatches have invoice numbers' : 'No dispatches yet'}
              action={!noInvoiceOnly ? <Button onClick={() => openForm()} icon={<Plus size={16}/>}>Add Dispatch</Button> : undefined}
            />
          )}
        </Card>
      ))}

      {/* Daily Stock Register tab */}
      {tab === 'stock' && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b border-gray-100 bg-blue-50 text-sm text-blue-700">
            Stock = production (daily records by grade) minus dispatch lines. Broken/Leached/Wastage shown but not deducted from dispatch stock.
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th><Th>Flock</Th>
                <Th right className="text-green-700">Prod A</Th>
                <Th right className="text-blue-700">Prod B</Th>
                <Th right className="text-orange-700">Prod C</Th>
                <Th right className="text-red-500">Disp A</Th>
                <Th right className="text-red-500">Disp B</Th>
                <Th right className="text-red-500">Disp C</Th>
                <Th right>Broken</Th><Th right>Leached</Th>
                <Th right className="text-green-700">Bal A</Th>
                <Th right className="text-blue-700">Bal B</Th>
                <Th right className="text-orange-700">Bal C</Th>
                <Th right className="text-gray-800">Total Stock</Th>
              </tr>
            </thead>
            <tbody>
              {(stockData ?? []).map((r: any, i: number) => (
                <tr key={i} className={`hover:bg-gray-50 text-xs ${r.bal_total < 0 ? 'bg-red-50' : ''}`}>
                  <Td className="text-xs">{fmtDate(r.date)}</Td>
                  <Td><Badge color="green">{r.flock}</Badge></Td>
                  <Td right className="text-green-700">{r.prod_a > 0 ? r.prod_a.toLocaleString('en-IN') : '—'}</Td>
                  <Td right className="text-blue-700">{r.prod_b > 0 ? r.prod_b.toLocaleString('en-IN') : '—'}</Td>
                  <Td right className="text-orange-700">{r.prod_c > 0 ? r.prod_c.toLocaleString('en-IN') : '—'}</Td>
                  <Td right className="text-red-500">{r.disp_a > 0 ? `-${r.disp_a.toLocaleString('en-IN')}` : '—'}</Td>
                  <Td right className="text-red-500">{r.disp_b > 0 ? `-${r.disp_b.toLocaleString('en-IN')}` : '—'}</Td>
                  <Td right className="text-red-500">{r.disp_c > 0 ? `-${r.disp_c.toLocaleString('en-IN')}` : '—'}</Td>
                  <Td right className="text-gray-500">{r.broken > 0 ? r.broken.toLocaleString('en-IN') : '—'}</Td>
                  <Td right className="text-gray-500">{r.leached > 0 ? r.leached.toLocaleString('en-IN') : '—'}</Td>
                  <Td right className={`font-medium ${r.bal_a < 0 ? 'text-red-600' : 'text-green-700'}`}>{r.bal_a.toLocaleString('en-IN')}</Td>
                  <Td right className={`font-medium ${r.bal_b < 0 ? 'text-red-600' : 'text-blue-700'}`}>{r.bal_b.toLocaleString('en-IN')}</Td>
                  <Td right className={`font-medium ${r.bal_c < 0 ? 'text-red-600' : 'text-orange-700'}`}>{r.bal_c.toLocaleString('en-IN')}</Td>
                  <Td right className={`font-semibold text-sm ${r.bal_total < 0 ? 'text-red-700' : 'text-gray-900'}`}>{r.bal_total.toLocaleString('en-IN')}</Td>
                </tr>
              ))}
              {(stockData ?? []).length === 0 && (
                <tr><Td colSpan={14} className="text-center text-gray-400 py-8">No data — add daily records with grade breakdown and dispatches first</Td></tr>
              )}
            </tbody>
          </Table>
        </Card>
      )}

      {bulkConfirm && (
        <ConfirmBulkDelete label={`Delete ${sel.size} HE dispatch records? This cannot be undone.`}
          onConfirm={() => bulkDelMut.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editing ? 'Edit HE Dispatch' : 'New HE Dispatch'} size="xl"
        footer={
          <><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>{editing ? 'Update' : 'Save'}</Button></>
        }>
        <div className="space-y-4">
          {/* Header */}
          <FormRow>
            <Select label="Flock *" required placeholder="— Select —" options={flockOptions}
              value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
            <Input label="Dispatch Date *" required type="date" value={form.dispatch_date}
              onChange={e => s('dispatch_date', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="DC No" type="number" value={form.dc_no} onChange={e => s('dc_no', e.target.value)} />
            <Input label="Invoice No" placeholder="e.g. INV-2026-001" value={form.invoice_no}
              onChange={e => s('invoice_no', e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Party" placeholder="— Select —" options={partyOptions}
              value={form.party_id} onChange={e => s('party_id', e.target.value)} />
            <Select label="Hatchery" placeholder="— Select —" options={hatchOptions}
              value={form.hatchery_id} onChange={e => s('hatchery_id', e.target.value)} />
          </FormRow>

          {/* Production Lines */}
          <Divider label="Production Date Lines (one row per production date)" />
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Prod Date</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-green-700">Grade A</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-blue-700">Grade B</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-orange-700">Grade C</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Rate/egg</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const rowTotal = (parseInt(l.grade_a)||0)+(parseInt(l.grade_b)||0)+(parseInt(l.grade_c)||0)
                  return (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1.5">
                        <input type="date" value={l.prod_date} onChange={e => setLine(i,'prod_date',e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-36"/>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={l.grade_a} placeholder="0" onChange={e => setLine(i,'grade_a',e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-20 text-right"/>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={l.grade_b} placeholder="0" onChange={e => setLine(i,'grade_b',e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-20 text-right"/>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={l.grade_c} placeholder="0" onChange={e => setLine(i,'grade_c',e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-20 text-right"/>
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium text-xs text-gray-700">{rowTotal > 0 ? rowTotal.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={l.rate} placeholder={form.rate||'0'} onChange={e => setLine(i,'rate',e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-24 text-right"/>
                      </td>
                      <td className="px-2 py-1.5">
                        {lines.length > 1 && (
                          <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {/* Totals row */}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-xs">
                  <td className="px-3 py-2 text-gray-600">TOTAL ({lines.length} date{lines.length>1?'s':''})</td>
                  <td className="px-3 py-2 text-right text-green-700">{lineTotal('grade_a').toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right text-blue-700">{lineTotal('grade_b').toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right text-orange-700">{lineTotal('grade_c').toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{totalFromLines.toLocaleString('en-IN')}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
            <div className="px-3 py-2 border-t border-gray-100">
              <button onClick={addLine} className="text-xs text-brand-600 hover:text-brand-700 font-medium">+ Add production date</button>
            </div>
          </div>

          {/* Invoice summary */}
          <FormRow cols={3}>
            <Input label="Free Eggs (2%)" type="number" value={form.free_eggs}
              onChange={e => s('free_eggs', e.target.value)} />
            <Input label="Default Rate (Rs/egg)" type="number" step="0.0001" value={form.rate}
              onChange={e => s('rate', e.target.value)} hint="Used for lines without individual rate" />
            <Input label="Amount (Rs)" type="number" step="0.01" value={form.amount}
              onChange={e => s('amount', e.target.value)}
              hint={autoAmount > 0 ? `Auto: ${inr(autoAmount)}` : undefined} />
          </FormRow>
          <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700 flex gap-6 flex-wrap">
            <span>Total Dispatched: <strong>{totalFromLines.toLocaleString('en-IN')}</strong></span>
            <span>Free: <strong>{parseInt(form.free_eggs)||0}</strong></span>
            <span>Invoice Eggs: <strong>{invoiceEggs.toLocaleString('en-IN')}</strong></span>
            {autoAmount > 0 && <span>Auto Amount: <strong>{inr(autoAmount)}</strong></span>}
          </div>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

// ── NHE SALES ────────────────────────────────────────────────────
const NHE_TYPES = [
  { value: 'je',             label: 'Jumbo Eggs (JE)' },
  { value: 'te',             label: 'Table Eggs (TE)' },
  { value: 'be',             label: 'Broken/Crack Eggs (BE)' },
  { value: 'bird_cull',      label: 'Bird Sales — Cull' },
  { value: 'bird_lame',      label: 'Bird Sales — Lame' },
  { value: 'bird_weak',      label: 'Bird Sales — Weak' },
  { value: 'bird_sex_error', label: 'Bird Sales — Sex Error' },
  { value: 'gas',            label: 'Gas Cylinders (income)' },
  { value: 'manure',         label: 'Manure / Litter' },
  { value: 'gunny_bags',     label: 'Gunny / Maize / Plastic Bags' },
  { value: 'other',          label: 'Other Income' },
]
const BIRD_SALE_TYPES = ['bird_cull','bird_lame','bird_weak','bird_sex_error']

const EMPTY_NHE_FORM = {
  flock_id: '', sale_date: today(), sale_type: 'je',
  party_id: '', dc_no: '', quantity: '', unit: 'nos', rate: '', amount: '', remarks: ''
}

export const NHESales: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<any>(null)
  const [flockFilter, setFlockFilter] = useState('')
  const [typeFilter, setTypeFilter]   = useState('')
  const [fromDate, setFromDate]   = useState('')
  const [toDate, setToDate]       = useState('')
  const [sel, setSel]             = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,laying_farm_id,rearing_farm_id').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q; return data ?? []
    }
  })
  const { data: parties } = useQuery({
    queryKey: ['parties_buyers'],
    queryFn: async () => { const { data } = await supabase.from('parties').select('id,name').in('type',['buyer','both']).order('name'); return data ?? [] }
  })

  const hasFilter = !!(flockFilter || fromDate || toDate)

  const { data: sales, isLoading } = useQuery({
    queryKey: ['nhe_sales', flockFilter, fromDate, toDate],
    queryFn: async () => {
      let q = supabase.from('nhe_sales').select('*, flocks(flock_no), parties(name)')
        .order('sale_date', { ascending: false })
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      if (fromDate) q = q.gte('sale_date', fromDate)
      if (toDate) q = q.lte('sale_date', toDate)
      if (!hasFilter) q = q.limit(200)
      const { data } = await q; return data ?? []
    }
  })

  const [form, setForm] = useState<any>(EMPTY_NHE_FORM)
  const sv = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }))
  const autoAmt = (parseFloat(form.quantity)||0) * (parseFloat(form.rate)||0)

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.from('nhe_sales').delete().in('id', ids) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nhe_sales'] }); setSel(new Set()); setBulkConfirm(false) }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.flock_id || !form.sale_date || !form.amount) throw new Error('Flock, date and amount required')
      const payload = {
        flock_id: form.flock_id, sale_date: form.sale_date, sale_type: form.sale_type,
        party_id: form.party_id || null, dc_no: form.dc_no || null,
        quantity: parseFloat(form.quantity) || null, unit: form.unit,
        rate: parseFloat(form.rate) || null,
        amount: parseFloat(form.amount) || autoAmt,
        remarks: form.remarks || null
      }
      if (editing) {
        const { error } = await supabase.from('nhe_sales').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('nhe_sales').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated!' : 'Sale recorded!')
      qc.invalidateQueries({ queryKey: ['nhe_sales'] })
      setShowForm(false); setEditing(null)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_NHE_FORM, flock_id: flockFilter })
    setShowForm(true)
  }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({
      flock_id: row.flock_id, sale_date: row.sale_date, sale_type: row.sale_type,
      party_id: row.party_id ?? '', dc_no: row.dc_no ?? '',
      quantity: row.quantity ?? '', unit: row.unit ?? 'nos',
      rate: row.rate ?? '', amount: row.amount ?? '', remarks: row.remarks ?? ''
    })
    setShowForm(true)
  }

  // Download template
  const handleDownloadTemplate = () => {
    const headers = 'flock_no,sale_date,sale_type,party_name,dc_no,quantity,unit,rate,amount,remarks'
    const example = [
      '19,2025-06-01,bird_cull,Party Name,DC001,100,nos,150,15000,Cull birds sale',
      '19,2025-06-01,je,Party Name,DC002,500,nos,8.5,4250,Jumbo eggs',
    ].join('\n')
    const notes = [
      '# sale_type values: je | te | be | bird_cull | bird_lame | bird_weak | bird_sex_error | gas | manure | other',
      '# unit: nos (birds/eggs) | kg | ltrs | bags',
      '# amount = quantity × rate (auto-calculated if left blank)',
    ].join('\n')
    const blob = new Blob([notes + '\n' + headers + '\n' + example], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'nhe_bird_sales_template.csv'; a.click()
  }

  // Import CSV
  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const { headers: header, rows: rawRows } = await parseFile(file)
      const rows = rawRows.map(vals => { const obj: any = {}; header.forEach((h,i) => { obj[h] = vals[i]??'' }); return obj }).filter(r => r.sale_date && r.flock_no)

      // Resolve flock_no → flock_id, party_name → party_id
      const flockMap: Record<string, string> = {}
      flocks?.forEach((f: any) => { flockMap[String(f.flock_no)] = f.id })
      const partyMap: Record<string, string> = {}
      parties?.forEach((p: any) => { partyMap[p.name.toLowerCase()] = p.id })

      const records = rows.map(r => ({
        flock_id: flockMap[r.flock_no] ?? null,
        sale_date: r.sale_date,
        sale_type: r.sale_type || 'other',
        party_id: r.party_name ? (partyMap[r.party_name.toLowerCase()] ?? null) : null,
        dc_no: r.dc_no || null,
        quantity: r.quantity !== '' ? Number(r.quantity) : null,
        unit: r.unit || 'nos',
        rate: r.rate !== '' ? Number(r.rate) : null,
        amount: r.amount !== '' ? Number(r.amount) : (Number(r.quantity||0) * Number(r.rate||0)) || null,
        remarks: r.remarks || null,
      })).filter(r => r.flock_id && r.amount)

      if (records.length === 0) throw new Error('No valid rows found. Check flock_no and amount columns.')
      const { error } = await supabase.from('nhe_sales').insert(records)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['nhe_sales'] })
      toast.success(`Imported ${records.length} records!`)
    } catch (e: any) {
      toast.error('Import failed: ' + e.message)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const partyOptions = parties?.map((p: any) => ({ value: p.id, label: p.name })) ?? []

  const filtered = (sales ?? []).filter((s: any) => !typeFilter || s.sale_type === typeFilter)

  const saleIds = filtered.map((s: any) => s.id)
  const allSel  = saleIds.length > 0 && saleIds.every((id: string) => sel.has(id))
  const someSel = saleIds.some((id: string) => sel.has(id))
  const toggle    = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? saleIds.forEach((id: string) => n.delete(id)) : saleIds.forEach((id: string) => n.add(id)); return n })

  // Summary by type
  const byType = (sales ?? []).reduce((acc: any, s: any) => {
    if (!acc[s.sale_type]) acc[s.sale_type] = { amount: 0, qty: 0, count: 0 }
    acc[s.sale_type].amount += Number(s.amount ?? 0)
    acc[s.sale_type].qty   += Number(s.quantity ?? 0)
    acc[s.sale_type].count += 1
    return acc
  }, {})

  // Bird sales summary: avg rate per type
  const birdSummary = BIRD_SALE_TYPES.filter(t => byType[t]).map(t => {
    const d = byType[t]
    const avgRate = d.qty > 0 ? d.amount / d.qty : 0
    return { type: t, label: NHE_TYPES.find(x => x.value === t)?.label ?? t, ...d, avgRate }
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="NHE & Bird Sales"
        subtitle="Non-hatching eggs, bird sales, gas, manure income"
        action={<Button icon={<Plus size={16}/>} onClick={openNew}>Add Sale</Button>}
      />

      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap items-end">
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Types</option>
          {NHE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          From <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm" />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          To <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm" />
        </label>
        {(hasFilter||typeFilter) && <Button variant="ghost" size="sm" onClick={() => { setFlockFilter(''); setFromDate(''); setToDate(''); setTypeFilter('') }}>Clear</Button>}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleDownloadTemplate}>Template</Button>
          <Button variant="outline" size="sm" icon={<Upload size={14}/>} loading={importing} onClick={() => fileRef.current?.click()}>Import</Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }} />
        </div>
      </div>

      {/* Bird Sales Summary */}
      {birdSummary.length > 0 && (
        <Card>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bird Sales Summary</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {birdSummary.map(b => (
              <div key={b.type} className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                <p className="text-xs text-orange-700 font-medium">{b.label}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{inr(b.amount)}</p>
                <p className="text-xs text-gray-500">{b.qty.toLocaleString('en-IN')} birds · {b.count} entries</p>
                <p className="text-xs text-orange-600 font-semibold">Avg Rate: ₹{b.avgRate.toFixed(2)}/bird</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Other income summary */}
      {Object.keys(byType).filter(t => !BIRD_SALE_TYPES.includes(t)).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(byType).filter(([t]) => !BIRD_SALE_TYPES.includes(t)).map(([type, d]: any) => (
            <Card key={type} className="!p-3">
              <p className="text-xs text-gray-500">{NHE_TYPES.find(t => t.value === type)?.label ?? type}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{inr(d.amount)}</p>
              <p className="text-xs text-gray-400">{d.count} entries · {d.qty > 0 ? `${d.qty.toLocaleString('en-IN')} nos` : ''}</p>
            </Card>
          ))}
        </div>
      )}

      <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
              <Th>Flock</Th><Th>Date</Th><Th>Type</Th><Th>Party</Th>
              <Th right>Qty</Th><Th right>Rate</Th><Th right>Amount</Th>
              <Th>DC No</Th><Th>Remarks</Th><Th></Th>
            </tr></thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.id} className={`hover:bg-gray-50 ${sel.has(s.id) ? 'bg-red-50' : ''} ${BIRD_SALE_TYPES.includes(s.sale_type) ? 'bg-orange-50/40' : ''}`}>
                  <Td><CB checked={sel.has(s.id)} onChange={() => toggle(s.id)}/></Td>
                  <Td><Badge color="green">F-{s.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(s.sale_date)}</Td>
                  <Td className="text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${BIRD_SALE_TYPES.includes(s.sale_type) ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {NHE_TYPES.find(t => t.value === s.sale_type)?.label ?? s.sale_type}
                    </span>
                  </Td>
                  <Td className="text-xs text-gray-500">{s.parties?.name ?? '—'}</Td>
                  <Td right className="text-xs">{s.quantity != null ? s.quantity.toLocaleString('en-IN') : '—'} <span className="text-gray-400">{s.unit}</span></Td>
                  <Td right className="text-xs">{s.rate ? `₹${s.rate}` : '—'}</Td>
                  <Td right className="font-semibold text-green-700 text-xs">{inr(s.amount)}</Td>
                  <Td className="text-xs text-gray-400">{s.dc_no ?? '—'}</Td>
                  <Td className="text-xs text-gray-400 max-w-[140px] truncate">{s.remarks ?? ''}</Td>
                  <Td>
                    <button onClick={() => openEdit(s)} className="p-1 text-blue-400 hover:text-blue-600"><Edit2 size={13}/></button>
                  </Td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold">
                <Td colSpan={7}>TOTAL ({filtered.length} records)</Td>
                <Td right className="text-green-700">{inr(filtered.reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0))}</Td>
                <Td colSpan={3}></Td>
              </tr></tfoot>
            )}
          </Table>
          {filtered.length === 0 && <EmptyState icon={<Egg size={32}/>} title="No sales yet" action={<Button onClick={openNew} icon={<Plus size={16}/>}>Add</Button>} />}
        </Card>
      )}

      {bulkConfirm && (
        <ConfirmBulkDelete label={`Delete ${sel.size} NHE/bird sale records? This cannot be undone.`}
          onConfirm={() => bulkDelMut.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit NHE / Bird Sale' : 'Record NHE / Bird Sale'} size="md"
        footer={<><Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
          <Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Select label="Flock" required placeholder="— Select —" options={flockOptions}
              value={form.flock_id} onChange={e => sv('flock_id', e.target.value)} />
            <Input label="Sale Date" required type="date" value={form.sale_date} onChange={e => sv('sale_date', e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Sale Type" required options={NHE_TYPES} value={form.sale_type} onChange={e => sv('sale_type', e.target.value)} />
            <Select label="Party" placeholder="— Select —" options={partyOptions}
              value={form.party_id} onChange={e => sv('party_id', e.target.value)} />
          </FormRow>
          <FormRow cols={4}>
            <Input label="Qty" type="number" value={form.quantity} onChange={e => sv('quantity', e.target.value)} />
            <Input label="Unit" value={form.unit} onChange={e => sv('unit', e.target.value)} />
            <Input label="Rate (₹)" type="number" step="0.01" value={form.rate} onChange={e => sv('rate', e.target.value)} />
            <Input label="Amount (₹)" required type="number" step="0.01" value={form.amount}
              onChange={e => sv('amount', e.target.value)}
              hint={autoAmt > 0 ? `Auto: ${inr(autoAmt)}` : undefined} />
          </FormRow>
          <FormRow>
            <Input label="DC No" value={form.dc_no} onChange={e => sv('dc_no', e.target.value)} />
            <Input label="Remarks" value={form.remarks} onChange={e => sv('remarks', e.target.value)} />
          </FormRow>
        </div>
      </Modal>
    </div>
  )
}

// ── MEDICINE ENTRY ───────────────────────────────────────────────
export const MedicineEntry: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [showForm, setShowForm] = useState(false)
  const [flockFilter, setFlockFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,laying_farm_id,rearing_farm_id').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q; return data ?? []
    }
  })
  const { data: medicines } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => { const { data } = await supabase.from('medicines_master').select('id,name,unit,rate').eq('is_active',true).order('name'); return data ?? [] }
  })

  const hasFilter = !!(flockFilter || fromDate || toDate)

  const { data: usage, isLoading } = useQuery({
    queryKey: ['medicine_usage', flockFilter, fromDate, toDate],
    queryFn: async () => {
      let q = supabase.from('medicine_usage')
        .select('*, flocks(flock_no), medicines_master(name,unit)')
        .order('usage_date', { ascending: false })
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      if (fromDate) q = q.gte('usage_date', fromDate)
      if (toDate) q = q.lte('usage_date', toDate)
      if (!hasFilter) q = q.limit(200)
      const { data } = await q; return data ?? []
    }
  })

  const { data: monthly } = useQuery({
    queryKey: ['medicine_monthly', flockFilter],
    queryFn: async () => {
      let q = supabase.from('medicine_monthly').select('*, flocks(flock_no)').order('month', { ascending: false }).limit(60)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q; return data ?? []
    }
  })

  const [tab, setTab] = useState<'daily' | 'monthly'>('monthly')
  const [form, setForm] = useState({
    flock_id: '', usage_date: today(), medicine_id: '',
    quantity: '', unit: '', rate: '', amount: '', remarks: ''
  })
  const [monthlyForm, setMonthlyForm] = useState({ flock_id: '', month: '', total_amount: '', remarks: '' })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const sm = (k: string, v: string) => setMonthlyForm(f => ({ ...f, [k]: v }))

  const autoAmt = (parseFloat(form.quantity)||0) * (parseFloat(form.rate)||0)

  const mut = useMutation({
    mutationFn: async () => {
      if (tab === 'monthly') {
        if (!monthlyForm.flock_id || !monthlyForm.month || !monthlyForm.total_amount) throw new Error('All fields required')
        const { error } = await supabase.from('medicine_monthly').upsert({
          flock_id: monthlyForm.flock_id, month: monthlyForm.month + '-01',
          total_amount: parseFloat(monthlyForm.total_amount),
          remarks: monthlyForm.remarks || null
        }, { onConflict: 'flock_id,month' })
        if (error) throw error
      } else {
        if (!form.flock_id || !form.usage_date) throw new Error('Flock and date required')
        const { error } = await supabase.from('medicine_usage').insert({
          flock_id: form.flock_id, usage_date: form.usage_date,
          medicine_id: form.medicine_id || null,
          quantity: parseFloat(form.quantity) || null, unit: form.unit || null,
          rate: parseFloat(form.rate) || null,
          amount: parseFloat(form.amount) || autoAmt || null,
          remarks: form.remarks || null
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Saved!')
      qc.invalidateQueries({ queryKey: ['medicine_usage'] })
      qc.invalidateQueries({ queryKey: ['medicine_monthly'] })
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const bulkDelMutMed = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.from('medicine_usage').delete().in('id', ids) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medicine_usage'] }); setSel(new Set()); setBulkConfirm(false) }
  })

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const medOptions = medicines?.map((m: any) => ({ value: m.id, label: `${m.name} (${m.unit})` })) ?? []

  const usageIds = (usage ?? []).map((u: any) => u.id)
  const allUsageSel = usageIds.length > 0 && usageIds.every((id: string) => sel.has(id))
  const someUsageSel = usageIds.some((id: string) => sel.has(id))
  const toggleUsage = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAllUsage = () => setSel(s => { const n = new Set(s); allUsageSel ? usageIds.forEach((id: string) => n.delete(id)) : usageIds.forEach((id: string) => n.add(id)); return n })

  const handleExportMed = () => {
    const rows = tab === 'daily' ? usage : monthly
    if (!rows?.length) { toast.error('No data to export'); return }
    if (tab === 'daily') {
      exportFlatCSV(`medicine_usage.csv`,
        ['flock_no','usage_date','medicine','qty','unit','rate','amount','remarks'],
        (usage??[]).map((u:any)=>[u.flocks?.flock_no, u.usage_date, u.medicines_master?.name, u.quantity, u.unit, u.rate, u.amount, u.remarks])
      )
    } else {
      exportFlatCSV(`medicine_monthly.csv`,
        ['flock_no','month','total_amount','remarks'],
        (monthly??[]).map((m:any)=>[m.flocks?.flock_no, m.month?.slice(0,7), m.total_amount, m.remarks])
      )
    }
  }

  const handleTemplateMed = () => {
    exportFlatCSV('medicine_usage_template.csv',
      ['flock_no','usage_date','medicine_name','quantity','unit','rate','remarks'],
      [['101','2025-06-01','Newcastle Vaccine','50','dose','12','Regular vaccination']]
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Medicine & Vaccine"
        subtitle="Record medicine usage and monthly totals"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleTemplateMed}>Template</Button>
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExportMed}>Export CSV</Button>
            <Button icon={<Plus size={16}/>} onClick={() => setShowForm(true)}>Add Entry</Button>
          </div>
        }
      />
      <div className="flex gap-3 flex-wrap items-end">
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          From
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm" />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          To
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm" />
        </label>
        {hasFilter && <Button variant="ghost" size="sm" onClick={() => { setFlockFilter(''); setFromDate(''); setToDate('') }}>Clear</Button>}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden ml-auto">
          {(['monthly','daily'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-medium capitalize transition-colors
                ${tab===t ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <Spinner /> : tab === 'monthly' ? (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Flock</Th><Th>Month</Th><Th right>Total Amount</Th><Th>Remarks</Th></tr></thead>
            <tbody>
              {monthly?.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <Td><Badge color="green">F-{m.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(m.month)}</Td>
                  <Td right className="font-semibold">{inr(m.total_amount)}</Td>
                  <Td className="text-xs text-gray-400">{m.remarks ?? ''}</Td>
                </tr>
              ))}
            </tbody>
            {monthly && monthly.length > 0 && (
              <tfoot><tr className="bg-gray-50">
                <Td colSpan={2}><strong>TOTAL</strong></Td>
                <Td right><strong>{inr(monthly.reduce((s: number, m: any) => s + m.total_amount, 0))}</strong></Td>
                <Td> </Td>
              </tr></tfoot>
            )}
          </Table>
          {monthly?.length === 0 && <EmptyState icon={<Package size={32}/>} title="No medicine data" action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16}/>}>Add Monthly Total</Button>} />}
        </Card>
      ) : (
        <>
          <BulkBar count={sel.size} loading={bulkDelMutMed.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allUsageSel} indeterminate={someUsageSel && !allUsageSel} onChange={toggleAllUsage}/></Th>
                <Th>Flock</Th><Th>Date</Th><Th>Medicine</Th>
                <Th right>Qty</Th><Th right>Rate</Th><Th right>Amount</Th>
              </tr></thead>
              <tbody>
                {usage?.map((u: any) => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${sel.has(u.id) ? 'bg-red-50' : ''}`}>
                    <Td><CB checked={sel.has(u.id)} onChange={() => toggleUsage(u.id)}/></Td>
                    <Td><Badge color="green">F-{u.flocks?.flock_no}</Badge></Td>
                    <Td className="text-xs">{fmtDate(u.usage_date)}</Td>
                    <Td className="text-sm">{u.medicines_master?.name ?? '—'}</Td>
                    <Td right className="text-xs">{u.quantity ?? '—'} {u.unit}</Td>
                    <Td right className="text-xs">{u.rate ? `Rs ${u.rate}` : '—'}</Td>
                    <Td right className="font-semibold text-xs">{u.amount ? inr(u.amount) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {usage?.length === 0 && <EmptyState icon={<Package size={32}/>} title="No usage records" />}
          </Card>
          {bulkConfirm && (
            <ConfirmBulkDelete label={`Delete ${sel.size} medicine usage records? This cannot be undone.`}
              onConfirm={() => bulkDelMutMed.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
          )}
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Medicine Entry" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button></>}>
        {/* Tab inside modal */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4">
          {(['monthly','daily'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium capitalize ${tab===t?'bg-brand-600 text-white':'text-gray-600 hover:bg-gray-50'}`}>
              {t === 'monthly' ? 'Monthly Total' : 'Daily Usage'}
            </button>
          ))}
        </div>
        {tab === 'monthly' ? (
          <div className="space-y-4">
            <FormRow>
              <Select label="Flock" required placeholder="— Select —" options={flockOptions}
                value={monthlyForm.flock_id} onChange={e => sm('flock_id', e.target.value)} />
              <Input label="Month" required type="month" value={monthlyForm.month} onChange={e => sm('month', e.target.value)} />
            </FormRow>
            <Input label="Total Medicine Amount (Rs)" required type="number" step="0.01"
              value={monthlyForm.total_amount} onChange={e => sm('total_amount', e.target.value)} />
            <Input label="Remarks" value={monthlyForm.remarks} onChange={e => sm('remarks', e.target.value)} />
          </div>
        ) : (
          <div className="space-y-4">
            <FormRow>
              <Select label="Flock" required placeholder="— Select —" options={flockOptions}
                value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
              <Input label="Date" required type="date" value={form.usage_date} onChange={e => s('usage_date', e.target.value)} />
            </FormRow>
            <Select label="Medicine / Vaccine" placeholder="— Select —" options={medOptions}
              value={form.medicine_id} onChange={e => {
                s('medicine_id', e.target.value)
                const med = medicines?.find((m: any) => m.id === e.target.value)
                if (med) { s('unit', med.unit); s('rate', med.rate?.toString() ?? '') }
              }} />
            <FormRow cols={4}>
              <Input label="Qty" type="number" step="0.001" value={form.quantity} onChange={e => s('quantity', e.target.value)} />
              <Input label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)} />
              <Input label="Rate" type="number" step="0.01" value={form.rate} onChange={e => s('rate', e.target.value)} />
              <Input label="Amount" type="number" step="0.01" value={form.amount}
                onChange={e => s('amount', e.target.value)}
                hint={autoAmt > 0 ? `Auto: ${inr(autoAmt)}` : undefined} />
            </FormRow>
            <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
          </div>
        )}
      </Modal>
    </div>
  )
}
