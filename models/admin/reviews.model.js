import db from "../../db/mysqlConfig.js";

const fetchReviewsModel = async () => {
  try {
    const [reviews] = await db.query(`
            SELECT 
            r.user_id, 
            u.fullname,
            u.username,
            r.message,
            r.review_id, 
            r.created_at,
            n.message AS replyText,

            CASE
                WHEN n.reference_id IS NOT NULL THEN 1
                ELSE 0
            END AS is_replied

          FROM reviews r

          JOIN users u
            ON u.user_id = r.user_id

          LEFT JOIN (
            SELECT 
                reference_id,
                MAX(message) AS message
            FROM notification
            WHERE reference_type = 'review'
            AND type = 'reply'
            GROUP BY reference_id
          ) n
            ON n.reference_id = r.review_id

          ORDER BY r.created_at DESC
        `);

    return reviews;
  } catch (error) {
    throw Error(error);
  }
};

const deleteReviewModel = async (review_id) => {
  try {
    const [reviews] = await db.query(
      `
            DELETE 
            FROM reviews
            WHERE review_id = ?
        `,
      [review_id],
    );

    if (reviews.affectedRows === 0) {
      throw new Error("Review not found!");
    }

    return reviews;
  } catch (error) {
    throw Error(error);
  }
};

const addNotificationModel = async (
  title,
  message,
  user_id,
  type,
  reference_type,
  reference_id,
) => {
  try {
    const [nResult] = await db.query(
      `
          INSERT INTO notification
          (title, message, type, reference_type, reference_id) 
          VALUES (?, ?, ?, ?, ?)
        `,
      [title, message, type, reference_type, reference_id],
    );

    const n_id = nResult.insertId;

    const [result] = await db.query(
      `
        INSERT INTO user_notification
        (user_id, n_id) 
        VALUES (?, ?)
      `,
      [user_id, n_id],
    );

    return result;
  } catch (error) {
    throw Error(error);
  }
};

const updateRepliedStatusModel = async (review_id) => {
  try {
    const [result] = await db.query(
      `
            UPDATE reviews SET is_replied = true WHERE review_id = ?
        `,
      [review_id],
    );

    return result;
  } catch (error) {
    throw Error(error);
  }
};

export {
  fetchReviewsModel,
  deleteReviewModel,
  addNotificationModel,
  updateRepliedStatusModel,
};
