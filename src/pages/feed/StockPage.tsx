import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, exportCSV } from '@/lib/utils'
import { Card, SectionHeader, Spinner, Table, Th, Td, Badge, Button, DateInput } from '@/components/ui'
import { Download } from 'lucide-react'
import { useConfigValues } from '@/hooks/useConfigOptions'

export const StockPage: React.FC<{ feedOnly?: boolean }> = ({ feedOnly = false }) => {
  const [tab, setTab] = useState<'feed' | 'medicine'>('feed')
  const [q, setQ] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const feedCats = useConfigValues('ingredient_category', ['grain','protein','mineral','supplement','additive','other'])

  const { data: ingredients, isLoading: loadIng } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => { const { data } = await supabase.from('items').select('id,name,short_name,code,unit,category').eq('category', 'Feed Ingredient').eq('is_active', true).order('code'); return data ?? [] }
  })

  // Unified stock source: stock_ledger (correct item_id, grn_in / production_out / adjustments)
  const { data: ledger, isLoading: loadLedger } = useQuery({
    queryKey: ['feed_stock_ledger'],
    queryFn: async () => {
      let all: any[] = [], from = 0
      while (true) {
        const { data } = await supabase.from('stock_ledger')
          .select('id,item_id,item_name,txn_type,qty,unit_price,txn_date')
          // The id is a TIE-BREAKER, and it is not optional. Paging asks for
          // rows 0-999, then 1000-1999, and so on; with only txn_date to sort
          // by, rows sharing a date have no defined order and the server may
          // hand back a different arrangement for each page. A row can then
          // fall in the gap between two pages and never arrive — which is how
          // Alkakarb's 5,000 kg receipt of 11/06/2026 vanished from this page
          // while sitting in the ledger all along, and why the same page had
          // shown it correctly the day before.
          .order('txn_date', { ascending: true }).order('id').range(from, from + 999)
        if (!data || !data.length) break
        all = all.concat(data); if (data.length < 1000) break; from += 1000
      }
      return all
    }
  })

  const { data: medStock, isLoading: loadMed } = useQuery({
    queryKey: ['v_medicine_stock'],
    queryFn: async () => { const { data } = await supabase.from('v_medicine_stock').select('*').order('name'); return data ?? [] }
  })

  // dispatch_out was missing — those rows fell into the else branch and were ADDED to stock
  const OUT_TYPES = new Set(['production_out', 'medicine_out', 'adjustment_out', 'transfer_out', 'dispatch_out'])
  const norm = (s?: string | null) => (s ?? '').trim().toLowerCase()
  const stockMap = React.useMemo(() => {
    if (!ingredients) return []
    // Aggregate by BOTH item_id and normalized item_name, so rows linked either way are caught
    const inById: Record<string, number> = {}, outById: Record<string, number> = {}
    const inByName: Record<string, number> = {}, outByName: Record<string, number> = {}
    const priceById: Record<string, number> = {}, dateById: Record<string, string> = {}
    const priceByName: Record<string, number> = {}, dateByName: Record<string, string> = {}

    // Opening = everything BEFORE the From date. Period = inside the range.
    // Balance is then opening + received − used, i.e. the closing stock on the
    // To date — a real stock statement rather than a lifetime total with a
    // date box bolted on. With no range set, opening is nil and the period is
    // all of history, so the page reads exactly as it did before.
    const opById: Record<string, number> = {}, opByName: Record<string, number> = {}
    const inRange = (d?: string | null) => {
      const t = d ?? ''
      return (!fromDate || t >= fromDate) && (!toDate || t <= toDate)
    }
    const isBefore = (d?: string | null) => !!fromDate && (d ?? '') < fromDate

    for (const r of ledger ?? []) {
      const q = Number(r.qty ?? 0)
      const nm = norm(r.item_name)
      const isOut = OUT_TYPES.has(r.txn_type)
      const signed = isOut ? -q : q
      if (isBefore(r.txn_date)) {
        if (r.item_id) opById[r.item_id] = (opById[r.item_id] ?? 0) + signed
        if (nm) opByName[nm] = (opByName[nm] ?? 0) + signed
        continue
      }
      // A rate is worth taking from any inward row, even one outside the range —
      // otherwise an item last purchased before the From date would value at
      // zero and the stock value would be wrong rather than merely narrow.
      if (!isOut && r.unit_price != null) {
        if (r.item_id && (r.txn_date ?? '') >= (dateById[r.item_id] ?? '')) { priceById[r.item_id] = Number(r.unit_price); dateById[r.item_id] = r.txn_date }
        if (nm && (r.txn_date ?? '') >= (dateByName[nm] ?? '')) { priceByName[nm] = Number(r.unit_price); dateByName[nm] = r.txn_date }
      }
      if (!inRange(r.txn_date)) continue
      if (r.item_id) {
        if (isOut) outById[r.item_id] = (outById[r.item_id] ?? 0) + q
        else { inById[r.item_id] = (inById[r.item_id] ?? 0) + q
          // Rate from ANY inward txn (grn_in, opening, adjustment_in) — not
          // just GRN, so items priced only via an Inventory opening/adjustment
          // entry still show a rate instead of "—".
          if (r.unit_price != null && (r.txn_date ?? '') >= (dateById[r.item_id] ?? '')) { priceById[r.item_id] = Number(r.unit_price ?? 0); dateById[r.item_id] = r.txn_date } }
      }
      if (nm) {
        if (isOut) outByName[nm] = (outByName[nm] ?? 0) + q
        else { inByName[nm] = (inByName[nm] ?? 0) + q
          if (r.unit_price != null && (r.txn_date ?? '') >= (dateByName[nm] ?? '')) { priceByName[nm] = Number(r.unit_price ?? 0); dateByName[nm] = r.txn_date } }
      }
    }

    return ingredients.map((ing: any) => {
      const nm = norm(ing.name)
      // Prefer id-linked totals; if none for this item, fall back to name-linked
      const hasById = (inById[ing.id] ?? 0) !== 0 || (outById[ing.id] ?? 0) !== 0 || (opById[ing.id] ?? 0) !== 0
      const totalIn  = hasById ? (inById[ing.id] ?? 0)  : (inByName[nm] ?? 0)
      const totalOut = hasById ? (outById[ing.id] ?? 0) : (outByName[nm] ?? 0)
      const opening  = hasById ? (opById[ing.id] ?? 0)  : (opByName[nm] ?? 0)
      const balance = opening + totalIn - totalOut
      const rate = (priceById[ing.id] ?? 0) || (priceByName[nm] ?? 0)
      return {
        ...ing, opening, total_in: totalIn, total_out: totalOut, balance, rate,
        value: balance * rate, last_grn: dateById[ing.id] ?? dateByName[nm] ?? null,
      }
    })
  }, [ingredients, ledger, fromDate, toDate])

  const totalValue = stockMap.reduce((s, r) => s + (r.value ?? 0), 0)
  const isFeedLoading = loadIng || loadLedger

  const ranged = !!(fromDate || toDate)
  const qNorm = norm(q)
  const filteredStock = qNorm ? stockMap.filter((r: any) =>
    norm(r.name).includes(qNorm) || norm(r.short_name).includes(qNorm) || norm(r.code).includes(qNorm)) : stockMap
  const filteredMedStock = qNorm ? (medStock ?? []).filter((r: any) =>
    norm(r.name).includes(qNorm) || norm(r.type).includes(qNorm)) : (medStock ?? [])

  const tabs = [
    { key: 'feed' as const,     label: 'Feed Ingredients' },
    { key: 'medicine' as const, label: 'Medicine & Vaccine' },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader title="Feed Stock Status" subtitle="Feed ingredients stock (GRN received − production used). For medicine/vaccine stock see Medicine & Vaccine tab."
        action={<Button variant="outline" icon={<Download size={14}/>} onClick={() => tab === 'feed'
          ? exportCSV(`feed_stock${fromDate || toDate ? `_${fromDate || 'start'}_to_${toDate || 'today'}` : ''}.csv`,
              ['Code','Ingredient','Unit','Opening','Received','Used','Closing','Rate','Value','Last GRN'],
              stockMap.map((r: any) => [r.code ?? '', r.name ?? '', r.unit ?? '', r.opening ?? 0, r.total_in ?? 0, r.total_out ?? 0, r.balance ?? 0, r.rate ?? 0, r.value ?? 0, r.last_grn ?? '']))
          : exportCSV('medicine_vaccine_stock.csv', ['Name','Type','Unit','Total In','Used','Balance','Last Rate'],
              (medStock as any[] ?? []).filter((r: any) => (r.purchased_qty ?? 0) > 0)
                .map((r: any) => [r.name ?? '', r.type ?? '', r.unit ?? '', r.purchased_qty ?? 0, r.used_qty ?? 0, r.balance_qty ?? 0, r.master_rate ?? 0]))
        }>Export Excel</Button>} />

      {/* Tab bar — hidden when feedOnly */}
      {!feedOnly && (
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
                ${tab === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-end">
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder={tab === 'feed' ? 'Search by code or ingredient name…' : 'Search by medicine/vaccine name or type…'}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-brand-500 w-72" />
        {tab === 'feed' && <>
          <label className="flex items-center gap-1.5 text-sm text-gray-600">From
            <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)} /></label>
          <label className="flex items-center gap-1.5 text-sm text-gray-600">To
            <DateInput value={toDate} onChange={e => setToDate(e.target.value)} /></label>
          {ranged && <Button variant="ghost" size="sm" onClick={() => { setFromDate(''); setToDate('') }}>Clear dates</Button>}
        </>}
      </div>
      {tab === 'feed' && ranged && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Showing <strong>{fromDate ? fromDate : 'the beginning'} → {toDate ? toDate : 'today'}</strong>.
          <strong> Received</strong> and <strong>Used</strong> are for this period only; <strong>Opening</strong> is the
          stock before it and <strong>Balance</strong> is the closing stock at the end of it — so the row reads as a
          stock statement, not a lifetime total with dates applied to part of it.
        </div>
      )}

      {tab === 'feed' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><p className="text-xs text-gray-400">{ranged ? 'Received in period' : 'Total Ingredients'}</p>
              <p className="text-xl font-bold">{ranged
                ? `${Math.round(stockMap.reduce((s, r) => s + (r.total_in ?? 0), 0)).toLocaleString('en-IN')} kg`
                : stockMap.length}</p></Card>
            <Card><p className="text-xs text-gray-400">Total Stock Value</p><p className="text-xl font-bold text-blue-700">{inr(totalValue)}</p></Card>
            <Card><p className="text-xs text-gray-400">{ranged ? 'Consumed in period' : 'Items in Stock'}</p>
              <p className="text-xl font-bold text-green-700">{ranged
                ? `${Math.round(stockMap.reduce((s, r) => s + (r.total_out ?? 0), 0)).toLocaleString('en-IN')} kg`
                : stockMap.filter(r => r.balance > 0).length}</p></Card>
            <Card><p className="text-xs text-gray-400">Zero/Negative</p><p className="text-xl font-bold text-red-600">{stockMap.filter(r => r.balance <= 0).length}</p></Card>
          </div>
          {isFeedLoading ? <Spinner/> : (
            <Card padding={false}>
              <Table>
                <thead><tr>
                  <Th>Code</Th><Th>Ingredient</Th><Th>Unit</Th>
                  {ranged && <Th right>Opening (kg)</Th>}
                  <Th right>{ranged ? 'Received (kg)' : 'Total In (kg)'}</Th>
                  <Th right>Used (kg)</Th><Th right>{ranged ? 'Closing (kg)' : 'Balance (kg)'}</Th>
                  <Th right>Rate</Th><Th right>Stock Value</Th><Th>Last GRN</Th>
                </tr></thead>
                <tbody>
                  {filteredStock.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <Td><span className="font-mono text-xs font-bold text-brand-700">{r.code}</span></Td>
                      <Td className="font-medium">{r.short_name ?? r.name}</Td>
                      <Td>{r.unit}</Td>
                      {ranged && <Td right className="text-gray-500">{Math.round(r.opening).toLocaleString('en-IN')}</Td>}
                      <Td right>{Math.round(r.total_in).toLocaleString('en-IN')}</Td>
                      <Td right className="text-orange-600">{Math.round(r.total_out).toLocaleString('en-IN')}</Td>
                      <Td right>
                        <Badge color={r.balance > 5000 ? 'green' : r.balance > 0 ? 'yellow' : 'red'}>
                          {Math.round(r.balance).toLocaleString('en-IN')}
                        </Badge>
                      </Td>
                      <Td right className="text-xs">{r.rate > 0 ? `Rs ${r.rate.toFixed(2)}` : '—'}</Td>
                      <Td right className="font-medium">{r.value > 0 ? inr(r.value) : '—'}</Td>
                      <Td className="text-xs text-gray-400">{r.last_grn ?? '—'}</Td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-brand-50 font-semibold text-brand-800 border-t-2 border-brand-200">
                    <Td colSpan={3}>TOTAL ({filteredStock.length} ingredients)</Td>
                    {ranged && <Td right>{Math.round(filteredStock.reduce((s: number, r: any) => s + (r.opening ?? 0), 0)).toLocaleString('en-IN')}</Td>}
                    <Td right>{Math.round(filteredStock.reduce((s: number, r: any) => s + (r.total_in ?? 0), 0)).toLocaleString('en-IN')}</Td>
                    <Td right className="text-orange-700">{Math.round(filteredStock.reduce((s: number, r: any) => s + (r.total_out ?? 0), 0)).toLocaleString('en-IN')}</Td>
                    <Td right>{Math.round(filteredStock.reduce((s: number, r: any) => s + (r.balance ?? 0), 0)).toLocaleString('en-IN')}</Td>
                    <Td></Td>
                    <Td right>{inr(filteredStock.reduce((s: number, r: any) => s + (r.value ?? 0), 0))}</Td>
                    <Td></Td>
                  </tr>
                </tfoot>
              </Table>
            </Card>
          )}
        </>
      )}

      {tab === 'medicine' && (
        <>
          {(() => {
            const purchased = filteredMedStock.filter((r: any) => (r.purchased_qty ?? 0) > 0)
            const inStock   = purchased.filter((r: any) => (r.balance_qty ?? 0) > 0)
            const outStock  = purchased.filter((r: any) => (r.balance_qty ?? 0) <= 0)
            return <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card><p className="text-xs text-gray-400">Items Purchased</p><p className="text-xl font-bold">{purchased.length}</p></Card>
                <Card><p className="text-xs text-gray-400">In Stock</p><p className="text-xl font-bold text-green-700">{inStock.length}</p></Card>
                <Card><p className="text-xs text-gray-400">Zero/Out</p><p className="text-xl font-bold text-red-600">{outStock.length}</p></Card>
              </div>
              {loadMed ? <Spinner/> : (
                <Card padding={false}>
                  <Table>
                    <thead><tr>
                      <Th>Medicine / Vaccine</Th><Th>Type</Th><Th>Unit</Th>
                      <Th right>Total In</Th><Th right>Used</Th><Th right>Balance</Th>
                      <Th right>Last Rate</Th><Th>Last GRN</Th>
                    </tr></thead>
                    <tbody>
                      {purchased.map((r: any) => (
                        <tr key={r.medicine_id} className="hover:bg-gray-50">
                          <Td className="font-medium">{r.name}</Td>
                          <Td><Badge color={r.type === 'vaccine' ? 'blue' : 'gray'}>{r.type ?? 'Medicine'}</Badge></Td>
                          <Td>{r.unit ?? '—'}</Td>
                          <Td right>{(r.purchased_qty ?? 0).toLocaleString('en-IN')}</Td>
                          <Td right className="text-orange-600">{(r.used_qty ?? 0).toLocaleString('en-IN')}</Td>
                          <Td right>
                            <Badge color={(r.balance_qty ?? 0) > 0 ? 'green' : 'red'}>
                              {(r.balance_qty ?? 0).toLocaleString('en-IN')}
                            </Badge>
                          </Td>
                          <Td right className="text-xs">{r.master_rate > 0 ? `Rs ${Number(r.master_rate).toFixed(2)}` : '—'}</Td>
                          <Td className="text-xs text-gray-400">{r.last_purchase_date ?? '—'}</Td>
                        </tr>
                      ))}
                      {purchased.length === 0 && (
                        <tr><Td colSpan={8} className="text-center text-gray-400 py-6">
                          No medicine/vaccine GRN found. Enter medicine receipts in GRN — Goods Received (category = Medicine/Vaccine).
                        </Td></tr>
                      )}
                    </tbody>
                  </Table>
                </Card>
              )}
            </>
          })()}
        </>
      )}
    </div>
  )
}
