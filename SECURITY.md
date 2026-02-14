# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | Yes                |
| < 1.0   | No                 |

## Reporting a Vulnerability

If you discover a security vulnerability in RecoveryPilot, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

### How to Report

1. Email: Create a private security advisory via GitHub's Security tab
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix timeline**: Depends on severity (critical: 24-72 hours, high: 1-2 weeks, medium/low: next release)

### Scope

The following are in scope for security reports:

- Authentication bypass or privilege escalation
- Cross-site scripting (XSS) vulnerabilities
- Data exposure (patient data leaks, PII exposure)
- Injection vulnerabilities (SQL, command, template)
- Cross-site request forgery (CSRF)
- Insecure data storage
- Session management flaws

### Out of Scope

- Vulnerabilities in third-party dependencies (report to the upstream project)
- Social engineering attacks
- Denial of service attacks
- Issues requiring physical access to a user's device

## Security Architecture

### Authentication
- Password hashing with constant-time comparison
- Session timeout with automatic expiration
- Role-based access control (patient, doctor, admin)

### Data Protection
- No real patient data stored -- all data is synthetic/demo
- LocalStorage used for client-side demo persistence
- Audit logging for all clinical actions
- Patient data anonymization for exports

### Headers (Production Deployment)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Dependency Management
- All dependencies are pinned to specific versions
- Regular audit via `npm audit`
- No known vulnerabilities at time of release

## Disclaimer

RecoveryPilot is a demonstration/research platform. It is **not** certified for production clinical use. Clinical algorithms are implemented from peer-reviewed literature for educational and research purposes. Always consult qualified healthcare professionals for actual medical decisions.
