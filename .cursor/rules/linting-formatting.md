# Linting and Formatting Guidelines

## Overview

This project enforces code quality through ESLint and Prettier. All code must pass linting and formatting checks before being merged.

## Code Style Requirements

### TypeScript/JavaScript

- **Semicolons**: Always use explicit semicolons (no ASI)
- **Quotes**: Single quotes for strings (double quotes only when escaping)
- **Trailing Commas**: ES5-style (arrays, objects, function parameters)
- **Arrow Functions**: Always use parentheses around parameters
- **Line Width**: Maximum 100 characters
- **Indentation**: 2 spaces (no tabs)

### TypeScript-Specific

- **Type Definitions**: Prefer `interface` over `type` for object types
- **Unused Variables**: Not allowed (prefix with `_` if intentionally unused)
- **Console Statements**: `console.warn` and `console.error` allowed; `console.log` triggers warning

### React-Specific

- **React in JSX Scope**: Not required (using new JSX transform)
- **Prop Types**: Not required (using TypeScript)
- **Hooks**: Follow React Hooks rules (enforced by eslint-plugin-react-hooks)

## Available Scripts

Run these commands to check and fix code:

```bash
# Linting
pnpm run lint          # Auto-fix linting issues
pnpm run lint:check    # Check for linting issues without fixing

# Formatting
pnpm run format        # Auto-format all files
pnpm run format:check  # Check formatting without fixing

# Type Checking
pnpm run typecheck     # Run TypeScript compiler checks

# Testing
pnpm run test          # Run tests once
pnpm run test:watch    # Run tests in watch mode

# Build (includes lint and format checks)
pnpm run build         # Lint, format check, and build for production
```

## Key ESLint Rules

- **Errors**: `semi`, `quotes`, `prettier/prettier`, `@typescript-eslint/no-unused-vars`, `@typescript-eslint/consistent-type-definitions`
- **Warnings**: `no-console` (for `console.log`), `react-refresh/only-export-components`

## Handling Third-Party Library Types

For libraries with incomplete types (e.g., `xlsx`):

- Use type assertions: `const result = fn() as ExpectedType;`
- Add targeted ESLint disable comments with explanation
- Document why the disable is needed

## Build Enforcement

The `pnpm run build` command enforces linting and formatting checks before building. Any PR failing these checks will not be merged.
