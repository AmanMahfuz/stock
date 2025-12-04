import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts, getDashboardStats } from '../services/api'
import BarcodeScanner from '../components/BarcodeScanner'

export default function AdminDashboard() {
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({ totalProducts: 0, totalStock: 0, stockValue: 0, pendingReturns: 0 })
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    let mounted = true;
    fetchProducts().then(d => mounted && setProducts(d)).catch(() => { });
    return () => mounted = false
  }, [])

  useEffect(() => {
    let mounted = true;
    getDashboardStats().then(d => mounted && setStats(d)).catch(() => { });
    return () => mounted = false
  }, [])

  function handleScan(code) {
    setShowScanner(false)
    alert(`Scanned Code: ${code}`)
    // Future: Navigate to product or add to list
  }

  return (
    <div>
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Admin Dashboard</h2>
          <p style={{ color: 'var(--text-muted)' }}>Overview of your inventory and performance</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/products" className="btn">
            <span>+ Add Product</span>
          </Link>
          <Link to="/reports" className="btn secondary">Reports</Link>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Products</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.totalProducts}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Stock</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.totalStock}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Stock Value</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>${stats.stockValue.toLocaleString()}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Pending Returns</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.pendingReturns}</div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }} className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setShowScanner(true)} style={{ flex: 1, minWidth: '200px', padding: '1.5rem', justifyContent: 'flex-start', background: 'var(--bg-hover)', border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-main)' }}>Scan Barcode</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400 }}>Open camera to scan products</div>
            </div>
          </button>
          <button className="btn" style={{ flex: 1, minWidth: '200px', padding: '1.5rem', justifyContent: 'flex-start', background: 'var(--bg-hover)', border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-main)' }}>Low Stock Alerts</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400 }}>View items running low</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
