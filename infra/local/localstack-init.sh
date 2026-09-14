#!/bin/sh
set -eu

awslocal sqs create-queue \
  --queue-name solis-telemetry-dlq \
  --attributes MessageRetentionPeriod=1209600 >/dev/null

dlq_url="$(awslocal sqs get-queue-url \
  --queue-name solis-telemetry-dlq \
  --query QueueUrl \
  --output text)"

dlq_arn="$(awslocal sqs get-queue-attributes \
  --queue-url "$dlq_url" \
  --attribute-names QueueArn \
  --query Attributes.QueueArn \
  --output text)"

awslocal sqs create-queue \
  --queue-name solis-telemetry \
  --attributes "VisibilityTimeout=60,MessageRetentionPeriod=345600,RedrivePolicy={\"deadLetterTargetArn\":\"$dlq_arn\",\"maxReceiveCount\":\"5\"}" \
  >/dev/null
