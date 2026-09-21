import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, Button, Spinner, DateInput, MultiSelect } from '@/components/ui'
import toast from 'react-hot-toast'
import { Copy, CheckCircle, Download } from 'lucide-react'
import { today as todayIST, daysBetween, exportCSV, inr, fetchAllPages, fyOfDate, fyRange } from '@/lib/utils'

const pad2 = (n: number) => Math.abs(n).toString().padStart(2, '0')
const fmtDMY2 = (d: string) => { const [y, m, day] = d.split('-'); return `${day}.${m}.${y.slice(2)}` }
const pct1 = (n: number) => n.toFixed(2) + '%'
const sign = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2)

// Numbered list of only the entries that actually happened that day — no
// blank placeholder lines when there's nothing to report.
function listOrNone(items: string[]): string[] {
  return items.length ? items.map((s, i) => `${i + 1}.${s}`) : ['None']
}

export const DailySummaryPage: React.FC = () => {
  // toISOString() is UTC — before 5:30am IST it opened on yesterday's date
  const today = todayIST()
  const [date, setDate] = useState(today)
  const [siteIds, setSiteIds] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  // Money blocks are OFF unless ticked, deliberately. This summary gets pasted
  // into WhatsApp for site staff; a bank balance and what customers owe are
  // the owner's figures and should never ride along by default.
  const [acctSel, setAcctSel] = useState<string[]>([])
  const prevDate = React.useMemo(() => {
    const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  }, [date])

  // ── ACCOUNTS BLOCKS, ALL AS AT THE SELECTED DATE ────────────────────────
  // Every figure below is rebuilt up to `date`, not read as "now": the summary
  // is routinely run for a past day, and a today's balance printed under
  // yesterday's heading would be a wrong number on a daily report.

  // Kotak balance as at the date: the financial year OF THAT DATE, its opening
  // balance, and only transactions up to and including the date. Same shape as
  // Payment Planning's calculation (which matches Bank Ledger's own closing
  // balance), with the upper date bound this one needs. Summed across every
  // active Kotak account rather than picking the first.
  const { data: bankRows } = useQuery({
    queryKey: ['ds_bank_balance', date],
    enabled: acctSel.includes('bank'),
    queryFn: async () => {
      const { data: accounts, error } = await supabase.from('bank_accounts')
        .select('id,bank_name,account_name,opening_balance')
        .ilike('bank_name', '%kotak%').eq('is_active', true)
      if (error) throw new Error(error.message)
      const fy = fyOfDate(date)
      const { start } = fyRange(fy)
      const out: { name: string; balance: number }[] = []
      for (const acc of (accounts ?? [])) {
        const { data: fyOpen } = await supabase.from('bank_fy_opening')
          .select('opening_balance').eq('bank_account_id', acc.id).eq('fy', fy).maybeSingle()
        const opening = fyOpen?.opening_balance != null ? Number(fyOpen.opening_balance) : (acc.opening_balance ?? 0)
        const txns = await fetchAllPages<any>((from, to) => supabase.from('bank_transactions')
          .select('txn_type,amount').eq('bank_account_id', acc.id)
          .gte('txn_date', start).lte('txn_date', date)
          .order('id').range(from, to), 'Daily summary bank balance', m => toast.error(m))
        const credits = txns.filter(t => t.txn_type === 'Credit').reduce((x, t) => x + (t.amount ?? 0), 0)
        const debits  = txns.filter(t => t.txn_type === 'Debit').reduce((x, t) => x + (t.amount ?? 0), 0)
        out.push({ name: acc.account_name || acc.bank_name, balance: opening + credits - debits })
      }
      return out
    },
  })

  // Imprest balances as at the date. Same rule v_cash_account_balance uses -
  // opening balance plus receipts less payments, no lower bound - with the
  // date ceiling added. The view itself cannot do this because it sums the
  // whole cash book with no date filter at all.
  const { data: imprestRows } = useQuery({
    queryKey: ['ds_imprest_balance', date],
    enabled: acctSel.includes('imprest'),
    queryFn: async () => {
      const { data: accts, error } = await supabase.from('cash_accounts')
        .select('id,name,opening_balance,sort_order').eq('is_active', true).order('sort_order')
      if (error) throw new Error(error.message)
      const rows = await fetchAllPages<any>((from, to) => supabase.from('cash_book')
        .select('cash_account_id,amount_in,amount_out')
        .not('cash_account_id', 'is', null).lte('txn_date', date)
        .order('id').range(from, to), 'Daily summary imprest', m => toast.error(m))
      const by: Record<string, { i: number; o: number }> = {}
      for (const r of rows) {
        const g = (by[r.cash_account_id] ||= { i: 0, o: 0 })
        g.i += r.amount_in ?? 0; g.o += r.amount_out ?? 0
      }
      const assigned = rows.length
      return {
        assigned,
        accounts: (accts ?? []).map((a: any) => ({
          name: a.name,
          balance: (a.opening_balance ?? 0) + (by[a.id]?.i ?? 0) - (by[a.id]?.o ?? 0),
        })),
      }
    },
  })

  // What was still owed to the farm ON that date: sales raised on or before it,
  // less only the money that had actually come in by then. A receipt dated
  // after the date does not count, which is what makes this as-at-date rather
  // than as-of-now. NHE carries no TDS - the voucher has no such field - so
  // only HE deducts it.
  const { data: recvRows } = useQuery({
    queryKey: ['ds_receivables', date],
    enabled: acctSel.includes('recv'),
    queryFn: async () => {
      const [nhe, he] = await Promise.all([
        fetchAllPages<any>((from, to) => supabase.from('nhe_sales')
          .select('id,amount,amount_received,received_date')
          .lte('sale_date', date)
          .or('is_employee_sale.is.null,is_employee_sale.eq.false')
          .order('id').range(from, to), 'Daily summary NHE receivable', m => toast.error(m)),
        fetchAllPages<any>((from, to) => supabase.from('he_dispatch')
          .select('id,amount,tds_amount,amount_received,received_date')
          .lte('dispatch_date', date)
          .order('id').range(from, to), 'Daily summary HE receivable', m => toast.error(m)),
      ])
      const owed = (r: any, tds = 0) => {
        const paidByThen = r.received_date && r.received_date <= date ? (r.amount_received ?? 0) : 0
        return Math.max(0, (r.amount ?? 0) - tds - paidByThen)
      }
      const nheOwed = nhe.map(r => owed(r)).filter(v => v > 0)
      const heOwed  = he.map(r => owed(r, r.tds_amount ?? 0)).filter(v => v > 0)
      return {
        nheCount: nheOwed.length, nheAmt: nheOwed.reduce((a, b) => a + b, 0),
        heCount: heOwed.length,   heAmt: heOwed.reduce((a, b) => a + b, 0),
      }
    },
  })

  const { data: farms } = useQuery({
    queryKey: ['farms_daily_summary'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').eq('is_active', true).order('name'); return data ?? [] }
  })

  const { data: flocks, isLoading } = useQuery({
    queryKey: ['active_flocks_summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flocks')
        .select('id, flock_no, breed, status, placement_date, laying_season, is_vhl_contract, rearing_farm_id, laying_farm_id, rearing_farm:farms!rearing_farm_id(name, code), laying_farm:farms!laying_farm_id(name, code)')
        .in('status', ['rearing', 'laying'])
        .order('flock_no')
      if (error) { toast.error(error.message); return [] }
      return (data ?? []).map((f: any) => ({
        ...f,
        farm_id: f.status === 'rearing' ? f.rearing_farm_id : f.laying_farm_id,
        farms: f.status === 'rearing' ? f.rearing_farm : f.laying_farm,
      }))
    }
  })

  const flockIds = flocks?.map((f: any) => f.id) ?? []
  // A VHL flock's daily figures live in vhl_daily_entry, NOT daily_records -
  // measured: Flock 24 has 0 daily_records rows and 4 vhl_daily_entry rows.
  // Reading only daily_records printed a whole block of zeros for it, which
  // reads like a farm that did nothing. Each flock is asked of its own table.
  const vhlFlockIds = (flocks ?? []).filter((f: any) => f.is_vhl_contract).map((f: any) => f.id)
  const normalFlockIds = (flocks ?? []).filter((f: any) => !f.is_vhl_contract).map((f: any) => f.id)

  // Per-shed rows for the selected date AND the previous date (for the
  // shed-wise HD% +/- variance line), plus feed/eggs/mortality/birds.
  const { data: drRecords } = useQuery({
    queryKey: ['daily_summary_records', date, prevDate, normalFlockIds.join(',')],
    queryFn: async () => {
      if (!normalFlockIds.length) return []
      const { data, error } = await supabase
        .from('daily_records')
        .select('flock_id, farm_id, shed_id, record_date, he_eggs, je_eggs, te_eggs, be_eggs, le_eggs, total_eggs, mortality_female, mortality_male, transfer_female, transfer_male, cull_female, cull_male, feed_female_kg, feed_male_kg, opening_female, opening_male, closing_female, closing_male, sheds(shed_no, farm_id)')
        .in('flock_id', normalFlockIds)
        .in('record_date', [date, prevDate])
      if (error) { toast.error(error.message); return [] }
      return data ?? []
    },
    enabled: normalFlockIds.length > 0
  })

  // The VHL side of the same question.
  const { data: vhlRecordsRaw } = useQuery({
    queryKey: ['daily_summary_vhl_records', date, prevDate, vhlFlockIds.join(',')],
    queryFn: async () => {
      if (!vhlFlockIds.length) return []
      const { data, error } = await supabase
        .from('vhl_daily_entry')
        .select('flock_id, shed_id, record_date, he_eggs, je_eggs, te_eggs, be_eggs, le_eggs, total_eggs, mortality_female, mortality_male, received_female, received_male, transfer_female, transfer_male, cull_female, cull_male, feed_female_kg, feed_male_kg, opening_female, opening_male, closing_female, closing_male, sheds(shed_no, farm_id)')
        .in('flock_id', vhlFlockIds)
        .in('record_date', [date, prevDate])
      if (error) { toast.error(error.message); return [] }
      return data ?? []
    },
    enabled: vhlFlockIds.length > 0
  })

  // Reshape VHL rows into exactly the shape daily_records rows have, so every
  // calculation below stays one code path rather than two.
  //
  // The BIRDS line reads Op | Mort | Recv | C/s | Close, and on the regular
  // side "Recv" comes from transfer_female (transfer IN) while VHL has a
  // dedicated received_female and uses transfer_female for movement OUT. So:
  //   Recv -> received_*            (birds in)
  //   C/s  -> cull_* + transfer_*   (birds out - VHL's own trcull column is
  //                                  exactly transfer + cull)
  // which keeps Close = Op + Recv - Mort - C/s true, the same identity VHL
  // itself computes closing with.
  const vhlRecords = React.useMemo(() => {
    const rows = (vhlRecordsRaw ?? []) as any[]
    // A flock can hold BOTH per-shed rows and a flock-level grade-only row
    // (shed_id null) for the same date. Counting both would double every egg,
    // so shed rows win and the flock-level row is used only when a date has
    // no shed rows at all.
    const shedDates = new Set(rows.filter(r => r.shed_id).map(r => `${r.flock_id}|${r.record_date}`))
    return rows
      .filter(r => r.shed_id || !shedDates.has(`${r.flock_id}|${r.record_date}`))
      .map(r => ({
        ...r,
        transfer_female: r.received_female ?? 0,
        transfer_male: r.received_male ?? 0,
        cull_female: (r.cull_female ?? 0) + (r.transfer_female ?? 0),
        cull_male: (r.cull_male ?? 0) + (r.transfer_male ?? 0),
      }))
  }, [vhlRecordsRaw])

  const records = React.useMemo(
    () => [...((drRecords ?? []) as any[]), ...vhlRecords],
    [drRecords, vhlRecords])

  // Medicine/Vaccine given that day — sanitizers split out into their own
  // "Water sanitation" section; everything else (medicine/vaccine/
  // supplement/etc.) goes under "MEDICINE & VACCINE".
  const { data: medUsageRaw } = useQuery({
    queryKey: ['daily_summary_medicine', date, normalFlockIds.join(',')],
    queryFn: async () => {
      if (!normalFlockIds.length) return []
      const { data } = await supabase.from('medicine_usage')
        .select('flock_id, quantity, unit, medicines_master(name,type)')
        .in('flock_id', normalFlockIds).eq('usage_date', date)
      return data ?? []
    },
    enabled: normalFlockIds.length > 0
  })

  // VHL medicine is its own table too - measured: Flock 24 has 0 rows in
  // medicine_usage and 3 in vhl_medicine_usage, which is why the report said
  // "MEDICINE & VACCINE: None" for a day that had three.
  const { data: vhlMedUsageRaw } = useQuery({
    queryKey: ['daily_summary_vhl_medicine', date, vhlFlockIds.join(',')],
    queryFn: async () => {
      if (!vhlFlockIds.length) return []
      const { data } = await supabase.from('vhl_medicine_usage')
        .select('flock_id, quantity, unit, vhl_medicines(name)')
        .in('flock_id', vhlFlockIds).eq('usage_date', date)
      return data ?? []
    },
    enabled: vhlFlockIds.length > 0
  })

  // vhl_medicines has no type column, so VHL entries go under MEDICINE &
  // VACCINE rather than being invented into a category that does not exist.
  const medUsage = React.useMemo(() => [
    ...((medUsageRaw ?? []) as any[]),
    ...((vhlMedUsageRaw ?? []) as any[]).map(m => ({
      flock_id: m.flock_id, quantity: m.quantity, unit: m.unit,
      medicines_master: { name: m.vhl_medicines?.name ?? '—', type: 'medicine' },
    })),
  ], [medUsageRaw, vhlMedUsageRaw])

  // Spray-route vaccinations that day — best-effort source (no separate
  // "spray log" exists in the app; vaccination_records.route='spray' is
  // the closest real signal). Flag to the user if this isn't quite right.
  const { data: sprayRecords } = useQuery({
    queryKey: ['daily_summary_spray', date, flockIds.join(',')],
    queryFn: async () => {
      if (!flockIds.length) return []
      const { data } = await supabase.from('vaccination_records')
        .select('flock_id, vaccine_name, quantity, unit')
        .in('flock_id', flockIds).eq('vaccine_date', date).eq('route', 'spray')
      return data ?? []
    },
    enabled: flockIds.length > 0
  })

  // Feed produced that day, by site. feed_transfers is deliberately NOT read:
  // it holds one row in the whole table, from June, so a Despatch section
  // would print "None" every day. feed_production_ingredients is not read
  // either - 4,085 rows across 154 batches is about 27 ingredients each, and
  // a day with two batches would add ~54 lines to a message meant to be read
  // on a phone.
  const { data: feedProduction } = useQuery({
    queryKey: ['daily_summary_feed_production', date],
    queryFn: async () => {
      const { data, error } = await supabase.from('feed_production_log')
        .select('farm_id, quantity_kg, production_date, feed_formulas(formula_name, formula_code)')
        .eq('production_date', date)
      if (error) { toast.error(error.message); return [] }
      return data ?? []
    }
  })

  const feedProductionBySite = React.useMemo(() => {
    const m: Record<string, { name: string; kg: number }[]> = {}
    for (const r of ((feedProduction ?? []) as any[])) {
      if (!r.farm_id) continue
      const name = r.feed_formulas?.formula_name || r.feed_formulas?.formula_code || 'Unnamed formula'
      const list = (m[r.farm_id] ??= [])
      // Two batches of the same formula on one day read better as one line.
      const found = list.find(x => x.name === name)
      if (found) found.kg += Number(r.quantity_kg) || 0
      else list.push({ name, kg: Number(r.quantity_kg) || 0 })
    }
    return m
  }, [feedProduction])

  const productionLines = (siteId: string): string[] => {
    const rows = feedProductionBySite[siteId] ?? []
    if (!rows.length) return []
    const total = rows.reduce((t, r) => t + r.kg, 0)
    return [
      'PRODUCTION',
      ...rows.map((r, i) => `${i + 1}.${r.name} = ${Math.round(r.kg).toLocaleString('en-IN')} kg`),
      `Total produced: ${Math.round(total).toLocaleString('en-IN')} kg`,
    ]
  }

  const { data: stdCurves } = useQuery({
    queryKey: ['std_production_curve_all'],
    queryFn: async () => { const { data } = await supabase.from('std_production_curve').select('season,week_of_age,hen_week_pct,he_pct'); return data ?? [] }
  })

  // Manpower — by SITE (farm), not by flock, from Employees (designation +
  // site) and that day's Attendance marks (P = full day, H = half day). A
  // site with no active flock still gets its own manpower-only block.
  const { data: employees } = useQuery({
    queryKey: ['employees_for_manpower'],
    queryFn: async () => { const { data } = await supabase.from('employees').select('id,designation,farm_id,gender').eq('is_active', true); return data ?? [] }
  })
  const { data: attendance } = useQuery({
    queryKey: ['attendance_for_manpower', date],
    queryFn: async () => { const { data } = await supabase.from('attendance_daily').select('employee_id,farm_id,status').eq('attendance_date', date); return data ?? [] }
  })
  // Real designation list + display order comes from config_options, not a
  // guessed set of buckets — whatever designations actually exist in the
  // app show up here, in the order the app's own dropdown uses.
  const { data: designationOptions } = useQuery({
    queryKey: ['designation_options_for_manpower'],
    queryFn: async () => { const { data } = await supabase.from('config_options').select('value,sort_order').eq('grp', 'designation').eq('is_active', true).order('sort_order'); return data ?? [] }
  })

  const designationOrder = React.useMemo(() => {
    const m = new Map<string, number>()
    ;(designationOptions ?? []).forEach((d: any, i: number) => m.set(d.value, d.sort_order ?? i))
    return m
  }, [designationOptions])

  const manpowerBySite = React.useMemo(() => {
    const attByEmp = new Map((attendance ?? []).map((a: any) => [a.employee_id, a.status]))
    const bySite: Record<string, Record<string, { p: number; h: number }>> = {}
    for (const e of (employees ?? [])) {
      const siteId = e.farm_id ?? '__none__'
      // Helper is the one designation split by gender (Male/Female Helper) —
      // every other designation is left alone, as requested.
      const baseDesignation = e.designation || 'Unspecified'
      const designation = baseDesignation.toLowerCase() === 'helper'
        ? `Helper (${e.gender || 'Unspecified'})`
        : baseDesignation
      const st = attByEmp.get(e.id)
      const isP = st === 'P' || st === 'OT'
      const isH = st === 'H'
      const site = (bySite[siteId] ??= {})
      const d = (site[designation] ??= { p: 0, h: 0 })
      if (isP) d.p++
      if (isH) d.h++
    }
    return bySite
  }, [employees, attendance])

  const orderFor = (designation: string) => designationOrder.get(designation.replace(/ \((Male|Female|Unspecified)\)$/, '')) ?? 999

  const manpowerLines = (siteId: string) => {
    const site = manpowerBySite[siteId] ?? {}
    const designations = Object.keys(site).sort((a, b) => orderFor(a) - orderFor(b) || a.localeCompare(b))
    // No placeholder when a site has nobody mapped - an empty section is
    // quieter than a line of apology in a message that goes out daily.
    if (!designations.length) return []
    return designations.map(d => `${d} — P:${site[d].p} H:${site[d].h}`)
  }

  // A flock can have several daily_records rows for one date -- one per shed --
  // and those sheds can be at DIFFERENT SITES. Flock 22 sits at Kethireddypally
  // and Agraharam Potlapally at once, and three of the four flocks with records
  // span two sites, so this is the norm rather than an oddity.
  //
  // Grouping by flock alone, then labelling the block with the flock's single
  // laying_farm_id, is what made Flock 22 appear only under Kethireddypally
  // while Agraharam silently omitted birds that are physically there. Rows are
  // keyed by flock AND site so each site's page shows its own sheds.
  const keyOf = (flockId: string, siteId: string | null) => `${flockId}|${siteId ?? 'none'}`

  // A flock's own site, for rows that cannot name one themselves.
  const flockFarmById = React.useMemo(() => {
    const m: Record<string, string | null> = {}
    for (const f of ((flocks ?? []) as any[])) m[f.id] = f.farm_id ?? null
    return m
  }, [flocks])

  // A row with NO SHED has no shed to take a site from. It used to resolve to
  // null, and null then counted as a site of its own - so a day holding both
  // shed rows and the flock-level HE grade row drew a SECOND block. That block
  // then looked its rows up under the flock's own farm, which is the same farm
  // as the first block, so it printed the SAME figures again: Flock 20 appeared
  // twice on 17/09, identical, not empty. Measured: 630 shed-less rows across
  // flocks 19, 20 and 22, from 08/08/2025 to 17/09/2026.
  //
  // vhl_daily_entry has no farm_id column, so a VHL row falls through to its
  // flock's site - which is why the flock map exists rather than just reading
  // r.farm_id.
  const siteOfRow = (r: any) =>
    (r.sheds as any)?.farm_id ?? r.farm_id ?? flockFarmById[r.flock_id] ?? null

  const recordsByFlockSite = React.useMemo(() => {
    const m: Record<string, any[]> = {}
    for (const r of (records ?? [])) {
      if (r.record_date !== date) continue
      ;(m[keyOf(r.flock_id, siteOfRow(r))] ??= []).push(r)
    }
    return m
  }, [records, date])
  const prevHdByShed = React.useMemo(() => {
    const m: Record<string, number | null> = {}
    for (const r of (records ?? [])) {
      if (r.record_date !== prevDate) continue
      const openF = r.opening_female ?? 0
      m[r.shed_id] = openF > 0 ? ((r.total_eggs ?? 0) / openF) * 100 : null
    }
    return m
  }, [records, prevDate])
  // Per flock AND site too: comparing a site's HD today against the flock's
  // whole-company HD yesterday would put a variance on the line that neither
  // site actually moved.
  const prevOverallHdByFlockSite = React.useMemo(() => {
    const sums: Record<string, { eggs: number; openF: number }> = {}
    for (const r of (records ?? [])) {
      if (r.record_date !== prevDate) continue
      const s = sums[keyOf(r.flock_id, siteOfRow(r))] ??= { eggs: 0, openF: 0 }
      s.eggs += r.total_eggs ?? 0; s.openF += r.opening_female ?? 0
    }
    const out: Record<string, number | null> = {}
    for (const [k, s] of Object.entries(sums)) out[k] = s.openF > 0 ? (s.eggs / s.openF) * 100 : null
    return out
  }, [records, prevDate])

  const medByFlock = React.useMemo(() => {
    const m: Record<string, any[]> = {}
    for (const r of (medUsage ?? [])) (m[r.flock_id] ??= []).push(r)
    return m
  }, [medUsage])
  const sprayByFlock = React.useMemo(() => {
    const m: Record<string, any[]> = {}
    for (const r of (sprayRecords ?? [])) (m[r.flock_id] ??= []).push(r)
    return m
  }, [sprayRecords])

  const stdFor = (season: string | null, weekOfAge: number) => (stdCurves ?? []).find((s: any) => s.season === season && s.week_of_age === weekOfAge) ?? null

  const farmNameById = React.useMemo(() => {
    const m: Record<string, string> = {}
    for (const s2 of ((farms ?? []) as any[])) m[s2.id] = s2.name
    return m
  }, [farms])

  // One block = one flock AT ONE SITE. siteId null means the flock has no
  // records for the date, in which case it still gets a single block under the
  // site the flocks table names, so a flock never silently disappears.
  const buildFlockBlock = (f: any, siteId: string | null): { lines: string[]; stats: any } => {
    const shedRows = siteId === null
      ? (recordsByFlockSite[keyOf(f.id, f.farm_id)] ?? [])
      : (recordsByFlockSite[keyOf(f.id, siteId)] ?? [])
    const blockSiteId = siteId ?? f.farm_id
    const farmName = (farmNameById[blockSiteId] ?? f.farms?.name ?? 'Unknown Site').toUpperCase()
    const ageDays = daysBetween(f.placement_date, date)
    const ageWk = Math.floor(ageDays / 7), ageRem = ageDays % 7

    const sum = (k: string) => shedRows.reduce((s: number, r: any) => s + (r[k] ?? 0), 0)
    const openF = sum('opening_female'), openM = sum('opening_male')
    const mortF = sum('mortality_female'), mortM = sum('mortality_male')
    const recvF = sum('transfer_female'), recvM = sum('transfer_male')
    const cullF = sum('cull_female'), cullM = sum('cull_male')
    const closeF = sum('closing_female'), closeM = sum('closing_male')
    const feedF = sum('feed_female_kg'), feedM = sum('feed_male_kg')
    const totalEggs = sum('total_eggs'), heEggs = sum('he_eggs')
    const jeEggs = sum('je_eggs'), teEggs = sum('te_eggs'), beEggs = sum('be_eggs'), leEggs = sum('le_eggs')
    const hePct = totalEggs > 0 ? (heEggs / totalEggs) * 100 : 0
    const todayHd = openF > 0 ? (totalEggs / openF) * 100 : 0
    const prevHd = prevOverallHdByFlockSite[keyOf(f.id, blockSiteId)]
    const std = stdFor(f.laying_season, ageWk)

    const lines: string[] = []
    lines.push(farmName)
    lines.push(`          Flock.${f.flock_no}`)
    lines.push(`        Dt.${fmtDMY2(date)}`)
    lines.push(`       Age.${ageWk}.${pad2(ageRem)}wk`)
    lines.push(`BIRDS: Op ${openF}+${openM} | Mort ${pad2(mortF)}+${pad2(mortM)} | Recv ${pad2(recvF)}+${pad2(recvM)} | C/s ${pad2(cullF)}+${pad2(cullM)} | Close ${closeF}+${closeM}`)
    lines.push(`FEED: ${Math.round(feedF)}+${Math.round(feedM)} kg`)
    lines.push(`      PRODUCTION`)
    lines.push(`Sl.   HD      +/-   F+M`)
    for (const r of shedRows.slice().sort((a: any, b: any) => (a.sheds?.shed_no ?? '').localeCompare(b.sheds?.shed_no ?? ''))) {
      const shedOpenF = r.opening_female ?? 0
      const shedHd = shedOpenF > 0 ? ((r.total_eggs ?? 0) / shedOpenF) * 100 : 0
      const prevShedHd = prevHdByShed[r.shed_id]
      const variance = prevShedHd != null ? shedHd - prevShedHd : 0
      const shedMortF = r.mortality_female ?? 0, shedMortM = r.mortality_male ?? 0
      lines.push(`${r.sheds?.shed_no ?? '—'}.${pct1(shedHd)}${sign(variance)}(${shedMortF}+${shedMortM})`)
    }
    lines.push(`He.Std.${std?.he_pct != null ? std.he_pct.toFixed(0) + '%' : '—'}`)
    lines.push(`He.act.${pct1(hePct)}`)
    const pctOf = (n: number) => totalEggs > 0 ? (n / totalEggs * 100).toFixed(2) : '0.00'
    lines.push(`Eggs: HE ${heEggs} | JE ${jeEggs}(${pctOf(jeEggs)}%) | TE ${teEggs}(${pctOf(teEggs)}%) | BE ${beEggs}(${pctOf(beEggs)}%) | LE ${leEggs}(${pctOf(leEggs)}%) | Total ${totalEggs}`)
    lines.push(`Today prd.${pct1(todayHd)} (${sign(prevHd != null ? todayHd - prevHd : 0)})`)
    lines.push(`Production Std.${std?.hen_week_pct != null ? std.hen_week_pct.toFixed(0) + '%' : '—'}`)
    // Group by the real medicines_master.type value instead of assuming a
    // binary "sanitizer or not" split — whatever types are actually in use
    // (medicine, vaccine, sanitizer, supplement, disinfectant, ...) each get
    // their own labeled section, so nothing gets silently mislabeled.
    const medsForFlock = medByFlock[f.id] ?? []
    const typeGroups: Record<string, any[]> = {}
    for (const m of medsForFlock) {
      const type = m.medicines_master?.type || 'other'
      ;(typeGroups[type] ??= []).push(m)
    }
    const sectionLabel = (type: string) =>
      type === 'sanitizer' ? 'Water sanitation'
      : type === 'medicine' || type === 'vaccine' ? 'MEDICINE & VACCINE'
      : type.charAt(0).toUpperCase() + type.slice(1)
    const medVaccineItems = [...(typeGroups['medicine'] ?? []), ...(typeGroups['vaccine'] ?? [])]
    const otherTypes = Object.keys(typeGroups).filter(t => t !== 'medicine' && t !== 'vaccine')

    lines.push(`  ${sectionLabel('medicine')}`)
    lines.push(...listOrNone(medVaccineItems.map((m: any) => `${m.medicines_master?.name ?? '—'}=${m.quantity ?? ''}${m.unit ?? ''}`)))
    for (const type of otherTypes) {
      lines.push(`        ${sectionLabel(type)}`)
      lines.push(...listOrNone(typeGroups[type].map((m: any) => `${m.medicines_master?.name ?? '—'}=${m.quantity ?? ''}${m.unit ?? ''}`)))
    }
    lines.push(`             SPRAY`)
    const sprays = sprayByFlock[f.id] ?? []
    lines.push(...listOrNone(sprays.map((s: any) => `${s.vaccine_name ?? '—'}=${s.quantity ?? ''}${s.unit ?? ''}`)))
    lines.push(...manpowerLines(blockSiteId))
    return { lines, stats: { totalEggs, heEggs, hd: todayHd, mort: mortF + mortM, feed: feedF + feedM,
                             siteId: blockSiteId, siteName: farmNameById[blockSiteId] ?? f.farms?.name ?? '' } }
  }

  const allBlocksAll = React.useMemo(() => {
    if (!flocks) return []
    const out: { flock: any; siteId: string | null; lines: string[]; stats: any }[] = []
    for (const f of (flocks as any[])) {
      // The sites this flock actually had birds at today, from the sheds on its
      // records -- not from its single laying_farm_id.
      const sites = Array.from(new Set(
        (records ?? [])
          .filter((r: any) => r.record_date === date && r.flock_id === f.id)
          .map((r: any) => siteOfRow(r))
      ))
      if (sites.length === 0) {
        // No records today: one block under the site the flocks table names, so
        // the flock still appears rather than vanishing from the summary.
        const { lines, stats } = buildFlockBlock(f, null)
        out.push({ flock: f, siteId: f.farm_id ?? null, lines, stats })
      } else {
        for (const siteId of sites) {
          const { lines, stats } = buildFlockBlock(f, siteId)
          out.push({ flock: f, siteId, lines, stats })
        }
      }
    }
    // Site first, then flock, so a site's pages sit together.
    return out.sort((a, b) =>
      String(a.stats.siteName).localeCompare(String(b.stats.siteName))
      || String(a.flock.flock_no).localeCompare(String(b.flock.flock_no)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flocks, records, recordsByFlockSite, prevHdByShed, prevOverallHdByFlockSite, medByFlock, sprayByFlock, stdCurves, manpowerBySite, farmNameById, date])

  // A site counts as active if a flock actually had birds there today, which is
  // what allBlocksAll now knows; the flocks table's single site does not.
  const activeSiteIds = new Set(allBlocksAll.map(b => b.siteId).filter(Boolean) as string[])
  const flocklessSitesAll = (farms ?? []).filter((s: any) => !activeSiteIds.has(s.id))

  // Site filter — no selection means "All Sites"; otherwise only the
  // ticked sites are shown/copied/exported.
  const allBlocks = siteIds.length ? allBlocksAll.filter(b => b.siteId && siteIds.includes(b.siteId)) : allBlocksAll
  const flocklessSites = siteIds.length ? flocklessSitesAll.filter((s: any) => siteIds.includes(s.id)) : flocklessSitesAll

  const siteOptions = ((farms ?? []) as any[]).map((s: any) => ({ value: s.id, label: s.name }))

  // The ticked money blocks, as the same plain text lines every other block
  // uses, so they copy into WhatsApp identically.
  const ACCOUNT_BLOCK_OPTIONS = [
    { value: 'bank',    label: 'Bank Balance' },
    { value: 'imprest', label: 'Imprest Balances' },
    { value: 'recv',    label: 'Need to Receive' },
  ]

  const accountBlocks = React.useMemo(() => {
    const out: { key: string; title: string; lines: string[] }[] = []
    const head = (t: string) => [t.toUpperCase(), `        Dt.${fmtDMY2(date)}`]

    if (acctSel.includes('bank') && bankRows) {
      const total = bankRows.reduce((a, b) => a + b.balance, 0)
      out.push({ key: 'bank', title: 'Bank Balance', lines: [
        ...head('Bank Balance'),
        ...(bankRows.length
          ? bankRows.map(b => `${b.name} : ${inr(Math.round(b.balance))}`)
          : ['No active Kotak account found']),
        ...(bankRows.length > 1 ? [`TOTAL : ${inr(Math.round(total))}`] : []),
      ]})
    }

    if (acctSel.includes('imprest') && imprestRows) {
      const total = imprestRows.accounts.reduce((a, b) => a + b.balance, 0)
      out.push({ key: 'imprest', title: 'Imprest Balances', lines: [
        ...head('Imprest Balances'),
        ...imprestRows.accounts.map(a => `${a.name} : ${inr(Math.round(a.balance))}`),
        `TOTAL : ${inr(Math.round(total))}`,
        ...(imprestRows.assigned === 0
          ? ['(no cash book entry is assigned to an imprest yet)']
          : []),
      ]})
    }

    if (acctSel.includes('recv') && recvRows) {
      out.push({ key: 'recv', title: 'Need to Receive', lines: [
        ...head('Need to Receive'),
        `NHE Sales   : ${inr(Math.round(recvRows.nheAmt))}  (${recvRows.nheCount} bill)`,
        `HE Dispatch : ${inr(Math.round(recvRows.heAmt))}  (${recvRows.heCount} bill)`,
        `TOTAL       : ${inr(Math.round(recvRows.nheAmt + recvRows.heAmt))}`,
      ]})
    }
    return out
  }, [acctSel, bankRows, imprestRows, recvRows, date])

  const handleExport = () => {
    if (!allBlocks.length) { toast.error('No data to export'); return }
    exportCSV(`daily_summary_${date}.csv`,
      ['Flock', 'Site', 'HE Eggs', 'Total Eggs', 'HD %', 'Mortality', 'Feed (kg)'],
      allBlocks.map(({ flock: f, stats }) => [f.flock_no, stats.siteName ?? '', stats.heEggs, stats.totalEggs, stats.hd.toFixed(1), stats.mort, Math.round(stats.feed)])
    )
  }

  const copyAll = () => {
    const parts = allBlocks.map(b => b.lines.join('\n'))
    for (const site of flocklessSites) {
      const prod = productionLines(site.id)
      parts.push([
        site.name.toUpperCase(),
        `        Dt.${fmtDMY2(date)}`,
        ...(prod.length ? prod : ['(no active flock)']),
        ...manpowerLines(site.id),
      ].join('\n'))
    }
    for (const b of accountBlocks) parts.push(b.lines.join('\n'))
    if (!parts.length) { toast.error('Nothing to copy for this site'); return }
    navigator.clipboard.writeText(parts.join('\n\n================================\n\n')).then(() => {
      setCopied('all')
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(null), 3000)
    })
  }

  if (isLoading) return <div className="flex justify-center p-8"><Spinner size={32} /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Farm Summary</h1>
          <p className="text-sm text-gray-500">Copy and paste into WhatsApp — Feed Std and Egg Weight have no data source yet, shown as "—"</p>
        </div>
        <div className="flex items-center gap-2">
          <MultiSelect options={siteOptions} value={siteIds} onChange={setSiteIds} placeholder="All Sites" className="w-44" />
          <MultiSelect options={ACCOUNT_BLOCK_OPTIONS} value={acctSel} onChange={setAcctSel}
            placeholder="Add money blocks" className="w-48" />
          <DateInput value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export</Button>
          <Button onClick={copyAll} variant={copied === 'all' ? 'secondary' : 'primary'} size="sm">
            {copied === 'all' ? <><CheckCircle size={15} className="mr-1" />Copied!</> : <><Copy size={15} className="mr-1" />Copy</>}
          </Button>
        </div>
      </div>

      {allBlocks.map(({ flock: f, siteId, lines, stats }) => (
        <Card key={`${f.id}|${siteId ?? 'none'}`} padding={false}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900">Flock {f.flock_no} — {stats.siteName || f.farms?.name || '—'}</span>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-gray-50 rounded-lg p-3 overflow-x-auto">{lines.join('\n')}</pre>
          </div>
        </Card>
      ))}

      {flocklessSites.map((site: any) => (
        <Card key={site.id} padding={false}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900">
                {site.name}{productionLines(site.id).length ? '' : ' — no active flock'}
              </span>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-gray-50 rounded-lg p-3 overflow-x-auto">{[
              site.name.toUpperCase(),
              `        Dt.${fmtDMY2(date)}`,
              ...productionLines(site.id),
              ...manpowerLines(site.id),
            ].join('\n')}</pre>
          </div>
        </Card>
      ))}

      {accountBlocks.map(b => (
        <Card key={b.key} padding={false}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900">{b.title}</span>
              <span className="text-[11px] text-gray-400">as on {fmtDMY2(date)}</span>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-gray-50 rounded-lg p-3 overflow-x-auto">{b.lines.join('\n')}</pre>
          </div>
        </Card>
      ))}

      {acctSel.length > 0 && (
        <p className="text-[11px] text-gray-400 px-1">
          Money blocks are rebuilt as at {fmtDMY2(date)} — the bank balance uses that date's financial year
          opening plus transactions up to that day, and Need to Receive counts only money actually received
          by then. They are off unless ticked, because this summary is usually pasted into WhatsApp.
        </p>
      )}

      {allBlocks.length === 0 && flocklessSites.length === 0 && (
        <Card><div className="p-8 text-center text-gray-400">No active flocks or sites found</div></Card>
      )}
    </div>
  )
}
