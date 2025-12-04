import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout, getUserTransactions } from '../services/api'

export default function Transactions() {
    const navigate = useNavigate()
    const user = getCurrentUser()
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

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-[#1c1a16]">
            {/* Sidebar */}
            <aside className="flex w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#191714] p-4 fixed left-0 top-0 h-screen">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-primary rounded-lg"></div>
                    <h1 className="text-lg font-bold text-zinc-900 dark:text-white">SMART FLOOR</h1>
                </div>

                <div className="flex items-center gap-3 mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">{user?.name || 'User'}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{user?.role || 'Sales Staff'}</div>
                    </div>
                </div>

                <nav className="flex flex-col gap-2 flex-grow">
                    <button
                        onClick={() => navigate('/user')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-sm font-medium">Dashboard</span>
                    </button>
                    <button
                        onClick={() => navigate('/transfer')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                        <span className="material-symbols-outlined">sync_alt</span>
                        <span className="text-sm font-medium">Transfer to Customer</span>
                    </button>
                    <button
                        onClick={() => navigate('/return')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                        <span className="material-symbols-outlined">keyboard_return</span>
                        <span className="text-sm font-medium">Returns</span>
                    </button>
                    <button className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                        <span className="material-symbols-outlined fill">history</span>
                        <span className="text-sm font-medium">Transaction History</span>
                    </button>
                </nav>

                <div className="flex flex-col gap-1 mt-auto">
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                        <span className="material-symbols-outlined">settings</span>
                        <span className="text-sm font-medium">Settings</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
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
                        {loading ? (
                            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                                Loading transactions...
                            </div>
                        ) : filteredTransactions.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                        <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Date & Time</th>
                                        <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Product</th>
                                        <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Type</th>
                                        <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Quantity</th>
                                        <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Customer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map(tx => (
                                        <tr key={tx.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                                            <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">
                                                {new Date(tx.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-zinc-900 dark:text-white">{tx.product_name}</div>
                                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{tx.product_barcode}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tx.type === 'TRANSFER'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    }`}>
                                                    {tx.type === 'TRANSFER' ? '→ Transfer' : '← Return'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">{tx.quantity}</td>
                                            <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
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
            </main>
        </div>
    )
}
