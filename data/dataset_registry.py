"""
Dataset registry for MEDINTEL AI.
Only pad_ufes_20_4class is registered.
"""

from typing import Dict, Any

DATASETS = {
    "pad_ufes_20_4class": {
        "name": "PAD-UFES-20 (4 classes)",
        "classes": ["BCC", "ACK", "NEV", "SEK"],
        "num_classes": 4,
        "manifest_path": "data/multimodal/manifest.csv",
        "description": "Multimodal dataset of clinical smartphone images and paired patient symptom narratives."
    }
}

def get_dataset_info(dataset_name: str = "pad_ufes_20_4class") -> Dict[str, Any]:
    if dataset_name not in DATASETS:
        raise ValueError(f"Unknown dataset '{dataset_name}'. Only 'pad_ufes_20_4class' is supported.")
    return DATASETS[dataset_name]

def list_registered_datasets():
    return list(DATASETS.keys())
