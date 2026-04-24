/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'apple-blue': '#007AFF',
        'apple-green': '#34C759',
        'apple-red': '#FF3B30',
        'apple-orange': '#FF9500',
        'apple-gray': {
          50: '#F5F5F7',
          100: '#E8E8ED',
          200: '#D2D2D7',
          400: '#86868B',
          600: '#6E6E73',
          900: '#1D1D1F',
        }
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      },
      backdropBlur: {
        'apple': '20px',
      },
      boxShadow: {
        'apple-card': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'apple-hover': '0 20px 40px -12px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
}
