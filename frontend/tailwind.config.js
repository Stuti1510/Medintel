/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          DEFAULT: 'var(--color-indigo)',
          deep: 'var(--color-indigo-deep)',
        },
        paper: 'var(--color-paper)',
        ink: {
          DEFAULT: 'var(--color-ink)',
          muted: 'var(--color-ink-muted)',
          faint: 'var(--color-ink-faint)',
        },
        violet: {
          DEFAULT: 'var(--color-violet)',
        },
        teal: {
          deep: 'var(--color-teal-deep)',
          mid: 'var(--color-teal-mid)',
        },
        hairline: {
          DEFAULT: 'var(--color-hairline)',
          dark: 'var(--color-hairline-dark)',
        },
        'white-muted': 'var(--color-white-muted)',
        'white-faint': 'var(--color-white-faint)',
        status: {
          ready: 'var(--color-status-ready)',
          degraded: 'var(--color-status-degraded)',
          loading: 'var(--color-status-loading)',
          offline: 'var(--color-status-offline)',
          unavailable: 'var(--color-status-offline)',
          error: 'var(--color-status-error)',
        }
      },
      fontFamily: {
        sans: ['"Inter Variable"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      maxWidth: {
        content: '1160px',
      }
    },
  },
  plugins: [],
}
