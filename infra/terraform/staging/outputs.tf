output "api_url" {
  description = "Staging API health base URL."
  value       = "https://${var.api_hostname}"
}

output "web_url" {
  description = "CloudFront staging URL."
  value       = "https://${aws_cloudfront_distribution.web.domain_name}"
}

output "web_bucket" {
  description = "Private bucket used by the web deployment workflow."
  value       = aws_s3_bucket.web.id
}

output "cloudfront_distribution_id" {
  description = "Distribution invalidated after web promotion."
  value       = aws_cloudfront_distribution.web.id
}

output "ecr_repositories" {
  description = "Immutable application repositories."
  value       = { for name, repository in aws_ecr_repository.app : name => repository.repository_url }
}

output "telemetry_queue_url" {
  description = "Synthetic staging telemetry queue."
  value       = aws_sqs_queue.telemetry.id
}

output "database_master_secret_arn" {
  description = "RDS-managed credential secret."
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
  sensitive   = true
}
