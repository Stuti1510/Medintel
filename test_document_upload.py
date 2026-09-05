import io
import httpx
import fitz
from PIL import Image, ImageDraw, ImageFont

# 1. Create a synthetic test PDF medical report
pdf_doc = fitz.open()
page = pdf_doc.new_page()
pdf_text = """CLINICAL ENCOUNTER REPORT
Patient Name: John Doe    Age: 58    Sex: Male
Encounter Date: 2026-09-05

VITAL SIGNS:
Blood Pressure: 168/105 mmHg
Heart Rate: 96 bpm
Temperature: 36.8 C
SpO2: 95%

PRESENTING SYMPTOMS:
Occipital headache, severe exertional dyspnea, chest tightness, palpitations.

LABORATORY RESULTS:
Total Cholesterol: 245 mg/dL (Reference: 120-200 mg/dL)
Fasting Glucose: 135 mg/dL (Reference: 70-100 mg/dL)
HbA1c: 6.8% (Reference: <5.7%)
Troponin-I: 0.02 ng/mL (Reference: <0.04 ng/mL)

MEDICAL HISTORY:
Essential hypertension, hyperlipidemia, chronic tobacco use (1 pack/day).

CURRENT MEDICATIONS:
Amlodipine 5mg daily, Atorvastatin 20mg.
"""
page.insert_text((50, 50), pdf_text, fontsize=11)
pdf_bytes = pdf_doc.write()
pdf_doc.close()

# 2. Create a test PNG report image
img = Image.new('RGB', (700, 450), color=(255, 255, 255))
draw = ImageDraw.Draw(img)
draw.text((30, 30), "LABORATORY DIAGNOSTIC REPORT", fill=(0, 0, 0))
draw.text((30, 60), "Patient: Jane Smith   Age: 38   Sex: Female", fill=(0, 0, 0))
draw.text((30, 90), "Vitals: BP 118/74 mmHg, HR 84 bpm, SpO2 97%", fill=(0, 0, 0))
draw.text((30, 120), "Symptoms: Bilateral expiratory wheezing, nocturnal dry cough", fill=(0, 0, 0))
draw.text((30, 150), "Cholesterol: 175 mg/dL (Normal)", fill=(0, 0, 0))
draw.text((30, 180), "Fasting Glucose: 92 mg/dL (Normal)", fill=(0, 0, 0))
draw.text((30, 210), "History: Mild intermittent bronchial asthma", fill=(0, 0, 0))

img_bytes_io = io.BytesIO()
img.save(img_bytes_io, format='PNG')
png_bytes = img_bytes_io.getvalue()

# Test POST to /api/documents/upload
client = httpx.Client(base_url="http://127.0.0.1:8000", timeout=30.0)

print("--- TESTING PDF REPORT UPLOAD ---")
files_pdf = {"file": ("encounter_report.pdf", pdf_bytes, "application/pdf")}
resp_pdf = client.post("/api/documents/upload?run_analysis=true", files=files_pdf)
print("PDF Upload Status:", resp_pdf.status_code)
pdf_res = resp_pdf.json()
print("Extracted Symptoms:", pdf_res.get("document", {}).get("extracted_patient", {}).get("symptoms"))
print("Extracted Lab Results:", list(pdf_res.get("document", {}).get("extracted_patient", {}).get("lab_results", {}).keys()))
print("Extracted Vitals:", pdf_res.get("document", {}).get("extracted_patient", {}).get("vitals"))
print("Analysis Predicted Condition:", pdf_res.get("analysis", {}).get("ml_prediction", {}).get("predicted_condition"))
print("Analysis Confidence:", pdf_res.get("analysis", {}).get("ml_prediction", {}).get("confidence_percentage"))

print("\n--- TESTING PNG REPORT UPLOAD ---")
files_png = {"file": ("lab_report.png", png_bytes, "image/png")}
resp_png = client.post("/api/documents/upload?run_analysis=true", files=files_png)
print("PNG Upload Status:", resp_png.status_code)
png_res = resp_png.json()
print("Extracted Symptoms:", png_res.get("document", {}).get("extracted_patient", {}).get("symptoms"))
print("Extracted Vitals:", png_res.get("document", {}).get("extracted_patient", {}).get("vitals"))
print("Analysis Predicted Condition:", png_res.get("analysis", {}).get("ml_prediction", {}).get("predicted_condition"))

print("\nALL DOCUMENT UPLOAD TESTS COMPLETED SUCCESSFULLY!")
