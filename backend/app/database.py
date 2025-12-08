"""Database configuration and initialization with PostgreSQL support."""
import os
from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.engine import Engine as SQLAlchemyEngine
from sqlalchemy.pool import QueuePool
from typing import Generator
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Get database URL
DATABASE_URL = settings.get_database_url()

# Ensure the database directory exists for SQLite
if DATABASE_URL.startswith("sqlite"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    if db_path != ":memory:":
        db_dir = Path(db_path).parent
        if db_dir != Path("."):
            db_dir.mkdir(parents=True, exist_ok=True)
    # SQLite connection args
    connect_args = {"check_same_thread": False}
    engine_kwargs = {"connect_args": connect_args}
else:
    # PostgreSQL connection args
    connect_args = {}
    engine_kwargs = {
        "poolclass": QueuePool,
        "pool_size": settings.database_pool_size,
        "max_overflow": settings.database_max_overflow,
        "pool_timeout": settings.database_pool_timeout,
        "pool_pre_ping": True,  # Verify connections before using
        "echo": settings.debug,  # Log SQL queries in debug mode
    }

# Create engine
engine: SQLAlchemyEngine = create_engine(DATABASE_URL, **engine_kwargs)


def init_db() -> None:
    """Initialize the database by creating all tables."""
    try:
        SQLModel.metadata.create_all(engine)
        logger.info("Database initialized successfully")
        logger.info(f"Database URL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'SQLite'}")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


def check_db_connection() -> bool:
    """Check if database connection is healthy."""
    try:
        with Session(engine) as session:
            session.exec(SQLModel.metadata.select(None)).first()
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False


def get_session() -> Generator[Session, None, None]:
    """Dependency to get database session."""
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()


def check_migrations() -> None:
    """Check if migrations are needed and run them."""
    # For now, just ensure tables exist
    # In production, you'd use Alembic or similar
    try:
        SQLModel.metadata.create_all(engine)
        logger.info("Database migrations checked")
    except Exception as e:
        logger.error(f"Migration check failed: {e}")
        raise
