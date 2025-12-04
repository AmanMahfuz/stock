import React from 'react'

export default function ConfirmDialog({ open, title = 'Confirm', message = '', onCancel = () => {}, onConfirm = () => {} }){
  if(!open) return null
  return (
    <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)'}}>
      <div className="card" style={{maxWidth:420,width:'90%'}}>
        <h3>{title}</h3>
        <div style={{margin:'8px 0'}}>{message}</div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
          <button className="btn secondary" onClick={onCancel}>Cancel</button>
          <button className="btn" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}
