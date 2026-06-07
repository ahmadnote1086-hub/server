import db from "../db/mysqlConfig.js";
import { throwErr } from "../utils/error.utils.js";

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
  timezone
) => {
  try {
    const [result] = await db.query(
      `INSERT INTO users (email, username, fullname, password, timezone) VALUES (?, ?, ?, ?, ?)`,
      [email, username, fullname, hashedPassword, timezone]
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
 * Fetches all the users from database
 *
 * @returns {Promise<Array<object>>} - An array of user objects
 */
const fetchAllUsers = async () => {
  const [users] = await db.query(`SELECT * FROM users`);
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
  const [users] = await db.query(`SELECT * FROM users WHERE user_id = ?`, [id]);

  if (users.length === 0) throwErr("User not found", 404);

  const { password, ...safeUser } = users[0];
  return safeUser;
};

/**
 * Fetches stats of a user from database
 *
 * @param {int} userId - id of the user
 * @returns {Promise<object|null>} - A stats object if found, otherwise null
 */
const fetchUserStats = async (userId) => {
  const [stats] = await db.query(`SELECT * FROM stats WHERE user_id = ?`, [
    userId,
  ]);

  return stats[0];
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
    [newfullname, userId]
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
    [userId]
  );

  if (result.affectedRows === 0) return null;

  return true;
};

/**
 * Reset streak of the user
 *
 * @param {int} userId - User's id
 * @returns {Promise<{success: boolean} | null>} - Object with success flag or null if no rows were affected
 */
const resetStreak = async (userId) => {
  const [result] = await db.query(
    `UPDATE stats 
      SET streak = 0, 
      hp = hp - 1 
      WHERE user_id = ?`,
    [userId]
  );

  if (result.affectedRows === 0) return null;

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
      s.title,
      ROW_NUMBER() OVER (ORDER BY s.total_xp DESC) AS globalRank
      FROM users AS u
      INNER JOIN stats AS s
      ON u.user_id = s.user_id  
      LIMIT 15`
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
    `SELECT u.user_id, ROW_NUMBER() OVER (ORDER BY s.total_xp DESC) AS globalRank
    FROM users AS u
    INNER JOIN stats AS s
    ON u.user_id = s.user_id`,
  );
  
  if (result.length === 0) return throwErr("No user found");
  
  const user = result.filter((user) => user.user_id === userId);
  return user[0].globalRank;
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
      title = 'player',
      streak = 0,
      highest_streak = 0,
      coins = 0,
      hp = 5,
      last_completed = null
    WHERE user_id = ?`,
    [userId]
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
    [id, userId]
  );

  if (result.affectedRows === 0) return throwErr("No user found");
  
  return result.affectedRows > 0;
};

const updateNameModel = async (newName, userId) => {
  const [result] = await db.query(
    `UPDATE users
    SET fullname = ?
    WHERE user_id = ?`,
    [newName, userId]
  );

  if (result.affectedRows === 0) return throwErr("No user found", 404);
  
  return result.affectedRows > 0;
};

const updateUsernameModel = async (newUsername, userId) => {
  const [[user]] = await db.query(
    `SELECT username_changed_at FROM users WHERE user_id = ?`,
    [userId]
  );

  if (!user) {
    throwErr("No user found", 404);
  }

  if (user.username_changed_at) {
    const now = new Date();
    const changedAt = new Date(user.username_changed_at);

    const diffDays = Math.floor(
      (now - changedAt) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 30) {
      throwErr("Username can only be changed every 30 days");
    }
  }

  const [result] = await db.query(
    `UPDATE users
    SET username = ?,
      username_changed_at = NOW()
    WHERE user_id = ?`,
    [newUsername, userId]
  );

  if (result.affectedRows === 0) return throwErr("No user found", 404);
  
  return result.affectedRows > 0;
}

export {
  createUser,
  fetchAllUsers,
  fetchUserByEmail,
  fetchUserById,
  fetchUserStats,
  updateName,
  resetStreak,
  getGlobalRankingModel,
  getGlobalRankForUserModel,
  updateStreak,
  resetUserStatsModel,
  changeAvatarModel,
  updateNameModel,
  updateUsernameModel
};
