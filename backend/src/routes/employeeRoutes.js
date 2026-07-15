import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  findEmployeeByCode,
  listEmployees,
  updateEmployee
} from "../controllers/employeeController.js";

const router = Router();

router.get("/", listEmployees);
router.get("/code/:employeeNo", findEmployeeByCode);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
