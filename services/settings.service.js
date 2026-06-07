import { updateNameModel, updateUsernameModel } from "../models/user.model.js";
import { throwErr } from "../utils/error.utils.js";

export const updateNameService = async (newName, userId) => {
    const result = await updateNameModel(newName, userId);

    return result;
}

export const updateUsernameService = async (newUsername, userId) => {
    const result = await updateUsernameModel(newUsername, userId);

    return result;
}