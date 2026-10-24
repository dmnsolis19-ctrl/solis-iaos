locals {
  name = "${var.project_name}-${var.environment}"

  telemetry_rule_name = replace("${local.name}_telemetry_v1", "-", "_")
  telemetry_rule_arn  = "arn:${data.aws_partition.current.partition}:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:rule/${local.telemetry_rule_name}"

  telemetry_topic = "solis/v1/tenants/${var.tenant_id}/gateways/${var.gateway_id}/telemetry"
  status_topic    = "solis/v1/tenants/${var.tenant_id}/gateways/${var.gateway_id}/status"
  diagnostics_topic = (
    "solis/v1/tenants/${var.tenant_id}/gateways/${var.gateway_id}/diagnostics"
  )

  common_tags = {
    Project        = "SOLIS-IAOS"
    Environment    = var.environment
    ManagedBy      = "Terraform"
    DataClass      = "Synthetic"
    Architecture   = "AWS-IoT-Readiness-V0.5"
    CostAllocation = "SOLIS-IAOS-READINESS"
  }
}
