/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Fantavega brand colors
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Role colors (matching Next.js app)
        role: {
          P: '#fbbf24', // Yellow - Portiere
          D: '#22c55e', // Green - Difensore
          C: '#3b82f6', // Blue - Centrocampista
          A: '#ef4444', // Red - Attaccante
        },
        // Dark theme
        dark: {
          bg: '#0f0f1a',
          card: '#1a1a2e',
          border: '#2d2d44',
        },
      },
    },
  },
  plugins: [],
};
