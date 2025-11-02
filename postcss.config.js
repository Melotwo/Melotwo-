/**
 * @type {import('postcss-load-config').Config}
 *
 * This uses the .cjs extension and CommonJS syntax (module.exports / require)
 * to resolve module conflicts caused by "type": "module" in package.json.
 */
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
}
