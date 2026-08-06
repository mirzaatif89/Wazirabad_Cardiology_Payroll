import { pool } from "../config/database.js";
import { getActiveFiscalYear, getFiscalYearForDate } from "./fiscalYearModel.js";
import {
  createArrearPaymentJournalEntry,
  reverseArrearPaymentJournalEntryByPaymentId
} from "./journalModel.js";

function toNumber(value) {
  return Number(value || 0);
}

function normalizeDate(value) {
  return String(value || "").trim();
}

async function resolveFiscalYearIdForDate(targetDate, connection = pool) {
  const fiscalYear = await getFiscalYearForDate(targetDate, connection);
  if (fiscalYear?.id) {
    return fiscalYear.id;
  }

  const activeFiscalYear = await getActiveFiscalYear(connection);
  return activeFiscalYear?.id || null;
}

async function getSalaryPayableAccountCode(connection = pool) {
  const [[row]] = await connection.query("SELECT code FROM chart_of_accounts WHERE code = ? LIMIT 1", ["L03001"]);
  return row?.code || "L03001";
}

async function billPaymentTotals(connection, arrearBillId) {
  const [[row]] = await connection.query(
    `
      SELECT
        COALESCE(SUM(CASE WHEN ap.status = 'posted' THEN ap.amount ELSE 0 END), 0) AS paidAmount,
        COALESCE(SUM(CASE WHEN ap.status = 'posted' THEN 1 ELSE 0 END), 0) AS paymentCount
      FROM arrear_payments ap
      WHERE ap.arrear_bill_id = ?
    `,
    [arrearBillId]
  );

  return {
    paidAmount: Number(row?.paidAmount || 0),
    paymentCount: Number(row?.paymentCount || 0)
  };
}

async function updateBillStatusForPayments(connection, arrearBillId) {
  const [[bill]] = await connection.query(
    `
      SELECT id, total_amount AS totalAmount, status
      FROM arrear_bills
      WHERE id = ?
      LIMIT 1
    `,
    [arrearBillId]
  );

  if (!bill) {
    return null;
  }

  const { paidAmount } = await billPaymentTotals(connection, arrearBillId);
  const totalAmount = Number(bill.totalAmount || 0);

  let nextStatus = "finalized";
  if (paidAmount >= totalAmount && totalAmount > 0) {
    nextStatus = "paid";
  } else if (paidAmount > 0) {
    nextStatus = "partially_paid";
  }

  await connection.query("UPDATE arrear_bills SET status = ? WHERE id = ?", [nextStatus, arrearBillId]);

  return {
    billId: bill.id,
    paidAmount,
    balanceAmount: Math.max(0, totalAmount - paidAmount),
    status: nextStatus
  };
}

export async function ensureArrearPaymentTables() {
  await pool.query(`ALTER TABLE arrear_bills MODIFY status ENUM('draft','finalized','partially_paid','paid','cancelled') DEFAULT 'draft'`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS arrear_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      payment_no INT UNIQUE NOT NULL,
      arrear_bill_id INT NOT NULL,
      payment_date DATE NOT NULL,
      fiscal_year_id INT NULL,
      payment_mode ENUM('bank','cash') NOT NULL DEFAULT 'bank',
      payment_account_code VARCHAR(20) NOT NULL,
      reference_no VARCHAR(120) NULL,
      amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      notes VARCHAR(255) NULL,
      status ENUM('posted','reversed') NOT NULL DEFAULT 'posted',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_arrear_payments_bill
        FOREIGN KEY (arrear_bill_id) REFERENCES arrear_bills(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_arrear_payments_fiscal_year
        FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
        ON DELETE SET NULL,
      CONSTRAINT fk_arrear_payments_account
        FOREIGN KEY (payment_account_code) REFERENCES chart_of_accounts(code)
        ON UPDATE CASCADE
    )
  `);
}

export async function getNextArrearPaymentNo(connection = pool) {
  const [[row]] = await connection.query("SELECT COALESCE(MAX(payment_no), 0) + 1 AS paymentNo FROM arrear_payments");
  return Number(row?.paymentNo || 1);
}

export async function getArrearBillsForPayment({ employeeCode = "", billStatus = "" } = {}) {
  const where = ["ab.status IN ('finalized','partially_paid')"];
  const params = [];

  if (employeeCode) {
    where.push("ab.employee_code = ?");
    params.push(String(employeeCode));
  }

  if (billStatus && ["finalized", "partially_paid", "paid"].includes(billStatus)) {
    where[0] = "ab.status = ?";
    params.unshift(billStatus);
  }

  const [rows] = await pool.query(
    `
      SELECT
        ab.id,
        ab.document_no AS documentNo,
        DATE_FORMAT(ab.bill_date, '%Y-%m-%d') AS billDate,
        ab.employee_code AS employeeCode,
        e.name AS employeeName,
        ab.total_amount AS totalAmount,
        ab.status,
        COALESCE(SUM(CASE WHEN ap.status = 'posted' THEN ap.amount ELSE 0 END), 0) AS paidAmount
      FROM arrear_bills ab
      INNER JOIN employees e ON e.employee_no = ab.employee_code
      LEFT JOIN arrear_payments ap ON ap.arrear_bill_id = ab.id
      WHERE ${where.join(" AND ")}
      GROUP BY ab.id, ab.document_no, ab.bill_date, ab.employee_code, e.name, ab.total_amount, ab.status
      ORDER BY ab.document_no DESC
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    balanceAmount: Math.max(0, Number(row.totalAmount || 0) - Number(row.paidAmount || 0))
  }));
}

