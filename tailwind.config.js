/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
