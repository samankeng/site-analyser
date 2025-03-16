output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "api_keys_secret_arn" {
  description = "ARN of the API keys secret"
  value       = aws_secretsmanager_secret.api_keys.arn
}

output "sns_security_alerts_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = var.environment == "production" ? aws_sns_topic.security_alerts[0].arn : ""
}

output "config_role_arn" {
  description = "ARN of the Config service role"
  value       = aws_iam_role.config_role.arn
}

output "ssm_parameter_access_policy_arn" {
  description = "ARN of the SSM parameter access policy"
  value       = aws_iam_policy.ssm_parameter_access.arn
}

output "secrets_manager_access_policy_arn" {
  description = "ARN of the Secrets Manager access policy"
  value       = aws_iam_policy.secrets_manager_access.arn
}

output "config_logs_bucket_id" {
  description = "ID of the S3 bucket for Config logs"
  value       = aws_s3_bucket.config_logs.id
}

output "config_logs_bucket_arn" {
  description = "ARN of the S3 bucket for Config logs"
  value       = aws_s3_bucket.config_logs.arn
}
