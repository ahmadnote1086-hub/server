import cron from "node-cron";
import db from "../db/mysqlConfig.js";
import { fetchDueReminderUsers } from "../models/pushNotifications.model.js";
import { sendPushToSubscription } from "../services/pushNotifications.service.js";
import moment from "moment-timezone";
import { getNextTrainingReminder } from "../utils/trainingSchedule.js";

// Runs every 15 minutes

// TODO: Refactor it after creating weeks in days feature
cron.schedule("*/15 * * * *", async () => {
  try {
    const users = await fetchDueReminderUsers();

    if (users.length === 0) return;

    const subscriptions = users.map((user) => ({
      endpoint: user.endpoint,
      keys: {
        p256dh: user.p256dh,
        auth: user.auth,
      },
    }));

    await sendPushToSubscription(subscriptions, {
      title: "⚔️ Daily Quest Reminder",
      body: "The System has assigned your daily training.",
      tag: "daily-reminder",
    });

    const uniqueUsers = [
      ...new Map(users.map((user) => [user.user_id, user])).values(),
    ];

    for (const user of uniqueUsers) {
      const now = moment.tz(user.timezone);
      const trainingDays = user.training_days;

      const nextReminder = getNextTrainingReminder(now, user.reminder_time, trainingDays);

      await db.query(
        `
            UPDATE notification_settings
            SET next_reminder_at = ?
            WHERE user_id = ?
        `,
        [nextReminder.utc().format("YYYY-MM-DD HH:mm:ss"), user.user_id],
      );
    }
  } catch (error) {
    console.log(error);
  }
});
