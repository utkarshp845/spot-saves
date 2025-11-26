#!/bin/bash
# SpotSave AWS Setup Helper Script
# Guides you through connecting SpotSave to your AWS account

set -e

echo "🔐 SpotSave AWS Account Setup"
echo "=============================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured."
    echo "   Run: aws configure"
    echo "   Or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
    exit 1
fi

# Get AWS account ID
echo "✅ AWS credentials found"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_USER_ARN=$(aws sts get-caller-identity --query Arn --output text)

echo ""
echo "Your AWS Account Information:"
echo "  Account ID: $AWS_ACCOUNT_ID"
echo "  User/Role:  $AWS_USER_ARN"
echo ""

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "⚠️  Terraform not found. You'll need to install it:"
    echo "   https://www.terraform.io/downloads"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Ask about setup type
echo ""
echo "Setup Type:"
echo "  1) Use my AWS account for SpotSave (local testing - easiest)"
echo "  2) Use a different AWS account for SpotSave (production-like)"
read -p "Choose option (1 or 2): " -n 1 -r
echo ""

if [[ $REPLY == "2" ]]; then
    read -p "Enter SpotSave AWS Account ID: " SPOTSAVE_ACCOUNT_ID
    if [ -z "$SPOTSAVE_ACCOUNT_ID" ]; then
        echo "❌ Account ID cannot be empty"
        exit 1
    fi
else
    SPOTSAVE_ACCOUNT_ID=$AWS_ACCOUNT_ID
    echo "✅ Using your account ($AWS_ACCOUNT_ID) for SpotSave"
fi

# Create terraform.tfvars
cd terraform-onboarding 2>/dev/null || {
    echo "❌ terraform-onboarding directory not found"
    exit 1
}

echo ""
echo "Creating terraform.tfvars..."
cat > terraform.tfvars << EOF
spotsave_account_id = "$SPOTSAVE_ACCOUNT_ID"
role_name          = "SpotSaveRole"
tags = {
  Environment = "development"
  ManagedBy   = "SpotSave"
  CreatedBy   = "setup_aws.sh"
}
EOF

echo "✅ Created terraform.tfvars"
echo ""

# Initialize Terraform
if command -v terraform &> /dev/null; then
    echo "Initializing Terraform..."
    terraform init
    
    echo ""
    echo "📋 Terraform Plan Preview:"
    echo "=========================="
    terraform plan
    
    echo ""
    read -p "Apply this configuration? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Applying Terraform configuration..."
        terraform apply -auto-approve
        
        echo ""
        echo "✅ IAM Role Created Successfully!"
        echo ""
        echo "📋 Connection Information:"
        echo "=========================="
        terraform output -json | python3 -c "
import json
import sys
data = json.load(sys.stdin)
print(f\"Role ARN:     {data['role_arn']['value']}\")
print(f\"External ID:  {data['external_id']['value']}\")
print()
print('⚠️  IMPORTANT: Save the External ID - you'll need it for SpotSave!')
" 2>/dev/null || terraform output
        
        echo ""
        echo "📝 Next Steps:"
        echo "=============="
        echo "1. Copy the Role ARN and External ID above"
        echo "2. Configure AWS credentials for SpotSave (see below)"
        echo "3. Go to http://localhost:3000/scan"
        echo "4. Paste the Role ARN and External ID"
        echo "5. Start your first scan!"
        echo ""
        echo "🔑 To configure AWS credentials for SpotSave:"
        echo "   Option 1: Add to .env file:"
        echo "     AWS_ACCESS_KEY_ID=your_key"
        echo "     AWS_SECRET_ACCESS_KEY=your_secret"
        echo ""
        echo "   Option 2: Use AWS CLI credentials (already configured)"
        echo ""
        echo "   Then restart: docker compose restart backend"
    else
        echo "Terraform apply cancelled."
    fi
else
    echo "⚠️  Terraform not installed. terraform.tfvars has been created."
    echo "   Install Terraform and run manually:"
    echo "     cd terraform-onboarding"
    echo "     terraform init"
    echo "     terraform plan"
    echo "     terraform apply"
fi

echo ""
echo "✅ Setup script completed!"

