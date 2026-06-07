import { getAllQuestsModel, newCustomQuestService, unassignUserQuestModel, updateQuestModel, deleteQuestModel, unassignUserQuestModel } from "../models/quests.model.js";
import { throwErr } from "../utils/error.utils.js";

export const getAllQuestsService = async () => {
  const quests = await getAllQuestsModel();
  if (!quests) throwErr("Quests not found!", 404);

  return { message: "Quests fetched successfully!", quests };
};

export const newCustomQuestService = async (questInfo) => {
  const { id } = await newCustomQuestModel(questInfo);
  if (!id) throwErr("Error Creating quest!", 404);

  return { message: "Quest created", questId: id };
};

export const updateQuestService = async (questId, questInfo) => {
  const { updated } = await updateQuestModel(questId, questInfo);
  if (!updated) throwErr("Error updating quest!", 404);

  return { message: "Quest updated", updated };
};

export const deleteQuestService = async (questId) => {
  const { deleted } = await deleteQuestModel(questId);
  if (!deleted) throwErr("Error deleting quest!", 404);

  return { message: "Quest deleted", deleted };
};

export const unassignUserQuestService = async (userId, questId) => {
  const { deleted } = await unassignUserQuestModel(userId, questId);
  if (!deleted) throwErr("Error unassigning quest!", 404);

  return { message: `Quest unassigned from user with id: ${userId}`, deleted };
};