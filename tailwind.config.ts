import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07050c",
        charcoal: "#12101a",
        panel: "#181521",
        raised: "#201c2c",
        line: "rgba(255,255,255,0.08)",
        pink: { DEFAULT: "#ff2e93", soft: "#ff7ab8", deep: "#c4136b" },
        violet: { DEFAULT: "#8b3dff", soft: "#b48cff", deep: "#5b21b6" },
        sunset: "#ff7a3d",
        emerald: { DEFAULT: "#12b886", soft: "#5eead4", deep: "#0b6e52" },
        gold: { DEFAULT: "#d9a93c", soft: "#f3d27a", deep: "#8f6a1c" },
        muted: "#9b97a8",
      },
      fontFamily: {
        display: ['"Big Shoulders Display"', "Impact", "system-ui", "sans-serif"],
        sans: ["Manrope", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        gta: ["Rajdhani", "Manrope", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(255,46,147,.35), 0 0 24px -4px rgba(255,46,147,.45)",
        gold: "0 0 0 1px rgba(217,169,60,.4), 0 0 28px -6px rgba(217,169,60,.35)",
      },
      keyframes: {
        breathe: { "0%,100%": { opacity: ".75", transform: "scale(1)" }, "50%": { opacity: "1", transform: "scale(1.04)" } },
        rise: { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        breathe: "breathe 7s ease-in-out infinite",
        rise: "rise .8s cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
