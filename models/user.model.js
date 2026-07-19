import moment from "moment-timezone";
import { TITLES } from "../config/titles.js";
import db from "../db/mysqlConfig.js";
import { sendPushNotification } from "../services/pushNotifications.service.js";
import { unlockTitle } from "../services/title.service.js";
import { throwErr } from "../utils/error.utils.js";
import { getNextTrainingReminder } from "../utils/trainingSchedule.js";

/**
 * Creates a new user and inserts default stats for the user
 *
 * @param {string} email - user's email
 * @param {string} username - user's username
 * @param {string} fullname - user's full name
 * @param {string} hashedPassword - Hashed password
 * @param {string} timezone - user's timezone
 * @returns {Promise<{ id: int, email: string, fullname: string, username: string, timezone: string }>} - an object containing user's id, email, fullname and username
 */
const createUser = async (
  email,
  username,
  fullname,
  hashedPassword,
  timezone,
) => {
  try {
    const [result] = await db.query(
      `INSERT INTO users (email, username, fullname, password, timezone) VALUES (?, ?, ?, ?, ?)`,
      [email, username, fullname, hashedPassword, timezone],
    );
    if (result.affectedRows === 0) throwErr("Email already taken", 409);

    await db.query("INSERT INTO stats (user_id) VALUES (?)", [result.insertId]);
    return { id: result.insertId, email, fullname, username, timezone };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throwErr("Email already taken", 409);
    }
    throw err;
  }
};

/**
 * Fetches all the users from database whose hp is greater than 0
 *
 * @returns {Promise<Array<object>>} - An array of user objects
 */
const fetchActiveUsersForQuestAssignment = async () => {
  const [users] = await db.query(`
    SELECT 
      u.user_id,
      u.timezone,
      s.recovery_last_used,
      s.hp,
      training_days,
      penalty_last_applied
    FROM users u
    JOIN stats s
    ON u.user_id = s.user_id
    WHERE s.hp > 0
  `);

  return users;
};

/**
 * Fetches a user by email from database
 *
 * @param {string} email - User's email
 * @returns {Promise<object|null>} - A user object if found, otherwise null
 */
const fetchUserByEmail = async (email) => {
  const [users] = await db.query(`SELECT * FROM users WHERE email = ?`, [
    email,
  ]);

  return users[0];
};

/**
 * Fetches a user by id from database
 *
 * @param {int} id - User's id
 * @returns {Promise<object|null>} - A user object if found, otherwise null
 */
const fetchUserById = async (id) => {
  const [users] = await db.query(
    `
    SELECT 
      user_id,
      email, 
      username, 
      fullname, 
      timezone, 
      avatar, 
      username_changed_at, 
      training_days,
      training_days_last_changed
    FROM users 
    WHERE user_id = ?`,
    [id],
  );

  if (users.length === 0) throwErr("User not found", 404);

  return users[0];
};

/**
 * Fetches stats of a user from database
 *
 * @param {int} userId - id of the user
 * @returns {Promise<object|null>} - A stats object if found, otherwise null
 */
const fetchUserStats = async (userId) => {
  const [stats] = await db.query(
    `
  SELECT
    stats_id,
    xp,
    total_xp,
    level,
    player_rank,
    title_id,
    hp,
    streak,
    highest_streak,
    coins,
    last_completed,
    recovery_last_used
  FROM stats
  WHERE user_id = ?
  `,
    [userId],
  );

  return stats[0];
};

/**
 * Fetches unlocked titles of a user
 *
 * @param {int} userId - id of the user
 * @returns {Promise<object|null>} - A title object if found, otherwise null
 */
const fetchUnlockedTitlesModel = async (userId) => {
  const [titles] = await db.query(
    `
    SELECT title_id 
    FROM user_titles 
    WHERE user_id = ?
    ORDER BY unlocked_at DESC
    `,
    [userId],
  );

  titles.push({ title_id: "player" });

  return titles;
};

/**
 * Update name of the user
 *
 * @param {int} userId - User's id
 * @param {string} newfullname - New full name
 * @returns {Promise<{success: boolean} | null>} - Object with success flag or null if no rows were affected
 */
const updateName = async (userId, newfullname) => {
  const [result] = await db.query(
    `UPDATE users SET fullname = ? WHERE user_id = ?`,
    [newfullname, userId],
  );

  if (result.affectedRows === 0) return null;

  return { success: true };
};

/**
 * Update streak of the user
 *
 * @param {int} userId - User's id
 * @returns {Promise<{success: boolean} | null>} - Object with success flag or null if no rows were affected
 */
