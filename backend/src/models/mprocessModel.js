import { pool } from "../config/database.js";
import { logAuditAction } from "./auditLogModel.js";

export async function ensureMprocessTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bulk_allowance_operations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      operation_type ENUM('percentage','fixed_amount') NOT NULL,
      source_wage_code VARCHAR(4) NULL,
      percentage DECIMAL(5, 2) NULL,
      fixed_amount DECIMAL(10, 2) NULL,
      target_wage_code VARCHAR(4) NOT NULL,
      bps_filter INT NULL,
      designation_filter VARCHAR(50) NULL,
      type_filter VARCHAR(20) DEFAULT 'All',
      effective_upto DATE NOT NULL,
      status ENUM('previewed','applied','cancelled') DEFAULT 'previewed',
      affected_employee_count INT DEFAULT 0,
      applied_at TIMESTAMP NULL,
      applied_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_bulk_allowance_target_wage
        FOREIGN KEY (target_wage_code) REFERENCES wage_codes(code)
        ON UPDATE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS annual_increment_runs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      increment_percentage DECIMAL(5, 2) NOT NULL,
      applies_to_wage_code VARCHAR(4) NOT NULL,
      effective_date DATE NOT NULL,
      status ENUM('previewed','applied','cancelled') DEFAULT 'previewed',
      affected_employee_count INT DEFAULT 0,
      total_increment_amount DECIMAL(14, 2) DEFAULT 0,
      applied_at TIMESTAMP NULL,
      applied_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_annual_increment_wage
        FOREIGN KEY (applies_to_wage_code) REFERENCES wage_codes(code)
        ON UPDATE CASCADE
    )
  `);
}

const normalizeWageCode = (value) => String(value || "").replace(/\D/g, "").padStart(4, "0").slice(-4);
const typeClause = (type) => {
  if (!type || type === "All") return { sql: "", params: [] };
  return { sql: "AND e.service_type = ?", params: [type] };
};

async function getWageDescription(connection, wageCode) {
  const [[row]] = await connection.query("SELECT description FROM wage_codes WHERE code = ? LIMIT 1", [wageCode]);
  return row?.description || "";
}

async function upsertEmployeeAllowance(connection, { employeeId, wageCode, description, amount, upto }) {
  const [[existing]] = await connection.query(
    `
      SELECT id
      FROM employee_allowances
      WHERE employee_id = ?
        AND LPAD(allowance_code, 4, '0') = ?
      ORDER BY id DESC
      LIMIT 1
    `,
    [employeeId, wageCode]
  );

  if (existing) {
    await connection.query(
      `
        UPDATE employee_allowances
        SET allowance_code = ?, description = ?, amount = ?, upto = ?
        WHERE id = ?
      `,
      [wageCode, description, amount, upto, existing.id]
    );
    return;
  }

  const [[srRow]] = await connection.query(
    "SELECT COALESCE(MAX(sr_no), 0) + 1 AS nextSrNo FROM employee_allowances WHERE employee_id = ?",
    [employeeId]
  );

  await connection.query(
    `
      INSERT INTO employee_allowances (employee_id, sr_no, allowance_code, description, amount, upto)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [employeeId, srRow.nextSrNo || 1, wageCode, description, amount, upto]
  );
}

export async function previewPercentAllowance({ sourceWageCode, percentage, targetWageCode, bps = "99", type = "All", effectiveUpto }, connection = pool) {
  const sourceCode = normalizeWageCode(sourceWageCode);
  const targetCode = normalizeWageCode(targetWageCode);
  const { sql: serviceSql, params: serviceParams } = typeClause(type);
  const bpsSql = String(bps || "99") === "99" ? "" : "AND CAST(e.bps AS UNSIGNED) = ?";
  const params = [sourceCode, ...(bpsSql ? [Number(bps)] : []), ...serviceParams];

  const [rows] = await connection.query(
    `
      SELECT
        e.id AS employeeId,
        e.employee_no AS employeeCode,
        e.name,
        e.bps,
        e.service_type AS serviceType,
        ea.amount AS sourceAmount
      FROM employees e
      INNER JOIN employee_allowances ea ON ea.employee_id = e.id
      WHERE COALESCE(e.status, 'active') = 'active'
        AND (e.stop_date IS NULL OR e.stop_date > CURDATE())
        AND LPAD(ea.allowance_code, 4, '0') = ?
        AND (ea.upto IS NULL OR ea.upto >= CURDATE())
        ${bpsSql}
        ${serviceSql}
      ORDER BY CAST(e.employee_no AS UNSIGNED), e.employee_no
    `,
    params
  );

  const items = rows.map((row) => {
    const sourceAmount = Number(row.sourceAmount || 0);
    const calculatedNewAmount = Number((sourceAmount * (Number(percentage || 0) / 100)).toFixed(2));
    return {
      employeeId: row.employeeId,
      employeeCode: row.employeeCode,
      name: row.name,
      bps: row.bps,
      serviceType: row.serviceType,
      sourceAmount,
      calculatedNewAmount,
      targetWageCode: targetCode
    };
  });

  return {
    items,
    count: items.length,
    grandTotal: items.reduce((total, item) => total + item.calculatedNewAmount, 0),
    filters: { sourceWageCode: sourceCode, percentage: Number(percentage || 0), targetWageCode: targetCode, bps: String(bps || "99"), type, effectiveUpto }
  };
}

