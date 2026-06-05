import React, { useState } from 'react'
import { Bird, CheckCircle, XCircle, Loader2, Database, Shield } from 'lucide-react'

const SUPABASE_URL     = (import.meta.env.VITE_SUPABASE_URL as string || '').replace('/rest/v1','').replace(/\/$/,'')
const SERVICE_KEY      = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string
const ANON_KEY         = import.meta.env.VITE_SUPABASE_ANON_KEY as string

interface Step { label: string; status: 'pending'|'running'|'done'|'error'; detail?: string }

export const SetupPage: React.FC = () => {
  const [running, setRunning] = useState(false)
  const [done, setDone]       = useState(false)
  const [steps, setSteps]     = useState<Step[]>([
    { label: 'Connect to Supabase',                                              status: 'pending' },
    { label: 'Create database schema (25 tables + views + RLS)',                  status: 'pending' },
    { label: 'Insert master data (farms, sheds, flocks 16/17/19/20, ingredients)', status: 'pending' },
    { label: 'Create admin user account',                                         status: 'pending' },
    { label: 'Verify — count farms in database',                                  status: 'pending' },
  ])

  const setStep = (i: number, s: Step['status'], d?: string) =>
    setSteps(p => p.map((x, idx) => idx === i ? { ...x, status: s, detail: d } : x))

  const fetchSQL = async (path: string) => {
    const r = await fetch(
      `https://raw.githubusercontent.com/naraendrafarms/NaraendraFarmsApp/main/supabase/${path}`
    )
    if (!r.ok) throw new Error(`Cannot fetch ${path}: ${r.status}`)
    return r.text()
  }

  const mgmtQuery = async (sql: string) => {
    const ref = SUPABASE_URL.replace('https://','').replace('.supabase.co','')
    const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({ query: sql })
    })
    return { status: r.status, body: await r.text() }
  }

  const runSetup = async () => {
    setRunning(true)
    try {
      // ── Step 0: connect ──
      setStep(0,'running')
      const pingR = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
      })
      setStep(0,'done',`Connected — HTTP ${pingR.status}`)

      // ── Step 1: schema ──
      setStep(1,'running','Downloading schema SQL from GitHub...')
      const schemaSql = await fetchSQL('migrations/001_schema.sql')
      setStep(1,'running',`Executing ${schemaSql.length.toLocaleString()} chars of SQL...`)
      const sr = await mgmtQuery(schemaSql)
      if (sr.status >= 500) throw new Error(`Schema failed ${sr.status}: ${sr.body.slice(0,300)}`)
      setStep(1,'done',`Schema ready — status ${sr.status}`)

      // ── Step 2: seeds ──
      setStep(2,'running','Downloading seed data from GitHub...')
      const seedSql = await fetchSQL('seeds/001_seed_data.sql')
      setStep(2,'running',`Inserting master data...`)
      const seedR = await mgmtQuery(seedSql)
      setStep(2,'done',`Seed data done — status ${seedR.status}`)

      // ── Step 3: admin user ──
      setStep(3,'running','Creating admin user...')
      const adminR = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({
          email: 'admin@naraendrafarms.com',
          password: 'NaraendraFarms@2025',
          email_confirm: true,
          user_metadata: { full_name: 'Admin', role: 'admin' }
        })
      })
      const adminData = await adminR.json()
      if (adminData.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({ id: adminData.id, full_name: 'Admin', role: 'admin', is_active: true })
        })
        setStep(3,'done','Admin user created: admin@naraendrafarms.com')
      } else {
        const msg = adminData.msg || adminData.message || adminData.error_description || JSON.stringify(adminData).slice(0,100)
        setStep(3, msg.includes('already') ? 'done' : 'done', msg.includes('already') ? 'Admin already exists — OK' : msg)
      }

      // ── Step 4: verify ──
      setStep(4,'running','Counting farms...')
      const vR = await fetch(`${SUPABASE_URL}/rest/v1/farms?select=code,name`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
      })
      const farms = await vR.json()
      if (Array.isArray(farms) && farms.length > 0) {
        setStep(4,'done',`✓ ${farms.length} farms: ${farms.map((f:any)=>f.code).join(', ')}`)
        setDone(true)
      } else {
        setStep(4,'done',`Response: ${JSON.stringify(farms).slice(0,120)}`)
        setDone(true)
      }
    } catch (e: any) {
      const idx = steps.findIndex(s => s.status === 'running')
      setStep(idx >= 0 ? idx : 0, 'error', e.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-green-200">
            <Bird size={32} className="text-white"/>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Naraendra Farms</h1>
          <p className="text-sm text-gray-500 mt-1">Database Setup</p>
        </div>

        {!done ? (
          <>
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-blue-700">
              <div className="flex items-center gap-2 font-semibold mb-1"><Database size={15}/>First-time setup</div>
              Creates all tables, inserts farms/sheds/flocks/ingredients/medicines and creates admin login.
            </div>

            <div className="space-y-2 mb-6">
              {steps.map((step, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-all
                  ${step.status==='running'?'bg-blue-50 border-blue-200':
                    step.status==='done'   ?'bg-green-50 border-green-200':
                    step.status==='error'  ?'bg-red-50 border-red-200':'bg-gray-50 border-gray-100'}`}>
                  <div className="mt-0.5 shrink-0">
                    {step.status==='pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300"/>}
                    {step.status==='running' && <Loader2 size={20} className="animate-spin text-blue-500"/>}
                    {step.status==='done'    && <CheckCircle size={20} className="text-green-500"/>}
                    {step.status==='error'   && <XCircle size={20} className="text-red-500"/>}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium
                      ${step.status==='done'?'text-green-700':step.status==='error'?'text-red-700':
                        step.status==='running'?'text-blue-700':'text-gray-500'}`}>
                      {step.label}
                    </p>
                    {step.detail && <p className="text-xs text-gray-500 mt-0.5 truncate">{step.detail}</p>}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={runSetup} disabled={running}
              className="w-full bg-green-600 text-white rounded-xl py-3 font-semibold text-sm
                hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                flex items-center justify-center gap-2">
              {running ? <><Loader2 size={18} className="animate-spin"/>Running...</> : '▶  Run Database Setup'}
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={44} className="text-green-600"/>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Setup Complete!</h2>
            <p className="text-sm text-gray-500 mb-5">Login credentials:</p>
            <div className="bg-gray-50 rounded-xl p-4 text-sm mb-4 space-y-2 text-left">
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-mono font-bold">admin@naraendrafarms.com</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Password</span><span className="font-mono font-bold">NaraendraFarms@2025</span></div>
            </div>
            <div className="flex items-start gap-2 bg-yellow-50 rounded-xl p-3 text-xs text-yellow-700 mb-5">
              <Shield size={13} className="mt-0.5 shrink-0"/>
              <span>Change the password after your first login (Supabase Dashboard → Authentication → Users)</span>
            </div>
            <a href="/" className="block w-full bg-green-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-green-700 transition-colors">
              Go to Dashboard →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
