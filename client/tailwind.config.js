/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#00685f',
        'primary-container': '#008378',
        'on-primary': '#ffffff',
        'on-primary-container': '#f4fffc',
        'primary-fixed': '#89f5e7',
        'primary-fixed-dim': '#6bd8cb',
        'on-primary-fixed': '#00201d',
        'on-primary-fixed-variant': '#005049',

        secondary: '#006b5f',
        'secondary-container': '#6df5e1',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#006f64',
        'secondary-fixed': '#71f8e4',
        'secondary-fixed-dim': '#4fdbc8',
        'on-secondary-fixed': '#00201c',
        'on-secondary-fixed-variant': '#005048',

        tertiary: '#006860',
        'tertiary-container': '#248279',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#f3fffc',
        'tertiary-fixed': '#9cf2e8',
        'tertiary-fixed-dim': '#80d5cb',
        'on-tertiary-fixed': '#00201d',
        'on-tertiary-fixed-variant': '#00504a',

        surface: '#faf8ff',
        'surface-bright': '#faf8ff',
        'surface-dim': '#d2d9f4',
        'surface-variant': '#dae2fd',
        'surface-tint': '#006a61',
        'surface-container': '#eaedff',
        'surface-container-low': '#f2f3ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-high': '#e2e7ff',
        'surface-container-highest': '#dae2fd',

        'on-surface': '#131b2e',
        'on-surface-variant': '#3d4947',
        'inverse-surface': '#283044',
        'inverse-on-surface': '#eef0ff',
        'inverse-primary': '#6bd8cb',

        background: '#faf8ff',
        'on-background': '#131b2e',

        outline: '#6d7a77',
        'outline-variant': '#bcc9c6',

        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        code: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        clinical: '0 8px 30px rgba(0, 104, 95, 0.06)',
        'clinical-card': '0 6px 24px rgba(0, 104, 95, 0.05)',
        'clinical-glow': '0 6px 20px rgba(0, 104, 95, 0.28)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
