/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#08090D',
          surface: '#0F1117',
          elevated: '#151821',
        },
        gold: {
          DEFAULT: '#E5C07B',
          light: '#F5D79E',
          dark: '#C8A359',
          deep: '#9E7D32',
        },
        titanium: {
          DEFAULT: '#8E8E93',
          light: '#94A3B8',
          dark: '#64748B',
        },
      },
      fontFamily: {
        sans: [
          'Outfit',
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          'sans-serif',
        ],
        syne: ['Syne', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
