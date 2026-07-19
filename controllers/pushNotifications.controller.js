import { createSubscription, deletePushSubscription } from "../models/pushNotifications.model.js";

export const subscribeNotificationsController = async (req, res) => {
    const id = req.user.id;
    const timezone = req.user.timezone;
    const { endpoint, keys } = req.body;

    try {
        const result = await createSubscription(id, endpoint, keys.p256dh, keys.auth, timezone);

        return res.json({ message: "Subscription saved" });
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

export const unSubscribeNotificationsController = async (req, res) => {
    const { endpoint } = req.body;
    const userId = req.user.id;

    try {
        await deletePushSubscription(endpoint, userId);

        return res.json({ message: "Subscription deleted" });
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}