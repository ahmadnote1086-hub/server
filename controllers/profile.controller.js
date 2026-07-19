import {
  getUserProfileService,
  updateUserProfileService,
  getGlobalRankingService,
  resetUserProfileService,
  addReviewService,
  changeAvatarService,
  changeTitleService,
  fetchUnlockedTitlesService,
  getReminderTimeService
} from "../services/profile.service.js";

export const getUserProfileController = async (req, res) => {
  try {
    const user = req.user;
    const result = await getUserProfileService(user);

    res.status(200).json({
      message: result.message,
      profile: result.profile,
      quests: result.quests,
    });
  } catch (error) {
    console.log(error);
    res.status(error.status || 500).json(error);
  }
};

export const fetchUnlockedTitlesController = async (req, res) => {
  try {
    const user = req.user;
    const result = await fetchUnlockedTitlesService(user.id);

    res.status(200).json({
      message: result.message,
      titles: result.titles,
    });
  } catch (error) {
    console.log(error);
    res.status(error.status || 500).json(error);
  }
};

export const updateUserProfileController = async (req, res) => {
  try {
    const { fullName } = req.body;
    const user = req.user;

    const trimmedName = fullName?.trim();

    if (!trimmedName) {
      return res
        .status(400)
        .json({ success: false, message: "Full name is required" });
    }

    const result = await updateUserProfileService(user, fullName);

    res.status(200).json({ message: result.message });
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
};

export const getGlobalRankingController = async (req, res) => {
  try {
    const result = await getGlobalRankingService();

    res
      .status(200)
      .json({ message: result.message, leaderboard: result.leaderboard });
  } catch (error) {
    console.log(error);
    res.status(error.status || 500).json(error);
  }
};

export const getReminderTimeController = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await getReminderTimeService(userId);

        return res.json({ reminderTime: result.reminderTime, message: "Reminder Time fetched successfully" });
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

export const resetUserProfileController = async (req, res) => {
  try {
    const user = req.user;

    await resetUserProfileService(user.id);
    const result = await getUserProfileService(user);

    res.status(200).json({
      message: result.message,
      profile: result.profile,
      quests: result.quests,
    });
  } catch (error) {
    console.log(error);
    res.status(error.status || 500).json(error);
  }
};

export const addReviewController = async (req, res) => {
  try {
    const user = req.user;
    const { message } = req.body;

    if (!message || message.trim() === "") {
      res.status(200).json({
        success: false,
        message: "Message was empty",
      });
    }

    const result = await addReviewService(user.id, message);

    res.status(200).json({
      message: result.message,
      success: result.success,
    });
  } catch (error) {
    console.log(error);
    res.status(error.status || 500).json(error);
  }
};

export const changeAvatarController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!id) {
      res.status(401).json({
        success: false,
        message: "Id not provided",
      });
    }

    const result = await changeAvatarService(id, user.id);

    res.status(200).json({
      message: result.message,
      success: result.success,
    });
  } catch (error) {
    console.log(error);
    res.status(error.status || 500).json(error);
  }
};

export const changeTitleController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!id) {
      res.status(401).json({
        success: false,
        message: "Id not provided",
      });
    }

    const result = await changeTitleService(id, user.id);

    res.status(200).json({
      message: result.message,
      success: result.success,
    });
  } catch (error) {
    console.log(error);
    res.status(error.status || 500).json(error);
  }
};