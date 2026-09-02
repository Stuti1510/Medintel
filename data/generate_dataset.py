"""
MEDINTEL AI - Clinical Dataset Generator
Synthesizes a realistic, research-grade clinical dataset for multi-disease diagnosis prediction.
Includes free-text clinical narratives, vitals, patient demographics, durations, and severity scores.
"""

import os
import random
import pandas as pd
import numpy as np

RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

DISEASES = {
    "Myocardial Infarction": {
        "symptoms": ["crushing substernal chest pain", "radiation to left arm and jaw", "diaphoresis", "shortness of breath", "nausea", "lightheadedness", "anxiety", "clammy skin"],
        "age_range": (45, 80),
        "sex_dist": [0.65, 0.35],
        "severities": ["Severe", "Critical"],
        "durations": ["2 hours", "4 hours", "6 hours", "1 day"],
        "temp_range": (36.5, 37.4),
        "hr_range": (90, 130),
        "bp_sys_range": (140, 190),
        "bp_dia_range": (90, 115),
        "spo2_range": (91, 96),
        "histories": ["Hypertension, Hyperlipidemia", "CAD, 20 pack-year smoking", "Type 2 Diabetes, Obesity", "Prior angina episodes", "Family history of early MI"],
        "medications": ["Aspirin 81mg", "Atorvastatin 40mg", "Lisinopril 10mg", "Metoprolol 25mg", "None"]
    },
    "Pneumonia": {
        "symptoms": ["productive cough with rust-colored sputum", "high spiking fever", "pleuritic chest pain on inspiration", "dyspnea", "chills and rigors", "fatigue", "bronchial breath sounds", "dullness to percussion"],
        "age_range": (20, 85),
        "sex_dist": [0.52, 0.48],
        "severities": ["Moderate", "Severe"],
        "durations": ["3 days", "5 days", "1 week", "10 days"],
        "temp_range": (38.2, 39.8),
        "hr_range": (95, 120),
        "bp_sys_range": (105, 140),
        "bp_dia_range": (65, 85),
        "spo2_range": (89, 95),
        "histories": ["COPD", "Recent upper respiratory tract infection", "Smoking history", "Asthma", "Immunosuppression"],
        "medications": ["Albuterol inhaler", "Fluticasone", "Prednisone taper", "Multivitamins", "None"]
    },
    "Type 2 Diabetes Mellitus": {
        "symptoms": ["polyuria", "polydipsia", "unexplained weight loss", "blurred vision", "persistent fatigue", "slow healing sores", "frequent fungal infections", "tingling paresthesia in feet"],
        "age_range": (35, 75),
        "sex_dist": [0.50, 0.50],
        "severities": ["Mild", "Moderate"],
        "durations": ["2 months", "6 months", "1 year", "3 months"],
        "temp_range": (36.4, 37.1),
        "hr_range": (68, 88),
        "bp_sys_range": (125, 155),
        "bp_dia_range": (80, 95),
        "spo2_range": (97, 99),
        "histories": ["Obesity, sedentary lifestyle", "Gestational diabetes history", "Hypertension", "Metabolic syndrome", "Family history of diabetes"],
        "medications": ["None", "Metformin 500mg", "Amlodipine 5mg", "Hydrochlorothiazide 25mg"]
    },
    "Bronchial Asthma": {
        "symptoms": ["episodic expiratory wheezing", "nocturnal dry cough", "chest tightness", "shortness of breath triggered by cold air", "exercise-induced dyspnea", "tachypnea", "prolonged expiratory phase"],
        "age_range": (12, 60),
        "sex_dist": [0.45, 0.55],
        "severities": ["Moderate", "Severe"],
        "durations": ["1 day", "3 days", "1 week", "2 weeks"],
        "temp_range": (36.5, 37.2),
        "hr_range": (85, 115),
        "bp_sys_range": (110, 135),
        "bp_dia_range": (70, 85),
        "spo2_range": (92, 97),
        "histories": ["Atopic eczema", "Allergic rhinitis", "Childhood asthma", "Dust and pet dander allergy"],
        "medications": ["Salbutamol PRN", "Budesonide inhaler", "Montelukast 10mg", "Cetirizine 10mg", "None"]
    },
    "Acute Appendicitis": {
        "symptoms": ["periumbilical pain migrating to right lower quadrant", "McBurney point tenderness", "low grade fever", "anorexia", "nausea and vomiting", "rebound tenderness", "Rovsing sign positive", "guarding"],
        "age_range": (10, 45),
        "sex_dist": [0.55, 0.45],
        "severities": ["Severe", "Critical"],
        "durations": ["12 hours", "18 hours", "24 hours", "36 hours"],
        "temp_range": (37.6, 38.8),
        "hr_range": (90, 120),
        "bp_sys_range": (110, 135),
        "bp_dia_range": (70, 85),
        "spo2_range": (97, 100),
        "histories": ["No significant prior medical history", "Previous viral gastroenteritis", "None"],
        "medications": ["Ibuprofen 400mg (failed relief)", "Acetaminophen 500mg", "None"]
    },
    "Hypertension": {
        "symptoms": ["occipital morning headache", "dizziness", "occasional epistaxis", "exertional palpitation", "facial flushing", "tinnitus", "blurred vision"],
        "age_range": (35, 78),
        "sex_dist": [0.52, 0.48],
        "severities": ["Mild", "Moderate"],
        "durations": ["1 month", "3 months", "6 months", "1 year"],
        "temp_range": (36.5, 37.0),
        "hr_range": (70, 92),
        "bp_sys_range": (150, 195),
        "bp_dia_range": (95, 120),
        "spo2_range": (97, 100),
        "histories": ["High sodium diet, chronic stress", "Family history of stroke", "Sleep apnea", "Hypercholesterolemia"],
        "medications": ["None", "Lisinopril 5mg", "Amlodipine 5mg", "Losartan 50mg"]
    },
    "Migraine with Aura": {
        "symptoms": ["unilateral throbbing pulsatile headache", "scintillating scotoma visual aura", "photophobia", "phonophobia", "nausea and vomiting", "hyperosmia", "worsened by routine physical activity"],
        "age_range": (18, 55),
        "sex_dist": [0.25, 0.75],
        "severities": ["Moderate", "Severe"],
        "durations": ["6 hours", "12 hours", "1 day", "2 days"],
        "temp_range": (36.4, 37.0),
        "hr_range": (65, 88),
        "bp_sys_range": (110, 135),
        "bp_dia_range": (70, 85),
        "spo2_range": (98, 100),
        "histories": ["Recurrent episodic migraines", "Family history of migraine", "Stress and sleep deprivation triggers", "Oral contraceptive use"],
        "medications": ["Sumatriptan 50mg", "Ibuprofen 600mg", "Propranolol 40mg", "None"]
    },
    "Gastroenteritis": {
        "symptoms": ["watery non-bloody diarrhea", "diffuse crampy abdominal pain", "nausea and non-bilious vomiting", "low grade fever", "hyperactive bowel sounds", "mild dehydration", "myalgia", "malaise"],
        "age_range": (15, 65),
        "sex_dist": [0.48, 0.52],
        "severities": ["Mild", "Moderate"],
        "durations": ["1 day", "2 days", "3 days", "4 days"],
        "temp_range": (37.4, 38.5),
        "hr_range": (85, 110),
        "bp_sys_range": (100, 125),
        "bp_dia_range": (65, 80),
        "spo2_range": (98, 100),
        "histories": ["Recent contaminated food intake", "Recent travel", "Contact with infected household member"],
        "medications": ["Oral rehydration salts", "Ondansetron 4mg", "Loperamide", "None"]
    },
    "Major Depressive Disorder": {
        "symptoms": ["depressed mood most of the day", "profound anhedonia", "early morning awakening insomnia", "psychomotor retardation", "feelings of worthlessness", "diminished concentration", "unintended weight loss"],
        "age_range": (18, 65),
        "sex_dist": [0.35, 0.65],
        "severities": ["Moderate", "Severe"],
        "durations": ["1 month", "3 months", "6 months", "1 year"],
        "temp_range": (36.5, 37.0),
        "hr_range": (64, 82),
        "bp_sys_range": (110, 130),
        "bp_dia_range": (70, 84),
        "spo2_range": (98, 100),
        "histories": ["Prior depressive episode", "Chronic psychosocial stress", "Family history of mood disorder"],
        "medications": ["Sertraline 50mg", "Escitalopram 10mg", "None"]
    },
    "Chronic Kidney Disease": {
        "symptoms": ["bilateral lower extremity pitting edema", "periorbital puffiness", "nocturia", "fatigue and pallor", "metallic taste in mouth", "pruritus", "elevated serum creatinine and BUN", "frothy urine"],
        "age_range": (45, 80),
        "sex_dist": [0.55, 0.45],
        "severities": ["Moderate", "Severe"],
        "durations": ["6 months", "1 year", "2 years", "3 years"],
        "temp_range": (36.4, 37.1),
        "hr_range": (72, 90),
        "bp_sys_range": (145, 180),
        "bp_dia_range": (88, 105),
        "spo2_range": (95, 99),
        "histories": ["Longstanding poorly controlled hypertension", "Type 2 Diabetic nephropathy", "Recurrent nephrolithiasis", "NSAID overuse"],
        "medications": ["Enalapril 10mg", "Furosemide 40mg", "Atorvastatin 20mg", "Calcium carbonate 500mg"]
    },
    "Rheumatoid Arthritis": {
        "symptoms": ["symmetric polyarthritis of MCP and PIP joints", "morning stiffness lasting over 1 hour", "joint swelling and warmth", "rheumatoid nodules", "fatigue", "sparing of DIP joints", "swan neck deformities"],
        "age_range": (30, 70),
        "sex_dist": [0.25, 0.75],
        "severities": ["Moderate", "Severe"],
        "durations": ["3 months", "6 months", "1 year", "2 years"],
        "temp_range": (36.8, 37.6),
        "hr_range": (70, 90),
        "bp_sys_range": (115, 140),
        "bp_dia_range": (72, 86),
        "spo2_range": (97, 100),
        "histories": ["Family history of autoimmune disease", "Smoking history", "Positive RF and anti-CCP"],
        "medications": ["Methotrexate 15mg weekly", "Folic acid 5mg", "Hydroxychloroquine 200mg", "Naproxen 500mg"]
    },
    "Hyperthyroidism": {
        "symptoms": ["heat intolerance", "palpitations and sinus tachycardia", "unexplained weight loss despite increased appetite", "fine resting tremor of outstretched hands", "diarrhea and hyperdefecation", "lid lag and exophthalmos", "diffuse goiter with bruit"],
        "age_range": (20, 60),
        "sex_dist": [0.20, 0.80],
        "severities": ["Mild", "Moderate"],
        "durations": ["1 month", "2 months", "4 months", "6 months"],
        "temp_range": (37.0, 37.8),
        "hr_range": (100, 130),
        "bp_sys_range": (135, 160),
        "bp_dia_range": (65, 80),
        "spo2_range": (98, 100),
        "histories": ["Graves disease in family", "Excessive iodine exposure", "Postpartum thyroiditis history"],
        "medications": ["Methimazole 10mg", "Propranolol 20mg TID", "None"]
    },
    "Pulmonary Embolism": {
        "symptoms": ["sudden onset pleuritic chest pain", "acute dyspnea", "hemoptysis", "tachycardia", "tachypnea", "unilateral painful leg swelling indicative of DVT", "accentuated P2 heart sound", "syncope"],
        "age_range": (30, 80),
        "sex_dist": [0.48, 0.52],
        "severities": ["Severe", "Critical"],
        "durations": ["1 hour", "3 hours", "6 hours", "12 hours"],
        "temp_range": (37.2, 38.3),
        "hr_range": (105, 140),
        "bp_sys_range": (90, 130),
        "bp_dia_range": (60, 85),
        "spo2_range": (86, 94),
        "histories": ["Recent long-haul air flight", "Recent orthopedic knee surgery", "Oral contraceptive pill use", "Active malignancy", "History of DVT"],
        "medications": ["Apixaban 5mg", "Enoxaparin", "None"]
    },
    "Acute Bronchitis": {
        "symptoms": ["persistent cough for 2 weeks", "clear or purulent sputum", "retrosternal burning discomfort on coughing", "low grade fever", "wheezing and coarse rhonchi clearing with coughing", "sore throat", "fatigue"],
        "age_range": (16, 65),
        "sex_dist": [0.50, 0.50],
        "severities": ["Mild", "Moderate"],
        "durations": ["5 days", "10 days", "2 weeks", "3 weeks"],
        "temp_range": (37.2, 38.2),
        "hr_range": (75, 98),
        "bp_sys_range": (110, 135),
        "bp_dia_range": (70, 85),
        "spo2_range": (96, 99),
        "histories": ["Recent viral common cold", "Second-hand tobacco smoke exposure", "Air pollution exposure"],
        "medications": ["Dextromethorphan syrup", "Guaifenesin", "Acetaminophen", "None"]
    },
    "Urinary Tract Infection": {
        "symptoms": ["dysuria and burning micturition", "urinary urgency", "increased frequency", "suprapubic tenderness", "cloudy malodorous urine", "microscopic hematuria", "absence of flank pain or high fever"],
        "age_range": (18, 75),
        "sex_dist": [0.15, 0.85],
        "severities": ["Mild", "Moderate"],
        "durations": ["1 day", "2 days", "3 days", "5 days"],
        "temp_range": (36.8, 37.8),
        "hr_range": (72, 92),
        "bp_sys_range": (110, 135),
        "bp_dia_range": (70, 85),
        "spo2_range": (98, 100),
        "histories": ["Recurrent uncomplicated UTIs", "Recent sexual intercourse", "Urinary catheterization history", "Benign prostatic hyperplasia"],
        "medications": ["Nitrofurantoin 100mg", "Phenazopyridine 200mg", "Cranberry supplement", "None"]
    },
    "Ischemic Stroke": {
        "symptoms": ["sudden right-sided hemiparesis and arm weakness", "facial droop on right side", "expressive aphasia with slurred speech", "gaze deviation", "acute sensory loss on one half of body", "ataxia", "confusion"],
        "age_range": (50, 88),
        "sex_dist": [0.58, 0.42],
        "severities": ["Severe", "Critical"],
        "durations": ["45 minutes", "2 hours", "3.5 hours", "5 hours"],
        "temp_range": (36.5, 37.5),
        "hr_range": (75, 110),
        "bp_sys_range": (160, 220),
        "bp_dia_range": (95, 125),
        "spo2_range": (94, 98),
        "histories": ["Atrial fibrillation without anticoagulation", "Carotid artery stenosis", "Hypertension and hyperlipidemia", "Previous TIA"],
        "medications": ["Aspirin 81mg", "Clopidogrel 75mg", "Atorvastatin 80mg", "None"]
    },
    "GERD": {
        "symptoms": ["retrosternal heartburn worse after meals and supine position", "acid regurgitation with sour taste", "water brash", "globus sensation in throat", "chronic nocturnal dry cough", "epigastric burning relieved by antacids"],
        "age_range": (25, 70),
        "sex_dist": [0.50, 0.50],
        "severities": ["Mild", "Moderate"],
        "durations": ["2 months", "6 months", "1 year", "2 years"],
        "temp_range": (36.5, 37.0),
        "hr_range": (66, 84),
        "bp_sys_range": (115, 138),
        "bp_dia_range": (72, 86),
        "spo2_range": (98, 100),
        "histories": ["Hiatal hernia", "Obesity, high caffeine and spicy diet", "Tobacco smoking", "Late night dining habits"],
        "medications": ["Omeprazole 20mg daily", "Famotidine 20mg", "Calcium antacid tablets PRN", "None"]
    },
    "Atopic Dermatitis": {
        "symptoms": ["intense pruritus worse at night", "erythematous excoriated papules on flexural surfaces of antecubital and popliteal fossae", "lichenification from chronic scratching", "xerosis dry scaly skin", "ichthyosis"],
        "age_range": (5, 45),
        "sex_dist": [0.45, 0.55],
        "severities": ["Mild", "Moderate"],
        "durations": ["2 weeks", "1 month", "3 months", "1 year"],
        "temp_range": (36.5, 37.1),
        "hr_range": (68, 85),
        "bp_sys_range": (105, 125),
        "bp_dia_range": (65, 80),
        "spo2_range": (98, 100),
        "histories": ["Atopic triad (eczema, allergic rhinitis, asthma)", "Family history of atopy", "Sensitivities to wool and soaps"],
        "medications": ["Hydrocortisone 1% cream", "Tacrolimus 0.1% ointment", "Cetirizine 10mg", "Ceramide moisturizer", "None"]
    },
    "Infectious Mononucleosis": {
        "symptoms": ["triad of severe sore throat exudative pharyngitis", "high fever", "posterior cervical lymphadenopathy", "profound fatigue lasting weeks", "splenomegaly with left upper quadrant fullness", "palatal petechiae", "atypical lymphocytosis"],
        "age_range": (15, 30),
        "sex_dist": [0.50, 0.50],
        "severities": ["Moderate", "Severe"],
        "durations": ["1 week", "2 weeks", "3 weeks", "4 weeks"],
        "temp_range": (38.3, 39.7),
        "hr_range": (90, 115),
        "bp_sys_range": (110, 130),
        "bp_dia_range": (70, 82),
        "spo2_range": (97, 100),
        "histories": ["College student in dormitory", "Recent kissing contact with EBV positive individual", "Recent acute tonsillitis treated with amoxicillin resulting in rash"],
        "medications": ["Acetaminophen 500mg", "Ibuprofen 400mg", "Throat lozenges", "None"]
    },
    "Iron Deficiency Anemia": {
        "symptoms": ["generalized progressive fatigue and weakness", "pale conjunctiva and skin pallor", "exertional dyspnea and palpitations", "pica craving for ice or clay", "koilonychia spoon nails", "atrophic glossitis", "cold extremities", "dizziness"],
        "age_range": (18, 65),
        "sex_dist": [0.20, 0.80],
        "severities": ["Mild", "Moderate"],
        "durations": ["2 months", "4 months", "6 months", "1 year"],
        "temp_range": (36.4, 37.0),
        "hr_range": (85, 108),
        "bp_sys_range": (100, 125),
        "bp_dia_range": (60, 78),
        "spo2_range": (96, 99),
        "histories": ["Heavy menstrual bleeding (menorrhagia)", "Vegetarian diet with low iron intake", "History of peptic ulcer disease with occult bleeding", "Celiac disease with malabsorption"],
        "medications": ["Ferrous sulfate 325mg daily", "Vitamin C 500mg", "Multivitamin with iron", "None"]
    }
}

