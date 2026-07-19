import {
  applyAnnualIncrement,
  applyFixedAllowance,
  applyPercentAllowance,
  previewAnnualIncrement,
  previewFixedAllowance,
  previewPercentAllowance
} from "../models/mprocessModel.js";

function requireFields(res, body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
  if (missing.length) {
    res.status(400).json({ success: false, data: null, message: `${missing.join(", ")} required.` });
    return false;
  }
  return true;
}

function percentPayload(body) {
  return {
    sourceWageCode: body.source_wage_code || body.sourceWageCode,
    percentage: Number(body.percentage || 0),
    targetWageCode: body.target_wage_code || body.targetWageCode,
    bps: body.bps || "99",
    type: body.type || "All",
    effectiveUpto: body.effective_upto || body.effectiveUpto
  };
}

function fixedPayload(body) {
  return {
    amount: Number(body.amount || 0),
    targetWageCode: body.target_wage_code || body.targetWageCode,
    designationCode: body.designation_code || body.designationCode || "999",
    type: body.type || "All",
    effectiveUpto: body.effective_upto || body.effectiveUpto
  };
}

function incrementPayload(body) {
  return {
    incrementPercentage: Number(body.increment_percentage || body.incrementPercentage || 0),
    appliesToWageCode: body.applies_to_wage_code || body.appliesToWageCode,
    effectiveDate: body.effective_date || body.effectiveDate
  };
}

export async function previewPercentAllowanceOperation(req, res) {
  if (!requireFields(res, req.body, ["source_wage_code", "percentage", "target_wage_code", "effective_upto"])) return;
  try {
    return res.json({ success: true, data: await previewPercentAllowance(percentPayload(req.body)), message: "Percentage allowance preview loaded." });
  } catch (error) {
    console.error("Percentage allowance preview failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Percentage allowance preview failed." });
  }
}

export async function applyPercentAllowanceOperation(req, res) {
  if (!requireFields(res, req.body, ["source_wage_code", "percentage", "target_wage_code", "effective_upto"])) return;
  try {
    const data = await applyPercentAllowance(percentPayload(req.body), req.body.applied_by || "Hospital Admin");
    return res.json({ success: true, data, message: `Percentage allowance applied to ${data.count} employees.` });
  } catch (error) {
    console.error("Percentage allowance apply failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Percentage allowance apply failed." });
  }
}

export async function previewFixedAllowanceOperation(req, res) {
  if (!requireFields(res, req.body, ["amount", "target_wage_code", "effective_upto"])) return;
  try {
    return res.json({ success: true, data: await previewFixedAllowance(fixedPayload(req.body)), message: "Fixed allowance preview loaded." });
  } catch (error) {
    console.error("Fixed allowance preview failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Fixed allowance preview failed." });
  }
}

export async function applyFixedAllowanceOperation(req, res) {
  if (!requireFields(res, req.body, ["amount", "target_wage_code", "effective_upto"])) return;
  try {
    const data = await applyFixedAllowance(fixedPayload(req.body), req.body.applied_by || "Hospital Admin");
    return res.json({ success: true, data, message: `Fixed allowance applied to ${data.count} employees.` });
  } catch (error) {
    console.error("Fixed allowance apply failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Fixed allowance apply failed." });
  }
}

export async function previewAnnualIncrementOperation(req, res) {
  if (!requireFields(res, req.body, ["increment_percentage", "applies_to_wage_code", "effective_date"])) return;
  try {
    return res.json({ success: true, data: await previewAnnualIncrement(incrementPayload(req.body)), message: "Annual increment preview loaded." });
  } catch (error) {
    console.error("Annual increment preview failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Annual increment preview failed." });
  }
}

export async function applyAnnualIncrementOperation(req, res) {
  if (!requireFields(res, req.body, ["increment_percentage", "applies_to_wage_code", "effective_date"])) return;
  try {
    const data = await applyAnnualIncrement(incrementPayload(req.body), req.body.applied_by || "Hospital Admin");
    return res.json({ success: true, data, message: `Annual increment applied to ${data.count} employees.` });
  } catch (error) {
    console.error("Annual increment apply failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Annual increment apply failed." });
  }
}
