import { GetQueueAttributesCommand, SQSClient } from "@aws-sdk/client-sqs";

export interface QueueReadinessOptions {
  queueUrl?: string;
  endpoint?: string;
  region: string;
}

export async function checkQueueReadiness(options: QueueReadinessOptions): Promise<boolean> {
  if (options.queueUrl === undefined) return false;

  const client = new SQSClient({
    region: options.region,
    maxAttempts: 1,
    ...(options.endpoint === undefined ? {} : { endpoint: options.endpoint }),
  });

  try {
    await client.send(
      new GetQueueAttributesCommand({
        QueueUrl: options.queueUrl,
        AttributeNames: ["QueueArn"],
      }),
      { abortSignal: AbortSignal.timeout(2_000) },
    );
    return true;
  } catch {
    return false;
  } finally {
    client.destroy();
  }
}
