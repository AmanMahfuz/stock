import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout, getUserTransactions } from '../services/api'
import UserSidebar from '../components/UserSidebar'

import MobileHeader from '../components/MobileHeader'

export default function Transactions() {
    const navigate = useNavigate()
    const user = getCurrentUser()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadTransactions()
    }, [])

    async function loadTransactions() {
        try {
            const data = await getUserTransactions()
            setTransactions(data)
        } catch (error) {
            console.error('Failed to load transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredTransactions = transactions.filter(t =>
        t.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.product_barcode?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-[#1c1a16]">
            <UserSidebar
                className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
                onClose={() => setMobileMenuOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} title="Transactions" />

                <main className="flex-1 p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Transaction History</h1>
                            <p className="text-zinc-500 dark:text-zinc-400">View all your transfers and returns</p>
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#191714] border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                                        Loading transactions...
                                    </div>
                                ) : filteredTransactions.length > 0 ? (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                                <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Date & Time</th>
                                                <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Product</th>
                                                <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Type</th>
                                                <th className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Quantity</th>
                                                <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Customer</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTransactions.map(tx => (
                                                <tr key={tx.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white whitespace-nowrap">
                                                        {new Date(tx.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="text-sm font-medium text-zinc-900 dark:text-white">{tx.product_name || 'Unknown'}</div>
                                                            <div className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{tx.product_barcode || 'N/A'}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tx.type === 'TRANSFER'
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                            : tx.type === 'RETURN'
                                                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                            }`}>
                                                            {tx.type === 'TRANSFER'
                                                                ? '→ To Customer'
                                                                : tx.type === 'RETURN'
                                                                    ? '↺ Return'
                                                                    : '↓ Received'
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm font-medium text-zinc-900 dark:text-white whitespace-nowrap">{tx.quantity}</td>
                                                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                                        {tx.customer_name || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                                        {searchQuery ? `No transactions found for "${searchQuery}"` : 'No transactions yet'}
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
