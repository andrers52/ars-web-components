import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const nodeFiles = [
  '**/*.config.js',
  '**/*.config.ts',
  '*.cjs',
  '*.mjs',
  'server.js',
  'test/**/*.js',
];

const testFiles = [
  '**/*.test.ts',
  '**/*.test.js',
  'test/**/*.ts',
  'test/**/*.js',
];

export default tseslint.config(
  {
    ignores: [
      '.cache/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'src/**/demo/**',
    ],
  },
  {
    files: ['**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },
  {
    files: nodeFiles,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-undef': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: testFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
