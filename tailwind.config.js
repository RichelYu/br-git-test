/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#FF6B9D',
          'pink-deep': '#EC4899',
          purple: '#A78BFA',
          sky: '#5EC8F2',
          peach: '#FFB088',
          cream: '#FFF9FB',
        }
      },
      fontFamily: {
        round: ['"Baloo 2"', '"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pop': 'pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    }
  },
  plugins: []
}
