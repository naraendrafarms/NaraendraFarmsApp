import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal, Divider,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState,
  DateInput, SearchableSelect,
} from '@/components/ui'
import { QuickAddParty } from '@/components/ui/QuickAdd'
import { Plus, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { supplyType, splitTax, PURCHASE_NATURE_OPTIONS, GST_RATE_OPTIONS, OUR_STATE_CODE } from '@/lib/gst'

// One place to enter every purchase. Pick a category, pick the item, the app
// files it into the right tables (feed stock / medicine stock) AND always logs
// it to Pending Payments — and to Cash Book when paid in cash. No need to
// remember which screen to use.

const CATEGORIES = ['Feed', 'Medicine', 'Equipment', 'Other'] as const
type Cat = typeof CATEGORIES[number]

// Which existing master a new item of this category should be created in
const masterFor = (cat: Cat) =>
  cat === 'Feed' ? 'feed_ingredients'
  : cat === 'Medicine' ? 'medicines_master'
  : 'general_items'

export const PurchaseEntry: React.FC = () => {
  const qc = useQueryClient()
  const [showItem, setShowItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('')

  const empty = () => ({
    category: 'Feed' as Cat,
    item_id: '', item_name: '', unit: 'kg',
    supplier_id: '', farm_id: '',
    purchase_date: today(), invoice_no: '', invoice_date: '',
    grn_no: '', vehicle_no: '',
    qty: '', rate: '', gst_pct: '0',
    nature: 'purchase', is_rcm: false,
    payment_status: 'Pending', credit_limit: '', account_type: 'Online',
    remarks: '',
  })
  const [form, setForm] = useState(empty())
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: items } = useQuery({
    queryKey: ['v_purchase_items'],
    queryFn: async () => { const { data } = await supabase.from('v_purchase_items').select('*').order('name'); return data ?? [] },
  })
  const { data: suppliers } = useQuery({
    queryKey: ['parties_all'],
    queryFn: async () => { const { data } = await supabase.from('parties').select('id,name,credit_days,gstin,state_code,gst_type,is_rcm_default').order('name'); return data ?? [] },
  })
  const { data: farms } = useQuery({
    queryKey: ['farms_all'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name').order('name'); return data ?? [] },
  })
  const { data: recent, isLoading } = useQuery({
    queryKey: ['recent_purchases'],
    queryFn: async () => {
      const { data } = await supabase.from('pending_payments').select('*').order('created_at', { ascending: false }).limit(15)
      return data ?? []
    },
  })

  const catItems = useMemo(
    () => (items ?? []).filter((i: any) => i.purchase_category === form.category),
    [items, form.category],
  )

  const qty = parseFloat(form.qty) || 0
  const rate = parseFloat(form.rate) || 0
  const gst = parseFloat(form.gst_pct) || 0
  const basic = Math.round(qty * rate * 100) / 100
  const gstAmt = Math.round(basic * gst / 100 * 100) / 100
  const total = Math.round((basic + gstAmt) * 100) / 100

  const supplier = (suppliers ?? []).find((p: any) => p.id === form.supplier_id)
  const supplierName = supplier?.name ?? ''
  const sType = supplyType(supplier?.state_code)               // 'intra' | 'inter'
  const taxSplit = splitTax(basic, gst, sType)                  // cgst/sgst/igst
  const pickSupplier = (id: string) => {
    const p = (suppliers ?? []).find((x: any) => x.id === id)
    setForm(f => ({ ...f, supplier_id: id, is_rcm: p?.is_rcm_default ?? false }))
  }

  const payBefore = useMemo(() => {
    const base = form.invoice_date || form.purchase_date
    if (!base || !form.credit_limit) return null
    const d = new Date(base)
    d.setDate(d.getDate() + Number(form.credit_limit))
    return d.toISOString().slice(0, 10)
  }, [form.invoice_date, form.purchase_date, form.credit_limit])

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.item_id && !form.item_name) throw new Error('Pick an item')
      if (!form.qty || qty <= 0) throw new Error('Quantity required')
      if (!form.supplier_id) throw new Error('Supplier required')

      const item = (items ?? []).find((i: any) => i.id === form.item_id)
      const itemName = item?.name ?? form.item_name

      // 1. Route to the category-specific table
      if (form.category === 'Feed') {
        const { error } = await supabase.from('grn').insert({
          grn_no: form.grn_no || `GRN-${form.purchase_date}-${Date.now() % 100000}`,
          grn_date: form.purchase_date,
          farm_id: form.farm_id || null,
          party_id: form.supplier_id || null,
          ingredient_id: form.item_id || null,
          item_name: itemName,
          invoice_no: form.invoice_no || null,
          invoice_date: form.invoice_date || null,
          qty, unit: form.unit || 'kg',
          price_per_unit: rate || null,
          basic_amount: basic || null,
          gst_pct: gst || null,
          gst_amount: taxSplit.total || 0,
          total_amount: total || null,
          supply_type: sType,
          nature: form.nature,
          is_rcm: form.is_rcm,
          taxable: gst > 0,
          cgst_amount: taxSplit.cgst,
          sgst_amount: taxSplit.sgst,
          igst_amount: taxSplit.igst,
          party_gstin: supplier?.gstin || null,
          vehicle_no: form.vehicle_no || null,
          remarks: form.remarks || null,
        })
        if (error) throw error
      } else if (form.category === 'Medicine') {
        const { error } = await supabase.from('medicine_purchases').insert({
          purchase_date: form.purchase_date,
          medicine_id: form.item_id || null,
          farm_id: form.farm_id || null,
          supplier_id: form.supplier_id || null,
          invoice_no: form.invoice_no || null,
          invoice_date: form.invoice_date || null,
          qty, unit: form.unit || null,
          rate, gst_pct: gst,
          supply_type: sType,
          nature: form.nature,
          is_rcm: form.is_rcm,
          cgst_amount: taxSplit.cgst,
          sgst_amount: taxSplit.sgst,
          igst_amount: taxSplit.igst,
          party_gstin: supplier?.gstin || null,
          remarks: form.remarks || null,
        })
        if (error) throw error
      }
      // Equipment / Other: no stock table — tracked via Pending Payments below.

      // 2. Log to Pending Payments so every bill is in one place.
      //    Feed goes through the grn -> pending_payments DB trigger, so only
      //    raise the bill manually for non-Feed categories to avoid duplicates.
      if (form.category !== 'Feed') {
        const { error: payErr } = await supabase.from('pending_payments').insert({
          vendor_name: supplierName,
          grn_no: form.grn_no || `${form.category.toUpperCase()}-${form.invoice_no || Date.now()}`,
          grn_date: form.purchase_date,
          invoice_no: form.invoice_no || null,
          invoice_date: form.invoice_date || form.purchase_date,
          invoice_amount: total || null,
          payment_status: form.payment_status,
          paid_date: form.payment_status === 'Paid' ? form.purchase_date : null,
          credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
          pay_before_date: payBefore,
          account_type: form.account_type || null,
        })
        if (payErr) throw payErr
      }

      // 3. If paid in cash, mirror to Cash Book
      if (form.payment_status === 'Paid' && form.account_type === 'Cash' && total > 0) {
        await supabase.from('cash_book').insert({
          txn_date: form.purchase_date,
          txn_type: 'payment',
          category: 'expense',
          farm_id: form.farm_id || null,
          description: `${form.category} purchase — ${itemName}`,
          party_name: supplierName,
          reference_no: form.invoice_no || form.grn_no || null,
          amount_out: total,
          payment_mode: 'cash',
          remarks: form.remarks || null,
        })
      }
    },
    onSuccess: () => {
      toast.success('Purchase saved & routed')
      setForm(f => ({ ...empty(), category: f.category, supplier_id: f.supplier_id, farm_id: f.farm_id, purchase_date: f.purchase_date }))
      qc.invalidateQueries({ queryKey: ['recent_purchases'] })
      qc.invalidateQueries({ queryKey: ['grn'] })
      qc.invalidateQueries({ queryKey: ['grns'] })
      qc.invalidateQueries({ queryKey: ['medicine_purchases'] })
      qc.invalidateQueries({ queryKey: ['v_medicine_stock'] })
      qc.invalidateQueries({ queryKey: ['pending_payments'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const addItemMut = useMutation({
    mutationFn: async () => {
      if (!newItemName.trim()) throw new Error('Item name required')
      const table = masterFor(form.category)
      const payload: any = { name: newItemName.trim(), unit: newItemUnit || form.unit }
      if (table === 'general_items') payload.category = form.category
      const { data, error } = await supabase.from(table).insert(payload).select('id,name').single()
      if (error) throw error
      return data
    },
    onSuccess: (d: any) => {
      toast.success('Item added')
      setForm(f => ({ ...f, item_id: d.id, item_name: d.name }))
      setShowItem(false); setNewItemName(''); setNewItemUnit('')
      qc.invalidateQueries({ queryKey: ['v_purchase_items'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const pickItem = (id: string) => {
    const it = (items ?? []).find((i: any) => i.id === id)
    setForm(f => ({ ...f, item_id: id, item_name: it?.name ?? '', unit: it?.unit ?? f.unit }))
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="New Purchase"
        subtitle="One screen for every purchase — feed, medicine, equipment. The app files it where it belongs." />

      <Card>
        <div className="space-y-4">
          <FormRow cols={3}>
            <Select label="What did you buy?" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as Cat, item_id: '', item_name: '' }))}
              options={CATEGORIES.map(c => ({ value: c, label: c }))} />
            <div>
              <Select label="Item" value={form.item_id} onChange={e => pickItem(e.target.value)}
                options={[{ value: '', label: 'Select item…' }, ...catItems.map((i: any) => ({ value: i.id, label: `${i.name} (${i.unit})` }))]} />
              <button type="button" onClick={() => setShowItem(true)} className="mt-1 text-xs text-brand-600 hover:underline">+ Add new item</button>
            </div>
            <Select label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)}
              options={['kg','MT','Quintal','Ltr','ML','Gms','Dose','Nos','Box','Mtrs','Bag'].map(u => ({ value: u, label: u }))} />
          </FormRow>

          <FormRow cols={3}>
            <div>
              <SearchableSelect label="Supplier" value={form.supplier_id} onChange={v => pickSupplier(v)}
                placeholder="Select supplier…"
                options={(suppliers ?? []).map((p: any) => ({ value: p.id, label: p.name }))} />
              <div className="mt-1"><QuickAddParty onCreated={(p) => { qc.invalidateQueries({ queryKey: ['parties_all'] }); s('supplier_id', p.id) }} /></div>
            </div>
            <Select label="Farm (optional)" value={form.farm_id} onChange={e => s('farm_id', e.target.value)}
              options={[{ value: '', label: '—' }, ...(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))]} />
            <DateInput label="Purchase Date" value={form.purchase_date} onChange={e => s('purchase_date', e.target.value)} />
          </FormRow>

          <Divider label="Invoice & Quantity" />
          <FormRow cols={4}>
            <Input label="Qty" type="number" step="0.001" value={form.qty} onChange={e => s('qty', e.target.value)} />
            <Input label="Rate / Unit (₹)" type="number" step="0.001" value={form.rate} onChange={e => s('rate', e.target.value)} />
            <Select label="GST %" value={form.gst_pct} onChange={e => s('gst_pct', e.target.value)} options={GST_RATE_OPTIONS} />
            <Input label="Total" value={total ? inr(total) : '—'} disabled hint={basic ? `Basic ${inr(basic)} + GST ${inr(gstAmt)}` : undefined} />
          </FormRow>

          <Divider label="GST Classification" />
          <FormRow cols={3}>
            <Select label="Nature of Purchase" value={form.nature} onChange={e => s('nature', e.target.value)} options={PURCHASE_NATURE_OPTIONS} />
            <Input label="Supply Type" disabled
              value={sType === 'inter' ? 'Inter-state (IGST)' : 'Intra-state (CGST+SGST)'}
              hint={supplier ? (supplier.state_code === OUR_STATE_CODE ? 'Same state as us (36)' : `Supplier state ${supplier.state_code || '—'}`) : 'Select supplier first'} />
            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_rcm} onChange={e => setForm(f => ({ ...f, is_rcm: e.target.checked }))} className="rounded text-brand-600" />
                Reverse Charge (RCM)
              </label>
              <span className="text-xs text-gray-400 mt-1">Auto-set from supplier; tick for rent/unregistered</span>
            </div>
          </FormRow>
          {gst > 0 && (
            <div className="flex flex-wrap gap-4 text-xs bg-gray-50 rounded-lg px-3 py-2 text-gray-600">
              {sType === 'inter'
                ? <span>IGST @{gst}%: <strong className="text-gray-800">{inr(taxSplit.igst)}</strong></span>
                : <>
                    <span>CGST @{gst/2}%: <strong className="text-gray-800">{inr(taxSplit.cgst)}</strong></span>
                    <span>SGST @{gst/2}%: <strong className="text-gray-800">{inr(taxSplit.sgst)}</strong></span>
                  </>}
              <span>Total GST: <strong className="text-gray-800">{inr(taxSplit.total)}</strong></span>
              {form.is_rcm && <span className="text-amber-600 font-medium">⚠ RCM — you pay this tax</span>}
              <span className="text-gray-400">(input GST → indirect expense, no ITC)</span>
            </div>
          )}
          <FormRow cols={4}>
            <Input label="Invoice No" value={form.invoice_no} onChange={e => s('invoice_no', e.target.value)} />
            <DateInput label="Invoice Date" value={form.invoice_date} onChange={e => s('invoice_date', e.target.value)} />
            {form.category === 'Feed' && <Input label="GRN No (optional)" value={form.grn_no} onChange={e => s('grn_no', e.target.value)} />}
            {form.category === 'Feed' && <Input label="Vehicle No" value={form.vehicle_no} onChange={e => s('vehicle_no', e.target.value)} />}
          </FormRow>

          <Divider label="Payment" />
          <FormRow cols={4}>
            <Select label="Payment Status" value={form.payment_status} onChange={e => s('payment_status', e.target.value)}
              options={['Pending','Paid','HOLD'].map(v => ({ value: v, label: v }))} />
            <Select label="Account Type" value={form.account_type} onChange={e => s('account_type', e.target.value)}
              options={['Online','Cash'].map(v => ({ value: v, label: v }))} />
            <Input label="Credit Days" type="number" value={form.credit_limit} onChange={e => s('credit_limit', e.target.value)} />
            <Input label="Pay Before" value={payBefore ? fmtDate(payBefore) : '—'} disabled />
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />

          <div className="flex items-center gap-3">
            <Button icon={<Plus size={16} />} loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save Purchase</Button>
            <span className="text-xs text-gray-500">
              {form.category === 'Feed' && 'Files into Feed GRN + Pending Payments'}
              {form.category === 'Medicine' && 'Files into Medicine Purchases + Pending Payments'}
              {(form.category === 'Equipment' || form.category === 'Other') && 'Files into Pending Payments'}
              {form.payment_status === 'Paid' && form.account_type === 'Cash' && ' + Cash Book'}
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <p className="font-medium text-gray-700 mb-3 flex items-center gap-2"><ShoppingCart size={16} />Recent Purchases</p>
        {isLoading ? <Spinner /> : (recent ?? []).length === 0 ? <EmptyState title="No purchases yet" /> : (
          <Table>
            <thead><tr>{['Date','Supplier','GRN','Invoice ₹','Status','Pay Before'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {(recent ?? []).map((r: any) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <Td>{fmtDate(r.grn_date ?? r.invoice_date)}</Td>
                  <Td>{r.vendor_name}</Td>
                  <Td>{r.grn_no ?? '—'}</Td>
                  <Td>{r.invoice_amount != null ? inr(r.invoice_amount) : '—'}</Td>
                  <Td><Badge color={r.payment_status === 'Paid' ? 'green' : r.payment_status === 'HOLD' ? 'red' : 'yellow'}>{r.payment_status}</Badge></Td>
                  <Td>{r.pay_before_date ? fmtDate(r.pay_before_date) : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={showItem} onClose={() => setShowItem(false)} title={`Add new ${form.category} item`}>
        <div className="space-y-3">
          <Input label="Item Name" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
          <Select label="Unit" value={newItemUnit || form.unit} onChange={e => setNewItemUnit(e.target.value)}
            options={['kg','MT','Quintal','Ltr','ML','Gms','Dose','Nos','Box','Mtrs','Bag'].map(u => ({ value: u, label: u }))} />
          <Button loading={addItemMut.isPending} onClick={() => addItemMut.mutate()}>Add Item</Button>
        </div>
      </Modal>
    </div>
  )
}
