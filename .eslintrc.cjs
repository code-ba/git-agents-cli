module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  ignorePatterns: ['dist/', 'build/', 'node_modules/'],
  overrides: [
    {
      files: ['*.mts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
        '@typescript-eslint/no-explicit-any': 'off',
        'prefer-const': 'off',
      },
    },
  ],
};
