/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#002F34',
          mint: '#97D8D0',
          lime: '#D7F1B5',
          coral: '#F1B5B9',
          lavender: '#B5BFF1',
          pink: '#F1B5EF',
          surface: '#F4F7F6',
          card: '#FFFFFF',
          muted: '#7A8C8E',
        },
        primary: {
          DEFAULT: '#002F34',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#97D8D0',
          500: '#00bba6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#002F34',
          900: '#001e22',
        },
        'primary-container': '#ccfbf1',
        'on-primary': '#ffffff',
        'on-primary-container': '#002F34',

        secondary: {
          DEFAULT: '#97D8D0',
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          700: '#0369a1',
        },

        background: '#F3F7F6',
        surface: '#FFFFFF',
        'on-surface': '#002F34',
        'on-surface-variant': '#7A8C8E',

        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '2.5xl': '20px',
        '3xl': '28px',
        '4xl': '36px',
      },
      boxShadow: {
        soft: '0 8px 30px -4px rgba(0, 47, 52, 0.04)',
        card: '0 10px 25px -3px rgba(0, 47, 52, 0.03), 0 4px 6px -2px rgba(0, 47, 52, 0.02)',
        float: '0 20px 40px -12px rgba(0, 47, 52, 0.12)',
        pill: '0 4px 14px rgba(0, 47, 52, 0.18)',
      },
    },
  },
  plugins: [],
};
