# SpotSave CloudFormation Setup

One-click AWS setup using CloudFormation - no command line required!

## Quick Setup (5 minutes)

### Method 1: AWS Console (Easiest - Recommended)

1. **Click this link to launch the CloudFormation stack:**
   ```
   https://console.aws.amazon.com/cloudformation/home?#/stacks/create/review?templateURL=https://spotsave.com/cloudformation/spotsave-role.yaml
   ```
   (Replace with your hosted template URL)

2. **Fill in the parameters:**
   - **SpotSaveAccountId**: Your SpotSave service account ID (required - get this from your SpotSave dashboard)
   - **ExternalId**: Leave empty (auto-generated) OR enter a custom value
   - **RoleName**: `SpotSaveRole` (or your preferred name)

3. **Click "Create Stack"**

4. **Wait 1-2 minutes for stack to complete**

5. **Copy the outputs:**
   - **Role ARN**: From the Outputs tab
   - **External ID**: From the Outputs tab

6. **Use in SpotSave**: Paste these values in the SpotSave dashboard

### Method 2: Upload Template

1. Go to AWS CloudFormation Console
2. Click "Create Stack" → "With new resources"
3. Choose "Upload a template file"
4. Upload `spotsave-role.yaml`
5. Fill parameters and create

### Method 3: AWS CLI (Advanced)

```bash
aws cloudformation create-stack \
  --stack-name spotsave-role \
  --template-body file://spotsave-role.yaml \
  --parameters \
    ParameterKey=SpotSaveAccountId,ParameterValue=YOUR_SPOTSAVE_ACCOUNT_ID \
    ParameterKey=RoleName,ParameterValue=SpotSaveRole
```

**Note:** Replace `YOUR_SPOTSAVE_ACCOUNT_ID` with your actual SpotSave service account ID from your dashboard.

Then get outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name spotsave-role \
  --query 'Stacks[0].Outputs'
```

## What This Creates

- ✅ IAM Role with read-only permissions
- ✅ External ID for secure access
- ✅ All required policies attached
- ✅ Ready to use in SpotSave

## Security

- Read-only access only
- External ID prevents unauthorized access
- All actions logged in CloudTrail
- You can delete the stack anytime to revoke access

## Troubleshooting

**Stack creation fails:**
- Check you have IAM permissions to create roles
- Verify the SpotSave Account ID is correct

**Can't find outputs:**
- Wait for stack to reach CREATE_COMPLETE status
- Check the Outputs tab in CloudFormation console

