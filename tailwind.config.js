/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0e1a',
          800: '#111827',
          700: '#1a2035',
          600: '#232b3e',
          500: '#2d3650',
        },
        electric: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bcd8ff',
          300: '#8ebeff',
          400: '#5899ff',
          500: '#3b76ff',
          600: '#2554f5',
          700: '#1d3fe1',
          800: '#1e33b6',
          900: '#1e308f',
        },
        emergency: {
          red: '#ef4444',
          orange: '#f97316',
          yellow: '#eab308',
        }
      },
      animation: {
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'flash': 'flash 1s ease-in-out infinite',
      },
      keyframes: {
        flash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        }
      }
    },
  },
  plugins: [],
}
