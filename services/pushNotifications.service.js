import { getSubscriptions, deletePushSubscription } from "../models/pushNotifications.model.js";
import webpush from "../utils/webpush.js";


export const sendPushNotification = async (userId, data) => {
  const subscriptions = await getSubscriptions(userId);

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, JSON.stringify(data));
      } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
            await deletePushSubscription(sub.endpoint);
        } else {
            console.error("Notification failed:", error);
        }
      }
    }),
  );

  return true;
};

export const sendPushToSubscription = async (subscriptions, data) => {
  const BATCH_SIZE = 50;

  for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
    const batch = subscriptions.slice(i, i + BATCH_SIZE);
    
    await Promise.allSettled(
      batch.map(async (sub) => {
        try {
          await webpush.sendNotification(sub, JSON.stringify(data));
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
              await deletePushSubscription(sub.endpoint);
          } else {
              console.error("Notification failed:", error);
          }
        }
      }),
    );
  }

  return true;
};
