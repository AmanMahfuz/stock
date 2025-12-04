const express = require('express')
const cors = require('cors')
const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// In-memory data stores
let users = []
let products = [
  { id: 1, name: 'Sample Tile A', category: 'Ceramic', size: '30x30', stock: 100, barcode: '100001', price: 50 }
]
let transfers = []
let returns = []

function makeToken() { return Math.random().toString(36).slice(2) }

app.post('/api/signup', (req, res) => {
  const { name, identifier, password, role } = req.body
  if (!identifier || !password) return res.status(400).json({ message: 'identifier and password required' })
  if (users.find(u => u.identifier === identifier)) return res.status(409).json({ message: 'User exists' })
  const user = { id: users.length + 1, name, identifier, password, role: role || 'USER', token: makeToken(), stock: {} }
  users.push(user)
  return res.json({ token: user.token, role: user.role })
})

app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body
  const user = users.find(u => u.identifier === identifier && u.password === password)
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })
  // refresh token
  user.token = makeToken()
  return res.json({ token: user.token, role: user.role, id: user.id, name: user.name })
})

app.get('/api/users', (req, res) => {
  return res.json(users.map(u => ({ id: u.id, name: u.name, role: u.role })))
})

app.get('/api/products', (req, res) => {
  return res.json(products)
})

app.get('/api/stats', (req, res) => {
  const totalProducts = products.length
  const totalStock = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0)
  const lowStockCount = products.filter(p => (Number(p.stock) || 0) < 10).length
  const stockValue = products.reduce((acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.price) || 0)), 0)

  return res.json({
    totalProducts,
    totalStock,
    lowStockCount,
    stockValue,
    pendingReturns: returns.filter(r => r.status === 'PENDING').length,
    recentTransactions: transfers.length + returns.length
  })
})

app.get('/api/user-stats', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  const user = users.find(u => u.token === token)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })

  const userStock = user.stock || {}
  const totalItems = Object.values(userStock).reduce((a, b) => a + b, 0)
  const pendingReturns = returns.filter(r => r.userId === user.id && r.status === 'PENDING').length

  return res.json({
    productsTaken: totalItems,
    pendingReturns,
    balanceToReturn: totalItems // Simplified logic
  })
})

app.post('/api/transfers', (req, res) => {
  const { toUserId, items } = req.body // items: [{ productId, qty }]
  const token = req.headers.authorization?.split(' ')[1]
  const fromUser = users.find(u => u.token === token)

  // If admin, deduct from main stock. If user, deduct from their stock.
  const isAdmin = !fromUser || fromUser.role === 'ADMIN' // Simplified admin check

  const toUser = users.find(u => u.id === Number(toUserId))
  if (!toUser) return res.status(404).json({ message: 'Recipient not found' })

  items.forEach(item => {
    const p = products.find(prod => prod.id === item.productId)
    if (p) {
      if (isAdmin) {
        p.stock = Math.max(0, (p.stock || 0) - item.qty)
      } else if (fromUser) {
        fromUser.stock = fromUser.stock || {}
        fromUser.stock[item.productId] = Math.max(0, (fromUser.stock[item.productId] || 0) - item.qty)
      }

      toUser.stock = toUser.stock || {}
      toUser.stock[item.productId] = (toUser.stock[item.productId] || 0) + item.qty
    }
  })

  transfers.push({
    id: transfers.length + 1,
    from: fromUser ? fromUser.id : 'ADMIN',
    to: toUser.id,
    items,
    date: new Date()
  })

  return res.json({ success: true })
})

app.post('/api/returns', (req, res) => {
  const { items } = req.body
  const token = req.headers.authorization?.split(' ')[1]
  const user = users.find(u => u.token === token)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })

  items.forEach(item => {
    user.stock = user.stock || {}
    user.stock[item.productId] = Math.max(0, (user.stock[item.productId] || 0) - item.qty)

    // Return to main stock immediately for simplicity, or mark as pending
    const p = products.find(prod => prod.id === item.productId)
    if (p) p.stock = (p.stock || 0) + item.qty
  })

  returns.push({
    id: returns.length + 1,
    userId: user.id,
    items,
    status: 'COMPLETED', // Auto-complete for now
    date: new Date()
  })

  return res.json({ success: true })
})

app.post('/api/products', (req, res) => {
  const p = req.body
  const id = products.length ? Math.max(...products.map(x => x.id)) + 1 : 1
  const created = { id, ...p }
  products.push(created)
  return res.json(created)
})

app.put('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const idx = products.findIndex(p => p.id === id || p.id == req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Not found' })
  products[idx] = { ...products[idx], ...req.body }
  return res.json(products[idx])
})

app.delete('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const idx = products.findIndex(p => p.id === id || p.id == req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Not found' })
  const removed = products.splice(idx, 1)[0]
  return res.json({ success: true, removed })
})

app.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`)
})
