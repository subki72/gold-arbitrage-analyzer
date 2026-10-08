import re
import os
import sys

base_dir = r"c:\Users\subki\Downloads\gold-arbitrage-analyzer"
report_dir = os.path.join(base_dir, "qa-report")

reports = [
    os.path.join(report_dir, "code-readability", "00_style_detected.md"),
    os.path.join(report_dir, "code-readability", "01_language_consistency.md"),
    os.path.join(report_dir, "code-readability", "02_readability.md"),
    os.path.join(report_dir, "code-readability", "_summary.md"),
    os.path.join(report_dir, "code-quality", "00_stack_detected.md"),
    os.path.join(report_dir, "code-quality", "01_security.md"),
    os.path.join(report_dir, "code-quality", "02_performance.md"),
    os.path.join(report_dir, "code-quality", "03_bug_risk.md"),
    os.path.join(report_dir, "code-quality", "04_data_types.md"),
    os.path.join(report_dir, "code-quality", "_summary.md"),
    os.path.join(report_dir, "QA_AUDIT_EXECUTIVE_SUMMARY.md")
]

print("=== 1. VERIFY FILE EXISTENCE & SIZE ===")
for r in reports:
    exists = os.path.exists(r)
    size = os.path.getsize(r) if exists else 0
    rel = os.path.relpath(r, base_dir)
    print(f"[{'PASS' if exists and size > 1000 else 'FAIL'}] {rel} (Size: {size:,} bytes)")

print("\n=== 2. PARSE FINDINGS IN DETAILED REPORTS ===")
detailed_reports = [
    os.path.join(report_dir, "code-readability", "01_language_consistency.md"),
    os.path.join(report_dir, "code-readability", "02_readability.md"),
    os.path.join(report_dir, "code-quality", "01_security.md"),
    os.path.join(report_dir, "code-quality", "02_performance.md"),
    os.path.join(report_dir, "code-quality", "03_bug_risk.md"),
    os.path.join(report_dir, "code-quality", "04_data_types.md")
]

# Required schema fields check
# file path, line numbers, code snippet, impact explanation, severity rating, concrete fix recommendation

total_findings = 0
schema_violations = []

for report_path in detailed_reports:
    rel_path = os.path.relpath(report_path, base_dir)
    with open(report_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Split into finding sections
    sections = re.split(r'\n(?=### (?:Finding|Issue|CRITICAL|HIGH|MEDIUM|LOW))', content)
    findings = [s for s in sections if re.match(r'### (?:Finding|Issue|CRITICAL|HIGH|MEDIUM|LOW)', s.strip())]
    
    print(f"\nReport: {rel_path} -> Found {len(findings)} findings")
    
    for i, f_text in enumerate(findings):
        total_findings += 1
        lines = f_text.strip().split("\n")
        header = lines[0]
        
        # Check schema components
        has_file = bool(re.search(r'\*\*File:?\*\*|\*\*File\*\*|\*\*File:? `', f_text, re.IGNORECASE))
        has_lines = bool(re.search(r'\*\*Line Numbers?|\*\*Lokasi:?\*\*|\*\*Location:?\*\*', f_text, re.IGNORECASE))
        has_snippet = bool(re.search(r'```', f_text))
        has_impact = bool(re.search(r'\*\*Impact|\*\*Dampak', f_text, re.IGNORECASE))
        has_severity = bool(re.search(r'CRITICAL|HIGH|MEDIUM|LOW|\*\*Severity', f_text, re.IGNORECASE))
        has_rec = bool(re.search(r'\*\*Concrete Fix Recommendation|\*\*Rekomendasi', f_text, re.IGNORECASE))
        
        missing = []
        if not has_file: missing.append("File path")
        if not has_lines: missing.append("Line numbers")
        if not has_snippet: missing.append("Code snippet")
        if not has_impact: missing.append("Impact explanation")
        if not has_severity: missing.append("Severity rating")
        if not has_rec: missing.append("Concrete fix recommendation")
        
        if missing:
            schema_violations.append((rel_path, header, missing))

print(f"\nTotal findings evaluated across detailed reports: {total_findings}")
if schema_violations:
    print(f"FAILED schema checks on {len(schema_violations)} findings:")
    for path, hdr, miss in schema_violations:
        print(f"  [{path}] {hdr} -> Missing: {', '.join(miss)}")
else:
    print("ALL findings passed finding schema check 100%!")

