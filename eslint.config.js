// Deliberately narrow: this config exists to block ONE class of bug, the one
// that produced "Minified React error #310" on the Flock page — a hook placed
// after an early return, so the loading render and the loaded render run a
// different number of hooks and React aborts the whole page. It is invisible
// on any screen whose data happens to be cached, which is why it surfaced only
// on a brand new flock and looked random for weeks.
//
// `rules-of-hooks` catches it with certainty, so it runs as part of `npm run
// build` and a violation fails the build before it can reach Cloudflare Pages.
//
// Everything else is off ON PURPOSE. Style rules and exhaustive-deps produce
// noise and judgement calls; a deploy must never be blocked by those. If more
// rules are wanted later, add them here as warnings first.

import reactHooks from 'eslint-plugin-react-hooks'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'supabase/**', 'scripts/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    // The existing `eslint-disable react-hooks/exhaustive-deps` comments read as
    // "unused" only because that rule is off here. They stay meaningful if it is
    // ever switched on, so don't report them.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      // Off: flags legitimate intentional omissions across this codebase and
      // would block deploys for style, not correctness.
      'react-hooks/exhaustive-deps': 'off',
    },
  },
]
