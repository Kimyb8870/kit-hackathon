from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: user or assistant")
    content: str = Field(..., description="Message content")


class CourseContext(BaseModel):
    """Context describing what the learner is currently viewing in the LMS."""

    course_id: str | None = None
    chapter_no: int | None = None
    clip_no: int | None = None


class ChatRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    messages: list[ChatMessage] = Field(..., description="Conversation messages")
    course_context: CourseContext | None = Field(
        default=None,
        description="Optional LMS context (course_id, chapter, clip) the learner is viewing",
    )


class LmsInstructorContext(BaseModel):
    """LMS-supplied context for the Instructor agent.

    Carries the instructor identity and the scope of courses/time window
    the dashboard is currently focused on so the agent can pre-fill tool
    arguments without forcing the user to retype them each turn.
    """

    instructor_id: str | None = Field(
        default=None,
        description="Instructor identifier supplied by the LMS (may differ from chat user_id)",
    )
    course_ids: list[str] = Field(
        default_factory=list,
        description="Course UUIDs this instructor currently cares about",
    )
    time_window_days: int = Field(
        default=7,
        description="Lookback window in days used for tool since_hours arguments",
    )


class LmsPlatformContext(BaseModel):
    """LMS-supplied context for the Platform agent."""

    operator_role: str | None = Field(
        default=None,
        description="Operator role hint (e.g. content_lead, marketing, finance)",
    )
    focus_categories: list[str] = Field(
        default_factory=list,
        description="Categories the operator is currently focused on",
    )
    time_window_days: int = Field(
        default=30,
        description="Lookback window in days used for tool since_hours arguments",
    )


class ProfileCreate(BaseModel):
    user_id: str
    career_goal: str | None = None
    experience_level: str | None = None
    available_minutes: int | None = None
    final_goal: str | None = None
    enrolled_courses: list[str] | None = None


class ProfileResponse(BaseModel):
    id: UUID
    user_id: str
    career_goal: str | None = None
    experience_level: str | None = None
    available_minutes: int | None = None
    final_goal: str | None = None
    enrolled_courses: list[str] | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QuizSubmit(BaseModel):
    user_id: str
    concept_id: str
    course_id: UUID
    question_text: str
    user_answer: str
    is_correct: bool
    response_time_ms: int | None = None


class QuizResponse(BaseModel):
    id: UUID
    user_id: str
    concept_id: str
    course_id: UUID
    question_text: str
    user_answer: str
    is_correct: bool
    response_time_ms: int | None = None
    next_review_at: datetime | None = None
    interval_days: int
    ease_factor: float
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewScheduleResponse(BaseModel):
    user_id: str
    due_items: list[QuizResponse]
    total_due: int


class ScheduleItem(BaseModel):
    type: str = Field(..., description="Item type: new, review, or quiz")
    title: str = Field(..., description="Course title")
    chapter_no: int | None = None
    clip_no: int | None = None
    clip_title: str | None = None
    concept_id: str = Field(..., description="Concept identifier")
    estimated_minutes: int = 10
    completed: bool = False


class WeeklyPlanDay(BaseModel):
    day: str = Field(..., description="Day of week in Korean (월, 화, ...)")
    date: str = Field(..., description="ISO date string")
    total_items: int
    completed_items: int


class ScheduleStats(BaseModel):
    today_completed: int
    today_total: int
    streak_days: int
    mastered_concepts: int


class LearningScheduleResponse(BaseModel):
    today_schedule: list[ScheduleItem]
    weekly_plan: list[WeeklyPlanDay]
    stats: ScheduleStats
