/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brewing: {
          amber: '#D97706',
          copper: '#B45309',
          gold: '#F59E0B',
          green: '#059669',
          darkGreen: '#047857',
          red: '#DC2626',
          warning: '#F59E0B',
          success: '#10B981',
          danger: '#EF4444'
        }
      },
      fontFamily: {
        'brewing': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}