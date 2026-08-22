import { pool } from "../config/database.js";

function toNull(value) {
  return value === "" || value === undefined ? null : value;
}

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export async function ensureEmployeeAdvanceTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_advances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      advance_no INT NOT NULL UNIQUE,
      employee_code VARCHAR(50) NOT NULL,
      issue_date DATE NOT NULL,
      advance_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
      monthly_installment DECIMAL(14, 2) NOT NULL DEFAULT 0,
      deduction_mode ENUM('full','percent','fixed','hold') NOT NULL DEFAULT 'full',
      deduction_value DECIMAL(14, 2) NULL,
      balance_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
      status ENUM('active','closed','void') NOT NULL DEFAULT 'active',
      notes VARCHAR(255) NULL,
      created_by VARCHAR(100) NULL,
      updated_by VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_employee_advances_employee
        FOREIGN KEY (employee_code) REFERENCES employees(employee_no)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_advance_recoveries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_advance_id INT NOT NULL,
      payroll_run_id INT NULL,
      payroll_run_item_id INT NULL,
      employee_code VARCHAR(50) NOT NULL,
      recovery_month INT NOT NULL,
      recovery_year INT NOT NULL,
      amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
      status ENUM('posted','reversed') NOT NULL DEFAULT 'posted',
      created_by VARCHAR(100) NULL,
      reversed_by VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reversed_at TIMESTAMP NULL,
      CONSTRAINT fk_advance_recovery_advance
        FOREIGN KEY (employee_advance_id) REFERENCES employee_advances(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_advance_recovery_payroll_run
        FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id)
        ON DELETE SET NULL,
      CONSTRAINT fk_advance_recovery_payroll_item
        FOREIGN KEY (payroll_run_item_id) REFERENCES payroll_run_items(id)
        ON DELETE SET NULL,
      UNIQUE KEY uniq_advance_recovery_item (employee_advance_id, payroll_run_item_id)
    )
  `);
}

export async function getNextEmployeeAdvanceNo(connection = pool) {
  const [[row]] = await connection.query(
    "SELECT COALESCE(MAX(advance_no), 0) AS maxAdvanceNo FROM employee_advances"
  );
  return Number(row?.maxAdvanceNo || 0) + 1;
}

export async function getEmployeeAdvances({ employeeCode = "", status = "" } = {}, connection = pool) {
  const where = [];
  const params = [];

  if (employeeCode) {
    where.push("ea.employee_code = ?");
    params.push(String(employeeCode));
  }

  if (status) {
    where.push("ea.status = ?");
    params.push(String(status));
  }

  const [rows] = await connection.query(
    `
      SELECT
        ea.id,
        ea.advance_no AS advanceNo,
        ea.employee_code AS employeeCode,
        e.name AS employeeName,
        e.department AS employeeDepartment,
        e.designation AS employeeDesignation,
        ea.issue_date AS issueDate,
        ea.advance_amount AS advanceAmount,
        ea.monthly_installment AS monthlyInstallment,
        ea.deduction_mode AS deductionMode,
        ea.deduction_value AS deductionValue,
        ea.balance_amount AS balanceAmount,
        ea.status,
        ea.notes,
        ea.created_by AS createdBy,
        ea.updated_by AS updatedBy,
        ea.created_at AS createdAt,
        ea.updated_at AS updatedAt
      FROM employee_advances ea
      LEFT JOIN employees e ON e.employee_no = ea.employee_code
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY ea.status = 'active' DESC, ea.issue_date DESC, ea.id DESC
    `,
    params
  );

  return rows;
}

export async function getEmployeeAdvanceById(id, connection = pool) {
  const [[row]] = await connection.query(
    `
      SELECT
        ea.id,
        ea.advance_no AS advanceNo,
        ea.employee_code AS employeeCode,
        e.name AS employeeName,
        e.department AS employeeDepartment,
        e.designation AS employeeDesignation,
        ea.issue_date AS issueDate,
        ea.advance_amount AS advanceAmount,
        ea.monthly_installment AS monthlyInstallment,
        ea.deduction_mode AS deductionMode,
        ea.deduction_value AS deductionValue,
        ea.balance_amount AS balanceAmount,
        ea.status,
        ea.notes,
        ea.created_by AS createdBy,
        ea.updated_by AS updatedBy,
        ea.created_at AS createdAt,
        ea.updated_at AS updatedAt
      FROM employee_advances ea
      LEFT JOIN employees e ON e.employee_no = ea.employee_code
      WHERE ea.id = ?
      LIMIT 1
    `,
    [id]
  );

  return row || null;
}

export async function createEmployeeAdvance(payload, connection = pool) {
  const advanceNo = await getNextEmployeeAdvanceNo(connection);
  const advanceAmount = roundCurrency(payload.advanceAmount);
  const monthlyInstallment = roundCurrency(payload.monthlyInstallment);
  const deductionMode = ["full", "percent", "fixed", "hold"].includes(payload.deductionMode) ? payload.deductionMode : "full";
  const deductionValue = payload.deductionValue === "" || payload.deductionValue === null || payload.deductionValue === undefined
    ? null
    : roundCurrency(payload.deductionValue);
  const balanceAmount = payload.balanceAmount === "" || payload.balanceAmount === null || payload.balanceAmount === undefined
    ? advanceAmount
    : roundCurrency(payload.balanceAmount);

  const [result] = await connection.query(
    `
      INSERT INTO employee_advances (
        advance_no,
        employee_code,
        issue_date,
        advance_amount,
        monthly_installment,
        deduction_mode,
        deduction_value,
        balance_amount,
        status,
        notes,
        created_by,
        updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      advanceNo,
      String(payload.employeeCode),
      payload.issueDate,
      advanceAmount,
      monthlyInstallment,
      deductionMode,
      deductionValue,
      balanceAmount,
      payload.status || "active",
      toNull(payload.notes),
      toNull(payload.createdBy),
      toNull(payload.updatedBy)
    ]
  );

  return result.insertId;
}

