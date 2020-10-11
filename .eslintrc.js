module.exports = {
  env: {
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'brace-style': [
      'error',
      'stroustrup',
    ],
    // "camelcase": 0,
    // "default-case": 0,
    indent: [
      'error',
      4,
      {
        SwitchCase: 1,
      },
    ],
    'max-len': 0,
    // "new-cap": 0,
    // "newline-per-chained-call": 0,
    // "no-await-in-loop": 0,
    // "no-bitwise": 0,
    'no-console': 0,
    'no-empty-function': 0,
    // "no-loop-func": 0,
    // "no-multi-spaces": 0,
    // "no-param-reassign": 0,
    'no-underscore-dangle': 0,
    // "no-plusplus": 0,
    // "no-unused-expressions": 0,
    // "no-use-before-define": 0,
    // "prefer-destructuring": 0,
    // "prefer-template": 0,
    semi: 0,
    'semi-style': [
      'error',
      'last',
    ],
    'import/extensions': [
      'error',
      'always',
      // { "ignorePackages": true },
    ],
  },
};
