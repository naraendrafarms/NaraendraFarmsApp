import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuth, can } from '@/lib/auth'
import type { Role } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import { ChatPage } from '@/pages/chat/ChatPage'
import { GeneratorsPage } from '@/pages/generators/GeneratorPages'
import { HERateRegisterPage } from '@/pages/flocks/HERateRegisterPage'
import { BagsPage } from '@/pages/inventory/BagsPage'
import { Login }  from '@/pages/auth/Login'
import { Dashboard } from '@/pages/dashboard/Dashboard'
import { FlockList } from '@/pages/flocks/FlockList'
import { FlockDetail } from '@/pages/flocks/FlockDetail'
import { DailyEntry } from '@/pages/flocks/DailyEntry'
import { HEDispatch, NHESales, MedicineEntry, MedicinePurchases } from '@/pages/flocks/FlockSalesPages'
import { StatutoryFilingPage } from '@/pages/employees/StatutoryFilingPage'
import { BulkDailyEntry } from '@/pages/flocks/BulkDailyEntry'
import { EggConversions } from '@/pages/flocks/EggConversions'
import { HatchBatches } from '@/pages/flocks/HatchBatches'
import { FeedProduction, FeedTransfer } from '@/pages/feed/FeedPages'
import { InventoryPage } from '@/pages/inventory/InventoryPages'
import { FeedMillPage } from '@/pages/feed/FeedMillPages'
import { ElectricityEntry } from '@/pages/electricity/ElectricityEntry'
import { EmployeeList, SalaryAbstractPage, SalaryEntryPage, BonusPage, ESIPFReportPage, PayrollSummaryPage, AttendanceRegisterPage, PayslipGeneratorPage, BulkSalaryPage, SiteDesignationCountPage } from '@/pages/employees/EmployeePages'
import { SalaryRegisterPage } from '@/pages/employees/SalaryRegisterPage'
import { SalaryCMSExportPage } from '@/pages/employees/SalaryCMSExportPage'
import { SalaryHistoryPage } from '@/pages/employees/SalaryHistoryPage'
import { PartnerRemunerationPage } from '@/pages/employees/PartnerRemunerationPage'
import { DailyAttendancePage, MonthAttendancePage, EmployeeAdvancesPage, MonthlyAttendanceGridPage } from '@/pages/employees/AttendancePages'
import {
  FarmsMaster, IngredientsMaster, PartiesMaster, MedicinesMaster,
  ShedsMaster, HatcheriesMaster, MetersMaster, FeedTypesMaster, VaccinationSchedulePage
} from '@/pages/masters/MastersPages'
import { ImportDaily, ImportElectricity, ImportSalary, ImportHE, ImportGRN } from '@/pages/import/ImportPages'
import { HatchabilityPage } from '@/pages/hatchability/HatchabilityPage'
import { SetupPage } from '@/pages/setup/SetupPage'
import { ProductionReport, PLReport, SalaryReport, FeedReport, ExportPage } from '@/pages/reports/ReportsPages'
import { DailySummaryPage } from '@/pages/reports/DailySummary'
import { CostOverviewPage, ElectricityCostPage, SalaryCostPage } from '@/pages/reports/CostAnalysis'
import { PurchaseOrdersPage } from '@/pages/reports/POPages'
import { SiteInvoicePage } from '@/pages/reports/SiteInvoicePage'
import { BirdSalesReport } from '@/pages/reports/BirdSalesReport'
import { VHLFlocksPage, VHLDailyEntryPage, VHLBulkDailyEntryPage, VHLMedicineMasterPage, VHLMedicineUsagePage, VHLEggProductionPage, VHLDashboardPage, VHLShedPerformancePage, VHLEggStockRegisterPage } from '@/pages/vhl/VHLPages'
import { PendingPaymentsPage } from '@/pages/accounts/PendingPaymentsPage'
import { PurchaseEntry } from '@/pages/purchases/PurchaseEntry'
import { RateCompare } from '@/pages/purchases/RateCompare'
import { VendorStatement } from '@/pages/purchases/VendorStatement'
import { UserManagement } from '@/pages/admin/UserManagement'
import { AdminCentre } from '@/pages/admin/AdminCentre'
import { AuditLogPage } from '@/pages/admin/AuditLog'
import { AccessControlPage } from '@/pages/admin/AccessControlPage'
import { FlockDashboard, FlockDetail as NewFlockDetail } from '@/pages/flock/FlockPages'
import { FlockComparison } from '@/pages/flock/FlockComparison'
import { ShedPerformancePage } from '@/pages/flock/ShedPerformance'
import { FarmExpensesPage } from '@/pages/expenses/FarmExpenses'
import { EggOpeningStockPage } from '@/pages/flocks/EggOpeningStock'
import { VaccinationRecordsPage } from '@/pages/flocks/VaccinationRecords'
import { PartyOutstanding as PartyOutstandingPage } from '@/pages/reports/PartyOutstanding'
import { CompanyPL as CompanyPLPage } from '@/pages/reports/CompanyPL'
import { GSTReportPage } from '@/pages/reports/GSTReport'
import { EggStockPage } from '@/pages/reports/EggStock'
import { TDSReceivable } from '@/pages/reports/TDSReceivable'
import { TDSPayable } from '@/pages/reports/TDSPayable'
import { StockStatement } from '@/pages/reports/StockStatement'
import { CashBookPage } from '@/pages/accounts/CashBook'
import { FlockPLSummary } from '@/pages/reports/FlockPLSummary'
import { BankLedgerPage } from '@/pages/accounts/BankLedger'
import { InvoiceRegister } from '@/pages/accounts/InvoiceRegister'
import { SalesInvoiceRegister } from '@/pages/accounts/SalesInvoiceRegister'
import { InvoiceSeriesPage } from '@/pages/accounts/InvoiceSeries'
import { PaymentPlanningPage } from '@/pages/accounts/PaymentPlanning'
import { CMSUploadPage } from '@/pages/accounts/CMSUpload'
import { BuyerAdvancesPage } from '@/pages/accounts/BuyerAdvancesPage'
import { VendorAdvancesPage } from '@/pages/accounts/VendorAdvancesPage'
import { PartyLedgerPage } from '@/pages/accounts/PartyLedgerPage'
import { OpeningBalancesPage } from '@/pages/accounts/OpeningBalancesPage'
import { ExcelMapperPage } from '@/pages/import/ExcelMapper'
import { HelpGuidePage } from '@/pages/help/HelpGuide'
import { ItemsMasterPage } from '@/pages/purchase/ItemsMaster'
import { GRNPage } from '@/pages/purchase/GRNPage'
import { PurchaseIntentPage } from '@/pages/purchase/PurchaseIntentPage'
import { TasksPage } from '@/pages/tasks/TasksPage'
import { PlanningPage } from '@/pages/planning/PlanningPages'
import { Spinner } from '@/components/ui'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime:    30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      throwOnError: false,
    }
  }
})

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size={32} />
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

