import {
  deleteWageCodeByCode,
  deriveWageCategory,
  getWageCodeByCode,
  getWageCodeReferenceCounts,
  getWageCodes,
  insertWageCode,
  normalizeWageCodePayload,
  updateWageCodeByCode,
  validateWageCode
} from "../models/wageCodeModel.js";

export async function listWageCodes(req, res) {
  try {
    const wageCodes = await getWageCodes({
      search: req.query.search || "",
      category: req.query.category || ""
    });

    return res.json({
      success: true,
      data: wageCodes,
      message: "Wage codes loaded."
    });
  } catch (error) {
    console.error("Wage code list failed:", error);
    return res.status(500).json({
      success: false,
      data: [],
      message: "Wage code list failed."
    });
  }
}

export async function findWageCode(req, res) {
  try {
    const wageCode = await getWageCodeByCode(req.params.code);

    if (!wageCode) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Wage code not found."
      });
    }

    return res.json({
      success: true,
      data: wageCode,
      message: "Wage code loaded."
    });
  } catch (error) {
    console.error("Wage code lookup failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Wage code lookup failed."
    });
  }
}

export async function createWageCode(req, res) {
  const wageCode = normalizeWageCodePayload(req.body);
  const validationMessage = validateWageCode(wageCode);

  if (validationMessage) {
    return res.status(400).json({
      success: false,
      data: null,
      message: validationMessage
    });
  }

  try {
    const createdWageCode = await insertWageCode(wageCode);
    return res.status(201).json({
      success: true,
      data: createdWageCode,
      message: "Wage code saved successfully."
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        data: null,
        message: "Wage code already exists."
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Attached account code does not exist."
      });
    }

    console.error("Wage code save failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Wage code save failed."
    });
  }
}

export async function updateWageCode(req, res) {
  const code = req.params.code;
  const existingCategory = deriveWageCategory(code);
  const wageCode = normalizeWageCodePayload({ ...req.body, code });
  const validationMessage = validateWageCode(wageCode, { requireCode: false });

  if (!/^\d{4}$/.test(code) || !existingCategory) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Wage code route parameter is invalid."
    });
  }

  if (validationMessage) {
    return res.status(400).json({
      success: false,
      data: null,
      message: validationMessage
    });
  }

  try {
    const affectedRows = await updateWageCodeByCode(code, wageCode);

    if (!affectedRows) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Wage code not found."
      });
    }

    return res.json({
      success: true,
      data: await getWageCodeByCode(code),
      message: "Wage code updated successfully."
    });
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Attached account code does not exist."
      });
    }

    console.error("Wage code update failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Wage code update failed."
    });
  }
}

export async function deleteWageCode(req, res) {
  const code = req.params.code;

  try {
    const referenceCounts = await getWageCodeReferenceCounts(code);
    const totalReferences = referenceCounts.employeeAllowances + referenceCounts.salaryTransactions;

    if (totalReferences > 0) {
      return res.status(409).json({
        success: false,
        data: referenceCounts,
        message: "Wage code cannot be deleted because it is already used in payroll records."
      });
    }

    const affectedRows = await deleteWageCodeByCode(code);

    if (!affectedRows) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Wage code not found."
      });
    }

    return res.json({
      success: true,
      data: null,
      message: "Wage code deleted successfully."
    });
  } catch (error) {
    console.error("Wage code delete failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Wage code delete failed."
    });
  }
}
