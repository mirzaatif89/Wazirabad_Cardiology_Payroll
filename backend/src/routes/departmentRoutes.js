import { Router } from "express";
import {
  createDepartment,
  deleteDepartment,
  findDepartmentByCode,
  listDepartments,
  updateDepartment
} from "../controllers/departmentController.js";

const router = Router();

router.get("/", listDepartments);
router.get("/code/:code", findDepartmentByCode);
router.post("/", createDepartment);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

export default router;
