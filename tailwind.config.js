/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'ui-sans-serif',
          '-apple-system',
          'system-ui',
          '"Segoe UI"' /* Добавляем кавычки, так как есть пробел */,
          'Helvetica',
          '"Apple Color Emoji"' /* Кавычки */,
          'Arial',
          'sans-serif',
          '"Segoe UI Emoji"' /* Кавычки */,
          '"Segoe UI Symbol"' /* Кавычки */,
          '"Noto Color Emoji"' /* Кавычки */,
        ],
      },
    },
  },
  plugins: [],
}