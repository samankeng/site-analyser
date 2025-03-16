variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "environment" {
  description = "Environment (e.g., development, staging, production)"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "client_port" {
  description = "Port for the client service"
  type        = number
  default     = 80
}

variable "server_port" {
  description = "Port for the server service"
  type        = number
  default     = 3000
}

variable "ai_service_port" {
  description = "Port for the AI service"
  type        = number
  default     = 8000
}

variable "client_security_group_id" {
  description = "ID of the client security group"
  type        = string
}

variable "server_security_group_id" {
  description = "ID of the server security group"
  type        = string
}

variable "ai_service_security_group_id" {
  description = "ID of the AI service security group"
  type        = string
}

variable "mongodb_security_group_id" {
  description = "ID of the MongoDB security group"
  type        = string
}

variable "client_lb_arn" {
  description = "ARN of the client load balancer"
  type        = string
}

variable "server_lb_arn" {
  description = "ARN of the server load balancer"
  type        = string
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "shodan_api_key" {
  description = "Shodan API key"
  type        = string
  sensitive   = true
}

variable "virustotal_api_key" {
  description = "VirusTotal API key"
  type        = string
  sensitive   = true
}

variable "ai_service_api_key" {
  description = "API key for the AI service"
  type        = string
  sensitive   = true
}

variable "ecs_task_role_name" {
  description = "Name of the ECS task role"
  type        = string
}

variable "security_alert_email" {
  description = "Email address for security alerts"
  type        = string
  default     = "security@example.com"
}

variable "sns_alarm_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  type        = string
  default     = ""
}

variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}
