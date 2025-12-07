// Removed mockBackend import
// Removed old Auth helpers


// ==========================================
// EXPORTED API FUNCTIONS
// ==========================================

import { supabase } from './supabase'

// ==========================================
// AUTH HELPERS (Supabase)
// ==========================================

export async function login(credentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.identifier || credentials.email,
    password: credentials.password,
  })

  if (error) throw new Error(error.message)

  // Fetch user role from metadata or profile
  // For now, we assume metadata stores role, or we fetch from 'users' table if we synced it.
  // Let's assume simplest: Get session user.
  const user = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.user_metadata?.role || 'USER', // Default to USER
    name: data.user.user_metadata?.name || data.user.email.split('@')[0],
    token: data.session.access_token
  }

  saveUser(user)
  return user
}

export async function signup(payload) {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        name: payload.name,
        role: payload.role || 'USER', // ADMIN or USER
      },
    },
  })

  if (error) throw new Error(error.message)

  // Auto login behavior if session is returned
  if (data.session) {
    const user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role,
      name: data.user.user_metadata?.name,
      token: data.session.access_token
    }
    saveUser(user)
    return user
  }

  return { message: "Check email for verification!" }
}

export async function logout() {
  await supabase.auth.signOut()
  localStorage.removeItem('tsm_user')
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) throw new Error(error.message)
  return { message: 'Password reset email sent! Check your inbox.' }
}


export async function getCurrentUser() {
  // First check local storage for quick access
  const stored = localStorage.getItem('tsm_user')
  if (stored) return JSON.parse(stored)

  // If not in localStorage, check Supabase session (auto-restores on page load)
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.user_metadata?.role || 'USER',
      name: session.user.user_metadata?.name || session.user.email.split('@')[0],
      token: session.access_token
    }
    saveUser(user) // Sync to localStorage
    return user
  }

  return null
}

export function saveUser(data) {
  localStorage.setItem('tsm_user', JSON.stringify(data))
}


// ==========================================
// PRODUCTS API (Supabase)
// ==========================================

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createProduct(payload) {
  const { data, error } = await supabase
    .from('products')
    .insert([payload])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return { message: 'Product deleted' }
}

// ==========================================
// USERS API (Supabase)
// ==========================================

export async function fetchUsers() {
  // Call the database function to get all users
  const { data, error } = await supabase.rpc('get_all_users')

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data || []
}

// ==========================================
// CATEGORIES API (Supabase)
// ==========================================

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  return data
}

export async function createCategory(name) {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateCategory(id, name) {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return { message: 'Category deleted' }
}

// ==========================================
// DASHBOARD STATS (Supabase)
// ==========================================

export async function getDashboardStats() {
  const { data: products } = await supabase.from('products').select('stock_qty, selling_price')

  const totalProducts = products?.length || 0
  const totalStock = products?.reduce((sum, p) => sum + (p.stock_qty || 0), 0) || 0
  const stockValue = products?.reduce((sum, p) => sum + (p.stock_qty || 0) * (p.selling_price || 0), 0) || 0

  return {
    totalProducts,
    totalStock,
    stockValue,
    pendingReturns: 0 // Will implement later with transactions
  }
}

// ==========================================
// TRANSACTIONS API (Supabase) - STUB
// ==========================================

export async function createUserTransaction(payload) {
  const currentUser = await getCurrentUser()

  // Allow admin to specify user_id, otherwise use current user
  const userId = payload.user_id || currentUser.id

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      user_id: userId,
      product_id: payload.product_id,
      type: payload.type, // 'TRANSFER' or 'RETURN'
      quantity: payload.quantity,
      customer_name: payload.customer_name
    }])
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Update product stock
  if (payload.type === 'TRANSFER') {
    await supabase.rpc('decrement_stock', {
      product_id: payload.product_id,
      qty: payload.quantity
    })
  } else if (payload.type === 'RETURN') {
    await supabase.rpc('increment_stock', {
      product_id: payload.product_id,
      qty: payload.quantity
    })
  }

  return data
}

