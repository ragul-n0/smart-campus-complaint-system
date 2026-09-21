# Smart Campus Issue Management System: ML Model Training & Evaluation Report

**Date:** 2026-09-21  
**Environment:** Python 3.14.7, scikit-learn 1.9.1, pandas 3.0.6, joblib 1.6.0  
**Random State:** 42  

---

## 1. Dataset Summary

The models were trained exclusively on the verified local campus dataset:

* **Source File:** `ml/data/complaints_dataset.csv`
* **Total Samples:** 300 labeled complaints
* **Train / Test Split:** 80% Train (240 samples), 20% Test (60 samples)
* **Sampling Strategy:** Stratified random split (`stratify=y, random_state=42`)
* **Category Target Classes (8):** `Electrical`, `Furniture`, `Housekeeping`, `IT`, `Maintenance`, `Other`, `Plumbing`, `Security`
* **Priority Target Classes (3):** `Low`, `Medium`, `High`

---

## 2. Algorithm Architecture & Explanation

Both models utilize a standard, explainable Natural Language Processing (NLP) pipeline:

```text
Raw Complaint Text
       ↓
Text Normalization (strip whitespace, fill missing)
       ↓
TF-IDF Vectorizer (unigrams + bigrams)
       ↓
Logistic Regression Classifier (L-BFGS)
       ↓
Predicted Label + Confidence Probability
```

### How It Works (Beginner-Friendly Explanation)
1. **TF-IDF (Term Frequency - Inverse Document Frequency):**
   * **Term Frequency (TF):** Measures how often a word or 2-word phrase (bigram) appears in a complaint (e.g., `"water leak"` or `"wifi"`).
   * **Inverse Document Frequency (IDF):** Penalizes words that appear everywhere across all complaints (like `"the"`, `"is"`, `"in"`), while giving high mathematical weight to distinctive keywords like `"router"`, `"circuit"`, `"cistern"`, `"janitor"`, or `"burglar"`.
   * **Sublinear Scaling (`sublinear_tf=True`):** Prevents a word mentioned multiple times from skewing the score exponentially.
   * **Leakage Prevention:** The vectorizer is fitted **strictly on the 240 training examples** and only transforms the 60 test examples.

2. **Logistic Regression:**
   * A linear classification algorithm that assigns weights to each TF-IDF feature and outputs calibrated probabilities for each class via the softmax/multinomial function.
   * Highly interpretable, lightweight, runs locally with 0 millisecond latency, and requires zero paid external APIs or cloud GPU resources.

---

## 3. Category Model Evaluation Results

* **Artifact:** `ml/models/category_model.joblib`
* **Target Classes:** 8 categories
* **Test Samples:** 60 complaints (7 to 8 samples per class)

### Overall Metrics (Test Set)
| Metric | Score | Percentage |
| :--- | :--- | :--- |
| **Accuracy** | **0.4333** | **43.33%** |
| **Precision (Weighted)** | **0.4647** | **46.47%** |
| **Recall (Weighted)** | **0.4333** | **43.33%** |
| **F1-Score (Weighted)** | **0.4359** | **43.59%** |
| **F1-Score (Macro)** | **0.4419** | **44.19%** |

*(Note: Random baseline accuracy for an 8-class balanced problem is 12.5%. The model achieves 43.33%, over 3.4x random chance, on a small 240-training-sample baseline).*

### Per-Class Performance Breakdown
| Category | Precision | Recall | F1-Score | Support (Test Count) |
| :--- | :---: | :---: | :---: | :---: |
| **Electrical** | 0.2000 | 0.2500 | 0.2222 | 8 |
| **Furniture** | 0.5714 | 0.5714 | 0.5714 | 7 |
| **Housekeeping** | 0.7500 | 0.3750 | 0.5000 | 8 |
| **IT** | 0.2857 | 0.2500 | 0.2667 | 8 |
| **Maintenance** | 0.3636 | 0.5000 | 0.4211 | 8 |
| **Other** | 0.4286 | 0.4286 | 0.4286 | 7 |
| **Plumbing** | 0.5556 | 0.7143 | 0.6250 | 7 |
| **Security** | 0.6000 | 0.4286 | 0.5000 | 7 |

