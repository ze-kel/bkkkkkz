/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./packages/renderer/index.html', './packages/renderer/src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/container-queries')],
};
