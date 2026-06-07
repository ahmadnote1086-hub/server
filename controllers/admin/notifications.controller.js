import { getRecentNotificationsService, sendNotificationService } from "../../services/admin/notifications.service.js";

const getRecentNotificationsController = async (req, res) => {
    try {
        const result = await getRecentNotificationsService();

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

const sendNotificationController = async (req, res) => {
    const payload = req.body;
    
    try {
        const result = await sendNotificationService(payload);

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

export {
    getRecentNotificationsController,
    sendNotificationController,
}