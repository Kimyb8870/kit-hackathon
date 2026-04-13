"""LangGraph ReAct agent for the Platform operator role."""

from typing import Annotated

from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.message import add_messages
from langgraph.prebuilt import create_react_agent
from langgraph.prebuilt.chat_agent_executor import RemainingSteps
from typing_extensions import NotRequired, TypedDict

from app.agent.platform.prompts import platform_prompt
from app.agent.platform.tools.course_demand_analyzer import course_demand_analyzer
from app.agent.platform.tools.promotion_recommender import promotion_recommender
from app.agent.platform.tools.revenue_optimizer import revenue_optimizer
from app.agent.platform.tools.trend_detector import trend_detector
from app.config import settings


class PlatformState(TypedDict):
    messages: Annotated[list, add_messages]
    remaining_steps: NotRequired[RemainingSteps]
    operator_id: str
    lms_context: NotRequired[dict | None]


_tools = [
    course_demand_analyzer,
    trend_detector,
    promotion_recommender,
    revenue_optimizer,
]

_model = ChatOpenAI(
    model=settings.LLM_MODEL,
    api_key=settings.OPENAI_API_KEY,
    streaming=True,
)

_checkpointer = MemorySaver()

agent = create_react_agent(
    model=_model,
    tools=_tools,
    prompt=platform_prompt,
    checkpointer=_checkpointer,
    state_schema=PlatformState,
)
