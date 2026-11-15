import os
import re
import json
import argparse
import numpy as np
import pandas as pd
import cv2
from sklearn.model_selection import StratifiedGroupKFold

CLASSES = ["BCC", "ACK", "NEV", "SEK"]
LABEL_MAP = {c: i for i, c in enumerate(CLASSES)}

FORBIDDEN_WORDS = [
    r"\bbcc\b", r"\back\b", r"\bnev\b", r"\bsek\b",
    r"\bbasal\b", r"\bactinic\b", r"\bkeratosis\b", r"\bnevus\b", r"\bnevi\b",
    r"\bcarcinoma\b", r"\bseborrheic\b", r"\bmelanoma\b", r"\bscc\b"
]

def clean_val(val):
    if pd.isna(val):
        return None
    s = str(val).strip()
    if s.upper() in ["UNK", "NAN", "NONE", ""]:
        return None
    if s.upper() == "TRUE":
        return True
    if s.upper() == "FALSE":
        return False
    return s

def build_patient_narrative(row):
    """
    Builds a natural patient-style clinical narrative from clinical metadata.
    Guaranteed to never contain any class names or abbreviations.
    """
    sentences = []
    
    # Age & Gender
    age = row.get("age")
    gender = row.get("gender")
    age_str = None
    if pd.notna(age) and str(age).strip() not in ["", "UNK", "nan"]:
        try:
            age_int = int(float(age))
            age_str = f"{age_int}-year-old"
        except Exception:
            pass
            
    gender_str = None
    if pd.notna(gender) and str(gender).strip() not in ["", "UNK", "nan"]:
        g = str(gender).strip().lower()
        if g in ["female", "f"]:
            gender_str = "female"
        elif g in ["male", "m"]:
            gender_str = "male"
            
    if age_str and gender_str:
        sentences.append(f"Patient is a {age_str} {gender_str} presenting with a skin lesion.")
    elif age_str:
        sentences.append(f"Patient is {age_str} presenting with a skin lesion.")
    elif gender_str:
        sentences.append(f"Patient is a {gender_str} presenting with a cutaneous lesion.")
    else:
        sentences.append("Patient presents for dermatological examination of a cutaneous lesion.")
        
    # Region / Location
    region = row.get("region")
    if pd.notna(region) and str(region).strip() not in ["", "UNK", "nan"]:
        r = str(region).strip().lower()
        sentences.append(f"The affected lesion is located on the {r}.")
        
    # Dimensions & Fitzpatrick
    d1 = row.get("diameter_1")
    d2 = row.get("diameter_2")
    d1_valid = pd.notna(d1) and str(d1).strip() not in ["", "UNK", "nan"]
    d2_valid = pd.notna(d2) and str(d2).strip() not in ["", "UNK", "nan"]
    if d1_valid and d2_valid:
        try:
            sentences.append(f"Clinical measurements show dimensions of approximately {float(d1):.1f} by {float(d2):.1f} mm.")
        except Exception:
            pass
    elif d1_valid:
        try:
            sentences.append(f"Clinical measurement shows a diameter of approximately {float(d1):.1f} mm.")
        except Exception:
            pass
            
    fitz = row.get("fitspatrick")
    if pd.notna(fitz) and str(fitz).strip() not in ["", "UNK", "nan"]:
        try:
            f_val = int(float(fitz))
            sentences.append(f"Patient has Fitzpatrick skin phototype {f_val}.")
        except Exception:
            pass
            
    # Lesion Morphology & Sensation
    elev = clean_val(row.get("elevation"))
    if elev is True:
        sentences.append("The skin lesion is elevated and palpable.")
    elif elev is False:
        sentences.append("The skin lesion is flat and macular.")
        
    grew = clean_val(row.get("grew"))
    changed = clean_val(row.get("changed"))
    if grew is True and changed is True:
        sentences.append("The patient notes that the spot has progressively grown in size and evolved in appearance.")
    elif grew is True:
        sentences.append("The patient reports recent progressive enlargement of the lesion.")
    elif changed is True:
        sentences.append("The patient reports noticeable changes in lesion contour or pigmentation.")
    elif grew is False and changed is False:
        sentences.append("The lesion has remained stable in size and appearance without noticeable growth.")
        
    itch = clean_val(row.get("itch"))
    hurt = clean_val(row.get("hurt"))
    bleed = clean_val(row.get("bleed"))
    
    symptoms = []
    if itch is True:
        symptoms.append("pruritus and persistent itching")
    if hurt is True:
        symptoms.append("local tenderness and pain")
    if bleed is True:
        symptoms.append("spontaneous or contact bleeding")
        
    no_symptoms = []
    if itch is False:
        no_symptoms.append("itching")
    if hurt is False:
        no_symptoms.append("pain")
    if bleed is False:
        no_symptoms.append("bleeding")
        
    if symptoms:
        sentences.append(f"Associated symptoms include {' and '.join(symptoms)}.")
    elif no_symptoms:
        sentences.append(f"The patient denies {' or '.join(no_symptoms)}.")
        
    # Risk factors & medical background (no diagnostic words)
    risks = []
    skin_hist = clean_val(row.get("skin_cancer_history"))
    if skin_hist is True:
        risks.append("personal history of prior skin lesions requiring excision")
    gen_hist = clean_val(row.get("cancer_history"))
    if gen_hist is True:
        risks.append("family history of neoplastic disease")
    pest = clean_val(row.get("pesticide"))
    if pest is True:
        risks.append("chronic occupational pesticide exposure")
    smoke = clean_val(row.get("smoke"))
    if smoke is True:
        risks.append("tobacco smoking history")
    drink = clean_val(row.get("drink"))
    if drink is True:
        risks.append("regular alcohol consumption")
        
    if risks:
        sentences.append(f"Relevant background includes {', '.join(risks)}.")
        
    narrative = " ".join(sentences)
    
    # Verify no forbidden words
    for pat in FORBIDDEN_WORDS:
        if re.search(pat, narrative, re.IGNORECASE):
            narrative = re.sub(pat, "lesion", narrative, flags=re.IGNORECASE)
            
    return narrative

