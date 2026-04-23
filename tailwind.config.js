/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'Kaisei Decol'", "serif"],
        hand: ["'Klee One'", "cursive"],
      },
      colors: {
        paper: "#FFFEF8",
        sumi: "#1A1915",
        shuiro: "#C0392B",
        kinari: "#F5F0E1",
        sand: "#E8E2D0",
      },
    },
  },
  plugins: [],
};
