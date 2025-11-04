/** @type {import('tailwindcss').Config} */
export default {
  // We specify the files where Tailwind should look for classes to optimize the output CSS bundle.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Define a custom font family for consistency.
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      // Updated Color Palette based on user request
      colors: {
        'brand-blue': '#003087',      // Deep Blue (Header Background / Primary)
        'highlight-yellow': '#FFB81C', // Safety Yellow (CTA / Accents)
        'steel-gray': '#4A4A4A',      // Body Text Color
        'cert-teal': '#006D77',       // Certification Badges
        'white': '#FFFFFF',
      },
      // Custom shadow reflecting the brand-blue color
      boxShadow: {
        'lg': '0 10px 15px -3px rgba(0, 48, 135, 0.1), 0 4px 6px -2px rgba(0, 48, 135, 0.05)',
      }
    },
  },
  plugins: [],
}
