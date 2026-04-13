"""Platform agent tools."""

from app.agent.platform.tools.course_demand_analyzer import course_demand_analyzer
from app.agent.platform.tools.promotion_recommender import promotion_recommender
from app.agent.platform.tools.revenue_optimizer import revenue_optimizer
from app.agent.platform.tools.trend_detector import trend_detector

__all__ = [
    "course_demand_analyzer",
    "promotion_recommender",
    "revenue_optimizer",
    "trend_detector",
]
