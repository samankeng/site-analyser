variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "site-analyser"
}

variable "environment" {
  description = "Environment (e.g., development, staging, production)"
  type        = string
  default     = "development"
}

# Networking variables
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones to use in the region"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# Database variables
variable "mongodb_instance" {
  description = "EC2 instance type for MongoDB"
  type        = string
  default     = "t3.medium"
}

variable "mongodb_username" {
  description = "Username for MongoDB"
  type        = string
  sensitive   = true
}

variable "mongodb_password" {
  description = "Password for MongoDB"
  type        = string
  sensitive   = true
}

# Compute variables
variable "instance_type" {
  description = "EC2 instance type for the services"
  type        = string
  default     = "t3.small"
}

variable "min_size" {
  description = "Minimum number of instances in the auto scaling group"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of instances in the auto scaling group"
  type        = number
  default     = 3
}

variable "desired_capacity" {
  description = "Desired number of instances in the auto scaling group"
  type        = number
  default     = 2
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

variable "client_image" {
  description = "Docker image for the client service"
  type        = string
  default     = "site-analyser/client:latest"
}

variable "server_image" {
  description = "Docker image for the server service"
  type        = string
  default     = "site-analyser/server:latest"
}

variable "ai_service_image" {
  description = "Docker image for the AI service"
  type        = string
  default     = "site-analyser/ai-service:latest"
}
