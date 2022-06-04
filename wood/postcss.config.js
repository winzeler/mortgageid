const postcssImport = require('postcss-import');
const postcssPresetEnv = require('postcss-preset-env');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    postcssImport(),
    postcssPresetEnv({ stage: 0 }),
    tailwindcss(),
    autoprefixer,
  ],
};
