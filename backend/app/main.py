from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import close_pool, init_pool
from app.routers.chat import router as chat_router
from app.routers.events import router as events_router
from app.routers.instructor import router as instructor_router
from app.routers.platform import router as platform_router
from app.routers.profiles import router as profiles_router
from app.routers.quiz import router as quiz_router
from app.routers.review import router as review_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_pool()
    try:
        yield
    finally:
        close_pool()


app = FastAPI(
    title="KEG AI Tutor",
    description="AI-powered education platform with personalized tutoring",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(profiles_router)
app.include_router(quiz_router)
app.include_router(review_router)
app.include_router(instructor_router)
app.include_router(platform_router)
app.include_router(events_router)


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok"}
