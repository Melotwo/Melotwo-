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
      // Define a custom color palette based on a professional/safety theme.
      colors: {
        'primary': '#0D9488', // Teal/Cyan color for main accents (safety/trust)
        'secondary': '#111827', // Darker color for backgrounds/text
        'accent': '#FCD34D', // Amber/Yellow for alerts or important buttons
      },
      // Add custom shadow for elevated look
      boxShadow: {
        'lg': '0 10px 15px -3px rgba(13, 148, 136, 0.1), 0 4px 6px -2px rgba(13, 148, 136, 0.05)',
      }
    },
  },
  plugins: [],
}
