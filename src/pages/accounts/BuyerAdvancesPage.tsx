import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate, inr, today, exportCSV } from '@/lib/utils'
import {
  Card, Button, Input, Select, SearchableSelect, Modal, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState, DateInput
} from '@/components/ui'
import { Plus, Trash2, Pencil, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  advance_date: today(),
  party_id: '',
  amount: '',
  payment_mode: 'cash',
  reference_no: '',
  remarks: '',
  bank_account_id: '',
}

const MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'neft', label: 'NEFT' },
  { value: 'rtgs', label: 'RTGS' },
]

export const BuyerAdvancesPage: React.FC = () => {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterParty, setFilterParty] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: parties = [] } = useQuery({
    queryKey: ['parties_buyers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('parties')
        .select('id,name,type')
        .eq('is_active', true)
        .order('name')
      return data ?? []
    }
  })

  const partyOptions = [
    { value: '', label: '— All Parties —' },
    ...(parties as any[]).map((p: any) => ({ value: p.id, label: p.name }))
  ]

  const partySelectOptions = [
    { value: '', label: '— Select Party —' },
    ...(parties as any[]).map((p: any) => ({ value: p.id, label: p.name }))
  ]

  const { data: advances = [], isLoading } = useQuery({
    queryKey: ['party_advances', filterParty],
    queryFn: async () => {
      let q = supabase
        .from('party_advances')
        .select('id,advance_date,party_id,amount,amount_used,payment_mode,reference_no,remarks,parties(name)')
        .order('advance_date', { ascending: false })
      if (filterParty) q = q.eq('party_id', filterParty)
      const { data } = await q
      return data ?? []
    }
  })

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank_accounts_active'],
    queryFn: async () => {
      const { data } = await supabase.from('bank_accounts').select('id,bank_name,account_name').eq('is_active', true).order('bank_name')
      return data ?? []
    }
  })

  const addMut = useMutation({
    mutationFn: async (row: typeof EMPTY & { bank_account_id?: string }) => {
      const amt = parseFloat(row.amount) || 0
      const partyName = (parties as any[]).find((p: any) => p.id === row.party_id)?.name ?? ''
      const narration = `Advance from ${partyName}${row.reference_no ? ` (${row.reference_no})` : ''}`

      // 1. Save to party_advances
      const { data: adv, error } = await supabase.from('party_advances').insert({
        advance_date: row.advance_date,
        party_id: row.party_id,
        amount: amt,
        payment_mode: row.payment_mode,
        reference_no: row.reference_no || null,
        remarks: row.remarks || null,
      }).select('id').single()
      if (error) throw error

      // 2. Record in Cash Book (cash) or Bank Transactions (bank/upi/etc)
      const isCash = ['cash'].includes(row.payment_mode)
      if (isCash) {
        const { error: cbErr } = await supabase.from('cash_book').insert({
          txn_date: row.advance_date,
          txn_type: 'receipt',
          category: 'sales_collection',
          description: narration,
          party_name: partyName,
          amount_in: amt,
          amount_out: 0,
          payment_mode: 'cash',
          reference_no: row.reference_no || null,
          party_advance_id: adv.id,
        })
        if (cbErr) throw new Error('Advance saved but Cash Book entry failed: ' + cbErr.message)
      } else if (row.bank_account_id) {
        const { error: bErr } = await supabase.from('bank_transactions').insert({
          bank_account_id: row.bank_account_id,
          txn_date: row.advance_date,
          txn_type: 'Credit',
          category: 'Sale Receipt',
          reference_no: row.reference_no || null,
          description: narration,
          amount: amt,
          party_id: row.party_id || null,
          party_advance_id: adv.id,
        })
        if (bErr) throw new Error('Advance saved but Bank entry failed: ' + bErr.message)
      }
      return adv
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['party_advances'] })
      toast.success('Advance saved')
      setShowModal(false)
      setForm({ ...EMPTY })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const editMut = useMutation({
    mutationFn: async (row: typeof EMPTY & { id: string }) => {
      const amt = parseFloat(row.amount) || 0
      const { error } = await supabase.from('party_advances').update({
        advance_date: row.advance_date,
        party_id: row.party_id,
        amount: amt,
        payment_mode: row.payment_mode,
        reference_no: row.reference_no || null,
        remarks: row.remarks || null,
      }).eq('id', row.id)
      if (error) throw error

      // Re-sync the ledger entry (delete old, re-insert fresh) so edits to
      // amount/date/mode/bank-account don't leave a stale Cash Book/Bank
      // Ledger row behind — same pattern as Pending Payments/Purchase Entry.
      await supabase.from('cash_book').delete().eq('party_advance_id', row.id)
      await supabase.from('bank_transactions').delete().eq('party_advance_id', row.id)
      const partyName = (parties as any[]).find((p: any) => p.id === row.party_id)?.name ?? ''
      const narration = `Advance from ${partyName}${row.reference_no ? ` (${row.reference_no})` : ''}`
      const isCash = ['cash'].includes(row.payment_mode)
      if (isCash) {
        const { error: cbErr } = await supabase.from('cash_book').insert({
          txn_date: row.advance_date, txn_type: 'receipt', category: 'sales_collection',
          description: narration, party_name: partyName, amount_in: amt, amount_out: 0,
          payment_mode: 'cash', reference_no: row.reference_no || null, party_advance_id: row.id,
        })
        if (cbErr) throw new Error('Advance updated but Cash Book entry failed: ' + cbErr.message)
      } else if (row.bank_account_id) {
        const { error: bErr } = await supabase.from('bank_transactions').insert({
          bank_account_id: row.bank_account_id, txn_date: row.advance_date, txn_type: 'Credit',
          category: 'Sale Receipt', reference_no: row.reference_no || null, description: narration,
          amount: amt, party_id: row.party_id || null, party_advance_id: row.id,
        })
        if (bErr) throw new Error('Advance updated but Bank entry failed: ' + bErr.message)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['party_advances'] })
      toast.success('Advance updated')
      setShowModal(false)
      setForm({ ...EMPTY })
      setEditId(null)
    },
    onError: (e: any) => toast.error(e.message),
  })

  // An advance already adjusted against a sale/invoice can't be deleted out
  // from under it — it'd be left claiming it was settled "via advance"
  // against an advance that no longer exists, with no way to reconcile.
  const guardAdvanceDelete = (ids: string[]) => {
    const inUse = (advances as any[]).filter(a => ids.includes(a.id) && (a.amount_used ?? 0) > 0.01)
    if (inUse.length) {
      toast.error(`${inUse.length} of these advance(s) are already adjusted against invoice(s) — reverse those first before deleting the advance`)
      return false
    }
    return true
  }

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      if (!guardAdvanceDelete([id])) throw new Error('Blocked — advance already in use')
      await supabase.from('cash_book').delete().eq('party_advance_id', id)
      await supabase.from('bank_transactions').delete().eq('party_advance_id', id)
      const { error } = await supabase.from('party_advances').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['party_advances'] })
      toast.success('Deleted')
    },
    onError: (e: any) => { if (e.message !== 'Blocked — advance already in use') toast.error(e.message) },
  })

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!guardAdvanceDelete(ids)) throw new Error('Blocked — advance already in use')
      await supabase.from('cash_book').delete().in('party_advance_id', ids)
      await supabase.from('bank_transactions').delete().in('party_advance_id', ids)
      const { error } = await supabase.from('party_advances').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['party_advances'] })
      setSelectedIds(new Set())
      toast.success('Selected advances deleted')
    },
    onError: (e: any) => { if (e.message !== 'Blocked — advance already in use') toast.error(e.message) },
  })

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === advances.length) setSelectedIds(new Set())
    else setSelectedIds(new Set((advances as any[]).map((a: any) => a.id)))
  }

  const openAdd = () => {
    setEditId(null)
    setForm({ ...EMPTY })
    setShowModal(true)
  }

  const openEdit = (a: any) => {
    setEditId(a.id)
    setForm({
      advance_date: a.advance_date ?? today(),
      party_id: a.party_id ?? '',
      amount: a.amount != null ? String(a.amount) : '',
      payment_mode: a.payment_mode ?? 'cash',
      reference_no: a.reference_no ?? '',
      remarks: a.remarks ?? '',
      bank_account_id: '',
    })
    setShowModal(true)
  }

  const totalReceived = advances.reduce((s, a: any) => s + (a.amount ?? 0), 0)
  const totalUsed = advances.reduce((s, a: any) => s + (a.amount_used ?? 0), 0)
  const totalBalance = totalReceived - totalUsed

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <SectionHeader
        title="Buyer Advances"
        subtitle="Record advances received from buyers — deducted when sale payment is received"
        action={
          <div className="flex gap-2">
            <Button variant="outline" icon={<Download size={14}/>} onClick={() => exportCSV(
              'buyer_advances.csv',
              ['Date','Party','Amount','Used','Mode','Ref No','Remarks'],
              (advances as any[]).map(a => [a.advance_date ? fmtDate(a.advance_date) : '', a.parties?.name ?? '', a.amount ?? 0, a.amount_used ?? 0, a.payment_mode ?? '', a.reference_no ?? '', a.remarks ?? ''])
            )}>Export Excel</Button>
            <Button onClick={openAdd}>
              <Plus size={16} className="mr-1" /> Add Advance
            </Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Total Received</div>
          <div className="text-lg font-bold text-green-700">{inr(totalReceived)}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Used / Adjusted</div>
          <div className="text-lg font-bold text-red-600">{inr(totalUsed)}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Balance Available</div>
          <div className="text-lg font-bold text-blue-700">{inr(totalBalance)}</div>
        </Card>
      </div>

      {/* Filter */}
      <Card className="p-3 max-w-xs">
        <SearchableSelect
          placeholder="— All Parties —"
          value={filterParty}
          onChange={setFilterParty}
          options={partyOptions}
        />
      </Card>

      {/* Bulk delete bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm">
          <span className="text-red-700 font-medium">{selectedIds.size} selected</span>
          <Button
            variant="secondary"
            disabled={bulkDelMut.isPending}
            onClick={() => {
              if (confirm(`Delete ${selectedIds.size} selected advance(s)?`)) {
                bulkDelMut.mutate([...selectedIds])
              }
            }}
          >
            <Trash2 size={14} className="mr-1" /> Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        {isLoading ? <Spinner /> : advances.length === 0 ? (
          <EmptyState title="No advances recorded yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>
                  <input
                    type="checkbox"
                    checked={advances.length > 0 && selectedIds.size === advances.length}
                    onChange={toggleSelectAll}
                  />
                </Th>
                <Th>Date</Th>
                <Th>Party</Th>
                <Th>Mode</Th>
                <Th>Ref No</Th>
                <Th>Remarks</Th>
                <Th className="text-right">Received</Th>
                <Th className="text-right">Used</Th>
                <Th className="text-right">Balance</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {advances.map((a: any) => {
                const bal = (a.amount ?? 0) - (a.amount_used ?? 0)
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <Td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(a.id)}
                        onChange={() => toggleSelect(a.id)}
                      />
                    </Td>
                    <Td>{fmtDate(a.advance_date)}</Td>
                    <Td className="font-medium">{(a as any).parties?.name ?? '—'}</Td>
                    <Td><Badge color="blue">{a.payment_mode}</Badge></Td>
                    <Td className="text-xs text-gray-500">{a.reference_no ?? '—'}</Td>
                    <Td className="text-xs text-gray-500">{a.remarks ?? '—'}</Td>
                    <Td className="text-right text-green-700 font-medium">{inr(a.amount)}</Td>
                    <Td className="text-right text-red-600">{inr(a.amount_used)}</Td>
                    <Td className="text-right font-bold text-blue-700">{inr(bal)}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(a)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Pencil size={14} />
                        </button>
                        {bal === (a.amount ?? 0) && (
                          <button
                            onClick={() => { if (confirm('Delete this advance?')) delMut.mutate(a.id) }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <Td colSpan={6}>TOTAL ({advances.length})</Td>
                <Td className="text-right text-green-700">{inr(advances.reduce((s: number, a: any) => s + (a.amount ?? 0), 0))}</Td>
                <Td className="text-right text-red-600">{inr(advances.reduce((s: number, a: any) => s + (a.amount_used ?? 0), 0))}</Td>
                <Td className="text-right text-blue-700">{inr(advances.reduce((s: number, a: any) => s + ((a.amount ?? 0) - (a.amount_used ?? 0)), 0))}</Td>
                <Td></Td>
              </tr>
            </tfoot>
          </Table>
        )}
      </Card>

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Buyer Advance' : 'Add Buyer Advance'}>
        <div className="space-y-4 p-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <DateInput value={form.advance_date} onChange={e => set('advance_date', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
            <SearchableSelect
              placeholder="— Select Party —"
              value={form.party_id}
              onChange={v => set('party_id', v)}
              options={(parties as any[]).map((p: any) => ({ value: p.id, label: p.name }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <Input
              type="number"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <Select
              value={form.payment_mode}
              onChange={e => set('payment_mode', e.target.value)}
              options={MODES}
            />
          </div>
          {form.payment_mode !== 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account <span className="text-gray-400 font-normal">(for bank ledger entry)</span></label>
              <Select
                value={form.bank_account_id}
                onChange={e => set('bank_account_id', e.target.value)}
                options={[
                  { value: '', label: '— Select bank (optional) —' },
                  ...(bankAccounts as any[]).map((b: any) => ({ value: b.id, label: `${b.bank_name}${b.account_name ? ' — ' + b.account_name : ''}` }))
                ]}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
            <Input value={form.reference_no} onChange={e => set('reference_no', e.target.value)} placeholder="UTR / Cheque No" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <Input value={form.remarks} onChange={e => set('remarks', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!form.party_id) return toast.error('Select a party')
                if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter amount')
                setSaving(true)
                if (editId) await editMut.mutateAsync({ ...form, id: editId })
                else await addMut.mutateAsync(form)
                setSaving(false)
              }}
              disabled={saving}
            >
              {saving ? 'Saving…' : editId ? 'Update Advance' : 'Save Advance'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
