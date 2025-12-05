const express = require('express')
const cors = require('cors')
const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// ========================================
// IN-MEMORY DATA STORES (Localhost Only)
// ========================================

let users = [
  { id: 1, name: 'Admin User', mobile: 'admin', password: 'admin', role: 'ADMIN', created_at: new Date() }
]

let products = [
  {
    id: 1,
    name: 'Calacatta Gold Marble',
    category: 'Marble Look',
    size: '24×24',
    purchase_price: 40,
    selling_price: 50,
    stock_qty: 100,
    barcode: 'CG-PM-1224',
    image_url: 'https://via.placeholder.com/200',
    created_at: new Date()
  }
]

// Admin → User transfers
let transfers = []
let transfer_items = []

// User → Warehouse returns
let returns = []
let return_items = []

// User → Customer transactions (NEW!)
let user_transactions = []

// ========================================
// HELPER FUNCTIONS
// ========================================

function makeToken() {
  return Math.random().toString(36).slice(2)
}

// Calculate staff stock for a specific product
const getStaffStockForProduct = (staffId, productId) => {
  const staffTransfers = transfers.flatMap(t => t.items)
    .filter(i => t => t.toUserId === parseInt(staffId) && i.productId === parseInt(productId))

  // Admin -> User (In)
  const receivedQty = transfers
    .filter(t => t.toUserId === parseInt(staffId))
    .flatMap(t => t.items)
    .filter(i => i.productId === parseInt(productId))
    .reduce((sum, i) => sum + i.qty, 0)

  // User -> Warehouse (Out)
  const returnedQty = returns
    .filter(r => r.userId === parseInt(staffId))
    .flatMap(r => r.items)
    .filter(i => i.productId === parseInt(productId))
    .reduce((sum, i) => sum + i.qty, 0)

  // User -> Customer (Out)
  const soldQty = user_transactions
    .filter(t => t.user_id === parseInt(staffId) && t.product_id === parseInt(productId) && t.type === 'TRANSFER')
    .reduce((sum, t) => sum + t.quantity, 0)

  // Customer -> User (In - Return from Job)
  const jobReturnQty = user_transactions
    .filter(t => t.user_id === parseInt(staffId) && t.product_id === parseInt(productId) && t.type === 'JOB_RETURN')
    .reduce((sum, t) => sum + t.quantity, 0)

  return receivedQty - returnedQty - soldQty + jobReturnQty
}

// Get full inventory for a staff member
function getStaffInventory(staffId) {
  const inventory = {}

  // Get all unique product IDs this staff has received
  transfer_items.forEach(ti => {
    const transfer = transfers.find(t => t.id === ti.transfer_id)
    if (transfer && transfer.staff_id === staffId) {
      if (!inventory[ti.product_id]) {
        inventory[ti.product_id] = 0
      }
      inventory[ti.product_id] += ti.qty
    }
  })

  // Subtract returns
  return_items.forEach(ri => {
    const returnRecord = returns.find(r => r.id === ri.return_id)
    if (returnRecord && returnRecord.staff_id === staffId) {
      if (inventory[ri.product_id]) {
        inventory[ri.product_id] -= ri.qty
      }
    }
  })

  // Subtract user-to-customer transfers
  user_transactions.forEach(ut => {
    if (ut.user_id === staffId && ut.type === 'TRANSFER') {
      if (inventory[ut.product_id]) {
        inventory[ut.product_id] -= ut.quantity
      }
    }
  })

  // Remove products with 0 quantity
  Object.keys(inventory).forEach(productId => {
    if (inventory[productId] <= 0) {
      delete inventory[productId]
    }
  })

  return inventory
}

// ========================================
// AUTH ENDPOINTS
// ========================================

app.post('/api/signup', (req, res) => {
  const { name, mobile, password, role } = req.body
  if (!mobile || !password) return res.status(400).json({ message: 'mobile and password required' })
  if (users.find(u => u.mobile === mobile)) return res.status(409).json({ message: 'User exists' })

  const user = {
    id: users.length + 1,
    name,
    mobile,
    password,
    role: role || 'USER',
    token: makeToken(),
    created_at: new Date()
  }

  users.push(user)
  return res.json({ token: user.token, role: user.role, name: user.name })
})

app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body
  const user = users.find(u => (u.mobile === identifier) && u.password === password)
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })

  // Refresh token
  user.token = makeToken()
  return res.json({ token: user.token, role: user.role, id: user.id, name: user.name })
})

// ========================================
// USER ENDPOINTS
// ========================================

app.get('/api/users', (req, res) => {
  return res.json(users.map(u => ({ id: u.id, name: u.name, role: u.role, mobile: u.mobile })))
})

// ========================================
// PRODUCT ENDPOINTS
// ========================================