NARRATIVE_TEMPLATES = [
    "Patient is a {age}-year-old {sex_term} presenting with {primary_symptoms}. Symptoms started approximately {duration} ago with a {severity_term} intensity. On examination, patient exhibits {exam_symptoms}. Past medical history is notable for {history}. Current medications: {meds}. Vital signs demonstrate HR of {hr} bpm, BP of {bp_sys}/{bp_dia} mmHg, temperature of {temp:.1f} C, and SpO2 of {spo2}% on room air. {extra_notes}",
    "{age} y/o {sex_term} complains of {primary_symptoms} for the past {duration}. The condition is described as {severity_term}. Patient also endorses {exam_symptoms}. Patient has a known history of {history} and is taking {meds}. Clinical exam shows body temp {temp:.1f} C, blood pressure {bp_sys}/{bp_dia} mmHg, pulse {hr} bpm, O2 saturation {spo2}%. {extra_notes}",
    "A {age}-year-old {sex_term} arrives at the clinic with chief complaint of {primary_symptoms} lasting {duration}. Severity is assessed as {severity_term}. Accompanying findings include {exam_symptoms}. Medical background includes {history}. Patient is currently on {meds}. Vitals: T {temp:.1f} C, BP {bp_sys}/{bp_dia} mmHg, HR {hr} bpm, SpO2 {spo2}%. {extra_notes}",
    "Clinical encounter: {age} year old {sex_term} with {severity_term} complaints of {primary_symptoms} evolving over {duration}. Associated clinical manifestations include {exam_symptoms}. Notable past conditions: {history}. Medications: {meds}. Objectively, HR is {hr}, BP is {bp_sys}/{bp_dia}, temp is {temp:.1f} C, and pulse oximetry shows {spo2}%. {extra_notes}"
]

