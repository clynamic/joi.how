const layers = [
  { type: 'shared', pattern: ['src/types', 'src/utils'] },
  { type: 'engine', pattern: 'src/engine' },
  { type: 'services', pattern: 'src/toy' },
  { type: 'app', pattern: 'src/game/components' },
  { type: 'game', pattern: 'src/game' },
  {
    type: 'app',
    pattern: [
      'src/app',
      'src/common',
      'src/e621',
      'src/end',
      'src/env',
      'src/home',
      'src/local',
      'src/settings',
      'src/walltaker',
    ],
  },
];

const mayImport = (from, types) => ({
  from: { element: { type: from } },
  allow: { to: { element: { types: { anyOf: types } } } },
});

module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'eslint-config-prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'boundaries'],
  settings: {
    'boundaries/elements': layers,
    'boundaries/ignore': ['src/index.tsx'],
    'import/resolver': {
      node: { extensions: ['.js', '.ts', '.tsx'] },
    },
  },
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': 'warn',
    // I am going to be real with you, this pipe system is not going to be very typed.
    // Lets just. put this aside for now.
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      files: ['src/**'],
      rules: {
        'boundaries/no-unknown-files': 'error',
        'boundaries/dependencies': [
          'error',
          {
            default: 'disallow',
            policies: [
              mayImport('engine', ['shared']),
              mayImport('services', ['shared']),
              mayImport('game', ['engine', 'services', 'shared']),
              mayImport('app', ['app', 'game', 'engine', 'services', 'shared']),
            ],
          },
        ],
      },
    },
  ],
};
