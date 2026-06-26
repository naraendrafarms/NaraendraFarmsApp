import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate, inr, today } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState, DateInput
} from '@/components/ui'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  advance_date: today(),
  party_id: '',
  amount: '',
  payment_mode: 'cash',
  reference_no: '',
  remarks: '',
}

const MODES = ['cash', 'upi', 'cheque', 'bank_transfer', 'neft', 'rtgs']

export const BuyerAdvancesPage: React.FC = () => {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [filterParty, setFilterParty] = useState('')

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

  const addMut = useMutation({
    mutationFn: async (row: typeof EMPTY) => {
      const { error } = await supabase.from('party_advances').insert({
        advance_date: row.advance_date,
        party_id: row.party_id,
        amount: parseFloat(row.amount) || 0,
        payment_mode: row.payment_mode,
        reference_no: row.reference_no || null,
        remarks: row.remarks || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['party_advances'] })
      toast.success('Advance saved')
      setShowModal(false)
      setForm({ ...EMPTY })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('party_advances').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['party_advances'] })
      toast.success('Deleted')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const totalReceived = advances.reduce((s, a: any) => s + (a.amount ?? 0), 0)
  const totalUsed = advances.reduce((s, a: any) => s + (a.amount_used ?? 0), 0)
  const totalBalance = totalReceived - totalUsed

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <SectionHeader
        title="Buyer Advances"
        subtitle="Record advances received from buyers — deducted when sale payment is received"
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} className="mr-1" /> Add Advance
          </Button>
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
      <Card className="p-3">
        <Select
          value={filterParty}
          onChange={e => setFilterParty(e.target.value)}
          className="max-w-xs"
        >
          <option value="">— All Parties —</option>
          {parties.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? <Spinner /> : advances.length === 0 ? (
          <EmptyState message="No advances recorded yet" />
        ) : (
          <Table>
            <thead>
              <tr>
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
                    <Td>{fmtDate(a.advance_date)}</Td>
                    <Td className="font-medium">{a.parties?.name ?? '—'}</Td>
                    <Td><Badge color="blue">{a.payment_mode}</Badge></Td>
                    <Td className="text-xs text-gray-500">{a.reference_no ?? '—'}</Td>
                    <Td className="text-xs text-gray-500">{a.remarks ?? '—'}</Td>
                    <Td className="text-right text-green-700 font-medium">{inr(a.amount)}</Td>
                    <Td className="text-right text-red-600">{inr(a.amount_used)}</Td>
                    <Td className="text-right font-bold text-blue-700">{inr(bal)}</Td>
                    <Td>
                      {bal === (a.amount ?? 0) && (
                        <button
                          onClick={() => { if (confirm('Delete this advance?')) delMut.mutate(a.id) }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Buyer Advance">
        <div className="space-y-4 p-1">
          <FormRow label="Date *">
            <DateInput value={form.advance_date} onChange={v => set('advance_date', v)} />
          </FormRow>
          <FormRow label="Party *">
            <Select value={form.party_id} onChange={e => set('party_id', e.target.value)}>
              <option value="">— Select Party —</option>
              {parties.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </FormRow>
          <FormRow label="Amount *">
            <Input
              type="number"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder="0.00"
            />
          </FormRow>
          <FormRow label="Payment Mode">
            <Select value={form.payment_mode} onChange={e => set('payment_mode', e.target.value)}>
              {MODES.map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
            </Select>
          </FormRow>
          <FormRow label="Reference No">
            <Input value={form.reference_no} onChange={e => set('reference_no', e.target.value)} placeholder="UTR / Cheque No" />
          </FormRow>
          <FormRow label="Remarks">
            <Input value={form.remarks} onChange={e => set('remarks', e.target.value)} />
          </FormRow>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!form.party_id) return toast.error('Select a party')
                if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter amount')
                setSaving(true)
                await addMut.mutateAsync(form)
                setSaving(false)
              }}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Advance'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
