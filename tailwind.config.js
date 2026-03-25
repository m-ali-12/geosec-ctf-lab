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
        display: ['Orbitron', 'monospace'],
      },
      colors: {
        cyber: {
          black: '#080c10',
          dark: '#0d1117',
          panel: '#161b22',
          border: '#21262d',
          green: '#39ff14',
          lime: '#a8ff3e',
          red: '#ff3e3e',
          orange: '#ff8c00',
          blue: '#0095ff',
          muted: '#8b949e',
          text: '#c9d1d9',
        }
      },
      animation: {
        'scan': 'scan 3s linear infinite',
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite',
        'typewriter': 'typewriter 3s steps(40) forwards',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 5px #39ff14, 0 0 10px #39ff14' },
          '50%': { boxShadow: '0 0 20px #39ff14, 0 0 40px #39ff14' },
        },
        flicker: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        }
      }
    },
  },
  plugins: [],
}
