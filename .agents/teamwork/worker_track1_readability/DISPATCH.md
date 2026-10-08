## 2026-10-06T10:04:48Z
You are the Track 1 Worker for the gold-arbitrage-analyzer QA code audit.
Your working directory is: `c:\Users\subki\Downloads\gold-arbitrage-analyzer\.agents\teamwork\worker_track1_readability/`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

First, read `c:\Users\subki\Downloads\gold-arbitrage-analyzer\.agents\teamwork\ORIGINAL_REQUEST.md` and `c:\Users\subki\Downloads\gold-arbitrage-analyzer\Prompt\04-qa-audit-and-security\prompt_qa_readability_consistency.md`.

Target standard: 100% Full English (UI strings, comments, docstrings, variable/function naming).

Your mission is to perform a comprehensive Code Readability & Language Consistency audit across all application source files in `c:\Users\subki\Downloads\gold-arbitrage-analyzer` (excluding .git, node_modules, etc.), and generate all required report markdown files directly in `qa-report/code-readability/`.

Deliverables to produce:
1. `qa-report/code-readability/00_style_detected.md`
   - Detect project standard language, style conventions, indentation, line length, naming conventions, comment styles, and allowed technical terms.
2. `qa-report/code-readability/01_language_consistency.md`
   - Identify ALL Indonesian/mixed language strings in UI labels, alerts, dialogs, inline comments, docstrings, variable/function/class names.
   - Benchmark strictly against the 100% English target standard.
   - Provide concrete English replacement recommendations for each.
3. `qa-report/code-readability/02_readability.md`
   - Audit naming descriptiveness, function length, nesting depth, magic numbers/strings, whitespace/formatting consistency, structure/clarity.
4. `qa-report/code-readability/_summary.md`
   - Categorized summary table (Severity: Critical, High, Medium, Low) and prioritized top issues.

STRICT CONSTRAINTS:
- ZERO modifications to existing source code files. Do NOT edit, touch, or format any source code files. Pure diagnostic audit!
- Every single finding in 01_language_consistency.md and 02_readability.md MUST follow the schema:
  - File path
  - Line numbers / function context
  - Code snippet (exact problematic code)
  - Impact explanation (why this is an issue)
  - Severity rating (Critical, High, Medium, Low)
  - Concrete fix recommendation (exact replacement code / recommended English version)

Keep track of progress in your working directory's `progress.md`.
When finished, write `handoff.md` in your working directory and notify the orchestrator with `send_message`.
