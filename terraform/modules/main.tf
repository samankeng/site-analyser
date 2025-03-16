provider "aws" {
  region = var.aws_region
}

# Create a VPC for the application
module "networking" {
  source = "./networking"

  vpc_name        = "${var.project_name}-vpc"
  vpc_cidr        = var.vpc_cidr
  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  
  environment  = var.environment
  project_name = var.project_name
}

# Create database resources
module "database" {
  source = "./database"

  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  
  environment        = var.environment
  project_name       = var.project_name
  mongodb_instance   = var.mongodb_instance
  mongodb_username   = var.mongodb_username
  mongodb_password   = var.mongodb_password
}

# Create compute resources
module "compute" {
  source = "./compute"

  vpc_id             = module.networking.vpc_id
  public_subnet_ids  = module.networking.public_subnet_ids
  private_subnet_ids = module.networking.private_subnet_ids
  
  environment        = var.environment
  project_name       = var.project_name
  
  client_port        = var.client_port
  server_port        = var.server_port
  ai_service_port    = var.ai_service_port
  
  client_image       = var.client_image
  server_image       = var.server_image
  ai_service_image   = var.ai_service_image
  
  instance_type      = var.instance_type
  min_size           = var.min_size
  max_size           = var.max_size
  desired_capacity   = var.desired_capacity
  
  mongodb_endpoint   = module.database.mongodb_endpoint
  mongodb_username   = var.mongodb_username
  mongodb_password   = var.mongodb_password
  
  depends_on = [
    module.networking,
    module.database
  ]
}

# Create security resources
module "security" {
  source = "./security"

  vpc_id             = module.networking.vpc_id
  
  environment        = var.environment
  project_name       = var.project_name
  
  client_port        = var.client_port
  server_port        = var.server_port
  ai_service_port    = var.ai_service_port
  
  client_security_group_id     = module.compute.client_security_group_id
  server_security_group_id     = module.compute.server_security_group_id
  ai_service_security_group_id = module.compute.ai_service_security_group_id
  mongodb_security_group_id    = module.database.mongodb_security_group_id
  
  depends_on = [
    module.compute,
    module.database
  ]
}

# Output the endpoints for the deployed services
output "client_endpoint" {
  description = "The endpoint for the client application"
  value       = module.compute.client_endpoint
}

output "server_endpoint" {
  description = "The endpoint for the server API"
  value       = module.compute.server_endpoint
}

output "ai_service_endpoint" {
  description = "The endpoint for the AI service API"
  value       = module.compute.ai_service_endpoint
}
