provider "aws" {
  region = "us-east-1"
}

module "site_analyser" {
  source = "../../modules"

  # General settings
  project_name = "site-analyser"
  environment  = "development"
  aws_region   = "us-east-1"

  # Network settings
  vpc_cidr            = "10.0.0.0/16"
  availability_zones  = ["us-east-1a", "us-east-1b"]
  private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnet_cidrs  = ["10.0.101.0/24", "10.0.102.0/24"]

  # Database settings
  mongodb_instance   = "db.t3.medium"
  mongodb_username   = var.mongodb_username
  mongodb_password   = var.mongodb_password

  # Compute settings
  instance_type     = "t3.small"
  min_size          = 1
  max_size          = 2
  desired_capacity  = 1
  
  # Service settings
  client_port      = 80
  server_port      = 3000
  ai_service_port  = 8000
  
  # Docker images
  client_image     = "site-analyser/client:latest"
  server_image     = "site-analyser/server:latest"
  ai_service_image = "site-analyser/ai-service:latest"
  
  # API keys
  openai_api_key     = var.openai_api_key
  shodan_api_key     = var.shodan_api_key
  virustotal_api_key = var.virustotal_api_key
  ai_service_api_key = var.ai_service_api_key
}

# Output endpoints for the deployed services
output "client_endpoint" {
  description = "The endpoint for the client application"
  value       = module.site_analyser.client_endpoint
}

output "server_endpoint" {
  description = "The endpoint for the server API"
  value       = module.site_analyser.server_endpoint
}

output "ai_service_endpoint" {
  description = "The endpoint for the AI service API"
  value       = module.site_analyser.ai_service_endpoint
}
