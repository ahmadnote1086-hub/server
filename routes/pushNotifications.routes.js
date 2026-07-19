import { Router } from "express";
import { subscribeNotificationsController, unSubscribeNotificationsController } from "../controllers/pushNotifications.controller.js";

const router = Router();

router.post("/subscribe", subscribeNotificationsController); // Push Notification
router.post("/unsubscribe", unSubscribeNotificationsController); // Push Notification

export default router;