import type { ModelId, TokenData } from './types'

export const DISTRIBUTION_SYSTEM_PROMPT = `You are a language model response generator that also produces token-level probability distributions.

Given a user prompt and a temperature value, generate a natural response AND realistic token probability distributions.

Respond ONLY with a valid JSON object in this exact shape — no markdown, no backticks, no preamble:

{
  "tokens": [
    {
      "word": "the actual word or punctuation (preserve leading spaces as part of the word string)",
      "dist": [
        { "word": "chosen_word", "prob": 72 },
        { "word": "alt1", "prob": 15 },
        { "word": "alt2", "prob": 7 },
        { "word": "alt3", "prob": 4 },
        { "word": "alt4", "prob": 2 }
      ]
    }
  ]
}

Rules:
- Generate a complete, natural response to the prompt (40–80 tokens)
- Include EVERY token including punctuation (periods, commas, colons, em dashes, etc.)
- Preserve leading spaces in word strings (e.g. " classic" not "classic") except for the first token
- dist[0] is always the chosen word with its estimated probability
- Always include exactly 5 alternatives in dist
- Probabilities in each dist array must sum to 100
- Alternatives must reflect genuine semantic/syntactic branching — different directions the sentence could go — NOT just synonyms
- Punctuation tokens must also have realistic distributions (e.g. ":" vs "—" vs "," is a real structural choice)
- Higher temperature = flatter distributions (more uniform probabilities)
- Lower temperature = more peaked distributions (top token dominates)
- At temperature 0.0, top token should often be 85–99%
- At temperature 1.0, distributions should be noticeably flatter, top token rarely above 55%
- Respond ONLY with the JSON object. Nothing else.`

export function buildDistributionPrompt(prompt: string, temperature: number): string {
  return `Temperature: ${temperature.toFixed(1)}\n\nUser prompt: ${prompt}`
}

export function buildWhyPrompt(
  context: string,
  chosen: string,
  alt: string,
  mode: 'technical' | 'accessible'
): string {
  if (mode === 'technical') {
    return `In the context "${context}", the token "${chosen}" was chosen over "${alt}".

In 2–3 sentences, explain why "${chosen}" has higher probability here. Consider:
- Syntactic constraints at this position
- Semantic framing differences (what each word implies about the sentence's trajectory)
- Whether this is about synonymy or genuine semantic branching
- What the training distribution likely looks like for this context

Be specific and analytical. Do not be generic.`
  }

  return `Imagine you are writing a sentence that starts with: "${context}"

You picked the word "${chosen}" instead of "${alt}".

In 2–3 plain sentences, explain why "${chosen}" fits better at this point — and what would have been different about the rest of the sentence if you had picked "${alt}" instead. No jargon.`
}

export function parseTokenJSON(raw: string): TokenData[] {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(cleaned)
  if (!parsed.tokens || !Array.isArray(parsed.tokens)) {
    throw new Error('Invalid token data shape')
  }
  return parsed.tokens as TokenData[]
}

export { type ModelId }
