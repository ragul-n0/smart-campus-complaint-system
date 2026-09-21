# Smart Campus Issue Management System: Step 8C Dataset Improvement & Model Evaluation Report

**Date:** 2026-09-21  
**Target:** Dataset expansion, category balancing, and accuracy improvement from Step 8B baseline (~43%).  
**Status:** Step 8C candidate model achieved **76.09% accuracy** on 184 unseen test samples (+32.76% absolute gain).

---

## 1. Audit of Step 8B Dataset & Problem Identification

### Step 8B Limitations
1. **Sample Size:** 300 total examples yielded only 240 training samples (~30 per category) and 60 test samples (7–8 per category).
2. **Vocabulary Sparsity:** Complaints in Step 8B followed a rigid, relatively formal sentence structure. Unseen student phrasing, abbreviations, or colloquialisms caused low test precision.
3. **Severe Cross-Category Confusion:**
   * `Electrical`: Precision 0.20, Recall 0.25 (often confused with IT or Maintenance).
   * `IT`: Precision 0.28, Recall 0.25 (often confused with Electrical).
   * `Maintenance`: Precision 0.36, Recall 0.50 (confused with Furniture and Plumbing).

---

## 2. Step 8C Dataset Expansion & Cleaning Methodology

### Data Engineering
* **Baseline Dataset Backup:** Saved copy to `ml/data/dataset_step8b_backup.csv`.
* **New Dataset File:** Saved to `ml/data/complaint_dataset_step8c.csv` (original `ml/data/complaints_dataset.csv` left intact).
* **Dataset Cleaning:** Normalized multi-spaces, stripped trailing/leading whitespace, verified non-empty values.
* **Controlled Realistic Augmentation:**
  * Generated 620 new distinct campus complaint records covering formal, short, colloquial, and location-varied complaints.
  * Preserved strict category boundaries and assigned urgency-based priority labels.
  * Verified 0 exact or normalized case-insensitive duplicates across the combined dataset.
* **Total Dataset Size:** **920 labeled records** (expanded from 300).

### Class Distribution Comparison
| Category | Step 8B Count | Step 8C Count | Increase |
| :--- | :---: | :---: | :---: |
| **IT** | 40 | 120 | +200% |
| **Electrical** | 40 | 120 | +200% |
| **Maintenance** | 40 | 120 | +200% |
| **Housekeeping** | 40 | 120 | +200% |
| **Security** | 35 | 110 | +214% |
| **Plumbing** | 35 | 110 | +214% |
| **Furniture** | 35 | 110 | +214% |
| **Other** | 35 | 110 | +214% |
| **Total** | **300** | **920** | **+206.7%** |

### Priority Distribution (Step 8C)
* **High:** 313
* **Low:** 313
* **Medium:** 294

---

## 3. Data Leakage Prevention & Train/Test Split

* **Split Ratio:** 80% Train (736 samples), 20% Test (184 samples).
* **Sampling Method:** Stratified sampling (`stratify=y, random_state=42`) ensuring identical class proportions in training and test sets.
* **Vectorizer Fitting:** `TfidfVectorizer` fitted **strictly on the 736 training samples**. Test samples were only transformed.

---

## 4. Model Comparison: Step 8B Baseline vs Step 8C Candidate

### Category Classification (8 Classes)
| Metric | Step 8B Baseline | Step 8C Candidate | Improvement |
| :--- | :---: | :---: | :---: |
| **Accuracy** | 43.33% | **76.09%** | **+32.76%** |
| **Precision (Weighted)** | 46.47% | **76.82%** | **+30.35%** |
| **Recall (Weighted)** | 43.33% | **76.09%** | **+32.76%** |
| **F1-Score (Weighted)** | 43.59% | **75.95%** | **+32.36%** |
| **F1-Score (Macro)** | 44.19% | **75.92%** | **+31.73%** |

### Per-Category Performance Comparison (F1-Scores)
| Category | Step 8B F1 | Step 8C F1 | Improvement |
| :--- | :---: | :---: | :---: |
| **Electrical** | 0.2222 | **0.8163** | **+0.5941** |
| **Furniture** | 0.5714 | **0.8511** | **+0.2797** |
| **Housekeeping** | 0.5000 | **0.8000** | **+0.3000** |
| **IT** | 0.2667 | **0.7200** | **+0.4533** |
| **Maintenance** | 0.4211 | **0.7273** | **+0.3062** |
| **Other** | 0.4286 | **0.6383** | **+0.2097** |
| **Plumbing** | 0.6250 | **0.8182** | **+0.1932** |
| **Security** | 0.5000 | **0.7027** | **+0.2027** |

---

## 5. Generated Artifacts

* Backup dataset: `ml/data/dataset_step8b_backup.csv`
* Improved dataset: `ml/data/complaint_dataset_step8c.csv`
* Candidate category model: `ml/models/category_model_step8c.joblib`
* Candidate priority model: `ml/models/priority_model_step8c.joblib`
* Category confusion matrix: `ml/models/category_confusion_matrix_step8c.png`
* Priority confusion matrix: `ml/models/priority_confusion_matrix_step8c.png`
* Model metadata: `ml/models/model_metadata.json`

---

## 6. Model Selection Recommendation

* **Candidate Model:** `category_model_step8c.joblib` significantly outperforms the baseline across all 8 classes on a fair, independent 184-sample test split (accuracy increased from 43.33% to 76.09%).
* **Safety & Integrity:** Step 8B models and datasets remain intact and accessible. No application routes, database tables, or frontends were altered.
