/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0B0F19',
        surface: {
          card: '#111827',
          elevated: '#1E293B',
          subtle: '#1F2937',
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
        card: '1rem',
        pill: '9999px',
      },
    },
  },
  plugins: [],
}