### Confusion Matrix
The category confusion matrix has been rendered and saved to:
`ml/models/category_confusion_matrix.png`

---

## 4. Priority Model Evaluation Results

* **Artifact:** `ml/models/priority_model.joblib`
* **Target Classes:** 3 levels (`Low`, `Medium`, `High`)
* **Test Samples:** 60 complaints (19 Low, 21 Medium, 20 High)

### Overall Metrics (Test Set)
| Metric | Score | Percentage |
| :--- | :--- | :--- |
| **Accuracy** | **0.5000** | **50.00%** |
| **Precision (Weighted)** | **0.4950** | **49.50%** |
| **Recall (Weighted)** | **0.5000** | **50.00%** |
| **F1-Score (Weighted)** | **0.4914** | **49.14%** |
| **F1-Score (Macro)** | **0.4895** | **48.95%** |

*(Note: Random baseline accuracy for a 3-class problem is 33.3%. The model achieves 50.00% on the unseen test split).*

### Per-Class Performance Breakdown
| Priority | Precision | Recall | F1-Score | Support (Test Count) |
| :--- | :---: | :---: | :---: | :---: |
| **High** | 0.5652 | 0.6500 | 0.6047 | 20 |
| **Low** | 0.4615 | 0.3158 | 0.3750 | 19 |
| **Medium** | 0.4583 | 0.5238 | 0.4889 | 21 |

### Confusion Matrix
The priority confusion matrix has been rendered and saved to:
`ml/models/priority_confusion_matrix.png`

---

## 5. Sample Live Predictions

These test examples were run using the trained pipelines via `ml/src/predict.py`. None of these sentences exist verbatim in the training data:

### Example 1: Network Issue
* **Input:** `"The internet connection keeps dropping inside the computer lab."`
* **Predicted Category:** `IT` (Confidence: 21.8%)
* **Predicted Priority:** `Medium` (Confidence: 37.6%)
* **Analysis:** Correctly routed to IT based on tokens `"internet"`, `"connection"`, and `"computer lab"`.

### Example 2: Major Plumbing Leak
* **Input:** `"There is water leaking heavily from the washroom ceiling."`
* **Predicted Category:** `Plumbing` (Confidence: 19.4%)
* **Predicted Priority:** `High` (Confidence: 38.5%)
* **Analysis:** Correctly classified as Plumbing and appropriately flagged as High priority due to `"water leaking heavily"`.

### Example 3: Classroom Electrical Defect
* **Input:** `"The fan in classroom 204 has stopped working."`
* **Predicted Category:** `Electrical` (Confidence: 19.1%)
* **Predicted Priority:** `Low` (Confidence: 41.8%)
* **Analysis:** Correctly categorized as Electrical.

### Example 4: Gate Security Alert
* **Input:** `"Security guard is sleeping at the hostel gate"`
* **Predicted Category:** `Security` (Confidence: 28.7%)
* **Predicted Priority:** `Medium` (Confidence: 43.6%)
* **Analysis:** Correctly categorized under Security.

---

## 6. Model Limitations & Realities

1. **Small Training Set (300 total samples):**
   * With only ~30-35 training samples per category in the 80% split, word coverage is necessarily sparse. Unseen synonyms (e.g. `"faucet"` vs `"tap"`, `"blackout"` vs `"power cut"`) can result in low confidence scores.
2. **Subjective Priority Boundaries:**
   * Distinguishing between `"Medium"` and `"High"` priority purely from short text descriptions without campus context (e.g. time of semester, location severity) is inherently noisy.
3. **Cross-Domain Keyword Overlap:**
   * A complaint like `"Someone stole a student laptop from the library reading hall"` shares strong vocabulary with IT (`"laptop"`) and Maintenance/Housekeeping (`"library"`), which can pull probability away from `"Security"` if the token `"stole"` has limited weight in the training vocabulary.
4. **Probabilistic Nature:**
   * Model confidence scores reflect normalized softmax probabilities across the target classes, not absolute certainty. In future API integration, a threshold check or fallback to user selection should always be supported.
5. **Future Roadmap:**
   * As real students and staff submit complaints in the application, confirmed historical records can augment this initial dataset to scale to 1,000+ examples, boosting accuracy and confidence.
