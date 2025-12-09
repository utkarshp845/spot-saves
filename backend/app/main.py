"""FastAPI main application."""
import os
import json
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request
from starlette.requests import Request as StarletteRequest
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, Response
from sqlmodel import Session, select

from app.config import settings
from app.logging_config import setup_logging, get_logger
from app.database import engine, init_db, get_session, check_migrations, check_db_connection
from app.models import Account, ScanResult, SavingsOpportunity
# Import ShareToken to ensure it's registered with SQLModel
from app.share import ShareToken  # noqa: F401
from app.schemas import (
    AccountCreate, AccountResponse, ScanRequest, ScanResponse,
    ScanStatusResponse, DashboardResponse, SavingsOpportunityResponse,
    HealthResponse
)
from app.scanner import AWSScanner, extract_aws_account_id
from app.streaming import create_sse_response
from app.notifications import send_scan_completion_email
from app.share import ShareToken, create_share_token
from app.error_messages import get_user_friendly_error, parse_aws_error


logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    setup_logging()
    logger.info("Initializing SpotSave backend...", extra={"environment": settings.environment})
    try:
        init_db()
        logger.info("Backend initialized successfully")
    except Exception as e:
        logger.critical(f"Failed to initialize backend: {e}", exc_info=True)
        raise
    yield
    # Shutdown
    logger.info("Shutting down SpotSave backend...")


app = FastAPI(
    title=settings.app_name,
    description="AWS Cost Optimization Scanner",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,  # Disable docs in production
    redoc_url="/redoc" if not settings.is_production else None,
)

