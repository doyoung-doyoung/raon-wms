/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        raon: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c2d0ff',
          300: '#9cb0ff',
          400: '#7087fd',
          500: '#4f62f7',
          600: '#3a45eb',
          700: '#2f36cf',
          800: '#2a30a8',
          900: '#282e85',
          950: '#1a1d52',
        },
        surface: {
          50:  '#f8f9fc',
          100: '#f1f3f9',
          200: '#e4e8f4',
          800: '#1e2235',
          900: '#141828',
          950: '#0d1020',
        }
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans Thai', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.06)',
        'modal': '0 20px 60px -10px rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}
