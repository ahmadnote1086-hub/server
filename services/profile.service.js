import {
  fetchUserById,
  fetchUserStats,
  updateName,
  getGlobalRankingModel,
  getGlobalRankForUserModel,
  resetUserStatsModel,
  changeAvatarModel,
  changeTitleModel,
  fetchUnlockedTitlesModel,
} from "../models/user.model.js";
import {
  assignMainQuestsModel,
  assignSideQuestsModel,
  deleteUserCustomQuestModel,
  getQuestsModel,
  resetUserQuestModel,
} from "../models/quests.model.js";
import { throwErr } from "../utils/error.utils.js";
import { addReviewModel } from "../models/review.model.js";
import { getReminderTime } from "../models/pushNotifications.model.js";
import moment from "moment-timezone";
import { shouldAssignDailyQuests } from "../utils/trainingSchedule.js";

// Fetch's a user profile
export const getUserProfileService = async (user) => {
  const [userData, stats, globalRank, reminderTime] = await Promise.all([
    fetchUserById(user.id),
    fetchUserStats(user.id),
    getGlobalRankForUserModel(user.id),
    getReminderTime(user.id)
  ]);

  if (!userData || !stats) {
    throwErr("Users stats not found!", 404);
  }

  let quests = await getQuestsModel(user.id, user.timezone);
  const needsMainQuests = quests.mainQuests.length === 0;
  const needsSideQuests = quests.sideQuests.length === 0;

  if (needsMainQuests) {
    if (shouldAssignDailyQuests(user.timezone, userData.training_days)) {
      await assignMainQuestsModel(user.id, user.timezone);
    }
  }

  if (needsSideQuests) {
    await assignSideQuestsModel(user.id, user.timezone);
  }

  if (needsMainQuests || needsSideQuests) {
    quests = await getQuestsModel(user.id, user.timezone);
  }

  const { mainQuests, sideQuests, customQuests } = quests;

  const today = moment.tz(user.timezone).startOf("day").format("YYYY-MM-DD");
  const recovery_date = stats.recovery_last_used
    ? moment.tz(stats.recovery_last_used, user.timezone).format("YYYY-MM-DD")
    : null;
  const isRecoveryActive = recovery_date === today;

  const formatedReminderTime = reminderTime?.slice(0, 5);

  return {
    message: "Profile fetched successfully!",
    success: true,
    profile: {
      ...userData,
      reminderTime: formatedReminderTime,
      stats: {
        ...stats,
        requiredXp: stats.level * 100 + (stats.level - 1) * 50, // TODO: save level logic in a seperate file
        globalRank,
        isRecoveryActive,
      },
    },
    quests: {
      main: mainQuests,
      side: sideQuests,
      custom: customQuests,
    }
  };
};

// Fetch titles acheived by the user
export const fetchUnlockedTitlesService = async (userId) => {
  const titles = await fetchUnlockedTitlesModel(userId);

  return {
    succss: true,
    message: "Unlocked Titles fetched successfully",
    titles,
  };
};

// Update or edit user profile
export const updateUserProfileService = async (user, newFullName) => {
  const updated = await updateName(user.id, newFullName);

  if (!updated) {
    throwErr("User not found", 404);
  }

  return { success: true, message: "User updated successfully" };
};

// Get global ranking
export const getGlobalRankingService = async () => {
  const leaderboard = await getGlobalRankingModel();

  return {
    success: true,
    message: "Leaderboard fetched successfully",
    leaderboard,
  };
};

// Update or edit user profile
export const getReminderTimeService = async (userId) => {
  const reminderTime = await getReminderTime(userId);

  if (!reminderTime) {
    throwErr("No user found", 404);
  }

  return {
    success: true,
    message: "Reminder Time fetched successfully",
    reminderTime: reminderTime?.slice(0, 5)
  };
};

// Reset profile of the user
export const resetUserProfileService = async (userId, timezone) => {
  await resetUserStatsModel(userId);
  await resetUserQuestModel(userId);
  await deleteUserCustomQuestModel(userId);
  await assignMainQuestsModel(userId, timezone);
  await assignSideQuestsModel(userId, timezone);

  return { success: true, message: "Profile reset successfully" };
};

// Add review
export const addReviewService = async (userId, message) => {
  await addReviewModel(userId, message);

  return { success: true, message: "Profile reset successfully" };
};

// Change Avatar of the user
export const changeAvatarService = async (id, userId) => {
  await changeAvatarModel(id, userId);

  return { success: true, message: "Avatar updated successfully" };
};
// Reset profile of the user
export const changeTitleService = async (id, userId) => {
  await changeTitleModel(id, userId);

  return { success: true, message: "Title changed successfully" };
};
