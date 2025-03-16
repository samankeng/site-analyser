variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
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

variable "client_image" {
  description = "Docker image for the client service"
  type        = string
}

variable "server_image" {
  description = "Docker image for the server service"
  type        = string
}

variable "ai_service_image" {
  description = "Docker image for the AI service"
  type        = string
}

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

variable "mongodb_endpoint" {
  description = "Endpoint for MongoDB connection"
  type        = string
}

variable "mongodb_username" {
  description = "Username for MongoDB connection"
  type        = string
}

variable "mongodb_password" {
  description = "Password for MongoDB connection"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}
