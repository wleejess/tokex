export type ModelId = 'claude-3-5-haiku-20241022' | 'claude-3-5-sonnet-20241022' | 'claude-3-opus-20240229'

export interface TokenAlternative {
  word: string
  prob: number
}

export interface TokenData {
  word: string
  dist: TokenAlternative[]
}

export interface GenerateResult {
  tokens: TokenData[]
  model: ModelId
  prompt: string
  temperature: number
}

export const MODELS: { id: ModelId; label: string; description: string }[] = [
  {
    id: 'claude-3-5-haiku-20241022',
    label: 'Claude 3.5 Haiku',
    description: 'Fast, efficient — distributions show less hedging',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    label: 'Claude 3.5 Sonnet',
    description: 'Balanced — recommended starting point',
  },
  {
    id: 'claude-3-opus-20240229',
    label: 'Claude 3 Opus',
    description: 'Most deliberate — distributions show more nuance',
  },
]

export const BENCHMARK_PROMPTS: { label: string; category: string; prompt: string }[] = [
  {
    label: 'Bat & Ball',
    category: 'CRT',
    prompt: 'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?',
  },
  {
    label: 'Nurse',
    category: 'Winogrande',
    prompt: 'The nurse told the patient that she would need to return for a follow-up. Who does "she" refer to?',
  },
  {
    label: 'Capital',
    category: 'MMLU',
    prompt: 'What is the capital of the country that contains the most UNESCO World Heritage Sites?',
  },
  {
    label: 'Ethics',
    category: 'BBH',
    prompt: 'Is it ethical to break a minor rule if doing so prevents significant harm to others?',
  },
  {
    label: 'Haiku',
    category: 'Creative',
    prompt: 'Write a haiku about a language model predicting the next word.',
  },
  {
    label: 'Trolley Problem',
    category: 'Philosophy',
    prompt: 'Would you pull the lever in the trolley problem? Explain your reasoning briefly.',
  },
]
