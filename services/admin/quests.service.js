import { getAllQuestsModel, addQuestsModel, removeQuestsModel } from "../../models/admin/quests.model.js";

const getAllQuestsService = async () => {
    const quests = await getAllQuestsModel();

    return { quests, message: "All quests fetched successfully!" };
}

const addQuestService = async (
    name, type, category, base_amount, unit,
    increment, max_reps,
    xp_gain, coins,
    duration,
    target_type, target_value,
    description
) => {

    let endsAt = null;

    if (type === "event") {
        const now = new Date();

        let hours = 24;
        if (duration === '48h') hours = 48;
        if (duration === '7d')  hours = 168;

        endsAt = new Date(now.getTime() + hours * 60 * 60 * 1000);
    }

    const quest = await addQuestsModel(
        name, type, category, base_amount, unit,
        increment, max_reps,
        xp_gain, coins,
        target_type, target_value,
        description,
        endsAt
    );

    return { quest, message: "Quest added successfully!" };
};

const removeQuestService = async (questId) => {
    await removeQuestsModel(questId);

    return { questId: questId, message: "Quest removed successfully!" };
};

export {
    getAllQuestsService,
    addQuestService,
    removeQuestService
}