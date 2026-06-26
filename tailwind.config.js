/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        high: { bg: 'rgba(29,158,117,0.1)', border: 'rgba(29,158,117,0.3)', dot: '#1D9E75', text: '#0F6E56' },
        mid:  { bg: 'rgba(186,117,23,0.09)', border: 'rgba(186,117,23,0.25)', dot: '#BA7517', text: '#854F0B' },
        low:  { bg: 'rgba(226,75,74,0.09)', border: 'rgba(226,75,74,0.25)', dot: '#E24B4A', text: '#A32D2D' },
      },
    },
  },
  plugins: [],
}
