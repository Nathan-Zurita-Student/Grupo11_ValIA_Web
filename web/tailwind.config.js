/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ECF7F2',
          100: '#D6EFE5',
          400: '#3CB68C',
          500: '#1D9E75',
          600: '#0F6E56',
          700: '#0A5443',
        },
        cream: '#FAF8F3',
        ink: '#1A1B19',
        urgency: {
          green: '#1D9E75',
          amber: '#E0962B',
          red: '#DB4A45',
          gone: '#8A8A82',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 12px -4px rgba(15, 110, 86, 0.12)',
        lift: '0 12px 32px -12px rgba(15, 110, 86, 0.25)',
      },
    },
  },
  plugins: [],
};
