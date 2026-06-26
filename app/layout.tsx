import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Token Explorer — LLM Probability Visualizer',
  description:
    'Visualize how a language model chooses each word — inspect token-level probability distributions, entropy, and alternative token explanations.',
  openGraph: {
    title: 'Token Explorer',
    description: 'See inside an LLM — token by token.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  )
}
