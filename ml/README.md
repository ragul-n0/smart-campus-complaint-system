# Machine Learning Module (Smart Campus Complaint System)

This directory houses the machine learning components, datasets, validation tooling, trained models, and experimental scripts for the Smart Campus Complaint & Issue Management System.

---

## Datasets

1. **Step 8B Baseline Dataset (`ml/data/complaints_dataset.csv`):**
   * Total rows: 300 labeled examples.
   * Preserved intact for baseline reference.
   * Backup available at `ml/data/dataset_step8b_backup.csv`.
2. **Step 8C Improved Dataset (`ml/data/complaint_dataset_step8c.csv`):**
   * Total rows: 920 labeled examples.
   * Expanded vocabulary, colloquial student phrasing, short queries, balanced across all 8 categories.
   * Validated with 0 nulls, 0 duplicates, 0 invalid classes.

---

## Categories & Priorities

* **Categories (8):** `IT`, `Electrical`, `Maintenance`, `Housekeeping`, `Security`, `Plumbing`, `Furniture`, `Other`.
* **Priorities (3):** `Low`, `Medium`, `High`.

---

## Scripts & CLI Commands

### 1. Validate Datasets
```bash
# Validate Step 8B baseline
python ml/src/validate_dataset.py ml/data/complaints_dataset.csv

# Validate Step 8C improved dataset
python ml/src/validate_dataset.py ml/data/complaint_dataset_step8c.csv
```

### 2. Model Training
```bash
# Train Step 8B baseline models (accuracy ~43%)
python ml/src/train_category.py
python ml/src/train_priority.py

# Train Step 8C candidate models (accuracy ~76%)
python ml/src/train_category_step8c.py
python ml/src/train_priority_step8c.py
```

### 3. Model Inference & Prediction
```bash
# Predict using Step 8C model (default)
python ml/src/predict.py "The WiFi is not working in the computer lab"

# Predict using Step 8B baseline model
python ml/src/predict.py "The WiFi is not working in the computer lab" --version step8b
```

---

## Directory Structure

* `data/`:
  * `complaints_dataset.csv`: Step 8B baseline dataset (300 samples).
  * `dataset_step8b_backup.csv`: Safety backup copy of Step 8B dataset.
  * `complaint_dataset_step8c.csv`: Step 8C improved dataset (920 samples).
* `src/`:
  * `validate_dataset.py`: Dataset validation script.
  * `build_step8c_dataset.py`: Generator script for Step 8C dataset.
  * `train_category.py`: Step 8B category trainer.
  * `train_priority.py`: Step 8B priority trainer.
  * `train_category_step8c.py`: Step 8C category trainer.
  * `train_priority_step8c.py`: Step 8C priority trainer.
  * `predict.py`: Inference CLI supporting both Step 8B and Step 8C models.
* `models/`:
  * `category_model.joblib`: Step 8B category model baseline.
  * `priority_model.joblib`: Step 8B priority model baseline.
  * `category_model_step8c.joblib`: Step 8C candidate category model.
  * `priority_model_step8c.joblib`: Step 8C candidate priority model.
  * `category_confusion_matrix.png`: Step 8B category confusion matrix.
  * `priority_confusion_matrix.png`: Step 8B priority confusion matrix.
  * `category_confusion_matrix_step8c.png`: Step 8C category confusion matrix.
  * `priority_confusion_matrix_step8c.png`: Step 8C priority confusion matrix.
  * `model_metadata.json`: Hyperparameters and evaluation scores for both versions.
* `training_report.md`: Step 8B training report.
* `training_report_step8c.md`: Step 8C improvement & comparative analysis report.
* `requirements.txt`: Python ML dependencies.
