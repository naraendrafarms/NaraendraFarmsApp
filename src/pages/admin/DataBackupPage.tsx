import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { Card, Button, SectionHeader } from '@/components/ui'
import { Download, HardDrive } from 'lucide-react'
import toast from 'react-hot-toast'

// Every table the app writes real farm/business data into. Deliberately
// excludes internal-only tables (audit_log, config_options, chat_*,
// form_drafts, role_permissions) and anything already named as a backup,
// staging, or one-off diagnostic table.
const BACKUP_TABLES = [
  'farms', 'sheds', 'flock_sheds', 'flock_transfers', 'shed_allocations', 'shed_transfers',
  'flocks', 'daily_records', 'flock_weekly_performance', 'egg_conversions', 'egg_opening_stock',
  'hatch_batches', 'hatchability', 'hatcheries', 'hatchery_advances', 'he_dispatch', 'he_dispatch_lines',
  'he_rate_register', 'he_vendor_rate_diff', 'he_vendor_rate_tier', 'nhe_sales', 'nhe_sale_lines',
  'cull_bird_rate', 'std_production_curve', 'breed_standard', 'shed_lines', 'line_feed',
  'line_mortality', 'line_production', 'vaccination_records', 'vaccination_schedule',
  'medicine_allocations', 'medicine_monthly', 'medicine_purchases', 'medicine_usage', 'medicines_master',
  'feed_types', 'feed_formulas', 'feed_formula_ingredients', 'feed_ingredients', 'feed_production',
  'feed_production_ingredients', 'feed_production_log', 'feed_allocations', 'feed_transfers',
  'feed_stock_adjustments', 'finished_feed_adjustments', 'daily_feed', 'ingredient_stock',
  'items', 'item_aliases', 'general_items', 'stock_ledger', 'stock_item_meta', 'stock_audits',
  'stock_audit_lines', 'stock_statement_rates', 'purchase_intents', 'purchase_intent_lines',
  'purchase_orders', 'grn', 'po_receipts', 'supplier_invoices',
  'employees', 'employee_advances', 'employee_deductions', 'attendance_daily',
  'salary_abstract', 'salary_allocation', 'salary_monthly', 'payslips', 'designation_extra_days',
  'skill_wages', 'manpower_requirement', 'partners',
  'electricity_meters', 'electricity_bills', 'electricity_bill_payments', 'electricity_allocation',
  'generators', 'generator_diesel_purchases', 'generator_maintenance_log', 'generator_usage_log',
  'cash_book', 'cash_book_opening', 'bank_accounts', 'bank_fy_opening', 'bank_transactions',
  'opening_balances', 'parties', 'party_advances', 'vendor_advances', 'vendor_bank_details',
  'pending_payments', 'payment_plan', 'payment_plan_line', 'payment_plan_manual_items',
  'plans', 'plan_lines', 'invoice_series', 'tds_challans', 'statutory_liabilities',
  'ca_financial_statements', 'farm_expenses', 'feedmill_expenses', 'bag_sales', 'categories_master',
  'units_master', 'company_settings', 'generators',
  'vhl_daily_entry', 'vhl_egg_production', 'vhl_egg_rate_history', 'vhl_medicine_usage', 'vhl_medicines',
  'tasks', 'health_check_results',
]

const PAGE_SIZE = 1000

async function fetchAllRows(table: string): Promise<any[]> {
  const rows: any[] = []
  let from = 0
  for (;;) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return rows
}

// Excel sheet names are capped at 31 characters and can't repeat.
function sheetName(table: string, used: Set<string>): string {
  let name = table.slice(0, 31)
  let i = 2
  while (used.has(name)) {
    const suffix = `_${i}`
    name = table.slice(0, 31 - suffix.length) + suffix
    i++
  }
  used.add(name)
  return name
}

export const DataBackupPage: React.FC = () => {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; table: string } | null>(null)

  const runBackup = async () => {
    setRunning(true)
    const wb = XLSX.utils.book_new()
    const usedNames = new Set<string>()
    const failed: string[] = []
    try {
      for (let i = 0; i < BACKUP_TABLES.length; i++) {
        const table = BACKUP_TABLES[i]
        setProgress({ done: i, total: BACKUP_TABLES.length, table })
        try {
          const rows = await fetchAllRows(table)
          const ws = rows.length
            ? XLSX.utils.json_to_sheet(rows)
            : XLSX.utils.aoa_to_sheet([['(no rows)']])
          XLSX.utils.book_append_sheet(wb, ws, sheetName(table, usedNames))
        } catch (e: any) {
          failed.push(table)
        }
      }
      const stamp = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `naraendra_farms_backup_${stamp}.xlsx`)
      if (failed.length) {
        toast.error(`Backup downloaded, but ${failed.length} table(s) could not be read: ${failed.join(', ')}`)
      } else {
        toast.success(`Backup downloaded — ${BACKUP_TABLES.length} tables`)
      }
    } finally {
      setRunning(false)
      setProgress(null)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Data Backup" subtitle="Download every table's current data to your computer as one Excel file" />
      <Card className="space-y-4 max-w-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
            <HardDrive size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Full data backup</p>
            <p className="text-xs text-gray-500 mt-1">
              Pulls every row from {BACKUP_TABLES.length} tables (flocks, daily records, sales, cash book,
              employees, salary, feed, purchases, electricity and more) into one .xlsx file, one sheet per
              table. This is a read-only export — nothing in Supabase is changed. Since it downloads straight
              to your device, it does not use any of the 1GB Supabase storage plan.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              This file is a snapshot for safekeeping and manual review — restoring from it means re-entering
              the data or asking a developer to re-import it; it does not restore itself automatically.
            </p>
          </div>
        </div>
        <Button icon={<Download size={16} />} onClick={runBackup} loading={running}>
          {running && progress ? `Exporting ${progress.table}… (${progress.done}/${progress.total})` : 'Download Full Backup'}
        </Button>
      </Card>
    </div>
  )
}

export default DataBackupPage
