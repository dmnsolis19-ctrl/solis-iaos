output "telemetry_queue_url" {
  description = "SQS queue consumed later by Telemetry Worker."
  value       = aws_sqs_queue.telemetry.id
}

output "telemetry_dlq_url" {
  description = "Existing quarantine queue for consumer failures and IoT error-action wrappers. Inspect message format before replay."
  value       = aws_sqs_queue.telemetry_dlq.id
}

output "gateway_thing_name" {
  description = "Synthetic AWS IoT Thing name."
  value       = aws_iot_thing.gateway.name
}

output "gateway_policy_name" {
  description = "Publish-only policy prepared for external certificate activation."
  value       = aws_iot_policy.gateway_publish_only.name
}

output "ingestion_enabled" {
  description = "Reports whether the approved V0.6 ingestion gate is active."
  value       = aws_iot_topic_rule.telemetry.enabled
}
