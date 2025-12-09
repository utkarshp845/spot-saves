# SpotSave AWS IAM Role Setup

This Terraform module creates a read-only IAM role in your AWS account that SpotSave can assume to scan for cost optimization opportunities.

## Prerequisites

- Terraform >= 1.0 installed
- AWS CLI configured with appropriate permissions
- AWS Account ID where SpotSave is hosted (provided during onboarding)

## Quick Start

1. **Get your SpotSave Account ID**
   - This is provided when you sign up for SpotSave
   - It's the AWS account ID where the SpotSave service runs

2. **Configure Terraform**
   ```bash
   cd terraform-onboarding
   ```

3. **Create a terraform.tfvars file**
   ```hcl
   spotsave_account_id = "123456789012"  # Your SpotSave service account ID
   role_name          = "SpotSaveRole"   # Optional: customize role name
   ```

4. **Initialize and Apply**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

5. **Copy the outputs**
   After `terraform apply` completes, you'll see:
   - `role_arn`: The ARN of the IAM role
   - `external_id`: A unique external ID (keep this secure!)

6. **Use in SpotSave**
   - Go to your SpotSave dashboard
   - Navigate to "Start Scan" or "Connect Account"
   - Paste the Role ARN and External ID
   - Start scanning!

## What This Module Creates

- **IAM Role**: A read-only role that SpotSave can assume
- **Trust Policy**: Allows only your SpotSave account ID to assume the role
- **External ID**: Additional security layer (required when assuming role)
- **Read-Only Policies**: Attaches AWS managed read-only policies for:
  - Cost Explorer / Billing
  - EC2 instances
  - CloudWatch metrics
  - RDS databases
  - ECS containers
  - Lambda functions
  - AWS Pricing API

## Security

- **Read-Only Access**: SpotSave can only read your AWS resources, never modify or delete
- **External ID**: Prevents confused deputy attacks
- **Least Privilege**: Only grants permissions needed for cost scanning
- **Audit Trail**: All role assumptions are logged in CloudTrail

## Customization

You can customize the role name and add tags:

```hcl
spotsave_account_id = "123456789012"
role_name          = "MyCustomSpotSaveRole"
tags = {
  Environment = "production"
  Team        = "devops"
}
```

## Troubleshooting

### Error: Access Denied
- Ensure your AWS credentials have `iam:CreateRole` and `iam:AttachRolePolicy` permissions
- Verify you're using the correct AWS region/account

### Error: Invalid Principal
- Double-check the `spotsave_account_id` is correct
- Contact SpotSave support if you're unsure of your account ID

### Role Assumption Fails
- Verify the External ID matches exactly (case-sensitive)
- Check CloudTrail logs for detailed error messages
- Ensure the trust policy allows your SpotSave account ID

## Support

For issues or questions:
- Check SpotSave documentation: https://docs.spotsave.com
- Contact support: support@spotsave.com

## License

This Terraform module is provided by SpotSave and follows AWS best practices for IAM role creation.

