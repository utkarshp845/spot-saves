"""Database configuration and initialization."""
import os
from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session
from typing import Generator

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./spotsave.db")

# Ensure the database directory exists
if DATABASE_URL.startswith("sqlite"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    if db_path != ":memory:":
        db_dir = Path(db_path).parent
        if db_dir != Path("."):
            db_dir.mkdir(parents=True, exist_ok=True)

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def init_db() -> None:
    """Initialize the database by creating all tables."""
    SQLModel.metadata.create_all(engine)
    print("Database initialized successfully")


def get_session() -> Generator[Session, None, None]:
    """Dependency to get database session."""
    with Session(engine) as session:
        yield session


def check_migrations() -> None:
    """Check if migrations are needed and run them."""
    # For now, just ensure tables exist
    # In production, you'd use Alembic or similar
    SQLModel.metadata.create_all(engine)

