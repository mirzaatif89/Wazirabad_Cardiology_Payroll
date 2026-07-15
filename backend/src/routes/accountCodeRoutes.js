import { Router } from "express";
import {
  createAccountCode,
  deleteAccountCode,
  listAccountCodes,
  updateAccountCode
} from "../controllers/accountCodeController.js";

const router = Router();

router.get("/", listAccountCodes);
router.post("/", createAccountCode);
router.put("/:id", updateAccountCode);
router.delete("/:id", deleteAccountCode);

export default router;
