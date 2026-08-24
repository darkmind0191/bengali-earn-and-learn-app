/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        bengali: ['"Noto Sans Bengali"', '"Hind Siliguri"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eefdf5',
          100: '#d6fae9',
          200: '#b4f3d6',
          300: '#80e7bc',
          400: '#48d39c',
          500: '#20b882',
          600: '#119a6a',
          700: '#107a56',
          800: '#106047',
          900: '#0d4f3c',
          950: '#062c20',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
    },
  },
  plugins: [],
};
