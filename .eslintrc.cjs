const config = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  extends: ['prettier', 'plugin:@typescript-eslint/recommended'],
  plugins: ['prettier', 'eslint-plugin-unused-imports', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'prettier/prettier': 'error'
  }
}

module.exports = config
