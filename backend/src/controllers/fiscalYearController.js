import {
  deleteFiscalYearById,
  getActiveFiscalYear,
  getFiscalYearById,
  getFiscalYears,
  insertFiscalYear,
  normalizeFiscalYearPayload,
  setActiveFiscalYearById,
  updateFiscalYearById
} from "../models/fiscalYearModel.js";

function validateFiscalYear(fiscalYear) {
  if (!fiscalYear.name || !fiscalYear.startDate || !fiscalYear.endDate) {
    return "Fiscal year name, start date, and end date are required.";
  }

  if (fiscalYear.startDate > fiscalYear.endDate) {
    return "Fiscal year start date cannot be after the end date.";
  }

  return "";
}

export async function listFiscalYears(_req, res) {
  try {
    const fiscalYears = await getFiscalYears();
    return res.json({
      success: true,
      data: fiscalYears,
      message: "Fiscal years loaded."
    });
  } catch (error) {
    console.error("Fiscal year list failed:", error);
    return res.status(500).json({
      success: false,
      data: [],
      message: "Fiscal year list failed."
    });
  }
}

export async function activeFiscalYear(_req, res) {
  try {
    const fiscalYear = await getActiveFiscalYear();
    return res.json({
      success: true,
      data: fiscalYear,
      message: fiscalYear ? "Active fiscal year loaded." : "No fiscal year found."
    });
  } catch (error) {
    console.error("Active fiscal year lookup failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Active fiscal year lookup failed."
    });
  }
}

export async function findFiscalYear(req, res) {
  try {
    const fiscalYear = await getFiscalYearById(req.params.id);

    if (!fiscalYear) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Fiscal year not found."
      });
    }

    return res.json({
      success: true,
      data: fiscalYear,
      message: "Fiscal year loaded."
    });
  } catch (error) {
    console.error("Fiscal year lookup failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Fiscal year lookup failed."
    });
  }
}

export async function createFiscalYear(req, res) {
  const fiscalYear = normalizeFiscalYearPayload(req.body);
  const validationMessage = validateFiscalYear(fiscalYear);

  if (validationMessage) {
    return res.status(400).json({
      success: false,
      data: null,
      message: validationMessage
    });
  }

  try {
    const createdFiscalYear = await insertFiscalYear(fiscalYear);
    return res.status(201).json({
      success: true,
      data: createdFiscalYear,
      message: "Fiscal year saved successfully."
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        data: null,
        message: "Fiscal year already exists."
      });
    }

    console.error("Fiscal year save failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Fiscal year save failed."
    });
  }
}

export async function updateFiscalYear(req, res) {
  const fiscalYear = normalizeFiscalYearPayload(req.body);
  const validationMessage = validateFiscalYear(fiscalYear);

  if (validationMessage) {
    return res.status(400).json({
      success: false,
      data: null,
      message: validationMessage
    });
  }

  try {
    const affectedRows = await updateFiscalYearById(req.params.id, fiscalYear);

    if (!affectedRows) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Fiscal year not found."
      });
    }

    return res.json({
      success: true,
      data: await getFiscalYearById(req.params.id),
      message: "Fiscal year updated successfully."
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        data: null,
        message: "Fiscal year already exists."
      });
    }

    console.error("Fiscal year update failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Fiscal year update failed."
    });
  }
}

export async function deleteFiscalYear(req, res) {
  try {
    const affectedRows = await deleteFiscalYearById(req.params.id);

    if (!affectedRows) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Fiscal year not found."
      });
    }

    return res.json({
      success: true,
      data: null,
      message: "Fiscal year deleted successfully."
    });
  } catch (error) {
    console.error("Fiscal year delete failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Fiscal year delete failed."
    });
  }
}

export async function activateFiscalYear(req, res) {
  try {
    const fiscalYear = await setActiveFiscalYearById(req.params.id);

    if (!fiscalYear) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Fiscal year not found."
      });
    }

    return res.json({
      success: true,
      data: fiscalYear,
      message: "Fiscal year activated successfully."
    });
  } catch (error) {
    console.error("Fiscal year activate failed:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Fiscal year activate failed."
    });
  }
}
