import { Router } from "express";
import {
  createBank,
  createBankBranch,
  deleteBank,
  deleteBankBranch,
  listBankBranches,
  listBanks,
  updateBank,
  updateBankBranch
} from "../controllers/bankController.js";

export const bankRouter = Router();
export const bankBranchRouter = Router();

bankRouter.get("/", listBanks);
bankRouter.post("/", createBank);
bankRouter.put("/:id", updateBank);
bankRouter.delete("/:id", deleteBank);

bankBranchRouter.get("/", listBankBranches);
bankBranchRouter.post("/", createBankBranch);
bankBranchRouter.put("/:id", updateBankBranch);
bankBranchRouter.delete("/:id", deleteBankBranch);
