import React, { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import { Card, Button, Select, SectionHeader, Spinner, Table, Th, Td } from '@/components/ui'
import { Download, Printer } from 'lucide-react'
import toast from 'react-hot-toast'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const YEAR_OPTIONS = (() => {
  const y = new Date().getFullYear()
  const out: string[] = []
  for (let i = y - 2; i <= y + 1; i++) out.push(String(i))
  return out
})()

const OUT_TYPES = new Set(['production_out', 'medicine_out', 'adjustment_out', 'transfer_out', 'dispatch_out'])

// Rate row shape from stock_statement_rates
type RateRow = { period: string; line_key: string; rate: number }

function useRatesMap(period: string) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['stock_statement_rates', period],
    queryFn: async () => {
      const { data, error } = await supabase.from('stock_statement_rates').select('period,line_key,rate').eq('period', period)
      if (error) throw error
      return (data ?? []) as RateRow[]
    },
  })
  const map = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of data ?? []) m[r.line_key] = Number(r.rate) || 0
    return m
  }, [data])

  const saveRate = async (line_key: string, rate: number) => {
    const { error } = await supabase.from('stock_statement_rates')
      .upsert({ period, line_key, rate }, { onConflict: 'period,line_key' })
    if (error) { toast.error(error.message); return }
    qc.invalidateQueries({ queryKey: ['stock_statement_rates', period] })
  }

  return { map, isLoading, saveRate }
}

// Inline-editable rate cell — auto-saves on blur
const RateInput: React.FC<{ value: number; onSave: (v: number) => void }> = ({ value, onSave }) => {
  return (
    <input
      type="number" step="0.01" defaultValue={value}
      key={value}
      onBlur={e => {
        const v = parseFloat(e.target.value) || 0
        if (v !== value) onSave(v)
      }}
      className="text-xs border border-gray-200 rounded px-1 py-0.5 w-24 text-right no-print-hide"
    />
  )
}

