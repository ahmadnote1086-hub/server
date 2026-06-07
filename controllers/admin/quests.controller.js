import { getAllQuestsService, addQuestService, removeQuestService } from "../../services/admin/quests.service.js";

const getAllQuestsController = async (req, res) => {
    try {
        const result = await getAllQuestsService();

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

const addQuestController = async (req, res) => {
    const {
        name, category, base_amount, unit,
        increment, max_reps,
        xp_gain, coins,
        duration,
        target_type, target_value
    } = req.body;

    const type = req.params.type;

    try {
        const result = await addQuestService(
            name, type, category, base_amount, unit,
            increment, max_reps,
            xp_gain, coins,
            duration,
            target_type, target_value
        );

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
};

const removeQuestController = async (req, res) => {
    const questId = req.params.id;

    try {
        const result = await removeQuestService(questId);

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
};

export {
    getAllQuestsController,
    addQuestController,
    removeQuestController
}