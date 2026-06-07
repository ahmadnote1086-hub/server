import { fetchUserById, fetchUserStats, updateName, getGlobalRankingModel, getGlobalRankForUserModel, resetUserStatsModel, changeAvatarModel  } from "../models/user.model.js";
import { assignDailyQuestsModel, deleteUserCustomQuestModel, getQuestsModel, resetUserQuestModel } from "../models/quests.model.js";
import { throwErr } from "../utils/error.utils.js";
import { addReviewModel } from "../models/review.model.js";
import moment from "moment-timezone";
// import { assignDailyQuests } from "./quests.service.js"; // remove in deployment

// Fetch's a user profile
export const getUserProfileService = async (user) => {
  const userData = await fetchUserById(user.id)
    const stats = await fetchUserStats(user.id);
    // await assignDailyQuests(user.id); // remove in deployment
    const { mainQuests, sideQuests, customQuests } = await getQuestsModel(user.id, userData.timezone);

    const globalRank = await getGlobalRankForUserModel(user.id);

    const today = moment.tz(userData.timezone).startOf("day").format("YYYY-MM-DD");
    const recovery_date = stats.recovery_last_used ? moment.tz(stats.recovery_last_used, userData.timezone).format("YYYY-MM-DD") : null;
    const isRecoveryActive = recovery_date === today;

    const {stats_id, user_id, ...safeStats} = stats;
    
    if (!userData || !stats) {
      throwErr("Users stats not found!", 404);
    }

    return {
      message: "Stats fetched successfully!",
      success: true,
      profile: {  
        ...userData,
        stats: {
          ...safeStats,
          requiredXp: stats.level * 100 + (stats.level - 1) * 50,
          globalRank,
          isRecoveryActive
        },
      },
      quests: {
        main: mainQuests,
        side: sideQuests,
        custom: customQuests
      }
    };
};

// Update or edit user profile
export const updateUserProfileService = async (user, newFullName) => {
    const updated = await updateName(user.id, newFullName)

    if (!updated) {
      throwErr("User not found", 404);
    }

    return { success: true,message: "User updated successfully" };
}

// Update or edit user profile
export const getGlobalRankingService = async () => {
    const leaderboard = await getGlobalRankingModel()

    return { success: true, message: "Leaderboard fetched successfully", leaderboard };
}

// Reset profile of the user
export const resetUserProfileService = async (userId, timezone) => {
    await resetUserStatsModel(userId);
    await resetUserQuestModel(userId);
    await deleteUserCustomQuestModel(userId);
    await assignDailyQuestsModel(userId, timezone);

    return { success: true, message: "Profile reset successfully" };
}

// Reset profile of the user
export const addReviewService = async (userId, message) => {
    await addReviewModel(userId, message);

    return { success: true, message: "Profile reset successfully" };
}

// Reset profile of the user
export const changeAvatarService = async (id, userId) => {
  await changeAvatarModel(id, userId);

  return { success: true, message: "Avatar updated successfully" };
}
