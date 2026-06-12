output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = aws_lb.textilecrm_alb.dns_name
}

output "asg_name" {
  description = "Name of the Auto Scaling Group (used by CI/CD instance refresh)"
  value       = aws_autoscaling_group.textilecrm_asg.name
}
