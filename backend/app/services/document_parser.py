"""
MEDINTEL AI - Medical Document Ingestion & Extraction Engine
Parses multi-page digital and scanned PDF medical reports, PNG/JPG/JPEG laboratory and clinical images.
Performs OCR via PyMuPDF page rendering + EasyOCR, normalizes clinical terminology,
and builds a structured patient representation without inventing missing values.
"""

import os
import re
import io
import json
import time
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ImageEnhance, ImageFilter

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

_easyocr_reader = None

OCR_CORRECTIONS = [
    (r'\bcholestero[l1|I]\b', 'cholesterol'),
    (r'\bg[l1|I]ucose\b', 'glucose'),
    (r'\bhemog[l1|I]obin\b', 'hemoglobin'),
    (r'\bhypertens[il1]on\b', 'hypertension'),
    (r'\bcard[il1]ac\b', 'cardiac'),
    (r'\bventr[il1]cular\b', 'ventricular'),
    (r'\bdyspnea\b', 'dyspnea'),
    (r'\bpalp[il1]tat[il1]ons\b', 'palpitations'),
    (r'\bheadache\b', 'headache'),
    (r'\bmg/d[l1|I]\b', 'mg/dL'),
    (r'\bmm[hH]g\b', 'mmHg'),
    (r'\bmmol/[l1|I]\b', 'mmol/L'),
    (r'(\d+)\s*[oO]\s*/\s*(\d+)', r'\g<1>0/\g<2>'),
    (r'(\d+)\s*/\s*(\d+)\s*[oO]', r'\g<1>/\g<2>0'),
]

KNOWN_SYMPTOMS_MAP = {
    "shortness of breath": "Dyspnea / Shortness of Breath",
    "dyspnea": "Dyspnea / Shortness of Breath",
    "difficulty breathing": "Dyspnea / Shortness of Breath",
    "breathlessness": "Dyspnea / Shortness of Breath",
    "chest pain": "Substernal Chest Pain",
    "chest tightness": "Chest Tightness",
    "chest pressure": "Chest Pressure",
    "angina": "Angina Pectoris",
    "wheezing": "Expiratory Wheezing",
    "bronchospasm": "Bronchospasm",
    "cough": "Cough",
    "dry cough": "Nocturnal Dry Cough",
    "productive cough": "Productive Cough",
    "hemoptysis": "Hemoptysis",
    "palpitations": "Palpitations / Tachycardia",
    "racing heart": "Palpitations / Tachycardia",
    "rapid pulse": "Palpitations / Tachycardia",
    "headache": "Headache",
    "occipital headache": "Occipital Morning Headache",
    "migraine": "Migraine with Aura",
    "dizziness": "Dizziness / Lightheadedness",
    "vertigo": "Vertigo",
    "syncope": "Syncope / Presyncope",
    "fatigue": "Generalized Fatigue",
    "weakness": "Progressive Weakness",
    "malaise": "Malaise",
    "fever": "Pyrexia / Fever",
    "high fever": "High Spiking Fever",
    "chills": "Chills and Rigors",
    "diaphoresis": "Diaphoresis / Sweating",
    "night sweats": "Night Sweats",
    "nausea": "Nausea",
    "vomiting": "Vomiting",
    "abdominal pain": "Abdominal Pain",
    "diarrhea": "Watery Diarrhea",
    "heartburn": "Retrosternal Heartburn",
    "acid reflux": "Acid Regurgitation",
    "polyuria": "Polyuria",
    "polydipsia": "Polydipsia",
    "weight loss": "Unexplained Weight Loss",
    "weight gain": "Weight Gain",
    "edema": "Peripheral / Leg Edema",
    "leg swelling": "Unilateral / Bilateral Leg Swelling",
    "joint pain": "Polyarthralgia / Joint Pain",
    "joint swelling": "Joint Swelling and Warmth",
    "rash": "Cutaneous Rash / Erythema",
    "tremor": "Resting / Action Tremor",
    "pallor": "Conjunctival / Skin Pallor"
}

