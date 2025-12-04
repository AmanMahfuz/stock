import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup, saveUser } from '../services/api'

export default function Signup(){
  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('USER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(e){
    e?.preventDefault()
    setLoading(true); setError('')
    try{
      const data = await signup({ name, identifier, password, role })
      // expect { token, role }
      saveUser({ token: data.token, role: data.role })
      if(data.role === 'ADMIN') navigate('/admin')
      else navigate('/user')
    }catch(err){
      setError(err?.response?.data?.message || 'Signup failed')
    }finally{setLoading(false)}
  }

  return (
    <div style={{maxWidth:480, margin:'24px auto'}}>
      <div className="card">
        <h2>Create Account</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <label className="muted">Full name</label>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="form-row">
            <label className="muted">Mobile / Email</label>
            <input className="input" value={identifier} onChange={e=>setIdentifier(e.target.value)} />
          </div>
          <div className="form-row">
            <label className="muted">Password</label>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div className="form-row">
            <label className="muted">Role</label>
            <select className="select" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="USER">User (Salesman/Worker/Agent)</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {error && <div style={{color:'red'}}>{error}</div>}
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button className="btn" disabled={loading}>{loading? 'Creating...':'Sign up'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
