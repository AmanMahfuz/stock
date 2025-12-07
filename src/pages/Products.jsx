import React, { useEffect, useState } from 'react'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'
import BarcodeScanner from '../components/BarcodeScanner'
import Sidebar from '../components/Sidebar'

import MobileHeader from '../components/MobileHeader'

export default function Products() {
  const [products, setProducts] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '',
    category: '',
    size: '',
    buying_price: '',
    selling_price: '',
    stock_qty: '',
    barcode: '',
    image_url: ''
  })
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => { fetchProducts().then(d => setProducts(d)).catch(() => { }) }, [])

  function openAdd() {
    setEditing(null)
    setForm({
      name: '',
      category: '',
      size: '',
      buying_price: '',
      selling_price: '',
      stock_qty: '',
      barcode: '',
      image_url: ''
    })
    setShowForm(true)
  }

  function handleScan(code) {
    // Convert to string to be safe
    const barcodeStr = String(code || '')

    setShowScanner(false)

    // If form is open (adding/editing), just populate the barcode
    if (showForm) {
      setForm(prev => ({ ...prev, barcode: barcodeStr }))
      return
    }

    // Otherwise, search for existing product
    const existing = products.find(p => p.barcode === barcodeStr)
    if (existing) {
      setQuery(barcodeStr)
      alert(`Product "${existing.name}" already exists.`)
    } else {
      setEditing(null)
      setForm({ name: '', category: '', size: '', buying_price: '', selling_price: '', stock_qty: '', barcode: barcodeStr, image_url: '' })
      setShowForm(true)
    }
  }

  function openEdit(p) {
    if (!p) return

    setEditing(p)
    setForm({
      name: p.name || '',
      category: p.category || '',
      size: p.size || '',
      buying_price: p.buying_price || '',
      selling_price: p.selling_price || '',
      stock_qty: p.stock_qty || '',
      barcode: p.barcode || '',
      image_url: p.image_url || ''
    })
    setShowForm(true)
  }

  async function submitProduct(e) {
    e.preventDefault()

    // Validation
    if (!form.name?.trim()) {
      alert('Please enter a product name')
      return
    }
    if (!form.category) {
      alert('Please select a category')
      return
    }
    if (!form.barcode?.trim()) {
      alert('Please enter a barcode')
      return
    }

    try {
      if (editing) {
        const updated = await updateProduct(editing.id || editing.barcode, form)
        setProducts(prev => prev.map(p => (p.id === updated.id || p.barcode === updated.barcode) ? updated : p))
      } else {
        const created = await createProduct(form)
        setProducts(prev => [...prev, created])
      }
      setShowForm(false)
      setEditing(null)
    } catch (err) {
      console.error(err)
      alert('Failed to save product. Please try again.')
    }
  }

  function onDeleteRequest(p) { setToDelete(p); setConfirmOpen(true) }

  async function confirmDelete() {
    try {
      await deleteProduct(toDelete.id || toDelete.barcode)
      setProducts(prev => prev.filter(x => x.id !== toDelete.id && x.barcode !== toDelete.barcode))
    } catch (err) { console.error(err) }
    setConfirmOpen(false)
    setToDelete(null)
  }

  const filtered = products.filter(p =>
    (p.name?.toLowerCase().includes(query.toLowerCase()) || p.barcode?.toString().includes(query)) &&
    (categoryFilter === 'All Categories' || p.category === categoryFilter)
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#1c1a16]">
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      <Sidebar
        className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} title="Products" />

        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Product Management</h1>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-6">
              <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#191714] border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <span className="material-symbols-outlined text-zinc-400">search</span>
                <input
                  type="text"
                  placeholder="Search by name or barcode..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="flex-1 lg:flex-none px-4 py-2 bg-white dark:bg-[#191714] border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white outline-none cursor-pointer"
                >
                  <option>All Categories</option>
                  <option>Marble Look</option>
                  <option>Porcelain</option>
                  <option>Ceramic</option>
                  <option>Wood Look</option>
                  <option>Natural Stone</option>
                </select>
                <button
                  onClick={() => setShowScanner(true)}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#191714] border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
                  <span className="whitespace-nowrap">Scan to Add</span>
                </button>
                <button
                  onClick={openAdd}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  <span className="text-lg">+</span>
                  <span className="whitespace-nowrap">Add Product</span>
                </button>
              </div>
            </div>

            {/* Product Table */}
            <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                      <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Product Name</th>
                      <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Category</th>
                      <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Tile Size</th>
                      <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Price</th>
                      <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Stock Count</th>
                      <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Barcode</th>
                      <th className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map(p => (
                      <tr key={p.id || p.barcode} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white whitespace-nowrap">{p.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white whitespace-nowrap">{p.category || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{p.size || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white whitespace-nowrap">${p.selling_price || '0.00'} / sq ft</td>
                        <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white whitespace-nowrap">{p.stock_qty || 0}</td>
                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{p.barcode || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEdit(p)}
                              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                            >
                              <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400 text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => onDeleteRequest(p)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${page === currentPage
                      ? 'bg-primary text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#191714] rounded-xl max-w-2xl w-full p-6 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">{editing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={submitProduct} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Name *</label>
                <input className="auth-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Category *</label>
                <select
                  className="auth-input"
                  required
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  <option value="Marble Look">Marble Look</option>
                  <option value="Wood Look">Wood Look</option>
                  <option value="Concrete Look">Concrete Look</option>
                  <option value="Stone Look">Stone Look</option>
                  <option value="Granite Look">Granite Look</option>
                  <option value="Decorative">Decorative</option>
                  <option value="Solid Color">Solid Color</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">Size (e.g., 24×24)</label>
                <input
                  className="auth-input"
                  placeholder="e.g., 24×24 or 12×24"
                  value={form.size}
                  onChange={e => setForm({ ...form, size: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">Buying Price</label>
                <input type="number" step="0.01" className="auth-input" value={form.buying_price} onChange={e => setForm({ ...form, buying_price: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">Selling Price</label>
                <input type="number" step="0.01" className="auth-input" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">Stock Quantity</label>
                <input type="number" className="auth-input" value={form.stock_qty} onChange={e => setForm({ ...form, stock_qty: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Barcode *</label>
                <div className="flex gap-2">
                  <input
                    className="auth-input flex-1"
                    required
                    value={form.barcode}
                    onChange={e => setForm({ ...form, barcode: e.target.value })}
                    placeholder="Enter or scan barcode"
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
                    Scan
                  </button>
                </div>
              </div>

              <div className="col-span-2 flex gap-3 mt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">Save Product</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmOpen} title="Delete product" message={`Delete ${toDelete?.name || ''}?`} onCancel={() => setConfirmOpen(false)} onConfirm={confirmDelete} />
    </div>
  )
}
