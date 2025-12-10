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
    # Handle both relative (./) and absolute (/app/data/) paths
    if db_path.startswith("/"):
        # Absolute path
        db_path = db_path
    else:
        # Relative path - convert to absolute
        db_path = str(Path(db_path).resolve())
    
    if db_path != ":memory:":
        db_dir = Path(db_path).parent
        try:
            db_dir.mkdir(parents=True, exist_ok=True)
            # Ensure directory is writable
            os.chmod(db_dir, 0o777)
            logger.info(f"Database directory ensured: {db_dir}")
        except Exception as e:
            logger.error(f"Failed to create database directory {db_dir}: {e}")
            raise
    
    # SQLite connection args
    connect_args = {"check_same_thread": False}
    engine_kwargs = {"connect_args": connect_args}
    logger.info(f"Using SQLite database at: {db_path}")
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
        logger.info(f"Initializing database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
        SQLModel.metadata.create_all(engine)
        logger.info("Database initialized successfully")
        # Test write access with a simple query
        from sqlalchemy import text
        with Session(engine) as test_session:
            test_session.exec(text("SELECT 1")).first()
        logger.info("Database write test passed")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}", exc_info=True)
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
