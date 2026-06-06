import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export const Login: React.FC = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const err = await signIn(email, password)
    if (err) { setError(err); setLoading(false) }
    else navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(160deg, #1a5c38 0%, #14532d 50%, #0f3d22 100%)' }}>

      <style>{`
        @keyframes birdBob {
          0%,100% { transform: translateY(0px) rotate(-2deg) scale(1); }
          40%      { transform: translateY(-14px) rotate(3deg) scale(1.05); }
          70%      { transform: translateY(-7px) rotate(-1deg) scale(0.98); }
        }
        .bird-bob { animation: birdBob 2s ease-in-out infinite; transform-origin: center bottom; }
      `}</style>

      {/* Bird + Title */}
      <div className="flex flex-col items-center mb-6 select-none">
        <div className="bird-bob mb-2" style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))' }}>
          <div style={{
            width: 120, height: 120,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: '0 0 30px rgba(255,255,255,0.1)',
          }}>
            <img
              src="/broiler-bird.jpg"
              alt="Naraendra Farms Broiler Bird"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 15%',
              }}
            />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">
          Naraendra Farms
        </h1>
        <p className="text-green-300 text-sm mt-1 font-medium">
          Poultry Broiler Breeder Management
        </p>
      </div>

      {/* Login card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Sign In</h2>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@naraendrafarms.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm
                  focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold
              text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
            <LogIn size={16}/>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          Contact admin to reset your password
        </p>
      </div>

      <p className="mt-6 text-green-400 text-xs font-medium tracking-wide opacity-80">
        4 Farms · 27 Sheds · Active Flocks 19–22
      </p>
    </div>
  )
}
