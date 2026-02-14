# RecoveryPilot Multi-Region Infrastructure
# Deploys to India (ap-south-1), US (us-east-1), UK (eu-west-2)
#
# Architecture:
# - EKS clusters (one per region)
# - RDS PostgreSQL Multi-AZ with read replicas
# - ElastiCache Redis cluster
# - S3 for medical images and audit logs
# - CloudFront CDN for frontend
# - WAF for API protection
# - KMS for encryption key management
# - Secrets Manager for credentials
# - CloudWatch + Prometheus for monitoring

terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
  }

  backend "s3" {
    bucket         = "recovery-pilot-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "recovery-pilot-terraform-locks"
  }
}

# ============================================================
# Variables
# ============================================================

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "regions" {
  description = "Deployment regions with compliance config"
  type = map(object({
    aws_region        = string
    compliance_regime = string
    eks_node_count    = number
    rds_instance_class = string
    redis_node_type   = string
  }))
  default = {
    india = {
      aws_region         = "ap-south-1"
      compliance_regime  = "DPDPA"
      eks_node_count     = 6
      rds_instance_class = "db.r6g.2xlarge"
      redis_node_type    = "cache.r6g.xlarge"
    }
    us = {
      aws_region         = "us-east-1"
      compliance_regime  = "HIPAA"
      eks_node_count     = 4
      rds_instance_class = "db.r6g.xlarge"
      redis_node_type    = "cache.r6g.large"
    }
    uk = {
      aws_region         = "eu-west-2"
      compliance_regime  = "UK_GDPR"
      eks_node_count     = 4
      rds_instance_class = "db.r6g.xlarge"
      redis_node_type    = "cache.r6g.large"
    }
  }
}

# ============================================================
# Provider Configuration (Multi-Region)
# ============================================================

provider "aws" {
  region = "ap-south-1"
  alias  = "india"

  default_tags {
    tags = {
      Project     = "RecoveryPilot"
      Environment = var.environment
      Compliance  = "DPDPA"
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  alias  = "us"

  default_tags {
    tags = {
      Project     = "RecoveryPilot"
      Environment = var.environment
      Compliance  = "HIPAA"
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  region = "eu-west-2"
  alias  = "uk"

  default_tags {
    tags = {
      Project     = "RecoveryPilot"
      Environment = var.environment
      Compliance  = "UK_GDPR"
      ManagedBy   = "Terraform"
    }
  }
}

# ============================================================
# KMS Keys (Per-Region for data residency)
# ============================================================

resource "aws_kms_key" "data_encryption_india" {
  provider = aws.india

  description             = "RecoveryPilot data encryption key - India"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  key_usage               = "ENCRYPT_DECRYPT"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM policies"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name       = "rp-data-encryption-india"
    Compliance = "DPDPA"
  }
}

resource "aws_kms_key" "data_encryption_us" {
  provider = aws.us

  description             = "RecoveryPilot data encryption key - US"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name       = "rp-data-encryption-us"
    Compliance = "HIPAA"
  }
}

resource "aws_kms_key" "data_encryption_uk" {
  provider = aws.uk

  description             = "RecoveryPilot data encryption key - UK"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name       = "rp-data-encryption-uk"
    Compliance = "UK_GDPR"
  }
}

# ============================================================
# S3 Buckets (Per-Region, encrypted, versioned)
# ============================================================

resource "aws_s3_bucket" "medical_images_india" {
  provider = aws.india
  bucket   = "rp-medical-images-india-${var.environment}"

  tags = {
    Name           = "Medical Images - India"
    DataType       = "PHI"
    Compliance     = "DPDPA"
    DataResidency  = "ap-south-1"
  }
}

resource "aws_s3_bucket_versioning" "medical_images_india" {
  provider = aws.india
  bucket   = aws_s3_bucket.medical_images_india.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "medical_images_india" {
  provider = aws.india
  bucket   = aws_s3_bucket.medical_images_india.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.data_encryption_india.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "medical_images_india" {
  provider = aws.india
  bucket   = aws_s3_bucket.medical_images_india.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "medical_images_india" {
  provider = aws.india
  bucket   = aws_s3_bucket.medical_images_india.id

  rule {
    id     = "archive-old-images"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    # DPDPA retention: 5 years minimum
    expiration {
      days = 1825
    }
  }
}

# Audit log bucket (immutable, 7-year retention)
resource "aws_s3_bucket" "audit_logs_india" {
  provider = aws.india
  bucket   = "rp-audit-logs-india-${var.environment}"

  tags = {
    Name       = "Audit Logs - India"
    Compliance = "DPDPA"
    Immutable  = "true"
  }
}

resource "aws_s3_bucket_object_lock_configuration" "audit_logs_india" {
  provider = aws.india
  bucket   = aws_s3_bucket.audit_logs_india.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 2555 # 7 years
    }
  }
}

# ============================================================
# Backup Configuration
# ============================================================

# AWS Backup plan for automated daily backups
resource "aws_backup_plan" "recovery_pilot" {
  provider = aws.india
  name     = "rp-backup-plan"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = "rp-backup-vault"
    schedule          = "cron(0 3 * * ? *)" # Daily at 3 AM IST

    lifecycle {
      cold_storage_after = 30
      delete_after       = 2555 # 7 years retention
    }

    copy_action {
      destination_vault_arn = "arn:aws:backup:ap-south-2::backup-vault:rp-backup-vault-dr"

      lifecycle {
        cold_storage_after = 30
        delete_after       = 2555
      }
    }
  }

  rule {
    rule_name         = "hourly-backup"
    target_vault_name = "rp-backup-vault"
    schedule          = "cron(0 * * * ? *)" # Every hour

    lifecycle {
      delete_after = 7 # Keep hourly backups for 7 days
    }
  }
}

# ============================================================
# WAF (Web Application Firewall)
# ============================================================

resource "aws_wafv2_web_acl" "api_protection" {
  provider = aws.india
  name     = "rp-api-waf"
  scope    = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting
  rule {
    name     = "rate-limit"
    priority = 1

    override_action {
      none {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "rp-rate-limit"
    }
  }

  # AWS Managed Rules - Common Rule Set
  rule {
    name     = "aws-managed-common"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "rp-common-rules"
    }
  }

  # SQL Injection Protection
  rule {
    name     = "sql-injection"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "rp-sqli-rules"
    }
  }

  # Known Bad Inputs
  rule {
    name     = "known-bad-inputs"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "rp-bad-inputs"
    }
  }

  visibility_config {
    sampled_requests_enabled   = true
    cloudwatch_metrics_enabled = true
    metric_name                = "rp-waf"
  }

  tags = {
    Name       = "RecoveryPilot API WAF"
    Compliance = "DPDPA-HIPAA-UKGDPR"
  }
}

# ============================================================
# Outputs
# ============================================================

output "kms_key_arns" {
  value = {
    india = aws_kms_key.data_encryption_india.arn
    us    = aws_kms_key.data_encryption_us.arn
    uk    = aws_kms_key.data_encryption_uk.arn
  }
}
