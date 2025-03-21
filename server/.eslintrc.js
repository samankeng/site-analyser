module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:security/recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: ['node', 'security', 'prettier'],
  rules: {
    // Error prevention
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-process-exit': 'error',
    
    // Security best practices
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    
    // Node.js specific
    'node/exports-style': ['error', 'module.exports'],
    'node/file-extension-in-import': ['error', 'always'],
    'node/prefer-global/buffer': ['error', 'always'],
    'node/prefer-global/console': ['error', 'always'],
    'node/prefer-global/process': ['error', 'always'],
    'node/prefer-global/url-search-params': ['error', 'always'],
    'node/prefer-global/url': ['error', 'always'],
    'node/prefer-promises/fs': 'error',
    'node/no-unsupported-features/es-syntax': [
      'error',
      {
        version: '>=14.0.0',
        ignores: [],
      },
    ],
    
    // API specific
    'node/no-missing-import': 'off',
    'node/no-unpublished-import': 'off',
    
    // Prettier integration
    'prettier/prettier': ['warn', {}, { usePrettierrc: true }],
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/__tests__/**'],
      env: {
        jest: true,
      },
      rules: {
        'node/no-unpublished-require': 'off',
      },
    },
  ],
};
