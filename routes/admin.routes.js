import { Router } from "express";
import { getAllQuestsController, newCustomQuestController, updateQuestController, deleteQuestController } from '../controllers/admin.controller.js'

const router = Router();

router.get('/quests', getAllQuestsController)
router.post('/quests', newCustomQuestController);
router.put('/quests/:id', updateQuestController);
router.delete('/quests', deleteQuestController);

export default router;