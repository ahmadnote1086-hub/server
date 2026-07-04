import { processDonation } from "../services/gumroad.service.js";
import { throwErr } from "../utils/error.utils.js";

export const gumroadController = async (req, res) => {
  try {
    const providedSecret = req.query.secret;
    const expectedSecret = process.env.GUMROAD_WEBHOOK_SECRET;
    const productId = req.body.product_id;

    console.log(req.body);

    if (!providedSecret || providedSecret !== expectedSecret) {
      console.warn("⚠️ Unauthorized request attempt blocked.");
      return res.status(401).send("Unauthorized");
    }

    switch (productId) {
      case process.env.GUMROAD_DONATION_PRODUCT_ID:
        await processDonation(req.body, 'donation');
        break;

      default:
        console.warn("Unknown Gumroad product:", productId);
    }

    res.sendStatus(200);
  } catch (error) {
    throwErr(error);
  }
};
