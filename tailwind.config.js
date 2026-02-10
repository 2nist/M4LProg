/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Map common Tailwind color keys to CSS variables so existing
           utility classes (bg-gray-800, bg-blue-600, etc.) follow the
           theme defined in `src/styles/globals.css`. */
        gray: {
          50: "var(--color-muted)",
          100: "var(--color-muted)",
          200: "var(--color-muted)",
          300: "var(--color-muted)",
          400: "var(--color-muted)",
          500: "var(--color-muted)",
          600: "var(--color-muted)",
          700: "var(--color-popover)",
          800: "var(--color-sidebar)",
          900: "var(--color-background)",
          950: "var(--color-background)",
        },
        blue: {
          500: "var(--color-primary)",
          600: "var(--color-primary)",
        },
        green: {
          500: "var(--color-chart-1)",
          600: "var(--color-chart-1)",
        },
        red: {
          500: "var(--color-destructive)",
          600: "var(--color-destructive)",
        },
        yellow: {
          500: "var(--color-accent)",
          600: "var(--color-accent)",
        },
        purple: {
          500: "var(--color-chart-4)",
          600: "var(--color-chart-4)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
