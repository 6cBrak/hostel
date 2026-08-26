/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fbf3df',
          100: '#f3e3b8',
          200: '#e9ce86',
          300: '#ddb454',
          400: '#cc9a2e',
          500: '#b8860b',
          600: '#8a6509',
          700: '#4a3616',
          800: '#241a10',
          900: '#14100b',
        },
      },
    },
  },
  plugins: [],
}

