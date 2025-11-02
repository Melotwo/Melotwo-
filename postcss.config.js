/**
 * @type {import('postcss-load-config').Config}
 *
 * NOTE: This file uses the .cjs extension to force CommonJS loading,
 * which resolves the "plugins.forEach is not a function" error when
 * package.json is set to "type": "module".
 */
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
}
