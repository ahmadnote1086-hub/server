import { Router } from "express";
import { getRecentNotificationsController, sendNotificationController } from "../../controllers/admin/notifications.controller.js";

const router = Router();

router.get("/recent", getRecentNotificationsController);
router.post("/send", sendNotificationController);

export default router;