export async function updateEmployeeAdvanceById(id, payload, connection = pool) {
  const deductionMode = ["full", "percent", "fixed", "hold"].includes(payload.deductionMode) ? payload.deductionMode : "full";
  const deductionValue = payload.deductionValue === "" || payload.deductionValue === null || payload.deductionValue === undefined
    ? null
    : roundCurrency(payload.deductionValue);

  const [result] = await connection.query(
    `
      UPDATE employee_advances
      SET employee_code = ?,
          issue_date = ?,
          advance_amount = ?,
          monthly_installment = ?,
          deduction_mode = ?,
          deduction_value = ?,
          balance_amount = ?,
          status = ?,
          notes = ?,
          updated_by = ?
      WHERE id = ?
    `,
    [
      String(payload.employeeCode),
      payload.issueDate,
      roundCurrency(payload.advanceAmount),
      roundCurrency(payload.monthlyInstallment),
      deductionMode,
      deductionValue,
      roundCurrency(payload.balanceAmount),
      payload.status || "active",
      toNull(payload.notes),
      toNull(payload.updatedBy),
      id
    ]
  );

  return result.affectedRows;
}

export async function closeEmployeeAdvanceById(id, closedBy = "Hospital Admin", connection = pool) {
  const [result] = await connection.query(
    `
      UPDATE employee_advances
      SET status = 'closed',
          balance_amount = 0,
          updated_by = ?
      WHERE id = ?
    `,
    [closedBy, id]
  );

  return result.affectedRows;
}

