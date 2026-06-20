import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate } from '@/lib/utils'
import {
  Card, Input, Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState, StatCard,
} from '@/components/ui'
import { Users, FileText, AlertTriangle } from 'lucide-react'

// Vendor ledger built from every supplier bill (GRN-raised + manual). Pick a
// vendor to see all their bills, what's paid, and what's still outstanding.
export const VendorStatement: React.FC = () => {
  const [q, setQ] = useState('')
  const [vendor, setVendor] = useState<string | null>(null)

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
        <Input label="" placeholder="Search vendor…" value={q} onChange={e => setQ(e.target.value)} className="max-w-xs mb-3" />
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
          {(bills ?? []).length === 0 ? <Spinner /> : (
            <Table>
              <thead><tr>{['GRN/Ref', 'Date', 'Invoice ₹', 'Status', 'Pay Before', 'Paid On'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {(bills ?? []).map((b: any) => (
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
