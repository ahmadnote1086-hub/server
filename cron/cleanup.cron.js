import cron from "node-cron";
import { deleteOldNotificationsModel } from "../models/admin/notifications.model.js";

// Runs at 3:10AM
cron.schedule("10 3 * * *", async () => {
  try {
    await deleteOldNotificationsModel();
  } catch (error) {
    console.log(error);
  }
});
