import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, today } from '@/lib/utils'

// cash_book.payment_mode allows 'cash' | 'upi' | 'cheque' | 'neft' | 'rtgs' | 'imps' | 'bank_transfer'.
const toCbMode = (mode: string) => {
  const m = (mode || '').toLowerCase()
  if (m === 'bank transfer') return 'bank_transfer'
  return ['cash', 'upi', 'neft', 'rtgs', 'imps'].includes(m) ? m : 'cheque'
}
import { Card, CardHeader, Button, Input, Select, DateInput, Table, Th, Td, Spinner, EmptyState, Badge } from '@/components/ui'
import { Plus, Edit2, Trash2, Users, Save, Download, Upload, FileSpreadsheet, IndianRupee } from 'lucide-react'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function monthLabel(m: string) { if (!m) return ''; const [y, mo] = m.split('-'); return `${MONTH_NAMES[parseInt(mo)-1]} ${y}` }
function monthOptions() {
  const opts: string[] = []; const d = new Date()
  for (let i = 0; i < 24; i++) { opts.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); d.setMonth(d.getMonth()-1) }
  return opts
}
function lastDayOfMonth(m: string) { const [y, mo] = m.split('-').map(Number); return `${y}-${String(mo).padStart(2,'0')}-${String(new Date(y, mo, 0).getDate()).padStart(2,'0')}` }

