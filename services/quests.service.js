import { completeQuestModel, getQuestsModel, getEventQuestsModel, updateStatsModel, assignDailyQuestsModel, getQuestsHistoryModel, completeAllQuestsForTodayModal, addCustomQuestModel, assignCustomQuestModel, removeCustomQuestModel, unAssignCustomQuestModel, updateEventProgressModel } from "../models/quests.model.js";
import { updateStreak } from "../models/user.model.js";
import { throwErr } from "../utils/error.utils.js";

// Fetch all the quests for a user according to there timezone
export const getQuestsService = async (userId, timezone) => {
  const quests = await getQuestsModel(userId, timezone);

  if (!quests || quests.length === 0) {
    throwErr("No quests found for today", 404);
  }

  return { quests: { main: quests.mainQuests, side: quests.sideQuests, custom: quests.customQuests } };
};

// Fetch all the event quests for a user according to there timezone
export const getEventQuestsService = async (userId) => {
  const quests = await getEventQuestsModel(userId);

  if (!quests || quests.length === 0) {
    throwErr("No quests found for today", 404);
  }

  return { event: quests.eventQuests, message: "Event quests fetched successfully!" };
};

// Get all the quests History of a user
export const getQuestsHistoryService = async (userId, timezone) => {
  const questHistory = await getQuestsHistoryModel(userId, timezone);

  if (!questHistory || questHistory.length === 0) {
    throwErr("No quests history found", 404);
  }

  return { success: true, questHistory };
};

// Marks a user's quest as completed for today
export const completeQuestService = async (userId, questId, userQuestId, timezone) => {
  const {xpReward, coinReward, areMainQuestsCompleted} = await completeQuestModel(userId, userQuestId, timezone);

  if (areMainQuestsCompleted) {
    updateStreak(userId);
  }
  
  await updateStatsModel(userId, timezone, xpReward, coinReward);

  return { success: true, message: "Quest marked completed", quest_id: questId };
};

// Marks a user's quest as completed for today
export const completeAllQuestsForTodayService = async (userId, type, timezone) => {
  const { xpReward, coinReward } = await completeAllQuestsForTodayModal(userId, type, timezone);
  if (type === 'main') {
    updateStreak(userId);
  }

  await updateStatsModel(userId, timezone, xpReward, coinReward);

  return { success: true, message: `All ${type} quests are completed`, };
};

// Assign tasks to each user daily.
export const assignDailyQuests = async (userId, timezone) => {
  const success = await assignDailyQuestsModel(userId, timezone);

  if (!success) {
    throw new Error('Quests not found!');
  }

  return { success: true };
};

// Assign tasks to each user daily.
export const addCustomQuestService = async (userId, timezone, name, unit, reps, category) => {
  const questId = await addCustomQuestModel(userId, name, unit, reps, category, timezone);
  if (!questId) {
    throwErr("Quest creation failed");
  }

  const assigned = await assignCustomQuestModel(userId, timezone, questId);

  if (!assigned) {
    throw new Error('Quest created but not assigned');
  }

  return { success: true, questId };
};

// Remove custom Quest.
export const removeCustomQuestService = async (userId, timezone, questId) => {
  await unAssignCustomQuestModel(userId, questId);
  await removeCustomQuestModel(userId, questId, timezone);

  return { success: true };
};

// Update Event progress.
export const updateEventProgressService = async (uep_id, progress, timezone, id) => {
  const quest = await updateEventProgressModel(uep_id, progress, id);

  if (!quest) {
    return {
      success: false,
      message: "Quest not found"
    };
  }

  if (quest.is_completed) {
    await updateStatsModel(id, timezone, quest.xp_gain, quest.coins);
  }
  return { success: true, quest };
};
