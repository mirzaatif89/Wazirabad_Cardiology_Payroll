import { env } from "../config/env.js";
import { pool } from "../config/database.js";

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function journalDate(paymentMonth, paymentYear) {
  const year = Number(paymentYear);
  const month = Number(paymentMonth);
  return `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
}

function getSalaryPayableAccountCode() {
  return String(env.payrollLedgerDefaults?.salaryPayableAccountCode || "L03001").trim();
}

async function ensureSalaryPayableAccount(connection = pool) {
  const accountCode = getSalaryPayableAccountCode();
  await connection.query(
    `
      INSERT INTO chart_of_accounts (code, name)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `,
    [accountCode, "SALARY PAYABLE"]
  );
  return accountCode;
}

export async function ensureJournalTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      source_type VARCHAR(50) NOT NULL,
      source_id INT NOT NULL,
      payroll_run_id INT NULL,
      fiscal_year_id INT NULL,
      entry_date DATE NOT NULL,
      reference_no VARCHAR(120) NOT NULL,
      description VARCHAR(255) NOT NULL,
      total_debit DECIMAL(14, 2) NOT NULL DEFAULT 0,
      total_credit DECIMAL(14, 2) NOT NULL DEFAULT 0,
      status ENUM('posted', 'reversed') NOT NULL DEFAULT 'posted',
      posted_by VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_journal_source (source_type, source_id),
      UNIQUE KEY uniq_journal_run (payroll_run_id),
      CONSTRAINT fk_journal_payroll_run
        FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_journal_fiscal_year
        FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
        ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS journal_entry_lines (
      id INT AUTO_INCREMENT PRIMARY KEY,
      journal_entry_id INT NOT NULL,
      line_no INT NOT NULL,
      account_code VARCHAR(20) NOT NULL,
      description VARCHAR(150) NOT NULL,
      employee_code VARCHAR(50) NULL,
      wage_code VARCHAR(4) NULL,
      debit DECIMAL(14, 2) NOT NULL DEFAULT 0,
      credit DECIMAL(14, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_journal_lines_entry
        FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_journal_lines_account
        FOREIGN KEY (account_code) REFERENCES chart_of_accounts(code)
        ON UPDATE CASCADE
    )
  `);

  await ensureSalaryPayableAccount(pool);
}

function buildJournalLine({
  accountCode,
  description,
  employeeCode = null,
  wageCode = null,
  debit = 0,
  credit = 0
}) {
  return {
    accountCode: String(accountCode || "").trim(),
    description: String(description || "").trim(),
    employeeCode: employeeCode ? String(employeeCode) : null,
    wageCode: wageCode ? String(wageCode) : null,
    debit: roundCurrency(debit),
    credit: roundCurrency(credit)
  };
}

