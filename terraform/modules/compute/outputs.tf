output "client_endpoint" {
  description = "Endpoint for the client application"
  value       = aws_lb.client.dns_name
}

output "server_endpoint" {
  description = "Endpoint for the server API"
  value       = aws_lb.server.dns_name
}

output "ai_service_endpoint" {
  description = "Internal endpoint for the AI service"
  value       = "${aws_service_discovery_service.ai_service.name}.${aws_service_discovery_private_dns_namespace.main.name}"
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "client_security_group_id" {
  description = "ID of the client security group"
  value       = aws_security_group.client.id
}

output "server_security_group_id" {
  description = "ID of the server security group"
  value       = aws_security_group.server.id
}

output "ai_service_security_group_id" {
  description = "ID of the AI service security group"
  value       = aws_security_group.ai_service.id
}

output "client_task_definition_arn" {
  description = "ARN of the client task definition"
  value       = aws_ecs_task_definition.client.arn
}

output "server_task_definition_arn" {
  description = "ARN of the server task definition"
  value       = aws_ecs_task_definition.server.arn
}

output "ai_service_task_definition_arn" {
  description = "ARN of the AI service task definition"
  value       = aws_ecs_task_definition.ai_service.arn
}

output "client_ecr_repository_url" {
  description = "URL of the client ECR repository"
  value       = aws_ecr_repository.client.repository_url
}

output "server_ecr_repository_url" {
  description = "URL of the server ECR repository"
  value       = aws_ecr_repository.server.repository_url
}

output "ai_service_ecr_repository_url" {
  description = "URL of the AI service ECR repository"
  value       = aws_ecr_repository.ai_service.repository_url
}
