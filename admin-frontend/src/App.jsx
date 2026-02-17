import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import RequireAdminAuth from './components/RequireAdminAuth'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminSignupPage from './pages/AdminSignupPage'
import DashboardPage from './pages/DashboardPage'
import PieChartsPage from './pages/PieChartsPage'
import RevenueChartsPage from './pages/RevenueChartsPage'
import OrdersPage from './pages/OrdersPage'
import ProductsPage from './pages/ProductsPage'
import SupportMessagesPage from './pages/SupportMessagesPage'
import UsersPage from './pages/UsersPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route path="/signup" element={<AdminSignupPage />} />

      <Route element={<RequireAdminAuth />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/support-messages" element={<SupportMessagesPage />} />
          <Route path="/revenue-charts" element={<RevenueChartsPage />} />
          <Route path="/pie-charts" element={<PieChartsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
