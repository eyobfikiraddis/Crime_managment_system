from __future__ import annotations

import json
from typing import Any

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_ENV: str = Field(default="development", description="Application environment name")
    APP_VERSION: str = Field(default="3.0.0", description="Application semantic version")
    DEBUG: bool = Field(default=False, description="Enable debug logging")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")

    # Database
    DATABASE_URL: str = Field(..., description="Async PostgreSQL connection URL")

    # Redis
    REDIS_URL: str = Field(..., description="Redis connection URL")

    # Auth
    SECRET_KEY: str = Field(..., description="JWT signing key (min 32 chars)")
    SECRET_KEY_ID: str = Field(default="k1", description="Active signing key identifier")
    PREVIOUS_SECRET_KEYS: list[dict[str, str]] = Field(
        default_factory=list,
        description="JSON array of previous keys with id/key for rotation",
    )

    # Hashing
    BCRYPT_ROUNDS: int = Field(default=12, ge=10, le=15, description="Bcrypt cost factor")

    # Token & Session
    ACCESS_TOKEN_TTL_SECONDS: int = Field(
        default=900, description="Access token TTL in seconds"
    )
    MAX_SESSION_SECONDS: int = Field(
        default=28800, description="Maximum session lifetime in seconds"
    )
    IDLE_TIMEOUT_SECONDS: int = Field(
        default=3600, description="Idle timeout in seconds"
    )
    MAX_CONCURRENT_SESSIONS_PER_OFFICER: int = Field(
        default=1, ge=0, description="Max concurrent sessions per officer (0 = unlimited)"
    )
    REQUEST_SIZE_LIMIT_BYTES: int = Field(
        default=2 * 1024 * 1024, ge=1024, description="Max request size in bytes"
    )
    PERMISSION_CACHE_TTL_SECONDS: int = Field(
        default=300, ge=30, description="Permission cache TTL in seconds"
    )

    # CORS
    CORS_ALLOWED_ORIGINS: list[str] = Field(
        default_factory=list, description="Comma-separated allowed CORS origins"
    )

    # Feature Flags
    AUTO_CLOSE_ON_VERDICT: bool = Field(
        default=True, description="Auto-close cases on verdict"
    )

    # Object Storage
    OBJECT_STORAGE_ENDPOINT: str = Field(
        default="", description="Object storage API endpoint"
    )
    OBJECT_STORAGE_BUCKET: str = Field(
        default="ccms-evidence", description="Object storage bucket name"
    )

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_min_length(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        return v

    @field_validator("PREVIOUS_SECRET_KEYS", mode="before")
    @classmethod
    def parse_previous_keys(cls, v: Any) -> list[dict[str, str]]:
        if v is None or v == "":
            return []
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    "PREVIOUS_SECRET_KEYS must be a JSON array of {id, key} objects"
                ) from exc
            return parsed
        return v

    @field_validator("PREVIOUS_SECRET_KEYS")
    @classmethod
    def validate_previous_keys(cls, v: list[dict[str, str]]) -> list[dict[str, str]]:
        for item in v:
            if not isinstance(item, dict):
                raise ValueError("Each previous key must be an object with id/key")
            if "id" not in item or "key" not in item:
                raise ValueError("Each previous key must include id and key")
        return v

    @field_validator("CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if v is None or v == "":
            return []
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @model_validator(mode="after")
    def validate_database_url_driver(self) -> "Settings":
        if not self.DATABASE_URL.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "DATABASE_URL must use asyncpg driver: postgresql+asyncpg://..."
            )
        return self


def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
