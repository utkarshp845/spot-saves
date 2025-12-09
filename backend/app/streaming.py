"""
Streaming support for real-time scan progress updates.
"""
import json
from typing import AsyncGenerator, Dict, Any
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from app.database import engine
from app.models import ScanResult, SavingsOpportunity


async def scan_progress_stream(scan_id: int) -> AsyncGenerator[str, None]:
    """Stream scan progress updates via Server-Sent Events."""
    session = Session(engine)
    
    try:
        scan_result = session.get(ScanResult, scan_id)
        if not scan_result:
            yield f"data: {json.dumps({'error': 'Scan not found'})}\n\n"
            return
        
        # Stream initial status
        yield f"data: {json.dumps({
            'scan_id': scan_id,
            'status': scan_result.status,
            'progress': 0,
            'opportunities_found': 0,
            'total_savings': 0.0
        })}\n\n"
        
        last_count = 0
        last_status = scan_result.status
        
        # Poll for updates
        while True:
            # Refresh from database
            session.refresh(scan_result)
            
            # Count opportunities found so far
            statement = select(SavingsOpportunity).where(
                SavingsOpportunity.scan_result_id == scan_id
            )
            opportunities = session.exec(statement).all()
            opportunity_count = len(opportunities)
            
            # Calculate current savings
            total_savings = sum(opp.potential_savings_annual for opp in opportunities)
            
            # Calculate progress based on status and opportunities
            if scan_result.status == "completed":
                progress = 100
            elif scan_result.status == "failed":
                progress = 0
            else:
                # Estimate progress based on opportunities found
                # This is a rough estimate - in real implementation, you'd track actual progress
                progress = min(opportunity_count * 5, 95)  # Rough estimate
            
            # Send update if something changed
            if (opportunity_count != last_count or 
                scan_result.status != last_status or
                progress == 100):
                
                yield f"data: {json.dumps({
                    'scan_id': scan_id,
                    'status': scan_result.status,
                    'progress': progress,
                    'opportunities_found': opportunity_count,
                    'total_savings': total_savings,
                    'recent_opportunities': [
                        {
                            'id': opp.id,
                            'type': opp.opportunity_type,
                            'resource_id': opp.resource_id,
                            'savings_annual': opp.potential_savings_annual,
                            'recommendation': opp.recommendation
                        }
                        for opp in opportunities[-5:]  # Last 5 opportunities
                    ]
                })}\n\n"
                
                last_count = opportunity_count
                last_status = scan_result.status
                
                # Stop if completed or failed
                if scan_result.status in ["completed", "failed"]:
                    break
            
            # Small delay to avoid hammering the database
            import asyncio
            await asyncio.sleep(1)
    
    finally:
        session.close()


def create_sse_response(scan_id: int) -> StreamingResponse:
    """Create an SSE response for scan progress."""
    return StreamingResponse(
        scan_progress_stream(scan_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable buffering in nginx
        }
    )

