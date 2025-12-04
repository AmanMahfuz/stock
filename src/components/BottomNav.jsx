import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { getCurrentUser } from '../services/api'

export default function BottomNav() {
  const loc = useLocation()
  const hidden = loc.pathname === '/login' || loc.pathname === '/signup'
  if (hidden) return null

  const user = getCurrentUser()
  const role = user?.role || 'GUEST'

  // Role-based nav items
  const adminItems = [
    { to: '/admin', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/transfer', label: 'Transfer' },
    { to: '/return', label: 'Return' },
    { to: '/reports', label: 'Reports' },
  ]
  const userItems = [
    { to: '/user', label: 'Home' },
    { to: '/transfer', label: 'Transfer' },
    { to: '/return', label: 'Return' },
    { to: '/user', label: 'Scan' },
    { to: '/profile', label: 'Profile' },
  ]

  const items = role === 'ADMIN' ? adminItems : userItems

  return (
    <div className="bottom-nav">
      <div className="nav">
        {items.map(i => (
          <Link key={i.label} to={i.to}>{i.label}</Link>
        ))}
      </div>
    </div>
  )
}
