import { getAllQuestsService, newCustomQuestService, updateQuestService, deleteQuestService, updateQuestService } from "../services/admin.service.js";

export const getAllQuestsController = async (req, res, next) => {
    try {
        const result = await getAllQuestsService();

        res.status(200).json(result)
    } catch (error) {
        next(error);
    }
}

export const newCustomQuestController = async (req, res, next) => {
    try {
        const questInfo = req.body;
        const result = await newCustomQuestService(questInfo);

        res.status(200).json(result)
    } catch (error) {
        next(error);
    }
}

export const updateQuestController = async (req, res, next) => {
    try {
        const questId = req.params;
        const {name, base_amount, increment, xp_gain} = req.body;
        const result = await updateQuestService(questId, {name, base_amount, increment, xp_gain, unit});

        res.status(200).json(result)
    } catch (error) {
        next(error);
    }
}

export const deleteQuestController = async (req, res, next) => {
    try {
        const {questId} = req.params;
        const result = await deleteQuestService(questId);

        res.status(200).json(result)
    } catch (error) {
        next(error);
    }
}

export const unassignUserQuestController = async (req, res, next) => {
    try {
        const {userId, questId} = req.body;
        const result = await unassignUserQuestService(userId, questId);

        res.status(200).json(result)
    } catch (error) {
        next(error);
    }
}