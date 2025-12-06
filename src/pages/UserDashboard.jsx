import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout, getUserStats, getUserTransactions } from '../services/api'
import UserSidebar from '../components/UserSidebar'

import MobileHeader from '../components/MobileHeader'

export default function UserDashboard() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ... (keep state)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('today') // all, today, yesterday, last7days, last30days, custom
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [stats, setStats] = useState({
    productsTakenToday: 0,
    currentStockHolding: 0
  })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Fetch user stats
      const statsData = await getUserStats()
      setStats({
        productsTakenToday: statsData.productsTaken || 0,
        currentStockHolding: statsData.balanceToReturn || 0
      })

      // Fetch transaction history
      const transactionData = await getUserTransactions()
      setTransactions(transactionData)

    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getDateRange() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

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
        return null
    }
  }

  // Group transactions by product and sum quantities
  const filteredTransactions = transactions
    .filter(t => {
      // Show "taken from warehouse" transactions (RECEIVE)
      // We exclude 'TRANSFER' (to customer) and 'RETURN' (to warehouse) from this specific table
      // because this table aggregates "Stock Taken".
      if (t.type !== 'RECEIVE') return false

      // Date filter
      const dateRange = getDateRange()
      if (dateRange) {
        const txDate = new Date(t.created_at)
        if (txDate < dateRange.start || txDate > dateRange.end) return false
      }

      // Search filter
      if (searchQuery.trim()) {
        return t.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.product_barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      }

      return true
    })

  // Aggregate by product
  const aggregatedData = filteredTransactions.reduce((acc, t) => {
    const key = t.product_id
    if (!acc[key]) {
      acc[key] = {
        product_id: t.product_id,
        product_name: t.product_name,
        product_barcode: t.product_barcode,
        total_quantity: 0,
        transaction_count: 0
      }
    }
    acc[key].total_quantity += t.quantity
    acc[key].transaction_count += 1
    return acc
  }, {})

  const productSummary = Object.values(aggregatedData)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#1c1a16]">
      <UserSidebar
        className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} title="Dashboard" />

        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                  Welcome, {user?.name?.split(' ')[0] || 'User'}.
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">Here's your stock transfer summary.</p>
              </div>
              <button
                onClick={() => navigate('/transfer')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
              >
                <span className="material-symbols-outlined">add</span>
                Transfer Stock
              </button>
            </div>

            {/* Date Filter Bar */}
            <div className="bg-white dark:bg-[#191714] rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Period:</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="flex-1 md:flex-none px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 min-w-[200px]"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="last7days">Last 7 Days</option>
                    <option value="last30days">Last 30 Days</option>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Unique Products Transferred</div>
                <div className="text-4xl font-bold text-zinc-900 dark:text-white">
                  {loading ? '...' : productSummary.length}
                </div>
              </div>
              <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Total Items Holding</div>
                <div className="text-4xl font-bold text-zinc-900 dark:text-white">
                  {loading ? '...' : stats.currentStockHolding}
                </div>
              </div>
            </div>

            {/* Transfer History */}
            <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Transfer History</h2>
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

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                    Loading transfers...
                  </div>
                ) : productSummary.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Product</th>
                        <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">SKU</th>
                        <th className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Total Qty Taken</th>
                        <th className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productSummary.map(item => (
                        <tr key={item.product_id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-sm text-zinc-900 dark:text-white">{item.product_name || 'Unknown'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{item.product_barcode || 'N/A'}</td>
                          <td className="px-6 py-4 text-center text-sm font-medium text-zinc-900 dark:text-white whitespace-nowrap">{item.total_quantity}</td>
                          <td className="px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{item.transaction_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                    {searchQuery ? `No results for "${searchQuery}"` : dateFilter !== 'all' ? 'No transfers in this period' : 'No transfers yet'}
                  </div>
                )}
              </div>
            </div>

            {/* New Section: Your Returns */}
            <div className="mt-8 bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Your Returns</h2>
              </div>
              <div className="overflow-x-auto">
                {(() => {
                  // Return Filtering Logic (Inline to keep simple)
                  const returns = transactions.filter(t =>
                    t.type === 'RETURN' &&
                    (!searchQuery || t.product_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  )

                  if (loading) return <div className="p-6 text-center text-zinc-500">Loading...</div>
                  if (returns.length === 0) return <div className="p-6 text-center text-zinc-500">No returns found.</div>

                  return (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                          <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Date</th>
                          <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Product</th>
                          <th className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4 whitespace-nowrap">Returned Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returns.map(t => (
                          <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                            <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                              {new Date(t.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-sm text-zinc-900 dark:text-white">{t.product_name}</div>
                              <div className="text-xs text-zinc-500 whitespace-nowrap">{t.product_barcode}</div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                              {t.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                })()}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
