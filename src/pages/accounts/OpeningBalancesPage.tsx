import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, currentFY } from '@/lib/utils'
import { Card, CardHeader, Button, Input, Select, Table, Th, Td, Spinner, EmptyState, DateInput, Badge } from '@/components/ui'
import { Plus, Trash2, Save, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'

const FY_OPTIONS = ['2024-25', '2025-26', '2026-27', '2027-28']
const fyStartDate = (fy: string) => `${fy.split('-')[0]}-04-01`

export const OpeningBalancesPage: React.FC = () => {
  const qc = useQueryClient()
  const [fy, setFy] = useState(currentFY())
  const [kind, setKind] = useState<'party' | 'partner'>('party')
  const [targetId, setTargetId] = useState('')
  const [amount, setAmount] = useState('')
  const [drcr, setDrcr] = useState<'Dr' | 'Cr'>('Dr')
  const [remarks, setRemarks] = useState('')

  const { data: parties = [] } = useQuery({
    queryKey: ['parties_all_ob'],
    queryFn: async () => { const { data } = await supabase.from('parties').select('id,name,type').eq('is_active', true).order('name'); return data ?? [] }
  })
  const { data: partners = [] } = useQuery({
    queryKey: ['partners_ob'],
    queryFn: async () => { const { data } = await supabase.from('partners').select('id,name').eq('is_active', true).order('name'); return data ?? [] }
  })

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['opening_balances', fy],
    queryFn: async () => {
      const { data } = await supabase.from('opening_balances')
        .select('id,fy,as_of_date,party_id,partner_id,amount,dr_cr,remarks,parties(name),partners(name)')
        .eq('fy', fy).order('as_of_date')
      return data ?? []
    }
  })

  const inv = () => {
    qc.invalidateQueries({ queryKey: ['opening_balances', fy] })
    qc.invalidateQueries({ queryKey: ['party_ledger'] })
    qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
    qc.invalidateQueries({ queryKey: ['pending_payments_open'] })
    qc.invalidateQueries({ queryKey: ['cms_pending_payments'] })
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!targetId) throw new Error(`Select a ${kind}`)
      const amt = parseFloat(amount) || 0
      if (amt <= 0) throw new Error('Enter an amount')
      const asOf = fyStartDate(fy)
      const payload: any = {
        fy, as_of_date: asOf, amount: amt, dr_cr: drcr, remarks: remarks || null,
        party_id: kind === 'party' ? targetId : null,
        partner_id: kind === 'partner' ? targetId : null,
      }
      const { data: obRow, error } = await supabase.from('opening_balances').insert(payload).select('id').single()
      if (error) throw error

      // Payable openings (Cr = we owe them) → create a payable bill so it can be paid & bank-linked
      if (drcr === 'Cr' && obRow) {
        const name = kind === 'party'
          ? (parties as any[]).find((p: any) => p.id === targetId)?.name
          : (partners as any[]).find((p: any) => p.id === targetId)?.name
        const { error: ppErr } = await supabase.from('pending_payments').insert({
          vendor_name: name ?? 'Opening',
          party_id: kind === 'party' ? targetId : null,
          partner_id: kind === 'partner' ? targetId : null,
          is_opening: true,
          opening_balance_id: obRow.id,
          invoice_no: `OPENING-${fy}`,
          invoice_amount: amt, net_payable: amt,
          invoice_date: asOf, grn_date: asOf, pay_before_date: asOf,
          payment_type: 'NEFT', payment_status: 'Pending', po_raised_by: 'Opening',
        })
        if (ppErr) throw ppErr
      }
    },
    onSuccess: () => {
      toast.success('Opening balance saved')
      inv()
      qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_open'] })
      qc.invalidateQueries({ queryKey: ['cms_pending_payments'] })
      setTargetId(''); setAmount(''); setRemarks('')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('opening_balances').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { toast.success('Deleted'); inv() },
    onError: (e: any) => toast.error(e.message)
  })

  // Partner default is Cr (we owe them); buyer default Dr; supplier default Cr
  const onKind = (k: 'party' | 'partner') => { setKind(k); setTargetId(''); setDrcr(k === 'partner' ? 'Cr' : 'Dr') }

  const targetOptions = kind === 'party'
    ? (parties as any[]).map((p: any) => ({ value: p.id, label: `${p.name}${p.type ? ` (${p.type})` : ''}` }))
    : (partners as any[]).map((p: any) => ({ value: p.id, label: p.name }))

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <CardHeader title="Opening Balances" subtitle="Enter financial-year opening dues for suppliers, buyers & partners — shows as the opening row in Party Ledger" />

      <Card className="p-3 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Financial Year</label>
          <Select value={fy} onChange={e => setFy(e.target.value)} options={FY_OPTIONS.map(f => ({ value: f, label: `FY ${f}` }))} />
        </div>
        <div className="text-xs text-gray-400">Opening dated <strong>{fyStartDate(fy)}</strong></div>
      </Card>

      {/* Add form */}
      <Card className="space-y-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {([['party', 'Buyer / Supplier'], ['partner', 'Partner']] as [any, string][]).map(([k, l]) => (
            <button key={k} onClick={() => onKind(k)}
              className={`px-3 py-1 text-xs rounded-md ${kind === k ? 'bg-white shadow font-semibold text-brand-700' : 'text-gray-500'}`}>{l}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">{kind === 'party' ? 'Buyer / Supplier' : 'Partner'} *</label>
            <Select value={targetId} onChange={e => setTargetId(e.target.value)}
              options={[{ value: '', label: '— Select —' }, ...targetOptions]} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Opening Amount *</label>
            <Input label="" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <Select value={drcr} onChange={e => setDrcr(e.target.value as any)}
              options={[{ value: 'Dr', label: 'Dr — they owe us (receivable)' }, { value: 'Cr', label: 'Cr — we owe them (payable)' }]} />
          </div>
        </div>
        <Input label="Remarks" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="optional" />
        <Button size="sm" icon={<Save size={14} />} onClick={() => save.mutate()} loading={save.isPending}>Add Opening Balance</Button>
      </Card>

      {/* List */}
      <Card padding={false}>
        {isLoading ? <Spinner /> : !rows.length ? (
          <EmptyState icon={<Wallet size={32} />} title={`No opening balances for FY ${fy}`} subtitle="Add them above" />
        ) : (
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>Name</Th><Th>Kind</Th><Th right>Amount</Th><Th>Type</Th><Th>Remarks</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(rows as any[]).map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td className="text-xs">{r.as_of_date}</Td>
                  <Td className="font-medium">{r.parties?.name ?? r.partners?.name ?? '—'}</Td>
                  <Td className="text-xs text-gray-500">{r.party_id ? 'Party' : 'Partner'}</Td>
                  <Td right className="font-semibold">{inr(r.amount ?? 0)}</Td>
                  <Td><Badge color={r.dr_cr === 'Dr' ? 'orange' : 'green'}>{r.dr_cr === 'Dr' ? 'Receivable (Dr)' : 'Payable (Cr)'}</Badge></Td>
                  <Td className="text-xs text-gray-400">{r.remarks ?? '—'}</Td>
                  <Td>
                    <button onClick={() => { if (confirm('Delete this opening balance?')) del.mutate(r.id) }}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="text-xs text-gray-400 px-1 space-y-1">
        <p><strong>Dr (Receivable)</strong> — used for buyers who owed you money at the start of the year.</p>
        <p><strong>Cr (Payable)</strong> — used for suppliers / partners you owed money to at the start of the year.</p>
        <p>Party opening balances appear as the first row in <strong>Accounts → Party Ledger</strong>.</p>
      </div>
    </div>
  )
}
