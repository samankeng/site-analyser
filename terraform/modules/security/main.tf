# Create security group rules for service communication
resource "aws_security_group_rule" "server_to_client" {
  type                     = "ingress"
  from_port                = var.client_port
  to_port                  = var.client_port
  protocol                 = "tcp"
  security_group_id        = var.client_security_group_id
  source_security_group_id = var.server_security_group_id
  description              = "Allow server to communicate with client"
}

resource "aws_security_group_rule" "server_to_ai_service" {
  type                     = "ingress"
  from_port                = var.ai_service_port
  to_port                  = var.ai_service_port
  protocol                 = "tcp"
  security_group_id        = var.ai_service_security_group_id
  source_security_group_id = var.server_security_group_id
  description              = "Allow server to communicate with AI service"
}

resource "aws_security_group_rule" "server_to_mongodb" {
  type                     = "ingress"
  from_port                = 27017
  to_port                  = 27017
  protocol                 = "tcp"
  security_group_id        = var.mongodb_security_group_id
  source_security_group_id = var.server_security_group_id
  description              = "Allow server to communicate with MongoDB"
}

# Create AWS WAF for client and server load balancers
resource "aws_wafv2_web_acl" "main" {
  name        = "${var.project_name}-${var.environment}-waf"
  description = "WAF for ${var.project_name} ${var.environment} environment"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS managed rule: Core rule set
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

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
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # AWS managed rule: SQL injection detection
  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 2

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
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # AWS managed rule: Cross-site scripting detection
  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

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
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rate-based rule to prevent DDoS
  rule {
    name     = "RateBasedRule"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 3000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateBasedRule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-${var.environment}-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-waf"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Associate WAF with load balancers
resource "aws_wafv2_web_acl_association" "client" {
  resource_arn = var.client_lb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

resource "aws_wafv2_web_acl_association" "server" {
  resource_arn = var.server_lb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# Create AWS Shield Advanced protection (for production only)
resource "aws_shield_protection" "client_lb" {
  count        = var.environment == "production" ? 1 : 0
  name         = "${var.project_name}-${var.environment}-client-lb-shield"
  resource_arn = var.client_lb_arn

  tags = {
    Name        = "${var.project_name}-${var.environment}-client-lb-shield"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_shield_protection" "server_lb" {
  count        = var.environment == "production" ? 1 : 0
  name         = "${var.project_name}-${var.environment}-server-lb-shield"
  resource_arn = var.server_lb_arn

  tags = {
    Name        = "${var.project_name}-${var.environment}-server-lb-shield"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Create AWS Secrets Manager for sensitive variables
resource "aws_secretsmanager_secret" "api_keys" {
  name        = "${var.project_name}/${var.environment}/api-keys"
  description = "API keys for ${var.project_name} ${var.environment} environment"
  
  recovery_window_in_days = 7
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-api-keys"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  
  secret_string = jsonencode({
    OPENAI_API_KEY     = var.openai_api_key,
    SHODAN_API_KEY     = var.shodan_api_key,
    VIRUSTOTAL_API_KEY = var.virustotal_api_key,
    AI_SERVICE_API_KEY = var.ai_service_api_key
  })
}

# Create SSM Parameters for configuration
resource "aws_ssm_parameter" "openai_api_key" {
  name        = "/${var.project_name}/${var.environment}/openai_api_key"
  description = "OpenAI API key for ${var.project_name} ${var.environment} environment"
  type        = "SecureString"
  value       = var.openai_api_key

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "shodan_api_key" {
  name        = "/${var.project_name}/${var.environment}/shodan_api_key"
  description = "Shodan API key for ${var.project_name} ${var.environment} environment"
  type        = "SecureString"
  value       = var.shodan_api_key

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "virustotal_api_key" {
  name        = "/${var.project_name}/${var.environment}/virustotal_api_key"
  description = "VirusTotal API key for ${var.project_name} ${var.environment} environment"
  type        = "SecureString"
  value       = var.virustotal_api_key

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "ai_service_api_key" {
  name        = "/${var.project_name}/${var.environment}/ai_service_api_key"
  description = "AI Service API key for ${var.project_name} ${var.environment} environment"
  type        = "SecureString"
  value       = var.ai_service_api_key

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Create IAM policies for ECS task roles
resource "aws_iam_policy" "ssm_parameter_access" {
  name        = "${var.project_name}-${var.environment}-ssm-parameter-access"
  description = "Policy to allow access to SSM parameters for ${var.project_name}"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:ssm:*:*:parameter/${var.project_name}/${var.environment}/*"
      }
    ]
  })
}

resource "aws_iam_policy" "secrets_manager_access" {
  name        = "${var.project_name}-${var.environment}-secrets-manager-access"
  description = "Policy to allow access to Secrets Manager for ${var.project_name}"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Effect   = "Allow"
        Resource = aws_secretsmanager_secret.api_keys.arn
      }
    ]
  })
}

# Attach policies to ECS task roles
resource "aws_iam_role_policy_attachment" "ecs_task_ssm_parameter_access" {
  role       = var.ecs_task_role_name
  policy_arn = aws_iam_policy.ssm_parameter_access.arn
}

resource "aws_iam_role_policy_attachment" "ecs_task_secrets_manager_access" {
  role       = var.ecs_task_role_name
  policy_arn = aws_iam_policy.secrets_manager_access.arn
}

# Create CloudWatch alarms for security monitoring
resource "aws_cloudwatch_metric_alarm" "waf_blocked_requests" {
  alarm_name          = "${var.project_name}-${var.environment}-waf-blocked-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "This alarm monitors for a high number of requests blocked by WAF"
  
  dimensions = {
    WebACL = aws_wafv2_web_acl.main.name
    Region = var.aws_region
  }
  
  alarm_actions = var.environment == "production" ? [var.sns_alarm_topic_arn] : []
  ok_actions    = var.environment == "production" ? [var.sns_alarm_topic_arn] : []
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-waf-blocked-requests"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Create Config Rules for security compliance
resource "aws_config_config_rule" "encrypted_volumes" {
  name        = "${var.project_name}-${var.environment}-encrypted-volumes"
  description = "Checks if EBS volumes are encrypted"
  
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "restricted_ssh" {
  name        = "${var.project_name}-${var.environment}-restricted-ssh"
  description = "Checks if security groups that allow unrestricted SSH access"
  
  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project_name}-${var.environment}-config-recorder"
  role_arn = aws_iam_role.config_role.arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_iam_role" "config_role" {
  name = "${var.project_name}-${var.environment}-config-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# Create SNS Topic for security alerts (in production)
resource "aws_sns_topic" "security_alerts" {
  count = var.environment == "production" ? 1 : 0
  name  = "${var.project_name}-${var.environment}-security-alerts"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-security-alerts"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_sns_topic_subscription" "security_alerts_email" {
  count     = var.environment == "production" ? 1 : 0
  topic_arn = aws_sns_topic.security_alerts[0].arn
  protocol  = "email"
  endpoint  = var.security_alert_email
}

# Configure AWS Config for infrastructure compliance
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_name}-${var.environment}-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config_logs.id
  
  snapshot_delivery_properties {
    delivery_frequency = "One_Hour"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_s3_bucket" "config_logs" {
  bucket = "${var.project_name}-${var.environment}-config-logs"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-config-logs"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_logs" {
  bucket = aws_s3_bucket.config_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config_logs" {
  bucket = aws_s3_bucket.config_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}