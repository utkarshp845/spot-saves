import boto3
import json
import uuid
import urllib.request
from botocore.exceptions import ClientError

SUCCESS = "SUCCESS"
FAILED = "FAILED"

def send(event, context, status, data):
    try:
        body = {
            'Status': status,
            'Reason': f'See CloudWatch: {context.log_stream_name}',
            'PhysicalResourceId': context.log_stream_name,
            'StackId': event['StackId'],
            'RequestId': event['RequestId'],
            'LogicalResourceId': event['LogicalResourceId'],
            'Data': data
        }
        req = urllib.request.Request(
            event['ResponseURL'],
            data=json.dumps(body).encode('utf-8'),
            method='PUT',
            headers={'Content-Type': ''}
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"Failed to send response: {e}")
        raise

def lambda_handler(event, context):
    try:
        print(f"Event: {json.dumps(event)}")
        
        props = event['ResourceProperties']
        role_name = props['RoleName']
        account_id = props['SpotSaveAccountId']
        
        iam = boto3.client('iam')
        ssm = boto3.client('ssm')
        
        # Check if role exists
        try:
            role = iam.get_role(RoleName=role_name)
            role_arn = role['Role']['Arn']
            role_exists = True
            print(f"Role exists: {role_arn}")
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchEntity':
                role_exists = False
                print("Role does not exist")
            else:
                raise
        
        # Get or generate external ID
        external_id = props.get('ExternalId', '')
        if not external_id:
            param_name = f'/spotsave/{role_name}/external-id'
            try:
                param = ssm.get_parameter(Name=param_name)
                external_id = param['Parameter']['Value']
                print(f"Got external ID from SSM")
            except ClientError as e:
                if e.response['Error']['Code'] == 'ParameterNotFound':
                    external_id = str(uuid.uuid4())
                    print(f"Generated new external ID")
                else:
                    raise
        
        if event['RequestType'] == 'Delete':
            send(event, context, SUCCESS, {})
            return
        
        # Build assume role policy
        policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"AWS": f"arn:aws:iam::{account_id}:root"},
                "Action": "sts:AssumeRole"
            }]
        }
        if external_id:
            policy["Statement"][0]["Condition"] = {
                "StringEquals": {"sts:ExternalId": external_id}
            }
        
        # Create or update role
        if not role_exists:
            role = iam.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(policy)
            )
            role_arn = role['Role']['Arn']
            print(f"Created role: {role_arn}")
        else:
            iam.update_assume_role_policy(
                RoleName=role_name,
                PolicyDocument=json.dumps(policy)
            )
            print(f"Updated role: {role_name}")
        
        # Attach policies
        for policy_arn in props.get('ManagedPolicyArns', []):
            try:
                iam.attach_role_policy(RoleName=role_name, PolicyArn=policy_arn)
                print(f"Attached: {policy_arn}")
            except ClientError as e:
                if e.response['Error']['Code'] != 'EntityAlreadyExists':
                    print(f"Warning: {e}")
        
        # Inline policy
        if props.get('InlinePolicyName') and props.get('InlinePolicyDocument'):
            iam.put_role_policy(
                RoleName=role_name,
                PolicyName=props['InlinePolicyName'],
                PolicyDocument=json.dumps(props['InlinePolicyDocument'])
            )
            print("Updated inline policy")
        
        # Store external ID
        try:
            ssm.put_parameter(
                Name=f'/spotsave/{role_name}/external-id',
                Value=external_id,
                Type='String',
                Overwrite=True
            )
        except:
            pass
        
        send(event, context, SUCCESS, {
            'RoleArn': role_arn,
            'RoleName': role_name,
            'ExternalId': external_id
        })
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        print(traceback.format_exc())
        try:
            send(event, context, FAILED, {'Error': str(e)})
        except:
            raise

