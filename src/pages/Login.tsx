import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: loginError } = await login(email, password)
    setSubmitting(false)
    if (loginError) {
      setError('Credenziali non valide. Riprova.')
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#1E3A5F] mb-4">
            <span className="text-white text-xl font-bold">AC</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A202C]">Financial Dashboard</h1>
          <p className="text-sm text-[#64748B] mt-1">Adriana Comunicazioni Srl</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1A202C] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@azienda.it"
                required
                autoComplete="email"
                className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1A202C] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-[#1A202C] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-sm"
              />
            </div>

            {error && <p className="text-sm text-[#EF4444]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-lg bg-[#1E3A5F] text-white font-medium text-sm hover:bg-[#2E5F8A] transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
