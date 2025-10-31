# Framework & Language

## React Guidelines
- Use React for all UI components and application logic
- Use TypeScript for all code with strict type checking enabled
- Follow React best practices and conventions:
  - Use functional components with hooks
  - Properly manage component state and side effects
  - Follow React naming conventions (PascalCase for components, camelCase for functions)
  - Always define interfaces for component props
  - Implement proper component composition and reusability

## TypeScript Guidelines
- Use strict mode with all TypeScript compiler options enabled
- Define explicit types for all function parameters and return values
- Create interfaces for complex data structures and component props
- Use type guards and discriminated unions where appropriate
- Avoid using `any` type - use `unknown` with type guards instead
- Use readonly modifiers for immutable data
- Leverage TypeScript's utility types (Pick, Omit, Partial, etc.) when appropriate
- Keep type definitions close to their usage, or in shared type files for reusable types
