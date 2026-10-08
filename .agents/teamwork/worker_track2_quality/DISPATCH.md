# Dispatch Instructions

## 2026-10-06T10:04:48Z
You are the Track 2 Worker for the gold-arbitrage-analyzer QA code audit.
Your working directory is: `c:\Users\subki\Downloads\gold-arbitrage-analyzer\.agents\teamwork\worker_track2_quality/`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

First, read `c:\Users\subki\Downloads\gold-arbitrage-analyzer\.agents\teamwork\ORIGINAL_REQUEST.md` and `c:\Users\subki\Downloads\gold-arbitrage-analyzer\Prompt\04-qa-audit-and-security\qa-code-quality-audit.md`.

Your mission is to perform a comprehensive Technical Code Quality & Security audit across all application source files in `c:\Users\subki\Downloads\gold-arbitrage-analyzer` (excluding .git, node_modules, etc.), and generate all required report markdown files directly in `qa-report/code-quality/`.

Deliverables to produce:
1. `qa-report/code-quality/00_stack_detected.md`
   - Detect runtime architecture, modules, entrypoints, and dependencies.
2. `qa-report/code-quality/01_security.md`
   - Audit Security: injection risk, DOM XSS (`innerHTML`), unpinned CDN dependencies, missing SRI hashes, CSP/HSTS headers, hardcoded credentials, sensitive logging, error exposure.
3. `qa-report/code-quality/02_performance.md`
   - Audit Performance: time complexity O(n), unnecessary loops, memory allocation, DOM thrashing on 30s timer, caching mechanisms, redundant calculations.
4. `qa-report/code-quality/03_bug_risk.md`
   - Audit Bug Risk: unhandled null/undefined, race conditions, silent catch blocks, API boundary conditions, error handling, timeout handling, missing validations.
5. `qa-report/code-quality/04_data_types.md`
   - Audit Data Types: IEEE 754 float precision loss on financial calculations, loose type coercion, enum validation, parsing without type validation, implicit nulls.
6. `qa-report/code-quality/_summary.md`
   - Prioritized summary matrix with severity ratings (Critical, High, Medium, Low) and Top 10 priorities.

STRICT CONSTRAINTS:
- ZERO modifications to existing source code files. Do NOT edit, touch, or format any source code files. Pure diagnostic audit!
- Every single finding in 01_security.md, 02_performance.md, 03_bug_risk.md, and 04_data_types.md MUST follow the schema:
  - File path
  - Line numbers / function context
  - Problematic code snippet
  - Impact explanation (how it can be exploited, cause bugs, precision loss, or slow down)
  - Severity rating (Critical, High, Medium, Low)
  - Concrete fix recommendation (code snippet demonstrating proper idiomatic fix)

Keep track of your progress in your working directory's `progress.md`.
When finished, write `handoff.md` in your working directory and notify the orchestrator with `send_message`.
