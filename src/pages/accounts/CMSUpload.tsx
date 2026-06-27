import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { Card, CardHeader, Button, DateInput, Table, Th, Td, Badge, Spinner } from '@/components/ui'
import { Download, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const COMPANY_NAME = 'Naraendra Farms'
const COMPANY_ADDR1 = '5-9-22/21 , JVR Amrit Enclave, Roshanlal Residency ,'
const COMPANY_ADDR2 = 'Adarsh Nagar , Hyderabad - 500063'

export const CMSUploadPage: React.FC = () => {
  const [paymentDate, setPaymentDate] = useState(today())
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // All pending payments with vendor bank details
  const { data: payments, isLoading } = useQuery({
    queryKey: ['cms_pending_payments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pending_payments')
        .select('*')
        .or('payment_status.in.(Pending,HOLD),payment_status.is.null')
        .order('pay_before_date', { ascending: true })
      return data ?? []
    }
  })

  // Vendor + partner bank details fallback map (by name)
  const { data: partiesMap } = useQuery({
    queryKey: ['parties_bank_map'],
    queryFn: async () => {
      const map: Record<string, any> = {}
      const { data: parties } = await supabase.from('parties')
        .select('name,bank_name,branch,ifsc,account_no')
      for (const p of (parties ?? [])) map[p.name] = p
      // Partners (remuneration) — merge so partner CMS rows resolve bank details
      const { data: partners } = await supabase.from('partners')
        .select('name,bank_name,branch,ifsc,account_no')
      for (const p of (partners ?? [])) map[p.name] = p
      return map
    }
  })

  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const selectAll = () =>
    setSelected(selected.size === (payments?.length ?? 0) ? new Set() : new Set((payments ?? []).map((p: any) => p.id)))

  const selectedPayments = useMemo(() =>
    (payments ?? []).filter((p: any) => selected.has(p.id)), [payments, selected])

  const totalSelected = selectedPayments.reduce((s: number, p: any) => s + (p.net_payable ?? p.invoice_amount ?? 0), 0)

  const downloadCMS = () => {
    if (!selectedPayments.length) { toast.error('Select at least one vendor to include'); return }

    const wb = XLSX.utils.book_new()
    const rows: any[][] = [
      [COMPANY_NAME],
      [COMPANY_ADDR1],
      [COMPANY_ADDR2],
      ['Request for RTGS & NEFT Transfer'],
      ['Remitter Account :', '', '', '            '],
      [
        'DATE', 'PYMT TYPE', '', 'NAME OF THE BENEFICIARY',
        'BENEFICIARY BANK NAME', 'BRANCH NAME', 'BRANCH IFSC',
        'CA/SB BANK ACC NO', 'AMOUNT RS.', 'DISCOUNT/OTHER DEDUCTION',
        'PAYABLE AMOUNT', 'UNIT/ BRANCH', 'PAYMENT REFERENCES', 'GRN NO', 'GRN DATE',
      ],
    ]

    for (const p of selectedPayments) {
      const party = p.parties ?? partiesMap?.[p.vendor_name] ?? {}
      const grossAmt = p.invoice_amount ?? 0
      const tdsAmt   = p.tds_amount ?? 0
      const discAmt  = p.discount_amount ?? 0
      const payable  = p.net_payable ?? (grossAmt - tdsAmt - discAmt)
      rows.push([
        new Date(paymentDate),
        p.payment_type ?? 'NEFT',
        '',
        p.vendor_name,
        party.bank_name ?? '',
        party.branch ?? '',
        party.ifsc ?? '',
        party.account_no ?? '',
        grossAmt,
        tdsAmt + discAmt,
        payable,
        p.po_raised_by ?? 'Hyderabad',
        p.invoice_no ?? p.po_no ?? '',
        p.grn_no ?? '-',
        p.grn_date ? new Date(p.grn_date) : '-',
      ])
    }

    // Totals row
    const firstData = 7
    const lastData  = firstData + selectedPayments.length - 1
    rows.push([
      '', '', '', 'TOTAL AMOUNT', '', '', '', '',
      { f: `SUM(I${firstData}:I${lastData})` },
      { f: `SUM(J${firstData}:J${lastData})` },
      { f: `SUM(K${firstData}:K${lastData})` },
      '', '', '', '',
    ])

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [
      {wch:12},{wch:10},{wch:2},{wch:30},{wch:22},{wch:18},{wch:14},
      {wch:20},{wch:14},{wch:20},{wch:14},{wch:14},{wch:22},{wch:10},{wch:12},
    ]
    // Format date column
    for (let i = 0; i < selectedPayments.length; i++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 6 + i, c: 0 })]
      if (cell) cell.t = 'd'
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `CMS_${paymentDate.replace(/-/g, '')}.xlsx`)
    toast.success(`CMS file downloaded — ${selectedPayments.length} payments, ${inr(totalSelected)}`)
  }

  return (
    <div className="space-y-4">
      <CardHeader
        title="Generate CMS File"
        subtitle="Select vendors, choose payment date, download bank CMS file for submission"
        action={
          <div className="flex items-center gap-3">
            <DateInput value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
            <Button
              icon={<Download size={16} />}
              onClick={downloadCMS}
              disabled={selected.size === 0}
            >
              Download CMS ({selected.size})
            </Button>
          </div>
        }
      />

      {selected.size > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-lg px-4 py-2 text-sm text-brand-800 flex items-center gap-2">
          <FileSpreadsheet size={16} />
          <span><strong>{selected.size}</strong> vendor(s) selected — Total payable: <strong>{inr(totalSelected)}</strong></span>
        </div>
      )}

      <Card padding={false}>
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Pending Payments</h3>
          <Button variant="outline" size="sm" onClick={selectAll}>
            {selected.size === (payments?.length ?? 0) ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th></Th>
                  <Th>Vendor</Th>
                  <Th>Bank</Th>
                  <Th>IFSC</Th>
                  <Th>Account No</Th>
                  <Th>Invoice / GRN</Th>
                  <Th right>Gross Amt</Th>
                  <Th right>TDS / Disc</Th>
                  <Th right>Net Payable</Th>
                  <Th>Due Date</Th>
                  <Th>Type</Th>
                </tr>
              </thead>
              <tbody>
                {(payments ?? []).map((p: any) => {
                  const isSelected = selected.has(p.id)
                  const party = p.parties ?? partiesMap?.[p.vendor_name] ?? {}
                  const tdsDisc = (p.tds_amount ?? 0) + (p.discount_amount ?? 0)
                  const isOD = p.pay_before_date && p.pay_before_date < today()
                  return (
                    <tr key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-brand-50 border-l-2 border-brand-500' : 'hover:bg-gray-50'}`}
                    >
                      <Td>
                        <input type="checkbox" checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          onClick={e => e.stopPropagation()}
                          className="rounded border-gray-300 text-brand-600" />
                      </Td>
                      <Td>
                        <span className="font-medium text-sm">{p.vendor_name}</span>
                      </Td>
                      <Td className="text-xs text-gray-600">{party.bank_name ?? <span className="text-red-400">No bank</span>}</Td>
                      <Td className="text-xs font-mono">{party.ifsc ?? '—'}</Td>
                      <Td className="text-xs font-mono">{party.account_no ?? '—'}</Td>
                      <Td className="text-xs">{p.invoice_no ?? p.grn_no ?? p.po_no ?? '—'}</Td>
                      <Td right>{p.invoice_amount ? inr(p.invoice_amount) : '—'}</Td>
                      <Td right className="text-xs text-orange-600">{tdsDisc > 0 ? inr(tdsDisc) : '—'}</Td>
                      <Td right className="font-semibold">{inr(p.net_payable ?? p.invoice_amount ?? 0)}</Td>
                      <Td>
                        <span className={`text-xs ${isOD ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {p.pay_before_date ? fmtDate(p.pay_before_date) : '—'}{isOD && ' ⚠️'}
                        </span>
                      </Td>
                      <Td><Badge color="blue">{p.payment_type ?? 'NEFT'}</Badge></Td>
                    </tr>
                  )
                })}
                {!(payments?.length) && (
                  <tr><td colSpan={11} className="text-center py-8 text-gray-400 text-sm">No pending payments</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
