import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today, fmtDate } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import {
  Card, CardHeader, Select, Spinner, EmptyState, DateInput,
  Table, Th, Td, Badge, Button,
} from '@/components/ui'
import { Download } from 'lucide-react'
import { lineSex } from '@/lib/lineSex'
import * as XLSX from 'xlsx'

// Line-wise reporting over a date range, shed by shed.
//
// READ ONLY. This page writes nothing at all -- not to the line tables and not
// to daily_records. It exists so the line figures can be looked at without
// going through the entry screen day by day.
//
// Every shed total is shown against the shed's OWN daily_records total for the
// same range, so line entry can be checked against the figures the site manager
// closed on the existing screens. The two are compared, never reconciled
// automatically -- the existing entry stays exactly as it is.

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0)

export const LineReports: React.FC = () => {
  const { profile } = useAuth()
  const [shedId, setShedId] = useState('')
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(today())
  const [sideFilter, setSideFilter] = useState('')

  const { data: sheds } = useQuery({
    queryKey: ['line_report_sheds', profile?.id, profile?.role],
    queryFn: async () => {
      const { data } = await supabase.from('sheds')
        .select('id,shed_no,shed_name,farms(name)').eq('line_managed', true).order('shed_no')
      const all = data ?? []
      // A shed supervisor reports only on their own sheds, the same rule the
      // entry screen uses. Everyone else sees every line-managed shed.
      if (profile?.role !== 'shed_supervisor') return all
      const { data: mine } = await supabase
        .from('profile_sheds').select('shed_id').eq('profile_id', profile.id)
      const allowed = new Set((mine ?? []).map((r: any) => r.shed_id))
      return all.filter((s: any) => allowed.has(s.id))
    },
  })

  React.useEffect(() => {
    if (!shedId && sheds?.length) setShedId(sheds[0].id)
  }, [sheds, shedId])

  const { data, isLoading } = useQuery({
    queryKey: ['line_report', shedId, from, to],
    enabled: !!shedId && !!from && !!to,
    queryFn: async () => {
      const { data: lines } = await supabase.from('shed_lines')
        .select('id,side,line_no,boxes,boxes_female,boxes_male,birds_per_box')
        .eq('shed_id', shedId).eq('is_active', true).order('side').order('line_no')
      const ids = (lines ?? []).map((l: any) => l.id)
      if (!ids.length) return { lines: [], prod: [], mort: [], feed: [], bal: [], shed: [] }
      const [prod, mort, feed, bal, shed] = await Promise.all([
        supabase.from('line_production').select('line_id,eggs,record_date')
          .in('line_id', ids).gte('record_date', from).lte('record_date', to),
        supabase.from('line_mortality')
          .select('line_id,morning_female,morning_male,day_female,day_male,record_date')
          .in('line_id', ids).gte('record_date', from).lte('record_date', to),
        supabase.from('line_feed').select('line_id,female_kg,male_kg,record_date')
          .in('line_id', ids).gte('record_date', from).lte('record_date', to),
        supabase.from('v_line_balance').select('*').in('line_id', ids),
        supabase.from('daily_records')
          .select('record_date,total_eggs,mortality_female,mortality_male,feed_female_kg,feed_male_kg')
          .eq('shed_id', shedId).gte('record_date', from).lte('record_date', to),
      ])
      return {
        lines: lines ?? [], prod: prod.data ?? [], mort: mort.data ?? [],
        feed: feed.data ?? [], bal: bal.data ?? [], shed: shed.data ?? [],
      }
    },
  })

  const rows = useMemo(() => {
    if (!data) return []
    const byLine: Record<string, any> = {}
    for (const l of data.lines as any[]) {
      byLine[l.id] = {
        ...l, eggs: 0, mMornF: 0, mMornM: 0, mDayF: 0, mDayM: 0, feedF: 0, feedM: 0,
        bal: (data.bal as any[]).find(b => b.line_id === l.id) ?? null,
      }
    }
    for (const p of data.prod as any[]) if (byLine[p.line_id]) byLine[p.line_id].eggs += p.eggs ?? 0
    for (const m of data.mort as any[]) {
      const r = byLine[m.line_id]; if (!r) continue
      r.mMornF += m.morning_female ?? 0; r.mMornM += m.morning_male ?? 0
      r.mDayF += m.day_female ?? 0;      r.mDayM += m.day_male ?? 0
    }
    for (const f of data.feed as any[]) {
      const r = byLine[f.line_id]; if (!r) continue
      r.feedF += Number(f.female_kg ?? 0); r.feedM += Number(f.male_kg ?? 0)
    }
    return Object.values(byLine)
      .filter((r: any) => !sideFilter || r.side === sideFilter)
  }, [data, sideFilter])

  const sides = useMemo(
    () => Array.from(new Set((data?.lines ?? []).map((l: any) => l.side))).sort(),
    [data])

  // Line totals over the WHOLE shed, not the filtered view, so the comparison
  // against the shed's own record stays honest when a side is selected.
  const totals = useMemo(() => {
    const t = { eggs: 0, mortF: 0, mortM: 0, morn: 0, day: 0, feedF: 0, feedM: 0, birds: 0, cap: 0 }
    if (!data) return t
    for (const p of data.prod as any[]) t.eggs += p.eggs ?? 0
    for (const m of data.mort as any[]) {
      t.mortF += (m.morning_female ?? 0) + (m.day_female ?? 0)
      t.mortM += (m.morning_male ?? 0) + (m.day_male ?? 0)
      t.morn += (m.morning_female ?? 0) + (m.morning_male ?? 0)
      t.day += (m.day_female ?? 0) + (m.day_male ?? 0)
    }
    for (const f of data.feed as any[]) {
      t.feedF += Number(f.female_kg ?? 0); t.feedM += Number(f.male_kg ?? 0)
    }
    for (const b of data.bal as any[]) t.birds += (b.current_female ?? 0) + (b.current_male ?? 0)
    for (const l of data.lines as any[]) t.cap += (l.boxes ?? 0) * (l.birds_per_box ?? 0)
    return t
  }, [data])

  const shedTotals = useMemo(() => {
    const t = { eggs: 0, mortF: 0, mortM: 0, feedF: 0, feedM: 0, days: 0 }
    for (const d of (data?.shed ?? []) as any[]) {
      t.eggs += d.total_eggs ?? 0
      t.mortF += d.mortality_female ?? 0; t.mortM += d.mortality_male ?? 0
      t.feedF += Number(d.feed_female_kg ?? 0); t.feedM += Number(d.feed_male_kg ?? 0)
      t.days += 1
    }
    return t
  }, [data])

  const shed = (sheds ?? []).find((s: any) => s.id === shedId) as any

  const exportXlsx = () => {
    const out = rows.map((r: any) => ({
      Side: r.side, Line: r.line_no, Holds: lineSex(r) ?? '',
      Boxes: r.boxes ?? '', 'Birds/Box': r.birds_per_box ?? '',
      Capacity: (r.boxes ?? 0) * (r.birds_per_box ?? 0) || '',
      'Birds Now F': r.bal?.current_female ?? '', 'Birds Now M': r.bal?.current_male ?? '',
      Eggs: r.eggs, 'HD %': pct(r.eggs, (r.bal?.current_female ?? 0) * Math.max(1, shedTotals.days)),
      'Mort Morning': r.mMornF + r.mMornM, 'Mort Day': r.mDayF + r.mDayM,
      'Mort F': r.mMornF + r.mDayF, 'Mort M': r.mMornM + r.mDayM,
      'Feed F kg': r.feedF, 'Feed M kg': r.feedM,
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(out), 'Line Report')
    XLSX.writeFile(wb, `line-report-shed-${shed?.shed_no ?? ''}-${from}-to-${to}.xlsx`)
  }

  const Gap: React.FC<{ label: string; line: number; shedVal: number; unit?: string }> =
    ({ label, line, shedVal, unit = '' }) => {
      const g = Math.round((line - shedVal) * 100) / 100
      return (
        <div className="text-xs">
          <span className="text-gray-500">{label}</span>{' '}
          <strong>{line.toLocaleString('en-IN')}{unit}</strong>
          {shedVal === 0 ? <span className="ml-1 text-gray-400">— no shed figure</span>
            : g === 0 ? <span className="ml-1 text-green-600">= shed</span>
            : <span className="ml-1 text-amber-600">
                vs shed {shedVal.toLocaleString('en-IN')}{unit} ({g > 0 ? '+' : ''}{g.toLocaleString('en-IN')})
              </span>}
        </div>
      )
    }

  return (
    <div className="space-y-4">
      <CardHeader
        title="Line Reports"
        subtitle="Line-wise eggs, mortality and feed over a date range, shed by shed — read only, nothing here changes any entry"
        action={rows.length > 0
          ? <Button variant="outline" icon={<Download size={16} />} onClick={exportXlsx}>Export</Button>
          : undefined} />

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Select label="Shed" value={shedId}
            onChange={e => setShedId((e.target as HTMLSelectElement).value)}
            options={(sheds ?? []).map((s: any) => ({
              value: s.id,
              label: `${s.farms?.name ?? ''} — Shed ${s.shed_no}${s.shed_name ? ` (${s.shed_name})` : ''}`,
            }))} />
          <DateInput label="From" value={from} onChange={setFrom} />
          <DateInput label="To" value={to} onChange={setTo} />
          <Select label="Side / Lines" value={sideFilter}
            onChange={e => setSideFilter((e.target as HTMLSelectElement).value)}
            options={[{ value: '', label: 'All lines' },
              ...sides.map((sd: any) => ({ value: sd, label: `Side ${sd}` }))]} />
        </div>
      </Card>

      {!sheds?.length ? (
        <EmptyState title="No line-managed sheds"
          subtitle="A shed appears here once it is switched to line-managed." />
      ) : isLoading ? <Spinner /> : rows.length === 0 ? (
        <EmptyState title="No lines to report"
          subtitle="This shed has no active lines, or the side filter matched none." />
      ) : (
        <Card padding={false}>
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-x-6 gap-y-1">
            <Gap label="Line eggs" line={totals.eggs} shedVal={shedTotals.eggs} />
            <Gap label="Mortality F" line={totals.mortF} shedVal={shedTotals.mortF} />
            <Gap label="M" line={totals.mortM} shedVal={shedTotals.mortM} />
            <Gap label="Feed F" line={totals.feedF} shedVal={shedTotals.feedF} unit=" kg" />
            <div className="text-xs text-gray-500">
              Morning <strong>{totals.morn.toLocaleString('en-IN')}</strong>
              {' / '}Day <strong>{totals.day.toLocaleString('en-IN')}</strong>
            </div>
            <div className="text-xs text-gray-500">
              Birds now <strong>{totals.birds.toLocaleString('en-IN')}</strong>
              {totals.cap > 0 && <> of <strong>{totals.cap.toLocaleString('en-IN')}</strong> capacity</>}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th>Side</Th><Th>Line</Th><Th>Holds</Th>
                <Th right>Boxes</Th><Th right>Capacity</Th>
                <Th right>Birds F</Th><Th right>Birds M</Th>
                <Th right>Eggs</Th><Th right>Eggs/Bird</Th>
                <Th right>Morning</Th><Th right>Day</Th><Th right>Mort Total</Th>
                <Th right>Feed F kg</Th><Th right>Feed M kg</Th>
              </tr></thead>
              <tbody>
                {rows.map((r: any) => {
                  const sx = lineSex(r)
                  const birdsF = r.bal?.current_female ?? 0
                  const cap = (r.boxes ?? 0) * (r.birds_per_box ?? 0)
                  const mort = r.mMornF + r.mMornM + r.mDayF + r.mDayM
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <Td><Badge color="blue">{r.side}</Badge></Td>
                      <Td>{r.line_no}</Td>
                      <Td>{sx == null ? <span className="text-gray-300">—</span>
                        : <Badge color={sx === 'M' ? 'orange' : sx === 'F' ? 'blue' : 'gray'}>{sx}</Badge>}</Td>
                      <Td right className="text-gray-500">{r.boxes ?? '—'}</Td>
                      <Td right className="text-gray-500">{cap || '—'}</Td>
                      <Td right>{birdsF || ''}</Td>
                      <Td right>{r.bal?.current_male || ''}</Td>
                      <Td right><strong>{r.eggs || ''}</strong></Td>
                      <Td right className="text-gray-500">
                        {birdsF > 0 && r.eggs > 0 ? (r.eggs / birdsF).toFixed(2) : ''}
                      </Td>
                      <Td right>{(r.mMornF + r.mMornM) || ''}</Td>
                      <Td right>{(r.mDayF + r.mDayM) || ''}</Td>
                      <Td right className={mort > 0 ? 'text-red-600 font-semibold' : ''}>{mort || ''}</Td>
                      <Td right>{r.feedF ? r.feedF.toFixed(1) : ''}</Td>
                      <Td right>{r.feedM ? r.feedM.toFixed(1) : ''}</Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>

          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
            {shed?.farms?.name} — Shed {shed?.shed_no} · {fmtDate(from)} to {fmtDate(to)} ·
            {' '}{shedTotals.days} day{shedTotals.days === 1 ? '' : 's'} of shed records in range.
            Totals above cover the whole shed even when a side is selected. Eggs/Bird is the
            range total divided by the birds on the line now, not a daily rate.
          </div>
        </Card>
      )}
    </div>
  )
}
