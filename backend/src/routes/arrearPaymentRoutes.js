import { Router } from "express";
import {
  createPayment,
  findPayment,
  listPayments,
  listPayableBills,
  nextPaymentNo,
  reversePayment
} from "../controllers/arrearPaymentController.js";

const router = Router();

router.get("/next-payment-no", nextPaymentNo);
router.get("/payable-bills", listPayableBills);
router.get("/", listPayments);
router.get("/:id", findPayment);
router.post("/", createPayment);
router.post("/:id/reverse", reversePayment);

export default router;
