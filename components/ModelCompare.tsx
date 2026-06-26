'use client'

import { useState } from 'react'
import type { ModelId, TokenData } from '@/lib/types'
import { MODELS } from '@/lib/types'
import TokenWord from './TokenWord'
import DistributionPanel from './DistributionPanel'
import { confidenceClass } from '@/lib/distributions'

interface ModelResult {
  model: ModelId
  tokens: TokenData[]
  loading: boolean
  error: string | null
}

interface Props {
  prompt: string
  temperature: number
  mode: 'technical' | 'accessible'
}

async function fetchDistributions(
  prompt: string,
  model: ModelId,
  temperature: number
): Promise<TokenData[]> {
  const res = await fetch('/api/distributions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'distributions', prompt, model, temperature }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.tokens
}

export default function ModelCompare({ prompt, temperature, mode }: Props) {
  const [modelA, setModelA] = useState<ModelId>('claude-3-5-haiku-20241022')
  const [modelB, setModelB] = useState<ModelId>('claude-3-5-sonnet-20241022')
  const [resultA, setResultA] = useState<ModelResult | null>(null)
  const [resultB, setResultB] = useState<ModelResult | null>(null)
  const [selectedA, setSelectedA] = useState<number | null>(null)
  const [selectedB, setSelectedB] = useState<number | null>(null)
  const [running, setRunning] = useState(false)

  async function runComparison() {
    if (!prompt.trim()) return
    setRunning(true)
    setSelectedA(null)
    setSelectedB(null)
    setResultA({ model: modelA, tokens: [], loading: true, error: null })
    setResultB({ model: modelB, tokens: [], loading: true, error: null })

    const [resA, resB] = await Promise.allSettled([
      fetchDistributions(prompt, modelA, temperature),
      fetchDistributions(prompt, modelB, temperature),
    ])

    setResultA({
      model: modelA,
      tokens: resA.status === 'fulfilled' ? resA.value : [],
      loading: false,
      error: resA.status === 'rejected' ? String(resA.reason) : null,
    })
    setResultB({
      model: modelB,
      tokens: resB.status === 'fulfilled' ? resB.value : [],
      loading: false,
      error: resB.status === 'rejected' ? String(resB.reason) : null,
    })
    setRunning(false)
  }

  const modelInfo = (id: ModelId) => MODELS.find((m) => m.id === id)

  return (
    <div className="space-y-4">
      {/* Model selectors */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { val: modelA, set: setModelA, label: 'Model A' },
          { val: modelB, set: setModelB, label: 'Model B' },
        ] as const).map(({ val, set, label }) => (
          <div key={label}>
            <label className="block text-xs text-neutral-400 uppercase tracking-wide mb-1">
              {label}
            </label>
            <select
              value={val}
              onChange={(e) => set(e.target.value as ModelId)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            {modelInfo(val) && (
              <p className="text-xs text-neutral-400 mt-1">{modelInfo(val)!.description}</p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={runComparison}
        disabled={running || !prompt.trim()}
        className="w-full py-2 px-4 border border-neutral-300 rounded-lg text-sm font-medium bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {running ? 'Running comparison…' : 'Compare models →'}
      </button>

      {/* Results side by side */}
      {(resultA || resultB) && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { result: resultA, selected: selectedA, setSelected: setSelectedA, label: 'Model A' },
            { result: resultB, selected: selectedB, setSelected: setSelectedB, label: 'Model B' },
          ].map(({ result, selected, setSelected, label }) => (
            <div key={label} className="space-y-3">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                {label} — {result ? modelInfo(result.model)?.label : ''}
              </p>

              {result?.loading && (
                <div className="text-sm text-neutral-400 italic animate-pulse">Generating…</div>
              )}

              {result?.error && (
                <p className="text-sm text-red-500">{result.error}</p>
              )}

              {result && !result.loading && result.tokens.length > 0 && (
                <>
                  <div className="bg-white border border-neutral-200 rounded-xl p-4 leading-loose">
                    <div className="flex flex-wrap gap-1">
                      {result.tokens.map((t, i) => (
                        <TokenWord
                          key={i}
                          token={t}
                          index={i}
                          selected={selected === i}
                          mode={mode}
                          onClick={(idx) => setSelected(selected === idx ? null : idx)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Average confidence comparison */}
                  <div className="text-xs text-neutral-500 space-y-1">
                    {['high', 'mid', 'low'].map((cls) => {
                      const count = result.tokens.filter(
                        (t) => confidenceClass(t.dist[0].prob) === cls
                      ).length
                      const pct = Math.round((count / result.tokens.length) * 100)
                      const colors: Record<string, string> = {
                        high: 'text-emerald-600',
                        mid: 'text-amber-600',
                        low: 'text-red-500',
                      }
                      const labels: Record<string, string> = {
                        high: 'High confidence',
                        mid: 'Medium',
                        low: 'Contested',
                      }
                      return (
                        <span key={cls} className={`mr-3 ${colors[cls]}`}>
                          {labels[cls]}: {pct}%
                        </span>
                      )
                    })}
                  </div>

                  {selected !== null && result.tokens[selected] && (
                    <DistributionPanel
                      token={result.tokens[selected]}
                      tokenIndex={selected}
                      totalTokens={result.tokens.length}
                      context={result.tokens
                        .slice(0, selected)
                        .map((t) => t.word)
                        .join('')}
                      model={result.model}
                      mode={mode}
                      onClose={() => setSelected(null)}
                    />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
