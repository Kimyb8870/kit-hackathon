"""SSE streaming chat endpoint powered by LangGraph agent."""

import json
import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter
from langchain_core.messages import AIMessage, HumanMessage
from sse_starlette.sse import EventSourceResponse

from app.agent.learner.graph import agent
from app.db import get_sync_connection
from app.models.schemas import ChatRequest

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


def _fetch_profile(user_id: str) -> dict | None:
    """Load the learner profile from DB (sync, lightweight)."""
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT user_id, career_goal, experience_level, "
                "available_minutes, final_goal "
                "FROM learner_profiles WHERE user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {
                "user_id": row[0],
                "career_goal": row[1],
                "experience_level": row[2],
                "available_minutes": row[3],
                "final_goal": row[4],
            }


def _fetch_clip_context(
    course_id: str | None,
    chapter_no: int | None,
    clip_no: int | None,
) -> dict | None:
    """Load the current clip metadata so the agent can ground its answers.

    The frontend passes (course_id, chapter_no, clip_no) from the LMS iframe.
    Without the actual clip text, the LLM hallucinates plausible-sounding
    content from the clip number alone. Fetching the real script grounds it.
    """
    if not course_id or chapter_no is None or clip_no is None:
        return None
    with get_sync_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT c.title, cc.clip_title, cc.script_text, cc.concept_id, "
                "cc.timestamp_start, cc.timestamp_end "
                "FROM course_clips cc "
                "JOIN courses c ON c.id = cc.course_id "
                "WHERE cc.course_id = %s AND cc.chapter_no = %s "
                "AND cc.clip_no = %s",
                (course_id, chapter_no, clip_no),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {
                "course_title": row[0],
                "clip_title": row[1],
                "script_text": row[2],
                "concept_id": row[3],
                "timestamp_start": row[4],
                "timestamp_end": row[5],
            }


def _to_langchain_messages(messages: list) -> list:
    """Convert ChatMessage schema objects to LangChain message types."""
    result = []
    for m in messages:
        if m.role == "user":
            result.append(HumanMessage(content=m.content))
        else:
            result.append(AIMessage(content=m.content))
    return result


async def _stream_events(request: ChatRequest) -> AsyncGenerator[dict, None]:
    """Yield SSE-formatted dicts from the LangGraph agent stream."""
    profile = _fetch_profile(request.user_id)
    lc_messages = _to_langchain_messages(request.messages)

    course_context = (
        request.course_context.model_dump() if request.course_context else None
    )
    if course_context:
        clip_meta = _fetch_clip_context(
            course_context.get("course_id"),
            course_context.get("chapter_no"),
            course_context.get("clip_no"),
        )
        if clip_meta:
            course_context = {**course_context, **clip_meta}

    input_state = {
        "messages": lc_messages,
        "user_id": request.user_id,
        "user_profile": profile,
        "course_context": course_context,
    }
    # IMPORTANT: Use a fresh thread_id per request to avoid stale checkpoint
    # state leaking between users / sessions. The frontend already replays
    # the full message history on every call, so the LangGraph checkpointer
    # would otherwise re-hydrate an outdated conversation (e.g. an old
    # "no profile yet, please tell me your career goal" branch) and the
    # agent would follow that stale flow even after the profile was created.
    # Tying thread_id to user_id was the original bug source.
    config = {"configurable": {"thread_id": f"{request.user_id}:{uuid.uuid4()}"}}

    # We use astream_events(v2) instead of astream(stream_mode="messages")
    # so that `on_tool_start` gives us the *complete* tool args dict in one
    # event. The previous astream/tool_call_chunks approach only delivered
    # the tool name in the first chunk (with args="") and streamed the JSON
    # arg-string in later chunks, which the frontend rendered as
    # `{raw: ""}`. astream_events emits the assembled args dict directly.
    try:
        async for event in agent.astream_events(
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
                # Pass args through as a dict — the frontend's sse-client
                # already accepts both string and object shapes.
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
                # ReAct agent returns ToolMessage objects; pull `.content`
                # off the message so the frontend keeps receiving plain
                # text/JSON in the same shape as before.
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
        # Second line of defense: if any tool or the agent itself crashes
        # mid-stream, emit a synthetic tool_result event so the frontend
        # can render a friendly error instead of seeing the SSE connection
        # abort with HTTP 503. The `finally` below still emits `done` so
        # the client never gets stuck waiting.
        yield {
            "event": "tool_result",
            "data": json.dumps(
                {
                    "name": "agent_error",
                    "content": json.dumps(
                        {
                            "error": "agent stream failed",
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
        # Always emit `done` so the frontend never gets stuck waiting,
        # even if the agent raises mid-stream.
        yield {"event": "done", "data": "{}"}


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """Stream chat responses as Server-Sent Events."""
    return EventSourceResponse(_stream_events(request))
