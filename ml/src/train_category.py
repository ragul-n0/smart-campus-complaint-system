"""
Train Category Classification Model
Smart Campus Complaint & Issue Management System

Pipeline:
  complaint_text -> TF-IDF Vectorizer -> Logistic Regression -> category
"""

import os
from pathlib import Path
import matplotlib
matplotlib.use("Agg")  # Headless backend for server/CLI environments
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
import joblib


def clean_text(text_series: pd.Series) -> pd.Series:
    """Handle missing text, convert to string, and strip whitespace."""
    return text_series.fillna("").astype(str).str.strip()


def train_category_model(
    data_path: Path = None,
    output_model_path: Path = None,
    output_cm_path: Path = None,
    random_state: int = 42,
    test_size: float = 0.20,
):
    base_dir = Path(__file__).resolve().parent.parent
    if data_path is None:
        data_path = base_dir / "data" / "complaints_dataset.csv"
    if output_model_path is None:
        output_model_path = base_dir / "models" / "category_model.joblib"
    if output_cm_path is None:
        output_cm_path = base_dir / "models" / "category_confusion_matrix.png"

    print("=" * 60)
    print("Training Category Classification Model")
    print("=" * 60)
    print(f"Dataset path: {data_path}")
    print(f"Output model: {output_model_path}")
    print(f"Output confusion matrix: {output_cm_path}")

    # 1. Load dataset
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    df = pd.read_csv(data_path)

    # 2. Validate columns
    required_cols = ["complaint_text", "category"]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column in dataset: {col}")

    # 3. Clean complaint text
    df["complaint_text"] = clean_text(df["complaint_text"])
    df["category"] = df["category"].fillna("").astype(str).str.strip()

    # Drop any rows with empty text or category
    df = df[(df["complaint_text"] != "") & (df["category"] != "")].reset_index(drop=True)
    total_samples = len(df)
    print(f"Loaded {total_samples} valid complaint samples.")

    X = df["complaint_text"]
    y = df["category"]

    # 4. Train/Test Split (80/20 stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )
    print(f"Training samples: {len(X_train)} (80%)")
    print(f"Testing samples:  {len(X_test)} (20%)")

    # 5. Build TF-IDF + Logistic Regression pipeline
    # Settings explanation:
    # - lowercase=True: normalizes text case
    # - ngram_range=(1, 2): captures unigrams and bigrams (e.g., 'power socket', 'water leak')
    # - sublinear_tf=True: logarithmic term frequency scaling prevents high-frequency dominance
    # - min_df=1: includes domain keywords present in small datasets
    # - C=1.0: standard regularization strength
    # - max_iter=1000: guarantees full optimization convergence
    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    sublinear_tf=True,
                    min_df=1,
                    max_features=2500,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=1000,
                    random_state=random_state,
                    C=1.0,
                    solver="lbfgs",
                ),
            ),
        ]
    )

    # 6. Fit pipeline ONLY on training data (prevents data leakage)
    print("\nFitting model on training set...")
    pipeline.fit(X_train, y_train)

    # 7. Predict test set
    y_pred = pipeline.predict(X_test)

    # 8. Calculate evaluation metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec_weighted = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    rec_weighted = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1_weighted = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    prec_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
    rec_macro = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
    f1_macro = float(f1_score(y_test, y_pred, average="macro", zero_division=0))

    print("\nEvaluation Metrics (Test Set):")
    print(f"  Accuracy:           {acc:.4f} ({acc * 100:.2f}%)")
    print(f"  Precision (weighted): {prec_weighted:.4f}")
    print(f"  Recall (weighted):    {rec_weighted:.4f}")
    print(f"  F1-Score (weighted):  {f1_weighted:.4f}")
    print(f"  F1-Score (macro):     {f1_macro:.4f}")

    print("\nDetailed Classification Report:")
    report_text = classification_report(y_test, y_pred, digits=4, zero_division=0)
    print(report_text)
    report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    # 9. Confusion Matrix
    output_cm_path.parent.mkdir(parents=True, exist_ok=True)
    labels = sorted(y.unique())
    cm = confusion_matrix(y_test, y_pred, labels=labels)

    plt.figure(figsize=(9, 7))
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    plt.title("Category Model Confusion Matrix", fontsize=14, pad=15)
    plt.colorbar()
    tick_marks = np.arange(len(labels))
    plt.xticks(tick_marks, labels, rotation=45, ha="right", fontsize=10)
    plt.yticks(tick_marks, labels, fontsize=10)

    # Annotate cell counts
    thresh = cm.max() / 2.0 if cm.max() > 0 else 1.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            val = cm[i, j]
            plt.text(
                j,
                i,
                f"{val}",
                ha="center",
                va="center",
                color="white" if val > thresh else "black",
                fontsize=11,
                fontweight="bold" if val > 0 else "normal",
            )

    plt.ylabel("Actual Category", fontsize=12, fontweight="bold")
    plt.xlabel("Predicted Category", fontsize=12, fontweight="bold")
    plt.tight_layout()
    plt.savefig(output_cm_path, dpi=300)
    plt.close()
    print(f"Saved confusion matrix image to: {output_cm_path}")

    # 10. Save trained model
    output_model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, output_model_path)
    print(f"Saved trained category model to: {output_model_path}")

    return {
        "model_name": "category_model",
        "total_samples": total_samples,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": acc,
        "precision_weighted": prec_weighted,
        "recall_weighted": rec_weighted,
        "f1_weighted": f1_weighted,
        "precision_macro": prec_macro,
        "recall_macro": rec_macro,
        "f1_macro": f1_macro,
        "classes": labels,
        "classification_report": report_dict,
        "model_path": str(output_model_path),
        "confusion_matrix_path": str(output_cm_path),
    }


if __name__ == "__main__":
    train_category_model()
