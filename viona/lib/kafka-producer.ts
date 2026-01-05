// lib/kafka-producer.ts
import { Kafka, Producer } from "kafkajs";

if (typeof window !== "undefined") {
  throw new Error("Kafka producer must not run in browser!");
}

let producer: Producer | null = null;
let isConnected = false;

const BROKER = process.env.KAFKA_BROKER || "localhost:29092";

const kafka = new Kafka({
  clientId: "viona-frontend",
  brokers: [BROKER],
  retry: {
    initialRetryTime: 300,
    maxRetryTime: 30000,
    retries: 10,
  },
});

const createProducer = () => {
  const p = kafka.producer();

  p.on(p.events.CONNECT, () => {
    isConnected = true;
    console.log(`Kafka producer connected → ${BROKER}`);
  });

  p.on(p.events.DISCONNECT, () => {
    isConnected = false;
    console.warn("Kafka producer disconnected");
  });

  return p;
};

export const getKafkaProducer = async () => {
  if (!producer || !isConnected) {
    if (producer) {
      try {
        await producer.disconnect();
      } catch {}
    }

    producer = createProducer();

    try {
      await producer.connect();
      isConnected = true;
    } catch (err) {
      isConnected = false;
      producer = null;
      console.error("Kafka producer connection failed:", err);
      throw err;
    }
  }

  return producer;
};

export const sendNotification = async (payload: any) => {
  try {
    const p = await getKafkaProducer();
    await p.send({
      topic: "send_notification",
      messages: [{ value: JSON.stringify(payload) }],
    });
    console.log("Notification sent:", payload.title);
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
};
