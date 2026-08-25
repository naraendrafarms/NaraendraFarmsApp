import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { fmtDate } from '@/lib/utils'
import {
  Card, Button, Table, Th, Td, SectionHeader, Spinner, EmptyState, SearchableSelect, DateInput
} from '@/components/ui'
import { Download, Egg } from 'lucide-react'

// One place for shed-wise, day-wise, grade-wise numbers — flock production
// and egg grades, by shed, by day, downloadable as one Excel file. Everything
// here was already sitting in daily_records; this just lays it out the way a
// weekly report from the field does (one row per shed per day) instead of
// scattered across Shed Performance (aggregated, no export), Egg Stock
// (flock-level, no shed) and VHL's own shed page.

const today = () => new Date().toISOString().split('T')[0]
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0] }
const n0 = (v: any) => Number(v ?? 0)
const numFmt = (v: number) => v === 0 ? '—' : v.toLocaleString('en-IN')

export const ShedDayReportPage: React.FC = () => {
  const [fromDate, setFromDate] = useState(daysAgo(7))
  const [toDate, setToDate] = useState(today())
  const [filterFarm, setFilterFarm] = useState('')
  const [filterFlock, setFilterFlock] = useState('')

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').order('name'); return data ?? [] }
  })
  const { data: flocks } = useQuery({
    queryKey: ['flocks_all_shed_report'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no').order('flock_no'); return data ?? [] }
  })

  const { data: records, isLoading } = useQuery({
    queryKey: ['shed_day_report', fromDate, toDate, filterFarm, filterFlock],
    queryFn: async () => {
      // PostgREST caps a single response at 1000 rows — page through, or a
      // wide range/multi-shed flock silently drops rows past the cap.
      const all: any[] = []
      let from = 0
      const PAGE = 1000
      while (true) {
        let q = supabase
          .from('daily_records')
          .select('id,record_date,farm_id,shed_id,flock_id,opening_female,opening_male,closing_female,closing_male,' +
                  'mortality_female,mortality_male,feed_female_kg,feed_male_kg,total_eggs,he_eggs,' +
                  'he_grade_a,he_grade_b,he_grade_c,je_eggs,te_eggs,be_eggs,le_eggs,wastage_eggs,' +
                  'farms(name,code),sheds(shed_no,shed_name),flocks(flock_no)')
          .gte('record_date', fromDate).lte('record_date', toDate)
          .order('record_date').order('id')
          .range(from, from + PAGE - 1)
        if (filterFarm) q = q.eq('farm_id', filterFarm)
        if (filterFlock) q = q.eq('flock_id', filterFlock)
        const { data, error } = await q
        if (error) throw error
        all.push(...(data ?? []))
        if (!data || data.length < PAGE) break
        from += PAGE
      }
      return all
    }
  })

  const rows = (records ?? []).map((r: any) => {
    const birds = n0(r.opening_female) + n0(r.opening_male)
    const hdPct = birds > 0 ? (n0(r.total_eggs) / birds) * 100 : null
    const hePct = n0(r.total_eggs) > 0 ? (n0(r.he_eggs) / n0(r.total_eggs)) * 100 : null
    return {
      date: r.record_date,
      farm: r.farms?.code ?? '—',
      shed: r.sheds ? `${r.sheds.shed_no}${r.sheds.shed_name ? ' — ' + r.sheds.shed_name : ''}` : '—',
      flock: r.flocks?.flock_no ?? '—',
      openF: n0(r.opening_female), openM: n0(r.opening_male),
      closeF: n0(r.closing_female), closeM: n0(r.closing_male),
      mortF: n0(r.mortality_female), mortM: n0(r.mortality_male),
      feedF: n0(r.feed_female_kg), feedM: n0(r.feed_male_kg),
      eggs: n0(r.total_eggs), he: n0(r.he_eggs), hdPct, hePct,
      grA: n0(r.he_grade_a), grB: n0(r.he_grade_b), grC: n0(r.he_grade_c),
      je: n0(r.je_eggs), te: n0(r.te_eggs), be: n0(r.be_eggs), le: n0(r.le_eggs),
      waste: n0(r.wastage_eggs),
    }
  })

  const farmOptions = (farms ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` }))
  const flockOptions = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))

  const exportExcel = () => {
    const headers = ['Date', 'Farm', 'Shed', 'Flock', 'Opening F', 'Opening M', 'Closing F', 'Closing M',
      'Mortality F', 'Mortality M', 'Feed F (kg)', 'Feed M (kg)', 'Total Eggs', 'HE Eggs', 'HD%', 'HE%',
      'Grade A', 'Grade B', 'Grade C', 'JE', 'TE', 'BE', 'LE', 'Wastage']
    const data = rows.map(r => [
      fmtDate(r.date), r.farm, r.shed, r.flock ? `F-${r.flock}` : '—',
      r.openF, r.openM, r.closeF, r.closeM, r.mortF, r.mortM,
      r.feedF.toFixed(1), r.feedM.toFixed(1), r.eggs, r.he,
      r.hdPct != null ? r.hdPct.toFixed(1) : '', r.hePct != null ? r.hePct.toFixed(1) : '',
      r.grA, r.grB, r.grC, r.je, r.te, r.be, r.le, r.waste,
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Shed Day Report')
    XLSX.writeFile(wb, `shed_day_report_${fromDate}_to_${toDate}.xlsx`)
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Shed & Day Report"
        subtitle="Flock production and egg grades, one row per shed per day — the one place for shed-wise, day-wise and grade-wise figures."
        action={rows.length > 0
          ? <Button variant="ghost" size="sm" icon={<Download size={15} />} onClick={exportExcel}>Export</Button>
          : undefined} />

      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <DateInput label="From Date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <DateInput label="To Date" value={toDate} onChange={e => setToDate(e.target.value)} />
          <SearchableSelect label="Farm" placeholder="All farms" className="w-56"
            options={farmOptions} value={filterFarm} onChange={v => setFilterFarm(v)} />
          <SearchableSelect label="Flock" placeholder="All flocks" className="w-56"
            options={flockOptions} value={filterFlock} onChange={v => setFilterFlock(v)} />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(daysAgo(7)); setToDate(today()) }}>7d</Button>
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(daysAgo(30)); setToDate(today()) }}>30d</Button>
          </div>
        </div>
      </Card>

      {isLoading ? <Spinner /> : rows.length === 0 ? (
        <Card><EmptyState icon={<Egg size={28} />} title="No records in this range"
          subtitle="Widen the date range or clear the farm/flock filter." /></Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th><Th>Farm</Th><Th>Shed</Th><Th>Flock</Th>
                  <Th right>Open F</Th><Th right>Open M</Th><Th right>Close F</Th><Th right>Close M</Th>
                  <Th right>Mort F</Th><Th right>Mort M</Th>
                  <Th right>Feed F kg</Th><Th right>Feed M kg</Th>
                  <Th right>Eggs</Th><Th right>HE</Th><Th right>HD%</Th><Th right>HE%</Th>
                  <Th right>Gr A</Th><Th right>Gr B</Th><Th right>Gr C</Th>
                  <Th right>JE</Th><Th right>TE</Th><Th right>BE</Th><Th right>LE</Th><Th right>Wastage</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <Td className="text-xs">{fmtDate(r.date)}</Td>
                    <Td className="text-xs">{r.farm}</Td>
                    <Td className="text-xs font-mono text-purple-700">{r.shed}</Td>
                    <Td className="text-xs font-medium text-brand-700">{r.flock !== '—' ? `F-${r.flock}` : '—'}</Td>
                    <Td right className="text-xs">{numFmt(r.openF)}</Td>
                    <Td right className="text-xs">{numFmt(r.openM)}</Td>
                    <Td right className="text-xs">{numFmt(r.closeF)}</Td>
                    <Td right className="text-xs">{numFmt(r.closeM)}</Td>
                    <Td right className={`text-xs ${r.mortF > 0 ? 'text-red-600' : 'text-gray-400'}`}>{numFmt(r.mortF)}</Td>
                    <Td right className={`text-xs ${r.mortM > 0 ? 'text-red-600' : 'text-gray-400'}`}>{numFmt(r.mortM)}</Td>
                    <Td right className="text-xs">{r.feedF > 0 ? r.feedF.toFixed(0) : '—'}</Td>
                    <Td right className="text-xs">{r.feedM > 0 ? r.feedM.toFixed(0) : '—'}</Td>
                    <Td right className="text-xs font-semibold">{numFmt(r.eggs)}</Td>
                    <Td right className="text-xs text-green-700">{numFmt(r.he)}</Td>
                    <Td right className="text-xs">{r.hdPct != null ? r.hdPct.toFixed(1) + '%' : '—'}</Td>
                    <Td right className="text-xs">{r.hePct != null ? r.hePct.toFixed(1) + '%' : '—'}</Td>
                    <Td right className="text-xs text-emerald-600">{numFmt(r.grA)}</Td>
                    <Td right className="text-xs text-yellow-600">{numFmt(r.grB)}</Td>
                    <Td right className="text-xs text-orange-600">{numFmt(r.grC)}</Td>
                    <Td right className="text-xs">{numFmt(r.je)}</Td>
                    <Td right className="text-xs">{numFmt(r.te)}</Td>
                    <Td right className="text-xs text-red-400">{numFmt(r.be)}</Td>
                    <Td right className="text-xs text-red-400">{numFmt(r.le)}</Td>
                    <Td right className="text-xs text-red-400">{numFmt(r.waste)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <p className="text-xs text-gray-500 px-3 py-2">
            One row per shed per day — a flock in several sheds has several rows on the same date. Widen the date
            range for more history; a shed-less row (no shed assigned on that entry) shows as "—" under Shed.
          </p>
        </Card>
      )}
    </div>
  )
}
