import { Router } from "express";
import { updateNameController, updateUsernameController, updateReminderTimeController, updateTrainingPlanController } from '../controllers/settings.controller.js';

const router = Router();

router.patch('/name', updateNameController);
router.patch('/username', updateUsernameController);
router.patch('/reminder-time', updateReminderTimeController);
router.patch('/save-training-days', updateTrainingPlanController);

export default router;