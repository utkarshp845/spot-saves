#!/bin/bash
# SpotSave Quick Setup Script for AWS CloudShell
# Copy and paste this entire script into AWS CloudShell

set -e

echo "🚀 SpotSave AWS Setup - CloudShell Edition"
echo "=========================================="
echo ""

# Generate random external ID
EXTERNAL_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

# SpotSave Account ID - REQUIRED: Replace with your SpotSave service account ID
# Get this from your SpotSave dashboard or contact SpotSave support
SPOTSAVE_ACCOUNT_ID=""  # TODO: Replace with your SpotSave account ID
ROLE_NAME="SpotSaveRole"

# Validate that account ID is set
if [ -z "$SPOTSAVE_ACCOUNT_ID" ]; then
  echo "❌ ERROR: SPOTSAVE_ACCOUNT_ID is not set!"
  echo "Please set SPOTSAVE_ACCOUNT_ID to your SpotSave service account ID"
  echo "You can find this in your SpotSave dashboard or contact SpotSave support"
  exit 1
fi

echo "📋 Configuration:"
echo "  Role Name: $ROLE_NAME"
echo "  SpotSave Account ID: $SPOTSAVE_ACCOUNT_ID"
echo "  External ID: $EXTERNAL_ID"
echo ""

# Create trust policy
TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${SPOTSAVE_ACCOUNT_ID}:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "${EXTERNAL_ID}"
        }
      }
    }
  ]
}
EOF
)

echo "🔨 Creating IAM Role..."
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document "$TRUST_POLICY" \
  --tags Key=ManagedBy,Value=SpotSave Key=Purpose,Value=CostOptimizationScanning

echo "✅ Role created!"

# Attach managed policies
echo "📎 Attaching read-only policies..."
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/job-function/Billing"

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/AWSPriceListServiceFullAccess"

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/AmazonRDSReadOnlyAccess"

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/AWSLambda_ReadOnlyAccess"

echo "✅ Policies attached!"

# Create CloudWatch read policy
CLOUDWATCH_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:GetMetricData",
        "cloudwatch:DescribeAlarms"
      ],
      "Resource": "*"
    }
  ]
}
EOF
)

echo "📎 Creating CloudWatch read policy..."
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "SpotSaveCloudWatchRead" \
  --policy-document "$CLOUDWATCH_POLICY"

echo "✅ CloudWatch policy created!"

# Get Role ARN
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Setup Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Your SpotSave Connection Details:"
echo ""
echo "  Role ARN:"
echo "  $ROLE_ARN"
echo ""
echo "  External ID:"
echo "  $EXTERNAL_ID"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🎯 Next Steps:"
echo "  1. Copy the Role ARN and External ID above"
echo "  2. Go to your SpotSave dashboard"
echo "  3. Paste these values"
echo "  4. Start scanning for savings!"
echo ""
echo "⚠️  Keep the External ID secure - you'll need it for all scans."
echo ""

