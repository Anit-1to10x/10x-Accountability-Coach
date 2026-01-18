/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Minimal black & white palette (Gumroad-inspired)
        'oa-bg-primary': 'var(--bg-primary)',
        'oa-bg-secondary': 'var(--bg-secondary)',
        'oa-bg-tertiary': 'var(--bg-tertiary)',
        'oa-text-primary': 'var(--text-primary)',
        'oa-text-secondary': 'var(--text-secondary)',
        'oa-border': 'var(--border)',
        'oa-accent': 'var(--accent)', // Use sparingly
        'oa-accent-hover': 'var(--accent-hover)',
      },
      fontSize: {
        'body': '14px',
        'heading': '18px',
        'title': '24px',
        'hero': '32px',
      },
      fontWeight: {
        'regular': '400',
        'medium': '500',
        'semibold': '600',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'typing': 'typing 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 60%, 100%': { opacity: '0.3' },
          '30%': { opacity: '1' },
        },
      },
      borderWidth: {
        'subtle': '1px',
      },
    },
  },
  plugins: [],
}
