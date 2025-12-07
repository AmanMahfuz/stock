import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, fetchProducts, fetchCategories } from '../services/api'
import UserSidebar from '../components/UserSidebar'

import MobileHeader from '../components/MobileHeader'

export default function Catalog() {
    const navigate = useNavigate()
    const user = getCurrentUser()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')

    const [categories, setCategories] = useState([])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            const [pData, cData] = await Promise.all([
                fetchProducts(),
                fetchCategories()
            ])
            setProducts(pData)
            setCategories(['all', ...cData.map(c => c.name)])
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-[#1c1a16]">
            <UserSidebar
                className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
                onClose={() => setMobileMenuOpen(false)}
                isOpen={mobileMenuOpen}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} title="Catalog" />

                <main className="flex-1 p-4 lg:p-8 pb-24">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Product Catalog</h1>
                            <p className="text-zinc-500 dark:text-zinc-400">Browse all available products in the warehouse</p>
                        </div>

                        {/* Filters */}
                        <div className="bg-white dark:bg-[#191714] rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                {/* Category Filter */}
                                <select
                                    value={categoryFilter}
                                    onChange={e => setCategoryFilter(e.target.value)}
                                    className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat === 'all' ? 'All Categories' : cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Products Grid */}
                        {loading ? (
                            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                                Loading products...
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProducts.map(product => (
                                    <div
                                        key={product.id}
                                        className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-shadow"
                                    >
                                        {/* Product Info */}
                                        <div className="p-4">
                                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                                                {product.name}
                                            </h3>

                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                                    {product.category || 'Uncategorized'}
                                                </span>
                                                <span className={`text-sm font-medium ${product.stock_qty > 10
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : product.stock_qty > 0
                                                        ? 'text-yellow-600 dark:text-yellow-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {product.stock_qty > 0 ? `${product.stock_qty} in stock` : 'Out of stock'}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-3 mt-4">
                                                {product.size && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-zinc-500 dark:text-zinc-400">Size:</span>
                                                        <span className="text-zinc-900 dark:text-white font-medium">{product.size}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-500 dark:text-zinc-400">SKU:</span>
                                                    <span className="text-zinc-900 dark:text-white font-mono text-xs">{product.barcode}</span>
                                                </div>

                                                <button
                                                    onClick={() => navigate('/transfer', { state: { selectedProductId: product.id } })}
                                                    className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg font-medium transition-colors text-sm"
                                                >
                                                    <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                                                    Take Stock
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                                {searchQuery || categoryFilter !== 'all'
                                    ? 'No products found matching your filters'
                                    : 'No products available'}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