// Guards a route to specific roles — shows 403 page if not allowed
const RequireRole: React.FC<{ check: (r?: Role) => boolean; children: React.ReactNode }> = ({ check, children }) => {
  const { profile } = useAuth()
  if (!check(profile?.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="text-5xl">🔒</div>
        <h2 className="text-xl font-bold text-gray-800">Access Restricted</h2>
        <p className="text-gray-500 text-sm max-w-sm">You don't have permission to view this page. Contact your administrator to request access.</p>
        <p className="text-xs text-gray-400">Your role: <span className="font-semibold">{profile?.role ?? 'unknown'}</span></p>
      </div>
    )
  }
  return <>{children}</>
}

export const App: React.FC = () => {
  const { init } = useAuth()
  useEffect(() => { init() }, [])

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            {/* Dashboard */}
            <Route index element={<Dashboard />} />

            {/* Flocks */}
            <Route path="flocks" element={<FlockList />} />
            <Route path="flocks/new" element={<FlockList />} />
            <Route path="flocks/:id" element={<FlockDetail />} />
            <Route path="flocks/daily" element={<DailyEntry />} />
            <Route path="flocks/bulk-daily" element={<BulkDailyEntry />} />
            <Route path="flocks/he-dispatch" element={<HEDispatch />} />
            <Route path="flocks/nhe-sales" element={<NHESales />} />
            <Route path="flocks/egg-conversions" element={<EggConversions />} />
            <Route path="flocks/hatch-batches" element={<HatchBatches />} />
            <Route path="flocks/medicine" element={<MedicineEntry />} />
            <Route path="flocks/medicine-purchases" element={<MedicinePurchases />} />
            <Route path="flocks/opening-stock" element={<EggOpeningStockPage />} />
            <Route path="flocks/vaccination" element={<VaccinationRecordsPage />} />

            {/* Feed Mill */}
            <Route path="feed/mill" element={<FeedMillPage />} />
            <Route path="feed/production" element={<FeedProduction />} />
            <Route path="feed/transfer" element={<FeedTransfer />} />

            {/* Purchase */}
            <Route path="purchase/intent" element={<PurchaseIntentPage />} />
            <Route path="purchase/items" element={<ItemsMasterPage />} />
            <Route path="purchase/orders" element={<PurchaseOrdersPage />} />
            <Route path="purchase/grn" element={<GRNPage />} />
            <Route path="purchase/payments" element={<Navigate to="/pending-payments" replace />} />

            {/* Inventory */}
            <Route path="inventory" element={<InventoryPage />} />

            {/* Electricity */}
            <Route path="electricity" element={<ElectricityEntry />} />
            <Route path="electricity/allocation" element={<ElectricityEntry />} />
            <Route path="electricity/history" element={<ElectricityEntry />} />
            <Route path="electricity/analysis" element={<ElectricityEntry />} />

            {/* Employees */}
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/salary" element={<SalaryEntryPage />} />
            <Route path="employees/abstract" element={<SalaryAbstractPage />} />
            <Route path="employees/site-designation-count" element={<SiteDesignationCountPage />} />
            <Route path="employees/bonus" element={<BonusPage />} />
            <Route path="employees/esi-pf" element={<ESIPFReportPage />} />
            <Route path="employees/payroll-summary" element={<PayrollSummaryPage />} />
            <Route path="employees/attendance" element={<AttendanceRegisterPage />} />
            <Route path="employees/attendance-daily" element={<DailyAttendancePage />} />
            <Route path="employees/attendance-month" element={<MonthAttendancePage />} />
            <Route path="employees/monthly-attendance" element={<MonthlyAttendanceGridPage />} />
            <Route path="employees/advances" element={<EmployeeAdvancesPage />} />
            <Route path="employees/payslip" element={<PayslipGeneratorPage />} />
            <Route path="employees/bulk-salary" element={<BulkSalaryPage />} />
            <Route path="employees/statutory" element={<StatutoryFilingPage />} />
            <Route path="employees/salary-register" element={<SalaryRegisterPage />} />
            <Route path="employees/cms-export" element={<SalaryCMSExportPage />} />
            <Route path="employees/salary-history" element={<SalaryHistoryPage />} />
            <Route path="employees/partner-remuneration" element={<PartnerRemunerationPage />} />

            {/* Masters */}
            <Route path="masters/farms" element={<FarmsMaster />} />
            <Route path="masters/sheds" element={<ShedsMaster />} />
            <Route path="masters/ingredients" element={<IngredientsMaster />} />
            <Route path="masters/feed-types" element={<FeedTypesMaster />} />
            <Route path="masters/formulas" element={<FeedTypesMaster />} />
            <Route path="masters/parties" element={<PartiesMaster />} />
            <Route path="masters/hatcheries" element={<HatcheriesMaster />} />
            <Route path="masters/medicines" element={<MedicinesMaster />} />
            <Route path="masters/meters" element={<MetersMaster />} />
            <Route path="masters/vaccination" element={<VaccinationSchedulePage />} />

            {/* Reports */}
            <Route path="hatchability" element={<HatchabilityPage />} />
            <Route path="reports/pl" element={<PLReport />} />
            <Route path="reports/production" element={<ProductionReport />} />
            <Route path="reports/feed" element={<FeedReport />} />
            <Route path="reports/salary" element={<SalaryReport />} />
            <Route path="reports/export" element={<ExportPage />} />
            <Route path="reports/costs" element={<CostOverviewPage />} />
            <Route path="reports/electricity" element={<ElectricityCostPage />} />
            <Route path="reports/salary-analysis" element={<SalaryCostPage />} />
            <Route path="reports/party-outstanding" element={<PartyOutstandingPage />} />
            <Route path="reports/company-pl" element={<CompanyPLPage />} />
            <Route path="reports/gst" element={<GSTReportPage />} />
            <Route path="reports/egg-stock" element={<EggStockPage />} />
            <Route path="reports/tds-receivable" element={<TDSReceivable />} />
            <Route path="reports/tds-payable" element={<TDSPayable />} />
            <Route path="reports/stock-statement" element={<StockStatement />} />
            <Route path="reports/daily-summary" element={<DailySummaryPage />} />
            <Route path="accounts/cash-book" element={<CashBookPage />} />
            <Route path="accounts/bank-ledger" element={<BankLedgerPage />} />
            <Route path="reports/flock-pl-summary" element={<FlockPLSummary />} />
            <Route path="reports/site-invoice" element={<SiteInvoicePage />} />
            <Route path="reports/bird-sales" element={<BirdSalesReport />} />
            <Route path="vhl/dashboard" element={<VHLDashboardPage />} />
            <Route path="vhl/shed-performance" element={<VHLShedPerformancePage />} />
            <Route path="vhl/egg-stock-register" element={<VHLEggStockRegisterPage />} />
            <Route path="vhl/flocks" element={<VHLFlocksPage />} />
            <Route path="vhl/daily-entry" element={<VHLDailyEntryPage />} />
            <Route path="vhl/bulk-daily-entry" element={<VHLBulkDailyEntryPage />} />
            <Route path="vhl/egg-production" element={<VHLEggProductionPage />} />
            <Route path="vhl/medicine-master" element={<VHLMedicineMasterPage />} />
            <Route path="vhl/medicine-usage" element={<VHLMedicineUsagePage />} />
            <Route path="accounts/payment-planning" element={<PaymentPlanningPage />} />
            <Route path="accounts/cms-upload" element={<CMSUploadPage />} />
            <Route path="accounts/invoices" element={<InvoiceRegister />} />
            <Route path="accounts/sales-invoices" element={<SalesInvoiceRegister />} />
            <Route path="accounts/invoice-series" element={<InvoiceSeriesPage />} />
            <Route path="accounts/buyer-advances" element={<BuyerAdvancesPage />} />
            <Route path="accounts/vendor-advances" element={<VendorAdvancesPage />} />
            <Route path="accounts/party-ledger" element={<PartyLedgerPage />} />
            <Route path="accounts/opening-balances" element={<OpeningBalancesPage />} />
            <Route path="purchases/new" element={<RequireRole check={can.viewPurchase}><PurchaseEntry /></RequireRole>} />
            <Route path="purchases/rate-compare" element={<RequireRole check={can.viewPurchase}><RateCompare /></RequireRole>} />
            <Route path="purchases/vendor-statement" element={<RequireRole check={can.viewPurchase}><VendorStatement /></RequireRole>} />
            <Route path="purchase-orders" element={<RequireRole check={can.viewPurchase}><PurchaseOrdersPage /></RequireRole>} />
            <Route path="procurement" element={<RequireRole check={can.viewPurchase}><PurchaseOrdersPage /></RequireRole>} />
            <Route path="pending-payments" element={<RequireRole check={can.viewPurchase}><PendingPaymentsPage /></RequireRole>} />

            {/* Import */}
            <Route path="import/daily" element={<ImportDaily />} />
            <Route path="import/he" element={<ImportHE />} />
            <Route path="import/salary" element={<ImportSalary />} />
            <Route path="import/electricity" element={<ImportElectricity />} />
            <Route path="import/grn" element={<ImportGRN />} />
            <Route path="import/mapper" element={<ExcelMapperPage />} />
            <Route path="help" element={<HelpGuidePage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="generators" element={<GeneratorsPage />} />
            <Route path="flocks/he-rate-register" element={<HERateRegisterPage />} />
            <Route path="bags" element={<BagsPage />} />
            <Route path="admin/users" element={<RequireRole check={can.manageUsers}><UserManagement /></RequireRole>} />
            <Route path="admin/audit" element={<RequireRole check={can.manageUsers}><AuditLogPage /></RequireRole>} />
            <Route path="admin/access" element={<RequireRole check={can.manageUsers}><AccessControlPage /></RequireRole>} />
            <Route path="admin" element={<RequireRole check={can.manageUsers}><AdminCentre /></RequireRole>} />
            <Route path="planning" element={<RequireRole check={can.viewPlanning}><PlanningPage /></RequireRole>} />

            {/* Flock Management (new) */}
            <Route path="flock" element={<FlockDashboard />} />
            <Route path="flock/compare" element={<FlockComparison />} />
            <Route path="flock/shed-performance" element={<ShedPerformancePage />} />
            <Route path="expenses" element={<FarmExpensesPage />} />
            <Route path="flock/:flockNo" element={<NewFlockDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        duration: 3500,
        style: { fontSize: '14px', borderRadius: '10px', fontFamily: 'Inter, sans-serif' }
      }} />
    </QueryClientProvider>
  )
}
