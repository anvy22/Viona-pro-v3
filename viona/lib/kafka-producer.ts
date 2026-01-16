import { Kafka, Producer } from "kafkajs";

if (typeof window !== "undefined") {
  throw new Error("Kafka producer must not run in browser!");
}

let producer: Producer | null = null;
let isConnected = false;
let isConnecting = false;

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


const tryGetKafkaProducer = async (): Promise<Producer | null> => {
  if (isConnected && producer) return producer;
  if (isConnecting) return null;

  isConnecting = true;

  try {
    producer?.disconnect().catch(() => { });
    producer = createProducer();
    await producer.connect();
    isConnected = true;
    return producer;
  } catch (err) {
    console.error("Kafka producer connection failed:", err);
    producer = null;
    isConnected = false;
    return null;
  } finally {
    isConnecting = false;
  }
};

export const sendNotification = async (payload: any) => {
  try {
    const p = await tryGetKafkaProducer();
    if (!p) {
      console.warn("Kafka unavailable, notification dropped:", payload.title);
      return;
    }

    await p.send({
      topic: "send_notification",
      messages: [{ value: JSON.stringify(payload) }],
    });

    console.log("Notification sent:", payload.title);
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
};
