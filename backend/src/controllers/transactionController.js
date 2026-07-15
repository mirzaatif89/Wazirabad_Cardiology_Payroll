import {
  createChequePrint,
  deleteSpecialPayEntry,
  getAllowancesExport,
  getSpecialPay,
  getTaxScheduleExport,
  upsertSpecialPay
} from "../models/transactionModel.js";

function requiredPeriod(query) {
  const month = Number(query.month || query.from_month || 0);
  const year = Number(query.year || query.from_year || 0);
  return { month, year };
}

export async function findSpecialPay(req, res) {
  const { month, year } = requiredPeriod(req.query);

  if (!month || !year) {
    return res.status(400).json({ success: false, data: null, message: "Month and year are required." });
  }

  try {
    const data = await getSpecialPay(req.params.employee_code, month, year);

    if (!data) {
      return res.status(404).json({ success: false, data: null, message: "Employee not found." });
    }

    return res.json({ success: true, data, message: "Special pay loaded." });
  } catch (error) {
    console.error("Special pay lookup failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Special pay lookup failed." });
  }
}

export async function saveSpecialPay(req, res) {
  const employeeCode = req.body.employeeCode || req.body.employee_code;
  const month = Number(req.body.month || req.body.payMonth || req.body.pay_month || 0);
  const year = Number(req.body.year || req.body.payYear || req.body.pay_year || 0);

  if (!employeeCode || !month || !year) {
    return res.status(400).json({ success: false, data: null, message: "Employee code, month, and year are required." });
  }

  try {
    const result = await upsertSpecialPay({ employeeCode, month, year, entries: req.body.entries || [] });

    if (result.status === "missing_employee") {
      return res.status(404).json({ success: false, data: null, message: "Employee not found." });
    }

    if (result.status === "missing_wage_code") {
      return res.status(400).json({ success: false, data: null, message: `Wage code ${result.code} does not exist.` });
    }

    return res.json({ success: true, data: result.data, message: "Special pay saved successfully." });
  } catch (error) {
    console.error("Special pay save failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Special pay save failed." });
  }
}

export async function removeSpecialPay(req, res) {
  try {
    const affectedRows = await deleteSpecialPayEntry(req.params.id);

    if (!affectedRows) {
      return res.status(404).json({ success: false, data: null, message: "Special pay entry not found." });
    }

    return res.json({ success: true, data: null, message: "Special pay entry deleted." });
  } catch (error) {
    console.error("Special pay delete failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Special pay delete failed." });
  }
}

export async function printCheque(req, res) {
  const { cheque_date: chequeDate, chequeDate: camelDate, payee_name: payeeNameRaw, payeeName, amount, bank_type: bankTypeRaw, bankType } = req.body;
  const cleanBankType = String(bankTypeRaw || bankType || "").toUpperCase();

  if (!["BOP", "SDA"].includes(cleanBankType) || !(chequeDate || camelDate) || !(payeeNameRaw || payeeName) || Number(amount || 0) <= 0) {
    return res.status(400).json({ success: false, data: null, message: "Cheque date, payee name, valid amount, and bank type are required." });
  }

  try {
    const data = await createChequePrint({
      chequeDate: chequeDate || camelDate,
      payeeName: payeeNameRaw || payeeName,
      amount,
      bankType: cleanBankType
    });
    return res.status(201).json({ success: true, data, message: "Cheque print data saved." });
  } catch (error) {
    console.error("Cheque print failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Cheque print failed." });
  }
}

function exportFilters(req) {
  return {
    fromMonth: Number(req.query.from_month || 0),
    fromYear: Number(req.query.from_year || 0),
    toMonth: Number(req.query.to_month || 0),
    toYear: Number(req.query.to_year || 0)
  };
}

function validateExportFilters(filters) {
  return filters.fromMonth && filters.fromYear && filters.toMonth && filters.toYear;
}

export async function allowancesExport(req, res) {
  const filters = exportFilters(req);

  if (!validateExportFilters(filters)) {
    return res.status(400).json({ success: false, data: null, message: "From/to month and year are required." });
  }

  try {
    return res.json({ success: true, data: await getAllowancesExport(filters), message: "Allowances export loaded." });
  } catch (error) {
    console.error("Allowances export failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Allowances export failed." });
  }
}

export async function taxScheduleExport(req, res) {
  const filters = exportFilters(req);

  if (!validateExportFilters(filters)) {
    return res.status(400).json({ success: false, data: null, message: "From/to month and year are required." });
  }

  try {
    return res.json({ success: true, data: await getTaxScheduleExport(filters), message: "Tax schedule export loaded." });
  } catch (error) {
    console.error("Tax schedule export failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Tax schedule export failed." });
  }
}
