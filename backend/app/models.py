"""SQLModel database models."""
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class Account(SQLModel, table=True):
    """AWS Account connection model."""
    __tablename__ = "accounts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[str] = Field(default=None, index=True)  # Optional for anonymous scans
    account_name: str
    aws_account_id: Optional[str] = Field(default=None, index=True)  # Extracted from Role ARN
    role_arn: str = Field(unique=True, index=True)
    external_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_scan_at: Optional[datetime] = None
    is_active: bool = Field(default=True)
    
    # Relationships
    scans: list["ScanResult"] = Relationship(back_populates="account")
    savings: list["SavingsOpportunity"] = Relationship(back_populates="account")


class ScanResult(SQLModel, table=True):
    """Scan execution result model."""
    __tablename__ = "scan_results"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="accounts.id", index=True)  # Added index for performance
    scan_type: str = Field(default="full")  # full, quick, scheduled
    status: str = Field(default="running")  # running, completed, failed
    total_potential_savings: float = Field(default=0.0)
    scan_started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)  # Added index for ordering
    scan_completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    raw_data: Optional[str] = None  # JSON string of full scan data
    notification_email: Optional[str] = None  # Optional email for notifications
    
    # Relationships
    account: Account = Relationship(back_populates="scans")
    opportunities: list["SavingsOpportunity"] = Relationship(back_populates="scan_result")


class SavingsOpportunity(SQLModel, table=True):
    """Individual savings opportunity model."""
    __tablename__ = "savings_opportunities"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="accounts.id")
    scan_result_id: int = Field(foreign_key="scan_results.id", index=True)  # Added index for performance
    opportunity_type: str = Field(index=True)  # ri_sp, rightsizing, idle, graviton
    resource_id: str
    resource_type: str  # ec2-instance, rds, etc.
    region: str
    current_cost_monthly: float
    potential_savings_monthly: float
    potential_savings_annual: float = Field(index=True)  # Added index for sorting
    savings_percentage: float
    recommendation: str
    action_steps: Optional[str] = None  # JSON array of step-by-step instructions
    implementation_time_hours: Optional[float] = None  # Estimated hours to implement
    risk_level: Optional[str] = None  # low, medium, high
    prerequisites: Optional[str] = None  # JSON array of required conditions
    expected_savings_timeline: Optional[str] = None  # immediate, 1-month, 3-months
    rollback_plan: Optional[str] = None  # How to undo if needed
    details: Optional[str] = None  # JSON string for additional details
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    account: Account = Relationship(back_populates="savings")
    scan_result: ScanResult = Relationship(back_populates="opportunities")

