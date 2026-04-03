/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./features/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#121212', // Pure Spotify Dark
        surface: '#1E1E1E',   // Slightly elevated card dark
        surfaceLight: '#282828', // Hover/Active states
        primary: '#1DB954',   // Spotify Neon Green
        secondary: '#3B82F6', // Waze Bright Blue
        accent: '#10B981',    // Emerald
        danger: '#E91429',    // Vibrant Red
        textMain: '#FFFFFF',
        textMuted: '#B3B3B3', // Spotify Gray Text
      }
    },
  },
  plugins: [],
}
