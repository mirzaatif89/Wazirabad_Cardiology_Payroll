import { Router } from "express";
import {
  createDesignation,
  deleteDesignation,
  findDesignationByCode,
  listDesignations,
  updateDesignation
} from "../controllers/designationController.js";

const router = Router();

router.get("/", listDesignations);
router.get("/code/:code", findDesignationByCode);
router.post("/", createDesignation);
router.put("/:id", updateDesignation);
router.delete("/:id", deleteDesignation);

export default router;
