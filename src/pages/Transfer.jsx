import React, { useState, useEffect } from 'react'
import { fetchUsers, fetchProducts, createTransfer } from '../services/api'
import BarcodeScanner from '../components/BarcodeScanner'

export default function Transfer() {
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [items, setItems] = useState([])
  const [toUserId, setToUserId] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    let mounted = true
    fetchUsers().then(d => mounted && setUsers(d)).catch(() => { })
    fetchProducts().then(d => mounted && setProducts(d)).catch(() => { })
    return () => mounted = false
  }, [])

  function handleScan(code) {
    setShowScanner(false)
    const p = products.find(x => x.barcode === code)
    if (p) addItem(p)
    else alert('Product not found')
  }

  function addItem(product) {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
  }

  function updateQty(id, delta) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleSubmit() {
    if (!toUserId) return alert('Select a recipient')
    if (items.length === 0) return alert('Add items to transfer')

    try {
      await createTransfer({
        toUserId,
        items: items.map(i => ({ productId: i.id, qty: i.qty }))
      })
      alert('Transfer successful')
      setItems([])
      setToUserId('')
    } catch (e) {
      alert('Transfer failed')
    }
  }

  return (
    <div>
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      <div className="topbar">
        <h2>Stock Transfer</h2>
        <button className="btn" onClick={() => setShowScanner(true)}>Scan Barcode</button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="form-row">
          <label className="form-label">Transfer To</label>
          <select value={toUserId} onChange={e => setToUserId(e.target.value)}>
            <option value="">Select User</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {items.length === 0 && <div className="muted">No products added. Scan barcode to add items.</div>}
        {items.map(i => (
          <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{i.name}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Barcode: {i.barcode}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="btn secondary" style={{ padding: '4px 8px' }} onClick={() => updateQty(i.id, -1)}>-</button>
              <div style={{ minWidth: 20, textAlign: 'center' }}>{i.qty}</div>
              <button className="btn secondary" style={{ padding: '4px 8px' }} onClick={() => updateQty(i.id, 1)}>+</button>
              <button className="btn secondary" style={{ padding: '4px 8px', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => removeItem(i.id)}>Remove</button>
            </div>
          </div>
        ))}
        {items.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div>Total Items: {items.length} • Total Qty: {items.reduce((s, i) => s + i.qty, 0)}</div>
            <button className="btn" onClick={handleSubmit}>Confirm Transfer</button>
          </div>
        )}
      </div>
    </div>
  )
}
