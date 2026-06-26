'use client'

import { useState, useCallback } from 'react'
import type { TokenData } from '@/lib/types'
import { entropy, confidenceLabel, remainderNote } from '@/lib/distributions'

interface Props {
  token: TokenData
  tokenIndex: number
  totalTokens: number
  context: string
  model: string
  mode: 'technical' | 'accessible'
  onClose: () => void
}

export default function DistributionPanel({
  token,
  tokenIndex,
  totalTokens,
  context,
  model,
  mode,
  onClose,
}: Props) {
  const [whyText, setWhyText] = useState<string | null>(null)
  const [whyLoading, setWhyLoading] = useState(false)
  const [activeAlt, setActiveAlt] = useState<string | null>(null)

  const topProb = token.dist[0].prob
  const confLabel = confidenceLabel(topProb, mode)
  const note = remainderNote(token.dist)
  const ent = entropy(token.dist)
  const shownAlts = token.dist.filter((d) => d.prob >= 2).length - 1

  const fetchWhy = useCallback(
    async (alt: string) => {
      setActiveAlt(alt)
      setWhyLoading(true)
      setWhyText(null)
      try {
        const res = await fetch('/api/distributions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'why',
            context,
            chosen: token.dist[0].word.trim(),
            alt: alt.trim(),
            mode,
            model,
          }),
        })
        const data = await res.json()
        setWhyText(data.explanation ?? data.error ?? 'No explanation returned.')
      } catch {
        setWhyText('Could not fetch explanation.')
      } finally {
        setWhyLoading(false)
      }
    },
    [context, token, mode, model]
  )

  return (
    <div className="fade-in bg-neutral-50 border border-neutral-200 rounded-xl p-5">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">
            {mode === 'technical' ? 'Token distribution' : 'What else could this word have been?'}
          </p>
          <p className="font-mono text-2xl font-medium text-neutral-900">
            &ldquo;{token.word.trim()}&rdquo;
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {confLabel} &middot; token {tokenIndex + 1} of {totalTokens}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 text-xl leading-none p-1"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      {/* Distribution bars */}
      <div className="space-y-2 mb-3">
        {token.dist.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* Word label */}
            <span
              className={`font-mono text-sm min-w-[100px] ${
                i === 0
                  ? 'font-medium text-emerald-700'
                  : 'text-neutral-600 cursor-pointer hover:underline'
              }`}
              onClick={i > 0 ? () => fetchWhy(d.word) : undefined}
              title={i > 0 ? `Why "${token.dist[0].word.trim()}" vs "${d.word.trim()}"?` : undefined}
            >
              {i === 0 ? '✓ ' : ''}{d.word.trim()}
            </span>

            {/* Bar */}
            <div className="prob-bar-track">
              <div
                className={`prob-bar-fill ${i === 0 ? 'chosen' : 'alt'}`}
                style={{ width: `${Math.round(d.prob)}%` }}
              />
            </div>

            {/* Percent */}
            <span className="text-xs text-neutral-500 min-w-[34px] text-right">
              {Math.round(d.prob)}%
            </span>
          </div>
        ))}
      </div>

      {/* Remainder note */}
      {note && (
        <p className="text-xs text-neutral-400 italic border-t border-neutral-200 pt-2 mb-3">
          {note}
        </p>
      )}

      {/* Technical metrics */}
      {mode === 'technical' && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Entropy', value: `${ent.toFixed(2)} bits` },
            { label: 'Top-1 prob', value: `${Math.round(topProb)}%` },
            { label: 'Shown alts', value: shownAlts.toString() },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white border border-neutral-200 rounded-lg px-3 py-2"
            >
              <p className="text-[11px] text-neutral-400 mb-0.5">{label}</p>
              <p className="text-sm font-mono font-medium">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Why section */}
      <div className="border-t border-neutral-200 pt-3">
        <p className="text-[11px] text-neutral-400 uppercase tracking-wide mb-2">
          {mode === 'technical' ? 'Why this token?' : 'Why did the model choose this word?'}
        </p>

        {!activeAlt && !whyText && (
          <p className="text-sm text-neutral-400 italic">
            Click an alternative word above to get a head-to-head explanation.
          </p>
        )}

        {whyLoading && (
          <p className="text-sm text-neutral-400 italic animate-pulse">
            Asking Claude…
          </p>
        )}

        {whyText && !whyLoading && (
          <div className="fade-in">
            {activeAlt && (
              <p className="text-xs text-neutral-400 mb-1.5 font-mono">
                &ldquo;{token.dist[0].word.trim()}&rdquo; vs &ldquo;{activeAlt.trim()}&rdquo;
              </p>
            )}
            <p className="text-sm text-neutral-700 leading-relaxed">{whyText}</p>
          </div>
        )}
      </div>
    </div>
  )
}
