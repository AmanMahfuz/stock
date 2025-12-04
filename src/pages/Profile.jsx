import React from 'react'
import { getCurrentUser, logout } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
    const user = getCurrentUser()
    const navigate = useNavigate()

    function doLogout() {
        logout()
        navigate('/login')
    }

    if (!user) return <div>Loading...</div>

    return (
        <div>
            <div className="topbar">
                <h2>My Profile</h2>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                        {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h3 style={{ marginBottom: 4 }}>{user.name}</h3>
                        <div style={{ color: 'var(--text-muted)' }}>{user.role}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>ID: {user.id || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Account Actions</h3>
                <button className="btn secondary" style={{ width: '100%', justifyContent: 'center', color: '#ef4444', borderColor: '#ef4444' }} onClick={doLogout}>
                    Log Out
                </button>
            </div>
        </div>
    )
}
