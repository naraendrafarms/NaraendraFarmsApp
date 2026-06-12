import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuth, can } from '@/lib/auth'
import type { Role } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import { Login }  from '@/pages/auth/Login'
import { Dashboard } from '@/pages/dashboard/Dashboard'
import { FlockList } from '@/pages/flocks/FlockList'
import { FlockDetail } from '@/pages/flocks/FlockDetail'
import { DailyEntry } from '@/pages/flocks/DailyEntry'
import { HEDispatch, NHESales, MedicineEntry } from '@/pages/flocks/FlockSalesPages'
import { EggConversions } from '@/pages/flocks/EggConversions'
import { HatchBatches } from '@/pages/flocks/HatchBatches'
import { FeedDashboard, GRNEntry, FeedProduction, FeedTransfer } from '@/pages/feed/FeedPages'
import { StockPage } from '@/pages/feed/StockPage'
import { FeedMillPage } from '@/pages/feed/FeedMillPages'
import { ElectricityEntry } from '@/pages/electricity/ElectricityEntry'
import { EmployeeList, SalaryAbstractPage, SalaryEntryPage, BonusPage, ESIPFReportPage, PayrollSummaryPage, AttendanceRegisterPage, PayslipGeneratorPage } from '@/pages/employees/EmployeePages'
import {
  FarmsMaster, IngredientsMaster, PartiesMaster, MedicinesMaster,
  ShedsMaster, HatcheriesMaster, MetersMaster, FeedTypesMaster, VaccinationSchedulePage
} from '@/pages/masters/MastersPages'
import { ImportDaily, ImportElectricity, ImportSalary, ImportHE, ImportGRN } from '@/pages/import/ImportPages'
import { HatchabilityPage } from '@/pages/hatchability/HatchabilityPage'
import { SetupPage } from '@/pages/setup/SetupPage'
import { ProductionReport, PLReport, SalaryReport, FeedReport, ExportPage } from '@/pages/reports/ReportsPages'
import { CostOverviewPage, ElectricityCostPage, SalaryCostPage } from '@/pages/reports/CostAnalysis'
import { PurchaseOrdersPage, PendingPaymentsPage } from '@/pages/reports/POPages'
import { UserManagement } from '@/pages/admin/UserManagement'
import { AdminCentre } from '@/pages/admin/AdminCentre'
import { FlockDashboard, FlockDetail as NewFlockDetail } from '@/pages/flock/FlockPages'
import { FlockComparison } from '@/pages/flock/FlockComparison'
import { ShedPerformancePage } from '@/pages/flock/ShedPerformance'
import { Spinner } from '@/components/ui'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime:    30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
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
            <Route path="flocks/he-dispatch" element={<HEDispatch />} />
            <Route path="flocks/nhe-sales" element={<NHESales />} />
            <Route path="flocks/egg-conversions" element={<EggConversions />} />
            <Route path="flocks/hatch-batches" element={<HatchBatches />} />
            <Route path="flocks/medicine" element={<MedicineEntry />} />

            {/* Feed Mill */}
            <Route path="feed" element={<FeedDashboard />} />
            <Route path="feed/grn" element={<GRNEntry />} />
            <Route path="feed/production" element={<FeedProduction />} />
            <Route path="feed/transfer" element={<FeedTransfer />} />
            <Route path="feed/stock" element={<StockPage />} />
            <Route path="feed/mill" element={<FeedMillPage />} />

            {/* Electricity */}
            <Route path="electricity" element={<ElectricityEntry />} />
            <Route path="electricity/allocation" element={<ElectricityEntry />} />
            <Route path="electricity/history" element={<ElectricityEntry />} />

            {/* Employees */}
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/salary" element={<SalaryEntryPage />} />
            <Route path="employees/abstract" element={<SalaryAbstractPage />} />
            <Route path="employees/bonus" element={<BonusPage />} />
            <Route path="employees/esi-pf" element={<ESIPFReportPage />} />
            <Route path="employees/payroll-summary" element={<PayrollSummaryPage />} />
            <Route path="employees/attendance" element={<AttendanceRegisterPage />} />
            <Route path="employees/payslip" element={<PayslipGeneratorPage />} />

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
            <Route path="purchase-orders" element={<RequireRole check={can.viewPurchase}><PurchaseOrdersPage /></RequireRole>} />
            <Route path="pending-payments" element={<RequireRole check={can.viewPurchase}><PendingPaymentsPage /></RequireRole>} />

            {/* Import */}
            <Route path="import/daily" element={<ImportDaily />} />
            <Route path="import/he" element={<ImportHE />} />
            <Route path="import/salary" element={<ImportSalary />} />
            <Route path="import/electricity" element={<ImportElectricity />} />
            <Route path="import/grn" element={<ImportGRN />} />
            <Route path="admin/users" element={<RequireRole check={can.manageUsers}><UserManagement /></RequireRole>} />
            <Route path="admin" element={<RequireRole check={can.manageUsers}><AdminCentre /></RequireRole>} />

            {/* Flock Management (new) */}
            <Route path="flock" element={<FlockDashboard />} />
            <Route path="flock/compare" element={<FlockComparison />} />
            <Route path="flock/shed-performance" element={<ShedPerformancePage />} />
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