app.get('/api/products', (req, res) => {
  return res.json(products)
})

app.post('/api/products', (req, res) => {
  const p = req.body
  const id = products.length ? Math.max(...products.map(x => x.id)) + 1 : 1
  const created = {
    id,
    ...p,
    stock_qty: p.stock || p.stock_qty || 0,
    created_at: new Date()
  }
  products.push(created)
  return res.json(created)
})

app.put('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) return res.status(404).json({ message: 'Not found' })

  products[idx] = { ...products[idx], ...req.body }
  return res.json(products[idx])
})

app.delete('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) return res.status(404).json({ message: 'Not found' })

  const removed = products.splice(idx, 1)[0]
  return res.json({ success: true, removed })
})

// ========================================
// TRANSFER ENDPOINTS (Admin → User)
// ========================================

app.post('/api/transfers', (req, res) => {
  const { toUserId, items } = req.body // items: [{productId, qty}]
  const token = req.headers.authorization?.split(' ')[1]
  const fromUser = users.find(u => u.token === token)

  const toUser = users.find(u => u.id === Number(toUserId))
  if (!toUser) return res.status(404).json({ message: 'Recipient not found' })

  // ✅ VALIDATION: Check if sufficient stock exists before transfer
  for (const item of items) {
    const product = products.find(p => p.id === item.productId)
    if (!product) {
      return res.status(404).json({
        message: `Product with ID ${item.productId} not found`
      })
    }

    if (item.qty > product.stock_qty) {
      return res.status(400).json({
        message: `Insufficient stock for ${product.name}. Available: ${product.stock_qty}, Requested: ${item.qty}`
      })
    }
  }

  // Create transfer record
  const transferId = transfers.length + 1
  transfers.push({
    id: transferId,
    staff_id: toUser.id,
    created_at: new Date()
  })

  // Create transfer items and update stock
  items.forEach(item => {
    const product = products.find(p => p.id === item.productId)
    if (product) {
      // Deduct from warehouse stock
      product.stock_qty = Math.max(0, (product.stock_qty || 0) - item.qty)

      // Add transfer item
      transfer_items.push({
        id: transfer_items.length + 1,
        transfer_id: transferId,
        product_id: item.productId,
        qty: item.qty
      })
    }
  })

  return res.json({ success: true, transferId })
})

// ========================================
// USER TRANSACTION ENDPOINTS (User → Customer)
// ========================================

app.post('/api/user-transactions', (req, res) => {
  const { items, customer_name, type } = req.body // items: [{productId, qty}], type: 'TRANSFER' or 'JOB_RETURN'
  const token = req.headers.authorization?.split(' ')[1]
  const user = users.find(u => u.token === token)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })

  // Validation for TRANSFER (Outbound)
  if (!type || type === 'TRANSFER') {
    for (const item of items) {
      const availableQty = getStaffStockForProduct(user.id, item.productId)
      if (item.qty > availableQty) {
        const product = products.find(p => p.id === item.productId)
        return res.status(400).json({
          message: `Insufficient stock for ${product?.name}. You have ${availableQty}, requested ${item.qty}`
        })
      }
    }
  }

  // Create transactions
  const newTransactions = items.map(item => ({
    id: user_transactions.length + 1 + Math.random(), // simple unique id
    user_id: user.id,
    product_id: item.productId,
    quantity: item.qty,
    type: type || 'TRANSFER',
    customer_name: customer_name || 'Customer',
    created_at: new Date()
  }))

  user_transactions.push(...newTransactions)
  res.json({ success: true, transactions: newTransactions })
})

// Get user transaction history
app.get('/api/user-transactions', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  const user = users.find(u => u.token === token)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })

  const transactions = user_transactions
    .filter(ut => ut.user_id === user.id)
    .map(ut => {
      const product = products.find(p => p.id === ut.product_id)
      return {
        ...ut,
        product_name: product?.name,
        product_barcode: product?.barcode
      }
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return res.json(transactions)
})

// ========================================
// RETURN ENDPOINTS (User → Warehouse)
// ========================================

