import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Aptos", "Inter", "Segoe UI", "ui-sans-serif", "system-ui"],
        display: ["Plus Jakarta Sans", "Aptos Display", "Aptos", "Inter", "ui-sans-serif"]
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        court: {
          teal: "#7da7ff",
          blue: "#4d91ff",
          ink: "#061127",
          platinum: "#eaf4ff",
          amber: "#f6c65b"
        }
      },
      boxShadow: {
        glow: "0 0 60px rgba(77, 145, 255, 0.24)",
        panel: "0 20px 80px rgba(0, 0, 0, 0.42)"
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem"
      },
      keyframes: {
        "verdict-reveal": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        "consensus-pulse": {
          "0%, 100%": { opacity: "0.55", transform: "scale(0.96)" },
          "50%": { opacity: "1", transform: "scale(1.04)" }
        },
        "payout-flow": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        }
      },
      animation: {
        "verdict-reveal": "verdict-reveal 520ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "consensus-pulse": "consensus-pulse 1800ms ease-in-out infinite",
        "payout-flow": "payout-flow 1800ms cubic-bezier(0.4, 0, 0.2, 1) infinite"
      }
    }
  },
  plugins: [animate]
};

export default config;
