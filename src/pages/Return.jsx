import React, { useState, useEffect } from 'react'
import { fetchProducts, createReturn, getCurrentUser, fetchStaffInventory } from '../services/api'
import Sidebar from '../components/Sidebar'
import UserSidebar from '../components/UserSidebar'
import BarcodeScanner from '../components/BarcodeScanner'

export default function ReturnPage() {
  const [inventory, setInventory] = useState([])
  const [returnQtys, setReturnQtys] = useState({}) // { productId: qty }
  const [accountedFor, setAccountedFor] = useState({}) // { productId: true } - marks product as fully used/sold
  const [loading, setLoading] = useState(true)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const currentUser = getCurrentUser()

  useEffect(() => {
    loadInventory()
    // Load accountedFor from localStorage
    const saved = localStorage.getItem(`accountedFor_${currentUser?.id}`)
    if (saved) {
      try {
        setAccountedFor(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse accountedFor', e)
      }
    }
  }, [])

  async function loadInventory() {
    try {
      if (currentUser) {
        const data = await fetchStaffInventory(currentUser.id)
        setInventory(data)
      }
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleScan(code) {
    setShowScanner(false)
    handleBarcodeAdd(code)
  }

  function handleBarcodeSubmit(e) {
    e?.preventDefault()
    if (!barcodeInput.trim()) return
    handleBarcodeAdd(barcodeInput.trim())
  }

  function handleBarcodeAdd(barcode) {
    // Find product in inventory by barcode
    const item = inventory.find(i => i.product?.barcode === barcode)

    if (item) {
      // Increment return quantity
      const currentQty = returnQtys[item.product_id] || 0
      if (currentQty < item.quantity) {
        updateReturnQty(item.product_id, currentQty + 1)
        setBarcodeInput('')
      } else {
        alert(`Already returning all available quantity for ${item.product?.name}`)
        setBarcodeInput('')
      }
    } else {
      alert('Product not found in your inventory')
      setBarcodeInput('')
    }
  }

  function updateReturnQty(productId, qty) {
    const val = Math.max(0, parseInt(qty) || 0)
    setReturnQtys(prev => ({
      ...prev,
      [productId]: val
    }))
  }

  function toggleAccountedFor(productId, checked) {
    setAccountedFor(prev => {
      const newState = checked
        ? { ...prev, [productId]: true }
        : Object.fromEntries(Object.entries(prev).filter(([key]) => key !== String(productId)))

      // Save to localStorage
      localStorage.setItem(`accountedFor_${currentUser?.id}`, JSON.stringify(newState))

      return newState
    })
  }

  async function handleSubmit() {
    const itemsToReturn = Object.entries(returnQtys)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, qty]) => ({
        productId: parseInt(productId),
        qty: qty
      }))

    if (itemsToReturn.length === 0) {
      return alert('Enter quantities to return')
    }

    // Validate quantities
    for (const item of itemsToReturn) {
      const inventoryItem = inventory.find(i => i.product_id === item.productId)
      if (item.qty > inventoryItem.quantity) {
        return alert(`Cannot return more than you have for ${inventoryItem.product?.name}`)
      }
    }

    try {
      await createReturn({ items: itemsToReturn })

      // Mark returned products as "All Used" - the remainder is considered sold/used
      const newAccountedFor = { ...accountedFor }
      itemsToReturn.forEach(item => {
        newAccountedFor[item.productId] = true
      })
      setAccountedFor(newAccountedFor)
      localStorage.setItem(`accountedFor_${currentUser?.id}`, JSON.stringify(newAccountedFor))

      alert('✅ Return successful! Remaining stock marked as used.')
      setReturnQtys({})
      loadInventory() // Reload to show updated inventory
    } catch (e) {
      alert('❌ Return failed: ' + (e.response?.data?.message || e.message))
    }
  }

  const totalReturning = Object.values(returnQtys).reduce((sum, qty) => sum + (qty || 0), 0)

  const filteredInventory = inventory
    .filter(item => {
      // Hide products marked as fully accounted for
      if (accountedFor[item.product_id]) return false

      // Calculate remaining stock after return
      const returningQty = returnQtys[item.product_id] || 0
      const remainingQty = item.quantity - returningQty

      // Only show if there's remaining stock
      if (remainingQty <= 0) return false

      // Apply search filter
      if (searchQuery.trim()) {
        return item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.product?.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.product?.category?.toLowerCase().includes(searchQuery.toLowerCase())
      }

      return true
    })

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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Return Stock</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Scan barcodes or enter quantities to return items to the warehouse.</p>
          </div>

          {/* Barcode Scanner Section */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl border border-primary/20 dark:border-primary/30 p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-2xl">qr_code_scanner</span>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Quick Barcode Scan</h2>
            </div>
            <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-6 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">photo_camera</span>
                Scan
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Or enter barcode manually..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                Add to Return
              </button>
            </form>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
              💡 Tip: Each scan adds 1 unit to the return quantity for that product
            </p>
          </div>

          <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Your Inventory</h2>
                {totalReturning > 0 && (
                  <span className="text-sm text-primary font-medium">
                    Returning {totalReturning} item{totalReturning !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {/* Search Bar */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                Loading inventory...
              </div>
            ) : filteredInventory.length > 0 ? (
              <div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                      <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Product</th>
                      <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Category</th>
                      <th className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">You Have</th>
                      <th className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Return Qty</th>
                      <th className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">All Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map(item => (
                      <tr key={item.product_id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.product?.image_url || 'https://via.placeholder.com/48'}
                              alt={item.product?.name}
                              className="w-12 h-12 rounded object-cover bg-zinc-100 dark:bg-zinc-800"
                            />
                            <div>
                              <div className="font-medium text-sm text-zinc-900 dark:text-white">{item.product?.name || 'Unknown'}</div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">SKU: {item.product?.barcode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{item.product?.category}</td>
                        <td className="px-6 py-4 text-center text-sm font-medium text-zinc-900 dark:text-white">{item.quantity}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => updateReturnQty(item.product_id, (returnQtys[item.product_id] || 0) - 1)}
                              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                            >
                              <span className="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={returnQtys[item.product_id] || 0}
                              onChange={e => updateReturnQty(item.product_id, e.target.value)}
                              className="w-20 text-center font-medium text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <button
                              onClick={() => updateReturnQty(item.product_id, (returnQtys[item.product_id] || 0) + 1)}
                              disabled={returnQtys[item.product_id] >= item.quantity}
                              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <label className="flex items-center cursor-pointer" title="Check to hide this product (rest is sold/used)">
                              <input
                                type="checkbox"
                                checked={accountedFor[item.product_id] || false}
                                onChange={e => toggleAccountedFor(item.product_id, e.target.checked)}
                                className="w-5 h-5 text-primary bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded focus:ring-2 focus:ring-primary/20"
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setReturnQtys({})}
                      className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={totalReturning === 0}
                      className={`flex-1 px-4 py-3 rounded-lg font-bold text-white transition-all active:scale-[0.98] ${totalReturning === 0
                        ? 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary/90'
                        }`}
                    >
                      Submit Return
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                No items in your inventory to return
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
