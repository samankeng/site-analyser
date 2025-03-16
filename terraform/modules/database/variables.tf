variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
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

variable "mongodb_instance" {
  description = "Instance type for MongoDB cluster"
  type        = string
  default     = "db.t3.medium"
}

variable "mongodb_username" {
  description = "Master username for MongoDB"
  type        = string
  sensitive   = true
}

variable "mongodb_password" {
  description = "Master password for MongoDB"
  type        = string
  sensitive   = true
}

variable "server_security_group_id" {
  description = "ID of the server security group to allow database access"
  type        = string
  default     = ""
}
