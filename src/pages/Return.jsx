import React, { useState, useEffect } from 'react'
import { fetchProducts, createReturn } from '../services/api'
import BarcodeScanner from '../components/BarcodeScanner'

export default function ReturnPage() {
  const [products, setProducts] = useState([])
  const [items, setItems] = useState([])
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    let mounted = true
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
    if (items.length === 0) return alert('Add items to return')

    try {
      await createReturn({
        items: items.map(i => ({ productId: i.id, qty: i.qty }))
      })
      alert('Return successful')
      setItems([])
    } catch (e) {
      alert('Return failed')
    }
  }

  return (
    <div>
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      <div className="topbar">
        <h2>Return Stock</h2>
        <button className="btn" onClick={() => setShowScanner(true)}>Scan Barcode</button>
      </div>

      <div className="card">
        {items.length === 0 && <div className="muted">No items to return. Scan barcode to add items.</div>}
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
        {items.length > 0 && <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}><button className="btn" onClick={handleSubmit}>Submit Return</button></div>}
      </div>
    </div>
  )
}
