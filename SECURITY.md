# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in **Gold Arbitrage Analyzer**:

1. **Do NOT open a public GitHub issue** for undisclosed vulnerabilities.
2. Report privately via GitHub Security Advisories (`Security -> Advisories -> Report a vulnerability`).
3. Include reproduction steps, affected files/endpoints, and impact assessment.

## Security Controls

- **Hardened HTTP Headers**: Production `vercel.json` enforces strict CSP, HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy`.
- **Subresource Integrity (SRI)**: External CDN scripts pinned with SHA-384 integrity digests.
- **XSS-Safe DOM Updates**: Uses `createElement()` and `replaceChildren()` with zero unsanitized `innerHTML`.
- **Automated Scanning**: Dependabot weekly alerts, Semgrep SAST, and Trivy container vulnerability scanning in CI.
