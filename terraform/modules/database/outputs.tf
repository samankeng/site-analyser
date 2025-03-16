output "mongodb_endpoint" {
  description = "Endpoint of the MongoDB cluster"
  value       = aws_docdb_cluster.mongodb.endpoint
}

output "mongodb_port" {
  description = "Port of the MongoDB cluster"
  value       = aws_docdb_cluster.mongodb.port
}

output "mongodb_security_group_id" {
  description = "ID of the MongoDB security group"
  value       = aws_security_group.mongodb.id
}

output "redis_endpoint" {
  description = "Endpoint of the Redis cluster"
  value       = aws_elasticache_cluster.redis.cache_nodes.0.address
}

output "redis_port" {
  description = "Port of the Redis cluster"
  value       = aws_elasticache_cluster.redis.cache_nodes.0.port
}

output "redis_security_group_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis.id
}
