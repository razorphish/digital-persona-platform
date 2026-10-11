import {
  SQSClient,
  SendMessageCommand,
  GetQueueUrlCommand,
} from "@aws-sdk/client-sqs";

// =================================
// Message Queue Abstraction Layer
// =================================
// This abstraction makes it easy to switch from SQS to Kafka later
// following the migration strategy outlined in docs/KAFKA_MIGRATION_STRATEGY.md

export interface MessageQueue {
  publish(topic: string, message: any): Promise<void>;
}

// SQS Implementation (Phase 1 of migration strategy)
export class SQSMessageQueue implements MessageQueue {
  private sqsClient: SQSClient;
  private queueUrl: string | null;

  constructor() {
    this.sqsClient = new SQSClient({
      region: process.env.AWS_REGION || "us-west-1",
    });
    this.queueUrl = process.env.ML_SQS_QUEUE_URL || null;
  }

  async publish(topic: string, message: any): Promise<void> {
    if (!this.queueUrl) {
      console.warn("ML_SQS_QUEUE_URL not configured - ML job queuing disabled");
      return;
    }

    try {
      const messageBody = JSON.stringify({
        topic,
        timestamp: new Date().toISOString(),
        data: message,
      });

      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: messageBody,
        MessageAttributes: {
          topic: {
            DataType: "String",
            StringValue: topic,
          },
          timestamp: {
            DataType: "String",
            StringValue: new Date().toISOString(),
          },
        },
      });

      await this.sqsClient.send(command);
      console.log(`✅ Message published to SQS topic: ${topic}`);
    } catch (error) {
      console.error(
        `❌ Failed to publish message to SQS topic ${topic}:`,
        error
      );
      throw error;
    }
  }
}

// Kafka Implementation (Phase 4 of migration strategy - future)
// Uncomment when ready to migrate to Kafka
/*
export class KafkaMessageQueue implements MessageQueue {
  private kafka: any; // KafkaJS client

  constructor() {
    // Initialize Kafka client
  }

  async publish(topic: string, message: any): Promise<void> {
    try {
      const messageValue = JSON.stringify({
        timestamp: new Date().toISOString(),
        data: message
      });

      await this.kafka.producer().send({
        topic,
        messages: [{ value: messageValue }]
      });

      console.log(`✅ Message published to Kafka topic: ${topic}`);
    } catch (error) {
      console.error(`❌ Failed to publish message to Kafka topic ${topic}:`, error);
      throw error;
    }
  }
}
*/

// Factory function - makes switching implementations easy
export function createMessageQueue(): MessageQueue {
  // For now, always return SQS implementation
  // Later, this can be environment-driven:
  // return process.env.MESSAGE_QUEUE_TYPE === 'kafka'
  //   ? new KafkaMessageQueue()
  //   : new SQSMessageQueue();

  return new SQSMessageQueue();
}

// Common message types for ML processing
export interface MLJobMessage {
  jobType:
    | "image_analysis"
    | "voice_synthesis"
    | "personality_analysis"
    | "memory_processing";
  personaId: string;
  sourceType: "media_file" | "conversation" | "text_input";
  sourceId: string;
  content: string;
  metadata?: Record<string, any>;
}

// Convenience function for ML job queuing
export async function queueMLJob(
  messageQueue: MessageQueue,
  jobMessage: MLJobMessage
): Promise<void> {
  await messageQueue.publish("ml-processing", jobMessage);
}
