/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)',
          dark: 'rgb(var(--c-primary-dark) / <alpha-value>)',
          light: 'rgb(var(--c-primary-light) / <alpha-value>)',
        },
        'on-primary': 'rgb(var(--c-on-primary) / <alpha-value>)',
        page: 'rgb(var(--c-page) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        subtle: 'rgb(var(--c-subtle) / <alpha-value>)',
        content: {
          DEFAULT: 'rgb(var(--c-content) / <alpha-value>)',
          soft: 'rgb(var(--c-content-soft) / <alpha-value>)',
          faint: 'rgb(var(--c-content-faint) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--c-line) / <alpha-value>)',
          strong: 'rgb(var(--c-line-strong) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--c-success) / <alpha-value>)',
          container: 'rgb(var(--c-success-container) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--c-warning) / <alpha-value>)',
          container: 'rgb(var(--c-warning-container) / <alpha-value>)',
        },
        'on-warning': 'rgb(var(--c-on-warning) / <alpha-value>)',
        error: {
          DEFAULT: 'rgb(var(--c-error) / <alpha-value>)',
          container: 'rgb(var(--c-error-container) / <alpha-value>)',
        },
        'on-error': 'rgb(var(--c-on-error) / <alpha-value>)',
        info: {
          DEFAULT: 'rgb(var(--c-info) / <alpha-value>)',
          container: 'rgb(var(--c-info-container) / <alpha-value>)',
        },
        accent: {
          green: 'rgb(var(--c-accent-green) / <alpha-value>)',
          red: 'rgb(var(--c-accent-red) / <alpha-value>)',
          yellow: 'rgb(var(--c-accent-yellow) / <alpha-value>)',
          blue: 'rgb(var(--c-accent-blue) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', 'ui-sans-serif', 'system-ui', '-apple-system', '"PingFang TC"', '"Microsoft JhengHei"', 'sans-serif'],
        title: ['"Libre Baskerville"', 'Georgia', 'ui-serif', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
