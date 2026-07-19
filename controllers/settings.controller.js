import {
  updateNameService,
  updateReminderTimeService,
  updateUsernameService,
  updateTrainingPlanService,
} from "../services/settings.service.js";

export const updateNameController = async (req, res, next) => {
  const { fullName } = req.body;
  const userId = req.user.id;
  try {
    await updateNameService(fullName, userId);

    return res.status(200).json({ success: true, message: "Name updated" });
  } catch (error) {
    next(error);
  }
};

export const updateUsernameController = async (req, res, next) => {
  const { username } = req.body;
  const userId = req.user.id;

  try {
    await updateUsernameService(username, userId);

    return res.status(200).json({ success: true, message: "Username updated" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Username already taken",
      });
    }

    next(error);
  }
};

export const updateReminderTimeController = async (req, res, next) => {
  const { reminderTime } = req.body;
  const { id, timezone } = req.user;

  try {
    await updateReminderTimeService(reminderTime, id, timezone);

    return res
      .status(200)
      .json({ success: true, message: "Reminder Time updated" });
  } catch (error) {
    next(error);
  }
};

export const updateTrainingPlanController = async (req, res, next) => {
  const { trainingDays } = req.body;
  const { id, timezone } = req.user;

  console.log(trainingDays);
  try {
    await updateTrainingPlanService(trainingDays, id, timezone);

    return res
      .status(200)
      .json({ success: true, message: "Training plan updated." });
  } catch (error) {
    next(error);
  }
};
