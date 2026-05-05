import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: "#FFF8F0",
        pink: "#F4A7B9",
        lavender: "#C9B8E8",
        mint: "#B8E4D8",
        yellow: "#F9E2AE",
        charcoal: "#2D2D2D",
      },
    },
  },
  plugins: [],
};
export default config;
