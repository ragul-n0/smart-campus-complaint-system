"""
Step 8C Priority Classification Model Training & Fair Evaluation.

Trains on ml/data/complaint_dataset_step8c.csv (920 samples).
Saves model artifact to ml/models/priority_model_step8c.joblib
Saves confusion matrix to ml/models/priority_confusion_matrix_step8c.png
Preserves ml/models/priority_model.joblib as Step 8B baseline.
"""

from pathlib import Path
import matplotlib
matplotlib.use("Agg")
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
    return text_series.fillna("").astype(str).str.strip()


def train_priority_step8c(
    data_path: Path = None,
    output_model_path: Path = None,
    output_cm_path: Path = None,
    random_state: int = 42,
    test_size: float = 0.20,
):
    base_dir = Path(__file__).resolve().parent.parent
    if data_path is None:
        data_path = base_dir / "data" / "complaint_dataset_step8c.csv"
    if output_model_path is None:
        output_model_path = base_dir / "models" / "priority_model_step8c.joblib"
    if output_cm_path is None:
        output_cm_path = base_dir / "models" / "priority_confusion_matrix_step8c.png"

    print("=" * 65)
    print("STEP 8C — Priority Model Training on Improved Dataset")
    print("=" * 65)
    print(f"Dataset Path: {data_path}")
    print(f"Output Model: {output_model_path}")
    print(f"Output CM:    {output_cm_path}")

    df = pd.read_csv(data_path)
    df["complaint_text"] = clean_text(df["complaint_text"])
    df["priority"] = df["priority"].fillna("").astype(str).str.strip()

    df = df[(df["complaint_text"] != "") & (df["priority"] != "")].reset_index(drop=True)
    total_samples = len(df)
    print(f"Total valid samples: {total_samples}")

    X = df["complaint_text"]
    y = df["priority"]

    # 80/20 Stratified train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )
    print(f"Training samples:   {len(X_train)} (80%)")
    print(f"Testing samples:    {len(X_test)} (20%)")

    # Pipeline: TF-IDF (unigrams + bigrams) -> Logistic Regression
    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    sublinear_tf=True,
                    min_df=1,
                    max_features=5000,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=1000,
                    random_state=random_state,
                    C=1.5,
                    class_weight="balanced",
                    solver="lbfgs",
                ),
            ),
        ]
    )

    # Train strictly on X_train (avoids test-data leakage)
    print("\nFitting Step 8C Priority Pipeline on training data...")
    pipeline.fit(X_train, y_train)

    # Evaluate on strictly unseen X_test
    y_pred = pipeline.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    prec_weighted = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    rec_weighted = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1_weighted = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    prec_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
    rec_macro = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
    f1_macro = float(f1_score(y_test, y_pred, average="macro", zero_division=0))

    print("\n" + "=" * 50)
    print("STEP 8C PRIORITY EVALUATION RESULTS (Test Set):")
    print("=" * 50)
    print(f"Accuracy:              {acc:.4f} ({acc * 100:.2f}%)")
    print(f"Precision (Weighted):  {prec_weighted:.4f}")
    print(f"Recall (Weighted):     {rec_weighted:.4f}")
    print(f"F1-Score (Weighted):   {f1_weighted:.4f}")
    print(f"Precision (Macro):     {prec_macro:.4f}")
    print(f"Recall (Macro):        {rec_macro:.4f}")
    print(f"F1-Score (Macro):      {f1_macro:.4f}")

    print("\nDetailed Per-Class Classification Report:")
    report_text = classification_report(y_test, y_pred, digits=4, zero_division=0)
    print(report_text)
    report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    # Plot Confusion Matrix
    output_cm_path.parent.mkdir(parents=True, exist_ok=True)
    labels = ["Low", "Medium", "High"]
    cm = confusion_matrix(y_test, y_pred, labels=labels)

    plt.figure(figsize=(7, 6))
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Oranges)
    plt.title("Step 8C Priority Confusion Matrix (N=184 Test Samples)", fontsize=13, pad=15)
    plt.colorbar()
    tick_marks = np.arange(len(labels))
    plt.xticks(tick_marks, labels, fontsize=11)
    plt.yticks(tick_marks, labels, fontsize=11)

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
                fontsize=12,
                fontweight="bold" if val > 0 else "normal",
            )

    plt.ylabel("Actual Priority", fontsize=11, fontweight="bold")
    plt.xlabel("Predicted Priority", fontsize=11, fontweight="bold")
    plt.tight_layout()
    plt.savefig(output_cm_path, dpi=300)
    plt.close()
    print(f"Saved Step 8C priority confusion matrix to: {output_cm_path}")

    # Save Step 8C Model separately
    output_model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, output_model_path)
    print(f"Saved Step 8C priority model to: {output_model_path}")

    return {
        "accuracy": acc,
        "precision_weighted": prec_weighted,
        "recall_weighted": rec_weighted,
        "f1_weighted": f1_weighted,
        "precision_macro": prec_macro,
        "recall_macro": rec_macro,
        "f1_macro": f1_macro,
        "report_dict": report_dict,
        "test_samples": len(X_test),
        "train_samples": len(X_train),
    }


if __name__ == "__main__":
    train_priority_step8c()
