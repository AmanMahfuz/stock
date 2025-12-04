import React, { useEffect, useState } from 'react'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'
import BarcodeScanner from '../components/BarcodeScanner'
import Sidebar from '../components/Sidebar'

export default function Products() {
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', category: '', size: '', purchasePrice: '', sellingPrice: '', stock: '', barcode: '', image: '', width: '', height: '' })
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
    setForm({ name: '', category: '', size: '', purchasePrice: '', sellingPrice: '', stock: '', barcode: '', image: '', width: '', height: '' })
    setShowForm(true)
  }

  function handleScan(code) {
    setShowScanner(false)
    const existing = products.find(p => p.barcode === code)
    if (existing) {
      setQuery(code)
      alert(`Product "${existing.name}" already exists.`)
    } else {
      setEditing(null)
      setForm({ name: '', category: '', size: '', purchasePrice: '', sellingPrice: '', stock: '', barcode: code, image: '' })
      setShowForm(true)
    }
  }

  function onEdit(p) {
    setEditing(p)
    // Parse size like "24×24" into width and height
    const sizeParts = p.size?.split(/[×x*]/) || []
    const width = sizeParts[0]?.trim() || ''
    const height = sizeParts[1]?.trim() || ''

    setForm({
      name: p.name || '',
      category: p.category || '',
      size: p.size || '',
      purchasePrice: p.purchasePrice || '',
      sellingPrice: p.sellingPrice || '',
      stock: p.stock || '',
      barcode: p.barcode || '',
      image: p.image || '',
      width,
      height
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
    if (!form.width || !form.height) {
      alert('Please enter both width and height for tile size')
      return
    }
    if (!form.barcode?.trim()) {
      alert('Please enter a barcode')
      return
    }

    try {
      // Build size from width and height
      const size = form.width && form.height ? `${form.width}×${form.height}` : form.size

      // Convert * to × in size field
      const formattedForm = {
        ...form,
        size: size ? size.replace(/\*/g, '×') : ''
      }

      if (editing) {
        const updated = await updateProduct(editing.id || editing.barcode, formattedForm)
        setProducts(prev => prev.map(p => (p.id === updated.id || p.barcode === updated.barcode) ? updated : p))
      } else {
        const created = await createProduct(formattedForm)
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

      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Product Management</h1>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center gap-4 mb-6">
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
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-[#191714] border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white outline-none cursor-pointer"
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
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#191714] border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
              Scan to Add
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <span className="text-lg">+</span>
              Add Product
            </button>
          </div>

          {/* Product Table */}
          <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Image</th>
                  <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Product Name</th>
                  <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Category</th>
                  <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Tile Size</th>
                  <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Price</th>
                  <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Stock Count</th>
                  <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Barcode</th>
                  <th className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map(p => (
                  <tr key={p.id || p.barcode} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <img
                        src={p.image || 'https://via.placeholder.com/48'}
                        alt={p.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">{p.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">{p.category || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{p.size || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">${p.sellingPrice || '0.00'} / sq ft</td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">{p.stock || 0}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{p.barcode || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(p)}
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
                  <option value="">Select a category</option>
                  <option value="Marble Look">Marble Look</option>
                  <option value="Porcelain">Porcelain</option>
                  <option value="Ceramic">Ceramic</option>
                  <option value="Wood Look">Wood Look</option>
                  <option value="Natural Stone">Natural Stone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Tile Size *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Width"
                    className="auth-input flex-1"
                    required
                    value={form.width}
                    onChange={e => setForm({ ...form, width: e.target.value })}
                  />
                  <span className="text-zinc-500 dark:text-zinc-400 text-lg font-bold">×</span>
                  <input
                    type="number"
                    placeholder="Height"
                    className="auth-input flex-1"
                    required
                    value={form.height}
                    onChange={e => setForm({ ...form, height: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Purchase Price</label>
                <input type="number" step="0.01" className="auth-input" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Selling Price</label>
                <input type="number" step="0.01" className="auth-input" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Initial Stock</label>
                <input type="number" className="auth-input" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Barcode *</label>
                <input className="auth-input" required value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} />
              </div>

              {/* Image Upload Section */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Product Image</label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {form.image && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-zinc-200 dark:border-zinc-700">
                      <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image: '' })}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="flex gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        <span className="material-symbols-outlined text-lg">upload</span>
                        <span className="text-sm font-medium">Upload Image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setForm({ ...form, image: reader.result })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </label>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 self-center">or</span>
                    <input
                      type="text"
                      placeholder="Enter image URL"
                      className="flex-1 auth-input text-sm"
                      value={form.image?.startsWith('data:') ? '' : form.image}
                      onChange={e => setForm({ ...form, image: e.target.value })}
                    />
                  </div>
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
