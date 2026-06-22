import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { Card, CardHeader, Button, Table, Th, Td, Badge, Spinner } from '@/components/ui'
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

type ParsedRow = {
  date: string
  paymentType: string
  beneficiary: string
  bankName: string
  branch: string
  ifsc: string
  accountNo: string
  grossAmount: number
  tdsAmount: number
  payableAmount: number
  unit: string
  reference: string
  grnNo: string
  grnDate: string
  matchedPaymentId: string | null
  matchedVendor: string | null
  status: 'matched' | 'unmatched' | 'partial'
}

type UploadRecord = {
  id: string
  upload_date: string
  filename: string
  payment_date: string
  total_payments: number
  total_amount: number
  applied: boolean
  created_at: string
}

export const CMSUploadPage: React.FC = () => {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null)
  const [filename, setFilename] = useState('')
  const [applying, setApplying] = useState(false)

  const { data: pendingPayments } = useQuery({
    queryKey: ['pending_payments_for_cms'],
    queryFn: async () => {
      const { data } = await supabase.from('pending_payments')
        .select('id,vendor_name,invoice_amount,net_payable,grn_no,po_no,payment_status')
        .in('payment_status', ['Pending', 'HOLD'])
      return data ?? []
    }
  })

  const { data: kotakAccount } = useQuery({
    queryKey: ['kotak_account'],
    queryFn: async () => {
      const { data } = await supabase.from('bank_accounts')
        .select('id,bank_name').ilike('bank_name', '%kotak%').eq('is_active', true).limit(1)
      return data?.[0] ?? null
    }
  })

  const { data: uploadHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['cms_uploads'],
    queryFn: async () => {
      const { data } = await supabase.from('cms_uploads')
        .select('*').order('created_at', { ascending: false }).limit(30)
      return (data ?? []) as UploadRecord[]
    }
  })

  const parseFile = async (file: File) => {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array', cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

    // Find header row (contains 'NAME OF THE BENEFICIARY')
    const headerIdx = raw.findIndex(row =>
      row.some((c: any) => typeof c === 'string' && c.includes('BENEFICIARY'))
    )
    if (headerIdx < 0) { toast.error('Cannot find header row in CMS file'); return }

    const dataRows = raw.slice(headerIdx + 1).filter((row: any[]) =>
      row[3] && row[3] !== 'TOTAL AMOUNT' && row[0]
    )

    const rows: ParsedRow[] = dataRows.map((r: any[]) => {
      const dateVal = r[0]
      let dateStr = today()
      if (dateVal instanceof Date) dateStr = dateVal.toISOString().slice(0, 10)
      else if (typeof dateVal === 'string') dateStr = dateVal

      const grossAmt  = typeof r[8] === 'number' ? r[8] : parseFloat(r[8]) || 0
      const tdsAmt    = typeof r[9] === 'number' ? r[9] : parseFloat(r[9]) || 0
      const payable   = typeof r[10] === 'number' ? r[10] : (grossAmt - tdsAmt)
      const beneficiary = r[3]?.toString().trim() ?? ''

      // Try to match to pending_payments by vendor name
      const matched = (pendingPayments ?? []).find((p: any) =>
        p.vendor_name?.toLowerCase().trim() === beneficiary.toLowerCase()
      )

      const grnDateVal = r[14]
      let grnDateStr = ''
      if (grnDateVal instanceof Date) grnDateStr = grnDateVal.toISOString().slice(0, 10)
      else if (typeof grnDateVal === 'string' && grnDateVal !== '-') grnDateStr = grnDateVal

      return {
        date: dateStr,
        paymentType: r[1]?.toString() ?? 'NEFT',
        beneficiary,
        bankName: r[4]?.toString() ?? '',
        branch: r[5]?.toString() ?? '',
        ifsc: r[6]?.toString() ?? '',
        accountNo: r[7]?.toString() ?? '',
        grossAmount: grossAmt,
        tdsAmount: tdsAmt,
        payableAmount: payable,
        unit: r[11]?.toString() ?? '',
        reference: r[12]?.toString() ?? '',
        grnNo: r[13]?.toString() ?? '',
        grnDate: grnDateStr,
        matchedPaymentId: matched?.id ?? null,
        matchedVendor: matched?.vendor_name ?? null,
        status: matched ? 'matched' : 'unmatched',
      }
    })

    setParsed(rows)
    setFilename(file.name)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await parseFile(file)
    } catch (err: any) {
      toast.error('Failed to parse file: ' + err.message)
    }
    e.target.value = ''
  }

  const applyPayments = async () => {
    if (!parsed || !parsed.length) return
    setApplying(true)
    try {
      const paymentDate = parsed[0]?.date ?? today()
      const totalAmount = parsed.reduce((s, r) => s + r.payableAmount, 0)

      // 1. Save upload record
      const { data: uploadRec, error: upErr } = await supabase.from('cms_uploads').insert({
        upload_date: today(),
        filename,
        payment_date: paymentDate,
        total_payments: parsed.length,
        total_amount: totalAmount,
        applied: true,
      }).select('id').single()
      if (upErr) throw upErr

      // 2. Mark matched pending_payments as Paid
      const matchedIds = parsed.filter(r => r.matchedPaymentId).map(r => r.matchedPaymentId!)
      if (matchedIds.length > 0) {
        await supabase.from('pending_payments')
          .update({ payment_status: 'Paid', paid_date: paymentDate })
          .in('id', matchedIds)
      }

      // 3. Create bank_transactions (Debit) for each payment
      if (kotakAccount?.id) {
        const txns = parsed.map(r => ({
          bank_account_id: kotakAccount.id,
          txn_date: r.date,
          txn_type: 'Debit',
          category: 'Vendor Payment',
          reference_no: r.reference || r.grnNo || null,
          description: r.beneficiary,
          amount: r.payableAmount,
          linked_payment_id: r.matchedPaymentId ?? null,
        }))
        await supabase.from('bank_transactions').insert(txns)
      }

      qc.invalidateQueries({ queryKey: ['pending_payments_plan', 'pending_payments_for_cms', 'cms_uploads', 'kotak_balance'] })
      toast.success(`Applied ${parsed.length} payments — ${matchedIds.length} matched to pending payments`)
      setParsed(null)
      setFilename('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setApplying(false)
    }
  }

  const matchedCount   = (parsed ?? []).filter(r => r.status === 'matched').length
  const unmatchedCount = (parsed ?? []).filter(r => r.status === 'unmatched').length
  const totalPayable   = (parsed ?? []).reduce((s, r) => s + r.payableAmount, 0)

  return (
    <div className="space-y-4">
      <CardHeader
        title="CMS Upload"
        subtitle="Upload management-approved CMS payment Excel to mark payments as paid"
        action={
          <>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            <Button icon={<Upload size={16} />} onClick={() => fileRef.current?.click()}>
              Upload CMS Excel
            </Button>
          </>
        }
      />

      {/* Parsed preview */}
      {parsed && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">{filename}</h3>
              <div className="flex gap-3 mt-1 text-xs">
                <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12}/> {matchedCount} matched</span>
                <span className="text-orange-500 flex items-center gap-1"><AlertCircle size={12}/> {unmatchedCount} unmatched</span>
                <span className="text-gray-600 font-medium">Total: {inr(totalPayable)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setParsed(null); setFilename('') }}>Cancel</Button>
              <Button loading={applying} onClick={applyPayments}>
                Apply Payments
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th>Beneficiary</Th>
                <Th>Bank</Th>
                <Th>IFSC</Th>
                <Th>Account No</Th>
                <Th right>Gross</Th>
                <Th right>TDS</Th>
                <Th right>Payable</Th>
                <Th>Reference</Th>
                <Th>GRN</Th>
              </tr></thead>
              <tbody>
                {parsed.map((r, i) => (
                  <tr key={i} className={r.status === 'unmatched' ? 'bg-orange-50' : 'hover:bg-gray-50'}>
                    <Td>
                      {r.status === 'matched'
                        ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={12}/> Matched</span>
                        : <span className="flex items-center gap-1 text-orange-500 text-xs"><XCircle size={12}/> Unmatched</span>
                      }
                    </Td>
                    <Td className="text-xs">{fmtDate(r.date)}</Td>
                    <Td>
                      <span className="font-medium text-sm">{r.beneficiary}</span>
                      {r.matchedVendor && r.matchedVendor !== r.beneficiary && (
                        <span className="block text-xs text-gray-400">→ {r.matchedVendor}</span>
                      )}
                    </Td>
                    <Td className="text-xs">{r.bankName}</Td>
                    <Td className="text-xs font-mono">{r.ifsc}</Td>
                    <Td className="text-xs font-mono">{r.accountNo}</Td>
                    <Td right className="text-xs">{inr(r.grossAmount)}</Td>
                    <Td right className="text-xs text-orange-600">{r.tdsAmount > 0 ? inr(r.tdsAmount) : '—'}</Td>
                    <Td right className="font-semibold">{inr(r.payableAmount)}</Td>
                    <Td className="text-xs">{r.reference || '—'}</Td>
                    <Td className="text-xs">{r.grnNo || '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Upload history */}
      <Card padding={false}>
        <div className="px-4 py-2 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Upload History</h3>
        </div>
        {historyLoading ? <div className="p-6 text-center"><Spinner /></div> : (
          <Table>
            <thead><tr>
              <Th>Upload Date</Th>
              <Th>Filename</Th>
              <Th>Payment Date</Th>
              <Th right>Payments</Th>
              <Th right>Total Amount</Th>
              <Th>Status</Th>
            </tr></thead>
            <tbody>
              {(uploadHistory ?? []).map((u: UploadRecord) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <Td className="text-xs">{fmtDate(u.upload_date)}</Td>
                  <Td className="text-xs font-medium">{u.filename}</Td>
                  <Td className="text-xs">{fmtDate(u.payment_date)}</Td>
                  <Td right>{u.total_payments}</Td>
                  <Td right className="font-semibold">{inr(u.total_amount)}</Td>
                  <Td><Badge color={u.applied ? 'green' : 'gray'}>{u.applied ? 'Applied' : 'Preview'}</Badge></Td>
                </tr>
              ))}
              {!uploadHistory?.length && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No uploads yet</td></tr>
              )}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}
