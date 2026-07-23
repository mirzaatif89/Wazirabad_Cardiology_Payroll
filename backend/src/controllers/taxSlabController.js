import {
  deleteTaxPolicyById,
  deleteTaxSlabById,
  getActiveTaxPolicy,
  getTaxPolicies,
  getTaxPolicyDetails,
  insertTaxPolicy,
  insertTaxSlab,
  normalizeTaxPolicyPayload,
  normalizeTaxSlabPayload,
  setActiveTaxPolicyById,
  updateTaxPolicyById,
  updateTaxSlabById
} from "../models/taxSlabModel.js";

function validateTaxPolicy(policy) {
  if (!policy.fiscalYearId) {
    return "Fiscal year is required.";
  }

  if (!policy.name) {
    return "Tax policy name is required.";
  }

  return "";
}

function validateTaxSlab(slab) {
  if (slab.fromIncome === null || slab.fromIncome === undefined) {
    return "From income is required.";
  }

  if (slab.rate === null || slab.rate === undefined) {
    return "Tax rate is required.";
  }

  if (Number(slab.fromIncome) < 0) {
    return "From income cannot be negative.";
  }

  if (slab.toIncome !== null && Number(slab.toIncome) < Number(slab.fromIncome)) {
    return "To income cannot be less than from income.";
  }

  return "";
}

export async function listTaxPolicies(req, res) {
  try {
    const policies = await getTaxPolicies({ fiscalYearId: req.query.fiscal_year_id || req.query.fiscalYearId || "" });
    return res.json({ success: true, data: policies, message: "Tax policies loaded." });
  } catch (error) {
    console.error("Tax policy list failed:", error);
    return res.status(500).json({ success: false, data: [], message: "Tax policy list failed." });
  }
}

export async function activeTaxPolicy(req, res) {
  try {
    const fiscalYearId = req.query.fiscal_year_id || req.query.fiscalYearId;
    const policy = fiscalYearId ? await getActiveTaxPolicy(fiscalYearId) : null;
    return res.json({ success: true, data: policy, message: policy ? "Active tax policy loaded." : "No tax policy found." });
  } catch (error) {
    console.error("Active tax policy lookup failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Active tax policy lookup failed." });
  }
}

export async function findTaxPolicy(req, res) {
  try {
    const policy = await getTaxPolicyDetails(req.params.id);

    if (!policy) {
      return res.status(404).json({ success: false, data: null, message: "Tax policy not found." });
    }

    return res.json({ success: true, data: policy, message: "Tax policy loaded." });
  } catch (error) {
    console.error("Tax policy lookup failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Tax policy lookup failed." });
  }
}

export async function createTaxPolicy(req, res) {
  const policy = normalizeTaxPolicyPayload(req.body);
  const validationMessage = validateTaxPolicy(policy);

  if (validationMessage) {
    return res.status(400).json({ success: false, data: null, message: validationMessage });
  }

  try {
    const created = await insertTaxPolicy(policy);
    return res.status(201).json({ success: true, data: created, message: "Tax policy saved successfully." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, data: null, message: "Tax policy already exists." });
    }

    console.error("Tax policy save failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Tax policy save failed." });
  }
}

export async function updateTaxPolicy(req, res) {
  const policy = normalizeTaxPolicyPayload(req.body);
  const validationMessage = validateTaxPolicy(policy);

  if (validationMessage) {
    return res.status(400).json({ success: false, data: null, message: validationMessage });
  }

  try {
    const affectedRows = await updateTaxPolicyById(req.params.id, policy);
    if (!affectedRows) {
      return res.status(404).json({ success: false, data: null, message: "Tax policy not found." });
    }

    return res.json({ success: true, data: await getTaxPolicyDetails(req.params.id), message: "Tax policy updated successfully." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, data: null, message: "Tax policy already exists." });
    }

    console.error("Tax policy update failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Tax policy update failed." });
  }
}

export async function deleteTaxPolicy(req, res) {
  try {
    const affectedRows = await deleteTaxPolicyById(req.params.id);
    if (!affectedRows) {
      return res.status(404).json({ success: false, data: null, message: "Tax policy not found." });
    }

    return res.json({ success: true, data: null, message: "Tax policy deleted successfully." });
  } catch (error) {
    console.error("Tax policy delete failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Tax policy delete failed." });
  }
}

export async function activateTaxPolicy(req, res) {
  try {
    const policy = await setActiveTaxPolicyById(req.params.id);
    if (!policy) {
      return res.status(404).json({ success: false, data: null, message: "Tax policy not found." });
    }

    return res.json({ success: true, data: policy, message: "Tax policy activated successfully." });
  } catch (error) {
    console.error("Tax policy activate failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Tax policy activate failed." });
  }
}

export async function listTaxSlabs(req, res) {
  try {
    const policy = await getTaxPolicyDetails(req.params.policyId);
    if (!policy) {
      return res.status(404).json({ success: false, data: null, message: "Tax policy not found." });
    }

    return res.json({ success: true, data: policy.slabs || [], message: "Tax slabs loaded." });
  } catch (error) {
    console.error("Tax slab list failed:", error);
    return res.status(500).json({ success: false, data: [], message: "Tax slab list failed." });
  }
}

export async function createTaxSlab(req, res) {
  const slab = normalizeTaxSlabPayload(req.body);
  const validationMessage = validateTaxSlab(slab);

  if (validationMessage) {
    return res.status(400).json({ success: false, data: null, message: validationMessage });
  }

  try {
    const policy = await getTaxPolicyDetails(req.params.policyId);
    if (!policy) {
      return res.status(404).json({ success: false, data: null, message: "Tax policy not found." });
    }

    const nextSrNo = (policy.slabs || []).reduce((max, row) => Math.max(max, Number(row.srNo || 0)), 0) + 1;
    const createdId = await insertTaxSlab(req.params.policyId, { ...slab, srNo: slab.srNo || nextSrNo });
    return res.status(201).json({
      success: true,
      data: await getTaxPolicyDetails(req.params.policyId),
      message: "Tax slab saved successfully.",
      slabId: createdId
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, data: null, message: "Tax slab already exists." });
    }

    console.error("Tax slab save failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Tax slab save failed." });
  }
}

export async function updateTaxSlab(req, res) {
  const slab = normalizeTaxSlabPayload(req.body);
  const validationMessage = validateTaxSlab(slab);

  if (validationMessage) {
    return res.status(400).json({ success: false, data: null, message: validationMessage });
  }

  try {
    const affectedRows = await updateTaxSlabById(req.params.policyId, req.params.slabId, slab);
    if (!affectedRows) {
      return res.status(404).json({ success: false, data: null, message: "Tax slab not found." });
    }

    return res.json({
      success: true,
      data: await getTaxPolicyDetails(req.params.policyId),
      message: "Tax slab updated successfully."
    });
  } catch (error) {
    console.error("Tax slab update failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Tax slab update failed." });
  }
}

export async function deleteTaxSlab(req, res) {
  try {
    const affectedRows = await deleteTaxSlabById(req.params.policyId, req.params.slabId);
    if (!affectedRows) {
      return res.status(404).json({ success: false, data: null, message: "Tax slab not found." });
    }

    return res.json({
      success: true,
      data: await getTaxPolicyDetails(req.params.policyId),
      message: "Tax slab deleted successfully."
    });
  } catch (error) {
    console.error("Tax slab delete failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Tax slab delete failed." });
  }
}
