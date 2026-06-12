terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ---------------------------------------------------------------
# VPC & NETWORKING
# ---------------------------------------------------------------
resource "aws_vpc" "textilecrm_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "textilecrm-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.textilecrm_vpc.id
  tags   = { Name = "textilecrm-igw" }
}

# Two public subnets across two AZs (required for ALB + ASG high availability)
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.textilecrm_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags                    = { Name = "textilecrm-public-a" }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.textilecrm_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true
  tags                    = { Name = "textilecrm-public-b" }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.textilecrm_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = { Name = "textilecrm-public-rt" }
}

resource "aws_route_table_association" "rta_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "rta_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public_rt.id
}

# ---------------------------------------------------------------
# SECURITY GROUPS
# ---------------------------------------------------------------
resource "aws_security_group" "alb_sg" {
  name        = "textilecrm-alb-sg"
  description = "Allow HTTP/HTTPS from the internet to the ALB"
  vpc_id      = aws_vpc.textilecrm_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "textilecrm-alb-sg" }
}

resource "aws_security_group" "ec2_sg" {
  name        = "textilecrm-ec2-sg"
  description = "Allow traffic from ALB only, plus SSH for admin"
  vpc_id      = aws_vpc.textilecrm_vpc.id

  ingress {
    description     = "Frontend (Nginx) from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description     = "Backend API from ALB"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description = "SSH for administration"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "textilecrm-ec2-sg" }
}

# ---------------------------------------------------------------
# APPLICATION LOAD BALANCER
# ---------------------------------------------------------------
resource "aws_lb" "textilecrm_alb" {
  name               = "textilecrm-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = { Name = "textilecrm-alb" }
}

# Target group for the frontend (Nginx) — health checked on /healthz
resource "aws_lb_target_group" "frontend_tg" {
  name     = "textilecrm-frontend-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.textilecrm_vpc.id

  health_check {
    path                = "/healthz"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

# Target group for the backend API — health checked on /health
resource "aws_lb_target_group" "backend_tg" {
  name     = "textilecrm-backend-tg"
  port     = 8000
  protocol = "HTTP"
  vpc_id   = aws_vpc.textilecrm_vpc.id

  health_check {
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.textilecrm_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_tg.arn
  }
}

# Route /api/* to the backend target group
resource "aws_lb_listener_rule" "api_rule" {
  listener_arn = aws_lb_listener.http_listener.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health", "/customers*", "/products*", "/orders*", "/dashboard/*"]
    }
  }
}

# ---------------------------------------------------------------
# LAUNCH TEMPLATE + AUTO SCALING GROUP
# ---------------------------------------------------------------
resource "aws_launch_template" "textilecrm_lt" {
  name_prefix   = "textilecrm-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  iam_instance_profile {
    name = var.instance_profile_name
  }

  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  user_data = filebase64("${path.module}/../aws/ec2-user-data.sh")

  tag_specifications {
    resource_type = "instance"
    tags           = { Name = "textilecrm-instance" }
  }
}

resource "aws_autoscaling_group" "textilecrm_asg" {
  name                = "textilecrm-asg"
  desired_capacity    = 2
  min_size            = 2
  max_size            = 6
  vpc_zone_identifier = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  launch_template {
    id      = aws_launch_template.textilecrm_lt.id
    version = "$Latest"
  }

  target_group_arns = [
    aws_lb_target_group.frontend_tg.arn,
    aws_lb_target_group.backend_tg.arn,
  ]

  health_check_type         = "ELB"
  health_check_grace_period = 120

  tag {
    key                 = "Name"
    value               = "textilecrm-asg-instance"
    propagate_at_launch = true
  }
}

# ---------------------------------------------------------------
# AUTO SCALING POLICIES (CPU-based target tracking)
# ---------------------------------------------------------------
resource "aws_autoscaling_policy" "scale_cpu" {
  name                   = "textilecrm-cpu-target-tracking"
  autoscaling_group_name = aws_autoscaling_group.textilecrm_asg.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 50.0
  }
}
