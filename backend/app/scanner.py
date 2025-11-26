"""AWS cost optimization scanner."""
import boto3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from botocore.exceptions import ClientError


class AWSScanner:
    """Scans AWS account for cost optimization opportunities."""
    
    def __init__(self, role_arn: str, external_id: str, region: str = "us-east-1"):
        """Initialize scanner with AWS role assumption."""
        self.role_arn = role_arn
        self.external_id = external_id
        self.region = region
        self.session = None
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
    
    def scan_account(self) -> Dict[str, Any]:
        """Perform full account scan for cost savings."""
        results = {
            'opportunities': [],
            'total_savings_annual': 0.0,
            'total_savings_monthly': 0.0,
            'scan_timestamp': datetime.utcnow().isoformat()
        }
        
        # Run all scan types
        ri_sp_opps = self._scan_reserved_instances()
        rightsizing_opps = self._scan_rightsizing()
        idle_opps = self._scan_idle_resources()
        graviton_opps = self._scan_graviton_migration()
        
        # Combine all opportunities
        all_opportunities = ri_sp_opps + rightsizing_opps + idle_opps + graviton_opps
        
        # Calculate totals
        results['opportunities'] = all_opportunities
        results['total_savings_monthly'] = sum(opp['potential_savings_monthly'] for opp in all_opportunities)
        results['total_savings_annual'] = results['total_savings_monthly'] * 12
        
        return results
    
    def _scan_reserved_instances(self) -> List[Dict[str, Any]]:
        """Scan for Reserved Instance and Savings Plan opportunities."""
        opportunities = []
        
        try:
            # Get current EC2 instances
            ec2 = self.session.client('ec2')
            pricing = self.session.client('pricing', region_name='us-east-1')  # Pricing API is only in us-east-1
            
            paginator = ec2.get_paginator('describe_instances')
            instances_by_region = {}
            
            for page in paginator.paginate():
                for reservation in page['Reservations']:
                    for instance in reservation['Instances']:
                        if instance['State']['Name'] == 'running':
                            region = instance['Placement']['AvailabilityZone'][:-1]  # Remove zone letter
                            if region not in instances_by_region:
                                instances_by_region[region] = []
                            instances_by_region[region].append(instance)
            
            # Check for RI/SP opportunities
            # Simplified: recommend RI for instances running 24/7
            for region, instances in instances_by_region.items():
                for instance in instances:
                    instance_type = instance['InstanceType']
                    instance_id = instance['InstanceId']
                    
                    # Estimate monthly cost (simplified - would use Pricing API in production)
                    # Standard pricing: ~$0.10/hour for t3.medium, scale accordingly
                    hourly_cost = self._estimate_hourly_cost(instance_type)
                    monthly_cost = hourly_cost * 730  # 730 hours per month
                    
                    # RI savings: ~30-40% discount
                    ri_monthly_cost = monthly_cost * 0.65  # 35% savings
                    monthly_savings = monthly_cost - ri_monthly_cost
                    
                    if monthly_savings > 10:  # Only recommend if savings > $10/month
                        opportunities.append({
                            'opportunity_type': 'ri_sp',
                            'resource_id': instance_id,
                            'resource_type': 'ec2-instance',
                            'region': region,
                            'current_cost_monthly': round(monthly_cost, 2),
                            'potential_savings_monthly': round(monthly_savings, 2),
                            'potential_savings_annual': round(monthly_savings * 12, 2),
                            'savings_percentage': 35.0,
                            'recommendation': f'Purchase Reserved Instance for {instance_type} in {region}. Save ~35% on compute costs.',
                            'details': json.dumps({
                                'instance_type': instance_type,
                                'platform': instance.get('Platform', 'linux/unix'),
                                'tenancy': instance.get('Placement', {}).get('Tenancy', 'default')
                            })
                        })
        
        except ClientError as e:
            print(f"Error scanning RI/SP opportunities: {str(e)}")
        
        return opportunities
    
    def _scan_rightsizing(self) -> List[Dict[str, Any]]:
        """Scan for rightsizing opportunities (downsizing over-provisioned instances)."""
        opportunities = []
        
        try:
            ec2 = self.session.client('ec2')
            cloudwatch = self.session.client('cloudwatch')
            
            paginator = ec2.get_paginator('describe_instances')
            
            for page in paginator.paginate():
                for reservation in page['Reservations']:
                    for instance in reservation['Instances']:
                        if instance['State']['Name'] == 'running':
                            instance_id = instance['InstanceId']
                            instance_type = instance['InstanceType']
                            
                            # Get CloudWatch metrics for last 30 days
                            try:
                                cpu_util = self._get_average_metric(
                                    cloudwatch, instance_id, 'CPUUtilization', 30
                                )
                                mem_util = self._get_average_metric(
                                    cloudwatch, instance_id, 'MemoryUtilization', 30
                                )
                                
                                # If low utilization, recommend downsizing
                                if cpu_util and mem_util and cpu_util < 20 and mem_util < 20:
                                    current_cost = self._estimate_hourly_cost(instance_type) * 730
                                    # Recommend one size smaller
                                    smaller_type = self._get_smaller_instance_type(instance_type)
                                    if smaller_type:
                                        smaller_cost = self._estimate_hourly_cost(smaller_type) * 730
                                        monthly_savings = current_cost - smaller_cost
                                        
                                        if monthly_savings > 5:
                                            opportunities.append({
                                                'opportunity_type': 'rightsizing',
                                                'resource_id': instance_id,
                                                'resource_type': 'ec2-instance',
                                                'region': instance['Placement']['AvailabilityZone'][:-1],
                                                'current_cost_monthly': round(current_cost, 2),
                                                'potential_savings_monthly': round(monthly_savings, 2),
                                                'potential_savings_annual': round(monthly_savings * 12, 2),
                                                'savings_percentage': round((monthly_savings / current_cost) * 100, 1),
                                                'recommendation': f'Downsize {instance_type} to {smaller_type}. Current utilization: CPU {cpu_util:.1f}%, Memory {mem_util:.1f}%',
                                                'details': json.dumps({
                                                    'current_instance_type': instance_type,
                                                    'recommended_instance_type': smaller_type,
                                                    'cpu_utilization': cpu_util,
                                                    'memory_utilization': mem_util
                                                })
                                            })
                            except Exception as e:
                                # Skip if metrics not available
                                continue
        
        except ClientError as e:
            print(f"Error scanning rightsizing opportunities: {str(e)}")
        
        return opportunities
    
    def _scan_idle_resources(self) -> List[Dict[str, Any]]:
        """Scan for idle resources (low utilization for extended period)."""
        opportunities = []
        
        try:
            ec2 = self.session.client('ec2')
            cloudwatch = self.session.client('cloudwatch')
            
            paginator = ec2.get_paginator('describe_instances')
            
            for page in paginator.paginate():
                for reservation in page['Reservations']:
                    for instance in reservation['Instances']:
                        if instance['State']['Name'] == 'running':
                            instance_id = instance['InstanceId']
                            instance_type = instance['InstanceType']
                            region = instance['Placement']['AvailabilityZone'][:-1]
                            
                            # Check if idle for 30+ days
                            try:
                                cpu_util = self._get_average_metric(
                                    cloudwatch, instance_id, 'CPUUtilization', 30
                                )
                                network_in = self._get_average_metric(
                                    cloudwatch, instance_id, 'NetworkIn', 30
                                )
                                
                                # Idle criteria: <5% CPU and low network activity
                                if cpu_util and cpu_util < 5 and network_in and network_in < 1000000:  # <1MB/s
                                    monthly_cost = self._estimate_hourly_cost(instance_type) * 730
                                    
                                    opportunities.append({
                                        'opportunity_type': 'idle',
                                        'resource_id': instance_id,
                                        'resource_type': 'ec2-instance',
                                        'region': region,
                                        'current_cost_monthly': round(monthly_cost, 2),
                                        'potential_savings_monthly': round(monthly_cost, 2),  # Full cost if terminated
                                        'potential_savings_annual': round(monthly_cost * 12, 2),
                                        'savings_percentage': 100.0,
                                        'recommendation': f'Instance appears idle (CPU: {cpu_util:.1f}%). Consider terminating or stopping during non-business hours.',
                                        'details': json.dumps({
                                            'cpu_utilization': cpu_util,
                                            'network_in_bytes': network_in
                                        })
                                    })
                            except Exception:
                                continue
        
        except ClientError as e:
            print(f"Error scanning idle resources: {str(e)}")
        
        return opportunities
    
    def _scan_graviton_migration(self) -> List[Dict[str, Any]]:
        """Scan for Graviton (ARM) migration opportunities."""
        opportunities = []
        
        try:
            ec2 = self.session.client('ec2')
            
            # Graviton-compatible instance families
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
                            
                            # Check if instance family supports Graviton
                            family = instance_type.split('.')[0]
                            if family in graviton_families and 'arm64' not in str(instance.get('Architecture', 'x86_64')):
                                current_cost = self._estimate_hourly_cost(instance_type) * 730
                                
                                # Graviton instances are ~20% cheaper
                                graviton_savings = current_cost * 0.20
                                
                                graviton_family = graviton_families[family]
                                size = instance_type.split('.')[1] if '.' in instance_type else 'medium'
                                graviton_type = f"{graviton_family}.{size}"
                                
                                opportunities.append({
                                    'opportunity_type': 'graviton',
                                    'resource_id': instance_id,
                                    'resource_type': 'ec2-instance',
                                    'region': region,
                                    'current_cost_monthly': round(current_cost, 2),
                                    'potential_savings_monthly': round(graviton_savings, 2),
                                    'potential_savings_annual': round(graviton_savings * 12, 2),
                                    'savings_percentage': 20.0,
                                    'recommendation': f'Migrate {instance_type} to {graviton_type} (Graviton/ARM). Save ~20% with better price-performance.',
                                    'details': json.dumps({
                                        'current_instance_type': instance_type,
                                        'recommended_instance_type': graviton_type,
                                        'architecture': 'arm64'
                                    })
                                })
        
        except ClientError as e:
            print(f"Error scanning Graviton opportunities: {str(e)}")
        
        return opportunities
    
    def _get_average_metric(self, cloudwatch, resource_id: str, metric_name: str, days: int) -> Optional[float]:
        """Get average CloudWatch metric value over specified days."""
        try:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(days=days)
            
            response = cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName=metric_name,
                Dimensions=[
                    {'Name': 'InstanceId', 'Value': resource_id}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=86400,  # 1 day periods
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
        """Estimate hourly cost for an instance type (simplified)."""
        # Simplified pricing - in production, use AWS Pricing API
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
            
            # Adjust for instance family (m5, c5, r5 are premium)
            if family in ['m5', 'c5', 'r5', 'm7g', 'c7g', 'r7g']:
                base_cost *= 1.2
            
            return base_cost
        
        return 0.08  # Default
    
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

