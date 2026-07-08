import cron from "node-cron";
import moment from "moment-timezone";
import { assignDailyQuests } from "../services/quests.service.js";
import { fetchAllUsers, fetchUserStats, resetStreak } from "../models/user.model.js";
import {
  assignDailyCustomQuestsModel,
  checkCustomQuestsAssignedToday,
  checkQuestsAssignedToday,
  getQuestsModelByDate,
} from "../models/quests.model.js";

// Runs every hour
cron.schedule("0 * * * *", async () => {
  try {
    const users = await fetchAllUsers();

    for (const user of users) {
      try {
        const stats = await fetchUserStats(user.user_id);

        if (stats.hp > 0) {
          const alreadyAssigned = await checkQuestsAssignedToday(user.user_id, user.timezone);

          if (!alreadyAssigned) {
            const yesterday = moment().tz(user.timezone).subtract(1, "day").format("YYYY-MM-DD");
            const quests = await getQuestsModelByDate(user.user_id, user.timezone, yesterday);
            
            const lastUsed = stats.recovery_last_used ? moment(stats.recovery_last_used).tz(user.timezone).format("YYYY-MM-DD") : null;
            const isRecoveryActive = yesterday === lastUsed; 
            
            const hasQuests = quests.mainQuests.length > 0;
            
            if (hasQuests) {
              const allCompleted = quests.mainQuests.every((q) => q.is_completed);
              
              if (!allCompleted && !isRecoveryActive) {
                await resetStreak(user.user_id);
              }
            }
              
            await assignDailyQuests(user.user_id, user.timezone);
          }

          const customAssigned = await checkCustomQuestsAssignedToday(user.user_id, user.timezone);

          if (!customAssigned) {
            await assignDailyCustomQuestsModel(user.user_id, user.timezone);
          }
        }
      } catch (error) {
        console.error(`Failed to assign quest for user ${user.user_id}:`, error);
        // Task: Log to an error tracking system
      }
    }
  } catch (error) {
    console.error("Cron job failed to fetch users or process assignments:", error);
    // Task: Notify me
  }
});