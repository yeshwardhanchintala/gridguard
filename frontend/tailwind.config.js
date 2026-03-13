export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        g: {
          950: "#04090f",
          900: "#070d1a",
          800: "#0d1b2e",
          700: "#122340",
          600: "#1a3a5c",
          500: "#1e4d7b",
          blue: "#3b82f6",
          cyan: "#06b6d4",
          glow: "#60a5fa",
        }
      },
      boxShadow: {
        glow:  "0 0 20px rgba(59,130,246,0.25)",
        "glow-red": "0 0 20px rgba(239,68,68,0.3)",
      },
      animation: {
        "fade-up":    "fadeUp 0.3s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        }
      }
    }
  },
  plugins: []
};
