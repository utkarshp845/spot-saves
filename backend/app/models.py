"""SQLModel database models."""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class Account(SQLModel, table=True):
    """AWS Account connection model."""
    __tablename__ = "accounts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[str] = Field(default=None, index=True)  # Optional for anonymous scans
    account_name: str
    role_arn: str = Field(unique=True, index=True)
    external_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_scan_at: Optional[datetime] = None
    is_active: bool = Field(default=True)
    
    # Relationships
    scans: list["ScanResult"] = Relationship(back_populates="account")
    savings: list["SavingsOpportunity"] = Relationship(back_populates="account")


class ScanResult(SQLModel, table=True):
    """Scan execution result model."""
    __tablename__ = "scan_results"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="accounts.id")
    scan_type: str = Field(default="full")  # full, quick, scheduled
    status: str = Field(default="running")  # running, completed, failed
    total_potential_savings: float = Field(default=0.0)
    scan_started_at: datetime = Field(default_factory=datetime.utcnow)
    scan_completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    raw_data: Optional[str] = None  # JSON string of full scan data
    
    # Relationships
    account: Account = Relationship(back_populates="scans")
    opportunities: list["SavingsOpportunity"] = Relationship(back_populates="scan_result")


class SavingsOpportunity(SQLModel, table=True):
    """Individual savings opportunity model."""
    __tablename__ = "savings_opportunities"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="accounts.id")
    scan_result_id: int = Field(foreign_key="scan_results.id")
    opportunity_type: str = Field(index=True)  # ri_sp, rightsizing, idle, graviton
    resource_id: str
    resource_type: str  # ec2-instance, rds, etc.
    region: str
    current_cost_monthly: float
    potential_savings_monthly: float
    potential_savings_annual: float
    savings_percentage: float
    recommendation: str
    details: Optional[str] = None  # JSON string for additional details
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    account: Account = Relationship(back_populates="savings")
    scan_result: ScanResult = Relationship(back_populates="opportunities")

