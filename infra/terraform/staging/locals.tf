locals {
  name = "${var.project_name}-${var.environment}"

  common_tags = {
    Project        = "SOLIS-IAOS"
    Environment    = var.environment
    ManagedBy      = "Terraform"
    DataClass      = "Synthetic"
    Architecture   = "Baseline-V1.2"
    CostAllocation = "SOLIS-IAOS-FOUNDATION"
  }

  container_environment = [
    {
      name  = "NODE_ENV"
      value = "staging"
    },
    {
      name  = "LOG_LEVEL"
      value = "info"
    },
    {
      name  = "AWS_REGION"
      value = var.aws_region
    }
  ]
}