export const StockStatement: React.FC = () => {
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'))
  const [year, setYear] = useState(String(now.getFullYear()))
  const period = `${year}-${month}`

  const { map: rates, saveRate } = useRatesMap(period)

  // ── Live Birds (per flock) ──────────────────────────────────────
  const { data: flocks = [], isLoading: loadingFlocks } = useQuery({
    queryKey: ['stock_stmt_flocks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_flock_summary')
        .select('id,flock_no,breed,status,rearing_farm,laying_farm,current_female,current_male')
        .eq('is_vhl_contract', false)
        .neq('status', 'closed')
        .order('flock_no')
      if (error) throw error
      return data ?? []
    },
  })

  // ── Items master + stock ledger (current balances) ──────────────
  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['stock_stmt_items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('items').select('id,name,category,unit,is_active').order('name')
      if (error) throw error
      return data ?? []
    },
  })
  const { data: ledger = [], isLoading: loadingLedger } = useQuery({
    queryKey: ['stock_stmt_ledger'],
    queryFn: async () => {
      let all: any[] = [], from = 0
      while (true) {
        const { data, error } = await supabase.from('stock_ledger')
          .select('item_id,item_name,category,txn_type,qty').order('txn_date').range(from, from + 999)
        if (error) throw error
        if (!data || !data.length) break
        all = all.concat(data); if (data.length < 1000) break; from += 1000
      }
      return all
    },
  })

  // Current closing qty per item. NOTE: this app has no historical month-end
  // stock snapshots, so every period shows the CURRENT balance regardless of
  // the month/year picked above — swap in a dated snapshot query here later.
  const itemBalances = useMemo(() => {
    const m: Record<string, { name: string; category: string; unit: string; qty: number }> = {}
    for (const it of items) m[it.id] = { name: it.name, category: it.category ?? '', unit: it.unit ?? '', qty: 0 }
    for (const r of ledger) {
      const key = r.item_id ?? r.item_name
      if (!m[key]) m[key] = { name: r.item_name, category: r.category ?? '', unit: '', qty: 0 }
      const qty = Number(r.qty ?? 0)
      m[key].qty += OUT_TYPES.has(r.txn_type) ? -qty : qty
    }
    return Object.entries(m).map(([id, v]) => ({ id, ...v }))
  }, [items, ledger])

  const rawMaterial = itemBalances.filter(r => r.category === 'Feed Ingredient')
  const medicineTotalQty = itemBalances.filter(r => ['Medicine', 'Vaccine'].includes(r.category)).reduce((s, r) => s + r.qty, 0)
  const packingTotalQty = itemBalances.filter(r => r.category === 'Packaging').reduce((s, r) => s + r.qty, 0)

  // ── Hatching eggs — best-effort current closing (opening + produced - dispatched) ──
  const { data: heOpening = 0 } = useQuery({
    queryKey: ['stock_stmt_he_opening'],
    queryFn: async () => {
      const { data, error } = await supabase.from('egg_opening_stock').select('he_grade_a,he_grade_b,he_grade_c')
      if (error) throw error
      return (data ?? []).reduce((s: number, r: any) => s + (r.he_grade_a ?? 0) + (r.he_grade_b ?? 0) + (r.he_grade_c ?? 0), 0)
    },
  })
  const { data: heProduced = 0 } = useQuery({
    queryKey: ['stock_stmt_he_produced'],
    queryFn: async () => {
      const { data, error } = await supabase.from('daily_records').select('he_eggs')
      if (error) throw error
      return (data ?? []).reduce((s: number, r: any) => s + (r.he_eggs ?? 0), 0)
    },
  })
  const { data: heDispatched = 0 } = useQuery({
    queryKey: ['stock_stmt_he_dispatched'],
    queryFn: async () => {
      const { data, error } = await supabase.from('he_dispatch_lines').select('grade_a,grade_b,grade_c')
      if (error) throw error
      return (data ?? []).reduce((s: number, r: any) => s + (r.grade_a ?? 0) + (r.grade_b ?? 0) + (r.grade_c ?? 0), 0)
    },
  })
  const heClosing = heOpening + heProduced - heDispatched

  const loading = loadingFlocks || loadingItems || loadingLedger

  // ── Amount rollups ───────────────────────────────────────────────
  const liveBirdLines = flocks.map((f: any) => {
    const qty = (f.current_female ?? 0) + (f.current_male ?? 0)
    const key = `live_birds:${f.id}`
    const rate = rates[key] ?? 0
    return { key, label: `Flock ${f.flock_no} (${f.breed ?? ''}) — ${f.laying_farm ?? f.rearing_farm ?? ''}`, qty, rate, amount: qty * rate }
  })
  const rawMaterialLines = rawMaterial.map(r => {
    const key = `raw_material:${r.id}`
    const rate = rates[key] ?? 0
    return { key, label: `${r.name} (${r.unit})`, qty: r.qty, rate, amount: r.qty * rate }
  })
  const medicineAmount = rates['medicine'] ?? 0
  const packingAmount = rates['packing_material'] ?? 0
  const heRate = rates['hatching_eggs'] ?? 0
  const heAmount = heClosing * heRate

  const totalLiveBirds = liveBirdLines.reduce((s, l) => s + l.amount, 0)
  const totalRawMaterial = rawMaterialLines.reduce((s, l) => s + l.amount, 0)
  const grandTotal = totalLiveBirds + totalRawMaterial + medicineAmount + packingAmount + heAmount

  const handlePrint = () => window.print()

  const exportXlsx = () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      liveBirdLines.map(l => ({ Line: l.label, Qty: l.qty, Rate: l.rate, Amount: l.amount }))
    ), 'Live Birds')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      rawMaterialLines.map(l => ({ Item: l.label, Qty: l.qty, Rate: l.rate, Amount: l.amount }))
    ), 'Raw Material')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Section: 'Medicine', ClosingQty: medicineTotalQty, Amount: medicineAmount },
      { Section: 'Packing Materials', ClosingQty: packingTotalQty, Amount: packingAmount },
      { Section: 'Hatching Eggs', Qty: heClosing, Rate: heRate, Amount: heAmount },
    ]), 'Other Sections')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Section: 'Live Birds', Amount: totalLiveBirds },
      { Section: 'Raw Material', Amount: totalRawMaterial },
      { Section: 'Medicine', Amount: medicineAmount },
      { Section: 'Packing Materials', Amount: packingAmount },
      { Section: 'Hatching Eggs', Amount: heAmount },
      { Section: 'GRAND TOTAL', Amount: grandTotal },
    ]), 'Summary')
    XLSX.writeFile(wb, `Stock_Statement_${period}.xlsx`)
  }

  return (
    <div className="space-y-4 print-area">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <SectionHeader title="Stock Statement" subtitle="Live birds, raw material, medicine, packing and hatching eggs — for bank submission" />

      <Card className="no-print">
        <div className="flex flex-wrap gap-3 items-end">
          <Select label="Month" value={month} onChange={e => setMonth(e.target.value)}
            options={MONTH_NAMES.map((m, i) => ({ value: String(i + 1).padStart(2, '0'), label: m }))} />
          <Select label="Year" value={year} onChange={e => setYear(e.target.value)}
            options={YEAR_OPTIONS.map(y => ({ value: y, label: y }))} />
          <Button size="sm" variant="outline" onClick={exportXlsx}><Download size={14} className="mr-1" />Export</Button>
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer size={14} className="mr-1" />Print</Button>
        </div>
      </Card>

      {/* Letterhead */}
      <Card>
        <div className="text-sm">
          <p>To,</p>
          <p className="font-semibold">The Asst. General Manager,</p>
          <p className="font-semibold">Kotak Bank, Himayatnagar</p>
          <p className="mt-2 text-gray-600">Stock Statement for the period: <strong>{MONTH_NAMES[parseInt(month) - 1]} {year}</strong></p>
        </div>
      </Card>

      {loading ? <Spinner /> : (
        <>
          {/* Live Birds */}
          <Card>
            <p className="font-semibold text-sm mb-2">1. Live Birds</p>
            <Table>
              <thead><tr><Th>Flock / Site</Th><Th right>Closing Qty</Th><Th right>Rate</Th><Th right>Amount</Th></tr></thead>
              <tbody>
                {liveBirdLines.length === 0
                  ? <tr><td colSpan={4} className="text-center py-4 text-gray-400 text-sm">No active flocks</td></tr>
                  : liveBirdLines.map(l => (
                    <tr key={l.key}>
                      <Td className="text-xs">{l.label}</Td>
                      <Td right className="text-xs">{l.qty.toLocaleString('en-IN')}</Td>
                      <Td right><RateInput value={l.rate} onSave={v => saveRate(l.key, v)} /></Td>
                      <Td right className="text-xs font-semibold">{inr(l.amount)}</Td>
                    </tr>
                  ))}
              </tbody>
              {liveBirdLines.length > 0 && (
                <tfoot><tr className="bg-gray-50 font-semibold">
                  <Td colSpan={3}>TOTAL</Td><Td right>{inr(totalLiveBirds)}</Td>
                </tr></tfoot>
              )}
            </Table>
          </Card>

          {/* Raw Material */}
          <Card>
            <p className="font-semibold text-sm mb-2">2. Raw Material</p>
            <Table>
              <thead><tr><Th>Item</Th><Th right>Closing Qty</Th><Th right>Rate</Th><Th right>Amount</Th></tr></thead>
              <tbody>
                {rawMaterialLines.length === 0
                  ? <tr><td colSpan={4} className="text-center py-4 text-gray-400 text-sm">No raw material items</td></tr>
                  : rawMaterialLines.map(l => (
                    <tr key={l.key}>
                      <Td className="text-xs">{l.label}</Td>
                      <Td right className="text-xs">{l.qty.toLocaleString('en-IN')}</Td>
                      <Td right><RateInput value={l.rate} onSave={v => saveRate(l.key, v)} /></Td>
                      <Td right className="text-xs font-semibold">{inr(l.amount)}</Td>
                    </tr>
                  ))}
              </tbody>
              {rawMaterialLines.length > 0 && (
                <tfoot><tr className="bg-gray-50 font-semibold">
                  <Td colSpan={3}>TOTAL</Td><Td right>{inr(totalRawMaterial)}</Td>
                </tr></tfoot>
              )}
            </Table>
          </Card>

          {/* Medicine — value only */}
          <Card>
            <p className="font-semibold text-sm mb-2">3. Medicine (value)</p>
            <Table>
              <thead><tr><Th>Closing Value</Th><Th right>Amount</Th></tr></thead>
              <tbody>
                <tr>
                  <Td className="text-xs">Total medicine stock value for the period (qty on hand: {medicineTotalQty.toLocaleString('en-IN')})</Td>
                  <Td right><RateInput value={medicineAmount} onSave={v => saveRate('medicine', v)} /></Td>
                </tr>
              </tbody>
            </Table>
          </Card>

          {/* Packing Materials — value only */}
          <Card>
            <p className="font-semibold text-sm mb-2">4. Packing Materials (value)</p>
            <Table>
              <thead><tr><Th>Closing Value</Th><Th right>Amount</Th></tr></thead>
              <tbody>
                <tr>
                  <Td className="text-xs">Total packing material stock value for the period (qty on hand: {packingTotalQty.toLocaleString('en-IN')})</Td>
                  <Td right><RateInput value={packingAmount} onSave={v => saveRate('packing_material', v)} /></Td>
                </tr>
              </tbody>
            </Table>
          </Card>

          {/* Hatching Eggs */}
          <Card>
            <p className="font-semibold text-sm mb-2">5. Hatching Eggs</p>
            <Table>
              <thead><tr><Th>Closing Qty</Th><Th right>Rate</Th><Th right>Amount</Th></tr></thead>
              <tbody>
                <tr>
                  <Td className="text-xs">{heClosing.toLocaleString('en-IN')}</Td>
                  <Td right><RateInput value={heRate} onSave={v => saveRate('hatching_eggs', v)} /></Td>
                  <Td right className="text-xs font-semibold">{inr(heAmount)}</Td>
                </tr>
              </tbody>
            </Table>
          </Card>

          {/* Summary */}
          <Card className="bg-gray-50">
            <p className="font-semibold text-sm mb-2">Summary</p>
            <Table>
              <tbody>
                <tr><Td>Live Birds</Td><Td right className="font-semibold">{inr(totalLiveBirds)}</Td></tr>
                <tr><Td>Raw Material</Td><Td right className="font-semibold">{inr(totalRawMaterial)}</Td></tr>
                <tr><Td>Medicine</Td><Td right className="font-semibold">{inr(medicineAmount)}</Td></tr>
                <tr><Td>Packing Materials</Td><Td right className="font-semibold">{inr(packingAmount)}</Td></tr>
                <tr><Td>Hatching Eggs</Td><Td right className="font-semibold">{inr(heAmount)}</Td></tr>
              </tbody>
              <tfoot><tr className="font-bold border-t-2 border-gray-300">
                <Td>GRAND TOTAL</Td><Td right>{inr(grandTotal)}</Td>
              </tr></tfoot>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}

export const StockStatementPage = StockStatement
export default StockStatement
