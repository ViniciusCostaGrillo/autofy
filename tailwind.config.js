/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./features/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#1E293B',
        secondary: '#334155',
        accent: '#3B82F6',
        success: '#10B981',
        danger: '#EF4444',
      }
    },
  },
  plugins: [],
}
