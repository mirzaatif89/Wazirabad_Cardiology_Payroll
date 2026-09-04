import {
  deleteBankBranchById,
  deleteBankById,
  getBankBranches,
  getBanks,
  insertBank,
  insertBankBranch,
  normalizeBankBranchPayload,
  normalizeBankPayload,
  updateBankBranchById,
  updateBankById
} from "../models/bankModel.js";

function validateBank(bank) {
  if (!bank.code || !bank.bank) {
    return "Bank code and bank name are required.";
  }

  return "";
}

function validateBankBranch(branch) {
  if (!branch.bankId || !branch.code || !branch.branch) {
    return "Bank, branch code, and branch name are required.";
  }

  return "";
}

export async function listBanks(_req, res) {
  try {
    return res.json({ banks: await getBanks() });
  } catch (error) {
    console.error("Bank list failed:", error);
    return res.status(500).json({ message: "Bank list failed." });
  }
}

export async function createBank(req, res) {
  const bank = normalizeBankPayload(req.body);
  const validationMessage = validateBank(bank);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const id = await insertBank(bank);
    return res.status(201).json({ message: "Bank code saved successfully.", bank: { id, ...bank } });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Duplicate entry of bank code." });
    }

    console.error("Bank save failed:", error);
    return res.status(500).json({ message: "Bank save failed." });
  }
}

export async function updateBank(req, res) {
  const bank = normalizeBankPayload(req.body);
  const validationMessage = validateBank(bank);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const affectedRows = await updateBankById(req.params.id, bank);

    if (!affectedRows) {
      return res.status(404).json({ message: "Bank code not found." });
    }

    return res.json({ message: "Bank code updated successfully." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Duplicate entry of bank code." });
    }

    console.error("Bank update failed:", error);
    return res.status(500).json({ message: "Bank update failed." });
  }
}

export async function deleteBank(req, res) {
  try {
    const affectedRows = await deleteBankById(req.params.id);

    if (!affectedRows) {
      return res.status(404).json({ message: "Bank code not found." });
    }

    return res.json({ message: "Bank code deleted successfully." });
  } catch (error) {
    if (error.code === "BANK_HAS_BRANCHES") {
      return res.status(409).json({ message: "This bank has linked branches. Reassign or remove those branches first." });
    }

    if (error.code === "BANK_IN_USE") {
      return res.status(409).json({ message: "This bank is assigned to employees and cannot be deleted. Mark it inactive instead." });
    }

    console.error("Bank delete failed:", error);
    return res.status(500).json({ message: "Bank delete failed." });
  }
}

export async function listBankBranches(req, res) {
  try {
    return res.json({
      branches: await getBankBranches({
        bankId: req.query.bank_id || null,
        bankCode: req.query.bank_code || null,
        includeInactive: req.query.include_inactive !== "false"
      })
    });
  } catch (error) {
    console.error("Bank branch list failed:", error);
    return res.status(500).json({ message: "Bank branch list failed." });
  }
}

export async function createBankBranch(req, res) {
  const branch = normalizeBankBranchPayload(req.body);
  const validationMessage = validateBankBranch(branch);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const id = await insertBankBranch(branch);
    return res.status(201).json({
      message: "Bank branch code saved successfully.",
      branch: { id, ...branch }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "This branch code already exists for the selected bank." });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "Selected bank does not exist." });
    }

    console.error("Bank branch save failed:", error);
    return res.status(500).json({ message: "Bank branch save failed." });
  }
}

export async function updateBankBranch(req, res) {
  const branch = normalizeBankBranchPayload(req.body);
  const validationMessage = validateBankBranch(branch);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const affectedRows = await updateBankBranchById(req.params.id, branch);

    if (!affectedRows) {
      return res.status(404).json({ message: "Bank branch code not found." });
    }

    return res.json({ message: "Bank branch code updated successfully." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "This branch code already exists for the selected bank." });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "Selected bank does not exist." });
    }

    console.error("Bank branch update failed:", error);
    return res.status(500).json({ message: "Bank branch update failed." });
  }
}

export async function deleteBankBranch(req, res) {
  try {
    const affectedRows = await deleteBankBranchById(req.params.id);

    if (!affectedRows) {
      return res.status(404).json({ message: "Bank branch code not found." });
    }

    return res.json({ message: "Bank branch code deleted successfully." });
  } catch (error) {
    if (error.code === "BRANCH_IN_USE") {
      return res.status(409).json({ message: "This branch is assigned to employees and cannot be deleted. Mark it inactive instead." });
    }

    console.error("Bank branch delete failed:", error);
    return res.status(500).json({ message: "Bank branch delete failed." });
  }
}
