import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, today } from '@/lib/utils'
import { Card, CardHeader, Button, Select, Input, Modal, DateInput, Spinner, EmptyState } from '@/components/ui'
import { Plus, Trash2, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  txn_date: today(),
  txn_type: 'Credit',
  category: '',
  reference_no: '',
  description: '',
  amount: '',
}

export const BankLedgerPage: React.FC = () => {
  const qc = useQueryClient()
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  // Load bank accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bank_accounts')
        .select('id,bank_name,account_name,account_no,opening_balance')
        .eq('is_active', true)
        .order('bank_name')
      return data ?? []
    }
  })

  // Auto-select first account
  React.useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccount) {
      setSelectedAccount((accounts[0] as any).id)
    }
  }, [accounts])

  // Load transactions for selected account
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['bank_transactions', selectedAccount],
    queryFn: async () => {
      if (!selectedAccount) return []
      const { data } = await supabase
        .from('bank_transactions')
        .select('id,txn_date,txn_type,category,reference_no,description,amount,created_at')
        .eq('bank_account_id', selectedAccount)
        .order('txn_date', { ascending: true })
        .order('created_at', { ascending: true })
      return data ?? []
    },
    enabled: !!selectedAccount,
  })

  const selectedAccountData = accounts?.find((a: any) => a.id === selectedAccount)
  const openingBalance = (selectedAccountData as any)?.opening_balance ?? 0

  // Filter by date range and compute running balance
  const { filteredRows, summary } = useMemo(() => {
    if (!transactions) return { filteredRows: [], summary: { credits: 0, debits: 0, closing: 0 } }

    let running = openingBalance
    let credits = 0
    let debits = 0

    const allWithBalance = (transactions as any[]).map(t => {
      if (t.txn_type === 'Credit') {
        running += t.amount ?? 0
        credits += t.amount ?? 0
      } else {
        running -= t.amount ?? 0
        debits += t.amount ?? 0
      }
      return { ...t, balance: running }
    })

    // Apply date filter
    const filtered = allWithBalance.filter(t => {
      if (fromDate && t.txn_date < fromDate) return false
      if (toDate && t.txn_date > toDate) return false
      return true
    })

    const closing = filtered.length > 0 ? filtered[filtered.length - 1].balance : openingBalance

    return {
      filteredRows: filtered,
      summary: { credits, debits, closing },
    }
  }, [transactions, fromDate, toDate, openingBalance])

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bank_transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_transactions', selectedAccount] })
      toast.success('Transaction deleted')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const handleSubmit = async () => {
    if (!selectedAccount) return
    if (!form.txn_date || !form.amount) {
      toast.error('Date and amount are required')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('bank_transactions').insert({
      bank_account_id: selectedAccount,
      txn_date: form.txn_date,
      txn_type: form.txn_type,
      category: form.category || null,
      reference_no: form.reference_no || null,
      description: form.description || null,
      amount: parseFloat(form.amount) || 0,
    })
    setSaving(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Transaction saved')
      setShowModal(false)
      setForm({ ...EMPTY_FORM })
      qc.invalidateQueries({ queryKey: ['bank_transactions', selectedAccount] })
    }
  }

  const handleExportCSV = () => {
    if (!filteredRows.length) return
    const headers = ['Date', 'Type', 'Category', 'Description', 'Reference', 'Debit', 'Credit', 'Balance']
    const csvRows = filteredRows.map(t => [
      t.txn_date,
      t.txn_type,
      t.category ?? '',
      t.description ?? '',
      t.reference_no ?? '',
      t.txn_type === 'Debit' ? t.amount : '',
      t.txn_type === 'Credit' ? t.amount : '',
      t.balance,
    ])
    const csv = [headers, ...csvRows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bank-ledger-${selectedAccountData?.account_no ?? 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const accountOptions = (accounts ?? []).map((a: any) => ({
    value: a.id,
    label: `${a.bank_name} — ${a.account_no}`,
  }))

  return (
    <div className="space-y-4">
      <CardHeader
        title="Bank Ledger"
        subtitle="View and manage bank account transactions"
        action={
          <div className="flex items-center gap-3">
            <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)} disabled={!selectedAccount}>
              Add Transaction
            </Button>
            <Button icon={<Download size={16} />} variant="outline" onClick={handleExportCSV} disabled={!filteredRows.length}>
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Select
            label="Bank Account"
            value={selectedAccount}
            onChange={e => setSelectedAccount((e.target as HTMLSelectElement).value)}
            options={[{ value: '', label: '— Select Account —' }, ...accountOptions]}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
          <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
          <DateInput value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
        {(fromDate || toDate) && (
          <Button variant="outline" size="sm" onClick={() => { setFromDate(''); setToDate('') }}>Clear</Button>
        )}
      </div>

      {/* Summary cards */}
      {selectedAccount && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Opening Balance', value: inr(openingBalance), color: 'text-gray-700' },
            { label: 'Total Credits', value: inr(summary.credits), color: 'text-green-700' },
            { label: 'Total Debits', value: inr(summary.debits), color: 'text-red-600' },
            { label: 'Closing Balance', value: inr(summary.closing), color: summary.closing >= 0 ? 'text-blue-700' : 'text-red-600' },
          ].map(s => (
            <Card key={s.label}>
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Transaction table */}
      {accountsLoading || (selectedAccount && txLoading) ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : !selectedAccount ? (
        <EmptyState title="Select a bank account to view transactions" />
      ) : filteredRows.length === 0 ? (
        <EmptyState title="No transactions found" subtitle="Add a transaction to get started" />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-left">Reference</th>
                  <th className="px-3 py-2 text-right">Debit</th>
                  <th className="px-3 py-2 text-right">Credit</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((t, idx) => (
                  <tr key={t.id} className={`group ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-brand-50/30`}>
                    <td className="px-3 py-2 text-gray-600">{t.txn_date}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.txn_type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.txn_type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{t.category ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{t.description ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{t.reference_no ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-red-600">
                      {t.txn_type === 'Debit' ? inr(t.amount) : ''}
                    </td>
                    <td className="px-3 py-2 text-right text-green-700">
                      {t.txn_type === 'Credit' ? inr(t.amount) : ''}
                    </td>
                    <td className={`px-3 py-2 text-right font-semibold ${t.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                      {inr(t.balance)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => {
                          if (confirm('Delete this transaction?')) {
                            deleteMutation.mutate(t.id)
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Transaction Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Bank Transaction">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <DateInput value={form.txn_date} onChange={v => setForm(f => ({ ...f, txn_date: v }))} />
            </div>
            <Select
              label="Type"
              value={form.txn_type}
              onChange={e => setForm(f => ({ ...f, txn_type: (e.target as HTMLSelectElement).value }))}
              options={[
                { value: 'Credit', label: 'Credit' },
                { value: 'Debit', label: 'Debit' },
              ]}
            />
          </div>
          <Input
            label="Category"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            placeholder="e.g. Feed payment, Salary..."
          />
          <Input
            label="Reference No"
            value={form.reference_no}
            onChange={e => setForm(f => ({ ...f, reference_no: e.target.value }))}
            placeholder="Cheque / NEFT ref"
          />
          <Input
            label="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Transaction details..."
          />
          <Input
            label="Amount"
            type="number"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            placeholder="0.00"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
