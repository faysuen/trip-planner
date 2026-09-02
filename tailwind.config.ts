import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1C1B1A",
        paper: "#FAFAF8",
        route: {
          1: "#2F6F5E",
          2: "#B0512B",
          3: "#3A5A9B",
          4: "#8A4B8C",
          5: "#B08900",
          6: "#5E5E5E",
          7: "#A0392F",
        },
        risk: "#C1272D",
      },
      fontFamily: {
        display: ["'Newsreader'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
