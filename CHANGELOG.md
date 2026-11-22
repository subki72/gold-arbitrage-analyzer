# Changelog

All notable changes to **gold-arbitrage-analyzer** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-22

### Added
- Modular package entrypoint facade (`src/index.js`) and structured JSON logger (`src/logger.js`).
- Serverless liveness endpoint `api/health.js` wrapped in centralized `ErrorHandler` with unit tests (`tests/health.test.js`).
- Multi-stage non-root `Dockerfile`, `.dockerignore`, and single-command `Makefile`.
- Expanded CI pipeline (`.github/workflows/ci.yml`) with lint, Vitest suite, build verification, Semgrep SAST, and Trivy container scan.
- Security and governance docs: `.github/dependabot.yml`, `SECURITY.md`, `doc/ARCHITECTURE.md`, `runbook.md`, `LICENSE`, `CONTRIBUTING.md`, `.eslintrc.json`, and `.pre-commit-config.yaml`.

### Changed
- Migrated `js/app.js` from primitive `console.log` statements to structured leveled logging via `src/logger.js`.
