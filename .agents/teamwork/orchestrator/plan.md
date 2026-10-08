# Plan: QA Code Audit for gold-arbitrage-analyzer

## Objective
Execute a comprehensive dual-track QA code audit on `gold-arbitrage-analyzer` running in parallel:
- Track 1: Code Readability & Language Consistency (100% English target)
- Track 2: Technical Code Quality (Security, Performance, Bug Risk, Data Types)
- Track 3: Consolidated Executive Summary
All reports placed in `qa-report/` with zero modifications to existing source files.

## Steps
1. [x] Orchestrator setup, BRIEFING.md, plan.md, progress.md initialization.
2. [ ] Dispatch Track 1 Worker/Explorer:
   - Audit codebase against `Prompt/04-qa-audit-and-security/prompt_qa_readability_consistency.md`.
   - Target standard: 100% English.
   - Deliverables:
     - `qa-report/code-readability/00_style_detected.md`
     - `qa-report/code-readability/01_language_consistency.md`
     - `qa-report/code-readability/02_readability.md`
     - `qa-report/code-readability/_summary.md`
3. [ ] Dispatch Track 2 Worker/Explorer:
   - Audit codebase against `Prompt/04-qa-audit-and-security/qa-code-quality-audit.md`.
   - Focus: Security, Performance, Bug Risk, Data Types.
   - Deliverables:
     - `qa-report/code-quality/00_stack_detected.md`
     - `qa-report/code-quality/01_security.md`
     - `qa-report/code-quality/02_performance.md`
     - `qa-report/code-quality/03_bug_risk.md`
     - `qa-report/code-quality/04_data_types.md`
     - `qa-report/code-quality/_summary.md`
4. [ ] Dispatch Consolidation Worker:
   - Synthesize findings from Track 1 and Track 2.
   - Deliverable:
     - `qa-report/QA_AUDIT_EXECUTIVE_SUMMARY.md`
5. [ ] Dispatch Forensic Auditor / Reviewer:
   - Verify zero modifications to existing source files (`git status`).
   - Verify all 11 markdown deliverables exist with required sections (file path, line numbers, code snippet, impact explanation, severity, concrete fix recommendation).
   - Verify acceptance criteria in `ORIGINAL_REQUEST.md`.
6. [ ] Conclude and report back to parent orchestrator.
