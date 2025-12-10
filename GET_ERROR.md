# How to Get the Actual Lambda Error

## Option 1: AWS Console
1. Go to: https://console.aws.amazon.com/cloudwatch
2. Click "Log groups" in left sidebar
3. Find: `/aws/lambda/spotsave-role-test-RoleHandler`
4. Click on the most recent log stream
5. Look for lines with "ERROR" or "Traceback"
6. Copy the full error message

## Option 2: AWS CLI (in WSL)
```bash
aws logs tail /aws/lambda/spotsave-role-test-RoleHandler --since 30m --format short | grep -A 20 "ERROR\|Traceback\|Exception"
```

## Option 3: CloudFormation Console
1. Go to: https://console.aws.amazon.com/cloudformation
2. Click on your stack: `spotsave-role-test`
3. Click "Events" tab
4. Find the failed resource: `SpotSaveRole`
5. Click the link in the "Status reason" column
6. This will show the CloudWatch log stream

## What to Look For
- Syntax errors (IndentationError, SyntaxError)
- Import errors (ModuleNotFoundError)
- Runtime errors (KeyError, AttributeError)
- Permission errors (AccessDenied)

