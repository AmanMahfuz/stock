import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../services/api'
import Sidebar from '../components/Sidebar'
import UserSidebar from '../components/UserSidebar'

export default function Profile() {
    const navigate = useNavigate()
    const user = getCurrentUser()

    function handleLogout() {
        logout()
        navigate('/login')
    }

    if (!user) {
        navigate('/login')
        return null
    }

    const isAdmin = user?.role === 'ADMIN'

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-[#1c1a16]">
            {/* Conditional Sidebar */}
            {isAdmin ? <Sidebar /> : <UserSidebar />}

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 flex items-center justify-center">
                <div className="w-full max-w-2xl">
                    {/* My Profile Heading */}
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-12 text-center">
                        My Profile
                    </h1>

                    {/* Profile Card */}
                    <div className="bg-white dark:bg-[#191714] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 shadow-sm">
                        {/* Avatar */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#D4A574] to-[#C89968] flex items-center justify-center text-white text-5xl font-bold mb-4 shadow-lg">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
                                {user.name || 'User'}
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                {user.role === 'ADMIN' ? 'Administrator' : 'Sales Staff'}
                            </p>
                        </div>

                        {/* Profile Details */}
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-6 mb-8 space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-zinc-200 dark:border-zinc-800">
                                <span className="text-zinc-500 dark:text-zinc-400">Full Name</span>
                                <span className="font-medium text-zinc-900 dark:text-white">{user.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-zinc-200 dark:border-zinc-800">
                                <span className="text-zinc-500 dark:text-zinc-400">Role</span>
                                <span className="font-medium text-zinc-900 dark:text-white">
                                    {user.role === 'ADMIN' ? 'Administrator' : 'Sales Staff'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-zinc-500 dark:text-zinc-400">User ID</span>
                                <span className="font-medium text-zinc-900 dark:text-white font-mono">
                                    SF-{String(user.id).padStart(7, '0')}
                                </span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full py-4 bg-[#C89968] hover:bg-[#B88858] text-white rounded-xl font-bold text-lg transition-colors shadow-md"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}
