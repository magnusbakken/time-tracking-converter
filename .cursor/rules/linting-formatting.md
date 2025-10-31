# Linting and Formatting Guidelines

## Overview

This project enforces code quality and consistency through ESLint and Prettier. All code must pass linting and formatting checks before being committed or merged.

## Tools

- **ESLint**: Static analysis tool for identifying problematic patterns in TypeScript/JavaScript code
- **Prettier**: Opinionated code formatter that ensures consistent code style
- **TypeScript**: Type checking via `tsc --noEmit`

## Configuration Files

- **eslint.config.js**: ESLint flat config with TypeScript, React, and Prettier integration
- **.prettierrc**: Prettier configuration
- **.prettierignore**: Files/directories to exclude from formatting

## Code Style Requirements

### TypeScript/JavaScript

1. **Semicolons**: ALWAYS use explicit semicolons (no ASI - Automatic Semicolon Insertion)

   ```typescript
   // ✅ Correct
   const x = 5;
   console.log('hello');

   // ❌ Wrong
   const x = 5;
   console.log('hello');
   ```

2. **Quotes**: Use single quotes for strings (unless escaping is needed)

   ```typescript
   // ✅ Correct
   const name = 'John';
   const message = "It's a great day";

   // ❌ Wrong
   const name = 'John';
   ```

3. **Trailing Commas**: Use ES5-style trailing commas (arrays, objects, function parameters)

   ```typescript
   // ✅ Correct
   const obj = {
     a: 1,
     b: 2,
   };

   // ❌ Wrong
   const obj = {
     a: 1,
     b: 2,
   };
   ```

4. **Arrow Functions**: Always use parentheses around arrow function parameters

   ```typescript
   // ✅ Correct
   const fn = (x) => x * 2;

   // ❌ Wrong
   const fn = (x) => x * 2;
   ```

5. **Line Width**: Maximum 100 characters per line

6. **Indentation**: 2 spaces (no tabs)

### TypeScript-Specific

1. **Type Definitions**: Prefer `interface` over `type` for object types

   ```typescript
   // ✅ Correct
   interface User {
     name: string;
     age: number;
   }

   // ❌ Wrong (unless there's a specific reason to use type)
   type User = {
     name: string;
     age: number;
   };
   ```

2. **Unused Variables**: No unused variables allowed (prefix with `_` if intentionally unused)

   ```typescript
   // ✅ Correct
   function handleData(_error: Error, data: string) {
     console.log(data);
   }
   ```

3. **Console Statements**: `console.warn` and `console.error` are allowed; `console.log` will trigger a warning

### React-Specific

1. **React in JSX Scope**: Not required (using new JSX transform)
2. **Prop Types**: Not required (using TypeScript for type validation)
3. **Component Exports**: Should follow React Refresh guidelines for HMR
4. **Hooks**: Follow React Hooks rules (enforced by `eslint-plugin-react-hooks`)

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

## Pre-Commit/PR Requirements

Before committing code or submitting a PR, ensure:

1. ✅ All linting checks pass: `pnpm run lint:check`
2. ✅ All formatting checks pass: `pnpm run format:check`
3. ✅ All tests pass: `pnpm run test`
4. ✅ TypeScript compiles: `pnpm run typecheck`

The build script automatically runs lint and format checks, so running `pnpm run build` will verify both.

## Common ESLint Rules

### Errors (Must Fix)

- `semi`: Always use semicolons
- `quotes`: Use single quotes
- `prettier/prettier`: Code must match Prettier formatting
- `@typescript-eslint/no-unused-vars`: No unused variables
- `@typescript-eslint/consistent-type-definitions`: Use `interface` for object types
- `react-hooks/rules-of-hooks`: Follow React Hooks rules
- `react-hooks/exhaustive-deps`: Include all dependencies in useEffect

### Warnings

- `no-console`: Avoid `console.log` (use `console.warn` or `console.error` if needed)
- `react-refresh/only-export-components`: Components should be default or named exports

## Handling Third-Party Library Types

When working with third-party libraries that have incomplete or unsafe types (like `xlsx`):

1. Use type assertions when necessary:

   ```typescript
   const result = someUntypedFunction() as ExpectedType;
   ```

2. Add targeted ESLint disable comments for specific unsafe operations:

   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
   const value = untypedObject.property;
   ```

3. Document why the disable is needed in a comment

## IDE Integration

### VSCode

Install the following extensions for automatic linting and formatting:

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)

Add to your workspace settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

### Cursor

Cursor has built-in support for ESLint and Prettier. Ensure the extensions are enabled in your Cursor settings.

## CI/CD Integration

The build pipeline automatically enforces these checks:

1. Linting check (`pnpm run lint:check`)
2. Formatting check (`pnpm run format:check`)
3. Type checking (`pnpm run typecheck`)
4. Tests (`pnpm run test`)
5. Build (`pnpm run build`)

**Any PR that fails these checks will not be merged.**

## Quick Reference

| Rule            | Value    | Reason                                       |
| --------------- | -------- | -------------------------------------------- |
| Semicolons      | Required | Prevents ASI bugs, explicit code             |
| Quotes          | Single   | Consistency, less escaping in JSX            |
| Trailing Commas | ES5      | Cleaner diffs, easier to add lines           |
| Line Width      | 100      | Balance between readability and screen space |
| Indentation     | 2 spaces | Standard for JavaScript/TypeScript           |
| Arrow Parens    | Always   | Consistency, easier to add parameters        |

## Troubleshooting

### "Parsing error" in ESLint

- Ensure your TypeScript version is compatible
- Check that `tsconfig.json` is properly configured
- Restart your IDE/editor

### Prettier and ESLint conflicts

- Run `pnpm run format` to apply Prettier formatting
- Then run `pnpm run lint` to fix ESLint issues
- The config is already set up to avoid conflicts (`eslint-config-prettier`)

### Slow linting

- ESLint with TypeScript requires type information, which can be slow
- Consider excluding `node_modules` and `dist` (already configured)
- Use `eslint-disable-next-line` sparingly for performance-critical sections

## Best Practices

1. **Run formatters locally**: Use `pnpm run format` before committing
2. **Fix linting issues promptly**: Don't accumulate technical debt
3. **Use IDE integration**: Let your editor format and lint as you type
4. **Understand the rules**: Don't blindly disable rules; understand why they exist
5. **Be consistent**: Follow the project's conventions even if you prefer different ones
6. **Review diffs**: Automated formatting can sometimes produce unexpected results
