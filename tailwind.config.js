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
        "vita-green-deep": "#1f3810",
        "vita-gold": "#c8a24a",
        "vita-gold-soft": "#d9bd7e",
        "vita-cream": "#f5f1e8",
        "vita-ivory": "#faf7f0",
        "vita-charcoal": "#2b2b26",
        "vita-stone": "#8a857a",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
