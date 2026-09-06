/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#dde6f2',
          200: '#bfd2e6',
          300: '#93b4d4',
          400: '#6190bf',
          500: '#3e72a8',
          600: '#2d5a8c',
          700: '#264871',
          800: '#223d5e',
          900: '#14253b',
          950: '#0b1624',
        },
        slate: {
          850: '#15202b',
          950: '#080d14',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
