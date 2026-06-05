import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtMonth } from '@/lib/utils'
import {
  Card, CardHeader, Button, Input, Select, FormRow, Modal,
  Table, Th, Td, SectionHeader, Spinner, EmptyState
} from '@/components/ui'
import { Plus, Zap, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

export const ElectricityEntry: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [filterMonth, setFilterMonth] = useState('')

  const { data: meters } = useQuery({
    queryKey: ['meters'],
    queryFn: async () => {
      const { data } = await supabase
        .from('electricity_meters')
        .select('*, farms(name, code)')
        .eq('is_active', true)
        .order('meter_name')
      return data ?? []
    }
  })

  const { data: bills, isLoading } = useQuery({
    queryKey: ['elec_bills', filterMonth],
    queryFn: async () => {
      let q = supabase
        .from('electricity_bills')
        .select('*, electricity_meters(meter_name, usc_no, farms(name))')
        .order('bill_month', { ascending: false })
        .limit(100)
      if (filterMonth) q = q.eq('bill_month', filterMonth + '-01')
      const { data } = await q
      return data ?? []
    }
  })

  const [form, setForm] = useState({
    meter_id: '', bill_month: '', units_consumed: '', amount: '',
    acd_dc_due: '0', deposit_amount: '0', paid_date: '', remarks: ''
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openForm = (bill?: any) => {
    if (bill) {
      setEditing(bill)
      setForm({
        meter_id:       bill.meter_id,
        bill_month:     bill.bill_month?.slice(0,7),
        units_consumed: bill.units_consumed?.toString() ?? '',
        amount:         bill.amount?.toString() ?? '',
        acd_dc_due:     bill.acd_dc_due?.toString() ?? '0',
        deposit_amount: bill.deposit_amount?.toString() ?? '0',
        paid_date:      bill.paid_date ?? '',
        remarks:        bill.remarks ?? ''
      })
    } else {
      setEditing(null)
      setForm({ meter_id:'', bill_month:'', units_consumed:'', amount:'', acd_dc_due:'0', deposit_amount:'0', paid_date:'', remarks:'' })
    }
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        meter_id:       form.meter_id,
        bill_month:     form.bill_month + '-01',
        units_consumed: parseInt(form.units_consumed) || null,
        amount:         parseFloat(form.amount),
        acd_dc_due:     parseFloat(form.acd_dc_due) || 0,
        deposit_amount: parseFloat(form.deposit_amount) || 0,
        paid_date:      form.paid_date || null,
        remarks:        form.remarks || null,
      }
      if (!payload.meter_id || !payload.bill_month || !payload.amount) throw new Error('Meter, month and amount required')
      if (editing) {
        const { error } = await supabase.from('electricity_bills').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('electricity_bills').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Bill updated!' : 'Bill saved!')
      qc.invalidateQueries({ queryKey: ['elec_bills'] })
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const meterOptions = meters?.map((m: any) => ({
    value: m.id,
    label: `${m.meter_name} (USC: ${m.usc_no}) — ${m.farms?.name}`
  })) ?? []

  // Summary
  const totalThisMonth = bills?.filter((b:any) => b.bill_month?.slice(0,7) === filterMonth)
    .reduce((s:number,b:any) => s+b.amount, 0)

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Electricity Bills"
        subtitle="Enter and manage electricity bills for all meters"
        action={<Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Bill</Button>}
      />

      {/* Meter summary cards */}
      {meters && meters.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {meters.map((m: any) => {
            const latestBill = bills?.find((b:any) => b.meter_id === m.id)
            return (
              <Card key={m.id} className="!p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-orange-500" />
                  <span className="text-xs font-medium text-gray-600 truncate">{m.meter_name}</span>
                </div>
                <p className="text-xs text-gray-400">USC: {m.usc_no}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {latestBill ? inr(latestBill.amount) : '—'}
                </p>
                <p className="text-xs text-gray-400">{latestBill ? fmtMonth(latestBill.bill_month) : 'No bills'}</p>
              </Card>
            )
          })}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Input label="" type="month" value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="w-48" placeholder="Filter by month" />
        {filterMonth && <Button variant="ghost" size="sm" onClick={() => setFilterMonth('')}>Clear</Button>}
        {filterMonth && bills && (
          <span className="text-sm text-gray-500">
            Total for {fmtMonth(filterMonth+'-01')}: <strong>{inr(totalThisMonth ?? 0)}</strong>
          </span>
        )}
      </div>

      {isLoading ? <Spinner/> : (
        <Card padding={false}>
          <Table>
            <thead>
              <tr>
                <Th>Meter / Site</Th>
                <Th>USC No</Th>
                <Th>Month</Th>
                <Th right>Units</Th>
                <Th right>Amount</Th>
                <Th right>ACD/DC Due</Th>
                <Th right>Deposit</Th>
                <Th>Paid Date</Th>
                <Th>Remarks</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {bills?.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <Td><span className="font-medium text-sm">{b.electricity_meters?.meter_name}</span></Td>
                  <Td className="text-xs text-gray-400">{b.electricity_meters?.usc_no}</Td>
                  <Td>{fmtMonth(b.bill_month)}</Td>
                  <Td right>{b.units_consumed?.toLocaleString('en-IN') ?? '—'}</Td>
                  <Td right><span className="font-semibold">{inr(b.amount)}</span></Td>
                  <Td right>{b.acd_dc_due > 0 ? inr(b.acd_dc_due) : '—'}</Td>
                  <Td right>{b.deposit_amount > 0 ? inr(b.deposit_amount) : '—'}</Td>
                  <Td className="text-xs">{b.paid_date ?? '—'}</Td>
                  <Td className="text-xs text-gray-400 max-w-xs truncate">{b.remarks ?? ''}</Td>
                  <Td>
                    <button onClick={() => openForm(b)}
                      className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors">
                      <Edit2 size={13}/>
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
            {bills && bills.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50">
                  <Td colSpan={4}><strong>TOTAL</strong></Td>
                  <Td right><strong>{inr(bills.reduce((s:number,b:any)=>s+b.amount,0))}</strong></Td>
                  <Td right><strong>{inr(bills.reduce((s:number,b:any)=>s+(b.acd_dc_due||0),0))}</strong></Td>
                  <Td colSpan={4}/>
                </tr>
              </tfoot>
            )}
          </Table>
          {bills?.length === 0 && (
            <EmptyState icon={<Zap size={32}/>} title="No bills entered yet"
              action={<Button onClick={()=>openForm()} icon={<Plus size={16}/>}>Add Bill</Button>}
            />
          )}
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editing ? 'Edit Electricity Bill' : 'Add Electricity Bill'} size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button loading={mut.isPending} onClick={() => mut.mutate()}>
              {editing ? 'Update' : 'Save'}
            </Button>
          </>
        }>
        <div className="space-y-4">
          <Select label="Meter / Site" required placeholder="— Select meter —"
            options={meterOptions} value={form.meter_id}
            onChange={e => set('meter_id', e.target.value)} />
          <FormRow>
            <Input label="Bill Month" required type="month"
              value={form.bill_month} onChange={e => set('bill_month', e.target.value)} />
            <Input label="Amount (Rs)" required type="number" step="0.01"
              value={form.amount} onChange={e => set('amount', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Units Consumed" type="number"
              value={form.units_consumed} onChange={e => set('units_consumed', e.target.value)} />
            <Input label="ACD/DC Due" type="number" step="0.01"
              value={form.acd_dc_due} onChange={e => set('acd_dc_due', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Deposit Amount" type="number" step="0.01"
              value={form.deposit_amount} onChange={e => set('deposit_amount', e.target.value)} />
            <Input label="Paid Date" type="date"
              value={form.paid_date} onChange={e => set('paid_date', e.target.value)} />
          </FormRow>
          <Input label="Remarks"
            value={form.remarks} onChange={e => set('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
