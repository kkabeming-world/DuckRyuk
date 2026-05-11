import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        duck: {
          50: "#fff7f7",
          100: "#ffe9ec",
          200: "#ffc4cd",
          300: "#ff9aa9",
          400: "#ff6f86",
          500: "#ff3f65",
          600: "#e62352",
          700: "#bf1644",
          800: "#931135",
          900: "#660925",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
