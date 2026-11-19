"""
Predefined Canonical Test Samples from PAD-UFES-20 Held-Out Test Split.
Provides 4 verified test cases (one each for BCC, ACK, NEV, SEK) with images,
symptoms, and clinical metadata for one-click testing in the web UI.
"""

import base64
from pathlib import Path
from typing import List, Dict, Any

PROJECT_ROOT = Path(__file__).resolve().parents[3]

CANONICAL_SAMPLES: List[Dict[str, Any]] = [
    {
        "disease": "BCC",
        "displayName": "Basal Cell Carcinoma (BCC)",
        "img_id": "PAT_46_881_939.png",
        "narrative": "Patient is a 55-year-old female presenting with an elevated lesion on the neck. Dimensions are approximately 6.0 by 5.0 mm. The lesion is palpable, has progressively grown and evolved in appearance, with spontaneous contact bleeding and pruritus.",
        "symptoms": {
            "itch": "yes",
            "grew": "yes",
            "hurt": "no",
            "changed": "yes",
            "bleed": "yes",
            "elevation": "yes"
        },
        "age": "55",
        "gender": "FEMALE",
        "region": "NECK",
        "diameter1": "6.0",
        "diameter2": "5.0"
    },
    {
        "disease": "ACK",
        "displayName": "Actinic Keratosis (ACK)",
        "img_id": "PAT_359_4450_86.png",
        "narrative": "Patient is a 54-year-old female presenting with a flat macular scaly lesion on the forearm. Dimensions are approximately 10.0 by 10.0 mm. The lesion has remained stable in size without growth, itching, pain, or bleeding.",
        "symptoms": {
            "itch": "no",
            "grew": "no",
            "hurt": "no",
            "changed": "no",
            "bleed": "no",
            "elevation": "no"
        },
        "age": "54",
        "gender": "FEMALE",
        "region": "FOREARM",
        "diameter1": "10.0",
        "diameter2": "10.0"
    },
    {
        "disease": "NEV",
        "displayName": "Melanocytic Nevus (NEV)",
        "img_id": "PAT_1803_3463_639.png",
        "narrative": "Patient is a 26-year-old presenting with an elevated skin lesion on the back. The lesion is palpable with recent progressive enlargement. No itching, pain, or spontaneous bleeding reported.",
        "symptoms": {
            "itch": "no",
            "grew": "yes",
            "hurt": "no",
            "changed": "no",
            "bleed": "no",
            "elevation": "yes"
        },
        "age": "26",
        "gender": "UNKNOWN",
        "region": "BACK",
        "diameter1": "5.0",
        "diameter2": "5.0"
    },
    {
        "disease": "SEK",
        "displayName": "Seborrheic Keratosis (SEK)",
        "img_id": "PAT_1721_3219_737.png",
        "narrative": "Patient is a 53-year-old presenting with an elevated verrucous skin lesion on the chest. The lesion is palpable and stable in size and appearance without noticeable growth, itching, pain, or bleeding.",
        "symptoms": {
            "itch": "no",
            "grew": "no",
            "hurt": "no",
            "changed": "no",
            "bleed": "no",
            "elevation": "yes"
        },
        "age": "53",
        "gender": "UNKNOWN",
        "region": "CHEST",
        "diameter1": "7.0",
        "diameter2": "6.0"
    }
]

def get_sample_cases_with_images() -> List[Dict[str, Any]]:
    samples_out = []
    for s in CANONICAL_SAMPLES:
        item = dict(s)
        img_p = PROJECT_ROOT / "data/multimodal/images" / s["img_id"]
        if img_p.exists():
            with open(img_p, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
            item["image_base64"] = f"data:image/png;base64,{b64}"
            item["has_image"] = True
        else:
            item["image_base64"] = None
            item["has_image"] = False
        samples_out.append(item)
    return samples_out
