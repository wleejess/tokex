import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import {
  DISTRIBUTION_SYSTEM_PROMPT,
  buildDistributionPrompt,
  buildWhyPrompt,
  parseTokenJSON,
} from '@/lib/anthropic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type } = body

  if (type === 'distributions') {
    const { prompt, model, temperature } = body

    if (!prompt || !model) {
      return NextResponse.json({ error: 'Missing prompt or model' }, { status: 400 })
    }

    try {
      const response = await client.messages.create({
        model,
        max_tokens: 4000,
        temperature: temperature ?? 0.7,
        system: DISTRIBUTION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildDistributionPrompt(prompt, temperature ?? 0.7),
          },
        ],
      })

      const raw = response.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('')

      const tokens = parseTokenJSON(raw)
      return NextResponse.json({ tokens })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  if (type === 'why') {
    const { context, chosen, alt, mode, model } = body

    if (!context || !chosen || !alt || !mode || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    try {
      const response = await client.messages.create({
        model,
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: buildWhyPrompt(context, chosen, alt, mode),
          },
        ],
      })

      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('')
        .trim()

      return NextResponse.json({ explanation: text })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
}
