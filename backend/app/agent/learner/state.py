"""LangGraph learner agent state definition."""

from typing import Annotated

from langgraph.graph.message import add_messages
from langgraph.prebuilt.chat_agent_executor import RemainingSteps
from typing_extensions import NotRequired, TypedDict


class TutorState(TypedDict):
    """State schema for the AI Tutor (learner) ReAct agent."""

    messages: Annotated[list, add_messages]
    remaining_steps: NotRequired[RemainingSteps]
    user_id: str
    user_profile: dict | None
    course_context: NotRequired[dict | None]