# CORS configuration - allow production domain
cors_origins = settings.get_cors_origins()
if settings.is_production:
    cors_origins.extend([
        "https://spotsave.pandeylabs.com",
        "https://www.spotsave.pandeylabs.com",
        "https://pc35p58bek.us-east-1.awsapprunner.com",  # App Runner frontend
        "http://pc35p58bek.us-east-1.awsapprunner.com",   # App Runner frontend (HTTP fallback)
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response compression for faster API responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: StarletteRequest, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    if settings.is_production:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.post("/api/scan/{scan_id}/share")
async def create_share_link(
    scan_id: int,
    expires_days: int = 30,
    password: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Create a shareable link for scan results."""
    scan_result = session.get(ScanResult, scan_id)
    if not scan_result:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Create share token
    share_token = create_share_token(
        scan_result_id=scan_id,
        expires_days=expires_days,
        password=password,
        session=session
    )
    
    base_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
    share_url = f"{base_url}/share/{share_token.token}"
    
    return {
        "share_url": share_url,
        "token": share_token.token,
        "expires_at": share_token.expires_at.isoformat() if share_token.expires_at else None,
        "password_protected": password is not None
    }


@app.get("/api/share/{token}")
async def get_shared_scan(
    token: str,
    password: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Get scan results via share token (public access)."""
    from sqlmodel import select
    
    statement = select(ShareToken).where(ShareToken.token == token)
    share_token = session.exec(statement).first()
    
    if not share_token:
        raise HTTPException(status_code=404, detail="Share link not found")
    
    if share_token.is_expired():
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    if not share_token.verify_password(password or ""):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Increment access count
    share_token.access_count += 1
    session.add(share_token)
    session.commit()
    
    # Get scan result
    scan_result = session.get(ScanResult, share_token.scan_result_id)
    if not scan_result:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Get opportunities
    statement = select(SavingsOpportunity).where(
        SavingsOpportunity.scan_result_id == share_token.scan_result_id
    )
    opportunities = session.exec(statement).all()
    
    # Return public dashboard data
    opportunities_by_type = {}
    for opp in opportunities:
        if opp.opportunity_type not in opportunities_by_type:
            opportunities_by_type[opp.opportunity_type] = {
                "count": 0,
                "total_savings_annual": 0.0
            }
        opportunities_by_type[opp.opportunity_type]["count"] += 1
        opportunities_by_type[opp.opportunity_type]["total_savings_annual"] += opp.potential_savings_annual
    
    return {
        "total_potential_savings_annual": scan_result.total_potential_savings,
        "total_potential_savings_monthly": scan_result.total_potential_savings / 12,
        "opportunities_by_type": opportunities_by_type,
        "opportunities": [
            {
                "id": opp.id,
                "opportunity_type": opp.opportunity_type,
                "resource_id": opp.resource_id,
                "resource_type": opp.resource_type,
                "region": opp.region,
                "current_cost_monthly": opp.current_cost_monthly,
                "potential_savings_monthly": opp.potential_savings_monthly,
                "potential_savings_annual": opp.potential_savings_annual,
                "savings_percentage": opp.savings_percentage,
                "recommendation": opp.recommendation
            }
            for opp in opportunities
        ],
        "scan_id": scan_result.id,
        "scan_completed_at": scan_result.scan_completed_at.isoformat() if scan_result.scan_completed_at else None,
        "shared": True
    }


@app.get("/health")
@app.head("/health")
async def health_check():
    """Liveness probe - simple check without database dependency. Accepts both GET and HEAD."""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/health/ready", response_model=HealthResponse)
async def readiness_check():
    """Readiness probe - checks if service is ready to accept traffic."""
    db_healthy = check_db_connection()
    
    status = "healthy" if db_healthy else "degraded"
    db_status = "connected" if db_healthy else "error"
    
    response = HealthResponse(
        status=status,
        database=db_status,
        timestamp=datetime.now(timezone.utc)
    )
    
    if not db_healthy:
        logger.warning("Readiness check failed - database connection unhealthy")
        raise HTTPException(status_code=503, detail=response.model_dump())
    
    return response


@app.get("/health/detailed", response_model=HealthResponse)
async def detailed_health_check(session: Session = Depends(get_session)):
    """Detailed health check endpoint with database connection test."""
    try:
        # Test database connection
        session.exec(select(Account)).first()
        db_status = "connected"
        health_status = "healthy"
    except Exception as e:
        logger.error(f"Detailed health check failed: {e}")
        db_status = "error"
        health_status = "degraded"
    
    response = HealthResponse(
        status=health_status,
        database=db_status,
        timestamp=datetime.now(timezone.utc)
    )
    return response


@app.post("/api/accounts", response_model=AccountResponse)
async def create_account(
    account_data: AccountCreate,
    user_id: Optional[str] = None,  # Optional for anonymous mode
    session: Session = Depends(get_session)
):
    """Create or update an AWS account connection."""
    # Check if account already exists
    existing = session.exec(
        select(Account).where(Account.role_arn == account_data.role_arn)
    ).first()
    
    if existing:
        # Update existing account
        existing.account_name = account_data.account_name
        existing.external_id = account_data.external_id
        existing.is_active = True
        existing.aws_account_id = extract_aws_account_id(account_data.role_arn)
        if user_id:
            existing.user_id = user_id
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    
    # Extract AWS account ID from Role ARN
    aws_account_id = extract_aws_account_id(account_data.role_arn)
    
    # Create new account
    account = Account(
        account_name=account_data.account_name,
        aws_account_id=aws_account_id,
        role_arn=account_data.role_arn,
        external_id=account_data.external_id,
        user_id=user_id
    )
    session.add(account)
    session.commit()
    session.refresh(account)
    return account


@app.get("/api/accounts", response_model=list[AccountResponse])
async def list_accounts(
    user_id: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """List accounts for a user (optional)."""
    if user_id:
        accounts = session.exec(
            select(Account).where(Account.user_id == user_id, Account.is_active == True)
        ).all()
    else:
        # Return all active accounts (for admin or anonymous mode)
        accounts = session.exec(
            select(Account).where(Account.is_active == True)
        ).all()
    return accounts


@app.post("/api/scan", response_model=ScanResponse)
async def trigger_scan(
    scan_request: ScanRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    """Trigger a scan - either for an existing account or one-time scan."""
    account: Optional[Account] = None
    
    # Determine account
    if scan_request.account_id:
        account = session.get(Account, scan_request.account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        role_arn = account.role_arn
        external_id = account.external_id
    elif scan_request.role_arn and scan_request.external_id:
        # One-time scan - create temporary account record
        aws_account_id = extract_aws_account_id(scan_request.role_arn)
        account = Account(
            account_name=f"One-time scan {datetime.now(timezone.utc).isoformat()}",
            aws_account_id=aws_account_id,
            role_arn=scan_request.role_arn,
            external_id=scan_request.external_id,
            user_id=None  # Anonymous
        )
        session.add(account)
        session.commit()
        session.refresh(account)
        role_arn = scan_request.role_arn
        external_id = scan_request.external_id
    else:
        raise HTTPException(
            status_code=400,
            detail="Either account_id or (role_arn + external_id) must be provided"
        )
    
    # Create scan result record
    scan_result = ScanResult(
        account_id=account.id,
        scan_type=scan_request.scan_type,
        status="running",
        notification_email=scan_request.notification_email
    )
    session.add(scan_result)
    session.commit()
    session.refresh(scan_result)
    
    # Run scan in background
    background_tasks.add_task(
        run_scan,
        scan_result.id,
        role_arn,
        external_id,
        scan_request.scan_type,
        scan_request.notification_email
    )
    
    return ScanResponse(
        scan_id=scan_result.id,
        status="running",
        message="Scan started",
        scan_started_at=scan_result.scan_started_at
    )


async def run_scan(scan_id: int, role_arn: str, external_id: str, scan_type: str, notification_email: Optional[str] = None):
    """Background task to run the actual scan with progressive saving."""
    session = Session(engine)
    try:
        scan_result = session.get(ScanResult, scan_id)
        if not scan_result:
            return
        
        # Run scanner with callback for progressive saving
        region = os.getenv("AWS_REGION", "us-east-1")
        scanner = AWSScanner(role_arn, external_id, region)
        
        account = session.get(Account, scan_result.account_id)
        
        def save_opportunity_callback(opp_data: dict):
            """Callback to save opportunities as they're discovered."""
            # Parse details if it's already a JSON string
            details_str = opp_data.get('details')
            if details_str and isinstance(details_str, str):
                try:
                    # If it's already JSON, use it; otherwise stringify
                    json.loads(details_str)
                except (json.JSONDecodeError, TypeError):
                    details_str = json.dumps(details_str) if details_str else None
            elif details_str:
                details_str = json.dumps(details_str)
            
            opportunity = SavingsOpportunity(
                account_id=scan_result.account_id,
                scan_result_id=scan_result.id,
                opportunity_type=opp_data['opportunity_type'],
                resource_id=opp_data['resource_id'],
                resource_type=opp_data['resource_type'],
                region=opp_data['region'],
                current_cost_monthly=opp_data['current_cost_monthly'],
                potential_savings_monthly=opp_data['potential_savings_monthly'],
                potential_savings_annual=opp_data['potential_savings_annual'],
                savings_percentage=opp_data['savings_percentage'],
                recommendation=opp_data['recommendation'],
                action_steps=opp_data.get('action_steps'),
                implementation_time_hours=opp_data.get('implementation_time_hours'),
                risk_level=opp_data.get('risk_level'),
                prerequisites=opp_data.get('prerequisites'),
                expected_savings_timeline=opp_data.get('expected_savings_timeline'),
                rollback_plan=opp_data.get('rollback_plan'),
                details=details_str
            )
            session.add(opportunity)
            session.commit()
            session.refresh(opportunity)
            return opportunity
        
        if scan_type == "quick":
            # Quick scan - just RI/SP opportunities
            opportunities = scanner._scan_reserved_instances()
            for opp_data in opportunities:
                save_opportunity_callback(opp_data)
            
            total_savings_monthly = sum(opp['potential_savings_monthly'] for opp in opportunities)
            total_savings_annual = total_savings_monthly * 12
            
            results = {
                'opportunities': opportunities,
                'total_savings_annual': total_savings_annual,
                'total_savings_monthly': total_savings_monthly
            }
        else:
            # Full scan with progressive saving
            results = scanner.scan_account_progressive(save_opportunity_callback)
        
        # Mark scan as completed
        scan_result.status = "completed"
        scan_result.scan_completed_at = datetime.now(timezone.utc)
        scan_result.total_potential_savings = results['total_savings_annual']
        scan_result.raw_data = json.dumps(results)
        session.add(scan_result)
        
        # Update account last_scan_at
        if account:
            account.last_scan_at = datetime.now(timezone.utc)
            session.add(account)
        
        session.commit()
        
        # Send email notification if requested
        if notification_email:
            # Count opportunities
            statement = select(SavingsOpportunity).where(
                SavingsOpportunity.scan_result_id == scan_id
            )
            opportunities = session.exec(statement).all()
            opportunities_count = len(opportunities)
            
            # Send email
            send_scan_completion_email(
                email=notification_email,
                scan_id=scan_id,
                total_savings=results['total_savings_annual'],
                opportunities_count=opportunities_count
            )
    
    except Exception as e:
        # Mark scan as failed with user-friendly error
        scan_result = session.get(ScanResult, scan_id)
        if scan_result:
            error_type = parse_aws_error(str(e))
            friendly_error = get_user_friendly_error(error_type, str(e))
            
            scan_result.status = "failed"
            scan_result.error_message = json.dumps(friendly_error)  # Store structured error
            scan_result.scan_completed_at = datetime.now(timezone.utc)
            session.add(scan_result)
            session.commit()
    finally:
        session.close()


@app.get("/api/scan/{scan_id}/progress")
async def get_scan_progress(scan_id: int):
    """Stream real-time scan progress via Server-Sent Events."""
    return create_sse_response(scan_id)


@app.get("/api/scan/{scan_id}", response_model=ScanStatusResponse)
async def get_scan_status(scan_id: int, session: Session = Depends(get_session)):
    """Get scan status and results."""
    scan_result = session.get(ScanResult, scan_id)
    if not scan_result:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    return scan_result


@app.get("/api/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    account_id: Optional[int] = None,
    user_id: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Get dashboard data with savings summary."""
    # Get the most recent scan for the account
    if account_id:
        account = session.get(Account, account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Get latest scan
        latest_scan = session.exec(
            select(ScanResult)
            .where(ScanResult.account_id == account_id)
            .order_by(ScanResult.scan_started_at.desc())
        ).first()
    else:
        # Get latest scan for user or anonymous
        query = select(ScanResult).order_by(ScanResult.scan_started_at.desc())
        if user_id:
            accounts = session.exec(
                select(Account).where(Account.user_id == user_id)
            ).all()
            account_ids = [acc.id for acc in accounts]
            if account_ids:
                query = query.where(ScanResult.account_id.in_(account_ids))
        
        latest_scan = session.exec(query).first()
        account_id = latest_scan.account_id if latest_scan else None
    
    if not latest_scan:
        account_info = session.get(Account, account_id) if account_id else None
        return DashboardResponse(
            total_potential_savings_annual=0.0,
            total_potential_savings_monthly=0.0,
            opportunities_by_type={},
            opportunities=[],
            last_scan_at=None,
            account_id=account_id,
            aws_account_id=account_info.aws_account_id if account_info else None,
            account_name=account_info.account_name if account_info else None,
            total_current_cost_monthly=None
        )
    
    # Get all opportunities from this scan, sorted by annual savings (highest first)
    opportunities = session.exec(
        select(SavingsOpportunity)
        .where(SavingsOpportunity.scan_result_id == latest_scan.id)
        .order_by(SavingsOpportunity.potential_savings_annual.desc())
    ).all()
    
    # Calculate totals
    total_annual = sum(opp.potential_savings_annual for opp in opportunities)
    total_monthly = sum(opp.potential_savings_monthly for opp in opportunities)
    
    # Group by type
    opportunities_by_type = {}
    for opp in opportunities:
        if opp.opportunity_type not in opportunities_by_type:
            opportunities_by_type[opp.opportunity_type] = {
                'count': 0,
                'total_savings_annual': 0.0
            }
        opportunities_by_type[opp.opportunity_type]['count'] += 1
        opportunities_by_type[opp.opportunity_type]['total_savings_annual'] += opp.potential_savings_annual
    
    account = session.get(Account, account_id) if account_id else None
    
    # Calculate total current monthly cost
    total_current_cost = sum(opp.current_cost_monthly for opp in opportunities)
    
    # Convert opportunities to response format with all new fields
    opportunity_responses = []
    for opp in opportunities:
        opp_dict = {
            'id': opp.id,
            'opportunity_type': opp.opportunity_type,
            'resource_id': opp.resource_id,
            'resource_type': opp.resource_type,
            'region': opp.region,
            'current_cost_monthly': opp.current_cost_monthly,
            'potential_savings_monthly': opp.potential_savings_monthly,
            'potential_savings_annual': opp.potential_savings_annual,
            'savings_percentage': opp.savings_percentage,
            'recommendation': opp.recommendation,
            'action_steps': opp.action_steps,
            'implementation_time_hours': opp.implementation_time_hours,
            'risk_level': opp.risk_level,
            'prerequisites': opp.prerequisites,
            'expected_savings_timeline': opp.expected_savings_timeline,
            'rollback_plan': opp.rollback_plan,
            'details': opp.details
        }
        opportunity_responses.append(SavingsOpportunityResponse(**opp_dict))
    
    # Get account info if available
    account_info = session.get(Account, account_id) if account_id else None
    
    return DashboardResponse(
        total_potential_savings_annual=round(total_annual, 2),
        total_potential_savings_monthly=round(total_monthly, 2),
        opportunities_by_type=opportunities_by_type,
        opportunities=opportunity_responses,
        last_scan_at=account_info.last_scan_at if account_info else latest_scan.scan_completed_at,
        account_id=account_id,
        aws_account_id=account_info.aws_account_id if account_info else None,
        account_name=account_info.account_name if account_info else None,
        total_current_cost_monthly=round(total_current_cost, 2) if total_current_cost > 0 else None
    )


@app.get("/api/dashboard/export/{scan_id}")
async def export_scan_json(scan_id: int, session: Session = Depends(get_session)):
    """Export scan results as JSON."""
    scan_result = session.get(ScanResult, scan_id)
    if not scan_result:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    opportunities = session.exec(
        select(SavingsOpportunity).where(
            SavingsOpportunity.scan_result_id == scan_id
        )
    ).all()
    
    export_data = {
        'scan_id': scan_result.id,
        'scan_started_at': scan_result.scan_started_at.isoformat(),
        'scan_completed_at': scan_result.scan_completed_at.isoformat() if scan_result.scan_completed_at else None,
        'total_potential_savings_annual': scan_result.total_potential_savings,
        'opportunities': [
            {
                'type': opp.opportunity_type,
                'resource_id': opp.resource_id,
                'resource_type': opp.resource_type,
                'region': opp.region,
                'current_cost_monthly': opp.current_cost_monthly,
                'potential_savings_monthly': opp.potential_savings_monthly,
                'potential_savings_annual': opp.potential_savings_annual,
                'savings_percentage': opp.savings_percentage,
                'recommendation': opp.recommendation,
                'details': json.loads(opp.details) if opp.details else None
            }
            for opp in opportunities
        ]
    }
    
    return JSONResponse(content=export_data)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

