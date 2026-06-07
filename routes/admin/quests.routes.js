import { Router } from "express";
import { getAllQuestsController, addQuestController, removeQuestController } from "../../controllers/admin/quests.controller.js";

const router = Router();

router.get("/", getAllQuestsController);
router.post("/add/:type", addQuestController);
router.delete("/remove/:id", removeQuestController);

export default router;