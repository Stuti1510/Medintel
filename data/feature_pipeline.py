"""
Text feature extraction pipeline using TF-IDF for PAD-UFES-20 narratives.
Only TfidfVectorizer (word 1-2 grams, sublinear TF, min_df=1) fit on training folds.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import os

def create_tfidf_vectorizer():
    return TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=1
    )

def fit_tfidf_pipeline(train_texts, save_path=None):
    vectorizer = create_tfidf_vectorizer()
    X = vectorizer.fit_transform(train_texts)
    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        joblib.dump(vectorizer, save_path)
    return vectorizer, X

def load_tfidf_pipeline(load_path):
    if not os.path.exists(load_path):
        raise FileNotFoundError(f"TF-IDF vectorizer not found at {load_path}")
    return joblib.load(load_path)