export async function applyPercentAllowance(payload, appliedBy = "Hospital Admin") {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const preview = await previewPercentAllowance(payload, connection);
    const description = await getWageDescription(connection, preview.filters.targetWageCode);

    for (const item of preview.items) {
      await upsertEmployeeAllowance(connection, {
        employeeId: item.employeeId,
        wageCode: preview.filters.targetWageCode,
        description,
        amount: item.calculatedNewAmount,
        upto: preview.filters.effectiveUpto
      });
    }

    const [result] = await connection.query(
      `
        INSERT INTO bulk_allowance_operations (
          operation_type, source_wage_code, percentage, target_wage_code,
          bps_filter, type_filter, effective_upto, status,
          affected_employee_count, applied_at, applied_by
        ) VALUES ('percentage', ?, ?, ?, ?, ?, ?, 'applied', ?, CURRENT_TIMESTAMP, ?)
      `,
      [
        preview.filters.sourceWageCode,
        preview.filters.percentage,
        preview.filters.targetWageCode,
        preview.filters.bps === "99" ? null : Number(preview.filters.bps),
        preview.filters.type || "All",
        preview.filters.effectiveUpto,
        preview.count,
        appliedBy
      ]
    );

    await logAuditAction({
      action: "apply",
      documentType: "mprocess",
      documentNo: result.insertId,
      performedBy: appliedBy,
      notes: `Applied ${preview.filters.percentage}% allowance ${preview.filters.targetWageCode} to ${preview.count} employees.`
    });

    await connection.commit();
    return { ...preview, operationId: result.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function previewFixedAllowance({ amount, targetWageCode, designationCode = "999", type = "All", effectiveUpto }, connection = pool) {
  const targetCode = normalizeWageCode(targetWageCode);
  const { sql: serviceSql, params: serviceParams } = typeClause(type);
  const designationSql = String(designationCode || "999") === "999" ? "" : "AND e.designation_code = ?";
  const fixedAmount = Number(amount || 0);
  const params = [...(designationSql ? [String(designationCode)] : []), ...serviceParams];

  const [rows] = await connection.query(
    `
      SELECT
        e.id AS employeeId,
        e.employee_no AS employeeCode,
        e.name,
        e.designation,
        e.designation_code AS designationCode,
        e.service_type AS serviceType
      FROM employees e
      WHERE COALESCE(e.status, 'active') = 'active'
        AND (e.stop_date IS NULL OR e.stop_date > CURDATE())
        ${designationSql}
        ${serviceSql}
      ORDER BY CAST(e.employee_no AS UNSIGNED), e.employee_no
    `,
    params
  );

  const items = rows.map((row) => ({
    employeeId: row.employeeId,
    employeeCode: row.employeeCode,
    name: row.name,
    designation: row.designation,
    designationCode: row.designationCode,
    serviceType: row.serviceType,
    fixedAmount,
    targetWageCode: targetCode
  }));

  return {
    items,
    count: items.length,
    grandTotal: fixedAmount * items.length,
    filters: { amount: fixedAmount, targetWageCode: targetCode, designationCode: String(designationCode || "999"), type, effectiveUpto }
  };
}

export async function applyFixedAllowance(payload, appliedBy = "Hospital Admin") {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const preview = await previewFixedAllowance(payload, connection);
    const description = await getWageDescription(connection, preview.filters.targetWageCode);

    for (const item of preview.items) {
      await upsertEmployeeAllowance(connection, {
        employeeId: item.employeeId,
        wageCode: preview.filters.targetWageCode,
        description,
        amount: item.fixedAmount,
        upto: preview.filters.effectiveUpto
      });
    }

    const [result] = await connection.query(
      `
        INSERT INTO bulk_allowance_operations (
          operation_type, fixed_amount, target_wage_code, designation_filter,
          type_filter, effective_upto, status, affected_employee_count,
          applied_at, applied_by
        ) VALUES ('fixed_amount', ?, ?, ?, ?, ?, 'applied', ?, CURRENT_TIMESTAMP, ?)
      `,
      [
        preview.filters.amount,
        preview.filters.targetWageCode,
        preview.filters.designationCode === "999" ? null : preview.filters.designationCode,
        preview.filters.type || "All",
        preview.filters.effectiveUpto,
        preview.count,
        appliedBy
      ]
    );

    await logAuditAction({
      action: "apply",
      documentType: "mprocess",
      documentNo: result.insertId,
      performedBy: appliedBy,
      notes: `Applied fixed allowance ${preview.filters.targetWageCode} to ${preview.count} employees.`
    });

    await connection.commit();
    return { ...preview, operationId: result.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function previewAnnualIncrement({ incrementPercentage, appliesToWageCode, effectiveDate }, connection = pool) {
  const wageCode = normalizeWageCode(appliesToWageCode);

  const [rows] = await connection.query(
    `
      SELECT
        e.id AS employeeId,
        e.employee_no AS employeeCode,
        e.name,
        e.bps,
        ea.id AS allowanceId,
        ea.amount AS currentBasicPay
      FROM employees e
      INNER JOIN employee_allowances ea ON ea.employee_id = e.id
      WHERE COALESCE(e.status, 'active') = 'active'
        AND (e.stop_date IS NULL OR e.stop_date > CURDATE())
        AND LPAD(ea.allowance_code, 4, '0') = ?
        AND (ea.upto IS NULL OR ea.upto >= CURDATE())
      ORDER BY CAST(e.employee_no AS UNSIGNED), e.employee_no
    `,
    [wageCode]
  );

  const percentage = Number(incrementPercentage || 0);
  const items = rows.map((row) => {
    const currentBasicPay = Number(row.currentBasicPay || 0);
    const incrementAmount = Number((currentBasicPay * (percentage / 100)).toFixed(2));
    const newBasicPay = Number((currentBasicPay + incrementAmount).toFixed(2));
    return {
      employeeId: row.employeeId,
      employeeCode: row.employeeCode,
      name: row.name,
      bps: row.bps,
      allowanceId: row.allowanceId,
      currentBasicPay,
      newBasicPay,
      incrementAmount
    };
  });

  return {
    items,
    count: items.length,
    totalCurrentBasicPay: items.reduce((total, item) => total + item.currentBasicPay, 0),
    totalNewBasicPay: items.reduce((total, item) => total + item.newBasicPay, 0),
    totalIncrementAmount: items.reduce((total, item) => total + item.incrementAmount, 0),
    filters: { incrementPercentage: percentage, appliesToWageCode: wageCode, effectiveDate }
  };
}

export async function applyAnnualIncrement(payload, appliedBy = "Hospital Admin") {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const preview = await previewAnnualIncrement(payload, connection);

    for (const item of preview.items) {
      await connection.query("UPDATE employee_allowances SET amount = ? WHERE id = ?", [
        item.newBasicPay,
        item.allowanceId
      ]);
    }

    const [result] = await connection.query(
      `
        INSERT INTO annual_increment_runs (
          increment_percentage, applies_to_wage_code, effective_date, status,
          affected_employee_count, total_increment_amount, applied_at, applied_by
        ) VALUES (?, ?, ?, 'applied', ?, ?, CURRENT_TIMESTAMP, ?)
      `,
      [
        preview.filters.incrementPercentage,
        preview.filters.appliesToWageCode,
        preview.filters.effectiveDate,
        preview.count,
        preview.totalIncrementAmount,
        appliedBy
      ]
    );

    await logAuditAction({
      action: "apply",
      documentType: "mprocess",
      documentNo: result.insertId,
      performedBy: appliedBy,
      notes: `Applied ${preview.filters.incrementPercentage}% annual increment to ${preview.count} employees.`
    });

    await connection.commit();
    return { ...preview, runId: result.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
