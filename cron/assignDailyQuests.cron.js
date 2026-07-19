// TODO (Performance):
// Current implementation processes users sequentially.
// When DAU reaches ~1,000+ or the cron starts taking noticeable time,
// process users in batches (e.g. 50 per batch) using Promise.all
// while keeping batch size limited to avoid overloading MySQL.

import cron from "node-cron";
import moment from "moment-timezone";
import {
  assignDailyCustomQuests,
  assignDailyMainQuests,
  assignDailySideQuests,
} from "../services/quests.service.js";
import {
  fetchActiveUsersForQuestAssignment,
  resetStreak,
} from "../models/user.model.js";
import {
  checkQuestsAssignedToday,
  getQuestsModelByDate,
} from "../models/quests.model.js";

// Runs every hour
cron.schedule("0 * * * *", async () => {
  try {
    const users = await fetchActiveUsersForQuestAssignment();

    for (const user of users) {
      try {
        if (user.hp > 0) {
          const { mainQuestAssigned, sideQuestAssigned, customQuestAssigned } = await checkQuestsAssignedToday(user.user_id, user.timezone);

          const now = moment.tz(user.timezone);
          const todayWeekDay = now.isoWeekday();
          const yesterdayWeekDay = now.clone().subtract(1, "day").isoWeekday();
          const yesterday = now.clone().subtract(1, "day").format("YYYY-MM-DD");

          const trainingDays = user.training_days;
          const penaltyLastApplied = user.penalty_last_applied ? moment(user.penalty_last_applied).tz(user.timezone).format("YYYY-MM-DD") : null;

          // Skip users whose daily quests are already assigned
          // and whose yesterday penalty has already been processed.
          if (mainQuestAssigned && sideQuestAssigned && customQuestAssigned && penaltyLastApplied === yesterday) continue;

          if (trainingDays.includes(yesterdayWeekDay) && penaltyLastApplied !== yesterday) {
            const quests = await getQuestsModelByDate(user.user_id,user.timezone,yesterday);

            const lastUsed = user.recovery_last_used ? moment(user.recovery_last_used).tz(user.timezone).format("YYYY-MM-DD") : null;
            const isRecoveryActive = yesterday === lastUsed;

            const hasQuests = quests.mainQuests.length > 0;

            if (hasQuests) {
              const allCompleted = quests.mainQuests.every((q) => q.is_completed);

              if (!allCompleted && !isRecoveryActive) {
                await resetStreak(user.user_id, user.hp, yesterday);
              }
            }
          }

          // Check if today is the user's training day and quests are assigned
          if (!mainQuestAssigned && trainingDays.includes(todayWeekDay)) {
            await assignDailyMainQuests(user.user_id, user.timezone);
          }

          if (!sideQuestAssigned) {
            await assignDailySideQuests(user.user_id, user.timezone);
          }

          if (!customQuestAssigned) {
            await assignDailyCustomQuests(user.user_id, user.timezone);
          }
        }
      } catch (error) {
        console.error(
          `Failed to assign quest for user ${user.user_id}:`,
          error,
        );
        // Task: Log to an error tracking system
      }
    }
  } catch (error) {
    console.error(
      "Cron job failed to fetch users or process assignments:",
      error,
    );
    // Task: Notify me
  }
});