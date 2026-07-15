import { Router } from "express";
import { findDocument } from "../controllers/documentController.js";

const router = Router();

router.get("/:documentNo", findDocument);

export default router;
