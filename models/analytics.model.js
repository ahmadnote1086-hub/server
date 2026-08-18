import db from "../db/mysqlConfig.js";
import { throwErr } from "../utils/error.utils.js";

export const trackDonationClickModel = async () => {
    try {
        await db.query(`UPDATE analytics SET donation_clicks = donation_clicks + 1`);
    } catch (error) {
        throwErr(error);
    }
}