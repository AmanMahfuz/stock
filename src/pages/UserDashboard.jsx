import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout, getUserStats, fetchStaffInventory } from '../services/api'

export default function UserDashboard() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    productsTakenToday: 0,
    currentStockHolding: 0
  })
  const [inventory, setInventory] = useState([])
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

      // Fetch staff inventory
      const data = await fetchStaffInventory(user.id)

      setInventory(data.map(item => ({
        id: item.product_id,
        name: item.product?.name || 'Unknown Product',
        category: item.product?.category || '',
        sku: item.product?.barcode || '',
        quantity: item.quantity,
        dateAcquired: new Date().toISOString().split('T')[0], // Simplified
        image: item.product?.image_url || 'https://via.placeholder.com/48'
      })))
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#1c1a16]">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#191714] p-4 fixed left-0 top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg"></div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white">SMART FLOOR</h1>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-white">{user?.name || 'User'}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{user?.role || 'Sales Staff'}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-grow">
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
            <span className="material-symbols-outlined fill">dashboard</span>
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
          <button
            onClick={() => navigate('/transactions')}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
          >
            <span className="material-symbols-outlined">history</span>
            <span className="text-sm font-medium">Transaction History</span>
          </button>
        </nav>

        {/* Footer Actions */}
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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                Welcome, {user?.name?.split(' ')[0] || 'User'}.
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">Here's your personal stock summary for today.</p>
            </div>
            <button
              onClick={() => navigate('/transfer')}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
            >
              <span className="material-symbols-outlined">add</span>
              Transfer Stock
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Products In Your Inventory</div>
              <div className="text-4xl font-bold text-zinc-900 dark:text-white">
                {loading ? '...' : inventory.length}
              </div>
            </div>
            <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Total Items Holding</div>
              <div className="text-4xl font-bold text-zinc-900 dark:text-white">
                {loading ? '...' : stats.currentStockHolding}
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Your Current Inventory</h2>
              </div>
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
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Product</th>
                    <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">SKU</th>
                    <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase px-6 py-4">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map(item => (
                    <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded object-cover bg-zinc-100 dark:bg-zinc-800"
                          />
                          <div>
                            <div className="font-medium text-sm text-zinc-900 dark:text-white">{item.name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{item.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">{item.sku}</td>
                      <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                {searchQuery ? `No results for "${searchQuery}"` : 'No inventory items yet'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
