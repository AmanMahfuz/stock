import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login, saveUser } from '../services/api'

export default function Login(){
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(e){
    e?.preventDefault()
    setLoading(true); setError('')
    try{
      const data = await login({ identifier, password })
      // expect response: { token, role }
      saveUser({ token: data.token, role: data.role })
      if(data.role === 'ADMIN') navigate('/admin')
      else navigate('/user')
    }catch(err){
      setError(err?.response?.data?.message || 'Login failed')
    }finally{setLoading(false)}
  }

  return (
    <div style={{maxWidth:420, margin:'24px auto'}}>
      <div className="card">
        <h2>Login</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <label className="muted">Mobile / Email</label>
            <input className="input" value={identifier} onChange={e=>setIdentifier(e.target.value)} />
          </div>
          <div className="form-row">
            <label className="muted">Password</label>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          {error && <div style={{color:'red'}}>{error}</div>}
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button className="btn" disabled={loading}>{loading? 'Logging...':'Login'}</button>
            <button type="button" className="btn secondary">Forgot Password</button>
          </div>
        </form>
        <div style={{marginTop:12}}>
          <span className="muted">Don't have an account?</span>
          <Link to="/signup" style={{marginLeft:8}}> Sign up</Link>
        </div>
      </div>
    </div>
  )
}
