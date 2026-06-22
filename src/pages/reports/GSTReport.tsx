import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import {
  Card, Select, SectionHeader, Spinner, Table, Th, Td, Badge, Button,
} from '@/components/ui'
import { Download, AlertTriangle, Info } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

const FY_OPTIONS = [
  { value: '2024-25', label: 'FY 2024-25' },
  { value: '2025-26', label: 'FY 2025-26' },
  { value: '2026-27', label: 'FY 2026-27' },
]
const MONTH_OPTIONS = [
  { value: '', label: 'All Months' },
  { value: '04', label: 'April' }, { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' }, { value: '09', label: 'September' },
  { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  { value: '01', label: 'January' }, { value: '02', label: 'February' }, { value: '03', label: 'March' },
]
const TABS = [
  { id: 'gstr1', label: 'GSTR-1 (Sales)' },
  { id: 'gstr3b', label: 'GSTR-3B' },
  { id: 'rcm', label: 'RCM Register' },
  { id: 'purchase', label: 'Purchase GST' },
] as const
type Tab = typeof TABS[number]['id']

function fyRange(fy: string) {
  const y = parseInt(fy.split('-')[0])
  return { start: `${y}-04-01`, end: `${y + 1}-03-31` }
}
const n = (v: any) => Number(v) || 0
function inMonth(dateStr: string, month: string) {
  return !month || (dateStr || '').slice(5, 7) === month
}

interface SaleRow {
  source: 'NHE' | 'HE'
  date: string
  invoice_no: string | null
  party: string
  buyer_gstin: string | null
  supply_type: string | null
  taxable: number
  gst_pct: number
  cgst: number
  sgst: number
  igst: number
  hsn: string | null
  desc: string
}
interface PurchaseRow {
  date: string
  invoice_no: string | null
  party_gstin: string | null
  vendor: string
  supply_type: string | null
  nature: string | null
  is_rcm: boolean
  taxable: number
  gst_pct: number
  cgst: number
  sgst: number
  igst: number
  item: string
}

export const GSTReportPage: React.FC = () => {
  const [fy, setFy] = useState('2026-27')
  const [month, setMonth] = useState('')
  const [tab, setTab] = useState<Tab>('gstr1')
  const { start, end } = fyRange(fy)

  const { data: nhe, isLoading: l1 } = useQuery({
    queryKey: ['gstr_nhe', fy],
    queryFn: async () => {
      const { data } = await supabase.from('nhe_sales')
        .select('sale_date,invoice_no,sale_type,amount,taxable_value,gst_pct,cgst_amount,sgst_amount,igst_amount,buyer_gstin,supply_type,hsn_code,parties(name)')
        .gte('sale_date', start).lte('sale_date', end)
      return data ?? []
    },
  })
  const { data: he, isLoading: l2 } = useQuery({
    queryKey: ['gstr_he', fy],
    queryFn: async () => {
      const { data } = await supabase.from('he_dispatch')
        .select('dispatch_date,invoice_no,amount,taxable_value,gst_pct,cgst_amount,sgst_amount,igst_amount,buyer_gstin,supply_type,hsn_code,parties(name)')
        .gte('dispatch_date', start).lte('dispatch_date', end)
      return data ?? []
    },
  })
  const { data: grn, isLoading: l3 } = useQuery({
    queryKey: ['gstr_grn', fy],
    queryFn: async () => {
      const { data } = await supabase.from('grn')
        .select('grn_date,invoice_no,item_name,basic_amount,gst_pct,gst_amount,cgst_amount,sgst_amount,igst_amount,supply_type,nature,is_rcm,party_gstin,parties(name)')
        .gte('grn_date', start).lte('grn_date', end)
      return data ?? []
    },
  })

  const isLoading = l1 || l2 || l3

  // ── Normalise sales ──
  const sales: SaleRow[] = useMemo(() => {
    const rows: SaleRow[] = []
    for (const r of (nhe ?? []) as any[]) {
      if (!inMonth(r.sale_date, month)) continue
      rows.push({
        source: 'NHE', date: r.sale_date, invoice_no: r.invoice_no,
        party: r.parties?.name ?? '—', buyer_gstin: r.buyer_gstin,
        supply_type: r.supply_type, taxable: n(r.taxable_value ?? r.amount),
        gst_pct: n(r.gst_pct), cgst: n(r.cgst_amount), sgst: n(r.sgst_amount), igst: n(r.igst_amount),
        hsn: r.hsn_code, desc: r.sale_type,
      })
    }
    for (const r of (he ?? []) as any[]) {
      if (!inMonth(r.dispatch_date, month)) continue
      rows.push({
        source: 'HE', date: r.dispatch_date, invoice_no: r.invoice_no,
        party: r.parties?.name ?? '—', buyer_gstin: r.buyer_gstin,
        supply_type: r.supply_type, taxable: n(r.taxable_value ?? r.amount),
        gst_pct: n(r.gst_pct), cgst: n(r.cgst_amount), sgst: n(r.sgst_amount), igst: n(r.igst_amount),
        hsn: r.hsn_code ?? '0407', desc: 'Hatching Eggs',
      })
    }
    return rows.sort((a, b) => a.date.localeCompare(b.date))
  }, [nhe, he, month])

  const purchases: PurchaseRow[] = useMemo(() => {
    const rows: PurchaseRow[] = []
    for (const r of (grn ?? []) as any[]) {
      if (!inMonth(r.grn_date, month)) continue
      rows.push({
        date: r.grn_date, invoice_no: r.invoice_no, party_gstin: r.party_gstin,
        vendor: r.parties?.name ?? '—', supply_type: r.supply_type, nature: r.nature,
        is_rcm: !!r.is_rcm, taxable: n(r.basic_amount), gst_pct: n(r.gst_pct),
        cgst: n(r.cgst_amount), sgst: n(r.sgst_amount), igst: n(r.igst_amount), item: r.item_name ?? '—',
      })
    }
    return rows.sort((a, b) => a.date.localeCompare(b.date))
  }, [grn, month])

  // ── GSTR-1 split ──
  const b2b = sales.filter(s => s.buyer_gstin && s.buyer_gstin.length === 15)
  const b2c = sales.filter(s => !(s.buyer_gstin && s.buyer_gstin.length === 15) && s.gst_pct > 0)
  const exemptSales = sales.filter(s => s.gst_pct === 0)
  const sum = (rows: SaleRow[], k: keyof SaleRow) => rows.reduce((a, r) => a + n(r[k]), 0)

  // HSN summary
  const hsnSummary = useMemo(() => {
    const m: Record<string, { hsn: string; taxable: number; cgst: number; sgst: number; igst: number }> = {}
    for (const s of sales) {
      const key = s.hsn || '0407'
      if (!m[key]) m[key] = { hsn: key, taxable: 0, cgst: 0, sgst: 0, igst: 0 }
      m[key].taxable += s.taxable; m[key].cgst += s.cgst; m[key].sgst += s.sgst; m[key].igst += s.igst
    }
    return Object.values(m).sort((a, b) => a.hsn.localeCompare(b.hsn))
  }, [sales])

  // ── GSTR-3B ──
  const outTaxable = sales.filter(s => s.gst_pct > 0)
  const out31a = { taxable: sum(outTaxable, 'taxable'), cgst: sum(outTaxable, 'cgst'), sgst: sum(outTaxable, 'sgst'), igst: sum(outTaxable, 'igst') }
  const out31c = sum(exemptSales, 'taxable')
  const rcmRows = purchases.filter(p => p.is_rcm)
  const rcm = { taxable: rcmRows.reduce((a, r) => a + r.taxable, 0), cgst: rcmRows.reduce((a, r) => a + r.cgst, 0), sgst: rcmRows.reduce((a, r) => a + r.sgst, 0), igst: rcmRows.reduce((a, r) => a + r.igst, 0) }
  const taxPayable = {
    cgst: out31a.cgst + rcm.cgst, sgst: out31a.sgst + rcm.sgst, igst: out31a.igst + rcm.igst,
  }

  // Purchase GST by rate (input — booked as expense, no ITC)
  const purchTax = { cgst: purchases.reduce((a, r) => a + r.cgst, 0), sgst: purchases.reduce((a, r) => a + r.sgst, 0), igst: purchases.reduce((a, r) => a + r.igst, 0) }

  const exportRows = (name: string, rows: any[]) => {
    if (!rows.length) return toast.error('No data to export')
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
    XLSX.writeFile(wb, `${name}_${fy}${month ? '_' + month : ''}.xlsx`)
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader title="GST Reports" subtitle="GSTR-1, GSTR-3B & RCM — from recorded invoice tax" />

      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          Figures are built from GST recorded on each invoice/GRN. Input GST is <strong>not claimed as ITC</strong> (booked to indirect expense).
          RCM tax (rent / notified vendors) is payable by us. Verify with your CA before filing.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <Select label="Financial Year" options={FY_OPTIONS} value={fy} onChange={e => setFy(e.target.value)} className="w-40" />
          <Select label="Month" options={MONTH_OPTIONS} value={month} onChange={e => setMonth(e.target.value)} className="w-40" />
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-gray-100 pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── GSTR-1 ── */}
      {tab === 'gstr1' && (
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">B2B — Registered Buyers</h3>
              <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => exportRows('GSTR1_B2B', b2b.map(s => ({
                'GSTIN': s.buyer_gstin, 'Buyer': s.party, 'Invoice': s.invoice_no, 'Date': s.date,
                'Taxable': s.taxable.toFixed(2), 'Rate%': s.gst_pct, 'CGST': s.cgst.toFixed(2), 'SGST': s.sgst.toFixed(2), 'IGST': s.igst.toFixed(2),
              })))}>Export</Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <thead><tr><Th>GSTIN</Th><Th>Buyer</Th><Th>Invoice</Th><Th>Date</Th><Th className="text-right">Taxable</Th><Th className="text-right">Rate</Th><Th className="text-right">CGST</Th><Th className="text-right">SGST</Th><Th className="text-right">IGST</Th></tr></thead>
                <tbody>
                  {b2b.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <Td className="font-mono text-xs">{s.buyer_gstin}</Td><Td className="text-sm">{s.party}</Td>
                      <Td className="text-sm">{s.invoice_no ?? '—'}</Td><Td className="text-sm">{s.date}</Td>
                      <Td className="text-right text-sm">{inr(s.taxable)}</Td><Td className="text-right text-sm">{s.gst_pct}%</Td>
                      <Td className="text-right text-sm">{inr(s.cgst)}</Td><Td className="text-right text-sm">{inr(s.sgst)}</Td><Td className="text-right text-sm">{inr(s.igst)}</Td>
                    </tr>
                  ))}
                  {b2b.length === 0 && <tr><Td colSpan={9} className="text-center text-gray-400 py-4 text-sm">No B2B invoices</Td></tr>}
                </tbody>
                {b2b.length > 0 && <tfoot><tr className="bg-gray-50 font-semibold"><Td colSpan={4}>TOTAL</Td><Td className="text-right">{inr(sum(b2b,'taxable'))}</Td><Td></Td><Td className="text-right">{inr(sum(b2b,'cgst'))}</Td><Td className="text-right">{inr(sum(b2b,'sgst'))}</Td><Td className="text-right">{inr(sum(b2b,'igst'))}</Td></tr></tfoot>}
              </Table>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-800 mb-3">B2C — Unregistered (taxable)</h3>
            <div className="overflow-x-auto">
              <Table>
                <thead><tr><Th>Buyer</Th><Th>Invoice</Th><Th>Date</Th><Th className="text-right">Taxable</Th><Th className="text-right">Rate</Th><Th className="text-right">CGST</Th><Th className="text-right">SGST</Th><Th className="text-right">IGST</Th></tr></thead>
                <tbody>
                  {b2c.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <Td className="text-sm">{s.party}</Td><Td className="text-sm">{s.invoice_no ?? '—'}</Td><Td className="text-sm">{s.date}</Td>
                      <Td className="text-right text-sm">{inr(s.taxable)}</Td><Td className="text-right text-sm">{s.gst_pct}%</Td>
                      <Td className="text-right text-sm">{inr(s.cgst)}</Td><Td className="text-right text-sm">{inr(s.sgst)}</Td><Td className="text-right text-sm">{inr(s.igst)}</Td>
                    </tr>
                  ))}
                  {b2c.length === 0 && <tr><Td colSpan={8} className="text-center text-gray-400 py-4 text-sm">No B2C taxable invoices</Td></tr>}
                </tbody>
              </Table>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="text-center py-4">
              <div className="text-xs text-gray-500 font-medium">Nil-rated / Exempt Sales (eggs, birds)</div>
              <div className="text-xl font-bold text-gray-700 mt-1">{inr(out31c)}</div>
              <div className="text-xs text-gray-400 mt-0.5">{exemptSales.length} invoices — 0% GST</div>
            </Card>
            <Card className="text-center py-4">
              <div className="text-xs text-gray-500 font-medium">Total Outward Tax (CGST+SGST+IGST)</div>
              <div className="text-xl font-bold text-red-700 mt-1">{inr(out31a.cgst + out31a.sgst + out31a.igst)}</div>
              <div className="text-xs text-gray-400 mt-0.5">on {outTaxable.length} taxable invoices</div>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">HSN Summary</h3>
              <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => exportRows('GSTR1_HSN', hsnSummary.map(h => ({
                'HSN': h.hsn, 'Taxable': h.taxable.toFixed(2), 'CGST': h.cgst.toFixed(2), 'SGST': h.sgst.toFixed(2), 'IGST': h.igst.toFixed(2),
              })))}>Export</Button>
            </div>
            <Table>
              <thead><tr><Th>HSN</Th><Th className="text-right">Taxable Value</Th><Th className="text-right">CGST</Th><Th className="text-right">SGST</Th><Th className="text-right">IGST</Th></tr></thead>
              <tbody>
                {hsnSummary.map((h, i) => (
                  <tr key={i} className="hover:bg-gray-50"><Td className="font-mono text-sm">{h.hsn}</Td><Td className="text-right text-sm">{inr(h.taxable)}</Td><Td className="text-right text-sm">{inr(h.cgst)}</Td><Td className="text-right text-sm">{inr(h.sgst)}</Td><Td className="text-right text-sm">{inr(h.igst)}</Td></tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ── GSTR-3B ── */}
      {tab === 'gstr3b' && (
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">GSTR-3B Summary</h3>
          <Table>
            <thead><tr><Th>Section</Th><Th className="text-right">Taxable Value</Th><Th className="text-right">CGST</Th><Th className="text-right">SGST</Th><Th className="text-right">IGST</Th></tr></thead>
            <tbody>
              <tr className="hover:bg-gray-50"><Td className="text-sm">3.1(a) Outward taxable supplies</Td><Td className="text-right text-sm">{inr(out31a.taxable)}</Td><Td className="text-right text-sm">{inr(out31a.cgst)}</Td><Td className="text-right text-sm">{inr(out31a.sgst)}</Td><Td className="text-right text-sm">{inr(out31a.igst)}</Td></tr>
              <tr className="hover:bg-gray-50"><Td className="text-sm">3.1(c) Nil-rated / exempt</Td><Td className="text-right text-sm">{inr(out31c)}</Td><Td className="text-right text-gray-300">—</Td><Td className="text-right text-gray-300">—</Td><Td className="text-right text-gray-300">—</Td></tr>
              <tr className="hover:bg-gray-50"><Td className="text-sm">3.1(d) Inward supplies (RCM) — liable to tax</Td><Td className="text-right text-sm">{inr(rcm.taxable)}</Td><Td className="text-right text-sm">{inr(rcm.cgst)}</Td><Td className="text-right text-sm">{inr(rcm.sgst)}</Td><Td className="text-right text-sm">{inr(rcm.igst)}</Td></tr>
            </tbody>
            <tfoot>
              <tr className="bg-red-50 font-bold"><Td>6.1 Total Tax Payable</Td><Td></Td><Td className="text-right text-red-700">{inr(taxPayable.cgst)}</Td><Td className="text-right text-red-700">{inr(taxPayable.sgst)}</Td><Td className="text-right text-red-700">{inr(taxPayable.igst)}</Td></tr>
            </tfoot>
          </Table>
          <div className="flex items-start gap-2 bg-blue-50 rounded p-2 mt-3">
            <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">Total payable = outward tax + RCM tax. No ITC is set off (input GST booked as expense). Table 4 ITC = 0.</p>
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => exportRows('GSTR3B', [
              { Section: '3.1(a) Outward taxable', Taxable: out31a.taxable.toFixed(2), CGST: out31a.cgst.toFixed(2), SGST: out31a.sgst.toFixed(2), IGST: out31a.igst.toFixed(2) },
              { Section: '3.1(c) Nil/Exempt', Taxable: out31c.toFixed(2), CGST: '', SGST: '', IGST: '' },
              { Section: '3.1(d) RCM liable', Taxable: rcm.taxable.toFixed(2), CGST: rcm.cgst.toFixed(2), SGST: rcm.sgst.toFixed(2), IGST: rcm.igst.toFixed(2) },
              { Section: '6.1 Tax Payable', Taxable: '', CGST: taxPayable.cgst.toFixed(2), SGST: taxPayable.sgst.toFixed(2), IGST: taxPayable.igst.toFixed(2) },
            ])}>Export GSTR-3B</Button>
          </div>
        </Card>
      )}

      {/* ── RCM Register ── */}
      {tab === 'rcm' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><h3 className="font-semibold text-gray-800">RCM Register</h3><Badge color="orange">You pay this tax</Badge></div>
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => exportRows('RCM_Register', rcmRows.map(r => ({
              Date: r.date, Vendor: r.vendor, GSTIN: r.party_gstin, Invoice: r.invoice_no, Item: r.item,
              Taxable: r.taxable.toFixed(2), 'Rate%': r.gst_pct, CGST: r.cgst.toFixed(2), SGST: r.sgst.toFixed(2), IGST: r.igst.toFixed(2),
            })))}>Export</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead><tr><Th>Date</Th><Th>Vendor</Th><Th>Invoice</Th><Th>Item</Th><Th className="text-right">Taxable</Th><Th className="text-right">Rate</Th><Th className="text-right">CGST</Th><Th className="text-right">SGST</Th><Th className="text-right">IGST</Th></tr></thead>
              <tbody>
                {rcmRows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <Td className="text-sm">{r.date}</Td><Td className="text-sm">{r.vendor}</Td><Td className="text-sm">{r.invoice_no ?? '—'}</Td><Td className="text-sm">{r.item}</Td>
                    <Td className="text-right text-sm">{inr(r.taxable)}</Td><Td className="text-right text-sm">{r.gst_pct}%</Td>
                    <Td className="text-right text-sm">{inr(r.cgst)}</Td><Td className="text-right text-sm">{inr(r.sgst)}</Td><Td className="text-right text-sm">{inr(r.igst)}</Td>
                  </tr>
                ))}
                {rcmRows.length === 0 && <tr><Td colSpan={9} className="text-center text-gray-400 py-4 text-sm">No RCM purchases — tick "Reverse Charge" on rent / unregistered vendor purchases</Td></tr>}
              </tbody>
              {rcmRows.length > 0 && <tfoot><tr className="bg-orange-50 font-semibold"><Td colSpan={4}>TOTAL</Td><Td className="text-right">{inr(rcm.taxable)}</Td><Td></Td><Td className="text-right">{inr(rcm.cgst)}</Td><Td className="text-right">{inr(rcm.sgst)}</Td><Td className="text-right">{inr(rcm.igst)}</Td></tr></tfoot>}
            </Table>
          </div>
        </Card>
      )}

      {/* ── Purchase GST (input, no ITC) ── */}
      {tab === 'purchase' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><h3 className="font-semibold text-gray-800">Purchase GST (Input)</h3><Badge color="gray">Booked as expense — no ITC</Badge></div>
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => exportRows('Purchase_GST', purchases.map(r => ({
              Date: r.date, Vendor: r.vendor, GSTIN: r.party_gstin, Invoice: r.invoice_no, Item: r.item, Nature: r.nature, RCM: r.is_rcm ? 'Yes' : 'No',
              Taxable: r.taxable.toFixed(2), 'Rate%': r.gst_pct, CGST: r.cgst.toFixed(2), SGST: r.sgst.toFixed(2), IGST: r.igst.toFixed(2),
            })))}>Export</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead><tr><Th>Date</Th><Th>Vendor</Th><Th>Item</Th><Th>Nature</Th><Th className="text-right">Taxable</Th><Th className="text-right">Rate</Th><Th className="text-right">CGST</Th><Th className="text-right">SGST</Th><Th className="text-right">IGST</Th></tr></thead>
              <tbody>
                {purchases.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <Td className="text-sm">{r.date}</Td><Td className="text-sm">{r.vendor}</Td><Td className="text-sm">{r.item}</Td>
                    <Td className="text-sm">{r.nature ?? '—'}{r.is_rcm && <Badge color="orange">RCM</Badge>}</Td>
                    <Td className="text-right text-sm">{inr(r.taxable)}</Td><Td className="text-right text-sm">{r.gst_pct}%</Td>
                    <Td className="text-right text-sm">{inr(r.cgst)}</Td><Td className="text-right text-sm">{inr(r.sgst)}</Td><Td className="text-right text-sm">{inr(r.igst)}</Td>
                  </tr>
                ))}
                {purchases.length === 0 && <tr><Td colSpan={9} className="text-center text-gray-400 py-4 text-sm">No purchases in period</Td></tr>}
              </tbody>
              {purchases.length > 0 && <tfoot><tr className="bg-gray-50 font-semibold"><Td colSpan={6}>TOTAL INPUT GST</Td><Td className="text-right">{inr(purchTax.cgst)}</Td><Td className="text-right">{inr(purchTax.sgst)}</Td><Td className="text-right">{inr(purchTax.igst)}</Td></tr></tfoot>}
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
