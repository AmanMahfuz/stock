import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminDashboard from './pages/AdminDashboard'
import UserDashboard from './pages/UserDashboard'
import Products from './pages/Products'
import Transfer from './pages/Transfer'
import ReturnPage from './pages/Return'
import Profile from './pages/Profile'
import Reports from './pages/Reports'
import Transactions from './pages/Transactions'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import { getCurrentUser } from './services/api'

function RequireAuth({ children, roles }) {
  const user = getCurrentUser()
  if (!user?.token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function HomeRedirect() {
  const user = getCurrentUser()
  if (!user?.token) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  return <Navigate to="/user" replace />
}

export default function App() {
  const location = useLocation()
  const isAuthPage = ['/login', '/signup'].includes(location.pathname)
  // Hide Header and BottomNav on admin pages that use Sidebar
  const isAdminPage = ['/admin', '/user', '/products', '/transfer', '/return', '/reports', '/transactions'].includes(location.pathname)

  return (
    <div className="app">
      {!isAdminPage && !isAuthPage && <Header />}
      <main className={!isAdminPage ? "main-content" : ""}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<RequireAuth roles={["ADMIN"]}><AdminDashboard /></RequireAuth>} />
          <Route path="/user" element={<RequireAuth roles={["USER", "SALES", "USER"]}><UserDashboard /></RequireAuth>} />
          <Route path="/products" element={<RequireAuth roles={["ADMIN"]}><Products /></RequireAuth>} />
          <Route path="/transfer" element={<RequireAuth roles={["ADMIN", "USER", "SALES"]}><Transfer /></RequireAuth>} />
          <Route path="/return" element={<RequireAuth roles={["ADMIN", "USER", "SALES"]}><ReturnPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth roles={["ADMIN", "USER", "SALES"]}><Profile /></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth roles={["ADMIN"]}><Reports /></RequireAuth>} />
          <Route path="/transactions" element={<RequireAuth roles={["USER", "SALES"]}><Transactions /></RequireAuth>} />
          <Route path="/" element={<HomeRedirect />} />
        </Routes>
      </main>
      {!isAdminPage && !isAuthPage && <BottomNav />}
    </div>
  )
}
