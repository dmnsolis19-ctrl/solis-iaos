locals {
  name = "${var.project_name}-${var.environment}"

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
