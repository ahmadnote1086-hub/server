import { updateReminderTimeModel } from "../models/pushNotifications.model.js";
import { updateNameModel, updateUsernameModel, updateTrainingPlanModel } from "../models/user.model.js";
import { throwErr } from "../utils/error.utils.js";

export const updateNameService = async (newName, userId) => {
    newName = newName.trim();
    
    if (newName.length < 2 || newName.length > 50) {
        throwErr("Full name must be between 2 and 50 characters.", 400);
    }

    const result = await updateNameModel(newName, userId);

    return result;
}

export const updateUsernameService = async (newUsername, userId) => {
    if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
        throwErr(
            "Username must be 3-25 characters and contain only letters, numbers, and underscores.",
            400
        );
    }
    
    const result = await updateUsernameModel(newUsername, userId);

    return result;
}

export const updateReminderTimeService = async (reminderTime, userId, timezone) => {
    if (!reminderTime) {
        throwErr("No Reminder time provided.", 400);
    }
    
    const result = await updateReminderTimeModel(reminderTime, userId, timezone);

    return result;
}

export const updateTrainingPlanService = async (trainingDays, id, timezone) => {
    if (!Array.isArray(trainingDays) || trainingDays.length < 3) {
        throwErr("No training days provided.", 400);
    }
    
    await updateTrainingPlanModel(trainingDays, id, timezone);

    return true;
}