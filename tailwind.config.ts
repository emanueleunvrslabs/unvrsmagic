import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /* iOS-26 Glass Spacing (4pt micro, 8pt base) */
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'base': '16px',
        'lg': '20px',
        'xl': '24px',
      },
      
      /* Continuous Corners (iOS-style) */
      borderRadius: {
        'xs': '10px',
        's': '14px',
        'm': '18px',
        'l': '22px',
        'xl': '28px',
        'lg': 'var(--radius-l)',
        'md': 'var(--radius-m)',
        'sm': 'var(--radius-s)',
      },
      
      /* Glass Shadows (L0-L4) */
      boxShadow: {
        'l0': 'none',
        'l1': '0 1px 2px rgba(0, 0, 0, 0.06)',
        'l2': '0 4px 14px rgba(0, 0, 0, 0.08)',
        'l3': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'l4': '0 16px 60px rgba(0, 0, 0, 0.14)',
      },
      
      /* Backdrop Blur Values */
      backdropBlur: {
        'micro': '18px',
        'base': '24px',
        'large': '36px',
      },
      
      /* Typography */
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'system-ui', 'sans-serif'],
        display: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
      },
      
      fontSize: {
        'title-large': ['34px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'title': ['28px', { lineHeight: '34px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline': ['17px', { lineHeight: '22px', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '22px', fontWeight: '400' }],
        'footnote': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      
      /* Semantic Colors (all HSL with alpha) */
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        glass: {
          tint: {
            top: "hsl(var(--glass-tint-top))",
            bottom: "hsl(var(--glass-tint-bottom))",
          },
          stroke: "hsl(var(--glass-stroke))",
          highlight: "hsl(var(--glass-highlight))",
        },
      },
      
      /* Perspective for 3D transforms */
      perspective: {
        '1000': '1000px',
      },
      
      /* Animations */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "wave": {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.3)" },
        },
        "gradient-shift": {
          "0%, 100%": { 
            backgroundPosition: "0% 50%",
          },
          "50%": { 
            backgroundPosition: "100% 50%",
          },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "spin3d": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "spin3d": "spin3d 8s linear infinite",
        "gradient-shift": "gradient-shift 3s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
