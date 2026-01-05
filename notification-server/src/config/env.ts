import dotenv from  "dotenv";

dotenv.config();

export const ENV = {
    port: process.env.PORT || 5001,
    mongoUrl: process.env.MONGO_URL!,
    redisUrl: process.env.REDIS_URL!,
    kafkaBroker: process.env.KAFKA_BROKER!,
    kafkaNotificationTopic: process.env.KAFKA_NOTIFICATION_TOPIC || "send_notification"
};