def find_image_file(root_dir, img_id):
    """Search for img_id in root_dir and its subdirectories."""
    # Direct check
    cand = os.path.join(root_dir, img_id)
    if os.path.exists(cand):
        return cand
    cand = os.path.join(root_dir, "images", img_id)
    if os.path.exists(cand):
        return cand
    # Subdirectories
    for sub in ["imgs_part_1", "imgs_part_2", "imgs_part_3"]:
        cand = os.path.join(root_dir, "images", sub, img_id)
        if os.path.exists(cand):
            return cand
        cand = os.path.join(root_dir, sub, img_id)
        if os.path.exists(cand):
            return cand
    # Full recursive search if not found
    for r, _, files in os.walk(root_dir):
        if img_id in files:
            return os.path.join(r, img_id)
    return None

def compute_image_metrics(img_bgr):
    """Computes blur_laplacian_var and brightness_mean."""
    # Blur
    h, w = img_bgr.shape[:2]
    max_side = max(h, w)
    if max_side > 512:
        scale = 512.0 / max_side
        small = cv2.resize(img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    else:
        small = img_bgr
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    blur_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    
    # Brightness (LAB L mean)
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    brightness = float(lab[:, :, 0].mean())
    
    return blur_var, brightness

def main():
    parser = argparse.ArgumentParser(description="Build PAD-UFES-20 4-class multimodal dataset.")
    parser.add_argument("--root", type=str, default="data/raw/pad_ufes_20", help="Path to raw dataset folder")
    parser.add_argument("--out", type=str, default="data/multimodal", help="Path to output directory")
    parser.add_argument("--resize", type=int, default=384, help="Target image size")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()
    
    os.makedirs(args.out, exist_ok=True)
    out_images_dir = os.path.join(args.out, "images")
    os.makedirs(out_images_dir, exist_ok=True)
    
    # Locate metadata.csv
    meta_path = os.path.join(args.root, "metadata.csv")
    if not os.path.exists(meta_path):
        meta_path = os.path.join(args.root, "zr7vgbcyr2-1", "metadata.csv")
    if not os.path.exists(meta_path):
        raise FileNotFoundError(f"Could not find metadata.csv under {args.root}")
        
    print(f"Loading metadata from {meta_path}...")
    df = pd.read_csv(meta_path)
    print(f"Initial total records: {len(df)}")
    
    # 1. Filter to 4 classes
    df = df[df["diagnostic"].isin(CLASSES)].copy().reset_index(drop=True)
    print(f"Filtered to 4 classes ({', '.join(CLASSES)}): {len(df)} records")
    
    # Label mapping
    df["label"] = df["diagnostic"].map(LABEL_MAP)
    
    # Class counts
    class_counts = df["diagnostic"].value_counts().to_dict()
    print("Class counts:", class_counts)
    
    # Save class_counts.json and label_mapping.json
    with open(os.path.join(args.out, "class_counts.json"), "w") as f:
        json.dump(class_counts, f, indent=2)
    with open(os.path.join(args.out, "label_mapping.json"), "w") as f:
        json.dump(LABEL_MAP, f, indent=2)
        
    # 2. Build narratives
    print("Generating symptom narratives...")
    df["narrative"] = df.apply(build_patient_narrative, axis=1)
    
    # Check no diagnosis words leak into narratives
    for pat in FORBIDDEN_WORDS:
        leaks = df[df["narrative"].str.contains(pat, case=False, regex=True)]
        if len(leaks) > 0:
            raise AssertionError(f"Pattern '{pat}' found in {len(leaks)} narratives!")
    print("Narrative sanity check passed: 0 forbidden words found.")
    
    # 3. StratifiedGroupKFold by patient_id
    print("Creating 5 StratifiedGroupKFold splits by patient_id...")
    sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=args.seed)
    df["fold"] = -1
    
    for fold_idx, (train_idx, val_idx) in enumerate(sgkf.split(df, df["label"], df["patient_id"])):
        df.loc[val_idx, "fold"] = fold_idx
        
    # Assert no patient_id leakage across folds
    for f in range(5):
        fold_patients = set(df[df["fold"] == f]["patient_id"])
        other_patients = set(df[df["fold"] != f]["patient_id"])
        leakage = fold_patients.intersection(other_patients)
        assert len(leakage) == 0, f"Patient leakage detected in fold {f}: {leakage}"
        # Assert every fold has every class
        fold_classes = set(df[df["fold"] == f]["label"])
        assert len(fold_classes) == 4, f"Fold {f} is missing classes! Found: {fold_classes}"
        
    print("Leakage & balance assertions passed: All 5 folds strictly disjoint by patient_id and have all 4 classes.")
    
    # 4. Feature encodings f_*
    print("Encoding tabular features f_*...")
    df["f_age"] = pd.to_numeric(df["age"], errors="coerce").fillna(50.0) / 100.0
    df["f_gender_female"] = (df["gender"].astype(str).str.upper() == "FEMALE").astype(float)
    df["f_gender_male"] = (df["gender"].astype(str).str.upper() == "MALE").astype(float)
    
    for col in ["itch", "grew", "hurt", "changed", "bleed", "elevation"]:
        df[f"f_{col}"] = df[col].apply(lambda x: 1.0 if clean_val(x) is True else (0.0 if clean_val(x) is False else 0.5))
        
    df["f_fitzpatrick"] = pd.to_numeric(df["fitspatrick"], errors="coerce").fillna(2.0) / 6.0
    df["f_diameter_1"] = pd.to_numeric(df["diameter_1"], errors="coerce").fillna(5.0) / 50.0
    df["f_diameter_2"] = pd.to_numeric(df["diameter_2"], errors="coerce").fillna(5.0) / 50.0
    
    for col in ["smoke", "drink", "pesticide", "skin_cancer_history", "cancer_history"]:
        df[f"f_{col}"] = df[col].apply(lambda x: 1.0 if clean_val(x) is True else 0.0)
        
    # 5. Process images & compute blur and brightness
    print(f"Processing images (resizing to {args.resize}px and computing quality metrics)...")
    blur_scores = []
    brightness_scores = []
    valid_mask = []
    image_rel_paths = []
    
    missing_count = 0
    for idx, row in df.iterrows():
        img_id = row["img_id"]
        raw_img_path = find_image_file(args.root, img_id)
        
        target_path = os.path.join(out_images_dir, img_id)
        rel_target_path = os.path.join("data", "multimodal", "images", img_id).replace("\\", "/")
        image_rel_paths.append(rel_target_path)
        
        if raw_img_path and os.path.exists(raw_img_path):
            img = cv2.imread(raw_img_path)
            if img is not None:
                # Resize to target size (square resize for model input)
                img_resized = cv2.resize(img, (args.resize, args.resize), interpolation=cv2.INTER_AREA)
                cv2.imwrite(target_path, img_resized)
                
                b_var, bright = compute_image_metrics(img_resized)
                blur_scores.append(b_var)
                brightness_scores.append(bright)
                valid_mask.append(True)
                continue
                
        # If image not yet extracted or missing, record placeholder or default
        missing_count += 1
        blur_scores.append(150.0)
        brightness_scores.append(50.0)
        valid_mask.append(False)
        
    df["blur_laplacian_var"] = blur_scores
    df["brightness_mean"] = brightness_scores
    df["image_path"] = image_rel_paths
    
    print(f"Images processed: {len(df) - missing_count} found, {missing_count} missing/pending.")
    
    # 6. Save manifest.csv
    manifest_file = os.path.join(args.out, "manifest.csv")
    df.to_csv(manifest_file, index=False)
    print(f"Successfully generated {manifest_file} ({len(df)} samples).")
    
if __name__ == "__main__":
    main()
