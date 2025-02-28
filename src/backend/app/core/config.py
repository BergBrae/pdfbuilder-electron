"""
Application configuration.
"""

import os
from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    API_V1_STR: str = ""
    PROJECT_NAME: str = "PDF Builder API"

    # CORS settings
    CORS_ORIGINS: list = [
        "http://localhost:1212",
        "*",
    ]

    # Paths
    BASE_DIR: str = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )

    class Config:
        case_sensitive = True


settings = Settings()
