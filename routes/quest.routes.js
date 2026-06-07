import { Router } from "express";
import { getQuestsController, getEventQuestsController, completeQuestController, getQuestsHistoryController, completeAllQuestsForTodayController, addCustomQuestController, removeCustomQuestController, updateEventProgressController } from '../controllers/quests.controller.js'

const router = Router();

router.get('/today', getQuestsController)
router.get('/events', getEventQuestsController)
router.get('/history', getQuestsHistoryController)
router.post('/complete/:quest_id', completeQuestController)
router.post('/add-progress/:quest_id', updateEventProgressController)
router.post('/complete-all/:type', completeAllQuestsForTodayController)
router.post('/custom/add', addCustomQuestController)
router.delete('/custom/remove/:questId', removeCustomQuestController)

export default router;