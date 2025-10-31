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

## Security Checks for New Dependencies

Before adding any new library to the project, perform the following security checks:

### 1. Maintenance Status
- ? Check the package's last update date on npm (`npm view <package> time.modified`)
- ? Verify the package is actively maintained (recent commits, active issue resolution)
- ? Check for signs of abandonment (no updates for >1 year, unresolved critical issues)

### 2. Security Vulnerabilities
- ? Run `npm audit` or check [Snyk Advisor](https://snyk.io/advisor/) for known vulnerabilities
- ? Review the package's GitHub security advisories
- ? Check for CVEs (Common Vulnerabilities and Exposures) related to the package
- ? Examine the dependency tree for vulnerable sub-dependencies

### 3. Package Reputation
- ? Verify the package has a substantial number of downloads (indicates wide usage)
- ? Check the GitHub repository for signs of quality:
  - Active issue tracker with responsive maintainers
  - Good test coverage
  - Clear documentation
  - Regular releases
- ? Review the package maintainers' reputation and history

### 4. License Compatibility
- ? Verify the package license is compatible with the project (MIT, Apache-2.0, BSD are generally safe)
- ? Avoid copyleft licenses (GPL, AGPL) unless explicitly approved
- ? Check for license changes in recent versions

### 5. Code Quality
- ? Review the package's TypeScript support (if applicable)
- ? Check for proper error handling and validation
- ? Look for any obvious code smells or security anti-patterns
- ? Verify the package doesn't request unnecessary permissions or access

### Quick Security Check Commands

```bash
# Check package info
npm view <package> description repository.url license maintainers time.modified

# Check for vulnerabilities (after adding to package.json)
pnpm audit

# Check package popularity
npm view <package> dist.integrity

# Clone and inspect repository
git clone <repo-url> --depth 1
```

### Red Flags (DO NOT ADD)

- ?? No updates in over 1 year (unless stable/mature)
- ?? Known high/critical security vulnerabilities
- ?? Unresponsive maintainers to security issues
- ?? Suspicious or unclear ownership
- ?? Excessive or unusual dependencies
- ?? Minified or obfuscated source code
- ?? Requests for unusual permissions

### Documentation

When adding a new critical dependency (e.g., replacing a major library), document the decision:
- Create a markdown file explaining why the library was chosen
- List all security checks performed
- Note any alternatives considered
- Document migration strategy if replacing existing functionality

### Example

See `EXCEL_LIBRARY_RECOMMENDATION.md` for an example of proper due diligence when selecting a new library.
