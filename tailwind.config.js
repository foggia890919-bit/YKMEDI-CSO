/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "vita-green": "#2d5016",
        "vita-light": "#f5f3f0",
        "vita-gold": "#d4a574"
      }
    }
  },
  plugins: []
};
