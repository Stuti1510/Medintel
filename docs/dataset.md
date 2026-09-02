# MEDINTEL Clinical Dataset Documentation

Generated on: `2026-09-02 07:51:09 UTC`

## 1. Dataset Overview

- **Dataset Name**: MEDINTEL Clinical Disease Benchmark Dataset
- **Source File**: `data/raw/clinical_cases_raw.csv`
- **Total Samples**: **2,500**
- **Total Features**: **15**
- **Target Variable**: `condition` (20 classes)
- **Missing Values**: 596
- **Duplicates**: 0

## 2. Validation Status

| Validation Check | Status | Details |
| :--- | :--- | :--- |
| File Existence & Readability | `✓ PASSED` | Successfully loaded data/raw/clinical_cases_raw.csv |
| Required Columns Schema | `✓ PASSED` | 15 features present |
| Missing Value Integrity | `✗ FAILED` | 596 missing cells detected |
| Duplicate Narrative Check | `✓ PASSED` | 0 duplicate cases found |
| Target Label Integrity | `✓ PASSED` | 20 distinct disease classes verified |

## 3. Disease Class Distribution

| Disease Condition | Sample Count | Percentage |
| :--- | :--- | :--- |
| Hyperthyroidism | 125 | 5.0% |
| Major Depressive Disorder | 125 | 5.0% |
| Infectious Mononucleosis | 125 | 5.0% |
| Pulmonary Embolism | 125 | 5.0% |
| Hypertension | 125 | 5.0% |
| Iron Deficiency Anemia | 125 | 5.0% |
| Bronchial Asthma | 125 | 5.0% |
| Pneumonia | 125 | 5.0% |
| Gastroenteritis | 125 | 5.0% |
| Chronic Kidney Disease | 125 | 5.0% |
| GERD | 125 | 5.0% |
| Rheumatoid Arthritis | 125 | 5.0% |
| Acute Appendicitis | 125 | 5.0% |
| Urinary Tract Infection | 125 | 5.0% |
| Ischemic Stroke | 125 | 5.0% |
| Migraine with Aura | 125 | 5.0% |
| Myocardial Infarction | 125 | 5.0% |
| Type 2 Diabetes Mellitus | 125 | 5.0% |
| Atopic Dermatitis | 125 | 5.0% |
| Acute Bronchitis | 125 | 5.0% |

## 4. Patient Demographics & Vitals Summary

- **Age**: Mean 45.85 ± 18.22 yrs (Range: 5 - 88 yrs, Median: 46.0)
- **Biological Sex**: Female: 1403, Male: 1097
- **Severity Levels**: Moderate: 960, Severe: 700, Mild: 587, Critical: 253
- **Clinical Narratives**: Mean length 70.4 words (Range: 52 - 94)

### Vital Signs Range:
- **Heart Rate**: Mean 91.8 bpm (Min: 64, Max: 140)
- **Blood Pressure**: Mean 132.9/81.8 mmHg
- **Temperature**: Mean 37.31 °C (Min: 36.4, Max: 39.8)
- **SpO2**: Mean 97.1% (Min: 86, Max: 100%)
