"""LangGraph ReAct agent for the AI Tutor (learner role)."""

from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent

from app.agent.learner.prompts import dynamic_tutor_prompt
from app.agent.learner.state import TutorState
from app.agent.learner.tools.code_reviewer import code_reviewer
from app.agent.learner.tools.course_recommender import course_recommender
from app.agent.learner.tools.course_search import course_search
from app.agent.learner.tools.get_current_clip import get_current_clip
from app.agent.learner.tools.learner_state_reporter import learner_state_reporter
from app.agent.learner.tools.profile_manager import profile_manager
from app.agent.learner.tools.quiz_generator import quiz_generator
from app.agent.learner.tools.review_scheduler import review_scheduler
from app.config import settings

_tools = [
    profile_manager,
    learner_state_reporter,
    course_search,
    get_current_clip,
    course_recommender,
    quiz_generator,
    review_scheduler,
    code_reviewer,
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
    prompt=dynamic_tutor_prompt,
    checkpointer=_checkpointer,
    state_schema=TutorState,
)
