import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../services/api'

export default function Sidebar({ className, onClose, isOpen }) {
    const location = useLocation()
    const navigate = useNavigate()

    function handleLogout() {
        logout()
        navigate('/login')
    }

    const navItems = [
        { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
        { path: '/products', icon: 'inventory_2', label: 'Product Management' },
        { path: '/transfer', icon: 'sync_alt', label: 'Transfers' },
        { path: '/return', icon: 'keyboard_return', label: 'Return Stock' },
        { path: '/reports', icon: 'assessment', label: 'Reports' },
    ]

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}
            <aside className={`flex w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#191714] p-4 fixed left-0 top-0 h-screen z-50 transition-transform duration-300 ${className || 'hidden lg:flex'}`}>
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                    <img src="/smart-florring-logo-main.png" alt="Smart Floor" className="w-8 h-8 object-contain" />
                    <h1 className="text-lg font-bold text-zinc-900 dark:text-white">SMART FLOOR</h1>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-primary/20 flex items-center justify-center text-primary font-bold">
                        AU
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-zinc-900 dark:text-zinc-100 text-base font-medium leading-normal">Admin User</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-normal leading-normal">admin@smartfloor.co</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-2 flex-grow">
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive
                                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                                    }`}
                            >
                                <span className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}>
                                    {item.icon}
                                </span>
                                <p className="text-sm font-medium leading-normal">{item.label}</p>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="flex flex-col gap-1 mt-auto">
                    <Link
                        to="/profile"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                        <span className="material-symbols-outlined">settings</span>
                        <p className="text-sm font-medium leading-normal">Settings</p>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-left"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <p className="text-sm font-medium leading-normal">Logout</p>
                    </button>
                </div>
            </aside>
        </>
    )
}
