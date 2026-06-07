import db from "../db/mysqlConfig.js";
import { throwErr } from "../utils/error.utils.js";

/**
 * Add review to database
 *
 * @param {int} userId user id
 * @param {string} message Message from the user
 * @returns {Promise<{ success: Boolean }>} An object indicating success of the operation
 */
export const addReviewModel = async (userId, message) => {
  const [rows] = await db.query(
    `
        INSERT INTO reviews (user_id, message)
        VALUES (?, ?)
    `,
    [userId, message]
  );

  return { success: true, reviewId: rows.insertId };
};
