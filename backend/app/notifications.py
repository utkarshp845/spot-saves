"""
Email notification support for scan completion.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime


def send_scan_completion_email(
    email: str,
    scan_id: int,
    total_savings: float,
    opportunities_count: int,
    dashboard_url: Optional[str] = None
) -> bool:
    """
    Send email notification when scan completes.
    
    Returns True if sent successfully, False otherwise.
    """
    # Check if email is enabled
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM", smtp_user or "noreply@spotsave.com")
    
    if not smtp_host or not smtp_user or not smtp_password:
        # Email not configured, skip silently
        return False
    
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"SpotSave Scan Complete - ${total_savings:,.0f} Annual Savings Found!"
        msg["From"] = from_email
        msg["To"] = email
        
        # Build dashboard URL
        base_url = dashboard_url or os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
        dashboard_link = f"{base_url}/dashboard?scan_id={scan_id}"
        
        # Plain text version
        text = f"""
Your SpotSave scan has completed!

We found {opportunities_count} savings opportunities totaling ${total_savings:,.2f} in annual savings.

View your full results: {dashboard_link}

---
SpotSave - Find Hidden AWS Cost Savings
        """.strip()
        
        # HTML version
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .savings {{ font-size: 36px; font-weight: bold; color: #10b981; margin: 20px 0; }}
        .button {{ display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Scan Complete!</h1>
        </div>
        <div class="content">
            <p>Great news! Your SpotSave scan has finished analyzing your AWS account.</p>
            
            <div style="text-align: center;">
                <div class="savings">${total_savings:,.2f}</div>
                <p style="font-size: 18px; color: #6b7280;">Annual Potential Savings</p>
            </div>
            
            <p>We found <strong>{opportunities_count} savings opportunities</strong> across your infrastructure.</p>
            
            <p style="text-align: center;">
                <a href="{dashboard_link}" class="button">View Full Results</a>
            </p>
            
            <div class="footer">
                <p>SpotSave - Find Hidden AWS Cost Savings</p>
                <p>This email was sent because you requested scan notifications.</p>
            </div>
        </div>
    </div>
</body>
</html>
        """.strip()
        
        # Attach both versions
        msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))
        
        # Send email
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            if smtp_port == 587:
                server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        return True
    
    except Exception as e:
        print(f"Failed to send email notification: {e}")
        return False

