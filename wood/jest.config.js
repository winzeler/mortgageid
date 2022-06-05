module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  testEnvironment: 'node',
  name: 'Nodewood',
  setupFiles: ['./testSetup.js'],
  moduleNameMapper: {
    '^@app(.*)$': '<rootDir>/../app/$1',
    '^@wood(.*)$': '<rootDir>/$1',
  },
  resolver: './testResolver.js',
};
