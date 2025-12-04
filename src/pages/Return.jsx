import React, { useState, useEffect } from 'react'
import { fetchProducts, createReturn } from '../services/api'
import BarcodeScanner from '../components/BarcodeScanner'
import Sidebar from '../components/Sidebar'

export default function ReturnPage() {
  const [products, setProducts] = useState([])
  const [items, setItems] = useState([])
  const [showScanner, setShowScanner] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')

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

  function handleManualAdd() {
    if (!manualBarcode.trim()) return
    const p = products.find(x => x.barcode === manualBarcode)
    if (p) {
      addItem(p)
      setManualBarcode('')
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

  function updateQty(id, newQty) {
    if (newQty < 1) return
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: newQty } : i))
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
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#1c1a16]">
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Return Stock</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Scan barcodes of the tiles you are returning to the warehouse.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Scan Input */}
            <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Scan or Enter Barcode</h2>

              {/* Product Search Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Search by Product Name</label>
                <select
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                  value=""
                  onChange={e => {
                    const value = e.target.value
                    if (value) {
                      const product = products.find(p => (p.id || p.barcode) === value)
                      if (product) {
                        addItem(product)
                      }
                    }
                  }}
                >
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id || p.barcode} value={p.id || p.barcode}>
                      {p.name} - {p.category} ({p.size})
                    </option>
                  ))}
                </select>
              </div>

              {/* Manual Barcode Entry */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Or Enter Barcode</label>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-zinc-400">qr_code_scanner</span>
                  <input
                    type="text"
                    placeholder="Scan barcode here..."
                    value={manualBarcode}
                    onChange={e => setManualBarcode(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleManualAdd()}
                    className="flex-1 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <button
                onClick={handleManualAdd}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90"
              >
                Add to Return List
              </button>
            </div>

            {/* Right Column - Return List */}
            <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Return List</h2>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Items: {items.length}</span>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                  No items in return list
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase pb-2 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="col-span-6">Product</div>
                      <div className="col-span-3 text-center">Quantity</div>
                      <div className="col-span-3 text-center">Action</div>
                    </div>
                    {items.map(i => (
                      <div key={i.id} className="grid grid-cols-12 gap-4 items-center py-2">
                        <div className="col-span-6 flex items-center gap-3">
                          <img
                            src={i.image || 'https://via.placeholder.com/48'}
                            alt={i.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <div className="font-medium text-sm text-zinc-900 dark:text-white">{i.name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">SKU: {i.barcode}</div>
                          </div>
                        </div>
                        <div className="col-span-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={i.qty}
                            onChange={e => updateQty(i.id, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 text-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-sm"
                          />
                        </div>
                        <div className="col-span-3 text-center">
                          <button
                            onClick={() => removeItem(i.id)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-red-600 dark:text-red-400">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => setItems([])}
                      className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Clear List
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90"
                    >
                      Submit Return
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
