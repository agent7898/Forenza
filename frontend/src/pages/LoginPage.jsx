// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const setLogin = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const data = await login(email, password)
      setLogin(data.user, data.token)
      toast.success('Authentication successful')
      navigate('/session')
    } catch (err) {
      toast.error('Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
          <span className="text-[10px] font-mono text-on-surface-variant tracking-wider">SECURE TERMINAL v4.2.1-stable</span>
        </div>

        <div className="bg-surface-container border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h1 className="font-display text-xl font-bold text-on-surface tracking-wide">SYSTEM AUTHENTICATION</h1>
            <p className="text-sm text-on-surface-variant mt-1">Provide credentials to access forensic portal</p>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="text-[11px] font-display font-bold tracking-[0.1em] text-on-surface-variant uppercase block mb-1.5">OPERATIVE ID</label>
              <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="agent@forensics.gov"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder-outline focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all font-mono" />
            </div>
            <div>
              <label className="text-[11px] font-display font-bold tracking-[0.1em] text-on-surface-variant uppercase block mb-1.5">ACCESS KEY</label>
              <input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder-outline focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all" />
            </div>
            <button id="login-submit-btn" type="submit" disabled={loading}
              className="w-full bg-primary text-white font-display font-semibold rounded-lg py-2.5 text-sm tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE →'}
            </button>
          </form>

          <div className="px-6 py-3 border-t border-border text-center">
            <p className="text-xs text-on-surface-variant">
              Unregistered operative?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">Request Clearance</Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-success" />
          <span className="text-[10px] font-mono text-outline">Connection Encrypted • E2EE Active</span>
        </div>
      </div>
    </div>
  )
}
