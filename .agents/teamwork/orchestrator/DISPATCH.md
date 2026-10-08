## 2026-10-06T10:02:37Z
You are the Project Orchestrator for the gold-arbitrage-analyzer QA code audit.

Your mission is to execute a comprehensive dual-track QA code audit on gold-arbitrage-analyzer running in parallel:
Track 1: Code Readability & Language Consistency (targeting 100% English standardization)
Track 2: Technical Code Quality (Security, Performance, Bug Risk, Data Types)

All reports must be placed in `qa-report/` with zero modifications to existing source files.

Please review the full requirements and acceptance criteria in:
c:\Users\subki\Downloads\gold-arbitrage-analyzer\.agents\teamwork\ORIGINAL_REQUEST.md

Key reference files in the repository:
- Prompt/04-qa-audit-and-security/prompt_qa_readability_consistency.md
- Prompt/04-qa-audit-and-security/qa-code-quality-audit.md

Deliverables:
- qa-report/code-readability/00_style_detected.md
- qa-report/code-readability/01_language_consistency.md
- qa-report/code-readability/02_readability.md
- qa-report/code-readability/_summary.md
- qa-report/code-quality/00_stack_detected.md
- qa-report/code-quality/01_security.md
- qa-report/code-quality/02_performance.md
- qa-report/code-quality/03_bug_risk.md
- qa-report/code-quality/04_data_types.md
- qa-report/code-quality/_summary.md
- qa-report/QA_AUDIT_EXECUTIVE_SUMMARY.md

Constraints:
- ZERO modifications to source code files (pure diagnostic audit).
- Every finding must contain: file path, line numbers, code snippet, impact explanation, severity (Critical/High/Medium/Low), and concrete fix recommendation.
- Maintain your plan.md and progress.md in your working directory: c:\Users\subki\Downloads\gold-arbitrage-analyzer\.agents\teamwork\orchestrator/

Report back upon completion.
