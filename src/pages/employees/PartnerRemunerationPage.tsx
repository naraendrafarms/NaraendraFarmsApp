import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import { Card, CardHeader, Button, Input, Table, Th, Td, Spinner, EmptyState, Badge } from '@/components/ui'
import { Plus, Edit2, Trash2, Users, IndianRupee, Save } from 'lucide-react'
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
  const s = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => { const { data } = await supabase.from('partners').select('*').order('name'); return data ?? [] }
  })
  const inv = () => qc.invalidateQueries({ queryKey: ['partners'] })

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
    mutationFn: async (id: string) => { const { error } = await supabase.from('partners').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { toast.success('Deleted'); inv(); setConfirmDel(null) },
    onError: (e: any) => toast.error(e.message)
  })

  const openEdit = (r: any) => {
    setEditId(r.id)
    setForm({ name: r.name ?? '', pan: r.pan ?? '', bank_name: r.bank_name ?? '', branch: r.branch ?? '',
      ifsc: r.ifsc ?? '', account_no: r.account_no ?? '', default_tds_pct: String(r.default_tds_pct ?? 10) })
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

      <Card padding={false}>
        {isLoading ? <Spinner /> : !rows.length ? <EmptyState icon={<Users size={32}/>} title="No partners yet" subtitle="Add partners above" /> : (
          <Table>
            <thead><tr>
              <Th>Name</Th><Th>PAN</Th><Th>Bank</Th><Th>IFSC</Th><Th>Account</Th><Th right>Default TDS%</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(rows as any[]).map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td className="font-medium">{r.name}</Td>
                  <Td className="text-xs">{r.pan ?? '—'}</Td>
                  <Td className="text-xs">{r.bank_name ?? <span className="text-red-400">No bank</span>}</Td>
                  <Td className="text-xs font-mono">{r.ifsc ?? '—'}</Td>
                  <Td className="text-xs font-mono">{r.account_no ?? '—'}</Td>
                  <Td right className="text-xs">{r.default_tds_pct ?? 0}%</Td>
                  <Td>
                    {confirmDel === r.id ? (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="danger" onClick={() => del.mutate(r.id)} loading={del.isPending}>Yes</Button>
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

export const PartnerRemunerationPage: React.FC = () => {
  const [tab, setTab] = useState<'enter'|'partners'>('enter')
  return (
    <div className="p-4 space-y-4">
      <CardHeader title="Partner Remuneration" subtitle="Pay partners monthly with TDS — flows into TDS Payable + CMS Upload" />
      <div className="flex gap-1 border-b border-gray-200">
        {([['enter','Enter Remuneration'],['partners','Manage Partners']] as [string,string][]).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===k?'border-brand-600 text-brand-700':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'enter' ? <EnterRemuneration /> : <ManagePartners />}
    </div>
  )
}
