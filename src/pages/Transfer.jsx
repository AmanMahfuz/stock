import React, { useState, useEffect } from 'react'
import { fetchUsers, fetchProducts, createTransfer, getCurrentUser } from '../services/api'
import Sidebar from '../components/Sidebar'
import UserSidebar from '../components/UserSidebar'
import BarcodeScanner from '../components/BarcodeScanner'

export default function Transfer() {
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [items, setItems] = useState([])
  const [toUserId, setToUserId] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [manualSKU, setManualSKU] = useState('')

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

  function handleManualAdd() {
    if (!manualSKU.trim()) return
    const p = products.find(x => x.barcode === manualSKU || x.name?.toLowerCase().includes(manualSKU.toLowerCase()))
    if (p) {
      addItem(p)
      setManualSKU('')
    } else {
      alert('Product not found')
    }
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
      alert('✅ Transfer successful!')
      setItems([])
      setToUserId('')
    } catch (e) {
      // Show specific error message from backend
      const errorMessage = e.response?.data?.message || e.message || 'Transfer failed'
      alert(`❌ ${errorMessage} `)
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#1c1a16]">
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {/* Conditional Sidebar based on role */}
      {getCurrentUser()?.role === 'ADMIN' ? <Sidebar /> : <UserSidebar />}

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Stock Transfer</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Select Recipient */}
              <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">1. Select Recipient</h2>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Transfer To</label>
                  <select
                    value={toUserId}
                    onChange={e => setToUserId(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Search for a user...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
              </div>

              {/* Add Items */}
              <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">2. Add Items</h2>

                {/* Product Search Dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Search by Product Name</label>
                  <select
                    value=""
                    onChange={e => {
                      if (e.target.value) {
                        const product = products.find(p => p.id === parseInt(e.target.value))
                        if (product) {
                          addItem(product)
                        }
                      }
                    }}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select a product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.barcode} (Stock: {p.stock_qty})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barcode Scanner Button */}
                <button
                  onClick={() => setShowScanner(true)}
                  className="mb-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                  Scan Barcode
                </button>

                {/* Manual Barcode Input with Add Button */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Or Enter Barcode/SKU Manually</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter barcode or SKU..."
                      value={manualSKU}
                      onChange={e => setManualSKU(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleManualAdd()}
                      className="flex-1 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      onClick={handleManualAdd}
                      className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">add</span>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Items for Transfer */}
            <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Items for Transfer ({items.length})</h2>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                  No items added yet
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(i => (
                    <div key={i.id} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                      <img
                        src={i.image || 'https://via.placeholder.com/64'}
                        alt={i.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-zinc-900 dark:text-white">{i.name}</div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">SKU: {i.barcode}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(i.id, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="w-8 text-center font-medium text-zinc-900 dark:text-white">{i.qty}</span>
                        <button
                          onClick={() => updateQty(i.id, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                        <button
                          onClick={() => removeItem(i.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors ml-2"
                        >
                          <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-600 dark:text-zinc-400">Total Unique Items</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{items.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Total Quantity</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{items.reduce((s, i) => s + i.qty, 0)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setItems([])}
                      className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90"
                    >
                      Confirm Transfer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
