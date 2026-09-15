data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

resource "aws_iot_thing" "gateway" {
  name = var.gateway_id

  attributes = {
    environment = var.environment
    tenant_id   = var.tenant_id
  }
}

resource "aws_iot_policy" "gateway_publish_only" {
  name = "${local.name}-${var.gateway_id}-publish-only"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "iot:Connect"
        Resource = "arn:${data.aws_partition.current.partition}:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:client/${var.gateway_id}"
      },
      {
        Effect = "Allow"
        Action = "iot:Publish"
        Resource = [
          "arn:${data.aws_partition.current.partition}:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:topic/${local.telemetry_topic}",
          "arn:${data.aws_partition.current.partition}:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:topic/${local.status_topic}",
          "arn:${data.aws_partition.current.partition}:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:topic/${local.diagnostics_topic}"
        ]
      }
    ]
  })
}

# Deliberately absent: aws_iot_certificate and policy attachments. Generating a
# device private key through Terraform would place sensitive key material in
# state. Certificate issuance and attachment require the external activation gate.
