// Cloudflare Pages Function — runs SQL schema on Supabase
// POST /api/setup  →  runs migrations + seeds
// GET  /api/setup  →  health check

interface Env {
  VITE_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

const runSQL = async (supabaseUrl: string, serviceKey: string, sql: string) => {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({ query: sql })
  })
  return res
}

// Execute SQL via Supabase SQL endpoint
const execSQL = async (supabaseUrl: string, serviceKey: string, sql: string) => {
  // Use the pg endpoint for raw SQL
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({ query: sql })
  })
  const text = await res.text()
  return { status: res.status, body: text }
}

export const onRequestGet = async () => {
  return new Response(JSON.stringify({ status: 'ok', message: 'Setup endpoint ready. POST to run migrations.' }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

export const onRequestPost = async (context: { env: Env; request: Request }) => {
  const { env } = context
  const SUPABASE_URL = env.VITE_SUPABASE_URL
  const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return new Response(JSON.stringify({
      error: 'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const results: Record<string, any> = {}

  try {
    // ── SCHEMA SQL ────────────────────────────────────────────────
    const schemaRes = await fetch(
      'https://raw.githubusercontent.com/naraendrafarms/NaraendraFarmsApp/main/supabase/migrations/001_schema.sql'
    )
    const schemaSql = await schemaRes.text()

    // ── SEED SQL ──────────────────────────────────────────────────
    const seedRes = await fetch(
      'https://raw.githubusercontent.com/naraendrafarms/NaraendraFarmsApp/main/supabase/seeds/001_seed_data.sql'
    )
    const seedSql = await seedRes.text()

    // Execute via Supabase REST - use pg endpoint
    const projectRef = SUPABASE_URL.replace('https://','').replace('.supabase.co','')
    
    const runQuery = async (sql: string, label: string) => {
      const r = await fetch(
        `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ sql_query: sql })
        }
      )
      return { status: r.status, label, body: await r.text() }
    }

    // Split and run statements
    const splitSQL = (sql: string) => sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && !s.startsWith('--'))

    const schemaStmts = splitSQL(schemaSql)
    const seedStmts   = splitSQL(seedSql)

    results.schema_statements = schemaStmts.length
    results.seed_statements   = seedStmts.length

    // Run each statement via Supabase query endpoint
    let schemaErrors = 0, seedErrors = 0

    for (const stmt of schemaStmts) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({ query: stmt })
      })
      if (r.status >= 400) schemaErrors++
    }

    results.schema_errors = schemaErrors
    results.seed_errors   = seedErrors
    results.status = 'completed'

    return new Response(JSON.stringify(results, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
