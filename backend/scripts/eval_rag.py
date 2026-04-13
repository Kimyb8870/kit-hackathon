"""Evaluate RAG retrieval quality using the eval set.

Metrics:
    - Hit@5: whether expected_concept_id appears in top-5 results
    - MRR (Mean Reciprocal Rank): average of 1/rank for the first hit

Usage (from src/backend/):
    python -m scripts.eval_rag
"""

import json
import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from app.rag.retriever import search

EVAL_SET_PATH = _backend_dir / "data" / "eval_set.json"


def load_eval_set() -> list[dict]:
    """Load evaluation questions from the JSON file."""
    with open(EVAL_SET_PATH, encoding="utf-8") as f:
        data = json.load(f)
    return data["eval_set"]


def evaluate_question(item: dict) -> tuple[bool, float]:
    """Evaluate a single question.

    Returns:
        (hit: bool, reciprocal_rank: float)
    """
    question = item["question"]
    expected_concept = item["expected_concept_id"]

    results = search(query=question, top_k=5)
    all_items = results["clips"] + results["misconceptions"]

    for rank, result in enumerate(all_items, start=1):
        if result.concept_id == expected_concept:
            return True, 1.0 / rank

    return False, 0.0


def main() -> None:
    """Run the full evaluation."""
    print("=== RAG Retrieval Evaluation ===\n")

    eval_set = load_eval_set()
    total = len(eval_set)

    hits = 0
    mrr_sum = 0.0
    results_by_category: dict[str, dict] = {}

    for i, item in enumerate(eval_set, start=1):
        hit, rr = evaluate_question(item)
        category = item.get("category", "unknown")

        if category not in results_by_category:
            results_by_category[category] = {"hits": 0, "total": 0, "mrr_sum": 0.0}

        results_by_category[category]["total"] += 1
        if hit:
            hits += 1
            results_by_category[category]["hits"] += 1
        mrr_sum += rr
        results_by_category[category]["mrr_sum"] += rr

        status = "HIT" if hit else "MISS"
        print(
            f"  [{i:02d}/{total}] {status} (RR={rr:.2f}) "
            f"| {item['expected_concept_id']} | {item['question'][:50]}"
        )

    print(f"\n=== Overall Results ===")
    print(f"  Hit@5:  {hits}/{total} ({hits / total * 100:.1f}%)")
    print(f"  MRR:    {mrr_sum / total:.4f}")

    print(f"\n=== Results by Category ===")
    for cat, stats in sorted(results_by_category.items()):
        cat_total = stats["total"]
        cat_hits = stats["hits"]
        cat_mrr = stats["mrr_sum"] / cat_total if cat_total > 0 else 0.0
        print(
            f"  {cat:20s}: Hit@5 {cat_hits}/{cat_total} "
            f"({cat_hits / cat_total * 100:.1f}%), MRR={cat_mrr:.4f}"
        )

    print(f"\n=== Done ===")


if __name__ == "__main__":
    main()
