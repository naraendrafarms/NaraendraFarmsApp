// Was this person employed on a date, or during a month?
//
// Until now three screens each answered that differently from the same two
// columns on employees:
//   Daily Attendance    — is_active = true, nothing else
//   Monthly grid        — is_active = true OR (joined <= end AND not yet left)
//   Bulk Salary         — joined <= end AND not yet left, is_active ignored
// So marking a man Left removed him from attendance while Bulk Salary still
// offered to pay him, and anyone active showed up in months before they
// joined — which is how 25 employees came to have 333 days of attendance
// dated before their own joining date.
//
// employment_spells (migration 1285) holds one row per stint, so a man who
// leaves and rejoins keeps both. Every screen now asks this one question.

import { supabase } from '@/lib/supabase'
import { fetchAllPages } from '@/lib/utils'

export type Spell = {
  id?: string
  employee_id: string
  joined_date: string | null
  left_date: string | null
  reason?: string | null
}

// Only the fields the rule needs — callers pass whatever employee row they
// already have.
export type EmployedFields = {
  joining_date?: string | null
  leaving_date?: string | null
  is_active?: boolean | null
}

export type SpellMap = Record<string, Spell[]>

export function groupSpells(rows: Spell[] | null | undefined): SpellMap {
  const m: SpellMap = {}
  for (const s of rows ?? []) {
    if (!s?.employee_id) continue
    ;(m[s.employee_id] ||= []).push(s)
  }
  for (const id of Object.keys(m)) {
    m[id].sort((a, b) => String(a.joined_date ?? '').localeCompare(String(b.joined_date ?? '')))
  }
  return m
}

// Every screen loads the spells the same way. Paged and ordered by id, because
// a paged read sorted on a non-unique column can repeat or skip rows between
// pages — the repo's code-check guard refuses one without the tie-breaker.
export async function loadSpells(onError?: (m: string) => void): Promise<Spell[]> {
  return fetchAllPages<Spell>(
    (from, to) => supabase.from('employment_spells')
      .select('id,employee_id,joined_date,left_date,reason')
      .order('employee_id').order('id').range(from, to),
    'employment_spells', onError)
}

// Employed at any point in [start, end]? Dates are YYYY-MM-DD, so string
// comparison is date comparison.
export function employedBetween(
  emp: EmployedFields | null | undefined,
  spells: Spell[] | undefined,
  start: string,
  end: string,
): boolean {
  const list = spells ?? []
  if (list.length) {
    // A stint overlaps the window if it began on or before the window ends and
    // had not ended before the window began. An open stint (no left_date) runs
    // to today and beyond; a stint with no joined_date is treated as having
    // always been open, which is what a blank date has always meant here.
    return list.some(s =>
      (!s.joined_date || s.joined_date <= end) &&
      (!s.left_date || s.left_date >= start))
  }
  // No stint recorded. Fall back to the two loose dates on the employee — the
  // exact behaviour before spells existed — so the 230 employees whose dates
  // predate the app keep appearing everywhere they appear today.
  if (!emp) return false
  if (emp.joining_date && emp.joining_date > end) return false
  if (emp.leaving_date && emp.leaving_date < start) return false
  if (emp.is_active === false && !emp.leaving_date) return false
  return true
}

export function employedOn(
  emp: EmployedFields | null | undefined,
  spells: Spell[] | undefined,
  date: string,
): boolean {
  return employedBetween(emp, spells, date, date)
}

// The stint covering a date, if any — used to show which one a day belongs to.
export function spellCovering(spells: Spell[] | undefined, date: string): Spell | null {
  return (spells ?? []).find(s =>
    (!s.joined_date || s.joined_date <= date) &&
    (!s.left_date || s.left_date >= date)) ?? null
}

// The stint still open, i.e. the one a "mark left" would close.
export function openSpell(spells: Spell[] | undefined): Spell | null {
  return (spells ?? []).find(s => !s.left_date) ?? null
}

export function describeSpell(s: Spell): string {
  const from = s.joined_date ? fmt(s.joined_date) : 'unknown'
  return s.left_date ? `${from} to ${fmt(s.left_date)}` : `${from} — still working`
}

function fmt(d: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : d
}
