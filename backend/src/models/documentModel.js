import { getArrearBillById } from "./arrearBillModel.js";
import { getBudgetTransactionById } from "./budgetTransactionModel.js";
import { pool } from "../config/database.js";

async function findArrearByDocumentNo(documentNo) {
  const [[row]] = await pool.query("SELECT id FROM arrear_bills WHERE document_no = ? LIMIT 1", [documentNo]);
  if (!row) return null;
  const data = await getArrearBillById(row.id);
  return data ? { type: "arrear", ...data } : null;
}

async function findBudgetByDocumentNo(documentNo) {
  const [[row]] = await pool.query("SELECT id FROM budget_transactions WHERE document_no = ? LIMIT 1", [documentNo]);
  if (!row) return null;
  const data = await getBudgetTransactionById(row.id);
  return data ? { type: "budget", ...data } : null;
}

export async function getDocumentByNumber(documentNo, type = "") {
  if (type === "arrear") {
    const arrear = await findArrearByDocumentNo(documentNo);
    return arrear ? [arrear] : [];
  }

  if (type === "budget") {
    const budget = await findBudgetByDocumentNo(documentNo);
    return budget ? [budget] : [];
  }

  const [arrear, budget] = await Promise.all([
    findArrearByDocumentNo(documentNo),
    findBudgetByDocumentNo(documentNo)
  ]);

  return [arrear, budget].filter(Boolean);
}
