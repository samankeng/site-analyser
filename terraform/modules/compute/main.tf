# Create security groups for each service
resource "aws_security_group" "client" {
  name        = "${var.project_name}-${var.environment}-client-sg"
  description = "Security group for client service"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = var.client_port
    to_port     = var.client_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP access to the client application"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS access to the client application"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-client-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "server" {
  name        = "${var.project_name}-${var.environment}-server-sg"
  description = "Security group for server service"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.server_port
    to_port         = var.server_port
    protocol        = "tcp"
    security_groups = [aws_security_group.client.id]
    description     = "Allow access from client service"
  }

  ingress {
    from_port   = var.server_port
    to_port     = var.server_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow direct API access (for development and testing)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-server-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "ai_service" {
  name        = "${var.project_name}-${var.environment}-ai-service-sg"
  description = "Security group for AI service"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.ai_service_port
    to_port         = var.ai_service_port
    protocol        = "tcp"
    security_groups = [aws_security_group.server.id]
    description     = "Allow access from server service"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-ai-service-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Create ECR repositories for each service
resource "aws_ecr_repository" "client" {
  name                 = "${var.project_name}/${var.environment}/client"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-client-ecr"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ecr_repository" "server" {
  name                 = "${var.project_name}/${var.environment}/server"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-server-ecr"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ecr_repository" "ai_service" {
  name                 = "${var.project_name}/${var.environment}/ai-service"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-ai-service-ecr"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Create ECS cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}-cluster"
  
  setting {
    name  = "containerInsights"
    value = var.environment == "production" ? "enabled" : "disabled"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-cluster"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Create IAM role for ECS task execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-${var.environment}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-ecs-task-execution-role"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Create IAM role for ECS tasks
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-ecs-task-role"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Create task definitions for each service
resource "aws_cloudwatch_log_group" "client" {
  name              = "/ecs/${var.project_name}-${var.environment}/client"
  retention_in_days = 30

  tags = {
    Name        = "${var.project_name}-${var.environment}-client-logs"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_group" "server" {
  name              = "/ecs/${var.project_name}-${var.environment}/server"
  retention_in_days = 30

  tags = {
    Name        = "${var.project_name}-${var.environment}-server-logs"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_group" "ai_service" {
  name              = "/ecs/${var.project_name}-${var.environment}/ai-service"
  retention_in_days = 30

  tags = {
    Name        = "${var.project_name}-${var.environment}-ai-service-logs"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "mongodb_password" {
  name        = "/${var.project_name}/${var.environment}/mongodb_password"
  description = "MongoDB password for ${var.project_name} ${var.environment} environment"
  type        = "SecureString"
  value       = var.mongodb_password

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ecs_task_definition" "client" {
  family                   = "${var.project_name}-${var.environment}-client"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "client"
      image     = "${aws_ecr_repository.client.repository_url}:latest"
      essential = true
      
      portMappings = [
        {
          containerPort = var.client_port
          hostPort      = var.client_port
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "REACT_APP_API_URL"
          value = "http://${aws_lb.server.dns_name}:${var.server_port}/api"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.client.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "${var.project_name}-${var.environment}-client-task"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ecs_task_definition" "server" {
  family                   = "${var.project_name}-${var.environment}-server"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "server"
      image     = "${aws_ecr_repository.server.repository_url}:latest"
      essential = true
      
      portMappings = [
        {
          containerPort = var.server_port
          hostPort      = var.server_port
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = tostring(var.server_port)
        },
        {
          name  = "MONGODB_URI"
          value = "mongodb://${var.mongodb_username}:${var.mongodb_password}@${var.mongodb_endpoint}:27017/${var.project_name}?retryWrites=true&w=majority"
        },
        {
          name  = "AI_SERVICE_URL"
          value = "http://${aws_service_discovery_service.ai_service.name}.${aws_service_discovery_private_dns_namespace.main.name}:${var.ai_service_port}/api"
        }
      ]
      
      secrets = [
        {
          name      = "SHODAN_API_KEY"
          valueFrom = "/${var.project_name}/${var.environment}/shodan_api_key"
        },
        {
          name      = "VIRUSTOTAL_API_KEY"
          valueFrom = "/${var.project_name}/${var.environment}/virustotal_api_key"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.server.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "${var.project_name}-${var.environment}-server-task"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ecs_task_definition" "ai_service" {
  family                   = "${var.project_name}-${var.environment}-ai-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "ai-service"
      image     = "${aws_ecr_repository.ai_service.repository_url}:latest"
      essential = true
      
      portMappings = [
        {
          containerPort = var.ai_service_port
          hostPort      = var.ai_service_port
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = tostring(var.ai_service_port)
        },
        {
          name  = "CORS_ORIGINS"
          value = "http://${aws_lb.client.dns_name},http://${aws_lb.server.dns_name}"
        },
        {
          name  = "OLLAMA_ENDPOINT"
          value = "http://ollama:11434/api/generate"
        },
        {
          name  = "OLLAMA_MODEL"
          value = "llama2"
        }
      ]
      
      secrets = [
        {
          name      = "API_KEY"
          valueFrom = "/${var.project_name}/${var.environment}/ai_service_api_key"
        },
        {
          name      = "OPENAI_API_KEY"
          valueFrom = "/${var.project_name}/${var.environment}/openai_api_key"
        },
        {
          name      = "SHODAN_API_KEY"
          valueFrom = "/${var.project_name}/${var.environment}/shodan_api_key"
        },
        {
          name      = "VIRUSTOTAL_API_KEY"
          valueFrom = "/${var.project_name}/${var.environment}/virustotal_api_key"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ai_service.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      },
      
      mountPoints = [
        {
          sourceVolume  = "models"
          containerPath = "/app/models"
          readOnly      = false
        }
      ]
    }
  ])
  
  volume {
    name = "models"
    
    efs_volume_configuration {
      file_system_id = aws_efs_file_system.models.id
      root_directory = "/"
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-ai-service-task"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Create EFS for model storage
resource "aws_efs_file_system" "models" {
  creation_token = "${var.project_name}-${var.environment}-models-efs"
  
  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-models-efs"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "efs" {
  name        = "${var.project_name}-${var.environment}-efs-sg"
  description = "Allow EFS access from AI service"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.ai_service.id]
    description     = "Allow NFS access from AI service"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-efs-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_efs_mount_target" "models" {
  count           = length(var.private_subnet_ids)
  file_system_id  = aws_efs_file_system.models.id
  subnet_id       = var.private_subnet_ids[count.index]
  security_groups = [aws_security_group.efs.id]
}

# Create service discovery
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "${var.project_name}.local"
  description = "Service discovery namespace for ${var.project_name}"
  vpc         = var.vpc_id
}

resource "aws_service_discovery_service" "client" {
  name = "client"
  
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    
    dns_records {
      ttl  = 10
      type = "A"
    }
    
    routing_policy = "MULTIVALUE"
  }
  
  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "server" {
  name = "server"
  
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    
    dns_records {
      ttl  = 10
      type = "A"
    }
    
    routing_policy = "MULTIVALUE"
  }
  
  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "ai_service" {
  name = "ai-service"
  
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    
    dns_records {
      ttl  = 10
      type = "A"
    }
    
    routing_policy = "MULTIVALUE"
  }
  
  health_check_custom_config {
    failure_threshold = 1
  }
}

# Create load balancers
resource "aws_lb" "client" {
  name               = "${var.project_name}-${var.environment}-client-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.client.id]
  subnets            = var.public_subnet_ids
  
  enable_deletion_protection = var.environment == "production"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-client-lb"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_lb_target_group" "client" {
  name        = "${var.project_name}-${var.environment}-client-tg"
  port        = var.client_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    protocol            = "HTTP"
    matcher             = "200-399"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-client-tg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_lb_listener" "client" {
  load_balancer_arn = aws_lb.client.arn
  port              = var.client_port
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.client.arn
  }
}

resource "aws_lb" "server" {
  name               = "${var.project_name}-${var.environment}-server-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.server.id]
  subnets            = var.public_subnet_ids
  
  enable_deletion_protection = var.environment == "production"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-server-lb"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_lb_target_group" "server" {
  name        = "${var.project_name}-${var.environment}-server-tg"
  port        = var.server_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/api/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    protocol            = "HTTP"
    matcher             = "200-399"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-server-tg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_lb_listener" "server" {
  load_balancer_arn = aws_lb.server.arn
  port              = var.server_port
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.server.arn
  }
}

# Create ECS services
resource "aws_ecs_service" "client" {
  name            = "${var.project_name}-${var.environment}-client-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.client.arn
  desired_count   = var.desired_capacity
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.client.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.client.arn
    container_name   = "client"
    container_port   = var.client_port
  }
  
  service_registries {
    registry_arn = aws_service_discovery_service.client.arn
  }
  
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-client-service"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ecs_service" "server" {
  name            = "${var.project_name}-${var.environment}-server-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.server.arn
  desired_count   = var.desired_capacity
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.server.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.server.arn
    container_name   = "server"
    container_port   = var.server_port
  }
  
  service_registries {
    registry_arn = aws_service_discovery_service.server.arn
  }
  
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-server-service"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ecs_service" "ai_service" {
  name            = "${var.project_name}-${var.environment}-ai-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.ai_service.arn
  desired_count   = var.desired_capacity
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ai_service.id]
    assign_public_ip = false
  }
  
  service_registries {
    registry_arn = aws_service_discovery_service.ai_service.arn
  }
  
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-ai-service"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}