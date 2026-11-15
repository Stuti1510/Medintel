import os
import re
import sys

EXCLUDE_DIRS = {"node_modules", ".git", "legacy_text_benchmark", "__pycache__", ".pytest_cache", "brain", "dist", "images", "raw"}
BINARY_EXTS = {".zip", ".png", ".jpg", ".jpeg", ".pt", ".joblib", ".parquet", ".sqlite", ".db", ".pdf", ".pptx", ".xlsx"}

def check_pattern(pattern, root_dir, extensions=None):
    regex = re.compile(pattern, re.IGNORECASE)
    matches = []
    if not os.path.exists(root_dir):
        return matches
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            if f == "verify_acceptance_phase0.py":
                continue
            _, ext = os.path.splitext(f)
            if ext.lower() in BINARY_EXTS:
                continue
            if extensions:
                if not any(f.endswith(target_ext) for target_ext in extensions):
                    continue
            file_path = os.path.join(root, f)
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as fp:
                    for i, line in enumerate(fp, 1):
                        if regex.search(line):
                            matches.append((file_path, i, line.strip()))
            except Exception:
                pass
    return matches

def run_checks():
    print("=== Running Phase 0 Acceptance Checks ===")
    
    # Check 1
    p1 = "symptom" + "2disease|" + "symptom_to_" + "disease"
    m1 = check_pattern(p1, ".")
    print(f"Check 1 (symptom2disease): {len(m1)} matches")
    for f, i, l in m1[:5]:
        print(f"   {f}:{i} -> {l}")
        
    # Check 2
    p2 = "bio" + "bert|xg" + "boost|random" + r"\.forest|random" + "forest|logistic" + r"\.regression|Logistic" + "Regression"
    m2 = check_pattern(p2, ".", [".py", ".ts", ".tsx", ".yaml"])
    print(f"Check 2 (deprecated models): {len(m2)} matches")
    for f, i, l in m2[:5]:
        print(f"   {f}:{i} -> {l}")
        
    # Check 3
    p3 = "model" + "_name|selected" + "MLModel|selected_ml" + "_model|selected" + "ModelForCM"
    m3_backend = check_pattern(p3, "backend")
    m3_frontend = check_pattern(p3, "frontend/src")
    m3 = m3_backend + m3_frontend
    print(f"Check 3 (model selector parameters): {len(m3)} matches")
    for f, i, l in m3[:5]:
        print(f"   {f}:{i} -> {l}")
        
    total_violations = len(m1) + len(m2) + len(m3)
    if total_violations == 0:
        print("\nALL PHASE 0 GREP CHECKS PASSED WITH 0 MATCHES!")
        return 0
    else:
        print(f"\nFAILED: {total_violations} violations found.")
        return 1

if __name__ == "__main__":
    sys.exit(run_checks())
