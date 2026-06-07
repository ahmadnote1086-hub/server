import { getQuestsService, getEventQuestsService, completeQuestService, getQuestsHistoryService, completeAllQuestsForTodayService, addCustomQuestService, removeCustomQuestService, updateEventProgressService } from "../services/quests.service.js";

export const getQuestsController = async (req, res) => {
    try {
        const user = req.user;

        const result = await getQuestsService(user.id, user.timezone);

        res.status(200).json(result);
    } catch (error) {
        console.log('error', error.message);
        res.status(error.status || 500).json({success: false, message: error.message || "Something went wrong"})
    }
}

export const getEventQuestsController = async (req, res) => {
    try {
        const user = req.user;

        const result = await getEventQuestsService(user.id);

        res.status(200).json(result);
    } catch (error) {
        console.log('error', error.message);
        res.status(error.status || 500).json({success: false, message: error.message || "Something went wrong"})
    }
}

export const getQuestsHistoryController = async (req, res) => {
    try {
        const user = req.user;

        const result = await getQuestsHistoryService(user.id, user.timezone);

        res.status(200).json(result);
    } catch (error) {
        console.log('error', error.message);
        res.status(error.status || 500).json({success: false, message: error.message || "Something went wrong"})
    }
}

export const completeQuestController = async (req, res) => {
    try {
        const { quest_id } = req.params;
        const user = req.user;
        const {userQuestId} = req.body;

        const result = await completeQuestService(user.id, quest_id, userQuestId, user.timezone);

        res.status(200).json(result);
    } catch (error) {
        console.log('error', error.message);
        res.status(error.status || 500).json({success: false, message: error.message || "Something went wrong"})
    }
}

export const completeAllQuestsForTodayController = async (req, res) => {
    try {
        const { type } = req.params;
        const user = req.user;

        const result = await completeAllQuestsForTodayService(user.id, type, user.timezone);

        res.status(200).json(result);
    } catch (error) {
        console.log('error', error.message);
        res.status(error.status || 500).json({success: false, message: error.message || "Something went wrong"})
    }
}

export const addCustomQuestController = async (req, res) => {
    try {
        const user = req.user;
        const { name, unit, reps, category } = req.body;

        const result = await addCustomQuestService(user.id, user.timezone, name, unit, reps, category);

        res.status(200).json({success: result.success, message: "Custom quest added!", questId: result.questId});
    } catch (error) {
        console.log('error', error.message);
        res.status(error.status || 500).json({success: false, message: error.message || "Something went wrong"})
    }
}

export const removeCustomQuestController = async (req, res) => {
    try {
        const user = req.user;
        const { questId } = req.params;

        const result = await removeCustomQuestService(user.id, user.timezone, questId);

        res.status(200).json({success: result.success, message: "Custom quest removed!" });
    } catch (error) {
        console.log('error', error.message);
        res.status(error.status || 500).json({success: false, message: error.message || "Something went wrong"})
    }
}

export const updateEventProgressController = async (req, res) => {
    try {
        const { quest_id } = req.params;
        const { progress } = req.body;
        const { timezone, id } = req.user;

        if (!progress || progress <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid progress value"
            });
        }

        const result = await updateEventProgressService(quest_id, progress, timezone, id);
        
        if (result.quest.is_completed === 1) {
            return res.status(200).json({
                success: true,
                message: "Quest completed!",
                quest: result.quest
            });
        }

        res.status(200).json({ success: true, message: "Progress updated!", quest: result.quest });
    } catch (error) {
        console.log('error', error.message);
        res.status(error.status || 500).json({success: false, message: error.message || "Something went wrong"})
    }
}