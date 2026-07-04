import db from "../db/mysqlConfig.js";
import { throwErr } from "../utils/error.utils.js";

export const addPurchaseToDB = async (payload, userId, type) => {
    try {
        await db.query(`
            INSERT INTO
            purchase_history
            (
                user_id, sale_id, product_id, product_name, 
                type, amount, currency, email,
                status, purchased_at
            )
            VALUES 
            (
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?
            )
            `, [
                userId, payload.sale_id, payload.product_id, payload.product_name, type, Number(payload.price) / 100, payload.currency, payload.email, 
                'completed', new Date(payload.sale_timestamp), 
            ]
        );
    } catch (error) {
        throwErr(error);
    }
}

export const checkSaleId = async (sale_id) => {
    try {
        const [rows] = await db.query(`
            SELECT 1 
            FROM purchase_history 
            WHERE sale_id = ?
        `, [sale_id]);

        return rows.length > 0;
    } catch (error) {
        throwErr(error);
    }
}

export const sendDonationThankYouNotification = async (userId) => {
    
    const title = "Thank You!";
    const message =
        "Thank you for supporting SoloLevelX! Your contribution helps keep the project growing and brings new features to life.";
    
    const [nResult] = await db.query(
      `INSERT INTO notification
      (title, message, type) 
      VALUES (?, ?, ?)`,
      [title, message, "system"],
    );

    await db.query(
      `
      INSERT INTO user_notification
      (user_id, n_id) 
            VALUES (?, ?)
        `,
      [userId, nResult.insertId],
    );
    
    return true;
}
