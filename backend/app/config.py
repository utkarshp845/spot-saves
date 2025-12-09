"""Application configuration using Pydantic Settings."""
import os
from typing import Optional, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings with validation."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # Application
    app_name: str = "SpotSave API"
    app_version: str = "1.0.0"
    environment: str = Field(default="development", pattern="^(development|staging|production)$")
    debug: bool = Field(default=False)
    
    # API
    api_prefix: str = "/api"
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://frontend:3000"],
        description="Allowed CORS origins"
    )
    
    # Database
    database_url: str = Field(
        default="sqlite:///./spotsave.db",
        description="Database connection URL (SQLite or PostgreSQL)"
    )
    database_pool_size: int = Field(default=5, ge=1, le=20)
    database_max_overflow: int = Field(default=10, ge=0)
    database_pool_timeout: int = Field(default=30, ge=1)
    
    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate database URL format."""
        if not v:
            raise ValueError("DATABASE_URL cannot be empty")
        if v.startswith("postgresql://") or v.startswith("postgresql+psycopg2://"):
            if "://" not in v:
                raise ValueError("Invalid PostgreSQL URL format")
        elif v.startswith("sqlite:///"):
            pass  # SQLite is fine for development
        else:
            raise ValueError("DATABASE_URL must be PostgreSQL or SQLite")
        return v
    
    # AWS
    aws_region: str = Field(default="us-east-1")
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None
    
    # Secrets Manager (for production)
    use_secrets_manager: bool = Field(default=False)
    secrets_manager_secret_name: Optional[str] = None
    
    # NextAuth
    nextauth_secret: str = Field(default="change-me-in-production")
    nextauth_url: str = Field(default="http://localhost:3000")
    next_public_app_url: str = Field(default="http://localhost:3000", alias="NEXT_PUBLIC_APP_URL")
    
    # Logging
    log_level: str = Field(default="INFO", pattern="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")
    log_format: str = Field(default="json", pattern="^(json|text)$")
    enable_cloudwatch: bool = Field(default=False)
    cloudwatch_log_group: Optional[str] = None
    
    # Security
    rate_limit_enabled: bool = Field(default=True)
    rate_limit_per_minute: int = Field(default=60, ge=1)
    
    # Performance
    enable_response_caching: bool = Field(default=False)
    cache_ttl_seconds: int = Field(default=300, ge=0)
    
    # Cron
    scan_schedule: str = Field(default="0 2 * * *", description="Cron schedule for scans")
    backend_url: str = Field(default="http://backend:8000")
    
    # Health Checks
    health_check_interval: int = Field(default=30, ge=5)
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development."""
        return self.environment == "development"
    
    def get_database_url(self) -> str:
        """Get database URL, optionally from Secrets Manager in production."""
        if self.is_production and self.use_secrets_manager and self.secrets_manager_secret_name:
            try:
                import boto3
                import json
                from botocore.exceptions import ClientError
                
                client = boto3.client('secretsmanager', region_name=self.aws_region)
                response = client.get_secret_value(SecretId=self.secrets_manager_secret_name)
                secret = json.loads(response['SecretString'])  # Parse JSON string safely
                return secret.get('DATABASE_URL', self.database_url)
            except Exception as e:
                # Fallback to environment variable
                print(f"Warning: Could not fetch secret from Secrets Manager: {e}")
                return self.database_url
        return self.database_url
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins, with environment-specific additions."""
        origins = self.cors_origins.copy()
        if self.is_production:
            # Add production domain if set
            if self.nextauth_url:
                origins.append(self.nextauth_url)
            if self.next_public_app_url:
                origins.append(self.next_public_app_url)
        return list(set(origins))  # Remove duplicates


# Global settings instance
settings = Settings()

