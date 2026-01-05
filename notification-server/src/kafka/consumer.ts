import { kafka } from "../config/kafka.js";
import { ENV } from "../config/env.js";
import { createAndBroadcastNotification } from "../services/notification.service.js";

const consumer = kafka.consumer({ groupId: "notification-group" });

export const startKafkaConsumer = async () => {
  await consumer.connect();
  console.log("✅ Kafka Consumer connected");

  await consumer.subscribe({
    topic: ENV.kafkaNotificationTopic,
    fromBeginning: false
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        const data = JSON.parse(message.value.toString());
        console.log("📨 Received from Kafka:", data);
        await createAndBroadcastNotification(data);
      } catch (err) {
        console.error("Error handling Kafka message:", err);
      }
    }
  });
};
