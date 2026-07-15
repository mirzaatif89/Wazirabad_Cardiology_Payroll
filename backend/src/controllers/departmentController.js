import {
  deleteDepartmentById,
  getDepartmentByCode,
  getDepartments,
  insertDepartment,
  normalizeDepartmentPayload,
  updateDepartmentById
} from "../models/departmentModel.js";

function validateDepartment(department) {
  if (!department.code || !department.department) {
    return "Department code and department name are required.";
  }

  return "";
}

export async function listDepartments(_req, res) {
  try {
    const departments = await getDepartments();
    return res.json({ departments });
  } catch (error) {
    console.error("Department list failed:", error);
    return res.status(500).json({ message: "Department list failed." });
  }
}

export async function findDepartmentByCode(req, res) {
  try {
    const department = await getDepartmentByCode(req.params.code);

    if (!department) {
      return res.status(404).json({ message: "Department code not found." });
    }

    return res.json({ department });
  } catch (error) {
    console.error("Department lookup failed:", error);
    return res.status(500).json({ message: "Department lookup failed." });
  }
}

export async function createDepartment(req, res) {
  const department = normalizeDepartmentPayload(req.body);
  const validationMessage = validateDepartment(department);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const id = await insertDepartment(department);
    return res.status(201).json({
      message: "Department code saved successfully.",
      department: { id, ...department }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Duplicate entry of department code." });
    }

    console.error("Department save failed:", error);
    return res.status(500).json({ message: "Department save failed." });
  }
}

export async function updateDepartment(req, res) {
  const department = normalizeDepartmentPayload(req.body);
  const validationMessage = validateDepartment(department);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const affectedRows = await updateDepartmentById(req.params.id, department);

    if (!affectedRows) {
      return res.status(404).json({ message: "Department code not found." });
    }

    return res.json({ message: "Department code updated successfully." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Duplicate entry of department code." });
    }

    console.error("Department update failed:", error);
    return res.status(500).json({ message: "Department update failed." });
  }
}

export async function deleteDepartment(req, res) {
  try {
    const affectedRows = await deleteDepartmentById(req.params.id);

    if (!affectedRows) {
      return res.status(404).json({ message: "Department code not found." });
    }

    return res.json({ message: "Department code deleted successfully." });
  } catch (error) {
    console.error("Department delete failed:", error);
    return res.status(500).json({ message: "Department delete failed." });
  }
}
