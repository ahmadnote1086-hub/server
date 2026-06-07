import {
  getRecentNotificationsModel,
  sendNotificationModel,
} from "../../models/admin/notifications.model.js";

const getRecentNotificationsService = async (req, res) => {
  const notifications = await getRecentNotificationsModel();

  return { notifications, message: "All notifications fetched successfully!" };
};

const sendNotificationService = async (payload) => {
  const success = await sendNotificationModel(payload);

  return { success, message: "Notification sent!" };
};

export { getRecentNotificationsService, sendNotificationService };
