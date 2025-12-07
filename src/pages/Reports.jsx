import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import MobileHeader from '../components/MobileHeader'

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const reports = [
    {
      id: 'stock',
      icon: 'inventory_2',
      title: 'Stock Report',
      description: 'View current inventory levels, locations, and status.',
      color: 'bg-amber-500'
    },
    {
      id: 'transfer',
      icon: 'sync_alt',
      title: 'Staff-wise Transfer Report',
      description: 'Track stock transfers initiated by each staff member.',
      color: 'bg-blue-500'
    },
    {
      id: 'return',
      icon: 'keyboard_return',
      title: 'Staff-wise Return Report',
      description: 'Monitor stock returns processed by each staff member.',
      color: 'bg-purple-500'
    },
    {
      id: 'daily',
      icon: 'today',
      title: 'Daily Summary',
      description: 'An overview of all stock movements for a selected day.',
      color: 'bg-green-500'
    },
    {
      id: 'monthly',
      icon: 'calendar_month',
      title: 'Monthly Summary',
      description: 'A high-level report on all stock movements for a selected month.',
      color: 'bg-indigo-500'
    },
    {
      id: 'low-stock',
      icon: 'warning',
      title: 'Low Stock Report',
      description: 'A list of items that have fallen below a predefined threshold.',
      color: 'bg-red-500'
    }
  ]

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#1c1a16]">
      <Sidebar
        className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        onClose={() => setMobileMenuOpen(false)}
        isOpen={mobileMenuOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} title="Reports" />

        <main className="flex-1 p-4 lg:p-8 pb-24">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Reports</h1>
              <p className="text-zinc-500 dark:text-zinc-400">Generate and view stock, transfer, and summary reports.</p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                <input
                  type="text"
                  placeholder="Search for a report"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#191714] border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map(report => (
                <button
                  key={report.id}
                  className="text-left p-6 bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-lg group"
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-white text-2xl">{report.icon}</span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{report.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{report.description}</p>
                </button>
              ))}
            </div>

            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-700 mb-4">search_off</span>
                <p className="text-zinc-500 dark:text-zinc-400">No reports found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
