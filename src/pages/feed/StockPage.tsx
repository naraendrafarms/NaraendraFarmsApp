import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import { Card, SectionHeader, Spinner, Table, Th, Td, Badge } from '@/components/ui'

export const StockPage: React.FC<{ feedOnly?: boolean }> = ({ feedOnly = false }) => {
  const [tab, setTab] = useState<'feed' | 'medicine'>('feed')

  const { data: ingredients, isLoading: loadIng } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => { const { data } = await supabase.from('feed_ingredients').select('id,name,short_name,code,unit,category').eq('is_active', true).order('code'); return data ?? [] }
  })

  const { data: grns, isLoading: loadGrn } = useQuery({
    queryKey: ['grn_stock'],
    queryFn: async () => { const { data } = await supabase.from('grn').select('ingredient_id,qty').eq('category', 'Feed'); return data ?? [] }
  })

  const { data: productionUsage, isLoading: loadProd } = useQuery({
    queryKey: ['prod_usage_stock'],
    queryFn: async () => { const { data } = await supabase.from('feed_production_ingredients').select('ingredient_id,qty_used_kg'); return data ?? [] }
  })

  const { data: latestGrns } = useQuery({
    queryKey: ['grn_latest'],
    queryFn: async () => {
      const { data } = await supabase.from('grn').select('ingredient_id,grn_date,price_per_unit,qty').eq('category', 'Feed').order('grn_date', { ascending: false }).limit(200)
      return data ?? []
    }
  })

  const { data: medStock, isLoading: loadMed } = useQuery({
    queryKey: ['v_medicine_stock'],
    queryFn: async () => { const { data } = await supabase.from('v_medicine_stock').select('*').order('name'); return data ?? [] }
  })

  const stockMap = React.useMemo(() => {
    if (!ingredients) return []
    const inMap: Record<string, number> = {}
    const outMap: Record<string, number> = {}
    const priceMap: Record<string, number> = {}
    const dateMap: Record<string, string> = {}

    for (const g of grns ?? []) {
      if (!g.ingredient_id) continue
      inMap[g.ingredient_id] = (inMap[g.ingredient_id] ?? 0) + (g.qty ?? 0)
    }
    for (const u of productionUsage ?? []) {
      if (!u.ingredient_id) continue
      outMap[u.ingredient_id] = (outMap[u.ingredient_id] ?? 0) + (u.qty_used_kg ?? 0)
    }
    for (const g of latestGrns ?? []) {
      if (!g.ingredient_id || priceMap[g.ingredient_id]) continue
      priceMap[g.ingredient_id] = g.price_per_unit ?? 0
      dateMap[g.ingredient_id] = g.grn_date
    }

    const FEED_CATS = ['grain','protein','mineral','supplement','additive','other']
    return ingredients
      .map((ing: any) => {
        const totalIn = inMap[ing.id] ?? 0
        const totalOut = outMap[ing.id] ?? 0
        const balance = totalIn - totalOut
        const rate = priceMap[ing.id] ?? 0
        return {
          ...ing,
          total_in: totalIn,
          total_out: totalOut,
          balance,
          rate,
          value: balance * rate,
          last_grn: dateMap[ing.id] ?? null,
        }
      })
      // Hide items with no category (auto-added/wrong table) that have zero stock
      .filter((r: any) => FEED_CATS.includes(r.category) || r.total_in > 0)
  }, [ingredients, grns, productionUsage, latestGrns])

  const totalValue = stockMap.reduce((s, r) => s + (r.value ?? 0), 0)
  const isFeedLoading = loadIng || loadGrn || loadProd

  const tabs = [
    { key: 'feed' as const,     label: 'Feed Ingredients' },
    { key: 'medicine' as const, label: 'Medicine & Vaccine' },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader title="Feed Stock Status" subtitle="Feed ingredients stock (GRN received − production used). For medicine/vaccine stock see Medicine & Vaccine tab."/>

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

      {tab === 'feed' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><p className="text-xs text-gray-400">Total Ingredients</p><p className="text-xl font-bold">{stockMap.length}</p></Card>
            <Card><p className="text-xs text-gray-400">Total Stock Value</p><p className="text-xl font-bold text-blue-700">{inr(totalValue)}</p></Card>
            <Card><p className="text-xs text-gray-400">Items in Stock</p><p className="text-xl font-bold text-green-700">{stockMap.filter(r => r.balance > 0).length}</p></Card>
            <Card><p className="text-xs text-gray-400">Zero/Negative</p><p className="text-xl font-bold text-red-600">{stockMap.filter(r => r.balance <= 0).length}</p></Card>
          </div>
          {isFeedLoading ? <Spinner/> : (
            <Card padding={false}>
              <Table>
                <thead><tr>
                  <Th>Code</Th><Th>Ingredient</Th><Th>Unit</Th>
                  <Th right>Total In (kg)</Th><Th right>Used (kg)</Th><Th right>Balance (kg)</Th>
                  <Th right>Rate</Th><Th right>Stock Value</Th><Th>Last GRN</Th>
                </tr></thead>
                <tbody>
                  {stockMap.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <Td><span className="font-mono text-xs font-bold text-brand-700">{r.code}</span></Td>
                      <Td className="font-medium">{r.short_name ?? r.name}</Td>
                      <Td>{r.unit}</Td>
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
                  <tr className="bg-gray-50 font-semibold">
                    <Td colSpan={7}>TOTAL STOCK VALUE</Td>
                    <Td right>{inr(totalValue)}</Td>
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
            const purchased = (medStock ?? []).filter((r: any) => (r.purchased_qty ?? 0) > 0)
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
