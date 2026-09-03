import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyDbError, fmtDate } from '@/lib/utils'
import {
  Card, Button, Input, Select, Modal, Table, Th, Td, Badge,
  Spinner, EmptyState, CardHeader, DateInput,
} from '@/components/ui'
import { Plus, Edit2, Wallet, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { moduleLevel } from '@/lib/auth'

// The cash imprest accounts -- who is physically holding company cash.
//
// This exists because cash_book.farm_id was doing two jobs at once: which SITE
// bears a cost, and (implicitly) where the cash sits. It could only ever record
// one of them, so cash received AT a site INTO Mandal Imprest was unrecordable
// and no holder could ever show a balance. cash_book.cash_account_id now
// carries the second job; farm_id keeps its exact previous meaning.
//
// Balance = opening balance + receipts - payments, read from v_cash_account_balance.
// Every account currently reads its opening balance only, because no historical
// cash_book row was assigned to an imprest -- those rows never recorded which
// box the money was in, and inventing it would put false balances on accounts
// carrying real people's names.

const ACCT_TYPES = [
  { value: 'ho_imprest',     label: 'HO Imprest' },
  { value: 'mandal_imprest', label: 'Mandal Imprest' },
  { value: 'site_petty',     label: 'Site Petty Cash' },
  { value: 'person',         label: 'Person (individual imprest)' },
]

const TYPE_COLOR: Record<string, any> = {
  ho_imprest: 'blue', mandal_imprest: 'orange', site_petty: 'gray', person: 'green',
}

const rupee = (n: number) =>
  '₹' + Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const CashAccounts: React.FC = () => {
  const qc = useQueryClient()
  const canEdit = moduleLevel('masters') === 'full'

  const [sel, setSel] = useState<Set<string>>(new Set())
  const [deleteRows, setDeleteRows] = useState<any[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', acct_type: 'person', opening_balance: '', opening_date: '',
    is_active: true, remarks: '',
  })
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const { data: rows, isLoading } = useQuery({
    queryKey: ['cash_account_balances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_cash_account_balance').select('*').order('sort_order')
      if (error) throw error
      return data ?? []
    },
  })

  // The editable master row, kept separate from the balance view so remarks and
  // the opening date can be edited without the view needing to carry them.
  const { data: masters } = useQuery({
    queryKey: ['cash_accounts_master'],
    queryFn: async () => {
      const { data } = await supabase.from('cash_accounts').select('*').order('sort_order')
      return data ?? []
    },
  })

  const open = (row?: any) => {
    const m = row ? (masters ?? []).find((x: any) => x.id === row.cash_account_id) : null
    setEditing(row ?? null)
    setForm(row ? {
      name: row.name ?? '',
      acct_type: row.acct_type ?? 'person',
      opening_balance: row.opening_balance != null ? String(row.opening_balance) : '',
      opening_date: row.opening_date ?? '',
      is_active: row.is_active ?? true,
      remarks: m?.remarks ?? '',
    } : { name: '', acct_type: 'person', opening_balance: '', opening_date: '', is_active: true, remarks: '' })
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('Name is required')
      const payload = {
        name: form.name.trim(),
        acct_type: form.acct_type,
        opening_balance: form.opening_balance.trim() === '' ? 0 : Number(form.opening_balance),
        opening_date: form.opening_date || null,
        is_active: form.is_active,
        remarks: form.remarks.trim() || null,
      }
      const { error } = editing
        ? await supabase.from('cash_accounts').update(payload).eq('id', editing.cash_account_id)
        : await supabase.from('cash_accounts').insert(payload)
      if (error) throw new Error(friendlyDbError(error))
    },
    onSuccess: () => {
      toast.success(editing ? 'Imprest account updated' : 'Imprest account added')
      qc.invalidateQueries({ queryKey: ['cash_account_balances'] })
      qc.invalidateQueries({ queryKey: ['cash_accounts_master'] })
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message),
  })

  // An account with entries is NOT deletable: the entries would lose their
  // holder and the cash would vanish from every balance. Deactivating keeps the
  // history and stops new entries, which is what "no longer used" really means.
  const delMut = useMutation({
    mutationFn: async () => {
      const targets = deleteRows ?? []
      const holding = targets.filter((r: any) => Number(r.txn_count ?? 0) > 0)
      if (holding.length) {
        throw new Error(
          `${holding.map((r: any) => r.name).join(', ')} still hold entries. ` +
          'Deactivate instead — deleting would detach those entries from any account.')
      }
      const { error } = await supabase.from('cash_accounts')
        .delete().in('id', targets.map((r: any) => r.cash_account_id))
      if (error) throw new Error(friendlyDbError(error))
      return targets.length
    },
    onSuccess: (n) => {
      toast.success(`Deleted ${n} account${n === 1 ? '' : 's'}`)
      qc.invalidateQueries({ queryKey: ['cash_account_balances'] })
      qc.invalidateQueries({ queryKey: ['cash_accounts_master'] })
      setSel(new Set()); setDeleteRows(null)
    },
    onError: (e: any) => { toast.error(e.message); setDeleteRows(null) },
  })

  const ids = (rows ?? []).map((r: any) => r.cash_account_id)
  const allSel = ids.length > 0 && ids.every((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(p => {
    const n = new Set(p)
    allSel ? ids.forEach((id: string) => n.delete(id)) : ids.forEach((id: string) => n.add(id))
    return n
  })

  const totalBal = (rows ?? []).reduce((a: number, r: any) => a + Number(r.balance ?? 0), 0)
  const anyTxns = (rows ?? []).some((r: any) => Number(r.txn_count ?? 0) > 0)

  return (
    <div className="space-y-4">
      <CardHeader
        title="Cash Imprest Accounts"
        subtitle="Who is physically holding company cash — HO, Mandal, and each person's imprest"
        action={canEdit
          ? <div className="flex gap-2">
              {sel.size > 0 && (
                <Button variant="outline" size="sm" icon={<Trash2 size={16} />}
                  onClick={() => setDeleteRows((rows ?? []).filter((r: any) => sel.has(r.cash_account_id)))}>
                  Delete {sel.size}
                </Button>
              )}
              <Button icon={<Plus size={16} />} onClick={() => open()}>Add Account</Button>
            </div>
          : <Badge color="gray">View only</Badge>} />

      {!anyTxns && (
        <Card>
          <p className="text-sm text-gray-600">
            <strong>No cash book entry is assigned to an imprest account yet</strong>, so every balance
            below is just its opening balance. The 1,260 existing cash book rows record which <em>site</em>
            bore each cost, but never which cash box the money was in — so they have deliberately been left
            unassigned rather than guessed at. Set an opening balance and date on each account below to
            start from a known figure.
          </p>
        </Card>
      )}

      {isLoading ? <Spinner /> : !rows?.length ? (
        <EmptyState title="No imprest accounts" subtitle="Add one to begin." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rows.map((r: any) => (
              <Card key={r.cash_account_id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                      <Wallet size={14} />
                      <Badge color={TYPE_COLOR[r.acct_type] ?? 'gray'}>
                        {ACCT_TYPES.find(t => t.value === r.acct_type)?.label ?? r.acct_type}
                      </Badge>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm leading-snug">{r.name}</p>
                    <p className={`text-lg font-bold mt-1 ${Number(r.balance) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {rupee(r.balance)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {Number(r.txn_count ?? 0) === 0
                        ? 'no entries yet'
                        : `${r.txn_count} entries · in ${rupee(r.total_in)} · out ${rupee(r.total_out)}`}
                    </p>
                    {!r.is_active && <Badge color="gray">Inactive</Badge>}
                  </div>
                  {canEdit && (
                    <button onClick={() => open(r)} className="text-brand-600 hover:text-brand-800 shrink-0">
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Card padding={false}>
            <div className="overflow-x-auto">
              <Table>
                <thead><tr>
                  {canEdit && <Th><input type="checkbox" checked={allSel} onChange={toggleAll}
                    className="rounded border-gray-300 text-brand-600" /></Th>}
                  <Th>Account</Th><Th>Type</Th>
                  <Th right>Opening</Th><Th>Opening Date</Th>
                  <Th right>Received</Th><Th right>Paid</Th><Th right>Balance</Th>
                  <Th right>Entries</Th><Th>Status</Th>{canEdit && <Th></Th>}
                </tr></thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr key={r.cash_account_id} className={`hover:bg-gray-50 ${sel.has(r.cash_account_id) ? 'bg-blue-50' : ''}`}>
                      {canEdit && <Td><input type="checkbox" checked={sel.has(r.cash_account_id)}
                        onChange={() => toggle(r.cash_account_id)}
                        className="rounded border-gray-300 text-brand-600" /></Td>}
                      <Td>{r.name}</Td>
                      <Td><Badge color={TYPE_COLOR[r.acct_type] ?? 'gray'}>
                        {ACCT_TYPES.find(t => t.value === r.acct_type)?.label ?? r.acct_type}</Badge></Td>
                      <Td right>{rupee(r.opening_balance)}</Td>
                      <Td>{r.opening_date ? fmtDate(r.opening_date) : <span className="text-amber-600">not set</span>}</Td>
                      <Td right>{rupee(r.total_in)}</Td>
                      <Td right>{rupee(r.total_out)}</Td>
                      <Td right><strong className={Number(r.balance) < 0 ? 'text-red-600' : ''}>{rupee(r.balance)}</strong></Td>
                      <Td right className="text-gray-500">{r.txn_count}</Td>
                      <Td>{r.is_active ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}</Td>
                      {canEdit && (
                        <Td>
                          <div className="flex gap-2">
                            <button onClick={() => open(r)} className="text-brand-600 hover:text-brand-800">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => setDeleteRows([r])} className="text-red-500 hover:text-red-700">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </Td>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <Td colSpan={canEdit ? 7 : 6}>TOTAL cash held across all imprests</Td>
                    <Td right>{rupee(totalBal)}</Td>
                    <Td colSpan={canEdit ? 3 : 2}></Td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}

      <Modal open={!!deleteRows} onClose={() => setDeleteRows(null)} title="Delete imprest account">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Delete <strong>{(deleteRows ?? []).map((r: any) => r.name).join(', ')}</strong>?
          </p>
          {(deleteRows ?? []).some((r: any) => Number(r.txn_count ?? 0) > 0) ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              One or more of these still hold cash book entries, so they cannot be deleted —
              the entries would lose their holder and that cash would disappear from every
              balance. <strong>Untick Active</strong> on the account instead: the history stays
              and no new entry can be added to it.
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700">
              These hold no entries, so nothing is lost. Any entry added later at a site whose
              imprest is gone would fall back to HO Imprest.
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteRows(null)}>Cancel</Button>
            <Button loading={delMut.isPending} onClick={() => delMut.mutate()}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editing ? 'Edit Imprest Account' : 'Add Imprest Account'}>
        <div className="space-y-4">
          <Input label="Account Name" required value={form.name}
            onChange={e => s('name', e.target.value)}
            placeholder="e.g. Dendi Srinath Reddy Imprest" />
          <Select label="Type" value={form.acct_type}
            onChange={e => s('acct_type', (e.target as HTMLSelectElement).value)}
            options={ACCT_TYPES} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Opening Balance (₹)" type="number" step="0.01"
              value={form.opening_balance} onChange={e => s('opening_balance', e.target.value)}
              hint="Cash this account held on the opening date" />
            <DateInput label="Opening Date" value={form.opening_date}
              onChange={e => s('opening_date', e.target.value)} />
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            The opening date is the cutover: entries from that date build the balance on top of the
            opening figure. Cash book rows before it stay unassigned rather than being guessed at.
          </p>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active}
              onChange={e => s('is_active', e.target.checked)}
              className="rounded border-gray-300 text-brand-600" />
            Active
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
