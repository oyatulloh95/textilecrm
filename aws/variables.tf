variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-central-1"
}

variable "ami_id" {
  description = "Amazon Linux 2023 AMI ID for the chosen region"
  type        = string
  # Example: ami-0abcd1234efgh5678 (look up the latest AL2023 AMI for your region)
}

variable "instance_type" {
  description = "EC2 instance type for ASG instances"
  type        = string
  default     = "t3.micro"
}

variable "instance_profile_name" {
  description = "IAM instance profile name granting ECR pull permissions"
  type        = string
  default     = "textilecrm-ec2-ecr-role"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed to SSH into instances (restrict to your IP)"
  type        = string
  default     = "0.0.0.0/0"
}