const updateStreak = async (userId) => {
  const [result] = await db.query(
    `UPDATE stats 
    SET streak = streak + 1, 
      highest_streak = GREATEST(highest_streak, streak)
      WHERE user_id = ?`,
    [userId],
  );

  if (result.affectedRows === 0) return null;

  const [statsRows] = await db.query(
    `SELECT streak FROM stats WHERE stats.user_id = ?`,
    [userId],
  );

  const currentStreak = statsRows[0]?.streak;

  const globalRank = await getGlobalRankForUserModel(userId);
  await unlockTitle("streak", userId, currentStreak);
  await unlockTitle("leaderboard", userId, globalRank);

  return true;
};

/**
 * Resets the user's streak, decreases HP by 1 and records the penalty date.
 *
 * @param {number} userId - User's ID.
 * @param {number} oldHp - User's HP before the penalty.
 * @param {string} yesterday - Date (YYYY-MM-DD) for which the penalty is applied.
 * @returns {Promise<boolean|null>}
 */
const resetStreak = async (userId, oldHp, yesterday) => {
  const [result] = await db.query(
    `UPDATE stats 
    SET streak = 0, 
      hp = hp - 1,
      penalty_last_applied = ?
      WHERE user_id = ?`,
    [yesterday, userId],
  );

  if (result.affectedRows === 0) return null;

  const newHp = oldHp - 1;

  await sendPushNotification(userId, {
    title: "💀 Streak Lost!",
    body: "Your streak has been reset. Complete quests daily to rebuild your progress.",
    icon: "/android-chrome-192x192.png",
    tag: "streak-reset"
  });

  // Send hp warning when new hp is less than 2
  if (newHp === 2) {
    await sendPushNotification(userId, {
      title: "⚠️ Critical HP Warning!",
      body: "Your HP is critically low. Buy an HP Potion from the Shop to recover your HP.",
      icon: "/android-chrome-192x192.png",
      tag: "critical-hp"
    });
  } else if (newHp === 1) {
    await sendPushNotification(userId, {
      title: "⚠️ System Warning!",
      body: "Your HP is critically low. Another failure may cause severe progress penalties. Recover your HP immediately.",
      icon: "/android-chrome-192x192.png",
      tag: "last-hp"
    });
  }

  return true;
};

/**
 * Fetch the global leaderboard
 *
 * @returns {Promise<{leaderboard: Object} | null>} - Object with success flag or null if no rows were affected
 */
const getGlobalRankingModel = async () => {
  const [result] = await db.query(
    `SELECT 
      u.user_id,
      u.fullName, 
      u.username, 
      u.avatar,
      s.player_rank, 
      s.level, 
      s.total_xp, 
      s.streak,
      s.highest_streak,
      s.title_id,
      ROW_NUMBER() OVER (ORDER BY s.total_xp DESC, s.highest_streak DESC) AS globalRank
      FROM users AS u
      INNER JOIN stats AS s
      ON u.user_id = s.user_id  
      LIMIT 15`,
  );

  if (result.length === 0) return throwErr("No users found");

  return result;
};

/**
 * Fetch the global ranking for a user
 * @param {int} userId - id of the user
 *
 * @returns {Promise<globalRank: int>} - Global rank
 */
const getGlobalRankForUserModel = async (userId) => {
  const [result] = await db.query(
    `SELECT COUNT(*) + 1 AS globalRank
    FROM stats s1
    WHERE 
      s1.total_xp > (
        SELECT total_xp 
        FROM stats 
        WHERE user_id = ?
      )
      OR (
        s1.total_xp = (
          SELECT total_xp 
          FROM stats 
          WHERE user_id = ?
        ) 
        AND s1.highest_streak > (
          SELECT highest_streak 
          FROM stats 
          WHERE user_id = ?
        )
      )`,
    [userId, userId, userId],
  );

  return result[0].globalRank;
};

/**
 * Reset stats of the user
 * @param {int} userId - id of the user
 *
 * @returns {Promise<{Boolean}>} - True if rows update else false
 */
const resetUserStatsModel = async (userId) => {
  const [result] = await db.query(
    `UPDATE stats
    SET xp = 0,
      total_xp = 0,
      level = 1,
      player_rank = 'E',
      title_id = 'player',
      streak = 0,
      highest_streak = 0,
      coins = 0,
      hp = 5,
      last_completed = null
    WHERE user_id = ?`,
    [userId],
  );

  if (result.affectedRows === 0) return throwErr("No user found");

  return result.affectedRows > 0;
};

/**
 * Update user's avatar
 * @param {int} id - id of the avatar
 * @param {int} userId - id of the user
 *
 * @returns {Promise<{Boolean}>} - True if rows update else false
 */
const changeAvatarModel = async (id, userId) => {
  const [result] = await db.query(
    `UPDATE users
    SET avatar = ?
    WHERE user_id = ?`,
    [id, userId],
  );

  if (result.affectedRows === 0) return throwErr("No user found");

  return result.affectedRows > 0;
};