export async function getArrearPayments({ employeeCode = "", status = "", billNo = "", dateFrom = "", dateTo = "" } = {}) {
  const where = [];
  const params = [];

  if (employeeCode) {
    where.push("ab.employee_code = ?");
    params.push(String(employeeCode));
  }

  if (status && ["posted", "reversed"].includes(status)) {
    where.push("ap.status = ?");
    params.push(status);
  }

  if (billNo) {
    where.push("ab.document_no = ?");
    params.push(Number(billNo));
  }

  if (dateFrom) {
    where.push("ap.payment_date >= ?");
    params.push(dateFrom);
  }

  if (dateTo) {
    where.push("ap.payment_date <= ?");
    params.push(dateTo);
  }

  const [rows] = await pool.query(
    `
      SELECT
        ap.id,
        ap.payment_no AS paymentNo,
        ap.arrear_bill_id AS arrearBillId,
        ab.document_no AS billNo,
        ab.employee_code AS employeeCode,
        e.name AS employeeName,
        DATE_FORMAT(ap.payment_date, '%Y-%m-%d') AS paymentDate,
        ap.payment_mode AS paymentMode,
        ap.payment_account_code AS paymentAccountCode,
        coa.name AS paymentAccountName,
        ap.reference_no AS referenceNo,
        ap.amount,
        ap.notes,
        ap.status,
        ap.created_at AS createdAt
      FROM arrear_payments ap
      INNER JOIN arrear_bills ab ON ab.id = ap.arrear_bill_id
      INNER JOIN employees e ON e.employee_no = ab.employee_code
      INNER JOIN chart_of_accounts coa ON coa.code = ap.payment_account_code
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY ap.payment_no DESC
    `,
    params
  );

  return rows;
}

export async function getArrearPaymentById(id, connection = pool) {
  const [[row]] = await connection.query(
    `
      SELECT
        ap.id,
        ap.payment_no AS paymentNo,
        ap.arrear_bill_id AS arrearBillId,
        ab.document_no AS billNo,
        DATE_FORMAT(ab.bill_date, '%Y-%m-%d') AS billDate,
        ab.employee_code AS employeeCode,
        e.name AS employeeName,
        ab.total_amount AS billAmount,
        DATE_FORMAT(ap.payment_date, '%Y-%m-%d') AS paymentDate,
        ap.fiscal_year_id AS fiscalYearId,
        ap.payment_mode AS paymentMode,
        ap.payment_account_code AS paymentAccountCode,
        coa.name AS paymentAccountName,
        ap.reference_no AS referenceNo,
        ap.amount,
        ap.notes,
        ap.status,
        ap.created_at AS createdAt
      FROM arrear_payments ap
      INNER JOIN arrear_bills ab ON ab.id = ap.arrear_bill_id
      INNER JOIN employees e ON e.employee_no = ab.employee_code
      INNER JOIN chart_of_accounts coa ON coa.code = ap.payment_account_code
      WHERE ap.id = ?
      LIMIT 1
    `,
    [id]
  );

  if (!row) {
    return null;
  }

  return row;
}

