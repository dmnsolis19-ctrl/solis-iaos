variable "aws_region" {
  description = "AWS region approved by ADR-036."
  type        = string
  default     = "sa-east-1"

  validation {
    condition     = var.aws_region == "sa-east-1"
    error_message = "Baseline V1.2 authorizes only sa-east-1."
  }
}

variable "environment" {
  description = "Synthetic readiness environment; this stack is not production."
  type        = string
  default     = "readiness"

  validation {
    condition     = var.environment == "readiness"
    error_message = "V0.5 is restricted to the synthetic readiness environment."
  }
}

variable "project_name" {
  description = "Resource name prefix."
  type        = string
  default     = "solis-iaos"
}

variable "tenant_id" {
  description = "Synthetic tenant identifier used to scope the MQTT policy."
  type        = string
  default     = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76"

  validation {
    condition     = can(regex("^[0-9a-fA-F-]{36}$", var.tenant_id))
    error_message = "tenant_id must be a UUID-shaped identifier."
  }
}

variable "gateway_id" {
  description = "Synthetic gateway identity; it must also be the MQTT client ID."
  type        = string
  default     = "solis-gw-lab-001"

  validation {
    condition     = can(regex("^[A-Za-z0-9:_-]{3,128}$", var.gateway_id))
    error_message = "gateway_id must contain only safe MQTT client ID characters."
  }
}

variable "enable_ingestion" {
  description = "Explicit deployment gate for the IoT Rule. It remains false in V0.5 readiness."
  type        = bool
  default     = false

  validation {
    condition     = var.enable_ingestion == false
    error_message = "V0.5 readiness must not enable cloud ingestion."
  }
}
