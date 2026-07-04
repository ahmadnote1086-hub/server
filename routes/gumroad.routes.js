import express from "express";  
import { gumroadController } from "../controllers/gumraod.controller.js";

const router = express.Router();

router.post("/webhook", gumroadController);

export default router;