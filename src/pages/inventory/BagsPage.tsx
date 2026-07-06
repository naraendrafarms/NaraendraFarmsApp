import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, exportCSV, today } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td,
  SectionHeader, Spinner, EmptyState, DateInput,
} from '@/components/ui'
import { Plus, Trash2, Download, Package, Pencil, Upload, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import { printReport } from '@/lib/invoicePrint'

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
  const [editing, setEditing] = useState<any>(null)
  const blank = { sale_date: today(), farm_id: '', buyer_name: '', qty: '', rate: '', payment_mode: 'Cash', bank_account_id: '', remarks: '' }
  const [form, setForm] = useState(blank)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const [filterFarm, setFilterFarm] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['bag_sales'],
    queryFn: async () => { const { data } = await supabase.from('bag_sales').select('*, farms(name), bank_accounts(bank_name,account_name)').order('sale_date', { ascending: false }); return data ?? [] }
  })
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => { const { data } = await supabase.from('bank_accounts').select('id,bank_name,account_name').eq('is_active', true).order('bank_name'); return data ?? [] }
  })

  const filtered = sales.filter((r: any) => {
    if (filterFarm && r.farm_id !== filterFarm) return false
    if (filterFrom && r.sale_date < filterFrom) return false
    if (filterTo && r.sale_date > filterTo) return false
    return true
  })

  // Delete-then-reinsert the linked cash_book/bank_transactions row on edit,
  // same pattern used for NHE Sales/HE Dispatch, so an edit never leaves a
  // stale ledger entry with the old amount/payment mode behind.
  const relinkLedger = async (saleId: string, saleDate: string, farmId: string | null, buyerName: string | null, qty: number, amt: number, paymentMode: string, bankAccountId: string | null) => {
    await supabase.from('cash_book').delete().eq('bag_sale_id', saleId)
    await supabase.from('bank_transactions').delete().eq('bag_sale_id', saleId)
    const description = `Empty bags sold${buyerName ? ` to ${buyerName}` : ''} (${qty} bags)`
    if (amt > 0 && paymentMode === 'Cash') {
      const { error } = await supabase.from('cash_book').insert({
        txn_date: saleDate, txn_type: 'receipt', category: 'other',
        description, party_name: buyerName, farm_id: farmId,
        amount_in: amt, amount_out: 0, payment_mode: 'cash', bag_sale_id: saleId,
      })
      if (error) throw new Error('Sale saved, but Cash Book entry failed: ' + error.message)
    } else if (amt > 0 && paymentMode === 'Bank' && bankAccountId) {
      const { error } = await supabase.from('bank_transactions').insert({
        bank_account_id: bankAccountId, txn_date: saleDate, txn_type: 'Credit',
        category: 'Bag Sale', reference_no: null, description, amount: amt,
        bag_sale_id: saleId,
      })
      if (error) throw new Error('Sale saved, but Bank Ledger entry failed: ' + error.message)
    }
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const qty = parseInt(form.qty) || 0, rate = parseFloat(form.rate) || 0
      if (!qty) throw new Error('Enter qty')
      if (form.payment_mode === 'Bank' && !form.bank_account_id) throw new Error('Pick a bank account')
      const amt = qty * rate
      const payload = {
        sale_date: form.sale_date, farm_id: form.farm_id || null, buyer_name: form.buyer_name || null,
        qty, rate: rate || null, amount: amt || null,
        payment_mode: form.payment_mode, bank_account_id: form.payment_mode === 'Bank' ? form.bank_account_id : null,
        remarks: form.remarks || null,
      }
      let saleId = editing?.id
      if (editing) {
        const { error } = await supabase.from('bag_sales').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { data: sale, error } = await supabase.from('bag_sales').insert(payload).select('id').single()
        if (error) throw error
        saleId = sale.id
      }
      await relinkLedger(saleId, form.sale_date, form.farm_id || null, form.buyer_name || null, qty, amt, form.payment_mode, form.bank_account_id || null)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bag_sales'] }); qc.invalidateQueries({ queryKey: ['cash_book'] }); qc.invalidateQueries({ queryKey: ['bank_transactions'] }); setShowForm(false); setEditing(null); setForm(blank); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })
  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('bag_sales').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bag_sales'] }); qc.invalidateQueries({ queryKey: ['cash_book'] }); qc.invalidateQueries({ queryKey: ['bank_transactions'] }); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })
  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => { const { error } = await supabase.from('bag_sales').delete().in('id', ids); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bag_sales'] }); qc.invalidateQueries({ queryKey: ['cash_book'] }); qc.invalidateQueries({ queryKey: ['bank_transactions'] }); setSel(new Set()); setBulkConfirm(false); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  const openEdit = (r: any) => {
    setEditing(r)
    setForm({
      sale_date: r.sale_date, farm_id: r.farm_id ?? '', buyer_name: r.buyer_name ?? '',
      qty: String(r.qty ?? ''), rate: r.rate != null ? String(r.rate) : '',
      payment_mode: r.payment_mode ?? 'Cash', bank_account_id: r.bank_account_id ?? '', remarks: r.remarks ?? '',
    })
    setShowForm(true)
  }

  const toggle = (id: string) => setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allSel = filtered.length > 0 && filtered.every((r: any) => sel.has(r.id))
  const toggleAll = () => setSel(allSel ? new Set() : new Set(filtered.map((r: any) => r.id)))

  const totalQty = filtered.reduce((s: number, r: any) => s + (r.qty || 0), 0)
  const totalAmt = filtered.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0)

  const exportRows = () => exportCSV(`bag_sales_${today()}.csv`, ['Date', 'Farm', 'Buyer', 'Qty', 'Rate', 'Amount', 'Remarks'],
    filtered.map((r: any) => [r.sale_date, r.farms?.name, r.buyer_name, r.qty, r.rate, r.amount, r.remarks]))

  const printRows = () => printReport({
    title: 'Empty Bags — Sales', subtitle: `${filtered.length} sale(s)`,
    headers: ['Date', 'Farm', 'Buyer', 'Qty', 'Rate', 'Amount', 'Remarks'],
    rows: filtered.map((r: any) => [r.sale_date, r.farms?.name ?? '—', r.buyer_name ?? '—', r.qty, r.rate ?? '—', r.amount ?? '—', r.remarks ?? '—']),
    rightAlignFrom: 3,
  })

  const downloadTemplate = () => downloadXlsxTemplate('bag_sales_template.xlsx',
    ['sale_date', 'farm_name', 'buyer_name', 'qty', 'rate', 'payment_mode', 'remarks'],
    ['2026-01-01', 'Farm Name Here', 'Buyer Name', '100', '15', 'Cash', ''])

  const handleImport = async (file: File) => {
    try {
      const { headers, rows } = await parseFile(file)
      const idx = (n: string) => headers.findIndex(h => h.toLowerCase().trim() === n.toLowerCase())
      const ci = { date: idx('sale_date'), farm: idx('farm_name'), buyer: idx('buyer_name'), qty: idx('qty'), rate: idx('rate'), mode: idx('payment_mode'), rem: idx('remarks') }
      if (ci.date < 0 || ci.qty < 0) { toast.error('File needs sale_date and qty columns'); return }
      let saved = 0, errors = 0
      for (const row of rows) {
        const qty = parseInt(row[ci.qty]) || 0
        if (!row[ci.date] || !qty) continue
        const rate = ci.rate >= 0 ? parseFloat(row[ci.rate]) || 0 : 0
        const farmName = ci.farm >= 0 ? row[ci.farm]?.trim() : ''
        const farm = farms.find((f: any) => f.name.toLowerCase() === (farmName ?? '').toLowerCase())
        const paymentMode = (ci.mode >= 0 ? row[ci.mode]?.trim() : '') || 'Cash'
        const payload = {
          sale_date: row[ci.date], farm_id: farm?.id ?? null, buyer_name: ci.buyer >= 0 ? row[ci.buyer] || null : null,
          qty, rate: rate || null, amount: qty * rate || null,
          payment_mode: paymentMode === 'Bank' ? 'Bank' : 'Cash', remarks: ci.rem >= 0 ? row[ci.rem] || null : null,
        }
        const { data: sale, error } = await supabase.from('bag_sales').insert(payload).select('id').single()
        if (error) { errors++; continue }
        try { await relinkLedger(sale.id, payload.sale_date, payload.farm_id, payload.buyer_name, qty, qty * rate, payload.payment_mode, null) } catch { /* ledger link best-effort on import */ }
        saved++
      }
      qc.invalidateQueries({ queryKey: ['bag_sales'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      toast.success(`Imported ${saved} sale(s)${errors ? `, ${errors} failed` : ''}`)
    } catch (e: any) { toast.error(e.message) }
    finally { if (importRef.current) importRef.current.value = '' }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-3 text-center"><p className="text-lg font-bold text-gray-700">{totalQty}</p><p className="text-xs text-gray-500">Bags sold</p></Card>
        <Card className="!p-3 text-center"><p className="text-lg font-bold text-green-600">{inr(totalAmt)}</p><p className="text-xs text-gray-500">Total revenue</p></Card>
      </div>
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <Select label="" placeholder="All Farms" value={filterFarm} onChange={e => setFilterFarm(e.target.value)} options={farms.map((f: any) => ({ value: f.id, label: f.name }))} className="w-44" />
          <DateInput label="From" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          <DateInput label="To" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
          {(filterFarm || filterFrom || filterTo) && <Button variant="ghost" size="sm" onClick={() => { setFilterFarm(''); setFilterFrom(''); setFilterTo('') }}>Clear</Button>}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }} />
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={downloadTemplate}>Template</Button>
          <Button variant="outline" size="sm" icon={<Upload size={14} />} onClick={() => importRef.current?.click()}>Import</Button>
          <Button variant="outline" icon={<Download size={14} />} onClick={exportRows}>Export</Button>
          <Button variant="outline" icon={<Printer size={14} />} onClick={printRows}>Print</Button>
          {sel.size > 0 && <Button variant="danger" icon={<Trash2 size={14} />} onClick={() => setBulkConfirm(true)}>Delete Selected ({sel.size})</Button>}
          <Button icon={<Plus size={14} />} onClick={() => { setEditing(null); setForm(blank); setShowForm(true) }}>Add Sale</Button>
        </div>
      </div>
      {bulkConfirm && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-3">
          <span>Delete {sel.size} selected sale(s)? Linked Cash Book/Bank entries are removed too. This cannot be undone.</span>
          <Button size="sm" variant="danger" loading={bulkDelMut.isPending} onClick={() => bulkDelMut.mutate(Array.from(sel))}>Yes, delete</Button>
          <Button size="sm" variant="secondary" onClick={() => setBulkConfirm(false)}>Cancel</Button>
        </div>
      )}
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><input type="checkbox" checked={allSel} onChange={toggleAll} className="rounded border-gray-300 text-brand-600" /></Th>
              <Th>Date</Th><Th>Farm</Th><Th>Buyer</Th><Th right>Qty</Th><Th right>Rate</Th><Th right>Amount</Th><Th right>Actions</Th></tr></thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id) ? 'bg-brand-50' : ''}`}>
                  <Td><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} className="rounded border-gray-300 text-brand-600" /></Td>
                  <Td>{r.sale_date}</Td><Td>{r.farms?.name ?? '—'}</Td><Td>{r.buyer_name ?? '—'}</Td>
                  <Td right>{r.qty}</Td><Td right>{r.rate ? inr(r.rate) : '—'}</Td><Td right className="font-semibold text-green-700">{r.amount ? inr(r.amount) : '—'}</Td>
                  <Td right>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(r)}><Pencil size={14} className="text-gray-400 hover:text-brand-600" /></button>
                      <button onClick={() => confirm('Delete this sale? Linked Cash Book/Bank entry is removed too.') && delMut.mutate(r.id)}><Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button>
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><Td colSpan={8}><EmptyState icon={<Package size={28} />} title="No bag sales recorded yet" /></Td></tr>}
            </tbody>
          </Table>
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Bag Sale' : 'Add Bag Sale'}
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
          <FormRow>
            <Select label="Received Into" value={form.payment_mode} onChange={e => s('payment_mode', e.target.value)}
              options={[{ value: 'Cash', label: 'Cash' }, { value: 'Bank', label: 'Bank' }]} />
            {form.payment_mode === 'Bank' && (
              <Select label="Bank Account *" value={form.bank_account_id} onChange={e => s('bank_account_id', e.target.value)}
                placeholder="Select Bank" options={bankAccounts.map((b: any) => ({ value: b.id, label: `${b.bank_name}${b.account_name ? ' — ' + b.account_name : ''}` }))} />
            )}
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
  // GRNs/sales with no farm accumulate under '_none' — previously invisible
  // in this table, so those bags vanished from every balance
  const noneRec = (received as any)['_none'] ?? 0
  const noneSld = (sold as any)['_none'] ?? 0
  if (noneRec || noneSld) rows.push({ name: 'No farm / Head Office', received: noneRec, sold: noneSld, balance: noneRec - noneSld })
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
