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

    const [dateFilter, setDateFilter] = useState('today')
    const [customStartDate, setCustomStartDate] = useState('')
    const [customEndDate, setCustomEndDate] = useState('')

    useEffect(() => {
        const { start, end } = getDateRange()
        loadTransactions(start, end)
    }, [dateFilter, customStartDate, customEndDate])

    async function loadTransactions(start, end) {
        // Avoid double fetching if custom dates aren't ready
        if (dateFilter === 'custom' && (!start || !end)) return

        try {
            setLoading(true)
            const dateStart = start ? start.toISOString() : null
            const dateEnd = end ? end.toISOString() : null

            const data = await getUserTransactions(dateStart, dateEnd)
            setTransactions(data)
        } catch (error) {
            console.error('Failed to load transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    function getDateRange() {
        const today = new Date()
        today.setHours(0, 0, 0, 0) // start of today

        // Always use End of Today as the default end point to include current day transactions
        const endOfToday = new Date(today)
        endOfToday.setHours(23, 59, 59, 999)

        switch (dateFilter) {
            case 'today':
                return { start: today, end: endOfToday }
            case 'yesterday':
                const yesterday = new Date(today)
                yesterday.setDate(yesterday.getDate() - 1)
                const yesterdayEnd = new Date(yesterday)
                yesterdayEnd.setHours(23, 59, 59, 999)
                return { start: yesterday, end: yesterdayEnd }
            case 'last7days':
                const week = new Date(today)
                week.setDate(week.getDate() - 7)
                return { start: week, end: endOfToday }
            case 'last30days':
                const month = new Date(today)
                month.setDate(month.getDate() - 30)
                return { start: month, end: endOfToday }
            case 'custom':
                if (!customStartDate || !customEndDate) return { start: null, end: null }
                return {
                    start: new Date(customStartDate),
                    end: new Date(new Date(customEndDate).setHours(23, 59, 59, 999))
                }
            case 'all':
            default:
                return { start: null, end: null }
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
                isOpen={mobileMenuOpen}
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

                        {/* Date Filter & Search */}
                        <div className="mb-6 space-y-4">
                            {/* Date Filter Bar */}
                            <div className="bg-white dark:bg-[#191714] rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Period:</label>
                                        <select
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                            className="flex-1 md:flex-none px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 min-w-[200px]"
                                        >
                                            <option value="today">Today</option>
                                            <option value="yesterday">Yesterday</option>
                                            <option value="last7days">Last 7 Days</option>
                                            <option value="last30days">Last 30 Days</option>
                                            <option value="all">All Time</option>
                                            <option value="custom">Custom Range</option>
                                        </select>
                                    </div>

                                    {dateFilter === 'custom' && (
                                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-zinc-600 dark:text-zinc-400">From:</label>
                                                <input
                                                    type="date"
                                                    value={customStartDate}
                                                    onChange={e => setCustomStartDate(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-zinc-600 dark:text-zinc-400">To:</label>
                                                <input
                                                    type="date"
                                                    value={customEndDate}
                                                    onChange={e => setCustomEndDate(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

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