/**
 * Update user's title
 * @param {int} titleId - id of the title
 * @param {int} userId - id of the user
 *
 * @returns {Promise<{Boolean}>} - True if rows update else false
 */
const changeTitleModel = async (titleId, userId) => {
  if (titleId !== "player") {
    const [userTitles] = await db.query(
      `
      SELECT 1 
      FROM user_titles
      WHERE title_id = ?
      AND user_id = ?
      LIMIT 1
      `,
      [titleId, userId],
    );

    if (userTitles.length === 0) {
      throwErr("You have not unlocked this title yet!");
    }
  }

  const [result] = await db.query(
    `UPDATE stats
    SET title_id = ?
    WHERE user_id = ?`,
    [titleId, userId],
  );

  if (result.affectedRows === 0) {
    throwErr("No user found");
  }

  return result.affectedRows > 0;
};

/**
 * Change name of the user
 * @param {string} newName - New name to be registered
 * @param {int} userId - id of the user
 *
 * @returns {Promise<{Boolean}>} - True if rows update else false
 */
const updateNameModel = async (newName, userId) => {
  const [result] = await db.query(
    `UPDATE users
    SET fullname = ?
    WHERE user_id = ?`,
    [newName, userId],
  );

  if (result.affectedRows === 0) return throwErr("No user found", 404);

  return result.affectedRows > 0;
};

/**
 * Change username of the user
 * @param {string} newUsername - New username to be registered
 * @param {int} userId - id of the user
 *
 * @returns {Promise<{Boolean}>} - True if rows update else false
 */
const updateUsernameModel = async (newUsername, userId) => {
  const [[user]] = await db.query(
    `SELECT username_changed_at FROM users WHERE user_id = ?`,
    [userId],
  );

  if (!user) {
    throwErr("No user found", 404);
  }

  if (user.username_changed_at) {
    const now = new Date();
    const changedAt = new Date(user.username_changed_at);

    const diffDays = Math.floor((now - changedAt) / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      throwErr("Username can only be changed every 30 days");
    }
  }

  const [result] = await db.query(
    `UPDATE users
    SET username = ?,
      username_changed_at = NOW()
    WHERE user_id = ?`,
    [newUsername, userId],
  );

  if (result.affectedRows === 0) return throwErr("No user found", 404);

  return result.affectedRows > 0;
};


/**
 * Change Daily Reminder Time of the user
 * @param {string} reminderTime - new reminderTime string
 * @param {int} userId - id of the user
 * @param {string} timezone - timezone of the user
 *
 * @returns {Promise<{Boolean}>} - True if rows update else false
 */
const updateTrainingPlanModel = async (trainingDays, userId, timezone) => {
  if (!trainingDays?.length) return null;

  const [usersRows] = await db.query(
    `
    SELECT training_days, training_days_last_changed 
    FROM users
    WHERE user_id = ?
  `,
    [userId]
  );

  const currentTrainingDays = usersRows[0].training_days;

  if (
    JSON.stringify(currentTrainingDays) ===
    JSON.stringify(trainingDays)
  ) {
    return true;
  }
  const now = moment.utc();

  const lastChanged = usersRows[0].training_days_last_changed
    ? moment.utc(usersRows[0].training_days_last_changed)
    : null;

  if (lastChanged && now.diff(lastChanged, "days") < 7) {
    throwErr("Training schedule can only be changed once every 7 days.", 400);
  }

  const [result] = await db.query(
    `
    UPDATE users
    SET training_days = ?, training_days_last_changed = ?
    WHERE user_id = ?
  `,
    [JSON.stringify(trainingDays), now.format("YYYY-MM-DD HH:mm:ss"), userId],
  );

  if (result.affectedRows === 0) return throwErr("No user found", 404);

  const [rows] = await db.query(
    `
    SELECT reminder_time, notification_enabled
    FROM notification_settings
    WHERE user_id = ?
  `,
    [userId],
  );

  if (rows[0]?.notification_enabled) {
    const now = moment.tz(timezone);

    const nextReminder = getNextTrainingReminder(
      now,
      rows[0]?.reminder_time,
      trainingDays,
    );

    await db.query(
      `
      UPDATE notification_settings
      SET next_reminder_at = ?
      WHERE user_id = ?
      `,
      [nextReminder.utc().format("YYYY-MM-DD HH:mm:ss"), userId],
    );
  }

  return true;
};

export {
  createUser,
  fetchActiveUsersForQuestAssignment,
  fetchUserByEmail,
  fetchUserById,
  fetchUserStats,
  fetchUnlockedTitlesModel,
  updateName,
  resetStreak,
  getGlobalRankingModel,
  getGlobalRankForUserModel,
  updateStreak,
  resetUserStatsModel,
  changeAvatarModel,
  changeTitleModel,
  updateNameModel,
  updateUsernameModel,
  updateTrainingPlanModel,
};
