/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
  // Suppress warnings about @property at-rule (CSS custom property feature from DaisyUI)
  // This is a valid CSS feature, but PostCSS doesn't recognize it - harmless warning
  parser: undefined, // Use default parser
};
export default config;