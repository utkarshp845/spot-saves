"""FastAPI main application."""
import os
import json
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import Session, select

from app.database import engine, init_db, get_session, check_migrations
from app.models import Account, ScanResult, SavingsOpportunity
from app.schemas import (
    AccountCreate, AccountResponse, ScanRequest, ScanResponse,
    ScanStatusResponse, DashboardResponse, SavingsOpportunityResponse,
    HealthResponse
)
from app.scanner import AWSScanner


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("Initializing SpotSave backend...")
    init_db()
    yield
    # Shutdown
    print("Shutting down SpotSave backend...")


app = FastAPI(
    title="SpotSave API",
    description="AWS Cost Optimization Scanner",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check(session: Session = Depends(get_session)):
    """Health check endpoint."""
    try:
        # Test database connection
        session.exec(select(Account)).first()
        db_status = "connected"
    except Exception:
        db_status = "error"
    
    return HealthResponse(
        status="healthy",
        database=db_status,
        timestamp=datetime.utcnow()
    )


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
        if user_id:
            existing.user_id = user_id
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    
    # Create new account
    account = Account(
        account_name=account_data.account_name,
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
        account = Account(
            account_name=f"One-time scan {datetime.utcnow().isoformat()}",
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
        status="running"
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
        scan_request.scan_type
    )
    
    return ScanResponse(
        scan_id=scan_result.id,
        status="running",
        message="Scan started",
        scan_started_at=scan_result.scan_started_at
    )


async def run_scan(scan_id: int, role_arn: str, external_id: str, scan_type: str):
    """Background task to run the actual scan."""
    session = Session(engine)
    try:
        scan_result = session.get(ScanResult, scan_id)
        if not scan_result:
            return
        
        # Run scanner
        region = os.getenv("AWS_REGION", "us-east-1")
        scanner = AWSScanner(role_arn, external_id, region)
        
        if scan_type == "quick":
            # Quick scan - just RI/SP opportunities
            results = {
                'opportunities': scanner._scan_reserved_instances(),
                'total_savings_annual': 0.0,
                'total_savings_monthly': 0.0
            }
            results['total_savings_monthly'] = sum(
                opp['potential_savings_monthly'] for opp in results['opportunities']
            )
            results['total_savings_annual'] = results['total_savings_monthly'] * 12
        else:
            # Full scan
            results = scanner.scan_account()
        
        # Save results
        scan_result.status = "completed"
        scan_result.scan_completed_at = datetime.utcnow()
        scan_result.total_potential_savings = results['total_savings_annual']
        scan_result.raw_data = json.dumps(results)
        session.add(scan_result)
        
        # Save opportunities
        account = session.get(Account, scan_result.account_id)
        for opp_data in results['opportunities']:
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
                details=opp_data.get('details')
            )
            session.add(opportunity)
        
        # Update account last_scan_at
        if account:
            account.last_scan_at = datetime.utcnow()
            session.add(account)
        
        session.commit()
    
    except Exception as e:
        # Mark scan as failed
        scan_result = session.get(ScanResult, scan_id)
        if scan_result:
            scan_result.status = "failed"
            scan_result.error_message = str(e)
            scan_result.scan_completed_at = datetime.utcnow()
            session.add(scan_result)
            session.commit()
    finally:
        session.close()


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
        return DashboardResponse(
            total_potential_savings_annual=0.0,
            total_potential_savings_monthly=0.0,
            opportunities_by_type={},
            opportunities=[],
            last_scan_at=None,
            account_id=account_id
        )
    
    # Get all opportunities from this scan
    opportunities = session.exec(
        select(SavingsOpportunity).where(
            SavingsOpportunity.scan_result_id == latest_scan.id
        )
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
    
    return DashboardResponse(
        total_potential_savings_annual=round(total_annual, 2),
        total_potential_savings_monthly=round(total_monthly, 2),
        opportunities_by_type=opportunities_by_type,
        opportunities=[SavingsOpportunityResponse.from_orm(opp) for opp in opportunities],
        last_scan_at=account.last_scan_at if account else latest_scan.scan_completed_at,
        account_id=account_id
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

