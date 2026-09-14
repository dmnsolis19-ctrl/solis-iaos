resource "aws_kms_key" "database" {
  description             = "SOLIS IAOS staging RDS encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "database" {
  name          = "alias/${local.name}-database"
  target_key_id = aws_kms_key.database.key_id
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-database"
  subnet_ids = aws_subnet.data[*].id
}

resource "aws_db_instance" "main" {
  identifier = "${local.name}-postgres"

  engine         = "postgres"
  engine_version = "17.10"
  instance_class = "db.t4g.small"

  db_name  = var.database_name
  username = var.database_username
  port     = 5432

  manage_master_user_password   = true
  master_user_secret_kms_key_id = aws_kms_key.database.arn

  allocated_storage     = 50
  max_allocated_storage = 200
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.database.arn

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:30-sun:05:30"
  auto_minor_version_upgrade = false

  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.name}-final"
  copy_tags_to_snapshot     = true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_sqs_queue" "telemetry_dlq" {
  name                      = "${local.name}-telemetry-dlq"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true
}

resource "aws_sqs_queue" "telemetry" {
  name                       = "${local.name}-telemetry"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.telemetry_dlq.arn
    maxReceiveCount     = 5
  })
}

resource "aws_sqs_queue_redrive_allow_policy" "telemetry_dlq" {
  queue_url = aws_sqs_queue.telemetry_dlq.id
  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.telemetry.arn]
  })
}
