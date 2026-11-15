# PAD-UFES-20 Dataset & Preprocessing Specification

## 1. Overview & Source
PAD-UFES-20 was collected between 2017 and 2019 by the Dermatological and Surgical Assistance Program at the Federal University of Espírito Santo (UFES), Brazil. It consists of smartphone-acquired clinical images paired with patient medical records.

- **Source:** Mendeley Data (DOI: 10.17632/zr7vgbcyr2.1)
- **License:** CC BY 4.0
- **Acquisition Hardware:** Various commercial smartphones with differing camera sensors, apertures, and resolutions, creating realistic distribution shift.

---

## 2. Target Classes & Filtering

From the original 2,298 images and 6 diagnostic categories in PAD-UFES-20, MEDINTEL AI retains the 4 classes with sufficient clinical sample support:

| Class Code | Full Diagnosis | Category | Count | Proportion |
| :---: | :---: | :---: | :---: | :---: |
| **BCC** | Basal Cell Carcinoma | Malignant Neoplasm | 845 | 41.1% |
| **ACK** | Actinic Keratosis | Pre-Cancerous / UV-Induced | 730 | 35.5% |
| **NEV** | Melanocytic Nevus | Benign Melanocytic Lesion | 244 | 11.9% |
| **SEK** | Seborrheic Keratosis | Benign Epidermal Growth | 235 | 11.4% |
| *Total* | *Target Multimodal Dataset* | *4 Classes* | *2,054* | *100.0%* |

*(Melanoma [MEL: 52] and Squamous Cell Carcinoma [SCC: 192] are excluded to avoid severe low-support class imbalance).*

---

## 3. Patient-Grouped 5-Fold Partitioning

To ensure zero patient identity leakage:
- Images are partitioned into 5 balanced folds using `StratifiedGroupKFold` strictly grouped by `patient_id`.
- For fold $k$:
  - **Test Set:** Fold $k$
  - **Validation Set:** Fold $(k + 1) \bmod 5$
  - **Training Set:** Remaining 3 folds

Verification check via `data/dataset_validator.py` confirms:
$$\text{Patients}(\text{Fold}_i) \cap \text{Patients}(\text{Fold}_j) = \emptyset \quad \forall i \ne j$$

---

## 4. Patient Clinical Record to Narrative Synthesis

To provide paired natural language for each smartphone image, clinical record columns are transformed into patient-style clinical narratives:
- Input metadata: `itch`, `grew`, `hurt`, `changed`, `bleed`, `elevation`, `age`, `gender`, `region`, `diameter_1`, `diameter_2`, `fitspatrick`, `smoke`, `drink`, `pesticide`, `skin_cancer_history`, `cancer_history`.
- Synthesis Rule: Strictly **zero diagnostic words or acronyms** (BCC, ACK, NEV, SEK, carcinoma, keratosis, nevus) appear in the narrative.
- Example synthesized narrative:
  > *"Patient is a 68-year-old female presenting with an elevated skin lesion on the face measuring 12.0 mm. Patient reports that the lesion grew over recent months, itches, and bleeds easily upon contact. The lesion is painful. Patient has a personal history of cancer."*
