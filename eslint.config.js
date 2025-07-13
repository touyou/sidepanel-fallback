import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        
        // Chrome Extension APIs
        chrome: 'readonly',
        
        // Node.js globals for tests and scripts
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly'
      }
    },
    rules: {
      // Code quality
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      
      // Best practices
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Style (will be handled by Prettier)
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'never']
    }
  },
  {
    files: ['test/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      // Allow console in tests
      'no-console': 'off',
      
      // Jest specific rules (will be added with plugin)
      'no-unused-expressions': 'off'
    }
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        // Node.js environment for scripts
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      // Allow console in scripts
      'no-console': 'off'
    }
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.min.js'
    ]
  }
];
