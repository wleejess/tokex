import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const STREAM_SYSTEM = `You are a helpful assistant. Respond naturally and concisely to the user's prompt in 3–5 sentences. Do not use markdown formatting.`

export async function POST(req: NextRequest) {
  const { prompt, model, temperature } = await req.json()

  // Accept key from request header (user-supplied) or fall back to env var
  const apiKey =
    req.headers.get('x-anthropic-key') || process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'No API key provided. Please enter your Anthropic API key.' }),
      { status: 401 }
    )
  }

  if (!prompt || !model) {
    return new Response(JSON.stringify({ error: 'Missing prompt or model' }), { status: 400 })
  }

  const client = new Anthropic({ apiKey })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model,
          max_tokens: 300,
          temperature: temperature ?? 0.7,
          system: STREAM_SYSTEM,
          messages: [{ role: 'user', content: prompt }],
        })

        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Stream error'
        controller.enqueue(encoder.encode(`\n[ERROR: ${msg}]`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
