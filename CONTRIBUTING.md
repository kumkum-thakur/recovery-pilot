# Contributing to RecoveryPilot

Thank you for your interest in contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/recovery-pilot.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Start the dev server: `npm run dev`

## Code Standards

- TypeScript strict mode is enforced
- Use functional React components with hooks
- Named exports preferred over default exports
- TailwindCSS for styling

## Clinical Algorithm Requirements

All clinical algorithms must:

1. Cite a peer-reviewed source in code comments
2. Use published scoring criteria exactly as published
3. Include tests with known clinical outcomes
4. Be documented in docs/ALGORITHMS.md

## Test Requirements

- All new features must include tests
- All bug fixes must include a regression test
- Run before submitting: `npm run test && npm run lint`

## Pull Request Process

1. Ensure all tests pass
2. Ensure linting passes
3. Write a clear PR description
4. Link related issues
5. Request review from a maintainer

## PR Title Format

Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`

## Reporting Issues

- Bugs: open a GitHub issue with reproduction steps
- Features: open an issue labeled `enhancement`
- Security: see SECURITY.md (do not open a public issue)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
