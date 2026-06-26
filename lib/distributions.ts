import type { TokenAlternative } from './types'

export function entropy(dist: TokenAlternative[]): number {
  let e = 0
  for (const d of dist) {
    if (d.prob > 0) {
      const p = d.prob / 100
      e -= p * Math.log2(p)
    }
  }
  return e
}

export function confidenceClass(prob: number): 'high' | 'mid' | 'low' {
  if (prob >= 60) return 'high'
  if (prob >= 20) return 'mid'
  return 'low'
}

export function confidenceLabel(prob: number, mode: 'technical' | 'accessible'): string {
  const cls = confidenceClass(prob)
  if (mode === 'technical') {
    if (cls === 'high') return 'High confidence'
    if (cls === 'mid') return 'Medium confidence'
    return 'Low / contested'
  }
  if (cls === 'high') return 'Model was very sure'
  if (cls === 'mid') return 'A few good options'
  return 'Many competing words'
}

export function remainderNote(dist: TokenAlternative[]): string | null {
  const topSum = dist.reduce((s, d) => s + d.prob, 0)
  const rem = Math.round(100 - topSum)
  if (dist[0].prob < 25) {
    return 'Highly contested — top token holds less than 25%. Many other tokens had meaningful probability mass.'
  }
  if (rem > 5) {
    return `Remaining ~${rem}% spread across many tokens each below 1–2% — too many to list individually.`
  }
  return null
}

// Clamp temperature display to 1 decimal
export function formatTemp(t: number): string {
  return t.toFixed(1)
}
