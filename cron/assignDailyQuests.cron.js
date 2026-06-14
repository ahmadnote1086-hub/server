import cron from "node-cron";
import moment from "moment-timezone";
import { assignDailyQuests } from "../services/quests.service.js";
import {
  fetchAllUsers,
  fetchUserStats,
  resetStreak,
} from "../models/user.model.js";
import {
  assignDailyCustomQuestsModel,
  checkQuestsAssignedToday,
  getQuestsModelByDate,
} from "../models/quests.model.js";
import { deleteOldNotificationsModel } from "../models/admin/notifications.model.js";

cron.schedule("0 * * * *", async () => {
  try {
    const users = await fetchAllUsers();
    
    for (const user of users) {
      try {
        const alreadyAssigned = await checkQuestsAssignedToday(
          user.user_id,
          user.timezone,
        );

        const stats = await fetchUserStats(user.user_id);

        if (!alreadyAssigned && stats.hp > 0) {
          const yesterday = moment()
            .tz(user.timezone)
            .subtract(1, "day")
            .format("YYYY-MM-DD");
          const quests = await getQuestsModelByDate(
            user.user_id,
            user.timezone,
            yesterday,
          );

          const lastUsed = stats.recovery_last_used
            ? moment(stats.recovery_last_used)
                .tz(user.timezone)
                .format("YYYY-MM-DD")
            : null;
          const isRecoveryActive = yesterday === lastUsed;

          const hasQuests = quests.mainQuests.length > 0;

          if (hasQuests) {
            const allCompleted = quests.mainQuests.every((q) => q.is_completed);

            if (!allCompleted && !isRecoveryActive) {
              await resetStreak(user.user_id);
            }
          }

          await assignDailyQuests(user.user_id, user.timezone);
          await assignDailyCustomQuestsModel(user.user_id, user.timezone);
        }
      } catch (error) {
        console.error(
          `Failed to assign quest for user ${user.user_id}:`,
          error,
        );
        // Task: Log to an error tracking system
      }
    }

    await deleteOldNotificationsModel();
  } catch (error) {
    console.error(
      "Cron job failed to fetch users or process assignments:",
      error,
    );
    // Task: Notify me
  }
});