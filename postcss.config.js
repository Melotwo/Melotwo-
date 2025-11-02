// This uses ES Module syntax (import/export) to comply with "type": "module" in package.json.

import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

/** @type {import('postcss-load-config').Config} */
export default {
  // PostCSS typically expects plugins to be passed as an array of functions.
  plugins: [
    tailwindcss,
    autoprefixer,
  ],
}
