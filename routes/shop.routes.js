import { Router } from "express";
import { getShopItemsController, purchaseItemController } from "../controllers/shop.controller.js";


const router = Router();

router.get('/items', getShopItemsController);
router.post('/purchase/:itemId', purchaseItemController);

export default router;