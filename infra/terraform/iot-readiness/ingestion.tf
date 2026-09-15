data "aws_iam_policy_document" "iot_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["iot.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "iot_rule" {
  name               = "${local.name}-iot-rule"
  assume_role_policy = data.aws_iam_policy_document.iot_assume.json
}

data "aws_iam_policy_document" "iot_rule" {
  statement {
    sid       = "SendTelemetryOnly"
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.telemetry.arn]
  }
}

resource "aws_iam_role_policy" "iot_rule" {
  name   = "${local.name}-iot-rule"
  role   = aws_iam_role.iot_rule.id
  policy = data.aws_iam_policy_document.iot_rule.json
}

resource "aws_iot_topic_rule" "telemetry" {
  name        = replace("${local.name}_telemetry_v1", "-", "_")
  description = "Route canonical SOLIS telemetry V1 to the durable ingestion queue."
  enabled     = var.enable_ingestion
  sql_version = "2016-03-23"
  sql         = "SELECT *, topic() AS mqtt_topic, clientid() AS mqtt_client_id, timestamp() AS broker_timestamp FROM 'solis/v1/tenants/+/gateways/+/telemetry'"

  sqs {
    queue_url  = aws_sqs_queue.telemetry.id
    role_arn   = aws_iam_role.iot_rule.arn
    use_base64 = false
  }

  depends_on = [aws_iam_role_policy.iot_rule]
}