export async function getUserTransactions(startDate = null, endDate = null) {
  const user = await getCurrentUser()

  let query = supabase
    .from('transactions')
    .select(`
      *,
      products (name, barcode)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) query = query.lte('created_at', endDate)

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // Flatten product details for the frontend
  return data.map(t => ({
    ...t,
    product_name: t.products?.name || 'Unknown',
    product_barcode: t.products?.barcode || 'N/A'
  }))
}

export async function fetchAllTransactions(startDate = null, endDate = null) {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      products (name, barcode)
    `)
    .order('created_at', { ascending: false })

  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) query = query.lte('created_at', endDate)

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // Map the data to match expected format
  // Note: user_name mapping will be done in the frontend because we can't join auth.users easily here
  return data.map(t => ({
    ...t,
    product_name: t.products?.name || 'Unknown',
    product_barcode: t.products?.barcode || 'N/A',
    customer_name: t.customer_name || 'N/A'
  }))
}

export async function getUserStats() {
  const user = await getCurrentUser()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, quantity, created_at')
    .eq('user_id', user.id)

  // Calculate stats
  let takenToday = 0
  let totalTaken = 0
  let totalReturned = 0

  const today = new Date().toISOString().split('T')[0]

  transactions?.forEach(t => {
    const isToday = t.created_at.startsWith(today)

    if (t.type === 'TRANSFER') {
      totalTaken += t.quantity
      if (isToday) takenToday += t.quantity
    } else if (t.type === 'RETURN' || t.type === 'USED') {
      // Both RETURN and USED reduce the user's holding liability
      totalReturned += t.quantity
    }
  })

  return {
    productsTaken: takenToday, // Only counts what they TOOK today
    currentStockHolding: totalTaken - totalReturned
  }
}

// ==========================================
// STUBS FOR NOT YET MIGRATED
// ==========================================

export async function createTransfer(payload) {
  if (payload.items && Array.isArray(payload.items)) {
    const results = []
    for (const item of payload.items) {
      results.push(await createUserTransaction({
        ...payload,
        product_id: item.productId,
        quantity: item.qty,
        type: 'TRANSFER'
      }))
    }
    return results
  }
  return createUserTransaction({ ...payload, type: 'TRANSFER' })
}

export async function createReturn(payload) {
  if (payload.items && Array.isArray(payload.items)) {
    const results = []
    for (const item of payload.items) {
      results.push(await createUserTransaction({
        ...payload,
        product_id: item.productId,
        quantity: item.qty,
        type: 'RETURN'
      }))
    }
    return results
  }
  return createUserTransaction({ ...payload, type: 'RETURN' })
}

export async function createUsedTransaction(payload) {
  if (payload.items && Array.isArray(payload.items)) {
    const results = []
    for (const item of payload.items) {
      results.push(await createUserTransaction({
        ...payload,
        product_id: item.productId,
        quantity: item.qty,
        type: 'USED'
      }))
    }
    return results
  }
  return createUserTransaction({ ...payload, type: 'USED' })
}

export async function fetchStaffInventory(userId) {
  const currentUser = await getCurrentUser()

  let query = supabase
    .from('transactions')
    .select(`
      *,
      products (
        id,
        name,
        barcode,
        category,
        size,
        selling_price
      )
    `)
    .eq('type', 'TRANSFER')

  // If not admin or no userId specified, only show current user's items
  if (currentUser.role !== 'ADMIN' || !userId) {
    query = query.eq('user_id', currentUser.id)
  } else {
    // Admin can filter by specific user
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching inventory:', error)
    return []
  }

  // Group by product and sum quantities
  const grouped = {}
  data.forEach(transaction => {
    const productId = transaction.product_id
    if (!grouped[productId]) {
      grouped[productId] = {
        product_id: productId,
        product: transaction.products,
        quantity: 0,
        transactions: []
      }
    }
    grouped[productId].quantity += transaction.quantity
    grouped[productId].transactions.push(transaction)
  })

  return Object.values(grouped)
}

// For admin: get all transferred items across all users
export async function getAllTransferredItems() {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      products (
        id,
        name,
        barcode,
        category,
        size,
        selling_price
      )
    `)
    .eq('type', 'TRANSFER')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all transfers:', error)
    return []
  }

  return data
}

