# Automatic Deployment Setup - Quick Start Guide

## ✅ What's Been Done

1. **Deployed latest changes** - Images built and pushed, deployments triggered
2. **Created GitHub Actions workflow** - `.github/workflows/deploy-apprunner.yml`
3. **Added documentation** - `DEPLOYMENT_SETUP.md` with detailed instructions

## 🚀 Complete the Auto-Deployment Setup (5 minutes)

### Step 1: Add AWS Credentials to GitHub Secrets

1. Go to your GitHub repository: https://github.com/utkarshp845/spot-saves
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

   **Secret 1:**
   - Name: `AWS_ACCESS_KEY_ID`
   - Value: Your AWS access key ID
   
   **Secret 2:**
   - Name: `AWS_SECRET_ACCESS_KEY`
   - Value: Your AWS secret access key

### Step 2: Create IAM User with Required Permissions

The IAM user/role needs these permissions:

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

**Quick IAM Setup:**
1. Go to AWS IAM Console
2. Create a new user (e.g., `github-actions-deploy`)
3. Attach the policy above (or create a custom policy with these permissions)
4. Create access keys for this user
5. Use those keys in GitHub Secrets

### Step 3: Test the Workflow

After adding secrets, test it:

1. Make a small change and push to `main`:
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "Test auto-deployment"
   git push origin main
   ```

2. Check GitHub Actions:
   - Go to **Actions** tab in your repository
   - You should see "Deploy to AWS App Runner" workflow running
   - It will build images, push to ECR, and trigger App Runner deployments

3. Monitor in AWS:
   - App Runner Console: https://console.aws.amazon.com/apprunner
   - Both services should show new deployments

## 📋 How It Works

When you push to `main`:
1. ✅ GitHub Actions workflow triggers
2. ✅ Builds Docker images (frontend & backend)
3. ✅ Pushes images to ECR
4. ✅ Triggers App Runner deployments automatically
5. ✅ Waits for deployments to complete

## 🔍 Monitoring Deployments

- **GitHub**: Check the Actions tab for workflow status
- **AWS Console**: https://console.aws.amazon.com/apprunner
- **Service URLs**:
  - Frontend: https://pc35p58bek.us-east-1.awsapprunner.com
  - Backend: https://pqykjsmmab.us-east-1.awsapprunner.com

## 🛠️ Manual Deployment (if needed)

If you need to deploy manually:

```bash
./build-and-push.sh
```

Then trigger deployments:
```bash
aws apprunner start-deployment --service-arn 'arn:aws:apprunner:us-east-1:236763662741:service/spotsave-frontend/310522d22b874448957fc7f4daac044b'
aws apprunner start-deployment --service-arn 'arn:aws:apprunner:us-east-1:236763662741:service/spotsave-backend/2976eeac3e3545ca9c26afa89c225ec0'
```

## ❓ Troubleshooting

**Workflow fails on ECR push:**
- Check AWS credentials have ECR permissions
- Verify the IAM user has `ecr:*` permissions

**Deployment doesn't trigger:**
- Verify App Runner service ARNs are correct in the workflow file
- Check IAM permissions include `apprunner:StartDeployment`

**Images not updating:**
- Ensure you're pushing to `latest` tag (which App Runner uses)
- Check ECR repository exists and is accessible

## 📝 Next Steps

1. ✅ Add AWS credentials to GitHub Secrets (Step 1 above)
2. ✅ Create IAM user with permissions (Step 2 above)
3. ✅ Test with a small change (Step 3 above)
4. ✅ Enjoy automatic deployments! 🎉

Once set up, every push to `main` will automatically deploy to App Runner!

