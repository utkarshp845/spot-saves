# SpotSave AWS IAM Role Terraform Module
# This creates a read-only IAM role that SpotSave can assume to scan your AWS account

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# Generate a random external ID for additional security
resource "random_uuid" "external_id" {
}

# IAM role that SpotSave will assume
resource "aws_iam_role" "spotsave_role" {
  name = var.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = var.spotsave_account_id
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = random_uuid.external_id.result
          }
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name        = "SpotSave Read-Only Role"
      ManagedBy   = "SpotSave Terraform Module"
      Description = "Read-only role for SpotSave cost optimization scanning"
    }
  )
}

# Attach AWS managed read-only policies
resource "aws_iam_role_policy_attachment" "cost_explorer" {
  role       = aws_iam_role.spotsave_role.name
  policy_arn = "arn:aws:iam::aws:policy/job-function/Billing"
}

resource "aws_iam_role_policy_attachment" "ec2_read_only" {
  role       = aws_iam_role.spotsave_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "pricing_read_only" {
  role       = aws_iam_role.spotsave_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSPriceListServiceFullAccess"
}

# Additional permissions for CloudWatch metrics (required for utilization analysis)
resource "aws_iam_role_policy" "cloudwatch_read" {
  name = "SpotSaveCloudWatchRead"
  role = aws_iam_role.spotsave_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:GetMetricData",
          "cloudwatch:DescribeAlarms"
        ]
        Resource = "*"
      }
    ]
  })
}

# RDS read-only access (for future RDS optimization scanning)
resource "aws_iam_role_policy_attachment" "rds_read_only" {
  role       = aws_iam_role.spotsave_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonRDSReadOnlyAccess"
}

# ECS read-only access (optional - for container optimization scanning)
# Note: AWS managed ECS read-only policy doesn't exist, using EC2 read-only which covers ECS
# resource "aws_iam_role_policy_attachment" "ecs_read_only" {
#   role       = aws_iam_role.spotsave_role.name
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerServiceReadOnlyAccess"
# }

# Lambda read-only access (for serverless optimization)
resource "aws_iam_role_policy_attachment" "lambda_read_only" {
  role       = aws_iam_role.spotsave_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSLambda_ReadOnlyAccess"
}

