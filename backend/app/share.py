"""
Shareable links for scan results.
"""
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class ShareToken(SQLModel, table=True):
    """Shareable token for scan results."""
    __tablename__ = "share_tokens"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    scan_result_id: int = Field(foreign_key="scan_results.id", index=True)
    token: str = Field(unique=True, index=True)  # Public share token
    password_hash: Optional[str] = None  # Optional password protection
    expires_at: Optional[datetime] = None
    access_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @staticmethod
    def generate_token() -> str:
        """Generate a secure random token."""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password for storage."""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, password: str) -> bool:
        """Verify a password against the hash."""
        if not self.password_hash:
            return True  # No password set
        return self.password_hash == self.hash_password(password)
    
    def is_expired(self) -> bool:
        """Check if the token has expired."""
        if not self.expires_at:
            return False  # No expiration
        return datetime.now(timezone.utc) > self.expires_at


def create_share_token(
    scan_result_id: int,
    expires_days: int = 30,
    password: Optional[str] = None,
    session = None
) -> ShareToken:
    """Create a new share token for a scan result."""
    token = ShareToken.generate_token()
    
    share_token = ShareToken(
        scan_result_id=scan_result_id,
        token=token,
        password_hash=ShareToken.hash_password(password) if password else None,
        expires_at=datetime.now(timezone.utc) + timedelta(days=expires_days) if expires_days > 0 else None
    )
    
    if session:
        session.add(share_token)
        session.commit()
        session.refresh(share_token)
    
    return share_token

