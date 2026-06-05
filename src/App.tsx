import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import { Login }  from '@/pages/auth/Login'
import { Dashboard } from '@/pages/dashboard/Dashboard'
import { FlockList } from '@/pages/flocks/FlockList'
import { FlockDetail } from '@/pages/flocks/FlockDetail'
import { DailyEntry } from '@/pages/flocks/DailyEntry'
import { HEDispatch, NHESales, MedicineEntry } from '@/pages/flocks/FlockSalesPages'
import { FeedDashboard, GRNEntry, FeedProduction, FeedTransfer } from '@/pages/feed/FeedPages'
import { ElectricityEntry } from '@/pages/electricity/ElectricityEntry'
import { EmployeeList, SalaryAbstractPage } from '@/pages/employees/EmployeePages'
import { FarmsMaster, IngredientsMaster, PartiesMaster, MedicinesMaster } from '@/pages/masters/MastersPages'
import { ImportDaily, ImportElectricity, ImportSalary } from '@/pages/import/ImportPages'
import { Spinner } from '@/components/ui'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min — keeps reads minimal
      gcTime:    30 * 60 * 1000,     // 30 min cache
      retry: 1,
      refetchOnWindowFocus: false,   // don't refetch on tab switch — low usage
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

// Simple placeholder for unbuilt pages
const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-24">
    <p className="text-lg font-medium text-gray-700">{title}</p>
    <p className="text-sm text-gray-400 mt-1">Coming soon</p>
  </div>
)

export const App: React.FC = () => {
  const { init } = useAuth()
  useEffect(() => { init() }, [])

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
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
            <Route path="flocks/medicine" element={<MedicineEntry />} />

            {/* Feed Mill */}
            <Route path="feed" element={<FeedDashboard />} />
            <Route path="feed/grn" element={<GRNEntry />} />
            <Route path="feed/production" element={<FeedProduction />} />
            <Route path="feed/transfer" element={<FeedTransfer />} />
            <Route path="feed/stock" element={<Placeholder title="Stock Status" />} />

            {/* Electricity */}
            <Route path="electricity" element={<ElectricityEntry />} />
            <Route path="electricity/allocation" element={<Placeholder title="Electricity Allocation" />} />
            <Route path="electricity/history" element={<ElectricityEntry />} />

            {/* Employees */}
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/salary" element={<Placeholder title="Individual Salary Entry" />} />
            <Route path="employees/abstract" element={<SalaryAbstractPage />} />
            <Route path="employees/bonus" element={<Placeholder title="Bonus Entry" />} />

            {/* Masters */}
            <Route path="masters/farms" element={<FarmsMaster />} />
            <Route path="masters/sheds" element={<Placeholder title="Sheds Master" />} />
            <Route path="masters/ingredients" element={<IngredientsMaster />} />
            <Route path="masters/feed-types" element={<Placeholder title="Feed Types" />} />
            <Route path="masters/formulas" element={<Placeholder title="Feed Formulas" />} />
            <Route path="masters/parties" element={<PartiesMaster />} />
            <Route path="masters/hatcheries" element={<Placeholder title="Hatcheries Master" />} />
            <Route path="masters/medicines" element={<MedicinesMaster />} />
            <Route path="masters/meters" element={<Placeholder title="Electricity Meters Master" />} />

            {/* Reports */}
            <Route path="reports/pl" element={<Placeholder title="Flock P&L Report" />} />
            <Route path="reports/production" element={<Placeholder title="Production Report" />} />
            <Route path="reports/feed" element={<Placeholder title="Feed Cost Report" />} />
            <Route path="reports/salary" element={<Placeholder title="Salary Report" />} />
            <Route path="reports/export" element={<Placeholder title="Export to Excel" />} />

            {/* Import */}
            <Route path="import/daily" element={<ImportDaily />} />
            <Route path="import/he" element={<Placeholder title="Import HE Dispatch" />} />
            <Route path="import/salary" element={<ImportSalary />} />
            <Route path="import/electricity" element={<ImportElectricity />} />
            <Route path="import/grn" element={<Placeholder title="Import GRN" />} />
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
