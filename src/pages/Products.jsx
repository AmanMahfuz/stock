import React, { useEffect, useState } from 'react'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'

function ProductRow({p, onEdit, onDelete}){
  return (
    <tr>
      <td><img src={p.image||''} alt="" style={{width:48,height:32,objectFit:'cover'}}/></td>
      <td>{p.name}</td>
      <td>{p.category}</td>
      <td>{p.size}</td>
      <td>{p.stock}</td>
      <td>{p.barcode}</td>
      <td style={{display:'flex',gap:8}}>
        <button className="btn secondary" onClick={()=>onEdit(p)}>Edit</button>
        <button className="btn secondary" onClick={()=>onDelete(p)}>Delete</button>
      </td>
    </tr>
  )
}

export default function Products(){
  const [products,setProducts]=useState([])
  const [showForm,setShowForm]=useState(false)
  const [editing, setEditing] = useState(null)
  const [form,setForm]=useState({name:'',category:'',size:'',purchasePrice:'',sellingPrice:'',stock:'',barcode:'',image:''})
  const [query, setQuery] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  useEffect(()=>{fetchProducts().then(d=>setProducts(d)).catch(()=>{})},[])

  function openAdd(){
    setEditing(null)
    setForm({name:'',category:'',size:'',purchasePrice:'',sellingPrice:'',stock:'',barcode:'',image:''})
    setShowForm(true)
  }

  function onEdit(p){
    setEditing(p)
    setForm({
      name:p.name||'', category:p.category||'', size:p.size||'', purchasePrice:p.purchasePrice||'', sellingPrice:p.sellingPrice||'', stock:p.stock||'', barcode:p.barcode||'', image:p.image||''
    })
    setShowForm(true)
  }

  async function submitProduct(e){
    e.preventDefault()
    try{
      if(editing){
        const updated = await updateProduct(editing.id || editing.barcode, form)
        setProducts(prev=>prev.map(p=> (p.id===updated.id||p.barcode===updated.barcode)?updated:p))
      }else{
        const created = await createProduct(form)
        setProducts(prev=>[...prev,created])
      }
      setShowForm(false)
      setEditing(null)
    }catch(err){console.error(err)}
  }

  function onDeleteRequest(p){ setToDelete(p); setConfirmOpen(true) }

  async function confirmDelete(){
    try{
      await deleteProduct(toDelete.id || toDelete.barcode)
      setProducts(prev=>prev.filter(x=> x.id!==toDelete.id && x.barcode!==toDelete.barcode))
    }catch(err){console.error(err)}
    setConfirmOpen(false)
    setToDelete(null)
  }

  const filtered = products.filter(p=> p.name?.toLowerCase().includes(query.toLowerCase()) || p.barcode?.toString().includes(query))

  return (
    <div>
      <div className="topbar">
        <h2>Products</h2>
        <div>
          <button className="btn" onClick={openAdd}>+ Add New Product</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom:12}}>
          <h3>{editing ? 'Edit Product' : 'Add Product'}</h3>
          <form onSubmit={submitProduct}>
            <div className="form-row"><label>Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div className="form-row"><label>Category</label><input className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} /></div>
            <div className="form-row"><label>Size</label><input className="input" value={form.size} onChange={e=>setForm({...form,size:e.target.value})} /></div>
            <div className="form-row"><label>Purchase Price</label><input className="input" value={form.purchasePrice} onChange={e=>setForm({...form,purchasePrice:e.target.value})} /></div>
            <div className="form-row"><label>Selling Price</label><input className="input" value={form.sellingPrice} onChange={e=>setForm({...form,sellingPrice:e.target.value})} /></div>
            <div className="form-row"><label>Initial Stock</label><input className="input" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} /></div>
            <div className="form-row"><label>Barcode</label><input className="input" value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})} /></div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn">Save Product</button>
              <button type="button" className="btn secondary" onClick={()=>{setShowForm(false); setEditing(null)}}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <input placeholder="Search" className="input" style={{marginBottom:8}} value={query} onChange={e=>setQuery(e.target.value)} />
        <table className="table">
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Size</th><th>Stock</th><th>Barcode</th><th></th></tr></thead>
          <tbody>
            {filtered.map(p=> <ProductRow key={p.id||p.barcode} p={p} onEdit={onEdit} onDelete={onDeleteRequest} />)}
          </tbody>
        </table>
      </div>

      <ConfirmDialog open={confirmOpen} title="Delete product" message={`Delete ${toDelete?.name || ''}?`} onCancel={()=>setConfirmOpen(false)} onConfirm={confirmDelete} />
    </div>
  )
}
