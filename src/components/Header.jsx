import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../services/api'

export default function Header() {
  const user = getCurrentUser()
  const navigate = useNavigate()
  function doLogout() {
    logout();
    navigate('/login')
  }
  function goHome() {
    if (user?.role === 'ADMIN') navigate('/admin')
    else if (user?.role) navigate('/user')
    else navigate('/login')
  }
  return (
    <div className="topbar">
      <div className="logo" style={{ cursor: 'pointer' }} onClick={goHome}>
        <img src="/smart-florring-logo-main.png" alt="Smart Floor" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <div>
          <div className="app-name">SMART FLOOR</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>{user?.role || 'Guest'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {user?.role && <button className="btn" onClick={doLogout}>Logout</button>}
      </div>
    </div>
  )
}
