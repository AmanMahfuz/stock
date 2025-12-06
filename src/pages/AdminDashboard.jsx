import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchProducts,
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchAllTransactions // Import new function
} from '../services/api'
import BarcodeScanner from '../components/BarcodeScanner'
import Sidebar from '../components/Sidebar'

import MobileHeader from '../components/MobileHeader'

export default function AdminDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // overview, products, categories, activities
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({ totalProducts: 0, totalStock: 0, stockValue: 0, pendingReturns: 0 })

  // Activity / Transaction State
  const [transactions, setTransactions] = useState([])
  const [dateFilter, setDateFilter] = useState('today') // today, yesterday, last7days, custom
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [activitySearch, setActivitySearch] = useState('')

  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(true)

  // Product Form State
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productFormData, setProductFormData] = useState({
    name: '', category: '', size: '', stock_qty: '', selling_price: '', barcode: '', image_url: ''
  })

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  // Load transactions when tab switches to overview (which is default)
  useEffect(() => {
    if (activeTab === 'overview') {
      loadTransactions()
    }
  }, [activeTab])

  async function loadData() {
    setLoading(true)
    try {
      const [pData, cData, sData] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        getDashboardStats()
      ])
      setProducts(pData)
      setCategories(cData)
      setStats(sData)
    } catch (e) {
      console.error("Failed to load data", e)
    } finally {
      setLoading(false)
    }
  }

  async function loadTransactions() {
    try {
      const data = await fetchAllTransactions()
      setTransactions(data)
    } catch (error) {
      console.error("Failed to load transactions", error)
    }
  }

  // --- PRODUCT HANDLERS ---
  async function handleSaveProduct(e) {
    e.preventDefault()
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productFormData)
      } else {
        await createProduct(productFormData)
      }
      setShowProductForm(false)
      setEditingProduct(null)
      setProductFormData({ name: '', category: '', size: '', stock_qty: '', selling_price: '', barcode: '', image_url: '' })
      loadData() // Refresh
      alert('Product Saved!')
    } catch (e) {
      alert('Error saving product: ' + (e.response?.data?.message || e.message))
    }
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm('Delete this product?')) return
    try {
      await deleteProduct(id)
      loadData()
    } catch (e) {
      alert('Error deleting: ' + e.message)
    }
  }

  function openEditProduct(p) {
    setEditingProduct(p)
    setProductFormData({
      name: p.name,
      category: p.category,
      size: p.size,
      stock_qty: p.stock_qty || p.stock || 0,
      selling_price: p.selling_price,
      barcode: p.barcode,
      image_url: p.image_url
    })
    setShowProductForm(true)
  }

  // --- CATEGORY HANDLERS ---
  async function handleAddCategory(e) {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    try {
      await createCategory(newCategoryName)
      setNewCategoryName('')
      loadData()
      alert('Category Added!')
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || e.message))
    }
  }

  async function handleUpdateCategory(id, name) {
    try {
      await updateCategory(id, name)
      setEditingCategory(null)
      loadData()
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || e.message))
    }
  }

  async function handleDeleteCategory(id) {
    if (!window.confirm('Delete this category?')) return
    try {
      await deleteCategory(id)
      loadData()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  // --- HELPER: Date Filter Logic ---
  function getDateRange() {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // start of today

    switch (dateFilter) {
      case 'today':
        return { start: today, end: new Date() }
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayEnd = new Date(yesterday)
        yesterdayEnd.setHours(23, 59, 59, 999)
        return { start: yesterday, end: yesterdayEnd }
      case 'last7days':
        const week = new Date(today)
        week.setDate(week.getDate() - 7)
        return { start: week, end: new Date() }
      case 'last30days':
        const month = new Date(today)
        month.setDate(month.getDate() - 30)
        return { start: month, end: new Date() }
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate)
          start.setHours(0, 0, 0, 0)
          const end = new Date(customEndDate)
          end.setHours(23, 59, 59, 999)
          return { start, end }
        }
        return null
      default:
        return null // All time
    }
  }

  // Filter Transactions
  const filteredTransactions = transactions.filter(t => {
    // 1. Date Filter
    const dateRange = getDateRange()
    if (dateRange) {
      const txDate = new Date(t.created_at)
      if (txDate < dateRange.start || txDate > dateRange.end) return false
    }

    // 2. Search Filter (User, Product, Barcode)
    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase()
      return (
        t.user_name?.toLowerCase().includes(q) ||
        t.product_name?.toLowerCase().includes(q) ||
        t.product_barcode?.toLowerCase().includes(q) ||
        t.customer_name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Calculate Transaction Stats for current view
  const activityStats = {
    totalUsed: filteredTransactions.filter(t => t.type === 'TRANSFER').reduce((s, t) => s + t.quantity, 0),
    totalReturned: filteredTransactions.filter(t => t.type === 'RETURN').reduce((s, t) => s + t.quantity, 0),
    uniqueUsers: new Set(filteredTransactions.map(t => t.user_id)).size
  }

  function handleScan(code) {
    setShowScanner(false)
    // Could Auto-fill product form if open
    if (showProductForm) {
      setProductFormData(prev => ({ ...prev, barcode: code }))
    } else {
      alert(`Scanned: ${code}`)
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#1c1a16]">
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      <Sidebar
        className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} title="Admin Dashboard" />
        <main className="flex-1 p-4 lg:p-8">

          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-1 whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-primary font-bold text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-2 px-1 whitespace-nowrap ${activeTab === 'products' ? 'border-b-2 border-primary font-bold text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`pb-2 px-1 whitespace-nowrap ${activeTab === 'categories' ? 'border-b-2 border-primary font-bold text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              Categories
            </button>
          </div>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* High Level Stats */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white dark:bg-[#191714] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="text-sm text-zinc-500">Total Products</div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.totalProducts.toLocaleString()}</div>
                  <p className="text-green-600 text-sm font-medium leading-normal">+5.2%</p>
                </div>
                <div className="bg-white dark:bg-[#191714] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="text-sm text-zinc-500">Total Stock</div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.totalStock.toLocaleString()}</div>
                  <p className="text-green-600 text-sm font-medium leading-normal">+1.8%</p>
                </div>
                <div className="bg-white dark:bg-[#191714] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="text-sm text-zinc-500">Stock Value</div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">${stats.stockValue.toLocaleString()}</div>
                  <p className="text-green-600 text-sm font-medium leading-normal">+3.1%</p>
                </div>
                <div className="bg-white dark:bg-[#191714] p-6 rounded-xl border-2 border-primary">
                  <div className="text-sm text-zinc-500">Pending Returns</div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.pendingReturns}</div>
                  <p className="text-red-600 text-sm font-medium leading-normal">-0.5%</p>
                </div>
              </div>

              {/* Transaction / Activity Section */}
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Daily Activities & Transactions</h2>

                {/* Controls */}
                <div className="bg-white dark:bg-[#191714] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="last7days">Last 7 Days</option>
                      <option value="last30days">Last 30 Days</option>
                      <option value="all">All Time</option>
                      <option value="custom">Custom Range</option>
                    </select>

                    {dateFilter === 'custom' && (
                      <div className="flex gap-2">
                        <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="input-field py-2" />
                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="input-field py-2" />
                      </div>
                    )}
                  </div>

                  <div className="relative w-full md:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                    <input
                      type="text"
                      placeholder="Search users or products..."
                      value={activitySearch}
                      onChange={e => setActivitySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Summary Cards for Activities */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="text-sm text-zinc-500">Stock Used (Selected Period)</div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white">{activityStats.totalUsed}</div>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="text-sm text-zinc-500">Stock Returned (Selected Period)</div>
                    <div className="text-2xl font-bold text-green-600">{activityStats.totalReturned}</div>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="text-sm text-zinc-500">Active Users</div>
                    <div className="text-2xl font-bold text-blue-600">{activityStats.uniqueUsers}</div>
                  </div>
                </div>

                {/* Transaction Table */}
                <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 uppercase text-xs">
                        <tr>
                          <th className="px-6 py-3 whitespace-nowrap">Time</th>
                          <th className="px-6 py-3 whitespace-nowrap">User</th>
                          <th className="px-6 py-3 whitespace-nowrap">Action</th>
                          <th className="px-6 py-3 whitespace-nowrap">Product</th>
                          <th className="px-6 py-3 whitespace-nowrap text-center">Qty</th>
                          <th className="px-6 py-3 whitespace-nowrap">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">No activity found in this period</td>
                          </tr>
                        ) : (
                          filteredTransactions.map(t => (
                            <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                                {new Date(t.created_at).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-900 dark:text-white">
                                {t.user_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'RETURN'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : t.type === 'RECEIVE'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                  }`}>
                                  {t.type === 'TRANSFER' ? 'USED / SENT' : t.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-zinc-900 dark:text-white">
                                <div>{t.product_name}</div>
                                <div className="text-xs text-zinc-500">{t.product_barcode}</div>
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-zinc-900 dark:text-white">
                                {t.quantity}
                              </td>
                              <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs">
                                {t.customer_name || '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Add Category */}
              <div className="bg-white dark:bg-[#191714] p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-fit shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-9xl text-primary transform rotate-12">category</span>
                </div>

                <div className="relative z-10">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                      <span className="material-symbols-outlined text-2xl">add_circle</span>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Create New Category</h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Organize your inventory by adding new product categories.</p>
                    </div>

                    <form onSubmit={handleAddCategory} className="space-y-4 mt-6">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2 tracking-wider">Category Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Marble Tiles"
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all focus:border-primary"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!newCategoryName.trim()}
                        className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Create Category
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Category List */}
              <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <h3 className="font-bold text-zinc-900 dark:text-white">Existing Categories</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-6 py-4">Category Name</th>
                        <th className="px-6 py-4 text-right w-40">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      {categories.map(c => (
                        <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                          <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                            {editingCategory?.id === c.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  autoFocus
                                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-primary rounded-lg outline-none text-sm shadow-sm"
                                  value={editingCategory.name}
                                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                  onBlur={() => handleUpdateCategory(c.id, editingCategory.name)}
                                  onKeyDown={e => e.key === 'Enter' && handleUpdateCategory(c.id, editingCategory.name)}
                                />
                                <span className="text-xs text-zinc-400 whitespace-nowrap hidden sm:inline">Press Enter to save</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                  <span className="material-symbols-outlined text-sm">category</span>
                                </div>
                                <span>{c.name}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {editingCategory?.id === c.id ? (
                                <button
                                  onClick={() => handleUpdateCategory(c.id, editingCategory.name)}
                                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                  title="Save"
                                >
                                  <span className="material-symbols-outlined text-lg">check</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingCategory(c)}
                                    className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
                                    title="Edit"
                                  >
                                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(c.id)}
                                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                                    title="Delete"
                                  >
                                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {categories.length === 0 && (
                    <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">toc</span>
                      <p>No categories found. Create your first one above!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div>
              <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Product Inventory</h2>
                <div className="flex flex-col md:flex-row gap-2">
                  <select
                    className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-sm text-zinc-900 dark:text-white"
                    value={selectedCategoryFilter}
                    onChange={e => setSelectedCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      setEditingProduct(null)
                      setProductFormData({ name: '', category: '', size: '', stock_qty: '', selling_price: '', barcode: '', image_url: '' })
                      setShowProductForm(!showProductForm)
                    }}
                    className="w-full md:w-auto px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                  >
                    {showProductForm ? 'Cancel' : 'Add Product'}
                  </button>
                </div>
              </div>

              {showProductForm && (
                <div className="bg-white dark:bg-[#191714] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6 animate-in slide-in-from-top-4">
                  <h3 className="font-bold mb-4 dark:text-white">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                  <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="input-field" placeholder="Product Name" required value={productFormData.name} onChange={e => setProductFormData({ ...productFormData, name: e.target.value })} />

                    {/* Category Dropdown */}
                    <select
                      className="input-field"
                      required
                      value={productFormData.category}
                      onChange={e => setProductFormData({ ...productFormData, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>

                    <input className="input-field" placeholder="Size" value={productFormData.size} onChange={e => setProductFormData({ ...productFormData, size: e.target.value })} />
                    <input className="input-field" type="number" placeholder="Stock Qty" required value={productFormData.stock_qty} onChange={e => setProductFormData({ ...productFormData, stock_qty: e.target.value })} />
                    <input className="input-field" type="number" placeholder="Price" required value={productFormData.selling_price} onChange={e => setProductFormData({ ...productFormData, selling_price: e.target.value })} />

                    <div className="flex gap-2">
                      <input className="input-field flex-1" placeholder="Barcode" required value={productFormData.barcode} onChange={e => setProductFormData({ ...productFormData, barcode: e.target.value })} />
                      <button type="button" onClick={() => setShowScanner(true)} className="px-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg"><span className="material-symbols-outlined">qr_code_scanner</span></button>
                    </div>

                    <div className="md:col-span-2"></div> { /* spacer if needed or just remove */}

                    <button type="submit" className="md:col-span-2 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90">Save Product</button>
                  </form>
                </div>
              )}

              {/* Product Table */}
              <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 uppercase text-xs">
                      <tr>
                        <th className="px-6 py-3 min-w-[200px]">Product</th>
                        <th className="px-6 py-3 whitespace-nowrap">Category</th>
                        <th className="px-6 py-3 whitespace-nowrap">Stock</th>
                        <th className="px-6 py-3 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products
                        .filter(p => !selectedCategoryFilter || p.category === selectedCategoryFilter)
                        .map(p => (
                          <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                            <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                              {p.name} <br /> <span className="text-zinc-500 font-normal text-xs">{p.barcode}</span>
                            </td>
                            <td className="px-6 py-4 dark:text-zinc-300 whitespace-nowrap">{p.category}</td>
                            <td className="px-6 py-4 dark:text-zinc-300 whitespace-nowrap">{p.stock_qty || p.stock}</td>
                            <td className="px-6 py-4 text-right gap-2 whitespace-nowrap">
                              <button onClick={() => openEditProduct(p)} className="text-blue-600 hover:text-blue-500 mr-3">Edit</button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:text-red-500">Delete</button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: var(--bg-zinc-50);
          border: 1px solid var(--border-zinc-200);
          border-radius: 0.5rem;
          outline: none;
        }
        .dark .input-field {
           background-color: #27272a;
           border-color: #3f3f46;
           color: white;
        }
      `}</style>
    </div>
  )
}
