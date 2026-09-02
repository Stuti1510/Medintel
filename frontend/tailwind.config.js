/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#07080A",
          deep: "#0B0D10",
          surface: "#111419",
          elevated: "#171B21",
          border: "#252A32",
          strongBorder: "#343A45",
          text: "#F5F7FA",
          secondary: "#A7AFBA",
          muted: "#737B87"
        },
        ai: {
          DEFAULT: "#6C63FF",
          hover: "#817AFF",
          soft: "#9B95FF",
          glow: "rgba(108, 99, 255, 0.25)"
        },
        semantic: {
          success: "#35C98A",
          warning: "#E9B949",
          critical: "#EF6262",
          info: "#62B5FF"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      borderRadius: {
        'technical': '4px',
        'button': '8px',
        'card': '12px',
        'panel': '16px',
        'hero': '20px'
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-flow': 'glowFlow 6s ease infinite',
      },
      keyframes: {
        glowFlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
