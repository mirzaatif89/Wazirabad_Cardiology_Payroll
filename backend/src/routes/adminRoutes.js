import { Router } from "express";
import { resetData } from "../controllers/adminController.js";

const router = Router();

router.post("/reset-data", resetData);

export default router;
