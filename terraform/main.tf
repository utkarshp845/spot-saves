terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Optional: Use Terraform Cloud for state management
  # backend "remote" {
  #   organization = "your-org"
  #   workspaces {
  #     name = "spotsave-production"
  #   }
  # }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "SpotSave"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = data.aws_availability_zones.available.names
}

# RDS Module
module "rds" {
  source = "./modules/rds"
  
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.database_subnet_ids
  db_name               = var.db_name
  db_username           = var.db_username
  db_instance_class     = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  backup_retention_days = var.db_backup_retention_days
  multi_az              = var.db_multi_az
}

# Secrets Manager for database credentials
module "secrets" {
  source = "./modules/secrets"
  
  environment = var.environment
  db_host     = module.rds.db_endpoint
  db_name     = var.db_name
  db_username = var.db_username
  db_password = module.rds.db_password
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"
  
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.public_subnet_ids
  db_secret_arn         = module.secrets.db_secret_arn
  database_url          = "postgresql://${var.db_username}:${module.rds.db_password}@${module.rds.db_endpoint}:5432/${var.db_name}"
  nextauth_secret       = var.nextauth_secret
  nextauth_url          = var.nextauth_url
  next_public_app_url   = var.next_public_app_url
  aws_region            = var.aws_region
  domain_name           = var.domain_name
  
  depends_on = [module.rds, module.secrets]
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  environment   = var.environment
  vpc_id        = module.vpc.vpc_id
  subnet_ids    = module.vpc.public_subnet_ids
  domain_name   = var.domain_name
  certificate_arn = module.ecs.certificate_arn
  target_groups = [
    {
      name     = "frontend"
      port     = 3000
      path     = "/health"
      protocol = "HTTP"
    },
    {
      name     = "backend"
      port     = 8000
      path     = "/health"
      protocol = "HTTP"
    }
  ]
}

# CloudWatch Logs
module "cloudwatch" {
  source = "./modules/cloudwatch"
  
  environment = var.environment
  app_name    = "spotsave"
}

# Outputs
output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "VPC ID"
}

output "alb_dns_name" {
  value       = module.alb.alb_dns_name
  description = "Application Load Balancer DNS name"
}

output "alb_zone_id" {
  value       = module.alb.alb_zone_id
  description = "Application Load Balancer zone ID"
}

output "database_endpoint" {
  value       = module.rds.db_endpoint
  description = "RDS database endpoint"
  sensitive   = true
}

output "database_secret_arn" {
  value       = module.secrets.db_secret_arn
  description = "ARN of the database secret in Secrets Manager"
}

output "ecs_cluster_name" {
  value       = module.ecs.cluster_name
  description = "ECS cluster name"
}

output "ecs_service_names" {
  value       = module.ecs.service_names
  description = "ECS service names"
}

output "frontend_url" {
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${module.alb.alb_dns_name}"
  description = "Frontend URL"
}

