# Package Management

- Use pnpm for all package management operations
- Run `pnpm install` to install dependencies
- Run `pnpm add <package>` to add new dependencies
- Run `pnpm remove <package>` to remove dependencies
- Never use npm or yarn commands

## Dependency Versions

- **Always use the latest stable versions** of dependencies unless there's a specific reason not to (e.g., breaking changes that can't be addressed immediately, compatibility issues with other dependencies)
- When upgrading major versions, review the changelog for breaking changes and update code accordingly
- Keep dependencies up to date to benefit from bug fixes, performance improvements, and security patches
