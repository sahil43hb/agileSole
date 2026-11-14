import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1FA64A",
          dark: "#15803D",
          light: "#4ADE80",
          mint: "#C8EBD8",
          mist: "#E8F7EE",
        },
        ink: {
          DEFAULT: "#111111",
          muted: "#5C5C5C",
          faint: "#8A8A8A",
        },
        paper: {
          DEFAULT: "#FFFEFB",
          warm: "#F6F3EE",
          line: "#E6E1D8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        urdu: ["var(--font-nastaliq)", "Noto Nastaliq Urdu", "serif"],
      },
      boxShadow: {
        none: "none",
      },
      maxWidth: {
        site: "90rem",
      },
    },
  },
  plugins: [],
};

export default config;
