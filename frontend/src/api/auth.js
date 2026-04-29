// src/api/auth.js
import client from './client'

/**
 * Login — calls POST /api/auth/login on the main backend (:8000),
 * which proxies to the auth microservice (:8002).
 * Returns { user: { email, user_id, role }, token: access_token }
 */
export const login = async (email, password) => {
  const res = await client.post('/api/auth/login', { email, password })
  const { access_token } = res.data
  // Decode the JWT payload to get user info (sub = user_id, role)
  const payload = JSON.parse(atob(access_token.split('.')[1]))
  return {
    token: access_token,
    user: { user_id: payload.sub, email, role: payload.role ?? 'officer' },
  }
}

/**
 * Register — calls POST /api/auth/register.
 * Auth service returns { user_id, email }; we then auto-login to get a token.
 */
export const register = async (email, password) => {
  await client.post('/api/auth/register', { email, password })
  // Auto-login after registration
  return login(email, password)
}

/**
 * Logout — calls POST /api/auth/logout with the current bearer token.
 * Token invalidation is stateless; client drops the token from localStorage.
 */
export const logout = async () => {
  try {
    await client.post('/api/auth/logout')
  } catch (_) {
    // Ignore — token may already be expired; client always clears locally
  }
  return { success: true }
}

/**
 * Me — calls GET /api/auth/me to fetch the live user profile.
 * Returns { user_id, email, role, is_active }
 */
export const me = async () => {
  const res = await client.get('/api/auth/me')
  return { user: res.data }
}
