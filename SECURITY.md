# Security Policy

## Maintainers

| Name | GitHub |
|------|--------|
| **Kumkum Thakur** | [@kumkum-thakur](https://github.com/kumkum-thakur) |
| **Divya Mohan** | [@divyamohan1993](https://github.com/divyamohan1993) |

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
- JWT token vulnerabilities
- API authorization bypass

### Out of Scope

- Vulnerabilities in third-party dependencies (report to the upstream project)
- Social engineering attacks
- Denial of service attacks
- Issues requiring physical access to a user's device

## Security Architecture

### Authentication & Authorization
- **Password hashing**: Argon2id (primary) with bcrypt fallback, constant-time comparison
- **JWT tokens**: Access + refresh token rotation with configurable expiry
- **2FA support**: TOTP via otplib
- **Session management**: Automatic timeout with expiration warnings
- **Role-based access control**: Patient, doctor, admin roles with route-level enforcement via Passport.js

### Backend Security
- **Helmet.js**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Rate limiting**: express-rate-limit + rate-limiter-flexible for DDoS protection
- **Input validation**: Zod schema validation on all API endpoints
- **CORS**: Strict origin whitelisting
- **Structured logging**: Pino with audit trails for all clinical actions
- **Secrets management**: AWS Secrets Manager + KMS for encryption keys

### Data Protection
- No real patient data stored -- all data is synthetic/demo
- PostgreSQL with parameterized queries (Knex query builder) to prevent SQL injection
- Redis for session cache and job queue state
- Audit logging for all clinical actions
- Patient data anonymization for exports
- AWS S3 for secure file storage with server-side encryption

### Compliance Considerations

RecoveryPilot implements security controls aligned with:

| Standard | Relevance | Key Controls |
|----------|-----------|--------------|
| **HIPAA** (US) | PHI handling | Audit logging, access controls, encryption, minimum necessary |
| **DPDPA** (India) | Personal data protection | Consent management, data minimization, purpose limitation |
| **UK GDPR** | Data protection | Right to erasure, data portability, lawful basis |
| **HL7 FHIR R4** | Healthcare interoperability | Standardized resource generation and export |

### Infrastructure Security
- **Kubernetes**: Network policies, pod security standards, secrets encryption
- **Terraform**: Infrastructure-as-code with state encryption
- **Nginx**: TLS termination, security headers, rate limiting
- **Docker**: Non-root containers, minimal base images
- **Monitoring**: Prometheus + Grafana with security alerting

### Headers (Production Deployment)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'`

### Dependency Management
- All dependencies are pinned to specific versions
- Regular audit via `npm audit`
- No known vulnerabilities at time of release

## Disclaimer

RecoveryPilot is a demonstration/research platform. It is **not** certified for production clinical use. Clinical algorithms are implemented from peer-reviewed literature for educational and research purposes. Always consult qualified healthcare professionals for actual medical decisions.
