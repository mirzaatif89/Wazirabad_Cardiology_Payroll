import { Router } from "express";
import { listChartOfAccounts } from "../controllers/chartOfAccountsController.js";

const router = Router();

router.get("/", listChartOfAccounts);

export default router;