EXTRA_NOTES_POOL = [
    "No acute distress noted prior to presentation.",
    "Patient expresses concern regarding symptom progression.",
    "Symptoms have been interfering with daily activities.",
    "Patient reports mild relief with rest.",
    "Previous similar episodes reported but with lower intensity.",
    "No history of recreational drug use.",
    "Patient denies recent sick contacts.",
    "Routine laboratory tests ordered for baseline evaluation."
]

def generate_dataset(samples_per_class=125, output_csv="data/raw/clinical_cases_raw.csv"):
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    records = []
    case_idx = 1001

    for condition, conf in DISEASES.items():
        for i in range(samples_per_class):
            age = random.randint(*conf["age_range"])
            sex = "Male" if random.random() < conf["sex_dist"][0] else "Female"
            sex_term = "male" if sex == "Male" else "female"
            severity = random.choice(conf["severities"])
            severity_term = severity.lower()
            duration = random.choice(conf["durations"])
            
            # Select 3-5 symptoms randomly from the symptom pool
            num_syms = random.randint(3, min(6, len(conf["symptoms"])))
            selected_symptoms = random.sample(conf["symptoms"], num_syms)
            primary_symptoms = ", ".join(selected_symptoms[:2])
            exam_symptoms = ", ".join(selected_symptoms[2:]) if len(selected_symptoms) > 2 else "mild localized tenderness"
            
            temp = round(random.uniform(*conf["temp_range"]), 1)
            hr = random.randint(*conf["hr_range"])
            bp_sys = random.randint(*conf["bp_sys_range"])
            bp_dia = random.randint(*conf["bp_dia_range"])
            spo2 = random.randint(*conf["spo2_range"])
            
            history = random.choice(conf["histories"])
            meds = random.choice(conf["medications"])
            extra = random.choice(EXTRA_NOTES_POOL)
            
            template = random.choice(NARRATIVE_TEMPLATES)
            narrative = template.format(
                age=age,
                sex_term=sex_term,
                primary_symptoms=primary_symptoms,
                duration=duration,
                severity_term=severity_term,
                exam_symptoms=exam_symptoms,
                history=history,
                meds=meds,
                hr=hr,
                bp_sys=bp_sys,
                bp_dia=bp_dia,
                temp=temp,
                spo2=spo2,
                extra_notes=extra
            )
            
            records.append({
                "case_id": f"CASE-{case_idx}",
                "age": age,
                "sex": sex,
                "symptoms": "; ".join(selected_symptoms),
                "duration": duration,
                "severity": severity,
                "heart_rate": hr,
                "systolic_bp": bp_sys,
                "diastolic_bp": bp_dia,
                "temperature": temp,
                "spo2": spo2,
                "medical_history": history,
                "current_medications": meds,
                "clinical_narrative": narrative,
                "condition": condition
            })
            case_idx += 1

    df = pd.DataFrame(records)
    # Shuffle records
    df = df.sample(frac=1.0, random_state=RANDOM_SEED).reset_index(drop=True)
    df.to_csv(output_csv, index=False)
    print(f"[DATASET GENERATOR] Successfully created {len(df)} cases across {len(DISEASES)} disease classes at {output_csv}")
    return df

if __name__ == "__main__":
    generate_dataset()
