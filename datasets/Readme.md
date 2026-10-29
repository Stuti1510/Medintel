# 🩺 Symptom-to-Disease Benchmark Dataset (Symptom2Disease)

> A benchmark dataset for natural language clinical symptom understanding, differential diagnosis, and medical text classification.

## 📝 Dataset Summary

The **Symptom2Disease** dataset comprises **1,200 verified clinical cases** featuring realistic, free-text patient symptom narratives balanced across **24 distinct disease entities** (50 cases per condition).

Each record captures patient-reported clinical presentations detailing symptoms, locations, severity, timelines, and sensations across common acute, chronic, and infectious conditions.

### 📊 Dataset Overview

| Metric | Value |
| :--- | :--- |
| **Total Patient Cases** | **1,200** |
| **Unique Disease Classes** | **24** |
| **Cases Per Condition** | **50** (Strictly balanced 1:1 distribution) |
| **Primary Features** | `id`, `label`, `text` |
| **Feature Modality** | Natural Language Clinical Narrative |
| **Missing Values** | **0 (0.0%)** |
| **Duplicate Entries** | **0 (0.0%)** |

---

## 📂 Disease Classification Hierarchy (24 Classes)

1. **Psoriasis** — Erythematous scaly plaques, skin peeling, nail pitting, and joint aches.
2. **Varicose Veins** — Prominent calf veins, nocturnal cramping, lower extremity heaviness, and swelling.
3. **Typhoid** — Sustained fever, abdominal cramps, constipation, step-ladder fever curve, and malaise.
4. **Chicken Pox** — Generalized pruritic vesicular eruption, mild fever, fatigue, and lymphadenopathy.
5. **Impetigo** — Honey-colored crusted erosions, erythematous facial and nasal sores.
6. **Dengue** — Retro-orbital cephalalgia, high fever, severe arthralgia/myalgia ("breakbone fever"), and petechiae.
7. **Fungal Infection** — Pruritic annular lesions, skin discoloration, and nodular scaling.
8. **Common Cold** — Rhinorrhea, sneezing, mild pharyngitis, low-grade malaise, and non-productive cough.
9. **Pneumonia** — Productive cough with rust-colored sputum, tachypnea, pleuritic chest discomfort, and spiking fever.
10. **Dimorphic Hemorrhoids** — Painful defecation, hematochezia, perianal pruritus, and anal discomfort.
11. **Arthritis** — Joint stiffness, arthralgia, localized swelling, and gait restriction.
12. **Acne** — Comedones, pustules, inflammatory papules, and cutaneous erythema.
13. **Bronchial Asthma** — Expiratory wheezing, episodic dyspnea, nocturnal cough, and chest tightness.
14. **Hypertension** — Occipital morning headache, dizziness, blurry vision, and exertional palpitations.
15. **Migraine** — Unilateral pulsating headache, photophobia, nausea, and visual aura.
16. **Cervical Spondylosis** — Posterior neck pain, upper extremity radiculopathy, vertigo, and stiffness.
17. **Jaundice** — Scleral icterus, dark bilirubinuria, acholic stools, and pruritus.
18. **Malaria** — Paroxysmal rigors, high spiking fever, diaphoresis, and profound myalgias.
19. **Urinary Tract Infection** — Dysuria, frequency, urgency, suprapubic tenderness, and cloudy urine.
20. **Allergy** — Sneezing, itchy watery eyes, nasal mucosal edema, and urticaria.
21. **Gastroesophageal Reflux Disease (GERD)** — Retrosternal pyrosis, regurgitation, dysphagia, and acid sensation.
22. **Drug Reaction** — Cutaneous eruption following pharmacotherapy, metallic dysgeusia, and tremor.
23. **Peptic Ulcer Disease** — Epigastric burning exacerbated between meals or at night, hematemesis/melena.
24. **Diabetes** — Polyuria, polydipsia, weight loss, delayed wound healing, and paresthesias.

---

## 🎯 Usage in MEDINTEL AI

The dataset serves as the foundational multi-class diagnostic benchmark for:
- **Classical ML Classifiers**: Logistic Regression, Random Forest, XGBoost with TF-IDF vectorization.
- **BioBERT Transformer**: PyTorch contextual encoder fine-tuned with multi-head self-attention.
- **Explainability & Attribution**: Attention heatmaps, token importance, and differential diagnosis scoring.
