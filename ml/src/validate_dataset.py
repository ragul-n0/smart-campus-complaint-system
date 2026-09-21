"""
Dataset Validation Script for Smart Campus Complaint & Issue Management System.

Validates:
- CSV structure and column headers
- Total row count
- Missing or null values
- Duplicate complaint text
- Category validity against allowed application categories
- Priority validity against allowed application priority levels
- Class distributions
"""

import csv
import sys
from collections import Counter
from pathlib import Path

# Target project categories and priorities
VALID_CATEGORIES = {
    "IT",
    "Electrical",
    "Maintenance",
    "Housekeeping",
    "Security",
    "Plumbing",
    "Furniture",
    "Other",
}

VALID_PRIORITIES = {
    "Low",
    "Medium",
    "High",
}


def validate_dataset(csv_path: Path) -> bool:
    print("=" * 50)
    print("Dataset Validation")
    print("=" * 50)
    print(f"Target File: {csv_path}")

    if not csv_path.exists():
        print(f"ERROR: Dataset file not found at {csv_path}")
        print("\nRESULT: FAIL")
        return False

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []

        required_columns = ["complaint_text", "category", "priority"]
        missing_columns = [col for col in required_columns if col not in headers]
        if missing_columns:
            print(f"ERROR: Missing required columns: {missing_columns}")
            print("\nRESULT: FAIL")
            return False

        rows = list(reader)

    total_rows = len(rows)
    print(f"Total rows: {total_rows}\n")

    category_counts = Counter()
    priority_counts = Counter()

    missing_values_count = 0
    duplicate_complaints_count = 0
    invalid_categories_count = 0
    invalid_priorities_count = 0

    seen_complaints = set()

    for idx, row in enumerate(rows, start=2):  # Line 2 is first data row
        text = (row.get("complaint_text") or "").strip()
        category = (row.get("category") or "").strip()
        priority = (row.get("priority") or "").strip()

        # Check missing values
        if not text or not category or not priority:
            missing_values_count += 1

        # Check duplicate complaint text (case-insensitive normalized)
        normalized_text = text.lower()
        if normalized_text:
            if normalized_text in seen_complaints:
                duplicate_complaints_count += 1
            else:
                seen_complaints.add(normalized_text)

        # Check valid category
        if category not in VALID_CATEGORIES:
            invalid_categories_count += 1
        else:
            category_counts[category] += 1

        # Check valid priority
        if priority not in VALID_PRIORITIES:
            invalid_priorities_count += 1
        else:
            priority_counts[priority] += 1

    # Print Category distribution
    print("Category distribution:")
    for cat in sorted(VALID_CATEGORIES):
        print(f"  {cat}: {category_counts.get(cat, 0)}")

    # Print Priority distribution
    print("\nPriority distribution:")
    for prio in ["Low", "Medium", "High"]:
        print(f"  {prio}: {priority_counts.get(prio, 0)}")

    print("-" * 50)
    print(f"Missing values: {missing_values_count}")
    print(f"Duplicate complaints: {duplicate_complaints_count}")
    print(f"Invalid categories: {invalid_categories_count}")
    print(f"Invalid priorities: {invalid_priorities_count}")
    print("-" * 50)

    # Validation evaluation
    is_valid = (
        total_rows > 0
        and missing_values_count == 0
        and duplicate_complaints_count == 0
        and invalid_categories_count == 0
        and invalid_priorities_count == 0
    )

    if is_valid:
        print("RESULT: PASS")
    else:
        print("RESULT: FAIL")

    return is_valid


def main():
    # Default to ml/data/complaints_dataset.csv relative to project structure
    script_dir = Path(__file__).resolve().parent
    default_csv = script_dir.parent / "data" / "complaints_dataset.csv"

    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_csv

    success = validate_dataset(csv_path)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
