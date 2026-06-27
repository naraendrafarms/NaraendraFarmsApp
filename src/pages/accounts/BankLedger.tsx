import React, { useMemo, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, today } from '@/lib/utils'
import { Card, CardHeader, Button, Select, Input, Modal, DateInput, Spinner, EmptyState } from '@/components/ui'
import { Plus, Trash2, Download, Upload, CheckCircle2, AlertCircle, Link2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  txn_date: today(),
  txn_type: 'Credit',
  category: '',
  reference_no: '',
  description: '',
  amount: '',
}

// ── Kotak CSV parser ─────────────────────────────────────────────────────────

type ParsedRow = {
  value_date: string      // YYYY-MM-DD
  description: string
  reference: string
  amount: number
  txn_type: 'Debit' | 'Credit'
  statement_balance: number
  category: string
}

function parseIndianNumber(s: string): number {
  return parseFloat((s ?? '').replace(/,/g, '').trim()) || 0
}

function parseDDMMYYYY(s: string): string {
  // "15-06-2026" → "2026-06-15"
  const parts = (s ?? '').trim().split('-')
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return ''
}

function autoCategory(desc: string, ref: string, txnType: 'Debit' | 'Credit'): string {
  const text = `${desc} ${ref}`.toUpperCase()
  if (text.includes('SALARY') || text.includes('PAYROLL')) return 'Salary'
  if (text.includes('ELECTRICITY') || text.includes('MSEDCL') || text.includes('TNEB') || text.includes('BESCOM')) return 'Electricity'
  if (text.includes('ATM') && txnType === 'Debit') return 'Cash Withdrawal'
  if ((text.includes('BANK CHARGES') || text.includes('ANNUAL FEE') || text.includes('SERVICE CHARGE') || text.includes('GST ON')) && txnType === 'Debit') return 'Bank Charges'
  if (txnType === 'Debit' && (text.includes('FCM') || text.includes('CMS') || text.includes('NEFT') || text.includes('RTGS') || text.includes('IMPS'))) return 'Vendor Payment'
  if (txnType === 'Credit') return 'Customer Receipt'
  return ''
}

function parseKotakCSV(text: string): ParsedRow[] {
  const lines = text.split('\n').map(l => l.replace(/\r/g, ''))

  // Find the header row (contains "Transaction Date" or "Value Date")
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('value date') || lines[i].toLowerCase().includes('transaction date')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) throw new Error('Could not find header row in CSV. Expected a row with "Value Date" or "Transaction Date".')

  const rows: ParsedRow[] = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Stop at closing balance row
    if (line.toLowerCase().includes('closing balance') || line.toLowerCase().startsWith('opening balance')) continue

    // Split CSV respecting quoted fields
    const cols = splitCSV(line)
    if (cols.length < 6) continue

    // Col layout (Kotak CC statement): 0=Sl, 1=TxnDate, 2=ValueDate, 3=Description, 4=Reference, 5=Amount, 6=Dr/Cr, 7=Balance
    // But some Kotak formats: 0=TxnDate, 1=ValueDate, 2=Description, 3=Reference, 4=Amount, 5=Dr/Cr, 6=Balance
    // Detect by checking if col[0] is a number (Sl No) or a date
    let offset = 0
    if (/^\d+$/.test(cols[0].trim())) offset = 1 // skip Sl No column

    const valueDate = parseDDMMYYYY(cols[offset + 1]?.trim() || cols[offset]?.trim())
    const description = cols[offset + 2]?.trim() ?? ''
    const reference = cols[offset + 3]?.trim() ?? ''
    const amountStr = cols[offset + 4]?.trim() ?? ''
    const drCr = cols[offset + 5]?.trim().toUpperCase() ?? ''
    const balanceStr = cols[offset + 6]?.trim() ?? ''

    if (!valueDate || !amountStr) continue

    const amount = parseIndianNumber(amountStr)
    if (amount <= 0) continue

    const txnType: 'Debit' | 'Credit' = drCr === 'DR' || drCr === 'DEBIT' ? 'Debit' : 'Credit'
    const statement_balance = parseIndianNumber(balanceStr)
    const category = autoCategory(description, reference, txnType)

    rows.push({ value_date: valueDate, description, reference, amount, txn_type: txnType, statement_balance, category })
  }
  return rows
}

