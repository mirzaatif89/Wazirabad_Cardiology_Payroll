import { Router } from "express";
import {
  arrearBillReport,
  createBill,
  deleteBill,
  finalizeBill,
  findArrearBill,
  listArrearBills,
  nextDocumentNo,
  reopenBill,
  updateBill,
  updateBillStatus
} from "../controllers/arrearBillController.js";

const router = Router();

router.get("/next-document-no", nextDocumentNo);
router.get("/report", arrearBillReport);
router.get("/", listArrearBills);
router.get("/:id", findArrearBill);
router.post("/", createBill);
router.put("/:id", updateBill);
router.delete("/:id", deleteBill);
router.post("/:id/finalize", finalizeBill);
router.patch("/:id/reopen", reopenBill);
router.patch("/:id/status", updateBillStatus);

export default router;
