/**
 * PostCSS Configuration
 * Used by Vite during the build process to process CSS files.
 */
export default {
  plugins: {
    // 1. Tailwind is run first to generate all utility classes
    'tailwindcss': {},
    // 2. Autoprefixer adds vendor prefixes (e.g., -webkit-) for browser compatibility
    'autoprefixer': {},
  },
}
