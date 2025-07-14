import globals from 'globals';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
        chrome: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-undef': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }]
    }
  },

  // Test files configuration
  {
    files: ['test/**/*.js', '**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      'no-console': 'off',
      'no-unused-expressions': 'off'
    }
  },

  // Scripts configuration
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-console': 'off'
    }
  },

  // Ignore patterns
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', '*.min.js']
  }
];
