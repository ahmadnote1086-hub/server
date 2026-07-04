import {
  addPurchaseToDB,
  checkSaleId,
  sendDonationThankYouNotification,
} from "../models/gumroad.model.js";
import { fetchUserByEmail } from "../models/user.model.js";
import { throwErr } from "../utils/error.utils.js";

export const processDonation = async (payload, type) => {
  try {
    const email = payload.custom_fields?.["SoloLevelX Email"];
    const user = await fetchUserByEmail(email);
    let userId;

    if (user) {
      userId = user.user_id;
    }

    const saleIdExist = await checkSaleId(payload.sale_id);

    if (saleIdExist) {
      console.log(`Duplicate webhook ignored: ${payload.sale_id}`);
      return;
    }

    await addPurchaseToDB(payload, userId, type);
    await sendDonationThankYouNotification(userId);
  } catch (error) {
    throwErr(error);
  }
};