export async function deleteEmployeeAdvanceById(id, connection = pool) {
  const [result] = await connection.query("DELETE FROM employee_advances WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function getEmployeeAdvanceRecoveryPlan({ employeeCode, paymentMonth, paymentYear, connection = pool }) {
  const [rows] = await connection.query(
    `
      SELECT
        ea.id,
        ea.advance_no AS advanceNo,
        ea.employee_code AS employeeCode,
        ea.monthly_installment AS monthlyInstallment,
        ea.deduction_mode AS deductionMode,
        ea.deduction_value AS deductionValue,
        ea.balance_amount AS balanceAmount,
        ea.status
      FROM employee_advances ea
      WHERE ea.employee_code = ?
        AND ea.status = 'active'
        AND ea.balance_amount > 0
      ORDER BY ea.issue_date ASC, ea.id ASC
    `,
    [String(employeeCode)]
  );

  const recoveries = rows.map((row) => {
    const balanceAmount = roundCurrency(row.balanceAmount);
    const baseInstallment = roundCurrency(row.monthlyInstallment || balanceAmount);
    let amount = 0;

    if (row.deductionMode === "hold") {
      amount = 0;
    } else if (row.deductionMode === "fixed") {
      amount = roundCurrency(row.deductionValue || 0);
    } else if (row.deductionMode === "percent") {
      amount = roundCurrency(baseInstallment * (Number(row.deductionValue || 0) / 100));
    } else {
      amount = baseInstallment;
    }

    amount = Math.min(balanceAmount, Math.max(0, amount));

    return {
      advanceId: row.id,
      advanceNo: row.advanceNo,
      employeeCode: row.employeeCode,
      amount,
      description: `SALARY ADVANCE RECOVERY #${row.advanceNo}`,
      wageCode: "4002",
      numericCode: 4002,
      status: row.status,
      paymentMonth: Number(paymentMonth),
      paymentYear: Number(paymentYear)
    };
  }).filter((row) => row.amount > 0);

  return {
    recoveries,
    totalRecovery: roundCurrency(recoveries.reduce((sum, row) => sum + Number(row.amount || 0), 0))
  };
}

export async function recordEmployeeAdvanceRecoveries({
  connection = pool,
  payrollRunId,
  payrollRunItemId,
  employeeCode,
  paymentMonth,
  paymentYear,
  recoveries = [],
  createdBy = "Hospital Admin"
}) {
  if (!recoveries.length) {
    return { totalRecovery: 0, recoveryRows: [] };
  }

  const recoveryRows = [];

  for (const recovery of recoveries) {
    const amount = roundCurrency(recovery.amount);
    if (!amount) {
      continue;
    }

    const [result] = await connection.query(
      `
        INSERT INTO employee_advance_recoveries (
          employee_advance_id,
          payroll_run_id,
          payroll_run_item_id,
          employee_code,
          recovery_month,
          recovery_year,
          amount,
          status,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'posted', ?)
      `,
      [
        recovery.advanceId,
        payrollRunId || null,
        payrollRunItemId || null,
        String(employeeCode),
        Number(paymentMonth),
        Number(paymentYear),
        amount,
        createdBy
      ]
    );

    await connection.query(
      `
        UPDATE employee_advances
        SET balance_amount = GREATEST(0, balance_amount - ?),
            status = CASE WHEN balance_amount - ? <= 0 THEN 'closed' ELSE 'active' END,
            updated_by = ?
        WHERE id = ?
      `,
      [amount, amount, createdBy, recovery.advanceId]
    );

    recoveryRows.push({
      id: result.insertId,
      advanceId: recovery.advanceId,
      amount
    });
  }

  return {
    totalRecovery: roundCurrency(recoveryRows.reduce((sum, row) => sum + Number(row.amount || 0), 0)),
    recoveryRows
  };
}

export async function reverseEmployeeAdvanceRecoveriesByRun(payrollRunId, reversedBy = "Hospital Admin", connection = pool) {
  if (!payrollRunId) {
    return { reversedCount: 0, totalReversed: 0 };
  }

  const [rows] = await connection.query(
    `
      SELECT
        ear.id,
        ear.employee_advance_id AS advanceId,
        ear.amount
      FROM employee_advance_recoveries ear
      WHERE ear.payroll_run_id = ?
        AND ear.status = 'posted'
    `,
    [payrollRunId]
  );

  let totalReversed = 0;

  for (const row of rows) {
    const amount = roundCurrency(row.amount);
    totalReversed += amount;
    await connection.query(
      `
        UPDATE employee_advances
        SET balance_amount = balance_amount + ?,
            status = 'active',
            updated_by = ?
        WHERE id = ?
      `,
      [amount, reversedBy, row.advanceId]
    );
  }

  if (rows.length) {
    await connection.query(
      `
        UPDATE employee_advance_recoveries
        SET status = 'reversed',
            reversed_by = ?,
            reversed_at = CURRENT_TIMESTAMP
        WHERE payroll_run_id = ?
          AND status = 'posted'
      `,
      [reversedBy, payrollRunId]
    );
  }

  return {
    reversedCount: rows.length,
    totalReversed: roundCurrency(totalReversed)
  };
}
