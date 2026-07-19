import cron from "node-cron";
import { fetchUsersWithRiskyStreaks } from "../models/pushNotifications.model.js";
import { sendPushToSubscription } from "../services/pushNotifications.service.js";

// Runs every hour minutes
cron.schedule("0 * * * *", async () => {
  try {
    const users = await fetchUsersWithRiskyStreaks();

    if (users.length === 0) return;

    const subscriptions = users.map((user) => ({
      endpoint: user.endpoint,
      keys: {
        p256dh: user.p256dh,
        auth: user.auth,
      },
    }));

    await sendPushToSubscription(subscriptions, {
      title: "⚠️ Streak at Risk!",
      body: "Your streak is about to break. Complete today's quests before reset.",
      tag: "streak-warning"
    });
  } catch (error) {
    console.error(error);
  }
});
