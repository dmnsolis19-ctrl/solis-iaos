data "aws_iam_policy_document" "iot_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["iot.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [local.telemetry_rule_arn]
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
    resources = [aws_sqs_queue.telemetry.arn, aws_sqs_queue.telemetry_dlq.arn]
  }
}

resource "aws_iam_role_policy" "iot_rule" {
  name   = "${local.name}-iot-rule"
  role   = aws_iam_role.iot_rule.id
  policy = data.aws_iam_policy_document.iot_rule.json
}

resource "aws_iot_topic_rule" "telemetry" {
  name        = local.telemetry_rule_name
  description = "Route canonical SOLIS telemetry V1 to the durable ingestion queue."
  enabled     = var.enable_ingestion
  sql_version = "2016-03-23"
  sql         = "SELECT *, topic() AS mqtt_topic, clientid() AS mqtt_client_id, timestamp() AS broker_timestamp FROM 'solis/v1/tenants/+/gateways/+/telemetry'"

  sqs {
    queue_url  = aws_sqs_queue.telemetry.id
    role_arn   = aws_iam_role.iot_rule.arn
    use_base64 = false
  }

  # Same existing queue; IoT error wrappers require inspection before replay.
  error_action {
    sqs {
      queue_url  = aws_sqs_queue.telemetry_dlq.id
      role_arn   = aws_iam_role.iot_rule.arn
      use_base64 = false
    }
  }

  depends_on = [aws_iam_role_policy.iot_rule]
}
