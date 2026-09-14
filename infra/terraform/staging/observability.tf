resource "aws_sns_topic" "operations" {
  name              = "${local.name}-operations"
  kms_master_key_id = "alias/aws/sns"
}

resource "aws_sns_topic_subscription" "operations_email" {
  count = var.alarm_email == "" ? 0 : 1

  topic_arn = aws_sns_topic.operations.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

resource "aws_cloudwatch_metric_alarm" "api_unhealthy" {
  alarm_name          = "${local.name}-api-unhealthy"
  alarm_description   = "No healthy staging API target."
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.operations.arn]

  dimensions = {
    LoadBalancer = aws_lb.api.arn_suffix
    TargetGroup  = aws_lb_target_group.api.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "queue_age" {
  alarm_name          = "${local.name}-queue-age"
  alarm_description   = "Telemetry staging queue age exceeds five minutes."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 300
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.operations.arn]

  dimensions = {
    QueueName = aws_sqs_queue.telemetry.name
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${local.name}-dlq-messages"
  alarm_description   = "At least one message reached the telemetry DLQ."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.operations.arn]

  dimensions = {
    QueueName = aws_sqs_queue.telemetry_dlq.name
  }
}
