import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { fetchUsers, fetchProducts, createUserTransaction } from '../services/api'
import Sidebar from '../components/Sidebar'
import UserSidebar from '../components/UserSidebar'
import BarcodeScanner from '../components/BarcodeScanner'

import MobileHeader from '../components/MobileHeader'

// Get user synchronously from localStorage  
function getUserFromStorage() {
  try {
    const stored = localStorage.getItem('tsm_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export default function Transfer() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [items, setItems] = useState([])
  const [toUserId, setToUserId] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [manualSKU, setManualSKU] = useState('')
  const [viewingProduct, setViewingProduct] = useState(null) // New state for verification

  const currentUser = getUserFromStorage()
  const isAdmin = currentUser?.role === 'ADMIN'
  const location = useLocation()

  useEffect(() => {
    let mounted = true
    fetchUsers().then(d => mounted && setUsers(d)).catch(() => { })
    fetchProducts().then(d => {
      if (mounted) {
        setProducts(d)
        // Check for specific product from Catalog navigation
        const selectedId = location.state?.selectedProductId
        if (selectedId) {
          const product = d.find(p => p.id === parseInt(selectedId))
          if (product) {
            setViewingProduct(product)
            // Clear state so it doesn't reopen on refresh/navigate back
            window.history.replaceState({}, document.title)
          }
        }
      }
    }).catch(() => { })
    return () => mounted = false
  }, [location.state])

  function handleScan(code) {
    setShowScanner(false)
    const p = products.find(x => x.barcode === code)
    if (p) setViewingProduct(p) // Show modal instead of adding immediately
    else alert('Product not found')
  }

  function handleManualAdd() {
    if (!manualSKU.trim()) return
    const p = products.find(x => x.barcode === manualSKU || x.name?.toLowerCase().includes(manualSKU.toLowerCase()))
    if (p) {
      setViewingProduct(p) // Show modal
      setManualSKU('')
    } else {
      alert('Product not found')
    }
  }

  function confirmAddItem() {
    if (viewingProduct) {
      addItem(viewingProduct)
      setViewingProduct(null)
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
    if (isAdmin && !toUserId) return alert('Select which user is transferring stock')
    if (items.length === 0) return alert('Add items to transfer')

    try {
      // Process each item as a separate transaction
      for (const item of items) {
        await createUserTransaction({
          user_id: isAdmin ? toUserId : undefined, // Admin can specify user, regular user uses their own
          product_id: item.id,
          type: 'TRANSFER',
          quantity: item.qty,
          customer_name: null // Job/customer name removed as requested
        })
      }

      alert('✅ Stock Transferred Successfully!')
      setItems([])
      setToUserId('')
    } catch (e) {
      const errorMessage = e.message || 'Transaction failed'
      alert(`❌ ${errorMessage}`)
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#1c1a16]">
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {/* Product Verification Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#191714] rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setViewingProduct(null)}
                  className="p-2 -mr-2 -mt-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <div className="mb-6">
                <div className="text-sm font-medium text-primary mb-1">{viewingProduct.category}</div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{viewingProduct.name}</h2>
                <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                  <span>Size: {viewingProduct.size}</span>
                  <span>SKU: {viewingProduct.barcode}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl mb-6">
                <div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Stock Available</div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-white">{viewingProduct.stock_qty} sqft</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Selling Price</div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-white">${viewingProduct.selling_price}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setViewingProduct(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAddItem}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  Add to List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conditional Sidebar based on role */}
      {isAdmin ? (
        <Sidebar
          className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
          onClose={() => setMobileMenuOpen(false)}
        />
      ) : (
        <UserSidebar
          className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} title={isAdmin ? 'Transfer Stock' : 'Take Stock'} />

        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                {isAdmin ? 'Transfer Stock' : 'Take Stock from Warehouse'}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                {isAdmin
                  ? 'Move stock from warehouse to staff'
                  : 'Select products to take from the warehouse for your jobs.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Select Recipient - ADMIN ONLY */}
                {isAdmin && (
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
                )}

                {/* Add Items */}
                <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">{isAdmin ? '2.' : '1.'} Add Items</h2>

                  {/* Product Search Dropdown */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Search by Product Name</label>
                    <select
                      value=""
                      onChange={e => {
                        if (e.target.value) {
                          const product = products.find(p => p.id === parseInt(e.target.value))
                          if (product) {
                            setViewingProduct(product) // Verification flow for dropdown too
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
                          <input
                            type="number"
                            min="1"
                            value={i.qty}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 1
                              setItems(prev => prev.map(item => item.id === i.id ? { ...item, qty: Math.max(1, val) } : item))
                            }}
                            className="w-16 text-center font-medium text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20"
                          />
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
                        className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={handleSubmit}
                        className={`flex-1 px-4 py-3 rounded-lg font-bold text-white transition-all active:scale-[0.98] ${items.length === 0
                          ? 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed'
                          : 'bg-primary hover:bg-primary/90'
                          }`}
                        disabled={items.length === 0}
                      >
                        {isAdmin ? 'Confirm Transfer' : 'Confirm Take Stock'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
