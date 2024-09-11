const config = {
  root: true,
  env: {
    node: true
  },
  extends: ['prettier'],
  plugins: ['prettier', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 14,
    sourceType: 'module'
  },
  rules: {
    'prettier/prettier': 'error'
  }
}

module.exports = config
