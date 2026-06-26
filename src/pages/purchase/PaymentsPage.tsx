import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import {
  Card, CardHeader, Input, Select, FormRow, Modal,
  EmptyState, Spinner, Td, Th, StatCard, DateInput, Badge
} from '@/components/ui'
import { CheckCircle, Clock, AlertCircle, IndianRupee, Edit2, Trash2, Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['Pending', 'Paid', 'HOLD']
const PAY_MODE = ['Cash', 'NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque']

const STATUS_CLS: Record<string, string> = {
  Paid:    'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  HOLD:    'bg-red-100 text-red-700',
}

const emptyForm = () => ({
  vendor_name: '', invoice_no: '', invoice_date: today(), invoice_amount: '',
  tds_pct: '0', tds_amount: '0', net_payable: '',
  payment_status: 'Pending', paid_date: '', payment_mode: 'NEFT',
  utr_no: '', cheque_no: '', grn_no: '', po_no: '', pay_before_date: '',
  remarks: '', party_id: '',
})

export const PaymentsPage: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<any>(null)
  const [delId, setDelId]       = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [statusF, setStatusF]   = useState('')
  const [vendorF, setVendorF]   = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')
  const [form, setForm]         = useState(emptyForm())

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const { data: parties } = useQuery({
    queryKey: ['parties_supp'],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id,name').in('type', ['supplier', 'both']).order('name')
      return data ?? []
    }
  })

  const { data: payments, isLoading } = useQuery({
    queryKey: ['pending_payments'],
    queryFn: async () => {
      let all: any[] = [], from = 0
      while (true) {
        const { data } = await supabase.from('pending_payments')
          .select('*').order('invoice_date', { ascending: false }).range(from, from + 999)
        if (!data || data.length === 0) break
        all = all.concat(data)
        if (data.length < 1000) break
        from += 1000
      }
      return all
    }
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (payments ?? []).filter((p: any) => {
      if (statusF && p.payment_status !== statusF) return false
      if (vendorF && p.vendor_name !== vendorF) return false
      if (fromDate && (p.invoice_date ?? '') < fromDate) return false
      if (toDate   && (p.invoice_date ?? '') > toDate)   return false
      if (q && !`${p.vendor_name} ${p.invoice_no ?? ''} ${p.grn_no ?? ''} ${p.po_no ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [payments, statusF, vendorF, search, fromDate, toDate])

  const totals = useMemo(() => ({
    pending: (payments ?? []).filter((p: any) => p.payment_status === 'Pending').reduce((s: number, p: any) => s + (p.net_payable ?? p.invoice_amount ?? 0), 0),
    paid:    (payments ?? []).filter((p: any) => p.payment_status === 'Paid').reduce((s: number, p: any) => s + (p.net_payable ?? p.invoice_amount ?? 0), 0),
    hold:    (payments ?? []).filter((p: any) => p.payment_status === 'HOLD').reduce((s: number, p: any) => s + (p.net_payable ?? p.invoice_amount ?? 0), 0),
  }), [payments])

  const vendors = useMemo(() =>
    Array.from(new Set((payments ?? []).map((p: any) => p.vendor_name).filter(Boolean))).sort() as string[]
  , [payments])

  // Auto-calc tds_amount and net_payable
  const invoiceAmt = parseFloat(form.invoice_amount) || 0
  const tdsPct     = parseFloat(form.tds_pct) || 0
  const tdsAmt     = +(invoiceAmt * tdsPct / 100).toFixed(2)
  const netPayable = +(invoiceAmt - tdsAmt).toFixed(2)

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (p: any) => {
    setEditing(p)
    setForm({
      vendor_name: p.vendor_name ?? '', invoice_no: p.invoice_no ?? '',
      invoice_date: p.invoice_date ?? today(), invoice_amount: p.invoice_amount?.toString() ?? '',
      tds_pct: p.tds_pct?.toString() ?? '0', tds_amount: p.tds_amount?.toString() ?? '0',
      net_payable: p.net_payable?.toString() ?? '',
      payment_status: p.payment_status ?? 'Pending',
      paid_date: p.paid_date ?? '', payment_mode: p.payment_mode ?? 'NEFT',
      utr_no: p.utr_no ?? '', cheque_no: p.cheque_no ?? '',
      grn_no: p.grn_no ?? '', po_no: p.po_no ?? '',
      pay_before_date: p.pay_before_date ?? '', remarks: p.remarks ?? '',
      party_id: p.party_id ?? '',
    })
    setShowForm(true)
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.vendor_name) throw new Error('Vendor name required')
      if (!form.invoice_amount) throw new Error('Invoice amount required')

      const wasPaid = editing?.payment_status === 'Paid'
      const nowPaid = form.payment_status === 'Paid'
      const calcTds = tdsAmt
      const calcNet = parseFloat(form.net_payable) || netPayable

      const payload: any = {
        vendor_name:     form.vendor_name,
        invoice_no:      form.invoice_no || null,
        invoice_date:    form.invoice_date || null,
        invoice_amount:  invoiceAmt,
        tds_pct:         tdsPct,
        tds_amount:      parseFloat(form.tds_amount) || calcTds,
        net_payable:     calcNet,
        payment_status:  form.payment_status,
        paid_date:       nowPaid ? (form.paid_date || today()) : null,
        payment_mode:    form.payment_mode || null,
        utr_no:          form.utr_no || null,
        cheque_no:       form.cheque_no || null,
        grn_no:          form.grn_no || null,
        po_no:           form.po_no || null,
        pay_before_date: form.pay_before_date || null,
        remarks:         form.remarks || null,
        party_id:        form.party_id || null,
      }

      let savedId = editing?.id
      if (editing) {
        const { error } = await supabase.from('pending_payments').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { data: ins, error } = await supabase.from('pending_payments').insert(payload).select('id').single()
        if (error) throw error
        savedId = ins.id
      }

      // Auto cash book entry when marked as Paid
      if (nowPaid && !wasPaid && savedId) {
        // Remove any existing entry for this payment first
        await supabase.from('cash_book').delete().eq('pending_payment_id', savedId)

        const payMode = (form.payment_mode ?? 'NEFT').toLowerCase()
        const cbMode = payMode === 'cash' ? 'cash' : payMode === 'upi' ? 'upi' : 'cheque'

        await supabase.from('cash_book').insert({
          txn_date:           form.paid_date || today(),
          txn_type:           'payment',
          category:           'purchase_payment',
          description:        `Payment to ${form.vendor_name}${form.invoice_no ? ' — Inv ' + form.invoice_no : ''}${form.grn_no ? ' / GRN ' + form.grn_no : ''}`,
          party_name:         form.vendor_name,
          reference_no:       form.utr_no || form.cheque_no || form.invoice_no || null,
          amount_in:          0,
          amount_out:         calcNet,
          payment_mode:       cbMode,
          pending_payment_id: savedId,
          remarks:            form.remarks || null,
        })
      }

      // If changed from Paid back to Pending/HOLD — remove cash book entry
      if (wasPaid && !nowPaid && editing?.id) {
        await supabase.from('cash_book').delete().eq('pending_payment_id', editing.id)
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Payment updated!' : 'Payment added!')
      qc.invalidateQueries({ queryKey: ['pending_payments'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      setShowForm(false); setEditing(null); setForm(emptyForm())
    },
    onError: (e: any) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('cash_book').delete().eq('pending_payment_id', id)
      const { error } = await supabase.from('pending_payments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Deleted')
      qc.invalidateQueries({ queryKey: ['pending_payments'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      setDelId(null)
    },
    onError: (e: any) => toast.error(e.message),
  })

  const markPaid = async (p: any) => {
    const calcNet = p.net_payable ?? p.invoice_amount ?? 0
    const { error } = await supabase.from('pending_payments').update({
      payment_status: 'Paid', paid_date: today()
    }).eq('id', p.id)
    if (error) { toast.error(error.message); return }

    await supabase.from('cash_book').delete().eq('pending_payment_id', p.id)
    await supabase.from('cash_book').insert({
      txn_date:           today(),
      txn_type:           'payment',
      category:           'purchase_payment',
      description:        `Payment to ${p.vendor_name}${p.invoice_no ? ' — Inv ' + p.invoice_no : ''}${p.grn_no ? ' / GRN ' + p.grn_no : ''}`,
      party_name:         p.vendor_name,
      reference_no:       p.utr_no || p.cheque_no || p.invoice_no || null,
      amount_in:          0,
      amount_out:         calcNet,
      payment_mode:       'cheque',
      pending_payment_id: p.id,
    })
    qc.invalidateQueries({ queryKey: ['pending_payments'] })
    qc.invalidateQueries({ queryKey: ['cash_book'] })
    toast.success('Marked as Paid — Cash Book updated')
  }

  if (isLoading) return <Spinner />

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">Supplier payments — auto-syncs to Cash Book when marked Paid</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
          <Plus size={16}/> Add Payment
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Pending" value={inr(totals.pending)}
          icon={<Clock size={18}/>} color="text-yellow-600"
          subtitle={`${(payments ?? []).filter((p: any) => p.payment_status === 'Pending').length} bills`}/>
        <StatCard title="Paid" value={inr(totals.paid)}
          icon={<CheckCircle size={18}/>} color="text-green-600"
          subtitle={`${(payments ?? []).filter((p: any) => p.payment_status === 'Paid').length} bills`}/>
        <StatCard title="On Hold" value={inr(totals.hold)}
          icon={<AlertCircle size={18}/>} color="text-red-600"
          subtitle={`${(payments ?? []).filter((p: any) => p.payment_status === 'HOLD').length} bills`}/>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search vendor, invoice, GRN..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"/>
        </div>
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={vendorF} onChange={e => setVendorF(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 max-w-48">
          <option value="">All Vendors</option>
          {vendors.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <DateInput label="" value={fromDate} onChange={setFromDate} placeholder="From date"/>
        <DateInput label="" value={toDate} onChange={setToDate} placeholder="To date"/>
      </div>

      {/* Table */}
      <Card>
        {filtered.length === 0
          ? <EmptyState title="No payments found" icon={<IndianRupee size={32}/>}/>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <Th>Vendor</Th><Th>Invoice No</Th><Th>GRN No</Th>
                    <Th>Invoice Date</Th><Th>Pay Before</Th>
                    <Th className="text-right">Invoice Amt</Th>
                    <Th className="text-right">TDS</Th>
                    <Th className="text-right">Net Payable</Th>
                    <Th>Status</Th><Th>Paid Date</Th><Th>Mode</Th><Th>UTR/Cheque</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => {
                    const overdue = p.pay_before_date && p.payment_status !== 'Paid' && p.pay_before_date < today()
                    return (
                      <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}>
                        <Td className="font-medium">{p.vendor_name}</Td>
                        <Td className="text-gray-500 text-xs">{p.invoice_no ?? '—'}</Td>
                        <Td className="text-gray-500 text-xs">{p.grn_no ?? '—'}</Td>
                        <Td>{p.invoice_date ? fmtDate(p.invoice_date) : '—'}</Td>
                        <Td className={overdue ? 'text-red-600 font-medium' : ''}>
                          {p.pay_before_date ? fmtDate(p.pay_before_date) : '—'}
                        </Td>
                        <Td className="text-right">{p.invoice_amount != null ? inr(p.invoice_amount) : '—'}</Td>
                        <Td className="text-right text-gray-500">{p.tds_amount > 0 ? inr(p.tds_amount) : '—'}</Td>
                        <Td className="text-right font-semibold">{p.net_payable != null ? inr(p.net_payable) : (p.invoice_amount ? inr(p.invoice_amount) : '—')}</Td>
                        <Td>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[p.payment_status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {p.payment_status ?? '—'}
                          </span>
                        </Td>
                        <Td>{p.paid_date ? fmtDate(p.paid_date) : '—'}</Td>
                        <Td className="text-gray-500 text-xs">{p.payment_mode ?? '—'}</Td>
                        <Td className="text-gray-500 text-xs">{p.utr_no || p.cheque_no || '—'}</Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            {p.payment_status !== 'Paid' && (
                              <button onClick={() => markPaid(p)}
                                className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium whitespace-nowrap">
                                Mark Paid
                              </button>
                            )}
                            <button onClick={() => openEdit(p)} className="text-brand-600 hover:text-brand-800">
                              <Edit2 size={14}/>
                            </button>
                            <button onClick={() => setDelId(p.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold text-sm">
                    <Td colSpan={5}>Total ({filtered.length} bills)</Td>
                    <Td className="text-right">{inr(filtered.reduce((s: number, p: any) => s + (p.invoice_amount ?? 0), 0))}</Td>
                    <Td className="text-right text-gray-500">{inr(filtered.reduce((s: number, p: any) => s + (p.tds_amount ?? 0), 0))}</Td>
                    <Td className="text-right">{inr(filtered.reduce((s: number, p: any) => s + (p.net_payable ?? p.invoice_amount ?? 0), 0))}</Td>
                    <Td colSpan={5}/>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        }
      </Card>

      {/* Add / Edit Modal */}
      {showForm && (
        <Modal open={showForm} title={editing ? `Edit Payment — ${editing.vendor_name}` : 'Add Payment'}
          onClose={() => { setShowForm(false); setEditing(null); setForm(emptyForm()) }}>
          <div className="space-y-4">
            <FormRow>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor / Supplier <span className="text-red-500">*</span></label>
                <input list="vendors-list" value={form.vendor_name} onChange={f('vendor_name')}
                  placeholder="Type or select vendor"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"/>
                <datalist id="vendors-list">
                  {(parties ?? []).map((p: any) => <option key={p.id} value={p.name}/>)}
                </datalist>
              </div>
              <Input label="Invoice No" value={form.invoice_no} onChange={f('invoice_no')} placeholder="e.g. INV-001"/>
            </FormRow>
            <FormRow>
              <DateInput label="Invoice Date" value={form.invoice_date} onChange={v => setForm(p => ({ ...p, invoice_date: v }))}/>
              <DateInput label="Pay Before" value={form.pay_before_date} onChange={v => setForm(p => ({ ...p, pay_before_date: v }))}/>
            </FormRow>
            <FormRow>
              <Input label="GRN No" value={form.grn_no} onChange={f('grn_no')} placeholder="e.g. GRN-001"/>
              <Input label="PO No" value={form.po_no} onChange={f('po_no')} placeholder="e.g. PO-001"/>
            </FormRow>
            <FormRow>
              <Input label="Invoice Amount (₹)" required type="number" value={form.invoice_amount} onChange={f('invoice_amount')}/>
              <Input label="TDS %" type="number" value={form.tds_pct} onChange={f('tds_pct')} hint={`TDS: ${inr(tdsAmt)} | Net: ${inr(netPayable)}`}/>
            </FormRow>
            <FormRow>
              <Input label="Net Payable (₹)" type="number" value={form.net_payable || netPayable.toString()}
                onChange={f('net_payable')} hint="Auto = Invoice − TDS"/>
              <Select label="Payment Status" required
                options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                value={form.payment_status} onChange={f('payment_status')}/>
            </FormRow>
            {form.payment_status === 'Paid' && (
              <FormRow>
                <DateInput label="Paid Date" value={form.paid_date || today()} onChange={v => setForm(p => ({ ...p, paid_date: v }))}/>
                <Select label="Payment Mode"
                  options={PAY_MODE.map(m => ({ value: m, label: m }))}
                  value={form.payment_mode} onChange={f('payment_mode')}/>
              </FormRow>
            )}
            {form.payment_status === 'Paid' && (
              <FormRow>
                <Input label="UTR No" value={form.utr_no} onChange={f('utr_no')} placeholder="Online transfer ref"/>
                <Input label="Cheque No" value={form.cheque_no} onChange={f('cheque_no')}/>
              </FormRow>
            )}
            <Input label="Remarks" value={form.remarks} onChange={f('remarks')}/>
            {form.payment_status === 'Paid' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                ✓ Marking as Paid will automatically create a Cash Book entry (payment side)
              </div>
            )}
            <div className="flex gap-3 justify-end pt-2 border-t">
              <button onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {saveMut.isPending ? 'Saving...' : editing ? 'Update' : 'Save Payment'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {delId && (
        <Modal open={!!delId} title="Delete Payment?" onClose={() => setDelId(null)}>
          <p className="text-sm text-gray-600 mb-4">This will also remove the Cash Book entry if payment was marked Paid.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDelId(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            <button onClick={() => deleteMut.mutate(delId!)} disabled={deleteMut.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
              {deleteMut.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
