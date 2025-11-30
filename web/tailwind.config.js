/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7f7',
          100: '#fceeed',
          200: '#f9d9d9',
          300: '#f4b8b9',
          400: '#F2B2B4', // Main accent
          500: '#e88a8d',
          600: '#d75f63',
          700: '#b84549',
          800: '#993c3f',
          900: '#7f3639',
        },
        secondary: {
          50: '#f5faf8',
          100: '#daf0e8',
          200: '#C7E9D6', // Mint
          300: '#9dd6bc',
          400: '#6fbd9c',
          500: '#4aa07f',
          600: '#3a8266',
          700: '#316853',
          800: '#2b5344',
          900: '#264539',
        },
        neutral: {
          50: '#FAF8F5', // Background
          100: '#f3f0eb',
          200: '#e8e3db',
          300: '#d6cfc3',
          400: '#bfb5a5',
          500: '#a89b87',
          600: '#8f8170',
          700: '#756a5c',
          800: '#5A4747', // Text
          900: '#4F3C3C',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Comic Neue', 'cursive'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'heart': 'heart 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        heart: {
          '0%': { transform: 'scale(0) translateY(0)', opacity: 1 },
          '100%': { transform: 'scale(1.5) translateY(-50px)', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
}
