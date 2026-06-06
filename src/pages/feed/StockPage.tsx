import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import { Card, SectionHeader, Spinner, Table, Th, Td, Badge } from '@/components/ui'

export const StockPage: React.FC = () => {
  const { data: ingredients, isLoading: loadIng } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => { const { data } = await supabase.from('feed_ingredients').select('id,name,short_name,code,unit').eq('is_active', true).order('code'); return data ?? [] }
  })

  const { data: grns, isLoading: loadGrn } = useQuery({
    queryKey: ['grn_stock'],
    queryFn: async () => { const { data } = await supabase.from('grn').select('ingredient_id,qty'); return data ?? [] }
  })

  const { data: productionUsage, isLoading: loadProd } = useQuery({
    queryKey: ['prod_usage_stock'],
    queryFn: async () => { const { data } = await supabase.from('feed_production_ingredients').select('ingredient_id,qty_used_kg'); return data ?? [] }
  })

  const { data: latestGrns } = useQuery({
    queryKey: ['grn_latest'],
    queryFn: async () => {
      const { data } = await supabase.from('grn').select('ingredient_id,grn_date,price_per_unit,qty').order('grn_date', { ascending: false }).limit(200)
      return data ?? []
    }
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

    return ingredients.map((ing: any) => {
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
  }, [ingredients, grns, productionUsage, latestGrns])

  const totalValue = stockMap.reduce((s, r) => s + (r.value ?? 0), 0)
  const isLoading = loadIng || loadGrn || loadProd

  return (
    <div className="space-y-5">
      <SectionHeader title="Feed Stock Status" subtitle="Current ingredient balances (GRN received minus production used)"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><p className="text-xs text-gray-400">Total Ingredients</p><p className="text-xl font-bold">{stockMap.length}</p></Card>
        <Card><p className="text-xs text-gray-400">Total Stock Value</p><p className="text-xl font-bold text-blue-700">{inr(totalValue)}</p></Card>
        <Card><p className="text-xs text-gray-400">Items in Stock</p><p className="text-xl font-bold text-green-700">{stockMap.filter(r => r.balance > 0).length}</p></Card>
        <Card><p className="text-xs text-gray-400">Zero/Negative</p><p className="text-xl font-bold text-red-600">{stockMap.filter(r => r.balance <= 0).length}</p></Card>
      </div>
      {isLoading ? <Spinner/> : (
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
    </div>
  )
}
