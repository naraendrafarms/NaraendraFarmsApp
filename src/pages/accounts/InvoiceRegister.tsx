import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import {
  Card, CardHeader, Button, Input, Select, Badge,
  SectionHeader, Spinner, Table, Th, Td, StatCard
} from '@/components/ui'
import { Plus, Download, Edit2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const SOURCE_TYPES = [
  { value: 'chick',       label: 'Chick Supply' },
  { value: 'grn',         label: 'Feed / GRN' },
  { value: 'medicine',    label: 'Medicine' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'labour',      label: 'Labour / Contractor' },
  { value: 'other',       label: 'Other' },
]

const STATUS_COLOR: Record<string, string> = {
  unpaid:  'red',
  partial: 'yellow',
  paid:    'green',
}

const EMPTY = {
  invoice_no: '', invoice_date: today(), supplier_name: '',
  party_id: '', source_type: 'other', flock_id: '', grn_id: '',
  farm_id: '', basic_amount: '', gst_pct: '0', gst_amount: '',
  total_amount: '', payment_status: 'unpaid', paid_amount: '0',
  due_date: '', remarks: '',
}

export const InvoiceRegister: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [markPayId, setMarkPayId] = useState<string|null>(null)
  const [payAmt, setPayAmt] = useState('')
  const [delId, setDelId] = useState<string|null>(null)

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['supplier_invoices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('supplier_invoices')
        .select('*,party:parties(name),flock:flocks(flock_no),farm:farms(name)')
        .order('invoice_date', { ascending: false })
      return data ?? []
    }
  })

  const { data: parties } = useQuery({
    queryKey: ['parties_list'],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id,name,type').order('name')
      return data ?? []
    }
  })

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks').select('id,flock_no,status').order('flock_no')
      return data ?? []
    }
  })

  const { data: farms } = useQuery({
    queryKey: ['farms_list'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name').order('name')
      return data ?? []
    }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.invoice_no) throw new Error('Invoice No is required')
      if (!form.invoice_date) throw new Error('Invoice Date is required')
      if (!form.total_amount) throw new Error('Total Amount is required')
      const payload = {
        invoice_no:     form.invoice_no.trim(),
        invoice_date:   form.invoice_date,
        supplier_name:  form.supplier_name || null,
        party_id:       form.party_id || null,
        source_type:    form.source_type,
        flock_id:       form.flock_id || null,
        farm_id:        form.farm_id || null,
        basic_amount:   parseFloat(form.basic_amount) || null,
        gst_pct:        parseFloat(form.gst_pct) || 0,
        gst_amount:     parseFloat(form.gst_amount) || null,
        total_amount:   parseFloat(form.total_amount),
        payment_status: form.payment_status,
        paid_amount:    parseFloat(form.paid_amount) || 0,
        due_date:       form.due_date || null,
        remarks:        form.remarks || null,
      }
      if (editId) {
        const { error } = await supabase.from('supplier_invoices').update(payload).eq('id', editId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('supplier_invoices').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier_invoices'] })
      setForm({ ...EMPTY }); setEditId(null); setShowForm(false)
      toast.success(editId ? 'Invoice updated' : 'Invoice saved')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const markPaidMut = useMutation({
    mutationFn: async ({ id, amount, total }: { id: string; amount: number; total: number }) => {
      const status = amount >= total ? 'paid' : amount > 0 ? 'partial' : 'unpaid'
      const { error } = await supabase.from('supplier_invoices')
        .update({ paid_amount: amount, payment_status: status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier_invoices'] })
      setMarkPayId(null); setPayAmt('')
      toast.success('Payment updated')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('supplier_invoices').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier_invoices'] })
      setDelId(null); toast.success('Deleted')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const openEdit = (inv: any) => {
    setForm({
      invoice_no:     inv.invoice_no ?? '',
      invoice_date:   inv.invoice_date ?? '',
      supplier_name:  inv.supplier_name ?? '',
      party_id:       inv.party_id ?? '',
      source_type:    inv.source_type ?? 'other',
      flock_id:       inv.flock_id ?? '',
      grn_id:         inv.grn_id ?? '',
      farm_id:        inv.farm_id ?? '',
      basic_amount:   inv.basic_amount?.toString() ?? '',
      gst_pct:        inv.gst_pct?.toString() ?? '0',
      gst_amount:     inv.gst_amount?.toString() ?? '',
      total_amount:   inv.total_amount?.toString() ?? '',
      payment_status: inv.payment_status ?? 'unpaid',
      paid_amount:    inv.paid_amount?.toString() ?? '0',
      due_date:       inv.due_date ?? '',
      remarks:        inv.remarks ?? '',
    })
    setEditId(inv.id); setShowForm(true)
  }

  // Auto-compute GST amount when basic_amount or gst_pct changes
  const autoGst = () => {
    const basic = parseFloat(form.basic_amount) || 0
    const pct   = parseFloat(form.gst_pct) || 0
    const gst   = parseFloat(((basic * pct) / 100).toFixed(2))
    setForm(f => ({ ...f, gst_amount: gst.toString(), total_amount: (basic + gst).toString() }))
  }

  const filtered = (invoices ?? []).filter((inv: any) => {
    if (filterType   && inv.source_type    !== filterType)   return false
    if (filterStatus && inv.payment_status !== filterStatus) return false
    if (filterFrom   && inv.invoice_date   <  filterFrom)    return false
    if (filterTo     && inv.invoice_date   >  filterTo)      return false
    return true
  })

  const totalAmt    = filtered.reduce((s: number, i: any) => s + (i.total_amount ?? 0), 0)
  const totalPaid   = filtered.reduce((s: number, i: any) => s + (i.paid_amount  ?? 0), 0)
  const totalUnpaid = totalAmt - totalPaid
  const unpaidCount = filtered.filter((i: any) => i.payment_status !== 'paid').length

  const exportExcel = () => {
    const rows = filtered.map((i: any) => ({
      'Invoice No':     i.invoice_no,
      'Date':           i.invoice_date,
      'Supplier':       i.party?.name ?? i.supplier_name ?? '',
      'Type':           SOURCE_TYPES.find(t => t.value === i.source_type)?.label ?? i.source_type,
      'Flock':          i.flock ? `Flock ${i.flock.flock_no}` : '',
      'Farm':           i.farm?.name ?? '',
      'Basic Amt':      i.basic_amount ?? '',
      'GST%':           i.gst_pct ?? 0,
      'GST Amt':        i.gst_amount ?? '',
      'Total':          i.total_amount,
      'Paid':           i.paid_amount ?? 0,
      'Balance':        (i.total_amount ?? 0) - (i.paid_amount ?? 0),
      'Status':         i.payment_status,
      'Due Date':       i.due_date ?? '',
      'Remarks':        i.remarks ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices')
    XLSX.writeFile(wb, `invoice_register_${today()}.xlsx`)
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Invoice Register"
        subtitle="All supplier invoices — chick supply, feed, medicines and more"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={exportExcel}>Export</Button>
            <Button size="sm" icon={<Plus size={14}/>} onClick={() => { setForm({ ...EMPTY }); setEditId(null); setShowForm(true) }}>Add Invoice</Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Invoices" value={filtered.length.toString()} />
        <StatCard title="Total Value" value={inr(totalAmt)} />
        <StatCard title="Amount Paid" value={inr(totalPaid)} />
        <StatCard title="Pending Payment" value={inr(totalUnpaid)} subtitle={`${unpaidCount} invoices unpaid`} />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-40">
            <Select label="Type" placeholder="All Types"
              options={SOURCE_TYPES}
              value={filterType} onChange={e => setFilterType(e.target.value)} />
          </div>
          <div className="w-36">
            <Select label="Status" placeholder="All"
              options={['unpaid','partial','paid'].map(v => ({ value: v, label: v.charAt(0).toUpperCase()+v.slice(1) }))}
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)} />
          </div>
          <Input label="From" type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          <Input label="To" type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
          {(filterType || filterStatus || filterFrom || filterTo) && (
            <Button variant="outline" size="sm" onClick={() => { setFilterType(''); setFilterStatus(''); setFilterFrom(''); setFilterTo('') }}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Add / Edit Form */}
      {showForm && (
        <Card>
          <CardHeader title={editId ? 'Edit Invoice' : 'Record Invoice'} />
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Invoice No" required value={form.invoice_no}
                onChange={e => s('invoice_no', e.target.value)} />
              <Input label="Invoice Date" type="date" required value={form.invoice_date}
                onChange={e => s('invoice_date', e.target.value)} />
              <Select label="Invoice Type" required
                options={SOURCE_TYPES}
                value={form.source_type} onChange={e => s('source_type', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select label="Supplier (Party Master)" placeholder="— Select or type below —"
                options={(parties ?? []).map((p: any) => ({ value: p.id, label: p.name }))}
                value={form.party_id} onChange={e => s('party_id', e.target.value)} />
              <Input label="Supplier Name (free text)" placeholder="If not in party master"
                value={form.supplier_name} onChange={e => s('supplier_name', e.target.value)} />
            </div>

            {/* Contextual linking */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {(form.source_type === 'chick') && (
                <Select label="Link to Flock" placeholder="— Select flock —"
                  options={(flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no} (${f.status})` }))}
                  value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
              )}
              <Select label="Farm" placeholder="— Select farm —"
                options={(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))}
                value={form.farm_id} onChange={e => s('farm_id', e.target.value)} />
              <Input label="Due Date" type="date" value={form.due_date}
                onChange={e => s('due_date', e.target.value)} />
            </div>

            {/* Amounts */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount Details</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Input label="Basic Amount" type="number" step="0.01"
                  value={form.basic_amount} onChange={e => s('basic_amount', e.target.value)}
                  onBlur={autoGst} />
                <Input label="GST %" type="number" step="0.01"
                  value={form.gst_pct} onChange={e => s('gst_pct', e.target.value)}
                  onBlur={autoGst} />
                <Input label="GST Amount" type="number" step="0.01"
                  value={form.gst_amount} onChange={e => s('gst_amount', e.target.value)} />
                <Input label="Total Amount" type="number" step="0.01" required
                  value={form.total_amount} onChange={e => s('total_amount', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Select label="Payment Status"
                options={[
                  { value: 'unpaid',  label: 'Unpaid' },
                  { value: 'partial', label: 'Partial' },
                  { value: 'paid',    label: 'Paid' },
                ]}
                value={form.payment_status} onChange={e => s('payment_status', e.target.value)} />
              {form.payment_status !== 'unpaid' && (
                <Input label="Amount Paid" type="number" step="0.01"
                  value={form.paid_amount} onChange={e => s('paid_amount', e.target.value)} />
              )}
              <Input label="Remarks"
                value={form.remarks} onChange={e => s('remarks', e.target.value)} />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</Button>
              <Button size="sm" loading={saveMut.isPending} onClick={() => saveMut.mutate()}>
                {editId ? 'Update Invoice' : 'Save Invoice'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Invoice table */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-400 text-sm">
            No invoices found. Click "Add Invoice" to record your first invoice.
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Invoice No</Th>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Supplier</Th>
                  <Th>Linked To</Th>
                  <Th right>Total</Th>
                  <Th right>Paid</Th>
                  <Th right>Balance</Th>
                  <Th>Status</Th>
                  <Th>Due</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv: any) => {
                  const balance = (inv.total_amount ?? 0) - (inv.paid_amount ?? 0)
                  const isOverdue = inv.payment_status !== 'paid' && inv.due_date && inv.due_date < today()
                  return (
                    <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50 ${isOverdue ? 'bg-red-50/40' : ''}`}>
                      <Td>
                        <span className="font-medium text-gray-900">{inv.invoice_no}</span>
                      </Td>
                      <Td className="text-sm">{fmtDate(inv.invoice_date)}</Td>
                      <Td>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {SOURCE_TYPES.find(t => t.value === inv.source_type)?.label ?? inv.source_type}
                        </span>
                      </Td>
                      <Td className="text-sm">{inv.party?.name ?? inv.supplier_name ?? <span className="text-gray-300">—</span>}</Td>
                      <Td className="text-xs text-gray-500">
                        {inv.flock ? `Flock ${inv.flock.flock_no}` : ''}
                        {inv.farm?.name ? (inv.flock ? ` · ${inv.farm.name}` : inv.farm.name) : ''}
                        {!inv.flock && !inv.farm ? '—' : ''}
                      </Td>
                      <Td right className="font-medium">{inr(inv.total_amount)}</Td>
                      <Td right className="text-green-600">{inr(inv.paid_amount)}</Td>
                      <Td right className={balance > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>{inr(balance)}</Td>
                      <Td>
                        <Badge color={STATUS_COLOR[inv.payment_status] as any}>
                          {inv.payment_status}
                        </Badge>
                        {isOverdue && <span className="ml-1 text-xs text-red-500">Overdue</span>}
                      </Td>
                      <Td className="text-xs text-gray-400">{inv.due_date ? fmtDate(inv.due_date) : '—'}</Td>
                      <Td>
                        <div className="flex gap-2 items-center justify-end">
                          {inv.payment_status !== 'paid' && (
                            <button
                              onClick={() => { setMarkPayId(inv.id); setPayAmt(inv.total_amount?.toString() ?? '') }}
                              className="text-xs text-green-600 hover:underline whitespace-nowrap"
                              title="Mark payment"
                            >
                              <CheckCircle size={14} className="inline mr-0.5" />Pay
                            </button>
                          )}
                          <button onClick={() => openEdit(inv)} className="text-xs text-blue-600 hover:underline"><Edit2 size={13}/></button>
                          <button onClick={() => setDelId(inv.id)} className="text-xs text-red-500 hover:underline"><Trash2 size={13}/></button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-sm">
                  <td colSpan={5} className="px-3 py-2 text-gray-600">Total ({filtered.length} invoices)</td>
                  <td className="px-3 py-2 text-right">{inr(totalAmt)}</td>
                  <td className="px-3 py-2 text-right text-green-600">{inr(totalPaid)}</td>
                  <td className="px-3 py-2 text-right text-red-600">{inr(totalUnpaid)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </Card>
      )}

      {/* Mark Payment Modal */}
      {markPayId && (() => {
        const inv = (invoices ?? []).find((i: any) => i.id === markPayId)
        if (!inv) return null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-6 w-96">
              <p className="font-semibold text-gray-900 mb-1">Record Payment</p>
              <p className="text-sm text-gray-500 mb-1">Invoice: <strong>{inv.invoice_no}</strong></p>
              <p className="text-sm text-gray-500 mb-4">Total: <strong>{inr(inv.total_amount)}</strong></p>
              <Input label="Amount Paid" type="number" step="0.01"
                value={payAmt} onChange={e => setPayAmt(e.target.value)} />
              <div className="flex gap-3 justify-end mt-4">
                <Button variant="outline" size="sm" onClick={() => setMarkPayId(null)}>Cancel</Button>
                <Button size="sm" loading={markPaidMut.isPending}
                  onClick={() => markPaidMut.mutate({ id: markPayId, amount: parseFloat(payAmt)||0, total: inv.total_amount })}>
                  Save Payment
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Delete Confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80">
            <p className="font-semibold text-gray-900 mb-2">Delete invoice?</p>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDelId(null)}>Cancel</Button>
              <Button variant="danger" size="sm" loading={delMut.isPending} onClick={() => delMut.mutate(delId)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
