module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
  },
} 