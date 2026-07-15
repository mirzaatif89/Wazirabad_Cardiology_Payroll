import {
  createBudgetTransaction,
  deleteBudgetTransactionById,
  finalizeBudgetTransactionById,
  getAccountCodeMap,
  getBudgetSummary,
  getBudgetPosition,
  getBudgetTransactionById,
  getBudgetTransactions,
  getNextBudgetDocumentNo,
  normalizeBudgetItems,
  reopenBudgetTransactionById,
  updateBudgetTransactionById,
  validateBudgetPayload
} from "../models/budgetTransactionModel.js";
import { logAuditAction } from "../models/auditLogModel.js";

async function validateBusinessRules(payload) {
  const items = normalizeBudgetItems(payload.items);
  const basicValidation = validateBudgetPayload(payload, items);

  if (basicValidation) {
    return basicValidation;
  }

  const uniqueAccountCodes = Array.from(new Set(items.map((item) => item.accountCode)));
  const accountMap = await getAccountCodeMap(uniqueAccountCodes);
  const missingAccountCode = uniqueAccountCodes.find((code) => !accountMap.has(code));

  if (missingAccountCode) {
    return `Account code ${missingAccountCode} does not exist.`;
  }

  return "";
}

export async function nextBudgetDocumentNo(_req, res) {
  try {
    return res.json({
      success: true,
      data: { documentNo: await getNextBudgetDocumentNo() },
      message: "Next document number loaded."
    });
  } catch (error) {
    console.error("Next budget document number failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Next document number failed." });
  }
}

export async function listBudgetTransactions(req, res) {
  try {
    const transactions = await getBudgetTransactions({
      budgetType: req.query.budget_type || "",
      documentNo: req.query.document_no || "",
      dateFrom: req.query.date_from || "",
      dateTo: req.query.date_to || "",
      status: req.query.status || ""
    });

    return res.json({ success: true, data: transactions, message: "Budget transactions loaded." });
  } catch (error) {
    console.error("Budget transaction list failed:", error);
    return res.status(500).json({ success: false, data: [], message: "Budget transaction list failed." });
  }
}

export async function findBudgetTransaction(req, res) {
  try {
    const transaction = await getBudgetTransactionById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, data: null, message: "Budget transaction not found." });
    }

    return res.json({ success: true, data: transaction, message: "Budget transaction loaded." });
  } catch (error) {
    console.error("Budget transaction lookup failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Budget transaction lookup failed." });
  }
}

export async function createTransaction(req, res) {
  const validationMessage = await validateBusinessRules(req.body);

  if (validationMessage) {
    return res.status(400).json({ success: false, data: null, message: validationMessage });
  }

  try {
    const transaction = await createBudgetTransaction(req.body);
    return res.status(201).json({ success: true, data: transaction, message: "Budget transaction saved successfully." });
  } catch (error) {
    console.error("Budget transaction save failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Budget transaction save failed." });
  }
}

export async function updateTransaction(req, res) {
  const validationMessage = await validateBusinessRules(req.body);

  if (validationMessage) {
    return res.status(400).json({ success: false, data: null, message: validationMessage });
  }

  try {
    const result = await updateBudgetTransactionById(req.params.id, req.body);

    if (result.status === "not_found") {
      return res.status(404).json({ success: false, data: null, message: "Budget transaction not found." });
    }

    if (result.status === "locked") {
      return res.status(409).json({ success: false, data: null, message: "Only draft budget transactions can be edited." });
    }

    return res.json({ success: true, data: result.transaction, message: "Budget transaction updated successfully." });
  } catch (error) {
    console.error("Budget transaction update failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Budget transaction update failed." });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const result = await deleteBudgetTransactionById(req.params.id);

    if (result === "not_found") {
      return res.status(404).json({ success: false, data: null, message: "Budget transaction not found." });
    }

    if (result === "finalized") {
      return res.status(409).json({
        success: false,
        data: null,
        message: "Finalized budget transactions cannot be deleted. Cancel the document instead."
      });
    }

    return res.json({ success: true, data: null, message: "Budget transaction deleted successfully." });
  } catch (error) {
    console.error("Budget transaction delete failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Budget transaction delete failed." });
  }
}

export async function finalizeTransaction(req, res) {
  try {
    const result = await finalizeBudgetTransactionById(req.params.id);

    if (result === "not_found") {
      return res.status(404).json({ success: false, data: null, message: "Budget transaction not found." });
    }

    if (result === "locked") {
      return res.status(409).json({ success: false, data: null, message: "Only draft budget transactions can be finalized." });
    }

    return res.json({
      success: true,
      data: await getBudgetTransactionById(req.params.id),
      message: "Budget transaction finalized successfully."
    });
  } catch (error) {
    console.error("Budget transaction finalize failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Budget transaction finalize failed." });
  }
}

export async function reopenTransaction(req, res) {
  try {
    const result = await reopenBudgetTransactionById(req.params.id);

    if (result.status === "not_found") {
      return res.status(404).json({ success: false, data: null, message: "Budget transaction not found." });
    }

    if (result.status === "not_finalized") {
      return res.status(409).json({ success: false, data: null, message: "Only finalized budget transactions can be reopened." });
    }

    await logAuditAction({
      action: "reopen",
      documentType: "budget",
      documentNo: result.documentNo,
      performedBy: req.body?.performedBy || "Hospital Admin",
      notes: "Reopened finalized budget transaction for correction."
    });

    return res.json({ success: true, data: result.transaction, message: "Budget transaction reopened for correction." });
  } catch (error) {
    console.error("Budget transaction reopen failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Budget transaction reopen failed." });
  }
}

export async function budgetSummary(_req, res) {
  try {
    return res.json({ success: true, data: await getBudgetSummary(), message: "Budget summary loaded." });
  } catch (error) {
    console.error("Budget summary failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Budget summary failed." });
  }
}

export async function budgetPosition(req, res) {
  const endingDate = req.query.ending_date || "";

  if (!endingDate) {
    return res.status(400).json({ success: false, data: null, message: "Ending date is required." });
  }

  try {
    return res.json({ success: true, data: await getBudgetPosition(endingDate), message: "Budget position loaded." });
  } catch (error) {
    console.error("Budget position failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Budget position failed." });
  }
}
