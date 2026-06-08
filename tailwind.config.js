/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Active Wellness 핵심 테마
        "active-lime": "#8DE317",
        "active-lime-dark": "#76c40d",
        "active-orange": "#F47B20",
        "soft-white": "#FAF9F6",
        "midnight-forest": "#0B1B10",
        "forest-deep": "#0d2818",
        // 품종별 테마 컬러
        "variety-picual": "#1B9E6B",      // 에메랄드
        "variety-arbequina": "#E8B547",   // 골든옐로우
        "variety-koroneiki": "#8DE317",   // 밝은 라임
        "variety-blending": "#5BA84F",    // 데일리 그린
        "variety-avocado": "#1E4D2B",     // 딥그린
        // 레거시 호환
        "vita-green": "#8DE317",
        "vita-green-deep": "#0B1B10",
        "vita-gold": "#E8B547",
        "vita-cream": "#FAF9F6",
        "vita-ivory": "#FAF9F6",
        "vita-charcoal": "#0B1B10",
        "vita-stone": "#6B7280",
        charcoal: "#0B1B10",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans-kr)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
