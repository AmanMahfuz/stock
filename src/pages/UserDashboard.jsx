import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUserStats } from '../services/api'

export default function UserDashboard() {
  const [stats, setStats] = useState({ productsTaken: 0, balanceToReturn: 0 })

  useEffect(() => {
    let mounted = true;
    getUserStats().then(d => mounted && setStats(d)).catch(() => { });
    return () => mounted = false
  }, [])

  return (
    <div>
      <div className="topbar">
        <h2>User Dashboard</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/transfer" className="btn">Stock Transfer</Link>
          <Link to="/return" className="btn secondary">Return Stock</Link>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Products Taken Today</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.productsTaken}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Balance to Return</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.balanceToReturn}</div>
        </div>
      </div>
    </div>
  )
}
