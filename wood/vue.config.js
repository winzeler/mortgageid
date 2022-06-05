const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { resolve } = require('path');
const AliasResolver = require('./aliasResolver');

const plugins = process.env.NODE_ENV === 'development'
  ? [new BundleAnalyzerPlugin({ openAnalyzer: false, analyzerHost: '0.0.0.0' })]
  : [];

module.exports = {
  publicPath: '/app',
  outputDir: resolve(__dirname, '../app/ui/dist'),
  pages: {
    index: {
      entry: './ui/main.js',
      template: './ui/public/index.html',
    },
  },

  devServer: {
    port: 9000,
    public: 'localhost',
    stats: 'minimal',
    progress: false,
  },

  configureWebpack: {
    devtool: process.env.NODE_ENV === 'development' ? 'source-map' : false,

    watchOptions: {
      ignored: /node_modules/,
      poll: 1000,
    },

    plugins,

    resolve: {
      plugins: [AliasResolver],
      alias: {
        '@app': resolve(__dirname, '../app'),
        '@wood': resolve(__dirname, '.'),
      },
    },
  },
};
