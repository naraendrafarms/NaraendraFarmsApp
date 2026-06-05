import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Bird } from 'lucide-react'

export const Login: React.FC = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const err = await signIn(email, password)
    if (err) { setError(err); setLoading(false) }
    else navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-brand-200">
            <Bird size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Naraendra Farms</h1>
          <p className="text-sm text-gray-500 mt-0.5">Poultry Management System</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="admin@naraendrafarms.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium
              hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Contact admin to reset your password
        </p>
      </div>
    </div>
  )
}
