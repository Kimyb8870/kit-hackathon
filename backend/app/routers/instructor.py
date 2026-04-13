"""Instructor-facing API routes."""

import json
import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from app.agent.instructor.graph import agent as instructor_agent
from app.agent.instructor.tools.content_gap_finder import content_gap_finder
from app.agent.instructor.tools.qa_aggregator import qa_aggregator
from app.agent.instructor.tools.student_struggle_reporter import (
    student_struggle_reporter,
)
from app.models.schemas import LmsInstructorContext

router = APIRouter(prefix="/api/v1/instructor", tags=["instructor"])


class InstructorChatMessage(BaseModel):
    role: str = Field(..., description="Role: user or assistant")
    content: str = Field(..., description="Message content")


class InstructorChatRequest(BaseModel):
    instructor_id: str = Field(..., description="Instructor identifier")
    messages: list[InstructorChatMessage]
    lms_context: LmsInstructorContext | None = Field(
        default=None,
        description=(
            "Optional LMS-supplied context carrying instructor scope "
            "(course_ids, time window) so the agent can pre-fill tool "
            "arguments without forcing the user to retype them."
        ),
    )


def _to_lc_messages(messages: list[InstructorChatMessage]) -> list:
    out = []
    for m in messages:
        if m.role == "user":
            out.append(HumanMessage(content=m.content))
        else:
            out.append(AIMessage(content=m.content))
    return out


async def _stream_events(req: InstructorChatRequest) -> AsyncGenerator[dict, None]:
    """Yield SSE-formatted dicts from the Instructor LangGraph agent.

    Mirrors the learner chat router (``app.routers.chat``) — uses
    ``astream_events(version="v2")`` so tool_call events carry the full
    assembled args dict in a single frame instead of streamed chunks.
    """
    lms_context = (
        req.lms_context.model_dump() if req.lms_context else None
    )

    input_state = {
        "messages": _to_lc_messages(req.messages),
        "instructor_id": req.instructor_id,
        "lms_context": lms_context,
    }
    # Fresh thread_id per request — the frontend replays full history
    # on every call, so reusing a stable thread_id would re-hydrate stale
    # checkpoint state (see chat.py for the same rationale).
    config = {
        "configurable": {
            "thread_id": f"instructor-{req.instructor_id}:{uuid.uuid4()}"
        }
    }

    try:
        async for event in instructor_agent.astream_events(
            input_state,
            config=config,
            version="v2",
        ):
            kind = event.get("event")

            if kind == "on_chat_model_stream":
                chunk = event.get("data", {}).get("chunk")
                if chunk is None:
                    continue
                content = getattr(chunk, "content", None)
                if content:
                    yield {
                        "event": "token",
                        "data": json.dumps(
                            {"content": content}, ensure_ascii=False
                        ),
                    }

            elif kind == "on_tool_start":
                tool_name = event.get("name", "") or ""
                tool_input = event.get("data", {}).get("input", {})
                yield {
                    "event": "tool_call",
                    "data": json.dumps(
                        {"name": tool_name, "args": tool_input},
                        ensure_ascii=False,
                        default=str,
                    ),
                }

            elif kind == "on_tool_end":
                tool_name = event.get("name", "") or ""
                tool_output = event.get("data", {}).get("output")
                if hasattr(tool_output, "content"):
                    output_content = tool_output.content
                else:
                    output_content = tool_output
                yield {
                    "event": "tool_result",
                    "data": json.dumps(
                        {"name": tool_name, "content": output_content},
                        ensure_ascii=False,
                        default=str,
                    ),
                }
    except Exception as exc:  # noqa: BLE001
        yield {
            "event": "tool_result",
            "data": json.dumps(
                {
                    "name": "agent_error",
                    "content": json.dumps(
                        {
                            "error": "instructor agent stream failed",
                            "detail": str(exc).strip(),
                        },
                        ensure_ascii=False,
                    ),
                },
                ensure_ascii=False,
                default=str,
            ),
        }
    finally:
        yield {"event": "done", "data": "{}"}


@router.post("/chat")
async def instructor_chat(request: InstructorChatRequest):
    """Stream instructor-agent responses as SSE (legacy path)."""
    return EventSourceResponse(_stream_events(request))


@router.post("/chat/stream")
async def instructor_chat_stream(request: InstructorChatRequest):
    """Stream instructor-agent responses as SSE.

    Preferred path — mirrors the learner ``/api/v1/chat/stream`` URL shape
    so frontend code can use a shared SSE client.
    """
    return EventSourceResponse(_stream_events(request))


@router.get("/insights")
async def get_insights(course_id: str = "", since_hours: int = 168):
    """Aggregate insights: struggles + content gaps + Q&A volume."""
    struggles_raw = student_struggle_reporter.invoke(
        {"course_id": course_id, "top_n": 5, "min_attempts": 1}
    )
    gaps_raw = content_gap_finder.invoke(
        {"min_questions": 1, "since_hours": since_hours}
    )
    qa_raw = qa_aggregator.invoke(
        {"course_id": course_id, "since_hours": since_hours}
    )

    return {
        "course_id": course_id or None,
        "since_hours": since_hours,
        "struggles_top5": json.loads(struggles_raw),
        "content_gaps": json.loads(gaps_raw),
        "qa_stats": json.loads(qa_raw),
    }


@router.get("/struggles")
async def get_struggles(
    course_id: str = "", top_n: int = 5, min_attempts: int = 1
):
    """Top N concepts with the lowest accuracy."""
    raw = student_struggle_reporter.invoke(
        {"course_id": course_id, "top_n": top_n, "min_attempts": min_attempts}
    )
    return json.loads(raw)
