import {
  deleteEmployeeById,
  getEmployeeByCode,
  getEmployees,
  insertEmployee,
  updateEmployeeById
} from "../models/employeeModel.js";

function validateEmployee(employee) {
  if (!employee.employeeNo || !employee.name) {
    return "Employee No. and Name are required.";
  }

  if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
    return "Please enter a valid email address.";
  }

  return "";
}

export async function listEmployees(_req, res) {
  try {
    const employees = await getEmployees();
    return res.json({ employees });
  } catch (error) {
    console.error("Employee list failed:", error);
    return res.status(500).json({ message: "Employee list failed." });
  }
}

export async function findEmployeeByCode(req, res) {
  try {
    const employee = await getEmployeeByCode(req.params.employeeNo);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    return res.json({ employee });
  } catch (error) {
    console.error("Employee lookup failed:", error);
    return res.status(500).json({ message: "Employee lookup failed." });
  }
}

export async function createEmployee(req, res) {
  const { employeeNo, name, email } = req.body;
  const validationMessage = validateEmployee(req.body);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const id = await insertEmployee(req.body);
    return res.status(201).json({
      message: "Employee saved successfully.",
      employee: {
        id,
        employeeNo,
        name,
        email: email || null
      }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Employee No. already exists." });
    }

    console.error("Employee save failed:", error);
    return res.status(500).json({ message: "Employee save failed." });
  }
}

export async function updateEmployee(req, res) {
  const validationMessage = validateEmployee(req.body);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const affectedRows = await updateEmployeeById(req.params.id, req.body);

    if (!affectedRows) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const employee = await getEmployeeByCode(req.body.employeeNo);

    return res.json({ message: "Employee updated successfully.", employee });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Employee No. already exists." });
    }

    console.error("Employee update failed:", error);
    return res.status(500).json({ message: "Employee update failed." });
  }
}

export async function deleteEmployee(req, res) {
  try {
    const affectedRows = await deleteEmployeeById(req.params.id);

    if (!affectedRows) {
      return res.status(404).json({ message: "Employee not found." });
    }

    return res.json({ message: "Employee deleted successfully." });
  } catch (error) {
    console.error("Employee delete failed:", error);
    return res.status(500).json({ message: "Employee delete failed." });
  }
}
