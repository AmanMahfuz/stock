import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login, saveUser } from '../services/api'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e?.preventDefault()
    setLoading(true); setError('')
    try {
      const data = await login({ identifier, password })
      saveUser({
        token: data.token,
        role: data.role,
        name: data.name,
        id: data.id
      })
      if (data.role === 'ADMIN') navigate('/admin')
      else navigate('/user')
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-container">
      <div className="flex flex-col items-center w-full max-w-[480px]">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/smart-florring-logo-main.png" alt="Smart Floor" className="h-10" />
          <span className="text-xl font-bold tracking-wide text-zinc-900 dark:text-white">SMART FLOOR</span>
        </div>

        <div className="auth-card">
          {/* Tabs */}
          <div className="flex gap-6 mb-8 border-b border-zinc-100 dark:border-zinc-800">
            <Link to="/login" className="auth-tab active">Log In</Link>
            <Link to="/signup" className="auth-tab inactive">Sign Up</Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Log In to Your Account</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Email</label>
              <input
                className="auth-input"
                placeholder="Enter your email"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Password</label>
              <div className="relative">
                <input
                  className="auth-input pr-10"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex justify-between items-center">
              {/* Placeholder for "Remember me" if needed later */}
              <div></div>
              <button type="button" className="text-primary text-sm font-medium hover:underline">Forgot password?</button>
            </div>

            <button className="auth-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
