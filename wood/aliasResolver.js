const AliasPlugin = require('enhanced-resolve/lib/AliasPlugin');
const { resolve } = require('path');

module.exports = new AliasPlugin('described-resolve', [
  {
    name: '#api',
    alias: [
      resolve(__dirname, '../app/api'),
      resolve(__dirname, './api'),
    ],
  }, {
    name: '#cli',
    alias: [
      resolve(__dirname, '../app/cli'),
      resolve(__dirname, './cli'),
    ],
  }, {
    name: '#config',
    alias: [
      resolve(__dirname, '../app/config'),
      resolve(__dirname, './config'),
    ],
  }, {
    name: '#features',
    alias: [
      resolve(__dirname, '../app/features'),
      resolve(__dirname, './features'),
    ],
  }, {
    name: '#lib',
    alias: [
      resolve(__dirname, '../app/lib'),
      resolve(__dirname, './lib'),
    ],
  }, {
    name: '#ui',
    alias: [
      resolve(__dirname, '../app/ui'),
      resolve(__dirname, './ui'),
    ],
  },
], 'resolve');
