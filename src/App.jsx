import React, { useEffect, useState } from 'react'
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
import Catalog from './pages/Catalog'
import Header from './components/Header'
import BottomNav from './components/BottomNav'

import { getCurrentUser } from './services/api' // Import logic

// Synchronous helper to get user from localStorage
function getUserFromStorage() {
  try {
    const stored = localStorage.getItem('tsm_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function RequireAuth({ children, roles }) {
  // We trust the app's initial check has already run/cleared storage if needed
  const user = getUserFromStorage()

  if (!user?.token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function HomeRedirect() {
  const user = getUserFromStorage()
  if (!user?.token) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  return <Navigate to="/user" replace />
}

export default function App() {
  const location = useLocation()
  const [authChecked, setAuthChecked] = useState(false) // New loading state

  // Global Auth Check on App Load
  useEffect(() => {
    async function checkSession() {
      try {
        await getCurrentUser() // This validates session & clears storage if invalid
      } catch (e) {
        console.error("Session check failed", e)
      } finally {
        setAuthChecked(true)
      }
    }
    checkSession()
  }, [])

  if (!authChecked) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-[#1c1a16]">
        <div className="text-zinc-500">Verifying session...</div>
      </div>
    )
  }

  const isAuthPage = ['/login', '/signup'].includes(location.pathname)
  // Hide Header and BottomNav on admin pages that use Sidebar
  const isAdminPage = ['/admin', '/user', '/products', '/transfer', '/return', '/reports', '/transactions', '/catalog', '/profile'].includes(location.pathname)

  return (
    <div className="app">
      {!isAdminPage && !isAuthPage && <Header />}
      <main className={!isAdminPage ? "main-content" : ""}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<RequireAuth roles={["ADMIN"]}><AdminDashboard /></RequireAuth>} />
          <Route path="/user" element={<RequireAuth roles={["USER", "SALES", "USER"]}><UserDashboard /></RequireAuth>} />
          <Route path="/catalog" element={<RequireAuth roles={["USER", "SALES"]}><Catalog /></RequireAuth>} />
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
