import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"c:\Users\subki\Downloads\gold-arbitrage-analyzer"
report_dir = os.path.join(base_dir, "qa-report")

detailed_reports = [
    os.path.join(report_dir, "code-readability", "01_language_consistency.md"),
    os.path.join(report_dir, "code-readability", "02_readability.md"),
    os.path.join(report_dir, "code-quality", "01_security.md"),
    os.path.join(report_dir, "code-quality", "02_performance.md"),
    os.path.join(report_dir, "code-quality", "03_bug_risk.md"),
    os.path.join(report_dir, "code-quality", "04_data_types.md")
]

file_checks = []

for rpath in detailed_reports:
    with open(rpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    sections = re.split(r'\n(?=### (?:Finding|Issue|CRITICAL|HIGH|MEDIUM|LOW))', content)
    findings = [s for s in sections if re.match(r'### (?:Finding|Issue|CRITICAL|HIGH|MEDIUM|LOW)', s.strip())]
    
    for f_text in findings:
        header = f_text.strip().split("\n")[0]
        # extract file paths
        file_match = re.search(r'\*\*File:?\*\*\s*`?([^\n`]+)`?', f_text)
        line_match = re.search(r'\*\*(?:Line Numbers?|Lokasi|Location):?\*\*\s*([^\n]+)', f_text)
        
        target_file = file_match.group(1).strip() if file_match else None
        target_lines = line_match.group(1).strip() if line_match else None
        
        file_checks.append({
            "report": os.path.basename(rpath),
            "header": header,
            "target_file": target_file,
            "target_lines": target_lines,
            "text": f_text
        })

print(f"Total findings to check against source code: {len(file_checks)}")

missing_files = []
line_verifications = []

for item in file_checks:
    tf = item["target_file"]
    if not tf:
        continue
    # Could be multiple files, e.g. "js/api/normalizer.js and js/app.js"
    # Clean up commas / and
    files_to_check = re.split(r'\s+and\s+|,\s*', tf)
    for f in files_to_check:
        clean_f = f.replace("`", "").strip()
        full_p = os.path.join(base_dir, clean_f)
        if not os.path.exists(full_p):
            missing_files.append((item["report"], item["header"], clean_f))
        else:
            line_verifications.append((item["report"], item["header"], clean_f, item["target_lines"]))

print(f"\nFiles referenced: {len(line_verifications)} valid checks.")
if missing_files:
    print(f"WARNING: Missing files referenced:")
    for rep, hdr, mf in missing_files:
        print(f"  [{rep}] {hdr} references non-existent file: {mf}")
else:
    print("ALL referenced files exist in repository!")

# Spot check top critical findings line by line
print("\n=== SPOT CHECK SPECIFIC FINDINGS IN REPO ===")

# 1. BUG-01: js/app.js:142-149, 268-306
app_js_path = os.path.join(base_dir, "js", "app.js")
with open(app_js_path, "r", encoding="utf-8") as f:
    app_lines = f.readlines()

print(f"Checking js/app.js lines 140-150:")
for idx in range(139, min(150, len(app_lines))):
    print(f"  {idx+1}: {app_lines[idx].strip()}")

print(f"\nChecking js/app.js lines 268-278:")
for idx in range(267, min(278, len(app_lines))):
    print(f"  {idx+1}: {app_lines[idx].strip()}")

# 2. BUG-02: js/services/arbitrage.js:77-78
arb_js_path = os.path.join(base_dir, "js", "services", "arbitrage.js")
with open(arb_js_path, "r", encoding="utf-8") as f:
    arb_lines = f.readlines()

print(f"\nChecking js/services/arbitrage.js lines 73-82:")
for idx in range(72, min(82, len(arb_lines))):
    print(f"  {idx+1}: {arb_lines[idx].strip()}")

# 3. SEC-01: vercel.json
vercel_path = os.path.join(base_dir, "vercel.json")
with open(vercel_path, "r", encoding="utf-8") as f:
    vercel_content = f.read()
print(f"\nChecking vercel.json headers:\n{vercel_content.strip()}")

# 4. PERF-01: js/components/heatmap.js lines 80-92
heatmap_path = os.path.join(base_dir, "js", "components", "heatmap.js")
with open(heatmap_path, "r", encoding="utf-8") as f:
    heatmap_lines = f.readlines()
print(f"\nChecking js/components/heatmap.js lines 80-92:")
for idx in range(79, min(92, len(heatmap_lines))):
    print(f"  {idx+1}: {heatmap_lines[idx].strip()}")

