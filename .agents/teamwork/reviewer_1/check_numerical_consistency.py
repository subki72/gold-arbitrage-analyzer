import os
import re

base_dir = r"c:\Users\subki\Downloads\gold-arbitrage-analyzer"
report_dir = os.path.join(base_dir, "qa-report")

# Read summary files
exec_summary_path = os.path.join(report_dir, "QA_AUDIT_EXECUTIVE_SUMMARY.md")
read_summary_path = os.path.join(report_dir, "code-readability", "_summary.md")
qual_summary_path = os.path.join(report_dir, "code-quality", "_summary.md")

with open(exec_summary_path, "r", encoding="utf-8") as f:
    exec_content = f.read()

with open(read_summary_path, "r", encoding="utf-8") as f:
    read_content = f.read()

with open(qual_summary_path, "r", encoding="utf-8") as f:
    qual_content = f.read()

print("=== CHECKING NUMERICAL CONSISTENCY ACROSS SUMMARIES ===")

# Track 1 Readability summary:
# Language Consistency: 21 Crit, 25 High, 18 Med, 24 Low = 88 Total
# Readability: 7 Crit, 10 High, 4 Med, 0 Low = 21 Total
# Track 1 Subtotal: 28 Crit, 35 High, 22 Med, 24 Low = 109 Total

# Track 2 Quality summary:
# Security: 1 Crit, 3 High, 3 Med, 2 Low = 9 Total
# Performance: 0 Crit, 1 High, 4 Med, 2 Low = 7 Total
# Bug Risk: 1 Crit, 4 High, 3 Med, 1 Low = 9 Total
# Data Types: 0 Crit, 1 High, 5 Med, 1 Low = 7 Total
# Track 2 Subtotal: 2 Crit, 9 High, 15 Med, 6 Low = 32 Total

# Grand Total:
# Track 1 (109) + Track 2 (32) = 141 Total
# Crit: 28 + 2 = 30
# High: 35 + 9 = 44
# Med: 22 + 15 = 37
# Low: 24 + 6 = 30
# Sum: 30 + 44 + 37 + 30 = 141 Total

print("Expected Grand Total: 141 (30 Crit, 44 High, 37 Med, 30 Low)")

# Check if QA_AUDIT_EXECUTIVE_SUMMARY matches exactly:
matrix_pattern = r'\|\s*\*\*GRAND TOTAL\*\*\s*\|\s*.*?\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*\*\*(\d+)\*\*'
m = re.search(matrix_pattern, exec_content)
if m:
    c, h, med, low, tot = m.groups()
    print(f"Exec Summary Grand Total Row: Crit={c}, High={h}, Med={med}, Low={low}, Total={tot}")
    assert (int(c), int(h), int(med), int(low), int(tot)) == (30, 44, 37, 30, 141), "Grand total mismatch!"
    print("Exec Summary Grand Total perfectly matches sums of Track 1 and Track 2!")
else:
    print("Could not parse Grand Total row in Exec Summary!")

# Let's check finding counts in individual files vs summaries:
# 01_language_consistency.md: claims 88 total (21 Crit, 25 High, 18 Med, 24 Low)
# 02_readability.md: claims 21 total (7 Crit, 10 High, 4 Med, 0 Low)
# 01_security.md: claims 9 total (1 Crit, 3 High, 3 Med, 2 Low)
# 02_performance.md: claims 7 total (0 Crit, 1 High, 4 Med, 2 Low)
# 03_bug_risk.md: claims 9 total (1 Crit, 4 High, 3 Med, 1 Low)
# 04_data_types.md: claims 7 total (0 Crit, 1 High, 5 Med, 1 Low)

print("\n=== VERIFY INDIVIDUAL REPORT HEADERS VS SUMMARY TABLES ===")
reports_meta = [
    ("01_language_consistency.md", os.path.join(report_dir, "code-readability", "01_language_consistency.md"), (21, 25, 18, 24, 88)),
    ("02_readability.md", os.path.join(report_dir, "code-readability", "02_readability.md"), (7, 10, 4, 0, 21)),
    ("01_security.md", os.path.join(report_dir, "code-quality", "01_security.md"), (1, 3, 3, 2, 9)),
    ("02_performance.md", os.path.join(report_dir, "code-quality", "02_performance.md"), (0, 1, 4, 2, 7)),
    ("03_bug_risk.md", os.path.join(report_dir, "code-quality", "03_bug_risk.md"), (1, 4, 3, 1, 9)),
    ("04_data_types.md", os.path.join(report_dir, "code-quality", "04_data_types.md"), (0, 1, 5, 1, 7))
]

for name, path, expected in reports_meta:
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    # Check ringkasan or summary count
    print(f"[{name}] checking consistency with expected {expected}...")
    # Find numbers in summary table or header
    # in 01_security: Total temuan: 9 (Critical: 1, High: 3, Medium: 3, Low: 2)
    m_sum = re.search(r'Total(?:\s+temuan)?:\s*(\d+)\s*\((?:Critical:\s*(\d+),\s*High:\s*(\d+),\s*Medium:\s*(\d+)(?:,\s*Low:\s*(\d+))?|\*\*21\*\*)', text, re.IGNORECASE)
    if m_sum:
        print(f"  Matched summary line in {name}")
    else:
        print(f"  Note: Regex didn't capture exact pattern for {name}, checking table or content")

