'use client'

import { useState, useRef, useCallback } from 'react'
import type { ModelId, TokenData } from '@/lib/types'
import { MODELS, BENCHMARK_PROMPTS } from '@/lib/types'
import TokenWord from './TokenWord'
import DistributionPanel from './DistributionPanel'
import ModelCompare from './ModelCompare'

type Phase = 'idle' | 'streaming' | 'distributing' | 'ready' | 'error'
type ViewMode = 'explorer' | 'compare'

export default function TokenExplorer() {
  const [apiKey, setApiKey] = useState('')
  const [keyVisible, setKeyVisible] = useState(false)
  const [prompt, setPrompt] = useState(BENCHMARK_PROMPTS[3].prompt)
  const [model, setModel] = useState<ModelId>('claude-3-5-sonnet-20241022')
  const [temperature, setTemperature] = useState(0.7)
  const [mode, setMode] = useState<'technical' | 'accessible'>('technical')
  const [viewMode, setViewMode] = useState<ViewMode>('explorer')

  const [phase, setPhase] = useState<Phase>('idle')
  const [streamText, setStreamText] = useState('')
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [selectedToken, setSelectedToken] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(apiKey.trim() ? { 'x-anthropic-key': apiKey.trim() } : {}),
  }

  const generate = useCallback(async () => {
    if (!prompt.trim()) return
    if (!apiKey.trim()) {
      setError('Please enter your Anthropic API key above to generate a response.')
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setPhase('streaming')
    setStreamText('')
    setTokens([])
    setSelectedToken(null)
    setError(null)

    // Phase 1: stream visible text
    try {
      const res = await fetch('/api/stream', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ prompt, model, temperature }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Stream error ${res.status}`)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          full += chunk
          setStreamText(full)
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
      setError(`Stream failed: ${(err as Error).message}`)
      setPhase('error')
      return
    }

    // Phase 2: fetch token distributions
    setPhase('distributing')
    try {
      const res = await fetch('/api/distributions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ type: 'distributions', prompt, model, temperature }),
        signal: abortRef.current.signal,
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTokens(data.tokens)
      setPhase('ready')
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
      setError(`Distribution fetch failed: ${(err as Error).message}`)
      setPhase('error')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, model, temperature, apiKey])

  const handleTokenClick = (idx: number) => {
    setSelectedToken(selectedToken === idx ? null : idx)
  }

  const selectedModel = MODELS.find((m) => m.id === model)
  const keyEntered = apiKey.trim().length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tokex</h1>
        <p className="text-sm text-neutral-500">
          Watch a language model choose each word — inspect probability distributions, entropy, and why one token beat another.
        </p>
      </div>

      {/* API Key input */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 space-y-2">
        <label className="block text-xs text-neutral-400 uppercase tracking-wide">
          Anthropic API Key — required
        </label>
        <div className="flex gap-2 items-center">
          <input
            type={keyVisible ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="flex-1 border border-neutral-200 rounded-lg px-3 py-1.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={() => setKeyVisible(!keyVisible)}
            className="text-xs text-neutral-400 hover:text-neutral-600 px-2 py-1.5 border border-neutral-200 rounded-lg bg-white"
          >
            {keyVisible ? 'Hide' : 'Show'}
          </button>
          {keyEntered && (
            <span className="text-xs text-emerald-600 font-medium whitespace-nowrap">
              ✓ Key set
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400">
          Your key is never stored — it&apos;s sent only with each request and stays in your browser.
          Get one at{' '}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-600"
          >
            console.anthropic.com
          </a>
          .
        </p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 border-b border-neutral-200 pb-1">
        {(['explorer', 'compare'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setViewMode(v)}
            className={`text-sm px-3 py-1.5 rounded-t-lg border-b-2 transition-colors ${
              viewMode === v
                ? 'border-neutral-900 text-neutral-900 font-medium'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {v === 'explorer' ? 'Explorer' : 'Compare models'}
          </button>
        ))}
      </div>

      {/* Controls bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Mode toggle */}
        <div>
          <label className="block text-xs text-neutral-400 uppercase tracking-wide mb-1">View</label>
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden bg-white">
            {(['technical', 'accessible'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 text-sm py-1.5 transition-colors ${
                  mode === m
                    ? 'bg-neutral-900 text-white font-medium'
                    : 'text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                {m === 'technical' ? 'Technical' : 'Accessible'}
              </button>
            ))}
          </div>
        </div>

        {/* Model picker */}
        <div>
          <label className="block text-xs text-neutral-400 uppercase tracking-wide mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as ModelId)}
            className="w-full border border-neutral-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          {selectedModel && (
            <p className="text-xs text-neutral-400 mt-0.5">{selectedModel.description}</p>
          )}
        </div>

        {/* Temperature */}
        <div>
          <label className="block text-xs text-neutral-400 uppercase tracking-wide mb-1">
            Temperature — {temperature.toFixed(1)}
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full accent-neutral-800"
          />
          <div className="flex justify-between text-xs text-neutral-400 mt-0.5">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>
      </div>

      {/* Prompt area */}
      <div className="space-y-2">
        <label className="block text-xs text-neutral-400 uppercase tracking-wide">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Type a prompt or pick a benchmark below…"
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 leading-relaxed"
        />
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-neutral-400">Benchmarks:</span>
          {BENCHMARK_PROMPTS.map((b) => (
            <button
              key={b.label}
              onClick={() => setPrompt(b.prompt)}
              className="text-xs px-2.5 py-1 border border-neutral-200 rounded-full bg-white hover:border-neutral-400 text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <span className="text-neutral-400">{b.category}:</span> {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Explorer view */}
      {viewMode === 'explorer' && (
        <div className="space-y-4">
          <button
            onClick={generate}
            disabled={phase === 'streaming' || phase === 'distributing' || !prompt.trim()}
            className="px-5 py-2 border border-neutral-300 rounded-lg text-sm font-medium bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {phase === 'streaming'
              ? 'Streaming response…'
              : phase === 'distributing'
              ? 'Fetching distributions…'
              : 'Generate response →'}
          </button>

          {(phase !== 'idle' || tokens.length > 0) && (
            <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">
                {phase === 'ready'
                  ? mode === 'technical'
                    ? 'Response — click any word to inspect token distribution'
                    : 'Response — click any word to see what else the model was considering'
                  : phase === 'streaming'
                  ? 'Streaming…'
                  : 'Loading distributions…'}
              </p>

              {(phase === 'streaming' || phase === 'distributing') && (
                <div className="text-base leading-loose text-neutral-800">
                  {streamText}
                  {phase === 'streaming' && <span className="cursor-blink" aria-hidden="true" />}
                  {phase === 'distributing' && (
                    <span className="text-xs text-neutral-400 italic ml-2">
                      overlaying distributions…
                    </span>
                  )}
                </div>
              )}

              {phase === 'ready' && tokens.length > 0 && (
                <>
                  <div className="flex flex-wrap gap-3 text-xs text-neutral-500 pb-2 border-b border-neutral-100">
                    {[
                      { label: mode === 'technical' ? 'High confidence (>60%)' : 'Model was very sure', color: 'bg-emerald-100 border-emerald-300' },
                      { label: mode === 'technical' ? 'Medium (20–60%)' : 'A few good options', color: 'bg-amber-100 border-amber-300' },
                      { label: mode === 'technical' ? 'Contested (<20%)' : 'Many competing words', color: 'bg-red-100 border-red-300' },
                    ].map(({ label, color }) => (
                      <span key={label} className="flex items-center gap-1.5">
                        <span className={`inline-block w-3 h-3 rounded border ${color}`} />
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 leading-loose">
                    {tokens.map((t, i) => (
                      <TokenWord
                        key={i}
                        token={t}
                        index={i}
                        selected={selectedToken === i}
                        mode={mode}
                        onClick={handleTokenClick}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {phase === 'error' && error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          {phase === 'ready' && selectedToken !== null && tokens[selectedToken] && (
            <DistributionPanel
              token={tokens[selectedToken]}
              tokenIndex={selectedToken}
              totalTokens={tokens.length}
              context={tokens.slice(0, selectedToken).map((t) => t.word).join('')}
              model={model}
              mode={mode}
              onClose={() => setSelectedToken(null)}
              apiKey={apiKey}
            />
          )}
        </div>
      )}

      {viewMode === 'compare' && (
        <ModelCompare
          prompt={prompt}
          temperature={temperature}
          mode={mode}
          apiKey={apiKey}
        />
      )}

      <p className="text-xs text-neutral-400 leading-relaxed border-t border-neutral-100 pt-4">
        <strong className="font-medium text-neutral-500">Note:</strong> Distributions are Claude&apos;s self-estimated token probabilities, not true softmax logprobs (Anthropic does not currently expose logprobs via API). They reflect genuine linguistic reasoning but are approximations. Entropy values are calculated from the reported top-5 distribution.
      </p>
    </div>
  )
}
