import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "rgb(var(--cream-rgb) / <alpha-value>)",
        oxblood: "rgb(var(--oxblood-rgb) / <alpha-value>)",
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        brass: "rgb(var(--brass-rgb) / <alpha-value>)",
        moss: "rgb(var(--moss-rgb) / <alpha-value>)",
        shadow: "rgb(var(--shadow-rgb) / <alpha-value>)"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        plaque: ["var(--font-plaque)"],
        verdict: ["var(--font-verdict)"]
      },
      boxShadow: {
        paper: "0 18px 45px rgba(14, 10, 8, 0.14)",
        stamp: "0 8px 0 rgba(107, 28, 28, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
