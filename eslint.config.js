import js from '@eslint/js';

export default [
  // Base configuration for all files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        browser: true,
        es2022: true,
        node: true,
        chrome: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      indent: ['error', 2],
      'comma-dangle': ['error', 'never']
    }
  },

  // Test files configuration
  {
    files: ['test/**/*.js', '**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        browser: true,
        es2022: true,
        node: true,
        jest: true
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
        node: true
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
