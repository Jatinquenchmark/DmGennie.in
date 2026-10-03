import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

// Colours are "R G B" channel vars (src/index.css) so opacity modifiers like bg-card/80 work.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '40rem',
        md: '48rem', 
        lg: '64rem',
        xl: '80rem',
        '2xl': '96rem',
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
      },
      // Floor for UI text: uppercase micro-labels only. Everything else uses xs and up.
      fontSize: {
        '2xs': ['11px', '16px'],
      },
      // Steps used across the app (bg-white/72 etc.) that Tailwind v3 doesn't ship.
      opacity: {
        12: '0.12',
        14: '0.14',
        62: '0.62',
        72: '0.72',
        86: '0.86',
      },
      colors: {
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        background: token("background"),
        foreground: token("foreground"),
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          foreground: token("destructive-foreground"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
          blue: token("accent-blue"),
          emerald: token("accent-emerald"),
        },
        brand: {
          DEFAULT: token("brand"),
          hover: token("brand-hover"),
          soft: token("brand-soft"),
        },
        // Pro / premium only.
        gold: {
          soft: "#FFF7DA",
          DEFAULT: "#E8C56C",
          deep: "#8A5D17",
        },
        ink: {
          DEFAULT: token("ink"),
          muted: token("ink-muted"),
        },
        popover: {
          DEFAULT: token("popover"),
          foreground: token("popover-foreground"),
        },
        card: {
          DEFAULT: token("card"),
          foreground: token("card-foreground"),
        },
      },
      // Named scale for app/marketing code (shadcn ui keeps lg/md/sm):
      // control = buttons, inputs, chips · card = cards, panels · panel = modals, drawers, hero blocks.
      borderRadius: {
        control: "12px",
        card: "20px",
        panel: "28px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Three neutral elevations, no coloured glows.
      boxShadow: {
        rest: "0 1px 2px rgb(15 23 42 / 0.04), 0 4px 16px rgb(15 23 42 / 0.05)", // not "card": that name is a colour token and would tint the shadow white
        raised: "0 2px 6px rgb(15 23 42 / 0.05), 0 12px 32px rgb(15 23 42 / 0.10)",
        overlay: "0 8px 20px rgb(15 23 42 / 0.08), 0 32px 80px rgb(15 23 42 / 0.20)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
