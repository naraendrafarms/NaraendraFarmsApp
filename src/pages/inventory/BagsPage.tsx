import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, exportCSV, today } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td,
  SectionHeader, Spinner, EmptyState, DateInput,
} from '@/components/ui'
import { Plus, Trash2, Download, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = ['Bags Sold', 'Balance'] as const

export const BagsPage: React.FC = () => {
  const [tab, setTab] = useState<typeof TABS[number]>('Bags Sold')
  const { data: farms = [] } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').eq('is_active', true).order('name'); return data ?? [] }
  })
  return (
    <div className="space-y-5">
      <SectionHeader title="Empty Bags" subtitle="Received count comes automatically from GRN — this tracks scrap sales and running balance" />
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Bags Sold' && <BagsSoldTab farms={farms} />}
      {tab === 'Balance' && <BalanceTab farms={farms} />}
    </div>
  )
}

const BagsSoldTab: React.FC<{ farms: any[] }> = ({ farms }) => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const blank = { sale_date: today(), farm_id: '', buyer_name: '', qty: '', rate: '', remarks: '' }
  const [form, setForm] = useState(blank)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['bag_sales'],
    queryFn: async () => { const { data } = await supabase.from('bag_sales').select('*, farms(name)').order('sale_date', { ascending: false }); return data ?? [] }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const qty = parseInt(form.qty) || 0, rate = parseFloat(form.rate) || 0
      if (!qty) throw new Error('Enter qty')
      const { data: sale, error } = await supabase.from('bag_sales').insert({
        sale_date: form.sale_date, farm_id: form.farm_id || null, buyer_name: form.buyer_name || null,
        qty, rate: rate || null, amount: qty * rate || null, remarks: form.remarks || null,
      }).select('id').single()
      if (error) throw error
      // Auto-post to Cash Book, same pattern as NHE sales / HE dispatch
      if (qty * rate > 0) {
        const { error: cbErr } = await supabase.from('cash_book').insert({
          txn_date: form.sale_date, txn_type: 'receipt', category: 'other',
          description: `Empty bags sold${form.buyer_name ? ` to ${form.buyer_name}` : ''} (${qty} bags)`,
          party_name: form.buyer_name || null, farm_id: form.farm_id || null,
          amount_in: qty * rate, amount_out: 0, payment_mode: 'cash', bag_sale_id: sale.id,
        })
        if (cbErr) throw new Error('Sale saved, but Cash Book entry failed: ' + cbErr.message)
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bag_sales'] }); qc.invalidateQueries({ queryKey: ['cash_book'] }); setShowForm(false); setForm(blank); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })
  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('bag_sales').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bag_sales'] }); qc.invalidateQueries({ queryKey: ['cash_book'] }); toast.success('Deleted') },
  })

  const totalQty = sales.reduce((s: number, r: any) => s + (r.qty || 0), 0)
  const totalAmt = sales.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0)

  const exportRows = () => exportCSV(`bag_sales_${today()}.csv`, ['Date', 'Farm', 'Buyer', 'Qty', 'Rate', 'Amount', 'Remarks'],
    sales.map((r: any) => [r.sale_date, r.farms?.name, r.buyer_name, r.qty, r.rate, r.amount, r.remarks]))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-3 text-center"><p className="text-lg font-bold text-gray-700">{totalQty}</p><p className="text-xs text-gray-500">Bags sold</p></Card>
        <Card className="!p-3 text-center"><p className="text-lg font-bold text-green-600">{inr(totalAmt)}</p><p className="text-xs text-gray-500">Total revenue</p></Card>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" icon={<Download size={14} />} onClick={exportRows}>Export</Button>
        <Button icon={<Plus size={14} />} onClick={() => { setForm(blank); setShowForm(true) }}>Add Sale</Button>
      </div>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Date</Th><Th>Farm</Th><Th>Buyer</Th><Th right>Qty</Th><Th right>Rate</Th><Th right>Amount</Th><Th right>Actions</Th></tr></thead>
            <tbody>
              {sales.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td>{r.sale_date}</Td><Td>{r.farms?.name ?? '—'}</Td><Td>{r.buyer_name ?? '—'}</Td>
                  <Td right>{r.qty}</Td><Td right>{r.rate ? inr(r.rate) : '—'}</Td><Td right className="font-semibold text-green-700">{r.amount ? inr(r.amount) : '—'}</Td>
                  <Td right><button onClick={() => confirm('Delete this sale?') && delMut.mutate(r.id)}><Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button></Td>
                </tr>
              ))}
              {sales.length === 0 && <tr><Td colSpan={7}><EmptyState icon={<Package size={28} />} title="No bag sales recorded yet" /></Td></tr>}
            </tbody>
          </Table>
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Bag Sale"
        footer={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>}>
        <div className="space-y-3">
          <FormRow>
            <DateInput label="Date *" value={form.sale_date} onChange={e => s('sale_date', e.target.value)} />
            <Select label="Farm" value={form.farm_id} onChange={e => s('farm_id', e.target.value)} placeholder="Select Farm" options={farms.map((f: any) => ({ value: f.id, label: f.name }))} />
          </FormRow>
          <Input label="Buyer Name" value={form.buyer_name} onChange={e => s('buyer_name', e.target.value)} />
          <FormRow>
            <Input label="Qty (bags) *" type="number" value={form.qty} onChange={e => s('qty', e.target.value)} />
            <Input label="Rate (₹/bag)" type="number" value={form.rate} onChange={e => s('rate', e.target.value)} />
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

