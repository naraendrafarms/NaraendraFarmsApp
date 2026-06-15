import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, Button, Spinner } from '@/components/ui'
import toast from 'react-hot-toast'
import { Copy, CheckCircle } from 'lucide-react'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function num(n: number) { return n.toLocaleString('en-IN') }

export const DailySummaryPage: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [copied, setCopied] = useState(false)

  const { data: flocks, isLoading } = useQuery({
    queryKey: ['active_flocks_summary'],
    queryFn: async () => {
      const { data } = await supabase
        .from('flocks')
        .select('id, flock_no, breed, status, farms(name, code)')
        .in('status', ['rearing', 'laying'])
        .order('flock_no')
      return data ?? []
    }
  })

  const flockIds = flocks?.map((f: any) => f.id) ?? []

  const { data: records } = useQuery({
    queryKey: ['daily_summary_records', date, flockIds.join(',')],
    queryFn: async () => {
      if (!flockIds.length) return []
      const { data } = await supabase
        .from('daily_records')
        .select('flock_id, he_eggs_a, he_eggs_b, he_eggs_c, nhe_je, nhe_te, nhe_be, female_deaths, male_deaths, feed_kg, female_alive')
        .in('flock_id', flockIds)
        .eq('record_date', date)
      return data ?? []
    },
    enabled: flockIds.length > 0
  })

  const recordByFlock = React.useMemo(() => {
    const m: Record<string, any> = {}
    for (const r of (records ?? [])) m[r.flock_id] = r
    return m
  }, [records])

  const rows = React.useMemo(() => {
    return (flocks ?? []).map((f: any) => {
      const r = recordByFlock[f.id]
      if (!r) return { flock: f, hasData: false, he: 0, nhe: 0, total: 0, hd: null, deaths: 0, feed: 0 }
      const he = (r.he_eggs_a ?? 0) + (r.he_eggs_b ?? 0) + (r.he_eggs_c ?? 0)
      const nhe = (r.nhe_je ?? 0) + (r.nhe_te ?? 0) + (r.nhe_be ?? 0)
      const total = he + nhe
      const hd = r.female_alive > 0 ? (total / r.female_alive) * 100 : null
      const deaths = (r.female_deaths ?? 0) + (r.male_deaths ?? 0)
      return { flock: f, hasData: true, he, nhe, total, hd, deaths, feed: r.feed_kg ?? 0 }
    })
  }, [flocks, recordByFlock])

  const totals = React.useMemo(() => ({
    he: rows.reduce((s, r) => s + r.he, 0),
    nhe: rows.reduce((s, r) => s + r.nhe, 0),
    total: rows.reduce((s, r) => s + r.total, 0),
    deaths: rows.reduce((s, r) => s + r.deaths, 0),
    feed: rows.reduce((s, r) => s + r.feed, 0),
  }), [rows])

  const copyText = () => {
    const lines: string[] = [
      `🐔 Farm Report — ${fmtDate(date)}`,
      '================================',
    ]
    for (const row of rows) {
      const farmName = (row.flock as any).farms?.name ?? 'Unknown'
      lines.push(`Flock ${(row.flock as any).flock_no} (${farmName})`)
      if (!row.hasData) {
        lines.push('  No data entered')
      } else {
        lines.push(`  HE: ${num(row.he)} | NHE: ${num(row.nhe)} | Total: ${num(row.total)}`)
        lines.push(`  HD%: ${row.hd != null ? row.hd.toFixed(1) + '%' : '—'} | Deaths: ${row.deaths} | Feed: ${num(row.feed)} kg`)
      }
      lines.push('--------------------------------')
    }
    lines.push(`TOTAL: HE ${num(totals.he)} | NHE ${num(totals.nhe)} | Eggs ${num(totals.total)}`)
    lines.push(`Deaths: ${totals.deaths} | Feed: ${num(totals.feed)} kg`)

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 3000)
    })
  }

  if (isLoading) return <div className="flex justify-center p-8"><Spinner size={32} /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Farm Summary</h1>
          <p className="text-sm text-gray-500">Copy and paste into WhatsApp</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <Button onClick={copyText} variant={copied ? 'secondary' : 'primary'} size="sm">
            {copied
              ? <><CheckCircle size={15} className="mr-1" />Copied!</>
              : <><Copy size={15} className="mr-1" />Copy All</>}
          </Button>
        </div>
      </div>

      {rows.map(row => {
        const f = row.flock as any
        return (
          <Card key={f.id} padding={false}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold text-gray-900">Flock {f.flock_no}</span>
                  <span className="text-sm text-gray-500 ml-2">{f.farms?.name ?? '—'}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${f.status === 'laying' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {f.status}
                </span>
              </div>
              {!row.hasData ? (
                <p className="text-sm text-gray-400 italic">No data entered for this date</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">HE Eggs</span><span className="font-medium">{num(row.he)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">NHE Eggs</span><span className="font-medium">{num(row.nhe)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total Eggs</span><span className="font-bold">{num(row.total)}</span></div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">HD%</span>
                    <span className={`font-bold ${row.hd == null ? '' : row.hd >= 80 ? 'text-green-600' : row.hd >= 65 ? 'text-amber-600' : 'text-red-600'}`}>
                      {row.hd != null ? row.hd.toFixed(1) + '%' : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-gray-500">Deaths</span><span className={`font-medium ${row.deaths > 0 ? 'text-red-600' : ''}`}>{row.deaths}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Feed</span><span className="font-medium">{num(row.feed)} kg</span></div>
                </div>
              )}
            </div>
          </Card>
        )
      })}

      {rows.length > 0 && (
        <Card>
          <div className="p-4">
            <p className="font-bold text-gray-800 mb-2">Company Totals</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total HE</span><span className="font-bold text-green-700">{num(totals.he)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total NHE</span><span className="font-bold">{num(totals.nhe)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Eggs</span><span className="font-bold text-indigo-700">{num(totals.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Deaths</span><span className={`font-bold ${totals.deaths > 0 ? 'text-red-600' : ''}`}>{totals.deaths}</span></div>
              <div className="flex justify-between col-span-2"><span className="text-gray-500">Total Feed</span><span className="font-bold">{num(totals.feed)} kg</span></div>
            </div>
          </div>
        </Card>
      )}

      {rows.length === 0 && (
        <Card><div className="p-8 text-center text-gray-400">No active flocks found</div></Card>
      )}
    </div>
  )
}