LAB_REFERENCE_RANGES = {
    "cholesterol": {"unit": "mg/dL", "normal_min": 120, "normal_max": 200, "high": 240},
    "ldl": {"unit": "mg/dL", "normal_min": 50, "normal_max": 100, "high": 160},
    "hdl": {"unit": "mg/dL", "normal_min": 40, "normal_max": 60, "low": 40},
    "triglycerides": {"unit": "mg/dL", "normal_min": 50, "normal_max": 150, "high": 200},
    "glucose": {"unit": "mg/dL", "normal_min": 70, "normal_max": 100, "high": 126},
    "fasting_glucose": {"unit": "mg/dL", "normal_min": 70, "normal_max": 100, "high": 126},
    "hba1c": {"unit": "%", "normal_min": 4.0, "normal_max": 5.6, "high": 6.5},
    "creatinine": {"unit": "mg/dL", "normal_min": 0.6, "normal_max": 1.2, "high": 1.4},
    "urea": {"unit": "mg/dL", "normal_min": 7, "normal_max": 20, "high": 25},
    "hemoglobin": {"unit": "g/dL", "normal_min": 12.0, "normal_max": 17.5, "low": 11.0},
    "wbc": {"unit": "x10^3/uL", "normal_min": 4.5, "normal_max": 11.0, "high": 12.0, "low": 4.0},
    "platelets": {"unit": "x10^3/uL", "normal_min": 150, "normal_max": 450, "low": 140},
    "troponin": {"unit": "ng/mL", "normal_min": 0.0, "normal_max": 0.04, "high": 0.04},
    "crp": {"unit": "mg/L", "normal_min": 0.0, "normal_max": 3.0, "high": 10.0},
    "potassium": {"unit": "mmol/L", "normal_min": 3.5, "normal_max": 5.0, "high": 5.2, "low": 3.4},
    "sodium": {"unit": "mmol/L", "normal_min": 135, "normal_max": 145, "high": 148, "low": 134},
}

