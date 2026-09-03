import {
  deleteAccountCodeById,
  getAccountCodes,
  insertAccountCode,
  normalizeAccountCodePayload,
  updateAccountCodeById
} from "../models/accountCodeModel.js";

function validateAccountCode(accountCode) {
  if (!accountCode.code || !accountCode.designation) {
    return "Account code and designation name are required.";
  }

  if (accountCode.code.length > 20) {
    return "Account code cannot exceed 20 characters because it is used in the accounting ledger.";
  }

  return "";
}

export async function listAccountCodes(_req, res) {
  try {
    return res.json({ accountCodes: await getAccountCodes() });
  } catch (error) {
    console.error("Account code list failed:", error);
    return res.status(500).json({ message: "Account code list failed." });
  }
}

export async function createAccountCode(req, res) {
  const accountCode = normalizeAccountCodePayload(req.body);
  const validationMessage = validateAccountCode(accountCode);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const id = await insertAccountCode(accountCode);
    return res.status(201).json({
      message: "Account code saved successfully.",
      accountCode: { id, ...accountCode }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Duplicate entry of account code." });
    }

    console.error("Account code save failed:", error);
    return res.status(500).json({ message: "Account code save failed." });
  }
}

export async function updateAccountCode(req, res) {
  const accountCode = normalizeAccountCodePayload(req.body);
  const validationMessage = validateAccountCode(accountCode);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const affectedRows = await updateAccountCodeById(req.params.id, accountCode);

    if (!affectedRows) {
      return res.status(404).json({ message: "Account code not found." });
    }

    return res.json({ message: "Account code updated successfully." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Duplicate entry of account code." });
    }

    console.error("Account code update failed:", error);
    return res.status(500).json({ message: "Account code update failed." });
  }
}

export async function deleteAccountCode(req, res) {
  try {
    const affectedRows = await deleteAccountCodeById(req.params.id);

    if (!affectedRows) {
      return res.status(404).json({ message: "Account code not found." });
    }

    return res.json({ message: "Account code deleted successfully." });
  } catch (error) {
    if (error.code === "ACCOUNT_CODE_IN_USE" || error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({ message: "Account code is already used by payroll or accounting entries and cannot be deleted." });
    }

    console.error("Account code delete failed:", error);
    return res.status(500).json({ message: "Account code delete failed." });
  }
}