function splitCSV(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

// ── Main component ────────────────────────────────────────────────────────────

export const BankLedgerPage: React.FC = () => {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'ledger' | 'import'>('ledger')
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Import state
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState<{ inserted: number; autoMatched: number } | null>(null)
  const [editCats, setEditCats] = useState<Record<number, string>>({})

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

  const selectedAccountData = (accounts as any[])?.find((a: any) => a.id === selectedAccount)
  const openingBalance = selectedAccountData?.opening_balance ?? 0

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

    const filtered = allWithBalance.filter(t => {
      if (fromDate && t.txn_date < fromDate) return false
      if (toDate && t.txn_date > toDate) return false
      return true
    })

    const closing = filtered.length > 0 ? filtered[filtered.length - 1].balance : openingBalance

    return {
      // Balance computed oldest→newest; display newest first (latest date on top)
      filteredRows: filtered.slice().reverse(),
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('bank_transactions').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_transactions', selectedAccount] })
      setSelectedIds(new Set())
      toast.success('Selected transactions deleted')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRows.map((t: any) => t.id)))
    }
  }

  const openAdd = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  const openEdit = (t: any) => {
    setEditId(t.id)
    setForm({
      txn_date: t.txn_date ?? today(),
      txn_type: t.txn_type ?? 'Credit',
      category: t.category ?? '',
      reference_no: t.reference_no ?? '',
      description: t.description ?? '',
      amount: t.amount != null ? String(t.amount) : '',
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!selectedAccount) return
    if (!form.txn_date || !form.amount) {
      toast.error('Date and amount are required')
      return
    }
    setSaving(true)
    const payload = {
      bank_account_id: selectedAccount,
      txn_date: form.txn_date,
      txn_type: form.txn_type,
      category: form.category || null,
      reference_no: form.reference_no || null,
      description: form.description || null,
      amount: parseFloat(form.amount) || 0,
    }
    const { error } = editId
      ? await supabase.from('bank_transactions').update(payload).eq('id', editId)
      : await supabase.from('bank_transactions').insert(payload)
    setSaving(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(editId ? 'Transaction updated' : 'Transaction saved')
      setShowModal(false)
      setForm({ ...EMPTY_FORM })
      setEditId(null)
      qc.invalidateQueries({ queryKey: ['bank_transactions', selectedAccount] })
    }
  }

  const handleExportCSV = () => {
    if (!filteredRows.length) return
    const headers = ['Date', 'Type', 'Category', 'Description', 'Reference', 'Debit', 'Credit', 'Balance']
    const csvRows = filteredRows.map((t: any) => [
      t.txn_date, t.txn_type, t.category ?? '', t.description ?? '', t.reference_no ?? '',
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

  // ── CSV file handling ────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError('')
    setParsedRows([])
    setImportDone(null)
    setEditCats({})

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const rows = parseKotakCSV(text)
        if (rows.length === 0) {
          setParseError('No data rows found. Check that the CSV is a Kotak bank statement.')
        } else {
          setParsedRows(rows)
        }
      } catch (err: any) {
        setParseError(err.message ?? 'Failed to parse CSV')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleImport = async () => {
    if (!selectedAccount || parsedRows.length === 0) return
    setImporting(true)

    // Fetch pending payments for auto-match (Debit rows only)
    const { data: payments } = await supabase
      .from('pending_payments')
      .select('id,vendor_name,net_payable,invoice_amount,paid_amount,discount_amount,transaction_ref')
      .neq('payment_status', 'Paid')

    const pendingList = (payments ?? []) as any[]

    let insertedCount = 0
    let autoMatchedCount = 0

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i]
      const category = editCats[i] !== undefined ? editCats[i] : row.category

      // Try auto-match for debit rows
      let linkedPaymentId: string | null = null
      let matchStatus = 'waiting'

      if (row.txn_type === 'Debit') {
        const matched = pendingList.find(p => {
          const balance = Math.max(0, (p.net_payable ?? p.invoice_amount ?? 0) - (p.paid_amount ?? 0) - (p.discount_amount ?? 0))
          const amtMatch = Math.abs(balance - row.amount) < 1
          const refMatch = row.reference && p.transaction_ref &&
            (row.reference.toLowerCase().includes(p.transaction_ref.toLowerCase()) ||
             p.transaction_ref.toLowerCase().includes(row.reference.toLowerCase()))
          return amtMatch || refMatch
        })
        if (matched) {
          linkedPaymentId = matched.id
          matchStatus = 'auto_matched'
        }
      } else {
        matchStatus = 'waiting'
      }

      const { error } = await supabase.from('bank_transactions').insert({
        bank_account_id: selectedAccount,
        txn_date: row.value_date,
        txn_type: row.txn_type,
        category: category || null,
        reference_no: row.reference || null,
        description: row.description || null,
        amount: row.amount,
        statement_balance: row.statement_balance || null,
        imported: true,
        match_status: matchStatus,
        linked_payment_id: linkedPaymentId,
      })
      if (!error) {
        insertedCount++
        if (matchStatus === 'auto_matched' && linkedPaymentId) {
          autoMatchedCount++
          // Mark payment as Paid
          const p = pendingList.find(x => x.id === linkedPaymentId)
          if (p) {
            const balance = Math.max(0, (p.net_payable ?? p.invoice_amount ?? 0) - (p.paid_amount ?? 0) - (p.discount_amount ?? 0))
            await supabase.from('pending_payments').update({
              paid_amount: (p.paid_amount ?? 0) + balance,
              paid_date: row.value_date,
              payment_status: 'Paid',
              transaction_ref: row.reference || null,
            }).eq('id', linkedPaymentId)
          }
        }
      }
    }

    setImporting(false)
    setImportDone({ inserted: insertedCount, autoMatched: autoMatchedCount })
    setParsedRows([])
    qc.invalidateQueries({ queryKey: ['bank_transactions', selectedAccount] })
    qc.invalidateQueries({ queryKey: ['pending_payments_page'] })
    qc.invalidateQueries({ queryKey: ['bank_txn_waiting'] })
  }

  const accountOptions = (accounts ?? []).map((a: any) => ({
    value: a.id,
    label: `${a.bank_name} — ${a.account_no}`,
  }))

  const CATEGORIES = ['', 'Vendor Payment', 'Partner Remuneration', 'Salary', 'Electricity', 'Bank Charges', 'Cash Withdrawal', 'Customer Receipt', 'Other']

  return (
    <div className="space-y-4">
      <CardHeader
        title="Bank Ledger"
        subtitle="View and manage bank account transactions"
        action={
          <div className="flex items-center gap-3">
            {tab === 'ledger' && (
              <>
                <Button icon={<Plus size={16} />} onClick={openAdd} disabled={!selectedAccount}>
                  Add Transaction
                </Button>
                <Button icon={<Download size={16} />} variant="outline" onClick={handleExportCSV} disabled={!filteredRows.length}>
                  Export CSV
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Account selector */}
      <div className="w-72">
        <Select
          label="Bank Account"
          value={selectedAccount}
          onChange={e => setSelectedAccount((e.target as HTMLSelectElement).value)}
          options={[{ value: '', label: '— Select Account —' }, ...accountOptions]}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([
          { key: 'ledger', label: 'Transactions' },
          { key: 'import', label: 'Import Statement' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Ledger tab ── */}
      {tab === 'ledger' && (
        <>
          {/* Date filter */}
          <div className="flex flex-wrap items-end gap-3">
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
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-200 text-sm">
                  <span className="text-red-700 font-medium">{selectedIds.size} selected</span>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    loading={bulkDeleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete ${selectedIds.size} selected transaction(s)?`)) {
                        bulkDeleteMutation.mutate([...selectedIds])
                      }
                    }}
                  >
                    Delete Selected
                  </Button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                      <th className="px-3 py-2 w-8">
                        <input
                          type="checkbox"
                          checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-left">Reference</th>
                      <th className="px-3 py-2 text-right">Debit</th>
                      <th className="px-3 py-2 text-right">Credit</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                      <th className="px-3 py-2 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((t: any, idx: number) => (
                      <tr key={t.id} className={`group ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-brand-50/30`}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(t.id)}
                            onChange={() => toggleSelect(t.id)}
                          />
                        </td>
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
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEdit(t)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-opacity"
                          >
                            <Pencil size={14} />
                          </button>
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
        </>
      )}

      {/* ── Import Statement tab ── */}
      {tab === 'import' && (
        <div className="space-y-5">
          {!selectedAccount ? (
            <EmptyState title="Select a bank account first" />
          ) : (
            <>
              {/* Upload area */}
              <Card>
                <div className="space-y-3">
                  <div className="font-semibold text-gray-800">Upload Kotak Bank Statement (CSV)</div>
                  <div className="text-sm text-gray-500">
                    Download your statement from Kotak Net Banking → Account → Transaction History → Export CSV.
                    The file should start with account details followed by transaction rows.
                  </div>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Upload size={16} /> Choose CSV file
                  </button>
                  {parseError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
                      <AlertCircle size={16} /> {parseError}
                    </div>
                  )}
                </div>
              </Card>

              {/* Import success message */}
              {importDone && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                  <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                  <div>
                    <div className="font-semibold">Import complete</div>
                    <div>{importDone.inserted} transactions imported · {importDone.autoMatched} auto-matched to vendor payments</div>
                    {importDone.inserted - importDone.autoMatched > 0 && (
                      <div className="text-green-700 mt-0.5">
                        {importDone.inserted - importDone.autoMatched} transactions moved to <strong>Accounts → Pending Payments → Waiting to Link</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview table */}
              {parsedRows.length > 0 && (
                <Card padding={false}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="font-semibold text-gray-800">{parsedRows.length} transactions found — review before importing</div>
                    <Button onClick={handleImport} loading={importing} icon={<Link2 size={15} />}>
                      Import &amp; Auto-match
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 uppercase border-b border-gray-100">
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-left">Description</th>
                          <th className="px-3 py-2 text-left">Reference</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2 text-right">Balance</th>
                          <th className="px-3 py-2 text-left">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((r, i) => (
                          <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                            <td className="px-3 py-1.5 text-gray-600">{r.value_date}</td>
                            <td className="px-3 py-1.5">
                              <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${r.txn_type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {r.txn_type}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-gray-700 max-w-[200px] truncate">{r.description || '—'}</td>
                            <td className="px-3 py-1.5 text-gray-500 max-w-[140px] truncate">{r.reference || '—'}</td>
                            <td className={`px-3 py-1.5 text-right font-semibold ${r.txn_type === 'Debit' ? 'text-red-600' : 'text-green-700'}`}>
                              {inr(r.amount)}
                            </td>
                            <td className="px-3 py-1.5 text-right text-gray-600">{inr(r.statement_balance)}</td>
                            <td className="px-3 py-1.5">
                              <select
                                value={editCats[i] !== undefined ? editCats[i] : r.category}
                                onChange={e => setEditCats(ec => ({ ...ec, [i]: e.target.value }))}
                                className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white"
                              >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c || '(auto)'}</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Bank Transaction' : 'Add Bank Transaction'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <DateInput value={form.txn_date} onChange={e => setForm(f => ({ ...f, txn_date: e.target.value }))} />
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
