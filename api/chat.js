export const config = { runtime: 'edge' }

export default async function handler(req) {
  const requestId = crypto.randomUUID().slice(0, 8)
  console.log(`[${requestId}] ${req.method} /api/chat`)

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  if (req.method !== 'POST') {
    console.log(`[${requestId}] Method not allowed: ${req.method}`)
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error(`[${requestId}] ERROR: ANTHROPIC_API_KEY is not set`)
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  let body
  try {
    body = await req.json()
  } catch (e) {
    console.error(`[${requestId}] ERROR: Invalid JSON body`, e.message)
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { messages, systemPrompt } = body
  console.log(`[${requestId}] Sending ${messages?.length} messages to Anthropic`)

  const start = Date.now()

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      })
    })

    const data = await response.json()
    const elapsed = Date.now() - start

    if (!response.ok) {
      console.error(`[${requestId}] Anthropic error ${response.status} in ${elapsed}ms:`, JSON.stringify(data))
    } else {
      console.log(`[${requestId}] OK ${response.status} in ${elapsed}ms — ${data.usage?.output_tokens || '?'} output tokens`)
    }

    return new Response(JSON.stringify(data), {
      status: response.ok ? 200 : response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (e) {
    const elapsed = Date.now() - start
    console.error(`[${requestId}] FETCH ERROR after ${elapsed}ms:`, e.message)
    return new Response(JSON.stringify({ error: 'Failed to reach Anthropic API', detail: e.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
