import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, fyRange, FY_OPTIONS } from '@/lib/utils'
import {
  Card, Input, Select, DateInput, Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState, StatCard,
} from '@/components/ui'
import { Users, FileText, AlertTriangle } from 'lucide-react'

// Vendor ledger built from every supplier bill (GRN-raised + manual). Pick a
// vendor to see all their bills, what's paid, and what's still outstanding.
export const VendorStatement: React.FC = () => {
  const [q, setQ] = useState('')
  const [vendor, setVendor] = useState<string | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [fy, setFy] = useState('')

  const applyFy = (v: string) => {
    setFy(v)
    if (v) { const r = fyRange(v); setFrom(r.start); setTo(r.end) }
  }

  const { data: summary, isLoading } = useQuery({
    queryKey: ['v_vendor_statement'],
    queryFn: async () => {
      const { data } = await supabase.from('v_vendor_statement').select('*').order('outstanding', { ascending: false })
      return data ?? []
    },
  })

  const { data: bills } = useQuery({
    queryKey: ['vendor_bills', vendor],
    enabled: !!vendor,
    queryFn: async () => {
      const { data } = await supabase.from('pending_payments').select('*')
        .eq('vendor_name', vendor).order('grn_date', { ascending: false })
      return data ?? []
    },
  })

  const filtered = (summary ?? []).filter((v: any) => !q || v.vendor_name?.toLowerCase().includes(q.toLowerCase()))
  const filteredBills = (bills ?? []).filter((b: any) => {
    const d = b.grn_date ?? b.invoice_date
    if (from && (!d || d < from)) return false
    if (to && (!d || d > to)) return false
    return true
  })
  const totals = (summary ?? []).reduce((a: any, v: any) => ({
    billed: a.billed + Number(v.total_billed || 0),
    paid: a.paid + Number(v.total_paid || 0),
    out: a.out + Number(v.outstanding || 0),
  }), { billed: 0, paid: 0, out: 0 })

  return (
    <div className="space-y-5">
      <SectionHeader title="Vendor Statements" subtitle="Supplier ledger — billed, paid and outstanding from every GRN & bill" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Billed" value={inr(totals.billed)} icon={<FileText size={18} />} />
        <StatCard title="Total Paid" value={inr(totals.paid)} icon={<Users size={18} />} color="text-green-600" />
        <StatCard title="Outstanding" value={inr(totals.out)} icon={<AlertTriangle size={18} />} color="text-red-600" />
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 items-end mb-3">
          <Input label="" placeholder="Search vendor…" value={q} onChange={e => setQ(e.target.value)} className="max-w-xs" />
          <div className="w-36">
            <Select label="Financial Year" placeholder="— FY —"
              options={FY_OPTIONS.map(f => ({ value: f, label: `FY ${f}` }))}
              value={fy} onChange={e => applyFy(e.target.value)} />
          </div>
          <DateInput label="From" value={from} onChange={e => { setFrom(e.target.value); setFy('') }} />
          <DateInput label="To" value={to} onChange={e => { setTo(e.target.value); setFy('') }} />
          {(from || to || fy) && (
            <button onClick={() => { setFrom(''); setTo(''); setFy('') }}
              className="text-sm text-gray-500 hover:text-gray-700 underline">Clear Dates</button>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-2">Date filter applies to the selected vendor's bills below.</p>
        {isLoading ? <Spinner /> : filtered.length === 0 ? <EmptyState title="No vendor bills yet" /> : (
          <Table>
            <thead><tr>{['Vendor', 'Bills', 'Billed', 'Paid', 'Outstanding', 'Last Bill'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {filtered.map((v: any) => (
                <tr key={v.vendor_name} className="border-t border-gray-100 cursor-pointer hover:bg-gray-50"
                  onClick={() => setVendor(vendor === v.vendor_name ? null : v.vendor_name)}>
                  <Td className="font-medium">{v.vendor_name}</Td>
                  <Td>{v.bill_count}</Td>
                  <Td>{inr(v.total_billed)}</Td>
                  <Td className="text-green-600">{inr(v.total_paid)}</Td>
                  <Td className={Number(v.outstanding) > 0 ? 'text-red-600 font-semibold' : ''}>{inr(v.outstanding)}</Td>
                  <Td>{v.last_bill_date ? fmtDate(v.last_bill_date) : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {vendor && (
        <Card>
          <p className="font-medium text-gray-700 mb-3">{vendor} — Bills</p>
          {(bills ?? []).length === 0 ? <Spinner /> : filteredBills.length === 0 ? <EmptyState title="No bills in selected date range" /> : (
            <Table>
              <thead><tr>{['GRN/Ref', 'Date', 'Invoice ₹', 'Status', 'Pay Before', 'Paid On'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {filteredBills.map((b: any) => (
                  <tr key={b.id} className="border-t border-gray-100">
                    <Td>{b.grn_no ?? '—'}</Td>
                    <Td>{fmtDate(b.grn_date ?? b.invoice_date)}</Td>
                    <Td>{b.invoice_amount != null ? inr(b.invoice_amount) : '—'}</Td>
                    <Td><Badge color={b.payment_status === 'Paid' ? 'green' : b.payment_status === 'HOLD' ? 'red' : 'yellow'}>{b.payment_status}</Badge></Td>
                    <Td>{b.pay_before_date ? fmtDate(b.pay_before_date) : '—'}</Td>
                    <Td>{b.paid_date ? fmtDate(b.paid_date) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  )
}
