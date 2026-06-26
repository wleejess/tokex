# Token Explorer

A Next.js app that visualizes how a language model chooses each word — showing token-level probability distributions, entropy, and head-to-head explanations of why one word beat another.

## What it does

- **Stream** a live response from Claude word-by-word
- **Overlay** token probability distributions once the response completes
- **Inspect** any token: see the top-5 alternatives, a probability bar chart, entropy, and ask Claude why it chose one word over another
- **Compare** two Claude models side-by-side on the same prompt
- **Temperature slider** — watch distributions flatten or sharpen in real time
- **Technical / Accessible** view toggle

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/token-explorer
cd token-explorer
npm install
```

### 2. Add your API key

```bash
cp .env.local.example .env.local
```

Open `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at [console.anthropic.com](https://console.anthropic.com).

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. In the Vercel dashboard, go to **Settings → Environment Variables**
4. Add `ANTHROPIC_API_KEY` with your key value
5. Deploy — Vercel detects Next.js automatically

Your live URL will be something like `https://token-explorer-xyz.vercel.app`.

---

## Architecture

```
token-explorer/
├── app/
│   ├── page.tsx                   # Root page (server component, just mounts explorer)
│   ├── layout.tsx                 # HTML shell, metadata, global font
│   ├── globals.css                # Tailwind + custom token chip styles
│   └── api/
│       ├── stream/route.ts        # Edge route — streams raw text from Claude
│       └── distributions/route.ts # Route — fetches token distributions + why explanations
├── components/
│   ├── TokenExplorer.tsx          # Main stateful component — orchestrates all phases
│   ├── TokenWord.tsx              # Individual clickable token chip
│   ├── DistributionPanel.tsx      # Sidebar panel with bars, entropy, why explanation
│   └── ModelCompare.tsx           # Side-by-side model comparison view
├── lib/
│   ├── types.ts                   # Shared types, model list, benchmark prompts
│   ├── distributions.ts           # Math helpers: entropy, confidence class, formatting
│   └── anthropic.ts               # Prompt templates, system prompts, JSON parser
├── .env.local.example
└── README.md
```

### Two-phase generation

```
User clicks Generate
       │
       ▼
Phase 1: /api/stream
  └─ Streams raw Claude response token-by-token
  └─ User sees text appear live (cursor blinking)
       │
       ▼
Phase 2: /api/distributions
  └─ Sends same prompt to Claude with distribution system prompt
  └─ Claude returns JSON: each token + top-5 alternatives with probabilities
  └─ Frontend overlays colored chips on the streamed text
       │
       ▼
User clicks a token
  └─ DistributionPanel opens
  └─ User clicks an alternative word
  └─ /api/distributions (type=why) fetches head-to-head explanation
```

### On probability accuracy

Distributions are Claude's **self-estimated** probabilities, not true softmax logprobs. Anthropic does not currently expose logprobs via the API. The estimates reflect genuine linguistic reasoning — Claude knows what words compete at each position — but they are approximations, not ground truth.

If you want true logprobs, swap in OpenAI's API (`logprobs: true, top_logprobs: 5` in the request body) and update the distribution route accordingly.

---

## Extending

**Add OpenAI support:**
- Add `OPENAI_API_KEY` to `.env.local`
- Install `openai` package
- Add a new model option in `lib/types.ts`
- In `/api/distributions/route.ts`, branch on model prefix to use real logprobs

**Add shareable URLs:**
- Encode `prompt + model + temperature` as base64 in the URL hash
- On load, parse and pre-fill the form

**Add a "surprising token" highlighter:**
- Flag tokens where `dist[0].prob < 40` — those are the most interesting decision points
- Add a filter toggle to highlight only those tokens