export async function createArrearPayment(payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const paymentDate = normalizeDate(payload.paymentDate);
    if (!paymentDate) {
      await connection.rollback();
      return { status: "invalid", message: "Payment date is required." };
    }

    const arrearBillId = Number(payload.arrearBillId || 0);
    const amount = toNumber(payload.amount);
    if (!arrearBillId || amount <= 0) {
      await connection.rollback();
      return { status: "invalid", message: "Bill and payment amount are required." };
    }

    const [[bill]] = await connection.query(
      `
        SELECT
          ab.id,
          ab.document_no AS documentNo,
          ab.employee_code AS employeeCode,
          ab.total_amount AS totalAmount,
          ab.status
        FROM arrear_bills ab
        WHERE ab.id = ?
        LIMIT 1
      `,
      [arrearBillId]
    );

    if (!bill) {
      await connection.rollback();
      return { status: "not_found" };
    }

    if (!["finalized", "partially_paid"].includes(String(bill.status || ""))) {
      await connection.rollback();
      return { status: "locked", message: "Only finalized arrear bills can be paid." };
    }

    const { paidAmount, balanceAmount } = await billPaymentTotals(connection, arrearBillId);
    if (amount > balanceAmount + 0.01) {
      await connection.rollback();
      return { status: "invalid", message: "Payment amount cannot exceed the outstanding balance." };
    }

    const [[accountRow]] = await connection.query(
      "SELECT code, name FROM chart_of_accounts WHERE code = ? LIMIT 1",
      [String(payload.paymentAccountCode || "").trim()]
    );

    if (!accountRow) {
      await connection.rollback();
      return { status: "invalid", message: "Payment account code does not exist." };
    }

    const paymentNo = await getNextArrearPaymentNo(connection);
    const fiscalYearId = await resolveFiscalYearIdForDate(paymentDate, connection);

    const [insertResult] = await connection.query(
      `
        INSERT INTO arrear_payments (
          payment_no,
          arrear_bill_id,
          payment_date,
          fiscal_year_id,
          payment_mode,
          payment_account_code,
          reference_no,
          amount,
          notes,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted')
      `,
      [
        paymentNo,
        arrearBillId,
        paymentDate,
        fiscalYearId,
        payload.paymentMode || "bank",
        accountRow.code,
        payload.referenceNo || null,
        amount,
        payload.notes || null
      ]
    );

    const payment = await createArrearPaymentJournalEntry({
      connection,
      arrearPaymentId: insertResult.insertId,
      fiscalYearId,
      paymentDate,
      arrearBillDocumentNo: bill.documentNo,
      employeeCode: bill.employeeCode,
      paymentAccountCode: accountRow.code,
      amount,
      referenceNo: payload.referenceNo || `ARPAY-${String(paymentNo).padStart(4, "0")}`,
      postedBy: payload.paidBy || "Hospital Admin"
    });

    if (!payment) {
      await connection.rollback();
      return { status: "error", message: "Payment journal failed." };
    }

    const billStatus = await updateBillStatusForPayments(connection, arrearBillId);
    await connection.commit();

    return {
      status: "posted",
      payment: await getArrearPaymentById(insertResult.insertId, connection),
      billStatus,
      paidAmount: paidAmount + amount,
      balanceAmount: Math.max(0, balanceAmount - amount)
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function reverseArrearPaymentById(id, reversedBy = "Hospital Admin") {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const payment = await getArrearPaymentById(id, connection);
    if (!payment) {
      await connection.rollback();
      return { status: "not_found" };
    }

    if (String(payment.status || "") === "reversed") {
      await connection.rollback();
      return { status: "locked", message: "Payment is already reversed." };
    }

    await reverseArrearPaymentJournalEntryByPaymentId(id, connection, reversedBy);
    await connection.query("UPDATE arrear_payments SET status = 'reversed' WHERE id = ?", [id]);
    const billStatus = await updateBillStatusForPayments(connection, payment.arrearBillId);
    await connection.commit();

    return { status: "reversed", payment: await getArrearPaymentById(id, connection), billStatus };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