export async function createPayrollJournalEntry({
  connection = pool,
  payrollRunId,
  fiscalYearId = null,
  paymentMonth,
  paymentYear,
  deptCode = "999",
  processedBy = "Hospital Admin",
  employees = []
}) {
  if (!payrollRunId) {
    return null;
  }

  const [existingRows] = await connection.query(
    "SELECT id FROM journal_entries WHERE payroll_run_id = ? LIMIT 1",
    [payrollRunId]
  );

  if (existingRows.length) {
    await connection.query("DELETE FROM journal_entries WHERE id = ?", [existingRows[0].id]);
  }

  const salaryPayableAccountCode = await ensureSalaryPayableAccount(connection);
  const lines = [];

  for (const employee of employees) {
    const detailLines = Array.isArray(employee.details) ? employee.details : Array.isArray(employee.lineItems) ? employee.lineItems : [];

    for (const detail of detailLines) {
      const amount = Math.abs(Number(detail.amount || 0));
      const accountCode = String(detail.attachedAccountCode || "").trim();

      if (!accountCode || !amount) {
        continue;
      }

      const isDebit = Number(detail.numericCode || 0) >= 1 && Number(detail.numericCode || 0) <= 3999;
      lines.push(
        buildJournalLine({
          accountCode,
          description: detail.description || detail.wageCode || "Payroll line",
          employeeCode: employee.employeeCode,
          wageCode: detail.wageCode,
          debit: isDebit ? amount : 0,
          credit: isDebit ? 0 : amount
        })
      );
    }

    const netPay = Math.abs(Number(employee.netPay || 0));

    if (netPay) {
      lines.push(
        buildJournalLine({
          accountCode: salaryPayableAccountCode,
          description: "Net salary payable",
          employeeCode: employee.employeeCode,
          debit: 0,
          credit: netPay
        })
      );
    }
  }

  const totalDebit = roundCurrency(lines.reduce((sum, line) => sum + Number(line.debit || 0), 0));
  const totalCredit = roundCurrency(lines.reduce((sum, line) => sum + Number(line.credit || 0), 0));

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Payroll journal is not balanced: debit ${totalDebit} vs credit ${totalCredit}.`);
  }

  const [entryResult] = await connection.query(
    `
      INSERT INTO journal_entries (
        source_type,
        source_id,
        payroll_run_id,
        fiscal_year_id,
        entry_date,
        reference_no,
        description,
        total_debit,
        total_credit,
        status,
        posted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted', ?)
    `,
    [
      "payroll_run",
      payrollRunId,
      payrollRunId,
      fiscalYearId || null,
      journalDate(paymentMonth, paymentYear),
      `PAYROLL-${paymentYear}${String(paymentMonth).padStart(2, "0")}-${String(deptCode || "999")}`,
      `Payroll accrual for ${String(paymentMonth).padStart(2, "0")}/${paymentYear} department ${String(deptCode || "999")}`,
      totalDebit,
      totalCredit,
      processedBy
    ]
  );

  if (lines.length) {
    await connection.query(
      `
        INSERT INTO journal_entry_lines (
          journal_entry_id,
          line_no,
          account_code,
          description,
          employee_code,
          wage_code,
          debit,
          credit
        ) VALUES ?
      `,
      [
        lines.map((line, index) => [
          entryResult.insertId,
          index + 1,
          line.accountCode,
          line.description,
          line.employeeCode,
          line.wageCode,
          line.debit,
          line.credit
        ])
      ]
    );
  }

  return getJournalEntryByPayrollRun(payrollRunId, connection);
}

export async function getJournalEntryByPayrollRun(payrollRunId, connection = pool) {
  const [[entry]] = await connection.query(
    `
      SELECT
        je.id,
        je.source_type AS sourceType,
        je.source_id AS sourceId,
        je.payroll_run_id AS payrollRunId,
        je.fiscal_year_id AS fiscalYearId,
        je.entry_date AS entryDate,
        je.reference_no AS referenceNo,
        je.description,
        je.total_debit AS totalDebit,
        je.total_credit AS totalCredit,
        je.status,
        je.posted_by AS postedBy,
        je.created_at AS createdAt,
        je.updated_at AS updatedAt
      FROM journal_entries je
      WHERE je.payroll_run_id = ?
      LIMIT 1
    `,
    [payrollRunId]
  );

  if (!entry) {
    return null;
  }

  const [lines] = await connection.query(
    `
      SELECT
        jel.id,
        jel.line_no AS lineNo,
        jel.account_code AS accountCode,
        coa.name AS accountName,
        jel.description,
        jel.employee_code AS employeeCode,
        jel.wage_code AS wageCode,
        jel.debit,
        jel.credit
      FROM journal_entry_lines jel
      INNER JOIN chart_of_accounts coa ON coa.code = jel.account_code
      WHERE jel.journal_entry_id = ?
      ORDER BY jel.line_no ASC, jel.id ASC
    `,
    [entry.id]
  );

  return { ...entry, lines };
}

async function getJournalEntryById(entryId, connection = pool) {
  const [[entry]] = await connection.query(
    `
      SELECT
        je.id,
        je.source_type AS sourceType,
        je.source_id AS sourceId,
        je.payroll_run_id AS payrollRunId,
        je.fiscal_year_id AS fiscalYearId,
        je.entry_date AS entryDate,
        je.reference_no AS referenceNo,
        je.description,
        je.total_debit AS totalDebit,
        je.total_credit AS totalCredit,
        je.status,
        je.posted_by AS postedBy,
        je.created_at AS createdAt,
        je.updated_at AS updatedAt
      FROM journal_entries je
      WHERE je.id = ?
      LIMIT 1
    `,
    [entryId]
  );

  if (!entry) {
    return null;
  }

  const [lines] = await connection.query(
    `
      SELECT
        jel.id,
        jel.line_no AS lineNo,
        jel.account_code AS accountCode,
        coa.name AS accountName,
        jel.description,
        jel.employee_code AS employeeCode,
        jel.wage_code AS wageCode,
        jel.debit,
        jel.credit
      FROM journal_entry_lines jel
      INNER JOIN chart_of_accounts coa ON coa.code = jel.account_code
      WHERE jel.journal_entry_id = ?
      ORDER BY jel.line_no ASC, jel.id ASC
    `,
    [entry.id]
  );

  return { ...entry, lines };
}

export async function reversePayrollJournalEntryByRun(payrollRunId, connection = pool, reversedBy = "Hospital Admin") {
  const entry = await getJournalEntryByPayrollRun(payrollRunId, connection);
  if (!entry) {
    return null;
  }

  if (String(entry.status || "").toLowerCase() === "reversed") {
    return entry;
  }

  const reversalLines = (entry.lines || []).map((line) =>
    buildJournalLine({
      accountCode: line.accountCode,
      description: `Reversal of ${line.description || entry.referenceNo}`,
      employeeCode: line.employeeCode,
      wageCode: line.wageCode,
      debit: line.credit,
      credit: line.debit
    })
  );

  const totalDebit = roundCurrency(reversalLines.reduce((sum, line) => sum + Number(line.debit || 0), 0));
  const totalCredit = roundCurrency(reversalLines.reduce((sum, line) => sum + Number(line.credit || 0), 0));

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Payroll reversal is not balanced: debit ${totalDebit} vs credit ${totalCredit}.`);
  }

  const [reversalResult] = await connection.query(
    `
      INSERT INTO journal_entries (
        source_type,
        source_id,
        payroll_run_id,
        fiscal_year_id,
        entry_date,
        reference_no,
        description,
        total_debit,
        total_credit,
        status,
        posted_by
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, 'posted', ?)
    `,
    [
      "payroll_run_reversal",
      entry.id,
      entry.fiscalYearId || null,
      entry.entryDate,
      `${entry.referenceNo}-REV`,
      `Reversal of ${entry.description || entry.referenceNo}`,
      totalDebit,
      totalCredit,
      reversedBy
    ]
  );

  if (reversalLines.length) {
    await connection.query(
      `
        INSERT INTO journal_entry_lines (
          journal_entry_id,
          line_no,
          account_code,
          description,
          employee_code,
          wage_code,
          debit,
          credit
        ) VALUES ?
      `,
      [
        reversalLines.map((line, index) => [
          reversalResult.insertId,
          index + 1,
          line.accountCode,
          line.description,
          line.employeeCode,
          line.wageCode,
          line.debit,
          line.credit
        ])
      ]
    );
  }

  await connection.query(
    "UPDATE journal_entries SET status = 'reversed', payroll_run_id = NULL WHERE id = ?",
    [entry.id]
  );

  return getJournalEntryById(reversalResult.insertId, connection);
}
