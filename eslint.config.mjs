import tseslint from 'typescript-eslint'

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-namespace': 'off', // needed for React web component JSX declarations
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**'],
  }
)
