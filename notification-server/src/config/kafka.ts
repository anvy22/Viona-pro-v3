import { Kafka } from "kafkajs";
import { ENV } from "./env.js";

// src/config/kafka.ts  (or wherever you create the Kafka instance)
const getKafkaBroker = () => {
    // If running inside Docker (via docker-compose), use service name
    if (process.env.DOCKER_ENV === 'true' || process.env.KAFKA_BROKER?.includes('kafka')) {
      return 'kafka:9092';
    }
    // Otherwise (npm start on host) → use localhost
    return process.env.KAFKA_BROKER || 'localhost:9092';
  };
  
  export const kafka = new Kafka({
    clientId: 'notification-server',
    brokers: [getKafkaBroker()],
    retry: {
      initialRetryTime: 300,
      retries: 10,
    },
  });