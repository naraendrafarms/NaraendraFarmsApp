import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { Card, CardHeader, Button, Select, SectionHeader, Spinner, EmptyState, Table, Th, Td, Input } from '@/components/ui'
import { Printer, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Site (VHL Bodjanampet-2 and similar) dispatch daily, invoice month-end —
// pulls that month's HE dispatch + NHE JE/TE sales for one farm+party into a
// single consolidated invoice number and printable document, instead of
// requiring the same invoice_no to be typed by hand on every daily row.
export const SiteInvoicePage: React.FC = () => {
  const qc = useQueryClient()
  const [farmId, setFarmId] = useState('')
  const [partyId, setPartyId] = useState('')
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [invoiceNo, setInvoiceNo] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: farms=[] } = useQuery({ queryKey: ['farms_site_inv'], queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code,type').eq('is_active',true).order('name'); return data ?? [] } })
  const { data: parties=[] } = useQuery({ queryKey: ['parties_site_inv'], queryFn: async () => { const { data } = await supabase.from('parties').select('id,name,gstin,address,contact').in('type',['buyer','both']).eq('is_active',true).order('name'); return data ?? [] } })
  const { data: company } = useQuery({ queryKey: ['company_settings'], queryFn: async () => { const { data } = await supabase.from('company_settings').select('*').limit(1).maybeSingle(); return data } })

  const monthStart = month + '-01'
  const [y, m] = month.split('-').map(Number)
  const monthEnd = `${y}-${String(m).padStart(2,'0')}-${String(new Date(y, m, 0).getDate()).padStart(2,'0')}`

  const { data: flockIds=[] } = useQuery({
    queryKey: ['flocks_for_farm_site_inv', farmId],
    enabled: !!farmId,
    queryFn: async () => {
      const { data } = await supabase.from('flocks').select('id,flock_no').or(`laying_farm_id.eq.${farmId},rearing_farm_id.eq.${farmId}`)
      return data ?? []
    }
  })
  const flockIdList = flockIds.map((f: any) => f.id)

  const { data: heRows=[], isLoading: heLoading } = useQuery({
    queryKey: ['site_inv_he', farmId, partyId, month, flockIdList.join(',')],
    enabled: !!farmId && !!partyId && flockIdList.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('he_dispatch')
        .select('id,dispatch_date,dc_no,invoice_no,invoice_eggs,rate,amount,flock_id,flocks(flock_no)')
        .in('flock_id', flockIdList).eq('party_id', partyId)
        .gte('dispatch_date', monthStart).lte('dispatch_date', monthEnd)
        .order('dispatch_date')
      return (data ?? []).map((r: any) => ({ ...r, kind: 'HE', qty: r.invoice_eggs }))
    }
  })
  const { data: jeteRows=[], isLoading: jeteLoading } = useQuery({
    queryKey: ['site_inv_jete', farmId, partyId, month, flockIdList.join(',')],
    enabled: !!farmId && !!partyId && flockIdList.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('nhe_sales')
        .select('id,sale_date,dc_no,invoice_no,quantity,rate,amount,sale_type,flock_id,flocks(flock_no)')
        .in('flock_id', flockIdList).eq('party_id', partyId).in('sale_type', ['je','te'])
        .gte('sale_date', monthStart).lte('sale_date', monthEnd)
        .order('sale_date')
      return (data ?? []).map((r: any) => ({ ...r, kind: r.sale_type === 'je' ? 'JE' : 'TE', dispatch_date: r.sale_date, qty: r.quantity }))
    }
  })

  const rows = [...heRows, ...jeteRows].sort((a, b) => (a.dispatch_date ?? '').localeCompare(b.dispatch_date ?? ''))
  const grandTotal = rows.reduce((s, r: any) => s + (Number(r.amount) || 0), 0)
  const alreadyInvoiced = rows.filter((r: any) => r.invoice_no)
  const party = parties.find((p: any) => p.id === partyId)
  const farm = farms.find((f: any) => f.id === farmId)

  const generateInvoice = async () => {
    if (!invoiceNo.trim()) { toast.error('Enter an invoice number'); return }
    if (!rows.length) { toast.error('No dispatches/sales found for this farm, party and month'); return }
    setSaving(true)
    try {
      const heIds = heRows.map((r: any) => r.id)
      const jeteIds = jeteRows.map((r: any) => r.id)
      if (heIds.length) {
        const { error } = await supabase.from('he_dispatch').update({ invoice_no: invoiceNo.trim() }).in('id', heIds)
        if (error) throw error
      }
      if (jeteIds.length) {
        const { error } = await supabase.from('nhe_sales').update({ invoice_no: invoiceNo.trim() }).in('id', jeteIds)
        if (error) throw error
      }
      toast.success(`Invoice ${invoiceNo.trim()} applied to ${rows.length} rows`)
      qc.invalidateQueries({ queryKey: ['site_inv_he'] })
      qc.invalidateQueries({ queryKey: ['site_inv_jete'] })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const printInvoice = () => {
    if (!rows.length) return
    const co = company ?? { company_name: 'Naraendra Farms', address_line1: '', address_line2: '' }
    const finalInvoiceNo = invoiceNo.trim() || alreadyInvoiced[0]?.invoice_no || '—'
    const trs = rows.map((r: any, i: number) => `<tr>
      <td class="c">${i+1}</td><td>${esc(fmtDate(r.dispatch_date))}</td><td class="c">${esc(r.kind)}</td>
      <td>${esc(r.flocks?.flock_no ?? '')}</td><td class="c">${esc(r.dc_no ?? '')}</td>
      <td class="r">${r.qty != null ? Number(r.qty).toLocaleString('en-IN') : ''}</td>
      <td class="r">${r.rate != null ? Number(r.rate).toLocaleString('en-IN',{minimumFractionDigits:2}) : ''}</td>
      <td class="r">${r.amount != null ? Number(r.amount).toLocaleString('en-IN',{minimumFractionDigits:2}) : ''}</td>
    </tr>`).join('')
    const html = `<!doctype html><html><head><title>Invoice ${esc(finalInvoiceNo)}</title><style>
      * { box-sizing:border-box; margin:0; padding:0; } body { font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#111; padding:24px; }
      .head { text-align:center; border-bottom:2px solid #111; padding-bottom:10px; margin-bottom:12px; }
      .head h1 { font-size:20px; } .head p { font-size:11px; color:#333; }
      .doc-title { text-align:center; font-size:14px; font-weight:bold; text-decoration:underline; margin:10px 0 14px; }
      .meta { display:flex; justify-content:space-between; gap:16px; margin-bottom:14px; }
      .meta .box { border:1px solid #999; padding:8px 10px; flex:1; }
      .meta .box b { display:block; font-size:10px; text-transform:uppercase; color:#555; margin-bottom:4px; }
      table { width:100%; border-collapse:collapse; } th,td { border:1px solid #999; padding:5px 7px; }
      th { background:#f0f0f0; font-size:11px; text-transform:uppercase; } td.c{text-align:center;} td.r{text-align:right;}
      tfoot td { font-weight:bold; } @media print { body{padding:8px;} }
    </style></head><body>
      <div class="head"><h1>${esc(co.company_name)}</h1><p>${esc(co.address_line1)}</p><p>${esc(co.address_line2)}</p>${co.gstin?`<p>GSTIN: ${esc(co.gstin)}</p>`:''}</div>
      <div class="doc-title">CONSOLIDATED SITE INVOICE — ${esc(farm?.name ?? '')}</div>
      <div class="meta">
        <div class="box"><b>Bill To</b><div style="font-weight:bold">${esc(party?.name)}</div>${party?.address?`<div>${esc(party.address)}</div>`:''}${party?.gstin?`<div>GSTIN: ${esc(party.gstin)}</div>`:''}</div>
        <div class="box" style="max-width:220px"><b>Invoice Details</b><div>Invoice No: <strong>${esc(finalInvoiceNo)}</strong></div><div>Period: ${esc(month)}</div><div>Site: ${esc(farm?.name ?? '')}</div></div>
      </div>
      <table><thead><tr><th>#</th><th>Date</th><th>Type</th><th>Flock</th><th>DC No</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>${trs}</tbody>
      <tfoot><tr><td colspan="7" class="r">GRAND TOTAL</td><td class="r">${grandTotal.toLocaleString('en-IN',{minimumFractionDigits:2})}</td></tr></tfoot>
      </table>
    </body></html>`
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'; iframe.style.right = '100%'; iframe.style.width='0'; iframe.style.height='0'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document
    if (doc) { doc.open(); doc.write(html); doc.close() }
    iframe.onload = () => { iframe.contentWindow?.print(); setTimeout(() => document.body.removeChild(iframe), 2000) }
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Site Invoice (Consolidated)" subtitle="For sites like VHL Bodjanampet-2 that dispatch daily but invoice once at month-end — combines HE + JE/TE eggs into one invoice." />
      <Card className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Site / Farm *" placeholder="— Select —" value={farmId} onChange={e => setFarmId(e.target.value)}
            options={farms.map((f: any) => ({ value: f.id, label: `${f.name}${f.type ? ' ('+f.type+')' : ''}` }))} />
          <Select label="Party / Buyer *" placeholder="— Select —" value={partyId} onChange={e => setPartyId(e.target.value)}
            options={parties.map((p: any) => ({ value: p.id, label: p.name }))} />
          <div>
            <label className="text-sm font-medium text-gray-700">Month</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
        </div>
      </Card>

      {farmId && partyId && (
        (heLoading || jeteLoading) ? <Spinner /> : rows.length === 0 ? (
          <EmptyState icon={<FileText size={32}/>} title="No HE/JE/TE rows found" subtitle="No dispatches or sales for this site, party and month." />
        ) : (
          <>
            <Card padding={false}>
              <CardHeader title={`${rows.length} rows — Total ${inr(grandTotal)}`} />
              <Table>
                <thead><tr><Th>Date</Th><Th>Type</Th><Th>Flock</Th><Th>DC No</Th><Th right>Qty</Th><Th right>Rate</Th><Th right>Amount</Th><Th>Invoice No</Th></tr></thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr key={r.kind+r.id}>
                      <Td className="text-xs">{fmtDate(r.dispatch_date)}</Td>
                      <Td className="text-xs font-medium">{r.kind}</Td>
                      <Td className="text-xs">{r.flocks?.flock_no ?? '—'}</Td>
                      <Td className="text-xs">{r.dc_no ?? '—'}</Td>
                      <Td right className="text-xs">{r.qty != null ? Number(r.qty).toLocaleString('en-IN') : '—'}</Td>
                      <Td right className="text-xs">{r.rate != null ? inr(r.rate) : '—'}</Td>
                      <Td right className="text-xs">{inr(r.amount)}</Td>
                      <Td className="text-xs">{r.invoice_no ?? <span className="text-orange-500">not invoiced</span>}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>

            <Card className="space-y-3">
              <p className="text-xs text-gray-500">
                {alreadyInvoiced.length > 0
                  ? `${alreadyInvoiced.length} of ${rows.length} rows already carry an invoice number${alreadyInvoiced[0]?.invoice_no ? ` (${alreadyInvoiced[0].invoice_no})` : ''}. Entering a new number below will overwrite it on all rows.`
                  : 'None of these rows have an invoice number yet.'}
              </p>
              <div className="flex gap-3 items-end flex-wrap">
                <Input label="Invoice No" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. INV/2026-27/0201" className="w-64" />
                <Button onClick={generateInvoice} loading={saving}>Apply Invoice No to {rows.length} rows</Button>
                <Button variant="secondary" icon={<Printer size={14}/>} onClick={printInvoice}>Print Consolidated Invoice</Button>
              </div>
            </Card>
          </>
        )
      )}
    </div>
  )
}
