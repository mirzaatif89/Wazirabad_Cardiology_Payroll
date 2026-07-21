import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  findEmployeeByCode,
  listEmployees,
  nextEmployeeNo,
  updateEmployee
} from "../controllers/employeeController.js";

const router = Router();

router.get("/", listEmployees);
router.get("/next-no", nextEmployeeNo);
router.get("/code/:employeeNo", findEmployeeByCode);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
