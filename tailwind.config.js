/** @type {import('tailwindcss').Config} */
export default {
  // CRITICAL: Content array specifies every file that Tailwind should scan
  // for class names. It MUST include all your React components and your index.html.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // You can customize fonts, colors, and more here.
    // For now, we'll keep the default Tailwind theme.
    extend: {
      // Example of adding a custom primary color:
      // colors: {
      //   'melotwo-primary': '#0A4C80', 
      // },
    },
  },
  plugins: [],
}
