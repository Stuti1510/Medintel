# MEDINTEL AI — Dataset Audit & Validation Report

**Dataset:** PAD-UFES-20 (Dermatological Smartphone Image & Metadata Dataset)  
**Reference:** Pacheco, A. G., et al. "PAD-UFES-20: A skin lesion dataset composed of patient data and images collected from smartphones." *Data in Brief* 32 (2020): 106225.  
**Storage Path:** `data/multimodal/`  
**Image Directory:** `data/multimodal/images/`  
**Manifest:** `data/multimodal/manifest.csv`  

---

## 1. Cohort Specification & Integrity

| Property | Value | Verification Status |
| :--- | :--- | :--- |
| **Total Samples ($N$)** | 2,054 paired instances | 100% verified (2,054 rows) |
| **Unique Patients** | 1,272 individual patients | 100% verified |
| **Image Format** | 24-bit PNG files (RGB) | 2,054 / 2,054 valid on disk |
| **Corrupted Files** | 0 files | Validated via PIL file stream inspection |
| **Missing Files** | 0 files | Every manifest entry exists on disk |
| **Acquisition Device** | Clinical mobile phones | Diverse real-world cameras |
| **Target Classes** | 4 diagnostic categories | BCC, ACK, NEV, SEK |

---

## 2. Disease Class Distribution & Imbalance

The cohort reflects real-world clinical prevalence from public healthcare settings, exhibiting class imbalance toward malignant BCC and pre-malignant ACK.

| Disease Code | Disease Name | Pathology Nature | Sample Count | Percentage | Imbalance Weight ($\frac{N}{4 \cdot N_c}$) |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **BCC** | Basal Cell Carcinoma | Malignant Neoplasm | 845 | 41.14% | 0.6077 |
| **ACK** | Actinic Keratosis | Pre-malignant Dysplasia | 730 | 35.54% | 0.7034 |
| **NEV** | Melanocytic Nevus | Benign Melanocytic | 244 | 11.88% | 2.1045 |
| **SEK** | Seborrheic Keratosis | Benign Keratinocytic | 235 | 11.44% | 2.1851 |
| **Total** | — | — | **2,054** | **100.00%** | — |

> **Imbalance Mitigation:** Training pipelines incorporate balanced inverse-class weighting in Cross-Entropy Loss to penalize minority misclassifications proportionally.

---

## 3. Patient-Partitioned Cross-Validation (Zero Data Leakage)

All 2,054 instances are distributed across five non-overlapping folds via `StratifiedGroupKFold` conditioned on `patient_id`. 

- **Multi-Fold Patient Count:** **0** (strictly zero patients appear in more than one fold).
- All photographs and follow-up images from a single patient reside strictly within a single partition, precluding patient-identity leakage.

### Distribution Across Folds

| Fold | Total Samples | Unique Patients | BCC | ACK | NEV | SEK |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Fold 0** | 421 | 252 | 153 | 141 | 56 | 71 |
| **Fold 1** | 400 | 255 | 169 | 144 | 49 | 38 |
| **Fold 2** | 412 | 253 | 171 | 163 | 47 | 31 |
| **Fold 3** | 400 | 255 | 168 | 147 | 41 | 44 |
| **Fold 4** | 421 | 257 | 184 | 135 | 51 | 51 |
| **Total** | **2,054** | **1,272** | **845** | **730** | **244** | **235** |

---

## 4. Multimodal Feature Pairing

Each image in `data/multimodal/images/` is coupled with 21 clinical attributes extracted from the dermatological consultation:

1. **Patient Demographics:** Age, Gender, Fitzpatrick phototype (I through VI).
2. **Symptom Flags:** Itch (`itch`), Lesion growth (`grew`), Pain (`hurt`), Morphological change (`changed`), Bleeding (`bleed`), Palpable elevation (`elevation`).
3. **Lesion Biometrics:** Anatomical region, Major diameter ($d_1$), Minor diameter ($d_2$).
4. **Oncological History:** Personal skin cancer history, general cancer history, family history.
5. **Environmental Risk:** Occupational pesticide exposure, smoking, alcohol use.

These features are compiled deterministically into clinical narrative text strings (e.g., *"Patient aged 68 presents with an elevated lesion on the face that bleeds easily and has changed recently..."*), providing an authentic clinical context invariant to optical camera degradation.
