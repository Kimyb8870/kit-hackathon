"""revenue_optimizer — combine real activity data with mock revenue model."""

import json

from langchain_core.tools import tool

from app.db import get_sync_connection

# Mock unit prices per category (KRW)
_MOCK_PRICE_PER_CATEGORY = {
    "프로그래밍": 89_000,
    "데이터": 99_000,
    "AI/ML": 129_000,
    "디자인": 79_000,
    "기획": 69_000,
}
_DEFAULT_PRICE = 79_000

# Mock conversion rate from active learner to paid enrollment
_MOCK_CONVERSION_RATE = 0.18


@tool
def revenue_optimizer(since_hours: int = 720) -> str:
    """Estimate revenue contribution by category and surface optimization ideas.

    Args:
        since_hours: Look-back window for active learner counts (default 30 days).

    Returns:
        JSON string with per-category revenue estimates and recommendations.
    """
    activity = _fetch_activity(since_hours)
    if not activity:
        return json.dumps(
            {"error": "No activity data available.", "revenue": []},
            ensure_ascii=False,
        )

    rows = []
    total_estimated = 0
    for cat, active in activity.items():
        price = _MOCK_PRICE_PER_CATEGORY.get(cat, _DEFAULT_PRICE)
        est_paid = int(active * _MOCK_CONVERSION_RATE)
        revenue = est_paid * price
        total_estimated += revenue
        rows.append(
            {
                "category": cat,
                "active_learners": active,
                "estimated_paid_conversions": est_paid,
                "unit_price_krw": price,
                "estimated_revenue_krw": revenue,
            }
        )

    rows.sort(key=lambda r: r["estimated_revenue_krw"], reverse=True)
    recommendations = _build_recommendations(rows)

    return json.dumps(
        {
            "since_hours": since_hours,
            "conversion_rate_assumed": _MOCK_CONVERSION_RATE,
            "categories": rows,
            "total_estimated_revenue_krw": total_estimated,
            "recommendations": recommendations,
            "data_caveat": "active_learners는 실제 quiz_results 기반, 가격/전환율은 mock입니다.",
        },
        ensure_ascii=False,
    )


def _fetch_activity(since_hours: int) -> dict[str, int]:
    sql = (
        "SELECT c.category, COUNT(DISTINCT qr.user_id) "
        "FROM courses c "
        "LEFT JOIN quiz_results qr ON qr.course_id = c.id "
        "AND qr.created_at >= now() - (%s || ' hours')::interval "
        "GROUP BY c.category"
    )
    with get_sync_connection() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute(sql, (str(since_hours),))
                return {r[0]: int(r[1] or 0) for r in cur.fetchall()}
        except Exception:
            return {}


def _build_recommendations(rows: list[dict]) -> list[str]:
    if not rows:
        return []
    top = rows[0]
    bottom = rows[-1]
    recs = [
        f"{top['category']} 카테고리가 매출 1위 ({top['estimated_revenue_krw']:,}원). "
        "신규 강의 추가와 번들 패키지 출시 권장.",
    ]
    if bottom["category"] != top["category"] and bottom["active_learners"] < 5:
        recs.append(
            f"{bottom['category']} 카테고리는 활성 사용자 {bottom['active_learners']}명. "
            "프로모션 또는 카테고리 통폐합 검토 필요."
        )
    return recs
