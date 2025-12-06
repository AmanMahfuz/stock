import { mockBackend } from './mockBackend'

// ==========================================
// MOCK CLIENT ADAPTER (Replaces Axios)
// ==========================================

const client = {
  defaults: { headers: { common: {} } },

  get: async (url) => {
    const user = getCurrentUser()

    if (url === '/products') return { data: await mockBackend.getProducts() }
    if (url === '/users') return { data: await mockBackend.getUsers() }
    if (url === '/categories') return { data: await mockBackend.getCategories() }
    if (url === '/stats') return { data: await mockBackend.getStats() }
    if (url === '/user-stats') return { data: await mockBackend.getUserStats(user) }
    if (url === '/user-stats') return { data: await mockBackend.getUserStats(user) }
    if (url === '/user-transactions') return { data: await mockBackend.getUserTransactions(user) }
    if (url === '/admin/transactions') return { data: await mockBackend.getAllUserTransactions() }

    if (url.startsWith('/reports/')) {
      const type = url.split('/reports/')[1]
      return { data: await mockBackend.getReport(type) }
    }

    if (url.startsWith('/staff-inventory/')) {
      const staffId = url.split('/staff-inventory/')[1]
      return { data: await mockBackend.getStaffInventoryApi(staffId) }
    }

    throw new Error(`Mock 404: ${url}`)
  },

  post: async (url, data) => {
    const user = getCurrentUser()

    if (url === '/login') return { data: await mockBackend.login(data.identifier, data.password) }
    if (url === '/signup') return { data: await mockBackend.signup(data) }
    if (url === '/products') return { data: await mockBackend.addProduct(data) }
    if (url === '/categories') return { data: await mockBackend.addCategory(data.name) }
    if (url === '/transfers') return { data: await mockBackend.createTransfer(data) }
    if (url === '/take-stock') return { data: await mockBackend.takeStock(data, user) }
    if (url === '/user-transactions') return { data: await mockBackend.createUserTransaction(data, user) }
    if (url === '/returns') return { data: await mockBackend.createReturn(data, user) }

    throw new Error(`Mock 404: ${url}`)
  },

  put: async (url, data) => {
    if (url.startsWith('/products/')) {
      const id = url.split('/products/')[1]
      return { data: await mockBackend.updateProduct(id, data) }
    }
    if (url.startsWith('/categories/')) {
      const id = url.split('/categories/')[1]
      return { data: await mockBackend.updateCategory(id, data.name) }
    }
    throw new Error(`Mock 404: ${url}`)
  },

  delete: async (url) => {
    if (url.startsWith('/products/')) {
      const id = url.split('/products/')[1]
      return { data: await mockBackend.deleteProduct(id) }
    }
    if (url.startsWith('/categories/')) {
      const id = url.split('/categories/')[1]
      return { data: await mockBackend.deleteCategory(id) }
    }
    throw new Error(`Mock 404: ${url}`)
  }
}

// ==========================================
// AUTH HELPERS
// ==========================================

export function setToken(token) {
  // No-op for mock, but kept for compatibility
  if (token) client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  else delete client.defaults.headers.common['Authorization']
}

export function saveUser(data) {
  localStorage.setItem('tsm_user', JSON.stringify({
    token: data.token,
    role: data.role,
    name: data.name,
    id: data.id
  }))
  setToken(data.token)
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('tsm_user'))
  } catch (e) { return null }
}

export function logout() {
  localStorage.removeItem('tsm_user')
  setToken(null)
}

// ==========================================
// EXPORTED API FUNCTIONS
// ==========================================

export async function login(credentials) {
  return (await client.post('/login', credentials)).data
}

export async function signup(payload) {
  return (await client.post('/signup', payload)).data
}

export async function fetchProducts() {
  return (await client.get('/products')).data
}

export async function getDashboardStats() {
  return (await client.get('/stats')).data
}

export async function createProduct(payload) {
  return (await client.post('/products', payload)).data
}

export async function updateProduct(id, payload) {
  return (await client.put(`/products/${id}`, payload)).data
}

export async function deleteProduct(id) {
  return (await client.delete(`/products/${id}`)).data
}

export async function fetchUsers() {
  return (await client.get('/users')).data
}

export async function createTransfer(payload) {
  return (await client.post('/transfers', payload)).data
}

export async function createReturn(payload) {
  return (await client.post('/returns', payload)).data
}

export async function createUserTransaction(payload) {
  return (await client.post('/user-transactions', payload)).data
}

export async function getUserTransactions() {
  return (await client.get('/user-transactions')).data
}

export async function fetchAllTransactions() {
  return (await client.get('/admin/transactions')).data
}

export async function getUserStats() {
  return (await client.get('/user-stats')).data
}

export async function fetchStaffInventory(staffId) {
  return (await client.get(`/staff-inventory/${staffId}`)).data
}

// Categories
export async function fetchCategories() {
  return (await client.get('/categories')).data
}

export async function createCategory(name) {
  return (await client.post('/categories', { name })).data
}

export async function updateCategory(id, name) {
  return (await client.put(`/categories/${id}`, { name })).data
}

export async function deleteCategory(id) {
  return (await client.delete(`/categories/${id}`)).data
}

export default client
