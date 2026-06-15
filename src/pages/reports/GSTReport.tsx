import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtMonth } from '@/lib/utils'
import {
  Card, Select, SectionHeader, Spinner, Table, Th, Td, Badge, Button
} from '@/components/ui'
import { Download, AlertTriangle, Info } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

// ── GST rate mapping for NHE sales categories ──────────────────────
const NHE_GST_RATES: Record<string, number> = {
  je: 0,
  te: 0,
  be: 0,
  bird_cull: 5,
  bird_lame: 5,
  bird_weak: 5,
  bird_sex_error: 5,
  gas: 18,
  manure: 5,
  gunny_bags: 12,
  maize_bags: 12,
  plastic_bags: 12,
  other: 5,
}

const FY_OPTIONS = [
  { value: '2024-25', label: 'FY 2024-25' },
  { value: '2025-26', label: 'FY 2025-26' },
  { value: '2026-27', label: 'FY 2026-27' },
]

const MONTH_OPTIONS = [
  { value: '', label: 'All Months' },
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' },   { value: '04', label: 'April' },
  { value: '05', label: 'May' },     { value: '06', label: 'June' },
  { value: '07', label: 'July' },    { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' },{ value: '12', label: 'December' },
]

function fyDateRange(fy: string): { start: string; end: string } {
  const [startYear] = fy.split('-')
  return {
    start: `${startYear}-04-01`,
    end:   `${parseInt(startYear) + 1}-03-31`,
  }
}

function monthLabel(ym: string) {
  try { return new Date(ym + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) }
  catch { return ym }
}

interface GstMonthRow {
  month: string
  input5: number
  input12: number
  input18: number
  inputTotal: number
  output0: number
  output5: number
  output12: number
  output18: number
  outputTotal: number
  netPayable: number
}

export const GSTReportPage: React.FC = () => {
  const [fy, setFy] = useState('2025-26')
  const [monthFilter, setMonthFilter] = useState('')

  const { start, end } = fyDateRange(fy)

  // ── Input GST: GRN purchases ────────────────────────────────────
  const { data: grnData, isLoading: grnLoading } = useQuery({
    queryKey: ['gst_grn', fy],
    queryFn: async () => {
      const { data } = await supabase
        .from('grn')
        .select('grn_date, basic_amount, gst_pct')
        .gte('grn_date', start)
        .lte('grn_date', end)
        .order('grn_date')
      return data ?? []
    }
  })

  // ── Output GST: HE dispatch ─────────────────────────────────────
  const { data: heData, isLoading: heLoading } = useQuery({
    queryKey: ['gst_he', fy],
    queryFn: async () => {
      const { data } = await supabase
        .from('he_dispatch')
        .select('dispatch_date, amount')
        .gte('dispatch_date', start)
        .lte('dispatch_date', end)
      return data ?? []
    }
  })

  // ── Output GST: NHE sales ────────────────────────────────────────
  const { data: nheData, isLoading: nheLoading } = useQuery({
    queryKey: ['gst_nhe', fy],
    queryFn: async () => {
      const { data } = await supabase
        .from('nhe_sales')
        .select('sale_date, category, amount')
        .gte('sale_date', start)
        .lte('sale_date', end)
      return data ?? []
    }
  })

  // ── Output GST: Hatch batches (chicks) ──────────────────────────
  const { data: hatchData, isLoading: hatchLoading } = useQuery({
    queryKey: ['gst_hatch', fy],
    queryFn: async () => {
      const { data } = await supabase
        .from('hatch_batches')
        .select('hatch_date, chick_amount')
        .gte('hatch_date', start)
        .lte('hatch_date', end)
      return data ?? []
    }
  })

  const isLoading = grnLoading || heLoading || nheLoading || hatchLoading

  // ── Build monthly summary ────────────────────────────────────────
  const monthlyRows = useMemo((): GstMonthRow[] => {
    const map: Record<string, GstMonthRow> = {}
    const get = (month: string): GstMonthRow => {
      if (!map[month]) map[month] = {
        month,
        input5: 0, input12: 0, input18: 0, inputTotal: 0,
        output0: 0, output5: 0, output12: 0, output18: 0, outputTotal: 0,
        netPayable: 0,
      }
      return map[month]
    }

    // Input: GRN
    for (const g of (grnData ?? [])) {
      const month = (g.grn_date as string).slice(0, 7)
      const gstAmt = (g.basic_amount ?? 0) * ((g.gst_pct ?? 0) / 100)
      const r = get(month)
      if (g.gst_pct === 5)       r.input5  += gstAmt
      else if (g.gst_pct === 12) r.input12 += gstAmt
      else if (g.gst_pct === 18) r.input18 += gstAmt
      else                       r.input5  += gstAmt // fallback unknown → 5%
      r.inputTotal += gstAmt
    }

    // Output: HE dispatch — 0% exempt
    for (const h of (heData ?? [])) {
      const month = (h.dispatch_date as string).slice(0, 7)
      const r = get(month)
      r.output0 += h.amount ?? 0
    }

    // Output: NHE sales
    for (const n of (nheData ?? [])) {
      const month = (n.sale_date as string).slice(0, 7)
      const rate = NHE_GST_RATES[n.category ?? 'other'] ?? 5
      const gstAmt = (n.amount ?? 0) * (rate / 100)
      const r = get(month)
      if (rate === 0)       r.output0  += n.amount ?? 0
      else if (rate === 5)  r.output5  += gstAmt
      else if (rate === 12) r.output12 += gstAmt
      else if (rate === 18) r.output18 += gstAmt
      r.outputTotal += gstAmt
    }

    // Output: Hatch batches — chicks 0% exempt
    for (const hb of (hatchData ?? [])) {
      const month = (hb.hatch_date as string).slice(0, 7)
      const r = get(month)
      r.output0 += hb.chick_amount ?? 0
    }

    // Compute net
    for (const r of Object.values(map)) {
      r.netPayable = r.outputTotal - r.inputTotal
    }

    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
  }, [grnData, heData, nheData, hatchData])

  // Apply month filter
  const filtered = useMemo(() => {
    if (!monthFilter) return monthlyRows
    return monthlyRows.filter(r => r.month.slice(5, 7) === monthFilter)
  }, [monthlyRows, monthFilter])

  const totals = useMemo(() => filtered.reduce((acc, r) => ({
    input5: acc.input5 + r.input5,
    input12: acc.input12 + r.input12,
    input18: acc.input18 + r.input18,
    inputTotal: acc.inputTotal + r.inputTotal,
    output0: acc.output0 + r.output0,
    output5: acc.output5 + r.output5,
    output12: acc.output12 + r.output12,
    output18: acc.output18 + r.output18,
    outputTotal: acc.outputTotal + r.outputTotal,
    netPayable: acc.netPayable + r.netPayable,
  }), { input5: 0, input12: 0, input18: 0, inputTotal: 0, output0: 0, output5: 0, output12: 0, output18: 0, outputTotal: 0, netPayable: 0 }), [filtered])

  const handleExport = () => {
    if (!filtered.length) return toast.error('No data to export')
    const rows = filtered.map(r => ({
      Month: monthLabel(r.month),
      'Input GST @5%': r.input5.toFixed(2),
      'Input GST @12%': r.input12.toFixed(2),
      'Input GST @18%': r.input18.toFixed(2),
      'Total Input GST': r.inputTotal.toFixed(2),
      'Input CGST': (r.inputTotal / 2).toFixed(2),
      'Input SGST': (r.inputTotal / 2).toFixed(2),
      'Output GST Exempt (Sales)': r.output0.toFixed(2),
      'Output GST @5%': r.output5.toFixed(2),
      'Output GST @12%': r.output12.toFixed(2),
      'Output GST @18%': r.output18.toFixed(2),
      'Total Output GST': r.outputTotal.toFixed(2),
      'Output CGST': (r.outputTotal / 2).toFixed(2),
      'Output SGST': (r.outputTotal / 2).toFixed(2),
      'Net GST Payable': r.netPayable.toFixed(2),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'GST Summary')
    XLSX.writeFile(wb, `GST_Summary_${fy}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader
        title="GST Summary Report"
        subtitle="Input GST (purchases) vs Output GST (sales) — Net payable estimate"
        action={
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleExport}>
            Export CSV
          </Button>
        }
      />

      {/* Disclaimer banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          <strong>Estimate only.</strong> This is an estimate based on standard GST rates for the poultry industry.
          GST on farm operating expenses is not tracked separately in this system. Verify all figures with your CA before filing GST returns.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <Select label="Financial Year" options={FY_OPTIONS} value={fy} onChange={e => setFy(e.target.value)} className="w-40" />
          <Select label="Month" options={MONTH_OPTIONS} value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="w-44" />
          {monthFilter && (
            <button className="text-xs text-brand-600 hover:underline mt-5" onClick={() => setMonthFilter('')}>Clear</button>
          )}
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center py-3">
          <div className="text-xs text-gray-500 font-medium">Total Input GST (Credit)</div>
          <div className="text-lg font-bold text-green-700 mt-1">{inr(totals.inputTotal)}</div>
          <div className="text-xs text-gray-400 mt-0.5">CGST {inr(totals.inputTotal / 2)} + SGST {inr(totals.inputTotal / 2)}</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-xs text-gray-500 font-medium">Total Output GST (Liability)</div>
          <div className="text-lg font-bold text-red-700 mt-1">{inr(totals.outputTotal)}</div>
          <div className="text-xs text-gray-400 mt-0.5">CGST {inr(totals.outputTotal / 2)} + SGST {inr(totals.outputTotal / 2)}</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-xs text-gray-500 font-medium">Exempt Sales (0% GST)</div>
          <div className="text-lg font-bold text-gray-700 mt-1">{inr(totals.output0)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Eggs, Chicks, HE dispatch</div>
        </Card>
        <Card className={`text-center py-3 ${totals.netPayable > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="text-xs text-gray-500 font-medium">Net GST Payable</div>
          <div className={`text-lg font-bold mt-1 ${totals.netPayable > 0 ? 'text-red-700' : 'text-green-700'}`}>
            {totals.netPayable >= 0 ? '' : '(Credit) '}{inr(Math.abs(totals.netPayable))}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {totals.netPayable > 0 ? 'Pay to Govt' : totals.netPayable < 0 ? 'Carry Forward' : 'Nil'}
          </div>
        </Card>
      </div>

      {/* Input GST Section */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-gray-800">Input GST — Purchases (Credit)</h3>
          <Badge color="green">ITC Eligible</Badge>
        </div>
        <div className="flex items-start gap-2 bg-blue-50 rounded p-2 mb-4">
          <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            Input GST is computed from GRN (Goods Receipt Notes) using the GST % recorded at the time of purchase.
            Operating expenses (electricity, salary, maintenance) GST is not tracked separately in this system.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Month</Th>
                <Th className="text-right">Taxable Value (est.)</Th>
                <Th className="text-right">@5% GST</Th>
                <Th className="text-right">@12% GST</Th>
                <Th className="text-right">@18% GST</Th>
                <Th className="text-right">Total GST</Th>
                <Th className="text-right">CGST</Th>
                <Th className="text-right">SGST</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={'inp-' + r.month} className="hover:bg-gray-50">
                  <Td className="font-medium text-sm">{monthLabel(r.month)}</Td>
                  <Td className="text-right text-sm text-gray-600">{inr(r.inputTotal > 0 ? r.inputTotal / 0.1 * 0.9 : 0)}</Td>
                  <Td className="text-right text-sm">{r.input5 > 0 ? inr(r.input5) : <span className="text-gray-300">—</span>}</Td>
                  <Td className="text-right text-sm">{r.input12 > 0 ? inr(r.input12) : <span className="text-gray-300">—</span>}</Td>
                  <Td className="text-right text-sm">{r.input18 > 0 ? inr(r.input18) : <span className="text-gray-300">—</span>}</Td>
                  <Td className="text-right text-sm font-semibold text-green-700">{inr(r.inputTotal)}</Td>
                  <Td className="text-right text-sm text-green-600">{inr(r.inputTotal / 2)}</Td>
                  <Td className="text-right text-sm text-green-600">{inr(r.inputTotal / 2)}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-green-50 font-semibold">
                <Td>TOTAL</Td>
                <Td className="text-right">—</Td>
                <Td className="text-right">{inr(totals.input5)}</Td>
                <Td className="text-right">{inr(totals.input12)}</Td>
                <Td className="text-right">{inr(totals.input18)}</Td>
                <Td className="text-right text-green-700">{inr(totals.inputTotal)}</Td>
                <Td className="text-right text-green-700">{inr(totals.inputTotal / 2)}</Td>
                <Td className="text-right text-green-700">{inr(totals.inputTotal / 2)}</Td>
              </tr>
            </tfoot>
          </Table>
        </div>
      </Card>

      {/* Output GST Section */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-gray-800">Output GST — Sales (Liability)</h3>
          <Badge color="red">GST Collected</Badge>
        </div>
        <div className="text-xs text-gray-500 mb-4 space-y-1">
          <p>• <strong>HE Eggs / NHE Eggs (je/te/be) / Poultry Chicks:</strong> Exempt (0% GST)</p>
          <p>• <strong>Culled / Weak / Lame Birds, Manure, Other:</strong> 5% GST</p>
          <p>• <strong>Gunny / Maize / Plastic Bags:</strong> 12% GST</p>
          <p>• <strong>Gas / LPG:</strong> 18% GST</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Month</Th>
                <Th className="text-right">Exempt Sales</Th>
                <Th className="text-right">@5% GST</Th>
                <Th className="text-right">@12% GST</Th>
                <Th className="text-right">@18% GST</Th>
                <Th className="text-right">Total GST</Th>
                <Th className="text-right">CGST</Th>
                <Th className="text-right">SGST</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={'out-' + r.month} className="hover:bg-gray-50">
                  <Td className="font-medium text-sm">{monthLabel(r.month)}</Td>
                  <Td className="text-right text-sm text-gray-500">{r.output0 > 0 ? inr(r.output0) : <span className="text-gray-300">—</span>}</Td>
                  <Td className="text-right text-sm">{r.output5 > 0 ? inr(r.output5) : <span className="text-gray-300">—</span>}</Td>
                  <Td className="text-right text-sm">{r.output12 > 0 ? inr(r.output12) : <span className="text-gray-300">—</span>}</Td>
                  <Td className="text-right text-sm">{r.output18 > 0 ? inr(r.output18) : <span className="text-gray-300">—</span>}</Td>
                  <Td className="text-right text-sm font-semibold text-red-700">{inr(r.outputTotal)}</Td>
                  <Td className="text-right text-sm text-red-600">{inr(r.outputTotal / 2)}</Td>
                  <Td className="text-right text-sm text-red-600">{inr(r.outputTotal / 2)}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-red-50 font-semibold">
                <Td>TOTAL</Td>
                <Td className="text-right text-gray-600">{inr(totals.output0)}</Td>
                <Td className="text-right">{inr(totals.output5)}</Td>
                <Td className="text-right">{inr(totals.output12)}</Td>
                <Td className="text-right">{inr(totals.output18)}</Td>
                <Td className="text-right text-red-700">{inr(totals.outputTotal)}</Td>
                <Td className="text-right text-red-700">{inr(totals.outputTotal / 2)}</Td>
                <Td className="text-right text-red-700">{inr(totals.outputTotal / 2)}</Td>
              </tr>
            </tfoot>
          </Table>
        </div>
      </Card>

      {/* Net GST Summary Table */}
      <Card>
        <h3 className="font-semibold text-gray-800 mb-3">Monthly Net GST Payable</h3>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Month</Th>
                <Th className="text-right">Input GST (Credit)</Th>
                <Th className="text-right">Output GST (Liability)</Th>
                <Th className="text-right">Net Payable</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={'net-' + r.month} className="hover:bg-gray-50">
                  <Td className="font-medium">{monthLabel(r.month)}</Td>
                  <Td className="text-right text-green-700 text-sm">{inr(r.inputTotal)}</Td>
                  <Td className="text-right text-red-700 text-sm">{inr(r.outputTotal)}</Td>
                  <Td className={`text-right font-semibold text-sm ${r.netPayable > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {inr(Math.abs(r.netPayable))}
                  </Td>
                  <Td>
                    {r.netPayable > 0
                      ? <Badge color="red">Pay ₹{Math.round(r.netPayable).toLocaleString('en-IN')}</Badge>
                      : r.netPayable < 0
                        ? <Badge color="green">Credit C/F</Badge>
                        : <Badge color="gray">Nil</Badge>
                    }
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <Td>FY Total</Td>
                <Td className="text-right text-green-700">{inr(totals.inputTotal)}</Td>
                <Td className="text-right text-red-700">{inr(totals.outputTotal)}</Td>
                <Td className={`text-right ${totals.netPayable > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {inr(Math.abs(totals.netPayable))}
                </Td>
                <Td>
                  {totals.netPayable > 0
                    ? <Badge color="red">Pay to Govt</Badge>
                    : totals.netPayable < 0
                      ? <Badge color="green">Carry Forward</Badge>
                      : <Badge color="gray">Nil</Badge>
                  }
                </Td>
              </tr>
            </tfoot>
          </Table>
        </div>
      </Card>
    </div>
  )
}
