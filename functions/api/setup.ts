// Cloudflare Pages Function - health check only
// The actual setup is done via the /setup React page

export const onRequestGet = async (): Promise<Response> => {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    app: 'Naraendra Farms',
    message: 'Visit /setup to initialize the database'
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
