// src/api/client.js
import axios from 'axios'
import useAuthStore from '../store/authStore'

const client = axios.create({
  // Use empty baseURL so requests go through Vite's dev proxy (/api/* → :8000).
  // Set VITE_API_URL in .env.local only when deploying without a proxy.
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(err)
  }
)

export default client