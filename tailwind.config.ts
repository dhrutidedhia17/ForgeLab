import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Warm earth-tone palette
        clay: {
          50:  "#faf6f3",
          100: "#f0e8e0",
          200: "#e2d0c0",
          300: "#c4a78a",
          400: "#b8946e",
          500: "#a07850",
          600: "#8a6540",
          700: "#6e4f33",
          800: "#5a4028",
          900: "#463220",
        },
        sage: {
          50:  "#f4f7f4",
          100: "#e4ece5",
          200: "#c8d9ca",
          300: "#9dba9f",
          400: "#7da680",
          500: "#5e8c62",
          600: "#4a724e",
          700: "#3b5b3f",
          800: "#314a34",
          900: "#283d2b",
        },
        sand: {
          50:  "#fdfaf6",
          100: "#f7f0e4",
          200: "#ede0c8",
          300: "#dcc8a0",
          400: "#c9ac78",
          500: "#b8975c",
          600: "#a07d48",
          700: "#84643c",
          800: "#6b5034",
          900: "#57422c",
        },
        warm: {
          DEFAULT: "#0f0f0e",
          50:  "#1a1918",
          100: "#222120",
          200: "#2c2b29",
          300: "#3a3836",
          400: "#4a4744",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "14px",
        "2xl": "18px",
        "3xl": "24px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "brand-gradient": "linear-gradient(135deg, #b8946e, #9dba9f, #c9ac78)",
        "brand-gradient-hover": "linear-gradient(135deg, #a07850, #7da680, #b8975c)",
        "warm-gradient": "linear-gradient(135deg, #b8946e 0%, #9dba9f 50%, #c9ac78 100%)",
        "dark-gradient": "linear-gradient(180deg, #0f0f0e 0%, #1a1918 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)",
        "mesh-1": "radial-gradient(at 20% 30%, rgba(184, 148, 110, 0.04) 0%, transparent 50%), radial-gradient(at 80% 70%, rgba(157, 186, 159, 0.03) 0%, transparent 50%), radial-gradient(at 50% 50%, rgba(201, 172, 120, 0.02) 0%, transparent 50%)",
      },
      boxShadow: {
        "warm-sm": "0 2px 15px rgba(184, 148, 110, 0.06)",
        "warm-md": "0 4px 30px rgba(184, 148, 110, 0.08)",
        "warm-lg": "0 8px 50px rgba(184, 148, 110, 0.12)",
        "warm-xl": "0 12px 60px rgba(184, 148, 110, 0.18)",
        "soft": "0 4px 30px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.03)",
      },
    },
  },
  plugins: [],
};
export default config;
