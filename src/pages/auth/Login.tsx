import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

const BroilerBird: React.FC = () => (
  <div className="bird-container select-none" aria-hidden="true">
    <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" className="w-32 h-28 drop-shadow-lg">
      {/* Body */}
      <ellipse cx="60" cy="62" rx="28" ry="20" fill="#c8922a" />
      {/* Wing */}
      <ellipse cx="55" cy="65" rx="20" ry="11" fill="#b87d20" className="wing" />
      {/* Tail feathers */}
      <path d="M88 62 Q100 52 98 68 Q96 60 88 65Z" fill="#8b5e14" />
      <path d="M88 66 Q102 60 99 74 Q96 66 88 70Z" fill="#a06b18" />
      {/* Neck */}
      <ellipse cx="38" cy="54" rx="10" ry="14" fill="#c8922a" />
      {/* Head */}
      <circle cx="30" cy="44" r="13" fill="#d4982e" />
      {/* Comb */}
      <path d="M24 32 Q26 26 28 32 Q30 24 32 32 Q34 27 36 32" stroke="#e53e3e" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Wattle */}
      <ellipse cx="24" cy="47" rx="4" ry="6" fill="#e53e3e" />
      {/* Eye */}
      <circle cx="26" cy="42" r="3.5" fill="white" />
      <circle cx="25.5" cy="41.5" r="1.8" fill="#1a1a1a" />
      <circle cx="25" cy="41" r="0.7" fill="white" />
      {/* Beak */}
      <path d="M18 44 L12 46 L18 48Z" fill="#e8a020" />
      {/* Legs */}
      <line x1="54" y1="80" x2="50" y2="94" stroke="#e8a020" strokeWidth="3" strokeLinecap="round" />
      <line x1="62" y1="80" x2="66" y2="94" stroke="#e8a020" strokeWidth="3" strokeLinecap="round" />
      {/* Feet */}
      <path d="M44 94 L50 94 L52 98" stroke="#e8a020" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M60 94 L66 94 L68 98" stroke="#e8a020" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  </div>
)

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-brand-50 to-brand-100 flex items-center justify-center p-4">
      <style>{`
        @keyframes birdBob {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes wingFlap {
          0%, 100% { transform: scaleY(1); }
          50%       { transform: scaleY(0.7); }
        }
        .bird-container { animation: birdBob 2.4s ease-in-out infinite; }
        .wing           { animation: wingFlap 0.6s ease-in-out infinite; transform-origin: 55px 65px; }
      `}</style>

      <div className="w-full max-w-sm">
        {/* Bird + title card */}
        <div className="flex flex-col items-center mb-6">
          <BroilerBird />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Naraendra Farms</h1>
          <p className="text-sm text-gray-500 mt-0.5">Broiler Breeder Management</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-base font-semibold text-gray-800 mb-5 text-center">Sign in to continue</h2>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                  focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="you@naraendrafarms.com"
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
    </div>
  )
}
