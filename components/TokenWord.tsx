'use client'

import { confidenceClass } from '@/lib/distributions'
import type { TokenData } from '@/lib/types'

interface Props {
  token: TokenData
  index: number
  selected: boolean
  mode: 'technical' | 'accessible'
  onClick: (index: number) => void
}

export default function TokenWord({ token, index, selected, mode, onClick }: Props) {
  const cc = confidenceClass(token.dist[0].prob)

  return (
    <span
      className={`token-chip confidence-${cc} ${selected ? 'selected' : ''}`}
      onClick={() => onClick(index)}
      title={`${Math.round(token.dist[0].prob)}% confidence — click to inspect`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(index)}
      aria-pressed={selected}
    >
      {token.word}
      {mode === 'technical' && (
        <span className={`conf-dot ${cc}`} aria-hidden="true" />
      )}
    </span>
  )
}
