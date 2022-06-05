const { resolve } = require('path');

module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  globals: {
    // Vue 3 compiler macros
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly',
  },
  extends: [
    // Common
    'eslint:recommended',
    'plugin:import/errors',
    'airbnb-base/legacy',
    'plugin:promise/recommended',

    // Vue
    'plugin:vue/vue3-recommended',
    '@vue/airbnb',
  ],
  plugins: [
    'import',
    'promise',
  ],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018,
    parser: 'babel-eslint',
  },
  settings: {
    'import/resolver': {
      'alias-array': {
        map: [
          ['#api', [
            resolve(__dirname, 'app/api'),
            resolve(__dirname, 'wood/api'),
          ]],
          ['#cli', [
            resolve(__dirname, 'app/cli'),
            resolve(__dirname, 'wood/cli'),
          ]],
          ['#config', [
            resolve(__dirname, 'app/config'),
            resolve(__dirname, 'wood/config'),
          ]],
          ['#features', [
            resolve(__dirname, 'app/features'),
            resolve(__dirname, 'wood/features'),
          ]],
          ['#lib', [
            resolve(__dirname, 'app/lib'),
            resolve(__dirname, 'wood/lib'),
          ]],
          ['#ui', [
            resolve(__dirname, 'app/ui'),
            resolve(__dirname, 'wood/ui'),
          ]],
          ['@app', resolve(__dirname, 'app')],
          ['@wood', resolve(__dirname, 'wood')],
        ],
        extensions: ['.ts', '.js', '.jsx', '.json', '.vue'],
      },
    },
  },
  overrides: [
    {
      files: [
        '**/*.test.js',
        '**/*.spec.js',
      ],
      env: {
        jest: true, // now **/*.test.js files' env has both es6 *and* jest
      },
      // Can't extend in overrides: https://github.com/eslint/eslint/issues/8813
      // 'extends': ['plugin:jest/recommended']
      plugins: ['jest'],
      rules: {
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'docs/',
    'dist/',
    'wood/templates/*',
    '**/*.ejs',
  ],
  rules: {
    'template-curly-spacing': 'off',
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        ignoredNodes: ['TemplateLiteral'],
      },
    ],
    'linebreak-style': [
      'error',
      'unix',
    ],
    semi: [
      'error',
      'always',
    ],
    'no-unused-vars': [
      'error',
      { args: 'none' },
    ],
    'no-use-before-define': [
      'error',
      {
        functions: false,
        classes: false,
        variables: true,
      },
    ],

    'import/no-unresolved': [
      'error',
      {
        commonjs: true,
        caseSensitive: true,
      },
    ],
    'import/extensions': ['error', 'never', {
      css: 'always',
    }],
    'brace-style': ['error', 'stroustrup'],
    'space-unary-ops': [
      2, {
        words: true,
        nonwords: false,
        overrides: {
          '!': true,
        },
      },
    ],
    'object-curly-newline': ['error', {
      ObjectPattern: { multiline: true },
    }],
    'class-methods-use-this': 'off',
    'new-cap': ['error', {
      properties: false,
    }],
    'no-param-reassign': [
      2, {
        props: false,
      },
    ],
    'vue/singleline-html-element-content-newline': ['error', {
      ignoreWhenNoAttributes: true,
      ignoreWhenEmpty: true,
      ignores: ['pre', 'textarea', 'router-link', 'a', 'span'],
    }],
    camelcase: 'off',
    'vue/no-v-for-template-key': 'off', // Conflicts with vue3
    'import/no-extraneous-dependencies': 'off', // Conflicts with wood folder imports
    'vuejs-accessibility/click-events-have-key-events': 'off', // Disabled until a11y review
    'vuejs-accessibility/mouse-events-have-key-events': 'off', // Disabled until a11y review
    'vuejs-accessibility/no-autofocus': 'off', // Disabled until a11y review
  },
};
