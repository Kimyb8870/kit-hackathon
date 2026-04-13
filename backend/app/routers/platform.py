"""Platform-operator-facing API routes."""

import json
import re
import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from app.agent.platform.graph import agent as platform_agent
from app.agent.platform.tools.course_demand_analyzer import course_demand_analyzer
from app.agent.platform.tools.promotion_recommender import promotion_recommender
from app.agent.platform.tools.revenue_optimizer import revenue_optimizer
from app.agent.platform.tools.trend_detector import trend_detector
from app.models.schemas import LmsPlatformContext

router = APIRouter(prefix="/api/v1/platform", tags=["platform"])

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$")


def _strip_code_fence(text: str) -> str:
    """Remove leading/trailing markdown code fences from LLM JSON output."""
    if not isinstance(text, str):
        return text
    return _FENCE_RE.sub("", text.strip())


def _parse_llm_json(text: str) -> dict:
    """Parse LLM-generated JSON, tolerating markdown code fences."""
    try:
        return json.loads(_strip_code_fence(text))
    except (TypeError, json.JSONDecodeError):
        return {"raw": text}


class PlatformChatMessage(BaseModel):
    role: str = Field(..., description="Role: user or assistant")
    content: str = Field(..., description="Message content")


class PlatformChatRequest(BaseModel):
    operator_id: str = Field(..., description="Operator identifier")
    messages: list[PlatformChatMessage]
    lms_context: LmsPlatformContext | None = Field(
        default=None,
        description=(
            "Optional LMS-supplied context carrying operator scope "
            "(role, focus categories, time window) so the agent can "
            "pre-fill tool arguments."
        ),
    )


def _to_lc_messages(messages: list[PlatformChatMessage]) -> list:
    out = []
    for m in messages:
        if m.role == "user":
            out.append(HumanMessage(content=m.content))
        else:
            out.append(AIMessage(content=m.content))
    return out


async def _stream_events(req: PlatformChatRequest) -> AsyncGenerator[dict, None]:
    """Yield SSE-formatted dicts from the Platform LangGraph agent.

    Mirrors the learner chat router (``app.routers.chat``) — uses
    ``astream_events(version="v2")`` so tool_call events carry the full
    assembled args dict in a single frame instead of streamed chunks.
    """
    lms_context = (
        req.lms_context.model_dump() if req.lms_context else None
    )

    input_state = {
        "messages": _to_lc_messages(req.messages),
        "operator_id": req.operator_id,
        "lms_context": lms_context,
    }
    # Fresh thread_id per request — frontend replays full message history,
    # so a stable thread_id would re-hydrate stale checkpoint state.
    config = {
        "configurable": {
            "thread_id": f"platform-{req.operator_id}:{uuid.uuid4()}"
        }
    }

    try:
        async for event in platform_agent.astream_events(
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
                            "error": "platform agent stream failed",
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
async def platform_chat(request: PlatformChatRequest):
    """Stream platform-agent responses as SSE (legacy path)."""
    return EventSourceResponse(_stream_events(request))


@router.post("/chat/stream")
async def platform_chat_stream(request: PlatformChatRequest):
    """Stream platform-agent responses as SSE.

    Preferred path — mirrors the learner ``/api/v1/chat/stream`` URL shape
    so frontend code can use a shared SSE client.
    """
    return EventSourceResponse(_stream_events(request))


@router.get("/demand")
async def get_demand(since_hours: int = 168):
    """Per-category demand metrics."""
    raw = course_demand_analyzer.invoke({"since_hours": since_hours})
    return json.loads(raw)


@router.get("/recommendations")
async def get_recommendations(focus_category: str = "", since_hours: int = 168):
    """New course + promotion recommendations.

    Combines trend detection and promotion suggestions.
    """
    trends_raw = trend_detector.invoke(
        {"since_hours": since_hours, "top_n": 10}
    )
    promotions_raw = promotion_recommender.invoke(
        {"focus_category": focus_category}
    )
    revenue_raw = revenue_optimizer.invoke({"since_hours": since_hours * 4})

    # promotion_recommender returns the LLM-generated string; strip any
    # markdown code fences (```json ... ```) before parsing.
    promotions = _parse_llm_json(promotions_raw)

    return {
        "focus_category": focus_category or None,
        "since_hours": since_hours,
        "trends": json.loads(trends_raw),
        "promotions": promotions,
        "revenue": json.loads(revenue_raw),
    }
