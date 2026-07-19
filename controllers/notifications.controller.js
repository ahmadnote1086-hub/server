import { getAllNotificationsService, deleteNotificationService, readNotificationService, readAllNotificationsService, getHasReadService } from "../services/notifications.service.js";

const getAllNotificationsController = async (req, res) => {
    try {
        const result = await getAllNotificationsService(req.user.id);

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

const getHasReadController = async (req, res) => {
    try {
        const result = await getHasReadService(req.user.id);

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

const deleteNotificationController = async (req, res) => {
    try {
        const result = await deleteNotificationService(req.params.id);

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

const readNotificationController = async (req, res) => {
    try {
        const result = await readNotificationService(req.params.id);

        return res.json(result);
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

const readAllNotificationsController = async (req, res) => {
    const id = req.user.id;

    try {
        const result = await readAllNotificationsService(id); 

        return res.json(result);
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

export {
    getAllNotificationsController,
    deleteNotificationController,
    readNotificationController,
    readAllNotificationsController,
    getHasReadController,
}