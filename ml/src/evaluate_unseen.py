"""
Step 8D Unseen Complaint Validation Script.
Evaluates Step 8C models on a completely fresh, manually authored unseen test set (56 complaints across all 8 categories).
"""

from pathlib import Path
import joblib
import numpy as np
from sklearn.metrics import accuracy_score, classification_report, f1_score, precision_score, recall_score

# 56 Fresh, Unseen Campus Complaints (7 per category) with expected categories and priorities
UNSEEN_TEST_SET = [
    # --- IT (7) ---
    ("The Wi-Fi keeps disconnecting in the computer lab.", "IT", "Medium"),
    ("My student portal login says account locked after entering password.", "IT", "Medium"),
    ("Projector display in seminar hall 3 is showing pink tint and buzzing.", "IT", "Medium"),
    ("Cannot access the university online library repository from off-campus.", "IT", "Low"),
    ("Desktop workstation in cad lab shuts off randomly during rendering.", "IT", "High"),
    ("The printer in the administrative office has an error message about fuser temp.", "IT", "Low"),
    ("Main campus core router failed, all blocks lost network access.", "IT", "High"),

    # --- Electrical (7) ---
    ("There is no power in classroom 204.", "Electrical", "High"),
    ("The classroom ceiling fan is making a loud screeching noise.", "Electrical", "Medium"),
    ("Tube light in the reading area of library has been blinking non-stop.", "Electrical", "Low"),
    ("Wall outlet on bench 4 is sparking when plugging in laptop charger.", "Electrical", "High"),
    ("Corridor lights on floor 2 are completely dead leaving it pitch dark.", "Electrical", "Medium"),
    ("Electric water cooler dispenser gives an electric tingle when touched.", "Electrical", "High"),
    ("Switch plate in hostel room 302 cracked and inner copper wire is visible.", "Electrical", "High"),

    # --- Maintenance (7) ---
    ("Wooden classroom door lock is broken and students cannot enter.", "Maintenance", "High"),
    ("Window glass cracked after windstorm and might shatter on students.", "Maintenance", "High"),
    ("Notice board in engineering foyer has fallen off its wall brackets.", "Maintenance", "Low"),
    ("Plaster fell from the second floor ceiling into the walkway.", "Maintenance", "High"),
    ("Stairway metal handrail is extremely wobbly on the 3rd floor landing.", "Maintenance", "High"),
    ("Classroom door handle detached completely from the door.", "Maintenance", "Low"),
    ("Pavement concrete blocks sunken creating a tripping hazard near entrance.", "Maintenance", "Medium"),

    # --- Housekeeping (7) ---
    ("The washroom has not been cleaned today and smells terrible.", "Housekeeping", "High"),
    ("Dustbins in the food court are overflowing with food waste.", "Housekeeping", "Medium"),
    ("Spilled syrup on library desk making books stick to the table.", "Housekeeping", "Low"),
    ("Restroom floor is covered in dirty stagnant water without caution signs.", "Housekeeping", "High"),
    ("Spider cobwebs covering the ceiling corners in seminar hall.", "Housekeeping", "Low"),
    ("Liquid hand soap is empty in all second floor dispensers.", "Housekeeping", "Low"),
    ("Pigeon droppings covering the window ledges in room 105.", "Housekeeping", "Low"),

    # --- Security (7) ---
    ("My bicycle is missing from the parking area near library.", "Security", "High"),
    ("Security guard sleeping at the campus entrance checkpoint at midnight.", "Security", "High"),
    ("Suspicious group of outsiders wandering behind girls hostel block.", "Security", "High"),
    ("Delivery van entered campus at reckless speed through pedestrian walkway.", "Security", "High"),
    ("Turnstile gate barrier was left forced open without any guard.", "Security", "Medium"),
    ("Lost wallet with money and student id card near cafeteria.", "Security", "Medium"),
    ("Emergency fire door chained and padlocked from the exterior.", "Security", "High"),

    # --- Plumbing (7) ---
    ("Water is leaking near the hostel bathroom from overhead pipe.", "Plumbing", "High"),
    ("No running water in the entire first floor washroom block.", "Plumbing", "High"),
    ("Water tap in chemistry washup area is spraying water violently.", "Plumbing", "High"),
    ("Washbasin faucet dripping continuously wasting clean water.", "Plumbing", "Low"),
    ("Toilet bowl blocked with wastewater backing up into cubicle.", "Plumbing", "High"),
    ("Drinking water from cooler tastes like mud and comes out yellowish.", "Plumbing", "High"),
    ("Urinal sensor valve stuck open flushing water continuously for hours.", "Plumbing", "Medium"),

    # --- Furniture (7) ---
    ("Three chairs in our classroom are broken with loose legs.", "Furniture", "Medium"),
    ("Study table in library has sharp wood splinters tearing clothes.", "Furniture", "Low"),
    ("Lecture hall wooden podium table wobbles heavily when leaning on it.", "Furniture", "Low"),
    ("Computer lab swivel chair gas cylinder broken and sinks to bottom.", "Furniture", "Low"),
    ("Heavy library book shelf bowing dangerously in the middle.", "Furniture", "High"),
    ("Metal locker door bent out of shape and cannot be shut.", "Furniture", "Medium"),
    ("Cafeteria dining table wobbles severely due to missing leg support.", "Furniture", "Low"),

    # --- Other (7) ---
    ("I lost my ID card near the library and counter refuses to issue receipt.", "Other", "Low"),
    ("Pack of aggressive stray dogs barking at students near sports field.", "Other", "High"),
    ("Deafening construction rock breaking noise during our final exam.", "Other", "High"),
    ("Campus shuttle bus arrived 45 minutes late causing students to miss lecture.", "Other", "Medium"),
    ("Food in hostel mess served half-cooked and multiple students have stomach ache.", "Other", "High"),
    ("Swarm of honey bees built hive right over the classroom entrance doorway.", "Other", "High"),
    ("Campus bookstore overcharging students twenty percent above printed MRP.", "Other", "Low"),
]


