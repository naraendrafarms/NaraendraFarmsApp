import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, friendlyDbError } from '@/lib/utils'
import { Card, CardHeader, Button, Select, SectionHeader, Spinner, EmptyState, Table, Th, Td, DateInput, SearchableSelect } from '@/components/ui'
import { Download, Bird, Tag } from 'lucide-react'
import { moduleLevel } from '@/lib/auth'
import toast from 'react-hot-toast'

const isBirdSale = (t: string) => t === 'bird_sale' || ['bird_cull','bird_lame','bird_weak','bird_sex_error'].includes(t)

function exportCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

// Bulk Cull/Bird sales to outside parties (buyers) — excludes employee sales,
// which have their own recovery/deduction flow and would double-count here.
export const BirdSalesReport: React.FC = () => {
  const [flockId, setFlockId] = useState('')
  const [partyId, setPartyId] = useState('')
  const [category, setCategory] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: flocks=[] } = useQuery({ queryKey: ['flocks_bird_report'], queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no').order('flock_no'); return data ?? [] } })
  const { data: parties=[] } = useQuery({ queryKey: ['parties_bird_report'], queryFn: async () => { const { data } = await supabase.from('parties').select('id,name').in('type',['buyer','both']).order('name'); return data ?? [] } })
  const { data: farms=[] } = useQuery({ queryKey: ['farms_bird_report'], queryFn: async () => { const { data } = await supabase.from('farms').select('id,name'); return data ?? [] } })

  // Which imprest holds the cash from each sale. The imprest is NOT on the sale
  // itself -- it is on the cash_book receipt the sale created, because that is
  // the row that represents the money actually moving.
  const qc = useQueryClient()
  const canTag = moduleLevel('accounts') === 'full'
  const { data: cashAccounts=[] } = useQuery({
    queryKey: ['cash_accounts_active'],
    queryFn: async () => {
      const { data } = await supabase.from('cash_accounts')
        .select('id,name,farm_id').eq('is_active', true).order('sort_order')
      return data ?? []
    }
  })
  const cashLocationName = (farmId: string | null) => !farmId ? 'Head Office' : (farms.find((f: any) => f.id === farmId)?.name ?? farmId)
  const BIRD_SEX_LABEL: Record<string,string> = { female: 'Female', male: 'Male', sex_error: 'Sex Error', mixed: 'Mixed' }
  const BIRD_CAT_LABEL: Record<string,string> = { cull: 'Cull', lame: 'Lame', weak: 'Weak', other: 'Other' }

  const { data: rows=[], isLoading } = useQuery({
    queryKey: ['bird_sales_report', flockId, partyId, category, fromDate, toDate],
    queryFn: async () => {
      let q = supabase.from('nhe_sales')
        .select('id,sale_date,dc_no,vehicle_no,female_qty,male_qty,quantity,gross_weight_kg,tare_weight_kg,net_weight_kg,avg_weight_kg,rate_per_kg,amount,payment_cash,payment_online,payment_mode,payment_status,bird_category,bird_sex,invoice_no,gst_pct,remarks,refund_amount,refund_date,flocks(flock_no),parties(name),bank_accounts!nhe_sales_bank_account_id_fkey(bank_name,account_name)')
        .in('sale_type', ['bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error'])
        .eq('is_employee_sale', false)
        .order('sale_date', { ascending: false })
      if (flockId) q = q.eq('flock_id', flockId)
      if (partyId) q = q.eq('party_id', partyId)
      if (category) q = q.eq('bird_category', category)
      if (fromDate) q = q.gte('sale_date', fromDate)
      if (toDate) q = q.lte('sale_date', toDate)
      const { data, error } = await q
      if (error) { toast.error(error.message); return [] }

      // The cash-received location lives on cash_book.farm_id (linked via
      // nhe_sale_id), NOT on nhe_sales itself — nhe_sales has no farm_id column.
      const saleIds = (data ?? []).map((r: any) => r.id)
      const farmByNheSale: Record<string, string | null> = {}
      // Same fetch also carries the receipt's id and its imprest, so the report
      // can show which cash box holds this money and set it -- the imprest sits
      // on the cash_book RECEIPT, not on the sale, because the receipt is the
      // row that represents the money actually moving.
      const cbIdByNheSale: Record<string, string> = {}
      const imprestByNheSale: Record<string, string | null> = {}
      if (saleIds.length) {
        const { data: cbRows } = await supabase.from('cash_book')
          .select('id,nhe_sale_id,farm_id,cash_account_id').in('nhe_sale_id', saleIds)
        for (const cb of (cbRows ?? [])) {
          farmByNheSale[cb.nhe_sale_id] = cb.farm_id
          cbIdByNheSale[cb.nhe_sale_id] = cb.id
          imprestByNheSale[cb.nhe_sale_id] = cb.cash_account_id
        }
      }
      return (data ?? []).map((r: any) => ({
        ...r,
        farm_id: farmByNheSale[r.id] ?? null,
        cash_book_id: cbIdByNheSale[r.id] ?? null,
        cash_account_id: imprestByNheSale[r.id] ?? null,
      }))
    }
  })

  // The imprest for a site, and what each row would be tagged to. Derived from
  // where the cash was actually received, not from the flock's site -- those
  // can differ, and the receipt is the truthful one.
  const imprestForFarm = useMemo(() => {
    const m: Record<string, any> = {}
    for (const a of cashAccounts as any[]) if (a.farm_id) m[a.farm_id] = a
    return m
  }, [cashAccounts])
  const acctName = (id: string | null) =>
    (cashAccounts as any[]).find(a => a.id === id)?.name ?? null
  const targetFor = (r: any) =>
    (r.payment_cash ?? 0) > 0 && r.farm_id ? imprestForFarm[r.farm_id] ?? null : null

  const taggable = rows.filter((r: any) =>
    r.cash_book_id && !r.cash_account_id && targetFor(r))

  const tagMut = useMutation({
    mutationFn: async () => {
      if (!taggable.length) throw new Error('Nothing to tag in this view')
      const byAccount: Record<string, string[]> = {}
      for (const r of taggable) (byAccount[targetFor(r).id] ||= []).push(r.cash_book_id)
      for (const [acctId, ids] of Object.entries(byAccount)) {
        const { error } = await supabase.from('cash_book')
          .update({ cash_account_id: acctId }).in('id', ids)
        if (error) throw new Error(friendlyDbError(error))
      }
      return taggable.length
    },
    onSuccess: (n) => {
      toast.success(`Tagged ${n} cash receipt${n === 1 ? '' : 's'} to their site imprest`)
      qc.invalidateQueries({ queryKey: ['bird_sales_report'] })
      qc.invalidateQueries({ queryKey: ['cash_account_balances'] })
      qc.invalidateQueries({ queryKey: ['imprest_ledger'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const totals = rows.reduce((acc: any, r: any) => ({
    female: acc.female + (r.female_qty ?? 0),
    male: acc.male + (r.male_qty ?? 0),
    birds: acc.birds + (r.quantity ?? 0),
    net: acc.net + (r.net_weight_kg ?? 0),
    amount: acc.amount + (r.amount ?? 0),
    cash: acc.cash + (r.payment_cash ?? 0),
    online: acc.online + (r.payment_online ?? 0),
  }), { female: 0, male: 0, birds: 0, net: 0, amount: 0, cash: 0, online: 0 })

  const handleExport = () => {
    const headers = ['Date','Flock','Party','Sales DC No','Vehicle No','Bird Sex','Category','Sales/Female','Sales/Male','Total Birds',
      'Gross Weight','Tare Weight','Net Weight','Avg Weight','Rate per KG','Amount','GST %','Invoice No',
      'Cash','Cash Received At','Imprest','Online','Bank Account','Payment Mode','Payment Status','Refund Amount','Refund Date','Remarks']
    const dataRows = rows.map((r: any) => [
      fmtDate(r.sale_date), r.flocks?.flock_no ?? '', r.parties?.name ?? '',
      r.dc_no ?? '', r.vehicle_no ?? '', BIRD_SEX_LABEL[r.bird_sex] ?? r.bird_sex ?? '', BIRD_CAT_LABEL[r.bird_category] ?? r.bird_category ?? '',
      r.female_qty ?? '', r.male_qty ?? '', r.quantity ?? '',
      r.gross_weight_kg ?? '', r.tare_weight_kg ?? '', r.net_weight_kg ?? '', r.avg_weight_kg ?? '',
      r.rate_per_kg ?? '', r.amount ?? '', r.gst_pct ?? '', r.invoice_no ?? '',
      r.payment_cash ?? '', r.payment_cash ? cashLocationName(r.farm_id) : '',
      r.payment_cash ? (acctName(r.cash_account_id) ?? (targetFor(r) ? 'untagged (would be ' + targetFor(r).name + ')' : 'untagged - no imprest')) : '',
      r.payment_online ?? '', r.payment_online ? `${r.bank_accounts?.bank_name ?? ''}${r.bank_accounts?.account_name ? ' — '+r.bank_accounts.account_name : ''}` : '',
      r.payment_mode ?? '', r.payment_status ?? '', r.refund_amount ?? '', r.refund_date ? fmtDate(r.refund_date) : '', r.remarks ?? '',
    ])
    exportCSV(`bird_sales_report_${fromDate||'all'}_${toDate||'all'}.csv`, headers, dataRows)
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Bird / Cull Sales Report" subtitle="Bulk bird sales to outside parties (buyers) — excludes employee sales."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport} disabled={!rows.length}>Export CSV</Button>
            {canTag && taggable.length > 0 && (
              <Button size="sm" icon={<Tag size={14}/>} loading={tagMut.isPending}
                onClick={() => tagMut.mutate()}>
                Tag {taggable.length} to site imprest
              </Button>
            )}
          </div>
        } />

      <Card className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Select label="Flock" placeholder="All Flocks" value={flockId} onChange={e => setFlockId(e.target.value)}
            options={flocks.map((f: any) => ({ value: f.id, label: f.flock_no }))} />
          <SearchableSelect label="Party / Buyer" placeholder="All Parties" value={partyId} onChange={setPartyId}
            options={parties.map((p: any) => ({ value: p.id, label: p.name }))} />
          <Select label="Category" placeholder="All Categories" value={category} onChange={e => setCategory(e.target.value)}
            options={[{value:'cull',label:'Cull'},{value:'lame',label:'Lame'},{value:'weak',label:'Weak'},{value:'other',label:'Other'}]} />
          <div>
            <label className="text-sm font-medium text-gray-700">From</label>
            <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">To</label>
            <DateInput value={toDate} onChange={e => setToDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
        </div>
      </Card>

      {isLoading ? <Spinner /> : rows.length === 0 ? (
        <EmptyState icon={<Bird size={32}/>} title="No bird sales found" subtitle="Try widening the filters above." />
      ) : (
        <Card padding={false}>
          <CardHeader title={`${rows.length} sales — Total ${inr(totals.amount)}`} />
          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th>Date</Th><Th>Flock</Th><Th>Party</Th><Th>Sales DC No</Th><Th>Vehicle No</Th>
                <Th>Bird Sex</Th><Th>Category</Th>
                <Th right>Sales/Female</Th><Th right>Sales/Male</Th><Th right>Total Birds</Th>
                <Th right>Gross Wt</Th><Th right>Tare Wt</Th><Th right>Net Wt</Th><Th right>Avg Wt</Th>
                <Th right>Rate/KG</Th><Th right>Amount</Th><Th right>GST%</Th><Th>Invoice No</Th>
                <Th right>Cash</Th><Th>Cash At</Th><Th>Imprest</Th><Th right>Online</Th><Th>Bank Account</Th>
                <Th>Mode</Th><Th>Status</Th><Th right>Refund</Th><Th>Refund Date</Th><Th>Remarks</Th>
              </tr></thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="text-sm hover:bg-gray-50">
                    <Td className="text-xs">{fmtDate(r.sale_date)}</Td>
                    <Td className="text-xs">{r.flocks?.flock_no ?? '—'}</Td>
                    <Td className="text-xs">{r.parties?.name ?? '—'}</Td>
                    <Td className="text-xs">{r.dc_no ?? '—'}</Td>
                    <Td className="text-xs">{r.vehicle_no ?? '—'}</Td>
                    <Td className="text-xs">{BIRD_SEX_LABEL[r.bird_sex] ?? r.bird_sex ?? '—'}</Td>
                    <Td className="text-xs">{BIRD_CAT_LABEL[r.bird_category] ?? r.bird_category ?? '—'}</Td>
                    <Td right className="text-xs">{r.female_qty ?? '—'}</Td>
                    <Td right className="text-xs">{r.male_qty ?? '—'}</Td>
                    <Td right className="text-xs font-medium">{r.quantity ?? '—'}</Td>
                    <Td right className="text-xs">{r.gross_weight_kg ?? '—'}</Td>
                    <Td right className="text-xs">{r.tare_weight_kg ?? '—'}</Td>
                    <Td right className="text-xs">{r.net_weight_kg ?? '—'}</Td>
                    <Td right className="text-xs">{r.avg_weight_kg ?? '—'}</Td>
                    <Td right className="text-xs">{r.rate_per_kg ? inr(r.rate_per_kg) : '—'}</Td>
                    <Td right className="text-xs font-semibold">{inr(r.amount)}</Td>
                    <Td right className="text-xs">{r.gst_pct != null ? `${r.gst_pct}%` : '—'}</Td>
                    <Td className="text-xs">{r.invoice_no ?? '—'}</Td>
                    <Td right className="text-xs">{r.payment_cash ? inr(r.payment_cash) : '—'}</Td>
                    <Td className="text-xs">{r.payment_cash ? cashLocationName(r.farm_id) : '—'}</Td>
                    <Td className="text-xs">{
                      !r.payment_cash ? '—'
                        : r.cash_account_id
                          ? <span className="text-green-700">{acctName(r.cash_account_id) ?? 'tagged'}</span>
                          : targetFor(r)
                            ? <span className="text-gray-400">→ {targetFor(r).name}</span>
                            : <span className="text-amber-600">no imprest</span>
                    }</Td>
                    <Td right className="text-xs">{r.payment_online ? inr(r.payment_online) : '—'}</Td>
                    <Td className="text-xs">{r.payment_online ? `${r.bank_accounts?.bank_name ?? '—'}${r.bank_accounts?.account_name ? ' — '+r.bank_accounts.account_name : ''}` : '—'}</Td>
                    <Td className="text-xs">{r.payment_mode ?? '—'}</Td>
                    <Td className="text-xs">{r.payment_status ?? '—'}</Td>
                    <Td right className="text-xs">{r.refund_amount ? inr(r.refund_amount) : '—'}</Td>
                    <Td className="text-xs">{r.refund_date ? fmtDate(r.refund_date) : '—'}</Td>
                    <Td className="text-xs max-w-[160px] truncate">{r.remarks ?? '—'}</Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-sm">
                  <Td colSpan={7}>TOTAL</Td>
                  <Td right>{totals.female}</Td>
                  <Td right>{totals.male}</Td>
                  <Td right>{totals.birds}</Td>
                  <Td colSpan={2}></Td>
                  <Td right>{totals.net.toFixed(3)}</Td>
                  <Td colSpan={2}></Td>
                  <Td right className="text-green-700">{inr(totals.amount)}</Td>
                  <Td colSpan={2}></Td>
                  <Td right>{inr(totals.cash)}</Td>
                  <Td></Td>
                  <Td right>{inr(totals.online)}</Td>
                  <Td colSpan={6}></Td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
