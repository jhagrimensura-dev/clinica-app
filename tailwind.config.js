/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAF5EF',
          100: '#F0E2D0',
          200: '#E8D4BE',
          300: '#D4AF8A',
          400: '#C4975E',
          500: '#9E5A36',
          600: '#8B4F2E',
          700: '#6B3425',
        },
      },
    },
  },
  plugins: [],
}
