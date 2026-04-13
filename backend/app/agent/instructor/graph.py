"""LangGraph ReAct agent for the Instructor role."""

from typing import Annotated

from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.message import add_messages
from langgraph.prebuilt import create_react_agent
from langgraph.prebuilt.chat_agent_executor import RemainingSteps
from typing_extensions import NotRequired, TypedDict

from app.agent.instructor.prompts import instructor_prompt
from app.agent.instructor.tools.auto_qa_responder import auto_qa_responder
from app.agent.instructor.tools.content_gap_finder import content_gap_finder
from app.agent.instructor.tools.qa_aggregator import qa_aggregator
from app.agent.instructor.tools.student_struggle_reporter import (
    student_struggle_reporter,
)
from app.config import settings


class InstructorState(TypedDict):
    messages: Annotated[list, add_messages]
    remaining_steps: NotRequired[RemainingSteps]
    instructor_id: str
    lms_context: NotRequired[dict | None]


_tools = [
    qa_aggregator,
    content_gap_finder,
    auto_qa_responder,
    student_struggle_reporter,
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
    prompt=instructor_prompt,
    checkpointer=_checkpointer,
    state_schema=InstructorState,
)
