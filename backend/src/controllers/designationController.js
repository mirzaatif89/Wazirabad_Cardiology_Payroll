import {
  deleteDesignationById,
  getDesignationByCode,
  getDesignations,
  insertDesignation,
  normalizeDesignationPayload,
  updateDesignationById
} from "../models/designationModel.js";

function validateDesignation(designation) {
  if (!designation.code || !designation.designation) {
    return "Designation code and designation name are required.";
  }

  return "";
}

export async function listDesignations(_req, res) {
  try {
    const designations = await getDesignations();
    return res.json({ designations });
  } catch (error) {
    console.error("Designation list failed:", error);
    return res.status(500).json({ message: "Designation list failed." });
  }
}

export async function findDesignationByCode(req, res) {
  try {
    const designation = await getDesignationByCode(req.params.code);

    if (!designation) {
      return res.status(404).json({ message: "Designation code not found." });
    }

    return res.json({ designation });
  } catch (error) {
    console.error("Designation lookup failed:", error);
    return res.status(500).json({ message: "Designation lookup failed." });
  }
}

export async function createDesignation(req, res) {
  const designation = normalizeDesignationPayload(req.body);
  const validationMessage = validateDesignation(designation);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const id = await insertDesignation(designation);
    return res.status(201).json({
      message: "Designation code saved successfully.",
      designation: { id, ...designation }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Duplicate entry of designation code." });
    }

    console.error("Designation save failed:", error);
    return res.status(500).json({ message: "Designation save failed." });
  }
}

export async function updateDesignation(req, res) {
  const designation = normalizeDesignationPayload(req.body);
  const validationMessage = validateDesignation(designation);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const affectedRows = await updateDesignationById(req.params.id, designation);

    if (!affectedRows) {
      return res.status(404).json({ message: "Designation code not found." });
    }

    return res.json({ message: "Designation code updated successfully." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Duplicate entry of designation code." });
    }

    console.error("Designation update failed:", error);
    return res.status(500).json({ message: "Designation update failed." });
  }
}

export async function deleteDesignation(req, res) {
  try {
    const affectedRows = await deleteDesignationById(req.params.id);

    if (!affectedRows) {
      return res.status(404).json({ message: "Designation code not found." });
    }

    return res.json({ message: "Designation code deleted successfully." });
  } catch (error) {
    console.error("Designation delete failed:", error);
    return res.status(500).json({ message: "Designation delete failed." });
  }
}