class MedicalDocumentParser:
    """End-to-End Multimodal Clinical Document and Image Extraction Service."""

    def __init__(self):
        pass

    def _get_easyocr_reader(self):
        global _easyocr_reader
        if _easyocr_reader is None:
            try:
                import easyocr
                print("[OCR] Initializing EasyOCR English reader (CPU optimized)...")
                _easyocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            except Exception as e:
                print(f"[OCR] EasyOCR init notice: {e}")
        return _easyocr_reader

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """Applies grayscale, contrast enhancement, and adaptive sharpening to clean noisy scanned reports."""
        try:
            gray = image.convert('L')
            enhancer = ImageEnhance.Contrast(gray)
            enhanced = enhancer.enhance(1.8)
            sharpness = ImageEnhance.Sharpness(enhanced)
            sharpened = sharpness.enhance(1.5)
            return sharpened
        except Exception:
            return image

    def extract_text_from_pdf(self, file_bytes: bytes) -> Tuple[str, List[str], Dict[str, Any]]:
        """Extracts text from multi-page PDFs using direct PyMuPDF text extraction with OCR fallback for scanned pages."""
        full_text = []
        page_texts = []
        tables_found = []
        metadata = {"ocr_applied_pages": []}

        if fitz is not None:
            try:
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                metadata["total_pages"] = len(doc)
                metadata["format"] = "PDF (PyMuPDF)"
                
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    p_text = (page.get_text("text") or "").strip()
                    
                    # If page has very little text (< 30 chars), it is likely a scanned document page -> Apply OCR
                    if len(p_text) < 30:
                        try:
                            pix = page.get_pixmap(dpi=150)
                            img_bytes = pix.tobytes("png")
                            ocr_text, ocr_meta = self.extract_text_from_image(img_bytes, filename=f"page_{page_num+1}.png")
                            if ocr_text.strip():
                                p_text = ocr_text.strip()
                                metadata["ocr_applied_pages"].append(page_num + 1)
                        except Exception as ocr_err:
                            print(f"[DOCUMENT PARSER] Scanned page OCR fallback notice: {ocr_err}")

                    page_texts.append(p_text)
                    full_text.append(f"--- PAGE {page_num + 1} ---\n{p_text}")
                doc.close()
            except Exception as e:
                print(f"[DOCUMENT PARSER] PyMuPDF extraction warning: {e}")

        # Fallback to pdfplumber if text is still empty
        if (not full_text or len("".join(full_text).strip()) < 30) and pdfplumber is not None:
            try:
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    metadata["total_pages"] = len(pdf.pages)
                    metadata["format"] = "PDF (pdfplumber)"
                    page_texts = []
                    full_text = []
                    for page_num, page in enumerate(pdf.pages):
                        p_text = (page.extract_text() or "").strip()
                        page_texts.append(p_text)
                        full_text.append(f"--- PAGE {page_num + 1} ---\n{p_text}")
            except Exception as e:
                print(f"[DOCUMENT PARSER] pdfplumber fallback warning: {e}")

        extracted_str = "\n\n".join(full_text).strip()
        metadata["tables_detected"] = len(tables_found)
        return extracted_str, page_texts, metadata

    def extract_text_from_image(self, file_bytes: bytes, filename: str = "image.png") -> Tuple[str, Dict[str, Any]]:
        """Extracts text from PNG/JPG/JPEG medical documents using EasyOCR with image enhancement."""
        extracted_text = ""
        metadata = {"format": "IMAGE_OCR", "filename": filename, "ocr_engine": "None", "confidence": 0.0}

        try:
            image = Image.open(io.BytesIO(file_bytes))
            metadata["dimensions"] = f"{image.width}x{image.height}"
            clean_image = self.preprocess_image(image)
        except Exception as e:
            return "", {"error": f"Invalid image format: {str(e)}"}

        reader = self._get_easyocr_reader()
        if reader is not None:
            try:
                img_byte_arr = io.BytesIO()
                clean_image.save(img_byte_arr, format='PNG')
                ocr_results = reader.readtext(img_byte_arr.getvalue(), detail=1)
                
                lines = []
                conf_sum = 0.0
                for bbox, text, conf in ocr_results:
                    lines.append(text)
                    conf_sum += conf
                
                extracted_text = "\n".join(lines).strip()
                metadata["ocr_engine"] = "EasyOCR"
                metadata["confidence"] = round(conf_sum / max(len(ocr_results), 1), 3)
            except Exception as e:
                print(f"[DOCUMENT PARSER] EasyOCR error: {e}")

        return extracted_text, metadata

    def normalize_text(self, text: str) -> str:
        """Normalizes clinical OCR typos, spacing, units, and symbols."""
        if not text:
            return ""

        normalized = text
        for pattern, replacement in OCR_CORRECTIONS:
            normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)

        normalized = re.sub(r'[ \t]+', ' ', normalized)
        normalized = re.sub(r'\n{3,}', '\n\n', normalized)
        return normalized.strip()

    def extract_medical_information(self, text: str) -> Dict[str, Any]:
        """
        Extracts symptoms, lab parameters, vitals, demographics, medications,
        medical history, duration, and severity strictly without fabricating missing values.
        """
        if not text:
            return {
                "symptoms": [], "diagnoses_mentioned": [], "laboratory_values": {}, "lab_results": {},
                "vitals": {}, "medical_history": [], "family_history": [], "medications": [],
                "age": None, "sex": None, "height_cm": None, "weight_kg": None, "bmi": None,
                "smoking": None, "alcohol": None, "activity_level": None,
                "duration": None, "severity": None, "uncertain_fields": [],
                "source_text": "", "extraction_confidence": {}, "data_completeness_pct": 0.0
            }

        text_lower = text.lower()
        extracted_symptoms = []
        diagnoses_mentioned = []
        lab_results = {}
        vitals = {}
        medical_history = []
        family_history = []
        medications = []
        uncertain_fields = []
        confidences = {}

        # 1. Symptom Extraction
        for kw, canon in KNOWN_SYMPTOMS_MAP.items():
            if kw in text_lower and canon not in extracted_symptoms:
                extracted_symptoms.append(canon)
        if extracted_symptoms:
            confidences["symptoms"] = 0.95

        # 2. Vitals Extraction
        # Blood Pressure: e.g. 168/105, BP 140/90 mmHg, 120 / 80
        bp_match = re.search(r'(?:bp|blood pressure|pressure)?[:\s]*(\d{2,3})\s*/\s*(\d{2,3})', text_lower)
        if bp_match:
            sys_val = int(bp_match.group(1))
            dia_val = int(bp_match.group(2))
            if 60 <= sys_val <= 260 and 30 <= dia_val <= 180:
                vitals["systolic_bp"] = sys_val
                vitals["diastolic_bp"] = dia_val
                confidences["blood_pressure"] = 0.95

        # Heart Rate
        hr_match = re.search(r'(?:heart rate|hr|pulse|bpm)[:\s]*(\d{2,3})', text_lower)
        if hr_match:
            hr_val = int(hr_match.group(1))
            if 30 <= hr_val <= 220:
                vitals["heart_rate"] = hr_val
                confidences["heart_rate"] = 0.95

        # Temperature
        temp_match = re.search(r'(?:temp|temperature)[:\s]*(\d{2}(?:\.\d{1,2})?)\s*(?:°?c|°?f)?', text_lower)
        if temp_match:
            t_val = float(temp_match.group(1))
            if t_val > 90:  # Fahrenheit conversion
                vitals["temperature"] = round((t_val - 32) * 5 / 9, 1)
            elif 32 <= t_val <= 44:
                vitals["temperature"] = round(t_val, 1)
            confidences["temperature"] = 0.90

        # SpO2
        spo2_match = re.search(r'(?:spo2|o2 sat|oxygen saturation|saturation)[:\s]*(\d{2,3})\s*%?', text_lower)
        if spo2_match:
            spo2_val = int(spo2_match.group(1))
            if 50 <= spo2_val <= 100:
                vitals["spo2"] = spo2_val
                confidences["spo2"] = 0.95

        # 3. Demographics Extraction
        age_match = re.search(r'(?:age[:\s]*)?(\d{1,3})\s*(?:-| )?(?:year(?:s)?|yo|yr|y/o)', text_lower)
        if not age_match:
            age_match = re.search(r'\bage[:\s]+(\d{1,3})\b', text_lower)
        age_val = int(age_match.group(1)) if age_match and 1 <= int(age_match.group(1)) <= 120 else None
        if age_val is not None:
            confidences["age"] = 0.98

        sex_val = None
        if re.search(r'\b(female|woman|girl|mrs|ms)\b', text_lower):
            sex_val = "Female"
            confidences["sex"] = 0.95
        elif re.search(r'\b(male|man|boy|mr)\b', text_lower):
            sex_val = "Male"
            confidences["sex"] = 0.95

        # Height
        h_match = re.search(r'(?:height|ht)[:\s]*(\d{2,3}(?:\.\d+)?)\s*(?:cm|centimeters)?', text_lower)
        height_val = float(h_match.group(1)) if h_match and 100 <= float(h_match.group(1)) <= 240 else None

        # Weight
        w_match = re.search(r'(?:weight|wt)[:\s]*(\d{2,3}(?:\.\d+)?)\s*(?:kg|kilos|lbs|pounds)?', text_lower)
        weight_val = float(w_match.group(1)) if w_match and 30 <= float(w_match.group(1)) <= 300 else None

        # BMI
        bmi_match = re.search(r'bmi[:\s]*(\d{1,2}(?:\.\d{1,2})?)', text_lower)
        if bmi_match:
            bmi_val = float(bmi_match.group(1))
        elif height_val and weight_val and height_val > 0:
            bmi_val = round(weight_val / ((height_val / 100) ** 2), 1)
        else:
            bmi_val = None

        # 4. Lifestyle Factors
        smoking_val = None
        if any(w in text_lower for w in ["smoker", "smoking", "tobacco", "pack-year", "cigarettes"]):
            smoking_val = 0 if any(w in text_lower for w in ["non-smoker", "denies tobacco", "never smoked"]) else 1
            confidences["smoking"] = 0.90

        alcohol_val = None
        if any(w in text_lower for w in ["alcohol", "drinks", "ethanol"]):
            alcohol_val = 0 if any(w in text_lower for w in ["non-drinker", "denies alcohol", "no alcohol"]) else 1
            confidences["alcohol"] = 0.90

        activity_val = None
        if any(w in text_lower for w in ["sedentary", "inactive", "bedridden"]):
            activity_val = "Sedentary"
        elif any(w in text_lower for w in ["active", "regular exercise", "exercises daily"]):
            activity_val = "Active"

        # 5. Laboratory Values Extraction
        chol_match = re.search(r'(?:total\s+)?cholesterol[:\s]*(\d{2,3}(?:\.\d{1,2})?)', text_lower)
        if chol_match:
            c_val = float(chol_match.group(1))
            ref = LAB_REFERENCE_RANGES["cholesterol"]
            status = "Elevated" if c_val > ref["normal_max"] else ("Optimal" if c_val >= ref["normal_min"] else "Low")
            lab_results["cholesterol"] = {"value": c_val, "unit": ref["unit"], "status": status, "reference_range": f"{ref['normal_min']}-{ref['normal_max']} {ref['unit']}"}

        gluc_match = re.search(r'(?:fasting\s+)?(?:blood\s+)?glucose[:\s]*(\d{2,3}(?:\.\d{1,2})?)', text_lower)
        if gluc_match:
            g_val = float(gluc_match.group(1))
            ref = LAB_REFERENCE_RANGES["glucose"]
            status = "Elevated (Hyperglycemia)" if g_val > ref["normal_max"] else "Normal"
            lab_results["glucose"] = {"value": g_val, "unit": ref["unit"], "status": status, "reference_range": f"{ref['normal_min']}-{ref['normal_max']} {ref['unit']}"}

        # 6. Medical History & Medications
        history_keywords = [
            ("hypertension", "Essential Hypertension"),
            ("diabetes", "Type 2 Diabetes Mellitus"),
            ("dyslipidemia", "Hyperlipidemia"),
            ("coronary artery disease", "Coronary Artery Disease"),
            ("asthma", "Bronchial Asthma"),
            ("copd", "Chronic Obstructive Pulmonary Disease"),
            ("ckd", "Chronic Kidney Disease"),
            ("stroke", "Ischemic Stroke"),
            ("gerd", "Gastroesophageal Reflux Disease")
        ]
        for kw, canonical in history_keywords:
            if kw in text_lower and canonical not in medical_history:
                medical_history.append(canonical)

        med_keywords = [
            "amlodipine", "lisinopril", "losartan", "atorvastatin", "metformin",
            "aspirin", "albuterol", "furosemide", "metoprolol", "omeprazole",
            "hydrochlorothiazide", "insulin", "pantoprazole", "apixaban"
        ]
        for med in med_keywords:
            match = re.search(rf'\b({med}(?:\s+\d+\s*(?:mg|mcg|g))?)\b', text_lower)
            if match:
                medications.append(match.group(1).title())

        # 7. Duration & Severity
        dur_match = re.search(r'(\d+\s*(?:day|week|month|year|hour)s?)', text_lower)
        duration_val = dur_match.group(1) if dur_match else None

        severity_val = None
        if "critical" in text_lower:
            severity_val = "Critical"
        elif "severe" in text_lower:
            severity_val = "Severe"
        elif "mild" in text_lower:
            severity_val = "Mild"
        elif "moderate" in text_lower:
            severity_val = "Moderate"

        # Calculate Data Completeness (fraction of standard parameters present)
        key_fields = [age_val, sex_val, vitals.get("systolic_bp"), vitals.get("heart_rate"), vitals.get("spo2"), extracted_symptoms or None]
        completeness = round(sum(1 for f in key_fields if f is not None) / len(key_fields) * 100, 1)

        return {
            "symptoms": extracted_symptoms,
            "diagnoses_mentioned": diagnoses_mentioned,
            "laboratory_values": lab_results,
            "lab_results": lab_results,
            "vitals": vitals,
            "medical_history": medical_history,
            "family_history": family_history,
            "medications": medications,
            "age": age_val,
            "sex": sex_val,
            "height_cm": height_val,
            "weight_kg": weight_val,
            "bmi": bmi_val,
            "smoking": smoking_val,
            "alcohol": alcohol_val,
            "activity_level": activity_val,
            "duration": duration_val,
            "severity": severity_val,
            "uncertain_fields": uncertain_fields,
            "source_text": text,
            "extraction_confidence": confidences,
            "data_completeness_pct": completeness
        }

    def parse_document(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Master ingestion entry point: validates file, routes to PDF or Image parser, normalizes, and extracts entities."""
        start_time = time.time()
        ext = os.path.splitext(filename)[1].lower()

        if not file_bytes or len(file_bytes) == 0:
            return {
                "filename": filename,
                "status": "ERROR",
                "error": "The uploaded file is empty (0 bytes). Please upload a valid medical report.",
                "processing_time_ms": 0.0
            }

        if ext == ".pdf":
            raw_text, pages, meta = self.extract_text_from_pdf(file_bytes)
            file_type = "Portable Document Format (PDF)"
        elif ext in [".txt", ".text", ".log"]:
            raw_text = file_bytes.decode('utf-8', errors='ignore')
            pages = [raw_text]
            file_type = "Clinical Note / Text Document (TXT)"
            meta = {"pages": 1}
        elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"]:
            raw_text, meta = self.extract_text_from_image(file_bytes, filename=filename)
            pages = [raw_text]
            file_type = f"Medical Image ({ext.upper().replace('.', '')})"
        else:
            return {
                "filename": filename,
                "status": "ERROR",
                "error": f"Unsupported file type '{ext}'. Supported formats: PDF, PNG, JPG, JPEG, TIFF, WEBP, TXT.",
                "processing_time_ms": round((time.time() - start_time) * 1000, 2)
            }

        if not raw_text.strip():
            return {
                "filename": filename,
                "file_type": file_type,
                "status": "ERROR",
                "error": "No readable text could be extracted from the document. Please ensure the document is not password-protected or completely blank.",
                "processing_time_ms": round((time.time() - start_time) * 1000, 2)
            }

        normalized_text = self.normalize_text(raw_text)
        structured_info = self.extract_medical_information(normalized_text)

        processing_time_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "filename": filename,
            "file_type": file_type,
            "status": "SUCCESS",
            "pages_count": len(pages),
            "raw_text_length": len(raw_text),
            "raw_text": raw_text,
            "normalized_text": normalized_text,
            "extracted_patient": structured_info,
            "metadata": meta,
            "processing_time_ms": processing_time_ms
        }

# Global singleton instance
medical_document_parser = MedicalDocumentParser()

