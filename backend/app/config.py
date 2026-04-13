from pathlib import Path

from pydantic_settings import BaseSettings

# Resolve .env from project root (4 levels up from this file: app -> backend -> kit-hackathon root)
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    RAG_TOP_K: int = 5

    model_config = {"env_file": str(_ENV_FILE), "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
