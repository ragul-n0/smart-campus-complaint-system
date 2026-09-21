"""
Inference Script for Smart Campus Complaint Categorization & Priority Scoring.

Loads trained ML pipeline models and predicts category and priority for complaint text,
along with model confidence scores (predict_proba).
Supports both Step 8B baseline and Step 8C candidate models.
"""

import argparse
from pathlib import Path
import sys
import joblib


def load_models(models_dir: Path = None, version: str = "step8c"):
    if models_dir is None:
        models_dir = Path(__file__).resolve().parent.parent / "models"

    if version == "step8c":
        category_model_path = models_dir / "category_model_step8c.joblib"
        priority_model_path = models_dir / "priority_model_step8c.joblib"
        # Fallback to standard names if step8c files not yet generated
        if not category_model_path.exists():
            category_model_path = models_dir / "category_model.joblib"
        if not priority_model_path.exists():
            priority_model_path = models_dir / "priority_model.joblib"
    else:
        category_model_path = models_dir / "category_model.joblib"
        priority_model_path = models_dir / "priority_model.joblib"

    if not category_model_path.exists():
        raise FileNotFoundError(
            f"Category model not found at {category_model_path}. Please run train_category.py or train_category_step8c.py first."
        )
    if not priority_model_path.exists():
        raise FileNotFoundError(
            f"Priority model not found at {priority_model_path}. Please run train_priority.py or train_priority_step8c.py first."
        )

    category_model = joblib.load(category_model_path)
    priority_model = joblib.load(priority_model_path)

    return category_model, priority_model, category_model_path.name, priority_model_path.name


def predict_complaint(
    complaint_text: str, category_model=None, priority_model=None, version: str = "step8c"
):
    text = (complaint_text or "").strip()
    if not text:
        raise ValueError("Complaint text cannot be empty.")

    cat_name = "in-memory"
    prio_name = "in-memory"
    if category_model is None or priority_model is None:
        category_model, priority_model, cat_name, prio_name = load_models(version=version)

    # Category prediction & probability
    cat_pred = category_model.predict([text])[0]
    cat_proba = 0.0
    if hasattr(category_model, "predict_proba"):
        probs = category_model.predict_proba([text])[0]
        cat_classes = list(category_model.classes_)
        if cat_pred in cat_classes:
            cat_proba = float(probs[cat_classes.index(cat_pred)])

    # Priority prediction & probability
    prio_pred = priority_model.predict([text])[0]
    prio_proba = 0.0
    if hasattr(priority_model, "predict_proba"):
        probs = priority_model.predict_proba([text])[0]
        prio_classes = list(priority_model.classes_)
        if prio_pred in prio_classes:
            prio_proba = float(probs[prio_classes.index(prio_pred)])

    return {
        "complaint_text": text,
        "predicted_category": cat_pred,
        "category_confidence": cat_proba,
        "predicted_priority": prio_pred,
        "priority_confidence": prio_proba,
        "category_model_used": cat_name,
        "priority_model_used": prio_name,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Predict category and priority for a campus complaint."
    )
    parser.add_argument(
        "complaint_text",
        nargs="?",
        type=str,
        help="The complaint text to classify (wrap in quotes).",
    )
    parser.add_argument(
        "--version",
        choices=["step8b", "step8c"],
        default="step8c",
        help="Model version to use (step8b baseline or step8c improved). Default: step8c.",
    )
    args = parser.parse_args()

    if not args.complaint_text:
        if not sys.stdin.isatty():
            complaint_text = sys.stdin.read().strip()
        else:
            complaint_text = input("Enter campus complaint text: ").strip()
    else:
        complaint_text = args.complaint_text

    if not complaint_text:
        print("Error: No complaint text provided.")
        sys.exit(1)

    try:
        result = predict_complaint(complaint_text, version=args.version)
        print("\n" + "=" * 55)
        print("Smart Campus Issue Classification Result")
        print("=" * 55)
        print(f"Complaint:\n  \"{result['complaint_text']}\"\n")
        print(f"Model Version:        {args.version.upper()} ({result['category_model_used']})")
        print(f"Predicted Category:   {result['predicted_category']}")
        print(
            f"Category Confidence:  {result['category_confidence']:.2f} ({result['category_confidence'] * 100:.1f}%)"
        )
        print(f"Predicted Priority:   {result['predicted_priority']}")
        print(
            f"Priority Confidence:  {result['priority_confidence']:.2f} ({result['priority_confidence'] * 100:.1f}%)"
        )
        print("-" * 55)
        print("Note: Confidence represents model probability, not guaranteed correctness.")
        print("=" * 55 + "\n")
    except Exception as e:
        print(f"Prediction Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
