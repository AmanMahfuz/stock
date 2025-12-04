import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts, getDashboardStats } from '../services/api'
import BarcodeScanner from '../components/BarcodeScanner'
import Sidebar from '../components/Sidebar'

export default function AdminDashboard() {
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({ totalProducts: 0, totalStock: 0, stockValue: 0, pendingReturns: 0 })
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    let mounted = true;
    fetchProducts().then(d => mounted && setProducts(d)).catch(() => { });
    return () => mounted = false
  }, [])

  useEffect(() => {
    let mounted = true;
    getDashboardStats().then(d => mounted && setStats(d)).catch(() => { });
    return () => mounted = false
  }, [])

  function handleScan(code) {
    setShowScanner(false)
    alert(`Scanned Code: ${code}`)
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden font-display">
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      <div className="flex min-h-screen">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-8 ml-64">
          <div className="mx-auto max-w-7xl">
            {/* PageHeading */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <p className="text-zinc-900 dark:text-zinc-50 text-3xl font-bold leading-tight tracking-tight">Admin Dashboard</p>
                <p className="text-zinc-500 dark:text-zinc-400 text-base font-normal leading-normal">Welcome back, here is an overview of your warehouse inventory.</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#191714] border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-600 dark:text-zinc-400 text-base font-medium leading-normal">Total Products</p>
                <p className="text-zinc-900 dark:text-zinc-100 tracking-tight text-3xl font-bold leading-tight">{stats.totalProducts.toLocaleString()}</p>
                <p className="text-green-600 text-sm font-medium leading-normal">+5.2%</p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#191714] border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-600 dark:text-zinc-400 text-base font-medium leading-normal">Total Stock Count</p>
                <p className="text-zinc-900 dark:text-zinc-100 tracking-tight text-3xl font-bold leading-tight">{stats.totalStock.toLocaleString()}</p>
                <p className="text-green-600 text-sm font-medium leading-normal">+1.8%</p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#191714] border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-600 dark:text-zinc-400 text-base font-medium leading-normal">Total Stock Value</p>
                <p className="text-zinc-900 dark:text-zinc-100 tracking-tight text-3xl font-bold leading-tight">${stats.stockValue.toLocaleString()}</p>
                <p className="text-green-600 text-sm font-medium leading-normal">+3.1%</p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#191714] border-2 border-primary">
                <p className="text-zinc-600 dark:text-zinc-400 text-base font-medium leading-normal">Pending Returns</p>
                <p className="text-zinc-900 dark:text-zinc-100 tracking-tight text-3xl font-bold leading-tight">{stats.pendingReturns}</p>
                <p className="text-red-600 text-sm font-medium leading-normal">-0.5%</p>
              </div>
            </div>

            {/* Actions & Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex flex-1 gap-3 flex-wrap justify-start w-full md:w-auto">
                <button onClick={() => setShowScanner(true)} className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-11 px-5 bg-primary text-zinc-900 text-sm font-bold leading-normal tracking-wide hover:bg-primary/90 transition-colors">
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                  <span className="truncate">Scan Barcode</span>
                </button>
                <button className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-11 px-5 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-bold leading-normal tracking-wide relative hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                  <span className="material-symbols-outlined">warning</span>
                  <span className="truncate">Low Stock Alerts</span>
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">3</span>
                </button>
              </div>
              <div className="w-full md:w-auto md:max-w-xs flex-1">
                <label className="flex flex-col min-w-40 h-11 w-full">
                  <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                    <div className="text-zinc-500 dark:text-zinc-400 flex bg-zinc-100 dark:bg-zinc-800 items-center justify-center pl-4 rounded-l-lg">
                      <span className="material-symbols-outlined">search</span>
                    </div>
                    <input className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-zinc-900 dark:text-zinc-100 focus:outline-0 focus:ring-0 border-none bg-zinc-100 dark:bg-zinc-800 h-full placeholder:text-zinc-500 dark:placeholder:text-zinc-400 px-4 text-sm font-normal leading-normal" placeholder="Search by Product Name or SKU..." />
                  </div>
                </label>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-[#191714] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400">
                  <thead className="text-xs text-zinc-700 dark:text-zinc-300 uppercase bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-6 py-3" scope="col">Product Name</th>
                      <th className="px-6 py-3" scope="col">SKU / Barcode</th>
                      <th className="px-6 py-3 text-center" scope="col">Stock Count</th>
                      <th className="px-6 py-3" scope="col">Category</th>
                      <th className="px-6 py-3 text-center" scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 5).map((p, i) => (
                      <tr key={p.id} className="bg-white dark:bg-[#191714] border-b dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <th className="px-6 py-4 font-medium text-zinc-900 dark:text-white whitespace-nowrap" scope="row">{p.name}</th>
                        <td className="px-6 py-4">{p.barcode}</td>
                        <td className="px-6 py-4 text-center">{p.stock}</td>
                        <td className="px-6 py-4">{p.category}</td>
                        <td className="px-6 py-4 text-center">
                          {p.stock > 10 ? (
                            <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-full">In Stock</span>
                          ) : p.stock > 0 ? (
                            <span className="px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 dark:bg-orange-900 dark:text-orange-300 rounded-full">Low Stock</span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-full">Out of Stock</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center">No products found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
