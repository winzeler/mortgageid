module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  testEnvironment: 'node',
  name: 'MortgageId',
  setupFiles: ['./wood/testSetup.js'],
  moduleNameMapper: {
    '^@app(.*)$': '<rootDir>/app/$1',
    '^@wood(.*)$': '<rootDir>/wood/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/wood/',
  ],
  resolver: './wood/testResolver.js',
};
