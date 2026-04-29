// src/store/authStore.js
import { create } from 'zustand'

/**
 * Auth store — persists token and user profile in localStorage so a
 * page refresh keeps the user logged in.
 *
 * User shape from the real API:
 *   { user_id: string, email: string, role: string }
 */
const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('forensic_user')) || null,
  token: localStorage.getItem('forensic_token') || null,
  isAuth: !!localStorage.getItem('forensic_token'),

  login: (user, token) => {
    localStorage.setItem('forensic_token', token)
    localStorage.setItem('forensic_user', JSON.stringify(user))
    set({ user, token, isAuth: true })
  },

  logout: () => {
    localStorage.removeItem('forensic_token')
    localStorage.removeItem('forensic_user')
    set({ user: null, token: null, isAuth: false })
  },
}))

export default useAuthStore