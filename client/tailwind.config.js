/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#111215',
        card: {
          DEFAULT: '#17181D',
          elevated: '#1E2027',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.02)',
        },
        surface: {
          card: '#17181D',
          elevated: '#1E2027',
          subtle: 'rgba(255, 255, 255, 0.02)',
        },
        brand: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          muted: 'rgba(245, 158, 11, 0.15)',
        },
        status: {
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
        card: '24px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
}
