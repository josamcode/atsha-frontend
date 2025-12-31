/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#d4b900',
          light: '#e8d768',
          dark: '#9e8b00',
          darko: '#9e8b00',
        },
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'cairo': ['Cairo', 'Inter', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      fontSize: {
        // Responsive fluid typography utilities
        'responsive-xs': ['clamp(0.75rem, 2vw, 0.875rem)', { lineHeight: '1.5' }],
        'responsive-sm': ['clamp(0.875rem, 2.5vw, 1rem)', { lineHeight: '1.5' }],
        'responsive-base': ['clamp(1rem, 3vw, 1.125rem)', { lineHeight: '1.5' }],
        'responsive-lg': ['clamp(1.125rem, 3.5vw, 1.25rem)', { lineHeight: '1.4' }],
        'responsive-xl': ['clamp(1.25rem, 4vw, 1.5rem)', { lineHeight: '1.3' }],
        'responsive-2xl': ['clamp(1.5rem, 4.5vw, 2rem)', { lineHeight: '1.2' }],
        'responsive-3xl': ['clamp(1.875rem, 5vw, 2.5rem)', { lineHeight: '1.2' }],
        'responsive-4xl': ['clamp(2rem, 6vw, 3rem)', { lineHeight: '1.1' }],
      },
    },
  },
  plugins: [],
}
