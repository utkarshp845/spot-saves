# AWS Account Setup Guide for SpotSave

## Overview

SpotSave needs to assume a read-only IAM role in your AWS account to scan for cost savings. This guide walks you through the setup.

## What Information You Need to Provide

### 1. Your AWS Account ID
The AWS account where you want SpotSave to scan for savings.

**How to find it:**
```bash
# Option 1: AWS CLI
aws sts get-caller-identity --query Account --output text

# Option 2: AWS Console
# Top right corner of AWS Console shows your account ID
```

### 2. SpotSave Service Account ID
The AWS account ID that will assume the role (this could be your own account for local testing, or a separate SpotSave service account).

**For local testing, you can use your own account ID.**

### 3. AWS Credentials (for Terraform)
You'll need AWS credentials configured to create the IAM role in your account.

**Check if you have credentials:**
```bash
aws sts get-caller-identity
```

If this works, you're good! If not, configure credentials:
```bash
aws configure
# Or use environment variables, IAM roles, etc.
```

## Setup Options

### Option A: Local Testing (Same Account - Easiest)
Use your own AWS account for both the target account and the SpotSave service account.

**Pros:** Simple, works immediately  
**Cons:** Less realistic for production

### Option B: Separate SpotSave Account (Production-like)
Create a separate AWS account for SpotSave service.

**Pros:** More secure, production-ready  
**Cons:** Requires setting up a new AWS account

## Step-by-Step Setup

### Step 1: Gather Required Information

Run this command to get your AWS account ID:
```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Your AWS Account ID: $AWS_ACCOUNT_ID"
```

### Step 2: Configure Terraform

1. **Navigate to Terraform directory:**
   ```bash
   cd terraform-onboarding
   ```

2. **Create terraform.tfvars file:**
   ```bash
   cat > terraform.tfvars << EOF
   spotsave_account_id = "YOUR_AWS_ACCOUNT_ID"  # Same as your account for local testing
   role_name          = "SpotSaveRole"
   tags = {
     Environment = "development"
     ManagedBy   = "SpotSave"
   }
   EOF
   ```

   **Replace `YOUR_AWS_ACCOUNT_ID` with your actual account ID from Step 1.**

### Step 3: Run Terraform

```bash
# Initialize Terraform
terraform init

# Preview what will be created
terraform plan

# Apply (creates the IAM role)
terraform apply
```

### Step 4: Copy the Outputs

After `terraform apply` completes, you'll see:

```
Outputs:
role_arn = "arn:aws:iam::123456789012:role/SpotSaveRole"
external_id = "a1b2c3d4-e5f6-..."
```

**Save these values!** You'll need them for SpotSave.

### Step 5: Configure SpotSave to Use AWS Credentials

For local testing, SpotSave needs AWS credentials to assume the role. You have two options:

**Option 1: Use existing AWS credentials**
```bash
# Add to .env file
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

**Option 2: Use AWS CLI profile**
```bash
# Configure AWS profile
aws configure --profile spotsave

# Update docker-compose.yml to use the profile
```

### Step 6: Restart SpotSave with AWS Credentials

```bash
# Update .env with AWS credentials (if using Option 1)
# Then restart
docker compose down
docker compose up -d
```

### Step 7: Connect in SpotSave UI

1. Go to http://localhost:3000/scan
2. Enter:
   - **Role ARN**: From Terraform output (e.g., `arn:aws:iam::123456789012:role/SpotSaveRole`)
   - **External ID**: From Terraform output (e.g., `a1b2c3d4-e5f6-...`)
3. Click "Start Scan"

## Quick Setup Script

I'll create a helper script to make this easier - see `setup_aws.sh` below.

## Troubleshooting

### Error: "Unable to assume role"
- **Check:** External ID matches exactly (case-sensitive)
- **Check:** Role ARN is correct
- **Check:** AWS credentials are configured
- **Check:** Trust policy allows your account

### Error: "Access Denied" in Terraform
- **Check:** Your AWS credentials have IAM permissions
- **Required:** `iam:CreateRole`, `iam:AttachRolePolicy`, `iam:CreatePolicy`

### Error: "Invalid Principal"
- **Check:** SpotSave account ID in terraform.tfvars matches the account with credentials

## Security Notes

- The IAM role is **read-only** - SpotSave cannot modify or delete resources
- External ID prevents confused deputy attacks
- All role assumptions are logged in CloudTrail
- You can revoke access anytime by deleting the role

## Next Steps

After setup:
1. ✅ Verify connection in SpotSave UI
2. ✅ Run a test scan (may take 2-5 minutes)
3. ✅ Review results in dashboard
4. ✅ Export JSON if needed

