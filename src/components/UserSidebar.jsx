import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../services/api'

export default function UserSidebar({ className, onClose }) {
    const location = useLocation()
    const navigate = useNavigate()
    const user = getCurrentUser()

    const isActive = (path) => location.pathname === path

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <>
            {/* Backdrop for mobile */}
            {className && className.includes('translate-x-0') && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}
            <aside className={`flex w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#191714] p-4 fixed left-0 top-0 h-screen z-50 transition-transform duration-300 ${className || 'hidden lg:flex'}`}>
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
                    <Link
                        to="/user"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/user')
                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                            }`}
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                    <Link
                        to="/catalog"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/catalog')
                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                            }`}
                    >
                        <span className="material-symbols-outlined">inventory_2</span>
                        <span className="text-sm font-medium">Product Catalog</span>
                    </Link>
                    <Link
                        to="/transfer"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/transfer')
                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                            }`}
                    >
                        <span className="material-symbols-outlined">sync_alt</span>
                        <span className="text-sm font-medium">Job / Sales</span>
                    </Link>
                    <Link
                        to="/return"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/return')
                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                            }`}
                    >
                        <span className="material-symbols-outlined">keyboard_return</span>
                        <span className="text-sm font-medium">Returns</span>
                    </Link>
                    <Link
                        to="/transactions"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/transactions')
                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                            }`}
                    >
                        <span className="material-symbols-outlined">history</span>
                        <span className="text-sm font-medium">Transaction History</span>
                    </Link>
                </nav>

                {/* Footer */}
                <div className="flex flex-col gap-1 mt-auto">
                    <Link
                        to="/profile"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                        <span className="material-symbols-outlined">settings</span>
                        <span className="text-sm font-medium">Settings</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
