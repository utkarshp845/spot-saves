"""
User-friendly error messages for common issues.
"""

ERROR_MESSAGES = {
    "role_assumption_failed": {
        "title": "AWS Connection Failed",
        "message": "We couldn't connect to your AWS account. This usually means:",
        "details": [
            "The Role ARN or External ID might be incorrect",
            "The IAM role might not have the correct trust policy",
            "Your AWS account might have restrictions on role assumption",
            "The role might have been deleted or modified"
        ],
        "solutions": [
            "Double-check your Role ARN and External ID",
            "Verify the IAM role still exists in your AWS account",
            "Ensure the SpotSave account ID is allowed to assume the role",
            "Try recreating the role using our setup wizard"
        ]
    },
    "permissions_error": {
        "title": "Insufficient Permissions",
        "message": "The IAM role doesn't have the required read-only permissions.",
        "details": [
            "Missing read access to EC2, RDS, Lambda, or Cost Explorer",
            "Some required AWS managed policies might not be attached"
        ],
        "solutions": [
            "Verify all required policies are attached to the role",
            "Check the CloudFormation template or setup script includes all policies",
            "Ensure the role has Billing read access"
        ]
    },
    "scan_failed": {
        "title": "Scan Failed",
        "message": "The scan encountered an error while analyzing your AWS account.",
        "details": [
            "This could be due to API rate limiting",
            "Some AWS services might be temporarily unavailable",
            "Your account might have unusual resource configurations"
        ],
        "solutions": [
            "Wait a few minutes and try again",
            "Check your AWS service health dashboard",
            "Contact support if the issue persists"
        ]
    },
    "invalid_credentials": {
        "title": "Invalid Connection Details",
        "message": "The AWS connection details provided are invalid.",
        "details": [
            "Role ARN format might be incorrect",
            "External ID might be missing or wrong"
        ],
        "solutions": [
            "Check the Role ARN format: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME",
            "Verify the External ID matches what was generated during setup",
            "Use our setup wizard to generate new credentials"
        ]
    },
    "account_not_found": {
        "title": "Account Not Found",
        "message": "The requested AWS account connection could not be found.",
        "details": [
            "The account might have been deleted",
            "You might not have access to this account"
        ],
        "solutions": [
            "Create a new AWS connection",
            "Verify you're using the correct account ID"
        ]
    },
    "scan_not_found": {
        "title": "Scan Not Found",
        "message": "The requested scan could not be found.",
        "details": [
            "The scan might have been deleted",
            "The scan ID might be incorrect"
        ],
        "solutions": [
            "Check the scan ID in the URL",
            "Start a new scan if this one no longer exists"
        ]
    }
}


def get_user_friendly_error(error_type: str, original_error: str = None) -> dict:
    """Get a user-friendly error message for common error types."""
    error_info = ERROR_MESSAGES.get(error_type, {
        "title": "An Error Occurred",
        "message": "Something went wrong. Please try again.",
        "details": [],
        "solutions": []
    })
    
    return {
        "error_type": error_type,
        "title": error_info["title"],
        "message": error_info["message"],
        "details": error_info.get("details", []),
        "solutions": error_info.get("solutions", []),
        "technical_details": original_error if original_error else None
    }


def parse_aws_error(error_message: str) -> str:
    """Parse AWS error messages to determine the error type."""
    error_lower = error_message.lower()
    
    if "unable to locate credentials" in error_lower or "invalid role" in error_lower:
        return "role_assumption_failed"
    elif "access denied" in error_lower or "unauthorized" in error_lower or "forbidden" in error_lower:
        return "permissions_error"
    elif "invalid" in error_lower and ("arn" in error_lower or "role" in error_lower):
        return "invalid_credentials"
    elif "not found" in error_lower and "account" in error_lower:
        return "account_not_found"
    elif "not found" in error_lower and "scan" in error_lower:
        return "scan_not_found"
    else:
        return "scan_failed"

