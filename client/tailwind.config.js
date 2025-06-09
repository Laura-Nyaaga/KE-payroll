/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          // Custom theme colors
          'theme-blue': {
            light: {
              bg: '#ebf5ff',
              text: '#1e40af',
              border: '#93c5fd',
            },
            dark: {
              bg: '#172554',
              text: '#93c5fd',
              border: '#1e40af',
            },
          },
          'theme-green': {
            light: {
              bg: '#f0fdf4',
              text: '#166534',
              border: '#86efac',
            },
            dark: {
              bg: '#14532d',
              text: '#86efac',
              border: '#166534',
            },
          },
          'theme-purple': {
            light: {
              bg: '#f5f3ff',
              text: '#5b21b6',
              border: '#c4b5fd',
            },
            dark: {
              bg: '#2e1065',
              text: '#c4b5fd',
              border: '#5b21b6',
            },
          },
          'theme-orange': {
            light: {
              bg: '#fff7ed',
              text: '#c2410c',
              border: '#fdba74',
            },
            dark: {
              bg: '#7c2d12',
              text: '#fdba74',
              border: '#c2410c',
            },
          },
        },
      },
    },
    plugins: [],
  }