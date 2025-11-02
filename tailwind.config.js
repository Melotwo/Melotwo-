/** @type {import('tailwindcss').Config} */
export default {
  // Specify which files Tailwind should scan for utility classes
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // If you have an HTML chatbot file, include it here
    "./ai_chatbot.html", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
