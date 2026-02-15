# Contributing to RecoveryPilot

Thank you for your interest in contributing to RecoveryPilot! We welcome contributions from developers, clinicians, and researchers.

## Maintainers

| Name | GitHub | Role |
|------|--------|------|
| **Kumkum Thakur** | [@kumkum-thakur](https://github.com/kumkum-thakur) | Project Lead |
| **Divya Mohan** | [@divyamohan1993](https://github.com/divyamohan1993) | Co-Lead, Backend & Infrastructure |

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/recovery-pilot.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Start the dev server: `npm run dev`

### Backend Development

```bash
cd server
npm install
npm run dev        # Starts Express server with hot-reload (tsx watch)
npm run typecheck  # TypeScript type checking
npm run test       # Run server tests
```

The backend uses Express 5, PostgreSQL (via Knex), Redis (via ioredis), and BullMQ for job queues.

## Code Standards

- TypeScript strict mode is enforced across both frontend and backend
- Use functional React components with hooks (frontend)
- Named exports preferred over default exports
- TailwindCSS for styling (frontend)
- Zod for request validation (backend)
- Pino for structured logging (backend)

## Clinical Algorithm Requirements

All clinical algorithms must:

1. Cite a peer-reviewed source in code comments
2. Use published scoring criteria exactly as published
3. Include tests with known clinical outcomes
4. Be documented in docs/ALGORITHMS.md

## Test Requirements

- All new features must include tests
- All bug fixes must include a regression test
- Frontend: `npm run test && npm run lint`
- Backend: `cd server && npm run test && npm run typecheck`

## Pull Request Process

1. Ensure all tests pass (frontend and backend)
2. Ensure linting and type checking pass
3. Write a clear PR description
4. Link related issues
5. Request review from a maintainer

## PR Title Format

Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`

## Areas of Contribution

| Area | Description | Key Files |
|------|-------------|-----------|
| Clinical Algorithms | Implement validated scoring systems | `src/services/` |
| ML Models | Pure TypeScript ML implementations | `src/services/*Model*.ts`, `src/services/*Engine*.ts` |
| Frontend UI | React components and pages | `src/components/`, `src/pages/` |
| Backend API | Express routes and middleware | `server/src/routes/`, `server/src/middleware/` |
| Infrastructure | Kubernetes, Terraform, monitoring | `infrastructure/` |
| Documentation | Clinical docs, API reference | `docs/` |
| Testing | Unit, integration, property-based | `src/test/`, `server/src/` |

## Reporting Issues

- Bugs: open a GitHub issue with reproduction steps
- Features: open an issue labeled `enhancement`
- Security: see SECURITY.md (do not open a public issue)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
