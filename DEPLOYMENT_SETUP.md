# App Runner Auto-Deployment Setup

This guide explains how to set up automatic deployments from GitHub to AWS App Runner.

## Current Setup

Your App Runner services are configured to use ECR (Elastic Container Registry) images:
- **Frontend**: `spotsave-frontend:latest`
- **Backend**: `spotsave-backend:latest`

## Automatic Deployment via GitHub Actions

A GitHub Actions workflow (`.github/workflows/deploy-apprunner.yml`) has been created that will:
1. Build Docker images when you push to `main`
2. Push images to ECR
3. Trigger App Runner deployments automatically

### Setup Steps

1. **Add AWS Credentials to GitHub Secrets**
   
   Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret
   
   Add these secrets:
   - `AWS_ACCESS_KEY_ID` - Your AWS access key ID
   - `AWS_SECRET_ACCESS_KEY` - Your AWS secret access key
   
   **Important**: The IAM user/role must have permissions for:
   - `ecr:*` (to push images)
   - `apprunner:StartDeployment` (to trigger deployments)
   - `apprunner:DescribeService` (to check deployment status)

2. **Test the Workflow**
   
   After adding secrets, the workflow will automatically run on the next push to `main`.
   You can also manually trigger it:
   - Go to Actions tab in GitHub
   - Select "Deploy to AWS App Runner"
   - Click "Run workflow"

3. **Monitor Deployments**
   
   - GitHub Actions: Check the Actions tab for workflow runs
   - AWS Console: https://console.aws.amazon.com/apprunner
   - Service URLs:
     - Frontend: https://pc35p58bek.us-east-1.awsapprunner.com
     - Backend: https://pqykjsmmab.us-east-1.awsapprunner.com

## Manual Deployment (Alternative)

If you prefer manual deployments, you can use the provided scripts:

```bash
# Build and push images
./build-and-push.sh

# Then trigger deployments
aws apprunner start-deployment --service-arn <frontend-service-arn>
aws apprunner start-deployment --service-arn <backend-service-arn>
```

## IAM Permissions Required

Create an IAM policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "apprunner:StartDeployment",
        "apprunner:DescribeService"
      ],
      "Resource": [
        "arn:aws:apprunner:us-east-1:236763662741:service/spotsave-frontend/*",
        "arn:aws:apprunner:us-east-1:236763662741:service/spotsave-backend/*"
      ]
    }
  ]
}
```

## Troubleshooting

- **Workflow fails on ECR push**: Check that AWS credentials have ECR permissions
- **Deployment doesn't trigger**: Verify App Runner service ARNs are correct
- **Images not updating**: Ensure you're pushing to the `latest` tag that App Runner uses

