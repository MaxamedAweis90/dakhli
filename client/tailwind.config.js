/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        canvas: '#0D0E12',
        card: {
          DEFAULT: '#13151B',
          elevated: '#1A1D26',
          tile: '#222530',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.05)',
        },
        surface: {
          card: '#13151B',
          elevated: '#1A1D26',
          subtle: 'rgba(255, 255, 255, 0.05)',
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
