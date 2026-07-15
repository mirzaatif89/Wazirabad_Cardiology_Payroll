import { Router } from "express";
import {
  allowancesExport,
  findSpecialPay,
  printCheque,
  removeSpecialPay,
  saveSpecialPay,
  taxScheduleExport
} from "../controllers/transactionController.js";

export const specialPayRouter = Router();
export const chequePrintRouter = Router();
export const exportRouter = Router();

specialPayRouter.get("/:employee_code", findSpecialPay);
specialPayRouter.post("/", saveSpecialPay);
specialPayRouter.delete("/:id", removeSpecialPay);

chequePrintRouter.post("/", printCheque);

exportRouter.get("/allowances", allowancesExport);
exportRouter.get("/tax-schedule", taxScheduleExport);
