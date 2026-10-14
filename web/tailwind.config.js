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
        primary: '#077A66',
        'primary-dark': '#103B34',
        accent: '#047A80',
        surface: '#E8F4F0',
        background: '#F6F8F7',
        muted: '#5F6F6B',
        border: '#CFE0DA',
        // Contorno de campos de formulário (contraste mínimo de 3:1, WCAG 1.4.11)
        input: '#7F948D',
        danger: {
          DEFAULT: '#B42318',
          soft: '#FEF3F2',
        },
        warning: {
          DEFAULT: '#8F5B12',
          soft: '#FDF5E6',
        },
        success: {
          DEFAULT: '#077A66',
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
