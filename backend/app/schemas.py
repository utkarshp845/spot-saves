"""Pydantic schemas for API requests and responses."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Account schemas
class AccountCreate(BaseModel):
    account_name: str
    role_arn: str
    external_id: str


class AccountResponse(BaseModel):
    id: int
    account_name: str
    role_arn: str
    created_at: datetime
    last_scan_at: Optional[datetime]
    is_active: bool
    
    class Config:
        from_attributes = True


# Scan schemas
class ScanRequest(BaseModel):
    account_id: Optional[int] = None
    role_arn: Optional[str] = None
    external_id: Optional[str] = None
    scan_type: str = Field(default="full", pattern="^(full|quick)$")
    notification_email: Optional[str] = None  # Optional email for scan completion notification


class ScanResponse(BaseModel):
    scan_id: int
    status: str
    message: str
    scan_started_at: datetime


class ScanStatusResponse(BaseModel):
    scan_id: int
    status: str
    total_potential_savings: float
    scan_started_at: datetime
    scan_completed_at: Optional[datetime]
    error_message: Optional[str]


# Savings opportunity schemas
class SavingsOpportunityResponse(BaseModel):
    id: int
    opportunity_type: str
    resource_id: str
    resource_type: str
    region: str
    current_cost_monthly: float
    potential_savings_monthly: float
    potential_savings_annual: float
    savings_percentage: float
    recommendation: str
    details: Optional[str]
    
    class Config:
        from_attributes = True


# Dashboard schemas
class DashboardResponse(BaseModel):
    total_potential_savings_annual: float
    total_potential_savings_monthly: float
    opportunities_by_type: dict
    opportunities: List[SavingsOpportunityResponse]
    last_scan_at: Optional[datetime]
    account_id: Optional[int]


# Health check schema
class HealthResponse(BaseModel):
    status: str
    database: str
    timestamp: datetime

