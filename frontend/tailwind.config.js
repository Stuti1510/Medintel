/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Three-Canvas System
        indigo: {
          primary: "#1b1938",
          deep: "#0e0c1f",
          surface: "#232047",
          hairline: "#3f3a52",
          muted: "#bcbac9",
          faint: "#5a5772",
        },
        ink: {
          warm: "#292827",
          muted: "#73706d",
          faint: "#9a9794",
        },
        canvas: {
          white: "#ffffff",
          offwhite: "#fafaf8",
          hairline: "#e8e4dd",
        },
        teal: {
          deep: "#0e3030",
          mid: "#155555",
          hairline: "#1c5e5e",
          muted: "#a3cfcf",
        },
        violet: {
          soft: "#c9b4fa",
          light: "#ebe4fd",
        },
        status: {
          ready: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
          info: "#0284c7"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        editorial: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        'content': '1152px',
      },
      borderRadius: {
        'subtle': '4px',
        'button': '8px',
        'card': '12px',
        'pill': '9999px',
      }
    },
  },
  plugins: [],
}