// ── Manage Partners tab ──────────────────────────────────────────────────────
const ManagePartners: React.FC = () => {
  const qc = useQueryClient()
  const blank = { name: '', pan: '', bank_name: '', branch: '', ifsc: '', account_no: '', default_tds_pct: '10' }
  const [form, setForm] = useState<any>(blank)
  const [editId, setEditId] = useState<string|null>(null)
  const [confirmDel, setConfirmDel] = useState<string|null>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkDel, setBulkDel] = useState<false|'selected'|'all'>(false)
  const importRef = useRef<HTMLInputElement>(null)
  const s = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => { const { data } = await supabase.from('partners').select('*').order('name'); return data ?? [] }
  })
  const inv = () => { qc.invalidateQueries({ queryKey: ['partners'] }); qc.invalidateQueries({ queryKey: ['parties_bank_map'] }) }

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('Partner name required')
      const payload = {
        name: form.name.trim(), pan: form.pan?.trim() || null,
        bank_name: form.bank_name?.trim() || null, branch: form.branch?.trim() || null,
        ifsc: form.ifsc?.trim() || null, account_no: form.account_no?.trim() || null,
        default_tds_pct: Number(form.default_tds_pct) || 0,
      }
      if (editId) { const { error } = await supabase.from('partners').update(payload).eq('id', editId); if (error) throw error }
      else { const { error } = await supabase.from('partners').insert(payload); if (error) throw error }
    },
    onSuccess: () => { toast.success('Saved'); inv(); setForm(blank); setEditId(null) },
    onError: (e: any) => toast.error(e.message)
  })
  const del = useMutation({
    mutationFn: async (ids: string[]) => { const { error } = await supabase.from('partners').delete().in('id', ids); if (error) throw error },
    onSuccess: () => { toast.success('Deleted'); inv(); setConfirmDel(null); setBulkDel(false); setSel(new Set()) },
    onError: (e: any) => toast.error(e.message)
  })

  const openEdit = (r: any) => {
    setEditId(r.id)
    setForm({ name: r.name ?? '', pan: r.pan ?? '', bank_name: r.bank_name ?? '', branch: r.branch ?? '',
      ifsc: r.ifsc ?? '', account_no: r.account_no ?? '', default_tds_pct: String(r.default_tds_pct ?? 10) })
  }

  const toggle = (id: string) => setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allSel = (rows as any[]).length > 0 && (rows as any[]).every((r: any) => sel.has(r.id))
  const toggleAll = () => setSel(allSel ? new Set() : new Set((rows as any[]).map((r: any) => r.id)))

  const downloadTemplate = () => downloadXlsxTemplate('partners_template.xlsx',
    ['name','pan','bank_name','branch','ifsc','account_no','default_tds_pct'],
    ['ABC Partner','ABCDE1234F','HDFC Bank','Hyderabad','HDFC0001234','50100123456789',10])

  const exportXlsx = () => {
    if (!(rows as any[]).length) { toast.error('No partners to export'); return }
    const data = (rows as any[]).map((r: any) => ({
      name: r.name, pan: r.pan ?? '', bank_name: r.bank_name ?? '', branch: r.branch ?? '',
      ifsc: r.ifsc ?? '', account_no: r.account_no ?? '', default_tds_pct: r.default_tds_pct ?? 0,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Partners')
    XLSX.writeFile(wb, 'Partners.xlsx')
    toast.success('Exported')
  }

  const handleImport = async (file: File) => {
    try {
      const { headers, rows: fileRows } = await parseFile(file)
      const idx = (names: string[]) => headers.findIndex(h => names.includes(h.toLowerCase().trim()))
      const ci = {
        name: idx(['name','partner name','partner']), pan: idx(['pan']),
        bank: idx(['bank_name','bank']), branch: idx(['branch']),
        ifsc: idx(['ifsc']), acct: idx(['account_no','account','acc no','account number']),
        tds: idx(['default_tds_pct','tds','tds%','tds pct']),
      }
      if (ci.name < 0) { toast.error('File needs a "name" column'); return }
      const payload = (fileRows as any[]).filter(r => r[ci.name]?.trim()).map((r: any) => ({
        name: r[ci.name].trim(),
        pan: ci.pan >= 0 ? (r[ci.pan]?.trim() || null) : null,
        bank_name: ci.bank >= 0 ? (r[ci.bank]?.trim() || null) : null,
        branch: ci.branch >= 0 ? (r[ci.branch]?.trim() || null) : null,
        ifsc: ci.ifsc >= 0 ? (r[ci.ifsc]?.trim() || null) : null,
        account_no: ci.acct >= 0 ? (r[ci.acct]?.trim() || null) : null,
        default_tds_pct: ci.tds >= 0 ? (parseFloat(r[ci.tds]) || 0) : 10,
      }))
      if (!payload.length) { toast.error('No valid rows'); return }

      // Skip partners whose name already exists (case-insensitive) — natural key = lower(name).
      // Dedup both against the DB and within the file itself.
      const existingNames = new Set((rows as any[]).map((r: any) => (r.name ?? '').trim().toLowerCase()))
      const seen = new Set<string>()
      const deduped = payload.filter(r => {
        const k = r.name.trim().toLowerCase()
        if (existingNames.has(k) || seen.has(k)) return false
        seen.add(k); return true
      })
      const skipped = payload.length - deduped.length
      if (!deduped.length) { toast.error(`All ${payload.length} partners already exist — nothing imported`); return }
      const { error } = await supabase.from('partners').insert(deduped)
      if (error) throw error
      inv()
      toast.success(`Imported ${deduped.length} partners${skipped ? ` (skipped ${skipped} existing)` : ''}`)
    } catch (e: any) { toast.error(e.message) }
    finally { if (importRef.current) importRef.current.value = '' }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <p className="font-semibold text-gray-700 text-sm">{editId ? 'Edit Partner' : 'Add Partner'}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label="Partner Name *" value={form.name} onChange={e => s('name', e.target.value)} />
          <Input label="PAN" value={form.pan} onChange={e => s('pan', e.target.value)} />
          <Input label="Default TDS %" type="number" value={form.default_tds_pct} onChange={e => s('default_tds_pct', e.target.value)} />
          <Input label="Bank Name" value={form.bank_name} onChange={e => s('bank_name', e.target.value)} />
          <Input label="Branch" value={form.branch} onChange={e => s('branch', e.target.value)} />
          <Input label="IFSC" value={form.ifsc} onChange={e => s('ifsc', e.target.value)} />
          <Input label="Account No" value={form.account_no} onChange={e => s('account_no', e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" icon={<Save size={14}/>} onClick={() => save.mutate()} loading={save.isPending}>{editId ? 'Update' : 'Add'}</Button>
          {editId && <Button size="sm" variant="secondary" onClick={() => { setEditId(null); setForm(blank) }}>Cancel</Button>}
        </div>
      </Card>

      {/* Toolbar: import / export / template / bulk delete */}
      <div className="flex flex-wrap gap-2 items-center">
        <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={e => e.target.files?.[0] && handleImport(e.target.files[0])} />
        <Button size="sm" variant="outline" icon={<Upload size={14}/>} onClick={() => importRef.current?.click()}>Import</Button>
        <Button size="sm" variant="outline" icon={<Download size={14}/>} onClick={exportXlsx}>Export Excel</Button>
        <Button size="sm" variant="ghost" icon={<FileSpreadsheet size={14}/>} onClick={downloadTemplate}>Template</Button>
        <div className="flex-1" />
        {sel.size > 0 && <Button size="sm" variant="danger" icon={<Trash2 size={14}/>} onClick={() => setBulkDel('selected')}>Delete Selected ({sel.size})</Button>}
        {(rows as any[]).length > 0 && <Button size="sm" variant="danger" icon={<Trash2 size={14}/>} onClick={() => setBulkDel('all')}>Delete All</Button>}
      </div>

      {bulkDel && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-3">
          <span>Delete {bulkDel === 'all' ? `ALL ${(rows as any[]).length} partners` : `${sel.size} selected partner(s)`}? This cannot be undone.</span>
          <Button size="sm" variant="danger" loading={del.isPending}
            onClick={() => del.mutate(bulkDel === 'all' ? (rows as any[]).map((r: any) => r.id) : Array.from(sel))}>Yes, delete</Button>
          <Button size="sm" variant="secondary" onClick={() => setBulkDel(false)}>Cancel</Button>
        </div>
      )}

      <Card padding={false}>
        {isLoading ? <Spinner /> : !rows.length ? <EmptyState icon={<Users size={32}/>} title="No partners yet" subtitle="Add partners above or Import from Excel" /> : (
          <Table>
            <thead><tr>
              <Th><input type="checkbox" checked={allSel} onChange={toggleAll} className="rounded border-gray-300 text-brand-600" /></Th>
              <Th>Name</Th><Th>PAN</Th><Th>Bank</Th><Th>IFSC</Th><Th>Account</Th><Th right>Default TDS%</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(rows as any[]).map((r: any) => (
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id) ? 'bg-brand-50' : ''}`}>
                  <Td><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} className="rounded border-gray-300 text-brand-600" /></Td>
                  <Td className="font-medium">{r.name}</Td>
                  <Td className="text-xs">{r.pan ?? '—'}</Td>
                  <Td className="text-xs">{r.bank_name ?? <span className="text-red-400">No bank</span>}</Td>
                  <Td className="text-xs font-mono">{r.ifsc ?? '—'}</Td>
                  <Td className="text-xs font-mono">{r.account_no ?? '—'}</Td>
                  <Td right className="text-xs">{r.default_tds_pct ?? 0}%</Td>
                  <Td>
                    {confirmDel === r.id ? (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="danger" onClick={() => del.mutate([r.id])} loading={del.isPending}>Yes</Button>
                        <Button size="sm" variant="secondary" onClick={() => setConfirmDel(null)}>No</Button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(r)} className="p-1 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
                        <button onClick={() => setConfirmDel(r.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}

// ── Enter Remuneration tab ───────────────────────────────────────────────────
const EnterRemuneration: React.FC = () => {
  const qc = useQueryClient()
  const today = new Date()
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`)
  const [amounts, setAmounts] = useState<Record<string,string>>({})
  const [tdsPcts, setTdsPcts] = useState<Record<string,string>>({})
  const [saving, setSaving] = useState(false)

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => { const { data } = await supabase.from('partners').select('*').eq('is_active', true).order('name'); return data ?? [] }
  })

  // Existing remuneration rows for this month
  const { data: existing = [] } = useQuery({
    queryKey: ['partner_remun', month],
    queryFn: async () => {
      const { data } = await supabase.from('pending_payments')
        .select('id,partner_id,vendor_name,invoice_amount,tds_pct,tds_amount,net_payable,payment_status')
        .eq('is_partner_remuneration', true)
        .gte('grn_date', month + '-01').lte('grn_date', lastDayOfMonth(month))
      return data ?? []
    }
  })

  // Seed inputs from existing rows / defaults
  React.useEffect(() => {
    const a: Record<string,string> = {}; const t: Record<string,string> = {}
    for (const p of (partners as any[])) {
      const ex = (existing as any[]).find(e => e.partner_id === p.id)
      a[p.id] = ex ? String(ex.invoice_amount ?? '') : ''
      t[p.id] = ex ? String(ex.tds_pct ?? p.default_tds_pct ?? 0) : String(p.default_tds_pct ?? 0)
    }
    setAmounts(a); setTdsPcts(t)
  }, [partners, existing, month])

  const calcRow = (pid: string) => {
    const amt = parseFloat(amounts[pid] ?? '0') || 0
    const pct = parseFloat(tdsPcts[pid] ?? '0') || 0
    const tds = Math.round(amt * pct / 100)
    return { amt, pct, tds, net: amt - tds }
  }

  const totals = (partners as any[]).reduce((acc: any, p: any) => {
    const { amt, tds, net } = calcRow(p.id)
    return { amt: acc.amt + amt, tds: acc.tds + tds, net: acc.net + net }
  }, { amt: 0, tds: 0, net: 0 })

  const exportXlsx = () => {
    const data = (partners as any[]).map((p: any) => {
      const { amt, pct, tds, net } = calcRow(p.id)
      return { Partner: p.name, Remuneration: amt, 'TDS %': pct, 'TDS Amount': tds, 'Net Payable': net }
    }).filter(r => r.Remuneration > 0)
    if (!data.length) { toast.error('Enter amounts first'); return }
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Remuneration')
    XLSX.writeFile(wb, `PartnerRemuneration_${month}.xlsx`)
    toast.success('Exported')
  }

  const save = async () => {
    setSaving(true)
    try {
      const monthEnd = lastDayOfMonth(month)
      const rows = (partners as any[])
        .map((p: any) => ({ p, ...calcRow(p.id) }))
        .filter(r => r.amt > 0)
        .map(r => ({
          vendor_name: r.p.name,
          partner_id: r.p.id,
          is_partner_remuneration: true,
          invoice_no: `REM-${month}-${r.p.name.slice(0,6).toUpperCase().replace(/\s/g,'')}`,
          invoice_amount: r.amt,
          invoice_date: monthEnd,
          grn_date: monthEnd,
          tds_pct: r.pct,
          tds_amount: r.tds,
          net_payable: r.net,
          payment_type: 'NEFT',
          payment_status: 'Pending',
          pay_before_date: monthEnd,
          po_raised_by: 'Hyderabad',
        }))
      if (!rows.length) { toast.error('Enter at least one amount'); setSaving(false); return }

      // Delete existing remuneration rows for this month first (avoid duplicates), then insert
      const ids = (existing as any[]).map(e => e.id)
      if (ids.length) { await supabase.from('pending_payments').delete().in('id', ids) }
      const { error } = await supabase.from('pending_payments').insert(rows)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['partner_remun', month] })
      qc.invalidateQueries({ queryKey: ['cms_pending_payments'] })
      qc.invalidateQueries({ queryKey: ['pending_payments_tds'] })
      toast.success(`Saved ${rows.length} partner remuneration entries`)
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        Enter each partner's remuneration for the month. TDS is deducted at the rate shown (pre-filled from each partner's default).
        On save, these become <strong>Pending payments</strong> — they appear in <strong>TDS Payable</strong> and the
        <strong> CMS Upload</strong> page (alongside vendors) for bank transfer.
      </div>

      <Card className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Month</label>
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand-500">
            {monthOptions().map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        <Button icon={<Save size={14}/>} onClick={save} loading={saving} disabled={!(partners as any[]).length}>Save Remuneration</Button>
        <Button variant="outline" icon={<Download size={14}/>} onClick={exportXlsx} disabled={!(partners as any[]).length}>Export Excel</Button>
      </Card>

      <Card padding={false}>
        {isLoading ? <Spinner /> : !(partners as any[]).length ? (
          <EmptyState icon={<Users size={32}/>} title="No partners set up" subtitle="Add partners in the Manage Partners tab first" />
        ) : (
          <Table>
            <thead><tr>
              <Th>Partner</Th><Th right>Remuneration (₹)</Th><Th right>TDS %</Th>
              <Th right>TDS Amount</Th><Th right>Net Payable</Th><Th>Status</Th>
            </tr></thead>
            <tbody>
              {(partners as any[]).map((p: any) => {
                const { tds, net } = calcRow(p.id)
                const ex = (existing as any[]).find(e => e.partner_id === p.id)
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <Td className="font-medium">{p.name}{!p.bank_name && <span className="ml-2 text-xs text-red-400">(no bank)</span>}</Td>
                    <Td right>
                      <Input label="" type="number" value={amounts[p.id] ?? ''} placeholder="0"
                        onChange={e => setAmounts(m => ({ ...m, [p.id]: e.target.value }))} className="w-28 text-right" />
                    </Td>
                    <Td right>
                      <Input label="" type="number" value={tdsPcts[p.id] ?? ''}
                        onChange={e => setTdsPcts(m => ({ ...m, [p.id]: e.target.value }))} className="w-20 text-right" />
                    </Td>
                    <Td right className="text-red-600">{inr(tds)}</Td>
                    <Td right className="font-semibold text-green-700">{inr(net)}</Td>
                    <Td>{ex ? <Badge color={ex.payment_status === 'Paid' ? 'green' : 'orange'}>{ex.payment_status ?? 'Pending'}</Badge> : <span className="text-xs text-gray-400">—</span>}</Td>
                  </tr>
                )
              })}
              <tr className="bg-gray-50 font-semibold">
                <Td>TOTAL</Td>
                <Td right>{inr(totals.amt)}</Td>
                <Td right></Td>
                <Td right className="text-red-600">{inr(totals.tds)}</Td>
                <Td right className="text-green-700">{inr(totals.net)}</Td>
                <Td></Td>
              </tr>
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}

// ── Paid Status / History tab ────────────────────────────────────────────────
const PaidStatus: React.FC = () => {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'all'|'pending'|'paid'>('all')
  const [payRow, setPayRow] = useState<any>(null)
  const [payDate, setPayDate] = useState(today())
  const [payMode, setPayMode] = useState('Cash')
  const [payBankId, setPayBankId] = useState('')

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['partner_remun_history'],
    queryFn: async () => {
      const { data } = await supabase.from('pending_payments')
        .select('id,vendor_name,invoice_amount,tds_amount,net_payable,payment_status,paid_date,grn_date')
        .eq('is_partner_remuneration', true)
        .order('grn_date', { ascending: false })
      return data ?? []
    }
  })

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank_accounts_list'],
    queryFn: async () => {
      const { data } = await supabase.from('bank_accounts').select('id,account_name,bank_name').eq('is_active', true).order('bank_name')
      return data ?? []
    }
  })

  const markPaid = useMutation({
    mutationFn: async ({ r, mode, date, bankAccountId }: { r: any; mode: string; date: string; bankAccountId: string }) => {
      if (mode.toLowerCase() !== 'cash' && !bankAccountId) {
        throw new Error('Select which bank account this is paid from, or it won\'t be recorded in any ledger')
      }
      const amount = r.net_payable ?? r.invoice_amount ?? 0
      const { error } = await supabase.from('pending_payments').update({
        payment_status: 'Paid', paid_amount: amount, paid_date: date,
        account_type: mode, bank_account_id: mode.toLowerCase() !== 'cash' ? bankAccountId : null,
      }).eq('id', r.id)
      if (error) throw error
      // Post to Cash Book / Bank Ledger — this used to only flip the status
      // flag with no ledger entry at all.
      await supabase.from('cash_book').delete().eq('pending_payment_id', r.id)
      await supabase.from('bank_transactions').delete().eq('linked_payment_id', r.id)
      const isCash = mode.toLowerCase() === 'cash'
      await supabase.from('cash_book').insert({
        txn_date: date, txn_type: 'payment', category: 'partner_remuneration',
        description: `Partner Remuneration — ${r.vendor_name}`,
        party_name: r.vendor_name, amount_in: 0, amount_out: amount,
        payment_mode: toCbMode(mode), pending_payment_id: r.id,
      })
      if (!isCash && bankAccountId) {
        await supabase.from('bank_transactions').insert({
          bank_account_id: bankAccountId, txn_date: date, txn_type: 'Debit', category: 'Partner Remuneration',
          description: `Partner Remuneration — ${r.vendor_name}`,
          amount, linked_payment_id: r.id,
        })
      }
    },
    onSuccess: () => {
      toast.success('Marked paid')
      qc.invalidateQueries({ queryKey: ['partner_remun_history'] }); qc.invalidateQueries({ queryKey: ['partner_remun'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] }); qc.invalidateQueries({ queryKey: ['bank_transactions'] })
      setPayRow(null)
    },
    onError: (e: any) => toast.error(e.message)
  })
  const markPending = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pending_payments').update({
        payment_status: 'Pending', paid_amount: 0, paid_date: null,
      }).eq('id', id)
      if (error) throw error
      // Clear whatever ledger entry markPaid created, so undoing "Paid"
      // doesn't leave a stale Cash Book/Bank Ledger row behind.
      await supabase.from('cash_book').delete().eq('pending_payment_id', id)
      await supabase.from('bank_transactions').delete().eq('linked_payment_id', id)
    },
    onSuccess: () => {
      toast.success('Marked pending')
      qc.invalidateQueries({ queryKey: ['partner_remun_history'] }); qc.invalidateQueries({ queryKey: ['partner_remun'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] }); qc.invalidateQueries({ queryKey: ['bank_transactions'] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const isPaid = (r: any) => r.payment_status === 'Paid'
  const filtered = (rows as any[]).filter(r =>
    statusFilter === 'all' ? true : statusFilter === 'paid' ? isPaid(r) : !isPaid(r))

  // Group by month (grn_date YYYY-MM)
  const byMonth: Record<string, any[]> = {}
  for (const r of filtered) {
    const m = (r.grn_date ?? '').slice(0,7)
    ;(byMonth[m] ??= []).push(r)
  }
  const months = Object.keys(byMonth).sort().reverse()

  const grand = filtered.reduce((a: any, r: any) => ({
    amt: a.amt + (r.invoice_amount ?? 0), tds: a.tds + (r.tds_amount ?? 0),
    net: a.net + (r.net_payable ?? 0), paid: a.paid + (isPaid(r) ? (r.net_payable ?? 0) : 0),
  }), { amt: 0, tds: 0, net: 0, paid: 0 })

  if (isLoading) return <Spinner />
  if (!filtered.length) return <EmptyState icon={<IndianRupee size={32}/>} title="No partner remuneration saved yet" subtitle="Enter remuneration in the first tab" />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {([['all','All'],['pending','Pending'],['paid','Paid']] as [any,string][]).map(([k,l]) => (
            <button key={k} onClick={() => setStatusFilter(k)}
              className={`px-3 py-1 text-xs rounded-md ${statusFilter===k?'bg-white shadow font-semibold text-brand-700':'text-gray-500'}`}>{l}</button>
          ))}
        </div>
        <div className="text-xs text-gray-500 ml-auto">
          Total Net: <strong>{inr(grand.net)}</strong> · Paid: <strong className="text-green-700">{inr(grand.paid)}</strong> · Outstanding: <strong className="text-orange-600">{inr(grand.net - grand.paid)}</strong>
        </div>
      </div>

      {months.map(m => {
        const mr = byMonth[m]
        const mNet = mr.reduce((s: number, r: any) => s + (r.net_payable ?? 0), 0)
        const mPaid = mr.filter(isPaid).length
        return (
          <Card key={m} padding={false}>
            <div className="px-4 py-2 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
              <h3 className="font-semibold text-brand-800 text-sm">{monthLabel(m)} — {mr.length} partner(s), {mPaid} paid</h3>
              <span className="text-xs text-gray-600">Net {inr(mNet)}</span>
            </div>
            <Table>
              <thead><tr>
                <Th>Partner</Th><Th right>Remuneration</Th><Th right>TDS</Th><Th right>Net Payable</Th>
                <Th>Status</Th><Th>Paid Date</Th><Th></Th>
              </tr></thead>
              <tbody>
                {mr.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <Td className="font-medium">{r.vendor_name}</Td>
                    <Td right>{inr(r.invoice_amount ?? 0)}</Td>
                    <Td right className="text-red-600">{inr(r.tds_amount ?? 0)}</Td>
                    <Td right className="font-semibold text-green-700">{inr(r.net_payable ?? 0)}</Td>
                    <Td><Badge color={isPaid(r) ? 'green' : 'orange'}>{isPaid(r) ? 'Paid' : 'Pending'}</Badge></Td>
                    <Td className="text-xs text-gray-500">{r.paid_date ?? '—'}</Td>
                    <Td>
                      {isPaid(r)
                        ? <Button size="sm" variant="ghost" onClick={() => markPending.mutate(r.id)}>Undo</Button>
                        : <Button size="sm" variant="outline" onClick={() => { setPayRow(r); setPayDate(today()); setPayMode('Cash'); setPayBankId('') }}>Mark Paid</Button>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )
      })}

      {payRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <p className="font-semibold text-gray-900 mb-1">Record Payment</p>
            <p className="text-sm text-gray-500 mb-4">
              {payRow.vendor_name} — <strong>{inr(payRow.net_payable ?? payRow.invoice_amount ?? 0)}</strong>
            </p>
            <div className="space-y-3">
              <DateInput label="Payment Date" value={payDate} onChange={e => setPayDate(e.target.value)} />
              <Select label="Payment Mode" value={payMode} onChange={e => setPayMode(e.target.value)}
                options={['Cash','NEFT','RTGS','Bank Transfer','UPI','Cheque'].map(m => ({ value: m, label: m }))} />
              {payMode.toLowerCase() !== 'cash' && (
                <Select label="Paid From Bank Account" value={payBankId} onChange={e => setPayBankId(e.target.value)}
                  options={[{ value: '', label: '— Select account —' }, ...(bankAccounts ?? []).map((b: any) => ({ value: b.id, label: `${b.account_name ? b.account_name + ' — ' : ''}${b.bank_name}` }))]} />
              )}
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => setPayRow(null)}>Cancel</Button>
              <Button size="sm" loading={markPaid.isPending}
                onClick={() => markPaid.mutate({ r: payRow, mode: payMode, date: payDate, bankAccountId: payBankId })}>
                Save Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const PartnerRemunerationPage: React.FC = () => {
  const [tab, setTab] = useState<'enter'|'status'|'partners'>('enter')
  return (
    <div className="p-4 space-y-4">
      <CardHeader title="Partner Remuneration" subtitle="Pay partners monthly with TDS — flows into TDS Payable + CMS Upload" />
      <div className="flex gap-1 border-b border-gray-200">
        {([['enter','Enter Remuneration'],['status','Paid Status'],['partners','Manage Partners']] as [string,string][]).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===k?'border-brand-600 text-brand-700':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'enter' ? <EnterRemuneration /> : tab === 'status' ? <PaidStatus /> : <ManagePartners />}
    </div>
  )
}
