# Source Control Guidelines

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <subject>
```

**Types:**
- `feat`: New feature ? MINOR version bump
- `fix`: Bug fix ? PATCH version bump
- `docs`: Documentation only
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks

**Breaking changes** (? MAJOR version bump):
- Add `!` after type: `feat!: change component API`
- Or add `BREAKING CHANGE:` in commit body

## Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (0.x.0): New features
- **PATCH** (0.0.x): Bug fixes, small improvements

Update `CHANGELOG.md` with changes under `## [Unreleased]` section.

## Pull Requests

- Keep PRs small and focused on a single concern
- Each PR should address one feature, bug fix, or refactoring task
- Break large features into multiple smaller, reviewable PRs
- Write clear PR descriptions explaining the changes and their purpose
- Ensure all tests pass before creating a PR
