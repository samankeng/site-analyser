# Create security group for MongoDB
resource "aws_security_group" "mongodb" {
  name        = "${var.project_name}-${var.environment}-mongodb-sg"
  description = "Security group for MongoDB"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [var.server_security_group_id]
    description     = "Allow MongoDB access from server instances"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-mongodb-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Create MongoDB DocumentDB cluster
resource "aws_docdb_subnet_group" "mongodb" {
  name       = "${var.project_name}-${var.environment}-docdb-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "${var.project_name}-${var.environment}-docdb-subnet-group"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_docdb_cluster_parameter_group" "mongodb" {
  family      = "docdb4.0"
  name        = "${var.project_name}-${var.environment}-docdb-param-group"
  description = "Parameter group for ${var.project_name} DocumentDB cluster"

  parameter {
    name  = "tls"
    value = "enabled"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-docdb-param-group"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_docdb_cluster" "mongodb" {
  cluster_identifier              = "${var.project_name}-${var.environment}-docdb"
  engine                          = "docdb"
  master_username                 = var.mongodb_username
  master_password                 = var.mongodb_password
  backup_retention_period         = 7
  preferred_backup_window         = "02:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:06:00"
  db_subnet_group_name            = aws_docdb_subnet_group.mongodb.name
  vpc_security_group_ids          = [aws_security_group.mongodb.id]
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.mongodb.name
  storage_encrypted               = true
  deletion_protection             = var.environment == "production" ? true : false
  skip_final_snapshot             = var.environment != "production"
  final_snapshot_identifier       = var.environment == "production" ? "${var.project_name}-${var.environment}-docdb-final-snapshot" : null

  tags = {
    Name        = "${var.project_name}-${var.environment}-docdb"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_docdb_cluster_instance" "mongodb" {
  count              = var.environment == "production" ? 3 : 1
  identifier         = "${var.project_name}-${var.environment}-docdb-${count.index}"
  cluster_identifier = aws_docdb_cluster.mongodb.id
  instance_class     = var.mongodb_instance

  tags = {
    Name        = "${var.project_name}-${var.environment}-docdb-${count.index}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Create ElastiCache Redis cluster
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-${var.environment}-redis-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis-subnet-group"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "redis" {
  name        = "${var.project_name}-${var.environment}-redis-sg"
  description = "Security group for Redis"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [var.server_security_group_id]
    description     = "Allow Redis access from server instances"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project_name}-${var.environment}-redis"
  engine               = "redis"
  node_type            = var.environment == "production" ? "cache.t3.medium" : "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis6.x"
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]
  port                 = 6379

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}
