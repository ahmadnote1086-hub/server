import { trackDonationClickModel } from "../models/analytics.model.js";

export const trackDonationClickService = async () => {
    await trackDonationClickModel();
}