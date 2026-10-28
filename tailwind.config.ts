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
        obsidian: {
          950: "#070709",
          DEFAULT: "#0B0B0E",
          900: "#101015",
          850: "#15151D",
          800: "#1C1C26",
          700: "#272736",
          600: "#36364A",
        },
        gold: {
          50: "#FCF9EE",
          100: "#F7F0D4",
          200: "#EEDFA8",
          300: "#E3CB78",
          400: "#D9B84C",
          DEFAULT: "#D4AF37", // Warm Champagne Gold
          500: "#D4AF37",
          600: "#B89225",
          700: "#947219",
          800: "#705313",
          900: "#50390B",
          antique: "#C59B27",
          light: "#F5E298",
          bright: "#FFE484",
          dark: "#8C6B14",
        },
        ivory: {
          DEFAULT: "#FAF8F5",
          soft: "#F2EDE4",
          muted: "#CBC4B7",
          dark: "#9E9788",
        },
        ruby: {
          light: "#C92A42",
          DEFAULT: "#8E182A",
          dark: "#5E0B19",
        },
        emerald: {
          DEFAULT: "#0E5C42",
          dark: "#083B2A",
        }
      },
      fontFamily: {
        serif: ["Cinzel", "Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #FFE89E 0%, #D4AF37 50%, #997316 100%)",
        "gold-shimmer": "linear-gradient(90deg, #D4AF37 0%, #FFF3C4 50%, #D4AF37 100%)",
        "radial-gold": "radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.15) 0%, transparent 70%)",
        "royal-card": "linear-gradient(180deg, rgba(28, 28, 38, 0.85) 0%, rgba(16, 16, 21, 0.95) 100%)",
      },
      boxShadow: {
        "gold-glow": "0 0 25px -5px rgba(212, 175, 55, 0.3)",
        "gold-glow-lg": "0 0 45px -5px rgba(212, 175, 55, 0.45)",
        "inner-gold": "inset 0 1px 1px 0 rgba(255, 240, 180, 0.2)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2.5s infinite linear",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
