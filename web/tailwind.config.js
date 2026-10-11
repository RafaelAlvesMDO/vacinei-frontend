/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Identidade visual do Vacinei!? (ver docs/DESIGN.md)
      colors: {
        primary: '#087F6B',
        'primary-dark': '#103B34',
        accent: '#03A1A9',
        surface: '#E8F4F0',
        background: '#F6F8F7',
        muted: '#5F6F6B',
        border: '#CFE0DA',
        danger: {
          DEFAULT: '#B42318',
          soft: '#FEF3F2',
        },
        warning: {
          DEFAULT: '#B7791F',
          soft: '#FDF5E6',
        },
        success: {
          DEFAULT: '#087F6B',
          soft: '#E8F4F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
