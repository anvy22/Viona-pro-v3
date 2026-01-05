import { sendNotification } from '@/lib/kafka-producer';

export function notifyAsync(payload: any) {
  queueMicrotask(() => {
    sendNotification(payload).catch(console.error);
  });
}