app.post('/api/returns', (req, res) => {
  const { items } = req.body // items: [{productId, qty}]
  const token = req.headers.authorization?.split(' ')[1]
  const user = users.find(u => u.token === token)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })

  // ✅ VALIDATION: Check if staff has sufficient stock to return
  for (const item of items) {
    const availableToReturn = getStaffStockForProduct(user.id, item.productId)

    if (item.qty > availableToReturn) {
      const product = products.find(p => p.id === item.productId)
      return res.status(400).json({
        message: `Cannot return ${item.qty} of ${product?.name || 'this product'}. You only have ${availableToReturn} available.`
      })
    }
  }

  // Create return record
  const returnId = returns.length + 1
  returns.push({
    id: returnId,
    staff_id: user.id,
    created_at: new Date()
  })

  // Create return items and update stock
  items.forEach(item => {
    const product = products.find(p => p.id === item.productId)
    if (product) {
      // Add back to warehouse stock
      product.stock_qty = (product.stock_qty || 0) + item.qty

      // Add return item
      return_items.push({
        id: return_items.length + 1,
        return_id: returnId,
        product_id: item.productId,
        qty: item.qty
      })

      // Record in user transactions
      user_transactions.push({
        id: user_transactions.length + 1,
        user_id: user.id,
        product_id: item.productId,
        quantity: item.qty,
        type: 'RETURN',
        created_at: new Date()
      })
    }
  })

  return res.json({ success: true, returnId })
})

// ========================================
// STATS ENDPOINTS
// ========================================

app.get('/api/stats', (req, res) => {
  const totalProducts = products.length
  const totalStock = products.reduce((acc, p) => acc + (Number(p.stock_qty) || 0), 0)
  const lowStockCount = products.filter(p => (Number(p.stock_qty) || 0) < 10).length
  const stockValue = products.reduce((acc, p) =>
    acc + ((Number(p.stock_qty) || 0) * (Number(p.selling_price) || 0)), 0)

  return res.json({
    totalProducts,
    totalStock,
    lowStockCount,
    stockValue,
    pendingReturns: 0,
    recentTransactions: transfers.length + returns.length
  })
})

app.get('/api/user-stats', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  const user = users.find(u => u.token === token)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })

  const inventory = getStaffInventory(user.id)
  const totalItems = Object.values(inventory).reduce((a, b) => a + b, 0)

  return res.json({
    productsTaken: totalItems,
    pendingReturns: 0,
    balanceToReturn: totalItems
  })
})

// ========================================
// STAFF INVENTORY ENDPOINT
// ========================================

app.get('/api/staff-inventory/:staffId', (req, res) => {
  const staffId = parseInt(req.params.staffId)
  const inventory = getStaffInventory(staffId)

  // Convert to array with product details
  const inventoryArray = Object.entries(inventory).map(([productId, qty]) => {
    const product = products.find(p => p.id === parseInt(productId))
    return {
      product_id: parseInt(productId),
      product,
      quantity: qty
    }
  })

  return res.json(inventoryArray)
})

// ========================================
// MODULE 7: REPORTS ENDPOINTS
// ========================================

// 1. Stock Report
app.get('/api/reports/stock', (req, res) => {
  const report = products.map(p => {
    const distributed = transfer_items
      .filter(ti => ti.product_id === p.id)
      .reduce((sum, ti) => sum + ti.qty, 0)

    const returned = return_items
      .filter(ri => ri.product_id === p.id)
      .reduce((sum, ri) => sum + ri.qty, 0)

    return {
      product_id: p.id,
      product_name: p.name,
      barcode: p.barcode,
      stock_qty: p.stock_qty,
      distributed,
      returned,
      in_warehouse: p.stock_qty
    }
  })

  return res.json(report)
})

// 2. Staff-wise Transfer Report
app.get('/api/reports/transfers', (req, res) => {
  const report = transfers.map(t => {
    const staff = users.find(u => u.id === t.staff_id)
    const items = transfer_items
      .filter(ti => ti.transfer_id === t.id)
      .map(ti => {
        const product = products.find(p => p.id === ti.product_id)
        return {
          product_name: product?.name,
          qty: ti.qty
        }
      })

    return {
      transfer_id: t.id,
      staff_name: staff?.name,
      staff_id: t.staff_id,
      items,
      created_at: t.created_at
    }
  })

  return res.json(report)
})

// 3. Staff-wise Return Report
app.get('/api/reports/returns', (req, res) => {
  const report = returns.map(r => {
    const staff = users.find(u => u.id === r.staff_id)
    const items = return_items
      .filter(ri => ri.return_id === r.id)
      .map(ri => {
        const product = products.find(p => p.id === ri.product_id)
        return {
          product_name: product?.name,
          qty: ri.qty
        }
      })

    return {
      return_id: r.id,
      staff_name: staff?.name,
      staff_id: r.staff_id,
      items,
      created_at: r.created_at
    }
  })

  return res.json(report)
})

// 4. Low Stock Report
app.get('/api/reports/low-stock', (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10
  const lowStockProducts = products.filter(p => p.stock_qty < threshold)

  return res.json(lowStockProducts)
})

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`✅ Mock server running on http://localhost:${PORT}`)
  console.log(`📊 Admin → User: transfers + transfer_items`)
  console.log(`📊 User → Warehouse: returns + return_items`)
  console.log(`🆕 User → Customer: user_transactions`)
  console.log(`🎯 Staff stock calculated from ALL transactions`)
})