const BalanceTab: React.FC<{ farms: any[] }> = ({ farms }) => {
  const { data: received = [] } = useQuery({
    queryKey: ['bags_received_from_grn'],
    queryFn: async () => {
      const { data } = await supabase.from('grn').select('farm_id, bags').not('bags', 'is', null)
      const byFarm: Record<string, number> = {}
      for (const r of (data ?? [])) byFarm[r.farm_id ?? '_none'] = (byFarm[r.farm_id ?? '_none'] ?? 0) + (Number(r.bags) || 0)
      return byFarm
    }
  })
  const { data: sold = [] } = useQuery({
    queryKey: ['bags_sold_by_farm'],
    queryFn: async () => {
      const { data } = await supabase.from('bag_sales').select('farm_id, qty')
      const byFarm: Record<string, number> = {}
      for (const r of (data ?? [])) byFarm[r.farm_id ?? '_none'] = (byFarm[r.farm_id ?? '_none'] ?? 0) + (Number(r.qty) || 0)
      return byFarm
    }
  })

  const rows = farms.map((f: any) => {
    const rec = (received as any)[f.id] ?? 0
    const sld = (sold as any)[f.id] ?? 0
    return { name: f.name, received: rec, sold: sld, balance: rec - sld }
  })
  const totals = rows.reduce((acc: any, r: any) => ({ received: acc.received + r.received, sold: acc.sold + r.sold, balance: acc.balance + r.balance }), { received: 0, sold: 0, balance: 0 })

  return (
    <Card padding={false}>
      <Table>
        <thead><tr><Th>Farm</Th><Th right>Received (from GRN)</Th><Th right>Sold</Th><Th right>Balance in Hand</Th></tr></thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.name} className="hover:bg-gray-50">
              <Td className="font-medium">{r.name}</Td>
              <Td right>{r.received}</Td>
              <Td right>{r.sold}</Td>
              <Td right className={`font-semibold ${r.balance < 0 ? 'text-red-600' : 'text-gray-700'}`}>{r.balance}</Td>
            </tr>
          ))}
          <tr className="bg-gray-50 font-semibold">
            <Td>TOTAL</Td><Td right>{totals.received}</Td><Td right>{totals.sold}</Td>
            <Td right className={totals.balance < 0 ? 'text-red-600' : ''}>{totals.balance}</Td>
          </tr>
        </tbody>
      </Table>
    </Card>
  )
}
