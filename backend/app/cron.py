"""Cron job for scheduled AWS account scans."""
import os
import asyncio
import aiocron
import httpx
from datetime import datetime, timezone
from sqlmodel import Session, select, create_engine
from app.models import Account, ScanResult
from app.scanner import AWSScanner
import json


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./spotsave.db")
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


async def run_daily_scans():
    """Run scans for all active accounts."""
    print(f"[{datetime.now(timezone.utc)}] Starting daily scan job...")
    
    session = Session(engine)
    try:
        # Get all active accounts
        accounts = session.exec(
            select(Account).where(Account.is_active == True)
        ).all()
        
        if not accounts:
            print("No active accounts to scan")
            return
        
        print(f"Found {len(accounts)} active account(s) to scan")
        
        for account in accounts:
            try:
                print(f"Scanning account: {account.account_name} (Role: {account.role_arn})")
                
                # Trigger scan via API (or run directly)
                async with httpx.AsyncClient(timeout=300.0) as client:
                    response = await client.post(
                        f"{BACKEND_URL}/api/scan",
                        json={
                            "account_id": account.id,
                            "scan_type": "full"
                        }
                    )
                    if response.status_code == 200:
                        result = response.json()
                        print(f"Scan started for account {account.account_name}: Scan ID {result['scan_id']}")
                    else:
                        print(f"Failed to start scan for {account.account_name}: {response.text}")
            
            except Exception as e:
                print(f"Error scanning account {account.account_name}: {str(e)}")
    
    finally:
        session.close()
    
    print(f"[{datetime.now(timezone.utc)}] Daily scan job completed")


@aiocron.crontab(os.getenv("SCAN_SCHEDULE", "0 2 * * *"))
async def scheduled_scan():
    """Scheduled scan cron job."""
    await run_daily_scans()


async def main():
    """Main cron loop."""
    print(f"[{datetime.now(timezone.utc)}] SpotSave Cron started")
    print(f"Scan schedule: {os.getenv('SCAN_SCHEDULE', '0 2 * * *')}")
    
    # Run initial scan if requested (for testing)
    if os.getenv("RUN_IMMEDIATE", "false").lower() == "true":
        print("Running immediate scan (RUN_IMMEDIATE=true)...")
        await run_daily_scans()
    
    # Keep the script running
    print("Waiting for scheduled scans...")
    while True:
        await asyncio.sleep(3600)  # Sleep for 1 hour


if __name__ == "__main__":
    asyncio.run(main())

