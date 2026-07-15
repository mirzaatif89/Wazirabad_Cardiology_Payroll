import { Router } from "express";
import {
  budgetSummary,
  budgetPosition,
  createTransaction,
  deleteTransaction,
  finalizeTransaction,
  findBudgetTransaction,
  listBudgetTransactions,
  nextBudgetDocumentNo,
  reopenTransaction,
  updateTransaction
} from "../controllers/budgetTransactionController.js";

const router = Router();

router.get("/", listBudgetTransactions);
router.get("/next-document-no", nextBudgetDocumentNo);
router.get("/summary", budgetSummary);
router.get("/position", budgetPosition);
router.get("/:id", findBudgetTransaction);
router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);
router.post("/:id/finalize", finalizeTransaction);
router.patch("/:id/reopen", reopenTransaction);

export default router;
