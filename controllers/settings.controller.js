import { updateNameService, updateUsernameService } from "../services/settings.service.js";

export const updateNameController = async (req, res, next) => {
    const { fullName } = req.body;
    const userId = req.user.id;
    try {
        await updateNameService(fullName, userId);

        return res.status(200).json({ success: true, message: "Name updated" })
    } catch (error) {
        next(error);
    }
}

export const updateUsernameController = async (req, res, next) => {
    const { username } = req.body;
    const userId = req.user.id;

    try {
        await updateUsernameService(username, userId);

        return res.status(200).json({ success: true, message: "Username updated" })
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Username already taken"
            });
        }

        next(error);
    }
}