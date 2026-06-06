import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Eye, EyeOff, LogIn } from 'lucide-react'

// Cartoon broiler chicken SVG — matches the bird in the design
const ChickenBird: React.FC<{ size?: number }> = ({ size = 100 }) => (
  <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg"
    width={size} height={size * 1.1}
    style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' }}>
    {/* Tail feathers */}
    <path d="M72 55 Q85 35 82 55 Q80 42 74 55Z" fill="#2d6e2d"/>
    <path d="M74 60 Q90 42 86 60 Q84 48 76 60Z" fill="#1a5c1a"/>
    <path d="M72 65 Q88 52 84 66 Q82 56 74 66Z" fill="#2d6e2d"/>
    {/* Body */}
    <ellipse cx="52" cy="68" rx="24" ry="19" fill="#c07c2a"/>
    {/* Wing */}
    <ellipse cx="50" cy="70" rx="18" ry="12" fill="#a86820"/>
    <path d="M38 65 Q50 75 64 68 Q56 78 40 72Z" fill="#8a5518"/>
    {/* Neck */}
    <ellipse cx="36" cy="56" rx="9" ry="13" fill="#c07c2a"/>
    {/* Head */}
    <circle cx="30" cy="44" r="15" fill="#d4902e"/>
    {/* Comb */}
    <path d="M23 30 Q25 23 28 30 Q30 22 33 30 Q36 25 38 31"
      stroke="#e53e3e" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    {/* Wattle */}
    <path d="M22 48 Q18 52 20 57 Q24 60 26 55 Q25 52 22 48Z" fill="#e53e3e"/>
    {/* Eye white */}
    <circle cx="25" cy="41" r="4.5" fill="white"/>
    {/* Pupil */}
    <circle cx="24" cy="40.5" r="2.5" fill="#1a1a1a"/>
    {/* Eye shine */}
    <circle cx="23" cy="39.5" r="1" fill="white"/>
    {/* Beak */}
    <path d="M16 43 L10 46 L16 49Z" fill="#f0a830"/>
    <line x1="16" y1="46" x2="10" y2="46" stroke="#d48a20" strokeWidth="0.8"/>
    {/* Legs */}
    <line x1="46" y1="86" x2="42" y2="100" stroke="#f0a830" strokeWidth="4" strokeLinecap="round"/>
    <line x1="56" y1="86" x2="60" y2="100" stroke="#f0a830" strokeWidth="4" strokeLinecap="round"/>
    {/* Feet */}
    <line x1="42" y1="100" x2="36" y2="103" stroke="#f0a830" strokeWidth="3" strokeLinecap="round"/>
    <line x1="42" y1="100" x2="42" y2="106" stroke="#f0a830" strokeWidth="3" strokeLinecap="round"/>
    <line x1="42" y1="100" x2="48" y2="103" stroke="#f0a830" strokeWidth="3" strokeLinecap="round"/>
    <line x1="60" y1="100" x2="54" y2="103" stroke="#f0a830" strokeWidth="3" strokeLinecap="round"/>
    <line x1="60" y1="100" x2="60" y2="106" stroke="#f0a830" strokeWidth="3" strokeLinecap="round"/>
    <line x1="60" y1="100" x2="66" y2="103" stroke="#f0a830" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

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
        @keyframes chickenBob {
          0%,100% { transform: translateY(0) rotate(-3deg) scaleX(1); }
          30%      { transform: translateY(-10px) rotate(3deg) scaleX(1.04); }
          60%      { transform: translateY(-5px) rotate(0deg) scaleX(0.97); }
        }
        @keyframes chickenWalk {
          0%,100% { transform: translateX(0); }
          50%      { transform: translateX(3px); }
        }
        .chicken-anim {
          animation: chickenBob 1.8s ease-in-out infinite, chickenWalk 0.9s ease-in-out infinite;
          transform-origin: center bottom;
        }
      `}</style>

      {/* Bird + Title */}
      <div className="flex flex-col items-center mb-6 select-none">
        <div className="chicken-anim mb-1">
          <ChickenBird size={110} />
        </div>
        <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@naraendrafarms.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
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
            style={{ background: loading ? '#15803d' : 'linear-gradient(135deg,#16a34a,#15803d)' }}>
            <LogIn size={16}/>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          Contact admin to reset your password
        </p>
      </div>

      {/* Bottom stats */}
      <p className="mt-6 text-green-400 text-xs font-medium tracking-wide opacity-80">
        4 Farms · 27 Sheds · Active Flocks 19–22
      </p>
    </div>
  )
}