def evaluate_unseen():
    base_dir = Path(__file__).resolve().parent.parent
    cat_model_path = base_dir / "models" / "category_model_step8c.joblib"
    prio_model_path = base_dir / "models" / "priority_model_step8c.joblib"

    print("=" * 70)
    print("STEP 8D: Unseen Realistic Complaint Validation")
    print("=" * 70)
    print(f"Loading Category Model: {cat_model_path.name}")
    print(f"Loading Priority Model: {prio_model_path.name}")

    cat_model = joblib.load(cat_model_path)
    prio_model = joblib.load(prio_model_path)

    y_true_cat = []
    y_pred_cat = []
    cat_confidences = []

    y_true_prio = []
    y_pred_prio = []
    prio_confidences = []

    results = []

    for text, exp_cat, exp_prio in UNSEEN_TEST_SET:
        # Category prediction
        pred_cat = cat_model.predict([text])[0]
        cat_probs = cat_model.predict_proba([text])[0]
        cat_conf = float(cat_probs[list(cat_model.classes_).index(pred_cat)])

        # Priority prediction
        pred_prio = prio_model.predict([text])[0]
        prio_probs = prio_model.predict_proba([text])[0]
        prio_conf = float(prio_probs[list(prio_model.classes_).index(pred_prio)])

        cat_correct = pred_cat == exp_cat
        prio_correct = pred_prio == exp_prio

        y_true_cat.append(exp_cat)
        y_pred_cat.append(pred_cat)
        cat_confidences.append(cat_conf)

        y_true_prio.append(exp_prio)
        y_pred_prio.append(pred_prio)
        prio_confidences.append(prio_conf)

        results.append({
            "text": text,
            "expected_category": exp_cat,
            "predicted_category": pred_cat,
            "cat_confidence": cat_conf,
            "cat_correct": cat_correct,
            "expected_priority": exp_prio,
            "predicted_priority": pred_prio,
            "prio_confidence": prio_conf,
            "prio_correct": prio_correct,
        })

    cat_acc = accuracy_score(y_true_cat, y_pred_cat)
    cat_prec = precision_score(y_true_cat, y_pred_cat, average="weighted", zero_division=0)
    cat_rec = recall_score(y_true_cat, y_pred_cat, average="weighted", zero_division=0)
    cat_f1 = f1_score(y_true_cat, y_pred_cat, average="weighted", zero_division=0)

    prio_acc = accuracy_score(y_true_prio, y_pred_prio)
    prio_prec = precision_score(y_true_prio, y_pred_prio, average="weighted", zero_division=0)
    prio_rec = recall_score(y_true_prio, y_pred_prio, average="weighted", zero_division=0)
    prio_f1 = f1_score(y_true_prio, y_pred_prio, average="weighted", zero_division=0)

    print(f"\nUnseen Sample Count: {len(UNSEEN_TEST_SET)}")
    print("\n--- CATEGORY MODEL METRICS (Unseen Set) ---")
    print(f"Accuracy:  {cat_acc:.4f} ({cat_acc * 100:.2f}%) [{sum(1 for r in results if r['cat_correct'])}/{len(results)} correct]")
    print(f"Precision: {cat_prec:.4f}")
    print(f"Recall:    {cat_rec:.4f}")
    print(f"F1-Score:  {cat_f1:.4f}")
    print(f"Mean Confidence: {np.mean(cat_confidences):.2f}")

    print("\nPer-Category Breakdown:")
    categories = sorted(list(cat_model.classes_))
    for cat in categories:
        cat_samples = [r for r in results if r["expected_category"] == cat]
        correct = sum(1 for r in cat_samples if r["cat_correct"])
        total = len(cat_samples)
        acc = correct / total if total > 0 else 0
        print(f"  {cat:<14}: {acc * 100:.1f}% ({correct}/{total})")

    print("\n--- PRIORITY MODEL METRICS (Unseen Set) ---")
    print(f"Accuracy:  {prio_acc:.4f} ({prio_acc * 100:.2f}%) [{sum(1 for r in results if r['prio_correct'])}/{len(results)} correct]")
    print(f"Precision: {prio_prec:.4f}")
    print(f"Recall:    {prio_rec:.4f}")
    print(f"F1-Score:  {prio_f1:.4f}")
    print(f"Mean Confidence: {np.mean(prio_confidences):.2f}")

    # Confidence Threshold Analysis (Threshold = 0.60 vs 0.40)
    for thresh in [0.40, 0.50, 0.60]:
        high_conf_preds = [r for r in results if r["cat_confidence"] >= thresh]
        if high_conf_preds:
            high_conf_acc = sum(1 for r in high_conf_preds if r["cat_correct"]) / len(high_conf_preds)
            print(f"\nConfidence >= {thresh:.2f}: {len(high_conf_preds)}/{len(results)} samples ({len(high_conf_preds)/len(results)*100:.1f}%), Accuracy = {high_conf_acc*100:.1f}%")
        else:
            print(f"\nConfidence >= {thresh:.2f}: 0 samples")

    return results, cat_acc, prio_acc


if __name__ == "__main__":
    evaluate_unseen()
