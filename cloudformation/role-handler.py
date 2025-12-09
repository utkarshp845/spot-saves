import boto3
import json
import cfnresponse

iam = boto3.client('iam')

def lambda_handler(event, context):
    """
    CloudFormation custom resource handler for SpotSave IAM Role.
    Handles existing roles gracefully by checking if they exist first.
    """
    print(f"Received event: {json.dumps(event)}")
    
    request_type = event['RequestType']
    role_name = event['ResourceProperties']['RoleName']
    spotsave_account_id = event['ResourceProperties']['SpotSaveAccountId']
    external_id = event['ResourceProperties'].get('ExternalId', '')
    managed_policy_arns = event['ResourceProperties'].get('ManagedPolicyArns', [])
    inline_policy_name = event['ResourceProperties'].get('InlinePolicyName', '')
    inline_policy_document = event['ResourceProperties'].get('InlinePolicyDocument', {})
    tags = event['ResourceProperties'].get('Tags', [])
    
    response_data = {}
    
    try:
        # Check if role exists
        try:
            existing_role = iam.get_role(RoleName=role_name)
            role_exists = True
            role_arn = existing_role['Role']['Arn']
            print(f"Role {role_name} already exists: {role_arn}")
        except iam.exceptions.NoSuchEntityException:
            role_exists = False
            print(f"Role {role_name} does not exist, will create it")
        
        if request_type == 'Delete':
            # On delete, we don't delete the role (let user manage it)
            # Just return success
            print(f"Delete requested for role {role_name}, but role will be retained")
            cfnresponse.send(event, context, cfnresponse.SUCCESS, response_data)
            return
        
        if not role_exists:
            # Create the role
            print(f"Creating role {role_name}...")
            
            # Build assume role policy
            assume_role_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{spotsave_account_id}:root"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
            
            # Add external ID condition if provided
            if external_id:
                assume_role_policy["Statement"][0]["Condition"] = {
                    "StringEquals": {
                        "sts:ExternalId": external_id
                    }
                }
            
            # Create role
            create_role_response = iam.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(assume_role_policy),
                Tags=[{'Key': tag['Key'], 'Value': tag['Value']} for tag in tags] if tags else []
            )
            role_arn = create_role_response['Role']['Arn']
            print(f"Role created: {role_arn}")
        else:
            # Role exists - update assume role policy if needed
            print(f"Updating assume role policy for existing role {role_name}...")
            
            assume_role_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{spotsave_account_id}:root"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
            
            if external_id:
                assume_role_policy["Statement"][0]["Condition"] = {
                    "StringEquals": {
                        "sts:ExternalId": external_id
                    }
                }
            
            iam.update_assume_role_policy(
                RoleName=role_name,
                PolicyDocument=json.dumps(assume_role_policy)
            )
        
        # Attach managed policies (idempotent - safe to call multiple times)
        for policy_arn in managed_policy_arns:
            try:
                iam.attach_role_policy(
                    RoleName=role_name,
                    PolicyArn=policy_arn
                )
                print(f"Attached managed policy: {policy_arn}")
            except iam.exceptions.PolicyNotAttachableException as e:
                print(f"Warning: Could not attach policy {policy_arn}: {e}")
            except Exception as e:
                # Policy might already be attached, check and continue
                try:
                    attached_policies = iam.list_attached_role_policies(RoleName=role_name)
                    if policy_arn not in [p['PolicyArn'] for p in attached_policies['AttachedPolicies']]:
                        raise  # Re-raise if not attached
                    print(f"Policy {policy_arn} already attached")
                except:
                    print(f"Warning: Error attaching policy {policy_arn}: {e}")
        
        # Handle inline policy (check if exists first, then create or update)
        if inline_policy_name and inline_policy_document:
            try:
                # Try to get existing policy
                try:
                    existing_policy = iam.get_role_policy(
                        RoleName=role_name,
                        PolicyName=inline_policy_name
                    )
                    # Policy exists, update it
                    print(f"Updating existing inline policy: {inline_policy_name}")
                    iam.put_role_policy(
                        RoleName=role_name,
                        PolicyName=inline_policy_name,
                        PolicyDocument=json.dumps(inline_policy_document)
                    )
                except iam.exceptions.NoSuchEntityException:
                    # Policy doesn't exist, create it
                    print(f"Creating inline policy: {inline_policy_name}")
                    iam.put_role_policy(
                        RoleName=role_name,
                        PolicyName=inline_policy_name,
                        PolicyDocument=json.dumps(inline_policy_document)
                    )
            except Exception as e:
                print(f"Warning: Error handling inline policy {inline_policy_name}: {e}")
                # Don't fail the whole operation if policy update fails
        
        response_data['RoleArn'] = role_arn
        response_data['RoleName'] = role_name
        
        print(f"Success! Role ARN: {role_arn}")
        cfnresponse.send(event, context, cfnresponse.SUCCESS, response_data)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        response_data['Error'] = str(e)
        cfnresponse.send(event, context, cfnresponse.FAILED, response_data)

