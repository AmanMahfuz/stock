import axios from 'axios'

// In Vite (browser) use `import.meta.env`; `process` is not defined in the browser.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

const client = axios.create({ baseURL: API_BASE })

// If a user token was persisted in localStorage from a previous session,
// attach it so requests include Authorization header by default.
try {
  const saved = JSON.parse(localStorage.getItem('tsm_user'))
  if (saved?.token) client.defaults.headers.common['Authorization'] = `Bearer ${saved.token}`
} catch (e) {/* ignore */ }

export async function login(credentials) {
  const res = await client.post('/login', credentials)
  return res.data
}

export async function signup(payload) {
  const res = await client.post('/signup', payload)
  return res.data
}

export function setToken(token) {
  if (token) client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  else delete client.defaults.headers.common['Authorization']
}

export function saveUser(data) {
  localStorage.setItem('tsm_user', JSON.stringify(data))
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

export async function fetchProducts() {
  const res = await client.get('/products')
  return res.data
}

export async function getDashboardStats() {
  const res = await client.get('/stats')
  return res.data
}

export async function createProduct(payload) {
  const res = await client.post('/products', payload)
  return res.data
}

export async function updateProduct(id, payload) {
  const res = await client.put(`/products/${id}`, payload)
  return res.data
}

export async function deleteProduct(id) {
  const res = await client.delete(`/products/${id}`)
  return res.data
}

export async function fetchUsers() {
  const res = await client.get('/users')
  return res.data
}

export async function createTransfer(payload) {
  const res = await client.post('/transfers', payload)
  return res.data
}

export async function createReturn(payload) {
  const res = await client.post('/returns', payload)
  return res.data
}

export async function getUserStats() {
  const res = await client.get('/user-stats')
  return res.data
}

export default client
