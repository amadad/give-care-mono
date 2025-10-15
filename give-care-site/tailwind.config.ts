import type { Config } from 'tailwindcss';

// Define configuration with DaisyUI
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: false, // Disable dark mode
  theme: {
    extend: {
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            'p:first-of-type:first-letter': undefined, // Remove first-letter styles
            'p:first-of-type': {
              '&::first-letter': {
                all: 'unset',
              },
            },
            maxWidth: 'none',
            color: theme('colors.amber.900'),
            lineHeight: '1.8',
            p: {
              marginTop: theme('spacing.6'),
              marginBottom: theme('spacing.6'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
  ],
  daisyui: {
    themes: ["givecare"], // Use the custom givecare theme from globals.css
    darkTheme: false, // Disable dark theme
    base: true,
    styled: true,
    utils: true,
    logs: true,
  },
};

// Use type assertion to tell TypeScript this is valid
export default config as Config;
