"""AWS cost optimization scanner with parallel processing and enhanced recommendations."""
import boto3
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Callable
from botocore.exceptions import ClientError


def extract_aws_account_id(role_arn: str) -> Optional[str]:
    """Extract AWS account ID from Role ARN.
    
    Format: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME
    """
    match = re.search(r'arn:aws:iam::(\d{12}):role/', role_arn)
    return match.group(1) if match else None


class AWSScanner:
    """Scans AWS account for cost optimization opportunities with parallel processing."""
    
    def __init__(self, role_arn: str, external_id: str, region: str = "us-east-1"):
        """Initialize scanner with AWS role assumption."""
        self.role_arn = role_arn
        self.external_id = external_id
        self.region = region
        self.session = None
        self.aws_account_id = extract_aws_account_id(role_arn)
        self._assume_role()
    
    def _assume_role(self) -> None:
        """Assume the customer's AWS role."""
        sts_client = boto3.client('sts')
        try:
            response = sts_client.assume_role(
                RoleArn=self.role_arn,
                RoleSessionName='SpotSaveScan',
                ExternalId=self.external_id,
                DurationSeconds=3600
            )
            credentials = response['Credentials']
            self.session = boto3.Session(
                aws_access_key_id=credentials['AccessKeyId'],
                aws_secret_access_key=credentials['SecretAccessKey'],
                aws_session_token=credentials['SessionToken'],
                region_name=self.region
            )
        except ClientError as e:
            raise Exception(f"Failed to assume role: {str(e)}")
    
    def _get_session_for_region(self, region: str) -> boto3.Session:
        """Get boto3 session for a specific region."""
        credentials = self.session.get_credentials()
        return boto3.Session(
            aws_access_key_id=credentials.access_key,
            aws_secret_access_key=credentials.secret_key,
            aws_session_token=credentials.token,
            region_name=region
        )
    
    def scan_account(self) -> Dict[str, Any]:
        """Perform full account scan for cost savings."""
        results = {
            'opportunities': [],
            'total_savings_annual': 0.0,
            'total_savings_monthly': 0.0,
            'scan_timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        # Run all scan types in parallel
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                executor.submit(self._scan_reserved_instances): 'ri_sp',
                executor.submit(self._scan_rightsizing): 'rightsizing',
                executor.submit(self._scan_idle_resources): 'idle',
                executor.submit(self._scan_graviton_migration): 'graviton'
            }
            
            for future in as_completed(futures):
                try:
                    opportunities = future.result()
                    results['opportunities'].extend(opportunities)
                except Exception as e:
                    print(f"Error in scan type {futures[future]}: {str(e)}")
        
        # Calculate totals
        results['total_savings_monthly'] = sum(opp['potential_savings_monthly'] for opp in results['opportunities'])
        results['total_savings_annual'] = results['total_savings_monthly'] * 12
        
        return results
    
    def scan_account_progressive(self, save_callback: Callable[[Dict[str, Any]], None]) -> Dict[str, Any]:
        """Perform full account scan with progressive saving via callback."""
        results = {
            'opportunities': [],
            'total_savings_annual': 0.0,
            'total_savings_monthly': 0.0,
            'scan_timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        # Run all scan types and save opportunities as found
        # Use thread pool for parallel execution
        scan_functions = [
            self._scan_reserved_instances,
            self._scan_rightsizing,
            self._scan_idle_resources,
            self._scan_graviton_migration
        ]
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(func) for func in scan_functions]
            
            for future in as_completed(futures):
                try:
                    opportunities = future.result()
                    for opp in opportunities:
                        save_callback(opp)
                        results['opportunities'].append(opp)
                except Exception as e:
                    print(f"Error in progressive scan: {str(e)}")
        
        # Calculate totals
        results['total_savings_monthly'] = sum(opp['potential_savings_monthly'] for opp in results['opportunities'])
        results['total_savings_annual'] = results['total_savings_monthly'] * 12
        
        return results
    
    def _scan_reserved_instances(self) -> List[Dict[str, Any]]:
        """Scan for Reserved Instance and Savings Plan opportunities."""
        opportunities = []
        
        try:
            ec2 = self.session.client('ec2')
            paginator = ec2.get_paginator('describe_instances')
            instances_by_region = {}
            
            for page in paginator.paginate():
                for reservation in page['Reservations']:
                    for instance in reservation['Instances']:
                        if instance['State']['Name'] == 'running':
                            region = instance['Placement']['AvailabilityZone'][:-1]
                            if region not in instances_by_region:
                                instances_by_region[region] = []
                            instances_by_region[region].append(instance)
            
            for region, instances in instances_by_region.items():
                for instance in instances:
                    instance_type = instance['InstanceType']
                    instance_id = instance['InstanceId']
                    
                    hourly_cost = self._estimate_hourly_cost(instance_type)
                    monthly_cost = hourly_cost * 730
                    ri_monthly_cost = monthly_cost * 0.65  # 35% savings
                    monthly_savings = monthly_cost - ri_monthly_cost
                    
                    if monthly_savings > 10:
                        platform = instance.get('Platform', 'linux/unix')
                        tenancy = instance.get('Placement', {}).get('Tenancy', 'default')
                        
                        # Enhanced recommendation with action steps
                        action_steps = [
                            "Navigate to EC2 Reserved Instances console",
                            f"Select instance type: {instance_type}",
                            f"Choose region: {region}",
                            "Select 1-year term for maximum savings (35% discount)",
                            "Review and complete purchase"
                        ]
                        
                        opportunities.append({
                            'opportunity_type': 'ri_sp',
                            'resource_id': instance_id,
                            'resource_type': 'ec2-instance',
                            'region': region,
                            'current_cost_monthly': round(monthly_cost, 2),
                            'potential_savings_monthly': round(monthly_savings, 2),
                            'potential_savings_annual': round(monthly_savings * 12, 2),
                            'savings_percentage': 35.0,
                            'recommendation': f'Purchase Reserved Instance for {instance_type} in {region}. Save ${monthly_savings:.2f}/month (~35%) on compute costs.',
                            'action_steps': json.dumps(action_steps),
                            'implementation_time_hours': 0.5,
                            'risk_level': 'low',
                            'prerequisites': json.dumps(['Instance must run 24/7', 'Predictable workload', '1-year commitment']),
                            'expected_savings_timeline': 'immediate',
                            'rollback_plan': 'Can sell on Reserved Instance Marketplace if workload changes',
                            'details': json.dumps({
                                'instance_type': instance_type,
                                'platform': platform,
                                'tenancy': tenancy,
                                'aws_console_url': f'https://console.aws.amazon.com/ec2/v2/home?region={region}#ReservedInstances:'
                            })
                        })
        
        except ClientError as e:
            print(f"Error scanning RI/SP opportunities: {str(e)}")
        
        return opportunities
    
    def _scan_rightsizing(self) -> List[Dict[str, Any]]:
        """Scan for rightsizing opportunities with batched CloudWatch queries."""
        opportunities = []
        
        try:
            ec2 = self.session.client('ec2')
            cloudwatch = self.session.client('cloudwatch')
            
            # Collect all instances first
            all_instances = []
            paginator = ec2.get_paginator('describe_instances')
            
            for page in paginator.paginate():
                for reservation in page['Reservations']:
                    for instance in reservation['Instances']:
                        if instance['State']['Name'] == 'running':
                            all_instances.append(instance)
            
            # Batch CloudWatch metric queries
            metric_queries = self._batch_get_metrics(cloudwatch, all_instances)
            
            for instance in all_instances:
                instance_id = instance['InstanceId']
                instance_type = instance['InstanceType']
                region = instance['Placement']['AvailabilityZone'][:-1]
                
                cpu_util = metric_queries.get(f"{instance_id}_cpu")
                mem_util = metric_queries.get(f"{instance_id}_mem")
                
                if cpu_util and mem_util and cpu_util < 20 and mem_util < 20:
                    current_cost = self._estimate_hourly_cost(instance_type) * 730
                    smaller_type = self._get_smaller_instance_type(instance_type)
                    
                    if smaller_type:
                        smaller_cost = self._estimate_hourly_cost(smaller_type) * 730
                        monthly_savings = current_cost - smaller_cost
                        
                        if monthly_savings > 5:
                            action_steps = [
                                f"Stop instance {instance_id} (create AMI first for backup)",
                                f"Launch new {smaller_type} instance from AMI",
                                "Update DNS/load balancer to point to new instance",
                                "Test application functionality",
                                "Terminate old instance after validation"
                            ]
                            
                            opportunities.append({
                                'opportunity_type': 'rightsizing',
                                'resource_id': instance_id,
                                'resource_type': 'ec2-instance',
                                'region': region,
                                'current_cost_monthly': round(current_cost, 2),
                                'potential_savings_monthly': round(monthly_savings, 2),
                                'potential_savings_annual': round(monthly_savings * 12, 2),
                                'savings_percentage': round((monthly_savings / current_cost) * 100, 1),
                                'recommendation': f'Downsize {instance_type} to {smaller_type}. Current utilization: CPU {cpu_util:.1f}%, Memory {mem_util:.1f}%. Estimated savings: ${monthly_savings:.2f}/month.',
                                'action_steps': json.dumps(action_steps),
                                'implementation_time_hours': 2.0,
                                'risk_level': 'medium',
                                'prerequisites': json.dumps(['Instance must support downtime or use blue-green deployment', 'AMI backup required']),
                                'expected_savings_timeline': 'immediate',
                                'rollback_plan': f'Launch new {instance_type} from AMI and revert DNS/load balancer',
                                'details': json.dumps({
                                    'current_instance_type': instance_type,
                                    'recommended_instance_type': smaller_type,
                                    'cpu_utilization': cpu_util,
                                    'memory_utilization': mem_util,
                                    'aws_console_url': f'https://console.aws.amazon.com/ec2/v2/home?region={region}#Instances:instanceId={instance_id}'
                                })
                            })
        
        except ClientError as e:
            print(f"Error scanning rightsizing opportunities: {str(e)}")
        
        return opportunities
    
    def _scan_idle_resources(self) -> List[Dict[str, Any]]:
        """Scan for idle resources with batched CloudWatch queries."""
        opportunities = []
        
        try:
            ec2 = self.session.client('ec2')
            cloudwatch = self.session.client('cloudwatch')
            
            all_instances = []
            paginator = ec2.get_paginator('describe_instances')
            
            for page in paginator.paginate():
                for reservation in page['Reservations']:
                    for instance in reservation['Instances']:
                        if instance['State']['Name'] == 'running':
                            all_instances.append(instance)
            
            # Batch CloudWatch queries
            metric_queries = self._batch_get_idle_metrics(cloudwatch, all_instances)
            
            for instance in all_instances:
                instance_id = instance['InstanceId']
                instance_type = instance['InstanceType']
                region = instance['Placement']['AvailabilityZone'][:-1]
                
                cpu_util = metric_queries.get(f"{instance_id}_cpu")
                network_in = metric_queries.get(f"{instance_id}_network")
                
                if cpu_util and cpu_util < 5 and network_in and network_in < 1000000:
                    monthly_cost = self._estimate_hourly_cost(instance_type) * 730
                    
                    action_steps = [
                        f"Verify instance {instance_id} is truly idle (check logs, monitoring)",
                        "Stop instance (don't terminate yet) to test impact",
                        "Monitor for 7 days to ensure no issues",
                        "If safe, create snapshot and terminate instance",
                        "Update infrastructure documentation"
                    ]
                    
                    opportunities.append({
                        'opportunity_type': 'idle',
                        'resource_id': instance_id,
                        'resource_type': 'ec2-instance',
                        'region': region,
                        'current_cost_monthly': round(monthly_cost, 2),
                        'potential_savings_monthly': round(monthly_cost, 2),
                        'potential_savings_annual': round(monthly_cost * 12, 2),
                        'savings_percentage': 100.0,
                        'recommendation': f'Instance {instance_id} appears idle (CPU: {cpu_util:.1f}%, Network: {network_in/1024/1024:.2f} MB/s). Consider stopping or terminating to save ${monthly_cost:.2f}/month.',
                        'action_steps': json.dumps(action_steps),
                        'implementation_time_hours': 1.0,
                        'risk_level': 'medium',
                        'prerequisites': json.dumps(['Verify instance is not needed', 'Check for dependencies', 'Review backup requirements']),
                        'expected_savings_timeline': 'immediate',
                        'rollback_plan': 'Launch from snapshot if needed',
                        'details': json.dumps({
                            'cpu_utilization': cpu_util,
                            'network_in_bytes': network_in,
                            'aws_console_url': f'https://console.aws.amazon.com/ec2/v2/home?region={region}#Instances:instanceId={instance_id}'
                        })
                    })
        
        except ClientError as e:
            print(f"Error scanning idle resources: {str(e)}")
        
        return opportunities
    
    def _scan_graviton_migration(self) -> List[Dict[str, Any]]:
        """Scan for Graviton (ARM) migration opportunities."""
        opportunities = []
        
        try:
            ec2 = self.session.client('ec2')
            
            graviton_families = {
                't3': 't4g',
                't3a': 't4g',
                'm5': 'm7g',
                'm5a': 'm7g',
                'm5n': 'm7g',
                'c5': 'c7g',
                'c5a': 'c7g',
                'c5n': 'c7g',
                'r5': 'r7g',
                'r5a': 'r7g',
                'r5n': 'r7g'
            }
            
            paginator = ec2.get_paginator('describe_instances')
            
            for page in paginator.paginate():
                for reservation in page['Reservations']:
                    for instance in reservation['Instances']:
                        if instance['State']['Name'] == 'running':
                            instance_type = instance['InstanceType']
                            instance_id = instance['InstanceId']
                            region = instance['Placement']['AvailabilityZone'][:-1]
                            
                            family = instance_type.split('.')[0]
                            if family in graviton_families and 'arm64' not in str(instance.get('Architecture', 'x86_64')):
                                current_cost = self._estimate_hourly_cost(instance_type) * 730
                                graviton_savings = current_cost * 0.20
                                
                                graviton_family = graviton_families[family]
                                size = instance_type.split('.')[1] if '.' in instance_type else 'medium'
                                graviton_type = f"{graviton_family}.{size}"
                                
                                action_steps = [
                                    "Verify application compatibility with ARM64 (check dependencies)",
                                    "Test application on Graviton instance in staging",
                                    "Update AMI/build process if needed",
                                    f"Launch new {graviton_type} instance",
                                    "Perform blue-green deployment or gradual migration",
                                    "Monitor performance and costs",
                                    "Terminate old instance after validation"
                                ]
                                
                                opportunities.append({
                                    'opportunity_type': 'graviton',
                                    'resource_id': instance_id,
                                    'resource_type': 'ec2-instance',
                                    'region': region,
                                    'current_cost_monthly': round(current_cost, 2),
                                    'potential_savings_monthly': round(graviton_savings, 2),
                                    'potential_savings_annual': round(graviton_savings * 12, 2),
                                    'savings_percentage': 20.0,
                                    'recommendation': f'Migrate {instance_type} to {graviton_type} (Graviton/ARM). Save ${graviton_savings:.2f}/month (~20%) with better price-performance.',
                                    'action_steps': json.dumps(action_steps),
                                    'implementation_time_hours': 4.0,
                                    'risk_level': 'medium',
                                    'prerequisites': json.dumps(['ARM64-compatible application', 'Testing environment', 'Blue-green deployment capability']),
                                    'expected_savings_timeline': '1-month',
                                    'rollback_plan': 'Revert to original instance type if performance issues occur',
                                    'details': json.dumps({
                                        'current_instance_type': instance_type,
                                        'recommended_instance_type': graviton_type,
                                        'architecture': 'arm64',
                                        'aws_console_url': f'https://console.aws.amazon.com/ec2/v2/home?region={region}#Instances:instanceId={instance_id}'
                                    })
                                })
        
        except ClientError as e:
            print(f"Error scanning Graviton opportunities: {str(e)}")
        
        return opportunities
    
    def _batch_get_metrics(self, cloudwatch, instances: List[Dict]) -> Dict[str, float]:
        """Batch get CloudWatch metrics for multiple instances."""
        results = {}
        
        if not instances:
            return results
        
        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(days=30)
            
            # Build metric queries for batch
            metric_data_queries = []
            
            for idx, instance in enumerate(instances):
                instance_id = instance['InstanceId']
                
                # CPU metric
                metric_data_queries.append({
                    'Id': f'cpu_{idx}',
                    'MetricStat': {
                        'Metric': {
                            'Namespace': 'AWS/EC2',
                            'MetricName': 'CPUUtilization',
                            'Dimensions': [{'Name': 'InstanceId', 'Value': instance_id}]
                        },
                        'Period': 86400,
                        'Stat': 'Average'
                    }
                })
                
                # Memory metric
                metric_data_queries.append({
                    'Id': f'mem_{idx}',
                    'MetricStat': {
                        'Metric': {
                            'Namespace': 'AWS/EC2',
                            'MetricName': 'MemoryUtilization',
                            'Dimensions': [{'Name': 'InstanceId', 'Value': instance_id}]
                        },
                        'Period': 86400,
                        'Stat': 'Average'
                    }
                })
            
            # Split into batches of 500 (CloudWatch limit)
            batch_size = 500
            for i in range(0, len(metric_data_queries), batch_size):
                batch = metric_data_queries[i:i+batch_size]
                
                response = cloudwatch.get_metric_data(
                    MetricDataQueries=batch,
                    StartTime=start_time,
                    EndTime=end_time
                )
                
                for result in response.get('MetricDataResults', []):
                    query_id = result['Id']
                    values = result.get('Values', [])
                    
                    if values:
                        avg_value = sum(values) / len(values)
                        # Extract instance index and metric type
                        parts = query_id.split('_')
                        if len(parts) == 2:
                            metric_type, idx_str = parts
                            idx = int(idx_str)
                            if idx < len(instances):
                                instance_id = instances[idx]['InstanceId']
                                key = f"{instance_id}_{metric_type}"
                                results[key] = avg_value
        except Exception as e:
            print(f"Error batching metrics: {str(e)}")
        
        return results
    
    def _batch_get_idle_metrics(self, cloudwatch, instances: List[Dict]) -> Dict[str, float]:
        """Batch get idle-related CloudWatch metrics."""
        results = {}
        
        if not instances:
            return results
        
        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(days=30)
            
            metric_data_queries = []
            
            for idx, instance in enumerate(instances):
                instance_id = instance['InstanceId']
                
                # CPU metric
                metric_data_queries.append({
                    'Id': f'cpu_{idx}',
                    'MetricStat': {
                        'Metric': {
                            'Namespace': 'AWS/EC2',
                            'MetricName': 'CPUUtilization',
                            'Dimensions': [{'Name': 'InstanceId', 'Value': instance_id}]
                        },
                        'Period': 86400,
                        'Stat': 'Average'
                    }
                })
                
                # Network metric
                metric_data_queries.append({
                    'Id': f'net_{idx}',
                    'MetricStat': {
                        'Metric': {
                            'Namespace': 'AWS/EC2',
                            'MetricName': 'NetworkIn',
                            'Dimensions': [{'Name': 'InstanceId', 'Value': instance_id}]
                        },
                        'Period': 86400,
                        'Stat': 'Average'
                    }
                })
            
            # Process in batches
            batch_size = 500
            for i in range(0, len(metric_data_queries), batch_size):
                batch = metric_data_queries[i:i+batch_size]
                
                response = cloudwatch.get_metric_data(
                    MetricDataQueries=batch,
                    StartTime=start_time,
                    EndTime=end_time
                )
                
                for result in response.get('MetricDataResults', []):
                    query_id = result['Id']
                    values = result.get('Values', [])
                    
                    if values:
                        avg_value = sum(values) / len(values)
                        parts = query_id.split('_')
                        if len(parts) == 2:
                            metric_type, idx_str = parts
                            idx = int(idx_str)
                            if idx < len(instances):
                                instance_id = instances[idx]['InstanceId']
                                key = f"{instance_id}_{'network' if metric_type == 'net' else metric_type}"
                                results[key] = avg_value
        except Exception as e:
            print(f"Error batching idle metrics: {str(e)}")
        
        return results
    
    def _get_average_metric(self, cloudwatch, resource_id: str, metric_name: str, days: int) -> Optional[float]:
        """Get average CloudWatch metric value over specified days (legacy method, use batch)."""
        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(days=days)
            
            response = cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName=metric_name,
                Dimensions=[
                    {'Name': 'InstanceId', 'Value': resource_id}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=86400,
                Statistics=['Average']
            )
            
            datapoints = response.get('Datapoints', [])
            if datapoints:
                values = [dp['Average'] for dp in datapoints]
                return sum(values) / len(values)
        
        except Exception:
            pass
        
        return None
    
    def _estimate_hourly_cost(self, instance_type: str) -> float:
        """Estimate hourly cost for an instance type."""
        pricing_map = {
            'nano': 0.005,
            'micro': 0.01,
            'small': 0.02,
            'medium': 0.04,
            'large': 0.08,
            'xlarge': 0.16,
            '2xlarge': 0.32,
            '4xlarge': 0.64,
            '8xlarge': 1.28,
        }
        
        parts = instance_type.split('.')
        if len(parts) == 2:
            family, size = parts
            base_cost = pricing_map.get(size, 0.08)
            
            if family in ['m5', 'c5', 'r5', 'm7g', 'c7g', 'r7g']:
                base_cost *= 1.2
            
            return base_cost
        
        return 0.08
    
    def _get_smaller_instance_type(self, instance_type: str) -> Optional[str]:
        """Get the next smaller instance type."""
        size_order = ['nano', 'micro', 'small', 'medium', 'large', 'xlarge', '2xlarge', '4xlarge', '8xlarge']
        
        parts = instance_type.split('.')
        if len(parts) == 2:
            family, size = parts
            try:
                current_idx = size_order.index(size)
                if current_idx > 0:
                    return f"{family}.{size_order[current_idx - 1]}"
            except ValueError:
                pass
        
        return None
