from typing import List, Union
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Campus Complaint System"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # SQLite for development, interchangeable with PostgreSQL for production
    DATABASE_URL: str = "sqlite:///./campus_complaints.db"

    # JWT Authentication settings
    SECRET_KEY: str = "smart-campus-dev-insecure-secret-key-change-in-prod-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Allowed CORS Origins (Frontend URLs)
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Machine Learning Model Configuration
    ML_MODELS_DIR: str = "ml/models"
    CATEGORY_MODEL_VERSION: str = "step8c"
    PRIORITY_MODEL_VERSION: str = "step8c"
    ML_CONFIDENCE_THRESHOLD: float = 0.40

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
