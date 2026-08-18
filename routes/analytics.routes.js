import express from "express";  
import { donationClickController } from "../controllers/analytics.controller.js";

const router = express.Router();

router.post("/donation/click", donationClickController);

export default router;